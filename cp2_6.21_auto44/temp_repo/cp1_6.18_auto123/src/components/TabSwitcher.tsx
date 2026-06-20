import React from 'react';
import { InputMode } from '../types';

interface TabSwitcherProps {
  activeTab: InputMode;
  onTabChange: (tab: InputMode) => void;
  disabled?: boolean;
}

const TABS: { key: InputMode; label: string }[] = [
  { key: 'upload', label: '上传图片' },
  { key: 'handwrite', label: '手写板' },
];

export const TabSwitcher: React.FC<TabSwitcherProps> = ({
  activeTab,
  onTabChange,
  disabled = false,
}) => {
  return (
    <div className="flex items-center justify-center gap-2 mb-4">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => !disabled && onTabChange(tab.key)}
          disabled={disabled}
          className={`
            relative px-6 py-2 text-[14px] font-medium
            transition-all duration-300 ease-out
            ${activeTab === tab.key
              ? 'text-[#6C63FF]'
              : 'text-[#888899] hover:text-[#E0E0E0]'
            }
            ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
          `}
        >
          {tab.label}
          <span
            className={`
              absolute bottom-0 left-1/2 h-0.5 bg-[#6C63FF] rounded-full
              transform -translate-x-1/2 transition-all duration-300 ease-out
              ${activeTab === tab.key ? 'w-3/4 opacity-100' : 'w-0 opacity-0'}
            `}
          />
        </button>
      ))}
    </div>
  );
};
