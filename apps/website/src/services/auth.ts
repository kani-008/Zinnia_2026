import { store } from '../../../src/services/store';
import { Participant } from '@packages/types/src';

export const authService = {
  login: async (identifier: string): Promise<Participant | null> => {
    const participant = store.getParticipantByIdOrEmail(identifier);
    if (participant) {
      store.setCurrentParticipant(participant);
      return participant;
    }
    return null;
  },
  logout: () => {
    store.setCurrentParticipant(null);
  },
  getCurrentUser: (): Participant | null => {
    return store.getCurrentParticipant();
  }
};
