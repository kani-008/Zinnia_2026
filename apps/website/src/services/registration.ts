import { store } from '../../../src/services/store';
import { Participant } from '@packages/types/src';

export const registrationService = {
  register: (data: Omit<Participant, 'id' | 'agent_id' | 'qr_token' | 'clearance_level' | 'status' | 'created_at'>): Participant => {
    return store.registerParticipant(data);
  }
};
