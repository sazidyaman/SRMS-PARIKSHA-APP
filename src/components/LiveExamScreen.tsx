import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SubjectKey } from '../types';
import { SUBJECT_DATA, SUBJECT_QUESTIONS } from '../data/subjects';
import { ScratchpadModal } from './ScratchpadModal';
import { QuestionPaletteModal } from './QuestionPaletteModal';
import { SubmitExamModal } from './SubmitExamModal';
import { ProctorWarningModal, IncidentRecord } from './ProctorWarningModal';
import { saveExamSubmissionToFirestore } from '../services/firebase';

interface LiveExamScreenProps {
  selectedSubject: SubjectKey;
  onFinishExam: () => void;
  onExitExam?: () => void;
}

export const LiveExamScreen: React.FC<LiveExamScreenProps> = ({
  selectedSubject,
  onFinishExam,
}) => {
  const subject = SUBJECT_DATA[selectedSubject];
  const questions = SUBJECT_QUESTIONS[selectedSubject] || SUBJECT_QUESTIONS.DAA;

  // LocalStorage storage key per subject
  const storageKey = `srms_live_exam_progress_${selectedSubject}`;

  // Read initial saved state from localStorage if present
  const savedState = (() => {
    try {
      const item = localStorage.getItem(storageKey);
      if (item) {
        return JSON.parse(item);
      }
    } catch (err) {
      console.warn('[LiveExam] Could not parse saved progress from localStorage:', err);
    }
    return null;
  })();

  // Active question index (1-based: 1..25)
  const [currentQIndex, setCurrentQIndex] = useState<number>(() => {
    return typeof savedState?.currentQIndex === 'number' ? savedState.currentQIndex : 8;
  });

  const [answers, setAnswers] = useState<Record<number, string>>(() => {
    if (savedState?.answers && typeof savedState.answers === 'object') {
      return savedState.answers;
    }
    return {
      1: 'A',
      2: 'A',
      3: 'B',
      5: 'A',
      6: 'C',
      7: 'A',
      8: 'A',
    };
  });

  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(() => {
    if (savedState?.flaggedQuestions && Array.isArray(savedState.flaggedQuestions)) {
      return new Set(savedState.flaggedQuestions);
    }
    return new Set([4, 8]);
  });

  const [examSeconds, setExamSeconds] = useState<number>(() => {
    return typeof savedState?.examSeconds === 'number'
      ? savedState.examSeconds
      : 1 * 3600 + 14 * 60 + 22;
  });

  // Modals state
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Proctoring Warning System State
  const [warningCount, setWarningCount] = useState<number>(() => {
    return typeof savedState?.warningCount === 'number' ? savedState.warningCount : 0;
  });

  const [incidents, setIncidents] = useState<IncidentRecord[]>(() => {
    return Array.isArray(savedState?.incidents) ? savedState.incidents : [];
  });

  const [activeWarning, setActiveWarning] = useState<{
    isOpen: boolean;
    strikeNumber: number;
    reason: string;
    timestamp: string;
  } | null>(null);

  // Real-time synchronization to localStorage whenever student answers or updates state
  useEffect(() => {
    try {
      const payload = {
        subjectKey: selectedSubject,
        currentQIndex,
        answers,
        flaggedQuestions: Array.from(flaggedQuestions),
        examSeconds,
        warningCount,
        incidents,
        lastSavedAt: new Date().toISOString(),
      };
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch (err) {
      console.warn('[LiveExam] Failed to persist progress to localStorage:', err);
    }
  }, [storageKey, selectedSubject, currentQIndex, answers, flaggedQuestions, warningCount, incidents]);

  // Periodic preservation of countdown timer (every 5 seconds)
  useEffect(() => {
    const timerSync = setInterval(() => {
      try {
        const item = localStorage.getItem(storageKey);
        if (item) {
          const parsed = JSON.parse(item);
          parsed.examSeconds = examSeconds;
          parsed.lastSavedAt = new Date().toISOString();
          localStorage.setItem(storageKey, JSON.stringify(parsed));
        }
      } catch {}
    }, 5000);
    return () => clearInterval(timerSync);
  }, [storageKey, examSeconds]);

  // Window beforeunload safeguard ensuring latest state is flushed on page reload/navigation
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        const payload = {
          subjectKey: selectedSubject,
          currentQIndex,
          answers,
          flaggedQuestions: Array.from(flaggedQuestions),
          examSeconds,
          warningCount,
          incidents,
          lastSavedAt: new Date().toISOString(),
        };
        localStorage.setItem(storageKey, JSON.stringify(payload));
      } catch {}
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [storageKey, selectedSubject, currentQIndex, answers, flaggedQuestions, examSeconds, warningCount, incidents]);

  // Refs to prevent false positives when user interacts with internal exam modals
  const isInternalModalOpenRef = useRef(false);
  const isAwayRef = useRef(false);
  const awayStartTimeRef = useRef(0);
  const lastTriggerTimeRef = useRef(0);

  useEffect(() => {
    isInternalModalOpenRef.current =
      isScratchpadOpen || isPaletteOpen || isSubmitModalOpen || (activeWarning?.isOpen ?? false);
  }, [isScratchpadOpen, isPaletteOpen, isSubmitModalOpen, activeWarning]);

  // Audio chime tone generator on warning trigger
  const playWarningTone = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        const audioCtx = new AudioContextClass();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.setValueAtTime(330, audioCtx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      }
    } catch {
      // Audio playback might be restricted if no user interaction; gracefully continue
    }
  }, []);

  // Dispatch a focus loss / tab switch warning
  const recordFocusLossWarning = useCallback(
    (reasonDescription: string) => {
      const now = Date.now();
      // Debounce consecutive rapid blur triggers within 1.5 seconds
      if (now - lastTriggerTimeRef.current < 1500) {
        return;
      }
      lastTriggerTimeRef.current = now;

      const timeStr = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      playWarningTone();

      setWarningCount((prevCount) => {
        const newStrike = prevCount + 1;
        const newIncident: IncidentRecord = {
          id: `inc-${now}`,
          time: timeStr,
          reason: reasonDescription,
          strikeNumber: newStrike,
        };

        setIncidents((prevInc) => [newIncident, ...prevInc]);

        setActiveWarning({
          isOpen: true,
          strikeNumber: newStrike,
          reason: reasonDescription,
          timestamp: timeStr,
        });

        return newStrike;
      });
    },
    [playWarningTone]
  );

  // Tab switching & focus loss listeners
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isAwayRef.current = true;
        awayStartTimeRef.current = Date.now();
      } else {
        if (isAwayRef.current) {
          isAwayRef.current = false;
          const secondsAway = Math.round((Date.now() - awayStartTimeRef.current) / 1000);
          const durationDetail =
            secondsAway > 0 ? `Away from exam window for ${secondsAway}s` : 'Tab switched away';
          recordFocusLossWarning(`Tab switch detected (${durationDetail})`);
        }
      }
    };

    const handleWindowBlur = () => {
      // If student clicks outside browser window or opens another window/app
      if (!document.hidden && !isInternalModalOpenRef.current && !isAwayRef.current) {
        isAwayRef.current = true;
        awayStartTimeRef.current = Date.now();
        recordFocusLossWarning('Window focus lost (Click outside or split-screen attempt)');
      }
    };

    const handleWindowFocus = () => {
      if (isAwayRef.current) {
        isAwayRef.current = false;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [recordFocusLossWarning]);

  // Exam timer
  useEffect(() => {
    const timer = setInterval(() => {
      setExamSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatExamTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h}h : ${String(m).padStart(2, '0')}m : ${String(s).padStart(2, '0')}s`;
  };

  // Map 1-based index to question in subject questions array (mod length)
  const activeQuestionData = questions[(currentQIndex - 1) % questions.length];

  // Visual Progress calculations (Questions completed vs remaining)
  const totalQuestions = 25;
  const completedCount = Object.keys(answers).filter((k) => !!answers[Number(k)]).length;
  const remainingCount = Math.max(0, totalQuestions - completedCount);
  const completedPercent = Math.round((completedCount / totalQuestions) * 100);
  const remainingPercent = 100 - completedPercent;

  const handleSelectOption = (optKey: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQIndex]: optKey,
    }));
  };

  const handleClear = () => {
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[currentQIndex];
      return copy;
    });
  };

  const handleToggleFlag = () => {
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(currentQIndex)) {
        next.delete(currentQIndex);
      } else {
        next.add(currentQIndex);
      }
      return next;
    });
  };

  const handleFlagAndNext = () => {
    handleToggleFlag();
    if (currentQIndex < 25) {
      setCurrentQIndex((prev) => prev + 1);
    }
  };

  const handleSaveAndContinue = () => {
    if (currentQIndex < 25) {
      setCurrentQIndex((prev) => prev + 1);
    } else {
      setIsSubmitModalOpen(true);
    }
  };

  const isCurrentFlagged = flaggedQuestions.has(currentQIndex);
  const currentSelectedOption = answers[currentQIndex];

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#131b2e] flex flex-col selection:bg-[#eaedff] select-none">
      {/* Top Institutional Bar */}
      <header className="fixed top-0 left-0 w-full z-40 flex justify-between items-center px-4 h-14 bg-[#faf8ff] shadow-xs border-b border-[#c4c5d5]/30">
        {/* Top Edge Full-Width Progress Accent */}
        <div className="absolute top-0 left-0 w-full h-[3px] bg-[#c4c5d5]/20 overflow-hidden">
          <div
            className="h-full bg-emerald-600 transition-all duration-300 ease-out"
            style={{ width: `${completedPercent}%` }}
          />
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#00288e] flex items-center justify-center text-white text-sm shadow-xs ring-1 ring-blue-900/20">
            <span className="material-symbols-outlined text-[18px]">school</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-[#00288e] tracking-tight leading-none">
              SRMS Pariksha
            </h1>
            <span className="text-[11px] text-[#444653] flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00563a] animate-pulse"></span>
              Secure Proctoring Mode
            </span>
          </div>
        </div>

        {/* Top Right Badges */}
        <div className="flex items-center gap-2">
          {warningCount > 0 && (
            <button
              onClick={() => {
                if (incidents.length > 0) {
                  const latest = incidents[0];
                  setActiveWarning({
                    isOpen: true,
                    strikeNumber: warningCount,
                    reason: latest.reason,
                    timestamp: latest.time,
                  });
                }
              }}
              title="Click to view Proctor Warning Incident Log"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all active:scale-95 shadow-xs ${
                warningCount >= 3
                  ? 'bg-red-100 border-red-500 text-red-800 animate-pulse ring-2 ring-red-400'
                  : 'bg-amber-100 border-amber-400 text-amber-900'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">warning</span>
              <span>
                {warningCount} {warningCount === 1 ? 'Strike' : 'Strikes'}
              </span>
            </button>
          )}

          {/* Local Persistence Status Badge */}
          <div
            title="All answers are continuously persisted in your local browser storage"
            className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-full px-2.5 py-1 text-[11px] font-medium shadow-xs"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="hidden sm:inline">Progress Auto-Saved</span>
            <span className="sm:hidden">Saved</span>
          </div>

          {/* AI Proctor Active Pill Badge */}
          <div className="flex items-center gap-1.5 bg-white border border-[#c4c5d5]/60 rounded-full px-2.5 py-1 shadow-xs">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-[11px] font-semibold text-[#131b2e] flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-[#00563a]">videocam</span>
              <span className="hidden sm:inline">AI Proctor</span> Active
            </span>
          </div>
        </div>
      </header>

      {/* Exam Metadata Sub-Header & Live Alert Timer */}
      <section className="fixed top-14 left-0 w-full z-30 bg-white border-b border-[#c4c5d5]/40 px-3.5 py-2.5 shadow-xs">
        <div className="flex items-center justify-between gap-2 max-w-lg mx-auto">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-sm font-bold text-[#131b2e] truncate">
                {subject.code}
              </span>
              <span className="text-[#c4c5d5] text-[10px]">•</span>
              <span className="text-xs font-semibold text-[#444653] truncate">
                {subject.shortName} ({subject.name})
              </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[11px] font-semibold text-[#00288e]">
                Question {currentQIndex} of 25
              </span>
              <span className="text-[#c4c5d5] text-[10px]">•</span>
              <span className="text-[11px] text-[#444653] font-mono">
                {activeQuestionData.marks.toFixed(1)} Marks
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Live Countdown Alert Pill */}
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl px-2.5 py-1 shadow-xs">
              <span
                className="material-symbols-outlined text-[15px] text-amber-700 animate-spin"
                style={{ animationDuration: '8s' }}
              >
                timer
              </span>
              <span className="font-mono text-xs font-bold tracking-tight text-amber-950">
                {formatExamTime(examSeconds)}
              </span>
            </div>

            {/* Bookmark / Flag Icon Action */}
            <button
              onClick={handleToggleFlag}
              aria-label="Flag Question for Review"
              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all active:scale-95 ${
                isCurrentFlagged
                  ? 'bg-amber-100 border-amber-400 text-amber-800'
                  : 'bg-white border-[#c4c5d5]/60 text-amber-600 hover:bg-amber-50'
              }`}
            >
              <span
                className="material-symbols-outlined text-[19px]"
                style={{ fontVariationSettings: isCurrentFlagged ? "'FILL' 1" : "'FILL' 0" }}
              >
                bookmark
              </span>
            </button>
          </div>
        </div>

        {/* Visual Progress Bar: Completed vs Remaining */}
        <div id="exam-progress-tracker" className="mt-2.5 pt-2 border-t border-[#c4c5d5]/25 max-w-lg mx-auto">
          <div className="flex items-center justify-between text-xs mb-1.5">
            {/* Completed Percentage & Count */}
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span className="font-bold text-emerald-800">
                {completedPercent}% Completed
              </span>
              <span className="text-[#64748b] text-[11px] font-mono">
                ({completedCount}/{totalQuestions})
              </span>
            </div>

            {/* Remaining Percentage & Count */}
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-300"></span>
              <span className="font-semibold text-[#444653]">
                {remainingPercent}% Remaining
              </span>
              <span className="text-[#64748b] text-[11px] font-mono">
                ({remainingCount} left)
              </span>
            </div>
          </div>

          {/* Dual-Tone Visual Progress Bar */}
          <div
            id="exam-progress-bar"
            className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex border border-[#c4c5d5]/40 shadow-inner"
            role="progressbar"
            aria-valuenow={completedPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Exam completion progress: ${completedPercent}% completed, ${remainingPercent}% remaining`}
          >
            <div
              className="h-full bg-emerald-600 transition-all duration-300 ease-out"
              style={{ width: `${completedPercent}%` }}
              title={`Completed: ${completedCount} questions (${completedPercent}%)`}
            />
            <div
              className="h-full bg-slate-200/80 transition-all duration-300 ease-out"
              style={{ width: `${remainingPercent}%` }}
              title={`Remaining: ${remainingCount} questions (${remainingPercent}%)`}
            />
          </div>
        </div>

        {/* Question Horizontal Flow / Progress Tracker */}
        <div className="mt-2.5 pt-2 border-t border-[#c4c5d5]/25 max-w-lg mx-auto">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 px-0.5">
            {Array.from({ length: 25 }, (_, i) => {
              const qNum = i + 1;
              const isCurrent = qNum === currentQIndex;
              const isAnswered = !!answers[qNum];
              const isFlagged = flaggedQuestions.has(qNum);

              let buttonStyle = 'bg-[#f2f3ff] border-[#c4c5d5]/50 text-[#444653] font-medium';
              if (isCurrent) {
                buttonStyle = 'bg-[#00288e] text-white font-bold ring-2 ring-amber-400 ring-offset-1 shadow-xs';
              } else if (isFlagged) {
                buttonStyle = 'bg-amber-50 border-amber-300 text-amber-800 font-bold';
              } else if (isAnswered) {
                buttonStyle = 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold';
              }

              return (
                <button
                  key={qNum}
                  onClick={() => setCurrentQIndex(qNum)}
                  className={`flex-shrink-0 w-8 h-8 rounded-lg border text-xs flex items-center justify-center transition-transform active:scale-95 ${buttonStyle}`}
                >
                  {qNum}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Scrollable Content: Active Question Workspace */}
      <main className="flex-1 w-full max-w-lg mx-auto pt-48 pb-36 px-4">
        {/* Active Proctoring Warning Alert Banner */}
        {warningCount > 0 && (
          <div
            className={`mb-3.5 p-3 rounded-xl border flex items-start justify-between gap-3 shadow-xs animate-fade-in ${
              warningCount >= 3
                ? 'bg-red-50/95 border-red-400 text-red-950'
                : 'bg-amber-50/95 border-amber-300 text-amber-950'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <span
                className={`material-symbols-outlined text-[20px] flex-shrink-0 mt-0.5 ${
                  warningCount >= 3 ? 'text-red-700' : 'text-amber-700'
                }`}
              >
                {warningCount >= 3 ? 'gpp_bad' : 'security_update_warning'}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                      warningCount >= 3
                        ? 'bg-red-200 text-red-900'
                        : 'bg-amber-200 text-amber-900'
                    }`}
                  >
                    Strike {warningCount}/3
                  </span>
                  <span className="text-xs font-bold">
                    {warningCount >= 3
                      ? 'Critical Disciplinary Warning'
                      : 'Integrity Alert: Activity Being Monitored'}
                  </span>
                </div>
                <p className="text-[11px] opacity-90 mt-1 leading-snug">
                  Your exam session is being actively monitored. Navigating away or switching tabs is logged to your student audit record.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (incidents.length > 0) {
                  const latest = incidents[0];
                  setActiveWarning({
                    isOpen: true,
                    strikeNumber: warningCount,
                    reason: latest.reason,
                    timestamp: latest.time,
                  });
                }
              }}
              className="text-[11px] font-bold underline whitespace-nowrap text-[#00288e] hover:text-[#1e40af] flex-shrink-0 mt-0.5"
            >
              View Log
            </button>
          </div>
        )}

        {/* Question Stem Card */}
        <article className="bg-white rounded-xl border border-[#c4c5d5]/50 p-4 shadow-[0_1px_3px_0_rgba(15,23,42,0.04)] mb-4 transition-all">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#eaedff] text-[#00288e] text-[11px] font-semibold">
              <span className="material-symbols-outlined text-[13px]">quiz</span>
              {activeQuestionData.category}
            </span>
            <span className="font-mono text-[11px] text-[#444653] bg-[#f2f3ff] px-2 py-0.5 rounded border border-[#c4c5d5]/30">
              ID: {activeQuestionData.id}
            </span>
          </div>

          <div className="text-base font-semibold text-[#131b2e] leading-snug">
            {activeQuestionData.stem}
          </div>

          {activeQuestionData.codeSnippet && (
            <p className="mt-2.5 text-[#444653] text-xs leading-relaxed bg-[#f2f3ff] p-2.5 rounded-lg border border-[#c4c5d5]/40 font-mono">
              {activeQuestionData.codeSnippet}
            </p>
          )}

          <div className="mt-2.5 flex items-center gap-2">
            <span className="text-[10px] text-[#757684] bg-slate-100 px-2 py-0.5 rounded">
              Unit: {activeQuestionData.topic}
            </span>
            <span className="text-[10px] text-[#0051d5] bg-[#eaedff] px-2 py-0.5 rounded font-medium">
              Taxonomy: {activeQuestionData.bloomCategory}
            </span>
          </div>
        </article>

        {/* Response Selection Matrix (Options A-D) */}
        <section aria-label="Question Options" className="space-y-3" role="radiogroup">
          {activeQuestionData.options.map((opt) => {
            const isSelected = currentSelectedOption === opt.key;

            return (
              <label
                key={opt.key}
                onClick={() => handleSelectOption(opt.key)}
                className={`relative flex items-start gap-3 p-3.5 rounded-xl cursor-pointer transition-all active:scale-[0.99] ${
                  isSelected
                    ? 'border-2 border-[#00288e] bg-[#f2f3ff] shadow-xs ring-1 ring-blue-900/20'
                    : 'border border-[#c4c5d5]/60 bg-white hover:bg-[#faf8ff]'
                }`}
              >
                <input
                  type="radio"
                  name={`question-${currentQIndex}`}
                  value={opt.key}
                  checked={isSelected}
                  onChange={() => handleSelectOption(opt.key)}
                  className="sr-only"
                />

                {/* Custom Stylized Radio Icon */}
                <div
                  className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 bg-white ${
                    isSelected ? 'border-[#00288e]' : 'border-[#757684]'
                  }`}
                >
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#00288e]" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-1">
                    <span
                      className={`text-sm font-bold ${
                        isSelected ? 'text-[#00288e]' : 'text-[#131b2e]'
                      }`}
                    >
                      {opt.label}
                    </span>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#00288e]">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        Selected
                      </span>
                    )}
                  </div>

                  {opt.code && (
                    <p className="mt-0.5 font-mono text-sm font-bold text-[#131b2e]">
                      {opt.code}
                    </p>
                  )}

                  <p className="mt-0.5 text-xs text-[#444653] leading-snug">
                    {opt.detail}
                  </p>
                </div>
              </label>
            );
          })}
        </section>

        {/* Proctor Advisory Note */}
        <div className="mt-5 p-3 rounded-lg bg-[#eaedff]/60 border border-[#c4c5d5]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[18px] text-[#00288e]">shield</span>
            <p className="text-[11px] text-[#444653] leading-tight">
              Webcam feed & window focus are continuously monitored. Navigating away triggers instant proctor alerts.
            </p>
          </div>
          <button
            type="button"
            onClick={() => recordFocusLossWarning('Simulated tab switch / window blur test')}
            className="self-start sm:self-auto text-[10px] font-semibold text-[#00288e] bg-white border border-[#c4c5d5] hover:bg-[#eaedff] px-2.5 py-1 rounded-md transition-all active:scale-95 flex items-center gap-1 flex-shrink-0 shadow-2xs"
            title="Test tab-switch detection"
          >
            <span className="material-symbols-outlined text-[13px]">tab_unresponsive</span>
            <span>Simulate Tab Switch (Test)</span>
          </button>
        </div>
      </main>

      {/* Sticky Bottom Navigation: Primary Question Touch Actions */}
      <section className="fixed bottom-12 left-0 w-full z-40 bg-white/95 backdrop-blur-md border-t border-[#c4c5d5]/30 px-3.5 py-2.5 shadow-[0_-3px_10px_rgba(15,23,42,0.05)]">
        <div className="max-w-lg mx-auto flex items-center gap-2">
          {/* Clear Response */}
          <button
            onClick={handleClear}
            className="h-10 px-3 rounded-lg border border-[#c4c5d5]/70 text-[#444653] text-xs font-semibold hover:bg-[#eaedff] hover:text-[#131b2e] active:scale-95 transition-all flex items-center justify-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">backspace</span>
            <span className="whitespace-nowrap">Clear</span>
          </button>

          {/* Flag & Next */}
          <button
            onClick={handleFlagAndNext}
            className="h-10 px-3.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-xs font-semibold hover:bg-amber-100 active:scale-95 transition-all flex items-center justify-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px] text-amber-700">bookmark</span>
            <span className="whitespace-nowrap">Flag & Next</span>
          </button>

          {/* Save & Continue */}
          <button
            onClick={handleSaveAndContinue}
            className="flex-1 h-10 px-4 rounded-lg bg-[#1e40af] text-white text-xs font-semibold hover:bg-[#00288e] active:scale-95 shadow-sm transition-all flex items-center justify-center gap-1.5"
          >
            <span>{currentQIndex === 25 ? 'Review & Finish' : 'Save & Continue'}</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </section>

      {/* Persistent Floating Emergency & Auxiliary Utility Rail */}
      <footer className="fixed bottom-0 left-0 w-full h-12 z-50 bg-[#283044] text-white px-3 flex items-center justify-between border-t border-[#283044] shadow-lg">
        <div className="w-full max-w-lg mx-auto flex items-center justify-between">
          {/* Scratchpad Digital modal trigger */}
          <button
            onClick={() => setIsScratchpadOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-white/10 text-[#d2d9f4] hover:text-white transition-all active:scale-95 text-xs font-medium"
          >
            <span className="material-symbols-outlined text-[16px]">draw</span>
            <span>Scratchpad (Digital)</span>
          </button>

          {/* Question Palette Drawer */}
          <button
            onClick={() => setIsPaletteOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-white/10 text-[#d2d9f4] hover:text-white transition-all active:scale-95 text-xs font-medium"
          >
            <span className="material-symbols-outlined text-[16px]">grid_view</span>
            <span>Question Palette</span>
          </button>

          {/* Submit Exam Button */}
          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1 rounded-md bg-[#ba1a1a] text-white hover:bg-red-700 text-xs font-bold shadow-xs transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[15px]">task_alt</span>
            <span>Submit Exam</span>
          </button>
        </div>
      </footer>

      {/* Digital Scratchpad Canvas Modal */}
      <ScratchpadModal
        isOpen={isScratchpadOpen}
        onClose={() => setIsScratchpadOpen(false)}
        subjectCode={subject.code}
      />

      {/* Question Palette Modal */}
      <QuestionPaletteModal
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        totalQuestions={25}
        currentQuestion={currentQIndex}
        answers={answers}
        flaggedQuestions={flaggedQuestions}
        onSelectQuestion={(qNum) => setCurrentQIndex(qNum)}
      />

      {/* Submit Exam Confirmation Modal */}
      <SubmitExamModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onConfirmSubmit={() => {
          setIsSubmitModalOpen(false);
          try {
            localStorage.removeItem(storageKey);
          } catch (err) {
            console.warn('[LiveExam] Failed to clear localStorage on submit:', err);
          }
          const score = Object.keys(answers).length * 4;
          saveExamSubmissionToFirestore({
            studentId: 'student-demo',
            studentName: 'Rahul Sen',
            rollNo: '2200040100084',
            subjectCode: subject.code,
            subjectName: subject.name,
            score,
            totalMarks: 100,
            warningsCount: warningCount,
            status: warningCount >= 3 ? 'flagged' : 'completed',
          }).catch((err) => console.warn('Firestore submission log failed:', err));
          onFinishExam();
        }}
        totalQuestions={25}
        answers={answers}
        flaggedCount={flaggedQuestions.size}
        subjectTitle={subject.name}
        subjectCode={subject.code}
      />

      {/* Proctor Warning Tab-Switch / Focus-Loss Alert Modal */}
      {activeWarning && (
        <ProctorWarningModal
          isOpen={activeWarning.isOpen}
          strikeNumber={activeWarning.strikeNumber}
          maxStrikes={3}
          reason={activeWarning.reason}
          timestamp={activeWarning.timestamp}
          incidents={incidents}
          onAcknowledge={() =>
            setActiveWarning((prev) => (prev ? { ...prev, isOpen: false } : null))
          }
        />
      )}
    </div>
  );
};
