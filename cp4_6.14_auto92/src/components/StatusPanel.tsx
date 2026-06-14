import { useGameStore } from '../store/gameStore';
import { useState, useEffect } from 'react';

const StatusPanel = () => {
  const {
    currentPlayerIndex,
    playerCount,
    setPlayerCount,
    getCurrentPlayer,
    getSortedChain,
    lastResolvedEffects,
    isRollingBack,
    turnTransition
  } = useGameStore();

  const currentPlayer = getCurrentPlayer();
  const sortedChain = getSortedChain();
  const state = currentPlayer.state;

  const [pulsedStats, setPulsedStats] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (lastResolvedEffects.length > 0) {
      const changedKeys = new Set<string>();
      lastResolvedEffects.forEach(effect => {
        effect.changes.forEach(change => {
          changedKeys.add(change.key);
        });
      });
      setPulsedStats(changedKeys);
      setTimeout(() => setPulsedStats(new Set()), 200);
    }
  }, [lastResolvedEffects]);

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
          {stats.map(stat => (
            <div
              key={stat.key}
              className={`stat-card ${pulsedStats.has(stat.key) ? 'pulse' : ''}`}
            >
              <span className="stat-icon">{stat.icon}</span>
              <span className="stat-label">{stat.label}</span>
              <span className="stat-value">{stat.value}</span>
            </div>
          ))}
        </div>
      </div>

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
        <h3>历史记录</h3>
        <div className="history-list">
          {currentPlayer.history.length === 0 ? (
            <div className="empty-history">暂无历史记录</div>
          ) : (
            currentPlayer.history.slice(-5).reverse().map((snapshot, index) => (
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

      {turnTransition && (
        <div className="turn-overlay">
          <div className="turn-flip">
            玩家 {((currentPlayerIndex + 1) % playerCount) + 1} 的回合
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusPanel;
