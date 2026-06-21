import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import type { MacroRatio } from '@/types';

ChartJS.register(ArcElement, Tooltip, Legend);

interface MacroChartProps {
  ratio: MacroRatio;
}

export default function MacroChart({ ratio }: MacroChartProps) {
  const data = {
    labels: ['蛋白质', '脂肪', '碳水化合物'],
    datasets: [
      {
        data: [ratio.protein, ratio.fat, ratio.carbs],
        backgroundColor: ['#4ecdc4', '#ff6b6b', '#ffe66d'],
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 12,
          },
          color: '#5a6c68',
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `${context.label}: ${context.parsed}%`;
          },
        },
      },
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 800,
    },
  };

  const total = ratio.protein + ratio.fat + ratio.carbs;
  const hasData = total > 0;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
        宏量营养素
      </h3>
      <div style={{ flex: 1, minHeight: '200px', position: 'relative' }}>
        {hasData ? (
          <Doughnut data={data} options={options} />
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
            暂无数据
          </div>
        )}
      </div>
    </div>
  );
}
