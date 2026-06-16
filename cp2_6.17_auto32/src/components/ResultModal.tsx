import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useBoardStore } from '../game/board';
import { syncRestart } from '../network/syncClient';
import { Trophy, Frown, Scale, RotateCcw, Target, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COLORS } from '../game/types';

interface VictoryParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
}

const ResultModal: React.FC = () => {
  const { phase, winner, players, localPlayer } = useBoardStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [particles, setParticles] = useState<VictoryParticle[]>([]);
  const particlesRef = useRef(particles);
  const [visible, setVisible] = useState(false);

  useEffect(() => { particlesRef.current = particles; }, [particles]);

  const show = phase === 'ended';

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => setVisible(true), 100);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [show]);

  const isWin = localPlayer && winner === localPlayer;
  const isLose = localPlayer && winner !== null && winner !== localPlayer && winner !== 'draw';
  const isDraw = winner === 'draw';

  const spawnParticles = useCallback(() => {
    if (!isWin && !isDraw) return;
    
    const newParticles: VictoryParticle[] = [];
    const colors = isWin 
      ? ['#00FF7F', '#FFD700', '#00CC66', '#FFFFFF', '#7FFFD4']
      : ['#FFD700', '#FFA500', '#FFFFFF', '#87CEEB'];

    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      newParticles.push({
        id: Date.now() + i,
        x: window.innerWidth / 2 + (Math.random() - 0.5) * 200,
        y: window.innerHeight / 2 + (Math.random() - 0.5) * 100,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 1,
        maxLife: 1 + Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 2 + Math.random() * 6,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, [isWin, isDraw]);

  useEffect(() => {
    if (show && (isWin || isDraw)) {
      spawnParticles();
      const interval = setInterval(spawnParticles, 800);
      return () => clearInterval(interval);
    }
  }, [show, isWin, isDraw, spawnParticles]);

  useEffect(() => {
    if (!show || particles.length === 0) return;

    const renderParticles = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const updatedParticles = particlesRef.current
        .map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.03,
          vx: p.vx * 0.99,
          rotation: p.rotation + p.rotationSpeed,
          life: p.life - 0.008
        }))
        .filter(p => p.life > 0);

      setParticles(updatedParticles);

      updatedParticles.forEach(p => {
        const alpha = Math.max(0, p.life);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;

        const shape = Math.floor(p.id) % 3;
        if (shape === 0) {
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (shape === 1) {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else {
          ctx.beginPath();
          ctx.moveTo(0, -p.size);
          ctx.lineTo(p.size * 0.866, p.size * 0.5);
          ctx.lineTo(-p.size * 0.866, p.size * 0.5);
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
      });

      animRef.current = requestAnimationFrame(renderParticles);
    };

    animRef.current = requestAnimationFrame(renderParticles);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [show, particles.length > 0]);

  if (!show) return null;

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
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 1 }}
      />

      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(12px)', zIndex: 0 }}
      />

      <div
        className={cn(
          'relative w-full max-w-lg transition-all duration-500',
          visible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
        )}
        style={{ zIndex: 2 }}
      >
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
            style={{ background: config.gradient }}
          />

          {(isWin || isDraw) && (
            <div className="absolute top-4 right-4">
              <Star
                size={24}
                style={{ color: config.glowColor, filter: `drop-shadow(0 0 8px ${config.glowColor})` }}
                className="animate-pulse"
              />
            </div>
          )}

          <div className="text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-28 h-28 rounded-full mb-6"
              style={{
                background: config.bgGradient,
                border: `3px solid ${config.borderColor}`,
                boxShadow: `0 0 40px ${config.glowColor}30, inset 0 0 30px ${config.glowColor}10`,
                animation: isWin ? 'victoryPulse 1.5s ease-in-out infinite' : undefined
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
                    border: `2px solid ${winner === 'playerA' ? '#FFD700' : '#FF444460'}`,
                    boxShadow: winner === 'playerA' ? '0 0 15px #FFD70040' : 'none'
                  }}
                >
                  <span
                    className="font-bold text-sm"
                    style={{ color: '#FF4444', fontFamily: 'Orbitron, sans-serif' }}
                  >
                    A
                  </span>
                </div>
                <p className="text-gray-400 text-xs mb-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
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
                  style={{ fontFamily: 'Orbitron, sans-serif', color: '#666666' }}
                >
                  VS
                </div>
              </div>

              <div className="text-center">
                <div
                  className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center"
                  style={{
                    background: '#4444FF20',
                    border: `2px solid ${winner === 'playerB' ? '#FFD700' : '#4444FF60'}`,
                    boxShadow: winner === 'playerB' ? '0 0 15px #FFD70040' : 'none'
                  }}
                >
                  <span
                    className="font-bold text-sm"
                    style={{ color: '#4444FF', fontFamily: 'Orbitron, sans-serif' }}
                  >
                    B
                  </span>
                </div>
                <p className="text-gray-400 text-xs mb-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
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
            className="w-full py-4 rounded-2xl font-bold text-white transition-all duration-300 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98]"
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
