import React, { useRef, useEffect, useCallback } from 'react';
import { useGameStore } from './orchestra';
import {
  GRID_SIZE,
  CELL_SIZE,
  CART_WIDTH,
  CART_HEIGHT,
  TRACK_WIDTH,
  Direction,
  Position,
  GridCell,
  MineCart,
  Particle,
  OrePopup,
  DIR_OFFSET,
  OPPOSITE_DIR,
  ALL_DIRS,
} from './types';

const COLORS = {
  bg: '#1A1A2E',
  gridLine: '#2D2D44',
  track: '#5C6BC0',
  trackHighlight: '#4A90D9',
  preview: 'rgba(74, 144, 217, 0.35)',
  mine: '#2ECC71',
  unload: '#E74C3C',
  cartEmpty: '#888888',
  cartLoaded: '#F1C40F',
  warningCircle: '#F39C12',
  oreGold: '#F1C40F',
  cartWindow: '#FFFFFF',
  cartPupil: '#1A1A2E',
};

function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.strokeStyle = COLORS.gridLine;
  ctx.lineWidth = 1;
  for (let i = 0; i <= GRID_SIZE; i++) {
    const pos = i * CELL_SIZE;
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(width, pos);
    ctx.stroke();
  }
}

function drawTrack(ctx: CanvasRenderingContext2D, cell: GridCell) {
  const cx = cell.col * CELL_SIZE + CELL_SIZE / 2;
  const cy = cell.row * CELL_SIZE + CELL_SIZE / 2;
  ctx.strokeStyle = COLORS.track;
  ctx.lineWidth = TRACK_WIDTH;
  ctx.lineCap = 'round';
  const hasN = cell.connections.includes('N');
  const hasS = cell.connections.includes('S');
  const hasE = cell.connections.includes('E');
  const hasW = cell.connections.includes('W');
  if (hasN && hasS) {
    ctx.beginPath();
    ctx.moveTo(cx, cell.row * CELL_SIZE);
    ctx.lineTo(cx, (cell.row + 1) * CELL_SIZE);
    ctx.stroke();
  }
  if (hasE && hasW) {
    ctx.beginPath();
    ctx.moveTo(cell.col * CELL_SIZE, cy);
    ctx.lineTo((cell.col + 1) * CELL_SIZE, cy);
    ctx.stroke();
  }
  if (hasN && !hasS) {
    ctx.beginPath();
    ctx.moveTo(cx, cell.row * CELL_SIZE);
    ctx.lineTo(cx, cy);
    ctx.stroke();
  }
  if (hasS && !hasN) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, (cell.row + 1) * CELL_SIZE);
    ctx.stroke();
  }
  if (hasE && !hasW) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo((cell.col + 1) * CELL_SIZE, cy);
    ctx.stroke();
  }
  if (hasW && !hasE) {
    ctx.beginPath();
    ctx.moveTo(cell.col * CELL_SIZE, cy);
    ctx.lineTo(cx, cy);
    ctx.stroke();
  }
  const connected = cell.connections.length;
  if (connected > 0) {
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.track;
    ctx.fill();
  }
}

function drawSpecialPoint(ctx: CanvasRenderingContext2D, cell: GridCell) {
  const x = cell.col * CELL_SIZE + 8;
  const y = cell.row * CELL_SIZE + 8;
  const size = CELL_SIZE - 16;
  ctx.fillStyle = cell.type === 'mine' ? COLORS.mine : COLORS.unload;
  ctx.globalAlpha = 0.3;
  ctx.fillRect(x - 4, y - 4, size + 8, size + 8);
  ctx.globalAlpha = 1;
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const cx = cell.col * CELL_SIZE + CELL_SIZE / 2;
  const cy = cell.row * CELL_SIZE + CELL_SIZE / 2;
  ctx.fillText(cell.type === 'mine' ? '⛏' : '📦', cx, cy);
  drawTrack(ctx, cell);
}

function getCartPixelPos(cart: MineCart): { x: number; y: number; angle: number } {
  if (cart.path.length === 0 || cart.state === 'idle' || cart.state === 'loading' || cart.state === 'unloading') {
    const pos = cart.position;
    return { x: pos.col * CELL_SIZE + CELL_SIZE / 2, y: pos.row * CELL_SIZE + CELL_SIZE / 2, angle: 0 };
  }
  if (cart.pathIndex >= cart.path.length) {
    const last = cart.path[cart.path.length - 1];
    return { x: last.col * CELL_SIZE + CELL_SIZE / 2, y: last.row * CELL_SIZE + CELL_SIZE / 2, angle: 0 };
  }
  const from = cart.path[cart.pathIndex];
  const to = cart.pathIndex + 1 < cart.path.length ? cart.path[cart.pathIndex + 1] : from;
  const fx = from.col * CELL_SIZE + CELL_SIZE / 2;
  const fy = from.row * CELL_SIZE + CELL_SIZE / 2;
  const tx = to.col * CELL_SIZE + CELL_SIZE / 2;
  const ty = to.row * CELL_SIZE + CELL_SIZE / 2;
  const t = Math.min(cart.progress, 1);
  const x = fx + (tx - fx) * t;
  const y = fy + (ty - fy) * t;
  let angle = 0;
  if (tx !== fx || ty !== fy) {
    angle = Math.atan2(ty - fy, tx - fx);
  }
  return { x, y, angle };
}

function drawCart(ctx: CanvasRenderingContext2D, cart: MineCart) {
  const { x, y, angle } = getCartPixelPos(cart);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const hw = CART_WIDTH / 2;
  const hh = CART_HEIGHT / 2;
  const r = 4;
  ctx.fillStyle = cart.loaded ? COLORS.cartLoaded : COLORS.cartEmpty;
  ctx.beginPath();
  ctx.moveTo(-hw + r, -hh);
  ctx.lineTo(hw - r, -hh);
  ctx.arcTo(hw, -hh, hw, -hh + r, r);
  ctx.lineTo(hw, hh - r);
  ctx.arcTo(hw, hh, hw - r, hh, r);
  ctx.lineTo(-hw + r, hh);
  ctx.arcTo(-hw, hh, -hw, hh - r, r);
  ctx.lineTo(-hw, -hh + r);
  ctx.arcTo(-hw, -hh, -hw + r, -hh, r);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();
  const eyeX = 5;
  const eyeY = 0;
  ctx.beginPath();
  ctx.arc(eyeX, eyeY - 3, 3, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.cartWindow;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(eyeX + 1, eyeY - 3, 1.5, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.cartPupil;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(eyeX, eyeY + 3, 3, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.cartWindow;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(eyeX + 1, eyeY + 3, 1.5, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.cartPupil;
  ctx.fill();
  ctx.restore();
  if (cart.waitingForCart) {
    ctx.save();
    ctx.strokeStyle = COLORS.warningCircle;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, CART_WIDTH / 2 + 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = p.opacity;
    ctx.fillStyle = COLORS.oreGold;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawOrePopups(ctx: CanvasRenderingContext2D, popups: OrePopup[]) {
  for (const p of popups) {
    const x = p.col * CELL_SIZE + CELL_SIZE / 2 + 10;
    const y = p.row * CELL_SIZE + 10 - (1 - p.timer / 0.6) * 20;
    ctx.save();
    ctx.globalAlpha = p.timer / 0.6;
    ctx.fillStyle = COLORS.oreGold;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`+${p.count}`, x, y);
    ctx.restore();
  }
}

function drawHoverPreview(ctx: CanvasRenderingContext2D, hoverCell: Position | null) {
  if (!hoverCell) return;
  const x = hoverCell.col * CELL_SIZE;
  const y = hoverCell.row * CELL_SIZE;
  ctx.fillStyle = COLORS.preview;
  ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
}

const GameBoard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hoverCellRef = useRef<Position | null>(null);
  const isMouseDownRef = useRef(false);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const statsTimerRef = useRef<number>(0);

  const grid = useGameStore((s) => s.grid);
  const carts = useGameStore((s) => s.carts);
  const particles = useGameStore((s) => s.particles);
  const orePopups = useGameStore((s) => s.orePopups);
  const isRunning = useGameStore((s) => s.isRunning);
  const selectedTool = useGameStore((s) => s.selectedTool);
  const updateGame = useGameStore((s) => s.updateGame);
  const updateStats = useGameStore((s) => s.updateStats);
  const handleCellClick = useGameStore((s) => s.handleCellClick);
  const handleCellDrag = useGameStore((s) => s.handleCellDrag);

  const width = GRID_SIZE * CELL_SIZE;
  const height = GRID_SIZE * CELL_SIZE;

  const getCellFromMouse = useCallback((e: React.MouseEvent<HTMLCanvasElement>): Position | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const col = Math.floor(x / CELL_SIZE);
    const row = Math.floor(y / CELL_SIZE);
    if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
      return { row, col };
    }
    return null;
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, width, height);
    drawGrid(ctx, width, height);
    const hover = hoverCellRef.current;
    if (hover && !isRunning) {
      drawHoverPreview(ctx, hover);
    }
    for (const row of grid) {
      for (const cell of row) {
        if (cell.type === 'track') {
          drawTrack(ctx, cell);
        } else if (cell.type === 'mine' || cell.type === 'unload') {
          drawSpecialPoint(ctx, cell);
        }
      }
    }
    for (const cart of carts) {
      drawCart(ctx, cart);
    }
    drawParticles(ctx, particles);
    drawOrePopups(ctx, orePopups);
  }, [grid, carts, particles, orePopups, isRunning, width, height]);

  const gameLoop = useCallback(
    (timestamp: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = timestamp;
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = timestamp;
      if (isRunning) {
        updateGame(dt);
        statsTimerRef.current += dt;
        if (statsTimerRef.current >= 2) {
          updateStats();
          statsTimerRef.current = 0;
        }
      }
      render();
      animFrameRef.current = requestAnimationFrame(gameLoop);
    },
    [isRunning, updateGame, updateStats, render]
  );

  useEffect(() => {
    lastTimeRef.current = 0;
    animFrameRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameLoop]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      isMouseDownRef.current = true;
      const cell = getCellFromMouse(e);
      if (cell) handleCellClick(cell.row, cell.col);
    },
    [handleCellClick, getCellFromMouse]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const cell = getCellFromMouse(e);
      hoverCellRef.current = cell;
      if (isMouseDownRef.current && cell) {
        handleCellDrag(cell.row, cell.col);
      }
    },
    [handleCellDrag, getCellFromMouse]
  );

  const handleMouseUp = useCallback(() => {
    isMouseDownRef.current = false;
  }, []);

  const handleMouseLeave = useCallback(() => {
    isMouseDownRef.current = false;
    hoverCellRef.current = null;
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{
        display: 'block',
        cursor: isRunning ? 'default' : 'crosshair',
        maxWidth: '100%',
        height: 'auto',
        borderRadius: 8,
        border: '2px solid #2D2D44',
      }}
    />
  );
};

export default GameBoard;
