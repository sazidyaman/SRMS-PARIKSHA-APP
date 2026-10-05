import React, { useState } from 'react';
import {
  UserProfile,
  LeaveApplication,
  LeaveReasonCategory,
  CollegeBranch,
} from '../types';
import {
  LEAVE_REASONS_CATALOG,
  FACULTY_MAPPING,
  BRANCH_CONFIG,
} from '../data/srmsTimetable';

interface LeaveApplicationModalProps {
  currentUser: UserProfile | null;
  applications: LeaveApplication[];
  onClose: () => void;
  onSubmitLeave: (newApplication: LeaveApplication) => void;
}

export const LeaveApplicationModal: React.FC<LeaveApplicationModalProps> = ({
  currentUser,
  applications,
  onClose,
  onSubmitLeave,
}) => {
  const [activeTab, setActiveTab] = useState<'apply' | 'history'>('apply');
  const [reasonCategory, setReasonCategory] = useState<LeaveReasonCategory>('sickness');
  const [reasonTitle, setReasonTitle] = useState('');
  const [detailedReason, setDetailedReason] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedMentorCode, setSelectedMentorCode] = useState('AP');
  const [attachmentName, setAttachmentName] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Student details derived from profile
  const studentName = currentUser?.name || 'Student';
  const aktuRollNo = currentUser?.universityRollNo || currentUser?.aktuRollNo || currentUser?.identifier || '2200100100084';
  const collegeRegNo = currentUser?.collegeRegNo || 'SRMS/2026/BTECH';
  const branch: CollegeBranch = currentUser?.branch || 'CS1';
  const department = currentUser?.department || 'Computer Science & Engineering';

  // Calculate duration in days
  const calculateDays = (start: string, end: string): number => {
    if (!start || !end) return 1;
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 3600 * 24)) + 1;
    return diff > 0 ? diff : 1;
  };

  const numberOfDays = calculateDays(startDate, endDate);

  // Mentor faculty options
  const mentorList = [
    { code: 'AP', name: FACULTY_MAPPING.AP || 'Dr. Ashutosh Pandey' },
    { code: 'PKS', name: FACULTY_MAPPING.PKS || 'Dr. Pradeep C. Sharma' },
    { code: 'SRB', name: FACULTY_MAPPING.SRB || 'Mr. Saurabh Rastogi' },
    { code: 'AD', name: FACULTY_MAPPING.AD || 'Dr. Ashutosh Dwivedi' },
    { code: 'AS', name: FACULTY_MAPPING.AS || 'Dr. Avtar Singh' },
    { code: 'NP', name: FACULTY_MAPPING.NP || 'Er. Priyesh Tiwari' },
    { code: 'SHM', name: FACULTY_MAPPING.SHM || 'Mr. S. H. Mishra' },
  ];

  const handleFakeFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentName(file.name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!reasonTitle.trim()) {
      setFormError('Please enter a brief subject/title for your leave request.');
      return;
    }
    if (!detailedReason.trim()) {
      setFormError('Please provide a detailed explanation for your leave of absence.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setFormError('Leave End Date cannot be earlier than Start Date.');
      return;
    }

    const mentorObj = mentorList.find((m) => m.code === selectedMentorCode) || mentorList[0];

    const newApp: LeaveApplication = {
      id: `leave-${Date.now()}`,
      studentId: currentUser?.id || `std-${aktuRollNo}`,
      studentName,
      aktuRollNo,
      collegeRegNo,
      branch,
      department,
      mentorFacultyCode: mentorObj.code,
      mentorFacultyName: mentorObj.name,
      reasonCategory,
      reasonTitle: reasonTitle.trim(),
      detailedReason: detailedReason.trim(),
      startDate,
      endDate,
      numberOfDays,
      status: 'pending',
      appliedAt: new Date().toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
      attachmentName: attachmentName || undefined,
    };

    onSubmitLeave(newApp);
    setSubmittedSuccess(true);
    setTimeout(() => {
      setSubmittedSuccess(false);
      setActiveTab('history');
    }, 1500);
  };

  // Filter student's applications
  const myApplications = applications.filter(
    (app) =>
      app.studentName.toLowerCase() === studentName.toLowerCase() ||
      app.aktuRollNo === aktuRollNo ||
      app.collegeRegNo === collegeRegNo
  );

  const pendingCount = myApplications.filter((a) => a.status === 'pending').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]"
        role="dialog"
        aria-labelledby="leave-modal-title"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#00288e] via-[#001f6d] to-[#001242] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
              <i className="fas fa-file-signature text-amber-300 text-xl"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-amber-400 text-slate-950">
                  Official Format
                </span>
                <span className="text-xs text-blue-200">SRMS CET AMS</span>
              </div>
              <h2 id="leave-modal-title" className="text-lg font-bold tracking-tight">
                Student Leave Application Portal
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            title="Close"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 pt-3 gap-3 bg-slate-50">
          <button
            type="button"
            onClick={() => setActiveTab('apply')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'apply'
                ? 'border-[#00288e] text-[#00288e]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <i className="fas fa-edit"></i>
            New Leave Application
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 relative ${
              activeTab === 'history'
                ? 'border-[#00288e] text-[#00288e]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <i className="fas fa-history"></i>
            Leave History & Status
            {pendingCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-extrabold">
                {pendingCount} Pending
              </span>
            )}
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 bg-white">
          {activeTab === 'apply' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {submittedSuccess ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center animate-fade-in">
                  <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto text-2xl mb-3 shadow-lg">
                    <i className="fas fa-check"></i>
                  </div>
                  <h3 className="text-base font-bold text-emerald-900">
                    Leave Application Submitted Successfully!
                  </h3>
                  <p className="text-xs text-emerald-700 mt-1 max-w-md mx-auto">
                    Your leave request has been officially logged in the SRMS Attendance System.
                    A notification alert has been sent to your assigned mentor for verification.
                  </p>
                </div>
              ) : (
                <>
                  {/* Verified Student Meta Card */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Applicant Credentials
                      </span>
                      <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                        {BRANCH_CONFIG[branch]?.name || branch}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Student Name</span>
                        <strong className="text-slate-800 font-semibold">{studentName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">AKTU Roll No.</span>
                        <strong className="text-[#00288e] font-mono font-bold">{aktuRollNo}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">College Reg. No.</span>
                        <strong className="text-slate-800 font-mono font-bold">{collegeRegNo}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Branch / Dept</span>
                        <strong className="text-slate-800 font-semibold">{branch} • {department}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Reason Category Pills */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Select Leave Category <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {LEAVE_REASONS_CATALOG.map((cat) => {
                        const isSelected = reasonCategory === cat.category;
                        return (
                          <button
                            key={cat.category}
                            type="button"
                            onClick={() => setReasonCategory(cat.category)}
                            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                              isSelected
                                ? 'border-[#00288e] bg-blue-50/70 ring-2 ring-[#00288e]/30 shadow-sm'
                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${
                                  isSelected ? 'bg-[#00288e] text-white' : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                <i className={`fas ${cat.icon}`}></i>
                              </div>
                              <span
                                className={`text-xs font-bold ${
                                  isSelected ? 'text-[#00288e]' : 'text-slate-700'
                                }`}
                              >
                                {cat.label.split('/')[0].trim()}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 leading-snug line-clamp-2">
                              {cat.description}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Subject & Mentor Selector */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Application Subject / Headline <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder={
                          reasonCategory === 'sickness'
                            ? 'e.g., Viral Fever and Doctor Recommended Bed Rest'
                            : reasonCategory === 'rainy_day'
                            ? 'e.g., Heavy Rain & Inaccessible Bus Route'
                            : 'e.g., Urgent Domestic Affair / Medical Emergency'
                        }
                        value={reasonTitle}
                        onChange={(e) => setReasonTitle(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00288e] focus:border-transparent font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Forward to Faculty Mentor / HOD <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={selectedMentorCode}
                        onChange={(e) => setSelectedMentorCode(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00288e] focus:border-transparent bg-white font-medium"
                      >
                        {mentorList.map((m) => (
                          <option key={m.code} value={m.code}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Dates Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        From Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00288e] font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        To Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00288e] font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Total Days of Absence
                      </label>
                      <div className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 font-bold text-[#00288e] flex items-center justify-between">
                        <span>{numberOfDays} {numberOfDays === 1 ? 'Day' : 'Days'}</span>
                        <i className="fas fa-calendar-day text-slate-400"></i>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Explanation */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Detailed Justification / Circumstance <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Respectfully state your circumstances clearly. In case of illness, mention diagnosis and doctor advice. In case of bad weather, state area/bus route affected..."
                      value={detailedReason}
                      onChange={(e) => setDetailedReason(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00288e] focus:border-transparent font-medium resize-none"
                    ></textarea>
                  </div>

                  {/* Supporting Document / Medical Certificate Simulation */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Supporting Document / Medical Slip / Route Proof (Optional)
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors">
                        <i className="fas fa-paperclip text-slate-500"></i>
                        <span>Attach Document</span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleFakeFileUpload}
                          className="hidden"
                        />
                      </label>
                      {attachmentName ? (
                        <div className="flex items-center gap-2 text-xs text-blue-700 font-semibold bg-blue-50 px-3 py-1 rounded-md border border-blue-200">
                          <i className="fas fa-file-pdf"></i>
                          <span className="truncate max-w-xs">{attachmentName}</span>
                          <button
                            type="button"
                            onClick={() => setAttachmentName('')}
                            className="text-slate-400 hover:text-red-500 ml-1"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          Recommended for medical sick leaves exceeding 2 days.
                        </span>
                      )}
                    </div>
                  </div>

                  {formError && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                      <i className="fas fa-exclamation-circle text-red-500"></i>
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Submission Notice */}
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
                    <i className="fas fa-info-circle text-amber-600 mt-0.5"></i>
                    <div>
                      <strong>Official Undertaking:</strong> Once submitted, this leave application will be
                      forwarded directly to your assigned faculty mentor and logged on the SRMS Attendance System.
                      Approved leaves will be marked as excused attendance in lab and theory classes.
                    </div>
                  </div>
                </>
              )}

              {/* Form Actions */}
              {!submittedSuccess && (
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#00288e] to-blue-700 text-white text-xs font-bold shadow-md hover:from-blue-800 hover:to-blue-900 transition-all flex items-center gap-2"
                  >
                    <i className="fas fa-paper-plane"></i>
                    Submit Application & Notify Faculty
                  </button>
                </div>
              )}
            </form>
          ) : (
            /* TAB 2: LEAVE HISTORY */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Application History for {studentName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    AKTU: {aktuRollNo} • Reg: {collegeRegNo}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('apply')}
                  className="px-3 py-1.5 bg-[#00288e] text-white text-xs font-bold rounded-lg shadow hover:bg-blue-800 transition-colors flex items-center gap-1.5"
                >
                  <i className="fas fa-plus"></i>
                  Apply New
                </button>
              </div>

              {myApplications.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                  <i className="fas fa-calendar-check text-3xl mb-2 text-slate-300"></i>
                  <p className="text-xs font-semibold text-slate-600">No leave applications found.</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    You currently have full regular attendance with no recorded leave absences.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myApplications.map((app) => {
                    const statusBadge =
                      app.status === 'approved' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <i className="fas fa-check-circle"></i> Approved
                        </span>
                      ) : app.status === 'rejected' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
                          <i className="fas fa-times-circle"></i> Rejected
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 animate-pulse">
                          <i className="fas fa-clock"></i> Pending Faculty Review
                        </span>
                      );

                    return (
                      <div
                        key={app.id}
                        className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white shadow-sm transition-all"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-800">
                                {app.reasonTitle}
                              </span>
                              <span className="text-[10px] uppercase font-bold text-slate-500 px-1.5 py-0.5 bg-slate-100 rounded">
                                {app.reasonCategory.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Applied on {app.appliedAt}
                            </p>
                          </div>
                          <div>{statusBadge}</div>
                        </div>

                        <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-2.5">
                          {app.detailedReason}
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600 border-t border-slate-100 pt-2">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Leave Duration</span>
                            <span className="font-semibold text-slate-700">
                              {app.startDate} to {app.endDate} ({app.numberOfDays}d)
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Assigned Mentor</span>
                            <span className="font-semibold text-[#00288e]">
                              {app.mentorFacultyName.split('(')[0].trim()}
                            </span>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="text-slate-400 block text-[10px]">Faculty Remarks</span>
                            <span className="italic text-slate-700">
                              {app.facultyRemarks || (
                                <span className="text-slate-400">Awaiting mentor verification...</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-2.5 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors"
          >
            Close Portal
          </button>
        </div>
      </div>
    </div>
  );
};
