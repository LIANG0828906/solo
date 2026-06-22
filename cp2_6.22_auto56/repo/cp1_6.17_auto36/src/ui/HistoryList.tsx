import { useState, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import type { GameRecord } from '../types';

export function HistoryList() {
  const { gameStatus, getHistory } = useGameStore((state) => ({
    gameStatus: state.gameStatus,
    getHistory: state.getHistory,
  }));

  const [records, setRecords] = useState<GameRecord[]>([]);

  useEffect(() => {
    setRecords(getHistory());
  }, [gameStatus, getHistory]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (records.length === 0) {
    return null;
  }

  return (
    <div className="history-list">
      <h4 className="history-title">历史记录</h4>
      <div className="history-items">
        {records.map((record) => (
          <div key={record.id} className="history-item">
            <span className={`history-result ${record.result}`}>
              {record.result === 'won' ? '胜利' : '失败'}
            </span>
            <span className="history-time">{formatTime(record.time)}</span>
            <span className="history-rooms">{record.roomsExplored}房</span>
            <span className="history-health">HP:{record.remainingHealth}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
