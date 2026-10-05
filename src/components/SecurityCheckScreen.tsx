import React, { useState, useEffect } from 'react';
import { SubjectKey, UserProfile } from '../types';
import { SUBJECT_DATA } from '../data/subjects';

interface SecurityCheckScreenProps {
  selectedSubject: SubjectKey;
  onBack: () => void;
  onLaunchExam: () => void;
  currentUser?: UserProfile | null;
}

export const SecurityCheckScreen: React.FC<SecurityCheckScreenProps> = ({
  selectedSubject,
  onBack,
  onLaunchExam,
  currentUser,
}) => {
  const [honorChecked, setHonorChecked] = useState(true);
  const [lobbySeconds, setLobbySeconds] = useState(4 * 60 + 26);
  const [audioBars, setAudioBars] = useState([2, 3, 1.5, 1, 1]);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueSubmitted, setIssueSubmitted] = useState(false);

  const subject = SUBJECT_DATA[selectedSubject];
  const rollNumber = currentUser?.universityRollNo || currentUser?.identifier || '2400100100084';
  const photoUrl = currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80';

  // Lobby countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setLobbySeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Audio wave animation simulation
  useEffect(() => {
    const audioInterval = setInterval(() => {
      setAudioBars([
        1.5 + Math.random() * 2,
        2 + Math.random() * 2.5,
        1 + Math.random() * 1.5,
        0.8 + Math.random() * 1.2,
        0.5 + Math.random() * 1,
      ]);
    }, 400);
    return () => clearInterval(audioInterval);
  }, []);

  const formatLobbyTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}m : ${s}s until exam opens`;
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#131b2e] pb-36 flex flex-col justify-between">
      {/* Top Security Header Bar */}
      <header className="sticky top-0 z-40 bg-[#faf8ff] border-b border-[#c4c5d5]/40 px-4 h-14 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-2">
          <button
            onClick={onBack}
            aria-label="Go Back"
            className="w-8 h-8 rounded flex items-center justify-center text-[#444653] hover:bg-[#eaedff] transition-colors duration-150 active:scale-95"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div>
            <h1 className="text-sm font-bold text-[#00288e] leading-tight">
              Security Check & Identity Verification
            </h1>
            <p className="text-[11px] text-[#444653] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-ping inline-block"></span>
              Gateway Proctor v4.2.19
            </p>
          </div>
        </div>

        {/* 256-bit Encrypted Lock Badge */}
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#eaedff] border border-[#c4c5d5]/60 shadow-xs">
          <span className="material-symbols-outlined text-[#00288e] text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            lock
          </span>
          <span className="font-mono text-[11px] text-[#00288e] font-bold tracking-tight">
            256-BIT SSL
          </span>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="w-full max-w-md mx-auto px-4 pt-3 pb-6 flex-1 flex flex-col gap-4">
        {/* Subject Header Info Banner */}
        <section className="bg-white rounded-xl p-4 border border-[#c4c5d5] shadow-sm relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-[#eaedff] rounded-full pointer-events-none opacity-50"></div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <span className="inline-block px-2 py-0.5 rounded bg-[#e2e7ff] text-[#00288e] text-[11px] mb-1 font-semibold">
                MID-SEMESTER EXAM
              </span>
              <h2 className="text-base font-bold text-[#131b2e]">
                {subject.code}: {subject.name} Mid-Term II
              </h2>
            </div>
            <span className="flex items-center gap-1 px-2 py-1 rounded bg-[#f2f3ff] border border-[#c4c5d5] font-mono text-[11px] text-[#00288e] font-semibold">
              <span className="material-symbols-outlined text-[14px]">shield</span>
              PROCTORED
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#c4c5d5]/50">
            <div className="flex flex-col">
              <span className="text-[11px] text-[#444653]">Weightage</span>
              <span className="text-sm text-[#131b2e] font-semibold">50 Marks</span>
            </div>
            <div className="flex flex-col border-l border-[#c4c5d5]/40 pl-3">
              <span className="text-[11px] text-[#444653]">Duration</span>
              <span className="text-sm text-[#131b2e] font-semibold">90 mins</span>
            </div>
            <div className="flex flex-col border-l border-[#c4c5d5]/40 pl-3">
              <span className="text-[11px] text-[#444653]">Slot Code</span>
              <span className="font-mono text-xs text-[#0051d5] font-semibold">SLOT-B2</span>
            </div>
          </div>
        </section>

        {/* Checklist Status Bar */}
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-semibold text-[#444653] uppercase tracking-wider">
            PRE-FLIGHT AUDIT PROTOCOL
          </span>
          <span className="text-[11px] text-[#00563a] font-semibold bg-[#85f8c4]/30 px-2 py-0.5 rounded-full border border-[#68dba9]">
            3 of 3 Verified
          </span>
        </div>

        {/* Card 1: Student Biometric Verification */}
        <section className="bg-white rounded-xl p-4 border border-[#c4c5d5] shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#eaedff] flex items-center justify-center text-[#00288e]">
                <span className="material-symbols-outlined text-[18px]">drafts</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#131b2e]">Student Biometric Verification</h3>
                <p className="text-[11px] text-[#444653]">Neural Facial Recognition & Roll ID Binding</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#059669]"></span>
              Verified
            </span>
          </div>

          {/* Camera Preview Box with HUD Overlay */}
          <div className="relative w-full h-44 bg-[#d2d9f4] rounded-lg overflow-hidden border border-[#c4c5d5] flex items-center justify-center">
            <img
              src={photoUrl}
              alt="Live Biometric Feed"
              className="w-full h-full object-cover"
            />

            {/* Scanning HUD Overlay */}
            <div className="absolute inset-0 bg-blue-900/10 flex items-center justify-center pointer-events-none">
              <div className="relative w-32 h-32 rounded-full border-2 border-dashed border-[#85f8c4] pulse-halo flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-[#85f8c4] border-t-transparent animate-radar"></div>
                {/* Crosshairs */}
                <div className="w-4 h-0.5 bg-[#85f8c4] absolute"></div>
                <div className="h-4 w-0.5 bg-[#85f8c4] absolute"></div>
              </div>
            </div>

            {/* Real-time Verification Tag Overlay */}
            <div className="absolute bottom-2 left-2 right-2 bg-slate-900/85 backdrop-blur-xs text-white rounded-lg px-2.5 py-1.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#85f8c4] text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                <span className="text-[11px] text-white">Face & Roll No Matched 99.2%</span>
              </div>
              <span className="font-mono text-[11px] text-[#85f8c4]">
                {rollNumber}
              </span>
            </div>

            <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-[#ba1a1a]/90 text-white font-mono text-[10px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
              LIVE IR
            </div>
          </div>
        </section>

        {/* Card 2: Camera & Mic Permissions */}
        <section className="bg-white rounded-xl p-4 border border-[#c4c5d5] shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#eaedff] flex items-center justify-center text-[#00288e]">
                <span className="material-symbols-outlined text-[18px]">videocam</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#131b2e]">Camera & Mic Permissions</h3>
                <p className="text-[11px] text-[#444653]">Continuous Environmental Surveillance</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#059669]"></span>
              Audited
            </span>
          </div>

          <div className="space-y-2 bg-[#faf8ff] rounded-lg p-2.5 border border-[#c4c5d5]/60 text-xs">
            {/* Front Camera */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00288e] text-[18px]">photo_camera_front</span>
                <span className="text-[#131b2e] font-medium">Front HD Camera Active</span>
              </div>
              <span className="font-mono text-[#00563a] text-[11px] font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">check</span> 1080p @ 30fps
              </span>
            </div>

            {/* Audio & Decibel Level */}
            <div className="flex items-center justify-between pt-2 border-t border-[#c4c5d5]/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00288e] text-[18px]">mic</span>
                <span className="text-[#131b2e] font-medium">Ambient Sound: 24dB (Quiet - Passed)</span>
              </div>
              <div className="flex items-center gap-0.5" title="Acoustic Level">
                {audioBars.map((h, i) => (
                  <span
                    key={i}
                    className="w-1 rounded bg-[#00563a] transition-all duration-300"
                    style={{ height: `${h * 4}px` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Card 3: Mobile Lockdown & Integrity Check */}
        <section className="bg-white rounded-xl p-4 border border-[#c4c5d5] shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#eaedff] flex items-center justify-center text-[#00288e]">
                <span className="material-symbols-outlined text-[18px]">phonelink_lock</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#131b2e]">Mobile Lockdown & Integrity Check</h3>
                <p className="text-[11px] text-[#444653]">OS Sandbox & Anticheat Enforcement</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#059669]"></span>
              Enforced
            </span>
          </div>

          <div className="grid grid-cols-1 gap-1.5 text-xs">
            <div className="flex items-center justify-between p-2 rounded bg-[#faf8ff] border border-[#c4c5d5]/50">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00288e] text-[16px]">app_blocking</span>
                <span className="text-[#131b2e]">Single-App Kiosk Mode Ready</span>
              </div>
              <span className="material-symbols-outlined text-[#00563a] text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-[#faf8ff] border border-[#c4c5d5]/50">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00288e] text-[16px]">do_not_disturb_on</span>
                <span className="text-[#131b2e]">Do Not Disturb / Notification Block Enabled</span>
              </div>
              <span className="material-symbols-outlined text-[#00563a] text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-[#faf8ff] border border-[#c4c5d5]/50">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00288e] text-[16px]">screen_share</span>
                <span className="text-[#131b2e]">Screen Recording Blocked</span>
              </div>
              <span className="material-symbols-outlined text-[#00563a] text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified
              </span>
            </div>
          </div>
        </section>

        {/* Card 4: Institutional Honor Code & Declaration */}
        <section className="bg-white rounded-xl p-4 border border-[#c4c5d5] shadow-sm flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <input
              id="honor-checkbox"
              type="checkbox"
              checked={honorChecked}
              onChange={(e) => setHonorChecked(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-[#c4c5d5] text-[#00288e] focus:ring-[#00288e] cursor-pointer"
            />
            <label htmlFor="honor-checkbox" className="cursor-pointer select-none">
              <span className="block text-sm font-bold text-[#131b2e] mb-0.5">
                Honor Code & Academic Declaration
              </span>
              <span className="block text-xs text-[#444653] leading-relaxed">
                I affirm that I will uphold academic integrity and adhere to the SRMS Code of Conduct. I understand that leaving the app, splitting screens, or abnormal biometric movement triggers instant disqualification.
              </span>
            </label>
          </div>
        </section>
      </main>

      {/* Sticky Bottom Container */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md px-4 py-3 shadow-[0_-4px_12px_rgba(15,23,42,0.06)] flex flex-col items-center gap-2 border-t border-[#c4c5d5]/40">
        <div className="w-full max-w-md flex flex-col gap-2">
          {/* Countdown Banner */}
          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#eaedff] border border-[#c4c5d5]/60">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00288e] text-[18px]">timer</span>
              <span className="text-xs text-[#444653]">Lobby State:</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-xs text-[#00288e] font-bold">
              <span>{formatLobbyTime(lobbySeconds)}</span>
            </div>
          </div>

          {/* Primary Action Button: Launch Exam */}
          <button
            onClick={onLaunchExam}
            disabled={!honorChecked}
            className={`w-full h-11 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] ${
              honorChecked
                ? 'bg-[#00288e] text-white hover:bg-[#0051d5]'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">lock_open</span>
            <span>Launch Mobile Exam Kiosk</span>
          </button>

          {/* Secondary Help Link */}
          <div className="flex items-center justify-center">
            <button
              onClick={() => setShowIssueModal(true)}
              className="text-xs text-[#444653] hover:text-[#00288e] transition-colors flex items-center gap-1 py-0.5"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">contact_support</span>
              <span>Report Issue to Invigilator</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Report Issue Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-4 shadow-xl border border-[#c4c5d5] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#c4c5d5]/40">
              <h4 className="font-bold text-sm text-[#131b2e] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#00288e] text-[18px]">contact_support</span>
                Proctor Incident Dispatch
              </h4>
              <button
                onClick={() => {
                  setShowIssueModal(false);
                  setIssueSubmitted(false);
                }}
                className="text-[#757684]"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {issueSubmitted ? (
              <div className="p-3 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                  <span className="material-symbols-outlined">check</span>
                </div>
                <p className="text-xs font-semibold text-[#065F46]">Alert Transmitted to Invigilator Desk</p>
                <p className="text-[11px] text-[#444653]">Assigned Invigilator (Desk #04) notified for Kiosk 42.</p>
                <button
                  onClick={() => {
                    setShowIssueModal(false);
                    setIssueSubmitted(false);
                  }}
                  className="w-full py-1.5 bg-[#00288e] text-white text-xs rounded-lg font-semibold"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <p className="text-xs text-[#444653]">
                  Select the issue you are encountering with the pre-flight verification:
                </p>
                <div className="space-y-1.5 text-xs">
                  {['Facial lighting recognition delay', 'Microphone calibration check failed', 'Screen kiosk permission issue', 'Other hardware inquiry'].map((issue, idx) => (
                    <label key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-[#f2f3ff] cursor-pointer hover:bg-[#eaedff]">
                      <input type="radio" name="issue_reason" defaultChecked={idx === 0} className="text-[#00288e]" />
                      <span className="text-[#131b2e]">{issue}</span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowIssueModal(false)}
                    className="flex-1 py-1.5 border border-[#c4c5d5] rounded-xl text-xs font-semibold text-[#444653]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setIssueSubmitted(true)}
                    className="flex-1 py-1.5 bg-[#00288e] text-white rounded-xl text-xs font-semibold hover:bg-[#1e40af]"
                  >
                    Dispatch Invigilator
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
