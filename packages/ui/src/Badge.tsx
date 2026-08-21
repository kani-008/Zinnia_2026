import React from 'react';

export interface BadgeProps {
  variant?: 'cyan' | 'violet' | 'emerald' | 'amber' | 'rose' | 'slate';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'cyan',
  children,
  className = ''
}) => {
  const variantStyles = {
    cyan: 'bg-cyan-950/80 text-cyan-400 border-cyan-500/40',
    violet: 'bg-violet-950/80 text-violet-400 border-violet-500/40',
    emerald: 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40',
    amber: 'bg-amber-950/80 text-amber-400 border-amber-500/40',
    rose: 'bg-rose-950/80 text-rose-400 border-rose-500/40',
    slate: 'bg-slate-900 text-slate-400 border-slate-700'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded font-mono text-[10px] font-bold border tracking-wider uppercase ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
