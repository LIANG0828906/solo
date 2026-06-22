import React, { useRef, useEffect, useCallback } from 'react';
import { FlavorProfile, FLAVOR_DIMS, FLAVOR_LABELS } from './types';

interface SpiderChartProps {
  flavors: FlavorProfile;
  onChange: (flavors: FlavorProfile) => void;
}

const SIZE = 400;
const CENTER = SIZE / 2;
const RADIUS = 150;
const LEVELS = 5;
const DIM_COUNT = 6;
const ANGLE_OFFSET = -Math.PI / 2;

function getAngle(i: number): number {
  return ANGLE_OFFSET + (2 * Math.PI * i) / DIM_COUNT;
}

function getPoint(cx: number, cy: number, angle: number, r: number): [number, number] {
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpColor(c1: [number, number, number], c2: [number, number, number], t: number): string {
  const r = Math.round(lerp(c1[0], c2[0], t));
  const g = Math.round(lerp(c1[1], c2[1], t));
  const b = Math.round(lerp(c1[2], c2[2], t));
  return `rgb(${r},${g},${b})`;
}

const COLOR_DARK: [number, number, number] = [184, 134, 11];
const COLOR_LIGHT: [number, number, number] = [255, 215, 0];

export default function SpiderChart({ flavors, onChange }: SpiderChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const prevFlavors = useRef<FlavorProfile>({ ...flavors });
  const targetFlavors = useRef<FlavorProfile>({ ...flavors });
  const animStart = useRef(0);
  const isDragging = useRef(false);
  const dragDim = useRef<keyof FlavorProfile | null>(null);
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  const draw = useCallback((currentFlavors: FlavorProfile) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, SIZE, SIZE);

    for (let lvl = 1; lvl <= LEVELS; lvl++) {
      const r = (RADIUS * lvl) / LEVELS;
      ctx.beginPath();
      for (let i = 0; i < DIM_COUNT; i++) {
        const angle = getAngle(i);
        const [px, py] = getPoint(CENTER, CENTER, angle, r);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = '#D4C4B0';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    for (let i = 0; i < DIM_COUNT; i++) {
      const angle = getAngle(i);
      const [px, py] = getPoint(CENTER, CENTER, angle, RADIUS);
      ctx.beginPath();
      ctx.moveTo(CENTER, CENTER);
      ctx.lineTo(px, py);
      ctx.strokeStyle = '#D4C4B0';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    ctx.beginPath();
    for (let i = 0; i < DIM_COUNT; i++) {
      const dim = FLAVOR_DIMS[i];
      const val = currentFlavors[dim];
      const r = (RADIUS * val) / 10;
      const angle = getAngle(i);
      const [px, py] = getPoint(CENTER, CENTER, angle, r);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();

    const gradient = ctx.createRadialGradient(CENTER, CENTER, 0, CENTER, CENTER, RADIUS);
    gradient.addColorStop(0, 'rgba(184,134,11,0.15)');
    gradient.addColorStop(0.5, 'rgba(255,215,0,0.2)');
    gradient.addColorStop(1, 'rgba(255,215,0,0.05)');
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = '#8B7355';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);

    for (let i = 0; i < DIM_COUNT; i++) {
      const dim = FLAVOR_DIMS[i];
      const val = currentFlavors[dim];
      const r = (RADIUS * val) / 10;
      const angle = getAngle(i);
      const [px, py] = getPoint(CENTER, CENTER, angle, r);
      const t = val / 10;

      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fillStyle = lerpColor(COLOR_DARK, COLOR_LIGHT, t);
      ctx.fill();
      ctx.strokeStyle = '#8B5E3C';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    for (let i = 0; i < DIM_COUNT; i++) {
      const angle = getAngle(i);
      const labelR = RADIUS + 28;
      const [lx, ly] = getPoint(CENTER, CENTER, angle, labelR);
      ctx.font = '500 13px "Noto Sans SC", sans-serif';
      ctx.fillStyle = '#3E2723';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(FLAVOR_LABELS[FLAVOR_DIMS[i]], lx, ly);

      const valR = RADIUS + 44;
      const [vx, vy] = getPoint(CENTER, CENTER, angle, valR);
      ctx.font = '600 12px "Noto Sans SC", sans-serif';
      ctx.fillStyle = '#8B5E3C';
      ctx.fillText(String(Math.round(currentFlavors[FLAVOR_DIMS[i]])), vx, vy);
    }
  }, [dpr]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    canvas.style.width = SIZE + 'px';
    canvas.style.height = SIZE + 'px';
    draw(flavors);
  }, []);

  useEffect(() => {
    const changed = FLAVOR_DIMS.some(d => flavors[d] !== targetFlavors.current[d]);
    if (!changed) return;

    prevFlavors.current = { ...prevFlavors.current };
    FLAVOR_DIMS.forEach(d => {
      if (targetFlavors.current[d] !== flavors[d]) {
        if (!isDragging.current || dragDim.current === d) {
          prevFlavors.current[d] = targetFlavors.current[d];
        }
      }
    });
    targetFlavors.current = { ...flavors };
    animStart.current = performance.now();

    if (animRef.current) cancelAnimationFrame(animRef.current);

    const animate = (now: number) => {
      const elapsed = now - animStart.current;
      const duration = 300;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);

      const interp = { ...prevFlavors.current };
      FLAVOR_DIMS.forEach(d => {
        interp[d] = lerp(prevFlavors.current[d], targetFlavors.current[d], eased);
      });

      draw(interp);

      if (t < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };
    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [flavors, draw]);

  const getCanvasPos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = SIZE / rect.width;
    const scaleY = SIZE / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const findNearestDim = useCallback((x: number, y: number): keyof FlavorProfile | null => {
    let minDist = Infinity;
    let nearest: keyof FlavorProfile | null = null;
    for (let i = 0; i < DIM_COUNT; i++) {
      const dim = FLAVOR_DIMS[i];
      const val = flavors[dim];
      const r = (RADIUS * val) / 10;
      const angle = getAngle(i);
      const [px, py] = getPoint(CENTER, CENTER, angle, r);
      const dist = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
      if (dist < minDist) {
        minDist = dist;
        nearest = dim;
      }
    }
    return minDist < 20 ? nearest : null;
  }, [flavors]);

  const calcValueFromPos = useCallback((x: number, y: number, dim: keyof FlavorProfile): number => {
    const i = FLAVOR_DIMS.indexOf(dim);
    const angle = getAngle(i);
    const axisX = Math.cos(angle);
    const axisY = Math.sin(angle);
    const dx = x - CENTER;
    const dy = y - CENTER;
    const proj = dx * axisX + dy * axisY;
    const val = Math.round((proj / RADIUS) * 10);
    return Math.max(1, Math.min(10, val));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasPos(e);
    const dim = findNearestDim(pos.x, pos.y);
    if (dim) {
      isDragging.current = true;
      dragDim.current = dim;
      const newVal = calcValueFromPos(pos.x, pos.y, dim);
      if (newVal !== flavors[dim]) {
        onChange({ ...flavors, [dim]: newVal });
      }
    }
  }, [flavors, onChange, getCanvasPos, findNearestDim, calcValueFromPos]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging.current || !dragDim.current) return;
    const pos = getCanvasPos(e);
    const newVal = calcValueFromPos(pos.x, pos.y, dragDim.current);
    if (newVal !== flavors[dragDim.current]) {
      onChange({ ...flavors, [dragDim.current]: newVal });
    }
  }, [flavors, onChange, getCanvasPos, calcValueFromPos]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    dragDim.current = null;
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging.current) return;
    const pos = getCanvasPos(e);
    const dim = findNearestDim(pos.x, pos.y);
    if (!dim) {
      const dx = pos.x - CENTER;
      const dy = pos.y - CENTER;
      let minAngleDist = Infinity;
      let closest: keyof FlavorProfile = 'fruit';
      for (let i = 0; i < DIM_COUNT; i++) {
        const angle = getAngle(i);
        const dist = Math.abs(dx * Math.sin(angle) - dy * Math.cos(angle));
        if (dist < minAngleDist) {
          minAngleDist = dist;
          closest = FLAVOR_DIMS[i];
        }
      }
      const newVal = calcValueFromPos(pos.x, pos.y, closest);
      if (newVal !== flavors[closest]) {
        onChange({ ...flavors, [closest]: newVal });
      }
    }
  }, [flavors, onChange, getCanvasPos, findNearestDim, calcValueFromPos]);

  return (
    <div className="chart-container">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
      />
    </div>
  );
}
