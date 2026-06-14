import * as THREE from 'three';

export class ParticleSystem {
  public readonly particleCount: number = 5000;
  public positions: Float32Array;
  public velocities: Float32Array;
  public colors: Float32Array;
  public initialPositions: Float32Array;
  public initialVelocities: Float32Array;
  public radii: Float32Array;
  public thetas: Float32Array;
  public points: THREE.Points;
  public geometry: THREE.BufferGeometry;

  private readonly PARTICLE_SIZE = 0.05;
  private readonly GALAXY_RADIUS = 10;
  private readonly INITIAL_COLOR = new THREE.Color('#2563eb');

  private createParticleTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.9)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.5)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.15)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  constructor(scene: THREE.Scene) {
    this.positions = new Float32Array(this.particleCount * 3);
    this.velocities = new Float32Array(this.particleCount * 3);
    this.colors = new Float32Array(this.particleCount * 3);
    this.initialPositions = new Float32Array(this.particleCount * 3);
    this.initialVelocities = new Float32Array(this.particleCount * 3);
    this.radii = new Float32Array(this.particleCount);
    this.thetas = new Float32Array(this.particleCount);

    this.geometry = new THREE.BufferGeometry();
    this.initParticleData();

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    const material = new THREE.PointsMaterial({
      size: this.PARTICLE_SIZE * 18,
      vertexColors: true,
      sizeAttenuation: true,
      transparent: true,
      opacity: 1.0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      map: this.createParticleTexture(),
      alphaTest: 0.01
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

      const rFlat = Math.sqrt(x * x + z * z) + 0.5;
      const orbitalSpeed = 1.5 / Math.sqrt(rFlat);
      const vx = -z * orbitalSpeed / rFlat;
      const vz = x * orbitalSpeed / rFlat;

      this.velocities[i3] = vx;
      this.velocities[i3 + 1] = (Math.random() - 0.5) * 0.05;
      this.velocities[i3 + 2] = vz;

      this.initialVelocities[i3] = vx;
      this.initialVelocities[i3 + 1] = this.velocities[i3 + 1];
      this.initialVelocities[i3 + 2] = vz;

      this.colors[i3] = this.INITIAL_COLOR.r;
      this.colors[i3 + 1] = this.INITIAL_COLOR.g;
      this.colors[i3 + 2] = this.INITIAL_COLOR.b;
    }
  }

  public updatePositions(): void {
    const posAttr = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    posAttr.array = this.positions;
    posAttr.needsUpdate = true;
  }

  public updateColors(): void {
    const colorAttr = this.geometry.getAttribute('color') as THREE.BufferAttribute;
    colorAttr.array = this.colors;
    colorAttr.needsUpdate = true;
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
    }
    this.updatePositions();
    this.updateColors();
  }

  public getParticleSpeed(i: number): number {
    const i3 = i * 3;
    const vx = this.velocities[i3];
    const vy = this.velocities[i3 + 1];
    const vz = this.velocities[i3 + 2];
    return Math.sqrt(vx * vx + vy * vy + vz * vz);
  }
}
