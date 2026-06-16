import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Coins, Swords, RotateCcw, Play, Save, FolderOpen } from 'lucide-react';
import { useGameStore } from '../store';
import { Card } from './Card';
import type { DamagePopup, FlyingCard } from '../types';
import { TAG_COLORS } from '../types';
import { calculateDamage, canDrawCard } from '../utils/combatEngine';

export const GameBoard: React.FC = () => {
  const {
    player,
    enemy,
    turn,
    phase,
    cardsPlayedThisTurn,
    comboChain,
    cardPool,
    gameResult,
    placedCards,
    selectedCardId,
    isComboFlash,
    isScreenShake,
    isTurnTransition,
    shakeIntensity,
    drawCard,
    selectCard,
    playCard,
    endPlayPhase,
    enemyAttack,
    startNewTurn,
    restartGame,
    saveGame,
    loadGame,
    setComboFlash,
    setScreenShake,
    setTurnTransition,
  } = useGameStore();

  const [damagePopups, setDamagePopups] = useState<DamagePopup[]>([]);
  const [flyingCards, setFlyingCards] = useState<FlyingCard[]>([]);
  const [newCardIds, setNewCardIds] = useState<Set<string>>(new Set());
  const [shakeOffset, setShakeOffset] = useState({ x: 0, y: 0 });
  const [comboText, setComboText] = useState<{ count: number; visible: boolean } | null>(null);
  const [isDrawButtonDisabled, setIsDrawButtonDisabled] = useState(false);

  const boardRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  const showDamagePopup = useCallback((value: number, isPlayer: boolean) => {
    const popup: DamagePopup = {
      id: uuidv4(),
      value,
      x: isPlayer ? 50 : 50,
      y: isPlayer ? 80 : 20,
      isPlayer,
    };
    setDamagePopups((prev) => [...prev, popup]);
    setTimeout(() => {
      setDamagePopups((prev) => prev.filter((p) => p.id !== popup.id));
    }, 1500);
  }, []);

  const triggerComboEffects = useCallback((comboCount: number) => {
    if (comboCount >= 2) {
      setComboText({ count: comboCount, visible: true });
      setComboFlash(true);
      setScreenShake(true, comboCount === 3 ? 10 : 5);

      setTimeout(() => setComboFlash(false), 150);
      setTimeout(() => setScreenShake(false), 300);
      setTimeout(() => setComboText(null), 1000);
    }
  }, [setComboFlash, setScreenShake]);

  const handleDrawCard = useCallback(() => {
    if (isDrawButtonDisabled) return;

    const state = useGameStore.getState();
    if (!canDrawCard(state)) {
      setIsDrawButtonDisabled(true);
      setTimeout(() => setIsDrawButtonDisabled(false), 500);
      return;
    }

    const success = drawCard();
    if (success) {
      const newHand = useGameStore.getState().player.hand;
      const newCard = newHand[newHand.length - 1];
      if (newCard) {
        setNewCardIds((prev) => new Set([...prev, newCard.id]));
        setTimeout(() => {
          setNewCardIds((prev) => {
            const next = new Set(prev);
            next.delete(newCard.id);
            return next;
          });
        }, 600);
      }
    }
  }, [drawCard, isDrawButtonDisabled]);

  const handlePlayCard = useCallback((cardId: string) => {
    const card = player.hand.find((c) => c.id === cardId);
    if (!card || phase === 'enemy' || phase === 'ended') return;
    if (cardsPlayedThisTurn >= 3) return;

    const flyingCard: FlyingCard = {
      card,
      startX: 0,
      startY: 100,
      targetX: 50,
      targetY: 50,
      progress: 0,
    };
    setFlyingCards((prev) => [...prev, flyingCard]);

    const newChain =
      comboChain.tag === card.tag
        ? { tag: card.tag, count: Math.min(comboChain.count + 1, 3) }
        : { tag: card.tag, count: 1 };

    const damage = calculateDamage(card.attack, newChain.count);

    setTimeout(() => {
      playCard(cardId);
      showDamagePopup(damage, false);
      triggerComboEffects(newChain.count);
      setFlyingCards((prev) => prev.filter((fc) => fc.card.id !== cardId));
    }, 400);
  }, [player.hand, phase, cardsPlayedThisTurn, comboChain, playCard, showDamagePopup, triggerComboEffects]);

  const handleEndTurn = useCallback(() => {
    if (phase === 'enemy' || phase === 'ended') return;
    endPlayPhase();
  }, [phase, endPlayPhase]);

  useEffect(() => {
    if (phase === 'enemy' && !gameResult) {
      const timer = setTimeout(() => {
        enemyAttack();
        showDamagePopup(5, true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [phase, gameResult, enemyAttack, showDamagePopup]);

  useEffect(() => {
    if (phase === 'enemy' && !gameResult) {
      const currentState = useGameStore.getState();
      if (currentState.enemy.hp > 0 && currentState.player.hp > 0) {
        const timer = setTimeout(() => {
          setTurnTransition(true);
          setTimeout(() => {
            startNewTurn();
            setTimeout(() => setTurnTransition(false), 1500);
          }, 300);
        }, 1600);
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

  return (
    <div
      ref={boardRef}
      className="relative w-full h-screen overflow-hidden"
      style={{
        background: isTurnTransition
          ? 'linear-gradient(135deg, #2d1f0a 0%, #1a1423 50%, #0a1628 100%)'
          : 'linear-gradient(135deg, #0a0e1a 0%, #1a1f35 50%, #0f172a 100%)',
        transition: 'background 1.5s ease-in-out',
        transform: `translate(${shakeOffset.x}px, ${shakeOffset.y}px)`,
        fontFamily: "'Roboto', sans-serif",
      }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.1)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(139,92,246,0.1)_0%,transparent_50%)]" />
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-50"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {isComboFlash && (
        <div className="absolute inset-0 bg-white pointer-events-none z-50 animate-flash" />
      )}

      <div className="relative z-10 h-full flex">
        <div
          className="w-[18%] h-full flex flex-col p-3 border-r border-white/10"
          style={{ background: 'rgba(0, 0, 0, 0.3)' }}
        >
          <div
            className="text-center mb-3"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            <h2 className="text-lg font-bold text-amber-400">卡牌商店</h2>
            <div className="flex items-center justify-center gap-2 mt-1">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 font-bold text-lg">{player.gold}</span>
            </div>
          </div>

          <button
            onClick={handleDrawCard}
            disabled={!canDraw || isDrawButtonDisabled}
            className={`
              w-full py-3 px-4 rounded-lg font-bold text-sm mb-3
              flex items-center justify-center gap-2
              transition-all duration-200
              ${canDraw && !isDrawButtonDisabled
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black hover:from-amber-400 hover:to-yellow-400 hover:scale-105 hover:shadow-lg hover:shadow-amber-500/50'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }
              ${isDrawButtonDisabled ? 'animate-shake' : ''}
            `}
          >
            <Swords className="w-4 h-4" />
            抽牌 (-2金币)
          </button>

          <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-2 pr-1 custom-scrollbar">
            <div className="text-xs text-white/60 mb-1 text-center">可抽卡牌池</div>
            <div className="grid grid-cols-1 gap-2">
              {cardPool.map((card, idx) => (
                <div key={card.id + idx} className="flex justify-center">
                  <Card card={card} isInShop />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="h-[18%] px-6 py-3 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-4">
              <div
                className="px-4 py-2 rounded-lg"
                style={{
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <div className="text-xs text-white/60">回合</div>
                <div
                  className="text-2xl font-bold text-cyan-400"
                  style={{ fontFamily: "'Orbitron', sans-serif" }}
                >
                  {turn}
                </div>
              </div>
              <div
                className="px-4 py-2 rounded-lg"
                style={{
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <div className="text-xs text-white/60">阶段</div>
                <div className="text-lg font-bold text-white">{getPhaseText()}</div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => saveGame()}
                className="p-2 rounded-lg bg-green-600/80 hover:bg-green-500 transition-colors"
                title="保存游戏"
              >
                <Save className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={() => loadGame()}
                className="p-2 rounded-lg bg-blue-600/80 hover:bg-blue-500 transition-colors"
                title="加载游戏"
              >
                <FolderOpen className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={restartGame}
                className="p-2 rounded-lg bg-red-600/80 hover:bg-red-500 transition-colors"
                title="重新开始"
              >
                <RotateCcw className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-red-400 font-bold mb-1">{enemy.name}</div>
                <div className="w-48 h-5 rounded-full overflow-hidden relative" style={{ background: 'rgba(0, 0, 0, 0.5)' }}>
                  <div
                    className={`h-full transition-all duration-500 ${isEnemyHpLow ? 'animate-pulse' : ''}`}
                    style={{
                      width: `${(enemy.hp / enemy.maxHp) * 100}%`,
                      background: 'linear-gradient(90deg, #dc2626, #ef4444)',
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                    {enemy.hp} / {enemy.maxHp}
                  </div>
                </div>
              </div>
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                style={{
                  background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
                  border: '2px solid rgba(139, 92, 246, 0.5)',
                  boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)',
                }}
              >
                👹
              </div>
            </div>
          </div>

          <div className="flex-1 relative">
            <div
              className="absolute inset-6 rounded-xl"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundImage: `
                  linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px',
                boxShadow: 'inset 0 0 60px rgba(0, 0, 0, 0.5)',
              }}
            />

            {comboText && comboText.visible && (
              <div
                className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30"
                style={{ fontFamily: "'Orbitron', sans-serif" }}
              >
                <div
                  className="text-5xl font-black text-amber-400 animate-combo-pop"
                  style={{
                    textShadow: '0 0 20px rgba(251, 191, 36, 0.8), 0 0 40px rgba(251, 191, 36, 0.4)',
                  }}
                >
                  连锁x{comboText.count}!
                </div>
              </div>
            )}

            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex gap-4">
              {placedCards.map((card, idx) => (
                <div
                  key={card.id}
                  className="transform transition-all duration-300"
                  style={{
                    transform: `rotate(${(idx - (placedCards.length - 1) / 2) * 5}deg)`,
                  }}
                >
                  <Card card={card} isSelected={false} />
                </div>
              ))}
            </div>

            {flyingCards.map((fc) => (
              <FlyingCardComponent key={fc.card.id} flyingCard={fc} />
            ))}

            {damagePopups.map((popup) => (
              <div
                key={popup.id}
                className="absolute transform -translate-x-1/2 pointer-events-none animate-damage-pop"
                style={{
                  left: `${popup.x}%`,
                  top: `${popup.y}%`,
                  fontFamily: "'Orbitron', sans-serif",
                }}
              >
                <div
                  className="text-4xl font-black"
                  style={{
                    color: popup.isPlayer ? '#3b82f6' : '#ef4444',
                    textShadow: `0 0 10px ${popup.isPlayer ? 'rgba(59, 130, 246, 0.8)' : 'rgba(239, 68, 68, 0.8)'}`,
                  }}
                >
                  -{popup.value}
                </div>
              </div>
            ))}

            {comboChain.count >= 2 && comboChain.tag && (
              <div className="absolute top-20 left-1/2 transform -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full"
                style={{
                  background: TAG_COLORS[comboChain.tag].glow,
                  border: `2px solid ${TAG_COLORS[comboChain.tag].primary}`,
                }}
              >
                <span className="text-white font-bold" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                  {comboChain.tag} 连击 x{comboChain.count}
                </span>
              </div>
            )}
          </div>

          <div className="h-[22%] px-6 py-3 border-t border-white/10 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                  style={{
                    background: 'linear-gradient(135deg, #1e3a5f, #0f1d30)',
                    border: '2px solid rgba(59, 130, 246, 0.5)',
                    boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)',
                  }}
                >
                  🧙
                </div>
                <div>
                  <div className="text-sm text-blue-400 font-bold mb-1">玩家</div>
                  <div className="w-40 h-5 rounded-full overflow-hidden relative" style={{ background: 'rgba(0, 0, 0, 0.5)' }}>
                    <div
                      className={`h-full transition-all duration-500 ${isPlayerHpLow ? 'animate-pulse' : ''}`}
                      style={{
                        width: `${(player.hp / player.maxHp) * 100}%`,
                        background: 'linear-gradient(90deg, #2563eb, #3b82f6)',
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                      {player.hp} / {player.maxHp}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-sm text-white/60">
                  已出牌: <span className="text-white font-bold">{cardsPlayedThisTurn}/3</span>
                </div>
                <div className="text-sm text-white/60">
                  手牌: <span className="text-white font-bold">{player.hand.length}/7</span>
                </div>
                <button
                  onClick={handleEndTurn}
                  disabled={phase === 'enemy' || phase === 'ended' || (phase === 'draw' && cardsPlayedThisTurn === 0)}
                  className={`
                    px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-all duration-200
                    ${phase !== 'enemy' && phase !== 'ended' && !(phase === 'draw' && cardsPlayedThisTurn === 0)
                      ? 'bg-gradient-to-r from-green-600 to-emerald-500 text-white hover:from-green-500 hover:to-emerald-400 hover:scale-105'
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  <Play className="w-4 h-4" />
                  结束回合
                </button>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center gap-2 overflow-x-auto pb-2">
              {player.hand.length === 0 ? (
                <div className="text-white/40 text-lg">手牌为空，点击抽牌按钮抽取卡牌</div>
              ) : (
                player.hand.map((card, idx) => (
                  <div key={card.id} className="flex-shrink-0">
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
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {gameResult && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
          <div
            className="p-8 rounded-2xl text-center max-w-md"
            style={{
              background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
              border: '2px solid rgba(139, 92, 246, 0.5)',
              boxShadow: '0 0 60px rgba(139, 92, 246, 0.3)',
            }}
          >
            <div
              className="text-5xl font-black mb-4"
              style={{
                fontFamily: "'Orbitron', sans-serif",
                color: gameResult === 'win' ? '#fbbf24' : '#ef4444',
                textShadow: gameResult === 'win'
                  ? '0 0 30px rgba(251, 191, 36, 0.8)'
                  : '0 0 30px rgba(239, 68, 68, 0.8)',
              }}
            >
              {gameResult === 'win' ? '🎉 胜利!' : '💀 失败'}
            </div>
            <div className="text-white/80 mb-6 text-lg">
              {gameResult === 'win'
                ? '恭喜你击败了暗影领主！'
                : '你被暗影领主击败了...'}
            </div>
            <div className="text-white/60 mb-6">
              <div>回合数: {turn}</div>
              <div>剩余血量: {player.hp}/{player.maxHp}</div>
              <div>敌方剩余: {enemy.hp}/{enemy.maxHp}</div>
            </div>
            <button
              onClick={restartGame}
              className="px-8 py-3 rounded-lg font-bold text-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-500 hover:to-blue-500 transition-all duration-200 hover:scale-105 flex items-center gap-2 mx-auto"
            >
              <RotateCcw className="w-5 h-5" />
              再来一局
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.2); }
        }

        @keyframes flash {
          0% { opacity: 0.8; }
          100% { opacity: 0; }
        }
        .animate-flash {
          animation: flash 0.15s ease-out forwards;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }

        @keyframes combo-pop {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(1); opacity: 0; }
        }
        .animate-combo-pop {
          animation: combo-pop 1s ease-out forwards;
        }

        @keyframes damage-pop {
          0% { transform: translate(-50%, 0) scale(0.5); opacity: 0; }
          30% { transform: translate(-50%, -30px) scale(1.2); opacity: 1; }
          100% { transform: translate(-50%, -60px) scale(1); opacity: 0; }
        }
        .animate-damage-pop {
          animation: damage-pop 1.5s ease-out forwards;
        }

        @keyframes particleFloat {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(${Math.random() > 0.5 ? '' : '-'}${10 + Math.random() * 20}px, -${20 + Math.random() * 30}px) scale(0); opacity: 0; }
        }

        @keyframes cardFlipIn {
          0% { transform: rotateY(180deg) scale(0.5); opacity: 0; }
          100% { transform: rotateY(0deg) scale(1); opacity: 1; }
        }
        .card-flip-in {
          animation: cardFlipIn 0.6s ease-out forwards;
          transform-style: preserve-3d;
        }

        @keyframes shopWiggle {
          0%, 100% { transform: rotate(-2deg); }
          50% { transform: rotate(2deg); }
        }
        .shop-card {
          animation: shopWiggle 3s ease-in-out infinite;
        }
        .shop-card:hover {
          animation-play-state: paused;
        }

        @keyframes flyCard {
          0% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -150%) scale(1.1); }
          100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
};

const FlyingCardComponent: React.FC<{ flyingCard: FlyingCard }> = ({ flyingCard }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 400;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(elapsed / duration, 1);
      setProgress(newProgress);

      if (newProgress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, []);

  const x = flyingCard.startX + (flyingCard.targetX - flyingCard.startX) * progress;
  const y = flyingCard.startY + (flyingCard.targetY - flyingCard.startY) * progress - Math.sin(progress * Math.PI) * 30;

  return (
    <div
      className="absolute pointer-events-none z-40"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
        opacity: 1 - progress * 0.3,
      }}
    >
      <Card card={flyingCard.card} />
    </div>
  );
};
