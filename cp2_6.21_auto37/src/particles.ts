import * as THREE from 'three';
import { WeatherMode, WEATHER_CONFIGS, ControlParams } from './types';
import { Terrain } from './terrain';

export class ParticleSystem {
  private scene: THREE.Scene;
  private terrain: Terrain;
  private points!: THREE.Points;
  private geometry!: THREE.BufferGeometry;
  private material!: THREE.PointsMaterial;
  private positions!: Float32Array;
  private velocities!: Float32Array;
  private colors!: Float32Array;
  private maxCount: number = 5000;
  private currentMode: WeatherMode = WeatherMode.SUNNY;
  private particleTexture: THREE.Texture;
  private lightningMesh?: THREE.Line;
  private lightningActive: boolean = false;
  private lightningTimer: number = 0;

  constructor(scene: THREE.Scene, terrain: Terrain) {
    this.scene = scene;
    this.terrain = terrain;
    this.particleTexture = this.createParticleTexture();
    this.initGeometry();
    this.initMaterial();
    this.switchWeather(WeatherMode.SUNNY);
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

  private initGeometry(): void {
    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.maxCount * 3);
    this.velocities = new Float32Array(this.maxCount * 3);
    this.colors = new Float32Array(this.maxCount * 3);

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
  }

  private initMaterial(): void {
    this.material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      map: this.particleTexture,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);
  }

  public switchWeather(mode: WeatherMode): void {
    this.currentMode = mode;
    const config = WEATHER_CONFIGS[mode];

    this.material.color.setHex(config.color);
    this.material.size = config.size;
    this.material.opacity = config.opacity;

    if (mode === WeatherMode.RAIN) {
      this.material.blending = THREE.NormalBlending;
    } else {
      this.material.blending = THREE.AdditiveBlending;
    }

    for (let i = 0; i < this.maxCount; i++) {
      if (i < config.count) {
        this.resetParticle(i, mode, true);
        this.colors[i * 3] = ((config.color >> 16) & 255) / 255;
        this.colors[i * 3 + 1] = ((config.color >> 8) & 255) / 255;
        this.colors[i * 3 + 2] = (config.color & 255) / 255;
      } else {
        this.positions[i * 3 + 1] = -1000;
      }
    }

    this.geometry.setDrawRange(0, config.count);
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;

    if (mode === WeatherMode.RAIN) {
      this.terrain.showWater(true);
    } else {
      this.terrain.showWater(false);
      this.hideLightning();
    }
  }

  private resetParticle(index: number, mode: WeatherMode, initial: boolean = false): void {
    const i = index * 3;
    const terrainSize = 10;

    switch (mode) {
      case WeatherMode.SUNNY:
        this.positions[i] = (Math.random() - 0.5) * terrainSize * 1.5;
        this.positions[i + 2] = (Math.random() - 0.5) * terrainSize * 1.5;
        const baseHeight = this.terrain.getHeightAt(this.positions[i], this.positions[i + 2]);
        this.positions[i + 1] = baseHeight + 1 + Math.random() * 4;
        this.velocities[i] = (Math.random() - 0.5) * 0.1;
        this.velocities[i + 1] = (Math.random() - 0.5) * 0.05;
        this.velocities[i + 2] = (Math.random() - 0.5) * 0.1;
        break;

      case WeatherMode.RAIN:
        this.positions[i] = (Math.random() - 0.5) * terrainSize * 1.8;
        this.positions[i + 1] = initial ? Math.random() * 15 : 15;
        this.positions[i + 2] = (Math.random() - 0.5) * terrainSize * 1.8;
        this.velocities[i] = 0;
        this.velocities[i + 1] = -2;
        this.velocities[i + 2] = 0;
        break;

      case WeatherMode.SNOW:
        this.positions[i] = (Math.random() - 0.5) * terrainSize * 1.8;
        this.positions[i + 1] = initial ? Math.random() * 12 : 12;
        this.positions[i + 2] = (Math.random() - 0.5) * terrainSize * 1.8;
        this.velocities[i] = (Math.random() - 0.5) * 0.3;
        this.velocities[i + 1] = -0.5 - Math.random() * 0.3;
        this.velocities[i + 2] = (Math.random() - 0.5) * 0.3;
        break;

      case WeatherMode.SANDSTORM:
        const angle = Math.random() * Math.PI * 2;
        const radius = 8 + Math.random() * 4;
        this.positions[i] = Math.cos(angle) * radius;
        this.positions[i + 1] = 0.5 + Math.random() * 3;
        this.positions[i + 2] = Math.sin(angle) * radius;
        this.velocities[i] = -Math.sin(angle) * 0.5;
        this.velocities[i + 1] = (Math.random() - 0.5) * 0.2;
        this.velocities[i + 2] = Math.cos(angle) * 0.5;
        break;
    }
  }

  private updateLightning(deltaTime: number): void {
    if (this.currentMode !== WeatherMode.RAIN) return;

    this.lightningTimer -= deltaTime;

    if (this.lightningTimer <= 0 && !this.lightningActive) {
      if (Math.random() < 0.02) {
        this.showLightning();
        this.lightningTimer = 0.2;
      } else {
        this.lightningTimer = 2 + Math.random() * 5;
      }
    }

    if (this.lightningActive && this.lightningTimer <= 0) {
      this.hideLightning();
    }
  }

  private showLightning(): void {
    const points: THREE.Vector3[] = [];
    const startX = (Math.random() - 0.5) * 15;
    const startZ = (Math.random() - 0.5) * 15;
    let currentY = 15;
    let currentX = startX;
    let currentZ = startZ;

    points.push(new THREE.Vector3(currentX, currentY, currentZ));

    for (let i = 0; i < 8; i++) {
      currentY -= 1.5 + Math.random() * 0.5;
      currentX += (Math.random() - 0.5) * 2;
      currentZ += (Math.random() - 0.5) * 2;
      points.push(new THREE.Vector3(currentX, currentY, currentZ));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ 
      color: 0xffffff, 
      linewidth: 3,
      transparent: true,
      opacity: 0.9
    });

    if (this.lightningMesh) {
      this.scene.remove(this.lightningMesh);
      this.lightningMesh.geometry.dispose();
      (this.lightningMesh.material as THREE.Material).dispose();
    }

    this.lightningMesh = new THREE.Line(geometry, material);
    this.scene.add(this.lightningMesh);
    this.lightningActive = true;
  }

  private hideLightning(): void {
    if (this.lightningMesh) {
      this.scene.remove(this.lightningMesh);
      this.lightningMesh.geometry.dispose();
      (this.lightningMesh.material as THREE.Material).dispose();
      this.lightningMesh = undefined;
    }
    this.lightningActive = false;
  }

  public updateParams(params: Partial<ControlParams>): void {
    if (params.particleDensity !== undefined) {
      const config = WEATHER_CONFIGS[this.currentMode];
      const newCount = Math.min(params.particleDensity, this.maxCount);
      this.geometry.setDrawRange(0, newCount);
      
      for (let i = 0; i < newCount; i++) {
        if (this.positions[i * 3 + 1] < -100) {
          this.resetParticle(i, this.currentMode, true);
          this.colors[i * 3] = ((config.color >> 16) & 255) / 255;
          this.colors[i * 3 + 1] = ((config.color >> 8) & 255) / 255;
          this.colors[i * 3 + 2] = (config.color & 255) / 255;
        }
      }
      this.geometry.attributes.position.needsUpdate = true;
      this.geometry.attributes.color.needsUpdate = true;
    }
  }

  public update(time: number, deltaTime: number, windStrength: number): void {
    const config = WEATHER_CONFIGS[this.currentMode];
    const count = Math.min(config.count, this.maxCount);
    const terrainSize = 10;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;

      const windX = windStrength * 0.1 * Math.sin(time * 0.5 + this.positions[idx] * 0.5);
      const windZ = windStrength * 0.1 * Math.cos(time * 0.5 + this.positions[idx + 2] * 0.5);

      this.positions[idx] += (this.velocities[idx] + windX) * deltaTime * 60;
      this.positions[idx + 1] += this.velocities[idx + 1] * deltaTime * 60;
      this.positions[idx + 2] += (this.velocities[idx + 2] + windZ) * deltaTime * 60;

      let shouldReset = false;

      switch (this.currentMode) {
        case WeatherMode.SUNNY:
          const centerDist = Math.sqrt(
            this.positions[idx] * this.positions[idx] + 
            this.positions[idx + 2] * this.positions[idx + 2]
          );
          if (centerDist > terrainSize * 1.2) shouldReset = true;
          if (this.positions[idx + 1] < -1 || this.positions[idx + 1] > 10) shouldReset = true;
          break;

        case WeatherMode.RAIN:
          if (this.positions[idx + 1] < 0.1) {
            shouldReset = true;
          }
          break;

        case WeatherMode.SNOW:
          if (this.positions[idx + 1] < 0.1) {
            shouldReset = true;
          }
          break;

        case WeatherMode.SANDSTORM:
          const distFromCenter = Math.sqrt(
            this.positions[idx] * this.positions[idx] + 
            this.positions[idx + 2] * this.positions[idx + 2]
          );
          if (distFromCenter > 15 || this.positions[idx + 1] < 0 || this.positions[idx + 1] > 8) {
            shouldReset = true;
          }
          break;
      }

      if (shouldReset) {
        this.resetParticle(i, this.currentMode, false);
      }
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.updateLightning(deltaTime);
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.particleTexture.dispose();
    this.hideLightning();
  }
}
