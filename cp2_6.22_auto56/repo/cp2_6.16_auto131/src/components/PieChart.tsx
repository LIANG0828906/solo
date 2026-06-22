import { useRef, useEffect, useState } from 'react';

interface PieDataItem {
  label: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieDataItem[];
  width?: number;
  height?: number;
  title?: string;
}

export default function PieChart({
  data,
  width = 300,
  height = 300,
  title,
}: PieChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;

    ctx.clearRect(0, 0, width, height);

    const total = data.reduce((sum, item) => sum + item.value, 0);

    if (total === 0) {
      ctx.fillStyle = '#e0e0e0';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#999';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('暂无数据', centerX, centerY);
      return;
    }

    let startAngle = -Math.PI / 2;

    data.forEach((item, index) => {
      const sliceAngle = (item.value / total) * Math.PI * 2;
      const endAngle = startAngle + sliceAngle;

      const isHovered = hoveredIndex === index;
      const currentRadius = isHovered ? radius + 5 : radius;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, currentRadius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = item.color;
      ctx.fill();

      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      startAngle = endAngle;
    });

    const innerRadius = radius * 0.6;
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();

    ctx.fillStyle = '#333';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(total.toString(), centerX, centerY - 8);
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#999';
    ctx.fillText('任务总数', centerX, centerY + 12);
  }, [data, width, height, hoveredIndex]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - width / 2;
    const y = e.clientY - rect.top - height / 2;

    const distance = Math.sqrt(x * x + y * y);
    const radius = Math.min(width, height) / 2 - 20;

    if (distance < radius && distance > radius * 0.6) {
      let angle = Math.atan2(y, x) + Math.PI / 2;
      if (angle < 0) angle += Math.PI * 2;

      const total = data.reduce((sum, item) => sum + item.value, 0);
      let cumulativeAngle = 0;

      for (let i = 0; i < data.length; i++) {
        const sliceAngle = (data[i].value / total) * Math.PI * 2;
        if (angle >= cumulativeAngle && angle < cumulativeAngle + sliceAngle) {
          setHoveredIndex(i);
          return;
        }
        cumulativeAngle += sliceAngle;
      }
    }
    setHoveredIndex(null);
  };

  return (
    <div className="flex flex-col items-center">
      {title && <h3 className="text-lg font-semibold mb-4 text-gray-800">{title}</h3>}
      <canvas
        ref={canvasRef}
        style={{ width, height, cursor: 'pointer' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredIndex(null)}
      />
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {data.map((item, index) => (
          <div
            key={item.label}
            className={`flex items-center gap-2 text-sm ${
              hoveredIndex === index ? 'font-semibold' : ''
            }`}
          >
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-gray-600">{item.label}</span>
            <span className="font-medium text-gray-800">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
