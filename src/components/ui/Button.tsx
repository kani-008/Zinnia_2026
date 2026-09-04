import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'PRIMARY' | 'NEON' | 'SECONDARY' | 'GHOST' | 'DANGER' | 'SUCCESS';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'PRIMARY',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  onClick,
  ...props
}) => {
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-xs font-semibold',
    lg: 'px-7 py-3 text-sm font-semibold'
  };

  const variantStyles = {
    PRIMARY: 'btn-gradient',
    NEON: 'bg-gradient-to-r from-amber-500 to-rose-500 text-white font-semibold shadow-lg shadow-amber-500/25 hover:scale-102 transition-all rounded-full',
    SECONDARY: 'btn-surface',
    GHOST: 'bg-transparent text-slate-400 hover:text-white hover:bg-white/5 rounded-full',
    DANGER: 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 rounded-full',
    SUCCESS: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 rounded-full'
  };

  return (
    <button
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-full transition-all select-none disabled:opacity-50 disabled:cursor-not-allowed ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
      ) : leftIcon ? (
        <span>{leftIcon}</span>
      ) : null}
      <span>{children}</span>
      {!isLoading && rightIcon && <span>{rightIcon}</span>}
    </button>
  );
};
