import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { WebsiteNavbar } from '../components/layout/Navbar';
import { WebsiteFooter } from '../components/layout/Footer';
import { store } from '../services/store';
import { 
  CheckCircle2, 
  Clock, 
  Copy, 
  Check, 
  ArrowLeft,
  Mail, 
  ArrowRight,
  ShieldCheck,
  Building2,
  Users
} from 'lucide-react';

export const WebsiteConfirmationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const rawTeamId = searchParams.get('id') || searchParams.get('team_id') || '';
  const teamId = (rawTeamId && rawTeamId !== 'undefined' && rawTeamId !== 'null') ? rawTeamId.trim() : '';

  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedUtr, setCopiedUtr] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDetails = async (targetId: string) => {
    if (!targetId) return;
    try {
      let data = await store.getPaymentStatus(targetId);
      if (!data) {
        await store.syncFromSupabase();
        data = await store.getPaymentStatus(targetId);
      }
      if (data) {
        setPaymentInfo(data);
        // If already verified, offer button or notice
      } else {
        const local = store.getTeamById(targetId);
        if (local) {
          setPaymentInfo({
            success: true,
            team_id: local.team_id,
            team_name: local.team_name,
            payment: local.payment || false,
            payment_status: local.payment_status || 'PENDING_VERIFICATION',
            member_count: local.members?.length || 1,
            expected_amount: (local.members?.length || 1) * 250,
            submitted_amount: (local.members?.length || 1) * 250,
            utr_number: local.utr_number || 'FORWARDED TO TREASURER'
          });
        } else {
          setError(`No registration found with Team ID: ${targetId}`);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Unable to fetch status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (teamId) {
      loadDetails(teamId);
      const interval = setInterval(() => {
        loadDetails(teamId);
      }, 8000);
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [teamId]);

  const localTeam = store.getTeamById(paymentInfo?.team_id || teamId);
  const memberCount = Math.max(
    1,
    localTeam?.members?.length || 0,
    paymentInfo?.member_count || 0,
    Array.isArray((paymentInfo as any)?.members) ? (paymentInfo as any).members.length : 0
  );
  const expectedAmount = Math.max(
    memberCount * 250,
    paymentInfo?.expected_amount || 0
  );

  const membersList = (localTeam?.members && localTeam.members.length > 0)
    ? localTeam.members
    : (Array.isArray(paymentInfo?.members) && paymentInfo.members.length > 0 ? paymentInfo.members : []);

  const isVerified = paymentInfo?.payment_status === 'VERIFIED' || paymentInfo?.payment;

  const handleCopy = (text: string, type: 'id' | 'utr') => {
    navigator.clipboard.writeText(text);
    if (type === 'id') {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else {
      setCopiedUtr(true);
      setTimeout(() => setCopiedUtr(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090A] text-[#EEEEEA] flex flex-col justify-between font-sans relative">
      <WebsiteNavbar />

      <main className="relative z-10 pt-4 sm:pt-8 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6 w-full flex-1">
        
        {/* Top Back / Action Nav */}
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate(`/register?id=${teamId}`)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#111214] hover:bg-[#1A1C20] border border-[#EEEEEA]/40 text-xs font-mono font-bold uppercase tracking-wider text-[#EEEEEA] hover:text-[#E5BD00] hover:border-[#E5BD00] transition-all shadow-[3px_3px_0px_#090A0B] rounded-xl cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 text-[#E5BD00] group-hover:-translate-x-1 transition-transform" />
            <span>BACK TO REGISTRATION</span>
          </button>

          {teamId && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#111214] border border-[#EEEEEA]/20 text-xs font-mono">
              <span className="text-[#B8B8B2]">TEAM ID:</span>
              <strong className="text-[#E5BD00]">{teamId}</strong>
              <button
                type="button"
                onClick={() => handleCopy(teamId, 'id')}
                className="p-1 hover:text-[#E5BD00] transition-colors cursor-pointer"
                title="Copy Team ID"
              >
                {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </div>

        {/* Header Title */}
        <div className="p-6 sm:p-8 bg-[#111214] border border-[#EEEEEA]/30 shadow-[6px_6px_0px_#090A0B] rounded-2xl relative">
          <div className="inline-block bg-[#E5BD00] text-[#090A0B] font-mono font-black text-xs uppercase tracking-wider px-3.5 py-1 border border-[#090A0B] shadow-[3px_3px_0px_#090A0B] -rotate-1 mb-3">
            ⚡ CONFIRMATION &amp; STATUS // ZINNIA '26
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display text-[#EEEEEA] tracking-tight uppercase leading-none drop-shadow-[3px_3px_0px_#090A0B]">
            {isVerified ? 'PAYMENT VERIFIED & APPROVED' : 'PAYMENT PROOF SUBMITTED'}
          </h1>
          <p className="text-xs sm:text-sm font-mono text-[#0FA9C6] uppercase font-bold tracking-wide mt-2">
            {isVerified 
              ? '✓ Your squad passes have been officially unlocked.' 
              : '⏳ Your transaction reference has been forwarded to the symposium treasurer.'}
          </p>
        </div>

        {/* Loading / Error States */}
        {loading ? (
          <div className="p-12 text-center bg-[#111214] border border-[#EEEEEA]/20 rounded-2xl font-mono text-sm">
            <Clock className="w-8 h-8 text-[#E5BD00] animate-spin mx-auto mb-3" />
            <p className="text-[#B8B8B2]">Loading confirmation details...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-[#D51F55]/15 border border-[#D51F55] rounded-2xl font-mono text-xs text-[#D51F55] space-y-2">
            <p className="font-bold uppercase tracking-wider">Registration Not Found</p>
            <p className="text-[#EEEEEA]">{error}</p>
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="mt-3 px-4 py-2 bg-[#E5BD00] text-[#090A0B] font-bold rounded-xl"
            >
              Start New Registration
            </button>
          </div>
        ) : (
          <div className="space-y-6">

            {/* =========================================================================
                OFFICIAL PASS DELIVERY NOTICE (DEDICATED FULL COMPONENT)
                ========================================================================= */}
            <div className="p-6 sm:p-8 bg-[#111214] border-2 border-[#0FA9C6] shadow-[6px_6px_0px_#090A0B] rounded-2xl space-y-4">
              <div className="flex items-center gap-3 border-b border-[#0FA9C6]/30 pb-3">
                <div className="p-2.5 rounded-xl bg-[#0FA9C6]/20 border border-[#0FA9C6] text-[#0FA9C6]">
                  <Mail className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <span className="font-mono text-[10px] text-[#0FA9C6] uppercase font-bold tracking-widest block">
                    IMPORTANT ATTENDEE INSTRUCTION
                  </span>
                  <h2 className="font-display text-xl sm:text-2xl text-[#EEEEEA] uppercase tracking-wide">
                    OFFICIAL PASS DELIVERY NOTICE
                  </h2>
                </div>
              </div>

              <div className="space-y-3 font-sans text-sm sm:text-base leading-relaxed text-[#EEEEEA]">
                <p>
                  The official symposium entry pass and personal QR code will be received to each registered member's email address separately from the official Zinnia email (<strong className="text-[#0FA9C6] font-mono">zinnia2026@gcee.ac.in</strong>) once verified and approved by the Treasurer.
                </p>
                <div className="p-3 bg-[#08090A] border border-[#EEEEEA]/15 rounded-xl text-xs sm:text-sm font-mono text-[#E5BD00] flex items-start gap-2">
                  <span className="text-base leading-none">&bull;</span>
                  <span>Please check both your inbox and spam/promotions folder after treasurer approval.</span>
                </div>
              </div>
            </div>

            {/* Summary Information Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              
              {/* Card 1: Status */}
              <div className="p-5 bg-[#111214] border border-[#EEEEEA]/20 shadow-[4px_4px_0px_#090A0B] rounded-2xl space-y-1 font-mono">
                <span className="text-[10px] text-[#B8B8B2] uppercase font-bold tracking-wider block">
                  PAYMENT STATUS
                </span>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isVerified ? 'bg-emerald-400' : 'bg-[#E5BD00] animate-ping'}`} />
                  <span className="text-sm font-black text-[#EEEEEA] uppercase">
                    {isVerified ? 'VERIFIED' : 'PENDING REVIEW'}
                  </span>
                </div>
                <span className="text-[11px] text-[#B8B8B2] block pt-1">
                  {isVerified ? 'Approved by symposium treasurer' : 'Forwarded to treasurer'}
                </span>
              </div>

              {/* Card 2: Transaction Reference */}
              <div className="p-5 bg-[#111214] border border-[#EEEEEA]/20 shadow-[4px_4px_0px_#090A0B] rounded-2xl space-y-1 font-mono">
                <span className="text-[10px] text-[#B8B8B2] uppercase font-bold tracking-wider block">
                  TRANSACTION REF (UTR)
                </span>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-sm font-black text-[#0FA9C6] break-all">
                    {paymentInfo?.utr_number || 'RECORDED'}
                  </span>
                  {paymentInfo?.utr_number && (
                    <button
                      type="button"
                      onClick={() => handleCopy(paymentInfo.utr_number, 'utr')}
                      className="p-1 hover:text-[#0FA9C6] transition-colors cursor-pointer shrink-0"
                      title="Copy Reference Number"
                    >
                      {copiedUtr ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
                <span className="text-[11px] text-[#B8B8B2] block pt-1">
                  Reconciliation Identifier
                </span>
              </div>

              {/* Card 3: Amount Paid */}
              <div className="p-5 bg-[#111214] border border-[#EEEEEA]/20 shadow-[4px_4px_0px_#090A0B] rounded-2xl space-y-1 font-mono sm:col-span-2 md:col-span-1">
                <span className="text-[10px] text-[#B8B8B2] uppercase font-bold tracking-wider block">
                  TOTAL AMOUNT
                </span>
                <div className="text-xl font-black text-[#E5BD00]">
                  ₹{expectedAmount}
                </div>
                <span className="text-[11px] text-[#B8B8B2] block pt-1">
                  ₹250 × {memberCount} registered attendee{memberCount > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Recipient Member Inboxes */}
            {membersList.length > 0 && (
              <div className="p-6 sm:p-7 bg-[#111214] border border-[#EEEEEA]/20 shadow-[5px_5px_0px_#090A0B] rounded-2xl space-y-4 font-mono">
                <div className="flex items-center justify-between gap-3 border-b border-[#EEEEEA]/15 pb-3">
                  <div>
                    <h3 className="font-display text-lg sm:text-xl text-[#EEEEEA] uppercase tracking-wide">
                      REGISTERED PASS INBOXES
                    </h3>
                    <p className="text-xs text-[#B8B8B2]">
                      Each participant will receive their individual entry pass and QR code directly to the email below:
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-[#08090A] border border-[#EEEEEA]/20 text-[#0FA9C6] text-xs font-bold shrink-0">
                    {membersList.length} PASS{membersList.length > 1 ? 'ES' : ''}
                  </span>
                </div>

                <div className="space-y-2">
                  {membersList.map((m: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl bg-[#08090A] border border-[#EEEEEA]/10 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-[#E5BD00]/20 border border-[#E5BD00] text-[#E5BD00] text-xs font-bold flex items-center justify-center shrink-0 font-mono">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="text-sm font-bold text-[#EEEEEA]">{m.name}</span>
                          {m.is_leader && (
                            <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded bg-[#0FA9C6]/20 text-[#0FA9C6] font-bold border border-[#0FA9C6]/40">
                              TEAM LEADER
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#0FA9C6] sm:text-right font-mono text-xs">
                        <Mail className="w-3.5 h-3.5 shrink-0 opacity-70" />
                        <span className="break-all">{m.email || 'Email registered'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="p-6 bg-[#111214] border border-[#EEEEEA]/20 shadow-[4px_4px_0px_#090A0B] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs font-mono text-[#B8B8B2] text-center sm:text-left">
                Keep your Team ID safe for future reference at the symposium.
              </div>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#0FA9C6] hover:bg-[#E5BD00] text-[#090A0B] text-xs font-mono font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-[3px_3px_0px_#090A0B] active:translate-x-0.5 active:translate-y-0.5"
              >
                <span>RETURN HOME</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

          </div>
        )}

      </main>

      <WebsiteFooter />
    </div>
  );
};
export default WebsiteConfirmationPage;
