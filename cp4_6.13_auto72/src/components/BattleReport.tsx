import React from 'react';
import { BattleResult } from '../combatEngine';
import { Creature } from '../creatures';

interface BattleReportProps {
  result: BattleResult;
  onClose: () => void;
  onNextWave: () => void;
}

const BattleReport: React.FC<BattleReportProps> = ({ result, onClose, onNextWave }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        className="relative w-[500px] rounded-2xl p-6 animate-scale-in"
        style={{
          background: 'linear-gradient(180deg, #1a1a3a 0%, #0a0a2a 100%)',
          border: '2px solid #6366f1',
          boxShadow: '0 0 60px rgba(99, 102, 241, 0.5), inset 0 0 40px rgba(99, 102, 241, 0.1)',
        }}
      >
        <div className="text-center mb-6">
          <h2
            className="text-3xl font-bold mb-2"
            style={{
              color: result.victory ? '#22c55e' : '#ef4444',
              textShadow: result.victory
                ? '0 0 20px rgba(34, 197, 94, 0.6)'
                : '0 0 20px rgba(239, 68, 68, 0.6)',
            }}
          >
            {result.victory ? '🎉 胜 利 ！' : '💀 失 败 ...'}
          </h2>
          <p className="text-gray-400">战斗结算</p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div
            className="p-4 rounded-xl"
            style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
            }}
          >
            <h3 className="text-blue-400 font-bold text-center mb-3">我方存活</h3>
            <div className="flex flex-wrap justify-center gap-2">
              {result.remainingAllies.length > 0 ? (
                result.remainingAllies.map((creature: Creature, index: number) => (
                  <div
                    key={index}
                    className="text-2xl p-2 rounded-lg bg-blue-900/30"
                    title={creature.name}
                  >
                    {creature.emoji}
                  </div>
                ))
              ) : (
                <span className="text-gray-500 text-sm">全军覆没</span>
              )}
            </div>
          </div>

          <div
            className="p-4 rounded-xl"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            <h3 className="text-red-400 font-bold text-center mb-3">敌方存活</h3>
            <div className="flex flex-wrap justify-center gap-2">
              {result.remainingEnemies.length > 0 ? (
                result.remainingEnemies.map((creature: Creature, index: number) => (
                  <div
                    key={index}
                    className="text-2xl p-2 rounded-lg bg-red-900/30"
                    title={creature.name}
                  >
                    {creature.emoji}
                  </div>
                ))
              ) : (
                <span className="text-gray-500 text-sm">全部消灭</span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center py-2 px-4 bg-gray-800/50 rounded-lg">
            <span className="text-gray-400">造成总伤害</span>
            <span className="text-orange-400 font-bold text-lg">{result.totalDamageDealt}</span>
          </div>
          <div className="flex justify-between items-center py-2 px-4 bg-gray-800/50 rounded-lg">
            <span className="text-gray-400">承受总伤害</span>
            <span className="text-red-400 font-bold text-lg">{result.totalDamageTaken}</span>
          </div>
          <div className="flex justify-between items-center py-2 px-4 bg-yellow-900/20 rounded-lg border border-yellow-600/30">
            <span className="text-yellow-400 font-bold">💰 金币奖励</span>
            <span className="text-yellow-300 font-bold text-xl">+{result.goldReward}</span>
          </div>
          <div className="flex justify-between items-center py-2 px-4 bg-purple-900/20 rounded-lg border border-purple-600/30">
            <span className="text-purple-400 font-bold">⭐ 经验奖励</span>
            <span className="text-purple-300 font-bold text-xl">+{result.expReward}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #4b5563 0%, #6b7280 100%)',
              color: 'white',
              boxShadow: '0 4px 15px rgba(75, 85, 99, 0.4)',
            }}
          >
            关闭
          </button>
          {result.victory && (
            <button
              onClick={onNextWave}
              className="flex-1 py-3 rounded-xl font-bold transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #22c55e 0%, #4ade80 100%)',
                color: 'white',
                boxShadow: '0 4px 20px rgba(34, 197, 94, 0.5)',
              }}
            >
              下一波 ⚔️
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes scale-in {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          70% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  );
};

export default BattleReport;
