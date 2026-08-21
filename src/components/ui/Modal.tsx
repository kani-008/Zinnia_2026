import React, { useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { sound } from '../../services/sound';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  tag?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  tag = 'Event Overview',
  children,
  footer,
  maxWidth = '2xl'
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        sound.playKeyClick();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fadeIn">
      <div
        className={`bg-[#0d0f17] border border-white/10 shadow-2xl rounded-3xl w-full ${widthStyles[maxWidth]} max-h-[90vh] flex flex-col overflow-hidden`}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-start bg-white/[0.02]">
          <div className="space-y-1 pr-6">
            <div className="flex items-center gap-2 text-xs text-indigo-400 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{tag}</span>
            </div>
            <h2 className="text-2xl font-heading font-bold text-white">
              {title}
            </h2>
            {subtitle && <p className="text-slate-400 text-xs">{subtitle}</p>}
          </div>

          <button
            onClick={() => {
              sound.playKeyClick();
              onClose();
            }}
            className="p-2 rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-slate-300">
          {children}
        </div>

        {/* Modal Footer */}
        {footer && (
          <div className="p-4 border-t border-white/5 bg-white/[0.02] flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
