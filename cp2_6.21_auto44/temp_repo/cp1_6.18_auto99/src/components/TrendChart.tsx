import { useEffect, useRef } from 'react';

interface TrendPoint {
  date: string;
  calories: number;
}

interface TrendChartProps {
  data: TrendPoint[];
  width?: number;
  height?: number;
}

export function TrendChart({ data, width = 700, height = 200 }: TrendChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const paddingLeft = 60;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 40;
    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const maxCalories = Math.max(...data.map((d) => d.calories), 500);
    const yMax = Math.ceil(maxCalories / 100) * 100;
    const ySteps = 5;
    const yStepValue = yMax / ySteps;

    ctx.strokeStyle = '#2D2D44';
    ctx.lineWidth = 1;
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = '#A0A0B0';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let i = 0; i <= ySteps; i++) {
      const y = paddingTop + chartHeight - (chartHeight * i) / ySteps;
      const value = Math.round(yStepValue * i);

      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(paddingLeft + chartWidth, y);
      ctx.stroke();

      ctx.fillText(`${value}`, paddingLeft - 8, y);
    }

    ctx.fillText('kcal', paddingLeft - 8, paddingTop - 10);

    const xStep = data.length > 1 ? chartWidth / (data.length - 1) : 0;
    const points = data.map((d, i) => ({
      x: paddingLeft + i * xStep,
      y: paddingTop + chartHeight - (chartHeight * d.calories) / yMax,
      value: d.calories,
      date: d.date,
    }));

    ctx.beginPath();
    points.forEach((p, i) => {
      if (i === 0) {
        ctx.moveTo(p.x, p.y);
      } else {
        ctx.lineTo(p.x, p.y);
      }
    });
    ctx.strokeStyle = '#FF6B35';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();

    points.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#FF6B35';
      ctx.fill();
    });

    ctx.fillStyle = '#A0A0B0';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    points.forEach((p) => {
      const parts = p.date.split('-');
      const label = `${parts[1]}/${parts[2]}`;
      ctx.fillText(label, p.x, paddingTop + chartHeight + 10);
    });
  }, [data, width, height]);

  return <canvas ref={canvasRef} style={{ maxWidth: '100%', height: 'auto' }} />;
}
