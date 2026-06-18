import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { DataManager, DensityGrid } from './dataManager';
import { ParticleSystem } from './particleSystem';

class CrowdFlowApp {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private composer: EffectComposer;
  private bloomPass: UnrealBloomPass;

  private dataManager: DataManager;
  private particleSystem: ParticleSystem;

  private clock: THREE.Clock;
  private container: HTMLElement;

  private wireframeCube: THREE.LineSegments;
  private groundGlow: THREE.Mesh;
  private cornerLabels: HTMLElement[];

  private densityIndicator: HTMLElement;
  private densityValue: HTMLElement;

  private lastAverageDensity: number = 0;
  private displayedDensity: number = 0;

  constructor() {
    this.container = document.getElementById('app')!;
    this.clock = new THREE.Clock();

    this.scene = this.createScene();
    this.camera = this.createCamera();
    this.renderer = this.createRenderer();
    this.controls = this.createControls();
    this.composer = this.createComposer();
    this.bloomPass = this.createBloomPass();

    this.dataManager = new DataManager();
    this.particleSystem = new ParticleSystem(this.scene);

    this.wireframeCube = this.createWireframeCube();
    this.groundGlow = this.createGroundGlow();
    this.cornerLabels = this.createCornerLabels();

    this.densityIndicator = document.getElementById('density-indicator')!;
    this.densityValue = document.getElementById('density-value')!;

    this.setupEventListeners();
    this.animate = this.animate.bind(this);
  }

  private createScene(): THREE.Scene {
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0A0A0F, 0.025);
    return scene;
  }

  private createCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(8, 6, 10);
    camera.lookAt(0, 0, 0);
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
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    this.container.appendChild(renderer.domElement);
    return renderer;
  }

  private createControls(): OrbitControls {
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.6;
    controls.zoomSpeed = 0.8;
    controls.minDistance = 5;
    controls.maxDistance = 25;
    controls.maxPolarAngle = Math.PI * 0.85;
    controls.target.set(0, 0, 0);
    return controls;
  }

  private createComposer(): EffectComposer {
    const composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    composer.addPass(renderPass);
    return composer;
  }

  private createBloomPass(): UnrealBloomPass {
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.8,
      0.4,
      0.85
    );
    bloomPass.threshold = 0.1;
    bloomPass.strength = 0.9;
    bloomPass.radius = 0.5;
    this.composer.addPass(bloomPass);
    return bloomPass;
  }

  private createWireframeCube(): THREE.LineSegments {
    const geometry = new THREE.BoxGeometry(10, 10, 10);
    const edges = new THREE.EdgesGeometry(geometry);
    const material = new THREE.LineBasicMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.15
    });
    const wireframe = new THREE.LineSegments(edges, material);
    wireframe.position.y = 0;
    this.scene.add(wireframe);
    geometry.dispose();
    return wireframe;
  }

  private createGroundGlow(): THREE.Mesh {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    gradient.addColorStop(0, 'rgba(42, 42, 78, 0.6)');
    gradient.addColorStop(0.3, 'rgba(42, 42, 78, 0.4)');
    gradient.addColorStop(0.6, 'rgba(42, 42, 78, 0.2)');
    gradient.addColorStop(0.8, 'rgba(42, 42, 78, 0.08)');
    gradient.addColorStop(1, 'rgba(42, 42, 78, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = 'rgba(42, 42, 78, 0.4)';
    ctx.lineWidth = 1;
    const rings = 8;
    for (let i = 1; i <= rings; i++) {
      const radius = (i / rings) * 250;
      ctx.globalAlpha = 1 - (i / rings) * 0.7;
      ctx.beginPath();
      ctx.arc(256, 256, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.globalAlpha = 0.3;
    const gridLines = 12;
    for (let i = 0; i <= gridLines; i++) {
      const angle = (i / gridLines) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(256, 256);
      ctx.lineTo(
        256 + Math.cos(angle) * 250,
        256 + Math.sin(angle) * 250
      );
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const geometry = new THREE.PlaneGeometry(16, 16, 1, 1);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = -5;
    this.scene.add(mesh);

    return mesh;
  }

  private createCornerLabels(): HTMLElement[] {
    const labels: HTMLElement[] = [];
    const app = document.getElementById('app')!;

    for (let i = 0; i < 4; i++) {
      const label = document.createElement('div');
      label.className = 'corner-label';
      label.textContent = '0%';
      app.appendChild(label);
      labels.push(label);
    }

    return labels;
  }

  private getCornerWorldPositions(): THREE.Vector3[] {
    const half = 5;
    const y = -5;
    return [
      new THREE.Vector3(-half, y, -half),
      new THREE.Vector3(half, y, -half),
      new THREE.Vector3(-half, y, half),
      new THREE.Vector3(half, y, half)
    ];
  }

  private updateCornerLabels(densityGrid: DensityGrid): void {
    const positions = this.getCornerWorldPositions();
    const densities = densityGrid.cornerDensities;

    for (let i = 0; i < 4; i++) {
      const worldPos = positions[i];
      const projected = worldPos.clone().project(this.camera);

      const x = (projected.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-projected.y * 0.5 + 0.5) * window.innerHeight;

      if (projected.z < 1) {
        this.cornerLabels[i].style.display = 'block';
        this.cornerLabels[i].style.left = `${x}px`;
        this.cornerLabels[i].style.top = `${y - 15}px`;
        this.cornerLabels[i].textContent = `${Math.round(densities[i])}%`;

        const intensity = densities[i] / 100;
        const r = Math.round(0 + intensity * 255);
        const g = Math.round(212 - intensity * 110);
        const b = Math.round(255 - intensity * 189);
        this.cornerLabels[i].style.color = `rgb(${r}, ${g}, ${b})`;
      } else {
        this.cornerLabels[i].style.display = 'none';
      }
    }
  }

  private updateDensityUI(averageDensity: number): void {
    this.displayedDensity += (averageDensity - this.displayedDensity) * 0.05;

    const percentage = Math.round(this.displayedDensity);
    this.densityIndicator.style.bottom = `${this.displayedDensity}%`;
    this.densityValue.textContent = `${percentage}%`;

    const t = this.displayedDensity / 100;
    const r = Math.round(0 + t * 255);
    const g = Math.round(212 - t * 110);
    const b = Math.round(255 - t * 189);
    this.densityValue.style.color = `rgb(${r}, ${g}, ${b})`;
  }

  private updateGroundGlow(averageDensity: number): void {
    const t = averageDensity / 100;
    const pulse = Math.sin(performance.now() * 0.001) * 0.05 + 1;
    if (this.groundGlow.material instanceof THREE.MeshBasicMaterial) {
      this.groundGlow.material.opacity = (0.25 + t * 0.25) * pulse;
    }
    this.groundGlow.scale.setScalar(1 + t * 0.1);
  }

  private updateBloomIntensity(averageDensity: number): void {
    const t = averageDensity / 100;
    this.bloomPass.strength = 0.6 + t * 0.8;
    this.bloomPass.radius = 0.3 + t * 0.5;
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => this.onWindowResize());
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.composer.setSize(window.innerWidth, window.innerHeight);
    this.bloomPass.setSize(window.innerWidth, window.innerHeight);
  }

  private animate(): void {
    requestAnimationFrame(this.animate);

    const currentTime = performance.now();
    const deltaTime = Math.min(this.clock.getDelta(), 0.05);

    const densityGrid = this.dataManager.getDensityGrid(currentTime);

    this.particleSystem.update(densityGrid, deltaTime);

    const avgDensity = densityGrid.averageDensity;
    if (Math.abs(avgDensity - this.lastAverageDensity) > 0.01) {
      this.lastAverageDensity = avgDensity;
    }

    this.updateDensityUI(avgDensity);
    this.updateCornerLabels(densityGrid);
    this.updateGroundGlow(avgDensity);
    this.updateBloomIntensity(avgDensity);

    this.controls.update();
    this.composer.render();
  }

  public start(): void {
    this.animate();
  }

  public dispose(): void {
    this.particleSystem.dispose();
    this.renderer.dispose();
    this.composer.dispose();
    this.controls.dispose();

    if (this.wireframeCube.geometry) this.wireframeCube.geometry.dispose();
    if (this.wireframeCube.material instanceof THREE.Material) {
      this.wireframeCube.material.dispose();
    }

    if (this.groundGlow.geometry) this.groundGlow.geometry.dispose();
    const groundMaterial = this.groundGlow.material as THREE.MeshBasicMaterial;
    if (groundMaterial instanceof THREE.Material) {
      if (groundMaterial.map) {
        groundMaterial.map.dispose();
      }
      groundMaterial.dispose();
    }

    this.cornerLabels.forEach(label => label.remove());
    window.removeEventListener('resize', () => this.onWindowResize());
  }
}

const app = new CrowdFlowApp();
app.start();
