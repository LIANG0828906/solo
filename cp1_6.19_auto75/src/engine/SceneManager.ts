import * as THREE from 'three';
import { FabricType } from '../types';
import { fabricData } from '../data/clothing';
import { hexToThreeColor } from '../utils/colors';

export interface SceneManagerOptions {
  canvas?: HTMLCanvasElement;
  width?: number;
  height?: number;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
}

export interface RenderCompleteEvent {
  success: boolean;
  modelUrl?: string;
  error?: string;
}

type RenderCompleteCallback = (event: RenderCompleteEvent) => void;

export class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer | null = null;
  private modelGroup: THREE.Group | null = null;
  private materials: Map<string, THREE.MeshStandardMaterial> = new Map();
  private meshes: Map<string, THREE.Mesh> = new Map();
  private autoRotate: boolean = true;
  private autoRotateSpeed: number = 0.01;
  private isHovering: boolean = false;
  private animationFrameId: number | null = null;
  private renderCompleteCallbacks: Set<RenderCompleteCallback> = new Set();
  private targetColors: Map<string, THREE.Color> = new Map();
  private currentColors: Map<string, THREE.Color> = new Map();
  private colorTransitionProgress: Map<string, number> = new Map();
  private transitionDuration: number = 500;

  constructor(options: SceneManagerOptions = {}) {
    this.scene = new THREE.Scene();

    const { width = 800, height = 600, autoRotate = true, autoRotateSpeed = 0.01 } = options;

    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    this.camera.position.set(0, 0.5, 2.5);
    this.camera.lookAt(0, 0.5, 0);

    this.autoRotate = autoRotate;
    this.autoRotateSpeed = autoRotateSpeed;

    this.setupLighting();

    if (options.canvas) {
      this.setupRenderer(options.canvas, width, height);
    }
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
    keyLight.position.set(2, 3, 2);
    keyLight.castShadow = true;
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-2, 1, -1);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.4);
    rimLight.position.set(0, 2, -2);
    this.scene.add(rimLight);
  }

  private setupRenderer(canvas: HTMLCanvasElement, width: number, height: number): void {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    this.setupInteraction(canvas);
    this.startAnimationLoop();
  }

  private setupInteraction(canvas: HTMLCanvasElement): void {
    let isDragging = false;
    let previousMouseX = 0;
    let previousMouseY = 0;
    let rotationY = 0;
    let rotationX = 0;

    canvas.addEventListener('mouseenter', () => {
      this.isHovering = true;
    });

    canvas.addEventListener('mouseleave', () => {
      this.isHovering = false;
      isDragging = false;
    });

    canvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      previousMouseX = e.clientX;
      previousMouseY = e.clientY;
    });

    canvas.addEventListener('mousemove', (e) => {
      if (!isDragging || !this.modelGroup) return;

      const deltaX = e.clientX - previousMouseX;
      const deltaY = e.clientY - previousMouseY;

      rotationY += deltaX * 0.01;
      rotationX = Math.max(-0.5, Math.min(0.5, rotationX + deltaY * 0.01));

      this.modelGroup.rotation.y = rotationY;
      this.modelGroup.rotation.x = rotationX;

      previousMouseX = e.clientX;
      previousMouseY = e.clientY;
    });

    canvas.addEventListener('mouseup', () => {
      isDragging = false;
    });

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY * 0.001;
      const newZ = this.camera.position.z + delta;
      this.camera.position.z = Math.max(0.8, Math.min(2.0, newZ));
    }, { passive: false });

    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        previousMouseX = e.touches[0].clientX;
        previousMouseY = e.touches[0].clientY;
      }
      this.isHovering = true;
    });

    canvas.addEventListener('touchmove', (e) => {
      if (!isDragging || !this.modelGroup || e.touches.length !== 1) return;

      const deltaX = e.touches[0].clientX - previousMouseX;
      const deltaY = e.touches[0].clientY - previousMouseY;

      rotationY += deltaX * 0.01;
      rotationX = Math.max(-0.5, Math.min(0.5, rotationX + deltaY * 0.01));

      this.modelGroup.rotation.y = rotationY;
      this.modelGroup.rotation.x = rotationX;

      previousMouseX = e.touches[0].clientX;
      previousMouseY = e.touches[0].clientY;
    });

    canvas.addEventListener('touchend', () => {
      isDragging = false;
      this.isHovering = false;
    });
  }

  private startAnimationLoop(): void {
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      if (this.autoRotate && !this.isHovering && this.modelGroup) {
        this.modelGroup.rotation.y += this.autoRotateSpeed * (deltaTime / 16);
      }

      this.updateColorTransitions(deltaTime);

      if (this.renderer) {
        this.renderer.render(this.scene, this.camera);
      }

      this.animationFrameId = requestAnimationFrame(animate);
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  private updateColorTransitions(deltaTime: number): void {
    this.colorTransitionProgress.forEach((progress, partId) => {
      if (progress >= 1) {
        this.colorTransitionProgress.delete(partId);
        return;
      }

      const newProgress = Math.min(1, progress + deltaTime / this.transitionDuration);
      this.colorTransitionProgress.set(partId, newProgress);

      const material = this.materials.get(partId);
      const currentColor = this.currentColors.get(partId);
      const targetColor = this.targetColors.get(partId);

      if (material && currentColor && targetColor) {
        const t = newProgress;
        const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

        material.color.r = currentColor.r + (targetColor.r - currentColor.r) * easeT;
        material.color.g = currentColor.g + (targetColor.g - currentColor.g) * easeT;
        material.color.b = currentColor.b + (targetColor.b - currentColor.b) * easeT;
        material.needsUpdate = true;
      }
    });
  }

  loadModel(modelUrl: string, themeColors: [string, string]): void {
    const startTime = performance.now();

    if (this.modelGroup) {
      this.scene.remove(this.modelGroup);
      this.materials.clear();
      this.meshes.clear();
      this.targetColors.clear();
      this.currentColors.clear();
      this.colorTransitionProgress.clear();
    }

    this.modelGroup = new THREE.Group();

    const dressGeometry = this.createDressGeometry(modelUrl);

    const [color1, color2] = themeColors;
    const parts = ['bodice', 'skirt', 'top', 'pants', 'jacket', 'dress', 'train', 'veil', 'blazer', 'belt'];

    parts.forEach((partId, index) => {
      const geometry = dressGeometry.clone();
      const scale = index % 2 === 0 ? 1 : 0.95;
      geometry.scale(scale, 1, scale);
      geometry.translate(0, -0.1 * index, 0);

      const color = index % 2 === 0 ? color1 : color2;
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(...hexToThreeColor(color)),
        roughness: 0.7,
        metalness: 0.05,
        side: THREE.DoubleSide
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.name = partId;

      this.modelGroup!.add(mesh);
      this.materials.set(partId, material);
      this.meshes.set(partId, mesh);

      const threeColor = new THREE.Color(...hexToThreeColor(color));
      this.currentColors.set(partId, threeColor.clone());
      this.targetColors.set(partId, threeColor.clone());
    });

    this.scene.add(this.modelGroup);

    const loadTime = performance.now() - startTime;
    const success = loadTime < 2000;

    if (!success) {
      console.warn(`Model loading took ${loadTime}ms, exceeds 2s target`);
    }

    this.notifyRenderComplete({
      success,
      modelUrl,
      error: success ? undefined : `Load time exceeded: ${loadTime}ms`
    });
  }

  private createDressGeometry(modelUrl: string): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();

    const modelIndex = parseInt(modelUrl.split('-')[1] || '1', 10);
    const dressType = modelIndex % 4;

    const height = 1.8;
    const width = 0.6 + (dressType * 0.1);
    const flare = 0.3 + (dressType * 0.15);

    const segments = 32;
    const radialSegments = 24;

    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= segments; i++) {
      const y = (i / segments) * height;
      const t = i / segments;

      const bodyWidth = width * (1 - t * 0.3);
      const skirtWidth = width * (1 + t * t * flare * 2);
      const currentWidth = t < 0.4 ? bodyWidth : bodyWidth + (skirtWidth - bodyWidth) * ((t - 0.4) / 0.6);

      for (let j = 0; j <= radialSegments; j++) {
        const angle = (j / radialSegments) * Math.PI * 2;
        const x = Math.cos(angle) * currentWidth * 0.5;
        const z = Math.sin(angle) * currentWidth * 0.3;

        positions.push(x, y, z);

        const nx = Math.cos(angle) * 0.8;
        const ny = 0.2;
        const nz = Math.sin(angle) * 0.8;
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
        normals.push(nx / len, ny / len, nz / len);

        uvs.push(j / radialSegments, 1 - t);
      }
    }

    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < radialSegments; j++) {
        const a = i * (radialSegments + 1) + j;
        const b = a + 1;
        const c = a + radialSegments + 1;
        const d = c + 1;

        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);

    geometry.computeVertexNormals();

    return geometry;
  }

  setColor(partId: string, colorHex: string): void {
    const material = this.materials.get(partId);
    if (!material) return;

    const targetColor = new THREE.Color(...hexToThreeColor(colorHex));
    const currentColor = material.color.clone();

    this.currentColors.set(partId, currentColor);
    this.targetColors.set(partId, targetColor);
    this.colorTransitionProgress.set(partId, 0);
  }

  setAllColors(colors: Record<string, string>): void {
    Object.entries(colors).forEach(([partId, colorHex]) => {
      this.setColor(partId, colorHex);
    });
  }

  setFabric(fabricType: FabricType): void {
    const fabric = fabricData[fabricType];

    this.materials.forEach((material) => {
      material.roughness = fabric.roughness;
      material.metalness = fabric.metalness;
      material.needsUpdate = true;
    });
  }

  setThemeColors(colors: [string, string]): void {
    const [primary, secondary] = colors;
    const partIds = Array.from(this.materials.keys());

    partIds.forEach((partId, index) => {
      this.setColor(partId, index % 2 === 0 ? primary : secondary);
    });
  }

  setAutoRotate(enabled: boolean): void {
    this.autoRotate = enabled;
  }

  setAutoRotateSpeed(speed: number): void {
    this.autoRotateSpeed = speed;
  }

  resetCamera(): void {
    this.camera.position.set(0, 0.5, 2.5);
    this.camera.lookAt(0, 0.5, 0);
    if (this.modelGroup) {
      this.modelGroup.rotation.set(0, 0, 0);
    }
  }

  onRenderComplete(callback: RenderCompleteCallback): () => void {
    this.renderCompleteCallbacks.add(callback);
    return () => this.renderCompleteCallbacks.delete(callback);
  }

  private notifyRenderComplete(event: RenderCompleteEvent): void {
    this.renderCompleteCallbacks.forEach((cb) => cb(event));
  }

  resize(width: number, height: number): void {
    if (!this.renderer) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  getCanvas(): HTMLCanvasElement | null {
    return this.renderer?.domElement || null;
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  dispose(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.materials.forEach((material) => material.dispose());
    this.meshes.forEach((mesh) => {
      mesh.geometry.dispose();
    });

    if (this.renderer) {
      this.renderer.dispose();
    }

    this.renderCompleteCallbacks.clear();
  }
}
