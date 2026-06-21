import * as THREE from 'three';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  life: number;
  maxLife: number;
  size: number;
  active: boolean;
  exploding: boolean;
}

interface BrushSettings {
  color: string;
  size: number;
}

const MAX_PARTICLES = 5000;
const PARTICLE_LIFETIME = 2.0;
const STREAM_LINE_COUNT = 30;

export class ParticleSystem {
  private scene: THREE.Scene;
  private particles: Particle[] = [];
  private particleGeometry: THREE.BufferGeometry;
  private particleMaterial: THREE.PointsMaterial;
  private points: THREE.Points;
  private streamGeometry: THREE.BufferGeometry;
  private streamMaterial: THREE.LineBasicMaterial;
  private streamLine: THREE.Line;
  private cursorMesh: THREE.Mesh;
  private cursorMaterial: THREE.MeshBasicMaterial;
  private brush: BrushSettings = { color: '#00d4ff', size: 6 };
  private emitAccumulator = 0;
  private emitInterval = 1 / 60;
  private recentPositions: THREE.Vector3[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initParticlePool();
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(MAX_PARTICLES * 3);
    const colors = new Float32Array(MAX_PARTICLES * 3);
    const sizes = new Float32Array(MAX_PARTICLES);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    this.particleGeometry = geo;
    this.particleMaterial = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    this.points = new THREE.Points(this.particleGeometry, this.particleMaterial);
    this.scene.add(this.points);

    const streamGeo = new THREE.BufferGeometry();
    const streamPositions = new Float32Array(STREAM_LINE_COUNT * 3);
    streamGeo.setAttribute('position', new THREE.BufferAttribute(streamPositions, 3));
    this.streamGeometry = streamGeo;
    this.streamMaterial = new THREE.LineBasicMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.streamLine = new THREE.Line(this.streamGeometry, this.streamMaterial);
    this.scene.add(this.streamLine);

    this.cursorMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(this.brush.color),
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const cursorGeo = new THREE.SphereGeometry(this.brush.size * 0.02, 16, 16);
    this.cursorMesh = new THREE.Mesh(cursorGeo, this.cursorMaterial);
    this.cursorMesh.visible = false;
    this.scene.add(this.cursorMesh);
  }

  private initParticlePool(): void {
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.particles.push({
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        color: new THREE.Color(),
        life: 0,
        maxLife: PARTICLE_LIFETIME,
        size: 0.05,
        active: false,
        exploding: false,
      });
    }
  }

  setBrush(settings: BrushSettings): void {
    this.brush = { ...settings };
    this.cursorMaterial.color.set(settings.color);
    const newRadius = settings.size * 0.02;
    this.cursorMesh.geometry.dispose();
    this.cursorMesh.geometry = new THREE.SphereGeometry(newRadius, 16, 16);
    this.streamMaterial.color.set(settings.color);
  }

  getBrush(): BrushSettings {
    return { ...this.brush };
  }

  getCursorMesh(): THREE.Mesh {
    return this.cursorMesh;
  }

  setCursorOpacity(opacity: number): void {
    this.cursorMaterial.opacity = opacity;
  }

  emit(position: THREE.Vector3): void {
    this.emitAccumulator += this.emitInterval;
    while (this.emitAccumulator >= this.emitInterval) {
      this.spawnParticle(position);
      this.emitAccumulator -= this.emitInterval;
    }
    this.recentPositions.unshift(position.clone());
    if (this.recentPositions.length > STREAM_LINE_COUNT) {
      this.recentPositions.pop();
    }
  }

  private spawnParticle(position: THREE.Vector3): void {
    let particle: Particle | null = null;
    for (let i = 0; i < this.particles.length; i++) {
      if (!this.particles[i].active) {
        particle = this.particles[i];
        break;
      }
    }
    if (!particle) {
      let oldestIdx = 0;
      let oldestLife = Infinity;
      for (let i = 0; i < this.particles.length; i++) {
        if (this.particles[i].life < oldestLife) {
          oldestLife = this.particles[i].life;
          oldestIdx = i;
        }
      }
      particle = this.particles[oldestIdx];
    }
    particle.position.copy(position);
    particle.position.x += (Math.random() - 0.5) * 0.04;
    particle.position.y += (Math.random() - 0.5) * 0.04;
    particle.position.z += (Math.random() - 0.5) * 0.04;
    particle.velocity.set(0, 0, 0);
    particle.color.set(this.brush.color);
    particle.life = PARTICLE_LIFETIME;
    particle.maxLife = PARTICLE_LIFETIME;
    particle.size = 0.04 + this.brush.size * 0.008;
    particle.active = true;
    particle.exploding = false;
  }

  clear(withExplosion: boolean): void {
    for (const p of this.particles) {
      if (p.active) {
        if (withExplosion) {
          p.exploding = true;
          const speed = 1.5 + Math.random() * 2.5;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          p.velocity.set(
            speed * Math.sin(phi) * Math.cos(theta),
            speed * Math.sin(phi) * Math.sin(theta),
            speed * Math.cos(phi)
          );
          p.maxLife = 1.0;
          p.life = 1.0;
        } else {
          p.active = false;
        }
      }
    }
    this.recentPositions = [];
  }

  update(deltaTime: number): void {
    const positions = this.particleGeometry.attributes.position.array as Float32Array;
    const colors = this.particleGeometry.attributes.color.array as Float32Array;
    const sizes = this.particleGeometry.attributes.size.array as Float32Array;
    let activeCount = 0;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!p.active) continue;
      p.life -= deltaTime;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      if (p.exploding) {
        p.position.addScaledVector(p.velocity, deltaTime);
        p.velocity.multiplyScalar(0.96);
      }
      const t = p.life / p.maxLife;
      const fade = Math.max(0, Math.min(1, t));
      const i3 = activeCount * 3;
      positions[i3] = p.position.x;
      positions[i3 + 1] = p.position.y;
      positions[i3 + 2] = p.position.z;
      colors[i3] = p.color.r * fade;
      colors[i3 + 1] = p.color.g * fade;
      colors[i3 + 2] = p.color.b * fade;
      sizes[activeCount] = p.size * (0.4 + 0.6 * fade);
      activeCount++;
    }
    this.particleGeometry.setDrawRange(0, activeCount);
    this.particleGeometry.attributes.position.needsUpdate = true;
    this.particleGeometry.attributes.color.needsUpdate = true;
    this.particleGeometry.attributes.size.needsUpdate = true;
    const streamPositions = this.streamGeometry.attributes.position.array as Float32Array;
    for (let i = 0; i < this.recentPositions.length && i < STREAM_LINE_COUNT; i++) {
      const i3 = i * 3;
      streamPositions[i3] = this.recentPositions[i].x;
      streamPositions[i3 + 1] = this.recentPositions[i].y;
      streamPositions[i3 + 2] = this.recentPositions[i].z;
    }
    this.streamGeometry.setDrawRange(0, this.recentPositions.length);
    this.streamGeometry.attributes.position.needsUpdate = true;
    const baseColor = new THREE.Color(this.brush.color);
    this.streamMaterial.color.copy(baseColor);
  }

  dispose(): void {
    this.particleGeometry.dispose();
    this.particleMaterial.dispose();
    this.streamGeometry.dispose();
    this.streamMaterial.dispose();
    this.cursorMesh.geometry.dispose();
    this.cursorMaterial.dispose();
    this.scene.remove(this.points);
    this.scene.remove(this.streamLine);
    this.scene.remove(this.cursorMesh);
  }
}
