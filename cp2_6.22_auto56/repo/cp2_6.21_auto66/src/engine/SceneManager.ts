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

interface EnvGradientStop {
  position: number;
  color: string;
}

const ENV_GRADIENTS: Record<EnvType, { top: EnvGradientStop[]; bottom: EnvGradientStop[]; horizon: string }> = {
  sunset: {
    top: [
      { position: 0, color: '#1a0a2e' },
      { position: 0.3, color: '#4a1942' },
      { position: 0.5, color: '#ff6b35' }
    ],
    bottom: [
      { position: 0, color: '#ff9a56' },
      { position: 0.4, color: '#ffc857' },
      { position: 1, color: '#2d3a4a' }
    ],
    horizon: '#ffb347'
  },
  bluehour: {
    top: [
      { position: 0, color: '#0a1628' },
      { position: 0.4, color: '#1e3a5f' },
      { position: 0.6, color: '#3a6ea5' }
    ],
    bottom: [
      { position: 0, color: '#5b9bd5' },
      { position: 0.3, color: '#7eb8da' },
      { position: 1, color: '#1a2a3a' }
    ],
    horizon: '#6ba3d6'
  },
  space: {
    top: [
      { position: 0, color: '#000008' },
      { position: 0.5, color: '#0a0a1a' },
      { position: 0.8, color: '#1a1a3a' }
    ],
    bottom: [
      { position: 0, color: '#2a1a4a' },
      { position: 0.5, color: '#1a0a2a' },
      { position: 1, color: '#050510' }
    ],
    horizon: '#1a1a3a'
  },
  neutral: {
    top: [
      { position: 0, color: '#2a2a3a' },
      { position: 0.5, color: '#4a4a5a' },
      { position: 0.7, color: '#6a6a7a' }
    ],
    bottom: [
      { position: 0, color: '#8a8a9a' },
      { position: 0.4, color: '#7a7a8a' },
      { position: 1, color: '#3a3a4a' }
    ],
    horizon: '#7a7a8a'
  }
};

export class SceneManager {
  private models: Map<string, ModelData> = new Map();
  private envTextureCache: Map<EnvType, THREE.Texture> = new Map();
  private raycaster: THREE.Raycaster = new THREE.Raycaster();

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

  worldToLocal(modelId: string, worldPoint: THREE.Vector3): THREE.Vector3 {
    const model = this.models.get(modelId);
    if (!model) return worldPoint.clone();

    const localPoint = worldPoint.clone();
    model.mesh.worldToLocal(localPoint);
    return localPoint;
  }

  applyBrush(
    modelId: string,
    hitPointWorld: THREE.Vector3,
    viewDirection: THREE.Vector3,
    params: BrushParams
  ): Float32Array | null {
    const model = this.models.get(modelId);
    if (!model) return null;

    const hitPointLocal = this.worldToLocal(modelId, hitPointWorld);

    const positions = model.geometry.getAttribute(
      'position'
    ) as THREE.BufferAttribute;
    const indices = model.geometry.getIndex();
    const currentPositions = new Float32Array(positions.array);
    const indicesArray = indices
      ? (indices.array as Uint32Array | Uint16Array)
      : null;

    const localViewDir = viewDirection.clone();
    const inverseQuat = model.mesh.quaternion.clone().invert();
    localViewDir.applyQuaternion(inverseQuat);

    const newPositions = BrushTool.applyBrush(
      currentPositions,
      indicesArray,
      hitPointLocal,
      localViewDir,
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

    model.geometry.computeVertexNormals();
    const normalAttr = model.geometry.getAttribute(
      'normal'
    ) as THREE.BufferAttribute;
    normalAttr.needsUpdate = true;
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
    if (this.envTextureCache.has(envType)) {
      return this.envTextureCache.get(envType)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    const gradientConfig = ENV_GRADIENTS[envType];

    const topGradient = ctx.createLinearGradient(0, 0, 0, canvas.height / 2);
    gradientConfig.top.forEach((stop) => {
      topGradient.addColorStop(stop.position, stop.color);
    });

    const bottomGradient = ctx.createLinearGradient(
      0,
      canvas.height / 2,
      0,
      canvas.height
    );
    gradientConfig.bottom.forEach((stop) => {
      bottomGradient.addColorStop(stop.position, stop.color);
    });

    ctx.fillStyle = topGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height / 2);

    ctx.fillStyle = bottomGradient;
    ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height / 2);

    const horizonY = canvas.height / 2;
    const horizonGradient = ctx.createLinearGradient(
      0,
      horizonY - 20,
      0,
      horizonY + 20
    );
    horizonGradient.addColorStop(0, 'rgba(255,255,255,0)');
    horizonGradient.addColorStop(0.5, gradientConfig.horizon);
    horizonGradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = horizonGradient;
    ctx.fillRect(0, horizonY - 20, canvas.width, 40);

    if (envType === 'sunset' || envType === 'space') {
      const starCount = envType === 'space' ? 100 : 30;
      for (let i = 0; i < starCount; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height * 0.5;
        const size = Math.random() * 1.5 + 0.5;
        const brightness = Math.random() * 0.5 + 0.5;

        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
        ctx.fill();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.needsUpdate = true;

    this.envTextureCache.set(envType, texture);
    return texture;
  }

  preloadEnvironmentTextures(): void {
    const envTypes: EnvType[] = ['sunset', 'bluehour', 'space', 'neutral'];
    envTypes.forEach((type) => {
      if (!this.envTextureCache.has(type)) {
        this.createEnvironmentTexture(type);
      }
    });
  }

  getRaycaster(): THREE.Raycaster {
    return this.raycaster;
  }

  dispose(): void {
    this.models.forEach((model) => {
      model.geometry.dispose();
      model.material.dispose();
    });
    this.models.clear();

    this.envTextureCache.forEach((texture) => {
      texture.dispose();
    });
    this.envTextureCache.clear();
  }
}
