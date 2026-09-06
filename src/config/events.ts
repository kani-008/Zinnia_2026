import { EventMission } from '../types';

export const OFFICIAL_MISSIONS: EventMission[] = [
  // TECHNICAL EVENTS (01 - 05)
  {
    id: 'debugging',
    code: '02',
    display_order: 2,
    mission_name: 'DEBUGGING',
    title: 'Debugging',
    tagline: 'Find. Fix. Conquer.',
    event_type: 'TECH',
    category: 'TECHNICAL',
    clearance_level: 'LEVEL 01',
    team_size_min: 1,
    team_size_max: 1,
    schedule_time: '11:00 AM - 12:30 PM',
    duration: '1 hr 30 mins',
    venue: 'Auditorium 1st floor',
    description: 'A fast-paced debugging battle designed to test your coding skills. Debug broken programs, predict outputs and fill in missing code before the clock runs out.',
    rules: [
      'Solo challenge - one participant, one mission.',
      'Debug the Code - identify and fix errors in the given programs.',
      'Predict the Output - analyze code and determine the correct output.',
      'Fill in the Blanks - complete missing parts of the code correctly.',
      'Race against time - solve as many challenges as possible before the clock runs out and claim the top spot.',
    ],
    coordinators: [
      { name: 'Prabakaran D', role: 'STUDENT COORDINATOR', phone: '+91 63692 20453' },
      { name: 'Deepakala', role: 'STUDENT COORDINATOR', phone: '+91 93425 60879' }
    ],
    prizes: {
      first: '₹1,000',
      second: '₹600'
    },
    status: 'AVAILABLE',
    icon_name: 'debug'
  },
  {
    id: 'the-last-signal',
    code: '03',
    display_order: 3,
    mission_name: 'THE LAST SIGNAL',
    title: 'The Last Signal',
    tagline: 'Investigate. Defend. Connect. Uncover.',
    event_type: 'TECH',
    category: 'TECHNICAL',
    clearance_level: 'LEVEL 01',
    team_size_min: 1,
    team_size_max: 1,
    schedule_time: '11:00 AM - 12:30 PM',
    duration: '1 hr 30 mins',
    venue: '104 class room',
    description: 'Your spouse is dead - and the evidence points toward you. Investigate the case, defend yourself using the evidence, and uncover the truth before the final signal disappears. An AI-powered, evidence-based investigation where you are the primary suspect.',
    rules: [
      'Team size: individual.',
      'Challenge: investigate a mysterious death where you are the primary suspect.',
      'Format: AI-powered, evidence-based investigation.',
      'Examine messages, images, videos, records, digital traces and other clues to reconstruct what happened.',
      'Skills tested: logical reasoning, critical thinking, evidence analysis, deduction and decision-making.',
      'Objective: prove your innocence, uncover the hidden connections between the suspects, and identify the person responsible.',
      'Winning criteria: accuracy + reasoning + speed + score.',
    ],
    coordinators: [
      { name: 'Abdul Razith', role: 'STUDENT COORDINATOR', phone: '+91 90470 57868' },
      { name: 'Sri Karthika', role: 'STUDENT COORDINATOR', phone: '+91 93618 40633' }
    ],
    prizes: {
      first: '₹1,000',
      second: '₹600'
    },
    status: 'AVAILABLE',
    icon_name: 'signal'
  },
  {
    id: 'lost-at-sql',
    code: '04',
    display_order: 4,
    mission_name: 'LOST AT SQL',
    title: 'Lost at SQL',
    tagline: 'Get lost in the queries. Find your way out with SQL!',
    event_type: 'TECH',
    category: 'TECHNICAL',
    clearance_level: 'LEVEL 01',
    team_size_min: 2,
    team_size_max: 2,
    schedule_time: '01:30 PM - 03:00 PM',
    duration: '1 hr 30 mins',
    venue: 'CC2 lab',
    description: 'The Black Cipher prototype has vanished, and the only evidence left is buried in the database. Query the records, connect the clues, and solve the case before time runs out.',
    rules: [
      'Challenge: crack a single SQL-based investigation.',
      'Rounds: solve 6 challenging case files using SQL queries.',
      'Skills tested: SELECT, WHERE, GROUP BY, HAVING, JOIN, subqueries, aggregate functions and data analysis.',
      'Objective: analyze the database, uncover hidden clues, eliminate suspects, and identify the culprit.',
      'Winning criteria: accuracy + speed + score.',
    ],
    coordinators: [
      { name: 'Vignesh', role: 'STUDENT COORDINATOR', phone: '+91 80154 91593' },
      { name: 'Indhumathi', role: 'STUDENT COORDINATOR', phone: '+91 80729 51205' }
    ],
    prizes: {
      first: '₹1,000',
      second: '₹600'
    },
    status: 'AVAILABLE',
    icon_name: 'database'
  },
  {
    id: 'gadget-codes',
    // The MEGA EVENT. It opens the section as 01 in its own tier; the other
    // technical events follow as 02-05, then the non-technical row 06-09.
    code: '01',
    display_order: 1,
    is_mega: true,
    mission_name: 'GADGET CODES',
    title: 'Gadget Codes (Single event)',
    tagline: 'Coding event with puzzle solving.',
    event_type: 'TECH',
    category: 'TECHNICAL',
    clearance_level: 'LEVEL 01',
    is_single_event_only: true,
    team_size_min: 2,
    team_size_max: 2,
    schedule_time: '11:00 AM - 02:30 PM',
    duration: '3 hrs 30 mins',
    venue: 'CC1 lab',
    description: 'Three rounds that go from a technical quiz to a team coding challenge with hindrances, and finally a puzzle hunt for passcode fragments that unlock the last coding challenge.',
    rules: [
      'Team size: 2 members.',
      'Complete 3 challenging rounds.',
      'Round 1: Technical Quiz.',
      'Round 2: Team Coding Challenge with hindrances.',
      'Round 3: solve puzzles and collect passcode fragments.',
      'Arrange the fragments to unlock the final coding challenge.',
      'Complete all challenges within the given time.',
    ],
    coordinators: [
      { name: 'Muhammed Umer', role: 'STUDENT COORDINATOR', phone: '+91 94458 86230' },
      { name: 'Swathi', role: 'STUDENT COORDINATOR', phone: '+91 93610 63211' }
    ],
    prizes: {
      first: '₹2,000',
      second: '₹1,000'
    },
    status: 'AVAILABLE',
    icon_name: 'circuit'
  },
  {
    id: 'paper-presentation',
    code: '05',
    display_order: 5,
    mission_name: 'PAPER PRESENTATION',
    title: 'Paper Presentation',
    tagline: 'Ideas that speak. Impact that lasts.',
    event_type: 'TECH',
    category: 'TECHNICAL',
    clearance_level: 'LEVEL 01',
    team_size_min: 2,
    team_size_max: 3,
    schedule_time: '11:00 AM - 03:00 PM',
    duration: '4 hrs',
    venue: 'IT & CSE Seminar Hall',
    description: 'Present original research manuscripts, architectural discoveries, and innovative engineering paradigms before an esteemed panel of faculty judges.',
    rules: [
      'Teams of 1 to 2 participants.',
      'Presentation duration: 8 mins presentation + 2 mins Q&A.',
      'Topics: AI/ML, Cloud, Cyber Security, Web3, IoT, Big Data.',
      'Standard IEEE slide format recommended.'
    ],
    coordinators: [
      { name: 'Kanishkar', role: 'STUDENT COORDINATOR', phone: '+91 87787 84819' },
      { name: 'Karishma', role: 'STUDENT COORDINATOR', phone: '+91 84381 94881' }
    ],
    prizes: {
      first: '₹1,000 per panel (2 panels)'
    },
    status: 'AVAILABLE',
    icon_name: 'presentation'
  },

  // NON-TECHNICAL EVENTS (06 - 09)
  {
    id: 'borderland-at-gcee',
    code: '06',
    display_order: 6,
    mission_name: 'BORDERLAND @ GCEE',
    title: 'Borderland @ Gcee',
    tagline: 'Inspired by the series Alice in Borderland.',
    event_type: 'NON_TECH',
    category: 'NON_TECHNICAL',
    clearance_level: 'LEVEL 01',
    team_size_min: 3,
    team_size_max: 3,
    schedule_time: '12:00 PM - 03:00 PM',
    duration: '3 hrs',
    venue: '101, 102 class room',
    description: 'Round 1 - Welcome to Borderland @ GCEE: your visa is issued for Round 1. To extend it and advance, your team must survive three games - one tests your memory, one your instinct against the crowd, one your nerve against doubt itself. Round 2 - Borderland Hunt @ GCEE: enter unknown territory where every step could lead to victory or send you the wrong way. Think fast, trust your teammates, decide under pressure - and remember, you are not the only ones hunting.',
    rules: [
      'Team size: 3 participants per team.',
      'Round 1 - Welcome to Borderland @ GCEE: survive three games to extend your visa to Round 2.',
      'Round 2 - Borderland Hunt @ GCEE: navigate unknown territory; the Borderland may offer chances to turn the game against your rivals.',
      'Teams must not assist other teams or disclose game-related information.',
      'Any misbehavior, cheating, or violation of event rules may result in immediate disqualification.',
      'Participants must follow the rules and instructions for each game to continue in the event.',
      'Requirement: one mobile phone per team, with enough battery and internet connectivity throughout the event.',
    ],
    coordinators: [
      { name: 'Praveenraja', role: 'STUDENT COORDINATOR', phone: '+91 63822 79383' },
      { name: 'Kaviyasri', role: 'STUDENT COORDINATOR', phone: '+91 76393 67928' }
    ],
    prizes: {
      first: '₹1,000',
      second: '₹600'
    },
    status: 'AVAILABLE',
    icon_name: 'gaming'
  },
  {
    id: 'think-strike-and-win',
    code: '07',
    display_order: 7,
    mission_name: 'THINK, STRIKE AND WIN',
    title: 'Think,Strike and Win',
    tagline: 'Guess & Strike.',
    event_type: 'NON_TECH',
    category: 'NON_TECHNICAL',
    clearance_level: 'LEVEL 01',
    team_size_min: 3,
    team_size_max: 3,
    schedule_time: '12:00 PM - 02:30 PM',
    duration: '2 hrs 30 mins',
    venue: '103 class room',
    description: 'A single-round guessing battle for teams of three: one Clue Giver, two Guessers, eight questions, thirty seconds each. Score on speed and accuracy, spend your Lucky Strikers wisely, and top the board.',
    rules: [
      'Team size: 3 members - 1 Clue Giver and 2 Guessers.',
      'Single round: complete 8 questions within the given time.',
      'Each question has a maximum time limit of 30 seconds.',
      'Score points based on speed and accuracy.',
      'Each team receives 3 Lucky Strikers.',
      'Lucky Strikers can be used only during the first 5 questions.',
      'Use strategy and teamwork to maximize your score.',
      'After all 8 questions the scores are calculated; the team with the highest total score is declared the winner.',
    ],
    coordinators: [
      { name: 'Sivabalan', role: 'STUDENT COORDINATOR', phone: '+91 63845 11989' },
      { name: 'Yogeshwari', role: 'STUDENT COORDINATOR', phone: '+91 90809 99795' }
    ],
    prizes: {
      first: '₹1,000',
      second: '₹600'
    },
    status: 'AVAILABLE',
    icon_name: 'target'
  },
  {
    id: 'plot-twist',
    code: '08',
    display_order: 8,
    mission_name: 'PLOT TWIST',
    title: 'Plot twist',
    tagline: 'Expect the unexpected.',
    event_type: 'NON_TECH',
    category: 'NON_TECHNICAL',
    clearance_level: 'LEVEL 01',
    team_size_min: 3,
    team_size_max: 3,
    schedule_time: '01:30 PM - 03:00 PM',
    duration: '1 hr 30 mins',
    venue: '103 class room',
    description: 'Uncover the hidden twist by analyzing the story, solving clues, and connecting the evidence. Think fast, solve smart, and reach the Finale with the best advantage.',
    rules: [
      'Team size: 3 members.',
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
      first: '₹1,000',
      second: '₹600'
    },
    status: 'AVAILABLE',
    icon_name: 'theater'
  },
  {
    id: 'short-flim',
    code: '09',
    display_order: 9,
    mission_name: 'SHORT FILM',
    title: 'Short Film',
    tagline: 'Freeze moments. Frame stories.',
    event_type: 'NON_TECH',
    category: 'NON_TECHNICAL',
    clearance_level: 'LEVEL 01',
    team_size_min: 1,
    team_size_max: 3,
    schedule_time: '01:30 PM – 02:30 PM',
    duration: '1 hr',
    venue: 'Seminar Hall 2',
    description: 'Create an original short film inspired by time, perspective, and self-doubt. Tell a meaningful story through visuals, characters, and emotions while keeping the narrative clear and engaging.',
    rules: [
      'Maximum film duration: 8 minutes.',
      'Individual or 2-member team participation is allowed.',
      'The film must be based on one of the given themes.',
      'Only original content is permitted; previously published films are not allowed.',
      'Participants must have the rights to all music, footage, and other media used.',
      'Offensive, discriminatory, or inappropriate content is not permitted.',
      'Films will be judged based on story, creativity, direction, originality, and overall impact.'
    ],
    coordinators: [
      { name: 'Aswin Sanjeev Kumar', role: 'STUDENT COORDINATOR', phone: '+91 79040 98102' },
      { name: 'Harshini', role: 'STUDENT COORDINATOR', phone: '+91 93634 52517' }
    ],
    prizes: {
      first: '₹500'
    },
    status: 'AVAILABLE',
    icon_name: 'camera'
  }
];
