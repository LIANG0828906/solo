import * as THREE from 'three';
import { NoiseField } from './noiseField';
import type { EasingFunction } from './shapeManager';

export class ParticleSystem {
  private scene: THREE.Scene;
  private count: number;
  private noiseField: NoiseField;

  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial | null = null;
  private points: THREE.Points | null = null;

  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;
  private basePositions: Float32Array;
  private startPositions: Float32Array;
  private targetPositions: Float32Array;

  private trailPositions: Float32Array[];
  private trailCount: number = 5;
  private trailAlpha: number = 0.18;
  private trailFadeTime: number = 1.5;

  private transitioning: boolean = false;
  private transitionStart: number = 0;
  private transitionDuration: number = 3000;
  private easing: EasingFunction = (t) => t;

  private positionAttr: THREE.BufferAttribute;
  private colorAttr: THREE.BufferAttribute;
  private sizeAttr: THREE.BufferAttribute;

  private colorLUT: Float32Array;
  private lutSize: number = 256;

  private velocityDecay: number = 0.9;
  private noiseInfluence: number = 0.3;
  private targetInfluence: number = 0.12;

  private velocities: Float32Array;

  constructor(scene: THREE.Scene, count: number, noiseField: NoiseField, initialPositions: Float32Array) {
    this.scene = scene;
    this.count = count;
    this.noiseField = noiseField;

    this.positions = new Float32Array(count * 3);
    this.colors = new Float32Array(count * 3);
    this.sizes = new Float32Array(count);
    this.basePositions = new Float32Array(initialPositions);
    this.startPositions = new Float32Array(initialPositions);
    this.targetPositions = new Float32Array(initialPositions);
    this.velocities = new Float32Array(count * 3);

    this.trailPositions = [];
    for (let i = 0; i < this.trailCount; i++) {
      this.trailPositions.push(new Float32Array(count * 3));
    }

    this.colorLUT = this.buildColorLUT();
    this.initParticles();

    this.geometry = new THREE.BufferGeometry();
    this.positionAttr = new THREE.BufferAttribute(this.positions, 3);
    this.colorAttr = new THREE.BufferAttribute(this.colors, 3);
    this.sizeAttr = new THREE.BufferAttribute(this.sizes, 1);

    this.positionAttr.setUsage(THREE.DynamicDrawUsage);
    this.colorAttr.setUsage(THREE.DynamicDrawUsage);
    this.sizeAttr.setUsage(THREE.StaticDrawUsage);

    this.geometry.setAttribute('position', this.positionAttr);
    this.geometry.setAttribute('color', this.colorAttr);
    this.geometry.setAttribute('size', this.sizeAttr);

    this.createMaterial();
    this.createPoints();
    this.createTrail();
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const h = hex.replace('#', '');
    return {
      r: parseInt(h.substring(0, 2), 16) / 255,
      g: parseInt(h.substring(2, 4), 16) / 255,
      b: parseInt(h.substring(4, 6), 16) / 255
    };
  }

  private buildColorLUT(): Float32Array {
    const lut = new Float32Array(this.lutSize * 3);
    const stops = [
      { pos: 0.0, color: this.hexToRgb('#FF4500') },
      { pos: 0.3, color: this.hexToRgb('#FF8C00') },
      { pos: 0.5, color: this.hexToRgb('#FFD700') },
      { pos: 0.65, color: this.hexToRgb('#00BFFF') },
      { pos: 1.0, color: this.hexToRgb('#E0FFFF') }
    ];

    for (let i = 0; i < this.lutSize; i++) {
      const t = i / (this.lutSize - 1);
      let s1 = stops[0], s2 = stops[stops.length - 1];
      for (let j = 0; j < stops.length - 1; j++) {
        if (t >= stops[j].pos && t <= stops[j + 1].pos) {
          s1 = stops[j];
          s2 = stops[j + 1];
          break;
        }
      }
      const range = s2.pos - s1.pos;
      const localT = range === 0 ? 0 : (t - s1.pos) / range;
      lut[i * 3] = s1.color.r + (s2.color.r - s1.color.r) * localT;
      lut[i * 3 + 1] = s1.color.g + (s2.color.g - s1.color.g) * localT;
      lut[i * 3 + 2] = s1.color.b + (s2.color.b - s1.color.b) * localT;
    }
    return lut;
  }

  private sampleColorLUT(t: number): { r: number; g: number; b: number } {
    const clamped = Math.max(0, Math.min(1, t));
    const idx = clamped * (this.lutSize - 1);
    const i0 = Math.floor(idx);
    const i1 = Math.min(this.lutSize - 1, i0 + 1);
    const f = idx - i0;
    return {
      r: this.colorLUT[i0 * 3] + (this.colorLUT[i1 * 3] - this.colorLUT[i0 * 3]) * f,
      g: this.colorLUT[i0 * 3 + 1] + (this.colorLUT[i1 * 3 + 1] - this.colorLUT[i0 * 3 + 1]) * f,
      b: this.colorLUT[i0 * 3 + 2] + (this.colorLUT[i1 * 3 + 2] - this.colorLUT[i0 * 3 + 2]) * f
    };
  }

  private initParticles(): void {
    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      this.positions[i3] = this.basePositions[i3] + (Math.random() - 0.5) * 0.1;
      this.positions[i3 + 1] = this.basePositions[i3 + 1] + (Math.random() - 0.5) * 0.1;
      this.positions[i3 + 2] = this.basePositions[i3 + 2] + (Math.random() - 0.5) * 0.1;

      this.sizes[i] = 2 + Math.random() * 2;

      const colorT = (i / this.count + Math.random() * 0.05) % 1;
      const c = this.sampleColorLUT(colorT);
      this.colors[i3] = c.r;
      this.colors[i3 + 1] = c.g;
      this.colors[i3 + 2] = c.b;

      this.velocities[i3] = 0;
      this.velocities[i3 + 1] = 0;
      this.velocities[i3 + 2] = 0;

      for (let t = 0; t < this.trailCount; t++) {
        this.trailPositions[t][i3] = this.positions[i3];
        this.trailPositions[t][i3 + 1] = this.positions[i3 + 1];
        this.trailPositions[t][i3 + 2] = this.positions[i3 + 2];
      }
    }
  }

  private createMaterial(): void {
    this.material = new THREE.PointsMaterial({
      size: 1,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true
    });

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.3, 'rgba(255,255,255,0.6)');
    gradient.addColorStop(0.6, 'rgba(255,255,255,0.15)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    this.material.map = texture;
    this.material.alphaTest = 0.01;
  }

  private createPoints(): void {
    this.points = new THREE.Points(this.geometry, this.material!);
    this.points.frustumCulled = false;
    this.scene.add(this.points);
  }

  private createTrail(): void {
    for (let t = 0; t < this.trailCount; t++) {
      const trailGeo = new THREE.BufferGeometry();
      const trailPos = new THREE.BufferAttribute(new Float32Array(this.trailPositions[t]), 3);
      const trailCol = new THREE.BufferAttribute(new Float32Array(this.count * 3), 3);
      const trailSize = new THREE.BufferAttribute(new Float32Array(this.count), 1);

      trailPos.setUsage(THREE.DynamicDrawUsage);
      trailCol.setUsage(THREE.DynamicDrawUsage);
      trailSize.setUsage(THREE.StaticDrawUsage);

      for (let i = 0; i < this.count; i++) {
        trailSize.array[i] = this.sizes[i] * 0.7;
      }

      trailGeo.setAttribute('position', trailPos);
      trailGeo.setAttribute('color', trailCol);
      trailGeo.setAttribute('size', trailSize);

      const alpha = this.trailAlpha * (1 - t / this.trailCount);
      const trailMat = new THREE.PointsMaterial({
        size: 1,
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
        opacity: alpha,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: true,
        map: this.material!.map
      });

      const trailPoints = new THREE.Points(trailGeo, trailMat);
      trailPoints.frustumCulled = false;
      trailPoints.userData.isTrail = true;
      trailPoints.userData.trailIndex = t;
      this.scene.add(trailPoints);
    }
  }

  setTargetPositions(
    vertices: Float32Array,
    duration: number,
    easing: EasingFunction,
    nowTime: number
  ): void {
    if (vertices.length < this.count * 3) return;

    this.startPositions.set(this.positions);
    this.targetPositions.set(vertices.subarray(0, this.count * 3));

    this.transitioning = true;
    this.transitionStart = nowTime;
    this.transitionDuration = duration;
    this.easing = easing;
  }

  update(deltaTime: number, elapsedTimeMs: number, elapsedSeconds: number): void {
    const dt = Math.min(deltaTime, 0.05);

    if (this.transitioning) {
      const progress = (elapsedTimeMs - this.transitionStart) / this.transitionDuration;
      if (progress >= 1) {
        this.transitioning = false;
        this.basePositions.set(this.targetPositions);
      }
    }

    const transitionT = this.transitioning
      ? this.easing(Math.min(1, (elapsedTimeMs - this.transitionStart) / this.transitionDuration))
      : 1;

    for (let t = this.trailCount - 1; t > 0; t--) {
      this.trailPositions[t].set(this.trailPositions[t - 1]);
    }
    this.trailPositions[0].set(this.positions);

    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;

      const sx = this.startPositions[i3];
      const sy = this.startPositions[i3 + 1];
      const sz = this.startPositions[i3 + 2];
      const tx = this.targetPositions[i3];
      const ty = this.targetPositions[i3 + 1];
      const tz = this.targetPositions[i3 + 2];

      const bx = sx + (tx - sx) * transitionT;
      const by = sy + (ty - sy) * transitionT;
      const bz = sz + (tz - sz) * transitionT;

      this.basePositions[i3] = bx;
      this.basePositions[i3 + 1] = by;
      this.basePositions[i3 + 2] = bz;

      const noise = this.noiseField.sample(
        this.positions[i3],
        this.positions[i3 + 1],
        this.positions[i3 + 2],
        elapsedSeconds
      );

      const toTargetX = bx - this.positions[i3];
      const toTargetY = by - this.positions[i3 + 1];
      const toTargetZ = bz - this.positions[i3 + 2];

      this.velocities[i3] = this.velocities[i3] * this.velocityDecay
        + noise.vx * this.noiseInfluence * dt * 60
        + toTargetX * this.targetInfluence;
      this.velocities[i3 + 1] = this.velocities[i3 + 1] * this.velocityDecay
        + noise.vy * this.noiseInfluence * dt * 60
        + toTargetY * this.targetInfluence;
      this.velocities[i3 + 2] = this.velocities[i3 + 2] * this.velocityDecay
        + noise.vz * this.noiseInfluence * dt * 60
        + toTargetZ * this.targetInfluence;

      this.positions[i3] += this.velocities[i3] * dt * 60 * 0.016;
      this.positions[i3 + 1] += this.velocities[i3 + 1] * dt * 60 * 0.016;
      this.positions[i3 + 2] += this.velocities[i3 + 2] * dt * 60 * 0.016;

      const yy = by;
      const shapeT = Math.max(0, Math.min(1, (yy + 2) / 4));
      const idxT = (i / this.count) * 0.3 + shapeT * 0.7;
      const color = this.sampleColorLUT(idxT);

      const speed = Math.sqrt(
        this.velocities[i3] * this.velocities[i3] +
        this.velocities[i3 + 1] * this.velocities[i3 + 1] +
        this.velocities[i3 + 2] * this.velocities[i3 + 2]
      );
      const brightness = 0.45 + Math.min(speed * 0.06, 0.25);

      this.colors[i3] = Math.min(1, color.r * brightness);
      this.colors[i3 + 1] = Math.min(1, color.g * brightness);
      this.colors[i3 + 2] = Math.min(1, color.b * brightness);
    }

    this.positionAttr.needsUpdate = true;
    this.colorAttr.needsUpdate = true;

    const sceneChildren = this.scene.children;
    let trailIdx = 0;
    for (let c = 0; c < sceneChildren.length; c++) {
      const obj = sceneChildren[c];
      if (obj.userData.isTrail === true) {
        const ti = obj.userData.trailIndex as number;
        const geo = (obj as THREE.Points).geometry as THREE.BufferGeometry;
        const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
        const colAttr = geo.getAttribute('color') as THREE.BufferAttribute;
        (posAttr.array as Float32Array).set(this.trailPositions[ti]);
        for (let i = 0; i < this.count; i++) {
          const i3 = i * 3;
          (colAttr.array as Float32Array)[i3] = this.colors[i3];
          (colAttr.array as Float32Array)[i3 + 1] = this.colors[i3 + 1];
          (colAttr.array as Float32Array)[i3 + 2] = this.colors[i3 + 2];
        }
        posAttr.needsUpdate = true;
        colAttr.needsUpdate = true;
        trailIdx++;
      }
    }
  }

  dispose(): void {
    if (this.points) {
      this.scene.remove(this.points);
      this.geometry.dispose();
      if (this.material) {
        if (this.material.map) this.material.map.dispose();
        this.material.dispose();
      }
    }

    const toRemove: THREE.Object3D[] = [];
    this.scene.traverse((obj) => {
      if (obj.userData.isTrail === true) {
        toRemove.push(obj);
      }
    });
    toRemove.forEach((obj) => {
      this.scene.remove(obj);
      const p = obj as THREE.Points;
      p.geometry.dispose();
      (p.material as THREE.Material).dispose();
    });
  }
}
