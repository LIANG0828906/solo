import { useEffect, useRef } from 'react';
import type { BattleLogEntry } from '../../shared/types';
import './BattleLogPanel.css';

interface BattleLogPanelProps {
  logs: BattleLogEntry[];
  currentTurn: number;
  isPlaying: boolean;
}

export default function BattleLogPanel({ logs, currentTurn, isPlaying }: BattleLogPanelProps) {
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs.length]);

  return (
    <div className="battle-log-panel">
      <div className="log-header">
        <h3>战斗日志</h3>
        <span className="turn-indicator">
          第 {currentTurn} 回合
          {isPlaying && <span className="playing-dot" />}
        </span>
      </div>

      <div className="log-container" ref={logContainerRef}>
        {logs.length === 0 ? (
          <div className="empty-log">
            <p>等待战斗开始...</p>
          </div>
        ) : (
          <div className="log-list">
            {logs.map((entry) => (
              <div
                key={entry.id}
                className={`log-entry ${entry.actorTeam} ${entry.effect ? `effect-${entry.effect}` : ''}`}
              >
                <span className="log-turn">R{entry.turn}</span>
                <span className="log-actor">{entry.actor}</span>
                <span className="log-action">{entry.action}</span>
                {entry.damage !== undefined && (
                  <span className={`log-damage ${entry.actorTeam === 'player' ? 'dealt' : 'taken'}`}>
                    -{entry.damage}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
