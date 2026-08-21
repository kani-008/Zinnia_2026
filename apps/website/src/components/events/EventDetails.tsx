import React from 'react';
import { EventMission } from '@packages/types/src';
import { X, Clock, Users, MapPin, Award, AlertCircle, ChevronRight } from 'lucide-react';

export interface EventDetailsProps {
  event: EventMission | null;
  onClose: () => void;
  onAccept: (eventId: string) => void;
}

export const EventDetails: React.FC<EventDetailsProps> = ({
  event,
  onClose,
  onAccept
}) => {
  if (!event) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass-panel max-w-2xl w-full p-6 sm:p-8 tech-bracket border-cyan-400 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-900 border border-slate-700 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1 pr-8">
          <div className="flex items-center gap-2 font-mono text-xs text-cyan-400">
            <span>{event.code}</span>
            <span>//</span>
            <span>CLEARANCE: {event.clearance_level}</span>
          </div>
          <h2 className="text-2xl font-heading font-black text-white">
            {event.mission_name}
          </h2>
          <div className="text-sm font-mono text-cyan-300 font-semibold">
            Event: {event.title}
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider font-bold">
            MISSION BRIEFING
          </h4>
          <p className="text-sm text-slate-200 leading-relaxed font-sans bg-slate-950/60 p-4 rounded border border-slate-800">
            {event.description}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
          <div className="p-3 rounded bg-slate-900/60 border border-slate-800">
            <div className="text-slate-500 uppercase text-[10px]">TIME / DURATION</div>
            <div className="text-white font-bold mt-1">{event.schedule_time}</div>
            <div className="text-cyan-400 text-[11px]">{event.duration}</div>
          </div>
          <div className="p-3 rounded bg-slate-900/60 border border-slate-800">
            <div className="text-slate-500 uppercase text-[10px]">TEAM COMPOSITION</div>
            <div className="text-white font-bold mt-1">{event.team_size_min}-{event.team_size_max} Agents</div>
          </div>
          <div className="p-3 rounded bg-slate-900/60 border border-slate-800">
            <div className="text-slate-500 uppercase text-[10px]">COORDINATES / VENUE</div>
            <div className="text-white font-bold mt-1 truncate">{event.venue}</div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-mono text-amber-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" /> RULES & GUIDELINES
          </h4>
          <ul className="space-y-1.5 font-sans text-xs text-slate-300">
            {event.rules.map((rule, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-cyan-400 font-mono font-bold">&bull;</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end gap-3 font-mono text-xs">
          <button onClick={onClose} className="px-4 py-2 rounded bg-slate-900 text-slate-300">
            CLOSE
          </button>
          <button
            onClick={() => onAccept(event.id)}
            className="btn-temporal py-2 px-6"
          >
            <span>ACCEPT THIS MISSION</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
