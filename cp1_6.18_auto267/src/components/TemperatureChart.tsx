import { useEffect, useRef } from 'react';
import type { TemperaturePoint } from '../shared/store';

interface TemperatureChartProps {
  data: TemperaturePoint[];
  buoyName: string;
}

export function TemperatureChart({ data, buoyName }: TemperatureChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 10, right: 40, bottom: 24, left: 4 };

    ctx.clearRect(0, 0, width, height);

    if (data.length === 0) {
      ctx.fillStyle = '#64748B';
      ctx.font = '12px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('暂无数据', width / 2, height / 2);
      return;
    }

    const temps = data.map((d) => d.temperature);
    const minTemp = Math.floor(Math.min(...temps) - 1);
    const maxTemp = Math.ceil(Math.max(...temps) + 1);

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      const temp = maxTemp - ((maxTemp - minTemp) / 4) * i;
      ctx.fillStyle = '#94A3B8';
      ctx.font = '10px -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${temp.toFixed(0)}°`, width - padding.right + 4, y + 3);
    }

    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('-60s', padding.left + 4, height - 6);
    ctx.fillText('0s', width - padding.right - 4, height - 6);

    ctx.strokeStyle = '#00F5D4';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();

    data.forEach((point, i) => {
      const x = padding.left + (i / (data.length - 1)) * chartWidth;
      const y =
        padding.top +
        chartHeight -
        ((point.temperature - minTemp) / (maxTemp - minTemp)) * chartHeight;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, 'rgba(0, 245, 212, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 245, 212, 0)');

    ctx.lineTo(padding.left + chartWidth, height - padding.bottom);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    const lastPoint = data[data.length - 1];
    const lastX = padding.left + chartWidth;
    const lastY =
      padding.top +
      chartHeight -
      ((lastPoint.temperature - minTemp) / (maxTemp - minTemp)) * chartHeight;

    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#00F5D4';
    ctx.fill();
  }, [data, buoyName]);

  const currentTemp = data.length > 0 ? data[data.length - 1].temperature : 0;

  return (
    <div className="glass-panel temp-chart-panel">
      <div className="chart-title">
        <span>{buoyName} · 温度曲线</span>
        <span className="current-temp">{currentTemp.toFixed(1)}°C</span>
      </div>
      <canvas ref={canvasRef} className="chart-canvas" />
    </div>
  );
}
