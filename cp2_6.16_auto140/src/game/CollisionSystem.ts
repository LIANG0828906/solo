import type { AABB, ObstacleData, PowerUpData } from '../types';
import { aabbIntersect } from '../utils/helpers';

export class CollisionSystem {
  public checkVehicleObstacle(
    vehicleAABB: AABB,
    obstacles: ObstacleData[]
  ): ObstacleData | null {
    for (const obs of obstacles) {
      if (aabbIntersect(vehicleAABB, obs.aabb)) {
        return obs;
      }
    }
    return null;
  }

  public checkVehiclePowerUps(
    vehicleAABB: AABB,
    powerUps: PowerUpData[]
  ): PowerUpData[] {
    const hits: PowerUpData[] = [];
    for (const pu of powerUps) {
      if (aabbIntersect(vehicleAABB, pu.aabb)) {
        hits.push(pu);
      }
    }
    return hits;
  }
}
