import { useEffect, useRef } from 'react';
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  BarController,
} from 'chart.js';
import type { BlendWithVotes } from '@/shared/types';
import './VoteChart.css';

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, BarController);

interface VoteChartProps {
  blends: BlendWithVotes[];
  totalVoters: number;
}

export function VoteChart({ blends, totalVoters }: VoteChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    const labels = blends.map((blend) => blend.name);
    const data = blends.map((blend) => blend.voteCount);

    const gradientColors = blends.map((_, index) => {
      const ratio = blends.length > 1 ? index / (blends.length - 1) : 0.5;
      const r = Math.round(212 - (212 - 111) * ratio);
      const g = Math.round(184 - (184 - 78) * ratio);
      const b = Math.round(150 - (150 - 55) * ratio);
      return `rgb(${r}, ${g}, ${b})`;
    });

    if (chartInstanceRef.current) {
      chartInstanceRef.current.data.labels = labels;
      chartInstanceRef.current.data.datasets[0].data = data;
      chartInstanceRef.current.data.datasets[0].backgroundColor = gradientColors;
      chartInstanceRef.current.update();
      return;
    }

    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: '票数',
            data,
            backgroundColor: gradientColors,
            borderRadius: 8,
            borderSkipped: false,
            barThickness: 'flex',
            maxBarThickness: 48,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 300,
          easing: 'easeOutQuart',
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: 'rgba(111, 78, 55, 0.9)',
            titleFont: {
              family: "'Segoe UI', 'PingFang SC', sans-serif",
              size: 13,
            },
            bodyFont: {
              family: "'Segoe UI', 'PingFang SC', sans-serif",
              size: 12,
            },
            padding: 10,
            cornerRadius: 8,
            displayColors: false,
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: '#8B7355',
              font: {
                family: "'Segoe UI', 'PingFang SC', sans-serif",
                size: 12,
              },
              maxRotation: 45,
              minRotation: 0,
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(111, 78, 55, 0.1)',
            },
            ticks: {
              color: '#8B7355',
              font: {
                family: "'Segoe UI', 'PingFang SC', sans-serif",
                size: 12,
              },
              stepSize: 1,
              precision: 0,
            },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [blends]);

  return (
    <div className="vote-chart-card card">
      <div className="vote-chart-header">
        <h3 className="vote-chart-title">实时投票结果</h3>
        <div className="vote-chart-stats">
          <span className="stats-label">总参与人数</span>
          <span className="stats-value">{totalVoters}</span>
        </div>
      </div>
      <div className="vote-chart-container">
        <canvas ref={chartRef} />
      </div>
    </div>
  );
}
