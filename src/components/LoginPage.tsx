import React, { useState } from 'react';
import { UserProfile, UserRole, CollegeBranch, SubjectKey } from '../types';
import {
  signInWithGoogleAuth,
  saveUserProfileToFirestore,
  getUserProfileByRollNumber,
  getUserProfileByRegNumber,
  DEFAULT_ADMIN_PROFILE,
  DEFAULT_COORDINATOR_PROFILE,
} from '../services/firebase';
import { BRANCH_CONFIG } from '../data/srmsTimetable';
import { OFFICIAL_COLLEGE_FACULTIES, SUBJECT_DATA } from '../data/subjects';

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile) => void;
  onOpenAdmissionModal?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onOpenAdmissionModal }) => {
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

  // Google account selector / personal Google sign-in modal
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleCustomName, setGoogleCustomName] = useState('');
  const [googleCustomEmail, setGoogleCustomEmail] = useState('');
  const [googleCustomRoll, setGoogleCustomRoll] = useState('');
  const [googleCustomReg, setGoogleCustomReg] = useState('');
  const [googleCustomBranch, setGoogleCustomBranch] = useState<CollegeBranch>('CS1');
  const [googleModalError, setGoogleModalError] = useState('');

  const [googleOnboardingOpen, setGoogleOnboardingOpen] = useState(false);
  const [pendingGoogleUser, setPendingGoogleUser] = useState<{
    name: string;
    email: string;
    avatarUrl?: string;
  } | null>(null);

  // Google Student Onboarding extra fields
  const [onboardRollNo, setOnboardRollNo] = useState('');
  const [onboardRegNo, setOnboardRegNo] = useState('');
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

  // Faculty sub-mode: 'roster' | 'register' | 'credentials'
  const [facultySubMode, setFacultySubMode] = useState<'roster' | 'register' | 'credentials'>('roster');
  const [facultySearchQuery, setFacultySearchQuery] = useState('');
  const [facultySubjectFilter, setFacultySubjectFilter] = useState<string>('ALL');

  // Faculty Registration form fields
  const [newFacultyName, setNewFacultyName] = useState('');
  const [newFacultyEmpId, setNewFacultyEmpId] = useState('');
  const [newFacultyEmail, setNewFacultyEmail] = useState('');
  const [newFacultyDept, setNewFacultyDept] = useState('Department of Computer Science & Engineering');
  const [newFacultySubject, setNewFacultySubject] = useState<SubjectKey>('DAA');
  const [newFacultySemester, setNewFacultySemester] = useState('Semester V (3rd Year)');
  const [newFacultyDesignation, setNewFacultyDesignation] = useState('Associate Professor');
  const [newFacultyPassword, setNewFacultyPassword] = useState('');

  // Helper to retrieve saved custom faculties from localStorage
  const getRegisteredFaculties = (): UserProfile[] => {
    try {
      const data = localStorage.getItem('srms_registered_faculties');
      if (data) return JSON.parse(data);
    } catch {}
    return [];
  };

  // Helper to persist new faculty in localStorage
  const saveRegisteredFaculty = (faculty: UserProfile) => {
    try {
      const existing = getRegisteredFaculties();
      const updated = [faculty, ...existing.filter((f) => f.id !== faculty.id && f.identifier !== faculty.identifier)];
      localStorage.setItem('srms_registered_faculties', JSON.stringify(updated));
    } catch {}
  };

  // Handle Student Credentials Form Submit (Roll No & Reg No)
  const handleStudentFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanRoll = studentRollNo.trim();
    const cleanReg = studentRegNo.trim();
    const cleanName = studentFullName.trim();

    // 1. Strict Digits-Only Validation for University Roll Number
    if (!cleanRoll) {
      setErrorMsg('Authentication Error: Please enter your AKTU University Roll Number.');
      return;
    }
    if (!/^\d+$/.test(cleanRoll)) {
      setErrorMsg('Authentication Error: University Roll Number must contain digits only (0-9). Letters, symbols, and alphanumeric combinations are strictly prohibited.');
      return;
    }
    if (cleanRoll.length < 10 || cleanRoll.length > 14) {
      setErrorMsg('Authentication Error: University Roll Number must be between 10 and 14 digits (e.g. 2400100100084).');
      return;
    }

    // 2. Registration Number Check
    if (!cleanReg) {
      setErrorMsg('Authentication Error: Please enter your SRMS College Registration / Admission Number.');
      return;
    }

    if (studentMode === 'register') {
      // 3. Strict Characters-Only Validation for Full Name
      if (!cleanName) {
        setErrorMsg('Authentication Error: Please enter your full name for student registration.');
        return;
      }
      if (!/^[A-Za-z\s.]+$/.test(cleanName) || /\d/.test(cleanName)) {
        setErrorMsg('Authentication Error: Full Name must contain alphabetical characters only (A-Z, a-z). Numbers, digits, and alphanumeric combinations are strictly prohibited.');
        return;
      }
      if (cleanName.length < 3) {
        setErrorMsg('Authentication Error: Full Name must be at least 3 characters long.');
        return;
      }

      // Create brand new student profile (no fake CGPA or mock scores)
      const newStudent: UserProfile = {
        id: `std-${Date.now()}`,
        name: cleanName,
        email: studentEmail.trim() || `${cleanRoll.toLowerCase()}@srms.ac.in`,
        role: 'student',
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}`,
        identifier: cleanRoll,
        universityRollNo: cleanRoll,
        aktuRollNo: cleanRoll,
        collegeRegNo: cleanReg,
        branch: studentBranch,
        aktuCollegeCode: '010 (SRMS CET, Bareilly)',
        department: BRANCH_CONFIG[studentBranch]?.name || 'Department of Computer Science & Engineering',
        degree: `B.Tech ${studentBranch} • ${studentSemester}`,
        cgpa: 'Pending Evaluation',
        attendance: 'Active (100%)',
        institution: 'SRMS College of Engineering & Technology, Bareilly (AKTU Code: 010)',
      };

      saveRegisteredStudent(newStudent);
      await saveUserProfileToFirestore(newStudent);
      onLoginSuccess(newStudent);
    } else {
      // Sign-in mode: Check if existing student in local storage or Firestore
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
        onLoginSuccess(match);
      } else {
        // Fresh student initialization without fake marks
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
          cgpa: 'Pending Evaluation',
          attendance: 'Active (100%)',
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

    if (!staffPassword || staffPassword.trim().length < 4) {
      setErrorMsg('Please enter a valid institutional password (minimum 4 characters).');
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
      const allKnown = [...getRegisteredFaculties(), ...OFFICIAL_COLLEGE_FACULTIES];
      const match = allKnown.find(
        (f) =>
          f.email.toLowerCase() === staffEmail.trim().toLowerCase() ||
          f.identifier?.toLowerCase() === staffEmail.trim().toLowerCase() ||
          f.employeeId?.toLowerCase() === staffEmail.trim().toLowerCase()
      );

      if (match) {
        onLoginSuccess(match);
      } else {
        const rawPrefix = staffEmail.split('@')[0] || 'faculty';
        const formattedName = 'Prof. ' + rawPrefix.replace('.', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        const facultyUser: UserProfile = {
          ...DEFAULT_COORDINATOR_PROFILE,
          id: 'fac-' + rawPrefix + '-' + Date.now(),
          name: formattedName,
          email: staffEmail.includes('@') ? staffEmail : `${staffEmail}@srms.ac.in`,
          identifier: staffEmail.toUpperCase(),
          employeeId: staffEmail.toUpperCase(),
          designation: 'Assistant Professor & Course Evaluator',
          primarySubject: 'DAA',
          teachingSemester: 'Semester V (3rd Year)',
        };
        saveRegisteredFaculty(facultyUser);
        await saveUserProfileToFirestore(facultyUser);
        onLoginSuccess(facultyUser);
      }
    }
  };

  // Handle Faculty Registration
  const handleFacultyRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanName = newFacultyName.trim();
    const cleanEmpId = newFacultyEmpId.trim();
    const cleanEmail = newFacultyEmail.trim().toLowerCase();

    // 1. Strict Alphabetical Validation for Name (Letters only, NO digits)
    if (!cleanName || !/^[A-Za-z\s.'-]+$/.test(cleanName) || /\d/.test(cleanName)) {
      setErrorMsg('Authentication Error: Faculty Full Name must contain alphabetical characters only (A-Z, a-z). Numbers are strictly prohibited.');
      return;
    }
    if (cleanName.length < 3) {
      setErrorMsg('Authentication Error: Please enter a valid name (minimum 3 characters).');
      return;
    }

    // 2. Employee ID Validation
    if (!cleanEmpId) {
      setErrorMsg('Authentication Error: Please enter your Faculty Employee ID (e.g. SRMS-FAC-102).');
      return;
    }

    // 3. Email Validation
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMsg('Authentication Error: Please enter a valid institutional email address.');
      return;
    }

    // 4. Password Validation
    if (!newFacultyPassword || newFacultyPassword.trim().length < 4) {
      setErrorMsg('Authentication Error: Password must be at least 4 characters.');
      return;
    }

    const facultyUser: UserProfile = {
      id: `fac-${cleanEmpId.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`,
      name: cleanName.startsWith('Dr.') || cleanName.startsWith('Prof.') ? cleanName : `Prof. ${cleanName}`,
      email: cleanEmail,
      role: 'faculty',
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}`,
      identifier: cleanEmpId,
      employeeId: cleanEmpId,
      department: newFacultyDept,
      designation: newFacultyDesignation,
      primarySubject: newFacultySubject,
      teachingSemester: newFacultySemester,
      institution: 'SRMS College of Engineering & Technology, Bareilly (AKTU Code: 010)',
    };

    saveRegisteredFaculty(facultyUser);
    await saveUserProfileToFirestore(facultyUser);
    setSuccessMsg(`Welcome, ${facultyUser.name}! Profile registered successfully.`);
    setTimeout(() => {
      onLoginSuccess(facultyUser);
    }, 350);
  };

  // Real Google Sign-In with Firebase Auth
  const handleRealGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMsg('');
    try {
      const { profile } = await signInWithGoogleAuth('student');
      if (profile && profile.name && profile.email && !profile.name.includes('Enrolled Student')) {
        onLoginSuccess(profile);
        return;
      }
    } catch (err: any) {
      console.warn('Firebase Google sign-in fallback triggered:', err);
    } finally {
      setIsGoogleLoading(false);
    }
    // Fallback: Open Google Account dialog for personal account sign-in
    setShowGoogleModal(true);
  };

  // Submit custom real Google details
  const handleCustomGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGoogleModalError('');

    const cleanName = googleCustomName.trim();
    const cleanEmail = googleCustomEmail.trim().toLowerCase();
    const cleanRoll = googleCustomRoll.trim();
    const cleanReg = googleCustomReg.trim();

    // 1. Strict Alphabetical Validation for Name
    if (!cleanName || !/^[A-Za-z\s.]+$/.test(cleanName) || /\d/.test(cleanName)) {
      setGoogleModalError('Authentication Error: Full Name must contain alphabetical characters only (A-Z, a-z). Numbers are strictly prohibited.');
      return;
    }
    if (cleanName.length < 3) {
      setGoogleModalError('Authentication Error: Please enter a valid name (minimum 3 characters).');
      return;
    }

    // 2. Email Validation
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setGoogleModalError('Authentication Error: Please enter a valid Google/Gmail address.');
      return;
    }

    // 3. Strict Digits-Only Validation for University Roll Number
    if (!cleanRoll || !/^\d+$/.test(cleanRoll)) {
      setGoogleModalError('Authentication Error: University Roll Number must contain digits only (0-9). Letters or alphanumeric values are strictly prohibited.');
      return;
    }
    if (cleanRoll.length < 10 || cleanRoll.length > 14) {
      setGoogleModalError('Authentication Error: University Roll Number must be between 10 and 14 digits (e.g. 2400100100084).');
      return;
    }

    const regNo = cleanReg || `SRMS/2026/BTECH/${googleCustomBranch}/${cleanRoll.slice(-3) || '001'}`;

    const studentUser: UserProfile = {
      id: `std-google-${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      role: 'student',
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}`,
      identifier: cleanRoll,
      universityRollNo: cleanRoll,
      aktuRollNo: cleanRoll,
      collegeRegNo: regNo,
      branch: googleCustomBranch,
      aktuCollegeCode: '010 (SRMS CET, Bareilly)',
      department: BRANCH_CONFIG[googleCustomBranch]?.name || 'Department of Computer Science & Engineering',
      degree: `B.Tech ${googleCustomBranch} • Sem V (3rd Year)`,
      cgpa: 'Pending Evaluation',
      attendance: 'Active (100%)',
      institution: 'SRMS College of Engineering & Technology, Bareilly (AKTU Code: 010)',
    };

    saveRegisteredStudent(studentUser);
    await saveUserProfileToFirestore(studentUser);
    setShowGoogleModal(false);
    onLoginSuccess(studentUser);
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
        <div className="flex items-center gap-1.5">
          {onOpenAdmissionModal && (
            <button
              type="button"
              onClick={onOpenAdmissionModal}
              className="flex items-center gap-1 text-[11px] font-bold text-[#00288e] bg-[#eaedff] hover:bg-[#dbe1ff] border border-[#c4c5d5]/80 px-2.5 py-1 rounded-full transition-all active:scale-95 cursor-pointer shadow-2xs"
              title="College Admissions, Fees, Documents & Contacts"
            >
              <span className="material-symbols-outlined text-[14px] text-amber-600">account_balance</span>
              <span className="hidden sm:inline">Admissions</span>
              <span>2025–26</span>
            </button>
          )}
          <div className="flex items-center gap-1 text-[11px] font-mono text-[#00563a] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse"></span>
            AKTU 010
          </div>
        </div>
      </header>

      {/* College Admissions, Pre-Registration & Helplines Fast-Access Banner */}
      {onOpenAdmissionModal && (
        <div className="w-full max-w-md mx-auto mb-3">
          <button
            type="button"
            onClick={onOpenAdmissionModal}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-[#00288e] via-[#001f70] to-[#001448] text-white shadow-md hover:shadow-lg transition-all active:scale-[0.99] border border-blue-900 group cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-400 text-[#001448] flex items-center justify-center flex-shrink-0 font-bold shadow-xs">
                <span className="material-symbols-outlined text-[20px]">account_balance</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white tracking-tight truncate">
                    College Admission & Pre-Registration
                  </span>
                  <span className="text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-1.5 py-0.2 rounded font-bold uppercase flex-shrink-0">
                    2025–26
                  </span>
                </div>
                <span className="text-[10px] text-blue-200 block leading-tight mt-0.5 truncate">
                  Documents, Fee Structures, Helplines & Official srms.ac.in/cet
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex-shrink-0 group-hover:bg-amber-400 group-hover:text-[#001448] transition-colors ml-2">
              <span>Details</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </div>
          </button>
        </div>
      )}

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
              <span>Localhost or popup blocked?</span>
              <button
                type="button"
                onClick={() => setShowGoogleModal(true)}
                className="text-[#00288e] hover:underline font-semibold cursor-pointer"
              >
                Sign In with Your Google Details
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-[#131b2e]">
                      Student Full Name <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono font-medium">
                      Letters Only (A-Z)
                    </span>
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#757684] text-[18px]">
                      person
                    </span>
                    <input
                      type="text"
                      value={studentFullName}
                      onChange={(e) => {
                        const sanitized = e.target.value.replace(/[^A-Za-z\s.]/g, '');
                        setStudentFullName(sanitized);
                        if (e.target.value !== sanitized) {
                          setErrorMsg('Full Name accepts alphabetical characters only (A-Z, a-z). Numbers and symbols are prohibited.');
                        } else {
                          setErrorMsg('');
                        }
                      }}
                      placeholder="e.g. Arun Kumar (Alphabetical characters only)"
                      required
                      className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-[#c4c5d5] outline-none focus:border-[#00288e] bg-[#faf8ff]"
                    />
                  </div>
                  <p className="text-[10px] text-[#757684] mt-1">
                    Strict Authentication: No digits or alphanumeric values allowed.
                  </p>
                </div>
              )}

              {/* University Roll Number */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#131b2e]">
                    AKTU University Roll Number <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono font-medium">
                    Digits Only (0-9)
                  </span>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#757684] text-[18px]">
                    badge
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={14}
                    value={studentRollNo}
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/\D/g, '');
                      setStudentRollNo(digitsOnly);
                      if (e.target.value !== digitsOnly) {
                        setErrorMsg('Roll Number accepts digits only (0-9). Letters and alphanumeric combinations are strictly prohibited.');
                      } else {
                        setErrorMsg('');
                      }
                    }}
                    placeholder="e.g. 2400100100084 (Digits only)"
                    required
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-[#c4c5d5] outline-none focus:border-[#00288e] bg-[#faf8ff] font-mono tracking-wider"
                  />
                </div>
                <p className="text-[10px] text-[#757684] mt-1">
                  Strict Authentication: 10 to 14 digits only. No letters or symbols allowed.
                </p>
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
                    onChange={(e) => setStudentRegNo(e.target.value.toUpperCase())}
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
                <span>College Faculty ({[...getRegisteredFaculties(), ...OFFICIAL_COLLEGE_FACULTIES].length})</span>
              </button>
            </div>

            {/* ADMINISTRATOR PORTAL VIEW */}
            {staffRole === 'admin' ? (
              <div className="space-y-3">
                <div className="text-[11px] font-bold text-purple-900 uppercase tracking-wider">
                  Chief Academic Controller Quick Launch:
                </div>

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

                {/* Custom Admin Credentials */}
                <div className="pt-2 border-t border-[#c4c5d5]/40 space-y-3">
                  <div className="text-[11px] font-semibold text-[#444653]">
                    Or enter administrator credentials:
                  </div>

                  <form onSubmit={handleStaffFormSubmit} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#131b2e] mb-1">
                        Administrator Email
                      </label>
                      <input
                        type="email"
                        value={staffEmail}
                        onChange={(e) => setStaffEmail(e.target.value)}
                        placeholder="principal@srms.ac.in"
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
                      Sign In to Administrator Console
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              /* ========================================================== */
              /* COLLEGE FACULTY PORTAL (ALL SUBJECTS & SEMESTERS)          */
              /* ========================================================== */
              <div className="space-y-3">
                {/* Faculty Sub-Navigation Switcher */}
                <div className="grid grid-cols-3 p-1 bg-[#eaedff] rounded-xl text-xs font-semibold gap-1">
                  <button
                    type="button"
                    onClick={() => setFacultySubMode('roster')}
                    className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      facultySubMode === 'roster'
                        ? 'bg-[#00288e] text-white shadow-xs font-bold'
                        : 'text-[#444653] hover:text-[#00288e]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">group</span>
                    <span>Faculty Roster</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFacultySubMode('register')}
                    className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      facultySubMode === 'register'
                        ? 'bg-[#00288e] text-white shadow-xs font-bold'
                        : 'text-[#444653] hover:text-[#00288e]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">person_add</span>
                    <span>New Faculty</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFacultySubMode('credentials')}
                    className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      facultySubMode === 'credentials'
                        ? 'bg-[#00288e] text-white shadow-xs font-bold'
                        : 'text-[#444653] hover:text-[#00288e]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">badge</span>
                    <span>Employee Sign In</span>
                  </button>
                </div>

                {/* Sub-Mode 1: Faculty Directory & 1-Click Launch */}
                {facultySubMode === 'roster' && (() => {
                  const allFacultyList = [...getRegisteredFaculties(), ...OFFICIAL_COLLEGE_FACULTIES];
                  const filtered = allFacultyList.filter((fac) => {
                    if (facultySubjectFilter !== 'ALL' && fac.primarySubject !== facultySubjectFilter) {
                      return false;
                    }
                    if (facultySearchQuery.trim()) {
                      const q = facultySearchQuery.toLowerCase();
                      return (
                        fac.name.toLowerCase().includes(q) ||
                        fac.department.toLowerCase().includes(q) ||
                        (fac.primarySubject && fac.primarySubject.toLowerCase().includes(q)) ||
                        (fac.identifier && fac.identifier.toLowerCase().includes(q))
                      );
                    }
                    return true;
                  });

                  return (
                    <div className="space-y-2.5">
                      {/* Search Bar */}
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#757684] text-[18px]">
                          search
                        </span>
                        <input
                          type="text"
                          value={facultySearchQuery}
                          onChange={(e) => setFacultySearchQuery(e.target.value)}
                          placeholder="Search faculty by name, subject (DAA, DBMS, WT, MLT), or Emp ID..."
                          className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-[#c4c5d5] outline-none bg-[#faf8ff] focus:border-[#00288e]"
                        />
                      </div>

                      {/* Subject Filter Chips */}
                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                        {['ALL', 'DAA', 'DBMS', 'WT', 'MLT', 'DA', 'COI'].map((sub) => (
                          <button
                            key={sub}
                            type="button"
                            onClick={() => setFacultySubjectFilter(sub)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
                              facultySubjectFilter === sub
                                ? 'bg-[#00288e] text-white shadow-xs'
                                : 'bg-[#f2f3ff] text-[#444653] hover:bg-[#eaedff]'
                            }`}
                          >
                            {sub === 'ALL' ? 'All Subjects' : sub}
                          </button>
                        ))}
                      </div>

                      {/* Faculty Cards Grid */}
                      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                        {filtered.length === 0 ? (
                          <div className="p-4 bg-slate-50 border border-dashed border-[#c4c5d5] rounded-xl text-center text-xs text-[#757684]">
                            No faculty members match your filter. You can register a new faculty using the tab above.
                          </div>
                        ) : (
                          filtered.map((faculty) => {
                            const isRegisteredCustom = !OFFICIAL_COLLEGE_FACULTIES.some((o) => o.id === faculty.id);

                            return (
                              <div
                                key={faculty.id}
                                className="p-3 rounded-xl border border-[#c4c5d5]/80 bg-white hover:border-[#00288e] transition-all shadow-xs flex items-center justify-between gap-3"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <img
                                    src={faculty.avatarUrl}
                                    alt={faculty.name}
                                    className="w-11 h-11 rounded-xl object-cover border border-[#c4c5d5] shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <h4 className="font-bold text-xs text-[#131b2e] truncate">
                                        {faculty.name}
                                      </h4>
                                      {faculty.primarySubject && (
                                        <span className="text-[10px] bg-[#eaedff] text-[#00288e] font-bold px-1.5 py-0.2 rounded font-mono">
                                          {faculty.primarySubject}
                                        </span>
                                      )}
                                      {isRegisteredCustom && (
                                        <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full">
                                          Registered
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-[#444653] truncate mt-0.5">
                                      {faculty.designation}
                                    </p>
                                    <div className="text-[10px] text-[#757684] truncate">
                                      {faculty.teachingSemester || 'All Semesters'} • ID: {faculty.identifier}
                                    </div>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => onLoginSuccess(faculty)}
                                  className="px-3 py-1.5 bg-[#00288e] hover:bg-[#1e40af] text-white text-xs font-bold rounded-lg shadow-xs transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                                >
                                  <span>Sign In</span>
                                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Sub-Mode 2: Register New Faculty */}
                {facultySubMode === 'register' && (
                  <form onSubmit={handleFacultyRegister} className="space-y-3 bg-white p-3.5 rounded-2xl border border-[#c4c5d5]/80 shadow-xs text-xs">
                    <div className="border-b border-[#c4c5d5]/40 pb-2">
                      <h3 className="font-bold text-xs text-[#131b2e]">
                        Register College Faculty (Any Subject & Any Semester)
                      </h3>
                      <p className="text-[11px] text-[#757684]">
                        Create your official SRMS instructor profile to upload lectures, tutorial videos, and PYQs.
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-[#131b2e]">
                          Faculty Full Name <span className="text-red-500">*</span>
                        </label>
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-mono font-medium">
                          Letters Only (A-Z)
                        </span>
                      </div>
                      <input
                        type="text"
                        value={newFacultyName}
                        onChange={(e) => {
                          const sanitized = e.target.value.replace(/[^A-Za-z\s.'-]/g, '');
                          setNewFacultyName(sanitized);
                          if (e.target.value !== sanitized) {
                            setErrorMsg('Faculty Name accepts alphabetical characters only. Numbers and symbols are prohibited.');
                          } else {
                            setErrorMsg('');
                          }
                        }}
                        placeholder="e.g. Dr. Ramesh Chandra (Letters only)"
                        required
                        className="w-full px-3 py-2 rounded-xl border border-[#c4c5d5] outline-none bg-[#faf8ff] focus:border-[#00288e]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-semibold text-[#131b2e] block mb-1">
                          Faculty Employee ID <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={newFacultyEmpId}
                          onChange={(e) => setNewFacultyEmpId(e.target.value.toUpperCase())}
                          placeholder="e.g. SRMS-FAC-CSE-09"
                          required
                          className="w-full px-3 py-2 rounded-xl border border-[#c4c5d5] outline-none bg-[#faf8ff] font-mono"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-[#131b2e] block mb-1">
                          Institutional Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={newFacultyEmail}
                          onChange={(e) => setNewFacultyEmail(e.target.value)}
                          placeholder="e.g. ramesh.c@srms.ac.in"
                          required
                          className="w-full px-3 py-2 rounded-xl border border-[#c4c5d5] outline-none bg-[#faf8ff]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-semibold text-[#131b2e] block mb-1">
                          Primary Teaching Subject <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={newFacultySubject}
                          onChange={(e) => setNewFacultySubject(e.target.value as SubjectKey)}
                          className="w-full px-2.5 py-2 rounded-xl border border-[#c4c5d5] outline-none bg-[#faf8ff]"
                        >
                          <option value="DAA">DAA - Algorithms (BCS 503)</option>
                          <option value="DBMS">DBMS - Databases (BCC 501)</option>
                          <option value="WT">WT - Web Technology (BCS 502)</option>
                          <option value="MLT">MLT - Machine Learning (bcs055)</option>
                          <option value="DA">DA - Data Analytics (Bcs052)</option>
                          <option value="COI">COI - Constitution of India (BNC 501)</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-semibold text-[#131b2e] block mb-1">
                          Teaching Semester <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={newFacultySemester}
                          onChange={(e) => setNewFacultySemester(e.target.value)}
                          className="w-full px-2.5 py-2 rounded-xl border border-[#c4c5d5] outline-none bg-[#faf8ff]"
                        >
                          <option value="Semester I (1st Year)">Semester I (1st Year)</option>
                          <option value="Semester II (1st Year)">Semester II (1st Year)</option>
                          <option value="Semester III (2nd Year)">Semester III (2nd Year)</option>
                          <option value="Semester IV (2nd Year)">Semester IV (2nd Year)</option>
                          <option value="Semester V (3rd Year)">Semester V (3rd Year)</option>
                          <option value="Semester VI (3rd Year)">Semester VI (3rd Year)</option>
                          <option value="Semester VII (4th Year)">Semester VII (4th Year)</option>
                          <option value="Semester VIII (4th Year)">Semester VIII (4th Year)</option>
                          <option value="All Semesters">All Semesters (Dept Wide)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-semibold text-[#131b2e] block mb-1">
                          Department
                        </label>
                        <select
                          value={newFacultyDept}
                          onChange={(e) => setNewFacultyDept(e.target.value)}
                          className="w-full px-2.5 py-2 rounded-xl border border-[#c4c5d5] outline-none bg-[#faf8ff] text-[11px]"
                        >
                          <option value="Department of Computer Science & Engineering">CSE</option>
                          <option value="Department of Information Technology">IT</option>
                          <option value="Department of Artificial Intelligence & Machine Learning">AIML</option>
                          <option value="Department of Electronics & Communication">ECE</option>
                          <option value="Department of Electrical & Electronics">EN</option>
                          <option value="Department of Mechanical Engineering">ME</option>
                          <option value="Department of Humanities & Social Sciences">Humanities</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-semibold text-[#131b2e] block mb-1">
                          Designation
                        </label>
                        <select
                          value={newFacultyDesignation}
                          onChange={(e) => setNewFacultyDesignation(e.target.value)}
                          className="w-full px-2.5 py-2 rounded-xl border border-[#c4c5d5] outline-none bg-[#faf8ff]"
                        >
                          <option value="Professor">Professor</option>
                          <option value="Associate Professor">Associate Professor</option>
                          <option value="Assistant Professor">Assistant Professor</option>
                          <option value="Guest Lecturer">Guest Lecturer</option>
                          <option value="Lab Incharge">Lab Incharge</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="font-semibold text-[#131b2e] block mb-1">
                        Account Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={newFacultyPassword}
                        onChange={(e) => setNewFacultyPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        className="w-full px-3 py-2 rounded-xl border border-[#c4c5d5] outline-none bg-[#faf8ff]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 rounded-xl bg-[#00288e] hover:bg-[#1e40af] text-white font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                      <span>Register Faculty & Enter Console</span>
                    </button>
                  </form>
                )}

                {/* Sub-Mode 3: Custom Login with Employee ID or Email */}
                {facultySubMode === 'credentials' && (
                  <form onSubmit={handleStaffFormSubmit} className="space-y-3 bg-white p-3.5 rounded-2xl border border-[#c4c5d5]/80 shadow-xs text-xs">
                    <div className="border-b border-[#c4c5d5]/40 pb-2">
                      <h3 className="font-bold text-xs text-[#131b2e]">
                        Faculty Sign In with Employee Credentials
                      </h3>
                      <p className="text-[11px] text-[#757684]">
                        Enter your registered SRMS Employee ID or institutional email to access your console.
                      </p>
                    </div>

                    <div>
                      <label className="block font-semibold text-[#131b2e] mb-1">
                        Faculty Employee ID or Email
                      </label>
                      <input
                        type="text"
                        value={staffEmail}
                        onChange={(e) => setStaffEmail(e.target.value)}
                        placeholder="e.g. SRMS-FAC-DAA-101 or alok.verma@srms.ac.in"
                        required
                        className="w-full px-3 py-2 rounded-xl border border-[#c4c5d5] outline-none bg-[#faf8ff] font-mono text-xs focus:border-[#00288e]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#131b2e] mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        value={staffPassword}
                        onChange={(e) => setStaffPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        className="w-full px-3 py-2 rounded-xl border border-[#c4c5d5] outline-none bg-[#faf8ff] text-xs focus:border-[#00288e]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-[#00288e] hover:bg-[#1e40af] text-white font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">login</span>
                      <span>Sign In to Faculty Console</span>
                    </button>
                  </form>
                )}
              </div>
            )}
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
      {/* GOOGLE ACCOUNT SIGN-IN MODAL (AUTHENTIC PERSONAL LOGIN)         */}
      {/* ============================================================== */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-[#c4c5d5] space-y-4">
            <div className="flex items-center justify-between border-b border-[#c4c5d5]/40 pb-2.5">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
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
                <h3 className="font-bold text-sm text-[#131b2e]">
                  Sign In with Your Google Account
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowGoogleModal(false);
                  setGoogleModalError('');
                }}
                className="text-[#757684] hover:text-[#131b2e] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <p className="text-xs text-[#444653]">
              Enter your own personal Google name & Gmail address to enter your personalized dashboard:
            </p>

            {googleModalError && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{googleModalError}</span>
              </div>
            )}

            <form onSubmit={handleCustomGoogleSubmit} className="space-y-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-[#131b2e]">
                    Your Full Name <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-mono font-medium">
                    Letters Only (A-Z)
                  </span>
                </div>
                <input
                  type="text"
                  value={googleCustomName}
                  onChange={(e) => {
                    const sanitized = e.target.value.replace(/[^A-Za-z\s.]/g, '');
                    setGoogleCustomName(sanitized);
                    if (e.target.value !== sanitized) {
                      setGoogleModalError('Full Name accepts alphabetical characters only. Numbers and alphanumeric combinations are strictly prohibited.');
                    } else {
                      setGoogleModalError('');
                    }
                  }}
                  placeholder="e.g. Arun Sharma (Your real name)"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-[#c4c5d5] outline-none focus:border-[#00288e] bg-[#faf8ff]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#131b2e] block mb-1">
                  Your Google / Gmail Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={googleCustomEmail}
                  onChange={(e) => setGoogleCustomEmail(e.target.value)}
                  placeholder="e.g. yourname@gmail.com"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-[#c4c5d5] outline-none focus:border-[#00288e] bg-[#faf8ff]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-[#131b2e]">
                    AKTU University Roll Number <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-mono font-medium">
                    Digits Only (0-9)
                  </span>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={14}
                  value={googleCustomRoll}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '');
                    setGoogleCustomRoll(digits);
                    if (e.target.value !== digits) {
                      setGoogleModalError('Roll Number accepts digits only (0-9). Letters and symbols are prohibited.');
                    } else {
                      setGoogleModalError('');
                    }
                  }}
                  placeholder="e.g. 2400100100084 (10-14 digits)"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-[#c4c5d5] outline-none focus:border-[#00288e] bg-[#faf8ff] font-mono tracking-wider"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-[#131b2e] block mb-1">
                    Branch
                  </label>
                  <select
                    value={googleCustomBranch}
                    onChange={(e) => setGoogleCustomBranch(e.target.value as CollegeBranch)}
                    className="w-full px-2.5 py-2 rounded-xl border border-[#c4c5d5] outline-none bg-[#faf8ff]"
                  >
                    {Object.keys(BRANCH_CONFIG).map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-[#131b2e] block mb-1">
                    College Reg No (Optional)
                  </label>
                  <input
                    type="text"
                    value={googleCustomReg}
                    onChange={(e) => setGoogleCustomReg(e.target.value.toUpperCase())}
                    placeholder="SRMS/2026/..."
                    className="w-full px-2.5 py-2 rounded-xl border border-[#c4c5d5] outline-none bg-[#faf8ff] font-mono text-[11px]"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowGoogleModal(false);
                    setGoogleModalError('');
                  }}
                  className="flex-1 py-2 border border-[#c4c5d5] rounded-xl text-xs font-semibold text-[#444653] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#00288e] hover:bg-[#1e40af] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Sign In</span>
                  <span className="material-symbols-outlined text-[15px]">login</span>
                </button>
              </div>
            </form>
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
