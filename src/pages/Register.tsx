import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { store } from '../services/store';
import { audioManager } from '../core/AudioManager';
import { 
  ArrowRight, 
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
    <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto space-y-8 select-none">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-950/80 border border-cyan-500/30 backdrop-blur-xl space-y-1 shadow-2xl">
        <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-2">
          <Shield className="w-3.5 h-3.5" />
          <span>OFFICIAL REGISTRATION // ZINNIA '26</span>
        </div>
        <h1 className="text-3xl font-black text-white font-mono">TEAM & PARTICIPANT ENROLLMENT</h1>
        <p className="text-xs text-slate-400 font-light">
          Register your team details. Each individual member will receive their own Digital Passport QR code for campus entry, event check-in, and lunch token.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/90 border border-rose-500 text-rose-300 text-xs font-mono rounded-2xl flex items-center gap-2.5 backdrop-blur-md animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="p-8 rounded-3xl bg-slate-950/80 border border-slate-800 backdrop-blur-xl space-y-8 text-xs font-mono shadow-2xl"
      >
        {/* Section 1: Event Selection Separated by Technical and Non-Technical */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <label className="block text-slate-300 font-bold uppercase text-sm">
              1. SELECT SYMPOSIUM EVENTS <span className="text-cyan-400">*</span>
            </label>
            {registeredEvents.length > 0 && (
              <span className="text-[11px] text-cyan-400 bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-500/40 font-bold">
                Required Team: {minTeamSize} - {maxTeamSize} Member(s)
              </span>
            )}
          </div>

          {/* Technical Events Subsection */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase text-xs">
              <Cpu className="w-4 h-4" />
              <span>TECHNICAL EVENTS</span>
              <span className="text-[10px] text-cyan-500/60 font-normal">({techEvents.length} Missions)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {techEvents.map((e) => {
                const isChecked = registeredEvents.includes(e.id);
                return (
                  <div
                    key={e.id}
                    onClick={() => handleToggleEvent(e.id)}
                    className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between gap-2 transition-all select-none ${
                      isChecked
                        ? 'bg-cyan-950/90 border-cyan-400 text-white shadow-md ring-1 ring-cyan-400/50'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-cyan-500/40 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="accent-cyan-400 w-4 h-4 rounded cursor-pointer pointer-events-none"
                      />
                      <span className="truncate text-xs">
                        <strong className="text-cyan-300 font-bold">[{e.code}]</strong> {e.mission_name}
                      </span>
                    </div>
                    <span className="text-[10px] bg-slate-950 text-cyan-400 px-1.5 py-0.5 rounded border border-slate-800 shrink-0 font-mono">
                      {e.team_size_min}-{e.team_size_max}P
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Non-Technical Events Subsection */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold uppercase text-xs">
              <Sparkles className="w-4 h-4" />
              <span>NON-TECHNICAL EVENTS</span>
              <span className="text-[10px] text-amber-500/60 font-normal">({nonTechEvents.length} Missions)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {nonTechEvents.map((e) => {
                const isChecked = registeredEvents.includes(e.id);
                return (
                  <div
                    key={e.id}
                    onClick={() => handleToggleEvent(e.id)}
                    className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between gap-2 transition-all select-none ${
                      isChecked
                        ? 'bg-amber-950/80 border-amber-400 text-white shadow-md ring-1 ring-amber-400/50'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-amber-500/40 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="accent-amber-400 w-4 h-4 rounded cursor-pointer pointer-events-none"
                      />
                      <span className="truncate text-xs">
                        <strong className="text-amber-300 font-bold">[{e.code}]</strong> {e.mission_name}
                      </span>
                    </div>
                    <span className="text-[10px] bg-slate-950 text-amber-400 px-1.5 py-0.5 rounded border border-slate-800 shrink-0 font-mono">
                      {e.team_size_min}-{e.team_size_max}P
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 2: Team & Institutional Details */}
        <div className="space-y-4 pt-2 border-t border-slate-800">
          <h2 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
            <Users className="w-4 h-4" />
            2. TEAM & COLLEGE CREDENTIALS
          </h2>

          <div className="space-y-1.5">
            <label className="block text-slate-300 font-bold">
              TEAM NAME / SQUAD TITLE <span className="text-slate-500 font-normal">(Optional for solo)</span>
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. Neural Vanguard / Cyber Phantoms"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-slate-300 font-bold">
              COLLEGE / INSTITUTION NAME <span className="text-cyan-400">*</span>
            </label>
            <input
              type="text"
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              placeholder="e.g. Government College of Engineering, Erode"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400 transition-colors"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-slate-300 font-bold">DEPARTMENT</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400 transition-colors"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-300 font-bold">ACADEMIC YEAR</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400 transition-colors"
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
        <div className="space-y-4 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-amber-400 flex items-center gap-2">
              <User className="w-4 h-4" />
              3. TEAM LEADER (MEMBER 1)
            </h2>
            <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-500/40 font-bold">
              Primary Contact
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="block text-slate-300 font-bold">
              LEADER FULL NAME <span className="text-cyan-400">*</span>
            </label>
            <input
              type="text"
              value={leader.name}
              onChange={(e) => setLeader({ ...leader, name: e.target.value })}
              placeholder="e.g. Alex Mercer"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400 transition-colors"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-slate-300 font-bold flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-cyan-400" />
                <span>LEADER EMAIL</span>
                <span className="text-cyan-400">*</span>
              </label>
              <input
                type="email"
                value={leader.email}
                onChange={(e) => setLeader({ ...leader, email: e.target.value })}
                placeholder="leader@institution.edu"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400 transition-colors"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-300 font-bold flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-cyan-400" />
                <span>LEADER PHONE NUMBER</span>
                <span className="text-cyan-400">*</span>
              </label>
              <input
                type="tel"
                value={leader.phone}
                onChange={(e) => setLeader({ ...leader, phone: e.target.value })}
                placeholder="+91 98401 23456"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400 transition-colors"
                required
              />
            </div>
          </div>
        </div>

        {/* Section 4: Dynamic Additional Team Members */}
        {maxTeamSize > 1 && (
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  4. TEAM MEMBERS ({1 + members.length} / {maxTeamSize} Maximum)
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Each member gets their own wristband, personalized QR pass, and food token.
                </p>
              </div>

              {members.length + 1 < maxTeamSize && (
                <button
                  type="button"
                  onClick={handleAddMemberSlot}
                  className="px-3 py-1.5 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Member</span>
                </button>
              )}
            </div>

            {members.map((member, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 relative shadow-inner">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-xs font-bold text-white font-mono flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-400 flex items-center justify-center text-[10px]">
                      {idx + 2}
                    </span>
                    <span>TEAM MEMBER {idx + 2}</span>
                    {idx < additionalSlotsRequired && <span className="text-cyan-400 text-[10px]">(Required)</span>}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveMemberSlot(idx)}
                    className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                    title="Remove member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] text-slate-300 font-bold">
                    MEMBER {idx + 2} FULL NAME <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={member.name}
                    onChange={(e) => handleMemberChange(idx, 'name', e.target.value)}
                    placeholder={`e.g. Member ${idx + 2} Full Name`}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:border-cyan-400 focus:outline-none font-mono"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] text-slate-300 font-bold flex items-center gap-1">
                      <Mail className="w-3 h-3 text-cyan-400" />
                      <span>MEMBER {idx + 2} EMAIL</span>
                      <span className="text-cyan-400">*</span>
                    </label>
                    <input
                      type="email"
                      value={member.email}
                      onChange={(e) => handleMemberChange(idx, 'email', e.target.value)}
                      placeholder={`member${idx + 2}@institution.edu`}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:border-cyan-400 focus:outline-none font-mono"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] text-slate-300 font-bold flex items-center gap-1">
                      <Phone className="w-3 h-3 text-cyan-400" />
                      <span>MEMBER {idx + 2} PHONE NUMBER</span>
                      <span className="text-cyan-400">*</span>
                    </label>
                    <input
                      type="tel"
                      value={member.phone}
                      onChange={(e) => handleMemberChange(idx, 'phone', e.target.value)}
                      placeholder={`+91 98401 23456`}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:border-cyan-400 focus:outline-none font-mono"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}

            {members.length === 0 && additionalSlotsRequired > 0 && (
              <div className="p-4 rounded-xl border border-dashed border-amber-500/40 bg-amber-950/20 text-amber-300 text-xs">
                Selected event requires at least {minTeamSize} participants. Click <strong>+ Add Member</strong> above to provide Member 2 details.
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black font-mono text-sm uppercase tracking-wider transition-all shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
          >
            {isSubmitting ? (
              <span>PROCESSING REGISTRATION...</span>
            ) : (
              <>
                <span>PROCEED</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WebsiteRegisterPage;
