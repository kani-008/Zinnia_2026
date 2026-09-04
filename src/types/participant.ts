export type ClearanceLevel = 'ALL' | 'STUDENT' | 'DELEGATE' | string;

export interface TeamMember {
  id: string; // Unique Member UUID / ID e.g. "ATT-1045-1"
  team_id: string; // References Team.team_id
  name: string;
  email: string;
  phone: string;
  is_leader: boolean;
  
  // Secure Passport Token (encoded inside QR code)
  passport_token: string;
  passport_issued_at?: string;
  passport_sent_at?: string;
  
  // Individual food token claim status and preference
  food_preference?: 'VEG' | 'NON_VEG';
  food_collected?: boolean;
  food_collected_at?: string;
  
  created_at: string;
}

export interface PassportDispatchRecord {
  id: string;
  member_id: string;
  channel: 'EMAIL' | 'WHATSAPP' | 'SMS';
  status: 'PENDING' | 'SENT' | 'FAILED';
  provider_ref?: string;
  error_message?: string;
  sent_at?: string;
  created_at: string;
}

export interface Team {
  team_id: string; // Primary Key e.g. "ZIN-2026-1045"
  team_name: string;
  college: string;
  department: string;
  year: 'I' | 'II' | 'III' | 'IV' | 'PG' | string;
  registered_events: string[];
  payment: boolean;
  payment_status?: string;
  utr_number?: string;
  
  members?: TeamMember[];
  
  created_at: string;
  updated_at?: string;
}

// Backward compatibility alias while codebase transitions
export type Participant = Team & {
  agent_id?: string;
  name?: string;
  email?: string;
  phone?: string;
  passport_token?: string;
  food_preference?: 'VEG' | 'NON_VEG';
  food_collected?: boolean;
  food_collected_at?: string;
};
