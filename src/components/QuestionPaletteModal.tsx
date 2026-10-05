import React from 'react';

interface QuestionPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalQuestions: number;
  currentQuestion: number;
  answers: Record<number, string>;
  flaggedQuestions: Set<number>;
  onSelectQuestion: (index: number) => void;
}

export const QuestionPaletteModal: React.FC<QuestionPaletteModalProps> = ({
  isOpen,
  onClose,
  totalQuestions,
  currentQuestion,
  answers,
  flaggedQuestions,
  onSelectQuestion,
}) => {
  if (!isOpen) return null;

  const answeredCount = Object.keys(answers).length;
  const flaggedCount = flaggedQuestions.size;
  const unansweredCount = totalQuestions - answeredCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-[#c4c5d5]/60 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#00288e] text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">grid_view</span>
            <div>
              <h3 className="text-sm font-bold leading-tight">Question Navigator Palette</h3>
              <p className="text-[11px] text-blue-200">25 Total Assessment Items</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Legend */}
        <div className="px-4 py-2.5 bg-[#f2f3ff] border-b border-[#c4c5d5]/40 grid grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#059669] flex-shrink-0"></span>
            <span className="text-[#444653] font-medium">{answeredCount} Answered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500 flex-shrink-0"></span>
            <span className="text-[#444653] font-medium">{flaggedCount} Flagged</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#eaedff] border border-[#c4c5d5] flex-shrink-0"></span>
            <span className="text-[#444653] font-medium">{unansweredCount} Unanswered</span>
          </div>
        </div>

        {/* Grid of 25 items */}
        <div className="p-4 overflow-y-auto">
          <div className="grid grid-cols-5 gap-2.5">
            {Array.from({ length: totalQuestions }, (_, i) => {
              const qNum = i + 1;
              const isCurrent = qNum === currentQuestion;
              const isAnswered = !!answers[qNum];
              const isFlagged = flaggedQuestions.has(qNum);

              let style = 'bg-[#f2f3ff] border-[#c4c5d5] text-[#444653]';
              if (isCurrent) {
                style = 'bg-[#00288e] text-white ring-2 ring-amber-400 ring-offset-1 font-bold';
              } else if (isFlagged) {
                style = 'bg-amber-100 border-amber-400 text-amber-900 font-bold';
              } else if (isAnswered) {
                style = 'bg-emerald-100 border-emerald-400 text-emerald-900 font-bold';
              }

              return (
                <button
                  key={qNum}
                  onClick={() => {
                    onSelectQuestion(qNum);
                    onClose();
                  }}
                  className={`h-11 rounded-xl border flex flex-col items-center justify-center text-xs font-semibold transition-all active:scale-95 ${style}`}
                >
                  <span>{qNum}</span>
                  {isFlagged && <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-0.5" />}
                  {isAnswered && !isFlagged && !isCurrent && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#faf8ff] border-t border-[#c4c5d5]/40 flex justify-end">
          <button
            onClick={onClose}
            className="py-1.5 px-4 rounded-xl bg-[#00288e] text-white text-xs font-semibold hover:bg-[#1e40af] transition-colors"
          >
            Close Palette
          </button>
        </div>
      </div>
    </div>
  );
};
