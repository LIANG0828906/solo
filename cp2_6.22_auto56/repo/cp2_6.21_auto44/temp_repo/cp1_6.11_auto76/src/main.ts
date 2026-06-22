import * as THREE from 'three';
import { BuildingManager, GRID_SIZE, MAX_BUILDINGS } from './BuildingManager';
import { InteractionController, InteractionMode } from './InteractionController';

class App {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private buildingManager: BuildingManager;
  private interactionController: InteractionController;
  private raycaster = new THREE.Raycaster();

  private cameraDistance = 12;
  private cameraTheta = Math.PI / 4;
  private cameraPhi = Math.atan2(6, Math.sqrt(8 * 8 + 8 * 8));
  private cameraTarget = new THREE.Vector3(0, 0, 0);
  private minDistance = 3;
  private maxDistance = 20;

  private autoRotate = true;
  private autoRotateSpeed = 0.01;

  private isBirdView = false;
  private normalCameraState = {
    distance: 12,
    theta: Math.PI / 4,
    phi: Math.atan2(6, Math.sqrt(8 * 8 + 8 * 8)),
    target: new THREE.Vector3(0, 0, 0)
  };

  private cameraAnim: {
    active: boolean;
    startTime: number;
    duration: number;
    startDistance: number;
    endDistance: number;
    startTheta: number;
    endTheta: number;
    startPhi: number;
    endPhi: number;
    startTarget: THREE.Vector3;
    endTarget: THREE.Vector3;
  } = {
    active: false,
    startTime: 0,
    duration: 300,
    startDistance: 0,
    endDistance: 0,
    startTheta: 0,
    endTheta: 0,
    startPhi: 0,
    endPhi: 0,
    startTarget: new THREE.Vector3(),
    endTarget: new THREE.Vector3()
  };

  private mode: InteractionMode = 'browse';
  private draggingBuildingId: number | null = null;

  private modeTextEl: HTMLElement | null = null;
  private counterEl: HTMLElement | null = null;
  private counterTextEl: HTMLElement | null = null;
  private counterProgressEl: SVGElement | null = null;

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x1a1a3e, 0.035);

    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    const container = document.getElementById('app');
    if (!container) throw new Error('#app not found');
    container.appendChild(this.renderer.domElement);

    this.buildingManager = new BuildingManager(this.scene);

    this.interactionController = new InteractionController(
      this.renderer.domElement,
      this.camera,
      {
        onPlaceBuilding: this.handlePlaceBuilding,
        onSelectBuilding: this.handleSelectBuilding,
        onStartDrag: this.handleStartDrag,
        onUpdateDrag: this.handleUpdateDrag,
        onFinishDrag: this.handleFinishDrag,
        onPanStart: this.handlePanStart,
        onPan: this.handlePan,
        onRotate: this.handleRotate,
        onZoom: this.handleZoom,
        onResetView: this.handleResetView,
        onToggleBirdView: this.handleToggleBirdView,
        onToggleMode: this.handleToggleMode,
        onDeleteSelected: this.handleDeleteSelected,
        onChangeColor: this.handleChangeColor,
        pickBuildingAtScreen: this.handlePickBuildingAtScreen,
        raycastGround: this.handleRaycastGround
      }
    );

    this.initUI();
    this.setupScene();
    this.setupLights();
    this.setupGround();
    this.spawnPresetBuildings();
    this.updateCameraPosition();
    this.bindEvents();
    this.updateCounter();
    this.updateModeText();

    this.buildingManager.on('count-changed', () => this.updateCounter());
    this.buildingManager.on('selection-changed', () => this.updateModeText());

    this.animate();
  }

  private initUI(): void {
    this.modeTextEl = document.getElementById('mode-text');
    this.counterEl = document.getElementById('counter');
    this.counterTextEl = document.getElementById('counter-text');
    this.counterProgressEl = document.querySelector('#counter .progress') as SVGElement | null;
  }

  private setupScene(): void {
    this.scene.background = null;
  }

  private setupLights(): void {
    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    this.scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0x8899ff, 0x2a1a3a, 0.5);
    this.scene.add(hemi);

    const dir = new THREE.DirectionalLight(0xffffff, 1.0);
    dir.position.set(10, 15, 8);
    dir.castShadow = true;
    dir.shadow.mapSize.width = 2048;
    dir.shadow.mapSize.height = 2048;
    dir.shadow.camera.near = 0.5;
    dir.shadow.camera.far = 50;
    dir.shadow.camera.left = -15;
    dir.shadow.camera.right = 15;
    dir.shadow.camera.top = 15;
    dir.shadow.camera.bottom = -15;
    dir.shadow.bias = -0.0005;
    this.scene.add(dir);

    const fill = new THREE.DirectionalLight(0x7788ff, 0.35);
    fill.position.set(-8, 5, -6);
    this.scene.add(fill);
  }

  private setupGround(): void {
    const groundGeo = new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x5a5a6a,
      roughness: 0.9,
      metalness: 0.05
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const gridHelper = new THREE.GridHelper(GRID_SIZE, GRID_SIZE, 0x8888aa, 0x555566);
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.6;
    this.scene.add(gridHelper);

    const borderGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(GRID_SIZE, 0.02, GRID_SIZE));
    const borderMat = new THREE.LineBasicMaterial({ color: 0x7788aa, transparent: true, opacity: 0.8 });
    const border = new THREE.LineSegments(borderGeo, borderMat);
    border.position.y = 0.01;
    this.scene.add(border);
  }

  private spawnPresetBuildings(): void {
    this.buildingManager.addBuilding(new THREE.Vector3(-3, 0, -2), 0.8, '#4a5a7a', false);
    this.buildingManager.addBuilding(new THREE.Vector3(0, 0, 1), 1.6, '#c84a2a', false);
    this.buildingManager.addBuilding(new THREE.Vector3(3, 0, -1), 2.4, '#b0b0b8', false);
  }

  private bindEvents(): void {
    window.addEventListener('resize', this.onResize);
  }

  private onResize = (): void => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  private updateCameraPosition(): void {
    const x = this.cameraDistance * Math.sin(this.cameraPhi) * Math.sin(this.cameraTheta);
    const y = this.cameraDistance * Math.cos(this.cameraPhi);
    const z = this.cameraDistance * Math.sin(this.cameraPhi) * Math.cos(this.cameraTheta);

    this.camera.position.set(
      this.cameraTarget.x + x,
      this.cameraTarget.y + y,
      this.cameraTarget.z + z
    );
    this.camera.lookAt(this.cameraTarget);
  }

  private easeOut(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  private animateCamera(now: number): void {
    if (!this.cameraAnim.active) return;

    const t = Math.min(1, (now - this.cameraAnim.startTime) / this.cameraAnim.duration);
    const e = this.easeOut(t);

    this.cameraDistance =
      this.cameraAnim.startDistance +
      (this.cameraAnim.endDistance - this.cameraAnim.startDistance) * e;
    this.cameraTheta =
      this.cameraAnim.startTheta +
      (this.cameraAnim.endTheta - this.cameraAnim.startTheta) * e;
    this.cameraPhi =
      this.cameraAnim.startPhi + (this.cameraAnim.endPhi - this.cameraAnim.startPhi) * e;
    this.cameraTarget.lerpVectors(
      this.cameraAnim.startTarget,
      this.cameraAnim.endTarget,
      e
    );

    this.updateCameraPosition();

    if (t >= 1) {
      this.cameraAnim.active = false;
    }
  }

  private startCameraAnimation(
    targetDistance: number,
    targetTheta: number,
    targetPhi: number,
    targetLookAt: THREE.Vector3,
    duration = 300
  ): void {
    const now = performance.now();
    this.cameraAnim = {
      active: true,
      startTime: now,
      duration,
      startDistance: this.cameraDistance,
      endDistance: targetDistance,
      startTheta: this.cameraTheta,
      endTheta: targetTheta,
      startPhi: this.cameraPhi,
      endPhi: targetPhi,
      startTarget: this.cameraTarget.clone(),
      endTarget: targetLookAt.clone()
    };
  }

  private handlePlaceBuilding = (worldPosition: THREE.Vector3): void => {
    this.buildingManager.addBuilding(worldPosition);
  };

  private handleSelectBuilding = (id: number | null): void => {
    this.buildingManager.selectBuilding(id);
  };

  private handleStartDrag = (id: number): void => {
    this.autoRotate = false;
    this.draggingBuildingId = id;
    this.buildingManager.startDrag(id);
  };

  private handleUpdateDrag = (worldPosition: THREE.Vector3): void => {
    if (this.draggingBuildingId !== null) {
      this.buildingManager.updateDragPosition(this.draggingBuildingId, worldPosition);
    }
  };

  private handleFinishDrag = (): void => {
    if (this.draggingBuildingId !== null) {
      this.buildingManager.finishDrag(this.draggingBuildingId);
      this.draggingBuildingId = null;
    }
  };

  private handlePanStart = (): void => {
    this.autoRotate = false;
  };

  private handlePan = (deltaX: number, deltaY: number): void => {
    const factor = this.cameraDistance * 0.002;
    const right = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    this.camera.getWorldDirection(right);
    right.cross(up).normalize();

    const panX = -deltaX * factor;
    const panZ = -deltaY * factor;

    this.cameraTarget.x += right.x * panX;
    this.cameraTarget.z += right.z * panX;

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    this.cameraTarget.x += forward.x * panZ;
    this.cameraTarget.z += forward.z * panZ;

    const half = GRID_SIZE / 2;
    this.cameraTarget.x = Math.max(-half, Math.min(half, this.cameraTarget.x));
    this.cameraTarget.z = Math.max(-half, Math.min(half, this.cameraTarget.z));

    this.updateCameraPosition();
  };

  private handleRotate = (deltaX: number, deltaY: number): void => {
    this.autoRotate = false;
    this.cameraTheta -= deltaX * 0.008;
    this.cameraPhi -= deltaY * 0.008;
    this.cameraPhi = Math.max(0.05, Math.min(Math.PI / 2 - 0.02, this.cameraPhi));
    this.updateCameraPosition();
  };

  private handleZoom = (delta: number): void => {
    const factor = delta > 0 ? 1.1 : 0.9;
    const newDist = this.cameraDistance * factor;
    this.cameraDistance = Math.max(this.minDistance, Math.min(this.maxDistance, newDist));
    this.updateCameraPosition();
  };

  private handleResetView = (): void => {
    this.isBirdView = false;
    this.cameraTarget.set(0, 0, 0);
    this.startCameraAnimation(
      Math.sqrt(8 * 8 + 6 * 6 + 8 * 8),
      Math.PI / 4,
      Math.atan2(Math.sqrt(8 * 8 + 8 * 8), 6),
      new THREE.Vector3(0, 0, 0),
      500
    );
    this.autoRotate = true;
  };

  private handleToggleBirdView = (): void => {
    if (!this.isBirdView) {
      this.normalCameraState = {
        distance: this.cameraDistance,
        theta: this.cameraTheta,
        phi: this.cameraPhi,
        target: this.cameraTarget.clone()
      };
      this.isBirdView = true;
      this.autoRotate = false;
      this.startCameraAnimation(14, this.cameraTheta, 0.01, new THREE.Vector3(0, 0, 0), 400);
    } else {
      this.isBirdView = false;
      this.startCameraAnimation(
        this.normalCameraState.distance,
        this.normalCameraState.theta,
        this.normalCameraState.phi,
        this.normalCameraState.target,
        400
      );
    }
  };

  private handleToggleMode = (): void => {
    this.mode = this.mode === 'browse' ? 'place' : 'browse';
    this.interactionController.setMode(this.mode);
    this.updateModeText();
  };

  private handleDeleteSelected = (): void => {
    this.buildingManager.deleteSelected();
  };

  private handleChangeColor = (index: number): void => {
    this.buildingManager.changeSelectedColor(index);
  };

  private handlePickBuildingAtScreen = (
    ndcX: number,
    ndcY: number
  ): { id: number; point: THREE.Vector3 } | null => {
    return this.buildingManager.pickBuildingAtScreen(this.camera, ndcX, ndcY);
  };

  private handleRaycastGround = (ndcX: number, ndcY: number): THREE.Vector3 | null => {
    return this.buildingManager.raycastGround(this.raycaster, this.camera, ndcX, ndcY);
  };

  private updateCounter(): void {
    const count = this.buildingManager.getBuildingCount();
    if (this.counterTextEl) {
      this.counterTextEl.textContent = `${count}/${MAX_BUILDINGS}`;
    }
    if (this.counterProgressEl) {
      const circumference = 2 * Math.PI * 30;
      const progress = count / MAX_BUILDINGS;
      const offset = circumference * (1 - progress);
      this.counterProgressEl.style.strokeDashoffset = `${offset}`;
    }
    if (this.counterEl) {
      if (count >= MAX_BUILDINGS) {
        this.counterEl.classList.add('warning');
      } else {
        this.counterEl.classList.remove('warning');
      }
    }
  }

  private updateModeText(): void {
    if (!this.modeTextEl) return;
    const selected = this.buildingManager.getSelectedId() !== null;
    if (selected) {
      this.modeTextEl.textContent = '选中模式';
    } else if (this.mode === 'place') {
      this.modeTextEl.textContent = '放置模式';
    } else {
      this.modeTextEl.textContent = '浏览模式';
    }
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);

    const now = performance.now();

    if (this.cameraAnim.active) {
      this.animateCamera(now);
    } else if (this.autoRotate && !this.isBirdView) {
      this.cameraTheta += this.autoRotateSpeed;
      this.updateCameraPosition();
    }

    this.buildingManager.update(now);
    this.renderer.render(this.scene, this.camera);
  };

  dispose(): void {
    window.removeEventListener('resize', this.onResize);
    this.interactionController.dispose();
    this.buildingManager.dispose();
    this.renderer.dispose();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new App();
});
