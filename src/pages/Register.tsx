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
  food_preference?: 'VEG' | 'NON_VEG';
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
    phone: '',
    food_preference: 'VEG'
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
      setMembers(prev => [...prev, { name: '', email: '', phone: '', food_preference: 'VEG' }]);
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
      setError('Please select at least 1 event to proceed with registration.');
      return;
    }

    if (members.length < additionalSlotsRequired) {
      setError(`Selected events require at least ${minTeamSize} team members. Please click "Add Member" to register remaining teammates.`);
      return;
    }

    // Validate additional team members
    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      if (!m.name.trim() || !m.email.trim() || !m.phone.trim()) {
        setError(`Please fill in all fields for Team Member ${i + 2}.`);
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
        { name: leader.name.trim(), email: leader.email.trim(), phone: leader.phone.trim(), is_leader: true, food_preference: leader.food_preference || 'VEG' },
        ...members.map(m => ({ name: m.name.trim(), email: m.email.trim(), phone: m.phone.trim(), is_leader: false, food_preference: m.food_preference || 'VEG' }))
      ];

      const registeredTeam = await store.registerTeam(teamPayload, allMemberPayloads);
      navigate(`/payment?id=${registeredTeam.team_id}`);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090A] text-[#EEEEEA] flex flex-col font-sans selection:bg-[#E5BD00] selection:text-[#090A0B]">
      {/* Universal Comic Navbar */}
      <WebsiteNavbar />

      {/* =========================================================================
          MAIN FORM CONTENT
          ========================================================================= */}
      <main className="flex-1 pt-6 sm:pt-10 pb-16 px-4 sm:px-6 max-w-3xl mx-auto w-full">
        
        {/* Minimalist Heading */}
        <div className="mb-7 text-center sm:text-left space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111214] border border-[#B8B8B2]/30 text-xs font-mono text-[#E5BD00] font-semibold mb-1">
            <span>ZINNIA '26</span>
            <span className="w-1 h-1 rounded-full bg-[#E5BD00]" />
            <span>GCE ERODE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#EEEEEA] tracking-tight uppercase font-display">
            Symposium Registration
          </h1>
          <p className="text-xs sm:text-sm text-[#B8B8B2] font-mono">
            Fill in your details and select your events to generate your digital entry passes.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-[#D51F55]/10 border border-[#D51F55]/40 text-[#D51F55] text-xs font-mono font-bold flex items-center gap-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* SECTION 1: SELECT EVENTS */}
          <div className="p-6 sm:p-7 rounded-2xl bg-[#111214] border border-[#B8B8B2]/20 shadow-[3px_3px_0px_#090A0B] space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-sm font-bold text-[#EEEEEA] uppercase tracking-wider font-mono flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-[#E5BD00] text-[#090A0B] text-[11px] font-black flex items-center justify-center font-mono">
                    1
                  </span>
                  <span>Select Symposium Events <span className="text-[#D51F55]">*</span></span>
                </h2>
                <p className="text-[11px] text-[#B8B8B2]/80 font-mono mt-0.5 ml-7">
                  Choose the competitions you wish to participate in
                </p>
              </div>

              {registeredEvents.length > 0 && (
                <span className="px-2.5 py-1 rounded-lg bg-[#17181C] border border-[#B8B8B2]/30 text-[11px] font-mono text-[#E5BD00] font-medium">
                  {registeredEvents.length} selected &bull; Team: {minTeamSize}-{maxTeamSize} P
                </span>
              )}
            </div>

            {/* Technical Events */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center gap-1.5 text-xs text-[#B8B8B2] font-mono font-medium">
                <Cpu className="w-3.5 h-3.5 text-[#0FA9C6]" />
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
                          ? 'bg-[#17181C] border-[#E5BD00] text-[#EEEEEA]'
                          : 'bg-[#111214] border-[#B8B8B2]/20 text-[#B8B8B2] hover:border-[#B8B8B2]/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center text-xs shrink-0 transition-colors ${
                          isSelected 
                            ? 'bg-[#E5BD00] border-[#E5BD00] text-[#090A0B]' 
                            : 'border-[#B8B8B2]/40 bg-[#08090A]'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="truncate text-xs font-mono">
                          <span className={`font-semibold mr-1.5 ${isSelected ? 'text-[#E5BD00]' : 'text-[#B8B8B2]'}`}>
                            [{e.code}]
                          </span>
                          <span className="text-[#EEEEEA] font-medium">{e.mission_name}</span>
                        </div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 bg-[#08090A] text-[#B8B8B2] border border-[#B8B8B2]/20 font-mono rounded shrink-0">
                        {e.team_size_min}-{e.team_size_max}P
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Non-Technical Events */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-1.5 text-xs text-[#B8B8B2] font-mono font-medium">
                <Sparkles className="w-3.5 h-3.5 text-[#D51F55]" />
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
                          ? 'bg-[#17181C] border-[#E5BD00] text-[#EEEEEA]'
                          : 'bg-[#111214] border-[#B8B8B2]/20 text-[#B8B8B2] hover:border-[#B8B8B2]/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center text-xs shrink-0 transition-colors ${
                          isSelected 
                            ? 'bg-[#E5BD00] border-[#E5BD00] text-[#090A0B]' 
                            : 'border-[#B8B8B2]/40 bg-[#08090A]'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="truncate text-xs font-mono">
                          <span className={`font-semibold mr-1.5 ${isSelected ? 'text-[#E5BD00]' : 'text-[#B8B8B2]'}`}>
                            [{e.code}]
                          </span>
                          <span className="text-[#EEEEEA] font-medium">{e.mission_name}</span>
                        </div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 bg-[#08090A] text-[#B8B8B2] border border-[#B8B8B2]/20 font-mono rounded shrink-0">
                        {e.team_size_min}-{e.team_size_max}P
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION 2: PARTICIPANT & COLLEGE CREDENTIALS */}
          <div className="p-6 sm:p-7 rounded-2xl bg-[#111214] border border-[#B8B8B2]/20 shadow-[3px_3px_0px_#090A0B] space-y-4">
            <div>
              <h2 className="text-sm font-bold text-[#EEEEEA] uppercase tracking-wider font-mono flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-[#E5BD00] text-[#090A0B] text-[11px] font-black flex items-center justify-center font-mono">
                  2
                </span>
                <span>Participant &amp; College Details</span>
              </h2>
              <p className="text-[11px] text-[#B8B8B2]/80 font-mono mt-0.5 ml-7">
                Primary contact details for pass generation and entry clearance
              </p>
            </div>

            <div className="space-y-3.5 pt-1">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="block text-xs text-[#B8B8B2] font-medium font-mono">
                  Full Name <span className="text-[#D51F55]">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8B8B2]/60 pointer-events-none" />
                  <input
                    type="text"
                    value={leader.name}
                    onChange={(e) => setLeader({ ...leader, name: e.target.value })}
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#08090A] border border-[#B8B8B2]/30 font-mono text-xs text-[#EEEEEA] placeholder:text-[#B8B8B2]/40 focus:border-[#E5BD00] focus:ring-1 focus:ring-[#E5BD00] transition-all outline-none"
                    required
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-xs text-[#B8B8B2] font-medium font-mono">
                    Email Address <span className="text-[#D51F55]">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8B8B2]/60 pointer-events-none" />
                    <input
                      type="email"
                      value={leader.email}
                      onChange={(e) => setLeader({ ...leader, email: e.target.value })}
                      placeholder="student@institution.edu"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#08090A] border border-[#B8B8B2]/30 font-mono text-xs text-[#EEEEEA] placeholder:text-[#B8B8B2]/40 focus:border-[#E5BD00] focus:ring-1 focus:ring-[#E5BD00] transition-all outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs text-[#B8B8B2] font-medium font-mono">
                    Mobile Number <span className="text-[#D51F55]">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8B8B2]/60 pointer-events-none" />
                    <input
                      type="tel"
                      value={leader.phone}
                      onChange={(e) => setLeader({ ...leader, phone: e.target.value })}
                      placeholder="10-digit mobile number"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#08090A] border border-[#B8B8B2]/30 font-mono text-xs text-[#EEEEEA] placeholder:text-[#B8B8B2]/40 focus:border-[#E5BD00] focus:ring-1 focus:ring-[#E5BD00] transition-all outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Food Preference Selection (Veg or Non-Veg) */}
              <div className="space-y-1 pt-1">
                <label className="block text-xs text-[#B8B8B2] font-medium font-mono">
                  Food Preference (Lunch) <span className="text-[#D51F55]">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setLeader({ ...leader, food_preference: 'VEG' })}
                    className={`py-2.5 px-4 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer select-none ${
                      (leader.food_preference || 'VEG') === 'VEG'
                        ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981] shadow-[2px_2px_0px_#10B981]'
                        : 'bg-[#08090A] text-[#B8B8B2] border-[#B8B8B2]/30 hover:border-[#B8B8B2]/60'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shrink-0" />
                    <span>VEG 🌱</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLeader({ ...leader, food_preference: 'NON_VEG' })}
                    className={`py-2.5 px-4 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer select-none ${
                      leader.food_preference === 'NON_VEG'
                        ? 'bg-[#D51F55]/15 text-[#D51F55] border-[#D51F55] shadow-[2px_2px_0px_#D51F55]'
                        : 'bg-[#08090A] text-[#B8B8B2] border-[#B8B8B2]/30 hover:border-[#B8B8B2]/60'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D51F55] shrink-0" />
                    <span>NON-VEG 🍗</span>
                  </button>
                </div>
              </div>

              {/* College Name */}
              <div className="space-y-1">
                <label className="block text-xs text-[#B8B8B2] font-medium font-mono">
                  College / Institution Name <span className="text-[#D51F55]">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8B8B2]/60 pointer-events-none" />
                  <input
                    type="text"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="e.g. Government College of Engineering, Erode"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#08090A] border border-[#B8B8B2]/30 font-mono text-xs text-[#EEEEEA] placeholder:text-[#B8B8B2]/40 focus:border-[#E5BD00] focus:ring-1 focus:ring-[#E5BD00] transition-all outline-none"
                    required
                  />
                </div>
              </div>

              {/* Department & Academic Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-xs text-[#B8B8B2] font-medium font-mono">
                    Department <span className="text-[#D51F55]">*</span>
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8B8B2]/60 pointer-events-none" />
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. CSE, IT, ECE, MECH, AIDS, etc."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#08090A] border border-[#B8B8B2]/30 font-mono text-xs text-[#EEEEEA] placeholder:text-[#B8B8B2]/40 focus:border-[#E5BD00] focus:ring-1 focus:ring-[#E5BD00] transition-all outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs text-[#B8B8B2] font-medium font-mono">Academic Year</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8B8B2]/60 pointer-events-none" />
                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#08090A] border border-[#B8B8B2]/30 font-mono text-xs text-[#EEEEEA] focus:border-[#E5BD00] focus:ring-1 focus:ring-[#E5BD00] transition-all outline-none cursor-pointer"
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
                <label className="block text-xs text-[#B8B8B2] font-medium font-mono">
                  Team / Squad Name <span className="text-[#B8B8B2]/60 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8B8B2]/60 pointer-events-none" />
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g. Cyber Guardians"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#08090A] border border-[#B8B8B2]/30 font-mono text-xs text-[#EEEEEA] placeholder:text-[#B8B8B2]/40 focus:border-[#E5BD00] focus:ring-1 focus:ring-[#E5BD00] transition-all outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: DYNAMIC TEAM MEMBERS (Only shown if team events selected) */}
          {maxTeamSize > 1 && (
            <div className="p-6 sm:p-7 rounded-2xl bg-[#111214] border border-[#B8B8B2]/20 shadow-[3px_3px_0px_#090A0B] space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="text-sm font-bold text-[#EEEEEA] uppercase tracking-wider font-mono flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-[#E5BD00] text-[#090A0B] text-[11px] font-black flex items-center justify-center font-mono">
                      3
                    </span>
                    <span>Additional Team Members</span>
                  </h2>
                  <p className="text-[11px] text-[#B8B8B2]/80 font-mono mt-0.5 ml-7">
                    {1 + members.length} of {maxTeamSize} team slots filled
                  </p>
                </div>

                {members.length + 1 < maxTeamSize && (
                  <button
                    type="button"
                    onClick={handleAddMemberSlot}
                    className="px-3 py-1.5 rounded-lg bg-[#E5BD00] hover:bg-[#EEEEEA] text-[#090A0B] font-mono font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Add Member</span>
                  </button>
                )}
              </div>

              {members.length === 0 && additionalSlotsRequired > 0 && (
                <div className="p-3 rounded-xl border border-[#E5BD00]/30 bg-[#E5BD00]/5 text-[#E5BD00] text-xs font-mono flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>
                    Selected events require a minimum team of <strong>{minTeamSize}</strong>. Please click <strong>Add Member</strong> to include Member 2.
                  </span>
                </div>
              )}

              {members.map((member, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-[#17181C] border border-[#B8B8B2]/20 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-[#B8B8B2]/20 pb-2">
                    <span className="text-xs font-semibold text-[#EEEEEA] font-mono flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded bg-[#111214] text-[#E5BD00] flex items-center justify-center text-[10px] font-bold">
                        {idx + 2}
                      </span>
                      <span>Team Member {idx + 2}</span>
                      {idx < additionalSlotsRequired && (
                        <span className="text-[#D51F55] text-[10px] font-mono">(Required)</span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMemberSlot(idx)}
                      className="text-[#B8B8B2] hover:text-[#D51F55] p-1 transition-colors cursor-pointer"
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
                      className="w-full px-3 py-2 rounded-lg bg-[#08090A] border border-[#B8B8B2]/30 font-mono text-xs text-[#EEEEEA] placeholder:text-[#B8B8B2]/40 focus:border-[#E5BD00] outline-none"
                      required
                    />
                    <input
                      type="email"
                      value={member.email}
                      onChange={(e) => handleMemberChange(idx, 'email', e.target.value)}
                      placeholder="Email Address"
                      className="w-full px-3 py-2 rounded-lg bg-[#08090A] border border-[#B8B8B2]/30 font-mono text-xs text-[#EEEEEA] placeholder:text-[#B8B8B2]/40 focus:border-[#E5BD00] outline-none"
                      required
                    />
                    <input
                      type="tel"
                      value={member.phone}
                      onChange={(e) => handleMemberChange(idx, 'phone', e.target.value)}
                      placeholder="Phone Number"
                      className="w-full px-3 py-2 rounded-lg bg-[#08090A] border border-[#B8B8B2]/30 font-mono text-xs text-[#EEEEEA] placeholder:text-[#B8B8B2]/40 focus:border-[#E5BD00] outline-none"
                      required
                    />
                  </div>

                  {/* Member Food Preference Selection */}
                  <div className="pt-1">
                    <label className="block text-[11px] text-[#B8B8B2] font-mono mb-1">
                      Food Preference (Member {idx + 2}):
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleMemberChange(idx, 'food_preference', 'VEG')}
                        className={`py-1.5 px-3 rounded-lg font-mono text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer select-none ${
                          (member.food_preference || 'VEG') === 'VEG'
                            ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]'
                            : 'bg-[#08090A] text-[#B8B8B2] border-[#B8B8B2]/30'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-[#10B981] shrink-0" />
                        <span>VEG 🌱</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMemberChange(idx, 'food_preference', 'NON_VEG')}
                        className={`py-1.5 px-3 rounded-lg font-mono text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer select-none ${
                          member.food_preference === 'NON_VEG'
                            ? 'bg-[#D51F55]/15 text-[#D51F55] border-[#D51F55]'
                            : 'bg-[#08090A] text-[#B8B8B2] border-[#B8B8B2]/30'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-[#D51F55] shrink-0" />
                        <span>NON-VEG 🍗</span>
                      </button>
                    </div>
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
              className="w-full py-3.5 rounded-xl bg-[#E5BD00] hover:bg-[#EEEEEA] text-[#090A0B] border-2 border-[#090A0B] shadow-[3px_3px_0px_#090A0B] font-display text-sm sm:text-base tracking-wider uppercase flex items-center justify-center gap-2 transition-all active:translate-x-0.5 active:translate-y-0.5 cursor-pointer font-black disabled:opacity-50"
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
            <p className="text-center text-[11px] text-[#B8B8B2]/80 font-mono">
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
