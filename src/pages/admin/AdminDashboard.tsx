import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { store } from '../../services/store';
import { StatCard } from '../../components/admin/StatCard';
import { 
  Users, 
  CheckCircle2, 
  UserCheck, 
  UserX, 
  XCircle, 
  Zap, 
  QrCode, 
  History,
  FileSpreadsheet, 
  Building2,
  TrendingUp
} from 'lucide-react';
import { 
  exportParticipantsExcel, 
  exportAttendanceExcel, 
  exportEventsReportExcel 
} from '../../services/exportService';

export const AdminDashboardPage: React.FC = () => {
  const [statsData, setStatsData] = useState<{
    total: number;
    confirmed: number;
    checkedIn: number;
    notCheckedIn: number;
    cancelled: number;
    eventWise: Record<string, number>;
  }>({
    total: 0,
    confirmed: 0,
    checkedIn: 0,
    notCheckedIn: 0,
    cancelled: 0,
    eventWise: {}
  });

  const refreshStats = () => {
    const participants = store.getParticipants();
    const attendance = store.getAttendance();

    const total = participants.length;
    const confirmed = participants.filter(p => ((p as any).registration_status || 'CONFIRMED').toUpperCase() !== 'CANCELLED').length;
    const cancelled = participants.filter(p => ((p as any).registration_status || '').toUpperCase() === 'CANCELLED').length;

    const checkedInSet = new Set(attendance.map(a => a.member_id));
    const checkedIn = participants.filter(p => (p as any).checked_in || checkedInSet.has(p.id) || checkedInSet.has(p.agent_id)).length;
    const notCheckedIn = Math.max(0, total - checkedIn);

    // Event-wise participant counts
    const eventCounts: Record<string, number> = {};
    participants.forEach(p => {
      if (p.registered_events && p.registered_events.length > 0) {
        p.registered_events.forEach((ev: string) => {
          eventCounts[ev] = (eventCounts[ev] || 0) + 1;
        });
      } else {
        eventCounts['General Symposium Pass'] = (eventCounts['General Symposium Pass'] || 0) + 1;
      }
    });

    setStatsData({
      total,
      confirmed,
      checkedIn,
      notCheckedIn,
      cancelled,
      eventWise: eventCounts
    });

    // Fetch live stats from Flask backend if available
    fetch('/api/admin/stats')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.success && data.total_registered > 0) {
          setStatsData(prev => ({
            ...prev,
            total: data.total_registered ?? prev.total,
            confirmed: data.confirmed_participants ?? prev.confirmed,
            checkedIn: data.checked_in_participants ?? prev.checkedIn,
            notCheckedIn: data.not_checked_in_participants ?? prev.notCheckedIn,
            cancelled: data.cancelled_registrations ?? prev.cancelled,
            eventWise: (data.event_wise_counts && Object.keys(data.event_wise_counts).length > 0) ? data.event_wise_counts : prev.eventWise
          }));
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    store.syncFromSupabase().then(() => refreshStats());
    refreshStats();

    const unsubscribe = store.subscribe(() => {
      refreshStats();
    });
    return () => unsubscribe();
  }, []);

  const turnOutRate = statsData.total > 0 ? Math.round((statsData.checkedIn / statsData.total) * 100) : 0;

  return (
    <div className="space-y-8 font-mono text-xs max-w-7xl mx-auto">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-white font-sans tracking-tight">
            ADMIN DASHBOARD & TELEMETRY
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Real-time participant counts, check-in turnout status, and event track breakdown.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/scan"
            className="px-4 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-sans font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)]"
          >
            <QrCode className="w-4 h-4" />
            <span>LAUNCH QR SCANNER</span>
          </Link>

          <button
            onClick={exportParticipantsExcel}
            className="px-3 py-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>EXPORT EXCEL</span>
          </button>
        </div>
      </div>

      {/* 5 Primary Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="TOTAL REGISTERED"
          value={statsData.total}
          description="Total Registered Participants"
          icon={Users}
          color="cyan"
          trend="100% Total"
        />

        <StatCard
          title="CONFIRMED"
          value={statsData.confirmed}
          description="Active Registrations"
          icon={CheckCircle2}
          color="emerald"
        />

        <StatCard
          title="CHECKED-IN"
          value={statsData.checkedIn}
          description="Physical Turnout"
          icon={UserCheck}
          color="blue"
          trend={`${turnOutRate}% Turnout`}
        />

        <StatCard
          title="NOT CHECKED-IN"
          value={statsData.notCheckedIn}
          description="Awaiting Gate Entry"
          icon={UserX}
          color="amber"
        />

        <StatCard
          title="CANCELLED"
          value={statsData.cancelled}
          description="Voided Registrations"
          icon={XCircle}
          color="rose"
        />
      </div>

      {/* Event/Game-Wise Participant Counts Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event Breakdown List */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-[#070c1b]/90 p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 font-heading font-black text-white text-base font-sans">
              <Zap className="w-5 h-5 text-cyan-400 fill-cyan-400" />
              <span>EVENT / GAME-WISE PARTICIPANT COUNTS</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
              {Object.keys(statsData.eventWise).length} TRACKS
            </span>
          </div>

          <div className="space-y-3 font-sans">
            {Object.keys(statsData.eventWise).length === 0 ? (
              <div className="text-center py-6 text-slate-500 font-mono">
                No event track counts recorded yet.
              </div>
            ) : (
              Object.entries(statsData.eventWise).map(([eventName, count]) => {
                const percentage = statsData.total > 0 ? Math.round((count / statsData.total) * 100) : 0;
                return (
                  <div key={eventName} className="p-3 rounded-lg bg-[#040711] border border-slate-800/80 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-white tracking-wide">{eventName}</span>
                      <div className="font-mono text-xs">
                        <span className="text-cyan-400 font-bold">{count}</span>
                        <span className="text-slate-500 ml-1">({percentage}%)</span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(5, percentage))}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Navigation Panel */}
        <div className="rounded-xl border border-slate-800 bg-[#070c1b]/90 p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 font-heading font-black text-white text-base font-sans border-b border-slate-800 pb-3">
            <Building2 className="w-5 h-5 text-cyan-400" />
            <span>ADMIN QUICK ACTIONS</span>
          </div>

          <div className="space-y-2.5 font-mono text-xs">
            <Link
              to="/admin/participants"
              className="p-3 rounded-lg bg-[#040711] border border-slate-800 hover:border-cyan-500/50 flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-slate-200 group-hover:text-cyan-300">MANAGE PARTICIPANTS</span>
              </div>
              <span className="text-slate-500 group-hover:text-white font-bold">→</span>
            </Link>

            <Link
              to="/admin/scan"
              className="p-3 rounded-lg bg-[#040711] border border-slate-800 hover:border-emerald-500/50 flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-2.5">
                <QrCode className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-slate-200 group-hover:text-emerald-300">OPEN QR SCANNER</span>
              </div>
              <span className="text-slate-500 group-hover:text-white font-bold">→</span>
            </Link>

            <Link
              to="/admin/check-ins"
              className="p-3 rounded-lg bg-[#040711] border border-slate-800 hover:border-amber-500/50 flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-2.5">
                <History className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-slate-200 group-hover:text-amber-300">CHECK-IN HISTORY</span>
              </div>
              <span className="text-slate-500 group-hover:text-white font-bold">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
