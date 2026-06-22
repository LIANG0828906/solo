import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useStore } from '../store/useStore';

export const ThemeToggle: React.FC = () => {
  const theme = useStore((state) => state.theme);
  const toggleTheme = useStore((state) => state.toggleTheme);
  const [isPressed, setIsPressed] = React.useState(false);

  return (
    <button
      onClick={toggleTheme}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        borderRadius: '8px',
        border: 'none',
        backgroundColor: theme.colors.secondary,
        color: theme.colors.text,
        cursor: 'pointer',
        transition: 'transform 0.1s ease, background-color 0.4s ease',
        transform: isPressed ? 'scale(0.95)' : 'scale(1)',
      }}
      aria-label="切换主题"
    >
      {theme.mode === 'light' ? (
        <Moon size={20} />
      ) : (
        <Sun size={20} />
      )}
    </button>
  );
};
