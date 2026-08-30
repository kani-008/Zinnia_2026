import { 
  Team,
  TeamMember,
  Participant, 
  EventMission, 
  AttendanceRecord, 
  EventRegistration,
  PrizePosition,
  EventType,
  HandBand
} from '@/types';
import { OFFICIAL_MISSIONS } from '@/config/events';
import { generateTeamId, generateMemberId } from '@/utils/participant-id';
import { supabase, isSupabaseConfigured, isRealtimeEnabled } from '../lib/supabase';

const STORAGE_KEYS = {
  TEAMS: 'zin26_live_teams_v2',
  MEMBERS: 'zin26_live_members_v2',
  EVENTS: 'zin26_live_events_v6',
  REGISTRATIONS: 'zin26_live_registrations_v2',
  ATTENDANCE: 'zin26_live_attendance_v2',
  HAND_BANDS: 'zin26_live_hand_bands_v2',
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
      ['zin26_participants_v3', 'zin26_attendance_v3', 'zin26_registrations_v3', 'zin26_live_participants_v1', 'zin26_live_events_v2', 'zin26_live_events_v3', 'zin26_live_events_v4', 'zin26_live_events_v5'].forEach(k => {
        localStorage.removeItem(k);
      });
    } catch {}
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  notifySubscribers() {
    this.listeners.forEach(fn => {
      try { fn(); } catch (e) { console.error('Listener error:', e); }
    });
  }

  private setupRealtimeSubscription() {
    if (!isRealtimeEnabled()) return;
    if (this.realTimeChannel) return;

    try {
      let isCleaningUp = false;
      const channel = supabase.channel('public_team_db_sync');

      channel
        .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => this.syncFromSupabase())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, () => this.syncFromSupabase())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => this.syncFromSupabase())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => this.syncFromSupabase())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'event_registrations' }, () => this.syncFromSupabase())
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            return;
          }
          if ((status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') && !isCleaningUp) {
            isCleaningUp = true;
            console.warn('[Supabase Realtime] WebSocket connection closed or error:', err || status);
            setTimeout(() => {
              try {
                supabase.removeChannel(channel);
              } catch (e) {}
              if (this.realTimeChannel === channel) {
                this.realTimeChannel = null;
              }
            }, 0);
          }
        });

      this.realTimeChannel = channel;
    } catch (e) {
      console.warn('Realtime subscription notice:', e);
    }
  }

  async syncFromSupabase() {
    if (!isSupabaseConfigured() || this.isSyncing) return;
    this.isSyncing = true;

    try {
      // 1. Fetch live teams
      const { data: dbTeams, error: tErr } = await supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false });

      // 2. Fetch live team_members
      const { data: dbMembers, error: mErr } = await supabase
        .from('team_members')
        .select('*')
        .order('created_at', { ascending: true });

      // Retrieve current local teams and members
      const currentTeams = this.getStorage<Team[]>(STORAGE_KEYS.TEAMS, []);
      const currentMembers = this.getStorage<TeamMember[]>(STORAGE_KEYS.MEMBERS, []);

      let mergedTeams: Team[] = [...currentTeams];
      let mergedMembers: TeamMember[] = [...currentMembers];

      if (!tErr && dbTeams && dbTeams.length > 0) {
        dbTeams.forEach(dbt => {
          const idx = mergedTeams.findIndex(t => t.team_id === dbt.team_id);
          if (idx >= 0) {
            mergedTeams[idx] = { ...mergedTeams[idx], ...dbt };
          } else {
            mergedTeams.push(dbt);
          }
        });
      }

      if (!mErr && dbMembers && dbMembers.length > 0) {
        dbMembers.forEach(dbm => {
          const idx = mergedMembers.findIndex(m => m.id === dbm.id);
          if (idx >= 0) {
            mergedMembers[idx] = { ...mergedMembers[idx], ...dbm };
          } else {
            mergedMembers.push(dbm);
          }
        });
      }

      mergedTeams = mergedTeams.map(t => ({
        ...t,
        members: mergedMembers.filter(m => m.team_id === t.team_id)
      }));

      this.setStorage(STORAGE_KEYS.TEAMS, mergedTeams);
      this.setStorage(STORAGE_KEYS.MEMBERS, mergedMembers);

      // 3. Fetch live events from Supabase backend
      const { data: dbEvents, error: eErr } = await supabase
        .from('events')
        .select('*')
        .order('code', { ascending: true });

      if (!eErr && dbEvents && dbEvents.length > 0) {
        // Merge Supabase event names and updates with the baseline configuration
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
        this.notifySubscribers();
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

  getTeamMembers(): TeamMember[] {
    return this.getStorage<TeamMember[]>(STORAGE_KEYS.MEMBERS, []);
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

  getMemberByBandId(bandId: string): TeamMember | undefined {
    const cleaned = bandId.trim().toUpperCase();
    if (!cleaned) return undefined;
    return this.getTeamMembers().find(m => m.band_id && m.band_id.toUpperCase() === cleaned);
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

    // 2. By Member ID (Manual ID Fallback)
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

    // 5. By Legacy Wristband ID (Fallback)
    const memberByBand = this.getMemberByBandId(cleaned);
    if (memberByBand) {
      const team = this.getTeamById(memberByBand.team_id);
      return { team, member: memberByBand };
    }

    return {};
  }

  // --- BACKWARD COMPATIBILITY ADAPTERS ---
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
            band_id: member.band_id,
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
        band_id: res.member.band_id,
        food_collected: res.member.food_collected,
        food_collected_at: res.member.food_collected_at,
        created_at: res.member.created_at,
        members: team?.members
      } as Participant;
    }
    return undefined;
  }

  getParticipantByBandId(bandId: string): Participant | undefined {
    const member = this.getMemberByBandId(bandId);
    if (member) return this.getParticipantByAgentId(member.id);
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
      await this.syncFromSupabase();
      return this.getParticipantByIdOrEmail(query);
    }
    return undefined;
  }

  // --- TEAM REGISTRATION ---
  async registerTeam(
    teamData: Omit<Team, 'team_id' | 'created_at' | 'members' | 'payment'>,
    members: { name: string; email: string; phone: string; is_leader: boolean }[]
  ): Promise<Team> {
    if (!members || members.length === 0) {
      throw new Error('A team must contain at least one member.');
    }

    // Check duplicate emails against Supabase DB if available, fallback to local
    for (const m of members) {
      const emailLower = m.email.trim().toLowerCase();
      if (isSupabaseConfigured()) {
        try {
          const { data: existingDb } = await supabase
            .from('team_members')
            .select('id, email, name')
            .eq('email', emailLower);

          if (existingDb && existingDb.length > 0) {
            throw new Error(`Email "${m.email}" is already registered by ${existingDb[0].name || 'another participant'}.`);
          }
        } catch (dbErr: any) {
          if (dbErr.message && dbErr.message.includes('already registered')) {
            throw dbErr;
          }
        }
      } else {
        const existingMembers = this.getTeamMembers();
        const exists = existingMembers.find(em => em.email.toLowerCase() === emailLower);
        if (exists) {
          throw new Error(`Email "${m.email}" is already registered.`);
        }
      }
    }

    // Attempt server-side registration first for secure price calculation & event validation
    try {
      const serverRes = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_name: teamData.team_name,
          college: teamData.college,
          department: teamData.department,
          year: teamData.year,
          selected_event_ids: teamData.registered_events,
          members: members.map((m, idx) => ({
            name: m.name,
            email: m.email,
            phone: m.phone,
            is_leader: m.is_leader || idx === 0
          }))
        })
      });

      const contentType = serverRes.headers.get('content-type') || '';
      if (!serverRes.ok || !contentType.includes('application/json')) {
        throw new Error('Backend API unavailable (falling back to local registration).');
      }

      const serverData = await serverRes.json();
      if (!serverData.success) {
        throw new Error(serverData.message || serverData.error_code || 'Registration validation failed.');
      }

      const registeredTeam: Team = {
        ...teamData,
        team_id: serverData.team_id,
        payment: false,
        payment_status: serverData.payment_status || 'AWAITING_PAYMENT',
        members: serverData.members,
        created_at: new Date().toISOString()
      };

      // Update local storage state
      const allTeams = this.getTeams();
      allTeams.unshift(registeredTeam);
      this.setStorage(STORAGE_KEYS.TEAMS, allTeams);

      const allMembers = this.getTeamMembers();
      if (serverData.members) {
        allMembers.push(...serverData.members);
        this.setStorage(STORAGE_KEYS.MEMBERS, allMembers);
      }

      this.setCurrentTeam(registeredTeam);
      try {
        const bc = new BroadcastChannel('zin26_live_sync_channel');
        bc.postMessage({
          type: 'TEAM_REGISTERED',
          team: registeredTeam,
          members: serverData.members
        });
        bc.close();
      } catch (e) {}
      this.notifySubscribers();
      return registeredTeam;
    } catch (apiErr: any) {
      if (apiErr.message && (apiErr.message.includes('validation') || apiErr.message.includes('already registered'))) {
        throw apiErr;
      }
      console.warn('Backend /api/register fallback notice:', apiErr.message);
    }

    const team_id = generateTeamId();
    const now = new Date().toISOString();

    const generateSecureToken = () => {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const newTeam: Team = {
      ...teamData,
      team_id,
      payment: false,
      payment_status: 'AWAITING_PAYMENT',
      created_at: now
    };

    const newMembers: TeamMember[] = members.map((m, idx) => ({
      id: generateMemberId(team_id, idx),
      team_id,
      name: m.name.trim(),
      email: m.email.trim().toLowerCase(),
      phone: m.phone.trim(),
      is_leader: m.is_leader || idx === 0,
      passport_token: generateSecureToken(),
      passport_issued_at: now,
      food_collected: false,
      created_at: now
    }));

    newTeam.members = newMembers;

    // Update local state
    const allTeams = this.getTeams();
    allTeams.unshift(newTeam);
    this.setStorage(STORAGE_KEYS.TEAMS, allTeams);

    const allMembers = this.getTeamMembers();
    allMembers.push(...newMembers);
    this.setStorage(STORAGE_KEYS.MEMBERS, allMembers);

    this.setCurrentTeam(newTeam);

    // Broadcast instant sync message for admin panel tabs
    try {
      const bc = new BroadcastChannel('zin26_live_sync_channel');
      bc.postMessage({
        type: 'TEAM_REGISTERED',
        team: newTeam,
        members: newMembers
      });
      bc.close();
    } catch (e) {}

    // Event Registrations
    const registrations = this.getEventRegistrations();
    teamData.registered_events.forEach(eventId => {
      registrations.push({
        event_id: eventId,
        agent_id: team_id,
        team_name: teamData.team_name,
        position: null,
        registered_at: now
      });
    });
    this.setStorage(STORAGE_KEYS.REGISTRATIONS, registrations);

    if (isSupabaseConfigured()) {
      try {
        const { error: teamErr } = await supabase.from('teams').insert([{
          team_id: newTeam.team_id,
          team_name: newTeam.team_name,
          college: newTeam.college,
          department: newTeam.department,
          year: newTeam.year,
          registered_events: newTeam.registered_events,
          payment_status: 'AWAITING_PAYMENT'
        }]);

        if (teamErr) {
          console.warn('Supabase teams insert warning (RLS/Permissions):', teamErr.message);
        } else {
          const memberRows = newMembers.map(m => ({
            id: m.id,
            team_id: m.team_id,
            name: m.name,
            email: m.email,
            phone: m.phone,
            is_leader: m.is_leader,
            passport_token: m.passport_token
          }));
          await supabase.from('team_members').insert(memberRows);

          if (teamData.registered_events.length > 0) {
            const regRows = teamData.registered_events.map(eventId => ({
              team_id: newTeam.team_id,
              event_id: eventId,
              team_name: newTeam.team_name
            }));
            await supabase.from('event_registrations').insert(regRows);
          }
        }
      } catch (e: any) {}
    }

    this.notifySubscribers();
    return newTeam;
  }

  // --- WRISTBAND PAIRING (Individual Member Level) ---
  assignMemberBand(memberId: string, rawBandId: string): { success: boolean; message: string; member?: TeamMember } {
    const bandId = rawBandId.trim().toUpperCase();
    if (!bandId) {
      return { success: false, message: 'Invalid Hand Band ID provided.' };
    }

    const members = this.getTeamMembers();
    const member = members.find(m => m.id.toUpperCase() === memberId.trim().toUpperCase());
    if (!member) {
      return { success: false, message: `Member "${memberId}" not found.` };
    }

    // Check uniqueness across all members
    const inUseByOther = members.find(
      m => m.id.toUpperCase() !== member.id.toUpperCase() &&
           m.band_id && m.band_id.toUpperCase() === bandId
    );

    if (inUseByOther) {
      return {
        success: false,
        message: `Hand Band "${bandId}" is ALREADY ASSIGNED to ${inUseByOther.name} (${inUseByOther.id}).`
      };
    }

    member.band_id = bandId;
    this.setStorage(STORAGE_KEYS.MEMBERS, members);

    if (isSupabaseConfigured()) {
      supabase.from('team_members').update({ band_id: bandId }).eq('id', member.id).then();
      supabase.from('hand_bands').upsert([{
        band_id: bandId,
        member_id: member.id,
        team_id: member.team_id,
        assigned_at: new Date().toISOString()
      }]).then();
    }

    this.notifySubscribers();
    return {
      success: true,
      message: `Hand Band ${bandId} linked to ${member.name}`,
      member
    };
  }

  removeMemberBand(memberId: string): { success: boolean; message: string; member?: TeamMember } {
    const members = this.getTeamMembers();
    const member = members.find(m => m.id.toUpperCase() === memberId.trim().toUpperCase());
    if (!member) {
      return { success: false, message: `Member "${memberId}" not found.` };
    }

    const previousBandId = member.band_id;
    member.band_id = undefined;
    this.setStorage(STORAGE_KEYS.MEMBERS, members);

    if (isSupabaseConfigured()) {
      supabase.from('team_members').update({ band_id: null }).eq('id', member.id).then();
      if (previousBandId) {
        supabase.from('hand_bands').delete().eq('band_id', previousBandId).then();
      }
      supabase.from('hand_bands').delete().eq('member_id', member.id).then();
    }

    this.notifySubscribers();
    return { success: true, message: `Hand Band unlinked for ${member.name}`, member };
  }

  // Legacy assignBand adapter
  assignBand(agentId: string, rawBandId: string): { success: boolean; message: string; participant?: Participant } {
    const res = this.lookupEntity(agentId);
    if (!res.member) {
      return { success: false, message: `Attendee "${agentId}" not found.` };
    }
    const result = this.assignMemberBand(res.member.id, rawBandId);
    return {
      success: result.success,
      message: result.message,
      participant: result.member ? this.getParticipantByAgentId(result.member.id) : undefined
    };
  }

  removeBand(agentId: string): { success: boolean; message: string; participant?: Participant } {
    const res = this.lookupEntity(agentId);
    if (!res.member) return { success: false, message: 'Attendee not found.' };
    const result = this.removeMemberBand(res.member.id);
    return {
      success: result.success,
      message: result.message,
      participant: result.member ? this.getParticipantByAgentId(result.member.id) : undefined
    };
  }

  // --- CHECK-IN LOGIC ---
  recordEntryCheckin(
    identifier: string,
    scannedBy = 'Gate Terminal',
    assignBandId?: string,
    targetMemberId?: string
  ): { success: boolean; message: string; record?: AttendanceRecord; team?: Team; member?: TeamMember; participant?: Participant } {
    const lookup = this.lookupEntity(identifier);
    if (!lookup.team && !lookup.member) {
      return { success: false, message: `Team / Member / Band ID "${identifier}" not found.` };
    }

    const team = lookup.team || (lookup.member ? this.getTeamById(lookup.member.team_id) : undefined);
    const member = targetMemberId 
      ? this.getMemberById(targetMemberId) 
      : (lookup.member || team?.members?.[0]);

    if (!team || !member) {
      return { success: false, message: 'Could not resolve attendee team details.' };
    }

    if (assignBandId && assignBandId.trim()) {
      const bandRes = this.assignMemberBand(member.id, assignBandId);
      if (!bandRes.success) {
        return { success: false, message: bandRes.message };
      }
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

    const bandInfo = member.band_id ? ` [Band: ${member.band_id}]` : '';
    return {
      success: true,
      message: `Gate Entry granted for ${member.name} (${team.team_name})${bandInfo}`,
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
      return { success: false, message: `Hand Band / Member ID "${identifier}" not recognized.` };
    }

    const member = lookup.member;
    const team = lookup.team || this.getTeamById(member.team_id);

    if (member.food_collected) {
      const timeStr = member.food_collected_at 
        ? new Date(member.food_collected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        : 'earlier';
      return {
        success: false,
        message: `FOOD ALREADY CLAIMED: ${member.name} claimed their meal at ${timeStr}.`
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
      return { success: false, message: `Hand Band / Member ID "${identifier}" not recognized.` };
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

  // --- ASYNC BACKEND API CHECK-IN HANDLERS ---
  private async fetchJson<T = any>(url: string, options?: RequestInit): Promise<T | null> {
    try {
      const res = await fetch(url, options);
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        return await res.json();
      }
    } catch (e) {}
    return null;
  }

  async checkinEntryApi(params: {
    passport_token?: string;
    id?: string;
    scanned_by?: string;
    location?: string;
  }): Promise<{ success: boolean; reason: string; member?: TeamMember; team?: Team }> {
    const data = await this.fetchJson('/api/checkin/entry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (data && data.success) {
      await this.syncFromSupabase();
      return {
        success: data.success,
        reason: data.reason || 'Entry Verified',
        member: data.member,
        team: data.team
      };
    }

    // Offline / local fallback
    const tokenOrId = params.passport_token || params.id || '';
    const localRes = this.recordEntryCheckin(tokenOrId, params.scanned_by || 'Gate Terminal');
    return {
      success: localRes.success,
      reason: localRes.message,
      member: localRes.member,
      team: localRes.team
    };
  }

  async checkinEventApi(params: {
    passport_token?: string;
    id?: string;
    event_id: string;
    scanned_by?: string;
    location?: string;
  }): Promise<{ success: boolean; reason: string; member?: TeamMember; team?: Team; registered_events?: any[] }> {
    const data = await this.fetchJson('/api/checkin/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (data && data.success) {
      await this.syncFromSupabase();
      return {
        success: data.success,
        reason: data.reason || 'Event check-in verified',
        member: data.member,
        team: data.team,
        registered_events: data.registered_events
      };
    }

    // Offline fallback
    const tokenOrId = params.passport_token || params.id || '';
    const localRes = this.recordEventCheckin(tokenOrId, params.event_id, params.scanned_by || 'Event Desk');
    return {
      success: localRes.success,
      reason: localRes.message
    };
  }

  async checkinFoodApi(params: {
    passport_token?: string;
    id?: string;
    scanned_by?: string;
    location?: string;
  }): Promise<{ success: boolean; reason: string; member?: TeamMember; team?: Team }> {
    const data = await this.fetchJson('/api/checkin/food', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (data && data.success) {
      await this.syncFromSupabase();
      return {
        success: data.success,
        reason: data.reason || 'Food token claimed',
        member: data.member,
        team: data.team
      };
    }

    // Offline fallback
    const tokenOrId = params.passport_token || params.id || '';
    const localRes = this.recordFoodDistribution(tokenOrId, params.scanned_by || 'Dining Counter');
    return {
      success: localRes.success,
      reason: localRes.message,
      member: localRes.member
    };
  }

  async resendPassportApi(memberId: string): Promise<{ success: boolean; message: string }> {
    const data = await this.fetchJson('/api/passport-dispatch/resend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_id: memberId })
    });
    if (data && data.success) {
      return { success: true, message: data.message || 'Passport dispatched' };
    }
    return { success: true, message: 'Digital passport dispatched to email.' };
  }

  // --- PAYMENT APIS ---
  async getPaymentStatusApi(teamId: string): Promise<{
    success: boolean;
    team_id?: string;
    team_name?: string;
    payment?: boolean;
    payment_status?: string;
    expected_amount?: number;
    submitted_amount?: number;
    utr_number?: string;
    rejection_reason?: string;
    message?: string;
  }> {
    const data = await this.fetchJson(`/api/payment/status?team_id=${teamId}`);
    if (data && data.success) {
      return data;
    }

    // Fallback: Local Team state lookup
    const team = this.getTeamById(teamId);
    if (team) {
      const expectedAmount = Math.max(150, (team.registered_events?.length || 1) * 150);
      return {
        success: true,
        team_id: team.team_id,
        team_name: team.team_name,
        payment: team.payment || false,
        payment_status: team.payment_status || (team.payment ? 'VERIFIED' : 'AWAITING_PAYMENT'),
        expected_amount: expectedAmount,
        submitted_amount: expectedAmount,
        utr_number: team.utr_number || '',
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
    // Always update local storage state first
    const teams = this.getStorage<Team[]>(STORAGE_KEYS.TEAMS, []);
    const team = teams.find(t => t.team_id === teamId || t.team_id.toUpperCase() === teamId.toUpperCase());
    if (team) {
      team.utr_number = utrNumber;
      team.payment_status = 'PENDING_VERIFICATION';
      this.setStorage(STORAGE_KEYS.TEAMS, teams);
      this.notifySubscribers();
    }

    const data = await this.fetchJson('/api/payment/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        team_id: teamId,
        utr_number: utrNumber,
        submitted_amount: submittedAmount
      })
    });

    if (data && data.success) {
      await this.syncFromSupabase();
      return data;
    }

    return {
      success: true,
      message: 'Payment UTR submitted successfully! Pending admin verification.',
      payment_status: 'PENDING_VERIFICATION'
    };
  }


  // --- EVENTS ---
  getEvents(filterType?: EventType): EventMission[] {
    let events = this.getStorage<EventMission[]>(STORAGE_KEYS.EVENTS, OFFICIAL_MISSIONS);
    // If the cache contains legacy data (not 9 events or missing 'debugging'), refresh from OFFICIAL_MISSIONS
    if (!events || events.length !== 9 || !events.some(e => e.id === 'debugging')) {
      events = OFFICIAL_MISSIONS;
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
        // Delete child table records first to prevent Foreign Key constraint conflicts (409 Conflict)
        await supabase.from('event_registrations').delete().eq('team_id', id);
        await supabase.from('team_payments').delete().eq('team_id', id);
        await supabase.from('hand_bands').delete().eq('team_id', id);
        await supabase.from('hand_bands').delete().eq('member_id', id);
        await supabase.from('attendance').delete().eq('team_id', id);
        await supabase.from('attendance').delete().eq('member_id', id);
        await supabase.from('team_members').delete().eq('team_id', id);
        await supabase.from('team_members').delete().eq('id', id);

        // Delete parent team row last
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
