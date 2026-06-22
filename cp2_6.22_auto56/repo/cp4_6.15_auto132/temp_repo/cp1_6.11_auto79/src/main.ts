import * as THREE from 'three';
import { IslandGenerator } from './islandGenerator';
import { AirshipControl } from './airshipControl';
import { CollisionManager } from './collisionManager';
import { ParticleEffects } from './particleEffects';

class Game {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private canvas: HTMLCanvasElement;
  private islandGenerator: IslandGenerator;
  private airshipControl: AirshipControl;
  private collisionManager: CollisionManager;
  private particleEffects: ParticleEffects;
  private clock: THREE.Clock;
  private score: number = 0;
  private stars: THREE.Points | null = null;
  private animationFrameId: number = 0;
  private cursorHidden: boolean = false;

  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0d1b2a);
    this.scene.fog = new THREE.Fog(0x0d1b2a, 100, 200);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      500
    );
    this.camera.position.set(0, 5, 15);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.clock = new THREE.Clock();

    this.setupLights();
    this.createStars();

    this.particleEffects = new ParticleEffects(this.scene);
    this.islandGenerator = new IslandGenerator(this.scene);
    this.airshipControl = new AirshipControl(this.scene);
    this.collisionManager = new CollisionManager(
      this.scene,
      this.particleEffects,
      this.islandGenerator,
      this.airshipControl
    );

    this.collisionManager.setScoreCallback((s) => this.updateScoreUI(s));
    this.collisionManager.setFlashBorderCallback((c) => this.flashBorder(c));

    const islandCount = 15 + Math.floor(Math.random() * 6);
    this.islandGenerator.generateIslands(islandCount);

    window.addEventListener('resize', () => this.onResize());
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('mousemove', () => this.showCursor());

    this.initUI();
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    this.scene.add(directionalLight);

    const purpleLight = new THREE.PointLight(0x7c4dff, 0.5, 100);
    purpleLight.position.set(-30, 20, -30);
    this.scene.add(purpleLight);

    const blueLight = new THREE.PointLight(0x1e88e5, 0.4, 100);
    blueLight.position.set(30, -20, 30);
    this.scene.add(blueLight);
  }

  private createStars(): void {
    const starCount = 200;
    const positions = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    const opacities = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 150 + Math.random() * 50;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      sizes[i] = 1 + Math.random() * 2;
      opacities[i] = 0.6 + Math.random() * 0.4;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.6)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 2,
      map: texture,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
      depthWrite: false
    });

    this.stars = new THREE.Points(geometry, material);
    this.scene.add(this.stars);
  }

  private initUI(): void {
    this.updateScoreUI(0);
    this.updateStatusIndicators();
  }

  private updateScoreUI(score: number): void {
    this.score = score;
    const scoreEl = document.getElementById('score-display');
    if (scoreEl) {
      scoreEl.textContent = `得分: ${score}`;
    }
  }

  private updateStatusIndicators(): void {
    const state = this.airshipControl.getState();

    const speedEl = document.getElementById('status-speed');
    const shieldEl = document.getElementById('status-shield');
    const buoyancyEl = document.getElementById('status-buoyancy');
    const attackEl = document.getElementById('status-attack');

    if (speedEl) {
      speedEl.classList.toggle('active', state.speedBoost);
    }
    if (shieldEl) {
      shieldEl.classList.toggle('active', state.shieldActive);
    }
    if (buoyancyEl) {
      buoyancyEl.classList.toggle('active', state.buoyancyBoost);
    }
    if (attackEl) {
      attackEl.classList.toggle('active', state.attackActive);
    }
  }

  private flashBorder(color: string): void {
    const borderEl = document.getElementById('flash-border');
    if (!borderEl) return;

    borderEl.style.setProperty('--flash-color', color);
    borderEl.classList.add('active');

    setTimeout(() => {
      borderEl.classList.remove('active');
    }, 400);
  }

  private onKeyDown(e: KeyboardEvent): void {
    const key = e.key.toLowerCase();
    if (['w', 'a', 's', 'd', 'q', 'e', 'r', ' '].includes(key)) {
      this.hideCursor();
    }
  }

  private hideCursor(): void {
    if (!this.cursorHidden) {
      document.body.style.cursor = 'none';
      this.cursorHidden = true;
    }
  }

  private showCursor(): void {
    if (this.cursorHidden) {
      document.body.style.cursor = 'default';
      this.cursorHidden = false;
    }
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private updateCamera(): void {
    const airshipPos = this.airshipControl.getPosition();
    const airshipDir = this.airshipControl.getForwardDirection();

    const cameraOffset = airshipDir.clone().negate().multiplyScalar(12);
    cameraOffset.y += 5;

    const targetPos = airshipPos.clone().add(cameraOffset);
    this.camera.position.lerp(targetPos, 0.05);
    this.camera.lookAt(airshipPos.x, airshipPos.y + 1, airshipPos.z);
  }

  private animate(): void {
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    const dt = Math.min(this.clock.getDelta(), 0.1);

    this.airshipControl.update(dt);
    this.islandGenerator.update(dt);
    this.score = this.collisionManager.update(dt, this.score);

    const thrustActive = this.airshipControl.isThrustActive();
    this.particleEffects.update(
      dt,
      thrustActive,
      this.airshipControl.getPosition(),
      this.airshipControl.getForwardDirection()
    );

    this.updateCamera();
    this.updateStatusIndicators();

    if (this.stars) {
      this.stars.rotation.y += dt * 0.02;
    }

    this.renderer.render(this.scene, this.camera);
  }

  start(): void {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      setTimeout(() => {
        loadingScreen.classList.add('hidden');
        setTimeout(() => {
          loadingScreen.style.display = 'none';
        }, 800);
      }, 1000);
    }

    this.animate();
  }

  dispose(): void {
    cancelAnimationFrame(this.animationFrameId);
    this.islandGenerator.dispose();
    this.airshipControl.dispose();
    this.collisionManager.dispose();
    this.particleEffects.dispose();
    this.renderer.dispose();
  }
}

const game = new Game();
game.start();

(window as any).game = game;
