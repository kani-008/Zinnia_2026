export interface TeamMember {
  id: string; // Unique Member UUID / ID e.g. "MEM-ZIN26-1"
  team_id: string; // References Team.team_id
  name: string;
  email: string;
  phone: string;
  is_leader: boolean;
  
  // Secure Passport Token (encoded inside QR code)
  passport_token: string;
  passport_issued_at?: string;
  passport_sent_at?: string;
  
  // Legacy / optional fallback during transition
  band_id?: string;
  
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
  team_id: string; // Primary Key e.g. "ZIN26-T8X92B"
  team_name: string;
  college: string;
  department: string;
  year: 'I' | 'II' | 'III' | 'IV' | 'PG' | string;
  registered_events: string[];
  payment: boolean;
  
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
  band_id?: string;
  food_collected?: boolean;
  food_collected_at?: string;
};

export interface HandBand {
  band_id: string; // PRIMARY KEY
  member_id: string; // Team Member ID Reference
  team_id: string; // Team ID Reference
  assigned_at: string;
}

