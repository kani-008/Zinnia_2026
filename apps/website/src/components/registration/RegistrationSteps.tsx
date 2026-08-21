import React from 'react';

export interface RegistrationStepsProps {
  currentStep: number;
}

export const RegistrationSteps: React.FC<RegistrationStepsProps> = ({ currentStep }) => {
  const steps = [
    { num: 1, label: 'IDENTITY' },
    { num: 2, label: 'COLLEGE' },
    { num: 3, label: 'MISSIONS' }
  ];

  return (
    <div className="grid grid-cols-3 gap-2 font-mono text-xs max-w-xl mx-auto">
      {steps.map((s) => (
        <div
          key={s.num}
          className={`p-3 rounded-lg border text-center transition-all ${
            currentStep === s.num
              ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 font-bold shadow-[0_0_12px_rgba(0,240,255,0.25)]'
              : currentStep > s.num
              ? 'bg-slate-900 border-emerald-500/40 text-emerald-400'
              : 'bg-slate-900/40 border-slate-800 text-slate-500'
          }`}
        >
          0{s.num}. {s.label}
        </div>
      ))}
    </div>
  );
};
