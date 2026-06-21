import * as THREE from 'three';
import { CityData, TrafficParticle, RoadSegment } from './types';

export class TrafficSimulator {
  private cityData: CityData;
  private particles: TrafficParticle[];
  private densityMap: Map<string, number>;
  private cityBounds: { minX: number; maxX: number; minZ: number; maxZ: number };

  constructor(cityData: CityData) {
    this.cityData = cityData;
    this.particles = [];
    this.densityMap = new Map();
    const stride = cityData.blockSize + cityData.streetWidth;
    this.cityBounds = {
      minX: -cityData.streetWidth / 2,
      maxX: cityData.gridWidth * stride - cityData.streetWidth / 2,
      minZ: -cityData.streetWidth / 2,
      maxZ: cityData.gridDepth * stride - cityData.streetWidth / 2,
    };
  }

  initParticles(count = 300): void {
    if (count > 500) count = 500;
    this.particles = [];
    const roads = this.cityData.roads;
    if (roads.length === 0) return;

    for (let i = 0; i < count; i++) {
      const road = roads[Math.floor(Math.random() * roads.length)];
      const t = Math.random();
      const position = new THREE.Vector3(
        road.startX + (road.endX - road.startX) * t,
        1,
        road.startZ + (road.endZ - road.startZ) * t
      );

      const speed = 5 + Math.random() * 10;
      const velocity = this.computeVelocity(road, speed);

      this.particles.push({
        id: `particle_${i}`,
        position,
        velocity,
        speed,
        currentRoad: road.id,
        trail: [],
        turnTimer: Math.random() * 5,
      });
    }
  }

  private computeVelocity(road: RoadSegment, speed: number): THREE.Vector3 {
    if (road.direction === 'ns') {
      return new THREE.Vector3(0, 0, speed * (Math.random() < 0.5 ? 1 : -1));
    }
    return new THREE.Vector3(speed * (Math.random() < 0.5 ? 1 : -1), 0, 0);
  }

  private getRoadById(id: string): RoadSegment | undefined {
    return this.cityData.roads.find(r => r.id === id);
  }

  private findConnectedRoads(road: RoadSegment): RoadSegment[] {
    const otherDir = road.direction === 'ns' ? 'ew' : 'ns';
    const isNS = road.direction === 'ns';
    const fixedCoord = isNS ? road.startX : road.startZ;
    const sweepStart = isNS ? road.startZ : road.startX;
    const sweepEnd = isNS ? road.endZ : road.endX;

    const connected: RoadSegment[] = [];
    for (const other of this.cityData.roads) {
      if (other.direction !== otherDir) continue;
      const otherFixed = other.direction === 'ew' ? other.startZ : other.startX;
      const otherSweepStart = other.direction === 'ew' ? other.startX : other.startZ;
      const otherSweepEnd = other.direction === 'ew' ? other.endX : other.endZ;

      const fixedInRange = otherFixed >= Math.min(fixedCoord, fixedCoord) &&
        otherFixed <= Math.max(fixedCoord, fixedCoord);
      if (!fixedInRange) continue;

      const crossCoord = isNS ? otherFixed : otherFixed;
      const inRange = crossCoord >= Math.min(sweepStart, sweepEnd) &&
        crossCoord <= Math.max(sweepStart, sweepEnd);
      if (!inRange) continue;

      const particleInRange = isNS
        ? (otherSweepStart <= road.startX && otherSweepEnd >= road.startX)
        : (otherSweepStart <= road.startZ && otherSweepEnd >= road.startZ);
      if (particleInRange) {
        connected.push(other);
      }
    }
    return connected;
  }

  private handleIntersection(particle: TrafficParticle): void {
    const road = this.getRoadById(particle.currentRoad);
    if (!road) return;

    const roll = Math.random();
    const connected = this.findConnectedRoads(road);

    if (roll < 0.33 && connected.length > 0) {
      const newRoad = connected[Math.floor(Math.random() * connected.length)];
      particle.currentRoad = newRoad.id;
      particle.velocity = this.computeVelocity(newRoad, particle.speed);
    } else if (roll < 0.66 && connected.length > 0) {
      const newRoad = connected[Math.floor(Math.random() * connected.length)];
      particle.currentRoad = newRoad.id;
      particle.velocity = this.computeVelocity(newRoad, particle.speed);
    }

    particle.turnTimer = Math.random() * 5;
  }

  private wrapPosition(pos: THREE.Vector3): void {
    const { minX, maxX, minZ, maxZ } = this.cityBounds;
    const rangeX = maxX - minX;
    const rangeZ = maxZ - minZ;

    if (pos.x > maxX) pos.x = minX + (pos.x - maxX) % rangeX;
    else if (pos.x < minX) pos.x = maxX - (minX - pos.x) % rangeX;

    if (pos.z > maxZ) pos.z = minZ + (pos.z - maxZ) % rangeZ;
    else if (pos.z < minZ) pos.z = maxZ - (minZ - pos.z) % rangeZ;
  }

  private updateDensityMap(): void {
    this.densityMap.clear();
    const now = performance.now();
    const threshold = 30;

    for (const block of this.cityData.blocks) {
      let count = 0;
      const bx = block.centerX;
      const bz = block.centerZ;

      for (const p of this.particles) {
        const dx = p.position.x - bx;
        const dz = p.position.z - bz;
        if (dx * dx + dz * dz < threshold * threshold) {
          count++;
        }
      }
      this.densityMap.set(block.id, count);
    }

    const maxCount = Math.max(1, ...this.densityMap.values());
    for (const [id, count] of this.densityMap) {
      this.densityMap.set(id, count / maxCount);
    }
  }

  updateTraffic(deltaTime: number): { particles: TrafficParticle[]; densityMap: Map<string, number> } {
    const now = performance.now() / 1000;

    for (const particle of this.particles) {
      particle.position.x += particle.velocity.x * deltaTime;
      particle.position.z += particle.velocity.z * deltaTime;
      particle.position.y = 1;

      particle.trail.push({
        position: particle.position.clone(),
        timestamp: now,
      });

      if (particle.trail.length > 10) {
        particle.trail = particle.trail.slice(-10);
      }
      particle.trail = particle.trail.filter(tp => now - tp.timestamp < 2);

      particle.turnTimer -= deltaTime;
      if (particle.turnTimer <= 0) {
        this.handleIntersection(particle);
      }

      this.wrapPosition(particle.position);
    }

    this.updateDensityMap();

    return { particles: this.particles, densityMap: this.densityMap };
  }

  getDensityForBlock(blockId: string): number {
    return this.densityMap.get(blockId) ?? 0;
  }
}
