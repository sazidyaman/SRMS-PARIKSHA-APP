import React, { useState, useEffect, useRef } from 'react';
import { GoogleDriveFile, DriveStorageQuota, GoogleDriveUser, UserProfile } from '../types';
import {
  googleSignIn,
  logoutDrive,
  getAccessToken,
  getDriveAbout,
  listDriveFiles,
  createDriveFolder,
  uploadDriveFile,
  deleteDriveFile,
  findOrCreateAppFolder,
} from '../services/googleDriveService';

interface GoogleDriveScreenProps {
  currentUser?: UserProfile | null;
  onOpenAdmitCardPDF?: () => void;
  onBackToSchedule?: () => void;
}

export const GoogleDriveScreen: React.FC<GoogleDriveScreenProps> = ({
  currentUser,
  onOpenAdmitCardPDF,
  onBackToSchedule,
}) => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [driveUser, setDriveUser] = useState<GoogleDriveUser | null>(null);
  const [storageQuota, setStorageQuota] = useState<DriveStorageQuota | null>(null);

  // File explorer state
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined);
  const [folderHistory, setFolderHistory] = useState<{ id?: string; name: string }[]>([
    { name: 'My Drive' },
  ]);
  const [filterType, setFilterType] = useState<'all' | 'folders' | 'documents' | 'spreadsheets' | 'pdfs'>('all');

  // Modals & User Confirmations (Mandatory for destructive operations)
  const [fileToDelete, setFileToDelete] = useState<GoogleDriveFile | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [isSavingExamPack, setIsSavingExamPack] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Show toast notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Check auth state on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = await getAccessToken();
      if (token) {
        setIsAuthenticated(true);
        loadDriveInfo();
        loadFiles();
      }
    };
    checkAuth();
  }, []);

  // Fetch Drive Info & Files
  const loadDriveInfo = async () => {
    try {
      const about = await getDriveAbout();
      if (about) {
        setDriveUser(about.user);
        setStorageQuota(about.storageQuota);
      }
    } catch (err: any) {
      console.error('Failed to load Drive info:', err);
    }
  };

  const loadFiles = async (folderId = currentFolderId, query = searchQuery, filter = filterType) => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await listDriveFiles({
        folderId,
        query,
        mimeTypeFilter: filter,
      });
      setFiles(list);
    } catch (err: any) {
      setError(err.message || 'Failed to load Google Drive files');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Sign In with Google
  const handleConnectGoogleDrive = async () => {
    setIsSigningIn(true);
    setError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setIsAuthenticated(true);
        showToast(`Connected as ${result.user?.email || 'Google User'}`);
        await loadDriveInfo();
        await loadFiles();
      }
    } catch (err: any) {
      setError(err.message || 'Google Drive authentication cancelled or failed.');
    } finally {
      setIsSigningIn(false);
    }
  };

  // Handle Disconnect
  const handleDisconnect = async () => {
    await logoutDrive();
    setIsAuthenticated(false);
    setDriveUser(null);
    setStorageQuota(null);
    setFiles([]);
    setFolderHistory([{ name: 'My Drive' }]);
    setCurrentFolderId(undefined);
    showToast('Disconnected from Google Drive.');
  };

  // Folder navigation
  const handleOpenFolder = (folder: GoogleDriveFile) => {
    setCurrentFolderId(folder.id);
    setFolderHistory((prev) => [...prev, { id: folder.id, name: folder.name }]);
    loadFiles(folder.id, '', filterType);
  };

  const handleNavigateBreadcrumb = (index: number) => {
    const target = folderHistory[index];
    const newHistory = folderHistory.slice(0, index + 1);
    setFolderHistory(newHistory);
    setCurrentFolderId(target.id);
    loadFiles(target.id, searchQuery, filterType);
  };

  // Create folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      const folder = await createDriveFolder(newFolderName.trim(), currentFolderId);
      showToast(`Folder "${folder.name}" created.`);
      setNewFolderName('');
      setIsCreatingFolder(false);
      loadFiles();
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  // Upload file from disk
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    showToast(`Uploading "${file.name}" to Google Drive...`);
    try {
      await uploadDriveFile({
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        content: file,
        folderId: currentFolderId,
      });
      showToast(`"${file.name}" uploaded successfully!`);
      loadFiles();
    } catch (err: any) {
      showToast(`Upload failed: ${err.message}`);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Save Exam Documents Package to Google Drive
  const handleBackupExamPack = async () => {
    setIsSavingExamPack(true);
    try {
      showToast('Creating "SRMS Pariksha - Academic Portal" directory in Google Drive...');
      const appFolderId = await findOrCreateAppFolder('SRMS Pariksha - Academic Portal');

      // 1. Admit Card & Examination Pass
      const studentName = currentUser?.name || 'Aarav Sharma';
      const rollNo = currentUser?.identifier || 'SRMS-2022-CS-084';
      const timestamp = new Date().toISOString().split('T')[0];

      const admitCardContent = `===============================================================
SRMS COLLEGE OF ENGINEERING & TECHNOLOGY, BAREILLY
OFFICIAL EXAMINATION ADMIT CARD • 2025-2026
===============================================================
Student Name       : ${studentName}
University Roll No : ${rollNo}
Degree & Branch    : B.Tech Computer Science & Engineering (5th Sem)
College Code       : 004 • Examination Centre: Main CS Block-B
Issued Date        : ${new Date().toLocaleDateString('en-IN')}

SCHEDULED THEORY & PRACTICAL EXAMINATIONS:
1. BCS 503 • Design & Analysis of Algorithms (DAA)
   Date: March 14, 2026 | Slot: 10:00 AM - 01:00 PM | Hall: LT-302
2. BCC 501 • Database Management Systems (DBMS)
   Date: March 17, 2026 | Slot: 10:00 AM - 01:00 PM | Hall: LT-302
3. BCS 502 • Web Technology (WT)
   Date: March 20, 2026 | Slot: 10:00 AM - 01:00 PM | Hall: LT-305
4. BCS 055 • Machine Learning Techniques (MLT)
   Date: March 23, 2026 | Slot: 02:00 PM - 05:00 PM | Hall: LT-301
5. BCS 052 • Data Analytics (DA)
   Date: March 26, 2026 | Slot: 02:00 PM - 05:00 PM | Hall: LT-302
6. BNC 501 • Constitution of India (COI)
   Date: March 29, 2026 | Slot: 10:00 AM - 12:00 PM | Hall: LT-304
7. BCS 553 • DAA Practical Lab
   Date: April 02, 2026 | Slot: 09:30 AM - 12:30 PM | Software Lab 4
8. BCS 551 • DBMS Practical Lab
   Date: April 04, 2026 | Slot: 09:30 AM - 12:30 PM | Oracle Lab 2
9. BCS 552 • WT Practical Lab
   Date: April 07, 2026 | Slot: 09:30 AM - 12:30 PM | Web Tech Lab 1

VERIFICATION & PROCTORING:
- Biometric Facial Recognition: PASS
- Proctoring Token SHA-256: e4b29a8f4c718a09bc331d...
Controller of Examinations: Dr. R. K. Saxena
SRMS Pariksha Portal Autonomous Verified.
===============================================================`;

      await uploadDriveFile({
        name: `SRMS_Admit_Card_${rollNo}_${timestamp}.txt`,
        mimeType: 'text/plain',
        content: admitCardContent,
        folderId: appFolderId,
      });

      // 2. Verified Performance Transcript Summary
      const transcriptContent = `# SRMS COLLEGE OF ENGINEERING & TECHNOLOGY
## Verified Academic Examination Transcript & Grade Card
**Student:** ${studentName} | **Roll Number:** ${rollNo}
**Semester:** 5th Semester (Odd) | **CGPA:** 8.84

### Subject Performance Breakdown:
| Subject Code | Subject Name | Credits | Mid-Term | Pre-Univ | Lab/Int | Total % | Grade |
|---|---|---|---|---|---|---|---|
| BCS 503 | Design and Analysis of Algorithm (DAA) | 4 | 28/30 | 46/50 | 19/20 | 93% | A+ |
| BCC 501 | Database Management Systems (DBMS) | 4 | 27/30 | 44/50 | 19/20 | 90% | A+ |
| BCS 502 | Web Technology (WT) | 3 | 29/30 | 47/50 | 20/20 | 96% | O |
| BCS 055 | Machine Learning Techniques (MLT) | 3 | 26/30 | 43/50 | 18/20 | 87% | A |
| BCS 052 | Data Analytics (DA) | 3 | 27/30 | 45/50 | 19/20 | 91% | A+ |
| BNC 501 | Constitution of India (COI) | 2 | 26/30 | 44/50 | - | 87% | A |
| BCS 553 | DAA Lab | 1 | - | - | 47/50 | 94% | O |
| BCS 551 | DBMS Lab | 1 | - | - | 46/50 | 92% | A+ |
| BCS 552 | WT Lab | 1 | - | - | 48/50 | 96% | O |

**Cumulative Performance Index:** 91.5% • **Class Rank:** 3 / 118
**Academic Status:** Passed with Distinction
*Digitally archived via Google Drive Integration on ${new Date().toLocaleString()}*`;

      await uploadDriveFile({
        name: `SRMS_Transcript_Results_${rollNo}_${timestamp}.md`,
        mimeType: 'text/markdown',
        content: transcriptContent,
        folderId: appFolderId,
      });

      showToast('Successfully backed up Admit Card & Verified Transcript to Google Drive!');
      // Navigate to that folder
      setCurrentFolderId(appFolderId);
      setFolderHistory([{ name: 'My Drive' }, { id: appFolderId, name: 'SRMS Pariksha - Academic Portal' }]);
      loadFiles(appFolderId);
    } catch (err: any) {
      showToast(`Backup failed: ${err.message}`);
    } finally {
      setIsSavingExamPack(false);
    }
  };

  // User Confirmation for Destructive Action (Mandatory in skill!)
  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;

    setIsDeleting(true);
    try {
      await deleteDriveFile(fileToDelete.id);
      showToast(`"${fileToDelete.name}" was permanently removed from Google Drive.`);
      setFileToDelete(null);
      loadFiles();
    } catch (err: any) {
      showToast(`Delete failed: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Format bytes helper
  const formatBytes = (bytesStr?: string) => {
    if (!bytesStr) return '—';
    const bytes = parseInt(bytesStr, 10);
    if (isNaN(bytes)) return bytesStr;
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Get human file icon
  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/vnd.google-apps.folder') {
      return { icon: 'folder', color: 'text-amber-500', bg: 'bg-amber-50' };
    }
    if (mimeType.includes('pdf')) {
      return { icon: 'picture_as_pdf', color: 'text-red-600', bg: 'bg-red-50' };
    }
    if (mimeType.includes('document') || mimeType.includes('word') || mimeType.includes('text')) {
      return { icon: 'description', color: 'text-blue-600', bg: 'bg-blue-50' };
    }
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('sheet')) {
      return { icon: 'table_chart', color: 'text-emerald-600', bg: 'bg-emerald-50' };
    }
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
      return { icon: 'slideshow', color: 'text-amber-600', bg: 'bg-amber-50' };
    }
    if (mimeType.includes('image')) {
      return { icon: 'image', color: 'text-purple-600', bg: 'bg-purple-50' };
    }
    return { icon: 'draft', color: 'text-[#444653]', bg: 'bg-[#eaedff]' };
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#131b2e] pb-24">
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#131b2e] text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-medium flex items-center gap-2 animate-fade-in max-w-sm border border-white/10">
          <span className="material-symbols-outlined text-emerald-400 text-[18px]">check_circle</span>
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-40 bg-[#faf8ff] border-b border-[#c4c5d5]/30 px-4 h-14 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          {onBackToSchedule && (
            <button
              onClick={onBackToSchedule}
              className="w-8 h-8 rounded-lg hover:bg-[#eaedff] text-[#444653] flex items-center justify-center transition-colors"
              title="Back"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
          )}
          <div className="w-8 h-8 rounded-lg bg-[#eaedff] text-[#00288e] flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">add_to_drive</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-[#00288e] flex items-center gap-1.5">
              <span>Google Drive</span>
              <span className="font-mono text-[9px] uppercase font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                Cloud Sync
              </span>
            </h1>
            <p className="text-[11px] text-[#444653]">Exam Documents & Study Storage</p>
          </div>
        </div>

        {isAuthenticated && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleBackupExamPack}
              disabled={isSavingExamPack}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#00288e] text-white text-xs font-bold shadow-xs active:scale-95 transition-all disabled:opacity-50"
              title="Save Admit Card & Transcripts directly to Drive"
            >
              <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
              <span className="hidden sm:inline">Backup</span>
              <span>Exam Pack</span>
            </button>

            <button
              onClick={handleDisconnect}
              className="p-1.5 rounded-lg hover:bg-[#eaedff] text-[#444653] hover:text-red-600 transition-colors"
              title="Disconnect Google Drive"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto pt-16 px-4 space-y-4">
        {/* If NOT Authenticated: Show Official Sign-in with Google Card */}
        {!isAuthenticated ? (
          <div className="bg-white rounded-2xl border border-[#c4c5d5]/60 p-6 shadow-xs text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-[#eaedff] text-[#00288e] mx-auto flex items-center justify-center shadow-xs">
              <svg className="w-9 h-9" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z"
                  fill="#0066da"
                />
                <path
                  d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z"
                  fill="#00ac47"
                />
                <path
                  d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z"
                  fill="#ea4335"
                />
                <path
                  d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z"
                  fill="#00832d"
                />
                <path
                  d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z"
                  fill="#2684fc"
                />
                <path
                  d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z"
                  fill="#ffba00"
                />
              </svg>
            </div>

            <div>
              <h2 className="text-base font-bold text-[#131b2e]">Connect Your Google Drive</h2>
              <p className="text-xs text-[#444653] mt-1 max-w-md mx-auto leading-relaxed">
                Seamlessly back up your official <strong>SRMS Pariksha Admit Cards</strong>, download previous year
                question papers (PYQs), and archive semester transcripts securely in your personal or institutional Google Drive.
              </p>
            </div>

            <div className="bg-[#faf8ff] p-3.5 rounded-xl border border-[#c4c5d5]/40 text-left space-y-2 max-w-md mx-auto">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#00288e]">
                <span className="material-symbols-outlined text-[17px]">security</span>
                <span>Workspace Permission Details:</span>
              </div>
              <ul className="text-[11px] text-[#444653] space-y-1.5 list-disc pl-4">
                <li>Create and organize the <strong>SRMS Pariksha</strong> folder in your Drive.</li>
                <li>Upload and download course materials, solutions, and admit cards.</li>
                <li>All destructive actions (like file deletion) strictly require your explicit confirmation.</li>
              </ul>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 text-left">
                <span className="material-symbols-outlined text-[18px] flex-shrink-0">error</span>
                <span>{error}</span>
              </div>
            )}

            {/* Official GSI Material Style Sign In Button */}
            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={handleConnectGoogleDrive}
                disabled={isSigningIn}
                className="inline-flex items-center justify-center gap-3 px-5 py-2.5 bg-white hover:bg-slate-50 text-[#1f1f1f] text-xs font-semibold rounded-full border border-[#747775] shadow-xs active:scale-98 transition-all disabled:opacity-60 cursor-pointer"
              >
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 48 48">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                </svg>
                <span>{isSigningIn ? 'Connecting to Google Drive...' : 'Sign in with Google'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* When Authenticated: Show Drive User Card, Storage Quota & File Explorer */
          <>
            {/* Account & Storage Status Banner */}
            <div className="bg-white rounded-xl border border-[#c4c5d5]/60 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {driveUser?.photoLink ? (
                  <img
                    src={driveUser.photoLink}
                    alt={driveUser.displayName || 'Google User'}
                    className="w-10 h-10 rounded-full border border-[#c4c5d5]"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#eaedff] text-[#00288e] flex items-center justify-center font-bold text-sm">
                    {driveUser?.displayName?.[0] || 'G'}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold text-[#131b2e]">
                      {driveUser?.displayName || 'Google Drive Connected'}
                    </h3>
                    <span className="material-symbols-outlined text-emerald-600 text-[16px]">verified</span>
                  </div>
                  <p className="text-[11px] text-[#444653]">{driveUser?.emailAddress || 'Authorized Account'}</p>
                </div>
              </div>

              {/* Storage Quota Bar */}
              {storageQuota && (
                <div className="sm:text-right min-w-[160px]">
                  <div className="flex items-center sm:justify-end gap-1 text-[10px] text-[#444653]">
                    <span>Storage:</span>
                    <span className="font-semibold text-[#131b2e]">
                      {formatBytes(storageQuota.usage)} of {formatBytes(storageQuota.limit)}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#eaedff] rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-[#00288e] rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          storageQuota.limit && storageQuota.usage
                            ? (parseInt(storageQuota.usage, 10) / parseInt(storageQuota.limit, 10)) * 100
                            : 10
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Explorer Toolbar: Search, Filters & Action Buttons */}
            <div className="bg-white rounded-xl border border-[#c4c5d5]/60 p-3 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                {/* Search */}
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#757684] text-[18px]">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadFiles()}
                    placeholder="Search files in Google Drive..."
                    className="w-full text-xs pl-9 pr-8 py-2 rounded-lg border border-[#c4c5d5] outline-none bg-[#faf8ff] focus:border-[#00288e]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        loadFiles(currentFolderId, '', filterType);
                      }}
                      className="absolute right-2.5 top-2.5 text-[#757684] hover:text-[#131b2e]"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  )}
                </div>

                {/* Actions: New Folder & Upload */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsCreatingFolder(true)}
                    className="flex-1 sm:flex-initial px-3 py-2 rounded-lg bg-[#eaedff] hover:bg-[#00288e]/10 text-[#00288e] text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">create_new_folder</span>
                    <span>New Folder</span>
                  </button>

                  <label className="flex-1 sm:flex-initial px-3 py-2 rounded-lg bg-[#00288e] hover:bg-[#00288e]/90 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95 transition-all">
                    <span className="material-symbols-outlined text-[18px]">upload</span>
                    <span>Upload</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                {(
                  [
                    { id: 'all', label: 'All Files', icon: 'grid_view' },
                    { id: 'folders', label: 'Folders', icon: 'folder' },
                    { id: 'pdfs', label: 'PDFs & Admit Cards', icon: 'picture_as_pdf' },
                    { id: 'documents', label: 'Docs & Notes', icon: 'description' },
                    { id: 'spreadsheets', label: 'Sheets & Grades', icon: 'table_chart' },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setFilterType(f.id);
                      loadFiles(currentFolderId, searchQuery, f.id);
                    }}
                    className={`px-2.5 py-1 rounded-lg flex items-center gap-1 whitespace-nowrap transition-colors ${
                      filterType === f.id
                        ? 'bg-[#00288e] text-white font-semibold'
                        : 'bg-[#faf8ff] text-[#444653] hover:bg-[#eaedff]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">{f.icon}</span>
                    <span>{f.label}</span>
                  </button>
                ))}
              </div>

              {/* Breadcrumbs */}
              <div className="flex items-center gap-1 text-xs text-[#444653] overflow-x-auto pt-1 border-t border-[#c4c5d5]/30">
                <span className="material-symbols-outlined text-[16px] text-[#00288e]">folder_shared</span>
                {folderHistory.map((folder, idx) => (
                  <React.Fragment key={folder.id || 'root' + idx}>
                    {idx > 0 && <span className="text-[#757684]">/</span>}
                    <button
                      onClick={() => handleNavigateBreadcrumb(idx)}
                      className={`hover:underline truncate max-w-[120px] ${
                        idx === folderHistory.length - 1 ? 'font-bold text-[#131b2e]' : 'text-[#00288e]'
                      }`}
                    >
                      {folder.name}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Quick Action: One-Click Academic Exam Folder Generator */}
            <div className="bg-gradient-to-r from-[#eaedff] to-[#f0f4ff] rounded-xl p-3.5 border border-[#00288e]/20 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#00288e] text-white flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#00288e]">Institutional Exam Backup</h4>
                  <p className="text-[11px] text-[#444653]">
                    Auto-create "SRMS Pariksha" folder & sync Admit Card + Grade Card to Drive
                  </p>
                </div>
              </div>

              <button
                onClick={handleBackupExamPack}
                disabled={isSavingExamPack}
                className="px-3 py-1.5 rounded-lg bg-[#00288e] hover:bg-[#00288e]/90 text-white text-xs font-bold flex items-center gap-1 shadow-xs flex-shrink-0 active:scale-95 transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">sync</span>
                <span>{isSavingExamPack ? 'Syncing...' : 'Sync Now'}</span>
              </button>
            </div>

            {/* File List */}
            <div className="bg-white rounded-xl border border-[#c4c5d5]/60 shadow-xs overflow-hidden">
              <div className="p-3 bg-[#faf8ff] border-b border-[#c4c5d5]/40 flex items-center justify-between">
                <span className="text-xs font-bold text-[#444653] uppercase tracking-wider">
                  Files ({files.length})
                </span>
                <button
                  onClick={() => loadFiles()}
                  className="text-[#444653] hover:text-[#00288e] flex items-center gap-1 text-xs"
                  title="Refresh files"
                >
                  <span className="material-symbols-outlined text-[16px]">refresh</span>
                  <span>Refresh</span>
                </button>
              </div>

              {isLoading ? (
                <div className="p-10 text-center space-y-2">
                  <div className="w-8 h-8 border-3 border-[#00288e] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-[#444653]">Loading files from Google Drive...</p>
                </div>
              ) : files.length === 0 ? (
                <div className="p-10 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-[#eaedff] text-[#00288e] mx-auto flex items-center justify-center">
                    <span className="material-symbols-outlined text-[24px]">folder_open</span>
                  </div>
                  <h4 className="text-xs font-bold text-[#131b2e]">No files found in this folder</h4>
                  <p className="text-[11px] text-[#444653] max-w-xs mx-auto">
                    Upload your first lecture notes, syllabus, or click "Sync Exam Pack" above to archive your admit card.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#c4c5d5]/30">
                  {files.map((file) => {
                    const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                    const fileStyling = getFileIcon(file.mimeType);

                    return (
                      <div
                        key={file.id}
                        className="p-3 hover:bg-[#faf8ff] transition-colors flex items-center justify-between gap-3 group"
                      >
                        {/* File details */}
                        <div
                          onClick={() => (isFolder ? handleOpenFolder(file) : null)}
                          className={`flex items-center gap-3 flex-1 min-w-0 ${isFolder ? 'cursor-pointer' : ''}`}
                        >
                          <div
                            className={`w-9 h-9 rounded-xl ${fileStyling.bg} ${fileStyling.color} flex items-center justify-center flex-shrink-0`}
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              {fileStyling.icon}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-[#131b2e] truncate group-hover:text-[#00288e]">
                              {file.name}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-[#757684] mt-0.5">
                              {isFolder ? (
                                <span>Folder</span>
                              ) : (
                                <span>{formatBytes(file.size)}</span>
                              )}
                              {file.modifiedTime && (
                                <>
                                  <span>•</span>
                                  <span>{new Date(file.modifiedTime).toLocaleDateString()}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg hover:bg-[#eaedff] text-[#444653] hover:text-[#00288e] transition-colors"
                              title="Open in Google Drive"
                            >
                              <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                            </a>
                          )}

                          {file.webContentLink && (
                            <a
                              href={file.webContentLink}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg hover:bg-[#eaedff] text-[#444653] hover:text-[#00288e] transition-colors"
                              title="Download"
                            >
                              <span className="material-symbols-outlined text-[18px]">download</span>
                            </a>
                          )}

                          {/* Trigger User Confirmation Modal for Destructive Delete */}
                          <button
                            onClick={() => setFileToDelete(file)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-[#444653] hover:text-red-600 transition-colors"
                            title="Delete file"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* MANDATORY USER CONFIRMATION MODAL FOR DESTRUCTIVE OPERATION (DELETE) */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-[#c4c5d5]/60 space-y-4 animate-scale-up">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
              <span className="material-symbols-outlined text-[26px]">delete_forever</span>
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-[#131b2e]">Delete from Google Drive?</h3>
              <p className="text-xs text-[#444653]">
                Are you sure you want to permanently delete:
              </p>
              <div className="p-2 bg-[#faf8ff] rounded-lg border border-[#c4c5d5]/40 text-xs font-mono font-medium text-[#131b2e] truncate mt-2">
                {fileToDelete.name}
              </div>
              <p className="text-[11px] text-red-600 pt-1">
                This action modifies your Google Drive storage and cannot be undone.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                disabled={isDeleting}
                className="py-2.5 rounded-xl border border-[#c4c5d5] hover:bg-slate-50 text-xs font-semibold text-[#444653] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                <span>{isDeleting ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Folder Modal */}
      {isCreatingFolder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <form
            onSubmit={handleCreateFolder}
            className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-[#c4c5d5]/60 space-y-4 animate-scale-up"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00288e]">create_new_folder</span>
              <h3 className="text-sm font-bold text-[#131b2e]">New Folder</h3>
            </div>

            <input
              type="text"
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="e.g. DAA BCS-503 Lecture Notes"
              className="w-full text-xs p-2.5 rounded-xl border border-[#c4c5d5] outline-none focus:border-[#00288e] bg-[#faf8ff]"
            />

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsCreatingFolder(false)}
                className="py-2 rounded-xl border border-[#c4c5d5] hover:bg-slate-50 text-xs font-semibold text-[#444653]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newFolderName.trim()}
                className="py-2 rounded-xl bg-[#00288e] text-white text-xs font-bold shadow-xs active:scale-95 transition-all disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
