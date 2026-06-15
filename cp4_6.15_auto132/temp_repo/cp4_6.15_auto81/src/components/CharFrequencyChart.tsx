import { useRef, useEffect, useState, useCallback } from 'react';
import type { CharFrequency } from '../types';

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  char: string;
  count: number;
  percentage: number;
}

export function CharFrequencyChart({ data }: { data: CharFrequency[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragStartRef = useRef({ x: 0, y: 0 });
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    char: '',
    count: 0,
    percentage: 0
  });
  const displayHeights = useRef<number[]>([]);
  const targetHeights = useRef<number[]>([]);

  const chartConfig = {
    padding: { top: 50, right: 24, bottom: 50, left: 50 },
    barRadius: 6,
    barGapRatio: 0.3
  };

  const getBarGradient = useCallback(function(ctx: CanvasRenderingContext2D, y: number, height: number) {
    const gradient = ctx.createLinearGradient(0, y + height, 0, y);
    gradient.addColorStop(0, '#00d4ff');
    gradient.addColorStop(1, '#a855f7');
    return gradient;
  }, []);

  const drawChart = useCallback(function() {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    const height = 360;
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const padding = chartConfig.padding;
    const barRadius = chartConfig.barRadius;
    const barGapRatio = chartConfig.barGapRatio;
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('字符频率分布', width / 2, 16);

    const maxCount = data.length > 0 ? Math.max.apply(null, data.map(function(d) { return d.count; })) : 1;
    const barCount = data.length;
    const totalBarWidth = barCount > 0 ? chartWidth / barCount : 0;
    const barWidth = totalBarWidth * (1 - barGapRatio);
    const gapWidth = totalBarWidth * barGapRatio;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    const yTickCount = Math.min(5, maxCount);
    for (let i = 0; i <= yTickCount; i++) {
      const y = padding.top + (chartHeight / yTickCount) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      const value = Math.round(maxCount - (maxCount / yTickCount) * i);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(value.toString(), padding.left - 8, y);
    }

    if (displayHeights.current.length !== data.length) {
      displayHeights.current = data.map(function() { return 0; });
    }
    targetHeights.current = data.map(function(d) { return (d.count / maxCount) * chartHeight; });

    let allReached = true;
    for (let i = 0; i < data.length; i++) {
      const target = targetHeights.current[i];
      const current = displayHeights.current[i];
      if (Math.abs(target - current) > 0.5) {
        displayHeights.current[i] = current + (target - current) * 0.2;
        allReached = false;
      } else {
        displayHeights.current[i] = target;
      }
    }

    data.forEach(function(item, index) {
      const x = padding.left + gapWidth / 2 + index * totalBarWidth;
      const barHeight = displayHeights.current[index];
      const y = padding.top + chartHeight - barHeight;

      const gradient = getBarGradient(ctx, y, barHeight);
      ctx.fillStyle = gradient;
      ctx.shadowColor = '#00d4ff';
      ctx.shadowBlur = 8;

      const radius = Math.min(barRadius, barWidth / 2, barHeight);
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + barWidth - radius, y);
      ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
      ctx.lineTo(x + barWidth, y + barHeight);
      ctx.lineTo(x, y + barHeight);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fill();

      ctx.shadowBlur = 0;

      const displayChar = item.char === ' ' ? '空格' : item.char;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(displayChar, x + barWidth / 2, y + barHeight + 8);
    });

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.save();
    ctx.translate(padding.left - 30, padding.top + chartHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('出现次数', 0, 0);
    ctx.restore();

    if (!allReached) {
      animationRef.current = requestAnimationFrame(drawChart);
    }
  }, [data, getBarGradient]);

  useEffect(function() {
    animationRef.current = requestAnimationFrame(drawChart);
    return function() {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [drawChart]);

  useEffect(function() {
    const handleResize = function() {
      displayHeights.current = [];
      drawChart();
    };
    window.addEventListener('resize', handleResize);
    return function() { return window.removeEventListener('resize', handleResize); };
  }, [drawChart]);

  const handleMouseMove = function(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const padding = chartConfig.padding;
    const barGapRatio = chartConfig.barGapRatio;
    const chartWidth = canvas.clientWidth - padding.left - padding.right;
    const chartHeight = 360 - padding.top - padding.bottom;
    const barCount = data.length;
    const totalBarWidth = barCount > 0 ? chartWidth / barCount : 0;
    const barWidth = totalBarWidth * (1 - barGapRatio);
    const gapWidth = totalBarWidth * barGapRatio;

    let hoveredIndex = -1;
    for (let i = 0; i < data.length; i++) {
      const barX = padding.left + gapWidth / 2 + i * totalBarWidth;
      if (mouseX >= barX && mouseX <= barX + barWidth) {
        const barHeight = targetHeights.current[i];
        const barY = padding.top + chartHeight - barHeight;
        if (mouseY >= barY && mouseY <= padding.top + chartHeight) {
          hoveredIndex = i;
          break;
        }
      }
    }

    if (hoveredIndex >= 0) {
      const item = data[hoveredIndex];
      setTooltip({
        visible: true,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        char: item.char === ' ' ? '空格' : item.char,
        count: item.count,
        percentage: item.percentage
      });
      canvas.style.cursor = 'pointer';
    } else {
      setTooltip(function(prev) { return { ...prev, visible: false }; });
      canvas.style.cursor = 'default';
    }
  };

  const handleMouseLeave = function() {
    setTooltip(function(prev) { return { ...prev, visible: false }; });
  };

  const handleMouseDown = function(e: React.MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.closest('.chart-drag-handle')) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y
      };
    }
  };

  const handleMouseMoveDrag = function(e: React.MouseEvent) {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleMouseUp = function() {
    setIsDragging(false);
  };

  return (
    <div
      className={isDragging ? 'chart-card dragging' : 'chart-card'}
      style={{ transform: 'translate(' + position.x + 'px, ' + position.y + 'px)' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMoveDrag}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      ref={containerRef}
    >
      <div className="chart-drag-handle">
        <span className="drag-dots"></span>
        <span className="drag-dots"></span>
        <span className="drag-dots"></span>
      </div>
      <div className="chart-container">
        {data.length > 0 ? (
          <div style={{ position: 'relative', width: '100%', height: '360px' }}>
            <canvas
              ref={canvasRef}
              style={{ display: 'block' }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />
            {tooltip.visible && (
              <div
                className="chart-tooltip"
                style={{
                  left: tooltip.x + 12,
                  top: tooltip.y - 10,
                  transform: tooltip.x > 200 ? 'translateX(-110%)' : 'none'
                }}
              >
                <div className="tooltip-title">字符: &quot;{tooltip.char}&quot;</div>
                <div className="tooltip-body">
                  <span>出现次数: {tooltip.count}</span>
                  <span>占比: {tooltip.percentage}%</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="chart-empty">
            <p>输入密码后显示字符频率分布</p>
          </div>
        )}
      </div>
    </div>
  );
}
