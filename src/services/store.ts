import { 
  Participant, 
  EventMission, 
  AttendanceRecord, 
  AdminRole,
  EventRegistration,
  PrizePosition,
  EventType
} from '@packages/types/src';
import { OFFICIAL_MISSIONS } from '@packages/config/src/events';
import { generateAgentId, generateQrToken } from '@packages/utils/src/participant-id';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Initial preloaded mock participants
const INITIAL_PARTICIPANTS: Participant[] = [
  {
    id: 'p-101',
    agent_id: 'ZIN26-A8F41C',
    name: 'Kanishkar M',
    email: 'kanishkar@gce.ac.in',
    phone: '9840198765',
    college: 'Government College of Engineering',
    department: 'Computer Science & Engineering',
    year: 'IV',
    clearance_level: 'LEVEL 03',
    status: 'ACTIVE',
    qr_token: 'tok_kani_001',
    registered_events: ['msn-sys-recovery', 'msn-oracle', 'msn-borderland-gce'],
    food_collected: true,
    food_collected_at: '2026-08-21T12:43:00Z',
    created_at: '2026-08-20T09:30:00Z'
  },
  {
    id: 'p-102',
    agent_id: 'ZIN26-B9K3D2',
    name: 'Harini D',
    email: 'harini.d@mit.edu',
    phone: '9445123456',
    college: 'Madras Institute of Technology',
    department: 'Information Technology',
    year: 'III',
    clearance_level: 'LEVEL 02',
    status: 'ACTIVE',
    qr_token: 'tok_harini_002',
    registered_events: ['msn-broken-records', 'msn-think-strike-win'],
    food_collected: false,
    created_at: '2026-08-20T10:15:00Z'
  },
  {
    id: 'p-103',
    agent_id: 'ZIN26-X7R9Q4',
    name: 'Siddharth V',
    email: 'siddharth@psgtech.ac.in',
    phone: '9894011223',
    college: 'PSG College of Technology',
    department: 'Computer Science & Engineering',
    year: 'III',
    clearance_level: 'LEVEL 03',
    status: 'ACTIVE',
    qr_token: 'tok_sid_003',
    registered_events: ['msn-infinity-protocol'],
    food_collected: false,
    created_at: '2026-08-20T11:00:00Z'
  },
  {
    id: 'p-104',
    agent_id: 'ZIN26-N4M2L8',
    name: 'Ananya S',
    email: 'ananya.s@ssn.edu.in',
    phone: '9789055443',
    college: 'SSN College of Engineering',
    department: 'Artificial Intelligence & Data Science',
    year: 'II',
    clearance_level: 'LEVEL 02',
    status: 'ACTIVE',
    qr_token: 'tok_ananya_004',
    registered_events: ['msn-mission-control', 'msn-plot-twist'],
    food_collected: false,
    created_at: '2026-08-20T11:45:00Z'
  }
];

const INITIAL_REGISTRATIONS: EventRegistration[] = [
  { id: 'reg-01', event_id: 'msn-sys-recovery', participant_id: 'p-101', position: 1, registered_at: '2026-08-20T09:30:00Z' },
  { id: 'reg-02', event_id: 'msn-oracle', participant_id: 'p-101', position: null, registered_at: '2026-08-20T09:30:00Z' },
  { id: 'reg-03', event_id: 'msn-borderland-gce', participant_id: 'p-101', team_name: 'BLACK PHANTOMS', position: 2, registered_at: '2026-08-20T09:30:00Z' },
  { id: 'reg-04', event_id: 'msn-broken-records', participant_id: 'p-102', position: null, registered_at: '2026-08-20T10:15:00Z' },
  { id: 'reg-05', event_id: 'msn-think-strike-win', participant_id: 'p-102', position: 1, registered_at: '2026-08-20T10:15:00Z' },
  { id: 'reg-06', event_id: 'msn-infinity-protocol', participant_id: 'p-103', team_name: 'NEURAL FORGE', position: null, registered_at: '2026-08-20T11:00:00Z' },
  { id: 'reg-07', event_id: 'msn-mission-control', participant_id: 'p-104', position: null, registered_at: '2026-08-20T11:45:00Z' },
  { id: 'reg-08', event_id: 'msn-plot-twist', participant_id: 'p-104', position: 3, registered_at: '2026-08-20T11:45:00Z' }
];

const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att-01',
    participant_id: 'p-101',
    agent_id: 'ZIN26-A8F41C',
    participant_name: 'Kanishkar M',
    college: 'Government College of Engineering',
    checkin_type: 'ENTRY',
    scanned_by: 'Main Gate Terminal 01',
    scanned_at: '2026-08-21T09:42:00Z',
    location: 'Main Gate Archive'
  },
  {
    id: 'att-02',
    participant_id: 'p-101',
    agent_id: 'ZIN26-A8F41C',
    participant_name: 'Kanishkar M',
    college: 'Government College of Engineering',
    checkin_type: 'EVENT',
    event_id: 'msn-sys-recovery',
    event_name: 'Operation: System Recovery',
    scanned_by: 'Desk 01',
    scanned_at: '2026-08-21T10:05:00Z',
    location: 'Cyber Lab 01'
  },
  {
    id: 'att-03',
    participant_id: 'p-101',
    agent_id: 'ZIN26-A8F41C',
    participant_name: 'Kanishkar M',
    college: 'Government College of Engineering',
    checkin_type: 'EVENT',
    event_id: 'msn-borderland-gce',
    event_name: 'Borderland at GCE',
    scanned_by: 'Desk 06',
    scanned_at: '2026-08-21T10:50:00Z',
    location: 'Campus Quadrangle'
  }
];

const STORAGE_KEYS = {
  PARTICIPANTS: 'zin26_participants_v2',
  EVENTS: 'zin26_events_v2',
  REGISTRATIONS: 'zin26_registrations_v2',
  ATTENDANCE: 'zin26_attendance_v2',
  CURRENT_USER: 'zin26_current_agent_v2',
  ADMIN_ROLE: 'zin26_admin_role_v2'
};

class ZinniaStore {
  constructor() {
    this.syncFromSupabase();
  }

  private async syncFromSupabase() {
    if (!isSupabaseConfigured()) return;

    try {
      const { data: dbParticipants } = await supabase.from('participants').select('*');
      if (dbParticipants && dbParticipants.length > 0) {
        const local = this.getParticipants();
        const merged = [...local];
        dbParticipants.forEach((dp: any) => {
          if (!merged.find(p => p.agent_id === dp.agent_id)) {
            merged.push(dp);
          }
        });
        this.setStorage(STORAGE_KEYS.PARTICIPANTS, merged);
      }
    } catch (e) {
      console.info('Supabase background sync:', e);
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
      console.warn('Storage write failed', e);
    }
  }

  // --- PARTICIPANTS ---
  getParticipants(): Participant[] {
    return this.getStorage(STORAGE_KEYS.PARTICIPANTS, INITIAL_PARTICIPANTS);
  }

  getParticipantByAgentId(agentId: string): Participant | undefined {
    const cleaned = agentId.trim().toUpperCase();
    return this.getParticipants().find(p => p.agent_id.toUpperCase() === cleaned);
  }

  getParticipantByIdOrEmail(query: string): Participant | undefined {
    const cleaned = query.trim().toLowerCase();
    return this.getParticipants().find(
      p => p.agent_id.toLowerCase() === cleaned || p.email.toLowerCase() === cleaned
    );
  }

  registerParticipant(data: Omit<Participant, 'id' | 'agent_id' | 'qr_token' | 'clearance_level' | 'status' | 'created_at' | 'food_collected' | 'food_collected_at'>): Participant {
    const participants = this.getParticipants();
    
    // Check for duplicate email
    const existing = participants.find(p => p.email.toLowerCase() === data.email.toLowerCase());
    if (existing) {
      throw new Error(`Temporal agent with email ${data.email} already exists in the CHRONOS database.`);
    }

    const agent_id = generateAgentId();
    const qr_token = generateQrToken();
    
    let clearance: Participant['clearance_level'] = 'LEVEL 01';
    if (data.registered_events.includes('msn-infinity-protocol')) {
      clearance = 'LEVEL 03';
    } else if (data.registered_events.length >= 3 || data.registered_events.includes('msn-oracle') || data.registered_events.includes('msn-mission-control')) {
      clearance = 'LEVEL 02';
    }

    const newParticipant: Participant = {
      ...data,
      id: 'p-' + Date.now(),
      agent_id,
      clearance_level: clearance,
      status: 'ACTIVE',
      qr_token,
      food_collected: false,
      created_at: new Date().toISOString()
    };

    participants.push(newParticipant);
    this.setStorage(STORAGE_KEYS.PARTICIPANTS, participants);
    this.setCurrentParticipant(newParticipant);

    // Create event registrations
    const registrations = this.getEventRegistrations();
    data.registered_events.forEach(eventId => {
      registrations.push({
        id: 'reg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        event_id: eventId,
        participant_id: newParticipant.id,
        position: null,
        registered_at: new Date().toISOString()
      });
    });
    this.setStorage(STORAGE_KEYS.REGISTRATIONS, registrations);

    // Push to Supabase if live
    if (isSupabaseConfigured()) {
      supabase.from('participants').insert([{
        agent_id: newParticipant.agent_id,
        name: newParticipant.name,
        email: newParticipant.email,
        phone: newParticipant.phone,
        college: newParticipant.college,
        department: newParticipant.department,
        year: newParticipant.year,
        clearance_level: newParticipant.clearance_level,
        status: newParticipant.status,
        qr_token: newParticipant.qr_token,
        registered_events: newParticipant.registered_events,
        food_collected: false
      }]).then(({ error }) => {
        if (error) console.warn('Supabase participant insert notice:', error.message);
      });
    }

    return newParticipant;
  }

  updateParticipant(participant: Participant): void {
    const participants = this.getParticipants();
    const index = participants.findIndex(p => p.id === participant.id);
    if (index !== -1) {
      participants[index] = participant;
      this.setStorage(STORAGE_KEYS.PARTICIPANTS, participants);
    }
  }

  deleteParticipant(id: string): void {
    const participants = this.getParticipants().filter(p => p.id !== id);
    this.setStorage(STORAGE_KEYS.PARTICIPANTS, participants);
  }

  // --- EVENTS (TECH & NON_TECH) ---
  getEvents(filterType?: EventType): EventMission[] {
    const events = this.getStorage(STORAGE_KEYS.EVENTS, OFFICIAL_MISSIONS);
    if (filterType) {
      return events.filter(e => e.event_type === filterType);
    }
    return events;
  }

  getEventById(id: string): EventMission | undefined {
    return this.getEvents().find(e => e.id === id);
  }

  updateEvent(event: EventMission): void {
    const events = this.getEvents();
    const index = events.findIndex(e => e.id === event.id);
    if (index !== -1) {
      events[index] = event;
      this.setStorage(STORAGE_KEYS.EVENTS, events);
    }
  }

  finalizeEventResults(eventId: string, finalize = true): void {
    const events = this.getEvents();
    const index = events.findIndex(e => e.id === eventId);
    if (index !== -1) {
      events[index].results_finalized = finalize;
      events[index].results_finalized_at = finalize ? new Date().toISOString() : undefined;
      events[index].status = finalize ? 'COMPLETED' : 'AVAILABLE';
      this.setStorage(STORAGE_KEYS.EVENTS, events);

      if (isSupabaseConfigured()) {
        supabase.from('events').update({
          results_finalized: finalize,
          results_finalized_at: events[index].results_finalized_at,
          status: events[index].status
        }).eq('id', eventId).then();
      }
    }
  }

  // --- EVENT REGISTRATIONS & PRIZE POSITIONS ---
  getEventRegistrations(): EventRegistration[] {
    return this.getStorage(STORAGE_KEYS.REGISTRATIONS, INITIAL_REGISTRATIONS);
  }

  getRegistrationsForEvent(eventId: string): EventRegistration[] {
    return this.getEventRegistrations().filter(r => r.event_id === eventId);
  }

  /**
   * Assign prize position (1 = 1st, 2 = 2nd, 3 = 3rd, null = reset).
   * For teams: assigning to a team assigns the same prize position to all members of that team.
   */
  assignPrizePosition(eventId: string, targetParticipantIdOrTeam: string, position: PrizePosition, isTeam = false): void {
    const registrations = this.getEventRegistrations();

    registrations.forEach(r => {
      if (r.event_id === eventId) {
        if (isTeam && r.team_name && r.team_name === targetParticipantIdOrTeam) {
          r.position = position;
        } else if (!isTeam && r.participant_id === targetParticipantIdOrTeam) {
          r.position = position;
        }
      }
    });

    this.setStorage(STORAGE_KEYS.REGISTRATIONS, registrations);

    if (isSupabaseConfigured()) {
      if (isTeam) {
        supabase.from('event_registrations').update({ position })
          .eq('event_id', eventId)
          .eq('team_name', targetParticipantIdOrTeam).then();
      } else {
        supabase.from('event_registrations').update({ position })
          .eq('event_id', eventId)
          .eq('participant_id', targetParticipantIdOrTeam).then();
      }
    }
  }

  // --- ATTENDANCE & PARTICIPATION CHECK-INS ---
  getAttendance(): AttendanceRecord[] {
    return this.getStorage(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
  }

  getAttendanceByParticipant(participantId: string): AttendanceRecord[] {
    return this.getAttendance().filter(a => a.participant_id === participantId);
  }

  recordEntryCheckin(agentId: string, scannedBy = 'Entry Terminal'): { success: boolean; message: string; record?: AttendanceRecord } {
    const participant = this.getParticipantByAgentId(agentId);
    if (!participant) {
      return { success: false, message: `Agent ID "${agentId}" not recognized in the CHRONOS directory.` };
    }

    const attendance = this.getAttendance();
    const alreadyCheckedIn = attendance.find(
      a => a.participant_id === participant.id && a.checkin_type === 'ENTRY'
    );

    if (alreadyCheckedIn) {
      const timeStr = new Date(alreadyCheckedIn.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return { 
        success: false, 
        message: `Agent is ALREADY CHECKED IN at ${timeStr} via ${alreadyCheckedIn.scanned_by}. Duplicate entry prevented.` 
      };
    }

    const record: AttendanceRecord = {
      id: 'att-' + Date.now(),
      participant_id: participant.id,
      agent_id: participant.agent_id,
      participant_name: participant.name,
      college: participant.college,
      checkin_type: 'ENTRY',
      scanned_by: scannedBy,
      scanned_at: new Date().toISOString(),
      location: 'Main Security Gate'
    };

    attendance.unshift(record);
    this.setStorage(STORAGE_KEYS.ATTENDANCE, attendance);

    if (isSupabaseConfigured()) {
      supabase.from('attendance').insert([{
        participant_id: record.participant_id,
        agent_id: record.agent_id,
        checkin_type: record.checkin_type,
        scanned_by: record.scanned_by,
        location: record.location
      }]).then();
    }

    return { success: true, message: `Entry granted for ${participant.name} (${participant.agent_id})`, record };
  }

  recordEventCheckin(agentId: string, eventId: string, scannedBy = 'Event Desk'): { success: boolean; message: string; record?: AttendanceRecord } {
    const participant = this.getParticipantByAgentId(agentId);
    if (!participant) {
      return { success: false, message: `Agent ID "${agentId}" not found.` };
    }

    const event = this.getEventById(eventId);
    if (!event) {
      return { success: false, message: 'Invalid mission selected.' };
    }

    if (!participant.registered_events.includes(eventId)) {
      return {
        success: false,
        message: `ACCESS DENIED: Agent ${participant.name} is NOT registered for mission "${event.mission_name}".`
      };
    }

    const attendance = this.getAttendance();
    const alreadyCheckedIn = attendance.find(
      a => a.participant_id === participant.id && a.checkin_type === 'EVENT' && a.event_id === eventId
    );

    if (alreadyCheckedIn) {
      return {
        success: false,
        message: `Agent ${participant.name} was already verified for this mission at ${new Date(alreadyCheckedIn.scanned_at).toLocaleTimeString()}.`
      };
    }

    const record: AttendanceRecord = {
      id: 'att-' + Date.now(),
      participant_id: participant.id,
      agent_id: participant.agent_id,
      participant_name: participant.name,
      college: participant.college,
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
        participant_id: record.participant_id,
        agent_id: record.agent_id,
        checkin_type: record.checkin_type,
        event_id: record.event_id,
        scanned_by: record.scanned_by,
        location: record.location
      }]).then();
    }

    return { success: true, message: `Mission participation verified: ${event.mission_name}`, record };
  }

  // --- SIMPLIFIED FOOD TRACKING (Direct on Participant record) ---
  recordFoodDistribution(agentId: string, scannedBy = 'Food Counter'): { success: boolean; message: string; participant?: Participant } {
    const participant = this.getParticipantByAgentId(agentId);
    if (!participant) {
      return { success: false, message: `Agent ID "${agentId}" not recognized.` };
    }

    if (participant.food_collected) {
      const timeStr = participant.food_collected_at 
        ? new Date(participant.food_collected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        : 'earlier';
      return {
        success: false,
        message: `FOOD TOKEN ALREADY REDEEMED: ${participant.name} collected lunch at ${timeStr}.`
      };
    }

    participant.food_collected = true;
    participant.food_collected_at = new Date().toISOString();
    this.updateParticipant(participant);

    if (isSupabaseConfigured()) {
      supabase.from('participants').update({
        food_collected: true,
        food_collected_at: participant.food_collected_at
      }).eq('agent_id', participant.agent_id).then();
    }

    return { success: true, message: `Meal token verified for ${participant.name} (${participant.agent_id})`, participant };
  }

  // --- PARTICIPANT SESSION & ADMIN ROLE ---
  getCurrentParticipant(): Participant | null {
    return this.getStorage(STORAGE_KEYS.CURRENT_USER, null);
  }

  setCurrentParticipant(participant: Participant | null): void {
    this.setStorage(STORAGE_KEYS.CURRENT_USER, participant);
  }

  getAdminRole(): AdminRole {
    return this.getStorage(STORAGE_KEYS.ADMIN_ROLE, 'SUPER_ADMIN');
  }

  setAdminRole(role: AdminRole): void {
    this.setStorage(STORAGE_KEYS.ADMIN_ROLE, role);
  }
}

export const store = new ZinniaStore();
