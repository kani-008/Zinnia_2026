-- Seed: events.sql
INSERT INTO events (id, code, mission_name, title, category, clearance_level, team_size_min, team_size_max, is_single_event_only, schedule_time, duration, venue, description)
VALUES 
('msn-sys-recovery', 'MSN-01', 'Operation: System Recovery', 'Debugging', 'TECHNICAL', 'LEVEL 01', 1, 2, FALSE, '10:00 AM - 10:45 AM', '1 hr', 'Cyber Lab 01', 'Debugging critical syntax, memory, and logical faults.'),
('msn-oracle', 'MSN-02', 'Operation: ORACLE', 'AI Event', 'TECHNICAL', 'LEVEL 02', 1, 2, FALSE, '11:15 AM - 12:15 PM', '1 hr', 'AI Arena', 'Prompt engineering and neural anomaly diagnosis.'),
('msn-broken-records', 'MSN-03', 'Operation: Broken Records', 'Lost in SQL', 'TECHNICAL', 'LEVEL 01', 1, 2, FALSE, '12:30 PM - 01:30 PM', '1 hr', 'Database Lab', 'SQL recovery across fractured relational archives.'),
('msn-infinity-protocol', 'MSN-04', 'Operation: Infinity Protocol', 'Infinity Challenge (Single event)', 'TECHNICAL', 'LEVEL 03', 2, 3, TRUE, '10:00 AM - 01:30 PM', '3 hrs 30 mins', 'Main Innovation Center', 'Multi-stage marathon of algorithms and system survival.'),
('msn-mission-control', 'MSN-05', 'Operation: Mission Control', 'UI/UX Design (Single event)', 'TECHNICAL', 'LEVEL 02', 1, 2, TRUE, '10:30 AM - 01:00 PM', '2 hr 30 mins', 'Design Studio', 'Designing futuristic CHRONOS temporal incident interfaces.'),
('msn-borderland-gce', 'MSN-06', 'Borderland at GCE', 'Borderland at GCE', 'NON_TECHNICAL', 'LEVEL 01', 2, 4, FALSE, '10:45 AM - 01:00 PM', '2 hrs 15 minutes', 'Campus Quadrangle', 'Physical campus puzzle survival and timeline escape.'),
('msn-think-strike-win', 'MSN-07', 'Think, Strike and Win', 'Think, Strike and Win', 'NON_TECHNICAL', 'LEVEL 01', 2, 3, FALSE, '11:00 AM - 12:00 PM', '1 hr', 'Seminar Hall B', 'Fast-paced buzzer quiz and strategic thinking.'),
('msn-plot-twist', 'MSN-08', 'Plot Twist', 'Plot Twist', 'NON_TECHNICAL', 'LEVEL 01', 1, 2, FALSE, '12:00 PM - 01:00 PM', '1 hr', 'Media Studio', 'Impromptu creative story development and presentation.'),
('msn-short-film', 'MSN-09', 'Short Film', 'Short Film', 'NON_TECHNICAL', 'LEVEL 01', 1, 5, FALSE, '12:30 PM - 01:00 PM', '30 minutes', 'Auditorium Screen 01', 'Original film screening on sci-fi and AI anomalies.')
ON CONFLICT (id) DO NOTHING;
