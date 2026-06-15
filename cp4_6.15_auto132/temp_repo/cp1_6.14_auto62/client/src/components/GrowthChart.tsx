import React from 'react';
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
import { GrowthDataPoint, Challenge } from '../types';

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

interface GrowthChartProps {
  data: GrowthDataPoint[];
  challenges?: Challenge[];
  title?: string;
}

const challengeColors = [
  'rgba(255, 140, 0, 1)',
  'rgba(82, 196, 26, 1)',
  'rgba(24, 144, 255, 1)',
  'rgba(114, 46, 209, 1)',
  'rgba(235, 47, 150, 1)',
];

const GrowthChart: React.FC<GrowthChartProps> = ({ data, challenges = [], title = '成长曲线' }) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const challengeMap = new Map(challenges.map(c => [c.id, c]));
  
  const challengeIds = Array.from(new Set(
    data.flatMap(d => Object.keys(d.challenges))
  ));

  const datasets = [
    {
      label: '总完成量',
      data: data.map(d => d.total),
      borderColor: 'rgba(255, 140, 0, 1)',
      backgroundColor: 'rgba(255, 140, 0, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 8,
      pointBackgroundColor: 'rgba(255, 140, 0, 1)',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      order: 0,
    },
    ...challengeIds.map((cid, idx) => {
      const challenge = challengeMap.get(cid);
      const color = challengeColors[idx % challengeColors.length];
      return {
        label: challenge?.name || `挑战${idx + 1}`,
        data: data.map(d => d.challenges[cid] || 0),
        borderColor: color,
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.3,
        pointRadius: 2,
        pointHoverRadius: 6,
        pointBackgroundColor: color,
        order: idx + 1,
      };
    }),
  ];

  const chartData = {
    labels: data.map(d => formatDate(d.date)),
    datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    animation: {
      duration: 750,
      easing: 'easeInOutQuart' as const,
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 12,
          },
          padding: 20,
          usePointStyle: true,
        },
      },
      title: {
        display: true,
        text: title,
        color: 'rgba(255, 255, 255, 0.9)',
        font: {
          size: 18,
          weight: 'bold' as const,
        },
        padding: {
          bottom: 20,
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(26, 42, 58, 0.95)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 140, 0, 0.5)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: (tooltipItems: any[]) => {
            const idx = tooltipItems[0]?.dataIndex;
            if (idx !== undefined && data[idx]) {
              return new Date(data[idx].date).toLocaleDateString('zh-CN');
            }
            return '';
          },
          label: (context: any) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            const cid = challengeIds[context.datasetIndex - 1];
            const challenge = cid ? challengeMap.get(cid) : null;
            const unit = challenge?.unit || '';
            return `${label}: ${value} ${unit}`.trim();
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)',
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 6,
          callback: function(value: any, index: number) {
            if (index % 5 === 0) {
              return this.getLabelForValue(value);
            }
            return '';
          },
          font: {
            size: 11,
          },
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false,
        },
      },
      y: {
        display: true,
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)',
          font: {
            size: 11,
          },
          padding: 10,
        },
        grid: {
          color: (context: any) => {
            const gradient = context.chart.ctx.createLinearGradient(0, 0, 0, context.chart.height);
            gradient.addColorStop(0, 'rgba(255, 140, 0, 0.15)');
            gradient.addColorStop(1, 'rgba(255, 140, 0, 0.02)');
            return gradient;
          },
          drawBorder: false,
          lineWidth: 1,
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <div style={{ height: '400px', position: 'relative' }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default GrowthChart;
