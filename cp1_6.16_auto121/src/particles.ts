import * as THREE from 'three';

export interface ParticleData {
  positions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
  alphas: Float32Array;
  thetas: Float32Array;
  radii: Float32Array;
  heights: Float32Array;
  bandIndex: Float32Array;
  trailPositions: Float32Array[];
  trailCount: number;
}

export class ParticleSystem {
  public readonly rainBandCount: number = 8;
  public readonly particlesPerBand: number = 200;
  public readonly innerWallCount: number = 100;
  public readonly maxRadius: number = 5.0;
  public readonly eyeRadius: number = 2.0;
  public readonly wallHeight: number = 0.5;

  private readonly a: number = 0.5;
  private readonly b: number = 0.15;

  public rainBandParticles: THREE.Points | null = null;
  public innerWallParticles: THREE.Points | null = null;
  public trailLines: THREE.LineSegments | null = null;

  public rainData: ParticleData;
  public innerData: ParticleData;

  private maxTrailFrames: number = 30;
  private targetWindStrength: number = 5;
  private currentWindStrength: number = 5;
  private targetShowTrails: boolean = false;
  private currentShowTrails: boolean = false;

  constructor() {
    this.rainData = this.allocateParticleData(this.rainBandCount * this.particlesPerBand);
    this.innerData = this.allocateParticleData(this.innerWallCount);
    this.initRainBandParticles();
    this.initInnerWallParticles();
    this.createTrailGeometry();
  }

  private allocateParticleData(count: number): ParticleData {
    return {
      positions: new Float32Array(count * 3),
      colors: new Float32Array(count * 3),
      sizes: new Float32Array(count),
      alphas: new Float32Array(count),
      thetas: new Float32Array(count),
      radii: new Float32Array(count),
      heights: new Float32Array(count),
      bandIndex: new Float32Array(count),
      trailPositions: new Array(count).fill(null).map(() => new Float32Array(this.maxTrailFrames * 3)),
      trailCount: 0,
    };
  }

  private initRainBandParticles(): void {
    const total = this.rainBandCount * this.particlesPerBand;
    for (let i = 0; i < total; i++) {
      const band = Math.floor(i / this.particlesPerBand);
      const indexInBand = i % this.particlesPerBand;
      const bandOffset = (band / this.rainBandCount) * Math.PI * 2;
      const progress = indexInBand / this.particlesPerBand;
      
      const theta = bandOffset + progress * Math.PI * 4;
      const radius = this.eyeRadius + progress * (this.maxRadius - this.eyeRadius);
      const height = (Math.random() * 0.6 - 0.1) * this.wallHeight;
      
      this.rainData.thetas[i] = theta;
      this.rainData.radii[i] = radius;
      this.rainData.heights[i] = height;
      this.rainData.bandIndex[i] = band;
      this.rainData.sizes[i] = 1.0 + Math.random() * 2.0;
      this.rainData.alphas[i] = 1.0 - progress * 0.8;
      
      this.updateRainParticlePosition(i);
      this.updateRainParticleColor(i);
      this.clearTrailForParticle(this.rainData, i);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.rainData.positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(this.rainData.colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(this.rainData.sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 1,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.rainBandParticles = new THREE.Points(geometry, material);
  }

  private initInnerWallParticles(): void {
    for (let i = 0; i < this.innerWallCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = this.eyeRadius * (0.95 + Math.random() * 0.1);
      const height = Math.random() * this.wallHeight;

      this.innerData.thetas[i] = angle;
      this.innerData.radii[i] = radius;
      this.innerData.heights[i] = height;
      this.innerData.sizes[i] = 2.0;
      this.innerData.alphas[i] = 0.8;

      this.updateInnerParticlePosition(i);
      this.updateInnerParticleColor(i);
      this.clearTrailForParticle(this.innerData, i);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.innerData.positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(this.innerData.colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(this.innerData.sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 1,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.innerWallParticles = new THREE.Points(geometry, material);
  }

  private createTrailGeometry(): void {
    const totalParticles = this.rainBandCount * this.particlesPerBand + this.innerWallCount;
    const trailSegments = this.maxTrailFrames - 1;
    const positions = new Float32Array(totalParticles * trailSegments * 2 * 3);
    const colors = new Float32Array(totalParticles * trailSegments * 2 * 3);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.3,
      linewidth: 1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.trailLines = new THREE.LineSegments(geometry, material);
    this.trailLines.visible = false;
  }

  private updateRainParticlePosition(i: number): void {
    const theta = this.rainData.thetas[i];
    const r = this.a * Math.exp(this.b * theta) % this.maxRadius;
    const radius = Math.max(this.eyeRadius, r);
    const height = this.rainData.heights[i];

    this.rainData.positions[i * 3] = radius * Math.cos(theta);
    this.rainData.positions[i * 3 + 1] = height;
    this.rainData.positions[i * 3 + 2] = radius * Math.sin(theta);
    this.rainData.radii[i] = radius;
  }

  private updateRainParticleColor(i: number): void {
    const radius = this.rainData.radii[i];
    const t = (radius - this.eyeRadius) / (this.maxRadius - this.eyeRadius);
    const clampedT = Math.max(0, Math.min(1, t));

    const r = 1.0 - clampedT * (1.0 - 0.0);
    const g = 1.0 - clampedT * (1.0 - 0.0);
    const b = 1.0 - clampedT * (1.0 - 0.502);

    this.rainData.colors[i * 3] = r;
    this.rainData.colors[i * 3 + 1] = g;
    this.rainData.colors[i * 3 + 2] = b;
  }

  private updateInnerParticlePosition(i: number): void {
    const theta = this.innerData.thetas[i];
    const radius = this.innerData.radii[i];
    const height = this.innerData.heights[i];

    this.innerData.positions[i * 3] = radius * Math.cos(theta);
    this.innerData.positions[i * 3 + 1] = height;
    this.innerData.positions[i * 3 + 2] = radius * Math.sin(theta);
  }

  private updateInnerParticleColor(i: number): void {
    this.innerData.colors[i * 3] = 0.827;
    this.innerData.colors[i * 3 + 1] = 0.827;
    this.innerData.colors[i * 3 + 2] = 0.827;
  }

  private clearTrailForParticle(data: ParticleData, i: number): void {
    for (let f = 0; f < this.maxTrailFrames; f++) {
      data.trailPositions[i][f * 3] = 0;
      data.trailPositions[i][f * 3 + 1] = 0;
      data.trailPositions[i][f * 3 + 2] = 0;
    }
  }

  public update(deltaTime: number, windStrength: number, showTrails: boolean): number {
    this.targetWindStrength = windStrength;
    this.targetShowTrails = showTrails;
    this.currentWindStrength += (this.targetWindStrength - this.currentWindStrength) * Math.min(1, deltaTime / 0.3);
    this.currentShowTrails = this.targetShowTrails;

    const speedMultiplier = 1 + this.currentWindStrength * 0.1;
    const sizeMultiplier = 1 + this.currentWindStrength * 0.05;
    const trailSpeedFactor = this.currentShowTrails ? 0.5 : 1.0;

    const activeParticles = this.updateRainBandParticles(deltaTime, speedMultiplier * trailSpeedFactor, sizeMultiplier) +
                            this.updateInnerWallParticles(deltaTime, speedMultiplier * trailSpeedFactor);

    if (this.currentShowTrails) {
      this.updateTrails();
    }

    if (this.trailLines) {
      this.trailLines.visible = this.currentShowTrails;
    }

    if (this.rainBandParticles) {
      (this.rainBandParticles.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      (this.rainBandParticles.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
      (this.rainBandParticles.geometry.attributes.size as THREE.BufferAttribute).needsUpdate = true;
    }
    if (this.innerWallParticles) {
      (this.innerWallParticles.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      (this.innerWallParticles.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    }

    return activeParticles;
  }

  private updateRainBandParticles(deltaTime: number, speedFactor: number, sizeFactor: number): number {
    const total = this.rainBandCount * this.particlesPerBand;
    let active = 0;

    for (let i = 0; i < total; i++) {
      const radius = this.rainData.radii[i];
      const t = (radius - this.eyeRadius) / (this.maxRadius - this.eyeRadius);
      const baseSpeed = 0.05 - t * 0.04;
      const speed = baseSpeed * speedFactor;

      this.rainData.thetas[i] += speed;

      if (this.a * Math.exp(this.b * this.rainData.thetas[i]) > this.maxRadius) {
        this.rainData.thetas[i] = Math.log(this.eyeRadius / this.a) / this.b + Math.random() * 0.5;
        this.rainData.heights[i] = (Math.random() * 0.6 - 0.1) * this.wallHeight;
        this.rainData.alphas[i] = 1.0;
      }

      this.updateRainParticlePosition(i);
      this.updateRainParticleColor(i);

      const radialT = (this.rainData.radii[i] - this.eyeRadius) / (this.maxRadius - this.eyeRadius);
      this.rainData.alphas[i] = 1.0 - Math.max(0, Math.min(1, radialT)) * 0.8;

      const baseSize = 1.0 + ((i * 7) % 10) / 5.0;
      this.rainData.sizes[i] = baseSize * sizeFactor;

      if (this.rainData.alphas[i] > 0.2) active++;

      this.storeTrailPosition(this.rainData, i);
    }

    return active;
  }

  private updateInnerWallParticles(deltaTime: number, speedFactor: number): number {
    const upSpeed = 0.02 * speedFactor;

    for (let i = 0; i < this.innerWallCount; i++) {
      this.innerData.thetas[i] += 0.01 * speedFactor;
      this.innerData.heights[i] += upSpeed;

      if (this.innerData.heights[i] > this.wallHeight) {
        this.innerData.heights[i] = 0;
        this.innerData.radii[i] = this.eyeRadius * (0.95 + Math.random() * 0.1);
        this.innerData.thetas[i] = Math.random() * Math.PI * 2;
      }

      this.updateInnerParticlePosition(i);
      this.storeTrailPosition(this.innerData, i);
    }

    return this.innerWallCount;
  }

  private storeTrailPosition(data: ParticleData, i: number): void {
    for (let f = this.maxTrailFrames - 1; f > 0; f--) {
      data.trailPositions[i][f * 3] = data.trailPositions[i][(f - 1) * 3];
      data.trailPositions[i][f * 3 + 1] = data.trailPositions[i][(f - 1) * 3 + 1];
      data.trailPositions[i][f * 3 + 2] = data.trailPositions[i][(f - 1) * 3 + 2];
    }
    data.trailPositions[i][0] = data.positions[i * 3];
    data.trailPositions[i][1] = data.positions[i * 3 + 1];
    data.trailPositions[i][2] = data.positions[i * 3 + 2];
  }

  private updateTrails(): void {
    if (!this.trailLines) return;

    const trailSegments = this.maxTrailFrames - 1;
    const positions = this.trailLines.geometry.attributes.position.array as Float32Array;
    const colors = this.trailLines.geometry.attributes.color.array as Float32Array;

    let offset = 0;

    const updateDataTrails = (data: ParticleData, count: number) => {
      for (let i = 0; i < count; i++) {
        for (let f = 0; f < trailSegments; f++) {
          const alpha = 1.0 - f / trailSegments;

          positions[offset] = data.trailPositions[i][f * 3];
          positions[offset + 1] = data.trailPositions[i][f * 3 + 1];
          positions[offset + 2] = data.trailPositions[i][f * 3 + 2];
          colors[offset] = 0.29 * alpha;
          colors[offset + 1] = 0.56 * alpha;
          colors[offset + 2] = 0.85 * alpha;
          offset += 3;

          positions[offset] = data.trailPositions[i][(f + 1) * 3];
          positions[offset + 1] = data.trailPositions[i][(f + 1) * 3 + 1];
          positions[offset + 2] = data.trailPositions[i][(f + 1) * 3 + 2];
          colors[offset] = 0.29 * alpha * 0.8;
          colors[offset + 1] = 0.56 * alpha * 0.8;
          colors[offset + 2] = 0.85 * alpha * 0.8;
          offset += 3;
        }
      }
    };

    updateDataTrails(this.rainData, this.rainBandCount * this.particlesPerBand);
    updateDataTrails(this.innerData, this.innerWallCount);

    (this.trailLines.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.trailLines.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
  }

  public getWindStrength(): number {
    return this.currentWindStrength;
  }
}
