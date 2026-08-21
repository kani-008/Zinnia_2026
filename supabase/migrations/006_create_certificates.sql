-- Migration: 006_create_certificates.sql
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  certificate_number VARCHAR(64) UNIQUE NOT NULL,
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  event_id VARCHAR(64) REFERENCES events(id) ON DELETE SET NULL,
  type VARCHAR(64) NOT NULL DEFAULT 'PARTICIPATION',
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  verified BOOLEAN DEFAULT TRUE,
  download_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cert_number ON certificates(certificate_number);
