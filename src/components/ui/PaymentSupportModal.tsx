import React, { useEffect } from 'react';
import { X, Phone, HelpCircle } from 'lucide-react';

export interface PaymentSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentSupportModal: React.FC<PaymentSupportModalProps> = ({ isOpen, onClose }) => {
  const supportName = 'Kanishkar';
  const supportPhone = '8778784819';
  const displayPhone = '+91 87787 84819';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-[#111214] border-2 border-[#090A0B] sm:border-[#E5BD00]/60 rounded-2xl shadow-[6px_6px_0px_#090A0B] overflow-hidden text-left p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#B8B8B2]/20">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#E5BD00]/15 text-[#E5BD00] border border-[#E5BD00]/30">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-black text-base sm:text-lg uppercase tracking-wider text-[#EEEEEA]">
                Payment Support
              </h3>
              <p className="font-mono text-[11px] text-[#B8B8B2]">Any issue with your transaction?</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close support dialog"
            className="p-1.5 rounded-lg text-[#B8B8B2] hover:text-[#EEEEEA] hover:bg-[#EEEEEA]/10 border border-transparent hover:border-[#B8B8B2]/30 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="pt-4 space-y-4">
          <p className="font-mono text-xs text-[#B8B8B2] leading-relaxed">
            If you face any issues while scanning the QR code, transferring via UPI, or entering your transaction reference (UTR) number, contact our support:
          </p>

          {/* Support Contact Card */}
          <div className="p-4 rounded-xl bg-[#090A0B] border border-[#E5BD00]/40 shadow-[3px_3px_0px_#090A0B] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#0FA9C6] block">
                  Payment Support
                </span>
                <p className="font-mono text-base font-bold text-[#EEEEEA] mt-0.5">
                  {supportName}
                </p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#E5BD00]/15 text-[#E5BD00] border border-[#E5BD00]/30">
                Available
              </span>
            </div>

            <div className="pt-2 border-t border-[#EEEEEA]/10">
              <a
                href={`tel:${supportPhone}`}
                className="w-full min-h-[44px] px-4 py-2.5 bg-[#E5BD00] hover:bg-[#EEEEEA] text-[#090A0B] font-mono font-bold text-xs uppercase tracking-wider rounded-xl border border-[#090A0B] shadow-[2px_2px_0px_#090A0B] flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Phone className="w-4 h-4 shrink-0" />
                <span>Call {displayPhone}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
