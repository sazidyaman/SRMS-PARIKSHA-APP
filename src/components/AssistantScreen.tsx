import React, { useState, useEffect, useRef } from 'react';
import { SubjectKey, UserProfile } from '../types';
import { SUBJECT_DATA } from '../data/subjects';
import {
  saveChatMessageToFirestore,
  subscribeToUserChatMessages,
  ChatMessageRecord,
} from '../services/firebase';

interface AssistantScreenProps {
  selectedSubject: SubjectKey;
  onSelectSubject: (key: SubjectKey) => void;
  currentUser?: UserProfile | null;
  onBack?: () => void;
}

export type ChatRoleMode = 'general' | 'fast' | 'complex';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  role?: string;
  text: string;
  time: string;
  modelUsed?: string;
  subjectKey?: string;
}

export const AssistantScreen: React.FC<AssistantScreenProps> = ({
  selectedSubject,
  onSelectSubject,
  currentUser,
  onBack,
}) => {
  const subject = SUBJECT_DATA[selectedSubject];
  const [roleMode, setRoleMode] = useState<ChatRoleMode>('general');
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRoleInfo, setShowRoleInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Local storage key for fallback persistence
  const localCacheKey = `srms_gemini_chat_${currentUser?.id || 'demo'}_${selectedSubject}`;

  // Initial welcome message
  const getWelcomeMessage = (subjName: string, subjCode: string, mode: ChatRoleMode): ChatMessage => {
    let modeIntro = 'General Academic Mentor (gemini-3.5-flash)';
    if (mode === 'fast') modeIntro = 'Quick Revision Flashcard Bot (gemini-3.1-flash-lite)';
    if (mode === 'complex') modeIntro = 'Deep Algorithm & Proof Specialist (gemini-3.1-pro-preview)';

    return {
      id: 'welcome-' + Date.now(),
      sender: 'ai',
      text: `Hello ${currentUser?.name || 'Student'}! I am your **SRMS Pariksha AI Academic Assistant** configured as **${modeIntro}** for **${subjName} (${subjCode})**.\n\nAsk me any syllabus doubts, complexity derivations, proofs, or exam pacing advice!`,
      time: 'Just now',
      modelUsed: mode === 'complex' ? 'gemini-3.1-pro-preview' : mode === 'fast' ? 'gemini-3.1-flash-lite' : 'gemini-3.5-flash',
      subjectKey: selectedSubject,
    };
  };

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const cached = localStorage.getItem(localCacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return [getWelcomeMessage(subject.name, subject.code, 'general')];
  });

  // Subscribe to real-time Firestore chat history if logged in
  useEffect(() => {
    if (!currentUser?.id) return;

    const unsubscribe = subscribeToUserChatMessages(currentUser.id, (firestoreMsgs) => {
      if (firestoreMsgs && firestoreMsgs.length > 0) {
        // Filter messages for the current subject or display all recent ones
        const subjectMsgs = firestoreMsgs
          .filter((m) => !m.subjectKey || m.subjectKey === selectedSubject)
          .map((m) => ({
            id: m.id || 'msg-' + Math.random(),
            sender: m.sender,
            role: m.role,
            text: m.text,
            time: m.time || 'Saved',
            modelUsed: m.modelUsed,
            subjectKey: m.subjectKey,
          }));

        if (subjectMsgs.length > 0) {
          setMessages(subjectMsgs);
          try {
            localStorage.setItem(localCacheKey, JSON.stringify(subjectMsgs));
          } catch {}
        }
      }
    });

    return () => unsubscribe();
  }, [currentUser?.id, selectedSubject, localCacheKey]);

  // Save to local cache on update
  useEffect(() => {
    try {
      localStorage.setItem(localCacheKey, JSON.stringify(messages));
    } catch {}
  }, [messages, localCacheKey]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Subject-specific quick prompts
  const SUBJECT_QUICK_PROMPTS: Record<SubjectKey, string[]> = {
    DAA: [
      'Derive Master Theorem with 3 cases',
      'Explain Dijkstra vs Bellman-Ford on DAGs',
      'Dynamic Programming: 0/1 Knapsack recurrence',
      'Show P vs NP and NP-Complete reductions',
    ],
    DBMS: [
      'Prove 3NF vs BCNF dependency preservation',
      'Explain Conflict Serializability & Precedence Graphs',
      'ACID Properties and WAL logging steps',
      'Show B+ Tree split & merge mechanics',
    ],
    WT: [
      'Explain JavaScript Event Loop & Microtasks',
      'Show CSS Flexbox vs Grid layout flow',
      'REST vs GraphQL: Over-fetching trade-offs',
      'JWT Authentication & Refresh token rotation',
    ],
    MLT: [
      'Compare L1 Lasso vs L2 Ridge geometric loss',
      'Explain Gradient Descent with Momentum & Adam',
      'Bias-Variance trade-off and Overfitting remedies',
      'ROC-AUC Curve interpretation and formulas',
    ],
    DA: [
      'Explain P-Value interpretation & Hypothesis Testing',
      'Tukey Fences: Box plot IQR outlier bounds',
      'Central Limit Theorem assumptions & proof',
      'Covariance vs Pearson Correlation Coefficient',
    ],
    COI: [
      'Explain Article 32 Writs with Supreme Court powers',
      'Kesavananda Bharati: Basic Structure Doctrine',
      'Fundamental Rights vs Directive Principles (DPSP)',
      'Emergency Provisions under Articles 352, 356, 360',
    ],
  };

  const currentPrompts = SUBJECT_QUICK_PROMPTS[selectedSubject] || SUBJECT_QUICK_PROMPTS.DAA;

  // Role details mapping
  const ROLE_CONFIG = {
    general: {
      model: 'gemini-3.5-flash',
      title: 'General Tutor',
      subtitle: 'Comprehensive conceptual guide & exam doubt solver',
      icon: 'school',
      badgeClass: 'bg-blue-50 text-[#00288e] border-blue-200',
    },
    fast: {
      model: 'gemini-3.1-flash-lite',
      title: 'Fast Revision',
      subtitle: 'Lightning-fast formulas, definitions, and high-yield notes',
      icon: 'bolt',
      badgeClass: 'bg-amber-50 text-amber-900 border-amber-200',
    },
    complex: {
      model: 'gemini-3.1-pro-preview',
      title: 'Deep Proofs',
      subtitle: 'Rigorous mathematical derivations, step-by-step algorithms',
      icon: 'psychology',
      badgeClass: 'bg-purple-50 text-purple-900 border-purple-200',
    },
  };

  const handleSend = async (queryText?: string) => {
    const q = queryText || inputQuery;
    if (!q.trim() || isLoading) return;

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMessage: ChatMessage = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      text: q.trim(),
      time: timeNow,
      subjectKey: selectedSubject,
    };

    // Optimistically append user message
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputQuery('');
    setIsLoading(true);

    // Persist user message to Firestore
    if (currentUser?.id) {
      saveChatMessageToFirestore(currentUser.id, {
        sender: 'user',
        text: userMessage.text,
        time: userMessage.time,
        subjectKey: selectedSubject,
      });
    }

    try {
      // Build conversation history for multi-turn chat
      // Map prior messages into { role: 'user' | 'model', text: string }
      const historyPayload = messages.slice(-10).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyPayload,
          newMessage: userMessage.text,
          roleMode,
          subject: `${subject.name} (${subject.code}) - ${subject.department}`,
          userProfile: {
            name: currentUser?.name || 'Student',
            role: currentUser?.role || 'student',
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned error status ${res.status}`);
      }

      const data = await res.json();
      const replyText = data.reply || 'No response returned.';
      const modelUsed = data.modelUsed || ROLE_CONFIG[roleMode].model;

      const aiMessage: ChatMessage = {
        id: 'ai-' + Date.now(),
        sender: 'ai',
        role: roleMode,
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed,
        subjectKey: selectedSubject,
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Persist AI reply to Firestore
      if (currentUser?.id) {
        saveChatMessageToFirestore(currentUser.id, {
          sender: 'ai',
          role: roleMode,
          text: replyText,
          time: aiMessage.time,
          modelUsed,
          subjectKey: selectedSubject,
        });
      }
    } catch (err: any) {
      console.error('Chat error:', err);

      // Safe fallback response if network fails
      const fallbackAiMessage: ChatMessage = {
        id: 'err-' + Date.now(),
        sender: 'ai',
        role: roleMode,
        text: `**Notice**: Could not connect to the Gemini backend API right now. Please verify that the server is running and check your connection.\n\n*Quick Advice for ${subject.shortName}*: Review previous year exam question trends, practice recurrence formulas, and write neat diagrams for full marks!`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'offline-fallback',
        subjectKey: selectedSubject,
      };
      setMessages((prev) => [...prev, fallbackAiMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Clear conversation history for this subject?')) {
      const fresh = [getWelcomeMessage(subject.name, subject.code, roleMode)];
      setMessages(fresh);
      try {
        localStorage.removeItem(localCacheKey);
      } catch {}
    }
  };

  // Simple clean markdown-like renderer
  const renderMessageContent = (text: string) => {
    // Process markdown headers, code blocks, bold text, and lists
    const lines = text.split('\n');
    return (
      <div className="space-y-1.5 leading-relaxed break-words">
        {lines.map((line, idx) => {
          if (!line.trim()) {
            return <div key={idx} className="h-1" />;
          }

          // Code block indicator or inline code
          if (line.startsWith('```')) {
            return null; // Basic fence skipper
          }

          // Header line
          if (line.startsWith('### ')) {
            return (
              <h4 key={idx} className="font-bold text-sm text-[#00288e] pt-1">
                {line.replace('### ', '')}
              </h4>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h3 key={idx} className="font-bold text-base text-[#00288e] pt-1">
                {line.replace('## ', '')}
              </h3>
            );
          }
          if (line.startsWith('# ')) {
            return (
              <h2 key={idx} className="font-bold text-lg text-[#00288e] pt-1">
                {line.replace('# ', '')}
              </h2>
            );
          }

          // Bullet points
          if (line.startsWith('- ') || line.startsWith('* ')) {
            const content = line.substring(2);
            return (
              <div key={idx} className="flex items-start gap-2 ml-1 text-xs">
                <span className="text-[#00288e] font-bold">•</span>
                <span>{renderInlineFormatting(content)}</span>
              </div>
            );
          }

          // Numbered lists
          const numMatch = line.match(/^(\d+)\.\s(.*)/);
          if (numMatch) {
            return (
              <div key={idx} className="flex items-start gap-2 ml-1 text-xs">
                <span className="font-bold text-[#00288e] min-w-[14px]">{numMatch[1]}.</span>
                <span>{renderInlineFormatting(numMatch[2])}</span>
              </div>
            );
          }

          return (
            <p key={idx} className="text-xs">
              {renderInlineFormatting(line)}
            </p>
          );
        })}
      </div>
    );
  };

  // Helper for bold and inline code
  const renderInlineFormatting = (str: string) => {
    // Replace **bold** with <strong> and `code` with <code className="...">
    const parts = str.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-[#131b2e]">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={i}
            className="px-1.5 py-0.5 mx-0.5 rounded-sm bg-[#eaedff] text-[#00288e] font-mono text-[11px]"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#131b2e] pb-24 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 left-0 w-full z-40 bg-[#faf8ff]/95 backdrop-blur-md border-b border-[#c4c5d5]/40 px-4 py-2.5 shadow-xs">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {onBack && (
              <button
                onClick={onBack}
                className="w-8 h-8 rounded-lg border border-[#c4c5d5]/50 flex items-center justify-center hover:bg-[#eaedff] text-[#444653]"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              </button>
            )}
            <div className="w-9 h-9 rounded-xl bg-[#00288e] text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[22px]">smart_toy</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold text-[#00288e]">SRMS Gemini AI Assistant</h1>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Multi-Turn
                </span>
              </div>
              <p className="text-[11px] text-[#444653]">
                {subject.shortName} • {ROLE_CONFIG[roleMode].model}
              </p>
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowRoleInfo(!showRoleInfo)}
              title="System Instructions & Role Roles"
              className="px-2 py-1 rounded-lg border border-[#c4c5d5]/60 bg-white text-xs text-[#00288e] font-medium flex items-center gap-1 hover:bg-[#eaedff]"
            >
              <span className="material-symbols-outlined text-[15px]">info</span>
              <span className="hidden sm:inline">Role Info</span>
            </button>
            <button
              onClick={handleClearChat}
              title="Clear conversation"
              className="w-8 h-8 rounded-lg border border-[#c4c5d5]/60 bg-white flex items-center justify-center text-[#757684] hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <span className="material-symbols-outlined text-[17px]">restart_alt</span>
            </button>
          </div>
        </div>

        {/* Multi-role Selector & Model Mapping Pills */}
        <div className="max-w-2xl mx-auto mt-2 pt-2 border-t border-[#c4c5d5]/20 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-semibold text-[#444653] flex-shrink-0 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">tune</span>
            Role:
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setRoleMode('fast')}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 ${
                roleMode === 'fast'
                  ? 'bg-amber-100 text-amber-900 border-amber-400 shadow-xs'
                  : 'bg-white text-[#444653] border-[#c4c5d5]/60 hover:bg-[#eaedff]'
              }`}
            >
              <span className="material-symbols-outlined text-[13px]">bolt</span>
              <span>Fast (Flash-Lite)</span>
            </button>

            <button
              onClick={() => setRoleMode('general')}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 ${
                roleMode === 'general'
                  ? 'bg-[#00288e] text-white border-[#00288e] shadow-xs'
                  : 'bg-white text-[#444653] border-[#c4c5d5]/60 hover:bg-[#eaedff]'
              }`}
            >
              <span className="material-symbols-outlined text-[13px]">school</span>
              <span>General (3.5 Flash)</span>
            </button>

            <button
              onClick={() => setRoleMode('complex')}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 ${
                roleMode === 'complex'
                  ? 'bg-purple-700 text-white border-purple-800 shadow-xs'
                  : 'bg-white text-[#444653] border-[#c4c5d5]/60 hover:bg-[#eaedff]'
              }`}
            >
              <span className="material-symbols-outlined text-[13px]">psychology</span>
              <span>Complex (3.1 Pro)</span>
            </button>
          </div>
        </div>

        {/* Subject Switcher Bar */}
        <div className="max-w-2xl mx-auto mt-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {(['DAA', 'DBMS', 'WT', 'MLT', 'DA', 'COI'] as SubjectKey[]).map((key) => {
            const isSel = selectedSubject === key;
            return (
              <button
                key={key}
                onClick={() => onSelectSubject(key)}
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md transition-all ${
                  isSel
                    ? 'bg-[#00288e] text-white'
                    : 'bg-white text-[#444653] border border-[#c4c5d5]/50 hover:bg-[#eaedff]'
                }`}
              >
                {key}
              </button>
            );
          })}
        </div>
      </header>

      {/* Role & System Instruction Drawer/Banner */}
      {showRoleInfo && (
        <div className="max-w-2xl mx-auto w-full px-4 pt-2">
          <div className="bg-white border border-[#c4c5d5] rounded-xl p-3 shadow-xs text-xs space-y-1.5">
            <div className="flex items-center justify-between font-bold text-[#00288e]">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                Active System Instruction & Role Configuration
              </span>
              <button
                onClick={() => setShowRoleInfo(false)}
                className="text-[#757684] hover:text-[#131b2e]"
              >
                ✕
              </button>
            </div>
            <p className="text-[#444653]">
              <strong>Role:</strong> {ROLE_CONFIG[roleMode].title} — {ROLE_CONFIG[roleMode].subtitle}
            </p>
            <p className="text-[#444653]">
              <strong>Active Model:</strong> <code className="bg-[#eaedff] text-[#00288e] px-1 rounded">{ROLE_CONFIG[roleMode].model}</code>
            </p>
            <p className="text-[#444653]">
              <strong>Data Persistence:</strong> Full multi-turn conversation history is preserved in Firestore (<code>users/{currentUser?.id || 'demo'}/messages</code>) and synchronized in real-time.
            </p>
          </div>
        </div>
      )}

      {/* Scrollable Message Thread */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-4 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-3.5">
          {/* Quick Prompts */}
          <div className="bg-white border border-[#c4c5d5]/50 rounded-xl p-2.5 shadow-xs">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#00288e] mb-1.5">
              <span className="material-symbols-outlined text-[15px]">tips_and_updates</span>
              Suggested Exam Questions for {subject.shortName}:
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {currentPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(p)}
                  disabled={isLoading}
                  className="flex-shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-[#eaedff] text-[#00288e] hover:bg-[#d2d9f4] transition-colors border border-[#c4c5d5]/40 disabled:opacity-50"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation History */}
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1 mb-1 px-1 text-[10px] text-[#757684]">
                  {!isUser && (
                    <span className="font-semibold text-[#00288e] flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[12px]">smart_toy</span>
                      Gemini
                    </span>
                  )}
                  {m.modelUsed && (
                    <span className="bg-[#eaedff] text-[#00288e] px-1.5 py-0.2 rounded-full font-mono text-[9px]">
                      {m.modelUsed}
                    </span>
                  )}
                  <span>• {m.time}</span>
                </div>

                <div
                  className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-xs ${
                    isUser
                      ? 'bg-[#00288e] text-white rounded-br-xs'
                      : 'bg-white border border-[#c4c5d5]/60 text-[#131b2e] rounded-bl-xs'
                  }`}
                >
                  {renderMessageContent(m.text)}
                </div>
              </div>
            );
          })}

          {/* Loading Typing Indicator */}
          {isLoading && (
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-[#757684]">
                <span className="font-semibold text-[#00288e]">Gemini</span>
                <span className="bg-[#eaedff] text-[#00288e] px-1.5 py-0.2 rounded-full font-mono text-[9px]">
                  {ROLE_CONFIG[roleMode].model}
                </span>
                <span>• Generating response...</span>
              </div>
              <div className="bg-white border border-[#c4c5d5]/60 rounded-2xl rounded-bl-xs p-3 flex items-center gap-2 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#00288e] animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-[#00288e] animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-[#00288e] animate-bounce [animation-delay:0.4s]"></span>
                <span className="text-xs text-[#757684] ml-1">Analyzing curriculum & formulating proof...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Docked Sticky Input Bar */}
      <footer className="fixed bottom-14 left-0 right-0 bg-[#faf8ff]/95 backdrop-blur-md border-t border-[#c4c5d5]/30 p-2.5 z-40">
        <div className="max-w-2xl mx-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 bg-white rounded-xl border border-[#c4c5d5] p-1.5 shadow-sm focus-within:border-[#00288e] focus-within:ring-1 focus-within:ring-[#00288e] transition-all"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={`Ask syllabus question for ${subject.shortName} (${ROLE_CONFIG[roleMode].title})...`}
              className="flex-1 text-xs px-3 py-2 outline-none bg-transparent"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isLoading}
              className="w-9 h-9 rounded-lg bg-[#00288e] text-white flex items-center justify-center hover:bg-[#1e40af] disabled:opacity-40 transition-colors flex-shrink-0"
              title="Send message"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </form>
          <div className="flex items-center justify-between text-[10px] text-[#757684] px-1 mt-1">
            <span>Powered by Gemini Models • Conversation auto-saved to Firestore</span>
            <span>Role: {ROLE_CONFIG[roleMode].title}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
