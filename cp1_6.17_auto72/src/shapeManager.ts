export type ShapeName = 'cube' | 'sphere' | 'torus';

export interface ShapeInfo {
  name: ShapeName;
  label: string;
  color: string;
}

export type EasingFunction = (t: number) => number;

export const easeInOutCubic: EasingFunction = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

export interface TransitionResult {
  vertices: Float32Array;
  duration: number;
  easing: EasingFunction;
}

export class ShapeManager {
  readonly shapeNames: ShapeName[] = ['cube', 'sphere', 'torus'];

  readonly shapes: Record<ShapeName, ShapeInfo> = {
    cube: { name: 'cube', label: '立方体', color: '#FF6B6B' },
    sphere: { name: 'sphere', label: '球体', color: '#4ECDC4' },
    torus: { name: 'torus', label: '环面', color: '#FFE66D' }
  };

  private currentShape: ShapeName = 'cube';
  private targetShape: ShapeName = 'cube';
  private transitioning: boolean = false;
  private transitionStart: number = 0;
  private transitionDuration: number = 3000;
  private easing: EasingFunction = easeInOutCubic;

  private cachedVertices: Record<ShapeName, Float32Array | null> = {
    cube: null,
    sphere: null,
    torus: null
  };

  private particleCount: number = 0;

  constructor(particleCount: number = 5000) {
    this.particleCount = particleCount;
  }

  getCurrentShape(): ShapeName {
    return this.currentShape;
  }

  isTransitioning(): boolean {
    return this.transitioning;
  }

  getTransitionProgress(elapsedTime: number): number {
    if (!this.transitioning) return 1;
    const t = (elapsedTime - this.transitionStart) / this.transitionDuration;
    return Math.max(0, Math.min(1, t));
  }

  switchShape(target: ShapeName, nowTime: number): TransitionResult {
    if (target === this.currentShape && !this.transitioning) {
      return {
        vertices: this.getShapeVertices(this.currentShape),
        duration: 0,
        easing: (t) => 1
      };
    }

    const currentProgress = this.getTransitionProgress(nowTime);
    if (this.transitioning && currentProgress < 1) {
      this.currentShape = this.targetShape;
    }

    this.targetShape = target;
    this.transitioning = true;
    this.transitionStart = nowTime;
    this.transitionDuration = 3000;
    this.easing = easeInOutCubic;

    return {
      vertices: this.getShapeVertices(target),
      duration: this.transitionDuration,
      easing: this.easing
    };
  }

  completeTransition(): void {
    this.transitioning = false;
    this.currentShape = this.targetShape;
  }

  private generateCubeVertices(count: number): Float32Array {
    const verts = new Float32Array(count * 3);
    const size = 2.2;
    const half = size / 2;

    for (let i = 0; i < count; i++) {
      const face = i % 6;
      const u = Math.random() * size - half;
      const v = Math.random() * size - half;
      let x = 0, y = 0, z = 0;

      switch (face) {
        case 0: x = half; y = u; z = v; break;
        case 1: x = -half; y = u; z = v; break;
        case 2: x = u; y = half; z = v; break;
        case 3: x = u; y = -half; z = v; break;
        case 4: x = u; y = v; z = half; break;
        case 5: x = u; y = v; z = -half; break;
      }

      const jitter = 0.04;
      x += (Math.random() - 0.5) * jitter;
      y += (Math.random() - 0.5) * jitter;
      z += (Math.random() - 0.5) * jitter;

      verts[i * 3] = x;
      verts[i * 3 + 1] = y;
      verts[i * 3 + 2] = z;
    }

    return verts;
  }

  private generateSphereVertices(count: number): Float32Array {
    const verts = new Float32Array(count * 3);
    const radius = 1.3;

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius + (Math.random() - 0.5) * 0.08;

      verts[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      verts[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      verts[i * 3 + 2] = r * Math.cos(phi);
    }

    return verts;
  }

  private generateTorusVertices(count: number): Float32Array {
    const verts = new Float32Array(count * 3);
    const R = 1.4;
    const r = 0.5;

    for (let i = 0; i < count; i++) {
      const u = Math.random() * Math.PI * 2;
      const v = Math.random() * Math.PI * 2;
      const radiusJitter = (Math.random() - 0.5) * 0.06;
      const tubeJitter = (Math.random() - 0.5) * 0.06;

      const x = (R + r * Math.cos(v) + tubeJitter) * Math.cos(u);
      const y = (r * Math.sin(v) + tubeJitter);
      const z = (R + r * Math.cos(v) + tubeJitter) * Math.sin(u);

      verts[i * 3] = x;
      verts[i * 3 + 1] = y;
      verts[i * 3 + 2] = z;
    }

    return verts;
  }

  getShapeVertices(shape: ShapeName): Float32Array {
    if (this.cachedVertices[shape] === null) {
      switch (shape) {
        case 'cube':
          this.cachedVertices[shape] = this.generateCubeVertices(this.particleCount);
          break;
        case 'sphere':
          this.cachedVertices[shape] = this.generateSphereVertices(this.particleCount);
          break;
        case 'torus':
          this.cachedVertices[shape] = this.generateTorusVertices(this.particleCount);
          break;
      }
    }
    return this.cachedVertices[shape]!;
  }

  getInitialVertices(): Float32Array {
    return this.getShapeVertices(this.currentShape);
  }

  update(nowTime: number): void {
    if (this.transitioning) {
      const progress = this.getTransitionProgress(nowTime);
      if (progress >= 1) {
        this.completeTransition();
      }
    }
  }
}
