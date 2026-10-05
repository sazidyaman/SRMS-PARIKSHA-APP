import React, { useState } from 'react';
import { UserProfile, UserRole, CollegeBranch } from '../types';
import {
  signInWithGoogleAuth,
  saveUserProfileToFirestore,
  getUserProfileByRollNumber,
  getUserProfileByRegNumber,
  DEFAULT_ADMIN_PROFILE,
  DEFAULT_COORDINATOR_PROFILE,
} from '../services/firebase';
import { BRANCH_CONFIG } from '../data/srmsTimetable';

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  // Main portal tab: 'student' or 'admin_faculty'
  const [portalMode, setPortalMode] = useState<'student' | 'admin_faculty'>('student');

  // Student sub-mode: 'signin' vs 'register'
  const [studentMode, setStudentMode] = useState<'signin' | 'register'>('signin');

  // Admin/Faculty sub-role
  const [staffRole, setStaffRole] = useState<'admin' | 'faculty'>('admin');

  // Loading & error state
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Student Sign-In / Register Form fields
  const [studentRollNo, setStudentRollNo] = useState('');
  const [studentRegNo, setStudentRegNo] = useState('');
  const [studentFullName, setStudentFullName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentBranch, setStudentBranch] = useState<CollegeBranch>('CS1');
  const [studentSemester, setStudentSemester] = useState('Semester V (3rd Year)');
  const [studentPassword, setStudentPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Staff Form fields
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');

  // Google account selector popup modal (for offline/demo and custom student setup)
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleOnboardingOpen, setGoogleOnboardingOpen] = useState(false);
  const [pendingGoogleUser, setPendingGoogleUser] = useState<{
    name: string;
    email: string;
    avatarUrl?: string;
  } | null>(null);

  // Google Student Onboarding extra fields
  const [onboardRollNo, setOnboardRollNo] = useState('2400100100084');
  const [onboardRegNo, setOnboardRegNo] = useState('SRMS/2026/BTECH/CSE/084');
  const [onboardBranch, setOnboardBranch] = useState<CollegeBranch>('CS1');

  // Forgot password modal
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Helper to retrieve saved students from localStorage
  const getRegisteredStudents = (): UserProfile[] => {
    try {
      const data = localStorage.getItem('srms_registered_students');
      if (data) return JSON.parse(data);
    } catch {}
    return [];
  };

  // Helper to persist new student in localStorage
  const saveRegisteredStudent = (student: UserProfile) => {
    try {
      const existing = getRegisteredStudents();
      const updated = [student, ...existing.filter((s) => s.id !== student.id && s.universityRollNo !== student.universityRollNo)];
      localStorage.setItem('srms_registered_students', JSON.stringify(updated));
    } catch {}
  };

  // Handle Student Credentials Form Submit (Roll No & Reg No)
  const handleStudentFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanRoll = studentRollNo.trim();
    const cleanReg = studentRegNo.trim();

    if (!cleanRoll || !cleanReg) {
      setErrorMsg('Please enter both University Roll Number and College Registration Number.');
      return;
    }

    if (studentMode === 'register') {
      if (!studentFullName.trim()) {
        setErrorMsg('Please enter your full name for student registration.');
        return;
      }

      // Create brand new student profile
      const newStudent: UserProfile = {
        id: `std-${Date.now()}`,
        name: studentFullName.trim(),
        email: studentEmail.trim() || `${cleanRoll.toLowerCase()}@srms.ac.in`,
        role: 'student',
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(studentFullName.trim())}`,
        identifier: cleanRoll,
        universityRollNo: cleanRoll,
        aktuRollNo: cleanRoll,
        collegeRegNo: cleanReg,
        branch: studentBranch,
        aktuCollegeCode: '010 (SRMS CET, Bareilly)',
        department: BRANCH_CONFIG[studentBranch]?.name || 'Department of Computer Science & Engineering',
        degree: `B.Tech ${studentBranch} • ${studentSemester}`,
        cgpa: '8.40',
        institution: 'SRMS College of Engineering & Technology, Bareilly (AKTU Code: 010)',
      };

      saveRegisteredStudent(newStudent);
      await saveUserProfileToFirestore(newStudent);
      onLoginSuccess(newStudent);
    } else {
      // Sign-in mode: Check if existing student in local storage or Firestore, or create new profile with provided credentials
      const savedStudents = getRegisteredStudents();
      let match = savedStudents.find(
        (s) =>
          s.universityRollNo?.toLowerCase() === cleanRoll.toLowerCase() ||
          s.collegeRegNo?.toLowerCase() === cleanReg.toLowerCase()
      );

      // Check Firestore cloud database if not found in local cache
      if (!match) {
        try {
          const firestoreUser = (await getUserProfileByRollNumber(cleanRoll)) || (await getUserProfileByRegNumber(cleanReg));
          if (firestoreUser) {
            match = firestoreUser;
            saveRegisteredStudent(match);
          }
        } catch (err) {
          console.warn('Firestore user lookup error:', err);
        }
      }

      if (match) {
        // Return existing registered student
        onLoginSuccess(match);
      } else {
        // Auto-initialize new student with the entered Roll & Reg
        const inferredName = cleanRoll.slice(-4)
          ? `Student ${cleanRoll.slice(-4)}`
          : 'Enrolled Student';

        const freshStudent: UserProfile = {
          id: `std-${Date.now()}`,
          name: inferredName,
          email: `${cleanRoll}@srms.ac.in`,
          role: 'student',
          avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanRoll)}`,
          identifier: cleanRoll,
          universityRollNo: cleanRoll,
          aktuRollNo: cleanRoll,
          collegeRegNo: cleanReg,
          branch: studentBranch,
          aktuCollegeCode: '010 (SRMS CET, Bareilly)',
          department: BRANCH_CONFIG[studentBranch]?.name || 'Computer Science & Engineering',
          degree: `B.Tech ${studentBranch} • Sem V (3rd Year)`,
          cgpa: '8.25',
          institution: 'SRMS College of Engineering & Technology, Bareilly (AKTU Code: 010)',
        };

        saveRegisteredStudent(freshStudent);
        await saveUserProfileToFirestore(freshStudent);
        onLoginSuccess(freshStudent);
      }
    }
  };

  // Handle Admin / Faculty Staff Submit
  const handleStaffFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!staffEmail) {
      setErrorMsg('Please enter your institutional email address.');
      return;
    }

    if (staffRole === 'admin') {
      const adminUser: UserProfile = {
        ...DEFAULT_ADMIN_PROFILE,
        id: 'admin-' + (staffEmail.split('@')[0] || 'principal'),
        email: staffEmail,
        name: staffEmail.toLowerCase().includes('pandey') ? 'Dr. Ashutosh Pandey' : DEFAULT_ADMIN_PROFILE.name,
      };
      await saveUserProfileToFirestore(adminUser);
      onLoginSuccess(adminUser);
    } else {
      const facultyUser: UserProfile = {
        ...DEFAULT_COORDINATOR_PROFILE,
        id: 'fac-' + (staffEmail.split('@')[0] || 'coordinator'),
        email: staffEmail,
      };
      await saveUserProfileToFirestore(facultyUser);
      onLoginSuccess(facultyUser);
    }
  };

  // Real Google Sign-In with Firebase Auth
  const handleRealGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMsg('');
    try {
      const { profile } = await signInWithGoogleAuth('student');
      // If student is new or has generic name, open onboard dialog or login directly
      onLoginSuccess(profile);
    } catch (err: any) {
      console.warn('Firebase Google sign-in fallback triggered:', err);
      // Fallback: Open Google Account selector modal for local development
      setShowGoogleModal(true);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Google Sign-In with Custom Info (from modal)
  const handleGoogleSelect = (name: string, email: string, role: UserRole = 'student') => {
    setShowGoogleModal(false);
    if (role === 'admin') {
      const adminUser: UserProfile = { ...DEFAULT_ADMIN_PROFILE, name, email };
      onLoginSuccess(adminUser);
    } else if (role === 'faculty') {
      const facultyUser: UserProfile = { ...DEFAULT_COORDINATOR_PROFILE, name, email };
      onLoginSuccess(facultyUser);
    } else {
      // For student: open quick credentials prompt so user gets a real fresh profile
      setPendingGoogleUser({ name, email });
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      setOnboardRollNo(`2400100100${randomSuffix}`);
      setOnboardRegNo(`SRMS/2026/BTECH/CSE/${randomSuffix}`);
      setGoogleOnboardingOpen(true);
    }
  };

  // Finalize Google Student Setup
  const handleCompleteGoogleStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingGoogleUser) return;

    const studentUser: UserProfile = {
      id: `std-google-${Date.now()}`,
      name: pendingGoogleUser.name,
      email: pendingGoogleUser.email,
      role: 'student',
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(pendingGoogleUser.name)}`,
      identifier: onboardRollNo.trim(),
      universityRollNo: onboardRollNo.trim(),
      aktuRollNo: onboardRollNo.trim(),
      collegeRegNo: onboardRegNo.trim(),
      branch: onboardBranch,
      aktuCollegeCode: '010 (SRMS CET, Bareilly)',
      department: BRANCH_CONFIG[onboardBranch]?.name || 'Department of Computer Science & Engineering',
      degree: `B.Tech ${onboardBranch} • Sem V (3rd Year)`,
      cgpa: '8.50',
      institution: 'SRMS College of Engineering & Technology, Bareilly (AKTU Code: 010)',
    };

    saveRegisteredStudent(studentUser);
    await saveUserProfileToFirestore(studentUser);
    setGoogleOnboardingOpen(false);
    onLoginSuccess(studentUser);
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#131b2e] flex flex-col justify-between py-6 px-4">
      {/* Top Brand Bar */}
      <header className="w-full max-w-md mx-auto flex items-center justify-between pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#00288e] flex items-center justify-center text-white shadow-xs">
            <span className="material-symbols-outlined text-[24px]">school</span>
          </div>
          <div>
            <span className="text-base font-bold text-[#00288e] tracking-tight block leading-tight">
              SRMS Pariksha
            </span>
            <span className="text-[11px] text-[#757684]">Central Examination & Timetable Portal</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-mono text-[#00563a] bg-[#ECFDF5] border border-[#A7F3D0] px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse"></span>
          AKTU Code 010
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="w-full max-w-md mx-auto bg-white rounded-2xl border border-[#c4c5d5]/60 shadow-sm p-5 space-y-4">
        {/* Top Master Tabs: Student Portal vs Admin/Faculty */}
        <div className="grid grid-cols-2 p-1 bg-[#eaedff] rounded-xl text-xs font-semibold gap-1">
          <button
            type="button"
            onClick={() => {
              setPortalMode('student');
              setErrorMsg('');
            }}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              portalMode === 'student'
                ? 'bg-[#00288e] text-white shadow-xs font-bold'
                : 'text-[#444653] hover:text-[#131b2e]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">school</span>
            <span>Student Portal</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setPortalMode('admin_faculty');
              setErrorMsg('');
            }}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              portalMode === 'admin_faculty'
                ? 'bg-purple-800 text-white shadow-xs font-bold'
                : 'text-[#444653] hover:text-[#131b2e]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
            <span>Admin & Faculty Hub</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: STUDENT PORTAL (GOOGLE LOGIN + ROLL NO / REG NO)         */}
        {/* ============================================================== */}
        {portalMode === 'student' && (
          <div className="space-y-4">
            {/* Header / Subtitle */}
            <div className="space-y-0.5">
              <h1 className="text-base font-bold text-[#131b2e]">
                Student Examination & Timetable Access
              </h1>
              <p className="text-xs text-[#444653]">
                Sign in with Google or your University Roll Number and College Registration Number to view your fresh dashboard.
              </p>
            </div>

            {/* PRIMARY OPTION: Google Sign-In */}
            <button
              type="button"
              onClick={handleRealGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-[#c4c5d5] bg-white hover:bg-[#faf8ff] text-xs font-semibold text-[#131b2e] shadow-xs active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.36 7.35 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12c0 2.06.46 3.84 1.26 5.42l4.02-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>{isGoogleLoading ? 'Signing in with Google...' : 'Continue with Google Account'}</span>
            </button>

            <div className="flex items-center justify-between text-[11px] text-[#757684] px-1 -mt-1">
              <span>Testing without Google?</span>
              <button
                type="button"
                onClick={() => setShowGoogleModal(true)}
                className="text-[#00288e] hover:underline font-semibold cursor-pointer"
              >
                Choose or Create Test Student
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="h-px bg-[#c4c5d5]/50 flex-1" />
              <span className="text-[10px] text-[#757684] uppercase font-bold tracking-wider">
                Or Student Roll & Registration
              </span>
              <div className="h-px bg-[#c4c5d5]/50 flex-1" />
            </div>

            {/* Student Mode Switcher: Sign In vs Register New Student */}
            <div className="flex bg-[#f2f3ff] p-0.5 rounded-xl border border-[#c4c5d5]/50 text-xs">
              <button
                type="button"
                onClick={() => {
                  setStudentMode('signin');
                  setErrorMsg('');
                }}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  studentMode === 'signin'
                    ? 'bg-white text-[#00288e] shadow-xs'
                    : 'text-[#757684] hover:text-[#131b2e]'
                }`}
              >
                Sign In with Roll & Reg No
              </button>
              <button
                type="button"
                onClick={() => {
                  setStudentMode('register');
                  setErrorMsg('');
                }}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  studentMode === 'register'
                    ? 'bg-white text-[#00288e] shadow-xs'
                    : 'text-[#757684] hover:text-[#131b2e]'
                }`}
              >
                + Register New Student
              </button>
            </div>

            {/* Error / Success Alerts */}
            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Student Form */}
            <form onSubmit={handleStudentFormSubmit} className="space-y-3">
              {studentMode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-[#131b2e] mb-1">
                    Student Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#757684] text-[18px]">
                      person
                    </span>
                    <input
                      type="text"
                      value={studentFullName}
                      onChange={(e) => setStudentFullName(e.target.value)}
                      placeholder="e.g. Arun Kumar or Priya Sharma"
                      required
                      className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-[#c4c5d5] outline-none focus:border-[#00288e] bg-[#faf8ff]"
                    />
                  </div>
                </div>
              )}

              {/* University Roll Number */}
              <div>
                <label className="block text-xs font-semibold text-[#131b2e] mb-1">
                  AKTU University Roll Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#757684] text-[18px]">
                    badge
                  </span>
                  <input
                    type="text"
                    value={studentRollNo}
                    onChange={(e) => setStudentRollNo(e.target.value)}
                    placeholder="e.g. 2400100100084 (13 Digits)"
                    required
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-[#c4c5d5] outline-none focus:border-[#00288e] bg-[#faf8ff] font-mono"
                  />
                </div>
              </div>

              {/* College Registration Number */}
              <div>
                <label className="block text-xs font-semibold text-[#131b2e] mb-1">
                  SRMS College Registration / Admission Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#757684] text-[18px]">
                    app_registration
                  </span>
                  <input
                    type="text"
                    value={studentRegNo}
                    onChange={(e) => setStudentRegNo(e.target.value)}
                    placeholder="e.g. SRMS/2026/BTECH/CSE/084"
                    required
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-[#c4c5d5] outline-none focus:border-[#00288e] bg-[#faf8ff] font-mono"
                  />
                </div>
              </div>

              {/* Branch Selection (for Register or Custom sign in) */}
              {studentMode === 'register' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#131b2e] mb-1">
                      Academic Branch
                    </label>
                    <select
                      value={studentBranch}
                      onChange={(e) => setStudentBranch(e.target.value as CollegeBranch)}
                      className="w-full text-xs px-2.5 py-2 rounded-xl border border-[#c4c5d5] outline-none bg-[#faf8ff]"
                    >
                      {Object.keys(BRANCH_CONFIG).map((b) => (
                        <option key={b} value={b}>
                          {b} ({BRANCH_CONFIG[b as CollegeBranch].name.split('(')[0]})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#131b2e] mb-1">
                      Semester
                    </label>
                    <select
                      value={studentSemester}
                      onChange={(e) => setStudentSemester(e.target.value)}
                      className="w-full text-xs px-2.5 py-2 rounded-xl border border-[#c4c5d5] outline-none bg-[#faf8ff]"
                    >
                      <option value="Semester V (3rd Year)">Semester V (Odd)</option>
                      <option value="Semester VI (3rd Year)">Semester VI (Even)</option>
                      <option value="Semester III (2nd Year)">Semester III (Odd)</option>
                      <option value="Semester VII (4th Year)">Semester VII (Final)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Password / Student PIN */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#131b2e]">
                    Portal Security PIN / Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgotPasswordOpen(true)}
                    className="text-[11px] text-[#00288e] hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#757684] text-[18px]">
                    lock
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    placeholder="Enter student password or 6-digit PIN"
                    className="w-full text-xs pl-9 pr-9 py-2 rounded-xl border border-[#c4c5d5] outline-none focus:border-[#00288e] bg-[#faf8ff]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-[#757684] hover:text-[#131b2e]"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-[#00288e] hover:bg-[#1e40af] text-white text-xs font-bold shadow-xs active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {studentMode === 'register' ? 'how_to_reg' : 'login'}
                </span>
                <span>
                  {studentMode === 'register'
                    ? 'Register New Student & Enter Dashboard'
                    : 'Sign In to Fresh Dashboard'}
                </span>
              </button>
            </form>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: ADMINISTRATOR & FACULTY HUB                             */}
        {/* ============================================================== */}
        {portalMode === 'admin_faculty' && (
          <div className="space-y-4">
            {/* Header */}
            <div className="space-y-0.5">
              <h1 className="text-base font-bold text-purple-950">
                Institutional Staff & Administration Portal
              </h1>
              <p className="text-xs text-[#444653]">
                Authorized access for Principal, Academic Controllers, and Faculty Timetable Coordinators.
              </p>
            </div>

            {/* Quick Staff Role Selector */}
            <div className="grid grid-cols-2 p-1 bg-purple-50 rounded-xl border border-purple-200 text-xs font-semibold gap-1">
              <button
                type="button"
                onClick={() => setStaffRole('admin')}
                className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  staffRole === 'admin'
                    ? 'bg-purple-800 text-white shadow-xs font-bold'
                    : 'text-purple-900 hover:bg-purple-100'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">shield_person</span>
                <span>Administrator</span>
              </button>
              <button
                type="button"
                onClick={() => setStaffRole('faculty')}
                className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  staffRole === 'faculty'
                    ? 'bg-purple-800 text-white shadow-xs font-bold'
                    : 'text-purple-900 hover:bg-purple-100'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">co_present</span>
                <span>Faculty Coordinator</span>
              </button>
            </div>

            {/* 1-Click Fast Launch Demo Credentials for Admin */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-purple-900 uppercase tracking-wider">
                Instant Staff Quick Access:
              </div>

              {staffRole === 'admin' ? (
                <button
                  type="button"
                  onClick={() => onLoginSuccess(DEFAULT_ADMIN_PROFILE)}
                  className="w-full p-3 rounded-xl border-2 border-purple-400 bg-purple-50 hover:bg-purple-100 text-left transition-all cursor-pointer flex items-center gap-3 shadow-xs"
                >
                  <img
                    src={DEFAULT_ADMIN_PROFILE.avatarUrl}
                    alt={DEFAULT_ADMIN_PROFILE.name}
                    className="w-10 h-10 rounded-xl object-cover border border-purple-500 shadow-xs"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-purple-950 truncate">
                        {DEFAULT_ADMIN_PROFILE.name}
                      </span>
                      <span className="text-[10px] bg-purple-700 text-white px-2 py-0.5 rounded-full font-bold">
                        Chief Controller
                      </span>
                    </div>
                    <p className="text-[11px] text-purple-700 truncate">
                      {DEFAULT_ADMIN_PROFILE.designation}
                    </p>
                    <div className="text-[10px] text-purple-600 font-mono mt-0.5">
                      Full Timetable Builder & Collision Control Privileges
                    </div>
                  </div>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onLoginSuccess(DEFAULT_COORDINATOR_PROFILE)}
                  className="w-full p-3 rounded-xl border-2 border-blue-400 bg-blue-50 hover:bg-blue-100 text-left transition-all cursor-pointer flex items-center gap-3 shadow-xs"
                >
                  <img
                    src={DEFAULT_COORDINATOR_PROFILE.avatarUrl}
                    alt={DEFAULT_COORDINATOR_PROFILE.name}
                    className="w-10 h-10 rounded-xl object-cover border border-blue-500 shadow-xs"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-blue-950 truncate">
                        {DEFAULT_COORDINATOR_PROFILE.name}
                      </span>
                      <span className="text-[10px] bg-blue-700 text-white px-2 py-0.5 rounded-full font-bold">
                        Faculty
                      </span>
                    </div>
                    <p className="text-[11px] text-blue-700 truncate">
                      {DEFAULT_COORDINATOR_PROFILE.designation}
                    </p>
                    <div className="text-[10px] text-blue-600 font-mono mt-0.5">
                      Timetable Reviewer & Course Evaluator
                    </div>
                  </div>
                </button>
              )}
            </div>

            {/* Or custom staff credentials */}
            <div className="pt-2 border-t border-[#c4c5d5]/40 space-y-3">
              <div className="text-[11px] font-semibold text-[#444653]">
                Or enter institutional credentials:
              </div>

              <form onSubmit={handleStaffFormSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#131b2e] mb-1">
                    Institutional Email
                  </label>
                  <input
                    type="email"
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    placeholder="principal@srms.ac.in or coordinator@srms.ac.in"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-[#c4c5d5] outline-none bg-[#faf8ff]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#131b2e] mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-[#c4c5d5] outline-none bg-[#faf8ff]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-purple-800 hover:bg-purple-900 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Sign In to Staff Console
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* ============================================================== */}
      {/* GOOGLE ONBOARDING MODAL (FOR BRAND NEW STUDENT GOOGLE USERS)   */}
      {/* ============================================================== */}
      {googleOnboardingOpen && pendingGoogleUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-[#c4c5d5] space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-[#eaedff] text-[#00288e] flex items-center justify-center mx-auto text-xl font-bold">
                🎓
              </div>
              <h3 className="font-bold text-base text-[#131b2e]">
                Welcome, {pendingGoogleUser.name}!
              </h3>
              <p className="text-xs text-[#444653]">
                Please confirm your AKTU Roll No & College Registration Number to initialize your fresh student dashboard.
              </p>
            </div>

            <form onSubmit={handleCompleteGoogleStudent} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-[#444653] block mb-1">
                  AKTU University Roll Number:
                </label>
                <input
                  type="text"
                  value={onboardRollNo}
                  onChange={(e) => setOnboardRollNo(e.target.value)}
                  required
                  placeholder="e.g. 2400100100084"
                  className="w-full px-2.5 py-1.5 rounded-xl border border-[#c4c5d5] outline-none font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-[#444653] block mb-1">
                  College Registration Number:
                </label>
                <input
                  type="text"
                  value={onboardRegNo}
                  onChange={(e) => setOnboardRegNo(e.target.value)}
                  required
                  placeholder="e.g. SRMS/2026/BTECH/CSE/084"
                  className="w-full px-2.5 py-1.5 rounded-xl border border-[#c4c5d5] outline-none font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-[#444653] block mb-1">
                  Engineering Branch:
                </label>
                <select
                  value={onboardBranch}
                  onChange={(e) => setOnboardBranch(e.target.value as CollegeBranch)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-[#c4c5d5] outline-none"
                >
                  {Object.keys(BRANCH_CONFIG).map((b) => (
                    <option key={b} value={b}>
                      {b} ({BRANCH_CONFIG[b as CollegeBranch].name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setGoogleOnboardingOpen(false)}
                  className="flex-1 py-2 border border-[#c4c5d5] rounded-xl text-xs font-semibold text-[#444653] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#00288e] hover:bg-[#1e40af] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Enter Dashboard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TEST ACCOUNTS CHOOSER MODAL (OFFLINE / DEV ENVIRONMENT)        */}
      {/* ============================================================== */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-[#c4c5d5] space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#c4c5d5]/40 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00288e] text-[20px]">
                  account_circle
                </span>
                <h3 className="font-bold text-sm text-[#131b2e]">Choose Test Account</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="text-[#757684] hover:text-[#131b2e] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <p className="text-xs text-[#444653]">
              Select an account or click to create a brand new student profile:
            </p>

            <div className="space-y-2">
              {/* Profile A: New Student Priyanshu Sharma */}
              <button
                type="button"
                onClick={() => handleGoogleSelect('Priyanshu Sharma', 'priyanshu.sharma@srms.ac.in', 'student')}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/70 text-left transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  PS
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-emerald-950 truncate flex items-center justify-between">
                    <span>Priyanshu Sharma</span>
                    <span className="text-[9px] bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded font-semibold">New Student</span>
                  </div>
                  <div className="text-[11px] text-emerald-700 truncate">priyanshu.sharma@srms.ac.in • B.Tech CS1</div>
                </div>
              </button>

              {/* Profile B: New Student Tanya Verma */}
              <button
                type="button"
                onClick={() => handleGoogleSelect('Tanya Verma', 'tanya.verma@srms.ac.in', 'student')}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/70 text-left transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  TV
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-blue-950 truncate flex items-center justify-between">
                    <span>Tanya Verma</span>
                    <span className="text-[9px] bg-blue-200 text-blue-900 px-1.5 py-0.2 rounded font-semibold">New Student</span>
                  </div>
                  <div className="text-[11px] text-blue-700 truncate">tanya.verma@srms.ac.in • B.Tech AIML</div>
                </div>
              </button>

              {/* Profile C: Dr. Prabhakar Gupta (Admin) */}
              <button
                type="button"
                onClick={() => handleGoogleSelect(DEFAULT_ADMIN_PROFILE.name, DEFAULT_ADMIN_PROFILE.email, 'admin')}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100/70 text-left transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-purple-700 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  PG
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-purple-950 truncate flex items-center justify-between">
                    <span>Dr. Prabhakar Gupta</span>
                    <span className="text-[9px] bg-purple-200 text-purple-900 px-1.5 py-0.2 rounded font-semibold">Admin</span>
                  </div>
                  <div className="text-[11px] text-purple-700 truncate">principal@srms.ac.in • Timetable Controller</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {forgotPasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-[#c4c5d5] space-y-3">
            <div className="flex items-center justify-between border-b border-[#c4c5d5]/40 pb-2">
              <h3 className="font-bold text-sm text-[#131b2e] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#00288e] text-[18px]">lock_reset</span>
                Password Recovery
              </h3>
              <button
                type="button"
                onClick={() => {
                  setForgotPasswordOpen(false);
                  setResetSent(false);
                }}
                className="text-[#757684] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {resetSent ? (
              <div className="text-center py-3 space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined">mark_email_read</span>
                </div>
                <p className="text-xs font-bold text-[#065F46]">Security Reset Link Dispatched!</p>
                <p className="text-[11px] text-[#444653]">
                  A 6-digit OTP and reset link has been dispatched to your registered institutional address.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setForgotPasswordOpen(false);
                    setResetSent(false);
                  }}
                  className="w-full py-1.5 bg-[#00288e] text-white text-xs rounded-lg font-semibold mt-2 cursor-pointer"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-[#444653]">
                  Enter your registered AKTU Roll No or College Reg No to receive a secure credentials reset token.
                </p>
                <input
                  type="text"
                  placeholder="e.g. 2400100100084 or SRMS/2026/BTECH/CSE/084"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-[#c4c5d5] outline-none focus:border-[#00288e]"
                />
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setForgotPasswordOpen(false)}
                    className="flex-1 py-1.5 border border-[#c4c5d5] rounded-lg text-xs font-semibold text-[#444653] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setResetSent(true)}
                    className="flex-1 py-1.5 bg-[#00288e] text-white rounded-lg text-xs font-semibold hover:bg-[#1e40af] cursor-pointer"
                  >
                    Send Token
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
