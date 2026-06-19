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

interface FlyingCard {
  id: string;
  card: Card;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  targetIndex: number;
  side: 'player' | 'enemy';
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
  const [flyingCards, setFlyingCards] = useState<FlyingCard[]>([]);
  const [shakeConfig, setShakeConfig] = useState<{ direction: 'leftToRight' | 'rightToLeft' | 'none'; intensity: number } | null>(null);
  const [flashWhite, setFlashWhite] = useState(false);
  const [showEndScreen, setShowEndScreen] = useState(false);
  const [playerHandRefs, setPlayerHandRefs] = useState<Map<number, HTMLDivElement | null>>(new Map());

  const initGame = useCallback(() => {
    if (selectedDeck.cards.length < 10) {
      return;
    }
    const enemyDeck = generateEnemyDeck();
    const state = initBattleState(selectedDeck.cards, enemyDeck);
    setEnemyDeckName(ENEMY_DECK_NAMES[Math.floor(Math.random() * ENEMY_DECK_NAMES.length)]);
    setGameState(state);
    updateCurrentGame(state);
    setShowEndScreen(false);
    setFlashWhite(false);
    setFlyingCards([]);
    setShakeConfig(null);
  }, [selectedDeck, updateCurrentGame]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (!gameState) return;
    updateCurrentGame(gameState);
    if (gameState.phase === 'ended' && gameState.result && !showEndScreen && !flashWhite) {
      const record = createBattleRecord(gameState, selectedDeck.name, enemyDeckName);
      saveBattleRecord(record);
      setFlashWhite(true);
      setTimeout(() => {
        setFlashWhite(false);
      }, 450);
    }
  }, [gameState, updateCurrentGame, selectedDeck.name, enemyDeckName, saveBattleRecord, showEndScreen, flashWhite]);

  const handleFlashWhiteExitComplete = useCallback(() => {
    if (gameState?.phase === 'ended' && gameState.result) {
      setShowEndScreen(true);
    }
  }, [gameState]);

  const addDamage = useCallback((key: string, amount: number) => {
    const id = Date.now() + Math.random();
    setDamages((prev) => [...prev, { id, amount, targetKey: key }]);
    setTimeout(() => {
      setDamages((prev) => prev.filter((d) => d.id !== id));
    }, 900);
  }, []);

  const triggerShake = useCallback((direction: 'leftToRight' | 'rightToLeft' = 'leftToRight', intensity: number = 1) => {
    setShakeConfig({ direction, intensity });
    setTimeout(() => setShakeConfig(null), 150);
  }, []);

  const triggerCardFlight = useCallback((
    card: Card,
    handIndex: number,
    targetIndex: number,
    side: 'player' | 'enemy',
    onComplete: () => void
  ) => {
    const handEl = playerHandRefs.get(handIndex);
    if (!handEl) {
      onComplete();
      return;
    }

    const handRect = handEl.getBoundingClientRect();
    const boardArea = document.querySelector(
      side === 'player' ? '.player-board-area' : '.enemy-board-area'
    );
    if (!boardArea) {
      onComplete();
      return;
    }
    const boardRect = boardArea.getBoundingClientRect();

    const cardWidth = 110;
    const gap = 10;
    const existingCards = side === 'player' ? gameState?.playerBoard.length || 0 : gameState?.enemyBoard.length || 0;
    const totalWidth = existingCards * (cardWidth + gap);
    const targetX = boardRect.left + (boardRect.width / 2) - (totalWidth / 2) + (targetIndex * (cardWidth + gap)) - handRect.left;
    const targetY = boardRect.top + (boardRect.height / 2) - (cardWidth * 1.4 / 2) - handRect.top;
    const startX = 0;
    const startY = 0;

    const flyingId = `fly-${Date.now()}-${Math.random()}`;
    const flyingCard: FlyingCard = {
      id: flyingId,
      card,
      fromX: startX,
      fromY: startY,
      toX: targetX,
      toY: targetY,
      targetIndex,
      side,
    };

    setFlyingCards((prev) => [...prev, flyingCard]);

    setTimeout(() => {
      setFlyingCards((prev) => prev.filter((fc) => fc.id !== flyingId));
      onComplete();
    }, 550);
  }, [playerHandRefs, gameState]);

  const handlePlayCard = (index: number) => {
    if (!gameState || gameState.phase !== 'playerTurn') return;
    const card = gameState.playerHand[index];
    if (!canPlayCard(gameState, card, 'player')) return;
    const targetIndex = gameState.playerBoard.length;

    triggerCardFlight(card, index, targetIndex, 'player', () => {
      const newState = playCard(gameState, index, 'player');
      setGameState(newState);
    });
  };

  const handleSelectAttacker = (instanceId: string) => {
    if (!gameState || gameState.phase !== 'playerTurn') return;
    const card = gameState.playerBoard.find((c) => c.instanceId === instanceId);
    if (!card || !card.canAttack || card.hasAttacked) return;
    setSelectedAttacker((prev) => (prev === instanceId ? null : instanceId));
  };

  const handleTargetEnemyCard = (targetInstanceId: string) => {
    if (!gameState || !selectedAttacker) return;
    const attacker = gameState.playerBoard.find((c) => c.instanceId === selectedAttacker);
    const target = gameState.enemyBoard.find((c) => c.instanceId === targetInstanceId);
    const attackerIdx = gameState.playerBoard.findIndex((c) => c.instanceId === selectedAttacker);
    const targetIdx = gameState.enemyBoard.findIndex((c) => c.instanceId === targetInstanceId);
    const direction = targetIdx >= attackerIdx ? 'leftToRight' : 'rightToLeft';
    setAttackAnim(selectedAttacker);
    triggerShake(direction, attacker ? attacker.attack / 5 : 1);
    setTimeout(() => {
      const newState = attack(gameState, selectedAttacker, { type: 'minion', instanceId: targetInstanceId }, 'player');
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
    const attackerIdx = gameState.playerBoard.findIndex((c) => c.instanceId === selectedAttacker);
    const direction = attackerIdx <= gameState.playerBoard.length / 2 ? 'leftToRight' : 'rightToLeft';
    setAttackAnim(selectedAttacker);
    triggerShake(direction, attacker.attack / 5);
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

  const getShakeKeyframes = () => {
    if (!shakeConfig) return { x: [0, 0], y: [0, 0] };
    const baseX = 3 * shakeConfig.intensity;
    const baseY = 2 * shakeConfig.intensity;
    if (shakeConfig.direction === 'leftToRight') {
      return {
        x: [0, baseX * 0.6, -baseX * 0.4, baseX * 0.3, -baseX * 0.2, 0],
        y: [0, -baseY * 0.3, baseY * 0.4, -baseY * 0.2, baseY * 0.1, 0],
      };
    }
    return {
      x: [0, -baseX * 0.6, baseX * 0.4, -baseX * 0.3, baseX * 0.2, 0],
      y: [0, baseY * 0.3, -baseY * 0.4, baseY * 0.2, -baseY * 0.1, 0],
    };
  };

  return (
    <div className="battle-container">
      <AnimatePresence>
        {flashWhite && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
            onAnimationComplete={handleFlashWhiteExitComplete}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: '#ffffff',
              zIndex: 9999,
              pointerEvents: 'none',
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {shakeConfig && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              x: getShakeKeyframes().x,
              y: getShakeKeyframes().y,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at center, rgba(255,255,255,0.08) 0%, transparent 60%)',
              zIndex: 5000,
              pointerEvents: 'none',
            }}
          />
        )}
      </AnimatePresence>

      <div style={{ width: '100%', height: '100%' }}>
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
              <div
                key={`hand-${card.id}-${i}`}
                ref={(el) => {
                  setPlayerHandRefs((prev) => {
                    const next = new Map(prev);
                    next.set(i, el);
                    return next;
                  });
                }}
                style={{ position: 'relative' }}
              >
                <CardView
                  card={card}
                  size="thumb"
                  className={`hand-card ${playable ? 'playable' : 'unplayable'}`}
                  onClick={() => playable && handlePlayCard(i)}
                />
              </div>
            );
          })}
        </div>
      </div>

      {gameState && flyingCards.map((fc) => {
        const handIdx = Math.min(fc.targetIndex, gameState.playerHand.length - 1, playerHandRefs.size - 1);
        const handEl = playerHandRefs.get(handIdx >= 0 ? handIdx : 0) ||
                       playerHandRefs.get(Math.floor(playerHandRefs.size / 2));
        const handRect = handEl?.getBoundingClientRect();
        if (!handRect) return null;

        const boardArea = document.querySelector(
          fc.side === 'player' ? '.player-board-area' : '.enemy-board-area'
        );
        if (!boardArea) return null;
        const boardRect = boardArea.getBoundingClientRect();

        const cardWidth = 110;
        const gap = 10;
        const existingCards = fc.side === 'player' ? gameState.playerBoard.length : gameState.enemyBoard.length;
        const totalWidth = existingCards * (cardWidth + gap);
        const targetOffsetX = -(totalWidth / 2) + (fc.targetIndex * (cardWidth + gap));
        const targetX = boardRect.left + boardRect.width / 2 + targetOffsetX;
        const targetY = boardRect.top + boardRect.height / 2 - (cardWidth * 1.4 / 2);

        const startX = handRect.left;
        const startY = handRect.top;

        const totalDeltaX = targetX - startX;
        const totalDeltaY = targetY - startY;
        const distance = Math.sqrt(totalDeltaX * totalDeltaX + totalDeltaY * totalDeltaY);

        const minArc = -40;
        const maxArc = -150;
        const minDistance = 100;
        const maxDistance = 600;
        const distanceRatio = Math.min(1, Math.max(0, (distance - minDistance) / (maxDistance - minDistance)));
        const arcHeight = minArc + (maxArc - minArc) * (0.3 + distanceRatio * 0.7);

        const midY = totalDeltaY + arcHeight;

        const peakTime = 0.4 + distanceRatio * 0.1;

        return (
          <div
            key={fc.id}
            style={{
              position: 'fixed',
              left: startX,
              top: startY,
              zIndex: 1000,
              pointerEvents: 'none',
            }}
          >
            <CardView
              card={fc.card}
              size="board"
              disableDefaultAnimation
              customInitial={{
                x: 0,
                y: 0,
                scale: 0.7,
                opacity: 1,
                rotate: -5,
              }}
              customAnimate={{
                x: [0, totalDeltaX * 0.3, totalDeltaX * 0.6, totalDeltaX * 0.85, totalDeltaX * 0.97, totalDeltaX],
                y: [0, arcHeight * 0.9, midY * 0.6, totalDeltaY + 12, totalDeltaY + 4, totalDeltaY],
                scale: [0.7, 0.9, 1.05, 1.15, 0.95, 1],
                opacity: 1,
                rotate: [-5, -3, 0, 3, 1, 0],
              }}
              customTransition={{
                duration: 0.55,
                ease: 'easeOut',
                times: [0, peakTime * 0.5, peakTime, 0.75, 0.92, 1],
              }}
            />
          </div>
        );
      })}
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
        {showEndScreen && gameState?.result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
