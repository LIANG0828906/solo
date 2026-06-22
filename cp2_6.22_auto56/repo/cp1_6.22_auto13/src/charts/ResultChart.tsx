import React, { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { Vote } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ResultChartProps {
  vote: Vote;
}

const CHART_COLORS = [
  'rgba(74, 144, 217, 0.8)',
  'rgba(255, 140, 66, 0.8)',
  'rgba(82, 196, 26, 0.8)',
  'rgba(155, 89, 182, 0.8)',
  'rgba(241, 196, 15, 0.8)',
  'rgba(231, 76, 60, 0.8)',
  'rgba(26, 188, 156, 0.8)',
  'rgba(52, 152, 219, 0.8)',
  'rgba(230, 126, 34, 0.8)',
  'rgba(149, 165, 166, 0.8)'
];

const CHART_BORDER_COLORS = [
  'rgba(74, 144, 217, 1)',
  'rgba(255, 140, 66, 1)',
  'rgba(82, 196, 26, 1)',
  'rgba(155, 89, 182, 1)',
  'rgba(241, 196, 15, 1)',
  'rgba(231, 76, 60, 1)',
  'rgba(26, 188, 156, 1)',
  'rgba(52, 152, 219, 1)',
  'rgba(230, 126, 34, 1)',
  'rgba(149, 165, 166, 1)'
];

const ResultChart: React.FC<ResultChartProps> = ({ vote }) => {
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
  const chartRef = useRef<HTMLDivElement>(null);

  const isRating = vote.type === 'rating';

  const labels = isRating
    ? (vote.ratingResults?.map(r => `${r.rating}星`) || [])
    : vote.options.map(o => o.text);

  const data = isRating
    ? (vote.ratingResults?.map(r => r.count) || [])
    : vote.results.map(r => r.count);

  const backgroundColors = isRating
    ? vote.ratingResults?.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]) || []
    : vote.options.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);

  const borderColors = isRating
    ? vote.ratingResults?.map((_, i) => CHART_BORDER_COLORS[i % CHART_BORDER_COLORS.length]) || []
    : vote.options.map((_, i) => CHART_BORDER_COLORS[i % CHART_BORDER_COLORS.length]);

  const barChartData: ChartData<'bar'> = {
    labels,
    datasets: [
      {
        label: '票数',
        data,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      }
    ]
  };

  const pieChartData: ChartData<'pie'> = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: backgroundColors,
        borderColor: '#ffffff',
        borderWidth: 3,
        hoverOffset: 8,
      }
    ]
  };

  const barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 500,
      easing: 'easeOutQuart'
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(30, 58, 95, 0.9)',
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            const total = data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((context.raw as number) / total * 100).toFixed(1) : 0;
            return ` ${context.raw} 票 (${percentage}%)`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: { size: 12 },
          color: '#5a6b7e'
        },
        grid: {
          color: 'rgba(197, 208, 222, 0.4)'
        },
        border: {
          display: false
        }
      },
      x: {
        ticks: {
          font: { size: 12 },
          color: '#5a6b7e'
        },
        grid: {
          display: false
        },
        border: {
          display: false
        }
      }
    }
  };

  const pieOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 600,
      easing: 'easeOutQuart'
    },
    plugins: {
      legend: {
        position: 'right',
        labels: {
          font: { size: 12, weight: 500 },
          color: '#5a6b7e',
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(30, 58, 95, 0.9)',
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            const total = data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((context.raw as number) / total * 100).toFixed(1) : 0;
            return ` ${context.label}: ${context.raw} 票 (${percentage}%)`;
          }
        }
      }
    }
  };

  const totalVotes = data.reduce((a, b) => a + b, 0);

  return (
    <div>
      {!isRating && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            className={`chart-type-btn ${chartType === 'bar' ? 'active' : ''}`}
            onClick={() => setChartType('bar')}
          >
            柱状图
          </button>
          <button
            className={`chart-type-btn ${chartType === 'pie' ? 'active' : ''}`}
            onClick={() => setChartType('pie')}
          >
            饼图
          </button>
        </div>
      )}

      <div className="chart-container" ref={chartRef}>
        {totalVotes === 0 ? (
          <div className="empty-state" style={{ minHeight: '300px' }}>
            <div className="empty-state-icon">📊</div>
            <div className="empty-state-text">暂无投票数据</div>
            <div className="empty-state-hint">等待第一位投票者...</div>
          </div>
        ) : (
          isRating || chartType === 'bar' ? (
            <Bar data={barChartData} options={barOptions} key={vote.id + '-bar'} />
          ) : (
            <Pie data={pieChartData} options={pieOptions} key={vote.id + '-pie'} />
          )
        )}
      </div>

      {totalVotes > 0 && (
        <div style={{
          marginTop: '16px',
          padding: '12px 16px',
          background: 'var(--primary-light)',
          borderRadius: 'var(--radius-sm)',
          textAlign: 'center',
          fontSize: '14px',
          color: 'var(--primary-dark-blue)',
          fontWeight: '500'
        }}>
          总参与人数：<span style={{ fontWeight: '700', fontSize: '16px', color: 'var(--accent-orange)' }}>{totalVotes}</span> 人
        </div>
      )}
    </div>
  );
};

export default ResultChart;
