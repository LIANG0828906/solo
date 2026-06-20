import { useRef, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useDebateStore } from '@/store/debateStore';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ChartDisplayProps {
  showFinalResult?: boolean;
}

export function ChartDisplay({ showFinalResult = false }: ChartDisplayProps) {
  const { voteData, phase, arguments: allArguments } = useDebateStore();
  const chartRef = useRef<ChartJS<'bar'>>(null);

  const proCount = allArguments.filter(a => a.side === 'pro').length;
  const conCount = allArguments.filter(a => a.side === 'con').length;

  const displayProVotes = showFinalResult ? voteData.proVotes : voteData.proVotes;
  const displayConVotes = showFinalResult ? voteData.conVotes : voteData.conVotes;

  const data = {
    labels: ['正方', '反方'],
    datasets: [
      {
        label: '得票数',
        data: [displayProVotes, displayConVotes],
        backgroundColor: [
          'rgba(74, 144, 217, 0.7)',
          'rgba(230, 57, 70, 0.7)',
        ],
        borderColor: [
          'rgba(74, 144, 217, 1)',
          'rgba(230, 57, 70, 1)',
        ],
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 600,
      easing: 'easeOutQuart' as const,
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: showFinalResult,
        text: '最终投票结果',
        color: '#fff',
        font: {
          size: 18,
          weight: 'bold' as const,
        },
        padding: {
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#fff',
        bodyColor: '#94a3b8',
        borderColor: 'rgba(74, 144, 217, 0.3)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#94a3b8',
          font: {
            size: 14,
            weight: 500 as const,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
        },
        ticks: {
          color: '#94a3b8',
          stepSize: 1,
        },
      },
    },
  };

  const totalVotes = displayProVotes + displayConVotes;
  const proPercentage = totalVotes > 0 ? Math.round((displayProVotes / totalVotes) * 100) : 50;
  const conPercentage = totalVotes > 0 ? Math.round((displayConVotes / totalVotes) * 100) : 50;

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.update();
    }
  }, [displayProVotes, displayConVotes]);

  const winner = displayProVotes > displayConVotes ? '正方获胜' : displayConVotes > displayProVotes ? '反方获胜' : '平局';

  return (
    <div className="chart-container w-full h-full flex flex-col">
      <div className="flex-1 min-h-[200px]">
        <Bar ref={chartRef} data={data} options={options} />
      </div>
      
      {showFinalResult && phase === 'finished' && (
        <div className="mt-6 text-center">
          <div 
            className="inline-block px-8 py-4 rounded-xl text-2xl font-bold"
            style={{
              background: displayProVotes >= displayConVotes 
                ? 'linear-gradient(135deg, rgba(74, 144, 217, 0.2), rgba(74, 144, 217, 0.05))'
                : 'linear-gradient(135deg, rgba(230, 57, 70, 0.2), rgba(230, 57, 70, 0.05))',
              color: displayProVotes >= displayConVotes ? '#4A90D9' : '#E63946',
              border: `2px solid ${displayProVotes >= displayConVotes ? 'rgba(74, 144, 217, 0.5)' : 'rgba(230, 57, 70, 0.5)'}`,
            }}
          >
            🏆 {winner}
          </div>
          <div className="flex justify-center gap-8 mt-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: '#4A90D9' }}>{proPercentage}%</div>
              <div className="text-gray-500">正方支持率</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: '#E63946' }}>{conPercentage}%</div>
              <div className="text-gray-500">反方支持率</div>
            </div>
          </div>
          <div className="mt-2 text-gray-500 text-sm">
            共 {totalVotes} 票 · 正方 {proCount} 条论点 · 反方 {conCount} 条论点
          </div>
        </div>
      )}
    </div>
  );
}
