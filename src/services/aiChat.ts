/**
 * AI Chat Assistant API Service for Zinnia 2026
 * Connects securely to the Flask backend without exposing any API keys to React.
 */

export type ChatSource = 'faq' | 'cache' | 'rag' | 'llm' | 'llm_fallback' | 'fallback';

export interface SourceCitation {
  title: string;
  type: string;
}

export interface ChatResponse {
  answer: string;
  source: ChatSource;
  cached: boolean;
  confidence?: number;
  matched_question?: string;
  provider?: string;
  sources?: SourceCitation[];
  error?: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  source?: ChatSource;
  cached?: boolean;
  confidence?: number;
  matched_question?: string;
  provider?: string;
  sources?: SourceCitation[];
  isError?: boolean;
}

export interface SuggestedFaq {
  id: string;
  question: string;
  category: string;
}

export interface HealthStatus {
  status: string;
  symposium: string;
  knowledge_chunks_indexed: number;
  cache: {
    total_entries: number;
    total_hits: number;
  };
  primary_llm_provider: string;
  secondary_llm_provider: string;
}

const API_BASE = '/api';

/**
 * Send a user query to the RAG backend
 */
export async function sendChatMessage(question: string): Promise<ChatResponse> {
  const trimmed = question.trim();
  if (!trimmed) {
    throw new Error('Question cannot be empty.');
  }

  try {
    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question: trimmed }),
    });

    if (response.status === 429) {
      return {
        answer: 'Rate limit exceeded. Please wait a moment before asking another question.',
        source: 'fallback',
        cached: false,
        error: 'Too many requests'
      };
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with status ${response.status}`);
    }

    const data: ChatResponse = await response.json();
    return data;
  } catch (error: any) {
    console.error('AI Chat Error:', error);
    // Return graceful fallback message
    return {
      answer: `Network connection issue: Could not reach the symposium AI Core. Please check your connection or contact the coordinators directly at zinnia2026@gceerode.ac.in.`,
      source: 'fallback',
      cached: false,
      error: error.message || 'Connection failure'
    };
  }
}

/**
 * Fetch suggested FAQ questions for quick action buttons
 */
export async function fetchSuggestedFaqs(): Promise<SuggestedFaq[]> {
  try {
    const response = await fetch(`${API_BASE}/faq`);
    if (!response.ok) return getDefaultFaqs();
    const data = await response.json();
    return data.faqs && data.faqs.length > 0 ? data.faqs : getDefaultFaqs();
  } catch {
    return getDefaultFaqs();
  }
}

/**
 * Fallback static FAQs if backend is not yet started
 */
export function getDefaultFaqs(): SuggestedFaq[] {
  return [
    { id: 'fee', question: "What is the registration fee?", category: "Registration" },
    { id: 'events', question: "What events are available?", category: "Events" },
    { id: 'venue', question: "Where is the symposium located?", category: "Venue" },
    { id: 'deadline', question: "When does registration close?", category: "Registration" },
    { id: 'eligibility', question: "What are the eligibility rules?", category: "Eligibility" },
    { id: 'food', question: "Is lunch provided?", category: "Food" },
    { id: 'prizes', question: "What is the total prize pool?", category: "Prizes" }
  ];
}

/**
 * Check backend health status
 */
export async function checkAssistantHealth(): Promise<HealthStatus | null> {
  try {
    const response = await fetch(`${API_BASE}/health`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}
