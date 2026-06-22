import { useRef, useEffect, useState, useCallback } from 'react';
import type { FlavorProfile, FlavorKey } from '@/types';
import { flavorDimensions } from '@/types';

interface RadarChartProps {
  value: FlavorProfile;
  onChange?: (value: FlavorProfile) => void;
  size?: number;
  interactive?: boolean;
}

export default function RadarChart({
  value,
  onChange,
  size = 300,
  interactive = true,
}: RadarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dragging, setDragging] = useState<FlavorKey | null>(null);
  const animatingRef = useRef<Record<string, number>>({});

  const center = size / 2;
  const radius = size * 0.38;

  const getPointPosition = useCallback(
    (key: FlavorKey, val: number) => {
      const index = flavorDimensions.findIndex((d) => d.key === key);
      const angle = (Math.PI * 2 * index) / flavorDimensions.length - Math.PI / 2;
      const r = (val / 10) * radius;
      return {
        x: center + Math.cos(angle) * r,
        y: center + Math.sin(angle) * r,
      };
    },
    [center, radius]
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, size, size);

    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
      ctx.beginPath();
      for (let j = 0; j <= flavorDimensions.length; j++) {
        const angle =
          (Math.PI * 2 * j) / flavorDimensions.length - Math.PI / 2;
        const r = (i / 5) * radius;
        const x = center + Math.cos(angle) * r;
        const y = center + Math.sin(angle) * r;
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    flavorDimensions.forEach((dim) => {
      const pos = getPointPosition(dim.key, 10);
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    });

    ctx.fillStyle = '#aaa';
    ctx.font = `${size * 0.04}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    flavorDimensions.forEach((dim) => {
      const pos = getPointPosition(dim.key, 12);
      const displayValue = value[dim.key].toFixed(0);
      ctx.fillText(dim.label, pos.x, pos.y - 8);
      ctx.fillStyle = '#e94560';
      ctx.font = `${size * 0.035}px sans-serif`;
      ctx.fillText(displayValue, pos.x, pos.y + 12);
      ctx.fillStyle = '#aaa';
      ctx.font = `${size * 0.04}px sans-serif`;
    });

    ctx.fillStyle = 'rgba(181, 131, 141, 0.6)';
    ctx.strokeStyle = '#b5838d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    flavorDimensions.forEach((dim, i) => {
      const pos = getPointPosition(dim.key, value[dim.key]);
      if (i === 0) ctx.moveTo(pos.x, pos.y);
      else ctx.lineTo(pos.x, pos.y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    flavorDimensions.forEach((dim) => {
      const pos = getPointPosition(dim.key, value[dim.key]);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, size * 0.02, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#e94560';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }, [size, center, radius, value, getPointPosition]);

  useEffect(() => {
    let animationId: number;
    const animate = () => {
      draw();
      animationId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationId);
  }, [draw]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!interactive || !onChange) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * size;
      const y = ((e.clientY - rect.top) / rect.height) * size;

      for (const dim of flavorDimensions) {
        const pos = getPointPosition(dim.key, value[dim.key]);
        const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
        if (dist < size * 0.06) {
          setDragging(dim.key);
          return;
        }
      }
    },
    [interactive, onChange, size, value, getPointPosition]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!dragging || !onChange) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * size;
      const y = ((e.clientY - rect.top) / rect.height) * size;

      const index = flavorDimensions.findIndex((d) => d.key === dragging);
      const angle = (Math.PI * 2 * index) / flavorDimensions.length - Math.PI / 2;

      const dx = x - center;
      const dy = y - center;
      const projection = dx * Math.cos(angle) + dy * Math.sin(angle);
      let newValue = (projection / radius) * 10;
      newValue = Math.max(1, Math.min(10, newValue));

      const key = dragging;
      if (!animatingRef.current[key]) {
        animatingRef.current[key] = value[key];
      }

      const updated = { ...value, [dragging]: Number(newValue.toFixed(1)) };
      onChange(updated);
    },
    [dragging, onChange, size, center, radius, value]
  );

  const handlePointerUp = useCallback(() => {
    if (dragging && onChange) {
      const key = dragging;
      const current = value[key];
      const snapped = Math.round(current);
      if (snapped !== current) {
        const start = current;
        const end = snapped;
        const startTime = performance.now();
        const duration = 200;

        const animateSnap = (now: number) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const val = start + (end - start) * eased;

          onChange({ ...value, [key]: Number(val.toFixed(1)) });

          if (progress < 1) {
            requestAnimationFrame(animateSnap);
          } else {
            onChange({ ...value, [key]: end });
            delete animatingRef.current[key];
          }
        };
        requestAnimationFrame(animateSnap);
      }
    }
    setDragging(null);
  }, [dragging, onChange, value]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ cursor: dragging ? 'grabbing' : interactive ? 'grab' : 'default' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    />
  );
}
