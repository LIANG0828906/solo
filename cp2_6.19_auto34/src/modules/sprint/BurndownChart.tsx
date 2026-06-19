import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import type { TooltipItem } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useAppStore } from '@/store/useAppStore';
import type { BurndownPoint } from '@/types';
import styles from './sprint.module.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface BurndownChartProps {
  sprintId: string;
}

export function BurndownChart({ sprintId }: BurndownChartProps) {
  const getBurndownData = useAppStore((state) => state.getBurndownData);

  const burndownData = useMemo(
    () => getBurndownData(sprintId),
    [sprintId, getBurndownData]
  );

  const chartData = useMemo(() => {
    return {
      labels: burndownData.map((point: BurndownPoint) => point.date),
      datasets: [
        {
          label: '理想线',
          data: burndownData.map((point: BurndownPoint) => point.ideal),
          borderColor: '#666',
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0,
        },
        {
          label: '实际线',
          data: burndownData.map((point: BurndownPoint) => point.actual),
          borderColor: '#e94560',
          backgroundColor: 'rgba(233, 69, 96, 0.1)',
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: '#e94560',
          pointHoverRadius: 6,
          tension: 0.3,
          fill: true,
        },
      ],
    };
  }, [burndownData]);

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
          position: 'top' as const,
          labels: {
            color: '#aaa',
            usePointStyle: true,
            padding: 20,
            font: {
              size: 12,
            },
          },
        },
        tooltip: {
          backgroundColor: 'rgba(26, 26, 46, 0.95)',
          titleColor: '#eaeaea',
          bodyColor: '#aaa',
          borderColor: '#2a2a4a',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            title: (context: TooltipItem<'line'>[]) => {
              return `日期: ${context[0].label}`;
            },
            label: (context: TooltipItem<'line'>) => {
              const value = context.parsed.y ?? 0;
              return `${context.dataset.label}: ${value.toFixed(1)} 小时`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(42, 42, 74, 0.5)',
          },
          ticks: {
            color: '#888',
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 10,
            font: {
              size: 11,
            },
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(42, 42, 74, 0.5)',
          },
          ticks: {
            color: '#888',
            font: {
              size: 11,
            },
            callback: function (value: string | number) {
              return value + 'h';
            },
          },
          title: {
            display: true,
            text: '剩余工时',
            color: '#aaa',
            font: {
              size: 12,
              weight: 'normal' as const,
            },
          },
        },
      },
    }),
    []
  );

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartTitle}>燃尽图</div>
      <div className={styles.chartWrapper}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}

export default BurndownChart;
