import { QRScanPayload } from '../../types/src';

export function createQRPayload(agent_id: string, token: string): string {
  const payload: QRScanPayload = {
    v: 1,
    agent_id,
    token,
    ts: Date.now()
  };
  return JSON.stringify(payload);
}

export function parseQRPayload(rawText: string): { agent_id: string; token?: string; isValid: boolean } {
  if (!rawText) return { agent_id: '', isValid: false };
  
  const trimmed = rawText.trim();
  
  // Case 1: JSON payload format
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.agent_id && typeof parsed.agent_id === 'string') {
        return {
          agent_id: parsed.agent_id.toUpperCase(),
          token: parsed.token,
          isValid: true
        };
      }
    } catch {
      // Fall through to plain text check
    }
  }

  // Case 2: Plain text Agent ID e.g. "ZIN26-A8F41C" or URL with id parameter
  const match = trimmed.match(/ZIN26-[A-Z0-9]{6}/i);
  if (match) {
    return {
      agent_id: match[0].toUpperCase(),
      isValid: true
    };
  }

  return { agent_id: '', isValid: false };
}
