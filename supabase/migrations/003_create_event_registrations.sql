-- Migration: 003_create_event_registrations.sql
CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  event_id VARCHAR(64) REFERENCES events(id) ON DELETE CASCADE,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  status VARCHAR(32) DEFAULT 'CONFIRMED',
  CONSTRAINT unique_registration_per_event UNIQUE(participant_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_reg_participant_id ON event_registrations(participant_id);
CREATE INDEX IF NOT EXISTS idx_reg_event_id ON event_registrations(event_id);
