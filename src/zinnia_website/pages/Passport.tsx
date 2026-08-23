import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { store } from '../../services/store';
import { QRCodeSVG } from 'qrcode.react';
import { Team, TeamMember } from '@packages/types/src';
import { QrCode, UserCheck, Users, Tag, Utensils, Award, Sparkles } from 'lucide-react';
import { audioManager } from '../core/AudioManager';

export const WebsitePassportPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const idParam = searchParams.get('id');
  const [searchId, setSearchId] = useState(idParam || '');
  const [team, setTeam] = useState<Team | null>(null);
  const [selectedMemberIdx, setSelectedMemberIdx] = useState(0);

  useEffect(() => {
    let isCurrent = true;
    const fetchTeam = async () => {
      const q = searchId.trim();
      if (!q) {
        setTeam(null);
        return;
      }
      const res = store.lookupEntity(q);
      if (res.team) {
        if (isCurrent) setTeam(res.team);
      } else {
        await store.syncFromSupabase();
        const retryRes = store.lookupEntity(q);
        if (isCurrent) setTeam(retryRes.team || null);
      }
    };

    fetchTeam();
    const unsub = store.subscribe(fetchTeam);
    return () => {
      isCurrent = false;
      unsub();
    };
  }, [searchId]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    audioManager.playNodeEngage();
    const q = searchId.trim();
    if (q) {
      const res = store.lookupEntity(q);
      setTeam(res.team || null);
      setSelectedMemberIdx(0);
    } else {
      setTeam(null);
    }
  };

  const members = team?.members || [];
  const currentMember = members[selectedMemberIdx] || members[0];

  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto space-y-6 select-none">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-slate-950/80 border border-cyan-500/30 backdrop-blur-xl space-y-1 shadow-xl text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-[10px] font-mono uppercase tracking-widest">
          <QrCode className="w-3.5 h-3.5" />
          <span>DIGITAL CREDENTIAL // ZINNIA '26</span>
        </div>
        <h1 className="text-2xl font-black text-white font-mono">SYMPOSIUM ACCESS PASS</h1>
        <p className="text-xs text-slate-400 font-light">
          Official GCE Erode team credential and individual member gate pass.
        </p>
      </div>

      {/* Pass Search Input */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          placeholder="Enter Team ID (e.g. ZIN26-XXXXXX) or Member Email..."
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          className="flex-1 px-4 py-3 bg-slate-950/80 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-cyan-400 backdrop-blur-md transition-colors"
        />
        <button
          type="submit"
          className="px-5 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-black text-xs rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
        >
          LOOKUP
        </button>
      </form>

      {!searchId.trim() ? (
        <div className="p-8 bg-slate-950/70 border border-slate-800 rounded-2xl text-center text-slate-400 text-xs font-mono backdrop-blur-md space-y-2">
          <QrCode className="w-8 h-8 text-cyan-400/60 mx-auto" />
          <p>Enter your Team ID (e.g. ZIN26-XXXXXX) or registered member email above to access digital passes.</p>
        </div>
      ) : !team ? (
        <div className="p-8 bg-slate-950/70 border border-rose-500/40 rounded-2xl text-center text-rose-300 text-xs font-mono backdrop-blur-md">
          No team or participant record found matching "{searchId}".
        </div>
      ) : (
        <div className="p-8 rounded-3xl bg-slate-950/90 border border-cyan-500/40 backdrop-blur-2xl space-y-6 shadow-2xl">
          {/* Team Overview Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <h2 className="text-xl font-black text-white font-mono">{team.team_name}</h2>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{team.college}</p>
              <p className="text-[11px] text-slate-500 font-mono">{team.department} &bull; Year {team.year}</p>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 font-mono text-xs font-bold text-center sm:text-right">
              <span className="block text-[9px] text-cyan-500 uppercase">TEAM ID</span>
              <span>{team.team_id}</span>
            </div>
          </div>

          {/* Member Tabs for Multi-member teams */}
          {members.length > 1 && (
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Select Team Member Pass:</span>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {members.map((m, idx) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      audioManager.playNodeEngage();
                      setSelectedMemberIdx(idx);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap cursor-pointer transition-all ${
                      selectedMemberIdx === idx
                        ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {m.name} {m.is_leader && '(Leader)'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Individual Member Digital Pass */}
          {currentMember && (
            <div className="space-y-6">
              {/* Member QR Code Container */}
              <div className="flex flex-col items-center p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
                <div className="bg-white p-3.5 rounded-2xl shadow-2xl">
                  <QRCodeSVG value={currentMember.id} size={160} />
                </div>
                <div className="text-center">
                  <span className="text-base font-bold text-white block font-mono">
                    {currentMember.name} {currentMember.is_leader && <span className="text-amber-400 text-xs">(Team Leader)</span>}
                  </span>
                  <span className="text-xs text-cyan-400 font-mono tracking-wider font-bold">
                    PASS ID: {currentMember.id}
                  </span>
                </div>
              </div>

              {/* Status Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono text-slate-300">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">PHYSICAL WRISTBAND</div>
                  <div className={`font-bold ${currentMember.band_id ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {currentMember.band_id ? `🏷️ ${currentMember.band_id}` : 'Pending Gate'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">FOOD TOKEN</div>
                  <div className={`font-bold ${currentMember.food_collected ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {currentMember.food_collected ? '✓ Claimed' : 'Available'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 sm:col-span-1 col-span-2">
                  <div className="text-[10px] text-slate-500 uppercase">FEE STATUS</div>
                  <div className={`font-bold ${team.payment ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {team.payment ? 'Verified' : 'Exempt / Free'}
                  </div>
                </div>
              </div>

              {/* Registered Events */}
              <div>
                <span className="text-[10px] text-slate-400 font-mono uppercase block mb-1.5">
                  Team Registered Tracks ({team.registered_events.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {team.registered_events.map(evId => {
                    const ev = store.getEventById(evId);
                    return (
                      <span key={evId} className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-[11px] font-mono">
                        {ev?.code ? `[${ev.code}] ` : ''}{ev?.mission_name || evId}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WebsitePassportPage;
