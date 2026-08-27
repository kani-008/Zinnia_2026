import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { store } from '../services/store';
import { QRCodeSVG } from 'qrcode.react';
import { Team, TeamMember } from '@packages/types/src';
import { 
  QrCode, 
  Users, 
  Share2, 
  Send, 
  Download, 
  CheckCircle2, 
  Sparkles, 
  Shield, 
  Zap, 
  Utensils, 
  ExternalLink,
  PhoneCall,
  Copy,
  Check
} from 'lucide-react';
import { audioManager } from '../core/AudioManager';

export const WebsitePassportPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const params = useParams();
  const tokenParam = searchParams.get('token') || searchParams.get('t') || params.passport_token;
  const idParam = searchParams.get('id') || searchParams.get('team_id');
  
  const initialQuery = tokenParam || idParam || '';
  const [searchId, setSearchId] = useState(initialQuery);
  const [team, setTeam] = useState<Team | null>(null);
  const [activeMember, setActiveMember] = useState<TeamMember | null>(null);
  const [selectedMemberIdx, setSelectedMemberIdx] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<Record<string, 'IDLE' | 'SENDING' | 'SENT'>>({});

  useEffect(() => {
    let isCurrent = true;
    const fetchEntity = async () => {
      const q = searchId.trim();
      if (!q) {
        setTeam(null);
        setActiveMember(null);
        return;
      }
      
      let res = store.lookupEntity(q);
      if (!res.team && !res.member) {
        await store.syncFromSupabase();
        res = store.lookupEntity(q);
      }

      if (isCurrent) {
        if (res.team) {
          setTeam(res.team);
          const members = res.team.members || [];
          if (res.member) {
            const idx = members.findIndex(m => m.id === res.member?.id || m.passport_token === res.member?.passport_token);
            setSelectedMemberIdx(idx >= 0 ? idx : 0);
            setActiveMember(res.member);
          } else {
            setSelectedMemberIdx(0);
            setActiveMember(members[0] || null);
          }
        } else if (res.member) {
          const foundTeam = store.getTeamById(res.member.team_id);
          setTeam(foundTeam || null);
          setActiveMember(res.member);
        } else {
          setTeam(null);
          setActiveMember(null);
        }
      }
    };

    fetchEntity();
    const unsub = store.subscribe(fetchEntity);
    return () => {
      isCurrent = false;
      unsub();
    };
  }, [searchId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    audioManager.playNodeEngage();
    const q = searchId.trim();
    if (!q) {
      setTeam(null);
      setActiveMember(null);
      return;
    }
    const res = store.lookupEntity(q);
    if (res.team) {
      setTeam(res.team);
      const members = res.team.members || [];
      setSelectedMemberIdx(0);
      setActiveMember(members[0] || null);
    } else if (res.member) {
      const foundTeam = store.getTeamById(res.member.team_id);
      setTeam(foundTeam || null);
      setActiveMember(res.member);
    } else {
      setTeam(null);
      setActiveMember(null);
    }
  };

  const members = team?.members || (activeMember ? [activeMember] : []);
  const currentMember = members[selectedMemberIdx] || members[0];
  const activeToken = currentMember?.passport_token || currentMember?.id || 'TOKEN-UNASSIGNED';
  const passportShareLink = `${window.location.origin}/passport?token=${activeToken}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(passportShareLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSendWhatsApp = (member: TeamMember) => {
    audioManager.playNodeEngage();
    const token = member.passport_token || member.id;
    const memberPassLink = `${window.location.origin}/passport?token=${token}`;
    const cleanPhone = member.phone.replace(/[^0-9]/g, '');
    
    // Format text
    const message = encodeURIComponent(
      `⚡ *ZINNIA 2026 — DIGITAL PASSPORT*\n\n` +
      `Hello ${member.name}! Here is your official Gate Pass & QR Token for Zinnia '26:\n\n` +
      `🔗 *Access Pass:* ${memberPassLink}\n` +
      `🛡️ *Pass ID:* ${member.id}\n` +
      `👥 *Team:* ${team?.team_name || 'Registered Team'}\n\n` +
      `_Keep this QR ready for Campus Entry, Event Check-in, and Food Token._`
    );

    setDispatchStatus(prev => ({ ...prev, [member.id]: 'SENT' }));
    
    // Direct WhatsApp API redirect
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');

    // Also trigger backend callback
    store.resendPassportApi(member.id).catch(() => {});
  };

  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto space-y-6 select-none">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-950/90 border border-cyan-500/40 backdrop-blur-xl space-y-2 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-[10px] font-mono uppercase tracking-widest">
          <Shield className="w-3.5 h-3.5" />
          <span>OFFICIAL DIGITAL CREDENTIAL // ZINNIA '26</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
          QR DIGITAL PASSPORT & TEAM HUB
        </h1>
        <p className="text-xs text-slate-400 font-light">
          Your single digital key for Campus Entry, Event Check-in, and Lunch Token. No physical wristband required.
        </p>
      </div>

      {/* Pass Search Input */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          placeholder="Enter Passport Token, Team ID (e.g. ZIN26-XXXXXX), or Member Email..."
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          className="flex-1 px-4 py-3 bg-slate-950/90 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-cyan-400 backdrop-blur-md transition-colors"
        />
        <button
          type="submit"
          className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-black text-xs rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
        >
          <Zap className="w-4 h-4" />
          <span>LOOKUP</span>
        </button>
      </form>

      {!searchId.trim() ? (
        <div className="p-8 bg-slate-950/70 border border-slate-800 rounded-2xl text-center text-slate-400 text-xs font-mono backdrop-blur-md space-y-3">
          <QrCode className="w-10 h-10 text-cyan-400/60 mx-auto" />
          <p>Enter your Team ID or scan your Passport QR code to access your digital badge.</p>
        </div>
      ) : !team && !currentMember ? (
        <div className="p-8 bg-slate-950/70 border border-rose-500/40 rounded-2xl text-center text-rose-300 text-xs font-mono backdrop-blur-md">
          No team or participant record found matching "{searchId}".
        </div>
      ) : (
        <div className="space-y-6">
          {/* Team Pass Hub Container */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-950/90 border border-cyan-500/40 backdrop-blur-2xl space-y-6 shadow-2xl">
            
            {/* Team Overview Header */}
            {team && (
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
            )}

            {/* Payment Warning if not verified */}
            {team && !team.payment && (
              <div className="p-4 bg-amber-950/60 border border-amber-500/50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs font-sans text-amber-200">
                  <strong className="font-mono text-amber-400 uppercase">Payment Status: {team.payment_status || 'AWAITING_PAYMENT'}</strong>
                  <p className="text-[11px] text-amber-300/80 mt-0.5">
                    Your QR digital pass will be fully authorized at the gate once your UPI transaction is verified by the admin committee.
                  </p>
                </div>
                <a
                  href={`/payment?id=${team.team_id}`}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold font-mono text-xs rounded-xl text-center shrink-0 transition-colors"
                >
                  VIEW / SUBMIT PAYMENT &rarr;
                </a>
              </div>
            )}

            {/* Team Member Tabs (Team Pass Hub Carousel / Selector) */}
            {members.length > 1 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider font-bold">
                    TEAM PASS HUB &bull; SELECT MEMBER ({members.length} Passes)
                  </span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                  {members.map((m, idx) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        audioManager.playNodeEngage();
                        setSelectedMemberIdx(idx);
                        setActiveMember(m);
                      }}
                      className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap cursor-pointer transition-all border ${
                        selectedMemberIdx === idx
                          ? 'bg-cyan-500 text-black border-cyan-400 shadow-lg shadow-cyan-500/30'
                          : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {m.name} {m.is_leader && '👑'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Individual Pass Card */}
            {currentMember && (
              <div className="space-y-6">
                
                {/* QR Code Presentation Box */}
                <div className="flex flex-col items-center p-6 sm:p-8 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4 relative overflow-hidden">
                  <div className="absolute top-2 right-3 text-[9px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
                    ONE-TIME GATED
                  </div>

                  {/* QR Box with High Contrast */}
                  <div className="p-4 bg-white rounded-2xl shadow-2xl border-4 border-cyan-500/50">
                    <QRCodeSVG 
                      value={activeToken} 
                      size={180} 
                      level="H"
                      includeMargin={false}
                    />
                  </div>

                  {/* Member Badge & Token String */}
                  <div className="text-center space-y-1">
                    <h3 className="text-lg font-black text-white font-mono flex items-center justify-center gap-2">
                      <span>{currentMember.name}</span>
                      {currentMember.is_leader && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/40">
                          LEADER
                        </span>
                      )}
                    </h3>
                    <div className="text-xs text-cyan-400 font-mono font-bold tracking-wider">
                      MEMBER ID: {currentMember.id}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono break-all pt-1">
                      TOKEN: {activeToken}
                    </div>
                  </div>

                  {/* Action Buttons for this Member Pass */}
                  <div className="flex flex-wrap justify-center gap-2 pt-2 w-full">
                    <button
                      onClick={() => handleSendWhatsApp(currentMember)}
                      className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{dispatchStatus[currentMember.id] === 'SENT' ? 'Pass Sent ✓' : `Send to ${currentMember.phone || 'WhatsApp'}`}</span>
                    </button>

                    <button
                      onClick={handleCopyLink}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer border border-slate-700"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Link Copied' : 'Copy Pass Link'}</span>
                    </button>
                  </div>
                </div>

                {/* 3 Checkpoint Status Indicators */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                  {/* Gate Checkpoint */}
                  <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 uppercase">1. CAMPUS GATE</span>
                      <Shield className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <div className="font-bold text-slate-200">
                      1-Time Entry
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Scanned at main entry
                    </div>
                  </div>

                  {/* Event Checkpoint */}
                  <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 uppercase">2. EVENT ENTRY</span>
                      <Zap className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <div className="font-bold text-indigo-300">
                      {team?.registered_events.length || 0} Registered Tracks
                    </div>
                    <div className="text-[10px] text-slate-400">
                      1 scan per event
                    </div>
                  </div>

                  {/* Food Token */}
                  <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 uppercase">3. FOOD TOKEN</span>
                      <Utensils className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <div className={`font-bold ${currentMember.food_collected ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {currentMember.food_collected ? '✓ Claimed' : 'Ready to Claim'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      1-Time Lunch Lock
                    </div>
                  </div>
                </div>

                {/* Registered Events List */}
                {team && (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">
                      ELIGIBLE SYMPOSIUM TRACKS ({team.registered_events.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {team.registered_events.map(evId => {
                        const ev = store.getEventById(evId);
                        return (
                          <div 
                            key={evId} 
                            className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs font-mono"
                          >
                            <div>
                              <span className="text-cyan-400 font-bold block">
                                {ev?.code ? `[${ev.code}] ` : ''}{ev?.mission_name || evId}
                              </span>
                              <span className="text-[11px] text-slate-400">{ev?.venue || 'Venue TBA'}</span>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                              AUTHORIZED
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WebsitePassportPage;
