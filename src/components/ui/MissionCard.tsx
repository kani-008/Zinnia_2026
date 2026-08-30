import React from 'react';
import { EventMission } from '@/types';
import { Clock, Users, ArrowUpRight, Trophy } from 'lucide-react';

export interface MissionCardProps {
  mission: EventMission;
  onOpenDossier: (mission: EventMission) => void;
  onAccept: (missionId: string) => void;
}

export const MissionCard: React.FC<MissionCardProps> = ({
  mission,
  onOpenDossier,
  onAccept
}) => {
  const isTech = mission.event_type === 'TECH';

  return (
    <div
      className="bento-card p-6 flex flex-col justify-between space-y-5 transition-all group hover:-translate-y-1.5 duration-300 h-full border border-white/10 hover:border-indigo-500/40"
    >
      <div className="space-y-4">
        {/* Top Badges */}
        <div className="flex justify-between items-center text-xs">
          <span className={`px-3 py-1 rounded-full font-semibold border ${
            isTech 
              ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' 
              : 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30'
          }`}>
            {mission.code} &bull; {mission.event_type === 'TECH' ? 'Technical' : 'Non-Technical'}
          </span>

          <span className="text-xs text-slate-400 font-medium">
            {mission.is_single_event_only ? '★ Marathon Special' : mission.category}
          </span>
        </div>

        {/* Title */}
        <div>
          <h3 className="text-xl font-heading font-bold text-white group-hover:text-indigo-300 transition-colors">
            {mission.mission_name}
          </h3>
          <div className="text-xs text-slate-400 mt-1 font-medium">
            Track: <span className="text-slate-200 font-semibold">{mission.title}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed line-clamp-3">
          {mission.description}
        </p>

        {/* Prize Pool Tag */}
        {mission.prizes?.first && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs">
            <span className="text-amber-400 font-semibold flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              Prize Pool
            </span>
            <span className="text-white font-bold">{mission.prizes.first}</span>
          </div>
        )}

        {/* Schedule & Team Specs */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 truncate">
            <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate">{mission.schedule_time}</span>
          </div>
          <div className="flex items-center gap-1.5 justify-end">
            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{mission.team_size_min}-{mission.team_size_max} Members</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-4 border-t border-white/5 flex gap-2.5">
        <button
          type="button"
          onClick={() => onOpenDossier(mission)}
          className="flex-1 py-2.5 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center gap-1.5 transition-all text-xs font-semibold"
        >
          <span>Details</span>
        </button>

        <button
          type="button"
          onClick={() => onAccept(mission.id)}
          className="btn-gradient py-2.5 px-5 text-xs font-semibold"
        >
          <span>Register</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
