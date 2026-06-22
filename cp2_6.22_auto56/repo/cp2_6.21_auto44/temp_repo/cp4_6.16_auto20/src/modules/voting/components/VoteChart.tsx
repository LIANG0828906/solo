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

const ROAST_COLORS: [number, number, number][] = [
  [210, 180, 140],
  [193, 154, 107],
  [175, 130, 80],
  [155, 110, 65],
  [139, 90, 43],
  [111, 78, 55],
  [90, 60, 38],
  [70, 45, 25],
];

function getRoastColor(index: number, total: number): string {
  const t = total > 1 ? index / (total - 1) : 0.5;
  const segCount = ROAST_COLORS.length - 1;
  const pos = t * segCount;
  const i = Math.min(Math.floor(pos), segCount - 1);
  const frac = pos - i;
  const c1 = ROAST_COLORS[i];
  const c2 = ROAST_COLORS[i + 1];
  const r = Math.round(c1[0] + (c2[0] - c1[0]) * frac);
  const g = Math.round(c1[1] + (c2[1] - c1[1]) * frac);
  const b = Math.round(c1[2] + (c2[2] - c1[2]) * frac);
  return `rgb(${r}, ${g}, ${b})`;
}

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
    const gradientColors = blends.map((_, index) => getRoastColor(index, blends.length));

    if (chartInstanceRef.current) {
      chartInstanceRef.current.data.labels = labels;
      chartInstanceRef.current.data.datasets[0].data = data;
      chartInstanceRef.current.data.datasets[0].backgroundColor = gradientColors;
      chartInstanceRef.current.update();
    } else {
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
    }
  }, [blends]);

  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, []);

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
