import * as THREE from 'three';

export type DisplayMode = 'ball-stick' | 'space-fill' | 'wireframe';

export interface AtomData {
  element: string;
  position: [number, number, number];
  color: string;
  radius: number;
}

export interface BondData {
  from: number;
  to: number;
  order?: number;
}

export interface MoleculeData {
  name: string;
  formula: string;
  molecularWeight: number;
  bondAngles: string[];
  atoms: AtomData[];
  bonds: BondData[];
}

export const MOLECULES: Record<string, MoleculeData> = {
  h2o: {
    name: '水',
    formula: 'H₂O',
    molecularWeight: 18.015,
    bondAngles: ['104.5°'],
    atoms: [
      { element: 'O', position: [0, 0, 0], color: '#ff4444', radius: 0.4 },
      { element: 'H', position: [0.757, 0.586, 0], color: '#ffffff', radius: 0.25 },
      { element: 'H', position: [-0.757, 0.586, 0], color: '#ffffff', radius: 0.25 },
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 0, to: 2 },
    ],
  },
  ch4: {
    name: '甲烷',
    formula: 'CH₄',
    molecularWeight: 16.04,
    bondAngles: ['109.5°'],
    atoms: [
      { element: 'C', position: [0, 0, 0], color: '#444444', radius: 0.4 },
      { element: 'H', position: [0.629, 0.629, 0.629], color: '#ffffff', radius: 0.25 },
      { element: 'H', position: [0.629, -0.629, -0.629], color: '#ffffff', radius: 0.25 },
      { element: 'H', position: [-0.629, 0.629, -0.629], color: '#ffffff', radius: 0.25 },
      { element: 'H', position: [-0.629, -0.629, 0.629], color: '#ffffff', radius: 0.25 },
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 0, to: 2 },
      { from: 0, to: 3 },
      { from: 0, to: 4 },
    ],
  },
  c6h6: {
    name: '苯',
    formula: 'C₆H₆',
    molecularWeight: 78.11,
    bondAngles: ['120°'],
    atoms: [
      { element: 'C', position: [1.4, 0, 0], color: '#444444', radius: 0.4 },
      { element: 'C', position: [0.7, 1.212, 0], color: '#444444', radius: 0.4 },
      { element: 'C', position: [-0.7, 1.212, 0], color: '#444444', radius: 0.4 },
      { element: 'C', position: [-1.4, 0, 0], color: '#444444', radius: 0.4 },
      { element: 'C', position: [-0.7, -1.212, 0], color: '#444444', radius: 0.4 },
      { element: 'C', position: [0.7, -1.212, 0], color: '#444444', radius: 0.4 },
      { element: 'H', position: [2.48, 0, 0], color: '#ffffff', radius: 0.25 },
      { element: 'H', position: [1.24, 2.147, 0], color: '#ffffff', radius: 0.25 },
      { element: 'H', position: [-1.24, 2.147, 0], color: '#ffffff', radius: 0.25 },
      { element: 'H', position: [-2.48, 0, 0], color: '#ffffff', radius: 0.25 },
      { element: 'H', position: [-1.24, -2.147, 0], color: '#ffffff', radius: 0.25 },
      { element: 'H', position: [1.24, -2.147, 0], color: '#ffffff', radius: 0.25 },
    ],
    bonds: [
      { from: 0, to: 1, order: 2 },
      { from: 1, to: 2, order: 1 },
      { from: 2, to: 3, order: 2 },
      { from: 3, to: 4, order: 1 },
      { from: 4, to: 5, order: 2 },
      { from: 5, to: 0, order: 1 },
      { from: 0, to: 6 },
      { from: 1, to: 7 },
      { from: 2, to: 8 },
      { from: 3, to: 9 },
      { from: 4, to: 10 },
      { from: 5, to: 11 },
    ],
  },
};

interface AtomMesh {
  mesh: THREE.Mesh;
  baseRadius: number;
  element: string;
}

interface BondMesh {
  mesh: THREE.Mesh;
  fromIndex: number;
  toIndex: number;
}

interface LabelSprite {
  sprite: THREE.Sprite;
  element: string;
}

const MODE_PARAMS: Record<DisplayMode, { radiusScale: number; opacity: number; bondOpacity: number; bondScale: number }> = {
  'ball-stick': { radiusScale: 1.0, opacity: 1.0, bondOpacity: 1.0, bondScale: 1.0 },
  'space-fill': { radiusScale: 2.8, opacity: 1.0, bondOpacity: 0.0, bondScale: 1.0 },
  'wireframe': { radiusScale: 0.3, opacity: 0.3, bondOpacity: 0.8, bondScale: 0.4 },
};

export class MoleculeBuilder {
  private group: THREE.Group;
  private atomMeshes: AtomMesh[] = [];
  private bondMeshes: BondMesh[] = [];
  private labelSprites: LabelSprite[] = [];
  private currentMode: DisplayMode = 'ball-stick';
  private targetMode: DisplayMode = 'ball-stick';
  private transitionProgress: number = 1.0;
  private transitionDuration: number = 0.5;
  private currentMoleculeKey: string = 'h2o';

  constructor() {
    this.group = new THREE.Group();
  }

  getGroup(): THREE.Group {
    return this.group;
  }

  getCurrentMoleculeKey(): string {
    return this.currentMoleculeKey;
  }

  buildMolecule(key: string): void {
    this.clearMolecule();
    this.currentMoleculeKey = key;
    const data = MOLECULES[key];
    if (!data) return;

    for (const atom of data.atoms) {
      const geometry = new THREE.SphereGeometry(atom.radius, 32, 32);
      const material = new THREE.MeshPhongMaterial({
        color: new THREE.Color(atom.color),
        transparent: true,
        opacity: 1.0,
        shininess: 80,
        specular: new THREE.Color(0x444444),
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(atom.position[0], atom.position[1], atom.position[2]);
      this.group.add(mesh);
      this.atomMeshes.push({ mesh, baseRadius: atom.radius, element: atom.element });

      const label = this.createLabel(atom.element);
      label.position.set(atom.position[0], atom.position[1] + atom.radius + 0.25, atom.position[2]);
      this.group.add(label);
      this.labelSprites.push({ sprite: label, element: atom.element });
    }

    for (const bond of data.bonds) {
      const fromAtom = data.atoms[bond.from];
      const toAtom = data.atoms[bond.to];
      const cylinder = this.createBondCylinder(
        new THREE.Vector3(...fromAtom.position),
        new THREE.Vector3(...toAtom.position),
        0.08,
        bond.order ?? 1
      );
      this.group.add(cylinder);
      this.bondMeshes.push({ mesh: cylinder, fromIndex: bond.from, toIndex: bond.to });
    }

    this.applyModeInstant(this.currentMode);
  }

  private createLabel(text: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, 128, 64);
    ctx.fillStyle = 'rgba(10, 10, 40, 0.65)';
    ctx.beginPath();
    ctx.roundRect(8, 8, 112, 48, 8);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Segoe UI, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 64, 32);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      sizeAttenuation: true,
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.5, 0.25, 1);
    return sprite;
  }

  private createBondCylinder(
    from: THREE.Vector3,
    to: THREE.Vector3,
    radius: number,
    order: number
  ): THREE.Mesh {
    const direction = new THREE.Vector3().subVectors(to, from);
    const length = direction.length();
    const geometry = new THREE.CylinderGeometry(radius, radius, length, 8, 1);
    const material = new THREE.MeshPhongMaterial({
      color: 0x888899,
      transparent: true,
      opacity: 1.0,
      shininess: 40,
    });
    const mesh = new THREE.Mesh(geometry, material);
    const mid = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
    mesh.position.copy(mid);
    const axis = new THREE.Vector3(0, 1, 0);
    const dir = direction.clone().normalize();
    const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, dir);
    mesh.quaternion.copy(quaternion);
    return mesh;
  }

  private clearMolecule(): void {
    for (const atom of this.atomMeshes) {
      atom.mesh.geometry.dispose();
      (atom.mesh.material as THREE.Material).dispose();
      this.group.remove(atom.mesh);
    }
    for (const bond of this.bondMeshes) {
      bond.mesh.geometry.dispose();
      (bond.mesh.material as THREE.Material).dispose();
      this.group.remove(bond.mesh);
    }
    for (const label of this.labelSprites) {
      label.sprite.material.map?.dispose();
      (label.sprite.material as THREE.Material).dispose();
      this.group.remove(label.sprite);
    }
    this.atomMeshes = [];
    this.bondMeshes = [];
    this.labelSprites = [];
  }

  setDisplayMode(mode: DisplayMode): void {
    if (mode === this.currentMode && this.transitionProgress >= 1.0) return;
    this.targetMode = mode;
    this.transitionProgress = 0;
  }

  private applyModeInstant(mode: DisplayMode): void {
    const params = MODE_PARAMS[mode];
    for (const atom of this.atomMeshes) {
      atom.mesh.scale.setScalar(params.radiusScale);
      (atom.mesh.material as THREE.MeshPhongMaterial).opacity = params.opacity;
    }
    for (const bond of this.bondMeshes) {
      bond.mesh.scale.x = params.bondScale;
      bond.mesh.scale.z = params.bondScale;
      (bond.mesh.material as THREE.MeshPhongMaterial).opacity = params.bondOpacity;
      bond.mesh.visible = params.bondOpacity > 0.01;
    }
    this.currentMode = mode;
    this.targetMode = mode;
    this.transitionProgress = 1.0;
  }

  updateTransition(delta: number): void {
    if (this.transitionProgress >= 1.0) return;

    this.transitionProgress = Math.min(1.0, this.transitionProgress + delta / this.transitionDuration);
    const t = this.easeInOutCubic(this.transitionProgress);

    const fromParams = MODE_PARAMS[this.currentMode];
    const toParams = MODE_PARAMS[this.targetMode];

    for (const atom of this.atomMeshes) {
      const scale = fromParams.radiusScale + (toParams.radiusScale - fromParams.radiusScale) * t;
      atom.mesh.scale.setScalar(scale);
      const opacity = fromParams.opacity + (toParams.opacity - fromParams.opacity) * t;
      (atom.mesh.material as THREE.MeshPhongMaterial).opacity = opacity;
    }

    for (const bond of this.bondMeshes) {
      const scaleXZ = fromParams.bondScale + (toParams.bondScale - fromParams.bondScale) * t;
      bond.mesh.scale.x = scaleXZ;
      bond.mesh.scale.z = scaleXZ;
      const opacity = fromParams.bondOpacity + (toParams.bondOpacity - fromParams.bondOpacity) * t;
      (bond.mesh.material as THREE.MeshPhongMaterial).opacity = opacity;
      bond.mesh.visible = opacity > 0.01;
    }

    if (this.transitionProgress >= 1.0) {
      this.currentMode = this.targetMode;
    }
  }

  updateLabelPositions(): void {
    const params = MODE_PARAMS[this.transitionProgress >= 1.0 ? this.currentMode : this.targetMode];
    for (let i = 0; i < this.atomMeshes.length; i++) {
      const atom = this.atomMeshes[i];
      const label = this.labelSprites[i];
      if (!label) continue;
      const currentScale = atom.mesh.scale.x;
      const effectiveRadius = atom.baseRadius * currentScale;
      label.sprite.position.set(
        atom.mesh.position.x,
        atom.mesh.position.y + effectiveRadius + 0.25,
        atom.mesh.position.z
      );
    }
  }

  getCurrentDisplayMode(): DisplayMode {
    return this.currentMode;
  }

  setGroupOpacity(opacity: number): void {
    this.group.visible = opacity > 0.01;
    for (const atom of this.atomMeshes) {
      (atom.mesh.material as THREE.MeshPhongMaterial).opacity =
        MODE_PARAMS[this.currentMode].opacity * opacity;
    }
    for (const bond of this.bondMeshes) {
      (bond.mesh.material as THREE.MeshPhongMaterial).opacity =
        MODE_PARAMS[this.currentMode].bondOpacity * opacity;
    }
    for (const label of this.labelSprites) {
      (label.sprite.material as THREE.SpriteMaterial).opacity = opacity;
    }
  }

  setGroupScale(scale: number): void {
    for (const atom of this.atomMeshes) {
      const modeScale = MODE_PARAMS[this.currentMode].radiusScale;
      atom.mesh.scale.setScalar(modeScale * scale);
    }
    for (const bond of this.bondMeshes) {
      const modeScale = MODE_PARAMS[this.currentMode].bondScale;
      bond.mesh.scale.x = modeScale;
      bond.mesh.scale.z = modeScale;
      bond.mesh.scale.y = scale;
    }
    for (const label of this.labelSprites) {
      label.sprite.scale.setScalar(0.5 * scale);
    }
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
}
