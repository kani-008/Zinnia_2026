import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { store } from '../services/store';
import { WebsiteNavbar } from '../components/layout/Navbar';
import { WebsiteFooter } from '../components/layout/Footer';
import { 
  ArrowRight, 
  AlertCircle, 
  Users, 
  User, 
  Plus, 
  Trash2, 
  Cpu, 
  Sparkles,
  Phone,
  Mail,
  Building2,
  GraduationCap,
  Calendar,
  Check,
  Info
} from 'lucide-react';

interface MemberInput {
  name: string;
  email: string;
  phone: string;
}

// 2D-only Magnetic Interaction Component (Matching Home and Contact pages)
const MagneticElement: React.FC<{
  children: React.ReactNode;
  strength?: number;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}> = ({ children, strength = 0.25, className = '', onClick }) => {
  const elementRef = React.useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!elementRef.current) return;
    const rect = elementRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setPosition({ x: x * strength, y: y * strength });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div
      ref={elementRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        transition: isHovered ? 'transform 0.08s ease-out' : 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
      className={`inline-block will-change-transform ${className}`}
    >
      {children}
    </div>
  );
};

export const WebsiteRegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preselectedMission = searchParams.get('mission');

  const [teamName, setTeamName] = useState('');
  const [college, setCollege] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('III');
  const [registeredEvents, setRegisteredEvents] = useState<string[]>(
    preselectedMission ? [preselectedMission] : []
  );

  // Leader is Member 1
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

  const additionalSlotsRequired = Math.max(0, minTeamSize - 1);

  const handleToggleEvent = (id: string) => {
    setRegisteredEvents(prev => {
      return prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id];
    });
  };

  const handleAddMemberSlot = () => {
    if (members.length + 1 < maxTeamSize) {
      setMembers(prev => [...prev, { name: '', email: '', phone: '' }]);
    }
  };

  const handleRemoveMemberSlot = (index: number) => {
    setMembers(prev => prev.filter((_, i) => i !== index));
  };

  const handleMemberChange = (index: number, field: keyof MemberInput, value: string) => {
    setMembers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!leader.name.trim() || !leader.email.trim() || !leader.phone.trim() || !college.trim() || !department.trim()) {
      setError('Please fill in all mandatory contact details (Full Name, Email, Phone Number, College, and Department).');
      return;
    }

    if (leader.phone.trim().length < 10) {
      setError('Please enter a valid 10-digit mobile number for the team leader.');
      return;
    }

    if (registeredEvents.length === 0) {
      setError('Please select at least one event (Technical or Non-Technical).');
      return;
    }

    const currentTotalMembers = 1 + members.length;
    if (currentTotalMembers < minTeamSize) {
      setError(`Your selected events require a minimum team of ${minTeamSize} member(s). Please add ${minTeamSize - currentTotalMembers} more member(s).`);
      return;
    }

    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      if (!m.name.trim() || !m.email.trim() || !m.phone.trim()) {
        setError(`Please fill in all credentials for Team Member ${i + 2}.`);
        return;
      }
      if (m.phone.trim().length < 10) {
        setError(`Please enter a valid 10-digit mobile number for Team Member ${i + 2}.`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const teamPayload = {
        team_name: teamName.trim() || `${leader.name}'s Team`,
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
      setError(err.message || 'Registration failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0D] text-[#ECECED] flex flex-col font-sans selection:bg-[#F5D90A] selection:text-[#0A0A0D]">
      {/* Universal Comic Navbar */}
      <WebsiteNavbar />

      {/* =========================================================================
          MAIN FORM CONTENT (Clean, Minimalist Streamlined Flow)
          ========================================================================= */}
      <main className="flex-1 pt-6 sm:pt-10 pb-16 px-4 sm:px-6 max-w-3xl mx-auto w-full">
        
        {/* Minimalist Heading (No clunky box / stats) */}
        <div className="mb-7 text-center sm:text-left space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A1A22] border border-[#2A2A38] text-xs font-mono text-[#F5D90A] font-semibold mb-1">
            <span>ZINNIA '26</span>
            <span className="w-1 h-1 rounded-full bg-[#F5D90A]" />
            <span>GCE ERODE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase font-display">
            Symposium Registration
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 font-mono">
            Fill in your details and select your events to generate your digital entry passes.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-[#FF3366]/10 border border-[#FF3366]/40 text-[#FF4D79] text-xs font-mono font-bold flex items-center gap-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* SECTION 1: SELECT EVENTS */}
          <div className="p-6 sm:p-7 rounded-2xl bg-[#121217] border border-[#22222D] shadow-[3px_3px_0px_#000000] space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-[#F5D90A] text-[#0A0A0D] text-[11px] font-black flex items-center justify-center font-mono">
                    1
                  </span>
                  <span>Select Symposium Events <span className="text-[#FF3366]">*</span></span>
                </h2>
                <p className="text-[11px] text-zinc-500 font-mono mt-0.5 ml-7">
                  Choose the competitions you wish to participate in
                </p>
              </div>

              {registeredEvents.length > 0 && (
                <span className="px-2.5 py-1 rounded-lg bg-[#181822] border border-[#2C2C3C] text-[11px] font-mono text-[#F5D90A] font-medium">
                  {registeredEvents.length} selected &bull; Team: {minTeamSize}-{maxTeamSize} P
                </span>
              )}
            </div>

            {/* Technical Events */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono font-medium">
                <Cpu className="w-3.5 h-3.5 text-[#3CE7FF]" />
                <span>Technical Events</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {techEvents.map((e) => {
                  const isSelected = registeredEvents.includes(e.id);
                  return (
                    <div
                      key={e.id}
                      onClick={() => handleToggleEvent(e.id)}
                      className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between gap-3 transition-all select-none ${
                        isSelected
                          ? 'bg-[#181824] border-[#F5D90A] shadow-[0_0_10px_rgba(245,217,10,0.12)] text-white'
                          : 'bg-[#16161E] border-[#252532] text-zinc-300 hover:border-[#353545]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center text-xs shrink-0 transition-colors ${
                          isSelected 
                            ? 'bg-[#F5D90A] border-[#F5D90A] text-[#0A0A0D]' 
                            : 'border-[#383848] bg-[#111116]'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="truncate text-xs font-mono">
                          <span className={`font-semibold mr-1.5 ${isSelected ? 'text-[#F5D90A]' : 'text-zinc-400'}`}>
                            [{e.code}]
                          </span>
                          <span className="text-white font-medium">{e.mission_name}</span>
                        </div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 bg-[#1B1B25] text-zinc-400 border border-[#292936] font-mono rounded shrink-0">
                        {e.team_size_min}-{e.team_size_max}P
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Non-Technical Events */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono font-medium">
                <Sparkles className="w-3.5 h-3.5 text-[#FF3366]" />
                <span>Non-Technical Events</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {nonTechEvents.map((e) => {
                  const isSelected = registeredEvents.includes(e.id);
                  return (
                    <div
                      key={e.id}
                      onClick={() => handleToggleEvent(e.id)}
                      className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between gap-3 transition-all select-none ${
                        isSelected
                          ? 'bg-[#181824] border-[#F5D90A] shadow-[0_0_10px_rgba(245,217,10,0.12)] text-white'
                          : 'bg-[#16161E] border-[#252532] text-zinc-300 hover:border-[#353545]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center text-xs shrink-0 transition-colors ${
                          isSelected 
                            ? 'bg-[#F5D90A] border-[#F5D90A] text-[#0A0A0D]' 
                            : 'border-[#383848] bg-[#111116]'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="truncate text-xs font-mono">
                          <span className={`font-semibold mr-1.5 ${isSelected ? 'text-[#F5D90A]' : 'text-zinc-400'}`}>
                            [{e.code}]
                          </span>
                          <span className="text-white font-medium">{e.mission_name}</span>
                        </div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 bg-[#1B1B25] text-zinc-400 border border-[#292936] font-mono rounded shrink-0">
                        {e.team_size_min}-{e.team_size_max}P
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION 2: PARTICIPANT & COLLEGE CREDENTIALS */}
          <div className="p-6 sm:p-7 rounded-2xl bg-[#121217] border border-[#22222D] shadow-[3px_3px_0px_#000000] space-y-4">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-[#F5D90A] text-[#0A0A0D] text-[11px] font-black flex items-center justify-center font-mono">
                  2
                </span>
                <span>Participant &amp; College Details</span>
              </h2>
              <p className="text-[11px] text-zinc-500 font-mono mt-0.5 ml-7">
                Primary contact details for pass generation and entry clearance
              </p>
            </div>

            <div className="space-y-3.5 pt-1">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="block text-xs text-zinc-300 font-medium font-mono">
                  Full Name <span className="text-[#FF3366]">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                  <input
                    type="text"
                    value={leader.name}
                    onChange={(e) => setLeader({ ...leader, name: e.target.value })}
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#171720] border border-[#282836] font-mono text-xs text-white placeholder:text-zinc-600 focus:border-[#F5D90A] focus:ring-1 focus:ring-[#F5D90A] transition-all outline-none"
                    required
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-xs text-zinc-300 font-medium font-mono">
                    Email Address <span className="text-[#FF3366]">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                    <input
                      type="email"
                      value={leader.email}
                      onChange={(e) => setLeader({ ...leader, email: e.target.value })}
                      placeholder="student@institution.edu"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#171720] border border-[#282836] font-mono text-xs text-white placeholder:text-zinc-600 focus:border-[#F5D90A] focus:ring-1 focus:ring-[#F5D90A] transition-all outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs text-zinc-300 font-medium font-mono">
                    Mobile Number <span className="text-[#FF3366]">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                    <input
                      type="tel"
                      value={leader.phone}
                      onChange={(e) => setLeader({ ...leader, phone: e.target.value })}
                      placeholder="10-digit mobile number"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#171720] border border-[#282836] font-mono text-xs text-white placeholder:text-zinc-600 focus:border-[#F5D90A] focus:ring-1 focus:ring-[#F5D90A] transition-all outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* College Name */}
              <div className="space-y-1">
                <label className="block text-xs text-zinc-300 font-medium font-mono">
                  College / Institution Name <span className="text-[#FF3366]">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                  <input
                    type="text"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="e.g. Government College of Engineering, Erode"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#171720] border border-[#282836] font-mono text-xs text-white placeholder:text-zinc-600 focus:border-[#F5D90A] focus:ring-1 focus:ring-[#F5D90A] transition-all outline-none"
                    required
                  />
                </div>
              </div>

              {/* Department & Academic Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-xs text-zinc-300 font-medium font-mono">
                    Department <span className="text-[#FF3366]">*</span>
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. CSE, IT, ECE, MECH, AIDS, etc."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#171720] border border-[#282836] font-mono text-xs text-white placeholder:text-zinc-600 focus:border-[#F5D90A] focus:ring-1 focus:ring-[#F5D90A] transition-all outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs text-zinc-300 font-medium font-mono">Academic Year</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#171720] border border-[#282836] font-mono text-xs text-white focus:border-[#F5D90A] focus:ring-1 focus:ring-[#F5D90A] transition-all outline-none cursor-pointer"
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

              {/* Team Name (Optional) */}
              <div className="space-y-1">
                <label className="block text-xs text-zinc-300 font-medium font-mono">
                  Team / Squad Name <span className="text-zinc-500 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g. Cyber Guardians"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#171720] border border-[#282836] font-mono text-xs text-white placeholder:text-zinc-600 focus:border-[#F5D90A] focus:ring-1 focus:ring-[#F5D90A] transition-all outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: DYNAMIC TEAM MEMBERS (Only shown if team events selected) */}
          {maxTeamSize > 1 && (
            <div className="p-6 sm:p-7 rounded-2xl bg-[#121217] border border-[#22222D] shadow-[3px_3px_0px_#000000] space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-[#F5D90A] text-[#0A0A0D] text-[11px] font-black flex items-center justify-center font-mono">
                      3
                    </span>
                    <span>Additional Team Members</span>
                  </h2>
                  <p className="text-[11px] text-zinc-500 font-mono mt-0.5 ml-7">
                    {1 + members.length} of {maxTeamSize} team slots filled
                  </p>
                </div>

                {members.length + 1 < maxTeamSize && (
                  <button
                    type="button"
                    onClick={handleAddMemberSlot}
                    className="px-3 py-1.5 rounded-lg bg-[#F5D90A] hover:bg-[#FFE633] text-[#0A0A0D] font-mono font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Add Member</span>
                  </button>
                )}
              </div>

              {members.length === 0 && additionalSlotsRequired > 0 && (
                <div className="p-3 rounded-xl border border-[#F5D90A]/30 bg-[#F5D90A]/5 text-[#F5D90A] text-xs font-mono flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>
                    Selected events require a minimum team of <strong>{minTeamSize}</strong>. Please click <strong>Add Member</strong> to include Member 2.
                  </span>
                </div>
              )}

              {members.map((member, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-[#16161F] border border-[#242432] space-y-2.5">
                  <div className="flex items-center justify-between border-b border-[#20202C] pb-2">
                    <span className="text-xs font-semibold text-white font-mono flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded bg-[#20202C] text-[#F5D90A] flex items-center justify-center text-[10px] font-bold">
                        {idx + 2}
                      </span>
                      <span>Team Member {idx + 2}</span>
                      {idx < additionalSlotsRequired && (
                        <span className="text-[#FF3366] text-[10px] font-mono">(Required)</span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMemberSlot(idx)}
                      className="text-zinc-500 hover:text-[#FF3366] p-1 transition-colors cursor-pointer"
                      title="Remove member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <input
                      type="text"
                      value={member.name}
                      onChange={(e) => handleMemberChange(idx, 'name', e.target.value)}
                      placeholder="Full Name"
                      className="w-full px-3 py-2 rounded-lg bg-[#121217] border border-[#22222E] font-mono text-xs text-white placeholder:text-zinc-600 focus:border-[#F5D90A] outline-none"
                      required
                    />
                    <input
                      type="email"
                      value={member.email}
                      onChange={(e) => handleMemberChange(idx, 'email', e.target.value)}
                      placeholder="Email Address"
                      className="w-full px-3 py-2 rounded-lg bg-[#121217] border border-[#22222E] font-mono text-xs text-white placeholder:text-zinc-600 focus:border-[#F5D90A] outline-none"
                      required
                    />
                    <input
                      type="tel"
                      value={member.phone}
                      onChange={(e) => handleMemberChange(idx, 'phone', e.target.value)}
                      placeholder="Phone Number"
                      className="w-full px-3 py-2 rounded-lg bg-[#121217] border border-[#22222E] font-mono text-xs text-white placeholder:text-zinc-600 focus:border-[#F5D90A] outline-none"
                      required
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-[#F5D90A] hover:bg-[#FFE633] text-[#0A0A0D] border-2 border-[#F5D90A] shadow-[3px_3px_0px_#8A7400] font-display text-sm sm:text-base tracking-wider uppercase flex items-center justify-center gap-2 transition-all active:translate-x-0.5 active:translate-y-0.5 cursor-pointer font-black disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>REGISTERING...</span>
              ) : (
                <>
                  <span>PROCEED TO PAYMENT &amp; PASS VERIFICATION</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
            <p className="text-center text-[11px] text-zinc-500 font-mono">
              Digital QR passes will be generated automatically upon verification.
            </p>
          </div>
        </form>
      </main>

      {/* FOOTER */}
      <WebsiteFooter />
    </div>
  );
};

export default WebsiteRegisterPage;
