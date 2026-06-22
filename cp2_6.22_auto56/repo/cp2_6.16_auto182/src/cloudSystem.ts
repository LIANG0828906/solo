import * as THREE from 'three';
import {
  CloudType,
  SystemParams,
  CLOUD_TYPE_CONFIGS,
  MAX_CLOUD_PARTICLES,
  MAX_PRECIP_PARTICLES,
} from './types';

function gaussianRandom(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function createCircleTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.4)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createPrecipTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 32;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createLinearGradient(0, 0, 0, 32);
  gradient.addColorStop(0, 'rgba(74, 144, 217, 0)');
  gradient.addColorStop(0.3, 'rgba(74, 144, 217, 0.6)');
  gradient.addColorStop(0.7, 'rgba(74, 144, 217, 0.8)');
  gradient.addColorStop(1, 'rgba(74, 144, 217, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 16, 32);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export class CloudSystem {
  private scene: THREE.Scene;
  private cloudPoints: THREE.Points | null = null;
  private precipitationPoints: THREE.Points | null = null;
  private params: SystemParams;
  private time: number = 0;

  private cloudPositions: Float32Array;
  private cloudBasePositions: Float32Array;
  private cloudSizes: Float32Array;
  private cloudOpacities: Float32Array;
  private turbulenceOffsets: Float32Array;

  private precipPositions: Float32Array;
  private precipVelocities: Float32Array;
  private precipOpacities: Float32Array;
  private precipSwingOffsets: Float32Array;

  private activeCloudParticles: number = 0;
  private activePrecipParticles: number = 0;

  private cloudGeometry: THREE.BufferGeometry | null = null;
  private precipGeometry: THREE.BufferGeometry | null = null;
  private cloudTexture: THREE.Texture;
  private precipTexture: THREE.Texture;

  constructor(scene: THREE.Scene) {
    this.cloudTexture = createCircleTexture();
    this.precipTexture = createPrecipTexture();
    this.scene = scene;
    this.params = {
      cloudType: CloudType.CUMULUS,
      windSpeed: 0,
      windDirection: 0,
      precipitationIntensity: 0,
      cloudDensity: 1,
    };

    this.cloudPositions = new Float32Array(MAX_CLOUD_PARTICLES * 3);
    this.cloudBasePositions = new Float32Array(MAX_CLOUD_PARTICLES * 3);
    this.cloudSizes = new Float32Array(MAX_CLOUD_PARTICLES);
    this.cloudOpacities = new Float32Array(MAX_CLOUD_PARTICLES);
    this.turbulenceOffsets = new Float32Array(MAX_CLOUD_PARTICLES * 3);

    this.precipPositions = new Float32Array(MAX_PRECIP_PARTICLES * 3);
    this.precipVelocities = new Float32Array(MAX_PRECIP_PARTICLES * 3);
    this.precipOpacities = new Float32Array(MAX_PRECIP_PARTICLES);
    this.precipSwingOffsets = new Float32Array(MAX_PRECIP_PARTICLES);

    this.initCloudParticles();
    this.initPrecipitationParticles();
  }

  private initCloudParticles(): void {
    const config = CLOUD_TYPE_CONFIGS[this.params.cloudType];
    this.activeCloudParticles = Math.floor(config.particleCount * this.params.cloudDensity);

    this.generateCloudPositions();

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.cloudPositions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(this.cloudSizes, 1));

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.2,
      transparent: true,
      opacity: config.opacity,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      map: this.cloudTexture,
      alphaTest: 0.01,
    });

    this.cloudGeometry = geometry;
    this.cloudPoints = new THREE.Points(geometry, material);
    this.scene.add(this.cloudPoints);
  }

  private initPrecipitationParticles(): void {
    for (let i = 0; i < MAX_PRECIP_PARTICLES; i++) {
      const i3 = i * 3;
      this.precipPositions[i3] = 0;
      this.precipPositions[i3 + 1] = -10;
      this.precipPositions[i3 + 2] = 0;
      this.precipVelocities[i3] = 0;
      this.precipVelocities[i3 + 1] = -1;
      this.precipVelocities[i3 + 2] = 0;
      this.precipOpacities[i] = 0;
      this.precipSwingOffsets[i] = Math.random() * Math.PI * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.precipPositions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x4a90d9,
      size: 0.08,
      transparent: true,
      opacity: 0,
      sizeAttenuation: true,
      depthWrite: false,
      map: this.precipTexture,
      alphaTest: 0.01,
    });

    this.precipGeometry = geometry;
    this.precipitationPoints = new THREE.Points(geometry, material);
    this.scene.add(this.precipitationPoints);
  }

  private generateCloudPositions(): void {
    const config = CLOUD_TYPE_CONFIGS[this.params.cloudType];

    switch (config.distribution) {
      case 'clustered':
      default:
        this.generateCumulusPositions();
        break;
      case 'layered':
        this.generateStratusPositions();
        break;
      case 'wispy':
        this.generateCirrusPositions();
        break;
    }
  }

  private generateCumulusPositions(): void {
    const config = CLOUD_TYPE_CONFIGS[CloudType.CUMULUS];
    const count = this.activeCloudParticles;
    const centerX = 0;
    const centerY = 2;
    const centerZ = 0;
    const scale = 2.5;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      const r = Math.pow(Math.random(), 0.5) * scale;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      const gauss = gaussianRandom() * 0.5;
      
      const x = centerX + r * Math.sin(phi) * Math.cos(theta) * (1 + gauss * 0.3);
      const y = centerY + r * Math.cos(phi) * 0.6 + gauss * 0.5;
      const z = centerZ + r * Math.sin(phi) * Math.sin(theta) * (1 + gauss * 0.3);

      this.cloudBasePositions[i3] = x;
      this.cloudBasePositions[i3 + 1] = y;
      this.cloudBasePositions[i3 + 2] = z;

      this.cloudPositions[i3] = x;
      this.cloudPositions[i3 + 1] = y;
      this.cloudPositions[i3 + 2] = z;

      const size = config.sizeRange[0] + Math.random() * (config.sizeRange[1] - config.sizeRange[0]);
      this.cloudSizes[i] = size;
      this.cloudOpacities[i] = config.opacity * (0.7 + Math.random() * 0.3);

      this.turbulenceOffsets[i3] = Math.random() * Math.PI * 2;
      this.turbulenceOffsets[i3 + 1] = Math.random() * Math.PI * 2;
      this.turbulenceOffsets[i3 + 2] = Math.random() * Math.PI * 2;
    }

    for (let i = count; i < MAX_CLOUD_PARTICLES; i++) {
      const i3 = i * 3;
      this.cloudPositions[i3] = 0;
      this.cloudPositions[i3 + 1] = -100;
      this.cloudPositions[i3 + 2] = 0;
      this.cloudSizes[i] = 0;
    }

    if (this.cloudGeometry) {
      (this.cloudGeometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      (this.cloudGeometry.attributes.size as THREE.BufferAttribute).needsUpdate = true;
    }
  }

  private generateStratusPositions(): void {
    const config = CLOUD_TYPE_CONFIGS[CloudType.STRATUS];
    const count = this.activeCloudParticles;
    const centerY = 1.5;
    const width = 6;
    const depth = 6;
    const height = 0.8;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      const x = (Math.random() - 0.5) * width;
      const y = centerY + (Math.random() - 0.5) * height;
      const z = (Math.random() - 0.5) * depth;

      this.cloudBasePositions[i3] = x;
      this.cloudBasePositions[i3 + 1] = y;
      this.cloudBasePositions[i3 + 2] = z;

      this.cloudPositions[i3] = x;
      this.cloudPositions[i3 + 1] = y;
      this.cloudPositions[i3 + 2] = z;

      const size = config.sizeRange[0] + Math.random() * (config.sizeRange[1] - config.sizeRange[0]);
      this.cloudSizes[i] = size;
      this.cloudOpacities[i] = config.opacity * (0.6 + Math.random() * 0.4);

      this.turbulenceOffsets[i3] = Math.random() * Math.PI * 2;
      this.turbulenceOffsets[i3 + 1] = Math.random() * Math.PI * 2;
      this.turbulenceOffsets[i3 + 2] = Math.random() * Math.PI * 2;
    }

    for (let i = count; i < MAX_CLOUD_PARTICLES; i++) {
      const i3 = i * 3;
      this.cloudPositions[i3] = 0;
      this.cloudPositions[i3 + 1] = -100;
      this.cloudPositions[i3 + 2] = 0;
      this.cloudSizes[i] = 0;
    }

    if (this.cloudGeometry) {
      (this.cloudGeometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      (this.cloudGeometry.attributes.size as THREE.BufferAttribute).needsUpdate = true;
    }
  }

  private generateCirrusPositions(): void {
    const config = CLOUD_TYPE_CONFIGS[CloudType.CIRRUS];
    const count = this.activeCloudParticles;
    const centerX = 0;
    const centerY = 4;
    const centerZ = 0;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      const seed = i * 0.1;
      const noiseX = Math.sin(seed) * Math.cos(seed * 0.7);
      const noiseZ = Math.cos(seed * 1.3) * Math.sin(seed * 0.5);
      
      const x = centerX + noiseX * 4 + (Math.random() - 0.5) * 2;
      const y = centerY + (Math.random() - 0.5) * 1.5;
      const z = centerZ + noiseZ * 4 + (Math.random() - 0.5) * 2;

      this.cloudBasePositions[i3] = x;
      this.cloudBasePositions[i3 + 1] = y;
      this.cloudBasePositions[i3 + 2] = z;

      this.cloudPositions[i3] = x;
      this.cloudPositions[i3 + 1] = y;
      this.cloudPositions[i3 + 2] = z;

      const size = config.sizeRange[0] + Math.random() * (config.sizeRange[1] - config.sizeRange[0]);
      this.cloudSizes[i] = size;
      this.cloudOpacities[i] = config.opacity * (0.5 + Math.random() * 0.5);

      this.turbulenceOffsets[i3] = Math.random() * Math.PI * 2;
      this.turbulenceOffsets[i3 + 1] = Math.random() * Math.PI * 2;
      this.turbulenceOffsets[i3 + 2] = Math.random() * Math.PI * 2;
    }

    for (let i = count; i < MAX_CLOUD_PARTICLES; i++) {
      const i3 = i * 3;
      this.cloudPositions[i3] = 0;
      this.cloudPositions[i3 + 1] = -100;
      this.cloudPositions[i3 + 2] = 0;
      this.cloudSizes[i] = 0;
    }

    if (this.cloudGeometry) {
      (this.cloudGeometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      (this.cloudGeometry.attributes.size as THREE.BufferAttribute).needsUpdate = true;
    }
  }

  public updateParams(params: Partial<SystemParams>): void {
    const oldCloudType = this.params.cloudType;
    Object.assign(this.params, params);

    if (params.cloudType && params.cloudType !== oldCloudType) {
      this.regenerateCloud();
    }

    if (params.cloudDensity !== undefined) {
      const config = CLOUD_TYPE_CONFIGS[this.params.cloudType];
      this.activeCloudParticles = Math.floor(config.particleCount * this.params.cloudDensity);
      this.regenerateCloud();
    }

    this.activePrecipParticles = Math.floor(MAX_PRECIP_PARTICLES * (this.params.precipitationIntensity / 100));
  }

  private regenerateCloud(): void {
    this.generateCloudPositions();
  }

  public update(deltaTime: number): void {
    this.time += deltaTime;
    this.updateCloudPositions(deltaTime);
    this.updatePrecipitation(deltaTime);
  }

  private updateCloudPositions(delta: number): void {
    const windRad = (this.params.windDirection * Math.PI) / 180;
    const windX = Math.cos(windRad) * this.params.windSpeed * 0.1;
    const windZ = Math.sin(windRad) * this.params.windSpeed * 0.1;
    const turbulenceScale = 0.05 + (this.params.windSpeed / 20) * 0.15;

    for (let i = 0; i < this.activeCloudParticles; i++) {
      const i3 = i * 3;

      this.cloudBasePositions[i3] += windX * delta;
      this.cloudBasePositions[i3 + 2] += windZ * delta;

      const bounds = 8;
      if (this.cloudBasePositions[i3] > bounds) this.cloudBasePositions[i3] = -bounds;
      if (this.cloudBasePositions[i3] < -bounds) this.cloudBasePositions[i3] = bounds;
      if (this.cloudBasePositions[i3 + 2] > bounds) this.cloudBasePositions[i3 + 2] = -bounds;
      if (this.cloudBasePositions[i3 + 2] < -bounds) this.cloudBasePositions[i3 + 2] = bounds;

      const turbX = Math.sin(this.time * 1.5 + this.turbulenceOffsets[i3]) * turbulenceScale;
      const turbY = Math.cos(this.time * 1.2 + this.turbulenceOffsets[i3 + 1]) * turbulenceScale * 0.5;
      const turbZ = Math.sin(this.time * 1.8 + this.turbulenceOffsets[i3 + 2]) * turbulenceScale;

      this.cloudPositions[i3] = this.cloudBasePositions[i3] + turbX;
      this.cloudPositions[i3 + 1] = this.cloudBasePositions[i3 + 1] + turbY;
      this.cloudPositions[i3 + 2] = this.cloudBasePositions[i3 + 2] + turbZ;
    }

    if (this.cloudGeometry) {
      (this.cloudGeometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    }
  }

  private updatePrecipitation(delta: number): void {
    const config = CLOUD_TYPE_CONFIGS[this.params.cloudType];
    const fallSpeed = 0.5 + (this.params.precipitationIntensity / 100) * 2.5;
    const windRad = (this.params.windDirection * Math.PI) / 180;
    const windInfluence = (this.params.windSpeed / 20) * 0.5;

    for (let i = 0; i < this.activePrecipParticles; i++) {
      const i3 = i * 3;

      if (this.precipOpacities[i] <= 0 && Math.random() < 0.02) {
        const cloudIndex = Math.floor(Math.random() * this.activeCloudParticles);
        const ci3 = cloudIndex * 3;
        this.precipPositions[i3] = this.cloudBasePositions[ci3] + (Math.random() - 0.5) * 0.5;
        this.precipPositions[i3 + 1] = this.cloudBasePositions[ci3 + 1] - 0.5;
        this.precipPositions[i3 + 2] = this.cloudBasePositions[ci3 + 2] + (Math.random() - 0.5) * 0.5;
        this.precipOpacities[i] = 0.7;
      }

      if (this.precipOpacities[i] > 0) {
        const swing = Math.sin(this.time * 2 + this.precipSwingOffsets[i]) * 0.1 * (1 + this.params.windSpeed / 10);
        
        this.precipVelocities[i3] = Math.cos(windRad) * windInfluence + swing;
        this.precipVelocities[i3 + 1] = -fallSpeed;
        this.precipVelocities[i3 + 2] = Math.sin(windRad) * windInfluence;

        this.precipPositions[i3] += this.precipVelocities[i3] * delta;
        this.precipPositions[i3 + 1] += this.precipVelocities[i3 + 1] * delta;
        this.precipPositions[i3 + 2] += this.precipVelocities[i3 + 2] * delta;

        if (this.precipPositions[i3 + 1] < -3) {
          this.precipOpacities[i] = Math.max(0, this.precipOpacities[i] - delta * 2);
        }
      }
    }

    for (let i = this.activePrecipParticles; i < MAX_PRECIP_PARTICLES; i++) {
      const i3 = i * 3;
      this.precipPositions[i3 + 1] = -10;
      this.precipOpacities[i] = 0;
    }

    if (this.precipGeometry) {
      (this.precipGeometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    }

    if (this.precipitationPoints) {
      (this.precipitationPoints.material as THREE.PointsMaterial).opacity = Math.min(1, this.params.precipitationIntensity / 50);
    }
  }

  public getParticleCount(): number {
    return this.activeCloudParticles + this.activePrecipParticles;
  }

  public getCloudParticleCount(): number {
    return this.activeCloudParticles;
  }

  public getParams(): SystemParams {
    return { ...this.params };
  }

  public dispose(): void {
    if (this.cloudPoints) {
      this.scene.remove(this.cloudPoints);
      this.cloudGeometry?.dispose();
      (this.cloudPoints.material as THREE.Material).dispose();
    }
    if (this.precipitationPoints) {
      this.scene.remove(this.precipitationPoints);
      this.precipGeometry?.dispose();
      (this.precipitationPoints.material as THREE.Material).dispose();
    }
    this.cloudTexture.dispose();
    this.precipTexture.dispose();
  }
}
