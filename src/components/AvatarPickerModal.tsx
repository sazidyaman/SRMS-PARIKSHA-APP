import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';

interface AvatarPickerModalProps {
  currentUser: UserProfile | null;
  currentAvatar: string;
  onClose: () => void;
  onSave: (newAvatarUrl: string) => void;
}

interface PresetAvatar {
  id: string;
  name: string;
  category: 'student' | 'faculty' | 'admin';
  url: string;
}

const PRESET_AVATARS: PresetAvatar[] = [
  // Student Avatars
  {
    id: 'std-m1',
    name: 'Aarav (Student)',
    category: 'student',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'std-f1',
    name: 'Ananya (Student)',
    category: 'student',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'std-m2',
    name: 'Rohan (Student)',
    category: 'student',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'std-f2',
    name: 'Priya (Student)',
    category: 'student',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'std-m3',
    name: 'Kabir (Student)',
    category: 'student',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'std-f3',
    name: 'Riya (Student)',
    category: 'student',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  },

  // Faculty Avatars
  {
    id: 'fac-m1',
    name: 'Dr. Ashutosh (Faculty)',
    category: 'faculty',
    url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'fac-f1',
    name: 'Dr. Anita (Faculty)',
    category: 'faculty',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'fac-m2',
    name: 'Prof. Pradeep (Faculty)',
    category: 'faculty',
    url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'fac-f2',
    name: 'Ms. Anu (Faculty)',
    category: 'faculty',
    url: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=200&auto=format&fit=crop&q=80',
  },

  // Admin Avatars
  {
    id: 'adm-1',
    name: 'Director / Dean',
    category: 'admin',
    url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'adm-2',
    name: 'SRMS Admin Officer',
    category: 'admin',
    url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
  },
];

export const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({
  currentUser,
  currentAvatar,
  onClose,
  onSave,
}) => {
  const [selectedAvatar, setSelectedAvatar] = useState<string>(currentAvatar);
  const [activeTab, setActiveTab] = useState<'presets' | 'upload' | 'url'>('presets');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'student' | 'faculty' | 'admin'>('all');
  const [customUrl, setCustomUrl] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSuccessFeedback, setIsSuccessFeedback] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle local file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Verify file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPEG, PNG, WEBP, GIF).');
      return;
    }

    // Limit to 4MB for localStorage persistence performance
    if (file.size > 4 * 1024 * 1024) {
      setUploadError('File size exceeds 4MB. Please choose a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedAvatar(reader.result);
        setIsSuccessFeedback(true);
        setTimeout(() => setIsSuccessFeedback(false), 2000);
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read image file. Please try another photo.');
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCustomUrl = () => {
    if (!customUrl.trim()) return;
    setSelectedAvatar(customUrl.trim());
    setIsSuccessFeedback(true);
    setTimeout(() => setIsSuccessFeedback(false), 2000);
  };

  const handleSave = () => {
    onSave(selectedAvatar);
    onClose();
  };

  const filteredPresets = PRESET_AVATARS.filter((avatar) => {
    if (categoryFilter === 'all') return true;
    return avatar.category === categoryFilter;
  });

  const roleName =
    currentUser?.role === 'admin'
      ? 'Admin Officer'
      : currentUser?.role === 'faculty'
      ? 'Faculty Member'
      : 'Student Scholar';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]"
        role="dialog"
        aria-labelledby="avatar-modal-title"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#00288e] to-[#001858] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <i className="fas fa-camera text-yellow-300 text-lg"></i>
            </div>
            <div>
              <h2 id="avatar-modal-title" className="text-lg font-bold tracking-tight">
                Update Profile Avatar
              </h2>
              <p className="text-xs text-blue-100/80">
                Personalize your official portrait for ID Card, Admit Slip & Dashboard
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            title="Close"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Live Preview Bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={selectedAvatar}
                alt="Avatar Preview"
                className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-md ring-2 ring-[#00288e]/30 bg-slate-100"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';
                }}
              />
              <span className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                <i className="fas fa-check text-[10px] text-white"></i>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-800">
                  {currentUser?.name || 'User Profile'}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#00288e]/10 text-[#00288e]">
                  {roleName}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentUser?.identifier || currentUser?.email || 'SRMS Portal User'}
              </p>
              {isSuccessFeedback && (
                <p className="text-xs text-emerald-600 font-semibold animate-pulse mt-0.5">
                  <i className="fas fa-check-circle mr-1"></i> Avatar updated in preview!
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 transition-colors shadow-sm"
          >
            <i className="fas fa-upload text-blue-600"></i>
            Upload File
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-5 pt-3 gap-2 bg-white">
          <button
            onClick={() => setActiveTab('presets')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'presets'
                ? 'border-[#00288e] text-[#00288e]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <i className="fas fa-th-large"></i>
            Preset Avatars
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'upload'
                ? 'border-[#00288e] text-[#00288e]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <i className="fas fa-cloud-upload-alt"></i>
            Upload From Device
          </button>
          <button
            onClick={() => setActiveTab('url')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'url'
                ? 'border-[#00288e] text-[#00288e]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <i className="fas fa-link"></i>
            Image Link / URL
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto flex-1 bg-white">
          {/* TAB 1: PRESETS */}
          {activeTab === 'presets' && (
            <div>
              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 mb-4">
                <span className="text-xs text-slate-400 font-medium mr-1">Filter:</span>
                {(['all', 'student', 'faculty', 'admin'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                      categoryFilter === cat
                        ? 'bg-[#00288e] text-white font-bold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat === 'all' ? 'All Roles' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>

              {/* Grid of Preset Avatars */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {filteredPresets.map((avatar) => {
                  const isSelected = selectedAvatar === avatar.url;
                  return (
                    <button
                      key={avatar.id}
                      onClick={() => setSelectedAvatar(avatar.url)}
                      className={`relative flex flex-col items-center p-2 rounded-xl border transition-all text-center group ${
                        isSelected
                          ? 'border-[#00288e] bg-blue-50/50 shadow-md ring-2 ring-[#00288e]/30 scale-102'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <img
                        src={avatar.url}
                        alt={avatar.name}
                        className="w-16 h-16 rounded-full object-cover shadow-sm group-hover:scale-105 transition-transform"
                      />
                      <span className="text-[11px] font-semibold text-slate-700 mt-1.5 line-clamp-1">
                        {avatar.name.split(' ')[0]}
                      </span>
                      <span className="text-[9px] uppercase font-bold text-slate-400">
                        {avatar.category}
                      </span>
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#00288e] text-white flex items-center justify-center shadow">
                          <i className="fas fa-check text-[10px]"></i>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD */}
          {activeTab === 'upload' && (
            <div className="flex flex-col items-center justify-center py-6 px-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="avatar-file-input"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full max-w-md border-2 border-dashed border-slate-300 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-[#00288e] hover:bg-blue-50/20 transition-all text-center group"
              >
                <div className="w-16 h-16 rounded-full bg-blue-50 text-[#00288e] flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform">
                  <i className="fas fa-camera"></i>
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  Click to select a photo from your computer
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Supports JPG, PNG, WEBP or GIF formats up to 4MB. The photo is saved directly in your browser.
                </p>
                <button
                  type="button"
                  className="mt-4 px-4 py-2 bg-[#00288e] text-white text-xs font-bold rounded-lg shadow hover:bg-blue-800 transition-colors"
                >
                  <i className="fas fa-folder-open mr-1.5"></i>
                  Choose Local Photo
                </button>
              </div>

              {uploadError && (
                <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 max-w-md w-full">
                  <i className="fas fa-exclamation-circle text-red-500"></i>
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CUSTOM URL */}
          {activeTab === 'url' && (
            <div className="py-4 max-w-lg mx-auto">
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Paste Direct Web Image Address (HTTPS URL)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/my-photo.jpg"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00288e] focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleApplyCustomUrl}
                  disabled={!customUrl.trim()}
                  className="px-4 py-2 bg-[#00288e] text-white text-xs font-bold rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Preview
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Tip: You can use public image hosting links or LinkedIn/GitHub profile image addresses.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#00288e] to-blue-700 text-white text-xs font-bold shadow-md hover:from-blue-800 hover:to-blue-900 transition-all flex items-center gap-2"
            >
              <i className="fas fa-check"></i>
              Save & Apply Avatar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
