import { v4 as uuidv4 } from 'uuid';
import {
  PlantType,
  PlantParams,
  Plant,
  GrowthStage,
  EnvironmentParams,
  PLANT_PARAMS,
  GROWTH_STAGE_ORDER,
  STAGE_PROGRESS_THRESHOLDS,
  SOIL_WATER_RETENTION,
  WATER_NEED_MULTIPLIER,
  SOIL_NUTRIENT_RELEASE,
  FlowerParticle,
} from './types';

export function calcGrowth(
  plantParams: PlantParams,
  environmentParams: EnvironmentParams,
  currentProgress: number
): { newProgress: number; healthDelta: number } {
  const { lightIntensity, waterAmount, soilType } = environmentParams;
  const { requiredLightHours, waterNeed, growthCycleTurns } = plantParams;

  const lightFactor = Math.min(1, (lightIntensity / 100) * (12 / requiredLightHours));

  const waterRetention = SOIL_WATER_RETENTION[soilType];
  const effectiveWater = waterAmount * waterRetention;
  const waterNeedMultiplier = WATER_NEED_MULTIPLIER[waterNeed];
  const optimalWater = 2 * waterNeedMultiplier;
  const waterFactor = Math.min(1, effectiveWater / Math.max(0.1, optimalWater));

  const nutrientFactor = SOIL_NUTRIENT_RELEASE[soilType];

  const baseGrowthPerTurn = 1 / growthCycleTurns;

  const combinedFactor = (lightFactor * 0.4 + waterFactor * 0.4 + nutrientFactor * 0.2);
  const growthAmount = baseGrowthPerTurn * combinedFactor;

  const newProgress = Math.min(1, currentProgress + growthAmount);

  let healthDelta = 0;
  if (waterFactor < 0.3) {
    healthDelta -= 0.05;
  } else if (waterFactor > 0.7 && waterFactor <= 1.2) {
    healthDelta += 0.02;
  }
  if (lightFactor < 0.3) {
    healthDelta -= 0.03;
  }

  return { newProgress, healthDelta };
}

export function getGrowthStage(progress: number, plantParams: PlantParams): GrowthStage {
  const { finalStage } = plantParams;
  const finalIndex = GROWTH_STAGE_ORDER.indexOf(finalStage);

  for (let i = finalIndex; i >= 0; i--) {
    const stage = GROWTH_STAGE_ORDER[i];
    if (progress >= STAGE_PROGRESS_THRESHOLDS[stage]) {
      return stage;
    }
  }
  return 'seed';
}

export function createPlant(type: PlantType, x: number, y: number): Plant {
  const params = PLANT_PARAMS[type];
  return {
    id: uuidv4(),
    type,
    stage: 'seed',
    growthProgress: 0,
    health: 1.0,
    position: { x, y },
    hasTriggeredFlowerParticles: false,
  };
}

export function createFlowerParticles(
  plantX: number,
  plantY: number,
  petalColor: string,
  count: number = 10
): FlowerParticle[] {
  const particles: FlowerParticle[] = [];
  const actualCount = Math.floor(Math.random() * 5) + 8;

  for (let i = 0; i < actualCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.5 + Math.random() * 1.5;
    particles.push({
      id: uuidv4(),
      x: plantX + (Math.random() - 0.5) * 20,
      y: plantY - 10 + (Math.random() - 0.5) * 10,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed * 0.5 + 0.5,
      color: petalColor,
      size: 3 + Math.random() * 4,
      opacity: 1,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.1,
    });
  }
  return particles;
}

export function updateParticle(particle: FlowerParticle, deltaTime: number = 1): FlowerParticle {
  return {
    ...particle,
    x: particle.x + particle.vx * deltaTime,
    y: particle.y + particle.vy * deltaTime,
    vy: particle.vy + 0.05 * deltaTime,
    opacity: Math.max(0, particle.opacity - 0.015 * deltaTime),
    rotation: particle.rotation + particle.rotationSpeed * deltaTime,
  };
}

export function isParticleAlive(particle: FlowerParticle): boolean {
  return particle.opacity > 0;
}

export function validateGardenData(data: unknown): { valid: boolean; error?: string } {
  if (typeof data !== 'object' || data === null) {
    return { valid: false, error: '数据不是有效对象' };
  }

  const d = data as Record<string, unknown>;

  if (!d.grid || typeof d.grid !== 'object') {
    return { valid: false, error: '缺少 grid 字段或格式错误' };
  }

  const grid = d.grid as Record<string, unknown>;
  if (typeof grid.width !== 'number' || typeof grid.height !== 'number') {
    return { valid: false, error: 'grid 缺少 width 或 height' };
  }
  if (!Array.isArray(grid.cells)) {
    return { valid: false, error: 'grid.cells 不是数组' };
  }

  if (!d.environment || typeof d.environment !== 'object') {
    return { valid: false, error: '缺少 environment 字段或格式错误' };
  }

  const env = d.environment as Record<string, unknown>;
  if (typeof env.lightIntensity !== 'number') {
    return { valid: false, error: '缺少 lightIntensity 字段' };
  }
  if (typeof env.waterAmount !== 'number') {
    return { valid: false, error: '缺少 waterAmount 字段' };
  }
  if (typeof env.soilType !== 'string') {
    return { valid: false, error: '缺少 soilType 字段' };
  }

  if (typeof d.turnCount !== 'number') {
    return { valid: false, error: '缺少 turnCount 字段' };
  }

  return { valid: true };
}
