import { useEffect, useRef, useState } from 'react';
import { engagementApi } from '@/services/api';
import type { DailyTrend, Platform } from '@/types';
import { PLATFORM_COLORS } from '@/types';

interface TrendChartProps {
  platform: Platform;
}

export default function TrendChart({ platform }: TrendChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<DailyTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    loadTrendData();
  }, [platform]);

  const loadTrendData = async () => {
    try {
      setLoading(true);
      const result = await engagementApi.getTrend(platform);
      setData(result);
    } catch (error) {
      console.error('Failed to load trend data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loading || data.length === 0) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = 240;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, height);

    const maxValue = Math.max(...data.map((d) => d.likes + d.comments + d.shares)) * 1.15;
    const minValue = 0;

    const color = PLATFORM_COLORS[platform];

    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#9ca3af';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (chartHeight / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      const value = Math.round(maxValue - ((maxValue - minValue) / gridLines) * i);
      ctx.fillText(value.toLocaleString(), padding.left - 10, y);
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    data.forEach((d, i) => {
      const x = padding.left + (chartWidth / (data.length - 1)) * i;
      const dateStr = d.date.slice(5).replace('-', '/');
      ctx.fillText(dateStr, x, height - padding.bottom + 12);
    });

    const getX = (index: number) => padding.left + (chartWidth / (data.length - 1)) * index;
    const getY = (value: number) =>
      padding.top + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;

    const totalData = data.map((d) => d.likes + d.comments + d.shares);

    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, color + '40');
    gradient.addColorStop(1, color + '05');

    ctx.beginPath();
    ctx.moveTo(getX(0), height - padding.bottom);
    totalData.forEach((value, i) => {
      if (i === 0) {
        ctx.lineTo(getX(i), getY(value));
      } else {
        const prevX = getX(i - 1);
        const prevY = getY(totalData[i - 1]);
        const currX = getX(i);
        const currY = getY(value);
        const cpX = (prevX + currX) / 2;
        ctx.bezierCurveTo(cpX, prevY, cpX, currY, currX, currY);
      }
    });
    ctx.lineTo(getX(data.length - 1), height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    totalData.forEach((value, i) => {
      const x = getX(i);
      const y = getY(value);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        const prevX = getX(i - 1);
        const prevY = getY(totalData[i - 1]);
        const cpX = (prevX + x) / 2;
        ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
      }
    });
    ctx.stroke();

    totalData.forEach((value, i) => {
      const x = getX(i);
      const y = getY(value);

      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = color;
      ctx.stroke();
    });

    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#374151';
    totalData.forEach((value, i) => {
      const x = getX(i);
      const y = getY(value) - 12;
      ctx.fillText(value.toLocaleString(), x, y);
    });
  }, [data, loading, platform, isVisible]);

  if (loading) {
    return (
      <div className="h-60 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-60"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
      }}
    >
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
