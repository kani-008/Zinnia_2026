import React from 'react';
import { Search } from 'lucide-react';

export interface ParticipantSearchProps {
  value: string;
  onChange: (val: string) => void;
}

export const ParticipantSearch: React.FC<ParticipantSearchProps> = ({ value, onChange }) => {
  return (
    <div className="relative flex-1">
      <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
      <input
        type="text"
        placeholder="Search by Agent ID, Name, Email, or College..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-sans text-xs focus:border-cyan-400 focus:outline-none"
      />
    </div>
  );
};
