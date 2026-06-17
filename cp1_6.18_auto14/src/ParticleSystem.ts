import * as THREE from 'three';
import type { AudioData } from './AudioAnalyzer';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  life: number;
  maxLife: number;
  size: number;
}

const PARTICLE_COLORS = [
  new THREE.Color(0xFF5252),
  new THREE.Color(0xFFAB40),
  new THREE.Color(0xFFD740)
];

export class ParticleSystem {
  private particles: Particle[] = [];
  private points: THREE.Points;
  private geometry: THREE.BufferGeometry;
  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;
  private maxParticles = 800;
  private emitCount = 100;

  constructor(scene: THREE.Scene) {
    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 3);
    this.sizes = new Float32Array(this.maxParticles);

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    this.geometry.setDrawRange(0, 0);

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 0.04,
      vertexColors: true,
      map: texture,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    this.points = new THREE.Points(this.geometry, material);
    scene.add(this.points);
  }

  emit(peakPositions: Array<{ x: number; y: number; z: number }>, audioData: AudioData): void {
    const peaksToUse = peakPositions.slice(0, Math.min(20, peakPositions.length));
    if (peaksToUse.length === 0) return;

    const perPeak = Math.ceil(this.emitCount / peaksToUse.length);
    let emitted = 0;

    for (const peak of peaksToUse) {
      for (let i = 0; i < perPeak && this.particles.length < this.maxParticles && emitted < this.emitCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.3 + Math.random() * 0.8 * (0.5 + audioData.volume);
        const upSpeed = 0.5 + Math.random() * 1.2;

        const color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
        const freqColor = this.getFrequencyColor(audioData.currentFrequency);
        const finalColor = color.clone().lerp(freqColor, 0.3);

        this.particles.push({
          position: new THREE.Vector3(
            peak.x + (Math.random() - 0.5) * 0.1,
            peak.y + 0.02,
            peak.z + (Math.random() - 0.5) * 0.1
          ),
          velocity: new THREE.Vector3(
            Math.cos(angle) * speed * 0.5,
            upSpeed,
            Math.sin(angle) * speed * 0.5
          ),
          color: finalColor,
          life: 3.0,
          maxLife: 3.0,
          size: 0.04
        });
        emitted++;
      }
    }
  }

  private getFrequencyColor(frequency: number): THREE.Color {
    const t = Math.min(1, Math.max(0, (frequency - 200) / 600));
    const color = new THREE.Color();
    color.setHSL(0.05 + t * 0.1, 1, 0.6);
    return color;
  }

  update(deltaTime: number): void {
    const gravity = -1.2;
    const dt = Math.min(deltaTime, 0.05);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      p.velocity.y += gravity * dt;
      p.position.addScaledVector(p.velocity, dt);

      p.life -= dt;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    const drawCount = Math.min(this.particles.length, this.maxParticles);

    for (let i = 0; i < drawCount; i++) {
      const p = this.particles[i];
      const lifeRatio = Math.max(0, p.life / p.maxLife);
      const alpha = lifeRatio;
      const scale = 0.5 + lifeRatio * 1.5;

      this.positions[i * 3] = p.position.x;
      this.positions[i * 3 + 1] = p.position.y;
      this.positions[i * 3 + 2] = p.position.z;

      this.colors[i * 3] = p.color.r * alpha;
      this.colors[i * 3 + 1] = p.color.g * alpha;
      this.colors[i * 3 + 2] = p.color.b * alpha;

      this.sizes[i] = p.size * scale;
    }

    for (let i = drawCount; i < this.maxParticles; i++) {
      this.positions[i * 3] = 0;
      this.positions[i * 3 + 1] = -1000;
      this.positions[i * 3 + 2] = 0;
      this.colors[i * 3] = 0;
      this.colors[i * 3 + 1] = 0;
      this.colors[i * 3 + 2] = 0;
      this.sizes[i] = 0;
    }

    this.geometry.setDrawRange(0, drawCount);
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
  }

  getParticleCount(): number {
    return this.particles.length;
  }
}
