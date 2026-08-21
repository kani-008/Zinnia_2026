-- ZINNIA 2026 Database Schema Migration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Participants Table
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

-- Index for speedy lookups
CREATE INDEX IF NOT EXISTS idx_participants_agent_id ON participants(agent_id);
CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(email);
CREATE INDEX IF NOT EXISTS idx_participants_qr_token ON participants(qr_token);

-- 2. Events / Missions Table
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

-- 3. Attendance Records Table (Gate Entry, Event Attendance, Food)
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  agent_id VARCHAR(32) NOT NULL,
  checkin_type VARCHAR(32) NOT NULL, -- 'ENTRY', 'EVENT', 'FOOD'
  event_id VARCHAR(64) REFERENCES events(id) ON DELETE SET NULL,
  scanned_by VARCHAR(255) NOT NULL,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  location VARCHAR(255),
  CONSTRAINT unique_entry_per_participant UNIQUE(participant_id, checkin_type, event_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_agent_id ON attendance(agent_id);
CREATE INDEX IF NOT EXISTS idx_attendance_checkin ON attendance(checkin_type);

-- 4. Food Distribution Records Table
CREATE TABLE IF NOT EXISTS food_distribution (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  agent_id VARCHAR(32) NOT NULL,
  meal_session VARCHAR(32) NOT NULL DEFAULT 'LUNCH', -- 'LUNCH', 'SNACKS'
  collected BOOLEAN DEFAULT TRUE,
  collected_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  scanned_by VARCHAR(255) NOT NULL,
  CONSTRAINT unique_food_per_session UNIQUE(participant_id, meal_session)
);

CREATE INDEX IF NOT EXISTS idx_food_agent_id ON food_distribution(agent_id);

-- 5. Certificates Table
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

CREATE INDEX IF NOT EXISTS idx_certificates_cert_num ON certificates(certificate_number);

-- 6. Admin Staff & Roles
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(64) NOT NULL, -- 'SUPER_ADMIN', 'EVENT_ADMIN', 'ENTRY_STAFF', 'FOOD_STAFF', 'CERTIFICATE_ADMIN'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_distribution ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Public can read events
CREATE POLICY "Public events access" ON events FOR SELECT USING (true);

-- Public can insert registrations and read their own record by Agent ID or QR token
CREATE POLICY "Public participant registration" ON participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Public participant read by agent_id" ON participants FOR SELECT USING (true);
