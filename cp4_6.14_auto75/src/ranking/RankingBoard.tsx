import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import ApiClient, { type ApiRankingEntry } from '../api/ApiClient';

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const RankingBoard: React.FC = () => {
  const [list, setList] = useState<ApiRankingEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const prevIdsRef = useRef<Set<string>>(new Set());
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ApiClient.getRanking(100);
      const idOf = (e: ApiRankingEntry) => `${e.rank}-${e.playerName}-${e.score}`;

      const newIds = new Set(data.map(idOf));
      const changed = new Set<string>();
      if (prevIdsRef.current.size > 0) {
        data.forEach((e) => {
          const id = idOf(e);
          if (!prevIdsRef.current.has(id)) changed.add(id);
        });
      }
      prevIdsRef.current = newIds;
      if (changed.size > 0) {
        setFlashIds(changed);
        setTimeout(() => setFlashIds(new Set()), 820);
      }
      setList(data);
    } catch (e) {
      console.warn('排行加载失败', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 5000);
    return () => clearInterval(timer);
  }, [fetchData]);

  const rankClass = (r: number) =>
    r === 1 ? 'rank-1' : r === 2 ? 'rank-2' : r === 3 ? 'rank-3' : 'rank-other';

  return (
    <div className="ranking-board">
      <div className="ranking-header">
        <div className="ranking-title">🏆 全球排行榜</div>
        <button
          className="game-btn btn-primary"
          onClick={fetchData}
          disabled={loading}
        >
          <RefreshCw size={14} style={{ marginRight: 6 }} />
          {loading ? '刷新中' : '手动刷新'}
        </button>
      </div>
      <div style={{ maxHeight: '72vh', overflowY: 'auto' }}>
        <table className="ranking-table">
          <thead>
            <tr>
              <th style={{ width: 56 }}>排名</th>
              <th>玩家名</th>
              <th style={{ width: 72 }}>得分</th>
              <th style={{ width: 72 }}>准确率</th>
              <th style={{ width: 72 }}>用时</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8', padding: 20 }}>
                  暂无数据
                </td>
              </tr>
            )}
            {list.map((e) => {
              const id = `${e.rank}-${e.playerName}-${e.score}`;
              return (
                <tr
                  key={id}
                  className={flashIds.has(id) ? 'row-highlight' : ''}
                >
                  <td>
                    <span className={`rank-num ${rankClass(e.rank)}`}>
                      {e.rank}
                    </span>
                  </td>
                  <td style={{ color: '#e2e8f0' }}>{e.playerName}</td>
                  <td style={{ color: '#fcd34d', fontWeight: 700 }}>{e.score}</td>
                  <td>{e.accuracy.toFixed(1)}%</td>
                  <td>{formatDuration(e.duration)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RankingBoard;
