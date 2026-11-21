export type SubjectKey = 'DAA' | 'DBMS' | 'WT' | 'MLT' | 'DA' | 'COI';

export type UserRole = 'student' | 'faculty' | 'admin';

export type CollegeBranch = 'CS1' | 'CS2' | 'IT' | 'AIML' | 'EC' | 'EN' | 'ME';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  identifier: string; // Roll No for student, Employee ID for faculty, Admin ID for admin
  universityRollNo?: string; // AKTU Lucknow 13-digit University Roll No e.g. "2200100100084"
  aktuRollNo?: string; // Compatibility alias
  collegeRegNo?: string; // College Registration / Admission No e.g. "SRMS/2022/BTECH/CSE/084"
  branch?: CollegeBranch;
  aktuCollegeCode?: string; // e.g. "010 (SRMS CET, Bareilly)"
  department: string;
  designation?: string; // For faculty/admin: e.g. "Associate Professor - CSE" or "Principal & Academic Head"
  degree?: string; // For student: e.g. "B.Tech CS • 3rd Year"
  cgpa?: string;
  attendance?: string;
  institution: string;
  // Faculty specific fields:
  primarySubject?: SubjectKey;
  teachingSemester?: string; // e.g. "Semester V (3rd Year)"
  employeeId?: string;
}

export interface Tutorial {
  id: string;
  title: string;
  subjectKey: SubjectKey;
  unitName: string;
  description: string;
  authorName: string;
  authorRole: string;
  durationMinutes: number;
  videoUrl?: string;
  pdfNotesUrl?: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  createdAt: string;
  semester?: string;
  authorId?: string;
}

export interface PreviousYearQuestion {
  id: string;
  title: string;
  subjectKey: SubjectKey;
  academicYear: string;
  examType: 'Mid-Term I' | 'Mid-Term II' | 'End-Semester';
  totalMarks: number;
  uploadedBy: string;
  questionsSnippet: string[];
  solutionAvailable: boolean;
  fileUrl?: string;
  createdAt: string;
  semester?: string;
  authorId?: string;
}

export interface Subject {
  key: SubjectKey;
  code: string;
  name: string;
  shortName: string;
  department: string;
  semester: string;
  academicYear: string;
  term: string;
  icon: string;
  topics: {
    name: string;
    questionsCount: number;
    defaultProficiency: number;
  }[];
  summaryScore: {
    obtained: number;
    total: number;
    grade: string;
    percentile: string;
    rank: number;
    cohortTotal: number;
    accuracy: number;
    correctQuestions: number;
    totalQuestions: number;
    pacingSpeed: string;
    studentScore: number;
    cohortMean: number;
    bloomTaxonomy: {
      rememberUnderstand: number;
      applyAnalyze: number;
      evaluate: number;
    };
    shaHash: string;
  };
}

export interface QuestionOption {
  key: 'A' | 'B' | 'C' | 'D';
  label: string;
  code?: string;
  detail: string;
}

export interface ExamQuestion {
  id: string;
  questionNumber: number;
  category: string;
  bloomCategory: 'Remember & Understand' | 'Apply & Analyze' | 'Evaluate';
  topic: string;
  marks: number;
  stem: string;
  codeSnippet?: string;
  options: QuestionOption[];
  correctOption: 'A' | 'B' | 'C' | 'D';
  explanation: string;
}

export interface ScheduledExam {
  id: string;
  subjectKey: SubjectKey;
  code: string;
  title: string;
  timeSlot: string;
  dateLabel: string;
  status: 'Upcoming' | 'Pre-check Ready' | 'Scheduled' | 'Completed';
  venue: string;
  syllabus: string;
  durationMinutes: number;
  maxMarks: number;
}

export type TabType =
  | 'schedule'
  | 'security_check'
  | 'live_exam'
  | 'results'
  | 'resources'
  | 'faculty_portal'
  | 'assistant'
  | 'profile'
  | 'drive'
  | 'timetable'
  | 'admin_portal';

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  webContentLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
  parents?: string[];
}

export interface DriveStorageQuota {
  limit?: string;
  usage?: string;
  usageInDrive?: string;
  usageInDriveTrash?: string;
}

export interface GoogleDriveUser {
  displayName?: string;
  emailAddress?: string;
  photoLink?: string;
}

export interface ResourceItem {
  id: string;
  title: string;
  type: 'tutorial' | 'pyq';
  subjectCode: string;
  subjectName: string;
  authorName: string;
  authorId: string;
  semester?: string;
  academicYear?: string;
  description?: string;
  videoUrl?: string;
  pdfUrl?: string;
  uploadedAt?: string;
  viewsCount?: number;
  downloadsCount?: number;
}

// ----------------------------------------------------
// SRMS College Timetable & Collision Management Types
// ----------------------------------------------------

export type TimetableDay = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT';

export type SlotType =
  | 'lecture'
  | 'lab'
  | 'tutorial'
  | 'seminar'
  | 'activity'
  | 'library'
  | 'quiz';

export interface TimetableSlot {
  id: string;
  day: TimetableDay;
  periodNumber: number; // 1 to 7
  timeSlot: string; // e.g. "8:30-9:30 AM"
  startMinutes: number; // minutes from midnight, e.g. 510 for 8:30
  endMinutes: number; // minutes from midnight, e.g. 570 for 9:30
  branch: CollegeBranch;
  subjectCode: string; // e.g. "WT", "DAA", "DBMS"
  subjectName: string; // e.g. "Web Technology"
  facultyCode: string; // e.g. "MO", "ANU", "SJA"
  facultyName: string; // e.g. "Ms. Anu Sharma"
  room: string; // e.g. "303", "LAB-2A"
  type: SlotType;
  batchGroup?: string; // "A", "B", "C" or combined
  isClashing?: boolean;
  clashReason?: string;
}

export type CollisionType = 'room_clash' | 'faculty_clash' | 'branch_clash';

export interface TimetableCollision {
  id: string;
  type: CollisionType;
  day: TimetableDay;
  timeSlot: string;
  slotAId: string;
  slotBId: string;
  slotA: TimetableSlot;
  slotB: TimetableSlot;
  description: string;
  recommendation: string;
}

export type AnnouncementReactionType = 'thumbsUp' | 'heart' | 'question';

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  category: 'timetable' | 'examination' | 'academic' | 'urgent';
  priority: 'urgent' | 'normal';
  postedBy: string;
  date: string;
  targetRole: 'all' | 'student' | 'faculty';
  reactions?: {
    thumbsUp?: number;
    heart?: number;
    question?: number;
    userReactions?: Record<string, AnnouncementReactionType>;
  };
}

// ----------------------------------------------------
// Student Leave Application System Types
// ----------------------------------------------------

export type LeaveReasonCategory =
  | 'sickness' // Sickness / Medical illness / Clinic visit
  | 'rainy_day' // Severe Weather / Heavy Rain / Waterlogging / Travel disruption
  | 'family_emergency' // Urgent domestic or personal emergency
  | 'academic_duty' // College Representation / Hackathon / Sports / Seminar
  | 'other'; // Other unavoidable absence

export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveApplication {
  id: string;
  studentId: string;
  studentName: string;
  aktuRollNo: string;
  collegeRegNo: string;
  branch: CollegeBranch;
  department: string;
  mentorFacultyCode: string; // e.g. "AP"
  mentorFacultyName: string; // e.g. "Dr. Ashutosh Pandey"
  reasonCategory: LeaveReasonCategory;
  reasonTitle: string;
  detailedReason: string;
  startDate: string;
  endDate: string;
  numberOfDays: number;
  status: LeaveStatus;
  appliedAt: string;
  facultyRemarks?: string;
  approvedBy?: string;
  reviewedAt?: string;
  attachmentName?: string;
}


