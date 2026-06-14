import { useGameStore } from '../store/gameStore';
import { cardTemplates } from '../cards/data';
import { useState, useEffect } from 'react';

const Board = () => {
  const {
    currentPlayerIndex,
    playerCount,
    getCurrentPlayer,
    addEffectToChain,
    executeChain,
    clearChain,
    rollbackLastSnapshot,
    isAnimating,
    isRollingBack,
    nextTurn,
    resetGame,
    getSortedChain
  } = useGameStore();

  const currentPlayer = getCurrentPlayer();
  const sortedChain = getSortedChain();
  const [animatingCards, setAnimatingCards] = useState<Set<string>>(new Set());

  const handleCardClick = (cardId: string) => {
    if (isAnimating || isRollingBack) return;
    if (currentPlayer.chainStack.length >= 20) return;
    
    const card = cardTemplates.find(c => c.id === cardId);
    if (card) {
      setAnimatingCards(prev => new Set(prev).add(cardId));
      setTimeout(() => {
        setAnimatingCards(prev => {
          const next = new Set(prev);
          next.delete(cardId);
          return next;
        });
      }, 300);
      
      addEffectToChain(cardId);
    }
  };

  const canExecute = currentPlayer.chainStack.length > 0 && !isAnimating && !isRollingBack;
  const canRollback = currentPlayer.history.length > 0 && !isAnimating && !isRollingBack;

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
    <div className="board">
      <div className="board-header">
        <h2>
          玩家 {currentPlayerIndex + 1} 的回合
          <span className="player-indicator">
            {Array.from({ length: playerCount }, (_, i) => (
              <span
                key={i}
                className={`player-dot ${i === currentPlayerIndex ? 'active' : ''}`}
              />
            ))}
          </span>
        </h2>
        <div className="board-actions">
          <button
            className="btn btn-secondary"
            onClick={nextTurn}
            disabled={isAnimating || isRollingBack}
          >
            结束回合
          </button>
          <button
            className="btn btn-secondary"
            onClick={resetGame}
            disabled={isAnimating || isRollingBack}
          >
            重置游戏
          </button>
        </div>
      </div>

      <div className="field-section">
        <h3>场上卡牌 ({currentPlayer.state.fieldCards.length})</h3>
        <div className="field-cards">
          {currentPlayer.state.fieldCards.length === 0 ? (
            <span className="empty-text">场上暂无卡牌</span>
          ) : (
            currentPlayer.state.fieldCards.map((card, index) => (
              <div key={index} className="field-card">
                {card}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="chain-section">
        <div className="chain-header">
          <h3>连锁栈 ({currentPlayer.chainStack.length}/20)</h3>
          <div className="chain-actions">
            <button
              className="btn btn-danger"
              onClick={clearChain}
              disabled={!canExecute}
            >
              清空
            </button>
            <button
              className="btn btn-warning"
              onClick={rollbackLastSnapshot}
              disabled={!canRollback}
            >
              回退
            </button>
            <button
              className="btn btn-primary"
              onClick={executeChain}
              disabled={!canExecute}
            >
              执行连锁
            </button>
          </div>
        </div>
        
        <div className="chain-stack">
          {sortedChain.length === 0 ? (
            <span className="empty-text">点击下方卡牌添加到连锁栈</span>
          ) : (
            sortedChain.map((item, index) => (
              <div
                key={item.id}
                className={`chain-item slide-in ${isAnimating ? 'executing' : ''}`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span className="chain-priority">{item.effect.priority}</span>
                <span className="chain-name">{item.effect.name}</span>
                <span className="chain-type" style={{ color: getTypeColor(item.effect.type) }}>
                  {item.effect.type}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="hand-section">
        <h3>卡牌库</h3>
        <div className="hand-cards">
          {cardTemplates.map(card => (
            <div
              key={card.id}
              className={`hand-card ${animatingCards.has(card.id) ? 'pulse' : ''}`}
              onClick={() => handleCardClick(card.id)}
              style={{ borderColor: getTypeColor(card.type) }}
            >
              <div className="card-priority" style={{ backgroundColor: getTypeColor(card.type) }}>
                {card.priority}
              </div>
              <div className="card-name">{card.name}</div>
              <div className="card-type" style={{ color: getTypeColor(card.type) }}>
                {card.type}
              </div>
              <div className="card-desc">{card.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Board;
