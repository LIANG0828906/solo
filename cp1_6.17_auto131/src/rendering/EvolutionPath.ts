import {
  CatmullRomCurve3,
  BufferGeometry,
  Line,
  LineDashedMaterial,
  Points,
  PointsMaterial,
  Vector3,
  Color,
  MeshBasicMaterial,
  Sprite,
  SpriteMaterial,
  Texture,
  Scene,
  BufferAttribute,
  AdditiveBlending,
  CanvasTexture,
} from 'three';
import { EvolutionPoint, SPECTRAL_COLORS, SpectralType } from '../types/star';

interface ParticleData {
  offset: number;
  phase: number;
  amplitude: number;
}

interface InterpolatedPoint {
  position: Vector3;
  temperature: number;
  radius: number;
  spectralType: Exclude<SpectralType, 'ALL'>;
}

interface SpriteWithCore extends Sprite {
  core?: Points;
}

export class EvolutionPath {
  private scene: Scene;
  private curve: CatmullRomCurve3 | null = null;
  private pathLine: Line | null = null;
  private keyPointSprites: Sprite[] = [];
  private particles: Points | null = null;
  private particleData: ParticleData[] = [];
  private isAnimating: boolean = false;
  private points: EvolutionPoint[] = [];

  private readonly PARTICLE_COUNT = 20;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  createPath(points: EvolutionPoint[]): void {
    this.clear();
    this.points = points;

    if (points.length < 2) return;

    const curvePoints = points.map(
      (p) => new Vector3(p.position.x, p.position.y, p.position.z)
    );
    this.curve = new CatmullRomCurve3(curvePoints, false, 'catmullrom', 0.5);

    const linePoints = this.curve.getPoints(100);
    const lineGeometry = new BufferGeometry().setFromPoints(linePoints);

    const lineMaterial = new LineDashedMaterial({
      color: new Color('#FFD700'),
      transparent: true,
      opacity: 0.4,
      linewidth: 2,
      dashSize: 0.5,
      gapSize: 0.2,
    });

    this.pathLine = new Line(lineGeometry, lineMaterial);
    this.pathLine.computeLineDistances();
    this.scene.add(this.pathLine);

    this.createKeyPointSprites(points);
    this.createParticleSystem();
  }

  private createKeyPointSprites(points: EvolutionPoint[]): void {
    points.forEach((point) => {
      const spectralColor = new Color(SPECTRAL_COLORS[point.spectralType]);

      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d')!;

      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, `rgba(255, 255, 255, 1)`);
      gradient.addColorStop(0.3, `rgba(${Math.floor(spectralColor.r * 255)}, ${Math.floor(spectralColor.g * 255)}, ${Math.floor(spectralColor.b * 255)}, 0.8)`);
      gradient.addColorStop(1, `rgba(${Math.floor(spectralColor.r * 255)}, ${Math.floor(spectralColor.g * 255)}, ${Math.floor(spectralColor.b * 255)}, 0)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);

      const texture: Texture = new CanvasTexture(canvas);

      const spriteMaterial = new SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 0.7,
        blending: AdditiveBlending,
        depthWrite: false,
      });

      const sprite = new Sprite(spriteMaterial);
      sprite.position.set(
        point.position.x,
        point.position.y,
        point.position.z
      );
      sprite.scale.set(0.3, 0.3, 0.3);
      this.scene.add(sprite);
      this.keyPointSprites.push(sprite);

      const coreGeometry = new BufferGeometry();
      coreGeometry.setAttribute('position', new BufferAttribute(new Float32Array([0, 0, 0]), 3));
      const coreMaterial = new MeshBasicMaterial({
        color: spectralColor,
        transparent: true,
        opacity: 0.9,
      });
      const corePoint = new Points(coreGeometry, coreMaterial);
      corePoint.position.copy(sprite.position);
      this.scene.add(corePoint);
      (sprite as SpriteWithCore).core = corePoint;
    });
  }

  private createParticleSystem(): void {
    const geometry = new BufferGeometry();
    const positions = new Float32Array(this.PARTICLE_COUNT * 3);
    const sizes = new Float32Array(this.PARTICLE_COUNT);

    for (let i = 0; i < this.PARTICLE_COUNT; i++) {
      this.particleData.push({
        offset: i / this.PARTICLE_COUNT,
        phase: Math.random() * Math.PI * 2,
        amplitude: 0.5 + Math.random() * 0.5,
      });
      sizes[i] = 0.1 + Math.random() * 0.1;
    }

    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    geometry.setAttribute('size', new BufferAttribute(sizes, 1));

    const material = new PointsMaterial({
      color: new Color('#FFD700'),
      transparent: true,
      opacity: 0.8,
      size: 0.15,
      blending: AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.particles = new Points(geometry, material);
    this.scene.add(this.particles);
  }

  startAnimation(): void {
    this.isAnimating = true;
  }

  stopAnimation(): void {
    this.isAnimating = false;
  }

  update(deltaTime: number, progress: number): void {
    if (!this.isAnimating || !this.curve || !this.particles) return;

    const positions = this.particles.geometry.attributes.position.array as Float32Array;
    const time = performance.now() * 0.001;

    for (let i = 0; i < this.PARTICLE_COUNT; i++) {
      const particle = this.particleData[i];
      const particleProgress = (progress + particle.offset) % 1.0;

      const point = this.curve.getPointAt(particleProgress);

      const flicker =
        Math.sin(time * 3 + particle.phase) * 0.3 +
        Math.sin(time * 5 + particle.phase * 2) * 0.2;
      const scale = 1 + flicker * particle.amplitude;

      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;

      const sizeAttr = this.particles.geometry.attributes.size as BufferAttribute;
      sizeAttr.array[i] = (0.1 + Math.random() * 0.1) * scale;
    }

    this.particles.geometry.attributes.position.needsUpdate = true;
    (this.particles.geometry.attributes.size as BufferAttribute).needsUpdate = true;
  }

  clear(): void {
    if (this.pathLine) {
      this.scene.remove(this.pathLine);
      this.pathLine.geometry.dispose();
      (this.pathLine.material as LineDashedMaterial).dispose();
      this.pathLine = null;
    }

    this.keyPointSprites.forEach((sprite) => {
      this.scene.remove(sprite);
      (sprite.material as SpriteMaterial).dispose();
      const spriteMaterial = sprite.material as SpriteMaterial;
      if (spriteMaterial.map) {
        spriteMaterial.map.dispose();
      }
      const core = (sprite as SpriteWithCore).core;
      if (core) {
        this.scene.remove(core);
        core.geometry.dispose();
        (core.material as MeshBasicMaterial).dispose();
      }
    });
    this.keyPointSprites = [];

    if (this.particles) {
      this.scene.remove(this.particles);
      this.particles.geometry.dispose();
      (this.particles.material as PointsMaterial).dispose();
      this.particles = null;
    }
    this.particleData = [];

    this.curve = null;
    this.points = [];
    this.isAnimating = false;
  }

  setProgress(progress: number): InterpolatedPoint | null {
    if (!this.curve || this.points.length < 2) return null;

    const clampedProgress = Math.max(0, Math.min(1, progress));
    const position = this.curve.getPointAt(clampedProgress);

    const exactIndex = clampedProgress * (this.points.length - 1);
    const index = Math.floor(exactIndex);
    const t = exactIndex - index;

    const nextIndex = Math.min(index + 1, this.points.length - 1);
    const p1 = this.points[index];
    const p2 = this.points[nextIndex];

    const temperature = this.lerp(p1.temperature, p2.temperature, t);
    const radius = this.lerp(p1.radius, p2.radius, t);

    const spectralType = t < 0.5 ? p1.spectralType : p2.spectralType;

    return {
      position,
      temperature,
      radius,
      spectralType,
    };
  }

  getPointAt(progress: number): Vector3 | null {
    if (!this.curve) return null;
    return this.curve.getPointAt(Math.max(0, Math.min(1, progress)));
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }
}
