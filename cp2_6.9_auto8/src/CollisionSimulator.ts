import * as THREE from 'three';
import { Galaxy, GalaxyParams } from './Galaxy';

export interface SimulatorParams {
  G: number;
  simulationSpeed: number;
  particleSize: number;
  showTrails: boolean;
}

export interface SimulatorState {
  particleCount: number;
  fps: number;
  stage: 'idle' | 'approaching' | 'colliding' | 'merging' | 'merged';
  simulationTime: number;
  isLocked: boolean;
}

interface TidalTailParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  age: number;
  maxAge: number;
  opacity: number;
}

export class CollisionSimulator {
  public galaxy1: Galaxy;
  public galaxy2: Galaxy;
  public isRunning: boolean = false;
  
  private scene: THREE.Scene;
  private params: SimulatorParams;
  private stage: 'idle' | 'approaching' | 'colliding' | 'merging' | 'merged' = 'idle';
  private simulationTime: number = 0;
  private isLocked: boolean = false;
  
  private tidalTailParticles: TidalTailParticle[] = [];
  private tidalTailGeometry: THREE.BufferGeometry | null = null;
  private tidalTailPoints: THREE.Points | null = null;
  private maxTidalTailParticles: number = 2000;
  private tidalTailPositions: Float32Array;
  private tidalTailColors: Float32Array;
  
  private spatialHashGridSize: number = 0.5;
  private frameCount: number = 0;
  private lastFpsUpdate: number = 0;
  private currentFps: number = 60;
  
  private particleTexture: THREE.Texture;
  private backgroundStars: THREE.Points | null = null;
  
  private initialGalaxy1Pos: THREE.Vector3 = new THREE.Vector3(-5, 0, 0);
  private initialGalaxy2Pos: THREE.Vector3 = new THREE.Vector3(5, 0, 0);
  private initialGalaxy1Vel: THREE.Vector3 = new THREE.Vector3(1, 0, 0.5);
  private initialGalaxy2Vel: THREE.Vector3 = new THREE.Vector3(-1, 0, -0.5);

  constructor(scene: THREE.Scene, params: SimulatorParams) {
    this.scene = scene;
    this.params = { ...params };
    
    this.tidalTailPositions = new Float32Array(this.maxTidalTailParticles * 3);
    this.tidalTailColors = new Float32Array(this.maxTidalTailParticles * 4);
    
    this.particleTexture = this.createParticleTexture();
    
    const galaxyParams1: GalaxyParams = {
      particleCount: 5000,
      coreParticleCount: 500,
      radius: 2.5,
      thickness: 0.4,
      armCount: 2,
      pitch: 1.2,
      armDensityRatio: 3,
      angularVelocity: 0.02,
      particleSize: params.particleSize,
      mass: 5
    };
    
    const galaxyParams2: GalaxyParams = {
      ...galaxyParams1,
      mass: 3
    };
    
    this.galaxy1 = new Galaxy(scene, galaxyParams1);
    this.galaxy2 = new Galaxy(scene, galaxyParams2);
    
    this.galaxy1.position.copy(this.initialGalaxy1Pos);
    this.galaxy2.position.copy(this.initialGalaxy2Pos);
    this.galaxy1.velocity.copy(this.initialGalaxy1Vel);
    this.galaxy2.velocity.copy(this.initialGalaxy2Vel);
    
    this.createTidalTailSystem();
    this.createBackgroundStars();
    this.checkLock();
  }

  private createParticleTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  private createTidalTailSystem(): void {
    this.tidalTailGeometry = new THREE.BufferGeometry();
    this.tidalTailGeometry.setAttribute('position', new THREE.BufferAttribute(this.tidalTailPositions, 3));
    this.tidalTailGeometry.setAttribute('color', new THREE.BufferAttribute(this.tidalTailColors, 4));
    
    const material = new THREE.PointsMaterial({
      size: this.params.particleSize * 0.8,
      vertexColors: true,
      map: this.particleTexture,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });
    
    this.tidalTailPoints = new THREE.Points(this.tidalTailGeometry, material);
    this.scene.add(this.tidalTailPoints);
  }

  private createBackgroundStars(): void {
    const starCount = 1000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount; i++) {
      const radius = 50 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      
      const brightness = 0.3 + Math.random() * 0.7;
      colors[i * 3] = brightness;
      colors[i * 3 + 1] = brightness;
      colors[i * 3 + 2] = brightness;
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true
    });
    
    this.backgroundStars = new THREE.Points(geometry, material);
    this.scene.add(this.backgroundStars);
  }

  private animateBackgroundStars(delta: number): void {
    if (!this.backgroundStars) return;
    
    const positions = this.backgroundStars.geometry.attributes.position.array as Float32Array;
    const colors = this.backgroundStars.geometry.attributes.color.array as Float32Array;
    
    for (let i = 0; i < positions.length / 3; i++) {
      const idx = i * 3;
      const brightness = 0.3 + Math.sin(Date.now() * 0.001 + i) * 0.35 + 0.35;
      colors[idx] = brightness;
      colors[idx + 1] = brightness;
      colors[idx + 2] = brightness;
    }
    
    this.backgroundStars.geometry.attributes.color.needsUpdate = true;
  }

  public setGalaxy1Position(pos: THREE.Vector3): void {
    if (this.isRunning) return;
    pos.x = THREE.MathUtils.clamp(pos.x, -10, 10);
    pos.y = THREE.MathUtils.clamp(pos.y, -10, 10);
    pos.z = THREE.MathUtils.clamp(pos.z, -10, 10);
    this.galaxy1.position.copy(pos);
    this.checkLock();
  }

  public setGalaxy2Position(pos: THREE.Vector3): void {
    if (this.isRunning) return;
    pos.x = THREE.MathUtils.clamp(pos.x, -10, 10);
    pos.y = THREE.MathUtils.clamp(pos.y, -10, 10);
    pos.z = THREE.MathUtils.clamp(pos.z, -10, 10);
    this.galaxy2.position.copy(pos);
    this.checkLock();
  }

  public setGalaxy1Velocity(vel: THREE.Vector3): void {
    if (this.isRunning) return;
    const speed = vel.length();
    if (speed > 5) {
      vel.normalize().multiplyScalar(5);
    }
    this.galaxy1.velocity.copy(vel);
  }

  public setGalaxy2Velocity(vel: THREE.Vector3): void {
    if (this.isRunning) return;
    const speed = vel.length();
    if (speed > 5) {
      vel.normalize().multiplyScalar(5);
    }
    this.galaxy2.velocity.copy(vel);
  }

  public setGalaxy1Mass(mass: number): void {
    this.galaxy1.setMass(mass);
  }

  public setGalaxy2Mass(mass: number): void {
    this.galaxy2.setMass(mass);
  }

  public setG(value: number): void {
    this.params.G = value;
  }

  public setSimulationSpeed(speed: number): void {
    this.params.simulationSpeed = speed;
  }

  public setParticleSize(size: number): void {
    this.params.particleSize = size;
    this.galaxy1.setParticleSize(size);
    this.galaxy2.setParticleSize(size);
    if (this.tidalTailPoints) {
      (this.tidalTailPoints.material as THREE.PointsMaterial).size = size * 0.8;
    }
  }

  public setShowTrails(enabled: boolean): void {
    this.params.showTrails = enabled;
    this.galaxy1.showTrails(enabled);
    this.galaxy2.showTrails(enabled);
  }

  public checkLock(): boolean {
    const distance = this.galaxy1.position.distanceTo(this.galaxy2.position);
    this.isLocked = distance < 1.5;
    return this.isLocked;
  }

  public start(): void {
    if (!this.isLocked) {
      console.warn('需要先将两个星系移动到引力锁定范围内（距离<1.5）');
      return;
    }
    this.isRunning = true;
    this.stage = 'approaching';
    this.simulationTime = 0;
  }

  public stop(): void {
    this.isRunning = false;
  }

  public reset(): void {
    this.isRunning = false;
    this.stage = 'idle';
    this.simulationTime = 0;
    this.tidalTailParticles = [];
    
    this.galaxy1.reset();
    this.galaxy2.reset();
    
    this.galaxy1.position.copy(this.initialGalaxy1Pos);
    this.galaxy2.position.copy(this.initialGalaxy2Pos);
    this.galaxy1.velocity.copy(this.initialGalaxy1Vel);
    this.galaxy2.velocity.copy(this.initialGalaxy2Vel);
    
    this.clearTidalTailGeometry();
    this.checkLock();
  }

  private clearTidalTailGeometry(): void {
    this.tidalTailPositions.fill(0);
    this.tidalTailColors.fill(0);
    if (this.tidalTailGeometry) {
      this.tidalTailGeometry.attributes.position.needsUpdate = true;
      this.tidalTailGeometry.attributes.color.needsUpdate = true;
    }
  }

  public update(delta: number): SimulatorState {
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsUpdate >= 500) {
      this.currentFps = Math.round(this.frameCount * 1000 / (now - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }
    
    this.animateBackgroundStars(delta);
    
    if (this.isRunning) {
      this.simulationTime += delta * this.params.simulationSpeed;
      
      this.computeGravity();
      this.updateStage();
      this.detectTidalTails();
      this.updateTidalTails(delta);
      
      if (this.stage === 'merging' || this.stage === 'merged') {
        this.galaxy1.startMerging();
        this.galaxy2.startMerging();
      }
      
      this.galaxy1.update(delta, this.getGravityForce(this.galaxy1, this.galaxy2), this.params.simulationSpeed);
      this.galaxy2.update(delta, this.getGravityForce(this.galaxy2, this.galaxy1), this.params.simulationSpeed);
    } else {
      this.galaxy1.update(delta, undefined, this.params.simulationSpeed);
      this.galaxy2.update(delta, undefined, this.params.simulationSpeed);
    }
    
    this.updateTidalTailGeometry();
    
    const totalParticles = this.galaxy1.getParticleCount() + 
                          this.galaxy2.getParticleCount() + 
                          this.tidalTailParticles.length;
    
    return {
      particleCount: totalParticles,
      fps: this.currentFps,
      stage: this.stage,
      simulationTime: this.simulationTime,
      isLocked: this.isLocked
    };
  }

  private getGravityForce(target: Galaxy, source: Galaxy): THREE.Vector3 {
    const direction = new THREE.Vector3()
      .subVectors(source.position, target.position);
    const distance = direction.length();
    
    if (distance < 0.1) return new THREE.Vector3();
    
    const forceMagnitude = this.params.G * target.mass * source.mass / (distance * distance);
    return direction.normalize().multiplyScalar(forceMagnitude);
  }

  private computeGravity(): void {
    const hash = this.buildSpatialHash();
    
    const force1to2 = this.getGravityForce(this.galaxy2, this.galaxy1);
    const force2to1 = this.getGravityForce(this.galaxy1, this.galaxy2);
    
    this.galaxy1.applyGravity(force2to1, 0.01);
    this.galaxy2.applyGravity(force1to2, 0.01);
    
    this.applyNearbyParticleGravity(hash, this.galaxy1, this.galaxy2);
    this.applyNearbyParticleGravity(hash, this.galaxy2, this.galaxy1);
  }

  private buildSpatialHash(): Map<string, { galaxy: number; index: number }[]> {
    const hash = new Map<string, { galaxy: number; index: number }[]>();
    const cellSize = this.spatialHashGridSize;
    
    const addParticle = (galaxyNum: number, pos: THREE.Vector3, index: number) => {
      const key = `${Math.floor(pos.x / cellSize)},${Math.floor(pos.y / cellSize)},${Math.floor(pos.z / cellSize)}`;
      if (!hash.has(key)) {
        hash.set(key, []);
      }
      hash.get(key)!.push({ galaxy: galaxyNum, index });
    };
    
    for (let i = 0; i < 5000; i += 10) {
      addParticle(1, this.galaxy1.getParticleWorldPosition(i), i);
    }
    
    for (let i = 0; i < 5000; i += 10) {
      addParticle(2, this.galaxy2.getParticleWorldPosition(i), i);
    }
    
    return hash;
  }

  private applyNearbyParticleGravity(
    hash: Map<string, { galaxy: number; index: number }[]>,
    targetGalaxy: Galaxy,
    sourceGalaxy: Galaxy
  ): void {
    const cellSize = this.spatialHashGridSize;
    const targetNum = targetGalaxy === this.galaxy1 ? 1 : 2;
    const sourceNum = sourceGalaxy === this.galaxy1 ? 1 : 2;
    
    for (let i = 0; i < 5000; i += 5) {
      const pos = targetGalaxy.getParticleWorldPosition(i);
      const keys: string[] = [];
      
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dz = -1; dz <= 1; dz++) {
            keys.push(`${Math.floor(pos.x / cellSize) + dx},${Math.floor(pos.y / cellSize) + dy},${Math.floor(pos.z / cellSize) + dz}`);
          }
        }
      }
      
      for (const key of keys) {
        const particles = hash.get(key);
        if (!particles) continue;
        
        for (const p of particles) {
          if (p.galaxy === targetNum) continue;
          
          const sourcePos = sourceGalaxy.getParticleWorldPosition(p.index);
          const dir = new THREE.Vector3().subVectors(sourcePos, pos);
          const dist = dir.length();
          
          if (dist < 1.0 && dist > 0.01) {
            const force = this.params.G * 0.001 / (dist * dist);
            const velIdx = i * 3;
            
            targetGalaxy.velocities[velIdx] += dir.x * force / targetGalaxy.mass;
            targetGalaxy.velocities[velIdx + 1] += dir.y * force / targetGalaxy.mass;
            targetGalaxy.velocities[velIdx + 2] += dir.z * force / targetGalaxy.mass;
          }
        }
      }
    }
  }

  private updateStage(): void {
    const distance = this.galaxy1.position.distanceTo(this.galaxy2.position);
    
    if (this.stage === 'approaching' && distance < 3) {
      this.stage = 'colliding';
    }
    
    if (this.stage === 'colliding' && this.simulationTime > 3 && distance < 2) {
      this.stage = 'merging';
    }
    
    if (this.stage === 'merging' && this.simulationTime > 5) {
      this.stage = 'merged';
      this.isRunning = false;
    }
  }

  private detectTidalTails(): void {
    if (this.tidalTailParticles.length >= this.maxTidalTailParticles) return;
    
    const checkGalaxy = (galaxy: Galaxy, otherGalaxy: Galaxy, edgeColor: THREE.Color) => {
      for (let i = 0; i < 5000; i += 3) {
        if (this.tidalTailParticles.length >= this.maxTidalTailParticles) break;
        
        const pos = galaxy.getParticleWorldPosition(i);
        const vel = galaxy.getParticleVelocity(i);
        const distToOther = pos.distanceTo(otherGalaxy.position);
        
        if (distToOther < 1.2 && vel.length() > 2) {
          const localPos = new THREE.Vector3(
            galaxy.positions[i * 3],
            galaxy.positions[i * 3 + 1],
            galaxy.positions[i * 3 + 2]
          );
          const distFromCenter = localPos.length();
          
          if (distFromCenter > 1.5) {
            const tailColor = edgeColor.clone();
            tailColor.lerp(new THREE.Color(0xaa66ff), 0.5);
            
            this.createTidalTailParticle(
              pos.clone(),
              vel.clone().multiplyScalar(1.2),
              tailColor
            );
          }
        }
      }
    };
    
    const edgeColor1 = new THREE.Color(0x4466ff);
    const edgeColor2 = new THREE.Color(0x4466ff);
    
    checkGalaxy(this.galaxy1, this.galaxy2, edgeColor1);
    checkGalaxy(this.galaxy2, this.galaxy1, edgeColor2);
  }

  private createTidalTailParticle(position: THREE.Vector3, velocity: THREE.Vector3, color: THREE.Color): void {
    if (this.tidalTailParticles.length >= this.maxTidalTailParticles) return;
    
    this.tidalTailParticles.push({
      position,
      velocity,
      color: color.clone(),
      age: 0,
      maxAge: 0.5,
      opacity: 0
    });
  }

  private updateTidalTails(delta: number): void {
    const effectiveDelta = delta * this.params.simulationSpeed;
    
    for (let i = this.tidalTailParticles.length - 1; i >= 0; i--) {
      const p = this.tidalTailParticles[i];
      p.age += effectiveDelta;
      
      const fadeIn = Math.min(1, p.age / 0.1);
      const fadeOut = Math.max(0, 1 - (p.age - (p.maxAge - 0.1)) / 0.1);
      p.opacity = fadeIn * fadeOut * 0.8;
      
      p.position.x += p.velocity.x * effectiveDelta;
      p.position.y += p.velocity.y * effectiveDelta;
      p.position.z += p.velocity.z * effectiveDelta;
      
      p.velocity.multiplyScalar(0.99);
      
      const center = new THREE.Vector3()
        .addVectors(this.galaxy1.position, this.galaxy2.position)
        .multiplyScalar(0.5);
      
      const toCenter = new THREE.Vector3().subVectors(center, p.position);
      const dist = toCenter.length();
      if (dist > 0) {
        p.velocity.add(toCenter.normalize().multiplyScalar(0.01));
      }
      
      if (p.age >= p.maxAge) {
        this.tidalTailParticles.splice(i, 1);
      }
    }
  }

  private updateTidalTailGeometry(): void {
    this.tidalTailPositions.fill(0);
    this.tidalTailColors.fill(0);
    
    for (let i = 0; i < this.tidalTailParticles.length; i++) {
      const p = this.tidalTailParticles[i];
      const idx = i * 3;
      const idx4 = i * 4;
      
      this.tidalTailPositions[idx] = p.position.x;
      this.tidalTailPositions[idx + 1] = p.position.y;
      this.tidalTailPositions[idx + 2] = p.position.z;
      
      this.tidalTailColors[idx4] = p.color.r;
      this.tidalTailColors[idx4 + 1] = p.color.g;
      this.tidalTailColors[idx4 + 2] = p.color.b;
      this.tidalTailColors[idx4 + 3] = p.opacity;
    }
    
    if (this.tidalTailGeometry) {
      this.tidalTailGeometry.attributes.position.needsUpdate = true;
      this.tidalTailGeometry.attributes.color.needsUpdate = true;
      this.tidalTailGeometry.setDrawRange(0, this.tidalTailParticles.length);
    }
  }

  public getState(): SimulatorState {
    const totalParticles = this.galaxy1.getParticleCount() + 
                          this.galaxy2.getParticleCount() + 
                          this.tidalTailParticles.length;
    
    return {
      particleCount: totalParticles,
      fps: this.currentFps,
      stage: this.stage,
      simulationTime: this.simulationTime,
      isLocked: this.isLocked
    };
  }

  public dispose(): void {
    this.galaxy1.dispose();
    this.galaxy2.dispose();
    
    if (this.tidalTailPoints) {
      this.scene.remove(this.tidalTailPoints);
      this.tidalTailGeometry?.dispose();
      (this.tidalTailPoints.material as THREE.Material).dispose();
    }
    
    if (this.backgroundStars) {
      this.scene.remove(this.backgroundStars);
      this.backgroundStars.geometry.dispose();
      (this.backgroundStars.material as THREE.Material).dispose();
    }
    
    this.particleTexture.dispose();
  }
}
