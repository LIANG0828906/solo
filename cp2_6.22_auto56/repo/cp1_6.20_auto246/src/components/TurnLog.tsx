import React, { useState } from 'react';
import { LogEntry, ActionType } from '../game/types';
import './TurnLog.css';

interface TurnLogProps {
  logs: LogEntry[];
  turn: number;
}

const actionIcons: Record<ActionType, string> = {
  play: '🃏',
  attack: '👊',
  spell: '⚡',
  hero_power: '✨',
  end_turn: '⏭️'
};

const actionLabels: Record<ActionType, string> = {
  play: '出牌',
  attack: '攻击',
  spell: '法术',
  hero_power: '英雄技能',
  end_turn: '结束回合'
};

const TurnLog: React.FC<TurnLogProps> = ({ logs, turn }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const turnLogs = logs.filter(log => log.turn === turn);

  return (
    <div className={`turn-log ${isExpanded ? 'expanded' : ''}`}>
      <div className="log-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="log-header-left">
          <span className="log-icon">📜</span>
          <span className="log-title">回合日志</span>
        </div>
        <div className="log-header-right">
          <span className="log-turn">回合 {turn}</span>
          <span className="log-count">{turnLogs.length} 个行动</span>
          <span className="log-toggle">{isExpanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {isExpanded && (
        <div className="log-content">
          {turnLogs.length === 0 ? (
            <div className="log-empty">
              <p>本回合暂无行动记录</p>
              <p className="log-hint">打出卡牌或发起攻击以产生记录</p>
            </div>
          ) : (
            <div className="log-timeline">
              {turnLogs.map((log, index) => (
                <div key={log.id} className="log-item">
                  <div className="log-timeline-connector">
                    <div
                      className="log-dot"
                      style={{ background: getActionColor(log.action) }}
                    >
                      {actionIcons[log.action]}
                    </div>
                    {index < turnLogs.length - 1 && <div className="log-line" />}
                  </div>
                  <div className="log-item-content">
                    <div className="log-item-header">
                      <span
                        className="log-action-label"
                        style={{ color: getActionColor(log.action) }}
                      >
                        {actionLabels[log.action]}
                      </span>
                      <span className="log-time">
                        {formatTime(log.timestamp)}
                      </span>
                    </div>
                    <p className="log-description">{log.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

function getActionColor(action: ActionType): string {
  const colors: Record<ActionType, string> = {
    play: '#4caf50',
    attack: '#ff5722',
    spell: '#9c27b0',
    hero_power: '#ffd700',
    end_turn: '#607d8b'
  };
  return colors[action] || '#666';
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

export default TurnLog;
