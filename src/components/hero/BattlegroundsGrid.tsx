import React from 'react';

interface BattlegroundItem {
  id: string;
  name: string;
  icon: React.ReactNode;
}

interface BattlegroundsGridProps {
  onSelectBattleground?: (id: string, name: string) => void;
  onTriggerSound?: (sound: string) => void;
}

export const BattlegroundsGrid: React.FC<BattlegroundsGridProps> = ({
  onSelectBattleground,
  onTriggerSound,
}) => {
  const battlegrounds: BattlegroundItem[] = [
    {
      id: 'code_arena',
      name: 'CODE ARENA',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
          <line x1="14" y1="4" x2="10" y2="20" />
        </svg>
      ),
    },
    {
      id: 'bug_hunt',
      name: 'BUG HUNT',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
          {/* Antennas */}
          <path d="M9 3L7 6" />
          <path d="M15 3L17 6" />
          {/* Head */}
          <ellipse cx="12" cy="7" rx="3" ry="2" />
          {/* Body */}
          <path d="M6 12C6 8.5 8.5 7 12 7C15.5 7 18 8.5 18 12C18 16.5 15.5 20 12 20C8.5 20 6 16.5 6 12Z" />
          {/* Spine */}
          <line x1="12" y1="7" x2="12" y2="20" />
          {/* Legs */}
          <path d="M6 10H2" />
          <path d="M18 10H22" />
          <path d="M6 14H2" />
          <path d="M18 14H22" />
          <path d="M7 18L3 21" />
          <path d="M17 18L21 21" />
        </svg>
      ),
    },
    {
      id: 'ai_warfare',
      name: 'AI WARFARE',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
          {/* Brain / Neural Circuit Icon */}
          <path d="M9.5 4C8 4 6.5 5 6.5 6.8C5 7 4 8.5 4 10C4 11.2 4.7 12.2 5.7 12.7C5.3 13.5 5.5 14.5 6.2 15.2C6 16.2 6.8 17.5 8 18C9 18.5 10 18.2 10.8 17.6" />
          <path d="M14.5 4C16 4 17.5 5 17.5 6.8C19 7 20 8.5 20 10C20 11.2 19.3 12.2 18.3 12.7C18.7 13.5 18.5 14.5 17.8 15.2C18 16.2 17.2 17.5 16 18C15 18.5 14 18.2 13.2 17.6" />
          <line x1="12" y1="4" x2="12" y2="20" />
          <circle cx="12" cy="7" r="1" fill="currentColor" />
          <circle cx="12" cy="12" r="1" fill="currentColor" />
          <circle cx="12" cy="17" r="1" fill="currentColor" />
          <path d="M9 10H12" />
          <path d="M12 14H15" />
        </svg>
      ),
    },
    {
      id: 'web_wizard',
      name: 'WEB WIZARD',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      ),
    },
    {
      id: 'data_drift',
      name: 'DATA DRIFT',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
          {/* Bar Chart + Trend Line */}
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
          <line x1="3" y1="20" x2="21" y2="20" />
          <polyline points="4 12 10 7 14 11 20 4" />
        </svg>
      ),
    },
    {
      id: 'robo_rumble',
      name: 'ROBO RUMBLE',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
          {/* Robot Head */}
          <rect x="4" y="8" width="16" height="12" rx="2" />
          <line x1="12" y1="4" x2="12" y2="8" />
          <circle cx="12" cy="3" r="1.5" fill="currentColor" />
          <circle cx="9" cy="13" r="1.5" fill="currentColor" />
          <circle cx="15" cy="13" r="1.5" fill="currentColor" />
          <line x1="9" y1="17" x2="15" y2="17" />
          <line x1="2" y1="13" x2="4" y2="13" />
          <line x1="20" y1="13" x2="22" y2="13" />
        </svg>
      ),
    },
    {
      id: 'ui_ux_forge',
      name: 'UI/UX FORGE',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
          {/* Mobile Screen Wireframe / Touch UI */}
          <rect x="5" y="2" width="14" height="20" rx="3" />
          <line x1="10" y1="5" x2="14" y2="5" />
          <rect x="8" y="9" width="8" height="5" rx="1" strokeWidth="1.5" />
          <circle cx="12" cy="18" r="1" fill="currentColor" />
        </svg>
      ),
    },
    {
      id: 'cryptix',
      name: 'CRYPTIX',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
          {/* Lock */}
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          <circle cx="12" cy="15.5" r="1.5" fill="currentColor" />
          <line x1="12" y1="17" x2="12" y2="19" />
        </svg>
      ),
    },
    {
      id: 'paper_quest',
      name: 'PAPER QUEST',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
          {/* Paper / Document */}
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="8" y1="13" x2="16" y2="13" />
          <line x1="8" y1="17" x2="14" y2="17" />
        </svg>
      ),
    },
  ];

  return (
    <div className="relative w-full max-w-[280px] sm:max-w-[310px] md:max-w-[340px] select-none">
      {/* 9 BATTLEGROUNDS Header Banner */}
      <div className="w-full bg-[#090A0B] text-[#E5BD00] border-[2.5px] border-[#090A0B] shadow-[3px_3px_0px_#090A0B] py-1.5 px-3 text-center mb-2.5">
        <h3 className="font-comic text-sm sm:text-base md:text-lg uppercase tracking-wider font-black">
          9 BATTLEGROUNDS
        </h3>
      </div>

      {/* 3x3 Card Grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
        {battlegrounds.map((b) => (
          <div
            key={b.id}
            onClick={() => {
              onTriggerSound?.(b.name);
              onSelectBattleground?.(b.id, b.name);
            }}
            className="group cursor-pointer bg-[#EEEEEA] hover:bg-[#E5BD00] text-[#090A0B] border-[2px] border-[#090A0B] shadow-[2px_2px_0px_#090A0B] hover:shadow-[3.5px_3.5px_0px_#090A0B] hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all duration-150 p-1.5 sm:p-2 aspect-square flex flex-col items-center justify-between text-center"
          >
            {/* Centered Line Icon */}
            <div className="flex-1 flex items-center justify-center text-[#090A0B] group-hover:scale-110 transition-transform">
              {b.icon}
            </div>

            {/* Label */}
            <span className="font-comic text-[8px] sm:text-[9.5px] md:text-[10px] font-black uppercase tracking-tight leading-none text-[#090A0B]">
              {b.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BattlegroundsGrid;
