import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { FiX } from 'react-icons/fi';
import { useLogStore } from '../store/logStore';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip);

interface Props {
  show: boolean;
  onClose: () => void;
}

const ratingToColor = (rating: number): string => {
  if (rating <= 0) return '#C8BFB5';
  const t = Math.max(0, Math.min(1, (rating - 1) / 4));
  const r1 = 192, g1 = 57, b1 = 43;
  const r2 = 39, g2 = 174, b2 = 96;
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r}, ${g}, ${b})`;
};

export default function StatsView({ show, onClose }: Props) {
  const getStats = useLogStore((s) => s.getStats);
  const stats = getStats();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (show) {
      document.addEventListener('keydown', onKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [show, onClose]);

  if (!show) return null;

  const labels = stats.last30Days.map((d) => d.date.slice(5));
  const counts = stats.last30Days.map((d) => d.count);
  const colors = stats.last30Days.map((d) => ratingToColor(d.avgRating));

  const chartData = {
    labels,
    datasets: [
      {
        label: '冲泡次数',
        data: counts,
        backgroundColor: colors,
        borderRadius: 4,
        borderSkipped: false,
        barThickness: 20,
        categoryPercentage: 1,
        barPercentage: 0.9,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#4A3525',
        titleColor: '#FAF5EF',
        bodyColor: '#E8D6C3',
        borderColor: '#6F4E37',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (ctx: any) => {
            const idx = ctx.dataIndex;
            const day = stats.last30Days[idx];
            return [
              `次数: ${day.count}`,
              `平均评分: ${day.avgRating > 0 ? day.avgRating.toFixed(2) : '-'}`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: '#A67B5B',
          font: { size: 10 },
          maxTicksLimit: 10,
          autoSkip: true,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: '#A67B5B',
          stepSize: 1,
          font: { size: 11 },
        },
        grid: {
          color: 'rgba(166, 123, 91, 0.15)',
        },
      },
    },
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(74, 53, 37, 0.4)',
          zIndex: 200,
          animation: 'fadeIn 0.3s ease-out',
        }}
      />
      <div
        ref={containerRef}
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 201,
          height: '50vh',
          minHeight: 420,
          backgroundColor: '#F5F0EB',
          padding: 24,
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
          animation: 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
          maxWidth: 960,
          margin: '0 auto',
        }}
      >
        <style>{`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        `}</style>

        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 36,
            height: 36,
            borderRadius: '50%',
            backgroundColor: 'transparent',
            color: '#6F4E37',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s ease-out, transform 0.1s ease-out',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#E0D5C8')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <FiX size={22} />
        </button>

        <h2 style={{
          fontSize: 20,
          color: '#4A3525',
          fontWeight: 600,
          marginBottom: 20,
          fontFamily: 'Georgia, "Times New Roman", serif',
        }}>
          冲泡统计
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}>
          <div style={{
            padding: 16,
            backgroundColor: '#FAF5EF',
            borderRadius: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}>
            <span style={{ fontSize: 12, color: '#A67B5B' }}>总记录条数</span>
            <span style={{ fontSize: 28, fontWeight: 700, color: '#4A3525', fontFamily: 'Georgia, serif' }}>
              {stats.totalRecords}
            </span>
          </div>
          <div style={{
            padding: 16,
            backgroundColor: '#FAF5EF',
            borderRadius: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}>
            <span style={{ fontSize: 12, color: '#A67B5B' }}>平均评分</span>
            <span style={{ fontSize: 28, fontWeight: 700, color: '#6F4E37', fontFamily: 'Georgia, serif' }}>
              {stats.totalRecords > 0 ? stats.avgRating.toFixed(5) : '-'}
            </span>
          </div>
          <div style={{
            padding: 16,
            backgroundColor: '#FAF5EF',
            borderRadius: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            minWidth: 0,
          }}>
            <span style={{ fontSize: 12, color: '#A67B5B' }}>最常用咖啡豆</span>
            <span style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#4A3525',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {stats.mostUsedBean || '-'}
            </span>
          </div>
        </div>

        <div style={{
          flex: 1,
          minHeight: 0,
          backgroundColor: '#FAF5EF',
          borderRadius: 10,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
        }}>
          <h3 style={{ fontSize: 14, color: '#4A3525', fontWeight: 600, marginBottom: 12 }}>
            近30天冲泡次数
          </h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <Bar data={chartData} options={chartOptions as any} />
          </div>
        </div>
      </div>
    </>
  );
}
