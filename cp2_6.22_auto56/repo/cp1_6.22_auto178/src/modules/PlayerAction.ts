import type { Plant, PlantSpecies, SelectedTool } from '@/types';
import { SPECIES_CONFIG, PLANT_SIZE, AUTO_IRRIGATOR_RADIUS, AUTO_IRRIGATOR_MAX, AUTO_IRRIGATOR_HINT_THRESHOLD } from '@/config/constants';
import { useGameStore } from '@/store/useGameStore';
import { generateId, randRange, clamp } from '@/utils/random';
import { harvestPlant } from './PlantGrowth';
import { createRipple } from './ParticleSystem';

export function plantSeed(species: PlantSpecies, x: number, y: number): boolean {
  const state = useGameStore.getState();
  if (state.seedInventory[species] <= 0) return false;
  if (isPositionOccupied(x, y)) return false;

  const cfg = SPECIES_CONFIG[species];
  const durRange = cfg.stageDurations.seed;
  const now = Date.now();

  const plant: Plant = {
    id: generateId(),
    species,
    stage: 'seed',
    stageProgress: 0,
    position: { x, y },
    health: 100,
    water: 80,
    lightSatisfaction: 3,
    isShaded: false,
    isFertilized: false,
    isDormant: false,
    plantTime: now,
    lastWaterTime: now,
    stageDuration: randRange(durRange[0], durRange[1]),
    swayPhase: Math.random() * Math.PI * 2,
  };

  useGameStore.getState().addPlant(plant);
  useGameStore.getState().updateSeedInventory(species, -1);

  const size = PLANT_SIZE.flowering;
  useGameStore.getState().addDirtyRect({
    x: x - size,
    y: y - size,
    w: size * 2,
    h: size * 2,
  });

  checkAutoIrrigationHint();
  return true;
}

export function isPositionOccupied(x: number, y: number): boolean {
  const state = useGameStore.getState();
  const minDist = 50;
  for (const p of state.plants) {
    const dx = p.position.x - x;
    const dy = p.position.y - y;
    if (dx * dx + dy * dy < minDist * minDist) return true;
  }
  for (const irr of state.irrigators) {
    const dx = irr.position.x - x;
    const dy = irr.position.y - y;
    if (dx * dx + dy * dy < 40 * 40) return true;
  }
  return false;
}

export function placeAutoIrrigator(x: number, y: number): boolean {
  const state = useGameStore.getState();
  if (state.irrigators.length >= AUTO_IRRIGATOR_MAX) return false;
  if (state.unlockedSpecies.length < 2) return false;
  if (isPositionOccupied(x, y)) return false;

  useGameStore.getState().addIrrigator({
    id: generateId(),
    position: { x, y },
    radius: AUTO_IRRIGATOR_RADIUS,
    lastWaterTime: Date.now(),
  });
  useGameStore.getState().addDirtyRect({
    x: x - AUTO_IRRIGATOR_RADIUS,
    y: y - AUTO_IRRIGATOR_RADIUS,
    w: AUTO_IRRIGATOR_RADIUS * 2,
    h: AUTO_IRRIGATOR_RADIUS * 2,
  });
  return true;
}

export function waterPlant(plantId: string): void {
  const state = useGameStore.getState();
  const plant = state.plants.find((p) => p.id === plantId);
  if (!plant) return;

  const amount = plant.species === 'cactus' ? 15 : 25;
  useGameStore.getState().updatePlant(plantId, {
    water: clamp(plant.water + amount, 0, 100),
    lastWaterTime: Date.now(),
    isDormant: plant.water < 10 ? false : plant.isDormant,
  });
  createRipple(plant.position.x, plant.position.y);
}

export function toggleShade(plantId: string): void {
  const state = useGameStore.getState();
  const plant = state.plants.find((p) => p.id === plantId);
  if (!plant) return;
  useGameStore.getState().updatePlant(plantId, { isShaded: !plant.isShaded });
}

export function fertilizePlant(plantId: string): void {
  const state = useGameStore.getState();
  const plant = state.plants.find((p) => p.id === plantId);
  if (!plant || plant.isFertilized) return;
  useGameStore.getState().updatePlant(plantId, {
    isFertilized: true,
    health: clamp(plant.health + 10, 0, 100),
  });
}

export function handleCanvasClick(x: number, y: number): void {
  const state = useGameStore.getState();
  const tool: SelectedTool = state.selectedTool;

  if (tool !== 'none' && tool !== 'irrigator') {
    plantSeed(tool, x, y);
    return;
  }

  if (tool === 'irrigator') {
    placeAutoIrrigator(x, y);
    return;
  }

  for (const plant of state.plants) {
    const size = Math.max(PLANT_SIZE[plant.stage] * 0.7, 20);
    const dx = plant.position.x - x;
    const dy = plant.position.y - y;
    if (dx * dx + dy * dy <= size * size) {
      harvestPlant(plant);
      return;
    }
  }
}

export function checkAutoIrrigationHint(): void {
  const state = useGameStore.getState();
  if (
    state.plants.length > AUTO_IRRIGATOR_HINT_THRESHOLD &&
    !state.autoIrrigationHintShown &&
    state.unlockedSpecies.length >= 2 &&
    state.irrigators.length === 0
  ) {
    useGameStore.getState().setShowAutoIrrigationHint(true);
  }
}

export function awakenDormantPlant(plantId: string): void {
  const state = useGameStore.getState();
  const plant = state.plants.find((p) => p.id === plantId);
  if (!plant || !plant.isDormant) return;
  if (plant.water < 10) return;
  useGameStore.getState().updatePlant(plantId, { isDormant: false });
}
