import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className="space-y-1 font-mono text-xs">
      {label && (
        <label className="block text-slate-300 font-bold uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-2.5 rounded-lg bg-slate-950 border ${
          error ? 'border-red-500 text-red-300' : 'border-slate-700 text-white'
        } focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-sans text-sm transition-all ${className}`}
        {...props}
      />
      {error && <p className="text-[11px] text-red-400 mt-0.5">{error}</p>}
    </div>
  );
};
