import { useEffect, useState } from 'react';
import { useLeaderboardStore } from '@/store/useLeaderboardStore';
import { useTrackStore } from '@/store/useTrackStore';
import { LeaderboardEntry } from '@/types';

export default function Leaderboard() {
  const { entries, loadEntries, getEntriesByTrack } = useLeaderboardStore();
  const { tracks, currentTrackId, setCurrentTrackId, loadTracks } = useTrackStore();
  const [sortedEntries, setSortedEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    loadEntries();
    loadTracks();
  }, [loadEntries, loadTracks]);

  useEffect(() => {
    if (currentTrackId) {
      setSortedEntries(getEntriesByTrack(currentTrackId));
    } else {
      const allEntries = [...entries].sort((a, b) => a.time - b.time);
      setSortedEntries(allEntries);
    }
  }, [entries, currentTrackId, getEntriesByTrack]);

  const formatTime = (seconds: number) => {
    return seconds.toFixed(2) + 's';
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) {
      return {
        background: 'linear-gradient(135deg, rgba(255, 190, 11, 0.2), rgba(251, 86, 7, 0.2))',
        borderColor: '#ffbe0b',
        boxShadow: '0 0 15px rgba(255, 190, 11, 0.3)',
      };
    }
    if (rank === 2) {
      return {
        background: 'linear-gradient(135deg, rgba(192, 192, 192, 0.2), rgba(128, 128, 128, 0.2))',
        borderColor: '#c0c0c0',
        boxShadow: '0 0 10px rgba(192, 192, 192, 0.2)',
      };
    }
    if (rank === 3) {
      return {
        background: 'linear-gradient(135deg, rgba(205, 127, 50, 0.2), rgba(139, 69, 19, 0.2))',
        borderColor: '#cd7f32',
        boxShadow: '0 0 10px rgba(205, 127, 50, 0.2)',
      };
    }
    return {
      background: 'rgba(255, 255, 255, 0.02)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      boxShadow: 'none',
    };
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="glass rounded-xl p-6 h-full">
      <h2
        className="text-2xl font-bold mb-6"
        style={{
          color: 'var(--neon-cyan)',
          textShadow: '0 0 15px rgba(0, 245, 212, 0.5)',
        }}
      >
        排行榜
      </h2>

      <div className="mb-6">
        <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
          选择赛道
        </label>
        <select
          value={currentTrackId || ''}
          onChange={(e) => setCurrentTrackId(e.target.value || null)}
          className="w-full px-4 py-2 rounded-lg bg-transparent border focus:outline-none transition-all"
          style={{
            borderColor: 'rgba(0, 245, 212, 0.3)',
            color: 'var(--text-primary)',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
          }}
        >
          <option value="" style={{ color: '#000' }}>
            全部赛道
          </option>
          {tracks.map((track) => (
            <option key={track.id} value={track.id} style={{ color: '#000' }}>
              {track.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
        {sortedEntries.length === 0 ? (
          <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>
            <p className="text-lg mb-2">暂无记录</p>
            <p className="text-sm">快去竞技场挑战吧！</p>
          </div>
        ) : (
          sortedEntries.map((entry, index) => {
            const rank = index + 1;
            const style = getRankStyle(rank);
            return (
              <div
                key={entry.id}
                className="p-4 rounded-lg border transition-all hover:scale-[1.02]"
                style={style}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 flex items-center justify-center rounded-full text-lg font-bold"
                    style={{
                      background: rank <= 3 ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                      color: rank === 1 ? '#ffbe0b' : rank === 2 ? '#c0c0c0' : rank === 3 ? '#cd7f32' : 'var(--text-secondary)',
                    }}
                  >
                    {getRankBadge(rank)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                        {entry.playerName}
                      </span>
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {entry.trackName} · {formatDate(entry.timestamp)}
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className="text-xl font-bold mono-text"
                      style={{
                        color: rank === 1 ? '#ffbe0b' : 'var(--neon-cyan)',
                        textShadow: rank === 1 ? '0 0 10px rgba(255, 190, 11, 0.5)' : '0 0 10px rgba(0, 245, 212, 0.3)',
                      }}
                    >
                      {formatTime(entry.time)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-6 pt-4 border-t" style={{ borderColor: 'rgba(0, 245, 212, 0.2)' }}>
        <div className="flex justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
          <span>总记录数</span>
          <span className="font-bold" style={{ color: 'var(--neon-cyan)' }}>
            {sortedEntries.length}
          </span>
        </div>
      </div>
    </div>
  );
}
