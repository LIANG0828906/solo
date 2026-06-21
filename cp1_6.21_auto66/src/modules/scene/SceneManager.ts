import * as THREE from 'three';
import type { SceneState, GridPosition } from '../../utils/types';
import { BACKGROUND_COLOR, GRID_LINE_COLOR } from '../../utils/colors';

export class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer | null = null;
  private grid: THREE.GridHelper | null = null;
  private animationId: number | null = null;
  private animationCallbacks: Array<(delta: number) => void> = [];
  private clock: THREE.Clock;
  private gridSize: number;
  private container: HTMLElement | null = null;

  constructor(gridSize: number = 20) {
    this.gridSize = gridSize;
    this.clock = new THREE.Clock();

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(BACKGROUND_COLOR);

    this.camera = new THREE.PerspectiveCamera(
      45,
      1,
      0.1,
      1000
    );
    this.setupCamera();
    this.setupLighting();
    this.createGrid();
  }

  private setupCamera(): void {
    const distance = this.gridSize * 1.2;
    this.camera.position.set(distance, distance, distance);
    this.camera.lookAt(0, 0, 0);
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.3);
    hemiLight.position.set(0, 20, 0);
    this.scene.add(hemiLight);
  }

  private createGrid(): void {
    if (this.grid) {
      this.scene.remove(this.grid);
    }
    this.grid = new THREE.GridHelper(
      this.gridSize,
      this.gridSize,
      GRID_LINE_COLOR,
      GRID_LINE_COLOR
    );
    this.grid.position.y = 0;
    this.scene.add(this.grid);

    const groundGeometry = new THREE.PlaneGeometry(this.gridSize, this.gridSize);
    const groundMaterial = new THREE.MeshBasicMaterial({
      color: BACKGROUND_COLOR,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.name = 'ground';
    this.scene.add(ground);
  }

  public init(container: HTMLElement): void {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);
    this.updateCameraAspect();
    window.addEventListener('resize', this.handleResize);
  }

  private handleResize = (): void => {
    if (!this.container || !this.renderer) return;
    this.updateCameraAspect();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  };

  private updateCameraAspect(): void {
    if (!this.container) return;
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
  }

  public setGrid(size: number, divisions: number): void {
    this.gridSize = size;
    if (this.grid) {
      this.scene.remove(this.grid);
    }
    this.grid = new THREE.GridHelper(size, divisions, GRID_LINE_COLOR, GRID_LINE_COLOR);
    this.scene.add(this.grid);
  }

  public setBackgroundColor(color: string): void {
    this.scene.background = new THREE.Color(color);
  }

  public updateCameraPosition(x: number, y: number, z: number): void {
    this.camera.position.set(x, y, z);
    this.camera.lookAt(0, 0, 0);
  }

  public startRenderLoop(callback?: (delta: number) => void): void {
    if (callback) {
      this.animationCallbacks.push(callback);
    }
    this.animate();
  }

  public stopRenderLoop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.animationCallbacks = [];
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();
    this.animationCallbacks.forEach(cb => cb(delta));
    this.render();
  };

  private render(): void {
    if (this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  public worldToScreen(worldPos: THREE.Vector3): { x: number; y: number } {
    const vector = worldPos.clone().project(this.camera);
    if (!this.container) return { x: 0, y: 0 };
    return {
      x: (vector.x * 0.5 + 0.5) * this.container.clientWidth,
      y: (-vector.y * 0.5 + 0.5) * this.container.clientHeight
    };
  }

  public screenToWorld(screenX: number, screenY: number, planeY: number = 0.5): THREE.Vector3 {
    if (!this.container) return new THREE.Vector3(0, 0, 0);
    const rect = this.renderer?.domElement.getBoundingClientRect();
    if (!rect) return new THREE.Vector3(0, 0, 0);

    const x = ((screenX - rect.left) / rect.width) * 2 - 1;
    const y = -((screenY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);

    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -planeY);
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersection);

    return intersection;
  }

  public snapToGrid(worldPos: THREE.Vector3): GridPosition {
    const halfGrid = this.gridSize / 2;
    return {
      x: Math.max(-halfGrid, Math.min(halfGrid - 1, Math.floor(worldPos.x + 0.5))),
      y: Math.max(0, Math.floor(worldPos.y)),
      z: Math.max(-halfGrid, Math.min(halfGrid - 1, Math.floor(worldPos.z + 0.5)))
    };
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  public getRenderer(): THREE.WebGLRenderer | null {
    return this.renderer;
  }

  public getGridSize(): number {
    return this.gridSize;
  }

  public getState(): SceneState {
    return {
      cameraPosition: {
        x: this.camera.position.x,
        y: this.camera.position.y,
        z: this.camera.position.z
      },
      cameraTarget: { x: 0, y: 0, z: 0 },
      gridSize: this.gridSize,
      backgroundColor: BACKGROUND_COLOR
    };
  }

  public dispose(): void {
    window.removeEventListener('resize', this.handleResize);
    this.stopRenderLoop();
    if (this.renderer && this.container) {
      this.container.removeChild(this.renderer.domElement);
      this.renderer.dispose();
    }
  }
}
