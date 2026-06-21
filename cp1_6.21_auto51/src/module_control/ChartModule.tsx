import React, { useEffect, useRef } from 'react';
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
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

export interface ChartData {
  labels: string[];
  values: number[];
}

interface ChartModuleProps {
  data: ChartData | null;
  onClose: () => void;
  isPanelCollapsed: boolean;
}

export function ChartModule({ data, onClose, isPanelCollapsed }: ChartModuleProps) {
  const chartRef = useRef<ChartJS<'line'>>(null);

  useEffect(() => {
    const chart = chartRef.current;
    if (chart) {
      chart.canvas.style.opacity = '0';
      setTimeout(() => {
        if (chart.canvas) {
          chart.canvas.style.transition = 'opacity 0.3s ease';
          chart.canvas.style.opacity = '1';
        }
      }, 50);
    }
  }, [data]);

  if (!data) return null;

  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: '平均温度 (°C)',
        data: data.values,
        borderColor: '#ffffff',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 3,
        pointRadius: 6,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#38bdf8',
        pointBorderWidth: 2,
        pointHoverRadius: 8,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 300,
      easing: 'easeOutQuad' as const,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#38bdf8',
        bodyColor: '#ffffff',
        borderColor: 'rgba(56, 189, 248, 0.3)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context: any) => `温度: ${context.parsed.y.toFixed(1)}°C`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 12,
          font: {
            size: 11,
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          callback: (value: any) => `${value}°C`,
          font: {
            size: 11,
          },
        },
        min: 15,
        max: 45,
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  return (
    <div className={`chart-panel ${isPanelCollapsed ? 'full-width' : ''}`}>
      <button className="chart-close" onClick={onClose}>
        ×
      </button>
      <div className="chart-title">选中区域 24 小时热力变化曲线</div>
      <div style={{ height: 'calc(100% - 30px)', position: 'relative' }}>
        <Line ref={chartRef as any} data={chartData} options={options} />
      </div>
    </div>
  );
}
