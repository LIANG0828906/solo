import React, { useState, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import type { PlayerRecord } from '../types';

export default function LeaderboardPage() {
  const records = useGameStore((s) => s.records);
  const tracks = useGameStore((s) => s.tracks);
  const [filterTrackId, setFilterTrackId] = useState('');

  const filtered = useMemo(() => {
    const list = filterTrackId
      ? records.filter((r) => r.trackId === filterTrackId)
      : records;
    return [...list].sort((a, b) => a.time - b.time);
  }, [records, filterTrackId]);

  const attemptsMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of records) {
      const key = r.trackId + '|' + r.nickname;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [records]);

  const uniquePlayers = useMemo(
    () => new Set(filtered.map((r) => r.nickname)).size,
    [filtered]
  );

  const getRankClass = (rank: number) => {
    if (rank === 1) return 'rank-gold';
    if (rank === 2) return 'rank-silver';
    if (rank === 3) return 'rank-bronze';
    return '';
  };

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  return (
    <div className="leaderboard-page">
      <h2 style={{ color: '#00f5d4' }}>排行榜</h2>

      <div className="filter-section">
        <select
          value={filterTrackId}
          onChange={(e) => setFilterTrackId(e.target.value)}
          className="cyberpunk-select"
        >
          <option value="">全部赛道</option>
          {tracks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div className="leaderboard">
        {filtered.length === 0 ? (
          <p style={{ color: 'gray', textAlign: 'center' }}>暂无记录</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>排名</th>
                <th>赛道</th>
                <th>玩家</th>
                <th>完成时间</th>
                <th>挑战次数</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record, index) => {
                const rank = index + 1;
                const attempts = attemptsMap.get(record.trackId + '|' + record.nickname) ?? 1;
                return (
                  <tr key={record.id} className={getRankClass(rank)}>
                    <td>{getRankDisplay(rank)}</td>
                    <td>{record.trackName}</td>
                    <td>{record.nickname}</td>
                    <td>{(record.time / 1000).toFixed(2) + 's'}</td>
                    <td>{attempts}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="leaderboard-stats">
        总记录数: {filtered.length} &nbsp;|&nbsp; 独立玩家数: {uniquePlayers}
      </div>
    </div>
  );
}
