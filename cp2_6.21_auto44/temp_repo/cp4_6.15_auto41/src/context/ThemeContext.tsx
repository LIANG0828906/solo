import { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';
import { ThemeContextType, AppTheme } from '@/types';

const DEFAULT_THEME: AppTheme = {
  primary: '#8B7355',
  secondary: '#7CB342',
  background: '#FFF8E7'
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<AppTheme>(DEFAULT_THEME);

  const handleSetTheme = useCallback((newTheme: AppTheme) => {
    setTheme(newTheme);
  }, []);

  const value = useMemo(() => ({
    theme,
    setTheme: handleSetTheme
  }), [theme, handleSetTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
