import { useGameStore } from '@/store/gameStore';
import type { Building } from '@/store/gameStore';

export function findNearestWarehouse(buildings: Building[], x: number, y: number): Building | null {
  let nearest: Building | null = null;
  let minDist = Infinity;
  for (const b of buildings) {
    if (b.type !== 'warehouse') continue;
    const dist = Math.abs(b.x - x) + Math.abs(b.y - y);
    if (dist < minDist) {
      minDist = dist;
      nearest = b;
    }
  }
  return nearest;
}

export function getWarehouseUtilization(): { used: number; capacity: number; ratio: number } {
  const state = useGameStore.getState();
  const { resources, warehouseCapacity } = state;
  const used = resources.energy + resources.mineral + resources.processedGoods;
  return {
    used,
    capacity: warehouseCapacity,
    ratio: used / warehouseCapacity,
  };
}

export function getTransportProgress(transportStartTime: number, duration: number): number {
  const elapsed = Date.now() - transportStartTime;
  return Math.min(1, elapsed / duration);
}

export function getActiveTransportCount(): number {
  return useGameStore.getState().transports.length;
}

export function isOverflowActive(): boolean {
  const state = useGameStore.getState();
  const { resources, warehouseCapacity } = state;
  const total = resources.energy + resources.mineral + resources.processedGoods;
  return total >= warehouseCapacity * 0.9;
}
