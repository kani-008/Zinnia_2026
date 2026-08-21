import React from 'react';
import { Participant } from '@packages/types/src';

export interface EventRegistrationsProps {
  participants: Participant[];
  eventId: string;
}

export const EventRegistrations: React.FC<EventRegistrationsProps> = ({
  participants,
  eventId
}) => {
  const registered = participants.filter(p => p.registered_events.includes(eventId));

  return (
    <div className="font-mono text-xs space-y-2">
      <div className="text-slate-400">Total Enrolled: {registered.length}</div>
      <div className="space-y-1">
        {registered.map(p => (
          <div key={p.id} className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between">
            <span className="text-white font-sans">{p.name}</span>
            <span className="text-cyan-400 font-bold">{p.agent_id}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
