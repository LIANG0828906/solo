import { useEffect, useRef, useState } from 'react';
import { LevelEngine } from '../level/LevelEngine';
import { useGameStore } from '../store/gameStore';

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<LevelEngine | null>(null);
  const [btnHover, setBtnHover] = useState(false);

  const currentScreen = useGameStore((s) => s.currentScreen);
  const paused = useGameStore((s) => s.paused);
  const togglePause = useGameStore((s) => s.togglePause);
  const setPaused = useGameStore((s) => s.setPaused);

  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new LevelEngine(canvasRef.current);
    engineRef.current = engine;
    engine.start();
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  const showPauseButton = currentScreen === 'playing';

  return (
    <div style={{ position: 'relative', width: 960, height: 640 }}>
      <canvas
        ref={canvasRef}
        width={960}
        height={640}
        className="game-canvas"
        style={{ display: 'block' }}
      />

      {showPauseButton && (
        <button
          onMouseEnter={() => setBtnHover(true)}
          onMouseLeave={() => setBtnHover(false)}
          onClick={() => togglePause()}
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            opacity: btnHover ? 1 : 0.55,
            transition: 'opacity 0.2s ease',
            zIndex: 5,
          }}
          aria-label="暂停游戏"
          title="暂停 (Esc)"
        >
          <svg width="28" height="28" viewBox="0 0 24 24">
            <rect
              x="6"
              y="4"
              width="4"
              height="16"
              rx="1"
              fill="white"
              opacity={btnHover ? 1 : 0.9}
            />
            <rect
              x="14"
              y="4"
              width="4"
              height="16"
              rx="1"
              fill="white"
              opacity={btnHover ? 1 : 0.9}
            />
          </svg>
        </button>
      )}

      {showPauseButton && paused && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(8, 4, 16, 0.72)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
          }}
        >
          <h1
            style={{
              fontSize: 48,
              fontWeight: 900,
              color: '#FFFFFF',
              letterSpacing: 12,
              margin: 0,
              marginBottom: 50,
              textShadow: '0 0 24px rgba(120, 80, 200, 0.6)',
              fontFamily: '"Segoe UI", "PingFang SC", sans-serif',
            }}
          >
            游 戏 暂 停
          </h1>
          <button
            onClick={() => setPaused(false)}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,255,255,0.22)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 20px rgba(0,255,255,0.5), inset 0 0 20px rgba(0,255,255,0.1)';
              (e.currentTarget as HTMLButtonElement).style.textShadow = '0 0 10px #00FFFF';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 8px rgba(0,255,255,0.25)';
              (e.currentTarget as HTMLButtonElement).style.textShadow = 'none';
            }}
            style={{
              padding: '12px 48px',
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: 4,
              color: '#00FFFF',
              background: 'transparent',
              border: '2px solid #00FFFF',
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 0 8px rgba(0,255,255,0.25)',
              fontFamily: '"Segoe UI", "PingFang SC", sans-serif',
            }}
          >
            继 续 游 戏
          </button>
          <div
            style={{
              marginTop: 28,
              fontSize: 12,
              color: 'rgba(200, 180, 240, 0.6)',
              letterSpacing: 2,
            }}
          >
            按 ESC 键可快速切换暂停
          </div>
        </div>
      )}
    </div>
  );
}
