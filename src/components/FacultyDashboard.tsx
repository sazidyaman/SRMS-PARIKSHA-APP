import React, { useState } from 'react';
import { SubjectKey, Tutorial, PreviousYearQuestion, UserProfile, LeaveApplication, LeaveStatus } from '../types';
import { SUBJECT_DATA } from '../data/subjects';

interface FacultyDashboardProps {
  currentUser: UserProfile;
  tutorials: Tutorial[];
  pyqs: PreviousYearQuestion[];
  leaveApplications?: LeaveApplication[];
  onUpdateLeaveStatus?: (id: string, status: LeaveStatus, remarks: string, reviewerName: string) => void;
  onOpenAvatarPicker?: () => void;
  onAddTutorial: (tutorial: Omit<Tutorial, 'id' | 'createdAt'>) => void;
  onDeleteTutorial: (id: string) => void;
  onAddPYQ: (pyq: Omit<PreviousYearQuestion, 'id' | 'createdAt'>) => void;
  onDeletePYQ: (id: string) => void;
  onSignOut: () => void;
  onSwitchToStudentView: () => void;
}

export const FacultyDashboard: React.FC<FacultyDashboardProps> = ({
  currentUser,
  tutorials,
  pyqs,
  leaveApplications = [],
  onUpdateLeaveStatus,
  onOpenAvatarPicker,
  onAddTutorial,
  onDeleteTutorial,
  onAddPYQ,
  onDeletePYQ,
  onSignOut,
  onSwitchToStudentView,
}) => {
  const [activeTab, setActiveTab] = useState<'tutorials' | 'pyqs' | 'leaves'>('tutorials');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<SubjectKey | 'ALL'>('ALL');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'mine'>('all');
  const [leaveFilter, setLeaveFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [leaveRemarksMap, setLeaveRemarksMap] = useState<Record<string, string>>({});

  // Add Tutorial Modal State (Tailored for All College Faculties & Semesters)
  const [isAddTutorialOpen, setIsAddTutorialOpen] = useState(false);
  const [tutTitle, setTutTitle] = useState('');
  const [tutSubject, setTutSubject] = useState<SubjectKey>(currentUser.primarySubject || 'DAA');
  const [tutSemester, setTutSemester] = useState(currentUser.teachingSemester || 'Semester V (3rd Year)');
  const [tutUnit, setTutUnit] = useState('');
  const [tutDesc, setTutDesc] = useState('');
  const [tutDuration, setTutDuration] = useState(45);
  const [tutVideoUrl, setTutVideoUrl] = useState('');
  const [tutPdfUrl, setTutPdfUrl] = useState('');
  const [tutDifficulty, setTutDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');

  // Add PYQ Modal State (Tailored for All College Faculties & Semesters)
  const [isAddPYQOpen, setIsAddPYQOpen] = useState(false);
  const [pyqTitle, setPyqTitle] = useState('');
  const [pyqSubject, setPyqSubject] = useState<SubjectKey>(currentUser.primarySubject || 'DAA');
  const [pyqSemester, setPyqSemester] = useState(currentUser.teachingSemester || 'Semester V (3rd Year)');
  const [pyqYear, setPyqYear] = useState('2023–24');
  const [pyqExamType, setPyqExamType] = useState<'Mid-Term I' | 'Mid-Term II' | 'End-Semester'>('Mid-Term II');
  const [pyqMarks, setPyqMarks] = useState(50);
  const [pyqPdfUrl, setPyqPdfUrl] = useState('');
  const [pyqQuestionsText, setPyqQuestionsText] = useState('');
  const [pyqSolution, setPyqSolution] = useState(true);

  // Success toast
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleTutorialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tutTitle || !tutUnit) return;

    onAddTutorial({
      title: tutTitle,
      subjectKey: tutSubject,
      unitName: tutUnit,
      description: tutDesc || `Tutorial lecture module for ${SUBJECT_DATA[tutSubject].name}`,
      authorName: currentUser.name,
      authorRole: currentUser.designation || 'Faculty Professor',
      authorId: currentUser.id,
      semester: tutSemester,
      pdfNotesUrl: tutPdfUrl.trim() || undefined,
      durationMinutes: Number(tutDuration) || 45,
      videoUrl: tutVideoUrl || 'https://www.youtube.com',
      difficulty: tutDifficulty,
    });

    setIsAddTutorialOpen(false);
    setTutTitle('');
    setTutUnit('');
    setTutDesc('');
    setTutVideoUrl('');
    setTutPdfUrl('');
    showToast('Tutorial lecture published successfully!');
  };

  const handlePYQSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pyqTitle) return;

    const questionsList = pyqQuestionsText
      ? pyqQuestionsText.split('\n').filter((q) => q.trim().length > 0)
      : [
          `Q1: Explain fundamental theorems and principles of ${SUBJECT_DATA[pyqSubject].name}. (10 Marks)`,
          `Q2: Derive computational complexity and mathematical formulation. (15 Marks)`,
          `Q3: Implement optimal algorithmic or analytical design. (15 Marks)`,
          `Q4: Solve practical case study and edge scenarios. (10 Marks)`,
        ];

    onAddPYQ({
      title: pyqTitle,
      subjectKey: pyqSubject,
      academicYear: pyqYear,
      examType: pyqExamType,
      totalMarks: Number(pyqMarks) || 50,
      uploadedBy: currentUser.name,
      authorId: currentUser.id,
      semester: pyqSemester,
      fileUrl: pyqPdfUrl.trim() || undefined,
      questionsSnippet: questionsList,
      solutionAvailable: pyqSolution,
    });

    setIsAddPYQOpen(false);
    setPyqTitle('');
    setPyqQuestionsText('');
    setPyqPdfUrl('');
    showToast('Previous Year Question Paper added successfully!');
  };

  // Base subject-filtered lists
  const subjectFilteredTutorials = selectedSubjectFilter === 'ALL'
    ? tutorials
    : tutorials.filter((t) => t.subjectKey === selectedSubjectFilter);

  const subjectFilteredPYQs = selectedSubjectFilter === 'ALL'
    ? pyqs
    : pyqs.filter((p) => p.subjectKey === selectedSubjectFilter);

  // Scope-filtered lists (All College Materials vs My Uploads)
  const isMineTutorial = (t: Tutorial) =>
    (t.authorId && t.authorId === currentUser.id) ||
    t.authorName.toLowerCase() === currentUser.name.toLowerCase();

  const isMinePYQ = (p: PreviousYearQuestion) =>
    (p.authorId && p.authorId === currentUser.id) ||
    p.uploadedBy.toLowerCase() === currentUser.name.toLowerCase();

  const myTutorialsCount = tutorials.filter(isMineTutorial).length;
  const myPYQsCount = pyqs.filter(isMinePYQ).length;

  const filteredTutorials = scopeFilter === 'mine'
    ? subjectFilteredTutorials.filter(isMineTutorial)
    : subjectFilteredTutorials;

  const filteredPYQs = scopeFilter === 'mine'
    ? subjectFilteredPYQs.filter(isMinePYQ)
    : subjectFilteredPYQs;

  const ALL_SUBJECTS: SubjectKey[] = ['DAA', 'DBMS', 'WT', 'MLT', 'DA', 'COI'];

  const pendingLeaves = leaveApplications.filter((app) => app.status === 'pending');
  const pendingLeavesCount = pendingLeaves.length;

  const handleStatusChange = (appId: string, status: LeaveStatus) => {
    const remarks =
      leaveRemarksMap[appId] ||
      (status === 'approved'
        ? 'Approved by faculty mentor. Attendance excused.'
        : 'Leave application rejected. Contact department coordinator.');
    if (onUpdateLeaveStatus) {
      onUpdateLeaveStatus(appId, status, remarks, currentUser.name);
      showToast(`Leave application marked as ${status.toUpperCase()}!`);
    }
  };

  const filteredLeaveApplications = leaveApplications.filter((app) => {
    if (leaveFilter === 'all') return true;
    return app.status === leaveFilter;
  });

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#131b2e] pb-24 flex flex-col justify-between">
      {/* Top Faculty Header Bar */}
      <header className="sticky top-0 z-40 bg-[#faf8ff] border-b border-[#c4c5d5]/40 px-4 h-14 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          {/* Faculty Avatar with Change Photo Trigger */}
          <button
            type="button"
            onClick={onOpenAvatarPicker}
            className="relative group cursor-pointer focus:outline-none shrink-0"
            title="Click to customize profile avatar"
          >
            <img
              src={
                currentUser.avatarUrl ||
                'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80'
              }
              alt={currentUser.name}
              className="w-9 h-9 rounded-xl object-cover border-2 border-[#00288e]/40 shadow-xs group-hover:scale-105 transition-transform bg-white"
            />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#00288e] text-white flex items-center justify-center text-[8px] shadow">
              <i className="fas fa-camera"></i>
            </span>
          </button>

          <div>
            <h1 className="text-sm font-bold text-[#00288e] leading-tight flex items-center gap-1.5 flex-wrap">
              <span>Faculty Academic Console</span>
              <span className="text-[10px] bg-[#eaedff] text-[#00288e] px-1.5 py-0.5 rounded font-mono font-bold">
                {currentUser.identifier}
              </span>
              {currentUser.primarySubject && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded font-mono">
                  {currentUser.primarySubject}
                </span>
              )}
              {currentUser.teachingSemester && (
                <span className="text-[10px] bg-purple-100 text-purple-800 font-semibold px-1.5 py-0.5 rounded">
                  {currentUser.teachingSemester.split('(')[0].trim()}
                </span>
              )}
            </h1>
            <p className="text-[11px] text-[#444653]">
              {currentUser.name} • {currentUser.designation || 'Faculty Professor'} • {currentUser.department?.replace('Department of ', '')}
            </p>
          </div>
        </div>

        {/* Action Controls: Switch to Student or Sign Out */}
        <div className="flex items-center gap-2">
          <button
            onClick={onSwitchToStudentView}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#eaedff] text-[#00288e] hover:bg-[#d2d9f4] text-xs font-semibold transition-colors"
            title="Preview Student Portal"
          >
            <span className="material-symbols-outlined text-[15px]">visibility</span>
            <span className="hidden sm:inline">Student View</span>
          </button>
          <button
            onClick={onSignOut}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 text-xs font-semibold transition-colors"
            title="Sign Out"
          >
            <span className="material-symbols-outlined text-[15px]">logout</span>
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-4xl mx-auto px-4 pt-3 space-y-4 flex-1">
        {/* Toast Notification */}
        {toastMsg && (
          <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-xs flex items-center gap-2 shadow-sm animate-fade-in">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span className="font-semibold">{toastMsg}</span>
          </div>
        )}

        {/* Faculty Bento Stats */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-white p-3 rounded-xl border border-[#c4c5d5]/60 shadow-xs text-center">
            <span className="text-[10px] text-[#757684] block font-medium">All Tutorials</span>
            <span className="text-lg font-bold text-[#00288e]">{tutorials.length}</span>
            <span className="text-[9px] text-emerald-700 font-semibold block">My Uploads: {myTutorialsCount}</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-[#c4c5d5]/60 shadow-xs text-center">
            <span className="text-[10px] text-[#757684] block font-medium">All PYQ Papers</span>
            <span className="text-lg font-bold text-[#00288e]">{pyqs.length}</span>
            <span className="text-[9px] text-emerald-700 font-semibold block">My Uploads: {myPYQsCount}</span>
          </div>
          <div
            onClick={() => setActiveTab('leaves')}
            className={`p-3 rounded-xl border shadow-xs text-center cursor-pointer transition-all ${
              pendingLeavesCount > 0
                ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/30'
                : 'bg-white border-[#c4c5d5]/60 hover:bg-slate-50'
            }`}
          >
            <span className="text-[10px] text-[#757684] block font-medium">Student Leaves</span>
            <span className={`text-lg font-bold ${pendingLeavesCount > 0 ? 'text-amber-700' : 'text-[#00288e]'}`}>
              {leaveApplications.length}
            </span>
            <span className={`text-[9px] font-bold block ${pendingLeavesCount > 0 ? 'text-red-600 animate-pulse' : 'text-[#757684]'}`}>
              {pendingLeavesCount > 0 ? `⚠️ ${pendingLeavesCount} Pending Review` : 'All Reviewed'}
            </span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-[#c4c5d5]/60 shadow-xs text-center">
            <span className="text-[10px] text-[#757684] block font-medium">Semester Cohort</span>
            <span className="text-lg font-bold text-[#131b2e]">{currentUser.teachingSemester ? currentUser.teachingSemester.split('(')[0].trim() : 'Sem V'}</span>
            <span className="text-[9px] text-[#757684] block">{currentUser.primarySubject || 'DAA'} In-Charge</span>
          </div>
        </section>

        {/* Action Bar: Create Buttons & View Switcher */}
        <section className="bg-white p-3 rounded-xl border border-[#c4c5d5]/60 shadow-xs space-y-3">
          <div className="grid grid-cols-3 p-1 bg-[#eaedff] rounded-lg text-xs font-semibold gap-1">
            <button
              onClick={() => setActiveTab('tutorials')}
              className={`py-1.5 rounded-md flex items-center justify-center gap-1 transition-all ${
                activeTab === 'tutorials'
                  ? 'bg-white text-[#00288e] shadow-xs font-bold'
                  : 'text-[#444653]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">video_library</span>
              <span className="hidden sm:inline">Tutorials</span> ({tutorials.length})
            </button>
            <button
              onClick={() => setActiveTab('pyqs')}
              className={`py-1.5 rounded-md flex items-center justify-center gap-1 transition-all ${
                activeTab === 'pyqs'
                  ? 'bg-white text-[#00288e] shadow-xs font-bold'
                  : 'text-[#444653]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">history_edu</span>
              <span className="hidden sm:inline">PYQ Papers</span> ({pyqs.length})
            </button>
            <button
              onClick={() => setActiveTab('leaves')}
              className={`py-1.5 rounded-md flex items-center justify-center gap-1 transition-all relative ${
                activeTab === 'leaves'
                  ? 'bg-white text-[#00288e] shadow-xs font-bold'
                  : 'text-[#444653]'
              }`}
            >
              <i className="fas fa-file-signature text-[12px]"></i>
              <span className="hidden sm:inline">Student Leaves</span>
              {pendingLeavesCount > 0 ? (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[9px] font-bold animate-pulse">
                  {pendingLeavesCount} New
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 font-normal">({leaveApplications.length})</span>
              )}
            </button>
          </div>

          {/* Action Trigger Buttons + Scope Toggle for Tutorials & PYQs */}
          {activeTab !== 'leaves' && (
            <div className="space-y-2">
              <div className="flex gap-2">
                {activeTab === 'tutorials' ? (
                  <button
                    onClick={() => setIsAddTutorialOpen(true)}
                    className="w-full py-2 px-3 rounded-xl bg-[#00288e] hover:bg-[#1e40af] text-white text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">add_circle</span>
                    <span>Add Video Tutorial / Course Notes</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsAddPYQOpen(true)}
                    className="w-full py-2 px-3 rounded-xl bg-[#00288e] hover:bg-[#1e40af] text-white text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">post_add</span>
                    <span>Add Previous Year Question Paper (PYQ)</span>
                  </button>
                )}
              </div>

              {/* Scope Switcher: All College Materials vs My Uploads Only */}
              <div className="flex items-center justify-between p-1.5 bg-[#f8f9ff] rounded-lg border border-[#c4c5d5]/40 text-xs">
                <span className="text-[11px] font-medium text-[#444653] pl-1">
                  Repository Scope:
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setScopeFilter('all')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                      scopeFilter === 'all'
                        ? 'bg-[#00288e] text-white shadow-xs'
                        : 'bg-white text-[#444653] hover:bg-slate-100'
                    }`}
                  >
                    All College Faculty
                  </button>
                  <button
                    type="button"
                    onClick={() => setScopeFilter('mine')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                      scopeFilter === 'mine'
                        ? 'bg-[#00288e] text-white shadow-xs'
                        : 'bg-white text-[#444653] hover:bg-slate-100'
                    }`}
                  >
                    <span>My Uploads</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded font-bold">
                      {activeTab === 'tutorials' ? myTutorialsCount : myPYQsCount}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Filter Pills */}
          {activeTab === 'leaves' ? (
            <div className="pt-2 border-t border-[#c4c5d5]/30">
              <span className="text-[10px] font-semibold text-[#757684] block mb-1.5 uppercase">
                Filter by Application Status:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {(['all', 'pending', 'approved', 'rejected'] as const).map((filterVal) => {
                  const count =
                    filterVal === 'all'
                      ? leaveApplications.length
                      : leaveApplications.filter((a) => a.status === filterVal).length;
                  return (
                    <button
                      key={filterVal}
                      onClick={() => setLeaveFilter(filterVal)}
                      className={`text-[11px] px-2.5 py-1 rounded-full font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${
                        leaveFilter === filterVal
                          ? 'bg-[#00288e] text-white shadow-xs'
                          : 'bg-[#f2f3ff] text-[#444653] hover:bg-[#eaedff]'
                      }`}
                    >
                      <span>{filterVal.charAt(0).toUpperCase() + filterVal.slice(1)}</span>
                      <span className="text-[10px] opacity-80">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Subject Filter Pills (MLT, WT, DAA, DBMS, DA, COI) */
            <div className="pt-2 border-t border-[#c4c5d5]/30">
              <span className="text-[10px] font-semibold text-[#757684] block mb-1.5 uppercase">
                Filter by Subject:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                <button
                  onClick={() => setSelectedSubjectFilter('ALL')}
                  className={`text-[11px] px-2.5 py-1 rounded-full font-semibold transition-all whitespace-nowrap ${
                    selectedSubjectFilter === 'ALL'
                      ? 'bg-[#00288e] text-white shadow-xs'
                      : 'bg-[#f2f3ff] text-[#444653] hover:bg-[#eaedff]'
                  }`}
                >
                  All Courses
                </button>
              {ALL_SUBJECTS.map((subKey) => (
                <button
                  key={subKey}
                  onClick={() => setSelectedSubjectFilter(subKey)}
                  className={`text-[11px] px-2.5 py-1 rounded-full font-semibold transition-all whitespace-nowrap ${
                    selectedSubjectFilter === subKey
                      ? 'bg-[#00288e] text-white shadow-xs'
                      : 'bg-[#f2f3ff] text-[#444653] hover:bg-[#eaedff]'
                  }`}
                >
                  {subKey}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

        {/* Tab 1: Tutorials List */}
        {activeTab === 'tutorials' && (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-bold text-[#131b2e] uppercase tracking-wide">
                Published Tutorials ({filteredTutorials.length})
              </h2>
              <span className="text-[11px] text-[#757684]">MLT, WT, DAA, DBMS, DA, COI</span>
            </div>

            {filteredTutorials.length === 0 ? (
              <div className="bg-white p-6 rounded-xl border border-[#c4c5d5] text-center text-xs text-[#757684]">
                No tutorials found for this subject. Click above to add one.
              </div>
            ) : (
              filteredTutorials.map((tut) => {
                const sub = SUBJECT_DATA[tut.subjectKey];
                const isMine = (tut.authorId && tut.authorId === currentUser.id) ||
                  tut.authorName.toLowerCase() === currentUser.name.toLowerCase();

                return (
                  <div
                    key={tut.id}
                    className="bg-white p-3.5 rounded-xl border border-[#c4c5d5]/60 shadow-xs space-y-2 relative"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className="font-mono text-[10px] font-bold text-[#00288e] bg-[#eaedff] px-1.5 py-0.5 rounded">
                            {sub.code} ({tut.subjectKey})
                          </span>
                          {tut.semester && (
                            <span className="text-[10px] font-semibold text-purple-800 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded">
                              {tut.semester.split('(')[0].trim()}
                            </span>
                          )}
                          <span className="text-[10px] font-semibold text-[#00563a] bg-[#ECFDF5] border border-[#A7F3D0] px-1.5 py-0.5 rounded">
                            {tut.difficulty}
                          </span>
                          <span className="text-[10px] text-[#757684]">• {tut.durationMinutes} mins</span>
                          {isMine && (
                            <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-full">
                              My Upload
                            </span>
                          )}
                        </div>
                        <h3 className="text-xs font-bold text-[#131b2e] leading-snug">{tut.title}</h3>
                        <p className="text-[11px] text-[#0051d5] font-medium">{tut.unitName}</p>
                      </div>

                      <button
                        onClick={() => onDeleteTutorial(tut.id)}
                        className="text-[#757684] hover:text-red-600 p-1 transition-colors cursor-pointer"
                        title="Delete Tutorial"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>

                    <p className="text-xs text-[#444653] leading-relaxed line-clamp-2">
                      {tut.description}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-[#c4c5d5]/30 text-[11px] text-[#757684] flex-wrap gap-2">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">account_circle</span>
                        <strong className="text-slate-800">{tut.authorName}</strong>
                        {tut.authorRole && (
                          <span className="text-[10px] text-slate-500 hidden sm:inline">
                            • {tut.authorRole}
                          </span>
                        )}
                      </span>

                      <div className="flex items-center gap-2">
                        {tut.pdfNotesUrl && (
                          <a
                            href={tut.pdfNotesUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-semibold hover:bg-emerald-100 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[13px]">description</span>
                            <span>Notes PDF</span>
                          </a>
                        )}
                        {tut.videoUrl && (
                          <a
                            href={tut.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[#00288e] bg-[#eaedff] px-2 py-0.5 rounded text-[10px] font-semibold hover:bg-[#d5dcfb] transition-colors"
                          >
                            <span className="material-symbols-outlined text-[14px]">play_circle</span>
                            <span>Watch Lecture</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </section>
        )}

        {/* Tab 2: Previous Year Questions (PYQs) List */}
        {activeTab === 'pyqs' && (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-bold text-[#131b2e] uppercase tracking-wide">
                Archived PYQ Papers ({filteredPYQs.length})
              </h2>
              <span className="text-[11px] text-[#757684]">All Semesters</span>
            </div>

            {filteredPYQs.length === 0 ? (
              <div className="bg-white p-6 rounded-xl border border-[#c4c5d5] text-center text-xs text-[#757684]">
                No question papers found for this filter.
              </div>
            ) : (
              filteredPYQs.map((paper) => {
                const sub = SUBJECT_DATA[paper.subjectKey];
                const isMine = (paper.authorId && paper.authorId === currentUser.id) ||
                  paper.uploadedBy.toLowerCase() === currentUser.name.toLowerCase();

                return (
                  <div
                    key={paper.id}
                    className="bg-white p-3.5 rounded-xl border border-[#c4c5d5]/60 shadow-xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className="font-mono text-[10px] font-bold text-[#00288e] bg-[#eaedff] px-1.5 py-0.5 rounded">
                            {sub.code} ({paper.subjectKey})
                          </span>
                          {paper.semester && (
                            <span className="text-[10px] font-semibold text-purple-800 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded">
                              {paper.semester.split('(')[0].trim()}
                            </span>
                          )}
                          <span className="text-[10px] font-semibold text-[#0051d5] bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                            {paper.academicYear}
                          </span>
                          <span className="text-[10px] font-semibold text-[#444653] bg-slate-100 px-1.5 py-0.5 rounded">
                            {paper.examType}
                          </span>
                          {isMine && (
                            <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-full">
                              My Upload
                            </span>
                          )}
                        </div>
                        <h3 className="text-xs font-bold text-[#131b2e] leading-snug">{paper.title}</h3>
                      </div>

                      <button
                        onClick={() => onDeletePYQ(paper.id)}
                        className="text-[#757684] hover:text-red-600 p-1 transition-colors cursor-pointer"
                        title="Delete Question Paper"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>

                    <div className="bg-[#faf8ff] p-2.5 rounded-lg border border-[#c4c5d5]/40 space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-[#131b2e] mb-1">
                        <span>Question Stems Preview:</span>
                        <span className="text-[#00288e] font-mono">{paper.totalMarks} Marks Total</span>
                      </div>
                      {paper.questionsSnippet.map((q, idx) => (
                        <p key={idx} className="text-[11px] text-[#444653] font-mono line-clamp-1">
                          • {q}
                        </p>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <span className="text-[#757684]">
                        Uploaded by: <strong className="text-slate-800">{paper.uploadedBy}</strong>
                      </span>
                      {paper.fileUrl ? (
                        <a
                          href={paper.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[#00288e] bg-[#eaedff] px-2.5 py-1 rounded font-bold hover:bg-[#d5dcfb] transition-colors"
                        >
                          <span className="material-symbols-outlined text-[15px]">file_download</span>
                          <span>Open PDF Paper</span>
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => showToast(`Opening Question Paper for ${sub.code} (${paper.academicYear})...`)}
                          className="flex items-center gap-1 text-[#00288e] font-bold hover:underline cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[15px]">file_download</span>
                          <span>Download PDF</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </section>
        )}

        {/* Tab 3: Student Leave Applications Review Console */}
        {activeTab === 'leaves' && (
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="text-xs font-bold text-[#131b2e] uppercase tracking-wide flex items-center gap-2">
                  <span>Student Absence & Leave Requests</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                    {filteredLeaveApplications.length} Loaded
                  </span>
                </h2>
                <p className="text-[11px] text-[#757684]">
                  Review medical, weather, and emergency absences to excuse attendance
                </p>
              </div>
            </div>

            {filteredLeaveApplications.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-[#c4c5d5] text-center text-xs text-[#757684]">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
                  <i className="fas fa-clipboard-check text-xl"></i>
                </div>
                <p className="font-bold text-slate-700">No applications in this category.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  All student leave applications for this status filter have been resolved.
                </p>
              </div>
            ) : (
              filteredLeaveApplications.map((app) => {
                const isPending = app.status === 'pending';
                const currentRemark = leaveRemarksMap[app.id] ?? '';

                const categoryIcon =
                  app.reasonCategory === 'sickness'
                    ? 'fa-user-md text-red-500'
                    : app.reasonCategory === 'rainy_day'
                    ? 'fa-cloud-showers-heavy text-blue-500'
                    : app.reasonCategory === 'family_emergency'
                    ? 'fa-home text-amber-500'
                    : app.reasonCategory === 'academic_duty'
                    ? 'fa-trophy text-emerald-500'
                    : 'fa-question-circle text-purple-500';

                return (
                  <div
                    key={app.id}
                    className={`bg-white rounded-xl border p-4 shadow-sm transition-all space-y-3 ${
                      isPending
                        ? 'border-amber-300 ring-1 ring-amber-200'
                        : app.status === 'approved'
                        ? 'border-emerald-200'
                        : 'border-slate-200'
                    }`}
                  >
                    {/* Header Row: Student + Status */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-lg shrink-0 mt-0.5">
                          <i className={`fas ${categoryIcon}`}></i>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-xs font-bold text-slate-900">{app.studentName}</h3>
                            <span className="text-[10px] font-mono font-bold text-[#00288e] bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                              Roll: {app.aktuRollNo}
                            </span>
                            <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                              Reg: {app.collegeRegNo}
                            </span>
                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                              {app.branch}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-800 mt-1">
                            {app.reasonTitle}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Submitted on {app.appliedAt} • Assigned Mentor: {app.mentorFacultyName.split('(')[0].trim()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-start">
                        {app.status === 'approved' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                            <i className="fas fa-check-circle"></i> Approved
                          </span>
                        )}
                        {app.status === 'rejected' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-300 flex items-center gap-1">
                            <i className="fas fa-times-circle"></i> Rejected
                          </span>
                        )}
                        {isPending && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 animate-pulse">
                            <i className="fas fa-clock"></i> Action Required
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Meta badges: Duration & Date Range */}
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 font-medium">
                          Period: <strong className="text-slate-800">{app.startDate}</strong> to <strong className="text-slate-800">{app.endDate}</strong>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-[#00288e] font-bold text-[11px]">
                          {app.numberOfDays} {app.numberOfDays === 1 ? 'Day' : 'Days'} Total
                        </span>
                      </div>
                      {app.attachmentName && (
                        <div className="flex items-center gap-1.5 text-blue-700 text-xs font-semibold">
                          <i className="fas fa-paperclip"></i>
                          <span className="underline cursor-pointer" onClick={() => showToast(`Opening ${app.attachmentName}...`)}>
                            {app.attachmentName}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Detailed Reason */}
                    <p className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-100 leading-relaxed">
                      {app.detailedReason}
                    </p>

                    {/* If Pending: Review Controls */}
                    {isPending ? (
                      <div className="pt-2 border-t border-slate-200 space-y-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Mentor Verification Remarks / Conditions:
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., Approved. Lab practicals to be completed next week."
                            value={currentRemark}
                            onChange={(e) =>
                              setLeaveRemarksMap({
                                ...leaveRemarksMap,
                                [app.id]: e.target.value,
                              })
                            }
                            className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00288e]"
                          />
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(app.id, 'rejected')}
                            className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                          >
                            <i className="fas fa-times"></i>
                            Reject Request
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(app.id, 'approved')}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                          >
                            <i className="fas fa-check"></i>
                            Approve Leave
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Resolved status summary */
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>
                          Reviewed by <strong>{app.approvedBy || currentUser.name}</strong>: {app.facultyRemarks || 'No remarks recorded.'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {app.reviewedAt || 'Recorded in AMS'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </section>
        )}
      </main>

      {/* Add Tutorial Modal */}
      {isAddTutorialOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl border border-[#c4c5d5] space-y-3 my-auto">
            <div className="flex items-center justify-between border-b border-[#c4c5d5]/40 pb-2">
              <h3 className="font-bold text-sm text-[#131b2e] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#00288e] text-[18px]">video_call</span>
                Add Faculty Tutorial / Course Note
              </h3>
              <button onClick={() => setIsAddTutorialOpen(false)} className="text-[#757684]">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleTutorialSubmit} className="space-y-2.5 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-[#131b2e] mb-1">Subject</label>
                  <select
                    value={tutSubject}
                    onChange={(e) => setTutSubject(e.target.value as SubjectKey)}
                    className="w-full p-2 rounded-lg border border-[#c4c5d5] outline-none bg-[#faf8ff]"
                  >
                    {ALL_SUBJECTS.map((key) => (
                      <option key={key} value={key}>
                        {key} - {SUBJECT_DATA[key].shortName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#131b2e] mb-1">Semester</label>
                  <select
                    value={tutSemester}
                    onChange={(e) => setTutSemester(e.target.value)}
                    className="w-full p-2 rounded-lg border border-[#c4c5d5] outline-none bg-[#faf8ff]"
                  >
                    <option value="Semester I (1st Year)">Sem I</option>
                    <option value="Semester II (1st Year)">Sem II</option>
                    <option value="Semester III (2nd Year)">Sem III</option>
                    <option value="Semester IV (2nd Year)">Sem IV</option>
                    <option value="Semester V (3rd Year)">Sem V</option>
                    <option value="Semester VI (3rd Year)">Sem VI</option>
                    <option value="Semester VII (4th Year)">Sem VII</option>
                    <option value="Semester VIII (4th Year)">Sem VIII</option>
                    <option value="All Semesters">All Sem</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#131b2e] mb-1">Difficulty</label>
                  <select
                    value={tutDifficulty}
                    onChange={(e) => setTutDifficulty(e.target.value as any)}
                    className="w-full p-2 rounded-lg border border-[#c4c5d5] outline-none bg-[#faf8ff]"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#131b2e] mb-1">Tutorial Title</label>
                <input
                  type="text"
                  value={tutTitle}
                  onChange={(e) => setTutTitle(e.target.value)}
                  placeholder="e.g. Dynamic Programming Memoization Matrix"
                  required
                  className="w-full p-2 rounded-lg border border-[#c4c5d5] outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#131b2e] mb-1">Syllabus Unit</label>
                <input
                  type="text"
                  value={tutUnit}
                  onChange={(e) => setTutUnit(e.target.value)}
                  placeholder="e.g. Unit 3: Graph Traversal & Networks"
                  required
                  className="w-full p-2 rounded-lg border border-[#c4c5d5] outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#131b2e] mb-1">Description / Summary</label>
                <textarea
                  value={tutDesc}
                  onChange={(e) => setTutDesc(e.target.value)}
                  placeholder="Key concepts covered in this module..."
                  rows={2}
                  className="w-full p-2 rounded-lg border border-[#c4c5d5] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-[#131b2e] mb-1">Video URL (YouTube/Drive)</label>
                  <input
                    type="url"
                    value={tutVideoUrl}
                    onChange={(e) => setTutVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/..."
                    className="w-full p-2 rounded-lg border border-[#c4c5d5] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#131b2e] mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    value={tutDuration}
                    onChange={(e) => setTutDuration(Number(e.target.value))}
                    min={5}
                    max={180}
                    className="w-full p-2 rounded-lg border border-[#c4c5d5] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#131b2e] mb-1">
                  Accompanying PDF Notes Link (Optional Drive / Web URL)
                </label>
                <input
                  type="url"
                  value={tutPdfUrl}
                  onChange={(e) => setTutPdfUrl(e.target.value)}
                  placeholder="https://drive.google.com/... or https://...notes.pdf"
                  className="w-full p-2 rounded-lg border border-[#c4c5d5] outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-[#c4c5d5]/40">
                <button
                  type="button"
                  onClick={() => setIsAddTutorialOpen(false)}
                  className="flex-1 py-2 border border-[#c4c5d5] rounded-xl font-semibold text-[#444653]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#00288e] text-white rounded-xl font-bold hover:bg-[#1e40af]"
                >
                  Publish Tutorial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add PYQ Paper Modal */}
      {isAddPYQOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl border border-[#c4c5d5] space-y-3 my-auto">
            <div className="flex items-center justify-between border-b border-[#c4c5d5]/40 pb-2">
              <h3 className="font-bold text-sm text-[#131b2e] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#00288e] text-[18px]">post_add</span>
                Upload Previous Year Question Paper (PYQ)
              </h3>
              <button onClick={() => setIsAddPYQOpen(false)} className="text-[#757684]">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handlePYQSubmit} className="space-y-2.5 text-xs">
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block font-semibold text-[#131b2e] mb-1">Subject</label>
                  <select
                    value={pyqSubject}
                    onChange={(e) => setPyqSubject(e.target.value as SubjectKey)}
                    className="w-full p-2 rounded-lg border border-[#c4c5d5] outline-none bg-[#faf8ff]"
                  >
                    {ALL_SUBJECTS.map((key) => (
                      <option key={key} value={key}>
                        {key}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#131b2e] mb-1">Semester</label>
                  <select
                    value={pyqSemester}
                    onChange={(e) => setPyqSemester(e.target.value)}
                    className="w-full p-2 rounded-lg border border-[#c4c5d5] outline-none bg-[#faf8ff]"
                  >
                    <option value="Semester I (1st Year)">Sem I</option>
                    <option value="Semester II (1st Year)">Sem II</option>
                    <option value="Semester III (2nd Year)">Sem III</option>
                    <option value="Semester IV (2nd Year)">Sem IV</option>
                    <option value="Semester V (3rd Year)">Sem V</option>
                    <option value="Semester VI (3rd Year)">Sem VI</option>
                    <option value="Semester VII (4th Year)">Sem VII</option>
                    <option value="Semester VIII (4th Year)">Sem VIII</option>
                    <option value="All Semesters">All Sem</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#131b2e] mb-1">Year</label>
                  <input
                    type="text"
                    value={pyqYear}
                    onChange={(e) => setPyqYear(e.target.value)}
                    placeholder="2023–24"
                    required
                    className="w-full p-2 rounded-lg border border-[#c4c5d5] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#131b2e] mb-1">Total Marks</label>
                  <input
                    type="number"
                    value={pyqMarks}
                    onChange={(e) => setPyqMarks(Number(e.target.value))}
                    min={20}
                    max={100}
                    className="w-full p-2 rounded-lg border border-[#c4c5d5] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#131b2e] mb-1">Exam Type</label>
                <select
                  value={pyqExamType}
                  onChange={(e) => setPyqExamType(e.target.value as any)}
                  className="w-full p-2 rounded-lg border border-[#c4c5d5] outline-none bg-[#faf8ff]"
                >
                  <option value="Mid-Term I">Mid-Term I</option>
                  <option value="Mid-Term II">Mid-Term II</option>
                  <option value="End-Semester">End-Semester Comprehensive</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#131b2e] mb-1">Question Paper Title</label>
                <input
                  type="text"
                  value={pyqTitle}
                  onChange={(e) => setPyqTitle(e.target.value)}
                  placeholder={`e.g. ${SUBJECT_DATA[pyqSubject].code} ${pyqSubject} - Mid-Term II Examination (AY ${pyqYear})`}
                  required
                  className="w-full p-2 rounded-lg border border-[#c4c5d5] outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#131b2e] mb-1">
                  PDF Download / Drive Link (Optional)
                </label>
                <input
                  type="url"
                  value={pyqPdfUrl}
                  onChange={(e) => setPyqPdfUrl(e.target.value)}
                  placeholder="https://drive.google.com/... or https://...paper.pdf"
                  className="w-full p-2 rounded-lg border border-[#c4c5d5] outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#131b2e] mb-1">
                  Questions List (1 question per line)
                </label>
                <textarea
                  value={pyqQuestionsText}
                  onChange={(e) => setPyqQuestionsText(e.target.value)}
                  placeholder="Q1: State Bellman Ford algorithm... (10 Marks)&#10;Q2: Derive tight bounds... (15 Marks)"
                  rows={3}
                  className="w-full p-2 rounded-lg border border-[#c4c5d5] outline-none font-mono"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pyq-sol"
                  checked={pyqSolution}
                  onChange={(e) => setPyqSolution(e.target.checked)}
                  className="rounded text-[#00288e]"
                />
                <label htmlFor="pyq-sol" className="text-[#131b2e] cursor-pointer">
                  Include model solution and answer key PDF
                </label>
              </div>

              <div className="flex gap-2 pt-2 border-t border-[#c4c5d5]/40">
                <button
                  type="button"
                  onClick={() => setIsAddPYQOpen(false)}
                  className="flex-1 py-2 border border-[#c4c5d5] rounded-xl font-semibold text-[#444653]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#00288e] text-white rounded-xl font-bold hover:bg-[#1e40af]"
                >
                  Save Question Paper
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
