import React, { useState, useEffect, useCallback } from 'react';
import { useGameStore, initializeGame } from './store';
import { Creature } from './creatures';
import BattleField from './components/BattleField';
import CreatureDex from './components/CreatureDex';
import Shop from './components/Shop';
import BattleReport from './components/BattleReport';
import CreatureDetail from './components/CreatureDetail';

const App: React.FC = () => {
  const {
    gold,
    level,
    exp,
    expToNextLevel,
    wave,
    skillSlots,
    isBattling,
    battleResult,
    showBattleReport,
    currentBattleLogIndex,
    startBattle,
    nextBattleLog,
    finishBattle,
    closeBattleReport,
    nextWave,
    screenShake,
  } = useGameStore();

  const [selectedCreature, setSelectedCreature] = useState<Creature | null>(null);
  const [draggedCreature, setDraggedCreature] = useState<Creature | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    initializeGame();
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (!isBattling || !battleResult) return;

    const timer = setInterval(() => {
      const hasMore = nextBattleLog();
      if (!hasMore) {
        clearInterval(timer);
        setTimeout(() => {
          finishBattle();
        }, 800);
      }
    }, 600);

    return () => clearInterval(timer);
  }, [isBattling, battleResult, nextBattleLog, finishBattle]);

  const handleCreatureClick = useCallback((creature: Creature) => {
    setSelectedCreature(creature);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedCreature(null);
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, creature: Creature) => {
    setDraggedCreature(creature);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedCreature(null);
  }, []);

  const handleStartBattle = useCallback(() => {
    if (!isBattling) {
      startBattle();
    }
  }, [isBattling, startBattle]);

  const handleNextWave = useCallback(() => {
    nextWave();
    closeBattleReport();
  }, [nextWave, closeBattleReport]);

  if (!initialized) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">加载中...</div>
      </div>
    );
  }

  const expPercent = (exp / expToNextLevel) * 100;

  return (
    <div
      className="w-screen h-screen overflow-hidden relative"
      style={{
        background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1030 50%, #0f0a20 100%)',
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 20% 80%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(59, 130, 246, 0.05) 0%, transparent 70%)
          `,
        }}
      />

      <div
        className={`absolute inset-0 transition-transform duration-100 ${
          screenShake ? 'animate-shake' : ''
        }`}
      >
        <div className="relative z-10 h-full flex flex-col p-4 gap-4">
          <div
            className="flex items-center justify-between px-6 py-3 rounded-xl"
            style={{
              background: 'linear-gradient(180deg, rgba(30, 30, 60, 0.8) 0%, rgba(20, 20, 40, 0.8) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div className="flex items-center gap-6">
              <h1
                className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
                style={{
                  textShadow: '0 0 30px rgba(99, 102, 241, 0.5)',
                }}
              >
                ✨ 魔法生物军团
              </h1>
              <div
                className="px-4 py-1 rounded-full text-sm font-bold"
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white',
                  boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)',
                }}
              >
                第 {wave} 波
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-yellow-400 text-xl">💰</span>
                <span className="text-yellow-300 font-bold text-lg">{gold}</span>
              </div>

              <div className="flex flex-col items-end">
                <div className="flex items-center gap-2">
                  <span className="text-purple-400">⭐</span>
                  <span className="text-purple-300 font-bold">Lv.{level}</span>
                  <span className="text-gray-500 text-xs">技能槽: {skillSlots}</span>
                </div>
                <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${expPercent}%`,
                      background: 'linear-gradient(90deg, #a855f7, #c084fc)',
                      boxShadow: '0 0 10px rgba(168, 85, 247, 0.5)',
                    }}
                  />
                </div>
                <span className="text-[10px] text-gray-500">
                  {exp}/{expToNextLevel} EXP
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 flex gap-4 min-h-0">
            <div className="w-64 flex-shrink-0">
              <CreatureDex
                onCreatureClick={handleCreatureClick}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              />
            </div>

            <div className="flex-1 min-w-0 flex flex-col gap-4">
              <div className="flex-1 min-h-0">
                <BattleField onCreatureClick={handleCreatureClick} />
              </div>

              <div className="flex justify-center">
                <button
                  onClick={handleStartBattle}
                  disabled={isBattling}
                  className={`
                    px-12 py-4 rounded-2xl font-bold text-xl
                    transition-all duration-300
                    ${isBattling ? 'cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
                  `}
                  style={{
                    background: isBattling
                      ? 'linear-gradient(135deg, #4b5563 0%, #6b7280 100%)'
                      : 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)',
                    color: 'white',
                    boxShadow: isBattling
                      ? 'none'
                      : '0 6px 30px rgba(239, 68, 68, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                    border: '2px solid',
                    borderColor: isBattling ? '#6b7280' : '#f87171',
                  }}
                >
                  {isBattling ? '⚔️ 战斗中...' : '⚔️ 开始战斗'}
                </button>
              </div>
            </div>

            <div className="w-72 flex-shrink-0">
              <Shop />
            </div>
          </div>
        </div>
      </div>

      {showBattleReport && battleResult && (
        <BattleReport
          result={battleResult}
          onClose={closeBattleReport}
          onNextWave={handleNextWave}
        />
      )}

      {selectedCreature && (
        <CreatureDetail
          creature={selectedCreature}
          onClose={handleCloseDetail}
        />
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10% { transform: translateX(-5px) translateY(-2px); }
          20% { transform: translateX(5px) translateY(2px); }
          30% { transform: translateX(-3px) translateY(1px); }
          40% { transform: translateX(3px) translateY(-1px); }
          50% { transform: translateX(-2px) translateY(0); }
          60% { transform: translateX(2px) translateY(0); }
          70% { transform: translateX(-1px) translateY(0); }
          80% { transform: translateX(1px) translateY(0); }
        }
        .animate-shake {
          animation: shake 0.15s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default App;
