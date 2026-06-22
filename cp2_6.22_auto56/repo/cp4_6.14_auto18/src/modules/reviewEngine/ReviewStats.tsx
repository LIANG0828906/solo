import { useState, useEffect, useRef, useCallback } from 'react';
import type { ReviewStats as ReviewStatsType } from '../../types';
import { api } from '../../utils/api';
import './ReviewStats.css';

function ReviewStats() {
  const [stats, setStats] = useState<ReviewStatsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const lineCanvasRef = useRef<HTMLCanvasElement>(null);
  const barCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    loadStats();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const drawLineChart = useCallback((canvas: HTMLCanvasElement, data: { date: string; count: number }[], progress: number) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 30, right: 20, bottom: 40, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, height);

    if (data.length === 0) return;

    const maxCount = Math.max(...data.map(d => d.count), 1);
    const xStep = chartWidth / (data.length - 1);

    ctx.strokeStyle = 'rgba(139, 157, 163, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      ctx.fillStyle = 'rgba(44, 44, 44, 0.6)';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      const value = Math.round((maxCount / 4) * (4 - i));
      ctx.fillText(String(value), padding.left - 8, y + 4);
    }

    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, 'rgba(139, 157, 163, 0.4)');
    gradient.addColorStop(1, 'rgba(139, 157, 163, 0.05)');

    const animatedPoints = data.map((d, i) => ({
      x: padding.left + xStep * i,
      y: padding.top + chartHeight - (chartHeight * (d.count / maxCount)) * progress
    }));

    ctx.beginPath();
    ctx.moveTo(animatedPoints[0].x, height - padding.bottom);
    animatedPoints.forEach(point => {
      ctx.lineTo(point.x, point.y);
    });
    ctx.lineTo(animatedPoints[animatedPoints.length - 1].x, height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = '#8b9da3';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    animatedPoints.forEach((point, i) => {
      if (i === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.stroke();

    animatedPoints.forEach((point, i) => {
      if (data[i].count > 0) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#8b9da3';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    ctx.fillStyle = 'rgba(44, 44, 44, 0.7)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    data.forEach((d, i) => {
      const x = padding.left + xStep * i;
      const date = new Date(d.date);
      const label = `${date.getMonth() + 1}/${date.getDate()}`;
      ctx.fillText(label, x, height - padding.bottom + 20);
    });

    ctx.fillStyle = '#8b9da3';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('过去7天复习数量', width / 2, 18);
  }, []);

  const drawBarChart = useCallback((canvas: HTMLCanvasElement, data: { date: string; count: number }[], progress: number) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 30, right: 20, bottom: 40, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, height);

    if (data.length === 0) return;

    const maxCount = Math.max(...data.map(d => d.count), 1);
    const barWidth = (chartWidth / data.length) * 0.6;
    const gap = (chartWidth / data.length) * 0.4;

    ctx.strokeStyle = 'rgba(196, 167, 125, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }

    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, 'rgba(196, 167, 125, 0.9)');
    gradient.addColorStop(1, 'rgba(196, 167, 125, 0.5)');

    data.forEach((d, i) => {
      const x = padding.left + (barWidth + gap) * i + gap / 2;
      const barHeight = (chartHeight * (d.count / maxCount)) * progress;
      const y = height - padding.bottom - barHeight;

      ctx.fillStyle = gradient;
      ctx.beginPath();
      const radius = 4;
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + barWidth - radius, y);
      ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
      ctx.lineTo(x + barWidth, height - padding.bottom);
      ctx.lineTo(x, height - padding.bottom);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fill();

      if (d.count > 0) {
        ctx.fillStyle = '#2c2c2c';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(d.count), x + barWidth / 2, y - 6);
      }

      ctx.fillStyle = 'rgba(44, 44, 44, 0.7)';
      ctx.font = '10px sans-serif';
      const date = new Date(d.date);
      const label = `${date.getMonth() + 1}/${date.getDate()}`;
      ctx.fillText(label, x + barWidth / 2, height - padding.bottom + 20);
    });

    ctx.fillStyle = '#c4a77d';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('每日复习分布', width / 2, 18);
  }, []);

  useEffect(() => {
    if (!stats || !lineCanvasRef.current || !barCanvasRef.current) return;

    const startTime = performance.now();
    const duration = 1000;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      if (lineCanvasRef.current) {
        drawLineChart(lineCanvasRef.current, stats.dailyReviewCounts, easeProgress);
      }
      if (barCanvasRef.current) {
        drawBarChart(barCanvasRef.current, stats.dailyReviewCounts, easeProgress);
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    const handleResize = () => {
      if (lineCanvasRef.current && barCanvasRef.current) {
        drawLineChart(lineCanvasRef.current, stats.dailyReviewCounts, 1);
        drawBarChart(barCanvasRef.current, stats.dailyReviewCounts, 1);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [stats, drawLineChart, drawBarChart]);

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  return (
    <div className="page-container stats-page">
      <h2 className="section-title">学习统计</h2>

      <div className="stats-cards">
        <div className="stat-card glass-card">
          <div className="stat-icon">📅</div>
          <div className="stat-value">{stats?.todayReviewed || 0}</div>
          <div className="stat-label">今日已复习</div>
        </div>
        <div className="stat-card glass-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-value">{stats?.averageRecallScore.toFixed(1) || '0.0'}</div>
          <div className="stat-label">平均回忆评分</div>
        </div>
        <div className="stat-card glass-card">
          <div className="stat-icon">⏰</div>
          <div className="stat-value">{stats?.dueCardsCount || 0}</div>
          <div className="stat-label">到期卡片</div>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-wrapper glass-card">
          <canvas ref={lineCanvasRef} className="chart-canvas" />
        </div>
        <div className="chart-wrapper glass-card">
          <canvas ref={barCanvasRef} className="chart-canvas" />
        </div>
      </div>
    </div>
  );
}

export default ReviewStats;
