import { useState } from 'react';
import { parseQRPayload } from '@packages/utils/src/qr';
import { adminParticipantsService } from '../services/participants';
import { Participant } from '@packages/types/src';

export function useScanner() {
  const [scannedAgent, setScannedAgent] = useState<Participant | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processScan = (rawText: string) => {
    setError(null);
    const { agent_id, isValid } = parseQRPayload(rawText);
    if (!isValid || !agent_id) {
      setError('Invalid QR code format.');
      return null;
    }

    const p = adminParticipantsService.getById(agent_id);
    if (!p) {
      setError(`Agent ${agent_id} not found.`);
      return null;
    }

    setScannedAgent(p);
    return p;
  };

  return { scannedAgent, error, processScan, clear: () => setScannedAgent(null) };
}
