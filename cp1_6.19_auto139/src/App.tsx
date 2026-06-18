import { useEffect, useRef, useState, useCallback } from 'react';
import {
  GameState,
  createInitialState,
  updateGame,
  renderArena,
  resetGame,
  formatTime,
  ARENA_WIDTH,
  ARENA_HEIGHT,
  SPELLS,
  ElementType,
  HIT_FLASH_DURATION,
} from './gameLogic';

const SPELL_ICONS: Record<ElementType, { color: string; label: string }> = {
  fire: { color: '#E74C3C', label: '🔥' },
  ice: { color: '#3498DB', label: '❄️' },
  lightning: { color: '#F1C40F', label: '⚡' },
  shield: { color: '#9B59B6', label: '🛡️' },
  heal: { color: '#2ECC71', label: '💚' },
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState>(createInitialState());
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const [, forceUpdate] = useState(0);
  const [hitFlashKey, setHitFlashKey] = useState(0);

  const triggerUIUpdate = useCallback(() => {
    forceUpdate(v => v + 1);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let uiUpdateAccumulator = 0;

    const loop = (time: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = time;
      const delta = Math.min((time - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = time;

      const state = gameStateRef.current;
      const prevFlashSide = state.hitFlash.side;

      updateGame(state, delta);

      if (state.hitFlash.side !== null && state.hitFlash.side !== prevFlashSide) {
        setHitFlashKey(k => k + 1);
      }
      if (state.hitFlash.side !== null && state.gameTime - state.hitFlash.startTime >= HIT_FLASH_DURATION) {
        state.hitFlash.side = null;
        setHitFlashKey(k => k + 1);
      }

      renderArena(ctx, state);

      uiUpdateAccumulator += delta;
      if (uiUpdateAccumulator >= 0.08) {
        uiUpdateAccumulator = 0;
        triggerUIUpdate();
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = 0;
    };
  }, [triggerUIUpdate]);

  useEffect(() => {
    const container = logContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  });

  const state = gameStateRef.current;
  const leftMage = state.mages[0];
  const rightMage = state.mages[1];

  const handlePauseToggle = () => {
    state.isPaused = !state.isPaused;
    triggerUIUpdate();
  };

  const handleReset = () => {
    resetGame(state);
    lastTimeRef.current = 0;
    setHitFlashKey(k => k + 1);
    triggerUIUpdate();
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10) as 1 | 2 | 3;
    state.speedMultiplier = val;
    triggerUIUpdate();
  };

  const showFlashLeft = state.hitFlash.side === 'left';
  const showFlashRight = state.hitFlash.side === 'right';

  return (
    <div className="app-container">
      <h1 className="app-title">✦ 魔法竞技场 ✦</h1>

      <div className="control-bar">
        <button
          className="control-btn btn-pause"
          onClick={handlePauseToggle}
        >
          {state.isPaused ? '▶ 继续' : '❚❚ 暂停'}
        </button>
        <button
          className="control-btn btn-reset"
          onClick={handleReset}
        >
          ↻ 重置
        </button>
        <div className="speed-control">
          <span className="speed-label">速度</span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <input
              type="range"
              min={1}
              max={3}
              step={1}
              value={state.speedMultiplier}
              onChange={handleSpeedChange}
              className="speed-slider"
            />
            <div className="speed-ticks">
              <span className={`speed-tick ${state.speedMultiplier === 1 ? 'active' : ''}`}>1x</span>
              <span className={`speed-tick ${state.speedMultiplier === 2 ? 'active' : ''}`}>2x</span>
              <span className={`speed-tick ${state.speedMultiplier === 3 ? 'active' : ''}`}>3x</span>
            </div>
          </div>
        </div>
      </div>

      <div className="main-content">
        <div className="arena-wrapper">
          <canvas
            ref={canvasRef}
            width={ARENA_WIDTH}
            height={ARENA_HEIGHT}
            className="arena-canvas"
          />
          {showFlashLeft && (
            <div key={`fl-${hitFlashKey}`} className="hit-flash-left" />
          )}
          {showFlashRight && (
            <div key={`fr-${hitFlashKey}`} className="hit-flash-right" />
          )}
          {state.winner && (
            <div className="winner-overlay">
              <span
                className="winner-text"
                style={{
                  color: state.winner === 'left' ? leftMage.color : rightMage.color,
                }}
              >
                {state.winner === 'left' ? leftMage.name : rightMage.name}
                <br />
                胜 利！
              </span>
            </div>
          )}
        </div>

        <div className="battle-panel">
          <div className="panel-title">
            <span>⚔ 战斗统计</span>
            <span className="game-time">{formatTime(state.gameTime)}</span>
          </div>

          <div className="mage-section">
            <div className="mage-header">
              <span className="mage-dot" style={{ background: leftMage.color, color: leftMage.color }} />
              <span className="mage-name">{leftMage.name}</span>
              <span className="mage-hp-text">{leftMage.hp} / {leftMage.maxHp}</span>
            </div>
            <div className="hp-bar-container">
              <div
                className="hp-bar-fill"
                style={{ width: `${(leftMage.hp / leftMage.maxHp) * 100}%` }}
              />
            </div>
            <div className="cast-stats">
              {(Object.keys(SPELLS) as ElementType[]).map(t => (
                <div key={t} className="cast-stat" title={SPELLS[t].name}>
                  <span
                    className="cast-icon"
                    style={{ background: SPELL_ICONS[t].color, color: SPELL_ICONS[t].color }}
                  />
                  <span className="cast-count">{leftMage.castCount[t]}</span>
                </div>
              ))}
              <div className="cast-stat" title="总计">
                <span className="cast-icon" style={{ background: '#666', color: '#666' }} />
                <span className="cast-count">{leftMage.totalCasts}</span>
              </div>
            </div>
          </div>

          <div className="divider" />

          <div className="mage-section">
            <div className="mage-header">
              <span className="mage-dot" style={{ background: rightMage.color, color: rightMage.color }} />
              <span className="mage-name">{rightMage.name}</span>
              <span className="mage-hp-text">{rightMage.hp} / {rightMage.maxHp}</span>
            </div>
            <div className="hp-bar-container">
              <div
                className="hp-bar-fill"
                style={{ width: `${(rightMage.hp / rightMage.maxHp) * 100}%` }}
              />
            </div>
            <div className="cast-stats">
              {(Object.keys(SPELLS) as ElementType[]).map(t => (
                <div key={t} className="cast-stat" title={SPELLS[t].name}>
                  <span
                    className="cast-icon"
                    style={{ background: SPELL_ICONS[t].color, color: SPELL_ICONS[t].color }}
                  />
                  <span className="cast-count">{rightMage.castCount[t]}</span>
                </div>
              ))}
              <div className="cast-stat" title="总计">
                <span className="cast-icon" style={{ background: '#666', color: '#666' }} />
                <span className="cast-count">{rightMage.totalCasts}</span>
              </div>
            </div>
          </div>

          <div className="divider" />

          <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', letterSpacing: '1px' }}>
            📜 战斗日志
          </div>
          <div ref={logContainerRef} className="log-container">
            {state.logs.map((log, i) => (
              <div key={i} className={`log-item log-type-${log.type}`}>
                <span className="log-timestamp">[{formatTime(log.timestamp)}]</span>
                {log.message}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
