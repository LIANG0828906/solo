import { useEffect, useState } from 'react';
import Grid from './Grid';
import ScorePanel from './ScorePanel';
import { useGameStore } from './store';

export default function App() {
  const score = useGameStore(s => s.score);
  const level = useGameStore(s => s.level);
  const isWin = useGameStore(s => s.isWin);
  const winAnimating = useGameStore(s => s.winAnimating);
  const celebrating = useGameStore(s => s.celebrating);
  const setWinAnimating = useGameStore(s => s.setWinAnimating);
  const setCelebrating = useGameStore(s => s.setCelebrating);
  const [flashOn, setFlashOn] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [bannerFading, setBannerFading] = useState(false);

  useEffect(() => {
    if (!winAnimating) return;

    let count = 0;
    const maxFlashes = 3;
    let on = true;

    setFlashOn(true);

    const interval = setInterval(() => {
      on = !on;
      setFlashOn(on);
      count++;

      if (count >= maxFlashes * 2) {
        clearInterval(interval);
        setFlashOn(false);
        setWinAnimating(false);
      }
    }, 300);

    return () => clearInterval(interval);
  }, [winAnimating, setWinAnimating]);

  useEffect(() => {
    if (celebrating && !bannerVisible) {
      setBannerVisible(true);
      setBannerFading(false);

      const fadeTimer = setTimeout(() => {
        setBannerFading(true);
      }, 2000);

      const hideTimer = setTimeout(() => {
        setBannerVisible(false);
        setCelebrating(false);
      }, 2500);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    }

    if (!isWin) {
      setBannerVisible(false);
      setBannerFading(false);
    }
  }, [celebrating, bannerVisible, isWin, setCelebrating]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#1A1A2E',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: "'Segoe UI', 'Roboto', sans-serif",
        color: '#fff',
        overflow: 'auto',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '900px',
          background: '#2C3E50',
          borderRadius: '0 0 8px 8px',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '2px', color: '#00D2D3' }}>
          ⚡ ChainReactor
        </div>
        <div style={{ fontSize: '18px', fontWeight: 700 }}>
          Score: <span style={{ color: '#FFA502' }}>{score.toLocaleString()}</span>
        </div>
        <div style={{ fontSize: '14px', color: '#8892b0' }}>
          Level {level}
        </div>
      </div>

      <div
        className="game-layout"
        style={{
          display: 'flex',
          gap: '24px',
          padding: '24px',
          alignItems: 'flex-start',
          justifyContent: 'center',
          flex: 1,
          position: 'relative',
        }}
      >
        {bannerVisible && (
          <div
            className={bannerFading ? 'victory-banner fading' : 'victory-banner'}
            style={{
              position: 'absolute',
              top: '0',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%)',
              padding: '16px 48px',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(255, 215, 0, 0.4), 0 0 60px rgba(255, 165, 0, 0.3)',
              zIndex: 9999,
              animation: bannerFading ? 'bannerFadeOut 0.4s ease-in forwards' : 'bannerSlideIn 0.5s ease-out forwards',
              textAlign: 'center',
              minWidth: '280px',
              border: '2px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            <div
              style={{
                fontSize: '32px',
                fontWeight: 800,
                color: '#fff',
                textShadow: '0 0 10px rgba(255, 215, 0, 0.8), 0 2px 4px rgba(0, 0, 0, 0.3)',
                letterSpacing: '3px',
                marginBottom: '4px',
              }}
            >
              🏆 Victory!
            </div>
            <div
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: 'rgba(255, 255, 255, 0.95)',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
              }}
            >
              Final Score: <span style={{ color: '#1A1A2E', fontWeight: 800 }}>{score.toLocaleString()}</span>
            </div>
          </div>
        )}

        <div
          style={{
            position: 'relative',
            background: flashOn ? '#00D2D3' : '#1A1A2E',
            borderRadius: '12px',
            padding: '8px',
            transition: 'background 0.15s',
          }}
        >
          <Grid />

          {isWin && !winAnimating && (
            <div
              className="win-overlay"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.5)',
                borderRadius: '12px',
                zIndex: 10,
              }}
            >
              <div
                className="win-text"
                style={{
                  color: '#fff',
                  fontSize: '48px',
                  fontWeight: 800,
                  textShadow: '0 0 20px #00D2D3, 0 0 40px #00D2D3',
                  animation: 'winPulse 1s ease-in-out infinite',
                }}
              >
                YOU WIN!
              </div>
            </div>
          )}
        </div>

        <ScorePanel />
      </div>

      <div style={{ padding: '8px', color: '#4a5568', fontSize: '11px', textAlign: 'center' }}>
        Click same-color adjacent balls to chain react!
      </div>
    </div>
  );
}
