import React from 'react';
import { Cpu } from 'lucide-react';

export interface LoaderProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Loader: React.FC<LoaderProps> = ({
  text = 'ESTABLISHING TEMPORAL LINK...',
  size = 'md'
}) => {
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-3 font-mono text-xs text-cyan-400">
      <div className="relative">
        <Cpu className={`${iconSizes[size]} animate-spin text-cyan-400`} />
        <div className="absolute inset-0 rounded-full blur-md bg-cyan-400/40 animate-pulse" />
      </div>
      <div className="tracking-widest uppercase text-[11px] font-bold">
        {text}
      </div>
    </div>
  );
};
