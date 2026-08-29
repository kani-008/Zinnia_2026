import { QRScanPayload } from '../types';

export function createQRPayload(agent_id: string, token: string): string {
  const payload: QRScanPayload = {
    v: 1,
    agent_id,
    token,
    ts: Date.now()
  };
  return JSON.stringify(payload);
}

export function extractScanToken(rawText: string): string {
  if (!rawText) return '';
  const trimmed = rawText.trim();
  
  // Case 1: JSON payload
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.band_id) return String(parsed.band_id).trim().toUpperCase();
      if (parsed.agent_id) return String(parsed.agent_id).trim().toUpperCase();
      if (parsed.id) return String(parsed.id).trim().toUpperCase();
    } catch {}
  }
  
  // Case 2: URL containing parameter (e.g. passport?id=ZIN26-GAARAA or ?band=WB-1001)
  if (trimmed.includes('?')) {
    try {
      const url = new URL(trimmed.startsWith('http') ? trimmed : `http://localhost/${trimmed}`);
      const param = url.searchParams.get('id') || 
                    url.searchParams.get('agent_id') || 
                    url.searchParams.get('band') || 
                    url.searchParams.get('band_id');
      if (param) return param.trim().toUpperCase();
    } catch {}
  }
  
  // Case 3: Pattern matching for ZIN26 agent ids
  const match = trimmed.match(/ZIN26-[A-Z0-9]{6}/i);
  if (match) {
    return match[0].toUpperCase();
  }

  return trimmed;
}

export function parseQRPayload(rawText: string): { agent_id: string; token?: string; isValid: boolean } {
  const token = extractScanToken(rawText);
  if (!token) return { agent_id: '', isValid: false };

  return {
    agent_id: token.toUpperCase(),
    isValid: true
  };
}
