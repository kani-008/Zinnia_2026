import React from 'react';
import { EventMission } from '@packages/types/src';

export interface EventManagementProps {
  events: EventMission[];
}

export const EventManagement: React.FC<EventManagementProps> = ({ events }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
      {events.map((evt) => (
        <div key={evt.id} className="glass-panel p-4 tech-bracket border-slate-800 space-y-2">
          <div className="flex justify-between text-cyan-400 font-bold">
            <span>{evt.code}</span>
            <span>{evt.category}</span>
          </div>
          <div className="text-white font-heading font-bold text-sm">{evt.mission_name}</div>
          <div className="text-slate-400 text-[11px]">{evt.venue} &bull; {evt.schedule_time}</div>
        </div>
      ))}
    </div>
  );
};
