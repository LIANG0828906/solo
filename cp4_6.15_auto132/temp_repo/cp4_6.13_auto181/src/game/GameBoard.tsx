import React, { useEffect, useRef, useState, useCallback } from 'react';
import { COLORS, COLS, ROWS, cloneGrid, countBubbles } from '../generator/gridGenerator';
import { addParticles, updateParticles, getParticles, clearParticles } from '../utils/particles';

const BUBBLE_RADIUS = 12;
const BUBBLE_DIAMETER = BUBBLE_RADIUS * 2;
const ROW_HEIGHT = BUBBLE_DIAMETER;
const COL_WIDTH = BUBBLE_DIAMETER * Math.sqrt(3) / 2;

const BUBBLE_SPEED = 600;
const FALL_SPEED_INITIAL = 100;
const GRAVITY_ACCEL = 300;
const COLLISION_THRESHOLD = BUBBLE_DIAMETER - 0.5;

interface FallingBubble {
  x: number;
  y: number;
  vy: number;
  color: number;
}

interface ActiveBubble {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: number;
}

interface GameBoardProps {
  levelData: number[][];
  onScoreUpdate: (points: number) => void;
  onShotFired: () => void;
  onLevelComplete: () => void;
  gameActive: boolean;
}

const GameBoard: React.FC<GameBoardProps> = ({
  levelData,
  onScoreUpdate,
  onShotFired,
  onLevelComplete,
  gameActive,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  const gridRef = useRef<number[][]>([]);
  const activeBubbleRef = useRef<ActiveBubble | null>(null);
  const aimAngleRef = useRef(-Math.PI / 2);
  const nextColorRef = useRef(1);
  const fallingBubblesRef = useRef<FallingBubble[]>([]);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef(0);
  const gameActiveRef = useRef(false);

  const offsetXRef = useRef(0);
  const offsetYRef = useRef(40);
  const shooterXRef = useRef(400);
  const shooterYRef = useRef(580);

  useEffect(() => {
    gridRef.current = cloneGrid(levelData);
    clearParticles();
    fallingBubblesRef.current = [];
    activeBubbleRef.current = null;

    const colors = [...new Set(levelData.flat().filter(c => c > 0))];
    if (colors.length > 0) {
      nextColorRef.current = colors[Math.floor(Math.random() * colors.length)];
    }
  }, [levelData]);

  useEffect(() => {
    gameActiveRef.current = gameActive;
  }, [gameActive]);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const w = Math.floor(rect.width);
        const h = Math.floor(rect.height);
        setCanvasSize({ width: w, height: h });

        const gridWidth = COLS * COL_WIDTH + BUBBLE_RADIUS;
        offsetXRef.current = Math.max(BUBBLE_RADIUS, (w - gridWidth) / 2);
        offsetYRef.current = 40;

        shooterXRef.current = w / 2;
        shooterYRef.current = h - BUBBLE_DIAMETER - 10;
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const getHexPosition = useCallback((row: number, col: number): { x: number; y: number } => {
    const x = offsetXRef.current + col * COL_WIDTH + BUBBLE_RADIUS;
    const y = offsetYRef.current + row * ROW_HEIGHT * 0.75 + BUBBLE_RADIUS;
    const offset = col % 2 === 1 ? ROW_HEIGHT * 0.375 : 0;
    return { x, y: y + offset };
  }, []);

  const pixelToHex = useCallback((px: number, py: number): { row: number; col: number } | null => {
    let bestDist = Infinity;
    let bestRow = -1;
    let bestCol = -1;

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const pos = getHexPosition(row, col);
        const dx = px - pos.x;
        const dy = py - pos.y;
        const dist = dx * dx + dy * dy;
        if (dist < bestDist) {
          bestDist = dist;
          bestRow = row;
          bestCol = col;
        }
      }
    }

    if (bestRow >= 0 && bestCol >= 0) {
      return { row: bestRow, col: bestCol };
    }
    return null;
  }, [getHexPosition]);

  const getNeighborsHex = useCallback((row: number, col: number): Array<{ row: number; col: number }> => {
    const neighbors: Array<{ row: number; col: number }> = [];
    const isOddCol = col % 2 === 1;

    const directions = isOddCol
      ? [[-1, 0], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1]]
      : [[-1, 0], [-1, -1], [0, -1], [1, 0], [0, 1], [-1, 1]];

    for (const [dr, dc] of directions) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
        neighbors.push({ row: nr, col: nc });
      }
    }

    return neighbors;
  }, []);

  const findConnectedSameColor = useCallback((
    startRow: number,
    startCol: number,
    g: number[][]
  ): Array<{ row: number; col: number }> => {
    const color = g[startRow][startCol];
    if (color === 0) return [];

    const visited = new Set<string>();
    const connected: Array<{ row: number; col: number }> = [];
    const queue: Array<{ row: number; col: number }> = [{ row: startRow, col: startCol }];

    while (queue.length > 0) {
      const { row, col } = queue.shift()!;
      const key = `${row},${col}`;

      if (visited.has(key)) continue;
      visited.add(key);

      if (g[row][col] === color) {
        connected.push({ row, col });
        for (const neighbor of getNeighborsHex(row, col)) {
          const nKey = `${neighbor.row},${neighbor.col}`;
          if (!visited.has(nKey) && g[neighbor.row][neighbor.col] === color) {
            queue.push(neighbor);
          }
        }
      }
    }

    return connected;
  }, [getNeighborsHex]);

  const findConnectedToTop = useCallback((g: number[][]): Set<string> => {
    const visited = new Set<string>();
    const queue: Array<{ row: number; col: number }> = [];

    for (let col = 0; col < COLS; col++) {
      if (g[0][col] > 0) {
        queue.push({ row: 0, col });
        visited.add(`0,${col}`);
      }
    }

    while (queue.length > 0) {
      const { row, col } = queue.shift()!;
      for (const neighbor of getNeighborsHex(row, col)) {
        const key = `${neighbor.row},${neighbor.col}`;
        if (!visited.has(key) && g[neighbor.row][neighbor.col] > 0) {
          visited.add(key);
          queue.push(neighbor);
        }
      }
    }

    return visited;
  }, [getNeighborsHex]);

  const findFallingBubbles = useCallback((g: number[][]): Array<{ row: number; col: number }> => {
    const connectedToTop = findConnectedToTop(g);
    const falling: Array<{ row: number; col: number }> = [];

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (g[row][col] > 0 && !connectedToTop.has(`${row},${col}`)) {
          falling.push({ row, col });
        }
      }
    }

    return falling;
  }, [findConnectedToTop]);

  const isAdjacentToOccupied = useCallback((row: number, col: number, g: number[][]): boolean => {
    if (row === 0) return true;

    const neighbors = getNeighborsHex(row, col);
    for (const n of neighbors) {
      if (g[n.row][n.col] > 0) return true;
    }
    return false;
  }, [getNeighborsHex]);

  const findSnapPosition = useCallback((px: number, py: number, g: number[][]): { row: number; col: number } | null => {
    let bestDist = Infinity;
    let bestPos: { row: number; col: number } | null = null;

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (g[row][col] !== 0) continue;

        const pos = getHexPosition(row, col);
        const dx = px - pos.x;
        const dy = py - pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < BUBBLE_DIAMETER && dist < bestDist && isAdjacentToOccupied(row, col, g)) {
          bestDist = dist;
          bestPos = { row, col };
        }
      }
    }

    return bestPos;
  }, [getHexPosition, isAdjacentToOccupied]);

  const checkHexCollision = useCallback((bx: number, by: number, g: number[][]): boolean => {
    if (by <= offsetYRef.current + BUBBLE_RADIUS) {
      return true;
    }

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (g[row][col] > 0) {
          const pos = getHexPosition(row, col);
          const dx = bx - pos.x;
          const dy = by - pos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= COLLISION_THRESHOLD) {
            return true;
          }
        }
      }
    }

    return false;
  }, [getHexPosition]);

  const getAvailableColors = useCallback((): number[] => {
    const colors = new Set<number>();
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (gridRef.current[row][col] > 0) {
          colors.add(gridRef.current[row][col]);
        }
      }
    }
    return Array.from(colors);
  }, []);

  const handleClick = useCallback(() => {
    if (!gameActiveRef.current || activeBubbleRef.current) return;

    const angle = aimAngleRef.current;

    activeBubbleRef.current = {
      x: shooterXRef.current,
      y: shooterYRef.current,
      vx: Math.cos(angle) * BUBBLE_SPEED,
      vy: Math.sin(angle) * BUBBLE_SPEED,
      color: nextColorRef.current,
    };

    onShotFired();

    const availableColors = getAvailableColors();
    if (availableColors.length > 0) {
      nextColorRef.current = availableColors[Math.floor(Math.random() * availableColors.length)];
    }
  }, [onShotFired, getAvailableColors]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const sx = shooterXRef.current;
    const sy = shooterYRef.current;
    let angle = Math.atan2(y - sy, x - sx);

    if (angle > -0.1) angle = -0.1;
    if (angle < -Math.PI + 0.1) angle = -Math.PI + 0.1;

    aimAngleRef.current = angle;
  }, []);

  const drawBubble = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, colorIdx: number, radius: number = BUBBLE_RADIUS) => {
    const colorHex = COLORS[colorIdx - 1] || '#ffffff';

    const gradient = ctx.createRadialGradient(
      x - radius * 0.3,
      y - radius * 0.3,
      0,
      x,
      y,
      radius
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    gradient.addColorStop(0.3, colorHex);
    gradient.addColorStop(1, colorHex);

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }, []);

  const drawAimLine = useCallback((ctx: CanvasRenderingContext2D, startX: number, startY: number, angle: number, canvasWidth: number) => {
    ctx.save();
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();

    let x = startX;
    let y = startY;
    let dx = Math.cos(angle);
    let dy = Math.sin(angle);
    const stepSize = 4;
    const maxSteps = 300;

    ctx.moveTo(x, y);

    for (let i = 0; i < maxSteps; i++) {
      x += dx * stepSize;
      y += dy * stepSize;

      if (x < BUBBLE_RADIUS) {
        x = BUBBLE_RADIUS;
        dx = Math.abs(dx);
      } else if (x > canvasWidth - BUBBLE_RADIUS) {
        x = canvasWidth - BUBBLE_RADIUS;
        dx = -Math.abs(dx);
      }

      if (y <= offsetYRef.current + BUBBLE_RADIUS) {
        ctx.lineTo(x, y);
        break;
      }

      let hitBubble = false;
      const g = gridRef.current;
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          if (g[row][col] > 0) {
            const pos = getHexPosition(row, col);
            const distSq = (x - pos.x) ** 2 + (y - pos.y) ** 2;
            if (distSq <= COLLISION_THRESHOLD * COLLISION_THRESHOLD) {
              hitBubble = true;
              break;
            }
          }
        }
        if (hitBubble) break;
      }

      ctx.lineTo(x, y);

      if (hitBubble) break;
    }

    ctx.stroke();
    ctx.restore();
  }, [getHexPosition]);

  const render = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const g = gridRef.current;
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (g[row][col] > 0) {
          const pos = getHexPosition(row, col);
          drawBubble(ctx, pos.x, pos.y, g[row][col]);
        }
      }
    }

    for (const fb of fallingBubblesRef.current) {
      drawBubble(ctx, fb.x, fb.y, fb.color);
    }

    if (activeBubbleRef.current) {
      const ab = activeBubbleRef.current;
      drawBubble(ctx, ab.x, ab.y, ab.color);
    }

    const particles = getParticles();
    for (const p of particles) {
      if (p.radius <= 0) continue;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    if (!activeBubbleRef.current && gameActiveRef.current) {
      const sx = shooterXRef.current;
      const sy = shooterYRef.current;
      drawAimLine(ctx, sx, sy, aimAngleRef.current, width);
      drawBubble(ctx, sx, sy, nextColorRef.current);
    }
  }, [getHexPosition, drawBubble, drawAimLine]);

  const gameLoop = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rawDelta = lastTimeRef.current ? (timestamp - lastTimeRef.current) / 1000 : 0.016;
    const deltaTime = Math.min(rawDelta, 0.05);
    lastTimeRef.current = timestamp;

    const width = canvas.width;
    const height = canvas.height;

    if (activeBubbleRef.current) {
      const ab = activeBubbleRef.current;

      const steps = Math.ceil(BUBBLE_SPEED * deltaTime / 2);
      const subDt = deltaTime / steps;
      let collided = false;

      for (let s = 0; s < steps; s++) {
        ab.x += ab.vx * subDt;
        ab.y += ab.vy * subDt;

        if (ab.x < BUBBLE_RADIUS) {
          ab.x = BUBBLE_RADIUS;
          ab.vx = Math.abs(ab.vx);
        }
        if (ab.x > width - BUBBLE_RADIUS) {
          ab.x = width - BUBBLE_RADIUS;
          ab.vx = -Math.abs(ab.vx);
        }

        if (checkHexCollision(ab.x, ab.y, gridRef.current)) {
          collided = true;
          break;
        }
      }

      if (collided) {
        const snapPos = findSnapPosition(ab.x, ab.y, gridRef.current);

        if (snapPos) {
          gridRef.current[snapPos.row][snapPos.col] = ab.color;

          const connected = findConnectedSameColor(snapPos.row, snapPos.col, gridRef.current);

          if (connected.length >= 3) {
            const bubblesForParticles = connected.map(c => {
              const pos = getHexPosition(c.row, c.col);
              return { x: pos.x, y: pos.y, color: COLORS[gridRef.current[c.row][c.col] - 1] };
            });
            addParticles(bubblesForParticles);

            for (const c of connected) {
              gridRef.current[c.row][c.col] = 0;
            }

            const points = connected.length * 10 + (connected.length - 3) * 5;
            onScoreUpdate(points);

            const falling = findFallingBubbles(gridRef.current);
            for (const f of falling) {
              const pos = getHexPosition(f.row, f.col);
              fallingBubblesRef.current.push({
                x: pos.x,
                y: pos.y,
                vy: FALL_SPEED_INITIAL,
                color: gridRef.current[f.row][f.col],
              });
              gridRef.current[f.row][f.col] = 0;
            }

            if (countBubbles(gridRef.current) === 0) {
              setTimeout(() => {
                onLevelComplete();
              }, 500);
            }
          }
        }

        activeBubbleRef.current = null;
      }
    }

    fallingBubblesRef.current = fallingBubblesRef.current.filter(fb => {
      fb.vy += GRAVITY_ACCEL * deltaTime;
      fb.y += fb.vy * deltaTime;

      if (fb.y > height + BUBBLE_DIAMETER) {
        onScoreUpdate(5);
        return false;
      }
      return true;
    });

    updateParticles(deltaTime);
    render(ctx, width, height);

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [checkHexCollision, findSnapPosition, findConnectedSameColor, findFallingBubbles, getHexPosition, onScoreUpdate, onLevelComplete, render]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(gameLoop);
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [gameLoop]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        minWidth: 600,
        position: 'relative',
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      }}
    >
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        style={{
          cursor: 'crosshair',
          display: 'block',
          width: '100%',
          height: '100%',
        }}
      />
      {!gameActive && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0, 0, 0, 0.8)',
            padding: '24px 48px',
            borderRadius: 12,
            color: 'white',
            fontSize: 24,
            fontWeight: 600,
          }}
        >
          正在生成关卡...
        </div>
      )}
    </div>
  );
};

export default GameBoard;
