import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Wifi, WifiOff, Vote } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { usePollStore } from '@/store/pollStore';
import { getPoll } from '@/utils/api';
import * as socket from '@/utils/socket';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function ResultsDashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentPoll, setCurrentPoll, isSocketConnected, updatePollVote } = usePollStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  const previousVotesRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!id) return;

    const loadPoll = async () => {
      try {
        const poll = await getPoll(id);
        setCurrentPoll(poll);
        poll.options.forEach((opt) => {
          previousVotesRef.current[opt.id] = opt.votes;
        });
        socket.joinPoll(id);
        socket.onVoteUpdate((updatedPoll) => {
          setCurrentPoll(updatedPoll);
          updatePollVote(updatedPoll.id, '', 0);
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        setIsLoading(false);
      }
    };

    loadPoll();

    return () => {
      socket.leavePoll(id);
    };
  }, [id, setCurrentPoll, updatePollVote]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error && !currentPoll) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex flex-col items-center justify-center p-4">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-blue-500 text-white rounded-xl"
        >
          返回首页
        </button>
      </div>
    );
  }

  if (!currentPoll) {
    return null;
  }

  const pieData = {
    labels: currentPoll.options.map((opt) => opt.text),
    datasets: [
      {
        data: currentPoll.options.map((opt) => opt.votes),
        backgroundColor: currentPoll.options.map((opt) => opt.color),
        borderColor: currentPoll.options.map((opt) => opt.color),
        borderWidth: 2,
      },
    ],
  };

  const barData = {
    labels: currentPoll.options.map((opt) => opt.text),
    datasets: [
      {
        label: '票数',
        data: currentPoll.options.map((opt) => opt.votes),
        backgroundColor: currentPoll.options.map((opt) => opt.color + '80'),
        borderColor: currentPoll.options.map((opt) => opt.color),
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          color: document.documentElement.classList.contains('dark') ? '#e2e8f0' : '#334155',
        },
      },
    },
  };

  const barOptions = {
    responsive: true,
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
          color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b',
        },
        grid: {
          color: document.documentElement.classList.contains('dark') ? '#334155' : '#e2e8f0',
        },
      },
      x: {
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b',
        },
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(`/poll/${id}`)}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            返回投票
          </button>
          <div className="flex items-center gap-2">
            {isSocketConnected ? (
              <Wifi className="w-5 h-5 text-green-500" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-500" />
            )}
            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              <Vote className="w-4 h-4" />
              创建投票
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 mb-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {currentPoll.title}
            </h1>
            {currentPoll.description && (
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                {currentPoll.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <Vote className="w-4 h-4 text-blue-500" />
                <span className="font-semibold text-blue-700 dark:text-blue-400">
                  {currentPoll.totalVotes} 票
                </span>
              </div>
              <span
                className={`px-4 py-2 rounded-xl text-sm font-medium ${
                  currentPoll.status === 'active'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400'
                }`}
              >
                {currentPoll.status === 'active' ? '实时更新中' : '已结束'}
              </span>
            </div>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setChartType('pie')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                chartType === 'pie'
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              饼图
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                chartType === 'bar'
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              柱状图
            </button>
          </div>

          <div className="max-w-md mx-auto mb-8">
            {chartType === 'pie' ? (
              <Pie data={pieData} options={pieOptions} />
            ) : (
              <Bar data={barData} options={barOptions} />
            )}
          </div>

          <div className="space-y-3">
            {currentPoll.options.map((option) => {
              const percentage =
                currentPoll.totalVotes > 0
                  ? Math.round((option.votes / currentPoll.totalVotes) * 100)
                  : 0;
              const previousVotes = previousVotesRef.current[option.id] || 0;
              const voteChange = option.votes - previousVotes;
              previousVotesRef.current[option.id] = option.votes;

              return (
                <div
                  key={option.id}
                  className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  <div
                    className="absolute inset-y-0 left-0 transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: option.color + '20',
                    }}
                  />
                  <div className="relative flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: option.color }}
                      />
                      <span className="font-medium text-slate-900 dark:text-white">
                        {option.text}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-600 dark:text-slate-400">
                        {option.votes} 票
                      </span>
                      {voteChange > 0 && (
                        <span className="text-green-500 text-sm font-medium animate-pulse">
                          +{voteChange}
                        </span>
                      )}
                      <span className="font-semibold text-slate-900 dark:text-white min-w-[3rem] text-right">
                        {percentage}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
