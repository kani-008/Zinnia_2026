export type ClearanceLevel = 'LEVEL 01' | 'LEVEL 02' | 'LEVEL 03' | 'CLASSIFIED';

export type ParticipantStatus = 'ACTIVE' | 'PENDING' | 'DISQUALIFIED';

export interface Participant {
  id: string;
  agent_id: string; // e.g. "ZIN26-A8F41C"
  name: string;
  email: string;
  phone: string;
  college: string;
  department: string;
  year: 'I' | 'II' | 'III' | 'IV' | 'PG';
  clearance_level: ClearanceLevel;
  status: ParticipantStatus;
  qr_token: string;
  registered_events: string[];
  created_at: string;
}
