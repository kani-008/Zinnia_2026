import React from 'react';
import { TimelineEvent } from './TimelineEvent';

export interface TimelineProps {
  events: Array<{
    timestamp: string;
    timeLabel: string;
    title: string;
    description: string;
    status: 'STABLE' | 'WARNING' | 'CRITICAL' | 'FRACTURE' | 'RESOLVING';
    code: string;
  }>;
}

export const Timeline: React.FC<TimelineProps> = ({ events }) => {
  return (
    <div className="relative border-l-2 border-cyan-500/30 ml-4 sm:ml-32 space-y-8 py-4">
      {events.map((evt, idx) => (
        <TimelineEvent key={idx} {...evt} />
      ))}
    </div>
  );
};
