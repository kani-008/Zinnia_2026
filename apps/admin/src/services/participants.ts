import { store } from '../../../src/services/store';
import { Participant } from '@packages/types/src';

export const adminParticipantsService = {
  getAll: (): Participant[] => store.getParticipants(),
  getById: (id: string): Participant | undefined => store.getParticipantByAgentId(id),
  delete: (id: string) => store.deleteParticipant(id),
  update: (p: Participant) => store.updateParticipant(p)
};
