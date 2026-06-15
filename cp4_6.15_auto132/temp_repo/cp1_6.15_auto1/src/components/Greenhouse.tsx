import { useState, useEffect, useMemo, useCallback, useRef, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PLANT_TYPES,
  PLANETS,
  getPlantTypeById,
  calculateGrowthTime,
  calculateGrowthProgress,
  calculateRewards,
  getRarityColor,
  getRarityLabel,
  formatTime,
  FPSController,
  type PlantedPlant,
  type PlanetType,
  type Seed,
  type ParticleConfig
} from '../utils/gameData';

interface GreenhouseProps {
  seeds: Seed[];
  plantedPlants: PlantedPlant[];
  currentPlanetType: PlanetType;
  onPlantSeed: (plantTypeId: string, gridIndex: number) => void;
  onHarvest: (plantId: string) => { exp: number; coins: number } | null;
  onRemovePlant: (plantId: string) => void;
  onTransplant: (plantId: string, newGridIndex: number) => void;
}

interface PlantDetail {
  plant: PlantedPlant;
  gridIndex: number;
}

interface Particle {
  id: string;
  x: number;
  y: number;
  emoji: string;
  color: string;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
  lifetime: number;
  createdAt: number;
  rotation: number;
}

const GRID_SIZE = 20;
const TARGET_FPS = 30;

export default function Greenhouse({
  seeds,
  plantedPlants,
  currentPlanetType,
  onPlantSeed,
  onHarvest,
  onRemovePlant,
  onTransplant
}: GreenhouseProps) {
  const [now, setNow] = useState(Date.now());
  const [selectedSeed, setSelectedSeed] = useState<string | null>(null);
  const [plantDetail, setPlantDetail] = useState<PlantDetail | null>(null);
  const [harvestEffect, setHarvestEffect] = useState<{ coins: number; exp: number; key: number } | null>(null);
  const [transplantMode, setTransplantMode] = useState<string | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [fpsDisplay, setFpsDisplay] = useState(TARGET_FPS);

  const fpsControllerRef = useRef<FPSController>(new FPSController({ targetFPS: TARGET_FPS }));
  const particleTimerRef = useRef<number>(0);
  const particleIdCounter = useRef(0);
  const gridContainerRef = useRef<HTMLDivElement>(null);

  const currentPlanet = useMemo(
    () => PLANETS.find(p => p.type === currentPlanetType),
    [currentPlanetType]
  );

  const particleConfig: ParticleConfig | undefined = currentPlanet?.visualEffects.particle;

  useEffect(() => {
    let frameId: number;
    const particleConfigRef = currentPlanet?.visualEffects.particle;
    const particleInterval = particleConfigRef
      ? particleConfigRef.lifetime / particleConfigRef.count
      : 1000;

    const tick = (currentTime: number) => {
      const controller = fpsControllerRef.current;

      if (controller.shouldUpdate(currentTime)) {
        setNow(Date.now());
        setFpsDisplay(controller.getFPS() || TARGET_FPS);
      }

      if (particleConfigRef) {
        particleTimerRef.current += 16.67;
        if (particleTimerRef.current >= particleInterval) {
          particleTimerRef.current = 0;
          spawnParticle(particleConfigRef);
        }
      }

      setParticles(prev =>
        prev
          .map(p => {
            const age = currentTime - p.createdAt;
            const progress = age / p.lifetime;
            return {
              ...p,
              y: p.y + p.speedY,
              x: p.x + p.speedX + Math.sin(age / 300) * 0.3,
              opacity: Math.max(0, 1 - progress),
              rotation: p.rotation + 1
            };
          })
          .filter(p => p.opacity > 0.01 && p.y > -50 && p.y < 150)
      );

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [currentPlanetType]);

  const spawnParticle = useCallback((config: ParticleConfig) => {
    if (!gridContainerRef.current) return;

    const rect = gridContainerRef.current.getBoundingClientRect();
    const id = `particle-${++particleIdCounter.current}`;
    const particle: Particle = {
      id,
      x: Math.random() * 100,
      y: 105 + Math.random() * 10,
      emoji: config.emoji,
      color: config.color,
      size: 12 + Math.random() * 16,
      speedY: -(0.3 + Math.random() * 0.7) * config.speed,
      speedX: (Math.random() - 0.5) * 0.3 * config.speed,
      opacity: 0.7 + Math.random() * 0.3,
      lifetime: config.lifetime * (0.8 + Math.random() * 0.4),
      createdAt: performance.now(),
      rotation: Math.random() * 360
    };

    setParticles(prev => {
      const maxParticles = config.count * 3;
      const next = [...prev, particle];
      return next.slice(-maxParticles);
    });
  }, []);

  const getPlantAt = useCallback((gridIndex: number): PlantedPlant | undefined => {
    return plantedPlants.find(p => p.gridIndex === gridIndex);
  }, [plantedPlants]);

  const getGrowthProgress = useCallback((plant: PlantedPlant): number => {
    const plantType = getPlantTypeById(plant.plantTypeId);
    if (!plantType) return 0;
    return calculateGrowthProgress(plantType, plant.planetType, plant.plantedAt, now);
  }, [now]);

  const getRemainingTime = useCallback((plant: PlantedPlant): number => {
    const plantType = getPlantTypeById(plant.plantTypeId);
    if (!plantType) return 0;
    const totalTime = calculateGrowthTime(plantType, plant.planetType);
    const elapsed = now - plant.plantedAt;
    return Math.max(0, totalTime - elapsed);
  }, [now]);

  const isMature = useCallback((plant: PlantedPlant): boolean => {
    return getGrowthProgress(plant) >= 100;
  }, [getGrowthProgress]);

  const handleGridClick = useCallback((gridIndex: number) => {
    if (transplantMode) {
      const existingPlant = getPlantAt(gridIndex);
      if (!existingPlant) {
        onTransplant(transplantMode, gridIndex);
      }
      setTransplantMode(null);
      return;
    }

    const existingPlant = getPlantAt(gridIndex);

    if (existingPlant) {
      setPlantDetail({ plant: existingPlant, gridIndex });
      return;
    }

    if (selectedSeed) {
      const seedData = seeds.find(s => s.plantTypeId === selectedSeed);
      if (seedData && seedData.quantity > 0) {
        onPlantSeed(selectedSeed, gridIndex);
        const updatedSeed = seeds.find(s => s.plantTypeId === selectedSeed);
        if (!updatedSeed || updatedSeed.quantity <= 0) {
          setSelectedSeed(null);
        }
      }
    }
  }, [transplantMode, selectedSeed, seeds, getPlantAt, onPlantSeed, onTransplant]);

  const handleHarvest = useCallback((plantId: string) => {
    const result = onHarvest(plantId);
    if (result) {
      setHarvestEffect({ coins: result.coins, exp: result.exp, key: Date.now() });
      setTimeout(() => setHarvestEffect(null), 2000);
      setPlantDetail(null);
    }
  }, [onHarvest]);

  const handleRemove = useCallback((plantId: string) => {
    onRemovePlant(plantId);
    setPlantDetail(null);
  }, [onRemovePlant]);

  const startTransplant = useCallback((plantId: string) => {
    setTransplantMode(plantId);
    setPlantDetail(null);
  }, []);

  const getGrowthStageEmoji = (plant: PlantedPlant, progress: number): string => {
    const plantType = getPlantTypeById(plant.plantTypeId);
    if (!plantType) return '🌱';
    const variant = plantType.colorVariants[plant.planetType];

    if (progress < 25) return '🌱';
    if (progress < 60) return '🌿';
    if (progress < 100) return '🪴';
    return variant.emoji;
  };

  const availableSeeds = seeds.filter(s => s.quantity > 0);

  return (
    <div className="relative w-full h-full flex flex-col">
      <style>{`
        @keyframes particle-rise {
          from {
            transform: translateY(0) rotate(0deg);
          }
          to {
            transform: translateY(-200px) rotate(360deg);
          }
        }
      `}</style>

      <AnimatePresence>
        {harvestEffect && (
          <motion.div
            key={harvestEffect.key}
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: -40, scale: 1.2 }}
            exit={{ opacity: 0, y: -80, scale: 1 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none text-center"
          >
            <div className="text-2xl font-bold text-green-400 mb-1">+{harvestEffect.exp} EXP</div>
            <div className="text-2xl font-bold text-yellow-400">+{harvestEffect.coins} 💰</div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 md:p-6 lg:p-8 pb-4"
      >
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gradient mb-1">
              🛸 温室飞船
            </h2>
            <p className="text-sm md:text-base text-gray-400">
              当前环境: {currentPlanet?.name || '未知'} {currentPlanet?.emoji || ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="glass-card px-4 py-2 flex items-center gap-2"
              style={{ borderColor: `${currentPlanet?.visualEffects.gridBorderColor || 'rgba(139,92,246,0.4)'}` }}
            >
              <span className="text-2xl">{currentPlanet?.emoji}</span>
              <div>
                <div className="text-xs text-gray-400">生长加成</div>
                <div className={`font-bold text-sm ${(currentPlanet?.growthModifier || 1) >= 1 ? 'text-green-400' : 'text-red-400'}`}>
                  {(currentPlanet?.growthModifier || 1) >= 1 ? '+' : ''}
                  {(((currentPlanet?.growthModifier || 1) - 1) * 100).toFixed(0)}%
                </div>
              </div>
            </div>
            <div
              className="glass-card px-3 py-2 text-xs"
              style={{ borderColor: 'rgba(139,92,246,0.3)' }}
            >
              <span className="text-gray-400">FPS: </span>
              <span className={`font-bold ${fpsDisplay >= TARGET_FPS ? 'text-green-400' : 'text-yellow-400'}`}>
                {fpsDisplay}
              </span>
            </div>
          </div>
        </div>

        {transplantMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card px-4 py-3 mb-4 flex items-center justify-between"
            style={{ borderColor: 'rgba(251,191,36,0.5)', background: 'rgba(251,191,36,0.1)' }}
          >
            <div className="flex items-center gap-2 text-yellow-300">
              <span className="text-xl">🔄</span>
              <span className="text-sm md:text-base font-medium">
                移植模式：点击一个空格子来放置选中的植物
              </span>
            </div>
            <button
              onClick={() => setTransplantMode(null)}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition-colors"
            >
              取消
            </button>
          </motion.div>
        )}

        <div className="glass-card p-3 md:p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm md:text-base font-semibold text-white flex items-center gap-2">
              🌱 种子库
              {selectedSeed && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-300">
                  已选种子 - 点击空格子种植
                </span>
              )}
            </h3>
            {selectedSeed && (
              <button
                onClick={() => setSelectedSeed(null)}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                取消选择
              </button>
            )}
          </div>

          {availableSeeds.length === 0 ? (
            <div className="text-center py-6 text-gray-500 text-sm">
              还没有种子，去星球探索获取吧！
            </div>
          ) : (
            <div className="flex gap-2 md:gap-3 overflow-x-auto scrollbar-custom pb-2">
              {availableSeeds.map((seed) => {
                const plantType = getPlantTypeById(seed.plantTypeId);
                if (!plantType) return null;
                const variant = plantType.colorVariants[currentPlanetType];
                const isSelected = selectedSeed === seed.plantTypeId;
                const breatheDuration = 3 / (variant.breatheSpeed / 3);

                return (
                  <motion.button
                    key={seed.plantTypeId}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedSeed(isSelected ? null : seed.plantTypeId)}
                    className={`flex-shrink-0 p-3 rounded-xl transition-all ${
                      isSelected
                        ? 'ring-2 ring-purple-400 bg-purple-500/20'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                    style={{
                      border: `1px solid ${isSelected ? getRarityColor(plantType.rarity) : 'rgba(255,255,255,0.1)'}`,
                      minWidth: '90px'
                    }}
                  >
                    <div
                      className="text-3xl mb-1"
                      style={{
                        filter: `drop-shadow(0 0 6px ${variant.glow})`,
                        animation: `breathe ${breatheDuration}s ease-in-out infinite`,
                        animationDelay: `${Math.random() * 2}s`
                      }}
                    >
                      {variant.emoji}
                    </div>
                    <div className="text-xs font-medium text-white truncate mb-0.5">
                      {plantType.name}
                    </div>
                    <div
                      className="text-xs font-bold"
                      style={{ color: getRarityColor(plantType.rarity) }}
                    >
                      ×{seed.quantity}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>

      <div className="flex-1 px-4 md:px-6 lg:px-8 pb-4 overflow-auto scrollbar-custom relative">
        <div
          ref={gridContainerRef}
          className="relative"
          style={{
            minHeight: '100%'
          }}
        >
          {currentPlanet?.visualEffects && (
            <div
              className="absolute inset-0 rounded-2xl pointer-events-none -m-2"
              style={{
                background: currentPlanet.visualEffects.ambientGradient,
                animation: `breathe ${4 / currentPlanet.visualEffects.ambientAnimationSpeed}s ease-in-out infinite`
              }}
            />
          )}

          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            {particles.map(particle => (
              <motion.div
                key={particle.id}
                initial={false}
                className="absolute pointer-events-none"
                style={{
                  left: `${particle.x}%`,
                  bottom: `${100 - particle.y}%`,
                  fontSize: `${particle.size}px`,
                  opacity: particle.opacity,
                  transform: `rotate(${particle.rotation}deg)`,
                  filter: `drop-shadow(0 0 ${particle.size / 2}px ${particle.color})`,
                  willChange: 'transform, opacity'
                }}
              >
                {particle.emoji}
              </motion.div>
            ))}
          </div>

          <div
            className="relative grid gap-2 md:gap-3"
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
              borderColor: currentPlanet?.visualEffects.gridBorderColor
            }}
          >
            {Array.from({ length: GRID_SIZE }).map((_, index) => {
              const plant = getPlantAt(index);
              const progress = plant ? getGrowthProgress(plant) : 0;
              const mature = plant ? isMature(plant) : false;
              const plantType = plant ? getPlantTypeById(plant.plantTypeId) : null;
              const variant = plant ? plantType?.colorVariants[plant.planetType] : null;
              const breatheDuration = variant ? 3 / (variant.breatheSpeed / 3) : 3;
              const isTransplantTarget = transplantMode && !plant;
              const isHighlighted = transplantMode === plant?.id;

              return (
                <motion.div
                  key={index}
                  layout
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleGridClick(index)}
                  className={`relative aspect-square rounded-xl cursor-pointer transition-all ${
                    selectedSeed && !plant
                      ? 'ring-2 ring-dashed ring-purple-400/60 bg-purple-500/10 hover:bg-purple-500/20'
                      : transplantMode && !plant
                      ? 'ring-2 ring-dashed ring-yellow-400/60 bg-yellow-500/10 hover:bg-yellow-500/20 animate-pulse'
                      : isHighlighted
                      ? 'ring-2 ring-yellow-400/80 bg-yellow-500/20'
                      : 'bg-white/5 border border-white/10 hover:border-purple-400/30'
                  } ${mature ? 'ring-2 ring-green-400/60' : ''}`}
                  style={{
                    borderColor: mature
                      ? 'rgba(74, 222, 128, 0.6)'
                      : currentPlanet?.visualEffects.gridBorderColor,
                    boxShadow: transplantMode && !plant
                      ? currentPlanet?.visualEffects.cellHoverGlow
                      : undefined
                  }}
                >
                  {!plant && selectedSeed && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl opacity-40">➕</span>
                    </div>
                  )}
                  {!plant && transplantMode && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl opacity-60">📥</span>
                    </div>
                  )}

                  {plant && plantType && variant && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-1">
                      <div
                        className="absolute inset-1 rounded-lg opacity-30 pointer-events-none"
                        style={{
                          background: `linear-gradient(135deg, ${variant.color1}40 0%, ${variant.color2}60 100%)`
                        }}
                      />

                      <motion.div
                        animate={mature ? {
                          scale: [1, 1.15, 1],
                          filter: [
                            `drop-shadow(0 0 8px ${variant.glow})`,
                            `drop-shadow(0 0 20px ${variant.glow})`,
                            `drop-shadow(0 0 8px ${variant.glow})`
                          ]
                        } : {}}
                        transition={{
                          duration: mature ? breatheDuration : 1.5,
                          repeat: mature ? Infinity : 0,
                          ease: 'easeInOut'
                        }}
                        className={`relative z-10 text-3xl md:text-4xl ${mature ? '' : progress > 50 ? 'animate-breathe' : ''}`}
                        style={{
                          filter: mature
                            ? `${variant.textShadow ? '' : ''} drop-shadow(0 0 12px ${variant.glow})`
                            : progress > 50
                            ? `drop-shadow(0 0 6px ${variant.glow}80)`
                            : 'none',
                          textShadow: mature ? variant.textShadow : 'none',
                          animationDuration: mature ? `${breatheDuration}s` : undefined,
                          willChange: 'transform, filter'
                        }}
                      >
                        {getGrowthStageEmoji(plant, progress)}
                      </motion.div>

                      <div className="w-full mt-1.5 px-1 relative z-10">
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${progress}%`,
                              background: mature
                                ? `linear-gradient(90deg, ${variant.color1}, ${variant.color2})`
                                : `linear-gradient(90deg, #a78bfa, #60a5fa)`,
                              boxShadow: mature ? `0 0 8px ${variant.glow}80` : undefined
                            }}
                          />
                        </div>
                        <div className="text-[10px] text-center mt-0.5 text-gray-400 truncate">
                          {mature ? '✨ 收获' : formatTime(getRemainingTime(plant))}
                        </div>
                      </div>
                    </div>
                  )}

                  {mature && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-xs z-20"
                      style={{ boxShadow: '0 0 10px #4ade80' }}
                    >
                      ✓
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {plantDetail && (() => {
          const plantType = getPlantTypeById(plantDetail.plant.plantTypeId);
          if (!plantType) return null;
          const progress = getGrowthProgress(plantDetail.plant);
          const mature = isMature(plantDetail.plant);
          const rewards = calculateRewards(plantType, plantDetail.plant.planetType);
          const variant = plantType.colorVariants[plantDetail.plant.planetType];
          const planet = PLANETS.find(p => p.type === plantDetail.plant.planetType);
          const breatheDuration = 3 / (variant.breatheSpeed / 3);

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={() => setPlantDetail(null)}
            >
              <motion.div
                initial={{ scale: 0.8, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 30 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="glass-card p-6 max-w-md w-full max-h-[85vh] overflow-auto scrollbar-custom"
              >
                <div className="text-center mb-5">
                  <motion.div
                    animate={mature ? {
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    } : {}}
                    transition={{ duration: breatheDuration, repeat: mature ? Infinity : 0 }}
                    className="text-7xl md:text-8xl mb-3 relative"
                    style={{
                      filter: `drop-shadow(0 0 20px ${variant.glow})`,
                      textShadow: variant.textShadow
                    }}
                  >
                    <span
                      className="absolute inset-0 opacity-30 blur-xl"
                      style={{
                        background: `linear-gradient(135deg, ${variant.color1}, ${variant.color2})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}
                    >
                      {variant.emoji}
                    </span>
                    <span className="relative">{variant.emoji}</span>
                  </motion.div>
                  <h3 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2 flex-wrap">
                    <span
                      className="bg-gradient-to-r bg-clip-text text-transparent"
                      style={{
                        backgroundImage: `linear-gradient(135deg, ${variant.color1}, ${variant.color2})`
                      }}
                    >
                      {plantType.name}
                    </span>
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{
                        background: `${getRarityColor(plantType.rarity)}20`,
                        color: getRarityColor(plantType.rarity),
                        border: `1px solid ${getRarityColor(plantType.rarity)}40`
                      }}
                    >
                      {getRarityLabel(plantType.rarity)}
                    </span>
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {plantType.description}
                  </p>
                </div>

                <div className="space-y-3 mb-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div className="text-xs text-gray-400 mb-1">🌍 生长环境</div>
                      <div className="font-semibold text-white text-sm">
                        {planet?.emoji} {planet?.name}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div className="text-xs text-gray-400 mb-1">📍 位置</div>
                      <div className="font-semibold text-white text-sm">
                        格子 #{plantDetail.gridIndex + 1}
                      </div>
                    </div>
                  </div>

                  <div
                    className="p-4 rounded-xl relative overflow-hidden"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      borderLeft: `3px solid ${variant.glow}`
                    }}
                  >
                    <div
                      className="absolute top-0 right-0 w-24 h-24 opacity-20 rounded-bl-full"
                      style={{
                        background: `linear-gradient(135deg, ${variant.color1}, ${variant.color2})`
                      }}
                    />
                    <div className="relative z-10 flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-white">🌱 生长进度</span>
                      <span
                        className={`font-bold ${
                          mature ? 'text-green-400' : 'text-purple-300'
                        }`}
                      >
                        {progress.toFixed(0)}%
                      </span>
                    </div>
                    <div className="progress-bar h-3 relative z-10">
                      <div
                        className="progress-fill h-full"
                        style={{
                          width: `${progress}%`,
                          background: mature
                            ? `linear-gradient(90deg, ${variant.color1}, ${variant.color2})`
                            : `linear-gradient(90deg, #a78bfa, #60a5fa, #3b82f6)`,
                          boxShadow: `0 0 10px ${mature ? variant.glow : '#a78bfa'}80`
                        }}
                      />
                    </div>
                    <div className="text-center text-xs text-gray-400 mt-2 relative z-10">
                      {mature ? (
                        <span className="text-green-400 font-semibold">✨ 已成熟，可以收获！</span>
                      ) : (
                        <span>剩余 {formatTime(getRemainingTime(plantDetail.plant))}</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div
                      className="p-3 rounded-xl text-center"
                      style={{
                        background: 'rgba(74, 222, 128, 0.1)',
                        border: '1px solid rgba(74, 222, 128, 0.3)'
                      }}
                    >
                      <div className="text-2xl mb-1">⭐</div>
                      <div className="text-xs text-gray-400">收获经验</div>
                      <div className="font-bold text-lg text-green-400">+{rewards.exp}</div>
                    </div>
                    <div
                      className="p-3 rounded-xl text-center"
                      style={{
                        background: 'rgba(251, 191, 36, 0.1)',
                        border: '1px solid rgba(251, 191, 36, 0.3)'
                      }}
                    >
                      <div className="text-2xl mb-1">💰</div>
                      <div className="text-xs text-gray-400">收获星币</div>
                      <div className="font-bold text-lg text-yellow-400">+{rewards.coins}</div>
                    </div>
                  </div>

                  {plantType.nativePlanets.includes(plantDetail.plant.planetType) && (
                    <div
                      className="p-2.5 rounded-xl text-center text-sm"
                      style={{
                        background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(245,158,11,0.15))',
                        border: '1px solid rgba(251,191,36,0.4)'
                      }}
                    >
                      🌟 原产地加成：经验 +50%，星币 +30%
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => startTransplant(plantDetail.plant.id)}
                    className="py-3 rounded-xl font-semibold transition-all text-sm"
                    style={{
                      background: 'rgba(251, 191, 36, 0.15)',
                      border: '1px solid rgba(251, 191, 36, 0.4)',
                      color: '#fbbf24'
                    }}
                  >
                    🔄 移植
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleRemove(plantDetail.plant.id)}
                    className="py-3 rounded-xl font-semibold transition-all text-sm"
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      color: '#f87171'
                    }}
                  >
                    🗑️ 移除
                  </motion.button>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setPlantDetail(null)}
                    className="flex-1 py-3 rounded-xl font-semibold transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#e0e6ff'
                    }}
                  >
                    关闭
                  </motion.button>
                  {mature && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleHarvest(plantDetail.plant.id)}
                      className="flex-1 py-3 rounded-xl font-semibold glass-button"
                      style={{
                        background: `linear-gradient(135deg, ${variant.color1}60, ${variant.color2}60)`,
                        borderColor: `${variant.glow}99`
                      }}
                    >
                      ✨ 收获
                    </motion.button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
