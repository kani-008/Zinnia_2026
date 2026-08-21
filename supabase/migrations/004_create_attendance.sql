-- Migration: 004_create_attendance.sql
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  agent_id VARCHAR(32) NOT NULL,
  checkin_type VARCHAR(32) NOT NULL, -- 'ENTRY', 'EVENT'
  event_id VARCHAR(64) REFERENCES events(id) ON DELETE SET NULL,
  scanned_by VARCHAR(255) NOT NULL,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  location VARCHAR(255),
  CONSTRAINT unique_entry_per_participant UNIQUE(participant_id, checkin_type, event_id)
);

CREATE INDEX IF NOT EXISTS idx_att_agent_id ON attendance(agent_id);
CREATE INDEX IF NOT EXISTS idx_att_checkin_type ON attendance(checkin_type);
