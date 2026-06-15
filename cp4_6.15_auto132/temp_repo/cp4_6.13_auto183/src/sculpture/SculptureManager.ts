import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';
import ParticleEffect from '@/effects/ParticleEffect';
import type { GestureData, SculptureMode, ColorTheme } from '@/types';

class SculptureManager {
  scene: THREE.Scene;
  particleCount: number;
  geometry: THREE.BufferGeometry;
  material: THREE.PointsMaterial;
  points: THREE.Points;
  basePositions: Float32Array;
  currentPositions: Float32Array;
  sizes: Float32Array;
  mode: SculptureMode = 'deform';
  expansion: number = 0;
  targetExpansion: number = 0;
  contraction: number = 0;
  targetContraction: number = 0;
  rotationY: number = 0;
  rotationX: number = 0;
  angularVelocityY: number = 0;
  angularVelocityX: number = 0;
  targetRotationY: number = 0;
  targetRotationX: number = 0;
  particleEffect: ParticleEffect;
  okGestureStartTime: number = 0;
  okGestureActive: boolean = false;

  constructor(scene: THREE.Scene, particleCount: number = 6000) {
    this.scene = scene;
    this.particleCount = particleCount;

    this.basePositions = this.generateSpherePositions(particleCount);
    this.currentPositions = new Float32Array(particleCount * 3);
    this.sizes = new Float32Array(particleCount);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.currentPositions, 3));

    this.material = new THREE.PointsMaterial({
      transparent: true,
      depthWrite: false,
      sizeAttenuation: true,
      vertexColors: true,
      size: 0.04
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);

    this.particleEffect = new ParticleEffect(this.geometry, particleCount);
  }

  generateSpherePositions(count: number): Float32Array {
    const positions = new Float32Array(count * 3);
    const phi = Math.PI * (3 - Math.sqrt(5));
    const radius = 1.5;

    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = phi * i;

      const x = Math.cos(theta) * radiusAtY * radius;
      const z = Math.sin(theta) * radiusAtY * radius;
      const yPos = y * radius;

      positions[i * 3] = x;
      positions[i * 3 + 1] = yPos;
      positions[i * 3 + 2] = z;
    }

    return positions;
  }

  handleGestureData(data: GestureData): void {
    if (!data.detected) {
      this.targetExpansion = 0;
      this.targetContraction = 0;
      this.okGestureActive = false;
      return;
    }

    const distance = data.palmDistance;
    const expansionAmount = distance < 80 ? 2 : distance < 150 ? 1 : 0;

    switch (data.gesture) {
      case 'open_palm':
        this.targetExpansion = expansionAmount;
        this.targetContraction = 0;
        this.okGestureActive = false;
        break;
      case 'fist':
        this.targetContraction = 0.5 * (1 + (150 - Math.min(distance, 150)) / 70);
        this.targetExpansion = 0;
        this.okGestureActive = false;
        break;
      case 'pointing':
        this.targetRotationY = data.indexDirection.x * Math.PI;
        this.targetRotationX = -data.indexDirection.y * Math.PI * 0.5;
        const velocityMagnitude = Math.sqrt(data.handVelocity.x ** 2 + data.handVelocity.y ** 2);
        const velocityFactor = Math.min(velocityMagnitude / 100, 1);
        const angularSpeed = velocityFactor * 0.3;
        this.angularVelocityY = data.indexDirection.x * angularSpeed;
        this.angularVelocityX = -data.indexDirection.y * angularSpeed;
        this.okGestureActive = false;
        break;
      case 'ok':
        if (!this.okGestureActive) {
          this.okGestureStartTime = performance.now();
          this.okGestureActive = true;
        } else if (performance.now() - this.okGestureStartTime > 2000) {
          this.nextColorTheme();
          this.okGestureActive = false;
        }
        break;
      default:
        this.okGestureActive = false;
        break;
    }
  }

  nextColorTheme(): void {
    const themes: ColorTheme[] = ['aurora', 'lava', 'neon'];
    const currentIndex = themes.indexOf(this.particleEffect['currentTheme'] as ColorTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    this.particleEffect.transitionColorTheme(themes[nextIndex]);
  }

  setMode(mode: SculptureMode): void {
    this.mode = mode;
  }

  reset(): void {
    this.expansion = 0;
    this.targetExpansion = 0;
    this.contraction = 0;
    this.targetContraction = 0;
    this.rotationY = 0;
    this.rotationX = 0;
    this.angularVelocityY = 0;
    this.angularVelocityX = 0;
    this.targetRotationY = 0;
    this.targetRotationX = 0;
    this.okGestureActive = false;
  }

  update(deltaTime: number): void {
    this.expansion += (this.targetExpansion - this.expansion) * 0.1;
    this.contraction += (this.targetContraction - this.contraction) * 0.1;

    this.angularVelocityY *= 0.95;
    this.angularVelocityX *= 0.95;
    if (Math.abs(this.angularVelocityY) < 0.001) this.angularVelocityY = 0;
    if (Math.abs(this.angularVelocityX) < 0.001) this.angularVelocityX = 0;

    this.rotationY += this.angularVelocityY * deltaTime;
    this.rotationX += this.angularVelocityX * deltaTime;

    const scale = 1 + this.expansion - this.contraction;
    const cosY = Math.cos(this.rotationY);
    const sinY = Math.sin(this.rotationY);
    const cosX = Math.cos(this.rotationX);
    const sinX = Math.sin(this.rotationX);

    for (let i = 0; i < this.particleCount; i++) {
      const ix = i * 3;
      const iy = i * 3 + 1;
      const iz = i * 3 + 2;

      let x = this.basePositions[ix] * scale;
      let y = this.basePositions[iy] * scale;
      let z = this.basePositions[iz] * scale;

      const x1 = x * cosY + z * sinY;
      const z1 = -x * sinY + z * cosY;
      const y1 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;

      this.currentPositions[ix] = x1;
      this.currentPositions[iy] = y1;
      this.currentPositions[iz] = z2;
    }

    this.particleEffect.update(deltaTime);
    this.particleEffect.updateTrails(this.currentPositions);

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
  }
}

export default SculptureManager;
