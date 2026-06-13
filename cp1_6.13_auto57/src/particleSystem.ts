import * as THREE from 'three';
import { ForceManager } from './forceManager';

const COLOR_BOTTOM = new THREE.Color(0x1a237e);
const COLOR_MIDDLE = new THREE.Color(0x7b1fa2);
const COLOR_TOP = new THREE.Color(0xf06292);
const MAX_PARTICLES = 15000;
const WAVE_AMPLITUDE = 1;
const WAVE_PERIOD = 3;
const DAMPING = 0.995;
const MAX_SPEED = 8;
const MIN_SIZE = 0.05;
const MAX_SIZE = 0.2;

export class ParticleSystem {
  public points: THREE.Points;
  public geometry: THREE.BufferGeometry;
  public material: THREE.PointsMaterial;

  public count: number = 0;

  private positions: Float32Array;
  private velocities: Float32Array;
  private baseYs: Float32Array;
  private phases: Float32Array;
  private baseSizes: Float32Array;

  private positionAttr: THREE.BufferAttribute;
  private colorAttr: THREE.BufferAttribute;
  private sizeAttr: THREE.BufferAttribute;

  private texture: THREE.Texture;
  private time: number = 0;

  constructor() {
    this.positions = new Float32Array(MAX_PARTICLES * 3);
    this.velocities = new Float32Array(MAX_PARTICLES * 3);
    this.baseYs = new Float32Array(MAX_PARTICLES);
    this.phases = new Float32Array(MAX_PARTICLES);
    this.baseSizes = new Float32Array(MAX_PARTICLES);

    this.texture = this.createParticleTexture();

    this.geometry = new THREE.BufferGeometry();

    this.positionAttr = new THREE.BufferAttribute(
      new Float32Array(MAX_PARTICLES * 3),
      3,
    );
    this.colorAttr = new THREE.BufferAttribute(
      new Float32Array(MAX_PARTICLES * 3),
      3,
    );
    this.sizeAttr = new THREE.BufferAttribute(
      new Float32Array(MAX_PARTICLES),
      1,
    );

    this.geometry.setAttribute('position', this.positionAttr);
    this.geometry.setAttribute('color', this.colorAttr);
    this.geometry.setAttribute('size', this.sizeAttr);

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        pointTexture: { value: this.texture },
        globalSize: { value: 1.0 },
      },
      vertexShader: `
        uniform float globalSize;
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * globalSize * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D pointTexture;
        varying vec3 vColor;
        void main() {
          vec4 texColor = texture2D(pointTexture, gl_PointCoord);
          if (texColor.a < 0.01) discard;
          gl_FragColor = vec4(vColor, 1.0) * texColor;
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;

    this.initializeParticles(10000);
  }

  private createParticleTexture(): THREE.Texture {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2,
    );
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.2, 'rgba(255,255,255,0.85)');
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.35)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  private initializeParticles(count: number): void {
    for (let i = 0; i < count; i++) {
      this.spawnParticleAt(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 10,
      );
    }
  }

  public addParticle(position: THREE.Vector3): boolean {
    if (this.count >= MAX_PARTICLES) return false;
    this.spawnParticleAt(position.x, position.y, position.z);
    return true;
  }

  public addParticles(position: THREE.Vector3, count: number): number {
    let added = 0;
    for (let i = 0; i < count; i++) {
      if (this.count >= MAX_PARTICLES) break;
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5,
      );
      this.spawnParticleAt(
        position.x + offset.x,
        position.y + offset.y,
        position.z + offset.z,
      );
      added++;
    }
    return added;
  }

  private spawnParticleAt(x: number, y: number, z: number): void {
    const i = this.count;
    const ix = i * 3;

    this.positions[ix] = x;
    this.positions[ix + 1] = y;
    this.positions[ix + 2] = z;

    this.velocities[ix] = (Math.random() - 0.5) * 0.5;
    this.velocities[ix + 1] = (Math.random() - 0.5) * 0.2;
    this.velocities[ix + 2] = (Math.random() - 0.5) * 0.5;

    this.baseYs[i] = y;
    this.phases[i] = Math.random() * Math.PI * 2;
    this.baseSizes[i] = MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE);

    this.count++;
  }

  public update(dt: number, forceManager: ForceManager): void {
    this.time += dt;

    forceManager.update(this.positions, this.velocities, this.count, dt);

    const posArr = this.positionAttr.array as Float32Array;
    const colorArr = this.colorAttr.array as Float32Array;
    const sizeArr = this.sizeAttr.array as Float32Array;

    const waveOmega = (Math.PI * 2) / WAVE_PERIOD;

    for (let i = 0; i < this.count; i++) {
      const ix = i * 3;

      this.velocities[ix] *= DAMPING;
      this.velocities[ix + 1] *= DAMPING;
      this.velocities[ix + 2] *= DAMPING;

      const speedSq =
        this.velocities[ix] ** 2 +
        this.velocities[ix + 1] ** 2 +
        this.velocities[ix + 2] ** 2;
      if (speedSq > MAX_SPEED * MAX_SPEED) {
        const invSpeed = MAX_SPEED / Math.sqrt(speedSq);
        this.velocities[ix] *= invSpeed;
        this.velocities[ix + 1] *= invSpeed;
        this.velocities[ix + 2] *= invSpeed;
      }

      this.positions[ix] += this.velocities[ix] * dt;
      this.positions[ix + 1] += this.velocities[ix + 1] * dt;
      this.positions[ix + 2] += this.velocities[ix + 2] * dt;

      const waveOffset =
        Math.sin(this.time * waveOmega + this.phases[i]) * WAVE_AMPLITUDE;
      const displayY = this.positions[ix + 1] + waveOffset;

      posArr[ix] = this.positions[ix];
      posArr[ix + 1] = displayY;
      posArr[ix + 2] = this.positions[ix + 2];

      this.updateColor(i, displayY, colorArr);
      this.updateSize(i, speedSq, sizeArr);
    }

    this.positionAttr.needsUpdate = true;
    this.colorAttr.needsUpdate = true;
    this.sizeAttr.needsUpdate = true;

    this.geometry.setDrawRange(0, this.count);
  }

  private updateColor(i: number, y: number, colorArr: Float32Array): void {
    const ix = i * 3;
    const t = Math.max(-1, Math.min(1, y / 5));
    const color = new THREE.Color();

    if (t < 0) {
      const k = t + 1;
      color.lerpColors(COLOR_BOTTOM, COLOR_MIDDLE, k);
    } else {
      color.lerpColors(COLOR_MIDDLE, COLOR_TOP, t);
    }

    colorArr[ix] = color.r;
    colorArr[ix + 1] = color.g;
    colorArr[ix + 2] = color.b;
  }

  private updateSize(i: number, speedSq: number, sizeArr: Float32Array): void {
    const speed = Math.sqrt(speedSq);
    const speedFactor = 1 - Math.min(1, speed / MAX_SPEED) * 0.6;
    sizeArr[i] = this.baseSizes[i] * (0.4 + speedFactor * 0.6);
  }

  public getParticleCount(): number {
    return this.count;
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.texture.dispose();
  }
}
