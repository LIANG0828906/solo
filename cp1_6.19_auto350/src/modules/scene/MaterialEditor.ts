import * as THREE from 'three';
import SceneManager from './SceneManager';
import type { MaterialConfig } from '../types';

export interface MaterialUpdateParams {
  color?: string;
  roughness?: number;
  metalness?: number;
  bumpScale?: number;
}

export class MaterialEditor {
  private sceneManager: SceneManager;
  private selectedObjectId: string | null = null;
  private bumpTextureCache: Map<string, THREE.Texture> = new Map();

  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
  }

  public setSelectedObjectId(objectId: string | null): void {
    this.selectedObjectId = objectId;
    this.sceneManager.emit('material:selection-change', objectId);
  }

  public getSelectedObjectId(): string | null {
    return this.selectedObjectId;
  }

  public getMaterial(objectId: string): MaterialConfig | null {
    const object = this.sceneManager.getObjectById(objectId);
    const mesh = object as THREE.Mesh;
    if (!mesh || !mesh.material || !(mesh.material instanceof THREE.MeshStandardMaterial)) {
      return null;
    }

    const material = mesh.material;
    return {
      id: objectId,
      name: mesh.name || objectId,
      color: '#' + material.color.getHexString(),
      roughness: material.roughness,
      metalness: material.metalness,
      bumpScale: material.bumpScale || 0,
    };
  }

  public getSelectedMaterial(): MaterialConfig | null {
    if (!this.selectedObjectId) {
      return null;
    }
    return this.getMaterial(this.selectedObjectId);
  }

  public updateMaterial(objectId: string, params: MaterialUpdateParams): void {
    const object = this.sceneManager.getObjectById(objectId);
    const mesh = object as THREE.Mesh;
    if (!mesh || !mesh.material || !(mesh.material instanceof THREE.MeshStandardMaterial)) {
      console.warn(`Mesh ${objectId} not found or material is not MeshStandardMaterial`);
      return;
    }

    const material = mesh.material;

    if (params.color !== undefined) {
      material.color.set(params.color);
    }

    if (params.roughness !== undefined) {
      material.roughness = params.roughness;
    }

    if (params.metalness !== undefined) {
      material.metalness = params.metalness;
    }

    if (params.bumpScale !== undefined) {
      if (!material.bumpMap) {
        material.bumpMap = this.getBumpTexture(objectId);
      }
      material.bumpScale = params.bumpScale;
      material.needsUpdate = true;
    }

    this.sceneManager.getRenderer().shadowMap.needsUpdate = true;
    this.emitMaterialChange(objectId);
  }

  public updateSelectedMaterial(params: MaterialUpdateParams): void {
    if (!this.selectedObjectId) {
      console.warn('No object selected');
      return;
    }
    this.updateMaterial(this.selectedObjectId, params);
  }

  private getBumpTexture(objectId: string): THREE.Texture {
    if (this.bumpTextureCache.has(objectId)) {
      return this.bumpTextureCache.get(objectId)!;
    }

    const texture = this.createNoiseTexture();
    this.bumpTextureCache.set(objectId, texture);
    return texture;
  }

  private createNoiseTexture(): THREE.Texture {
    const size = 256;
    const data = new Uint8Array(size * size);

    for (let i = 0; i < size * size; i++) {
      const x = i % size;
      const y = Math.floor(i / size);
      const noise = this.perlinNoise(x * 0.05, y * 0.05);
      data[i] = Math.floor((noise * 0.5 + 0.5) * 255);
    }

    const texture = new THREE.DataTexture(data, size, size, THREE.RedFormat);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    texture.needsUpdate = true;

    return texture;
  }

  private perlinNoise(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const u = this.fade(xf);
    const v = this.fade(yf);

    const aa = this.hash(X + this.hash(Y));
    const ab = this.hash(X + this.hash(Y + 1));
    const ba = this.hash(X + 1 + this.hash(Y));
    const bb = this.hash(X + 1 + this.hash(Y + 1));

    const x1 = this.lerp(this.grad(aa, xf, yf), this.grad(ba, xf - 1, yf), u);
    const x2 = this.lerp(this.grad(ab, xf, yf - 1), this.grad(bb, xf - 1, yf - 1), u);

    return this.lerp(x1, x2, v);
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  private hash(n: number): number {
    return ((n * 2654435761) % 256 + 256) % 256;
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  private emitMaterialChange(objectId: string): void {
    const materialConfig = this.getMaterial(objectId);
    if (materialConfig) {
      this.sceneManager.emit('material:change', materialConfig);
    }
  }

  public dispose(): void {
    this.bumpTextureCache.forEach((texture) => {
      texture.dispose();
    });
    this.bumpTextureCache.clear();
  }
}
