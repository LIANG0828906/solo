import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  BattleLog,
  RARITY_LABELS,
  EFFECT_TYPE_COLORS,
} from './types';
import { simulateBattle } from './apiService';

interface BattleSimulatorProps {
  cards: Card[];
}

const BattleSimulator: React.FC<BattleSimulatorProps> = ({ cards }) => {
  const [selectedDeck, setSelectedDeck] = useState<Card[]>([]);
  const [displayedLogs, setDisplayedLogs] = useState<BattleLog[]>([]);
  const [progress, setProgress] = useState(0);
  const [isBattling, setIsBattling] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const logIndexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const toggleCardInDeck = (card: Card) => {
    if (isBattling) return;

    setSelectedDeck(prev => {
      const exists = prev.find(c => c.id === card.id);
      if (exists) {
        return prev.filter(c => c.id !== card.id);
      }
      if (prev.length >= 5) {
        return prev;
      }
      return [...prev, card];
    });
  };

  const startBattle = async () => {
    if (selectedDeck.length < 3) {
      setError('请至少选择3张卡牌组成牌组');
      return;
    }

    setError(undefined);
    setIsBattling(true);
    setDisplayedLogs([]);
    setProgress(0);
    logIndexRef.current = 0;

    try {
      const result = await simulateBattle(selectedDeck);

      if (result.logs.length > 0) {
        animateLogs(result.logs);
      } else {
        setIsBattling(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '对战模拟失败');
      setIsBattling(false);
    }
  };

  const animateLogs = (logs: BattleLog[]) => {
    if (logIndexRef.current >= logs.length) {
      setProgress(100);
      setIsBattling(false);
      return;
    }

    const nextIndex = logIndexRef.current;
    setDisplayedLogs(prev => [...prev, logs[nextIndex]]);
    logIndexRef.current++;

    const newProgress = Math.round((logIndexRef.current / logs.length) * 100);
    setProgress(newProgress);

    timerRef.current = setTimeout(() => {
      animateLogs(logs);
    }, 500);
  };

  const resetBattle = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setDisplayedLogs([]);
    setProgress(0);
    setIsBattling(false);
    setError(undefined);
    logIndexRef.current = 0;
  };

  const renderSmallCard = (card: Card, onClick?: () => void, inDeck: boolean = false) => (
    <div
      key={card.id}
      onClick={onClick}
      className={`gallery-card rarity-${card.rarity}`}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        borderColor: inDeck ? '#2ecc71' : undefined,
        opacity: inDeck ? 1 : 0.7,
        padding: '10px',
        maxWidth: '170px',
      }}
    >
      <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>
        {card.name}
      </div>
      <div style={{ fontSize: '10px', color: '#9090a0', marginBottom: '8px' }}>
        {RARITY_LABELS[card.rarity]}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginBottom: '8px', minHeight: '24px' }}>
        {card.effects.slice(0, 3).map(effect => (
          <span
            key={effect.id}
            style={{
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              color: 'white',
              backgroundColor: EFFECT_TYPE_COLORS[effect.type],
            }}
          >
            {effect.name}
          </span>
        ))}
        {card.effects.length > 3 && (
          <span style={{ fontSize: '10px', color: '#9090a0' }}>+{card.effects.length - 3}</span>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '600' }}>
        <span style={{ color: '#f39c12' }}>费:{card.cost}</span>
        <span style={{ color: '#e74c3c' }}>力:{card.power}</span>
      </div>
    </div>
  );

  return (
    <div className="battle-simulator">
      <h2 className="panel-title">对战模拟器</h2>

      <div className="deck-selector">
        <div className="deck-info">
          已选择 {selectedDeck.length}/5 张卡牌（至少需要3张）
        </div>
        <div className="deck-cards">
          {selectedDeck.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', color: '#606070' }}>
              点击下方卡牌添加到牌组...
            </div>
          ) : (
            selectedDeck.map(card =>
              renderSmallCard(card, () => toggleCardInDeck(card), true)
            )
          )}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">可用卡牌</label>
        {cards.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <div className="empty-state-text">暂无已保存的卡牌，请先在编辑器中创建卡牌</div>
          </div>
        ) : (
          <div className="available-cards">
            {cards.map(card => {
              const isInDeck = selectedDeck.some(c => c.id === card.id);
              return renderSmallCard(
                card,
                () => toggleCardInDeck(card),
                isInDeck
              );
            })}
          </div>
        )}
      </div>

      <div className="action-buttons" style={{ marginBottom: '24px' }}>
        <button
          className="btn btn-secondary"
          onClick={resetBattle}
          disabled={isBattling}
        >
          重置
        </button>
        <button
          className="btn btn-success"
          onClick={startBattle}
          disabled={isBattling || selectedDeck.length < 3}
        >
          {isBattling ? '对战中...' : '开始对战'}
        </button>
      </div>

      {error && (
        <div style={{ marginBottom: '16px', padding: '10px', backgroundColor: '#3d1a1a', borderRadius: '8px', color: '#e74c3c', fontSize: '13px' }}>
          {error}
        </div>
      )}

      <div className="progress-bar-container">
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="progress-label">
          战斗进度: {progress}% {isBattling && '(进行中...)'}
        </div>
      </div>

      {displayedLogs.length > 0 && (
        <div className="battle-logs">
          {displayedLogs.map((log, index) => (
            <div key={index} className="log-entry">
              {log.message}
            </div>
          ))}
        </div>
      )}

      {!isBattling && displayedLogs.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">⚔️</div>
          <div className="empty-state-text">选择卡牌并点击"开始对战"查看战斗日志</div>
        </div>
      )}
    </div>
  );
};

export default BattleSimulator;
