import React, { useState } from 'react';
import {
  UserProfile,
  TimetableSlot,
  CollegeBranch,
  TimetableDay,
  SlotType,
  ScheduledExam,
  AnnouncementItem,
  UserRole,
  LeaveApplication,
  LeaveStatus,
} from '../types';
import {
  COLLEGE_INFO,
  BRANCH_CONFIG,
  PERIODS,
  FACULTY_MAPPING,
  detectTimetableCollisions,
  generateSimulatedClash,
  OFFICIAL_SRMS_TIMETABLE,
  DEFAULT_ANNOUNCEMENTS,
} from '../data/srmsTimetable';
import { SCHEDULED_EXAMS } from '../data/subjects';

interface AdminDashboardProps {
  currentUser: UserProfile | null;
  slots: TimetableSlot[];
  onUpdateSlots: (updated: TimetableSlot[]) => void;
  onSwitchRole: (newRole: UserRole) => void;
  onNavigateToTab: (tab: any) => void;
  announcements: AnnouncementItem[];
  onUpdateAnnouncements: (updated: AnnouncementItem[]) => void;
  onSignOut: () => void;
  onOpenAvatarPicker?: () => void;
  onOpenAdmissionModal?: () => void;
  leaveApplications?: LeaveApplication[];
  onUpdateLeaveStatus?: (id: string, status: LeaveStatus, remarks: string, reviewerName: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  slots,
  onUpdateSlots,
  onSwitchRole,
  onNavigateToTab,
  announcements,
  onUpdateAnnouncements,
  onSignOut,
  onOpenAvatarPicker,
  onOpenAdmissionModal,
  leaveApplications = [],
  onUpdateLeaveStatus,
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<
    'timetable_mgr' | 'exams_mgr' | 'roster_mgr' | 'proctor_audit' | 'announcements_mgr' | 'leaves_mgr'
  >('timetable_mgr');

  // Timetable Filters & State
  const [filterBranch, setFilterBranch] = useState<string>('ALL');
  const [filterDay, setFilterDay] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Interactive Timetable Matrix View vs List View
  const [slotViewMode, setSlotViewMode] = useState<'matrix' | 'list'>('matrix');
  const [matrixBranch, setMatrixBranch] = useState<CollegeBranch>('CS1');

  // Add / Edit Slot Modal State
  const [isAddSlotOpen, setIsAddSlotOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
  const [newDay, setNewDay] = useState<TimetableDay>('MON');
  const [newPeriod, setNewPeriod] = useState<number>(1);
  const [newBranch, setNewBranch] = useState<CollegeBranch>('CS1');
  const [newSubjectCode, setNewSubjectCode] = useState('DAA');
  const [newSubjectName, setNewSubjectName] = useState('Design & Analysis of Algorithms');
  const [newFacultyCode, setNewFacultyCode] = useState('SJA');
  const [newRoom, setNewRoom] = useState('303');
  const [newType, setNewType] = useState<SlotType>('lecture');
  const [isCustomFaculty, setIsCustomFaculty] = useState(false);
  const [customFacultyName, setCustomFacultyName] = useState('');

  // Copy Day State
  const [isCopyDayOpen, setIsCopyDayOpen] = useState(false);
  const [copyFromDay, setCopyFromDay] = useState<TimetableDay>('MON');
  const [copyToDay, setCopyToDay] = useState<TimetableDay>('TUE');

  // Announcement Form State
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnContent, setNewAnnContent] = useState('');
  const [newAnnPriority, setNewAnnPriority] = useState<'urgent' | 'normal'>('normal');
  const [newAnnCategory, setNewAnnCategory] = useState<'timetable' | 'examination' | 'academic' | 'urgent'>('timetable');

  // Scheduled exams state (local copy for editing)
  const [examsList, setExamsList] = useState<ScheduledExam[]>(SCHEDULED_EXAMS);

  // Compute collisions
  const collisions = detectTimetableCollisions(slots);
  const collidingSlotIds = new Set<string>();
  collisions.forEach((c) => {
    collidingSlotIds.add(c.slotAId);
    collidingSlotIds.add(c.slotBId);
  });

  // Calculate clash preview for the slot currently being created in modal
  const periodObj = PERIODS.find((p) => p.period === newPeriod) || PERIODS[0];
  const facultyDisplayName = isCustomFaculty && customFacultyName
    ? customFacultyName
    : FACULTY_MAPPING[newFacultyCode] || newFacultyCode;

  const potentialNewSlot: TimetableSlot = {
    id: editingSlot ? editingSlot.id : 'preview-slot',
    day: newDay,
    periodNumber: newPeriod,
    timeSlot: periodObj.label,
    startMinutes: periodObj.startMinutes,
    endMinutes: periodObj.endMinutes,
    branch: newBranch,
    subjectCode: newSubjectCode,
    subjectName: newSubjectName,
    facultyCode: isCustomFaculty ? (newFacultyCode || 'CUSTOM') : newFacultyCode,
    facultyName: facultyDisplayName,
    room: newRoom,
    type: newType,
  };

  const previewClashes = detectTimetableCollisions(
    editingSlot
      ? slots.map((s) => (s.id === editingSlot.id ? potentialNewSlot : s))
      : [...slots, potentialNewSlot]
  ).filter(
    (c) =>
      c.slotAId === (editingSlot ? editingSlot.id : 'preview-slot') ||
      c.slotBId === (editingSlot ? editingSlot.id : 'preview-slot')
  );

  // Open modal for a specific grid cell
  const handleOpenAddForCell = (day: TimetableDay, period: number, branch: CollegeBranch) => {
    setEditingSlot(null);
    setNewDay(day);
    setNewPeriod(period);
    setNewBranch(branch);
    setNewRoom(BRANCH_CONFIG[branch]?.defaultRoom || '303');
    setNewSubjectCode('DAA');
    setNewSubjectName('Design & Analysis of Algorithms');
    setNewFacultyCode('SJA');
    setIsCustomFaculty(false);
    setCustomFacultyName('');
    setNewType('lecture');
    setIsAddSlotOpen(true);
  };

  // Open modal to edit existing slot
  const handleOpenEditSlot = (slot: TimetableSlot) => {
    setEditingSlot(slot);
    setNewDay(slot.day);
    setNewPeriod(slot.periodNumber);
    setNewBranch(slot.branch);
    setNewSubjectCode(slot.subjectCode);
    setNewSubjectName(slot.subjectName);
    setNewFacultyCode(slot.facultyCode);
    setNewRoom(slot.room);
    setNewType(slot.type);
    if (!FACULTY_MAPPING[slot.facultyCode]) {
      setIsCustomFaculty(true);
      setCustomFacultyName(slot.facultyName);
    } else {
      setIsCustomFaculty(false);
      setCustomFacultyName('');
    }
    setIsAddSlotOpen(true);
  };

  // Save new or edited slot
  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    const finalFacultyCode = isCustomFaculty
      ? (newFacultyCode.trim().toUpperCase() || 'CUSTOM')
      : newFacultyCode.trim().toUpperCase();
    const finalFacultyName = isCustomFaculty && customFacultyName.trim()
      ? customFacultyName.trim()
      : (FACULTY_MAPPING[finalFacultyCode] || finalFacultyCode);

    const slotPayload: TimetableSlot = {
      id: editingSlot ? editingSlot.id : `slot-${Date.now()}`,
      day: newDay,
      periodNumber: newPeriod,
      timeSlot: periodObj.label,
      startMinutes: periodObj.startMinutes,
      endMinutes: periodObj.endMinutes,
      branch: newBranch,
      subjectCode: newSubjectCode.trim().toUpperCase(),
      subjectName: newSubjectName.trim(),
      facultyCode: finalFacultyCode,
      facultyName: finalFacultyName,
      room: newRoom.trim().toUpperCase(),
      type: newType,
    };

    if (editingSlot) {
      onUpdateSlots(slots.map((s) => (s.id === editingSlot.id ? slotPayload : s)));
    } else {
      onUpdateSlots([slotPayload, ...slots]);
    }
    setIsAddSlotOpen(false);
    setEditingSlot(null);
  };

  // Clear all slots for selected branch
  const handleClearBranchTimetable = (branchToClear: CollegeBranch) => {
    if (window.confirm(`Are you sure you want to clear all slots for branch ${branchToClear}? You can rebuild it fresh or click 'Restore Official' anytime.`)) {
      onUpdateSlots(slots.filter((s) => s.branch !== branchToClear));
    }
  };

  // Copy schedule from one day to another for the matrix branch
  const handleCopyDaySchedule = () => {
    if (copyFromDay === copyToDay) {
      alert('Source and target day cannot be identical.');
      return;
    }

    const sourceSlots = slots.filter((s) => s.branch === matrixBranch && s.day === copyFromDay);
    if (sourceSlots.length === 0) {
      alert(`No slots found on ${copyFromDay} for ${matrixBranch} to copy.`);
      return;
    }

    // Remove existing target day slots for this branch
    const filtered = slots.filter((s) => !(s.branch === matrixBranch && s.day === copyToDay));

    // Clone source slots to target day
    const duplicatedSlots: TimetableSlot[] = sourceSlots.map((s, idx) => ({
      ...s,
      id: `slot-copy-${Date.now()}-${idx}`,
      day: copyToDay,
    }));

    onUpdateSlots([...duplicatedSlots, ...filtered]);
    setIsCopyDayOpen(false);
  };

  // Filter slots for list
  const filteredSlots = slots.filter((slot) => {
    if (filterBranch !== 'ALL' && slot.branch !== filterBranch) return false;
    if (filterDay !== 'ALL' && slot.day !== filterDay) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        slot.subjectCode.toLowerCase().includes(q) ||
        slot.subjectName.toLowerCase().includes(q) ||
        slot.facultyName.toLowerCase().includes(q) ||
        slot.room.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Delete slot
  const handleDeleteSlot = (id: string) => {
    onUpdateSlots(slots.filter((s) => s.id !== id));
  };

  // Handle Add Announcement
  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle || !newAnnContent) return;

    const ann: AnnouncementItem = {
      id: `ann-${Date.now()}`,
      title: newAnnTitle,
      content: newAnnContent,
      category: newAnnCategory,
      priority: newAnnPriority,
      postedBy: `${currentUser?.name || 'Administrator'} (${currentUser?.designation || 'Principal Office'})`,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      targetRole: 'all',
      reactions: {
        thumbsUp: 0,
        heart: 0,
        question: 0,
        userReactions: {},
      },
    };

    onUpdateAnnouncements([ann, ...announcements]);
    setNewAnnTitle('');
    setNewAnnContent('');
  };

  const handleDeleteAnnouncement = (id: string) => {
    onUpdateAnnouncements(announcements.filter((a) => a.id !== id));
  };

  // Toggle Exam Status
  const handleToggleExamStatus = (examId: string) => {
    setExamsList((prev) =>
      prev.map((ex) => {
        if (ex.id === examId) {
          const nextStatus =
            ex.status === 'Upcoming'
              ? 'Pre-check Ready'
              : ex.status === 'Pre-check Ready'
              ? 'Scheduled'
              : ex.status === 'Scheduled'
              ? 'Completed'
              : 'Upcoming';
          return { ...ex, status: nextStatus };
        }
        return ex;
      })
    );
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#131b2e] pb-24">
      {/* Top Admin Navigation Header */}
      <header className="bg-white border-b border-[#c4c5d5]/40 px-4 py-3 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenAvatarPicker}
              className="relative group cursor-pointer focus:outline-none shrink-0"
              title="Click to customize Admin avatar"
            >
              <img
                src={
                  currentUser?.avatarUrl ||
                  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80'
                }
                alt={currentUser?.name || 'Admin'}
                className="w-10 h-10 rounded-xl object-cover border-2 border-purple-800 shadow-xs group-hover:scale-105 transition-transform bg-white"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-purple-800 text-white flex items-center justify-center text-[8px] shadow">
                <i className="fas fa-camera"></i>
              </span>
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-bold text-purple-950 tracking-tight leading-tight">
                  SRMS Pariksha Admin Portal
                </h1>
                <span className="text-[10px] bg-purple-100 text-purple-900 border border-purple-300 px-2 py-0.5 rounded-full font-bold">
                  Chief Academic Controller
                </span>
              </div>
              <p className="text-[11px] text-[#444653]">
                Logged in as <strong>{currentUser?.name || 'Dr. Prabhakar Gupta'}</strong> •{' '}
                {currentUser?.designation || 'Principal & Academic Head'}
              </p>
            </div>
          </div>

          {/* Quick Impersonation & Role Switchers */}
          <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
            <div className="flex items-center gap-1 bg-purple-50 p-1 rounded-xl border border-purple-200 text-xs">
              <span className="text-[11px] font-semibold text-purple-900 px-1.5 hidden sm:inline">Role View:</span>
              <button
                type="button"
                onClick={() => onSwitchRole('student')}
                className="px-2 py-1 bg-white hover:bg-emerald-50 text-[#00288e] rounded-lg border border-[#c4c5d5] font-semibold flex items-center gap-1 shadow-2xs cursor-pointer text-[11px]"
                title="View app as student Rahul Sen"
              >
                <span className="material-symbols-outlined text-[13px]">school</span>
                <span>Student</span>
              </button>
              <button
                type="button"
                onClick={() => onSwitchRole('faculty')}
                className="px-2 py-1 bg-white hover:bg-blue-50 text-[#00288e] rounded-lg border border-[#c4c5d5] font-semibold flex items-center gap-1 shadow-2xs cursor-pointer text-[11px]"
                title="View app as faculty Dr. Ashutosh Pandey"
              >
                <span className="material-symbols-outlined text-[13px]">co_present</span>
                <span>Faculty</span>
              </button>
              <span className="px-2 py-1 bg-purple-700 text-white rounded-lg font-bold text-[11px]">Admin</span>
            </div>

            {onOpenAdmissionModal && (
              <button
                type="button"
                onClick={onOpenAdmissionModal}
                className="px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100 text-xs font-semibold flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                title="Open College Admissions, Documents, Fees & Helplines"
              >
                <span className="material-symbols-outlined text-[15px] text-amber-700">account_balance</span>
                <span className="hidden sm:inline">Admissions Desk</span>
              </button>
            )}

            <button
              type="button"
              onClick={onSignOut}
              className="px-2.5 py-1.5 rounded-xl border border-[#c4c5d5] hover:bg-red-50 hover:text-red-700 text-xs font-semibold flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">logout</span>
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 pt-4 space-y-4">
        {/* ===================================================================== */}
        {/* TOP KPI OVERVIEW STATS CARDS                                          */}
        {/* ===================================================================== */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* KPI 1: Collision Health */}
          <div
            onClick={() => setActiveAdminTab('timetable_mgr')}
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
              collisions.length > 0
                ? 'bg-red-600 text-white border-red-700 shadow-md animate-pulse'
                : 'bg-white border-[#c4c5d5]/60 hover:border-[#00288e] shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-[11px] font-bold uppercase tracking-wider ${
                  collisions.length > 0 ? 'text-yellow-200' : 'text-[#757684]'
                }`}
              >
                Collision Status
              </span>
              <span
                className={`material-symbols-outlined text-[20px] ${
                  collisions.length > 0 ? 'text-yellow-300' : 'text-emerald-600'
                }`}
              >
                {collisions.length > 0 ? 'warning' : 'check_circle'}
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black mt-1">
              {collisions.length > 0 ? `${collisions.length} Clashes!` : '0 (Clear)'}
            </div>
            <div className={`text-[10px] mt-0.5 ${collisions.length > 0 ? 'text-red-100' : 'text-[#444653]'}`}>
              {collisions.length > 0 ? 'Action required immediately' : 'Official schedule verified'}
            </div>
          </div>

          {/* KPI 2: Total Lecture & Lab Slots */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#c4c5d5]/60 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#757684]">Weekly Slots</span>
              <span className="material-symbols-outlined text-[20px] text-[#00288e]">calendar_view_week</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#00288e] mt-1">{slots.length}</div>
            <div className="text-[10px] text-[#444653] mt-0.5">Across 7 B.Tech Branches</div>
          </div>

          {/* KPI 3: Total Enrolled Students */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#c4c5d5]/60 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#757684]">Students</span>
              <span className="material-symbols-outlined text-[20px] text-emerald-600">groups</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">420</div>
            <div className="text-[10px] text-[#444653] mt-0.5">Odd Semester V Cohort</div>
          </div>

          {/* KPI 4: Faculty Strength */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#c4c5d5]/60 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#757684]">Active Faculty</span>
              <span className="material-symbols-outlined text-[20px] text-purple-700">co_present</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-purple-800 mt-1">
              {Object.keys(FACULTY_MAPPING).length}
            </div>
            <div className="text-[10px] text-[#444653] mt-0.5">Coordinators & Evaluators</div>
          </div>
        </div>

        {/* Global Collision Red Alert Notice in Admin if clashes exist */}
        {collisions.length > 0 && (
          <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-500 text-red-950 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-red-600 text-[26px] flex-shrink-0 animate-bounce">
                error
              </span>
              <div>
                <div className="font-extrabold text-sm text-red-900">
                  ⚠️ {collisions.length} Timetable Clash{collisions.length === 1 ? '' : 'es'} Require Administrator
                  Resolution
                </div>
                <div className="text-xs text-red-800 mt-0.5">
                  Rooms or faculties have conflicting bookings. Students will see red alerts until resolved.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onUpdateSlots(OFFICIAL_SRMS_TIMETABLE)}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Auto-Resolve & Restore Official
              </button>
            </div>
          </div>
        )}

        {/* Admin Navigation Tabs */}
        <div className="flex bg-[#eaedff]/70 p-1 rounded-2xl border border-[#c4c5d5]/50 gap-1 overflow-x-auto">
          {[
            { id: 'timetable_mgr', label: 'Timetable Manager', icon: 'calendar_month' },
            { id: 'exams_mgr', label: 'Examinations Control', icon: 'quiz' },
            { id: 'roster_mgr', label: 'Student & Faculty Roster', icon: 'badge' },
            { id: 'proctor_audit', label: 'Proctoring Security', icon: 'verified_user' },
            { id: 'announcements_mgr', label: 'Notices & Bulletins', icon: 'campaign' },
            {
              id: 'leaves_mgr',
              label: `Student Leaves (${leaveApplications.filter((a) => a.status === 'pending').length})`,
              icon: 'assignment_turned_in',
            },
          ].map((tab) => {
            const isActive = activeAdminTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveAdminTab(tab.id as any)}
                className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-purple-800 text-white shadow-xs'
                    : 'text-[#444653] hover:text-[#131b2e] hover:bg-white/60'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ===================================================================== */}
        {/* TAB 1: TIMETABLE MANAGEMENT HUB (INTERACTIVE BUILDER & COLLISION CONTROLLER) */}
        {/* ===================================================================== */}
        {activeAdminTab === 'timetable_mgr' && (
          <div className="space-y-4">
            {/* Master Action Bar & Mode Switcher */}
            <div className="bg-white p-4 rounded-2xl border border-[#c4c5d5]/60 shadow-xs space-y-3">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-[#131b2e] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#00288e] text-[20px]">table_chart</span>
                    <span>Admin College Timetable Builder & Collision Dashboard</span>
                    <span className="text-[11px] bg-purple-100 text-purple-900 px-2 py-0.5 rounded-full font-bold">
                      {slots.length} Total Slots
                    </span>
                  </h2>
                  <p className="text-xs text-[#757684] mt-0.5">
                    Build, customize, and edit class/lab schedules across all branches. Click any grid cell to add or edit slots.
                  </p>
                </div>

                {/* Master Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSlot(null);
                      setNewDay('MON');
                      setNewPeriod(1);
                      setNewBranch(matrixBranch);
                      setIsAddSlotOpen(true);
                    }}
                    className="px-3 py-2 rounded-xl bg-[#00288e] hover:bg-[#1e40af] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                    <span>+ Add New Slot</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsCopyDayOpen(true)}
                    className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-semibold flex items-center gap-1 shadow-2xs cursor-pointer"
                    title="Duplicate a day's schedule to another day"
                  >
                    <span className="material-symbols-outlined text-[16px]">content_copy</span>
                    <span>Copy Day</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleClearBranchTimetable(matrixBranch)}
                    className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold flex items-center gap-1 shadow-2xs cursor-pointer"
                    title={`Clear all slots for branch ${matrixBranch} to build fresh`}
                  >
                    <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                    <span>Clear {matrixBranch}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateSlots(OFFICIAL_SRMS_TIMETABLE)}
                    className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold flex items-center gap-1 shadow-2xs cursor-pointer"
                    title="Restore verified official SRMS schedule"
                  >
                    <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                    <span>Restore Standard</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateSlots(generateSimulatedClash(slots))}
                    className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-semibold flex items-center gap-1 shadow-2xs cursor-pointer"
                    title="Inject a test collision to see red error alerts"
                  >
                    <span className="material-symbols-outlined text-[16px]">warning</span>
                    <span>Test Clash</span>
                  </button>
                </div>
              </div>

              {/* Branch Selector Pills & View Toggle */}
              <div className="pt-2 border-t border-[#c4c5d5]/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Branch Switcher Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
                  <span className="text-[11px] font-bold text-[#757684] mr-1 uppercase">Active Branch:</span>
                  {(Object.keys(BRANCH_CONFIG) as CollegeBranch[]).map((b) => {
                    const isSelected = matrixBranch === b;
                    const branchSlotsCount = slots.filter((s) => s.branch === b).length;
                    return (
                      <button
                        key={b}
                        type="button"
                        onClick={() => {
                          setMatrixBranch(b);
                          setFilterBranch(b);
                        }}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                          isSelected
                            ? 'bg-[#00288e] text-white shadow-xs'
                            : 'bg-[#faf8ff] text-[#444653] hover:bg-[#eaedff] border border-[#c4c5d5]/50'
                        }`}
                      >
                        <span>{b}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-[#c4c5d5]/40 text-[#444653]'
                          }`}
                        >
                          {branchSlotsCount}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* View Switcher: Weekly Grid vs Table List */}
                <div className="flex bg-[#f2f3ff] p-0.5 rounded-xl border border-[#c4c5d5]/50 text-xs shrink-0 self-start md:self-auto">
                  <button
                    type="button"
                    onClick={() => setSlotViewMode('matrix')}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1 font-semibold transition-all cursor-pointer ${
                      slotViewMode === 'matrix'
                        ? 'bg-white text-[#00288e] font-bold shadow-xs'
                        : 'text-[#757684] hover:text-[#131b2e]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">grid_on</span>
                    <span>Weekly Grid Matrix</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSlotViewMode('list')}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1 font-semibold transition-all cursor-pointer ${
                      slotViewMode === 'list'
                        ? 'bg-white text-[#00288e] font-bold shadow-xs'
                        : 'text-[#757684] hover:text-[#131b2e]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">format_list_bulleted</span>
                    <span>Searchable List</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ============================================================== */}
            {/* VIEW 1: INTERACTIVE WEEKLY GRID MATRIX BUILDER                */}
            {/* ============================================================== */}
            {slotViewMode === 'matrix' && (
              <div className="bg-white rounded-2xl border border-[#c4c5d5]/60 shadow-xs p-4 space-y-3 overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#131b2e]">
                      Weekly Matrix Schedule: {BRANCH_CONFIG[matrixBranch]?.name}
                    </span>
                    <span className="text-[11px] text-[#757684]">
                      • Room {BRANCH_CONFIG[matrixBranch]?.defaultRoom}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#757684]">
                    Tip: Click any slot to edit, or click <strong>+ Add</strong> on an empty cell
                  </span>
                </div>

                {/* The Interactive Schedule Matrix */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse min-w-[900px]">
                    <thead>
                      <tr className="bg-[#f2f3ff] text-[#444653] border-b border-[#c4c5d5]/50">
                        <th className="py-2.5 px-3 font-bold text-left w-20">Day</th>
                        {PERIODS.slice(0, 4).map((p) => (
                          <th key={p.period} className="py-2 px-2 font-bold text-center border-l border-[#c4c5d5]/30">
                            <div>P{p.period}</div>
                            <div className="font-mono text-[9px] text-[#757684] font-normal">{p.label}</div>
                          </th>
                        ))}
                        {/* Lunch Break Column */}
                        <th className="py-2 px-1 font-bold text-center bg-amber-50/70 text-amber-900 border-l border-[#c4c5d5]/30 w-16">
                          <div className="text-[10px]">LUNCH</div>
                          <div className="font-mono text-[8px] text-amber-700">1:00-2:00</div>
                        </th>
                        {PERIODS.slice(4).map((p) => (
                          <th key={p.period} className="py-2 px-2 font-bold text-center border-l border-[#c4c5d5]/30">
                            <div>P{p.period}</div>
                            <div className="font-mono text-[9px] text-[#757684] font-normal">{p.label}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as TimetableDay[]).map((day) => {
                        const dayFullNames: Record<TimetableDay, string> = {
                          MON: 'Monday',
                          TUE: 'Tuesday',
                          WED: 'Wednesday',
                          THU: 'Thursday',
                          FRI: 'Friday',
                          SAT: 'Saturday',
                        };

                        return (
                          <tr key={day} className="border-b border-[#c4c5d5]/30 hover:bg-[#faf8ff]/50">
                            {/* Day Header Cell */}
                            <td className="py-2.5 px-3 font-bold bg-[#faf8ff] text-[#00288e]">
                              <div>{day}</div>
                              <div className="text-[9px] text-[#757684] font-normal">{dayFullNames[day]}</div>
                            </td>

                            {/* Periods 1 to 4 */}
                            {PERIODS.slice(0, 4).map((period) => {
                              const cellSlot = slots.find(
                                (s) => s.branch === matrixBranch && s.day === day && s.periodNumber === period.period
                              );
                              const isClashing = cellSlot && collidingSlotIds.has(cellSlot.id);

                              return (
                                <td
                                  key={period.period}
                                  className="p-1.5 border-l border-[#c4c5d5]/30 align-top h-24 w-32 max-w-[140px]"
                                >
                                  {cellSlot ? (
                                    <div
                                      className={`h-full p-2 rounded-xl border flex flex-col justify-between transition-all group relative ${
                                        isClashing
                                          ? 'bg-red-50 border-red-500 shadow-sm'
                                          : 'bg-white hover:bg-[#faf8ff] border-[#c4c5d5]/60 hover:border-[#00288e] shadow-2xs'
                                      }`}
                                    >
                                      {/* Top Row: Subject Code & Action Buttons */}
                                      <div className="flex items-start justify-between gap-1">
                                        <div className="flex items-center gap-1 flex-wrap">
                                          <span className="font-bold text-[#00288e] text-xs">
                                            {cellSlot.subjectCode}
                                          </span>
                                          <span
                                            className={`text-[8px] uppercase font-bold px-1 py-0.2 rounded ${
                                              cellSlot.type === 'lab'
                                                ? 'bg-purple-100 text-purple-900'
                                                : cellSlot.type === 'tutorial'
                                                ? 'bg-amber-100 text-amber-900'
                                                : 'bg-blue-50 text-blue-800'
                                            }`}
                                          >
                                            {cellSlot.type}
                                          </span>
                                        </div>

                                        {/* Hover Quick Edit / Delete Buttons */}
                                        <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100">
                                          <button
                                            type="button"
                                            onClick={() => handleOpenEditSlot(cellSlot)}
                                            className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#eaedff] text-[#00288e] cursor-pointer"
                                            title="Edit Slot"
                                          >
                                            <span className="material-symbols-outlined text-[13px]">edit</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteSlot(cellSlot.id)}
                                            className="w-5 h-5 flex items-center justify-center rounded hover:bg-red-100 text-red-600 cursor-pointer"
                                            title="Delete Slot"
                                          >
                                            <span className="material-symbols-outlined text-[13px]">delete</span>
                                          </button>
                                        </div>
                                      </div>

                                      {/* Title */}
                                      <p className="text-[10px] text-[#444653] line-clamp-1 font-medium mt-0.5">
                                        {cellSlot.subjectName}
                                      </p>

                                      {/* Bottom Details: Faculty & Room */}
                                      <div className="pt-1 border-t border-[#c4c5d5]/30 flex items-center justify-between text-[9px] text-[#757684]">
                                        <span className="truncate max-w-[65px]" title={cellSlot.facultyName}>
                                          {cellSlot.facultyCode}
                                        </span>
                                        <span className="font-mono font-semibold text-[#131b2e] bg-[#f2f3ff] px-1 rounded">
                                          R{cellSlot.room}
                                        </span>
                                      </div>

                                      {/* Clash Alert Badge */}
                                      {isClashing && (
                                        <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] font-black px-1 rounded-full animate-bounce shadow">
                                          CLASH
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    /* Empty Cell: Click to Add */
                                    <button
                                      type="button"
                                      onClick={() => handleOpenAddForCell(day, period.period, matrixBranch)}
                                      className="w-full h-full min-h-[78px] rounded-xl border border-dashed border-[#c4c5d5]/60 hover:border-[#00288e] hover:bg-[#eaedff]/30 text-[#757684] hover:text-[#00288e] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer group"
                                      title={`Schedule class on ${day} Period ${period.period}`}
                                    >
                                      <span className="material-symbols-outlined text-[16px] group-hover:scale-110 transition-transform">
                                        add
                                      </span>
                                      <span className="text-[9px] font-semibold">+ Add</span>
                                    </button>
                                  )}
                                </td>
                              );
                            })}

                            {/* Lunch Break Spacer Cell */}
                            <td className="p-1 border-l border-[#c4c5d5]/30 bg-amber-50/40 text-center align-middle">
                              <span className="text-[9px] font-bold text-amber-800 [writing-mode:vertical-lr] tracking-widest opacity-60">
                                BREAK
                              </span>
                            </td>

                            {/* Periods 5 to 7 */}
                            {PERIODS.slice(4).map((period) => {
                              const cellSlot = slots.find(
                                (s) => s.branch === matrixBranch && s.day === day && s.periodNumber === period.period
                              );
                              const isClashing = cellSlot && collidingSlotIds.has(cellSlot.id);

                              return (
                                <td
                                  key={period.period}
                                  className="p-1.5 border-l border-[#c4c5d5]/30 align-top h-24 w-32 max-w-[140px]"
                                >
                                  {cellSlot ? (
                                    <div
                                      className={`h-full p-2 rounded-xl border flex flex-col justify-between transition-all group relative ${
                                        isClashing
                                          ? 'bg-red-50 border-red-500 shadow-sm'
                                          : 'bg-white hover:bg-[#faf8ff] border-[#c4c5d5]/60 hover:border-[#00288e] shadow-2xs'
                                      }`}
                                    >
                                      {/* Top Row: Subject Code & Action Buttons */}
                                      <div className="flex items-start justify-between gap-1">
                                        <div className="flex items-center gap-1 flex-wrap">
                                          <span className="font-bold text-[#00288e] text-xs">
                                            {cellSlot.subjectCode}
                                          </span>
                                          <span
                                            className={`text-[8px] uppercase font-bold px-1 py-0.2 rounded ${
                                              cellSlot.type === 'lab'
                                                ? 'bg-purple-100 text-purple-900'
                                                : cellSlot.type === 'tutorial'
                                                ? 'bg-amber-100 text-amber-900'
                                                : 'bg-blue-50 text-blue-800'
                                            }`}
                                          >
                                            {cellSlot.type}
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100">
                                          <button
                                            type="button"
                                            onClick={() => handleOpenEditSlot(cellSlot)}
                                            className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#eaedff] text-[#00288e] cursor-pointer"
                                            title="Edit Slot"
                                          >
                                            <span className="material-symbols-outlined text-[13px]">edit</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteSlot(cellSlot.id)}
                                            className="w-5 h-5 flex items-center justify-center rounded hover:bg-red-100 text-red-600 cursor-pointer"
                                            title="Delete Slot"
                                          >
                                            <span className="material-symbols-outlined text-[13px]">delete</span>
                                          </button>
                                        </div>
                                      </div>

                                      <p className="text-[10px] text-[#444653] line-clamp-1 font-medium mt-0.5">
                                        {cellSlot.subjectName}
                                      </p>

                                      <div className="pt-1 border-t border-[#c4c5d5]/30 flex items-center justify-between text-[9px] text-[#757684]">
                                        <span className="truncate max-w-[65px]" title={cellSlot.facultyName}>
                                          {cellSlot.facultyCode}
                                        </span>
                                        <span className="font-mono font-semibold text-[#131b2e] bg-[#f2f3ff] px-1 rounded">
                                          R{cellSlot.room}
                                        </span>
                                      </div>

                                      {isClashing && (
                                        <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] font-black px-1 rounded-full animate-bounce shadow">
                                          CLASH
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenAddForCell(day, period.period, matrixBranch)}
                                      className="w-full h-full min-h-[78px] rounded-xl border border-dashed border-[#c4c5d5]/60 hover:border-[#00288e] hover:bg-[#eaedff]/30 text-[#757684] hover:text-[#00288e] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer group"
                                      title={`Schedule class on ${day} Period ${period.period}`}
                                    >
                                      <span className="material-symbols-outlined text-[16px] group-hover:scale-110 transition-transform">
                                        add
                                      </span>
                                      <span className="text-[9px] font-semibold">+ Add</span>
                                    </button>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* VIEW 2: SEARCHABLE SLOTS LIST TABLE                           */}
            {/* ============================================================== */}
            {slotViewMode === 'list' && (
              <div className="space-y-3">
                {/* Filters */}
                <div className="bg-white p-3 rounded-2xl border border-[#c4c5d5]/60 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-[#444653] block mb-1">Filter by Branch:</label>
                    <select
                      value={filterBranch}
                      onChange={(e) => setFilterBranch(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-[#c4c5d5] bg-[#faf8ff] outline-none"
                    >
                      <option value="ALL">All Branches (7 Disciplines)</option>
                      {Object.keys(BRANCH_CONFIG).map((b) => (
                        <option key={b} value={b}>
                          {b} - Room {BRANCH_CONFIG[b as CollegeBranch].defaultRoom}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#444653] block mb-1">Filter by Day:</label>
                    <select
                      value={filterDay}
                      onChange={(e) => setFilterDay(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-[#c4c5d5] bg-[#faf8ff] outline-none"
                    >
                      <option value="ALL">All Days (MON - SAT)</option>
                      <option value="MON">Monday</option>
                      <option value="TUE">Tuesday</option>
                      <option value="WED">Wednesday</option>
                      <option value="THU">Thursday</option>
                      <option value="FRI">Friday</option>
                      <option value="SAT">Saturday</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#444653] block mb-1">Search Subject/Faculty:</label>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search DAA, ANU, 303..."
                      className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-[#c4c5d5] bg-[#faf8ff] outline-none"
                    />
                  </div>
                </div>

                {/* Slots List Table */}
                <div className="bg-white rounded-2xl border border-[#c4c5d5]/60 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse min-w-[700px]">
                      <thead>
                        <tr className="bg-[#f2f3ff] text-[#444653] border-b border-[#c4c5d5]/50">
                          <th className="py-2.5 px-3 font-bold">Branch & Day</th>
                          <th className="py-2.5 px-3 font-bold">Period & Time</th>
                          <th className="py-2.5 px-3 font-bold">Subject Code</th>
                          <th className="py-2.5 px-3 font-bold">Faculty Name</th>
                          <th className="py-2.5 px-3 font-bold">Room</th>
                          <th className="py-2.5 px-3 font-bold">Status</th>
                          <th className="py-2.5 px-3 font-bold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSlots.map((slot) => {
                          const isClashing = collidingSlotIds.has(slot.id);
                          return (
                            <tr
                              key={slot.id}
                              className={`border-b border-[#c4c5d5]/30 hover:bg-[#faf8ff] transition-colors ${
                                isClashing ? 'bg-red-50/90 font-medium' : ''
                              }`}
                            >
                              <td className="py-2.5 px-3">
                                <span className="font-bold text-[#00288e]">{slot.branch}</span>
                                <span className="text-[10px] text-[#757684] ml-1.5 bg-[#f2f3ff] px-1.5 py-0.5 rounded">
                                  {slot.day}
                                </span>
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="font-mono text-[11px] font-semibold">{slot.timeSlot}</div>
                                <div className="text-[10px] text-[#757684]">Period {slot.periodNumber}</div>
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-[#131b2e]">{slot.subjectCode}</div>
                                <div className="text-[10px] text-[#444653] truncate max-w-[160px]">{slot.subjectName}</div>
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="font-medium text-[#131b2e]">{slot.facultyName}</div>
                                <div className="text-[10px] text-[#757684]">Code: {slot.facultyCode}</div>
                              </td>
                              <td className="py-2.5 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                                    isClashing ? 'bg-red-200 text-red-900' : 'bg-slate-100 text-slate-800'
                                  }`}
                                >
                                  Room {slot.room}
                                </span>
                              </td>
                              <td className="py-2.5 px-3">
                                {isClashing ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] bg-red-600 text-white font-bold px-2 py-0.5 rounded-full animate-pulse">
                                    <span className="material-symbols-outlined text-[12px]">warning</span>
                                    <span>CLASH</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                                    <span className="material-symbols-outlined text-[12px]">check</span>
                                    <span>Valid</span>
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditSlot(slot)}
                                    className="p-1 rounded-lg text-[#00288e] hover:bg-[#eaedff] cursor-pointer"
                                    title="Edit slot"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">edit</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSlot(slot.id)}
                                    className="p-1 rounded-lg text-red-600 hover:bg-red-100 cursor-pointer"
                                    title="Delete slot"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">delete</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 2: EXAMINATIONS & QUESTION BANK CONTROLLER                        */}
        {/* ===================================================================== */}
        {activeAdminTab === 'exams_mgr' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-[#c4c5d5]/60 shadow-xs flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#131b2e]">B.Tech Examination Schedule Controller</h2>
                <p className="text-xs text-[#757684]">
                  Activate live proctored testing, manage syllabus scope, and publish official test scorecards.
                </p>
              </div>
              <span className="text-xs font-mono bg-purple-50 text-purple-800 border border-purple-200 px-2.5 py-1 rounded-lg font-bold">
                AKTU / SRMS Autonomous
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {examsList.map((exam) => (
                <div
                  key={exam.id}
                  className="p-4 rounded-2xl bg-white border border-[#c4c5d5]/60 shadow-2xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-[#757684]">{exam.code}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            exam.status === 'Pre-check Ready'
                              ? 'bg-amber-100 text-amber-800'
                              : exam.status === 'Scheduled'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {exam.status}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-[#00288e] mt-0.5">{exam.title}</h3>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-[#131b2e]">{exam.timeSlot}</div>
                      <div className="text-[10px] text-[#757684]">{exam.dateLabel}</div>
                    </div>
                  </div>

                  <div className="text-xs text-[#444653] bg-[#faf8ff] p-2.5 rounded-xl border border-[#c4c5d5]/40 space-y-1">
                    <div className="flex justify-between">
                      <span>Venue:</span>
                      <strong className="text-[#131b2e]">{exam.venue}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Marks & Duration:</span>
                      <strong className="text-[#131b2e]">
                        {exam.maxMarks} Marks ({exam.durationMinutes} Mins)
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Syllabus:</span>
                      <span className="text-[#757684] truncate max-w-[200px]">{exam.syllabus}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => handleToggleExamStatus(exam.id)}
                      className="px-3 py-1.5 rounded-xl bg-[#00288e] hover:bg-[#1e40af] text-white text-xs font-semibold shadow-xs cursor-pointer"
                    >
                      Cycle Status ({exam.status})
                    </button>

                    <button
                      type="button"
                      onClick={() => onNavigateToTab('schedule')}
                      className="text-xs text-[#0051d5] hover:underline font-semibold"
                    >
                      View Student Preview →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 3: STUDENT & FACULTY ROSTER                                       */}
        {/* ===================================================================== */}
        {activeAdminTab === 'roster_mgr' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-[#c4c5d5]/60 shadow-xs flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#131b2e]">Institutional Academic Directory</h2>
                <p className="text-xs text-[#757684]">
                  Registered students, biometric attendance metrics, and faculty teaching assignments.
                </p>
              </div>
              <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg font-bold">
                AMS Integrated
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Students Table */}
              <div className="bg-white p-4 rounded-2xl border border-[#c4c5d5]/60 shadow-xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#00288e] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">school</span>
                  <span>Enrolled Student Cohort (Sample)</span>
                </h3>
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {[
                    {
                      name: 'Rahul Sen',
                      aktuRoll: '2200100100084',
                      collegeReg: 'SRMS/2022/BTECH/CSE/084',
                      branch: 'CS1',
                      cgpa: '8.84',
                      att: '94%',
                    },
                    {
                      name: 'Priya Sharma',
                      aktuRoll: '2200100100092',
                      collegeReg: 'SRMS/2022/BTECH/CSE/092',
                      branch: 'CS2',
                      cgpa: '9.12',
                      att: '95%',
                    },
                    {
                      name: 'Aman Verma',
                      aktuRoll: '2200100130031',
                      collegeReg: 'SRMS/2022/BTECH/IT/031',
                      branch: 'IT',
                      cgpa: '8.45',
                      att: '87%',
                    },
                    {
                      name: 'Neha Saxena',
                      aktuRoll: '2200101530018',
                      collegeReg: 'SRMS/2022/BTECH/AIML/018',
                      branch: 'AIML',
                      cgpa: '8.92',
                      att: '96%',
                    },
                    {
                      name: 'Vikram Rajput',
                      aktuRoll: '2200100310022',
                      collegeReg: 'SRMS/2022/BTECH/ECE/022',
                      branch: 'EC',
                      cgpa: '8.21',
                      att: '89%',
                    },
                    {
                      name: 'Shreya Mishra',
                      aktuRoll: '2200100210015',
                      collegeReg: 'SRMS/2022/BTECH/EN/015',
                      branch: 'EN',
                      cgpa: '8.65',
                      att: '92%',
                    },
                  ].map((std) => (
                    <div
                      key={std.aktuRoll}
                      className="p-3 rounded-xl border border-[#c4c5d5]/50 bg-[#faf8ff] hover:bg-white hover:border-[#00288e]/40 transition-all text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#131b2e]">{std.name}</span>
                          <span className="text-[10px] font-bold bg-[#eaedff] text-[#00288e] px-1.5 py-0.5 rounded font-mono">
                            {std.branch}
                          </span>
                        </div>
                        <span className="font-bold text-emerald-700 font-mono">CGPA: {std.cgpa}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-[#c4c5d5]/30">
                        <div>
                          <span className="text-[#757684] block text-[10px] uppercase font-medium">AKTU University Roll</span>
                          <span className="font-mono font-bold text-[#00288e]">{std.aktuRoll}</span>
                        </div>
                        <div>
                          <span className="text-[#757684] block text-[10px] uppercase font-medium">College Reg No</span>
                          <span className="font-mono text-[#444653] font-semibold">{std.collegeReg}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-[#757684] pt-0.5">
                        <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Biometric Verified (AMS)
                        </span>
                        <span>Att: <strong className="text-[#131b2e]">{std.att}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Faculty Directory */}
              <div className="bg-white p-4 rounded-2xl border border-[#c4c5d5]/60 shadow-xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">co_present</span>
                  <span>Faculty Teaching Appointments</span>
                </h3>
                <div className="space-y-2 max-h-[260px] overflow-y-auto">
                  {Object.entries(FACULTY_MAPPING).slice(0, 8).map(([code, name]) => (
                    <div
                      key={code}
                      className="p-2.5 rounded-xl border border-[#c4c5d5]/50 bg-[#faf8ff] flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-[#131b2e]">{name}</div>
                        <div className="text-[10px] text-purple-800 font-mono">Code: {code}</div>
                      </div>
                      <span className="text-[10px] bg-purple-50 text-purple-900 border border-purple-200 px-2 py-0.5 rounded font-semibold">
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 4: PROCTORING SECURITY & AUDIT                                    */}
        {/* ===================================================================== */}
        {activeAdminTab === 'proctor_audit' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-[#c4c5d5]/60 shadow-xs flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#131b2e]">Live Proctoring Security & Telemetry Feeds</h2>
                <p className="text-xs text-[#757684]">
                  Continuous tab-switch detection, face presence tracking, and acoustic violation logs.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Proctor AI Online</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-4 rounded-2xl bg-white border border-[#c4c5d5]/60 shadow-2xs space-y-1">
                <div className="text-[11px] font-bold text-[#757684]">Active Exam Sessions</div>
                <div className="text-2xl font-black text-[#00288e]">142</div>
                <div className="text-[10px] text-emerald-700">98.6% Proctor compliance</div>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-[#c4c5d5]/60 shadow-2xs space-y-1">
                <div className="text-[11px] font-bold text-[#757684]">Tab Switch Alerts</div>
                <div className="text-2xl font-black text-amber-600">3</div>
                <div className="text-[10px] text-[#757684]">Within acceptable threshold</div>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-[#c4c5d5]/60 shadow-2xs space-y-1">
                <div className="text-[11px] font-bold text-[#757684]">Flagged Disqualifications</div>
                <div className="text-2xl font-black text-emerald-600">0</div>
                <div className="text-[10px] text-[#757684]">Zero critical infractions</div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 5: ANNOUNCEMENTS & BULLETINS                                      */}
        {/* ===================================================================== */}
        {activeAdminTab === 'announcements_mgr' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-[#c4c5d5]/60 shadow-xs">
              <h2 className="text-sm font-bold text-[#131b2e]">Publish Institutional Notice</h2>
              <p className="text-xs text-[#757684] mb-3">
                Announcements appear instantly on both Student and Faculty dashboards.
              </p>

              <form onSubmit={handleCreateAnnouncement} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      value={newAnnTitle}
                      onChange={(e) => setNewAnnTitle(e.target.value)}
                      placeholder="Notice Title (e.g. Mid-Term Lab Evaluation Dates)"
                      required
                      className="w-full text-xs px-3 py-2 rounded-xl border border-[#c4c5d5] outline-none focus:border-[#00288e]"
                    />
                  </div>
                  <div>
                    <select
                      value={newAnnPriority}
                      onChange={(e) => setNewAnnPriority(e.target.value as any)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-[#c4c5d5] bg-white outline-none"
                    >
                      <option value="normal">Normal Priority</option>
                      <option value="urgent">Urgent / High Priority</option>
                    </select>
                  </div>
                </div>

                <div>
                  <textarea
                    rows={2}
                    value={newAnnContent}
                    onChange={(e) => setNewAnnContent(e.target.value)}
                    placeholder="Enter detailed announcement body text..."
                    required
                    className="w-full text-xs p-3 rounded-xl border border-[#c4c5d5] outline-none focus:border-[#00288e]"
                  />
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#00288e] hover:bg-[#1e40af] text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  <span>Publish Notice</span>
                </button>
              </form>
            </div>

            {/* List of active notices */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#444653] px-1">
                Active College Notices ({announcements.length})
              </h3>
              {announcements.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-white border border-[#c4c5d5]/60 shadow-2xs flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[#131b2e]">{item.title}</span>
                      {item.priority === 'urgent' && (
                        <span className="text-[9px] bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-bold">
                          URGENT
                        </span>
                      )}
                      <span className="text-[10px] text-[#757684]">• {item.date}</span>
                    </div>
                    <p className="text-[#444653] leading-relaxed">{item.content}</p>
                    <div className="flex items-center justify-between flex-wrap gap-2 pt-1 text-[10px] text-[#757684]">
                      <span>Issued by: {item.postedBy}</span>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 bg-blue-50 text-[#00288e] px-2 py-0.5 rounded font-semibold border border-blue-100">
                          👍 {item.reactions?.thumbsUp || 0} Acknowledged
                        </span>
                        <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-2 py-0.5 rounded font-semibold border border-rose-100">
                          ❤️ {item.reactions?.heart || 0} Helpful
                        </span>
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-semibold border border-amber-100">
                          ❓ {item.reactions?.question || 0} Questions
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteAnnouncement(item.id)}
                    className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                    title="Remove notice"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 6: STUDENT LEAVE & ABSENCE AUDIT (AMS)                            */}
        {/* ===================================================================== */}
        {activeAdminTab === 'leaves_mgr' && (
          <div className="space-y-4">
            {/* Header / Metric Summary */}
            <div className="bg-white p-4 rounded-2xl border border-[#c4c5d5]/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#00288e] text-[20px]">
                    assignment_turned_in
                  </span>
                  <span>Institution-wide Student Leave & Absence Audits</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Track and verify all medical, weather, and emergency leaves submitted across B.Tech branches.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-amber-100 border border-amber-300 text-amber-900 rounded-xl text-xs font-bold">
                  {leaveApplications.filter((a) => a.status === 'pending').length} Pending Review
                </span>
                <span className="px-3 py-1 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold">
                  {leaveApplications.filter((a) => a.status === 'approved').length} Approved
                </span>
              </div>
            </div>

            {/* List of Applications */}
            <div className="space-y-3">
              {leaveApplications.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-[#c4c5d5]/60 text-center text-xs text-slate-500">
                  No leave applications currently on record.
                </div>
              ) : (
                leaveApplications.map((app) => (
                  <div
                    key={app.id}
                    className={`bg-white rounded-2xl p-4 border shadow-xs transition-all space-y-2.5 ${
                      app.status === 'pending'
                        ? 'border-amber-300 ring-1 ring-amber-200'
                        : app.status === 'approved'
                        ? 'border-emerald-200'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="text-xs text-slate-900 font-bold">{app.studentName}</strong>
                          <span className="text-[10px] font-mono font-bold text-[#00288e] bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                            AKTU: {app.aktuRollNo}
                          </span>
                          <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                            Reg: {app.collegeRegNo}
                          </span>
                          <span className="text-[10px] font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded">
                            {app.branch} • {app.department}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 mt-1">
                          {app.reasonTitle}
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Applied: {app.appliedAt} • Mentor: {app.mentorFacultyName.split('(')[0].trim()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-start">
                        {app.status === 'approved' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Approved
                          </span>
                        )}
                        {app.status === 'rejected' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">
                            Rejected
                          </span>
                        )}
                        {app.status === 'pending' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                            Pending Mentor Review
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {app.detailedReason}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                      <div className="flex items-center gap-3">
                        <span>
                          Period: <strong>{app.startDate}</strong> to <strong>{app.endDate}</strong> ({app.numberOfDays}d)
                        </span>
                        {app.attachmentName && (
                          <span className="text-blue-700 font-semibold flex items-center gap-1">
                            <i className="fas fa-paperclip"></i> {app.attachmentName}
                          </span>
                        )}
                      </div>

                      {app.status === 'pending' && onUpdateLeaveStatus && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateLeaveStatus(
                                app.id,
                                'rejected',
                                'Rejected during Administrative Oversight.',
                                currentUser?.name || 'Academic Controller'
                              )
                            }
                            className="px-2.5 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-bold border border-red-200"
                          >
                            Admin Reject
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateLeaveStatus(
                                app.id,
                                'approved',
                                'Direct administrative approval granted by Principal Office.',
                                currentUser?.name || 'Academic Controller'
                              )
                            }
                            className="px-3 py-1 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-xs font-bold shadow-xs"
                          >
                            Admin Approve
                          </button>
                        </div>
                      )}

                      {app.status !== 'pending' && (
                        <span className="text-[11px] text-slate-500 italic">
                          Action by {app.approvedBy || 'Mentor'}: {app.facultyRemarks || 'Approved'}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* ADD / EDIT TIMETABLE SLOT MODAL (WITH REAL-TIME CLASH CHECKING)       */}
      {/* ===================================================================== */}
      {isAddSlotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-[#c4c5d5] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#c4c5d5]/40 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00288e] text-[22px]">
                  {editingSlot ? 'edit_calendar' : 'add_box'}
                </span>
                <h3 className="font-bold text-sm text-[#131b2e]">
                  {editingSlot ? 'Edit Timetable Slot' : 'Schedule New Class / Lab Slot'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddSlotOpen(false);
                  setEditingSlot(null);
                }}
                className="text-[#757684] hover:text-[#131b2e] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* REAL-TIME COLLISION WARNING BEFORE SAVING */}
            {previewClashes.length > 0 && (
              <div className="p-3 bg-red-600 text-white rounded-xl text-xs space-y-1 shadow-md animate-pulse">
                <div className="font-bold flex items-center gap-1.5 text-yellow-300">
                  <span className="material-symbols-outlined text-[16px]">warning</span>
                  <span>CONFLICT WARNING (WILL CAUSE CLASH):</span>
                </div>
                <div className="text-[11px] leading-snug">{previewClashes[0].description}</div>
              </div>
            )}

            <form onSubmit={handleSaveSlot} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-[#444653] block mb-1">Day of Week:</label>
                  <select
                    value={newDay}
                    onChange={(e) => setNewDay(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-[#c4c5d5] outline-none bg-[#faf8ff]"
                  >
                    <option value="MON">Monday</option>
                    <option value="TUE">Tuesday</option>
                    <option value="WED">Wednesday</option>
                    <option value="THU">Thursday</option>
                    <option value="FRI">Friday</option>
                    <option value="SAT">Saturday</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[#444653] block mb-1">Period & Timing:</label>
                  <select
                    value={newPeriod}
                    onChange={(e) => setNewPeriod(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-[#c4c5d5] outline-none bg-[#faf8ff]"
                  >
                    {PERIODS.map((p) => (
                      <option key={p.period} value={p.period}>
                        Period {p.period} ({p.label})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-[#444653] block mb-1">Branch:</label>
                  <select
                    value={newBranch}
                    onChange={(e) => setNewBranch(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-[#c4c5d5] outline-none bg-[#faf8ff]"
                  >
                    {Object.keys(BRANCH_CONFIG).map((b) => (
                      <option key={b} value={b}>
                        {b} ({BRANCH_CONFIG[b as CollegeBranch].name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[#444653] block mb-1">Classroom / Lab Venue:</label>
                  <input
                    type="text"
                    value={newRoom}
                    onChange={(e) => setNewRoom(e.target.value)}
                    placeholder="e.g. 303, LAB-2A, AUDI-1"
                    required
                    className="w-full px-2.5 py-1.5 rounded-xl border border-[#c4c5d5] outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-[#444653] block mb-1">Subject Code:</label>
                  <input
                    type="text"
                    value={newSubjectCode}
                    onChange={(e) => setNewSubjectCode(e.target.value)}
                    placeholder="e.g. DAA, BCS 503, WT"
                    required
                    className="w-full px-2.5 py-1.5 rounded-xl border border-[#c4c5d5] outline-none font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#444653] block mb-1">Class Type:</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-[#c4c5d5] outline-none bg-[#faf8ff]"
                  >
                    <option value="lecture">Lecture</option>
                    <option value="lab">Laboratory Session</option>
                    <option value="tutorial">Tutorial</option>
                    <option value="seminar">Seminar / Guest Talk</option>
                    <option value="quiz">Online Quiz / Assessment</option>
                    <option value="activity">Skill / Technical Activity</option>
                    <option value="library">Library / Self Study</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#444653] block mb-1">Full Course Title:</label>
                <input
                  type="text"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="e.g. Design and Analysis of Algorithms"
                  required
                  className="w-full px-2.5 py-1.5 rounded-xl border border-[#c4c5d5] outline-none"
                />
              </div>

              {/* Faculty Selection & Custom Faculty Switcher */}
              <div className="p-3 rounded-xl bg-[#f2f3ff] border border-[#c4c5d5]/50 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-[#131b2e]">Assigned Faculty:</label>
                  <label className="flex items-center gap-1.5 text-[11px] text-[#00288e] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isCustomFaculty}
                      onChange={(e) => setIsCustomFaculty(e.target.checked)}
                      className="rounded text-[#00288e]"
                    />
                    <span>Type Custom Faculty</span>
                  </label>
                </div>

                {isCustomFaculty ? (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={customFacultyName}
                        onChange={(e) => setCustomFacultyName(e.target.value)}
                        placeholder="Faculty Name (e.g. Dr. Ramesh Chandra)"
                        required
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#c4c5d5] bg-white outline-none"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={newFacultyCode}
                        onChange={(e) => setNewFacultyCode(e.target.value)}
                        placeholder="Code (e.g. RC)"
                        required
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#c4c5d5] bg-white outline-none font-mono uppercase"
                      />
                    </div>
                  </div>
                ) : (
                  <select
                    value={newFacultyCode}
                    onChange={(e) => setNewFacultyCode(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#c4c5d5] bg-white outline-none"
                  >
                    {Object.entries(FACULTY_MAPPING).map(([code, name]) => (
                      <option key={code} value={code}>
                        {code} - {name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="pt-2 border-t border-[#c4c5d5]/40 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddSlotOpen(false);
                    setEditingSlot(null);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-[#c4c5d5] text-[#444653] hover:bg-[#faf8ff] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-xl text-white font-bold shadow-xs cursor-pointer ${
                    previewClashes.length > 0
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-[#00288e] hover:bg-[#1e40af]'
                  }`}
                >
                  {previewClashes.length > 0
                    ? 'Save Anyway (Will Trigger Clash)'
                    : editingSlot
                    ? 'Update Slot Changes'
                    : 'Confirm & Add Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* COPY DAY TIMETABLE SCHEDULE MODAL                                     */}
      {/* ===================================================================== */}
      {isCopyDayOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-[#c4c5d5] space-y-4">
            <div className="flex items-center justify-between border-b border-[#c4c5d5]/40 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00288e] text-[20px]">
                  content_copy
                </span>
                <h3 className="font-bold text-sm text-[#131b2e]">
                  Duplicate Day Schedule ({matrixBranch})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCopyDayOpen(false)}
                className="text-[#757684] hover:text-[#131b2e] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <p className="text-xs text-[#444653]">
              Quickly copy all lecture and lab periods from one day to another for branch <strong>{matrixBranch}</strong>.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-[#444653] block mb-1">Source Day (Copy From):</label>
                <select
                  value={copyFromDay}
                  onChange={(e) => setCopyFromDay(e.target.value as TimetableDay)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-[#c4c5d5] outline-none"
                >
                  <option value="MON">Monday</option>
                  <option value="TUE">Tuesday</option>
                  <option value="WED">Wednesday</option>
                  <option value="THU">Thursday</option>
                  <option value="FRI">Friday</option>
                  <option value="SAT">Saturday</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-[#444653] block mb-1">Target Day (Paste Onto):</label>
                <select
                  value={copyToDay}
                  onChange={(e) => setCopyToDay(e.target.value as TimetableDay)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-[#c4c5d5] outline-none"
                >
                  <option value="MON">Monday</option>
                  <option value="TUE">Tuesday</option>
                  <option value="WED">Wednesday</option>
                  <option value="THU">Thursday</option>
                  <option value="FRI">Friday</option>
                  <option value="SAT">Saturday</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCopyDayOpen(false)}
                  className="flex-1 py-1.5 border border-[#c4c5d5] rounded-xl text-xs font-semibold text-[#444653] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCopyDaySchedule}
                  className="flex-1 py-1.5 bg-[#00288e] hover:bg-[#1e40af] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Copy Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
