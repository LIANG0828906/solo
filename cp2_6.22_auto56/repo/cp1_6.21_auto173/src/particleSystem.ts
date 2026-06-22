import * as THREE from 'three';

export interface ParticleSystemParams {
  particleCount: number;
  stormIntensity: number;
  windDirection: number;
  primaryColor: string;
}

export class ParticleSystem {
  private scene: THREE.Scene;
  private particleCount: number;
  private particles: THREE.Points;
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  
  private positions: Float32Array;
  private velocities: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;
  private turbulenceOffsets: Float32Array;
  
  private targetStormIntensity: number;
  private currentStormIntensity: number;
  private targetWindDirection: number;
  private currentWindDirection: number;
  private targetPrimaryColor: THREE.Color;
  private currentPrimaryColor: THREE.Color;
  
  private bounds = {
    xMin: -25,
    xMax: 25,
    zMin: -20,
    zMax: 20,
    yMin: 0,
    yMax: 30
  };
  
  private buoyancy = 0.02;
  private gravity = 0.01;
  private turbulenceScale = 0.5;
  
  private obstacles: THREE.Mesh[] = [];
  private time = 0;

  constructor(scene: THREE.Scene, params: ParticleSystemParams) {
    this.scene = scene;
    this.particleCount = params.particleCount;
    
    this.targetStormIntensity = params.stormIntensity;
    this.currentStormIntensity = params.stormIntensity;
    this.targetWindDirection = params.windDirection;
    this.currentWindDirection = params.windDirection;
    this.targetPrimaryColor = new THREE.Color(params.primaryColor);
    this.currentPrimaryColor = new THREE.Color(params.primaryColor);
    
    this.positions = new Float32Array(this.particleCount * 3);
    this.velocities = new Float32Array(this.particleCount * 3);
    this.colors = new Float32Array(this.particleCount * 3);
    this.sizes = new Float32Array(this.particleCount);
    this.turbulenceOffsets = new Float32Array(this.particleCount * 3);
    
    this.geometry = new THREE.BufferGeometry();
    this.material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    this.particles = new THREE.Points(this.geometry, this.material);
    
    this.initializeParticles();
    this.setupGeometry();
    this.scene.add(this.particles);
  }

  private initializeParticles(): void {
    const width = this.bounds.xMax - this.bounds.xMin;
    const depth = this.bounds.zMax - this.bounds.zMin;
    const height = this.bounds.yMax - this.bounds.yMin;
    
    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      
      this.positions[i3] = this.bounds.xMin + Math.random() * width;
      this.positions[i3 + 1] = this.bounds.yMin + Math.random() * height;
      this.positions[i3 + 2] = this.bounds.zMin + Math.random() * depth;
      
      this.velocities[i3] = (Math.random() - 0.5) * 0.1;
      this.velocities[i3 + 1] = (Math.random() - 0.5) * 0.05;
      this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.1;
      
      const t = Math.random();
      const baseColor = this.currentPrimaryColor.clone();
      const darkColor = baseColor.clone().multiplyScalar(0.7);
      const color = baseColor.clone().lerp(darkColor, t);
      this.colors[i3] = color.r;
      this.colors[i3 + 1] = color.g;
      this.colors[i3 + 2] = color.b;
      
      this.sizes[i] = 0.05 + Math.random() * 0.1;
      
      this.turbulenceOffsets[i3] = Math.random() * 1000;
      this.turbulenceOffsets[i3 + 1] = Math.random() * 1000;
      this.turbulenceOffsets[i3 + 2] = Math.random() * 1000;
    }
  }

  private setupGeometry(): void {
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
  }

  public setObstacles(obstacles: THREE.Mesh[]): void {
    this.obstacles = obstacles;
  }

  public setStormIntensity(value: number): void {
    this.targetStormIntensity = value;
  }

  public setWindDirection(degrees: number): void {
    this.targetWindDirection = degrees;
  }

  public setPrimaryColor(hex: string): void {
    this.targetPrimaryColor = new THREE.Color(hex);
  }

  public getParticleCount(): number {
    return this.particleCount;
  }

  public update(deltaTime: number): void {
    this.time += deltaTime;
    
    this.currentStormIntensity += (this.targetStormIntensity - this.currentStormIntensity) * deltaTime * 3;
    
    const windDiff = this.targetWindDirection - this.currentWindDirection;
    if (Math.abs(windDiff) > 180) {
      this.currentWindDirection += windDiff > 0 ? 360 : -360;
    }
    this.currentWindDirection += (this.targetWindDirection - this.currentWindDirection) * deltaTime * 3;
    
    this.currentPrimaryColor.lerp(this.targetPrimaryColor, deltaTime * 3);
    
    const windRad = (this.currentWindDirection * Math.PI) / 180;
    const windX = Math.sin(windRad) * this.currentStormIntensity * 0.5;
    const windZ = Math.cos(windRad) * this.currentStormIntensity * 0.5;
    
    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      
      const turbX = Math.sin(this.time * 2 + this.turbulenceOffsets[i3]) * this.turbulenceScale * this.currentStormIntensity;
      const turbZ = Math.cos(this.time * 1.5 + this.turbulenceOffsets[i3 + 2]) * this.turbulenceScale * this.currentStormIntensity;
      const turbY = Math.sin(this.time * 3 + this.turbulenceOffsets[i3 + 1]) * this.turbulenceScale * 0.3 * this.currentStormIntensity;
      
      this.velocities[i3] += (windX + turbX - this.velocities[i3] * 0.5) * deltaTime;
      this.velocities[i3 + 2] += (windZ + turbZ - this.velocities[i3 + 2] * 0.5) * deltaTime;
      
      const buoyancyForce = this.buoyancy * this.currentStormIntensity;
      const gravityForce = this.gravity;
      this.velocities[i3 + 1] += (buoyancyForce - gravityForce + turbY) * deltaTime;
      
      this.positions[i3] += this.velocities[i3] * deltaTime * 10;
      this.positions[i3 + 1] += this.velocities[i3 + 1] * deltaTime * 10;
      this.positions[i3 + 2] += this.velocities[i3 + 2] * deltaTime * 10;
      
      this.handleBoundary(i3);
      this.checkObstacleCollision(i3);
    }
    
    this.updateColors();
    
    (this.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
  }

  private handleBoundary(i3: number): void {
    const width = this.bounds.xMax - this.bounds.xMin;
    const depth = this.bounds.zMax - this.bounds.zMin;
    const height = this.bounds.yMax - this.bounds.yMin;
    
    if (this.positions[i3] > this.bounds.xMax) {
      this.positions[i3] -= width;
    } else if (this.positions[i3] < this.bounds.xMin) {
      this.positions[i3] += width;
    }
    
    if (this.positions[i3 + 2] > this.bounds.zMax) {
      this.positions[i3 + 2] -= depth;
    } else if (this.positions[i3 + 2] < this.bounds.zMin) {
      this.positions[i3 + 2] += depth;
    }
    
    if (this.positions[i3 + 1] > this.bounds.yMax) {
      this.positions[i3 + 1] -= height;
    } else if (this.positions[i3 + 1] < this.bounds.yMin) {
      this.positions[i3 + 1] += height;
    }
  }

  private checkObstacleCollision(i3: number): void {
    for (const obstacle of this.obstacles) {
      const box = new THREE.Box3().setFromObject(obstacle);
      
      if (
        this.positions[i3] >= box.min.x && this.positions[i3] <= box.max.x &&
        this.positions[i3 + 1] >= box.min.y && this.positions[i3 + 1] <= box.max.y &&
        this.positions[i3 + 2] >= box.min.z && this.positions[i3 + 2] <= box.max.z
      ) {
        const centerX = (box.min.x + box.max.x) / 2;
        const centerZ = (box.min.z + box.max.z) / 2;
        
        const dx = this.positions[i3] - centerX;
        const dz = this.positions[i3 + 2] - centerZ;
        
        if (Math.abs(dx) > Math.abs(dz)) {
          this.velocities[i3] *= -0.5;
          this.positions[i3] = dx > 0 ? box.max.x + 0.1 : box.min.x - 0.1;
        } else {
          this.velocities[i3 + 2] *= -0.5;
          this.positions[i3 + 2] = dz > 0 ? box.max.z + 0.1 : box.min.z - 0.1;
        }
        break;
      }
    }
  }

  private updateColors(): void {
    const baseColor = this.currentPrimaryColor;
    const darkColor = baseColor.clone().multiplyScalar(0.7);
    
    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      const t = (this.sizes[i] - 0.05) / 0.1;
      
      this.colors[i3] = baseColor.r + (darkColor.r - baseColor.r) * t;
      this.colors[i3 + 1] = baseColor.g + (darkColor.g - baseColor.g) * t;
      this.colors[i3 + 2] = baseColor.b + (darkColor.b - baseColor.b) * t;
    }
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.scene.remove(this.particles);
  }
}
