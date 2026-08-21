import React from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  icon = <ShieldAlert className="w-8 h-8 text-cyan-400 mx-auto" />
}) => {
  return (
    <div className="classified-card p-10 tech-bracket border-slate-800 text-center space-y-4 max-w-md mx-auto font-mono text-xs">
      <div>{icon}</div>
      <div className="space-y-1">
        <h3 className="text-base font-heading font-bold text-white uppercase font-sans">
          {title}
        </h3>
        <p className="text-slate-400 font-sans text-xs">{description}</p>
      </div>
      {actionText && onAction && (
        <div className="pt-2">
          <Button variant="PRIMARY" size="sm" onClick={onAction}>
            <span>{actionText}</span>
          </Button>
        </div>
      )}
    </div>
  );
};
