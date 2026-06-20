import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  PLANT_TYPES,
  PLANETS,
  type Rarity,
  type PlanetType,
  type PlantType,
  calculateGrowthTime,
  calculateGrowthProgress,
  isPlantMature,
  calculateRewards,
  generateSeedsFromExploration,
  getRemainingCooldown,
  isPlanetOnCooldown,
  saveCooldownsToStorage,
  loadCooldownsFromStorage,
  FPSController,
  formatTime,
  getRarityWeights,
  getRarityLabel,
  getRarityColor,
  getPlantTypeById,
  getPlanetByType
} from '../src/utils/gameData';

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function getRarityWeight(r: Rarity): number {
  const w = getRarityWeights();
  return w[r];
}

describe('Rarity Utilities', () => {
  it('getRarityWeight should return correct weights', () => {
    expect(getRarityWeight('common')).toBe(60);
    expect(getRarityWeight('uncommon')).toBe(25);
    expect(getRarityWeight('rare')).toBe(12);
    expect(getRarityWeight('legendary')).toBe(3);
  });

  it('getRarityWeights should return copy of weights', () => {
    const w1 = getRarityWeights();
    const w2 = getRarityWeights();
    expect(w1).not.toBe(w2);
    expect(w1).toEqual(w2);
  });

  it('getRarityLabel should return correct labels', () => {
    expect(getRarityLabel('common')).toBe('普通');
    expect(getRarityLabel('uncommon')).toBe('稀有');
    expect(getRarityLabel('rare')).toBe('珍稀');
    expect(getRarityLabel('legendary')).toBe('传说');
  });

  it('getRarityColor should return correct colors', () => {
    expect(getRarityColor('common')).toBeTruthy();
    expect(typeof getRarityColor('common')).toBe('string');
    expect(getRarityColor('legendary')).toBeTruthy();
  });
});

describe('Lookup Functions', () => {
  it('getPlantTypeById should find plant types or return undefined', () => {
    const first = PLANT_TYPES[0];
    expect(getPlantTypeById(first.id)).toBe(first);
    expect(getPlantTypeById('non-existent-id')).toBeUndefined();
  });

  it('getPlanetByType should find planets or return undefined', () => {
    const icePlanet = getPlanetByType('ice');
    expect(icePlanet).toBeDefined();
    expect(icePlanet?.type).toBe('ice');

    const volcanoPlanet = getPlanetByType('volcano');
    expect(volcanoPlanet).toBeDefined();
    expect(volcanoPlanet?.type).toBe('volcano');

    expect(getPlanetByType('unknown' as PlanetType)).toBeUndefined();
  });
});

describe('calculateGrowthTime', () => {
  it('should calculate base time on non-native planet based on growth modifier', () => {
    const plant: PlantType = {
      id: 'test',
      name: 'Test',
      emoji: '🌱',
      description: 'Test',
      rarity: 'common',
      baseGrowthTime: 60000,
      baseExp: 10,
      baseCoins: 5,
      nativePlanets: ['ice'],
      colorVariants: {} as any
    };

    const nonNativeModifier1: PlanetType = 'ocean';
    const time = calculateGrowthTime(plant, nonNativeModifier1);
    const oceanPlanet = getPlanetByType('ocean')!;
    expect(time).toBe(Math.round(60000 / oceanPlanet.growthModifier));
  });

  it('should reduce time for native planet (1.25x growth modifier = 0.8x time)', () => {
    const plant: PlantType = {
      id: 'test',
      name: 'Test',
      emoji: '🌱',
      description: 'Test',
      rarity: 'common',
      baseGrowthTime: 100000,
      baseExp: 10,
      baseCoins: 5,
      nativePlanets: ['forest'],
      colorVariants: {} as any
    };

    const forestPlanet = getPlanetByType('forest')!;
    const nativeTime = calculateGrowthTime(plant, 'forest');
    const nonNativeTime = 100000 / forestPlanet.growthModifier;
    expect(nativeTime).toBeLessThan(nonNativeTime);
    expect(nativeTime).toBeCloseTo(Math.round(nonNativeTime / 1.25), 0);
  });

  it('should increase time for slow growth modifier planets (ice < 1)', () => {
    const plant: PlantType = {
      id: 'test',
      name: 'Test',
      emoji: '🌱',
      description: 'Test',
      rarity: 'common',
      baseGrowthTime: 60000,
      baseExp: 10,
      baseCoins: 5,
      nativePlanets: [],
      colorVariants: {} as any
    };

    const icePlanet = getPlanetByType('ice')!;
    expect(icePlanet.growthModifier).toBeLessThan(1);
    const time = calculateGrowthTime(plant, 'ice');
    expect(time).toBeGreaterThan(60000);
    expect(time).toBe(Math.round(60000 / icePlanet.growthModifier));
  });

  it('should decrease time for fast growth modifier planets (volcano > 1)', () => {
    const plant: PlantType = {
      id: 'test',
      name: 'Test',
      emoji: '🌱',
      description: 'Test',
      rarity: 'common',
      baseGrowthTime: 60000,
      baseExp: 10,
      baseCoins: 5,
      nativePlanets: [],
      colorVariants: {} as any
    };

    const volcanoPlanet = getPlanetByType('volcano')!;
    expect(volcanoPlanet.growthModifier).toBeGreaterThan(1);
    const time = calculateGrowthTime(plant, 'volcano');
    expect(time).toBeLessThan(60000);
    expect(time).toBe(Math.round(60000 / volcanoPlanet.growthModifier));
  });

  it('should prefer fast volcano < normal forest < slow ice time ordering', () => {
    const plant: PlantType = {
      id: 'test',
      name: 'Test',
      emoji: '🌱',
      description: 'Test',
      rarity: 'common',
      baseGrowthTime: 60000,
      baseExp: 10,
      baseCoins: 5,
      nativePlanets: [],
      colorVariants: {} as any
    };

    const volcanoTime = calculateGrowthTime(plant, 'volcano');
    const forestTime = calculateGrowthTime(plant, 'forest');
    const iceTime = calculateGrowthTime(plant, 'ice');

    expect(volcanoTime).toBeLessThan(forestTime);
    expect(forestTime).toBeLessThan(iceTime);
  });
});

describe('calculateGrowthProgress & isPlantMature', () => {
  const plant: PlantType = {
    id: 'test',
    name: 'Test',
    emoji: '🌱',
    description: 'Test',
    rarity: 'common',
    baseGrowthTime: 100000,
    baseExp: 10,
    baseCoins: 5,
    nativePlanets: [],
    colorVariants: {} as any
  };

  const planetType: PlanetType = 'ocean';

  it('should return 0% when just planted', () => {
    const now = 1000000;
    const plantedAt = now;
    expect(calculateGrowthProgress(plant, planetType, plantedAt, now)).toBe(0);
    expect(isPlantMature(plant, planetType, plantedAt, now)).toBe(false);
  });

  it('should return ~50% when half the time has passed', () => {
    const totalTime = calculateGrowthTime(plant, planetType);
    const plantedAt = 0;
    const now = totalTime / 2;
    expect(calculateGrowthProgress(plant, planetType, plantedAt, now)).toBeCloseTo(50, 1);
    expect(isPlantMature(plant, planetType, plantedAt, now)).toBe(false);
  });

  it('should return 100% when full time has passed', () => {
    const totalTime = calculateGrowthTime(plant, planetType);
    const plantedAt = 0;
    const now = totalTime;
    expect(calculateGrowthProgress(plant, planetType, plantedAt, now)).toBeCloseTo(100, 0);
    expect(isPlantMature(plant, planetType, plantedAt, now)).toBe(true);
  });

  it('should cap progress at 100% when over time', () => {
    const totalTime = calculateGrowthTime(plant, planetType);
    const plantedAt = 0;
    const now = totalTime * 2;
    expect(calculateGrowthProgress(plant, planetType, plantedAt, now)).toBe(100);
    expect(isPlantMature(plant, planetType, plantedAt, now)).toBe(true);
  });
});

describe('calculateRewards', () => {
  it('should return base rewards for non-native planet', () => {
    const plant: PlantType = {
      id: 'test',
      name: 'Test',
      emoji: '🌱',
      description: 'Test',
      rarity: 'common',
      baseGrowthTime: 60000,
      baseExp: 100,
      baseCoins: 50,
      nativePlanets: [],
      colorVariants: {} as any
    };

    const rewards = calculateRewards(plant, 'forest');
    expect(rewards.exp).toBe(100);
    expect(rewards.coins).toBe(50);
  });

  it('should apply native planet bonuses (exp +50%, coins +30%)', () => {
    const plant: PlantType = {
      id: 'test',
      name: 'Test',
      emoji: '🌱',
      description: 'Test',
      rarity: 'common',
      baseGrowthTime: 60000,
      baseExp: 100,
      baseCoins: 50,
      nativePlanets: ['forest'],
      colorVariants: {} as any
    };

    const rewards = calculateRewards(plant, 'forest');
    expect(rewards.exp).toBeCloseTo(150, 0);
    expect(rewards.coins).toBeCloseTo(65, 0);
  });

  it('should apply rarity multiplier for higher rarities', () => {
    const legendaryPlant: PlantType = {
      id: 'test',
      name: 'Test',
      emoji: '🌱',
      description: 'Test',
      rarity: 'legendary',
      baseGrowthTime: 60000,
      baseExp: 100,
      baseCoins: 50,
      nativePlanets: [],
      colorVariants: {} as any
    };

    const legendary = getRarityWeight('legendary');
    const common = getRarityWeight('common');
    const rarityMultiplier = common / legendary;

    const rewards = calculateRewards(legendaryPlant, 'forest');
    expect(rewards.exp).toBeCloseTo(100 * rarityMultiplier, 0);
    expect(rewards.coins).toBeCloseTo(50 * rarityMultiplier, 0);
  });
});

describe('generateSeedsFromExploration', () => {
  it('should return 1-3 seeds per exploration', () => {
    const planet = PLANETS[0];
    for (let i = 0; i < 200; i++) {
      const randomFn = mulberry32(i * 1000);
      const seeds = generateSeedsFromExploration(planet, { randomFn });
      expect(seeds.length).toBeGreaterThanOrEqual(1);
      expect(seeds.length).toBeLessThanOrEqual(3);
    }
  });

  it('each seed should have quantity >= 1 and valid plantTypeId', () => {
    const planet = PLANETS[0];
    const randomFn = mulberry32(42);
    const seeds = generateSeedsFromExploration(planet, { randomFn });

    for (const seed of seeds) {
      expect(seed.quantity).toBeGreaterThanOrEqual(1);
      expect(seed.quantity).toBeLessThanOrEqual(3);
      const plant = getPlantTypeById(seed.plantTypeId);
      expect(plant).toBeDefined();
    }
  });

  it('should not return duplicate plant types in single exploration', () => {
    const planet = PLANETS[0];
    for (let i = 0; i < 100; i++) {
      const randomFn = mulberry32(i * 7);
      const seeds = generateSeedsFromExploration(planet, { randomFn });
      const ids = seeds.map(s => s.plantTypeId);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    }
  });

  it('should approximately match expected rarity distribution over many runs', () => {
    const planet = PLANETS.find(p => p.type === 'forest')!;
    const runs = 10000;
    const counts: Record<Rarity, number> = {
      common: 0,
      uncommon: 0,
      rare: 0,
      legendary: 0
    };
    let totalSeeds = 0;

    for (let i = 0; i < runs; i++) {
      const randomFn = mulberry32(i * 12345);
      const seeds = generateSeedsFromExploration(planet, { randomFn });
      for (const seed of seeds) {
        const plant = getPlantTypeById(seed.plantTypeId)!;
        counts[plant.rarity]++;
        totalSeeds++;
      }
    }

    const tolerance = 0.20;
    const expectedCommon = getRarityWeight('common') / 100;
    const expectedUncommon = getRarityWeight('uncommon') / 100;
    const expectedRare = getRarityWeight('rare') / 100;
    const expectedLegendary = getRarityWeight('legendary') / 100;

    const avgCommon = counts.common / totalSeeds;
    const avgUncommon = counts.uncommon / totalSeeds;
    const avgRare = counts.rare / totalSeeds;
    const avgLegendary = counts.legendary / totalSeeds;

    expect(Math.abs(avgCommon - expectedCommon)).toBeLessThan(tolerance);
    expect(Math.abs(avgUncommon - expectedUncommon)).toBeLessThan(tolerance);
    expect(Math.abs(avgRare - expectedRare)).toBeLessThan(tolerance * 1.5);
    expect(Math.abs(avgLegendary - expectedLegendary)).toBeLessThan(tolerance * 2);

    expect(counts.common).toBeGreaterThan(counts.uncommon);
    expect(counts.uncommon).toBeGreaterThan(counts.rare);
    expect(counts.rare).toBeGreaterThan(counts.legendary);
  });

  it('should bias native planet plants with higher selection rate', () => {
    const nativePlanet = PLANETS.find(p => p.type === 'ice')!;
    const nonNativePlanet = PLANETS.find(p => p.type === 'desert')!;
    const runs = 2000;

    const nativePlantIds = new Set(
      PLANT_TYPES.filter(p => p.nativePlanets.includes(nativePlanet.type)).map(p => p.id)
    );

    if (nativePlantIds.size === 0) {
      return;
    }

    let nativeInNative = 0;
    let totalInNative = 0;
    let nativeInNonNative = 0;
    let totalInNonNative = 0;

    for (let i = 0; i < runs; i++) {
      const randomFn = mulberry32(i * 11);
      const seeds1 = generateSeedsFromExploration(nativePlanet, { randomFn });
      totalInNative += seeds1.length;
      nativeInNative += seeds1.filter(s => nativePlantIds.has(s.plantTypeId)).length;

      const randomFn2 = mulberry32(i * 22);
      const seeds2 = generateSeedsFromExploration(nonNativePlanet, { randomFn: randomFn2 });
      totalInNonNative += seeds2.length;
      nativeInNonNative += seeds2.filter(s => nativePlantIds.has(s.plantTypeId)).length;
    }

    const rateNative = nativeInNative / totalInNative;
    const rateNonNative = nativeInNonNative / totalInNonNative;

    expect(rateNative).toBeGreaterThan(rateNonNative);
  });
});

describe('Cooldown Functions', () => {
  it('getRemainingCooldown should return 0 when no cooldown', () => {
    const now = 1000;
    const cooldowns = {};
    expect(getRemainingCooldown('p1', cooldowns, now)).toBe(0);
  });

  it('getRemainingCooldown should return remaining time', () => {
    const now = 1000;
    const cooldowns = { 'p1': 2000 };
    expect(getRemainingCooldown('p1', cooldowns, now)).toBe(1000);
  });

  it('getRemainingCooldown should return 0 when cooldown expired', () => {
    const now = 3000;
    const cooldowns = { 'p1': 2000 };
    expect(getRemainingCooldown('p1', cooldowns, now)).toBe(0);
  });

  it('isPlanetOnCooldown should return correct state', () => {
    const cooldowns = { 'p1': 2000, 'p2': 500 };
    expect(isPlanetOnCooldown('p1', cooldowns, 1000)).toBe(true);
    expect(isPlanetOnCooldown('p2', cooldowns, 1000)).toBe(false);
    expect(isPlanetOnCooldown('p3', cooldowns, 1000)).toBe(false);
  });
});

describe('Cooldown Persistence (localStorage)', () => {
  let mockStorage: Record<string, string>;

  beforeEach(() => {
    mockStorage = {};
  });

  const mockStorageObj: Storage = {
    get length() {
      return Object.keys(mockStorage).length;
    },
    clear: () => { mockStorage = {}; },
    getItem: (key: string) => mockStorage[key] ?? null,
    setItem: (key: string, value: string) => { mockStorage[key] = value; },
    removeItem: (key: string) => { delete mockStorage[key]; },
    key: (index: number) => Object.keys(mockStorage)[index] ?? null
  };

  it('saveCooldownsToStorage should save versioned data with timestamp', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(1000));

    const cooldowns = { 'p1': 5000, 'p2': 3000 };
    saveCooldownsToStorage(cooldowns, mockStorageObj);

    const saved = JSON.parse(mockStorage['stellar_garden_cooldowns_v1']);
    expect(saved.version).toBe(1);
    expect(saved.savedAt).toBe(1000);
    expect(saved.cooldowns).toEqual(cooldowns);

    vi.useRealTimers();
  });

  it('loadCooldownsFromStorage should return empty object if nothing saved', () => {
    const result = loadCooldownsFromStorage(mockStorageObj);
    expect(result).toEqual({});
  });

  it('loadCooldownsFromStorage should adjust remaining time based on elapsed', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(1000));

    const cooldowns = { 'p1': 10000, 'p2': 5000, 'p3': 2000 };
    saveCooldownsToStorage(cooldowns, mockStorageObj);

    vi.setSystemTime(new Date(3500));
    const loaded = loadCooldownsFromStorage(mockStorageObj);

    expect(loaded['p1']).toBeCloseTo(10000 + (3500 - 1000), 0);
    expect(loaded['p2']).toBeCloseTo(5000 + (3500 - 1000), 0);

    vi.useRealTimers();
  });

  it('loadCooldownsFromStorage should filter out truly expired cooldowns', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(1000));

    const cooldowns = { 'p1': 1500, 'p2': 9000 };
    saveCooldownsToStorage(cooldowns, mockStorageObj);

    vi.setSystemTime(new Date(4000));
    const loaded = loadCooldownsFromStorage(mockStorageObj);

    expect(Object.keys(loaded)).not.toContain('p1');
    expect(Object.keys(loaded)).toContain('p2');

    vi.useRealTimers();
  });

  it('should handle corrupted JSON gracefully', () => {
    mockStorage['stellar_garden_cooldowns_v1'] = 'not-valid-json';
    const result = loadCooldownsFromStorage(mockStorageObj);
    expect(result).toEqual({});
  });

  it('should handle wrong version gracefully', () => {
    mockStorage['stellar_garden_cooldowns_v1'] = JSON.stringify({
      version: 99,
      savedAt: 1000,
      cooldowns: { 'p1': 5000 }
    });
    const result = loadCooldownsFromStorage(mockStorageObj);
    expect(result).toEqual({});
  });
});

describe('FPSController', () => {
  it('should target exactly 30 FPS by default or config', () => {
    const controller = new FPSController({ targetFPS: 30 });

    let updates = 0;
    const simDuration = 1000;
    const stepMs = 8.33;

    for (let t = 0; t < simDuration; t += stepMs) {
      if (controller.shouldUpdate(t)) {
        updates++;
      }
    }

    expect(updates).toBeGreaterThanOrEqual(26);
    expect(updates).toBeLessThanOrEqual(34);
  });

  it('should maintain ~30 FPS at 120Hz screen refresh (simulated over 2 seconds)', () => {
    const controller = new FPSController({ targetFPS: 30 });
    const simDuration =