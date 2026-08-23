-- ==============================================================================
-- ZINNIA 2026 / AI SYMPOSIUM 2045 — TEAM-CENTRIC DATABASE SCHEMA
-- Core Architecture:
-- 1. teams (team_id as PRIMARY KEY, team_name, college, payment boolean)
-- 2. team_members (id PK, team_id FK, name, email UNIQUE, phone, is_leader, band_id UNIQUE, food_collected)
-- 3. hand_bands (band_id PK, member_id FK, team_id FK)
-- 4. events (TECH and NON_TECH symposium missions)
-- 5. event_registrations (Composite PK: team_id + event_id)
-- 6. attendance (Direct member_id and team_id reference)
-- 7. admin_roles (Role-based access control)
-- ==============================================================================

-- Drop legacy tables
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS event_registrations CASCADE;
DROP TABLE IF EXISTS hand_bands CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS participants CASCADE;
DROP TABLE IF EXISTS certificates CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS admin_roles CASCADE;

-- 1. Teams Table (team_id as Primary Key)
CREATE TABLE teams (
  team_id VARCHAR(32) PRIMARY KEY,
  team_name VARCHAR(255) NOT NULL,
  college VARCHAR(255) NOT NULL,
  department VARCHAR(255) NOT NULL,
  year VARCHAR(10) NOT NULL,
  registered_events TEXT[] DEFAULT '{}',
  payment BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_teams_college ON teams(college);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public teams registration" ON teams;
CREATE POLICY "Public teams registration" ON teams FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public teams read" ON teams;
CREATE POLICY "Public teams read" ON teams FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public teams update" ON teams;
CREATE POLICY "Public teams update" ON teams FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Public teams delete" ON teams;
CREATE POLICY "Public teams delete" ON teams FOR DELETE USING (true);

-- 2. Team Members Table (Individual attendee tracking & wristband linking)
CREATE TABLE team_members (
  id VARCHAR(64) PRIMARY KEY,
  team_id VARCHAR(32) NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(32) NOT NULL,
  is_leader BOOLEAN DEFAULT FALSE,
  band_id VARCHAR(64) UNIQUE,
  food_collected BOOLEAN DEFAULT FALSE,
  food_collected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_email ON team_members(email);
CREATE INDEX idx_team_members_band_id ON team_members(band_id);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public team_members insert" ON team_members;
CREATE POLICY "Public team_members insert" ON team_members FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public team_members read" ON team_members;
CREATE POLICY "Public team_members read" ON team_members FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public team_members update" ON team_members;
CREATE POLICY "Public team_members update" ON team_members FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Public team_members delete" ON team_members;
CREATE POLICY "Public team_members delete" ON team_members FOR DELETE USING (true);

-- 3. Hand Bands Mapping Table (band_id as Primary Key -> member_id + team_id)
CREATE TABLE hand_bands (
  band_id VARCHAR(64) PRIMARY KEY,
  member_id VARCHAR(64) UNIQUE NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  team_id VARCHAR(32) NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_hand_bands_member_id ON hand_bands(member_id);
CREATE INDEX idx_hand_bands_team_id ON hand_bands(team_id);

ALTER TABLE hand_bands ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public hand_bands read" ON hand_bands;
CREATE POLICY "Public hand_bands read" ON hand_bands FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public hand_bands insert" ON hand_bands;
CREATE POLICY "Public hand_bands insert" ON hand_bands FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public hand_bands update" ON hand_bands;
CREATE POLICY "Public hand_bands update" ON hand_bands FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Public hand_bands delete" ON hand_bands;
CREATE POLICY "Public hand_bands delete" ON hand_bands FOR DELETE USING (true);

-- 4. Events Table
CREATE TABLE events (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(16) NOT NULL,
  mission_name VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  event_type VARCHAR(16) NOT NULL CHECK (event_type IN ('TECH', 'NON_TECH')),
  category VARCHAR(32) NOT NULL,
  clearance_level VARCHAR(32) DEFAULT 'LEVEL 01',
  team_size_min INTEGER DEFAULT 1,
  team_size_max INTEGER DEFAULT 4,
  is_single_event_only BOOLEAN DEFAULT FALSE,
  schedule_time VARCHAR(64) NOT NULL,
  duration VARCHAR(64) NOT NULL,
  venue VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  rules TEXT[] DEFAULT '{}',
  status VARCHAR(32) DEFAULT 'AVAILABLE',
  results_finalized BOOLEAN DEFAULT FALSE,
  results_finalized_at TIMESTAMP WITH TIME ZONE,
  coordinators JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public events read" ON events;
CREATE POLICY "Public events read" ON events FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public events update" ON events;
CREATE POLICY "Public events update" ON events FOR UPDATE USING (true);

-- 5. Event Registrations Table
CREATE TABLE event_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id VARCHAR(32) NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
  event_id VARCHAR(64) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  team_name VARCHAR(255),
  position INTEGER CHECK (position IN (1, 2, 3)),
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(team_id, event_id)
);

CREATE INDEX idx_er_team_id ON event_registrations(team_id);
CREATE INDEX idx_er_event_id ON event_registrations(event_id);

ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public event_registrations all" ON event_registrations;
CREATE POLICY "Public event_registrations all" ON event_registrations FOR ALL USING (true);

-- 6. Attendance Table
CREATE TABLE attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id VARCHAR(32) NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
  member_id VARCHAR(64) REFERENCES team_members(id) ON DELETE CASCADE,
  band_id VARCHAR(64),
  participant_name VARCHAR(255),
  college VARCHAR(255),
  checkin_type VARCHAR(16) NOT NULL CHECK (checkin_type IN ('ENTRY', 'EVENT')),
  event_id VARCHAR(64) REFERENCES events(id) ON DELETE SET NULL,
  event_name VARCHAR(255),
  scanned_by VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_attendance_team_id ON attendance(team_id);
CREATE INDEX idx_attendance_member_id ON attendance(member_id);
CREATE INDEX idx_attendance_band_id ON attendance(band_id);
CREATE INDEX idx_attendance_type ON attendance(checkin_type);

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public attendance all" ON attendance;
CREATE POLICY "Public attendance all" ON attendance FOR ALL USING (true);

-- 7. Insert Official 9 Symposium Events
INSERT INTO events (id, code, mission_name, title, event_type, category, schedule_time, duration, venue, description, rules, status, team_size_min, team_size_max) VALUES
  ('msn-sys-recovery', 'MSN-01', 'Operation: System Recovery', 'Debugging & Code Fixing', 'TECH', 'TECHNICAL', '10:00 AM - 11:30 AM', '90 mins', 'Turing Lab (Lab 2)', 'Locate logic faults, race conditions and memory leaks across broken algorithms.', ARRAY['Teams of 1 to 2 members.', 'Allowed languages: C++, Java, Python, Rust.', 'No external internet access permitted during round.'], 'AVAILABLE', 1, 2),
  ('msn-oracle', 'MSN-02', 'Operation: ORACLE', 'Paper & Concept Presentation', 'TECH', 'TECHNICAL', '11:00 AM - 01:00 PM', '120 mins', 'Seminar Hall Alpha', 'Present novel research papers, AI model architectures and technical breakthroughs.', ARRAY['Max 3 participants per team.', 'PPT presentation: 8 mins presentation + 2 mins Q&A.', 'Submissions must be original work.'], 'AVAILABLE', 1, 3),
  ('msn-broken-records', 'MSN-03', 'Operation: Broken Records', 'Database Query & Optimization Heist', 'TECH', 'TECHNICAL', '11:30 AM - 01:00 PM', '90 mins', 'Database Lab (Lab 1)', 'Extract mission-critical intelligence from damaged relational databases.', ARRAY['Teams of 1 to 2 members.', 'SQL dialects: PostgreSQL / MySQL.', 'Scoring based on execution speed and query correctness.'], 'AVAILABLE', 1, 2),
  ('msn-infinity-protocol', 'MSN-04', 'Operation: Infinity Protocol', '24h Rapid AI Prototype Hackathon', 'TECH', 'TECHNICAL', '09:30 AM - 04:30 PM', '7 Hours', 'Innovation Center / Hall C', 'Engineer an end-to-end working autonomous AI or full-stack solution to a live problem statement.', ARRAY['Teams of 2 to 4 members.', 'Open source AI models and libraries permitted.', 'Live deployment and presentation required.'], 'AVAILABLE', 2, 4),
  ('msn-mission-control', 'MSN-05', 'Operation: Mission Control', 'Web & UI/UX Architectural Challenge', 'TECH', 'TECHNICAL', '02:00 PM - 03:30 PM', '90 mins', 'Design Studio (Lab 3)', 'Design and build high-fidelity interactive digital experiences under strict constraints.', ARRAY['Teams of 1 to 2 members.', 'Figma and Vanilla CSS / React accepted.', 'Evaluated on visual polish, UX flow, and responsiveness.'], 'AVAILABLE', 1, 2),
  ('msn-borderland-gce', 'MSN-06', 'Borderland at GCE', 'Tactical eSports Arena', 'NON_TECH', 'NON_TECHNICAL', '10:00 AM - 01:00 PM', '180 mins', 'eSports Arena / Hall A', 'Competitive strategic tactical LAN gaming tournaments.', ARRAY['Squads of 4 players.', 'Standard tournament rules apply.', 'Fair play and anti-cheat strictly enforced.'], 'AVAILABLE', 4, 4),
  ('msn-think-strike-win', 'MSN-07', 'Think, Strike and Win', 'Rapid Technical & Pop Trivia', 'NON_TECH', 'NON_TECHNICAL', '01:00 PM - 02:00 PM', '60 mins', 'Auditorium Main', 'High-speed technical quiz testing knowledge across computing history, logic, and puzzles.', ARRAY['Teams of 2 participants.', 'Buzzer round elimination format.', 'Quiz master decision is final.'], 'AVAILABLE', 2, 2),
  ('msn-plot-twist', 'MSN-08', 'Plot Twist', 'Live Tech Jam / Debate / Ad-Zap', 'NON_TECH', 'NON_TECHNICAL', '02:30 PM - 03:45 PM', '75 mins', 'Conference Hall B', 'On-the-spot technical pitching, spontaneous crisis management, and creative tech marketing.', ARRAY['Teams of 2 to 3 members.', '3 minutes prep time per assigned scenario.', 'Evaluated on creativity and technical wit.'], 'AVAILABLE', 2, 3),
  ('msn-blind-sync', 'MSN-09', 'Operation: Blind Sync', 'Blind Coding & Silent Pairing Challenge', 'TECH', 'TECHNICAL', '03:30 PM - 04:30 PM', '60 mins', 'Ada Lovelace Lab', 'One agent types with monitor powered off while their partner whispers algorithmic constraints.', ARRAY['Teams of 2 agents.', 'No visual monitor feedback during typing periods.', 'Standard IDE syntax highlighting disabled.'], 'AVAILABLE', 2, 2)
ON CONFLICT (id) DO UPDATE SET
  mission_name = EXCLUDED.mission_name,
  team_size_min = EXCLUDED.team_size_min,
  team_size_max = EXCLUDED.team_size_max,
  rules = EXCLUDED.rules;
