import React, { useState } from 'react';
import { SubjectKey, Tutorial, PreviousYearQuestion, UserProfile } from '../types';
import { SUBJECT_DATA } from '../data/subjects';
import { SubjectBar } from './SubjectBar';

interface ResourcesScreenProps {
  selectedSubject: SubjectKey;
  onSelectSubject: (key: SubjectKey) => void;
  tutorials: Tutorial[];
  pyqs: PreviousYearQuestion[];
  onOpenAdmitCard: () => void;
  currentUser?: UserProfile | null;
}

// Fallback high-yield educational videos per subject
const SUBJECT_FALLBACK_VIDEOS: Record<SubjectKey, { videoId: string; title: string }> = {
  DAA: { videoId: '09_LlHjoEiY', title: 'Single-Source Shortest Paths on DAGs & Dijkstra' },
  DBMS: { videoId: 'kGgYpTq3T8U', title: 'Relational Decomposition: 3NF vs BCNF' },
  WT: { videoId: '8aGhZQkoFbQ', title: 'Browser Event Loop: Microtasks & Rendering' },
  MLT: { videoId: 'Q81RR3yKn30', title: 'Regularization Intuition: L1 Lasso vs L2 Ridge' },
  DA: { videoId: '0oc49DyA3hU', title: 'Inferential Statistics & Hypothesis Testing' },
  COI: { videoId: 'yWbB3yM89zY', title: 'Constitutional Remedies Article 32 & Basic Structure' },
};

function extractYouTubeId(url?: string): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i
  );
  return match ? match[1] : null;
}

export const ResourcesScreen: React.FC<ResourcesScreenProps> = ({
  selectedSubject,
  onSelectSubject,
  tutorials,
  pyqs,
  onOpenAdmitCard,
  currentUser,
}) => {
  const isStaff = currentUser?.role === 'admin' || currentUser?.role === 'faculty';
  const [resourceTab, setResourceTab] = useState<'tutorials' | 'pyqs'>('tutorials');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeVideoModal, setActiveVideoModal] = useState<Tutorial | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const currentSubject = SUBJECT_DATA[selectedSubject];

  const subjectTutorials = tutorials.filter(
    (t) =>
      t.subjectKey === selectedSubject &&
      (t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.unitName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const subjectPYQs = pyqs.filter(
    (p) =>
      p.subjectKey === selectedSubject &&
      (p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.academicYear.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCopyVideoLink = (url: string) => {
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Resolve video embed and external URL
  const getVideoDetails = (tut: Tutorial) => {
    const rawId = extractYouTubeId(tut.videoUrl);
    const fallback = SUBJECT_FALLBACK_VIDEOS[tut.subjectKey] || SUBJECT_FALLBACK_VIDEOS.DAA;
    const finalVideoId = rawId || fallback.videoId;
    const embedUrl = `https://www.youtube-nocookie.com/embed/${finalVideoId}?autoplay=1&rel=0&modestbranding=1`;
    const watchUrl = `https://www.youtube.com/watch?v=${finalVideoId}`;
    const thumbnailUrl = `https://img.youtube.com/vi/${finalVideoId}/hqdefault.jpg`;

    return {
      videoId: finalVideoId,
      embedUrl,
      watchUrl,
      thumbnailUrl,
      isDirectVideo: tut.videoUrl?.includes('.mp4') || tut.videoUrl?.includes('.webm'),
    };
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#131b2e] pb-24">
      {/* Top Header */}
      <header className="fixed top-0 left-0 w-full z-40 bg-[#faf8ff] border-b border-[#c4c5d5]/30 px-4 h-14 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#eaedff] text-[#00288e] flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">menu_book</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-[#00288e]">Faculty Tutorials & PYQs</h1>
            <p className="text-[11px] text-[#444653]">Course Prep Repository</p>
          </div>
        </div>

        {!isStaff && (
          <button
            onClick={onOpenAdmitCard}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#00288e] text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">badge</span>
            <span className="hidden sm:inline">Admit Card</span>
            <span>PDF</span>
          </button>
        )}
      </header>

      {/* Main Container */}
      <main className="max-w-md mx-auto pt-16 px-4 space-y-4">
        {/* Subject Switcher */}
        <div className="bg-white p-2.5 rounded-xl border border-[#c4c5d5]/60 shadow-xs">
          <SubjectBar
            selectedSubject={selectedSubject}
            onSelectSubject={onSelectSubject}
            title="Select Course (MLT, WT, DAA, DBMS, DA, COI)"
            compact
          />
        </div>

        {/* Search & Resource Tab Bar */}
        <div className="bg-white p-3 rounded-xl border border-[#c4c5d5]/60 shadow-xs space-y-2.5">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#757684] text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search in ${currentSubject.shortName} materials...`}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-[#c4c5d5] outline-none bg-[#faf8ff] focus:border-[#00288e]"
            />
          </div>

          <div className="grid grid-cols-2 p-1 bg-[#eaedff] rounded-lg text-xs font-semibold">
            <button
              onClick={() => setResourceTab('tutorials')}
              className={`py-1.5 rounded-md flex items-center justify-center gap-1 transition-all cursor-pointer ${
                resourceTab === 'tutorials'
                  ? 'bg-white text-[#00288e] shadow-xs font-bold'
                  : 'text-[#444653]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">video_library</span>
              <span>Tutorials ({subjectTutorials.length})</span>
            </button>
            <button
              onClick={() => setResourceTab('pyqs')}
              className={`py-1.5 rounded-md flex items-center justify-center gap-1 transition-all cursor-pointer ${
                resourceTab === 'pyqs'
                  ? 'bg-white text-[#00288e] shadow-xs font-bold'
                  : 'text-[#444653]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">history_edu</span>
              <span>Previous Papers ({subjectPYQs.length})</span>
            </button>
          </div>
        </div>

        {/* Section 1: Tutorials */}
        {resourceTab === 'tutorials' && (
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-bold text-[#131b2e] uppercase tracking-wide">
                Faculty Video Lectures & Notes
              </h2>
              <span className="text-[11px] text-[#0051d5] font-semibold">
                {currentSubject.code}: {currentSubject.shortName}
              </span>
            </div>

            {subjectTutorials.length === 0 ? (
              <div className="bg-white p-6 rounded-xl border border-[#c4c5d5] text-center text-xs text-[#757684]">
                No tutorials match your search query for {currentSubject.shortName}.
              </div>
            ) : (
              subjectTutorials.map((tut) => {
                const vid = getVideoDetails(tut);

                return (
                  <div
                    key={tut.id}
                    className="bg-white rounded-xl border border-[#c4c5d5]/60 shadow-xs overflow-hidden transition-all hover:border-[#00288e]/40"
                  >
                    {/* Video Card Banner / Thumbnail */}
                    <div
                      onClick={() => setActiveVideoModal(tut)}
                      className="relative w-full aspect-video bg-slate-900 overflow-hidden cursor-pointer group"
                    >
                      <img
                        src={vid.thumbnailUrl}
                        alt={tut.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-[#00288e]/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-red-600 transition-all">
                          <span className="material-symbols-outlined text-[28px] ml-0.5">play_arrow</span>
                        </div>
                      </div>

                      {/* Duration & Difficulty Badges */}
                      <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                        <span className="bg-black/70 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded backdrop-blur-xs">
                          {tut.durationMinutes} mins
                        </span>
                        <span className="bg-[#00288e]/90 text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider backdrop-blur-xs">
                          {tut.difficulty}
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span className="text-[10px] font-bold text-[#00288e] bg-[#eaedff] px-1.5 py-0.5 rounded">
                              {tut.unitName}
                            </span>
                            {tut.semester && (
                              <span className="text-[10px] font-semibold text-purple-800 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded">
                                {tut.semester.split('(')[0].trim()}
                              </span>
                            )}
                          </div>
                          <h3 className="text-xs font-bold text-[#131b2e] leading-snug">{tut.title}</h3>
                        </div>
                      </div>

                      <p className="text-xs text-[#444653] leading-relaxed">{tut.description}</p>

                      <div className="pt-2 border-t border-[#c4c5d5]/30 flex items-center justify-between text-xs flex-wrap gap-2">
                        <div className="flex items-center gap-1.5 text-[11px] text-[#757684]">
                          <span className="material-symbols-outlined text-[15px] text-[#00288e]">
                            account_circle
                          </span>
                          <span className="font-semibold text-slate-800">{tut.authorName}</span>
                          {tut.authorRole && (
                            <span className="text-[10px] text-slate-500 hidden sm:inline">
                              • {tut.authorRole}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {tut.pdfNotesUrl && (
                            <a
                              href={tut.pdfNotesUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[14px]">description</span>
                              <span>Notes PDF</span>
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => setActiveVideoModal(tut)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#00288e] text-white text-[11px] font-semibold hover:bg-[#1e40af] transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[15px]">play_circle</span>
                            <span>Watch Lecture</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </section>
        )}

        {/* Section 2: Previous Year Questions (PYQs) */}
        {resourceTab === 'pyqs' && (
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-bold text-[#131b2e] uppercase tracking-wide">
                Previous Year Exam Papers (PYQs)
              </h2>
              <span className="text-[11px] text-[#0051d5] font-semibold">
                {currentSubject.code}: {currentSubject.shortName}
              </span>
            </div>

            {subjectPYQs.length === 0 ? (
              <div className="bg-white p-6 rounded-xl border border-[#c4c5d5] text-center text-xs text-[#757684]">
                No question papers available for this filter.
              </div>
            ) : (
              subjectPYQs.map((paper) => (
                <div
                  key={paper.id}
                  className="bg-white p-3.5 rounded-xl border border-[#c4c5d5]/60 shadow-xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className="text-[10px] font-bold text-[#00288e] bg-[#eaedff] px-1.5 py-0.5 rounded">
                          AY {paper.academicYear}
                        </span>
                        {paper.semester && (
                          <span className="text-[10px] font-semibold text-purple-800 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded">
                            {paper.semester.split('(')[0].trim()}
                          </span>
                        )}
                        <span className="text-[10px] font-semibold text-[#444653] bg-slate-100 px-1.5 py-0.5 rounded">
                          {paper.examType}
                        </span>
                        <span className="text-[10px] text-[#757684]">
                          • {paper.totalMarks} Marks
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-[#131b2e] leading-snug">{paper.title}</h3>
                    </div>
                  </div>

                  {/* Question Stems Preview */}
                  <div className="bg-[#faf8ff] p-2.5 rounded-lg border border-[#c4c5d5]/40 space-y-1">
                    <span className="text-[10px] font-bold text-[#757684] uppercase block">
                      Extracted Question Stems:
                    </span>
                    {paper.questionsSnippet.map((q, idx) => (
                      <p key={idx} className="text-[11px] text-[#131b2e] font-mono leading-relaxed">
                        • {q}
                      </p>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-[#c4c5d5]/30 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-[#757684]">
                      Examiner: <strong>{paper.uploadedBy}</strong>
                    </span>

                    {paper.fileUrl ? (
                      <a
                        href={paper.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#00288e] text-white hover:bg-[#1e40af] text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">file_download</span>
                        <span>Open PDF Paper</span>
                      </a>
                    ) : (
                      <button
                        onClick={() => window.print()}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#eaedff] text-[#00288e] hover:bg-[#d2d9f4] text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">file_download</span>
                        <span>Download Question PDF</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </section>
        )}
      </main>

      {/* Modern Interactive Video Player Modal */}
      {activeVideoModal && (() => {
        const vid = getVideoDetails(activeVideoModal);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-4 shadow-2xl border border-[#c4c5d5] space-y-3.5 flex flex-col max-h-[92vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-[#c4c5d5]/40 pb-2.5">
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] font-bold text-[#00288e] bg-[#eaedff] px-1.5 py-0.2 rounded font-mono">
                      {activeVideoModal.subjectKey}
                    </span>
                    <span className="text-[10px] text-[#757684] truncate">
                      {activeVideoModal.unitName}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-[#131b2e] truncate">
                    {activeVideoModal.title}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveVideoModal(null)}
                  className="w-8 h-8 rounded-lg text-[#757684] hover:bg-slate-100 flex items-center justify-center cursor-pointer flex-shrink-0"
                  title="Close Video Player"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Responsive Video Player (16:9) */}
              <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-md relative">
                {vid.isDirectVideo ? (
                  <video
                    src={activeVideoModal.videoUrl}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                  >
                    Your browser does not support HTML5 video.
                  </video>
                ) : (
                  <iframe
                    src={vid.embedUrl}
                    title={activeVideoModal.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                )}
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <a
                    href={vid.watchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                    <span>Watch on YouTube</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => handleCopyVideoLink(vid.watchUrl)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      {copiedLink ? 'done' : 'link'}
                    </span>
                    <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-[#757684]">
                  <span className="font-semibold text-[#131b2e]">{activeVideoModal.authorName}</span>
                  <span>•</span>
                  <span>{activeVideoModal.durationMinutes} mins</span>
                </div>
              </div>

              {/* Description */}
              <div className="bg-[#faf8ff] p-3 rounded-xl border border-[#c4c5d5]/50 text-xs text-[#444653] leading-relaxed">
                <span className="font-bold text-[#131b2e] block mb-1">Lecture Overview:</span>
                {activeVideoModal.description}
              </div>

              <button
                onClick={() => setActiveVideoModal(null)}
                className="w-full py-2 bg-[#00288e] hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Close Player
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
