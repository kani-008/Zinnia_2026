-- ZINNIA 2026 Database Schema Migration (Refactored 5-Table Architecture)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop legacy tables
DROP TABLE IF EXISTS certificates CASCADE;
DROP TABLE IF EXISTS food_distribution CASCADE;

-- 1. Participants Table (With in-row food collection tracking)
CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id VARCHAR(32) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  college VARCHAR(255) NOT NULL,
  department VARCHAR(255) NOT NULL,
  year VARCHAR(10) NOT NULL,
  clearance_level VARCHAR(32) DEFAULT 'LEVEL 01' CHECK (clearance_level IN ('LEVEL 01', 'LEVEL 02', 'LEVEL 03')),
  status VARCHAR(32) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'FLAGGED')),
  qr_token VARCHAR(255) UNIQUE NOT NULL,
  registered_events TEXT[] DEFAULT '{}',
  
  -- Minimum required food tracking directly on participant record
  food_collected BOOLEAN DEFAULT FALSE,
  food_collected_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_participants_agent_id ON participants(agent_id);
CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(email);
CREATE INDEX IF NOT EXISTS idx_participants_qr_token ON participants(qr_token);

ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public participant registration" ON participants;
CREATE POLICY "Public participant registration" ON participants FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public participant read" ON participants;
CREATE POLICY "Public participant read" ON participants FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public participant update" ON participants;
CREATE POLICY "Public participant update" ON participants FOR UPDATE USING (true);

-- 2. Events Table (TECH and NON_TECH)
CREATE TABLE IF NOT EXISTS events (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(16) NOT NULL,
  mission_name VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  event_type VARCHAR(16) NOT NULL CHECK (event_type IN ('TECH', 'NON_TECH')),
  category VARCHAR(32) NOT NULL,
  clearance_level VARCHAR(32) NOT NULL CHECK (clearance_level IN ('LEVEL 01', 'LEVEL 02', 'LEVEL 03')),
  team_size_min INTEGER DEFAULT 1,
  team_size_max INTEGER DEFAULT 1,
  is_single_event_only BOOLEAN DEFAULT FALSE,
  schedule_time VARCHAR(64) NOT NULL,
  duration VARCHAR(64) NOT NULL,
  venue VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  rules TEXT[] DEFAULT '{}',
  status VARCHAR(32) DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'IN_PROGRESS', 'COMPLETED', 'LOCKED')),
  
  -- Results Finalized control by Admin
  results_finalized BOOLEAN DEFAULT FALSE,
  results_finalized_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read events" ON events;
CREATE POLICY "Public read events" ON events FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin modify events" ON events;
CREATE POLICY "Admin modify events" ON events FOR ALL USING (true);

-- 3. Event Registrations & Prize Positions Table (Supports Teams & 1st/2nd/3rd Prizes)
CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id VARCHAR(64) REFERENCES events(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  team_id VARCHAR(64),
  team_name VARCHAR(255),
  
  -- 1 = 1st Prize, 2 = 2nd Prize, 3 = 3rd Prize, NULL = Participated
  position INTEGER CHECK (position IN (1, 2, 3) OR position IS NULL),
  
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_participant_per_event UNIQUE(event_id, participant_id)
);

CREATE INDEX IF NOT EXISTS idx_er_event_participant ON event_registrations(event_id, participant_id);
CREATE INDEX IF NOT EXISTS idx_er_team ON event_registrations(event_id, team_name);
CREATE INDEX IF NOT EXISTS idx_er_position ON event_registrations(event_id, position);

ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public event registrations insert" ON event_registrations;
CREATE POLICY "Public event registrations insert" ON event_registrations FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public event registrations read" ON event_registrations;
CREATE POLICY "Public event registrations read" ON event_registrations FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin event registrations update" ON event_registrations;
CREATE POLICY "Admin event registrations update" ON event_registrations FOR ALL USING (true);

-- 4. Attendance Table (Confirms Participation for Certificates)
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  agent_id VARCHAR(32) NOT NULL,
  checkin_type VARCHAR(32) NOT NULL CHECK (checkin_type IN ('ENTRY', 'EVENT')),
  event_id VARCHAR(64) REFERENCES events(id) ON DELETE SET NULL,
  scanned_by VARCHAR(255) NOT NULL,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  location VARCHAR(255),
  CONSTRAINT unique_entry_per_participant UNIQUE(participant_id, checkin_type, event_id)
);

CREATE INDEX IF NOT EXISTS idx_att_agent_id ON attendance(agent_id);
CREATE INDEX IF NOT EXISTS idx_att_checkin_type ON attendance(checkin_type);
CREATE INDEX IF NOT EXISTS idx_att_event_participation ON attendance(participant_id, event_id);

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public attendance insert" ON attendance;
CREATE POLICY "Public attendance insert" ON attendance FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public attendance read" ON attendance;
CREATE POLICY "Public attendance read" ON attendance FOR SELECT USING (true);

-- 5. Admin Roles Table
CREATE TABLE IF NOT EXISTS admin_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  role VARCHAR(64) NOT NULL CHECK (role IN ('SUPER_ADMIN', 'EVENT_ADMIN', 'ENTRY_STAFF', 'FOOD_STAFF', 'CERTIFICATE_ADMIN')),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  granted_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_admin_user_id ON admin_roles(user_id);

ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public admin roles read" ON admin_roles;
CREATE POLICY "Public admin roles read" ON admin_roles FOR SELECT USING (true);
