import React, { useState } from 'react';
import { Search } from 'lucide-react';

export interface ManualIDSearchProps {
  onSearch: (id: string) => void;
}

export const ManualIDSearch: React.FC<ManualIDSearchProps> = ({ onSearch }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSearch(input.trim());
    }
  };

  return (
    <div className="glass-panel p-5 tech-bracket border-slate-800 space-y-3 font-mono text-xs">
      <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
        <Search className="w-4 h-4 text-cyan-400" />
        MANUAL PARTICIPANT ID FALLBACK
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          placeholder="e.g. ZIN26-A8F41C"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 px-3 py-2 rounded bg-slate-950 border border-slate-700 text-white font-sans text-xs uppercase"
        />
        <button type="submit" className="btn-temporal py-2 px-4 text-xs">
          <span>LOOKUP</span>
        </button>
      </form>
    </div>
  );
};
