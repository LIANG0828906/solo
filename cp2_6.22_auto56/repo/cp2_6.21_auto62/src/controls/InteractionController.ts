import * as THREE from 'three';
import type { AtomInfo } from '../types';

export class InteractionController {
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  constructor() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
  }

  getAtomAtMousePosition(
    event: MouseEvent,
    camera: THREE.Camera,
    atomMeshes: THREE.Mesh[]
  ): AtomInfo | null {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, camera);
    const intersects = this.raycaster.intersectObjects(atomMeshes, false);

    if (intersects.length > 0) {
      const mesh = intersects[0].object as THREE.Mesh;
      if (mesh.userData && mesh.userData.atomInfo) {
        return mesh.userData.atomInfo as AtomInfo;
      }
    }

    return null;
  }

  static calculateDistance(atom1: AtomInfo, atom2: AtomInfo): number {
    const pos1 = new THREE.Vector3(...atom1.position);
    const pos2 = new THREE.Vector3(...atom2.position);
    return pos1.distanceTo(pos2);
  }
}
