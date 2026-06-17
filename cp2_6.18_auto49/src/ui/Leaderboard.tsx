import React, { useState, useEffect } from 'react';
import { LeaderboardEntry } from '../engine/types';
import './Leaderboard.css';

interface LeaderboardProps {
  currentScore?: number;
  playerName?: string;
  refreshTrigger?: number;
}

const STORAGE_KEY = 'leaderboard';
const MAX_ENTRIES = 10;

export const Leaderboard: React.FC<LeaderboardProps> = ({
  currentScore,
  playerName = '匿名玩家',
  refreshTrigger = 0,
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [highlightIndex, setHighlightIndex] = useState<number>(-1);

  useEffect(() => {
    loadLeaderboard();
  }, [refreshTrigger]);

  useEffect(() => {
    if (currentScore !== undefined && currentScore > 0) {
      addScore(currentScore, playerName);
    }
  }, [currentScore]);

  const loadLeaderboard = (): void => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data) as LeaderboardEntry[];
        setEntries(parsed);
      }
    } catch (e) {
      console.error('Failed to load leaderboard:', e);
    }
  };

  const saveLeaderboard = (entriesToSave: LeaderboardEntry[]): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entriesToSave));
    } catch (e) {
      console.error('Failed to save leaderboard:', e);
    }
  };

  const addScore = (score: number, name: string): void => {
    const newEntry: LeaderboardEntry = {
      name,
      score,
      timestamp: Date.now(),
    };

    const updated = [...entries, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_ENTRIES)
      .map((e, i) => ({ ...e, rank: i + 1 }));

    const index = updated.findIndex(
      (e) => e.timestamp === newEntry.timestamp && e.score === newEntry.score
    );
    
    if (index !== -1) {
      setHighlightIndex(index);
      setTimeout(() => setHighlightIndex(-1), 3000);
    }

    saveLeaderboard(updated);
    setEntries(updated);
  };

  const getRankColor = (rank: number): string => {
    switch (rank) {
      case 1:
        return '#FFD700';
      case 2:
        return '#C0C0C0';
      case 3:
        return '#CD7F32';
      default:
        return '#FFFFFF';
    }
  };

  const getRankEmoji = (rank: number): string => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return '';
    }
  };

  return (
    <div className="leaderboard-container">
      <h3 className="leaderboard-title">排行榜</h3>
      
      {entries.length === 0 ? (
        <div className="leaderboard-empty">
          <p>暂无记录</p>
          <p className="empty-hint">开始游戏创造你的记录吧！</p>
        </div>
      ) : (
        <div className="leaderboard-list">
          {entries.map((entry, index) => (
            <div
              key={`${entry.timestamp}-${index}`}
              className={`leaderboard-item ${
                index === highlightIndex ? 'highlight' : ''
              }`}
            >
              <span 
                className="rank"
                style={{ color: getRankColor(entry.rank || index + 1) }}
              >
                {getRankEmoji(entry.rank || index + 1)}
                <span className="rank-number">{entry.rank || index + 1}</span>
              </span>
              <span className="name">{entry.name}</span>
              <span 
                className="score"
                style={{ color: getRankColor(entry.rank || index + 1) }}
              >
                {entry.score.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
