import { useState } from 'react';
import { EventMission } from '@packages/types/src';
import { eventsService } from '../services/events';

export function useEvents() {
  const [events] = useState<EventMission[]>(eventsService.getAll());
  return { events };
}
