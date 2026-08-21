import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'DEFAULT' | 'ELEVATED' | 'INTERACTIVE';
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  variant = 'DEFAULT',
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`bento-card p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
