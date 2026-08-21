import React from 'react';

export interface AgentStatusProps {
  status: 'ACTIVE' | 'PENDING' | 'DISQUALIFIED';
  clearanceLevel: string;
}

export const AgentStatus: React.FC<AgentStatusProps> = ({
  status,
  clearanceLevel
}) => {
  return (
    <div className="flex items-center gap-2 font-mono text-xs">
      <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 font-bold border border-emerald-500/40 text-[10px]">
        &bull; {status}
      </span>
      <span className="text-violet-400 font-bold text-[10px]">
        {clearanceLevel}
      </span>
    </div>
  );
};
