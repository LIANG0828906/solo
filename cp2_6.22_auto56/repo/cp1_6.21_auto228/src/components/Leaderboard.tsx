import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLeaderboard, deleteLeaderboardEntry } from '../api/client';
import { LeaderboardEntry } from '../types/game';
import './Leaderboard.css';

const Leaderboard: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await getLeaderboard();
      if (response.success) {
        const sorted = [...response.entries].sort((a, b) => 
          Math.max(b.score1, b.score2) - Math.max(a.score1, a.score2)
        );
        setEntries(sorted);
      }
      setError(null);
    } catch (err) {
      setError('无法加载排行榜数据');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteLeaderboardEntry(id);
      setEntries(entries.filter(e => e.id !== id));
    } catch (err) {
      console.error('Failed to delete entry:', err);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('zh-CN');
  };

  const handleBack = () => {
    navigate('/');
  };

  const getWinnerClass = (entry: LeaderboardEntry): string => {
    if (entry.winner === entry.player1) return 'winner-p1';
    if (entry.winner === entry.player2) return 'winner-p2';
    return 'winner-draw';
  };

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-container">
        <div className="leaderboard-header">
          <h1 className="leaderboard-title">
            <span className="title-icon">🏆</span>
            银河排行榜
          </h1>
          <button className="back-btn" onClick={handleBack}>
            ← 返回主菜单
          </button>
        </div>

        <div className="leaderboard-content">
          {loading && (
            <div className="loading-state">
              <div className="spinner" />
              <p>加载中...</p>
            </div>
          )}

          {error && (
            <div className="error-state">
              <p>❌ {error}</p>
              <button className="retry-btn" onClick={fetchLeaderboard}>
                重试
              </button>
            </div>
          )}

          {!loading && !error && entries.length === 0 && (
            <div className="empty-state">
              <p className="empty-icon">📊</p>
              <p>暂无游戏记录</p>
              <p className="empty-hint">完成一局游戏后记录将显示在这里</p>
            </div>
          )}

          {!loading && !error && entries.length > 0 && (
            <div className="entries-table-container">
              <table className="entries-table">
                <thead>
                  <tr>
                    <th className="rank-col">排名</th>
                    <th>玩家1</th>
                    <th>玩家2</th>
                    <th>获胜方</th>
                    <th>回合</th>
                    <th>统治分</th>
                    <th>时长</th>
                    <th>日期</th>
                    <th className="action-col">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, index) => (
                    <tr key={entry.id} className="entry-row">
                      <td className="rank-col">
                        <span className={`rank rank-${index + 1}`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="player-name p1">{entry.player1}</td>
                      <td className="player-name p2">{entry.player2}</td>
                      <td>
                        <span className={`winner-badge ${getWinnerClass(entry)}`}>
                          {entry.winner === '平局' ? '🤝' : '👑'} {entry.winner}
                        </span>
                      </td>
                      <td className="turns-col">{entry.turns}</td>
                      <td className="score-col">
                        <span className="score-p1">{entry.score1}</span>
                        {' : '}
                        <span className="score-p2">{entry.score2}</span>
                      </td>
                      <td className="duration-col">{formatDuration(entry.duration)}</td>
                      <td className="date-col">{formatDate(entry.timestamp)}</td>
                      <td className="action-col">
                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(entry.id)}
                          title="删除记录"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="auto-refresh-note">
          🔄 每5秒自动刷新
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
