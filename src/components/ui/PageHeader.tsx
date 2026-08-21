import React from 'react';
import { Sparkles } from 'lucide-react';

export interface PageHeaderProps {
  badgeText: string;
  badgeIcon?: React.ReactNode;
  title: string;
  glitchWord?: string;
  description: string;
  highlightTag?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  badgeText,
  badgeIcon = <Sparkles className="w-3.5 h-3.5 text-indigo-400" />,
  title,
  glitchWord,
  description,
  highlightTag
}) => {
  return (
    <div className="space-y-4 text-center max-w-3xl mx-auto pt-6 pb-2">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <div className="pill-badge">
          {badgeIcon}
          <span>{badgeText}</span>
        </div>
        {highlightTag && (
          <span className="px-3 py-1 rounded-full bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/20 text-xs font-semibold">
            {highlightTag}
          </span>
        )}
      </div>

      <h1 className="text-3xl sm:text-5xl font-heading font-black text-white tracking-tight">
        {title}{' '}
        {glitchWord && (
          <span className="gradient-indigo-violet">
            {glitchWord}
          </span>
        )}
      </h1>

      <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
        {description}
      </p>
    </div>
  );
};
