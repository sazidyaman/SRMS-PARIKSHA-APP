import React from 'react';
import { TabType, UserRole } from '../types';

interface BottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  userRole?: UserRole;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab, userRole = 'student' }) => {
  // During live exam, the specialized exam control bars take over
  if (activeTab === 'live_exam') {
    return null;
  }

  const studentNavItems: { id: TabType; label: string; icon: string }[] = [
    { id: 'schedule', label: 'Exams', icon: 'calendar_today' },
    { id: 'timetable', label: 'Timetable', icon: 'table_chart' },
    { id: 'resources', label: 'Tutorials', icon: 'menu_book' },
    { id: 'assistant', label: 'AI Tutor', icon: 'smart_toy' },
    { id: 'drive', label: 'Drive', icon: 'add_to_drive' },
    { id: 'results', label: 'Results', icon: 'analytics' },
    { id: 'profile', label: 'Profile', icon: 'person' },
  ];

  const facultyNavItems: { id: TabType; label: string; icon: string }[] = [
    { id: 'faculty_portal', label: 'Console', icon: 'co_present' },
    { id: 'timetable', label: 'Timetable', icon: 'table_chart' },
    { id: 'resources', label: 'Repository', icon: 'menu_book' },
    { id: 'assistant', label: 'AI Mentor', icon: 'smart_toy' },
    { id: 'drive', label: 'Drive', icon: 'add_to_drive' },
    { id: 'results', label: 'Analytics', icon: 'analytics' },
    { id: 'profile', label: 'Profile', icon: 'person' },
  ];

  const adminNavItems: { id: TabType; label: string; icon: string }[] = [
    { id: 'admin_portal', label: 'Admin Hub', icon: 'admin_panel_settings' },
    { id: 'timetable', label: 'Timetable', icon: 'table_chart' },
    { id: 'schedule', label: 'Exams', icon: 'quiz' },
    { id: 'resources', label: 'Resources', icon: 'menu_book' },
    { id: 'results', label: 'Analytics', icon: 'analytics' },
    { id: 'profile', label: 'Profile', icon: 'person' },
  ];

  const navItems =
    userRole === 'admin'
      ? adminNavItems
      : userRole === 'faculty'
      ? facultyNavItems
      : studentNavItems;

  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-1.5 py-1.5 bg-white border-t border-[#c4c5d5]/40 shadow-[0_-2px_6px_rgba(15,23,42,0.04)]"
    >
      {navItems.map((item) => {
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`flex flex-col items-center justify-center px-2 py-1 min-h-[44px] rounded-xl transition-all duration-150 active:scale-95 ${
              isActive
                ? 'text-[#00288e] font-semibold bg-[#eaedff]'
                : 'text-[#444653] hover:text-[#00288e]'
            }`}
          >
            <span
              className="material-symbols-outlined text-[20px]"
              style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
            >
              {item.icon}
            </span>
            <span className="text-[10px] sm:text-[11px] font-medium mt-0.5 whitespace-nowrap">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

