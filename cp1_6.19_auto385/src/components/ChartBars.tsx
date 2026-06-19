import { useRef, useEffect } from 'react';
import { useAttendanceStore } from '../store/attendanceStore';
import type { DailyStats } from '../types';

const ChartBars = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { dailyStats } = useAttendanceStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const chartWidth = 320;
    const chartHeight = 200;
    const padding = { top: 30, right: 20, bottom: 40, left: 50 };
    const gap = 8;

    canvas.width = (chartWidth * 2 + 40) * dpr;
    canvas.height = chartHeight * dpr;
    canvas.style.width = `${chartWidth * 2 + 40}px`;
    canvas.style.height = `${chartHeight}px`;
    ctx.scale(dpr, dpr);

    const drawChart = (
      data: DailyStats[],
      startX: number,
      key: 'totalHours' | 'lateCount',
      title: string,
      unit: string
    ) => {
      const maxValue = Math.max(...data.map(d => d[key]), 1);
      const barWidth = (chartWidth - padding.left - padding.right - (data.length - 1) * gap) / data.length;

      ctx.font = '14px -apple-system, sans-serif';
      ctx.fillStyle = '#333';
      ctx.textAlign = 'center';
      ctx.fillText(title, startX + chartWidth / 2, 20);

      ctx.font = '11px -apple-system, sans-serif';
      ctx.fillStyle = '#999';
      ctx.textAlign = 'right';
      for (let i = 0; i <= 4; i++) {
        const value = (maxValue / 4) * i;
        const y = padding.top + (chartHeight - padding.top - padding.bottom) * (1 - i / 4);
        ctx.fillText(Math.round(value).toString(), startX + padding.left - 8, y + 4);
        
        ctx.strokeStyle = '#EEE';
        ctx.beginPath();
        ctx.moveTo(startX + padding.left, y);
        ctx.lineTo(startX + chartWidth - padding.right, y);
        ctx.stroke();
      }

      data.forEach((d, index) => {
        const x = startX + padding.left + index * (barWidth + gap);
        const value = d[key];
        const height = (value / maxValue) * (chartHeight - padding.top - padding.bottom);
        const y = chartHeight - padding.bottom - height;

        const ratio = value / Math.max(maxValue, 1);
        const r = Math.round(33 + ratio * (244 - 33));
        const g = Math.round(150 - ratio * (150 - 67));
        const b = Math.round(243 - ratio * (243 - 54));

        const gradient = ctx.createLinearGradient(x, y, x, y + height);
        gradient.addColorStop(0, `rgb(${r}, ${g}, ${b})`);
        gradient.addColorStop(1, `rgb(${Math.round(r * 0.8)}, ${Math.round(g * 0.8)}, ${Math.round(b * 0.8)})`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, height, 4);
        ctx.fill();

        const date = new Date(d.date);
        const label = `${date.getMonth() + 1}/${date.getDate()}`;
        ctx.font = '11px -apple-system, sans-serif';
        ctx.fillStyle = '#666';
        ctx.textAlign = 'center';
        ctx.fillText(label, x + barWidth / 2, chartHeight - padding.bottom + 16);

        if (value > 0) {
          ctx.fillStyle = '#333';
          ctx.fillText(`${value}${unit}`, x + barWidth / 2, y - 6);
        }
      });
    };

    drawChart(dailyStats, 0, 'totalHours', '每日总工时', 'h');
    drawChart(dailyStats, chartWidth + 40, 'lateCount', '每日迟到次数', '次');
  }, [dailyStats]);

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>数据统计</h3>
      <div style={styles.chartWrapper}>
        <canvas ref={canvasRef} style={styles.canvas} />
      </div>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    marginTop: '20px',
  },
  title: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#333',
    marginBottom: '16px',
  },
  chartWrapper: {
    overflowX: 'auto' as const,
  },
  canvas: {
    display: 'block',
  },
};

export default ChartBars;
