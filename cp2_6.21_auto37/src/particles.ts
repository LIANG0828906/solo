import * as THREE from 'three';
import { WeatherMode, WEATHER_CONFIGS, ControlParams } from './types';
import { Terrain } from './terrain';

interface ParticleLayer {
  points: THREE.Points;
  geometry: THREE.BufferGeometry;
  material: THREE.PointsMaterial;
  positions: Float32Array;
  velocities: Float32Array;
  colors: Float32Array;
  mode: WeatherMode;
  targetOpacity: number;
  baseOpacity: number;
  count: number;
}

export class ParticleSystem {
  private scene: THREE.Scene;
  private terrain: Terrain;
  private maxCount: number = 5000;
  private particleTexture: THREE.Texture;
  private lightningMesh?: THREE.Line;
  private lightningActive: boolean = false;
  private lightningTimer: number = 0;

  private currentLayer: ParticleLayer;
  private nextLayer?: ParticleLayer;
  private transitionState: 'idle' | 'fadingOut' | 'fadingIn' = 'idle';
  private transitionProgress: number = 0;
  private readonly TRANSITION_DURATION: number = 0.5;

  private customParticleDensity?: number;

  constructor(scene: THREE.Scene, terrain: Terrain) {
    this.scene = scene;
    this.terrain = terrain;
    this.particleTexture = this.createParticleTexture();

    this.currentLayer = this.createLayer(WeatherMode.SUNNY);
    this.scene.add(this.currentLayer.points);
    this.populateLayer(this.currentLayer, WeatherMode.SUNNY, true);
    this.currentLayer.material.opacity = this.currentLayer.baseOpacity;
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

  private createLayer(mode: WeatherMode): ParticleLayer {
    const config = WEATHER_CONFIGS[mode];
    const positions = new Float32Array(this.maxCount * 3);
    const velocities = new Float32Array(this.maxCount * 3);
    const colors = new Float32Array(this.maxCount * 3);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: config.size,
      vertexColors: true,
      map: this.particleTexture,
      transparent: true,
      opacity: 0,
      blending: mode === WeatherMode.RAIN ? THREE.NormalBlending : THREE.AdditiveBlending,
      depthWrite: false
    });

    const points = new THREE.Points(geometry, material);
    geometry.setDrawRange(0, 0);

    return {
      points,
      geometry,
      material,
      positions,
      velocities,
      colors,
      mode,
      targetOpacity: 0,
      baseOpacity: config.opacity,
      count: 0
    };
  }

  private populateLayer(layer: ParticleLayer, mode: WeatherMode, initial: boolean): void {
    const config = WEATHER_CONFIGS[mode];
    const density = this.customParticleDensity ?? config.count;
    const count = Math.min(density, this.maxCount);

    layer.mode = mode;
    layer.count = count;
    layer.baseOpacity = config.opacity;
    layer.material.size = config.size;
    layer.material.color.setHex(config.color);
    layer.material.blending = mode === WeatherMode.RAIN ? THREE.NormalBlending : THREE.AdditiveBlending;

    for (let i = 0; i < this.maxCount; i++) {
      if (i < count) {
        this.resetParticleInLayer(layer, i, mode, initial);
        layer.colors[i * 3] = ((config.color >> 16) & 255) / 255;
        layer.colors[i * 3 + 1] = ((config.color >> 8) & 255) / 255;
        layer.colors[i * 3 + 2] = (config.color & 255) / 255;
      } else {
        layer.positions[i * 3 + 1] = -1000;
      }
    }

    layer.geometry.setDrawRange(0, count);
    layer.geometry.attributes.position.needsUpdate = true;
    layer.geometry.attributes.color.needsUpdate = true;
  }

  private resetParticleInLayer(layer: ParticleLayer, index: number, mode: WeatherMode, initial: boolean = false): void {
    const i = index * 3;
    const terrainSize = 10;

    switch (mode) {
      case WeatherMode.SUNNY:
        layer.positions[i] = (Math.random() - 0.5) * terrainSize * 1.5;
        layer.positions[i + 2] = (Math.random() - 0.5) * terrainSize * 1.5;
        const baseHeight = this.terrain.getHeightAt(layer.positions[i], layer.positions[i + 2]);
        layer.positions[i + 1] = baseHeight + 1 + Math.random() * 4;
        layer.velocities[i] = (Math.random() - 0.5) * 0.1;
        layer.velocities[i + 1] = (Math.random() - 0.5) * 0.05;
        layer.velocities[i + 2] = (Math.random() - 0.5) * 0.1;
        break;

      case WeatherMode.RAIN:
        layer.positions[i] = (Math.random() - 0.5) * terrainSize * 1.8;
        layer.positions[i + 1] = initial ? Math.random() * 15 : 15;
        layer.positions[i + 2] = (Math.random() - 0.5) * terrainSize * 1.8;
        layer.velocities[i] = 0;
        layer.velocities[i + 1] = -2;
        layer.velocities[i + 2] = 0;
        break;

      case WeatherMode.SNOW:
        layer.positions[i] = (Math.random() - 0.5) * terrainSize * 1.8;
        layer.positions[i + 1] = initial ? Math.random() * 12 : 12;
        layer.positions[i + 2] = (Math.random() - 0.5) * terrainSize * 1.8;
        layer.velocities[i] = (Math.random() - 0.5) * 0.3;
        layer.velocities[i + 1] = -0.5 - Math.random() * 0.3;
        layer.velocities[i + 2] = (Math.random() - 0.5) * 0.3;
        break;

      case WeatherMode.SANDSTORM:
        const angle = Math.random() * Math.PI * 2;
        const radius = 8 + Math.random() * 4;
        layer.positions[i] = Math.cos(angle) * radius;
        layer.positions[i + 1] = 0.5 + Math.random() * 3;
        layer.positions[i + 2] = Math.sin(angle) * radius;
        layer.velocities[i] = -Math.sin(angle) * 0.5;
        layer.velocities[i + 1] = (Math.random() - 0.5) * 0.2;
        layer.velocities[i + 2] = Math.cos(angle) * 0.5;
        break;
    }
  }

  public switchWeather(mode: WeatherMode): void {
    if (this.currentLayer.mode === mode) {
      return;
    }
    if (this.transitionState !== 'idle' && this.nextLayer) {
      this.scene.remove(this.nextLayer.points);
      this.nextLayer.geometry.dispose();
      this.nextLayer.material.dispose();
      this.nextLayer = undefined;
      this.transitionState = 'idle';
      this.transitionProgress = 0;
      this.currentLayer.material.opacity = this.currentLayer.baseOpacity;
    }

    const wasRain = this.currentLayer.mode === WeatherMode.RAIN;
    const willBeRain = mode === WeatherMode.RAIN;

    this.nextLayer = this.createLayer(mode);
    this.nextLayer.material.opacity = 0;
    this.populateLayer(this.nextLayer, mode, true);
    this.scene.add(this.nextLayer.points);

    this.transitionState = 'fadingOut';
    this.transitionProgress = 0;

    if (!wasRain && willBeRain) {
      this.terrain.showWater(true);
    } else if (wasRain && !willBeRain) {
      this.terrain.showWater(false);
      this.hideLightning();
    }
  }

  private updateLightning(deltaTime: number): void {
    if (this.currentLayer.mode !== WeatherMode.RAIN && this.nextLayer?.mode !== WeatherMode.RAIN) return;

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
      this.customParticleDensity = params.particleDensity;
      this.updateLayerDensity(this.currentLayer, params.particleDensity);
      if (this.nextLayer) {
        this.updateLayerDensity(this.nextLayer, params.particleDensity);
      }
    }
  }

  private updateLayerDensity(layer: ParticleLayer, density: number): void {
    const config = WEATHER_CONFIGS[layer.mode];
    const count = Math.min(density, this.maxCount);
    layer.count = count;
    layer.geometry.setDrawRange(0, count);

    for (let i = 0; i < count; i++) {
      if (layer.positions[i * 3 + 1] < -100) {
        this.resetParticleInLayer(layer, i, layer.mode, true);
        layer.colors[i * 3] = ((config.color >> 16) & 255) / 255;
        layer.colors[i * 3 + 1] = ((config.color >> 8) & 255) / 255;
        layer.colors[i * 3 + 2] = (config.color & 255) / 255;
      }
    }
    layer.geometry.attributes.position.needsUpdate = true;
    layer.geometry.attributes.color.needsUpdate = true;
  }

  private updateLayer(layer: ParticleLayer, time: number, deltaTime: number, windStrength: number): void {
    const mode = layer.mode;
    const count = layer.count;
    const terrainSize = 10;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;

      const windX = windStrength * 0.1 * Math.sin(time * 0.5 + layer.positions[idx] * 0.5);
      const windZ = windStrength * 0.1 * Math.cos(time * 0.5 + layer.positions[idx + 2] * 0.5);

      layer.positions[idx] += (layer.velocities[idx] + windX) * deltaTime * 60;
      layer.positions[idx + 1] += layer.velocities[idx + 1] * deltaTime * 60;
      layer.positions[idx + 2] += (layer.velocities[idx + 2] + windZ) * deltaTime * 60;

      let shouldReset = false;

      switch (mode) {
        case WeatherMode.SUNNY:
          const centerDist = Math.sqrt(
            layer.positions[idx] * layer.positions[idx] +
            layer.positions[idx + 2] * layer.positions[idx + 2]
          );
          if (centerDist > terrainSize * 1.2) shouldReset = true;
          if (layer.positions[idx + 1] < -1 || layer.positions[idx + 1] > 10) shouldReset = true;
          break;

        case WeatherMode.RAIN:
          if (layer.positions[idx + 1] < 0.1) {
            shouldReset = true;
          }
          break;

        case WeatherMode.SNOW:
          if (layer.positions[idx + 1] < 0.1) {
            shouldReset = true;
          }
          break;

        case WeatherMode.SANDSTORM:
          const distFromCenter = Math.sqrt(
            layer.positions[idx] * layer.positions[idx] +
            layer.positions[idx + 2] * layer.positions[idx + 2]
          );
          if (distFromCenter > 15 || layer.positions[idx + 1] < 0 || layer.positions[idx + 1] > 8) {
            shouldReset = true;
          }
          break;
      }

      if (shouldReset) {
        this.resetParticleInLayer(layer, i, mode, false);
      }
    }

    layer.geometry.attributes.position.needsUpdate = true;
  }

  private updateTransition(deltaTime: number): void {
    if (this.transitionState === 'idle' || !this.nextLayer) return;

    this.transitionProgress += deltaTime / this.TRANSITION_DURATION;
    const t = Math.min(this.transitionProgress, 1);

    if (this.transitionState === 'fadingOut') {
      this.currentLayer.material.opacity = this.currentLayer.baseOpacity * (1 - t);
      this.nextLayer.material.opacity = 0;

      if (t >= 1) {
        this.transitionState = 'fadingIn';
        this.transitionProgress = 0;

        this.scene.remove(this.currentLayer.points);
        this.currentLayer.geometry.dispose();
        this.currentLayer.material.dispose();

        this.currentLayer = this.nextLayer;
        this.nextLayer = undefined;
      }
    } else if (this.transitionState === 'fadingIn') {
      this.currentLayer.material.opacity = this.currentLayer.baseOpacity * t;

      if (t >= 1) {
        this.currentLayer.material.opacity = this.currentLayer.baseOpacity;
        this.transitionState = 'idle';
        this.transitionProgress = 0;
      }
    }
  }

  public update(time: number, deltaTime: number, windStrength: number): void {
    this.updateTransition(deltaTime);
    this.updateLayer(this.currentLayer, time, deltaTime, windStrength);

    if (this.nextLayer) {
      this.updateLayer(this.nextLayer, time, deltaTime, windStrength);
    }

    this.updateLightning(deltaTime);
  }

  public dispose(): void {
    this.currentLayer.geometry.dispose();
    this.currentLayer.material.dispose();
    if (this.nextLayer) {
      this.nextLayer.geometry.dispose();
      this.nextLayer.material.dispose();
    }
    this.particleTexture.dispose();
    this.hideLightning();
  }
}
