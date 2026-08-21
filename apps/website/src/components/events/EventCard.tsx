import React from 'react';
import { EventMission } from '@packages/types/src';
import { Clock, Users, MapPin, ChevronRight, Info } from 'lucide-react';

export interface EventCardProps {
  event: EventMission;
  onOpenDetails: (event: EventMission) => void;
  onAccept: (eventId: string) => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onOpenDetails,
  onAccept
}) => {
  return (
    <div className="glass-panel p-6 tech-bracket flex flex-col justify-between space-y-4 hover:border-cyan-400 transition-all group">
      <div className="space-y-3">
        <div className="flex items-center justify-between font-mono text-xs">
          <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 font-bold">
            {event.code}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-400 border border-blue-500/30">
            {event.category}
          </span>
        </div>

        <div>
          <h3 className="text-xl font-heading font-bold text-white group-hover:text-cyan-300 transition-colors">
            {event.mission_name}
          </h3>
          <div className="text-xs font-mono text-slate-400 mt-0.5">
            Event: <span className="text-cyan-400 font-semibold">{event.title}</span>
          </div>
        </div>

        <p className="text-xs text-slate-300 font-sans leading-relaxed line-clamp-3">
          {event.description}
        </p>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 font-mono text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{event.schedule_time}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-violet-400" />
            <span>{event.team_size_min}-{event.team_size_max} Agents</span>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-800 flex gap-2">
        <button
          onClick={() => onOpenDetails(event)}
          className="flex-1 py-2 rounded bg-slate-900 border border-slate-700 font-mono text-xs text-slate-300 hover:text-white flex items-center justify-center gap-1.5"
        >
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span>DOSSIER</span>
        </button>
        <button
          onClick={() => onAccept(event.id)}
          className="px-4 py-2 rounded bg-cyan-500/20 border border-cyan-400 font-heading text-xs font-bold text-cyan-300 hover:bg-cyan-500 hover:text-black transition-all flex items-center gap-1"
        >
          <span>ACCEPT</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
