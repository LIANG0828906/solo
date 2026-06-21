import React from 'react';
import { useEditor } from '../context/EditorContext';
import { Sun, Moon } from 'lucide-react';
import { ANIMATION, DARK_COLORS, LIGHT_COLORS } from '../constants';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useEditor();
  const isDark = theme === 'dark';
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? '切换到浅色模式' : '切换到深色模式'}
      style={{
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(148, 163, 184, 0.1)',
        color: colors.text,
        transition: `all ${ANIMATION.themeTransition}ms cubic-bezier(0.16, 1, 0.3, 1)`,
        backdropFilter: 'blur(8px)',
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.backgroundColor = 'rgba(148, 163, 184, 0.2)';
        e.currentTarget.style.transform = 'scale(1.05)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.backgroundColor = 'rgba(148, 163, 184, 0.1)';
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '20px',
          height: '20px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isDark ? 1 : 0,
            transform: isDark ? 'rotate(0deg) scale(1)' : 'rotate(-90deg) scale(0.5)',
            transition: `all ${ANIMATION.themeTransition}ms ease`,
          }}
        >
          <Moon size={18} strokeWidth={1.8} />
        </div>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isDark ? 0 : 1,
            transform: isDark ? 'rotate(90deg) scale(0.5)' : 'rotate(0deg) scale(1)',
            transition: `all ${ANIMATION.themeTransition}ms ease`,
          }}
        >
          <Sun size={18} strokeWidth={1.8} />
        </div>
      </div>
    </button>
  );
};

export default ThemeToggle;
