import * as THREE from 'three';
import type { ModelTransform } from '@/types';
import type { LoadedModel } from './ModelLoader';
import { useComparisonStore } from '@/store/useComparisonStore';

interface ManagedModel {
  id: 'A' | 'B';
  root: THREE.Group;
  wrapper: THREE.Group;
  transform: ModelTransform;
  edgeColor: string;
  loaded: boolean;
}

class ModelManagerClass {
  private models: Map<'A' | 'B', ManagedModel> = new Map();
  private edgeGlowMaterials: Map<string, THREE.LineBasicMaterial> = new Map();

  registerModel(
    id: 'A' | 'B',
    loadedModel: LoadedModel,
    edgeColor: string,
    initialTransform?: Partial<ModelTransform>
  ): THREE.Group {
    const wrapper = new THREE.Group();
    wrapper.name = `ModelWrapper_${id}`;
    wrapper.add(loadedModel.scene);

    const defaultTransform: ModelTransform = {
      position: id === 'A' ? [-3, 0, 0] : [3, 0, 0],
      rotation: [0, 0, 0],
      scale: 1,
      ...initialTransform,
    };

    wrapper.position.set(...defaultTransform.position);
    wrapper.rotation.set(...defaultTransform.rotation);
    wrapper.scale.setScalar(defaultTransform.scale);

    const managed: ManagedModel = {
      id,
      root: loadedModel.scene,
      wrapper,
      transform: defaultTransform,
      edgeColor,
      loaded: true,
    };

    this.models.set(id, managed);

    useComparisonStore.getState().setModelTransform(id, defaultTransform);

    return wrapper;
  }

  getWrapper(id: 'A' | 'B'): THREE.Group | null {
    return this.models.get(id)?.wrapper || null;
  }

  getRoot(id: 'A' | 'B'): THREE.Group | null {
    return this.models.get(id)?.root || null;
  }

  isLoaded(id: 'A' | 'B'): boolean {
    return this.models.get(id)?.loaded || false;
  }

  bothLoaded(): boolean {
    return this.isLoaded('A') && this.isLoaded('B');
  }

  setTransform(id: 'A' | 'B', transform: Partial<ModelTransform>): void {
    const model = this.models.get(id);
    if (!model) return;

    model.transform = { ...model.transform, ...transform };

    if (transform.position) {
      model.wrapper.position.set(...transform.position);
    }
    if (transform.rotation) {
      model.wrapper.rotation.set(...transform.rotation);
    }
    if (transform.scale !== undefined) {
      model.wrapper.scale.setScalar(transform.scale);
    }

    useComparisonStore.getState().setModelTransform(id, model.transform);
  }

  getTransform(id: 'A' | 'B'): ModelTransform | null {
    return this.models.get(id)?.transform || null;
  }

  setOverlayOpacity(id: 'A' | 'B', opacity: number, hueShift: number = 0): void {
    const model = this.models.get(id);
    if (!model) return;

    const effectiveOpacity = Math.max(0.05, Math.min(1, opacity));
    const hsl = { h: 0, s: 0, l: 0 };

    model.root.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) {
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach((mat) => {
          if ((mat as THREE.MeshStandardMaterial).isMeshStandardMaterial ||
              (mat as THREE.MeshBasicMaterial).isMeshBasicMaterial) {
            const m = mat as THREE.MeshStandardMaterial;
            m.transparent = effectiveOpacity < 1;
            m.opacity = effectiveOpacity;
            m.needsUpdate = true;

            if (hueShift !== 0) {
              (m.color as THREE.Color).getHSL(hsl);
              hsl.h = (hsl.h + hueShift + 1) % 1;
              if (hsl.s < 0.15) hsl.s = 0.35;
              (m.color as THREE.Color).setHSL(hsl.h, hsl.s, hsl.l);
            }
          }
        });
      }

      if ((child as THREE.LineSegments).isLineSegments && child.name.startsWith('__edge_')) {
        const line = child as THREE.LineSegments;
        const mat = line.material as THREE.LineBasicMaterial;
        mat.transparent = true;
        mat.opacity = 0.4 + effectiveOpacity * 0.4;
        this.edgeGlowMaterials.set(child.uuid, mat);
      }
    });
  }

  getMeshes(id: 'A' | 'B'): THREE.Mesh[] {
    const model = this.models.get(id);
    if (!model) return [];
    const meshes: THREE.Mesh[] = [];
    model.root.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        meshes.push(child as THREE.Mesh);
      }
    });
    return meshes;
  }

  findMeshByName(id: 'A' | 'B', pattern: RegExp | string): THREE.Mesh | null {
    const model = this.models.get(id);
    if (!model) return null;

    const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
    let found: THREE.Mesh | null = null;

    model.root.traverse((child) => {
      if (found) return;
      if ((child as THREE.Mesh).isMesh && regex.test(child.name)) {
        found = child as THREE.Mesh;
      }
    });

    return found;
  }

  getMeshWorldPosition(mesh: THREE.Mesh): THREE.Vector3 {
    const pos = new THREE.Vector3();
    mesh.getWorldPosition(pos);
    return pos;
  }

  getBoundingSphere(id: 'A' | 'B'): THREE.Sphere | null {
    const model = this.models.get(id);
    if (!model) return null;
    const box = new THREE.Box3().setFromObject(model.wrapper);
    const sphere = new THREE.Sphere();
    box.getBoundingSphere(sphere);
    return sphere;
  }

  centerModelsForSplitView(): void {
    if (this.isLoaded('A')) {
      this.setTransform('A', { position: [-2.5, 0, 0] });
    }
    if (this.isLoaded('B')) {
      this.setTransform('B', { position: [2.5, 0, 0] });
    }
  }

  centerModelsForOverlay(): void {
    const origin: [number, number, number] = [0, 0, 0];
    if (this.isLoaded('A')) {
      this.setTransform('A', { position: origin });
    }
    if (this.isLoaded('B')) {
      this.setTransform('B', { position: origin });
    }
  }

  dispose(): void {
    this.models.forEach((model) => {
      model.root.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.geometry?.dispose?.();
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((m) => (m as THREE.Material).dispose?.());
        }
      });
    });
    this.models.clear();
    this.edgeGlowMaterials.clear();
  }
}

export const ModelManager = new ModelManagerClass();
export default ModelManager;
