import * as THREE from 'three';
import { useAppStore, getNoteInfo } from '../store/AppState';
import { AudioEngine } from '../interaction/AudioEngine';
import { AccordionModel } from './AccordionModel';

interface Particle {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
  color: THREE.Color;
  size: number;
  frequency: number;
  seed: number;
}

export class ParticleSystem {
  private group = new THREE.Group();
  private particles: Particle[] = [];
  private maxParticles = 400;
  private points!: THREE.Points;
  private positions!: Float32Array;
  private colors!: Float32Array;
  private sizes!: Float32Array;
  private connectionLines: THREE.LineSegments | null = null;
  private connectionPositions!: Float32Array;
  private connectionColors!: Float32Array;
  private audioEngine: AudioEngine;
  private accordion: AccordionModel;
  private emitCooldowns: Map<number, number> = new Map();
  private connectionDistance = 1.5;
  private maxConnections = 1500;

  constructor(audioEngine: AudioEngine, accordion: AccordionModel) {
    this.audioEngine = audioEngine;
    this.accordion = accordion;
    this.init();
  }

  getGroup() {
    return this.group;
  }

  private init() {
    const initialCount = 500;
    this.positions = new Float32Array(initialCount * 3);
    this.colors = new Float32Array(initialCount * 3);
    this.sizes = new Float32Array(initialCount);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));
    geo.setDrawRange(0, 0);

    const spriteTexture = this.createParticleTexture();
    const mat = new THREE.PointsMaterial({
      size: 0.08,
      map: spriteTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    this.points = new THREE.Points(geo, mat);
    this.group.add(this.points);

    const maxConnIndices = this.maxConnections * 2;
    this.connectionPositions = new Float32Array(maxConnIndices * 3);
    this.connectionColors = new Float32Array(maxConnIndices * 3);

    const connGeo = new THREE.BufferGeometry();
    connGeo.setAttribute('position', new THREE.BufferAttribute(this.connectionPositions, 3));
    connGeo.setAttribute('color', new THREE.BufferAttribute(this.connectionColors, 3));
    connGeo.setDrawRange(0, 0);

    const connMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.connectionLines = new THREE.LineSegments(connGeo, connMat);
    this.group.add(this.connectionLines);
  }

  private createParticleTexture(): THREE.Texture {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const grd = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.3, 'rgba(255,255,255,0.8)');
    grd.addColorStop(0.6, 'rgba(255,255,255,0.2)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  private getFrequencyColor(frequency: number, amplitude: number): THREE.Color {
    let h: number, s: number, l: number;
    if (frequency < 330) {
      h = 0 + (frequency / 330) * 30;
      s = 80;
      l = 55 + amplitude * 15;
    } else if (frequency < 660) {
      h = 120 + ((frequency - 330) / 330) * 80;
      s = 70;
      l = 55 + amplitude * 10;
    } else {
      h = 270 + Math.min(50, (frequency - 660) / 800 * 50);
      s = 80;
      l = 60 + amplitude * 10;
    }
    return new THREE.Color().setHSL(h / 360, s / 100, l / 100);
  }

  emitFromNote(noteIndex: number, count: number = 8) {
    const pos = this.accordion.getKeyWorldPosition(noteIndex);
    if (!pos) return;

    const info = getNoteInfo(noteIndex);
    const amp = this.audioEngine.getAverageAmplitude();
    const baseColor = this.getFrequencyColor(info.frequency, amp);

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) {
        this.particles.shift();
      }
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.5 + 0.2;
      const speed = (0.4 + Math.random() * 0.8);
      const dir = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.abs(Math.cos(phi)) * 0.6 + 0.2,
        Math.sin(phi) * Math.sin(theta)
      ).normalize();

      const jitter = new THREE.Vector3(
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.15,
        (Math.random() - 0.5) * 0.1
      );

      this.particles.push({
        pos: pos.clone().add(jitter),
        vel: dir.multiplyScalar(speed),
        life: 0,
        maxLife: 1.5,
        color: baseColor.clone().offsetHSL((Math.random() - 0.5) * 0.05, 0, (Math.random() - 0.5) * 0.08),
        size: 0.04 + Math.random() * 0.07,
        frequency: info.frequency,
        seed: Math.random() * 1000,
      });
    }
  }

  update(dt: number) {
    const state = useAppStore.getState();
    this.maxParticles = state.particleCount;
    const windMult = state.windSpeed;

    const now = performance.now();
    state.pressedKeys.forEach((_, noteIndex) => {
      const lastEmit = this.emitCooldowns.get(noteIndex) || 0;
      if (now - lastEmit > 60) {
        this.emitFromNote(noteIndex, 3);
        this.emitCooldowns.set(noteIndex, now);
      }
    });

    const freqData = this.audioEngine.getFrequencyData();
    const lowBand = this.audioEngine.getBandEnergy(20, 250);
    const midBand = this.audioEngine.getBandEnergy(250, 2000);
    const highBand = this.audioEngine.getBandEnergy(2000, 16000);
    const globalAmp = this.audioEngine.getAverageAmplitude();

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt * windMult;

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      const t = p.life;
      const spiralT = t * 2 + p.seed;
      const spiralR = 0.2 + t * 0.8;
      const spiralX = Math.cos(spiralT) * spiralR * 0.3;
      const spiralZ = Math.sin(spiralT) * spiralR * 0.3;

      const wind = new THREE.Vector3(
        Math.sin(t * 1.5 + p.seed) * 0.15 * windMult,
        0.25 + globalAmp * 0.6,
        Math.cos(t * 1.2 + p.seed) * 0.1 * windMult
      );

      p.vel.add(wind.multiplyScalar(dt));
      p.vel.multiplyScalar(0.985);

      p.pos.x += p.vel.x * dt + spiralX * dt;
      p.pos.y += p.vel.y * dt;
      p.pos.z += p.vel.z * dt + spiralZ * dt;

      p.vel.x += spiralX * dt * 0.5;
      p.vel.z += spiralZ * dt * 0.5;
    }

    while (this.particles.length > this.maxParticles) {
      this.particles.shift();
    }

    const drawCount = Math.min(this.particles.length, this.positions.length / 3);
    const geo = this.points.geometry;

    const neededLen = Math.max(500, drawCount) * 3;
    if (this.positions.length < neededLen) {
      const newSize = Math.max(neededLen, 1000 * 3);
      this.positions = new Float32Array(newSize);
      this.colors = new Float32Array(newSize);
      this.sizes = new Float32Array(newSize / 3);
      geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
      geo.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));
    }

    for (let i = 0; i < drawCount; i++) {
      const p = this.particles[i];
      const lifeRatio = p.life / p.maxLife;
      const alphaMod = lifeRatio < 0.15 ? lifeRatio / 0.15 : (1 - lifeRatio);

      this.positions[i * 3] = p.pos.x;
      this.positions[i * 3 + 1] = p.pos.y;
      this.positions[i * 3 + 2] = p.pos.z;

      const c = p.color.clone();
      if (globalAmp > 0.1) {
        if (p.frequency < 330) c.offsetHSL(0, 0, lowBand * 0.15);
        else if (p.frequency < 660) c.offsetHSL(0, 0, midBand * 0.12);
        else c.offsetHSL(0, 0, highBand * 0.18);
      }

      this.colors[i * 3] = c.r * alphaMod;
      this.colors[i * 3 + 1] = c.g * alphaMod;
      this.colors[i * 3 + 2] = c.b * alphaMod;

      this.sizes[i] = p.size * (1 + globalAmp * 0.8) * alphaMod;
    }

    (geo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (geo.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    (geo.attributes.size as THREE.BufferAttribute).needsUpdate = true;
    geo.setDrawRange(0, drawCount);
    (this.points.material as THREE.PointsMaterial).opacity = 0.85 + globalAmp * 0.15;

    this.updateConnections(drawCount);
    void freqData;
  }

  private updateConnections(drawCount: number) {
    if (!this.connectionLines) return;
    let connIndex = 0;
    const maxPairs = this.maxConnections;

    const distSq = this.connectionDistance * this.connectionDistance;

    for (let i = 0; i < drawCount && connIndex < maxPairs; i++) {
      const p1 = this.particles[i];
      const lifeRatio1 = 1 - p1.life / p1.maxLife;
      if (lifeRatio1 < 0.2) continue;

      for (let j = i + 1; j < Math.min(i + 40, drawCount) && connIndex < maxPairs; j++) {
        const p2 = this.particles[j];
        const dx = p1.pos.x - p2.pos.x;
        const dy = p1.pos.y - p2.pos.y;
        const dz = p1.pos.z - p2.pos.z;
        const dSq = dx * dx + dy * dy + dz * dz;

        if (dSq < distSq) {
          const lifeRatio2 = 1 - p2.life / p2.maxLife;
          const strength = (1 - dSq / distSq) * Math.min(lifeRatio1, lifeRatio2);

          const vi = connIndex * 6;

          this.connectionPositions[vi] = p1.pos.x;
          this.connectionPositions[vi + 1] = p1.pos.y;
          this.connectionPositions[vi + 2] = p1.pos.z;
          this.connectionPositions[vi + 3] = p2.pos.x;
          this.connectionPositions[vi + 4] = p2.pos.y;
          this.connectionPositions[vi + 5] = p2.pos.z;

          this.connectionColors[vi] = p1.color.r * strength;
          this.connectionColors[vi + 1] = p1.color.g * strength;
          this.connectionColors[vi + 2] = p1.color.b * strength;
          this.connectionColors[vi + 3] = p2.color.r * strength;
          this.connectionColors[vi + 4] = p2.color.g * strength;
          this.connectionColors[vi + 5] = p2.color.b * strength;

          connIndex++;
        }
      }
    }

    const connGeo = this.connectionLines.geometry;
    (connGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (connGeo.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    connGeo.setDrawRange(0, connIndex * 2);
  }

  resizeBuffers(newMax: number) {
    this.maxParticles = newMax;
  }
}
