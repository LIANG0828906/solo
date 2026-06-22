import * as THREE from 'three';
import type { MoleculeData, AtomInfo, DisplayMode } from '../types';

export class MoleculeModel {
  private moleculeData: MoleculeData;
  private displayMode: DisplayMode;
  private atomsGroup: THREE.Group;
  private bondsGroup: THREE.Group;
  private atomMeshMap: Map<THREE.Mesh, AtomInfo> = new Map();

  constructor(moleculeData: MoleculeData, displayMode: DisplayMode = 'ball-stick') {
    this.moleculeData = moleculeData;
    this.displayMode = displayMode;
    this.atomsGroup = new THREE.Group();
    this.bondsGroup = new THREE.Group();
    this.build();
  }

  private build(): void {
    this.atomsGroup.clear();
    this.bondsGroup.clear();
    this.atomMeshMap.clear();

    const isSpaceFilling = this.displayMode === 'space-filling';

    this.moleculeData.atoms.forEach((atom, index) => {
      const radius = isSpaceFilling ? atom.radius * 2 : 0.3;
      const geometry = new THREE.SphereGeometry(radius, 32, 32);
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(atom.color),
        roughness: 0.3,
        metalness: 0.1,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(atom.position[0], atom.position[1], atom.position[2]);
      mesh.userData = { atomIndex: index, atomInfo: atom };
      this.atomsGroup.add(mesh);
      this.atomMeshMap.set(mesh, atom);
    });

    if (!isSpaceFilling) {
      this.moleculeData.bonds.forEach((bond) => {
        const atom1 = this.moleculeData.atoms[bond.atom1];
        const atom2 = this.moleculeData.atoms[bond.atom2];
        const start = new THREE.Vector3(...atom1.position);
        const end = new THREE.Vector3(...atom2.position);
        const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        const direction = new THREE.Vector3().subVectors(end, start);
        const length = direction.length();
        const bondRadius = 0.08;

        const offsets = this.getBondOffsets(bond.order);

        offsets.forEach((offset) => {
          const geometry = new THREE.CylinderGeometry(bondRadius, bondRadius, length, 8);
          const material = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#cccccc'),
            roughness: 0.5,
            metalness: 0.1,
          });
          const mesh = new THREE.Mesh(geometry, material);
          mesh.position.copy(mid);

          const up = new THREE.Vector3(0, 1, 0);
          const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction.clone().normalize());
          mesh.quaternion.copy(quaternion);

          if (bond.order > 1 && offset !== 0) {
            const perp = new THREE.Vector3();
            perp.crossVectors(direction, up).normalize();
            if (perp.length() < 0.01) {
              perp.crossVectors(direction, new THREE.Vector3(1, 0, 0)).normalize();
            }
            mesh.position.add(perp.multiplyScalar(offset));
          }

          this.bondsGroup.add(mesh);
        });
      });
    }
  }

  private getBondOffsets(order: number): number[] {
    if (order === 1) return [0];
    if (order === 2) return [-0.1, 0.1];
    if (order === 3) return [-0.15, 0, 0.15];
    return [0];
  }

  getAtomsGroup(): THREE.Group {
    return this.atomsGroup;
  }

  getBondsGroup(): THREE.Group {
    return this.bondsGroup;
  }

  getAtomMeshMap(): Map<THREE.Mesh, AtomInfo> {
    return this.atomMeshMap;
  }

  updateDisplayMode(mode: DisplayMode): void {
    this.displayMode = mode;
    this.build();
  }

  updateMolecule(moleculeData: MoleculeData): void {
    this.moleculeData = moleculeData;
    this.build();
  }

  getAtomMeshes(): THREE.Mesh[] {
    const meshes: THREE.Mesh[] = [];
    this.atomsGroup.children.forEach((child) => {
      if (child instanceof THREE.Mesh) {
        meshes.push(child);
      }
    });
    return meshes;
  }
}
