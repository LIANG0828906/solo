import { useEffect, useRef } from 'react';
import type { DailySnapshot, Task } from '../types';

interface BurndownChartProps {
  startDate: string;
  endDate: string;
  tasks: Task[];
  snapshots: DailySnapshot[];
  height?: number;
}

export function BurndownChart({
  startDate,
  endDate,
  tasks,
  snapshots,
  height = 180,
}: BurndownChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    const displayHeight = height;

    canvas.width = width * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${displayHeight}px`;
    ctx.scale(dpr, dpr);

    const padding = { top: 20, right: 20, bottom: 30, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = displayHeight - padding.top - padding.bottom;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    );

    const totalEstimate = tasks.reduce((sum, t) => sum + t.estimateHours, 0);
    const completedEstimate = tasks
      .filter((t) => t.column === 'done')
      .reduce((sum, t) => sum + t.estimateHours, 0);
    const currentRemaining = totalEstimate - completedEstimate;

    const yMax = Math.ceil(totalEstimate * 1.1 / 5) * 5 || 10;
    const yMin = 0;

    ctx.clearRect(0, 0, width, displayHeight);

    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.font = '11px Inter, sans-serif';
    ctx.fillStyle = '#94A3B8';

    const yTicks = 5;
    for (let i = 0; i <= yTicks; i++) {
      const y = padding.top + (chartHeight / yTicks) * i;
      const value = Math.round(yMax - ((yMax - yMin) / yTicks) * i);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${value}h`, padding.left - 8, y);
    }

    for (let i = 0; i < totalDays; i++) {
      const x = padding.left + (chartWidth / (totalDays - 1)) * i;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(`D${i + 1}`, x, displayHeight - padding.bottom + 8);
    }

    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(
      width - padding.right,
      padding.top + chartHeight
    );
    ctx.stroke();
    ctx.setLineDash([]);

    const dataPoints: { x: number; y: number }[] = [];

    const sortedSnapshots = [...snapshots].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    sortedSnapshots.forEach((snapshot) => {
      const snapshotDate = new Date(snapshot.date);
      const dayIndex = Math.floor(
        (snapshotDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (dayIndex >= 0 && dayIndex < totalDays) {
        const x = padding.left + (chartWidth / (totalDays - 1)) * dayIndex;
        const yRatio = (snapshot.remainingHours - yMin) / (yMax - yMin);
        const y = padding.top + chartHeight * (1 - yRatio);
        dataPoints.push({ x, y });
      }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIndex = Math.floor(
      (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (todayIndex >= 0 && todayIndex < totalDays) {
      const x = padding.left + (chartWidth / (totalDays - 1)) * todayIndex;
      const yRatio = (currentRemaining - yMin) / (yMax - yMin);
      const y = padding.top + chartHeight * (1 - yRatio);
      const hasTodaySnapshot = sortedSnapshots.some(
        (s) =>
          new Date(s.date).toDateString() === today.toDateString()
      );
      if (!hasTodaySnapshot || dataPoints.length === 0) {
        dataPoints.push({ x, y });
      }
    }

    if (dataPoints.length > 0) {
      dataPoints.sort((a, b) => a.x - b.x);

      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      dataPoints.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();

      ctx.fillStyle = '#3B82F6';
      dataPoints.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }, [startDate, endDate, tasks, snapshots, height]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: `${height}px` }}>
      <canvas ref={canvasRef} className="burndown-canvas" />
    </div>
  );
}
