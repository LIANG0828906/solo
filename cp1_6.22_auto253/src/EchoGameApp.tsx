import React, { useEffect, useRef, useState, useCallback } from 'react';
import { EventBus, GameState, GameStatus, Position, LevelData, WanderingBat } from './types';
import { SonarEngine } from './SonarEngine';
import { CaveLevelBuilder } from './CaveLevelBuilder';

const GAME_TOTAL_TIME = 60;
const CRYSTAL_SCORE = 100;
const LEVEL_BONUS = 500;
const PLAYER_DIAMETER = 16;
const MUSHROOM_DIAMETER = 14;
const BAT_DIAMETER = 12;
const CRYSTAL_DIAMETER = 10;
const CANVAS_SIZE_DESKTOP = 450;
const CANVAS_SIZE_MOBILE = 320;
const MOVE_INTERVAL = 120;
const BAT_MOVE_INTERVAL = 400;

interface Styles {
  readonly [key: string]: React.CSSProperties;
}

const baseStyles: Styles = {
  pageContainer: {
    minHeight: '100vh',
    width: '100%',
    background: '#0D0D1A',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    boxSizing: 'border-box',
    fontFamily: 'monospace',
    color: '#E0E0E0',
    gap: '16px',
  },
  title: {
    color: '#4FC3F7',
    fontSize: '24px',
    margin: 0,
    letterSpacing: '2px',
    textShadow: '0 0 10px rgba(79, 195, 247, 0.5)',
  },
  layoutRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '20px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  scorePanel: {
    background: '#1C1C2E',
    borderRadius: '8px',
    padding: '16px',
    width: '160px',
    minHeight: '120px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    border: '1px solid #2C3E50',
  },
  scoreLabel: {
    color: '#E0E0E0',
    fontSize: '16px',
    fontFamily: 'monospace',
  },
  scoreValue: {
    color: '#FFD54F',
    fontSize: '20px',
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  timerPanel: {
    background: '#1C1C2E',
    borderRadius: '8px',
    padding: '16px',
    width: '160px',
    minHeight: '120px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    border: '1px solid #2C3E50',
  },
  timerLabel: {
    color: '#E0E0E0',
    fontSize: '16px',
    fontFamily: 'monospace',
  },
  timerValue: {
    color: '#FF3333',
    fontSize: '20px',
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  crystalProgress: {
    fontSize: '14px',
    color: '#00FF7F',
    fontFamily: 'monospace',
  },
  canvasWrapper: {
    position: 'relative',
    border: '2px solid #4A6572',
    borderRadius: '4px',
    boxShadow: '0 0 30px rgba(79, 195, 247, 0.2)',
    background: '#000000',
  },
  buttonsRow: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
  },
  button: {
    background: 'linear-gradient(180deg, #2C3E50 0%, #3498DB 100%)',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 20px',
    fontSize: '14px',
    fontFamily: 'monospace',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    letterSpacing: '1px',
  },
  buttonHover: {
    background: 'linear-gradient(180deg, #3498DB 0%, #2C3E50 100%)',
    transform: 'scale(1.05)',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    borderRadius: '4px',
    zIndex: 10,
  },
  overlayTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    fontFamily: 'monospace',
    margin: 0,
  },
  overlayText: {
    fontSize: '16px',
    fontFamily: 'monospace',
    color: '#E0E0E0',
    margin: 0,
    textAlign: 'center',
    padding: '0 20px',
  },
  instructions: {
    maxWidth: '600px',
    background: '#1C1C2E',
    borderRadius: '8px',
    padding: '14px 18px',
    border: '1px solid #2C3E50',
    fontSize: '13px',
    lineHeight: '1.8',
    color: '#B0BEC5',
  },
};

export const EchoGameApp: React.FC = () => {
  const eventBusRef = useRef<EventBus>(new EventBus());
  const sonarEngineRef = useRef<SonarEngine | null>(null);
  const levelBuilderRef = useRef<CaveLevelBuilder | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number>(0);
  const lastMoveRef = useRef<number>(0);
  const lastBatMoveRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());
  const levelDataRef = useRef<LevelData | null>(null);
  const crystalsRef = useRef<Set<number>>(new Set());
  const mushroomsRef = useRef<Map<number, { gridX: number; gridY: number }>>(new Map());
  const batsRef = useRef<Map<number, WanderingBat>>(new Map());
  const lastTimerTickRef = useRef<number>(0);

  const [gameState, setGameState] = useState<GameState>({
    status: 'playing',
    score: 0,
    timeLeft: GAME_TOTAL_TIME,
    crystalsCollected: 0,
    totalCrystals: 5,
    playerGridPos: { x: 0, y: 0 },
    playerPixelPos: { x: 0, y: 0 },
    currentCaveIndex: 2,
  });
  const [canvasSize, setCanvasSize] = useState<number>(CANVAS_SIZE_DESKTOP);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [hoverBtn, setHoverBtn] = useState<string | null>(null);
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  useEffect(() => {
    sonarEngineRef.current = new SonarEngine(eventBusRef.current);
    levelBuilderRef.current = new CaveLevelBuilder(eventBusRef.current);

    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setCanvasSize(mobile ? CANVAS_SIZE_MOBILE : CANVAS_SIZE_DESKTOP);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getCurrentCaveIndex = (level: LevelData, gx: number, gy: number): number => {
    for (const cave of level.caves) {
      if (
        gx >= cave.bounds.minX &&
        gx <= cave.bounds.maxX &&
        gy >= cave.bounds.minY &&
        gy <= cave.bounds.maxY
      ) {
        return cave.index;
      }
    }
    return -1;
  };

  const initGame = useCallback(() => {
    if (!levelBuilderRef.current) return;

    const level = levelBuilderRef.current.generateLevel();
    levelDataRef.current = level;

    crystalsRef.current = new Set();
    mushroomsRef.current = new Map();
    batsRef.current = new Map();

    for (const cave of level.caves) {
      for (const m of cave.mushrooms) {
        mushroomsRef.current.set(m.id, { gridX: m.gridX, gridY: m.gridY });
      }
      for (const b of cave.wanderingBats) {
        batsRef.current.set(b.id, { ...b });
      }
    }

    const startCave = level.caves[2];
    const cellSize = level.cellSize;
    const startX = startCave.startPos.x;
    const startY = startCave.startPos.y;

    startTimeRef.current = performance.now();
    lastTimerTickRef.current = startTimeRef.current;
    lastMoveRef.current = 0;
    lastBatMoveRef.current = 0;

    if (sonarEngineRef.current) {
      sonarEngineRef.current.reset();
    }

    setGameState({
      status: 'playing',
      score: 0,
      timeLeft: GAME_TOTAL_TIME,
      crystalsCollected: 0,
      totalCrystals: 5,
      playerGridPos: { x: startX, y: startY },
      playerPixelPos: {
        x: startX * cellSize + cellSize / 2,
        y: startY * cellSize + cellSize / 2,
      },
      currentCaveIndex: 2,
    });
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key.startsWith('Arrow')) {
        e.preventDefault();
      }
      keysRef.current.add(e.key.toLowerCase());

      if (e.key === ' ' && gameStateRef.current.status === 'playing') {
        if (sonarEngineRef.current) {
          sonarEngineRef.current.emitSonar(gameStateRef.current.playerPixelPos);
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const canWalk = (level: LevelData, gx: number, gy: number): boolean => {
    if (gx < 0 || gx >= level.width || gy < 0 || gy >= level.height) return false;
    const cell = level.grid[gy][gx];
    return cell.type !== 'wall';
  };

  const updateWanderingBats = (level: LevelData, now: number) => {
    if (now - lastBatMoveRef.current < BAT_MOVE_INTERVAL) return;
    lastBatMoveRef.current = now;

    const allBatsFromCaves: WanderingBat[] = [];
    for (const cave of level.caves) {
      for (const b of cave.wanderingBats) {
        allBatsFromCaves.push(b);
      }
    }

    for (const bat of allBatsFromCaves) {
      if (bat.stunned) {
        if (now >= bat.stunEndTime) {
          bat.stunned = false;
        }
        continue;
      }
      if (bat.path.length < 2) continue;

      const nextIndex = (bat.pathIndex + 1) % bat.path.length;
      const target = bat.path[nextIndex];
      if (canWalk(level, target.x, target.y)) {
        bat.gridX = target.x;
        bat.gridY = target.y;
        bat.pathIndex = nextIndex;
      }
    }
  };

  const checkCollisions = (level: LevelData, gx: number, gy: number): 'enemy' | 'crystal' | 'portal' | null => {
    const cellSize = level.cellSize;
    const px = gx * cellSize + cellSize / 2;
    const py = gy * cellSize + cellSize / 2;
    const playerR = PLAYER_DIAMETER / 2;

    for (const cave of level.caves) {
      for (const m of cave.mushrooms) {
        if (m.stunned) continue;
        const mx = m.gridX * cellSize + cellSize / 2;
        const my = m.gridY * cellSize + cellSize / 2;
        const dist = Math.hypot(px - mx, py - my);
        if (dist < playerR + MUSHROOM_DIAMETER / 2) {
          return 'enemy';
        }
      }
      for (const b of cave.wanderingBats) {
        if (b.stunned) continue;
        const bx = b.gridX * cellSize + cellSize / 2;
        const by = b.gridY * cellSize + cellSize / 2;
        const dist = Math.hypot(px - bx, py - by);
        if (dist < playerR + BAT_DIAMETER / 2) {
          return 'enemy';
        }
      }
      if (!cave.crystal.collected) {
        const cx = cave.crystal.gridX * cellSize + cellSize / 2;
        const cy = cave.crystal.gridY * cellSize + cellSize / 2;
        const dist = Math.hypot(px - cx, py - cy);
        if (dist < playerR + CRYSTAL_DIAMETER / 2) {
          cave.crystal.collected = true;
          eventBusRef.current.emit({
            type: 'crystal:collected',
            payload: { crystalId: cave.crystal.id, caveIndex: cave.index },
          });
          return 'crystal';
        }
      }
    }

    if (level.portal) {
      const portalPx = level.portal.x * cellSize + cellSize / 2;
      const portalPy = level.portal.y * cellSize + cellSize / 2;
      const dist = Math.hypot(px - portalPx, py - portalPy);
      const allCollected = level.caves.every((c) => c.crystal.collected);
      if (dist < playerR + cellSize / 3 && allCollected) {
        return 'portal';
      }
    }

    return null;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameLoop = (now: number) => {
      if (!lastFrameRef.current) lastFrameRef.current = now;
      lastFrameRef.current = now;

      const level = levelDataRef.current;
      const state = gameStateRef.current;

      if (level && state.status === 'playing') {
        if (now - lastTimerTickRef.current >= 1000) {
          lastTimerTickRef.current = now;
          const newTime = state.timeLeft - 1;
          if (newTime <= 0) {
            setGameState((prev) => ({ ...prev, timeLeft: 0, status: 'gameover' }));
            eventBusRef.current.emit({ type: 'game:statusChange', payload: { status: 'gameover' } });
          } else {
            setGameState((prev) => ({ ...prev, timeLeft: newTime }));
          }
        }

        const allMushrooms = level.caves.flatMap((c) => c.mushrooms);
        const allBats = level.caves.flatMap((c) => c.wanderingBats);

        for (const m of allMushrooms) {
          if (m.stunned && now >= m.stunEndTime) {
            m.stunned = false;
            if (m.knockbackDir) {
              const nx = m.gridX + m.knockbackDir.x;
              const ny = m.gridY + m.knockbackDir.y;
              if (canWalk(level, nx, ny)) {
                m.gridX = nx;
                m.gridY = ny;
              }
              m.knockbackDir = null;
            }
          }
        }
        for (const b of allBats) {
          if (b.stunned && now >= b.stunEndTime) {
            b.stunned = false;
          }
        }

        updateWanderingBats(level, now);

        let sonarRevealed: Position[] = [];
        if (sonarEngineRef.current) {
          const sonarResult = sonarEngineRef.current.update(now, allMushrooms, allBats);
          sonarRevealed = sonarResult.revealedCells;
        }

        if (levelBuilderRef.current) {
          levelBuilderRef.current.updateVisibility(level.grid, state.playerGridPos, sonarRevealed);
        }

        if (now - lastMoveRef.current >= MOVE_INTERVAL) {
          const keys = keysRef.current;
          let dx = 0;
          let dy = 0;
          if (keys.has('arrowup') || keys.has('w')) dy = -1;
          else if (keys.has('arrowdown') || keys.has('s')) dy = 1;
          else if (keys.has('arrowleft') || keys.has('a')) dx = -1;
          else if (keys.has('arrowright') || keys.has('d')) dx = 1;

          if (dx !== 0 || dy !== 0) {
            lastMoveRef.current = now;
            const ngx = state.playerGridPos.x + dx;
            const ngy = state.playerGridPos.y + dy;

            if (canWalk(level, ngx, ngy)) {
              const cellSize = level.cellSize;
              const npx = ngx * cellSize + cellSize / 2;
              const npy = ngy * cellSize + cellSize / 2;
              const newCaveIdx = getCurrentCaveIndex(level, ngx, ngy);

              const collision = checkCollisions(level, ngx, ngy);

              if (collision === 'enemy') {
                setGameState((prev) => ({ ...prev, status: 'gameover' }));
                eventBusRef.current.emit({ type: 'player:collision', payload: { kind: 'enemy' } });
                eventBusRef.current.emit({ type: 'game:statusChange', payload: { status: 'gameover' } });
              } else {
                let newScore = state.score;
                let newCrystalsCollected = state.crystalsCollected;
                let newStatus: GameStatus = state.status;

                if (collision === 'crystal') {
                  newScore += CRYSTAL_SCORE;
                  newCrystalsCollected += 1;
                }
                if (collision === 'portal') {
                  newScore += LEVEL_BONUS;
                  newStatus = 'victory';
                  eventBusRef.current.emit({ type: 'portal:entered' });
                  eventBusRef.current.emit({ type: 'game:statusChange', payload: { status: 'victory' } });
                }

                setGameState((prev) => ({
                  ...prev,
                  playerGridPos: { x: ngx, y: ngy },
                  playerPixelPos: { x: npx, y: npy },
                  score: newScore,
                  crystalsCollected: newCrystalsCollected,
                  currentCaveIndex: newCaveIdx >= 0 ? newCaveIdx : prev.currentCaveIndex,
                  status: newStatus,
                }));
              }
            }
          }
        }
      }

      render(ctx, canvas, level, now);
      rafRef.current = requestAnimationFrame(gameLoop);
    };

    rafRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const render = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    level: LevelData | null,
    now: number
  ) => {
    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);

    if (!level) return;

    const baseCell = level.cellSize;
    const levelPixelW = level.width * baseCell;
    const levelPixelH = level.height * baseCell;
    const scale = Math.min(w / levelPixelW, h / levelPixelH);
    const offsetX = (w - levelPixelW * scale) / 2;
    const offsetY = (h - levelPixelH * scale) / 2;
    const cellSize = baseCell * scale;

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    for (let y = 0; y < level.height; y++) {
      for (let x = 0; x < level.width; x++) {
        const cell = level.grid[y][x];
        if (!cell.visible) continue;

        const px = x * baseCell;
        const py = y * baseCell;

        if (cell.type === 'wall') {
          ctx.fillStyle = '#1a1a2e';
          ctx.fillRect(px, py, baseCell, baseCell);
          ctx.strokeStyle = '#4A6572';
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 0.5, py + 0.5, baseCell - 1, baseCell - 1);
        } else {
          ctx.fillStyle = '#0D0D1A';
          ctx.fillRect(px, py, baseCell, baseCell);
          ctx.strokeStyle = 'rgba(74, 101, 114, 0.3)';
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 0.5, py + 0.5, baseCell - 1, baseCell - 1);
        }
      }
    }

    if (level.portal) {
      const center = level.caves.find((c) => c.isCenter);
      const allCollected = center ? level.caves.every((c) => c.crystal.collected) : false;
      const portalCell = level.grid[level.portal.y][level.portal.x];
      if (portalCell.visible) {
        const px = level.portal.x * baseCell + baseCell / 2;
        const py = level.portal.y * baseCell + baseCell / 2;
        const rotation = (now / 400) % (Math.PI * 2);
        const pulse = allCollected ? 1 + Math.sin(now / 200) * 0.15 : 1;
        const baseR = (baseCell * 0.35) * pulse;

        for (let i = 0; i < 3; i++) {
          const ringR = baseR + i * 6;
          const alpha = allCollected ? 0.8 - i * 0.2 : 0.3 - i * 0.08;
          ctx.beginPath();
          ctx.arc(px, py, ringR, rotation + i, rotation + i + Math.PI * 1.5);
          ctx.strokeStyle = `rgba(147, 112, 219, ${alpha})`;
          ctx.lineWidth = 3;
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(px, py, baseR * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = allCollected ? 'rgba(147, 112, 219, 0.6)' : 'rgba(147, 112, 219, 0.2)';
        ctx.fill();
      }
    }

    if (sonarEngineRef.current) {
      const engine = sonarEngineRef.current;

      for (const pulse of engine.getPulses()) {
        const alpha = engine.getPulseAlpha(pulse, now);
        ctx.beginPath();
        ctx.arc(pulse.x, pulse.y, pulse.radius, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(pulse.x, pulse.y, 0, pulse.x, pulse.y, pulse.radius);
        gradient.addColorStop(0, `rgba(0, 255, 255, 0)`);
        gradient.addColorStop(0.7, `rgba(0, 255, 255, ${alpha * 0.1})`);
        gradient.addColorStop(1, `rgba(0, 255, 255, ${alpha})`);
        ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      for (const echo of engine.getEchoes(now)) {
        ctx.beginPath();
        ctx.moveTo(echo.x1, echo.y1);
        ctx.lineTo(echo.x2, echo.y2);
        ctx.strokeStyle = `rgba(255, 170, 0, ${echo.alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      for (const hl of engine.getHighlights(now)) {
        const px = hl.gridX * baseCell;
        const py = hl.gridY * baseCell;
        ctx.strokeStyle = `rgba(255, 255, 255, ${hl.alpha})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 1, py + 1, baseCell - 2, baseCell - 2);
      }
    }

    for (const cave of level.caves) {
      if (!cave.crystal.collected) {
        const cell = level.grid[cave.crystal.gridY][cave.crystal.gridX];
        if (cell.visible) {
          const cx = cave.crystal.gridX * baseCell + baseCell / 2;
          const cy = cave.crystal.gridY * baseCell + baseCell / 2;
          const pulse = 1 + Math.sin(now / 250) * 0.25;
          const glowR = (CRYSTAL_DIAMETER / 2 + 6) * pulse;

          const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
          glow.addColorStop(0, 'rgba(0, 255, 127, 0.6)');
          glow.addColorStop(1, 'rgba(0, 255, 127, 0)');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.arc(cx, cy, (CRYSTAL_DIAMETER / 2) * pulse, 0, Math.PI * 2);
          ctx.fillStyle = '#00FF7F';
          ctx.fill();
          ctx.strokeStyle = '#B8FFD6';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      for (const m of cave.mushrooms) {
        const cell = level.grid[m.gridY][m.gridX];
        if (!cell.visible) continue;
        const mx = m.gridX * baseCell + baseCell / 2;
        const my = m.gridY * baseCell + baseCell / 2;
        const stunnedAlpha = m.stunned ? 0.4 : 1;

        if (m.stunned) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.lineWidth = 1;
          for (let i = 0; i < 3; i++) {
            const angle = (now / 100 + (i * Math.PI * 2) / 3) % (Math.PI * 2);
            const sx = mx + Math.cos(angle) * 10;
            const sy = my - 8 + Math.sin(angle) * 4;
            ctx.fillStyle = '#FFEB3B';
            ctx.font = '10px monospace';
            ctx.fillText('★', sx - 3, sy);
          }
        }

        ctx.globalAlpha = stunnedAlpha;
        ctx.beginPath();
        ctx.arc(mx, my, MUSHROOM_DIAMETER / 2, 0, Math.PI * 2);
        const mg = ctx.createRadialGradient(mx - 2, my - 2, 1, mx, my, MUSHROOM_DIAMETER / 2);
        mg.addColorStop(0, '#FF9FD0');
        mg.addColorStop(1, '#FF69B4');
        ctx.fillStyle = mg;
        ctx.fill();
        ctx.strokeStyle = '#FF1493';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(mx - 2, my - 2, 1.5, 0, Math.PI * 2);
        ctx.arc(mx + 2, my + 1, 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      for (const b of cave.wanderingBats) {
        const cell = level.grid[b.gridY][b.gridX];
        if (!cell.visible) continue;
        const bx = b.gridX * baseCell + baseCell / 2;
        const by = b.gridY * baseCell + baseCell / 2;
        const wingFlap = Math.sin(now / 80) * 0.6;
        const stunnedAlpha = b.stunned ? 0.4 : 1;

        ctx.globalAlpha = stunnedAlpha;
        ctx.fillStyle = '#8B4513';
        ctx.strokeStyle = '#5D3011';
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.quadraticCurveTo(bx - 10, by - 8 + wingFlap * 6, bx - 14, by + 2 + wingFlap * 4);
        ctx.quadraticCurveTo(bx - 6, by + 2, bx, by);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.quadraticCurveTo(bx + 10, by - 8 + wingFlap * 6, bx + 14, by + 2 + wingFlap * 4);
        ctx.quadraticCurveTo(bx + 6, by + 2, bx, by);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(bx, by, BAT_DIAMETER / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FF3333';
        ctx.beginPath();
        ctx.arc(bx - 2, by - 1, 1.2, 0, Math.PI * 2);
        ctx.arc(bx + 2, by - 1, 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    const state = gameStateRef.current;
    const { playerPixelPos } = state;
    const ppx = playerPixelPos.x;
    const ppy = playerPixelPos.y;
    const wing = Math.sin(now / 60) * 0.7;

    ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
    ctx.beginPath();
    ctx.arc(ppx, ppy, PLAYER_DIAMETER, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFD700';
    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(ppx, ppy);
    ctx.quadraticCurveTo(ppx - 10, ppy - 7 + wing * 7, ppx - 16, ppy + 3 + wing * 5);
    ctx.quadraticCurveTo(ppx - 8, ppy + 3, ppx, ppy);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(ppx, ppy);
    ctx.quadraticCurveTo(ppx + 10, ppy - 7 + wing * 7, ppx + 16, ppy + 3 + wing * 5);
    ctx.quadraticCurveTo(ppx + 8, ppy + 3, ppx, ppy);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(ppx, ppy, PLAYER_DIAMETER / 2, 0, Math.PI * 2);
    const bodyGrad = ctx.createRadialGradient(ppx - 2, ppy - 2, 1, ppx, ppy, PLAYER_DIAMETER / 2);
    bodyGrad.addColorStop(0, '#FFF59D');
    bodyGrad.addColorStop(1, '#FFD700');
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(ppx - 2.5, ppy - 1.5, 1.5, 0, Math.PI * 2);
    ctx.arc(ppx + 2.5, ppy - 1.5, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ppx - 3, ppy - PLAYER_DIAMETER / 2 + 1);
    ctx.lineTo(ppx - 5, ppy - PLAYER_DIAMETER / 2 - 3);
    ctx.moveTo(ppx + 3, ppy - PLAYER_DIAMETER / 2 + 1);
    ctx.lineTo(ppx + 5, ppy - PLAYER_DIAMETER / 2 - 3);
    ctx.stroke();

    ctx.restore();
  };

  const handlePauseResume = () => {
    setGameState((prev) => {
      const newStatus: GameStatus = prev.status === 'playing' ? 'paused' : prev.status === 'paused' ? 'playing' : prev.status;
      eventBusRef.current.emit({ type: 'game:statusChange', payload: { status: newStatus } });
      return { ...prev, status: newStatus };
    });
  };

  const handleRestart = () => {
    initGame();
  };

  const buttonStyle = (id: string): React.CSSProperties => ({
    ...baseStyles.button,
    ...(hoverBtn === id ? baseStyles.buttonHover : {}),
  });

  return (
    <div style={baseStyles.pageContainer}>
      <h1 style={baseStyles.title}>🦇 回声定位 · 蝙蝠洞穴冒险</h1>

      <div style={baseStyles.layoutRow}>
        <div style={baseStyles.scorePanel}>
          <div style={baseStyles.scoreLabel}>得 分</div>
          <div style={baseStyles.scoreValue}>{gameState.score}</div>
          <div style={{ height: '8px' }} />
          <div style={baseStyles.scoreLabel}>水 晶</div>
          <div style={baseStyles.crystalProgress}>
            💎 {gameState.crystalsCollected} / {gameState.totalCrystals}
          </div>
        </div>

        <div style={baseStyles.canvasWrapper}>
          <canvas
            ref={canvasRef}
            width={canvasSize}
            height={canvasSize}
            style={{ display: 'block', borderRadius: '2px' }}
          />

          {gameState.status === 'paused' && (
            <div style={baseStyles.overlay}>
              <h2 style={{ ...baseStyles.overlayTitle, color: '#4FC3F7' }}>⏸ 暂 停</h2>
              <p style={baseStyles.overlayText}>按 继续 按钮恢复游戏</p>
            </div>
          )}

          {gameState.status === 'gameover' && (
            <div style={baseStyles.overlay}>
              <h2 style={{ ...baseStyles.overlayTitle, color: '#FF3333' }}>💀 游戏结束</h2>
              <p style={baseStyles.overlayText}>
                {gameState.timeLeft <= 0 ? '⏰ 时间耗尽！' : '☠️ 被敌人击中！'}
              </p>
              <p style={{ ...baseStyles.overlayText, color: '#FFD54F' }}>
                最终得分：{gameState.score}
              </p>
              <p style={baseStyles.overlayText}>
                收集水晶：{gameState.crystalsCollected} / {gameState.totalCrystals}
              </p>
            </div>
          )}

          {gameState.status === 'victory' && (
            <div style={baseStyles.overlay}>
              <h2 style={{ ...baseStyles.overlayTitle, color: '#00FF7F' }}>🎉 胜 利！</h2>
              <p style={baseStyles.overlayText}>你成功收集了所有水晶并进入传送门！</p>
              <p style={{ ...baseStyles.overlayText, color: '#FFD54F' }}>
                最终得分：{gameState.score}
              </p>
              <p style={baseStyles.overlayText}>
                剩余时间：{gameState.timeLeft}s
              </p>
            </div>
          )}
        </div>

        <div style={baseStyles.timerPanel}>
          <div style={baseStyles.timerLabel}>倒 计 时</div>
          <div style={{
            ...baseStyles.timerValue,
            color: gameState.timeLeft <= 10 ? '#FF3333' : gameState.timeLeft <= 20 ? '#FF8C00' : '#FF3333',
          }}>
            {gameState.timeLeft}s
          </div>
          <div style={{ height: '8px' }} />
          <div style={baseStyles.scoreLabel}>洞 穴</div>
          <div style={{ fontSize: '14px', color: '#9370DB', fontFamily: 'monospace' }}>
            区域 #{gameState.currentCaveIndex + 1}
          </div>
        </div>
      </div>

      <div style={baseStyles.buttonsRow}>
        <button
          style={buttonStyle('pause')}
          onMouseEnter={() => setHoverBtn('pause')}
          onMouseLeave={() => setHoverBtn(null)}
          onClick={handlePauseResume}
          disabled={gameState.status === 'gameover' || gameState.status === 'victory'}
        >
          {gameState.status === 'paused' ? '▶ 继续' : '⏸ 暂停'}
        </button>
        <button
          style={buttonStyle('restart')}
          onMouseEnter={() => setHoverBtn('restart')}
          onMouseLeave={() => setHoverBtn(null)}
          onClick={handleRestart}
        >
          🔄 重新开始
        </button>
      </div>

      <div style={baseStyles.instructions}>
        <div>🎮 <strong style={{ color: '#4FC3F7' }}>操作指南</strong></div>
        <div>• 方向键 / WASD：控制蝙蝠飞行移动</div>
        <div>• 空格键：发射声波脉冲（探测地形 + 震退敌人）</div>
        <div>🎯 <strong style={{ color: '#FFD54F' }}>游戏目标</strong></div>
        <div>• 利用回声定位探索5个相连洞穴</div>
        <div>• 收集全部 5 颗 💎 水晶（每颗 +100 分）</div>
        <div>• 返回中央洞穴的 🔮 传送门完成关卡（+500 分奖励）</div>
        <div>⚠️ 避开 🍄 毒蘑菇 和 🦇 游走蝙蝠，60 秒内完成！</div>
      </div>
    </div>
  );
};
