import React, { useState } from 'react';

interface AdmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdmissionModal: React.FC<AdmissionModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'contact' | 'preregistration' | 'documents' | 'fees'>('contact');
  
  // Interactive Pre-Registration Form State
  const [candidateName, setCandidateName] = useState('');
  const [candidatePhone, setCandidatePhone] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('B.Tech - Computer Science & Engineering (CSE)');
  const [candidateCity, setCandidateCity] = useState('');
  const [candidateScore, setCandidateScore] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRefNo, setSubmittedRefNo] = useState<string | null>(null);

  // Document checklist toggle state
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const COLLEGE_URL = 'https://srms.ac.in/cet/';

  const LANDLINE_NUMBERS = [
    { display: '0581-2582246', tel: '05812582246' },
    { display: '0581-2582249', tel: '05812582249' },
    { display: '0581-2582331', tel: '05812582331' },
    { display: '0581-2582332', tel: '05812582332' },
    { display: '0581-2582330', tel: '05812582330' },
  ];

  const HELPLINE_NUMBERS = [
    { display: '+91-7900553000', tel: '+917900553000' },
    { display: '+91-9458702000', tel: '+919458702000' },
    { display: '+91-7895982000', tel: '+917895982000' },
    { display: '9458705720', tel: '+919458705720' },
    { display: '+91-7055999555', tel: '+917055999555' },
  ];

  const DOCUMENT_CHECKLIST = [
    { id: 'doc-1', title: '10th Mark Sheet & Passing Certificate', desc: 'Original + 3 attested photocopies for DOB verification', mandatory: true },
    { id: 'doc-2', title: '12th Mark Sheet & Passing Certificate', desc: 'Original + 3 attested photocopies (Physics, Math, Chem/CS)', mandatory: true },
    { id: 'doc-3', title: 'AKTU / JEE Main Scorecard & Admit Card', desc: 'Proof of entrance score and percentile rank', mandatory: true },
    { id: 'doc-4', title: 'Seat Allotment Letter', desc: 'Official letter issued during UPSEE/UPTAC Centralized Counseling', mandatory: false },
    { id: 'doc-5', title: 'Transfer Certificate (TC) & Migration Certificate', desc: 'In original from the last attended school/college', mandatory: true },
    { id: 'doc-6', title: 'Character Certificate', desc: 'Issued by the Principal/Head of the last attended institution', mandatory: true },
    { id: 'doc-7', title: 'Category / Caste Certificate (OBC / SC / ST / EWS)', desc: 'Valid state/central certificate issued within 6 months if applicable', mandatory: false },
    { id: 'doc-8', title: 'Domicile Certificate', desc: 'Mandatory for candidates claiming UP state quota seats', mandatory: false },
    { id: 'doc-9', title: 'Annual Income Certificate', desc: 'For students applying for Tuition Fee Waiver (FW) or scholarship schemes', mandatory: false },
    { id: 'doc-10', title: 'Aadhaar Card (Student & Parents)', desc: 'Photocopies of National Identity Card', mandatory: true },
    { id: 'doc-11', title: '8 Recent Color Photographs', desc: 'Passport size with light background and formal attire', mandatory: true },
    { id: 'doc-12', title: 'Medical Fitness Certificate', desc: 'Certified by a Registered Medical Practitioner (MBBS)', mandatory: true },
    { id: 'doc-13', title: 'Anti-Ragging Undertaking Affidavits', desc: 'Student and Parent affidavits on non-judicial stamp paper as per UGC norms', mandatory: true },
  ];

  const handlePreRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateName.trim() || !candidatePhone.trim()) return;

    setIsSubmitting(true);
    const refNo = `SRMS-ADM-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    setTimeout(() => {
      try {
        const existing = JSON.parse(localStorage.getItem('srms_pre_registrations') || '[]');
        existing.unshift({
          refNo,
          name: candidateName.trim(),
          phone: candidatePhone.trim(),
          email: candidateEmail.trim(),
          course: selectedCourse,
          city: candidateCity.trim(),
          score: candidateScore.trim(),
          submittedAt: new Date().toISOString(),
        });
        localStorage.setItem('srms_pre_registrations', JSON.stringify(existing));
      } catch {}

      setIsSubmitting(false);
      setSubmittedRefNo(refNo);
    }, 600);
  };

  const toggleDoc = (id: string) => {
    setCheckedDocs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-[#c4c5d5] flex flex-col max-h-[92vh] my-auto">
        {/* Institutional Modal Header */}
        <div className="bg-gradient-to-r from-[#00288e] via-[#001f70] to-[#001448] text-white p-4 sm:p-5 flex items-start justify-between flex-shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/20 shadow-xs flex-shrink-0">
              <span className="material-symbols-outlined text-[26px] text-amber-300">account_balance</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold tracking-tight">
                  SRMS College of Engineering & Technology
                </h2>
                <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-bold">
                  AKTU Code 010
                </span>
              </div>
              <p className="text-xs text-blue-100/90 mt-0.5">
                Approved by AICTE • Affiliated to Dr. A.P.J. Abdul Kalam Technical University, Lucknow
              </p>
              <p className="text-[11px] text-amber-200 font-semibold mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Admissions & Pre-Registration Open for Upcoming Academic Sessions</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={COLLEGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 text-[#001448] hover:bg-amber-300 text-xs font-bold transition-all shadow-xs active:scale-95"
              title="Open Official Website in New Window"
            >
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              <span>Visit Website</span>
            </a>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              title="Close Dialog"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Official Website Fast-Action Banner on Mobile */}
        <div className="sm:hidden bg-[#eaedff] px-4 py-2 border-b border-[#c4c5d5]/50 flex items-center justify-between">
          <span className="text-xs font-semibold text-[#00288e]">Official College Portal</span>
          <a
            href={COLLEGE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#00288e] bg-white px-2.5 py-1 rounded-md border border-[#c4c5d5]"
          >
            <span>srms.ac.in/cet</span>
            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
          </a>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-[#f2f3ff] px-3 sm:px-5 pt-2 border-b border-[#c4c5d5]/60 flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar flex-shrink-0">
          <button
            onClick={() => setActiveTab('contact')}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'contact'
                ? 'bg-white text-[#00288e] border-[#00288e] shadow-xs'
                : 'text-[#444653] border-transparent hover:text-[#00288e]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">contact_phone</span>
            <span>Reach Us & Helplines</span>
          </button>

          <button
            onClick={() => setActiveTab('preregistration')}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'preregistration'
                ? 'bg-white text-[#00288e] border-[#00288e] shadow-xs'
                : 'text-[#444653] border-transparent hover:text-[#00288e]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
            <span>Pre-Registration (2025–26)</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'documents'
                ? 'bg-white text-[#00288e] border-[#00288e] shadow-xs'
                : 'text-[#444653] border-transparent hover:text-[#00288e]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">description</span>
            <span>Required Documents</span>
          </button>

          <button
            onClick={() => setActiveTab('fees')}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'fees'
                ? 'bg-white text-[#00288e] border-[#00288e] shadow-xs'
                : 'text-[#444653] border-transparent hover:text-[#00288e]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">payments</span>
            <span>Fees & Scholarships</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: CONTACT & REACH US */}
          {activeTab === 'contact' && (
            <div className="space-y-4">
              {/* College Official Website Highlight Box */}
              <div className="bg-gradient-to-r from-[#eaedff] to-blue-50 p-4 rounded-xl border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#00288e] text-white flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[20px]">public</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#00288e]">Official SRMS CET Bareilly Web Portal</h3>
                    <p className="text-xs text-[#444653] mt-0.5">
                      Explore academic brochures, department facilities, AICTE approvals, and campus infrastructure.
                    </p>
                    <a
                      href={COLLEGE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[#00288e] hover:underline mt-1"
                    >
                      <span>https://srms.ac.in/cet/</span>
                      <span className="material-symbols-outlined text-[14px]">launch</span>
                    </a>
                  </div>
                </div>

                <a
                  href={COLLEGE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#00288e] text-white hover:bg-[#1e40af] text-xs font-bold transition-all shadow-sm active:scale-95 flex-shrink-0"
                >
                  <span>Open College Website</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_outward</span>
                </a>
              </div>

              {/* Campus Address Card */}
              <div className="bg-white p-4 rounded-xl border border-[#c4c5d5]/70 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[20px]">location_on</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-[#757684] uppercase tracking-wider">Campus Address & Location</h4>
                    <p className="text-sm font-bold text-[#131b2e] mt-1">
                      Ram Murti Puram, 13 KM Bareilly-Nainital Road, Bhojipura, Bareilly-243202, UP, India
                    </p>
                    <p className="text-xs text-[#444653] mt-1">
                      Located conveniently on State Highway 37 (Bareilly-Nainital Highway), with 24x7 institutional transport connectivity.
                    </p>
                  </div>
                </div>
              </div>

              {/* Phone Numbers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Admission Helplines */}
                <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-emerald-700 text-[20px]">support_agent</span>
                    <div>
                      <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                        Admission Helplines (Direct / Mobile)
                      </h4>
                      <span className="text-[10px] text-emerald-800">Direct admission assistance for upcoming sessions</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {HELPLINE_NUMBERS.map((hp) => (
                      <a
                        key={hp.tel}
                        href={`tel:${hp.tel}`}
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-white border border-emerald-200 text-[#131b2e] hover:bg-emerald-50 hover:text-emerald-900 transition-colors shadow-2xs group"
                      >
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-emerald-600 group-hover:scale-110 transition-transform">
                            call
                          </span>
                          <span className="font-mono text-xs font-bold">{hp.display}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                          Tap to Call
                        </span>
                      </a>
                    ))}
                  </div>
                </div>

                {/* College Landline & Board Numbers */}
                <div className="bg-white p-4 rounded-xl border border-[#c4c5d5]/70 shadow-xs">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-[#00288e] text-[20px]">phone_in_talk</span>
                    <div>
                      <h4 className="text-xs font-bold text-[#131b2e] uppercase tracking-wide">
                        College Office & EPABX Landlines
                      </h4>
                      <span className="text-[10px] text-[#757684]">Central Registrar & Directorate PBX</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {LANDLINE_NUMBERS.map((ll) => (
                      <a
                        key={ll.tel}
                        href={`tel:${ll.tel}`}
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#faf8ff] border border-[#c4c5d5]/50 text-[#131b2e] hover:bg-[#eaedff] hover:text-[#00288e] transition-colors shadow-2xs group"
                      >
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-[#00288e] group-hover:scale-110 transition-transform">
                            dialpad
                          </span>
                          <span className="font-mono text-xs font-bold">{ll.display}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-[#00288e] bg-[#eaedff] px-2 py-0.5 rounded">
                          Call Landline
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Email & Affiliation Card */}
              <div className="bg-white p-4 rounded-xl border border-[#c4c5d5]/70 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#00288e] flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[22px]">mail</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#757684] uppercase font-bold block">Official Admissions Email</span>
                    <a
                      href="mailto:cet@srmscet.edu"
                      className="text-sm font-bold text-[#00288e] hover:underline font-mono"
                    >
                      cet@srmscet.edu
                    </a>
                  </div>
                </div>

                <a
                  href="mailto:cet@srmscet.edu?subject=Admission%20Inquiry%20for%20SRMS%20CET%20Session%202025-26"
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#00288e] text-[#00288e] hover:bg-[#eaedff] text-xs font-bold transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  <span>Send Email Inquiry</span>
                </a>
              </div>
            </div>
          )}

          {/* TAB 2: PRE-REGISTRATION (2025–26 / UPCOMING SESSIONS) */}
          {activeTab === 'preregistration' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-300 p-3.5 rounded-xl flex items-start gap-3">
                <span className="material-symbols-outlined text-emerald-700 text-[22px] flex-shrink-0 mt-0.5">
                  verified
                </span>
                <div>
                  <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                    Pre-Registration Desk for Academic Session 2025–26 & 2026–27
                  </h4>
                  <p className="text-xs text-emerald-800 mt-0.5 leading-snug">
                    Submit your provisional candidate details below to lock your counseling rank, receive institutional brochure updates, and secure pre-screening confirmation before AKTU/UPTAC counseling rounds.
                  </p>
                </div>
              </div>

              {submittedRefNo ? (
                <div className="p-6 bg-white rounded-xl border border-emerald-400 text-center space-y-3 animate-fade-in shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <span className="material-symbols-outlined text-[28px]">check_circle</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-emerald-950">Pre-Registration Successfully Recorded!</h3>
                    <p className="text-xs text-[#444653] mt-1">
                      Your provisional application token has been registered in the SRMS Admission Directorate database.
                    </p>
                  </div>
                  <div className="bg-slate-50 border border-dashed border-slate-300 p-3 rounded-lg max-w-sm mx-auto font-mono text-xs">
                    <span className="text-[#757684] block text-[11px]">Application Reference Token:</span>
                    <strong className="text-sm text-[#00288e] select-all font-bold">{submittedRefNo}</strong>
                  </div>
                  <p className="text-xs text-[#757684]">
                    Our admission counselor will reach out to you via call/email with the merit verification schedule.
                  </p>
                  <div className="pt-2 flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSubmittedRefNo(null)}
                      className="px-3 py-1.5 rounded-lg border border-[#c4c5d5] text-xs font-semibold hover:bg-slate-50"
                    >
                      Submit Another Application
                    </button>
                    <a
                      href={COLLEGE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-lg bg-[#00288e] text-white text-xs font-bold hover:bg-[#1e40af]"
                    >
                      Explore SRMS CET Website
                    </a>
                  </div>
                </div>
              ) : (
                <form onSubmit={handlePreRegisterSubmit} className="bg-white p-4 sm:p-5 rounded-xl border border-[#c4c5d5]/70 space-y-3.5 shadow-xs">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-sm font-bold text-[#131b2e] flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-[#00288e]">badge</span>
                      <span>Candidate Pre-Registration Application</span>
                    </h3>
                    <span className="text-[10px] font-mono text-[#00563a] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Session 2025–26
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-[#444653] block mb-1">
                        Student Full Name <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={candidateName}
                        onChange={(e) => setCandidateName(e.target.value)}
                        placeholder="e.g. Aryan Mehrotra"
                        className="w-full text-xs p-2.5 rounded-lg border border-[#c4c5d5] bg-white focus:ring-1 focus:ring-[#00288e] outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[#444653] block mb-1">
                        Mobile Number (WhatsApp) <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={candidatePhone}
                        onChange={(e) => setCandidatePhone(e.target.value)}
                        placeholder="+91 9876543210"
                        className="w-full text-xs p-2.5 rounded-lg border border-[#c4c5d5] bg-white focus:ring-1 focus:ring-[#00288e] outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[#444653] block mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={candidateEmail}
                        onChange={(e) => setCandidateEmail(e.target.value)}
                        placeholder="candidate@gmail.com"
                        className="w-full text-xs p-2.5 rounded-lg border border-[#c4c5d5] bg-white focus:ring-1 focus:ring-[#00288e] outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[#444653] block mb-1">
                        Program Interested
                      </label>
                      <select
                        value={selectedCourse}
                        onChange={(e) => setSelectedCourse(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-lg border border-[#c4c5d5] bg-white focus:ring-1 focus:ring-[#00288e] outline-none"
                      >
                        <option>B.Tech - Computer Science & Engineering (CSE)</option>
                        <option>B.Tech - Artificial Intelligence & ML (AIML)</option>
                        <option>B.Tech - Information Technology (IT)</option>
                        <option>B.Tech - Electronics & Communication (EC)</option>
                        <option>B.Tech - Electrical & Electronics (EN)</option>
                        <option>B.Tech - Mechanical Engineering (ME)</option>
                        <option>Master of Computer Applications (MCA)</option>
                        <option>Master of Business Administration (MBA)</option>
                        <option>M.Tech - Advanced Computing / Systems</option>
                        <option>B.Pharm / M.Pharm (Pharmacy)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[#444653] block mb-1">
                        Current City & State
                      </label>
                      <input
                        type="text"
                        value={candidateCity}
                        onChange={(e) => setCandidateCity(e.target.value)}
                        placeholder="e.g. Bareilly, UP"
                        className="w-full text-xs p-2.5 rounded-lg border border-[#c4c5d5] bg-white focus:ring-1 focus:ring-[#00288e] outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[#444653] block mb-1">
                        12th % / JEE Main Percentile / Rank
                      </label>
                      <input
                        type="text"
                        value={candidateScore}
                        onChange={(e) => setCandidateScore(e.target.value)}
                        placeholder="e.g. 88.4% PCM / 91.2 Percentile"
                        className="w-full text-xs p-2.5 rounded-lg border border-[#c4c5d5] bg-white focus:ring-1 focus:ring-[#00288e] outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-3">
                    <p className="text-[11px] text-[#757684]">
                      By submitting, you consent to receive admission updates from SRMS CET Bareilly.
                    </p>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 rounded-xl bg-[#00288e] hover:bg-[#1e40af] text-white text-xs font-bold shadow-md active:scale-95 transition-all flex items-center gap-1.5 flex-shrink-0 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          <span>Recording...</span>
                        </>
                      ) : (
                        <>
                          <span>Submit Pre-Registration</span>
                          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: REQUIRED DOCUMENTS CHECKLIST */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-300 p-3.5 rounded-xl flex items-start gap-3">
                <span className="material-symbols-outlined text-amber-700 text-[22px] flex-shrink-0 mt-0.5">
                  fact_check
                </span>
                <div>
                  <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                    Mandatory Verification Documents Checklist
                  </h4>
                  <p className="text-xs text-amber-900 mt-0.5 leading-snug">
                    Candidates must bring the original documents along with 3 sets of self-attested photocopies during physical reporting at the Central Admission Cell, SRMS CET Bareilly.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {DOCUMENT_CHECKLIST.map((doc) => {
                  const isChecked = Boolean(checkedDocs[doc.id]);
                  return (
                    <label
                      key={doc.id}
                      onClick={() => toggleDoc(doc.id)}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-emerald-50/70 border-emerald-300'
                          : 'bg-white border-[#c4c5d5]/60 hover:bg-[#faf8ff]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleDoc(doc.id)}
                        className="mt-0.5 rounded text-[#00288e] focus:ring-[#00288e]"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${isChecked ? 'text-emerald-900' : 'text-[#131b2e]'}`}>
                            {doc.title}
                          </span>
                          {doc.mandatory ? (
                            <span className="text-[10px] font-bold uppercase bg-red-100 text-red-800 px-1.5 py-0.2 rounded">
                              Mandatory
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#757684] bg-slate-100 px-1.5 py-0.2 rounded">
                              If Applicable
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#444653] mt-0.5 leading-snug">{doc.desc}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: FEES & SCHOLARSHIPS */}
          {activeTab === 'fees' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40">
                  <span className="text-[10px] text-[#757684] uppercase font-bold block">Academic Tuition</span>
                  <div className="text-lg font-bold text-[#00288e] mt-0.5">As per AFRC / AKTU</div>
                  <p className="text-[11px] text-[#444653] mt-1">
                    Structured as per Uttar Pradesh Fee Regulatory Committee guidelines.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40">
                  <span className="text-[10px] text-[#757684] uppercase font-bold block">Hostel & Fooding</span>
                  <div className="text-lg font-bold text-emerald-900 mt-0.5">Separate AC / Non-AC</div>
                  <p className="text-[11px] text-[#444653] mt-1">
                    Hygienic vegetarian dining, Wi-Fi campus, gym, laundry & sports complex.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/40">
                  <span className="text-[10px] text-[#757684] uppercase font-bold block">Merit Scholarship</span>
                  <div className="text-lg font-bold text-purple-900 mt-0.5">Up to ₹3.5+ Crores</div>
                  <p className="text-[11px] text-[#444653] mt-1">
                    Dr. Ram Murti Smriti Trust Scholarships disbursed annually to rankers.
                  </p>
                </div>
              </div>

              {/* Fee Payment Modes */}
              <div className="bg-white p-4 rounded-xl border border-[#c4c5d5]/70 space-y-3">
                <h4 className="text-xs font-bold text-[#131b2e] uppercase tracking-wide flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-[#00288e]">account_balance_wallet</span>
                  <span>Approved Modes of Fee Payment</span>
                </h4>

                <div className="space-y-2 text-xs text-[#444653]">
                  <div className="p-2.5 rounded-lg bg-[#faf8ff] border border-[#c4c5d5]/40 flex items-start gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#00288e]">credit_card</span>
                    <div>
                      <strong className="text-[#131b2e]">Online Payment Gateway:</strong> Credit Card, Debit Card, Net Banking, and UPI via the official SRMS ERP portal.
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#faf8ff] border border-[#c4c5d5]/40 flex items-start gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#00288e]">receipt_long</span>
                    <div>
                      <strong className="text-[#131b2e]">Demand Draft (DD):</strong> Drawn in favor of <span className="font-mono font-bold text-[#00288e]">"SRMS CET"</span> payable at <strong className="text-[#131b2e]">Bareilly</strong>.
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#faf8ff] border border-[#c4c5d5]/40 flex items-start gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#00288e]">currency_rupee</span>
                    <div>
                      <strong className="text-[#131b2e]">RTGS / NEFT Transfer:</strong> Available through institute bank credentials provided by the Accounts Office.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Institutional Footer */}
        <div className="bg-[#faf8ff] px-4 py-3 border-t border-[#c4c5d5]/60 flex flex-col sm:flex-row items-center justify-between gap-2.5 flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-[#757684]">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Helpline Desk: <strong>+91-7900553000</strong></span>
            <span>•</span>
            <span className="font-mono">cet@srmscet.edu</span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={COLLEGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-lg bg-[#00288e] text-white hover:bg-[#1e40af] text-xs font-bold transition-all shadow-xs flex items-center gap-1 active:scale-95"
            >
              <span>Visit Official Website (srms.ac.in/cet)</span>
              <span className="material-symbols-outlined text-[15px]">open_in_new</span>
            </a>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-[#c4c5d5] text-[#444653] hover:bg-slate-100 text-xs font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
