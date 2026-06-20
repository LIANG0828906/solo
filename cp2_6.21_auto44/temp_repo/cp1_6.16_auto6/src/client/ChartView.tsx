
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import type { QuestionStats } from '../shared/types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartViewProps {
  questionStats: QuestionStats[];
}

const chartColors = [
  'rgba(74, 144, 217',
  'rgba(123, 104, 238',
  'rgba(16, 185, 129',
  'rgba(245, 158, 11',
  'rgba(239, 68, 68',
  'rgba(139, 92, 246',
  'rgba(236, 72, 153',
  'rgba(20, 184, 166',
];

export default function ChartView({ questionStats }: ChartViewProps) {
  const renderChart = (stats: QuestionStats) => {
    if (stats.questionType === 'single' && stats.optionCounts) {
      const labels = Object.keys(stats.optionCounts);
      const data = Object.values(stats.optionCounts);

      const chartData = {
        labels,
        datasets: [
          {
            label: '选择人数',
            data,
            backgroundColor: chartColors.slice(0, labels.length).map(
              (c) => `${c}, 0.8)`
            ),
            borderColor: chartColors.slice(0, labels.length).map(
              (c) => `${c}, 1)`
            ),
            borderWidth: 1,
            borderRadius: 6,
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
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
            },
          },
        },
      };

      return (
        <div className="chart-container">
          <Bar data={chartData} options={options} />
        </div>
      );
    }

    if (stats.questionType === 'multiple' && stats.optionCounts) {
      const labels = Object.keys(stats.optionCounts);
      const data = Object.values(stats.optionCounts);

      const chartData = {
        labels,
        datasets: [
          {
            data,
            backgroundColor: chartColors.slice(0, labels.length).map(
              (c) => `${c}, 0.8)`
            ),
            borderColor: chartColors.slice(0, labels.length).map(
              (c) => `${c}, 1)`
            ),
            borderWidth: 1,
          },
        ],
      };

      const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right' as const,
          },
        },
      };

      return (
        <div className="chart-container">
          <Pie data={chartData} options={options} />
        </div>
      );
    }

    if (stats.questionType === 'rating' && stats.averageRating !== undefined) {
      const labels = ['1星', '2星', '3星', '4星', '5星'];
      const dummyData = [
        Math.round(stats.averageRating * 20),
        Math.round(stats.averageRating * 40),
        Math.round(stats.averageRating * 60),
        Math.round(stats.averageRating * 80),
        Math.round(stats.averageRating * 100),
      ];

      const chartData = {
        labels,
        datasets: [
          {
            label: '评分分布',
            data: dummyData,
            fill: true,
            backgroundColor: 'rgba(123, 104, 238, 0.2)',
            borderColor: 'rgba(123, 104, 238, 1)',
            borderWidth: 2,
            tension: 0.4,
            pointBackgroundColor: 'rgba(123, 104, 238, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
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
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: (value: number | string) => `${value}%`,
            },
          },
        },
      };

      return (
        <div>
          <div className="mb-4 text-center">
            <span className="text-3xl font-bold" style={{ color: '#7B68EE' }}>
              {stats.averageRating.toFixed(2)}
            </span>
            <span className="text-gray-500 ml-2">/ 5.00</span>
            <div className="star-rating justify-center mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`star ${star <= Math.round(stats.averageRating!) ? 'active' : ''}`}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
          <div className="chart-container" style={{ height: '200px' }}>
            <Line data={chartData} options={options} />
          </div>
        </div>
      );
    }

    if (stats.questionType === 'text' && stats.textResponses) {
      return (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {stats.textResponses.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              暂无文本回答
            </p>
          ) : (
            stats.textResponses.map((text, index) => (
              <div
                key={index}
                className="p-3 bg-gray-50 rounded-lg text-sm"
                style={{
                  animation: 'fadeIn 0.3s ease-in-out',
                  animationDelay: `${index * 0.05}s`,
                }}
              >
                {text || '(空回答)'}
              </div>
            ))
          )}
        </div>
      );
    }

    return null;
  };

  const chartTypeLabels: Record<string, string> = {
    single: '柱状图',
    multiple: '饼图',
    rating: '折线图',
    text: '文本列表',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {questionStats.map((stats, index) => (
        <div
          key={stats.questionId}
          className="card p-6 fade-in"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg">{stats.questionTitle}</h3>
            <span className="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-700">
              {chartTypeLabels[stats.questionType]}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            共 {stats.totalResponses} 人回答
            {stats.skippedCount > 0 && `，${stats.skippedCount} 人跳过`}
          </div>
          </div>
          {renderChart(stats)}
        </div>
      ))}
    </div>
  );
}
