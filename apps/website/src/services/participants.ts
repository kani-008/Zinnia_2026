import { store } from '../../../src/services/store';
import { Participant } from '@packages/types/src';

export const participantsService = {
  getById: (agentId: string): Participant | undefined => {
    return store.getParticipantByAgentId(agentId);
  },
  getAll: (): Participant[] => {
    return store.getParticipants();
  }
};
