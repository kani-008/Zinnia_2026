import React from 'react';

export interface FoodStatsProps {
  claimed: number;
  total: number;
}

export const FoodStats: React.FC<FoodStatsProps> = ({ claimed, total }) => {
  const pct = total > 0 ? Math.round((claimed / total) * 100) : 0;
  return (
    <div className="glass-panel p-4 tech-bracket border-amber-500/30 font-mono text-xs space-y-2">
      <div className="flex justify-between text-slate-300">
        <span>MEAL TOKENS REDEEMED</span>
        <span className="text-amber-400 font-bold">{claimed} / {total} ({pct}%)</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};
