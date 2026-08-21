export type CheckinType = 'ENTRY' | 'EVENT' | 'FOOD';

export interface AttendanceRecord {
  id: string;
  participant_id: string;
  agent_id: string;
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
  id: string;
  participant_id: string;
  agent_id: string;
  participant_name: string;
  meal_session: 'LUNCH' | 'SNACKS' | 'REFRESHMENTS';
  collected: boolean;
  collected_at?: string;
  scanned_by: string;
}
