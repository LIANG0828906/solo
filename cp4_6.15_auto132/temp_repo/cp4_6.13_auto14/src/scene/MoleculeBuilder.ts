import * as THREE from 'three';
import { MoleculeData, AtomData, BondData, ELEMENT_COLORS, ELEMENT_RADII } from '../data/MoleculeData';

export type DisplayMode = 'ball-stick' | 'space-filling' | 'wireframe';

const BALL_STICK_ATOM_SCALE = 0.35;
const BOND_RADIUS = 0.12;
const WIREFRAME_ATOM_SCALE = 0.15;

export class MoleculeBuilder {
  private geometries: Map<string, THREE.SphereGeometry> = new Map();
  private bondGeometry: THREE.CylinderGeometry | null = null;
  private materials: Map<string, THREE.MeshStandardMaterial> = new Map();
  private bondMaterial: THREE.MeshStandardMaterial | null = null;

  constructor() {
    this.initSharedResources();
  }

  private initSharedResources(): void {
    for (const [element, color] of Object.entries(ELEMENT_COLORS)) {
      this.geometries.set(element, new THREE.SphereGeometry(1, 16, 16));
      this.materials.set(
        element,
        new THREE.MeshStandardMaterial({
          color: color,
          metalness: 0.3,
          roughness: 0.25,
        })
      );
    }

    this.bondGeometry = new THREE.CylinderGeometry(1, 1, 1, 8);
    this.bondMaterial = new THREE.MeshStandardMaterial({
      color: 0x888899,
      metalness: 0.2,
      roughness: 0.5,
      transparent: true,
      opacity: 0.7,
    });
  }

  public build(data: MoleculeData, mode: DisplayMode = 'ball-stick'): THREE.Group {
    const group = new THREE.Group();
    group.name = 'molecule';

    const atomsGroup = new THREE.Group();
    atomsGroup.name = 'atoms';

    const bondsGroup = new THREE.Group();
    bondsGroup.name = 'bonds';

    const atomMeshes: THREE.Mesh[] = [];

    for (let i = 0; i < data.atoms.length; i++) {
      const atom = data.atoms[i];
      const mesh = this.createAtomMesh(atom, mode, i);
      atomMeshes.push(mesh);
      atomsGroup.add(mesh);
    }

    for (const bond of data.bonds) {
      const bondMesh = this.createBondMesh(
        data.atoms[bond.from],
        data.atoms[bond.to],
        mode,
        bond.order
      );
      if (bondMesh) {
        bondsGroup.add(bondMesh);
      }
    }

    group.add(bondsGroup);
    group.add(atomsGroup);

    (group as any).userData = {
      moleculeData: data,
      displayMode: mode,
      atomMeshes,
    };

    return group;
  }

  private createAtomMesh(atom: AtomData, mode: DisplayMode, index: number): THREE.Mesh {
    const element = atom.element;
    const baseRadius = ELEMENT_RADII[element] ?? 0.5;
    const geometry = this.geometries.get(element) ?? this.geometries.get('C')!;
    const material = this.materials.get(element) ?? this.materials.get('C')!;

    const mesh = new THREE.Mesh(geometry, material.clone());
    mesh.position.set(atom.position[0], atom.position[1], atom.position[2]);

    let scale: number;
    switch (mode) {
      case 'space-filling':
        scale = baseRadius;
        break;
      case 'wireframe':
        scale = baseRadius * WIREFRAME_ATOM_SCALE;
        break;
      case 'ball-stick':
      default:
        scale = baseRadius * BALL_STICK_ATOM_SCALE + 0.1;
        break;
    }

    mesh.scale.setScalar(scale);
    mesh.userData = {
      element,
      baseRadius,
      index,
      originalPosition: new THREE.Vector3(...atom.position),
    };

    return mesh;
  }

  private createBondMesh(
    atom1: AtomData,
    atom2: AtomData,
    mode: DisplayMode,
    order: number = 1
  ): THREE.Group | null {
    if (mode === 'space-filling') return null;

    const group = new THREE.Group();
    group.name = 'bond';

    const p1 = new THREE.Vector3(...atom1.position);
    const p2 = new THREE.Vector3(...atom2.position);
    const direction = new THREE.Vector3().subVectors(p2, p1);
    const length = direction.length();

    if (length < 0.001) return null;

    const radius = mode === 'wireframe' ? BOND_RADIUS * 0.4 : BOND_RADIUS;
    const numCylinders = mode === 'wireframe' ? 1 : Math.min(order, 3);
    const offset = mode === 'wireframe' ? 0 : 0.18;

    for (let i = 0; i < numCylinders; i++) {
      const cylinder = new THREE.Mesh(
        this.bondGeometry!,
        (this.bondMaterial as THREE.MeshStandardMaterial).clone()
      );

      const t = (i - (numCylinders - 1) / 2) * offset;
      const perp = new THREE.Vector3(-direction.z, 0, direction.x).normalize();
      if (perp.length() < 0.001) {
        perp.set(1, 0, 0);
      }
      const offsetVec = perp.multiplyScalar(t);

      cylinder.scale.set(radius, length, radius);
      cylinder.position.copy(p1).add(p2).multiplyScalar(0.5).add(offsetVec);
      cylinder.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction.clone().normalize()
      );

      if (mode === 'wireframe') {
        const mat = cylinder.material as THREE.Material;
        mat.dispose();
        cylinder.material = new THREE.MeshBasicMaterial({
          color: 0x6666aa,
          transparent: true,
          opacity: 0.6,
        });
      }

      group.add(cylinder);
    }

    return group;
  }

  public setDisplayMode(group: THREE.Group, mode: DisplayMode): void {
    const userData = (group as any).userData;
    if (!userData || userData.displayMode === mode) return;

    const data: MoleculeData = userData.moleculeData;
    const atomsGroup = group.getObjectByName('atoms') as THREE.Group;
    const bondsGroup = group.getObjectByName('bonds') as THREE.Group;

    while (atomsGroup.children.length > 0) {
      atomsGroup.remove(atomsGroup.children[0]);
    }
    while (bondsGroup.children.length > 0) {
      bondsGroup.remove(bondsGroup.children[0]);
    }

    const atomMeshes: THREE.Mesh[] = [];
    for (let i = 0; i < data.atoms.length; i++) {
      const atom = data.atoms[i];
      const mesh = this.createAtomMesh(atom, mode, i);
      atomMeshes.push(mesh);
      atomsGroup.add(mesh);
    }

    for (const bond of data.bonds) {
      const bondMesh = this.createBondMesh(
        data.atoms[bond.from],
        data.atoms[bond.to],
        mode,
        bond.order
      );
      if (bondMesh) {
        bondsGroup.add(bondMesh);
      }
    }

    userData.displayMode = mode;
    userData.atomMeshes = atomMeshes;
  }

  public highlightMolecule(group: THREE.Group, highlight: boolean): void {
    const atomsGroup = group.getObjectByName('atoms');
    if (!atomsGroup) return;

    atomsGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshStandardMaterial;
        if (highlight) {
          mat.emissive = new THREE.Color(0x00ffff);
          mat.emissiveIntensity = 0.3;
        } else {
          mat.emissive = new THREE.Color(0x000000);
          mat.emissiveIntensity = 0;
        }
      }
    });
  }

  public dispose(): void {
    this.geometries.forEach((geo) => geo.dispose());
    this.materials.forEach((mat) => mat.dispose());
    if (this.bondGeometry) this.bondGeometry.dispose();
    if (this.bondMaterial) this.bondMaterial.dispose();
  }
}
