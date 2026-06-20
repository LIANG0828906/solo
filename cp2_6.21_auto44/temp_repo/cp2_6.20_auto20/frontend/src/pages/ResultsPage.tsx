import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  LabelList,
} from 'recharts';
import type { OptionScore, Vote } from '../types';
import { voteApi } from '../api/voteApi';
import { useWebSocket } from '../hooks/useWebSocket';

interface AnimatedScore {
  optionId: string;
  text: string;
  displayedScore: number;
  targetScore: number;
  averageRank: number;
  voteCount: number;
}

function AnimatedNumber({ value, duration = 600 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const frameRef = useRef<number>();

  useEffect(() => {
    const start = prevRef.current;
    const end = value;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        prevRef.current = end;
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [value, duration]);

  return <span>{display}</span>;
}

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [isClosed, setIsClosed] = useState(false);
  const [deadline, setDeadline] = useState(0);
  const [voterCount, setVoterCount] = useState(0);
  const [animatedScores, setAnimatedScores] = useState<AnimatedScore[]>([]);
  const [animationKey, setAnimationKey] = useState(0);

  const { vote: wsVote, isConnected } = useWebSocket(id);

  const calculateResults = (vote: Vote): OptionScore[] => {
    const n = vote.options.length;
    const scores: Map<string, { total: number; rankSum: number; count: number; text: string }> = new Map();

    vote.options.forEach((opt) => {
      scores.set(opt.id, { total: 0, rankSum: 0, count: 0, text: opt.text });
    });

    vote.rankings.forEach((ranking) => {
      ranking.order.forEach((optionId, position) => {
        const s = scores.get(optionId);
        if (s) {
          const points = n - position;
          s.total += points;
          s.rankSum += position + 1;
          s.count += 1;
        }
      });
    });

    return Array.from(scores.entries()).map(([optionId, s]) => ({
      optionId,
      text: s.text,
      totalScore: s.total,
      averageRank: s.count > 0 ? s.rankSum / s.count : 0,
      voteCount: s.count,
    }));
  };

  useEffect(() => {
    if (!id) return;
    const loadResults = async () => {
      try {
        const vote = await voteApi.getVote(id);
        setTitle(vote.title);
        setDeadline(vote.deadline);
        setIsClosed(vote.isClosed);
        setVoterCount(vote.rankings.length);
        const results = calculateResults(vote);
        setAnimatedScores(
          results.map((r) => ({
            optionId: r.optionId,
            text: r.text,
            displayedScore: 0,
            targetScore: r.totalScore,
            averageRank: r.averageRank,
            voteCount: r.voteCount,
          }))
        );
        setAnimationKey((k) => k + 1);
      } catch (error) {
        console.error('加载结果失败:', error);
        alert('加载结果失败');
      } finally {
        setLoading(false);
      }
    };
    loadResults();
  }, [id]);

  useEffect(() => {
    if (wsVote) {
      setIsClosed(wsVote.isClosed);
      setDeadline(wsVote.deadline);
      setVoterCount(wsVote.rankings.length);
      const results = calculateResults(wsVote);
      setAnimatedScores((prev) => {
        return results.map((r) => {
          const existing = prev.find((p) => p.optionId === r.optionId);
          return {
            optionId: r.optionId,
            text: r.text,
            displayedScore: existing ? existing.displayedScore : 0,
            targetScore: r.totalScore,
            averageRank: r.averageRank,
            voteCount: r.voteCount,
          };
        });
      });
      setAnimationKey((k) => k + 1);
    }
  }, [wsVote]);

  useEffect(() => {
    if (animatedScores.length === 0) return;
    const timers = animatedScores.map((s, idx) => {
      if (s.displayedScore === s.targetScore) return null;
      return setTimeout(() => {
        setAnimatedScores((prev) =>
          prev.map((p, i) => (i === idx ? { ...p, displayedScore: p.targetScore } : p))
        );
      }, idx * 80);
    });
    return () => {
      timers.forEach((t) => t && clearTimeout(t));
    };
  }, [animationKey]);

  useEffect(() => {
    if (deadline && !isClosed) {
      const interval = setInterval(() => {
        if (Date.now() >= deadline) {
          setIsClosed(true);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [deadline, isClosed]);

  const sortedScores = useMemo(() => {
    return [...animatedScores].sort((a, b) => b.targetScore - a.targetScore);
  }, [animatedScores]);

  const chartData = useMemo(() => {
    return sortedScores.map((s) => ({
      name: s.text.length > 10 ? s.text.substring(0, 10) + '...' : s.text,
      fullName: s.text,
      score: s.displayedScore,
      votes: s.voteCount,
      avgRank: Number(s.averageRank.toFixed(2)),
    }));
  }, [sortedScores]);

  const overallAvgRank = useMemo(() => {
    if (chartData.length === 0) return 0;
    const sum = chartData.reduce((acc, d) => acc + d.avgRank, 0);
    return Number((sum / chartData.length).toFixed(2));
  }, [chartData]);

  const getMedalStyle = (rank: number): React.CSSProperties => {
    if (rank === 0) return { background: 'linear-gradient(135deg, #ffd700, #ffec8b)', fontWeight: 700 };
    if (rank === 1) return { background: 'linear-gradient(135deg, #c0c0c0, #e8e8e8)', fontWeight: 700 };
    if (rank === 2) return { background: 'linear-gradient(135deg, #cd7f32, #deb887)', fontWeight: 700 };
    return { background: 'white' };
  };

  const getBarColor = (index: number): string => {
    if (index === 0) return '#ffd700';
    if (index === 1) return '#c0c0c0';
    if (index === 2) return '#cd7f32';
    return '#1a237e';
  };

  if (loading) {
    return <div className="page-title">加载中...</div>;
  }

  return (
    <div>
      <h1 className="page-title">
        {title} - 投票结果
        {isClosed && <span className="badge-closed">已截止</span>}
      </h1>
      <div className="card">
        <div className="vote-info">
          <h2>投票统计</h2>
          <p>参与人数：{voterCount} 人</p>
          <p>
            状态：
            {isConnected ? (
              <span style={{ color: '#4caf50' }}>● 实时更新中</span>
            ) : (
              <span style={{ color: '#ff9800' }}>○ 离线模式</span>
            )}
          </p>
        </div>

        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ marginBottom: '16px', color: '#1a237e' }}>得分柱状图</h3>
          <div style={{ width: '100%', height: 360 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 40, right: 30, left: 0, bottom: 60 }}
                key={animationKey}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis
                  dataKey="name"
                  angle={-25}
                  textAnchor="end"
                  height={60}
                  tick={{ fontSize: 12, fill: '#666' }}
                  interval={0}
                />
                <YAxis tick={{ fontSize: 12, fill: '#666' }} />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === 'score') return [value, '总得分'];
                    if (name === 'votes') return [value, '投票人数'];
                    if (name === 'avgRank') return [value, '平均排名'];
                    return [value, name];
                  }}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      return (payload[0].payload as { fullName: string }).fullName;
                    }
                    return label as string;
                  }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #eee' }}
                />
                <ReferenceLine
                  y={overallAvgRank}
                  stroke="#ff6f00"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{
                    value: `平均排名: ${overallAvgRank}`,
                    position: 'right',
                    fill: '#ff6f00',
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="score" radius={[8, 8, 0, 0]} animationDuration={800}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(index)} />
                  ))}
                  <LabelList
                    dataKey="score"
                    position="top"
                    fill="#1a237e"
                    fontSize={13}
                    fontWeight={600}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h3 style={{ marginBottom: '16px', color: '#1a237e' }}>排名列表</h3>
          <div
            style={{
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 2px 12px rgba(26, 35, 126, 0.1)',
            }}
          >
            {sortedScores.map((item, index) => (
              <div
                key={item.optionId}
                style={{
                  ...getMedalStyle(index),
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  borderBottom: index < sortedScores.length - 1 ? '1px solid #eee' : 'none',
                  background:
                    index >= 3
                      ? index % 2 === 0
                        ? 'white'
                        : '#f8f9ff'
                      : undefined,
                  transition: 'all 0.3s ease',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: index < 3 ? 'white' : '#1a237e',
                    color: index < 3 ? '#1a237e' : 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '18px',
                    flexShrink: 0,
                    boxShadow: index < 3 ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
                    {item.text}
                  </div>
                  <div style={{ fontSize: '13px', color: '#666' }}>
                    {item.voteCount} 人投票 · 平均排名 {item.averageRank.toFixed(2)}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '28px',
                    fontWeight: 800,
                    color: '#ff6f00',
                    fontVariantNumeric: 'tabular-nums',
                    minWidth: '80px',
                    textAlign: 'right',
                  }}
                >
                  <AnimatedNumber value={item.displayedScore} />
                </div>
                <div style={{ fontSize: '14px', color: '#999', width: '40px' }}>分</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
          <button className="btn btn-secondary" onClick={() => navigate(`/vote/${id}`)} style={{ flex: 1 }}>
            返回投票
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/')} style={{ flex: 1 }}>
            创建新投票
          </button>
        </div>
      </div>
    </div>
  );
}
