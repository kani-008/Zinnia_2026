import React from 'react';

export interface EventStatsProps {
  totalMissions: number;
  totalTurnout: number;
}

export const EventStats: React.FC<EventStatsProps> = ({ totalMissions, totalTurnout }) => {
  return (
    <div className="glass-panel p-4 tech-bracket border-violet-500/30 font-mono text-xs flex justify-between">
      <div>
        <div className="text-slate-400">TOTAL MISSIONS</div>
        <div className="text-xl font-bold text-white mt-1">{totalMissions}</div>
      </div>
      <div>
        <div className="text-slate-400">TOTAL MISSION TURNOUT</div>
        <div className="text-xl font-bold text-violet-400 mt-1">{totalTurnout}</div>
      </div>
    </div>
  );
};
