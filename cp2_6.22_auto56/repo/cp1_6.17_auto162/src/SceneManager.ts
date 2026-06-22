import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import {
  Molecule,
  Atom,
  Bond,
  AtomSpecs,
  AtomType,
  ConstraintResult,
  eventBus,
  moleculeData,
} from './MoleculeData';

type AtomMesh = THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial> & { userData: { atomId: string; isAtom: true } };
type BondMesh = THREE.Group & { userData: { bondId: string; isBond: true } };

interface BondRenderData {
  group: BondMesh;
  cylinders: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshStandardMaterial>[];
}

export class SceneManager {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private labelRenderer: CSS2DRenderer;
  private controls: OrbitControls;
  private clock: THREE.Clock;

  private atomGeometries = new Map<number, THREE.SphereGeometry>();
  private atomMaterials = new Map<string, THREE.MeshStandardMaterial>();
  private bondCylinderGeo: THREE.CylinderGeometry;
  private bondMaterial: THREE.MeshStandardMaterial;
  private bondIllegalMaterial: THREE.MeshStandardMaterial;

  private atomMeshes = new Map<string, AtomMesh>();
  private atomGroups = new Map<string, THREE.Group>();
  private atomHighlight = new Map<string, THREE.Mesh>();
  private atomWarning = new Map<string, THREE.Group>();
  private bondRenders = new Map<string, BondRenderData>();
  private bondLabels = new Map<string, CSS2DObject>();
  private angleLabels = new Map<string, CSS2DObject>();

  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private isDragging = false;
  private dragAtomId: string | null = null;
  private dragPlane = new THREE.Plane();
  private dragOffset = new THREE.Vector3();
  private pointerDownPos = new THREE.Vector2();

  private pendingAnimations: Array<{ mesh: THREE.Object3D; startTime: number; duration: number }> = [];

  private selectedAtomIds: string[] = [];
  private constraintResult: ConstraintResult | null = null;
  private lastConstraintResult: ConstraintResult | null = null;

  private dirtyAtoms = new Set<string>();
  private dirtyBonds = new Set<string>();

  private running = true;
  private rafId = 0;

  private tmpV1 = new THREE.Vector3();
  private tmpV2 = new THREE.Vector3();
  private tmpV3 = new THREE.Vector3();
  private tmpQuat = new THREE.Quaternion();

  constructor(containerId: string) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`Container #${containerId} not found`);
    this.container = el;

    this.bondCylinderGeo = new THREE.CylinderGeometry(0.1, 0.1, 1, 16);
    this.bondMaterial = new THREE.MeshStandardMaterial({
      color: 0xaaaaaa,
      metalness: 0.1,
      roughness: 0.4,
    });
    this.bondIllegalMaterial = new THREE.MeshStandardMaterial({
      color: 0xff4444,
      emissive: 0x441111,
      metalness: 0.15,
      roughness: 0.4,
    });

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    this.camera.position.set(0, 3, 8);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    el.appendChild(this.renderer.domElement);

    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(1, 1);
    const labelDom = this.labelRenderer.domElement;
    labelDom.style.position = 'absolute';
    labelDom.style.top = '0';
    labelDom.style.left = '0';
    labelDom.style.pointerEvents = 'none';
    el.appendChild(labelDom);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 20;
    this.controls.enablePan = true;
    this.controls.screenSpacePanning = true;

    this.clock = new THREE.Clock();
    this.setupLights();
    this.setupOrbitHelper();
    this.setupGround();
    this.setupListeners();
    this.resize();
    this.bindEvents();
    this.animate();
  }

  private setupLights(): void {
    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    this.scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(5, 10, 7);
    dir.castShadow = true;
    dir.shadow.mapSize.set(1024, 1024);
    dir.shadow.camera.near = 0.5;
    dir.shadow.camera.far = 50;
    dir.shadow.camera.left = -15;
    dir.shadow.camera.right = 15;
    dir.shadow.camera.top = 15;
    dir.shadow.camera.bottom = -15;
    dir.shadow.bias = -0.0005;
    this.scene.add(dir);
    const fill = new THREE.DirectionalLight(0x8899bb, 0.25);
    fill.position.set(-6, -2, -4);
    this.scene.add(fill);
    const rim = new THREE.DirectionalLight(0x4466aa, 0.2);
    rim.position.set(-3, 3, -8);
    this.scene.add(rim);
  }

  private setupOrbitHelper(): void {
    const geo = new THREE.SphereGeometry(10, 32, 24);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x3a5a7a,
      wireframe: true,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
    });
    const sphere = new THREE.Mesh(geo, mat);
    this.scene.add(sphere);
  }

  private setupGround(): void {
    const geo = new THREE.PlaneGeometry(60, 60);
    const mat = new THREE.ShadowMaterial({ opacity: 0.15 });
    const plane = new THREE.Mesh(geo, mat);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -3;
    plane.receiveShadow = true;
    this.scene.add(plane);
  }

  private setupListeners(): void {
    window.addEventListener('resize', this.resize);
    const dom = this.renderer.domElement;
    dom.addEventListener('pointerdown', this.onPointerDown);
    dom.addEventListener('pointermove', this.onPointerMove);
    dom.addEventListener('pointerup', this.onPointerUp);
    dom.addEventListener('pointercancel', this.onPointerUp);
  }

  private bindEvents(): void {
    eventBus.on('molecule:changed', (mol) => this.onMoleculeChanged(mol));
    eventBus.on('atom:selected', (info) => {
      this.selectedAtomIds = info.selectedAtomIds;
      this.refreshHighlights();
      this.refreshAngleLabels();
    });
    eventBus.on('constraint:result', (res) => {
      this.constraintResult = res;
      this.applyConstraintVisuals();
    });
  }

  private resize = (): void => {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / Math.max(h, 1);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.labelRenderer.setSize(w, h);
  };

  private getAtomGeo(radius: number): THREE.SphereGeometry {
    let g = this.atomGeometries.get(radius);
    if (!g) {
      g = new THREE.SphereGeometry(radius, 32, 24);
      this.atomGeometries.set(radius, g);
    }
    return g;
  }

  private getAtomMaterial(type: AtomType, selected: boolean, illegal: boolean): THREE.MeshStandardMaterial {
    const spec = AtomSpecs[type];
    const key = `${type}_${selected ? 's' : 'n'}_${illegal ? 'i' : 'v'}`;
    let mat = this.atomMaterials.get(key);
    if (!mat) {
      mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(spec.color),
        metalness: 0.1,
        roughness: 0.4,
        emissive: illegal ? new THREE.Color(0x330000) : selected ? new THREE.Color(spec.color).multiplyScalar(0.2) : new THREE.Color(0x000000),
        emissiveIntensity: selected ? 0.6 : illegal ? 0.4 : 0,
      });
      this.atomMaterials.set(key, mat);
    }
    return mat;
  }

  private createAtomMesh(atom: Atom): AtomMesh {
    const geo = this.getAtomGeo(AtomSpecs[atom.type].radius);
    const mat = this.getAtomMaterial(atom.type, false, false);
    const mesh = new THREE.Mesh(geo, mat) as AtomMesh;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { atomId: atom.id, isAtom: true };
    return mesh;
  }

  private createHighlightRing(radius: number): THREE.Mesh {
    const geo = new THREE.RingGeometry(radius * 1.35, radius * 1.55, 48);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(geo, mat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -radius * 0.9;
    (ring.material as THREE.MeshBasicMaterial).opacity = 0;
    return ring;
  }

  private createWarningIcon(radius: number): THREE.Group {
    const group = new THREE.Group();
    const triMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const shape = new THREE.Shape();
    const s = radius * 0.7;
    shape.moveTo(0, s * 0.8);
    shape.lineTo(-s * 0.7, -s * 0.5);
    shape.lineTo(s * 0.7, -s * 0.5);
    shape.closePath();
    const triGeo = new THREE.ShapeGeometry(shape);
    const tri = new THREE.Mesh(triGeo, triMat);
    tri.position.y = radius * 1.7;
    const border = new THREE.Mesh(
      triGeo,
      new THREE.MeshBasicMaterial({
        color: 0xff4444,
        wireframe: true,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      })
    );
    border.position.copy(tri.position);
    group.add(tri);
    group.add(border);
    group.userData = { triMat, borderMat: border.material, baseY: tri.position.y };
    return group;
  }

  private onMoleculeChanged(mol: Molecule): void {
    this.clearMolecule();
    let delay = 0;
    const now = performance.now();
    for (const atom of mol.atoms) {
      const group = new THREE.Group();
      group.position.set(atom.x, atom.y, atom.z);
      const mesh = this.createAtomMesh(atom);
      group.add(mesh);
      const ring = this.createHighlightRing(AtomSpecs[atom.type].radius);
      group.add(ring);
      const warn = this.createWarningIcon(AtomSpecs[atom.type].radius);
      group.add(warn);
      this.atomMeshes.set(atom.id, mesh);
      this.atomGroups.set(atom.id, group);
      this.atomHighlight.set(atom.id, ring);
      this.atomWarning.set(atom.id, warn);
      group.scale.setScalar(0.001);
      this.scene.add(group);
      this.pendingAnimations.push({ mesh: group, startTime: now + delay, duration: 300 });
      delay += 50;
      this.dirtyAtoms.add(atom.id);
    }
    for (const bond of mol.bonds) {
      const a = mol.atoms.find((x) => x.id === bond.atomA);
      const b = mol.atoms.find((x) => x.id === bond.atomB);
      if (!a || !b) continue;
      const render = this.createBondRender(bond, a, b);
      this.bondRenders.set(bond.id, render);
      this.scene.add(render.group);
      this.dirtyBonds.add(bond.id);
      const lbl = this.createBondLabel(bond.id);
      this.bondLabels.set(bond.id, lbl);
      const labelGroup = new THREE.Group();
      labelGroup.add(lbl);
      labelGroup.userData.isLabelGroup = true;
      this.scene.add(labelGroup);
      (lbl as any)._group = labelGroup;
    }
    this.refreshHighlights();
    this.refreshBondLabelsPositions();
    this.refreshAngleLabels();
    this.lastConstraintResult = null;
    this.applyConstraintVisuals();
  }

  private createBondRender(bond: Bond, a: Atom, b: Atom): BondRenderData {
    const group = new THREE.Group() as BondMesh;
    group.userData = { bondId: bond.id, isBond: true };
    const cylinders: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshStandardMaterial>[] = [];
    const count = bond.type === 'triple' ? 3 : bond.type === 'double' ? 2 : bond.type === 'aromatic' ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const mat = this.bondMaterial.clone();
      const m = new THREE.Mesh(this.bondCylinderGeo, mat);
      m.castShadow = true;
      m.receiveShadow = true;
      group.add(m);
      cylinders.push(m);
    }
    this.updateBondTransform(group, cylinders, a, b, bond);
    return { group, cylinders };
  }

  private updateBondTransform(group: THREE.Group, cylinders: THREE.Mesh[], a: Atom, b: Atom, _bond: Bond): void {
    void group;
    const start = this.tmpV1.set(a.x, a.y, a.z);
    const end = this.tmpV2.set(b.x, b.y, b.z);
    const dir = this.tmpV3.copy(end).sub(start);
    const length = dir.length();
    const mid = this.tmpV1.copy(start).add(end).multiplyScalar(0.5);
    const quat = this.tmpQuat.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    const count = cylinders.length;
    const offset = count > 1 ? 0.14 : 0;
    const tan1 = this.tmpV2.set(-dir.y, dir.x, 0);
    if (tan1.lengthSq() < 1e-6) tan1.set(1, 0, 0);
    tan1.normalize();
    for (let i = 0; i < count; i++) {
      const cyl = cylinders[i];
      cyl.scale.set(1, Math.max(length, 0.001), 1);
      cyl.quaternion.copy(quat);
      const t = (i - (count - 1) / 2);
      const shift = this.tmpV3.copy(tan1).multiplyScalar(t * offset);
      cyl.position.copy(mid).add(shift);
    }
  }

  private createBondLabel(bondId: string): CSS2DObject {
    const div = document.createElement('div');
    div.className = 'c2d-label';
    div.textContent = '';
    div.dataset.bondId = bondId;
    const label = new CSS2DObject(div);
    label.position.set(0, 0, 0);
    return label;
  }

  private clearMolecule(): void {
    for (const mesh of this.atomMeshes.values()) mesh.geometry = mesh.geometry;
    for (const g of this.atomGroups.values()) {
      this.scene.remove(g);
    }
    for (const b of this.bondRenders.values()) {
      this.scene.remove(b.group);
    }
    for (const l of this.bondLabels.values()) {
      const grp = (l as any)._group as THREE.Group | undefined;
      if (grp) this.scene.remove(grp);
    }
    for (const l of this.angleLabels.values()) {
      const grp = (l as any)._group as THREE.Group | undefined;
      if (grp) this.scene.remove(grp);
    }
    this.atomMeshes.clear();
    this.atomGroups.clear();
    this.atomHighlight.clear();
    this.atomWarning.clear();
    this.bondRenders.clear();
    this.bondLabels.clear();
    this.angleLabels.clear();
    this.pendingAnimations.length = 0;
    this.dirtyAtoms.clear();
    this.dirtyBonds.clear();
  }

  private applyConstraintVisuals(): void {
    const res = this.constraintResult;
    const last = this.lastConstraintResult;
    const lastBadBonds = new Set<string>();
    if (last) for (const v of last.violations) if (v.type === 'bond-length') lastBadBonds.add(v.bondId);
    const badBonds = new Set<string>();
    const badAtoms = new Set<string>();
    if (res) {
      for (const v of res.violations) {
        if (v.type === 'bond-length') {
          badBonds.add(v.bondId);
          if (v.atomA) badAtoms.add(v.atomA);
          if (v.atomB) badAtoms.add(v.atomB);
        }
      }
    }
    for (const [id, render] of this.bondRenders) {
      const isBad = badBonds.has(id);
      const wasBad = lastBadBonds.has(id);
      if (isBad !== wasBad || this.dirtyBonds.has(id)) {
        for (const cyl of render.cylinders) {
          const src = isBad ? this.bondIllegalMaterial : this.bondMaterial;
          cyl.material.color.copy(src.color);
          cyl.material.emissive.copy(src.emissive);
          cyl.material.metalness = src.metalness;
          cyl.material.needsUpdate = true;
        }
      }
    }
    for (const [id, mesh] of this.atomMeshes) {
      const atom = moleculeData.getAtom(id);
      if (!atom) continue;
      const selected = this.selectedAtomIds.includes(id);
      const illegal = badAtoms.has(id);
      const mat = this.getAtomMaterial(atom.type, selected, illegal);
      if (mesh.material !== mat) mesh.material = mat;
    }
    this.lastConstraintResult = res;
    this.dirtyBonds.clear();
  }

  private refreshBondLabelsPositions(): void {
    const mol = moleculeData.getMolecule();
    if (!mol) return;
    const lengths = this.constraintResult?.bondLengths;
    for (const bond of mol.bonds) {
      const label = this.bondLabels.get(bond.id);
      const a = mol.atoms.find((x) => x.id === bond.atomA);
      const b = mol.atoms.find((x) => x.id === bond.atomB);
      if (!label || !a || !b) continue;
      const grp = (label as any)._group as THREE.Group | undefined;
      if (grp) {
        grp.position.set((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
      }
      const div = label.element as HTMLDivElement;
      const len = lengths?.[bond.id] ?? this.tmpV1.set(a.x, a.y, a.z).distanceTo(this.tmpV2.set(b.x, b.y, b.z));
      div.textContent = `${len.toFixed(2)}Å`;
    }
  }

  private refreshAngleLabels(): void {
    for (const l of this.angleLabels.values()) {
      const grp = (l as any)._group as THREE.Group | undefined;
      if (grp) this.scene.remove(grp);
    }
    this.angleLabels.clear();
    const ids = this.selectedAtomIds;
    if (ids.length !== 3) return;
    const mol = moleculeData.getMolecule();
    if (!mol) return;
    const a = mol.atoms.find((x) => x.id === ids[0]);
    const b = mol.atoms.find((x) => x.id === ids[1]);
    const c = mol.atoms.find((x) => x.id === ids[2]);
    if (!a || !b || !c) return;
    const angles = this.constraintResult?.bondAngles ?? [];
    let angle = angles.find((x) =>
      (x.atomA === a.id && x.atomB === b.id && x.atomC === c.id) ||
      (x.atomA === c.id && x.atomB === b.id && x.atomC === a.id)
    )?.angle;
    if (angle == null) {
      const ax = a.x - b.x, ay = a.y - b.y, az = a.z - b.z;
      const cx = c.x - b.x, cy = c.y - b.y, cz = c.z - b.z;
      const la = Math.sqrt(ax * ax + ay * ay + az * az);
      const lc = Math.sqrt(cx * cx + cy * cy + cz * cz);
      if (la > 1e-6 && lc > 1e-6) {
        const cos = (ax * cx + ay * cy + az * cz) / (la * lc);
        angle = (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
      } else angle = 0;
    }
    const key = `${a.id}_${b.id}_${c.id}`;
    const div = document.createElement('div');
    div.className = 'c2d-label angle';
    div.textContent = `${angle.toFixed(1)}°`;
    const label = new CSS2DObject(div);
    const group = new THREE.Group();
    group.add(label);
    group.userData.isLabelGroup = true;
    const r = 0.8;
    const vb = this.tmpV1.set(b.x, b.y, b.z);
    const va = this.tmpV2.set(a.x, a.y, a.z).sub(vb).normalize();
    const vc = this.tmpV3.set(c.x, c.y, c.z).sub(vb).normalize();
    const mid = va.clone().add(vc).multiplyScalar(r);
    group.position.copy(vb).add(mid);
    (label as any)._group = group;
    this.angleLabels.set(key, label);
    this.scene.add(group);
  }

  private refreshHighlights(): void {
    for (const [id, ring] of this.atomHighlight) {
      const selected = this.selectedAtomIds.includes(id);
      const mat = ring.material as THREE.MeshBasicMaterial;
      mat.opacity = selected ? 0.85 : 0;
    }
  }

  private onPointerDown = (e: PointerEvent): void => {
    if (e.button !== 0) return;
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture?.(e.pointerId);
    this.pointerDownPos.set(e.clientX, e.clientY);
    this.pointer.x = ((e.clientX - this.renderer.domElement.getBoundingClientRect().left) / this.renderer.domElement.clientWidth) * 2 - 1;
    this.pointer.y = -(((e.clientY - this.renderer.domElement.getBoundingClientRect().top) / this.renderer.domElement.clientHeight) * 2 - 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const atomMeshes = Array.from(this.atomMeshes.values());
    const hits = this.raycaster.intersectObjects(atomMeshes, false);
    if (hits.length > 0) {
      const mesh = hits[0].object as AtomMesh;
      const id = mesh.userData.atomId;
      const atom = moleculeData.getAtom(id);
      if (atom) {
        this.dragAtomId = id;
        const normal = this.tmpV1.set(0, 0, 1).applyQuaternion(this.camera.quaternion);
        const worldPos = this.tmpV2.set(atom.x, atom.y, atom.z);
        this.dragPlane.setFromNormalAndCoplanarPoint(normal, worldPos);
        const intersect = new THREE.Vector3();
        this.raycaster.ray.intersectPlane(this.dragPlane, intersect);
        if (intersect) this.dragOffset.copy(intersect).sub(worldPos);
        return;
      }
    }
    this.dragAtomId = null;
  };

  private onPointerMove = (e: PointerEvent): void => {
    if (!this.dragAtomId) {
      if (Math.abs(e.clientX - this.pointerDownPos.x) + Math.abs(e.clientY - this.pointerDownPos.y) > 2) {
        this.isDragging = true;
      }
      return;
    }
    this.isDragging = true;
    this.controls.enabled = false;
    this.pointer.x = ((e.clientX - this.renderer.domElement.getBoundingClientRect().left) / this.renderer.domElement.clientWidth) * 2 - 1;
    this.pointer.y = -(((e.clientY - this.renderer.domElement.getBoundingClientRect().top) / this.renderer.domElement.clientHeight) * 2 - 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersect = new THREE.Vector3();
    if (!this.raycaster.ray.intersectPlane(this.dragPlane, intersect)) return;
    const newPos = intersect.sub(this.dragOffset);
    const id = this.dragAtomId;
    moleculeData.updateAtom(id, {
      x: Number(newPos.x.toFixed(3)),
      y: Number(newPos.y.toFixed(3)),
      z: Number(newPos.z.toFixed(3)),
    });
    const grp = this.atomGroups.get(id);
    if (grp) grp.position.set(newPos.x, newPos.y, newPos.z);
    this.dirtyAtoms.add(id);
  };

  private onPointerUp = (e: PointerEvent): void => {
    const wasDragging = this.isDragging;
    this.isDragging = false;
    this.controls.enabled = true;
    const target = e.currentTarget as HTMLElement;
    target.releasePointerCapture?.(e.pointerId);
    if (this.dragAtomId) {
      this.dragAtomId = null;
      this.syncDirtyAtoms();
      return;
    }
    const moved = Math.abs(e.clientX - this.pointerDownPos.x) + Math.abs(e.clientY - this.pointerDownPos.y);
    if (moved < 4 && !wasDragging && e.button === 0) {
      this.pointer.x = ((e.clientX - this.renderer.domElement.getBoundingClientRect().left) / this.renderer.domElement.clientWidth) * 2 - 1;
      this.pointer.y = -(((e.clientY - this.renderer.domElement.getBoundingClientRect().top) / this.renderer.domElement.clientHeight) * 2 - 1);
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const atomMeshes = Array.from(this.atomMeshes.values());
      const hits = this.raycaster.intersectObjects(atomMeshes, false);
      if (hits.length > 0) {
        const mesh = hits[0].object as AtomMesh;
        moleculeData.selectAtom(mesh.userData.atomId, e.shiftKey || e.ctrlKey);
      }
    }
  };

  private syncDirtyAtoms(): void {
    const mol = moleculeData.getMolecule();
    if (!mol) return;
    for (const id of this.dirtyAtoms) {
      const atom = mol.atoms.find((a) => a.id === id);
      const grp = this.atomGroups.get(id);
      if (!atom || !grp) continue;
      grp.position.set(atom.x, atom.y, atom.z);
    }
    this.dirtyAtoms.clear();
    this.refreshBondTransforms();
    this.refreshBondLabelsPositions();
    this.refreshAngleLabels();
    this.applyConstraintVisuals();
  }

  private refreshBondTransforms(): void {
    const mol = moleculeData.getMolecule();
    if (!mol) return;
    for (const bond of mol.bonds) {
      const render = this.bondRenders.get(bond.id);
      const a = mol.atoms.find((x) => x.id === bond.atomA);
      const b = mol.atoms.find((x) => x.id === bond.atomB);
      if (!render || !a || !b) continue;
      this.updateBondTransform(render.group, render.cylinders, a, b, bond);
    }
  }

  public forceRefreshBondLabels(): void {
    this.refreshBondLabelsPositions();
  }

  private animate = (): void => {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();
    const now = performance.now();
    if (this.pendingAnimations.length > 0) {
      const remain: typeof this.pendingAnimations = [];
      for (const a of this.pendingAnimations) {
        if (now < a.startTime) {
          remain.push(a);
          continue;
        }
        const t = Math.min(1, (now - a.startTime) / a.duration);
        const eased = 1 - Math.pow(1 - t, 3);
        const s = 0.001 + eased * 0.999;
        a.mesh.scale.setScalar(s);
        if (t < 1) remain.push(a);
      }
      this.pendingAnimations = remain;
    }
    const pulseT = this.clock.elapsedTime;
    for (const [id, ring] of this.atomHighlight) {
      const selected = this.selectedAtomIds.includes(id);
      if (selected) {
        const scale = 1 + Math.sin(pulseT * (Math.PI * 2 / 0.4)) * 0.1;
        ring.scale.setScalar(scale);
        const mat = ring.material as THREE.MeshBasicMaterial;
        if (mat.opacity < 0.85) mat.opacity = Math.min(0.85, mat.opacity + delta * 3);
      } else {
        const mat = ring.material as THREE.MeshBasicMaterial;
        if (mat.opacity > 0) mat.opacity = Math.max(0, mat.opacity - delta * 4);
      }
    }
    const warnBlink = (Math.sin(pulseT * (Math.PI * 2 / 0.5)) + 1) / 2;
    const bad = new Set<string>();
    if (this.constraintResult) {
      for (const v of this.constraintResult.violations) {
        if (v.type === 'bond-length') {
          if (v.atomA) bad.add(v.atomA);
          if (v.atomB) bad.add(v.atomB);
        }
      }
    }
    for (const [id, g] of this.atomWarning) {
      const has = bad.has(id);
      const ud = g.userData as { triMat: THREE.MeshBasicMaterial; borderMat: THREE.MeshBasicMaterial };
      const op = has ? 0.3 + warnBlink * 0.7 : 0;
      ud.triMat.opacity = op;
      (ud.borderMat as THREE.MeshBasicMaterial).opacity = op;
      g.visible = has || ud.triMat.opacity > 0.01;
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
  };

  public dispose(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
    window.removeEventListener('resize', this.resize);
    const dom = this.renderer.domElement;
    dom.removeEventListener('pointerdown', this.onPointerDown);
    dom.removeEventListener('pointermove', this.onPointerMove);
    dom.removeEventListener('pointerup', this.onPointerUp);
    dom.removeEventListener('pointercancel', this.onPointerUp);
    this.clearMolecule();
    this.atomGeometries.forEach((g) => g.dispose());
    this.atomMaterials.forEach((m) => m.dispose());
    this.bondCylinderGeo.dispose();
    this.bondMaterial.dispose();
    this.bondIllegalMaterial.dispose();
    this.renderer.dispose();
    this.controls.dispose();
  }
}
