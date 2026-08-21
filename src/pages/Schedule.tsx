import React from 'react';
import { store } from '../services/store';

export const SchedulePage: React.FC = () => {
  const events = store.getEvents();

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-white">Schedule</h1>
        <p className="text-slate-400 text-sm">Event timetable for 17 September 2026</p>
      </div>

      <div className="space-y-3">
        {events.map((e) => (
          <div key={e.id} className="p-4 bg-slate-900 border border-slate-800 rounded-lg flex justify-between items-center">
            <div>
              <div className="font-bold text-white text-sm">{e.mission_name}</div>
              <div className="text-xs text-slate-400">{e.venue} &bull; {e.event_type}</div>
            </div>
            <div className="text-sm font-mono text-indigo-400 font-semibold">{e.schedule_time}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SchedulePage;
