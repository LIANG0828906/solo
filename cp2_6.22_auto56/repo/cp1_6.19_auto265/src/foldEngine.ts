import * as THREE from 'three';
import type { Crease } from './scene';

export type FoldState = 'idle' | 'folding' | 'unfolding' | 'complete';

export interface FoldProgressEvent {
  progress: number;
  currentCreaseIndex: number;
  totalCreases: number;
  state: FoldState;
}

type ProgressCallback = (event: FoldProgressEvent) => void;

export class FoldingEngine {
  private creases: Crease[] = [];
  private initialVertices: Float32Array | null = null;
  private currentPositions: Float32Array | null = null;
  private vertexCount: number = 0;

  private state: FoldState = 'idle';
  private foldProgress: number = 0;
  private currentCreaseIndex: number = 0;
  private creaseFoldDuration: number = 0.5;
  private unfoldDuration: number = 3;
  private unfoldProgress: number = 0;

  private listeners: ProgressCallback[] = [];
  private tempVec: THREE.Vector3 = new THREE.Vector3();
  private tempVec2: THREE.Vector3 = new THREE.Vector3();
  private rotationMatrix: THREE.Matrix4 = new THREE.Matrix4();
  private quaternion: THREE.Quaternion = new THREE.Quaternion();

  private geometry: THREE.BufferGeometry | null = null;

  constructor() {}

  public setGeometry(geometry: THREE.BufferGeometry): void {
    this.geometry = geometry;
    const positions = geometry.attributes.position.array as Float32Array;
    this.initialVertices = new Float32Array(positions);
    this.currentPositions = new Float32Array(positions);
    this.vertexCount = positions.length / 3;
  }

  public setCreases(creases: Crease[]): void {
    this.creases = creases.map(c => ({
      ...c,
      angle: 0,
      targetAngle: c.foldDirection * Math.PI / 2
    }));
  }

  public onProgress(callback: ProgressCallback): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private emitProgress(): void {
    const event: FoldProgressEvent = {
      progress: this.foldProgress,
      currentCreaseIndex: this.currentCreaseIndex,
      totalCreases: this.creases.length,
      state: this.state
    };
    this.listeners.forEach(cb => cb(event));
  }

  public startFold(): void {
    if (this.creases.length === 0) return;
    if (this.state === 'folding') return;

    this.state = 'folding';
    this.foldProgress = 0;
    this.currentCreaseIndex = 0;

    if (this.creases.length > 0) {
      this.creases[0].angle = 0;
    }

    this.emitProgress();
  }

  public startUnfold(): void {
    if (this.state !== 'complete') return;

    this.state = 'unfolding';
    this.unfoldProgress = 0;
    this.emitProgress();
  }

  public reset(): void {
    this.state = 'idle';
    this.foldProgress = 0;
    this.unfoldProgress = 0;
    this.currentCreaseIndex = 0;

    this.creases.forEach(c => {
      c.angle = 0;
    });

    if (this.initialVertices && this.currentPositions) {
      this.currentPositions.set(this.initialVertices);
      this.updateGeometryPositions();
    }

    this.emitProgress();
  }

  public update(deltaTime: number): void {
    if (this.state === 'folding') {
      this.updateFolding(deltaTime);
    } else if (this.state === 'unfolding') {
      this.updateUnfolding(deltaTime);
    }
  }

  public debugState(): any {
    return {
      state: this.state,
      foldProgress: this.foldProgress,
      currentCreaseIndex: this.currentCreaseIndex,
      creaseCount: this.creases.length,
      hasInitialVertices: !!this.initialVertices,
      hasCurrentPositions: !!this.currentPositions,
      vertexCount: this.vertexCount,
      firstCreaseAngle: this.creases[0]?.angle,
      firstCreaseTarget: this.creases[0]?.targetAngle
    };
  }

  private updateFolding(deltaTime: number): void {
    if (this.creases.length === 0 || !this.initialVertices) return;

    const crease = this.creases[this.currentCreaseIndex];
    if (!crease) {
      this.state = 'complete';
      this.foldProgress = 1;
      this.emitProgress();
      return;
    }

    const angleStep = (Math.PI / 2) / this.creaseFoldDuration * deltaTime;
    const targetAngle = crease.foldDirection * Math.PI / 2;

    if (Math.abs(crease.angle - targetAngle) < angleStep) {
      crease.angle = targetAngle;
      this.currentCreaseIndex++;

      if (this.currentCreaseIndex >= this.creases.length) {
        this.state = 'complete';
        this.foldProgress = 1;
      }
    } else {
      crease.angle += crease.foldDirection * angleStep;
    }

    this.foldProgress = (this.currentCreaseIndex +
      (this.currentCreaseIndex < this.creases.length
        ? Math.abs(crease.angle) / (Math.PI / 2)
        : 0)) / this.creases.length;

    if (this.foldProgress > 1) this.foldProgress = 1;

    this.applyAllFolds();
    this.emitProgress();
  }

  private updateUnfolding(deltaTime: number): void {
    if (this.creases.length === 0 || !this.initialVertices) return;

    this.unfoldProgress += deltaTime / this.unfoldDuration;

    if (this.unfoldProgress >= 1) {
      this.unfoldProgress = 1;
      this.state = 'idle';
      this.foldProgress = 0;
      this.currentCreaseIndex = 0;

      this.creases.forEach(c => {
        c.angle = 0;
      });
    }

    const easedProgress = this.easeOutCubic(this.unfoldProgress);

    for (let i = 0; i < this.creases.length; i++) {
      const crease = this.creases[i];
      const targetAngle = crease.foldDirection * Math.PI / 2;
      crease.angle = targetAngle * (1 - easedProgress);
    }

    this.foldProgress = 1 - easedProgress;

    this.applyAllFolds();
    this.emitProgress();
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  private applyAllFolds(): void {
    if (!this.initialVertices || !this.currentPositions) return;

    this.currentPositions.set(this.initialVertices);

    for (let i = 0; i < this.creases.length; i++) {
      const crease = this.creases[i];
      if (Math.abs(crease.angle) < 0.0001) continue;

      this.applyCreaseFold(crease);
    }

    this.updateGeometryPositions();
  }

  private applyCreaseFold(crease: Crease): void {
    if (!this.currentPositions) return;

    const pointA = new THREE.Vector3(crease.pointA.x, 0, crease.pointA.y);
    const pointB = new THREE.Vector3(crease.pointB.x, 0, crease.pointB.y);

    const axis = new THREE.Vector3()
      .subVectors(pointB, pointA)
      .normalize();

    this.quaternion.setFromAxisAngle(axis, crease.angle);
    this.rotationMatrix.makeRotationFromQuaternion(this.quaternion);

    for (let i = 0; i < this.vertexCount; i++) {
      const idx = i * 3;
      const x = this.currentPositions[idx];
      const y = this.currentPositions[idx + 1];
      const z = this.currentPositions[idx + 2];

      const vertexPos = this.tempVec.set(x, y, z);

      if (this.isOnFoldSide(vertexPos, crease)) {
        const translated = this.tempVec2.copy(vertexPos).sub(pointA);
        translated.applyMatrix4(this.rotationMatrix);
        translated.add(pointA);

        this.currentPositions[idx] = translated.x;
        this.currentPositions[idx + 1] = translated.y;
        this.currentPositions[idx + 2] = translated.z;
      }
    }
  }

  private isOnFoldSide(point: THREE.Vector3, crease: Crease): boolean {
    const ax = crease.pointA.x;
    const az = crease.pointA.y;
    const bx = crease.pointB.x;
    const bz = crease.pointB.y;

    const dx = bx - ax;
    const dz = bz - az;

    const px = point.x - ax;
    const pz = point.z - az;

    const cross = dx * pz - dz * px;

    return crease.foldDirection > 0 ? cross > 0 : cross < 0;
  }

  private updateGeometryPositions(): void {
    if (!this.geometry || !this.currentPositions) return;

    const posAttr = this.geometry.attributes.position;
    (posAttr.array as Float32Array).set(this.currentPositions);
    posAttr.needsUpdate = true;

    this.geometry.computeVertexNormals();
  }

  public getState(): FoldState {
    return this.state;
  }

  public getProgress(): number {
    return this.foldProgress;
  }

  public getCurrentCreaseIndex(): number {
    return this.currentCreaseIndex;
  }

  public getCreases(): Crease[] {
    return this.creases;
  }

  public getFoldDuration(): number {
    return this.creaseFoldDuration;
  }

  public setFoldDuration(duration: number): void {
    this.creaseFoldDuration = duration;
  }

  public getUnfoldDuration(): number {
    return this.unfoldDuration;
  }
}
