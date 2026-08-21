export type CertificateType = 
  | 'PARTICIPATION' 
  | 'WINNER_1ST' 
  | 'WINNER_2ND' 
  | 'WINNER_3RD' 
  | 'SPECIAL_RECOGNITION';

export interface Certificate {
  id: string;
  certificate_number: string; // e.g. "ZIN26-CERT-1001"
  participant_id: string;
  participant_name: string;
  college: string;
  event_id?: string;
  event_title?: string;
  type: CertificateType;
  issue_date: string;
  verified: boolean;
  download_url?: string;
}
