import React from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Users, 
  Clock, 
  Utensils, 
  Zap, 
  ShieldCheck 
} from 'lucide-react';
import { 
  exportParticipantsExcel, 
  exportAttendanceExcel, 
  exportFoodExcel, 
  exportEventsReportExcel 
} from '../../services/exportService';
import { store } from '../../services/store';

export const ReportsExportPage: React.FC = () => {
  const participants = store.getParticipants();
  const attendance = store.getAttendance();
  const foodRecords = store.getFoodRecords();
  const events = store.getEvents();

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
            EXCEL DATA & SYMPOSIUM REPORTING
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Generate clean, multi-column Excel (.xlsx) workbooks for CSE Department documentation.
          </p>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Report 1: Participants */}
        <div className="glass-panel p-6 tech-bracket border-cyan-500/30 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 font-bold border border-cyan-500/30">
                PARTICIPANTS MASTER
              </span>
              <span className="text-slate-400">{participants.length} Records</span>
            </div>
            <h3 className="text-lg font-heading font-bold text-white">
              Export Participants.xlsx
            </h3>
            <p className="text-xs font-sans text-slate-300 leading-relaxed">
              Complete list of all registered temporal agents including Agent IDs, student names, phone numbers, verified emails, institutions, branches, and registered missions.
            </p>
          </div>

          <button
            onClick={exportParticipantsExcel}
            className="w-full py-2.5 rounded bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-heading font-bold text-xs hover:bg-cyan-500 hover:text-black transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>DOWNLOAD PARTICIPANTS (.XLSX)</span>
          </button>
        </div>

        {/* Report 2: Attendance */}
        <div className="glass-panel p-6 tech-bracket border-emerald-500/30 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold border border-emerald-500/30">
                ATTENDANCE LOGS
              </span>
              <span className="text-slate-400">{attendance.length} Scans</span>
            </div>
            <h3 className="text-lg font-heading font-bold text-white">
              Export Attendance.xlsx
            </h3>
            <p className="text-xs font-sans text-slate-300 leading-relaxed">
              Timestamps and verification logs for Main Gate arrivals and specific event mission rooms with scanner terminal coordinates.
            </p>
          </div>

          <button
            onClick={exportAttendanceExcel}
            className="w-full py-2.5 rounded bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-heading font-bold text-xs hover:bg-emerald-500 hover:text-black transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>DOWNLOAD ATTENDANCE (.XLSX)</span>
          </button>
        </div>

        {/* Report 3: Food Distribution */}
        <div className="glass-panel p-6 tech-bracket border-amber-500/30 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 font-bold border border-amber-500/30">
                CATERING & MEALS
              </span>
              <span className="text-slate-400">{foodRecords.length} Tokens</span>
            </div>
            <h3 className="text-lg font-heading font-bold text-white">
              Export Food_Distribution.xlsx
            </h3>
            <p className="text-xs font-sans text-slate-300 leading-relaxed">
              Meal distribution logs, lunch token claim times, counter stations, and total catering count for the symposium committee.
            </p>
          </div>

          <button
            onClick={exportFoodExcel}
            className="w-full py-2.5 rounded bg-amber-500/20 border border-amber-400 text-amber-300 font-heading font-bold text-xs hover:bg-amber-500 hover:text-black transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>DOWNLOAD FOOD REPORT (.XLSX)</span>
          </button>
        </div>

        {/* Report 4: Missions Overview */}
        <div className="glass-panel p-6 tech-bracket border-violet-500/30 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="px-2 py-0.5 rounded bg-violet-950 text-violet-400 font-bold border border-violet-500/30">
                EVENT ANALYTICS
              </span>
              <span className="text-slate-400">{events.length} Operations</span>
            </div>
            <h3 className="text-lg font-heading font-bold text-white">
              Export Missions_Report.xlsx
            </h3>
            <p className="text-xs font-sans text-slate-300 leading-relaxed">
              Consolidated breakdown per mission: registered headcount, checked-in turnout, schedules, venues, and clearance parameters.
            </p>
          </div>

          <button
            onClick={exportEventsReportExcel}
            className="w-full py-2.5 rounded bg-violet-500/20 border border-violet-400 text-violet-300 font-heading font-bold text-xs hover:bg-violet-500 hover:text-black transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>DOWNLOAD MISSIONS REPORT (.XLSX)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
