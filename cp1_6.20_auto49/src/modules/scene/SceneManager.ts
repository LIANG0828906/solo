import * as THREE from 'three';
import { Building } from '../../types/building';
import { BuildingBuilder } from './BuildingBuilder';
import { SkyController } from './SkyController';

export class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private skyController: SkyController;
  private container: HTMLElement;
  private buildings: Map<string, THREE.Group> = new Map();
  private selectedBuildingId: string | null = null;
  private selectionRing: THREE.Group | null = null;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private onClickCallback: ((buildingId: string | null) => void) | null = null;
  private animationId: number | null = null;
  private clock: THREE.Clock;

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera();
    this.renderer = new THREE.WebGLRenderer();
    this.skyController = {} as SkyController;
    this.container = {} as HTMLElement;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.clock = new THREE.Clock();
  }

  init(container: HTMLElement): void {
    this.container = container;
    const { clientWidth, clientHeight } = container;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);

    this.camera = new THREE.PerspectiveCamera(
      60,
      clientWidth / clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(50, 40, 50);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(clientWidth, clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.skyController = new SkyController(this.scene);

    this.createGroundPlane();

    this.selectionRing = BuildingBuilder.createSelectionRing();
    this.selectionRing.visible = false;
    this.scene.add(this.selectionRing);

    this.setupEventListeners();

    this.render();
  }

  private createGroundPlane(): void {
    const planeGeometry = new THREE.PlaneGeometry(200, 200);
    const planeMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d5c3d,
      roughness: 0.9,
      metalness: 0.1
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    this.scene.add(plane);

    const gridHelper = new THREE.GridHelper(200, 50, 0x444444, 0x333333);
    this.scene.add(gridHelper);
  }

  private setupEventListeners(): void {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('click', this.handleClick.bind(this));

    window.addEventListener('resize', this.handleResize.bind(this));
  }

  private handleClick(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const buildingMeshes: THREE.Object3D[] = [];
    this.buildings.forEach((group) => {
      const mesh = group.getObjectByName('building_mesh');
      if (mesh) buildingMeshes.push(mesh);
    });

    const intersects = this.raycaster.intersectObjects(buildingMeshes, true);

    if (intersects.length > 0) {
      const clickedObject = intersects[0].object;
      let buildingGroup = clickedObject.parent;
      while (buildingGroup && !buildingGroup.userData.buildingId) {
        buildingGroup = buildingGroup.parent;
      }
      if (buildingGroup && buildingGroup.userData.buildingId) {
        const buildingId = buildingGroup.userData.buildingId;
        this.selectBuilding(buildingId);
        if (this.onClickCallback) {
          this.onClickCallback(buildingId);
        }
      }
    } else {
      this.selectBuilding(null);
      if (this.onClickCallback) {
        this.onClickCallback(null);
      }
    }
  }

  private handleResize(): void {
    const { clientWidth, clientHeight } = this.container;
    this.camera.aspect = clientWidth / clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(clientWidth, clientHeight);
  }

  addBuilding(building: Building): void {
    const buildingGroup = BuildingBuilder.createBuilding(building);
    const position = building.position || { x: 0, z: 0 };
    buildingGroup.position.set(position.x, 0, position.z);
    buildingGroup.scale.set(0, 0, 0);
    this.scene.add(buildingGroup);
    this.buildings.set(building.id, buildingGroup);

    this.animateScale(buildingGroup, 1, 500);
  }

  removeBuilding(buildingId: string): void {
    const buildingGroup = this.buildings.get(buildingId);
    if (!buildingGroup) return;

    if (this.selectedBuildingId === buildingId) {
      this.selectBuilding(null);
    }

    this.animateScale(buildingGroup, 0, 300, () => {
      this.scene.remove(buildingGroup);
      this.disposeGroup(buildingGroup);
      this.buildings.delete(buildingId);
    });
  }

  private animateScale(
    group: THREE.Group,
    targetScale: number,
    duration: number,
    onComplete?: () => void
  ): void {
    const startScale = group.scale.x;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentScale = startScale + (targetScale - startScale) * eased;

      group.scale.set(currentScale, currentScale, currentScale);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else if (onComplete) {
        onComplete();
      }
    };

    animate();
  }

  updateBuildingHeight(buildingId: string, height: number): void {
    const buildingGroup = this.buildings.get(buildingId);
    if (!buildingGroup) return;

    BuildingBuilder.updateHeight(buildingGroup, height);
  }

  selectBuilding(buildingId: string | null): void {
    this.selectedBuildingId = buildingId;

    if (this.selectionRing) {
      if (buildingId) {
        const buildingGroup = this.buildings.get(buildingId);
        if (buildingGroup) {
          this.selectionRing.position.copy(buildingGroup.position);
          this.selectionRing.visible = true;
        }
      } else {
        this.selectionRing.visible = false;
      }
    }
  }

  onBuildingClick(callback: (buildingId: string | null) => void): void {
    this.onClickCallback = callback;
  }

  render(): void {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);

      const delta = this.clock.getDelta();

      this.skyController.update();

      if (this.selectionRing && this.selectionRing.visible) {
        this.selectionRing.rotation.z += this.selectionRing.userData.rotationSpeed;
      }

      const isNight = this.skyController.isNight();
      this.buildings.forEach((group) => {
        const windowLights = group.getObjectByName('window_lights');
        if (windowLights && windowLights.userData.isNight !== isNight) {
          const height = this.getBuildingHeight(group);
          group.remove(windowLights);
          const newLights = BuildingBuilder.createWindowLights(height, isNight);
          newLights.name = 'window_lights';
          group.add(newLights);
        }
      });

      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  private getBuildingHeight(group: THREE.Group): number {
    const mesh = group.getObjectByName('building_mesh') as THREE.Mesh;
    if (mesh) {
      const box = new THREE.Box3().setFromObject(mesh);
      return box.max.y - box.min.y;
    }
    return 30;
  }

  private disposeGroup(group: THREE.Group): void {
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      } else if (child instanceof THREE.LineSegments) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }

  dispose(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    window.removeEventListener('resize', this.handleResize.bind(this));
    this.renderer.domElement.removeEventListener('click', this.handleClick.bind(this));

    this.buildings.forEach((group) => {
      this.disposeGroup(group);
      this.scene.remove(group);
    });
    this.buildings.clear();

    this.skyController.dispose();

    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  getSkyController(): SkyController {
    return this.skyController;
  }
}
