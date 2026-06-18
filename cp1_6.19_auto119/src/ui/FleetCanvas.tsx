import React, { useRef, useEffect, useCallback } from 'react';
import type { Ship, AttackLine, WeaponConfig, WeaponType } from '../eventBus';
import { countTargetsInRange } from '../domain/weapon';

interface FleetCanvasProps {
  playerFleet: Ship[];
  enemyFleet: Ship[];
  attackLines: AttackLine[];
  showRange: boolean;
  selectedTargetId: string | null;
  selectedShipId: string | null;
  weaponConfigs: Record<WeaponType, WeaponConfig>;
  onShipClick: (shipId: string, isEnemy: boolean) => void;
  width: number;
  height: number;
}

const SHIP_COLORS: Record<string, string> = {
  destroyer: '#45A29E',
  cruiser: '#66FCF1',
  capital: '#C5C6C7',
};

const SHIP_SIZES: Record<string, number> = {
  destroyer: 12,
  cruiser: 18,
  capital: 24,
};

export const FleetCanvas: React.FC<FleetCanvasProps> = ({
  playerFleet,
  enemyFleet,
  attackLines,
  showRange,
  selectedTargetId,
  selectedShipId,
  weaponConfigs,
  onShipClick,
  width,
  height,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trailCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const prevPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  const drawShip = useCallback(
    (ctx: CanvasRenderingContext2D, ship: Ship, isEnemy: boolean, now: number) => {
      const size = SHIP_SIZES[ship.type];
      const color = isEnemy ? '#E74C3C' : SHIP_COLORS[ship.type];

      ctx.save();
      ctx.translate(ship.x, ship.y);

      if (ship.isFlashing && ship.flashStartTime !== undefined) {
        const flashPhase = Math.floor((now - ship.flashStartTime) / 200) % 2;
        if (flashPhase === 0) {
          ctx.shadowColor = '#E74C3C';
          ctx.shadowBlur = 20;
        }
      }

      const sides = ship.type === 'destroyer' ? 3 : ship.type === 'cruiser' ? 6 : 8;
      const angleOffset = -Math.PI / 2;

      ctx.beginPath();
      for (let i = 0; i < sides; i++) {
        const angle = angleOffset + (i / sides) * Math.PI * 2;
        const px = Math.cos(angle) * size;
        const py = Math.sin(angle) * size;
        if (i === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.closePath();

      ctx.fillStyle = isEnemy ? 'rgba(231, 76, 60, 0.3)' : `${color}33`;
      ctx.fill();

      ctx.strokeStyle = ship.isFlashing ? '#E74C3C' : color;
      ctx.lineWidth = 2;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.restore();

      if ((isEnemy && ship.id === selectedTargetId) || (!isEnemy && ship.id === selectedShipId)) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, size + 8, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 179, 71, 0.7)';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#FFB347';
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.restore();
      }

      const inRangeCount = isEnemy
        ? countTargetsInRange(ship, playerFleet, weaponConfigs)
        : 0;
      if (isEnemy && inRangeCount > 1) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, size + 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(230, 126, 34, 0.4)';
        ctx.fill();
        ctx.restore();
      }
    },
    [selectedTargetId, selectedShipId, playerFleet, weaponConfigs]
  );

  const drawRangeCircles = useCallback(
    (ctx: CanvasRenderingContext2D, ships: Ship[]) => {
      for (const ship of ships) {
        const weapon = weaponConfigs[ship.weaponType];
        ctx.save();
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, weapon.range, 0, Math.PI * 2);
        ctx.fillStyle = `${weapon.color}15`;
        ctx.fill();
        ctx.strokeStyle = `${weapon.color}40`;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }
    },
    [weaponConfigs]
  );

  const drawAttackLines = useCallback(
    (ctx: CanvasRenderingContext2D, lines: AttackLine[], now: number) => {
      for (const line of lines) {
        const progress = (now - line.createdAt) / line.duration;
        if (progress >= 1) continue;

        const alpha = 1 - progress;
        const lineWidth = 2 + (1 - progress) * 2;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(line.startX, line.startY);
        ctx.lineTo(line.endX, line.endY);
        ctx.strokeStyle = line.color;
        ctx.lineWidth = lineWidth;
        ctx.globalAlpha = alpha;
        ctx.shadowColor = line.color;
        ctx.shadowBlur = 10;
        ctx.stroke();

        const headX = line.startX + (line.endX - line.startX) * Math.min(progress * 2, 1);
        const headY = line.startY + (line.endY - line.startY) * Math.min(progress * 2, 1);
        ctx.beginPath();
        ctx.arc(headX, headY, 4, 0, Math.PI * 2);
        ctx.fillStyle = line.color;
        ctx.fill();
        ctx.restore();
      }
    },
    []
  );

  const drawBackground = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) / 1.5);
      gradient.addColorStop(0, '#1A1A2E');
      gradient.addColorStop(1, '#0B0C10');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = 'rgba(102, 252, 241, 0.3)';
      for (let i = 0; i < 50; i++) {
        const x = (i * 73) % w;
        const y = (i * 137) % h;
        const size = (i % 3) * 0.5 + 0.5;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    []
  );

  const drawTrails = useCallback(
    (ctx: CanvasRenderingContext2D, ships: Ship[], isEnemy: boolean) => {
      const color = isEnemy ? '#E74C3C' : '#66FCF1';

      for (const ship of ships) {
        const prev = prevPositionsRef.current.get(ship.id);
        if (prev) {
          const dx = ship.x - prev.x;
          const dy = ship.y - prev.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > 1) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(ship.x, ship.y);
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.3;
            ctx.shadowColor = color;
            ctx.shadowBlur = 10;
            ctx.stroke();
            ctx.restore();
          }
        }
        prevPositionsRef.current.set(ship.id, { x: ship.x, y: ship.y });
      }
    },
    []
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const allShips = [...playerFleet.map((s) => ({ ship: s, isEnemy: false })), ...enemyFleet.map((s) => ({ ship: s, isEnemy: true }))];

      for (const { ship, isEnemy } of allShips) {
        const size = SHIP_SIZES[ship.type];
        const dx = x - ship.x;
        const dy = y - ship.y;
        if (Math.sqrt(dx * dx + dy * dy) <= size + 5) {
          onShipClick(ship.id, isEnemy);
          return;
        }
      }
    },
    [playerFleet, enemyFleet, onShipClick]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const render = () => {
      const now = performance.now();
      drawBackground(ctx, width, height);

      if (showRange) {
        drawRangeCircles(ctx, playerFleet);
      }

      drawTrails(ctx, playerFleet, false);
      drawTrails(ctx, enemyFleet, true);

      for (const ship of playerFleet) {
        drawShip(ctx, ship, false, now);
      }

      for (const ship of enemyFleet) {
        drawShip(ctx, ship, true, now);
      }

      drawAttackLines(ctx, attackLines, now);

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [
    width,
    height,
    playerFleet,
    enemyFleet,
    attackLines,
    showRange,
    drawBackground,
    drawShip,
    drawRangeCircles,
    drawAttackLines,
    drawTrails,
  ]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onClick={handleClick}
      style={{ display: 'block', cursor: 'pointer' }}
    />
  );
};
