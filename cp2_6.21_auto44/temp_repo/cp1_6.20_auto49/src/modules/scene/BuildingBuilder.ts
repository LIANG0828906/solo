import * as THREE from 'three';
import { Building } from '../../types';

export class BuildingBuilder {
  private windowLightIntensity = 0;

  setWindowLightIntensity(intensity: number): void {
    this.windowLightIntensity = intensity;
  }

  createBuilding(building: Building): THREE.Group {
    const group = new THREE.Group();
    group.name = building.id;
    group.userData.buildingId = building.id;

    const width = 10;
    const depth = 10;
    const height = building.height;

    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({
      color: building.color,
      roughness: 0.7,
      metalness: 0.1,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = height / 2;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    const edges = this.createEdges(width, height, depth);
    edges.position.y = height / 2;
    group.add(edges);

    const windows = this.createWindowLights(width, height, depth);
    if (windows) {
      group.add(windows);
    }

    group.position.set(building.position.x, building.position.y, building.position.z);
    group.rotation.y = building.rotation;

    return group;
  }

  private createEdges(width: number, height: number, depth: number): THREE.LineSegments {
    const edgeGeometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(width, height, depth));
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.6,
    });
    return new THREE.LineSegments(edgeGeometry, edgeMaterial);
  }

  private createWindowLights(width: number, height: number, depth: number): THREE.Group | null {
    if (this.windowLightIntensity <= 0) return null;

    const group = new THREE.Group();
    const windowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffdd88,
      transparent: true,
      opacity: this.windowLightIntensity * 0.8,
    });

    const windowWidth = 1.5;
    const windowHeight = 2;
    const floors = Math.floor(height / 3);
    const windowsPerFloor = 3;

    for (let face = 0; face < 4; face++) {
      for (let floor = 0; floor < floors; floor++) {
        for (let w = 0; w < windowsPerFloor; w++) {
          if (Math.random() > 0.3) {
            const windowGeo = new THREE.PlaneGeometry(windowWidth, windowHeight);
            const windowMesh = new THREE.Mesh(windowGeo, windowMaterial.clone());
            const y = floor * 3 + 1.5;
            const x = (w - 1) * 3;

            switch (face) {
              case 0:
                windowMesh.position.set(x, y, depth / 2 + 0.01);
                break;
              case 1:
                windowMesh.position.set(-x, y, -depth / 2 - 0.01);
                windowMesh.rotation.y = Math.PI;
                break;
              case 2:
                windowMesh.position.set(width / 2 + 0.01, y, x);
                windowMesh.rotation.y = Math.PI / 2;
                break;
              case 3:
                windowMesh.position.set(-width / 2 - 0.01, y, -x);
                windowMesh.rotation.y = -Math.PI / 2;
                break;
            }

            if (Math.random() > 0.5) {
              (windowMesh.material as THREE.MeshBasicMaterial).color.set(0xffffee);
            }

            group.add(windowMesh);
          }
        }
      }
    }

    return group;
  }

  updateHeight(group: THREE.Group, newHeight: number): void {
    const mesh = group.children[0] as THREE.Mesh;
    const edges = group.children[1] as THREE.LineSegments;

    const oldHeight = (mesh.geometry as THREE.BoxGeometry).parameters.height;
    const scale = newHeight / oldHeight;

    mesh.scale.y = scale;
    mesh.position.y = newHeight / 2;

    edges.scale.y = scale;
    edges.position.y = newHeight / 2;

    for (let i = 2; i < group.children.length; i++) {
      const child = group.children[i];
      child.scale.y = scale;
    }
  }
}

export const buildingBuilder = new BuildingBuilder();
