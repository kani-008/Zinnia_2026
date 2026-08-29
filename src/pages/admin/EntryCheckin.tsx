import React, { useState, useEffect } from 'react';
import { store } from '../../services/store';
import { AttendanceRecord, Team, TeamMember } from '@/types';
import { CameraQRScannerModal } from '../../components/CameraQRScannerModal';
import { 
  DoorOpen, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  QrCode, 
  UserCheck, 
  Search,
  Camera,
  Users,
  Shield,
  User,
  Zap,
  RotateCcw
} from 'lucide-react';

export const EntryCheckinPage: React.FC = () => {
  const [tokenInput, setTokenInput] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
    member?: TeamMember;
    team?: Team;
    time?: string;
  } | null>(null);

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(
    store.getAttendance().filter(a => a.checkin_type === 'ENTRY')
  );
  const [teams, setTeams] = useState<Team[]>(store.getTeams());
  const [members, setMembers] = useState<TeamMember[]>(store.getTeamMembers());
  const [filterQuery, setFilterQuery] = useState('');

  useEffect(() => {
    const update = () => {
      setAttendance(store.getAttendance().filter(a => a.checkin_type === 'ENTRY'));
      setTeams(store.getTeams());
      setMembers(store.getTeamMembers());
    };
    update();
    const unsub = store.subscribe(update);
    store.syncFromSupabase();
    return unsub;
  }, []);

  const totalMembers = members.length;
  const checkedInCount = attendance.length;

  const handleEntryCheckin = async (customToken?: string) => {
    const raw = (customToken || tokenInput).trim();
    if (!raw) return;

    setIsProcessing(true);
    setFeedback(null);

    const res = await store.checkinEntryApi({
      passport_token: raw,
      id: raw,
      scanned_by: 'Main Campus Gate Coordinator',
      location: 'Gate 1'
    });

    setIsProcessing(false);
    setTokenInput('');

    if (res.success) {
      setFeedback({
        type: 'success',
        message: res.reason,
        member: res.member,
        team: res.team,
        time: new Date().toLocaleTimeString()
      });
    } else {
      setFeedback({
        type: 'error',
        message: res.reason,
        member: res.member,
        team: res.team,
        time: new Date().toLocaleTimeString()
      });
    }
  };

  const filteredAttendance = attendance.filter(a => {
    const q = filterQuery.toLowerCase();
    return a.participant_name.toLowerCase().includes(q) ||
           a.college.toLowerCase().includes(q) ||
           (a.member_id && a.member_id.toLowerCase().includes(q));
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2 font-sans">
            <DoorOpen className="w-5 h-5 text-cyan-400" />
            Campus Gate Entry Scanner
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Scan attendee Digital Passport QR (or enter Member ID) for one-time admission.
          </p>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono">
            <span className="text-slate-400">GATE ADMISSIONS: </span>
            <strong className="text-cyan-400 font-bold">{checkedInCount}</strong>
            <span className="text-slate-500"> / {totalMembers}</span>
          </div>
          <button
            onClick={() => store.syncFromSupabase()}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:text-white text-slate-400 cursor-pointer"
            title="Sync Database"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Scanner Box */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-xl">
        <form onSubmit={(e) => { e.preventDefault(); handleEntryCheckin(); }} className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-cyan-300 flex items-center gap-1.5 uppercase font-mono">
              <QrCode className="w-4 h-4 text-cyan-400" />
              <span>SCAN PASSPORT QR TOKEN OR ENTER MEMBER ID</span>
            </label>
            <span className="text-[10px] bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/30 font-mono">
              1-Time Gate Lock
            </span>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                autoFocus
                disabled={isProcessing}
                placeholder="Scan QR token hex code or type Member ID (e.g. ZIN26-XXXXXX-M1)..."
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="w-full pl-3 pr-3 py-3 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs focus:border-cyan-400 focus:outline-none font-mono font-bold"
              />
            </div>
            
            <button
              type="button"
              onClick={() => setIsCameraOpen(true)}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors border border-slate-700"
              title="Scan with Web Camera"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Camera</span>
            </button>

            <button 
              type="submit" 
              disabled={isProcessing || !tokenInput.trim()}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-bold text-xs rounded-xl cursor-pointer transition-all shadow-md font-mono"
            >
              {isProcessing ? 'VALIDATING...' : 'ADMIT PASS'}
            </button>
          </div>
        </form>

        {/* Big PASS / FAIL Status Result Banner */}
        {feedback && (
          <div className="pt-2 animate-fadeIn">
            {feedback.type === 'success' ? (
              <div className="p-5 bg-emerald-950/80 border-2 border-emerald-500 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 font-black font-mono text-base">
                    <CheckCircle2 className="w-6 h-6" />
                    <span>✓ PASS — GATE ADMISSION GRANTED</span>
                  </div>
                  <span className="text-xs font-mono text-emerald-300">{feedback.time}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-mono border-t border-emerald-800/50">
                  <div>
                    <span className="text-slate-400 block text-[10px]">PARTICIPANT NAME</span>
                    <strong className="text-white text-sm">{feedback.member?.name || 'Attendee'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">TEAM & COLLEGE</span>
                    <strong className="text-emerald-200">{feedback.team?.team_name || 'Team'} &bull; {feedback.team?.college}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">MEMBER ID</span>
                    <strong className="text-cyan-300">{feedback.member?.id}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">REASON</span>
                    <span className="text-slate-300">{feedback.message}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 bg-rose-950/90 border-2 border-rose-500 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-400 font-black font-mono text-base">
                    <AlertTriangle className="w-6 h-6" />
                    <span>✗ FAIL — GATE ENTRY REJECTED</span>
                  </div>
                  <span className="text-xs font-mono text-rose-300">{feedback.time}</span>
                </div>
                <p className="text-rose-200 text-xs font-mono font-bold">
                  {feedback.message}
                </p>
                {feedback.member && (
                  <div className="text-[11px] font-mono text-slate-400 pt-1">
                    Participant: <strong className="text-white">{feedback.member.name}</strong> ({feedback.member.id})
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Live Recent Admissions Table */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-cyan-400" />
            Recent Gate Check-ins ({filteredAttendance.length})
          </h2>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search checked-in attendee..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2">TIME</th>
                <th className="pb-2">PARTICIPANT</th>
                <th className="pb-2">COLLEGE</th>
                <th className="pb-2">LOCATION</th>
                <th className="pb-2">SCANNED BY</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500 font-mono">
                    No gate entries recorded yet.
                  </td>
                </tr>
              ) : (
                filteredAttendance.map((a, idx) => (
                  <tr key={a.id || idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 text-slate-400">
                      {new Date(a.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 font-bold text-white">
                      {a.participant_name}
                      <span className="block text-[10px] text-slate-500 font-normal">{a.member_id}</span>
                    </td>
                    <td className="py-2.5 text-slate-300">{a.college}</td>
                    <td className="py-2.5 text-slate-400">{a.location || 'Main Gate'}</td>
                    <td className="py-2.5 text-cyan-400">{a.scanned_by}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Camera QR Modal */}
      <CameraQRScannerModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onScanSuccess={(scannedToken) => {
          setIsCameraOpen(false);
          handleEntryCheckin(scannedToken);
        }}
        title="Scan Participant Passport QR"
        subtitle="Hold the attendee's digital passport QR within camera view"
      />
    </div>
  );
};

export default EntryCheckinPage;
