import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { EditorContextType, Stats, Theme } from '../types';
import { useKeystrokeTracker } from '../hooks/useKeystrokeTracker';
import { useWritingTimer } from '../hooks/useWritingTimer';
import { countWords } from '../utils/exportUtils';
import { DARK_COLORS, LIGHT_COLORS } from '../constants';

const EditorContext = createContext<EditorContextType | null>(null);

export const useEditor = (): EditorContextType => {
  const ctx = useContext(EditorContext);
  if (!ctx) {
    throw new Error('useEditor must be used within EditorProvider');
  }
  return ctx;
};

const getInitialStats = (): Stats => ({
  wordCount: 0,
  writingDuration: 0,
  keystrokeCount: 0,
  keystrokeFrequency: 0,
  recentKeystrokeFrequency: 0,
  lastKeystrokeTime: 0,
  startTime: null,
  isPaused: false,
});

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [text, setTextState] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [theme, setThemeState] = useState<Theme>('dark');
  const [stats, setStats] = useState<Stats>(getInitialStats());

  const keystrokeTracker = useKeystrokeTracker();
  const writingTimer = useWritingTimer();

  const setText = useCallback((newText: string) => {
    setTextState(newText);
    setStats(prev => ({
      ...prev,
      wordCount: countWords(newText),
    }));
  }, []);

  const updateStatsOnKeystroke = useCallback(() => {
    const { intensity } = keystrokeTracker.addKeystroke();
    writingTimer.registerActivity();
    const now = Date.now();
    setStats(prev => ({
      ...prev,
      keystrokeCount: keystrokeTracker.totalCount,
      keystrokeFrequency: keystrokeTracker.getOverallFrequency(writingTimer.elapsedMs),
      recentKeystrokeFrequency: keystrokeTracker.getRecentFrequency(),
      writingDuration: writingTimer.elapsedMs,
      lastKeystrokeTime: now,
      startTime: writingTimer.startTime,
      isPaused: writingTimer.isPaused,
    }));
    return intensity;
  }, [keystrokeTracker, writingTimer]);

  const refreshStats = useCallback(() => {
    setStats(prev => ({
      ...prev,
      writingDuration: writingTimer.elapsedMs,
      keystrokeFrequency: keystrokeTracker.getOverallFrequency(writingTimer.elapsedMs),
      recentKeystrokeFrequency: keystrokeTracker.getRecentFrequency(),
      isPaused: writingTimer.isPaused,
    }));
  }, [keystrokeTracker, writingTimer]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    const root = document.documentElement;
    const colors = newTheme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
    root.style.setProperty('--theme-bg', colors.bg);
    root.style.setProperty('--theme-text', colors.text);
    root.style.setProperty('--theme-textarea-bg', colors.textareaBg);
    root.style.setProperty('--theme-card-bg', colors.cardBg);
    root.style.setProperty('--theme-cursor', colors.cursor);
    root.style.setProperty('--theme-glow', colors.glow);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  useEffect(() => {
    setTheme('dark');
  }, [setTheme]);

  useEffect(() => {
    const interval = setInterval(refreshStats, 1000);
    return () => clearInterval(interval);
  }, [refreshStats]);

  const value = useMemo<EditorContextType>(() => ({
    text,
    setText,
    cursorPosition,
    setCursorPosition,
    stats,
    updateStatsOnKeystroke,
    refreshStats,
    theme,
    setTheme,
    toggleTheme,
  }), [
    text,
    setText,
    cursorPosition,
    stats,
    updateStatsOnKeystroke,
    refreshStats,
    theme,
    setTheme,
    toggleTheme,
  ]);

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
};
