import React, { useState, useEffect } from 'react';
import { store } from '../../services/store';
import { Team, TeamMember } from '@packages/types/src';
import { 
  Users, 
  Search, 
  Trash2, 
  Tag, 
  Edit3, 
  X, 
  Check, 
  RefreshCw, 
  ChevronDown, 
  ChevronRight,
  User,
  ShieldCheck,
  Utensils
} from 'lucide-react';
import { exportParticipantsExcel } from '../../services/exportService';

export const ParticipantsListPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [teams, setTeams] = useState<Team[]>(store.getTeams());
  const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({});
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [newBandValue, setNewBandValue] = useState('');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const update = () => {
      const allTeams = store.getTeams();
      setTeams(allTeams);
      // Auto-expand all teams initially
      const initialExp: Record<string, boolean> = {};
      allTeams.forEach(t => { initialExp[t.team_id] = true; });
      setExpandedTeams(initialExp);
    };
    update();
    const unsub = store.subscribe(update);
    store.syncFromSupabase();
    return unsub;
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await store.syncFromSupabase();
    setTeams(store.getTeams());
    setIsRefreshing(false);
  };

  const toggleExpand = (teamId: string) => {
    setExpandedTeams(prev => ({ ...prev, [teamId]: !prev[teamId] }));
  };

  const filteredTeams = teams.filter(t => {
    const q = searchTerm.toLowerCase();
    const matchesTeam = t.team_id.toLowerCase().includes(q) ||
                        t.team_name.toLowerCase().includes(q) ||
                        t.college.toLowerCase().includes(q);
    const matchesMember = t.members?.some(m => 
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      (m.band_id && m.band_id.toLowerCase().includes(q))
    );
    return matchesTeam || matchesMember;
  });

  const totalMembers = teams.reduce((acc, t) => acc + (t.members?.length || 0), 0);

  const handleDeleteTeam = (teamId: string, teamName: string) => {
    if (window.confirm(`Are you sure you want to remove team "${teamName}" (${teamId}) and all associated members?`)) {
      store.deleteParticipant(teamId);
      setTeams(store.getTeams());
    }
  };

  const handleOpenBandModal = (m: TeamMember) => {
    setEditingMember(m);
    setNewBandValue(m.band_id || '');
    setActionFeedback(null);
  };

  const handleSaveBand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    const trimmed = newBandValue.trim().toUpperCase();
    if (!trimmed) {
      const res = store.removeMemberBand(editingMember.id);
      setActionFeedback(res.message);
      setTeams(store.getTeams());
      setEditingMember(null);
      return;
    }

    const res = store.assignMemberBand(editingMember.id, trimmed);
    if (res.success) {
      setActionFeedback(`✓ ${res.message}`);
      setTeams(store.getTeams());
      setEditingMember(null);
    } else {
      setActionFeedback(`✗ ${res.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2 font-sans">
            <Users className="w-5 h-5 text-indigo-400" />
            Team & Participant Master Registry ({teams.length} Teams, {totalMembers} Attendees)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete database of enrolled teams, individual attendees, and wristband mappings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="px-3 py-2 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-indigo-300 font-bold text-xs rounded flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync Live DB</span>
          </button>

          <button
            onClick={exportParticipantsExcel}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded flex items-center gap-2 cursor-pointer transition-colors"
          >
            EXPORT EXCEL (.XLSX)
          </button>
        </div>
      </div>

      {actionFeedback && (
        <div className="p-3 bg-slate-900 border border-indigo-500/40 rounded text-xs text-indigo-300 font-mono flex items-center justify-between">
          <span>{actionFeedback}</span>
          <button onClick={() => setActionFeedback(null)} className="text-slate-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search by Team Name, Team ID, Attendee Name, Wristband ID (e.g. WB-1001), or College..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 text-white rounded text-xs focus:border-indigo-400 focus:outline-none"
        />
      </div>

      {/* Teams & Members Accordion List */}
      <div className="space-y-4">
        {filteredTeams.map((team) => {
          const isExpanded = expandedTeams[team.team_id] !== false;
          const membersList = team.members || [];

          return (
            <div key={team.team_id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg transition-all">
              {/* Team Header Row */}
              <div 
                onClick={() => toggleExpand(team.team_id)}
                className="p-4 bg-slate-950/80 hover:bg-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer border-b border-slate-800/80"
              >
                <div className="flex items-center gap-3">
                  <div className="text-indigo-400 p-1">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white font-sans">{team.team_name}</span>
                      <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-mono text-[10px] font-bold border border-indigo-500/40">
                        {team.team_id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-sans mt-0.5">
                      {team.college} &bull; {team.department} ({team.year} Year)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
                    <span>Members: <strong>{membersList.length}</strong></span>
                  </div>

                  <div className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
                    <span>Events: <strong>{team.registered_events.length}</strong></span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTeam(team.team_id, team.team_name);
                    }}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Remove Team"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Members Expanded Table */}
              {isExpanded && (
                <div className="p-4 bg-slate-900 overflow-x-auto">
                  <table className="w-full text-left text-xs font-sans">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                        <th className="pb-2 px-2">ROLE</th>
                        <th className="pb-2 px-2">ATTENDEE NAME</th>
                        <th className="pb-2 px-2">CONTACT</th>
                        <th className="pb-2 px-2">PHYSICAL WRISTBAND</th>
                        <th className="pb-2 px-2">MEAL TOKEN</th>
                        <th className="pb-2 px-2 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {membersList.map((member) => (
                        <tr key={member.id} className="hover:bg-slate-950/40">
                          <td className="py-2.5 px-2 font-mono">
                            {member.is_leader ? (
                              <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 text-[10px] font-bold">
                                LEADER
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[10px]">MEMBER</span>
                            )}
                          </td>
                          <td className="py-2.5 px-2">
                            <span className="font-bold text-white block">{member.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{member.id}</span>
                          </td>
                          <td className="py-2.5 px-2 font-mono text-slate-400">
                            <div>{member.email}</div>
                            <div className="text-[10px] text-slate-500">{member.phone}</div>
                          </td>
                          <td className="py-2.5 px-2 font-mono">
                            {member.band_id ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-bold text-[11px] inline-flex items-center gap-1">
                                <Tag className="w-3 h-3" />
                                {member.band_id}
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[11px] italic">UNASSIGNED</span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 font-mono font-bold">
                            {member.food_collected ? (
                              <span className="text-emerald-400 flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> CLAIMED
                              </span>
                            ) : (
                              <span className="text-amber-400">PENDING</span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleOpenBandModal(member)}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded text-[11px] font-mono inline-flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>{member.band_id ? 'Change' : 'Assign Band'}</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                      {membersList.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-3 text-center text-slate-500">
                            No member records found for this team.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}

        {filteredTeams.length === 0 && (
          <div className="p-8 bg-slate-900 border border-slate-800 rounded-xl text-center text-slate-500 text-xs font-mono">
            No registered teams or attendees matching current search query.
          </div>
        )}
      </div>

      {/* Edit Wristband Modal */}
      {editingMember && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-sm font-sans">
                  Wristband QR Mapping
                </h3>
              </div>
              <button
                onClick={() => setEditingMember(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <span className="text-xs text-slate-400 block font-mono">ATTENDEE:</span>
              <strong className="text-sm text-white font-sans">{editingMember.name}</strong>
              <span className="text-[11px] text-slate-500 font-mono block">{editingMember.id} &bull; {editingMember.email}</span>
            </div>

            <form onSubmit={handleSaveBand} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-300 font-bold mb-1 font-mono">
                  PHYSICAL WRISTBAND ID (BAND_ID)
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder="e.g. WB-1001, BAND-042..."
                  value={newBandValue}
                  onChange={(e) => setNewBandValue(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-white rounded text-xs focus:border-indigo-400 focus:outline-none uppercase font-mono font-bold"
                />
                <p className="text-[10px] text-slate-500 mt-1 font-mono">
                  Leave blank and click Save to unlink the current wristband.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold font-mono"
                >
                  Save Wristband
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
