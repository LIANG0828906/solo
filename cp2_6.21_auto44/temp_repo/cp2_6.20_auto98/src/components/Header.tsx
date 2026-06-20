import React from 'react';
import { Palette, Sun, Moon, Save, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  themeMode: 'light' | 'dark';
  onThemeToggle: () => void;
  onExportClick: () => void;
  onSaveClick: () => void;
  hasPalette: boolean;
}

const Header: React.FC<HeaderProps> = ({
  themeMode,
  onThemeToggle,
  onExportClick,
  onSaveClick,
  hasPalette,
}) => {
  return (
    <header
      className="sticky top-0 z-40 w-full border-b border-gray-200/50 dark:border-gray-700/50 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl"
      style={{ backdropFilter: 'blur(12px)' }}
    >
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7c5cfc] text-white shadow-lg shadow-[#7c5cfc]/25">
            <Palette className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
              调色大师
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
              智能配色方案生成器
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onSaveClick}
            disabled={!hasPalette}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border',
              hasPalette
                ? 'border-[#7c5cfc] text-[#7c5cfc] hover:bg-[#7c5cfc] hover:text-white'
                : 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            )}
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">保存</span>
          </button>

          <button
            onClick={onExportClick}
            disabled={!hasPalette}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              hasPalette
                ? 'bg-[#7c5cfc] text-white hover:bg-[#6b4df0] shadow-md shadow-[#7c5cfc]/25'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            )}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">导出</span>
          </button>

          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

          <button
            onClick={onThemeToggle}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="切换主题"
          >
            {themeMode === 'light' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
