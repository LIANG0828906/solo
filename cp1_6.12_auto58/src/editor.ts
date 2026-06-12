import * as THREE from 'three';
import { BlockType, TrackCell } from './types';
import { UIManager } from './ui';

const GRID_COLS = 6;
const GRID_ROWS = 12;
const CELL_SIZE = 1;

export class TrackEditor {
  public trackData: TrackCell[] = [];

  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private ui: UIManager;

  private gridGroup: THREE.Group = new THREE.Group();
  private blocksGroup: THREE.Group = new THREE.Group();
  private blockMeshes: Map<string, THREE.Mesh> = new Map();
  private highlightMesh: THREE.Mesh | null = null;

  private isDragging = false;
  private dragStart = new THREE.Vector2();
  private cameraTarget = new THREE.Vector3(0, 0, 0);
  private cameraDistance = 14;
  private cameraAngleX = Math.PI / 4;
  private cameraAngleY = Math.PI / 3.5;

  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private gridPlane: THREE.Mesh | null = null;

  private animatingBlocks: Map<THREE.Mesh, { target: number; start: number; startTime: number }> = new Map();

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, ui: UIManager) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.ui = ui;

    this.scene.add(this.gridGroup);
    this.scene.add(this.blocksGroup);

    this.createGrid();
    this.setupEventListeners();
    this.updateCamera();
    this.addDefaultTrack();
  }

  private addDefaultTrack(): void {
    for (let z = -5; z <= 5; z++) {
      this.placeBlock(0, z, 'straight', 0);
    }
    this.placeBlock(0, -6, 'start', 0);
    this.placeBlock(0, 6, 'end', 0);
  }

  private createGrid(): void {
    const gridHelper = new THREE.GridHelper(GRID_COLS, GRID_COLS, 0x00d4ff, 0x0066aa);
    gridHelper.position.y = -0.01;
    gridHelper.position.x = 0;
    gridHelper.position.z = 0;
    (gridHelper.material as THREE.Material).opacity = 0.4;
    (gridHelper.material as THREE.Material).transparent = true;
    this.gridGroup.add(gridHelper);

    const gridHelper2 = new THREE.GridHelper(GRID_ROWS, GRID_ROWS, 0x00d4ff, 0x0066aa);
    gridHelper2.rotation.y = Math.PI / 2;
    gridHelper2.position.y = -0.01;
    (gridHelper2.material as THREE.Material).opacity = 0.25;
    (gridHelper2.material as THREE.Material).transparent = true;
    this.gridGroup.add(gridHelper2);

    const planeGeo = new THREE.PlaneGeometry(GRID_COLS, GRID_ROWS);
    const planeMat = new THREE.MeshBasicMaterial({
      color: 0x0a0020,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });
    this.gridPlane = new THREE.Mesh(planeGeo, planeMat);
    this.gridPlane.rotation.x = -Math.PI / 2;
    this.gridPlane.position.y = -0.02;
    this.gridPlane.name = 'gridPlane';
    this.gridGroup.add(this.gridPlane);

    const borderGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(GRID_COLS, 0.01, GRID_ROWS));
    const borderMat = new THREE.LineBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.6 });
    const border = new THREE.LineSegments(borderGeo, borderMat);
    border.position.y = 0;
    this.gridGroup.add(border);

    const highlightGeo = new THREE.PlaneGeometry(CELL_SIZE * 0.95, CELL_SIZE * 0.95);
    const highlightMat = new THREE.MeshBasicMaterial({
      color: 0xff00c8,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    this.highlightMesh = new THREE.Mesh(highlightGeo, highlightMat);
    this.highlightMesh.rotation.x = -Math.PI / 2;
    this.highlightMesh.position.y = 0.005;
    this.highlightMesh.visible = false;
    this.gridGroup.add(this.highlightMesh);
  }

  private setupEventListeners(): void {
    const dom = this.renderer.domElement;

    dom.addEventListener('mousedown', (e) => {
      if (e.button === 2 || e.button === 1) {
        this.isDragging = true;
        this.dragStart.set(e.clientX, e.clientY);
      }
    });

    dom.addEventListener('mousemove', (e) => {
      this.updateMouse(e);
      this.updateHighlight();

      if (this.isDragging && (e.buttons === 2 || e.buttons === 4)) {
        const dx = e.clientX - this.dragStart.x;
        const dy = e.clientY - this.dragStart.y;
        this.cameraAngleX -= dx * 0.005;
        this.cameraAngleY = Math.max(0.2, Math.min(Math.PI / 2.2, this.cameraAngleY - dy * 0.005));
        this.dragStart.set(e.clientX, e.clientY);
        this.updateCamera();
      }
    });

    dom.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    dom.addEventListener('contextmenu', (e) => e.preventDefault());

    dom.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.cameraDistance = Math.max(5, Math.min(25, this.cameraDistance + e.deltaY * 0.01));
      this.updateCamera();
    }, { passive: false });

    dom.addEventListener('click', (e) => {
      if (e.button !== 0) return;
      this.handleClick(e);
    });
  }

  private updateMouse(e: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private updateHighlight(): void {
    if (!this.highlightMesh || !this.gridPlane) return;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.gridPlane);

    if (intersects.length > 0) {
      const point = intersects[0].point;
      const gx = Math.round(point.x);
      const gz = Math.round(point.z);

      if (gx >= -GRID_COLS / 2 && gx <= GRID_COLS / 2 - 1 && gz >= -GRID_ROWS / 2 && gz <= GRID_ROWS / 2 - 1) {
        this.highlightMesh.visible = true;
        this.highlightMesh.position.x = gx;
        this.highlightMesh.position.z = gz;
        return;
      }
    }
    this.highlightMesh.visible = false;
  }

  private handleClick(e: MouseEvent): void {
    if (!this.gridPlane) return;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.gridPlane);

    if (intersects.length > 0) {
      const point = intersects[0].point;
      const gx = Math.round(point.x);
      const gz = Math.round(point.z);

      if (gx >= -GRID_COLS / 2 && gx <= GRID_COLS / 2 - 1 && gz >= -GRID_ROWS / 2 && gz <= GRID_ROWS / 2 - 1) {
        const hasBlock = this.getBlock(gx, gz) !== undefined;
        this.ui.setSelectedCell(gx, gz);
        this.ui.showBuildMenu(e.clientX + 10, e.clientY + 10, hasBlock);
      }
    }
  }

  private updateCamera(): void {
    const x = this.cameraTarget.x + this.cameraDistance * Math.sin(this.cameraAngleY) * Math.sin(this.cameraAngleX);
    const y = this.cameraTarget.y + this.cameraDistance * Math.cos(this.cameraAngleY);
    const z = this.cameraTarget.z + this.cameraDistance * Math.sin(this.cameraAngleY) * Math.cos(this.cameraAngleX);
    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.cameraTarget);
  }

  private getBlockKey(x: number, z: number): string {
    return `${x},${z}`;
  }

  public getBlock(x: number, z: number): TrackCell | undefined {
    return this.trackData.find(b => b.gridX === x && b.gridZ === z);
  }

  public placeBlock(x: number, z: number, type: BlockType, rotation: number = 0): void {
    const existing = this.getBlock(x, z);
    if (existing) {
      this.removeBlock(x, z);
    }

    const cell: TrackCell = { type, rotation, gridX: x, gridZ: z };
    this.trackData.push(cell);
    this.createBlockMesh(cell);
  }

  public removeBlock(x: number, z: number): void {
    const key = this.getBlockKey(x, z);
    const mesh = this.blockMeshes.get(key);
    if (mesh) {
      this.blocksGroup.remove(mesh);
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(m => m.dispose());
      } else {
        mesh.material.dispose();
      }
      this.blockMeshes.delete(key);
    }
    this.trackData = this.trackData.filter(b => !(b.gridX === x && b.gridZ === z));
  }

  public rotateBlock(x: number, z: number): void {
    const block = this.getBlock(x, z);
    if (!block) return;
    block.rotation = (block.rotation + 1) % 4;
    const key = this.getBlockKey(x, z);
    const mesh = this.blockMeshes.get(key);
    if (mesh) {
      this.animatingBlocks.set(mesh, {
        target: block.rotation * (Math.PI / 2),
        start: mesh.rotation.y,
        startTime: performance.now(),
      });
    }
  }

  private createBlockMesh(cell: TrackCell): void {
    const key = this.getBlockKey(cell.gridX, cell.gridZ);
    let geometry: THREE.BufferGeometry;
    let material: THREE.MeshStandardMaterial | THREE.MeshStandardMaterial[];

    switch (cell.type) {
      case 'straight':
      case 'start':
      case 'end': {
        geometry = new THREE.BoxGeometry(CELL_SIZE * 0.9, 0.2, CELL_SIZE * 0.9);
        let color = 0xc0c0d0;
        if (cell.type === 'start') color = 0x00ffc8;
        if (cell.type === 'end') color = 0xffcc00;
        material = new THREE.MeshStandardMaterial({
          color,
          metalness: 0.3,
          roughness: 0.5,
          emissive: cell.type === 'start' ? 0x003322 : cell.type === 'end' ? 0x332200 : 0x000000,
          emissiveIntensity: 0.4,
        });
        break;
      }
      case 'turn': {
        geometry = new THREE.BoxGeometry(CELL_SIZE * 0.9, 0.2, CELL_SIZE * 0.9);
        material = new THREE.MeshStandardMaterial({
          color: 0x606080,
          metalness: 0.4,
          roughness: 0.4,
        });
        break;
      }
      case 'slope': {
        geometry = new THREE.BufferGeometry();
        const verts = new Float32Array([
          -0.45, 0, -0.45,
          0.45, 0, -0.45,
          0.45, 0, 0.45,
          -0.45, 0, 0.45,
          -0.45, 0.3, -0.45,
          0.45, 0.3, -0.45,
        ]);
        const indices = [
          0, 1, 4, 1, 5, 4,
          0, 4, 3, 3, 4, 5, 3, 5, 2,
          0, 3, 2, 0, 2, 1,
          3, 5, 4, 2, 5, 3,
        ];
        geometry.setAttribute('position', new THREE.BufferAttribute(verts, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        material = new THREE.MeshStandardMaterial({
          color: 0x8888aa,
          metalness: 0.3,
          roughness: 0.5,
          side: THREE.DoubleSide,
        });
        break;
      }
      case 'spike': {
        const baseGeo = new THREE.BoxGeometry(CELL_SIZE * 0.9, 0.15, CELL_SIZE * 0.9);
        const spikeGeo = new THREE.ConeGeometry(0.12, 0.4, 4);
        spikeGeo.translate(0, 0.27, 0);

        const merged = mergeGeometries([baseGeo, spikeGeo]);
        merged.translate(0, 0.075, 0);
        geometry = merged;
        material = new THREE.MeshStandardMaterial({
          color: 0xff3333,
          metalness: 0.6,
          roughness: 0.3,
          emissive: 0x330000,
          emissiveIntensity: 0.5,
        });
        break;
      }
      case 'boost': {
        geometry = new THREE.BoxGeometry(CELL_SIZE * 0.85, 0.18, CELL_SIZE * 0.85);
        material = new THREE.MeshStandardMaterial({
          color: 0x00ff66,
          metalness: 0.5,
          roughness: 0.3,
          emissive: 0x00ff66,
          emissiveIntensity: 0.7,
        });
        break;
      }
      default:
        geometry = new THREE.BoxGeometry(CELL_SIZE * 0.9, 0.2, CELL_SIZE * 0.9);
        material = new THREE.MeshStandardMaterial({ color: 0x888888 });
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(cell.gridX, cell.type === 'spike' ? 0.075 : 0.1, cell.gridZ);
    mesh.rotation.y = cell.rotation * (Math.PI / 2);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    if (cell.type === 'turn') {
      const curvePts: THREE.Vector3[] = [];
      for (let i = 0; i <= 20; i++) {
        const t = i / 20;
        const angle = -Math.PI / 2 * t;
        curvePts.push(new THREE.Vector3(
          -0.35 + 0.35 * Math.cos(angle),
          0.21,
          0.35 - 0.35 * Math.sin(-angle)
        ));
      }
      const curveGeo = new THREE.BufferGeometry().setFromPoints(curvePts);
      const curveMat = new THREE.LineBasicMaterial({ color: 0x00c8ff, transparent: true, opacity: 0.9 });
      const curve = new THREE.Line(curveGeo, curveMat);
      mesh.add(curve);
    }

    if (cell.type === 'boost') {
      const arrowPts: THREE.Vector3[] = [];
      for (let i = -2; i <= 2; i++) {
        arrowPts.push(new THREE.Vector3(i * 0.15, 0.1, -0.1));
        arrowPts.push(new THREE.Vector3(i * 0.15 + 0.08, 0.1, 0));
        arrowPts.push(new THREE.Vector3(i * 0.15, 0.1, 0.1));
      }
      const arrowGeo = new THREE.BufferGeometry().setFromPoints(arrowPts);
      const arrowMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, transparent: true, opacity: 0.9 });
      const arrows = new THREE.Points(arrowGeo, arrowMat);
      mesh.add(arrows);
    }

    if (cell.type === 'start') {
      const textPts: THREE.Vector3[] = [];
      for (let i = 0; i < 20; i++) {
        textPts.push(new THREE.Vector3((Math.random() - 0.5) * 0.5, 0.12 + Math.random() * 0.1, (Math.random() - 0.5) * 0.5));
      }
      const textGeo = new THREE.BufferGeometry().setFromPoints(textPts);
      const textMat = new THREE.PointsMaterial({ color: 0x00ffc8, size: 0.05, transparent: true, opacity: 0.9 });
      mesh.add(new THREE.Points(textGeo, textMat));
    }

    if (cell.type === 'end') {
      for (let i = -2; i <= 2; i++) {
        const poleGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.5, 6);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.set(i * 0.15, 0.35, 0);
        mesh.add(pole);
      }
    }

    this.blockMeshes.set(key, mesh);
    this.blocksGroup.add(mesh);
  }

  public setVisible(visible: boolean): void {
    this.gridGroup.visible = visible;
    this.blocksGroup.visible = visible;
  }

  public update(dt: number): void {
    const now = performance.now();
    this.animatingBlocks.forEach((anim, mesh) => {
      const elapsed = (now - anim.startTime) / 1000;
      const duration = 0.2;
      if (elapsed >= duration) {
        mesh.rotation.y = anim.target;
        mesh.scale.set(1, 1, 1);
        this.animatingBlocks.delete(mesh);
      } else {
        const t = elapsed / duration;
        const eased = 1 - Math.pow(1 - t, 3);
        mesh.rotation.y = anim.start + (anim.target - anim.start) * eased;
        const bounce = Math.sin(t * Math.PI) * 0.2;
        const s = 1 + bounce;
        mesh.scale.set(s, s, s);
      }
    });
  }
}

function mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  let indexOffset = 0;

  geometries.forEach(geo => {
    geo.computeVertexNormals();
    const pos = geo.getAttribute('position') as THREE.BufferAttribute;
    const norm = geo.getAttribute('normal') as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      positions.push(pos.getX(i), pos.getY(i), pos.getZ(i));
      if (norm) normals.push(norm.getX(i), norm.getY(i), norm.getZ(i));
    }
    if (geo.index) {
      for (let i = 0; i < geo.index.count; i++) {
        indices.push(geo.index.getX(i) + indexOffset);
      }
    } else {
      for (let i = 0; i < pos.count; i++) {
        indices.push(i + indexOffset);
      }
    }
    indexOffset += pos.count;
  });

  const result = new THREE.BufferGeometry();
  result.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  if (normals.length > 0) {
    result.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  }
  result.setIndex(indices);
  return result;
}
