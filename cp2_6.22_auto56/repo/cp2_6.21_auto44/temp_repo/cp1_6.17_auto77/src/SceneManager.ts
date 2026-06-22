import * as THREE from 'three';
import { BlockGrid, BlockType, BLOCK_COLORS, GRID_SIZE, GRID_HEIGHT } from './BlockGrid';
import { Physics } from './Physics';
import { EffectManager, playBreakSound } from './effects';

export type CameraMode = 'isometric' | 'free';

export interface SceneStats {
  totalBlocks: number;
  placedCount: number;
  destroyedCount: number;
}

export interface SceneManagerOptions {
  container: HTMLElement;
  onStatsChange?: (stats: SceneStats) => void;
  onCameraModeChange?: (mode: CameraMode) => void;
}

const GRID_OFFSET = -GRID_SIZE / 2;

export class SceneManager {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  private blockGrid: BlockGrid;
  private physics: Physics;
  private effectManager: EffectManager;

  private blockMeshes: Map<string, THREE.Mesh> = new Map();
  private fallingMeshes: Map<string, THREE.Mesh> = new Map();
  private blockGeometry: THREE.BoxGeometry;

  private groundMesh!: THREE.Mesh;
  private gridHelper!: THREE.GridHelper;

  private selectedMaterial: BlockType = BlockType.Dirt;
  private cameraMode: CameraMode = 'isometric';

  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private hasDragged: boolean = false;
  private cameraAngleX: number = Math.PI / 4;
  private cameraAngleY: number = Math.PI / 6;
  private cameraDistance: number = 20;
  private targetCameraAngleX: number = Math.PI / 4;
  private targetCameraAngleY: number = Math.PI / 6;
  private targetCameraDistance: number = 20;
  private isTransitioning: boolean = false;
  private transitionProgress: number = 0;
  private transitionDuration: number = 0.4;
  private transitionStartAngleX: number = 0;
  private transitionStartAngleY: number = 0;
  private transitionStartDistance: number = 0;

  private isoAngleX: number = Math.PI / 4;
  private isoAngleY: number = Math.atan(1 / Math.sqrt(2));
  private isoDistance: number = 22;

  private hoverIndicator: THREE.Mesh | null = null;

  private stats: SceneStats = {
    totalBlocks: 0,
    placedCount: 0,
    destroyedCount: 0,
  };

  private onStatsChange?: (stats: SceneStats) => void;
  private onCameraModeChange?: (mode: CameraMode) => void;

  private animationFrameId: number = 0;
  private lastTime: number = 0;
  private isRunning: boolean = false;

  private clock: THREE.Clock;

  constructor(options: SceneManagerOptions) {
    this.container = options.container;
    this.onStatsChange = options.onStatsChange;
    this.onCameraModeChange = options.onCameraModeChange;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);

    this.camera = new THREE.PerspectiveCamera(
      55,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.clock = new THREE.Clock();

    this.blockGrid = new BlockGrid();
    this.physics = new Physics(this.blockGrid);
    this.effectManager = new EffectManager(this.scene);

    this.blockGeometry = new THREE.BoxGeometry(1, 1, 1);

    this.setupLights();
    this.setupGround();
    this.setupHoverIndicator();
    this.setupCamera();
    this.setupEventListeners();
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
    directionalLight.position.set(15, 25, 15);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 80;
    directionalLight.shadow.camera.left = -25;
    directionalLight.shadow.camera.right = 25;
    directionalLight.shadow.camera.top = 25;
    directionalLight.shadow.camera.bottom = -25;
    directionalLight.shadow.bias = -0.0005;
    this.scene.add(directionalLight);

    const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x567d46, 0.25);
    this.scene.add(hemisphereLight);
  }

  private setupGround(): void {
    const groundGeometry = new THREE.PlaneGeometry(GRID_SIZE * 2.5, GRID_SIZE * 2.5);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x567d46 });
    this.groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    this.groundMesh.rotation.x = -Math.PI / 2;
    this.groundMesh.position.y = -0.01;
    this.groundMesh.receiveShadow = true;
    this.scene.add(this.groundMesh);

    this.gridHelper = new THREE.GridHelper(GRID_SIZE * 2, GRID_SIZE * 2, 0xcccccc, 0xcccccc);
    (this.gridHelper.material as THREE.Material).opacity = 0.3;
    (this.gridHelper.material as THREE.Material).transparent = true;
    this.gridHelper.position.y = 0.001;
    this.scene.add(this.gridHelper);
  }

  private setupHoverIndicator(): void {
    const geometry = new THREE.BoxGeometry(1.02, 1.02, 1.02);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.25,
    });
    this.hoverIndicator = new THREE.Mesh(geometry, material);
    this.hoverIndicator.visible = false;
    this.scene.add(this.hoverIndicator);

    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    const wireframe = new THREE.LineSegments(edges, lineMaterial);
    this.hoverIndicator.add(wireframe);
  }

  private setupCamera(): void {
    this.cameraAngleX = this.isoAngleX;
    this.cameraAngleY = this.isoAngleY;
    this.cameraDistance = this.isoDistance;
    this.targetCameraAngleX = this.isoAngleX;
    this.targetCameraAngleY = this.isoAngleY;
    this.targetCameraDistance = this.isoDistance;
    this.updateCameraPosition();
  }

  private updateCameraPosition(): void {
    const x = this.cameraDistance * Math.cos(this.cameraAngleY) * Math.sin(this.cameraAngleX);
    const y = this.cameraDistance * Math.sin(this.cameraAngleY);
    const z = this.cameraDistance * Math.cos(this.cameraAngleY) * Math.cos(this.cameraAngleX);

    this.camera.position.set(x, y + 5, z);
    this.camera.lookAt(0, 3, 0);
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.onWindowResize);
    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove);
    this.renderer.domElement.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    this.renderer.domElement.addEventListener('wheel', this.onWheel, { passive: false });
    this.renderer.domElement.addEventListener('contextmenu', this.onContextMenu);
    window.addEventListener('keydown', this.onKeyDown);
  }

  private onWindowResize = (): void => {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  };

  private onMouseMove = (event: MouseEvent): void => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    if (this.isDragging && this.cameraMode === 'free') {
      const deltaX = event.clientX - this.dragStartX;
      const deltaY = event.clientY - this.dragStartY;

      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
        this.hasDragged = true;
      }

      this.targetCameraAngleX -= deltaX * 0.008;
      this.targetCameraAngleY += deltaY * 0.008;
      this.targetCameraAngleY = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.targetCameraAngleY));

      this.dragStartX = event.clientX;
      this.dragStartY = event.clientY;
    }
  };

  private onMouseDown = (event: MouseEvent): void => {
    if (event.button === 0) {
      if (this.cameraMode === 'free') {
        this.isDragging = true;
        this.hasDragged = false;
        this.dragStartX = event.clientX;
        this.dragStartY = event.clientY;
        return;
      }

      if (event.ctrlKey || event.metaKey) {
        this.destroyBlock();
      } else {
        this.placeBlock();
      }
    } else if (event.button === 2) {
      event.preventDefault();
      this.destroyBlock();
    }
  };

  private onMouseUp = (event: MouseEvent): void => {
    if (event.button === 0 && this.isDragging && this.cameraMode === 'free') {
      if (!this.hasDragged) {
        if (event.ctrlKey || event.metaKey) {
          this.destroyBlock();
        } else {
          this.placeBlock();
        }
      }
      this.isDragging = false;
      this.hasDragged = false;
    }
  };

  private onWheel = (event: WheelEvent): void => {
    event.preventDefault();
    if (this.cameraMode === 'free') {
      this.targetCameraDistance += event.deltaY * 0.02;
      this.targetCameraDistance = Math.max(5, Math.min(30, this.targetCameraDistance));
    }
  };

  private onContextMenu = (event: Event): void => {
    event.preventDefault();
  };

  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.code === 'Space') {
      event.preventDefault();
      this.toggleCameraMode();
    }
  };

  toggleCameraMode(): void {
    this.transitionStartAngleX = this.cameraAngleX;
    this.transitionStartAngleY = this.cameraAngleY;
    this.transitionStartDistance = this.cameraDistance;

    if (this.cameraMode === 'isometric') {
      this.cameraMode = 'free';
      this.targetCameraAngleX = this.cameraAngleX;
      this.targetCameraAngleY = this.cameraAngleY;
      this.targetCameraDistance = this.cameraDistance;
    } else {
      this.cameraMode = 'isometric';
      this.targetCameraAngleX = this.isoAngleX;
      this.targetCameraAngleY = this.isoAngleY;
      this.targetCameraDistance = this.isoDistance;
    }

    this.isTransitioning = true;
    this.transitionProgress = 0;

    if (this.onCameraModeChange) {
      this.onCameraModeChange(this.cameraMode);
    }
  }

  getCameraMode(): CameraMode {
    return this.cameraMode;
  }

  setSelectedMaterial(type: BlockType): void {
    this.selectedMaterial = type;
  }

  getSelectedMaterial(): BlockType {
    return this.selectedMaterial;
  }

  private getBlockKey(x: number, y: number, z: number): string {
    return `${x},${y},${z}`;
  }

  private gridToWorld(x: number, y: number, z: number): THREE.Vector3 {
    return new THREE.Vector3(
      x + GRID_OFFSET + 0.5,
      y + 0.5,
      z + GRID_OFFSET + 0.5
    );
  }

  private worldToGrid(pos: THREE.Vector3): { x: number; y: number; z: number } {
    return {
      x: Math.floor(pos.x - GRID_OFFSET),
      y: Math.floor(pos.y),
      z: Math.floor(pos.z - GRID_OFFSET),
    };
  }

  private raycast(): {
    block: { x: number; y: number; z: number; faceNormal: THREE.Vector3 } | null;
    hitGround: boolean;
    groundPoint?: THREE.Vector3;
  } {
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const staticMeshes = Array.from(this.blockMeshes.values());
    const fallingMeshesArr = Array.from(this.fallingMeshes.values());
    const allMeshes = [...staticMeshes, ...fallingMeshesArr, this.groundMesh];

    const intersects = this.raycaster.intersectObjects(allMeshes, false);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const hitGround = hit.object === this.groundMesh;

      if (hitGround && hit.point) {
        return { block: null, hitGround: true, groundPoint: hit.point };
      }

      if (hit.object instanceof THREE.Mesh && hit.face) {
        const worldPos = new THREE.Vector3();
        hit.object.getWorldPosition(worldPos);

        const gridPos = this.worldToGrid(worldPos);
        const faceNormal = hit.face.normal.clone();
        faceNormal.transformDirection(hit.object.matrixWorld);

        return {
          block: {
            x: gridPos.x,
            y: gridPos.y,
            z: gridPos.z,
            faceNormal,
          },
          hitGround: false,
        };
      }
    }

    return { block: null, hitGround: false };
  }

  private updateHoverIndicator(): void {
    if (!this.hoverIndicator) return;

    const result = this.raycast();

    if (result.block) {
      const worldPos = this.gridToWorld(result.block.x, result.block.y, result.block.z);
      this.hoverIndicator.position.copy(worldPos);
      this.hoverIndicator.visible = true;

      const mat = this.hoverIndicator.material as THREE.MeshBasicMaterial;
      mat.color.setHex(BLOCK_COLORS[this.selectedMaterial]);
    } else if (result.hitGround && result.groundPoint) {
      const gridPos = this.worldToGrid(result.groundPoint);
      if (
        gridPos.x >= 0 &&
        gridPos.x < GRID_SIZE &&
        gridPos.z >= 0 &&
        gridPos.z < GRID_SIZE &&
        !this.blockGrid.hasBlock(gridPos.x, 0, gridPos.z)
      ) {
        const worldPos = this.gridToWorld(gridPos.x, 0, gridPos.z);
        this.hoverIndicator.position.copy(worldPos);
        this.hoverIndicator.visible = true;
        const mat = this.hoverIndicator.material as THREE.MeshBasicMaterial;
        mat.color.setHex(BLOCK_COLORS[this.selectedMaterial]);
      } else {
        this.hoverIndicator.visible = false;
      }
    } else {
      this.hoverIndicator.visible = false;
    }
  }

  placeBlock(): void {
    const result = this.raycast();
    let placeX: number, placeY: number, placeZ: number;

    if (result.block) {
      const normal = result.block.faceNormal;
      placeX = result.block.x + Math.round(normal.x);
      placeY = result.block.y + Math.round(normal.y);
      placeZ = result.block.z + Math.round(normal.z);
    } else if (result.hitGround && result.groundPoint) {
      const gridPos = this.worldToGrid(result.groundPoint);
      placeX = gridPos.x;
      placeY = 0;
      placeZ = gridPos.z;
    } else {
      return;
    }

    if (
      placeX < 0 ||
      placeX >= GRID_SIZE ||
      placeY < 0 ||
      placeY >= GRID_HEIGHT ||
      placeZ < 0 ||
      placeZ >= GRID_SIZE
    ) {
      return;
    }

    if (this.blockGrid.hasBlock(placeX, placeY, placeZ)) {
      return;
    }

    const success = this.blockGrid.set(placeX, placeY, placeZ, this.selectedMaterial);
    if (!success) return;

    this.createBlockMesh(placeX, placeY, placeZ, this.selectedMaterial, true);
    this.physics.notifyBlockPlaced(placeX, placeY, placeZ);

    this.stats.totalBlocks = this.blockGrid.getCount();
    this.stats.placedCount++;
    this.notifyStatsChange();

    const worldPos = this.gridToWorld(placeX, placeY, placeZ);
    this.effectManager.spawnPlaceParticles(worldPos);
  }

  destroyBlock(): void {
    const result = this.raycast();

    if (!result.block) return;

    const { x, y, z } = result.block;
    const type = this.blockGrid.get(x, y, z);

    if (type === BlockType.Empty) return;

    this.blockGrid.remove(x, y, z);
    this.removeBlockMesh(x, y, z);
    this.physics.notifyBlockRemoved(x, y, z);

    this.stats.totalBlocks = this.blockGrid.getCount();
    this.stats.destroyedCount++;
    this.notifyStatsChange();

    const worldPos = this.gridToWorld(x, y, z);
    this.effectManager.spawnBreakParticles(worldPos, BLOCK_COLORS[type]);
    playBreakSound();
  }

  private createBlockMesh(
    x: number,
    y: number,
    z: number,
    type: BlockType,
    animate: boolean = false
  ): void {
    const color = BLOCK_COLORS[type];
    const material = new THREE.MeshLambertMaterial({ color });

    if (type === BlockType.Glow) {
      (material as THREE.MeshLambertMaterial).emissive = new THREE.Color(0xffd700);
      (material as THREE.MeshLambertMaterial).emissiveIntensity = 0.5;
    }

    const mesh = new THREE.Mesh(this.blockGeometry.clone(), material);
    const worldPos = this.gridToWorld(x, y, z);

    if (animate) {
      mesh.position.set(worldPos.x, worldPos.y + 2, worldPos.z);
      mesh.scale.set(0.1, 0.1, 0.1);
      this.animatePlacement(mesh, worldPos);
    } else {
      mesh.position.copy(worldPos);
    }

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const key = this.getBlockKey(x, y, z);
    this.blockMeshes.set(key, mesh);
    this.scene.add(mesh);
  }

  private animatePlacement(mesh: THREE.Mesh, targetPos: THREE.Vector3): void {
    const duration = 0.15;
    const startTime = this.clock.getElapsedTime();
    const startY = targetPos.y + 2;

    const animate = () => {
      const elapsed = this.clock.getElapsedTime() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);

      mesh.position.y = startY - (startY - targetPos.y) * ease;
      mesh.scale.setScalar(0.1 + 0.9 * ease);

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        mesh.position.copy(targetPos);
        mesh.scale.set(1, 1, 1);
      }
    };

    requestAnimationFrame(animate);
  }

  private removeBlockMesh(x: number, y: number, z: number): void {
    const key = this.getBlockKey(x, y, z);
    const mesh = this.blockMeshes.get(key);
    if (mesh) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      this.blockMeshes.delete(key);
      return;
    }

    for (const [id, fallMesh] of this.fallingMeshes) {
      const fb = this.physics.getFallingBlockById(id);
      if (fb && fb.x === x && fb.z === z && Math.floor(fb.y) === y) {
        this.scene.remove(fallMesh);
        fallMesh.geometry.dispose();
        (fallMesh.material as THREE.Material).dispose();
        this.fallingMeshes.delete(id);
        return;
      }
    }
  }

  private notifyStatsChange(): void {
    if (this.onStatsChange) {
      this.onStatsChange({ ...this.stats });
    }
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.clock.start();
    this.animate();
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private animate = (): void => {
    if (!this.isRunning) return;

    this.animationFrameId = requestAnimationFrame(this.animate);

    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    this.update(deltaTime);
    this.renderer.render(this.scene, this.camera);
  };

  private update(deltaTime: number): void {
    this.updateCamera(deltaTime);
    this.updatePhysics(deltaTime);
    this.effectManager.update(deltaTime);
    this.updateHoverIndicator();
  }

  private updateCamera(deltaTime: number): void {
    const damping = 0.1;

    if (this.isTransitioning) {
      this.transitionProgress += deltaTime / this.transitionDuration;
      const t = Math.min(this.transitionProgress, 1);

      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      this.cameraAngleX =
        this.transitionStartAngleX +
        (this.targetCameraAngleX - this.transitionStartAngleX) * ease;
      this.cameraAngleY =
        this.transitionStartAngleY +
        (this.targetCameraAngleY - this.transitionStartAngleY) * ease;
      this.cameraDistance =
        this.transitionStartDistance +
        (this.targetCameraDistance - this.transitionStartDistance) * ease;

      if (t >= 1) {
        this.isTransitioning = false;
        this.cameraAngleX = this.targetCameraAngleX;
        this.cameraAngleY = this.targetCameraAngleY;
        this.cameraDistance = this.targetCameraDistance;
      }
    } else if (this.cameraMode === 'free') {
      this.cameraAngleX += (this.targetCameraAngleX - this.cameraAngleX) * damping;
      this.cameraAngleY += (this.targetCameraAngleY - this.cameraAngleY) * damping;
      this.cameraDistance += (this.targetCameraDistance - this.cameraDistance) * damping;
    }

    this.updateCameraPosition();
  }

  private updatePhysics(deltaTime: number): void {
    const { newFallingBlocks, movedBlocks, landedBlocks } = this.physics.update(deltaTime);

    for (const info of newFallingBlocks) {
      const key = this.getBlockKey(info.x, info.y, info.z);
      const mesh = this.blockMeshes.get(key);
      if (mesh) {
        this.blockMeshes.delete(key);
        this.fallingMeshes.set(info.id, mesh);
      }
    }

    for (const block of movedBlocks) {
      const mesh = this.fallingMeshes.get(block.id);
      if (mesh) {
        const worldPos = this.gridToWorld(block.x, 0, block.z);
        mesh.position.x = worldPos.x;
        mesh.position.y = block.y + 0.5;
        mesh.position.z = worldPos.z;
      }
    }

    for (const landed of landedBlocks) {
      const mesh = this.fallingMeshes.get(landed.id);
      if (mesh) {
        this.fallingMeshes.delete(landed.id);
        const worldPos = this.gridToWorld(landed.x, landed.y, landed.z);
        mesh.position.copy(worldPos);
        mesh.scale.set(1, 1, 1);
        const newKey = this.getBlockKey(landed.x, landed.y, landed.z);
        this.blockMeshes.set(newKey, mesh);
      }

      const worldPos = this.gridToWorld(landed.x, landed.y, landed.z);
      this.effectManager.spawnDustParticles(worldPos);

      this.stats.totalBlocks = this.blockGrid.getCount();
      this.notifyStatsChange();
    }
  }

  getStats(): SceneStats {
    return { ...this.stats };
  }

  dispose(): void {
    this.stop();

    window.removeEventListener('resize', this.onWindowResize);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('keydown', this.onKeyDown);
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.removeEventListener('mousemove', this.onMouseMove);
      this.renderer.domElement.removeEventListener('mousedown', this.onMouseDown);
      this.renderer.domElement.removeEventListener('wheel', this.onWheel);
      this.renderer.domElement.removeEventListener('contextmenu', this.onContextMenu);
    }

    this.effectManager.clear();

    for (const mesh of this.blockMeshes.values()) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
    this.blockMeshes.clear();

    for (const mesh of this.fallingMeshes.values()) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
    this.fallingMeshes.clear();

    this.blockGeometry.dispose();
    this.gridHelper.geometry.dispose();
    (this.gridHelper.material as THREE.Material).dispose();
    this.groundMesh.geometry.dispose();
    (this.groundMesh.material as THREE.Material).dispose();

    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
