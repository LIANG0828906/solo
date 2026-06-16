import * as THREE from 'three';
import type { Atom, Bond, MaterialData, Vec3 } from '../types';
import { ELEMENT_COLORS } from '../types';
import { SceneManager } from './SceneManager';
import { useMaterialStore, generateMaterials } from '../stores/useMaterialStore';
import { randomEngine } from '../utils/randomEngine';

export class AtomSystem {
  private sceneManager: SceneManager;
  private atomMeshes: Map<string, THREE.Mesh> = new Map();
  private bondMeshes: Map<string, THREE.Mesh> = new Map();
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private baseAtomRadius: number = 0.4;
  private hoveredAtomId: string | null = null;
  private highlightedMesh: THREE.Mesh | null = null;
  private pulseTime: number = 0;

  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.setupInteractions();
  }

  private setupInteractions(): void {
    const canvas = this.sceneManager.renderer.domElement;

    canvas.addEventListener('click', (e) => this.onClick(e));
    canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));

    this.sceneManager.onFrame((delta) => {
      this.pulseTime += delta;
      this.updateHighlightPulse();
    });

    useMaterialStore.subscribe(
      (state) => state.selectedAtom,
      (atom) => this.onSelectedAtomChange(atom)
    );

    useMaterialStore.subscribe(
      (state) => state.visualParams,
      () => this.refreshVisuals(),
      { fireImmediately: false }
    );
  }

  private onMouseMove(event: MouseEvent): void {
    const rect = this.sceneManager.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);
    const meshes = Array.from(this.atomMeshes.values());
    const intersects = this.raycaster.intersectObjects(meshes);

    const canvas = this.sceneManager.renderer.domElement;
    if (intersects.length > 0) {
      canvas.style.cursor = 'pointer';
    } else {
      canvas.style.cursor = 'grab';
    }
  }

  private onClick(event: MouseEvent): void {
    const rect = this.sceneManager.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);
    const meshes = Array.from(this.atomMeshes.values());
    const intersects = this.raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const mesh = intersects[0].object as THREE.Mesh;
      const atomId = mesh.userData.atomId as string;
      const state = useMaterialStore.getState();
      const material = state.materials[state.currentMaterial];
      const atom = material.atoms.find((a) => a.id === atomId);
      if (atom) {
        state.selectAtom(atom);
      }
    } else {
      useMaterialStore.getState().selectAtom(null);
    }
  }

  private onSelectedAtomChange(atom: Atom | null): void {
    this.sceneManager.clearHighlights();
    this.highlightedMesh = null;

    if (atom) {
      const mesh = this.atomMeshes.get(atom.id);
      if (mesh) {
        const highlightGeo = new THREE.SphereGeometry(this.baseAtomRadius * 1.4, 32, 32);
        const highlightMat = new THREE.MeshBasicMaterial({
          color: 0x58a6ff,
          transparent: true,
          opacity: 0.3,
          side: THREE.BackSide,
        });
        const highlight = new THREE.Mesh(highlightGeo, highlightMat);
        highlight.position.copy(mesh.position);
        this.sceneManager.highlightGroup.add(highlight);
        this.highlightedMesh = highlight;
      }
    }
  }

  private updateHighlightPulse(): void {
    if (this.highlightedMesh) {
      const scale = 1 + Math.sin(this.pulseTime * 3) * 0.08;
      this.highlightedMesh.scale.setScalar(scale);
    }
  }

  public buildMaterial(material: MaterialData): void {
    this.clear();

    const state = useMaterialStore.getState();
    const { atomScale, showBonds, generateDefects, defectDensity } = state.visualParams;

    let data = material;
    if (generateDefects) {
      const newMats = generateMaterials();
      data = randomEngine.generateDefects(newMats[material.id], defectDensity);
    }

    data.atoms.forEach((atom) => {
      this.createAtomMesh(atom, atomScale);
    });

    if (showBonds) {
      data.bonds.forEach((bond) => {
        this.createBondMesh(bond, data.atoms);
      });
    }
  }

  private createAtomMesh(atom: Atom, scale: number): void {
    const color = new THREE.Color(ELEMENT_COLORS[atom.element]);
    const radius = this.baseAtomRadius * scale;

    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.3,
      roughness: 0.4,
      emissive: color,
      emissiveIntensity: atom.isDefect ? 0.25 : 0.08,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(atom.position.x, atom.position.y, atom.position.z);
    mesh.userData.atomId = atom.id;
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    this.sceneManager.atomGroup.add(mesh);
    this.atomMeshes.set(atom.id, mesh);
  }

  private createBondMesh(bond: Bond, atoms: Atom[]): void {
    const atomA = atoms.find((a) => a.id === bond.atomAId);
    const atomB = atoms.find((a) => a.id === bond.atomBId);
    if (!atomA || !atomB) return;

    const start = new THREE.Vector3(atomA.position.x, atomA.position.y, atomA.position.z);
    const end = new THREE.Vector3(atomB.position.x, atomB.position.y, atomB.position.z);
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();

    const geometry = new THREE.CylinderGeometry(0.08, 0.08, length, 12, 1, true);
    const material = new THREE.MeshStandardMaterial({
      color: 0x667788,
      metalness: 0.5,
      roughness: 0.3,
      transparent: true,
      opacity: 0.6,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(start.clone().add(end).multiplyScalar(0.5));
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.clone().normalize()
    );
    mesh.userData.bondId = bond.id;

    this.sceneManager.bondGroup.add(mesh);
    this.bondMeshes.set(bond.id, mesh);
  }

  public updateAtomScale(scale: number): void {
    const radius = this.baseAtomRadius * scale;
    this.atomMeshes.forEach((mesh) => {
      mesh.geometry.dispose();
      mesh.geometry = new THREE.SphereGeometry(radius, 32, 32);
    });
  }

  public setBondsVisible(visible: boolean): void {
    this.sceneManager.bondGroup.visible = visible;
  }

  public refreshVisuals(): void {
    const state = useMaterialStore.getState();
    const material = state.materials[state.currentMaterial];
    this.buildMaterial(material);
  }

  public clear(): void {
    this.atomMeshes.clear();
    this.bondMeshes.clear();
    this.sceneManager.clearAtoms();
    this.sceneManager.clearBonds();
    this.sceneManager.clearHighlights();
    this.highlightedMesh = null;
  }

  public getAtomPosition(atomId: string): Vec3 | null {
    const mesh = this.atomMeshes.get(atomId);
    if (!mesh) return null;
    return { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z };
  }

  public getAtomMeshById(atomId: string): THREE.Mesh | undefined {
    return this.atomMeshes.get(atomId);
  }
}
