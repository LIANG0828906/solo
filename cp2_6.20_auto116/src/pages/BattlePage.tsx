import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';
import { GameBoard } from '../modules/board/GameBoard';
import { HandCards } from '../components/HandCards';
import { BattleLog } from '../components/BattleLog';
import { ControlPanel } from '../components/ControlPanel';
import { BoardCard, Position, GamePhase, TurnPlayer } from '../modules/card/CardTypes';
import { ArrowLeft, RotateCcw, Trophy, Skull } from 'lucide-react';

const AI_ACTION_DELAY = 1500;

const skillEffectTexts: Record<string, string> = {
  damage_all: '全体伤害',
  damage_front: '前方打击',
  heal: '治疗恢复',
  draw: '抽牌效果',
  freeze: '冰冻效果',
  burn: '灼烧效果',
  lifesteal: '生命吸取',
  pierce: '穿透攻击',
};

function getSkillEffectText(effectKey: string): string {
  if (!effectKey) return '技能触发';
  const prefix = effectKey.replace(/_\d+$/, '');
  return skillEffectTexts[prefix] || '技能触发';
}

const SkillEffectTip: React.FC<{ effect: string | null; onDone: () => void }> = ({
  effect,
  onDone,
}) => {
  useEffect(() => {
    if (effect) {
      const timer = setTimeout(onDone, 2000);
      return () => clearTimeout(timer);
    }
  }, [effect, onDone]);

  if (!effect) return null;

  return (
    <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
      <div
        className="px-8 py-4 rounded-xl text-white text-2xl font-bold"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.9), rgba(255, 140, 0, 0.9))',
          boxShadow: '0 0 40px rgba(255, 215, 0, 0.5)',
          animation: 'skillEffectAnim 2s ease-out forwards',
        }}
      >
        ⚡ {getSkillEffectText(effect)} ⚡
      </div>
    </div>
  );
};

export const BattlePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    gameState,
    selectedCardIndex,
    selectedBoardCardId,
    battleEvents,
    recentlyDamaged,
    setSelectedCardIndex,
    setSelectedBoardCardId,
    playCard,
    attackCard,
    endTurn,
    startGame,
    executeAIActions,
    initGame,
  } = useGameStore();

  const [dragInfo, setDragInfo] = useState<{ index: number; cost: number } | null>(null);
  const [skillEffect, setSkillEffect] = useState<string | null>(null);

  const isPlayerTurn = gameState.turn === TurnPlayer.PLAYER;
  const isGameOver = gameState.phase === GamePhase.ENDED;

  useEffect(() => {
    if (gameState.phase === GamePhase.PREPARING) {
      startGame();
    }
  }, [gameState.phase, startGame]);

  useEffect(() => {
    if (
      gameState.phase === GamePhase.PLAYING &&
      gameState.turn === TurnPlayer.AI &&
      !isGameOver
    ) {
      const timer = setTimeout(() => {
        executeAIActions();
      }, AI_ACTION_DELAY);
      return () => clearTimeout(timer);
    }
  }, [gameState.turn, gameState.phase, isGameOver, executeAIActions]);

  useEffect(() => {
    if (gameState.skillEffectPlaying) {
      setSkillEffect(gameState.skillEffectPlaying);
      const timer = setTimeout(() => {
        setSkillEffect(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [gameState.skillEffectPlaying]);

  const handleSkillEffectDone = useCallback(() => {
    setSkillEffect(null);
  }, []);

  const handleCardSelect = useCallback(
    (index: number) => {
      if (!isPlayerTurn || isGameOver) return;
      setSelectedCardIndex(selectedCardIndex === index ? null : index);
    },
    [isPlayerTurn, isGameOver, selectedCardIndex, setSelectedCardIndex]
  );

  const handleCardDragStart = useCallback(
    (index: number, e: React.DragEvent) => {
      if (!isPlayerTurn || isGameOver) return;
      const card = gameState.player.hand[index];
      if (card && card.cost <= gameState.player.mana) {
        setDragInfo({ index, cost: card.cost });
        setSelectedCardIndex(index);
      }
    },
    [isPlayerTurn, isGameOver, gameState.player.hand, gameState.player.mana, setSelectedCardIndex]
  );

  const handleCardDragEnd = useCallback(() => {
    setDragInfo(null);
  }, []);

  const handleCellDragOver = useCallback((e: React.DragEvent, _position: Position) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleCellDrop = useCallback(
    (position: Position) => {
      if (!dragInfo || !isPlayerTurn || isGameOver) return;

      const card = gameState.player.hand[dragInfo.index];
      if (card && card.cost <= gameState.player.mana) {
        const success = playCard(dragInfo.index, position);
        if (success) {
          setDragInfo(null);
          setSelectedCardIndex(null);
        }
      }
    },
    [dragInfo, isPlayerTurn, isGameOver, gameState.player.hand, gameState.player.mana, playCard, setSelectedCardIndex]
  );

  const handleBoardCardClick = useCallback(
    (card: BoardCard) => {
      if (!isPlayerTurn || isGameOver) return;

      if (card.owner === 'player') {
        if (card.canAttack && !card.hasAttacked && !card.isFrozen) {
          setSelectedBoardCardId(
            selectedBoardCardId === card.instanceId ? null : card.instanceId
          );
        }
      } else {
        if (selectedBoardCardId) {
          attackCard(selectedBoardCardId, card.instanceId);
        }
      }
    },
    [isPlayerTurn, isGameOver, selectedBoardCardId, setSelectedBoardCardId, attackCard]
  );

  const handleEndTurn = useCallback(() => {
    if (!isPlayerTurn || isGameOver) return;
    setSelectedCardIndex(null);
    setSelectedBoardCardId(null);
    endTurn();
  }, [isPlayerTurn, isGameOver, setSelectedCardIndex, setSelectedBoardCardId, endTurn]);

  const handleRestart = useCallback(() => {
    initGame();
    setTimeout(() => startGame(), 100);
  }, [initGame, startGame]);

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/50 text-gray-300
                     hover:bg-gray-700/50 transition-colors"
            onClick={() => navigate('/')}
          >
            <ArrowLeft size={20} />
            <span>返回</span>
          </button>

          <h1 className="text-2xl font-bold text-yellow-400">卡牌对战</h1>

          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/50 text-gray-300
                     hover:bg-gray-700/50 transition-colors"
            onClick={handleRestart}
          >
            <RotateCcw size={20} />
            <span>重开</span>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 flex flex-col items-center">
            <GameBoard
              playerBoard={gameState.player.board}
              aiBoard={gameState.ai.board}
              playerHealth={gameState.player.health}
              playerMaxHealth={gameState.player.maxHealth}
              aiHealth={gameState.ai.health}
              aiMaxHealth={gameState.ai.maxHealth}
              currentTurn={gameState.turn}
              selectedBoardCardId={selectedBoardCardId}
              dragCard={dragInfo}
              playerMana={gameState.player.mana}
              battleEvents={battleEvents}
              recentlyDamaged={recentlyDamaged}
              onCardClick={handleBoardCardClick}
              onCellDrop={handleCellDrop}
              onCellDragOver={handleCellDragOver}
            />

            <div className="mt-4 w-full max-w-md">
              <HandCards
                cards={gameState.player.hand}
                mana={gameState.player.mana}
                maxMana={gameState.player.maxMana}
                selectedIndex={selectedCardIndex}
                onCardSelect={handleCardSelect}
                onCardDragStart={handleCardDragStart}
                onCardDragEnd={handleCardDragEnd}
                disabled={!isPlayerTurn || isGameOver}
              />
            </div>
          </div>

          <div className="w-full lg:w-80 space-y-4">
            <ControlPanel
              playerHealth={gameState.player.health}
              playerMaxHealth={gameState.player.maxHealth}
              playerMana={gameState.player.mana}
              playerMaxMana={gameState.player.maxMana}
              aiHealth={gameState.ai.health}
              aiMaxHealth={gameState.ai.maxHealth}
              aiMana={gameState.ai.mana}
              aiMaxMana={gameState.ai.maxMana}
              turnNumber={gameState.turnNumber}
              isPlayerTurn={isPlayerTurn}
              onEndTurn={handleEndTurn}
              disabled={isGameOver}
            />

            <BattleLog logs={gameState.logs} />
          </div>
        </div>

        <SkillEffectTip effect={skillEffect} onDone={handleSkillEffectDone} />

        {isGameOver && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div
              className="p-8 rounded-2xl text-center max-w-md mx-4"
              style={{
                background: 'linear-gradient(135deg, #2a2a4a, #1a1a2e)',
                border: '2px solid rgba(255, 215, 0, 0.3)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
              }}
            >
              {gameState.winner === TurnPlayer.PLAYER ? (
                <>
                  <Trophy className="mx-auto text-yellow-400 mb-4" size={64} />
                  <h2 className="text-3xl font-bold text-yellow-400 mb-2">胜利！</h2>
                  <p className="text-gray-400 mb-6">恭喜你击败了AI对手！</p>
                </>
              ) : (
                <>
                  <Skull className="mx-auto text-red-400 mb-4" size={64} />
                  <h2 className="text-3xl font-bold text-red-400 mb-2">失败</h2>
                  <p className="text-gray-400 mb-6">别灰心，再接再厉！</p>
                </>
              )}

              <div className="flex gap-4 justify-center">
                <button
                  className="px-6 py-3 rounded-xl font-bold text-white transition-all hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
                    boxShadow: '0 4px 15px rgba(255, 215, 0, 0.4)',
                  }}
                  onClick={handleRestart}
                >
                  再来一局
                </button>
                <button
                  className="px-6 py-3 rounded-xl font-bold text-gray-300
                           bg-gray-700 hover:bg-gray-600 transition-all hover:scale-105"
                  onClick={() => navigate('/deck-builder')}
                >
                  编辑卡组
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes skillEffectAnim {
          0% {
            opacity: 0;
            transform: scale(0.5);
          }
          20% {
            opacity: 1;
            transform: scale(1.1);
          }
          70% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
        }
      `}</style>
    </div>
  );
};
