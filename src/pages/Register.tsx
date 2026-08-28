import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { store } from '../services/store';
import { audioManager } from '../core/AudioManager';
import { 
  ArrowRight, 
  ArrowLeft,
  AlertCircle, 
  Users, 
  User, 
  Plus, 
  Trash2, 
  Shield, 
  Cpu, 
  Sparkles,
  Phone,
  Mail
} from 'lucide-react';

interface MemberInput {
  name: string;
  email: string;
  phone: string;
}

export const WebsiteRegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preselectedMission = searchParams.get('mission');

  const [teamName, setTeamName] = useState('');
  const [college, setCollege] = useState('');
  const [department, setDepartment] = useState('Computer Science and Engineering');
  const [year, setYear] = useState('III');
  const [registeredEvents, setRegisteredEvents] = useState<string[]>(
    preselectedMission ? [preselectedMission] : []
  );

  // Leader is Member 0
  const [leader, setLeader] = useState<MemberInput>({
    name: '',
    email: '',
    phone: ''
  });

  // Additional Team Members
  const [members, setMembers] = useState<MemberInput[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const allEvents = store.getEvents();

  const techEvents = useMemo(
    () => allEvents.filter(e => e.event_type === 'TECH' || e.category === 'TECHNICAL'),
    [allEvents]
  );
  const nonTechEvents = useMemo(
    () => allEvents.filter(e => e.event_type === 'NON_TECH' || e.category === 'NON_TECHNICAL'),
    [allEvents]
  );

  // Determine required and max team sizes based on selected events
  const { minTeamSize, maxTeamSize } = useMemo(() => {
    if (registeredEvents.length === 0) {
      return { minTeamSize: 1, maxTeamSize: 1 };
    }
    const selectedEvObjs = allEvents.filter(e => registeredEvents.includes(e.id));
    const min = Math.max(...selectedEvObjs.map(e => e.team_size_min || 1));
    const max = Math.max(...selectedEvObjs.map(e => e.team_size_max || 1));
    return { minTeamSize: min, maxTeamSize: max };
  }, [registeredEvents, allEvents]);

  // Adjust member inputs when event requirements change
  const totalMembersAllowed = maxTeamSize;
  const additionalSlotsRequired = Math.max(0, minTeamSize - 1);

  const handleToggleEvent = (id: string) => {
    audioManager.playNodeEngage();
    setRegisteredEvents(prev => {
      const next = prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id];
      return next;
    });
  };

  const handleAddMemberSlot = () => {
    if (members.length + 1 < maxTeamSize) {
      audioManager.playNodeEngage();
      setMembers(prev => [...prev, { name: '', email: '', phone: '' }]);
    }
  };

  const handleRemoveMemberSlot = (index: number) => {
    audioManager.playNodeEngage();
    setMembers(prev => prev.filter((_, i) => i !== index));
  };

  const handleMemberChange = (index: number, field: keyof MemberInput, value: string) => {
    setMembers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!leader.name.trim() || !leader.email.trim() || !leader.phone.trim() || !college.trim()) {
      setError('Please provide all mandatory team leader credentials (name, email, phone) and college name.');
      return;
    }

    if (leader.phone.trim().length < 10) {
      setError('Please enter a valid 10-digit mobile number for the team leader.');
      return;
    }

    if (registeredEvents.length === 0) {
      setError('Please select at least one symposium event (Technical or Non-Technical).');
      return;
    }

    const currentTotalMembers = 1 + members.length;
    if (currentTotalMembers < minTeamSize) {
      setError(`Selected events require a minimum team size of ${minTeamSize} members. Please add ${minTeamSize - currentTotalMembers} more member(s).`);
      return;
    }

    // Check all added members have required fields including phone
    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      if (!m.name.trim() || !m.email.trim() || !m.phone.trim()) {
        setError(`Please fill in all details (name, email, and phone number) for Team Member ${i + 2}.`);
        return;
      }
      if (m.phone.trim().length < 10) {
        setError(`Please enter a valid 10-digit mobile phone number for Team Member ${i + 2}.`);
        return;
      }
    }

    setIsSubmitting(true);
    audioManager.playNodeEngage();

    setTimeout(async () => {
      try {
        const teamPayload = {
          team_name: teamName.trim() || `${leader.name}'s Squad`,
          college: college.trim(),
          department,
          year,
          registered_events: registeredEvents
        };

        const allMemberPayloads = [
          { name: leader.name.trim(), email: leader.email.trim(), phone: leader.phone.trim(), is_leader: true },
          ...members.map(m => ({ name: m.name.trim(), email: m.email.trim(), phone: m.phone.trim(), is_leader: false }))
        ];

        const registeredTeam = await store.registerTeam(teamPayload, allMemberPayloads);
        navigate(`/payment?id=${registeredTeam.team_id}`);
      } catch (err: any) {
        setError(err.message || 'Registration failed.');
        setIsSubmitting(false);
      }
    }, 300);
  };

  return (
    <div className="relative min-h-screen bg-transparent text-[#F2F2F0]">
      {/* 2D Neubrutalist Comic Top Navigation Bar (Theme 2 Header) */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 py-3 bg-[#0D0D0F]/80 backdrop-blur-md border-b-2 border-[#3A3A3E]">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Left: Illustrated ZINNIA '26 Comic Logo Badge matching Theme 2 */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              onClick={() => audioManager.playNodeEngage()}
              className="cursor-pointer group relative px-3.5 py-1 sm:px-4 sm:py-1.5 bg-[#F5D90A] border-[3px] border-[#F5D90A] shadow-[3.5px_3.5px_0px_#8A7400] -rotate-1 hover:rotate-0 transition-transform active:translate-x-0.5 active:translate-y-0.5 inline-flex items-center"
              title="Return to Home"
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-display text-xl sm:text-2xl text-[#0D0D0F] tracking-wide font-black">
                  ZINNIA
                </span>
                <span className="font-comic text-lg sm:text-xl text-[#FF3366] font-black">
                  '26
                </span>
              </div>
              {/* Speech Tail */}
              <div className="absolute -bottom-2 left-4 w-2.5 h-2.5 bg-[#F5D90A] border-r-[3px] border-b-[3px] border-[#F5D90A] rotate-45" />
            </Link>

            {/* Comics Code Authority Parody Stamp */}
            <div className="hidden sm:flex flex-col items-center justify-center p-1 px-2 bg-[#1A1A1D] border-[1.5px] border-[#3A3A3E] shadow-[2px_2px_0px_#000000] rotate-2 text-[7px] font-mono leading-tight uppercase font-black text-center text-[#A8A8AC]">
              <span>APPROVED</span>
              <span className="text-[6px] text-[#FF3366]">BY THE</span>
              <span>CSE CODE</span>
            </div>
          </div>

          {/* Right: Theme 2 Pop-Art Neubrutalist Back Button */}
          <Link
            to="/"
            onClick={() => audioManager.playNodeEngage()}
            className="px-3.5 py-1.5 sm:px-5 sm:py-2 bg-[#F5D90A] hover:bg-[#FFE633] text-[#0D0D0F] border-[2.5px] border-[#F5D90A] shadow-[3.5px_3.5px_0px_#8A7400] hover:shadow-[4.5px_4.5px_0px_#8A7400] font-comic font-black text-xs sm:text-sm tracking-wider uppercase transition-all flex items-center gap-2 active:translate-x-0.5 active:translate-y-0.5 cursor-pointer rounded-none"
          >
            <ArrowLeft className="w-4 h-4 stroke-[3]" />
            <span>BACK TO HOME</span>
          </Link>
        </div>
      </header>

      {/* Main Register Form Container */}
      <div className="pt-24 sm:pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto space-y-8 select-none">
        {/* Header Card (100% Theme 2 Pop-Art Comic Panel + Translucent Glass & Bent Rounded Edge) */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0D0D0F]/70 border-[3px] border-[#F5D90A] shadow-[6px_6px_0px_#8A7400] backdrop-blur-2xl space-y-4 relative overflow-hidden">
          {/* Top Comic Badges */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-[#F5D90A] text-[#0D0D0F] border-[2px] border-[#0D0D0F] shadow-[2.5px_2.5px_0px_#000000] font-comic font-black text-xs uppercase tracking-wider -rotate-1 rounded-md">
                CHAPTER 02: THE ENROLLMENT
              </span>
              <span className="hidden sm:inline-block px-2.5 py-1 bg-[#1A1A1D]/90 text-[#A8A8AC] border-[1.5px] border-[#3A3A3E] shadow-[2px_2px_0px_#000000] font-mono text-[9px] uppercase font-bold rounded-md">
                GOVT COLLEGE OF ENGINEERING, ERODE &bull; CSE DEPT
              </span>
            </div>

            <div className="text-[10px] font-mono text-[#3CE7FF] uppercase tracking-widest flex items-center gap-1.5 font-bold bg-[#0D0D0F]/90 px-2.5 py-1 border border-[#3CE7FF]/40 shadow-[2px_2px_0px_#000000] rounded-md">
              <Shield className="w-3.5 h-3.5 text-[#3CE7FF]" />
              <span>OFFICIAL REGISTRATION // ZINNIA '26</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <h1 className="text-2xl sm:text-4xl font-black text-[#F2F2F0] font-display tracking-wide uppercase">
              TEAM & PARTICIPANT ENROLLMENT
            </h1>
            <p className="text-xs text-[#A8A8AC] font-mono leading-relaxed">
              Register your squad details. Each individual member will receive their own Digital Passport QR code for campus entry, event check-in, and lunch token.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-[#FF3366]/20 border-[2.5px] border-[#FF3366] text-[#FF3366] text-xs font-mono font-bold shadow-[4px_4px_0px_#000000] backdrop-blur-xl flex items-center gap-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-[#FF3366] shrink-0" />
            <span>{error}</span>
          </div>
        )}

      <form
        onSubmit={handleSubmit}
        className="p-6 sm:p-8 rounded-3xl bg-[#0D0D0F]/70 border-[3px] border-[#3A3A3E] shadow-[8px_8px_0px_#000000] backdrop-blur-2xl space-y-8 text-xs font-mono"
      >
        {/* Section 1: Event Selection Separated by Technical and Non-Technical */}
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3 flex-wrap border-b-2 border-[#3A3A3E] pb-3">
            <div className="inline-block px-3.5 py-1 bg-[#F5D90A] text-[#0D0D0F] border-[2.5px] border-[#0D0D0F] shadow-[3px_3px_0px_#000000] font-comic font-black text-xs sm:text-sm uppercase tracking-wider -rotate-1 rounded-md">
              STEP 01 // SELECT SYMPOSIUM EVENTS <span className="text-[#FF3366]">*</span>
            </div>
            {registeredEvents.length > 0 && (
              <span className="px-3 py-1 bg-[#3CE7FF] text-[#0D0D0F] border-[2px] border-[#0D0D0F] shadow-[2.5px_2.5px_0px_#000000] font-mono text-[11px] font-black uppercase rounded-md">
                REQUIRED TEAM: {minTeamSize} - {maxTeamSize} MEMBER(S)
              </span>
            )}
          </div>

          {/* Technical Events Subsection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#3CE7FF] font-black uppercase text-xs tracking-wider">
              <Cpu className="w-4 h-4" />
              <span>TECHNICAL EVENTS</span>
              <span className="text-[10px] text-[#A8A8AC] font-mono">({techEvents.length} MISSIONS)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {techEvents.map((e) => {
                const isChecked = registeredEvents.includes(e.id);
                return (
                  <div
                    key={e.id}
                    onClick={() => handleToggleEvent(e.id)}
                    className={`p-3.5 rounded-2xl border-[2.5px] cursor-pointer flex items-center justify-between gap-2.5 transition-all select-none backdrop-blur-md ${
                      isChecked
                        ? 'bg-[#3CE7FF] border-[#0D0D0F] text-[#0D0D0F] shadow-[4px_4px_0px_#1E8FA3] font-bold -translate-y-0.5'
                        : 'bg-[#16161C]/65 border-[#3A3A3E] text-[#F2F2F0] hover:border-[#3CE7FF] shadow-[3px_3px_0px_#000000]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className={`w-4 h-4 border-[2px] border-[#0D0D0F] rounded shrink-0 flex items-center justify-center font-black text-[10px] ${isChecked ? 'bg-[#0D0D0F] text-[#3CE7FF]' : 'bg-[#1A1A1D]'}`}>
                        {isChecked ? '✓' : ''}
                      </div>
                      <span className="truncate text-xs font-mono">
                        <strong className={isChecked ? 'text-[#0D0D0F] font-black' : 'text-[#3CE7FF]'}>[{e.code}]</strong> {e.mission_name}
                      </span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 border font-mono font-bold shrink-0 rounded ${isChecked ? 'bg-[#0D0D0F] text-[#3CE7FF] border-[#0D0D0F]' : 'bg-[#1A1A1D] text-[#A8A8AC] border-[#3A3A3E]'}`}>
                      {e.team_size_min}-{e.team_size_max}P
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Non-Technical Events Subsection */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-[#F5D90A] font-black uppercase text-xs tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>NON-TECHNICAL EVENTS</span>
              <span className="text-[10px] text-[#A8A8AC] font-mono">({nonTechEvents.length} MISSIONS)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {nonTechEvents.map((e) => {
                const isChecked = registeredEvents.includes(e.id);
                return (
                  <div
                    key={e.id}
                    onClick={() => handleToggleEvent(e.id)}
                    className={`p-3.5 rounded-2xl border-[2.5px] cursor-pointer flex items-center justify-between gap-2.5 transition-all select-none backdrop-blur-md ${
                      isChecked
                        ? 'bg-[#F5D90A] border-[#0D0D0F] text-[#0D0D0F] shadow-[4px_4px_0px_#8A7400] font-bold -translate-y-0.5'
                        : 'bg-[#16161C]/65 border-[#3A3A3E] text-[#F2F2F0] hover:border-[#F5D90A] shadow-[3px_3px_0px_#000000]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className={`w-4 h-4 border-[2px] border-[#0D0D0F] rounded shrink-0 flex items-center justify-center font-black text-[10px] ${isChecked ? 'bg-[#0D0D0F] text-[#F5D90A]' : 'bg-[#1A1A1D]'}`}>
                        {isChecked ? '✓' : ''}
                      </div>
                      <span className="truncate text-xs font-mono">
                        <strong className={isChecked ? 'text-[#0D0D0F] font-black' : 'text-[#F5D90A]'}>[{e.code}]</strong> {e.mission_name}
                      </span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 border font-mono font-bold shrink-0 rounded ${isChecked ? 'bg-[#0D0D0F] text-[#F5D90A] border-[#0D0D0F]' : 'bg-[#1A1A1D] text-[#A8A8AC] border-[#3A3A3E]'}`}>
                      {e.team_size_min}-{e.team_size_max}P
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 2: Team & Institutional Details */}
        <div className="space-y-4 pt-4 border-t-2 border-[#3A3A3E]">
          <div className="inline-block px-3.5 py-1 bg-[#3CE7FF] text-[#0D0D0F] border-[2.5px] border-[#0D0D0F] shadow-[3px_3px_0px_#000000] font-comic font-black text-xs sm:text-sm uppercase tracking-wider rotate-1 rounded-md">
            STEP 02 // SQUAD & COLLEGE CREDENTIALS
          </div>

          <div className="space-y-1.5 pt-1">
            <label className="block text-[#F2F2F0] font-bold uppercase text-xs">
              TEAM NAME / SQUAD TITLE <span className="text-[#A8A8AC] font-normal">(Optional for solo)</span>
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. Neural Vanguard / Cyber Phantoms"
              className="w-full px-4 py-3 rounded-xl bg-[#0D0D0F]/80 border-[2.5px] border-[#3A3A3E] text-white focus:border-[#F5D90A] focus:shadow-[3.5px_3.5px_0px_#8A7400] focus:outline-none font-mono text-xs transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[#F2F2F0] font-bold uppercase text-xs">
              COLLEGE / INSTITUTION NAME <span className="text-[#FF3366]">*</span>
            </label>
            <input
              type="text"
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              placeholder="e.g. Government College of Engineering, Erode"
              className="w-full px-4 py-3 rounded-xl bg-[#0D0D0F]/80 border-[2.5px] border-[#3A3A3E] text-white focus:border-[#F5D90A] focus:shadow-[3.5px_3.5px_0px_#8A7400] focus:outline-none font-mono text-xs transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[#F2F2F0] font-bold uppercase text-xs">DEPARTMENT</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#0D0D0F]/80 border-[2.5px] border-[#3A3A3E] text-white focus:border-[#F5D90A] focus:shadow-[3.5px_3.5px_0px_#8A7400] focus:outline-none font-mono text-xs transition-all"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[#F2F2F0] font-bold uppercase text-xs">ACADEMIC YEAR</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#0D0D0F]/80 border-[2.5px] border-[#3A3A3E] text-white focus:border-[#F5D90A] focus:shadow-[3.5px_3.5px_0px_#8A7400] focus:outline-none font-mono text-xs transition-all cursor-pointer"
              >
                <option value="I">1st Year</option>
                <option value="II">2nd Year</option>
                <option value="III">3rd Year</option>
                <option value="IV">4th Year</option>
                <option value="PG">Postgraduate</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Team Leader (Member 1) */}
        <div className="space-y-4 pt-4 border-t-2 border-[#3A3A3E]">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="inline-block px-3.5 py-1 bg-[#FF3366] text-white border-[2.5px] border-[#0D0D0F] shadow-[3px_3px_0px_#000000] font-comic font-black text-xs sm:text-sm uppercase tracking-wider -rotate-1 rounded-md">
              STEP 03 // TEAM LEADER (COMMANDER)
            </div>
            <span className="px-2.5 py-0.5 bg-[#F5D90A] text-[#0D0D0F] border border-[#0D0D0F] shadow-[2px_2px_0px_#000000] font-mono text-[10px] font-black uppercase rounded-md">
              PRIMARY CONTACT
            </span>
          </div>

          <div className="space-y-1.5 pt-1">
            <label className="block text-[#F2F2F0] font-bold uppercase text-xs">
              LEADER FULL NAME <span className="text-[#FF3366]">*</span>
            </label>
            <input
              type="text"
              value={leader.name}
              onChange={(e) => setLeader({ ...leader, name: e.target.value })}
              placeholder="e.g. Alex Mercer"
              className="w-full px-4 py-3 rounded-xl bg-[#0D0D0F]/80 border-[2.5px] border-[#3A3A3E] text-white focus:border-[#F5D90A] focus:shadow-[3.5px_3.5px_0px_#8A7400] focus:outline-none font-mono text-xs transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[#F2F2F0] font-bold uppercase text-xs flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#3CE7FF]" />
                <span>LEADER EMAIL</span>
                <span className="text-[#FF3366]">*</span>
              </label>
              <input
                type="email"
                value={leader.email}
                onChange={(e) => setLeader({ ...leader, email: e.target.value })}
                placeholder="leader@institution.edu"
                className="w-full px-4 py-3 rounded-xl bg-[#0D0D0F]/80 border-[2.5px] border-[#3A3A3E] text-white focus:border-[#F5D90A] focus:shadow-[3.5px_3.5px_0px_#8A7400] focus:outline-none font-mono text-xs transition-all"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[#F2F2F0] font-bold uppercase text-xs flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#3CE7FF]" />
                <span>LEADER PHONE NUMBER</span>
                <span className="text-[#FF3366]">*</span>
              </label>
              <input
                type="tel"
                value={leader.phone}
                onChange={(e) => setLeader({ ...leader, phone: e.target.value })}
                placeholder="+91 98401 23456"
                className="w-full px-4 py-3 rounded-xl bg-[#0D0D0F]/80 border-[2.5px] border-[#3A3A3E] text-white focus:border-[#F5D90A] focus:shadow-[3.5px_3.5px_0px_#8A7400] focus:outline-none font-mono text-xs transition-all"
                required
              />
            </div>
          </div>
        </div>

        {/* Section 4: Dynamic Additional Team Members */}
        {maxTeamSize > 1 && (
          <div className="space-y-4 pt-4 border-t-2 border-[#3A3A3E]">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="inline-block px-3.5 py-1 bg-[#F5D90A] text-[#0D0D0F] border-[2.5px] border-[#0D0D0F] shadow-[3px_3px_0px_#000000] font-comic font-black text-xs sm:text-sm uppercase tracking-wider rounded-md">
                  STEP 04 // SQUAD MEMBERS ({1 + members.length} / {maxTeamSize} MAX)
                </div>
                <p className="text-[11px] text-[#A8A8AC] font-mono mt-1">
                  Each member gets their own wristband, personalized QR pass, and food token.
                </p>
              </div>

              {members.length + 1 < maxTeamSize && (
                <button
                  type="button"
                  onClick={handleAddMemberSlot}
                  className="px-3.5 py-1.5 rounded-xl bg-[#F5D90A] hover:bg-[#FFE633] text-[#0D0D0F] border-[2.5px] border-[#0D0D0F] shadow-[3px_3px_0px_#8A7400] font-comic font-black text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>+ ADD MEMBER</span>
                </button>
              )}
            </div>

            {members.map((member, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-[#16161C]/65 backdrop-blur-xl border-[2px] border-[#3A3A3E] shadow-[3.5px_3.5px_0px_#000000] space-y-3 relative">
                <div className="flex items-center justify-between border-b border-[#3A3A3E] pb-2">
                  <span className="text-xs font-black text-[#F2F2F0] font-mono flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-[#3CE7FF] text-[#0D0D0F] border border-[#0D0D0F] flex items-center justify-center text-[10px] font-black">
                      {idx + 2}
                    </span>
                    <span>TEAM MEMBER {idx + 2}</span>
                    {idx < additionalSlotsRequired && <span className="text-[#FF3366] text-[10px]">(REQUIRED)</span>}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveMemberSlot(idx)}
                    className="text-[#A8A8AC] hover:text-[#FF3366] p-1 transition-colors cursor-pointer"
                    title="Remove member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] text-[#F2F2F0] font-bold uppercase">
                    MEMBER {idx + 2} FULL NAME <span className="text-[#FF3366]">*</span>
                  </label>
                  <input
                    type="text"
                    value={member.name}
                    onChange={(e) => handleMemberChange(idx, 'name', e.target.value)}
                    placeholder={`e.g. Member ${idx + 2} Full Name`}
                    className="w-full px-3 py-2 rounded-xl bg-[#0D0D0F]/80 border border-[#3A3A3E] text-white text-xs focus:border-[#F5D90A] focus:outline-none font-mono"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] text-[#F2F2F0] font-bold uppercase flex items-center gap-1">
                      <Mail className="w-3 h-3 text-[#3CE7FF]" />
                      <span>MEMBER {idx + 2} EMAIL</span>
                      <span className="text-[#FF3366]">*</span>
                    </label>
                    <input
                      type="email"
                      value={member.email}
                      onChange={(e) => handleMemberChange(idx, 'email', e.target.value)}
                      placeholder={`member${idx + 2}@institution.edu`}
                      className="w-full px-3 py-2 rounded-xl bg-[#0D0D0F]/80 border border-[#3A3A3E] text-white text-xs focus:border-[#F5D90A] focus:outline-none font-mono"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] text-[#F2F2F0] font-bold uppercase flex items-center gap-1">
                      <Phone className="w-3 h-3 text-[#3CE7FF]" />
                      <span>MEMBER {idx + 2} PHONE NUMBER</span>
                      <span className="text-[#FF3366]">*</span>
                    </label>
                    <input
                      type="tel"
                      value={member.phone}
                      onChange={(e) => handleMemberChange(idx, 'phone', e.target.value)}
                      placeholder={`+91 98401 23456`}
                      className="w-full px-3 py-2 rounded-xl bg-[#0D0D0F]/80 border border-[#3A3A3E] text-white text-xs focus:border-[#F5D90A] focus:outline-none font-mono"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}

            {members.length === 0 && additionalSlotsRequired > 0 && (
              <div className="p-4 rounded-2xl border-[2px] border-[#F5D90A] bg-[#F5D90A]/10 text-[#F5D90A] text-xs font-mono font-bold shadow-[3px_3px_0px_#000000] backdrop-blur-md">
                Selected event requires at least {minTeamSize} participants. Click <strong>+ ADD MEMBER</strong> above to provide Member 2 details.
              </div>
            )}
          </div>
        )}

        {/* Submit Button - 100% Theme 2 Pop-Art Neubrutalist REGISTER Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-2xl bg-[#F5D90A] hover:bg-[#FFE633] text-[#0D0D0F] border-[3.5px] border-[#0D0D0F] shadow-[6px_6px_0px_#8A7400] hover:shadow-[7px_7px_0px_#8A7400] font-display text-lg sm:text-xl tracking-wider uppercase flex items-center justify-center gap-3 transition-all active:translate-x-1 active:translate-y-1 cursor-pointer font-black disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>PROCESSING REGISTRATION...</span>
            ) : (
              <>
                <span>REGISTER SQUAD</span>
                <ArrowRight className="w-5 h-5 stroke-[3]" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  </div>
);
};

export default WebsiteRegisterPage;
