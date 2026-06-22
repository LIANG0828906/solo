import type { Particle, ParticleType } from '@/types';
import { generateId, randRange } from '@/utils/random';
import { useGameStore } from '@/store/useGameStore';
import { getEnvironmentSnapshot } from './Environment';

let lastRainTime = 0;
let lastCloudSpawnTime = 0;

export function updateParticles(dt: number): void {
  const state = useGameStore.getState();
  const updated: Particle[] = [];

  for (const p of state.particles) {
    const newLife = p.life - dt;
    if (newLife <= 0) continue;

    let vx = p.vx;
    let vy = p.vy;

    switch (p.type) {
      case 'harvest':
        vy += 200 * dt;
        break;
      case 'ripple':
        break;
      case 'raindrop':
        vx += Math.sin(p.life * 10) * 20 * dt;
        break;
      case 'cloud':
        vx = p.vx;
        break;
      case 'lightning':
        break;
    }

    updated.push({
      ...p,
      x: p.x + vx * dt,
      y: p.y + vy * dt,
      vx,
      vy,
      life: newLife,
      rotation: p.rotation !== undefined ? p.rotation + (p.rotationSpeed ?? 0) * dt : undefined,
    });
  }

  useGameStore.getState().replaceAllParticles(updated);

  const env = getEnvironmentSnapshot();
  maybeSpawnWeatherParticles(dt, env.precipitation);
}

function maybeSpawnWeatherParticles(dt: number, precipitation: 'none' | 'light' | 'heavy'): void {
  const state = useGameStore.getState();
  const canvas = (useGameStore.getState() as unknown as { canvasSize?: { w: number; h: number } }).canvasSize;
  const w = 1600;
  const h = 900;

  if (precipitation !== 'none') {
    lastRainTime += dt;
    const interval = precipitation === 'heavy' ? 0.01 : 0.04;
    while (lastRainTime >= interval) {
      lastRainTime -= interval;
      const count = precipitation === 'heavy' ? 4 : 2;
      const drops: Particle[] = [];
      for (let i = 0; i < count; i++) {
        drops.push({
          id: generateId(),
          x: randRange(0, w),
          y: randRange(-50, -10),
          vx: randRange(-20, 20),
          vy: randRange(400, 600),
          life: 2,
          maxLife: 2,
          color: '#7DD3FC',
          size: 2,
          type: 'raindrop',
        });
      }
      useGameStore.getState().addParticles(drops);
    }
  }

  lastCloudSpawnTime += dt;
  if (lastCloudSpawnTime >= 2) {
    lastCloudSpawnTime = 0;
    if (state.currentWeather === 'cloudy' || state.currentWeather === 'rain' || state.currentWeather === 'thunderstorm') {
      const cloudCount = state.currentWeather === 'sunny' ? 0 : state.currentWeather === 'cloudy' ? 1 : 2;
      for (let i = 0; i < cloudCount; i++) {
        useGameStore.getState().addParticle({
          id: generateId(),
          x: -150,
          y: randRange(30, 120),
          vx: randRange(15, 30),
          vy: 0,
          life: 80,
          maxLife: 80,
          color: state.currentWeather === 'thunderstorm' ? '#64748B' : '#E2E8F0',
          size: randRange(40, 80),
          type: 'cloud',
        });
      }
    }
  }
}

export function createRipple(x: number, y: number): void {
  const ripples: Particle[] = [];
  for (let i = 0; i < 3; i++) {
    ripples.push({
      id: generateId(),
      x,
      y,
      vx: 0,
      vy: 0,
      life: 0.6 + i * 0.15,
      maxLife: 0.6 + i * 0.15,
      color: '#60A5FA',
      size: 5 + i * 10,
      type: 'ripple',
    });
  }
  useGameStore.getState().addParticles(ripples);
}
