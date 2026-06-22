import { useGardenStore } from './gardenStore';
import type { GrowthParams, GrowthStage, Particle, Seed } from './types/seed';

export const GROWTH_PARAMS: GrowthParams = {
  sproutingDuration: 800,
  branchingDuration: 1200,
  bloomingDuration: 1500,
  totalDuration: 3500,
};

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function easeOutElastic(t: number): number {
  if (t === 0) return 0;
  if (t === 1) return 1;
  const c4 = (2 * Math.PI) / 3;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

export function easeOutBounce(t: number): number {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) {
    return n1 * t * t;
  } else if (t < 2 / d1) {
    return n1 * (t -= 1.5 / d1) * t + 0.75;
  } else if (t < 2.5 / d1) {
    return n1 * (t -= 2.25 / d1) * t + 0.9375;
  } else {
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function computeStageFromElapsed(elapsed: number): {
  stage: GrowthStage;
  stageProgress: number;
  globalProgress: number;
} {
  const { sproutingDuration, branchingDuration, bloomingDuration, totalDuration } = GROWTH_PARAMS;
  const clampedElapsed = clamp(elapsed, 0, totalDuration);
  const globalProgress = clampedElapsed / totalDuration;

  if (clampedElapsed < sproutingDuration) {
    return {
      stage: 'sprouting',
      stageProgress: clampedElapsed / sproutingDuration,
      globalProgress,
    };
  }

  const afterSprouting = clampedElapsed - sproutingDuration;
  if (afterSprouting < branchingDuration) {
    return {
      stage: 'branching',
      stageProgress: afterSprouting / branchingDuration,
      globalProgress,
    };
  }

  const afterBranching = afterSprouting - branchingDuration;
  if (afterBranching < bloomingDuration) {
    return {
      stage: 'blooming',
      stageProgress: afterBranching / bloomingDuration,
      globalProgress,
    };
  }

  return {
    stage: 'complete',
    stageProgress: 1,
    globalProgress: 1,
  };
}

export function startGrowth(seedId: string): void {
  useGardenStore.getState().selectSeed(seedId);
}

export function resetGrowth(): void {
  useGardenStore.getState().resetGrowth();
}

export function tickGrowth(currentTime: number): void {
  const state = useGardenStore.getState();
  const { growth } = state;

  if (!growth.startTime || growth.stage === 'idle') return;
  if (growth.stage === 'complete') return;

  const elapsed = currentTime - growth.startTime;
  const result = computeStageFromElapsed(elapsed);

  if (result.stage !== growth.stage) {
    useGardenStore.getState().updateGrowth({
      stage: result.stage,
      stageProgress: result.stageProgress,
      globalProgress: result.globalProgress,
    });
  } else {
    useGardenStore.getState().updateGrowth({
      stageProgress: result.stageProgress,
      globalProgress: result.globalProgress,
    });
  }
}

export function generateDirtParticles(
  centerX: number,
  baseY: number,
  count: number
): Particle[] {
  const particles: Particle[] = [];
  const colors = ['#8B6914', '#A0522D', '#6B4423', '#8B4513', '#CD853F'];

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;
    particles.push({
      x: centerX + (Math.random() - 0.5) * 20,
      y: baseY,
      vx: Math.cos(angle) * speed,
      vy: -Math.abs(Math.sin(angle) * speed) - 1,
      life: 1,
      maxLife: 1,
      type: 'dirt',
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 2 + Math.random() * 4,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
    });
  }
  return particles;
}

export function generatePollenParticles(
  centerX: number,
  centerY: number,
  count: number,
  petalColor: string
): Particle[] {
  const particles: Particle[] = [];

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.5 + Math.random() * 1.5;
    particles.push({
      x: centerX,
      y: centerY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.5,
      life: 1,
      maxLife: 1,
      type: 'pollen',
      color: petalColor,
      size: 1.5 + Math.random() * 2.5,
      rotation: 0,
      rotationSpeed: 0,
    });
  }
  return particles;
}

export function generatePetalParticles(
  centerX: number,
  centerY: number,
  count: number,
  petalColor: string
): Particle[] {
  const particles: Particle[] = [];

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.3 + Math.random() * 0.8;
    particles.push({
      x: centerX + (Math.random() - 0.5) * 30,
      y: centerY + (Math.random() - 0.5) * 30,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed + 0.2,
      life: 1,
      maxLife: 1,
      type: 'petal',
      color: petalColor,
      size: 4 + Math.random() * 6,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
    });
  }
  return particles;
}

export function updateParticles(particles: Particle[], deltaTime: number): Particle[] {
  const gravity = 0.08;
  const airResistance = 0.98;
  const lifeDecay = deltaTime * 0.0012;

  return particles
    .map((p) => {
      const newVy = (p.vy + gravity) * airResistance;
      return {
        ...p,
        x: p.x + p.vx,
        y: p.y + newVy,
        vx: p.vx * airResistance,
        vy: newVy,
        rotation: p.rotation + p.rotationSpeed,
        life: p.life - lifeDecay,
      };
    })
    .filter((p) => p.life > 0);
}

export function getSelectedSeed(): Seed | null {
  const state = useGardenStore.getState();
  if (!state.growth.selectedSeedId) return null;
  return state.seeds.find((s) => s.id === state.growth.selectedSeedId) || null;
}

export function isGrowthComplete(): boolean {
  return useGardenStore.getState().growth.stage === 'complete';
}
