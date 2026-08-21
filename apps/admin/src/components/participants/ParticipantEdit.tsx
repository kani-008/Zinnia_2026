import React, { useState } from 'react';
import { Participant } from '@packages/types/src';

export interface ParticipantEditProps {
  participant: Participant | null;
  onSave: (p: Participant) => void;
  onCancel: () => void;
}

export const ParticipantEdit: React.FC<ParticipantEditProps> = ({
  participant,
  onSave,
  onCancel
}) => {
  if (!participant) return null;

  const [name, setName] = useState(participant.name);
  const [college, setCollege] = useState(participant.college);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...participant, name, college });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
      <div>
        <label className="block text-slate-400 mb-1">AGENT NAME</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-white font-sans text-xs"
        />
      </div>
      <div>
        <label className="block text-slate-400 mb-1">COLLEGE</label>
        <input
          value={college}
          onChange={(e) => setCollege(e.target.value)}
          className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-white font-sans text-xs"
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 rounded bg-slate-900 text-slate-300">
          Cancel
        </button>
        <button type="submit" className="btn-temporal py-1.5 px-4 text-xs">
          Save Changes
        </button>
      </div>
    </form>
  );
};
