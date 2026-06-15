import { useState, useEffect, useCallback } from 'react';
import { getTopTen, formatDuration, clearAll } from './StorageService';
import type { LeaderboardEntry } from '@/types';
import './Leaderboard.css';

interface LeaderboardProps {
  latestEntryId?: string | null;
  refreshTrigger?: number;
}

const Leaderboard = ({ latestEntryId, refreshTrigger }: LeaderboardProps) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const loadEntries = useCallback(() => {
    const topTen = getTopTen();
    setEntries(topTen);
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries, refreshTrigger]);

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    });
  };

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要清空排行榜吗？')) {
      clearAll();
      loadEntries();
    }
  };

  const getRankBadge = (rank: number): string => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}`;
  };

  if (!isVisible) {
    return (
      <button className="leaderboard-toggle collapsed" onClick={() => setIsVisible(true)}>
        🏆
      </button>
    );
  }

  return (
    <div className={`leaderboard-card ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="leaderboard-header" onClick={handleToggle}>
        <div className="header-left">
          <span className="trophy-icon">🏆</span>
          <span className="header-title">排行榜</span>
          <span className="entry-count">({entries.length})</span>
        </div>
        <div className="header-right">
          <button
            className="clear-button"
            onClick={handleClear}
            title="清空排行榜"
          >
            🗑️
          </button>
          <span className="expand-icon">{isExpanded ? '▼' : '▲'}</span>
        </div>
      </div>

      {isExpanded && (
        <div className="leaderboard-content animate-fade-in">
          {entries.length === 0 ? (
            <div className="leaderboard-empty">
              <p>暂无记录</p>
              <p className="empty-hint">开始答题来创建你的第一条记录吧！</p>
            </div>
          ) : (
            <div className="leaderboard-list">
              {entries.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`leaderboard-item ${
                    entry.id === latestEntryId ? 'latest-entry' : ''
                  }`}
                >
                  <div className="rank-badge">
                    <span>{getRankBadge(index + 1)}</span>
                  </div>
                  <div className="entry-info">
                    <div className="entry-score">
                      <span className="score-number">{entry.score}</span>
                      <span className="score-label">分</span>
                    </div>
                    <div className="entry-meta">
                      <span className="meta-item">⏱ {formatDuration(entry.duration)}</span>
                      <span className="meta-item">🌍 {entry.countriesAnswered.length}国</span>
                      {entry.streak > 0 && (
                        <span className="meta-item streak-meta">🔥 {entry.streak}连击</span>
                      )}
                    </div>
                  </div>
                  <div className="entry-date">
                    {formatDate(entry.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!isExpanded && entries.length > 0 && (
        <div className="leaderboard-preview" onClick={handleToggle}>
          <div className="preview-top">
            <span className="preview-label">最高分</span>
            <span className="preview-score">{entries[0]?.score || 0}分</span>
          </div>
          <span className="expand-hint">点击展开</span>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
