import React, { useState } from 'react';
import {
  TimetableSlot,
  TimetableDay,
  CollegeBranch,
  TimetableCollision,
  UserProfile,
} from '../types';
import {
  COLLEGE_INFO,
  BRANCH_CONFIG,
  PERIODS,
  FACULTY_MAPPING,
  detectTimetableCollisions,
  generateSimulatedClash,
  OFFICIAL_SRMS_TIMETABLE,
} from '../data/srmsTimetable';

interface TimetableScreenProps {
  slots: TimetableSlot[];
  onUpdateSlots?: (updated: TimetableSlot[]) => void;
  currentUser?: UserProfile | null;
  onNavigateToAdmin?: () => void;
}

export const TimetableScreen: React.FC<TimetableScreenProps> = ({
  slots,
  onUpdateSlots,
  currentUser,
  onNavigateToAdmin,
}) => {
  const [selectedBranch, setSelectedBranch] = useState<CollegeBranch>('CS1');
  const [selectedDay, setSelectedDay] = useState<TimetableDay>('MON');
  const [viewMode, setViewMode] = useState<'card' | 'matrix'>('card');
  const [selectedCollision, setSelectedCollision] = useState<TimetableCollision | null>(null);
  const [clashModalOpen, setClashModalOpen] = useState(false);

  // Compute collisions in real-time
  const collisions = detectTimetableCollisions(slots);

  // Identify IDs of slots that are colliding
  const collidingSlotIds = new Set<string>();
  collisions.forEach((c) => {
    collidingSlotIds.add(c.slotAId);
    collidingSlotIds.add(c.slotBId);
  });

  // Filter slots for active view
  const currentBranchSlots = slots.filter((s) => s.branch === selectedBranch);
  const activeDaySlots = currentBranchSlots.filter((s) => s.day === selectedDay);

  // Helper to get clash info for a slot
  const getSlotClashes = (slotId: string) => {
    return collisions.filter((c) => c.slotAId === slotId || c.slotBId === slotId);
  };

  const daysList: { key: TimetableDay; label: string }[] = [
    { key: 'MON', label: 'Monday' },
    { key: 'TUE', label: 'Tuesday' },
    { key: 'WED', label: 'Wednesday' },
    { key: 'THU', label: 'Thursday' },
    { key: 'FRI', label: 'Friday' },
    { key: 'SAT', label: 'Saturday' },
  ];

  const branchesList: CollegeBranch[] = ['CS1', 'CS2', 'IT', 'AIML', 'EC', 'EN', 'ME'];

  // Handle Simulate Clash
  const handleSimulateClash = () => {
    if (!onUpdateSlots) return;
    const withClashes = generateSimulatedClash(slots);
    onUpdateSlots(withClashes);
  };

  // Handle Reset to Official Timetable
  const handleResetToOfficial = () => {
    if (!onUpdateSlots) return;
    onUpdateSlots(OFFICIAL_SRMS_TIMETABLE);
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#131b2e] pb-24">
      {/* Top Academic Header */}
      <header className="bg-white border-b border-[#c4c5d5]/40 px-4 py-3 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#00288e] text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
              SRMS
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-sm md:text-base font-bold text-[#00288e] tracking-tight leading-tight">
                  {COLLEGE_INFO.institution}
                </h1>
                <span className="text-[10px] bg-[#eaedff] text-[#00288e] px-2 py-0.5 rounded-full font-semibold">
                  Odd Sem V
                </span>
              </div>
              <p className="text-[11px] text-[#444653]">
                {COLLEGE_INFO.title} • W.E.F: {COLLEGE_INFO.wef} • Coordinator:{' '}
                <strong>{COLLEGE_INFO.coordinator}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
            {/* View Mode Switcher */}
            <div className="flex bg-[#f2f3ff] p-0.5 rounded-lg border border-[#c4c5d5]/50 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('card')}
                className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition-all ${
                  viewMode === 'card' ? 'bg-white text-[#00288e] font-bold shadow-xs' : 'text-[#757684]'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">view_agenda</span>
                <span>Day View</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('matrix')}
                className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition-all ${
                  viewMode === 'matrix' ? 'bg-white text-[#00288e] font-bold shadow-xs' : 'text-[#757684]'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">grid_on</span>
                <span>Full Matrix</span>
              </button>
            </div>

            {/* Print / Export Button */}
            <button
              type="button"
              onClick={() => window.print()}
              className="px-2.5 py-1 text-xs rounded-lg border border-[#c4c5d5] bg-white hover:bg-[#eaedff] text-[#00288e] font-semibold flex items-center gap-1 shadow-2xs cursor-pointer"
              title="Print Timetable"
            >
              <span className="material-symbols-outlined text-[15px]">print</span>
              <span className="hidden sm:inline">Print</span>
            </button>

            {/* Quick Testing buttons */}
            {onUpdateSlots && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleSimulateClash}
                  className="px-2.5 py-1 text-[11px] rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                  title="Simulate schedule collision to test red error alert"
                >
                  <span className="material-symbols-outlined text-[14px]">warning</span>
                  <span>Test Clash</span>
                </button>
                {collisions.length > 0 && (
                  <button
                    type="button"
                    onClick={handleResetToOfficial}
                    className="px-2.5 py-1 text-[11px] rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    title="Restore verified official SRMS timetable"
                  >
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    <span>Fix & Clean</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 pt-4 space-y-4">
        {/* ===================================================================== */}
        {/* CRITICAL COLLISION RED ALERT BANNER                                   */}
        {/* ===================================================================== */}
        {collisions.length > 0 ? (
          <div className="p-4 rounded-2xl bg-red-600 text-white shadow-lg border-2 border-red-700 animate-pulse space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[28px] text-yellow-300 flex-shrink-0 animate-bounce">
                  error
                </span>
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-white flex items-center gap-2">
                    <span>CRITICAL SCHEDULE COLLISION DETECTED</span>
                    <span className="bg-yellow-400 text-black text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                      {collisions.length} {collisions.length === 1 ? 'Clash' : 'Clashes'}
                    </span>
                  </h2>
                  <p className="text-xs text-red-100 mt-0.5">
                    The timetable contains overlapping room, faculty, or branch bookings that violate college academic
                    regulations. Conflicting periods are highlighted in bright red below.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setClashModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-white text-red-700 hover:bg-yellow-100 text-xs font-bold shadow-md flex items-center gap-1 flex-shrink-0 cursor-pointer"
              >
                <span>Inspect All Clashes</span>
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </button>
            </div>

            {/* Quick List of Clashes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-red-500/60">
              {collisions.slice(0, 4).map((c, idx) => (
                <div
                  key={c.id || idx}
                  className="bg-red-800/80 rounded-xl p-2.5 text-xs border border-red-400/40 flex items-start gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-yellow-300 mt-1 flex-shrink-0"></span>
                  <div className="space-y-0.5">
                    <div className="font-bold text-yellow-200">
                      {c.type === 'room_clash'
                        ? 'Room Clash'
                        : c.type === 'faculty_clash'
                        ? 'Faculty Double-Booked'
                        : 'Student Batch Clash'}{' '}
                      • {c.day} ({c.timeSlot})
                    </div>
                    <div className="text-[11px] text-red-100 leading-snug">{c.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between text-xs font-medium">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-[20px]">verified</span>
              <span>
                <strong>Verified Timetable:</strong> Zero Schedule Collisions. All 7 branches and faculty assignments
                are conflict-free.
              </span>
            </div>
            <span className="text-[11px] font-mono text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded">
              AMS Ready
            </span>
          </div>
        )}

        {/* Branch Selector Pills */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-[#444653]">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Select Academic Branch:</span>
            <span className="text-[11px] text-[#757684]">
              Dedicated Hall: <strong>Room {BRANCH_CONFIG[selectedBranch].defaultRoom}</strong>
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {branchesList.map((branch) => {
              const cfg = BRANCH_CONFIG[branch];
              const isSelected = selectedBranch === branch;
              // Check if any clashes exist in this branch
              const hasBranchClash = slots
                .filter((s) => s.branch === branch)
                .some((s) => collidingSlotIds.has(s.id));

              return (
                <button
                  key={branch}
                  type="button"
                  onClick={() => setSelectedBranch(branch)}
                  className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
                    isSelected
                      ? 'bg-[#00288e] text-white border-[#00288e] shadow-xs'
                      : hasBranchClash
                      ? 'bg-red-50 text-red-800 border-red-300 hover:bg-red-100'
                      : 'bg-white text-[#444653] border-[#c4c5d5]/60 hover:bg-[#eaedff]'
                  }`}
                >
                  <span>{branch}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : hasBranchClash
                        ? 'bg-red-200 text-red-900'
                        : 'bg-[#f2f3ff] text-[#444653]'
                    }`}
                  >
                    R-{cfg.defaultRoom}
                  </span>
                  {hasBranchClash && (
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" title="Clash in this branch" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Day Selector Tabs */}
        {viewMode === 'card' && (
          <div className="flex bg-[#eaedff]/60 p-1 rounded-xl border border-[#c4c5d5]/40 text-xs font-semibold gap-1 overflow-x-auto">
            {daysList.map((day) => {
              const isSelected = selectedDay === day.key;
              const dayHasClash = currentBranchSlots
                .filter((s) => s.day === day.key)
                .some((s) => collidingSlotIds.has(s.id));

              return (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => setSelectedDay(day.key)}
                  className={`flex-1 min-w-[70px] py-2 rounded-lg text-center transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    isSelected
                      ? 'bg-white text-[#00288e] font-bold shadow-xs'
                      : dayHasClash
                      ? 'text-red-700 hover:bg-red-100'
                      : 'text-[#444653] hover:text-[#131b2e]'
                  }`}
                >
                  <span>{day.label}</span>
                  {dayHasClash && (
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600" title="Collision on this day" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* ===================================================================== */}
        {/* VIEW MODE 1: DAY CARD VIEW                                            */}
        {/* ===================================================================== */}
        {viewMode === 'card' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-[#444653] px-1">
              <span>
                Schedule for <strong>{BRANCH_CONFIG[selectedBranch].name}</strong> on{' '}
                <strong>{daysList.find((d) => d.key === selectedDay)?.label}</strong>
              </span>
              <span>{activeDaySlots.length} Scheduled Periods</span>
            </div>

            {activeDaySlots.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-[#c4c5d5]/50 space-y-2">
                <span className="material-symbols-outlined text-[36px] text-[#757684]">event_busy</span>
                <div className="text-sm font-bold text-[#131b2e]">No Scheduled Classes</div>
                <p className="text-xs text-[#757684]">
                  No lectures are registered for {selectedBranch} on {selectedDay}. Use the Admin Dashboard to add new
                  slots.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeDaySlots.map((slot) => {
                  const isClashing = collidingSlotIds.has(slot.id);
                  const slotClashes = getSlotClashes(slot.id);

                  return (
                    <div
                      key={slot.id}
                      onClick={() => {
                        if (isClashing && slotClashes.length > 0) {
                          setSelectedCollision(slotClashes[0]);
                          setClashModalOpen(true);
                        }
                      }}
                      className={`p-4 rounded-2xl transition-all relative border cursor-pointer ${
                        isClashing
                          ? 'border-2 border-red-600 bg-red-50 text-red-950 shadow-md ring-2 ring-red-400/50 animate-pulse'
                          : 'bg-white border-[#c4c5d5]/60 hover:border-[#00288e] shadow-2xs hover:shadow-xs'
                      }`}
                    >
                      {/* Collision Warning Banner Badge on Card */}
                      {isClashing && (
                        <div className="mb-2.5 p-2 rounded-xl bg-red-600 text-white text-[11px] font-bold flex items-center justify-between shadow-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px] text-yellow-300">warning</span>
                            <span>COLLISION DETECTED!</span>
                          </div>
                          <span className="text-[10px] bg-red-800 px-1.5 py-0.5 rounded font-mono">
                            Click to Inspect
                          </span>
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-base font-extrabold tracking-tight ${
                                isClashing ? 'text-red-900' : 'text-[#00288e]'
                              }`}
                            >
                              {slot.subjectCode}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                slot.type === 'lab'
                                  ? 'bg-amber-100 text-amber-800'
                                  : slot.type === 'tutorial'
                                  ? 'bg-purple-100 text-purple-800'
                                  : slot.type === 'seminar'
                                  ? 'bg-blue-100 text-blue-800'
                                  : slot.type === 'quiz'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-indigo-100 text-indigo-800'
                              }`}
                            >
                              {slot.type}
                            </span>
                            {slot.batchGroup && (
                              <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                                {slot.batchGroup}
                              </span>
                            )}
                          </div>
                          <h3 className="text-xs font-semibold text-[#131b2e] leading-snug">{slot.subjectName}</h3>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className="text-xs font-mono font-bold text-[#131b2e]">{slot.timeSlot}</div>
                          <div className="text-[10px] text-[#757684]">Period {slot.periodNumber}</div>
                        </div>
                      </div>

                      {/* Details: Faculty & Room */}
                      <div className="mt-3 pt-3 border-t border-[#c4c5d5]/40 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-[#444653] min-w-0">
                          <span className="material-symbols-outlined text-[16px] text-[#757684]">person</span>
                          <span className="font-medium truncate" title={slot.facultyName}>
                            {slot.facultyName || FACULTY_MAPPING[slot.facultyCode] || slot.facultyCode}
                          </span>
                        </div>

                        <div
                          className={`flex items-center gap-1 font-bold px-2 py-0.5 rounded-lg text-xs ${
                            isClashing
                              ? 'bg-red-200 text-red-900 font-mono'
                              : 'bg-[#f2f3ff] text-[#00288e]'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[15px]">meeting_room</span>
                          <span>Room {slot.room}</span>
                        </div>
                      </div>

                      {/* Explicit Clash Reason Display */}
                      {isClashing && slotClashes.length > 0 && (
                        <div className="mt-2 p-2 rounded-lg bg-red-100/90 border border-red-300 text-[11px] text-red-900 leading-snug">
                          <strong>Conflict Reason:</strong> {slotClashes[0].description}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===================================================================== */}
        {/* VIEW MODE 2: MASTER TIMETABLE MATRIX TABLE                            */}
        {/* ===================================================================== */}
        {viewMode === 'matrix' && (
          <div className="bg-white rounded-2xl border border-[#c4c5d5]/60 shadow-sm overflow-hidden space-y-2">
            <div className="p-3 bg-[#eaedff] border-b border-[#c4c5d5]/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00288e] text-[20px]">table_chart</span>
                <span className="text-xs font-bold text-[#00288e]">
                  Master Weekly Grid: {BRANCH_CONFIG[selectedBranch].name}
                </span>
              </div>
              <span className="text-[11px] text-[#444653]">
                Default Room: <strong>{BRANCH_CONFIG[selectedBranch].defaultRoom}</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-[#f8f9ff] text-[#444653] border-b border-[#c4c5d5]/50">
                    <th className="py-2.5 px-3 font-bold text-center border-r border-[#c4c5d5]/40 w-16">Day</th>
                    {PERIODS.map((p) => (
                      <th
                        key={p.period}
                        className="py-2.5 px-2 font-semibold text-center border-r border-[#c4c5d5]/30"
                      >
                        <div className="text-[11px] font-bold text-[#00288e]">P-{p.period}</div>
                        <div className="text-[9.5px] text-[#757684] font-mono leading-none">{p.label}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {daysList.map((day) => {
                    const daySlots = currentBranchSlots.filter((s) => s.day === day.key);

                    return (
                      <tr key={day.key} className="border-b border-[#c4c5d5]/30 hover:bg-[#faf8ff]">
                        <td className="py-3 px-3 font-bold text-center bg-[#f8f9ff] border-r border-[#c4c5d5]/40 text-[#00288e]">
                          {day.key}
                        </td>
                        {PERIODS.map((p) => {
                          const slot = daySlots.find((s) => s.periodNumber === p.period);
                          const isClashing = slot && collidingSlotIds.has(slot.id);

                          if (!slot) {
                            return (
                              <td
                                key={p.period}
                                className="py-2 px-1.5 text-center text-[#757684] border-r border-[#c4c5d5]/20 font-mono text-[10px]"
                              >
                                —
                              </td>
                            );
                          }

                          return (
                            <td
                              key={p.period}
                              onClick={() => {
                                if (isClashing) {
                                  const cl = getSlotClashes(slot.id);
                                  if (cl.length > 0) {
                                    setSelectedCollision(cl[0]);
                                    setClashModalOpen(true);
                                  }
                                }
                              }}
                              className={`py-2 px-1.5 border-r border-[#c4c5d5]/30 align-top transition-colors ${
                                isClashing
                                  ? 'bg-red-100/90 text-red-950 font-bold border-2 border-red-600 animate-pulse cursor-pointer'
                                  : 'hover:bg-[#eaedff]/40'
                              }`}
                            >
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center justify-between">
                                  <span
                                    className={`font-bold ${isClashing ? 'text-red-900' : 'text-[#00288e]'}`}
                                  >
                                    {slot.subjectCode}
                                  </span>
                                  <span className="text-[9px] font-mono text-[#757684]">R-{slot.room}</span>
                                </div>
                                <div className="text-[10px] text-[#444653] truncate" title={slot.facultyName}>
                                  {slot.facultyCode}
                                </div>
                                {isClashing && (
                                  <span className="text-[9px] bg-red-600 text-white px-1 py-0.2 rounded font-bold text-center">
                                    CLASH!
                                  </span>
                                )}
                              </div>
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

        {/* Administrator Access Banner */}
        {currentUser?.role === 'admin' ? (
          <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-purple-700 text-[24px]">admin_panel_settings</span>
              <div>
                <div className="font-bold text-purple-900">Administrator Timetable Controls Active</div>
                <div className="text-purple-700 text-[11px]">
                  You have full privileges to add, reschedule, and delete slots, and resolve collision warnings.
                </div>
              </div>
            </div>
            {onNavigateToAdmin && (
              <button
                type="button"
                onClick={onNavigateToAdmin}
                className="px-3 py-1.5 rounded-xl bg-purple-700 text-white font-bold text-xs hover:bg-purple-800 shadow-xs cursor-pointer"
              >
                Open Admin Hub
              </button>
            )}
          </div>
        ) : null}
      </div>

      {/* ===================================================================== */}
      {/* COLLISION INSPECTOR MODAL                                             */}
      {/* ===================================================================== */}
      {clashModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border-2 border-red-500 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-red-200 pb-3">
              <div className="flex items-center gap-2 text-red-700">
                <span className="material-symbols-outlined text-[24px]">error</span>
                <h3 className="font-bold text-base">Schedule Collision Inspector</h3>
              </div>
              <button
                type="button"
                onClick={() => setClashModalOpen(false)}
                className="text-[#757684] hover:text-[#131b2e] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {selectedCollision ? (
              <div className="space-y-3">
                <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-900 space-y-1">
                  <div className="font-bold uppercase tracking-wider text-[11px] text-red-800">
                    {selectedCollision.type === 'room_clash'
                      ? '⚠️ Room Double-Booking Violation'
                      : selectedCollision.type === 'faculty_clash'
                      ? '⚠️ Faculty Double-Booking Violation'
                      : '⚠️ Student Batch Overlap Violation'}
                  </div>
                  <div>{selectedCollision.description}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 bg-[#faf8ff] rounded-xl border border-[#c4c5d5]">
                    <div className="font-bold text-[#00288e]">{selectedCollision.slotA.branch} Slot</div>
                    <div className="text-[11px] text-[#444653] mt-1 space-y-0.5">
                      <div>Subject: {selectedCollision.slotA.subjectCode}</div>
                      <div>Room: {selectedCollision.slotA.room}</div>
                      <div>Faculty: {selectedCollision.slotA.facultyName}</div>
                      <div>Period: {selectedCollision.slotA.timeSlot}</div>
                    </div>
                  </div>

                  <div className="p-3 bg-[#faf8ff] rounded-xl border border-[#c4c5d5]">
                    <div className="font-bold text-[#00288e]">{selectedCollision.slotB.branch} Slot</div>
                    <div className="text-[11px] text-[#444653] mt-1 space-y-0.5">
                      <div>Subject: {selectedCollision.slotB.subjectCode}</div>
                      <div>Room: {selectedCollision.slotB.room}</div>
                      <div>Faculty: {selectedCollision.slotB.facultyName}</div>
                      <div>Period: {selectedCollision.slotB.timeSlot}</div>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                  <div className="font-bold">Recommended Resolution:</div>
                  <div>{selectedCollision.recommendation}</div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-[#444653]">
                  The system has identified <strong>{collisions.length} active schedule collisions</strong>. Review the
                  conflicts below:
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {collisions.map((c, i) => (
                    <div
                      key={c.id || i}
                      className="p-2.5 rounded-xl border border-red-300 bg-red-50 text-xs text-red-950 space-y-1"
                    >
                      <div className="font-bold flex items-center justify-between text-red-800">
                        <span>
                          {c.type === 'room_clash'
                            ? 'Room Clash'
                            : c.type === 'faculty_clash'
                            ? 'Faculty Clash'
                            : 'Branch Clash'}{' '}
                          • {c.day} ({c.timeSlot})
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedCollision(c)}
                          className="text-[10px] bg-red-700 text-white px-2 py-0.5 rounded cursor-pointer"
                        >
                          Details
                        </button>
                      </div>
                      <div className="text-[11px]">{c.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-[#c4c5d5]/40 flex items-center justify-between">
              {onUpdateSlots && (
                <button
                  type="button"
                  onClick={() => {
                    handleResetToOfficial();
                    setClashModalOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Resolve & Reset to Official Timetable
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setSelectedCollision(null);
                  setClashModalOpen(false);
                }}
                className="px-3 py-1.5 rounded-xl border border-[#c4c5d5] text-xs font-semibold hover:bg-[#faf8ff] cursor-pointer ml-auto"
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
