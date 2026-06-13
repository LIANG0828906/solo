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
  private displayMode: DisplayMode = 'particles';
  private lastDisplayMode: DisplayMode = 'particles';
  private modeTransitionProgress: number = 1;

  private beatExplosionActive: boolean = false;
  private beatExplosionTime: number = 0;
  private beatExplosionDuration: number = 0.4;
  private beatExplosionEnergy: number = 0;
  private explosionPositions: Float32Array;

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
  private frameTimeWindow: number = 30;

  private barsMaterial: THREE.LineBasicMaterial | null = null;

  constructor(camera: THREE.PerspectiveCamera, initialCount: number = 2000) {
    this.camera = camera;
    this.particleCount = initialCount;
    this.group = new THREE.Group();

    this.positions = new Float32Array(this.particleCount * 3);
    this.colors = new Float32Array(this.particleCount * 3);
    this.sizes = new Float32Array(this.particleCount);
    this.explosionPositions = new Float32Array(this.particleCount * 3);

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

      this.explosionPositions[i * 3] = 0;
      this.explosionPositions[i * 3 + 1] = 0;
      this.explosionPositions[i * 3 + 2] = 0;
    }
  }

  private initStandbyPositions(): void {
    for (let i = 0; i < this.particleCount; i++) {
      const p = this.particles[i];
      const standbyR = 3.5;
      const angle = (i / this.particleCount) * Math.PI * 2;
      const y = (Math.random() - 0.5) * 0.5;
      const r = standbyR * Math.cos(Math.asin(y / standbyR));
      
      this.positions[i * 3] = Math.cos(angle) * r;
      this.positions[i * 3 + 1] = y;
      this.positions[i * 3 + 2] = Math.sin(angle) * r;

      const color = new THREE.Color().setHSL(240 / 360, 0.8, 0.6);
      this.colors[i * 3] = color.r;
      this.colors[i * 3 + 1] = color.g;
      this.colors[i * 3 + 2] = color.b;

      this.sizes[i] = 0.08;
    }
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
  }

  private createSpectrumBars(): void {
    const binCount = 256;
    const barWidth = 1 / binCount;
    const spacing = 1 / (binCount - 1);
    const maxHeight = 3;
    const yTop = 9;

    const positions: number[] = [];
    const colors: number[] = [];

    for (let i = 0; i < binCount; i++) {
      const x = (i / (binCount - 1)) * 16 - 8;
      const hue = (i / binCount) * 240 / 360;
      const color = new THREE.Color().setHSL(1 - hue, 0.9, 0.6);

      positions.push(x, yTop, 0, x, yTop, 0);
      colors.push(color.r, color.g, color.b, color.r, color.g, color.b);
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    this.barsMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      linewidth: 1,
      blending: THREE.AdditiveBlending
    });

    this.spectrumBars = new THREE.LineSegments(geom, this.barsMaterial);
    this.spectrumBars.visible = false;
    this.group.add(this.spectrumBars);
  }

  public updateSpectrumBars(freqData: Float32Array): void {
    if (!this.spectrumBars || !this.barsMaterial) return;

    const positions = this.spectrumBars.geometry.attributes.position.array as Float32Array;
    const colors = this.spectrumBars.geometry.attributes.color.array as Float32Array;
    const binCount = 256;
    const yTop = 9;
    const hueBase = this.currentHue / 360;

    for (let i = 0; i < binCount; i++) {
      const amplitude = freqData[i] || 0;
      const height = amplitude * 3;
      const baseY = yTop;
      const topY = yTop + height;
      const x = (i / (binCount - 1)) * 16 - 8;

      positions[i * 6] = x;
      positions[i * 6 + 1] = baseY;
      positions[i * 6 + 2] = 0;
      positions[i * 6 + 3] = x;
      positions[i * 6 + 4] = topY;
      positions[i * 6 + 5] = 0;

      const barHue = (hueBase + (i / binCount) * 0.3) % 1;
      const color = new THREE.Color().setHSL(1 - barHue, 0.9, 0.5 + amplitude * 0.3);
      colors[i * 6] = color.r;
      colors[i * 6 + 1] = color.g;
      colors[i * 6 + 2] = color.b;
      colors[i * 6 + 3] = color.r;
      colors[i * 6 + 4] = color.g;
      colors[i * 6 + 5] = color.b;
    }

    this.spectrumBars.geometry.attributes.position.needsUpdate = true;
    this.spectrumBars.geometry.attributes.color.needsUpdate = true;

    let targetOpacity = 0;
    if (this.displayMode === 'bars') targetOpacity = 1;
    else if (this.displayMode === 'mixed') targetOpacity = 0.3;
    
    this.barsMaterial.opacity = THREE.MathUtils.lerp(this.barsMaterial.opacity, targetOpacity, 0.05);
    this.spectrumBars.visible = this.barsMaterial.opacity > 0.01;
  }

  public update(data: AudioFrameData | null, deltaTime: number): number {
    const frameStart = performance.now();

    const smooth = Math.min(1, deltaTime * 6);

    if (data) {
      this.standbyMode = !data.isActive;

      if (data.isActive) {
        this.targetRadius = 1 + Math.pow(data.lowEnergy, 1.5) * 7;
        this.targetRotationSpeed = THREE.MathUtils.lerp(0.5, 3, data.midEnergy);
        this.targetWaveAmplitude = data.totalEnergy;
        this.targetHue = THREE.MathUtils.lerp(240, 0, data.highEnergy);

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

    this.currentRadius = THREE.MathUtils.lerp(this.currentRadius, this.targetRadius, smooth);
    this.currentRotationSpeed = THREE.MathUtils.lerp(this.currentRotationSpeed, this.targetRotationSpeed, smooth * 0.3);
    this.currentWaveAmplitude = THREE.MathUtils.lerp(this.currentWaveAmplitude, this.targetWaveAmplitude, smooth);
    this.currentHue = THREE.MathUtils.lerp(this.currentHue, this.targetHue, 0.3 * deltaTime);

    this.updateBeatExplosion(deltaTime);

    if (this.standbyMode) {
      this.updateStandbyAnimation(deltaTime);
    } else {
      this.updateParticles(deltaTime);
    }

    this.updateParticleDepthSizes();

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;

    if (this.lastDisplayMode !== this.displayMode) {
      this.modeTransitionProgress = 0;
      this.lastDisplayMode = this.displayMode;
    }
    if (this.modeTransitionProgress < 1) {
      this.modeTransitionProgress = Math.min(1, this.modeTransitionProgress + deltaTime);
    }

    const frameTime = performance.now() - frameStart;
    this.recordFrameTime(frameTime);
    return frameTime;
  }

  private updateStandbyAnimation(deltaTime: number): void {
    this.standbyAngle += deltaTime * 0.15;
    const pulse = 2 + Math.sin(this.standbyAngle * 1.3) * 1.5 + 1.5;
    const currentTargetHue = 200 + Math.sin(this.standbyAngle * 0.5) * 40;
    this.currentHue = THREE.MathUtils.lerp(this.currentHue, currentTargetHue, 0.01);
    const hueNorm = this.currentHue / 360;

    for (let i = 0; i < this.particleCount; i++) {
      const t = i / this.particleCount;
      const angle = t * Math.PI * 2 + this.standbyAngle;
      const yOffset = Math.sin(angle * 3 + this.standbyAngle) * 0.3;
      const radius = pulse * Math.cos(Math.asin(Math.min(0.9, yOffset / pulse)));

      this.positions[i * 3] = Math.cos(angle) * radius;
      this.positions[i * 3 + 1] = yOffset;
      this.positions[i * 3 + 2] = Math.sin(angle) * radius;

      const particleHue = (hueNorm + t * 0.1) % 1;
      const color = new THREE.Color().setHSL(particleHue, 0.7, 0.5 + Math.sin(angle * 2) * 0.1);
      this.colors[i * 3] = color.r;
      this.colors[i * 3 + 1] = color.g;
      this.colors[i * 3 + 2] = color.b;
    }

    if (this.barsMaterial) this.barsMaterial.opacity *= 0.95;
    if (this.spectrumBars) this.spectrumBars.visible = (this.barsMaterial?.opacity || 0) > 0.01;
  }

  private updateParticles(deltaTime: number): void {
    this.rotationY += this.currentRotationSpeed * deltaTime;
    this.rotationX += this.currentRotationSpeed * deltaTime * 0.3;

    const hueNorm = this.currentHue / 360;
    const alpha = Math.min(1, 0.2 + this.currentWaveAmplitude * 0.8);
    this.material.opacity = THREE.MathUtils.lerp(this.material.opacity, alpha, 0.05);

    for (let i = 0; i < this.particleCount; i++) {
      const p = this.particles[i];
      
      let theta = p.baseTheta + this.rotationY * (0.8 + Math.sin(p.phase) * 0.4) + p.offsetTheta * 0.1;
      let phi = p.basePhi + this.rotationX * 0.5 + Math.sin(p.phase + this.standbyAngle) * 0.1;
      let radius = p.baseRadius * (this.currentRadius / 3);
      
      radius += Math.sin(p.phase * 2 + this.standbyAngle * 2) * this.currentWaveAmplitude * 0.8;
      
      let x = radius * Math.sin(phi) * Math.cos(theta);
      let y = radius * Math.cos(phi);
      let z = radius * Math.sin(phi) * Math.sin(theta);

      if (this.beatExplosionActive) {
        const t = this.beatExplosionTime / this.beatExplosionDuration;
        const explosionT = this.easeOutCubic(t);
        const ex = this.explosionPositions[i * 3] * explosionT;
        const ey = this.explosionPositions[i * 3 + 1] * explosionT;
        const ez = this.explosionPositions[i * 3 + 2] * explosionT;
        
        x = THREE.MathUtils.lerp(x, ex, 1 - t * 0.5);
        y = THREE.MathUtils.lerp(y, ey, 1 - t * 0.5);
        z = THREE.MathUtils.lerp(z, ez, 1 - t * 0.5);

        const whiten = Math.sin(t * Math.PI);
        const particleHue = (hueNorm + (i / this.particleCount) * 0.15) % 1;
        const baseColor = new THREE.Color().setHSL(particleHue, 0.9, 0.6);
        const r = THREE.MathUtils.lerp(baseColor.r, 1, whiten);
        const g = THREE.MathUtils.lerp(baseColor.g, 1, whiten);
        const b = THREE.MathUtils.lerp(baseColor.b, 1, whiten);
        this.colors[i * 3] = r;
        this.colors[i * 3 + 1] = g;
        this.colors[i * 3 + 2] = b;
      } else {
        const particleHue = (hueNorm + (i / this.particleCount) * 0.15) % 1;
        const saturation = 0.7 + this.currentWaveAmplitude * 0.3;
        const lightness = 0.45 + this.currentWaveAmplitude * 0.3;
        const color = new THREE.Color().setHSL(particleHue, saturation, lightness);
        
        this.colors[i * 3] = THREE.MathUtils.lerp(this.colors[i * 3], color.r, 0.03);
        this.colors[i * 3 + 1] = THREE.MathUtils.lerp(this.colors[i * 3 + 1], color.g, 0.03);
        this.colors[i * 3 + 2] = THREE.MathUtils.lerp(this.colors[i * 3 + 2], color.b, 0.03);
      }

      this.positions[i * 3] = x;
      this.positions[i * 3 + 1] = y;
      this.positions[i * 3 + 2] = z;

      p.phase += deltaTime * (0.5 + Math.random() * 0.5);
    }

    this.standbyAngle += deltaTime;
  }

  private triggerBeatExplosion(energy: number): void {
    this.beatExplosionActive = true;
    this.beatExplosionTime = 0;
    this.beatExplosionEnergy = energy;

    for (let i = 0; i < this.particleCount; i++) {
      const p = this.particles[i];
      const dirTheta = p.baseTheta;
      const dirPhi = p.basePhi;
      const dist = 4 + energy * 8 + Math.random() * 2;
      
      this.explosionPositions[i * 3] = dist * Math.sin(dirPhi) * Math.cos(dirTheta);
      this.explosionPositions[i * 3 + 1] = dist * Math.cos(dirPhi);
      this.explosionPositions[i * 3 + 2] = dist * Math.sin(dirPhi) * Math.sin(dirTheta);
    }
  }

  private updateBeatExplosion(deltaTime: number): void {
    if (!this.beatExplosionActive) return;
    this.beatExplosionTime += deltaTime;
    if (this.beatExplosionTime >= this.beatExplosionDuration) {
      this.beatExplosionActive = false;
    }
  }

  private updateParticleDepthSizes(): void {
    const camPos = this.camera.position;
    for (let i = 0; i < this.particleCount; i++) {
      const dx = this.positions[i * 3] - camPos.x;
      const dy = this.positions[i * 3 + 1] - camPos.y;
      const dz = this.positions[i * 3 + 2] - camPos.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      this.sizes[i] = 0.05 + Math.max(0, (30 - dist) / 30) * 0.12;
    }
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  public setDisplayMode(mode: DisplayMode): void {
    this.displayMode = mode;
    if (mode === 'particles') {
      this.targetHue = this.currentHue;
    }
  }

  public getDisplayMode(): DisplayMode {
    return this.displayMode;
  }

  public resetParticles(): void {
    this.currentRadius = 3;
    this.targetRadius = 3;
    this.currentRotationSpeed = 0.5;
    this.targetRotationSpeed = 0.5;
    this.beatExplosionActive = false;
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
    const newExplosion = new Float32Array(newCount * 3);
    
    newPositions.set(this.positions.slice(0, newCount * 3));
    newColors.set(this.colors.slice(0, newCount * 3));
    newSizes.set(this.sizes.slice(0, newCount));
    newExplosion.set(this.explosionPositions.slice(0, newCount * 3));
    
    this.positions = newPositions;
    this.colors = newColors;
    this.sizes = newSizes;
    this.explosionPositions = newExplosion;
    
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

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
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
