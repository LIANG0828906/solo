import React, { memo, useMemo } from 'react';
import type { GameRecord, Player } from './types';
import { PLAYER1_CONFIG, PLAYER2_CONFIG } from './types';

interface HistoryPanelProps {
  records: GameRecord[];
}

const formatTime = (ts: number): string => {
  try {
    const d = new Date(ts);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const now = new Date();
    const sameDay =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
    if (sameDay) {
      return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
};

const getWinnerText = (winner: Player | 'draw'): { text: string; cls: string } => {
  if (winner === 'draw') {
    return { text: '平局', cls: 'draw' };
  }
  if (winner === 'player1') {
    return { text: `${PLAYER1_CONFIG.name}胜`, cls: 'player1' };
  }
  return { text: `${PLAYER2_CONFIG.name}胜`, cls: 'player2' };
};

const HistoryPanel: React.FC<HistoryPanelProps> = memo(function HistoryPanel({ records }) {
  const displayRecords = useMemo(() => records.slice(0, 5), [records]);

  return (
    <div className="history-panel" role="region" aria-label="历史对局记录">
      <h3 className="history-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        最近对局
      </h3>

      {displayRecords.length === 0 ? (
        <div className="history-empty" role="status">暂无对局记录，开始第一局吧！</div>
      ) : (
        <ul className="history-list" role="list">
          {displayRecords.map((rec) => {
            const winner = getWinnerText(rec.winner);
            return (
              <li className="history-item" key={rec.id} role="listitem">
                <div className="history-matchup" title={`${rec.player1Name} vs ${rec.player2Name}`}>
                  <span style={{ color: PLAYER1_CONFIG.color, fontWeight: 600 }}>
                    {rec.player1Name}
                  </span>
                  <span className="history-vs">vs</span>
                  <span style={{ color: PLAYER2_CONFIG.color, fontWeight: 600 }}>
                    {rec.player2Name}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className={`history-winner ${winner.cls}`}>
                    <span className={`color-dot ${winner.cls === 'draw' ? '' : winner.cls}`} style={{ backgroundColor: winner.cls === 'draw' ? '#F59E0B' : undefined }} aria-hidden="true" />
                    {winner.text}
                  </span>
                  <span className="history-time">{formatTime(rec.timestamp)}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
});

export default HistoryPanel;
