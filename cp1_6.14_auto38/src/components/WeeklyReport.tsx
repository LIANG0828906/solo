import { useEffect, useRef, useState } from 'react';
import { TrendingUp, Star, CheckCircle, Users } from 'lucide';
import { cn } from '@/lib/utils';

export interface MemberTaskStats {
  id: string;
  name: string;
  taskCount: number;
  completedTasks: number;
  points: number;
  color?: string;
}

export interface CategoryStats {
  name: string;
  count: number;
}

interface WeeklyReportProps {
  memberStats: MemberTaskStats[];
  categoryStats: CategoryStats[];
  totalTasks: number;
  totalPoints: number;
  completionRate: number;
  className?: string;
}

function useCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  draw: (ctx: CanvasRenderingContext2D, progress: number) => void,
  deps: unknown[]
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    let animationId: number;
    let startTime: number | null = null;
    const duration = 1200;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      ctx.clearRect(0, 0, rect.width, rect.height);
      draw(ctx, eased);

      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, deps);
}

function BarChart({ data, memberStats }: { data: number[]; memberStats: MemberTaskStats[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useCanvas(
    canvasRef,
    (ctx, progress) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const padding = { top: 20, right: 20, bottom: 40, left: 40 };
      const chartWidth = width - padding.left - padding.right;
      const chartHeight = height - padding.top - padding.bottom;

      const maxValue = Math.max(...data, 1);
      const barCount = data.length;
      const barWidth = (chartWidth / barCount) * 0.6;
      const barGap = (chartWidth / barCount) * 0.4;

      ctx.strokeStyle = '#F2EDE4';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
      }

      data.forEach((value, index) => {
        const barHeight = (value / maxValue) * chartHeight * progress;
        const x = padding.left + barGap / 2 + (chartWidth / barCount) * index;
        const y = padding.top + chartHeight - barHeight;

        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        const color = memberStats[index]?.color || '#FF8C42';
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, color + '80');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        const radius = 6;
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + barWidth - radius, y);
        ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
        ctx.lineTo(x + barWidth, y + barHeight);
        ctx.lineTo(x, y + barHeight);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#6B7280';
        ctx.font = '12px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(memberStats[index]?.name || '', x + barWidth / 2, height - 15);

        if (progress > 0.8) {
          ctx.fillStyle = '#374151';
          ctx.font = 'bold 12px system-ui, sans-serif';
          ctx.fillText(String(value), x + barWidth / 2, y - 6);
        }
      });
    },
    [data, memberStats]
  );

  return <canvas ref={canvasRef} className="h-full w-full" />;
}

function RadarChart({ data }: { data: CategoryStats[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useCanvas(
    canvasRef,
    (ctx, progress) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) / 2 - 50;

      const sides = data.length;
      const angleStep = (Math.PI * 2) / sides;
      const startAngle = -Math.PI / 2;

      const maxValue = Math.max(...data.map((d) => d.count), 1;

      ctx.strokeStyle = '#F2EDE4';
      ctx.lineWidth = 1;
      for (let level = 1; level <= 4; level++) {
        const levelRadius = (radius / 4) * level;
        ctx.beginPath();
        for (let i = 0; i <= sides; i++) {
          const angle = startAngle + angleStep * i;
          const x = centerX + levelRadius * Math.cos(angle);
          const y = centerY + levelRadius * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      }

      ctx.strokeStyle = '#E5DDCE';
      ctx.lineWidth = 1;
      for (let i = 0; i < sides; i++) {
        const angle = startAngle + angleStep * i;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.stroke();
      }

      ctx.fillStyle = 'rgba(255, 140, 66, 0.3)';
      ctx.strokeStyle = '#FF8C42';
      ctx.lineWidth = 2;
      ctx.beginPath();
      data.forEach((item, index) => {
        const value = (item.count / maxValue) * radius * progress;
        const angle = startAngle + angleStep * index;
        const x = centerX + value * Math.cos(angle);
        const y = centerY + value * Math.sin(angle);
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      data.forEach((item, index) => {
        const value = (item.count / maxValue) * radius * progress;
        const angle = startAngle + angleStep * index;
        const x = centerX + value * Math.cos(angle);
        const y = centerY + value * Math.sin(angle);

        ctx.fillStyle = '#FF8C42';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();

        const labelRadius = radius + 20;
        const labelX = centerX + labelRadius * Math.cos(angle);
        const labelY = centerY + labelRadius * Math.sin(angle);

        ctx.fillStyle = '#6B7280';
        ctx.font = '12px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.name, labelX, labelY);
      });
    },
    [data]
  );

  return <canvas ref={canvasRef} className="h-full w-full" />;
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bgColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  bgColor: string;
}) {
