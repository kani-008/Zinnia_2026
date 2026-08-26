import { 
  Team,
  TeamMember,
  Participant, 
  EventMission, 
  AttendanceRecord, 
  AdminRole,
  EventRegistration,
  PrizePosition,
  EventType,
  HandBand
} from '@packages/types/src';
import { OFFICIAL_MISSIONS } from '@packages/config/src/events';
import { generateTeamId, generateMemberId } from '@packages/utils/src/participant-id';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const STORAGE_KEYS = {
  TEAMS: 'zin26_live_teams_v2',
  MEMBERS: 'zin26_live_members_v2',
  EVENTS: 'zin26_live_events_v2',
  REGISTRATIONS: 'zin26_live_registrations_v2',
  ATTENDANCE: 'zin26_live_attendance_v2',
  HAND_BANDS: 'zin26_live_hand_bands_v2',
  CURRENT_TEAM: 'zin26_current_team_v2',
  ADMIN_ROLE: 'zin26_admin_role_v2'
};

class ZinniaStore {
  private listeners: Set<() => void> = new Set();
  private isSyncing = false;

  constructor() {
    this.cleanLegacyStorage();
    this.syncFromSupabase();
    this.setupRealtimeSubscription();
  }

  private cleanLegacyStorage() {
    try {
      ['zin26_participants_v3', 'zin26_attendance_v3', 'zin26_registrations_v3', 'zin26_live_participants_v1'].forEach(k => {
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
    if (!isSupabaseConfigured()) return;
    try {
      supabase
        .channel('public_team_db_sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => this.syncFromSupabase())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, () => this.syncFromSupabase())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => this.syncFromSupabase())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => this.syncFromSupabase())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'event_registrations' }, () => this.syncFromSupabase())
        .subscribe();
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

      // Fallback: If participants table exists from earlier, also check participants
      let teamsToStore: Team[] = [];
      if (!tErr && dbTeams) {
        teamsToStore = dbTeams;
      }

      // 2. Fetch live team_members
      const { data: dbMembers, error: mErr } = await supabase
        .from('team_members')
        .select('*')
        .order('created_at', { ascending: true });

      let membersToStore: TeamMember[] = [];
      if (!mErr && dbMembers) {
        membersToStore = dbMembers;
      }

      // If database has participants table but not teams yet (seamless transition)
      if (teamsToStore.length === 0 && membersToStore.length === 0) {
        const { data: legacyParts } = await supabase.from('participants').select('*');
        if (legacyParts && legacyParts.length > 0) {
          legacyParts.forEach(p => {
            const teamId = p.agent_id;
            const teamObj: Team = {
              team_id: teamId,
              team_name: p.name,
              college: p.college,
              department: p.department,
              year: p.year,
              registered_events: p.registered_events || [],
              payment: p.payment || false,
              created_at: p.created_at
            };
            const memberObj: TeamMember = {
              id: `${teamId}-M1`,
              team_id: teamId,
              name: p.name,
              email: p.email,
              phone: p.phone,
              is_leader: true,
              band_id: p.band_id || undefined,
              food_collected: p.food_collected || false,
              food_collected_at: p.food_collected_at,
              created_at: p.created_at
            };
            teamsToStore.push(teamObj);
            membersToStore.push(memberObj);
          });
        }
      }

      this.setStorage(STORAGE_KEYS.TEAMS, teamsToStore);
      this.setStorage(STORAGE_KEYS.MEMBERS, membersToStore);

      // 3. Fetch live events
      const { data: dbEvents, error: eErr } = await supabase
        .from('events')
        .select('*')
        .order('code', { ascending: true });

      if (!eErr && dbEvents && dbEvents.length > 0) {
        this.setStorage(STORAGE_KEYS.EVENTS, dbEvents);
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

    // Check duplicate emails
    const existingMembers = this.getTeamMembers();
    for (const m of members) {
      const exists = existingMembers.find(em => em.email.toLowerCase() === m.email.toLowerCase());
      if (exists) {
        throw new Error(`Email "${m.email}" is already registered.`);
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

      const serverData = await serverRes.json();
      if (!serverRes.ok || !serverData.success) {
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
      this.notifySubscribers();
      return registeredTeam;
    } catch (apiErr: any) {
      if (apiErr.message && !apiErr.message.includes('fetch')) {
        throw apiErr;
      }
      console.warn('Backend /api/register fallback:', apiErr);
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
        await supabase.from('teams').insert([{
          team_id: newTeam.team_id,
          team_name: newTeam.team_name,
          college: newTeam.college,
          department: newTeam.department,
          year: newTeam.year,
          registered_events: newTeam.registered_events,
          payment: false,
          payment_status: 'AWAITING_PAYMENT'
        }]);

        const memberRows = newMembers.map(m => ({
          id: m.id,
          team_id: m.team_id,
          name: m.name,
          email: m.email,
          phone: m.phone,
          is_leader: m.is_leader,
          passport_token: m.passport_token,
          passport_issued_at: m.passport_issued_at,
          food_collected: false
        }));
        await supabase.from('team_members').insert(memberRows);

        if (teamData.registered_events.length > 0) {
          const regRows = teamData.registered_events.map(eventId => ({
            team_id: newTeam.team_id,
            event_id: eventId,
            team_name: newTeam.team_name,
            registered_at: now
          }));
          await supabase.from('event_registrations').insert(regRows);
        }
      } catch (e) {
        console.warn('Supabase team registration error:', e);
      }
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
  async checkinEntryApi(params: {
    passport_token?: string;
    id?: string;
    scanned_by?: string;
    location?: string;
  }): Promise<{ success: boolean; reason: string; member?: TeamMember; team?: Team }> {
    try {
      const res = await fetch('/api/checkin/entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const data = await res.json();
      await this.syncFromSupabase();
      return {
        success: data.success ?? (res.status === 200),
        reason: data.reason || (data.success ? 'Entry Verified' : 'Check-in failed'),
        member: data.member,
        team: data.team
      };
    } catch (e: any) {
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
  }

  async checkinEventApi(params: {
    passport_token?: string;
    id?: string;
    event_id: string;
    scanned_by?: string;
    location?: string;
  }): Promise<{ success: boolean; reason: string; member?: TeamMember; team?: Team; registered_events?: any[] }> {
    try {
      const res = await fetch('/api/checkin/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const data = await res.json();
      await this.syncFromSupabase();
      return {
        success: data.success ?? (res.status === 200),
        reason: data.reason || (data.success ? 'Event check-in verified' : 'Check-in failed'),
        member: data.member,
        team: data.team,
        registered_events: data.registered_events
      };
    } catch (e: any) {
      // Offline fallback
      const tokenOrId = params.passport_token || params.id || '';
      const localRes = this.recordEventCheckin(tokenOrId, params.event_id, params.scanned_by || 'Event Desk');
      return {
        success: localRes.success,
        reason: localRes.message
      };
    }
  }

  async checkinFoodApi(params: {
    passport_token?: string;
    id?: string;
    scanned_by?: string;
    location?: string;
  }): Promise<{ success: boolean; reason: string; member?: TeamMember; team?: Team }> {
    try {
      const res = await fetch('/api/checkin/food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const data = await res.json();
      await this.syncFromSupabase();
      return {
        success: data.success ?? (res.status === 200),
        reason: data.reason || (data.success ? 'Food token claimed' : 'Claim failed'),
        member: data.member,
        team: data.team
      };
    } catch (e: any) {
      // Offline fallback
      const tokenOrId = params.passport_token || params.id || '';
      const localRes = this.recordFoodDistribution(tokenOrId, params.scanned_by || 'Dining Counter');
      return {
        success: localRes.success,
        reason: localRes.message,
        member: localRes.member
      };
    }
  }

  async resendPassportApi(memberId: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/passport-dispatch/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: memberId })
      });
      const data = await res.json();
      return {
        success: data.success ?? (res.status === 200),
        message: data.message || (data.success ? 'Passport dispatched' : 'Dispatch failed')
      };
    } catch (e: any) {
      return {
        success: false,
        message: e.message || 'Dispatch request failed'
      };
    }
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
    try {
      const res = await fetch(`/api/payment/status?team_id=${teamId}`);
      const data = await res.json();
      return data;
    } catch (e: any) {
      return { success: false, message: e.message || 'Failed to fetch payment status.' };
    }
  }

  async submitPaymentApi(teamId: string, utrNumber: string, submittedAmount: number): Promise<{
    success: boolean;
    message?: string;
    payment_status?: string;
    error_code?: string;
  }> {
    try {
      const res = await fetch('/api/payment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_id: teamId,
          utr_number: utrNumber,
          submitted_amount: submittedAmount
        })
      });
      const data = await res.json();
      await this.syncFromSupabase();
      return data;
    } catch (e: any) {
      return { success: false, message: e.message || 'Failed to submit payment.' };
    }
  }

  async verifyAdminPaymentApi(teamId: string, adminId: string = 'admin_lead'): Promise<{
    success: boolean;
    message?: string;
    payment_status?: string;
  }> {
    try {
      const res = await fetch('/api/admin/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_id: teamId, admin_id: adminId })
      });
      const data = await res.json();
      await this.syncFromSupabase();
      return data;
    } catch (e: any) {
      return { success: false, message: e.message || 'Failed to verify payment.' };
    }
  }

  async rejectAdminPaymentApi(teamId: string, rejectionReason: string, adminId: string = 'admin_lead'): Promise<{
    success: boolean;
    message?: string;
    payment_status?: string;
  }> {
    try {
      const res = await fetch('/api/admin/payment/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_id: teamId, admin_id: adminId, rejection_reason: rejectionReason })
      });
      const data = await res.json();
      await this.syncFromSupabase();
      return data;
    } catch (e: any) {
      return { success: false, message: e.message || 'Failed to reject payment.' };
    }
  }

  async listAdminPaymentsApi(statusFilter?: string): Promise<any[]> {
    try {
      const url = statusFilter ? `/api/admin/payments/list?status=${statusFilter}` : '/api/admin/payments/list';
      const res = await fetch(url);
      const data = await res.json();
      return data.payments || [];
    } catch (e: any) {
      console.warn('Failed to list payments:', e);
      return [];
    }
  }

  // --- EVENTS ---
  getEvents(filterType?: EventType): EventMission[] {
    const events = this.getStorage<EventMission[]>(STORAGE_KEYS.EVENTS, OFFICIAL_MISSIONS);
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

  deleteParticipant(id: string): void {
    const teams = this.getTeams().filter(t => t.team_id !== id && !t.members?.some(m => m.id === id));
    const members = this.getTeamMembers().filter(m => m.id !== id && m.team_id !== id);

    this.setStorage(STORAGE_KEYS.TEAMS, teams);
    this.setStorage(STORAGE_KEYS.MEMBERS, members);

    if (isSupabaseConfigured()) {
      supabase.from('teams').delete().eq('team_id', id).then();
      supabase.from('team_members').delete().eq('id', id).then();
      supabase.from('team_members').delete().eq('team_id', id).then();
      supabase.from('hand_bands').delete().eq('team_id', id).then();
    }

    this.notifySubscribers();
  }

  // --- CURRENT USER & ADMIN ROLE ---
  getCurrentTeam(): Team | null {
    return this.getStorage(STORAGE_KEYS.CURRENT_TEAM, null);
  }

  setCurrentTeam(team: Team | null): void {
    this.setStorage(STORAGE_KEYS.CURRENT_TEAM, team);
  }

  getAdminRole(): AdminRole {
    return this.getStorage(STORAGE_KEYS.ADMIN_ROLE, 'SUPER_ADMIN');
  }

  setAdminRole(role: AdminRole): void {
    this.setStorage(STORAGE_KEYS.ADMIN_ROLE, role);
  }
}

export const store = new ZinniaStore();
