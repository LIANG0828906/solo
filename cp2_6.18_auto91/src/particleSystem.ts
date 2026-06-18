import * as THREE from 'three';
import { DensityGrid } from './dataManager';

const PARTICLE_COUNT = 5000;
const SHAPE_TRANSITION_DURATION = 1.0;
const POSITION_LERP_SPEED = 0.05;

interface ParticleState {
  basePhi: number;
  baseTheta: number;
  gridX: number;
  gridY: number;
  seed: number;
  targetX: number;
  targetY: number;
  targetZ: number;
}

export class ParticleSystem {
  private scene: THREE.Scene;
  private particles!: THREE.Points;
  private geometry: THREE.BufferGeometry;
  private positions: Float32Array;
  private colors: Float32Array;
  private particleStates: ParticleState[];
  private positionAttribute: THREE.BufferAttribute;
  private colorAttribute: THREE.BufferAttribute;
  
  private currentYShapeFactor: number = 1.2;
  private targetYShapeFactor: number = 1.2;
  private startYShapeFactor: number = 1.2;
  private currentZShapeFactor: number = 1.0;
  private targetZShapeFactor: number = 1.0;
  private startZShapeFactor: number = 1.0;
  private shapeTransitionTimer: number = SHAPE_TRANSITION_DURATION;

  private coolColor: THREE.Color;
  private warmColor: THREE.Color;

  constructor(scene: THREE.Scene) {
    this.coolColor = new THREE.Color(0x00D4FF);
    this.warmColor = new THREE.Color(0xFF3366);
    
    this.scene = scene;
    this.particleStates = [];
    this.positions = new Float32Array(PARTICLE_COUNT * 3);
    this.colors = new Float32Array(PARTICLE_COUNT * 3);

    this.geometry = new THREE.BufferGeometry();
    this.positionAttribute = new THREE.BufferAttribute(this.positions, 3);
    this.colorAttribute = new THREE.BufferAttribute(this.colors, 3);
    this.positionAttribute.setUsage(THREE.DynamicDrawUsage);
    this.colorAttribute.setUsage(THREE.DynamicDrawUsage);
    this.geometry.setAttribute('position', this.positionAttribute);
    this.geometry.setAttribute('color', this.colorAttribute);

    this.initializeParticleStates();
    this.createMaterial();
    this.initializeParticlePositions();
  }

  private initializeParticleStates(): void {
    const gridSize = 4;
    const particlesPerCell = Math.floor(PARTICLE_COUNT / (gridSize * gridSize));
    let index = 0;

    for (let gx = 0; gx < gridSize; gx++) {
      for (let gy = 0; gy < gridSize; gy++) {
        for (let p = 0; p < particlesPerCell && index < PARTICLE_COUNT; p++) {
          const seed = Math.random();
          const goldenAngle = Math.PI * (3 - Math.sqrt(5));
          const phi = goldenAngle * index;
          const theta = Math.acos(1 - 2 * ((index + 0.5) / PARTICLE_COUNT));
          
          this.particleStates[index] = {
            basePhi: phi,
            baseTheta: theta,
            gridX: gx,
            gridY: gy,
            seed: seed,
            targetX: 0,
            targetY: 0,
            targetZ: 0
          };
          index++;
        }
      }
    }

    while (index < PARTICLE_COUNT) {
      const gx = Math.floor(Math.random() * gridSize);
      const gy = Math.floor(Math.random() * gridSize);
      const seed = Math.random();
      const goldenAngle = Math.PI * (3 - Math.sqrt(5));
      const phi = goldenAngle * index;
      const theta = Math.acos(1 - 2 * ((index + 0.5) / PARTICLE_COUNT));
      
      this.particleStates[index] = {
        basePhi: phi,
        baseTheta: theta,
        gridX: gx,
        gridY: gy,
        seed: seed
      };
      index++;
    }
  }

  private createMaterial(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const material = new THREE.PointsMaterial({
      size: 0.06,
      map: texture,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });

    this.particles = new THREE.Points(this.geometry, material);
    this.scene.add(this.particles);
  }

  private initializeParticlePositions(): void {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const state = this.particleStates[i];
      const radius = 1;
      
      const x = radius * Math.sin(state.baseTheta) * Math.cos(state.basePhi);
      const y = radius * Math.cos(state.baseTheta);
      const z = radius * Math.sin(state.baseTheta) * Math.sin(state.basePhi);
      
      this.positions[i * 3] = x;
      this.positions[i * 3 + 1] = y;
      this.positions[i * 3 + 2] = z;

      state.targetX = x;
      state.targetY = y;
      state.targetZ = z;

      this.colors[i * 3] = this.coolColor.r;
      this.colors[i * 3 + 1] = this.coolColor.g;
      this.colors[i * 3 + 2] = this.coolColor.b;
    }
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  private getCellDensity(densityGrid: DensityGrid, gridX: number, gridY: number): number {
    const cells = densityGrid.cells;
    const size = densityGrid.size;
    const gx = Math.max(0, Math.min(size - 1, gridX));
    const gy = Math.max(0, Math.min(size - 1, gridY));
    return cells[gx][gy];
  }

  private interpolateColor(density: number): THREE.Color {
    const t = density / 100;
    const result = new THREE.Color();
    
    result.r = this.lerp(this.coolColor.r, this.warmColor.r, t);
    result.g = this.lerp(this.coolColor.g, this.warmColor.g, t);
    result.b = this.lerp(this.coolColor.b, this.warmColor.b, t);
    
    return result;
  }

  private getRadiusFromDensity(density: number, seed: number): number {
    let baseRadius: number;
    
    if (density < 30) {
      const localT = density / 30;
      baseRadius = this.lerp(0, 2, localT);
    } else if (density > 70) {
      const localT = (density - 70) / 30;
      baseRadius = this.lerp(4, 6, localT);
    } else {
      const localT = (density - 30) / 40;
      baseRadius = this.lerp(2, 4, localT);
    }
    
    const jitter = (seed - 0.5) * 0.4;
    return baseRadius + jitter;
  }

  update(densityGrid: DensityGrid, deltaTime: number): void {
    const avgDensity = densityGrid.averageDensity;
    const densityT = avgDensity / 100;
    
    const deformationFactor = this.lerp(0.6, 1.4, densityT);
    const newTargetY = this.lerp(1.0, 0.6, densityT);
    const newTargetZ = this.lerp(1.0, 1.4, densityT);
    
    if (Math.abs(newTargetY - this.targetYShapeFactor) > 0.001 ||
        Math.abs(newTargetZ - this.targetZShapeFactor) > 0.001) {
      this.startYShapeFactor = this.currentYShapeFactor;
      this.startZShapeFactor = this.currentZShapeFactor;
      this.targetYShapeFactor = newTargetY;
      this.targetZShapeFactor = newTargetZ;
      this.shapeTransitionTimer = 0;
    }
    
    if (this.shapeTransitionTimer < SHAPE_TRANSITION_DURATION) {
      this.shapeTransitionTimer = Math.min(SHAPE_TRANSITION_DURATION, this.shapeTransitionTimer + deltaTime);
      const t = this.shapeTransitionTimer / SHAPE_TRANSITION_DURATION;
      const smoothT = t * t * (3 - 2 * t);
      this.currentYShapeFactor = this.lerp(this.startYShapeFactor, this.targetYShapeFactor, smoothT);
      this.currentZShapeFactor = this.lerp(this.startZShapeFactor, this.targetZShapeFactor, smoothT);
    }

    const time = performance.now() / 1000;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const state = this.particleStates[i];
      const density = this.getCellDensity(densityGrid, state.gridX, state.gridY);
      
      const baseRadius = this.getRadiusFromDensity(density, state.seed);
      const flowOffset = Math.sin(time * 0.8 + state.seed * 10 + density * 0.05) * 0.15;
      const radius = baseRadius + flowOffset;
      
      const wobbleSpeed = 0.3 + density * 0.01;
      const phiOffset = Math.sin(time * wobbleSpeed + state.seed * 20) * 0.08;
      const thetaOffset = Math.cos(time * wobbleSpeed * 0.7 + state.seed * 15) * 0.05;
      
      const phi = state.basePhi + phiOffset;
      const theta = state.baseTheta + thetaOffset;
      
      let targetX = radius * Math.sin(theta) * Math.cos(phi);
      let targetY = radius * Math.cos(theta) * this.currentYShapeFactor;
      let targetZ = radius * Math.sin(theta) * Math.sin(phi) * this.currentZShapeFactor;

      const gridSize = densityGrid.size;
      const cellCenterX = ((state.gridX + 0.5) / gridSize - 0.5) * 4;
      const cellCenterZ = ((state.gridY + 0.5) / gridSize - 0.5) * 4;
      const clusterFactor = density / 100;
      targetX = this.lerp(targetX, targetX + cellCenterX * 0.3, clusterFactor * 0.5);
      targetZ = this.lerp(targetZ, targetZ + cellCenterZ * 0.3, clusterFactor * 0.5);

      state.targetX = targetX;
      state.targetY = targetY;
      state.targetZ = targetZ;

      const currentX = this.positions[i * 3];
      const currentY = this.positions[i * 3 + 1];
      const currentZ = this.positions[i * 3 + 2];

      this.positions[i * 3] = this.lerp(currentX, state.targetX, POSITION_LERP_SPEED);
      this.positions[i * 3 + 1] = this.lerp(currentY, state.targetY, POSITION_LERP_SPEED);
      this.positions[i * 3 + 2] = this.lerp(currentZ, state.targetZ, POSITION_LERP_SPEED);

      const color = this.interpolateColor(density);
      const brightnessBoost = 0.8 + density * 0.004;
      this.colors[i * 3] = Math.min(1, color.r * brightnessBoost);
      this.colors[i * 3 + 1] = Math.min(1, color.g * brightnessBoost);
      this.colors[i * 3 + 2] = Math.min(1, color.b * brightnessBoost);
    }

    this.positionAttribute.needsUpdate = true;
    this.colorAttribute.needsUpdate = true;
  }

  getShapeFactors(): { yFactor: number; zFactor: number } {
    return {
      yFactor: this.currentYShapeFactor,
      zFactor: this.currentZShapeFactor
    };
  }

  dispose(): void {
    this.geometry.dispose();
    if (this.particles.material instanceof THREE.Material) {
      this.particles.material.dispose();
    }
    this.scene.remove(this.particles);
  }
}
