import React, { useEffect, useRef } from 'react';
import { Sword, Heart, Sparkles, TrendingDown, Footprints } from 'lucide-react';
import { useGameStore } from './store';
import { ANIMATION_DURATION } from './config';
import type { LogType } from './types';

const logTypeConfig: Record<LogType, { icon: React.ElementType; label: string; color: string }> = {
  attack: { icon: Sword, label: '攻击', color: '#f44336' },
  heal: { icon: Heart, label: '治疗', color: '#4CAF50' },
  buff: { icon: Sparkles, label: '增益', color: '#2196F3' },
  debuff: { icon: TrendingDown, label: '减益', color: '#9C27B0' },
  move: { icon: Footprints, label: '移动', color: '#FF9800' },
};

const CombatLog: React.FC = () => {
  const { logs, currentRound, nextRound, addLog, units } = useGameStore();
  const logEndRef = useRef<HTMLDivElement>(null);
  const latestLogId = logs.length > 0 ? logs[logs.length - 1].id : null;

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const groupedLogs = logs.reduce((acc, log) => {
    const round = log.round;
    if (!acc[round]) {
      acc[round] = [];
    }
    acc[round].push(log);
    return acc;
  }, {} as Record<number, typeof logs>);

  const rounds = Object.keys(groupedLogs).map(Number).sort((a, b) => a - b);

  const handleTestAttack = () => {
    const playerUnits = units.filter((u) => u.type === 'player' && !u.isDead);
    const enemyUnits = units.filter((u) => u.type === 'enemy' && !u.isDead);
    if (playerUnits.length > 0 && enemyUnits.length > 0) {
      addLog({
        round: currentRound,
        source: playerUnits[0].name,
        target: enemyUnits[0].name,
        skill: '普通攻击',
        value: Math.floor(Math.random() * 10) + 5,
        type: 'attack',
      });
    }
  };

  return (
    <div className="combat-log h-full flex flex-col">
      <div className="panel-header">
        <h3 className="panel-title">战斗日志</h3>
        <div className="round-info">
          <span>第 {currentRound} 回合</span>
        </div>
      </div>

      <div className="panel-content flex-1 overflow-y-auto log-container">
        {rounds.length === 0 ? (
          <div className="empty-log">
            <p>暂无战斗记录</p>
            <p className="text-sm opacity-70">战斗开始后记录将显示在这里</p>
          </div>
        ) : (
          rounds.map((round) => (
            <div key={round} className="log-round-group">
              <div className="round-header">
                <span className="round-number">第 {round} 回合</span>
              </div>
              {groupedLogs[round].map((log, index) => {
                const isLatest = log.id === latestLogId && index === groupedLogs[round].length - 1;
                const config = logTypeConfig[log.type];
                const Icon = config.icon;
                const isEven = index % 2 === 0;

                return (
                  <div
                    key={log.id}
                    className={`log-entry ${isLatest ? 'latest' : ''} ${isEven ? 'even' : 'odd'}`}
                    style={{
                      animation: isLatest ? `fadeInSlide ${ANIMATION_DURATION}ms ease-out` : undefined,
                    }}
                  >
                    <div className="log-icon" style={{ color: config.color }}>
                      <Icon size={14} />
                    </div>
                    <div className="log-content">
                      <div className="log-header">
                        <span className="log-source">{log.source}</span>
                        {log.target && (
                          <>
                            <span className="log-arrow">→</span>
                            <span className="log-target">{log.target}</span>
                          </>
                        )}
                      </div>
                      <div className="log-details">
                        <span className="log-skill">{log.skill}</span>
                        {log.value > 0 && (
                          <span className="log-value" style={{ color: config.color }}>
                            {log.type === 'heal' ? '+' : '-'}{log.value}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="log-time">{formatTime(log.timestamp)}</div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>

      <div className="panel-footer log-footer">
        <button className="secondary-btn" onClick={handleTestAttack}>
          <Sword size={14} />
          模拟攻击
        </button>
        <button className="primary-btn" onClick={nextRound}>
          下一回合
        </button>
      </div>
    </div>
  );
};

export default CombatLog;
