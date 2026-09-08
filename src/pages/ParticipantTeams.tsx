// Zinnia 2026 — Phase 5: my teams + accept/decline (§4.3, D2)
//
// Two audiences on one page: teammates responding to an invitation, and
// captains watching who has replied. A team is only registered once every
// member has accepted.
//
// Styling note: this page wears the homepage comic system (see
// components/ui/comic.tsx). Team logic below is unchanged.

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Clock, Crown, Loader2, RefreshCw, Users, X } from 'lucide-react';

import { WebsiteNavbar } from '../components/layout/Navbar';
import {
  cancelTeam,
  getMyTeams,
  loadSession,
  respondToInvite,
  swapTeamMember,
} from '../lib/participant/api';
import type { TeamInvite, TeamView } from '../lib/participant/types';
import {
  ComicBolt,
  ComicChip,
  ComicGhostButton,
  ComicHeading,
  ComicPageShell,
  ComicPanel,
  ComicSectionTitle,
} from '../components/ui/comic';
import { useToastOn } from '../components/ui/toast';

const ACCEPT_TIMEOUT_HOURS = 24;

/** Accept states, in the same three accents the rest of the flow uses. */
const STATUS_STYLE: Record<string, string> = {
  ACCEPTED: 'text-[#0FA9C6]',
  PENDING: 'text-[#E5BD00]',
  DECLINED: 'text-[#D51F55]',
};

export const ParticipantTeamsPage: React.FC = () => {
  const navigate = useNavigate();

  const [teams, setTeams] = useState<TeamView[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Failures surface as a slide-in toast rather than a box above the form,
  // which on a phone appeared off-screen above the button just pressed.
  const [notice, setNotice] = useState<string | null>(null);
  useToastOn(error);
  useToastOn(notice, 'info');

  const me = loadSession()?.user.user_id ?? '';

  const load = useCallback(async () => {
    if (!loadSession()) {
      navigate('/participant/login', { replace: true });
      return;
    }

    const result = await getMyTeams();
    setLoading(false);

    if (!result.success) {
      if (result.error_code === 'UNAUTHENTICATED') {
        navigate('/participant/login', { replace: true });
        return;
      }
      setError(result.message);
      return;
    }
    setTeams(result.teams);
    setInvites(result.invites);
  }, [navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  const respond = async (teamId: string, accept: boolean) => {
    setBusy(teamId);
    setError(null);
    setNotice(null);

    const result = await respondToInvite(teamId, accept);
    setBusy(null);

    if (!result.success) {
      setError(result.message);
      return;
    }
    setNotice(result.message ?? 'Saved.');
    await load();
  };

  const onCancel = async (team: TeamView) => {
    if (!window.confirm(`Cancel ${team.team_name} for every member?`)) return;

    setBusy(team.team_id);
    setError(null);

    const result = await cancelTeam(team.team_id);
    setBusy(null);

    if (!result.success) {
      setError(result.message);
      return;
    }
    await load();
  };

  const onSwap = async (team: TeamView, outUserId: string) => {
    const replacement = window.prompt(`Replace ${outUserId} with which UserID?`, 'ZIN26-');
    if (!replacement) return;

    setBusy(team.team_id);
    setError(null);

    const result = await swapTeamMember(team.team_id, outUserId, replacement.trim().toUpperCase());
    setBusy(null);

    if (!result.success) {
      setError(result.message);
      return;
    }
    await load();
  };

  /** D2 — the captain may only swap someone out after the 24h window. */
  const swappable = (invitedAt: string, acceptStatus: string) => {
    if (acceptStatus === 'DECLINED') return true;
    if (acceptStatus !== 'PENDING') return false;
    const elapsed = Date.now() - new Date(invitedAt).getTime();
    return elapsed >= ACCEPT_TIMEOUT_HOURS * 3600 * 1000;
  };

  if (loading) {
    return (
      <ComicPageShell>
        <WebsiteNavbar />
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
          <Loader2 size={28} className="animate-spin text-[#0FA9C6]" />
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#71767B]">
            Loading your teams
          </p>
        </div>
      </ComicPageShell>
    );
  }

  return (
    <ComicPageShell>
      <WebsiteNavbar />

      <main className="mx-auto max-w-3xl px-4 sm:px-6 pb-24 pt-4 sm:pt-6">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <ComicHeading>My teams</ComicHeading>
            <p className="mt-3 font-mono text-xs text-[#B8B8B2] sm:text-sm">
              A team is registered once every member has accepted.
            </p>
          </div>
          <button
            onClick={() => void load()}
            title="Refresh"
            className="shrink-0 border-2 border-[#23262D] bg-[#111214] p-2.5 text-[#B8B8B2] shadow-[3px_3px_0px_#090A0B] transition-colors hover:border-[#0FA9C6] hover:text-[#0FA9C6]"
          >
            <RefreshCw size={16} />
          </button>
        </header>


        {invites.length > 0 && (
          <section className="mb-10">
            <ComicSectionTitle tone="yellow" className="mb-3 flex items-center gap-2">
              <ComicBolt tone="yellow" className="w-4 h-4" /> Invitations for you
            </ComicSectionTitle>
            <ul className="space-y-4">
              {invites.map((invite) => (
                <li key={invite.team_id}>
                  <ComicPanel tone="yellow">
                    <p className="font-mono text-sm text-[#EEEEEA]">
                      <span className="font-bold">{invite.captain_name}</span> added you to{' '}
                      <span className="font-bold">{invite.team_name}</span>
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-[#B8B8B2]">{invite.event_name}</p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <ComicGhostButton
                        tone="cyan"
                        onClick={() => void respond(invite.team_id, true)}
                        disabled={busy === invite.team_id}
                        className="inline-flex items-center gap-1.5"
                      >
                        <Check size={14} /> Accept
                      </ComicGhostButton>
                      <ComicGhostButton
                        tone="pink"
                        onClick={() => void respond(invite.team_id, false)}
                        disabled={busy === invite.team_id}
                        className="inline-flex items-center gap-1.5"
                      >
                        <X size={14} /> Decline
                      </ComicGhostButton>
                    </div>
                  </ComicPanel>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <ComicSectionTitle tone="cyan" className="mb-3 flex items-center gap-2">
            <ComicBolt tone="cyan" className="w-4 h-4" /> Teams
          </ComicSectionTitle>

          {/* py-* on bodyClassName would be overridden by .pad-panel, so the
              empty state's extra breathing room goes on an inner block. */}
          {teams.length === 0 ? (
            <ComicPanel tone="cyan" bodyClassName="text-center">
              <div className="py-6">
                <Users size={26} className="mx-auto mb-3 text-[#71767B]" />
                <p className="font-mono text-xs text-[#B8B8B2]">You are not on any teams yet.</p>
                <div className="mt-6 flex justify-center">
                  <ComicGhostButton tone="cyan" onClick={() => navigate('/participant/dashboard')}>
                    Browse events
                  </ComicGhostButton>
                </div>
              </div>
            </ComicPanel>
          ) : (
            <ul className="space-y-5">
              {teams.map((team) => {
                const isCaptain = team.captain_user_id === me;
                const outstanding = team.members.filter(
                  (m) => m.accept_status !== 'ACCEPTED',
                ).length;
                const confirmed = team.status === 'CONFIRMED';

                return (
                  <li key={team.team_id}>
                    <ComicPanel tone={confirmed ? 'cyan' : 'yellow'}>
                      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="flex items-center gap-2 font-display text-lg uppercase text-[#EEEEEA]">
                            {team.team_name}
                            {isCaptain && <Crown size={14} className="text-[#E5BD00]" />}
                          </h3>
                          <p className="mt-0.5 font-mono text-[11px] text-[#B8B8B2]">
                            {team.event_name}
                          </p>
                        </div>

                        <ComicChip tone={confirmed ? 'cyan' : 'yellow'} rotate={2}>
                          {confirmed ? 'Confirmed' : `Waiting on ${outstanding}`}
                        </ComicChip>
                      </div>

                      <ul className="row-list border-t-2 border-[#23262D] pt-4">
                        {team.members.map((m) => (
                          <li
                            key={m.user_id}
                            className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs"
                          >
                            <span className="text-[#EEEEEA]">
                              {m.name || m.user_id}
                              <span className="ml-2 text-[11px] text-[#71767B]">{m.user_id}</span>
                              {m.role === 'CAPTAIN' && (
                                <span className="ml-2 text-[11px] uppercase text-[#E5BD00]">
                                  captain
                                </span>
                              )}
                            </span>

                            <span className="flex items-center gap-3">
                              <span
                                className={`text-[11px] font-bold uppercase tracking-wide ${
                                  STATUS_STYLE[m.accept_status] ?? 'text-[#71767B]'
                                }`}
                              >
                                {m.accept_status === 'PENDING' && (
                                  <Clock size={10} className="mr-1 inline" />
                                )}
                                {m.accept_status.toLowerCase()}
                              </span>

                              {isCaptain &&
                                team.status !== 'CONFIRMED' &&
                                swappable(m.invited_at, m.accept_status) && (
                                  <button
                                    onClick={() => void onSwap(team, m.user_id)}
                                    disabled={busy === team.team_id}
                                    className="text-[11px] uppercase tracking-wide text-[#71767B] underline underline-offset-2 hover:text-[#0FA9C6] disabled:opacity-40"
                                  >
                                    swap
                                  </button>
                                )}
                            </span>
                          </li>
                        ))}
                      </ul>

                      {isCaptain && (
                        <div className="mt-6 border-t-2 border-[#23262D] pt-4">
                          <button
                            onClick={() => void onCancel(team)}
                            disabled={busy === team.team_id}
                            className="font-mono text-[11px] font-bold uppercase tracking-wide text-[#71767B] underline underline-offset-2 hover:text-[#D51F55] disabled:opacity-40"
                          >
                            {busy === team.team_id ? 'Working…' : 'Cancel this team'}
                          </button>
                        </div>
                      )}
                    </ComicPanel>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </ComicPageShell>
  );
};

export default ParticipantTeamsPage;
