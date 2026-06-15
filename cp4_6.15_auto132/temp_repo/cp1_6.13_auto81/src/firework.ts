import {
  InstancedMesh,
  BufferGeometry,
  BufferAttribute,
  LineSegments,
  LineBasicMaterial,
  Vector3,
  Color,
  Object3D,
  SphereGeometry,
  MeshBasicMaterial
} from 'three';
import { CONFIG, PALETTES, LOW_FREQ_COLORS, HIGH_FREQ_COLORS } from './config';
import { ParticleData, globalParticlePool } from './particlePool';

export interface FireworkConfig {
  position: Vector3;
  palette: keyof typeof PALETTES;
  frequencyBand?: 'low' | 'mid' | 'high';
}

export class Firework {
  private particles: ParticleData[] = [];
  private instancedMesh: InstancedMesh;
  private trailGeometry: BufferGeometry;
  private trailLines: LineSegments;
  private trailPositions: Float32Array;
  private trailColors: Float32Array;
  private dummy: Object3D = new Object3D();
  private isActive: boolean = true;
  private age: number = 0;
  private maxAge: number = CONFIG.FIREWORK_DURATION;
  private particleCount: number;
  
  constructor(config: FireworkConfig) {
    this.particleCount = CONFIG.PARTICLE_COUNT_PER_FIREWORK;
    
    const geometry = new SphereGeometry(0.5, 8, 6);
    const material = new MeshBasicMaterial({
      vertexColors: false,
      transparent: true,
      opacity: 1
    });
    
    this.instancedMesh = new InstancedMesh(
      geometry,
      material,
      this.particleCount
    );
    this.instancedMesh.frustumCulled = false;
    
    const totalTrailVertices = this.particleCount * CONFIG.TRAIL_LENGTH * 2;
    this.trailPositions = new Float32Array(totalTrailVertices * 3);
    this.trailColors = new Float32Array(totalTrailVertices * 4);
    
    this.trailGeometry = new BufferGeometry();
    this.trailGeometry.setAttribute('position', new BufferAttribute(this.trailPositions, 3));
    this.trailGeometry.setAttribute('color', new BufferAttribute(this.trailColors, 4));
    this.trailGeometry.setDrawRange(0, 0);
    
    const trailMaterial = new LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.8
    });
    
    this.trailLines = new LineSegments(this.trailGeometry, trailMaterial);
    this.trailLines.frustumCulled = false;
    
    this.initParticles(config);
  }
  
  private initParticles(config: FireworkConfig): void {
    const colors = PALETTES[config.palette];
    const isLowFreq = config.frequencyBand === 'low';
    const isHighFreq = config.frequencyBand === 'high';
    
    for (let i = 0; i < this.particleCount; i++) {
      const particle = globalParticlePool.acquire();
      if (!particle) continue;
      
      particle.position.copy(config.position);
      
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = CONFIG.PARTICLE_SPEED_MIN + Math.random() * (CONFIG.PARTICLE_SPEED_MAX - CONFIG.PARTICLE_SPEED_MIN);
      
      particle.velocity.set(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.sin(phi) * Math.sin(theta) * speed,
        Math.cos(phi) * speed
      );
      
      let color: Color;
      if (isLowFreq) {
        const lowColor = LOW_FREQ_COLORS[Math.floor(Math.random() * LOW_FREQ_COLORS.length)];
        color = new Color(lowColor);
        particle.size = CONFIG.LOW_FREQ_SIZE_MIN + Math.random() * (CONFIG.LOW_FREQ_SIZE_MAX - CONFIG.LOW_FREQ_SIZE_MIN);
      } else if (isHighFreq) {
        const highColor = HIGH_FREQ_COLORS[Math.floor(Math.random() * HIGH_FREQ_COLORS.length)];
        color = new Color(highColor);
        particle.size = CONFIG.HIGH_FREQ_SIZE_MIN + Math.random() * (CONFIG.HIGH_FREQ_SIZE_MAX - CONFIG.HIGH_FREQ_SIZE_MIN);
      } else {
        const paletteColor = colors[Math.floor(Math.random() * colors.length)];
        color = new Color(paletteColor);
        particle.size = CONFIG.PARTICLE_SIZE_MIN + Math.random() * (CONFIG.PARTICLE_SIZE_MAX - CONFIG.PARTICLE_SIZE_MIN);
      }
      
      particle.color.copy(color);
      particle.age = 0;
      particle.maxAge = CONFIG.FIREWORK_DURATION;
      particle.rotation = Math.random() * Math.PI * 2;
      particle.rotationSpeed = (Math.random() - 0.5) * 0.1;
      
      for (let j = 0; j < CONFIG.TRAIL_LENGTH; j++) {
        particle.trailPositions[j].copy(config.position);
      }
      
      this.particles.push(particle);
    }
  }
  
  update(deltaTime: number): boolean {
    if (!this.isActive) return false;
    
    this.age += deltaTime;
    
    if (this.age >= this.maxAge) {
      this.dispose();
      return false;
    }
    
    let activeParticleCount = 0;
    
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      
      if (!particle.active) continue;
      
      particle.age += deltaTime;
      
      if (particle.age >= particle.maxAge) {
        globalParticlePool.release(particle);
        continue;
      }
      
      for (let j = CONFIG.TRAIL_LENGTH - 1; j > 0; j--) {
        particle.trailPositions[j].copy(particle.trailPositions[j - 1]);
      }
      particle.trailPositions[0].copy(particle.position);
      
      particle.position.add(
        particle.velocity.clone().multiplyScalar(deltaTime)
      );
      
      particle.velocity.multiplyScalar(0.98);
      particle.velocity.y -= 0.5 * deltaTime;
      
      particle.rotation += particle.rotationSpeed;
      
      activeParticleCount++;
    }
    
    this.updateInstancedMesh();
    this.updateTrails();
    
    return activeParticleCount > 0;
  }
  
  private updateInstancedMesh(): void {
    let visibleIndex = 0;
    
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      
      if (!particle.active) continue;
      
      const fadeProgress = Math.max(0, Math.min(1, 
        (particle.age - CONFIG.PARTICLE_FADE_START) / (particle.maxAge - CONFIG.PARTICLE_FADE_START)
      ));
      
      const opacity = 1 - fadeProgress;
      const scale = particle.size * (1 - fadeProgress * 0.5);
      
      this.dummy.position.copy(particle.position);
      this.dummy.rotation.z = particle.rotation;
      this.dummy.scale.setScalar(scale);
      this.dummy.updateMatrix();
      
      this.instancedMesh.setMatrixAt(visibleIndex, this.dummy.matrix);
      
      const color = particle.color.clone();
      color.multiplyScalar(opacity);
      this.instancedMesh.setColorAt(visibleIndex, color);
      
      visibleIndex++;
    }
    
    this.instancedMesh.count = visibleIndex;
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }
  }
  
  private updateTrails(): void {
    let vertexIndex = 0;
    let colorIndex = 0;
    let lineCount = 0;
    
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      
      if (!particle.active) continue;
      
      const fadeProgress = Math.max(0, Math.min(1,
        (particle.age - CONFIG.PARTICLE_FADE_START) / (particle.maxAge - CONFIG.PARTICLE_FADE_START)
      ));
      
      for (let j = 0; j < CONFIG.TRAIL_LENGTH - 1; j++) {
        const start = particle.trailPositions[j];
        const end = particle.trailPositions[j + 1];
        
        const segmentAlpha = (1 - j / CONFIG.TRAIL_LENGTH) * 0.8 * (1 - fadeProgress);
        
        this.trailPositions[vertexIndex++] = start.x;
        this.trailPositions[vertexIndex++] = start.y;
        this.trailPositions[vertexIndex++] = start.z;
        
        this.trailPositions[vertexIndex++] = end.x;
        this.trailPositions[vertexIndex++] = end.y;
        this.trailPositions[vertexIndex++] = end.z;
        
        const startAlpha = segmentAlpha;
        const endAlpha = segmentAlpha * 0.5;
        
        this.trailColors[colorIndex++] = particle.color.r;
        this.trailColors[colorIndex++] = particle.color.g;
        this.trailColors[colorIndex++] = particle.color.b;
        this.trailColors[colorIndex++] = startAlpha;
        
        this.trailColors[colorIndex++] = particle.color.r;
        this.trailColors[colorIndex++] = particle.color.g;
        this.trailColors[colorIndex++] = particle.color.b;
        this.trailColors[colorIndex++] = endAlpha;
        
        lineCount += 2;
      }
    }
    
    const positionAttr = this.trailGeometry.attributes.position as BufferAttribute;
    const colorAttr = this.trailGeometry.attributes.color as BufferAttribute;
    
    positionAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
    this.trailGeometry.setDrawRange(0, lineCount);
    
    this.trailGeometry.computeBoundingSphere();
  }
  
  getMesh(): Object3D {
    const group = new Object3D();
    group.add(this.instancedMesh);
    group.add(this.trailLines);
    return group;
  }
  
  getInstancedMesh(): InstancedMesh {
    return this.instancedMesh;
  }
  
  getTrailLines(): LineSegments {
    return this.trailLines;
  }
  
  dispose(): void {
    this.isActive = false;
    
    for (const particle of this.particles) {
      if (particle.active) {
        globalParticlePool.release(particle);
      }
    }
    this.particles = [];
    
    this.instancedMesh.geometry.dispose();
    (this.instancedMesh.material as MeshBasicMaterial).dispose();
    this.instancedMesh.dispose();
    
    this.trailGeometry.dispose();
    (this.trailLines.material as LineBasicMaterial).dispose();
  }
  
  isAlive(): boolean {
    return this.isActive && this.age < this.maxAge;
  }
}