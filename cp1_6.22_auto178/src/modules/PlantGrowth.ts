import type { Plant, GrowthStage } from '@/types';
import { SPECIES_CONFIG, STAGE_ORDER, PLANT_SIZE, HARVEST_PARTICLE_COUNT, HARVEST_PARTICLE_LIFE } from '@/config/constants';
import { useGameStore } from '@/store/useGameStore';
import { clamp, randRange, generateId } from '@/utils/random';
import { getEnvironmentSnapshot } from './Environment';

export function computeLightSatisfaction(plant: Plant, envLight: number): 1 | 2 | 3 | 4 | 5 {
  const cfg = SPECIES_CONFIG[plant.species];
  const effectiveLight = plant.isShaded ? envLight * 0.3 : envLight;
  const diff = Math.abs(effectiveLight - cfg.optimalLight);
  let stars: 1 | 2 | 3 | 4 | 5;
  if (diff < 0.1) stars = 5;
  else if (diff < 0.2) stars = 4;
  else if (diff < 0.35) stars = 3;
  else if (diff < 0.5) stars = 2;
  else stars = 1;
  return stars;
}

export function simulatePlantGrowth(plant: Plant, dt: number): Partial<Plant> {
  if (plant.isDormant) return {};

  const env = getEnvironmentSnapshot();
  const cfg = SPECIES_CONFIG[plant.species];
  const updates: Partial<Plant> = {};

  let waterConsumption = cfg.waterNeedPerSec * dt * env.tempMultiplier;
  if (env.precipitation === 'none') {
    waterConsumption *= 1.1;
  }
  if (plant.isFertilized) {
    waterConsumption *= 0.85;
  }
  const newWater = clamp(plant.water - waterConsumption, 0, 100);
  updates.water = newWater;

  const stars = computeLightSatisfaction(plant, env.lightIntensity);
  updates.lightSatisfaction = stars;

  let healthDelta = 0;
  if (newWater < 20) healthDelta -= 2 * dt;
  if (newWater < 10) healthDelta -= 3 * dt;
  if (stars <= 1) healthDelta -= 1 * dt;
  if (stars >= 4 && newWater > 40) healthDelta += 0.5 * dt;
  if (plant.isFertilized && stars >= 3 && newWater > 30) healthDelta += 0.8 * dt;
  if (env.currentWeather === 'thunderstorm' && !plant.isShaded) healthDelta -= 0.5 * dt;
  if (env.currentWeather === 'drought' && plant.species !== 'cactus') healthDelta -= 0.8 * dt;

  updates.health = clamp(plant.health + healthDelta, 0, 100);

  if (updates.health <= 0 || newWater <= 0) {
    updates.health = Math.max(updates.health ?? plant.health, 0);
  }

  if ((updates.health ?? plant.health) > 5) {
    let growthRate = dt / plant.stageDuration;
    growthRate *= (stars / 3);
    if (plant.isFertilized) growthRate *= 1.5;
    if (newWater < 30) growthRate *= 0.4;
    if ((updates.health ?? plant.health) < 30) growthRate *= 0.3;

    const currentIdx = STAGE_ORDER.indexOf(plant.stage);
    let newProgress = plant.stageProgress + growthRate;
    let newStage: GrowthStage = plant.stage;

    if (newProgress >= 1 && currentIdx < STAGE_ORDER.length - 1) {
      newStage = STAGE_ORDER[currentIdx + 1];
      newProgress = 0;
      const durRange = cfg.stageDurations[newStage];
      updates.stageDuration = randRange(durRange[0], durRange[1]);
      updates.isFertilized = false;
    }
    updates.stage = newStage;
    updates.stageProgress = Math.min(newProgress, 1);
  }

  updates.swayPhase = plant.swayPhase + dt * (1 + Math.random() * 0.3);

  return updates;
}

export function updateAllPlants(dt: number): void {
  const state = useGameStore.getState();
  for (const plant of state.plants) {
    const updates = simulatePlantGrowth(plant, dt);
    if (Object.keys(updates).length > 0) {
      const size = PLANT_SIZE[updates.stage ?? plant.stage];
      useGameStore.getState().addDirtyRect({
        x: plant.position.x - size,
        y: plant.position.y - size,
        w: size * 2,
        h: size * 2,
      });
      useGameStore.getState().updatePlant(plant.id, updates);
    }
  }
}

export function isReadyToHarvest(plant: Plant): boolean {
  return plant.stage === 'flowering' && plant.health > 10 && !plant.isDormant;
}

export function checkSpeciesUnlock(): void {
  const state = useGameStore.getState();
  for (const species of Object.keys(SPECIES_CONFIG) as (keyof typeof SPECIES_CONFIG)[]) {
    if (state.unlockedSpecies.includes(species)) continue;
    const cfg = SPECIES_CONFIG[species];
    if (!cfg.unlockRequirement) continue;
    const req = cfg.unlockRequirement;
    if (state.totalHarvested[req.species] >= req.count) {
      useGameStore.getState().unlockSpecies(species);
      useGameStore.getState().setPendingUnlock(species);
      useGameStore.getState().triggerScreenShake(5, 0.8);
    }
  }
}

export function harvestPlant(plant: Plant): void {
  if (!isReadyToHarvest(plant)) return;
  const cfg = SPECIES_CONFIG[plant.species];
  const state = useGameStore.getState();

  for (const [sp, count] of Object.entries(cfg.harvestReward)) {
    if (count) {
      useGameStore.getState().updateSeedInventory(sp as keyof typeof state.seedInventory, count);
      useGameStore.getState().incrementTotalHarvested(sp as keyof typeof state.totalHarvested, count);
    }
  }

  createHarvestParticles(plant.position.x, plant.position.y, cfg.color);
  const size = PLANT_SIZE[plant.stage];
  useGameStore.getState().addDirtyRect({
    x: plant.position.x - size - 50,
    y: plant.position.y - size - 50,
    w: size * 2 + 100,
    h: size * 2 + 100,
  });
  useGameStore.getState().removePlant(plant.id);
  checkSpeciesUnlock();
}

function createHarvestParticles(x: number, y: number, color: string): void {
  const particles: ReturnType<typeof useGameStore.getState>['particles'] = [];
  for (let i = 0; i < HARVEST_PARTICLE_COUNT; i++) {
    const angle = (Math.PI * 2 * i) / HARVEST_PARTICLE_COUNT + Math.random() * 0.3;
    const speed = randRange(60, 180);
    particles.push({
      id: generateId(),
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 40,
      life: HARVEST_PARTICLE_LIFE,
      maxLife: HARVEST_PARTICLE_LIFE,
      color,
      size: randRange(3, 8),
      type: 'harvest',
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: randRange(-5, 5),
    });
  }
  useGameStore.getState().addParticles(particles);
}
