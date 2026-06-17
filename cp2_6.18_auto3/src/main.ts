import * as THREE from 'three';
import { TerrainGenerator } from './TerrainGenerator';
import { UIController } from './UIController';

class TerrainEditorApp {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private container!: HTMLElement;

  private terrainGenerator!: TerrainGenerator;
  private uiController!: UIController;

  private isMouseDown: boolean = false;
  private isRightMouseDown: boolean = false;
  private isEditing: boolean = false;
  private isRotating: boolean = false;
  private mouse!: THREE.Vector2;
  private lastMousePosition: { x: number; y: number } = { x: 0, y: 0 };

  private cameraDistance: number = 30;
  private cameraTheta: number = Math.PI / 4;
  private cameraPhi: number = Math.PI / 4;
  private cameraTarget!: THREE.Vector3;

  private minDistance: number = 5;
  private maxDistance: number = 50;
  private zoomDamping: number = 0.1;
  private targetDistance: number = 30;

  private panSpeed: number = 0.01;
  private rotateSpeed: number = 0.005;

  private raycaster!: THREE.Raycaster;

  private clock!: THREE.Clock;
  private animationId: number = 0;

  constructor() {
    this.container = document.getElementById('scene-container')!;
    this.mouse = new THREE.Vector2();
    this.cameraTarget = new THREE.Vector3(0, 0, 0);
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();

    this.initScene();
    this.initCamera();
    this.initRenderer();
    this.initLights();
    this.initTerrain();
    this.initUI();
    this.initEvents();

    this.animate();
  }

  private initScene(): void {
    this.scene = new THREE.Scene();
    this.scene.background = this.createGradientBackground();
    this.scene.fog = new THREE.Fog(0x1A1A3A, 40, 80);
  }

  private createGradientBackground(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#0A0A1A');
    gradient.addColorStop(1, '#1A1A3A');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 512);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  private initCamera(): void {
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.updateCameraPosition();
  }

  private updateCameraPosition(): void {
    const x = this.cameraDistance * Math.sin(this.cameraPhi) * Math.cos(this.cameraTheta);
    const y = this.cameraDistance * Math.cos(this.cameraPhi);
    const z = this.cameraDistance * Math.sin(this.cameraPhi) * Math.sin(this.cameraTheta);

    this.camera.position.set(
      x + this.cameraTarget.x,
      y + this.cameraTarget.y,
      z + this.cameraTarget.z
    );
    this.camera.lookAt(this.cameraTarget);
  }

  private initRenderer(): void {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    this.container.appendChild(this.renderer.domElement);
  }

  private initLights(): void {
    const ambientLight = new THREE.AmbientLight(0x888888, 0.3);
    this.scene.add(ambientLight);

    const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x4CAF50, 0.4);
    this.scene.add(hemisphereLight);

    const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;

    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.left = -30;
    directionalLight.shadow.camera.right = 30;
    directionalLight.shadow.camera.top = 30;
    directionalLight.shadow.camera.bottom = -30;
    directionalLight.shadow.bias = -0.0001;

    this.scene.add(directionalLight);
  }

  private initTerrain(): void {
    this.terrainGenerator = new TerrainGenerator(30, 1);
    this.terrainGenerator.mesh.position.set(0, 0, 0);
    this.scene.add(this.terrainGenerator.mesh);

    const gridHelper = new THREE.GridHelper(30, 30, 0x444466, 0x333344);
    gridHelper.position.y = -0.01;
    this.scene.add(gridHelper);
  }

  private initUI(): void {
    const controlPanel = document.getElementById('control-panel')!;

    this.uiController = new UIController(controlPanel, this.terrainGenerator, {
      onSmooth: () => this.terrainGenerator.smoothTerrain(),
      onReset: () => {
        this.terrainGenerator.resetTerrain();
        this.cameraTarget.set(0, 0, 0);
      },
      onExport: () => this.exportTerrain(),
      onTextureChange: (index: number) => this.terrainGenerator.setTexture(index),
      onBrushRadiusChange: (radius: number) => this.terrainGenerator.setBrushRadius(radius),
      onBrushStrengthChange: (strength: number) => this.terrainGenerator.setBrushStrength(strength)
    });
  }

  private exportTerrain(): void {
    const json = this.terrainGenerator.exportToJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    const filename = `terrain_${year}${month}${day}_${hours}${minutes}${seconds}.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private initEvents(): void {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    window.addEventListener('mouseup', (e) => this.onMouseUp(e));
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('resize', () => this.onResize());
  }

  private onMouseDown(event: MouseEvent): void {
    this.updateMousePosition(event);

    if (event.button === 0) {
      this.isMouseDown = true;

      if (this.isMouseOnTerrain()) {
        this.isEditing = true;
        const isRaising = !event.shiftKey;
        this.terrainGenerator.startEdit(this.mouse, this.camera, isRaising);
      } else {
        this.isRotating = true;
      }

      this.lastMousePosition = { x: event.clientX, y: event.clientY };
    } else if (event.button === 2) {
      this.isRightMouseDown = true;
      this.lastMousePosition = { x: event.clientX, y: event.clientY };
    }
  }

  private isMouseOnTerrain(): boolean {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.terrainGenerator.mesh);
    return intersects.length > 0;
  }

  private onMouseUp(event: MouseEvent): void {
    if (event.button === 0) {
      this.isMouseDown = false;
      if (this.isEditing) {
        this.terrainGenerator.endEdit();
        this.isEditing = false;
      }
      if (this.isRotating) {
        this.isRotating = false;
      }
    } else if (event.button === 2) {
      this.isRightMouseDown = false;
    }
  }

  private onMouseMove(event: MouseEvent): void {
    this.updateMousePosition(event);

    if (this.isEditing) {
      this.terrainGenerator.moveEdit(this.mouse, this.camera);
    }

    if (this.isRotating) {
      const deltaX = event.clientX - this.lastMousePosition.x;
      const deltaY = event.clientY - this.lastMousePosition.y;

      this.cameraTheta -= deltaX * this.rotateSpeed;
      this.cameraPhi = Math.max(0.1, Math.min(Math.PI - 0.1, this.cameraPhi - deltaY * this.rotateSpeed));

      this.updateCameraPosition();
      this.lastMousePosition = { x: event.clientX, y: event.clientY };
    }

    if (this.isRightMouseDown) {
      this.handlePan(event);
      this.lastMousePosition = { x: event.clientX, y: event.clientY };
    }
  }

  private handlePan(event: MouseEvent): void {
    const deltaX = event.clientX - this.lastMousePosition.x;
    const deltaY = event.clientY - this.lastMousePosition.y;

    const right = new THREE.Vector3();
    const up = new THREE.Vector3();
    this.camera.getWorldDirection(right);
    right.cross(this.camera.up).normalize();
    up.copy(this.camera.up);

    const panAmount = this.panSpeed * this.cameraDistance;

    this.cameraTarget.addScaledVector(right, -deltaX * panAmount);
    this.cameraTarget.addScaledVector(up, deltaY * panAmount);

    this.updateCameraPosition();
  }

  private onWheel(event: WheelEvent): void {
    event.preventDefault();
    const zoomFactor = event.deltaY > 0 ? 1.1 : 0.9;
    this.targetDistance *= zoomFactor;
    this.targetDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.targetDistance));
  }

  private updateMousePosition(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private onResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();

    if (this.cameraDistance !== this.targetDistance) {
      this.cameraDistance += (this.targetDistance - this.cameraDistance) * this.zoomDamping;
      if (Math.abs(this.cameraDistance - this.targetDistance) < 0.01) {
        this.cameraDistance = this.targetDistance;
      }
      this.updateCameraPosition();
    }

    this.terrainGenerator.update(delta);

    this.renderer.render(this.scene, this.camera);
  };

  public dispose(): void {
    cancelAnimationFrame(this.animationId);
    this.terrainGenerator.dispose();
    this.renderer.dispose();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new TerrainEditorApp();
});
