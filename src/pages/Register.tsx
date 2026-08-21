import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { store } from '../services/store';
import { sound } from '../services/sound';
import { Participant } from '@packages/types/src';
import confetti from 'canvas-confetti';
import { 
  Shield, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  AlertTriangle, 
  Zap, 
  User, 
  GraduationCap, 
  Radio
} from 'lucide-react';
import { GlitchText } from '../components/hero/GlitchText';

export const RegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preselectedMission = searchParams.get('mission');

  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    college: '',
    department: 'Computer Science and Engineering',
    year: 'III',
    registered_events: preselectedMission ? [preselectedMission] : [] as string[]
  });

  const [error, setError] = useState<string | null>(null);
  const [createdAgent, setCreatedAgent] = useState<Participant | null>(null);

  const allMissions = store.getEvents();

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (step === 1) {
      if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
        setError('All identity credentials are required.');
        sound.playAnomalyWarning();
        return;
      }
      if (!formData.email.includes('@')) {
        setError('Invalid communications email format.');
        sound.playAnomalyWarning();
        return;
      }
      if (formData.phone.length < 10) {
        setError('Phone number must contain at least 10 digits.');
        sound.playAnomalyWarning();
        return;
      }
      sound.playConfirmTone();
      setStep(2);
    } else if (step === 2) {
      if (!formData.college.trim() || !formData.department.trim()) {
        setError('College and engineering department are required.');
        sound.playAnomalyWarning();
        return;
      }
      sound.playConfirmTone();
      setStep(3);
    } else if (step === 3) {
      if (formData.registered_events.length === 0) {
        setError('You must select at least one tactical mission assignment.');
        sound.playAnomalyWarning();
        return;
      }

      try {
        const participant = store.registerParticipant(formData);
        setCreatedAgent(participant);
        sound.playConfirmTone();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
        setStep(4);
      } catch (err: any) {
        setError(err.message || 'Enlistment failed.');
        sound.playAnomalyWarning();
      }
    }
  };

  const handleToggleMission = (missionId: string, isSingleOnly: boolean) => {
    sound.playKeyClick();
    if (isSingleOnly) {
      // Single event replaces all other events
      setFormData(prev => ({
        ...prev,
        registered_events: [missionId]
      }));
    } else {
      // Deselect any single-event-only mission if regular one is selected
      const filtered = formData.registered_events.filter(id => {
        const m = allMissions.find(x => x.id === id);
        return !m?.is_single_event_only;
      });

      if (filtered.includes(missionId)) {
        setFormData(prev => ({
          ...prev,
          registered_events: filtered.filter(id => id !== missionId)
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          registered_events: [...filtered, missionId]
        }));
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 font-mono text-xs">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold tracking-widest uppercase">
          <Shield className="w-3.5 h-3.5" />
          CHRONOS // AGENT RECRUITMENT TERMINAL
        </div>
        <h1 className="text-3xl sm:text-5xl font-heading font-black text-white uppercase">
          AGENT <GlitchText text="ENLISTMENT" />
        </h1>
        <p className="text-slate-400 font-sans text-xs sm:text-sm">
          Initialize your credentials to participate in the ZINNIA 2026 symposium operations.
        </p>
      </div>

      {/* Progress Steps Indicator */}
      {step < 4 && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { num: 1, label: 'AGENT IDENTITY' },
            { num: 2, label: 'INSTITUTION' },
            { num: 3, label: 'MISSION ASSIGNMENT' }
          ].map(s => (
            <div
              key={s.num}
              className={`p-3 rounded border text-center transition-all ${
                step === s.num
                  ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 font-bold shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                  : step > s.num
                  ? 'bg-slate-900 border-emerald-500/40 text-emerald-400'
                  : 'bg-slate-950/40 border-slate-900 text-slate-600'
              }`}
            >
              0{s.num}. {s.label}
            </div>
          ))}
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="p-3.5 rounded bg-rose-950/80 border border-rose-500 text-rose-300 flex items-center gap-2 font-bold">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Agent Identification */}
      {step === 1 && (
        <form onSubmit={handleNextStep} className="glass-panel p-6 sm:p-8 tech-bracket border-slate-800 space-y-4">
          <div className="text-white font-heading font-bold text-sm border-b border-slate-900 pb-2">
            STEP 01 // PERSONAL CREDENTIALS
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-bold">AGENT FULL NAME *</label>
            <input
              type="text"
              placeholder="e.g. Kanishkar S"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded bg-slate-950 border border-slate-800 text-white font-sans text-xs focus:border-cyan-400 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1 font-bold">COMMUNICATIONS EMAIL *</label>
              <input
                type="email"
                placeholder="e.g. agent@college.edu"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded bg-slate-950 border border-slate-800 text-white font-sans text-xs focus:border-cyan-400 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-bold">CONTACT TELEMETRY (PHONE) *</label>
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded bg-slate-950 border border-slate-800 text-white font-sans text-xs focus:border-cyan-400 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button type="submit" className="btn-temporal py-2.5 px-6 text-xs font-bold">
              <span>PROCEED TO INSTITUTION</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* Step 2: Institutional Clearance */}
      {step === 2 && (
        <form onSubmit={handleNextStep} className="glass-panel p-6 sm:p-8 tech-bracket border-slate-800 space-y-4">
          <div className="text-white font-heading font-bold text-sm border-b border-slate-900 pb-2">
            STEP 02 // INSTITUTIONAL AFFILIATION
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-bold">COLLEGE / UNIVERSITY NAME *</label>
            <input
              type="text"
              placeholder="e.g. Government College of Engineering, Salem"
              value={formData.college}
              onChange={e => setFormData({ ...formData, college: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded bg-slate-950 border border-slate-800 text-white font-sans text-xs focus:border-cyan-400 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1 font-bold">ENGINEERING DEPARTMENT *</label>
              <input
                type="text"
                placeholder="e.g. Computer Science & Engineering"
                value={formData.department}
                onChange={e => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded bg-slate-950 border border-slate-800 text-white font-sans text-xs focus:border-cyan-400 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-bold">YEAR OF STUDY *</label>
              <select
                value={formData.year}
                onChange={e => setFormData({ ...formData, year: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded bg-slate-950 border border-slate-800 text-white font-sans text-xs focus:border-cyan-400 focus:outline-none"
              >
                <option value="I">1st Year (Freshman)</option>
                <option value="II">2nd Year (Sophomore)</option>
                <option value="III">3rd Year (Junior)</option>
                <option value="IV">4th Year (Senior)</option>
                <option value="PG">Postgraduate / Research</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="btn-secondary py-2 px-4 text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button type="submit" className="btn-temporal py-2.5 px-6 text-xs font-bold">
              <span>SELECT MISSIONS</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* Step 3: Tactical Mission Assignment */}
      {step === 3 && (
        <form onSubmit={handleNextStep} className="glass-panel p-6 sm:p-8 tech-bracket border-slate-800 space-y-6">
          <div className="space-y-1 border-b border-slate-900 pb-3">
            <div className="text-white font-heading font-bold text-sm">
              STEP 03 // MISSION ASSIGNMENT
            </div>
            <div className="text-slate-400 text-xs">
              Select short operations or exclusive single-event marathon protocols (e.g. Infinity Protocol, UI/UX Design).
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allMissions.map(m => {
              const isSelected = formData.registered_events.includes(m.id);
              return (
                <div
                  key={m.id}
                  onClick={() => handleToggleMission(m.id, m.is_single_event_only)}
                  className={`p-4 rounded border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-cyan-950/80 border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                      : 'bg-slate-950/60 border-slate-900 hover:border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-cyan-400 font-bold">{m.code}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      m.is_single_event_only ? 'bg-amber-950 text-amber-300 border border-amber-500/30' : 'text-slate-500'
                    }`}>
                      {m.is_single_event_only ? 'EXCLUSIVE SINGLE EVENT' : m.category}
                    </span>
                  </div>
                  <div className="text-sm font-heading font-bold text-white mt-1">
                    {m.mission_name}
                  </div>
                  <div className="text-xs text-slate-400 font-sans mt-0.5">{m.schedule_time}</div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 flex justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="btn-secondary py-2 px-4 text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button type="submit" className="btn-temporal py-3 px-8 text-xs font-bold">
              <span>[ CONFIRM ENLISTMENT & COMMISSION ]</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* Step 4: Commission Granted & Confirmation */}
      {step === 4 && createdAgent && (
        <div className="glass-panel p-8 sm:p-10 tech-bracket border-emerald-500/60 text-center space-y-6 max-w-lg mx-auto shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-950 border-2 border-emerald-400 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.5)]">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="text-xs text-emerald-400 font-bold tracking-widest uppercase">
              COMMISSION GRANTED // ACTIVE
            </div>
            <h2 className="text-2xl sm:text-3xl font-heading font-black text-white uppercase">
              WELCOME, AGENT {createdAgent.name}
            </h2>
            <p className="text-slate-400 text-xs font-sans">
              Your profile has been synchronized into the CHRONOS central intelligence network.
            </p>
          </div>

          <div className="p-4 rounded bg-slate-950 border border-slate-900 space-y-1">
            <div className="text-[10px] text-slate-500 uppercase">ASSIGNED AGENT ID</div>
            <div className="text-2xl font-bold text-cyan-300 tracking-wider">
              {createdAgent.agent_id}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Link
              to={`/passport?id=${createdAgent.agent_id}`}
              onClick={() => sound.playConfirmTone()}
              className="btn-temporal w-full py-3.5 text-xs font-bold"
            >
              <span>ACCESS DIGITAL PASSPORT</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/events"
              onClick={() => sound.playKeyClick()}
              className="btn-secondary w-full py-2.5 text-xs justify-center"
            >
              <span>EXPLORE MISSION SCHEDULE</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterPage;
