import React, { useState, useEffect } from 'react';
import { store } from '../../services/store';
import { 
  Users, 
  DoorOpen, 
  Utensils, 
  Zap, 
  Award, 
  CheckCircle2, 
  Clock, 
  TrendingUp 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboardPage: React.FC = () => {
  const [participants, setParticipants] = useState(store.getParticipants());
  const [attendance, setAttendance] = useState(store.getAttendance());
  const [events, setEvents] = useState(store.getEvents());

  useEffect(() => {
    const updateAll = () => {
      setParticipants(store.getParticipants());
      setAttendance(store.getAttendance());
      setEvents(store.getEvents());
    };
    updateAll();
    const unsub = store.subscribe(updateAll);
    store.syncFromSupabase();
    return unsub;
  }, []);

  const totalRegistered = participants.length;
  const gateEntries = attendance.filter(a => a.checkin_type === 'ENTRY').length;
  const foodClaimed = participants.filter(p => p.food_collected).length;
  const eventCheckins = attendance.filter(a => a.checkin_type === 'EVENT').length;

  const techEvents = events.filter(e => e.event_type === 'TECH');
  const nonTechEvents = events.filter(e => e.event_type === 'NON_TECH');

  const stats = [
    { title: 'Total Registered', count: totalRegistered, icon: Users, color: 'text-indigo-400', link: '/admin/participants' },
    { title: 'Gate Turnout', count: `${gateEntries} / ${totalRegistered}`, icon: DoorOpen, color: 'text-emerald-400', link: '/admin/entry' },
    { title: 'Food Distributed', count: `${foodClaimed} / ${totalRegistered}`, icon: Utensils, color: 'text-amber-400', link: '/admin/food' },
    { title: 'Event Check-ins', count: eventCheckins, icon: Zap, color: 'text-fuchsia-400', link: '/admin/events' }
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-white font-sans">Symposium Command Dashboard</h1>
          <p className="text-xs text-slate-400 mt-0.5">Live metrics and operations for ZINNIA 2026</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Link
              key={i}
              to={stat.link}
              className="p-5 bg-slate-900 border border-slate-800 rounded-lg flex justify-between items-start hover:border-indigo-500 transition-colors"
            >
              <div>
                <div className="text-slate-400 text-xs">{stat.title}</div>
                <div className="text-2xl font-bold text-white mt-1">{stat.count}</div>
              </div>
              <Icon className={`w-5 h-5 ${stat.color}`} />
            </Link>
          );
        })}
      </div>

      {/* Events Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Technical Events */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-lg space-y-3">
          <h3 className="font-bold text-white text-sm font-sans flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            Technical Events ({techEvents.length})
          </h3>
          <div className="space-y-2 text-xs">
            {techEvents.map(e => (
              <div key={e.id} className="p-3 bg-slate-950 rounded flex justify-between items-center">
                <div>
                  <span className="font-bold text-indigo-400">{e.code}: </span>
                  <span className="text-white">{e.mission_name}</span>
                </div>
                <span className="text-slate-400">{e.venue}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Non-Technical Events */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-lg space-y-3">
          <h3 className="font-bold text-white text-sm font-sans flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-fuchsia-400" />
            Non-Technical Events ({nonTechEvents.length})
          </h3>
          <div className="space-y-2 text-xs">
            {nonTechEvents.map(e => (
              <div key={e.id} className="p-3 bg-slate-950 rounded flex justify-between items-center">
                <div>
                  <span className="font-bold text-fuchsia-400">{e.code}: </span>
                  <span className="text-white">{e.mission_name}</span>
                </div>
                <span className="text-slate-400">{e.venue}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
