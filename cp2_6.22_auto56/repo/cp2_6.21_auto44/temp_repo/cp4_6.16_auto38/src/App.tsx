import { useEffect, useState } from 'react';
import { Scene } from './Scene';
import { InfoPanel } from './InfoPanel';
import { Tooltip } from './Tooltip';
import { HeatmapLegend } from './HeatmapLegend';

export function App() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #0a0a1e 0%, #1a1a3e 50%, #2d1b4e 100%)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: loaded ? 1 : 0,
          transition: 'opacity 800ms ease-out',
        }}
      >
        <Scene />
      </div>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: `
            radial-gradient(ellipse at 50% 0%, rgba(60, 80, 180, 0.15) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 100%, rgba(100, 60, 180, 0.1) 0%, transparent 50%),
            radial-gradient(ellipse at 20% 80%, rgba(40, 100, 200, 0.08) 0%, transparent 40%)
          `,
        }}
      />

      <InfoPanel />
      <HeatmapLegend />
      <Tooltip />

      <div
        style={{
          position: 'fixed',
          top: 24,
          left: 24,
          zIndex: 100,
          opacity: loaded ? 1 : 0,
          transition: 'opacity 600ms ease-out',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #1a4de6 0%, #33e680 50%, #f24d26 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(50, 120, 255, 0.3)',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 21V7l9-4 9 4v14"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9 21V11h6v10"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="8" r="1.5" fill="white" opacity="0.8" />
            </svg>
          </div>
          <div>
            <div
              style={{
                color: '#e8f0ff',
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: 1,
                lineHeight: 1.2,
              }}
            >
              智慧城市
            </div>
            <div
              style={{
                color: '#7890c0',
                fontSize: 11,
                letterSpacing: 2,
              }}
            >
              SMART CITY
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 100,
          opacity: loaded ? 1 : 0,
          transition: 'opacity 600ms ease-out 200ms',
        }}
      >
        <div
          style={{
            background: 'rgba(15, 20, 40, 0.5)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(120, 160, 255, 0.15)',
            borderRadius: 10,
            padding: '10px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                stroke="#7890c0"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <span
              style={{
                color: '#8098c0',
                fontSize: 10,
              }}
            >
              拖拽旋转视角
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 3v2M12 19v2M3 12h2M19 12h2M5.64 5.64l1.41 1.41M16.95 16.95l1.41 1.41M5.64 18.36l1.41-1.41M16.95 7.05l1.41-1.41"
                stroke="#7890c0"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <circle cx="12" cy="12" r="3" stroke="#7890c0" strokeWidth="1.5" />
            </svg>
            <span
              style={{
                color: '#8098c0',
                fontSize: 10,
              }}
            >
              滚轮缩放
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"
                stroke="#7890c0"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span
              style={{
                color: '#8098c0',
                fontSize: 10,
              }}
            >
              右键平移场景
            </span>
          </div>
        </div>
      </div>

      {!loaded && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0a0a1e',
            zIndex: 1000,
            transition: 'opacity 500ms ease-out',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 60,
                height: 60,
                margin: '0 auto 20px',
                borderRadius: 14,
                background: 'linear-gradient(135deg, #1a4de6 0%, #33e680 50%, #f24d26 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'pulse 2s ease-in-out infinite',
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 21V7l9-4 9 4v14"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 21V11h6v10"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div
              style={{
                color: '#a0b8e0',
                fontSize: 14,
                letterSpacing: 3,
                fontWeight: 300,
              }}
            >
              城市人流热力图加载中
            </div>
            <div
              style={{
                marginTop: 16,
                width: 200,
                height: 3,
                margin: '16px auto 0',
                background: 'rgba(120, 160, 255, 0.15)',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: '60%',
                  height: '100%',
                  background: 'linear-gradient(90deg, #1a4de6, #33e680)',
                  borderRadius: 2,
                  animation: 'loading 1.5s ease-in-out infinite',
                }}
              />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
      `}</style>
    </div>
  );
}
