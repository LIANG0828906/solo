import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ChartData,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Props {
  historical: { month: string; total: number }[];
  predictions: { month: string; total: number }[];
}

const fmtMonth = (m: string) => {
  const [, mm] = m.split('-');
  return `${parseInt(mm, 10)}月`;
};

export default function BarChart({ historical, predictions }: Props) {
  const chartRef = useRef<ChartJS<'bar' | 'line'> | null>(null);

  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  const allMonths = [...historical.map((h) => fmtMonth(h.month)), ...predictions.map((p) => fmtMonth(p.month))];
  const historyData = historical.map((h) => h.total);
  const paddedHistory = [...historyData, ...new Array(predictions.length).fill(null)];
  const paddedPrediction = [
    ...new Array(historical.length - 1).fill(null),
    historical.length > 0 ? historical[historical.length - 1].total : null,
    ...predictions.map((p) => p.total),
  ];

  const data: ChartData<'bar' | 'line'> = {
    labels: allMonths,
    datasets: [
      {
        type: 'bar' as const,
        label: '月度收入',
        data: paddedHistory,
        backgroundColor: 'rgba(243, 156, 18, 0.75)',
        borderColor: 'rgba(243, 156, 18, 1)',
        borderWidth: 1,
        borderRadius: 6,
        hoverBackgroundColor: 'rgba(243, 156, 18, 0.95)',
      },
      {
        type: 'line' as const,
        label: '收入预测',
        data: paddedPrediction,
        borderColor: 'rgba(168, 198, 224, 0.9)',
        borderWidth: 2,
        borderDash: [6, 6],
        backgroundColor: 'transparent',
        pointBackgroundColor: 'rgba(168, 198, 224, 1)',
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.2,
        spanGaps: false,
      },
    ],
  };

  const options: ChartOptions<'bar' | 'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1200,
      easing: 'easeOutQuart',
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#ffffff',
          usePointStyle: true,
          padding: 16,
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(52, 73, 94, 0.95)',
        titleColor: '#f39c12',
        bodyColor: '#ffffff',
        borderColor: 'rgba(243, 156, 18, 0.3)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (ctx) => {
            const v = ctx.raw;
            if (v === null || v === undefined) return '';
            const num = Number(v);
            return `${ctx.dataset.label}: ¥${num.toLocaleString('zh-CN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.06)',
        },
        ticks: {
          color: '#a8c6e0',
          font: { size: 12 },
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.06)',
        },
        ticks: {
          color: '#a8c6e0',
          font: { size: 12 },
          callback: (value) => '¥' + Number(value).toLocaleString('zh-CN'),
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="chart-wrapper">
      <Chart ref={chartRef} type="bar" data={data} options={options} />
    </div>
  );
}
