import React, { useState } from 'react';

export interface IncidentRecord {
  id: string;
  time: string;
  reason: string;
  strikeNumber: number;
}

interface ProctorWarningModalProps {
  isOpen: boolean;
  strikeNumber: number;
  maxStrikes?: number;
  reason: string;
  timestamp: string;
  incidents: IncidentRecord[];
  onAcknowledge: () => void;
}

export const ProctorWarningModal: React.FC<ProctorWarningModalProps> = ({
  isOpen,
  strikeNumber,
  maxStrikes = 3,
  reason,
  timestamp,
  incidents,
  onAcknowledge,
}) => {
  const [showLogHistory, setShowLogHistory] = useState(false);

  if (!isOpen) return null;

  const isCritical = strikeNumber >= maxStrikes;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div
        className={`bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border-2 transition-all my-auto ${
          isCritical ? 'border-red-600 ring-4 ring-red-500/20' : 'border-amber-500 ring-4 ring-amber-500/20'
        }`}
      >
        {/* Urgent Header Banner */}
        <div
          className={`p-4 text-white flex items-center gap-3 ${
            isCritical ? 'bg-red-700' : 'bg-amber-600'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[24px]">
              {isCritical ? 'report' : 'warning'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold bg-white/20 px-1.5 py-0.5 rounded">
                AI Proctor Integrity Alert
              </span>
              <span className="text-[10px] font-mono opacity-90">{timestamp}</span>
            </div>
            <h3 className="font-bold text-sm leading-tight mt-0.5">
              {isCritical
                ? 'Critical Warning: Focus Loss Limit Reached'
                : 'Attention: Tab Switch / Focus Loss Detected'}
            </h3>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-3.5 text-xs text-[#131b2e]">
          {/* Strike Counter Progress Indicator */}
          <div className="bg-[#faf8ff] p-3 rounded-xl border border-[#c4c5d5]/60 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-[#444653] uppercase tracking-wide">Warning Level Tracker</span>
              <span
                className={`font-mono ${
                  isCritical ? 'text-red-700' : 'text-amber-800'
                }`}
              >
                Strike {strikeNumber} of {maxStrikes}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((num) => {
                const isPassed = strikeNumber >= num;
                const isCurrent = strikeNumber === num;
                return (
                  <div
                    key={num}
                    className={`py-1.5 px-2 rounded-lg text-center border font-mono text-[11px] font-bold transition-all ${
                      isCurrent
                        ? isCritical
                          ? 'bg-red-100 border-red-500 text-red-800 ring-2 ring-red-400'
                          : 'bg-amber-100 border-amber-500 text-amber-900 ring-2 ring-amber-400'
                        : isPassed
                        ? 'bg-red-50 border-red-300 text-red-700'
                        : 'bg-slate-100 border-slate-200 text-slate-400'
                    }`}
                  >
                    <span>Warning {num}</span>
                    {isCurrent && <span className="block text-[9px] font-sans font-semibold">Active</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Primary Monitoring Notice */}
          <div
            className={`p-3 rounded-xl border leading-relaxed space-y-1 ${
              isCritical
                ? 'bg-red-50/80 border-red-200 text-red-950'
                : 'bg-amber-50/80 border-amber-200 text-amber-950'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <span className="material-symbols-outlined text-[16px]">visibility</span>
              <span>Your activity is being actively monitored</span>
            </div>
            <p className="text-[11px] opacity-90">
              The SRMS Central Examination Board requires this examination to be taken in an uninterrupted full-screen session.
              Navigating away, switching browser tabs, or losing window focus is recorded on your institutional proctoring log.
            </p>
          </div>

          {/* Detected Incident Details */}
          <div className="bg-[#f2f3ff] p-3 rounded-xl border border-[#c4c5d5]/50 space-y-1.5 font-mono text-[11px]">
            <div className="flex items-center justify-between text-[#444653]">
              <span>Trigger Event:</span>
              <span className="font-bold text-[#131b2e] text-right truncate max-w-[200px]">
                {reason}
              </span>
            </div>
            <div className="flex items-center justify-between text-[#444653]">
              <span>Audit Gateway:</span>
              <span className="text-[#00288e] font-semibold">SRMS-SEC-PROCTOR-V3</span>
            </div>
            <div className="flex items-center justify-between text-[#444653]">
              <span>Recorded Status:</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                Logged to Faculty Console
              </span>
            </div>
          </div>

          {/* Severe notice if max strikes reached */}
          {isCritical && (
            <div className="p-2.5 rounded-lg bg-red-100 border border-red-300 text-red-900 text-[11px] font-semibold">
              ⚠️ Attention: Any subsequent infractions will cause your examination session to be locked and submitted directly for disciplinary review.
            </div>
          )}

          {/* Collapsible Incident History */}
          {incidents.length > 1 && (
            <div>
              <button
                type="button"
                onClick={() => setShowLogHistory(!showLogHistory)}
                className="text-[11px] font-semibold text-[#0051d5] hover:text-[#00288e] flex items-center gap-1"
              >
                <span>{showLogHistory ? 'Hide Incident History' : `View Incident History (${incidents.length} events)`}</span>
                <span className="material-symbols-outlined text-[15px]">
                  {showLogHistory ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {showLogHistory && (
                <div className="mt-2 max-h-28 overflow-y-auto space-y-1 bg-white border border-[#c4c5d5]/60 rounded-lg p-2">
                  {incidents.map((inc) => (
                    <div
                      key={inc.id}
                      className="text-[10px] flex items-center justify-between text-[#444653] py-0.5 border-b border-slate-100 last:border-0"
                    >
                      <span className="font-mono font-bold text-amber-800">
                        Strike #{inc.strikeNumber} ({inc.time}):
                      </span>
                      <span className="truncate max-w-[190px]">{inc.reason}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Acknowledge Button */}
          <button
            onClick={onAcknowledge}
            className={`w-full py-2.5 px-4 rounded-xl text-white font-bold text-xs shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 ${
              isCritical
                ? 'bg-red-700 hover:bg-red-800'
                : 'bg-[#00288e] hover:bg-[#1e40af]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">verified_user</span>
            <span>I Acknowledge & Return to Assessment</span>
          </button>
        </div>
      </div>
    </div>
  );
};
