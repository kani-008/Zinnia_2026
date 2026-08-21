import { store } from '../../../src/services/store';
import { EventMission } from '@packages/types/src';

export const eventsService = {
  getAll: (): EventMission[] => {
    return store.getEvents();
  },
  getById: (id: string): EventMission | undefined => {
    return store.getEventById(id);
  }
};
