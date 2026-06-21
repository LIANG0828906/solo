import { Menu } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onThemeToggle: () => void;
  theme: 'light' | 'dark';
  onMenuClick?: () => void;
}

export default function Header({ onThemeToggle, theme, onMenuClick }: HeaderProps) {
  return (
    <header
      className={cn(
        'h-14 flex items-center justify-between px-12 text-white fixed top-0 left-0 right-0 z-40'
      )}
      style={{ backgroundColor: '#1E293B' }}
    >
      <div className="flex items-center">
        <h1 className="text-lg font-semibold">数据叙事时间线</h1>
      </div>

      <div className="flex items-center gap-4">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className={cn(
              'md:hidden w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors hover:bg-white/10 focus:outline-none'
            )}
            aria-label="打开菜单"
          >
            <Menu size={20} />
          </button>
        )}
        <ThemeToggle theme={theme} onToggle={onThemeToggle} />
      </div>
    </header>
  );
}
