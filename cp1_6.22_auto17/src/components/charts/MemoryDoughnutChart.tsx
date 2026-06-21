import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useDashboardStore } from '@/store/useDashboardStore';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function MemoryDoughnutChart() {
  const memoryHistory = useDashboardStore((s) => s.memoryHistory);
  const current = memoryHistory.length > 0 ? memoryHistory[memoryHistory.length - 1] : 0;

  const data = {
    labels: ['已用', '可用'],
    datasets: [
      {
        data: [current, 100 - current],
        backgroundColor: ['#ff007f', 'rgba(255, 0, 127, 0.15)'],
        borderColor: ['#ff007f', 'rgba(255, 0, 127, 0.3)'],
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    animation: { duration: 300 } as const,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(10, 14, 23, 0.9)',
        borderColor: '#ff007f',
        borderWidth: 1,
        titleFont: { family: 'JetBrains Mono' },
        bodyFont: { family: 'JetBrains Mono' },
      },
    },
  };

  return <Doughnut data={data} options={options} />;
}
