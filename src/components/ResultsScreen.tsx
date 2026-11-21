import React, { useState } from 'react';
import { SubjectKey, UserProfile } from '../types';
import { SUBJECT_DATA } from '../data/subjects';
import { SubjectBar } from './SubjectBar';
import { ExamAnalytics } from './ExamAnalytics';

interface ResultsScreenProps {
  selectedSubject: SubjectKey;
  onSelectSubject: (key: SubjectKey) => void;
  onBack: () => void;
  defaultView?: 'analytics' | 'scorecard';
  currentUser?: UserProfile | null;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  selectedSubject,
  onSelectSubject,
  onBack,
  defaultView = 'analytics',
  currentUser,
}) => {
  const isStaff = currentUser?.role === 'admin' || currentUser?.role === 'faculty';
  const [viewMode, setViewMode] = useState<'analytics' | 'scorecard'>(isStaff ? 'analytics' : defaultView);
  const [copiedHash, setCopiedHash] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharedNotice, setSharedNotice] = useState(false);

  const subject = SUBJECT_DATA[selectedSubject];
  const summary = subject.summaryScore;

  // Student roster for Admin/Faculty to inspect
  const INSPECTABLE_STUDENTS = [
    { name: 'Rahul Sen', roll: '2200100100084', reg: 'SRMS/2022/BTECH/CSE/084', branch: 'CS1', score: summary.obtained, total: summary.total, grade: summary.grade, pct: summary.percentile, rank: summary.rank },
    { name: 'Priya Sharma', roll: '2200100100092', reg: 'SRMS/2022/BTECH/CSE/092', branch: 'CS2', score: 46, total: 50, grade: 'A+', pct: '96.2th', rank: 4 },
    { name: 'Aman Verma', roll: '2200100130031', reg: 'SRMS/2022/BTECH/IT/031', branch: 'IT', score: 42, total: 50, grade: 'A', pct: '91.8th', rank: 8 },
    { name: 'Neha Saxena', roll: '2200101530018', reg: 'SRMS/2022/BTECH/AIML/018', branch: 'AIML', score: 45, total: 50, grade: 'A+', pct: '94.5th', rank: 5 },
  ];

  const [inspectIndex, setInspectIndex] = useState(0);
  const activeStudent = isStaff ? INSPECTABLE_STUDENTS[inspectIndex] : null;

  // Check if current student recently completed this exam
  const lastExamRecord = (() => {
    if (isStaff) return null;
    try {
      const saved = localStorage.getItem('srms_last_submitted_exam');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.subjectKey === selectedSubject) {
          return parsed;
        }
      }
    } catch {}
    return null;
  })();

  const hasAttempted = isStaff ? true : Boolean(lastExamRecord);

  const studentObtainedScore = lastExamRecord?.score ?? 0;
  const studentTotalMarks = lastExamRecord?.totalMarks ?? 50;
  const studentCorrectCount = lastExamRecord?.correctCount ?? 0;
  const studentAccuracy = lastExamRecord
    ? Math.round((lastExamRecord.score / lastExamRecord.totalMarks) * 100)
    : 0;
  const studentGrade = lastExamRecord
    ? lastExamRecord.score >= 45
      ? 'A+'
      : lastExamRecord.score >= 40
      ? 'A'
      : lastExamRecord.score >= 35
      ? 'B+'
      : lastExamRecord.score >= 30
      ? 'B'
      : 'C'
    : 'Pending';
  const studentPct = lastExamRecord
    ? `${Math.min(99.4, Math.max(50.0, Math.round(studentAccuracy * 0.98 * 10) / 10))}th`
    : 'Not Evaluated';

  const candidateName = isStaff ? activeStudent?.name : (currentUser?.name || 'Enrolled Student');
  const candidateRoll = isStaff ? activeStudent?.roll : (currentUser?.universityRollNo || currentUser?.identifier || 'Not Assigned');
  const candidateReg = isStaff ? activeStudent?.reg : (currentUser?.collegeRegNo || 'Not Assigned');
  const displayScore = isStaff ? activeStudent?.score : studentObtainedScore;
  const displayTotal = isStaff ? activeStudent?.total : studentTotalMarks;
  const displayGrade = isStaff ? activeStudent?.grade : studentGrade;
  const displayPct = isStaff ? activeStudent?.pct : studentPct;
  const displayRank = isStaff ? activeStudent?.rank : (hasAttempted ? summary.rank : '-');
  const displayAccuracy = isStaff ? summary.accuracy : studentAccuracy;
  const displayCorrectCount = isStaff ? summary.correctQuestions : studentCorrectCount;

  const handleCopyHash = () => {
    navigator.clipboard.writeText(summary.shaHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2500);
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  if (viewMode === 'analytics') {
    return (
      <div className="min-h-screen bg-[#faf8ff] text-[#131b2e] pb-24 flex flex-col">
        {/* View Switcher Sub-header */}
        <div className="bg-white border-b border-[#c4c5d5]/40 px-4 py-2 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={onBack}
                aria-label="Go Back"
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#eaedff] text-[#00288e] transition-colors active:scale-95"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-[#00288e]">SRMS Pariksha</span>
                <span className="text-xs text-[#757684]">• Performance Suite</span>
              </div>
            </div>

            {/* Segmented View Switcher */}
            <div className="flex bg-[#eaedff] p-0.5 rounded-xl border border-[#c4c5d5]/40 self-center sm:self-auto">
              <button
                onClick={() => setViewMode('analytics')}
                className="px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 bg-[#00288e] text-white shadow-xs"
              >
                <span className="material-symbols-outlined text-[15px]">monitoring</span>
                <span>Exam Analytics</span>
              </button>
              <button
                onClick={() => setViewMode('scorecard')}
                className="px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 text-[#00288e] hover:bg-[#dfe4ff]"
              >
                <span className="material-symbols-outlined text-[15px]">assignment</span>
                <span>Subject Scorecard</span>
              </button>
            </div>
          </div>
        </div>

        {/* Analytics Body */}
        <ExamAnalytics
          onBack={onBack}
          currentUser={currentUser}
          onSelectSubjectForScorecard={(key) => {
            onSelectSubject(key as SubjectKey);
            setViewMode('scorecard');
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#131b2e] pb-24 flex flex-col justify-between">
      {/* Top App Bar (Mobile Structured with Navigation & PDF Export) */}
      <header className="fixed top-0 left-0 w-full z-40 bg-white/95 backdrop-blur-md shadow-xs border-b border-[#c4c5d5]/30 px-4 py-2">
        <div className="max-w-md mx-auto flex justify-between items-center h-11">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              aria-label="Go Back"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[#131b2e] hover:bg-[#e2e7ff] transition-colors active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
            <div className="flex flex-col">
              <span className="text-sm text-[#00288e] font-bold leading-tight">
                Exam Scorecard
              </span>
              <span className="text-[10px] text-[#757684]">Verified Academic Record</span>
            </div>
          </div>

          {/* Quick toggle to Exam Analytics & PDF download */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setViewMode('analytics')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#00288e] text-white text-[11px] font-semibold hover:bg-[#1e40af] transition-all shadow-xs"
              title="Open Recharts Performance Analytics"
            >
              <span className="material-symbols-outlined text-[15px]">monitoring</span>
              <span>Analytics</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#eaedff] hover:bg-[#e2e7ff] text-[#00288e] text-[11px] font-semibold transition-colors shadow-xs active:scale-95"
              title="Download Verified Scorecard"
            >
              <span className="material-symbols-outlined text-[15px]">print</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Scrollable Content Container */}
      <main className="w-full max-w-md mx-auto pt-16 px-4 space-y-4">
        {/* Banner linking to Exam Analytics */}
        <div
          onClick={() => setViewMode('analytics')}
          className="bg-gradient-to-r from-[#eaedff] to-[#f2f3ff] p-3 rounded-xl border border-[#00288e]/20 shadow-xs cursor-pointer hover:border-[#00288e]/50 transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00288e] text-white flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[18px]">query_stats</span>
            </div>
            <div>
              <p className="text-xs font-bold text-[#00288e]">View Performance Trends Over Time</p>
              <p className="text-[10px] text-[#444653]">Interactive Recharts graphs for DAA, DBMS, WT, MLT, DA, COI</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-[18px] text-[#00288e]">chevron_right</span>
        </div>

        {/* Subject Filter Switcher */}
        <div className="bg-white p-2.5 rounded-xl border border-[#c4c5d5]/60 shadow-xs">
          <SubjectBar
            selectedSubject={selectedSubject}
            onSelectSubject={onSelectSubject}
            title="Switch Subject (MLT, WT, DAA, DBMS, DA, COI)"
            compact
          />
        </div>

        {/* Staff Inspector Banner */}
        {isStaff && (
          <div className="bg-purple-50 border border-purple-200 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs shadow-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-700 text-[20px]">admin_panel_settings</span>
              <div>
                <span className="font-bold text-purple-950 block">Administrator Scorecard Inspector</span>
                <span className="text-[11px] text-purple-800">Reviewing student cohort verified academic records</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <span className="text-[11px] text-purple-900 font-medium">Examinee:</span>
              <select
                value={inspectIndex}
                onChange={(e) => setInspectIndex(Number(e.target.value))}
                className="px-2.5 py-1 rounded-lg border border-purple-300 bg-white font-bold text-purple-950 text-xs outline-none cursor-pointer"
              >
                {INSPECTABLE_STUDENTS.map((std, idx) => (
                  <option key={std.roll} value={idx}>
                    {std.name} ({std.branch} • {std.roll})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Main Scorecard or Not Attempted Notification */}
        {!hasAttempted && !isStaff ? (
          <section className="bg-white rounded-2xl p-6 border border-[#c4c5d5] shadow-xs text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-2xs">
              <span className="material-symbols-outlined text-[32px]">assignment_late</span>
            </div>
            <div className="space-y-1.5">
              <h2 className="text-base font-bold text-[#131b2e]">
                Examination Not Yet Attempted
              </h2>
              <p className="text-xs text-[#444653] leading-relaxed max-w-sm mx-auto">
                You have not completed or submitted the proctored assessment for <strong>{subject.name} ({subject.code})</strong>. 
                Your authentic scorecard, percentile rank, and cryptographic AKTU ledger hash will be computed immediately after exam submission.
              </p>
            </div>

            <div className="p-3 bg-[#f2f3ff] rounded-xl border border-[#c4c5d5]/50 text-left space-y-1.5 text-xs text-[#444653]">
              <div className="flex justify-between">
                <span>Subject Assessment:</span>
                <span className="font-semibold text-[#00288e]">{subject.name} ({subject.code})</span>
              </div>
              <div className="flex justify-between">
                <span>Assessment Status:</span>
                <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Scheduled / Pending
                </span>
              </div>
              <div className="flex justify-between">
                <span>Assessment Format:</span>
                <span className="font-mono font-bold text-[#131b2e]">50 Marks (25 MCQs • 45 Mins)</span>
              </div>
              <div className="flex justify-between">
                <span>Candidate AKTU Roll:</span>
                <span className="font-mono font-bold text-[#00288e]">{candidateRoll}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row justify-center gap-2">
              <button
                type="button"
                onClick={onBack}
                className="w-full py-2.5 px-4 bg-[#00288e] hover:bg-[#1e40af] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>Return to Schedule & Launch Exam</span>
              </button>
            </div>
          </section>
        ) : (
          <>
            {/* Header Card: Subject & Assessment Meta */}
        <section className="bg-white rounded-xl p-4 shadow-xs border border-[#c4c5d5]/50">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded bg-[#eaedff] text-[#00288e] font-mono text-[11px] font-semibold tracking-wide">
                  {subject.code}
                </span>
                <span className="text-[#757684] text-[11px] font-medium">
                  {subject.academicYear} • {subject.term}
                </span>
              </div>
              <h1 className="text-base font-bold text-[#131b2e] tracking-tight">
                {subject.name}
              </h1>
              <p className="text-xs text-[#444653] mt-0.5">
                Internal Assessment II (Theory & Analysis) • Candidate: <strong>{candidateName}</strong>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#eaedff] flex items-center justify-center text-[#00288e] flex-shrink-0">
              <span className="material-symbols-outlined text-[24px]">{subject.icon}</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-[#c4c5d5]/30 flex items-center justify-between text-[#444653] text-[11px] flex-wrap gap-2">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-[#757684]">event_available</span>
              Exam Date: Nov 14, 2024
            </span>
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="text-[#00288e] font-bold">AKTU: {candidateRoll}</span>
              <span className="text-[#757684]">•</span>
              <span className="text-[#131b2e] font-semibold">Reg: {candidateReg}</span>
            </div>
          </div>
        </section>

        {/* Result Summary Hero Card */}
        <section className="bg-white rounded-xl p-4 shadow-xs border border-[#c4c5d5]/60 relative overflow-hidden">
          {/* Ambient Background Accent Glow */}
          <div className="absolute -right-12 -top-12 w-36 h-36 rounded-full bg-[#eaedff] opacity-60 pointer-events-none blur-2xl"></div>

          {/* Moderation Status Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-[11px] mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#059669]"></span>
            <span className="font-semibold">Moderated & Sealed by Academic Controller</span>
          </div>

          {/* Main Score Matrix */}
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-[11px] text-[#757684] block font-semibold">
                TOTAL OBTAINED SCORE
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-3xl text-[#00288e] font-bold tracking-tight">
                  {displayScore}
                </span>
                <span className="text-lg text-[#444653] font-medium">/ {displayTotal}</span>
                <span className="ml-2 font-mono text-xs font-semibold text-[#0051d5] px-2 py-0.5 rounded bg-[#eaedff]">
                  ({((Number(displayScore) / Number(displayTotal)) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>

            {/* Letter Grade Stamp */}
            <div className="text-right">
              <div className="w-14 h-14 rounded-xl bg-[#1e40af] text-white flex flex-col items-center justify-center shadow-xs">
                <span className="text-2xl leading-none font-bold">{displayGrade}</span>
                <span className="text-[10px] tracking-wider uppercase opacity-85 mt-0.5">
                  Grade
                </span>
              </div>
            </div>
          </div>

          {/* Secondary Metric Grid within Hero */}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-3.5 border-t border-[#c4c5d5]/40">
            <div className="bg-[#f2f3ff] p-2.5 rounded-lg">
              <div className="flex items-center gap-1 text-[#444653] text-[11px] mb-0.5 font-medium">
                <span className="material-symbols-outlined text-[16px] text-[#0051d5]">trending_up</span>
                Percentile Rank
              </div>
              <div className="text-base text-[#131b2e] font-bold">
                {displayPct} <span className="text-xs text-[#757684] font-normal">Pct</span>
              </div>
            </div>

            <div className="bg-[#f2f3ff] p-2.5 rounded-lg">
              <div className="flex items-center gap-1 text-[#444653] text-[11px] mb-0.5 font-medium">
                <span className="material-symbols-outlined text-[16px] text-[#0051d5]">military_tech</span>
                Cohort Position
              </div>
              <div className="text-base text-[#131b2e] font-bold">
                {String(displayRank).padStart(2, '0')}{' '}
                <span className="text-xs text-[#757684] font-normal">
                  / {summary.cohortTotal} Students
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Performance Breakdown Metric Cards */}
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-[#131b2e]">Performance Breakdown</h2>
            <span className="text-[11px] text-[#757684]">Detailed Telemetry</span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {/* Metric Card 1: Accuracy */}
            <div className="bg-white p-3.5 rounded-xl border border-[#c4c5d5]/50 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#eaedff] flex items-center justify-center text-[#00288e]">
                  <span className="material-symbols-outlined text-[22px]">check_circle</span>
                </div>
                <div>
                  <div className="text-xs text-[#444653]">Question Accuracy</div>
                  <div className="text-sm text-[#131b2e] font-semibold">
                    {displayAccuracy}% Accuracy
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono text-xs font-semibold text-[#00288e] bg-[#eaedff] px-2 py-1 rounded">
                  {displayCorrectCount} / {summary.totalQuestions}
                </span>
                <span className="block text-[10px] text-[#757684] mt-0.5">Correct</span>
              </div>
            </div>

            {/* Metric Card 2: Average Time per Question */}
            <div className="bg-white p-3.5 rounded-xl border border-[#c4c5d5]/50 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#eaedff] flex items-center justify-center text-[#0051d5]">
                  <span className="material-symbols-outlined text-[22px]">timer</span>
                </div>
                <div>
                  <div className="text-xs text-[#444653]">Pacing Speed</div>
                  <div className="text-sm text-[#131b2e] font-semibold">
                    {summary.pacingSpeed}{' '}
                    <span className="text-xs text-[#757684] font-normal">/ question</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-[#065F46] bg-[#ECFDF5] px-2 py-0.5 rounded font-medium border border-[#A7F3D0]">
                  Optimal
                </span>
                <span className="block text-[10px] text-[#757684] mt-0.5">Max: 3m 00s</span>
              </div>
            </div>

            {/* Metric Card 3: Class Average Comparison */}
            <div className="bg-white p-3.5 rounded-xl border border-[#c4c5d5]/50 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#eaedff] flex items-center justify-center text-[#00288e]">
                    <span className="material-symbols-outlined text-[22px]">equalizer</span>
                  </div>
                  <div>
                    <div className="text-xs text-[#444653]">Class Average Benchmark</div>
                    <div className="text-sm text-[#131b2e] font-semibold">
                      +{(summary.studentScore - summary.cohortMean).toFixed(1)} Marks
                    </div>
                  </div>
                </div>
                <span className="text-[11px] text-[#065F46] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-1 rounded font-medium">
                  Above Mean
                </span>
              </div>
              <div className="mt-3 pt-2.5 border-t border-[#c4c5d5]/30 flex justify-between items-center text-xs text-[#444653]">
                <span>
                  Student Score: <strong className="text-[#00288e] font-semibold">{summary.studentScore.toFixed(1)}</strong>
                </span>
                <span className="text-[#757684]">|</span>
                <span>
                  Cohort Mean: <strong className="text-[#131b2e] font-semibold">{summary.cohortMean.toFixed(1)}</strong>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Bloom's Taxonomy Cognitive Mastery */}
        <section className="bg-white p-4 rounded-xl border border-[#c4c5d5]/50 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#131b2e]">Bloom's Taxonomy Mastery</h2>
              <p className="text-xs text-[#444653]">Cognitive complexity performance map</p>
            </div>
            <span className="material-symbols-outlined text-[#757684] text-[20px]">psychology</span>
          </div>

          <div className="space-y-3 pt-1">
            {/* Remember & Understand */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-[#131b2e] font-medium">Remember & Understand</span>
                <span className="font-mono text-[#00288e] font-semibold">
                  {summary.bloomTaxonomy.rememberUnderstand}%
                </span>
              </div>
              <div className="w-full bg-[#e2e7ff] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#00288e] h-full rounded-full transition-all duration-500"
                  style={{ width: `${summary.bloomTaxonomy.rememberUnderstand}%` }}
                />
              </div>
            </div>

            {/* Apply & Analyze */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-[#131b2e] font-medium">Apply & Analyze</span>
                <span className="font-mono text-[#00288e] font-semibold">
                  {summary.bloomTaxonomy.applyAnalyze}%
                </span>
              </div>
              <div className="w-full bg-[#e2e7ff] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#00288e] h-full rounded-full transition-all duration-500"
                  style={{ width: `${summary.bloomTaxonomy.applyAnalyze}%` }}
                />
              </div>
            </div>

            {/* Evaluate */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-[#131b2e] font-medium">Evaluate</span>
                <span className="font-mono text-[#00288e] font-semibold">
                  {summary.bloomTaxonomy.evaluate}%
                </span>
              </div>
              <div className="w-full bg-[#e2e7ff] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#316bf3] h-full rounded-full transition-all duration-500"
                  style={{ width: `${summary.bloomTaxonomy.evaluate}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Topic Performance Breakdown List */}
        <section className="bg-white p-4 rounded-xl border border-[#c4c5d5]/50 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#131b2e]">Topic Performance</h2>
              <p className="text-xs text-[#444653]">Syllabus unit proficiency</p>
            </div>
            <span className="material-symbols-outlined text-[#757684] text-[20px]">account_tree</span>
          </div>

          <div className="divide-y divide-[#c4c5d5]/30 pt-1">
            {subject.topics.map((topic, index) => {
              const dotColors = ['bg-[#00563a]', 'bg-[#316bf3]', 'bg-[#00563a]'];
              const isFull = topic.defaultProficiency === 100;

              return (
                <div
                  key={index}
                  className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2 h-2 rounded-full ${dotColors[index % dotColors.length]}`} />
                    <div>
                      <div className="text-xs text-[#131b2e] font-semibold">{topic.name}</div>
                      <div className="text-[11px] text-[#757684]">
                        {topic.questionsCount} questions evaluated
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded font-mono text-xs font-bold ${
                      isFull
                        ? 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]'
                        : 'bg-[#eaedff] text-[#00288e]'
                    }`}
                  >
                    {topic.defaultProficiency}%
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Digital Transcript Verification Stamp & Security Card */}
        <section className="bg-[#f2f3ff] rounded-xl p-4 border border-[#c4c5d5]/60 shadow-xs space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-white border border-[#c4c5d5] flex items-center justify-center text-[#00288e] flex-shrink-0">
              <span className="material-symbols-outlined text-[20px]">verified</span>
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#131b2e]">Digital Transcript Seal</span>
                <span className="text-[10px] text-[#003d28] font-semibold bg-[#85f8c4] px-1.5 py-0.5 rounded">
                  AUTHENTIC
                </span>
              </div>
              <p className="text-xs text-[#444653] mt-0.5">
                Tamper-proof academic signature logged by Examination Cell.
              </p>
            </div>
          </div>

          {/* Hash Container */}
          <div className="bg-white p-2.5 rounded-lg border border-[#c4c5d5]/40">
            <div className="flex items-center justify-between text-[#757684] text-[11px] mb-1">
              <span>SHA-256 LEDGER HASH</span>
              <button
                onClick={handleCopyHash}
                className="flex items-center gap-1 cursor-pointer hover:text-[#00288e] transition-colors active:scale-95 font-semibold"
              >
                <span className="material-symbols-outlined text-[13px]">content_copy</span>
                <span>{copiedHash ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <p className="font-mono text-[11px] text-[#131b2e] break-all select-all font-medium leading-relaxed">
              {summary.shaHash}
            </p>
          </div>

          {/* Social & Academic Portfolio Share Action Button */}
          <button
            onClick={() => setShowShareModal(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#1e40af] hover:bg-[#316bf3] text-white text-xs font-semibold transition-all shadow-xs active:scale-98"
          >
            <span className="material-symbols-outlined text-[18px]">share</span>
            <span>Share to LinkedIn / Academic Portfolio</span>
          </button>
        </section>
          </>
        )}
      </main>

      {/* Share to Portfolio Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-4 shadow-xl border border-[#c4c5d5] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#c4c5d5]/40">
              <h4 className="font-bold text-sm text-[#131b2e] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#00288e] text-[18px]">verified</span>
                Verified Academic Credential
              </h4>
              <button onClick={() => setShowShareModal(false)} className="text-[#757684]">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {sharedNotice ? (
              <div className="p-3 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                  <span className="material-symbols-outlined">check</span>
                </div>
                <p className="text-xs font-bold text-[#065F46]">Credential Copied to Clipboard!</p>
                <p className="text-[11px] text-[#444653]">Ready to paste into LinkedIn or academic portfolio badge.</p>
                <button
                  onClick={() => {
                    setShowShareModal(false);
                    setSharedNotice(false);
                  }}
                  className="w-full py-1.5 bg-[#00288e] text-white text-xs rounded-lg font-semibold"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="p-3 rounded-xl bg-[#f2f3ff] border border-[#c4c5d5]/40 space-y-1 text-xs">
                  <p className="font-bold text-[#131b2e]">{subject.name} - Grade {summary.grade} ({((summary.obtained / summary.total) * 100).toFixed(1)}%)</p>
                  <p className="text-[#444653]">Candidate: {currentUser?.name || 'Enrolled Student'}</p>
                  <p className="text-[#757684] text-[11px] font-mono">AKTU: {currentUser?.universityRollNo || currentUser?.identifier || '010-SRMS'} • Reg: {currentUser?.collegeRegNo || 'SRMS/2026/BTECH'}</p>
                  <p className="text-[#00288e] font-mono text-[10px]">Verification: SHA-256 {summary.shaHash.slice(0, 16)}...</p>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowShareModal(false)}
                    className="flex-1 py-2 border border-[#c4c5d5] rounded-xl text-xs font-semibold text-[#444653]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `Verified Academic Result: ${subject.name} (${subject.code}) - Grade ${summary.grade} (${summary.obtained}/${summary.total}). Cryptographic Signature: ${summary.shaHash}`
                      );
                      setSharedNotice(true);
                    }}
                    className="flex-1 py-2 bg-[#00288e] text-white rounded-xl text-xs font-semibold hover:bg-[#1e40af]"
                  >
                    Copy Credential
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
