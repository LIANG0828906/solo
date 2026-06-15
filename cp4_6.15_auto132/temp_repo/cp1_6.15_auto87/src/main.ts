import * as THREE from 'three';
import { BuildingManager } from './buildingManager';
import { WindParticles } from './windParticles';
import { UIControls } from './uiControls';

class UrbanWindVisualization {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private container: HTMLElement;

  private buildingManager: BuildingManager;
  private windParticles: WindParticles;
  private uiControls: UIControls;

  private isDragging: boolean = false;
  private previousMouse: { x: number; y: number } = { x: 0, y: 0 };
  private spherical: { radius: number; theta: number; phi: number };
  private lookAt: THREE.Vector3 = new THREE.Vector3(0, 20, 0);

  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private mouse: THREE.Vector2 = new THREE.Vector2();
  private hoveredMesh: THREE.Mesh | null = null;

  private clock: THREE.Clock = new THREE.Clock();
  private fpsSamples: number[] = [];
  private lastFpsUpdate: number = 0;
  private currentFps: number = 60;
  private frameCount: number = 0;
  private fpsCheckInterval: number = 500;

  constructor() {
    this.container = document.getElementById('canvas-container')!;

    this.scene = this.createScene();
    this.camera = this.createCamera();
    this.renderer = this.createRenderer();
    this.container.appendChild(this.renderer.domElement);

    const initAngle = Math.PI / 4;
    const initRadius = 260;
    this.spherical = {
      radius: initRadius,
      theta: Math.PI / 4,
      phi: Math.PI / 2 - initAngle
    };
    this.updateCameraFromSpherical();

    this.createGround();
    this.createLighting();
    this.createRoadsAndGreenery();

    this.buildingManager = new BuildingManager(this.scene, this.camera, this.renderer.domElement);
    this.windParticles = new WindParticles(this.scene, 20, {
      minX: -160,
      maxX: 160,
      minZ: -130,
      maxZ: 130
    });
    this.uiControls = new UIControls(this.buildingManager, this.windParticles, this.camera);

    this.bindEvents();
    this.handleResize();
    this.animate();
  }

  private createScene(): THREE.Scene {
    const scene = new THREE.Scene();

    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#1a2a4a');
    gradient.addColorStop(0.5, '#3a5a7a');
    gradient.addColorStop(1, '#8aa8c8');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 512);

    const bgTexture = new THREE.CanvasTexture(canvas);
    bgTexture.needsUpdate = true;
    scene.background = bgTexture;

    scene.fog = new THREE.Fog(0x6a8aaa, 250, 500);

    return scene;
  }

  private createCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    return camera;
  }

  private createRenderer(): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    return renderer;
  }

  private createGround(): void {
    const size = 600;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#5a7080';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = 'rgba(100, 130, 160, 0.25)';
    ctx.lineWidth = 1;

    const gridSize = 32;
    for (let i = 0; i <= 512; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(size / 50, size / 50);
    texture.needsUpdate = true;

    const geometry = new THREE.PlaneGeometry(size, size);
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.95,
      metalness: 0.0
    });

    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  private createRoadsAndGreenery(): void {
    const roadMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a4a5a,
      roughness: 0.9,
      metalness: 0.0
    });

    const roadPositions = [
      { x: 0, z: 0, w: 12, d: 260, rot: 0 },
      { x: 0, z: 0, w: 260, d: 12, rot: 0 },
      { x: -60, z: 0, w: 8, d: 260, rot: 0 },
      { x: 60, z: 0, w: 8, d: 260, rot: 0 },
      { x: 0, z: -60, w: 260, d: 8, rot: 0 },
      { x: 0, z: 60, w: 260, d: 8, rot: 0 },
    ];

    for (const road of roadPositions) {
      const geo = new THREE.PlaneGeometry(road.w, road.d);
      const mesh = new THREE.Mesh(geo, roadMaterial);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(road.x, 0.02, road.z);
      mesh.receiveShadow = true;
      this.scene.add(mesh);
    }

    const greenMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a7a5a,
      roughness: 0.95
    });

    const greenSpots = [
      { x: -90, z: -90, w: 18, d: 18 },
      { x: 90, z: -90, w: 18, d: 18 },
      { x: -90, z: 90, w: 18, d: 18 },
      { x: 90, z: 90, w: 18, d: 18 },
      { x: 0, z: 0, w: 10, d: 10 },
    ];

    for (const spot of greenSpots) {
      const geo = new THREE.CircleGeometry(Math.min(spot.w, spot.d) / 2, 24);
      const mesh = new THREE.Mesh(geo, greenMaterial);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(spot.x, 0.04, spot.z);
      mesh.receiveShadow = true;
      this.scene.add(mesh);
    }

    const treeTrunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a4030,
      roughness: 0.9
    });
    const treeFoliageMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a6a4a,
      roughness: 0.85
    });

    const treePositions = [
      [-85, -85], [-80, -92], [-92, -80],
      [85, -85], [80, -92], [92, -80],
      [-85, 85], [-80, 92], [-92, 80],
      [85, 85], [80, 92], [92, 80],
      [-110, 0], [110, 0], [0, -110], [0, 110],
    ];

    for (const [tx, tz] of treePositions) {
      const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 3, 8);
      const trunk = new THREE.Mesh(trunkGeo, treeTrunkMaterial);
      trunk.position.set(tx, 1.5, tz);
      trunk.castShadow = true;
      this.scene.add(trunk);

      const foliageGeo = new THREE.SphereGeometry(2.5, 8, 6);
      const foliage = new THREE.Mesh(foliageGeo, treeFoliageMaterial);
      foliage.position.set(tx, 5, tz);
      foliage.castShadow = true;
      this.scene.add(foliage);
    }
  }

  private createLighting(): void {
    const ambient = new THREE.AmbientLight(0xd0dce8, 0.55);
    this.scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0xa0c0e0, 0x607060, 0.4);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff5e0, 1.1);
    sun.position.set(80, 120, 60);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.left = -180;
    sun.shadow.camera.right = 180;
    sun.shadow.camera.top = 180;
    sun.shadow.camera.bottom = -180;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 400;
    sun.shadow.bias = -0.0003;
    this.scene.add(sun);

    const fillLight = new THREE.DirectionalLight(0xb0c8e0, 0.3);
    fillLight.position.set(-60, 80, -40);
    this.scene.add(fillLight);
  }

  private updateCameraFromSpherical(): void {
    const sinPhi = Math.sin(this.spherical.phi);
    const cosPhi = Math.cos(this.spherical.phi);
    const sinTheta = Math.sin(this.spherical.theta);
    const cosTheta = Math.cos(this.spherical.theta);

    this.camera.position.set(
      this.lookAt.x + this.spherical.radius * sinPhi * cosTheta,
      this.lookAt.y + this.spherical.radius * cosPhi,
      this.lookAt.z + this.spherical.radius * sinPhi * sinTheta
    );

    this.camera.lookAt(this.lookAt);
  }

  private bindEvents(): void {
    const dom = this.renderer.domElement;

    dom.addEventListener('pointerdown', this.onPointerDown.bind(this));
    dom.addEventListener('pointermove', this.onPointerMove.bind(this));
    dom.addEventListener('pointerup', this.onPointerUp.bind(this));
    dom.addEventListener('pointerleave', this.onPointerUp.bind(this));
    dom.addEventListener('click', this.onClick.bind(this));

    dom.addEventListener('wheel', this.onWheel.bind(this), { passive: false });

    window.addEventListener('resize', this.handleResize.bind(this));
  }

  private onPointerDown(e: PointerEvent): void {
    this.isDragging = true;
    this.previousMouse = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  private onPointerMove(e: PointerEvent): void {
    this.updateMouse(e.clientX, e.clientY);

    if (this.isDragging) {
      const deltaX = e.clientX - this.previousMouse.x;
      const deltaY = e.clientY - this.previousMouse.y;

      this.spherical.theta -= deltaX * 0.005;
      this.spherical.phi -= deltaY * 0.005;
      this.spherical.phi = Math.max(0.08, Math.min(Math.PI / 2 - 0.02, this.spherical.phi));

      this.updateCameraFromSpherical();

      this.previousMouse = { x: e.clientX, y: e.clientY };
    }

    this.updateHover();
  }

  private onPointerUp(e: PointerEvent): void {
    this.isDragging = false;
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
  }

  private onClick(_e: MouseEvent): void {
    if (this.hoveredMesh && this.buildingManager.isBuildingMesh(this.hoveredMesh)) {
      this.uiControls.showInfoPanel(this.hoveredMesh);
    }
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 1.08 : 0.92;
    this.spherical.radius = Math.max(80, Math.min(500, this.spherical.radius * zoomFactor));
    this.updateCameraFromSpherical();
  }

  private handleResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  private updateMouse(clientX: number, clientY: number): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  }

  private updateHover(): void {
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const buildingMeshes: THREE.Mesh[] = [];
    this.buildingManager.buildingsGroup.traverse((obj) => {
      if (
        obj instanceof THREE.Mesh &&
        this.buildingManager.isBuildingMesh(obj)
      ) {
        buildingMeshes.push(obj);
      }
    });

    const intersects = this.raycaster.intersectObjects(buildingMeshes, false);

    let newHovered: THREE.Mesh | null = null;
    if (intersects.length > 0) {
      const mesh = intersects[0].object as THREE.Mesh;
      if (this.buildingManager.isBuildingMesh(mesh)) {
        newHovered = mesh;
      }
    }

    if (newHovered !== this.hoveredMesh) {
      this.hoveredMesh = newHovered;
      this.buildingManager.handleHover(newHovered);
      this.renderer.domElement.style.cursor = newHovered ? 'pointer' : 'grab';
    }
  }

  private updateFps(delta: number): void {
    this.frameCount++;
    const now = performance.now();

    if (delta > 0) {
      const instantFps = 1 / delta;
      this.fpsSamples.push(instantFps);
      if (this.fpsSamples.length > 30) {
        this.fpsSamples.shift();
      }
    }

    if (now - this.lastFpsUpdate > this.fpsCheckInterval) {
      if (this.fpsSamples.length > 0) {
        this.currentFps = this.fpsSamples.reduce((a, b) => a + b, 0) / this.fpsSamples.length;
      }
      this.lastFpsUpdate = now;
      this.adaptPerformance();
    }
  }

  private adaptPerformance(): void {
    if (this.currentFps < 55 && this.currentFps >= 45) {
      this.windParticles.setUpdateFrequency(1);
    } else if (this.currentFps < 45) {
      this.windParticles.setUpdateFrequency(2);
    } else {
      this.windParticles.setUpdateFrequency(1);
    }

    if (this.currentFps < 40) {
      this.renderer.setPixelRatio(Math.max(1, this.renderer.getPixelRatio() - 0.1));
    }
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();

    this.updateFps(delta);

    this.windParticles.update(delta);

    this.uiControls.updateResetAnimation(this.lookAt);

    if (!this.isDragging) {
      this.updateCameraFromSpherical();
    }

    this.buildingManager.updateDataLabelPosition();

    this.renderer.render(this.scene, this.camera);
  };
}

window.addEventListener('DOMContentLoaded', () => {
  new UrbanWindVisualization();
});
