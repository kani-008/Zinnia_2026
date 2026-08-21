import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { store } from '../../services/store';
import { QRCodeSVG } from 'qrcode.react';
import { Participant } from '@packages/types/src';

export const PassportPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const idParam = searchParams.get('id');
  const [searchId, setSearchId] = useState(idParam || 'ZIN26-A8F41C');
  const [agent, setAgent] = useState<Participant | null>(null);

  useEffect(() => {
    const p = store.getParticipantByIdOrEmail(searchId);
    setAgent(p || null);
  }, [searchId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const p = store.getParticipantByIdOrEmail(searchId);
    setAgent(p || null);
  };

  return (
    <div className="p-8 max-w-xl mx-auto space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-white">Digital Pass</h1>
        <p className="text-slate-400 text-sm">Participant Credential & QR Code</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          placeholder="Enter ID or Email..."
          value={searchId}
          onChange={e => setSearchId(e.target.value)}
          className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded text-xs focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white font-medium rounded text-xs hover:bg-indigo-500"
        >
          Search
        </button>
      </form>

      {!agent ? (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded text-center text-slate-400 text-xs">
          No participant record found for "{searchId}".
        </div>
      ) : (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-lg space-y-4">
          <div className="flex justify-between items-start border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-xl font-bold text-white">{agent.name}</h2>
              <p className="text-xs text-slate-400">{agent.college}</p>
            </div>
            <div className="text-xs font-mono text-indigo-400 font-bold">{agent.agent_id}</div>
          </div>

          <div className="flex flex-col items-center p-4 bg-slate-950 rounded">
            <div className="bg-white p-2 rounded">
              <QRCodeSVG value={agent.qr_token} size={140} />
            </div>
            <span className="text-[10px] text-slate-500 mt-2 font-mono">{agent.qr_token}</span>
          </div>

          <div className="text-xs space-y-1 text-slate-300">
            <div><strong>Department:</strong> {agent.department} (Year {agent.year})</div>
            <div><strong>Phone:</strong> {agent.phone}</div>
            <div><strong>Food Status:</strong> {agent.food_collected ? 'Redeemed' : 'Pending'}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PassportPage;
