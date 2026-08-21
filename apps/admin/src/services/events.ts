import { store } from '../../../src/services/store';
import { EventMission } from '@packages/types/src';

export const adminEventsService = {
  getAll: (): EventMission[] => store.getEvents(),
  getById: (id: string): EventMission | undefined => store.getEventById(id)
};
