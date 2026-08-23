import React, { useState, useEffect } from 'react';
import { AiChatAssistant } from '../components/AiChatAssistant';
import { Bot, Sparkles, Shield, Cpu, HelpCircle, Activity } from 'lucide-react';
import { checkAssistantHealth, HealthStatus } from '../../services/aiChat';

export const WebsiteAssistantPage: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);

  useEffect(() => {
    checkAssistantHealth().then(setHealth);
  }, []);

  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8 select-none font-mono">
      {/* Header */}
      <h2 className="text-2xl font-bold text-center text-white mb-4">Welcome to the ZINNIA AI Assistant</h2>
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-950/80 border border-cyan-500/30 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="text-[10px] text-cyan-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-pulse" />
            <span>// CHRONOS NEURAL ARCHIVE</span>
          </div>
          <h1 className="text-3xl font-black text-white">SYMPOSIUM AI ASSISTANT</h1>
          <p className="text-xs text-slate-400 font-light font-sans">
            Ask any question about Zinnia 2026 events, registration, rules, timings, and prizes.
          </p>
        </div>

        {/* Live System Status Badges */}
        <div className="flex flex-wrap items-center gap-2 text-[10px]">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2 text-slate-300">
            <Activity className="w-3.5 h-3.5 text-[#00FF66]" />
            <span>STATUS: <strong className="text-emerald-400">ONLINE</strong></span>
          </div>

          {health && (
            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2 text-slate-300">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>INDEX: <strong className="text-cyan-400">{health.knowledge_chunks_indexed} CHUNKS</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: AI Chat Interface + Quick Reference Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Area (2 Columns) */}
        <div className="lg:col-span-2 h-[650px]">
          <AiChatAssistant isDrawer={false} isOpen={true} />
        </div>

        {/* Right Reference Sidepanel (1 Column) */}
        <div className="space-y-4">
          {/* Quick FAQ Highlights */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-850 backdrop-blur-xl space-y-3 shadow-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
              <Shield className="w-4 h-4" />
              <span>KEY FACTS AT A GLANCE</span>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-0.5">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Registration Fee</div>
                <div className="text-white font-bold">₹150 per participant</div>
                <div className="text-[10px] text-slate-400">Includes all non-clashing events, kit & lunch</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-0.5">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Total Prize Pool</div>
                <div className="text-amber-400 font-bold">₹30,000+ Cash Awards</div>
                <div className="text-[10px] text-slate-400">Across 9 national-level competitions</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-0.5">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Venue & Host</div>
                <div className="text-white font-bold">GCE Erode (IRTT Campus)</div>
                <div className="text-[10px] text-slate-400">Dept. of CSE, NH-544, Chithode</div>
              </div>
            </div>
          </div>

          {/* Assistant Architecture Card */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-850 backdrop-blur-xl space-y-2.5 shadow-xl text-xs text-slate-300">
            <div className="flex items-center gap-2 text-xs font-bold text-[#00FF66]">
              <Cpu className="w-4 h-4" />
              <span>RESILIENT RAG PIPELINE</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              This assistant routes queries across pre-computed semantic FAQs, SQLite cache, ChromaDB local vector embeddings, and modular LLM providers with automatic fallback to prevent hallucinations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebsiteAssistantPage;
