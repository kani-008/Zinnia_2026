import React from 'react';

export interface AttendanceChartProps {
  gateCount: number;
  totalRegistered: number;
}

export const AttendanceChart: React.FC<AttendanceChartProps> = ({
  gateCount,
  totalRegistered
}) => {
  const pct = totalRegistered > 0 ? Math.round((gateCount / totalRegistered) * 100) : 0;

  return (
    <div className="glass-panel p-5 tech-bracket border-slate-800 space-y-4 font-mono text-xs">
      <div className="text-white font-heading font-bold text-sm">
        GATE ENTRY TURNOUT
      </div>
      <div className="flex items-center gap-4">
        <div className="text-4xl font-heading font-black text-emerald-400">
          {pct}%
        </div>
        <div className="text-slate-400 text-xs">
          <div>{gateCount} Checked-in</div>
          <div>{totalRegistered} Registered Total</div>
        </div>
      </div>
      <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
        <div
          className="h-full bg-emerald-400 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};
