import React from 'react';
import { useGameStore } from '../store';

const GameOverModal: React.FC = () => {
  const winner = useGameStore((state) => state.winner);
  const initGame = useGameStore((state) => state.initGame);

  if (!winner) return null;

  const isVictory = winner === 'player';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        className="relative animate-fadeIn"
        style={{
          backgroundColor: '#1A1A2E',
          borderRadius: '16px',
          padding: '48px 64px',
          textAlign: 'center',
          minWidth: '400px',
          boxShadow: '0 0 60px rgba(78, 205, 196, 0.3)',
        }}
      >
        <h1
          className="mb-4"
          style={{
            fontSize: '40px',
            fontWeight: 'bold',
            color: '#FFD700',
            textShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
          }}
        >
          {isVictory ? '🎉 胜利！' : '💀 失败'}
        </h1>

        <p className="text-gray-400 mb-8 text-lg">
          {isVictory
            ? '恭喜你击败了敌方舰队，赢得了这场星战！'
            : '你的舰队已被消灭，星海棋局暂时落幕...'}
        </p>

        <button
          onClick={initGame}
          className="
            px-8 py-4 rounded-lg
            text-white font-bold text-lg
            hover:scale-105 hover:shadow-xl
            active:scale-95
            transition-all duration-150 ease
          "
          style={{
            backgroundColor: '#6BCB77',
            boxShadow: '0 4px 15px rgba(107, 203, 119, 0.4)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#7CD987';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#6BCB77';
          }}
        >
          再来一局
        </button>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default GameOverModal;
