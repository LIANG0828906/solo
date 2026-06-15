import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useApp } from '../state/store';

export const ThemeToggle: React.FC = () => {
  const { state, dispatch } = useApp();
  const isDark = state.theme === 'dark';

  return (
    <button
      onClick={() => dispatch({ type: 'TOGGLE_THEME' })}
      aria-label={isDark ? '切换到亮色模式' : '切换到暗色模式'}
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 1000,
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: 'var(--card-bg)',
        color: 'var(--text-primary)',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid var(--border-color)',
      }}
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
};
