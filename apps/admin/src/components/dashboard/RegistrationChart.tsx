import React from 'react';

export interface RegistrationChartProps {
  collegeData: { [college: string]: number };
}

export const RegistrationChart: React.FC<RegistrationChartProps> = ({ collegeData }) => {
  const entries = Object.entries(collegeData);
  const total = entries.reduce((acc, [, val]) => acc + val, 0);

  return (
    <div className="glass-panel p-5 tech-bracket border-slate-800 space-y-4 font-mono text-xs">
      <div className="text-white font-heading font-bold text-sm">
        INSTITUTIONAL DISTRIBUTION
      </div>
      <div className="space-y-3">
        {entries.map(([col, count]) => {
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={col} className="space-y-1">
              <div className="flex justify-between text-slate-300">
                <span className="truncate max-w-[200px]">{col}</span>
                <span className="text-cyan-400 font-bold">{count} ({pct}%)</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                <div
                  className="h-full bg-cyan-400 rounded-full"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
