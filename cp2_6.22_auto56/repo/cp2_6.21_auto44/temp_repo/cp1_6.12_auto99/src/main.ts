import * as THREE from 'three';
import { Planet } from './planet';
import { ImpactManager, ImpactConfig } from './impact';
import { UIManager } from './ui';

class App {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private planet: Planet;
  private impactManager: ImpactManager;
  private uiManager: UIManager;
  private clock: THREE.Clock;
  private ambientLight: THREE.AmbientLight;
  private directionalLight: THREE.DirectionalLight;
  private stars: THREE.Points;

  private impactConfig: ImpactConfig = {
    asteroidRadius: 10,
    impactSpeed: 5
  };

  private isResetting = false;
  private resetProgress = 0;
  private resetMaterial: THREE.MeshStandardMaterial | null = null;

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    this.camera = new THREE.PerspectiveCamera(
      60,
      1,
      0.1,
      1000
    );

    const canvasContainer = document.getElementById('canvas-container')!;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    canvasContainer.appendChild(this.renderer.domElement);

    this.clock = new THREE.Clock();

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.1);
    this.directionalLight.position.set(5, 3, 5);
    this.scene.add(this.directionalLight);

    const backLight = new THREE.DirectionalLight(0x4488ff, 0.2);
    backLight.position.set(-5, 2, -5);
    this.scene.add(backLight);

    this.planet = new Planet({
      radius: 10,
      textureWidth: 1024,
      textureHeight: 512
    });
    this.scene.add(this.planet.mesh);

    this.createStars();

    const planetRadius = 10;
    this.camera.position.set(0, planetRadius * 0.3, planetRadius * 3.5);
    this.camera.lookAt(0, 0, 0);

    this.impactManager = new ImpactManager(this.scene, this.planet);

    this.uiManager = new UIManager('panel-container', {
      getImpactConfig: () => this.impactConfig,
      setImpactConfig: (config) => {
        this.impactConfig = { ...this.impactConfig, ...config };
      },
      onReset: () => this.resetPlanet()
    });

    this.setupInteraction();
    this.onWindowResize();
    window.addEventListener('resize', () => this.onWindowResize());

    this.animate();
  }

  private createStars(): void {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 3000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      const radius = 200 + Math.random() * 300;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = radius * Math.cos(phi);

      const brightness = 0.6 + Math.random() * 0.4;
      const hueVariation = Math.random();
      if (hueVariation < 0.1) {
        colors[i] = brightness * 0.8;
        colors[i + 1] = brightness * 0.8;
        colors[i + 2] = brightness;
      } else if (hueVariation < 0.2) {
        colors[i] = brightness;
        colors[i + 1] = brightness * 0.85;
        colors[i + 2] = brightness * 0.7;
      } else {
        colors[i] = brightness;
        colors[i + 1] = brightness;
        colors[i + 2] = brightness;
      }
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: 0.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true
    });

    this.stars = new THREE.Points(starGeometry, starMaterial);
    this.scene.add(this.stars);
  }

  private setupInteraction(): void {
    const canvas = this.renderer.domElement;
    this.planet.setupInteraction(canvas, this.camera);
    this.impactManager.setupClickInteraction(
      canvas,
      this.camera,
      () => this.impactConfig,
      () => {
        this.uiManager.recordImpact(this.impactConfig.asteroidRadius);
      }
    );
  }

  private onWindowResize(): void {
    const sceneContainer = document.getElementById('scene-container')!;
    const width = sceneContainer.clientWidth;
    const height = sceneContainer.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  private resetPlanet(): void {
    this.isResetting = true;
    this.resetProgress = 0;
    this.resetMaterial = this.planet.mesh.material as THREE.MeshStandardMaterial;
  }

  private updateResetAnimation(deltaTime: number): void {
    if (!this.isResetting || !this.resetMaterial) return;

    const resetDuration = 0.5;
    this.resetProgress += deltaTime;

    const t = Math.min(this.resetProgress / resetDuration, 1);
    const fadeT = t < 0.5 ? t * 2 : 2 - t * 2;
    this.resetMaterial.opacity = 1 - fadeT * 0.7;
    this.resetMaterial.transparent = true;

    if (t >= 0.5 && !this.planet.texture.userData.resetApplied) {
      this.planet.resetTexture();
      this.impactManager.clearAll();
      this.planet.texture.userData.resetApplied = true;
    }

    if (t >= 1) {
      this.isResetting = false;
      this.resetMaterial.opacity = 1;
      this.resetMaterial.transparent = false;
      this.planet.texture.userData.resetApplied = false;
    }
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());

    const deltaTime = this.clock.getDelta();
    const currentTime = performance.now() / 1000;

    this.planet.update(deltaTime);
    this.impactManager.update(currentTime, deltaTime);
    this.updateResetAnimation(deltaTime);

    this.stars.rotation.y += deltaTime * 0.005;

    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new App();
});
