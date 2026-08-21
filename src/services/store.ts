import { 
  Participant, 
  EventMission, 
  AttendanceRecord, 
  FoodRecord, 
  Certificate, 
  AdminUser, 
  AdminRole 
} from '@packages/types/src';
import { OFFICIAL_MISSIONS } from '@packages/config/src/events';
import { generateAgentId, generateQrToken } from '@packages/utils/src/participant-id';

// Initial preloaded mock participants for testing and instant verification
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
    registered_events: ['msn-infinity-protocol'], // Single event only
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
    created_at: '2026-08-20T11:45:00Z'
  }
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
  }
];

const INITIAL_FOOD: FoodRecord[] = [
  {
    id: 'food-01',
    participant_id: 'p-101',
    agent_id: 'ZIN26-A8F41C',
    participant_name: 'Kanishkar M',
    meal_session: 'LUNCH',
    collected: true,
    collected_at: '2026-08-21T12:43:00Z',
    scanned_by: 'Food Station 02'
  }
];

const INITIAL_CERTIFICATES: Certificate[] = [
  {
    id: 'cert-01',
    certificate_number: 'ZIN26-CERT-1001',
    participant_id: 'p-101',
    participant_name: 'Kanishkar M',
    college: 'Government College of Engineering',
    event_id: 'msn-sys-recovery',
    event_title: 'Operation: System Recovery (Debugging)',
    type: 'PARTICIPATION',
    issue_date: '2026-08-21',
    verified: true
  }
];

const STORAGE_KEYS = {
  PARTICIPANTS: 'zin26_participants',
  ATTENDANCE: 'zin26_attendance',
  FOOD: 'zin26_food',
  CERTIFICATES: 'zin26_certificates',
  CURRENT_USER: 'zin26_current_agent',
  ADMIN_ROLE: 'zin26_admin_role'
};

class ZinniaStore {
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

  // Participants
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

  registerParticipant(data: Omit<Participant, 'id' | 'agent_id' | 'qr_token' | 'clearance_level' | 'status' | 'created_at'>): Participant {
    const participants = this.getParticipants();
    
    // Check for duplicate email
    const existing = participants.find(p => p.email.toLowerCase() === data.email.toLowerCase());
    if (existing) {
      throw new Error(`Temporal agent with email ${data.email} already exists in the CHRONOS database.`);
    }

    const agent_id = generateAgentId();
    const qr_token = generateQrToken();
    
    // Determine clearance level based on event count & types
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
      created_at: new Date().toISOString()
    };

    participants.push(newParticipant);
    this.setStorage(STORAGE_KEYS.PARTICIPANTS, participants);
    this.setCurrentParticipant(newParticipant);
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

  // Events
  getEvents(): EventMission[] {
    return OFFICIAL_MISSIONS;
  }

  getEventById(id: string): EventMission | undefined {
    return OFFICIAL_MISSIONS.find(e => e.id === id);
  }

  // Attendance
  getAttendance(): AttendanceRecord[] {
    return this.getStorage(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
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
    return { success: true, message: `Mission check-in verified: ${event.mission_name}`, record };
  }

  // Food
  getFoodRecords(): FoodRecord[] {
    return this.getStorage(STORAGE_KEYS.FOOD, INITIAL_FOOD);
  }

  recordFoodDistribution(agentId: string, mealSession: 'LUNCH' | 'SNACKS' = 'LUNCH', scannedBy = 'Food Counter'): { success: boolean; message: string; record?: FoodRecord } {
    const participant = this.getParticipantByAgentId(agentId);
    if (!participant) {
      return { success: false, message: `Agent ID "${agentId}" not recognized.` };
    }

    const foodRecords = this.getFoodRecords();
    const existing = foodRecords.find(
      f => f.participant_id === participant.id && f.meal_session === mealSession
    );

    if (existing && existing.collected) {
      const timeStr = existing.collected_at ? new Date(existing.collected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'earlier';
      return {
        success: false,
        message: `FOOD TOKEN ALREADY REDEEMED: ${participant.name} collected ${mealSession} at ${timeStr}.`
      };
    }

    const record: FoodRecord = {
      id: 'food-' + Date.now(),
      participant_id: participant.id,
      agent_id: participant.agent_id,
      participant_name: participant.name,
      meal_session: mealSession,
      collected: true,
      collected_at: new Date().toISOString(),
      scanned_by: scannedBy
    };

    foodRecords.unshift(record);
    this.setStorage(STORAGE_KEYS.FOOD, foodRecords);
    return { success: true, message: `${mealSession} token verified for ${participant.name}`, record };
  }

  // Certificates
  getCertificates(): Certificate[] {
    return this.getStorage(STORAGE_KEYS.CERTIFICATES, INITIAL_CERTIFICATES);
  }

  issueCertificate(participantId: string, eventId: string | undefined, type: Certificate['type']): Certificate {
    const participant = this.getParticipants().find(p => p.id === participantId);
    if (!participant) throw new Error('Participant not found');

    const event = eventId ? this.getEventById(eventId) : undefined;
    const certNum = `ZIN26-CERT-${Math.floor(1000 + Math.random() * 9000)}`;

    const cert: Certificate = {
      id: 'cert-' + Date.now(),
      certificate_number: certNum,
      participant_id: participant.id,
      participant_name: participant.name,
      college: participant.college,
      event_id: event?.id,
      event_title: event ? `${event.mission_name} (${event.title})` : 'Symposium Participation',
      type,
      issue_date: new Date().toISOString().split('T')[0],
      verified: true
    };

    const certs = this.getCertificates();
    certs.unshift(cert);
    this.setStorage(STORAGE_KEYS.CERTIFICATES, certs);
    return cert;
  }

  // Current session participant (for participant portal)
  getCurrentParticipant(): Participant | null {
    return this.getStorage(STORAGE_KEYS.CURRENT_USER, null);
  }

  setCurrentParticipant(participant: Participant | null): void {
    this.setStorage(STORAGE_KEYS.CURRENT_USER, participant);
  }

  // Admin Active Role
  getAdminRole(): AdminRole {
    return this.getStorage(STORAGE_KEYS.ADMIN_ROLE, 'SUPER_ADMIN');
  }

  setAdminRole(role: AdminRole): void {
    this.setStorage(STORAGE_KEYS.ADMIN_ROLE, role);
  }
}

export const store = new ZinniaStore();
