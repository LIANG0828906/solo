import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { getVoteResults, voteEventEmitter, Vote } from '@/utils/voteStore';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

interface ResultsDashboardProps {
  voteId: string;
}

const truncateLabel = (text: string, maxLen = 15): string => {
  return text.length > maxLen ? text.substring(0, maxLen) + '…' : text;
};

const BAR_COLORS = [
  'rgba(74, 144, 226, 0.85)',
  'rgba(106, 130, 220, 0.85)',
  'rgba(138, 116, 214, 0.85)',
  'rgba(170, 102, 208, 0.85)',
  'rgba(190, 92, 200, 0.85)',
  'rgba(74, 160, 240, 0.85)',
  'rgba(100, 120, 230, 0.85)',
  'rgba(155, 100, 218, 0.85)',
];

const DOUGHNUT_COLORS = [
  '#4a90e2',
  '#e2744a',
  '#4ae2a0',
  '#e24a90',
  '#a04ae2',
  '#e2c84a',
  '#4ac8e2',
  '#e24a4a',
];

const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ voteId }) => {
  const [vote, setVote] = useState<Vote | null>(null);

  const refreshVote = useCallback(() => {
    const v = getVoteResults(voteId);
    if (v) setVote({ ...v });
  }, [voteId]);

  useEffect(() => {
    refreshVote();
  }, [refreshVote]);

  useEffect(() => {
    const handler = () => refreshVote();
    voteEventEmitter.on('vote:updated', handler);
    return () => {
      voteEventEmitter.off('vote:updated', handler);
    };
  }, [refreshVote]);

  const barData = useMemo(() => {
    if (!vote) return null;
    const labels = vote.options.map((o) => truncateLabel(o.text));
    const data = vote.options.map((o) => vote.results[o.id] || 0);
    const colors = vote.options.map((_, i) => BAR_COLORS[i % BAR_COLORS.length]);
    return {
      labels,
      datasets: [
        {
          label: '票数',
          data,
          backgroundColor: colors,
          borderColor: colors.map((c) => c.replace('0.85', '1')),
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    };
  }, [vote]);

  const barOptions = useMemo(
    () => ({
      indexAxis: 'y' as const,
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 300,
        easing: 'easeOut' as const,
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(26, 26, 46, 0.9)',
          titleColor: '#e0e0e0',
          bodyColor: '#e0e0e0',
          borderColor: 'rgba(255,255,255,0.15)',
          borderWidth: 1,
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            color: '#a0a0a0',
            stepSize: 1,
            precision: 0,
          },
          grid: {
            color: 'rgba(255,255,255,0.06)',
          },
        },
        y: {
          ticks: {
            color: '#e0e0e0',
            font: { size: 13 },
          },
          grid: {
            display: false,
          },
        },
      },
    }),
    []
  );

  const doughnutData = useMemo(() => {
    if (!vote) return null;
    const labels = vote.options.map((o) => truncateLabel(o.text));
    const data = vote.options.map((o) => vote.results[o.id] || 0);
    const colors = vote.options.map((_, i) => DOUGHNUT_COLORS[i % DOUGHNUT_COLORS.length]);
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
          borderColor: 'rgba(26, 26, 46, 0.8)',
          borderWidth: 2,
          hoverOffset: 8,
        },
      ],
    };
  }, [vote]);

  const doughnutOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      animation: {
        animateRotate: true,
        duration: 400,
        easing: 'easeOut' as const,
      },
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels: {
            color: '#e0e0e0',
            padding: 16,
            font: { size: 12 },
          },
        },
        tooltip: {
          backgroundColor: 'rgba(26, 26, 46, 0.9)',
          titleColor: '#e0e0e0',
          bodyColor: '#e0e0e0',
          borderColor: 'rgba(255,255,255,0.15)',
          borderWidth: 1,
        },
      },
    }),
    []
  );

  if (!vote) {
    return <div className="results-dashboard"><p>暂无投票数据</p></div>;
  }

  const totalVotes = vote.totalVotes;

  return (
    <div className="results-dashboard">
      <h2 className="section-title">{vote.question} — 结果</h2>
      <div className="charts-container">
        <div className="chart-wrapper bar-wrapper">
          <h3 className="chart-label">柱状图</h3>
          <div className="chart-canvas bar-canvas">
            {barData && <Bar data={barData} options={barOptions} />}
          </div>
        </div>
        <div className="chart-wrapper doughnut-wrapper">
          <h3 className="chart-label">环形图</h3>
          <div className="chart-canvas doughnut-canvas">
            {doughnutData && <Doughnut data={doughnutData} options={doughnutOptions} />}
            <div className="doughnut-center">
              <span className="total-votes">{totalVotes}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsDashboard;
