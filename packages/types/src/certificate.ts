export type CertificateType = 
  | 'PARTICIPATION' 
  | 'WINNER_1ST' 
  | 'WINNER_2ND' 
  | 'WINNER_3RD' 
  | 'SPECIAL_RECOGNITION';

export interface CertificateTemplateConfig {
  type: CertificateType;
  title: string;
  subtitle: string;
  badge_label: string;
  primary_color: string;
  border_color: string;
  signatory_1: { name: string; title: string };
  signatory_2: { name: string; title: string };
}

// Dynamically generated in application memory / PDF rendering (No database table needed)
export interface GeneratedCertificate {
  certificate_number: string; // e.g. "ZIN26-CERT-A8F41C-01"
  participant_id: string;
  agent_id: string;
  participant_name: string;
  college: string;
  department: string;
  event_id: string;
  event_name: string;
  event_title: string;
  event_type: 'TECH' | 'NON_TECH';
  position: 1 | 2 | 3 | null;
  type: CertificateType;
  issue_date: string;
  verified: boolean;
  qr_verification_token: string;
}
