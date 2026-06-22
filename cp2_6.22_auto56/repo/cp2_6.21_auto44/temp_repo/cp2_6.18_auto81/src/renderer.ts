import * as THREE from 'three';
import type { MoleculeData, Atom } from './parser';

export type RenderMode = 'ball-stick' | 'space-fill' | 'wireframe';

export interface RendererCallbacks {
  onAtomHover?: (index: number | null) => void;
  onAtomSelect?: (index: number | null) => void;
  onFpsUpdate?: (fps: number) => void;
}

interface AtomMesh {
  mesh: THREE.Mesh;
  glow: THREE.Mesh;
  label: HTMLDivElement | null;
  baseScale: number;
  targetScale: number;
  selected: boolean;
  hovered: boolean;
  atomIndex: number;
}

interface BondMesh {
  group: THREE.Group;
  meshes: THREE.Mesh[];
}

interface AnimationTarget {
  mesh: THREE.Mesh;
  fromPos: THREE.Vector3;
  toPos: THREE.Vector3;
  fromScale: THREE.Vector3;
  toScale: THREE.Vector3;
  progress: number;
}

const BALL_STICK_ATOM_SCALE = 0.35;
const SPACE_FILL_ATOM_SCALE = 1.2;
const WIREFRAME_ATOM_SCALE = 0.2;
const BOND_RADIUS = 0.12;
const WIREFRAME_BOND_RADIUS = 0.03;
const TRANSITION_DURATION = 500;

export class MoleculeRenderer {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public controls: OrbitControlsApi | null = null;

  private container: HTMLElement;
  private moleculeGroup: THREE.Group;
  private atomMeshes: AtomMesh[] = [];
  private bondMeshes: BondMesh[] = [];
  private raycaster: THREE.Raycaster;
  private pointer: THREE.Vector2;
  private hoveredAtom: number | null = null;
  private selectedAtom: number | null = null;
  private currentMode: RenderMode = 'ball-stick';
  private moleculeData: MoleculeData | null = null;
  private animations: AnimationTarget[] = [];
  private callbacks: RendererCallbacks;
  private labelContainer: HTMLDivElement;
  private animationFrameId: number | null = null;
  private lastFrameTime = 0;
  private frameCount = 0;
  private fpsAccumulator = 0;

  constructor(container: HTMLElement, callbacks: RendererCallbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
    this.scene = new THREE.Scene();
    const rect = container.getBoundingClientRect();
    this.camera = new THREE.PerspectiveCamera(45, rect.width / rect.height, 0.1, 2000);
    this.camera.position.set(0, 0, 12);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(rect.width, rect.height);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    this.moleculeGroup = new THREE.Group();
    this.scene.add(this.moleculeGroup);

    this.raycaster = new THREE.Raycaster();
    this.raycaster.params.Mesh = { threshold: 0.1 };
    this.pointer = new THREE.Vector2();

    this.setupLights();

    this.labelContainer = document.createElement('div');
    this.labelContainer.style.cssText = `
      position: absolute;
      inset: 0;
      pointer-events: none;
      overflow: hidden;
      z-index: 5;
    `;
    container.appendChild(this.labelContainer);

    this.attachEventListeners();
    window.addEventListener('resize', this.handleResize);
  }

  private setupLights(): void {
    const ambient = new THREE.AmbientLight(0x404060, 0.6);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 8, 10);
    this.scene.add(dirLight);

    const dirLight2 = new THREE.DirectionalLight(0x8899ff, 0.4);
    dirLight2.position.set(-6, -3, -5);
    this.scene.add(dirLight2);

    const rimLight = new THREE.DirectionalLight(0x00d4ff, 0.35);
    rimLight.position.set(-8, 5, -5);
    this.scene.add(rimLight);

    const pointLight = new THREE.PointLight(0xff66aa, 0.25, 30);
    pointLight.position.set(0, -5, 8);
    this.scene.add(pointLight);

    const envLight = new THREE.HemisphereLight(0x6688cc, 0x221133, 0.35);
    this.scene.add(envLight);
  }

  private attachEventListeners(): void {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('pointermove', this.handlePointerMove);
    canvas.addEventListener('pointerdown', this.handlePointerDown);
    canvas.addEventListener('dblclick', this.handleDoubleClick);
    canvas.addEventListener('pointerleave', this.handlePointerLeave);
    canvas.addEventListener('contextmenu', e => e.preventDefault());
  }

  private handlePointerMove = (e: PointerEvent): void => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.updateHover();
  };

  private handlePointerDown = (e: PointerEvent): void => {
    if (e.button !== 0) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    const hit = this.pickAtom();
    if (hit >= 0) {
      this.selectedAtom = hit;
      this.updateAtomSelection();
      this.callbacks.onAtomSelect?.(hit);
    }
  };

  private handleDoubleClick = (e: MouseEvent): void => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    const hit = this.pickAtom();
    if (hit >= 0) {
      this.selectedAtom = hit;
      this.updateAtomSelection();
      this.callbacks.onAtomSelect?.(hit);
    }
  };

  private handlePointerLeave = (): void => {
    if (this.hoveredAtom !== null) {
      this.hoveredAtom = null;
      this.updateAtomHover();
      this.callbacks.onAtomHover?.(null);
    }
  };

  private handleResize = (): void => {
    const rect = this.container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    this.camera.aspect = rect.width / rect.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(rect.width, rect.height);
  };

  private pickAtom(): number {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const meshes = this.atomMeshes.map(a => a.mesh);
    const hits = this.raycaster.intersectObjects(meshes, false);
    if (hits.length === 0) return -1;
    const idx = meshes.indexOf(hits[0].object as THREE.Mesh);
    return idx >= 0 ? this.atomMeshes[idx].atomIndex : -1;
  }

  private updateHover(): void {
    const hit = this.pickAtom();
    if (hit !== this.hoveredAtom) {
      this.hoveredAtom = hit >= 0 ? hit : null;
      this.updateAtomHover();
      this.callbacks.onAtomHover?.(this.hoveredAtom);
    }
  }

  private updateAtomHover(): void {
    for (const a of this.atomMeshes) {
      const was = a.hovered;
      a.hovered = a.atomIndex === this.hoveredAtom;
      if (a.hovered !== was) {
        this.animateAtomHighlight(a);
        if (a.label) {
          a.label.style.opacity = a.hovered ? '1' : (a.selected ? '0.8' : '0');
          a.label.style.transform = `translate(-50%, -130%) scale(${a.hovered ? 1.15 : 1})`;
        }
      }
    }
  }

  private updateAtomSelection(): void {
    for (const a of this.atomMeshes) {
      a.selected = a.atomIndex === this.selectedAtom;
      const mat = a.mesh.material as THREE.MeshPhysicalMaterial;
      mat.emissiveIntensity = a.selected ? 0.35 : (a.hovered ? 0.15 : 0);
      const glowMat = a.glow.material as THREE.MeshBasicMaterial;
      glowMat.opacity = a.selected ? 0.6 : (a.hovered ? 0.35 : 0);
      glowMat.color.set(a.selected ? '#00d4ff' : '#ffffff');
      if (a.label) {
        a.label.style.opacity = a.selected ? '0.9' : (a.hovered ? '1' : '0');
        if (a.selected) {
          a.label.style.borderColor = '#00d4ff';
          a.label.style.boxShadow = '0 0 12px #00d4ff, 0 0 20px rgba(0,212,255,0.3)';
        } else {
          a.label.style.borderColor = 'rgba(255,255,255,0.35)';
          a.label.style.boxShadow = '0 2px 8px rgba(0,0,0,0.6)';
        }
      }
    }
  }

  private animateAtomHighlight(a: AtomMesh): void {
    const mat = a.mesh.material as THREE.MeshPhysicalMaterial;
    mat.emissiveIntensity = a.hovered ? 0.15 : (a.selected ? 0.35 : 0);
    const glowMat = a.glow.material as THREE.MeshBasicMaterial;
    glowMat.opacity = a.hovered ? 0.35 : (a.selected ? 0.6 : 0);
  }

  public loadMolecule(data: MoleculeData): void {
    this.clearMolecule();
    this.moleculeData = data;
    this.buildAtoms(data);
    this.buildBonds(data);
    this.fitView();
    this.selectedAtom = null;
    this.hoveredAtom = null;
    this.callbacks.onAtomSelect?.(null);
    this.callbacks.onAtomHover?.(null);
  }

  private clearMolecule(): void {
    for (const a of this.atomMeshes) {
      a.mesh.geometry.dispose();
      (a.mesh.material as THREE.Material).dispose();
      a.glow.geometry.dispose();
      (a.glow.material as THREE.Material).dispose();
      if (a.label) a.label.remove();
    }
    for (const b of this.bondMeshes) {
      const list: THREE.Mesh[] = Array.isArray((b as any).meshes)
        ? (b as any).meshes
        : [b.cylinder, b.capA, b.capB].filter(Boolean) as THREE.Mesh[];
      for (const mesh of list) {
        if (!mesh) continue;
        mesh.geometry?.dispose?.();
        (mesh.material as THREE.Material)?.dispose?.();
      }
    }
    while (this.moleculeGroup.children.length > 0) {
      this.moleculeGroup.remove(this.moleculeGroup.children[0]);
    }
    this.atomMeshes = [];
    this.bondMeshes = [];
    this.animations = [];
  }

  private buildAtoms(data: MoleculeData): void {
    for (let i = 0; i < data.atoms.length; i++) {
      const atom = data.atoms[i];
      const sphereGeo = new THREE.SphereGeometry(1, 64, 48);
      const material = this.createAtomMaterial(atom);
      const mesh = new THREE.Mesh(sphereGeo, material);
      const baseScale = this.getAtomScale(atom);
      mesh.position.set(atom.position.x, atom.position.y, atom.position.z);
      mesh.scale.setScalar(baseScale);
      mesh.userData.atomIndex = i;

      const glowGeo = new THREE.SphereGeometry(1.12, 48, 36);
      const glowMat = new THREE.MeshBasicMaterial({
        color: '#ffffff',
        transparent: true,
        opacity: 0,
        side: THREE.BackSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      mesh.add(glow);

      const label = this.createAtomLabel(atom);
      this.labelContainer.appendChild(label);

      const wrap = new THREE.Group();
      wrap.add(mesh);
      this.moleculeGroup.add(wrap);

      this.atomMeshes.push({
        mesh, glow, label,
        baseScale,
        targetScale: baseScale,
        selected: false,
        hovered: false,
        atomIndex: i
      });
    }
  }

  private createAtomMaterial(atom: Atom): THREE.MeshPhysicalMaterial {
    const color = new THREE.Color(atom.color);
    const isWhite = color.r > 0.92 && color.g > 0.92 && color.b > 0.92;
    return new THREE.MeshPhysicalMaterial({
      color,
      metalness: isWhite ? 0.15 : 0.45,
      roughness: isWhite ? 0.22 : 0.18,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      reflectivity: 0.9,
      sheen: 0.25,
      sheenColor: new THREE.Color('#00d4ff'),
      sheenRoughness: 0.5,
      iridescence: 0.12,
      iridescenceIOR: 1.3,
      emissive: new THREE.Color('#00d4ff'),
      emissiveIntensity: 0,
      transparent: true,
      opacity: 1,
      side: THREE.FrontSide
    });
  }

  private createAtomLabel(atom: Atom): HTMLDivElement {
    const el = document.createElement('div');
    el.textContent = atom.element;
    el.style.cssText = `
      position: absolute;
      padding: 2px 8px;
      min-width: 20px;
      text-align: center;
      font-size: 12px;
      font-weight: 700;
      color: ${this.getTextColorForBg(atom.color)};
      background: ${atom.color};
      border: 1.5px solid rgba(255,255,255,0.35);
      border-radius: 6px;
      backdrop-filter: blur(4px);
      box-shadow: 0 2px 8px rgba(0,0,0,0.6);
      opacity: 0;
      pointer-events: none;
      transform: translate(-50%, -130%);
      transition: opacity 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
      white-space: nowrap;
      letter-spacing: 0.3px;
      z-index: 10;
    `;
    return el;
  }

  private getTextColorForBg(hex: string): string {
    const c = new THREE.Color(hex);
    const lum = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
    return lum > 0.55 ? '#1a1a2e' : '#ffffff';
  }

  private buildBonds(data: MoleculeData): void {
    for (const bond of data.bonds) {
      if (bond.from >= data.atoms.length || bond.to >= data.atoms.length) continue;
      const a1 = data.atoms[bond.from];
      const a2 = data.atoms[bond.to];
      const v1 = new THREE.Vector3(a1.position.x, a1.position.y, a1.position.z);
      const v2 = new THREE.Vector3(a2.position.x, a2.position.y, a2.position.z);
      const group = new THREE.Group();
      const atom1Scale = this.getAtomScale(a1);
      const atom2Scale = this.getAtomScale(a2);

      if (bond.type >= 2) {
        const dir = new THREE.Vector3().subVectors(v2, v1).normalize();
        const up = new THREE.Vector3(0, 1, 0);
        if (Math.abs(dir.dot(up)) > 0.98) up.set(1, 0, 0);
        const tangent = new THREE.Vector3().crossVectors(dir, up).normalize();
        const offset = BOND_RADIUS * 1.8;
        for (let k = 0; k < bond.type; k++) {
          const t = (k - (bond.type - 1) / 2);
          const off = tangent.clone().multiplyScalar(offset * t);
          const p1 = v1.clone().add(off);
          const p2 = v2.clone().add(off);
          const cyl = this.createBondCylinder(p1, p2, a1, a2, atom1Scale, atom2Scale);
          group.add(cyl);
        }
      } else {
        const cyl = this.createBondCylinder(v1, v2, a1, a2, atom1Scale, atom2Scale);
        group.add(cyl);
      }
      this.moleculeGroup.add(group);
      const collected: THREE.Mesh[] = [];
      group.traverse(obj => { if (obj instanceof THREE.Mesh) collected.push(obj); });
      this.bondMeshes.push({ group, meshes: collected });
    }
  }

  private createBondCylinder(
    v1: THREE.Vector3, v2: THREE.Vector3,
    a1: Atom, a2: Atom,
    s1: number, s2: number
  ): THREE.Group {
    const group = new THREE.Group();
    const dir = new THREE.Vector3().subVectors(v2, v1);
    const length = dir.length();
    if (length < 0.001) return group;
    const radius = this.getBondRadius();

    const r1 = Math.max(radius * 0.85, s1 * 0.3);
    const r2 = Math.max(radius * 0.85, s2 * 0.3);

    const cylGeo = new THREE.CylinderGeometry(
      radius, radius,
      Math.max(0.01, length - r1 * 0.5 - r2 * 0.5),
      24, 1, false
    );

    const avgColor = new THREE.Color(a1.color).lerp(new THREE.Color(a2.color), 0.5);
    const mat = new THREE.MeshPhysicalMaterial({
      color: avgColor,
      metalness: 0.55,
      roughness: 0.18,
      clearcoat: 0.85,
      clearcoatRoughness: 0.1,
      reflectivity: 0.85,
      sheen: 0.15,
      sheenColor: new THREE.Color('#00d4ff'),
      emissive: new THREE.Color('#00d4ff'),
      emissiveIntensity: 0
    });

    const cylinder = new THREE.Mesh(cylGeo, mat);
    const mid = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);
    cylinder.position.copy(mid);
    cylinder.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize()
    );

    const capGeoA = this.createChamferedCap(radius, r1 * 0.5, a1);
    const capA = new THREE.Mesh(capGeoA, mat.clone());
    capA.position.copy(v1).add(dir.clone().normalize().multiplyScalar(r1 * 0.5));
    capA.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, -1, 0),
      dir.clone().normalize()
    );
    (capA.material as THREE.MeshPhysicalMaterial).color.copy(new THREE.Color(a1.color));

    const capGeoB = this.createChamferedCap(radius, r2 * 0.5, a2);
    const capB = new THREE.Mesh(capGeoB, mat.clone());
    capB.position.copy(v2).add(dir.clone().normalize().multiplyScalar(-r2 * 0.5));
    capB.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize()
    );
    (capB.material as THREE.MeshPhysicalMaterial).color.copy(new THREE.Color(a2.color));

    group.add(cylinder);
    group.add(capA);
    group.add(capB);
    return group;
  }

  private createChamferedCap(bondRadius: number, height: number, atom: Atom): THREE.BufferGeometry {
    const h = Math.max(height, 0.02);
    const r = bondRadius;
    const rTop = r * 0.92;
    const segments = 28;
    const geo = new THREE.CylinderGeometry(
      rTop, r, h, segments, 1, false
    );
    const pos = geo.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      if (v.y > 0) {
        const factor = Math.pow(Math.abs(v.y / h), 1.5);
        v.x *= 1 - factor * 0.2;
        v.z *= 1 - factor * 0.2;
      } else {
        v.y *= 0.95;
      }
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    void atom;
    return geo;
  }

  private getAtomScale(atom: Atom): number {
    const r = atom.vdwRadius;
    switch (this.currentMode) {
      case 'ball-stick': return r * BALL_STICK_ATOM_SCALE;
      case 'space-fill': return r * SPACE_FILL_ATOM_SCALE;
      case 'wireframe': return r * WIREFRAME_ATOM_SCALE;
    }
  }

  private getBondRadius(): number {
    switch (this.currentMode) {
      case 'ball-stick': return BOND_RADIUS;
      case 'space-fill': return BOND_RADIUS * 0.5;
      case 'wireframe': return WIREFRAME_BOND_RADIUS;
    }
  }

  public setRenderMode(mode: RenderMode): void {
    if (mode === this.currentMode) return;
    this.currentMode = mode;
    if (!this.moleculeData) return;

    for (const a of this.atomMeshes) {
      const atom = this.moleculeData.atoms[a.atomIndex];
      const newScale = this.getAtomScale(atom);
      const fromScale = a.mesh.scale.clone();
      const toScale = new THREE.Vector3(newScale, newScale, newScale);
      this.animations.push({
        mesh: a.mesh,
        fromPos: a.mesh.position.clone(),
        toPos: a.mesh.position.clone(),
        fromScale,
        toScale,
        progress: 0
      });
      a.targetScale = newScale;
      const mat = a.mesh.material as THREE.MeshPhysicalMaterial;
      if (mode === 'wireframe') {
        mat.wireframe = true;
        mat.opacity = 0.85;
      } else {
        mat.wireframe = false;
        mat.opacity = 1;
      }
    }
    this.rebuildBondsAnimated();
  }

  private rebuildBondsAnimated(): void {
    if (!this.moleculeData) return;
    for (const b of this.bondMeshes) {
      this.moleculeGroup.remove(b.group);
      for (const mesh of b.meshes) {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      }
    }
    this.bondMeshes = [];
    const data = this.moleculeData;
    for (const bond of data.bonds) {
      if (bond.from >= data.atoms.length || bond.to >= data.atoms.length) continue;
      const a1 = data.atoms[bond.from];
      const a2 = data.atoms[bond.to];
      const v1 = new THREE.Vector3(a1.position.x, a1.position.y, a1.position.z);
      const v2 = new THREE.Vector3(a2.position.x, a2.position.y, a2.position.z);
      const group = new THREE.Group();
      const s1 = this.getAtomScale(a1);
      const s2 = this.getAtomScale(a2);
      if (bond.type >= 2) {
        const dir = new THREE.Vector3().subVectors(v2, v1).normalize();
        const up = new THREE.Vector3(0, 1, 0);
        if (Math.abs(dir.dot(up)) > 0.98) up.set(1, 0, 0);
        const tangent = new THREE.Vector3().crossVectors(dir, up).normalize();
        const offset = this.getBondRadius() * 1.8;
        for (let k = 0; k < bond.type; k++) {
          const t = (k - (bond.type - 1) / 2);
          const off = tangent.clone().multiplyScalar(offset * t);
          const cyl = this.createBondCylinder(
            v1.clone().add(off), v2.clone().add(off), a1, a2, s1, s2
          );
          this.applyBondAnimation(cyl);
          group.add(cyl);
        }
      } else {
        const cyl = this.createBondCylinder(v1, v2, a1, a2, s1, s2);
        this.applyBondAnimation(cyl);
        group.add(cyl);
      }
      this.moleculeGroup.add(group);
      const collected: THREE.Mesh[] = [];
      group.traverse(obj => { if (obj instanceof THREE.Mesh) collected.push(obj); });
      this.bondMeshes.push({ group, meshes: collected });
    }
  }

  private applyBondAnimation(group: THREE.Group): void {
    const original: Array<{ mesh: THREE.Mesh; fromScale: THREE.Vector3; toScale: THREE.Vector3 }> = [];
    group.traverse(obj => {
      if (obj instanceof THREE.Mesh) {
        const to = obj.scale.clone();
        obj.scale.multiplyScalar(0.01);
        original.push({
          mesh: obj,
          fromScale: obj.scale.clone(),
          toScale: to
        });
      }
    });
    const start = performance.now();
    const animate = () => {
      const t = Math.min(1, (performance.now() - start) / TRANSITION_DURATION);
      const e = this.easeInOut(t);
      for (const it of original) {
        it.mesh.scale.lerpVectors(it.fromScale, it.toScale, e);
      }
      if (t < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  private easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  public highlightAtom(index: number | null): void {
    this.hoveredAtom = index;
    this.updateAtomHover();
  }

  public selectAtom(index: number | null): void {
    this.selectedAtom = index;
    this.updateAtomSelection();
  }

  public getSelectedAtomIndex(): number | null {
    return this.selectedAtom;
  }

  public setRotationSpeed(speed: number): void {
    if (this.controls) {
      this.controls.rotateSpeed = speed;
    }
  }

  public setZoomSpeed(speed: number): void {
    if (this.controls) {
      this.controls.zoomSpeed = speed;
    }
  }

  public fitView(): void {
    if (this.atomMeshes.length === 0) return;
    const box = new THREE.Box3();
    for (const a of this.atomMeshes) {
      box.expandByObject(a.mesh);
    }
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.camera.fov * (Math.PI / 180);
    const dist = maxDim / (2 * Math.tan(fov / 2)) * 2.2;
    const dir = new THREE.Vector3(0.5, 0.7, 1).normalize();
    this.camera.position.copy(center).add(dir.multiplyScalar(dist));
    this.camera.lookAt(center);
    if (this.controls) {
      this.controls.target.copy(center);
      this.controls.update();
    }
  }

  public resetView(): void {
    this.fitView();
  }

  public start(): void {
    const tick = (now: number) => {
      const dt = now - this.lastFrameTime;
      this.lastFrameTime = now;
      this.frameCount++;
      this.fpsAccumulator += dt;
      if (this.fpsAccumulator >= 500) {
        const fps = Math.round((this.frameCount * 1000) / this.fpsAccumulator);
        this.callbacks.onFpsUpdate?.(fps);
        this.frameCount = 0;
        this.fpsAccumulator = 0;
      }
      this.updateAnimations(dt);
      this.updateLabels();
      if (this.controls) {
        this.controls.update();
      }
      this.renderer.render(this.scene, this.camera);
      this.animationFrameId = requestAnimationFrame(tick);
    };
    this.animationFrameId = requestAnimationFrame(tick);
  }

  public stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private updateAnimations(dt: number): void {
    if (this.animations.length === 0) return;
    const step = dt / TRANSITION_DURATION;
    for (let i = this.animations.length - 1; i >= 0; i--) {
      const a = this.animations[i];
      a.progress = Math.min(1, a.progress + step);
      const t = this.easeInOut(a.progress);
      a.mesh.position.lerpVectors(a.fromPos, a.toPos, t);
      a.mesh.scale.lerpVectors(a.fromScale, a.toScale, t);
      if (a.progress >= 1) {
        this.animations.splice(i, 1);
      }
    }
  }

  private updateLabels(): void {
    const camera = this.camera;
    const canvas = this.renderer.domElement;
    const rect = canvas.getBoundingClientRect();
    for (const a of this.atomMeshes) {
      if (!a.label) continue;
      const pos = new THREE.Vector3();
      a.mesh.getWorldPosition(pos);
      const world = pos.clone();
      world.y += a.targetScale * 1.3;
      const projected = world.project(camera);
      if (projected.z > 1 || projected.z < -1) {
        a.label.style.display = 'none';
        continue;
      }
      a.label.style.display = 'block';
      const x = (projected.x * 0.5 + 0.5) * rect.width;
      const y = (-projected.y * 0.5 + 0.5) * rect.height;
      a.label.style.left = `${x}px`;
      a.label.style.top = `${y}px`;
    }
  }

  public dispose(): void {
    this.stop();
    window.removeEventListener('resize', this.handleResize);
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('pointermove', this.handlePointerMove);
    canvas.removeEventListener('pointerdown', this.handlePointerDown);
    canvas.removeEventListener('dblclick', this.handleDoubleClick);
    canvas.removeEventListener('pointerleave', this.handlePointerLeave);
    this.clearMolecule();
    this.labelContainer.remove();
    this.renderer.dispose();
    if (canvas.parentElement) canvas.parentElement.removeChild(canvas);
  }
}

export interface OrbitControlsApi {
  target: THREE.Vector3;
  rotateSpeed: number;
  zoomSpeed: number;
  panSpeed: number;
  enableDamping: boolean;
  dampingFactor: number;
  update(): void;
  dispose(): void;
}
