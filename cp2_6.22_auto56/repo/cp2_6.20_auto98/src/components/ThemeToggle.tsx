import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  mode: 'light' | 'dark';
  onToggle: () => void;
}

export default function ThemeToggle({ mode, onToggle }: ThemeToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'relative w-12 h-12 rounded-full flex items-center justify-center',
        'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700',
        'transition-all duration-300 ease-in-out',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7c5cfc] dark:focus:ring-offset-gray-900'
      )}
      aria-label={mode === 'light' ? '切换到深色模式' : '切换到浅色模式'}
    >
      <div className="relative w-5 h-5">
        <Sun
          className={cn(
            'absolute inset-0 w-5 h-5 text-yellow-500 transition-all duration-300',
            mode === 'light'
              ? 'opacity-100 rotate-0 scale-100'
              : 'opacity-0 rotate-90 scale-0'
          )}
        />
        <Moon
          className={cn(
            'absolute inset-0 w-5 h-5 text-blue-400 transition-all duration-300',
            mode === 'dark'
              ? 'opacity-100 rotate-0 scale-100'
              : 'opacity-0 -rotate-90 scale-0'
          )}
        />
      </div>
    </button>
  );
}
