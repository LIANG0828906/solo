import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { eventBus, SIMULATION_UPDATE, HEATMAP_UPDATE, APP_READY, FISH_CLICKED } from './EventBus';
import type { FishData, HeatmapCell } from './OceanData';

const SCENE_RADIUS = 30;
const MAX_DEPTH = 15;
const FISH_VISIBLE_THRESHOLD = 150;
const TRAIL_POINT_COUNT = 50;
const TRAIL_SPACING = 0.05;
const HEATMAP_CELL_SIZE = 3;

interface FishState {
  data: FishData;
  currentPosition: THREE.Vector3;
  targetPosition: THREE.Vector3;
}

export class SceneManager {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private clock: THREE.Clock;

  private fishGroup: THREE.Group;
  private coralGroup: THREE.Group;
  private particles: THREE.Points;
  private seabed: THREE.Mesh;

  private fishMeshes: Map<number, THREE.Group> = new Map();
  private fishTrails: Map<number, THREE.Points> = new Map();
  private fishStates: Map<number, FishState> = new Map();
  private selectedFishId: number | null = null;
  private selectedFishTrailHistory: THREE.Vector3[] = [];
  private lastTrailPointPosition: THREE.Vector3 | null = null;

  private heatmapPlane: THREE.Mesh | null = null;
  private heatmapCanvas: HTMLCanvasElement;
  private heatmapTexture: THREE.CanvasTexture | null = null;
  private heatmapVisible: boolean = false;
  private latestHeatmapData: HeatmapCell[] = [];

  private animationId: number | null = null;
  private isRunning: boolean = false;

  private initialCameraPosition: THREE.Vector3 = new THREE.Vector3(0, 5, 20);
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  private fps: number = 60;
  private frameTime: number = 0;
  private frameCount: number = 0;
  private simulationFrameCount: number = 0;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with id "${containerId}" not found`);
    }
    this.container = container;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0B132B);
    this.scene.fog = new THREE.FogExp2(0x0B132B, 0.015);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.copy(this.initialCameraPosition);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 60;
    this.controls.maxPolarAngle = Math.PI * 0.85;

    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.fishGroup = new THREE.Group();
    this.coralGroup = new THREE.Group();
    this.particles = new THREE.Points();
    this.seabed = new THREE.Mesh();

    this.heatmapCanvas = document.createElement('canvas');
    this.heatmapCanvas.width = 512;
    this.heatmapCanvas.height = 512;

    this.setupLights();
    this.createSeabed();
    this.createCorals();
    this.createParticles();

    this.scene.add(this.fishGroup);
    this.scene.add(this.coralGroup);
    this.scene.add(this.particles);

    this.setupEventListeners();
    this.setupBusListeners();
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0x4a6fa5, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0x87CEEB, 0.8);
    directionalLight.position.set(10, 20, 10);
    this.scene.add(directionalLight);

    const pointLight1 = new THREE.PointLight(0x48DBFB, 0.6, 30);
    pointLight1.position.set(-10, -5, -10);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xFF6B6B, 0.4, 25);
    pointLight2.position.set(10, -8, 5);
    this.scene.add(pointLight2);
  }

  private createSeabed(): void {
    const geometry = new THREE.PlaneGeometry(SCENE_RADIUS * 2.5, SCENE_RADIUS * 2.5, 80, 80);
    geometry.rotateX(-Math.PI / 2);

    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const dist = Math.sqrt(x * x + z * z);
      const noise = this.simpleNoise(x * 0.15, z * 0.15) * 2;
      const edgeDrop = Math.max(0, (dist - SCENE_RADIUS * 0.7) / (SCENE_RADIUS * 0.3)) * 5;
      positions.setY(i, -MAX_DEPTH + noise - edgeDrop);
    }

    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      color: 0x3d5c5c,
      roughness: 0.9,
      metalness: 0.1,
      flatShading: true
    });

    this.seabed = new THREE.Mesh(geometry, material);
    this.seabed.receiveShadow = true;
    this.scene.add(this.seabed);
  }

  private simpleNoise(x: number, z: number): number {
    return (
      Math.sin(x * 1.5) * Math.cos(z * 1.2) * 1.5 +
      Math.sin(x * 2.7 + 1.3) * Math.cos(z * 2.1 + 0.8) * 0.8 +
      Math.sin(x * 0.8) * Math.cos(z * 0.9) * 2
    );
  }

  private createCorals(): void {
    const coralColors = [0xFF6B6B, 0xFF9F43, 0x48DBFB, 0x1DD1A1, 0xF368E0];
    const coralCount = 40;

    for (let i = 0; i < coralCount; i++) {
      const coral = new THREE.Group();
      const colorIndex = Math.floor(Math.random() * coralColors.length);
      const baseColor = new THREE.Color(coralColors[colorIndex]);

      const x = (Math.random() - 0.5) * SCENE_RADIUS * 1.6;
      const z = (Math.random() - 0.5) * SCENE_RADIUS * 1.6;
      const dist = Math.sqrt(x * x + z * z);
      if (dist > SCENE_RADIUS * 0.8) continue;

      const baseHeight = 1 + Math.random() * 4;
      const baseRadius = 0.3 + Math.random() * 0.8;

      const baseGeometry = new THREE.CylinderGeometry(
        baseRadius * 0.6,
        baseRadius,
        baseHeight,
        8
      );
      const baseMaterial = new THREE.MeshStandardMaterial({
        color: baseColor,
        roughness: 0.8,
        metalness: 0.1
      });
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.position.y = baseHeight / 2;
      coral.add(base);

      const branchCount = Math.floor(Math.random() * 4) + 2;
      for (let j = 0; j < branchCount; j++) {
        const branchHeight = baseHeight * (0.4 + Math.random() * 0.6);
        const branchRadius = baseRadius * (0.3 + Math.random() * 0.4);
        const branchGeometry = new THREE.ConeGeometry(branchRadius, branchHeight, 6);
        const branchMaterial = new THREE.MeshStandardMaterial({
          color: baseColor.clone().offsetHSL(Math.random() * 0.05, 0, Math.random() * 0.1 - 0.05),
          roughness: 0.75,
          metalness: 0.15
        });
        const branch = new THREE.Mesh(branchGeometry, branchMaterial);
        branch.position.y = baseHeight * 0.5 + Math.random() * baseHeight * 0.4;
        branch.position.x = (Math.random() - 0.5) * baseRadius * 0.8;
        branch.position.z = (Math.random() - 0.5) * baseRadius * 0.8;
        branch.rotation.x = (Math.random() - 0.5) * 0.6;
        branch.rotation.z = (Math.random() - 0.5) * 0.6;
        coral.add(branch);
      }

      const sphereCount = Math.floor(Math.random() * 5) + 1;
      for (let j = 0; j < sphereCount; j++) {
        const sphereRadius = 0.15 + Math.random() * 0.3;
        const sphereGeometry = new THREE.SphereGeometry(sphereRadius, 8, 8);
        const sphereMaterial = new THREE.MeshStandardMaterial({
          color: baseColor.clone().offsetHSL(0, 0, Math.random() * 0.1),
          roughness: 0.6,
          metalness: 0.2
        });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.y = baseHeight * (0.3 + Math.random() * 0.7);
        sphere.position.x = (Math.random() - 0.5) * baseRadius;
        sphere.position.z = (Math.random() - 0.5) * baseRadius;
        coral.add(sphere);
      }

      coral.position.set(x, -MAX_DEPTH + 0.5, z);
      coral.rotation.y = Math.random() * Math.PI * 2;
      this.coralGroup.add(coral);
    }
  }

  private createParticles(): void {
    const particleCount = 500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * SCENE_RADIUS * 2;
      positions[i3 + 1] = -Math.random() * MAX_DEPTH * 0.9;
      positions[i3 + 2] = (Math.random() - 0.5) * SCENE_RADIUS * 2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xA8D8EA,
      size: 0.08,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    this.particles = new THREE.Points(geometry, material);
  }

  private createFishMesh(fishData: FishData): THREE.Group {
    const fishGroup = new THREE.Group();
    fishGroup.userData.fishId = fishData.id;

    const bodyGeometry = new THREE.SphereGeometry(fishData.size, 8, 6);
    bodyGeometry.scale(1.5, 1, 1);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: fishData.depthColor,
      roughness: 0.5,
      metalness: 0.3,
      emissive: fishData.depthColor.clone().multiplyScalar(0.1)
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.name = 'body';
    fishGroup.add(body);

    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.quadraticCurveTo(fishData.size * 0.8, fishData.size * 0.5, 0, fishData.size * 0.8);
    wingShape.quadraticCurveTo(-fishData.size * 0.3, fishData.size * 0.3, 0, 0);

    const wingGeometry = new THREE.ShapeGeometry(wingShape);
    const wingMaterial = new THREE.MeshStandardMaterial({
      color: fishData.depthColor.clone().multiplyScalar(0.9),
      roughness: 0.6,
      metalness: 0.2,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    });

    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.rotation.y = Math.PI / 2;
    leftWing.position.set(-fishData.size * 0.3, 0, 0);
    leftWing.name = 'leftWing';
    fishGroup.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.rotation.y = -Math.PI / 2;
    rightWing.position.set(fishData.size * 0.3, 0, 0);
    rightWing.name = 'rightWing';
    fishGroup.add(rightWing);

    const eyeGeometry = new THREE.SphereGeometry(fishData.size * 0.12, 6, 6);
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      roughness: 0.3,
      metalness: 0.5
    });
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(fishData.size * 0.9, fishData.size * 0.15, -fishData.size * 0.25);
    fishGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(fishData.size * 0.9, fishData.size * 0.15, fishData.size * 0.25);
    fishGroup.add(rightEye);

    fishGroup.position.copy(fishData.position);

    return fishGroup;
  }

  private createFishTrail(fishData: FishData): THREE.Points {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(TRAIL_POINT_COUNT * 3);
    const colors = new Float32Array(TRAIL_POINT_COUNT * 3);

    for (let i = 0; i < TRAIL_POINT_COUNT; i++) {
      const i3 = i * 3;
      const pos = fishData.trail[i] || fishData.position;
      positions[i3] = pos.x;
      positions[i3 + 1] = pos.y;
      positions[i3 + 2] = pos.z;

      const alpha = 1 - i / TRAIL_POINT_COUNT;
      colors[i3] = fishData.depthColor.r * alpha;
      colors[i3 + 1] = fishData.depthColor.g * alpha;
      colors[i3 + 2] = fishData.depthColor.b * alpha;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    const trail = new THREE.Points(geometry, material);
    trail.visible = false;
    trail.userData.fishId = fishData.id;

    return trail;
  }

  public createFishes(fishes: FishData[]): void {
    for (const fishData of fishes) {
      const fishMesh = this.createFishMesh(fishData);
      this.fishMeshes.set(fishData.id, fishMesh);
      this.fishGroup.add(fishMesh);

      const trail = this.createFishTrail(fishData);
      this.fishTrails.set(fishData.id, trail);
      this.fishGroup.add(trail);

      this.fishStates.set(fishData.id, {
        data: fishData,
        currentPosition: fishData.position.clone(),
        targetPosition: fishData.targetPosition.clone()
      });
    }

    this.optimizeFishVisibility();
  }

  private optimizeFishVisibility(): void {
    const fishCount = this.fishMeshes.size;
    if (fishCount <= FISH_VISIBLE_THRESHOLD) {
      this.fishMeshes.forEach((mesh) => {
        mesh.visible = true;
      });
      return;
    }

    const fishEntries = Array.from(this.fishMeshes.entries());
    fishEntries.sort((a, b) => {
      const distA = a[1].position.distanceTo(this.camera.position);
      const distB = b[1].position.distanceTo(this.camera.position);
      return distA - distB;
    });

    for (let i = 0; i < fishEntries.length; i++) {
      const [, mesh] = fishEntries[i];
      mesh.visible = i < FISH_VISIBLE_THRESHOLD;
    }
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.onWindowResize.bind(this));
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    this.renderer.domElement.addEventListener('click', this.onMouseClick.bind(this));
  }

  private setupBusListeners(): void {
    eventBus.on(SIMULATION_UPDATE, this.onSimulationUpdate.bind(this));
    eventBus.on(HEATMAP_UPDATE, this.onHeatmapUpdate.bind(this));
  }

  private onSimulationUpdate(data: { fishes: FishData[]; frameCount: number }): void {
    this.simulationFrameCount = data.frameCount;

    for (const fishData of data.fishes) {
      const state = this.fishStates.get(fishData.id);
      if (state) {
        state.data = fishData;
        state.targetPosition.copy(fishData.position);
      }
    }
  }

  private onHeatmapUpdate(heatmapData: HeatmapCell[]): void {
    this.latestHeatmapData = heatmapData;
    if (this.heatmapVisible) {
      this.updateHeatmapTexture(heatmapData);
    }
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'h' || event.key === 'H') {
      this.toggleHeatmap();
    }
  }

  private onMouseClick(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const fishMeshes: THREE.Object3D[] = [];
    this.fishMeshes.forEach((mesh) => {
      if (mesh.visible) {
        fishMeshes.push(mesh);
      }
    });

    const intersects = this.raycaster.intersectObjects(fishMeshes, true);

    if (intersects.length > 0) {
      let fishGroup: THREE.Object3D | null = intersects[0].object;
      while (fishGroup && fishGroup.userData.fishId === undefined) {
        fishGroup = fishGroup.parent;
      }

      if (fishGroup && fishGroup.userData.fishId !== undefined) {
        const fishId = fishGroup.userData.fishId as number;
        this.selectFish(fishId);
        eventBus.emit(FISH_CLICKED, fishId);
      }
    }
  }

  private selectFish(fishId: number): void {
    if (this.selectedFishId === fishId) return;

    if (this.selectedFishId !== null) {
      this.deselectFish(this.selectedFishId);
    }

    this.selectedFishId = fishId;
    this.selectedFishTrailHistory = [];
    this.lastTrailPointPosition = null;

    const fishMesh = this.fishMeshes.get(fishId);
    const state = this.fishStates.get(fishId);
    if (fishMesh) {
      const body = fishMesh.getObjectByName('body');
      if (body instanceof THREE.Mesh && body.material instanceof THREE.MeshStandardMaterial) {
        body.material.emissive.copy(body.material.color).multiplyScalar(0.5);
        body.material.emissiveIntensity = 1.5;
      }
    }

    const trail = this.fishTrails.get(fishId);
    if (trail) {
      trail.visible = true;
      (trail.material as THREE.PointsMaterial).opacity = 0.8;
    }

    if (state) {
      const startPos = state.currentPosition.clone();
      for (let i = 0; i < TRAIL_POINT_COUNT; i++) {
        this.selectedFishTrailHistory.push(startPos.clone());
      }
      this.lastTrailPointPosition = startPos.clone();
      this.updateSelectedFishTrailGeometry();
    }

    setTimeout(() => {
      if (this.selectedFishId === fishId) {
        this.deselectFish(fishId);
        this.selectedFishId = null;
      }
    }, 5000);
  }

  private deselectFish(fishId: number): void {
    const fishMesh = this.fishMeshes.get(fishId);
    if (fishMesh) {
      const body = fishMesh.getObjectByName('body');
      if (body instanceof THREE.Mesh && body.material instanceof THREE.MeshStandardMaterial) {
        body.material.emissive.copy(body.material.color).multiplyScalar(0.1);
        body.material.emissiveIntensity = 1;
      }
    }

    const trail = this.fishTrails.get(fishId);
    if (trail) {
      const fadeOut = () => {
        const mat = trail.material as THREE.PointsMaterial;
        if (mat.opacity > 0) {
          mat.opacity -= 0.03;
          requestAnimationFrame(fadeOut);
        } else {
          trail.visible = false;
          mat.opacity = 0.8;
        }
      };
      fadeOut();
    }
  }

  private updateSelectedFishTrailGeometry(): void {
    if (this.selectedFishId === null) return;

    const state = this.fishStates.get(this.selectedFishId);
    const trail = this.fishTrails.get(this.selectedFishId);
    if (!state || !trail) return;

    const positions = trail.geometry.attributes.position as THREE.BufferAttribute;
    const colors = trail.geometry.attributes.color as THREE.BufferAttribute;

    for (let i = 0; i < TRAIL_POINT_COUNT; i++) {
      const i3 = i * 3;
      const pos = this.selectedFishTrailHistory[i] || state.currentPosition;
      positions.setXYZ(i, pos.x, pos.y, pos.z);

      const alpha = (1 - i / TRAIL_POINT_COUNT);
      colors.setXYZ(
        i,
        state.data.depthColor.r * alpha,
        state.data.depthColor.g * alpha,
        state.data.depthColor.b * alpha
      );
    }

    positions.needsUpdate = true;
    colors.needsUpdate = true;
  }

  private addTrailPoint(position: THREE.Vector3): void {
    if (!this.lastTrailPointPosition) {
      this.lastTrailPointPosition = position.clone();
      return;
    }

    const dist = position.distanceTo(this.lastTrailPointPosition);
    if (dist >= TRAIL_SPACING) {
      this.selectedFishTrailHistory.unshift(position.clone());
      if (this.selectedFishTrailHistory.length > TRAIL_POINT_COUNT) {
        this.selectedFishTrailHistory.pop();
      }
      this.lastTrailPointPosition = position.clone();
      this.updateSelectedFishTrailGeometry();
    }
  }

  public toggleHeatmap(): void {
    this.heatmapVisible = !this.heatmapVisible;

    if (this.heatmapVisible) {
      this.showHeatmap();
    } else {
      this.hideHeatmap();
    }

    const btn = document.getElementById('heatmap-btn');
    if (btn) {
      btn.classList.toggle('active', this.heatmapVisible);
    }
  }

  private showHeatmap(): void {
    if (!this.heatmapPlane) {
      this.createHeatmapPlane();
    }
    if (this.heatmapPlane) {
      this.heatmapPlane.visible = true;
      if (this.latestHeatmapData.length > 0) {
        this.updateHeatmapTexture(this.latestHeatmapData);
      }
    }
  }

  private hideHeatmap(): void {
    if (this.heatmapPlane) {
      this.heatmapPlane.visible = false;
    }
  }

  private createHeatmapPlane(): void {
    const heatmapSize = SCENE_RADIUS * 2;

    const geometry = new THREE.PlaneGeometry(heatmapSize, heatmapSize);
    geometry.rotateX(-Math.PI / 2);

    this.heatmapTexture = new THREE.CanvasTexture(this.heatmapCanvas);
    this.heatmapTexture.needsUpdate = true;

    const material = new THREE.MeshBasicMaterial({
      map: this.heatmapTexture,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    this.heatmapPlane = new THREE.Mesh(geometry, material);
    this.heatmapPlane.position.y = 1;
    this.scene.add(this.heatmapPlane);
  }

  private updateHeatmapTexture(heatmapData: HeatmapCell[]): void {
    const ctx = this.heatmapCanvas.getContext('2d');
    if (!ctx) return;

    const canvasSize = this.heatmapCanvas.width;
    const heatmapSize = SCENE_RADIUS * 2;
    const scale = canvasSize / heatmapSize;

    ctx.clearRect(0, 0, canvasSize, canvasSize);

    for (const cell of heatmapData) {
      const x = (cell.x + SCENE_RADIUS) * scale;
      const y = (cell.z + SCENE_RADIUS) * scale;
      const radius = HEATMAP_CELL_SIZE * scale * 1.5;

      const cellGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      const alpha = cell.density * 0.6;

      if (cell.density > 0.7) {
        cellGradient.addColorStop(0, `rgba(255, 50, 50, ${alpha})`);
        cellGradient.addColorStop(0.5, `rgba(255, 150, 0, ${alpha * 0.5})`);
        cellGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
      } else if (cell.density > 0.3) {
        cellGradient.addColorStop(0, `rgba(0, 255, 200, ${alpha})`);
        cellGradient.addColorStop(0.5, `rgba(0, 200, 255, ${alpha * 0.5})`);
        cellGradient.addColorStop(1, 'rgba(0, 100, 255, 0)');
      } else {
        cellGradient.addColorStop(0, `rgba(50, 100, 255, ${alpha * 0.5})`);
        cellGradient.addColorStop(1, 'rgba(0, 50, 200, 0)');
      }

      ctx.fillStyle = cellGradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this.heatmapTexture) {
      this.heatmapTexture.needsUpdate = true;
    }
  }

  public resetCamera(): void {
    this.camera.position.copy(this.initialCameraPosition);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.clock.start();
    this.animate();
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private animate(): void {
    if (!this.isRunning) return;

    this.animationId = requestAnimationFrame(this.animate.bind(this));

    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    this.frameTime += delta;
    this.frameCount++;

    if (this.frameTime >= 1) {
      this.fps = this.frameCount / this.frameTime;
      this.frameTime = 0;
      this.frameCount = 0;
    }

    this.updateFishes(delta, time);
    this.updateParticles(delta, time);

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  private updateFishes(delta: number, time: number): void {
    const lerpFactor = Math.min(delta * 5, 0.5);

    this.fishStates.forEach((state, fishId) => {
      const fishMesh = this.fishMeshes.get(fishId);
      if (!fishMesh) return;

      state.currentPosition.lerp(state.targetPosition, lerpFactor);
      fishMesh.position.copy(state.currentPosition);

      const direction = state.targetPosition.clone().sub(state.currentPosition).normalize();
      if (direction.length() > 0.001) {
        fishMesh.lookAt(fishMesh.position.clone().add(direction));
      }

      const body = fishMesh.getObjectByName('body');
      if (body instanceof THREE.Mesh && body.material instanceof THREE.MeshStandardMaterial) {
        body.material.color.copy(state.data.depthColor);
        if (fishId !== this.selectedFishId) {
          body.material.emissive.copy(state.data.depthColor).multiplyScalar(0.1);
        }
      }

      const leftWing = fishMesh.getObjectByName('leftWing');
      const rightWing = fishMesh.getObjectByName('rightWing');
      const wingAngle = Math.sin(time * 8 + fishId * 0.5) * 0.5;
      if (leftWing) {
        leftWing.rotation.z = wingAngle;
      }
      if (rightWing) {
        rightWing.rotation.z = -wingAngle;
      }
    });

    if (this.selectedFishId !== null) {
      const selectedState = this.fishStates.get(this.selectedFishId);
      if (selectedState) {
        this.addTrailPoint(selectedState.currentPosition);
      }
    }
  }

  private updateParticles(delta: number, time: number): void {
    const positions = this.particles.geometry.attributes.position as THREE.BufferAttribute;
    const posArray = positions.array as Float32Array;

    for (let i = 0; i < positions.count; i++) {
      const i3 = i * 3;
      posArray[i3 + 1] += Math.sin(time * 0.5 + i * 0.1) * 0.002;
      posArray[i3] += Math.sin(time * 0.3 + i * 0.2) * 0.001;
      if (posArray[i3 + 1] > 0) {
        posArray[i3 + 1] = -MAX_DEPTH * 0.9;
      }
    }

    positions.needsUpdate = true;
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  public getHeatmapVisible(): boolean {
    return this.heatmapVisible;
  }

  public destroy(): void {
    this.stop();
    window.removeEventListener('resize', this.onWindowResize.bind(this));
    window.removeEventListener('keydown', this.onKeyDown.bind(this));
    this.renderer.domElement.removeEventListener('click', this.onMouseClick.bind(this));
    this.renderer.dispose();
  }
}
