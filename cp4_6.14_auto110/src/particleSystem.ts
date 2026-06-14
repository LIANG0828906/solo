import * as THREE from 'three';

export class ParticleSystem {
  public readonly particleCount: number = 5000;
  public positions: Float32Array;
  public velocities: Float32Array;
  public colors: Float32Array;
  public targetColors: Float32Array;
  public initialPositions: Float32Array;
  public initialVelocities: Float32Array;
  public radii: Float32Array;
  public thetas: Float32Array;
  public points: THREE.Points;
  public geometry: THREE.BufferGeometry;

  private readonly PARTICLE_SIZE = 0.05;
  private readonly TEXTURE_SCALE = 12;
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
    this.targetColors = new Float32Array(this.particleCount * 3);
    this.initialPositions = new Float32Array(this.particleCount * 3);
    this.initialVelocities = new Float32Array(this.particleCount * 3);
    this.radii = new Float32Array(this.particleCount);
    this.thetas = new Float32Array(this.particleCount);

    this.geometry = new THREE.BufferGeometry();
    this.initParticleData();

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    const material = new THREE.PointsMaterial({
      size: this.PARTICLE_SIZE * this.TEXTURE_SCALE,
      vertexColors: true,
      sizeAttenuation: true,
      transparent: true,
      opacity: 1.0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      map: this.createParticleTexture(),
      alphaTest: 0.005
    });

    this.points = new THREE.Points(this.geometry, material);
    scene.add(this.points);
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

      this.targetColors[i3] = this.INITIAL_COLOR.r;
      this.targetColors[i3 + 1] = this.INITIAL_COLOR.g;
      this.targetColors[i3 + 2] = this.INITIAL_COLOR.b;
    }
  }

  public updatePositions(): void {
    const posAttr = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    posAttr.array = this.positions;
    posAttr.needsUpdate = true;
  }

  public interpolateColors(deltaTime: number): void {
    const lerpFactor = Math.min(1, deltaTime / this.COLOR_TRANSITION_DURATION);
    const count = this.particleCount;
    const colors = this.colors;
    const targets = this.targetColors;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      colors[i3] += (targets[i3] - colors[i3]) * lerpFactor;
      colors[i3 + 1] += (targets[i3 + 1] - colors[i3 + 1]) * lerpFactor;
      colors[i3 + 2] += (targets[i3 + 2] - colors[i3 + 2]) * lerpFactor;
    }

    const colorAttr = this.geometry.getAttribute('color') as THREE.BufferAttribute;
    colorAttr.array = this.colors;
    colorAttr.needsUpdate = true;
  }

  public setTargetColor(i: number, r: number, g: number, b: number): void {
    const i3 = i * 3;
    this.targetColors[i3] = r;
    this.targetColors[i3 + 1] = g;
    this.targetColors[i3 + 2] = b;
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

      this.targetColors[i3] = this.INITIAL_COLOR.r;
      this.targetColors[i3 + 1] = this.INITIAL_COLOR.g;
      this.targetColors[i3 + 2] = this.INITIAL_COLOR.b;
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
