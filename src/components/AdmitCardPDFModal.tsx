import React, { useRef, useState } from 'react';
import { UserProfile } from '../types';
import {
  uploadDriveFile,
  findOrCreateAppFolder,
  getAccessToken,
  googleSignIn,
} from '../services/googleDriveService';

interface AdmitCardPDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserProfile | null;
}

export const AdmitCardPDFModal: React.FC<AdmitCardPDFModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const printableRef = useRef<HTMLDivElement>(null);
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);
  const [driveSaveStatus, setDriveSaveStatus] = useState<{
    success: boolean;
    msg: string;
    link?: string;
  } | null>(null);

  if (!isOpen) return null;

  const studentName = currentUser?.name || 'Enrolled Student';
  const universityRollNo = currentUser?.universityRollNo || currentUser?.identifier || 'Not Assigned';
  const collegeRegNo = currentUser?.collegeRegNo || 'Not Assigned';
  const aktuCollegeCode = currentUser?.aktuCollegeCode || '010 (SRMS CET, Bareilly)';
  const rollNo = universityRollNo;
  const avatar = currentUser?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(studentName)}`;

  const EXAM_SUBJECT_SCHEDULE = [
    { code: 'BCS 503', name: 'Design and Analysis of Algorithm (DAA)', date: '14-11-2024', time: '10:00 AM - 11:30 AM', venue: 'Kiosk Hall A-101 (Seat 42)' },
    { code: 'BCC501', name: 'Database Management Systems (DBMS)', date: '16-11-2024', time: '10:00 AM - 11:30 AM', venue: 'Kiosk Hall A-101 (Seat 42)' },
    { code: 'BCS 502', name: 'Web Technology (WT)', date: '18-11-2024', time: '02:00 PM - 03:30 PM', venue: 'Kiosk Hall B-204 (Seat 18)' },
    { code: 'bcs055', name: 'Machine Learning Techniques (MLT)', date: '20-11-2024', time: '10:00 AM - 11:30 AM', venue: 'Kiosk Hall A-101 (Seat 42)' },
    { code: 'Bcs052', name: 'Data Analytics (DA)', date: '22-11-2024', time: '02:00 PM - 03:30 PM', venue: 'Kiosk Hall B-204 (Seat 18)' },
    { code: 'BNC501', name: 'Constitution of India (COI)', date: '24-11-2024', time: '10:00 AM - 11:30 AM', venue: 'Main Auditorium (Row 6)' },
    { code: 'bcs553', name: 'DAA Lab Practical', date: '26-11-2024', time: '09:30 AM - 12:30 PM', venue: 'Computing Lab 3 (Systems Block)' },
    { code: 'bcs551', name: 'DBMS Lab Practical', date: '27-11-2024', time: '09:30 AM - 12:30 PM', venue: 'Database Lab 4' },
    { code: 'bcs552', name: 'WT Lab Practical', date: '28-11-2024', time: '09:30 AM - 12:30 PM', venue: 'Web Technology Lab 2' },
  ];

  const handlePrintPDF = () => {
    window.print();
  };

  const handleSaveToDrive = async () => {
    setIsSavingToDrive(true);
    setDriveSaveStatus(null);
    try {
      let token = await getAccessToken();
      if (!token) {
        // Authenticate with Google
        const authRes = await googleSignIn();
        token = authRes.accessToken;
      }

      const appFolderId = await findOrCreateAppFolder('SRMS Pariksha - Academic Portal');
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `AdmitCard_${rollNo}_${timestamp}.txt`;

      const content = `======================================================================
SRMS COLLEGE OF ENGINEERING & TECHNOLOGY, BAREILLY
AFFILIATED TO DR. A.P.J. ABDUL KALAM TECHNICAL UNIVERSITY (AKTU), LUCKNOW
OFFICIAL UNIVERSITY EXAMINATION ADMIT CARD (SESSION 2024-25)
======================================================================
Candidate Name        : ${studentName}
AKTU University Roll  : ${universityRollNo}
College Reg No        : ${collegeRegNo}
AKTU College Code     : ${aktuCollegeCode}
Degree/Course         : B.Tech Computer Science & Engineering (5th Semester)
Centre Code           : 010 • Main Examination Block, Bareilly Campus
Issued Date           : ${new Date().toLocaleDateString('en-IN')}

SUBJECT-WISE SCHEDULE:
1. BCS 503 • Design and Analysis of Algorithm (DAA)
   Date: 14-11-2024 | 10:00 AM - 11:30 AM | Hall: Kiosk Hall A-101 (Seat 42)
2. BCC501 • Database Management Systems (DBMS)
   Date: 16-11-2024 | 10:00 AM - 11:30 AM | Hall: Kiosk Hall A-101 (Seat 42)
3. BCS 502 • Web Technology (WT)
   Date: 18-11-2024 | 02:00 PM - 03:30 PM | Hall: Kiosk Hall B-204 (Seat 18)
4. bcs055 • Machine Learning Techniques (MLT)
   Date: 20-11-2024 | 10:00 AM - 11:30 AM | Hall: Kiosk Hall A-101 (Seat 42)
5. Bcs052 • Data Analytics (DA)
   Date: 22-11-2024 | 02:00 PM - 03:30 PM | Hall: Kiosk Hall B-204 (Seat 18)
6. BNC501 • Constitution of India (COI)
   Date: 24-11-2024 | 10:00 AM - 11:30 AM | Hall: Main Auditorium (Row 6)
7. bcs553 • DAA Lab Practical
   Date: 26-11-2024 | 09:30 AM - 12:30 PM | Hall: Computing Lab 3
8. bcs551 • DBMS Lab Practical
   Date: 27-11-2024 | 09:30 AM - 12:30 PM | Hall: Database Lab 4
9. bcs552 • WT Lab Practical
   Date: 28-11-2024 | 09:30 AM - 12:30 PM | Hall: Web Technology Lab 2

CANDIDATE SIGNATURE & VERIFICATION:
- Biometric Verified: YES
- Digital Security Hash: 7b29a8f4c718a09bc331df400192e4...
- Official Archive: Google Drive Sync Enabled
======================================================================`;

      const uploaded = await uploadDriveFile({
        name: filename,
        mimeType: 'text/plain',
        content,
        folderId: appFolderId,
      });

      setDriveSaveStatus({
        success: true,
        msg: `Admit card saved to Google Drive as "${filename}"`,
        link: uploaded.webViewLink,
      });
    } catch (err: any) {
      setDriveSaveStatus({
        success: false,
        msg: err.message || 'Failed to save to Google Drive',
      });
    } finally {
      setIsSavingToDrive(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full my-auto overflow-hidden shadow-2xl border border-[#c4c5d5] flex flex-col max-h-[92vh]">
        {/* Header Action Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#00288e] text-white flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">badge</span>
            <div>
              <h3 className="font-bold text-sm leading-tight">Official Examination Admit Card</h3>
              <p className="text-[11px] text-blue-200">SRMS Pariksha Central Examination Cell</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveToDrive}
              disabled={isSavingToDrive}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#eaedff] text-[#00288e] hover:bg-white text-xs font-bold transition-all shadow-xs active:scale-95 disabled:opacity-50"
              title="Save directly to Google Drive"
            >
              <span className="material-symbols-outlined text-[16px]">add_to_drive</span>
              <span className="hidden sm:inline">{isSavingToDrive ? 'Saving...' : 'Save to Drive'}</span>
            </button>
            <button
              onClick={handlePrintPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-[#00288e] hover:bg-[#eaedff] text-xs font-bold transition-all shadow-xs active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
              <span>Download / Print</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Drive Save Banner */}
        {driveSaveStatus && (
          <div
            className={`px-4 py-2 text-xs flex items-center justify-between gap-2 border-b ${
              driveSaveStatus.success
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">
                {driveSaveStatus.success ? 'check_circle' : 'error'}
              </span>
              <span>{driveSaveStatus.msg}</span>
            </div>
            {driveSaveStatus.link && (
              <a
                href={driveSaveStatus.link}
                target="_blank"
                rel="noreferrer"
                className="underline font-bold flex items-center gap-1 hover:text-emerald-950 flex-shrink-0"
              >
                <span>Open in Drive</span>
                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
              </a>
            )}
          </div>
        )}

        {/* Scrollable Printable Admit Card Document */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-white text-[#131b2e]" ref={printableRef}>
          <div className="border-2 border-[#00288e] p-4 sm:p-5 rounded-xl space-y-4">
            {/* Institution Header */}
            <div className="text-center border-b-2 border-[#00288e] pb-3">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-9 h-9 rounded-full bg-[#00288e] text-white flex items-center justify-center font-bold text-sm">
                  SRMS
                </div>
                <h1 className="text-sm sm:text-base font-black text-[#00288e] uppercase tracking-wide">
                  SHRIRAM MURTI SMARAK TRUST
                </h1>
              </div>
              <p className="text-xs font-bold text-[#131b2e]">
                COLLEGE OF ENGINEERING & TECHNOLOGY • BAREILLY (AKTU CODE: 010)
              </p>
              <p className="text-[11px] text-[#444653] font-medium">
                Affiliated to Dr. A.P.J. Abdul Kalam Technical University (AKTU), Lucknow
              </p>
              <div className="inline-block px-3 py-0.5 mt-1 rounded bg-[#eaedff] text-[#00288e] font-mono text-xs font-bold border border-[#00288e]/30">
                PROVISIONAL ADMIT CARD & DIGITAL HALL TICKET (AY 2024–25)
              </div>
            </div>

            {/* Candidate & Biometric Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-start pb-3 border-b border-[#c4c5d5]">
              {/* Photo & QR Stamp */}
              <div className="flex flex-col items-center sm:items-start gap-2">
                <div className="w-24 h-28 border-2 border-[#00288e] rounded-lg overflow-hidden bg-slate-100 shadow-xs">
                  <img src={avatar} alt="Candidate" className="w-full h-full object-cover" />
                </div>
                <div className="text-center w-24">
                  <span className="inline-block text-[10px] font-mono font-bold text-[#00563a] bg-[#ECFDF5] border border-[#A7F3D0] px-1 py-0.5 rounded w-full">
                    BIOMETRIC OK
                  </span>
                </div>
              </div>

              {/* Candidate Info Table */}
              <div className="sm:col-span-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                <div>
                  <span className="text-[#757684] text-[10px] block uppercase font-medium">Candidate Name</span>
                  <span className="font-bold text-[#131b2e] text-sm">{studentName}</span>
                </div>
                <div>
                  <span className="text-[#757684] text-[10px] block uppercase font-medium">AKTU University Roll No</span>
                  <span className="font-mono font-bold text-[#00288e] text-sm">{universityRollNo}</span>
                </div>
                <div>
                  <span className="text-[#757684] text-[10px] block uppercase font-medium">College Registration No</span>
                  <span className="font-mono font-bold text-[#131b2e] text-xs">{collegeRegNo}</span>
                </div>
                <div>
                  <span className="text-[#757684] text-[10px] block uppercase font-medium">AKTU College Code</span>
                  <span className="font-semibold text-[#131b2e] text-xs">010 (SRMS CET, Bareilly)</span>
                </div>
                <div>
                  <span className="text-[#757684] text-[10px] block uppercase font-medium">Programme & Branch</span>
                  <span className="font-semibold text-[#131b2e]">B.Tech Computer Science & Engineering</span>
                </div>
                <div>
                  <span className="text-[#757684] text-[10px] block uppercase font-medium">Semester / Year</span>
                  <span className="font-semibold text-[#131b2e]">Semester V / VI (3rd Year)</span>
                </div>
                <div>
                  <span className="text-[#757684] text-[10px] block uppercase font-medium">Examination Center</span>
                  <span className="font-semibold text-[#131b2e]">Center 010 • Main Campus Auditorium Kiosk</span>
                </div>
                <div>
                  <span className="text-[#757684] text-[10px] block uppercase font-medium">Proctoring Code</span>
                  <span className="font-mono font-semibold text-[#0051d5]">GATEWAY-SLOT-B2-KIOSK42</span>
                </div>
              </div>
            </div>

            {/* Examination Schedule Table */}
            <div>
              <h4 className="text-xs font-bold text-[#00288e] uppercase tracking-wide mb-1.5 flex items-center justify-between">
                <span>Course Schedule & Allocated Assessment Slots</span>
                <span className="text-[10px] text-[#757684] font-normal">All 6 Enrolled Subjects</span>
              </h4>
              <div className="overflow-x-auto border border-[#c4c5d5] rounded-lg">
                <table className="w-full text-[11px] text-left">
                  <thead className="bg-[#f2f3ff] text-[#00288e] border-b border-[#c4c5d5] font-bold">
                    <tr>
                      <th className="py-1.5 px-2">Sub Code</th>
                      <th className="py-1.5 px-2">Course Title</th>
                      <th className="py-1.5 px-2">Date</th>
                      <th className="py-1.5 px-2">Time Slot</th>
                      <th className="py-1.5 px-2">Assigned Kiosk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#c4c5d5]/50">
                    {EXAM_SUBJECT_SCHEDULE.map((s, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#faf8ff]'}>
                        <td className="py-1.5 px-2 font-mono font-bold text-[#00288e]">{s.code}</td>
                        <td className="py-1.5 px-2 font-semibold text-[#131b2e]">{s.name}</td>
                        <td className="py-1.5 px-2 font-mono text-[#444653]">{s.date}</td>
                        <td className="py-1.5 px-2 font-mono text-[#444653]">{s.time}</td>
                        <td className="py-1.5 px-2 text-[#00563a] font-medium">{s.venue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Instructions & Code of Conduct */}
            <div className="bg-[#f2f3ff] p-3 rounded-lg border border-[#c4c5d5]/60 text-[10px] space-y-1 text-[#444653]">
              <p className="font-bold text-[#131b2e] text-[11px]">CRITICAL EXAMINATION INSTRUCTIONS:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Candidates must present this Admit Card along with their official University RFID Physical Card.</li>
                <li>Candidate identity will be re-verified biometrically via the Neural Facial IR Gateway camera before entering kiosk mode.</li>
                <li>Leaving the application, opening other tabs, or attempting split screens will trigger an immediate auto-submission flag.</li>
                <li>Calculators and scratch notes are provided within the integrated Digital Scratchpad modal.</li>
              </ul>
            </div>

            {/* Official Signatures & Seal */}
            <div className="pt-3 flex items-end justify-between text-center border-t border-[#c4c5d5]">
              <div className="space-y-1">
                <div className="w-24 border-b border-slate-700 h-6 mx-auto"></div>
                <span className="text-[10px] font-semibold text-[#757684] block">
                  Candidate Signature
                </span>
              </div>
              <div className="space-y-1">
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-[#00288e] mx-auto flex items-center justify-center text-[9px] font-bold text-[#00288e] uppercase">
                  OFFICIAL SEAL
                </div>
                <span className="text-[9px] text-[#757684] block">SRMS Pariksha Controller</span>
              </div>
              <div className="space-y-1">
                <div className="font-mono text-xs text-[#00288e] font-bold h-6 flex items-end justify-center">
                  Dr. P. K. Sharma
                </div>
                <span className="text-[10px] font-semibold text-[#131b2e] block border-t border-slate-700 pt-0.5">
                  Controller of Examinations
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-[#faf8ff] border-t border-[#c4c5d5]/50 flex items-center justify-between flex-shrink-0">
          <span className="text-[11px] text-[#757684]">
            Document Hash: SHA-256 e4b2d8f991c01e6a...
          </span>
          <button
            onClick={handlePrintPDF}
            className="px-4 py-1.5 rounded-lg bg-[#00288e] text-white text-xs font-bold hover:bg-[#1e40af] flex items-center gap-1.5 shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
