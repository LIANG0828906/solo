import { useGameStore } from '@/store/useGameStore';
import { AUTO_IRRIGATOR_INTERVAL, PLANT_SIZE } from '@/config/constants';
import { clamp } from '@/utils/random';
import { createRipple } from './ParticleSystem';

export function updateAutoSystems(dt: number): void {
  updateAutoIrrigators();
}

function updateAutoIrrigators(): void {
  const state = useGameStore.getState();
  const now = Date.now();
  const intervalMs = AUTO_IRRIGATOR_INTERVAL * 1000;

  for (const irrigator of state.irrigators) {
    if (now - irrigator.lastWaterTime >= intervalMs) {
      waterNearbyPlants(irrigator.position.x, irrigator.position.y, irrigator.radius);
      createRipple(irrigator.position.x, irrigator.position.y);
      useGameStore.getState().addDirtyRect({
        x: irrigator.position.x - irrigator.radius - 20,
        y: irrigator.position.y - irrigator.radius - 20,
        w: irrigator.radius * 2 + 40,
        h: irrigator.radius * 2 + 40,
      });

      const idx = state.irrigators.findIndex((i) => i.id === irrigator.id);
      if (idx >= 0) {
        const updated = [...state.irrigators];
        updated[idx] = { ...irrigator, lastWaterTime: now };
        useGameStore.setState({ irrigators: updated });
      }
    }
  }
}

function waterNearbyPlants(cx: number, cy: number, radius: number): void {
  const state = useGameStore.getState();
  for (const plant of state.plants) {
    const dx = plant.position.x - cx;
    const dy = plant.position.y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= radius) {
      const amount = plant.species === 'cactus' ? 10 : 18;
      useGameStore.getState().updatePlant(plant.id, {
        water: clamp(plant.water + amount, 0, 100),
        lastWaterTime: Date.now(),
      });
      const size = PLANT_SIZE[plant.stage];
      useGameStore.getState().addDirtyRect({
        x: plant.position.x - size,
        y: plant.position.y - size,
        w: size * 2,
        h: size * 2,
      });
    }
  }
}
