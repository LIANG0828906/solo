import React, { useEffect, useRef, useState } from 'react';
import { LeaderboardEntry, User } from '../types';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}

interface RankedEntry extends LeaderboardEntry {
  rank: number;
  previousRank: number;
  changeDirection: 'up' | 'down' | 'none';
  animateClass: string;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ entries, currentUserId }) => {
  const [rankedEntries, setRankedEntries] = useState<RankedEntry[]>([]);
  const previousRanks = useRef<Record<string, number>>({});
  const initialLoad = useRef(true);

  useEffect(() => {
    const newRankedEntries: RankedEntry[] = entries.map((entry, index) => {
      const rank = index + 1;
      const userId = entry.user?.id || '';
      const prevRank = previousRanks.current[userId] || rank;
      
      let changeDirection: 'up' | 'down' | 'none' = 'none';
      if (!initialLoad.current) {
        if (rank < prevRank) changeDirection = 'up';
        else if (rank > prevRank) changeDirection = 'down';
      }

      let animateClass = 'animate-fade-in';
      if (changeDirection === 'up') animateClass = 'animate-slide-up-row';
      if (changeDirection === 'down') animateClass = 'animate-flash-red';

      previousRanks.current[userId] = rank;

      return {
        ...entry,
        rank,
        previousRank: prevRank,
        changeDirection,
        animateClass,
      };
    });

    setRankedEntries(newRankedEntries);
    initialLoad.current = false;
  }, [entries]);

  const getRankStyle = (rank: number): React.CSSProperties => {
    if (rank === 1) return { background: 'linear-gradient(135deg, #ffd700, #ffed4e)', color: '#1a1a1a' };
    if (rank === 2) return { background: 'linear-gradient(135deg, #c0c0c0, #e8e8e8)', color: '#1a1a1a' };
    if (rank === 3) return { background: 'linear-gradient(135deg, #cd7f32, #daa06d)', color: '#fff' };
    return { background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-secondary)' };
  };

  return (
    <div className="glass-card">
      <h3 style={{
        fontSize: '22px',
        fontWeight: 600,
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        🏆 排行榜
        <span style={{
          fontSize: '13px',
          fontWeight: 400,
          color: 'var(--text-muted)',
        }}>
          每15秒自动刷新
        </span>
      </h3>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              <th style={headerStyle}>排名</th>
              <th style={headerStyle}>用户</th>
              <th style={headerStyle}>累计成绩</th>
              <th style={headerStyle}>打卡天数</th>
            </tr>
          </thead>
          <tbody>
            {rankedEntries.map((entry) => {
              const isCurrentUser = entry.user?.id === currentUserId;
              
              return (
                <tr
                  key={entry.user?.id || entry.rank}
                  className={entry.animateClass}
                  style={{
                    ...rowStyle,
                    ...(isCurrentUser ? {
                      background: 'rgba(255, 140, 0, 0.15)',
                      animation: 'glow 2s ease-in-out infinite',
                    } : {}),
                  }}
                >
                  <td style={cellStyle}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      ...getRankStyle(entry.rank),
                    }}>
                      {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
                    </span>
                  </td>
                  <td style={cellStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img
                        src={entry.user?.avatar}
                        alt={entry.user?.nickname}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 500 }}>
                          {entry.user?.nickname || '未知用户'}
                          {isCurrentUser && (
                            <span style={{
                              marginLeft: '8px',
                              padding: '2px 8px',
                              borderRadius: '8px',
                              fontSize: '11px',
                              background: 'var(--accent-orange)',
                              color: 'white',
                            }}>
                              我
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {entry.user?.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ ...cellStyle, color: 'var(--accent-orange)', fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {entry.changeDirection === 'up' && (
                        <span style={{ color: '#52c41a', fontSize: '14px' }}>↑</span>
                      )}
                      {entry.changeDirection === 'down' && (
                        <span style={{ color: '#ff4d4f', fontSize: '14px' }}>↓</span>
                      )}
                      {entry.total.toLocaleString()}
                    </div>
                  </td>
                  <td style={cellStyle}>
                    {entry.records} 天
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {entries.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: 'var(--text-muted)',
        }}>
          暂无排行数据
        </div>
      )}
    </div>
  );
};

const headerStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '12px 16px',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  fontSize: '14px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const cellStyle: React.CSSProperties = {
  padding: '16px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  fontSize: '15px',
};

const rowStyle: React.CSSProperties = {
  transition: 'background-color 0.3s ease',
};

export default Leaderboard;
