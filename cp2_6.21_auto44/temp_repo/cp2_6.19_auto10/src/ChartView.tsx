import React from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';
import { Radar, Bar } from 'react-chartjs-2';
import { CoffeeRecord } from './types';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

const BAR_COLORS = [
  'rgba(107, 66, 38, 0.85)',
  'rgba(212, 165, 116, 0.85)',
  'rgba(180, 100, 60, 0.85)',
  'rgba(139, 90, 56, 0.85)',
];

const BAR_BORDER_COLORS = [
  'rgba(107, 66, 38, 1)',
  'rgba(212, 165, 116, 1)',
  'rgba(180, 100, 60, 1)',
  'rgba(139, 90, 56, 1)',
];

interface RadarChartProps {
  record: CoffeeRecord;
}

export const RadarChart: React.FC<RadarChartProps> = ({ record }) => {
  const data = {
    labels: ['酸度', '醇厚度', '余韵'],
    datasets: [
      {
        label: record.name,
        data: [record.acidity, record.body, record.aftertaste],
        backgroundColor: 'rgba(212, 165, 116, 0.35)',
        borderColor: 'rgba(107, 66, 38, 0.9)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(107, 66, 38, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(107, 66, 38, 1)',
        pointRadius: 5,
        pointHoverRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(74, 55, 40, 0.95)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#d4a574',
        borderWidth: 1,
        padding: 12,
        titleFont: {
          size: 14,
          weight: 700 as const,
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          label: (context: any) => ` ${context.label}: ${context.raw} / 5`,
        },
      },
    },
    scales: {
      r: {
        min: 0,
        max: 5,
        ticks: {
          stepSize: 1,
          font: {
            size: 11,
          },
          color: '#7a6252',
          backdropColor: 'transparent',
        },
        grid: {
          color: 'rgba(107, 66, 38, 0.15)',
        },
        angleLines: {
          color: 'rgba(107, 66, 38, 0.2)',
        },
        pointLabels: {
          font: {
            size: 14,
            weight: 600 as const,
          },
          color: '#4a3728',
        },
      },
    },
    animation: {
      duration: 600,
      easing: 'easeOutQuart' as const,
    },
  };

  return (
    <div>
      <h3 className="chart-title">风味雷达图</h3>
      <div className="chart-container">
        <Radar data={data} options={options as any} />
      </div>
    </div>
  );
};

interface BarChartCompareProps {
  records: CoffeeRecord[];
}

export const BarChartCompare: React.FC<BarChartCompareProps> = ({ records }) => {
  const labels = ['酸度', '醇厚度', '余韵', '整体评分'];

  const datasets = records.map((record, index) => ({
    label: record.name,
    data: [
      record.acidity,
      record.body,
      record.aftertaste,
      record.overall,
    ],
    backgroundColor: BAR_COLORS[index % BAR_COLORS.length],
    borderColor: BAR_BORDER_COLORS[index % BAR_BORDER_COLORS.length],
    borderWidth: 1,
    borderRadius: 6,
    maxBarThickness: 48,
  }));

  const data = {
    labels,
    datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#4a3728',
          font: {
            size: 13,
            weight: 600 as const,
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'rectRounded',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(74, 55, 40, 0.95)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#d4a574',
        borderWidth: 1,
        padding: 12,
        titleFont: {
          size: 14,
          weight: 700 as const,
        },
        bodyFont: {
          size: 13,
        },
      },
      datalabels: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#4a3728',
          font: {
            size: 13,
            weight: 600 as const,
          },
        },
      },
      y: {
        beginAtZero: true,
        max: 10,
        ticks: {
          stepSize: 2,
          color: '#7a6252',
          font: {
            size: 11,
          },
        },
        grid: {
          color: 'rgba(107, 66, 38, 0.1)',
        },
      },
    },
    animation: {
      duration: 700,
      easing: 'easeOutQuart' as const,
      delay: (context: any) => context.dataIndex * 80 + context.datasetIndex * 100,
    },
  };

  const plugins = [
    {
      id: 'datalabels',
      afterDatasetsDraw: (chart: any) => {
        const ctx = chart.ctx;
        chart.data.datasets.forEach((dataset: any, datasetIndex: number) => {
          const meta = chart.getDatasetMeta(datasetIndex);
          if (!meta.hidden) {
            meta.data.forEach((bar: any, index: number) => {
              const value = dataset.data[index];
              ctx.save();
              ctx.font = 'bold 12px -apple-system, sans-serif';
              ctx.fillStyle = '#4a3728';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'bottom';
              ctx.fillText(value.toString(), bar.x, bar.y - 6);
              ctx.restore();
            });
          }
        });
      },
    },
  ];

  return (
    <div className="compare-bars-card">
      <h3 className="chart-title">多维度对比柱状图</h3>
      <div className="chart-container" style={{ height: '420px' }}>
        <Bar data={data} options={options as any} plugins={plugins as any} />
      </div>
    </div>
  );
};

const ChartView = { RadarChart, BarChartCompare };
export default ChartView;
