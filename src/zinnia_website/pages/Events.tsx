import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { store } from '../../services/store';

export const WebsiteEventsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'TECH' | 'NON_TECH'>('TECH');
  const allEvents = store.getEvents();

  const techEvents = allEvents.filter(e => e.event_type === 'TECH');
  const nonTechEvents = allEvents.filter(e => e.event_type === 'NON_TECH');

  const currentEvents = activeTab === 'TECH' ? techEvents : nonTechEvents;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-white">Events</h1>
        <p className="text-slate-400 text-sm">
          Technical and Non-Technical symposium competitions
        </p>
      </div>

      {/* Tabs (Only Technical and Non-Technical) */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('TECH')}
          className={`px-4 py-2 rounded text-xs font-semibold transition-colors ${
            activeTab === 'TECH'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          Technical Events ({techEvents.length})
        </button>
        <button
          onClick={() => setActiveTab('NON_TECH')}
          className={`px-4 py-2 rounded text-xs font-semibold transition-colors ${
            activeTab === 'NON_TECH'
              ? 'bg-fuchsia-700 text-white'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          Non-Technical Events ({nonTechEvents.length})
        </button>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <h2 className={`text-lg font-bold ${activeTab === 'TECH' ? 'text-indigo-400' : 'text-fuchsia-400'}`}>
            {activeTab === 'TECH' ? 'Technical Events' : 'Non-Technical Events'}
          </h2>
          <span className="text-xs text-slate-500">({currentEvents.length} Events)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentEvents.map((e) => (
            <div
              key={e.id}
              className="p-5 bg-slate-900 border border-slate-800 rounded-lg space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${
                    activeTab === 'TECH'
                      ? 'bg-indigo-950 text-indigo-300 border-indigo-500/30'
                      : 'bg-fuchsia-950 text-fuchsia-300 border-fuchsia-500/30'
                  }`}>
                    {e.code}
                  </span>
                  <span className="text-xs text-slate-400">
                    Team: {e.team_size_min}-{e.team_size_max}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">{e.mission_name}</h3>
                  <div className={`text-xs font-medium ${activeTab === 'TECH' ? 'text-indigo-400' : 'text-fuchsia-400'}`}>
                    {e.title}
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {e.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Venue: <strong className="text-slate-200">{e.venue}</strong></span>
                  <span>Time: <strong className="text-slate-200">{e.schedule_time}</strong></span>
                </div>

                <div className="pt-1">
                  <Link
                    to={`/register?mission=${e.id}`}
                    className={`inline-block w-full text-center py-2 text-white font-medium rounded text-xs transition-colors ${
                      activeTab === 'TECH'
                        ? 'bg-indigo-600 hover:bg-indigo-500'
                        : 'bg-fuchsia-700 hover:bg-fuchsia-600'
                    }`}
                  >
                    Register for {e.code}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
