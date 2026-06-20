import React from 'react';
import { useStore } from '@/store/useStore';

export function ThemeToggle() {
  const theme = useStore((state) => state.theme);
  const toggleTheme = useStore((state) => state.toggleTheme);
  
  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-lg transition-all duration-300 ${
        theme === 'dark'
          ? 'bg-dark-card hover:bg-dark-accent1'
          : 'bg-light-card hover:bg-light-accent1/20'
      }`}
      title={theme === 'dark' ? '切换到浅色主题' : '切换到深色主题'}
    >
      <span className="text-xl">
        {theme === 'dark' ? '☀️' : '🌙'}
      </span>
    </button>
  );
}