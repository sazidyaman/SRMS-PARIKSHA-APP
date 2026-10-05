import React from 'react';
import { ScheduledExam, UserProfile } from '../types';

interface AdmitSlipModalProps {
  exam: ScheduledExam | null;
  onClose: () => void;
  avatarUrl?: string;
  currentUser?: UserProfile | null;
}

export const AdmitSlipModal: React.FC<AdmitSlipModalProps> = ({ exam, onClose, avatarUrl, currentUser }) => {
  if (!exam) return null;

  const candidateName = currentUser?.name || 'Enrolled Student';
  const candidateRoll = currentUser?.universityRollNo || currentUser?.identifier || '2400100100084';
  const candidateReg = currentUser?.collegeRegNo || 'SRMS/2026/BTECH/CSE/084';
  const candidateDegree = currentUser?.degree || 'B.Tech CS • Sem V';
  const candidateAvatar = avatarUrl || currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-[#c4c5d5]/60 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-[#00288e] text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">badge</span>
            <div>
              <h3 className="text-sm font-bold leading-tight">Official Exam Hall Ticket</h3>
              <p className="text-[11px] text-blue-200">SRMS Pariksha Examination Cell</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Modal Body: Hall Ticket Content */}
        <div className="p-4 space-y-3.5 max-h-[80vh] overflow-y-auto">
          {/* Candidate Badge */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#f2f3ff] border border-[#c4c5d5]/50">
            <img
              src={candidateAvatar}
              alt={candidateName}
              className="w-12 h-12 rounded-xl object-cover border border-[#c4c5d5]"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-[#131b2e] truncate">{candidateName}</h4>
                <span className="text-[10px] font-semibold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] px-1.5 py-0.5 rounded">
                  VERIFIED
                </span>
              </div>
              <div className="mt-1 space-y-0.5">
                <div className="text-[11px]">
                  <span className="text-[#757684]">AKTU Roll: </span>
                  <span className="font-mono text-[#00288e] font-bold">{candidateRoll}</span>
                </div>
                <div className="text-[11px]">
                  <span className="text-[#757684]">College Reg: </span>
                  <span className="font-mono text-[#131b2e] font-semibold">{candidateReg}</span>
                </div>
              </div>
              <p className="text-[11px] text-[#444653] mt-0.5">{candidateDegree} • SRMS Bareilly (Code 010)</p>
            </div>
          </div>

          {/* Exam Details */}
          <div className="bg-white rounded-xl border border-[#c4c5d5]/60 p-3 space-y-2 text-xs">
            <div className="flex justify-between items-start pb-2 border-b border-[#c4c5d5]/40">
              <div>
                <span className="font-mono text-[10px] font-bold bg-[#eaedff] text-[#00288e] px-1.5 py-0.5 rounded">
                  {exam.code}
                </span>
                <h5 className="font-bold text-sm text-[#131b2e] mt-1">{exam.title}</h5>
              </div>
              <span className="text-[11px] font-semibold text-[#0051d5] bg-[#eaedff] px-2 py-0.5 rounded">
                {exam.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-[#444653]">
              <div>
                <span className="text-[10px] text-[#757684] block">Schedule Slot</span>
                <span className="font-medium text-[#131b2e]">{exam.dateLabel}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#757684] block">Assigned Venue</span>
                <span className="font-medium text-[#131b2e]">{exam.venue}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#757684] block">Duration</span>
                <span className="font-medium text-[#131b2e]">{exam.durationMinutes} Minutes</span>
              </div>
              <div>
                <span className="text-[10px] text-[#757684] block">Max Marks</span>
                <span className="font-medium text-[#131b2e]">{exam.maxMarks} Points</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#c4c5d5]/30">
              <span className="text-[10px] text-[#757684] block mb-0.5">Syllabus Scope</span>
              <p className="text-[11px] text-[#444653] leading-relaxed bg-[#faf8ff] p-2 rounded border border-[#c4c5d5]/30">
                {exam.syllabus}
              </p>
            </div>
          </div>

          {/* Institutional Barcode / Security Seal */}
          <div className="p-3 bg-[#faf8ff] rounded-xl border border-dashed border-[#c4c5d5] flex flex-col items-center justify-center text-center">
            {/* Simulated Barcode */}
            <div className="flex items-center gap-0.5 h-8 my-1 px-4">
              {[4, 2, 6, 1, 8, 3, 5, 2, 7, 3, 1, 4, 6, 2, 5, 3, 7, 2, 4, 6, 1, 8].map((w, i) => (
                <div
                  key={i}
                  className="bg-slate-800 h-full"
                  style={{ width: `${w * 1.5}px` }}
                />
              ))}
            </div>
            <span className="font-mono text-[10px] text-[#757684] tracking-widest">
              SLOT-{exam.code}-2024-SRMS-094
            </span>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[#00563a] font-medium">
              <span className="material-symbols-outlined text-[15px]">verified</span>
              <span>Encrypted Signature • Registrar of Examinations</span>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-3 bg-[#f2f3ff] border-t border-[#c4c5d5]/50 flex items-center gap-2">
          <button
            onClick={() => {
              window.print();
            }}
            className="flex-1 py-2 px-3 rounded-xl bg-[#00288e] text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#1e40af] transition-colors shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            <span>Print / Save PDF</span>
          </button>
          <button
            onClick={onClose}
            className="py-2 px-4 rounded-xl border border-[#c4c5d5] bg-white text-xs font-semibold text-[#444653] hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
