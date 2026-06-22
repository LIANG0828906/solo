import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  initGame,
  startGame,
  setCanvasSize,
  handleKeyDown,
  handleKeyUp,
  setShooting,
  update,
} from './GameEngine';
import type { GameState } from './GameEngine';
import { GameRenderer } from './GameRenderer';
import {
  GameContext,
  StatusBar,
  StartScreen,
  GameOverModal,
  LeaderboardModal,
  type LeaderboardEntry,
} from './UIComponents';

const LEADERBOARD_KEY = 'bullet_shooter_leaderboard';
const MAX_LEADERBOARD = 10;

function loadLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveLeaderboard(entries: LeaderboardEntry[]): void {
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries));
  } catch {
    /* noop */
  }
}

export default function App(): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<GameRenderer | null>(null);
  const gameStateRef = useRef<GameState | null>(null);
  const rafRef = useRef<number | null>(null);

  const [, forceRender] = useState(0);
  const rerender = useCallback(() => forceRender((n) => n + 1), []);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() =>
    loadLeaderboard()
  );
  const [scoreSaved, setScoreSaved] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showStartScreen, setShowStartScreen] = useState(true);

  const getCanvasSize = useCallback((): { w: number; h: number } => {
    return {
      w: window.innerWidth,
      h: window.innerHeight,
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = new GameRenderer(canvas);
    rendererRef.current = renderer;
    const { w, h } = getCanvasSize();
    renderer.resize(w, h);
    gameStateRef.current = initGame(w, h);

    const handleResize = (): void => {
      const { w: nw, h: nh } = getCanvasSize();
      renderer.resize(nw, nh);
      if (gameStateRef.current) {
        setCanvasSize(gameStateRef.current, nw, nh);
      }
    };
    window.addEventListener('resize', handleResize);

    let lastUiTick = 0;
    const loop = (t: number): void => {
      const state = gameStateRef.current;
      if (state) {
        update(state);
        renderer.render(state);
        if (t - lastUiTick > 100) {
          lastUiTick = t;
          rerender();
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    const onKeyDown = (e: KeyboardEvent): void => {
      const st = gameStateRef.current;
      if (!st) return;
      handleKeyDown(st, e.key);
      if (
        ['w', 'a', 's', 'd', ' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(
          e.key
        )
      ) {
        e.preventDefault();
      }
    };
    const onKeyUp = (e: KeyboardEvent): void => {
      const st = gameStateRef.current;
      if (!st) return;
      handleKeyUp(st, e.key);
    };
    const onMouseDown = (e: MouseEvent): void => {
      const st = gameStateRef.current;
      if (!st || !st.running) return;
      if (e.button === 0) {
        setShooting(st, true);
      }
    };
    const onMouseUp = (e: MouseEvent): void => {
      const st = gameStateRef.current;
      if (!st) return;
      if (e.button === 0) {
        setShooting(st, false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);

    let prevGameOver = false;
    const checkGameOver = setInterval(() => {
      const st = gameStateRef.current;
      if (st && st.gameOver && !prevGameOver) {
        prevGameOver = true;
        setScoreSaved(false);
        rerender();
      } else if (st && !st.gameOver) {
        prevGameOver = false;
      }
    }, 100);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      clearInterval(checkGameOver);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [getCanvasSize, rerender]);

  const handleStart = useCallback((): void => {
    const st = gameStateRef.current;
    if (!st) return;
    gameStateRef.current = startGame(st);
    setScoreSaved(false);
    setShowStartScreen(false);
    rerender();
  }, [rerender]);

  const handleRestart = useCallback((): void => {
    const st = gameStateRef.current;
    if (!st) return;
    gameStateRef.current = startGame(st);
    setScoreSaved(false);
    setShowStartScreen(false);
    rerender();
  }, [rerender]);

  const handleSaveScore = useCallback((): boolean => {
    const st = gameStateRef.current;
    if (!st || scoreSaved) return false;
    const entry: LeaderboardEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      score: st.score,
      survivalTime: st.survivalTime,
      date: new Date().toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    const next = [...leaderboard, entry]
      .sort((a, b) => b.score - a.score || b.survivalTime - a.survivalTime)
      .slice(0, MAX_LEADERBOARD);
    setLeaderboard(next);
    saveLeaderboard(next);
    setScoreSaved(true);
    return true;
  }, [leaderboard, scoreSaved]);

  const state = gameStateRef.current!;

  return (
    <GameContext.Provider
      value={{
        gameState: state,
        restart: handleRestart,
        saveScore: handleSaveScore,
        scoreSaved,
        leaderboard,
        showLeaderboard,
        setShowLeaderboard,
        showStartScreen,
        startGame: handleStart,
      }}
    >
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: '#0D1117',
          overflow: 'hidden',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
          }}
        />
        {state && state.running && <StatusBar />}
        {state && state.gameOver && <GameOverModal />}
        {showStartScreen && state && !state.running && !state.gameOver && (
          <StartScreen />
        )}
        {showLeaderboard && <LeaderboardModal />}
      </div>
    </GameContext.Provider>
  );
}
