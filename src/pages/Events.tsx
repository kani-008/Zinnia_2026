import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { store } from '../services/store';
import { EventMission } from '@packages/types/src';
import { sound } from '../services/sound';
import { 
  Zap, 
  Clock, 
  Users, 
  MapPin, 
  Award, 
  AlertCircle, 
  X, 
  ChevronRight, 
  Filter, 
  FileText,
  ShieldCheck
} from 'lucide-react';
import { GlitchText } from '../components/hero/GlitchText';

export const EventsPage: React.FC = () => {
  const [filter, setFilter] = useState<'ALL' | 'TECHNICAL' | 'NON_TECHNICAL'>('ALL');
  const [selectedMission, setSelectedMission] = useState<EventMission | null>(null);
  const navigate = useNavigate();
  const allEvents = store.getEvents();

  const filteredEvents = allEvents.filter(e => {
    if (filter === 'ALL') return true;
    return e.category === filter;
  });

  const getDifficultyMeter = (clearance: string) => {
    if (clearance === 'LEVEL 03') return '██████████';
    if (clearance === 'LEVEL 02') return '███████░░░';
    return '████░░░░░░';
  };

  const handleAcceptMission = (missionId: string) => {
    sound.playConfirmTone();
    navigate(`/register?mission=${missionId}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 font-mono text-xs">
      {/* Header */}
      <div className="space-y-4 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold tracking-widest uppercase">
          <Zap className="w-3.5 h-3.5" />
          TACTICAL DIRECTIVE // CHRONOS MISSIONS
        </div>
        <h1 className="text-3xl sm:text-5xl font-heading font-black text-white uppercase">
          OPERATIONAL <GlitchText text="MISSIONS" />
        </h1>
        <p className="text-slate-400 font-sans text-xs sm:text-sm">
          Select investigative missions to stabilize the continuum. Every assignment awards official clearance certificates.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex justify-center gap-2">
        {(['ALL', 'TECHNICAL', 'NON_TECHNICAL'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => {
              sound.playKeyClick();
              setFilter(cat);
            }}
            className={`px-4 py-2 rounded text-xs font-bold transition-all ${
              filter === cat
                ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                : 'bg-slate-950/60 text-slate-400 border border-slate-900 hover:text-white'
            }`}
          >
            {cat === 'ALL' ? 'ALL 9 MISSIONS' : cat.replace('_', '-')}
          </button>
        ))}
      </div>

      {/* Missions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((mission) => (
          <div
            key={mission.id}
            onMouseEnter={() => sound.playHoverTone()}
            className="glass-panel p-6 tech-bracket flex flex-col justify-between space-y-4 hover:border-cyan-400 transition-all group"
          >
            <div className="space-y-3">
              {/* Card Meta */}
              <div className="flex justify-between items-center text-[10px]">
                <span className="px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 font-bold">
                  {mission.code}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                  {mission.category}
                </span>
              </div>

              {/* Mission Title */}
              <div>
                <h3 className="text-lg font-heading font-bold text-white group-hover:text-cyan-300 transition-colors font-sans">
                  {mission.mission_name}
                </h3>
                <div className="text-slate-400 text-xs mt-0.5">
                  Designation: <span className="text-cyan-400 font-semibold">{mission.title}</span>
                </div>
              </div>

              <p className="text-slate-300 font-sans text-xs line-clamp-3 leading-relaxed">
                {mission.description}
              </p>

              {/* Difficulty & Clearance Meter */}
              <div className="space-y-1 pt-2 border-t border-slate-900 text-[10px]">
                <div className="flex justify-between text-slate-400">
                  <span>DIFFICULTY FLUX</span>
                  <span className="text-cyan-400 font-bold">{getDifficultyMeter(mission.clearance_level)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>CLEARANCE REQUIRED</span>
                  <span className="text-violet-400 font-bold">{mission.clearance_level}</span>
                </div>
              </div>

              {/* Schedule & Team size */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-900 text-[11px] text-slate-400">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  <span>{mission.schedule_time}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-violet-400" />
                  <span>{mission.team_size_min}-{mission.team_size_max} Agents</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-900 flex gap-2">
              <button
                onClick={() => {
                  sound.playKeyClick();
                  setSelectedMission(mission);
                }}
                className="flex-1 py-2 rounded bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-center gap-1"
              >
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span>DOSSIER</span>
              </button>
              <button
                onClick={() => handleAcceptMission(mission.id)}
                className="btn-temporal py-2 px-4 text-xs font-bold"
              >
                <span>ACCEPT</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Mission Dossier Modal */}
      {selectedMission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-panel max-w-2xl w-full p-6 sm:p-8 tech-bracket border-cyan-400 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-6">
            <button
              onClick={() => setSelectedMission(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-900 border border-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 pr-8">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
                <span>{selectedMission.code}</span>
                <span>//</span>
                <span>CLEARANCE: {selectedMission.clearance_level}</span>
              </div>
              <h2 className="text-2xl font-heading font-black text-white uppercase font-sans">
                {selectedMission.mission_name}
              </h2>
              <div className="text-sm text-cyan-300 font-semibold font-sans">
                Operational Title: {selectedMission.title}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                MISSION OBJECTIVE
              </div>
              <p className="text-xs sm:text-sm text-slate-200 font-sans leading-relaxed bg-slate-950/70 p-4 rounded border border-slate-900">
                {selectedMission.description}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded bg-slate-950 border border-slate-900">
                <span className="text-[10px] text-slate-500 uppercase">TIMELINE SLOT</span>
                <div className="text-white font-bold mt-1">{selectedMission.schedule_time}</div>
                <div className="text-cyan-400 text-[11px]">{selectedMission.duration}</div>
              </div>
              <div className="p-3 rounded bg-slate-950 border border-slate-900">
                <span className="text-[10px] text-slate-500 uppercase">SQUAD SIZE</span>
                <div className="text-white font-bold mt-1">{selectedMission.team_size_min}-{selectedMission.team_size_max} Agents</div>
              </div>
              <div className="p-3 rounded bg-slate-950 border border-slate-900">
                <span className="text-[10px] text-slate-500 uppercase">COORDINATES</span>
                <div className="text-white font-bold mt-1 truncate">{selectedMission.venue}</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                ENGAGEMENT PROTOCOLS & RULES
              </div>
              <ul className="space-y-1.5 font-sans text-xs text-slate-300">
                {selectedMission.rules.map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-cyan-400 font-mono font-bold">&bull;</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t border-slate-900 flex justify-end gap-3">
              <button
                onClick={() => setSelectedMission(null)}
                className="px-4 py-2 rounded bg-slate-900 text-slate-300 hover:text-white"
              >
                CLOSE DOSSIER
              </button>
              <button
                onClick={() => handleAcceptMission(selectedMission.id)}
                className="btn-temporal py-2 px-6 text-xs font-bold"
              >
                <span>ACCEPT THIS MISSION</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsPage;
