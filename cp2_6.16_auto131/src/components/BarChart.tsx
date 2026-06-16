import { useRef, useEffect, useState } from 'react';
import { formatShortDate } from '@/utils/time';

interface BarDataItem {
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarDataItem[];
  width?: number;
  height?: number;
  title?: string;
  yAxisLabel?: string;
  barColor?: string;
}

export default function BarChart({
  data,
  width = 500,
  height = 300,
  title,
  yAxisLabel = '小时',
  barColor = '#42A5F5',
}: BarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const padding = { top: 30, right: 20, bottom: 50, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    ctx.fillStyle = '#f9f9f9';
    ctx.fillRect(padding.left, padding.top, chartWidth, chartHeight);

    const maxValue = Math.max(...data.map((d) => d.value), 1);
    const gridLines = 5;

    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;

    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (chartHeight / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      const value = Math.round(maxValue - (maxValue / gridLines) * i);
      ctx.fillStyle = '#999';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(value.toString(), padding.left - 8, y);
    }

    ctx.fillStyle = '#999';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.save();
    ctx.translate(12, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(yAxisLabel, 0, 0);
    ctx.restore();

    const barWidth = (chartWidth / data.length) * 0.6;
    const barGap = (chartWidth / data.length) * 0.4;

    data.forEach((item, index) => {
      const barHeight = (item.value / maxValue) * chartHeight;
      const x = padding.left + barGap / 2 + (chartWidth / data.length) * index;
      const y = padding.top + chartHeight - barHeight;

      const isHovered = hoveredIndex === index;

      const gradient = ctx.createLinearGradient(x, y, x, padding.top + chartHeight);
      if (isHovered) {
        gradient.addColorStop(0, '#1976D2');
        gradient.addColorStop(1, '#64B5F6');
      } else {
        gradient.addColorStop(0, barColor);
        gradient.addColorStop(1, '#90CAF9');
      }

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 4);
      ctx.fill();

      const dotY = y;
      ctx.beginPath();
      ctx.arc(x + barWidth / 2, dotY, 4, 0, Math.PI * 2);
      ctx.fillStyle = isHovered ? '#1565C0' : barColor;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#666';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(formatShortDate(item.label), x + barWidth / 2, padding.top + chartHeight + 8);
    });
  }, [data, width, height, yAxisLabel, barColor, hoveredIndex]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const padding = { top: 30, right: 20, bottom: 50, left: 50 };
    const chartWidth = width - padding.left - padding.right;

    const x = e.clientX - rect.left - padding.left;

    if (x >= 0 && x <= chartWidth) {
      const index = Math.floor(x / (chartWidth / data.length));
      if (index >= 0 && index < data.length) {
        setHoveredIndex(index);
        setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        return;
      }
    }
    setHoveredIndex(null);
  };

  return (
    <div className="relative">
      {title && <h3 className="text-lg font-semibold mb-4 text-gray-800">{title}</h3>}
      <div className="relative inline-block">
        <canvas
          ref={canvasRef}
          style={{ width, height, cursor: 'pointer' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredIndex(null)}
        />
        {hoveredIndex !== null && data[hoveredIndex] && (
          <div
            className="absolute pointer-events-none bg-gray-800 text-white text-xs px-2 py-1 rounded z-10"
            style={{
              left: tooltipPos.x + 10,
              top: tooltipPos.y - 30,
              whiteSpace: 'nowrap',
            }}
          >
            {data[hoveredIndex].value.toFixed(1)} 小时
          </div>
        )}
      </div>
    </div>
  );
}
