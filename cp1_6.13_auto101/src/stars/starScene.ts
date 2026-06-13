import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { StarData, SpectralType, SPECTRAL_TYPES } from './types';

interface StarRenderData {
  mesh: THREE.Mesh;
  data: StarData;
  baseSize: number;
  baseOpacity: number;
  targetOpacity: number;
  targetScale: number;
  currentOpacity: number;
  currentScale: number;
}

export interface StarSceneCallbacks {
  onStarClick: (star: StarData | null) => void;
}

export class StarScene {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private stars: StarRenderData[] = [];
  private backgroundParticles: THREE.Points | null = null;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private callbacks: StarSceneCallbacks;
  private animationId: number | null = null;
  private selectedStar: StarRenderData | null = null;
  private selectionRing: THREE.Mesh | null = null;
  private clock: THREE.Clock;
  private brightness: number = 1.0;
  private activeFilters: SpectralType[] = [...SPECTRAL_TYPES];
  private isAnimating: boolean = false;
  private animationStartTime: number = 0;
  private readonly ANIMATION_DURATION = 500;
  private starGeometries: THREE.InstancedMesh | null = null;

  constructor(container: HTMLElement, callbacks: StarSceneCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.clock = new THREE.Clock();

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a2e);
    this.scene.fog = new THREE.FogExp2(0x0a0a2e, 0.004);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 50, 100);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 50;
    this.controls.maxDistance = 200;
    this.controls.minZoom = 0.5;
    this.controls.maxZoom = 3.0;
    this.controls.target.set(0, 0, 0);

    this.setupLighting();
    this.setupBackgroundParticles();
    this.setupEventListeners();
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1, 200);
    pointLight.position.set(50, 50, 50);
    this.scene.add(pointLight);
  }

  private setupBackgroundParticles(): void {
    const particleCount = 5000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const radius = Math.random() * 150 + 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);

      const brightness = Math.random() * 0.5 + 0.3;
      colors[i3] = brightness;
      colors[i3 + 1] = brightness;
      colors[i3 + 2] = brightness * 1.2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.3,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });

    this.backgroundParticles = new THREE.Points(geometry, material);
    this.scene.add(this.backgroundParticles);
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.onWindowResize.bind(this));
    this.renderer.domElement.addEventListener('click', this.onClick.bind(this));
    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private onMouseMove(event: MouseEvent): void {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  private onClick(): void {
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const meshes = this.stars.map((s) => s.mesh);
    const intersects = this.raycaster.intersectObjects(meshes, false);

    if (intersects.length > 0) {
      const clickedMesh = intersects[0].object as THREE.Mesh;
      const starData = this.stars.find((s) => s.mesh === clickedMesh);

      if (starData) {
        this.selectStar(starData);
        this.callbacks.onStarClick(starData.data);
      }
    } else {
      this.deselectStar();
      this.callbacks.onStarClick(null);
    }
  }

  private selectStar(star: StarRenderData): void {
    this.deselectStar();
    this.selectedStar = star;

    const ringGeometry = new THREE.RingGeometry(
      star.data.size * 1.2,
      star.data.size * 1.8,
      64
    );
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });

    this.selectionRing = new THREE.Mesh(ringGeometry, ringMaterial);
    this.selectionRing.position.copy(star.mesh.position);
    this.selectionRing.lookAt(this.camera.position);
    this.scene.add(this.selectionRing);
  }

  private deselectStar(): void {
    if (this.selectionRing) {
      this.scene.remove(this.selectionRing);
      this.selectionRing.geometry.dispose();
      (this.selectionRing.material as THREE.Material).dispose();
      this.selectionRing = null;
    }
    this.selectedStar = null;
  }

  public setStars(starData: StarData[]): void {
    this.clearStars();

    const geometry = new THREE.SphereGeometry(1, 32, 32);

    for (const data of starData) {
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(data.color.r, data.color.g, data.color.b),
        emissive: new THREE.Color(data.color.r, data.color.g, data.color.b),
        emissiveIntensity: this.brightness,
        transparent: true,
        opacity: 1,
        roughness: 0.3,
        metalness: 0.7,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(data.position.x, data.position.y, data.position.z);
      mesh.scale.setScalar(data.size);
      mesh.userData.starId = data.id;

      this.scene.add(mesh);

      this.stars.push({
        mesh,
        data,
        baseSize: data.size,
        baseOpacity: 1,
        targetOpacity: 1,
        targetScale: 1,
        currentOpacity: 1,
        currentScale: 1,
      });
    }
  }

  private clearStars(): void {
    for (const star of this.stars) {
      this.scene.remove(star.mesh);
      (star.mesh.material as THREE.Material).dispose();
    }
    this.stars = [];
    this.deselectStar();
  }

  public updateBrightness(brightness: number): void {
    this.brightness = brightness;

    for (const star of this.stars) {
      const material = star.mesh.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = brightness;
    }
  }

  public updateFilter(activeFilters: SpectralType[]): void {
    this.activeFilters = activeFilters;
    this.isAnimating = true;
    this.animationStartTime = performance.now();

    for (const star of this.stars) {
      const isFiltered = activeFilters.includes(star.data.spectralType);
      star.targetOpacity = isFiltered ? 1 : 0.1;
      star.targetScale = isFiltered ? 1 : 0.5;
    }
  }

  private updateAnimation(): void {
    if (!this.isAnimating) return;

    const elapsed = performance.now() - this.animationStartTime;
    const progress = Math.min(elapsed / this.ANIMATION_DURATION, 1);
    const eased = 1 - Math.pow(1 - progress, 3);

    for (const star of this.stars) {
      star.currentOpacity =
        star.currentOpacity + (star.targetOpacity - star.currentOpacity) * eased * 0.1;
      star.currentScale =
        star.currentScale + (star.targetScale - star.currentScale) * eased * 0.1;

      const material = star.mesh.material as THREE.MeshStandardMaterial;
      material.opacity = star.currentOpacity;
      star.mesh.scale.setScalar(star.baseSize * star.currentScale);
    }

    if (progress >= 1) {
      this.isAnimating = false;
      for (const star of this.stars) {
        star.currentOpacity = star.targetOpacity;
        star.currentScale = star.targetScale;
        const material = star.mesh.material as THREE.MeshStandardMaterial;
        material.opacity = star.currentOpacity;
        star.mesh.scale.setScalar(star.baseSize * star.currentScale);
      }
    }
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(this.animate.bind(this));

    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    this.updateAnimation();

    if (this.selectedStar && this.selectionRing) {
      this.selectionRing.lookAt(this.camera.position);

      const pulse = Math.sin(elapsed * Math.PI) * 0.2 + 0.8;
      this.selectionRing.scale.setScalar(pulse);

      const material = this.selectionRing.material as THREE.MeshBasicMaterial;
      material.opacity = 0.5 * (1 - Math.abs(Math.sin(elapsed * Math.PI)) * 0.5);

      this.selectionRing.position.copy(this.selectedStar.mesh.position);
    }

    if (this.backgroundParticles) {
      this.backgroundParticles.rotation.y += delta * 0.02;
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  public start(): void {
    if (this.animationId === null) {
      this.animate();
    }
  }

  public stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  public dispose(): void {
    this.stop();
    this.clearStars();

    if (this.backgroundParticles) {
      this.scene.remove(this.backgroundParticles);
      this.backgroundParticles.geometry.dispose();
      (this.backgroundParticles.material as THREE.Material).dispose();
    }

    this.controls.dispose();
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);

    window.removeEventListener('resize', this.onWindowResize.bind(this));
    this.renderer.domElement.removeEventListener('click', this.onClick.bind(this));
    this.renderer.domElement.removeEventListener('mousemove', this.onMouseMove.bind(this));
  }

  public setSelectedStarById(id: string | null): void {
    if (id === null) {
      this.deselectStar();
      return;
    }

    const star = this.stars.find((s) => s.data.id === id);
    if (star) {
      this.selectStar(star);
    }
  }
}
