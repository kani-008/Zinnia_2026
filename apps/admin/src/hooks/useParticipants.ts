import { useState } from 'react';
import { adminParticipantsService } from '../services/participants';
import { Participant } from '@packages/types/src';

export function useParticipants() {
  const [participants, setParticipants] = useState<Participant[]>(adminParticipantsService.getAll());

  const refresh = () => setParticipants(adminParticipantsService.getAll());

  return { participants, refresh };
}
