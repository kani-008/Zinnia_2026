export interface TeamMember {
  id: string; // Unique Member UUID / ID e.g. "MEM-ZIN26-1"
  team_id: string; // References Team.team_id
  name: string;
  email: string;
  phone: string;
  is_leader: boolean;
  
  // Physical wristband QR code assigned to this member
  band_id?: string;
  
  // Individual food token claim status
  food_collected?: boolean;
  food_collected_at?: string;
  
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
