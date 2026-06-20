import React, { useEffect, useRef, useCallback } from 'react';
import { useGame } from '../GameContext';
import { CellType, SymbolType } from '../GameCore';

const CELL_SIZE = 28;

const SYMBOL_PATHS: Record<SymbolType, string> = {
  [SymbolType.Diamond]: 'M12 2 L22 12 L12 22 L2 12 Z',
  [SymbolType.Hexagon]: 'M12 2 L21 7 L21 17 L12 22 L3 17 L3 7 Z',
  [SymbolType.Star]: 'M12 2 L14.5 9 L22 9 L16 14 L18 22 L12 17.5 L6 22 L8 14 L2 9 L9.5 9 Z',
  [SymbolType.Wave]: 'M2 12 Q6 6, 12 12 Q18 18, 22 12',
};

const SYMBOL_COLORS: Record<SymbolType, string> = {
  [SymbolType.Diamond]: '#e0a0ff',
  [SymbolType.Hexagon]: '#80d0ff',
  [SymbolType.Star]: '#ffe060',
  [SymbolType.Wave]: '#80ffb0',
};

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

export default function GameBoard() {
  const { state, dispatch } = useGame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const prevPosRef = useRef(state.playerPos);
  const isMovingRef = useRef(false);
  const moveStartRef = useRef(0);
  const moveFromRef = useRef(state.playerPos);

  const grid = state.maze.grid;
  const gridRows = grid.length;
  const gridCols = grid[0].length;
  const width = gridCols * CELL_SIZE;
  const height = gridRows * CELL_SIZE;

  const spawnParticles = useCallback((cx: number, cy: number) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 24; i++) {
      const angle = (Math.PI * 2 * i) / 24 + Math.random() * 0.3;
      const speed = 1.5 + Math.random() * 2.5;
      newParticles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 0.6 + Math.random() * 0.4,
        size: 2 + Math.random() * 3,
      });
    }
    particlesRef.current = [...particlesRef.current, ...newParticles];
  }, []);

  useEffect(() => {
    if (state.doorParticles) {
      const px = state.doorParticles.col * CELL_SIZE + CELL_SIZE / 2;
      const py = state.doorParticles.row * CELL_SIZE + CELL_SIZE / 2;
      spawnParticles(px, py);
      setTimeout(() => dispatch({ type: 'CLEAR_PARTICLES' }), 100);
    }
  }, [state.doorParticles, spawnParticles, dispatch]);

  useEffect(() => {
    if (state.screenShake) {
      setTimeout(() => dispatch({ type: 'CLEAR_SHAKE' }), 50);
    }
  }, [state.screenShake, dispatch]);

  useEffect(() => {
    if (state.plateFlash) {
      setTimeout(() => dispatch({ type: 'CLEAR_PLATE_FLASH' }), 300);
    }
  }, [state.plateFlash, dispatch]);

  useEffect(() => {
    if (state.hintMessage) {
      const timer = setTimeout(() => dispatch({ type: 'DISMISS_HINT' }), 5000);
      return () => clearTimeout(timer);
    }
  }, [state.hintMessage, dispatch]);

  useEffect(() => {
    if (
      prevPosRef.current.row !== state.playerPos.row ||
      prevPosRef.current.col !== state.playerPos.col
    ) {
      moveFromRef.current = prevPosRef.current;
      moveStartRef.current = performance.now();
      isMovingRef.current = true;
      prevPosRef.current = state.playerPos;
    }
  }, [state.playerPos]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = 0;
    const animate = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      const shakeX = state.screenShake ? (Math.random() - 0.5) * 4 : 0;
      const shakeY = state.screenShake ? (Math.random() - 0.5) * 4 : 0;
      ctx.save();
      ctx.translate(shakeX, shakeY);

      for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
          const cell = grid[r][c];
          const x = c * CELL_SIZE;
          const y = r * CELL_SIZE;

          if (cell.type === CellType.Wall) {
            ctx.fillStyle = '#2d2d2d';
            ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
            ctx.fillStyle = '#333';
            ctx.fillRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
          } else if (cell.type === CellType.Path) {
            ctx.fillStyle = '#f5f0e8';
            ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
            ctx.strokeStyle = '#e8dcc0';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
          } else if (cell.type === CellType.Mechanism) {
            const door = state.doors.find(d => d.position.row === r && d.position.col === c);
            if (door && !door.open) {
              ctx.fillStyle = '#8b0000';
              ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
              ctx.save();
              ctx.translate(x + CELL_SIZE / 2, y + CELL_SIZE / 2);
              const scale = CELL_SIZE / 24;
              ctx.scale(scale, scale);
              ctx.fillStyle = SYMBOL_COLORS[door.symbol];
              ctx.globalAlpha = 0.8;
              const path2d = new Path2D(SYMBOL_PATHS[door.symbol]);
              ctx.fill(path2d);
              ctx.globalAlpha = 1;
              ctx.restore();
            } else {
              ctx.fillStyle = '#f5f0e8';
              ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
              ctx.strokeStyle = '#e8dcc0';
              ctx.lineWidth = 0.5;
              ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
            }
          }
        }
      }

      for (const plate of state.plates) {
        if (plate.activated) continue;
        const x = plate.position.col * CELL_SIZE + CELL_SIZE / 2;
        const y = plate.position.row * CELL_SIZE + CELL_SIZE / 2;
        const isFlashing = state.plateFlash &&
          state.plateFlash.row === plate.position.row &&
          state.plateFlash.col === plate.position.col;

        ctx.save();
        ctx.translate(x, y);
        const scale = CELL_SIZE / 24;
        ctx.scale(scale, scale);

        if (isFlashing) {
          ctx.shadowColor = '#ffd700';
          ctx.shadowBlur = 12;
        }

        ctx.fillStyle = SYMBOL_COLORS[plate.symbol];
        ctx.globalAlpha = isFlashing ? 1 : 0.7;
        const path2d = new Path2D(SYMBOL_PATHS[plate.symbol]);
        ctx.fill(path2d);
        ctx.globalAlpha = 1;
        ctx.restore();
      }

      for (const item of state.items) {
        if (item.collected) continue;
        const x = item.position.col * CELL_SIZE + CELL_SIZE / 2;
        const y = item.position.row * CELL_SIZE + CELL_SIZE / 2;

        ctx.save();
        ctx.translate(x, y);

        if (item.type === 'potion') {
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(0, -7);
          ctx.lineTo(0, 7);
          ctx.moveTo(-5, 0);
          ctx.lineTo(5, 0);
          ctx.stroke();
        } else if (item.type === 'key') {
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.moveTo(0, -7);
          ctx.lineTo(6, 4);
          ctx.lineTo(-6, 4);
          ctx.closePath();
          ctx.fill();
        } else if (item.type === 'scroll') {
          ctx.fillStyle = '#fff';
          ctx.strokeStyle = '#ccc';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(-3, 0, 3, 6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.ellipse(3, 0, 3, 6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }

        ctx.restore();
      }

      const endX = state.maze.endPosition.col * CELL_SIZE + CELL_SIZE / 2;
      const endY = state.maze.endPosition.row * CELL_SIZE + CELL_SIZE / 2;
      const pulse = 0.6 + 0.4 * Math.sin(time / 300);
      ctx.save();
      ctx.strokeStyle = `rgba(255, 215, 0, ${pulse})`;
      ctx.lineWidth = 3;
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 10 * pulse;
      ctx.beginPath();
      ctx.arc(endX, endY, CELL_SIZE / 2 - 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = `rgba(255, 215, 0, ${0.15 * pulse})`;
      ctx.fill();
      ctx.restore();

      let playerX: number;
      let playerY: number;
      let bounceOffset = 0;

      if (isMovingRef.current) {
        const elapsed = time - moveStartRef.current;
        const duration = 150;
        const t = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);

        const fromX = moveFromRef.current.col * CELL_SIZE + CELL_SIZE / 2;
        const fromY = moveFromRef.current.row * CELL_SIZE + CELL_SIZE / 2;
        const toX = state.playerPos.col * CELL_SIZE + CELL_SIZE / 2;
        const toY = state.playerPos.row * CELL_SIZE + CELL_SIZE / 2;

        playerX = fromX + (toX - fromX) * eased;
        playerY = fromY + (toY - fromY) * eased;

        bounceOffset = -6 * Math.sin(t * Math.PI);

        if (t >= 1) {
          isMovingRef.current = false;
          bounceOffset = 0;
        }
      } else {
        playerX = state.playerPos.col * CELL_SIZE + CELL_SIZE / 2;
        playerY = state.playerPos.row * CELL_SIZE + CELL_SIZE / 2;
      }

      ctx.save();
      ctx.shadowColor = '#4488ff';
      ctx.shadowBlur = 12;
      const grad = ctx.createRadialGradient(playerX, playerY + bounceOffset, 0, playerX, playerY + bounceOffset, CELL_SIZE / 2 - 2);
      grad.addColorStop(0, '#88ccff');
      grad.addColorStop(0.5, '#4488ff');
      grad.addColorStop(1, '#2255cc');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(playerX, playerY + bounceOffset, CELL_SIZE / 2 - 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      particlesRef.current = particlesRef.current.filter(p => p.life > 0);
      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= dt / p.maxLife;
        p.vx *= 0.97;
        p.vy *= 0.97;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [grid, gridRows, gridCols, width, height, state.doors, state.plates, state.items, state.screenShake, state.plateFlash, state.maze.endPosition, state.playerPos]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!state.gameStarted || state.gameWon) return;
      const dirMap: Record<string, Position> = {
        w: { row: -1, col: 0 },
        W: { row: -1, col: 0 },
        ArrowUp: { row: -1, col: 0 },
        s: { row: 1, col: 0 },
        S: { row: 1, col: 0 },
        ArrowDown: { row: 1, col: 0 },
        a: { row: 0, col: -1 },
        A: { row: 0, col: -1 },
        ArrowLeft: { row: 0, col: -1 },
        d: { row: 0, col: 1 },
        D: { row: 0, col: 1 },
        ArrowRight: { row: 0, col: 1 },
      };
      const dir = dirMap[e.key];
      if (dir) {
        e.preventDefault();
        dispatch({ type: 'MOVE', direction: dir });
      }
    },
    [dispatch, state.gameStarted, state.gameWon]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          display: 'block',
          imageRendering: 'pixelated',
        }}
      />
      {state.hintMessage && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            color: '#fff',
            padding: '10px 16px',
            borderRadius: 8,
            fontSize: 13,
            maxWidth: 220,
            lineHeight: 1.5,
            fontFamily: "'Noto Serif SC', serif",
            animation: 'hintFade 5s forwards',
            zIndex: 10,
          }}
        >
          {state.hintMessage}
        </div>
      )}
      <style>{`
        @keyframes hintFade {
          0% { opacity: 0; transform: translateY(-8px); }
          8% { opacity: 1; transform: translateY(0); }
          80% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
