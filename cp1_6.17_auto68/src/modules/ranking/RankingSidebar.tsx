import React, { useEffect, useState } from 'react';
import { useRankingStore } from './RankingStore';

const getRankColor = (rank: number): string => {
  if (rank <= 3) return '#FFD700';
  if (rank <= 6) return '#C0C0C0';
  return '#CD7F32';
};

const getRankBgColor = (rank: number): string => {
  if (rank <= 3) return 'rgba(255, 215, 0, 0.1)';
  if (rank <= 6) return 'rgba(192, 192, 192, 0.1)';
  return 'rgba(205, 127, 50, 0.1)';
};

export const RankingSidebar: React.FC = () => {
  const { rankings, isRefreshing, startPolling, stopPolling } = useRankingStore();
  const [fadeKey, setFadeKey] = useState(0);
  const [prevRefreshing, setPrevRefreshing] = useState(false);

  useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  useEffect(() => {
    if (prevRefreshing && !isRefreshing) {
      setFadeKey(prev => prev + 1);
    }
    setPrevRefreshing(isRefreshing);
  }, [isRefreshing, prevRefreshing]);

  const scrollToIdea = (id: string) => {
    const element = document.getElementById(`idea-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <aside
      style={{
        width: '280px',
        minWidth: '280px',
        background: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        padding: '20px',
        height: 'fit-content',
        position: 'sticky',
        top: '80px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: '#2C3E50',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
          </svg>
          实时排行榜
        </h2>
        {isRefreshing && (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#5A6B7C"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ animation: 'spin 1s linear infinite' }}
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        )}
      </div>

      <div
        key={fadeKey}
        style={{
          animation: 'fadeIn 0.3s ease'
        }}
      >
        {rankings.length === 0 ? (
          <p style={{ color: '#5A6B7C', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
            暂无排行数据
          </p>
        ) : (
          <div>
            {rankings.map((item, index) => {
              const rank = index + 1;
              return (
                <div key={item.id}>
                  <div
                    onClick={() => scrollToIdea(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px 10px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'background 0.2s ease',
                      background: getRankBgColor(rank)
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background = 'rgba(44, 62, 80, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background = getRankBgColor(rank);
                    }}
                  >
                    <span
                      style={{
                        fontSize: '16px',
                        fontWeight: 800,
                        color: getRankColor(rank),
                        width: '28px',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {rank <= 3 ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill={getRankColor(rank)}>
                          {rank === 1 ? (
                            <path d="M12 2l2.39 7.36H22l-6.19 4.5L18.18 21 12 16.5 5.82 21l2.37-7.14L2 9.36h7.61z" />
                          ) : rank === 2 ? (
                            <path d="M12 2l2.39 7.36H22l-6.19 4.5L18.18 21 12 16.5 5.82 21l2.37-7.14L2 9.36h7.61z" />
                          ) : (
                            <path d="M12 2l2.39 7.36H22l-6.19 4.5L18.18 21 12 16.5 5.82 21l2.37-7.14L2 9.36h7.61z" />
                          )}
                        </svg>
                      ) : (
                        rank
                      )}
                    </span>
                    <div style={{ flex: 1, minWidth: 0, marginLeft: '8px' }}>
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#2C3E50',
                          lineHeight: '1.3',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {item.title}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '10px', flexShrink: 0 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#E74C3C" stroke="#E74C3C" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#E74C3C' }}>
                        {item.likes}
                      </span>
                    </div>
                  </div>
                  {index < rankings.length - 1 && (
                    <div style={{ height: '1px', background: '#E9ECEF', margin: '4px 0' }} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </aside>
  );
};
