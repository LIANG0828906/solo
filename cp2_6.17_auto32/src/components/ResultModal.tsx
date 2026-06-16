import React from 'react';
import { useBoardStore } from '../game/board';
import { syncRestart } from '../network/syncClient';
import { Trophy, Frown, Scale, RotateCcw, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

const ResultModal: React.FC = () => {
  const { phase, winner, players, localPlayer } = useBoardStore();

  const show = phase === 'ended';

  if (!show) return null;

  const isWin = localPlayer && winner === localPlayer;
  const isLose = localPlayer && winner !== null && winner !== localPlayer && winner !== 'draw';
  const isDraw = winner === 'draw';

  const getResultConfig = () => {
    if (isDraw) {
      return {
        title: '平局',
        subtitle: '势均力敌，旗鼓相当!',
        icon: Scale,
        gradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
        glowColor: '#FFD700',
        bgGradient: 'linear-gradient(135deg, #FFD70020 0%, #FFA50020 100%)',
        borderColor: '#FFD70060'
      };
    } else if (isWin) {
      return {
        title: '你赢了!',
        subtitle: '恭喜你取得胜利!',
        icon: Trophy,
        gradient: 'linear-gradient(135deg, #00FF7F 0%, #00CC66 100%)',
        glowColor: '#00FF7F',
        bgGradient: 'linear-gradient(135deg, #00FF7F20 0%, #00CC6620 100%)',
        borderColor: '#00FF7F60'
      };
    } else {
      return {
        title: '你输了',
        subtitle: '别灰心，下次一定赢!',
        icon: Frown,
        gradient: 'linear-gradient(135deg, #FF4444 0%, #CC0000 100%)',
        glowColor: '#FF4444',
        bgGradient: 'linear-gradient(135deg, #FF444420 0%, #CC000020 100%)',
        borderColor: '#FF444460'
      };
    }
  };

  const config = getResultConfig();
  const ResultIcon = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(12px)' }}
      />

      <div className="relative w-full max-w-lg modal-enter">
        <div
          className="rounded-3xl p-8 backdrop-blur-xl overflow-hidden"
          style={{
            background: `linear-gradient(145deg, #1A1A2EE0 0%, #16213EE0 100%)`,
            border: `1px solid ${config.borderColor}`,
            boxShadow: `0 0 80px ${config.glowColor}20, inset 0 0 60px #FFFFFF05`
          }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{
              background: config.gradient
            }}
          />

          <div className="text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-28 h-28 rounded-full mb-6"
              style={{
                background: config.bgGradient,
                border: `3px solid ${config.borderColor}`,
                boxShadow: `0 0 40px ${config.glowColor}30, inset 0 0 30px ${config.glowColor}10`
              }}
            >
              <ResultIcon
                size={56}
                strokeWidth={2}
                style={{
                  color: config.glowColor,
                  filter: `drop-shadow(0 0 20px ${config.glowColor}60)`
                }}
              />
            </div>
            <h1
              className="font-black mb-3"
              style={{
                fontFamily: 'Orbitron, sans-serif',
                fontSize: '56px',
                background: config.gradient,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '0.05em'
              }}
            >
              {config.title}
            </h1>
            <p
              className="text-gray-300 text-lg"
              style={{ fontFamily: 'Rajdhani, sans-serif' }}
            >
              {config.subtitle}
            </p>
          </div>

          <div
            className="rounded-2xl p-6 mb-8"
            style={{
              background: '#FFFFFF08',
              border: '1px solid #FFFFFF10'
            }}
          >
            <h3
              className="text-center text-gray-400 text-sm uppercase tracking-widest mb-5"
              style={{ fontFamily: 'Rajdhani, sans-serif' }}
            >
              最终战绩
            </h3>
            <div className="grid grid-cols-3 gap-4 items-center">
              <div className="text-center">
                <div
                  className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center"
                  style={{
                    background: '#FF444420',
                    border: '2px solid #FF444460'
                  }}
                >
                  <span
                    className="font-bold text-sm"
                    style={{ color: '#FF4444', fontFamily: 'Orbitron, sans-serif' }}
                  >
                    A
                  </span>
                </div>
                <p
                  className="text-gray-400 text-xs mb-1"
                  style={{ fontFamily: 'Rajdhani, sans-serif' }}
                >
                  玩家A
                </p>
                <div className="flex items-center justify-center gap-1">
                  <Target size={14} color="#FFD700" />
                  <span
                    className="font-bold"
                    style={{
                      fontFamily: 'Orbitron, sans-serif',
                      fontSize: '28px',
                      color: '#FFD700',
                      textShadow: '0 0 10px #FFD70030'
                    }}
                  >
                    {players.playerA.score}
                  </span>
                </div>
                <div className="mt-1">
                  <div className="flex justify-center gap-0.5">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          'w-3 h-3 rounded-full',
                          i < players.playerA.lives
                            ? 'bg-red-500 shadow-[0_0_6px_#FF444480]'
                            : 'bg-gray-700'
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-center">
                <div
                  className="font-black text-2xl"
                  style={{
                    fontFamily: 'Orbitron, sans-serif',
                    color: '#666666'
                  }}
                >
                  VS
                </div>
              </div>

              <div className="text-center">
                <div
                  className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center"
                  style={{
                    background: '#4444FF20',
                    border: '2px solid #4444FF60'
                  }}
                >
                  <span
                    className="font-bold text-sm"
                    style={{ color: '#4444FF', fontFamily: 'Orbitron, sans-serif' }}
                  >
                    B
                  </span>
                </div>
                <p
                  className="text-gray-400 text-xs mb-1"
                  style={{ fontFamily: 'Rajdhani, sans-serif' }}
                >
                  玩家B
                </p>
                <div className="flex items-center justify-center gap-1">
                  <Target size={14} color="#FFD700" />
                  <span
                    className="font-bold"
                    style={{
                      fontFamily: 'Orbitron, sans-serif',
                      fontSize: '28px',
                      color: '#FFD700',
                      textShadow: '0 0 10px #FFD70030'
                    }}
                  >
                    {players.playerB.score}
                  </span>
                </div>
                <div className="mt-1">
                  <div className="flex justify-center gap-0.5">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          'w-3 h-3 rounded-full',
                          i < players.playerB.lives
                            ? 'bg-blue-500 shadow-[0_0_6px_#4444FF80]'
                            : 'bg-gray-700'
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={syncRestart}
            className={cn(
              'w-full py-4 rounded-2xl font-bold text-white transition-all duration-300 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98]'
            )}
            style={{
              background: config.gradient,
              boxShadow: `0 4px 24px ${config.glowColor}40, inset 0 1px 0 rgba(255,255,255,0.2)`
            }}
          >
            <RotateCcw size={22} strokeWidth={2.5} />
            <span
              style={{
                fontFamily: 'Orbitron, sans-serif',
                fontSize: '18px',
                letterSpacing: '0.05em'
              }}
            >
              再来一局
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultModal;
