import React, { useRef, useEffect, useState, useCallback } from 'react';
import type {
  Room,
  BombType,
  Position,
  Bomb,
  Obstacle,
  Shockwave,
  Debris,
} from '../../shared/types';
import {
  GRID_SIZE,
  getBombColor,
  isPositionValid,
  calculateExplosionRadius,
  DIRECTIONAL_ANGLE,
  isPointInExplosion,
} from '../physics/explosion';

interface BoardProps {
  room: Room;
  isMyTurn: boolean;
  selectedBombType: BombType;
  directionalAngle: number;
  onPlaceBomb: (position: Position, type: BombType, direction?: number) => void;
}

const CANVAS_SIZE = 600;
const MIN_SCALE = 0.5;
const MAX_SCALE = 2;

const Board: React.FC<BoardProps> = ({
  room,
  isMyTurn,
  selectedBombType,
  directionalAngle,
  onPlaceBomb,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState<Position | null>(null);
  const [shakeOffset, setShakeOffset] = useState<Position>({ x: 0, y: 0 });
  const [isShaking, setIsShaking] = useState(false);
  const animFrameRef = useRef<number>();
  const lastShockwaveCount = useRef(0);
  const prevBombIds = useRef<Set<string>>(new Set());

  const screenToWorld = useCallback(
    (screenX: number, screenY: number): Position => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return {
        x: (screenX - rect.left - offset.x) / scale,
        y: (screenY - rect.top - offset.y) / scale,
      };
    },
    [offset, scale]
  );

  const triggerShake = useCallback(() => {
    if (isShaking) return;
    setIsShaking(true);
    const startTime = Date.now();
    const duration = 200;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= duration) {
        setShakeOffset({ x: 0, y: 0 });
        setIsShaking(false);
        return;
      }
      const intensity = (1 - elapsed / duration) * 4;
      setShakeOffset({
        x: (Math.random() - 0.5) * intensity * 2,
        y: (Math.random() - 0.5) * intensity * 2,
      });
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isShaking]);

  useEffect(() => {
    const currentBombIds = new Set(room.bombs.filter(b => b.isExploding).map(b => b.id));
    for (const id of currentBombIds) {
      if (!prevBombIds.current.has(id)) {
        triggerShake();
        break;
      }
    }
    if (room.shockwaves.length > lastShockwaveCount.current) {
      triggerShake();
    }
    lastShockwaveCount.current = room.shockwaves.length;
    prevBombIds.current = currentBombIds;
  }, [room.shockwaves.length, room.bombs, triggerShake]);

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = 'rgba(108, 92, 231, 0.1)';
    ctx.lineWidth = 1;

    for (let x = 0; x <= CANVAS_SIZE; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_SIZE);
      ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_SIZE; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_SIZE, y);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(108, 92, 231, 0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  }, []);

  const drawObstacles = useCallback((ctx: CanvasRenderingContext2D, obstacles: Obstacle[]) => {
    obstacles.forEach((obs) => {
      const gradient = ctx.createLinearGradient(
        obs.position.x, obs.position.y,
        obs.position.x + obs.width, obs.position.y + obs.height
      );
      gradient.addColorStop(0, obs.hitByExplosion ? '#6c5ce790' : '#6c5ce7');
      gradient.addColorStop(1, obs.hitByExplosion ? '#6c5ce750' : '#6c5ce7b0');

      ctx.fillStyle = gradient;
      ctx.fillRect(obs.position.x, obs.position.y, obs.width, obs.height);

      ctx.strokeStyle = obs.hitByExplosion ? '#ff6b35' : '#00d4ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(obs.position.x, obs.position.y, obs.width, obs.height);

      ctx.fillStyle = 'rgba(0, 212, 255, 0.15)';
      for (let i = 0; i < obs.width; i += GRID_SIZE) {
        ctx.fillRect(obs.position.x + i, obs.position.y, 1, obs.height);
      }
    });
  }, []);

  const drawBomb = useCallback((ctx: CanvasRenderingContext2D, bomb: Bomb) => {
    const { position, type, isExploding } = bomb;
    const color = getBombColor(type);
    const baseSize = 14;

    if (isExploding) {
      const flashGlow = ctx.createRadialGradient(
        position.x, position.y, 0,
        position.x, position.y, baseSize * 3
      );
      flashGlow.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      flashGlow.addColorStop(0.3, `${color}80`);
      flashGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = flashGlow;
      ctx.fillRect(position.x - baseSize * 3, position.y - baseSize * 3, baseSize * 6, baseSize * 6);
    }

    ctx.shadowColor = color;
    ctx.shadowBlur = isExploding ? 30 : 15;

    if (type === 'basic') {
      const grad = ctx.createRadialGradient(
        position.x - 3, position.y - 3, 0,
        position.x, position.y, baseSize
      );
      grad.addColorStop(0, '#ffffff80');
      grad.addColorStop(0.4, color);
      grad.addColorStop(1, color);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(position.x, position.y, baseSize, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'delayed') {
      const now = Date.now();
      const remaining = bomb.explodeAt ? Math.max(0, bomb.explodeAt - now) : 0;
      const progress = 1 - remaining / 5000;

      ctx.fillStyle = color;
      ctx.fillRect(position.x - baseSize, position.y - baseSize, baseSize * 2, baseSize * 2);

      ctx.fillStyle = '#1a1a2e';
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        remaining > 0 ? (remaining / 1000).toFixed(1) : '0.0',
        position.x,
        position.y
      );

      ctx.strokeStyle = '#ff6b35';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(position.x, position.y, baseSize + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
      ctx.stroke();
    } else if (type === 'directional') {
      const angle = bomb.direction ?? 0;
      ctx.save();
      ctx.translate(position.x, position.y);
      ctx.rotate(angle);

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(baseSize, 0);
      ctx.lineTo(-baseSize * 0.7, -baseSize * 0.8);
      ctx.lineTo(-baseSize * 0.7, baseSize * 0.8);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#ffffff80';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
    }

    ctx.shadowBlur = 0;
  }, []);

  const drawShockwave = useCallback((ctx: CanvasRenderingContext2D, sw: Shockwave) => {
    const progress = sw.radius / sw.maxRadius;
    const alpha = Math.max(0, 1 - progress);

    if (sw.bombType === 'directional' && sw.direction !== undefined) {
      const halfAngle = DIRECTIONAL_ANGLE / 2;

      for (let i = 3; i >= 0; i--) {
        const r = sw.radius * (1 - i * 0.15);
        if (r <= 0) continue;
        const layerAlpha = alpha * (1 - i * 0.2);

        ctx.beginPath();
        ctx.moveTo(sw.position.x, sw.position.y);
        ctx.arc(
          sw.position.x, sw.position.y, r,
          sw.direction - halfAngle,
          sw.direction + halfAngle
        );
        ctx.closePath();

        const gradient = ctx.createRadialGradient(
          sw.position.x, sw.position.y, 0,
          sw.position.x, sw.position.y, r
        );
        gradient.addColorStop(0, `rgba(255, 217, 61, ${layerAlpha * 0.6})`);
        gradient.addColorStop(0.5, `rgba(255, 107, 53, ${layerAlpha * 0.4})`);
        gradient.addColorStop(1, `rgba(255, 107, 53, 0)`);

        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.strokeStyle = `rgba(255, 217, 61, ${layerAlpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    } else {
      for (let i = 3; i >= 0; i--) {
        const r = sw.radius * (1 - i * 0.15);
        if (r <= 0) continue;
        const layerAlpha = alpha * (1 - i * 0.2);

        const gradient = ctx.createRadialGradient(
          sw.position.x, sw.position.y, 0,
          sw.position.x, sw.position.y, r
        );
        gradient.addColorStop(0, `rgba(255, 217, 61, ${layerAlpha * 0.7})`);
        gradient.addColorStop(0.4, `rgba(255, 107, 53, ${layerAlpha * 0.5})`);
        gradient.addColorStop(1, `rgba(255, 107, 53, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(sw.position.x, sw.position.y, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(255, 217, 61, ${layerAlpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sw.position.x, sw.position.y, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }, []);

  const drawDebris = useCallback((ctx: CanvasRenderingContext2D, debris: Debris[]) => {
    const now = Date.now();
    debris.forEach((d) => {
      const age = now - d.createdAt;
      const alpha = Math.max(0, 1 - age / d.lifetime);

      ctx.globalAlpha = alpha;
      ctx.fillStyle = d.color;
      ctx.shadowColor = d.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(d.position.x, d.position.y, d.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    });
  }, []);

  const drawPreview = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (!mousePos || !isMyTurn) return;

      const valid = isPositionValid(mousePos, room.obstacles, GRID_SIZE);
      const previewColor = valid ? '#00ff88' : '#ff4444';
      const radius = calculateExplosionRadius(selectedBombType);

      ctx.globalAlpha = 0.25;
      if (selectedBombType === 'directional') {
        const halfAngle = DIRECTIONAL_ANGLE / 2;
        ctx.fillStyle = previewColor;
        ctx.beginPath();
        ctx.moveTo(mousePos.x, mousePos.y);
        ctx.arc(mousePos.x, mousePos.y, radius, directionalAngle - halfAngle, directionalAngle + halfAngle);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = previewColor;
        ctx.beginPath();
        ctx.arc(mousePos.x, mousePos.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      ctx.strokeStyle = previewColor;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      if (selectedBombType === 'directional') {
        const halfAngle = DIRECTIONAL_ANGLE / 2;
        ctx.beginPath();
        ctx.moveTo(mousePos.x, mousePos.y);
        ctx.arc(mousePos.x, mousePos.y, radius, directionalAngle - halfAngle, directionalAngle + halfAngle);
        ctx.closePath();
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(mousePos.x, mousePos.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      ctx.fillStyle = previewColor;
      ctx.beginPath();
      ctx.arc(mousePos.x, mousePos.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1a1a2e';
      ctx.lineWidth = 2;
      ctx.stroke();
    },
    [mousePos, isMyTurn, room.obstacles, selectedBombType, directionalAngle]
  );

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.translate(shakeOffset.x, shakeOffset.y);

    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    drawGrid(ctx);
    drawObstacles(ctx, room.obstacles);

    room.shockwaves.forEach((sw) => drawShockwave(ctx, sw));

    room.bombs.forEach((bomb) => {
      if (!bomb.exploded) {
        drawBomb(ctx, bomb);
      }
    });

    drawDebris(ctx, room.debris);
    drawPreview(ctx);

    ctx.restore();
    ctx.restore();

    animFrameRef.current = requestAnimationFrame(render);
  }, [
    offset,
    scale,
    shakeOffset,
    room,
    drawGrid,
    drawObstacles,
    drawShockwave,
    drawBomb,
    drawDebris,
    drawPreview,
  ]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [render]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s * delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.button === 2 || e.shiftKey) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
    setMousePos(screenToWorld(e.clientX, e.clientY));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setMousePos(null);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging || !isMyTurn || e.shiftKey) return;

    const worldPos = screenToWorld(e.clientX, e.clientY);
    if (
      worldPos.x < 0 ||
      worldPos.x > CANVAS_SIZE ||
      worldPos.y < 0 ||
      worldPos.y > CANVAS_SIZE
    ) {
      return;
    }

    if (!isPositionValid(worldPos, room.obstacles, GRID_SIZE)) {
      return;
    }

    const direction = selectedBombType === 'directional' ? directionalAngle : undefined;
    onPlaceBomb(worldPos, selectedBombType, direction);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <div
      ref={containerRef}
      className="relative neon-border rounded-lg overflow-hidden"
      style={{
        width: CANVAS_SIZE,
        height: CANVAS_SIZE,
        background: '#1a1a2e',
      }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        style={{
          display: 'block',
          cursor: isMyTurn ? 'crosshair' : 'not-allowed',
        }}
      />
      <div
        className="absolute bottom-2 right-2 text-[10px] px-2 py-1 rounded"
        style={{
          color: '#8888aa',
          background: 'rgba(26, 26, 46, 0.8)',
          border: '1px solid #6c5ce730',
        }}
      >
        缩放: {Math.round(scale * 100)}% · Shift+拖拽平移 · 滚轮缩放
      </div>
    </div>
  );
};

export default Board;
