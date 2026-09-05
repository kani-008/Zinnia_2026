import React, { useState } from 'react';
import { useAdminQuery } from '../hooks/useAdminQuery';
import { EventCount, AdminError } from '../types';
import { adminFetch } from '../auth/adminFetch';
import { StatusChip } from '../components/StatusChip';
import { CapacityBar } from '../components/CapacityBar';
import { ReasonDialog } from '../components/ReasonDialog';
import { CalendarCheck, Lock, ToggleLeft, ToggleRight, Edit3, AlertCircle, Info, RefreshCw } from 'lucide-react';

export const Events: React.FC = () => {
  const { data: response, loading, error, refetch } = useAdminQuery<{ success: boolean; events: EventCount[] }>('/api/admin/events');
  const events = response?.events || [];

  const [selectedEventForClose, setSelectedEventForClose] = useState<EventCount | null>(null);
  const [editingCapacityEvent, setEditingCapacityEvent] = useState<EventCount | null>(null);
  const [newCapacity, setNewCapacity] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [overfillWarning, setOverfillWarning] = useState<{ event: EventCount; message: string } | null>(null);

  const handleToggleOpen = (evt: EventCount) => {
    setActionError(null);
    if (evt.registration_open) {
      // Prompt for close reason
      setSelectedEventForClose(evt);
    } else {
      // Reopen event
      executeEventUpdate(evt.event_id, { registration_open: true });
    }
  };

  const handleConfirmClose = (reason: string) => {
    if (!selectedEventForClose) return;
    executeEventUpdate(selectedEventForClose.event_id, {
      registration_open: false,
      close_reason: reason,
    });
    setSelectedEventForClose(null);
  };

  const handleSaveCapacity = (evt: EventCount) => {
    setActionError(null);
    const capNum = newCapacity.trim() === '' ? null : parseInt(newCapacity, 10);
    executeEventUpdate(evt.event_id, { capacity: capNum });
    setEditingCapacityEvent(null);
  };

  const executeEventUpdate = async (eventId: string, payload: any) => {
    setSubmitting(true);
    setActionError(null);

    try {
      await adminFetch(`/api/admin/events/${eventId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      setOverfillWarning(null);
      refetch();
    } catch (err: any) {
      if (err instanceof AdminError && err.errorCode === 'WOULD_OVERFILL') {
        const target = events.find(e => e.event_id === eventId);
        if (target) {
          setOverfillWarning({ event: target, message: err.message });
        }
      } else {
        setActionError(err.message || 'Failed to update event.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmOverfillReopen = () => {
    if (!overfillWarning) return;
    executeEventUpdate(overfillWarning.event.event_id, {
      registration_open: true,
      force_reopen: true,
    });
  };

  if (loading && events.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Event Grid &amp; Capacity Control</h1>
          <p className="text-xs text-slate-400 font-medium">Manage registration state, maximum seat limits, and venue clearance</p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl transition flex items-center space-x-2 w-fit"
        >
          <RefreshCw size={14} />
          <span>Refresh Events</span>
        </button>
      </div>

      {/* Action Error Banner */}
      {actionError && (
        <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl flex items-center justify-between text-rose-400 text-sm">
          <div className="flex items-center space-x-2">
            <AlertCircle size={20} className="shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-xs font-bold underline">Dismiss</button>
        </div>
      )}

      {/* Overfill Warning Modal */}
      {overfillWarning && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl space-y-3 text-amber-300 text-sm">
          <div className="flex items-center space-x-2 font-bold">
            <AlertCircle size={20} className="text-amber-400" />
            <span>Warning: Over-Capacity Reopening</span>
          </div>
          <p>{overfillWarning.message}</p>
          <div className="flex items-center space-x-3 pt-1">
            <button
              onClick={handleConfirmOverfillReopen}
              disabled={submitting}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg transition"
            >
              Confirm Reopen
            </button>
            <button
              onClick={() => setOverfillWarning(null)}
              className="px-4 py-2 bg-slate-800 text-slate-300 font-medium text-xs rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Events Table / Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-xs text-slate-400 uppercase font-semibold">
                <th className="p-4">Code / Name</th>
                <th className="p-4">Category</th>
                <th className="p-4 w-56">Registration Progress</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Open / Close</th>
                <th className="p-4 text-right">Capacity Settings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {events.map((evt) => {
                const isPaper = evt.event_id === 'paper-presentation' || evt.code === '05';

                return (
                  <tr key={evt.event_id} className="hover:bg-slate-800/40 transition">
                    {/* Event Code & Name */}
                    <td className="p-4">
                      <div className="flex items-center space-x-2.5">
                        <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                          #{evt.code}
                        </span>
                        <div>
                          <div className="font-bold text-white flex items-center space-x-1.5">
                            <span>{evt.event_name}</span>
                            {isPaper && (
                              <span title="Fixed capacity at 24">
                                <Lock size={14} className="text-amber-400" />
                              </span>
                            )}
                          </div>
                          {isPaper && (
                            <div className="text-[11px] text-amber-400/90 font-medium mt-0.5 flex items-center space-x-1">
                              <Info size={12} />
                              <span>Fixed at 24 (2 panels of twelve 15-min slots)</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="p-4 text-slate-400 text-xs font-medium uppercase">{evt.category}</td>

                    {/* Progress Bar */}
                    <td className="p-4">
                      <CapacityBar
                        registered={evt.registered_count}
                        capacity={evt.capacity}
                        percentage={evt.percentage}
                        status={evt.status}
                        capacityUnit={evt.capacity_unit}
                      />
                    </td>

                    {/* Status Badge */}
                    <td className="p-4 text-center">
                      <StatusChip status={evt.status} type="event" />
                    </td>

                    {/* Open/Close Switch */}
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleToggleOpen(evt)}
                        disabled={submitting}
                        className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                          evt.registration_open
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {evt.registration_open ? (
                          <>
                            <ToggleRight size={18} className="text-emerald-400" />
                            <span>OPEN</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft size={18} className="text-slate-500" />
                            <span>CLOSED</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Capacity Editing */}
                    <td className="p-4 text-right">
                      {isPaper ? (
                        <span className="text-xs font-mono text-slate-400 font-bold bg-slate-800 px-2.5 py-1 rounded">
                          24 (Read-Only)
                        </span>
                      ) : editingCapacityEvent?.event_id === evt.event_id ? (
                        <div className="flex items-center justify-end space-x-2">
                          <input
                            type="number"
                            value={newCapacity}
                            onChange={(e) => setNewCapacity(e.target.value)}
                            placeholder="Unlimited"
                            className="w-24 bg-slate-950 border border-indigo-500 rounded px-2 py-1 text-xs text-white focus:outline-none"
                          />
                          <button
                            onClick={() => handleSaveCapacity(evt)}
                            className="px-2.5 py-1 bg-indigo-600 text-white text-xs font-bold rounded hover:bg-indigo-500"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingCapacityEvent(null)}
                            className="px-2 py-1 bg-slate-800 text-slate-400 text-xs rounded hover:bg-slate-700"
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingCapacityEvent(evt);
                            setNewCapacity(evt.capacity !== null ? String(evt.capacity) : '');
                          }}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg inline-flex items-center space-x-1.5 transition border border-slate-700"
                        >
                          <Edit3 size={14} />
                          <span>{evt.capacity !== null ? `${evt.capacity} seats` : 'Unlimited'}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reason Dialog for Closing */}
      <ReasonDialog
        isOpen={!!selectedEventForClose}
        title={`Close Registration: ${selectedEventForClose?.event_name}`}
        subtitle="Closing this event will prevent any further participant seat claims."
        cannedReasons={[
          'Event full',
          'Registration deadline passed',
          'Venue capacity constraint',
          'Schedule conflict',
        ]}
        onConfirm={handleConfirmClose}
        onClose={() => setSelectedEventForClose(null)}
        loading={submitting}
      />
    </div>
  );
};
