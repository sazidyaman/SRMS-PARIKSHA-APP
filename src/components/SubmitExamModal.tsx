import React from 'react';
import confetti from 'canvas-confetti';

interface SubmitExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSubmit: () => void;
  totalQuestions: number;
  answers: Record<number, string>;
  flaggedCount: number;
  subjectTitle: string;
  subjectCode: string;
}

export const SubmitExamModal: React.FC<SubmitExamModalProps> = ({
  isOpen,
  onClose,
  onConfirmSubmit,
  totalQuestions,
  answers,
  flaggedCount,
  subjectTitle,
  subjectCode,
}) => {
  if (!isOpen) return null;

  const answeredCount = Object.keys(answers).length;
  const unansweredCount = totalQuestions - answeredCount;

  const handleSubmit = () => {
    // Fire celebratory confetti for academic submission
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
    onConfirmSubmit();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-[#c4c5d5]/60 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Top Alert Header */}
        <div className="bg-[#ba1a1a] text-white p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[24px]">task_alt</span>
          </div>
          <div>
            <h3 className="font-bold text-base leading-tight">Confirm Exam Submission</h3>
            <p className="text-xs text-red-100 mt-0.5">Formal Final Response Lock</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3.5">
          <div className="p-2.5 rounded-xl bg-[#f2f3ff] border border-[#c4c5d5]/40 text-xs space-y-1">
            <span className="font-mono text-[10px] text-[#00288e] font-bold bg-[#eaedff] px-1.5 py-0.5 rounded">
              {subjectCode}
            </span>
            <h4 className="font-bold text-[#131b2e] text-sm">{subjectTitle}</h4>
            <p className="text-[11px] text-[#444653]">Internal Assessment II (Theory & Analysis)</p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0]">
              <span className="font-bold text-base text-[#065F46] block">{answeredCount}</span>
              <span className="text-[10px] text-[#065F46] font-semibold">Answered</span>
            </div>
            <div className="p-2 rounded-xl bg-amber-50 border border-amber-300">
              <span className="font-bold text-base text-amber-900 block">{flaggedCount}</span>
              <span className="text-[10px] text-amber-800 font-semibold">Flagged</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-100 border border-slate-200">
              <span className="font-bold text-base text-slate-700 block">{unansweredCount}</span>
              <span className="text-[10px] text-slate-600 font-semibold">Skipped</span>
            </div>
          </div>

          <p className="text-xs text-[#444653] leading-relaxed">
            Once submitted, your examination telemetry and responses will be locked with SHA-256 digital signature and transmitted to the Examination Controller. You cannot alter responses after confirmation.
          </p>

          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-[#eaedff] text-[#00288e] text-[11px] font-medium">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            <span>Tamper-proof digital transcript will be generated.</span>
          </div>
        </div>

        {/* Actions */}
        <div className="p-3 bg-[#faf8ff] border-t border-[#c4c5d5]/40 flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-3 rounded-xl border border-[#c4c5d5] bg-white text-xs font-semibold text-[#444653] hover:bg-slate-50 transition-colors"
          >
            Review Questions
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-2 px-3 rounded-xl bg-[#ba1a1a] text-white text-xs font-bold hover:bg-red-700 transition-colors shadow-sm flex items-center justify-center gap-1"
          >
            <span>Confirm & Submit</span>
            <span className="material-symbols-outlined text-[16px]">lock</span>
          </button>
        </div>
      </div>
    </div>
  );
};
