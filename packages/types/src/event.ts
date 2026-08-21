import { ClearanceLevel } from './participant';

export type EventCategory = 'TECHNICAL' | 'NON_TECHNICAL';

export type EventStatus = 'AVAILABLE' | 'REGISTRATION_CLOSED' | 'LIVE' | 'CONCLUDED';

export interface EventMission {
  id: string;
  code: string;
  mission_name: string;
  title: string;
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
  coordinators: {
    name: string;
    role: string;
    phone?: string;
  }[];
  prizes?: {
    first?: string;
    second?: string;
    third?: string;
  };
  status: EventStatus;
}
