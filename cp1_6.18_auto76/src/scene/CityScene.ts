import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { buildingFactory } from './BuildingFactory';
import { getAllBuildings, getHeightScale } from './DataParser';
import { ZONE_INFO, MIN_YEAR, MAX_YEAR, MIN_HEIGHT, MAX_HEIGHT } from '../types';
import type { BuildingData, BuildingZone } from '../types';

interface AnimationState {
  targetOpacity: number;
  currentOpacity: number;
  targetHeight: number;
  currentHeight: number;
  startOpacity: number;
  startHeight: number;
  startTime: number;
  duration: number;
  animating: boolean;
}

export class CityScene {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private buildingGroup: THREE.Group;
  private zoneGroup: THREE.Group;
  private buildingMeshes: Map<string, THREE.Mesh> = new Map();
  private buildingAnimations: Map<string, AnimationState> = new Map();
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private currentYear: number = MIN_YEAR;
  private onBuildingClick: ((buildingId: string | null) => void) | null = null;
  private onZoneHover: ((zone: BuildingZone | null) => void) | null = null;
  private animationFrameId: number = 0;
  private clock: THREE.Clock;

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.clock = new THREE.Clock();

    const canvas = document.createElement('canvas');
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(canvas);

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 50, 100);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.rotateSpeed = 0.5;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 200;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.1;
    this.controls.target.set(0, 0, 0);

    this.buildingGroup = new THREE.Group();
    this.zoneGroup = new THREE.Group();
    this.scene.add(this.buildingGroup);
    this.scene.add(this.zoneGroup);

    this.setupLighting();
    this.setupBackground();
    this.createGround();
    this.createZonePlanes();
    this.createBuildings();
    this.setupEventListeners();
    this.animate();
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    this.scene.add(directionalLight);
  }

  private setupBackground(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#F0F0F0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 256);

    const texture = new THREE.CanvasTexture(canvas);
    this.scene.background = texture;
  }

  private createGround(): void {
    const geometry = new THREE.PlaneGeometry(300, 300);
    const material = new THREE.MeshStandardMaterial({
      color: 0xe0e0e0,
      roughness: 0.9,
      metalness: 0,
    });
    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  private createZonePlanes(): void {
    Object.values(ZONE_INFO).forEach((zone) => {
      const geometry = new THREE.PlaneGeometry(zone.width, zone.depth);
      const color = zone.color;
      const alphaHex = color.slice(7);
      const baseColor = color.slice(0, 7);
      const alpha = parseInt(alphaHex, 16) / 255;

      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(baseColor),
        transparent: true,
        opacity: alpha,
        side: THREE.DoubleSide,
      });

      const plane = new THREE.Mesh(geometry, material);
      plane.rotation.x = -Math.PI / 2;
      plane.position.set(zone.centerX, 0.01, zone.centerZ);
      plane.userData = { zoneId: zone.id, isZone: true };
      this.zoneGroup.add(plane);
    });
  }

  private createBuildings(): void {
    const buildings = getAllBuildings();
    const initialScale = getHeightScale(MIN_YEAR);

    buildings.forEach((data) => {
      const initialHeight = data.year <= MIN_YEAR ? data.height * initialScale : 0;
      const mesh = buildingFactory.createBuildingWithHeight(data, Math.max(initialHeight, 0.1));
      const material = mesh.material as THREE.MeshStandardMaterial;
      material.opacity = data.year <= MIN_YEAR ? 1 : 0;
      material.transparent = true;

      this.buildingGroup.add(mesh);
      this.buildingMeshes.set(data.id, mesh);

      this.buildingAnimations.set(data.id, {
        targetOpacity: data.year <= MIN_YEAR ? 1 : 0,
        currentOpacity: data.year <= MIN_YEAR ? 1 : 0,
        targetHeight: initialHeight,
        currentHeight: initialHeight,
        startOpacity: data.year <= MIN_YEAR ? 1 : 0,
        startHeight: initialHeight,
        startTime: 0,
        duration: 1500,
        animating: false,
      });
    });
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.onResize);
    this.renderer.domElement.addEventListener('click', this.onClick);
    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove);
  }

  private onResize = (): void => {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private onClick = (event: MouseEvent): void => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const meshes = Array.from(this.buildingMeshes.values()).filter((mesh) => {
      const material = mesh.material as THREE.MeshStandardMaterial;
      return material.opacity > 0.3;
    });
    const intersects = this.raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const buildingId = intersects[0].object.userData.buildingId as string;
      if (this.onBuildingClick) {
        this.onBuildingClick(buildingId);
      }
    } else {
      if (this.onBuildingClick) {
        this.onBuildingClick(null);
      }
    }
  };

  private onMouseMove = (event: MouseEvent): void => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const zoneMeshes = this.zoneGroup.children.filter((child) => child.userData.isZone);
    const intersects = this.raycaster.intersectObjects(zoneMeshes);

    if (intersects.length > 0) {
      const zoneId = intersects[0].object.userData.zoneId as BuildingZone;
      if (this.onZoneHover) {
        this.onZoneHover(zoneId);
      }
      this.renderer.domElement.style.cursor = 'pointer';
    } else {
      const buildingMeshes = Array.from(this.buildingMeshes.values()).filter((mesh) => {
        const material = mesh.material as THREE.MeshStandardMaterial;
        return material.opacity > 0.3;
      });
      const buildingIntersects = this.raycaster.intersectObjects(buildingMeshes);
      if (buildingIntersects.length > 0) {
        this.renderer.domElement.style.cursor = 'pointer';
      } else {
        this.renderer.domElement.style.cursor = 'grab';
      }
      if (this.onZoneHover) {
        this.onZoneHover(null);
      }
    }
  };

  setYear(year: number): void {
    if (year === this.currentYear) return;
    this.currentYear = year;

    const scale = getHeightScale(year);
    const now = performance.now();

    this.buildingMeshes.forEach((mesh, id) => {
      const data = mesh.userData.buildingData as BuildingData;
      const animState = this.buildingAnimations.get(id)!;

      const targetOpacity = data.year <= year ? 1 : 0;
      const targetHeight = data.year <= year ? data.height * scale : 0.1;

      animState.startOpacity = animState.currentOpacity;
      animState.startHeight = animState.currentHeight;
      animState.targetOpacity = targetOpacity;
      animState.targetHeight = targetHeight;
      animState.startTime = now;
      animState.animating = true;
    });
  }

  setOnBuildingClick(callback: (buildingId: string | null) => void): void {
    this.onBuildingClick = callback;
  }

  setOnZoneHover(callback: (zone: BuildingZone | null) => void): void {
    this.onZoneHover = callback;
  }

  private easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  private updateAnimations = (): void => {
    const now = performance.now();

    this.buildingAnimations.forEach((state, id) => {
      if (!state.animating) return;

      const elapsed = now - state.startTime;
      const progress = Math.min(1, elapsed / state.duration);
      const eased = this.easeInOut(progress);

      state.currentOpacity =
        state.startOpacity + (state.targetOpacity - state.startOpacity) * eased;
      state.currentHeight =
        state.startHeight + (state.targetHeight - state.startHeight) * eased;

      const mesh = this.buildingMeshes.get(id);
      if (mesh) {
        const material = mesh.material as THREE.MeshStandardMaterial;
        material.opacity = state.currentOpacity;
        material.transparent = state.currentOpacity < 1;

        if (state.currentHeight > 0.1) {
          const oldGeometry = mesh.geometry as THREE.BoxGeometry;
          oldGeometry.dispose();
          mesh.geometry = new THREE.BoxGeometry(6, state.currentHeight, 6);
          mesh.position.y = state.currentHeight / 2;
        }
      }

      if (progress >= 1) {
        state.animating = false;
      }
    });
  };

  private animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    this.updateAnimations();
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  dispose(): void {
    cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.onResize);
    this.renderer.domElement.removeEventListener('click', this.onClick);
    this.renderer.domElement.removeEventListener('mousemove', this.onMouseMove);

    this.buildingMeshes.forEach((mesh) => {
      (mesh.geometry as THREE.BoxGeometry).dispose();
      (mesh.material as THREE.MeshStandardMaterial).dispose();
    });

    this.buildingMeshes.clear();
    this.buildingAnimations.clear();

    this.controls.dispose();
    this.renderer.dispose();

    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
