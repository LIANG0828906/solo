import { useEffect } from 'react';
import Editor from './modules/editor/Editor';
import Wall from './modules/wall/Wall';
import { useAppStore } from './modules/editor/ThemeManager';
import type { WeatherTheme } from './types';

const App = () => {
  const currentTheme = useAppStore((state) => state.currentTheme);
  const currentView = useAppStore((state) => state.currentView);
  const setTheme = useAppStore((state) => state.setTheme);
  const setView = useAppStore((state) => state.setView);

  useEffect(() => {
    const styleId = 'global-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        html, body, #root {
          width: 100%;
          min-height: 100vh;
          background-color: #FFF8F0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
        }
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #FFF8F0;
        }
        ::-webkit-scrollbar-thumb {
          background: #E0D5C7;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #C9B89A;
        }
        input::placeholder, textarea::placeholder {
          color: #BFA890;
        }
        @keyframes chime-ring {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(8deg); }
          75% { transform: rotate(-8deg); }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const themeOptions: { value: WeatherTheme; label: string; emoji: string }[] = [
    { value: 'sunny', label: '晴天', emoji: '☀️' },
    { value: 'rainy', label: '雨天', emoji: '🌧️' },
    { value: 'snowy', label: '雪天', emoji: '❄️' },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FFF8F0' }}>
      <nav
        style={{
          position: 'sticky',
          top: 0,
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(224, 213, 199, 0.5)',
          zIndex: 100,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
          }}
          onClick={() => setView('editor')}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#5D4037"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ animation: 'chime-ring 3s ease-in-out infinite' }}
          >
            <line x1="12" y1="2" x2="12" y2="8" />
            <circle cx="12" cy="12" r="4" />
            <line x1="8" y1="16" x2="6" y2="22" />
            <line x1="12" y1="16" x2="12" y2="22" />
            <line x1="16" y1="16" x2="18" y2="22" />
          </svg>
          <span
            style={{
              fontSize: '18px',
              fontWeight: 400,
              letterSpacing: '2px',
              color: '#5D4037',
            }}
          >
            风铃诗笺
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setView('editor')}
              style={{
                padding: '8px 16px',
                border: 'none',
                background: currentView === 'editor' ? '#5D403715' : 'transparent',
                color: '#5D4037',
                fontSize: '14px',
                borderRadius: '16px',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease',
              }}
            >
              写诗
            </button>
            <button
              onClick={() => setView('wall')}
              style={{
                padding: '8px 16px',
                border: 'none',
                background: currentView === 'wall' ? '#5D403715' : 'transparent',
                color: '#5D4037',
                fontSize: '14px',
                borderRadius: '16px',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease',
              }}
            >
              风铃墙
            </button>
          </div>

          <select
            value={currentTheme}
            onChange={(e) => setTheme(e.target.value as WeatherTheme)}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              border: '1px solid #E0D5C7',
              backgroundColor: '#FFFFFF',
              color: '#5D4037',
              fontSize: '13px',
              cursor: 'pointer',
              outline: 'none',
              appearance: 'none',
              WebkitAppearance: 'none',
              paddingRight: '36px',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235D4037' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
            }}
          >
            {themeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.emoji} {opt.label}
              </option>
            ))}
          </select>
        </div>
      </nav>

      {currentView === 'editor' ? <Editor /> : <Wall />}
    </div>
  );
};

export default App;
