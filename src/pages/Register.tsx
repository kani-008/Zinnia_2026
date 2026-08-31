import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  Info, 
  Loader2 
} from 'lucide-react';

interface MemberInput {
  name: string;
  email: string;
  phone: string;
  food_preference: 'VEG' | 'NON_VEG';
}

const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const WebsiteRegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preselectedMission = searchParams.get('mission');
  const existingTeamId = searchParams.get('id');

  const [teamName, setTeamName] = useState('');
  const [college, setCollege] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('III');
  const [registeredEvents, setRegisteredEvents] = useState<string[]>(() => {
    if (preselectedMission) return [preselectedMission];
    return [];
  });

  // Leader is Member 1
  const [leader, setLeader] = useState<MemberInput>({
    name: '',
    email: '',
    phone: '',
    food_preference: 'VEG'
  });

  // Additional Team Members (max 1 additional member since team_size_max is 2)
  const [members, setMembers] = useState<MemberInput[]>([]);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);

  // Clear any existing stale registration drafts on mount
  useEffect(() => {
    try {
      sessionStorage.removeItem('zin26_registration_form_draft');
      localStorage.removeItem('zin26_registration_form_draft');
    } catch (e) {}
  }, []);

  const allEvents = store.getEvents();

  const techEvents = useMemo(
    () => allEvents.filter(e => e.event_type === 'TECH' || e.category === 'TECHNICAL'),
    [allEvents]
  );
  const nonTechEvents = useMemo(
    () => allEvents.filter(e => e.event_type === 'NON_TECH' || e.category === 'NON_TECHNICAL'),
    [allEvents]
  );

  // Restore from registered team if returning via Team ID
  useEffect(() => {
    if (existingTeamId) {
      const team = store.getTeamById(existingTeamId);
      if (team) {
        if (team.team_name) setTeamName(team.team_name);
        if (team.college) setCollege(team.college);
        if (team.department) setDepartment(team.department);
        if (team.year) setYear(team.year);
        if (team.registered_events && team.registered_events.length > 0) {
          setRegisteredEvents(team.registered_events);
        }
        if (team.members && team.members.length > 0) {
          const l = team.members.find(m => m.is_leader) || team.members[0];
          setLeader({
            name: l.name || '',
            email: l.email || '',
            phone: l.phone || '',
            food_preference: ((l as any).food_preference === 'NON_VEG' ? 'NON_VEG' : 'VEG')
          });
          const otherMembers = team.members.filter(m => m !== l).map(m => ({
            name: m.name || '',
            email: m.email || '',
            phone: m.phone || '',
            food_preference: ((m as any).food_preference === 'NON_VEG' ? 'NON_VEG' : 'VEG') as 'VEG' | 'NON_VEG'
          }));
          setMembers(otherMembers);
        }
      }
    }
  }, [existingTeamId]);

  // Selected event objects
  const selectedEventObjects = useMemo(() => {
    return allEvents.filter(e => registeredEvents.includes(e.id));
  }, [allEvents, registeredEvents]);

  // Team size constraints
  const { minTeamSize, maxTeamSize } = useMemo(() => {
    if (selectedEventObjects.length === 0) {
      return { minTeamSize: 1, maxTeamSize: 2 };
    }
    const min = Math.max(...selectedEventObjects.map(e => e.team_size_min || 1));
    const max = Math.min(2, Math.max(...selectedEventObjects.map(e => e.team_size_max || 2)));
    return { minTeamSize: min, maxTeamSize: max };
  }, [selectedEventObjects]);

  const totalMembersCount = 1 + members.length;
  const additionalSlotsRequired = Math.max(0, minTeamSize - 1);


  const handleToggleEvent = (id: string) => {
    setRegisteredEvents(prev => {
      const next = prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id];
      // clear event error if resolved
      if (next.length > 0) {
        setFieldErrors(fe => {
          const c = { ...fe };
          delete c.events;
          return c;
        });
      }
      return next;
    });
  };

  const handleAddMemberSlot = () => {
    if (totalMembersCount < maxTeamSize) {
      setMembers(prev => [...prev, { name: '', email: '', phone: '', food_preference: 'VEG' }]);
    }
  };

  const handleRemoveMemberSlot = (index: number) => {
    setMembers(prev => prev.filter((_, i) => i !== index));
    // Clear any member field errors for removed slot
    setFieldErrors(prev => {
      const updated = { ...prev };
      delete updated[`member_${index}_name`];
      delete updated[`member_${index}_email`];
      delete updated[`member_${index}_phone`];
      return updated;
    });
  };

  const handleMemberChange = (index: number, field: keyof MemberInput, value: string) => {
    setMembers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    setFieldErrors(prev => {
      const updated = { ...prev };
      delete updated[`member_${index}_${field}`];
      return updated;
    });
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // 1. Events validation
    if (registeredEvents.length === 0) {
      errors.events = 'Please select at least one event to participate.';
    }

    // Check individual event restrictions
    for (const ev of selectedEventObjects) {
      if (totalMembersCount < (ev.team_size_min || 1)) {
        errors.events = `Event "${ev.mission_name}" requires at least ${ev.team_size_min} team member(s).`;
        break;
      }
      if (totalMembersCount > (ev.team_size_max || 2)) {
        errors.events = `Event "${ev.mission_name}" allows a maximum of ${ev.team_size_max} participants.`;
        break;
      }
    }

    // Single event restriction check
    const singleEvents = selectedEventObjects.filter(e => e.is_single_event_only);
    if (singleEvents.length > 0 && selectedEventObjects.length > 1) {
      errors.events = `"${singleEvents[0].mission_name}" is a single-event only competition and cannot be combined with other events.`;
    }

    // 2. Leader details validation
    if (!leader.name.trim()) {
      errors.leader_name = 'Leader full name is required.';
    }

    if (!leader.email.trim()) {
      errors.leader_email = 'Leader email address is required.';
    } else if (!EMAIL_REGEX.test(leader.email.trim())) {
      errors.leader_email = 'Enter a valid email address (e.g. name@domain.com).';
    }

    if (!leader.phone.trim()) {
      errors.leader_phone = 'Leader mobile number is required.';
    } else if (!INDIAN_PHONE_REGEX.test(leader.phone.trim())) {
      errors.leader_phone = 'Enter a valid 10-digit Indian mobile number (e.g. 9876543210).';
    }

    // 3. College & Department
    if (!college.trim()) {
      errors.college = 'College or institution name is required.';
    }
    if (!department.trim()) {
      errors.department = 'Department name is required.';
    }

    // 4. Team size requirement
    if (members.length < additionalSlotsRequired) {
      errors.team_size = `Selected events require at least ${minTeamSize} members. Please add Member 2.`;
    }

    // 5. Additional members validation
    const emailList = [leader.email.trim().toLowerCase()];
    members.forEach((m, idx) => {
      const prefix = `member_${idx}`;
      if (!m.name.trim()) {
        errors[`${prefix}_name`] = `Member ${idx + 2} name is required.`;
      }
      if (!m.email.trim()) {
        errors[`${prefix}_email`] = `Member ${idx + 2} email is required.`;
      } else if (!EMAIL_REGEX.test(m.email.trim())) {
        errors[`${prefix}_email`] = 'Enter a valid email address.';
      } else if (emailList.includes(m.email.trim().toLowerCase())) {
        errors[`${prefix}_email`] = 'Duplicate email detected within team.';
      } else {
        emailList.push(m.email.trim().toLowerCase());
      }

      if (!m.phone.trim()) {
        errors[`${prefix}_phone`] = `Member ${idx + 2} mobile number is required.`;
      } else if (!INDIAN_PHONE_REGEX.test(m.phone.trim())) {
        errors[`${prefix}_phone`] = 'Enter a valid 10-digit Indian mobile number.';
      }
    });

    console.log('[Register] 🔍 Validating form...', {
      eventsCount: registeredEvents.length,
      leaderName: leader.name,
      leaderEmail: leader.email,
      leaderPhone: leader.phone,
      college,
      department,
      additionalMembersCount: members.length
    });

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      const firstKey = Object.keys(errors)[0];
      console.warn('[Register] ⚠️ Form validation failed with errors:', errors);
      setGeneralError(errors[firstKey]);

      setTimeout(() => {
        const errorEl = document.querySelector(`[data-field-id="${firstKey}"]`) || errorRef.current;
        if (errorEl) {
          errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
      return false;
    }

    console.log('[Register] ✅ Form validation passed!');
    setGeneralError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[Register] 🚀 PROCEED TO PAYMENT button clicked!');

    if (!validateForm()) {
      console.warn('[Register] 🛑 Submission halted: validation errors present.');
      return;
    }

    setIsSubmitting(true);
    setGeneralError(null);

    try {
      const teamPayload = {
        team_name: teamName.trim() || `${leader.name.trim()}'s Team`,
        college: college.trim(),
        department: department.trim(),
        year,
        registered_events: registeredEvents,
        members: [] as any[]
      };

      const allMemberPayloads = [
        { 
          name: leader.name.trim(), 
          email: leader.email.trim(), 
          phone: leader.phone.trim(), 
          is_leader: true, 
          food_preference: leader.food_preference || 'VEG' 
        },
        ...members.map(m => ({ 
          name: m.name.trim(), 
          email: m.email.trim(), 
          phone: m.phone.trim(), 
          is_leader: false, 
          food_preference: m.food_preference || 'VEG' 
        }))
      ];
      teamPayload.members = allMemberPayloads;

      console.log('[Register] 📡 Sending registration request to backend:', teamPayload);
      const registeredTeam = await store.registerTeam(teamPayload, allMemberPayloads);
      console.log('[Register] 🎉 Registration SUCCESS! Registered Team:', registeredTeam);

      const targetUrl = `/payment?id=${registeredTeam.team_id}`;
      console.log('[Register] ➡️ Navigating to payment page:', targetUrl);
      navigate(targetUrl);
    } catch (err: any) {
      console.error('[Register] ❌ Registration failed with error:', err);
      setGeneralError(err.message || 'Registration failed. Please review your details and try again.');
      setIsSubmitting(false);
      setTimeout(() => {
        errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090A] text-[#EEEEEA] flex flex-col font-sans selection:bg-[#E5BD00] selection:text-[#090A0B]">
      {/* Universal Comic Navbar */}
      <WebsiteNavbar />

      {/* Main Form Content */}
      <main className="flex-1 pt-6 sm:pt-10 pb-28 sm:pb-16 px-4 sm:px-6 max-w-3xl mx-auto w-full overflow-hidden">
        
        {/* Heading */}
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
            Register your team and select events to claim your digital QR passport credentials.
          </p>
        </div>

        {/* General Error Banner */}
        {generalError && (
          <div 
            ref={errorRef}
            className="mb-6 p-4 rounded-xl bg-[#D51F55]/15 border border-[#D51F55]/60 text-[#D51F55] text-xs font-mono font-bold flex items-start gap-3 animate-in fade-in"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="block font-black uppercase tracking-wider text-[11px] mb-0.5">Registration Error</span>
              <span>{generalError}</span>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} noValidate className="space-y-6">

          {/* SECTION 1: SELECT EVENTS */}
          <div 
            data-field-id="events"
            className={`p-5 sm:p-7 rounded-2xl bg-[#111214] border transition-all shadow-[3px_3px_0px_#090A0B] space-y-4 ${
              fieldErrors.events ? 'border-[#D51F55] ring-1 ring-[#D51F55]' : 'border-[#B8B8B2]/20'
            }`}
          >
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-sm font-bold text-[#EEEEEA] uppercase tracking-wider font-mono flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-[#E5BD00] text-[#090A0B] text-[11px] font-black flex items-center justify-center font-mono">
                    1
                  </span>
                  <span>Select Events <span className="text-[#D51F55]">*</span></span>
                </h2>
                <p className="text-[11px] text-[#B8B8B2]/80 font-mono mt-0.5 ml-7">
                  Choose competitions (Max 2 participants per event roster)
                </p>
              </div>

              {registeredEvents.length > 0 && (
                <span className="px-2.5 py-1 rounded-lg bg-[#17181C] border border-[#E5BD00]/40 text-xs font-mono text-[#E5BD00] font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E5BD00]" />
                  <span>{registeredEvents.length} selected &bull; Team: {minTeamSize}-{maxTeamSize} P</span>
                </span>
              )}
            </div>

            {fieldErrors.events && (
              <p className="text-xs font-mono text-[#D51F55] font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {fieldErrors.events}
              </p>
            )}

            {/* Technical Events */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center gap-1.5 text-xs text-[#B8B8B2] font-mono font-medium">
                <Cpu className="w-4 h-4 text-[#0FA9C6]" />
                <span>Technical Events</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {techEvents.map((e) => {
                  const isSelected = registeredEvents.includes(e.id);
                  return (
                    <button
                      type="button"
                      key={e.id}
                      onClick={() => handleToggleEvent(e.id)}
                      className={`min-h-[44px] p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all select-none cursor-pointer ${
                        isSelected
                          ? 'bg-[#17181C] border-[#E5BD00] text-[#EEEEEA] ring-1 ring-[#E5BD00]'
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
                      <span className="text-[11px] px-2 py-0.5 bg-[#08090A] text-[#B8B8B2] border border-[#B8B8B2]/20 font-mono rounded shrink-0">
                        {e.team_size_min}-{e.team_size_max}P
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Non-Technical Events */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-1.5 text-xs text-[#B8B8B2] font-mono font-medium">
                <Sparkles className="w-4 h-4 text-[#D51F55]" />
                <span>Non-Technical Events</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {nonTechEvents.map((e) => {
                  const isSelected = registeredEvents.includes(e.id);
                  return (
                    <button
                      type="button"
                      key={e.id}
                      onClick={() => handleToggleEvent(e.id)}
                      className={`min-h-[44px] p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all select-none cursor-pointer ${
                        isSelected
                          ? 'bg-[#17181C] border-[#E5BD00] text-[#EEEEEA] ring-1 ring-[#E5BD00]'
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
                      <span className="text-[11px] px-2 py-0.5 bg-[#08090A] text-[#B8B8B2] border border-[#B8B8B2]/20 font-mono rounded shrink-0">
                        {e.team_size_min}-{e.team_size_max}P
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION 2: PARTICIPANT & COLLEGE CREDENTIALS */}
          <div className="p-5 sm:p-7 rounded-2xl bg-[#111214] border border-[#B8B8B2]/20 shadow-[3px_3px_0px_#090A0B] space-y-4">
            <div>
              <h2 className="text-sm font-bold text-[#EEEEEA] uppercase tracking-wider font-mono flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-[#E5BD00] text-[#090A0B] text-[11px] font-black flex items-center justify-center font-mono">
                  2
                </span>
                <span>Team Leader &amp; College Credentials</span>
              </h2>
              <p className="text-[11px] text-[#B8B8B2]/80 font-mono mt-0.5 ml-7">
                Primary registrant contact for passes, verification, and check-in
              </p>
            </div>

            <div className="space-y-4 pt-1">
              {/* Full Name */}
              <div data-field-id="leader_name" className="space-y-1.5">
                <label htmlFor="leader-name" className="block text-xs text-[#B8B8B2] font-semibold font-mono">
                  Full Name <span className="text-[#D51F55]">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8B8B2]/60 pointer-events-none" />
                  <input
                    id="leader-name"
                    type="text"
                    autoComplete="name"
                    value={leader.name}
                    onChange={(e) => {
                      setLeader({ ...leader, name: e.target.value });
                      setFieldErrors(prev => ({ ...prev, leader_name: '' }));
                    }}
                    placeholder="Enter full name"
                    className={`w-full min-h-[44px] pl-10 pr-4 py-2.5 rounded-xl bg-[#08090A] border font-mono text-xs text-[#EEEEEA] placeholder:text-[#B8B8B2]/40 focus:border-[#E5BD00] outline-none transition-all ${
                      fieldErrors.leader_name ? 'border-[#D51F55] ring-1 ring-[#D51F55]' : 'border-[#B8B8B2]/30'
                    }`}
                    required
                  />
                </div>
                {fieldErrors.leader_name && (
                  <p className="text-[11px] font-mono text-[#D51F55]">{fieldErrors.leader_name}</p>
                )}
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div data-field-id="leader_email" className="space-y-1.5">
                  <label htmlFor="leader-email" className="block text-xs text-[#B8B8B2] font-semibold font-mono">
                    Email Address <span className="text-[#D51F55]">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8B8B2]/60 pointer-events-none" />
                    <input
                      id="leader-email"
                      type="email"
                      autoComplete="email"
                      value={leader.email}
                      onChange={(e) => {
                        setLeader({ ...leader, email: e.target.value });
                        setFieldErrors(prev => ({ ...prev, leader_email: '' }));
                      }}
                      placeholder="student@institution.edu"
                      className={`w-full min-h-[44px] pl-10 pr-4 py-2.5 rounded-xl bg-[#08090A] border font-mono text-xs text-[#EEEEEA] placeholder:text-[#B8B8B2]/40 focus:border-[#E5BD00] outline-none transition-all ${
                        fieldErrors.leader_email ? 'border-[#D51F55] ring-1 ring-[#D51F55]' : 'border-[#B8B8B2]/30'
                      }`}
                      required
                    />
                  </div>
                  {fieldErrors.leader_email && (
                    <p className="text-[11px] font-mono text-[#D51F55]">{fieldErrors.leader_email}</p>
                  )}
                </div>

                <div data-field-id="leader_phone" className="space-y-1.5">
                  <label htmlFor="leader-phone" className="block text-xs text-[#B8B8B2] font-semibold font-mono">
                    Mobile Number (10 Digits) <span className="text-[#D51F55]">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8B8B2]/60 pointer-events-none" />
                    <input
                      id="leader-phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      maxLength={10}
                      value={leader.phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setLeader({ ...leader, phone: val });
                        setFieldErrors(prev => ({ ...prev, leader_phone: '' }));
                      }}
                      placeholder="e.g. 9876543210"
                      className={`w-full min-h-[44px] pl-10 pr-4 py-2.5 rounded-xl bg-[#08090A] border font-mono text-xs text-[#EEEEEA] placeholder:text-[#B8B8B2]/40 focus:border-[#E5BD00] outline-none transition-all ${
                        fieldErrors.leader_phone ? 'border-[#D51F55] ring-1 ring-[#D51F55]' : 'border-[#B8B8B2]/30'
                      }`}
                      required
                    />
                  </div>
                  {fieldErrors.leader_phone && (
                    <p className="text-[11px] font-mono text-[#D51F55]">{fieldErrors.leader_phone}</p>
                  )}
                </div>
              </div>

              {/* Food Preference Selection */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs text-[#B8B8B2] font-semibold font-mono">
                  Lunch Preference (Leader) <span className="text-[#D51F55]">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setLeader({ ...leader, food_preference: 'VEG' })}
                    className={`min-h-[44px] py-2.5 px-4 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer select-none ${
                      (leader.food_preference || 'VEG') === 'VEG'
                        ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981] shadow-[2px_2px_0px_#10B981]'
                        : 'bg-[#08090A] text-[#B8B8B2] border-[#B8B8B2]/30 hover:border-[#B8B8B2]/60'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shrink-0" />
                    <span>VEG 🌱</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLeader({ ...leader, food_preference: 'NON_VEG' })}
                    className={`min-h-[44px] py-2.5 px-4 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer select-none ${
                      leader.food_preference === 'NON_VEG'
                        ? 'bg-[#D51F55]/20 text-[#D51F55] border-[#D51F55] shadow-[2px_2px_0px_#D51F55]'
                        : 'bg-[#08090A] text-[#B8B8B2] border-[#B8B8B2]/30 hover:border-[#B8B8B2]/60'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D51F55] shrink-0" />
                    <span>NON-VEG 🍗</span>
                  </button>
                </div>
              </div>

              {/* College Name */}
              <div data-field-id="college" className="space-y-1.5">
                <label htmlFor="college-name" className="block text-xs text-[#B8B8B2] font-semibold font-mono">
                  College / Institution Name <span className="text-[#D51F55]">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8B8B2]/60 pointer-events-none" />
                  <input
                    id="college-name"
                    type="text"
                    value={college}
                    onChange={(e) => {
                      setCollege(e.target.value);
                      setFieldErrors(prev => ({ ...prev, college: '' }));
                    }}
                    placeholder="e.g. Government College of Engineering, Erode"
                    className={`w-full min-h-[44px] pl-10 pr-4 py-2.5 rounded-xl bg-[#08090A] border font-mono text-xs text-[#EEEEEA] placeholder:text-[#B8B8B2]/40 focus:border-[#E5BD00] outline-none transition-all ${
                      fieldErrors.college ? 'border-[#D51F55] ring-1 ring-[#D51F55]' : 'border-[#B8B8B2]/30'
                    }`}
                    required
                  />
                </div>
                {fieldErrors.college && (
                  <p className="text-[11px] font-mono text-[#D51F55]">{fieldErrors.college}</p>
                )}
              </div>

              {/* Department & Academic Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div data-field-id="department" className="space-y-1.5">
                  <label htmlFor="dept-name" className="block text-xs text-[#B8B8B2] font-semibold font-mono">
                    Department <span className="text-[#D51F55]">*</span>
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8B8B2]/60 pointer-events-none" />
                    <input
                      id="dept-name"
                      type="text"
                      value={department}
                      onChange={(e) => {
                        setDepartment(e.target.value);
                        setFieldErrors(prev => ({ ...prev, department: '' }));
                      }}
                      placeholder="e.g. CSE, IT, AIDS, ECE"
                      className={`w-full min-h-[44px] pl-10 pr-4 py-2.5 rounded-xl bg-[#08090A] border font-mono text-xs text-[#EEEEEA] placeholder:text-[#B8B8B2]/40 focus:border-[#E5BD00] outline-none transition-all ${
                        fieldErrors.department ? 'border-[#D51F55] ring-1 ring-[#D51F55]' : 'border-[#B8B8B2]/30'
                      }`}
                      required
                    />
                  </div>
                  {fieldErrors.department && (
                    <p className="text-[11px] font-mono text-[#D51F55]">{fieldErrors.department}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="academic-year" className="block text-xs text-[#B8B8B2] font-semibold font-mono">
                    Academic Year <span className="text-[#D51F55]">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8B8B2]/60 pointer-events-none" />
                    <select
                      id="academic-year"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="w-full min-h-[44px] pl-10 pr-4 py-2.5 rounded-xl bg-[#08090A] border border-[#B8B8B2]/30 font-mono text-xs text-[#EEEEEA] focus:border-[#E5BD00] outline-none cursor-pointer"
                    >
                      <option value="I">1st Year (B.E. / B.Tech)</option>
                      <option value="II">2nd Year (B.E. / B.Tech)</option>
                      <option value="III">3rd Year (B.E. / B.Tech) [Default]</option>
                      <option value="IV">4th Year (B.E. / B.Tech)</option>
                      <option value="PG">Postgraduate (M.E. / M.Tech / MCA)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Team Name */}
              <div className="space-y-1.5">
                <label htmlFor="team-name" className="block text-xs text-[#B8B8B2] font-semibold font-mono">
                  Team / Squad Name <span className="text-[#B8B8B2]/60 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8B8B2]/60 pointer-events-none" />
                  <input
                    id="team-name"
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder={`Default: ${leader.name.trim() || 'Attendee'}'s Team`}
                    className="w-full min-h-[44px] pl-10 pr-4 py-2.5 rounded-xl bg-[#08090A] border border-[#B8B8B2]/30 font-mono text-xs text-[#EEEEEA] placeholder:text-[#B8B8B2]/40 focus:border-[#E5BD00] outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: ADDITIONAL TEAM MEMBERS (Max 2 total) */}
          {maxTeamSize > 1 && (
            <div 
              data-field-id="team_size"
              className={`p-5 sm:p-7 rounded-2xl bg-[#111214] border transition-all shadow-[3px_3px_0px_#090A0B] space-y-4 ${
                fieldErrors.team_size ? 'border-[#D51F55] ring-1 ring-[#D51F55]' : 'border-[#B8B8B2]/20'
              }`}
            >
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="text-sm font-bold text-[#EEEEEA] uppercase tracking-wider font-mono flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-[#E5BD00] text-[#090A0B] text-[11px] font-black flex items-center justify-center font-mono">
                      3
                    </span>
                    <span>Additional Team Member</span>
                  </h2>
                  <p className="text-[11px] text-[#B8B8B2]/80 font-mono mt-0.5 ml-7">
                    {totalMembersCount} of {maxTeamSize} participant slot(s) filled
                  </p>
                </div>

                {members.length === 0 && (
                  <button
                    type="button"
                    onClick={handleAddMemberSlot}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#E5BD00] hover:bg-[#EEEEEA] text-[#090A0B] font-mono font-black text-xs flex items-center gap-1.5 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Add Teammate</span>
                  </button>
                )}
              </div>

              {fieldErrors.team_size && (
                <p className="text-xs font-mono text-[#D51F55] font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {fieldErrors.team_size}
                </p>
              )}

              {members.length === 0 && additionalSlotsRequired > 0 && (
                <div className="p-3.5 rounded-xl border border-[#E5BD00]/40 bg-[#E5BD00]/10 text-[#E5BD00] text-xs font-mono flex items-center gap-2.5">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>
                    Selected events require a 2-person team. Tap <strong>Add Teammate</strong> above to enter Member 2 details.
                  </span>
                </div>
              )}

              {members.map((member, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-[#17181C] border border-[#B8B8B2]/20 space-y-3">
                  <div className="flex items-center justify-between border-b border-[#B8B8B2]/20 pb-2">
                    <span className="text-xs font-semibold text-[#EEEEEA] font-mono flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded bg-[#111214] text-[#E5BD00] flex items-center justify-center text-xs font-bold border border-[#B8B8B2]/30">
                        {idx + 2}
                      </span>
                      <span>Team Member {idx + 2}</span>
                      {idx < additionalSlotsRequired && (
                        <span className="text-[#D51F55] text-xs font-mono font-bold">(Mandatory for selected events)</span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMemberSlot(idx)}
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center text-[#B8B8B2] hover:text-[#D51F55] p-1.5 transition-colors cursor-pointer rounded-lg bg-[#08090A]/60"
                      title="Remove member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Explicit Mobile-Ready Stacked Inputs with Real Labels */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div data-field-id={`member_${idx}_name`} className="space-y-1">
                      <label className="block text-[11px] text-[#B8B8B2] font-semibold font-mono">
                        Full Name <span className="text-[#D51F55]">*</span>
                      </label>
                      <input
                        type="text"
                        autoComplete="name"
                        value={member.name}
                        onChange={(e) => handleMemberChange(idx, 'name', e.target.value)}
                        placeholder="Member name"
                        className={`w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#08090A] border font-mono text-xs text-[#EEEEEA] placeholder:text-[#B8B8B2]/40 focus:border-[#E5BD00] outline-none ${
                          fieldErrors[`member_${idx}_name`] ? 'border-[#D51F55]' : 'border-[#B8B8B2]/30'
                        }`}
                        required
                      />
                      {fieldErrors[`member_${idx}_name`] && (
                        <p className="text-[11px] font-mono text-[#D51F55]">{fieldErrors[`member_${idx}_name`]}</p>
                      )}
                    </div>

                    <div data-field-id={`member_${idx}_email`} className="space-y-1">
                      <label className="block text-[11px] text-[#B8B8B2] font-semibold font-mono">
                        Email Address <span className="text-[#D51F55]">*</span>
                      </label>
                      <input
                        type="email"
                        autoComplete="email"
                        value={member.email}
                        onChange={(e) => handleMemberChange(idx, 'email', e.target.value)}
                        placeholder="member@domain.com"
                        className={`w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#08090A] border font-mono text-xs text-[#EEEEEA] placeholder:text-[#B8B8B2]/40 focus:border-[#E5BD00] outline-none ${
                          fieldErrors[`member_${idx}_email`] ? 'border-[#D51F55]' : 'border-[#B8B8B2]/30'
                        }`}
                        required
                      />
                      {fieldErrors[`member_${idx}_email`] && (
                        <p className="text-[11px] font-mono text-[#D51F55]">{fieldErrors[`member_${idx}_email`]}</p>
                      )}
                    </div>

                    <div data-field-id={`member_${idx}_phone`} className="space-y-1">
                      <label className="block text-[11px] text-[#B8B8B2] font-semibold font-mono">
                        Mobile Number <span className="text-[#D51F55]">*</span>
                      </label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel"
                        maxLength={10}
                        value={member.phone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                          handleMemberChange(idx, 'phone', val);
                        }}
                        placeholder="10-digit mobile"
                        className={`w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#08090A] border font-mono text-xs text-[#EEEEEA] placeholder:text-[#B8B8B2]/40 focus:border-[#E5BD00] outline-none ${
                          fieldErrors[`member_${idx}_phone`] ? 'border-[#D51F55]' : 'border-[#B8B8B2]/30'
                        }`}
                        required
                      />
                      {fieldErrors[`member_${idx}_phone`] && (
                        <p className="text-[11px] font-mono text-[#D51F55]">{fieldErrors[`member_${idx}_phone`]}</p>
                      )}
                    </div>
                  </div>

                  {/* Member Food Preference */}
                  <div className="pt-1 space-y-1">
                    <label className="block text-[11px] text-[#B8B8B2] font-semibold font-mono">
                      Lunch Preference (Member {idx + 2}) <span className="text-[#D51F55]">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleMemberChange(idx, 'food_preference', 'VEG')}
                        className={`min-h-[44px] py-2 px-3 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer select-none ${
                          (member.food_preference || 'VEG') === 'VEG'
                            ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981] shadow-[2px_2px_0px_#10B981]'
                            : 'bg-[#08090A] text-[#B8B8B2] border-[#B8B8B2]/30'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shrink-0" />
                        <span>VEG 🌱</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMemberChange(idx, 'food_preference', 'NON_VEG')}
                        className={`min-h-[44px] py-2 px-3 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer select-none ${
                          member.food_preference === 'NON_VEG'
                            ? 'bg-[#D51F55]/20 text-[#D51F55] border-[#D51F55] shadow-[2px_2px_0px_#D51F55]'
                            : 'bg-[#08090A] text-[#B8B8B2] border-[#B8B8B2]/30'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-[#D51F55] shrink-0" />
                        <span>NON-VEG 🍗</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SUBMIT BUTTON (Desktop + Mobile Sticky bar) */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[48px] py-3.5 px-6 rounded-xl bg-[#E5BD00] hover:bg-[#EEEEEA] text-[#090A0B] border-2 border-[#090A0B] shadow-[3px_3px_0px_#090A0B] font-display text-sm sm:text-base tracking-wider uppercase flex items-center justify-center gap-2 transition-all active:translate-x-0.5 active:translate-y-0.5 cursor-pointer font-black disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>SECURING REGISTRATION...</span>
                </>
              ) : (
                <>
                  <span>PROCEED TO PAYMENT</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </>
              )}
            </button>
            <p className="text-center text-[11px] text-[#B8B8B2]/80 font-mono mt-2">
              Individual digital QR passes will be generated &amp; dispatched upon treasurer approval.
            </p>
          </div>

          {/* Mobile Sticky Bar */}
          <div className="sm:hidden fixed bottom-0 left-0 right-0 p-3 bg-[#08090A]/95 backdrop-blur-md border-t border-[#B8B8B2]/20 z-40 flex items-center justify-between gap-3 shadow-[0_-4px_10px_rgba(0,0,0,0.5)]">
            <div className="font-mono leading-tight">
              <span className="block text-xs font-bold text-[#EEEEEA] uppercase">{totalMembersCount} Member{totalMembersCount === 1 ? '' : 's'}</span>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#E5BD00] hover:bg-[#EEEEEA] text-[#090A0B] font-display font-black text-xs tracking-wider uppercase flex items-center gap-2 cursor-pointer shadow-[2px_2px_0px_#090A0B] disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>PROCEED</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
                </>
              )}
            </button>
          </div>
        </form>
      </main>

      {/* Footer */}
      <WebsiteFooter />
    </div>
  );
};

export default WebsiteRegisterPage;
