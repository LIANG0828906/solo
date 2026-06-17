import { useState, useCallback, useRef, useEffect } from 'react';
import { create } from 'zustand';
import type { Language, Snippet } from '@/types';
import { EditorPanel } from '@/modules/editor/EditorPanel';
import { PreviewPanel } from '@/modules/editor/PreviewPanel';
import { CodeExecutor } from '@/modules/executor/CodeExecutor';
import { StorageManager } from '@/modules/storage/StorageManager';
import { Sidebar } from '@/modules/ui/Sidebar';

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
}));

function Toast({ message }: { message: string }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        backgroundColor: '#2ECC71',
        color: '#FFFFFF',
        fontSize: '12px',
        padding: '8px 16px',
        borderRadius: '6px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        zIndex: 10000,
        animation: 'toastIn 0.3s ease forwards',
      }}
    >
      {message}
    </div>
  );
}

function SaveModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');

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
          backgroundColor: '#1A1A2E',
          borderRadius: '12px',
          border: '1px solid #2D2D4A',
          padding: '24px',
          width: '360px',
          maxWidth: '90vw',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            color: '#E0E0F0',
            fontSize: '16px',
            fontWeight: 600,
            marginBottom: '16px',
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
              backgroundColor: '#2D2D3F',
              border: '1px solid #4A4A6E',
              borderRadius: '6px',
              padding: '10px 12px',
              color: '#E0E0F0',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.3s ease',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#6C63FF';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#4A4A6E';
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
                color: '#A0A0C0',
                border: '1px solid #4A4A6E',
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
                e.currentTarget.style.borderColor = '#4A4A6E';
                e.currentTarget.style.color = '#A0A0C0';
              }}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              style={{
                backgroundColor: name.trim() ? '#6C63FF' : '#4A4A6E',
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
}: {
  isMobile: boolean;
  onResize: (delta: number) => void;
}) {
  const dragging = useRef(false);
  const startPos = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    startPos.current = isMobile ? e.clientY : e.clientX;
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
      dragging.current = false;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isMobile, onResize]);

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        width: isMobile ? '100%' : '6px',
        height: isMobile ? '6px' : '100%',
        backgroundColor: '#3A3A5C',
        cursor: isMobile ? 'row-resize' : 'col-resize',
        transition: 'background-color 0.2s ease',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#6C63FF';
      }}
      onMouseLeave={(e) => {
        if (!dragging.current) {
          e.currentTarget.style.backgroundColor = '#3A3A5C';
        }
      }}
    />
  );
}

export default function App() {
  const store = useStore();
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [splitRatio, setSplitRatio] = useState(0.5);
  const mainRef = useRef<HTMLDivElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout>>();

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
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(message);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 2000);
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
      const updated = StorageManager.delete(id);
      store.removeSnippet(id);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
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

  const isMobile = store.isMobile;
  const sidebarOpen = store.sidebarOpen;

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        backgroundColor: '#0F0F23',
        color: '#E0E0F0',
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        overflow: 'hidden',
      }}
    >
      {!isMobile && sidebarOpen && (
        <Sidebar
          snippets={store.snippets}
          onSelect={handleLoadSnippet}
          onDelete={handleDeleteSnippet}
          isOpen={true}
          onClose={() => store.setSidebarOpen(false)}
        />
      )}

      {isMobile && (
        <Sidebar
          snippets={store.snippets}
          onSelect={handleLoadSnippet}
          onDelete={handleDeleteSnippet}
          isOpen={sidebarOpen}
          onClose={() => store.setSidebarOpen(false)}
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
            backgroundColor: '#1A1A2E',
            borderBottom: '1px solid #2D2D4A',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: '12px',
            flexShrink: 0,
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
              <svg
                width="30"
                height="30"
                viewBox="0 0 30 30"
                fill="none"
              >
                <rect x="6" y="7" width="18" height="2" rx="1" fill="#A0A0C0" />
                <rect x="6" y="14" width="18" height="2" rx="1" fill="#A0A0C0" />
                <rect x="6" y="21" width="18" height="2" rx="1" fill="#A0A0C0" />
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
                color: '#A0A0C0',
                fontSize: '16px',
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
              color: '#6C63FF',
              fontSize: '15px',
              fontWeight: 700,
              letterSpacing: '0.5px',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="1" y="1" width="7" height="7" rx="1.5" stroke="#6C63FF" strokeWidth="1.5" />
              <rect x="10" y="1" width="7" height="7" rx="1.5" stroke="#6C63FF" strokeWidth="1.5" />
              <rect x="1" y="10" width="7" height="7" rx="1.5" stroke="#6C63FF" strokeWidth="1.5" />
              <rect x="10" y="10" width="7" height="7" rx="1.5" stroke="#6C63FF" strokeWidth="1.5" />
            </svg>
            CodeCanvas
          </div>

          <select
            value={store.language}
            onChange={(e) => handleLanguageChange(e.target.value as Language)}
            style={{
              backgroundColor: '#2D2D3F',
              color: '#E0E0F0',
              border: '1px solid #4A4A6E',
              borderRadius: '6px',
              padding: '4px 12px',
              fontSize: '13px',
              cursor: 'pointer',
              outline: 'none',
              transition: 'border-color 0.2s ease',
            }}
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
          </select>

          <div style={{ flex: 1 }} />

          {store.lastSavedTime && (
            <span
              style={{
                color: '#6A6A8E',
                fontSize: '12px',
                fontFamily: "'Consolas', monospace",
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
            onClick={handleSave}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              color: '#A0A0C0',
              transition: 'color 0.2s ease',
            }}
            title="保存代码片段"
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#6C63FF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#A0A0C0';
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
                <span
                  style={{
                    display: 'inline-block',
                    width: '14px',
                    height: '14px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#FFFFFF',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite',
                  }}
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
              onCodeChange={store.setCode}
            />
          </div>

          <ResizableDivider isMobile={isMobile} onResize={handleResize} />

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
            />
          </div>
        </div>
      </div>

      {saveModalOpen && (
        <SaveModal
          onConfirm={handleSaveConfirm}
          onCancel={() => setSaveModalOpen(false)}
        />
      )}

      {toastMessage && <Toast message={toastMessage} />}

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
          background: #1A1A2E;
        }
        ::-webkit-scrollbar-thumb {
          background: #3A3A5C;
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #6C63FF;
        }
        select option {
          background: #2D2D3F;
          color: #E0E0F0;
        }
      `}</style>
    </div>
  );
}
