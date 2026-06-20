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
import type { EmotionTrendPoint } from '../App';

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

interface EmotionTrendChartProps {
  data: EmotionTrendPoint[];
}

export default function EmotionTrendChart({ data }: EmotionTrendChartProps) {
  const chartRef = useRef<ChartJS<'line'>>(null);

  const labels = data.map(
    (d) => `迭代${d.iteration} (${d.date})`,
  );

  const chartData = {
    labels,
    datasets: [
      {
        label: '正面情感',
        data: data.map((d) => d.positive),
        borderColor: '#4caf50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        tension: 0.3,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: '#4caf50',
        pointBorderColor: '#4caf50',
        borderWidth: 2,
        fill: true,
      },
      {
        label: '负面情感',
        data: data.map((d) => d.negative),
        borderColor: '#f44336',
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        tension: 0.3,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: '#f44336',
        pointBorderColor: '#f44336',
        borderWidth: 2,
        fill: true,
      },
      {
        label: '中性情感',
        data: data.map((d) => d.neutral),
        borderColor: '#9e9e9e',
        backgroundColor: 'rgba(158, 158, 158, 0.1)',
        tension: 0.3,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: '#9e9e9e',
        pointBorderColor: '#9e9e9e',
        borderWidth: 2,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 600,
      easing: 'easeOutQuart' as const,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#8892a4',
          font: { size: 12 },
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(22, 33, 62, 0.95)',
        titleColor: '#e0e0e0',
        bodyColor: '#8892a4',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          label: function (context: { dataset: { label: string }; parsed: { y: number } }) {
            return `${context.dataset.label}: ${context.parsed.y}%`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          borderDash: [4, 4],
        },
        ticks: {
          color: '#8892a4',
          font: { size: 11 },
        },
      },
      y: {
        min: 0,
        max: 100,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          borderDash: [4, 4],
        },
        ticks: {
          color: '#8892a4',
          font: { size: 11 },
          callback: function (value: string | number) {
            return `${value}%`;
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  return (
    <div className="chart-container">
      <Line ref={chartRef} data={chartData} options={options} />
    </div>
  );
}
