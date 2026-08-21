import React from 'react';

export interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: 'cyan' | 'emerald' | 'amber' | 'violet';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtitle,
  icon,
  variant = 'cyan'
}) => {
  const variantStyles = {
    cyan: 'border-cyan-500/30 text-cyan-400',
    emerald: 'border-emerald-500/30 text-emerald-400',
    amber: 'border-amber-500/30 text-amber-400',
    violet: 'border-violet-500/30 text-violet-400'
  };

  return (
    <div className={`glass-panel p-5 tech-bracket space-y-2 ${variantStyles[variant]}`}>
      <div className="flex justify-between items-center text-slate-400 font-mono text-xs">
        <span>{label}</span>
        {icon}
      </div>
      <div className="text-3xl font-heading font-black text-white">
        {value}
      </div>
      {subtitle && (
        <div className="text-[11px] font-mono text-slate-400">
          {subtitle}
        </div>
      )}
    </div>
  );
};
