import { useEffect, useRef, useState, useCallback } from 'react';
import GameCore from './GameCore';
import Renderer from './Renderer';
import EventSystem from './EventSystem';
import AudioManager from './AudioManager';
import { SwapInfo, PARTICLE_COLORS, MatchGroup, Particle } from './types';
import { wait } from './utils';

const CELL_SIZE = 50;
const SPACING = 2;
const TOP_BAR_HEIGHT = 60;

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<GameCore | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const eventSystemRef = useRef<EventSystem | null>(null);
  const audioRef = useRef<AudioManager>(AudioManager.getInstance());
  const rafIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const swapAnimRef = useRef<SwapInfo | null>(null);
  const [, forceUpdate] = useState<number>(0);
  const uiTickRef = useRef<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const getGridOffset = useCallback((width: number, height: number) => {
    const game = gameRef.current;
    if (!game || !rendererRef.current) return { x: 0, y: TOP_BAR_HEIGHT };
    const { w, h } = rendererRef.current.getGridTotalSize(game.rows, game.cols);
    const x = Math.floor((width - w) / 2);
    const y = TOP_BAR_HEIGHT + Math.floor((height - TOP_BAR_HEIGHT - h) / 2);
    return { x, y };
  }, []);

  const handleResize = useCallback(() => {
    if (!containerRef.current || !canvasRef.current || !rendererRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    rendererRef.current.resize(width, height);
    const offset = getGridOffset(width, height);
    rendererRef.current.setGridOffset(offset.x, offset.y);
    if (eventSystemRef.current) {
      eventSystemRef.current.setOffset(offset.x, offset.y);
    }
  }, [getGridOffset]);

  const gameLoop = useCallback((timestamp: number) => {
    if (!gameRef.current || !rendererRef.current) {
      rafIdRef.current = requestAnimationFrame(gameLoop);
      return;
    }
    const last = lastTimeRef.current || timestamp;
    let dt = (timestamp - last) / 1000;
    if (dt > 0.05) dt = 0.05;
    lastTimeRef.current = timestamp;
    gameRef.current.updateParticlesAnimation(dt);
    if (swapAnimRef.current) {
      const info = swapAnimRef.current;
      info.progress += dt;
      const t = Math.min(1, info.progress / info.duration);
      rendererRef.current!.setSwapAnimation({ ...info, progress: t * info.duration });
      if (info.progress >= info.duration) {
        const completed = swapAnimRef.current;
        swapAnimRef.current = null;
        rendererRef.current!.setSwapAnimation(null);
        if (completed.onComplete) completed.onComplete();
      }
    }
    rendererRef.current.render(gameRef.current.getState(), dt);
    uiTickRef.current++;
    if (uiTickRef.current % 6 === 0) {
      forceUpdate((n) => n + 1);
    }
    rafIdRef.current = requestAnimationFrame(gameLoop);
  }, []);

  const spawnBurstForGroup = useCallback((matches: MatchGroup[]) => {
    if (!rendererRef.current || !gameRef.current) return;
    const { cellSize, spacing } = rendererRef.current.config;
    const offset = getGridOffset(
      containerRef.current?.clientWidth || window.innerWidth,
      containerRef.current?.clientHeight || window.innerHeight
    );
    const total = cellSize + spacing;
    matches.forEach((g) => {
      g.particles.forEach((p) => {
        const colors = PARTICLE_COLORS[p.type];
        const cx = offset.x + p.col * total + spacing + cellSize / 2;
        const cy = offset.y + p.row * total + spacing + cellSize / 2;
        rendererRef.current!.createBurst(cx, cy, colors.main, 24);
      });
    });
  }, [getGridOffset]);

  const handleSwap = useCallback(async (r1: number, c1: number, r2: number, c2: number) => {
    const game = gameRef.current;
    const renderer = rendererRef.current;
    const events = eventSystemRef.current;
    if (!game || !renderer || !events) return;
    if (!game.isPlaying || game.isProcessing) return;
    if (!game.isAdjacent(r1, c1, r2, c2)) return;
    if (!game.swap(r1, c1, r2, c2)) return;
    events.setLocked(true);
    audioRef.current.playSwap();
    swapAnimRef.current = {
      from: { row: r1, col: c1 },
      to: { row: r2, col: c2 },
      progress: 0,
      duration: 0.18,
      isReverting: false,
      onComplete: async () => {
        const hasMatch = game.hasAnyMatch();
        if (!hasMatch) {
          audioRef.current.playInvalidSwap();
          game.revertSwap(r1, c1, r2, c2);
          swapAnimRef.current = {
            from: { row: r1, col: c1 },
            to: { row: r2, col: c2 },
            progress: 0,
            duration: 0.2,
            isReverting: true,
            onComplete: () => {
              events.setLocked(false);
            }
          };
        } else {
          audioRef.current.playMatch();
          const game2 = game!;
          const renderer2 = renderer!;
          const unsub = game2.on((ev) => {
            if (ev.type === 'match') {
              spawnBurstForGroup(ev.groups);
            }
            if (ev.type === 'chain') {
              renderer2.triggerGlowPulse(0.55 + ev.level * 0.08);
              audioRef.current.playChain(ev.level);
            }
          });
          try {
            await game.resolveMatches();
          } finally {
            unsub();
            events.setLocked(false);
          }
        }
      }
    };
  }, [spawnBurstForGroup]);

  const handleSelectStart = useCallback((r: number, c: number) => {
    rendererRef.current?.setSelected(r, c);
  }, []);

  const handleSelectEnd = useCallback(() => {
    rendererRef.current?.setSelected(null, null);
  }, []);

  const startGame = useCallback(() => {
    if (!gameRef.current) return;
    audioRef.current.playStart();
    gameRef.current.start();
    forceUpdate((n) => n + 1);
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      audioRef.current.setEnabled(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    const canvas = canvasRef.current;
    const game = new GameCore();
    gameRef.current = game;
    const renderer = new Renderer(canvas, { cellSize: CELL_SIZE, spacing: SPACING, padding: 0 });
    rendererRef.current = renderer;
    const events = new EventSystem(canvas, {
      cellSize: CELL_SIZE,
      spacing: SPACING,
      rows: game.rows,
      cols: game.cols
    });
    eventSystemRef.current = events;
    events.onSwap(handleSwap);
    events.onSelectStart(handleSelectStart);
    events.onSelectEnd(handleSelectEnd);
    game.on((ev) => {
      if (ev.type === 'gameover') {
        audioRef.current.playGameOver();
        forceUpdate((n) => n + 1);
      }
    });
    game.init();
    handleResize();
    window.addEventListener('resize', handleResize);
    lastTimeRef.current = 0;
    rafIdRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
      window.removeEventListener('resize', handleResize);
      events.destroy();
      game.destroy();
      gameRef.current = null;
      rendererRef.current = null;
      eventSystemRef.current = null;
    };
  }, [handleResize, gameLoop, handleSwap, handleSelectStart, handleSelectEnd]);

  const state = gameRef.current?.getState();
  const timeLeft = state?.timeLeft ?? 0;
  const totalTime = state?.totalTime ?? 90;
  const score = state?.score ?? 0;
  const highScore = state?.highScore ?? 0;
  const isPlaying = state?.isPlaying ?? false;
  const showResult = state?.showResult ?? false;
  const progress = totalTime > 0 ? timeLeft / totalTime : 0;
  const progressWidth = `${Math.max(0, progress * 100)}%`;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(180deg, #0B0E1A 0%, #1A2040 100%)',
        overflow: 'hidden'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: TOP_BAR_HEIGHT,
          background: 'rgba(11, 14, 26, 0.55)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(74, 144, 217, 0.2)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          gap: 24,
          zIndex: 10,
          transition: 'all 0.2s ease'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            minWidth: 140
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 8
            }}
          >
            <span
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: timeLeft <= 10 ? '#FF6B6B' : '#FFFFFF',
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: 1,
                textShadow: timeLeft <= 10 ? '0 0 12px rgba(255,107,107,0.6)' : 'none',
                transition: 'color 0.2s, text-shadow 0.2s'
              }}
            >
              {String(Math.floor(timeLeft / 60)).padStart(1, '0')}:
              {String(timeLeft % 60).padStart(2, '0')}
            </span>
            <span
              style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.45)',
                letterSpacing: 1.5,
                textTransform: 'uppercase'
              }}
            >
              TIME
            </span>
          </div>
          <div
            style={{
              width: 140,
              height: 5,
              background: 'rgba(255,255,255,0.08)',
              borderRadius: 3,
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                width: progressWidth,
                height: '100%',
                background:
                  timeLeft <= 10
                    ? 'linear-gradient(90deg, #FF6B6B, #FF4757)'
                    : 'linear-gradient(90deg, #4A90D9, #7EB8FF)',
                borderRadius: 3,
                transition: 'width 1s linear, background 0.2s'
              }}
            />
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 2
          }}
        >
          <span
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: '#FFD700',
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: 1,
              textShadow: '0 0 16px rgba(255,215,0,0.35)',
              transition: 'transform 0.2s'
            }}
          >
            {score.toLocaleString()}
          </span>
          <span
            style={{
              fontSize: 10,
              color: 'rgba(255,215,0,0.6)',
              letterSpacing: 2,
              textTransform: 'uppercase'
            }}
          >
            Score
          </span>
        </div>
        <button
          onClick={toggleSound}
          title={soundEnabled ? '关闭音效' : '开启音效'}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: soundEnabled
              ? 'linear-gradient(135deg, rgba(74,144,217,0.35), rgba(53,122,189,0.25))'
              : 'rgba(255,255,255,0.06)',
            border: soundEnabled
              ? '1px solid rgba(74,144,217,0.5)'
              : '1px solid rgba(255,255,255,0.1)',
            color: soundEnabled ? '#7EB8FF' : 'rgba(255,255,255,0.4)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            padding: 0
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)';
            (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.2)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
            (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1)';
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            {soundEnabled ? (
              <>
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </>
            ) : (
              <>
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </>
            )}
          </svg>
        </button>
      </div>
      {!isPlaying && !showResult && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
            background: 'rgba(11, 14, 26, 0.35)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)'
          }}
        >
          <div
            style={{
              background: 'rgba(10, 14, 26, 0.9)',
              border: '1px solid rgba(74, 144, 217, 0.3)',
              borderRadius: 24,
              padding: '40px 48px',
              boxShadow:
                '0 24px 64px rgba(0,0,0,0.5), 0 0 60px rgba(74,144,217,0.12)',
              textAlign: 'center',
              maxWidth: 420,
              transition: 'all 0.2s'
            }}
          >
            <h1
              style={{
                fontSize: 36,
                fontWeight: 900,
                background: 'linear-gradient(135deg, #7EB8FF 0%, #A55EEA 50%, #FFD700