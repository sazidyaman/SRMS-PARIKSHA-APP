import React, { useState, useEffect } from 'react';
import { SubjectKey, ScheduledExam, UserProfile, TimetableSlot, TimetableDay } from '../types';
import { SUBJECT_DATA, SCHEDULED_EXAMS } from '../data/subjects';
import { SubjectBar } from './SubjectBar';
import { AdmitSlipModal } from './AdmitSlipModal';

interface ScheduleScreenProps {
  selectedSubject: SubjectKey;
  onSelectSubject: (key: SubjectKey) => void;
  onEnterProctoring: () => void;
  currentUser?: UserProfile | null;
  timetableSlots?: TimetableSlot[];
  onNavigateToTimetable?: () => void;
  onOpenAdmitCardPDF?: () => void;
  onSignOut?: () => void;
  onNavigateToAnalytics?: () => void;
  onOpenAvatarPicker?: () => void;
  onOpenLeaveModal?: () => void;
}

export const ScheduleScreen: React.FC<ScheduleScreenProps> = ({
  selectedSubject,
  onSelectSubject,
  onEnterProctoring,
  currentUser,
  timetableSlots = [],
  onNavigateToTimetable,
  onOpenAdmitCardPDF,
  onSignOut,
  onNavigateToAnalytics,
  onOpenAvatarPicker,
  onOpenLeaveModal,
}) => {
  const [activeFilter, setActiveFilter] = useState<'today' | 'week' | 'all'>('today');
  const [selectedAdmitExam, setSelectedAdmitExam] = useState<ScheduledExam | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(28 * 60 + 14);
  const [showNotificationToast, setShowNotificationToast] = useState(false);
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(false);

  // Dynamic Student details from authenticated user
  const studentName = currentUser?.name || 'Enrolled Student';
  const universityRollNo = currentUser?.universityRollNo || currentUser?.identifier || '2400100100084';
  const collegeRegNo = currentUser?.collegeRegNo || 'SRMS/2026/BTECH/CSE/084';
  const branch = currentUser?.branch || 'CS1';
  const avatar = currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
  const degree = currentUser?.degree || `B.Tech ${branch} • Sem V (3rd Year)`;

  // Determine today's day for schedule lookup
  const dayNames: TimetableDay[] = ['MON', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const todayDay = dayNames[new Date().getDay()] || 'MON';

  // Filter today's timetable slots for this student's branch
  const todaysSlots = timetableSlots
    .filter((slot) => slot.branch === branch && slot.day === todayDay)
    .sort((a, b) => a.periodNumber - b.periodNumber);

  // Active Subject details
  const activeSubjectInfo = SUBJECT_DATA[selectedSubject] || SUBJECT_DATA['DAA'];

  // Countdown timer tick
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Filter exams
  const filteredExams = SCHEDULED_EXAMS.filter((exam) => {
    if (activeFilter === 'today') return exam.dateLabel.includes('Today');
    if (activeFilter === 'week') return exam.dateLabel.includes('Today') || exam.dateLabel.includes('Tomorrow');
    return true;
  });

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#131b2e] pb-24">
      {/* Top App Bar */}
      <header className="fixed top-0 left-0 w-full z-40 flex justify-between items-center px-4 h-14 bg-[#faf8ff] border-b border-[#c4c5d5]/30 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenAvatarPicker}
            className="relative w-9 h-9 rounded-full overflow-hidden border border-[#c4c5d5] flex-shrink-0 group cursor-pointer focus:outline-none"
            title="Click to customize profile avatar"
          >
            <img
              src={avatar}
              alt={studentName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
            <span className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <i className="fas fa-camera text-white text-[10px]"></i>
            </span>
          </button>
          <div className="flex flex-col">
            <span className="text-[15px] font-bold text-[#00288e] tracking-tight leading-tight">
              SRMS Pariksha
            </span>
            <span className="text-[11px] text-[#444653] leading-none truncate max-w-[180px]">
              {degree}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenAdmitCardPDF && (
            <button
              onClick={onOpenAdmitCardPDF}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#eaedff] text-[#00288e] hover:bg-[#d2d9f4] text-xs font-semibold transition-colors cursor-pointer"
              title="Download Admit Card PDF"
            >
              <span className="material-symbols-outlined text-[16px]">badge</span>
              <span className="hidden sm:inline">Admit Card</span>
              <span>PDF</span>
            </button>
          )}

          <button
            onClick={() => setShowNotificationToast(true)}
            aria-label="Notifications"
            className="relative w-9 h-9 flex items-center justify-center rounded-xl text-[#444653] hover:bg-[#eaedff] transition-colors active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#ba1a1a] ring-2 ring-[#faf8ff]"></span>
          </button>

          {onSignOut && (
            <button
              onClick={onSignOut}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-red-700 hover:bg-red-50 transition-colors active:scale-95 cursor-pointer"
              title="Sign Out"
            >
              <span className="material-symbols-outlined text-[19px]">logout</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-md mx-auto pt-16 px-4 space-y-4">
        {/* Subject Course Quick Switcher */}
        <div className="bg-white p-2.5 rounded-xl border border-[#c4c5d5]/60 shadow-xs">
          <SubjectBar
            selectedSubject={selectedSubject}
            onSelectSubject={onSelectSubject}
            title="Active Course Syllabus (MLT, WT, DAA, DBMS, DA, COI)"
            compact
          />
        </div>

        {/* Student Welcome Greeting & Real Dynamic Credentials */}
        <div className="pt-1">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#131b2e] tracking-tight">
                Hello {studentName.split(' ')[0]} 👋
              </h1>
              <div className="flex flex-col gap-0.5 mt-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-[#00288e]">
                    AKTU: {universityRollNo}
                  </span>
                  <span className="text-[10px] text-[#757684]">•</span>
                  <span className="font-mono text-xs font-semibold text-[#444653]">
                    Reg: {collegeRegNo}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-semibold bg-[#eaedff] text-[#00288e] px-1.5 py-0.2 rounded font-mono">
                    Branch: {branch}
                  </span>
                  <span className="text-[10px] text-[#757684]">•</span>
                  <span className="text-[10px] text-[#757684]">
                    SRMS Bareilly (Code 010)
                  </span>
                </div>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] mt-1 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#059669]"></span>
              <span className="text-[11px] font-semibold">Enrolled & Active</span>
            </div>
          </div>
        </div>

        {/* Fresh Student Onboarding Notice Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2.5 shadow-xs">
          <span className="material-symbols-outlined text-[#00288e] mt-0.5 flex-shrink-0 text-[20px]">
            verified_user
          </span>
          <div className="flex-1">
            <p className="text-xs text-[#00288e] font-bold">Personalized Academic Session Active</p>
            <p className="text-[11px] text-[#444653] mt-0.5 leading-snug">
              Welcome to SRMS Pariksha! Your academic dashboard is synchronized for <strong>{branch}</strong>. Timetables updated by Administration reflect here in real-time.
            </p>
          </div>
        </div>

        {/* ============================================================== */}
        {/* TODAY'S LIVE CLASS SCHEDULE (POWERED BY ADMIN TIMETABLE)       */}
        {/* ============================================================== */}
        <section className="bg-white rounded-xl border border-[#c4c5d5]/70 p-3.5 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00288e] text-[20px]">
                calendar_view_day
              </span>
              <div>
                <h3 className="text-xs font-bold text-[#131b2e]">Today's Classes & Periods</h3>
                <span className="text-[10px] text-[#757684]">
                  {todayDay === 'MON' ? 'Monday' : todayDay === 'TUE' ? 'Tuesday' : todayDay === 'WED' ? 'Wednesday' : todayDay === 'THU' ? 'Thursday' : todayDay === 'FRI' ? 'Friday' : 'Saturday'} • Branch {branch}
                </span>
              </div>
            </div>

            {onNavigateToTimetable && (
              <button
                type="button"
                onClick={onNavigateToTimetable}
                className="text-[11px] font-semibold text-[#00288e] hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>Full Timetable</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            )}
          </div>

          {/* Slots List for Today */}
          {todaysSlots.length > 0 ? (
            <div className="space-y-2 pt-1">
              {todaysSlots.slice(0, 4).map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-[#faf8ff] border border-[#c4c5d5]/40 hover:bg-[#eaedff]/40 transition-colors text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-md bg-[#eaedff] text-[#00288e] font-bold text-[11px] flex items-center justify-center shrink-0">
                      P{slot.periodNumber}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-[#131b2e] truncate flex items-center gap-1.5">
                        <span>{slot.subjectCode}</span>
                        <span className="text-[10px] text-[#757684] font-normal truncate hidden sm:inline">
                          • {slot.subjectName}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#444653]">
                        {slot.facultyName.split(' ')[0]} {slot.facultyName.split(' ')[1] || ''} • Room {slot.room}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono text-[10px] font-semibold text-[#00288e] bg-white px-1.5 py-0.5 rounded border border-[#c4c5d5]/50 block">
                      {slot.timeSlot.split('-')[0]}
                    </span>
                    <span className="text-[9px] uppercase font-bold text-[#757684] mt-0.5 block">
                      {slot.type}
                    </span>
                  </div>
                </div>
              ))}

              {todaysSlots.length > 4 && onNavigateToTimetable && (
                <button
                  type="button"
                  onClick={onNavigateToTimetable}
                  className="w-full text-center py-1 text-[11px] font-semibold text-[#00288e] hover:bg-[#eaedff] rounded-lg transition-colors cursor-pointer"
                >
                  + {todaysSlots.length - 4} more periods today (View Full Timetable)
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-4 bg-[#faf8ff] rounded-lg border border-dashed border-[#c4c5d5] text-xs text-[#757684] space-y-1">
              <span className="material-symbols-outlined text-[24px] text-[#757684]">event_busy</span>
              <p className="font-medium text-[#131b2e]">No lectures scheduled for {todayDay}</p>
              <p className="text-[11px]">Use this time for self-study or test revision.</p>
              {onNavigateToTimetable && (
                <button
                  type="button"
                  onClick={onNavigateToTimetable}
                  className="mt-1 text-xs text-[#00288e] font-semibold hover:underline"
                >
                  Check weekly timetable schedule
                </button>
              )}
            </div>
          )}
        </section>

        {/* Quick Action Shortcuts Bento */}
        <section className="grid grid-cols-4 gap-2">
          {/* Quick Action 1: Timetable */}
          <button
            type="button"
            onClick={onNavigateToTimetable}
            className="p-2.5 rounded-xl bg-white border border-[#c4c5d5] hover:border-[#00288e] flex flex-col items-center text-center shadow-xs cursor-pointer group"
          >
            <span className="material-symbols-outlined text-[20px] text-[#00288e] group-hover:scale-110 transition-transform">
              table_chart
            </span>
            <span className="text-[10px] font-bold text-[#131b2e] mt-1">Timetable</span>
          </button>

          {/* Quick Action 2: Admit Card */}
          <button
            type="button"
            onClick={onOpenAdmitCardPDF}
            className="p-2.5 rounded-xl bg-white border border-[#c4c5d5] hover:border-[#00288e] flex flex-col items-center text-center shadow-xs cursor-pointer group"
          >
            <span className="material-symbols-outlined text-[20px] text-[#00288e] group-hover:scale-110 transition-transform">
              badge
            </span>
            <span className="text-[10px] font-bold text-[#131b2e] mt-1">Hall Ticket</span>
          </button>

          {/* Quick Action 3: Analytics */}
          <button
            type="button"
            onClick={onNavigateToAnalytics}
            className="p-2.5 rounded-xl bg-white border border-[#c4c5d5] hover:border-[#00288e] flex flex-col items-center text-center shadow-xs cursor-pointer group"
          >
            <span className="material-symbols-outlined text-[20px] text-purple-700 group-hover:scale-110 transition-transform">
              analytics
            </span>
            <span className="text-[10px] font-bold text-[#131b2e] mt-1">Analytics</span>
          </button>

          {/* Quick Action 4: Leave Application */}
          <button
            type="button"
            onClick={onOpenLeaveModal}
            className="p-2.5 rounded-xl bg-white border border-[#c4c5d5] hover:border-[#00288e] flex flex-col items-center text-center shadow-xs cursor-pointer group"
          >
            <span className="material-symbols-outlined text-[20px] text-emerald-700 group-hover:scale-110 transition-transform">
              assignment_turned_in
            </span>
            <span className="text-[10px] font-bold text-[#131b2e] mt-1">Apply Leave</span>
          </button>
        </section>

        {/* Hero Active Exam Alert Card (High Security Countdown) */}
        <section className="bg-white border border-[#c4c5d5] rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#00288e]"></div>

          <div className="flex items-center justify-between mb-3 pt-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ffdad6] border border-[#ba1a1a]/20 text-[#93000a] text-[11px] font-semibold animate-pulse">
              <span className="material-symbols-outlined text-[#ba1a1a] text-[15px]">timer</span>
              Upcoming Exam in 28 mins
            </span>
            <span className="font-mono text-xs font-bold text-[#00288e] bg-[#eaedff] px-2 py-0.5 rounded">
              Mid-Term II
            </span>
          </div>

          <div className="space-y-1 mb-3.5">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-sm font-bold text-[#0051d5]">
                {activeSubjectInfo.code}
              </span>
              <h2 className="text-base font-bold text-[#131b2e] leading-snug">
                {activeSubjectInfo.name}
              </h2>
            </div>
            <p className="text-xs text-[#444653]">
              {activeSubjectInfo.department} • {activeSubjectInfo.semester}
            </p>
          </div>

          {/* Real-time Exam Parameters Matrix */}
          <div className="grid grid-cols-3 gap-2 py-3 px-3 bg-[#f2f3ff] rounded-xl border border-[#c4c5d5]/40 mb-4">
            <div className="flex flex-col">
              <span className="text-[11px] text-[#444653]">Countdown</span>
              <span className="font-mono text-sm font-bold text-[#ba1a1a] tracking-tight">
                {formatCountdown(secondsRemaining)}
              </span>
            </div>
            <div className="flex flex-col border-l border-[#c4c5d5]/50 pl-2">
              <span className="text-[11px] text-[#444653]">Max Marks</span>
              <span className="font-mono text-sm font-bold text-[#131b2e]">50 Pts</span>
            </div>
            <div className="flex flex-col border-l border-[#c4c5d5]/50 pl-2">
              <span className="text-[11px] text-[#444653]">Duration</span>
              <span className="font-mono text-sm font-bold text-[#131b2e]">90 Mins</span>
            </div>
          </div>

          {/* Venue & Digital Kiosk Specification */}
          <div className="flex items-center gap-2 mb-4 text-[#444653]">
            <span className="material-symbols-outlined text-[#00288e] flex-shrink-0 text-[18px]">
              location_on
            </span>
            <span className="text-xs font-medium text-[#131b2e]">
              Venue: <strong className="font-semibold">Hall A-101 / Digital Kiosk 42</strong>
            </span>
          </div>

          {/* Primary CTA: Proctoring Lobby Entry */}
          <button
            onClick={onEnterProctoring}
            className="w-full h-11 bg-[#00288e] text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm hover:bg-[#1e40af] active:scale-[0.98] transition-all duration-150 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[19px]">lock_open</span>
            <span>Enter Proctoring Lobby</span>
            <span className="material-symbols-outlined text-[17px]">arrow_forward</span>
          </button>
        </section>

        {/* Quick Stats Bento Metric Cards */}
        <section className="grid grid-cols-3 gap-2.5">
          {/* Metric 1 */}
          <div className="bg-white border border-[#c4c5d5] rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="w-7 h-7 rounded-lg bg-[#eaedff] flex items-center justify-center text-[#00288e] mb-1">
              <span className="material-symbols-outlined text-[18px]">event_note</span>
            </div>
            <div>
              <span className="text-lg font-bold text-[#131b2e] block">{filteredExams.length}</span>
              <span className="text-[11px] text-[#444653] leading-tight block">Upcoming Papers</span>
            </div>
          </div>

          {/* Metric 2 */}
          <div className="bg-white border border-[#c4c5d5] rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mb-1">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
            </div>
            <div>
              <span className="text-lg font-bold text-emerald-700 block">95%</span>
              <span className="text-[11px] text-[#444653] leading-tight block">Attendance</span>
            </div>
          </div>

          {/* Metric 3 */}
          <div className="bg-white border border-[#c4c5d5] rounded-xl p-3 flex flex-col justify-between shadow-xs">
            <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 mb-1">
              <span className="material-symbols-outlined text-[18px]">grade</span>
            </div>
            <div>
              <span className="text-lg font-bold text-purple-800 block">{currentUser?.cgpa || '8.50'}</span>
              <span className="text-[11px] text-[#444653] leading-tight block">Cumulative CGPA</span>
            </div>
          </div>
        </section>

        {/* Timetable & Schedule Section */}
        <section className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#131b2e]">Examination Schedule</h3>
            <button
              onClick={() => {
                if (onOpenAdmitCardPDF) {
                  onOpenAdmitCardPDF();
                } else {
                  setSelectedAdmitExam(SCHEDULED_EXAMS[0]);
                }
              }}
              className="text-xs font-semibold text-[#0051d5] hover:text-[#00288e] flex items-center gap-1 cursor-pointer"
            >
              <span>Download Admit Card (PDF)</span>
              <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
            </button>
          </div>

          {/* Segmented Tab Navigation Controls */}
          <div className="bg-[#f2f3ff] p-1 rounded-xl flex items-center gap-1 border border-[#c4c5d5]/60">
            <button
              onClick={() => setActiveFilter('today')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer ${
                activeFilter === 'today'
                  ? 'bg-white text-[#00288e] shadow-xs'
                  : 'text-[#444653] hover:text-[#131b2e]'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setActiveFilter('week')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer ${
                activeFilter === 'week'
                  ? 'bg-white text-[#00288e] shadow-xs'
                  : 'text-[#444653] hover:text-[#131b2e]'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setActiveFilter('all')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-white text-[#00288e] shadow-xs'
                  : 'text-[#444653] hover:text-[#131b2e]'
              }`}
            >
              Full Schedule
            </button>
          </div>

          {/* Scheduled Exam Cards List */}
          <div className="space-y-3">
            {filteredExams.map((exam) => (
              <article
                key={exam.id}
                className="bg-white border border-[#c4c5d5] rounded-xl p-3.5 shadow-xs space-y-2.5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#eaedff] text-[#00288e]">
                      {exam.code}
                    </span>
                    <span className="text-xs font-semibold text-[#444653]">
                      {exam.dateLabel}
                    </span>
                  </div>
                  {exam.status === 'Pre-check Ready' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]">
                      Pre-check Ready
                    </span>
                  ) : exam.status === 'Upcoming' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                      Upcoming
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#eaedff] text-[#444653] border border-[#c4c5d5]/50">
                      Scheduled
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-bold text-[#131b2e]">{exam.title}</h4>
                  <p className="text-xs text-[#444653] mt-0.5 line-clamp-2">
                    <strong className="font-medium text-[#131b2e]">Syllabus:</strong> {exam.syllabus}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#c4c5d5]/40 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[#444653]">
                    <span className="material-symbols-outlined text-[16px]">meeting_room</span>
                    <span className="text-xs">{exam.venue}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectSubject(exam.subjectKey)}
                      className="text-[11px] font-semibold text-[#00288e] hover:underline cursor-pointer"
                    >
                      View Subject
                    </button>
                    <button
                      onClick={() => setSelectedAdmitExam(exam)}
                      className="h-8 px-3 rounded-lg border border-[#c4c5d5] bg-white hover:bg-[#f2f3ff] text-[#131b2e] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">receipt_long</span>
                      <span>Admit Slip</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Moderation & Conduct Compliance Banner */}
        <div className="rounded-xl border border-[#c4c5d5] bg-white p-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#eaedff] flex items-center justify-center text-[#00288e] flex-shrink-0">
              <span className="material-symbols-outlined text-[20px]">security</span>
            </div>
            <div>
              <span className="text-xs font-bold text-[#131b2e] block">
                SRMS Anti-Cheating Protocol Active
              </span>
              <span className="text-[11px] text-[#444653] block">
                AI webcam moderation & network lock enabled
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowGuidelinesModal(true)}
            className="text-xs font-semibold text-[#0051d5] hover:underline flex-shrink-0 ml-2 cursor-pointer"
          >
            Guidelines
          </button>
        </div>
      </main>

      {/* Admit Slip Modal with Dynamic Candidate Info */}
      <AdmitSlipModal
        exam={selectedAdmitExam}
        onClose={() => setSelectedAdmitExam(null)}
        currentUser={currentUser}
      />

      {/* Notifications Toast Modal */}
      {showNotificationToast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xs w-full p-4 shadow-xl border border-[#c4c5d5]">
            <div className="flex items-center justify-between pb-2 border-b border-[#c4c5d5]/40 mb-3">
              <h4 className="font-bold text-sm text-[#131b2e] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#00288e] text-[18px]">notifications</span>
                Exam Alerts
              </h4>
              <button
                onClick={() => setShowNotificationToast(false)}
                className="text-[#757684] hover:text-[#131b2e] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="space-y-2.5 text-xs text-[#444653]">
              <div className="p-2 rounded-lg bg-[#eaedff]">
                <p className="font-semibold text-[#00288e]">Proctoring Room Ready</p>
                <p className="text-[11px] mt-0.5">Biometric kiosk #42 assigned for {activeSubjectInfo.shortName}.</p>
              </div>
              <div className="p-2 rounded-lg bg-[#f2f3ff]">
                <p className="font-semibold text-[#131b2e]">Attendance Recorded</p>
                <p className="text-[11px] mt-0.5">Your enrollment credentials are confirmed for {branch}.</p>
              </div>
            </div>
            <button
              onClick={() => setShowNotificationToast(false)}
              className="mt-4 w-full py-1.5 rounded-lg bg-[#00288e] text-white text-xs font-semibold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Guidelines Modal */}
      {showGuidelinesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-4 shadow-xl border border-[#c4c5d5] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#c4c5d5]/40">
              <h4 className="font-bold text-sm text-[#131b2e] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#00288e] text-[18px]">gavel</span>
                Examination Honor Code
              </h4>
              <button
                onClick={() => setShowGuidelinesModal(false)}
                className="text-[#757684] hover:text-[#131b2e] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="space-y-2 text-xs text-[#444653] leading-relaxed">
              <p>• Full-screen browser lock is actively enforced. Tab switches are logged to invigilators.</p>
              <p>• Webcam and audio streaming are continuously analyzed for secondary presence.</p>
              <p>• Digital Scratchpad calculations are cleared automatically upon submission.</p>
              <p>• Responses receive an immutable SHA-256 ledger seal for credential audit.</p>
            </div>
            <button
              onClick={() => setShowGuidelinesModal(false)}
              className="w-full py-2 rounded-xl bg-[#00288e] text-white text-xs font-semibold cursor-pointer"
            >
              I Understand & Agree
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
