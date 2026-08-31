export type CheckinType = 'ENTRY' | 'EVENT' | 'FOOD';

export interface AttendanceRecord {
  id?: string;
  team_id: string;
  member_id?: string;
  agent_id?: string; // alias for team_id / member_id
  passport_token_used?: string;
  participant_name: string;
  college: string;
  checkin_type: CheckinType;
  event_id?: string;
  event_name?: string;
  scanned_by: string;
  scanned_at: string;
  location?: string;
}

export interface FoodRecord {
  team_id: string;
  member_id: string;
  participant_name: string;
  meal_session: 'LUNCH' | 'SNACKS' | 'REFRESHMENTS';
  collected: boolean;
  collected_at?: string;
  scanned_by: string;
}
