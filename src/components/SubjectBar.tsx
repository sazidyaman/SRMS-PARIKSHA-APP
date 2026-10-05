import React from 'react';
import { SubjectKey } from '../types';
import { SUBJECT_DATA } from '../data/subjects';

interface SubjectBarProps {
  selectedSubject: SubjectKey;
  onSelectSubject: (key: SubjectKey) => void;
  title?: string;
  compact?: boolean;
}

const ALL_SUBJECT_KEYS: SubjectKey[] = ['DAA', 'DBMS', 'WT', 'MLT', 'DA', 'COI'];

export const SubjectBar: React.FC<SubjectBarProps> = ({
  selectedSubject,
  onSelectSubject,
  title = 'Select Subject Course',
  compact = false,
}) => {
  return (
    <div className={`w-full ${compact ? 'py-1' : 'py-2'}`}>
      <div className="flex items-center justify-between mb-1.5 px-0.5">
        <span className="text-[11px] font-semibold tracking-wider text-[#757684] uppercase">
          {title}
        </span>
        <span className="text-[11px] text-[#00288e] font-medium font-mono">
          {SUBJECT_DATA[selectedSubject].code} • {SUBJECT_DATA[selectedSubject].shortName}
        </span>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {ALL_SUBJECT_KEYS.map((key) => {
          const sub = SUBJECT_DATA[key];
          const isSelected = selectedSubject === key;

          return (
            <button
              key={key}
              onClick={() => onSelectSubject(key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 active:scale-95 ${
                isSelected
                  ? 'bg-[#00288e] text-white shadow-xs'
                  : 'bg-[#eaedff] text-[#444653] hover:bg-[#dae2fd] hover:text-[#131b2e]'
              }`}
            >
              <span className="font-mono text-[10px] opacity-75">{sub.code}</span>
              <span>{sub.shortName}</span>
              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#85f8c4]" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
