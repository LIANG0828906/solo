import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import type { BattleRecord, TurnLog } from '../types';

const formatDuration = (ms: number): string => {
  const s = Math.floor(ms / 1000);
  const min = Math.floor(s / 60);
  const sec = s % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
};

const formatTime = (ts: number): string => {
  const d = new Date(ts);
  return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
};

const actionToText = (action: TurnLog['actions'][number]): string => {
  const actor = action.actor === 'player' ? '我方' : '敌方';
  switch (action.type) {
    case 'play':
      return `${actor} 打出【${action.cardName}】`;
    case 'attack':
      if (action.targetName) {
        return `${actor} 的【${action.cardName}】攻击 ${action.targetName}，造成 ${action.damage} 点伤害`;
      }
      return `${actor} 的【${action.cardName}】攻击英雄，造成 ${action.damage} 点伤害`;
    default:
      return `${actor} 执行动作`;
  }
};

const RecordItem: React.FC<{ record: BattleRecord; index: number }> = ({ record, index }) => {
  const [expanded, setExpanded] = useState(false);
  const [expandedTurns, setExpandedTurns] = useState<Set<number>>(new Set());

  const toggleTurn = (turn: number) => {
    setExpandedTurns((prev) => {
      const next = new Set(prev);
      if (next.has(turn)) {
        next.delete(turn);
      } else {
        next.add(turn);
      }
      return next;
    });
  };

  return (
    <div className={`record-card ${expanded ? 'expanded' : ''}`} style={{ position: 'relative' }}>
      <div className="timeline-dot" />
      <div className="record-header" onClick={() => setExpanded((e) => !e)}>
        <div className="record-decks">
          <span className="record-deck-name">{record.playerDeckName}</span>
          <span className="record-vs">VS</span>
          <span className="record-enemy-name">{record.enemyDeckName}</span>
        </div>
        <span className={`result-tag ${record.result}`}>
          {record.result === 'win' ? '胜' : '负'}
        </span>
        <div className="record-meta">
          <span>📊 {record.turns} 回合</span>
          <span>⏱ {formatDuration(record.duration)}</span>
          <span>📅 {formatTime(record.timestamp)}</span>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="record-detail"
          >
            {record.logs.map((turn) => {
              const isTurnOpen = expandedTurns.has(turn.turnNumber);
              return (
                <div key={turn.turnNumber} className="turn-group">
                  <div className="turn-group-header" onClick={(e) => { e.stopPropagation(); toggleTurn(turn.turnNumber); }}>
                    <span className="turn-group-title">第 {turn.turnNumber} 回合</span>
                    <div className="turn-hp-info">
                      <span>我方HP: {turn.playerHpAfter}</span>
                      <span>敌方HP: {turn.enemyHpAfter}</span>
                      <span style={{ marginLeft: 8 }}>{isTurnOpen ? '▼' : '▶'}</span>
                    </div>
                  </div>
                  <AnimatePresence>
                    {isTurnOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="turn-actions"
                      >
                        {turn.actions.length === 0 ? (
                          <div className="action-item" style={{ textAlign: 'center', color: '#6b7280' }}>
                            （无动作）
                          </div>
                        ) : (
                          turn.actions.map((act, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.03 }}
                              className={`action-item ${act.actor}`}
                            >
                              {actionToText(act)}
                            </motion.div>
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const BattleLog: React.FC = () => {
  const { battleRecords, getStats } = useGameStore();
  const stats = getStats();

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">对战记录</h1>
      </div>

      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-label">总场次</div>
          <div className="stat-value">{stats.totalGames}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">胜场</div>
          <div className="stat-value" style={{ color: '#22c55e' }}>{stats.wins}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">败场</div>
          <div className="stat-value" style={{ color: '#ef4444' }}>{stats.losses}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">胜率</div>
          <div className="stat-value">{stats.winRate}%</div>
        </div>
      </div>

      {battleRecords.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📜</div>
          <h2 className="empty-title">暂无对战记录</h2>
          <p className="empty-desc">完成一局对战后，记录将展示在这里</p>
        </div>
      ) : (
        <div className="timeline-list">
          <AnimatePresence initial={false}>
            {battleRecords.map((record, i) => (
              <motion.div
              key={record.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <RecordItem record={record} index={i} />
            </motion.div>
          ))}
        </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default BattleLog;
