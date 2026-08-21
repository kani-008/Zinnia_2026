// Utility for generating and validating unique ZINNIA Agent IDs

export function generateAgentId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous chars 0/O, 1/I
  let code = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    code += chars[randomIndex];
  }
  return `ZIN26-${code}`;
}

export function isValidAgentId(id: string): boolean {
  if (!id) return false;
  const cleaned = id.trim().toUpperCase();
  const regex = /^ZIN26-[A-Z0-9]{6}$/;
  return regex.test(cleaned);
}

export function generateQrToken(): string {
  return 'tok_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
