import React from 'react';

export const WebsiteStoryPage: React.FC = () => {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-white">About ZINNIA 2026</h1>
        <p className="text-slate-400 text-sm">
          Department of Computer Science & Engineering, Government College of Engineering, Salem
        </p>
      </div>

      <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
        <p>
          Government College of Engineering, Salem is a premier government institution established in 1966. The Department of Computer Science & Engineering organizes the annual National Level Technical Symposium &mdash; ZINNIA 2026.
        </p>
        <p>
          The symposium brings together students from across institutions to compete in technical coding, AI, database queries, and non-technical strategy challenges for grand cash prizes and official certificates.
        </p>
      </div>
    </div>
  );
};
