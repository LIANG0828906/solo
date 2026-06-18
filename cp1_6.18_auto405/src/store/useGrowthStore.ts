import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Seed, Particle, GrowthState, GrowthParams, SeedStatus } from '@/types';

const MAX_SEEDS = 10;
const MAX_PARTICLES = 2000;
const FADE_DURATION = 3;
const GROWTH_WAIT_MIN = 1;
const GROWTH_WAIT_MAX = 3;
const PARTICLES_PER_BRANCH = 3;

function generateParticleTree(
  startPos: [number, number, number],
  branchDensity: number
): { particles: Particle[]; connections: [string, string][] } {
  const particles: Particle[] = [];
  const connections: [string, string][] = [];
  const maxDepth = Math.floor(branchDensity);
  const particlesPerLevel = Math.floor(branchDensity * 2 + 1);

  const rootId = uuidv4();
  const rootParticle: Particle = {
    id: rootId,
    position: [...startPos] as [number, number, number],
    originalPosition: [...startPos] as [number, number, number],
    targetPosition: [...startPos] as [number, number, number],
    depth: 0,
    parentId: null,
    phase: Math.random() * Math.PI * 2,
    frequency: 0.5 + Math.random() * 1.5,
    opacity: 1,
    growthProgress: 1,
  };
  particles.push(rootParticle);

  const queue: { id: string; pos: [number, number, number]; depth: number }[] = [
    { id: rootId, pos: [...startPos] as [number, number, number], depth: 0 },
  ];

  while (queue.length > 0 && particles.length < 200) {
    const current = queue.shift()!;
    if (current.depth >= maxDepth) continue;

    const childCount = Math.max(1, Math.floor(particlesPerLevel / (current.depth + 1)));

    for (let i = 0; i < childCount && particles.length < 200; i++) {
      const angleX = (Math.random() - 0.5) * Math.PI / 3;
      const angleY = (Math.random() - 0.5) * Math.PI / 3;
      const angleZ = (Math.random() - 0.5) * Math.PI / 3;

      const stepLength = 0.3 + Math.random() * 0.3;
      const dir: [number, number, number] = [
        Math.sin(angleY) * Math.cos(angleX) * stepLength,
        Math.sin(angleX) * stepLength + 0.1,
        Math.cos(angleY) * Math.cos(angleX) * stepLength,
      ];

      const newPos: [number, number, number] = [
        current.pos[0] + dir[0],
        current.pos[1] + dir[1],
        current.pos[2] + dir[2],
      ];

      const childId = uuidv4();
      const childParticle: Particle = {
        id: childId,
        position: [...current.pos] as [number, number, number],
        originalPosition: [...newPos] as [number, number, number],
        targetPosition: [...newPos] as [number, number, number],
        depth: current.depth + 1,
        parentId: current.id,
        phase: Math.random() * Math.PI * 2,
        frequency: 0.5 + Math.random() * 1.5,
        opacity: 0,
        growthProgress: 0,
      };

      particles.push(childParticle);
      connections.push([current.id, childId]);
      queue.push({ id: childId, pos: newPos, depth: current.depth + 1 });
    }
  }

  return { particles, connections };
}

const useGrowthStore = create<GrowthState>((set, get) => ({
  seeds: [],
  params: {
    growthSpeed: 1,
    branchDensity: 4,
    startColor: '#4ECDC4',
    endColor: '#FF6B6B',
  },
  time: 0,
  totalParticles: 0,

  seed: (position: [number, number, number]) => {
    const state = get();
    const { seeds, params } = state;

    const existingSeeds = seeds.filter((s) => s.status !== 'fading');
    if (existingSeeds.length >= MAX_SEEDS) {
      const oldestSeed = existingSeeds[0];
      set((state) => ({
        seeds: state.seeds.map((s) =>
          s.id === oldestSeed.id
            ? { ...s, status: 'fading' as SeedStatus, fadeStartTime: state.time }
            : s
        ),
      }));
    }

    const waitTime = GROWTH_WAIT_MIN + Math.random() * (GROWTH_WAIT_MAX - GROWTH_WAIT_MIN);
    const { particles, connections } = generateParticleTree(position, params.branchDensity);

    const newSeed: Seed = {
      id: uuidv4(),
      position,
      status: 'waiting',
      startTime: state.time,
      growthStartTime: state.time + waitTime,
      particles,
      connections,
      breathPhase: Math.random() * Math.PI * 2,
      breathCycle: 4 + Math.random() * 4,
      fadeStartTime: null,
      maxDepth: Math.floor(params.branchDensity),
    };

    set((state) => {
      const newSeeds = [...state.seeds, newSeed];
      const totalParticles = newSeeds.reduce((sum, s) => sum + s.particles.length, 0);
      return {
        seeds: newSeeds,
        totalParticles,
      };
    });
  },

  update: (delta: number) => {
    const state = get();
    const { seeds, params, time } = state;
    const newTime = time + delta;

    const updatedSeeds = seeds
      .map((seed) => {
        let updatedSeed = { ...seed };

        if (seed.status === 'waiting' && newTime >= seed.growthStartTime) {
          updatedSeed.status = 'growing';
        }

        if (seed.status === 'fading' && seed.fadeStartTime !== null) {
          const fadeProgress = (newTime - seed.fadeStartTime) / FADE_DURATION;
          if (fadeProgress >= 1) {
            return null;
          }
          updatedSeed.particles = seed.particles.map((p) => ({
            ...p,
            opacity: Math.max(0, 1 - fadeProgress),
          }));
        }

        if (seed.status === 'growing' || seed.status === 'complete') {
          let allComplete = true;
          updatedSeed.particles = seed.particles.map((p) => {
            if (p.growthProgress >= 1) return p;
            const newProgress = Math.min(1, p.growthProgress + delta * params.growthSpeed * 0.5);
            if (newProgress < 1) allComplete = false;

            const t = easeOutCubic(newProgress);
            const newPos: [number, number, number] = [
              seed.position[0] + (p.targetPosition[0] - seed.position[0]) * t,
              seed.position[1] + (p.targetPosition[1] - seed.position[1]) * t,
              seed.position[2] + (p.targetPosition[2] - seed.position[2]) * t,
            ];

            return {
              ...p,
              position: newPos,
              originalPosition: newPos,
              opacity: t,
              growthProgress: newProgress,
            };
          });

          if (allComplete && seed.status === 'growing') {
            updatedSeed.status = 'complete';
          }
        }

        updatedSeed.breathPhase += (delta / updatedSeed.breathCycle) * Math.PI * 2;

        return updatedSeed;
      })
      .filter((s): s is Seed => s !== null);

    const totalParticles = updatedSeeds.reduce((sum, s) => sum + s.particles.length, 0);

    set({
      seeds: updatedSeeds,
      time: newTime,
      totalParticles,
    });
  },

  reset: () => {
    set({
      seeds: [],
      time: 0,
      totalParticles: 0,
    });
  },

  setParams: (newParams: Partial<GrowthParams>) => {
    set((state) => ({
      params: { ...state.params, ...newParams },
    }));
  },
}));

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

if (typeof window !== 'undefined') {
  (window as any).__growthStore = useGrowthStore;
}

export default useGrowthStore;
