import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useBoardStore } from '../game/board';
import { gridToPixel } from '../game/engine';
import { syncElementMove } from '../network/syncClient';
import type { OpticalElement, PixelCoord } from '../game/types';
import { BOARD_SIZE, CELL_SIZE, COLORS, GRID_SIZE } from '../game/types';

interface DragState {
  isDragging: boolean;
  elementId: string | null;
  offset: PixelCoord;
  currentPosition: PixelCoord;
  animatedPosition: PixelCoord;
}

const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    elementId: null,
    offset: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 },
    animatedPosition: { x: 0, y: 0 }
  });
  const [screenShake, setScreenShake] = useState({ x: 0, y: 0 });
  const [turnGlow, setTurnGlow] = useState<'playerA' | 'playerB' | null>(null);
  const [particles, setParticles] = useState<Array<{ x: number; y: number; vx: number; vy: number; life: number; color: string }>>([]);
  const [laserProgress, setLaserProgress] = useState(0);

  const {
    elements,
    laserResult,
    isFiring,
    currentTurn,
    localPlayer,
    phase,
    winner,
    canMoveElement,
    snapToGrid,
    isPositionOccupied,
    isInPlayerHalf,
    round
  } = useBoardStore();

  const basePositions = {
    playerA: gridToPixel({ x: 0, y: 7 }),
    playerB: gridToPixel({ x: 7, y: 0 })
  };

  const laserStartPositions = {
    playerA: { x: basePositions.playerA.x, y: basePositions.playerA.y - CELL_SIZE / 2 },
    playerB: { x: basePositions.playerB.x, y: basePositions.playerB.y + CELL_SIZE / 2 }
  };

  useEffect(() => {
    if (currentTurn && phase === 'playing') {
      setTurnGlow(currentTurn);
      setTimeout(() => setTurnGlow(null), 500);
    }
  }, [currentTurn, phase]);

  useEffect(() => {
    if (isFiring) {
      setScreenShake({ x: 4, y: 4 });
      setTimeout(() => setScreenShake({ x: 0, y: 0 }), 150);
      
      setLaserProgress(0);
      const startTime = Date.now();
      const duration = 1500;
      
      const animateLaser = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        setLaserProgress(progress);
        if (progress < 1) {
          requestAnimationFrame(animateLaser);
        }
      };
      requestAnimationFrame(animateLaser);

      if (laserResult?.particles) {
        laserResult.particles.forEach(p => {
          const newParticles = [];
          for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            const speed = 2 + Math.random() * 3;
            newParticles.push({
              x: p.position.x,
              y: p.position.y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              life: 1,
              color: p.color
            });
          }
          setParticles(prev => [...prev, ...newParticles]);
        });
      }
    }
  }, [isFiring, laserResult]);

  useEffect(() => {
    if (particles.length > 0) {
      const updateParticles = () => {
        setParticles(prev => 
          prev
            .map(p => ({
              ...p,
              x: p.x + p.vx,
              y: p.y + p.vy,
              vy: p.vy + 0.1,
              life: p.life - 0.02
            }))
            .filter(p => p.life > 0)
        );
      };
      const interval = setInterval(updateParticles, 16);
      return () => clearInterval(interval);
    }
  }, [particles.length]);

  const drawBoard = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = COLORS.board;
    ctx.fillRect(0, 0, BOARD_SIZE, BOARD_SIZE);

    ctx.strokeStyle = COLORS.gridLine;
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, BOARD_SIZE);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(BOARD_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }

    const midpoint = GRID_SIZE / 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(0, midpoint * CELL_SIZE);
    ctx.lineTo(BOARD_SIZE, midpoint * CELL_SIZE);
    ctx.stroke();
    ctx.setLineDash([]);
  }, []);

  const drawBase = useCallback((ctx: CanvasRenderingContext2D, player: 'playerA' | 'playerB') => {
    const pos = basePositions[player];
    const color = player === 'playerA' ? COLORS.playerA : COLORS.playerB;
    
    if (winner) {
      if (winner === player) {
        const glowIntensity = (Math.sin(Date.now() / 200) + 1) / 2;
        ctx.shadowColor = COLORS.gold;
        ctx.shadowBlur = 20 + glowIntensity * 30;
      } else {
        ctx.globalAlpha = 0.4;
      }
    }

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
    ctx.fillStyle = color + '40';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 12, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }, [basePositions, winner]);

  const drawLaserEmitter = useCallback((ctx: CanvasRenderingContext2D, player: 'playerA' | 'playerB') => {
    const pos = laserStartPositions[player];
    const color = player === 'playerA' ? COLORS.playerA : COLORS.playerB;
    const isCurrentTurn = currentTurn === player && phase === 'playing';

    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 10, 0, Math.PI * 2);
    ctx.fill();

    if (isCurrentTurn) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 12, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }, [laserStartPositions, currentTurn, phase]);

  const drawMirror = useCallback((ctx: CanvasRenderingContext2D, element: OpticalElement) => {
    const pos = gridToPixel(element.position);
    const size = CELL_SIZE * 0.7;
    
    ctx.save();
    ctx.translate(pos.x, pos.y);
    
    if (element.orientation === 'nw-se') {
      ctx.rotate(Math.PI / 4);
    } else {
      ctx.rotate(-Math.PI / 4);
    }

    const gradient = ctx.createLinearGradient(-size/2, -size/2, size/2, size/2);
    gradient.addColorStop(0, '#FFF8DC');
    gradient.addColorStop(0.5, COLORS.mirror);
    gradient.addColorStop(1, '#B8860B');

    ctx.beginPath();
    ctx.moveTo(-size/2, -size/2);
    ctx.lineTo(size/2, -size/2);
    ctx