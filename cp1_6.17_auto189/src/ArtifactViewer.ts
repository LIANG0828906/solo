import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { NarrationManager } from './NarrationManager';
import { DataService } from './DataService';
import type { Artifact } from './types/artifact';

export interface ViewerCallbacks {
  onHoverArtifact?: (artifactId: string | null, screenPos: { x: number; y: number } | null) => void;
  onClickArtifact?: (artifactId: string) => void;
  onNarrationStateChange?: (isPlaying: boolean) => void;
}

export class ArtifactViewer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private container: HTMLElement | null = null;

  private narrationManager: NarrationManager;

  private currentArtifact: Artifact | null = null;
  private currentArtifactMesh: THREE.Group | null = null;
  private relatedArtifacts: Map<string, { mesh: THREE.Group; plaque: THREE.Mesh; data: Artifact }> = new Map();

  private zoomLevel: number = 1.2;
  private minZoom: number = 0.5;
  private maxZoom: number = 3;
  private autoRotateSpeed: number = 0.002;
  private isAutoRotating: boolean = true;

  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private hoveredObject: THREE.Object3D | null = null;
  private hoverTimeout: number | null = null;
  private hoverDelay: number = 500;

  private isCompareMode: boolean = false;
  private compareArtifactIds: string[] = [];
  private compareMeshes: THREE.Group[] = [];
  private compareFrame: THREE.Line | null = null;

  private shakeStartTime: number = 0;
  private shakeDuration: number = 200;
  private shakeAmplitude: number = 0.03;
  private shakeFrequency: number = 5;
  private isShaking: boolean = false;
  private shakeOriginalPos: THREE.Vector3 = new THREE.Vector3();

  private rippleMesh: THREE.Mesh | null = null;
  private rippleStartTime: number = 0;
  private rippleDuration: number = 500;
  private rippleMaxRadius: number = 2;

  private glowMesh: THREE.Mesh | null = null;

  private animationFrameId: number = 0;
  private lastTime: number = 0;
  private clock: THREE.Clock;

  private callbacks: ViewerCallbacks = {};

  private baseCameraDistance: number = 8;

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.narrationManager = new NarrationManager();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.clock = new THREE.Clock();
  }

  init(container: HTMLElement, callbacks: ViewerCallbacks = {}): void {
    this.container = container;
    this.callbacks = callbacks;

    this.setupRenderer();
    this.setupCamera();
    this.setupControls();
    this.setupLights();
    this.setupGallery();
    this.setupEventListeners();

    this.loadInitialArtifact();

    this.animate();
  }

  private setupRenderer(): void {
    if (!this.container) return;
    const { clientWidth, clientHeight } = this.container;
    this.renderer.setSize(clientWidth, clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.container.appendChild(this.renderer.domElement);
  }

  private setupCamera(): void {
    this.camera.position.set(0, 2, this.baseCameraDistance);
    this.camera.lookAt(0, 1, 0);
  }

  private setupControls(): void {
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = this.baseCameraDistance * (1 / this.maxZoom);
    this.controls.maxDistance = this.baseCameraDistance * (1 / this.minZoom);
    this.controls.maxPolarAngle = Math.PI / 2 + 0.2;
    this.controls.minPolarAngle = Math.PI / 4;
    this.controls.target.set(0, 1, 0);
  }

  private setupLights(): void {
    const ambient = new THREE.AmbientLight(0x404040, 0.4);
    this.scene.add(ambient);

    const topLightPositions = [
      { x: -3, z: -3 },
      { x: 3, z: -3 },
      { x: 0, z: 3 },
    ];
    topLightPositions.forEach((pos) => {
      const pointLight = new THREE.PointLight(0xffd6aa, 0.4, 20);
      pointLight.position.set(pos.x, 5.5, pos.z);
      pointLight.castShadow = false;
      this.scene.add(pointLight);
    });

    const spot1 = new THREE.SpotLight(0xfff0d4, 0.8, 20, Math.PI / 6, 0.4, 1);
    spot1.position.set(-2, 5, 2);
    spot1.target.position.set(0, 1, 0);
    spot1.castShadow = true;
    spot1.shadow.mapSize.width = 1024;
    spot1.shadow.mapSize.height = 1024;
    this.scene.add(spot1);
    this.scene.add(spot1.target);

    const spot2 = new THREE.SpotLight(0xfff0d4, 0.8, 20, Math.PI / 6, 0.4, 1);
    spot2.position.set(2, 5, 2);
    spot2.target.position.set(0, 1, 0);
    spot2.castShadow = true;
    spot2.shadow.mapSize.width = 1024;
    spot2.shadow.mapSize.height = 1024;
    this.scene.add(spot2);
    this.scene.add(spot2.target);
  }

  private setupGallery(): void {
    const gallerySize = 14;
    const wallHeight = 6;
    const wallColor = 0x2c2c2c;

    const floorGeo = new THREE.PlaneGeometry(gallerySize, gallerySize);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.8,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const gridHelper = new THREE.GridHelper(gallerySize, 20, 0x444444, 0x333333);
    gridHelper.position.y = 0.01;
    this.scene.add(gridHelper);

    const wallMat = new THREE.MeshStandardMaterial({
      color: wallColor,
      roughness: 0.9,
      metalness: 0.05,
      side: THREE.BackSide,
    });

    const ceilingGeo = new THREE.PlaneGeometry(gallerySize, gallerySize);
    const ceiling = new THREE.Mesh(ceilingGeo, wallMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = wallHeight;
    this.scene.add(ceiling);

    const wallGeo = new THREE.PlaneGeometry(gallerySize, wallHeight);

    const backWall = new THREE.Mesh(wallGeo, wallMat);
    backWall.position.z = -gallerySize / 2;
    backWall.position.y = wallHeight / 2;
    this.scene.add(backWall);

    const frontWall = new THREE.Mesh(wallGeo, wallMat);
    frontWall.position.z = gallerySize / 2;
    frontWall.position.y = wallHeight / 2;
    frontWall.rotation.y = Math.PI;
    this.scene.add(frontWall);

    const leftWall = new THREE.Mesh(wallGeo, wallMat);
    leftWall.position.x = -gallerySize / 2;
    leftWall.position.y = wallHeight / 2;
    leftWall.rotation.y = Math.PI / 2;
    this.scene.add(leftWall);

    const rightWall = new THREE.Mesh(wallGeo, wallMat);
    rightWall.position.x = gallerySize / 2;
    rightWall.position.y = wallHeight / 2;
    rightWall.rotation.y = -Math.PI / 2;
    this.scene.add(rightWall);
  }

  private setupEventListeners(): void {
    if (!this.container) return;
    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousemove', this.onMouseMove);
    canvas.addEventListener('click', this.onClick);
    canvas.addEventListener('wheel', this.onWheel);
    window.addEventListener('resize', this.onResize);

    this.controls.addEventListener('change', this.onControlsChange);
  }

  private onMouseMove = (event: MouseEvent): void => {
    if (!this.container) return;
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.checkHover();
  };

  private onClick = (event: MouseEvent): void => {
    if (!this.container) return;
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const plaqueMeshes: THREE.Mesh[] = [];
    this.relatedArtifacts.forEach((item) => {
      plaqueMeshes.push(item.plaque);
    });

    const plaqueIntersects = this.raycaster.intersectObjects(plaqueMeshes, false);
    if (plaqueIntersects.length > 0) {
      const plaque = plaqueIntersects[0].object as THREE.Mesh;
      const artifactId = plaque.userData.artifactId;
      
      if (event.ctrlKey) {
        this.handleCompareSelect(artifactId);
      } else {
        this.switchArtifact(artifactId);
      }
      return;
    }

    const artifactIntersects = this.raycaster.intersectObject(
      this.currentArtifactMesh || new THREE.Group(),
      true
    );
    if (artifactIntersects.length > 0 && this.currentArtifact) {
      this.triggerClickEffect();
      this.callbacks.onClickArtifact?.(this.currentArtifact.id);
    }

    if (this.isCompareMode && this.compareMeshes.length > 0) {
      const compareIntersects = this.raycaster.intersectObjects(this.compareMeshes, true);
      if (compareIntersects.length > 0) {
        this.triggerClickEffect();
      }
    }
  };

  private handleCompareSelect(artifactId: string): void {
    const index = this.compareArtifactIds.indexOf(artifactId);
    if (index > -1) {
      this.compareArtifactIds.splice(index, 1);
    } else if (this.compareArtifactIds.length < 2) {
      this.compareArtifactIds.push(artifactId);
    }

    if (this.compareArtifactIds.length === 2) {
      this.enterCompareMode();
    } else {
      this.exitCompareMode();
      this.highlightSelectedCompare();
    }
  }

  private highlightSelectedCompare(): void {
    this.relatedArtifacts.forEach((item, id) => {
      const isSelected = this.compareArtifactIds.includes(id);
      const scale = isSelected ? 0.35 : 0.3;
      item.mesh.scale.setScalar(scale);
      
      const plaqueMat = item.plaque.material as THREE.MeshStandardMaterial;
      plaqueMat.emissive.setHex(isSelected ? 0xffd700 : 0x000000);
      plaqueMat.emissiveIntensity = isSelected ? 0.3 : 0;
    });
  }

  private async enterCompareMode(): Promise<void> {
    this.isCompareMode = true;
    this.exitCompareMode();

    try {
      const artifacts = await Promise.all(
        this.compareArtifactIds.map((id) => DataService.getArtifact(id))
      );

      const maxHeight = Math.max(...artifacts.map((a) => a.height));

      artifacts.forEach((artifact, index) => {
        const mesh = this.createArtifactMesh(artifact);
        const scale = (maxHeight / artifact.height) * 1.2 * 0.8;
        mesh.scale.setScalar(scale);
        
        const xOffset = index === 0 ? -1.5 : 1.5;
        mesh.position.set(xOffset, artifact.height * scale * 0.5, 0);
        
        this.scene.add(mesh);
        this.compareMeshes.push(mesh);
      });

      this.createCompareFrame();

      if (this.currentArtifactMesh) {
        this.currentArtifactMesh.visible = false;
      }
    } catch (error) {
      console.error('Failed to enter compare mode:', error);
    }
  }

  private exitCompareMode(): void {
    this.compareMeshes.forEach((mesh) => {
      this.scene.remove(mesh);
    });
    this.compareMeshes = [];

    if (this.compareFrame) {
      this.scene.remove(this.compareFrame);
      this.compareFrame = null;
    }

    if (this.currentArtifactMesh) {
      this.currentArtifactMesh.visible = true;
    }

    this.isCompareMode = false;
    this.highlightSelectedCompare();
  }

  private createCompareFrame(): void {
    const points: THREE.Vector3[] = [];
    const width = 4;
    const height = 3;
    const depth = 0.5;

    const corners = [
      [-width / 2, 0, -depth / 2],
      [width / 2, 0, -depth / 2],
      [width / 2, height, -depth / 2],
      [-width / 2, height, -depth / 2],
      [-width / 2, 0, -depth / 2],
    ];

    corners.forEach((c) => {
      points.push(new THREE.Vector3(c[0], c[1], c[2]));
    });

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ 
      color: 0xffd700, 
      transparent: true, 
      opacity: 0.8 
    });
    this.compareFrame = new THREE.Line(geometry, material);
    this.scene.add(this.compareFrame);
  }

  private triggerClickEffect(): void {
    this.isShaking = true;
    this.shakeStartTime = performance.now();
    if (this.currentArtifactMesh) {
      this.shakeOriginalPos.copy(this.currentArtifactMesh.position);
    }

    this.createRipple();
  }

  private createRipple(): void {
    if (this.rippleMesh) {
      this.scene.remove(this.rippleMesh);
    }

    const geometry = new THREE.RingGeometry(0.1, 0.15, 64);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });
    this.rippleMesh = new THREE.Mesh(geometry, material);
    this.rippleMesh.rotation.x = -Math.PI / 2;
    this.rippleMesh.position.y = 0.02;
    this.scene.add(this.rippleMesh);
    this.rippleStartTime = performance.now();
  }

  private onWheel = (): void => {
    this.updateZoomLevel();
    this.checkNarrationTrigger();
  };

  private onControlsChange = (): void => {
    this.isAutoRotating = false;
    this.updateZoomLevel();
    this.checkNarrationTrigger();
  };

  private updateZoomLevel(): void {
    const distance = this.camera.position.distanceTo(this.controls.target);
    this.zoomLevel = this.baseCameraDistance / distance;
  }

  private checkNarrationTrigger(): void {
    if (!this.currentArtifact || this.isCompareMode) return;

    const angle = this.getCameraFrontAngle();
    const shouldPlay = this.narrationManager.checkTrigger(angle, this.zoomLevel);

    if (shouldPlay && !this.narrationManager.getState().isPlaying) {
      this.narrationManager.loadNarration(this.currentArtifact.id);
      this.narrationManager.startNarration();
      this.callbacks.onNarrationStateChange?.(true);
    } else if (!shouldPlay && this.narrationManager.getState().isPlaying) {
      this.narrationManager.stopNarration();
      this.callbacks.onNarrationStateChange?.(false);
    }
  }

  private getCameraFrontAngle(): number {
    const cameraDir = new THREE.Vector3();
    this.camera.getWorldDirection(cameraDir);
    cameraDir.y = 0;
    cameraDir.normalize();

    const frontDir = new THREE.Vector3(0, 0, -1);
    const angle = Math.atan2(cameraDir.x, cameraDir.z) - Math.atan2(frontDir.x, frontDir.z);
    return THREE.MathUtils.radToDeg(THREE.MathUtils.euclideanModulo(angle + Math.PI, Math.PI * 2) - Math.PI);
  }

  private checkHover(): void {
    this.raycaster.setFromCamera(this.mouse, this.camera);

    let hoveredArtifactId: string | null = null;
    let hoveredMesh: THREE.Object3D | null = null;

    if (this.currentArtifactMesh && !this.isCompareMode) {
      const intersects = this.raycaster.intersectObject(this.currentArtifactMesh, true);
      if (intersects.length > 0) {
        hoveredArtifactId = this.currentArtifact?.id || null;
        hoveredMesh = this.currentArtifactMesh;
      }
    }

    if (hoveredMesh !== this.hoveredObject) {
      this.hoveredObject = hoveredMesh;
      
      if (this.hoverTimeout) {
        clearTimeout(this.hoverTimeout);
        this.hoverTimeout = null;
      }

      if (hoveredMesh && hoveredArtifactId) {
        this.showGlow(hoveredMesh);
        this.hoverTimeout = window.setTimeout(() => {
          const screenPos = this.getScreenPosition(hoveredMesh);
          this.callbacks.onHoverArtifact?.(hoveredArtifactId, screenPos);
        }, this.hoverDelay);
      } else {
        this.hideGlow();
        this.callbacks.onHoverArtifact?.(null, null);
      }
    }
  }

  private showGlow(target: THREE.Object3D): void {
    if (this.glowMesh) {
      this.scene.remove(this.glowMesh);
    }

    const box = new THREE.Box3().setFromObject(target);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    const glowGeo = new THREE.RingGeometry(
      Math.max(size.x, size.z) * 0.5,
      Math.max(size.x, size.z) * 0.6,
      64
    );
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x4ade80,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    this.glowMesh = new THREE.Mesh(glowGeo, glowMat);
    this.glowMesh.rotation.x = -Math.PI / 2;
    this.glowMesh.position.set(center.x, 0.03, center.z);
    this.scene.add(this.glowMesh);
  }

  private hideGlow(): void {
    if (this.glowMesh) {
      this.scene.remove(this.glowMesh);
      this.glowMesh = null;
    }
  }

  private getScreenPosition(object: THREE.Object3D): { x: number; y: number } | null {
    if (!this.container) return null;
    const box = new THREE.Box3().setFromObject(object);
    const center = new THREE.Vector3();
    box.getCenter(center);
    center.y += box.getSize(new THREE.Vector3()).y * 0.5 + 1.5;

    const vector = center.clone().project(this.camera);
    const rect = this.container.getBoundingClientRect();

    return {
      x: (vector.x + 1) / 2 * rect.width,
      y: -(vector.y - 1) / 2 * rect.height,
    };
  }

  private onResize = (): void => {
    if (!this.container) return;
    const { clientWidth, clientHeight } = this.container;
    this.camera.aspect = clientWidth / clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(clientWidth, clientHeight);
  };

  private async loadInitialArtifact(): Promise<void> {
    try {
      const artifacts = await DataService.getArtifacts();
      if (artifacts.length > 0) {
        const mainArtifact = artifacts.find((a) => a.id === 'bronze-ding') || artifacts[0];
        await this.loadArtifact(mainArtifact.id);
        await this.loadRelatedArtifacts(mainArtifact.id);
      }
    } catch (error) {
      console.error('Failed to load initial artifact:', error);
    }
  }

  async loadArtifact(id: string): Promise<void> {
    try {
      const artifact = await DataService.getArtifact(id);
      this.currentArtifact = artifact;

      if (this.currentArtifactMesh) {
        this.scene.remove(this.currentArtifactMesh);
      }

      this.currentArtifactMesh = this.createArtifactMesh(artifact);
      this.currentArtifactMesh.scale.setScalar(1.2);
      this.currentArtifactMesh.position.y = artifact.height * 1.2 * 0.5;
      this.scene.add(this.currentArtifactMesh);

      this.zoomLevel = 1.2;
      this.isAutoRotating = true;

      this.narrationManager.stopNarration();
      this.narrationManager.resetScroll();
    } catch (error) {
      console.error('Failed to load artifact:', error);
    }
  }

  async switchArtifact(id: string): Promise<void> {
    await this.loadArtifact(id);
    await this.loadRelatedArtifacts(id);
    
    if (this.callbacks.onClickArtifact) {
      this.callbacks.onClickArtifact(id);
    }
  }

  private createArtifactMesh(artifact: Artifact): THREE.Group {
    const group = new THREE.Group();
    group.userData.artifactId = artifact.id;

    let mesh: THREE.Mesh;

    switch (artifact.modelType) {
      case 'ding':
        mesh = this.createDingModel();
        break;
      case 'vase':
        mesh = this.createVaseModel();
        break;
      case 'sword':
        mesh = this.createSwordModel();
        break;
      case 'jade':
        mesh = this.createJadeModel();
        break;
      case 'pot':
        mesh = this.createPotModel();
        break;
      case 'mirror':
        mesh = this.createMirrorModel();
        break;
      default:
        mesh = this.createDingModel();
    }

    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    return group;
  }

  private createDingModel(): THREE.Mesh {
    const group = new THREE.Group();

    const bodyGeo = new THREE.BoxGeometry(1.2, 0.8, 0.9);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x4a6b5d,
      metalness: 0.7,
      roughness: 0.3,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.6;
    group.add(body);

    const rimGeo = new THREE.BoxGeometry(1.3, 0.1, 1.0);
    const rim = new THREE.Mesh(rimGeo, bodyMat);
    rim.position.y = 1.05;
    group.add(rim);

    const legPositions = [
      { x: -0.4, z: -0.3 },
      { x: 0.4, z: -0.3 },
      { x: -0.4, z: 0.3 },
      { x: 0.4, z: 0.3 },
    ];
    legPositions.forEach((pos) => {
      const legGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.4, 8);
      const leg = new THREE.Mesh(legGeo, bodyMat);
      leg.position.set(pos.x, 0.2, pos.z);
      group.add(leg);
    });

    return group as unknown as THREE.Mesh;
  }

  private createVaseModel(): THREE.Mesh {
    const group = new THREE.Group();

    const points = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const x = 0.3 + Math.sin(t * Math.PI) * 0.25 + Math.sin(t * Math.PI * 2) * 0.05;
      const y = t * 1.5;
      points.push(new THREE.Vector2(x, y));
    }

    const bodyGeo = new THREE.LatheGeometry(points, 32);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x4a6b5d,
      metalness: 0.75,
      roughness: 0.25,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    const baseGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.15, 32);
    const base = new THREE.Mesh(baseGeo, bodyMat);
    base.position.y = 0.075;
    group.add(base);

    return group as unknown as THREE.Mesh;
  }

  private createSwordModel(): THREE.Mesh {
    const group = new THREE.Group();

    const bladeGeo = new THREE.BoxGeometry(0.06, 0.8, 0.02);
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0x4a6b5d,
      metalness: 0.9,
      roughness: 0.15,
    });
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.position.y = 0.6;
    group.add(blade);

    const tipGeo = new THREE.ConeGeometry(0.04, 0.1, 4);
    const tip = new THREE.Mesh(tipGeo, bladeMat);
    tip.position.y = 1.05;
    tip.rotation.z = Math.PI;
    group.add(tip);

    const guardGeo = new THREE.BoxGeometry(0.25, 0.05, 0.05);
    const guardMat = new THREE.MeshStandardMaterial({
      color: 0x6b4e31,
      metalness: 0.6,
      roughness: 0.4,
    });
    const guard = new THREE.Mesh(guardGeo, guardMat);
    guard.position.y = 0.2;
    group.add(guard);

    const hiltGeo = new THREE.CylinderGeometry(0.03, 0.035, 0.2, 16);
    const hilt = new THREE.Mesh(hiltGeo, guardMat);
    hilt.position.y = 0.075;
    group.add(hilt);

    const pommelGeo = new THREE.SphereGeometry(0.04, 16, 16);
    const pommel = new THREE.Mesh(pommelGeo, bladeMat);
    pommel.position.y = -0.02;
    group.add(pommel);

    return group as unknown as THREE.Mesh;
  }

  private createJadeModel(): THREE.Mesh {
    const group = new THREE.Group();

    const torusGeo = new THREE.TorusGeometry(0.35, 0.1, 16, 48);
    const jadeMat = new THREE.MeshStandardMaterial({
      color: 0x8b7355,
      metalness: 0.2,
      roughness: 0.6,
      transparent: true,
      opacity: 0.9,
    });
    const torus = new THREE.Mesh(torusGeo, jadeMat);
    torus.rotation.x = Math.PI / 2;
    torus.position.y = 0.1;
    group.add(torus);

    const discGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.02, 32);
    const disc = new THREE.Mesh(discGeo, jadeMat);
    disc.position.y = 0.1;
    group.add(disc);

    return group as unknown as THREE.Mesh;
  }

  private createPotModel(): THREE.Mesh {
    const group = new THREE.Group();

    const points = [];
    for (let i = 0; i <= 15; i++) {
      const t = i / 15;
      const x = 0.1 + t * 0.25 + Math.sin(t * Math.PI * 0.8) * 0.15;
      const y = t * 0.6;
      points.push(new THREE.Vector2(x, y));
    }

    const bodyGeo = new THREE.LatheGeometry(points, 24);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xa0522d,
      metalness: 0.1,
      roughness: 0.8,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    const rimGeo = new THREE.TorusGeometry(0.35, 0.03, 8, 24);
    const rim = new THREE.Mesh(rimGeo, bodyMat);
    rim.position.y = 0.6;
    rim.rotation.x = Math.PI / 2;
    group.add(rim);

    return group as unknown as THREE.Mesh;
  }

  private createMirrorModel(): THREE.Mesh {
    const group = new THREE.Group();

    const backGeo = new THREE.CylinderGeometry(0.4, 0.42, 0.05, 48);
    const backMat = new THREE.MeshStandardMaterial({
      color: 0xb8860b,
      metalness: 0.8,
      roughness: 0.3,
    });
    const back = new THREE.Mesh(backGeo, backMat);
    back.position.y = 0.05;
    group.add(back);

    const frontGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.02, 48);
    const frontMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 0.95,
      roughness: 0.05,
    });
    const front = new THREE.Mesh(frontGeo, frontMat);
    front.position.y = 0.085;
    group.add(front);

    const knobGeo = new THREE.SphereGeometry(0.05, 16, 16);
    const knob = new THREE.Mesh(knobGeo, backMat);
    knob.position.y = -0.02;
    group.add(knob);

    return group as unknown as THREE.Mesh;
  }

  private async loadRelatedArtifacts(mainArtifactId: string): Promise<void> {
    try {
      this.relatedArtifacts.forEach((item) => {
        this.scene.remove(item.mesh);
        this.scene.remove(item.plaque);
      });
      this.relatedArtifacts.clear();

      const mainArtifact = await DataService.getArtifact(mainArtifactId);
      const relatedIds = mainArtifact.relatedIds.slice(0, 5);

      const wallPositions = [
        { x: -5, z: 0, rotY: Math.PI / 2 },
        { x: -3, z: -5, rotY: 0 },
        { x: 3, z: -5, rotY: 0 },
        { x: 5, z: 0, rotY: -Math.PI / 2 },
        { x: 0, z: -5, rotY: 0 },
      ];

      for (let i = 0; i < relatedIds.length && i < wallPositions.length; i++) {
        const artifact = await DataService.getArtifact(relatedIds[i]);
        const pos = wallPositions[i];

        const mesh = this.createArtifactMesh(artifact);
        mesh.scale.setScalar(0.3);
        mesh.position.set(pos.x, 1.2, pos.z);
        mesh.rotation.y = pos.rotY;
        this.scene.add(mesh);

        const plaque = this.createPlaque(artifact);
        plaque.position.set(pos.x, 0.9, pos.z);
        plaque.rotation.y = pos.rotY;
        plaque.userData.artifactId = artifact.id;
        this.scene.add(plaque);

        this.relatedArtifacts.set(artifact.id, { mesh, plaque, data: artifact });
      }
    } catch (error) {
      console.error('Failed to load related artifacts:', error);
    }
  }

  private createPlaque(artifact: Artifact): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(1.8, 0.4);
    const material = new THREE.MeshStandardMaterial({
      color: 0x6b4e31,
      roughness: 0.7,
      metalness: 0.3,
      side: THREE.DoubleSide,
    });
    const plaque = new THREE.Mesh(geometry, material);
    plaque.userData.artifactId = artifact.id;
    return plaque;
  }

  getNarrationManager(): NarrationManager {
    return this.narrationManager;
  }

  getCurrentArtifact(): Artifact | null {
    return this.currentArtifact;
  }

  private animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();
    const time = performance.now();

    if (this.isAutoRotating && this.currentArtifactMesh && !this.isCompareMode) {
      this.currentArtifactMesh.rotation.y += this.autoRotateSpeed * 60 * delta;
    }

    this.controls.update();

    this.updateShake(time);
    this.updateRipple(time);
    this.updateCompareFrame(time);
    this.narrationManager.update(delta);

    this.renderer.render(this.scene, this.camera);
  };

  private updateShake(time: number): void {
    if (!this.isShaking || !this.currentArtifactMesh) return;

    const elapsed = time - this.shakeStartTime;
    if (elapsed >= this.shakeDuration) {
      this.isShaking = false;
      this.currentArtifactMesh.position.copy(this.shakeOriginalPos);
      return;
    }

    const progress = elapsed / this.shakeDuration;
    const decay = 1 - progress;
    const offsetX = Math.sin(elapsed * this.shakeFrequency * 0.01 * Math.PI * 2) * this.shakeAmplitude * decay;
    const offsetZ = Math.cos(elapsed * this.shakeFrequency * 0.01 * Math.PI * 2) * this.shakeAmplitude * decay;

    this.currentArtifactMesh.position.x = this.shakeOriginalPos.x + offsetX;
    this.currentArtifactMesh.position.z = this.shakeOriginalPos.z + offsetZ;
  }

  private updateRipple(time: number): void {
    if (!this.rippleMesh) return;

    const elapsed = time - this.rippleStartTime;
    if (elapsed >= this.rippleDuration) {
      this.scene.remove(this.rippleMesh);
      this.rippleMesh = null;
      return;
    }

    const progress = elapsed / this.rippleDuration;
    const radius = 0.1 + progress * this.rippleMaxRadius;
    const opacity = 0.6 * (1 - progress);

    const ringGeo = new THREE.RingGeometry(radius * 0.95, radius, 64);
    this.rippleMesh.geometry.dispose();
    this.rippleMesh.geometry = ringGeo;

    const mat = this.rippleMesh.material as THREE.MeshBasicMaterial;
    mat.opacity = opacity;
  }

  private updateCompareFrame(time: number): void {
    if (!this.compareFrame || !this.isCompareMode) return;

    const scanOffset = (time * 0.002) % 1;
    const mat = this.compareFrame.material as THREE.LineBasicMaterial;
    mat.opacity = 0.4 + Math.sin(time * 0.003) * 0.4;
  }

  getZoomLevel(): number {
    return this.zoomLevel;
  }

  dispose(): void {
    cancelAnimationFrame(this.animationFrameId);
    
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }

    window.removeEventListener('resize', this.onResize);
    
    if (this.container && this.renderer.domElement.parentNode) {
      this.container.removeChild(this.renderer.domElement);
    }

    this.renderer.dispose();
    this.controls.dispose();
  }
}
