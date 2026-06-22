import * as THREE from 'three';
import { Brick, BrickType } from '../store/useAppStore';

export const GRID_UNIT = 16;
export const GRID_SIZE = 20;

export class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer | null = null;
  private bricks: Map<string, THREE.Mesh> = new Map();
  private brickTypes: BrickType[] = [];
  private selectedIds: Set<string> = new Set();
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private mouse: THREE.Vector2 = new THREE.Vector2();
  private isRotating: boolean = false;
  private previousMousePosition: { x: number; y: number } = { x: 0, y: 0 };
  private cameraDistance: number = 300;
  private cameraTheta: number = Math.PI / 4;
  private cameraPhi: number = Math.PI / 4;
  private targetPosition: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private onBrickSelect: ((id: string, multi: boolean) => void) | null = null;
  private onBackgroundClick: (() => void) | null = null;

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0F172A);

    this.camera = new THREE.PerspectiveCamera(
      50,
      1,
      0.1,
      1000
    );

    this.updateCameraPosition();

    this.setupLights();
    this.setupGrid();
  }

  private setupLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1);
    dirLight1.position.set(100, 200, 100);
    dirLight1.castShadow = true;
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
    dirLight2.position.set(-100, 100, -100);
    this.scene.add(dirLight2);
  }

  private setupGrid() {
    const gridHelper = new THREE.GridHelper(
      GRID_SIZE * GRID_UNIT,
      GRID_SIZE,
      0x374151,
      0x374151
    );
    this.scene.add(gridHelper);

    const groundGeometry = new THREE.PlaneGeometry(GRID_SIZE * GRID_UNIT, GRID_SIZE * GRID_UNIT);
    const groundMaterial = new THREE.MeshBasicMaterial({
      color: 0x0F172A,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.name = 'ground';
    this.scene.add(ground);
  }

  private updateCameraPosition() {
    const x = this.cameraDistance * Math.sin(this.cameraPhi) * Math.cos(this.cameraTheta);
    const y = this.cameraDistance * Math.cos(this.cameraPhi);
    const z = this.cameraDistance * Math.sin(this.cameraPhi) * Math.sin(this.cameraTheta);

    this.camera.position.set(
      this.targetPosition.x + x,
      this.targetPosition.y + y,
      this.targetPosition.z + z
    );
    this.camera.lookAt(this.targetPosition);
  }

  public setBrickTypes(types: BrickType[]) {
    this.brickTypes = types;
  }

  public setRenderer(renderer: THREE.WebGLRenderer) {
    this.renderer = renderer;
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  public setOnBrickSelect(callback: (id: string, multi: boolean) => void) {
    this.onBrickSelect = callback;
  }

  public setOnBackgroundClick(callback: () => void) {
    this.onBackgroundClick = callback;
  }

  public setSize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  public addBrick(brick: Brick) {
    const brickType = this.brickTypes.find(t => t.id === brick.type);
    if (!brickType) return;

    const w = brickType.width * GRID_UNIT;
    const h = brickType.height * GRID_UNIT;
    const d = brickType.depth * GRID_UNIT;

    let geometry: THREE.BufferGeometry;

    if (brickType.shape === 'cube') {
      geometry = new THREE.BoxGeometry(w, h, d);
    } else if (brickType.shape === 'cylinder') {
      const radius = w / 2;
      geometry = new THREE.CylinderGeometry(radius, radius, h, 32);
    } else if (brickType.shape === 'slope') {
      geometry = new THREE.BoxGeometry(w, h, d);
      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        if (z > 0 && y > 0) {
          const ratio = (z + d / 2) / d;
          pos.setY(i, y * ratio);
        }
      }
      geometry.computeVertexNormals();
    } else {
      geometry = new THREE.BoxGeometry(w, h, d);
    }

    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(brick.color),
      roughness: 0.6,
      metalness: 0.1,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
      brick.position.x * GRID_UNIT,
      brick.position.y * GRID_UNIT + h / 2,
      brick.position.z * GRID_UNIT
    );
    mesh.name = brick.id;
    mesh.userData.brickId = brick.id;
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    this.scene.add(mesh);
    this.bricks.set(brick.id, mesh);
  }

  public removeBrick(id: string) {
    const mesh = this.bricks.get(id);
    if (mesh) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(m => m.dispose());
      } else {
        mesh.material.dispose();
      }
      this.bricks.delete(id);
    }
    this.selectedIds.delete(id);
  }

  public moveBrick(id: string, position: { x: number; y: number; z: number }) {
    const mesh = this.bricks.get(id);
    const brickType = this.brickTypes.find(t => {
      const brick: Brick | undefined = this.getBrickData(id);
      return brick ? t.id === brick.type : false;
    });
    if (mesh && brickType) {
      const h = brickType.height * GRID_UNIT;
      mesh.position.set(
        position.x * GRID_UNIT,
        position.y * GRID_UNIT + h / 2,
        position.z * GRID_UNIT
      );
    }
  }

  private getBrickData(id: string): Brick | undefined {
    for (const [bid, mesh] of this.bricks) {
      if (bid === id) {
        const type = this.brickTypes.find(t => {
          const geo = mesh.geometry;
          if (geo instanceof THREE.BoxGeometry) {
            return t.shape === 'cube' || t.shape === 'slope';
          }
          if (geo instanceof THREE.CylinderGeometry) {
            return t.shape === 'cylinder';
          }
          return false;
        });
        return {
          id,
          type: type?.id || '2x2',
          color: '#EF4444',
          position: { x: 0, y: 0, z: 0 },
        };
      }
    }
    return undefined;
  }

  public selectBrick(id: string, multi: boolean = false) {
    if (!multi) {
      this.clearSelection();
    }

    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
  }

  public clearSelection() {
    this.selectedIds.clear();
  }

  public changeBrickColor(id: string, color: string) {
    const mesh = this.bricks.get(id);
    if (mesh && mesh.material instanceof THREE.MeshStandardMaterial) {
      mesh.material.color.set(color);
    }
  }

  public handleMouseDown(event: MouseEvent) {
    if (event.button === 2) {
      this.isRotating = true;
      this.previousMousePosition = { x: event.clientX, y: event.clientY };
    }
  }

  public handleMouseMove(event: MouseEvent, canvasRect: DOMRect) {
    if (this.isRotating) {
      const deltaX = event.clientX - this.previousMousePosition.x;
      const deltaY = event.clientY - this.previousMousePosition.y;

      this.cameraTheta -= deltaX * 0.01;
      this.cameraPhi = Math.max(0.1, Math.min(Math.PI - 0.1, this.cameraPhi + deltaY * 0.01));

      this.updateCameraPosition();

      this.previousMousePosition = { x: event.clientX, y: event.clientY };
    }

    this.mouse.x = ((event.clientX - canvasRect.left) / canvasRect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - canvasRect.top) / canvasRect.height) * 2 + 1;
  }

  public handleMouseUp(event: MouseEvent) {
    if (event.button === 2) {
      this.isRotating = false;
    }
  }

  public handleClick(event: MouseEvent, canvasRect: DOMRect) {
    if (event.button !== 0) return;

    this.mouse.x = ((event.clientX - canvasRect.left) / canvasRect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - canvasRect.top) / canvasRect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const brickMeshes = Array.from(this.bricks.values());
    const intersects = this.raycaster.intersectObjects(brickMeshes);

    if (intersects.length > 0) {
      const brickId = intersects[0].object.userData.brickId;
      if (brickId && this.onBrickSelect) {
        this.onBrickSelect(brickId, event.shiftKey);
      }
    } else {
      const ground = this.scene.getObjectByName('ground');
      if (ground) {
        const groundIntersects = this.raycaster.intersectObject(ground);
        if (groundIntersects.length > 0) {
          if (this.onBackgroundClick) {
            this.onBackgroundClick();
          }
        }
      }
    }
  }

  public handleWheel(event: WheelEvent) {
    const delta = event.deltaY > 0 ? 1.1 : 0.9;
    this.cameraDistance = Math.max(50, Math.min(500, this.cameraDistance * delta));
    this.updateCameraPosition();
  }

  public getDropPosition(event: DragEvent, canvasRect: DOMRect): { x: number; y: number; z: number } | null {
    this.mouse.x = ((event.clientX - canvasRect.left) / canvasRect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - canvasRect.top) / canvasRect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersectPoint = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(groundPlane, intersectPoint);

    if (intersectPoint) {
      const gridX = Math.round(intersectPoint.x / GRID_UNIT);
      const gridZ = Math.round(intersectPoint.z / GRID_UNIT);
      const halfGrid = GRID_SIZE / 2;
      const clampedX = Math.max(-halfGrid, Math.min(halfGrid - 1, gridX));
      const clampedZ = Math.max(-halfGrid, Math.min(halfGrid - 1, gridZ));
      return { x: clampedX, y: 0, z: clampedZ };
    }

    return null;
  }

  public generateSTL(bricksData: Brick[]): string {
    let stl = 'solid model\n';

    bricksData.forEach(brick => {
      const brickType = this.brickTypes.find(t => t.id === brick.type);
      if (!brickType) return;

      const w = brickType.width * GRID_UNIT;
      const h = brickType.height * GRID_UNIT;
      const d = brickType.depth * GRID_UNIT;
      const px = brick.position.x * GRID_UNIT;
      const py = brick.position.y * GRID_UNIT;
      const pz = brick.position.z * GRID_UNIT;

      if (brickType.shape === 'cube' || brickType.shape === 'slope') {
        const hw = w / 2;
        const hd = d / 2;

        const vertices = [
          [px - hw, py,      pz - hd],
          [px + hw, py,      pz - hd],
          [px + hw, py,      pz + hd],
          [px - hw, py,      pz + hd],
          [px - hw, py + h,  pz - hd],
          [px + hw, py + h,  pz - hd],
          [px + hw, py + h,  pz + hd],
          [px - hw, py + h,  pz + hd],
        ];

        const faces = [
          [0, 2, 1], [0, 3, 2],
          [4, 5, 6], [4, 6, 7],
          [0, 1, 5], [0, 5, 4],
          [2, 3, 7], [2, 7, 6],
          [1, 2, 6], [1, 6, 5],
          [0, 4, 7], [0, 7, 3],
        ];

        faces.forEach(face => {
          const v0 = vertices[face[0]];
          const v1 = vertices[face[1]];
          const v2 = vertices[face[2]];

          const ax = v1[0] - v0[0];
          const ay = v1[1] - v0[1];
          const az = v1[2] - v0[2];
          const bx = v2[0] - v0[0];
          const by = v2[1] - v0[1];
          const bz = v2[2] - v0[2];

          const nx = ay * bz - az * by;
          const ny = az * bx - ax * bz;
          const nz = ax * by - ay * bx;
          const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;

          stl += `facet normal ${(nx / len).toFixed(6)} ${(ny / len).toFixed(6)} ${(nz / len).toFixed(6)}\n`;
          stl += `  outer loop\n`;
          stl += `    vertex ${v0[0].toFixed(6)} ${v0[1].toFixed(6)} ${v0[2].toFixed(6)}\n`;
          stl += `    vertex ${v1[0].toFixed(6)} ${v1[1].toFixed(6)} ${v1[2].toFixed(6)}\n`;
          stl += `    vertex ${v2[0].toFixed(6)} ${v2[1].toFixed(6)} ${v2[2].toFixed(6)}\n`;
          stl += `  endloop\n`;
          stl += `endfacet\n`;
        });
      }
    });

    stl += 'endsolid model\n';
    return stl;
  }

  public render() {
    if (this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  public dispose() {
    this.bricks.forEach((mesh) => {
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(m => m.dispose());
      } else {
        mesh.material.dispose();
      }
    });
    this.bricks.clear();
  }
}
