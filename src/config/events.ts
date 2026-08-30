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
    schedule_time: '11:00 AM - 12:30 PM',
    duration: '1 hr 30 mins',
    venue: 'Auditorium 1st floor',
    description: 'Find bugs, identify system failures, fix faulty code, and restore the program to working condition. Test your logic and debugging skills against the clock.',
    rules: [
      'Team size: 1–2 members.',
      'Languages: C, C++, Java, and Python.',
      'Complete 2 rounds of debugging challenges.',
      'Identify bugs, fix code, and determine correct outputs.',
      'Round 1: Easy & Intermediate challenges.',
      'Round 2: Intermediate & Hard challenges.',
      'Complete the challenge within 60 minutes.'
    ],
    coordinators: [
      { name: 'Prabakaran D', role: 'STUDENT COORDINATOR', phone: '+91 63692 20453' },
      { name: 'Deepakala', role: 'STUDENT COORDINATOR', phone: '+91 93425 60879' }
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
    schedule_time: '11:00 AM - 12:30 PM',
    duration: '1 hr 30 mins',
    venue: '104 class room',
    description: 'Intercept, decrypt, and decode corrupted signal packets through cryptographic puzzles, packet analysis, and binary telemetry.',
    rules: [
      'Team of 1 to 2 members.',
      'Rounds of ciphers, steganography, and frequency analysis.',
      'Internet access restricted to designated tools.',
      'Tie-breaker based on completion speed.'
    ],
    coordinators: [
      { name: 'Abdul Razith', role: 'STUDENT COORDINATOR', phone: '+91 90470 57868' },
      { name: 'Sri Karthika', role: 'STUDENT COORDINATOR', phone: '+91 93618 40633' }
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
    team_size_max: 3,
    schedule_time: '01:30 PM - 03:00 PM',
    duration: '1 hr 30 mins',
    venue: 'CC2 lab',
    description: 'Investigate the disappearance of Black Cipher. Search the database, connect hidden clues, and reconstruct the truth using SQL.',
    rules: [
      'Team size: Up to 3 members.',
      'Solve 15–20 SQL challenges.',
      'Use database evidence to solve the case.',
      'Complete the investigation within 60 minutes.'
    ],
    coordinators: [
      { name: 'Vignesh', role: 'STUDENT COORDINATOR', phone: '+91 80154 91593' },
      { name: 'Indhumathi', role: 'STUDENT COORDINATOR', phone: '+91 80729 51205' }
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
    team_size_min: 2,
    team_size_max: 2,
    schedule_time: '11:00 AM - 02:30 PM',
    duration: '3 hrs 30 mins',
    venue: 'CC1 lab',
    description: 'Compete through quizzes, coding challenges, and a puzzle hunt. Test your technical knowledge, coding skills, and teamwork to unlock the final challenge.',
    rules: [
      'Team size: 2 members.',
      'Complete 3 challenging rounds.',
      'Round 1: Technical Quiz.',
      'Round 2: Team Coding Challenge with 30-second swaps.',
      'Round 3: Solve puzzles and collect QR passcode fragments.',
      'Arrange the fragments to unlock the final challenge.',
      'Top-performing teams advance to the next round.',
      'Complete all challenges within the given time.'
    ],
    coordinators: [
      { name: 'Muhammed Umer', role: 'STUDENT COORDINATOR', phone: '+91 94458 86230' },
      { name: 'Swathi', role: 'STUDENT COORDINATOR', phone: '+91 93610 63211' }
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
    schedule_time: '11:00 AM - 03:00 PM',
    duration: '4 hrs',
    venue: 'IT & CSE Seminar Hall',
    description: 'Present original research manuscripts, architectural discoveries, and innovative engineering paradigms before an esteemed panel of faculty judges.',
    rules: [
      'Teams of 1 to 3 participants.',
      'Presentation duration: 8 mins presentation + 2 mins Q&A.',
      'Topics: AI/ML, Cloud, Cyber Security, Web3, IoT, Big Data.',
      'Standard IEEE slide format recommended.'
    ],
    coordinators: [
      { name: 'Kanishkar', role: 'STUDENT COORDINATOR', phone: '+91 87787 84819' },
      { name: 'Karishma', role: 'STUDENT COORDINATOR', phone: '+91 84381 94881' }
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
    team_size_max: 3,
    schedule_time: '12:00 PM - 03:00 PM',
    duration: '3 hrs',
    venue: '101, 102 class room',
    description: 'Enter the Borderland, survive strategic mini-games, and outsmart rival teams. Clear Round 1 to extend your visa and enter the final Borderland Hunt.',
    rules: [
      'Team size: 2–3 members.',
      'Round 1: Welcome to Borderland @ GCEE.',
      'Complete 3 strategic mini-games.',
      'Every decision affects your team’s leaderboard position.',
      'Top-performing teams qualify for the next round.',
      'Round 2: Borderland Hunt @ GCEE.',
      'Solve clues, discover hidden paths, and complete challenges.',
      'Teamwork, strategy, observation, and time management are essential.',
      'No do-overs — every move counts.'
    ],
    coordinators: [
      { name: 'Praveenraja', role: 'STUDENT COORDINATOR', phone: '+91 63822 79383' },
      { name: 'Kaviyasri', role: 'STUDENT COORDINATOR', phone: '+91 76393 67928' }
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
    schedule_time: '12:00 PM - 02:30 PM',
    duration: '2 hrs 30 mins',
    venue: '103 class room',
    description: 'Challenge your logic, observation, and general knowledge through three fast-paced rounds. Think smart, connect the clues, and identify the answer before time runs out.',
    rules: [
      'Team size: 2–3 members.',
      'Round 1: Solve Logical & GK MCQs.',
      'Round 2: Connect pictures and find the common link.',
      'Round 3: Identify the mystery answer from clues.',
      'Fewer clues mean higher points.',
      'Fast and accurate answers score higher.',
      'Teamwork and quick thinking are essential.'
    ],
    coordinators: [
      { name: 'Sivabalan', role: 'STUDENT COORDINATOR', phone: '+91 63845 11989' },
      { name: 'Yogeshwari', role: 'STUDENT COORDINATOR', phone: '+91 90809 99795' }
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
    schedule_time: '01:30 PM - 03:00 PM',
    duration: '1 hr 30 mins',
    venue: '103 class room',
    description: 'Uncover the hidden twist by analyzing the story, solving clues, and connecting the evidence. Think fast, solve smart, and reach the Finale with the best advantage.',
    rules: [
      'Team participation.',
      'Complete 2 deduction rounds.',
      'Each round lasts 30 minutes.',
      'Clues are revealed at the 8- and 16-minute marks.',
      'Hints are available after solving a mini-puzzle.',
      'No elimination in Round 1.',
      'Faster completion earns advantages for the Finale.',
      'Finale rankings are decided by completion time.'
    ],
    coordinators: [
      { name: 'Hariharan', role: 'STUDENT COORDINATOR', phone: '+91 88388 69405' },
      { name: 'Akshaya', role: 'STUDENT COORDINATOR', phone: '+91 63818 83013' }
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
    schedule_time: '01:30 PM - 02:30 PM',
    duration: '1 hr',
    venue: '',
    description: 'Screen your original cinematic creations, narrative short films, or creative documentaries evaluated by visual storytellers and filmmakers.',
    rules: [
      'Team of up to 5 crew members.',
      'Film duration: 3 to 10 minutes including credits.',
      'Format: MP4/MKV in 1080p full HD on USB drive or drive link.',
      'Must contain original content and copyright-free or credited audio.'
    ],
    coordinators: [
      { name: 'Aswin Sanjeev Kumar', role: 'STUDENT COORDINATOR', phone: '+91 79040 98102' },
      { name: 'Harshini', role: 'STUDENT COORDINATOR', phone: '+91 93634 52517' }
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
