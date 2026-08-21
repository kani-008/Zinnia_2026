import React from 'react';
import { Zap } from 'lucide-react';

export const TimelineNode: React.FC = () => {
  return (
    <div className="absolute -left-[17px] top-1.5 w-8 h-8 rounded-full bg-slate-950 border-2 border-cyan-400 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.4)] group-hover:scale-110 transition-transform">
      <Zap className="w-3.5 h-3.5" />
    </div>
  );
};
