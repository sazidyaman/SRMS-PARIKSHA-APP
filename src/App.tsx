import React, { useState, useEffect } from 'react';
import {
  SubjectKey,
  TabType,
  UserProfile,
  Tutorial,
  PreviousYearQuestion,
  TimetableSlot,
  AnnouncementItem,
  UserRole,
  LeaveApplication,
  LeaveStatus,
} from './types';
import { ScheduleScreen } from './components/ScheduleScreen';
import { SecurityCheckScreen } from './components/SecurityCheckScreen';
import { LiveExamScreen } from './components/LiveExamScreen';
import { ResultsScreen } from './components/ResultsScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { BottomNav } from './components/BottomNav';
import { LoginPage } from './components/LoginPage';
import { FacultyDashboard } from './components/FacultyDashboard';
import { ResourcesScreen } from './components/ResourcesScreen';
import { AdmitCardPDFModal } from './components/AdmitCardPDFModal';
import { GoogleDriveScreen } from './components/GoogleDriveScreen';
import { AssistantScreen } from './components/AssistantScreen';
import { TimetableScreen } from './components/TimetableScreen';
import { AdminDashboard } from './components/AdminDashboard';
import { AvatarPickerModal } from './components/AvatarPickerModal';
import { LeaveApplicationModal } from './components/LeaveApplicationModal';
import { DEFAULT_TUTORIALS, DEFAULT_PYQS } from './data/subjects';
import {
  OFFICIAL_SRMS_TIMETABLE,
  DEFAULT_ANNOUNCEMENTS,
  DEFAULT_LEAVE_APPLICATIONS,
} from './data/srmsTimetable';
import {
  saveUserProfileToFirestore,
  saveResourceToFirestore,
  subscribeToResources,
  signOutFromFirebase,
  subscribeToAuthChanges,
  getUserProfileFromFirestore,
  DEFAULT_ADMIN_PROFILE,
  DEFAULT_COORDINATOR_PROFILE,
} from './services/firebase';

export default function App() {
  // Authentication State: loads saved authenticated session or presents Login Page
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('srms_current_user');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    try {
      const savedTab = localStorage.getItem('srms_active_tab') as TabType;
      if (savedTab) return savedTab;
    } catch {}
    return currentUser?.role === 'faculty' ? 'faculty_portal' : 'schedule';
  });

  const [selectedSubject, setSelectedSubject] = useState<SubjectKey>(() => {
    try {
      const savedSubject = localStorage.getItem('srms_selected_subject') as SubjectKey;
      if (savedSubject) return savedSubject;
    } catch {}
    return 'DAA';
  });

  const [hasLaunchedExam, setHasLaunchedExam] = useState(() => {
    try {
      return localStorage.getItem('srms_has_launched_exam') === 'true';
    } catch {}
    return false;
  });

  const [showAdmitCardPDF, setShowAdmitCardPDF] = useState(false);

  // Synchronize navigation state with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('srms_active_tab', activeTab);
    } catch {}
  }, [activeTab]);

  useEffect(() => {
    try {
      localStorage.setItem('srms_selected_subject', selectedSubject);
    } catch {}
  }, [selectedSubject]);

  useEffect(() => {
    try {
      localStorage.setItem('srms_has_launched_exam', String(hasLaunchedExam));
    } catch {}
  }, [hasLaunchedExam]);

  // College Timetable State (with automatic version migration to ensure all 294 slots load)
  const TIMETABLE_VERSION = 'v2_mon_fri_all_branches';
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>(() => {
    try {
      const ver = localStorage.getItem('srms_timetable_version');
      if (ver === TIMETABLE_VERSION) {
        const saved = localStorage.getItem('srms_timetable_slots');
        if (saved) return JSON.parse(saved);
      } else {
        // Automatically hydrate fresh 294 collision-free slots
        localStorage.setItem('srms_timetable_version', TIMETABLE_VERSION);
        localStorage.setItem('srms_timetable_slots', JSON.stringify(OFFICIAL_SRMS_TIMETABLE));
        return OFFICIAL_SRMS_TIMETABLE;
      }
    } catch {}
    return OFFICIAL_SRMS_TIMETABLE;
  });

  // Student Leave Applications State (with localStorage persistence)
  const [leaveApplications, setLeaveApplications] = useState<LeaveApplication[]>(() => {
    try {
      const saved = localStorage.getItem('srms_leave_applications');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_LEAVE_APPLICATIONS;
  });

  // Modals state for Avatar & Leave Application
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('srms_leave_applications', JSON.stringify(leaveApplications));
    } catch {}
  }, [leaveApplications]);

  const handleApplyLeave = (newApp: LeaveApplication) => {
    setLeaveApplications((prev) => [newApp, ...prev]);
  };

  const handleUpdateLeaveStatus = (
    id: string,
    status: LeaveStatus,
    remarks: string,
    reviewerName: string
  ) => {
    setLeaveApplications((prev) =>
      prev.map((app) =>
        app.id === id
          ? {
              ...app,
              status,
              facultyRemarks: remarks,
              approvedBy: reviewerName,
              reviewedAt: new Date().toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
              }),
            }
          : app
      )
    );
  };

  const handleUpdateAvatar = (newAvatarUrl: string) => {
    if (!currentUser) return;
    const updatedUser: UserProfile = {
      ...currentUser,
      avatarUrl: newAvatarUrl,
    };
    setCurrentUser(updatedUser);
    saveUserProfileToFirestore(updatedUser);
    try {
      localStorage.setItem('srms_current_user', JSON.stringify(updatedUser));
      // Also update in registered students list if student
      if (currentUser.role === 'student') {
        const savedList = localStorage.getItem('srms_registered_students');
        if (savedList) {
          const list: UserProfile[] = JSON.parse(savedList);
          const updatedList = list.map((s) => (s.id === currentUser.id ? updatedUser : s));
          localStorage.setItem('srms_registered_students', JSON.stringify(updatedList));
        }
      }
    } catch {}
  };

  // Announcements State (with localStorage persistence)
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(() => {
    try {
      const saved = localStorage.getItem('srms_announcements');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_ANNOUNCEMENTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('srms_timetable_slots', JSON.stringify(timetableSlots));
    } catch {}
  }, [timetableSlots]);

  useEffect(() => {
    try {
      localStorage.setItem('srms_announcements', JSON.stringify(announcements));
    } catch {}
  }, [announcements]);

  // Tutorials State (with localStorage persistence)
  const [tutorials, setTutorials] = useState<Tutorial[]>(() => {
    try {
      const saved = localStorage.getItem('srms_tutorials');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_TUTORIALS;
  });

  // PYQ State (with localStorage persistence)
  const [pyqs, setPyqs] = useState<PreviousYearQuestion[]>(() => {
    try {
      const saved = localStorage.getItem('srms_pyqs');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_PYQS;
  });

  // Persist tutorials and PYQs
  useEffect(() => {
    try {
      localStorage.setItem('srms_tutorials', JSON.stringify(tutorials));
    } catch {}
  }, [tutorials]);

  useEffect(() => {
    try {
      localStorage.setItem('srms_pyqs', JSON.stringify(pyqs));
    } catch {}
  }, [pyqs]);

  // Real-time Firestore Sync for Academic Resources
  useEffect(() => {
    const unsubscribe = subscribeToResources((cloudResources) => {
      if (!cloudResources || cloudResources.length === 0) return;
      const cloudTutorials: Tutorial[] = [];
      const cloudPYQs: PreviousYearQuestion[] = [];

      cloudResources.forEach((res) => {
        if (res.type === 'tutorial') {
          cloudTutorials.push({
            id: res.id,
            subjectKey: res.subjectCode as SubjectKey,
            unitName: res.subjectName || 'Core Curriculum',
            title: res.title,
            durationMinutes: 45,
            authorName: res.authorName,
            authorRole: 'Assistant Professor',
            videoUrl: res.videoUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            pdfNotesUrl: res.pdfUrl,
            difficulty: 'Intermediate',
            description: res.description || 'Core Curriculum Lecture',
            createdAt: res.uploadedAt || new Date().toISOString(),
          });
        } else if (res.type === 'pyq') {
          cloudPYQs.push({
            id: res.id,
            subjectKey: res.subjectCode as SubjectKey,
            title: res.title,
            academicYear: res.academicYear || '2023-24',
            examType: 'End-Semester',
            totalMarks: 100,
            uploadedBy: res.authorName,
            fileUrl: res.pdfUrl || '#',
            solutionAvailable: true,
            questionsSnippet: ['Unit I: Algorithms & Complexity', 'Unit II: Dynamic Programming'],
            createdAt: res.uploadedAt || new Date().toISOString(),
          });
        }
      });

      if (cloudTutorials.length > 0) {
        setTutorials((prev) => {
          const merged = [...cloudTutorials];
          prev.forEach((p) => {
            if (!merged.some((m) => m.id === p.id)) merged.push(p);
          });
          return merged;
        });
      }

      if (cloudPYQs.length > 0) {
        setPyqs((prev) => {
          const merged = [...cloudPYQs];
          prev.forEach((p) => {
            if (!merged.some((m) => m.id === p.id)) merged.push(p);
          });
          return merged;
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Synchronize Firebase Auth state
  useEffect(() => {
    const unsubscribeAuth = subscribeToAuthChanges(async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getUserProfileFromFirestore(firebaseUser.uid);
        if (profile) {
          setCurrentUser(profile);
          try {
            localStorage.setItem('srms_current_user', JSON.stringify(profile));
          } catch {}
        }
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Handle Login
  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    // Sync user profile to Firestore
    saveUserProfileToFirestore(user);
    try {
      localStorage.setItem('srms_current_user', JSON.stringify(user));
    } catch {}
    if (user.role === 'admin') {
      setActiveTab('admin_portal');
    } else if (user.role === 'faculty') {
      setActiveTab('faculty_portal');
    } else {
      setActiveTab('schedule');
    }
  };

  // 1-Click Role Switcher for preview between Admin, Faculty, and Student
  const handleSwitchRole = (newRole: UserRole) => {
    if (newRole === 'admin') {
      setCurrentUser(DEFAULT_ADMIN_PROFILE);
      setActiveTab('admin_portal');
      try {
        localStorage.setItem('srms_current_user', JSON.stringify(DEFAULT_ADMIN_PROFILE));
      } catch {}
    } else if (newRole === 'faculty') {
      setCurrentUser(DEFAULT_COORDINATOR_PROFILE);
      setActiveTab('faculty_portal');
      try {
        localStorage.setItem('srms_current_user', JSON.stringify(DEFAULT_COORDINATOR_PROFILE));
      } catch {}
    } else {
      const studentUser: UserProfile = {
        id: 'std-student-demo',
        name: 'Aarav Sharma',
        email: 'aarav.sharma@srms.ac.in',
        role: 'student',
        identifier: '2400100100102',
        universityRollNo: '2400100100102',
        aktuRollNo: '2400100100102',
        collegeRegNo: 'SRMS/2026/BTECH/CSE/102',
        branch: 'CS1',
        aktuCollegeCode: '010 (SRMS CET, Bareilly)',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        degree: 'B.Tech CS1 • Sem V (3rd Year)',
        institution: 'SRMS College of Engineering & Technology, Bareilly (AKTU Code: 010)',
        department: 'Department of Computer Science & Engineering',
        cgpa: '8.75',
      };
      setCurrentUser(studentUser);
      setActiveTab('schedule');
      try {
        localStorage.setItem('srms_current_user', JSON.stringify(studentUser));
      } catch {}
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    await signOutFromFirebase();
    setCurrentUser(null);
    try {
      localStorage.removeItem('srms_current_user');
      localStorage.removeItem('srms_active_tab');
      localStorage.removeItem('srms_has_launched_exam');
    } catch {}
  };

  // Faculty Handlers: Add / Delete Tutorials
  const handleAddTutorial = (newTut: Omit<Tutorial, 'id' | 'createdAt'>) => {
    const tutorial: Tutorial = {
      ...newTut,
      id: `tut-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setTutorials((prev) => [tutorial, ...prev]);

    // Save to Firestore
    saveResourceToFirestore({
      title: newTut.title,
      type: 'tutorial',
      subjectCode: newTut.subjectKey,
      subjectName: newTut.unitName,
      authorName: newTut.authorName,
      authorId: currentUser?.id || 'faculty-default',
      semester: '5th Semester',
      academicYear: '2024-25',
      description: newTut.description || 'Faculty Video Lecture',
      videoUrl: newTut.videoUrl,
      pdfUrl: newTut.pdfNotesUrl,
      uploadedAt: tutorial.createdAt,
      viewsCount: 0,
      downloadsCount: 0,
    }).catch((err) => console.warn('Firestore tutorial upload:', err));
  };

  const handleDeleteTutorial = (id: string) => {
    setTutorials((prev) => prev.filter((t) => t.id !== id));
  };

  // Faculty Handlers: Add / Delete PYQs
  const handleAddPYQ = (newPYQ: Omit<PreviousYearQuestion, 'id' | 'createdAt'>) => {
    const pyq: PreviousYearQuestion = {
      ...newPYQ,
      id: `pyq-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setPyqs((prev) => [pyq, ...prev]);

    // Save to Firestore
    saveResourceToFirestore({
      title: newPYQ.title,
      type: 'pyq',
      subjectCode: newPYQ.subjectKey,
      subjectName: newPYQ.examType,
      authorName: newPYQ.uploadedBy,
      authorId: currentUser?.id || 'faculty-default',
      semester: '5th Semester',
      academicYear: newPYQ.academicYear,
      description: `Previous Year Examination Paper (${newPYQ.academicYear})`,
      pdfUrl: newPYQ.fileUrl,
      uploadedAt: pyq.createdAt,
      viewsCount: 0,
      downloadsCount: 0,
    }).catch((err) => console.warn('Firestore PYQ upload:', err));
  };

  const handleDeletePYQ = (id: string) => {
    setPyqs((prev) => prev.filter((p) => p.id !== id));
  };

  // Handle navigating to the exam flow
  const handleEnterProctoring = () => {
    setActiveTab('security_check');
  };

  const handleLaunchExam = () => {
    setHasLaunchedExam(true);
    setActiveTab('live_exam');
  };

  const handleFinishExam = () => {
    setHasLaunchedExam(false);
    try {
      localStorage.setItem('srms_has_launched_exam', 'false');
      localStorage.removeItem(`srms_live_exam_progress_${selectedSubject}`);
    } catch {}
    setActiveTab('results');
  };

  // If not logged in, render Login / Sign-up Page
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#131b2e] font-sans antialiased selection:bg-[#eaedff]">
      {/* Administrator Management Console Screen */}
      {activeTab === 'admin_portal' && (
        <AdminDashboard
          currentUser={currentUser}
          slots={timetableSlots}
          onUpdateSlots={setTimetableSlots}
          onSwitchRole={handleSwitchRole}
          onNavigateToTab={setActiveTab}
          announcements={announcements}
          onUpdateAnnouncements={setAnnouncements}
          onSignOut={handleLogout}
          onOpenAvatarPicker={() => setShowAvatarPicker(true)}
          leaveApplications={leaveApplications}
          onUpdateLeaveStatus={handleUpdateLeaveStatus}
        />
      )}

      {/* College Timetable & Real-Time Collision Management Screen */}
      {activeTab === 'timetable' && (
        <TimetableScreen
          slots={timetableSlots}
          onUpdateSlots={setTimetableSlots}
          currentUser={currentUser}
          onNavigateToAdmin={() => setActiveTab('admin_portal')}
        />
      )}

      {/* Faculty Console Screen */}
      {activeTab === 'faculty_portal' && (
        <FacultyDashboard
          currentUser={currentUser}
          tutorials={tutorials}
          pyqs={pyqs}
          leaveApplications={leaveApplications}
          onUpdateLeaveStatus={handleUpdateLeaveStatus}
          onOpenAvatarPicker={() => setShowAvatarPicker(true)}
          onAddTutorial={handleAddTutorial}
          onDeleteTutorial={handleDeleteTutorial}
          onAddPYQ={handleAddPYQ}
          onDeletePYQ={handleDeletePYQ}
          onSignOut={handleLogout}
          onSwitchToStudentView={() => setActiveTab('resources')}
        />
      )}

      {/* Tutorials & Previous Year Questions (PYQ) Repository */}
      {activeTab === 'resources' && (
        <ResourcesScreen
          selectedSubject={selectedSubject}
          onSelectSubject={setSelectedSubject}
          tutorials={tutorials}
          pyqs={pyqs}
          onOpenAdmitCard={() => setShowAdmitCardPDF(true)}
        />
      )}

      {/* Student Timetable / Schedule Screen */}
      {activeTab === 'schedule' && (
        <ScheduleScreen
          selectedSubject={selectedSubject}
          onSelectSubject={setSelectedSubject}
          onEnterProctoring={handleEnterProctoring}
          currentUser={currentUser}
          timetableSlots={timetableSlots}
          onNavigateToTimetable={() => setActiveTab('timetable')}
          onOpenAdmitCardPDF={() => setShowAdmitCardPDF(true)}
          onSignOut={handleLogout}
          onNavigateToAnalytics={() => setActiveTab('results')}
          onOpenAvatarPicker={() => setShowAvatarPicker(true)}
          onOpenLeaveModal={() => setShowLeaveModal(true)}
        />
      )}

      {/* Biometric Security Check / Proctoring Gateway */}
      {activeTab === 'security_check' && (
        <SecurityCheckScreen
          selectedSubject={selectedSubject}
          currentUser={currentUser}
          onBack={() => setActiveTab('schedule')}
          onLaunchExam={handleLaunchExam}
        />
      )}

      {/* Live Exam Assessment */}
      {activeTab === 'live_exam' && (
        <LiveExamScreen
          selectedSubject={selectedSubject}
          onFinishExam={handleFinishExam}
          onExitExam={() => setActiveTab('schedule')}
        />
      )}

      {/* Google Drive Integration Screen */}
      {activeTab === 'drive' && (
        <GoogleDriveScreen
          currentUser={currentUser}
          onOpenAdmitCardPDF={() => setShowAdmitCardPDF(true)}
          onBackToSchedule={() => setActiveTab(currentUser.role === 'faculty' ? 'faculty_portal' : 'schedule')}
        />
      )}

      {/* Multi-turn Gemini AI Assistant Screen */}
      {activeTab === 'assistant' && (
        <AssistantScreen
          selectedSubject={selectedSubject}
          onSelectSubject={setSelectedSubject}
          currentUser={currentUser}
          onBack={() => setActiveTab(currentUser.role === 'faculty' ? 'faculty_portal' : 'schedule')}
        />
      )}

      {/* Results & Scorecards Screen */}
      {activeTab === 'results' && (
        <ResultsScreen
          selectedSubject={selectedSubject}
          onSelectSubject={setSelectedSubject}
          currentUser={currentUser}
          onBack={() => setActiveTab(currentUser.role === 'faculty' ? 'faculty_portal' : 'schedule')}
        />
      )}

      {/* Profile Screen */}
      {activeTab === 'profile' && (
        <ProfileScreen
          onSelectSubject={setSelectedSubject}
          onNavigateToResults={() => setActiveTab('results')}
          currentUser={currentUser}
          onOpenAdmitCardPDF={() => setShowAdmitCardPDF(true)}
          onSignOut={handleLogout}
          onOpenAvatarPicker={() => setShowAvatarPicker(true)}
          onOpenLeaveModal={() => setShowLeaveModal(true)}
          leaveApplications={leaveApplications}
        />
      )}

      {/* Docked Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        userRole={currentUser.role}
        onSelectTab={(tab) => {
          if (tab === 'security_check' && hasLaunchedExam) {
            setActiveTab('live_exam');
          } else {
            setActiveTab(tab);
          }
        }}
      />

      {/* Official Admit Card PDF Download Modal */}
      <AdmitCardPDFModal
        isOpen={showAdmitCardPDF}
        onClose={() => setShowAdmitCardPDF(false)}
        currentUser={currentUser}
      />

      {/* Interactive Avatar Picker Modal (Student, Faculty & Admin) */}
      {showAvatarPicker && (
        <AvatarPickerModal
          currentUser={currentUser}
          currentAvatar={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
          onClose={() => setShowAvatarPicker(false)}
          onSave={handleUpdateAvatar}
        />
      )}

      {/* Student Leave Application Modal */}
      {showLeaveModal && (
        <LeaveApplicationModal
          currentUser={currentUser}
          applications={leaveApplications}
          onClose={() => setShowLeaveModal(false)}
          onSubmitLeave={handleApplyLeave}
        />
      )}
    </div>
  );
}

