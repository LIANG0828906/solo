import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import type { DailySummary } from '@/types';
import { useMemo } from 'react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface LineChartProps {
  data: DailySummary[];
  recommendedMin: number;
  recommendedMax: number;
}

export default function LineChart({
  data,
  recommendedMin,
  recommendedMax,
}: LineChartProps) {
  const chartData = useMemo(() => {
    const labels = data.map((d) => {
      const date = new Date(d.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });
    const calories = data.map((d) => d.totalCalories);

    return {
      labels,
      datasets: [
        {
          label: '推荐范围上限',
          data: data.map(() => recommendedMax),
          borderColor: 'transparent',
          backgroundColor: 'rgba(76, 175, 80, 0.15)',
          fill: '+1',
          pointRadius: 0,
          order: 3,
        },
        {
          label: '推荐范围下限',
          data: data.map(() => recommendedMin),
          borderColor: 'transparent',
          backgroundColor: 'rgba(76, 175, 80, 0.15)',
          fill: false,
          pointRadius: 0,
          order: 4,
        },
        {
          label: '热量摄入',
          data: calories,
          borderColor: '#4ecdc4',
          backgroundColor: (context: any) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 250);
            gradient.addColorStop(0, 'rgba(78, 205, 196, 0.3)');
            gradient.addColorStop(1, 'rgba(78, 205, 196, 0.02)');
            return gradient;
          },
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: 'white',
          pointBorderColor: '#4ecdc4',
          pointBorderWidth: 2,
          pointHoverRadius: 6,
          order: 1,
        },
      ],
    };
  }, [data, recommendedMin, recommendedMax]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index' as const,
        intersect: false,
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: 'rgba(26, 46, 42, 0.9)',
          titleColor: 'white',
          bodyColor: 'rgba(255,255,255,0.8)',
          padding: 12,
          borderRadius: 8,
          titleFont: {
            size: 13,
            weight: 600,
          },
          bodyFont: {
            size: 12,
          },
          callbacks: {
            label: (context: any) => {
              if (context.datasetIndex === 2) {
                return `摄入: ${context.parsed.y.toFixed(0)} kcal`;
              }
              return null;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(78, 205, 196, 0.08)',
          },
          ticks: {
            color: '#888',
            font: {
              size: 11,
            },
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(78, 205, 196, 0.08)',
          },
          ticks: {
            color: '#888',
            font: {
              size: 11,
            },
            callback: (value: any) => `${value} kcal`,
          },
        },
      },
      animation: {
        duration: 1000,
        easing: 'easeOutQuart' as const,
      },
    }),
    []
  );

  const hasData = data.some((d) => d.totalCalories > 0);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
          30天热量趋势
        </h3>
        <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '2px',
                background: 'rgba(76, 175, 80, 0.25)',
                border: '1px solid #4caf50',
              }}
            />
            推荐范围
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: '12px',
                height: '3px',
                background: '#4ecdc4',
                borderRadius: '2px',
              }}
            />
            实际摄入
          </span>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: '280px' }}>
        {hasData ? (
          <Line data={chartData} options={options} />
        ) : (
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              fontSize: '14px',
            }}
          >
            暂无历史数据
          </div>
        )}
      </div>
    </div>
  );
}
