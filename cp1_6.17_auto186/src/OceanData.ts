import { eventBus, SIMULATION_UPDATE, HEATMAP_UPDATE, APP_READY } from './EventBus';
import * as THREE from 'three';

export interface FishData {
  id: number;
  position: THREE.Vector3;
  targetPosition: THREE.Vector3;
  speed: number;
  size: number;
  depthColor: THREE.Color;
  bezierOffset: THREE.Vector3;
  pathProgress: number;
  pathSpeed: number;
  visible: boolean;
  trail: THREE.Vector3[];
}

export interface HeatmapCell {
  x: number;
  z: number;
  density: number;
}

export interface SimulationData {
  fishes: FishData[];
  heatmapData: HeatmapCell[];
}

const FISH_COUNT = 120;
const SCENE_RADIUS = 30;
const MAX_DEPTH = 15;
const SHALLOW_COLOR = new THREE.Color(0xFFD93D);
const DEEP_COLOR = new THREE.Color(0x6C5CE7);
const UPDATE_INTERVAL = 1000;
const HEATMAP_GRID_SIZE = 20;
const HEATMAP_CELL_SIZE = 3;

export class OceanData {
  private fishes: FishData[] = [];
  private heatmapData: HeatmapCell[] = [];
  private bezierPath: THREE.CubicBezierCurve3 | null = null;
  private updateTimer: number | null = null;
  private heatmapTimer: number | null = null;
  private frameCount: number = 0;

  constructor() {
    this.generateBezierPath();
    this.generateFishes();
    this.generateHeatmapData();
  }

  private generateBezierPath(): void {
    const start = new THREE.Vector3(-SCENE_RADIUS * 0.8, -MAX_DEPTH * 0.3, 0);
    const control1 = new THREE.Vector3(-SCENE_RADIUS * 0.3, -MAX_DEPTH * 0.6, SCENE_RADIUS * 0.6);
    const control2 = new THREE.Vector3(SCENE_RADIUS * 0.3, -MAX_DEPTH * 0.2, -SCENE_RADIUS * 0.5);
    const end = new THREE.Vector3(SCENE_RADIUS * 0.8, -MAX_DEPTH * 0.5, SCENE_RADIUS * 0.3);
    this.bezierPath = new THREE.CubicBezierCurve3(start, control1, control2, end);
  }

  private generateFishes(): void {
    for (let i = 0; i < FISH_COUNT; i++) {
      const pathProgress = Math.random();
      const pathPoint = this.bezierPath!.getPoint(pathProgress);

      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 0.6,
        (Math.random() - 0.5) * 0.6,
        (Math.random() - 0.5) * 0.6
      );

      const position = pathPoint.clone().add(offset);
      const depthRatio = Math.min(Math.max(Math.abs(position.y) / MAX_DEPTH, 0), 1);
      const depthColor = SHALLOW_COLOR.clone().lerp(DEEP_COLOR, depthRatio);

      const trail: THREE.Vector3[] = [];
      for (let j = 0; j < 50; j++) {
        trail.push(position.clone());
      }

      this.fishes.push({
        id: i,
        position: position.clone(),
        targetPosition: position.clone(),
        speed: 0.02 + Math.random() * 0.02,
        size: 0.3 + Math.random() * 0.4,
        depthColor: depthColor,
        bezierOffset: offset,
        pathProgress: pathProgress,
        pathSpeed: 0.02 + Math.random() * 0.02,
        visible: true,
        trail: trail
      });
    }
  }

  private generateHeatmapData(): void {
    this.heatmapData = [];
    const halfGrid = HEATMAP_GRID_SIZE / 2;

    for (let x = -halfGrid; x < halfGrid; x++) {
      for (let z = -halfGrid; z < halfGrid; z++) {
        const worldX = x * HEATMAP_CELL_SIZE;
        const worldZ = z * HEATMAP_CELL_SIZE;

        let density = 0;
        for (const fish of this.fishes) {
          const dx = fish.position.x - worldX;
          const dz = fish.position.z - worldZ;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist < HEATMAP_CELL_SIZE * 2) {
            density += (1 - dist / (HEATMAP_CELL_SIZE * 2));
          }
        }

        this.heatmapData.push({
          x: worldX,
          z: worldZ,
          density: Math.min(density, 1)
        });
      }
    }
  }

  private updateSimulation(): void {
    for (const fish of this.fishes) {
      fish.pathProgress += fish.pathSpeed;
      if (fish.pathProgress > 1) {
        fish.pathProgress = 0;
      }

      const pathPoint = this.bezierPath!.getPoint(fish.pathProgress);
      fish.targetPosition.copy(pathPoint).add(fish.bezierOffset);
      fish.position.copy(fish.targetPosition);

      const depthRatio = Math.min(Math.max(Math.abs(fish.position.y) / MAX_DEPTH, 0), 1);
      fish.depthColor.copy(SHALLOW_COLOR).lerp(DEEP_COLOR, depthRatio);

      fish.trail.unshift(fish.position.clone());
      if (fish.trail.length > 50) {
        fish.trail.pop();
      }
    }

    this.frameCount++;

    eventBus.emit(SIMULATION_UPDATE, {
      fishes: this.fishes,
      frameCount: this.frameCount
    });
  }

  private updateHeatmap(): void {
    this.generateHeatmapData();
    eventBus.emit(HEATMAP_UPDATE, this.heatmapData);
  }

  public start(): void {
    this.updateSimulation();
    this.updateHeatmap();

    this.updateTimer = window.setInterval(() => {
      this.updateSimulation();
    }, UPDATE_INTERVAL);

    this.heatmapTimer = window.setInterval(() => {
      this.updateHeatmap();
    }, 2000);

    setTimeout(() => {
      eventBus.emit(APP_READY);
    }, 100);
  }

  public stop(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
    if (this.heatmapTimer) {
      clearInterval(this.heatmapTimer);
      this.heatmapTimer = null;
    }
  }

  public getFishes(): FishData[] {
    return this.fishes;
  }

  public getHeatmapData(): HeatmapCell[] {
    return this.heatmapData;
  }

  public getFishById(id: number): FishData | undefined {
    return this.fishes.find(f => f.id === id);
  }
}
