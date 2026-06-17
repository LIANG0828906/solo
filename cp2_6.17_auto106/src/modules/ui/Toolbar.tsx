import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import type { Language } from '@/types';

interface ToastItem {
  id: number;
  message: string;
}

let toolbarToastIdCounter = 0;

interface ToolbarProps {
  language: Language;
  lastSavedTime: string | null;
  isRunning: boolean;
  onRun: () => void;
  onSave: () => void;
  onLanguageChange: (lang: Language) => void;
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
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return () => {};
  }, []);

  const showToast = (message: string) => {
    const id = ++toolbarToastIdCounter;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
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
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
              <rect x="6" y="7" width="18" height="2" rx="1" fill="#A0A0C0" />
              <rect x="6" y="14" width="18" height="2" rx="1" fill="#A0A0C0" />
              <rect x="6" y="21" width="18" height="2" rx="1" fill="#A0A0C0" />
            </svg>
          </button>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0',
            backgroundColor: '#2D2D3F',
            borderRadius: '6px',
            border: '1px solid #4A4A6E',
            overflow: 'hidden',
          }}
        >
          {(['python', 'javascript'] as const).map((lang) => {
            const isActive = language === lang;
            return (
              <button
                key={lang}
                onClick={() => onLanguageChange(lang)}
                style={{
                  backgroundColor: isActive ? '#6C63FF' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#A0A0C0',
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
                    e.currentTarget.style.backgroundColor = '#3A3A5C';
                    e.currentTarget.style.color = '#E0E0F0';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#A0A0C0';
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
                      : '#6A6A8E',
                  }}
                />
                {lang === 'python' ? 'Python' : 'JavaScript'}
              </button>
            );
          })}
        </div>

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
          onClick={() => {
            onRun();
            showToast('运行中...');
          }}
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

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
