import * as THREE from 'three';
import { BrushTool, BrushParams } from './BrushTool';
import { GeometryUtils } from './GeometryUtils';

export type MaterialType = 'clay' | 'stone' | 'plastic' | 'metal';
export type EnvType = 'sunset' | 'bluehour' | 'space' | 'neutral';
export type ModelType = 'sphere' | 'torusknot';

export interface MaterialConfig {
  color: number;
  roughness: number;
  metalness: number;
}

export interface ModelData {
  mesh: THREE.Mesh;
  geometry: THREE.BufferGeometry;
  material: THREE.MeshStandardMaterial;
  originalPositions: Float32Array;
  adjacencyList: number[][];
}

export const MATERIAL_CONFIGS: Record<MaterialType, MaterialConfig> = {
  clay: { color: 0xb8b8b8, roughness: 0.8, metalness: 0.1 },
  stone: { color: 0x9e9e9e, roughness: 0.9, metalness: 0.0 },
  plastic: { color: 0xc0c0c0, roughness: 0.3, metalness: 0.1 },
  metal: { color: 0xe0e0e0, roughness: 0.05, metalness: 0.9 }
};

export class SceneManager {
  private models: Map<string, ModelData> = new Map();

  createModel(type: ModelType, id: string): ModelData {
    let geometry: THREE.BufferGeometry;

    switch (type) {
      case 'sphere':
        geometry = new THREE.SphereGeometry(1, 32, 32);
        break;
      case 'torusknot':
        geometry = new THREE.TorusKnotGeometry(0.8, 0.3, 48, 16);
        break;
      default:
        geometry = new THREE.SphereGeometry(1, 32, 32);
    }

    const material = new THREE.MeshStandardMaterial({
      color: MATERIAL_CONFIGS.clay.color,
      roughness: MATERIAL_CONFIGS.clay.roughness,
      metalness: MATERIAL_CONFIGS.clay.metalness
    });

    const mesh = new THREE.Mesh(geometry, material);

    const positions = geometry.getAttribute('position') as THREE.BufferAttribute;
    const originalPositions = new Float32Array(positions.array);
    const indices = geometry.getIndex();

    const vertexCount = positions.count;
    const indicesArray = indices
      ? (indices.array as Uint32Array | Uint16Array)
      : null;
    const adjacencyList = GeometryUtils.buildAdjacencyList(
      indicesArray,
      vertexCount
    );

    const modelData: ModelData = {
      mesh,
      geometry,
      material,
      originalPositions,
      adjacencyList
    };

    this.models.set(id, modelData);
    return modelData;
  }

  getModel(id: string): ModelData | undefined {
    return this.models.get(id);
  }

  applyBrush(
    modelId: string,
    hitPoint: THREE.Vector3,
    viewDirection: THREE.Vector3,
    params: BrushParams
  ): Float32Array | null {
    const model = this.models.get(modelId);
    if (!model) return null;

    const positions = model.geometry.getAttribute(
      'position'
    ) as THREE.BufferAttribute;
    const indices = model.geometry.getIndex();
    const currentPositions = new Float32Array(positions.array);
    const indicesArray = indices
      ? (indices.array as Uint32Array | Uint16Array)
      : null;

    const newPositions = BrushTool.applyBrush(
      currentPositions,
      indicesArray,
      hitPoint,
      viewDirection,
      params,
      model.adjacencyList
    );

    GeometryUtils.applyPositionsToGeometry(model.geometry, newPositions);

    return newPositions;
  }

  updateMaterial(modelId: string, materialType: MaterialType): void {
    const model = this.models.get(modelId);
    if (!model) return;

    const config = MATERIAL_CONFIGS[materialType];
    model.material.color.setHex(config.color);
    model.material.roughness = config.roughness;
    model.material.metalness = config.metalness;
    model.material.needsUpdate = true;
  }

  resetModel(modelId: string): void {
    const model = this.models.get(modelId);
    if (!model) return;

    GeometryUtils.applyPositionsToGeometry(
      model.geometry,
      model.originalPositions
    );
  }

  restorePositions(modelId: string, positions: Float32Array): void {
    const model = this.models.get(modelId);
    if (!model) return;

    GeometryUtils.applyPositionsToGeometry(model.geometry, positions);
  }

  getVertexCount(modelId: string): number {
    const model = this.models.get(modelId);
    if (!model) return 0;
    return model.geometry.getAttribute('position').count;
  }

  getCurrentPositions(modelId: string): Float32Array {
    const model = this.models.get(modelId);
    if (!model) return new Float32Array();
    const positions = model.geometry.getAttribute(
      'position'
    ) as THREE.BufferAttribute;
    return new Float32Array(positions.array);
  }

  createEnvironmentTexture(envType: EnvType): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createLinearGradient(0, 0, 0, 256);

    switch (envType) {
      case 'sunset':
        gradient.addColorStop(0, '#ff7e5f');
        gradient.addColorStop(0.5, '#feb47b');
        gradient.addColorStop(1, '#86a8e7');
        break;
      case 'bluehour':
        gradient.addColorStop(0, '#1e3c72');
        gradient.addColorStop(0.5, '#2a5298');
        gradient.addColorStop(1, '#7aa8ff');
        break;
      case 'space':
        gradient.addColorStop(0, '#0f0c29');
        gradient.addColorStop(0.5, '#302b63');
        gradient.addColorStop(1, '#24243e');
        break;
      case 'neutral':
        gradient.addColorStop(0, '#434343');
        gradient.addColorStop(0.5, '#666666');
        gradient.addColorStop(1, '#999999');
        break;
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);

    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    return texture;
  }

  dispose(): void {
    this.models.forEach((model) => {
      model.geometry.dispose();
      model.material.dispose();
    });
    this.models.clear();
  }
}
