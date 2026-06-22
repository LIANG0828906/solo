import { useEffect } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { useAppStore } from '../store';
import { bookApi } from '../services/api';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const TAG_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6'];

const Dashboard = () => {
  const { statistics, setStatistics, addToast, setLoading, isLoading } = useAppStore();

  useEffect(() => {
    const fetchStatistics = async () => {
      setLoading(true);
      try {
        const stats = await bookApi.getStatistics();
        setStatistics(stats);
      } catch (error) {
        console.error('Failed to fetch statistics:', error);
        addToast('加载统计数据失败', 'warning');
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [setStatistics, setLoading, addToast]);

  const doughnutData = statistics
    ? {
        labels: Object.keys(statistics.tags_count),
        datasets: [
          {
            data: Object.values(statistics.tags_count),
            backgroundColor: Object.keys(statistics.tags_count).map(
              (_, index) => TAG_COLORS[index % TAG_COLORS.length]
            ),
            borderWidth: 0,
          },
        ],
      }
    : null;

  const barData = statistics
    ? {
        labels: statistics.borrow_trend.map((item) => item.date.substring(5)),
        datasets: [
          {
            label: '借出次数',
            data: statistics.borrow_trend.map((item) => item.count),
            backgroundColor: (context: any) => {
              const chart = context.chart;
              const { ctx, chartArea } = chart;
              if (!chartArea) {
                return '#3498db';
              }
              const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
              gradient.addColorStop(0, '#3498db');
              gradient.addColorStop(1, '#2ecc71');
              return gradient;
            },
            borderRadius: 4,
          },
        ],
      }
    : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          font: { size: 12 },
        },
      },
    },
  };

  return (
    <div>
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#333' }}>
        统计看板
      </h2>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>加载中...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px' }}>
          <div
            style={{
              background: 'linear-gradient(180deg, #f0f0f0 0%, #fafafa 100%)',
              borderRadius: '12px',
              border: '1px solid #e5e5e5',
              padding: '24px',
            }}
          >
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 600,
                marginBottom: '16px',
                color: '#333',
              }}
            >
              标签书籍占比
            </h3>
            <div style={{ height: '300px' }}>
              {doughnutData && <Doughnut data={doughnutData} options={chartOptions} />}
            </div>
          </div>

          <div
            style={{
              background: 'linear-gradient(180deg, #f0f0f0 0%, #fafafa 100%)',
              borderRadius: '12px',
              border: '1px solid #e5e5e5',
              padding: '24px',
            }}
          >
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 600,
                marginBottom: '16px',
                color: '#333',
              }}
            >
              近30天借出趋势
            </h3>
            <div style={{ height: '300px' }}>
              {barData && (
                <Bar
                  data={barData}
                  options={{
                    ...chartOptions,
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 },
                        grid: { color: '#e5e5e5' },
                      },
                      x: {
                        grid: { display: false },
                        ticks: { maxRotation: 45, minRotation: 45, font: { size: 10 } },
                      },
                    },
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 1.5fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
