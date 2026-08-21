import { EventMission } from '../../types/src';

export const OFFICIAL_MISSIONS: EventMission[] = [
  // TECHNICAL EVENTS
  {
    id: 'msn-sys-recovery',
    code: 'MSN-01',
    mission_name: 'Operation: System Recovery',
    title: 'Debugging',
    event_type: 'TECH',
    category: 'TECHNICAL',
    clearance_level: 'LEVEL 01',
    team_size_min: 1,
    team_size_max: 2,
    schedule_time: '10:00 AM - 10:45 AM',
    duration: '1 hr',
    venue: 'Cyber Lab 01 (Newton Hall)',
    description: 'Black Cipher has injected malicious anomalies into the core runtime engine. Agents must locate, diagnose, and patch critical syntax, memory, and logical faults before the countdown reaches zero.',
    rules: [
      'Individual or team of 2 agents.',
      'Languages supported: C, C++, Java, Python.',
      'Total 3 rounds of escalating corrupted code snippets.',
      'Internet access restricted; offline documentation available.'
    ],
    coordinators: [
      { name: 'Dr. A. Senthil Kumar', role: 'Staff Lead', phone: '+91 98401 23456' },
      { name: 'R. Kanishkar', role: 'Student Coordinator', phone: '+91 94451 98765' }
    ],
    prizes: {
      first: '₹3,000 + CHRONOS Merit Badge',
      second: '₹2,000 + Certificate of Excellence',
      third: '₹1,000 + Certificate of Merit'
    },
    status: 'AVAILABLE'
  },
  {
    id: 'msn-oracle',
    code: 'MSN-02',
    mission_name: 'Operation: ORACLE',
    title: 'AI Event',
    event_type: 'TECH',
    category: 'TECHNICAL',
    clearance_level: 'LEVEL 02',
    team_size_min: 1,
    team_size_max: 2,
    schedule_time: '11:15 AM - 12:15 PM',
    duration: '1 hr',
    venue: 'AI Research Arena (Turing Block)',
    description: 'Decrypt Black Cipher neural weights. Test your proficiency in machine learning, prompt engineering, generative model tuning, and predictive pattern identification.',
    rules: [
      'Teams of 1 to 2 members.',
      'Prompt engineering challenges and model anomaly diagnosis.',
      'Highest accuracy benchmark in minimal iterations wins.'
    ],
    coordinators: [
      { name: 'Prof. M. Priya', role: 'Staff Lead', phone: '+91 98402 34567' },
      { name: 'S. Vignesh', role: 'Student Coordinator', phone: '+91 97890 12345' }
    ],
    prizes: {
      first: '₹3,500 + AI Innovator Badge',
      second: '₹2,000 + Runner-up Badge',
      third: '₹1,000 + Recognition Certificate'
    },
    status: 'AVAILABLE'
  },
  {
    id: 'msn-broken-records',
    code: 'MSN-03',
    mission_name: 'Operation: Broken Records',
    title: 'Lost in SQL',
    event_type: 'TECH',
    category: 'TECHNICAL',
    clearance_level: 'LEVEL 01',
    team_size_min: 1,
    team_size_max: 2,
    schedule_time: '12:30 PM - 01:30 PM',
    duration: '1 hr',
    venue: 'Database Systems Lab (Babbage Wing)',
    description: 'The Temporal Core overload corrupted relational archives across centuries. Write queries, join fractured temporal tables, reverse engineer schemas, and extract classified recovery records.',
    rules: [
      'Individual or team of 2.',
      'Dialects: PostgreSQL / MySQL.',
      'Query optimization, complex subqueries, and cryptographic data extraction.'
    ],
    coordinators: [
      { name: 'Prof. K. Ramesh', role: 'Staff Lead', phone: '+91 98403 45678' },
      { name: 'D. Harini', role: 'Student Coordinator', phone: '+91 98765 43210' }
    ],
    prizes: {
      first: '₹3,000 + Data Archon Shield',
      second: '₹2,000 + Excellence Certificate',
      third: '₹1,000 + Merit Certificate'
    },
    status: 'AVAILABLE'
  },
  {
    id: 'msn-infinity-protocol',
    code: 'MSN-04',
    mission_name: 'Operation: Infinity Protocol',
    title: 'Infinity Challenge (Single event)',
    event_type: 'TECH',
    category: 'TECHNICAL',
    clearance_level: 'LEVEL 03',
    team_size_min: 2,
    team_size_max: 3,
    is_single_event_only: true,
    schedule_time: '10:00 AM - 01:30 PM',
    duration: '3 hrs 30 mins',
    venue: 'Main Innovation Center',
    description: 'An elite, continuous, multi-stage marathon testing competitive algorithmic problem solving, rapid full-stack prototyping, and timeline crisis defense under extreme time pressure.',
    rules: [
      'Teams of 2 to 3 members.',
      'Participants registering for Infinity Protocol cannot clash with short technical events.',
      'Includes 3 intense phases: Algorithm Forge, System Crash Survival, and Live Pitch.'
    ],
    coordinators: [
      { name: 'Dr. V. Rajesh', role: 'Chief Adjudicator', phone: '+91 98404 56789' },
      { name: 'A. Siddharth', role: 'Lead Architect', phone: '+91 91234 56789' }
    ],
    prizes: {
      first: '₹6,000 + Grand Temporal Champion Trophy',
      second: '₹4,000 + Runner-up Shield',
      third: '₹2,000 + Certificate'
    },
    status: 'AVAILABLE'
  },
  {
    id: 'msn-mission-control',
    code: 'MSN-05',
    mission_name: 'Operation: Mission Control',
    title: 'UI/UX Design (Single event)',
    event_type: 'TECH',
    category: 'TECHNICAL',
    clearance_level: 'LEVEL 02',
    team_size_min: 1,
    team_size_max: 2,
    is_single_event_only: true,
    schedule_time: '10:30 AM - 01:00 PM',
    duration: '2 hr 30 mins',
    venue: 'Design & Graphics Studio (Lovelace Hub)',
    description: 'Design the next-generation CHRONOS incident investigation dashboard or Black Cipher containment user interface with high usability, temporal micro-interactions, and visual fidelity.',
    rules: [
      'Teams of 1 to 2.',
      'Tools: Figma, Adobe XD, or Penpot.',
      'Evaluation criteria: Aesthetic excellence, user journey, accessibility, and futuristic theme integration.'
    ],
    coordinators: [
      { name: 'Prof. S. Kavitha', role: 'Staff Lead', phone: '+91 98405 67890' },
      { name: 'N. Keerthana', role: 'Student Lead', phone: '+91 93456 78901' }
    ],
    prizes: {
      first: '₹3,500 + Creative Vanguard Trophy',
      second: '₹2,000 + Certificate',
      third: '₹1,000 + Certificate'
    },
    status: 'AVAILABLE'
  },

  // NON-TECHNICAL EVENTS
  {
    id: 'msn-borderland-gce',
    code: 'MSN-06',
    mission_name: 'Borderland at GCE',
    title: 'Borderland at GCE',
    event_type: 'NON_TECH',
    category: 'NON_TECHNICAL',
    clearance_level: 'LEVEL 01',
    team_size_min: 2,
    team_size_max: 4,
    schedule_time: '10:45 AM - 01:00 PM',
    duration: '2 hrs 15 minutes',
    venue: 'Campus Open Quadrangle & Auditoriums',
    description: 'Survive the mystery borderland. Solve physical and mental puzzles, decode cryptic coordinates across the campus, and escape before the timeline destabilizes.',
    rules: [
      'Squads of 2 to 4 members.',
      'Physical campus exploration with clues hidden in chronological checkpoints.',
      'No property damage; strict adherence to campus safety protocols.'
    ],
    coordinators: [
      { name: 'K. Arvind', role: 'Station Master', phone: '+91 94567 89012' },
      { name: 'M. Divya', role: 'Tactical Coordinator', phone: '+91 95678 90123' }
    ],
    prizes: {
      first: '₹3,000 + Survivalist Medals',
      second: '₹2,000 + Certificates',
      third: '₹1,000 + Certificates'
    },
    status: 'AVAILABLE'
  },
  {
    id: 'msn-think-strike-win',
    code: 'MSN-07',
    mission_name: 'Think, Strike and Win',
    title: 'Think, Strike and Win',
    event_type: 'NON_TECH',
    category: 'NON_TECHNICAL',
    clearance_level: 'LEVEL 01',
    team_size_min: 2,
    team_size_max: 3,
    schedule_time: '11:00 AM - 12:00 PM',
    duration: '1 hr',
    venue: 'Seminar Hall B',
    description: 'Fast-paced buzzer quiz and strategic thinking face-off spanning general tech trivia, pop culture temporal paradoxes, logic puzzles, and rapid reaction rounds.',
    rules: [
      'Teams of 2 to 3 members.',
      'Prelims followed by top 6 teams live buzzer faceoff.',
      'Negative marks for false strikes in final round.'
    ],
    coordinators: [
      { name: 'P. Balaji', role: 'Quizmaster', phone: '+91 96789 01234' },
      { name: 'R. Sneha', role: 'Event Coordinator', phone: '+91 97890 12346' }
    ],
    prizes: {
      first: '₹2,500 + Quiz Laureate Shield',
      second: '₹1,500 + Certificate',
      third: '₹1,000 + Certificate'
    },
    status: 'AVAILABLE'
  },
  {
    id: 'msn-plot-twist',
    code: 'MSN-08',
    mission_name: 'Plot Twist',
    title: 'Plot Twist',
    event_type: 'NON_TECH',
    category: 'NON_TECHNICAL',
    clearance_level: 'LEVEL 01',
    team_size_min: 1,
    team_size_max: 2,
    schedule_time: '12:00 PM - 01:00 PM',
    duration: '1 hr',
    venue: 'Media Studio / AV Hall',
    description: 'A sudden unexpected story scenario is presented where reality has fractured. Craft the most clever, entertaining, or mind-bending continuation and resolution on the spot.',
    rules: [
      'Solo or Duo participation.',
      'Preparation time: 10 minutes; Performance/Presentation: 4 minutes.',
      'Judged on creativity, coherence, dramatic timing, and audience engagement.'
    ],
    coordinators: [
      { name: 'G. Naveen', role: 'Drama & Narrative Lead', phone: '+91 98901 23456' },
      { name: 'T. Ananya', role: 'Event Coordinator', phone: '+91 99012 34567' }
    ],
    prizes: {
      first: '₹2,500 + Master of Narrative Award',
      second: '₹1,500 + Certificate',
      third: '₹1,000 + Certificate'
    },
    status: 'AVAILABLE'
  },
  {
    id: 'msn-short-film',
    code: 'MSN-09',
    mission_name: 'Short Film',
    title: 'Short Film',
    event_type: 'NON_TECH',
    category: 'NON_TECHNICAL',
    clearance_level: 'LEVEL 01',
    team_size_min: 1,
    team_size_max: 5,
    schedule_time: '12:30 PM - 01:00 PM',
    duration: '30 minutes',
    venue: 'Main Auditorium Screen 01',
    description: 'Screening and evaluation of original short films created by student creators exploring themes of artificial intelligence, future dystopia, temporal anomalies, or human connection.',
    rules: [
      'Runtime: 3 to 10 minutes.',
      'Must contain original footage and audio/licensed score.',
      'Submit MP4 format prior to deadline or deliver via flash drive during registration.'
    ],
    coordinators: [
      { name: 'S. Karthik', role: 'Cinema Director', phone: '+91 90123 45678' },
      { name: 'V. Meera', role: 'Screening Lead', phone: '+91 91234 56780' }
    ],
    prizes: {
      first: '₹3,000 + Best Picture Golden Reel',
      second: '₹2,000 + Runner-up Reel',
      third: '₹1,000 + Special Mention Certificate'
    },
    status: 'AVAILABLE'
  }
];
