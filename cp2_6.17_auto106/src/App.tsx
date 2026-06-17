import { useState, useCallback, useRef, useEffect } from 'react';
import { create } from 'zustand';
import { Loader2, Sun, Moon } from 'lucide-react';
import type { Language, Snippet, Theme } from '@/types';
import { EditorPanel } from '@/modules/editor/EditorPanel';
import { PreviewPanel } from '@/modules/editor/PreviewPanel';
import { CodeExecutor } from '@/modules/executor/CodeExecutor';
import { StorageManager } from '@/modules/storage/StorageManager';
import { Sidebar } from '@/modules/ui/Sidebar';

const THEME_STORAGE_KEY = 'codecanvas_theme';

function loadSavedTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {}
  return 'dark';
}

function saveThemeToStorage(theme: Theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {}
}

interface CodeCanvasState {
  code: string;
  language: Language;
  output: string;
  isRunning: boolean;
  isError: boolean;
  lastSavedTime: string | null;
  snippets: Snippet[];
  sidebarOpen: boolean;
  isMobile: boolean;
  theme: Theme;
  setCode: (code: string) => void;
  setLanguage: (language: Language) => void;
  setOutput: (output: string, isError: boolean) => void;
  setIsRunning: (isRunning: boolean) => void;
  setLastSavedTime: (time: string) => void;
  loadSnippets: () => void;
  addSnippet: (snippet: Snippet) => void;
  removeSnippet: (id: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setIsMobile: (mobile: boolean) => void;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const useStore = create<CodeCanvasState>((set) => ({
  code: '// 在此输入 JavaScript 代码\nconsole.log("Hello, CodeCanvas!");\n',
  language: 'javascript',
  output: '',
  isRunning: false,
  isError: false,
  lastSavedTime: null,
  snippets: [],
  sidebarOpen: true,
  isMobile: false,
  theme: loadSavedTheme(),
  setCode: (code) => set({ code }),
  setLanguage: (language) => set({ language }),
  setOutput: (output, isError) => set({ output, isError }),
  setIsRunning: (isRunning) => set({ isRunning }),
  setLastSavedTime: (lastSavedTime) => set({ lastSavedTime }),
  loadSnippets: () => set({ snippets: StorageManager.loadAll() }),
  addSnippet: (snippet) =>
    set((state) => ({ snippets: [...state.snippets, snippet] })),
  removeSnippet: (id) =>
    set((state) => ({
      snippets: state.snippets.filter((s) => s.id !== id),
    })),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setIsMobile: (isMobile) => set({ isMobile }),
  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === 'dark' ? 'light' : 'dark';
      saveThemeToStorage(newTheme);
      return { theme: newTheme };
    }),
  setTheme: (theme) => {
    saveThemeToStorage(theme);
    set({ theme });
  },
}));

interface ToastItem {
  id: number;
  message: string;
}

let toastIdCounter = 0;

function ToastContainer({ toasts }: { toasts: ToastItem[] }) {
  return (
    <>
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{
            position: 'fixed',
            top: `${16 + index * 44}px`,
            right: '16px',
            backgroundColor: '#2ECC71',
            color: '#FFFFFF',
            fontSize: '12px',
            padding: '8px 16px',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            zIndex: 10000,
            animation: 'toastIn 0.3s ease forwards',
            transition: 'top 0.3s ease',
          }}
        >
          {toast.message}
        </div>
      ))}
    </>
  );
}

function SaveModal({
  onConfirm,
  onCancel,
  theme,
}: {
  onConfirm: (name: string) => void;
  onCancel: () => void;
  theme: Theme;
}) {
  const [name, setName] = useState('');
  const isDark = theme === 'dark';
  const bg = isDark ? '#1A1A2E' : '#FFFFFF';
  const border = isDark ? '#2D2D4A' : '#E0E0E0';
  const text = isDark ? '#E0E0F0' : '#333333';
  const inputBg = isDark ? '#2D2D3F' : '#F5F5F7';
  const inputBorder = isDark ? '#4A4A6E' : '#D0D0D8';
  const cancelText = isDark ? '#A0A0C0' : '#666666';
  const cancelBorder = isDark ? '#4A4A6E' : '#D0D0D8';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onConfirm(name.trim().slice(0, 20));
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20000,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: bg,
          borderRadius: '12px',
          border: `1px solid ${border}`,
          padding: '24px',
          width: '360px',
          maxWidth: '90vw',
          transition: 'all 0.3s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            color: text,
            fontSize: '16px',
            fontWeight: 600,
            marginBottom: '16px',
            transition: 'color 0.3s ease',
          }}
        >
          保存代码片段
        </h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 20))}
            placeholder="输入片段名称..."
            maxLength={20}
            autoFocus
            style={{
              width: '100%',
              backgroundColor: inputBg,
              border: `1px solid ${inputBorder}`,
              borderRadius: '6px',
              padding: '10px 12px',
              color: text,
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.3s ease, background-color 0.3s ease',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#6C63FF';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = inputBorder;
            }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px',
              marginTop: '16px',
            }}
          >
            <button
              type="button"
              onClick={onCancel}
              style={{
                backgroundColor: 'transparent',
                color: cancelText,
                border: `1px solid ${cancelBorder}`,
                borderRadius: '6px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '13px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#6C63FF';
                e.currentTarget.style.color = '#6C63FF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = cancelBorder;
                e.currentTarget.style.color = cancelText;
              }}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              style={{
                backgroundColor: name.trim() ? '#6C63FF' : '#AAAAAA',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                cursor: name.trim() ? 'pointer' : 'not-allowed',
                fontSize: '13px',
                transition: 'all 0.2s ease',
              }}
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ResizableDivider({
  isMobile,
  onResize,
  theme,
}: {
  isMobile: boolean;
  onResize: (delta: number) => void;
  theme: Theme;
}) {
  const dragging = useRef(false);
  const startPos = useRef(0);
  const isDark = theme === 'dark';
  const defaultBg = isDark ? '#3A3A5C' : '#CCCCCC';
  const [bg, setBg] = useState(defaultBg);

  useEffect(() => {
    if (!dragging.current) {
      setBg(defaultBg);
    }
  }, [defaultBg]);

  const handleMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    startPos.current = isMobile ? e.clientY : e.clientX;
    setBg('#6C63FF');
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const currentPos = isMobile ? e.clientY : e.clientX;
      const delta = currentPos - startPos.current;
      startPos.current = currentPos;
      onResize(delta);
    };

    const handleMouseUp = () => {
      if (dragging.current) {
        dragging.current = false;
        setBg(defaultBg);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isMobile, onResize, defaultBg]);

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        width: isMobile ? '100%' : '6px',
        height: isMobile ? '6px' : '100%',
        backgroundColor: bg,
        cursor: isMobile ? 'row-resize' : 'col-resize',
        transition: 'background-color 0.2s ease',
        flexShrink: 0,
      }}
      onMouseEnter={() => {
        if (!dragging.current) setBg('#6C63FF');
      }}
      onMouseLeave={() => {
        if (!dragging.current) setBg(defaultBg);
      }}
    />
  );
}

export default function App() {
  const store = useStore();
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [splitRatio, setSplitRatio] = useState(0.5);
  const mainRef = useRef<HTMLDivElement>(null);

  const isDark = store.theme === 'dark';
  const isMobile = store.isMobile;
  const sidebarOpen = store.sidebarOpen;

  const rootBg = isDark ? '#0F0F23' : '#F5F5F7';
  const rootText = isDark ? '#E0E0F0' : '#333333';
  const toolbarBg = isDark ? '#1A1A2E' : '#FFFFFF';
  const toolbarBorder = isDark ? '#2D2D4A' : '#E0E0E0';
  const timeColor = isDark ? '#6A6A8E' : '#888888';
  const saveIconColor = isDark ? '#A0A0C0' : '#666666';
  const hamburgerColor = isDark ? '#A0A0C0' : '#666666';
  const brandColor = '#6C63FF';
  const langSwitchBg = isDark ? '#2D2D3F' : '#F0F0F5';
  const langSwitchBorder = isDark ? '#4A4A6E' : '#D0D0D8';
  const langInactiveText = isDark ? '#A0A0C0' : '#666666';
  const langHoverBg = isDark ? '#3A3A5C' : '#E0E0E8';
  const langHoverText = isDark ? '#E0E0F0' : '#333333';
  const langInactiveDot = isDark ? '#6A6A8E' : '#BBBBBB';
  const scrollbarTrack = isDark ? '#1A1A2E' : '#F0F0F0';
  const scrollbarThumb = isDark ? '#3A3A5C' : '#CCCCCC';

  useEffect(() => {
    store.loadSnippets();

    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      store.setIsMobile(mobile);
      if (mobile) {
        store.setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = useCallback((message: string) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2000);
  }, []);

  const handleRun = useCallback(async () => {
    if (store.isRunning) return;
    store.setIsRunning(true);
    store.setOutput('', false);

    try {
      const result = await CodeExecutor.execute(store.code, store.language);
      store.setOutput(result.output, result.error);
      showToast(result.error ? '运行出错' : '运行完成');
    } catch {
      store.setOutput('执行失败', true);
      showToast('运行出错');
    } finally {
      store.setIsRunning(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.code, store.language, store.isRunning, showToast]);

  const handleLanguageChange = useCallback(
    (lang: Language) => {
      store.setLanguage(lang);
      store.setOutput('', false);
      showToast(`已切换至 ${lang === 'python' ? 'Python' : 'JavaScript'}`);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [showToast]
  );

  const handleSave = useCallback(() => {
    setSaveModalOpen(true);
  }, []);

  const handleSaveConfirm = useCallback(
    (name: string) => {
      const snippet = StorageManager.save(name, store.code, store.language);
      store.addSnippet(snippet);
      store.setLastSavedTime(snippet.lastModified);
      setSaveModalOpen(false);
      showToast('保存成功');
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.code, store.language, showToast]
  );

  const handleLoadSnippet = useCallback(
    (id: string) => {
      const snippet = StorageManager.getById(id);
      if (snippet) {
        store.setCode(snippet.code);
        store.setLanguage(snippet.language);
        store.setOutput('', false);
        if (store.isMobile) {
          store.setSidebarOpen(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.isMobile]
  );

  const handleDeleteSnippet = useCallback(
    (id: string) => {
      StorageManager.delete(id);
      store.removeSnippet(id);
      showToast('已删除片段');
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [showToast]
  );

  const handleResize = useCallback(
    (delta: number) => {
      if (!mainRef.current) return;
      const containerSize = store.isMobile
        ? mainRef.current.clientHeight
        : mainRef.current.clientWidth;

      if (containerSize === 0) return;
      const newRatio = splitRatio + (store.isMobile ? -delta / containerSize : -delta / containerSize);
      setSplitRatio(Math.max(0.2, Math.min(0.8, newRatio)));
    },
    [splitRatio, store.isMobile]
  );

  const handleToggleTheme = useCallback(() => {
    store.toggleTheme();
    showToast(`已切换至${store.theme === 'dark' ? '浅色' : '深色'}模式`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.theme, showToast]);

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        backgroundColor: rootBg,
        color: rootText,
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        overflow: 'hidden',
        transition: 'background-color 0.3s ease, color 0.3s ease',
      }}
    >
      {!isMobile && sidebarOpen && (
        <Sidebar
          snippets={store.snippets}
          onSelect={handleLoadSnippet}
          onDelete={handleDeleteSnippet}
          isOpen={true}
          onClose={() => store.setSidebarOpen(false)}
          theme={store.theme}
        />
      )}

      {isMobile && (
        <Sidebar
          snippets={store.snippets}
          onSelect={handleLoadSnippet}
          onDelete={handleDeleteSnippet}
          isOpen={sidebarOpen}
          onClose={() => store.setSidebarOpen(false)}
          theme={store.theme}
        />
      )}

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        <div
          style={{
            height: '48px',
            backgroundColor: toolbarBg,
            borderBottom: `1px solid ${toolbarBorder}`,
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: '12px',
            flexShrink: 0,
            transition: 'all 0.3s ease',
          }}
        >
          {isMobile && (
            <button
              onClick={() => store.toggleSidebar()}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                <rect x="6" y="7" width="18" height="2" rx="1" fill={hamburgerColor} />
                <rect x="6" y="14" width="18" height="2" rx="1" fill={hamburgerColor} />
                <rect x="6" y="21" width="18" height="2" rx="1" fill={hamburgerColor} />
              </svg>
            </button>
          )}

          {!isMobile && !sidebarOpen && (
            <button
              onClick={() => store.setSidebarOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                color: hamburgerColor,
                fontSize: '16px',
                transition: 'color 0.3s ease',
              }}
              title="显示侧边栏"
            >
              ☰
            </button>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: brandColor,
              fontSize: '15px',
              fontWeight: 700,
              letterSpacing: '0.5px',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="1" y="1" width="7" height="7" rx="1.5" stroke={brandColor} strokeWidth="1.5" />
              <rect x="10" y="1" width="7" height="7" rx="1.5" stroke={brandColor} strokeWidth="1.5" />
              <rect x="1" y="10" width="7" height="7" rx="1.5" stroke={brandColor} strokeWidth="1.5" />
              <rect x="10" y="10" width="7" height="7" rx="1.5" stroke={brandColor} strokeWidth="1.5" />
            </svg>
            CodeCanvas
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0',
              backgroundColor: langSwitchBg,
              borderRadius: '6px',
              border: `1px solid ${langSwitchBorder}`,
              overflow: 'hidden',
              transition: 'all 0.3s ease',
            }}
          >
            {(['python', 'javascript'] as const).map((lang) => {
              const isActive = store.language === lang;
              return (
                <button
                  key={lang}
                  onClick={() => handleLanguageChange(lang)}
                  style={{
                    backgroundColor: isActive ? '#6C63FF' : 'transparent',
                    color: isActive ? '#FFFFFF' : langInactiveText,
                    border: 'none',
                    borderBottom: isActive ? '2px solid #FFFFFF' : '2px solid transparent',
                    padding: '6px 14px',
                    fontSize: '13px',
                    fontWeight: isActive ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = langHoverBg;
                      e.currentTarget.style.color = langHoverText;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = langInactiveText;
                    }
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: isActive
                        ? (lang === 'python' ? '#FFD93D' : '#FF6B6B')
                        : langInactiveDot,
                    }}
                  />
                  {lang === 'python' ? 'Python' : 'JavaScript'}
                </button>
              );
            })}
          </div>

          <div style={{ flex: 1 }} />

          {store.lastSavedTime && (
            <span
              style={{
                color: timeColor,
                fontSize: '12px',
                fontFamily: "'Consolas', monospace",
                transition: 'color 0.3s ease',
              }}
            >
              {(() => {
                const d = new Date(store.lastSavedTime);
                const pad = (n: number) => String(n).padStart(2, '0');
                return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
              })()}
            </span>
          )}

          <button
            onClick={handleToggleTheme}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              color: saveIconColor,
              transition: 'color 0.2s ease',
              borderRadius: '6px',
            }}
            title={isDark ? '切换至浅色模式' : '切换至深色模式'}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#6C63FF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = saveIconColor;
            }}
          >
            {isDark ? (
              <Sun size={20} strokeWidth={1.8} />
            ) : (
              <Moon size={20} strokeWidth={1.8} />
            )}
          </button>

          <button
            onClick={handleSave}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              color: saveIconColor,
              transition: 'color 0.2s ease',
            }}
            title="保存代码片段"
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#6C63FF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = saveIconColor;
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
            >
              <path
                d="M15.5 18H4.5C3.67 18 3 17.33 3 16.5V3.5C3 2.67 3.67 2 4.5 2H13.5L17 5.5V16.5C17 17.33 16.33 18 15.5 18Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7 18V11H13V18"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7 2V6H12V2"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <button
            onClick={handleRun}
            disabled={store.isRunning}
            style={{
              backgroundColor: store.isRunning ? '#5A52D5' : '#6C63FF',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              width: '120px',
              height: '40px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: store.isRunning ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              transform: store.isRunning ? 'scale(0.95)' : 'scale(1)',
            }}
            onMouseEnter={(e) => {
              if (!store.isRunning) {
                e.currentTarget.style.backgroundColor = '#5A52D5';
                e.currentTarget.style.transform = 'scale(1.02)';
              }
            }}
            onMouseLeave={(e) => {
              if (!store.isRunning) {
                e.currentTarget.style.backgroundColor = '#6C63FF';
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)';
            }}
            onMouseUp={(e) => {
              if (!store.isRunning) {
                e.currentTarget.style.transform = 'scale(1.02)';
              }
            }}
          >
            {store.isRunning ? (
              <>
                <Loader2
                  size={14}
                  style={{ animation: 'spin 0.6s linear infinite' }}
                />
                运行中
              </>
            ) : (
              '▶ 运行'
            )}
          </button>
        </div>

        <div
          ref={mainRef}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            overflow: 'hidden',
            padding: '8px',
            gap: '0',
          }}
        >
          <div
            style={{
              flex: isMobile ? `0 0 ${splitRatio * 100}%` : `0 0 ${splitRatio * 100}%`,
              overflow: 'hidden',
              minHeight: isMobile ? '100px' : undefined,
              minWidth: !isMobile ? '100px' : undefined,
            }}
          >
            <EditorPanel
              code={store.code}
              language={store.language}
              theme={store.theme}
              onCodeChange={store.setCode}
            />
          </div>

          <ResizableDivider isMobile={isMobile} onResize={handleResize} theme={store.theme} />

          <div
            style={{
              flex: 1,
              overflow: 'hidden',
              minHeight: isMobile ? '100px' : undefined,
              minWidth: !isMobile ? '100px' : undefined,
            }}
          >
            <PreviewPanel
              output={store.output}
              isError={store.isError}
              isRunning={store.isRunning}
              theme={store.theme}
            />
          </div>
        </div>
      </div>

      {saveModalOpen && (
        <SaveModal
          onConfirm={handleSaveConfirm}
          onCancel={() => setSaveModalOpen(false)}
          theme={store.theme}
        />
      )}

      {toasts.length > 0 && <ToastContainer toasts={toasts} />}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
        }
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: ${scrollbarTrack};
          transition: background-color 0.3s ease;
        }
        ::-webkit-scrollbar-thumb {
          background: ${scrollbarThumb};
          border-radius: 3px;
          transition: background-color 0.3s ease;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #6C63FF;
        }
      `}</style>
    </div>
  );
}
