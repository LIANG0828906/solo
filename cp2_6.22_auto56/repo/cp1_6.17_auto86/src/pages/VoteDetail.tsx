import React, { useEffect, useState } from 'react';
import { useVoteStore } from '../store/voteStore';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#6C63FF', '#E74C3C', '#27AE60', '#F39C12', '#3498DB', '#9B59B6', '#1ABC9C', '#E67E22'];

export default function VoteDetail({
  voteId,
  onBack,
}: {
  voteId: string;
  onBack: () => void;
}) {
  const { currentVote, loading, fetchVoteDetail, submitVote, votedMap } =
    useVoteStore();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchVoteDetail(voteId);
  }, [voteId, fetchVoteDetail]);

  const hasVoted = !!votedMap[voteId];

  const handleVote = async (optionId: string) => {
    if (hasVoted) return;
    await submitVote(voteId, optionId);
  };

  if (loading && !currentVote) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
        加载中...
      </div>
    );
  }

  if (!currentVote) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
        投票不存在
      </div>
    );
  }

  const totalVotes = currentVote.totalVotes || 1;

  const pieData = currentVote.options.map((opt) => ({
    name: opt.text,
    value: opt.votes,
  }));

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          padding: '28px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          marginBottom: 20,
        }}
        className="vote-detail-card"
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              color: '#6C63FF',
              fontSize: '16px',
              cursor: 'pointer',
              marginRight: 12,
              padding: '4px 8px',
            }}
          >
            ← 返回
          </button>
          <h2
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#2C3E50',
              flex: 1,
            }}
          >
            {currentVote.title}
          </h2>
        </div>
        {currentVote.description && (
          <p
            style={{
              fontSize: '15px',
              color: '#6B7280',
              lineHeight: 1.6,
              marginBottom: 20,
              whiteSpace: 'pre-line',
            }}
          >
            {currentVote.description}
          </p>
        )}

        {hasVoted && (
          <div
            style={{
              background: '#ECFDF5',
              color: '#059669',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            ✓ 你已完成投票
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {currentVote.options.map((opt, i) => {
            const pct = totalVotes > 0 ? (opt.votes / totalVotes) * 100 : 0;
            const isVotedOption = votedMap[voteId] === opt.id;

            return (
              <div
                key={opt.id}
                onClick={() => handleVote(opt.id)}
                style={{
                  background: '#F8F9FA',
                  borderRadius: '8px',
                  padding: '12px',
                  cursor: hasVoted ? 'default' : 'pointer',
                  transition: 'all 0.2s ease',
                  border: isVotedOption ? '2px solid #6C63FF' : '2px solid transparent',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  if (!hasVoted) {
                    (e.currentTarget as HTMLElement).style.transform =
                      'translateY(-2px)';
                    (e.currentTarget as HTMLElement).style.boxShadow =
                      '0 4px 12px rgba(0,0,0,0.08)';
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform =
                    'translateY(0)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    width: `${pct}%`,
                    background: isVotedOption
                      ? '#6C63FF25'
                      : `${COLORS[i % COLORS.length]}18`,
                    transition: 'width 0.6s ease-in-out',
                    borderRadius: '8px',
                  }}
                />
                <div
                  style={{
                    position: 'relative',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '15px', color: '#333', fontWeight: 500 }}>
                    {isVotedOption && '✓ '}{opt.text}
                  </span>
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#6C63FF',
                      flexShrink: 0,
                      marginLeft: 8,
                    }}
                  >
                    {opt.votes} 票 ({pct.toFixed(1)}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          padding: '28px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          textAlign: 'center',
        }}
        className="vote-detail-card"
      >
        <h3
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: '#2C3E50',
            marginBottom: 20,
          }}
        >
          投票结果看板
        </h3>

        <div className="pie-chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                dataKey="value"
                animationBegin={0}
                animationDuration={600}
                onMouseEnter={(_, index) => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {pieData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    stroke="none"
                    style={{
                      transition: 'opacity 0.2s ease',
                      opacity:
                        hoveredIndex !== null && hoveredIndex !== index
                          ? 0.6
                          : 1,
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => {
                  const pct = ((value / totalVotes) * 100).toFixed(1);
                  return [`${value} 票 (${pct}%)`, name];
                }}
                contentStyle={{
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  fontSize: '14px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div
          style={{
            marginTop: '-30px',
            fontSize: '28px',
            fontWeight: 700,
            color: '#2C3E50',
          }}
          className="pie-center-label"
        >
          {currentVote.totalVotes}
          <div style={{ fontSize: '13px', fontWeight: 500, color: '#9CA3AF' }}>
            总投票数
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '12px 20px',
            marginTop: 16,
          }}
        >
          {currentVote.options.map((opt, i) => (
            <div
              key={opt.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '13px',
                color: '#6B7280',
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: COLORS[i % COLORS.length],
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              />
              {opt.text}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .vote-detail-card {
            padding: 16px !important;
          }
          .pie-chart-container .recharts-responsive-container {
            height: 240px !important;
          }
        }
        @media (max-width: 480px) {
          .vote-detail-card {
            padding: 8px !important;
          }
          .pie-chart-container .recharts-responsive-container {
            height: 200px !important;
          }
          .pie-center-label {
            font-size: 22px !important;
          }
        }
      `}</style>
    </div>
  );
}
