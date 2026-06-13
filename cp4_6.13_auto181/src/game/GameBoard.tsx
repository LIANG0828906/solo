import React, { useEffect, useRef, useState, useCallback } from 'react';
import { COLORS, COLS, ROWS, cloneGrid, countBubbles } from '../generator/gridGenerator';
import { addParticles, updateParticles, getParticles, clearParticles, Particle } from '../utils/particles';

const BUBBLE_RADIUS = 12;
const BUBBLE_DIAMETER = BUBBLE_RADIUS * 2;
const ROW_HEIGHT = BUBBLE_DIAMETER;
const COL_WIDTH = BUBBLE_DIAMETER * Math.sqrt(3) / 2;

const BUBBLE_SPEED = 600;
const FALL_SPEED_INITIAL = 100;
const GRAVITY = 300;
const COLLISION_PRECISION = 0.5;

interface FallingBubble {
  x: number;
  y: number;
  vy: number;
  color: number;
  row: number;
  col: number;
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
  const [grid, setGrid] = useState<number[][]>([]);
  const [nextBubbleColor, setNextBubbleColor] = useState(1);
  const [aimAngle, setAimAngle] = useState(-Math.PI / 2);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  const gridRef = useRef<number[][]>([]);
  const activeBubbleRef = useRef<ActiveBubble | null>(null);
  const aimAngleRef = useRef(-Math.PI / 2);
  const nextColorRef = useRef(1);
  const fallingBubblesRef = useRef<FallingBubble[]>([]);
  const mousePosRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef(0);
  const levelStartTimeRef = useRef(0);
  const gameActiveRef = useRef(false);

  const offsetXRef = useRef(0);
  const offsetYRef = useRef(40);

  useEffect(() => {
    gridRef.current = cloneGrid(levelData);
    setGrid(cloneGrid(levelData));
    clearParticles();
    fallingBubblesRef.current = [];
    activeBubbleRef.current = null;
    levelStartTimeRef.current = Date.now();
    
    const colors = [...new Set(levelData.flat().filter(c => c > 0))];
    if (colors.length > 0) {
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      setNextBubbleColor(randomColor);
      nextColorRef.current = randomColor;
    }
  }, [levelData]);

  useEffect(() => {
    gameActiveRef.current = gameActive;
  }, [gameActive]);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height: rect.height });
        
        const gridWidth = COLS * COL_WIDTH + BUBBLE_RADIUS;
        const gridHeight = ROWS * ROW_HEIGHT * 0.75 + BUBBLE_RADIUS;
        offsetXRef.current = Math.max(0, (rect.width - gridWidth) / 2);
        offsetYRef.current = 40;
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

  const getGridPosition = useCallback((x: number, y: number): { row: number; col: number } | null => {
    const adjX = x - offsetXRef.current - BUBBLE_RADIUS;
    const adjY = y - offsetYRef.current - BUBBLE_RADIUS;

    const col = Math.round(adjX / COL_WIDTH);
    let row = Math.round(adjY / (ROW_HEIGHT * 0.75));
    
    const offset = col % 2 === 1 ? ROW_HEIGHT * 0.375 : 0;
    const expectedY = row * ROW_HEIGHT * 0.75 + offset;
    if (Math.abs(adjY - expectedY) > ROW_HEIGHT * 0.5) {
      row = adjY > expectedY ? row + 1 : row - 1;
    }

    if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
      return { row, col };
    }
    return null;
  }, []);

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

  const snapToGrid = useCallback((x: number, y: number, color: number, g: number[][]): boolean => {
    let bestDist = Infinity;
    let bestPos: { row: number; col: number } | null = null;

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (g[row][col] === 0) {
          const pos = getHexPosition(row, col);
          const dist = Math.sqrt((pos.x - x) ** 2 + (pos.y - y) ** 2);
          if (dist < bestDist && dist < BUBBLE_DIAMETER) {
            bestDist = dist;
            bestPos = { row, col };
          }
        }
      }
    }

    if (bestPos) {
      g[bestPos.row][bestPos.col] = color;
      return true;
    }
    return false;
  }, [getHexPosition]);

  const checkCollision = useCallback((bx: number, by: number, g: number[][]): { hit: boolean; x: number; y: number } => {
    if (by <= offsetYRef.current + BUBBLE_RADIUS) {
      return { hit: true, x: bx, y: offsetYRef.current + BUBBLE_RADIUS };
    }

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (g[row][col] > 0) {
          const pos = getHexPosition(row, col);
          const dx = bx - pos.x;
          const dy = by - pos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= BUBBLE_DIAMETER - COLLISION_PRECISION) {
            return { hit: true, x: bx, y: by };
          }
        }
      }
    }

    return { hit: false, x: bx, y: by };
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
    const canvas = canvasRef.current;
    if (!canvas) return;

    const startX = canvas.width / 2;
    const startY = canvas.height - BUBBLE_DIAMETER - 10;

    activeBubbleRef.current = {
      x: startX,
      y: startY,
      vx: Math.cos(angle) * BUBBLE_SPEED,
      vy: Math.sin(angle) * BUBBLE_SPEED,
      color: nextColorRef.current,
    };

    onShotFired();

    const availableColors = getAvailableColors();
    if (availableColors.length > 0) {
      const newColor = availableColors[Math.floor(Math.random() * availableColors.length)];
      setNextBubbleColor(newColor);
      nextColorRef.current = newColor;
    }
  }, [onShotFired, getAvailableColors]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    mousePosRef.current = { x, y };

    const startX = canvas.width / 2;
    const startY = canvas.height - BUBBLE_DIAMETER - 10;
    let angle = Math.atan2(y - startY, x - startX);

    if (angle > -0.1) angle = -0.1;
    if (angle < -Math.PI + 0.1) angle = -Math.PI + 0.1;

    setAimAngle(angle);
    aimAngleRef.current = angle;
  }, []);

  const drawBubble = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, color: number) => {
    const colorHex = COLORS[color - 1] || '#ffffff';
    
    const gradient = ctx.createRadialGradient(
      x - BUBBLE_RADIUS * 0.3,
      y - BUBBLE_RADIUS * 0.3,
      0,
      x,
      y,
      BUBBLE_RADIUS
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    gradient.addColorStop(0.3, colorHex);
    gradient.addColorStop(1, colorHex);

    ctx.beginPath();
    ctx.arc(x, y, BUBBLE_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, BUBBLE_RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }, []);

  const drawAimLine = useCallback((ctx: CanvasRenderingContext2D, startX: number, startY: number, angle: number) => {
    const length = 300;
    const endX = startX + Math.cos(angle) * length;
    const endY = startY + Math.sin(angle) * length;

    ctx.save();
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.restore();
  }, []);

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
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    if (!activeBubbleRef.current && gameActiveRef.current) {
      const startX = width / 2;
      const startY = height - BUBBLE_DIAMETER - 10;
      drawAimLine(ctx, startX, startY, aimAngleRef.current);
      drawBubble(ctx, startX, startY, nextColorRef.current);
    }
  }, [getHexPosition, drawBubble, drawAimLine]);

  const gameLoop = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const deltaTime = lastTimeRef.current ? (timestamp - lastTimeRef.current) / 1000 : 0.016;
    lastTimeRef.current = timestamp;

    const width = canvas.width;
    const height = canvas.height;

    if (activeBubbleRef.current) {
      const ab = activeBubbleRef.current;
      
      ab.x += ab.vx * deltaTime;
      ab.y += ab.vy * deltaTime;

      if (ab.x < BUBBLE_RADIUS) {
        ab.x = BUBBLE_RADIUS;
        ab.vx = Math.abs(ab.vx);
      }
      if (ab.x > width - BUBBLE_RADIUS) {
        ab.x = width - BUBBLE_RADIUS;
        ab.vx = -Math.abs(ab.vx);
      }

      const collision = checkCollision(ab.x, ab.y, gridRef.current);
      if (collision.hit) {
        const snapped = snapToGrid(ab.x, ab.y, ab.color, gridRef.current);
        
        if (snapped) {
          const gridPos = getGridPosition(ab.x, ab.y);
          if (gridPos) {
            const connected = findConnectedSameColor(gridPos.row, gridPos.col, gridRef.current);
            
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
                  row: f.row,
                  col: f.col,
                });
                gridRef.current[f.row][f.col] = 0;
              }

              setGrid(cloneGrid(gridRef.current));

              if (countBubbles(gridRef.current) === 0) {
                setTimeout(() => {
                  onLevelComplete();
                }, 500);
              }
            }
          }
        }
        
        activeBubbleRef.current = null;
      }
    }

    fallingBubblesRef.current = fallingBubblesRef.current.filter(fb => {
      fb.vy += GRAVITY * deltaTime;
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
  }, [checkCollision, snapToGrid, getGridPosition, findConnectedSameColor, findFallingBubbles, getHexPosition, onScoreUpdate, onLevelComplete, render]);

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
