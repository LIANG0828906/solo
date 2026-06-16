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
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  maxLife: number;
}

const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    elementId: null,
    offset: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 }
  });

  const [screenShake, setScreenShake] = useState({ x: 0, y: 0, time: 0 });
  const [turnGlow, setTurnGlow] = useState<{ player: 'playerA' | 'playerB'; time: number } | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [winnerEffect, setWinnerEffect] = useState<{ time: number } | null>(null);
  const [laserDots, setLaserDots] = useState<Array<{ t: number; speed: number }>>([]);

  const dragStateRef = useRef(dragState);
  const screenShakeRef = useRef(screenShake);
  const turnGlowRef = useRef(turnGlow);
  const particlesRef = useRef(particles);
  const winnerEffectRef = useRef(winnerEffect);
  const laserDotsRef = useRef(laserDots);

  useEffect(() => { dragStateRef.current = dragState; }, [dragState]);
  useEffect(() => { screenShakeRef.current = screenShake; }, [screenShake]);
  useEffect(() => { turnGlowRef.current = turnGlow; }, [turnGlow]);
  useEffect(() => { particlesRef.current = particles; }, [particles]);
  useEffect(() => { winnerEffectRef.current = winnerEffect; }, [winnerEffect]);
  useEffect(() => { laserDotsRef.current = laserDots; }, [laserDots]);

  const {
    elements,
    laserResult,
    isFiring,
    currentTurn,
    localPlayer,
    phase,
    winner,
    canMoveElement,
    moveElement,
    getAnimatedPosition,
    isAnimating,
    updateAnimations,
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
    if (currentTurn && phase === 'playing' && round > 0) {
      setTurnGlow({ player: currentTurn, time: Date.now() });
    }
  }, [currentTurn, phase, round]);

  useEffect(() => {
    if (isFiring) {
      setScreenShake({ x: 4, y: 4, time: Date.now() });

      const dots = [];
      for (let i = 0; i < 8; i++) {
        dots.push({ t: Math.random(), speed: 0.008 + Math.random() * 0.012 });
      }
      setLaserDots(dots);

      if (laserResult?.particles) {
        const newParticles: Particle[] = [];
        laserResult.particles.forEach(p => {
          for (let i = 0; i < 16; i++) {
            const angle = (Math.PI * 2 * i) / 16 + Math.random() * 0.3;
            const speed = 2 + Math.random() * 4;
            newParticles.push({
              x: p.position.x,
              y: p.position.y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              life: 1,
              color: p.color,
              maxLife: 1
            });
          }
        });
        setParticles(prev => [...prev, ...newParticles]);
      }
    }
  }, [isFiring, laserResult]);

  useEffect(() => {
    if (winner && phase === 'ended') {
      setWinnerEffect({ time: Date.now() });
    }
  }, [winner, phase]);

  const getElementPosition = useCallback((element: OpticalElement): PixelCoord => {
    if (dragStateRef.current.isDragging && dragStateRef.current.elementId === element.id) {
      return dragStateRef.current.currentPosition;
    }
    const animPos = getAnimatedPosition(element.id);
    if (animPos) return animPos;
    return gridToPixel(element.position);
  }, [getAnimatedPosition]);

  const drawBoard = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = COLORS.board;
    ctx.fillRect(0, 0, BOARD_SIZE, BOARD_SIZE);

    ctx.strokeStyle = COLORS.gridLine;
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE + 0.5, 0);
      ctx.lineTo(i * CELL_SIZE + 0.5, BOARD_SIZE);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE + 0.5);
      ctx.lineTo(BOARD_SIZE, i * CELL_SIZE + 0.5);
      ctx.stroke();
    }
  }, []);

  const drawTurnGlow = useCallback((ctx: CanvasRenderingContext2D) => {
    const glow = turnGlowRef.current;
    if (!glow) return;

    const elapsed = Date.now() - glow.time;
    if (elapsed > 500) return;

    const t = elapsed / 500;
    const alpha = (1 - t) * 0.6;
    const color = glow.player === 'playerA' ? COLORS.playerA : COLORS.playerB;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 6;
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.strokeRect(3, 3, BOARD_SIZE - 6, BOARD_SIZE - 6);
    ctx.restore();
  }, []);

  const drawBase = useCallback((ctx: CanvasRenderingContext2D, player: 'playerA' | 'playerB') => {
    const pos = basePositions[player];
    const color = player === 'playerA' ? COLORS.playerA : COLORS.playerB;

    ctx.save();

    if (winner && phase === 'ended') {
      const effect = winnerEffectRef.current;
      const elapsed = effect ? Date.now() - effect.time : 0;

      if (winner === player) {
        if (elapsed < 3000) {
          const pulse = (Math.sin(Date.now() / 150) + 1) / 2;
          ctx.shadowColor = COLORS.gold;
          ctx.shadowBlur = 15 + pulse * 25;
        }
      } else {
        ctx.globalAlpha = 0.4;
        ctx.filter = 'grayscale(80%)';
      }
    }

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 28, 0, Math.PI * 2);
    ctx.fillStyle = color + '25';
    ctx.fill();

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

    ctx.beginPath();
    ctx.arc(pos.x - 4, pos.y - 4, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fill();

    ctx.restore();
  }, [basePositions, winner, phase]);

  const drawLaserEmitter = useCallback((ctx: CanvasRenderingContext2D, player: 'playerA' | 'playerB') => {
    const pos = laserStartPositions[player];
    const color = player === 'playerA' ? COLORS.playerA : COLORS.playerB;
    const isCurrentTurn = currentTurn === player && phase === 'playing';

    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
    ctx.fill();

    if (isCurrentTurn) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 15 + Math.sin(Date.now() / 200) * 5;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 10, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }, [laserStartPositions, currentTurn, phase]);

  const drawMirror = useCallback((ctx: CanvasRenderingContext2D, element: OpticalElement) => {
    const pos = getElementPosition(element);
    const size = CELL_SIZE * 0.65;

    ctx.save();
    ctx.translate(pos.x, pos.y);

    if (dragStateRef.current.isDragging && dragStateRef.current.elementId === element.id) {
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 6;
      ctx.shadowOffsetY = 6;
    }

    if (element.orientation === 'nw-se') {
      ctx.rotate(Math.PI / 4);
    } else {
      ctx.rotate(-Math.PI / 4);
    }

    const gradient = ctx.createLinearGradient(-size / 2, -size / 2, size / 2, size / 2);
    gradient.addColorStop(0, '#FFFACD');
    gradient.addColorStop(0.3, COLORS.mirror);
    gradient.addColorStop(0.7, '#DAA520');
    gradient.addColorStop(1, '#B8860B');

    ctx.beginPath();
    ctx.moveTo(-size / 2, -size / 2);
    ctx.lineTo(size / 2, -size / 2);
    ctx.lineTo(-size / 2, size / 2);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-size / 2 + 4, -size / 2 + 4);
    ctx.lineTo(size / 2 - 8, -size / 2 + 4);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }, [getElementPosition]);

  const drawPrism = useCallback((ctx: CanvasRenderingContext2D, element: OpticalElement) => {
    const pos = getElementPosition(element);
    const size = CELL_SIZE * 0.6;

    ctx.save();
    ctx.translate(pos.x, pos.y);

    if (dragStateRef.current.isDragging && dragStateRef.current.elementId === element.id) {
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 6;
      ctx.shadowOffsetY = 6;
    }

    const gradient = ctx.createLinearGradient(0, -size / 2, 0, size / 2);
    gradient.addColorStop(0, '#F5F5F5');
    gradient.addColorStop(0.5, COLORS.prism);
    gradient.addColorStop(1, '#808080');

    ctx.beginPath();
    ctx.moveTo(0, -size / 2);
    ctx.lineTo(size / 2, size / 2);
    ctx.lineTo(-size / 2, size / 2);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = '#606060';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, -size / 2 + 6);
    ctx.lineTo(-size / 4, size / 4);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(size / 6, -size / 6);
    ctx.lineTo(size / 3, 0);
    ctx.strokeStyle = 'rgba(173,216,230,0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }, [getElementPosition]);

  const drawBlocker = useCallback((ctx: CanvasRenderingContext2D, element: OpticalElement) => {
    const pos = getElementPosition(element);
    const w = CELL_SIZE * 0.72;
    const h = CELL_SIZE * 0.32;

    ctx.save();
    ctx.translate(pos.x, pos.y);

    const isDraggingThis = dragStateRef.current.isDragging && dragStateRef.current.elementId === element.id;

    if (isDraggingThis) {
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 6;
      ctx.shadowOffsetY = 6;
    }

    const ownerColor = element.owner === 'playerA' ? COLORS.playerA : element.owner === 'playerB' ? COLORS.playerB : null;

    const gradient = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.5, COLORS.blocker);
    gradient.addColorStop(1, '#1E90FF');

    const r = 6;
    ctx.beginPath();
    ctx.moveTo(-w / 2 + r, -h / 2);
    ctx.lineTo(w / 2 - r, -h / 2);
    ctx.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    ctx.lineTo(w / 2, h / 2 - r);
    ctx.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    ctx.lineTo(-w / 2 + r, h / 2);
    ctx.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    ctx.lineTo(-w / 2, -h / 2 + r);
    ctx.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = '#0066CC';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (ownerColor && element.movable) {
      ctx.fillStyle = ownerColor;
      ctx.beginPath();
      ctx.arc(-w / 2 + 10, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(w / 2 - 10, 0, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.beginPath();
    ctx.moveTo(-w / 2 + 8, -h / 2 + 5);
    ctx.lineTo(w / 2 - 20, -h / 2 + 5);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (element.movable && localPlayer && element.owner === localPlayer && phase === 'playing' && currentTurn === localPlayer) {
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(-w / 2 - 3, -h / 2 - 3, w + 6, h + 6);
      ctx.setLineDash([]);
    }

    ctx.restore();
  }, [getElementPosition, localPlayer, phase, currentTurn]);

  const drawLaser = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!isFiring || !laserResult || laserResult.segments.length === 0) return;

    const firingPlayer = currentTurn;
    const startPos = laserStartPositions[firingPlayer];

    ctx.save();

    const totalLength = laserResult.segments.reduce((sum, seg) => {
      return sum + Math.hypot(seg.end.x - seg.start.x, seg.end.y - seg.start.y);
    }, 0);

    laserResult.segments.forEach(seg => {
      const intensity = seg.intensity || 1;

      ctx.shadowColor = COLORS.laser;
      ctx.shadowBlur = 10 * intensity;
      ctx.strokeStyle = COLORS.laser + Math.floor(intensity * 255).toString(16).padStart(2, '0');
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(seg.start.x, seg.start.y);
      ctx.lineTo(seg.end.x, seg.end.y);
      ctx.stroke();

      ctx.shadowBlur = 4 * intensity;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(seg.start.x, seg.start.y);
      ctx.lineTo(seg.end.x, seg.end.y);
      ctx.stroke();
    });

    ctx.shadowBlur = 0;
    ctx.lineWidth = 1;

    const dots = laserDotsRef.current;
    let accLength = 0;

    laserResult.segments.forEach(seg => {
      const segLength = Math.hypot(seg.end.x - seg.start.x, seg.end.y - seg.start.y);
      const dx = (seg.end.x - seg.start.x) / segLength;
      const dy = (seg.end.y - seg.start.y) / segLength;

      dots.forEach(dot => {
        const globalT = (dot.t + (Date.now() % 10000) * dot.speed * 0.001) % 1;
        const dotDist = globalT * totalLength;

        if (dotDist >= accLength && dotDist < accLength + segLength) {
          const localT = (dotDist - accLength) / segLength;
          const x = seg.start.x + dx * segLength * localT;
          const y = seg.start.y + dy * segLength * localT;

          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fillStyle = COLORS.laser;
          ctx.fill();
        }
      });

      accLength += segLength;
    });

    ctx.restore();
  }, [isFiring, laserResult, currentTurn, laserStartPositions]);

  const drawParticles = useCallback((ctx: CanvasRenderingContext2D) => {
    const currentParticles = particlesRef.current;
    if (currentParticles.length === 0) return;

    ctx.save();

    currentParticles.forEach(p => {
      const alpha = Math.max(0, p.life);
      const size = 2 + p.life * 4;

      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;

      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }, []);

  const drawElements = useCallback((ctx: CanvasRenderingContext2D) => {
    elements.forEach(element => {
      if (element.type === 'mirror') {
        drawMirror(ctx, element);
      } else if (element.type === 'prism') {
        drawPrism(ctx, element);
      } else if (element.type === 'blocker') {
        drawBlocker(ctx, element);
      }
    });
  }, [elements, drawMirror, drawPrism, drawBlocker]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    updateAnimations();

    const shake = screenShakeRef.current;
    let shakeX = 0;
    let shakeY = 0;

    const shakeElapsed = Date.now() - shake.time;
    if (shakeElapsed < 150) {
      const t = shakeElapsed / 150;
      const factor = 1 - t;
      shakeX = (Math.random() - 0.5) * shake.x * 2 * factor;
      shakeY = (Math.random() - 0.5) * shake.y * 2 * factor;
    }

    if (particlesRef.current.length > 0) {
      setParticles(prev =>
        prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.08,
            life: p.life - 0.02
          }))
          .filter(p => p.life > 0)
      );
    }

    ctx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);

    ctx.save();
    ctx.translate(shakeX, shakeY);

    drawBoard(ctx);
    drawTurnGlow(ctx);
    drawBase(ctx, 'playerA');
    drawBase(ctx, 'playerB');
    drawLaserEmitter(ctx, 'playerA');
    drawLaserEmitter(ctx, 'playerB');
    drawElements(ctx);
    drawLaser(ctx);
    drawParticles(ctx);

    ctx.restore();

    animationRef.current = requestAnimationFrame(render);
  }, [
    updateAnimations,
    drawBoard,
    drawTurnGlow,
    drawBase,
    drawLaserEmitter,
    drawElements,
    drawLaser,
    drawParticles
  ]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(render);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [render]);

  const getCanvasCoords = useCallback((e: React.MouseEvent | React.TouchEvent): PixelCoord => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    }
  }, []);

  const findElementAt = useCallback((pixel: PixelCoord): OpticalElement | null => {
    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i];
      const pos = gridToPixel(element.position);

      let hitboxW: number;
      let hitboxH: number;

      if (element.type === 'blocker') {
        hitboxW = CELL_SIZE * 0.72;
        hitboxH = CELL_SIZE * 0.32;
      } else {
        hitboxW = CELL_SIZE * 0.7;
        hitboxH = CELL_SIZE * 0.7;
      }

      if (
        pixel.x >= pos.x - hitboxW / 2 &&
        pixel.x <= pos.x + hitboxW / 2 &&
        pixel.y >= pos.y - hitboxH / 2 &&
        pixel.y <= pos.y + hitboxH / 2
      ) {
        return element;
      }
    }
    return null;
  }, [elements]);

  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();

    if (phase !== 'playing' || !localPlayer || currentTurn !== localPlayer) return;

    const pixel = getCanvasCoords(e);
    const element = findElementAt(pixel);

    if (!element || !canMoveElement(element.id, localPlayer)) return;

    const pos = gridToPixel(element.position);

    setDragState({
      isDragging: true,
      elementId: element.id,
      offset: {
        x: pixel.x - pos.x,
        y: pixel.y - pos.y
      },
      currentPosition: pos
    });
  }, [phase, localPlayer, currentTurn, getCanvasCoords, findElementAt, canMoveElement]);

  const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!dragStateRef.current.isDragging) return;
    e.preventDefault();

    const pixel = getCanvasCoords(e);

    setDragState(prev => ({
      ...prev,
      currentPosition: {
        x: pixel.x - prev.offset.x,
        y: pixel.y - prev.offset.y
      }
    }));
  }, [getCanvasCoords]);

  const handlePointerUp = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!dragStateRef.current.isDragging || !dragStateRef.current.elementId) return;
    e.preventDefault();

    const elementId = dragStateRef.current.elementId!;
    const finalPos = dragStateRef.current.currentPosition;

    const moved = moveElement(elementId, finalPos, localPlayer);

    if (moved) {
      const element = elements.find(e => e.id === elementId);
      if (element) {
        syncElementMove(elementId, element.position);
      }
    }

    setDragState({
      isDragging: false,
      elementId: null,
      offset: { x: 0, y: 0 },
      currentPosition: { x: 0, y: 0 }
    });
  }, [moveElement, localPlayer, elements]);

  return (
    <canvas
      ref={canvasRef}
      width={BOARD_SIZE}
      height={BOARD_SIZE}
      style={{
        display: 'block',
        borderRadius: '12px',
        cursor: dragState.isDragging ? 'grabbing' : 'default',
        touchAction: 'none',
        userSelect: 'none'
      }}
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
    />
  );
};

export default GameCanvas;
