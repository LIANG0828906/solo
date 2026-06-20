import * as THREE from 'three';
import {
  randomRange,
  lerp,
  easeInOutCubic,
  lerpColor,
  lerpTripleColor,
  createRadialGradientTexture,
  clamp,
} from './utils';

export type ColorMode = 'single' | 'dual' | 'triple';
export type DistributionShape = 'sphere' | 'ellipsoid';

export interface NebulaParams {
  particleCount: number;
  particleSize: number;
  spreadRadius: number;
  rotationSpeed: number;
  colorMode: ColorMode;
  distribution: DistributionShape;
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  backgroundColor: string;
}

export const DEFAULT_PARAMS: NebulaParams = {
  particleCount: 20000,
  particleSize: 0.8,
  spreadRadius: 25,
  rotationSpeed: 0.5,
  colorMode: 'dual',
  distribution: 'ellipsoid',
  primaryColor: '#ff6b9d',
  secondaryColor: '#c44dff',
  tertiaryColor: '#ffcc00',
  backgroundColor: '#140a20',
};

interface TransitionState {
  active: boolean;
  startTime: number;
  duration: number;
  startPositions: Float32Array | null;
  startColors: Float32Array | null;
  endPositions: Float32Array | null;
  endColors: Float32Array | null;
  targetParams: Partial<NebulaParams>;
}

export class NebulaSystem {
  private scene: THREE.Scene;
  private params: NebulaParams;
  private points: THREE.Points | null = null;
  private geometry: THREE.BufferGeometry | null = null;
  private material: THREE.PointsMaterial | null = null;
  private texture: THREE.CanvasTexture | null = null;
  private rotationY: number = 0;
  private maxParticles: number = 50000;
  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;

  private transition: TransitionState = {
    active: false,
    startTime: 0,
    duration: 1000,
    startPositions: null,
    startColors: null,
    endPositions: null,
    endColors: null,
    targetParams: {},
  };

  constructor(scene: THREE.Scene, params: NebulaParams = DEFAULT_PARAMS) {
    this.scene = scene;
    this.params = { ...params };
    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 3);
    this.sizes = new Float32Array(this.maxParticles);
    this.init();
  }

  private init(): void {
    this.texture = new THREE.CanvasTexture(createRadialGradientTexture());
    this.texture.needsUpdate = true;

    this.material = new THREE.PointsMaterial({
      size: this.params.particleSize,
      map: this.texture,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      sizeAttenuation: true,
      alphaTest: 0.01,
    });

    this.geometry = new THREE.BufferGeometry();
    this.generateParticleData(this.params.particleCount);

    this.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this.positions, 3)
    );
    this.geometry.setAttribute(
      'color',
      new THREE.BufferAttribute(this.colors, 3)
    );
    this.geometry.setDrawRange(0, this.params.particleCount);

    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);
  }

  private generateParticleData(count: number): void {
    const primary = this.hexToRgbObj(this.params.primaryColor);
    const secondary = this.hexToRgbObj(this.params.secondaryColor);
    const tertiary = this.hexToRgbObj(this.params.tertiaryColor);

    for (let i = 0; i < count; i++) {
      const pos = this.generateParticlePosition();
      this.positions[i * 3] = pos.x;
      this.positions[i * 3 + 1] = pos.y;
      this.positions[i * 3 + 2] = pos.z;

      const dist = Math.sqrt(
        pos.x * pos.x + pos.y * pos.y + pos.z * pos.z
      ) / this.params.spreadRadius;

      const color = this.getColorByDistance(dist, primary, secondary, tertiary);
      this.colors[i * 3] = color.r;
      this.colors[i * 3 + 1] = color.g;
      this.colors[i * 3 + 2] = color.b;

      this.sizes[i] = 1.0 - dist * 0.5;
    }
  }

  private generateParticlePosition(): { x: number; y: number; z: number } {
    const theta = randomRange(0, Math.PI * 2);
    const phi = Math.acos(randomRange(-1, 1));
    const r = Math.pow(Math.random(), 0.5) * this.params.spreadRadius;

    let x = r * Math.sin(phi) * Math.cos(theta);
    let y = r * Math.sin(phi) * Math.sin(theta);
    let z = r * Math.cos(phi);

    if (this.params.distribution === 'ellipsoid') {
      y *= 0.4;
      x *= 1.0;
      z *= 0.8;
    }

    return { x, y, z };
  }

  private getColorByDistance(
    dist: number,
    primary: { r: number; g: number; b: number },
    secondary: { r: number; g: number; b: number },
    tertiary: { r: number; g: number; b: number }
  ): { r: number; g: number; b: number } {
    const t = clamp(dist, 0, 1);
    switch (this.params.colorMode) {
      case 'single':
        return primary;
      case 'dual':
        return lerpColor(primary, secondary, t);
      case 'triple':
        return lerpTripleColor(primary, secondary, tertiary, t);
      default:
        return primary;
    }
  }

  private hexToRgbObj(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16) / 255,
          g: parseInt(result[2], 16) / 255,
          b: parseInt(result[3], 16) / 255,
        }
      : { r: 1, g: 1, b: 1 };
  }

  public update(deltaTime: number): void {
    if (this.transition.active) {
      this.updateTransition(deltaTime);
    }

    this.rotationY += deltaTime * this.params.rotationSpeed * 0.1;

    if (this.points) {
      this.points.rotation.y = this.rotationY;
    }

    if (this.geometry) {
      const posAttr = this.geometry.getAttribute('position') as THREE.BufferAttribute;
      const colorAttr = this.geometry.getAttribute('color') as THREE.BufferAttribute;
      posAttr.needsUpdate = true;
      colorAttr.needsUpdate = true;
    }
  }

  private updateTransition(_deltaTime: number): void {
    const now = performance.now();
    const elapsed = now - this.transition.startTime;
    const progress = Math.min(elapsed / this.transition.duration, 1);
    const eased = easeInOutCubic(progress);

    if (this.transition.startPositions && this.transition.endPositions) {
      for (let i = 0; i < this.params.particleCount * 3; i++) {
        this.positions[i] = lerp(
          this.transition.startPositions[i],
          this.transition.endPositions[i],
          eased
        );
      }
    }

    if (this.transition.startColors && this.transition.endColors) {
      for (let i = 0; i < this.params.particleCount * 3; i++) {
        this.colors[i] = lerp(
          this.transition.startColors[i],
          this.transition.endColors[i],
          eased
        );
      }
    }

    if (progress >= 1) {
      this.transition.active = false;
      this.transition.startPositions = null;
      this.transition.startColors = null;
      this.transition.endPositions = null;
      this.transition.endColors = null;
      this.applyTargetParams();
    }
  }

  private applyTargetParams(): void {
    const needRegenerate =
      this.transition.targetParams.particleCount !== undefined ||
      this.transition.targetParams.spreadRadius !== undefined ||
      this.transition.targetParams.distribution !== undefined ||
      this.transition.targetParams.colorMode !== undefined ||
      this.transition.targetParams.primaryColor !== undefined ||
      this.transition.targetParams.secondaryColor !== undefined ||
      this.transition.targetParams.tertiaryColor !== undefined;

    Object.assign(this.params, this.transition.targetParams);
    this.transition.targetParams = {};

    if (this.material) {
      this.material.size = this.params.particleSize;
    }

    if (this.geometry && needRegenerate) {
      this.geometry.setDrawRange(0, this.params.particleCount);
    }
  }

  public setParams(
    newParams: Partial<NebulaParams>,
    animate: boolean = false
  ): void {
    if (animate) {
      this.startAnimatedTransition(newParams);
    } else {
      this.applyParamsImmediately(newParams);
    }
  }

  private startAnimatedTransition(newParams: Partial<NebulaParams>): void {
    const oldCount = this.params.particleCount;
    const tempParams = { ...this.params, ...newParams };
    const newCount = tempParams.particleCount;

    this.transition.startPositions = new Float32Array(this.maxParticles * 3);
    this.transition.startColors = new Float32Array(this.maxParticles * 3);
    this.transition.endPositions = new Float32Array(this.maxParticles * 3);
    this.transition.endColors = new Float32Array(this.maxParticles * 3);

    for (let i = 0; i < this.maxParticles * 3; i++) {
      this.transition.startPositions[i] = this.positions[i];
      this.transition.startColors[i] = this.colors[i];
    }

    const prevParams = { ...this.params };
    Object.assign(this.params, newParams);

    const primary = this.hexToRgbObj(this.params.primaryColor);
    const secondary = this.hexToRgbObj(this.params.secondaryColor);
    const tertiary = this.hexToRgbObj(this.params.tertiaryColor);

    for (let i = 0; i < Math.max(oldCount, newCount); i++) {
      let pos: { x: number; y: number; z: number };
      if (i < oldCount) {
        const ox = this.transition.startPositions[i * 3];
        const oy = this.transition.startPositions[i * 3 + 1];
        const oz = this.transition.startPositions[i * 3 + 2];
        const oldDist = Math.sqrt(ox * ox + oy * oy + oz * oz) /
          (prevParams.spreadRadius || 1);
        const ratio = clamp(oldDist, 0, 1);

        const theta = Math.atan2(oy, ox);
        const phi = Math.acos(clamp(oz / (prevParams.spreadRadius * ratio + 0.001), -1, 1));
        const r = ratio * this.params.spreadRadius;

        let nx = r * Math.sin(phi) * Math.cos(theta);
        let ny = r * Math.sin(phi) * Math.sin(theta);
        let nz = r * Math.cos(phi);

        if (this.params.distribution === 'ellipsoid') {
          ny *= 0.4;
          nz *= 0.8;
        }
        pos = { x: nx, y: ny, z: nz };
      } else {
        pos = this.generateParticlePosition();
      }

      this.transition.endPositions![i * 3] = pos.x;
      this.transition.endPositions![i * 3 + 1] = pos.y;
      this.transition.endPositions![i * 3 + 2] = pos.z;

      const dist = Math.sqrt(
        pos.x * pos.x + pos.y * pos.y + pos.z * pos.z
      ) / this.params.spreadRadius;

      const color = this.getColorByDistance(dist, primary, secondary, tertiary);
      this.transition.endColors![i * 3] = color.r;
      this.transition.endColors![i * 3 + 1] = color.g;
      this.transition.endColors![i * 3 + 2] = color.b;
    }

    if (this.geometry) {
      this.geometry.setDrawRange(0, newCount);
    }

    this.params = prevParams;

    this.transition.active = true;
    this.transition.startTime = performance.now();
    this.transition.duration = 1000;
    this.transition.targetParams = newParams;
  }

  private applyParamsImmediately(newParams: Partial<NebulaParams>): void {
    const countChanged =
      newParams.particleCount !== undefined &&
      newParams.particleCount !== this.params.particleCount;

    const shapeChanged =
      newParams.spreadRadius !== undefined ||
      newParams.distribution !== undefined;

    const colorChanged =
      newParams.colorMode !== undefined ||
      newParams.primaryColor !== undefined ||
      newParams.secondaryColor !== undefined ||
      newParams.tertiaryColor !== undefined;

    Object.assign(this.params, newParams);

    if (this.material && newParams.particleSize !== undefined) {
      this.material.size = newParams.particleSize;
    }

    if (countChanged || shapeChanged || colorChanged) {
      const count = this.params.particleCount;
      this.generateParticleData(count);

      if (this.geometry) {
        this.geometry.setDrawRange(0, count);
        (this.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
        (this.geometry.getAttribute('color') as THREE.BufferAttribute).needsUpdate = true;
      }
    }
  }

  public getParams(): NebulaParams {
    return { ...this.params };
  }

  public destroy(): void {
    if (this.points && this.scene) {
      this.scene.remove(this.points);
    }
    if (this.geometry) {
      this.geometry.dispose();
    }
    if (this.material) {
      this.material.dispose();
    }
    if (this.texture) {
      this.texture.dispose();
    }
    this.points = null;
    this.geometry = null;
    this.material = null;
    this.texture = null;
  }
}
