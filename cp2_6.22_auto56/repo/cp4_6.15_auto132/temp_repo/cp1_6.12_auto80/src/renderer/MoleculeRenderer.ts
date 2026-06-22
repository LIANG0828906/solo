import * as THREE from 'three';
import type { MoleculeData, AtomData } from '../data/MoleculeStore';

export const CPK_COLORS: Record<string, number> = {
  C: 0x909090,
  H: 0xffffff,
  O: 0xff4444,
  N: 0x4466ff,
  S: 0xffff33,
  P: 0xff8800,
  F: 0x00ffff,
  Cl: 0x00ff00,
  Br: 0x8b0000,
  I: 0x800080,
  default: 0xff88ff
};

const ATOM_RADIUS: Record<string, number> = {
  C: 0.4,
  H: 0.25,
  O: 0.35,
  N: 0.38,
  S: 0.45,
  P: 0.42,
  F: 0.3,
  Cl: 0.4,
  Br: 0.43,
  I: 0.48,
  default: 0.4
};

function brightenColor(hex: number, amount: number = 0.1): number {
  const r = ((hex >> 16) & 255) / 255;
  const g = ((hex >> 8) & 255) / 255;
  const b = (hex & 255) / 255;
  const nr = Math.min(1, r + (1 - r) * amount);
  const ng = Math.min(1, g + (1 - g) * amount);
  const nb = Math.min(1, b + (1 - b) * amount);
  return Math.round(nr * 255) << 16 | Math.round(ng * 255) << 8 | Math.round(nb * 255);
}

function getAtomColor(element: string): number {
  const base = CPK_COLORS[element] || CPK_COLORS.default;
  return brightenColor(base, 0.1);
}

function getAtomRadius(element: string): number {
  return ATOM_RADIUS[element] || ATOM_RADIUS.default;
}

export interface SelectionInfo {
  type: 'atom' | 'bond';
  id: string;
}

export interface RendererCallbacks {
  onSelect?: (info: SelectionInfo | null) => void;
  onAtomClick?: (atomId: string, screenPos: { x: number; y: number }) => void;
}

export class MoleculeRenderer {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  private moleculeGroup: THREE.Group;
  private atomMeshes: Map<string, THREE.Mesh>;
  private bondMeshes: Map<string, THREE.Object3D>;
  private atomMap: Map<THREE.Object3D, string>;
  private bondMap: Map<THREE.Object3D, string>;
  private selectionRing: THREE.Mesh | null;
  private selectedAtomId: string | null;

  private isDragging: boolean;
  private isPanning: boolean;
  private isClipping: boolean;
  private ctrlPressed: boolean;
  private prevMousePos: { x: number; y: number };

  private rotationVelocity: { x: number; y: number };

  private clippingPlane: THREE.Plane;
  private clipPlaneMesh: THREE.Mesh | null;
  private clipArrowGroup: THREE.Group | null;

  private clock: THREE.Clock;
  private pulseTime: number;

  private callbacks: RendererCallbacks;
  private currentMolecule: MoleculeData | null;

  private animationId: number | null;

  constructor(container: HTMLElement, callbacks: RendererCallbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
    this.moleculeGroup = new THREE.Group();
    this.atomMeshes = new Map();
    this.bondMeshes = new Map();
    this.atomMap = new Map();
    this.bondMap = new Map();
    this.selectionRing = null;
    this.selectedAtomId = null;
    this.currentMolecule = null;

    this.isDragging = false;
    this.isPanning = false;
    this.isClipping = false;
    this.ctrlPressed = false;
    this.prevMousePos = { x: 0, y: 0 };
    this.rotationVelocity = { x: 0, y: 0 };

    this.clippingPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    this.clipPlaneMesh = null;
    this.clipArrowGroup = null;

    this.clock = new THREE.Clock();
    this.pulseTime = 0;
    this.animationId = null;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 8);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: container as HTMLCanvasElement
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.localClippingEnabled = true;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.setupLights();
    this.scene.add(this.moleculeGroup);

    this.bindEvents();
    this.animate();
  }

  private setupLights(): void {
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambient);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight1.position.set(5, 5, 5);
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    dirLight2.position.set(-5, -3, -5);
    this.scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0x4fc3f7, 0.3, 20);
    pointLight.position.set(0, 3, 5);
    this.scene.add(pointLight);
  }

  private bindEvents(): void {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('mouseup', this.onMouseUp.bind(this));
    canvas.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Control') this.ctrlPressed = true;
    });
    window.addEventListener('keyup', (e) => {
      if (e.key === 'Control') this.ctrlPressed = false;
    });

    window.addEventListener('resize', this.onResize.bind(this));
  }

  private onMouseDown(e: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.prevMousePos = { x, y };

    if (this.ctrlPressed && e.button === 0) {
      this.isClipping = true;
      this.updateClipPlane(e.clientX, e.clientY);
    } else if (e.button === 0) {
      this.isDragging = true;
    } else if (e.button === 2) {
      this.isPanning = true;
    }

    if (e.button === 0 && !this.ctrlPressed) {
      this.handleClick(x, y);
    }
  }

  private onMouseMove(e: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const dx = x - this.prevMousePos.x;
    const dy = y - this.prevMousePos.y;

    if (this.isClipping) {
      this.updateClipPlane(e.clientX, e.clientY, dx, dy);
    } else if (this.isDragging) {
      this.rotateScene(dx * 0.005, dy * 0.005);
      this.rotationVelocity = { x: dy * 0.005, y: dx * 0.005 };
    } else if (this.isPanning) {
      this.panScene(dx * 0.01, -dy * 0.01);
    }

    this.prevMousePos = { x, y };
  }

  private onMouseUp(): void {
    this.isDragging = false;
    this.isPanning = false;
    this.isClipping = false;
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 1.1 : 0.9;
    this.zoom(delta);
  }

  private onResize(): void {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  private rotateScene(deltaX: number, deltaY: number): void {
    this.moleculeGroup.rotation.y += deltaX;
    this.moleculeGroup.rotation.x += deltaY;
    this.moleculeGroup.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.moleculeGroup.rotation.x));
  }

  private panScene(dx: number, dy: number): void {
    const panSpeed = 0.02 * this.camera.position.z;
    const right = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    this.camera.getWorldDirection(right);
    right.cross(up).normalize();
    this.moleculeGroup.position.add(right.multiplyScalar(-dx * panSpeed));
    this.moleculeGroup.position.y += dy * panSpeed;
  }

  private zoom(factor: number): void {
    const distance = this.camera.position.z * factor;
    this.camera.position.z = Math.max(2, Math.min(50, distance));
  }

  private updateClipPlane(clientX: number, clientY: number, _dx: number = 0, dy: number = 0): void {
    if (!this.clipPlaneMesh) {
      this.createClipPlaneVisual();
    }

    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);
    const planeNormal = new THREE.Vector3();
    this.camera.getWorldDirection(planeNormal);
    planeNormal.negate();

    const center = new THREE.Vector3();
    this.raycaster.ray.at(5, center);

    this.clippingPlane.setFromNormalAndCoplanarPoint(planeNormal, center);
    this.clippingPlane.constant += dy * 0.02;

    this.updateClipPlaneVisual();
    this.updateClipping();
  }

  private createClipPlaneVisual(): void {
    const planeGeo = new THREE.PlaneGeometry(10, 10);
    const planeMat = new THREE.MeshBasicMaterial({
      color: 0x4fc3f7,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    this.clipPlaneMesh = new THREE.Mesh(planeGeo, planeMat);
    this.scene.add(this.clipPlaneMesh);

    const borderGeo = new THREE.EdgesGeometry(planeGeo);
    const borderMat = new THREE.LineBasicMaterial({ color: 0x4fc3f7, transparent: true, opacity: 0.5 });
    const border = new THREE.LineSegments(borderGeo, borderMat);
    this.clipPlaneMesh.add(border);

    this.clipArrowGroup = new THREE.Group();
    const arrowDir = new THREE.Vector3(0, 0, 1);
    const arrowOrigin = new THREE.Vector3(0, 0, 0.01);
    const arrowHelper = new THREE.ArrowHelper(arrowDir, arrowOrigin, 1.5, 0x4fc3f7, 0.4, 0.2);
    this.clipArrowGroup.add(arrowHelper);
    this.clipPlaneMesh.add(this.clipArrowGroup);
  }

  private updateClipPlaneVisual(): void {
    if (!this.clipPlaneMesh) return;

    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), this.clippingPlane.normal);
    this.clipPlaneMesh.quaternion.copy(quaternion);

    const point = new THREE.Vector3();
    this.clippingPlane.coplanarPoint(point);
    this.clipPlaneMesh.position.copy(point);
  }

  private updateClipping(): void {
    if (!this.clipPlaneMesh) return;

    this.atomMeshes.forEach((mesh) => {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.clippingPlanes = [this.clippingPlane];
      if (this.isPointBehindPlane(mesh.position)) {
        mat.opacity = 0.3;
        mat.transparent = true;
      } else {
        mat.opacity = 1;
        mat.transparent = false;
      }
    });

    this.bondMeshes.forEach((obj) => {
      obj.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const mat = child.material as THREE.MeshStandardMaterial;
          mat.clippingPlanes = [this.clippingPlane];
          const center = new THREE.Vector3();
          child.getWorldPosition(center);
          if (this.isPointBehindPlane(center)) {
            mat.opacity = 0.3;
            mat.transparent = true;
          } else {
            mat.opacity = 0.85;
            mat.transparent = true;
          }
        }
      });
    });
  }

  private isPointBehindPlane(point: THREE.Vector3): boolean {
    return this.clippingPlane.distanceToPoint(point) < 0;
  }

  public setClippingEnabled(enabled: boolean): void {
    if (enabled && !this.clipPlaneMesh) {
      this.createClipPlaneVisual();
      this.updateClipPlaneVisual();
    }
    if (this.clipPlaneMesh) {
      this.clipPlaneMesh.visible = enabled;
    }
    if (!enabled) {
      this.atomMeshes.forEach((mesh) => {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.clippingPlanes = [];
        mat.opacity = 1;
        mat.transparent = false;
      });
      this.bondMeshes.forEach((obj) => {
        obj.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const mat = child.material as THREE.MeshStandardMaterial;
            mat.clippingPlanes = [];
            mat.opacity = 0.85;
          }
        });
      });
    } else {
      this.updateClipping();
    }
  }

  public isClippingEnabled(): boolean {
    return this.clipPlaneMesh !== null && this.clipPlaneMesh.visible;
  }

  private handleClick(x: number, y: number): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((x) / rect.width) * 2 - 1;
    this.mouse.y = -((y) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const atomTargets = Array.from(this.atomMeshes.values());
    const atomIntersects = this.raycaster.intersectObjects(atomTargets, false);

    if (atomIntersects.length > 0) {
      const mesh = atomIntersects[0].object as THREE.Mesh;
      const atomId = this.atomMap.get(mesh);
      if (atomId) {
        this.selectAtom(atomId);
        const screenPos = this.worldToScreen(mesh.position);
        this.callbacks.onAtomClick?.(atomId, screenPos);
        this.callbacks.onSelect?.({ type: 'atom', id: atomId });
        return;
      }
    }

    const bondTargets: THREE.Object3D[] = [];
    this.bondMeshes.forEach((obj) => {
      obj.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          bondTargets.push(child);
        }
      });
    });

    const bondIntersects = this.raycaster.intersectObjects(bondTargets, false);
    if (bondIntersects.length > 0) {
      let obj: THREE.Object3D | null = bondIntersects[0].object;
      while (obj && !this.bondMap.has(obj)) {
        obj = obj.parent;
      }
      if (obj) {
        const bondId = this.bondMap.get(obj);
        if (bondId) {
          this.callbacks.onSelect?.({ type: 'bond', id: bondId });
          return;
        }
      }
    }

    this.clearSelection();
    this.callbacks.onSelect?.(null);
  }

  private worldToScreen(position: THREE.Vector3): { x: number; y: number } {
    const vector = position.clone();
    const worldPos = new THREE.Vector3();
    this.moleculeGroup.localToWorld(worldPos.copy(vector));
    worldPos.project(this.camera);

    const rect = this.renderer.domElement.getBoundingClientRect();
    return {
      x: (worldPos.x * 0.5 + 0.5) * rect.width,
      y: (-worldPos.y * 0.5 + 0.5) * rect.height
    };
  }

  public selectAtom(atomId: string): void {
    this.clearSelection();
    this.selectedAtomId = atomId;

    const mesh = this.atomMeshes.get(atomId);
    if (!mesh) return;

    const element = this.currentMolecule?.atoms.find(a => a.id === atomId)?.element || 'C';
    const color = getAtomColor(element);

    const ringGeo = new THREE.RingGeometry(1.2, 1.4, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    this.selectionRing = new THREE.Mesh(ringGeo, ringMat);
    this.selectionRing.position.copy(mesh.position);
    this.moleculeGroup.add(this.selectionRing);

    this.pulseTime = 0;
  }

  public clearSelection(): void {
    this.selectedAtomId = null;
    if (this.selectionRing) {
      this.moleculeGroup.remove(this.selectionRing);
      this.selectionRing.geometry.dispose();
      (this.selectionRing.material as THREE.Material).dispose();
      this.selectionRing = null;
    }
  }

  public getSelectedAtomId(): string | null {
    return this.selectedAtomId;
  }

  public getAtomWorldPosition(atomId: string): THREE.Vector3 | null {
    const mesh = this.atomMeshes.get(atomId);
    if (!mesh) return null;
    const pos = new THREE.Vector3();
    mesh.getWorldPosition(pos);
    return pos;
  }

  public getAtomScreenPosition(atomId: string): { x: number; y: number } | null {
    const mesh = this.atomMeshes.get(atomId);
    if (!mesh) return null;
    return this.worldToScreen(mesh.position);
  }

  public loadMolecule(molecule: MoleculeData): void {
    this.clearMolecule();
    this.currentMolecule = molecule;

    const atomGeoCache = new Map<string, THREE.SphereGeometry>();
    const atomMatCache = new Map<string, THREE.MeshStandardMaterial>();

    molecule.atoms.forEach((atom) => {
      const radius = getAtomRadius(atom.element);
      const color = getAtomColor(atom.element);

      let geo = atomGeoCache.get(atom.element);
      if (!geo) {
        geo = new THREE.SphereGeometry(radius, 16, 16);
        atomGeoCache.set(atom.element, geo);
      }

      let mat = atomMatCache.get(atom.element);
      if (!mat) {
        mat = new THREE.MeshStandardMaterial({
          color: color,
          roughness: 0.3,
          metalness: 0.1
        });
        atomMatCache.set(atom.element, mat);
      }

      const sphere = new THREE.Mesh(geo, mat);
      sphere.position.set(atom.x, atom.y, atom.z);
      sphere.userData = { atomId: atom.id, element: atom.element };
      this.moleculeGroup.add(sphere);
      this.atomMeshes.set(atom.id, sphere);
      this.atomMap.set(sphere, atom.id);
    });

    molecule.bonds.forEach((bond) => {
      const atom1 = molecule.atoms.find(a => a.id === bond.atom1);
      const atom2 = molecule.atoms.find(a => a.id === bond.atom2);
      if (!atom1 || !atom2) return;

      const bondGroup = this.createBond(atom1, atom2, bond.type);
      this.moleculeGroup.add(bondGroup);
      this.bondMeshes.set(bond.id, bondGroup);
      this.bondMap.set(bondGroup, bond.id);
    });

    this.centerMolecule();
    this.fitCamera();
  }

  private createBond(atom1: AtomData, atom2: AtomData, type: string): THREE.Group {
    const group = new THREE.Group();
    const start = new THREE.Vector3(atom1.x, atom1.y, atom1.z);
    const end = new THREE.Vector3(atom2.x, atom2.y, atom2.z);
    const direction = new THREE.Vector3().subVectors(end, start);
    const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

    const color1 = getAtomColor(atom1.element);
    const color2 = getAtomColor(atom2.element);

    if (type === 'single') {
      const r = 0.1;
      const cyl1 = this.createHalfCylinder(start, midPoint, r, color1);
      const cyl2 = this.createHalfCylinder(end, midPoint, r, color2);
      group.add(cyl1, cyl2);
    } else if (type === 'double') {
      const r = 0.07;
      const perp = this.getPerpendicularVector(direction.clone().normalize()).multiplyScalar(0.1);

      const start1 = start.clone().add(perp);
      const end1 = end.clone().add(perp);
      const mid1 = new THREE.Vector3().addVectors(start1, end1).multiplyScalar(0.5);
      group.add(this.createHalfCylinder(start1, mid1, r, color1));
      group.add(this.createHalfCylinder(end1, mid1, r, color2));

      const start2 = start.clone().sub(perp);
      const end2 = end.clone().sub(perp);
      const mid2 = new THREE.Vector3().addVectors(start2, end2).multiplyScalar(0.5);
      group.add(this.createHalfCylinder(start2, mid2, r, color1));
      group.add(this.createHalfCylinder(end2, mid2, r, color2));
    } else if (type === 'aromatic') {
      const r = 0.06;
      const perp = this.getPerpendicularVector(direction.clone().normalize()).multiplyScalar(0.12);

      const start1 = start.clone().add(perp);
      const end1 = end.clone().add(perp);
      const mid1 = new THREE.Vector3().addVectors(start1, end1).multiplyScalar(0.5);
      group.add(this.createHalfCylinder(start1, mid1, r, color1));
      group.add(this.createHalfCylinder(end1, mid1, r, color2));

      const start2 = start.clone().sub(perp);
      const end2 = end.clone().sub(perp);
      const mid2 = new THREE.Vector3().addVectors(start2, end2).multiplyScalar(0.5);
      group.add(this.createHalfCylinder(start2, mid2, r, color1, true));
      group.add(this.createHalfCylinder(end2, mid2, r, color2, true));
    }

    return group;
  }

  private createHalfCylinder(start: THREE.Vector3, end: THREE.Vector3, radius: number, color: number, dashed: boolean = false): THREE.Mesh {
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    const geo = new THREE.CylinderGeometry(radius, radius, length, 12);
    const mat = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.4,
      metalness: 0.05,
      transparent: dashed,
      opacity: dashed ? 0.5 : 0.85
    });
    const cyl = new THREE.Mesh(geo, mat);

    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    cyl.position.copy(mid);

    const up = new THREE.Vector3(0, 1, 0);
    const dir = direction.clone().normalize();
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, dir);
    cyl.quaternion.copy(quaternion);

    return cyl;
  }

  private getPerpendicularVector(v: THREE.Vector3): THREE.Vector3 {
    const up = new THREE.Vector3(0, 1, 0);
    const perp = new THREE.Vector3();
    perp.crossVectors(v, up);
    if (perp.lengthSq() < 0.001) {
      perp.crossVectors(v, new THREE.Vector3(1, 0, 0));
    }
    perp.normalize();
    return perp;
  }

  private clearMolecule(): void {
    this.clearSelection();

    this.atomMeshes.forEach((mesh) => {
      this.moleculeGroup.remove(mesh);
    });
    this.atomMeshes.clear();
    this.atomMap.clear();

    this.bondMeshes.forEach((obj) => {
      this.moleculeGroup.remove(obj);
      obj.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    });
    this.bondMeshes.clear();
    this.bondMap.clear();

    this.currentMolecule = null;
  }

  private centerMolecule(): void {
    const box = new THREE.Box3().setFromObject(this.moleculeGroup);
    const center = new THREE.Vector3();
    box.getCenter(center);
    this.moleculeGroup.position.sub(center);
  }

  private fitCamera(): void {
    const box = new THREE.Box3().setFromObject(this.moleculeGroup);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.camera.fov * (Math.PI / 180);
    const distance = maxDim / (2 * Math.tan(fov / 2)) * 1.5;
    this.camera.position.z = Math.max(distance, 3);
  }

  public resetView(): void {
    this.moleculeGroup.position.set(0, 0, 0);
    this.moleculeGroup.rotation.set(0, 0, 0);
    this.fitCamera();
    this.centerMolecule();
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(this.animate.bind(this));

    const delta = this.clock.getDelta();

    if (!this.isDragging && (this.rotationVelocity.x !== 0 || this.rotationVelocity.y !== 0)) {
      this.moleculeGroup.rotation.y += this.rotationVelocity.y;
      this.moleculeGroup.rotation.x += this.rotationVelocity.x;
      this.moleculeGroup.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.moleculeGroup.rotation.x));
      this.rotationVelocity.x *= 0.95;
      this.rotationVelocity.y *= 0.95;
      if (Math.abs(this.rotationVelocity.x) < 0.0001) this.rotationVelocity.x = 0;
      if (Math.abs(this.rotationVelocity.y) < 0.0001) this.rotationVelocity.y = 0;
    }

    if (this.selectionRing && this.selectedAtomId) {
      this.pulseTime += delta;
      const pulsePeriod = 1.5;
      const t = (this.pulseTime % pulsePeriod) / pulsePeriod;
      const scale = 1 + Math.sin(t * Math.PI * 2) * 0.2;
      this.selectionRing.scale.set(scale, scale, 1);
      const mat = this.selectionRing.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.3 + Math.sin(t * Math.PI * 2) * 0.4;
    }

    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    this.clearMolecule();
    this.renderer.dispose();
  }

  public getScene(): THREE.Scene { return this.scene; }
  public getCamera(): THREE.Camera { return this.camera; }
  public getRenderer(): THREE.WebGLRenderer { return this.renderer; }
}
