import * as THREE from 'three';
import { BuildingFactory, BuildingType } from './BuildingFactory';
import { TreeAndLampFactory } from './TreeAndLampFactory';

export type ElementType = BuildingType | 'tree' | 'lamp';

export interface SceneStats {
  buildingCount: number;
  floorCount: number;
  treeCount: number;
  lampCount: number;
}

export class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private canvas: HTMLCanvasElement;

  private ground!: THREE.Mesh;
  private gridHelper!: THREE.GridHelper;

  private sunLight!: THREE.DirectionalLight;
  private moonLight!: THREE.DirectionalLight;
  private ambientLight!: THREE.AmbientLight;

  private previewMesh: THREE.Mesh | null = null;
  private previewMaterial: THREE.MeshBasicMaterial | null = null;
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private mouse: THREE.Vector2 = new THREE.Vector2();

  private placedObjects: Map<string, THREE.Object3D> = new Map();
  private occupiedPositions: Set<string> = new Set();
  private windowLights: THREE.Mesh[] = [];
  private lampLights: { mesh: THREE.Mesh; light: THREE.PointLight }[] = [];

  private isNightMode: boolean = false;

  private cameraTarget: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private cameraDistance: number = 80;
  private cameraTheta: number = Math.PI / 4;
  private cameraPhi: number = Math.PI / 3;
  private targetTheta: number = Math.PI / 4;
  private targetPhi: number = Math.PI / 3;
  private targetDistance: number = 80;
  private targetLookAt: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  private isRightDragging: boolean = false;
  private isLeftDragging: boolean = false;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;

  private clock: THREE.Clock = new THREE.Clock();
  private animatingObjects: { mesh: THREE.Object3D; startTime: number; startScale: number }[] = [];

  private stats: SceneStats = {
    buildingCount: 0,
    floorCount: 0,
    treeCount: 0,
    lampCount: 0
  };

  private onStatsChange?: (stats: SceneStats) => void;

  private readonly GRID_SIZE = 100;
  private readonly CELL_SIZE = 2;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1E1E2E);
    this.scene.fog = new THREE.Fog(0x1E1E2E, 100, 250);

    this.camera = new THREE.PerspectiveCamera(
      60,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      1000
    );

    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.initGround();
    this.initLights();
    this.initCamera();
    this.setupEventListeners();

    window.addEventListener('resize', this.onResize.bind(this));
  }

  private initGround(): void {
    const groundGeometry = new THREE.PlaneGeometry(this.GRID_SIZE, this.GRID_SIZE);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.9,
      metalness: 0.1
    });
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.ground.name = 'ground';
    this.scene.add(this.ground);

    this.gridHelper = new THREE.GridHelper(
      this.GRID_SIZE,
      this.GRID_SIZE / this.CELL_SIZE,
      0x00D4AA,
      0x444444
    );
    (this.gridHelper.material as THREE.Material).opacity = 0.3;
    (this.gridHelper.material as THREE.Material).transparent = true;
    this.scene.add(this.gridHelper);
  }

  private initLights(): void {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xfff5e6, 1.0);
    this.sunLight.position.set(50, 80, 30);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.left = -60;
    this.sunLight.shadow.camera.right = 60;
    this.sunLight.shadow.camera.top = 60;
    this.sunLight.shadow.camera.bottom = -60;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 200;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    this.moonLight = new THREE.DirectionalLight(0x4466aa, 0.0);
    this.moonLight.position.set(-50, 80, -30);
    this.scene.add(this.moonLight);
  }

  private initCamera(): void {
    this.updateCameraPosition();
  }

  private updateCameraPosition(): void {
    const x = this.cameraTarget.x + this.cameraDistance * Math.sin(this.cameraPhi) * Math.cos(this.cameraTheta);
    const y = this.cameraTarget.y + this.cameraDistance * Math.cos(this.cameraPhi);
    const z = this.cameraTarget.z + this.cameraDistance * Math.sin(this.cameraPhi) * Math.sin(this.cameraTheta);

    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.cameraTarget);
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 2) {
        this.isRightDragging = true;
      } else if (e.button === 0) {
        this.isLeftDragging = true;
      }
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    this.canvas.addEventListener('mouseup', (e) => {
      if (e.button === 2) this.isRightDragging = false;
      if (e.button === 0) this.isLeftDragging = false;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.isRightDragging = false;
      this.isLeftDragging = false;
      this.hidePreview();
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const deltaX = e.clientX - this.lastMouseX;
      const deltaY = e.clientY - this.lastMouseY;

      if (this.isRightDragging) {
        this.targetTheta -= deltaX * 0.005;
        this.targetPhi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, this.targetPhi - deltaY * 0.005));
      } else if (this.isLeftDragging) {
        const panSpeed = 0.15 * (this.cameraDistance / 100);
        const forward = new THREE.Vector3();
        this.camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();

        const right = new THREE.Vector3();
        right.crossVectors(forward, new THREE.Vector3(0, 1, 0));

        this.targetLookAt.add(right.multiplyScalar(-deltaX * panSpeed));
        this.targetLookAt.add(forward.multiplyScalar(-deltaY * panSpeed));
      }

      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomSpeed = 0.001;
      this.targetDistance = Math.max(20, Math.min(200, this.targetDistance + e.deltaY * zoomSpeed * this.targetDistance));
    }, { passive: false });
  }

  private onResize(): void {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public setStatsCallback(callback: (stats: SceneStats) => void): void {
    this.onStatsChange = callback;
    this.emitStats();
  }

  private emitStats(): void {
    if (this.onStatsChange) {
      this.onStatsChange({ ...this.stats });
    }
  }

  public getGroundPosition(clientX: number, clientY: number): THREE.Vector3 | null {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.ground);

    if (intersects.length > 0) {
      return intersects[0].point;
    }
    return null;
  }

  public snapToGrid(position: THREE.Vector3): THREE.Vector3 {
    const halfGrid = this.GRID_SIZE / 2;
    const x = Math.round(position.x / this.CELL_SIZE) * this.CELL_SIZE;
    const z = Math.round(position.z / this.CELL_SIZE) * this.CELL_SIZE;
    return new THREE.Vector3(
      Math.max(-halfGrid + this.CELL_SIZE, Math.min(halfGrid - this.CELL_SIZE, x)),
      0,
      Math.max(-halfGrid + this.CELL_SIZE, Math.min(halfGrid - this.CELL_SIZE, z))
    );
  }

  public getPositionKey(position: THREE.Vector3): string {
    return `${position.x},${position.z}`;
  }

  public isPositionOccupied(position: THREE.Vector3): boolean {
    return this.occupiedPositions.has(this.getPositionKey(position));
  }

  public showPreview(elementType: ElementType, position: THREE.Vector3): void {
    this.hidePreview();

    const snappedPos = this.snapToGrid(position);
    const occupied = this.isPositionOccupied(snappedPos);

    let color: number;
    switch (elementType) {
      case 'residential': color = 0xE8D5A8; break;
      case 'office': color = 0x5B8DB8; break;
      case 'commercial': color = 0xC25656; break;
      case 'tree': color = 0x5A8A5A; break;
      case 'lamp': color = 0x888888; break;
    }

    this.previewMaterial = new THREE.MeshBasicMaterial({
      color: occupied ? 0xff0000 : color,
      transparent: true,
      opacity: 0.5
    });

    let height = 2;
    if (elementType === 'residential') height = 6;
    else if (elementType === 'office') height = 20;
    else if (elementType === 'commercial') height = 4;
    else if (elementType === 'tree') height = 3;
    else if (elementType === 'lamp') height = 4;

    const geometry = new THREE.BoxGeometry(this.CELL_SIZE * 0.9, height, this.CELL_SIZE * 0.9);
    this.previewMesh = new THREE.Mesh(geometry, this.previewMaterial);
    this.previewMesh.position.copy(snappedPos);
    this.previewMesh.position.y = height / 2;
    this.scene.add(this.previewMesh);
  }

  public hidePreview(): void {
    if (this.previewMesh) {
      this.scene.remove(this.previewMesh);
      this.previewMesh.geometry.dispose();
      if (this.previewMaterial) this.previewMaterial.dispose();
      this.previewMesh = null;
      this.previewMaterial = null;
    }
  }

  public placeElement(elementType: ElementType, position: THREE.Vector3): boolean {
    const snappedPos = this.snapToGrid(position);
    const key = this.getPositionKey(snappedPos);

    if (this.occupiedPositions.has(key)) {
      return false;
    }

    let obj: THREE.Object3D;
    let floorCount = 0;

    if (elementType === 'tree' || elementType === 'lamp') {
      obj = TreeAndLampFactory.create(elementType, this.isNightMode);
      if (elementType === 'tree') {
        this.stats.treeCount++;
      } else {
        this.stats.lampCount++;
        const lampLight = obj.getObjectByName('lampLight') as THREE.PointLight;
        const lampGlow = obj.getObjectByName('lampGlow') as THREE.Mesh;
        if (lampLight && lampGlow) {
          this.lampLights.push({ mesh: lampGlow, light: lampLight });
        }
      }
    } else {
      const buildingData = BuildingFactory.create(elementType, this.isNightMode);
      obj = buildingData.mesh;
      floorCount = buildingData.floorCount;
      this.stats.buildingCount++;
      this.stats.floorCount += floorCount;

      if (buildingData.windowLights) {
        this.windowLights.push(...buildingData.windowLights);
      }
    }

    obj.position.copy(snappedPos);
    obj.userData = { type: elementType, positionKey: key, floorCount };
    obj.scale.set(0.01, 0.01, 0.01);

    this.scene.add(obj);
    this.placedObjects.set(key, obj);
    this.occupiedPositions.add(key);

    this.animatingObjects.push({
      mesh: obj,
      startTime: this.clock.getElapsedTime(),
      startScale: 0.01
    });

    this.emitStats();
    return true;
  }

  public removeElement(position: THREE.Vector3): boolean {
    const snappedPos = this.snapToGrid(position);
    const key = this.getPositionKey(snappedPos);

    const obj = this.placedObjects.get(key);
    if (!obj) return false;

    const userData = obj.userData;
    if (userData.type === 'tree') this.stats.treeCount--;
    else if (userData.type === 'lamp') this.stats.lampCount--;
    else {
      this.stats.buildingCount--;
      this.stats.floorCount -= userData.floorCount || 0;
    }

    this.scene.remove(obj);
    this.placedObjects.delete(key);
    this.occupiedPositions.delete(key);

    this.emitStats();
    return true;
  }

  public toggleDayNight(): boolean {
    this.isNightMode = !this.isNightMode;

    if (this.isNightMode) {
      this.scene.background = new THREE.Color(0x0a0a18);
      this.scene.fog = new THREE.Fog(0x0a0a18, 80, 200);
      this.ambientLight.intensity = 0.15;
      this.ambientLight.color.setHex(0x334466);
      this.sunLight.intensity = 0.0;
      this.moonLight.intensity = 0.4;
      (this.gridHelper.material as THREE.Material).opacity = 0.15;
      (this.gridHelper.material as THREE.Material).color.setHex(0x666666);
    } else {
      this.scene.background = new THREE.Color(0x1E1E2E);
      this.scene.fog = new THREE.Fog(0x1E1E2E, 100, 250);
      this.ambientLight.intensity = 0.5;
      this.ambientLight.color.setHex(0xffffff);
      this.sunLight.intensity = 1.0;
      this.moonLight.intensity = 0.0;
      (this.gridHelper.material as THREE.Material).opacity = 0.3;
      (this.gridHelper.material as THREE.Material).color.setHex(0x444444);
    }

    for (const windowLight of this.windowLights) {
      const mat = windowLight.material as THREE.MeshBasicMaterial;
      mat.color.setHex(this.isNightMode ? 0xffcc66 : 0x333333);
    }

    for (const { mesh, light } of this.lampLights) {
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.color.setHex(this.isNightMode ? 0xffee88 : 0xaaaaaa);
      light.intensity = this.isNightMode ? 2.0 : 0.0;
    }

    return this.isNightMode;
  }

  public isNight(): boolean {
    return this.isNightMode;
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public render(): void {
    const elapsed = this.clock.getElapsedTime();

    const damping = 0.08;
    this.cameraTheta += (this.targetTheta - this.cameraTheta) * damping;
    this.cameraPhi += (this.targetPhi - this.cameraPhi) * damping;
    this.cameraDistance += (this.targetDistance - this.cameraDistance) * damping;
    this.cameraTarget.lerp(this.targetLookAt, damping);
    this.updateCameraPosition();

    for (let i = this.animatingObjects.length - 1; i >= 0; i--) {
      const anim = this.animatingObjects[i];
      const t = (elapsed - anim.startTime) / 0.3;

      if (t >= 1) {
        anim.mesh.scale.set(1, 1, 1);
        this.animatingObjects.splice(i, 1);
      } else {
        const bounce = t < 0.6
          ? t / 0.6
          : 1 + Math.sin((t - 0.6) / 0.4 * Math.PI) * 0.2;
        anim.mesh.scale.setScalar(bounce);
      }
    }

    this.renderer.render(this.scene, this.camera);
  }
}
