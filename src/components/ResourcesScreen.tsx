import React, { useState } from 'react';
import { SubjectKey, Tutorial, PreviousYearQuestion } from '../types';
import { SUBJECT_DATA } from '../data/subjects';
import { SubjectBar } from './SubjectBar';

interface ResourcesScreenProps {
  selectedSubject: SubjectKey;
  onSelectSubject: (key: SubjectKey) => void;
  tutorials: Tutorial[];
  pyqs: PreviousYearQuestion[];
  onOpenAdmitCard: () => void;
}

export const ResourcesScreen: React.FC<ResourcesScreenProps> = ({
  selectedSubject,
  onSelectSubject,
  tutorials,
  pyqs,
  onOpenAdmitCard,
}) => {
  const [resourceTab, setResourceTab] = useState<'tutorials' | 'pyqs'>('tutorials');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeVideoModal, setActiveVideoModal] = useState<Tutorial | null>(null);

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

        <button
          onClick={onOpenAdmitCard}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#00288e] text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[15px]">badge</span>
          <span className="hidden sm:inline">Admit Card</span>
          <span>PDF</span>
        </button>
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
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-[#c4c5d5] outline-none bg-[#faf8ff]"
            />
          </div>

          <div className="grid grid-cols-2 p-1 bg-[#eaedff] rounded-lg text-xs font-semibold">
            <button
              onClick={() => setResourceTab('tutorials')}
              className={`py-1.5 rounded-md flex items-center justify-center gap-1 transition-all ${
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
              className={`py-1.5 rounded-md flex items-center justify-center gap-1 transition-all ${
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
              subjectTutorials.map((tut) => (
                <div
                  key={tut.id}
                  className="bg-white p-3.5 rounded-xl border border-[#c4c5d5]/60 shadow-xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-bold text-[#00288e] bg-[#eaedff] px-1.5 py-0.5 rounded">
                          {tut.unitName}
                        </span>
                        <span className="text-[10px] font-semibold text-[#00563a] bg-[#ECFDF5] border border-[#A7F3D0] px-1.5 py-0.5 rounded">
                          {tut.difficulty}
                        </span>
                        <span className="text-[10px] text-[#757684]">• {tut.durationMinutes} min</span>
                      </div>
                      <h3 className="text-xs font-bold text-[#131b2e] leading-snug">{tut.title}</h3>
                    </div>
                  </div>

                  <p className="text-xs text-[#444653] leading-relaxed">{tut.description}</p>

                  <div className="pt-2 border-t border-[#c4c5d5]/30 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-[11px] text-[#757684]">
                      <span className="material-symbols-outlined text-[15px] text-[#00288e]">
                        account_circle
                      </span>
                      <span>{tut.authorName}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveVideoModal(tut)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#00288e] text-white text-[11px] font-semibold hover:bg-[#1e40af] transition-colors"
                      >
                        <span className="material-symbols-outlined text-[15px]">play_circle</span>
                        <span>Watch Video</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
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
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-bold text-[#00288e] bg-[#eaedff] px-1.5 py-0.5 rounded">
                          AY {paper.academicYear}
                        </span>
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

                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#eaedff] text-[#00288e] hover:bg-[#d2d9f4] text-[11px] font-semibold transition-colors"
                    >
                      <span className="material-symbols-outlined text-[15px]">file_download</span>
                      <span>Download Question PDF</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </section>
        )}
      </main>

      {/* Video Player Modal */}
      {activeVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 shadow-2xl border border-[#c4c5d5] space-y-3">
            <div className="flex items-center justify-between border-b border-[#c4c5d5]/40 pb-2">
              <h3 className="font-bold text-xs text-[#131b2e] truncate max-w-[280px]">
                {activeVideoModal.title}
              </h3>
              <button onClick={() => setActiveVideoModal(null)} className="text-[#757684]">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="w-full aspect-video bg-slate-900 rounded-xl flex items-center justify-center text-white relative overflow-hidden">
              <div className="text-center p-4 space-y-2">
                <span className="material-symbols-outlined text-4xl text-blue-400">play_circle</span>
                <p className="text-xs font-semibold">{activeVideoModal.unitName}</p>
                <p className="text-[10px] text-slate-300">
                  Lecturer: {activeVideoModal.authorName} • {activeVideoModal.durationMinutes} mins
                </p>
              </div>
            </div>

            <p className="text-xs text-[#444653] leading-relaxed">
              {activeVideoModal.description}
            </p>

            <button
              onClick={() => setActiveVideoModal(null)}
              className="w-full py-1.5 bg-[#00288e] text-white rounded-lg text-xs font-semibold"
            >
              Close Player
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
