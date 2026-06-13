import * as THREE from 'three';
import { AudioFrameData } from './audioEngine';

export type DisplayMode = 'bars' | 'particles' | 'mixed';

interface ParticleData {
  baseTheta: number;
  basePhi: number;
  baseRadius: number;
  offsetTheta: number;
  offsetPhi: number;
  hue: number;
  phase: number;
}

interface BeatState {
  active: boolean;
  time: number;
  duration: number;
  energy: number;
  explosionDirX: Float32Array;
  explosionDirY: Float32Array;
  explosionDirZ: Float32Array;
  preBeatPositions: Float32Array;
  explosionDistances: Float32Array;
}

interface ResetState {
  active: boolean;
  startTime: number;
  duration: number;
  startPositions: Float32Array;
  targetPositions: Float32Array;
}

const SPECTRUM_BIN_COUNT = 256;
const COLOR_CHANGE_RATE = 0.3;

export class ParticleSystem {
  public points: THREE.Points;
  public spectrumBars: THREE.LineSegments | null = null;
  public group: THREE.Group;

  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private particleCount: number;
  private particles: ParticleData[] = [];
  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;

  private currentHue: number = 240;
  private targetHue: number = 240;
  private barsHue: number = 240;
  private barsTargetHue: number = 240;
  private displayMode: DisplayMode = 'particles';

  private beat: BeatState;
  private reset: ResetState;

  private currentRadius: number = 3;
  private targetRadius: number = 3;
  private currentRotationSpeed: number = 0.5;
  private targetRotationSpeed: number = 0.5;
  private currentWaveAmplitude: number = 0;
  private targetWaveAmplitude: number = 0;

  private rotationY: number = 0;
  private rotationX: number = 0;

  private standbyMode: boolean = true;
  private standbyAngle: number = 0;

  private camera: THREE.PerspectiveCamera;
  private frameTimes: number[] = [];
  private frameTimeWindow: number = 60;

  private barsMaterial: THREE.LineBasicMaterial | null = null;
  private barsOpacity: number = 0;
  private barsTargetOpacity: number = 0;
  private particlesOpacity: number = 1;
  private particlesTargetOpacity: number = 1;

  constructor(camera: THREE.PerspectiveCamera, initialCount: number = 2000) {
    this.camera = camera;
    this.particleCount = initialCount;
    this.group = new THREE.Group();

    this.positions = new Float32Array(this.particleCount * 3);
    this.colors = new Float32Array(this.particleCount * 3);
    this.sizes = new Float32Array(this.particleCount);

    this.beat = {
      active: false,
      time: 0,
      duration: 0.4,
      energy: 0,
      explosionDirX: new Float32Array(this.particleCount),
      explosionDirY: new Float32Array(this.particleCount),
      explosionDirZ: new Float32Array(this.particleCount),
      preBeatPositions: new Float32Array(this.particleCount * 3),
      explosionDistances: new Float32Array(this.particleCount)
    };

    this.reset = {
      active: false,
      startTime: 0,
      duration: 1000,
      startPositions: new Float32Array(this.particleCount * 3),
      targetPositions: new Float32Array(this.particleCount * 3)
    };

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    this.material = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      sizeAttenuation: true,
      fog: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.group.add(this.points);

    this.initParticles();
    this.initStandbyPositions();
    this.createSpectrumBars();
  }

  private initParticles(): void {
    for (let i = 0; i < this.particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 2 + Math.random() * 3;

      this.particles.push({
        baseTheta: theta,
        basePhi: phi,
        baseRadius: radius,
        offsetTheta: Math.random() * Math.PI * 2,
        offsetPhi: Math.random() * Math.PI * 2,
        hue: 240,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  private initStandbyPositions(): void {
    for (let i = 0; i < this.particleCount; i++) {
      const t = i / this.particleCount;
      const standbyR = 3.5;
      const angle = t * Math.PI * 2;
      const y = (Math.random() - 0.5) * 0.3;
      const r = standbyR * Math.cos(Math.asin(Math.min(0.9, y / standbyR)));

      this.positions[i * 3] = Math.cos(angle) * r;
      this.positions[i * 3 + 1] = y;
      this.positions[i * 3 + 2] = Math.sin(angle) * r;

      const color = new THREE.Color().setHSL(240 / 360, 0.7, 0.55);
      this.colors[i * 3] = color.r;
      this.colors[i * 3 + 1] = color.g;
      this.colors[i * 3 + 2] = color.b;

      this.sizes[i] = 0.07;
    }
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
  }

  private createSpectrumBars(): void {
    const binCount = SPECTRUM_BIN_COUNT;
    const yBase = 9;

    const positions = new Float32Array(binCount * 6);
    const colors = new Float32Array(binCount * 6);

    for (let i = 0; i < binCount; i++) {
      const x = (i / (binCount - 1)) * 16 - 8;
      const hue = 240 / 360;
      const color = new THREE.Color().setHSL(1 - hue, 0.9, 0.6);

      positions[i * 6] = x;
      positions[i * 6 + 1] = yBase;
      positions[i * 6 + 2] = 0;
      positions[i * 6 + 3] = x;
      positions[i * 6 + 4] = yBase;
      positions[i * 6 + 5] = 0;

      colors[i * 6] = color.r;
      colors[i * 6 + 1] = color.g;
      colors[i * 6 + 2] = color.b;
      colors[i * 6 + 3] = color.r;
      colors[i * 6 + 4] = color.g;
      colors[i * 6 + 5] = color.b;
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.barsMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0,
      linewidth: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.spectrumBars = new THREE.LineSegments(geom, this.barsMaterial);
    this.spectrumBars.visible = false;
    this.group.add(this.spectrumBars);
  }

  public triggerResetParticles(durationMs: number = 1000): void {
    this.reset.active = true;
    this.reset.startTime = performance.now();
    this.reset.duration = durationMs;

    for (let i = 0; i < this.particleCount; i++) {
      const p = this.particles[i];
      this.reset.startPositions[i * 3] = this.positions[i * 3];
      this.reset.startPositions[i * 3 + 1] = this.positions[i * 3 + 1];
      this.reset.startPositions[i * 3 + 2] = this.positions[i * 3 + 2];

      const r = p.baseRadius;
      this.reset.targetPositions[i * 3] = r * Math.sin(p.basePhi) * Math.cos(p.baseTheta);
      this.reset.targetPositions[i * 3 + 1] = r * Math.cos(p.basePhi);
      this.reset.targetPositions[i * 3 + 2] = r * Math.sin(p.basePhi) * Math.sin(p.baseTheta);
    }
  }

  public updateSpectrumBars(freqData: Float32Array): void {
    if (!this.spectrumBars || !this.barsMaterial) return;

    const positions = this.spectrumBars.geometry.attributes.position.array as Float32Array;
    const colors = this.spectrumBars.geometry.attributes.color.array as Float32Array;
    const binCount = SPECTRUM_BIN_COUNT;
    const yBase = 9;
    const hueNorm = this.barsHue / 360;

    for (let i = 0; i < binCount; i++) {
      const idx = Math.floor(i * freqData.length / binCount);
      const amplitude = freqData[idx] || 0;
      const height = amplitude * amplitude * 3.5;
      const x = (i / (binCount - 1)) * 16 - 8;

      positions[i * 6] = x;
      positions[i * 6 + 1] = yBase;
      positions[i * 6 + 2] = 0;
      positions[i * 6 + 3] = x;
      positions[i * 6 + 4] = yBase + height;
      positions[i * 6 + 5] = 0;

      const barHue = (hueNorm + (i / binCount) * 0.28) % 1;
      const color = new THREE.Color().setHSL(
        1 - barHue,
        0.9,
        0.45 + amplitude * 0.4
      );
      colors[i * 6] = color.r;
      colors[i * 6 + 1] = color.g;
      colors[i * 6 + 2] = color.b;
      colors[i * 6 + 3] = color.r;
      colors[i * 6 + 4] = color.g;
      colors[i * 6 + 5] = color.b;
    }

    this.spectrumBars.geometry.attributes.position.needsUpdate = true;
    this.spectrumBars.geometry.attributes.color.needsUpdate = true;
  }

  public update(data: AudioFrameData | null, deltaTime: number): number {
    const frameStart = performance.now();
    const dt = Math.min(0.05, deltaTime);
    const smoothing = 1 - Math.exp(-dt * 6);

    if (data) {
      this.standbyMode = !data.isActive;

      if (data.isActive) {
        this.targetRadius = 1 + Math.pow(Math.max(0, data.lowEnergy), 1.5) * 7;
        this.targetRotationSpeed = 0.5 + THREE.MathUtils.clamp(data.midEnergy, 0, 1) * 2.5;
        this.targetWaveAmplitude = THREE.MathUtils.clamp(data.totalEnergy, 0, 1);
        this.targetHue = 240 - THREE.MathUtils.clamp(data.highEnergy, 0, 1) * 240;
        this.barsTargetHue = this.targetHue;

        if (data.beatDetected) {
          this.triggerBeatExplosion(data.beatEnergy);
        }

        this.updateSpectrumBars(data.frequencyData);
      } else {
        this.targetRadius = 3;
        this.targetRotationSpeed = 0.2;
        this.targetWaveAmplitude = 0;
      }
    } else {
      this.standbyMode = true;
      this.targetRadius = 3;
      this.targetRotationSpeed = 0.2;
      this.targetWaveAmplitude = 0;
    }

    this.currentRadius = THREE.MathUtils.lerp(this.currentRadius, this.targetRadius, smoothing);
    this.currentRotationSpeed = THREE.MathUtils.lerp(this.currentRotationSpeed, this.targetRotationSpeed, smoothing * 0.3);
    this.currentWaveAmplitude = THREE.MathUtils.lerp(this.currentWaveAmplitude, this.targetWaveAmplitude, smoothing);

    const hueDelta = this.targetHue - this.currentHue;
    this.currentHue += hueDelta * COLOR_CHANGE_RATE * dt * 60;

    const barsHueDelta = this.barsTargetHue - this.barsHue;
    this.barsHue += barsHueDelta * COLOR_CHANGE_RATE * dt * 60;

    this.updateModeTransition(dt);
    this.updateBeatExplosion(dt);
    this.updateResetParticles();

    if (this.reset.active) {
      // 重置动画在 updateResetParticles 中处理
    } else if (this.beat.active) {
      // 节拍爆炸动画在 updateBeatExplosion 中处理
    } else if (this.standbyMode) {
      this.updateStandbyAnimation(dt);
    } else {
      this.updateParticlesAudio(dt);
    }

    this.updateParticleDepthSizes();

    this.material.opacity = THREE.MathUtils.lerp(this.material.opacity, this.particlesOpacity, smoothing);
    if (this.barsMaterial) {
      this.barsMaterial.opacity = THREE.MathUtils.lerp(this.barsMaterial.opacity, this.barsOpacity, smoothing);
      this.spectrumBars!.visible = this.barsMaterial.opacity > 0.02;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;

    const frameTime = performance.now() - frameStart;
    this.recordFrameTime(frameTime);
    return frameTime;
  }

  private updateModeTransition(dt: number): void {
    switch (this.displayMode) {
      case 'bars':
        this.barsTargetOpacity = 1.0;
        this.particlesTargetOpacity = 0.0;
        break;
      case 'particles':
        this.barsTargetOpacity = 0.0;
        this.particlesTargetOpacity = 1.0;
        break;
      case 'mixed':
        this.barsTargetOpacity = 0.3;
        this.particlesTargetOpacity = 1.0;
        break;
    }

    const t = 1 - Math.exp(-dt * 1.2);
    this.barsOpacity = THREE.MathUtils.lerp(this.barsOpacity, this.barsTargetOpacity, t);
    this.particlesOpacity = THREE.MathUtils.lerp(this.particlesOpacity, this.particlesTargetOpacity, t);
  }

  private updateStandbyAnimation(dt: number): void {
    this.standbyAngle += dt * 0.25;
    const pulse = 3.5 + Math.sin(this.standbyAngle * 1.5) * 1.5;
    const targetHueS = 220 + Math.sin(this.standbyAngle * 0.4) * 30;
    this.currentHue = THREE.MathUtils.lerp(this.currentHue, targetHueS, 0.02);
    const hueNorm = this.currentHue / 360;

    const ringTiltY = Math.sin(this.standbyAngle * 0.3) * 0.2;
    const ringTiltX = Math.cos(this.standbyAngle * 0.2) * 0.1;

    for (let i = 0; i < this.particleCount; i++) {
      const p = this.particles[i];
      const baseAngle = (i / this.particleCount) * Math.PI * 2;
      const angle = baseAngle + this.standbyAngle * 0.6;
      const spread = Math.sin(p.phase + this.standbyAngle) * 0.15;

      const ringR = pulse + spread * 0.8;
      const yOnRing = Math.sin(baseAngle * 2 + this.standbyAngle * 0.8) * 0.35;
      const rOnRing = ringR * Math.cos(Math.asin(Math.min(0.95, yOnRing / ringR)));

      let x = Math.cos(angle) * rOnRing;
      let y = yOnRing;
      let z = Math.sin(angle) * rOnRing;

      const cosY = Math.cos(ringTiltY);
      const sinY = Math.sin(ringTiltY);
      const x1 = x * cosY - z * sinY;
      const z1 = x * sinY + z * cosY;

      const cosX = Math.cos(ringTiltX);
      const sinX = Math.sin(ringTiltX);
      const y1 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;

      this.positions[i * 3] = x1;
      this.positions[i * 3 + 1] = y1;
      this.positions[i * 3 + 2] = z2;

      const pHue = (hueNorm + (i / this.particleCount) * 0.12 + Math.sin(this.standbyAngle + i) * 0.03) % 1;
      const light = 0.5 + Math.sin(angle * 3 + this.standbyAngle) * 0.1;
      const color = new THREE.Color().setHSL(pHue, 0.65, light);

      this.colors[i * 3] = THREE.MathUtils.lerp(this.colors[i * 3], color.r, 0.05);
      this.colors[i * 3 + 1] = THREE.MathUtils.lerp(this.colors[i * 3 + 1], color.g, 0.05);
      this.colors[i * 3 + 2] = THREE.MathUtils.lerp(this.colors[i * 3 + 2], color.b, 0.05);

      p.phase += dt * 0.6;
    }

    if (this.barsMaterial) {
      this.barsMaterial.opacity *= Math.pow(0.9, dt * 60);
      this.barsOpacity *= Math.pow(0.9, dt * 60);
    }
  }

  private updateParticlesAudio(dt: number): void {
    this.rotationY += this.currentRotationSpeed * dt;
    this.rotationX += this.currentRotationSpeed * dt * 0.3;

    const hueNorm = this.currentHue / 360;
    const alpha = THREE.MathUtils.clamp(0.15 + this.currentWaveAmplitude * 0.85, 0, 1);
    this.material.opacity = THREE.MathUtils.lerp(this.material.opacity, alpha * this.particlesTargetOpacity, 0.05);

    for (let i = 0; i < this.particleCount; i++) {
      const p = this.particles[i];

      const theta = p.baseTheta
        + this.rotationY * (0.7 + Math.sin(p.phase) * 0.5)
        + p.offsetTheta * 0.08;
      const phi = p.basePhi
        + this.rotationX * 0.45
        + Math.sin(p.phase + this.standbyAngle) * 0.08;
      let radius = p.baseRadius * (this.currentRadius / 3);

      radius += Math.sin(p.phase * 2 + this.standbyAngle * 2.3) * this.currentWaveAmplitude * 1.0;
      radius = THREE.MathUtils.clamp(radius, 0.2, 9);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);

      this.positions[i * 3] = x;
      this.positions[i * 3 + 1] = y;
      this.positions[i * 3 + 2] = z;

      const pHue = (hueNorm + (i / this.particleCount) * 0.16) % 1;
      const saturation = 0.72 + this.currentWaveAmplitude * 0.25;
      const lightness = 0.48 + this.currentWaveAmplitude * 0.32;
      const color = new THREE.Color().setHSL(pHue, saturation, lightness);

      this.colors[i * 3] = THREE.MathUtils.lerp(this.colors[i * 3], color.r, 0.025);
      this.colors[i * 3 + 1] = THREE.MathUtils.lerp(this.colors[i * 3 + 1], color.g, 0.025);
      this.colors[i * 3 + 2] = THREE.MathUtils.lerp(this.colors[i * 3 + 2], color.b, 0.025);

      p.phase += dt * (0.45 + Math.sin(p.baseTheta) * 0.2);
    }

    this.standbyAngle += dt;
  }

  private triggerBeatExplosion(energy: number): void {
    energy = THREE.MathUtils.clamp(energy, 0.1, 1.0);
    this.beat.active = true;
    this.beat.time = 0;
    this.beat.energy = energy;

    for (let i = 0; i < this.particleCount; i++) {
      const p = this.particles[i];
      const theta = p.baseTheta;
      const phi = p.basePhi;

      this.beat.preBeatPositions[i * 3] = this.positions[i * 3];
      this.beat.preBeatPositions[i * 3 + 1] = this.positions[i * 3 + 1];
      this.beat.preBeatPositions[i * 3 + 2] = this.positions[i * 3 + 2];

      const len = 1;
      this.beat.explosionDirX[i] = (Math.sin(phi) * Math.cos(theta)) / len;
      this.beat.explosionDirY[i] = (Math.cos(phi)) / len;
      this.beat.explosionDirZ[i] = (Math.sin(phi) * Math.sin(theta)) / len;

      this.beat.explosionDistances[i] = 5 + energy * 11 + Math.random() * 2.5;
    }
  }

  private updateBeatExplosion(dt: number): void {
    if (!this.beat.active) return;

    this.beat.time += dt;
    const t = THREE.MathUtils.clamp(this.beat.time / this.beat.duration, 0, 1);
    const energy = this.beat.energy;
    const hueNorm = this.currentHue / 360;

    const collapseT = THREE.MathUtils.clamp(t / 0.08, 0, 1);
    const collapseEased = collapseT * collapseT * (3 - 2 * collapseT);

    const explodeT = t < 0.08
      ? 0
      : THREE.MathUtils.clamp((t - 0.08) / (1 - 0.08), 0, 1);
    const explodeEased = 1 - Math.pow(1 - explodeT, 3);

    const whiten = Math.max(0, Math.sin(t * Math.PI));

    for (let i = 0; i < this.particleCount; i++) {
      const pPreX = this.beat.preBeatPositions[i * 3];
      const pPreY = this.beat.preBeatPositions[i * 3 + 1];
      const pPreZ = this.beat.preBeatPositions[i * 3 + 2];

      const dist = this.beat.explosionDistances[i] * explodeEased;
      const ex = this.beat.explosionDirX[i] * dist;
      const ey = this.beat.explosionDirY[i] * dist;
      const ez = this.beat.explosionDirZ[i] * dist;

      const collapsedX = THREE.MathUtils.lerp(pPreX, 0, collapseEased);
      const collapsedY = THREE.MathUtils.lerp(pPreY, 0, collapseEased);
      const collapsedZ = THREE.MathUtils.lerp(pPreZ, 0, collapseEased);

      const finalX = collapsedX + ex * (1 - collapseEased * 0.3);
      const finalY = collapsedY + ey * (1 - collapseEased * 0.3);
      const finalZ = collapsedZ + ez * (1 - collapseEased * 0.3);

      this.positions[i * 3] = finalX;
      this.positions[i * 3 + 1] = finalY;
      this.positions[i * 3 + 2] = finalZ;

      const pHue = (hueNorm + (i / this.particleCount) * 0.15) % 1;
      const baseColor = new THREE.Color().setHSL(pHue, 0.9, 0.6);

      const r = THREE.MathUtils.lerp(baseColor.r, 1, whiten * (0.6 + energy * 0.4));
      const g = THREE.MathUtils.lerp(baseColor.g, 1, whiten * (0.6 + energy * 0.4));
      const b = THREE.MathUtils.lerp(baseColor.b, 1, whiten * (0.6 + energy * 0.4));

      this.colors[i * 3] = r;
      this.colors[i * 3 + 1] = g;
      this.colors[i * 3 + 2] = b;
    }

    if (t >= 1) {
      this.beat.active = false;
      for (let i = 0; i < this.particleCount; i++) {
        const p = this.particles[i];
        this.positions[i * 3] = this.beat.preBeatPositions[i * 3];
        this.positions[i * 3 + 1] = this.beat.preBeatPositions[i * 3 + 1];
        this.positions[i * 3 + 2] = this.beat.preBeatPositions[i * 3 + 2];
        p.phase += Math.random() * 0.5;
      }
    }
  }

  private updateResetParticles(): void {
    if (!this.reset.active) return;

    const elapsed = performance.now() - this.reset.startTime;
    const t = THREE.MathUtils.clamp(elapsed / this.reset.duration, 0, 1);
    const eased = t * t * (3 - 2 * t);

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      this.positions[i3] = THREE.MathUtils.lerp(this.reset.startPositions[i3], this.reset.targetPositions[i3], eased);
      this.positions[i3 + 1] = THREE.MathUtils.lerp(this.reset.startPositions[i3 + 1], this.reset.targetPositions[i3 + 1], eased);
      this.positions[i3 + 2] = THREE.MathUtils.lerp(this.reset.startPositions[i3 + 2], this.reset.targetPositions[i3 + 2], eased);
    }

    if (t >= 1) {
      this.reset.active = false;
      this.rotationY = 0;
      this.rotationX = 0;
      this.currentRadius = 3;
      this.targetRadius = 3;
      this.currentRotationSpeed = 0.5;
      this.targetRotationSpeed = 0.5;
    }
  }

  private updateParticleDepthSizes(): void {
    const camPos = this.camera.position;
    for (let i = 0; i < this.particleCount; i++) {
      const dx = this.positions[i * 3] - camPos.x;
      const dy = this.positions[i * 3 + 1] - camPos.y;
      const dz = this.positions[i * 3 + 2] - camPos.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      this.sizes[i] = 0.045 + Math.max(0, (28 - dist) / 28) * 0.14;
    }
  }

  public setDisplayMode(mode: DisplayMode): void {
    this.displayMode = mode;
  }

  public getDisplayMode(): DisplayMode {
    return this.displayMode;
  }

  public resetParticles(): void {
    this.currentRadius = 3;
    this.targetRadius = 3;
    this.currentRotationSpeed = 0.5;
    this.targetRotationSpeed = 0.5;
    this.beat.active = false;
    this.rotationY = 0;
    this.rotationX = 0;
  }

  public getParticleCount(): number {
    return this.particleCount;
  }

  public reduceParticleCount(amount: number): boolean {
    const newCount = Math.max(500, this.particleCount - amount);
    if (newCount >= this.particleCount) return false;

    this.particleCount = newCount;
    this.particles = this.particles.slice(0, newCount);

    const newPositions = new Float32Array(newCount * 3);
    const newColors = new Float32Array(newCount * 3);
    const newSizes = new Float32Array(newCount);

    newPositions.set(this.positions.slice(0, newCount * 3));
    newColors.set(this.colors.slice(0, newCount * 3));
    newSizes.set(this.sizes.slice(0, newCount));

    this.positions = newPositions;
    this.colors = newColors;
    this.sizes = newSizes;

    const newDirX = new Float32Array(newCount);
    const newDirY = new Float32Array(newCount);
    const newDirZ = new Float32Array(newCount);
    const newPreBeat = new Float32Array(newCount * 3);
    const newDist = new Float32Array(newCount);
    newDirX.set(this.beat.explosionDirX.slice(0, newCount));
    newDirY.set(this.beat.explosionDirY.slice(0, newCount));
    newDirZ.set(this.beat.explosionDirZ.slice(0, newCount));
    newPreBeat.set(this.beat.preBeatPositions.slice(0, newCount * 3));
    newDist.set(this.beat.explosionDistances.slice(0, newCount));
    this.beat.explosionDirX = newDirX;
    this.beat.explosionDirY = newDirY;
    this.beat.explosionDirZ = newDirZ;
    this.beat.preBeatPositions = newPreBeat;
    this.beat.explosionDistances = newDist;

    const newStartR = new Float32Array(newCount * 3);
    const newTargetR = new Float32Array(newCount * 3);
    newStartR.set(this.reset.startPositions.slice(0, newCount * 3));
    newTargetR.set(this.reset.targetPositions.slice(0, newCount * 3));
    this.reset.startPositions = newStartR;
    this.reset.targetPositions = newTargetR;

    this.geometry.dispose();
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    this.points.geometry = this.geometry;
    return true;
  }

  private recordFrameTime(time: number): void {
    this.frameTimes.push(time);
    if (this.frameTimes.length > this.frameTimeWindow) {
      this.frameTimes.shift();
    }
  }

  public getAverageFrameTime(): number {
    if (this.frameTimes.length === 0) return 0;
    return this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    if (this.spectrumBars) {
      this.spectrumBars.geometry.dispose();
      if (this.barsMaterial) this.barsMaterial.dispose();
    }
  }
}

export class OrbitCameraController {
  private camera: THREE.PerspectiveCamera;
  private target: THREE.Vector3;

  private azimuth: number = 0;
  private polar: number = 0;
  private distance: number = 15;

  private initialAzimuth: number = 0;
  private initialPolar: number = 0;
  private initialDistance: number = 15;

  private targetAzimuth: number = 0;
  private targetPolar: number = 0;
  private targetDistance: number = 15;

  private isDragging: boolean = false;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;

  private isResetting: boolean = false;
  private resetStartTime: number = 0;
  private resetDuration: number = 1500;
  private resetStartAzimuth: number = 0;
  private resetStartPolar: number = 0;
  private resetStartDistance: number = 0;

  private minPolar: number = -Math.PI / 3;
  private maxPolar: number = Math.PI / 3;
  private minDistance: number = 2;
  private maxDistance: number = 30;

  private domElement: HTMLElement;
  private listeners: (() => void)[] = [];

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.target = new THREE.Vector3(0, 0, 0);
    this.bindEvents();
    this.updateCameraPosition();
  }

  private bindEvents(): void {
    this.domElement.addEventListener('mousedown', this.onMouseDown);
    this.domElement.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);
    this.domElement.addEventListener('wheel', this.onWheel, { passive: false });
    this.domElement.addEventListener('dblclick', this.onDoubleClick);
    this.domElement.addEventListener('touchstart', this.onTouchStart, { passive: false });
    this.domElement.addEventListener('touchmove', this.onTouchMove, { passive: false });
    this.domElement.addEventListener('touchend', this.onTouchEnd);
  }

  private onMouseDown = (e: MouseEvent): void => {
    if (e.button !== 0) return;
    this.isDragging = true;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
    this.domElement.style.cursor = 'grabbing';
  };

  private onMouseMove = (e: MouseEvent): void => {
    if (!this.isDragging) return;
    const dx = e.clientX - this.lastMouseX;
    const dy = e.clientY - this.lastMouseY;
    this.targetAzimuth -= dx * 0.005;
    this.targetPolar -= dy * 0.005;
    this.clampAngles();
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
    this.isResetting = false;
  };

  private onMouseUp = (): void => {
    this.isDragging = false;
    this.domElement.style.cursor = 'grab';
  };

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    const scale = Math.exp(e.deltaY * 0.001);
    this.targetDistance = THREE.MathUtils.clamp(
      this.targetDistance * scale,
      this.minDistance,
      this.maxDistance
    );
    this.isResetting = false;
  };

  private onDoubleClick = (): void => {
    this.triggerReset(500);
  };

  private onTouchStart = (e: TouchEvent): void => {
    if (e.touches.length !== 1) return;
    e.preventDefault();
    this.isDragging = true;
    this.lastMouseX = e.touches[0].clientX;
    this.lastMouseY = e.touches[0].clientY;
  };

  private onTouchMove = (e: TouchEvent): void => {
    if (!this.isDragging || e.touches.length !== 1) return;
    e.preventDefault();
    const dx = e.touches[0].clientX - this.lastMouseX;
    const dy = e.touches[0].clientY - this.lastMouseY;
    this.targetAzimuth -= dx * 0.005;
    this.targetPolar -= dy * 0.005;
    this.clampAngles();
    this.lastMouseX = e.touches[0].clientX;
    this.lastMouseY = e.touches[0].clientY;
    this.isResetting = false;
  };

  private onTouchEnd = (): void => {
    this.isDragging = false;
  };

  private clampAngles(): void {
    while (this.targetAzimuth > Math.PI) this.targetAzimuth -= Math.PI * 2;
    while (this.targetAzimuth < -Math.PI) this.targetAzimuth += Math.PI * 2;
    this.targetPolar = THREE.MathUtils.clamp(this.targetPolar, this.minPolar, this.maxPolar);
  }

  private smoothstep(e0: number, e1: number, x: number): number {
    const t = THREE.MathUtils.clamp((x - e0) / (e1 - e0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  public triggerReset(duration: number = 1500): void {
    this.isResetting = true;
    this.resetStartTime = performance.now();
    this.resetDuration = duration;
    this.resetStartAzimuth = this.azimuth;
    this.resetStartPolar = this.polar;
    this.resetStartDistance = this.distance;
    this.targetAzimuth = this.initialAzimuth;
    this.targetPolar = this.initialPolar;
    this.targetDistance = this.initialDistance;
    this.notifyListeners();
  }

  public isAnimatingReset(): boolean {
    return this.isResetting;
  }

  public onReset(callback: () => void): void {
    this.listeners.push(callback);
  }

  private notifyListeners(): void {
    for (const cb of this.listeners) cb();
  }

  public update(deltaTime: number): void {
    if (this.isResetting) {
      const elapsed = performance.now() - this.resetStartTime;
      const t = Math.min(1, elapsed / this.resetDuration);
      const eased = this.smoothstep(0, 1, t);

      this.azimuth = THREE.MathUtils.lerp(this.resetStartAzimuth, this.initialAzimuth, eased);
      this.polar = THREE.MathUtils.lerp(this.resetStartPolar, this.initialPolar, eased);
      this.distance = THREE.MathUtils.lerp(this.resetStartDistance, this.initialDistance, eased);

      if (t >= 1) {
        this.isResetting = false;
        this.azimuth = this.initialAzimuth;
        this.polar = this.initialPolar;
        this.distance = this.initialDistance;
      }
    } else {
      const smooth = 1 - Math.exp(-deltaTime * 8);
      this.azimuth = THREE.MathUtils.lerp(this.azimuth, this.targetAzimuth, smooth);
      this.polar = THREE.MathUtils.lerp(this.polar, this.targetPolar, smooth);
      this.distance = THREE.MathUtils.lerp(this.distance, this.targetDistance, smooth);
    }

    this.updateCameraPosition();
  }

  private updateCameraPosition(): void {
    const x = this.distance * Math.cos(this.polar) * Math.sin(this.azimuth);
    const y = this.distance * Math.sin(this.polar);
    const z = this.distance * Math.cos(this.polar) * Math.cos(this.azimuth);

    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.target);
  }

  public dispose(): void {
    this.domElement.removeEventListener('mousedown', this.onMouseDown);
    this.domElement.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
    this.domElement.removeEventListener('wheel', this.onWheel);
    this.domElement.removeEventListener('dblclick', this.onDoubleClick);
    this.domElement.removeEventListener('touchstart', this.onTouchStart);
    this.domElement.removeEventListener('touchmove', this.onTouchMove);
    this.domElement.removeEventListener('touchend', this.onTouchEnd);
  }
}
