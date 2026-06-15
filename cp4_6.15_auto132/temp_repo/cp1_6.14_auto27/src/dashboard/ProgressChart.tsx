import React, { useEffect, useRef, useState } from 'react';

interface ProgressChartProps {
  dates: string[];
  words: number[];
  onDayClick?: (date: string, snippets: string[]) => void;
  getSnippets?: (date: string) => string[];
}

const ProgressChart: React.FC<ProgressChartProps> = ({ dates, words, onDayClick, getSnippets }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const animationRef = useRef<number | null>(null);
  const progressRef = useRef(0);
  const targetWordsRef = useRef<number[]>([]);

  useEffect(() => {
    targetWordsRef.current = [...words];
    progressRef.current = 0;
  }, [words]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const draw = () => {
      if (!ctx || !canvas) return;
      const rect = container.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const chartW = width - padding.left - padding.right;
      const chartH = height - padding.top - padding.bottom;

      ctx.clearRect(0, 0, width, height);

      if (targetWordsRef.current.length === 0) {
        ctx.fillStyle = '#888';
        ctx.font = '13px Noto Sans SC';
        ctx.textAlign = 'center';
        ctx.fillText('暂无数据', width / 2, height / 2);
        return;
      }

      progressRef.current = Math.min(1, progressRef.current + 0.05);
      const animatedWords = targetWordsRef.current.map((w) => w * progressRef.current);

      const maxWords = Math.max(1, ...animatedWords);
      const dataLen = animatedWords.length;

      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartH / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
        const val = Math.round(maxWords - (maxWords / 4) * i);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '11px Noto Sans SC';
        ctx.textAlign = 'right';
        ctx.fillText(val.toString(), padding.left - 8, y + 4);
      }

      const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
      gradient.addColorStop(0, 'rgba(52, 152, 219, 0.4)');
      gradient.addColorStop(1, 'rgba(52, 152, 219, 0)');

      ctx.beginPath();
      ctx.moveTo(padding.left, height - padding.bottom);
      for (let i = 0; i < dataLen; i++) {
        const x = padding.left + (chartW / (dataLen - 1)) * i;
        const y = padding.top + chartH * (1 - animatedWords[i] / maxWords);
        if (i === 0) {
          ctx.lineTo(x, y);
        } else {
          const prevX = padding.left + (chartW / (dataLen - 1)) * (i - 1);
          const prevY = padding.top + chartH * (1 - animatedWords[i - 1] / maxWords);
          const cpx = (prevX + x) / 2;
          ctx.bezierCurveTo(cpx, prevY, cpx, y, x, y);
        }
      }
      ctx.lineTo(width - padding.right, height - padding.bottom);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.beginPath();
      for (let i = 0; i < dataLen; i++) {
        const x = padding.left + (chartW / (dataLen - 1)) * i;
        const y = padding.top + chartH * (1 - animatedWords[i] / maxWords);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          const prevX = padding.left + (chartW / (dataLen - 1)) * (i - 1);
          const prevY = padding.top + chartH * (1 - animatedWords[i - 1] / maxWords);
          const cpx = (prevX + x) / 2;
          ctx.bezierCurveTo(cpx, prevY, cpx, y, x, y);
        }
      }
      ctx.strokeStyle = '#3498DB';
      ctx.lineWidth = 2;
      ctx.stroke();

      for (let i = 0; i < dataLen; i++) {
        const x = padding.left + (chartW / (dataLen - 1)) * i;
        const y = padding.top + chartH * (1 - animatedWords[i] / maxWords);
        const isHovered = hoverIdx === i;
        ctx.beginPath();
        ctx.arc(x, y, isHovered ? 6 : 4, 0, Math.PI * 2);
        ctx.fillStyle = isHovered ? '#E74C3C' : '#3498DB';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '11px Noto Sans SC';
        ctx.textAlign = 'center';
        const label = dates[i]?.slice(5) || '';
        ctx.fillText(label, x, height - 15);

        if (isHovered) {
          const tooltip = `${Math.round(targetWordsRef.current[i])} 字`;
          ctx.font = 'bold 12px Noto Sans SC';
          const tw = ctx.measureText(tooltip).width;
          ctx.fillStyle = 'rgba(44, 62, 80, 0.95)';
          ctx.fillRect(x - tw / 2 - 8, y - 30, tw + 16, 22);
          ctx.fillStyle = '#fff';
          ctx.fillText(tooltip, x, y - 14);
        }
      }

      if (progressRef.current < 1) {
        animationRef.current = requestAnimationFrame(draw);
      }
    };

    draw();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - padding.left;
      if (x < 0 || x > chartW) {
        setHoverIdx(null);
        return;
      }
      const idx = Math.round((x / chartW) * (dataLen - 1));
      setHoverIdx(idx >= 0 && idx < dataLen ? idx : null);
      draw();
    };

    const handleClick = () => {
      if (hoverIdx !== null && dates[hoverIdx]) {
        const snippets = getSnippets?.(dates[hoverIdx]) || [];
        onDayClick?.(dates[hoverIdx], snippets);
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [dates, hoverIdx, onDayClick, getSnippets]);

  return (
    <div ref={containerRef} className="w-full h-64">
      <canvas ref={canvasRef} className="w-full h-full cursor-pointer"></canvas>
    </div>
  );
};

export default ProgressChart;
