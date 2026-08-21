import React from 'react';
import { Link } from 'react-router-dom';
import { store } from '../../services/store';
import { 
  Users, 
  DoorOpen, 
  Utensils, 
  Zap, 
  Award, 
  QrCode, 
  FileSpreadsheet, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import { 
  exportParticipantsExcel, 
  exportAttendanceExcel, 
  exportEventsReportExcel 
} from '../../services/exportService';

export const AdminDashboardPage: React.FC = () => {
  const participants = store.getParticipants();
  const attendance = store.getAttendance();
  const events = store.getEvents();

  const totalRegistered = participants.length;
  const gateCheckins = attendance.filter(a => a.checkin_type === 'ENTRY').length;
  const foodClaimed = participants.filter(p => p.food_collected).length;
  const missionCheckins = attendance.filter(a => a.checkin_type === 'EVENT').length;

  const attendanceRate = totalRegistered > 0 ? Math.round((gateCheckins / totalRegistered) * 100) : 0;

  return (
    <div className="space-y-8 font-mono text-xs">
      {/* Welcome & Quick Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-white font-sans">
            OPERATIONAL COMMAND DASHBOARD
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Real-time symposium participant telemetry, verification stations, and dynamic certificate generation.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <Link
            to="/admin/scanner"
            className="btn-temporal py-2 px-4 text-xs font-bold"
          >
            <QrCode className="w-4 h-4" />
            <span>LAUNCH QR SCANNER</span>
          </Link>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Registrations */}
        <div className="classified-card p-5 tech-bracket border-cyan-500/30 space-y-2 bg-[#070b14]/90">
          <div className="flex justify-between items-center text-slate-400 font-mono text-xs">
            <span>TOTAL AGENTS</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-heading font-black text-white font-sans">
            {totalRegistered}
          </div>
          <div className="text-[11px] font-mono text-cyan-400">
            Registered Temporal Agents
          </div>
        </div>

        {/* Card 2: Gate Check-ins */}
        <div className="classified-card p-5 tech-bracket border-emerald-500/30 space-y-2 bg-[#070b14]/90">
          <div className="flex justify-between items-center text-slate-400 font-mono text-xs">
            <span>GATE ENTRY</span>
            <DoorOpen className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-heading font-black text-emerald-400 font-sans">
            {gateCheckins}
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            {attendanceRate}% Physical Turnout Rate
          </div>
        </div>

        {/* Card 3: Food Distributed */}
        <div className="classified-card p-5 tech-bracket border-amber-500/30 space-y-2 bg-[#070b14]/90">
          <div className="flex justify-between items-center text-slate-400 font-mono text-xs">
            <span>FOOD TOKENS</span>
            <Utensils className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-heading font-black text-amber-400 font-sans">
            {foodClaimed}
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            Meals & Refreshments Redeemed
          </div>
        </div>

        {/* Card 4: Mission Verifications */}
        <div className="classified-card p-5 tech-bracket border-violet-500/30 space-y-2 bg-[#070b14]/90">
          <div className="flex justify-between items-center text-slate-400 font-mono text-xs">
            <span>MISSION CHECKS</span>
            <Zap className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-3xl font-heading font-black text-violet-400 font-sans">
            {missionCheckins}
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            Verified Event Attendances
          </div>
        </div>
      </div>

      {/* Quick Stations Launch Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-heading font-bold text-slate-300 font-mono uppercase tracking-wider">
          OPERATIONAL CHECKPOINT STATIONS
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/entry"
            className="p-5 rounded-xl bg-[#070b14] border border-slate-800 hover:border-cyan-400 hover:bg-cyan-950/20 transition-all flex items-center justify-between group"
          >
            <div className="space-y-1">
              <div className="font-heading font-bold text-white group-hover:text-cyan-300 flex items-center gap-2 font-sans">
                <DoorOpen className="w-4 h-4 text-cyan-400" />
                GATE ENTRY STATION
              </div>
              <div className="text-xs font-mono text-slate-400">
                Scan QR or enter ID to record campus arrival.
              </div>
            </div>
            <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
          </Link>

          <Link
            to="/admin/food"
            className="p-5 rounded-xl bg-[#070b14] border border-slate-800 hover:border-amber-400 hover:bg-amber-950/20 transition-all flex items-center justify-between group"
          >
            <div className="space-y-1">
              <div className="font-heading font-bold text-white group-hover:text-amber-300 flex items-center gap-2 font-sans">
                <Utensils className="w-4 h-4 text-amber-400" />
                FOOD DISTRIBUTION
              </div>
              <div className="text-xs font-mono text-slate-400">
                Redeem lunch token tracked on participant record.
              </div>
            </div>
            <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-amber-400 transition-colors" />
          </Link>

          <Link
            to="/admin/certificates"
            className="p-5 rounded-xl bg-[#070b14] border border-slate-800 hover:border-emerald-400 hover:bg-emerald-950/20 transition-all flex items-center justify-between group"
          >
            <div className="space-y-1">
              <div className="font-heading font-bold text-white group-hover:text-emerald-300 flex items-center gap-2 font-sans">
                <Award className="w-4 h-4 text-emerald-400" />
                PRIZES & CERTIFICATES
              </div>
              <div className="text-xs font-mono text-slate-400">
                Assign 1st/2nd/3rd prize & generate dynamic e-certs.
              </div>
            </div>
            <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
          </Link>
        </div>
      </div>

      {/* Two Columns: Recent Attendance Activity + Reports & Exports */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Check-in Feed */}
        <div className="lg:col-span-7 classified-card p-6 tech-bracket space-y-4 border-slate-800 bg-[#070b14]/90">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="font-heading font-bold text-white text-sm flex items-center gap-2 font-sans">
              <Clock className="w-4 h-4 text-cyan-400" />
              LIVE TELEMETRY STREAM
            </h3>
            <span className="font-mono text-[10px] text-emerald-400">REAL-TIME LOG</span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto font-mono text-xs">
            {attendance.length === 0 ? (
              <div className="text-slate-500 text-center py-6">No scan records recorded yet today.</div>
            ) : (
              attendance.slice(0, 8).map((record) => (
                <div
                  key={record.id}
                  className="p-3 rounded bg-slate-950/80 border border-slate-900 flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-white flex items-center gap-2 font-sans">
                      <span>{record.participant_name}</span>
                      <span className="text-cyan-400 font-mono text-[11px]">({record.agent_id})</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {record.checkin_type === 'ENTRY' ? 'Campus Gate Entry' : `Mission: ${record.event_name || 'Event'}`}
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-slate-400">
                    <div>{new Date(record.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <span className="text-emerald-400 font-bold">✓ VERIFIED</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Excel Export & Stats */}
        <div className="lg:col-span-5 classified-card p-6 tech-bracket space-y-4 border-slate-800 bg-[#070b14]/90">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="font-heading font-bold text-white text-sm flex items-center gap-2 font-sans">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              EXCEL DATA EXPORTS
            </h3>
            <span className="font-mono text-[10px] text-slate-400">OFFLINE DATA</span>
          </div>

          <p className="text-xs font-sans text-slate-300">
            Generate and export structured Excel (.xlsx) workbooks for official department filing.
          </p>

          <div className="space-y-2 font-mono text-xs">
            <button
              onClick={exportParticipantsExcel}
              className="w-full py-2 px-3 rounded bg-slate-900 border border-slate-700 text-slate-200 hover:border-emerald-400 hover:text-emerald-300 transition-colors flex items-center justify-between"
            >
              <span>Export Participants.xlsx</span>
              <span className="text-slate-500">{totalRegistered} records</span>
            </button>

            <button
              onClick={exportAttendanceExcel}
              className="w-full py-2 px-3 rounded bg-slate-900 border border-slate-700 text-slate-200 hover:border-emerald-400 hover:text-emerald-300 transition-colors flex items-center justify-between"
            >
              <span>Export Attendance.xlsx</span>
              <span className="text-slate-500">{attendance.length} records</span>
            </button>

            <button
              onClick={exportEventsReportExcel}
              className="w-full py-2 px-3 rounded bg-slate-900 border border-slate-700 text-slate-200 hover:border-emerald-400 hover:text-emerald-300 transition-colors flex items-center justify-between"
            >
              <span>Export Missions_Report.xlsx</span>
              <span className="text-slate-500">{events.length} events</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
