import { useCallback, useEffect, useRef } from 'react';
import { Palette } from './components/Palette';
import { CodePanel, CodePanelHandle } from './components/CodePanel';
import { EffectLayer } from './components/EffectLayer';
import { useGameStore } from './store/gameStore';

function App() {
  const initGame = useGameStore((s) => s.initGame);
  const restartGame = useGameStore((s) => s.restartGame);
  const nextLevel = useGameStore((s) => s.nextLevel);
  const decrementTime = useGameStore((s) => s.decrementTime);
  const clearSelection = useGameStore((s) => s.clearSelection);
  const triggerParticleBurst = useGameStore((s) => s.triggerParticleBurst);

  const level = useGameStore((s) => s.level);
  const score = useGameStore((s) => s.score);
  const timeLeft = useGameStore((s) => s.timeLeft);
  const hintCount = useGameStore((s) => s.hintCount);
  const status = useGameStore((s) => s.status);
  const verifyState = useGameStore((s) => s.verifyState);

  const codePanelRef = useRef<CodePanelHandle>(null);
  const rafRef = useRef<number | null>(null);
  const lastSecondRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const handledRef = useRef<'success' | 'fail' | null>(null);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (verifyState === 'success' && handledRef.current !== 'success') {
      handledRef.current = 'success';
      const center = codePanelRef.current?.getCenter();
      if (center) triggerParticleBurst(center.x, center.y);
      const t = window.setTimeout(() => {
        handledRef.current = null;
        clearSelection();
        nextLevel();
      }, 900);
      return () => window.clearTimeout(t);
    }
    if (verifyState === 'fail' && handledRef.current !== 'fail') {
      handledRef.current = 'fail';
      const t = window.setTimeout(() => {
        handledRef.current = null;
        clearSelection();
      }, 800);
      return () => window.clearTimeout(t);
    }
  }, [verifyState, triggerParticleBurst, clearSelection, nextLevel]);

  useEffect(() => {
    const loop = (now: number) => {
      const dt = now - lastTimeRef.current;
      lastTimeRef.current = now;
      lastSecondRef.current += dt;
      if (lastSecondRef.current >= 1000) {
        lastSecondRef.current -= 1000;
        decrementTime();
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [decrementTime]);

  const handlePhaseChange = useCallback(() => {
    // no-op: phase is driven by rAF inside CodePanel
  }, []);

  const handleRestart = useCallback(() => {
    handledRef.current = null;
    lastTimeRef.current = performance.now();
    lastSecondRef.current = 0;
    restartGame();
  }, [restartGame]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="app-root">
      <div className="app-container">
        <header className="app-header">
          <div className="app-level">关卡 {level.toString().padStart(2, '0')}</div>
          <div className="app-statusbar">
            <div className="status-item">
              <span className="status-label">得分</span>
              <span className="status-score">{score}</span>
            </div>
            <div className="status-item">
              <span className="time-icon" aria-hidden>⏱</span>
              <span className="status-time">{timeStr}</span>
              <span className="time-icon" aria-hidden>⏱</span>
            </div>
            <div className="status-item">
              <span className="status-label">提示</span>
              <span className="status-hint">{hintCount}/3</span>
            </div>
          </div>
        </header>

        <main className="app-main">
          <CodePanel ref={codePanelRef} onPhaseChange={handlePhaseChange} />
          <Palette />
        </main>

        <footer className="app-footer">
          <button type="button" className="restart-btn" onClick={handleRestart}>
            重新开始
          </button>
        </footer>
      </div>

      <EffectLayer />

      {status === 'timeout' && (
        <div className="gameover-overlay">
          <div className="gameover-card">
            <div className="gameover-title">时间到！</div>
            <div className="gameover-label">最终得分</div>
            <div className="gameover-score">{score}</div>
            <div className="gameover-level">到达关卡：第 {level} 关</div>
            <button type="button" className="restart-btn" onClick={handleRestart}>
              重新开始
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
