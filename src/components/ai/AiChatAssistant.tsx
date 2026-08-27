import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Trash2, 
  RotateCcw, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  X, 
  Maximize2, 
  Minimize2, 
  MessageSquare, 
  ShieldCheck, 
  Zap, 
  Database,
  ExternalLink,
  Cpu
} from 'lucide-react';
import { 
  sendChatMessage, 
  fetchSuggestedFaqs, 
  ChatMessage, 
  SuggestedFaq, 
  ChatSource 
} from '../../services/aiChat';
import { audioManager } from '../../core/AudioManager';

interface AiChatAssistantProps {
  isDrawer?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export const AiChatAssistant: React.FC<AiChatAssistantProps> = ({ 
  isDrawer = false, 
  isOpen = true, 
  onClose 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-0',
      sender: 'assistant',
      text: "Greetings, Agent. I am the **ZINNIA 2026 AI Assistant** powered by our official symposium RAG core.\n\nAsk me anything regarding:\n• **Registration fees & Deadlines**\n• **9 Technical & Non-Technical Events**\n• **Rules, Timings & Venues**\n• **Prizes, Food & Accommodation**\n• **Certificates & Contact Helplines**",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: 'faq',
      cached: true
    }
  ]);
  
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedFaqs, setSuggestedFaqs] = useState<SuggestedFaq[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load Suggested FAQs on mount
  useEffect(() => {
    fetchSuggestedFaqs().then((faqs) => {
      if (faqs && faqs.length > 0) {
        setSuggestedFaqs(faqs);
      }
    });
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim() || isLoading) return;

    audioManager.playNodeEngage();

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInputQuery('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage(query.trim());
      
      const assistantMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: response.source,
        cached: response.cached,
        confidence: response.confidence,
        matched_question: response.matched_question,
        provider: response.provider,
        sources: response.sources,
        isError: !!response.error
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: "Failed to connect to the AI Knowledge Base. Please retry or contact the symposium coordinators.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'fallback',
        isError: true
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    audioManager.playNodeEngage();
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'assistant',
        text: "Conversation cleared. Memory buffer reset. How can I assist you with ZINNIA 2026?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'faq',
        cached: true
      }
    ]);
  };

  const handleRetryLast = () => {
    const lastUserMessage = [...messages].reverse().find((m) => m.sender === 'user');
    if (lastUserMessage) {
      handleSendMessage(lastUserMessage.text);
    }
  };

  const handleCopy = (id: string, text: string) => {
    audioManager.playNodeEngage();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleSources = (id: string) => {
    setExpandedSources((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getSourceBadge = (source?: ChatSource, cached?: boolean, provider?: string) => {
    switch (source) {
      case 'faq':
        return {
          label: 'OFFICIAL FAQ',
          icon: <ShieldCheck className="w-3 h-3 text-emerald-400" />,
          style: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 shadow-emerald-500/10'
        };
      case 'cache':
        return {
          label: 'VERIFIED CACHE',
          icon: <Database className="w-3 h-3 text-cyan-400" />,
          style: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40 shadow-cyan-500/10'
        };
      case 'llm':
      case 'llm_fallback':
        return {
          label: provider ? `AI (${provider.toUpperCase()})` : 'AI GENERATED',
          icon: <Sparkles className="w-3 h-3 text-purple-400" />,
          style: 'bg-purple-950/80 text-purple-300 border-purple-500/40 shadow-purple-500/10'
        };
      case 'rag':
        return {
          label: 'RAG RETRIEVAL',
          icon: <Cpu className="w-3 h-3 text-amber-400" />,
          style: 'bg-amber-950/80 text-amber-300 border-amber-500/40 shadow-amber-500/10'
        };
      case 'fallback':
      default:
        return {
          label: 'SAFE FALLBACK',
          icon: <Zap className="w-3 h-3 text-slate-400" />,
          style: 'bg-slate-900 text-slate-400 border-slate-700'
        };
    }
  };

  const renderFormattedText = (text: string) => {
    // Simple robust markdown parser for lists, bolding, headings
    const lines = text.split('\n');
    return (
      <div className="space-y-1.5 leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1" />;
          
          let parsed = line;
          // Bold parsing **text**
          const boldParts = parsed.split(/(\*\*.*?\*\*)/g);

          return (
            <p key={idx} className={line.startsWith('•') || line.startsWith('-') ? 'pl-2 text-slate-200' : 'text-slate-200'}>
              {boldParts.map((part, pIdx) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return <strong key={pIdx} className="text-white font-bold">{part.slice(2, -2)}</strong>;
                }
                return part;
              })}
            </p>
          );
        })}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className={`flex flex-col bg-[#030706]/95 border border-cyan-500/30 rounded-3xl backdrop-blur-2xl shadow-[0_0_50px_rgba(0,255,102,0.12)] font-mono text-xs overflow-hidden transition-all duration-300 ${
        isDrawer
          ? isExpanded
            ? 'fixed inset-4 sm:inset-10 z-[99999]'
            : 'fixed bottom-5 right-5 sm:right-8 z-[99999] w-[92vw] sm:w-[460px] h-[600px] max-h-[85vh]'
          : 'w-full h-full min-h-[550px]'
      }`}
    >
      {/* =========================================================================
          ASSISTANT HEADER
          ========================================================================= */}
      <div className="px-5 py-4 bg-slate-950/90 border-b border-cyan-500/20 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center relative shadow-[0_0_15px_rgba(0,255,102,0.25)]">
            <Bot className="w-4 h-4 text-[#00FF66]" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#00FF66] animate-pulse border border-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-white tracking-wider text-sm">ZINNIA AI CORE</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/30 font-bold uppercase">
                RAG // v2.6
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-light">
              Official Symposium Intelligence & Knowledge Engine
            </p>
          </div>
        </div>

        {/* Header Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleClearChat}
            title="Clear conversation"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-500/30 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {isDrawer && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? "Collapse" : "Maximize"}
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-900 border border-transparent hover:border-slate-700 transition-colors cursor-pointer"
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}

          {isDrawer && onClose && (
            <button
              onClick={onClose}
              title="Close chat"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          MESSAGES CONTAINER
          ========================================================================= */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 select-text">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const badge = !isUser ? getSourceBadge(msg.source, msg.cached, msg.provider) : null;
          const hasSources = msg.sources && msg.sources.length > 0;
          const isExpandedSource = expandedSources[msg.id];

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
            >
              {/* Sender & Timestamp Header */}
              <div className="flex items-center gap-2 px-1 text-[10px] text-slate-500">
                <span>{isUser ? 'AGENT // YOU' : 'ZINNIA NEURAL CORE'}</span>
                <span>&bull;</span>
                <span>{msg.timestamp}</span>
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[88%] sm:max-w-[82%] rounded-2xl p-4 transition-all shadow-md ${
                  isUser
                    ? 'bg-slate-900/90 text-white border border-cyan-500/30 rounded-tr-sm'
                    : msg.isError
                    ? 'bg-rose-950/80 text-rose-200 border border-rose-500/50 rounded-tl-sm'
                    : 'bg-slate-950/90 text-slate-200 border border-slate-800/90 rounded-tl-sm'
                }`}
              >
                {/* AI Source Badge */}
                {!isUser && badge && (
                  <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-800/80">
                    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[9px] font-bold tracking-wider ${badge.style}`}>
                      {badge.icon}
                      <span>{badge.label}</span>
                      {msg.cached && <span className="opacity-75">• CACHED</span>}
                    </div>

                    <button
                      onClick={() => handleCopy(msg.id, msg.text)}
                      title="Copy response"
                      className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors flex items-center gap-1 text-[10px]"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-[#00FF66]" />
                          <span className="text-[#00FF66]">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Text Content */}
                {renderFormattedText(msg.text)}

                {/* Sources & Citations Section */}
                {!isUser && hasSources && (
                  <div className="mt-3 pt-2.5 border-t border-slate-850">
                    <button
                      onClick={() => toggleSources(msg.id)}
                      className="flex items-center gap-1.5 text-[10px] text-cyan-400/80 hover:text-cyan-300 font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      <span>Verified Knowledge Sources ({msg.sources?.length})</span>
                      {isExpandedSource ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {isExpandedSource && (
                      <div className="mt-2 space-y-1 pl-1">
                        {msg.sources?.map((s, sIdx) => (
                          <div
                            key={sIdx}
                            className="flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-900/60 px-2 py-1 rounded border border-slate-800"
                          >
                            <ExternalLink className="w-2.5 h-2.5 text-cyan-400" />
                            <span className="truncate">{s.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex flex-col items-start space-y-1.5 animate-pulse">
            <div className="text-[10px] text-cyan-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-ping" />
              <span>// SCANNING CHRONOS RAG ARCHIVES & LLM ROUTER...</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-cyan-500/30 text-slate-400 text-xs flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-[#00FF66] animate-spin" />
              <span>Synthesizing verified official response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* =========================================================================
          SUGGESTED QUICK QUESTION PILLS
          ========================================================================= */}
      {suggestedFaqs.length > 0 && (
        <div className="px-4 py-2 border-t border-slate-850/80 bg-slate-950/60 shrink-0">
          <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-1.5 font-bold flex items-center gap-1.5">
            <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
            <span>Suggested Inquiries</span>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {suggestedFaqs.slice(0, 5).map((faq) => (
              <button
                key={faq.id}
                onClick={() => handleSendMessage(faq.question)}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-cyan-950/80 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 text-[10px] whitespace-nowrap transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {faq.question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          INPUT PROMPT FORM
          ========================================================================= */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 bg-slate-950 border-t border-slate-800/90 flex items-center gap-2 shrink-0"
      >
        <input
          ref={inputRef}
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask about fees, 9 events, rules, schedule, prizes..."
          disabled={isLoading}
          className="flex-1 px-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all"
        />

        <button
          type="submit"
          disabled={isLoading || !inputQuery.trim()}
          className="px-4 py-2.5 rounded-xl bg-[#00FF66] hover:bg-[#26ff7b] text-[#020403] font-bold text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(0,255,102,0.25)] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
        >
          <span>SEND</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};

export default AiChatAssistant;
