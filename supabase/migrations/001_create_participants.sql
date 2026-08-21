-- Migration: 001_create_participants.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id VARCHAR(32) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  college VARCHAR(255) NOT NULL,
  department VARCHAR(255) NOT NULL,
  year VARCHAR(10) NOT NULL,
  clearance_level VARCHAR(32) DEFAULT 'LEVEL 01',
  status VARCHAR(32) DEFAULT 'ACTIVE',
  qr_token VARCHAR(255) UNIQUE NOT NULL,
  registered_events TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_participants_agent_id ON participants(agent_id);
CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(email);
CREATE INDEX IF NOT EXISTS idx_participants_qr_token ON participants(qr_token);

ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public participant registration" ON participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Public participant read" ON participants FOR SELECT USING (true);
