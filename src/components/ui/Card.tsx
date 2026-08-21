import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'DATA' | 'MISSION' | 'DOCUMENT' | 'METRIC' | 'STATUS';
  bracketed?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  variant = 'DATA',
  bracketed = true,
  children,
  className = '',
  ...props
}) => {
  const variantStyles = {
    DATA: 'bg-[#090e17]/85 border-slate-800/90 hover:border-cyan-500/40',
    MISSION: 'bg-[#090e17]/90 border-slate-800 hover:border-cyan-400',
    DOCUMENT: 'bg-[#070b14]/90 border-slate-800/80',
    METRIC: 'bg-[#060a12]/80 border-slate-800/90',
    STATUS: 'bg-[#090e17]/90 border-emerald-500/30'
  };

  return (
    <div
      className={`classified-card p-5 ${bracketed ? 'tech-bracket' : ''} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
