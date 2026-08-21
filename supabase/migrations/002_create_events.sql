-- Migration: 002_create_events.sql
CREATE TABLE IF NOT EXISTS events (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(16) NOT NULL,
  mission_name VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(32) NOT NULL,
  clearance_level VARCHAR(32) NOT NULL,
  team_size_min INTEGER DEFAULT 1,
  team_size_max INTEGER DEFAULT 1,
  is_single_event_only BOOLEAN DEFAULT FALSE,
  schedule_time VARCHAR(64) NOT NULL,
  duration VARCHAR(64) NOT NULL,
  venue VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  rules TEXT[] DEFAULT '{}',
  status VARCHAR(32) DEFAULT 'AVAILABLE',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read events" ON events FOR SELECT USING (true);
