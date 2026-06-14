import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Starfield from './components/Starfield';
import StarExplorer from './components/StarExplorer';
import Greenhouse from './components/Greenhouse';
import {
  PLANETS,
  getPlantTypeById,
  calculateRewards,
  type Seed,
  type PlantedPlant,
  type PlanetType
} from './utils/gameData';

type Scene = 'explorer' | 'greenhouse';

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function getExpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

export default function App() {
  const [scene, setScene] = useState<Scene>('explorer');
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [plantedPlants, setPlantedPlants] = useState<PlantedPlant[]>([]);
  const [coins, setCoins] = useState(50);
  const [exp, setExp] = useState(0);
  const [level, setLevel] = useState(1);
  const [currentPlanetType, setCurrentPlanetType] = useState<PlanetType>('forest');

  useEffect(() => {
    let currentExp = exp;
    let currentLevel = level;
    let changed = false;

    while (currentExp >= getExpForLevel(currentLevel)) {
      currentExp -= getExpForLevel(currentLevel);
      currentLevel++;
      changed = true;
    }

    if (changed) {
      setExp(currentExp);
      setLevel(currentLevel);
    }
  }, [exp]);

  const handleSeedsCollected = useCallback((newSeeds: Seed[]) => {
    setSeeds(prev => {
      const result = [...prev];
      for (const newSeed of newSeeds) {
        const existing = result.find(s => s.plantTypeId === newSeed.plantTypeId);
        if (existing) {
          existing.quantity += newSeed.quantity;
        } else {
          result.push({ ...newSeed });
        }
      }
      return result;
    });
  }, []);

  const handlePlantSeed = useCallback((plantTypeId: string, gridIndex: number) => {
    const seedIndex = seeds.findIndex(s => s.plantTypeId === plantTypeId);
    if (seedIndex === -1 || seeds[seedIndex].quantity <= 0) return;

    const isOccupied = plantedPlants.some(p => p.gridIndex === gridIndex);
    if (isOccupied) return;

    setSeeds(prev => {
      const result = prev.map(s => ({ ...s }));
      result[seedIndex].quantity--;
      return result.filter(s => s.quantity > 0);
    });

    setPlantedPlants(prev => [
      ...prev,
      {
        id: generateId(),
        plantTypeId,
        planetType: currentPlanetType,
        plantedAt: Date.now(),
        gridIndex
      }
    ]);
  }, [seeds, plantedPlants, currentPlanetType]);

  const handleHarvest = useCallback((plantId: string) => {
    const plant = plantedPlants.find(p => p.id === plantId);
    if (!plant) return null;

    const plantType = getPlantTypeById(plant.plantTypeId);
    if (!plantType) return null;

    const rewards = calculateRewards(plantType, plant.planetType);

    const now = Date.now();
    const growthTime = plantType.baseGrowthTime;
    const elapsed = now - plant.plantedAt;
    if (elapsed < growthTime) return null;

    setPlantedPlants(prev => prev.filter(p => p.id !== plantId));
    setCoins(c => c + rewards.coins);
    setExp(e => e + rewards.exp);

    return rewards;
  }, [plantedPlants]);

  const expProgress = (exp / getExpForLevel(level)) * 100;

  return (
    <div className="relative w-full h-screen min-h-screen overflow-hidden">
      <Starfield />

      <div className="relative z-10 w-full h-full flex flex-col">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-shrink-0 px-4 md:px-6 lg:px-8 py-4"
        >
          <div className="glass-card p-3 md:p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="text-3xl md:text-4xl"
                >
                  🛸
                </motion.div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-gradient">
                    星际植物园
                  </h1>
                  <p className="text-xs md:text-sm text-gray-400">
                    Stellar Botanical Garden
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 md:gap-4 flex-wrap">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                  style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)' }}
                >
                  <span className="text-lg">💰</span>
                  <span className="font-bold text-yellow-300 text-sm md:text-base">{coins}</span>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                  style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)' }}
                >
                  <span className="text-lg">⭐</span>
                  <div className="flex flex-col">
                    <span className="font-bold text-purple-300 text-xs leading-none">
                      Lv.{level}
                    </span>
                    <div className="w-16 h-1.5 bg-purple-900/50 rounded-full overflow-hidden mt-1">
                      <motion.div
                        className="h-full bg-gradient-to-r from-purple-400 to-blue-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${expProgress}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                  style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.3)' }}
                >
                  <span className="text-lg">🌱</span>
                  <span className="font-bold text-blue-300 text-sm md:text-base">
                    {seeds.reduce((sum, s) => sum + s.quantity, 0)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 md:mt-3 flex flex-col sm:flex-row gap-3 md:gap-4">
              <div className="flex gap-2 flex-1">
                <motion.button
                  whileHover={{ scale: scene === 'explorer' ? 1 : 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setScene('explorer')}
                  className={`flex-1 sm:flex-none px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-semibold transition-all text-sm md:text-base ${
                    scene === 'explorer'
                      ? 'bg-gradient-to-r from-purple-600/50 to-blue-600/50 ring-2 ring-purple-400/60 shadow-lg shadow-purple-500/20'
                      : 'bg-white/5 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  🚀 星球探索
                </motion.button>
                <motion.button
                  whileHover={{ scale: scene === 'greenhouse' ? 1 : 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setScene('greenhouse')}
                  className={`flex-1 sm:flex-none px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-semibold transition-all text-sm md:text-base ${
                    scene === 'greenhouse'
                      ? 'bg-gradient-to-r from-green-600/50 to-teal-600/50 ring-2 ring-green-400/60 shadow-lg shadow-green-500/20'
                      : 'bg-white/5 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  🛸 温室飞船
                </motion.button>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto scrollbar-custom pb-1 sm:pb-0">
                <span className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">种植环境:</span>
                {PLANETS.map(planet => (
                  <motion.button
                    key={planet.id}
                    whileHover={{ scale: currentPlanetType === planet.type ? 1 : 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setCurrentPlanetType(planet.type)}
                    className={`flex-shrink-0 w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-lg md:text-xl transition-all ${
                      currentPlanetType === planet.type
                        ? 'ring-2 ring-white/60 shadow-lg'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                    style={{
                      background: planet.gradient,
                      boxShadow: currentPlanetType === planet.type
                        ? `0 0 15px ${planet.gradient.includes('a8edea') ? '#a8edea' : planet.gradient.includes('f093fb') ? '#f5576c' : planet.gradient.includes('43e97b') ? '#43e97b' : planet.gradient.includes('fa709a') ? '#fee140' : '#4facfe'}60`
                        : 'none'
                    }}
                    title={planet.name}
                  >
                    {planet.emoji}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </motion.header>

        <main className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {scene === 'explorer' ? (
              <motion.div
                key="explorer"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 overflow-hidden"
              >
                <StarExplorer onSeedsCollected={handleSeedsCollected} />
              </motion.div>
            ) : (
              <motion.div
                key="greenhouse"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 overflow-hidden"
              >
                <Greenhouse
                  seeds={seeds}
                  plantedPlants={plantedPlants}
                  currentPlanetType={currentPlanetType}
                  onPlantSeed={handlePlantSeed}
                  onHarvest={handleHarvest}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
