import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  id?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  hasError?: boolean;
}

/**
 * Custom dropdown styled to match the form inputs — the native <select> popup
 * cannot be themed, so the list is rendered inline instead.
 */
export const SelectField: React.FC<SelectFieldProps> = ({
  id,
  value,
  options,
  onChange,
  placeholder = 'Choose an option',
  icon,
  hasError = false
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = options.find(o => o.value === value);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`w-full min-h-[44px] ${icon ? 'pl-10' : 'pl-4'} pr-9 py-2.5 rounded-xl bg-[#08090A] border font-mono text-xs text-left focus:border-[#E5BD00] outline-none transition-all cursor-pointer flex items-center ${
          hasError ? 'border-[#D51F55] ring-1 ring-[#D51F55]' : 'border-[#B8B8B2]/30'
        } ${selected ? 'text-[#EEEEEA]' : 'text-[#B8B8B2]/40'}`}
      >
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
            {icon}
          </span>
        )}
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <ChevronDown
          className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8B8B2]/60 pointer-events-none transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1.5 w-full max-h-56 overflow-y-auto rounded-xl bg-[#111214] border border-[#B8B8B2]/30 shadow-[4px_4px_0px_#090A0B] py-1"
        >
          {options.map(opt => {
            const isSelected = opt.value === value;
            return (
              <li key={opt.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 font-mono text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#E5BD00]/15 text-[#E5BD00]'
                      : 'text-[#EEEEEA] hover:bg-[#17181C]'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 shrink-0 stroke-[3]" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default SelectField;
