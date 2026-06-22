import * as THREE from 'three';
import { eventBus } from './EventBus';
import { TrajectoryPoint, TrajectoryFeatures, TrajectoryData } from './types';

const PARTICLE_COUNT = 300;
const MAX_TRAJECTORIES = 5;
const BLUE = new THREE.Color(0.31, 0.76, 0.97);
const RED = new THREE.Color(0.90, 0.22, 0.21);

interface ParticleSystem {
  points: THREE.Points;
  geometry: THREE.BufferGeometry;
  particles: {
    progress: number;
    speed: number;
    size: number;
  }[];
  trajectoryPoints: TrajectoryPoint[];
  curvatures: number[];
  segmentLengths: number[];
  totalLength: number;
  trajectoryId: string;
}

export default class ParticleRenderer {
  private scene: THREE.Scene;
  private systems: Map<string, ParticleSystem> = new Map();
  private curvatureThreshold: number = 1.0;
  private handler: (data: { points: TrajectoryPoint[]; features: TrajectoryFeatures; trajectoryId: string }) => void;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.handler = (data) => this.onGestureEnd(data);
  }

  start(): void {
    eventBus.on('gesture:end', this.handler);
  }

  stop(): void {
    eventBus.off('gesture:end', this.handler);
    this.clearAll();
  }

  setCurvatureThreshold(threshold: number): void {
    this.curvatureThreshold = threshold;
  }

  removeTrajectoryParticles(trajectoryId: string): void {
    const system = this.systems.get(trajectoryId);
    if (!system) return;
    this.scene.remove(system.points);
    system.geometry.dispose();
    (system.points.material as THREE.PointsMaterial).dispose();
    this.systems.delete(trajectoryId);
  }

  clearAll(): void {
    for (const id of this.systems.keys()) {
      this.removeTrajectoryParticles(id);
    }
  }

  update(deltaTime: number): void {
    for (const system of this.systems.values()) {
      const positions = system.geometry.attributes.position as THREE.BufferAttribute;
      const colors = system.geometry.attributes.color as THREE.BufferAttribute;

      for (let i = 0; i < system.particles.length; i++) {
        const p = system.particles[i];
        p.progress += (p.speed * deltaTime) / system.totalLength;
        if (p.progress >= 1) {
          p.progress -= 1;
        }

        const pos = this.getPositionAtProgress(system, p.progress);
        positions.setXYZ(i, pos.x, pos.y, pos.z);

        const color = this.getColorAtProgress(system, p.progress);
        colors.setXYZ(i, color.r, color.g, color.b);
      }

      positions.needsUpdate = true;
      colors.needsUpdate = true;
    }
  }

  private onGestureEnd(data: { points: TrajectoryPoint[]; features: TrajectoryFeatures; trajectoryId: string }): void {
    if (this.systems.size >= MAX_TRAJECTORIES) {
      const oldestId = this.systems.keys().next().value!;
      this.removeTrajectoryParticles(oldestId);
    }

    this.createParticleSystem(data.trajectoryId, data.points, data.features);
  }

  private createParticleSystem(trajectoryId: string, points: TrajectoryPoint[], features: TrajectoryFeatures): void {
    const segmentLengths = this.computeSegmentLengths(points);
    const totalLength = segmentLengths.reduce((sum, l) => sum + l, 0);

    const particles: ParticleSystem['particles'] = [];
    const positionArray = new Float32Array(PARTICLE_COUNT * 3);
    const colorArray = new Float32Array(PARTICLE_COUNT * 3);
    const sizeArray = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const progress = Math.random();
      const speed = 0.5 + Math.random() * 1.5;
      const size = 2 + Math.random() * 3;

      particles.push({ progress, speed, size });
      sizeArray[i] = size;

      const pos = this.getPositionAtProgress({ trajectoryPoints: points, segmentLengths, totalLength, curvatures: features.curvatures } as ParticleSystem, progress);
      positionArray[i * 3] = pos.x;
      positionArray[i * 3 + 1] = pos.y;
      positionArray[i * 3 + 2] = pos.z;

      const color = this.getColorAtProgress({ curvatures: features.curvatures, segmentLengths, totalLength, trajectoryPoints: points } as ParticleSystem, progress);
      colorArray[i * 3] = color.r;
      colorArray[i * 3 + 1] = color.g;
      colorArray[i * 3 + 2] = color.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizeArray, 1));

    const material = new THREE.PointsMaterial({
      size: 3,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const pointsObj = new THREE.Points(geometry, material);
    this.scene.add(pointsObj);

    this.systems.set(trajectoryId, {
      points: pointsObj,
      geometry,
      particles,
      trajectoryPoints: points,
      curvatures: features.curvatures,
      segmentLengths,
      totalLength,
      trajectoryId,
    });
  }

  private computeSegmentLengths(points: TrajectoryPoint[]): number[] {
    const lengths: number[] = [];
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      const dz = points[i].z - points[i - 1].z;
      lengths.push(Math.sqrt(dx * dx + dy * dy + dz * dz));
    }
    return lengths;
  }

  private getPositionAtProgress(system: { trajectoryPoints: TrajectoryPoint[]; segmentLengths: number[]; totalLength: number }, progress: number): THREE.Vector3 {
    const targetDist = progress * system.totalLength;
    let accumulated = 0;

    for (let i = 0; i < system.segmentLengths.length; i++) {
      if (accumulated + system.segmentLengths[i] >= targetDist) {
        const segProgress = (targetDist - accumulated) / system.segmentLengths[i];
        const p0 = system.trajectoryPoints[i];
        const p1 = system.trajectoryPoints[i + 1];
        return new THREE.Vector3(
          p0.x + (p1.x - p0.x) * segProgress,
          p0.y + (p1.y - p0.y) * segProgress,
          p0.z + (p1.z - p0.z) * segProgress
        );
      }
      accumulated += system.segmentLengths[i];
    }

    const last = system.trajectoryPoints[system.trajectoryPoints.length - 1];
    return new THREE.Vector3(last.x, last.y, last.z);
  }

  private getColorAtProgress(system: { curvatures: number[]; segmentLengths: number[]; totalLength: number; trajectoryPoints: TrajectoryPoint[] }, progress: number): THREE.Color {
    const curvature = this.getCurvatureAtProgress(system, progress);
    const t = Math.min(curvature / this.curvatureThreshold, 1);
    return new THREE.Color().copy(BLUE).lerp(RED, t);
  }

  private getCurvatureAtProgress(system: { curvatures: number[]; segmentLengths: number[]; totalLength: number }, progress: number): number {
    const targetDist = progress * system.totalLength;
    let accumulated = 0;

    for (let i = 0; i < system.segmentLengths.length; i++) {
      if (accumulated + system.segmentLengths[i] >= targetDist) {
        const segProgress = (targetDist - accumulated) / system.segmentLengths[i];
        const c0 = system.curvatures[i] ?? 0;
        const c1 = system.curvatures[i + 1] ?? c0;
        return c0 + (c1 - c0) * segProgress;
      }
      accumulated += system.segmentLengths[i];
    }

    return system.curvatures[system.curvatures.length - 1] ?? 0;
  }
}
