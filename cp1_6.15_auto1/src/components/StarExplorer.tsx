import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PLANETS,
  generateSeedsFromExploration,
  getPlantTypeById,
  getRarityColor,
  getRarityLabel,
  formatTime,
  type Planet,
  type Seed
} from '../utils/gameData';

interface StarExplorerProps {
  onSeedsCollected: (seeds: Seed[]) => void;
}

interface ExploreResult {
  planet: Planet;
  seeds: Seed[];
  timestamp: number;
}

export default function StarExplorer({ onSeedsCollected }: StarExplorerProps) {
  const [selectedPlanet, setSelectedPlanet] = useState<Planet | null>(null);
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
  const [exploreResult, setExploreResult] = useState<ExploreResult | null>(null);
  const [now, setNow] = useState(Date.now());
  const [exploringPlanet, setExploringPlanet] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 100);
    return () => clearInterval(timer);
  }, []);

  const handleExplore = useCallback((planet: Planet) => {
    const cooldownEnd = cooldowns[planet.id] || 0;
    if (now < cooldownEnd) return;

    setExploringPlanet(planet.id);

    setTimeout(() => {
      const seeds = generateSeedsFromExploration(planet);
      onSeedsCollected(seeds);
      setExploreResult({
        planet,
        seeds,
        timestamp: Date.now()
      });
      setCooldowns(prev => ({
        ...prev,
        [planet.id]: Date.now() + planet.exploreCooldown
      }));
      setExploringPlanet(null);
    }, 1500);
  }, [cooldowns, now, onSeedsCollected]);

  const getCooldownPercent = (planet: Planet): number => {
    const cooldownEnd = cooldowns[planet.id] || 0;
    const remaining = cooldownEnd - now;
    if (remaining <= 0) return 0;
    return (remaining / planet.exploreCooldown) * 100;
  };

  const getRemainingTime = (planet: Planet): number => {
    const cooldownEnd = cooldowns[planet.id] || 0;
    return Math.max(0, cooldownEnd - now);
  };

  return (
    <div className="relative w-full h-full flex flex-col p-4 md:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <h2 className="text-2xl md:text-3xl font-bold text-gradient mb-2">
          🚀 星际探索
        </h2>
        <p className="text-sm md:text-base text-gray-400">
          选择一颗星球进行探索，发现珍稀的外星植物种子
        </p>
      </motion.div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 overflow-auto scrollbar-custom pb-4">
        {PLANETS.map((planet, index) => {
          const remaining = getRemainingTime(planet);
          const isOnCooldown = remaining > 0;
          const isExploring = exploringPlanet === planet.id;

          return (
            <motion.div
              key={planet.id}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => !isOnCooldown && !isExploring && setSelectedPlanet(planet)}
              className={`glass-card p-4 md:p-5 cursor-pointer relative overflow-hidden ${
                selectedPlanet?.id === planet.id ? 'ring-2 ring-purple-400/50' : ''
              }`}
              style={{ minHeight: '200px' }}
            >
              <div
                className="absolute inset-0 opacity-20"
                style={{ background: planet.gradient }}
              />

              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-start justify-between mb-3">
                  <motion.div
                    animate={{
                      rotate: isExploring ? 360 : 0,
                      scale: selectedPlanet?.id === planet.id ? [1, 1.2, 1] : 1
                    }}
                    transition={{
                      rotate: { duration: 2, repeat: isExploring ? Infinity : 0, ease: 'linear' },
                      scale: { duration: 0.5, repeat: selectedPlanet?.id === planet.id ? Infinity : 0 }
                    }}
                    className="text-5xl md:text-6xl animate-float"
                    style={{ animationDelay: `${index * 0.3}s` }}
                  >
                    {planet.emoji}
                  </motion.div>
                  <div
                    className="px-2 py-1 rounded-full text-xs font-medium"
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      border: `1px solid ${isOnCooldown ? '#f5576c' : '#4ade80'}40`
                    }}
                  >
                    {isOnCooldown ? '⏳ 冷却中' : '✅ 可探索'}
                  </div>
                </div>

                <h3 className="text-lg md:text-xl font-bold mb-1 text-white">
                  {planet.name}
                </h3>
                <p className="text-xs md:text-sm text-gray-300 mb-3 line-clamp-2">
                  {planet.description}
                </p>

                <div className="mt-auto space-y-2">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>🌱 生长速度</span>
                    <span className={planet.growthModifier >= 1 ? 'text-green-400' : 'text-red-400'}>
                      {planet.growthModifier >= 1 ? '+' : ''}{((planet.growthModifier - 1) * 100).toFixed(0)}%
                    </span>
                  </div>

                  {isOnCooldown && (
                    <div className="space-y-1">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${100 - getCooldownPercent(planet)}%`,
                            background: 'linear-gradient(90deg, #f5576c, #f093fb)'
                          }}
                        />
                      </div>
                      <div className="text-xs text-center text-gray-400">
                        剩余 {formatTime(remaining)}
                      </div>
                    </div>
                  )}

                  <motion.button
                    whileHover={{ scale: isOnCooldown || isExploring ? 1 : 1.05 }}
                    whileTap={{ scale: isOnCooldown || isExploring ? 1 : 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExplore(planet);
                    }}
                    disabled={isOnCooldown || isExploring}
                    className="glass-button w-full py-2.5 text-sm relative overflow-hidden"
                  >
                    {isExploring ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin">🛸</span> 探索中...
                      </span>
                    ) : isOnCooldown ? (
                      <span className="opacity-70">⏰ 冷却中</span>
                    ) : (
                      <span>🔍 开始探索</span>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {exploreResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setExploreResult(null)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card p-6 max-w-md w-full max-h-[80vh] overflow-auto scrollbar-custom"
            >
              <div className="text-center mb-5">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.6 }}
                  className="text-6xl mb-3"
                >
                  {exploreResult.planet.emoji}
                </motion.div>
                <h3 className="text-xl font-bold text-gradient mb-1">探索成功！</h3>
                <p className="text-sm text-gray-400">
                  在 {exploreResult.planet.name} 上发现了 {exploreResult.seeds.length} 种种子
                </p>
              </div>

              <div className="space-y-3 mb-5">
                {exploreResult.seeds.map((seed, index) => {
                  const plantType = getPlantTypeById(seed.plantTypeId);
                  if (!plantType) return null;
                  const variant = plantType.colorVariants[exploreResult.planet.type];

                  return (
                    <motion.div
                      key={seed.plantTypeId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.15 }}
                      className="flex items-center gap-4 p-3 rounded-xl"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: `1px solid ${getRarityColor(plantType.rarity)}30`
                      }}
                    >
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.5, delay: index * 0.15 + 0.1 }}
                        className="text-4xl"
                        style={{
                          filter: `drop-shadow(0 0 8px ${variant.glow})`
                        }}
                      >
                        {variant.emoji}
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-white truncate">
                            {plantType.name}
                          </span>
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              background: `${getRarityColor(plantType.rarity)}20`,
                              color: getRarityColor(plantType.rarity),
                              border: `1px solid ${getRarityColor(plantType.rarity)}40`
                            }}
                          >
                            {getRarityLabel(plantType.rarity)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 line-clamp-1">
                          {plantType.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-purple-300">×{seed.quantity}</div>
                        <div className="text-xs text-gray-500">种子</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setExploreResult(null)}
                className="glass-button w-full py-3"
              >
                ✨ 收入种子库
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
