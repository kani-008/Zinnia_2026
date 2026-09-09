import { ClearanceLevel } from './participant';

export type EventType = 'TECH' | 'NON_TECH';
export type EventCategory = 'TECHNICAL' | 'NON_TECHNICAL' | 'VALEDICTORY';
export type EventStatus = 'AVAILABLE' | 'REGISTRATION_CLOSED' | 'LIVE' | 'CONCLUDED' | 'IN_PROGRESS' | 'COMPLETED' | 'LOCKED';

export interface EventMission {
  id: string;
  code: string;
  /** explicit render position; grids sort by this, never by code or DB order */
  display_order?: number;
  /** the flagship event — gets the crown treatment */
  is_mega?: boolean;
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
  tagline?: string;
  icon_name?: string;
  rules: string[];
  /**
   * The three-or-so lines the dashboard card shows.
   *
   * Deliberately not `rules`: the card sits inside a small panel a
   * participant reads while choosing, and the full list belongs in the
   * event popup they open once they are interested. Falls back to `rules`
   * when absent, so a new event is never blank.
   */
  card_rules?: string[];
  /**
   * A comic callout at the top of the event popup, for the one or two
   * events where something is genuinely urgent - a capped field, an early
   * close. Optional on purpose: if every event shouts, none of them do.
   */
  urgency_note?: string;
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
  youtube_embed_url?: string;
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
