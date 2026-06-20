import React, { useEffect, useRef } from 'react';
import { BurndownPoint } from '../types';

interface BurndownChartProps {
  data: BurndownPoint[];
}

const BurndownChart: React.FC<BurndownChartProps> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 24, right: 24, bottom: 48, left: 56 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, height);

    const maxHours = Math.max(
      ...data.map((d) => Math.max(d.idealHours, d.actualHours))
    );
    const yMax = Math.ceil(maxHours / 10) * 10 || 10;
    const ySteps = 5;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= ySteps; i++) {
      const y = padding.top + (chartHeight / ySteps) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      ctx.fillStyle = '#9B9BC7';
      ctx.font = '12px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      const value = yMax - (yMax / ySteps) * i;
      ctx.fillText(`${value}h`, padding.left - 12, y);
    }

    const xStep = data.length > 1 ? chartWidth / (data.length - 1) : chartWidth;
    data.forEach((point, i) => {
      const x = padding.left + xStep * i;
      ctx.fillStyle = '#5A5A80';
      ctx.font = '11px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const date = new Date(point.date);
      const label = `${date.getMonth() + 1}/${date.getDate()}`;
      ctx.fillText(label, x, height - padding.bottom + 14);
    });

    const drawLine = (
      getValue: (p: BurndownPoint) => number,
      color: string,
      dashed: boolean,
      dynamicColor?: (p: BurndownPoint, prev?: BurndownPoint) => string
    ) => {
      ctx.lineWidth = 2.5;
      if (dashed) {
        ctx.setLineDash([6, 4]);
      } else {
        ctx.setLineDash([]);
      }

      for (let i = 0; i < data.length - 1; i++) {
        const x1 = padding.left + xStep * i;
        const x2 = padding.left + xStep * (i + 1);
        const y1 = padding.top + chartHeight * (1 - getValue(data[i]) / yMax);
        const y2 = padding.top + chartHeight * (1 - getValue(data[i + 1]) / yMax);

        const lineColor = dynamicColor
          ? dynamicColor(data[i + 1], data[i])
          : color;

        ctx.strokeStyle = lineColor;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      ctx.setLineDash([]);
      data.forEach((point, i) => {
        const x = padding.left + xStep * i;
        const y = padding.top + chartHeight * (1 - getValue(point) / yMax);
        const pointColor = dynamicColor ? dynamicColor(point) : color;

        ctx.fillStyle = '#1E1E2E';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = pointColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.stroke();
      });
    };

    drawLine((p) => p.idealHours, '#EF4444', false);

    drawLine(
      (p) => p.actualHours,
      '#3B82F6',
      true,
      (point) => (point.actualHours > point.idealHours ? '#F97316' : '#3B82F6')
    );

    const legendItems = [
      { label: '理想线', color: '#EF4444', dashed: false },
      { label: '实际线', color: '#3B82F6', dashed: true },
      { label: '进度滞后', color: '#F97316', dashed: true },
    ];

    let legendX = width - padding.right;
    const legendY = 8;

    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.font = '12px system-ui, -apple-system, sans-serif';

    legendItems.forEach((item) => {
      ctx.fillStyle = '#E0E0E0';
      const textWidth = ctx.measureText(item.label).width;
      ctx.fillText(item.label, legendX, legendY);

      const lineStartX = legendX - textWidth - 24;
      const lineEndX = legendX - textWidth - 8;
      const lineY = legendY + 8;

      ctx.setLineDash(item.dashed ? [4, 3] : []);
      ctx.strokeStyle = item.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(lineStartX, lineY);
      ctx.lineTo(lineEndX, lineY);
      ctx.stroke();
      ctx.setLineDash([]);

      legendX = lineStartX - 24;
    });
  }, [data]);

  return (
    <div
      ref={containerRef}
      style={{
        background: '#2D2D44',
        borderRadius: '12px',
        padding: '20px',
        width: '100%',
        height: '280px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          fontSize: '16px',
          fontWeight: 600,
          color: '#E0E0E0',
          marginBottom: '12px',
        }}
      >
        燃尽图
      </div>
      <div style={{ width: '100%', height: '220px', position: 'relative' }}>
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
          }}
        />
        {data.length === 0 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#5A5A80',
              fontSize: '13px',
            }}
          >
            暂无数据
          </div>
        )}
      </div>
    </div>
  );
};

export default BurndownChart;
