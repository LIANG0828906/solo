import * as THREE from 'three';
import { ShapeManager, ShapeName } from './shapeManager';

export type Weights = [number, number, number, number];

export class MorphController {
  private shapeManager: ShapeManager;
  private mesh: THREE.Mesh;
  private geometry: THREE.BufferGeometry;
  private material: THREE.MeshStandardMaterial;
  
  private currentWeights: Weights = [0.25, 0.25, 0.25, 0.25];
  private targetWeights: Weights = [0.25, 0.25, 0.25, 0.25];
  private normalizedWeights: Weights = [0.25, 0.25, 0.25, 0.25];
  
  private transitionDuration: number = 0.2;
  private transitionProgress: number = 1;
  private isTransitioning: boolean = false;
  private frameCount: number = 0;
  private totalFrames: number = 10;
  
  private startWeights: Weights = [0.25, 0.25, 0.25, 0.25];
  private shapeNames: ShapeName[] = ['sphere', 'cube', 'torus', 'octahedron'];
  private positionAttr!: THREE.BufferAttribute;
  private colorAttr!: THREE.BufferAttribute;
  
  private vertexCount: number = 0;
  private shapePositions: Float32Array[] = [];
  private shapeColors: Float32Array[] = [];

  constructor(shapeManager: ShapeManager) {
    this.shapeManager = shapeManager;
    this.vertexCount = shapeManager.getVertexCount();
    
    this.geometry = new THREE.BufferGeometry();
    this.material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      metalness: 0.3,
      roughness: 0.6,
      side: THREE.DoubleSide,
    });
    
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    
    this.loadShapeData();
    this.initGeometry();
    this.updateGeometry();
  }

  private loadShapeData(): void {
    for (const name of this.shapeNames) {
      this.shapePositions.push(this.shapeManager.getShapeVertices(name));
      this.shapeColors.push(this.shapeManager.getShapeColors(name));
    }
  }

  private initGeometry(): void {
    const positions = new Float32Array(this.vertexCount * 3);
    const colors = new Float32Array(this.vertexCount * 3);
    const indices = this.shapeManager.getShapeIndex('sphere');

    this.positionAttr = new THREE.BufferAttribute(positions, 3);
    this.colorAttr = new THREE.BufferAttribute(colors, 3);

    this.geometry.setAttribute('position', this.positionAttr);
    this.geometry.setAttribute('color', this.colorAttr);
    this.geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    
    this.geometry.computeVertexNormals();
  }

  private normalizeWeights(weights: Weights): Weights {
    const sum = weights[0] + weights[1] + weights[2] + weights[3];
    
    if (sum === 0) {
      return [0.25, 0.25, 0.25, 0.25];
    }
    
    return [
      weights[0] / sum,
      weights[1] / sum,
      weights[2] / sum,
      weights[3] / sum,
    ];
  }

  private lerpWeights(from: Weights, to: Weights, t: number): Weights {
    return [
      from[0] + (to[0] - from[0]) * t,
      from[1] + (to[1] - from[1]) * t,
      from[2] + (to[2] - from[2]) * t,
      from[3] + (to[3] - from[3]) * t,
    ];
  }

  private updateGeometry(): void {
    const posArray = this.positionAttr.array as Float32Array;
    const colorArray = this.colorAttr.array as Float32Array;
    
    const w = this.normalizedWeights;
    
    for (let i = 0; i < this.vertexCount; i++) {
      const posIdx = i * 3;
      const colIdx = i * 3;
      
      let px = 0, py = 0, pz = 0;
      let cr = 0, cg = 0, cb = 0;
      
      for (let s = 0; s < 4; s++) {
        const weight = w[s];
        if (weight === 0) continue;
        
        px += this.shapePositions[s][posIdx] * weight;
        py += this.shapePositions[s][posIdx + 1] * weight;
        pz += this.shapePositions[s][posIdx + 2] * weight;
        
        cr += this.shapeColors[s][colIdx] * weight;
        cg += this.shapeColors[s][colIdx + 1] * weight;
        cb += this.shapeColors[s][colIdx + 2] * weight;
      }
      
      posArray[posIdx] = px;
      posArray[posIdx + 1] = py;
      posArray[posIdx + 2] = pz;
      
      colorArray[colIdx] = cr;
      colorArray[colIdx + 1] = cg;
      colorArray[colIdx + 2] = cb;
    }
    
    this.positionAttr.needsUpdate = true;
    this.colorAttr.needsUpdate = true;
    
    this.geometry.computeVertexNormals();
    this.geometry.attributes.normal.needsUpdate = true;
  }

  setWeights(w1: number, w2: number, w3: number, w4: number): void {
    this.currentWeights = [w1, w2, w3, w4];
    this.targetWeights = [w1, w2, w3, w4];
    this.normalizedWeights = this.normalizeWeights(this.currentWeights);
    this.transitionProgress = 1;
    this.isTransitioning = false;
    this.updateGeometry();
  }

  setTargetWeights(w1: number, w2: number, w3: number, w4: number, duration?: number): void {
    this.targetWeights = [w1, w2, w3, w4];
    this.startWeights = [...this.currentWeights] as Weights;
    
    if (duration !== undefined) {
      this.transitionDuration = duration;
      this.totalFrames = Math.max(6, Math.min(12, Math.round(duration * 60)));
    } else {
      this.totalFrames = 10;
    }
    
    this.frameCount = 0;
    this.transitionProgress = 0;
    this.isTransitioning = true;
  }

  getWeights(): Weights {
    return [...this.currentWeights] as Weights;
  }

  getNormalizedWeights(): Weights {
    return [...this.normalizedWeights] as Weights;
  }

  getMesh(): THREE.Mesh {
    return this.mesh;
  }

  update(deltaTime: number): void {
    if (!this.isTransitioning) return;

    this.frameCount++;
    this.transitionProgress = this.frameCount / this.totalFrames;
    
    if (this.transitionProgress >= 1 || this.frameCount >= this.totalFrames) {
      this.transitionProgress = 1;
      this.isTransitioning = false;
      this.currentWeights = [...this.targetWeights] as Weights;
    } else {
      const t = this.easeInOutQuad(this.transitionProgress);
      this.currentWeights = this.lerpWeights(
        this.startWeights,
        this.targetWeights,
        t
      );
    }
    
    this.normalizedWeights = this.normalizeWeights(this.currentWeights);
    this.updateGeometry();
  }

  private easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  setTransitionDuration(duration: number): void {
    this.transitionDuration = duration;
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
