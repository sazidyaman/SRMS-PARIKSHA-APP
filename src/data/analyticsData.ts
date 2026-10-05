export interface SubjectAnalyticsInfo {
  key: string;
  code: string;
  name: string;
  shortName: string;
  category: 'Theory' | 'Lab';
  color: string;
  currentPercentage: number;
  latestScore: number;
  maxScore: number;
  cohortAverage: number;
  cohortHighest: number;
  percentile: string;
  grade: string;
  credits: number;
  trendDelta: string;
  trendPositive: boolean;
  facultyInCharge: string;
  examCount: number;
  description: string;
}

export interface MilestoneTrendPoint {
  milestone: string;
  shortLabel: string;
  date: string;
  cohortAvg: number;
  DAA: number;       // BCS 503
  DBMS: number;      // BCC501
  WT: number;        // BCS 502
  MLT: number;       // bcs055
  DA: number;        // Bcs052
  COI: number;       // BNC501
  DAA_LAB: number;   // bcs553
  DBMS_LAB: number;  // bcs551
  WT_LAB: number;    // bcs552
}

export interface SkillDomainPoint {
  subject: string;
  studentScore: number;
  cohortAverage: number;
  fullMark: number;
}

export interface HistoricalTestLog {
  id: string;
  testName: string;
  subjectKey: string;
  subjectCode: string;
  subjectName: string;
  date: string;
  obtainedMarks: number;
  totalMarks: number;
  percentage: number;
  classRank: number;
  cohortSize: number;
  status: 'Verified & Locked' | 'Proctor Validated' | 'Evaluated';
  type: 'Quiz' | 'Unit Test' | 'Mid-Term' | 'Lab Exam';
}

// All 9 Specified Subjects (6 Theory + 3 Labs) with exact requested codes
export const SUBJECT_ANALYTICS_LIST: SubjectAnalyticsInfo[] = [
  {
    key: 'DAA',
    code: 'BCS 503',
    name: 'Design and Analysis of Algorithm',
    shortName: 'DAA',
    category: 'Theory',
    color: '#00288e', // Deep Cobalt
    currentPercentage: 96.0,
    latestScore: 48,
    maxScore: 50,
    cohortAverage: 72.8,
    cohortHighest: 98.0,
    percentile: '98.4th',
    grade: 'A+',
    credits: 4,
    trendDelta: '+14.0%',
    trendPositive: true,
    facultyInCharge: 'Dr. Alok Verma',
    examCount: 6,
    description: 'Asymptotic complexity, DAG shortest paths, greedy & dynamic programming algorithms.',
  },
  {
    key: 'DBMS',
    code: 'BCC501',
    name: 'Database Management Systems',
    shortName: 'DBMS',
    category: 'Theory',
    color: '#059669', // Emerald
    currentPercentage: 92.0,
    latestScore: 46,
    maxScore: 50,
    cohortAverage: 70.2,
    cohortHighest: 96.0,
    percentile: '96.8th',
    grade: 'A+',
    credits: 4,
    trendDelta: '+8.5%',
    trendPositive: true,
    facultyInCharge: 'Prof. Rajiv Tandon',
    examCount: 6,
    description: 'Relational algebra, SQL engine internals, normalization, and ACID transaction control.',
  },
  {
    key: 'WT',
    code: 'BCS 502',
    name: 'Web Technology',
    shortName: 'WT',
    category: 'Theory',
    color: '#0284c7', // Sky Blue
    currentPercentage: 94.0,
    latestScore: 47,
    maxScore: 50,
    cohortAverage: 74.4,
    cohortHighest: 98.0,
    percentile: '97.6th',
    grade: 'A+',
    credits: 4,
    trendDelta: '+11.2%',
    trendPositive: true,
    facultyInCharge: 'Prof. Priyanka Saxena',
    examCount: 6,
    description: 'DOM APIs, asynchronous JS event loop, RESTful microservices, and React architectures.',
  },
  {
    key: 'MLT',
    code: 'bcs055',
    name: 'Machine Learning Techniques',
    shortName: 'MLT',
    category: 'Theory',
    color: '#7c3aed', // Purple
    currentPercentage: 98.0,
    latestScore: 49,
    maxScore: 50,
    cohortAverage: 69.6,
    cohortHighest: 98.0,
    percentile: '99.2th',
    grade: 'O',
    credits: 4,
    trendDelta: '+16.0%',
    trendPositive: true,
    facultyInCharge: 'Dr. S. K. Gupta',
    examCount: 6,
    description: 'Gradient descent, backpropagation in deep networks, regularization, and SVM kernels.',
  },
  {
    key: 'DA',
    code: 'Bcs052',
    name: 'Data Analytics',
    shortName: 'DA',
    category: 'Theory',
    color: '#d97706', // Amber
    currentPercentage: 90.0,
    latestScore: 45,
    maxScore: 50,
    cohortAverage: 67.8,
    cohortHighest: 94.0,
    percentile: '95.4th',
    grade: 'A+',
    credits: 3,
    trendDelta: '+6.2%',
    trendPositive: true,
    facultyInCharge: 'Dr. Neha Agarwal',
    examCount: 6,
    description: 'Exploratory data analysis, hypothesis testing, PCA, regression, and time-series modeling.',
  },
  {
    key: 'COI',
    code: 'BNC501',
    name: 'Constitution of India',
    shortName: 'COI',
    category: 'Theory',
    color: '#db2777', // Pink / Rose
    currentPercentage: 96.0,
    latestScore: 48,
    maxScore: 50,
    cohortAverage: 76.0,
    cohortHighest: 98.0,
    percentile: '98.1th',
    grade: 'A+',
    credits: 2,
    trendDelta: '+4.5%',
    trendPositive: true,
    facultyInCharge: 'Prof. R. C. Mathur',
    examCount: 5,
    description: 'Preamble, Fundamental Rights, Directive Principles, Supreme Court Writs, and Union Executive.',
  },
  {
    key: 'DAA_LAB',
    code: 'bcs553',
    name: 'DAA Lab',
    shortName: 'DAA Lab',
    category: 'Lab',
    color: '#4f46e5', // Indigo
    currentPercentage: 96.5,
    latestScore: 48.5,
    maxScore: 50,
    cohortAverage: 77.2,
    cohortHighest: 99.0,
    percentile: '98.0th',
    grade: 'O',
    credits: 2,
    trendDelta: '+9.0%',
    trendPositive: true,
    facultyInCharge: 'Dr. Alok Verma',
    examCount: 5,
    description: 'Algorithm implementation, dynamic programming problem benchmarks, and complexity validation in C++.',
  },
  {
    key: 'DBMS_LAB',
    code: 'bcs551',
    name: 'DBMS Lab',
    shortName: 'DBMS Lab',
    category: 'Lab',
    color: '#0d9488', // Teal
    currentPercentage: 94.0,
    latestScore: 47,
    maxScore: 50,
    cohortAverage: 75.8,
    cohortHighest: 96.0,
    percentile: '96.2th',
    grade: 'A+',
    credits: 2,
    trendDelta: '+7.4%',
    trendPositive: true,
    facultyInCharge: 'Prof. Rajiv Tandon',
    examCount: 5,
    description: 'Schema construction, complex SQL joins, stored procedures, triggers, and query optimizer plans.',
  },
  {
    key: 'WT_LAB',
    code: 'bcs552',
    name: 'WT Lab',
    shortName: 'WT Lab',
    category: 'Lab',
    color: '#0891b2', // Cyan
    currentPercentage: 95.5,
    latestScore: 48,
    maxScore: 50,
    cohortAverage: 76.5,
    cohortHighest: 97.0,
    percentile: '97.4th',
    grade: 'A+',
    credits: 2,
    trendDelta: '+8.2%',
    trendPositive: true,
    facultyInCharge: 'Prof. Priyanka Saxena',
    examCount: 5,
    description: 'Full-stack development, WebSocket event handlers, secure REST endpoints, and responsive DOM components.',
  },
];

// Chronological test performance milestones over time (Semester VI 2024)
export const PERFORMANCE_TRENDS_OVER_TIME: MilestoneTrendPoint[] = [
  {
    milestone: 'Aug 12',
    shortLabel: 'Quiz 1',
    date: '12 Aug 2024',
    cohortAvg: 68.4,
    DAA: 82.0,      // BCS 503
    DBMS: 83.5,     // BCC501
    WT: 82.8,       // BCS 502
    MLT: 82.0,      // bcs055
    DA: 83.8,       // Bcs052
    COI: 91.5,      // BNC501
    DAA_LAB: 87.5,  // bcs553
    DBMS_LAB: 86.6, // bcs551
    WT_LAB: 87.3,   // bcs552
  },
  {
    milestone: 'Sep 04',
    shortLabel: 'Unit Test 1',
    date: '04 Sep 2024',
    cohortAvg: 70.2,
    DAA: 86.0,
    DBMS: 86.0,
    WT: 86.5,
    MLT: 87.5,
    DA: 85.0,
    COI: 93.0,
    DAA_LAB: 90.0,
    DBMS_LAB: 89.0,
    WT_LAB: 89.5,
  },
  {
    milestone: 'Sep 28',
    shortLabel: 'Mid-Term I',
    date: '28 Sep 2024',
    cohortAvg: 72.1,
    DAA: 89.0,
    DBMS: 88.0,
    WT: 89.0,
    MLT: 91.0,
    DA: 87.0,
    COI: 94.0,
    DAA_LAB: 92.5,
    DBMS_LAB: 90.5,
    WT_LAB: 91.0,
  },
  {
    milestone: 'Oct 18',
    shortLabel: 'Unit Test 2',
    date: '18 Oct 2024',
    cohortAvg: 73.8,
    DAA: 92.0,
    DBMS: 89.5,
    WT: 91.5,
    MLT: 94.5,
    DA: 88.5,
    COI: 95.0,
    DAA_LAB: 94.0,
    DBMS_LAB: 92.0,
    WT_LAB: 93.5,
  },
  {
    milestone: 'Nov 08',
    shortLabel: 'Mid-Term II',
    date: '08 Nov 2024',
    cohortAvg: 74.5,
    DAA: 96.0,
    DBMS: 92.0,
    WT: 94.0,
    MLT: 98.0,
    DA: 90.0,
    COI: 96.0,
    DAA_LAB: 96.5,
    DBMS_LAB: 94.0,
    WT_LAB: 95.5,
  },
  {
    milestone: 'Nov 28',
    shortLabel: 'Pre-Univ Mock',
    date: '28 Nov 2024',
    cohortAvg: 75.9,
    DAA: 97.5,
    DBMS: 93.5,
    WT: 95.0,
    MLT: 99.0,
    DA: 91.5,
    COI: 97.0,
    DAA_LAB: 98.0,
    DBMS_LAB: 95.5,
    WT_LAB: 96.8,
  },
];

// Radar chart domain breakdown
export const SKILL_DOMAIN_DATA: SkillDomainPoint[] = [
  { subject: 'Algorithms & Complexity', studentScore: 97, cohortAverage: 71, fullMark: 100 },
  { subject: 'Database & SQL Engineering', studentScore: 93, cohortAverage: 74, fullMark: 100 },
  { subject: 'Web & API Architecture', studentScore: 95, cohortAverage: 75, fullMark: 100 },
  { subject: 'Machine Learning & Models', studentScore: 98, cohortAverage: 69, fullMark: 100 },
  { subject: 'Data Analytics & Stats', studentScore: 91, cohortAverage: 68, fullMark: 100 },
  { subject: 'Constitutional Knowledge', studentScore: 96, cohortAverage: 76, fullMark: 100 },
  { subject: 'Lab Coding & Debugging', studentScore: 97, cohortAverage: 77, fullMark: 100 },
];

// Chronological Historical Assessment Records
export const HISTORICAL_TEST_RECORDS: HistoricalTestLog[] = [
  {
    id: 'test-nov-daa',
    testName: 'Mid-Term Examination II (Algorithm Design & Graph Theory)',
    subjectKey: 'DAA',
    subjectCode: 'BCS 503',
    subjectName: 'Design and Analysis of Algorithm',
    date: '08 Nov 2024',
    obtainedMarks: 48,
    totalMarks: 50,
    percentage: 96.0,
    classRank: 2,
    cohortSize: 118,
    status: 'Verified & Locked',
    type: 'Mid-Term',
  },
  {
    id: 'test-nov-mlt',
    testName: 'Mid-Term Examination II (Neural Networks & Regularization)',
    subjectKey: 'MLT',
    subjectCode: 'bcs055',
    subjectName: 'Machine Learning Techniques',
    date: '07 Nov 2024',
    obtainedMarks: 49,
    totalMarks: 50,
    percentage: 98.0,
    classRank: 1,
    cohortSize: 118,
    status: 'Verified & Locked',
    type: 'Mid-Term',
  },
  {
    id: 'test-nov-wt',
    testName: 'Mid-Term Examination II (Async JS & Full Stack Architecture)',
    subjectKey: 'WT',
    subjectCode: 'BCS 502',
    subjectName: 'Web Technology',
    date: '06 Nov 2024',
    obtainedMarks: 47,
    totalMarks: 50,
    percentage: 94.0,
    classRank: 3,
    cohortSize: 118,
    status: 'Verified & Locked',
    type: 'Mid-Term',
  },
  {
    id: 'test-nov-dbms',
    testName: 'Mid-Term Examination II (ACID & Concurrency Protocols)',
    subjectKey: 'DBMS',
    subjectCode: 'BCC501',
    subjectName: 'Database Management Systems',
    date: '05 Nov 2024',
    obtainedMarks: 46,
    totalMarks: 50,
    percentage: 92.0,
    classRank: 4,
    cohortSize: 118,
    status: 'Verified & Locked',
    type: 'Mid-Term',
  },
  {
    id: 'test-nov-da',
    testName: 'Mid-Term Examination II (Hypothesis Testing & Regression)',
    subjectKey: 'DA',
    subjectCode: 'Bcs052',
    subjectName: 'Data Analytics',
    date: '04 Nov 2024',
    obtainedMarks: 45,
    totalMarks: 50,
    percentage: 90.0,
    classRank: 5,
    cohortSize: 118,
    status: 'Verified & Locked',
    type: 'Mid-Term',
  },
  {
    id: 'test-nov-coi',
    testName: 'Mid-Term Examination II (Supreme Court Writs & Executive)',
    subjectKey: 'COI',
    subjectCode: 'BNC501',
    subjectName: 'Constitution of India',
    date: '03 Nov 2024',
    obtainedMarks: 48,
    totalMarks: 50,
    percentage: 96.0,
    classRank: 2,
    cohortSize: 118,
    status: 'Verified & Locked',
    type: 'Mid-Term',
  },
  {
    id: 'test-oct-daa-lab',
    testName: 'Practical Lab Assessment II (Dynamic Programming Execution)',
    subjectKey: 'DAA_LAB',
    subjectCode: 'bcs553',
    subjectName: 'DAA Lab',
    date: '24 Oct 2024',
    obtainedMarks: 48.5,
    totalMarks: 50,
    percentage: 97.0,
    classRank: 2,
    cohortSize: 118,
    status: 'Proctor Validated',
    type: 'Lab Exam',
  },
  {
    id: 'test-oct-dbms-lab',
    testName: 'Practical Lab Assessment II (Stored Procedures & Triggers)',
    subjectKey: 'DBMS_LAB',
    subjectCode: 'bcs551',
    subjectName: 'DBMS Lab',
    date: '23 Oct 2024',
    obtainedMarks: 47,
    totalMarks: 50,
    percentage: 94.0,
    classRank: 4,
    cohortSize: 118,
    status: 'Proctor Validated',
    type: 'Lab Exam',
  },
  {
    id: 'test-oct-wt-lab',
    testName: 'Practical Lab Assessment II (Full-Stack Component Implementation)',
    subjectKey: 'WT_LAB',
    subjectCode: 'bcs552',
    subjectName: 'WT Lab',
    date: '22 Oct 2024',
    obtainedMarks: 48,
    totalMarks: 50,
    percentage: 96.0,
    classRank: 3,
    cohortSize: 118,
    status: 'Proctor Validated',
    type: 'Lab Exam',
  },
  {
    id: 'test-oct-unit2-daa',
    testName: 'Unit Test 2 (Greedy Heuristics & Dynamic Programming)',
    subjectKey: 'DAA',
    subjectCode: 'BCS 503',
    subjectName: 'Design and Analysis of Algorithm',
    date: '18 Oct 2024',
    obtainedMarks: 27.6,
    totalMarks: 30,
    percentage: 92.0,
    classRank: 4,
    cohortSize: 118,
    status: 'Evaluated',
    type: 'Unit Test',
  },
  {
    id: 'test-sep-mid1-daa',
    testName: 'Mid-Term Examination I (Divide & Conquer, Heaps, Graph BFS/DFS)',
    subjectKey: 'DAA',
    subjectCode: 'BCS 503',
    subjectName: 'Design and Analysis of Algorithm',
    date: '28 Sep 2024',
    obtainedMarks: 44.5,
    totalMarks: 50,
    percentage: 89.0,
    classRank: 6,
    cohortSize: 118,
    status: 'Verified & Locked',
    type: 'Mid-Term',
  },
  {
    id: 'test-sep-mid1-mlt',
    testName: 'Mid-Term Examination I (Supervised Learning & Linear Models)',
    subjectKey: 'MLT',
    subjectCode: 'bcs055',
    subjectName: 'Machine Learning Techniques',
    date: '27 Sep 2024',
    obtainedMarks: 45.5,
    totalMarks: 50,
    percentage: 91.0,
    classRank: 3,
    cohortSize: 118,
    status: 'Verified & Locked',
    type: 'Mid-Term',
  },
];
