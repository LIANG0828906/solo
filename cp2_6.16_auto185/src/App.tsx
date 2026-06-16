import React, { useEffect } from 'react';
import ColorWheel from './ColorWheel';
import PalettePanel from './PalettePanel';
import PreviewArea from './PreviewArea';
import { useColorStore } from './store';

const App: React.FC = () => {
  const generateSchemes = useColorStore((s) => s.generateSchemes);
  const toastMessage = useColorStore((s) => s.toastMessage);
  const toastVisible = useColorStore((s) => s.toastVisible);

  useEffect(() => {
    generateSchemes();
  }, [generateSchemes]);

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        background:
          'radial-gradient(ellipse at top left, #1A1A2E 0%, #0A0A14 50%, #050508 100%)',
        padding: '32px 24px 64px 24px',
        position: 'relative',
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: '0 auto',
        }}
      >
        <header
          style={{
            textAlign: 'center',
            marginBottom: 40,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background:
                  'conic-gradient(from 0deg, #FF0000, #FFFF00, #00FF00, #00FFFF, #0000FF, #FF00FF, #FF0000)',
                boxShadow: '0 0 24px rgba(100, 100, 255, 0.4)',
              }}
            />
            <h1
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 36,
                fontWeight: 700,
                background:
                  'linear-gradient(135deg, #FFFFFF 0%, #A0A0FF 50%, #FF80C0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: 1,
              }}
            >
              ColorSwirl
            </h1>
          </div>
          <p
            style={{
              fontSize: 15,
              color: '#8A8AA5',
              letterSpacing: 0.5,
              maxWidth: 520,
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            拖拽色轮上的锚点选取颜色，实时生成网页配色方案，一键复制色值获取设计灵感
          </p>
        </header>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 420px',
            gap: 32,
            alignItems: 'start',
            marginBottom: 32,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              minHeight: 500,
            }}
          >
            <ColorWheel size={460} />
          </div>
          <div
            style={{
              maxHeight: 'calc(100vh - 160px)',
              position: 'sticky',
              top: 24,
            }}
          >
            <PalettePanel />
          </div>
        </div>

        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: 4,
                height: 24,
                borderRadius: 2,
                background:
                  'linear-gradient(180deg, #7C7CFF 0%, #FF7CAE 100%)',
              }}
            />
            <h2
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 18,
                fontWeight: 600,
                color: '#E8E8F0',
                letterSpacing: 0.5,
              }}
            >
              方案预览
            </h2>
            <span
              style={{
                fontSize: 13,
                color: '#6A6A85',
              }}
            >
              实时模拟网页元素效果
            </span>
          </div>
          <PreviewArea />
        </div>

        <footer
          style={{
            marginTop: 48,
            paddingTop: 24,
            borderTop: '1px solid #1F1F2E',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: 12,
              color: '#5A5A75',
              letterSpacing: 0.5,
            }}
          >
            ColorSwirl · 专为设计师打造的网页配色灵感生成工具 · 数据自动保存到本地
          </p>
        </footer>
      </div>

      <Toast visible={toastVisible} message={toastMessage} />

      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: -1,
          backgroundImage:
            'radial-gradient(circle at 20% 80%, rgba(100, 100, 255, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 100, 200, 0.06) 0%, transparent 50%)',
        }}
      />
    </div>
  );
};

interface ToastProps {
  visible: boolean;
  message: string;
}

const Toast: React.FC<ToastProps> = ({ visible, message }) => {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 40,
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '12px 24px',
        backgroundColor: '#10B981',
        color: '#FFFFFF',
        borderRadius: 10,
        fontSize: 14,
        fontWeight: 600,
        fontFamily: "'Inter', sans-serif",
        letterSpacing: 0.3,
        boxShadow: '0 12px 32px rgba(16, 185, 129, 0.4), 0 4px 12px rgba(0,0,0,0.3)',
        zIndex: 9999,
        opacity: visible ? 1 : 0,
        transform: visible
          ? 'translateX(-50%) translateY(0)'
          : 'translateX(-50%) translateY(20px)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        whiteSpace: 'nowrap',
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
      {message}
    </div>
  );
};

export default App;
