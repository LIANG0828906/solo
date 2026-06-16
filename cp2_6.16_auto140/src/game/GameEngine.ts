import * as THREE from 'three';
import { useGameStore } from '../store';
import { POWERUP_COLORS, POWERUP_SCORES } from '../types';
import type { PowerUpType } from '../types';
import { InputHandler } from './InputHandler';
import { Vehicle } from './Vehicle';
import { RoadGenerator } from './RoadGenerator';
import { ObstacleManager } from './ObstacleManager';
import { PowerUpManager } from './PowerUpManager';
import { CollisionSystem } from './CollisionSystem';
import { ParticleSystem } from './ParticleSystem';
import { randomRange } from '../utils/helpers';

export class GameEngine {
  private container: HTMLElement;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private menuScene!: THREE.Scene;
  private menuStars: THREE.Points | null = null;

  private inputHandler!: InputHandler;
  private vehicle!: Vehicle;
  private roadGenerator!: RoadGenerator;
  private obstacleManager!: ObstacleManager;
  private powerUpManager!: PowerUpManager;
  private collisionSystem!: CollisionSystem;
  private particleSystem!: ParticleSystem;

  private clock: THREE.Clock;
  private animationId: number | null = null;
  private lastScoreTime = 0;
  private collisionCooldown = 0;
  private lastHeldPowerUps: PowerUpType[] = [];

  constructor(container: HTMLElement) {
    this.container = container;
    this.clock = new THREE.Clock();
  }

  public init(): void {
    this.createRenderer();
    this.createMenuScene();
    this.createGameScene();

    this.inputHandler = new InputHandler();
    this.vehicle = new Vehicle();
    this.roadGenerator = new RoadGenerator(this.scene);
    this.obstacleManager = new ObstacleManager(this.scene);
    this.powerUpManager = new PowerUpManager(this.scene);
    this.collisionSystem = new CollisionSystem();
    this.particleSystem = new ParticleSystem(this.scene);

    this.scene.add(this.vehicle.mesh);
    this.roadGenerator.init();

    window.addEventListener('resize', this.onResize.bind(this));
    this.onResize();
    this.animate();
  }

  private createRenderer(): void {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = false;
    this.renderer.setClearColor(0x0a0e27);
    this.container.appendChild(this.renderer.domElement);
  }

  private createMenuScene(): void {
    this.menuScene = new THREE.Scene();
    this.menuScene.background = new THREE.Color(0x0a0e27);

    const starGeo = new THREE.BufferGeometry();
    const starCount = 500;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      positions[i] = randomRange(-200, 200);
      positions[i + 1] = randomRange(-120, 120);
      positions[i + 2] = randomRange(-200, 200);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.8,
      transparent: true,
      opacity: 0.85,
    });
    this.menuStars = new THREE.Points(starGeo, starMat);
    this.menuScene.add(this.menuStars);
  }

  private createGameScene(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.Fog(0x87ceeb, 100, 500);

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(50, 100, 50);
    this.scene.add(dir);

    this.camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    this.camera.position.set(0, 35, 20);
    this.camera.lookAt(0, 0, -20);
  }

  private onResize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h);
    if (this.camera) {
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }
  }

  private resetGame(): void {
    this.vehicle.reset();
    this.roadGenerator.reset();
    this.obstacleManager.clearAll();
    this.powerUpManager.clearAll();
    this.particleSystem.clearAll();
    this.collisionCooldown = 0;
    this.lastScoreTime = 0;
    this.lastHeldPowerUps = [];
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(this.animate.bind(this));
    const delta = Math.min(this.clock.getDelta(), 0.05);
    const state = useGameStore.getState();
    const gameState = state.gameState;

    if (gameState === 'menu') {
      this.renderMenu(delta);
      return;
    }

    if (state.gameState === 'playing') {
      this.updateGame(delta);
    }
    this.renderGame(delta);
  }

  private renderMenu(delta: number): void {
    if (this.menuStars) {
      this.menuStars.rotation.y += delta * 0.02;
      const pos = this.menuStars.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 1; i < pos.count; i += 3) {
        pos.setY(i, pos.getY(i) + delta * 0.3);
        if (pos.getY(i) > 120) pos.setY(i, -120);
      }
      pos.needsUpdate = true;
    }
    this.renderer.render(this.menuScene, this.camera);
  }

  private updateGame(delta: number): void {
    const state = useGameStore.getState();

    if (state.lives <= 0) return;

    this.inputHandler.process();
    const input = this.inputHandler.getState();

    let actualSpeed = state.speed;
    if (state.speedBoostActive) actualSpeed *= 1.5;

    if (input.up) actualSpeed *= 1.25;
    if (input.down) actualSpeed *= 0.5;

    this.vehicle.update(input, delta, actualSpeed);
    this.vehicle.setShieldVisible(state.shieldActive);

    useGameStore.getState().updateDistance(delta);
    useGameStore.getState().updateActivePowerUps(delta);
    useGameStore.getState().updateScreenShake(delta);

    this.roadGenerator.update(this.vehicle.position.z, actualSpeed, delta);
    this.obstacleManager.update(actualSpeed, delta, this.vehicle.position.z, state.distance);
    this.powerUpManager.update(actualSpeed, delta, this.vehicle.position.z);
    this.particleSystem.update(delta);

    if (state.speedBoostActive && Math.random() < 0.6) {
      this.particleSystem.spawnSpeedLines(this.vehicle.position, 2);
    }

    this.lastScoreTime += delta;
    if (this.lastScoreTime >= 1) {
      useGameStore.getState().addScore(10);
      this.lastScoreTime = 0;
    }

    this.collisionCooldown = Math.max(0, this.collisionCooldown - delta);
    if (this.collisionCooldown <= 0) {
      const vehicleAABB = this.vehicle.getAABB();
      const hit = this.collisionSystem.checkVehicleObstacle(
        vehicleAABB,
        this.obstacleManager.obstacles
      );
      if (hit) {
        if (!state.shieldActive) {
          this.particleSystem.spawnDebris(
            this.vehicle.position.clone().add(new THREE.Vector3(0, 0.5, -2)),
            30
          );
          useGameStore.getState().decrementLife();
          useGameStore.getState().triggerScreenShake(0.1);
        }
        this.obstacleManager.removeObstacle(hit.id);
        this.collisionCooldown = 0.8;
      }
    }

    const vehicleAABB = this.vehicle.getAABB();
    const collected = this.collisionSystem.checkVehiclePowerUps(
      vehicleAABB,
      this.powerUpManager.powerUps
    );
    for (const pu of collected) {
      useGameStore.getState().collectPowerUp(pu.type);
      useGameStore.getState().addScore(POWERUP_SCORES[pu.type]);
      this.particleSystem.spawnGlow(pu.position.clone(), POWERUP_COLORS[pu.type], 25);
      this.powerUpManager.removePowerUp(pu.id);
    }

    const currentPowerUps = useGameStore.getState().heldPowerUps;
    if (currentPowerUps.length < this.lastHeldPowerUps.length) {
      const used = this.lastHeldPowerUps[0];
      if (used) {
        this.particleSystem.spawnGlow(
          this.vehicle.position.clone().add(new THREE.Vector3(0, 2, 0)),
          POWERUP_COLORS[used],
          30
        );
      }
    }
    this.lastHeldPowerUps = [...currentPowerUps];

    useGameStore.getState().updateHighScore();

    if (useGameStore.getState().gameState === 'menu') {
      this.resetGame();
    }
    if (useGameStore.getState().gameState === 'playing' && !this.scene.children.includes(this.vehicle.mesh)) {
      this.scene.add(this.vehicle.mesh);
      this.resetGame();
    }
  }

  private renderGame(delta: number): void {
    const state = useGameStore.getState();
    const shake = state.screenShake > 0 ? randomRange(-0.3, 0.3) : 0;

    const targetCamX = this.vehicle.position.x * 0.3;
    this.camera.position.x += (targetCamX - this.camera.position.x) * Math.min(1, delta * 4);
    this.camera.position.y = 35 + shake;
    this.camera.position.x += shake;
    this.camera.lookAt(this.vehicle.position.x * 0.2, 0, this.vehicle.position.z - 25);

    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    if (this.animationId !== null) cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.onResize.bind(this));
    this.inputHandler.dispose();
    this.renderer.dispose();
  }
}
