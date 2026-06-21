import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { StarSystem, Beam } from './starSystem';

const SCENE_BACKGROUND = 0x0a0b1e;
const CORE_SPHERE_COLOR = 0x3b82f6;
const HDR_THRESHOLD = 60;

class Application {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private starSystem: StarSystem;
  private clock: THREE.Clock;
  private coreSphere: THREE.Mesh;
  private backgroundStars: THREE.Points;
  private animationId: number = 0;
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private useHDR: boolean = true;
  private raycaster: THREE.Raycaster;
  private hoveredBeam: Beam | null = null;
  private mouse: THREE.Vector2;

  private elStarCount: HTMLElement;
  private elBeamCount: HTMLElement;
  private elControlPanel: HTMLElement;
  private elPanelToggle: HTMLElement;
  private btnClear: HTMLElement;
  private btnRandom: HTMLElement;
  private btnExport: HTMLElement;

  constructor() {
    this.container = document.getElementById('canvas-container')!;
    this.elStarCount = document.getElementById('star-count')!;
    this.elBeamCount = document.getElementById('beam-count')!;
    this.elControlPanel = document.getElementById('control-panel')!;
    this.elPanelToggle = document.getElementById('panel-toggle')!;
    this.btnClear = document.getElementById('btn-clear')!;
    this.btnRandom = document.getElementById('btn-random')!;
    this.btnExport = document.getElementById('btn-export')!;
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(SCENE_BACKGROUND);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const camDist = 10;
    this.camera.position.set(
      camDist * Math.cos(Math.PI / 4),
      camDist * Math.sin(Math.PI / 4),
      camDist * Math.cos(Math.PI / 4)
    );
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = false;
    this.controls.minDistance = 3;
    this.controls.maxDistance = 30;
    this.controls.maxPolarAngle = Math.PI * 0.9;

    this.createBackgroundStars();
    this.createCoreSphere();

    this.starSystem = new StarSystem(this.scene);

    this.setupEventListeners();
    this.togglePanel(true);
    this.animate();
  }

  private createBackgroundStars(): void {
    const starCount = 2000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const radius = 80 + Math.random() * 120;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const brightness = 0.5 + Math.random() * 0.5;
      colors[i * 3] = brightness;
      colors[i * 3 + 1] = brightness;
      colors[i * 3 + 2] = brightness;

      sizes[i] = 0.1 + Math.random() * 0.3;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      depthWrite: false
    });

    this.backgroundStars = new THREE.Points(geometry, material);
    this.scene.add(this.backgroundStars);
  }

  private createCoreSphere(): void {
    const geometry = new THREE.SphereGeometry(0.5, 64, 64);
    const material = new THREE.MeshBasicMaterial({
      color: CORE_SPHERE_COLOR,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    this.coreSphere = new THREE.Mesh(geometry, material);
    this.scene.add(this.coreSphere);

    const ringGeometry = new THREE.RingGeometry(0.55, 0.58, 64);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: CORE_SPHERE_COLOR,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    this.coreSphere.add(ring);
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.onResize.bind(this));

    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousedown', (e) => {
      this.isDragging = false;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
    });

    canvas.addEventListener('mousemove', (e) => {
      const dx = Math.abs(e.clientX - this.dragStartX);
      const dy = Math.abs(e.clientY - this.dragStartY);
      if (dx > 5 || dy > 5) {
        this.isDragging = true;
      }
      this.updateMousePosition(e);
      this.updateBeamHover();
    });

    canvas.addEventListener('mouseup', (e) => {
      if (!this.isDragging) {
        this.handleClick(e);
      }
    });

    canvas.addEventListener('touchstart', (e) => {
      this.isDragging = false;
      const touch = e.touches[0];
      this.dragStartX = touch.clientX;
      this.dragStartY = touch.clientY;
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - this.dragStartX);
      const dy = Math.abs(touch.clientY - this.dragStartY);
      if (dx > 10 || dy > 10) {
        this.isDragging = true;
      }
    }, { passive: true });

    canvas.addEventListener('touchend', (e) => {
      if (!this.isDragging && e.changedTouches.length > 0) {
        const touch = e.changedTouches[0];
        this.handleClick(touch as unknown as MouseEvent);
      }
    });

    this.elPanelToggle.addEventListener('click', () => {
      const isVisible = this.elControlPanel.classList.contains('visible');
      this.togglePanel(!isVisible);
    });

    this.btnClear.addEventListener('click', () => {
      this.starSystem.clearAll();
      this.updateStats();
    });

    this.btnRandom.addEventListener('click', () => {
      this.starSystem.generateRandomConstellation(this.camera);
      setTimeout(() => this.updateStats(), 650);
    });

    this.btnExport.addEventListener('click', () => {
      this.exportScreenshot();
    });
  }

  private updateMousePosition(e: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private updateBeamHover(): void {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const beams = this.starSystem.getBeams();
    const tubes = beams.map((b) => b.tube);

    const intersects = this.raycaster.intersectObjects(tubes, false);

    if (this.hoveredBeam) {
      this.starSystem.setBeamHoverBrightness(this.hoveredBeam, false);
      this.hoveredBeam = null;
    }

    if (intersects.length > 0) {
      const hitTube = intersects[0].object;
      const beam = beams.find((b) => b.tube === hitTube);
      if (beam) {
        this.hoveredBeam = beam;
        this.starSystem.setBeamHoverBrightness(beam, true);
      }
    }
  }

  private handleClick(e: MouseEvent): void {
    if (e.target !== this.renderer.domElement) return;

    const clientX = 'clientX' in e ? e.clientX : 0;
    const clientY = 'clientY' in e ? e.clientY : 0;

    this.starSystem.addStarFromScreen(
      clientX,
      clientY,
      this.camera,
      this.renderer.domElement
    );

    this.updateStats();
    this.checkPerformanceThreshold();
  }

  private checkPerformanceThreshold(): void {
    if (this.starSystem.getStarCount() > HDR_THRESHOLD && this.useHDR) {
      this.useHDR = false;
      this.renderer.toneMapping = THREE.LinearToneMapping;
      this.renderer.toneMappingExposure = 1.0;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    } else if (this.starSystem.getStarCount() <= HDR_THRESHOLD && !this.useHDR) {
      this.useHDR = true;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.2;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }
  }

  private togglePanel(visible: boolean): void {
    if (visible) {
      this.elControlPanel.classList.add('visible');
      (this.elPanelToggle as HTMLButtonElement).textContent = '◀';
    } else {
      this.elControlPanel.classList.remove('visible');
      (this.elPanelToggle as HTMLButtonElement).textContent = '▶';
    }
  }

  private updateStats(): void {
    this.elStarCount.textContent = String(this.starSystem.getStarCount());
    this.elBeamCount.textContent = String(this.starSystem.getBeamCount());
  }

  private exportScreenshot(): void {
    this.renderer.render(this.scene, this.camera);
    const originalPixelRatio = this.renderer.getPixelRatio();

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio * 2, 4));
    this.renderer.setSize(window.innerWidth * 2, window.innerHeight * 2, false);
    this.renderer.render(this.scene, this.camera);

    const link = document.createElement('a');
    const now = new Date();
    const filename = `stardust_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}.png`;
    link.download = filename;
    link.href = this.renderer.domElement.toDataURL('image/png');
    link.click();

    this.renderer.setPixelRatio(originalPixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.onResize();
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    this.coreSphere.rotation.y += delta * 0.3;
    this.coreSphere.rotation.x = Math.sin(elapsedTime * 0.2) * 0.1;

    const coreMat = this.coreSphere.material as THREE.MeshBasicMaterial;
    coreMat.opacity = 0.25 + 0.05 * Math.sin(elapsedTime * 0.8);

    this.backgroundStars.rotation.y += delta * 0.01;

    this.starSystem.update(delta, elapsedTime);

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  destroy(): void {
    cancelAnimationFrame(this.animationId);
    this.starSystem.dispose();

    this.coreSphere.geometry.dispose();
    (this.coreSphere.material as THREE.Material).dispose();

    this.backgroundStars.geometry.dispose();
    (this.backgroundStars.material as THREE.Material).dispose();

    this.renderer.dispose();
    this.controls.dispose();
  }
}

let app: Application | null = null;

window.addEventListener('DOMContentLoaded', () => {
  app = new Application();
});

window.addEventListener('beforeunload', () => {
  if (app) {
    app.destroy();
    app = null;
  }
});
