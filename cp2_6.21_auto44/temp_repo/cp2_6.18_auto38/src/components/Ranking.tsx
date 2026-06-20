import React, { memo, useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useWishStore, Wish, Priority } from '../store';
import { formatHotScore } from '../utils/rankCalculator';

const priorityColors: Record<Priority, string> = {
  high: '#E74C3C',
  medium: '#F39C12',
  low: '#27AE60'
};

function RankingComponent() {
  const { wishes, ranking, updateRanking, lastRankingUpdate, toggleFavorite, isFavorite } = useWishStore();
  const [animateKey, setAnimateKey] = useState(0);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    updateRanking();
  }, []);

  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    const rankingInterval = setInterval(() => {
      updateRanking();
      setAnimateKey((k) => k + 1);
    }, 5000);

    return () => {
      clearInterval(rankingInterval);
      clearInterval(countdownInterval);
    };
  }, [updateRanking]);

  const rankingWithDetails = ranking
    .map((r) => {
      const wish = wishes.find((w) => w.id === r.id);
      return wish ? { ...r, wish } : null;
    })
    .filter((r): r is typeof r & { wish: Wish } => r !== null);

  const chartData = rankingWithDetails.slice(0, 10).map((r, index) => ({
    name: `#${index + 1}`,
    fullName: r.wish.title.length > 12 ? r.wish.title.slice(0, 12) + '...' : r.wish.title,
    hotScore: Number(r.hotScore.toFixed(1)),
    favorites: r.favorites,
    comments: r.comments,
    color: priorityColors[r.wish.priority]
  }));

  const formatLastUpdate = () => {
    const date = new Date(lastRankingUpdate);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
  };

  return (
    <div key={animateKey} style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 28, color: '#2c3e50' }}>
            🏆 热门愿望排行榜
          </h1>
          <p style={{ margin: '8px 0 0', color: '#7f8c8d', fontSize: 14 }}>
            根据收藏数（权重70%）和评论数（权重30%）综合计算热度
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: 13,
            color: '#95a5a6'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#2ECC71',
                animation: 'pulse 1s infinite'
              }}
            />
            {countdown}s 后刷新
          </span>
          <span>最后更新: {formatLastUpdate()}</span>
        </div>
      </div>

      {chartData.length > 0 && (
        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: 12,
            padding: 24,
            marginBottom: 24,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          <h3
            style={{
              margin: '0 0 16px',
              fontSize: 16,
              color: '#2c3e50',
              fontWeight: 600
            }}
          >
            📊 热度趋势 TOP 10
          </h3>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 40 }}
              >
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#7f8c8d' }}
                  axisLine={{ stroke: '#ecf0f1' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#7f8c8d' }}
                  axisLine={{ stroke: '#ecf0f1' }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                    fontSize: 13
                  }}
                  formatter={(value: number, name: string, props: any) => {
                    if (name === 'hotScore') {
                      return [
                        `热度: ${value}分 (收藏${props.payload.favorites} + 评论${props.payload.comments})`,
                        props.payload.fullName
                      ];
                    }
                    return [value, name];
                  }}
                  cursor={{ fill: 'rgba(108, 99, 255, 0.05)' }}
                />
                <Bar
                  dataKey="hotScore"
                  radius={[6, 6, 0, 0]}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        index === 0
                          ? 'url(#goldGradient)'
                          : index === 1
                          ? 'url(#silverGradient)'
                          : index === 2
                          ? 'url(#bronzeGradient)'
                          : 'url(#defaultGradient)'
                      }
                    />
                  ))}
                </Bar>
                <defs>
                  <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFD700" />
                    <stop offset="100%" stopColor="#FFA500" />
                  </linearGradient>
                  <linearGradient id="silverGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C0C0C0" />
                    <stop offset="100%" stopColor="#A0A0A0" />
                  </linearGradient>
                  <linearGradient id="bronzeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#CD7F32" />
                    <stop offset="100%" stopColor="#B5651D" />
                  </linearGradient>
                  <linearGradient id="defaultGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6C63FF" />
                    <stop offset="100%" stopColor="#5A52D5" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr
              style={{
                backgroundColor: '#f8f9fa',
                borderBottom: '1px solid #ecf0f1'
              }}
            >
              <th
                style={{
                  padding: '16px 20px',
                  textAlign: 'left',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#7f8c8d',
                  width: 60
                }}
              >
                排名
              </th>
              <th
                style={{
                  padding: '16px 20px',
                  textAlign: 'left',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#7f8c8d'
                }}
              >
                愿望
              </th>
              <th
                style={{
                  padding: '16px 20px',
                  textAlign: 'center',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#7f8c8d',
                  width: 100
                }}
              >
                优先级
              </th>
              <th
                style={{
                  padding: '16px 20px',
                  textAlign: 'center',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#7f8c8d',
                  width: 80
                }}
              >
                ❤️
              </th>
              <th
                style={{
                  padding: '16px 20px',
                  textAlign: 'center',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#7f8c8d',
                  width: 80
                }}
              >
                💬
              </th>
              <th
                style={{
                  padding: '16px 20px',
                  textAlign: 'right',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#7f8c8d',
                  width: 120
                }}
              >
                热度分
              </th>
              <th
                style={{
                  padding: '16px 20px',
                  textAlign: 'center',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#7f8c8d',
                  width: 80
                }}
              >
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {rankingWithDetails.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    padding: 40,
                    textAlign: 'center',
                    color: '#95a5a6'
                  }}
                >
                  暂无排行榜数据
                </td>
              </tr>
            ) : (
              rankingWithDetails.map((r, index) => {
                const favorite = isFavorite(r.id);
                const rankBadge =
                  index === 0
                    ? { bg: 'linear-gradient(135deg, #FFD700, #FFA500)', color: '#fff' }
                    : index === 1
                    ? { bg: 'linear-gradient(135deg, #C0C0C0, #A0A0A0)', color: '#fff' }
                    : index === 2
                    ? { bg: 'linear-gradient(135deg, #CD7F32, #B5651D)', color: '#fff' }
                    : { bg: '#f1f2f6', color: '#636e72' };

                return (
                  <tr
                    key={r.id}
                    style={{
                      borderBottom:
                        index === rankingWithDetails.length - 1
                          ? 'none'
                          : '1px solid #f8f9fa',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                        '#fafbfc';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                        '#fff';
                    }}
                  >
                    <td style={{ padding: '16px 20px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          fontWeight: 700,
                          fontSize: 14,
                          background: rankBadge.bg,
                          color: rankBadge.color
                        }}
                      >
                        {index + 1}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div>
                        <div
                          style={{
                            fontSize: 15,
                            fontWeight: 500,
                            color: '#2c3e50',
                            marginBottom: 4
                          }}
                        >
                          {r.wish.title}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: '#95a5a6'
                          }}
                        >
                          📅 目标: {r.wish.targetDate} · 进度 {r.wish.progress}%
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 10px',
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 500,
                          color: priorityColors[r.wish.priority],
                          backgroundColor: `${priorityColors[r.wish.priority]}15`
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            backgroundColor: priorityColors[r.wish.priority]
                          }}
                        />
                        {r.wish.priority === 'high'
                          ? '高'
                          : r.wish.priority === 'medium'
                          ? '中'
                          : '低'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center', fontSize: 14, color: '#636e72' }}>
                      {r.favorites}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center', fontSize: 14, color: '#636e72' }}>
                      {r.comments}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '6px 14px',
                          borderRadius: 6,
                          background:
                            index < 3
                              ? 'linear-gradient(90deg, #6C63FF 0%, #8B7CF5 100%)'
                              : '#f1f2f6',
                          color: index < 3 ? '#fff' : '#2c3e50',
                          fontWeight: 600,
                          fontSize: 14
                        }}
                      >
                        {formatHotScore(r.hotScore)}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <button
                        onClick={() => toggleFavorite(r.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 6,
                          borderRadius: 6,
                          transition: 'background-color 0.2s'
                        }}
                        title={favorite ? '取消收藏' : '加入收藏'}
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill={favorite ? '#E74C3C' : 'none'}
                          stroke={favorite ? '#E74C3C' : '#999'}
                          strokeWidth="2"
                          style={{ transition: 'transform 0.2s' }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as SVGElement).style.transform = 'scale(1.15)';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as SVGElement).style.transform = 'scale(1)';
                          }}
                        >
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}

export const Ranking = memo(RankingComponent);
