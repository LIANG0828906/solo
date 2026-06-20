import * as THREE from 'three';
import { MoleculeData, AtomData, CPK_COLORS, ATOM_RADII } from './MoleculeParser';

export interface AtomMeshData {
  mesh: THREE.Mesh;
  atomIndex: number;
  atomData: AtomData;
  highlightRing?: THREE.Mesh;
}

export class MoleculeRenderer {
  private scene: THREE.Scene;
  private moleculeGroup: THREE.Group;
  private atomMeshes: AtomMeshData[] = [];
  private bondMeshes: THREE.Mesh[] = [];
  private selectedAtomIndex: number | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.moleculeGroup = new THREE.Group();
    this.scene.add(this.moleculeGroup);
  }

  getGroup(): THREE.Group {
    return this.moleculeGroup;
  }

  getAtomMeshes(): AtomMeshData[] {
    return this.atomMeshes;
  }

  renderMolecule(data: MoleculeData): void {
    this.clearMolecule();
    
    data.atoms.forEach((atom, index) => {
      this.createAtom(atom, index);
    });
    
    data.bonds.forEach((bond) => {
      this.createBond(data.atoms[bond.atom1], data.atoms[bond.atom2]);
    });
    
    this.centerMolecule();
  }

  private clearMolecule(): void {
    while (this.moleculeGroup.children.length > 0) {
      const child = this.moleculeGroup.children[0];
      this.moleculeGroup.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    }
    this.atomMeshes = [];
    this.bondMeshes = [];
    this.selectedAtomIndex = null;
  }

  private createAtom(atom: AtomData, index: number): void {
    const radius = ATOM_RADII[atom.type] || 0.5;
    const color = CPK_COLORS[atom.type] || '#808080';
    
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshPhongMaterial({
      color: new THREE.Color(color),
      shininess: 30,
      specular: new THREE.Color(0x333333)
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(atom.x, atom.y, atom.z);
    mesh.userData = { atomIndex: index, atomType: atom.type };
    
    this.moleculeGroup.add(mesh);
    this.atomMeshes.push({ mesh, atomIndex: index, atomData: { ...atom } });
  }

  private createBond(atom1: AtomData, atom2: AtomData): void {
    const start = new THREE.Vector3(atom1.x, atom1.y, atom1.z);
    const end = new THREE.Vector3(atom2.x, atom2.y, atom2.z);
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    
    const geometry = new THREE.CylinderGeometry(0.08, 0.08, length, 16);
    const material = new THREE.MeshStandardMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.8,
      roughness: 0.5,
      metalness: 0.2
    });
    
    const bond = new THREE.Mesh(geometry, material);
    
    const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    bond.position.copy(midpoint);
    
    bond.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.clone().normalize()
    );
    
    this.moleculeGroup.add(bond);
    this.bondMeshes.push(bond);
  }

  private centerMolecule(): void {
    const box = new THREE.Box3().setFromObject(this.moleculeGroup);
    const center = new THREE.Vector3();
    box.getCenter(center);
    this.moleculeGroup.position.sub(center);
  }

  updateAtomColor(atomIndex: number, newType: string): void {
    const atomData = this.atomMeshes[atomIndex];
    if (!atomData) return;
    
    const color = CPK_COLORS[newType] || '#808080';
    const radius = ATOM_RADII[newType] || 0.5;
    
    const material = atomData.mesh.material as THREE.MeshPhongMaterial;
    material.color.set(color);
    
    atomData.mesh.geometry.dispose();
    atomData.mesh.geometry = new THREE.SphereGeometry(radius, 32, 32);
    
    atomData.atomData.type = newType;
    atomData.mesh.userData.atomType = newType;
    
    if (atomData.highlightRing) {
      const ringMaterial = atomData.highlightRing.material as THREE.MeshBasicMaterial;
      ringMaterial.color.set(color);
    }
  }

  selectAtom(atomIndex: number | null): void {
    if (this.selectedAtomIndex !== null) {
      this.removeHighlight(this.selectedAtomIndex);
    }
    
    this.selectedAtomIndex = atomIndex;
    
    if (atomIndex !== null) {
      this.addHighlight(atomIndex);
    }
  }

  private addHighlight(atomIndex: number): void {
    const atomData = this.atomMeshes[atomIndex];
    if (!atomData) return;
    
    const radius = ATOM_RADII[atomData.atomData.type] || 0.5;
    const ringRadius = radius + 0.2;
    const color = CPK_COLORS[atomData.atomData.type] || '#808080';
    
    const ringGeometry = new THREE.SphereGeometry(ringRadius, 32, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.6,
      side: THREE.BackSide
    });
    
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.copy(atomData.mesh.position);
    
    this.moleculeGroup.add(ring);
    atomData.highlightRing = ring;
    
    const material = atomData.mesh.material as THREE.MeshPhongMaterial;
    material.emissive = new THREE.Color(color);
    material.emissiveIntensity = 0.3;
  }

  private removeHighlight(atomIndex: number): void {
    const atomData = this.atomMeshes[atomIndex];
    if (!atomData) return;
    
    if (atomData.highlightRing) {
      this.moleculeGroup.remove(atomData.highlightRing);
      atomData.highlightRing.geometry.dispose();
      (atomData.highlightRing.material as THREE.Material).dispose();
      atomData.highlightRing = undefined;
    }
    
    const material = atomData.mesh.material as THREE.MeshPhongMaterial;
    material.emissive = new THREE.Color(0x000000);
    material.emissiveIntensity = 0;
  }

  getSelectedAtomIndex(): number | null {
    return this.selectedAtomIndex;
  }

  setOpacity(opacity: number): void {
    this.moleculeGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const material = child.material as THREE.Material;
        if (material.transparent !== undefined) {
          material.transparent = true;
        }
        if ('opacity' in material) {
          (material as THREE.Material & { opacity: number }).opacity = opacity;
        }
      }
    });
  }

  getMoleculeData(): MoleculeData | null {
    if (this.atomMeshes.length === 0) return null;
    
    const atoms: AtomData[] = this.atomMeshes.map(a => ({
      type: a.atomData.type,
      x: a.mesh.position.x,
      y: a.mesh.position.y,
      z: a.mesh.position.z
    }));
    
    const bonds = [];
    const bondSet = new Set<string>();
    
    for (let i = 0; i < atoms.length; i++) {
      for (let j = i + 1; j < atoms.length; j++) {
        const dx = atoms[j].x - atoms[i].x;
        const dy = atoms[j].y - atoms[i].y;
        const dz = atoms[j].z - atoms[i].z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (dist < 2.0) {
          const key = `${i}-${j}`;
          if (!bondSet.has(key)) {
            bondSet.add(key);
            bonds.push({ atom1: i, atom2: j, length: dist });
          }
        }
      }
    }
    
    return {
      atoms,
      bonds,
      formula: 'custom'
    };
  }

  dispose(): void {
    this.clearMolecule();
    this.scene.remove(this.moleculeGroup);
  }
}
