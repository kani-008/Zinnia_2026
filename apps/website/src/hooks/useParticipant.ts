import { useState, useEffect } from 'react';
import { Participant } from '@packages/types/src';
import { participantsService } from '../services/participants';

export function useParticipant(agentId?: string) {
  const [participant, setParticipant] = useState<Participant | null>(null);

  useEffect(() => {
    if (agentId) {
      const p = participantsService.getById(agentId);
      setParticipant(p || null);
    }
  }, [agentId]);

  return { participant, setParticipant };
}
