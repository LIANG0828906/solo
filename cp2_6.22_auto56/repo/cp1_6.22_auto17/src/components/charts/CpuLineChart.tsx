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

export default function CpuLineChart() {
  const cpuHistory = useDashboardStore((s) => s.cpuHistory);

  const data = {
    labels: cpuHistory.map((_, i) => `${i}`),
    datasets: [
      {
        label: 'CPU %',
        data: cpuHistory,
        borderColor: '#00f0ff',
        backgroundColor: 'rgba(0, 240, 255, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.4,
        fill: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 } as const,
    scales: {
      x: {
        display: false,
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(0, 240, 255, 0.06)' },
        ticks: { color: '#00f0ff', font: { family: 'JetBrains Mono', size: 10 } },
      },
    },
    plugins: {
      legend: { display: false },
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
