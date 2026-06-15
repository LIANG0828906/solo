import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Direction,
  ItemType,
  Position,
  GameState,
  GRID_SIZE,
  BASE_TICK_INTERVAL,
  SPEED_BUFF_MULTIPLIER,
  SPEED_BUFF_DURATION,
} from './types';
import {
  createInitialState,
  gameTick,
  isOppositeDirection,
  getRandomQuote,
} from './gameEngine';

const HIGH_SCORE_KEY = 'cyber_snake_high_score';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(HIGH_SCORE_KEY) : null;
    const highScore = saved ? parseInt(saved, 10) || 0 : 0;
    return createInitialState(highScore);
  });

  const [now, setNow] = useState<number>(Date.now());
  const [gameOverQuote, setGameOverQuote] = useState<string>('');
  const [shockwavePoint, setShockwavePoint] = useState<Position | null>(null);
  const [btnPressed, setBtnPressed] = useState(false);

  const gameStateRef = useRef<GameState>(gameState);
  gameStateRef.current = gameState;

  const containerRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState<number>(32);

  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      const maxSize = Math.min(w, h) / GRID_SIZE;
      setCellSize(Math.max(12, Math.floor(maxSize)));
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (gameState.isGameOver && gameState.highScore > 0) {
      localStorage.setItem(HIGH_SCORE_KEY, String(gameState.highScore));
    }
  }, [gameState.isGameOver, gameState.highScore]);

  useEffect(() => {
    let rafId: number;
    const loop = () => {
      setNow(Date.now());
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const lastTickRef = useRef<number>(Date.now());
  useEffect(() => {
    if (gameState.isGameOver || gameState.isPaused) {
      lastTickRef.current = now;
      return;
    }
    const interval = gameState.speedBuff.active && now < gameState.speedBuff.endTime
      ? BASE_TICK_INTERVAL * SPEED_BUFF_MULTIPLIER
      : BASE_TICK_INTERVAL;
    if (now - lastTickRef.current >= interval) {
      lastTickRef.current = now;
      const result = gameTick(gameStateRef.current, now);
      if (result.collisionPoint) {
        setShockwavePoint(result.collisionPoint);
        setGameOverQuote(getRandomQuote());
      }
      setGameState(result.newState);
    }
  }, [now, gameState.isGameOver, gameState.isPaused, gameState.speedBuff.active, gameState.speedBuff.endTime]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const state = gameStateRef.current;
      let newDir: Direction | null = null;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          newDir = Direction.UP;
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          newDir = Direction.DOWN;
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          newDir = Direction.LEFT;
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          newDir = Direction.RIGHT;
          break;
        case ' ':
          e.preventDefault();
          if (state.isGameOver) return;
          setGameState((prev) => ({ ...prev, isPaused: !prev.isPaused }));
          return;
      }
      if (newDir) {
        e.preventDefault();
        if (state.isGameOver || state.isPaused) return;
        if (isOppositeDirection(state.direction, newDir)) return;
        setGameState((prev) => ({ ...prev, nextDirection: newDir as Direction }));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const restartGame = useCallback(() => {
    setBtnPressed(true);
    setTimeout(() => setBtnPressed(false), 200);
    const currentHigh = gameStateRef.current.highScore;
    setGameState(createInitialState(currentHigh));
    setShockwavePoint(null);
    setGameOverQuote('');
  }, []);

  const gridPixelSize = cellSize * GRID_SIZE;

  const cameraOffset = useMemo(() => {
    const head = gameState.snake[0];
    if (!head) return { x: 0, y: 0 };
    const centerX = GRID_SIZE / 2;
    const centerY = GRID_SIZE / 2;
    return {
      x: (centerX - head.x) * cellSize * 0.3,
      y: (centerY - head.y) * cellSize * 0.3,
    };
  }, [gameState.snake, cellSize]);

  const speedRemaining = useMemo(() => {
    if (!gameState.speedBuff.active) return 0;
    return Math.max(0, Math.ceil((gameState.speedBuff.endTime - now) / 1000));
  }, [gameState.speedBuff, now]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        padding: '2%',
        minWidth: 320,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        background: 'radial-gradient(ellipse at center, #0a0a2a 0%, #050515 50%, #000008 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 20% 30%, rgba(0,255,200,0.05) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(180,0,255,0.05) 0%, transparent 50%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: gridPixelSize + 100,
          padding: '12px 20px',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          background: 'rgba(10, 15, 40, 0.45)',
          border: '1px solid rgba(0, 220, 255, 0.25)',
          borderRadius: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          boxShadow: '0 0 30px rgba(0,200,255,0.08), inset 0 0 20px rgba(0,150,255,0.04)',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 10, color: '#6ab7ff', letterSpacing: 2 }}>SCORE</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: '#00ffcc', textShadow: '0 0 10px #00ffcc88' }}>
              {gameState.score}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 10, color: '#ffd77a', letterSpacing: 2 }}>HIGH</span>
            <span
              style={{
                fontSize: 22,
                fontWeight: 900,
                color: '#ffd700',
                animation: 'gold-glow 2s ease-in-out infinite',
              }}
            >
              {gameState.highScore}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 10, color: '#88ff88', letterSpacing: 2 }}>LENGTH</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#aaffaa' }}>{gameState.snake.length}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {gameState.speedBuff.active && speedRemaining > 0 && (
            <BuffIndicator
              color="#00bfff"
              icon="⚡"
              label={`${speedRemaining}s`}
              glow="0 0 12px #00bfff, 0 0 24px #00bfff66"
            />
          )}
          {gameState.shieldBuff.count > 0 && (
            <BuffIndicator
              color="#ffd700"
              icon="🛡"
              label={`×${gameState.shieldBuff.count}`}
              glow="0 0 12px #ffd700, 0 0 24px #ffd70066"
            />
          )}
        </div>
      </div>

      <div
        ref={containerRef}
        style={{
          flex: 1,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          minHeight: 0,
        }}
      >
        <div
          style={{
            position: 'relative',
            width: gridPixelSize,
            height: gridPixelSize,
            transform: `translate(${cameraOffset.x}px, ${cameraOffset.y}px)`,
            transition: 'transform 0.15s ease-out',
            filter: gameState.isPaused ? 'grayscale(0.8) brightness(0.7)' : 'none',
            transitionProperty: 'transform, filter',
          }}
        >
          <svg
            width={gridPixelSize}
            height={gridPixelSize}
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          >
            {Array.from({ length: GRID_SIZE + 1 }).map((_, i) => (
              <g key={`grid-${i}`}>
                <line
                  x1={i * cellSize}
                  y1={0}
                  x2={i * cellSize}
                  y2={gridPixelSize}
                  stroke="rgba(0, 220, 255, 0.3)"
                  strokeWidth={0.5}
                />
                <line
                  x1={0}
                  y1={i * cellSize}
                  x2={gridPixelSize}
                  y2={i * cellSize}
                  stroke="rgba(0, 220, 255, 0.3)"
                  strokeWidth={0.5}
                />
              </g>
            ))}
          </svg>

          <div
            style={{
              position: 'absolute',
              inset: 0,
              border: `3px solid ${gameState.borderFlash ? '#ff3355' : 'rgba(0,220,255,0.5)'}`,
              borderRadius: 6,
              boxShadow: gameState.borderFlash
                ? '0 0 30px #ff3355, inset 0 0 30px #ff335566'
                : '0 0 20px rgba(0,200,255,0.2), inset 0 0 20px rgba(0,150,255,0.1)',
              animation: gameState.borderFlash ? 'border-warning 0.3s ease-in-out 3' : undefined,
              background:
                'linear-gradient(135deg, rgba(0,100,255,0.08) 0%, rgba(150,0,255,0.08) 100%)',
              pointerEvents: 'none',
            }}
          />

          {gameState.trail.map((t, idx) => {
            const age = (now - t.timestamp) / 5000;
            const opacity = Math.max(0, 0.35 * (1 - age));
            return (
              <div
                key={`trail-${t.x}-${t.y}-${idx}`}
                style={{
                  position: 'absolute',
                  left: t.x * cellSize + cellSize * 0.2,
                  top: t.y * cellSize + cellSize * 0.2,
                  width: cellSize * 0.6,
                  height: cellSize * 0.6,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(0,255,150,0.6) 0%, transparent 70%)',
                  opacity,
                  pointerEvents: 'none',
                }}
              />
            );
          })}

          {gameState.items.map((item) => (
            <ItemCell key={item.id} item={item} cellSize={cellSize} />
          ))}

          {gameState.snake.map((seg, idx) => (
            <SnakeCell
              key={seg.id}
              segment={seg}
              index={idx}
              isHead={idx === 0}
              isTail={idx === gameState.snake.length - 1}
              cellSize={cellSize}
              totalLength={gameState.snake.length}
              hasShield={idx === 0 && gameState.shieldBuff.count > 0}
              hasSpeed={gameState.speedBuff.active && now < gameState.speedBuff.endTime}
            />
          ))}

          {shockwavePoint && (
            <div
              style={{
                position: 'absolute',
                left: shockwavePoint.x * cellSize + cellSize / 2 - cellSize,
                top: shockwavePoint.y * cellSize + cellSize / 2 - cellSize,
                width: cellSize * 2,
                height: cellSize * 2,
                borderRadius: '50%',
                border: '3px solid #ff3355',
                background: 'radial-gradient(circle, rgba(255,50,80,0.4) 0%, transparent 70%)',
                animation: 'shockwave-expand 0.8s ease-out forwards',
                pointerEvents: 'none',
              }}
            />
          )}
        </div>

        {gameState.isPaused && !gameState.isGameOver && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(5, 5, 20, 0.65)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            <div
              style={{
                fontSize: 80,
                fontWeight: 900,
                color: '#00ffff',
                letterSpacing: 10,
                animation: 'pause-pulse 1.2s ease-in-out infinite',
                textShadow: '0 0 20px #00ffff, 0 0 40px #00ffff66',
              }}
            >
              ⏸
            </div>
          </div>
        )}

        {gameState.isGameOver && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(5, 0, 10, 0.75)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 20,
              padding: 20,
            }}
          >
            <div
              style={{
                minWidth: 280,
                maxWidth: 420,
                width: '100%',
                padding: 32,
                borderRadius: 20,
                background:
                  'linear-gradient(135deg, rgba(20, 10, 60, 0.95) 0%, rgba(50, 10, 80, 0.95) 100%)',
                border: '2px solid rgba(255, 80, 120, 0.5)',
                boxShadow:
                  '0 0 40px rgba(255, 50, 100, 0.25), inset 0 0 40px rgba(150, 0, 200, 0.1)',
                animation: 'panel-expand 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 18,
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  color: '#ff88aa',
                  letterSpacing: 4,
                  fontWeight: 500,
                }}
              >
                GAME OVER
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: '#aaccff',
                  fontStyle: 'italic',
                  opacity: 0.85,
                  lineHeight: 1.6,
                  padding: '4px 8px',
                  borderLeft: '2px solid #00bfff',
                }}
              >
                "{gameOverQuote}"
              </div>
              <div style={{ display: 'flex', gap: 28, marginTop: 4 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: '#88aacc', letterSpacing: 2 }}>SCORE</span>
                  <span style={{ fontSize: 36, fontWeight: 900, color: '#00ffcc', textShadow: '0 0 16px #00ffccaa' }}>
                    {gameState.score}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: '#ffd77a', letterSpacing: 2 }}>BEST</span>
                  <span
                    style={{
                      fontSize: 36,
                      fontWeight: 900,
                      color: '#ffd700',
                      animation: 'gold-glow 2s ease-in-out infinite',
                    }}
                  >
                    {gameState.highScore}
                  </span>
                </div>
              </div>
              <GradientButton onClick={restartGame} pressed={btnPressed}>
                重新开始
              </GradientButton>
              <div style={{ fontSize: 10, color: '#5577aa', letterSpacing: 1, marginTop: 4 }}>
                方向键 / WASD 控制 · 空格 暂停
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BuffIndicator({
  color,
  icon,
  label,
  glow,
}: {
  color: string;
  icon: string;
  label: string;
  glow: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        borderRadius: 10,
        background: `linear-gradient(135deg, ${color}22 0%, ${color}11 100%)`,
        border: `1px solid ${color}66`,
        boxShadow: glow,
      }}
    >
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color }}>{label}</span>
    </div>
  );
}

function ItemCell({ item, cellSize }: { item: { type: ItemType; position: Position }; cellSize: number }) {
  const colors: Record<ItemType, { main: string; glow: string }> = {
    [ItemType.ENERGY]: { main: '#ff3355', glow: '#ff3355' },
    [ItemType.SPEED]: { main: '#00bfff', glow: '#00bfff' },
    [ItemType.SHIELD]: { main: '#ffd700', glow: '#ffd700' },
  };
  const c = colors[item.type];
  const size = cellSize * 0.65;
  return (
    <div
      style={{
        position: 'absolute',
        left: item.position.x * cellSize + (cellSize - size) / 2,
        top: item.position.y * cellSize + (cellSize - size) / 2,
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${c.main} 0%, ${c.main}aa 60%, transparent 100%)`,
          boxShadow: `0 0 ${size * 0.6}px ${c.main}, 0 0 ${size * 1.2}px ${c.main}66`,
          animation: 'item-rotate 3s linear infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: size * 0.5,
          height: size * 0.5,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.4)',
          top: size * 0.12,
          left: size * 0.2,
          filter: 'blur(1px)',
        }}
      />
    </div>
  );
}

function SnakeCell({
  segment,
  index,
  isHead,
  isTail,
  cellSize,
  totalLength,
  hasShield,
  hasSpeed,
}: {
  segment: Position;
  index: number;
  isHead: boolean;
  isTail: boolean;
  cellSize: number;
  totalLength: number;
  hasShield: boolean;
  hasSpeed: boolean;
}) {
  const t = totalLength > 1 ? index / (totalLength - 1) : 0;
  const baseColor = `rgb(${Math.round(0 + t * 40)}, ${Math.round(255 - t * 80)}, ${Math.round(136 - t * 40)})`;

  if (isHead) {
    const headSize = cellSize * 0.92;
    return (
      <div
        style={{
          position: 'absolute',
          left: segment.x * cellSize + (cellSize - headSize) / 2,
          top: segment.y * cellSize + (cellSize - headSize) / 2,
          width: headSize,
          height: headSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'pulse-glow 1.5s ease-in-out infinite',
        }}
      >
        {hasShield && (
          <div
            style={{
              position: 'absolute',
              width: headSize * 1.5,
              height: headSize * 1.5,
              borderRadius: '50%',
              border: '2px solid #ffd700',
              boxShadow: '0 0 16px #ffd700, inset 0 0 16px #ffd70066',
              animation: 'shield-rotate 2s linear infinite',
              opacity: 0.85,
            }}
          />
        )}
        <svg width={headSize} height={headSize} viewBox="0 0 100 100">
          <defs>
            <linearGradient id="head-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#88ffbb" />
              <stop offset="100%" stopColor="#00ff88" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <polygon
            points="50,5 90,27.5 90,72.5 50,95 10,72.5 10,27.5"
            fill="url(#head-grad)"
            filter="url(#glow)"
          />
          <circle cx="35" cy="40" r="6" fill="#001122" />
          <circle cx="65" cy="40" r="6" fill="#001122" />
          <circle cx="37" cy="38" r="2" fill="#ffffff" />
          <circle cx="67" cy="38" r="2" fill="#ffffff" />
        </svg>
        {hasSpeed && (
          <>
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: '#00bfff',
                  boxShadow: '0 0 6px #00bfff',
                  left: -8 - i * 6,
                  top: headSize * 0.35 + i * 5,
                  animation: 'particle-flow 0.6s linear infinite',
                  animationDelay: `${i * 0.15}s`,
                  ['--px' as any]: '-20px',
                  ['--py' as any]: `${10 + i * 5}px`,
                } as React.CSSProperties}
              />
            ))}
          </>
        )}
      </div>
    );
  }

  const segSize = isTail ? cellSize * 0.55 : cellSize * 0.78;
  return (
    <div
      style={{
        position: 'absolute',
        left: segment.x * cellSize + (cellSize - segSize) / 2,
        top: segment.y * cellSize + (cellSize - segSize) / 2,
        width: segSize,
        height: segSize,
        borderRadius: isTail ? '50%' : 6,
        background: `radial-gradient(circle at 30% 30%, #aaffcc 0%, ${baseColor} 100%)`,
        boxShadow: hasSpeed
          ? `0 0 ${cellSize * 0.25}px #00bfff88, inset 0 0 ${cellSize * 0.15}px rgba(255,255,255,0.2)`
          : `0 0 ${cellSize * 0.2}px rgba(0,255,136,0.35), inset 0 0 ${cellSize * 0.15}px rgba(255,255,255,0.15)`,
      }}
    >
      {hasSpeed && (
        <div
          style={{
            position: 'absolute',
            right: -4,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#00bfff',
            boxShadow: '0 0 8px #00bfff',
            opacity: 0.7,
          }}
        />
      )}
    </div>
  );
}

function GradientButton({
  children,
  onClick,
  pressed,
}: {
  children: React.ReactNode;
  onClick: () => void;
  pressed: boolean;
}) {
  const [hovering, setHovering] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{
        position: 'relative',
        padding: '14px 36px',
        fontSize: 15,
        fontWeight: 700,
        color: '#ffffff',
        fontFamily: "'Orbitron', sans-serif",
        letterSpacing: 3,
        border: 'none',
        borderRadius: 12,
        cursor: 'pointer',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #0a2463 0%, #3e1f72 100%)',
        boxShadow: '0 0 20px rgba(100, 50, 200, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
        transform: pressed ? 'translateY(4px)' : 'translateY(0)',
        transition: 'transform 0.15s ease-out, box-shadow 0.2s',
        animation: pressed ? 'btn-press 0.2s ease-out' : undefined,
      }}
    >
      {hovering && (
        <span
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(90deg, transparent 0%, rgba(150, 220, 255, 0.35) 50%, transparent 100%)',
            animation: 'btn-sweep 0.6s ease-out forwards',
            pointerEvents: 'none',
          }}
        />
      )}
      <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
    </button>
  );
}
