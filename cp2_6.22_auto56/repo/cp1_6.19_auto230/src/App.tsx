import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Grid from './Grid';
import { useGameStore } from './store';
import { MicrobeType, MICROBE_CONFIGS, VICTORY_THRESHOLD, SKILL_COOLDOWN, TURN_INTERVAL } from './types';
import { resetGameAction } from './actions';

interface FireworkParticle {
  id: number;
  x: number;
  delay: number;
  color: string;
  size: number;
}

const App: React.FC = () => {
  const turn = useGameStore((state) => state.turn);
  const score = useGameStore((state) => state.score);
  const victoryProgress = useGameStore((state) => state.victoryProgress);
  const isVictory = useGameStore((state) => state.isVictory);
  const isGameOver = useGameStore((state) => state.isGameOver);
  const energy = useGameStore((state) => state.energy);
  const inventory = useGameStore((state) => state.inventory);
  const skillCooldown = useGameStore((state) => state.skillCooldown);
  const nextTurn = useGameStore((state) => state.nextTurn);

  const [draggedType, setDraggedType] = useState<MicrobeType | null>(null);
  const [fireworks, setFireworks] = useState<FireworkParticle[]>([]);
  const lastTurnTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  const gameLoop = useCallback((timestamp: number) => {
    if (isVictory || isGameOver) {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    if (timestamp - lastTurnTimeRef.current >= TURN_INTERVAL) {
      lastTurnTimeRef.current = timestamp;
      nextTurn();
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [isVictory, isGameOver, nextTurn]);

  useEffect(() => {
    lastTurnTimeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameLoop]);

  useEffect(() => {
    if (isVictory) {
      const particles: FireworkParticle[] = [];
      const colors = ['#FFD700', '#32CD32', '#90EE90', '#FFFF00', '#ADFF2F'];
      for (let i = 0; i < 40; i++) {
        particles.push({
          id: i,
          x: Math.random() * 100,
          delay: Math.random() * 2,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 4 + Math.random() * 8,
        });
      }
      setFireworks(particles);

      setTimeout(() => setFireworks([]), 3000);
    }
  }, [isVictory]);

  const handleDragStart = (type: MicrobeType) => {
    if (inventory[type] > 0) {
      setDraggedType(type);
    }
  };

  const handleDragEnd = () => {
    setDraggedType(null);
  };

  const handleReset = () => {
    resetGameAction();
    setFireworks([]);
    lastTurnTimeRef.current = performance.now();
  };

  const victoryPercent = (victoryProgress / VICTORY_THRESHOLD) * 100;
  const cooldownPercent = ((SKILL_COOLDOWN - skillCooldown) / SKILL_COOLDOWN) * 100;

  const microbeTypes: MicrobeType[] = ['cyanobacteria', 'mold', 'ciliate'];

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #1A2E1A 0%, #2A4A2A 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 30%, #3A5A3A 0%, transparent 50%),
                              radial-gradient(circle at 80% 70%, #2A4A2A 0%, transparent 50%),
                              radial-gradient(circle at 50% 50%, #4A6A4A 0%, transparent 60%)`,
          }}
        />
      </div>

      <div className="flex items-center gap-6 relative z-10">
        <motion.div
          className="flex flex-col gap-4 p-4"
          style={{
            width: 220,
            backgroundColor: 'rgba(20, 40, 20, 0.7)',
            borderRadius: 12,
            backdropFilter: 'blur(8px)',
          }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center">
            <div className="text-gray-400 text-sm mb-1">当前回合</div>
            <div className="text-white text-3xl font-bold">{turn}</div>
          </div>

          <div className="border-t border-green-900 pt-4">
            <div className="text-gray-400 text-sm mb-2">胜利进度</div>
            <div className="relative w-full h-2 rounded-full overflow-hidden bg-gray-700">
              <motion.div
                className="absolute top-0 left-0 h-full"
                style={{
                  background: 'linear-gradient(90deg, #FF4500 0%, #FFD700 50%, #32CD32 100%)',
                }}
                initial={{ width: 0 }}
                animate={{ width: `${victoryPercent}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="text-center text-xs text-gray-400 mt-1">
              {victoryProgress.toFixed(0)} / {VICTORY_THRESHOLD} 秒
            </div>
          </div>

          <div className="border-t border-green-900 pt-4">
            <div className="text-gray-400 text-sm mb-1">得分</div>
            <div style={{ color: '#FFD700' }} className="text-2xl font-bold">
              {score}
            </div>
          </div>

          <div className="border-t border-green-900 pt-4">
            <button
              onClick={handleReset}
              className="w-full py-2 px-4 rounded-lg text-white font-medium transition-all hover:scale-105 active:scale-95"
              style={{ backgroundColor: '#4A7A4A' }}
            >
              重新开始
            </button>
          </div>
        </motion.div>

        <motion.div
          className="flex-shrink-0"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Grid draggedType={draggedType} onDragEnd={handleDragEnd} />
        </motion.div>

        <motion.div
          className="flex flex-col gap-4 p-4"
          style={{
            width: 180,
            backgroundColor: 'rgba(20, 40, 20, 0.7)',
            borderRadius: 12,
            backdropFilter: 'blur(8px)',
          }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div>
            <div className="text-gray-400 text-sm mb-3">微生物库存</div>
            <div className="flex flex-col gap-3">
              {microbeTypes.map((type) => {
                const config = MICROBE_CONFIGS[type];
                const count = inventory[type];
                const isDraggable = count > 0;

                return (
                  <div
                    key={type}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-grab active:cursor-grabbing transition-all ${
                      isDraggable ? 'hover:bg-green-900 hover:bg-opacity-50' : 'opacity-50 cursor-not-allowed'
                    }`}
                    draggable={isDraggable}
                    onDragStart={() => handleDragStart(type)}
                    onDragEnd={handleDragEnd}
                  >
                    <div
                      className="rounded-full flex-shrink-0"
                      style={{
                        width: config.size + 4,
                        height: config.size + 4,
                        backgroundColor: config.color,
                        boxShadow: `0 0 8px ${config.color}80`,
                      }}
                    />
                    <div className="flex-1">
                      <div className="text-white text-sm">{config.name}</div>
                      <div className="text-gray-400 text-xs">x{count}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-green-900 pt-4">
            <div className="text-gray-400 text-sm mb-2">能量</div>
            <div className="relative w-full h-3 rounded-full overflow-hidden bg-gray-700">
              <motion.div
                className="absolute top-0 left-0 h-full"
                style={{
                  backgroundColor: '#FFA500',
                  boxShadow: '0 0 10px #FFA50080',
                }}
                initial={{ width: '100%' }}
                animate={{ width: `${Math.min(100, energy)}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="text-right text-xs text-gray-400 mt-1">{Math.floor(energy)} 点</div>
          </div>

          <div className="border-t border-green-900 pt-4">
            <div className="text-gray-400 text-sm mb-2">清除技能</div>
            <div className="relative w-16 h-16 mx-auto">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="#333"
                  strokeWidth="3"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="#32CD32"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${cooldownPercent} 100`}
                  style={{ transition: 'stroke-dasharray 0.3s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                {skillCooldown > 0 ? (
                  <span className="text-white text-sm font-bold">{skillCooldown}</span>
                ) : (
                  <span className="text-green-400 text-xl">✦</span>
                )}
              </div>
            </div>
            <div className="text-center text-xs text-gray-400 mt-2">
              {skillCooldown > 0 ? '冷却中' : '可用 - 20能量'}
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {isVictory && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-center"
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <div
                className="text-6xl font-bold mb-4"
                style={{
                  color: '#FFD700',
                  textShadow: '0 0 20px #FFD700, 0 0 40px #FFD70080',
                }}
              >
                🎉 胜利！
              </div>
              <div className="text-2xl text-white mb-6">
                你成功维持了生态平衡！
              </div>
              <div className="text-xl text-green-300">
                最终得分：{score}
              </div>
            </motion.div>

            {fireworks.map((particle) => (
              <motion.div
                key={particle.id}
                className="absolute bottom-0 rounded-full"
                style={{
                  left: `${particle.x}%`,
                  width: particle.size,
                  height: particle.size,
                  backgroundColor: particle.color,
                  boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
                }}
                initial={{ y: 0, opacity: 0 }}
                animate={{
                  y: -window.innerHeight * 0.8,
                  opacity: [0, 1, 1, 0],
                  x: [0, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 150],
                }}
                transition={{
                  duration: 2.5 + Math.random(),
                  delay: particle.delay,
                  ease: 'easeOut',
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isGameOver && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-50 bg-black bg-opacity-70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-center"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring' }}
            >
              <div
                className="text-5xl font-bold mb-4"
                style={{ color: '#FF4500' }}
              >
                💀 生态崩溃
              </div>
              <div className="text-xl text-gray-300 mb-6">
                系统已无法维持...
              </div>
              <div className="text-lg text-white mb-6">
                最终得分：{score}
              </div>
              <button
                onClick={handleReset}
                className="py-3 px-8 rounded-lg text-white font-bold text-lg transition-all hover:scale-105 active:scale-95"
                style={{ backgroundColor: '#4A7A4A' }}
              >
                再试一次
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
