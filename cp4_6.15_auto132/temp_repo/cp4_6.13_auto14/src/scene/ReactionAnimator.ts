import * as THREE from 'three';
import { MoleculeData, AtomData, getMolecule, BondData } from '../data/MoleculeData';
import { MoleculeBuilder, DisplayMode } from './MoleculeBuilder';

interface ReactionPhase {
  name: 'approach' | 'break' | 'reform' | 'settle';
  duration: number;
}

interface AtomState {
  mesh: THREE.Mesh;
  startPos: THREE.Vector3;
  endPos: THREE.Vector3;
  element: string;
}

interface BondState {
  group: THREE.Group;
  visible: boolean;
  opacity: number;
  fromIdx: number;
  toIdx: number;
}

const PHASES: ReactionPhase[] = [
  { name: 'approach', duration: 0.6 },
  { name: 'break', duration: 0.6 },
  { name: 'reform', duration: 1.2 },
  { name: 'settle', duration: 0.6 },
];

export class ReactionAnimator {
  private builder: MoleculeBuilder;
  private isRunning: boolean = false;
  private currentTime: number = 0;
  private totalDuration: number = 0;
  private atomStates: AtomState[] = [];
  private bondStates: BondState[] = [];
  private containerGroup: THREE.Group | null = null;
  private onCompleteCallback: (() => void) | null = null;
  private productData: MoleculeData | null = null;
  private displayMode: DisplayMode = 'ball-stick';

  constructor(builder: MoleculeBuilder) {
    this.builder = builder;
    this.totalDuration = PHASES.reduce((sum, p) => sum + p.duration, 0);
  }

  public start(
    reactant1Data: MoleculeData,
    reactant2Data: MoleculeData,
    productName: string,
    displayMode: DisplayMode
  ): THREE.Group | null {
    const productData = getMolecule(productName);
    if (!productData) return null;

    this.productData = productData;
    this.displayMode = displayMode;
    this.isRunning = true;
    this.currentTime = 0;
    this.atomStates = [];
    this.bondStates = [];

    this.containerGroup = new THREE.Group();
    this.containerGroup.name = 'reaction-container';

    const atomsGroup = new THREE.Group();
    atomsGroup.name = 'atoms';
    const bondsGroup = new THREE.Group();
    bondsGroup.name = 'bonds';

    const offset1 = new THREE.Vector3(-4, 1, 0);
    const offset2 = new THREE.Vector3(4, -1, 0);
    const targetOffset = new THREE.Vector3(0, 0, 0);

    const allAtoms: { data: AtomData; startOffset: THREE.Vector3; endIdx: number | null }[] = [];

    for (let i = 0; i < reactant1Data.atoms.length; i++) {
      allAtoms.push({
        data: reactant1Data.atoms[i],
        startOffset: offset1,
        endIdx: this.findMatchingAtom(productData, reactant1Data.atoms[i].element, i),
      });
    }
    for (let i = 0; i < reactant2Data.atoms.length; i++) {
      allAtoms.push({
        data: reactant2Data.atoms[i],
        startOffset: offset2,
        endIdx: this.findMatchingAtom(
          productData,
          reactant2Data.atoms[i].element,
          i + reactant1Data.atoms.length
        ),
      });
    }

    const element = ELEMENT_COLORS;
    const elementRadii = ELEMENT_RADII;

    for (let i = 0; i < allAtoms.length; i++) {
      const atomInfo = allAtoms[i];
      const element = atomInfo.data.element;

      const geometry = new THREE.SphereGeometry(1, 16, 16);
      const material = new THREE.MeshStandardMaterial({
        color: (ELEMENT_COLORS as any)[element] ?? 0x909090,
        metalness: 0.3,
        roughness: 0.25,
      });

      const mesh = new THREE.Mesh(geometry, material);

      const baseRadius = (ELEMENT_RADII as any)[element] ?? 0.5;
      const scale = displayMode === 'space-filling'
        ? baseRadius
        : displayMode === 'wireframe'
        ? baseRadius * 0.15
        : baseRadius * 0.35 + 0.1;
      mesh.scale.setScalar(scale);

      const startPos = new THREE.Vector3(
        atomInfo.data.position[0] + atomInfo.startOffset.x,
        atomInfo.data.position[1] + atomInfo.startOffset.y,
        atomInfo.data.position[2] + atomInfo.startOffset.z
      );

      let endPos: THREE.Vector3;
      if (atomInfo.endIdx !== null && atomInfo.endIdx < productData.atoms.length) {
        const prodAtom = productData.atoms[atomInfo.endIdx];
        endPos = new THREE.Vector3(
          prodAtom.position[0] + targetOffset.x,
          prodAtom.position[1] + targetOffset.y,
          prodAtom.position[2] + targetOffset.z
        );
      } else {
        endPos = startPos.clone().add(targetOffset).sub(atomInfo.startOffset);
      }

      mesh.position.copy(startPos);

      this.atomStates.push({
        mesh,
        startPos,
        endPos,
        element,
      });

      atomsGroup.add(mesh);
    }

    const allBonds: { bond: BondData; atomOffset: number; isReactant: boolean }[] = [];
    for (const bond of reactant1Data.bonds) {
      allBonds.push({ bond, atomOffset: 0, isReactant: true });
    }
    for (const bond of reactant2Data.bonds) {
      allBonds.push({ bond, atomOffset: reactant1Data.atoms.length, isReactant: true });
    }

    const bondGeo = new THREE.CylinderGeometry(1, 1, 1, 8);
    const bondMat = new THREE.MeshStandardMaterial({
      color: 0x888899,
      metalness: 0.2,
      roughness: 0.5,
      transparent: true,
      opacity: 0.7,
    });

    for (const { bond, atomOffset } of allBonds) {
      const fromIdx = bond.from + atomOffset;
      const toIdx = bond.to + atomOffset;

      if (fromIdx >= this.atomStates.length || toIdx >= this.atomStates.length) continue;

      const bondGroup = new THREE.Group();
      const cylinder = new THREE.Mesh(bondGeo, bondMat.clone());
      bondGroup.add(cylinder);

      this.bondStates.push({
        group: bondGroup,
        visible: true,
        opacity: 0.7,
        fromIdx,
        toIdx,
      });

      bondsGroup.add(bondGroup);
    }

    this.containerGroup.add(bondsGroup);
    this.containerGroup.add(atomsGroup);

    this.updateBondPositions();

    return this.containerGroup;
  }

  private findMatchingAtom(product: MoleculeData, element: string, fromIdx: number): number | null {
    let elementCount = 0;
    for (let i = 0; i < product.atoms.length; i++) {
      if (product.atoms[i].element === element) {
        if (elementCount === fromIdx % 10) return i;
        elementCount++;
      }
    }
    return null;
  }

  public update(deltaTime: number): boolean {
    if (!this.isRunning || !this.containerGroup) return true;

    this.currentTime += deltaTime;
    const t = Math.min(this.currentTime / this.totalDuration, 1);
    const phaseT = this.getPhaseT(t);

    this.updateAtomPositions(phaseT, t);
    this.updateBondPositions();
    this.updateBondOpacity(t);

    if (t >= 1) {
      this.isRunning = false;
      if (this.onCompleteCallback) {
        this.onCompleteCallback();
      }
      return true;
    }

    return false;
  }

  private getPhaseT(globalT: number): { phase: string; t: number } {
    let elapsed = 0;
    for (const phase of PHASES) {
      if (globalT * this.totalDuration < elapsed + phase.duration) {
        const t = (globalT * this.totalDuration - elapsed) / phase.duration;
        return { phase: phase.name, t: Math.max(0, Math.min(1, t)) };
      }
      elapsed += phase.duration;
    }
    return { phase: 'settle', t: 1 };
  }

  private updateAtomPositions(phaseInfo: { phase: string; t: number }, globalT: number): void {
    const easeT = this.easeInOutQuad(globalT);

    for (const state of this.atomStates) {
      const pos = state.mesh.position;
      pos.lerpVectors(state.startPos, state.endPos, easeT);

      if (phaseInfo.phase === 'break' || phaseInfo.phase === 'reform') {
        const wobbleAmount = phaseInfo.phase === 'break' ? 0.15 : 0.1;
        const wobblePhase = phaseInfo.t * Math.PI * 4;
        pos.x += Math.sin(wobblePhase + state.startPos.x * 10) * wobbleAmount * Math.sin(phaseInfo.t * Math.PI);
        pos.y += Math.cos(wobblePhase + state.startPos.y * 10) * wobbleAmount * Math.sin(phaseInfo.t * Math.PI);
      }
    }
  }

  private updateBondPositions(): void {
    for (const state of this.bondStates) {
      const atom1 = this.atomStates[state.fromIdx];
      const atom2 = this.atomStates[state.toIdx];
      if (!atom1 || !atom2) continue;

      const p1 = atom1.mesh.position;
      const p2 = atom2.mesh.position;
      const direction = new THREE.Vector3().subVectors(p2, p1);
      const length = direction.length();

      if (length < 0.001) {
        state.group.visible = false;
        continue;
      }

      state.group.visible = state.visible && state.opacity > 0.05;

      const cylinder = state.group.children[0] as THREE.Mesh;
      if (cylinder) {
        const radius = this.displayMode === 'wireframe' ? 0.05 : 0.12;
        cylinder.scale.set(radius, length, radius);
        cylinder.position.set(0, 0, 0);
        state.group.position.copy(p1).add(p2).multiplyScalar(0.5);
        state.group.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          direction.clone().normalize()
        );
      }
    }
  }

  private updateBondOpacity(globalT: number): void {
    const breakStart = PHASES[0].duration / this.totalDuration;
    const breakEnd = (PHASES[0].duration + PHASES[1].duration) / this.totalDuration;
    const reformStart = breakEnd;
    const reformEnd = (PHASES[0].duration + PHASES[1].duration + PHASES[2].duration) / this.totalDuration;

    for (let i = 0; i < this.bondStates.length; i++) {
      const state = this.bondStates[i];
      let opacity = 0.7;

      if (globalT < breakStart) {
        opacity = 0.7;
      } else if (globalT < breakEnd) {
        const t = (globalT - breakStart) / (breakEnd - breakStart);
        opacity = 0.7 * (1 - this.easeInQuad(t));
      } else if (globalT < reformEnd) {
        opacity = 0;
      } else {
        const t = (globalT - reformEnd) / (1 - reformEnd);
        opacity = 0.7 * this.easeOutQuad(t);
      }

      state.opacity = opacity;
      state.visible = opacity > 0.05;

      const cylinder = state.group.children[0] as THREE.Mesh;
      if (cylinder && cylinder.material instanceof THREE.MeshStandardMaterial) {
        cylinder.material.opacity = opacity;
        cylinder.material.transparent = true;
      }
    }
  }

  private easeInQuad(t: number): number {
    return t * t;
  }

  private easeOutQuad(t: number): number {
    return 1 - (1 - t) * (1 - t);
  }

  private easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  public onComplete(callback: () => void): void {
    this.onCompleteCallback = callback;
  }

  public getContainer(): THREE.Group | null {
    return this.containerGroup;
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public getProductData(): MoleculeData | null {
    return this.productData;
  }

  public dispose(): void {
    if (this.containerGroup) {
      this.containerGroup.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach((m) => m.dispose());
            } else {
              obj.material.dispose();
            }
          }
        }
      });
    }
    this.atomStates = [];
    this.bondStates = [];
    this.containerGroup = null;
    this.isRunning = false;
  }
}

const ELEMENT_COLORS: Record<string, number> = {
  H: 0xffffff,
  C: 0x909090,
  N: 0x3050f8,
  O: 0xff3030,
  S: 0xffff30,
  Cl: 0x1ff01f,
  P: 0xff8000,
  F: 0x90e050,
  Br: 0xa62929,
  I: 0x940094,
  Si: 0xdea766,
};

const ELEMENT_RADII: Record<string, number> = {
  H: 0.31,
  C: 0.76,
  N: 0.71,
  O: 0.66,
  S: 1.05,
  Cl: 1.02,
  P: 1.07,
  F: 0.57,
  Br: 1.20,
  I: 1.39,
  Si: 1.11,
};
