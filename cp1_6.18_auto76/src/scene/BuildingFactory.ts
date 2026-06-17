import * as THREE from 'three';
import type { BuildingData, BuildingStyle } from '../types';
import { STYLE_COLORS } from '../types';

const BASE_WIDTH = 6;
const BASE_DEPTH = 6;

class BuildingFactory {
  private materialCache: Map<BuildingStyle, THREE.MeshStandardMaterial> = new Map();

  private getMaterial(style: BuildingStyle): THREE.MeshStandardMaterial {
    if (!this.materialCache.has(style)) {
      const color = STYLE_COLORS[style];
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0,
        roughness: 0.7,
        metalness: 0.1,
      });
      this.materialCache.set(style, material);
    }
    return this.materialCache.get(style)!;
  }

  createBuilding(data: BuildingData): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(BASE_WIDTH, data.height, BASE_DEPTH);
    const material = this.getMaterial(data.style).clone();
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(data.x, data.height / 2, data.z);
    mesh.userData = { buildingId: data.id, buildingData: data };
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
  }

  createBuildingWithHeight(data: BuildingData, height: number): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(BASE_WIDTH, height, BASE_DEPTH);
    const material = this.getMaterial(data.style).clone();
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(data.x, height / 2, data.z);
    mesh.userData = { buildingId: data.id, buildingData: data, baseHeight: data.height };
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
  }

  updateBuildingHeight(mesh: THREE.Mesh, newHeight: number): void {
    const data = mesh.userData.buildingData as BuildingData;
    if (!data) return;

    const oldGeometry = mesh.geometry as THREE.BoxGeometry;
    oldGeometry.dispose();

    const geometry = new THREE.BoxGeometry(BASE_WIDTH, newHeight, BASE_DEPTH);
    mesh.geometry = geometry;
    mesh.position.y = newHeight / 2;
  }

  setBuildingOpacity(mesh: THREE.Mesh, opacity: number): void {
    const material = mesh.material as THREE.MeshStandardMaterial;
    if (material) {
      material.opacity = opacity;
      material.transparent = opacity < 1;
    }
  }

  dispose(): void {
    this.materialCache.forEach((material) => material.dispose());
    this.materialCache.clear();
  }
}

export const buildingFactory = new BuildingFactory();
export { BuildingFactory };
