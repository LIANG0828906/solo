import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
}

export default function ThemeToggle({ isDark, onToggle }: ThemeToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out hover:scale-110"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        color: 'var(--text-primary)',
      }}
      aria-label={isDark ? '切换到亮色主题' : '切换到暗色主题'}
    >
      <div className="relative w-6 h-6">
        <Sun
          className={`absolute inset-0 transition-all duration-300 ease-in-out ${
            isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
          }`}
          size={24}
          style={{ color: '#FFB347' }}
        />
        <Moon
          className={`absolute inset-0 transition-all duration-300 ease-in-out ${
            isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
          }`}
          size={24}
          style={{ color: '#4A90D9' }}
        />
      </div>
    </button>
  );
}
