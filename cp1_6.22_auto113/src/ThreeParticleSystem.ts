import * as THREE from 'three';
import { v4 as uuidv4 } from 'uuid';
import {
  Particle,
  Halo,
  Point,
  MAX_PARTICLES,
  PARTICLE_LIFE,
  HALO_LIFE,
  CANVAS_WIDTH,
  CANVAS_HEIGHT
} from './types';

export class ThreeParticleSystem {
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer;
  private particles: Particle[] = [];
  private halos: Halo[] = [];
  private pointsMesh: THREE.Points | null = null;
  private geometry: THREE.BufferGeometry | null = null;
  private positions: Float32Array = new Float32Array(MAX_PARTICLES * 3);
  private colors: Float32Array = new Float32Array(MAX_PARTICLES * 3);
  private sizes: Float32Array = new Float32Array(MAX_PARTICLES);
  private spriteTexture: THREE.Texture;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();

    const aspect = CANVAS_WIDTH / CANVAS_HEIGHT;
    const viewSize = CANVAS_HEIGHT;
    this.camera = new THREE.OrthographicCamera(
      (-aspect * viewSize) / 2,
      (aspect * viewSize) / 2,
      viewSize / 2,
      -viewSize / 2,
      -1000,
      1000
    );
    this.camera.position.set(CANVAS_WIDTH / 2, -CANVAS_HEIGHT / 2, 500);
    this.camera.lookAt(CANVAS_WIDTH / 2, -CANVAS_HEIGHT / 2, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      premultipliedAlpha: false
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
    this.renderer.setClearColor(0x000000, 0);

    this.spriteTexture = this.createCircleTexture();
    this.initPoints();
  }

  private createCircleTexture(): THREE.Texture {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  private initPoints(): void {
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 5,
      map: this.spriteTexture,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: false
    });

    this.pointsMesh = new THREE.Points(this.geometry, material);
    this.scene.add(this.pointsMesh);
  }

  public emitExplosion(
    position: Point,
    color: { r: number; g: number; b: number },
    count: number = 40,
    radius: number = 60
  ): void {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= MAX_PARTICLES) {
        this.particles.shift();
      }

      const angle = Math.random() * Math.PI * 2;
      const speed = (radius / PARTICLE_LIFE) * (0.5 + Math.random() * 0.5);

      const particle: Particle = {
        id: uuidv4(),
        position: { x: position.x, y: position.y },
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed
        },
        color: { ...color },
        size: 2 + Math.random() * 3,
        life: PARTICLE_LIFE,
        maxLife: PARTICLE_LIFE
      };

      this.particles.push(particle);
    }

    this.halos.push({
      position: { ...position },
      radius: 200,
      opacity: 0.5,
      life: HALO_LIFE,
      maxLife: HALO_LIFE,
      color: { ...color }
    });
  }

  public update(deltaTime: number): void {
    const aliveParticles: Particle[] = [];

    for (const particle of this.particles) {
      particle.life -= deltaTime;
      if (particle.life <= 0) continue;

      particle.position.x += particle.velocity.x * deltaTime;
      particle.position.y += particle.velocity.y * deltaTime;
      particle.velocity.x *= 0.98;
      particle.velocity.y *= 0.98;

      aliveParticles.push(particle);
    }

    this.particles = aliveParticles;

    const aliveHalos: Halo[] = [];
    for (const halo of this.halos) {
      halo.life -= deltaTime;
      if (halo.life > 0) {
        halo.opacity = (halo.life / halo.maxLife) * 0.3;
        aliveHalos.push(halo);
      }
    }
    this.halos = aliveHalos;

    this.updateBuffers();
  }

  private updateBuffers(): void {
    const count = this.particles.length;

    for (let i = 0; i < MAX_PARTICLES; i++) {
      if (i < count) {
        const p = this.particles[i];
        const alpha = p.life / p.maxLife;
        this.positions[i * 3] = p.position.x;
        this.positions[i * 3 + 1] = -p.position.y;
        this.positions[i * 3 + 2] = 0;

        this.colors[i * 3] = (p.color.r / 255) * alpha;
        this.colors[i * 3 + 1] = (p.color.g / 255) * alpha;
        this.colors[i * 3 + 2] = (p.color.b / 255) * alpha;

        this.sizes[i] = p.size;
      } else {
        this.positions[i * 3] = 0;
        this.positions[i * 3 + 1] = 0;
        this.positions[i * 3 + 2] = -10000;
        this.colors[i * 3] = 0;
        this.colors[i * 3 + 1] = 0;
        this.colors[i * 3 + 2] = 0;
        this.sizes[i] = 0;
      }
    }

    if (this.geometry) {
      (this.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      (this.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
      (this.geometry.attributes.size as THREE.BufferAttribute).needsUpdate = true;
      this.geometry.setDrawRange(0, Math.max(count, 1));
    }
  }

  public render(): void {
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
  }

  public getHalos(): Halo[] {
    return this.halos;
  }

  public resize(width: number, height: number): void {
    this.renderer.setSize(width, height);
  }

  public dispose(): void {
    this.geometry?.dispose();
    this.spriteTexture.dispose();
    this.renderer.dispose();
  }
}
