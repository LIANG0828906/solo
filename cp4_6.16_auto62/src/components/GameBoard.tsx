import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Coins, Swords, RotateCcw, Play, Save, FolderOpen, Sparkles } from 'lucide-react';
import { useGameStore } from '../store';
import { Card } from './Card';
import type { DamagePopup, FlyingCard } from '../types';
import { TAG_COLORS } from '../types';
import { calculateDamage } from '../utils/combatEngine';

const BASE_WIDTH = 1280;
const BASE_HEIGHT = 720;

export const GameBoard: React.FC = () => {
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const player = useGameStore((state) => state.player);
  const enemy = useGameStore((state) => state.enemy);
  const turn = useGameStore((state) => state.turn);
  const phase = useGameStore((state) => state.phase);
  const cardsPlayedThisTurn = useGameStore((state) => state.cardsPlayedThisTurn);
  const comboChain = useGameStore((state) => state.comboChain);
  const cardPool = useGameStore((state) => state.cardPool);
  const gameResult = useGameStore((state) => state.gameResult);
  const placedCards = useGameStore((state) => state.placedCards);
  const selectedCardId = useGameStore((state) => state.selectedCardId);
  const isComboFlash = useGameStore((state) => state.isComboFlash);
  const isScreenShake = useGameStore((state) => state.isScreenShake);
  const isTurnTransition = useGameStore((state) => state.isTurnTransition);
  const shakeIntensity = useGameStore((state) => state.shakeIntensity);

  useEffect(() => {
    const updateScale = () => {
      const windowRatio = window.innerWidth / window.innerHeight;
      const baseRatio = BASE_WIDTH / BASE_HEIGHT;
      let newScale: number;
      if (windowRatio > baseRatio) {
        newScale = window.innerHeight / BASE_HEIGHT;
      } else {
        newScale = window.innerWidth / BASE_WIDTH;
      }
      setScale(newScale);
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const drawCard = useGameStore((state) => state.drawCard);
  const selectCard = useGameStore((state) => state.selectCard);
  const playCard = useGameStore((state) => state.playCard);
  const endPlayPhase = useGameStore((state) => state.endPlayPhase);
  const enemyAttack = useGameStore((state) => state.enemyAttack);
  const startNewTurn = useGameStore((state) => state.startNewTurn);
  const restartGame = useGameStore((state) => state.restartGame);
  const saveGame = useGameStore((state) => state.saveGame);
  const loadGame = useGameStore((state) => state.loadGame);
  const setComboFlash = useGameStore((state) => state.setComboFlash);
  const setScreenShake = useGameStore((state) => state.setScreenShake);
  const setTurnTransition = useGameStore((state) => state.setTurnTransition);

  const [damagePopups, setDamagePopups] = useState<DamagePopup[]>([]);
  const [flyingCards, setFlyingCards] = useState<FlyingCard[]>([]);
  const [newCardIds, setNewCardIds] = useState<Set<string>>(new Set());
  const [shakeOffset, setShakeOffset] = useState({ x: 0, y: 0 });
  const [comboTextVisible, setComboTextVisible] = useState(false);
  const [isDrawButtonShaking, setIsDrawButtonShaking] = useState(false);

  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  const showDamagePopup = useCallback((value: number, isPlayer: boolean) => {
    const popup: DamagePopup = {
      id: uuidv4(),
      value,
      x: isPlayer ? 50 : 50,
      y: isPlayer ? 75 : 15,
      isPlayer,
    };
    setDamagePopups((prev) => [...prev, popup]);
    setTimeout(() => {
      setDamagePopups((prev) => prev.filter((p) => p.id !== popup.id));
    }, 1500);
  }, []);

  const triggerComboEffects = useCallback((comboCount: number) => {
    if (comboCount >= 2) {
      setComboTextVisible(true);
      setComboFlash(true);
      setScreenShake(true, comboCount === 3 ? 12 : 6);

      setTimeout(() => setComboFlash(false), 150);
      setTimeout(() => setScreenShake(false), 350);
      setTimeout(() => setComboTextVisible(false), 1200);
    }
  }, [setComboFlash, setScreenShake]);

  const handleDrawCard = useCallback(() => {
    const canDraw =
      phase !== 'ended' &&
      phase !== 'enemy' &&
      player.gold >= 2 &&
      player.hand.length < 7;

    if (!canDraw) {
      setIsDrawButtonShaking(true);
      setTimeout(() => setIsDrawButtonShaking(false), 500);
      return;
    }

    const success = drawCard();
    if (success) {
      const currentHand = useGameStore.getState().player.hand;
      const newCard = currentHand[currentHand.length - 1];
      if (newCard) {
        setNewCardIds((prev) => new Set([...prev, newCard.id]));
        setTimeout(() => {
          setNewCardIds((prev) => {
            const next = new Set(prev);
            next.delete(newCard.id);
            return next;
          });
        }, 700);
      }
    }
  }, [phase, player.gold, player.hand.length, drawCard]);

  const handlePlayCard = useCallback((cardId: string) => {
    const card = player.hand.find((c) => c.id === cardId);
    if (!card) return;
    if (phase === 'enemy' || phase === 'ended') return;
    if (cardsPlayedThisTurn >= 3) return;

    const newComboCount =
      comboChain.tag === card.tag
        ? Math.min(comboChain.count + 1, 3)
        : 1;

    const damage = calculateDamage(card.attack, newComboCount);

    const flyingCard: FlyingCard = {
      card,
      startX: 50,
      startY: 100,
      targetX: 50,
      targetY: 50,
      progress: 0,
    };
    setFlyingCards((prev) => [...prev, flyingCard]);

    setTimeout(() => {
      playCard(cardId);
      showDamagePopup(damage, false);
      triggerComboEffects(newComboCount);
      setFlyingCards((prev) => prev.filter((fc) => fc.card.id !== cardId));
    }, 450);
  }, [player.hand, phase, cardsPlayedThisTurn, comboChain, playCard, showDamagePopup, triggerComboEffects]);

  const handleEndTurn = useCallback(() => {
    if (phase === 'enemy' || phase === 'ended') return;
    if (phase === 'draw' && cardsPlayedThisTurn === 0 && player.hand.length === 0) return;
    endPlayPhase();
  }, [phase, cardsPlayedThisTurn, player.hand.length, endPlayPhase]);

  useEffect(() => {
    if (phase === 'enemy' && !gameResult) {
      const timer = setTimeout(() => {
        enemyAttack();
        showDamagePopup(5, true);
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [phase, gameResult, enemyAttack, showDamagePopup]);

  useEffect(() => {
    if (phase === 'enemy' && !gameResult) {
      const state = useGameStore.getState();
      if (state.enemy.hp > 0 && state.player.hp > 0) {
        const timer = setTimeout(() => {
          setTurnTransition(true);
          setTimeout(() => {
            startNewTurn();
            setTimeout(() => setTurnTransition(false), 1500);
          }, 400);
        }, 1800);
        return () => clearTimeout(timer);
      }
    }
  }, [phase, gameResult, startNewTurn, setTurnTransition]);

  useEffect(() => {
    if (!isScreenShake) {
      setShakeOffset({ x: 0, y: 0 });
      return;
    }

    const animate = (time: number) => {
      if (time - lastTimeRef.current > 16) {
        lastTimeRef.current = time;
        setShakeOffset({
          x: (Math.random() - 0.5) * shakeIntensity * 2,
          y: (Math.random() - 0.5) * shakeIntensity * 2,
        });
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isScreenShake, shakeIntensity]);

  const isPlayerHpLow = player.hp / player.maxHp <= 0.3;
  const isEnemyHpLow = enemy.hp / enemy.maxHp <= 0.3;
  const canDraw =
    phase !== 'ended' &&
    phase !== 'enemy' &&
    player.gold >= 2 &&
    player.hand.length < 7;

  const getPhaseText = () => {
    switch (phase) {
      case 'draw':
        return '抽牌阶段';
      case 'play':
        return '出牌阶段';
      case 'enemy':
        return '敌方回合';
      case 'ended':
        return '游戏结束';
    }
  };

  const canEndTurn = phase !== 'enemy' && phase !== 'ended' && !(phase === 'draw' && cardsPlayedThisTurn === 0);

  return (
    <div className="w-full h-screen flex items-center justify-center overflow-hidden" style={{ background: '#050810' }}>
      <div
        ref={containerRef}
        className="relative flex-shrink-0"
        style={{
          width: `${BASE_WIDTH}px`,
          height: `${BASE_HEIGHT}px`,
          transform: `scale(${scale}) translate(${shakeOffset.x}px, ${shakeOffset.y}px)`,
          transformOrigin: 'center center',
          background: isTurnTransition
            ? 'linear-gradient(135deg, #2d1f0a 0%, #1a1423 50%, #0a1628 100%)'
            : phase === 'draw'
            ? 'linear-gradient(135deg, #2d1f0a 0%, #1a1f35 50%, #0f172a 100%)'
            : 'linear-gradient(135deg, #0a0e1a 0%, #1a1f35 50%, #0f172a 100%)',
          transition: 'background 1.5s ease-in-out',
          fontFamily: "'Roboto', sans-serif",
        }}
      >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.1)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(139,92,246,0.1)_0%,transparent_50%)]" />
        {Array.from({ length: 80 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: `${1 + Math.random() * 2}px`,
              height: `${1 + Math.random() * 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: 0.3 + Math.random() * 0.5,
              animation: `twinkle ${2 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {isComboFlash && (
        <div className="absolute inset-0 bg-white pointer-events-none z-50" style={{ animation: 'flash 0.15s ease-out forwards' }} />
      )}

      <div className="relative z-10 h-full flex">
        <div
          className="w-[260px] flex-shrink-0 h-full flex flex-col p-3 border-r border-white/10"
          style={{ background: 'rgba(0, 0, 0, 0.4)' }}
        >
          <div className="text-center mb-3" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            <h2 className="text-lg font-bold text-amber-400 flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5" />
              卡牌商店
            </h2>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Coins className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-400 font-bold text-xl">{player.gold}</span>
            </div>
          </div>

          <button
            onClick={handleDrawCard}
            disabled={!canDraw}
            className={`
              w-full py-3 px-4 rounded-lg font-bold text-base mb-4
              flex items-center justify-center gap-2
              transition-all duration-200 relative overflow-hidden
              ${canDraw
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black hover:from-amber-400 hover:to-yellow-400 hover:scale-105 hover:shadow-lg hover:shadow-amber-500/50 active:scale-95'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }
              ${isDrawButtonShaking ? 'animate-bounce-x' : ''}
            `}
          >
            <Swords className="w-5 h-5" />
            抽牌 (-2金币)
          </button>

          <div className="text-xs text-white/60 mb-2 text-center font-medium">可抽卡牌池 (共20张)</div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden pr-1 custom-scrollbar">
            <div className="grid grid-cols-2 gap-3 p-1">
              {cardPool.map((card, idx) => (
                <div
                  key={card.id + idx}
                  className="flex justify-center items-start"
                  style={{
                    animation: `shopWiggle 3s ease-in-out infinite`,
                    animationDelay: `${(idx % 4) * 0.3}s`,
                  }}
                >
                  <Card card={card} isInShop size="small" index={idx} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="h-[14%] px-6 py-2 flex items-center justify-between border-b border-white/10 flex-shrink-0 min-h-[80px]">
            <div className="flex items-center gap-4">
              <div
                className="px-5 py-2 rounded-lg"
                style={{
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <div className="text-xs text-white/60 mb-1">回合</div>
                <div
                  className="text-3xl font-bold text-cyan-400"
                  style={{ fontFamily: "'Orbitron', sans-serif" }}
                >
                  {turn}
                </div>
              </div>
              <div
                className="px-5 py-2 rounded-lg"
                style={{
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <div className="text-xs text-white/60 mb-1">阶段</div>
                <div className="text-xl font-bold text-white">{getPhaseText()}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => saveGame()}
                className="p-2.5 rounded-lg bg-green-600/80 hover:bg-green-500 transition-all hover:scale-105 active:scale-95"
                title="保存游戏"
              >
                <Save className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={() => loadGame()}
                className="p-2.5 rounded-lg bg-blue-600/80 hover:bg-blue-500 transition-all hover:scale-105 active:scale-95"
                title="加载游戏"
              >
                <FolderOpen className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={restartGame}
                className="p-2.5 rounded-lg bg-red-600/80 hover:bg-red-500 transition-all hover:scale-105 active:scale-95"
                title="重新开始"
              >
                <RotateCcw className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-base text-red-400 font-bold mb-1.5">{enemy.name}</div>
                <div className="w-56 h-6 rounded-full overflow-hidden relative" style={{ background: 'rgba(0, 0, 0, 0.5)' }}>
                  <div
                    className={`h-full transition-all duration-500 ease-out ${isEnemyHpLow ? 'hp-warning' : ''}`}
                    style={{
                      width: `${(enemy.hp / enemy.maxHp) * 100}%`,
                      background: 'linear-gradient(90deg, #dc2626, #ef4444, #f87171)',
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                    {enemy.hp} / {enemy.maxHp}
                  </div>
                </div>
              </div>
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-4xl flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
                  border: '2px solid rgba(139, 92, 246, 0.5)',
                  boxShadow: '0 0 25px rgba(139, 92, 246, 0.4)',
                }}
              >
                👹
              </div>
            </div>
          </div>

          <div className="flex-1 relative min-h-0">
            <div
              className="absolute inset-8 rounded-xl"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundImage: `
                  linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
                `,
                backgroundSize: '50px 50px',
                boxShadow: 'inset 0 0 80px rgba(0, 0, 0, 0.5)',
              }}
            />

            {comboTextVisible && comboChain.count >= 2 && (
              <div
                className="absolute top-[25%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none"
                style={{ fontFamily: "'Orbitron', sans-serif" }}
              >
                <div
                  className="text-6xl font-black"
                  style={{
                    color: TAG_COLORS[comboChain.tag!].primary,
                    textShadow: `0 0 30px ${TAG_COLORS[comboChain.tag!].glow}, 0 0 60px ${TAG_COLORS[comboChain.tag!].glow}`,
                    animation: 'comboPop 1.2s ease-out forwards',
                  }}
                >
                  连锁 x{comboChain.count}!
                </div>
              </div>
            )}

            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex gap-4 z-10">
              {placedCards.map((card, idx) => (
                <div
                  key={card.id}
                  className="transition-all duration-500 ease-out"
                  style={{
                    transform: `rotate(${(idx - (placedCards.length - 1) / 2) * 6}deg) translateY(0)`,
                    animation: placedCards.length > 0 ? `cardSettle 0.5s ease-out ${idx * 0.1}s both` : 'none',
                  }}
                >
                  <Card card={card} isSelected={false} />
                </div>
              ))}
            </div>

            {flyingCards.map((fc) => (
              <FlyingCardDisplay key={fc.card.id} flyingCard={fc} />
            ))}

            {damagePopups.map((popup) => (
              <div
                key={popup.id}
                className="absolute transform -translate-x-1/2 pointer-events-none z-40"
                style={{
                  left: `${popup.x}%`,
                  top: `${popup.y}%`,
                  fontFamily: "'Orbitron', sans-serif",
                }}
              >
                <div
                  className="text-5xl font-black"
                  style={{
                    color: popup.isPlayer ? '#3b82f6' : '#ef4444',
                    textShadow: `0 0 20px ${popup.isPlayer ? 'rgba(59, 130, 246, 0.8)' : 'rgba(239, 68, 68, 0.8)'}`,
                    animation: 'damagePop 1.5s ease-out forwards',
                  }}
                >
                  -{popup.value}
                </div>
              </div>
            ))}

            {comboChain.count >= 2 && comboChain.tag && (
              <div
                className="absolute top-6 left-1/2 transform -translate-x-1/2 flex items-center gap-2 px-5 py-2 rounded-full z-20"
                style={{
                  background: TAG_COLORS[comboChain.tag].glow,
                  border: `2px solid ${TAG_COLORS[comboChain.tag].primary}`,
                  boxShadow: `0 0 20px ${TAG_COLORS[comboChain.tag].glow}`,
                }}
              >
                <span className="text-white font-bold text-lg" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                  {comboChain.tag} 连击 x{comboChain.count}
                </span>
              </div>
            )}
          </div>

          <div className="h-[30%] px-6 py-2 border-t border-white/10 flex flex-col flex-shrink-0 min-h-[160px]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-3xl flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #1e3a5f, #0f1d30)',
                    border: '2px solid rgba(59, 130, 246, 0.5)',
                    boxShadow: '0 0 25px rgba(59, 130, 246, 0.4)',
                  }}
                >
                  🧙
                </div>
                <div>
                  <div className="text-base text-blue-400 font-bold mb-1.5">玩家</div>
                  <div className="w-48 h-6 rounded-full overflow-hidden relative" style={{ background: 'rgba(0, 0, 0, 0.5)' }}>
                    <div
                      className={`h-full transition-all duration-500 ease-out ${isPlayerHpLow ? 'hp-warning' : ''}`}
                      style={{
                        width: `${(player.hp / player.maxHp) * 100}%`,
                        background: 'linear-gradient(90deg, #2563eb, #3b82f6, #60a5fa)',
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                      {player.hp} / {player.maxHp}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-base text-white/70">
                  已出牌: <span className="text-white font-bold">{cardsPlayedThisTurn}/3</span>
                </div>
                <div className="text-base text-white/70">
                  手牌: <span className="text-white font-bold">{player.hand.length}/7</span>
                </div>
                <button
                  onClick={handleEndTurn}
                  disabled={!canEndTurn}
                  className={`
                    px-6 py-2.5 rounded-lg font-bold text-base flex items-center gap-2 transition-all duration-200
                    ${canEndTurn
                      ? 'bg-gradient-to-r from-green-600 to-emerald-500 text-white hover:from-green-500 hover:to-emerald-400 hover:scale-105 hover:shadow-lg hover:shadow-green-500/40 active:scale-95'
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  <Play className="w-5 h-5" />
                  结束回合
                </button>
              </div>
            </div>

            <div className="flex-1 flex items-end justify-center gap-2 pb-2 overflow-x-auto">
              {player.hand.length === 0 ? (
                <div className="text-white/40 text-xl flex items-center gap-2">
                  <Sparkles className="w-6 h-6" />
                  手牌为空，点击抽牌按钮抽取卡牌
                </div>
              ) : (
                <div className="flex items-end justify-center h-full" style={{ perspective: '1000px' }}>
                  {player.hand.map((card, idx) => (
                    <div
                      key={card.id}
                      className="flex-shrink-0"
                      style={{
                        marginLeft: idx === 0 ? '0' : '-30px',
                        zIndex: idx,
                      }}
                    >
                      <Card
                        card={card}
                        isSelected={selectedCardId === card.id}
                        isNew={newCardIds.has(card.id)}
                        index={idx}
                        total={player.hand.length}
                        onSelect={selectCard}
                        onPlay={handlePlayCard}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {gameResult && (
        <div
          className="absolute inset-0 flex items-center justify-center z-50"
          style={{
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            className="p-10 rounded-3xl text-center max-w-md"
            style={{
              background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
              border: '2px solid rgba(139, 92, 246, 0.5)',
              boxShadow: '0 0 80px rgba(139, 92, 246, 0.4)',
              animation: 'modalPop 0.5s ease-out',
            }}
          >
            <div
              className="text-6xl font-black mb-6"
              style={{
                fontFamily: "'Orbitron', sans-serif",
                color: gameResult === 'win' ? '#fbbf24' : '#ef4444',
                textShadow: gameResult === 'win'
                  ? '0 0 40px rgba(251, 191, 36, 0.8)'
                  : '0 0 40px rgba(239, 68, 68, 0.8)',
              }}
            >
              {gameResult === 'win' ? '🎉 胜利!' : '💀 失败'}
            </div>
            <div className="text-white/80 mb-8 text-xl">
              {gameResult === 'win'
                ? '恭喜你击败了暗影领主！'
                : '你被暗影领主击败了...'}
            </div>
            <div className="text-white/60 mb-8 space-y-2 text-lg">
              <div>回合数: <span className="text-white font-bold">{turn}</span></div>
              <div>剩余血量: <span className="text-blue-400 font-bold">{player.hp}/{player.maxHp}</span></div>
              <div>敌方剩余: <span className="text-red-400 font-bold">{enemy.hp}/{enemy.maxHp}</span></div>
            </div>
            <button
              onClick={restartGame}
              className="px-10 py-4 rounded-xl font-bold text-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-500 hover:to-blue-500 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/50 active:scale-95 flex items-center gap-3 mx-auto"
            >
              <RotateCcw className="w-6 h-6" />
              再来一局
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.3); }
        }

        @keyframes flash {
          0% { opacity: 0.9; }
          100% { opacity: 0; }
        }

        @keyframes bounce-x {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        .animate-bounce-x {
          animation: bounce-x 0.4s ease-in-out;
        }

        @keyframes comboPop {
          0% { transform: scale(0) rotate(-10deg); opacity: 0; }
          50% { transform: scale(1.4) rotate(3deg); opacity: 1; }
          70% { transform: scale(1.1) rotate(-1deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 0; }
        }

        @keyframes damagePop {
          0% { transform: translate(-50%, 0) scale(0.5); opacity: 0; }
          25% { transform: translate(-50%, -25px) scale(1.3); opacity: 1; }
          60% { transform: translate(-50%, -40px) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -70px) scale(0.9); opacity: 0; }
        }

        @keyframes shopWiggle {
          0%, 100% { transform: rotate(-2deg) translateY(0); }
          50% { transform: rotate(2deg) translateY(-5px); }
        }

        @keyframes cardSettle {
          0% { transform: translateY(-50px) scale(0.8); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }

        @keyframes flyCard {
          0% { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
          50% { transform: translate(-50%, -120%) scale(1.15) rotate(10deg); }
          100% { transform: translate(-50%, -50%) scale(0.9) rotate(0deg); opacity: 0; }
        }

        @keyframes modalPop {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }

        .hp-warning {
          animation: hpPulse 0.8s ease-in-out infinite;
        }
        @keyframes hpPulse {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.4); }
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.35);
        }
      `}</style>
    </div>
  );
};

const FlyingCardDisplay: React.FC<{ flyingCard: FlyingCard }> = ({ flyingCard }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = performance.now();
    const duration = 450;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const newProgress = Math.min(elapsed / duration, 1);
      setProgress(newProgress);

      if (newProgress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, []);

  const x = flyingCard.startX + (flyingCard.targetX - flyingCard.startX) * progress;
  const y = flyingCard.startY + (flyingCard.targetY - flyingCard.startY) * progress - Math.sin(progress * Math.PI) * 40;
  const rotation = (progress - 0.5) * 20;
  const scale = 1 + Math.sin(progress * Math.PI) * 0.15;

  return (
    <div
      className="absolute pointer-events-none z-40"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`,
        opacity: 1 - progress * 0.2,
      }}
    >
      <Card card={flyingCard.card} />
    </div>
  );
};
