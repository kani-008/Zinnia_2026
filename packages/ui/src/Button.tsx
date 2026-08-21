import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base font-bold'
  };

  const variantClasses = {
    primary: 'btn-temporal',
    secondary: 'btn-secondary',
    danger: 'bg-red-950/80 text-red-300 border border-red-500/50 hover:bg-red-900',
    ghost: 'bg-transparent text-slate-400 hover:text-white hover:bg-slate-900'
  };

  return (
    <button
      className={`rounded-lg font-mono transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
