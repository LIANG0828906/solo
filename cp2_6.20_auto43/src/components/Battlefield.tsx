import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import {
  initBattleState,
  canPlayCard,
  playCard,
  attack,
  endPlayerTurn,
  endEnemyTurn,
  runEnemyTurn,
  generateEnemyDeck,
  createBattleRecord,
} from '../utils/gameEngine';
import CardView from './CardView';
import type { GameState, Card } from '../types';

const ENEMY_DECK_NAMES = ['暗影军团', '龙族部落', '机械卫队', '自然守护', '黑暗骑士'];

const FireworkParticles: React.FC = () => {
  const particles = useMemo(
    () =>
      Array.from({ length: 60 }).map((_, i) => {
        const angle = (i / 60) * Math.PI * 2;
        const distance = 100 + Math.random() * 180;
        return {
          id: i,
          fx: Math.cos(angle) * distance,
          fy: Math.sin(angle) * distance,
          delay: Math.random() * 0.4,
          color: ['#d4af37', '#ffd700', '#ffb700', '#ffea00'][i % 4],
        };
      }),
    []
  );
  return (
    <>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="firework-particle"
          initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
          animate={{
            x: p.fx,
            y: p.fy,
            scale: [0, 1.2, 0.5],
            opacity: [1, 1, 0],
          }}
          transition={{ duration: 1.4, delay: p.delay, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: p.color,
            boxShadow: `0 0 12px ${p.color}`,
            pointerEvents: 'none',
          }}
        />
      ))}
    </>
  );
};

interface DamageFloat {
  id: number;
  amount: number;
  targetKey: string;
}

const Battlefield: React.FC = () => {
  const navigate = useNavigate();
  const { selectedDeck, updateCurrentGame, saveBattleRecord } = useGameStore();

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedAttacker, setSelectedAttacker] = useState<string | null>(null);
  const [hoveredEnemyCard, setHoveredEnemyCard] = useState<Card | null>(null);
  const [flippedEnemy, setFlippedEnemy] = useState<string | null>(null);
  const [damages, setDamages] = useState<DamageFloat[]>([]);
  const [attackAnim, setAttackAnim] = useState<string | null>(null);
  const [enemyDeckName, setEnemyDeckName] = useState('AI敌方卡组');

  const initGame = useCallback(() => {
    if (selectedDeck.cards.length < 10) {
      return;
    }
    const enemyDeck = generateEnemyDeck();
    const state = initBattleState(selectedDeck.cards, enemyDeck);
    setEnemyDeckName(ENEMY_DECK_NAMES[Math.floor(Math.random() * ENEMY_DECK_NAMES.length)]);
    setGameState(state);
    updateCurrentGame(state);
  }, [selectedDeck, updateCurrentGame]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (!gameState) return;
    updateCurrentGame(gameState);
    if (gameState.phase === 'ended' && gameState.result) {
      const record = createBattleRecord(gameState, selectedDeck.name, enemyDeckName);
      saveBattleRecord(record);
    }
  }, [gameState, updateCurrentGame, selectedDeck.name, enemyDeckName, saveBattleRecord]);

  const addDamage = useCallback((key: string, amount: number) => {
    const id = Date.now() + Math.random();
    setDamages((prev) => [...prev, { id, amount, targetKey: key }]);
    setTimeout(() => {
      setDamages((prev) => prev.filter((d) => d.id !== id));
    }, 900);
  }, []);

  const handlePlayCard = (index: number) => {
    if (!gameState || gameState.phase !== 'playerTurn') return;
    const card = gameState.playerHand[index];
    if (!canPlayCard(gameState, card, 'player')) return;
    const newState = playCard(gameState, index, 'player');
    setGameState(newState);
  };

  const handleSelectAttacker = (instanceId: string) => {
    if (!gameState || gameState.phase !== 'playerTurn') return;
    const card = gameState.playerBoard.find((c) => c.instanceId === instanceId);
    if (!card || !card.canAttack || card.hasAttacked) return;
    setSelectedAttacker((prev) => (prev === instanceId ? null : instanceId));
  };

  const handleTargetEnemyCard = (targetInstanceId: string) => {
    if (!gameState || !selectedAttacker) return;
    const prevHp = gameState.enemyBoard.find((c) => c.instanceId === targetInstanceId)?.currentHealth || 0;
    const attacker = gameState.playerBoard.find((c) => c.instanceId === selectedAttacker);
    setAttackAnim(selectedAttacker);
    setTimeout(() => {
      const newState = attack(gameState, selectedAttacker, { type: 'minion', instanceId: targetInstanceId }, 'player');
      const afterHp = newState.enemyBoard.find((c) => c.instanceId === targetInstanceId)?.currentHealth || 0;
      if (attacker) addDamage(`enemy-${targetInstanceId}`, attacker.attack);
      setAttackAnim(null);
      setGameState(newState);
      setSelectedAttacker(null);
    }, 400);
  };

  const handleAttackEnemyHero = () => {
    if (!gameState || !selectedAttacker) return;
    const attacker = gameState.playerBoard.find((c) => c.instanceId === selectedAttacker);
    if (!attacker) return;
    const tauntMinions = gameState.enemyBoard.filter(
      (c) => c.id === 'c3' || c.id === 'c9' || c.id === 'c12'
    );
    if (tauntMinions.length > 0) return;
    const prevHp = gameState.enemyHp;
    setAttackAnim(selectedAttacker);
    setTimeout(() => {
      const newState = attack(gameState, selectedAttacker, { type: 'hero' }, 'player');
      if (newState.enemyHp < prevHp) {
        addDamage('enemy-hero', prevHp - newState.enemyHp);
      }
      setAttackAnim(null);
      setGameState(newState);
      setSelectedAttacker(null);
    }, 400);
  };

  const handleEndTurn = () => {
    if (!gameState || gameState.phase !== 'playerTurn') return;
    setSelectedAttacker(null);
    const afterPlayerEnd = endPlayerTurn(gameState);
    setGameState(afterPlayerEnd);
    if (afterPlayerEnd.phase === 'ended') return;

    setTimeout(() => {
      const states = runEnemyTurn(afterPlayerEnd);
      let cur = afterPlayerEnd;
      let idx = 0;

      const step = () => {
        if (idx >= states.length) {
          const finalEnemy = endEnemyTurn(cur);
          setGameState(finalEnemy);
          return;
        }
        const next = states[idx];
        if (next && cur) {
          if (next.playerHp < cur.playerHp) {
            addDamage('player-hero', cur.playerHp - next.playerHp);
          }
          if (cur.enemyBoard.length !== next.enemyBoard.length ||
              cur.playerBoard.some((pc, i) => next.playerBoard[i]?.currentHealth !== pc.currentHealth)) {
          }
        }
        cur = next;
        setGameState(cur);
        idx++;
        setTimeout(step, 600);
        if (cur.phase === 'ended') {
          return;
        }
      };
      setTimeout(step, 700);
    }, 500);
  };

  if (!gameState) {
    return (
      <div className="empty-state">
        <div className="empty-icon">⚔️</div>
        <h2 className="empty-title">正在初始化对战...</h2>
        <p className="empty-desc">请先在编辑器构建卡组</p>
        <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => navigate('/')}>
          返回编辑器
        </button>
      </div>
    );
  }

  const playerManaCrystals = Array.from({ length: gameState.playerMaxMana });
  const enemyManaCrystals = Array.from({ length: gameState.enemyMaxMana });

  const tauntOnField = gameState.enemyBoard.some((c) => c.id === 'c3' || c.id === 'c9' || c.id === 'c12');

  return (
    <div className="battle-container">
      <div className="page-header">
        <h1 className="page-title">对战模拟器</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => navigate('/logs')}>
            对战记录
          </button>
          <button className="btn btn-secondary" onClick={initGame}>
            重新开始
          </button>
        </div>
      </div>

      <div className="turn-info">
        <span className="turn-label">第 <span className="turn-number">{gameState.currentTurn}</span> 回合</span>
        <span className={`phase-badge ${gameState.phase === 'playerTurn' ? 'phase-player' : 'phase-enemy'}`}>
          {gameState.phase === 'playerTurn' && '您的回合'}
          {gameState.phase === 'enemyTurn' && '敌方回合'}
          {gameState.phase === 'ended' && '对战结束'}
        </span>
        {gameState.phase === 'playerTurn' && (
          <button className="btn btn-primary" onClick={handleEndTurn}>
            结束回合 →
          </button>
        )}
      </div>

      <div className="battle-board">
        <div className="enemy-zone">
          <div className="hero-panel">
            <div
              className={`hero-portrait enemy-portrait ${selectedAttacker && !tauntOnField ? 'targetable' : ''}`}
              onClick={handleAttackEnemyHero}
            >
              👹
              {damages.filter((d) => d.targetKey === 'enemy-hero').map((d) => (
                <span key={d.id} className="damage-popup">
                  -{d.amount}
                </span>
              ))}
            </div>
            <div className="hero-stats">
              <div className="hp-display">
                <span className="hp-icon">❤</span>
                <span className="hp-value">{gameState.enemyHp}</span>
                <span className="hp-value" style={{ color: '#9ca3af', fontSize: '0.8rem' }}>/{gameState.enemyMaxHp}</span>
              </div>
              <div className="mana-display">
                {enemyManaCrystals.map((_, i) => (
                  <div
                    key={i}
                    className={`mana-crystal ${i >= gameState.enemyMana ? 'empty' : ''}`}
                  />
                ))}
                <span className="mana-text">
                  {gameState.enemyMana}/{gameState.enemyMaxMana}
                </span>
              </div>
            </div>
          </div>

          <div className="board-area enemy-board-area">
            {gameState.enemyBoard.length === 0 ? (
              <div className="board-slot" style={{ borderStyle: 'none', opacity: 0.3 }}>
                <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>空</span>
              </div>
            ) : (
                gameState.enemyBoard.map((card) => (
                  <div
                    key={card.instanceId}
                    style={{ position: 'relative' }}
                    onMouseEnter={() => {
                      setFlippedEnemy(card.instanceId);
                      setHoveredEnemyCard(card);
                    }}
                    onMouseLeave={() => {
                      setFlippedEnemy(null);
                      setHoveredEnemyCard(null);
                    }}
                  >
                    <CardView
                      card={card}
                      size="board"
                      className={`${selectedAttacker ? 'targetable' : ''} ${attackAnim === card.instanceId ? 'attack-anim' : ''}`}
                      onClick={() => selectedAttacker && handleTargetEnemyCard(card.instanceId)}
                    />
                    {damages.filter((d) => d.targetKey === `enemy-${card.instanceId}`).map((d) => (
                      <span key={d.id} className="damage-popup">
                        -{d.amount}
                      </span>
                    ))}
                  </div>
                ))
              )}
          </div>
        </div>

        <div className="board-center-line" />

        <div className="player-zone">
          <div className="hero-panel">
            <div className="hero-portrait player-portrait">
              🧙
              {damages.filter((d) => d.targetKey === 'player-hero').map((d) => (
                <span key={d.id} className="damage-popup">
                  -{d.amount}
                </span>
              ))}
            </div>
            <div className="hero-stats">
              <div className="hp-display">
                <span className="hp-icon">❤</span>
                <span className="hp-value">{gameState.playerHp}</span>
                <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>/{gameState.playerMaxHp}</span>
              </div>
              <div className="mana-display">
                {playerManaCrystals.map((_, i) => (
                  <div
                    key={i}
                    className={`mana-crystal ${i >= gameState.playerMana ? 'empty' : ''}`}
                  />
                ))}
                <span className="mana-text">
                  {gameState.playerMana}/{gameState.playerMaxMana}
                </span>
              </div>
            </div>
          </div>

          <div className="board-area player-board-area">
            {gameState.playerBoard.length === 0 ? (
              <div className="board-slot" style={{ borderStyle: 'none', opacity: 0.3 }}>
                <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>打出卡牌召唤随从</span>
              </div>
            ) : (
                gameState.playerBoard.map((card) => (
                  <div key={card.instanceId} style={{ position: 'relative' }}>
                    <CardView
                      card={card}
                      size="board"
                      className={`${card.canAttack && !card.hasAttacked ? 'can-attack' : ''} ${
                        selectedAttacker === card.instanceId ? 'selected-attacker' : ''
                      } ${attackAnim === card.instanceId ? 'attack-anim' : ''}`}
                      onClick={() => handleSelectAttacker(card.instanceId)}
                    />
                    {damages.filter((d) => d.targetKey === `player-${card.instanceId}`).map((d) => (
                      <span key={d.id} className="damage-popup">
                        -{d.amount}
                      </span>
                    ))}
                  </div>
                ))
              )}
          </div>
        </div>
      </div>

      <div className="hand-area">
        <div className="hand-title">您的手牌（点击可打出的卡牌高亮显示）</div>
        <div className="hand-cards">
          {gameState.playerHand.length === 0 && (
            <div className="deck-empty-hint" style={{ minHeight: 80 }}>
              手牌为空
            </div>
          )}
          {gameState.playerHand.map((card, i) => {
            const playable = canPlayCard(gameState, card, 'player') && gameState.phase === 'playerTurn';
            return (
              <CardView
                key={`hand-${card.id}-${i}`}
                card={card}
                size="thumb"
                className={`hand-card ${playable ? 'playable' : 'unplayable'}`}
                onClick={() => playable && handlePlayCard(i)}
              />
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {hoveredEnemyCard && flippedEnemy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="hover-preview-overlay"
          >
            <motion.div
              initial={{ rotateY: -90 }}
              animate={{ rotateY: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <CardView card={hoveredEnemyCard} size="preview" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {gameState.phase === 'ended' && gameState.result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`end-overlay ${gameState.result === 'win' ? 'end-win' : 'end-lose'}`}
          >
            {gameState.result === 'lose' && <div className="shatter-overlay" />}
            {gameState.result === 'win' && <FireworkParticles />}
            <div className="end-content">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
                className={`end-title ${gameState.result}`}
              >
                {gameState.result === 'win' ? '胜 利' : '失 败'}
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                style={{ display: 'flex', gap: 12, justifyContent: 'center' }}
              >
                <button className="btn btn-primary" onClick={initGame}>
                  再来一局
                </button>
                <button className="btn btn-secondary" onClick={() => navigate('/')}>
                  编辑卡组
                </button>
                <button className="btn btn-secondary" onClick={() => navigate('/logs')}>
                  查看记录
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Battlefield;
