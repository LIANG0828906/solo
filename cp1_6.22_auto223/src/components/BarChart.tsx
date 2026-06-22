import { useRef, useEffect, useState, useCallback } from 'react';
import type { MonthlyStats } from '@/types';

interface BarChartProps {
  data: MonthlyStats[];
  width?: number;
  height?: number;
}

interface TooltipData {
  visible: boolean;
  x: number;
  y: number;
  month: string;
  participants: number;
  checkInRate: number;
}

export const BarChart: React.FC<BarChartProps> = ({ data, width = 800, height = 400 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData>({
    visible: false,
    x: 0,
    y: 0,
    month: '',
    participants: 0,
    checkInRate: 0,
  });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const padding = { top: 40, right: 40, bottom: 60, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const barWidth = chartWidth / (data.length * 2);
  const barGap = chartWidth / (data.length * 2);

  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const maxParticipants = Math.max(...data.map(d => d.participants), 1);
    const maxCheckInRate = 100;

    const getGradient = (ctx: CanvasRenderingContext2D, barHeight: number, y: number) => {
      const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
      gradient.addColorStop(0, '#06B6D4');
      gradient.addColorStop(1, '#3B82F6');
      return gradient;
    };

    ctx.strokeStyle = '#E0D5C1';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      const participantsLabel = Math.round(maxParticipants - (maxParticipants / 5) * i);
      ctx.fillStyle = '#64748B';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(participantsLabel.toString(), padding.left - 10, y + 4);
    }

    ctx.fillStyle = '#64748B';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';

    data.forEach((item, index) => {
      const x = padding.left + index * (barWidth * 2 + barGap) + barGap;
      const participantsHeight = (item.participants / maxParticipants) * chartHeight;
      const participantsY = padding.top + chartHeight - participantsHeight;
      const isHovered = hoveredIndex === index;

      const scale = isHovered ? 1.05 : 1;
      const scaledWidth = barWidth * scale;
      const scaledHeight = participantsHeight * scale;
      const scaledX = x + (barWidth - scaledWidth) / 2;
      const scaledY = padding.top + chartHeight - scaledHeight;

      ctx.fillStyle = getGradient(ctx, scaledHeight, scaledY);
      ctx.beginPath();
      ctx.roundRect(scaledX, scaledY, scaledWidth, scaledHeight, 4);
      ctx.fill();

      ctx.fillStyle = '#1E293B';
      ctx.font = '12px Inter, sans-serif';
      ctx.fillText(item.month, x + barWidth, height - padding.bottom + 25);

      const checkInRateHeight = (item.checkInRate / maxCheckInRate) * (chartHeight * 0.3);
      const checkInRateY = padding.top + chartHeight - checkInRateHeight;
      const checkInRateX = x + barWidth + 8;

      ctx.fillStyle = 'rgba(139, 92, 246, 0.6)';
      ctx.beginPath();
      ctx.roundRect(checkInRateX, checkInRateY, barWidth * 0.6, checkInRateHeight, 4);
      ctx.fill();
    });

    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillRect(width - padding.right - 140, 10, 16, 16);
    ctx.fillStyle = '#06B6D4';
    ctx.fillRect(width - padding.right - 140, 10, 16, 16);
    ctx.fillStyle = '#1E293B';
    ctx.fillText('参与人数', width - padding.right - 118, 23);

    ctx.fillStyle = 'rgba(139, 92, 246, 0.6)';
    ctx.fillRect(width - padding.right - 140, 35, 16, 16);
    ctx.fillStyle = '#1E293B';
    ctx.fillText('签到率', width - padding.right - 118, 48);
  }, [data, width, height, hoveredIndex, barWidth, barGap, chartWidth, chartHeight, padding]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let foundIndex: number | null = null;
    data.forEach((item, index) => {
      const barX = padding.left + index * (barWidth * 2 + barGap) + barGap;
      const barEndX = barX + barWidth * 2 + barGap;
      
      if (x >= barX && x <= barEndX && y >= padding.top && y <= height - padding.bottom) {
        foundIndex = index;
        setTooltip({
          visible: true,
          x: e.clientX - rect.left + 10,
          y: e.clientY - rect.top - 10,
          month: item.month,
          participants: item.participants,
          checkInRate: item.checkInRate,
        });
      }
    });
    setHoveredIndex(foundIndex);
    if (foundIndex === null) {
      setTooltip(prev => ({ ...prev, visible: false }));
    }
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  return (
    <div className="chart-wrapper">
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ width: '100%', height: '100%' }}
      />
      <div
        className={`chart-tooltip ${tooltip.visible ? 'visible' : ''}`}
        style={{ left: tooltip.x, top: tooltip.y }}
      >
        <div style={{ fontWeight: 600, marginBottom: 8 }}>{tooltip.month}</div>
        <div className="chart-tooltip-item">
          <span>参与人数:</span>
          <span style={{ fontWeight: 600, color: '#06B6D4' }}>{tooltip.participants}人</span>
        </div>
        <div className="chart-tooltip-item">
          <span>签到率:</span>
          <span style={{ fontWeight: 600, color: '#8B5CF6' }}>{tooltip.checkInRate}%</span>
        </div>
      </div>
    </div>
  );
};
