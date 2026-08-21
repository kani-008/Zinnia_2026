import React from 'react';
import { TimelineNode } from './TimelineNode';

export interface TimelineEventProps {
  timestamp: string;
  timeLabel: string;
  title: string;
  description: string;
  status: 'STABLE' | 'WARNING' | 'CRITICAL' | 'FRACTURE' | 'RESOLVING';
  code: string;
}

export const TimelineEvent: React.FC<TimelineEventProps> = ({
  timestamp,
  timeLabel,
  title,
  description,
  status,
  code
}) => {
  return (
    <div className="relative pl-6 sm:pl-8 group">
      <TimelineNode />
      <div className="hidden sm:block absolute -left-36 top-2 font-mono text-xs font-bold text-cyan-400 text-right w-24">
        {timeLabel}
      </div>
      <div className="glass-panel p-5 tech-bracket space-y-2 border-slate-800 hover:border-cyan-500/50 transition-all">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="font-mono text-xs text-slate-400">{timestamp}</div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-slate-500">{code}</span>
            <span className="px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 text-[10px]">{status}</span>
          </div>
        </div>
        <h3 className="text-lg font-heading font-bold text-white group-hover:text-cyan-300 transition-colors">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
};
