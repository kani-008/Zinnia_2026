export type AdminRole = 
  | 'SUPER_ADMIN' 
  | 'EVENT_ADMIN' 
  | 'ENTRY_STAFF' 
  | 'FOOD_STAFF' 
  | 'CERTIFICATE_ADMIN';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  avatar?: string;
}

export interface QRScanPayload {
  v: number;
  agent_id: string;
  token: string;
  ts: number;
}
