import React, { useState, useEffect } from 'react';
import { store } from '../../services/store';
import { ParticipantTable } from '../../components/admin/ParticipantTable';
import { Participant } from '@packages/types/src';
import { Users, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { exportParticipantsExcel } from '../../services/exportService';

export const ParticipantsListPage: React.FC = () => {
  const [participants, setParticipants] = useState<Participant[]>(store.getParticipants());
  const [isLoading, setIsLoading] = useState(false);
  const events = store.getEvents();

  const loadParticipants = async () => {
    setIsLoading(true);
    // 1. Sync store from Supabase if configured
    await store.syncFromSupabase();

    // 2. Try fetching live list from Flask backend
    try {
      const res = await fetch('/api/admin/participants');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.participants) && data.participants.length > 0) {
          setParticipants(data.participants);
          setIsLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn('Backend participants endpoint unavailable, using store fallback:', e);
    }

    // Fallback store
    setParticipants(store.getParticipants());
    setIsLoading(false);
  };

  useEffect(() => {
    loadParticipants();
    const unsubscribe = store.subscribe(() => {
      setParticipants(store.getParticipants());
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove participant ${name}?`)) {
      store.deleteParticipant(id);
      loadParticipants();
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-mono text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-white font-sans flex items-center gap-2.5">
            <Users className="w-7 h-7 text-cyan-400" />
            PARTICIPANT MANAGEMENT & REGISTRY
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Total {participants.length} registered offline event participants across colleges.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadParticipants}
            disabled={isLoading}
            className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 text-cyan-400 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={exportParticipantsExcel}
            className="px-3.5 py-2 rounded bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 font-mono text-xs font-bold flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>EXPORT (.XLSX)</span>
          </button>
        </div>
      </div>

      {/* Participant Management Table */}
      <ParticipantTable
        participants={participants}
        eventsList={events.map(e => ({ id: e.id, name: e.title }))}
        onDelete={handleDelete}
      />
    </div>
  );
};
