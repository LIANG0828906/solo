import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import type { StockComputed } from '../../data/types';

const COLORS = [
  '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308',
  '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
  '#6366f1', '#a855f7',
];

interface PieChartProps {
  holdings: StockComputed[];
}

interface SliceData {
  startAngle: number;
  endAngle: number;
  value: number;
  percentage: number;
  color: string;
  name: string;
  code: string;
}

const MIN_FPS = 30;
const FRAME_TIME_TARGET = 1000 / 60;

const PieChart: React.FC<PieChartProps> = ({ holdings }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const animProgressRef = useRef(1);
  const oldSlicesRef = useRef<SliceData[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const fpsRef = useRef<number>(60);
  const frameCountRef = useRef<number>(0);
  const fpsUpdateTimeRef = useRef<number>(0);
  const animatingRef = useRef<boolean>(false);
  const hoverRafRef = useRef<number | null>(null);
  const pendingHoverRef = useRef<{ x: number; y: number } | null>(null);

  const totalValue = useMemo(() => {
    return holdings.reduce((sum, h) => sum + h.marketValue, 0);
  }, [holdings]);

  const currentSlices = useMemo(() => {
    const slices: SliceData[] = [];
    if (totalValue === 0) return slices;

    let startAngle = -Math.PI / 2;
    holdings.forEach((h, i) => {
      const percentage = h.marketValue / totalValue;
      const endAngle = startAngle + percentage * Math.PI * 2;
      slices.push({
        startAngle,
        endAngle,
        value: h.marketValue,
        percentage,
        color: COLORS[i % COLORS.length],
        name: h.name,
        code: h.code,
      });
      startAngle = endAngle;
    });
    return slices;
  }, [holdings, totalValue]);

  const interpolateSlices = (oldSlices: SliceData[], newSlices: SliceData[], progress: number): SliceData[] => {
    const result: SliceData[] = [];
    const maxLen = Math.max(oldSlices.length, newSlices.length);

    if (oldSlices.length === 0 && newSlices.length > 0) {
      let cumulativeAngle = -Math.PI / 2;
      for (let i = 0; i < newSlices.length; i++) {
        const newSlice = newSlices[i];
        const sliceProgress = Math.min(1, progress * (newSlices.length / Math.max(1, i + 1)));
        const eased = 1 - Math.pow(1 - sliceProgress, 3);
        const sweep = (newSlice.endAngle - newSlice.startAngle) * eased;
        result.push({
          startAngle: cumulativeAngle,
          endAngle: cumulativeAngle + sweep,
          value: newSlice.value * eased,
          percentage: newSlice.percentage * eased,
          color: newSlice.color,
          name: newSlice.name,
          code: newSlice.code,
        });
        cumulativeAngle += sweep;
      }
      return result;
    }

    for (let i = 0; i < maxLen; i++) {
      const oldSlice = oldSlices[i];
      const newSlice = newSlices[i];

      if (oldSlice && newSlice) {
        result.push({
          startAngle: oldSlice.startAngle + (newSlice.startAngle - oldSlice.startAngle) * progress,
          endAngle: oldSlice.endAngle + (newSlice.endAngle - oldSlice.endAngle) * progress,
          value: oldSlice.value + (newSlice.value - oldSlice.value) * progress,
          percentage: oldSlice.percentage + (newSlice.percentage - oldSlice.percentage) * progress,
          color: newSlice.color,
          name: newSlice.name,
          code: newSlice.code,
        });
      } else if (newSlice && !oldSlice) {
        const oldStart = oldSlices.length > 0 ? oldSlices[oldSlices.length - 1].endAngle : -Math.PI / 2;
        const targetSweep = newSlice.endAngle - newSlice.startAngle;
        const currentSweep = targetSweep * progress;
        result.push({
          startAngle: oldStart,
          endAngle: oldStart + currentSweep,
          value: newSlice.value * progress,
          percentage: newSlice.percentage * progress,
          color: newSlice.color,
          name: newSlice.name,
          code: newSlice.code,
        });
      } else if (oldSlice && !newSlice) {
        const remaining = 1 - progress;
        const sweep = oldSlice.endAngle - oldSlice.startAngle;
        result.push({
          startAngle: oldSlice.startAngle,
          endAngle: oldSlice.startAngle + sweep * remaining,
          value: oldSlice.value * remaining,
          percentage: oldSlice.percentage * remaining,
          color: oldSlice.color,
          name: oldSlice.name,
          code: oldSlice.code,
        });
      }
    }

    return result;
  };

  useEffect(() => {
    if (currentSlices.length === 0 && oldSlicesRef.current.length === 0) {
      drawChart(currentSlices, 1);
      return;
    }

    animProgressRef.current = 0;
    const startTime = performance.now();
    const duration = 500;
    let frameSkip = 0;
    let skipCounter = 0;
    animatingRef.current = true;

    const animate = (now: number) => {
      if (!animatingRef.current) return;

      const deltaTime = now - lastFrameTimeRef.current;
      lastFrameTimeRef.current = now;

      frameCountRef.current++;
      if (now - fpsUpdateTimeRef.current >= 500) {
        fpsRef.current = (frameCountRef.current * 1000) / (now - fpsUpdateTimeRef.current);
        frameCountRef.current = 0;
        fpsUpdateTimeRef.current = now;

        if (fpsRef.current < MIN_FPS) {
          frameSkip = 1;
        } else {
          frameSkip = 0;
        }
      }

      if (frameSkip > 0 && skipCounter < frameSkip) {
        skipCounter++;
        rafRef.current = requestAnimationFrame(animate);
        return;
      }
      skipCounter = 0;

      const elapsed = now - startTime;
      animProgressRef.current = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - animProgressRef.current, 3);
      drawChart(interpolateSlices(oldSlicesRef.current, currentSlices, eased), eased);

      if (animProgressRef.current < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        oldSlicesRef.current = [...currentSlices];
        animatingRef.current = false;
      }
    };

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    lastFrameTimeRef.current = performance.now();
    fpsUpdateTimeRef.current = performance.now();
    frameCountRef.current = 0;
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      animatingRef.current = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSlices]);

  const drawChart = (slices: SliceData[], _progress: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadius = Math.min(width, height) / 2 - 30;
    const innerRadius = outerRadius * 0.55;

    ctx.clearRect(0, 0, width, height);

    if (slices.length === 0) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
      ctx.strokeStyle = '#3a3a5e';
      ctx.lineWidth = outerRadius - innerRadius;
      ctx.stroke();

      ctx.fillStyle = '#a0a0c0';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('暂无数据', centerX, centerY);
      return;
    }

    slices.forEach((slice, i) => {
      const isHovered = hoveredIndex === i;
      const offset = isHovered ? 10 : 0;
      const midAngle = (slice.startAngle + slice.endAngle) / 2;
      const offsetX = Math.cos(midAngle) * offset;
      const offsetY = Math.sin(midAngle) * offset;

      ctx.beginPath();
      ctx.arc(centerX + offsetX, centerY + offsetY, outerRadius, slice.startAngle, slice.endAngle);
      ctx.arc(centerX + offsetX, centerY + offsetY, innerRadius, slice.endAngle, slice.startAngle, true);
      ctx.closePath();
      ctx.fillStyle = slice.color;
      ctx.fill();

      if (isHovered) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    ctx.fillStyle = '#e0e0ff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('总市值', centerX, centerY - 8);

    ctx.fillStyle = '#e0e0ff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText(formatNumber(totalValue), centerX, centerY + 4);
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const processHover = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const outerRadius = Math.min(rect.width, rect.height) / 2 - 30;
      const innerRadius = outerRadius * 0.55;

      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist >= innerRadius && dist <= outerRadius) {
        let angle = Math.atan2(dy, dx);
        if (angle < -Math.PI / 2) angle += Math.PI * 2;

        let foundIndex: number | null = null;
        for (let i = 0; i < currentSlices.length; i++) {
          const slice = currentSlices[i];
          if (angle >= slice.startAngle && angle <= slice.endAngle) {
            foundIndex = i;
            break;
          }
        }

        if (foundIndex !== null) {
          setHoveredIndex(foundIndex);
          const slice = currentSlices[foundIndex];
          setTooltip({
            x: x + 15,
            y: y - 10,
            text: `${slice.name} (${slice.code})\n${(slice.percentage * 100).toFixed(2)}%`,
          });
        } else {
          setHoveredIndex(null);
          setTooltip(null);
        }
      } else {
        setHoveredIndex(null);
        setTooltip(null);
      }
    },
    [currentSlices]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      pendingHoverRef.current = { x: e.clientX, y: e.clientY };

      if (hoverRafRef.current !== null) {
        return;
      }

      hoverRafRef.current = requestAnimationFrame(() => {
        if (pendingHoverRef.current) {
          const { x, y } = pendingHoverRef.current;
          processHover(x, y);
        }
        hoverRafRef.current = null;
      });
    },
    [processHover]
  );

  useEffect(() => {
    return () => {
      if (hoverRafRef.current) {
        cancelAnimationFrame(hoverRafRef.current);
        hoverRafRef.current = null;
      }
    };
  }, []);

  const handleMouseLeave = () => {
    setHoveredIndex(null);
    setTooltip(null);
  };

  return (
    <div className="pie-chart-container">
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '320px', cursor: 'pointer' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      {tooltip && (
        <div
          style={{
            position: 'absolute',
            left: tooltip.x,
            top: tooltip.y,
            background: 'rgba(30, 30, 46, 0.95)',
            color: '#e0e0ff',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            pointerEvents: 'none',
            border: '1px solid #3a3a5e',
            whiteSpace: 'pre-line',
            zIndex: 10,
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
};

export default PieChart;
