import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useGearStore } from './store';
import type { Gear } from './types';

const GearCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const meshingCheckRef = useRef<number>(0);
  const gaugeUpdateRef = useRef<number>(0);
  const [draggingGear, setDraggingGear] = useState<Gear | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const {
    gears,
    particles,
    glows,
    gaugeValue,
    isRunning,
    updateGearPosition,
    removeGear,
    checkMeshing,
    updateRotation,
    updateEffects,
    updateGauge
  } = useGearStore();

  const getCanvasCoords = useCallback((e: React.MouseEvent | MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }, []);

  const drawGear = useCallback((
    ctx: CanvasRenderingContext2D,
    gear: Gear,
    isDragging: boolean
  ) => {
    const { x, y, radius, teeth, rotationAngle, isError } = gear;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotationAngle);

    if (isDragging) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowOffsetX = 4;
      ctx.shadowOffsetY = 4;
      ctx.shadowBlur = 8;
    }

    const toothHeight = radius * 0.15;
    const innerRadius = radius - toothHeight;
    const angleStep = (Math.PI * 2) / teeth;

    let fillGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    if (isError) {
      fillGradient.addColorStop(0, '#FF6666');
      fillGradient.addColorStop(1, '#FF4444');
    } else {
      fillGradient.addColorStop(0, '#A0845C');
      fillGradient.addColorStop(1, '#7B5B3A');
    }

    ctx.beginPath();
    for (let i = 0; i < teeth; i++) {
      const angle = i * angleStep;
      const nextAngle = (i + 1) * angleStep;
      const midAngle = angle + angleStep / 2;

      const innerX1 = Math.cos(angle) * innerRadius;
      const innerY1 = Math.sin(angle) * innerRadius;
      const outerX = Math.cos(midAngle) * radius;
      const outerY = Math.sin(midAngle) * radius;
      const innerX2 = Math.cos(nextAngle) * innerRadius;
      const innerY2 = Math.sin(nextAngle) * innerRadius;

      if (i === 0) {
        ctx.moveTo(innerX1, innerY1);
      }
      ctx.lineTo(outerX, outerY);
      ctx.lineTo(innerX2, innerY2);
    }
    ctx.closePath();
    ctx.fillStyle = fillGradient;
    ctx.fill();

    if (!isError) {
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 2;
      for (let i = 0; i < teeth; i++) {
        const midAngle = i * angleStep + angleStep / 2;
        const outerX = Math.cos(midAngle) * radius;
        const outerY = Math.sin(midAngle) * radius;
        const innerX = Math.cos(midAngle) * (radius - toothHeight * 0.8);
        const innerY = Math.sin(midAngle) * (radius - toothHeight * 0.8);

        ctx.beginPath();
        ctx.moveTo(innerX, innerY);
        ctx.lineTo(outerX, outerY);
        ctx.stroke();
      }
    }

    ctx.shadowColor = 'transparent';

    const holeRadius = radius * 0.3;
    ctx.beginPath();
    ctx.arc(0, 0, holeRadius, 0, Math.PI * 2);
    ctx.fillStyle = isError ? '#CC3333' : '#5C4033';
    ctx.fill();
    ctx.strokeStyle = isError ? '#FF6666' : '#8B7355';
    ctx.lineWidth = 2;
    ctx.stroke();

    const boltCount = 6;
    const boltRadius = radius * 0.55;
    const boltSize = radius * 0.08;
    for (let i = 0; i < boltCount; i++) {
      const boltAngle = (i / boltCount) * Math.PI * 2;
      const bx = Math.cos(boltAngle) * boltRadius;
      const by = Math.sin(boltAngle) * boltRadius;

      ctx.beginPath();
      ctx.arc(bx, by, boltSize, 0, Math.PI * 2);
      ctx.fillStyle = isError ? '#FF8888' : '#DAA520';
      ctx.fill();
      ctx.strokeStyle = isError ? '#FF4444' : '#B8860B';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(0, 0, holeRadius * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = isError ? '#FF6666' : '#DAA520';
    ctx.fill();

    ctx.restore();
  }, []);

  const drawGauge = useCallback((ctx: CanvasRenderingContext2D, centerX: number, centerY: number) => {
    const gaugeRadius = 200;

    const outerGradient = ctx.createRadialGradient(
      centerX, centerY, gaugeRadius * 0.8,
      centerX, centerY, gaugeRadius
    );
    outerGradient.addColorStop(0, '#6B4226');
    outerGradient.addColorStop(1, '#4A2E1B');

    ctx.beginPath();
    ctx.arc(centerX, centerY, gaugeRadius, 0, Math.PI * 2);
    ctx.fillStyle = outerGradient;
    ctx.fill();
    ctx.strokeStyle = '#C9A96E';
    ctx.lineWidth = 6;
    ctx.stroke();

    const innerGradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, gaugeRadius * 0.9
    );
    innerGradient.addColorStop(0, '#6B4226');
    innerGradient.addColorStop(1, '#4A2E1B');

    ctx.beginPath();
    ctx.arc(centerX, centerY, gaugeRadius * 0.9, 0, Math.PI * 2);
    ctx.fillStyle = innerGradient;
    ctx.fill();
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 2;
    ctx.stroke();

    const tickCount = 12;
    for (let i = 0; i < tickCount; i++) {
      const angle = (i / tickCount) * Math.PI * 2 - Math.PI / 2;
      const innerR = gaugeRadius * 0.75;
      const outerR = gaugeRadius * 0.85;

      const x1 = centerX + Math.cos(angle) * innerR;
      const y1 = centerY + Math.sin(angle) * innerR;
      const x2 = centerX + Math.cos(angle) * outerR;
      const y2 = centerY + Math.sin(angle) * outerR;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = '#C9A96E';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    const rpmToAngle = (gaugeValue / 20) * Math.PI * 2 - Math.PI / 2;
    const pointerLength = 180;
    const pointerBase = 20;

    const tipX = centerX + Math.cos(rpmToAngle) * pointerLength;
    const tipY = centerY + Math.sin(rpmToAngle) * pointerLength;
    const baseX1 = centerX + Math.cos(rpmToAngle + Math.PI / 2) * pointerBase;
    const baseY1 = centerY + Math.sin(rpmToAngle + Math.PI / 2) * pointerBase;
    const baseX2 = centerX + Math.cos(rpmToAngle - Math.PI / 2) * pointerBase;
    const baseY2 = centerY + Math.sin(rpmToAngle - Math.PI / 2) * pointerBase;

    ctx.beginPath();
    ctx.moveTo(baseX1, baseY1);
    ctx.lineTo(tipX, tipY);
    ctx.lineTo(baseX2, baseY2);
    ctx.closePath();
    ctx.fillStyle = '#8B0000';
    ctx.fill();
    ctx.strokeStyle = '#5C0000';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 15, 0, Math.PI * 2);
    ctx.fillStyle = '#DAA520';
    ctx.fill();
    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#8B6914';
    ctx.fill();

    ctx.fillStyle = '#C9A96E';
    ctx.font = 'bold 16px serif';
    ctx.textAlign = 'center';
    ctx.fillText('RPM', centerX, centerY + gaugeRadius * 0.55);

    ctx.font = 'bold 24px serif';
    ctx.fillStyle = '#FFD700';
    ctx.fillText(gaugeValue.toFixed(1), centerX, centerY + gaugeRadius * 0.3);
  }, [gaugeValue]);

  const drawParticles = useCallback((ctx: CanvasRenderingContext2D) => {
    particles.forEach((p) => {
      const alpha = p.life / p.maxLife;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 2 * alpha, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 215, 0, ${alpha * 0.3})`;
      ctx.fill();
    });
  }, [particles]);

  const drawGlows = useCallback((ctx: CanvasRenderingContext2D) => {
    glows.forEach((g) => {
      const alpha = (g.life / g.maxLife) * 0.5;
      const gradient = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.radius);
      gradient.addColorStop(0, `rgba(255, 215, 0, ${alpha})`);
      gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

      ctx.beginPath();
      ctx.arc(g.x, g.y, g.radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    });
  }, [glows]);

  const drawBackground = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = '#1C1109';
    ctx.fillRect(0, 0, width, height);

    ctx.globalAlpha = 0.03;
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = 2 + Math.random() * 4;
      ctx.fillStyle = Math.random() > 0.5 ? '#DAA520' : '#8B4513';
      ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = (currentTime: number) => {
      const deltaTime = lastTimeRef.current ? currentTime - lastTimeRef.current : 16;
      lastTimeRef.current = currentTime;

      meshingCheckRef.current += deltaTime;
      if (meshingCheckRef.current >= 50) {
        checkMeshing();
        meshingCheckRef.current = 0;
      }

      gaugeUpdateRef.current += deltaTime;
      if (gaugeUpdateRef.current >= 100) {
        updateGauge();
        gaugeUpdateRef.current = 0;
      }

      updateRotation(deltaTime);
      updateEffects(deltaTime);

      const { width, height } = canvas;
      const centerX = width / 2;
      const centerY = height / 2;

      drawBackground(ctx, width, height);
      drawGlows(ctx);
      drawGauge(ctx, centerX, centerY);

      gears.forEach((gear) => {
        const isDragging = draggingGear?.id === gear.id;
        drawGear(ctx, gear, isDragging);
      });

      drawParticles(ctx);

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [gears, particles, glows, draggingGear, drawBackground, drawGear, drawGauge, drawParticles, drawGlows, checkMeshing, updateRotation, updateEffects, updateGauge]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isRunning) return;

    const { x, y } = getCanvasCoords(e);

    for (let i = gears.length - 1; i >= 0; i--) {
      const gear = gears[i];
      const dx = x - gear.x;
      const dy = y - gear.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= gear.radius) {
        if (e.button === 2) {
          removeGear(gear.id);
          return;
        }
        setDraggingGear(gear);
        setDragOffset({ x: dx, y: dy });
        return;
      }
    }
  }, [gears, getCanvasCoords, removeGear, isRunning]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingGear || isRunning) return;

    const { x, y } = getCanvasCoords(e);
    const newX = x - dragOffset.x;
    const newY = y - dragOffset.y;

    updateGearPosition(draggingGear.id, newX, newY);
  }, [draggingGear, dragOffset, getCanvasCoords, updateGearPosition, isRunning]);

  const handleMouseUp = useCallback(() => {
    setDraggingGear(null);
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        cursor: draggingGear ? 'grabbing' : 'default',
        display: 'block'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={handleContextMenu}
    />
  );
};

export default GearCanvas;
