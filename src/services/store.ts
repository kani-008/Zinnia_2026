import { 
  Team, 
  TeamMember, 
  Participant, 
  EventMission, 
  AttendanceRecord, 
  EventRegistration,
  PrizePosition,
  EventType
} from '../types';
import { OFFICIAL_MISSIONS } from '../config/events';
import { generateTeamId, generateMemberId } from '../utils/participant-id';
import { supabase, isSupabaseConfigured, isRealtimeEnabled } from '../lib/supabase';
import { REGISTRATION_FEE_PER_HEAD } from '../config/site';

const STORAGE_KEYS = {
  TEAMS: 'zin26_live_teams_v2',
  MEMBERS: 'zin26_live_members_v2',
  EVENTS: 'zin26_live_events_v6',
  REGISTRATIONS: 'zin26_live_registrations_v2',
  ATTENDANCE: 'zin26_live_attendance_v2',
  CURRENT_TEAM: 'zin26_current_team_v2'
};

class ZinniaStore {
  private listeners: Set<() => void> = new Set();
  private isSyncing = false;
  private realTimeChannel: any = null;

  constructor() {
    this.cleanLegacyStorage();
    this.syncFromSupabase();
    this.setupRealtimeSubscription();
  }

  private cleanLegacyStorage() {
    try {
      [
        'zin26_participants_v3',
        'zin26_attendance_v3',
        'zin26_registrations_v3',
        'zin26_live_participants_v1',
        'zin26_live_events_v2',
        'zin26_live_events_v3',
        'zin26_live_events_v4',
        'zin26_live_events_v5',
        'zin26_live_hand_bands_v2'
      ].forEach(k => {
        localStorage.removeItem(k);
      });
    } catch {}
  }

  private async fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
    const method = init?.method || 'GET';
    let bodyPreview = '';
    try {
      if (init?.body && typeof init.body === 'string') {
        bodyPreview = JSON.parse(init.body);
      }
    } catch {}

    console.log(`[Store HTTP Request] 🌐 ${method} ${url}`, bodyPreview || init?.body || '');
    try {
      const res = await fetch(url, init);
      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        data = { success: res.ok, message: text };
      }
      console.log(`[Store HTTP Response] 📥 ${res.status} ${url}:`, data);
      return data as T;
    } catch (err: any) {
      console.error(`[Store HTTP Error] ❌ ${method} ${url}:`, err);
      throw err;
    }
  }

  private setupRealtimeSubscription() {
    if (!isRealtimeEnabled()) return;
    try {
      if (this.realTimeChannel) {
        try {
          supabase.removeChannel(this.realTimeChannel);
        } catch {}
        this.realTimeChannel = null;
      }

      const channelName = `schema-db-changes-${Math.random().toString(36).substring(2, 7)}`;
      this.realTimeChannel = supabase
        .channel(channelName)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => this.syncFromSupabase())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, () => this.syncFromSupabase())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => this.syncFromSupabase())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'event_registrations' }, () => this.syncFromSupabase())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'team_payments' }, () => this.syncFromSupabase())
        .subscribe();
    } catch (err) {
      console.warn('Realtime subscription error:', err);
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifySubscribers(): void {
    this.listeners.forEach(fn => {
      try { fn(); } catch (e) { console.error('Store listener error:', e); }
    });
  }

  // --- SYNC FROM SUPABASE ---
  async syncFromSupabase(): Promise<void> {
    if (!isSupabaseConfigured() || this.isSyncing) return;
    this.isSyncing = true;

    try {
      // 1. Fetch live teams
      const { data: dbTeams, error: tErr } = await supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false });

      // 2. Fetch live team members
      const { data: dbMembers, error: mErr } = await supabase
        .from('team_members')
        .select('*')
        .order('created_at', { ascending: true });

      const localTeams = this.getStorage<Team[]>(STORAGE_KEYS.TEAMS, []);
      const localMembers = this.getStorage<TeamMember[]>(STORAGE_KEYS.MEMBERS, []);

      let mergedTeams = [...localTeams];
      if (!tErr && dbTeams) {
        dbTeams.forEach((dt: any) => {
          const idx = mergedTeams.findIndex(lt => lt.team_id === dt.team_id);
          const formatted: Team = {
            team_id: dt.team_id,
            team_name: dt.team_name,
            college: dt.college,
            department: dt.department,
            year: dt.year,
            registered_events: dt.registered_events || [],
            payment: dt.payment || false,
            payment_status: dt.payment_status || (dt.payment ? 'VERIFIED' : 'AWAITING_PAYMENT'),
            utr_number: dt.utr_number,
            created_at: dt.created_at,
            updated_at: dt.updated_at
          };
          if (idx >= 0) mergedTeams[idx] = { ...mergedTeams[idx], ...formatted };
          else mergedTeams.push(formatted);
        });
      }

      let mergedMembers = [...localMembers];
      if (!mErr && dbMembers) {
        dbMembers.forEach((dm: any) => {
          const idx = mergedMembers.findIndex(lm => lm.id === dm.id);
          const formatted: TeamMember = {
            id: dm.id,
            team_id: dm.team_id,
            name: dm.name,
            email: dm.email,
            phone: dm.phone,
            is_leader: dm.is_leader || false,
            passport_token: dm.passport_token,
            passport_issued_at: dm.passport_issued_at,
            passport_sent_at: dm.passport_sent_at,
            food_preference: dm.food_preference || 'VEG',
            food_collected: dm.food_collected || false,
            food_collected_at: dm.food_collected_at,
            created_at: dm.created_at
          };
          if (idx >= 0) mergedMembers[idx] = { ...mergedMembers[idx], ...formatted };
          else mergedMembers.push(formatted);
        });
      }

      mergedTeams = mergedTeams.map(t => ({
        ...t,
        members: mergedMembers.filter(m => m.team_id === t.team_id)
      }));

      this.setStorage(STORAGE_KEYS.TEAMS, mergedTeams);
      this.setStorage(STORAGE_KEYS.MEMBERS, mergedMembers);

      // 3. Fetch live events
      const { data: dbEvents, error: eErr } = await supabase
        .from('events')
        .select('*')
        .order('code', { ascending: true });

      if (!eErr && dbEvents && dbEvents.length > 0) {
        const currentEvents = this.getStorage<EventMission[]>(STORAGE_KEYS.EVENTS, OFFICIAL_MISSIONS);
        const mergedEvents = currentEvents.map(base => {
          const matched = dbEvents.find(db => 
            (db.code && db.code.toString().padStart(2, '0') === base.code) ||
            (db.id && db.id.toLowerCase() === base.id.toLowerCase()) ||
            (db.mission_name && db.mission_name.toLowerCase() === base.mission_name.toLowerCase()) ||
            (db.title && db.title.toLowerCase() === base.title.toLowerCase())
          );

          if (matched) {
            return {
              ...base,
              mission_name: matched.mission_name || matched.title || matched.name || base.mission_name,
              title: matched.title || matched.mission_name || matched.name || base.title,
              venue: matched.venue || base.venue,
              schedule_time: matched.schedule_time || base.schedule_time,
              status: matched.status || base.status,
              description: matched.description || base.description,
            };
          }
          return base;
        });

        this.setStorage(STORAGE_KEYS.EVENTS, mergedEvents);
      }

      // 4. Fetch live event registrations
      const { data: dbRegs, error: rErr } = await supabase
        .from('event_registrations')
        .select('*');

      if (!rErr && dbRegs) {
        this.setStorage(STORAGE_KEYS.REGISTRATIONS, dbRegs);
      }

      // 5. Fetch live attendance
      const { data: dbAttendance, error: aErr } = await supabase
        .from('attendance')
        .select('*')
        .order('scanned_at', { ascending: false });

      if (!aErr && dbAttendance) {
        this.setStorage(STORAGE_KEYS.ATTENDANCE, dbAttendance);
      }

      this.notifySubscribers();
    } catch (e) {
      console.warn('Supabase team sync notice:', e);
    } finally {
      this.isSyncing = false;
    }
  }

  private getStorage<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  private setStorage<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }

  // --- TEAMS & MEMBERS ---
  getTeams(): Team[] {
    const rawTeams = this.getStorage<Team[]>(STORAGE_KEYS.TEAMS, []);
    const allMembers = this.getTeamMembers();
    return rawTeams.map(t => ({
      ...t,
      members: allMembers.filter(m => m.team_id === t.team_id)
    }));
  }

  getTeamMembers(teamId?: string): TeamMember[] {
    const all = this.getStorage<TeamMember[]>(STORAGE_KEYS.MEMBERS, []);
    if (teamId) {
      const cleaned = teamId.trim().toUpperCase();
      return all.filter(m => m.team_id && m.team_id.toUpperCase() === cleaned);
    }
    return all;
  }

  getTeamById(teamId: string): Team | undefined {
    const cleaned = teamId.trim().toUpperCase();
    const teams = this.getTeams();
    return teams.find(t => t.team_id.toUpperCase() === cleaned);
  }

  getMemberById(memberId: string): TeamMember | undefined {
    const cleaned = memberId.trim().toUpperCase();
    return this.getTeamMembers().find(m => m.id.toUpperCase() === cleaned);
  }

  getMemberByPassportToken(token: string): TeamMember | undefined {
    const cleaned = token.trim();
    if (!cleaned) return undefined;
    return this.getTeamMembers().find(
      m => m.passport_token && m.passport_token.toLowerCase() === cleaned.toLowerCase()
    );
  }

  getMemberByEmail(email: string): TeamMember | undefined {
    const cleaned = email.trim().toLowerCase();
    return this.getTeamMembers().find(m => m.email.toLowerCase() === cleaned);
  }

  // Unified lookup supporting Passport Token (QR), Team ID, Member ID, or Email
  lookupEntity(query: string): { team?: Team; member?: TeamMember; isTeamMatch?: boolean } {
    const cleaned = query.trim();
    if (!cleaned) return {};

    // 1. By Secure Passport Token (Inside QR)
    const memberByToken = this.getMemberByPassportToken(cleaned);
    if (memberByToken) {
      const team = this.getTeamById(memberByToken.team_id);
      return { team, member: memberByToken };
    }

    // 2. By Member ID
    const memberById = this.getMemberById(cleaned);
    if (memberById) {
      const team = this.getTeamById(memberById.team_id);
      return { team, member: memberById };
    }

    // 3. By Team ID
    const teamById = this.getTeamById(cleaned);
    if (teamById) {
      const leader = teamById.members?.find(m => m.is_leader) || teamById.members?.[0];
      return { team: teamById, member: leader, isTeamMatch: true };
    }

    // 4. By Member Email
    const memberByEmail = this.getMemberByEmail(cleaned);
    if (memberByEmail) {
      const team = this.getTeamById(memberByEmail.team_id);
      return { team, member: memberByEmail };
    }

    return {};
  }

  getParticipants(): Participant[] {
    const teams = this.getTeams();
    const result: Participant[] = [];
    
    teams.forEach(team => {
      if (team.members && team.members.length > 0) {
        team.members.forEach(member => {
          result.push({
            agent_id: member.id,
            team_id: team.team_id,
            name: member.name,
            email: member.email,
            phone: member.phone,
            college: team.college,
            department: team.department,
            year: team.year,
            registered_events: team.registered_events,
            payment: team.payment,
            payment_status: team.payment_status,
            food_preference: member.food_preference,
            food_collected: member.food_collected,
            food_collected_at: member.food_collected_at,
            created_at: member.created_at,
            members: team.members
          } as Participant);
        });
      } else {
        result.push({
          agent_id: team.team_id,
          team_id: team.team_id,
          name: team.team_name,
          email: '',
          phone: '',
          college: team.college,
          department: team.department,
          year: team.year,
          registered_events: team.registered_events,
          payment: team.payment,
          payment_status: team.payment_status,
          created_at: team.created_at
        } as Participant);
      }
    });

    return result;
  }

  getParticipantByAgentId(id: string): Participant | undefined {
    const res = this.lookupEntity(id);
    if (res.member) {
      const team = res.team || this.getTeamById(res.member.team_id);
      return {
        agent_id: res.member.id,
        team_id: team?.team_id || res.member.team_id,
        name: res.member.name,
        email: res.member.email,
        phone: res.member.phone,
        college: team?.college || '',
        department: team?.department || '',
        year: team?.year || 'IV',
        registered_events: team?.registered_events || [],
        payment: team?.payment || false,
        payment_status: team?.payment_status,
        food_preference: res.member.food_preference,
        food_collected: res.member.food_collected,
        food_collected_at: res.member.food_collected_at,
        created_at: res.member.created_at,
        members: team?.members
      } as Participant;
    }
    return undefined;
  }

  getParticipantByIdOrEmail(query: string): Participant | undefined {
    const res = this.lookupEntity(query);
    if (res.member) return this.getParticipantByAgentId(res.member.id);
    return undefined;
  }

  async getParticipantByIdOrEmailAsync(query: string): Promise<Participant | undefined> {
    const local = this.getParticipantByIdOrEmail(query);
    if (local) return local;

    if (isSupabaseConfigured()) {
      const cleaned = query.trim();
      const { data: memberData } = await supabase
        .from('team_members')
        .select('*')
        .or(`id.eq.${cleaned},email.eq.${cleaned},passport_token.eq.${cleaned}`)
        .limit(1);

      if (memberData && memberData.length > 0) {
        await this.syncFromSupabase();
        return this.getParticipantByAgentId(memberData[0].id);
      }
    }
    return undefined;
  }

  // --- REGISTRATION ---
  async registerTeam(
    teamData: {
      team_name: string;
      college: string;
      department: string;
      year: string;
      registered_events: string[];
      members?: Array<{
        name: string;
        email: string;
        phone: string;
        is_leader: boolean;
        food_preference?: 'VEG' | 'NON_VEG';
      }>;
    },
    optionalMembers?: Array<{
      name: string;
      email: string;
      phone: string;
      is_leader: boolean;
      food_preference?: 'VEG' | 'NON_VEG';
    }>
  ): Promise<Team> {
    const rawMembers = optionalMembers || teamData.members || [];
    const membersList = Array.isArray(rawMembers) ? rawMembers : [];

    const apiPayload = {
      team_name: teamData.team_name,
      college: teamData.college,
      department: teamData.department,
      year: teamData.year,
      registered_events: teamData.registered_events,
      selected_event_ids: teamData.registered_events,
      members: membersList
    };

    const apiRes = await this.fetchJson<any>('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiPayload)
    });

    if (!apiRes || !apiRes.success) {
      throw new Error(apiRes?.message || 'Registration rejected by server. Please check your details and try again.');
    }

    const teamId = apiRes.team_id || apiRes.team?.team_id;
    const membersWithIds: TeamMember[] = (apiRes.members || apiRes.team?.members || teamData.members || []).map(
      (m: any, idx: number) => ({
        id: m.id || `ATT-${(teamId || '').replace('ZIN-', '')}-${idx + 1}`,
        team_id: teamId,
        name: m.name,
        email: m.email,
        phone: m.phone,
        is_leader: m.is_leader ?? idx === 0,
        food_preference: m.food_preference || 'VEG',
        passport_token: m.passport_token || '',
        created_at: new Date().toISOString()
      })
    );

    const teamObj: Team = {
      team_id: teamId,
      team_name: apiRes.team_name || apiRes.team?.team_name || teamData.team_name,
      college: teamData.college,
      department: teamData.department,
      year: teamData.year,
      registered_events: teamData.registered_events,
      payment: false,
      payment_status: 'AWAITING_PAYMENT',
      members: membersWithIds,
      created_at: new Date().toISOString()
    };

    const teams = this.getTeams();
    const existingIdx = teams.findIndex(t => t.team_id === teamId);
    if (existingIdx >= 0) {
      teams[existingIdx] = teamObj;
    } else {
      teams.unshift(teamObj);
    }
    this.setStorage(STORAGE_KEYS.TEAMS, teams);

    const curMembers = this.getTeamMembers().filter(m => m.team_id !== teamId);
    curMembers.push(...membersWithIds);
    this.setStorage(STORAGE_KEYS.MEMBERS, curMembers);

    this.setCurrentTeam(teamObj);
    this.notifySubscribers();
    return teamObj;
  }

  // --- PAYMENT OPERATIONS ---
  async getPaymentStatus(teamId: string): Promise<any> {
    const cleaned = teamId.trim();
    if (!cleaned) return { success: false, message: 'Invalid team ID' };

    try {
      const res = await this.fetchJson<any>(`/api/payment/status?team_id=${encodeURIComponent(cleaned)}`);
      if (res && res.success) {
        return res;
      }
    } catch (err: any) {
      console.warn('[Store] getPaymentStatus API fallback:', err);
    }

    const local = this.getTeamById(cleaned);
    if (local) {
      return {
        success: true,
        team_id: local.team_id,
        team_name: local.team_name,
        payment: local.payment,
        payment_status: local.payment_status || 'AWAITING_PAYMENT',
        member_count: local.members?.length || 1,
        members: local.members || [],
        registered_events: local.registered_events || [],
        expected_amount: (local.members?.length || 1) * 250,
        submitted_amount: (local.members?.length || 1) * 250
      };
    }
    return { success: false, message: `Team ${cleaned} not found.` };
  }

  async submitPaymentProof(
    teamId: string,
    payload: { utr_number: string; amount_paid: number }
  ): Promise<any> {
    const cleaned = teamId.trim();
    const res = await this.fetchJson<any>('/api/payment/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        team_id: cleaned,
        utr_number: payload.utr_number,
        submitted_amount: payload.amount_paid
      })
    });

    if (res && res.success) {
      const teams = this.getTeams();
      const idx = teams.findIndex(t => t.team_id.toUpperCase() === cleaned.toUpperCase());
      if (idx !== -1) {
        teams[idx].payment_status = 'PENDING_VERIFICATION';
        this.setStorage(STORAGE_KEYS.TEAMS, teams);
      }
      this.notifySubscribers();
    }

    return res;
  }

  setCurrentTeam(team: Team | null) {
    this.setStorage(STORAGE_KEYS.CURRENT_TEAM, team);
  }

  getCurrentTeam(): Team | null {
    return this.getStorage(STORAGE_KEYS.CURRENT_TEAM, null);
  }

  // --- CHECK-IN LOGIC (Local Fallbacks) ---
  recordEntryCheckin(
    identifier: string,
    scannedBy = 'Gate Terminal',
    targetMemberId?: string
  ): { success: boolean; message: string; record?: AttendanceRecord; team?: Team; member?: TeamMember; participant?: Participant } {
    const lookup = this.lookupEntity(identifier);
    if (!lookup.team && !lookup.member) {
      return { success: false, message: `Team or Member ID "${identifier}" not found.` };
    }

    const team = lookup.team || (lookup.member ? this.getTeamById(lookup.member.team_id) : undefined);
    const member = targetMemberId 
      ? this.getMemberById(targetMemberId) 
      : (lookup.member || team?.members?.[0]);

    if (!team || !member) {
      return { success: false, message: 'Could not resolve attendee team details.' };
    }

    const attendance = this.getAttendance();
    const alreadyCheckedIn = attendance.find(
      a => (a.member_id === member.id || a.agent_id === member.id) && a.checkin_type === 'ENTRY'
    );

    if (alreadyCheckedIn) {
      const timeStr = new Date(alreadyCheckedIn.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return {
        success: false,
        message: `${member.name} (${team.team_name}) is ALREADY CHECKED IN at ${timeStr}. Duplicate entry prevented.`,
        team,
        member,
        participant: this.getParticipantByAgentId(member.id)
      };
    }

    const record: AttendanceRecord = {
      team_id: team.team_id,
      member_id: member.id,
      agent_id: member.id,
      passport_token_used: member.passport_token || identifier,
      participant_name: `${member.name} [${team.team_name}]`,
      college: team.college,
      checkin_type: 'ENTRY',
      scanned_by: scannedBy,
      scanned_at: new Date().toISOString(),
      location: 'Main Security Gate'
    };

    attendance.unshift(record);
    this.setStorage(STORAGE_KEYS.ATTENDANCE, attendance);

    if (isSupabaseConfigured()) {
      supabase.from('attendance').insert([{
        team_id: record.team_id,
        member_id: record.member_id,
        passport_token_used: record.passport_token_used,
        participant_name: record.participant_name,
        college: record.college,
        checkin_type: record.checkin_type,
        scanned_by: record.scanned_by,
        location: record.location
      }]).then();
    }

    this.notifySubscribers();

    return {
      success: true,
      message: `Gate Entry granted for ${member.name} (${team.team_name})`,
      record,
      team,
      member,
      participant: this.getParticipantByAgentId(member.id)
    };
  }

  recordFoodDistribution(
    identifier: string,
    scannedBy = 'Dining Counter'
  ): { success: boolean; message: string; member?: TeamMember; participant?: Participant } {
    const lookup = this.lookupEntity(identifier);
    if (!lookup.member) {
      return { success: false, message: `Attendee ID or QR "${identifier}" not recognized.` };
    }

    const member = lookup.member;
    const team = lookup.team || this.getTeamById(member.team_id);

    if (member.food_collected) {
      const timeStr = member.food_collected_at 
        ? new Date(member.food_collected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        : 'earlier';
      return {
        success: false,
        message: `FOOD ALREADY CLAIMED: ${member.name} claimed meal at ${timeStr}.`
      };
    }

    member.food_collected = true;
    member.food_collected_at = new Date().toISOString();

    const allMembers = this.getTeamMembers();
    const idx = allMembers.findIndex(m => m.id === member.id);
    if (idx !== -1) {
      allMembers[idx] = member;
      this.setStorage(STORAGE_KEYS.MEMBERS, allMembers);
    }

    if (isSupabaseConfigured()) {
      supabase.from('team_members').update({
        food_collected: true,
        food_collected_at: member.food_collected_at
      }).eq('id', member.id).then();
    }

    this.notifySubscribers();

    return {
      success: true,
      message: `Lunch token claimed for ${member.name} (${team?.team_name || 'Team'})`,
      member,
      participant: this.getParticipantByAgentId(member.id)
    };
  }

  recordEventCheckin(
    identifier: string,
    eventId: string,
    scannedBy = 'Event Desk'
  ): { success: boolean; message: string; record?: AttendanceRecord } {
    const lookup = this.lookupEntity(identifier);
    if (!lookup.member) {
      return { success: false, message: `Attendee ID or QR "${identifier}" not recognized.` };
    }

    const member = lookup.member;
    const team = lookup.team || this.getTeamById(member.team_id);
    const event = this.getEventById(eventId);

    if (!event) {
      return { success: false, message: 'Invalid event track selected.' };
    }

    if (!team || !team.registered_events.includes(eventId)) {
      return {
        success: false,
        message: `ACCESS DENIED: ${member.name} (${team?.team_name || 'Team'}) is NOT registered for "${event.mission_name}".`
      };
    }

    const attendance = this.getAttendance();
    const alreadyCheckedIn = attendance.find(
      a => (a.member_id === member.id || a.agent_id === member.id) && a.checkin_type === 'EVENT' && a.event_id === eventId
    );

    if (alreadyCheckedIn) {
      return {
        success: false,
        message: `${member.name} was already verified for this event at ${new Date(alreadyCheckedIn.scanned_at).toLocaleTimeString()}.`
      };
    }

    const record: AttendanceRecord = {
      team_id: team.team_id,
      member_id: member.id,
      agent_id: member.id,
      passport_token_used: member.passport_token || identifier,
      participant_name: `${member.name} (${team.team_name})`,
      college: team.college,
      checkin_type: 'EVENT',
      event_id: event.id,
      event_name: event.mission_name,
      scanned_by: scannedBy,
      scanned_at: new Date().toISOString(),
      location: event.venue
    };

    attendance.unshift(record);
    this.setStorage(STORAGE_KEYS.ATTENDANCE, attendance);

    if (isSupabaseConfigured()) {
      supabase.from('attendance').insert([{
        team_id: record.team_id,
        member_id: record.member_id,
        passport_token_used: record.passport_token_used,
        participant_name: record.participant_name,
        college: record.college,
        checkin_type: record.checkin_type,
        event_id: record.event_id,
        scanned_by: record.scanned_by,
        location: record.location
      }]).then();
    }

    this.notifySubscribers();

    return {
      success: true,
      message: `Event track verified: ${member.name} admitted to ${event.mission_name}`,
      record
    };
  }

  // --- ASYNC BACKEND API CHECK-IN & PAYMENT HANDLERS ---
  private async fetchJson<T = any>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    let data: any = null;
    if (contentType.includes('application/json')) {
      try {
        data = await res.json();
      } catch {}
    }
    if (!res.ok) {
      const errMsg = data?.reason || data?.error || data?.message || `Server HTTP Error ${res.status}`;
      const err = new Error(errMsg);
      (err as any).status = res.status;
      (err as any).data = data;
      throw err;
    }
    return data as T;
  }

  async checkinEntryApi(params: {
    passport_token?: string;
    id?: string;
    scanned_by?: string;
    location?: string;
  }): Promise<{ success: boolean; reason: string; member?: TeamMember; team?: Team }> {
    try {
      const data = await this.fetchJson<any>('/api/checkin/entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (data && data.success) {
        await this.syncFromSupabase();
      }
      return {
        success: data?.success ?? false,
        reason: data?.reason || (data?.success ? 'Entry Verified' : 'Check-in failed'),
        member: data?.member,
        team: data?.team
      };
    } catch (e: any) {
      return {
        success: false,
        reason: e.message || 'Campus entry verification error.'
      };
    }
  }

  async checkinEventApi(params: {
    passport_token?: string;
    id?: string;
    event_id: string;
    scanned_by?: string;
    location?: string;
  }): Promise<{ success: boolean; reason: string; member?: TeamMember; team?: Team; registered_events?: any[] }> {
    try {
      const token = localStorage.getItem('admin_token') || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const data = await this.fetchJson<any>('/api/checkin/event', {
        method: 'POST',
        headers,
        body: JSON.stringify(params)
      });
      if (data && data.success) {
        await this.syncFromSupabase();
      }
      return {
        success: data?.success ?? false,
        reason: data?.reason || (data?.success ? 'Event check-in verified' : 'Check-in failed'),
        member: data?.member,
        team: data?.team,
        registered_events: data?.registered_events
      };
    } catch (e: any) {
      return {
        success: false,
        reason: e.message || 'Event check-in failed.'
      };
    }
  }

  async checkinFoodApi(params: {
    passport_token?: string;
    id?: string;
    scanned_by?: string;
    location?: string;
  }): Promise<{ success: boolean; reason: string; member?: TeamMember; team?: Team; food_preference?: 'VEG' | 'NON_VEG' }> {
    try {
      const data = await this.fetchJson<any>('/api/checkin/food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (data && data.success) {
        await this.syncFromSupabase();
      }
      return {
        success: data?.success ?? false,
        reason: data?.reason || (data?.success ? 'Food token claimed' : 'Claim failed'),
        member: data?.member,
        team: data?.team,
        food_preference: data?.food_preference
      };
    } catch (e: any) {
      return {
        success: false,
        reason: e.message || 'Food check-in failed.'
      };
    }
  }

  async resendPassportApi(memberId: string): Promise<{ success: boolean; message: string }> {
    try {
      const data = await this.fetchJson<any>('/api/passport-dispatch/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: memberId })
      });
      return { success: data?.success ?? true, message: data?.message || 'Passport dispatched.' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Failed to dispatch passport email.' };
    }
  }

  async getPaymentStatusApi(teamId: string): Promise<{
    success: boolean;
    team_id?: string;
    team_name?: string;
    payment?: boolean;
    payment_status?: string;
    member_count?: number;
    expected_amount?: number;
    submitted_amount?: number;
    utr_number?: string;
    rejection_reason?: string;
    message?: string;
  }> {
    if (!teamId || teamId === 'undefined' || teamId === 'null') {
      return { success: false, message: 'No valid Team ID provided.' };
    }
    
    try {
      const data = await this.fetchJson<any>(`/api/payment/status?team_id=${encodeURIComponent(teamId.trim())}`);
      if (data && data.success) {
        return data;
      }
    } catch (e: any) {
      console.warn('Backend payment status fetch notice:', e.message);
    }

    // Fallback to local storage read cache
    const localTeam = this.getTeamById(teamId);
    if (localTeam) {
      const count = localTeam.members?.length || 1;
      const expectedAmount = count * REGISTRATION_FEE_PER_HEAD;
      return {
        success: true,
        team_id: localTeam.team_id,
        team_name: localTeam.team_name,
        payment: localTeam.payment || false,
        payment_status: localTeam.payment_status || (localTeam.payment ? 'VERIFIED' : 'AWAITING_PAYMENT'),
        member_count: count,
        expected_amount: expectedAmount,
        submitted_amount: expectedAmount,
        utr_number: localTeam.utr_number || '',
        rejection_reason: ''
      };
    }

    return { success: false, message: 'Team registration record not found.' };
  }

  async submitPaymentApi(teamId: string, utrNumber: string, submittedAmount: number): Promise<{
    success: boolean;
    message?: string;
    payment_status?: string;
    error_code?: string;
  }> {
    const trimmedUtr = utrNumber?.trim().toUpperCase();
    if (!trimmedUtr || trimmedUtr.length < 10) {
      throw new Error('Please enter a valid 10-30 character alphanumeric UTR / Transaction Reference.');
    }

    const data = await this.fetchJson<any>('/api/payment/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        team_id: teamId,
        utr_number: trimmedUtr,
        submitted_amount: submittedAmount
      })
    });

    if (data && data.success) {
      const teams = this.getStorage<Team[]>(STORAGE_KEYS.TEAMS, []);
      const team = teams.find(t => t.team_id === teamId || t.team_id.toUpperCase() === teamId.toUpperCase());
      if (team) {
        team.utr_number = trimmedUtr;
        team.payment_status = 'PENDING_VERIFICATION';
        this.setStorage(STORAGE_KEYS.TEAMS, teams);
        this.notifySubscribers();
      }
      return data;
    }

    throw new Error(data?.message || 'Payment proof submission rejected by server.');
  }

  async verifyPaymentByTreasurer(teamId: string, action: string = 'VERIFY', reason: string = ''): Promise<{
    success: boolean;
    message?: string;
    payment_status?: string;
  }> {
    const token = localStorage.getItem('admin_token') || '';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const endpoint = action === 'VERIFY' ? '/api/admin/payments/verify' : '/api/admin/payments/reject';
    const payload = action === 'VERIFY' ? { team_id: teamId } : { team_id: teamId, reason };

    const res = await this.fetchJson<any>(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (res && res.success) {
      const teams = this.getStorage<Team[]>(STORAGE_KEYS.TEAMS, []);
      const team = teams.find(t => t.team_id === teamId || t.team_id.toUpperCase() === teamId.toUpperCase());
      if (team) {
        team.payment = (action === 'VERIFY');
        team.payment_status = (action === 'VERIFY' ? 'VERIFIED' : 'REJECTED');
        this.setStorage(STORAGE_KEYS.TEAMS, teams);
        this.notifySubscribers();
      }
      await this.syncFromSupabase();
      return res;
    }

    throw new Error(res?.error || res?.message || 'Payment verification failed.');
  }

  async getPaymentStatus(teamId: string): Promise<{
    success: boolean;
    team_id?: string;
    team_name?: string;
    payment?: boolean;
    payment_status?: string;
    member_count?: number;
    expected_amount?: number;
    submitted_amount?: number;
    utr_number?: string;
    rejection_reason?: string;
    message?: string;
  }> {
    return this.getPaymentStatusApi(teamId);
  }

  async submitPaymentProof(teamId: string, proof: { utr_number: string; amount_paid: number }): Promise<{
    success: boolean;
    message?: string;
  }> {
    return this.submitPaymentApi(teamId, proof.utr_number, proof.amount_paid);
  }

  // --- EVENTS ---
  getEvents(filterType?: EventType): EventMission[] {
    let events = this.getStorage<EventMission[]>(STORAGE_KEYS.EVENTS, OFFICIAL_MISSIONS);
    if (!events || events.length === 0) {
      events = OFFICIAL_MISSIONS;
      this.setStorage(STORAGE_KEYS.EVENTS, events);
    } else {
      events = events.map(e => {
        const official = OFFICIAL_MISSIONS.find(m => m.id === e.id || m.code === e.code);
        return official 
          ? {
              ...e,
              rules: official.rules,
              team_size_min: official.team_size_min,
              team_size_max: official.team_size_max,
              coordinators: official.coordinators,
              venue: official.venue,
              schedule_time: official.schedule_time,
              duration: official.duration,
            }
          : e;
      });
      this.setStorage(STORAGE_KEYS.EVENTS, events);
    }
    if (filterType) {
      return events.filter(e => e.event_type === filterType);
    }
    return events;
  }

  getEventById(id: string): EventMission | undefined {
    return this.getEvents().find(e => e.id === id);
  }

  getEventRegistrations(): EventRegistration[] {
    return this.getStorage<EventRegistration[]>(STORAGE_KEYS.REGISTRATIONS, []);
  }

  // --- ATTENDANCE ---
  getAttendance(): AttendanceRecord[] {
    return this.getStorage<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);
  }

  async deleteParticipant(id: string): Promise<void> {
    const teams = this.getTeams().filter(t => t.team_id !== id && !t.members?.some(m => m.id === id));
    const members = this.getTeamMembers().filter(m => m.id !== id && m.team_id !== id);

    this.setStorage(STORAGE_KEYS.TEAMS, teams);
    this.setStorage(STORAGE_KEYS.MEMBERS, members);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('event_registrations').delete().eq('team_id', id);
        await supabase.from('team_payments').delete().eq('team_id', id);
        await supabase.from('attendance').delete().eq('team_id', id);
        await supabase.from('attendance').delete().eq('member_id', id);
        await supabase.from('team_members').delete().eq('team_id', id);
        await supabase.from('team_members').delete().eq('id', id);
        await supabase.from('teams').delete().eq('team_id', id);
      } catch (err) {
        console.warn('Supabase delete team error:', err);
      }
    }

    this.notifySubscribers();
  }

  // --- CURRENT USER ---
  getCurrentTeam(): Team | null {
    return this.getStorage(STORAGE_KEYS.CURRENT_TEAM, null);
  }

  setCurrentTeam(team: Team | null): void {
    this.setStorage(STORAGE_KEYS.CURRENT_TEAM, team);
  }
}

export const store = new ZinniaStore();
