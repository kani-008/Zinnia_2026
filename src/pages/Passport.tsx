import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { store } from '../services/store';
import { WebsiteNavbar } from '../components/layout/Navbar';
import { WebsiteFooter } from '../components/layout/Footer';
import { QRCodeSVG } from 'qrcode.react';
import { Team, TeamMember } from '../types';
import { 
  QrCode, 
  Users, 
  Send, 
  Shield, 
  Zap, 
  Utensils, 
  Copy, 
  Check,
  AlertTriangle
} from 'lucide-react';

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
  const [soundFX, setSoundFX] = useState<string | null>(null);

  const triggerComicSound = (txt: string) => {
    setSoundFX(txt);
    setTimeout(() => setSoundFX(null), 900);
  };

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
    triggerComicSound('SCAN!');
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
    triggerComicSound('COPIED!');
    navigator.clipboard.writeText(passportShareLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSendWhatsApp = (member: TeamMember) => {
    triggerComicSound('SENT!');
    const token = member.passport_token || member.id;
    const memberPassLink = `${window.location.origin}/passport?token=${token}`;
    const cleanPhone = member.phone.replace(/[^0-9]/g, '');
    
    const message = encodeURIComponent(
      `*ZINNIA 2026 — DIGITAL PASSPORT*\n\n` +
      `Hello ${member.name}! Here is your official Gate Pass & QR Token for Zinnia '26:\n\n` +
      `🔗 *Access Pass:* ${memberPassLink}\n` +
      `🛡️ *Pass ID:* ${member.id}\n` +
      `👥 *Team:* ${team?.team_name || 'Registered Team'}\n\n` +
      `_Keep this QR ready for Campus Entry, Event Check-in, and Food Token._`
    );

    setDispatchStatus(prev => ({ ...prev, [member.id]: 'SENT' }));
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
    store.resendPassportApi(member.id).catch(() => {});
  };

  return (
    <div className="min-h-screen bg-[#08090A] text-[#EEEEEA] flex flex-col justify-between select-none relative overflow-x-hidden">
      {/* Sound FX Popup (Printed Ink Style) */}
      {soundFX && (
        <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[150] pointer-events-none animate-bounce">
          <div className="px-5 py-2 bg-[#E5BD00] border-2 border-[#090A0B] shadow-[3px_3px_0px_#090A0B] rotate-3">
            <span className="font-comic font-black text-2xl sm:text-3xl text-[#090A0B] tracking-wider uppercase">
              {soundFX}
            </span>
          </div>
        </div>
      )}

      {/* Comic Halftone Decorator Background (Flat, Muted) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none opacity-20">
        <div className="comic-halftone -top-12 -left-12 scale-75" />
        <div className="comic-halftone top-1/2 -right-16 scale-75" />
      </div>

      {/* Top Navbar */}
      <WebsiteNavbar />

      {/* Main Content Area */}
      <main className="relative z-10 pt-4 sm:pt-6 pb-20 px-3 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6 w-full flex-1">
        
        {/* Header Panel (Flat Printed Comic Panel) */}
        <div className="p-6 sm:p-7 bg-[#111214] border-2 border-[#B8B8B2] shadow-[4px_4px_0px_#090A0B] rounded-lg relative">
          {/* Top Corner Badge */}
          <div className="inline-block bg-[#E5BD00] text-[#090A0B] font-comic font-black text-xs uppercase tracking-wider px-3 py-1 border border-[#090A0B] shadow-[2px_2px_0px_#090A0B] -rotate-1 mb-2.5">
            OFFICIAL DIGITAL GATE PASS // ZINNIA '26
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display text-[#EEEEEA] tracking-wide uppercase leading-tight">
            QR DIGITAL PASSPORT
          </h1>
          
          <p className="font-comic text-xs sm:text-sm text-[#B8B8B2] font-bold tracking-wide uppercase mt-1.5">
            Your physical credential key for Campus Entry, Event Arena Check-in &amp; Lunch Tokens.
          </p>

          {/* Action Lightning in corner (Muted Yellow Ink) */}
          <div className="absolute top-5 right-5 hidden sm:block rotate-12">
            <svg viewBox="0 0 40 50" className="w-6 h-8 fill-[#E5BD00]">
              <path d="M 22 2 L 6 26 L 18 24 L 10 48 L 34 18 L 22 20 Z" />
            </svg>
          </div>
        </div>

        {/* Pass Search Input Box */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 w-full">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="ENTER TEAM ID (E.G. ZIN26-XXXXXX), TOKEN, OR EMAIL..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="w-full px-4 py-3 bg-[#111214] border-2 border-[#B8B8B2] text-[#EEEEEA] text-xs sm:text-sm font-comic tracking-wider placeholder:text-[#B8B8B2]/60 shadow-[3px_3px_0px_#090A0B] focus:outline-none focus:border-[#0FA9C6] rounded-lg uppercase font-bold"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-[#0FA9C6] hover:bg-[#08758A] text-[#090A0B] hover:text-[#EEEEEA] font-comic font-black text-sm uppercase tracking-wider border-2 border-[#090A0B] shadow-[3px_3px_0px_#090A0B] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-1.5 rounded-lg shrink-0"
          >
            <Zap className="w-4 h-4 fill-current stroke-current" />
            <span>LOOKUP</span>
          </button>
        </form>

        {/* Initial Empty State */}
        {!searchId.trim() ? (
          <div className="p-8 sm:p-10 bg-[#111214] border-2 border-[#B8B8B2] rounded-lg text-center space-y-3 shadow-[3px_3px_0px_#090A0B]">
            <div className="w-12 h-12 bg-[#E5BD00] border border-[#090A0B] shadow-[2px_2px_0px_#090A0B] rounded-md flex items-center justify-center mx-auto -rotate-2">
              <QrCode className="w-7 h-7 text-[#090A0B] stroke-[2.2]" />
            </div>
            <div className="space-y-1">
              <h3 className="font-comic font-black text-lg sm:text-xl text-[#EEEEEA] uppercase tracking-wider">
                READY TO ACCESS YOUR PASS?
              </h3>
              <p className="font-comic text-xs text-[#B8B8B2] font-bold uppercase tracking-wide max-w-md mx-auto">
                Enter your Team ID or scan your Passport QR code to view your squad credential hub.
              </p>
            </div>
          </div>
        ) : !team && !currentMember ? (
          /* No Record Found State */
          <div className="p-6 sm:p-8 bg-[#111214] border-2 border-[#D51F55] shadow-[3px_3px_0px_#090A0B] rounded-lg text-center space-y-2">
            <div className="font-comic font-black text-base sm:text-lg text-[#D51F55] uppercase tracking-wider flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>NO CREDENTIAL RECORD FOUND</span>
            </div>
            <p className="font-comic text-xs text-[#B8B8B2] uppercase tracking-wide">
              No participant or squad found matching "{searchId}". Please check your Team ID or Token.
            </p>
          </div>
        ) : (
          /* Team Pass Hub Container */
          <div className="space-y-5">
            <div className="p-6 sm:p-7 bg-[#111214] border-2 border-[#B8B8B2] shadow-[4px_4px_0px_#090A0B] rounded-lg space-y-5">
              
              {/* Team Overview Header */}
              {team && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#B8B8B2] pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="px-2 py-0.5 bg-[#E5BD00] text-[#090A0B] font-comic font-black text-[11px] uppercase border border-[#090A0B]">
                        SQUAD
                      </div>
                      <h2 className="text-xl sm:text-2xl font-display text-[#EEEEEA] uppercase tracking-wide">
                        {team.team_name}
                      </h2>
                    </div>
                    <p className="font-comic text-xs sm:text-sm text-[#0FA9C6] font-bold uppercase tracking-wide">
                      {team.college}
                    </p>
                    <p className="font-mono text-xs text-[#B8B8B2] font-bold uppercase">
                      {team.department} &bull; Year {team.year}
                    </p>
                  </div>
                  
                  {/* Team ID Badge */}
                  <div className="px-3.5 py-1.5 bg-[#111214] border border-[#B8B8B2] shadow-[2px_2px_0px_#090A0B] text-center sm:text-right rounded shrink-0">
                    <span className="block font-comic text-[9px] uppercase font-bold tracking-widest text-[#B8B8B2]">TEAM ID</span>
                    <span className="font-mono text-sm font-bold text-[#EEEEEA] tracking-wider">{team.team_id}</span>
                  </div>
                </div>
              )}

              {/* Payment Warning (if not verified) */}
              {team && !team.payment && (
                <div className="p-4 bg-[#111214] border-2 border-[#E5BD00] shadow-[3px_3px_0px_#090A0B] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="font-comic font-black text-xs text-[#E5BD00] uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>PAYMENT STATUS: {team.payment_status || 'AWAITING PAYMENT'}</span>
                    </div>
                    <p className="font-comic text-xs text-[#B8B8B2] uppercase tracking-wide">
                      Your QR gate pass will be fully authorized once your UPI transaction is verified.
                    </p>
                  </div>
                  <a
                    href={`/payment?id=${team.team_id}`}
                    className="px-3.5 py-2 bg-[#E5BD00] hover:bg-[#EEEEEA] text-[#090A0B] font-comic font-black text-xs uppercase tracking-wider border border-[#090A0B] shadow-[2px_2px_0px_#090A0B] text-center shrink-0 transition-colors active:translate-x-0.5 active:translate-y-0.5 rounded"
                  >
                    SUBMIT PROOF &rarr;
                  </a>
                </div>
              )}

              {/* Team Member Tabs (Pass Hub Selector) */}
              {members.length > 1 && (
                <div className="space-y-2 pt-1">
                  <div className="font-comic font-black text-xs text-[#EEEEEA] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="text-[#E5BD00]">⚡</span>
                    <span>SELECT TEAM MEMBER ({members.length} PASSES):</span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                    {members.map((m, idx) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          triggerComicSound('SELECT!');
                          setSelectedMemberIdx(idx);
                          setActiveMember(m);
                        }}
                        className={`px-3.5 py-1.5 rounded font-comic text-xs uppercase font-bold tracking-wider whitespace-nowrap cursor-pointer transition-all border ${
                          selectedMemberIdx === idx
                            ? 'bg-[#0FA9C6] text-[#090A0B] border-2 border-[#090A0B] shadow-[2px_2px_0px_#090A0B] font-black'
                            : 'bg-[#111214] text-[#B8B8B2] hover:text-[#EEEEEA] border-[#B8B8B2] shadow-[2px_2px_0px_#090A0B]'
                        }`}
                      >
                        {m.name} {m.is_leader ? '👑' : ''}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Individual 2D Comic Badge Card */}
              {currentMember && (
                <div className="space-y-5 pt-1">
                  
                  {/* Badge Frame */}
                  <div className="flex flex-col items-center p-6 sm:p-7 bg-[#111214] border-2 border-[#B8B8B2] shadow-[4px_4px_0px_#090A0B] rounded-lg space-y-4 relative">
                    {/* Top Stamp */}
                    <div className="absolute top-3 right-3 font-comic font-black text-[9px] text-[#090A0B] bg-[#E5BD00] px-2 py-0.5 border border-[#090A0B] shadow-[1.5px_1.5px_0px_#090A0B]">
                      ONE-TIME GATED
                    </div>

                    {/* QR Code Presentation Box (High contrast ink) */}
                    <div className="p-3.5 bg-[#EEEEEA] border-2 border-[#090A0B] shadow-[3px_3px_0px_#090A0B] rounded-md">
                      <QRCodeSVG 
                        value={activeToken} 
                        size={180} 
                        level="H"
                        includeMargin={false}
                        fgColor="#090A0B"
                        bgColor="#EEEEEA"
                      />
                    </div>

                    {/* Member Details */}
                    <div className="text-center space-y-1">
                      <h3 className="font-display text-xl sm:text-2xl text-[#EEEEEA] uppercase tracking-wide flex items-center justify-center gap-2">
                        <span>{currentMember.name}</span>
                        {currentMember.is_leader && (
                          <span className="font-comic text-[10px] bg-[#E5BD00] text-[#090A0B] px-1.5 py-0.2 border border-[#090A0B] font-black">
                            LEADER
                          </span>
                        )}
                      </h3>
                      
                      <div className="font-comic font-bold text-xs text-[#0FA9C6] tracking-wider uppercase">
                        MEMBER ID: {currentMember.id}
                      </div>
                      
                      <div className="font-mono text-[10px] text-[#B8B8B2] break-all pt-0.5">
                        TOKEN: {activeToken}
                      </div>
                    </div>

                    {/* Action Buttons (WhatsApp + Copy Link) */}
                    <div className="flex flex-wrap justify-center gap-2.5 pt-1 w-full max-w-md">
                      <button
                        type="button"
                        onClick={() => handleSendWhatsApp(currentMember)}
                        className="flex-1 sm:flex-none px-4 py-2 bg-[#0FA9C6] hover:bg-[#08758A] text-[#090A0B] hover:text-[#EEEEEA] font-comic font-black text-xs uppercase tracking-wider border border-[#090A0B] shadow-[2px_2px_0px_#090A0B] flex items-center justify-center gap-1.5 transition-all cursor-pointer active:translate-x-0.5 active:translate-y-0.5 rounded"
                      >
                        <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>{dispatchStatus[currentMember.id] === 'SENT' ? 'PASS SENT ✓' : `SEND TO ${currentMember.phone ? 'WHATSAPP' : 'PHONE'}`}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="px-4 py-2 bg-[#111214] hover:bg-[#1A1A20] text-[#EEEEEA] font-comic font-black text-xs uppercase tracking-wider border border-[#B8B8B2] shadow-[2px_2px_0px_#090A0B] flex items-center justify-center gap-1.5 transition-all cursor-pointer active:translate-x-0.5 active:translate-y-0.5 rounded"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5 text-[#0FA9C6] stroke-[2.5]" /> : <Copy className="w-3.5 h-3.5 stroke-[2.5]" />}
                        <span>{copiedLink ? 'LINK COPIED!' : 'COPY PASS LINK'}</span>
                      </button>
                    </div>
                  </div>

                  {/* 3 Checkpoint Status Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Gate Checkpoint */}
                    <div className="p-3.5 rounded-lg bg-[#111214] border border-[#B8B8B2] shadow-[3px_3px_0px_#090A0B] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-comic text-[10px] text-[#B8B8B2] font-bold uppercase tracking-wider">1. CAMPUS GATE</span>
                        <Shield className="w-3.5 h-3.5 text-[#0FA9C6]" />
                      </div>
                      <div className="font-comic font-bold text-sm text-[#EEEEEA] uppercase tracking-wide">
                        1-TIME ENTRY
                      </div>
                      <div className="font-comic text-[10px] text-[#B8B8B2] font-bold uppercase">
                        SCANNED AT MAIN GATE
                      </div>
                    </div>

                    {/* Event Checkpoint */}
                    <div className="p-3.5 rounded-lg bg-[#111214] border border-[#B8B8B2] shadow-[3px_3px_0px_#090A0B] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-comic text-[10px] text-[#B8B8B2] font-bold uppercase tracking-wider">2. EVENT ENTRY</span>
                        <Zap className="w-3.5 h-3.5 text-[#E5BD00]" />
                      </div>
                      <div className="font-comic font-bold text-sm text-[#E5BD00] uppercase tracking-wide">
                        {team?.registered_events.length || 0} TRACKS
                      </div>
                      <div className="font-comic text-[10px] text-[#B8B8B2] font-bold uppercase">
                        1 SCAN PER MISSION
                      </div>
                    </div>

                    {/* Food Token */}
                    <div className="p-3.5 rounded-lg bg-[#111214] border border-[#B8B8B2] shadow-[3px_3px_0px_#090A0B] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-comic text-[10px] text-[#B8B8B2] font-bold uppercase tracking-wider">3. FOOD TOKEN</span>
                        <Utensils className="w-3.5 h-3.5 text-[#D51F55]" />
                      </div>
                      <div className={`font-comic font-bold text-sm uppercase tracking-wide ${currentMember.food_collected ? 'text-[#0FA9C6]' : 'text-[#D51F55]'}`}>
                        {currentMember.food_collected ? 'CLAIMED' : 'READY TO CLAIM'}
                      </div>
                      <div className="font-comic text-[10px] text-[#B8B8B2] font-bold uppercase">
                        1-TIME LUNCH TICKET
                      </div>
                    </div>
                  </div>

                  {/* Registered Tracks Summary List */}
                  {team && team.registered_events && team.registered_events.length > 0 && (
                    <div className="space-y-2.5 pt-2 border-t border-[#B8B8B2]">
                      <div className="font-comic font-black text-xs text-[#EEEEEA] uppercase tracking-wider flex items-center gap-1.5">
                        <span className="text-[#0FA9C6]">⚡</span>
                        <span>ELIGIBLE SYMPOSIUM TRACKS ({team.registered_events.length}):</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {team.registered_events.map(evId => {
                          const ev = store.getEventById(evId);
                          return (
                            <div 
                              key={evId} 
                              className="p-3 rounded bg-[#111214] border border-[#B8B8B2] shadow-[2px_2px_0px_#090A0B] flex items-center justify-between"
                            >
                              <div>
                                <span className="font-comic font-black text-xs text-[#0FA9C6] uppercase tracking-wider block">
                                  {ev?.code ? `[${ev.code}] ` : ''}{ev?.mission_name || evId}
                                </span>
                                <span className="font-mono text-[9px] text-[#B8B8B2] uppercase font-bold">{ev?.venue || 'VENUE TBA'}</span>
                              </div>
                              <span className="font-comic font-bold text-[9px] px-2 py-0.5 rounded bg-[#111214] text-[#EEEEEA] border border-[#B8B8B2] uppercase">
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
      </main>

      {/* Website Footer */}
      <WebsiteFooter />
    </div>
  );
};

export default WebsitePassportPage;
