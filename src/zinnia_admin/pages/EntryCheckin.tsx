import React, { useState, useEffect } from 'react';
import { store } from '../../services/store';
import { AttendanceRecord, Team, TeamMember } from '@packages/types/src';
import { extractScanToken } from '@packages/utils/src/qr';
import { CameraQRScannerModal } from '../components/CameraQRScannerModal';
import { 
  DoorOpen, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Tag, 
  QrCode, 
  UserCheck, 
  Search,
  Camera,
  Users,
  Link as LinkIcon,
  Shield,
  User
} from 'lucide-react';

export const EntryCheckinPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ISSUE_BAND' | 'QUICK_VERIFY'>('ISSUE_BAND');
  
  // Issue Band State
  const [ticketInput, setTicketInput] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [memberBandInputs, setMemberBandInputs] = useState<Record<string, string>>({});

  // Quick Verify State
  const [quickBandInput, setQuickBandInput] = useState('');

  // Camera Modal State
  const [cameraModal, setCameraModal] = useState<{
    isOpen: boolean;
    title: string;
    subtitle: string;
    target: 'TICKET' | 'MEMBER_BAND' | 'QUICK_BAND';
    targetMemberId?: string;
  }>({
    isOpen: false,
    title: '',
    subtitle: '',
    target: 'TICKET'
  });

  const [filterQuery, setFilterQuery] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);
  
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(
    store.getAttendance().filter(a => a.checkin_type === 'ENTRY')
  );
  const [teams, setTeams] = useState<Team[]>(store.getTeams());
  const [members, setMembers] = useState<TeamMember[]>(store.getTeamMembers());

  useEffect(() => {
    const update = () => {
      setAttendance(store.getAttendance().filter(a => a.checkin_type === 'ENTRY'));
      setTeams(store.getTeams());
      setMembers(store.getTeamMembers());
      if (selectedTeam) {
        const refreshed = store.getTeamById(selectedTeam.team_id);
        if (refreshed) setSelectedTeam(refreshed);
      }
    };
    update();
    const unsub = store.subscribe(update);
    store.syncFromSupabase();
    return unsub;
  }, []);

  const totalMembers = members.length;
  const checkedInCount = attendance.length;
  const bandsIssuedCount = members.filter(m => !!m.band_id).length;

  const handleLookupTicket = (customId?: string) => {
    setFeedback(null);
    const query = (customId || ticketInput).trim();
    if (!query) return;

    const res = store.lookupEntity(query);
    if (!res.team) {
      setFeedback({ 
        type: 'error', 
        message: `No team or participant matching Pass / ID "${query}" found in database.` 
      });
      setSelectedTeam(null);
      return;
    }

    setSelectedTeam(res.team);
    // Initialize band inputs from existing member bands
    const initialInputs: Record<string, string> = {};
    res.team.members?.forEach(m => {
      initialInputs[m.id] = m.band_id || '';
    });
    setMemberBandInputs(initialInputs);
  };

  const handleAssignBandAndCheckinMember = (member: TeamMember) => {
    setFeedback(null);
    const cleanBandId = (memberBandInputs[member.id] || '').trim().toUpperCase();
    if (!cleanBandId) {
      setFeedback({ type: 'error', message: `Please scan or enter the Physical Wristband QR for ${member.name}.` });
      return;
    }

    const res = store.recordEntryCheckin(
      member.id,
      'Gate Reception Desk',
      cleanBandId,
      member.id
    );

    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setAttendance(store.getAttendance().filter(a => a.checkin_type === 'ENTRY'));
    } else {
      setFeedback({ type: 'warning', message: res.message });
    }
  };

  const handleQuickBandVerify = (customBandId?: string) => {
    setFeedback(null);
    const bandId = (customBandId || quickBandInput).trim().toUpperCase();
    if (!bandId) return;

    const member = store.getMemberByBandId(bandId);
    if (!member) {
      setFeedback({
        type: 'error',
        message: `Unrecognized Wristband ID "${bandId}". Please assign this wristband at the reception station first.`
      });
      return;
    }

    const res = store.recordEntryCheckin(member.id, 'Quick Gate Scanner');
    if (res.success) {
      setFeedback({ type: 'success', message: `✓ ${res.message}` });
      setAttendance(store.getAttendance().filter(a => a.checkin_type === 'ENTRY'));
      setQuickBandInput('');
    } else {
      setFeedback({ type: 'warning', message: res.message });
    }
  };

  const handleCameraScanComplete = (decodedText: string) => {
    const cleanToken = extractScanToken(decodedText);
    if (cameraModal.target === 'TICKET') {
      setTicketInput(cleanToken);
      handleLookupTicket(cleanToken);
    } else if (cameraModal.target === 'MEMBER_BAND' && cameraModal.targetMemberId) {
      const memId = cameraModal.targetMemberId;
      setMemberBandInputs(prev => ({ ...prev, [memId]: cleanToken.toUpperCase() }));
      const targetMember = selectedTeam?.members?.find(m => m.id === memId);
      if (targetMember) {
        setTimeout(() => {
          store.assignMemberBand(memId, cleanToken.toUpperCase());
        }, 100);
      }
    } else if (cameraModal.target === 'QUICK_BAND') {
      setQuickBandInput(cleanToken.toUpperCase());
      handleQuickBandVerify(cleanToken);
    }
  };

  const filteredAttendance = attendance.filter(rec => {
    const q = filterQuery.toLowerCase();
    return (
      (rec.team_id && rec.team_id.toLowerCase().includes(q)) ||
      (rec.member_id && rec.member_id.toLowerCase().includes(q)) ||
      rec.participant_name.toLowerCase().includes(q) ||
      (rec.band_id && rec.band_id.toLowerCase().includes(q)) ||
      rec.college.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header & Stats Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2 font-sans">
            <DoorOpen className="w-5 h-5 text-indigo-400" />
            Gate Entry & Wristband Desk
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Pair physical wristband QRs to individual team members and grant campus admission.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-2 rounded bg-slate-900 border border-slate-700 text-xs">
            <span className="text-slate-400">WRISTBANDS ISSUED: </span>
            <strong className="text-indigo-400 font-bold">{bandsIssuedCount}</strong>
            <span className="text-slate-500"> / {totalMembers}</span>
          </div>

          <div className="px-3 py-2 rounded bg-slate-900 border border-slate-700 text-xs">
            <span className="text-slate-400">GATE ADMISSIONS: </span>
            <strong className="text-emerald-400 font-bold">{checkedInCount}</strong>
          </div>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => { setActiveTab('ISSUE_BAND'); setFeedback(null); }}
          className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'ISSUE_BAND'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>1. Initial Arrival: Scan Team Pass + Pair Member Wristbands</span>
        </button>

        <button
          onClick={() => { setActiveTab('QUICK_VERIFY'); setFeedback(null); }}
          className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'QUICK_VERIFY'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>2. Direct Re-Entry: Scan Member Wristband QR</span>
        </button>
      </div>

      {/* Mode 1: Initial Arrival & Multi-Member Wristband Pairing */}
      {activeTab === 'ISSUE_BAND' && (
        <div className="space-y-6">
          {/* Step 1: Scan Team Pass / ID */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-indigo-300 flex items-center gap-1.5 uppercase font-mono">
                <QrCode className="w-4 h-4 text-indigo-400" />
                <span>STEP 1: SCAN TEAM PASS / TEAM ID / MEMBER EMAIL</span>
              </label>
              <span className="text-[10px] bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/40">
                Target: Digital Pass
              </span>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  autoFocus
                  placeholder="Scan Pass QR (e.g. ZIN26-XXXXXX) or enter Team ID / Email..."
                  value={ticketInput}
                  onChange={(e) => setTicketInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleLookupTicket(); } }}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 text-white rounded-lg text-xs focus:border-indigo-400 focus:outline-none uppercase font-mono"
                />
              </div>
              <button
                type="button"
                onClick={() => setCameraModal({
                  isOpen: true,
                  title: 'Scan Team Pass QR',
                  subtitle: 'Point camera at team digital pass QR',
                  target: 'TICKET'
                })}
                className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Scan with Camera"
              >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">Camera</span>
              </button>
              <button
                type="button"
                onClick={() => handleLookupTicket()}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                VERIFY TEAM
              </button>
            </div>
          </div>

          {/* Feedback */}
          {feedback && (
            <div className={`p-4 rounded-xl border text-xs flex items-start gap-2.5 ${
              feedback.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300'
                : feedback.type === 'warning'
                ? 'bg-amber-950/90 border-amber-500/50 text-amber-300'
                : 'bg-rose-950/90 border-rose-500/50 text-rose-300'
            }`}>
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed font-mono">{feedback.message}</span>
            </div>
          )}

          {/* Step 2: Member Wristband Assignment Grid */}
          {selectedTeam && (
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-5 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-400" />
                    <h2 className="text-base font-bold text-white font-sans">{selectedTeam.team_name}</h2>
                    <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-mono text-[11px] font-bold border border-indigo-500/40">
                      {selectedTeam.team_id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{selectedTeam.college} &bull; {selectedTeam.department}</p>
                </div>
                <div className="text-xs font-mono">
                  <span className="text-slate-500 uppercase block text-[10px]">Team Fee Status</span>
                  <strong className={selectedTeam.payment ? 'text-emerald-400' : 'text-slate-400'}>
                    {selectedTeam.payment ? '✓ Verified' : 'Exempt / Free'}
                  </strong>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold text-emerald-300 uppercase font-mono flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-400" />
                  <span>STEP 2: PAIR INDIVIDUAL WRISTBANDS & CHECK IN MEMBERS</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedTeam.members?.map((member, idx) => {
                    const isCheckedIn = attendance.some(a => a.member_id === member.id || a.agent_id === member.id);
                    return (
                      <div key={member.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-indigo-400" />
                            <div>
                              <span className="text-xs font-bold text-white block">
                                {member.name} {member.is_leader && <span className="text-amber-400 text-[10px]">(Leader)</span>}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">{member.email}</span>
                            </div>
                          </div>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                            isCheckedIn
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                              : 'bg-slate-900 text-slate-400'
                          }`}>
                            {isCheckedIn ? '✓ IN GATE' : 'PENDING'}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Scan/Type Wristband ID (e.g. WB-1001)..."
                            value={memberBandInputs[member.id] || ''}
                            onChange={(e) => setMemberBandInputs({ ...memberBandInputs, [member.id]: e.target.value })}
                            className="flex-1 px-3 py-2 bg-slate-900 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs focus:border-emerald-400 focus:outline-none uppercase font-mono font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => setCameraModal({
                              isOpen: true,
                              title: `Scan Wristband for ${member.name}`,
                              subtitle: 'Point camera at physical wristband QR code',
                              target: 'MEMBER_BAND',
                              targetMemberId: member.id
                            })}
                            className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-lg text-xs font-bold cursor-pointer"
                            title="Scan with camera"
                          >
                            <Camera className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAssignBandAndCheckinMember(member)}
                            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold font-mono cursor-pointer transition-colors shadow"
                          >
                            ADMIT
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Quick Re-Entry */}
      {activeTab === 'QUICK_VERIFY' && (
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-emerald-300 flex items-center gap-1.5 uppercase font-mono">
                <Tag className="w-4 h-4 text-emerald-400" />
                <span>SCAN PHYSICAL WRISTBAND QR (BAND ID)</span>
              </label>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40">
                Direct Attendee Scan
              </span>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  autoFocus
                  placeholder="Scan Wristband QR (e.g. WB-1001)..."
                  value={quickBandInput}
                  onChange={(e) => setQuickBandInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleQuickBandVerify(); } }}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-emerald-500/50 text-emerald-300 rounded-lg text-xs focus:border-emerald-400 focus:outline-none uppercase font-mono font-bold"
                />
              </div>
              <button
                type="button"
                onClick={() => setCameraModal({
                  isOpen: true,
                  title: 'Scan Member Wristband QR',
                  subtitle: 'Point camera at physical wristband QR code',
                  target: 'QUICK_BAND'
                })}
                className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Scan with Camera"
              >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">Camera</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickBandVerify()}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg cursor-pointer transition-colors"
              >
                VERIFY ENTRY
              </button>
            </div>
          </div>

          {feedback && (
            <div className={`p-4 rounded-xl border text-xs flex items-start gap-2.5 ${
              feedback.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300'
                : feedback.type === 'warning'
                ? 'bg-amber-950/90 border-amber-500/50 text-amber-300'
                : 'bg-rose-950/90 border-rose-500/50 text-rose-300'
            }`}>
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed font-mono">{feedback.message}</span>
            </div>
          )}
        </div>
      )}

      {/* Recent Gate Arrivals Table */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <h3 className="font-bold text-white text-xs flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            Recent Gate Arrivals ({filteredAttendance.length})
          </h3>

          <div className="relative">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Filter arrivals by Band ID, Name, Team..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 text-white rounded text-xs focus:border-indigo-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60 font-mono">
                <th className="p-3">TEAM / MEMBER ID</th>
                <th className="p-3">WRISTBAND ID</th>
                <th className="p-3">ATTENDEE NAME</th>
                <th className="p-3">COLLEGE</th>
                <th className="p-3">CHECKIN TIME</th>
                <th className="p-3 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredAttendance.map((rec) => (
                <tr key={rec.id || `${rec.member_id || rec.team_id}-${rec.scanned_at}`} className="hover:bg-slate-950/40">
                  <td className="p-3 text-indigo-400 font-mono font-bold">{rec.member_id || rec.team_id}</td>
                  <td className="p-3">
                    {rec.band_id ? (
                      <span className="px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 font-mono font-bold text-[11px]">
                        🏷️ {rec.band_id}
                      </span>
                    ) : (
                      <span className="text-slate-500 font-mono text-[11px]">N/A</span>
                    )}
                  </td>
                  <td className="p-3 text-white font-medium">{rec.participant_name}</td>
                  <td className="p-3 text-slate-300">{rec.college}</td>
                  <td className="p-3 text-slate-400 font-mono">
                    {new Date(rec.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="p-3 text-right text-emerald-400 font-bold font-mono">✓ ADMITTED</td>
                </tr>
              ))}
              {filteredAttendance.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-500">
                    No gate check-in records matching current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Camera Modal */}
      <CameraQRScannerModal
        isOpen={cameraModal.isOpen}
        title={cameraModal.title}
        subtitle={cameraModal.subtitle}
        onScan={handleCameraScanComplete}
        onClose={() => setCameraModal({ ...cameraModal, isOpen: false })}
      />
    </div>
  );
};
