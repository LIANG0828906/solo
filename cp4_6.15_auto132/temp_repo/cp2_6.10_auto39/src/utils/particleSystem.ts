import * as THREE from 'three';
import { FlameParticle } from '../types';

export class FlameParticleSystem {
  private maxParticles: number = 200;
  private currentMaxParticles: number = 200;
  private particles: FlameParticle[] = [];
  private basePosition: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private windDirection: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private windTimer: number = 0;
  private windChangeInterval: number = 5;
  private baseHeight: number = 0.5;

  private innerColor: THREE.Color = new THREE.Color(0xffffa0);
  private outerColor: THREE.Color = new THREE.Color(0xff6600);

  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private points: THREE.Points;

  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;

  private eightDirections: THREE.Vector3[] = [
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0.707, 0, 0.707),
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(-0.707, 0, 0.707),
    new THREE.Vector3(-1, 0, 0),
    new THREE.Vector3(-0.707, 0, -0.707),
    new THREE.Vector3(0, 0, -1),
    new THREE.Vector3(0.707, 0, -0.707),
  ];

  constructor(maxParticles: number = 200) {
    this.maxParticles = maxParticles;
    this.currentMaxParticles = maxParticles;

    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 3);
    this.sizes = new Float32Array(this.maxParticles);

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    this.material = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.points = new THREE.Points(this.geometry, this.material);

    this.initParticles();
    this.randomizeWindDirection();
  }

  private initParticles(): void {
    this.particles = [];
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push(this.createParticle(true));
    }
  }

  private createParticle(randomLife: boolean = false): FlameParticle {
    const heightVariation = 0.15;
    const randomizedHeight = this.baseHeight * (1 + (Math.random() - 0.5) * heightVariation * 2);

    const position = new THREE.Vector3(
      this.basePosition.x + (Math.random() - 0.5) * 0.05,
      this.basePosition.y,
      this.basePosition.z + (Math.random() - 0.5) * 0.05
    );

    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.02,
      0.03 + Math.random() * 0.02,
      (Math.random() - 0.5) * 0.02
    );

    const size = 0.02 + Math.random() * 0.04;
    const maxLife = 0.8 + Math.random() * 0.4;
    const life = randomLife ? Math.random() * maxLife : maxLife;

    return {
      position,
      velocity,
      size,
      life,
      maxLife,
    };
  }

  private randomizeWindDirection(): void {
    const randomIndex = Math.floor(Math.random() * this.eightDirections.length);
    this.windDirection.copy(this.eightDirections[randomIndex]);
    this.windDirection.multiplyScalar(0.5 + Math.random() * 0.5);
  }

  public update(deltaTime: number, fps: number): void {
    this.windTimer += deltaTime;
    if (this.windTimer >= this.windChangeInterval) {
      this.windTimer = 0;
      this.randomizeWindDirection();
    }

    if (fps < 30) {
      this.currentMaxParticles = Math.floor(this.maxParticles / 2);
    } else {
      this.currentMaxParticles = this.maxParticles;
    }

    for (let i = 0; i < this.currentMaxParticles; i++) {
      const particle = this.particles[i];
      
      particle.life -= deltaTime;

      if (particle.life <= 0) {
        const newParticle = this.createParticle();
        particle.position.copy(newParticle.position);
        particle.velocity.copy(newParticle.velocity);
        particle.size = newParticle.size;
        particle.life = newParticle.life;
        particle.maxLife = newParticle.maxLife;
      }

      const windForce = this.windDirection.clone().multiplyScalar(deltaTime * 0.1);
      particle.velocity.add(windForce);
      particle.velocity.y += deltaTime * 0.01;

      particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime * 60));

      const lifeRatio = particle.life / particle.maxLife;
      const currentSize = particle.size * lifeRatio;

      const color = new THREE.Color();
      color.lerpColors(this.outerColor, this.innerColor, lifeRatio);

      this.positions[i * 3] = particle.position.x;
      this.positions[i * 3 + 1] = particle.position.y;
      this.positions[i * 3 + 2] = particle.position.z;

      this.colors[i * 3] = color.r;
      this.colors[i * 3 + 1] = color.g;
      this.colors[i * 3 + 2] = color.b;

      this.sizes[i] = currentSize;
    }

    for (let i = this.currentMaxParticles; i < this.maxParticles; i++) {
      this.positions[i * 3] = 0;
      this.positions[i * 3 + 1] = -1000;
      this.positions[i * 3 + 2] = 0;
      this.sizes[i] = 0;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
  }

  public setBasePosition(x: number, y: number, z: number): void {
    this.basePosition.set(x, y, z);
  }

  public setBaseHeight(height: number): void {
    this.baseHeight = height;
  }

  public getPoints(): THREE.Points {
    return this.points;
  }

  public getWindDirection(): THREE.Vector3 {
    return this.windDirection.clone();
  }

  public getParticleCount(): number {
    return this.currentMaxParticles;
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
