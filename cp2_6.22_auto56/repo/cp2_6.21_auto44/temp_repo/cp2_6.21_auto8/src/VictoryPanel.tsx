import React from 'react';
import { useGameStore } from './GameStore';
import { PLAYER_COLORS } from './BoardConfig';

const CONFETTI_COUNT = 50;
const CONFETTI_COLORS = ['#EF4444', '#3B82F6', '#F59E0B', '#22C55E', '#EAB308', '#EC4899', '#8B5CF6', '#06B6D4'];

export default function VictoryPanel() {
  const { winner, players, resetGame } = useGameStore();

  const winnerPlayer = players.find(p => p.id === winner);

  const rankings = [...players].sort((a, b) => {
    const aHome = a.pieces.filter(p => p.isHome).length;
    const bHome = b.pieces.filter(p => p.isHome).length;
    return bHome - aHome;
  });

  const getRankIcon = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}`;
  };

  const confetti = Array.from({ length: CONFETTI_COUNT }, (_, i) => {
    const left = Math.random() * 100;
    const delay = Math.random() * 5;
    const duration = 3 + Math.random() * 4;
    const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    const size = 6 + Math.random() * 8;
    const rotation = Math.random() * 360;
    return { left, delay, duration, color, size, rotation, id: i };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, rgba(250, 204, 21, 0.9) 0%, rgba(202, 138, 4, 0.95) 50%, rgba(161, 98, 7, 0.95) 100%)',
        }}
      />

      {confetti.map((c) => (
        <div
          key={c.id}
          className="absolute rounded-full"
          style={{
            left: `${c.left}%`,
            top: '-20px',
            width: `${c.size}px`,
            height: `${c.size}px`,
            backgroundColor: c.color,
            animation: `confettiFall ${c.duration}s linear ${c.delay}s infinite`,
            transform: `rotate(${c.rotation}deg)`,
            boxShadow: `0 0 10px ${c.color}`,
          }}
        />
      ))}

      <div
        className="relative bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 border-4 border-yellow-500"
        style={{
          boxShadow: '0 0 60px rgba(234, 179, 8, 0.6), 0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div
          className="absolute -top-3 -left-3 w-8 h-8 border-t-4 border-l-4 border-yellow-600 rounded-tl-lg"
        />
        <div
          className="absolute -top-3 -right-3 w-8 h-8 border-t-4 border-r-4 border-yellow-600 rounded-tr-lg"
        />
        <div
          className="absolute -bottom-3 -left-3 w-8 h-8 border-b-4 border-l-4 border-yellow-600 rounded-bl-lg"
        />
        <div
          className="absolute -bottom-3 -right-3 w-8 h-8 border-b-4 border-r-4 border-yellow-600 rounded-br-lg"
        />

        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-5xl">
          👑
        </div>

        <div className="text-center mt-12">
          <h1
            className="text-5xl font-bold text-yellow-800 mb-2 font-serif"
            style={{
              textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
            }}
          >
            胜利!
          </h1>

          <div className="flex items-center justify-center gap-3 my-4">
            <div
              className="w-10 h-10 rounded-full border-3 border-yellow-400 shadow-lg"
              style={{
                backgroundColor: winnerPlayer ? PLAYER_COLORS[winnerPlayer.color] : '#888',
                borderWidth: '3px',
              }}
            />
            <h2 className="text-3xl font-bold text-yellow-900 font-serif">
              {winnerPlayer?.name || '未知玩家'}
            </h2>
          </div>

          <div className="text-yellow-700 text-lg mb-6 font-serif">
            恭喜获得比赛胜利!
          </div>

          <div className="bg-yellow-200/50 rounded-2xl p-4 mb-6">
            <h3 className="text-yellow-800 font-bold mb-3 font-serif text-lg">最终排名</h3>
            <div className="space-y-2">
              {rankings.map((player, index) => {
                const homeCount = player.pieces.filter(p => p.isHome).length;
                const isWinner = player.id === winner;
                return (
                  <div
                    key={player.id}
                    className={`flex items-center gap-3 p-2 rounded-xl ${
                      isWinner ? 'bg-yellow-400/40 border border-yellow-500' : 'bg-white/40'
                    }`}
                  >
                    <span className="text-xl w-8 text-center">{getRankIcon(index)}</span>
                    <div
                      className="w-5 h-5 rounded-full border-2 border-yellow-600"
                      style={{ backgroundColor: PLAYER_COLORS[player.color] }}
                    />
                    <span className={`flex-1 font-semibold ${isWinner ? 'text-yellow-900' : 'text-yellow-800'}`}>
                      {player.name}
                    </span>
                    <span className="text-yellow-700 font-mono font-bold">
                      {homeCount}/4 🏠
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={resetGame}
            className="w-full py-4 px-6 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-white font-bold text-xl rounded-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg font-serif"
            style={{
              boxShadow: '0 4px 15px rgba(234, 179, 8, 0.5)',
            }}
          >
            再来一局
          </button>
        </div>
      </div>

      <style>{`
        @keyframes confettiFall {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
