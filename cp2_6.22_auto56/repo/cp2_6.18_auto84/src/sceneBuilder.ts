import * as THREE from 'three';
import type { BuildingData } from './main';

export interface SceneBuildResult {
  meshes: THREE.Object3D[];
  buildingMeshes: THREE.Mesh[];
  groundMesh: THREE.Mesh;
}

export class SceneBuilder {
  build(buildings: BuildingData[]): SceneBuildResult {
    const meshes: THREE.Object3D[] = [];
    const buildingMeshes: THREE.Mesh[] = [];

    const groundGeometry = new THREE.PlaneGeometry(40, 40);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d2d2d,
      roughness: 0.9,
      metalness: 0.1,
    });
    const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    meshes.push(groundMesh);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    meshes.push(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(15, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 60;
    directionalLight.shadow.camera.left = -25;
    directionalLight.shadow.camera.right = 25;
    directionalLight.shadow.camera.top = 25;
    directionalLight.shadow.camera.bottom = -25;
    directionalLight.shadow.bias = -0.0005;
    meshes.push(directionalLight);

    for (let i = 0; i < buildings.length; i++) {
      const b = buildings[i];
      const geometry = new THREE.BoxGeometry(
        Math.max(b.width - 0.3, 0.3),
        Math.max(b.height, 0.5),
        Math.max(b.depth - 0.3, 0.3),
      );

      const color = new THREE.Color(b.color);
      const material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.6,
        metalness: 0.2,
        emissive: new THREE.Color(0x000000),
        emissiveIntensity: 0,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(b.x, Math.max(b.height, 0.5) / 2, b.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      (mesh as any).buildingId = i;

      buildingMeshes.push(mesh);
      meshes.push(mesh);
    }

    return { meshes, buildingMeshes, groundMesh };
  }
}
