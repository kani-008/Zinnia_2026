import React from 'react';
import { 
  FileSpreadsheet, 
  Download 
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
  const events = store.getEvents();
  const foodClaimed = participants.filter(p => p.food_collected).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-bold text-white flex items-center gap-2 font-sans">
          <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
          Excel Reports & Department Data Export
        </h1>
        <p className="text-xs text-slate-400 mt-1">Export official symposium documentation spreadsheets.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-lg space-y-3 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white text-sm font-sans">Participants Master (.xlsx)</h3>
            <p className="text-slate-400 text-xs mt-1">Total {participants.length} registered participant records.</p>
          </div>
          <button
            onClick={exportParticipantsExcel}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded flex items-center justify-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT PARTICIPANTS</span>
          </button>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-lg space-y-3 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white text-sm font-sans">Attendance Logs (.xlsx)</h3>
            <p className="text-slate-400 text-xs mt-1">Gate arrival and event check-in timestamps ({attendance.length} scans).</p>
          </div>
          <button
            onClick={exportAttendanceExcel}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded flex items-center justify-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT ATTENDANCE</span>
          </button>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-lg space-y-3 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white text-sm font-sans">Food Distribution (.xlsx)</h3>
            <p className="text-slate-400 text-xs mt-1">Lunch tokens claimed: {foodClaimed} / {participants.length}.</p>
          </div>
          <button
            onClick={exportFoodExcel}
            className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded flex items-center justify-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT FOOD LOGS</span>
          </button>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-lg space-y-3 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white text-sm font-sans">Events Analytics (.xlsx)</h3>
            <p className="text-slate-400 text-xs mt-1">Summary breakdown across {events.length} competitions.</p>
          </div>
          <button
            onClick={exportEventsReportExcel}
            className="w-full py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-xs rounded flex items-center justify-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT EVENTS REPORT</span>
          </button>
        </div>
      </div>
    </div>
  );
};
