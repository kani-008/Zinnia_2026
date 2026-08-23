import { ClearanceLevel } from './participant';

export type EventType = 'TECH' | 'NON_TECH';
export type EventCategory = 'TECHNICAL' | 'NON_TECHNICAL';
export type EventStatus = 'AVAILABLE' | 'REGISTRATION_CLOSED' | 'LIVE' | 'CONCLUDED' | 'IN_PROGRESS' | 'COMPLETED' | 'LOCKED';

export interface EventMission {
  id: string;
  code: string;
  mission_name: string;
  title: string;
  event_type: EventType; // Required TECH or NON_TECH
  category: EventCategory;
  clearance_level: ClearanceLevel;
  team_size_min: number;
  team_size_max: number;
  is_single_event_only?: boolean;
  schedule_time: string;
  duration: string;
  venue: string;
  description: string;
  rules: string[];
  status: EventStatus;
  
  // Results Finalization
  results_finalized?: boolean;
  results_finalized_at?: string;
  
  coordinators?: {
    name: string;
    role: string;
    phone?: string;
  }[];
  prizes?: {
    first?: string;
    second?: string;
    third?: string;
  };
}

export type PrizePosition = 1 | 2 | 3 | null;

export interface EventRegistration {
  agent_id: string;
  event_id: string;
  team_name?: string;
  team_members?: string[];
  position?: PrizePosition; // 1 = 1st Prize, 2 = 2nd Prize, 3 = 3rd Prize, null = Participated
  registered_at: string;
}
