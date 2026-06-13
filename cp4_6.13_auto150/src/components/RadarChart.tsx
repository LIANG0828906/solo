import React, { useRef, useEffect, useState } from 'react';
import { RadarDataPoint, DimensionType } from '@/types';
import { useStore } from '@/store/useStore';

interface RadarChartProps {
  data: RadarDataPoint[];
  size?: number;
}

const DIMENSION_ORDER: DimensionType[] = ['communication', 'cooperation', 'responsibility', 'innovation', 'knowledge'];
const DIMENSION_LABELS: Record<DimensionType, string> = {
  communication: '沟通',
  cooperation: '合作',
  responsibility: '责任',
  innovation: '创新',
  knowledge: '知识',
};

export function RadarChart({ data, size = 300 }: RadarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredDimension, setHoveredDimension] = useState<DimensionType | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const theme = useStore((state) => state.theme);
  
  const centerX = size / 2;
  const centerY = size / 2;
  const maxRadius = size / 2 - 40;
  
  const getScoreForDimension = (dim: DimensionType): number => {
    const point = data.find((d) => d.dimensionKey === dim);
    return point?.score ?? 3;
  };
  
  const getReviewsForDimension = (dim: DimensionType): { score: number; comment: string }[] => {
    const point = data.find((d) => d.dimensionKey === dim);
    return point?.reviews ?? [];
  };
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    
    ctx.clearRect(0, 0, size, size);
    
    const bgColor = theme === 'dark' ? '#16213e' : '#ffffff';
    const textColor = theme === 'dark' ? '#eeeeee' : '#333333';
    const gridColor = theme === 'dark' ? '#0f3460' : '#e0e0e0';
    
    for (let level = 1; level <= 5; level++) {
      const radius = (maxRadius / 5) * level;
      ctx.beginPath();
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      
      for (let i = 0; i < 5; i++) {
        const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.stroke();
    }
    
    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
      const x = centerX + maxRadius * Math.cos(angle);
      const y = centerY + maxRadius * Math.sin(angle);
      
      ctx.beginPath();
      ctx.strokeStyle = gridColor;
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    
    ctx.beginPath();
    ctx.fillStyle = 'rgba(52, 152, 219, 0.3)';
    ctx.strokeStyle = 'rgba(52, 152, 219, 0.8)';
    ctx.lineWidth = 2;
    
    DIMENSION_ORDER.forEach((dim, i) => {
      const score = getScoreForDimension(dim);
      const radius = (maxRadius / 5) * score;
      const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    DIMENSION_ORDER.forEach((dim, i) => {
      const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
      const x = centerX + (maxRadius + 25) * Math.cos(angle);
      const y = centerY + (maxRadius + 25) * Math.sin(angle);
      
      ctx.font = '14px Inter, sans-serif';
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(DIMENSION_LABELS[dim], x, y);
      
      const score = getScoreForDimension(dim);
      const radius = (maxRadius / 5) * score;
      const pointX = centerX + radius * Math.cos(angle);
      const pointY = centerY + radius * Math.sin(angle);
      
      ctx.beginPath();
      ctx.arc(pointX, pointY, 6, 0, Math.PI * 2);
      ctx.fillStyle = hoveredDimension === dim ? '#e94560' : '#3498db';
      ctx.fill();
    });
  }, [data, size, theme, hoveredDimension]);
  
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    let found: DimensionType | null = null;
    
    DIMENSION_ORDER.forEach((dim, i) => {
      const score = getScoreForDimension(dim);
      const radius = (maxRadius / 5) * score;
      const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
      const pointX = centerX + radius * Math.cos(angle);
      const pointY = centerY + radius * Math.sin(angle);
      
      const distance = Math.sqrt((x - pointX) ** 2 + (y - pointY) ** 2);
      if (distance < 15) {
        found = dim;
        setTooltipPosition({ x: pointX, y: pointY });
      }
    });
    
    setHoveredDimension(found);
  };
  
  const handleMouseLeave = () => {
    setHoveredDimension(null);
  };
  
  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="cursor-pointer"
      />
      {hoveredDimension && (
        <div
          className={`absolute z-10 p-3 rounded-lg shadow-lg ${
            theme === 'dark' ? 'bg-dark-card text-dark-text' : 'bg-light-card text-light-text'
          }`}
          style={{
            left: tooltipPosition.x + 20,
            top: tooltipPosition.y - 10,
            maxWidth: 200,
          }}
        >
          <div className="font-semibold mb-2">{DIMENSION_LABELS[hoveredDimension]}</div>
          <div className="text-sm">
            平均分: {getScoreForDimension(hoveredDimension).toFixed(1)}
          </div>
          <div className="mt-2 text-xs space-y-1">
            {getReviewsForDimension(hoveredDimension).slice(0, 3).map((review, idx) => (
              <div key={idx} className="truncate">
                分数{review.score}: {review.comment.slice(0, 30)}...
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}