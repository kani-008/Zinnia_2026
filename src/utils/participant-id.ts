// Utility for generating and validating unique ZINNIA IDs

export function generateAgentId(): string {
  return generateTeamId();
}

export function generateTeamId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    code += chars[randomIndex];
  }
  return `ZIN26-${code}`;
}

export function generateMemberId(teamId: string, index: number): string {
  return `${teamId}-M${index + 1}`;
}

export function isValidAgentId(id: string): boolean {
  if (!id) return false;
  const cleaned = id.trim().toUpperCase();
  const regex = /^ZIN26-[A-Z0-9]{6}(?:-M[0-9]+)?$/;
  return regex.test(cleaned);
}

export function generateQrToken(): string {
  return 'tok_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
