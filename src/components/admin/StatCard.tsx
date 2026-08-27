import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  description?: string;
  icon: LucideIcon;
  color?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'purple' | 'blue';
  trend?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  icon: Icon,
  color = 'cyan',
  trend
}) => {
  const colorStyles = {
    cyan: {
      border: 'border-cyan-500/30 hover:border-cyan-500/60',
      icon: 'text-cyan-400 bg-cyan-950/50 border-cyan-800/50',
      value: 'text-cyan-400',
      accent: 'text-cyan-300'
    },
    emerald: {
      border: 'border-emerald-500/30 hover:border-emerald-500/60',
      icon: 'text-emerald-400 bg-emerald-950/50 border-emerald-800/50',
      value: 'text-emerald-400',
      accent: 'text-emerald-300'
    },
    amber: {
      border: 'border-amber-500/30 hover:border-amber-500/60',
      icon: 'text-amber-400 bg-amber-950/50 border-amber-800/50',
      value: 'text-amber-400',
      accent: 'text-amber-300'
    },
    rose: {
      border: 'border-rose-500/30 hover:border-rose-500/60',
      icon: 'text-rose-400 bg-rose-950/50 border-rose-800/50',
      value: 'text-rose-400',
      accent: 'text-rose-300'
    },
    purple: {
      border: 'border-purple-500/30 hover:border-purple-500/60',
      icon: 'text-purple-400 bg-purple-950/50 border-purple-800/50',
      value: 'text-purple-400',
      accent: 'text-purple-300'
    },
    blue: {
      border: 'border-blue-500/30 hover:border-blue-500/60',
      icon: 'text-blue-400 bg-blue-950/50 border-blue-800/50',
      value: 'text-blue-400',
      accent: 'text-blue-300'
    }
  }[color];

  return (
    <div className={`p-5 rounded-lg border bg-[#070c1b]/90 transition-all shadow-lg ${colorStyles.border}`}>
      <div className="flex items-center justify-between">
        <span className="text-slate-400 font-mono text-xs uppercase tracking-wider font-semibold">{title}</span>
        <div className={`p-2 rounded border ${colorStyles.icon}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <span className={`text-3xl font-heading font-black font-sans tracking-tight ${colorStyles.value}`}>
          {value}
        </span>
        {trend && (
          <span className="text-[11px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
            {trend}
          </span>
        )}
      </div>
      {description && (
        <p className={`mt-2 text-[11px] font-mono ${colorStyles.accent}`}>
          {description}
        </p>
      )}
    </div>
  );
};
