import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from './store';
import {
  ELEMENT_COLORS,
  RuneElement,
  Position,
  Rune
} from '../game/types';
import { getRuneById, getValidMoves, getAllRunes } from '../game/engine';

const CELL_SIZE = 60;
const BOARD_PADDING = 20;
const RUNE_RADIUS = 28;
const BORDER_WIDTH = 30;

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function Board() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const pulseTimeRef = useRef<number>(0);
  const breatheTimeRef = useRef<number>(0);
  
  const {
    gameState,
    selectedRune,
    hoveredCell,
    isDragging,
    dragStartPos,
    dragCurrentPos,
    movingRunes,
    attackAnimations,
    damageNumbers,
    shatterEffects,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleRuneClick,
    setHoveredCell,
    cleanupAnimations
  } = useGameStore();
  
  const boardPixelSize = gameState.boardSize * CELL_SIZE;
  const totalWidth = boardPixelSize + BORDER_WIDTH * 2;
  const totalHeight = boardPixelSize + BORDER_WIDTH * 2;
  
  const boardToPixel = useCallback((pos: Position): { x: number; y: number } => {
    return {
      x: BORDER_WIDTH + pos.x * CELL_SIZE + CELL_SIZE / 2,
      y: BORDER_WIDTH + pos.y * CELL_SIZE + CELL_SIZE / 2
    };
  }, []);
  
  const pixelToBoard = useCallback((px: number, py: number): Position => {
    return {
      x: Math.floor((px - BORDER_WIDTH) / CELL_SIZE),
      y: Math.floor((py - BORDER_WIDTH) / CELL_SIZE)
    };
  }, []);
  
  const getCanvasCoords = useCallback((e: React.MouseEvent | MouseEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }, []);
  
  const drawBackground = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#0B0E14';
    ctx.fillRect(0, 0, totalWidth, totalHeight);
  }, [totalWidth, totalHeight]);
  
  const drawBorder = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#B8860B';
    ctx.fillRect(0, 0, totalWidth, BORDER_WIDTH);
    ctx.fillRect(0, boardPixelSize + BORDER_WIDTH, totalWidth, BORDER_WIDTH);
    ctx.fillRect(0, 0, BORDER_WIDTH, totalHeight);
    ctx.fillRect(boardPixelSize + BORDER_WIDTH, 0, BORDER_WIDTH, totalHeight);
    
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      BORDER_WIDTH - 1,
      BORDER_WIDTH - 1,
      boardPixelSize + 2,
      boardPixelSize + 2
    );
    ctx.strokeRect(
      BORDER_WIDTH + 1,
      BORDER_WIDTH + 1,
      boardPixelSize - 2,
      boardPixelSize - 2
    );
  }, [totalWidth, totalHeight, boardPixelSize]);
  
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    for (let y = 0; y < gameState.boardSize; y++) {
      for (let x = 0; x < gameState.boardSize; x++) {
        const isLight = (x + y) % 2 === 0;
        ctx.fillStyle = isLight ? '#E8E8E8' : '#D0D0D0';
        ctx.fillRect(
          BORDER_WIDTH + x * CELL_SIZE,
          BORDER_WIDTH + y * CELL_SIZE,
          CELL_SIZE,
          CELL_SIZE
        );
      }
    }
  }, [gameState.boardSize]);
  
  const drawBases = useCallback((ctx: CanvasRenderingContext2D) => {
    const drawHex = (cx: number, cy: number, color: string, label: string) => {
      const size = 20;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const px = cx + size * Math.cos(angle);
        const py = cy + size * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = hexToRgba(color, 0.3);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.fillStyle = color;
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, cx, cy);
    };
    
    const p1Base = boardToPixel({ x: 0, y: 0 });
    const p2Base = boardToPixel({ x: gameState.boardSize - 1, y: gameState.boardSize - 1 });
    
    drawHex(p1Base.x, p1Base.y, '#4A90D9', 'P1');
    drawHex(p2Base.x, p2Base.y, '#D94A4A', 'P2');
  }, [gameState.boardSize, boardToPixel]);
  
  const drawObstacles = useCallback((ctx: CanvasRenderingContext2D) => {
    for (let y = 0; y < gameState.boardSize; y++) {
      for (let x = 0; x < gameState.boardSize; x++) {
        const cell = gameState.cells[y][x];
        if (cell.type === 'obstacle') {
          const px = BORDER_WIDTH + x * CELL_SIZE;
          const py = BORDER_WIDTH + y * CELL_SIZE;
          
          ctx.fillStyle = '#666666';
          ctx.beginPath();
          ctx.moveTo(px + 10, py + CELL_SIZE - 8);
          ctx.lineTo(px + CELL_SIZE / 2, py + 8);
          ctx.lineTo(px + CELL_SIZE - 10, py + CELL_SIZE - 8);
          ctx.closePath();
          ctx.fill();
          
          ctx.fillStyle = '#888888';
          ctx.beginPath();
          ctx.moveTo(px + 15, py + CELL_SIZE - 12);
          ctx.lineTo(px + CELL_SIZE / 2, py + 15);
          ctx.lineTo(px + CELL_SIZE / 2, py + CELL_SIZE - 12);
          ctx.closePath();
          ctx.fill();
        }
      }
    }
  }, [gameState.cells, gameState.boardSize]);
  
  const drawBuffs = useCallback((ctx: CanvasRenderingContext2D, time: number) => {
    const breathe = (Math.sin(time / 1000) + 1) / 2;
    const minAlpha = 0.3;
    const maxAlpha = 0.8;
    const alpha = minAlpha + breathe * (maxAlpha - minAlpha);
    
    for (let y = 0; y < gameState.boardSize; y++) {
      for (let x = 0; x < gameState.boardSize; x++) {
        const cell = gameState.cells[y][x];
        if (cell.type === 'buff') {
          const cx = BORDER_WIDTH + x * CELL_SIZE + CELL_SIZE / 2;
          const cy = BORDER_WIDTH + y * CELL_SIZE + CELL_SIZE / 2;
          
          const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, CELL_SIZE / 2 - 4);
          gradient.addColorStop(0, hexToRgba('#00BFFF', alpha));
          gradient.addColorStop(0.5, hexToRgba('#87CEEB', alpha * 0.6));
          gradient.addColorStop(1, hexToRgba('#87CEEB', 0));
          
          ctx.fillStyle = gradient;
          ctx.fillRect(
            BORDER_WIDTH + x * CELL_SIZE + 2,
            BORDER_WIDTH + y * CELL_SIZE + 2,
            CELL_SIZE - 4,
            CELL_SIZE - 4
          );
          
          ctx.fillStyle = hexToRgba('#FFFFFF', alpha * 0.8);
          ctx.font = 'bold 16px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('★', cx, cy);
        }
      }
    }
  }, [gameState.cells, gameState.boardSize]);
  
  const drawValidMoves = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!selectedRune || selectedRune.hasMoved) return;
    
    const validMoves = getValidMoves(gameState, selectedRune);
    
    ctx.fillStyle = 'rgba(100, 255, 100, 0.25)';
    ctx.strokeStyle = 'rgba(100, 255, 100, 0.6)';
    ctx.lineWidth = 1;
    
    for (const pos of validMoves) {
      const px = BORDER_WIDTH + pos.x * CELL_SIZE;
      const py = BORDER_WIDTH + pos.y * CELL_SIZE;
      ctx.fillRect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4);
      ctx.strokeRect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4);
    }
  }, [gameState, selectedRune]);
  
  const drawRuneIcon = useCallback((
    ctx: CanvasRenderingContext2D,
    element: RuneElement,
    cx: number,
    cy: number,
    size: number
  ) => {
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    
    switch (element) {
      case 'fire':
        ctx.beginPath();
        ctx.moveTo(cx, cy - size / 2);
        ctx.lineTo(cx + size / 2, cy + size / 2);
        ctx.lineTo(cx - size / 2, cy + size / 2);
        ctx.closePath();
        ctx.fill();
        break;
      case 'wind':
        ctx.beginPath();
        ctx.moveTo(cx - size / 2, cy);
        ctx.quadraticCurveTo(cx - size / 4, cy - size / 3, cx, cy);
        ctx.quadraticCurveTo(cx + size / 4, cy + size / 3, cx + size / 2, cy);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - size / 2, cy + size / 4);
        ctx.quadraticCurveTo(cx - size / 4, cy + size / 12, cx, cy + size / 4);
        ctx.quadraticCurveTo(cx + size / 4, cy + size / 2.4, cx + size / 2, cy + size / 4);
        ctx.stroke();
        break;
      case 'earth':
        ctx.fillRect(cx - size / 2, cy - size / 2, size, size);
        break;
      case 'water':
        ctx.beginPath();
        ctx.moveTo(cx, cy - size / 2);
        ctx.bezierCurveTo(cx + size / 2, cy - size / 4, cx + size / 2, cy + size / 3, cx, cy + size / 2);
        ctx.bezierCurveTo(cx - size / 2, cy + size / 3, cx - size / 2, cy - size / 4, cx, cy - size / 2);
        ctx.fill();
        break;
    }
  }, []);
  
  const drawRune = useCallback((
    ctx: CanvasRenderingContext2D,
    rune: Rune,
    pos: { x: number; y: number },
    isSelected: boolean,
    time: number
  ) => {
    const colors = ELEMENT_COLORS[rune.element];
    const radius = RUNE_RADIUS / 2;
    
    if (isSelected) {
      const pulse = (Math.sin(time / 150) + 1) / 2;
      const glowRadius = radius + 6 + pulse * 4;
      
      const gradient = ctx.createRadialGradient(pos.x, pos.y, radius, pos.x, pos.y, glowRadius);
      gradient.addColorStop(0, hexToRgba('#FFFFFF', 0.8));
      gradient.addColorStop(1, hexToRgba('#FFFFFF', 0));
      
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, glowRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    }
    
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius + 2, 0, Math.PI * 2);
    ctx.fillStyle = colors.border;
    ctx.fill();
    
    const bodyGradient = ctx.createRadialGradient(
      pos.x - radius / 3, pos.y - radius / 3, 0,
      pos.x, pos.y, radius
    );
    bodyGradient.addColorStop(0, colors.secondary);
    bodyGradient.addColorStop(1, colors.primary);
    
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = bodyGradient;
    ctx.fill();
    
    drawRuneIcon(ctx, rune.element, pos.x, pos.y - 3, 14);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`攻${rune.attack}`, pos.x, pos.y + radius - 8);
    
    const hpBarWidth = radius * 1.6;
    const hpBarHeight = 4;
    const hpBarY = pos.y + radius + 3;
    const hpPercent = rune.currentHp / rune.maxHp;
    
    ctx.fillStyle = '#333333';
    ctx.fillRect(pos.x - hpBarWidth / 2, hpBarY, hpBarWidth, hpBarHeight);
    
    ctx.fillStyle = hpPercent > 0.5 ? '#4CAF50' : hpPercent > 0.25 ? '#FF9800' : '#F44336';
    ctx.fillRect(pos.x - hpBarWidth / 2, hpBarY, hpBarWidth * hpPercent, hpBarHeight);
  }, [drawRuneIcon]);
  
  const drawAllRunes = useCallback((ctx: CanvasRenderingContext2D, time: number) => {
    const runes = getAllRunes(gameState);
    
    const movingMap = new Map<string, typeof movingRunes[0]>();
    for (const m of movingRunes) {
      movingMap.set(m.runeId, m);
    }
    
    for (const rune of runes) {
      let pos = boardToPixel(rune.position);
      
      const moving = movingMap.get(rune.id);
      if (moving) {
        const elapsed = time - moving.startTime;
        const t = Math.min(1, elapsed / moving.duration);
        const eased = easeOutCubic(t);
        const fromPx = boardToPixel(moving.fromPos);
        const toPx = boardToPixel(moving.toPos);
        pos = {
          x: fromPx.x + (toPx.x - fromPx.x) * eased,
          y: fromPx.y + (toPx.y - fromPx.y) * eased
        };
      }
      
      const isSelected = selectedRune?.id === rune.id;
      
      if (isDragging && selectedRune?.id === rune.id && dragCurrentPos) {
        continue;
      }
      
      drawRune(ctx, rune, pos, isSelected, time);
    }
  }, [gameState, movingRunes, selectedRune, isDragging, dragCurrentPos, boardToPixel, drawRune]);
  
  const drawDragGhost = useCallback((ctx: CanvasRenderingContext2D, time: number) => {
    if (!isDragging || !selectedRune || !dragCurrentPos) return;
    
    const rune = getRuneById(gameState, selectedRune.id);
    if (!rune) return;
    
    ctx.save();
    ctx.globalAlpha = 0.8;
    drawRune(ctx, rune, dragCurrentPos, true, time);
    ctx.restore();
  }, [isDragging, selectedRune, dragCurrentPos, gameState, drawRune]);
  
  const drawDragLine = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!isDragging || !selectedRune || !dragStartPos || !dragCurrentPos) return;
    
    const rune = getRuneById(gameState, selectedRune.id);
    if (!rune) return;
    
    const colors = ELEMENT_COLORS[rune.element];
    const start = boardToPixel(rune.position);
    
    ctx.save();
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(dragCurrentPos.x, dragCurrentPos.y);
    ctx.stroke();
    
    ctx.setLineDash([]);
    ctx.fillStyle = colors.primary;
    ctx.beginPath();
    ctx.arc(dragCurrentPos.x, dragCurrentPos.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }, [isDragging, selectedRune, dragStartPos, dragCurrentPos, gameState, boardToPixel]);
  
  const drawAttackAnimations = useCallback((ctx: CanvasRenderingContext2D, time: number) => {
    for (const anim of attackAnimations) {
      const elapsed = time - anim.startTime;
      if (elapsed > anim.duration) continue;
      
      const attacker = getRuneById(gameState, anim.attackerId);
      const target = getRuneById(gameState, anim.targetId);
      if (!attacker || !target) continue;
      
      const fromPx = boardToPixel(attacker.position);
      const toPx = boardToPixel(target.position);
      
      const alpha = 1 - elapsed / anim.duration;
      
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = anim.color;
      ctx.lineWidth = 3;
      ctx.shadowColor = anim.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(fromPx.x, fromPx.y);
      ctx.lineTo(toPx.x, toPx.y);
      ctx.stroke();
      ctx.restore();
    }
  }, [attackAnimations, gameState, boardToPixel]);
  
  const drawDamageNumbers = useCallback((ctx: CanvasRenderingContext2D, time: number) => {
    for (const dn of damageNumbers) {
      const elapsed = time - dn.startTime;
      if (elapsed > dn.duration) continue;
      
      const target = getRuneById(gameState, dn.targetId);
      if (!target) continue;
      
      const pos = boardToPixel(target.position);
      const progress = elapsed / dn.duration;
      const offsetY = -40 * progress;
      const alpha = 1 - progress;
      
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      if (dn.isCritical) {
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.strokeText(`-${dn.damage}`, pos.x, pos.y + offsetY - 20);
      }
      
      ctx.fillStyle = '#FF0000';
      ctx.fillText(`-${dn.damage}`, pos.x, pos.y + offsetY - 20);
      ctx.restore();
    }
  }, [damageNumbers, gameState, boardToPixel]);
  
  const drawShatterEffects = useCallback((ctx: CanvasRenderingContext2D, time: number) => {
    for (const effect of shatterEffects) {
      const elapsed = time - effect.startTime;
      if (elapsed > effect.duration) continue;
      
      const progress = elapsed / effect.duration;
      const alpha = 1 - progress;
      const pos = boardToPixel(effect.position);
      const colors = ELEMENT_COLORS[effect.element as RuneElement];
      
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = colors.primary;
      
      for (const piece of effect.pieces) {
        const px = pos.x + piece.vx * (elapsed / 1000);
        const py = pos.y + piece.vy * (elapsed / 1000) + 0.5 * 200 * Math.pow(elapsed / 1000, 2);
        ctx.beginPath();
        ctx.arc(px, py, piece.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }, [shatterEffects, boardToPixel]);
  
  const drawHoveredCell = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!hoveredCell) return;
    if (hoveredCell.x < 0 || hoveredCell.x >= gameState.boardSize) return;
    if (hoveredCell.y < 0 || hoveredCell.y >= gameState.boardSize) return;
    
    const px = BORDER_WIDTH + hoveredCell.x * CELL_SIZE;
    const py = BORDER_WIDTH + hoveredCell.y * CELL_SIZE;
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2);
  }, [hoveredCell, gameState.boardSize]);
  
  const render = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    drawBackground(ctx);
    drawBorder(ctx);
    drawGrid(ctx);
    drawBases(ctx);
    drawObstacles(ctx);
    drawBuffs(ctx, time);
    drawValidMoves(ctx);
    drawHoveredCell(ctx);
    drawAllRunes(ctx, time);
    drawDragLine(ctx);
    drawDragGhost(ctx, time);
    drawAttackAnimations(ctx, time);
    drawDamageNumbers(ctx, time);
    drawShatterEffects(ctx, time);
  }, [
    drawBackground,
    drawBorder,
    drawGrid,
    drawBases,
    drawObstacles,
    drawBuffs,
    drawValidMoves,
    drawHoveredCell,
    drawAllRunes,
    drawDragLine,
    drawDragGhost,
    drawAttackAnimations,
    drawDamageNumbers,
    drawShatterEffects
  ]);
  
  const animate = useCallback((time: number) => {
    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;
    
    if (Math.floor(time / 2000) !== Math.floor(pulseTimeRef.current / 2000)) {
      pulseTimeRef.current = time;
    }
    breatheTimeRef.current = time;
    
    cleanupAnimations(time);
    render(time);
    
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [render, cleanupAnimations]);
  
  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [animate]);
  
  const getRuneAtPixel = useCallback((px: number, py: number): Rune | null => {
    const runes = getAllRunes(gameState);
    
    for (const rune of runes) {
      const pos = boardToPixel(rune.position);
      const dx = px - pos.x;
      const dy = py - pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= RUNE_RADIUS / 2 + 2) {
        return rune;
      }
    }
    return null;
  }, [gameState, boardToPixel]);
  
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    const rune = getRuneAtPixel(coords.x, coords.y);
    
    if (rune && rune.owner === gameState.currentTurn) {
      handleDragStart(rune.id, { x: coords.x, y: coords.y });
    }
  }, [getCanvasCoords, getRuneAtPixel, gameState.currentTurn, handleDragStart]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    const boardPos = pixelToBoard(coords.x, coords.y);
    
    const inBoard = boardPos.x >= 0 && boardPos.x < gameState.boardSize &&
                    boardPos.y >= 0 && boardPos.y < gameState.boardSize;
    setHoveredCell(inBoard ? boardPos : null);
    
    if (isDragging) {
      handleDragMove({ x: coords.x, y: coords.y });
    }
  }, [getCanvasCoords, pixelToBoard, gameState.boardSize, setHoveredCell, isDragging, handleDragMove]);
  
  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    const boardPos = pixelToBoard(coords.x, coords.y);
    
    if (isDragging) {
      const inBoard = boardPos.x >= 0 && boardPos.x < gameState.boardSize &&
                      boardPos.y >= 0 && boardPos.y < gameState.boardSize;
      
      if (inBoard) {
        handleDragEnd(boardPos);
      } else {
        handleDragEnd({ x: -1, y: -1 });
      }
    } else {
      const rune = getRuneAtPixel(coords.x, coords.y);
      if (rune && rune.owner === gameState.currentTurn) {
        handleRuneClick(rune.id);
      }
    }
  }, [getCanvasCoords, pixelToBoard, isDragging, gameState.boardSize, getRuneAtPixel, gameState.currentTurn, handleDragEnd, handleRuneClick]);
  
  const handleMouseLeave = useCallback(() => {
    setHoveredCell(null);
    if (isDragging) {
      handleDragEnd({ x: -1, y: -1 });
    }
  }, [setHoveredCell, isDragging, handleDragEnd]);
  
  return (
    <canvas
      ref={canvasRef}
      width={totalWidth}
      height={totalHeight}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{
        display: 'block',
        cursor: isDragging ? 'grabbing' : 'pointer',
        userSelect: 'none'
      }}
    />
  );
}
