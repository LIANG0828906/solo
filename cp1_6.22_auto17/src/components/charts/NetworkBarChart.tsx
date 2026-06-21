import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useDashboardStore } from '@/store/useDashboardStore';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function NetworkBarChart() {
  const networkInHistory = useDashboardStore((s) => s.networkInHistory);
  const networkOutHistory = useDashboardStore((s) => s.networkOutHistory);

  const data = {
    labels: networkInHistory.map((_, i) => `${i}`),
    datasets: [
      {
        label: '流入 KB/s',
        data: networkInHistory,
        backgroundColor: 'rgba(0, 240, 255, 0.6)',
        borderColor: '#00f0ff',
        borderWidth: 1,
        borderRadius: 2,
      },
      {
        label: '流出 KB/s',
        data: networkOutHistory,
        backgroundColor: 'rgba(255, 0, 127, 0.6)',
        borderColor: '#ff007f',
        borderWidth: 1,
        borderRadius: 2,
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

  return <Bar data={data} options={options} />;
}
