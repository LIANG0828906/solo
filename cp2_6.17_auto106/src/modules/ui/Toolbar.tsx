import { useState, useEffect, useRef } from 'react';

interface ToastState {
  message: string;
  visible: boolean;
}

interface ToolbarProps {
  language: 'python' | 'javascript';
  lastSavedTime: string | null;
  isRunning: boolean;
  onRun: () => void;
  onSave: () => void;
  onLanguageChange: (lang: 'python' | 'javascript') => void;
  onToggleSidebar: () => void;
  isMobile: boolean;
}

export function Toolbar({
  language,
  lastSavedTime,
  isRunning,
  onRun,
  onSave,
  onLanguageChange,
  onToggleSidebar,
  isMobile,
}: ToolbarProps) {
  const [toast, setToast] = useState<ToastState>({ message: '', visible: false });
  const toastTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const handleRun = () => {
    onRun();
  };

  const showToast = (message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, visible: true });
    toastTimerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 2000);
  };

  const formatSaveTime = (iso: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return (
    <>
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
            onClick={onToggleSidebar}
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
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="6" y="7" width="18" height="2" rx="1" fill="#A0A0C0" />
              <rect x="6" y="14" width="18" height="2" rx="1" fill="#A0A0C0" />
              <rect x="6" y="21" width="18" height="2" rx="1" fill="#A0A0C0" />
            </svg>
          </button>
        )}

        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value as 'python' | 'javascript')}
          style={{
            backgroundColor: '#2D2D3F',
            color: '#E0E0F0',
            border: '1px solid #4A4A6E',
            borderRadius: '6px',
            padding: '4px 12px',
            fontSize: '13px',
            fontFamily: 'inherit',
            cursor: 'pointer',
            outline: 'none',
            transition: 'border-color 0.2s ease',
          }}
        >
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
        </select>

        <div style={{ flex: 1 }} />

        {lastSavedTime && (
          <span
            style={{
              color: '#6A6A8E',
              fontSize: '12px',
              fontFamily: "'Consolas', monospace",
            }}
          >
            {formatSaveTime(lastSavedTime)}
          </span>
        )}

        <button
          onClick={onSave}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
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
            xmlns="http://www.w3.org/2000/svg"
            style={{ color: 'currentColor' }}
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
          disabled={isRunning}
          style={{
            backgroundColor: isRunning ? '#5A52D5' : '#6C63FF',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            width: '120px',
            height: '40px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: isRunning ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            transform: isRunning ? 'scale(0.95)' : 'scale(1)',
          }}
          onMouseEnter={(e) => {
            if (!isRunning) {
              e.currentTarget.style.backgroundColor = '#5A52D5';
              e.currentTarget.style.transform = 'scale(1.02)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isRunning) {
              e.currentTarget.style.backgroundColor = '#6C63FF';
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.95)';
          }}
          onMouseUp={(e) => {
            if (!isRunning) {
              e.currentTarget.style.transform = 'scale(1.02)';
            }
          }}
        >
          {isRunning ? (
            <>
              <span
                style={{
                  display: 'inline-block',
                  width: '14px',
                  height: '14px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#FFFFFF',
                  borderRadius: '50%',
                  animation: 'spin 0.3s linear infinite',
                }}
              />
              运行中
            </>
          ) : (
            '▶ 运行'
          )}
        </button>
      </div>

      {toast.visible && (
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
            animation: 'fadeInOut 2s ease forwards',
          }}
        >
          {toast.message}
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(-10px); }
          15% { opacity: 1; transform: translateY(0); }
          85% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-10px); }
        }
      `}</style>
    </>
  );
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>({ message: '', visible: false });
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const showToast = (message: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, visible: true });
    timerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 2000);
  };

  const ToastComponent = toast.visible ? (
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
        animation: 'fadeInOut 2s ease forwards',
      }}
    >
      {toast.message}
    </div>
  ) : null;

  return { showToast, ToastComponent };
}
