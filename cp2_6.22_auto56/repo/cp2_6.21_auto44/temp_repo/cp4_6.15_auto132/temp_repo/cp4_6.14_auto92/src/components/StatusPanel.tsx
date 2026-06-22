import { useGameStore } from '../store/gameStore';
import { useState, useEffect } from 'react';

const StatusPanel = () => {
  const currentPlayerIndex = useGameStore(s => s.currentPlayerIndex);
  const playerCount = useGameStore(s => s.playerCount);
  const setPlayerCount = useGameStore(s => s.setPlayerCount);
  const lastResolvedEffects = useGameStore(s => s.lastResolvedEffects);
  const isRollingBack = useGameStore(s => s.isRollingBack);
  const lastExecutionDuration = useGameStore(s => s.lastExecutionDuration);
  const performanceWarning = useGameStore(s => s.performanceWarning);

  const players = useGameStore(s => s.players);
  const currentPlayer = players[currentPlayerIndex];
  const state = currentPlayer?.state;
  const chainStack = currentPlayer?.chainStack || [];
  const history = currentPlayer?.history || [];

  const sortedChain = [...chainStack].sort((a, b) => b.effect.priority - a.effect.priority);

  const [pulsedStats, setPulsedStats] = useState<Set<string>>(new Set());
  const [prevValues, setPrevValues] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!state) return;
    const currentValues = {
      hp: state.hp,
      attack: state.attack,
      defense: state.defense,
      handCount: state.handCount,
      deckCount: state.deckCount
    };

    const changed = new Set<string>();
    Object.keys(currentValues).forEach(key => {
      if (prevValues[key] !== undefined && prevValues[key] !== currentValues[key]) {
        changed.add(key);
      }
    });

    if (changed.size > 0) {
      setPulsedStats(changed);
      setTimeout(() => setPulsedStats(new Set()), 200);
    }

    setPrevValues(currentValues);
  }, [state?.hp, state?.attack, state?.defense, state?.handCount, state?.deckCount]);

  if (!state) return null;

  const getDelta = (key: string): number | null => {
    for (const effect of lastResolvedEffects) {
      for (const change of effect.changes) {
        if (change.key === key && typeof change.delta === 'number') {
          return change.delta;
        }
      }
    }
    return null;
  };

  const getValueColor = (key: string, value: number): string => {
    const delta = getDelta(key);
    if (delta === null) return '#e2e8f0';
    if (delta > 0) return '#22c55e';
    if (delta < 0) return '#ef4444';
    return '#e2e8f0';
  };

  const stats = [
    { key: 'hp', label: '生命值', value: state.hp, icon: '❤️' },
    { key: 'attack', label: '攻击力', value: state.attack, icon: '⚔️' },
    { key: 'defense', label: '防御力', value: state.defense, icon: '🛡️' },
    { key: 'handCount', label: '手牌数', value: state.handCount, icon: '🃏' },
    { key: 'deckCount', label: '牌库数', value: state.deckCount, icon: '📚' }
  ];

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'draw': return '抽牌';
      case 'buff': return '增益';
      case 'copy': return '复制';
      case 'transform': return '转化';
      case 'clear': return '清除';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'draw': return '#38bdf8';
      case 'buff': return '#22c55e';
      case 'copy': return '#a855f7';
      case 'transform': return '#f97316';
      case 'clear': return '#ef4444';
      default: return '#64748b';
    }
  };

  return (
    <div className={`status-panel ${isRollingBack ? 'fade-in' : ''}`}>
      <div className="panel-header">
        <h2>状态面板</h2>
        <div className="player-count-selector">
          <label>玩家数:</label>
          <select
            value={playerCount}
            onChange={(e) => setPlayerCount(Number(e.target.value))}
          >
            <option value={2}>2人</option>
            <option value={3}>3人</option>
            <option value={4}>4人</option>
          </select>
        </div>
      </div>

      <div className="stats-section">
        <h3>全局状态</h3>
        <div className="stats-grid">
          {stats.map(stat => {
            const delta = getDelta(stat.key);
            return (
              <div
                key={stat.key}
                className={`stat-card ${pulsedStats.has(stat.key) ? 'pulse' : ''}`}
              >
                <span className="stat-icon">{stat.icon}</span>
                <span className="stat-label">{stat.label}</span>
                <span 
                  className="stat-value"
                  style={{ color: getValueColor(stat.key, stat.value) }}
                >
                  {stat.value}
                  {delta !== null && delta !== 0 && (
                    <span className={`delta ${delta > 0 ? 'increase' : 'decrease'}`}>
                      {delta > 0 ? '+' : ''}{delta}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {lastExecutionDuration > 0 && (
        <div className={`perf-monitor ${performanceWarning ? 'warning' : ''}`}>
          <span>上次解析耗时: {lastExecutionDuration.toFixed(2)}ms</span>
          {performanceWarning && <span className="perf-warn">⚠ 超过200ms阈值</span>}
        </div>
      )}

      <div className="chain-section">
        <div className="section-header">
          <h3>当前连锁栈</h3>
          <span className="chain-count">{sortedChain.length}个效果</span>
        </div>
        <div className="chain-list">
          {sortedChain.length === 0 ? (
            <div className="empty-chain">暂无连锁效果</div>
          ) : (
            sortedChain.map((item, index) => (
              <div
                key={item.id}
                className="chain-card"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div
                  className="priority-badge"
                  style={{ backgroundColor: '#fbbf24' }}
                >
                  {item.effect.priority}
                </div>
                <div className="chain-info">
                  <div className="chain-card-name">{item.effect.name}</div>
                  <div
                    className="chain-card-type"
                    style={{ color: getTypeColor(item.effect.type) }}
                  >
                    {getTypeLabel(item.effect.type)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="history-section">
        <h3>历史记录（回退快照）</h3>
        <div className="history-list">
          {history.length === 0 ? (
            <div className="empty-history">暂无快照，执行连锁后可回退</div>
          ) : (
            history.slice(-5).reverse().map((snapshot, index) => (
              <div key={snapshot.id} className="history-item">
                <span className="history-desc">{snapshot.description}</span>
                <span className="history-time">
                  {new Date(snapshot.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StatusPanel;
