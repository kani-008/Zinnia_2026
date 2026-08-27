import React, { useState } from 'react';
import { Bot, Sparkles, X, MessageSquare } from 'lucide-react';
import { AiChatAssistant } from './AiChatAssistant';
import { audioManager } from '../../core/AudioManager';

export const FloatingAiLauncher: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => {
    audioManager.playNodeEngage();
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40">
        {!isOpen && (
          <button
            onClick={toggleOpen}
            className="group relative flex items-center gap-2.5 px-4 py-3 bg-[#030706] hover:bg-[#06120c] border border-cyan-500/50 hover:border-[#00FF66] text-white rounded-full shadow-[0_0_30px_rgba(0,255,102,0.3)] transition-all hover:scale-105 active:scale-95 cursor-pointer font-mono text-xs"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-[#00FF66] animate-pulse" />
            <Bot className="w-4 h-4 text-[#00FF66] group-hover:rotate-12 transition-transform" />
            <span className="font-bold tracking-wider text-slate-100 hidden sm:inline">
              ASK AI ASSISTANT
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-500/40 uppercase font-black">
              RAG
            </span>
          </button>
        )}
      </div>

      {/* Floating Drawer / Modal */}
      {isOpen && (
        <AiChatAssistant
          isDrawer={true}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default FloatingAiLauncher;
