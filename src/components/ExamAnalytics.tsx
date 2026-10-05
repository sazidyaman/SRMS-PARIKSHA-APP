import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  SUBJECT_ANALYTICS_LIST,
  PERFORMANCE_TRENDS_OVER_TIME,
  SKILL_DOMAIN_DATA,
  HISTORICAL_TEST_RECORDS,
  SubjectAnalyticsInfo,
} from '../data/analyticsData';
import { UserProfile } from '../types';

interface ExamAnalyticsProps {
  onBack?: () => void;
  onSelectSubjectForScorecard?: (subjectKey: string) => void;
  currentUser?: UserProfile | null;
}

export const ExamAnalytics: React.FC<ExamAnalyticsProps> = ({
  onBack,
  onSelectSubjectForScorecard,
  currentUser,
}) => {
  const studentName = currentUser?.name || 'Enrolled Student';
  const universityRollNo = currentUser?.universityRollNo || currentUser?.identifier || 'Not Assigned';
  const collegeRegNo = currentUser?.collegeRegNo || 'Not Assigned';
  const initials = studentName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'ST';
  // Active subject keys for multi-line trend chart
  const [activeSubjectKeys, setActiveSubjectKeys] = useState<string[]>([
    'DAA',
    'MLT',
    'WT',
    'DBMS',
  ]);

  // Chart type mode: 'line' | 'area'
  const [chartMode, setChartMode] = useState<'line' | 'area'>('line');

  // Course category filter: 'all' | 'theory' | 'lab'
  const [courseCategoryFilter, setCourseCategoryFilter] = useState<'all' | 'theory' | 'lab'>('all');

  // Time scope filter: 'all' | 'midterm' | 'recent'
  const [timeScope, setTimeScope] = useState<'all' | 'midterm' | 'recent'>('all');

  // Search query for assessment records table
  const [searchQuery, setSearchQuery] = useState('');

  // Selected subject for deep dive modal
  const [selectedSubjectModal, setSelectedSubjectModal] = useState<SubjectAnalyticsInfo | null>(null);

  // Toggle a single subject line in the chart
  const handleToggleSubject = (key: string) => {
    setActiveSubjectKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Select all or clear all
  const handleSelectAllSubjects = () => {
    setActiveSubjectKeys(SUBJECT_ANALYTICS_LIST.map((s) => s.key));
  };

  const handleSelectCoreTheory = () => {
    setActiveSubjectKeys(['DAA', 'MLT', 'WT', 'DBMS', 'DA', 'COI']);
  };

  const handleSelectLabsOnly = () => {
    setActiveSubjectKeys(['DAA_LAB', 'DBMS_LAB', 'WT_LAB']);
  };

  // Filtered subjects list for cards & table
  const filteredSubjects = useMemo(() => {
    if (courseCategoryFilter === 'theory') {
      return SUBJECT_ANALYTICS_LIST.filter((s) => s.category === 'Theory');
    }
    if (courseCategoryFilter === 'lab') {
      return SUBJECT_ANALYTICS_LIST.filter((s) => s.category === 'Lab');
    }
    return SUBJECT_ANALYTICS_LIST;
  }, [courseCategoryFilter]);

  // Filtered trend points according to time scope
  const filteredTrendData = useMemo(() => {
    if (timeScope === 'recent') {
      return PERFORMANCE_TRENDS_OVER_TIME.slice(3); // Oct 18, Nov 08, Nov 28
    }
    if (timeScope === 'midterm') {
      return PERFORMANCE_TRENDS_OVER_TIME.slice(1, 5); // Sep 04 to Nov 08
    }
    return PERFORMANCE_TRENDS_OVER_TIME;
  }, [timeScope]);

  // Comparative data for Bar Chart (Student vs Cohort Average)
  const comparisonBarData = useMemo(() => {
    return filteredSubjects.map((s) => ({
      name: `${s.shortName} (${s.code})`,
      shortName: s.shortName,
      code: s.code,
      studentScore: s.currentPercentage,
      cohortAvg: s.cohortAverage,
      color: s.color,
    }));
  }, [filteredSubjects]);

  // Filtered test records
  const filteredTestRecords = useMemo(() => {
    if (!searchQuery.trim()) return HISTORICAL_TEST_RECORDS;
    const q = searchQuery.toLowerCase();
    return HISTORICAL_TEST_RECORDS.filter(
      (r) =>
        r.testName.toLowerCase().includes(q) ||
        r.subjectCode.toLowerCase().includes(q) ||
        r.subjectName.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Print report
  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#131b2e] pb-24 font-sans">
      {/* Institutional Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#c4c5d5]/40 px-4 py-3 shadow-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                aria-label="Go Back"
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#eaedff] text-[#00288e] transition-all active:scale-95 flex-shrink-0"
              >
                <span className="material-symbols-outlined text-[22px]">arrow_back</span>
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold bg-[#eaedff] text-[#00288e] px-2 py-0.5 rounded">
                  SRMS PARIKSHA
                </span>
                <span className="text-[11px] text-[#757684]">AY 2024–25 • Semester VI</span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-[#131b2e] tracking-tight">
                Exam Analytics & Score Progression
              </h1>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handlePrintReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#eaedff] hover:bg-[#e2e7ff] text-[#00288e] text-xs font-semibold shadow-xs transition-all active:scale-95"
              title="Print / Save Analytics Report"
            >
              <span className="material-symbols-outlined text-[17px]">print</span>
              <span>Print Report</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 pt-5 space-y-5">
        {/* Student Profile Quick Banner */}
        <div className="bg-white rounded-2xl p-4 border border-[#c4c5d5]/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00288e] to-[#0051d5] text-white flex items-center justify-center font-bold text-lg shadow-sm flex-shrink-0">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#131b2e]">{studentName}</h2>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Academic Performance Profile
                </span>
              </div>
              <p className="text-xs text-[#444653] mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span>AKTU Roll: <strong className="font-mono text-[#00288e]">{universityRollNo}</strong></span>
                <span>•</span>
                <span>College Reg: <strong className="font-mono text-[#131b2e]">{collegeRegNo}</strong></span>
                <span>•</span>
                <span>SRMS CET Bareilly (Code 010)</span>
              </p>
            </div>
          </div>

          {/* Executive KPI Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-[#faf8ff] p-2.5 rounded-xl border border-[#c4c5d5]/50 text-center">
              <span className="text-[10px] uppercase font-bold text-[#757684] block">Semester Avg</span>
              <span className="text-base font-extrabold text-[#00288e]">94.2%</span>
              <span className="text-[9px] text-emerald-700 font-semibold block">+6.8% gain</span>
            </div>
            <div className="bg-[#faf8ff] p-2.5 rounded-xl border border-[#c4c5d5]/50 text-center">
              <span className="text-[10px] uppercase font-bold text-[#757684] block">Top Subject</span>
              <span className="text-base font-extrabold text-purple-700">MLT (bcs055)</span>
              <span className="text-[9px] text-[#444653] block">98.0% (Grade O)</span>
            </div>
            <div className="bg-[#faf8ff] p-2.5 rounded-xl border border-[#c4c5d5]/50 text-center">
              <span className="text-[10px] uppercase font-bold text-[#757684] block">Top Improvement</span>
              <span className="text-base font-extrabold text-[#00288e]">DAA (BCS 503)</span>
              <span className="text-[9px] text-emerald-700 font-semibold block">+14.0% surge</span>
            </div>
            <div className="bg-[#faf8ff] p-2.5 rounded-xl border border-[#c4c5d5]/50 text-center">
              <span className="text-[10px] uppercase font-bold text-[#757684] block">Lab Practicals</span>
              <span className="text-base font-extrabold text-teal-700">95.3%</span>
              <span className="text-[9px] text-[#444653] block">bcs551, 552, 553</span>
            </div>
          </div>
        </div>

        {/* Primary Interactive Chart Section: Performance Trends Over Time */}
        <section className="bg-white rounded-2xl p-4 sm:p-5 border border-[#c4c5d5]/60 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#c4c5d5]/40">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00288e]" />
                <h3 className="text-sm sm:text-base font-bold text-[#131b2e]">
                  Longitudinal Performance Trends (Test Scores Over Time)
                </h3>
              </div>
              <p className="text-xs text-[#757684] mt-0.5">
                Visualizing score progression across diagnostic tests, unit tests, and mid-term assessments
              </p>
            </div>

            {/* Controls: Time Scope & Chart Mode */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex bg-[#faf8ff] p-0.5 rounded-lg border border-[#c4c5d5]/60 text-xs">
                <button
                  onClick={() => setTimeScope('all')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    timeScope === 'all'
                      ? 'bg-white shadow-xs text-[#00288e] font-bold'
                      : 'text-[#444653] hover:text-[#131b2e]'
                  }`}
                >
                  Full Sem (Aug–Nov)
                </button>
                <button
                  onClick={() => setTimeScope('midterm')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    timeScope === 'midterm'
                      ? 'bg-white shadow-xs text-[#00288e] font-bold'
                      : 'text-[#444653] hover:text-[#131b2e]'
                  }`}
                >
                  Mid-Terms
                </button>
                <button
                  onClick={() => setTimeScope('recent')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    timeScope === 'recent'
                      ? 'bg-white shadow-xs text-[#00288e] font-bold'
                      : 'text-[#444653] hover:text-[#131b2e]'
                  }`}
                >
                  Recent
                </button>
              </div>

              <div className="flex bg-[#faf8ff] p-0.5 rounded-lg border border-[#c4c5d5]/60 text-xs">
                <button
                  onClick={() => setChartMode('line')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1 ${
                    chartMode === 'line'
                      ? 'bg-white shadow-xs text-[#00288e] font-bold'
                      : 'text-[#444653] hover:text-[#131b2e]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">show_chart</span>
                  <span>Lines</span>
                </button>
                <button
                  onClick={() => setChartMode('area')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1 ${
                    chartMode === 'area'
                      ? 'bg-white shadow-xs text-[#00288e] font-bold'
                      : 'text-[#444653] hover:text-[#131b2e]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">area_chart</span>
                  <span>Area</span>
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Subject Selector Chips to toggle lines */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[#757684]">
              <span className="font-semibold">Select Subjects to Plot:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSelectCoreTheory}
                  className="text-[11px] text-[#00288e] hover:underline font-medium"
                >
                  Core Theory (6)
                </button>
                <span>•</span>
                <button
                  onClick={handleSelectLabsOnly}
                  className="text-[11px] text-[#00288e] hover:underline font-medium"
                >
                  Labs (3)
                </button>
                <span>•</span>
                <button
                  onClick={handleSelectAllSubjects}
                  className="text-[11px] text-[#00288e] hover:underline font-medium"
                >
                  All (9)
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {SUBJECT_ANALYTICS_LIST.map((subject) => {
                const isActive = activeSubjectKeys.includes(subject.key);
                return (
                  <button
                    key={subject.key}
                    onClick={() => handleToggleSubject(subject.key)}
                    style={{
                      borderColor: isActive ? subject.color : undefined,
                      backgroundColor: isActive ? `${subject.color}15` : undefined,
                      color: isActive ? subject.color : undefined,
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 active:scale-95 ${
                      isActive
                        ? 'font-bold shadow-2xs'
                        : 'bg-white border-[#c4c5d5]/60 text-[#757684] hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: isActive ? subject.color : '#c4c5d5',
                      }}
                    />
                    <span className="font-mono text-[11px]">{subject.code}</span>
                    <span>{subject.shortName}</span>
                    {isActive && (
                      <span className="text-[10px] font-mono font-bold ml-0.5">
                        {subject.currentPercentage}%
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recharts Canvas */}
          <div className="h-72 sm:h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {chartMode === 'area' ? (
                <AreaChart data={filteredTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <defs>
                    {SUBJECT_ANALYTICS_LIST.map((sub) => (
                      <linearGradient key={`grad-${sub.key}`} id={`grad-${sub.key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={sub.color} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={sub.color} stopOpacity={0.0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="milestone"
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis
                    domain={[65, 100]}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    unit="%"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                    iconType="circle"
                  />
                  {/* Cohort Reference Line */}
                  <Area
                    type="monotone"
                    dataKey="cohortAvg"
                    name="Cohort Average"
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                    fill="transparent"
                    strokeWidth={2}
                  />
                  {/* Render active subject areas */}
                  {SUBJECT_ANALYTICS_LIST.filter((s) => activeSubjectKeys.includes(s.key)).map((sub) => (
                    <Area
                      key={sub.key}
                      type="monotone"
                      dataKey={sub.key}
                      name={`${sub.shortName} (${sub.code})`}
                      stroke={sub.color}
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill={`url(#grad-${sub.key})`}
                    />
                  ))}
                </AreaChart>
              ) : (
                <LineChart data={filteredTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="milestone"
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis
                    domain={[70, 100]}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    unit="%"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                    iconType="circle"
                  />
                  {/* Cohort Benchmark line */}
                  <Line
                    type="monotone"
                    dataKey="cohortAvg"
                    name="Class Average Benchmark"
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                    dot={false}
                  />
                  {/* Dynamic Lines */}
                  {SUBJECT_ANALYTICS_LIST.filter((s) => activeSubjectKeys.includes(s.key)).map((sub) => (
                    <Line
                      key={sub.key}
                      type="monotone"
                      dataKey={sub.key}
                      name={`${sub.shortName} (${sub.code})`}
                      stroke={sub.color}
                      strokeWidth={2.5}
                      activeDot={{ r: 6 }}
                      dot={{ r: 3.5, strokeWidth: 1.5, fill: '#fff' }}
                    />
                  ))}
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </section>

        {/* Dual Chart Row: Bar Comparison & Skill Radar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Chart 2: Student Score vs Cohort Average */}
          <section className="bg-white rounded-2xl p-4 sm:p-5 border border-[#c4c5d5]/60 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-[#00288e]">bar_chart</span>
                  <h3 className="text-sm font-bold text-[#131b2e]">
                    Student Score vs. Class Average Benchmark
                  </h3>
                </div>
              </div>
              <p className="text-xs text-[#757684] mb-3">
                Comparing current percentage against the 118-student CSE cohort mean
              </p>
            </div>

            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonBarData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="shortName"
                    tick={{ fill: '#475569', fontSize: 10 }}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis domain={[50, 100]} unit="%" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                  <Bar dataKey="studentScore" name="Rahul's Score (%)" fill="#00288e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cohortAvg" name="Cohort Average (%)" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Chart 3: Skill Domain Radar */}
          <section className="bg-white rounded-2xl p-4 sm:p-5 border border-[#c4c5d5]/60 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-purple-700">radar</span>
                  <h3 className="text-sm font-bold text-[#131b2e]">
                    Cognitive & Technical Skill Competency
                  </h3>
                </div>
              </div>
              <p className="text-xs text-[#757684] mb-2">
                Multi-axial competency profile across theory, problem solving, algorithms, and labs
              </p>
            </div>

            <div className="h-64 sm:h-72 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius="75%" data={SKILL_DOMAIN_DATA}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[50, 100]} stroke="#cbd5e1" tick={{ fontSize: 9 }} />
                  <Radar
                    name="Rahul Sen"
                    dataKey="studentScore"
                    stroke="#00288e"
                    fill="#00288e"
                    fillOpacity={0.35}
                  />
                  <Radar
                    name="Class Average"
                    dataKey="cohortAverage"
                    stroke="#94a3b8"
                    fill="#94a3b8"
                    fillOpacity={0.15}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        {/* Course Performance Matrix Grid */}
        <section className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-[#131b2e] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-[#00288e]">grid_view</span>
                <span>Course Mastery Matrix ({filteredSubjects.length} Courses)</span>
              </h3>
              <p className="text-xs text-[#757684]">
                DAA, DBMS, WT, MLT, DA, COI, and Practical Laboratories
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex bg-white p-0.5 rounded-lg border border-[#c4c5d5]/60 text-xs">
              <button
                onClick={() => setCourseCategoryFilter('all')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  courseCategoryFilter === 'all'
                    ? 'bg-[#00288e] text-white font-bold shadow-xs'
                    : 'text-[#444653] hover:text-[#131b2e]'
                }`}
              >
                All Courses (9)
              </button>
              <button
                onClick={() => setCourseCategoryFilter('theory')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  courseCategoryFilter === 'theory'
                    ? 'bg-[#00288e] text-white font-bold shadow-xs'
                    : 'text-[#444653] hover:text-[#131b2e]'
                }`}
              >
                Theory (6)
              </button>
              <button
                onClick={() => setCourseCategoryFilter('lab')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  courseCategoryFilter === 'lab'
                    ? 'bg-[#00288e] text-white font-bold shadow-xs'
                    : 'text-[#444653] hover:text-[#131b2e]'
                }`}
              >
                Labs (3)
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredSubjects.map((sub) => (
              <div
                key={sub.key}
                onClick={() => setSelectedSubjectModal(sub)}
                className="bg-white rounded-xl p-4 border border-[#c4c5d5]/60 shadow-xs hover:shadow-md hover:border-[#00288e]/40 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#eaedff] text-[#00288e]">
                        {sub.code}
                      </span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-[#444653]">
                        {sub.category}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-xs text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      {sub.trendDelta}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-[#131b2e] leading-snug">
                    {sub.name}
                  </h4>
                  <p className="text-[11px] text-[#757684] line-clamp-2 mt-1">
                    {sub.description}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#757684]">Current Standing:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-sm text-[#00288e]">
                        {sub.currentPercentage}%
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#00288e] text-white">
                        Grade {sub.grade}
                      </span>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${sub.currentPercentage}%`,
                        backgroundColor: sub.color,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[#757684]">
                    <span>Cohort Avg: {sub.cohortAverage}%</span>
                    <span>Percentile: {sub.percentile}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Historical Assessment Log & Test Drilldown Table */}
        <section className="bg-white rounded-2xl p-4 sm:p-5 border border-[#c4c5d5]/60 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#c4c5d5]/40">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#131b2e] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[20px] text-[#00288e]">history_edu</span>
                <span>Verified Historical Assessment Log</span>
              </h3>
              <p className="text-xs text-[#757684]">
                Chronological list of Mid-Terms, Unit Tests, and Practical Assessments
              </p>
            </div>

            {/* Search input */}
            <div className="relative w-full sm:w-64">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px] text-[#757684]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search subject or test..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#faf8ff] border border-[#c4c5d5]/60 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00288e]"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-[#c4c5d5]/50 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#f2f3ff] text-[#00288e] font-bold border-b border-[#c4c5d5]/60">
                <tr>
                  <th className="py-2.5 px-3">Subject Code</th>
                  <th className="py-2.5 px-3">Course & Assessment Title</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Score</th>
                  <th className="py-2.5 px-3">Percentage</th>
                  <th className="py-2.5 px-3">Class Rank</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTestRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-[#faf8ff] transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#00288e]">
                      {rec.subjectCode}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-[#131b2e]">{rec.testName}</div>
                      <div className="text-[10px] text-[#757684]">{rec.subjectName}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[#444653] whitespace-nowrap">
                      {rec.date}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[#131b2e]">
                      {rec.obtainedMarks} / {rec.totalMarks}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-[#00288e] bg-[#eaedff] px-2 py-0.5 rounded text-[11px]">
                        {rec.percentage}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[#444653]">
                      #{rec.classRank} / {rec.cohortSize}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] font-semibold text-[#00563a] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 w-max">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        {rec.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Subject Deep-Dive Modal */}
      {selectedSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#c4c5d5] p-5 space-y-4 my-auto">
            <div className="flex items-start justify-between gap-3 border-b border-[#c4c5d5]/40 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#eaedff] text-[#00288e]">
                    {selectedSubjectModal.code}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-[#444653]">
                    {selectedSubjectModal.category} Course
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#131b2e] mt-1">
                  {selectedSubjectModal.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSubjectModal(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-[#757684]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-[#faf8ff] p-3 rounded-xl border border-[#c4c5d5]/50">
                <span className="text-[#757684] block text-[10px] uppercase font-bold">Latest Score</span>
                <span className="text-lg font-extrabold text-[#00288e]">
                  {selectedSubjectModal.latestScore} / {selectedSubjectModal.maxScore} ({selectedSubjectModal.currentPercentage}%)
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold block">
                  Growth: {selectedSubjectModal.trendDelta}
                </span>
              </div>
              <div className="bg-[#faf8ff] p-3 rounded-xl border border-[#c4c5d5]/50">
                <span className="text-[#757684] block text-[10px] uppercase font-bold">Cohort Benchmark</span>
                <span className="text-lg font-extrabold text-[#131b2e]">
                  {selectedSubjectModal.cohortAverage}%
                </span>
                <span className="text-[10px] text-[#757684] block">
                  Cohort Highest: {selectedSubjectModal.cohortHighest}%
                </span>
              </div>
            </div>

            <div className="space-y-1 text-xs text-[#444653] bg-slate-50 p-3 rounded-xl border border-[#c4c5d5]/40">
              <div>
                <strong className="text-[#131b2e]">Faculty In-Charge:</strong> {selectedSubjectModal.facultyInCharge}
              </div>
              <div>
                <strong className="text-[#131b2e]">Course Credits:</strong> {selectedSubjectModal.credits} Academic Credits
              </div>
              <div>
                <strong className="text-[#131b2e]">Curriculum Scope:</strong> {selectedSubjectModal.description}
              </div>
            </div>

            <div className="flex gap-2">
              {onSelectSubjectForScorecard && (
                <button
                  onClick={() => {
                    onSelectSubjectForScorecard(selectedSubjectModal.key);
                    setSelectedSubjectModal(null);
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#00288e] text-white font-bold text-xs shadow-xs hover:bg-[#1e40af] transition-all"
                >
                  Open Detailed Scorecard
                </button>
              )}
              <button
                onClick={() => setSelectedSubjectModal(null)}
                className="py-2 px-4 rounded-xl bg-slate-100 text-[#444653] font-semibold text-xs hover:bg-slate-200 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
