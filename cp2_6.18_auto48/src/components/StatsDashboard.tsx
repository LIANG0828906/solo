import React, { useEffect, useRef } from 'react';
import type { DonationItem } from '../utils/dataManager';
import {
  calculateSummary,
  calculateDailyTrend,
  calculateCategoryDistribution,
} from '../utils/statsCalculator';

interface StatsDashboardProps {
  items: DonationItem[];
}

const categoryColors: Record<string, string> = {
  '书籍': '#10B981',
  '衣物': '#34D399',
  '文具': '#059669',
  '玩具': '#6EE7B7',
  '其他': '#A7F3D0',
};

const StatsDashboard: React.FC<StatsDashboardProps> = ({ items }) => {
  const lineCanvasRef = useRef<HTMLCanvasElement>(null);
  const pieCanvasRef = useRef<HTMLCanvasElement>(null);

  const summary = calculateSummary(items);
  const trendData = calculateDailyTrend(items, 30);
  const categoryData = calculateCategoryDistribution(items);

  useEffect(() => {
    drawLineChart();
  }, [items]);

  useEffect(() => {
    drawPieChart();
  }, [items]);

  const drawLineChart = () => {
    const canvas = lineCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const padding = { top: 30, right: 30, bottom: 50, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const maxCount = Math.max(...trendData.map((d) => d.count), 1);

    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      const value = Math.round(maxCount - (maxCount / 4) * i);
      ctx.fillStyle = '#6B7280';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(String(value), padding.left - 8, y + 4);
    }

    const stepX = chartWidth / (trendData.length - 1);
    ctx.beginPath();
    trendData.forEach((point, index) => {
      const x = padding.left + stepX * index;
      const y = padding.top + chartHeight - (point.count / maxCount) * chartHeight;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 2;
    ctx.stroke();

    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.2)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
    ctx.beginPath();
    trendData.forEach((point, index) => {
      const x = padding.left + stepX * index;
      const y = padding.top + chartHeight - (point.count / maxCount) * chartHeight;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.lineTo(width - padding.right, padding.top + chartHeight);
    ctx.lineTo(padding.left, padding.top + chartHeight);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    trendData.forEach((point, index) => {
      if (index % 5 === 0 || index === trendData.length - 1) {
        const x = padding.left + stepX * index;
        ctx.fillStyle = '#6B7280';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        const dateParts = point.date.split('-');
        const dateLabel = dateParts.length >= 3
          ? `${dateParts[1]}-${dateParts[2]}`
          : point.date.slice(5);
        ctx.fillText(dateLabel, x, height - padding.bottom + 20);
      }
    });
  };

  const drawPieChart = () => {
    const canvas = pieCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const total = categoryData.reduce((sum, d) => sum + d.count, 0);
    if (total === 0) {
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('暂无数据', width / 2, height / 2);
      return;
    }

    const centerX = width / 2 - 60;
    const centerY = height / 2;
    const radius = Math.min(width / 2, height / 2) - 40;

    let startAngle = -Math.PI / 2;
    categoryData.forEach((data) => {
      if (data.count === 0) return;
      const sliceAngle = (data.count / total) * Math.PI * 2;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = categoryColors[data.category];
      ctx.fill();

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      startAngle = endAngle;
    });

    const legendX = width - 130;
    let legendY = 40;
    categoryData.forEach((data) => {
      ctx.fillStyle = categoryColors[data.category];
      ctx.fillRect(legendX, legendY, 14, 14);

      ctx.fillStyle = '#374151';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${data.category} ${data.percentage}%`, legendX + 22, legendY + 11);
      legendY += 24;
    });
  };

  return (
    <div style={{ padding: '24px 0' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#065F46', margin: '0 0 24px 0' }}>
        捐赠统计看板
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #D1D5DB',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>捐赠总物品数</div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#10B981' }}>{summary.totalItems}</div>
        </div>

        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #D1D5DB',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>累计认领数</div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#3B82F6' }}>{summary.totalClaimed}</div>
        </div>

        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #D1D5DB',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>认领完成率</div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#F59E0B' }}>{summary.claimRate}%</div>
        </div>

        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #D1D5DB',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>已完成捐赠</div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#10B981' }}>{summary.totalCompleted}</div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '24px',
        }}
      >
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #D1D5DB',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', margin: '0 0 16px 0' }}>
            近30天每日新增捐赠
          </h3>
          <canvas ref={lineCanvasRef} style={{ width: '100%', height: '280px' }} />
        </div>

        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #D1D5DB',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', margin: '0 0 16px 0' }}>
            分类分布占比
          </h3>
          <canvas ref={pieCanvasRef} style={{ width: '100%', height: '280px' }} />
        </div>
      </div>
    </div>
  );
};

export default StatsDashboard;
