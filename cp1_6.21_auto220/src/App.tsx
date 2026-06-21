import { useState, useCallback, useRef, useEffect } from 'react';
import Editor from './Editor';
import Preview from './Preview';
import { ColorTheme, SavedTheme, PRESET_THEMES } from './types';

const STORAGE_KEY = 'css-theme-editor-saved-themes';
const DEFAULT_LEFT_WIDTH = 320;
const MIN_LEFT_WIDTH = 320;
const MIN_RIGHT_WIDTH = 600;
const DIVIDER_WIDTH = 3;

function App() {
  const [theme, setTheme] = useState<ColorTheme>({ ...PRESET_THEMES[0] });
  const [savedThemes, setSavedThemes] = useState<SavedTheme[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [leftWidth, setLeftWidth] = useState<number>(DEFAULT_LEFT_WIDTH);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef<number>(0);
  const dragStartWidth = useRef<number>(0);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedThemes));
  }, [savedThemes]);

  const handleThemeChange = useCallback((key: keyof Omit<ColorTheme, 'name'>, value: string) => {
    setTheme((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleThemeNameChange = useCallback((name: string) => {
    setTheme((prev) => ({ ...prev, name }));
  }, []);

  const handleLoadTheme = useCallback((loadedTheme: ColorTheme) => {
    setTheme({ ...loadedTheme });
  }, []);

  const handleSaveTheme = useCallback(() => {
    const newSaved: SavedTheme = {
      ...theme,
      id: Date.now().toString(),
      createdAt: Date.now(),
    };
    setSavedThemes((prev) => [...prev, newSaved]);
  }, [theme]);

  const handleDeleteTheme = useCallback((id: string) => {
    setSavedThemes((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleRenameTheme = useCallback((id: string, newName: string) => {
    setSavedThemes((prev) =>
      prev.map((t) => (t.id === id ? { ...t, name: newName } : t))
    );
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartX.current = e.clientX;
    dragStartWidth.current = leftWidth;
  }, [leftWidth]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const maxLeftWidth = containerRect.width - MIN_RIGHT_WIDTH - DIVIDER_WIDTH;
      const deltaX = e.clientX - dragStartX.current;
      const newWidth = Math.max(
        MIN_LEFT_WIDTH,
        Math.min(maxLeftWidth, dragStartWidth.current + deltaX)
      );
      setLeftWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        background: '#0F172A',
        overflow: 'hidden',
        userSelect: isDragging ? 'none' : 'auto',
        cursor: isDragging ? 'col-resize' : 'default',
      }}
    >
      <div
        style={{
          width: leftWidth,
          flexShrink: 0,
          height: '100%',
          padding: 16,
          overflow: 'hidden',
        }}
      >
        <Editor
          theme={theme}
          savedThemes={savedThemes}
          onThemeChange={handleThemeChange}
          onThemeNameChange={handleThemeNameChange}
          onLoadTheme={handleLoadTheme}
          onSaveTheme={handleSaveTheme}
          onDeleteTheme={handleDeleteTheme}
          onRenameTheme={handleRenameTheme}
        />
      </div>

      <div
        onMouseDown={handleMouseDown}
        style={{
          width: isDragging ? 5 : DIVIDER_WIDTH,
          height: '100%',
          background: isDragging ? '#6366F1' : '#475569',
          cursor: 'col-resize',
          flexShrink: 0,
          transition: 'background 0.2s ease-out, width 0.2s ease-out',
          position: 'relative',
        }}
      />

      <div
        style={{
          flex: 1,
          height: '100%',
          minWidth: MIN_RIGHT_WIDTH,
          padding: 16,
          overflow: 'hidden',
        }}
      >
        <Preview theme={theme} />
      </div>
    </div>
  );
}

export default App;
