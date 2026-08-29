import { EventMission } from '../types';

export const OFFICIAL_MISSIONS: EventMission[] = [
  // TECHNICAL EVENTS (01 - 05)
  {
    id: 'debugging',
    code: '01',
    mission_name: 'DEBUGGING',
    title: 'Debugging',
    tagline: 'Find. Fix. Conquer.',
    event_type: 'TECH',
    category: 'TECHNICAL',
    clearance_level: 'LEVEL 01',
    team_size_min: 1,
    team_size_max: 2,
    schedule_time: '10:00 AM - 11:30 AM',
    duration: '1 hr 30 mins',
    venue: 'Computer Lab 01 (Newton Hall)',
    description: 'Diagnose runtime exceptions, logical bugs, and memory traps in intentionally broken software systems under strict time constraints.',
    rules: [
      'Solo or duo participation.',
      'Languages: C, C++, Java, Python.',
      'Spot logical, syntactical, and edge-case errors.',
      'Fastest accurate patches gain maximum points.'
    ],
    coordinators: [
      { name: 'Staff Coordinator', role: 'Staff Lead', phone: '+91 98401 23456' },
      { name: 'Student Coordinator', role: 'Student Lead', phone: '+91 94451 98765' }
    ],
    prizes: {
      first: '₹3,000 + Merit Shield',
      second: '₹2,000 + Certificate',
      third: '₹1,000 + Certificate'
    },
    status: 'AVAILABLE',
    icon_name: 'debug'
  },
  {
    id: 'the-last-signal',
    code: '02',
    mission_name: 'THE LAST SIGNAL',
    title: 'The Last Signal',
    tagline: 'Decode. Transmit. Survive.',
    event_type: 'TECH',
    category: 'TECHNICAL',
    clearance_level: 'LEVEL 01',
    team_size_min: 1,
    team_size_max: 2,
    schedule_time: '11:30 AM - 12:45 PM',
    duration: '1 hr 15 mins',
    venue: 'Networks & Communication Lab',
    description: 'Intercept, decrypt, and decode corrupted signal packets through cryptographic puzzles, packet analysis, and binary telemetry.',
    rules: [
      'Team of 1 to 2 members.',
      'Rounds of ciphers, steganography, and frequency analysis.',
      'Internet access restricted to designated tools.',
      'Tie-breaker based on completion speed.'
    ],
    coordinators: [
      { name: 'Staff Coordinator', role: 'Staff Lead', phone: '+91 98402 34567' },
      { name: 'Student Coordinator', role: 'Student Lead', phone: '+91 97890 12345' }
    ],
    prizes: {
      first: '₹3,000 + Shield',
      second: '₹2,000 + Certificate',
      third: '₹1,000 + Certificate'
    },
    status: 'AVAILABLE',
    icon_name: 'signal'
  },
  {
    id: 'lost-at-sql',
    code: '03',
    mission_name: 'LOST AT SQL',
    title: 'Lost at SQL',
    tagline: 'Query. Navigate. Extract.',
    event_type: 'TECH',
    category: 'TECHNICAL',
    clearance_level: 'LEVEL 01',
    team_size_min: 1,
    team_size_max: 2,
    schedule_time: '01:30 PM - 02:45 PM',
    duration: '1 hr 15 mins',
    venue: 'Database Architecture Wing (Lab 03)',
    description: 'Solve intricate relational query puzzles, reverse-engineer damaged schema tables, and write optimized joins to escape the database labyrinth.',
    rules: [
      'Solo or duo participation.',
      'PostgreSQL & MySQL environments provided.',
      'Subqueries, window functions, and indexing mastery tested.',
      'Speed and query cost efficiency scored.'
    ],
    coordinators: [
      { name: 'Staff Coordinator', role: 'Staff Lead', phone: '+91 98403 45678' },
      { name: 'Student Coordinator', role: 'Student Lead', phone: '+91 91234 56789' }
    ],
    prizes: {
      first: '₹3,000 + Shield',
      second: '₹2,000 + Certificate',
      third: '₹1,000 + Certificate'
    },
    status: 'AVAILABLE',
    icon_name: 'database'
  },
  {
    id: 'gadget-codes',
    code: '04',
    mission_name: 'GADGET CODES',
    title: 'Gadget Codes (Single event)',
    tagline: 'Program. Wire. Automate.',
    event_type: 'TECH',
    category: 'TECHNICAL',
    clearance_level: 'LEVEL 01',
    is_single_event_only: true,
    team_size_min: 1,
    team_size_max: 2,
    schedule_time: '11:00 AM - 01:00 PM',
    duration: '2 hrs',
    venue: 'Embedded Systems & IoT Arena',
    description: 'Bridge hardware and software by writing firmware and interfacing microcontrollers, sensors, and peripherals to solve hands-on embedded challenges.',
    rules: [
      'Individual or duo participation.',
      'Microcontroller kits and pinouts provided on-site.',
      'Breadboarding, GPIO pin configuration, and firmware debugging assessed.',
      'Safety protocols must be followed at all times.'
    ],
    coordinators: [
      { name: 'Staff Coordinator', role: 'Staff Lead', phone: '+91 98404 56789' },
      { name: 'Student Coordinator', role: 'Student Lead', phone: '+91 92345 67890' }
    ],
    prizes: {
      first: '₹3,500 + Shield',
      second: '₹2,000 + Certificate',
      third: '₹1,000 + Certificate'
    },
    status: 'AVAILABLE',
    icon_name: 'circuit'
  },
  {
    id: 'paper-presentation',
    code: '05',
    mission_name: 'PAPER PRESENTATION',
    title: 'Paper Presentation',
    tagline: 'Ideas that speak. Impact that lasts.',
    event_type: 'TECH',
    category: 'TECHNICAL',
    clearance_level: 'LEVEL 01',
    team_size_min: 1,
    team_size_max: 3,
    schedule_time: '10:00 AM - 01:00 PM',
    duration: '3 hrs',
    venue: 'Seminar Hall B (Auditorium Block)',
    description: 'Present original research manuscripts, architectural discoveries, and innovative engineering paradigms before an esteemed panel of faculty judges.',
    rules: [
      'Teams of 1 to 3 participants.',
      'Presentation duration: 8 mins presentation + 2 mins Q&A.',
      'Topics: AI/ML, Cloud, Cyber Security, Web3, IoT, Big Data.',
      'Standard IEEE slide format recommended.'
    ],
    coordinators: [
      { name: 'Staff Coordinator', role: 'Staff Lead', phone: '+91 98405 67890' },
      { name: 'Student Coordinator', role: 'Student Lead', phone: '+91 93456 78901' }
    ],
    prizes: {
      first: '₹3,500 + Shield',
      second: '₹2,000 + Certificate',
      third: '₹1,000 + Certificate'
    },
    status: 'AVAILABLE',
    icon_name: 'presentation'
  },

  // NON-TECHNICAL EVENTS (06 - 09)
  {
    id: 'borderland-at-gcee',
    code: '06',
    mission_name: 'BORDERLAND @ GCEE',
    title: 'Borderland @ Gcee',
    tagline: 'Survive. Strategize. Dominate.',
    event_type: 'NON_TECH',
    category: 'NON_TECHNICAL',
    clearance_level: 'LEVEL 01',
    team_size_min: 2,
    team_size_max: 4,
    schedule_time: '01:30 PM - 03:30 PM',
    duration: '2 hrs',
    venue: 'Open Quadrangle & Student Center',
    description: 'An immersive survival challenge with strategic mini-games, clue trails, and cooperative problem-solving tests across the campus borderlands.',
    rules: [
      'Teams of 2 to 4 members.',
      'Multiple elimination stages and tactical checkpoint games.',
      'No running inside academic halls.',
      'Fair play guidelines strictly enforced.'
    ],
    coordinators: [
      { name: 'Staff Coordinator', role: 'Staff Lead', phone: '+91 98406 78901' },
      { name: 'Student Coordinator', role: 'Student Lead', phone: '+91 95678 90123' }
    ],
    prizes: {
      first: '₹2,500 + Trophy',
      second: '₹1,500 + Certificate',
      third: '₹1,000 + Certificate'
    },
    status: 'AVAILABLE',
    icon_name: 'gaming'
  },
  {
    id: 'think-strike-and-win',
    code: '07',
    mission_name: 'THINK, STRIKE AND WIN',
    title: 'Think,Strike and Win',
    tagline: 'Think fast. Strike sharp. Win all.',
    event_type: 'NON_TECH',
    category: 'NON_TECHNICAL',
    clearance_level: 'LEVEL 01',
    team_size_min: 2,
    team_size_max: 3,
    schedule_time: '11:00 AM - 12:30 PM',
    duration: '1 hr 30 mins',
    venue: 'Main Auditorium / Stage Area',
    description: 'Rapid-fire intellectual combat featuring lateral thinking puzzles, buzzer rounds, and strategic decision trees under dynamic pressure.',
    rules: [
      'Teams of 2 to 3 members.',
      'Buzzer speed and penalty scoring rounds.',
      'Electronic devices strictly prohibited on stage.',
      'Judges verdict is final in case of dispute.'
    ],
    coordinators: [
      { name: 'Staff Coordinator', role: 'Staff Lead', phone: '+91 98407 89012' },
      { name: 'Student Coordinator', role: 'Student Lead', phone: '+91 96789 01234' }
    ],
    prizes: {
      first: '₹2,500 + Trophy',
      second: '₹1,500 + Certificate',
      third: '₹1,000 + Certificate'
    },
    status: 'AVAILABLE',
    icon_name: 'target'
  },
  {
    id: 'plot-twist',
    code: '08',
    mission_name: 'PLOT TWIST',
    title: 'Plot twist',
    tagline: 'Expect the unexpected.',
    event_type: 'NON_TECH',
    category: 'NON_TECHNICAL',
    clearance_level: 'LEVEL 01',
    team_size_min: 1,
    team_size_max: 3,
    schedule_time: '02:00 PM - 03:30 PM',
    duration: '1 hr 30 mins',
    venue: 'Media Studio / Room 204',
    description: 'Spontaneous storytelling and creative improv under sudden constraint twists. Adapt your plotline on the fly when new surprise elements are dropped.',
    rules: [
      'Solo or team of up to 3 members.',
      'Prompts and sudden plot twists provided live on stage.',
      'Judged on creativity, delivery, coherence, and audience engagement.',
      'Time limit: 5 minutes per performance.'
    ],
    coordinators: [
      { name: 'Staff Coordinator', role: 'Staff Lead', phone: '+91 98408 90123' },
      { name: 'Student Coordinator', role: 'Student Lead', phone: '+91 97890 56781' }
    ],
    prizes: {
      first: '₹2,500 + Trophy',
      second: '₹1,500 + Certificate',
      third: '₹1,000 + Certificate'
    },
    status: 'AVAILABLE',
    icon_name: 'theater'
  },
  {
    id: 'short-flim',
    code: '09',
    mission_name: 'SHORT FLIM',
    title: 'Short flim',
    tagline: 'Freeze moments. Frame stories.',
    event_type: 'NON_TECH',
    category: 'NON_TECHNICAL',
    clearance_level: 'LEVEL 01',
    team_size_min: 1,
    team_size_max: 5,
    schedule_time: '01:00 PM - 03:30 PM',
    duration: '2 hrs 30 mins',
    venue: 'AV Screening Hall (Mech Block)',
    description: 'Screen your original cinematic creations, narrative short films, or creative documentaries evaluated by visual storytellers and filmmakers.',
    rules: [
      'Team of up to 5 crew members.',
      'Film duration: 3 to 10 minutes including credits.',
      'Format: MP4/MKV in 1080p full HD on USB drive or drive link.',
      'Must contain original content and copyright-free or credited audio.'
    ],
    coordinators: [
      { name: 'Staff Coordinator', role: 'Staff Lead', phone: '+91 98409 01234' },
      { name: 'Student Coordinator', role: 'Student Lead', phone: '+91 98901 23456' }
    ],
    prizes: {
      first: '₹3,000 + Trophy',
      second: '₹2,000 + Certificate',
      third: '₹1,000 + Certificate'
    },
    status: 'AVAILABLE',
    icon_name: 'camera'
  }
];
