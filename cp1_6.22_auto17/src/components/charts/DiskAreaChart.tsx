import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useDashboardStore } from '@/store/useDashboardStore';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

export default function DiskAreaChart() {
  const diskReadHistory = useDashboardStore((s) => s.diskReadHistory);
  const diskWriteHistory = useDashboardStore((s) => s.diskWriteHistory);

  const data = {
    labels: diskReadHistory.map((_, i) => `${i}`),
    datasets: [
      {
        label: '读取 MB/s',
        data: diskReadHistory,
        borderColor: '#00f0ff',
        backgroundColor: 'rgba(0, 240, 255, 0.15)',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
        fill: true,
      },
      {
        label: '写入 MB/s',
        data: diskWriteHistory,
        borderColor: '#ff007f',
        backgroundColor: 'rgba(255, 0, 127, 0.15)',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 } as const,
    scales: {
      x: { display: false },
      y: {
        grid: { color: 'rgba(0, 240, 255, 0.06)' },
        ticks: { color: '#00f0ff', font: { family: 'JetBrains Mono', size: 10 } },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: '#00f0ff',
          font: { family: 'JetBrains Mono', size: 10 },
          boxWidth: 10,
          padding: 8,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(10, 14, 23, 0.9)',
        borderColor: '#00f0ff',
        borderWidth: 1,
        titleFont: { family: 'JetBrains Mono' },
        bodyFont: { family: 'JetBrains Mono' },
      },
    },
  };

  return <Line data={data} options={options} />;
}
