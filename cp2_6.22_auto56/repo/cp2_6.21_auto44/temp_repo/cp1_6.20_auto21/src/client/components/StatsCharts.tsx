import React, { useEffect, useRef, useState } from 'react';
import { Stats } from '../types';
import './StatsCharts.css';

interface StatsChartsProps {
  stats: Stats;
}

const statusColors: Record<string, string> = {
  pending: '#95A5A6',
  processing: '#3498DB',
  completed: '#27AE60',
  failed: '#E74C3C'
};

const statusLabels: Record<string, string> = {
  pending: '待处理',
  processing: '处理中',
  completed: '已完成',
  failed: '无法修复'
};

const priorityColors: Record<string, string> = {
  high: '#E74C3C',
  medium: '#F1C40F',
  low: '#27AE60'
};

const priorityLabels: Record<string, string> = {
  high: '高优先级',
  medium: '中优先级',
  low: '低优先级'
};

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export default function StatsCharts({ stats }: StatsChartsProps) {
  const donutCanvasRef = useRef<HTMLCanvasElement>(null);
  const barCanvasRef = useRef<HTMLCanvasElement>(null);
  const lineCanvasRef = useRef<HTMLCanvasElement>(null);
  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    setAnimationProgress(0);
    let startTime: number | null = null;
    const duration = 1000;

    function animate(currentTime: number) {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setAnimationProgress(easeOutCubic(progress));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [stats]);

  useEffect(() => {
    drawDonutChart();
    drawBarChart();
    drawLineChart();
  }, [stats, animationProgress]);

  const drawDonutChart = () => {
    const canvas = donutCanvasRef.current;
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
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;
    const innerRadius = radius * 0.6;

    ctx.clearRect(0, 0, width, height);

    const total = Object.values(stats.statusCounts).reduce((a, b) => a + b, 0);
    if (total === 0) {
      ctx.fillStyle = '#F0F0F0';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2, true);
      ctx.fill();
      return;
    }

    let startAngle = -Math.PI / 2;
    const animatedTotal = total * animationProgress;

    Object.entries(stats.statusCounts).forEach(([status, count]) => {
      const sliceAngle = (count / total) * Math.PI * 2 * animationProgress;
      
      const gradient = ctx.createRadialGradient(centerX, centerY, innerRadius, centerX, centerY, radius);
      gradient.addColorStop(0, statusColors[status]);
      gradient.addColorStop(1, adjustColor(statusColors[status], -20));
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.arc(centerX, centerY, innerRadius, startAngle + sliceAngle, startAngle, true);
      ctx.closePath();
      ctx.fill();

      const midAngle = startAngle + sliceAngle / 2;
      const labelRadius = (radius + innerRadius) / 2;
      const labelX = centerX + Math.cos(midAngle) * labelRadius;
      const labelY = centerY + Math.sin(midAngle) * labelRadius;
      
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const displayCount = Math.min(count, Math.round(animatedTotal * (count / total)));
      if (displayCount > 0) {
        ctx.fillText(displayCount.toString(), labelX, labelY);
      }

      startAngle += sliceAngle;
    });

    ctx.fillStyle = '#1B2838';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(Math.round(animatedTotal).toString(), centerX, centerY - 8);
    
    ctx.fillStyle = '#888';
    ctx.font = '12px sans-serif';
    ctx.fillText('总工单', centerX, centerY + 12);
  };

  const drawBarChart = () => {
    const canvas = barCanvasRef.current;
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
    const padding = { top: 20, right: 20, bottom: 40, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, height);

    const priorities = ['high', 'medium', 'low'];
    const values = priorities.map(p => stats.priorityCounts[p]);
    const maxValue = Math.max(...values, 1);
    const barWidth = (chartWidth / priorities.length) * 0.6;
    const gap = (chartWidth / priorities.length) * 0.4;

    ctx.strokeStyle = '#E0E0E0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      
      ctx.fillStyle = '#999';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      const labelValue = Math.round(maxValue - (maxValue / 4) * i);
      ctx.fillText(labelValue.toString(), padding.left - 8, y);
    }

    priorities.forEach((priority, index) => {
      const animatedValue = values[index] * animationProgress;
      const barHeight = (animatedValue / maxValue) * chartHeight;
      const x = padding.left + index * (barWidth + gap) + gap / 2;
      const y = padding.top + chartHeight - barHeight;

      const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
      gradient.addColorStop(0, adjustColor(priorityColors[priority], 20));
      gradient.addColorStop(1, priorityColors[priority]);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 6);
      ctx.fill();

      ctx.fillStyle = '#1B2838';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(priorityLabels[priority], x + barWidth / 2, height - padding.bottom + 20);

      if (animatedValue > 0) {
        ctx.fillStyle = '#1B2838';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(Math.round(animatedValue).toString(), x + barWidth / 2, y - 8);
      }
    });
  };

  const drawLineChart = () => {
    const canvas = lineCanvasRef.current;
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
    const padding = { top: 20, right: 20, bottom: 40, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, height);

    const sortedDates = Object.keys(stats.dailyCounts).sort();
    const last7Dates = sortedDates.slice(-7);
    const values = last7Dates.map(d => stats.dailyCounts[d]);
    const maxValue = Math.max(...values, 1);

    if (last7Dates.length === 0) {
      ctx.fillStyle = '#999';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('暂无数据', width / 2, height / 2);
      return;
    }

    ctx.strokeStyle = '#E0E0E0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      
      ctx.fillStyle = '#999';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      const labelValue = Math.round(maxValue - (maxValue / 4) * i);
      ctx.fillText(labelValue.toString(), padding.left - 8, y);
    }

    const pointSpacing = last7Dates.length > 1 ? chartWidth / (last7Dates.length - 1) : 0;

    const points: { x: number; y: number }[] = [];
    last7Dates.forEach((_, index) => {
      const animatedValue = values[index] * animationProgress;
      const x = padding.left + index * pointSpacing;
      const y = padding.top + chartHeight - (animatedValue / maxValue) * chartHeight;
      points.push({ x, y });
    });

    if (points.length > 1) {
      const areaGradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
      areaGradient.addColorStop(0, 'rgba(255, 127, 80, 0.3)');
      areaGradient.addColorStop(1, 'rgba(255, 127, 80, 0)');
      
      ctx.fillStyle = areaGradient;
      ctx.beginPath();
      ctx.moveTo(points[0].x, padding.top + chartHeight);
      points.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.lineTo(points[points.length - 1].x, padding.top + chartHeight);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#FF7F50';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    }

    points.forEach((p, index) => {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = '#FF7F50';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.stroke();

      if (values[index] > 0) {
        ctx.fillStyle = '#1B2838';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(Math.round(values[index] * animationProgress).toString(), p.x, p.y - 12);
      }

      ctx.fillStyle = '#666';
      ctx.font = '10px sans-serif';
      ctx.fillText(last7Dates[index].slice(5), p.x, height - padding.bottom + 20);
    });
  };

  function adjustColor(color: string, amount: number): string {
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.slice(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.slice(2, 4), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.slice(4, 6), 16) + amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  return (
    <div className="stats-charts">
      <div className="chart-card">
        <h3 className="chart-title">状态分布</h3>
        <canvas ref={donutCanvasRef} className="chart-canvas donut-chart" />
        <div className="chart-legend">
          {Object.entries(stats.statusCounts).map(([status, count]) => (
            <div key={status} className="legend-item">
              <span className="legend-color" style={{ backgroundColor: statusColors[status] }} />
              <span className="legend-label">{statusLabels[status]}</span>
              <span className="legend-value">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="chart-card">
        <h3 className="chart-title">优先级分布</h3>
        <canvas ref={barCanvasRef} className="chart-canvas bar-chart" />
      </div>

      <div className="chart-card full-width">
        <h3 className="chart-title">近7日提交趋势</h3>
        <canvas ref={lineCanvasRef} className="chart-canvas line-chart" />
      </div>
    </div>
  );
}
