/**
 * Zinnia 2026 — Canonical QR Payload Specification & Parser
 * Format: {"v":1,"t":"<passport_token>","m":"<member_id>","f":"V"|"N","e":["01","04"],"s":"<hmac16>"}
 */

export interface CompactQRPayload {
  v: number;                 // Version (1)
  t: string;                 // passport_token
  m: string;                 // member_id
  f: 'V' | 'N';              // food_preference (V = VEG, N = NON_VEG)
  e: string[];               // registered event codes (e.g. ["01", "04"])
  s: string;                 // HMAC-SHA256 signature prefix (16 chars)
}

export interface ParsedQRResult {
  isValid: boolean;
  token: string;             // passport_token (primary lookup key)
  memberId?: string;
  foodPreference?: 'VEG' | 'NON_VEG';
  eventCodes?: string[];
  signature?: string;
  isSignedPayload: boolean;
  rawText: string;
}

export function parseCompactQR(rawText: string): ParsedQRResult {
  if (!rawText) {
    return { isValid: false, token: '', isSignedPayload: false, rawText: '' };
  }

  const trimmed = rawText.trim();

  // 1. Check for Compact JSON Payload
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const data = JSON.parse(trimmed);
      if (data.t) {
        return {
          isValid: true,
          token: String(data.t).trim(),
          memberId: data.m ? String(data.m).trim() : undefined,
          foodPreference: data.f === 'N' ? 'NON_VEG' : data.f === 'V' ? 'VEG' : undefined,
          eventCodes: Array.isArray(data.e) ? data.e.map((code: any) => String(code).trim()) : [],
          signature: data.s ? String(data.s).trim() : undefined,
          isSignedPayload: Boolean(data.s),
          rawText: trimmed,
        };
      }
      // Fallback for legacy JSON format
      if (data.token || data.passport_token || data.id) {
        const t = String(data.token || data.passport_token || data.id).trim();
        return {
          isValid: true,
          token: t,
          isSignedPayload: false,
          rawText: trimmed,
        };
      }
    } catch {}
  }

  // 2. Check for URL parameters (?token=... or ?id=...)
  if (trimmed.includes('?')) {
    try {
      const url = new URL(trimmed.startsWith('http') ? trimmed : `http://localhost/${trimmed}`);
      const tokenParam = url.searchParams.get('token') || 
                         url.searchParams.get('t') || 
                         url.searchParams.get('id');
      if (tokenParam) {
        return {
          isValid: true,
          token: tokenParam.trim(),
          isSignedPayload: false,
          rawText: trimmed,
        };
      }
    } catch {}
  }

  // 3. Fallback: Raw string token
  return {
    isValid: Boolean(trimmed),
    token: trimmed,
    isSignedPayload: false,
    rawText: trimmed,
  };
}

export function extractScanToken(rawText: string): string {
  return parseCompactQR(rawText).token;
}

export function parseQRPayload(rawText: string): { agent_id: string; token?: string; isValid: boolean; payload?: ParsedQRResult } {
  const parsed = parseCompactQR(rawText);
  return {
    agent_id: parsed.token,
    token: parsed.token,
    isValid: parsed.isValid,
    payload: parsed
  };
}

export function createQRPayload(token: string, memberId: string = '', food: 'V' | 'N' = 'V', events: string[] = []): string {
  const payload: CompactQRPayload = {
    v: 1,
    t: token,
    m: memberId,
    f: food,
    e: events,
    s: ''
  };
  return JSON.stringify(payload);
}
