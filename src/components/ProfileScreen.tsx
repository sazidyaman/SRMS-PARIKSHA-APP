import React, { useState } from 'react';
import { SubjectKey, UserProfile, LeaveApplication } from '../types';
import { SUBJECT_DATA, SCHEDULED_EXAMS } from '../data/subjects';
import { AdmitSlipModal } from './AdmitSlipModal';

interface ProfileScreenProps {
  onSelectSubject: (key: SubjectKey) => void;
  onNavigateToResults: () => void;
  currentUser?: UserProfile | null;
  onOpenAdmitCardPDF?: () => void;
  onSignOut?: () => void;
  onOpenAvatarPicker?: () => void;
  onOpenLeaveModal?: () => void;
  onOpenAdmissionModal?: () => void;
  leaveApplications?: LeaveApplication[];
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onSelectSubject,
  onNavigateToResults,
  currentUser,
  onOpenAdmitCardPDF,
  onSignOut,
  onOpenAvatarPicker,
  onOpenLeaveModal,
  onOpenAdmissionModal,
  leaveApplications = [],
}) => {
  const [selectedAdmitExam, setSelectedAdmitExam] = useState(SCHEDULED_EXAMS[0]);
  const [showAdmitModal, setShowAdmitModal] = useState(false);

  const isAdmin = currentUser?.role === 'admin';
  const isFaculty = currentUser?.role === 'faculty';
  const isStudent = !isAdmin && !isFaculty;

  const name = currentUser?.name || (isAdmin ? 'Dr. Prabhakar Gupta' : isFaculty ? 'Dr. Ashutosh Pandey' : 'Enrolled Student');
  const identifier = currentUser?.identifier || currentUser?.universityRollNo || (isAdmin ? 'SRMS-ADMIN-001' : 'Not Assigned');
  const universityRollNo = currentUser?.universityRollNo || currentUser?.identifier || 'Not Assigned';
  const collegeRegNo = currentUser?.collegeRegNo || 'Not Assigned';
  const avatar = currentUser?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
  const department = currentUser?.department || (isAdmin ? 'Administration & Examination Directorate' : 'Department of Computer Science & Engineering');

  const ALL_SUBJECTS: SubjectKey[] = ['DAA', 'DBMS', 'WT', 'MLT', 'DA', 'COI'];

  // Check which exams have been actually completed and submitted by this student
  const submittedExamRecord = (() => {
    if (!isStudent) return null;
    try {
      const saved = localStorage.getItem('srms_last_submitted_exam');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  })();

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#131b2e] pb-24">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-40 bg-[#faf8ff] border-b border-[#c4c5d5]/30 px-4 h-14 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#eaedff] text-[#00288e] flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">
              {isAdmin ? 'admin_panel_settings' : isFaculty ? 'co_present' : 'person'}
            </span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-[#00288e]">
              {isAdmin
                ? 'Chief Academic Directorate Profile'
                : isFaculty
                ? 'Faculty Institutional Profile'
                : 'Student Institutional Profile'}
            </h1>
            <p className="text-[11px] text-[#444653]">
              {isAdmin ? 'SRMS Institutional Executive Suite' : 'SRMS Examination Portal'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 text-xs font-semibold transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">logout</span>
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-md mx-auto pt-16 px-4 space-y-4">
        {/* ID Card: Tailored by Role (Admin / Faculty / Student) */}
        <section className="bg-white rounded-2xl p-4 border border-[#c4c5d5] shadow-xs relative overflow-hidden">
          <div className="flex items-start gap-3.5">
            <div
              onClick={onOpenAvatarPicker}
              className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#00288e] flex-shrink-0 group cursor-pointer shadow-xs"
              title="Click to customize profile avatar"
            >
              <img
                src={avatar}
                alt={name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              <div className="absolute inset-0 bg-slate-900/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[9px] font-bold">
                <i className="fas fa-camera text-xs mb-0.5"></i>
                <span>Change</span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#131b2e] truncate">{name}</h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
                  isAdmin
                    ? 'text-purple-800 bg-purple-100 border border-purple-200'
                    : isFaculty
                    ? 'text-blue-800 bg-blue-100 border border-blue-200'
                    : 'text-[#00288e] bg-[#eaedff]'
                }`}>
                  {isAdmin ? 'CHIEF CONTROLLER' : isFaculty ? 'FACULTY' : 'STUDENT'}
                </span>
              </div>

              {isAdmin ? (
                <div className="mt-1 space-y-0.5">
                  <p className="text-xs font-mono text-[#00288e] font-bold">
                    Directorate ID: {identifier}
                  </p>
                  <p className="text-xs text-[#444653] font-medium">
                    {currentUser?.designation || 'Principal & Chief Academic Controller'}
                  </p>
                </div>
              ) : isFaculty ? (
                <div className="mt-1 space-y-0.5">
                  <p className="text-xs font-mono text-[#00288e] font-semibold">
                    Employee ID: {currentUser?.employeeId || identifier}
                  </p>
                  <p className="text-xs text-[#444653]">
                    {currentUser?.designation || 'Associate Professor & Evaluator'}
                  </p>
                  {currentUser?.teachingSemester && (
                    <p className="text-[11px] text-[#0051d5] font-medium">
                      Teaching: {currentUser.teachingSemester}
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-1 space-y-0.5">
                  <div className="text-[11px] leading-tight">
                    <span className="text-[#757684]">AKTU Roll: </span>
                    <span className="font-mono font-bold text-[#00288e]">{universityRollNo}</span>
                  </div>
                  <div className="text-[11px] leading-tight">
                    <span className="text-[#757684]">College Reg: </span>
                    <span className="font-mono font-semibold text-[#131b2e]">{collegeRegNo}</span>
                  </div>
                  <p className="text-xs text-[#444653] mt-0.5">
                    {currentUser?.degree || 'B.Tech CS • Sem V (3rd Year)'}
                  </p>
                </div>
              )}

              <p className="text-[11px] text-[#757684] mt-1">
                {department} • Code: 010
              </p>
            </div>
          </div>

          {/* Metric Pills */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[#c4c5d5]/40 text-center">
            {isAdmin ? (
              <>
                <div className="bg-[#f2f3ff] p-2 rounded-xl">
                  <span className="text-[10px] text-[#757684] block font-medium">Authority</span>
                  <span className="text-xs font-bold text-purple-800">Executive</span>
                </div>
                <div className="bg-[#f2f3ff] p-2 rounded-xl">
                  <span className="text-[10px] text-[#757684] block font-medium">Supervision</span>
                  <span className="text-sm font-bold text-[#00288e] font-mono">6 Disciplines</span>
                </div>
                <div className="bg-[#f2f3ff] p-2 rounded-xl">
                  <span className="text-[10px] text-[#757684] block font-medium">Affiliation</span>
                  <span className="text-xs font-bold text-emerald-700 font-mono">AKTU 010</span>
                </div>
              </>
            ) : isFaculty ? (
              <>
                <div className="bg-[#f2f3ff] p-2 rounded-xl">
                  <span className="text-[10px] text-[#757684] block font-medium">Primary Course</span>
                  <span className="text-xs font-bold text-[#059669] font-mono">
                    {currentUser?.primarySubject || 'DAA'}
                  </span>
                </div>
                <div className="bg-[#f2f3ff] p-2 rounded-xl">
                  <span className="text-[10px] text-[#757684] block font-medium">Department</span>
                  <span className="text-xs font-bold text-[#00288e] truncate block">
                    {currentUser?.department?.replace('Department of ', '') || 'CSE'}
                  </span>
                </div>
                <div className="bg-[#f2f3ff] p-2 rounded-xl">
                  <span className="text-[10px] text-[#757684] block font-medium">Semester</span>
                  <span className="text-xs font-bold text-[#131b2e] truncate block">
                    {currentUser?.teachingSemester?.split('(')[0].trim() || 'Sem V'}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="bg-[#f2f3ff] p-2 rounded-xl">
                  <span className="text-[10px] text-[#757684] block font-medium">Status</span>
                  <span className="text-xs font-bold text-[#059669]">Enrolled Active</span>
                </div>
                <div className="bg-[#f2f3ff] p-2 rounded-xl">
                  <span className="text-[10px] text-[#757684] block font-medium">Attendance</span>
                  <span className="text-sm font-bold text-[#00288e] font-mono">
                    {currentUser?.attendance || 'Active (100%)'}
                  </span>
                </div>
                <div className="bg-[#f2f3ff] p-2 rounded-xl">
                  <span className="text-[10px] text-[#757684] block font-medium">Academic CGPA</span>
                  <span className="text-xs font-bold text-[#131b2e] font-mono">
                    {currentUser?.cgpa || 'Pending Evaluation'}
                  </span>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Change Avatar Action Bar */}
        <div className="flex items-center justify-between bg-blue-50/70 border border-blue-200 rounded-xl p-2.5 px-3">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-[#00288e] text-white flex items-center justify-center text-xs">
              <i className="fas fa-camera"></i>
            </span>
            <div className="text-left">
              <span className="text-xs font-bold text-slate-800 block leading-tight">
                Profile Portrait Avatar
              </span>
              <span className="text-[10px] text-slate-500">
                Preset avatars, local photo upload or custom URL
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenAvatarPicker}
            className="px-3 py-1.5 bg-[#00288e] hover:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <i className="fas fa-user-edit text-[11px]"></i>
            <span>Edit Avatar</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* ADMIN EXCLUSIVE SECTION: Institutional Governance & Controls   */}
        {/* ============================================================== */}
        {isAdmin && (
          <section className="bg-white rounded-2xl p-4 border border-[#c4c5d5] shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-purple-100 text-purple-900 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
              </span>
              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  Institutional Directorate Credentials
                </h3>
                <p className="text-[10px] text-slate-500">
                  AKTU Center 010 Administration & Examination Governance
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-[#444653] pt-1">
              <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-medium">AKTU Examination Center:</span>
                <span className="font-bold text-purple-900 font-mono">010 • SRMS CET Bareilly</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-medium">AI Proctoring Kiosk Mode:</span>
                <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Operational & Sealed
                </span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-medium">Supervised Academic Cohort:</span>
                <span className="font-bold text-[#00288e]">B.Tech 2024–28 Session</span>
              </div>
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* STUDENT ONLY: Leave Application Section                        */}
        {/* ============================================================== */}
        {isStudent && (
          <section className="bg-white rounded-2xl p-4 border border-[#c4c5d5] shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <i className="fas fa-file-signature text-[16px]"></i>
                </span>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    Attendance Leave Application
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Sickness, severe weather, or personal emergencies
                  </p>
                </div>
              </div>
              {leaveApplications.filter(
                (a) =>
                  (a.studentName.toLowerCase() === name.toLowerCase() ||
                    a.aktuRollNo === universityRollNo ||
                    a.collegeRegNo === collegeRegNo) &&
                  a.status === 'pending'
              ).length > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300 animate-pulse">
                  {
                    leaveApplications.filter(
                      (a) =>
                        (a.studentName.toLowerCase() === name.toLowerCase() ||
                          a.aktuRollNo === universityRollNo ||
                          a.collegeRegNo === collegeRegNo) &&
                        a.status === 'pending'
                    ).length
                  }{' '}
                  Pending
                </span>
              ) : (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  AMS Active
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              Submit formal absence requests to notify your assigned faculty mentor and excuse biometric attendance for lectures and practical labs.
            </p>

            <button
              type="button"
              onClick={onOpenLeaveModal}
              className="w-full py-2 px-3 rounded-xl bg-[#00288e] hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <i className="fas fa-paper-plane text-[11px]"></i>
              <span>Apply for Leave / View History</span>
            </button>
          </section>
        )}

        {/* ============================================================== */}
        {/* STUDENT ONLY: Download Official Admit Card Banner              */}
        {/* ============================================================== */}
        {isStudent && (
          <section className="bg-gradient-to-r from-[#00288e] to-[#0051d5] text-white rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-amber-300">badge</span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Examination Hall Ticket
                </h3>
              </div>
              <p className="text-sm font-bold leading-snug">Official Admit Card (PDF)</p>
              <p className="text-[11px] text-blue-100">
                Authorized for all 6 subjects • Kiosk Hall A-101
              </p>
            </div>
            <button
              onClick={onOpenAdmitCardPDF}
              className="flex-shrink-0 px-3.5 py-2 bg-white hover:bg-blue-50 text-[#00288e] rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
              <span>Download PDF</span>
            </button>
          </section>
        )}

        {/* College Admissions, Documents & Pre-Registration Banner (Available to All) */}
        {onOpenAdmissionModal && (
          <section className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-amber-700">account_balance</span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  Admissions Directorate & Helplines
                </h3>
              </div>
              <p className="text-sm font-bold text-[#131b2e] leading-snug">
                Upcoming Sessions Pre-Registration & Fees
              </p>
              <p className="text-[11px] text-[#444653]">
                Checklist of required certificates, fee payment guidelines & official portal (srms.ac.in/cet)
              </p>
            </div>
            <button
              onClick={onOpenAdmissionModal}
              className="flex-shrink-0 px-3.5 py-2 bg-[#00288e] hover:bg-[#1e40af] text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">explore</span>
              <span>Open Desk</span>
            </button>
          </section>
        )}

        {/* ============================================================== */}
        {/* STUDENT ONLY: Biometric Verification Audit Certificate         */}
        {/* ============================================================== */}
        {isStudent && (
          <section className="bg-[#f2f3ff] rounded-xl p-3.5 border border-[#c4c5d5]/60 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00288e] text-[20px]">fingerprint</span>
                <h3 className="text-xs font-bold text-[#131b2e]">Biometric & Exam Security Status</h3>
              </div>
              <span className="text-[10px] font-bold text-[#065F46] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded">
                SEALED
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-[#444653]">
              <div className="flex justify-between">
                <span>Facial Recognition Match:</span>
                <span className="font-mono font-semibold text-[#065F46]">99.2% (Passed)</span>
              </div>
              <div className="flex justify-between">
                <span>AKTU University Roll Binding:</span>
                <span className="font-mono font-semibold text-[#00288e]">{universityRollNo}</span>
              </div>
              <div className="flex justify-between">
                <span>College Reg / RFID Binding:</span>
                <span className="font-mono font-semibold text-[#131b2e]">{collegeRegNo}</span>
              </div>
              <div className="flex justify-between">
                <span>Institute & Center:</span>
                <span className="font-semibold text-[#131b2e]">010 • SRMS CET Bareilly</span>
              </div>
              <div className="flex justify-between">
                <span>Proctoring Mode Compatibility:</span>
                <span className="font-semibold text-[#00288e]">Full-Screen Kiosk Approved</span>
              </div>
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* CURRICULUM & SUBJECTS SECTION: Separated by Role               */}
        {/* ============================================================== */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-0.5">
            <h3 className="text-sm font-bold text-[#131b2e]">
              {isAdmin
                ? `Supervised Academic Disciplines (${ALL_SUBJECTS.length})`
                : isFaculty
                ? `Assigned Evaluation Modules (${ALL_SUBJECTS.length})`
                : `Enrolled Term Subjects (${ALL_SUBJECTS.length})`}
            </h3>
            {isStudent && (
              <button
                onClick={onNavigateToResults}
                className="text-xs font-semibold text-[#0051d5] hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>View Analytics & Scorecards</span>
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </button>
            )}
          </div>

          <div className="space-y-2">
            {ALL_SUBJECTS.map((subKey) => {
              const sub = SUBJECT_DATA[subKey];
              const isExamSubmitted = submittedExamRecord && submittedExamRecord.subjectKey === subKey;

              return (
                <div
                  key={subKey}
                  className="bg-white p-3 rounded-xl border border-[#c4c5d5]/60 shadow-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#eaedff] text-[#00288e] flex items-center justify-center flex-shrink-0 overflow-hidden">
                      <span className="material-symbols-outlined text-[18px] select-none">{sub.icon}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] font-bold text-[#00288e] bg-[#eaedff] px-1.5 py-0.5 rounded">
                          {sub.code}
                        </span>
                        <span className="text-xs font-bold text-[#131b2e]">{sub.shortName}</span>
                      </div>
                      <p className="text-[11px] text-[#444653] truncate max-w-[180px]">{sub.name}</p>
                    </div>
                  </div>

                  {/* Actions according to Role */}
                  {isAdmin ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Curriculum Active
                      </span>
                    </div>
                  ) : isFaculty ? (
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                        currentUser?.primarySubject === subKey
                          ? 'text-emerald-800 bg-emerald-100 font-bold border border-emerald-300'
                          : 'text-[#00288e] bg-[#eaedff]'
                      }`}>
                        {currentUser?.primarySubject === subKey ? 'Primary In-Charge' : 'Evaluator Ready'}
                      </span>
                    </div>
                  ) : (
                    /* Student Actions: If completed exam, show score; else show Scheduled / Hall Ticket */
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const ex = SCHEDULED_EXAMS.find((e) => e.subjectKey === subKey) || SCHEDULED_EXAMS[0];
                          setSelectedAdmitExam(ex);
                          setShowAdmitModal(true);
                        }}
                        className="text-[11px] font-semibold text-[#00288e] hover:underline cursor-pointer"
                      >
                        Hall Ticket
                      </button>
                      {isExamSubmitted ? (
                        <button
                          onClick={() => {
                            onSelectSubject(subKey);
                            onNavigateToResults();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700 transition-colors cursor-pointer"
                        >
                          Score: {submittedExamRecord.score}/{submittedExamRecord.totalMarks}
                        </button>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200">
                          Pending Exam
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Admit Slip Modal for Students */}
      {showAdmitModal && isStudent && (
        <AdmitSlipModal
          exam={selectedAdmitExam}
          onClose={() => setShowAdmitModal(false)}
          avatarUrl={avatar}
        />
      )}
    </div>
  );
};
