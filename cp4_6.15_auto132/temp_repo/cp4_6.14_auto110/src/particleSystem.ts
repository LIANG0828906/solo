import * as THREE from 'three';

export class ParticleSystem {
  public readonly particleCount: number = 5000;
  public positions: Float32Array;
  public velocities: Float32Array;
  public colors: Float32Array;
  public startColors: Float32Array;
  public targetColors: Float32Array;
  public colorProgress: Float32Array;
  public initialPositions: Float32Array;
  public initialVelocities: Float32Array;
  public radii: Float32Array;
  public thetas: Float32Array;
  public points: THREE.Points;
  public geometry: THREE.BufferGeometry;
  public material: THREE.PointsMaterial;

  private readonly BASE_PARTICLE_SIZE = 0.05;
  private readonly MIN_TEXTURE_SCALE = 10;
  private readonly MAX_TEXTURE_SCALE = 16;
  private readonly REFERENCE_CAMERA_DISTANCE = 22;
  private readonly GALAXY_RADIUS = 10;
  private readonly INITIAL_COLOR = new THREE.Color('#2563eb');
  private readonly COLOR_TRANSITION_DURATION = 0.3;

  private createParticleTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    const size = 64;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.15, 'rgba(255, 255, 255, 0.95)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.45)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.18)');
    gradient.addColorStop(0.85, 'rgba(255, 255, 255, 0.05)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    return texture;
  }

  constructor(scene: THREE.Scene) {
    this.positions = new Float32Array(this.particleCount * 3);
    this.velocities = new Float32Array(this.particleCount * 3);
    this.colors = new Float32Array(this.particleCount * 3);
    this.startColors = new Float32Array(this.particleCount * 3);
    this.targetColors = new Float32Array(this.particleCount * 3);
    this.colorProgress = new Float32Array(this.particleCount);
    this.initialPositions = new Float32Array(this.particleCount * 3);
    this.initialVelocities = new Float32Array(this.particleCount * 3);
    this.radii = new Float32Array(this.particleCount);
    this.thetas = new Float32Array(this.particleCount);

    this.geometry = new THREE.BufferGeometry();
    this.initParticleData();

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    this.material = new THREE.PointsMaterial({
      size: this.BASE_PARTICLE_SIZE * (this.MIN_TEXTURE_SCALE + this.MAX_TEXTURE_SCALE) / 2,
      vertexColors: true,
      sizeAttenuation: true,
      transparent: true,
      opacity: 1.0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      map: this.createParticleTexture(),
      alphaTest: 0.005
    });

    this.points = new THREE.Points(this.geometry, this.material);
    scene.add(this.points);
  }

  public updateParticleScale(cameraDistance: number): void {
    const distanceRatio = cameraDistance / this.REFERENCE_CAMERA_DISTANCE;
    const scale = this.MIN_TEXTURE_SCALE +
      (this.MAX_TEXTURE_SCALE - this.MIN_TEXTURE_SCALE) *
      Math.max(0, Math.min(1, (distanceRatio - 0.5) * 1.5));
    const adjustedScale = scale * Math.max(0.6, Math.min(1.3, Math.sqrt(distanceRatio)));
    this.material.size = this.BASE_PARTICLE_SIZE * adjustedScale;
    this.material.needsUpdate = true;
  }

  private initParticleData(): void {
    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = this.GALAXY_RADIUS * Math.pow(Math.random(), 1 / 3);

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta) * 0.5;
      const z = r * Math.cos(phi);

      this.positions[i3] = x;
      this.positions[i3 + 1] = y;
      this.positions[i3 + 2] = z;

      this.initialPositions[i3] = x;
      this.initialPositions[i3 + 1] = y;
      this.initialPositions[i3 + 2] = z;

      this.radii[i] = Math.sqrt(x * x + y * y + z * z);
      this.thetas[i] = Math.atan2(x, z);

      const rFlat = Math.max(0.1, Math.sqrt(x * x + z * z));
      const orbitalSpeed = 1.5 / Math.sqrt(rFlat + 0.5);
      const vx = -z * orbitalSpeed / (rFlat + 0.5);
      const vz = x * orbitalSpeed / (rFlat + 0.5);

      this.velocities[i3] = vx;
      this.velocities[i3 + 1] = (Math.random() - 0.5) * 0.05;
      this.velocities[i3 + 2] = vz;

      this.initialVelocities[i3] = vx;
      this.initialVelocities[i3 + 1] = this.velocities[i3 + 1];
      this.initialVelocities[i3 + 2] = vz;

      this.colors[i3] = this.INITIAL_COLOR.r;
      this.colors[i3 + 1] = this.INITIAL_COLOR.g;
      this.colors[i3 + 2] = this.INITIAL_COLOR.b;

      this.startColors[i3] = this.INITIAL_COLOR.r;
      this.startColors[i3 + 1] = this.INITIAL_COLOR.g;
      this.startColors[i3 + 2] = this.INITIAL_COLOR.b;

      this.targetColors[i3] = this.INITIAL_COLOR.r;
      this.targetColors[i3 + 1] = this.INITIAL_COLOR.g;
      this.targetColors[i3 + 2] = this.INITIAL_COLOR.b;

      this.colorProgress[i] = 1.0;
    }
  }

  public updatePositions(): void {
    const posAttr = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    posAttr.array = this.positions;
    posAttr.needsUpdate = true;
  }

  public interpolateColors(deltaTime: number): void {
    const count = this.particleCount;
    const colors = this.colors;
    const starts = this.startColors;
    const targets = this.targetColors;
    const progress = this.colorProgress;
    const progressStep = Math.min(1.0, deltaTime / this.COLOR_TRANSITION_DURATION);
    let colorsNeedUpdate = false;
    const EPS = 1e-8;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      if (progress[i] >= 1.0) {
        continue;
      }

      let newProgress = progress[i] + progressStep;
      if (newProgress >= 1.0 - EPS) {
        newProgress = 1.0;
      }

      const t = newProgress;
      const sr = starts[i3];
      const sg = starts[i3 + 1];
      const sb = starts[i3 + 2];
      const tr = targets[i3];
      const tg = targets[i3 + 1];
      const tb = targets[i3 + 2];

      const nr = sr + (tr - sr) * t;
      const ng = sg + (tg - sg) * t;
      const nb = sb + (tb - sb) * t;

      if (Math.abs(colors[i3] - nr) > EPS ||
          Math.abs(colors[i3 + 1] - ng) > EPS ||
          Math.abs(colors[i3 + 2] - nb) > EPS) {
        colors[i3] = nr;
        colors[i3 + 1] = ng;
        colors[i3 + 2] = nb;
        colorsNeedUpdate = true;
      }

      progress[i] = newProgress;
    }

    if (colorsNeedUpdate) {
      const colorAttr = this.geometry.getAttribute('color') as THREE.BufferAttribute;
      colorAttr.array = this.colors;
      colorAttr.needsUpdate = true;
    }
  }

  public setTargetColor(i: number, r: number, g: number, b: number): void {
    const i3 = i * 3;
    const EPS = 1e-8;
    if (Math.abs(this.targetColors[i3] - r) > EPS ||
        Math.abs(this.targetColors[i3 + 1] - g) > EPS ||
        Math.abs(this.targetColors[i3 + 2] - b) > EPS) {
      this.startColors[i3] = this.colors[i3];
      this.startColors[i3 + 1] = this.colors[i3 + 1];
      this.startColors[i3 + 2] = this.colors[i3 + 2];
      this.targetColors[i3] = r;
      this.targetColors[i3 + 1] = g;
      this.targetColors[i3 + 2] = b;
      this.colorProgress[i] = 0;
    }
  }

  public reset(): void {
    for (let i = 0; i < this.particleCount * 3; i++) {
      this.positions[i] = this.initialPositions[i];
      this.velocities[i] = this.initialVelocities[i];
    }
    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      this.radii[i] = Math.sqrt(
        this.initialPositions[i3] ** 2 +
        this.initialPositions[i3 + 1] ** 2 +
        this.initialPositions[i3 + 2] ** 2
      );
      this.thetas[i] = Math.atan2(this.initialPositions[i3], this.initialPositions[i3 + 2]);

      this.colors[i3] = this.INITIAL_COLOR.r;
      this.colors[i3 + 1] = this.INITIAL_COLOR.g;
      this.colors[i3 + 2] = this.INITIAL_COLOR.b;

      this.startColors[i3] = this.INITIAL_COLOR.r;
      this.startColors[i3 + 1] = this.INITIAL_COLOR.g;
      this.startColors[i3 + 2] = this.INITIAL_COLOR.b;

      this.targetColors[i3] = this.INITIAL_COLOR.r;
      this.targetColors[i3 + 1] = this.INITIAL_COLOR.g;
      this.targetColors[i3 + 2] = this.INITIAL_COLOR.b;

      this.colorProgress[i] = 1.0;
    }
    this.updatePositions();
    const colorAttr = this.geometry.getAttribute('color') as THREE.BufferAttribute;
    colorAttr.array = this.colors;
    colorAttr.needsUpdate = true;
  }

  public getParticleSpeed(i: number): number {
    const i3 = i * 3;
    const vx = this.velocities[i3];
    const vy = this.velocities[i3 + 1];
    const vz = this.velocities[i3 + 2];
    return Math.sqrt(vx * vx + vy * vy + vz * vz);
  }
}
