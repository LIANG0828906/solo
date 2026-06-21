import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

function getInitialTheme(): Theme {
  const saved = localStorage.getItem('coedit-theme') as Theme | null;
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('coedit-theme', theme);
  }, [theme]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('coedit-theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return { isDark: theme === 'dark', toggle };
}
