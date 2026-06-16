import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useMaterialStore } from '../stores/useMaterialStore';

export class SceneManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public controls: OrbitControls;
  public container: HTMLElement;
  public atomGroup: THREE.Group;
  public bondGroup: THREE.Group;
  public highlightGroup: THREE.Group;

  private clock: THREE.Clock;
  private animationId: number | null = null;
  private onFrameCallbacks: Array<(delta: number) => void> = [];

  constructor(containerId: string) {
    this.container = document.getElementById(containerId) as HTMLElement;
    if (!this.container) {
      throw new Error(`Container ${containerId} not found`);
    }

    this.scene = new THREE.Scene();
    this.setupBackground();

    this.camera = new THREE.PerspectiveCamera(
      50,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 12, 20);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.setupControls();

    this.atomGroup = new THREE.Group();
    this.bondGroup = new THREE.Group();
    this.highlightGroup = new THREE.Group();
    this.scene.add(this.atomGroup, this.bondGroup, this.highlightGroup);

    this.clock = new THREE.Clock();
    this.setupLights();
    this.setupEventListeners();
  }

  private setupBackground(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#0D1117');
    gradient.addColorStop(1, '#161B22');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 512);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    this.scene.background = texture;

    const starGeometry = new THREE.BufferGeometry();
    const starCount = 300;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 300;
      positions[i + 1] = (Math.random() - 0.5) * 300;
      positions[i + 2] = (Math.random() - 0.5) * 300;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.15,
      transparent: true,
      opacity: 0.6,
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    this.scene.add(stars);
  }

  private setupControls(): void {
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.rotateSpeed = 0.8;
    this.controls.zoomSpeed = 1.0;
    this.controls.panSpeed = 0.6;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 80;
    this.controls.enablePan = true;
    this.controls.screenSpacePanning = true;

    this.controls.addEventListener('change', () => {
      const distance = this.camera.position.distanceTo(this.controls.target);
      useMaterialStore.getState().setCameraDistance(distance);
      this.updateLensFlare(distance);
    });
  }

  private setupLights(): void {
    const ambient = new THREE.AmbientLight(0x404060, 0.6);
    this.scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
    keyLight.position.set(10, 15, 10);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x6699ff, 0.4);
    fillLight.position.set(-10, 5, -8);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xff9966, 0.3);
    rimLight.position.set(0, -10, 10);
    this.scene.add(rimLight);

    const pointLight = new THREE.PointLight(0x58a6ff, 0.5, 50);
    pointLight.position.set(0, 0, 8);
    this.scene.add(pointLight);
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.onResize.bind(this));
  }

  private onResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private updateLensFlare(distance: number): void {
    const flare = document.getElementById('lens-flare');
    if (!flare) return;

    const minDist = 5;
    const maxDist = 80;
    const t = Math.min(1, Math.max(0, (distance - minDist) / (maxDist - minDist)));
    const opacity = 0.1 + (1 - t) * 0.5;
    const scale = 0.6 + (1 - t) * 0.8;

    flare.style.opacity = opacity.toString();
    flare.style.transform = `translate(-50%, -50%) scale(${scale})`;
  }

  public onFrame(callback: (delta: number) => void): void {
    this.onFrameCallbacks.push(callback);
  }

  public start(): void {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      const delta = this.clock.getDelta();
      this.controls.update();

      this.onFrameCallbacks.forEach((cb) => cb(delta));

      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  public stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  public zoom(factor: number): void {
    const currentDist = this.camera.position.distanceTo(this.controls.target);
    const newDist = Math.max(5, Math.min(80, currentDist * factor));
    const direction = new THREE.Vector3()
      .subVectors(this.camera.position, this.controls.target)
      .normalize();
    this.camera.position.copy(
      this.controls.target.clone().add(direction.multiplyScalar(newDist))
    );
    this.controls.update();
  }

  public clearAtoms(): void {
    while (this.atomGroup.children.length > 0) {
      const child = this.atomGroup.children[0];
      this.atomGroup.remove(child);
      if ((child as THREE.Mesh).geometry) {
        (child as THREE.Mesh).geometry.dispose();
      }
      const mat = (child as THREE.Mesh).material as THREE.Material | THREE.Material[];
      if (Array.isArray(mat)) {
        mat.forEach((m) => m.dispose());
      } else if (mat) {
        mat.dispose();
      }
    }
  }

  public clearBonds(): void {
    while (this.bondGroup.children.length > 0) {
      const child = this.bondGroup.children[0];
      this.bondGroup.remove(child);
      if ((child as THREE.Mesh).geometry) {
        (child as THREE.Mesh).geometry.dispose();
      }
      const mat = (child as THREE.Mesh).material as THREE.Material | THREE.Material[];
      if (Array.isArray(mat)) {
        mat.forEach((m) => m.dispose());
      } else if (mat) {
        mat.dispose();
      }
    }
  }

  public clearHighlights(): void {
    while (this.highlightGroup.children.length > 0) {
      const child = this.highlightGroup.children[0];
      this.highlightGroup.remove(child);
      if ((child as THREE.Mesh).geometry) {
        (child as THREE.Mesh).geometry.dispose();
      }
      const mat = (child as THREE.Mesh).material as THREE.Material | THREE.Material[];
      if (Array.isArray(mat)) {
        mat.forEach((m) => m.dispose());
      } else if (mat) {
        mat.dispose();
      }
    }
  }

  public worldToScreen(position: THREE.Vector3): { x: number; y: number } {
    const vector = position.clone().project(this.camera);
    const rect = this.renderer.domElement.getBoundingClientRect();
    return {
      x: (vector.x * 0.5 + 0.5) * rect.width + rect.left,
      y: (-vector.y * 0.5 + 0.5) * rect.height + rect.top,
    };
  }

  public dispose(): void {
    this.stop();
    window.removeEventListener('resize', this.onResize.bind(this));
    this.renderer.dispose();
    this.controls.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
