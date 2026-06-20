import * as THREE from 'three';
import { TrackManager } from './track';
import { Player } from './player';
import { UIManager } from './ui';

type GameState = 'loading' | 'start' | 'playing' | 'gameover';

class Game {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private trackManager: TrackManager;
  private player: Player;
  private ui: UIManager;
  private clock: THREE.Clock;
  
  private gameState: GameState = 'loading';
  private score = 0;
  private scoreAccumulator = 0;
  
  private stars: THREE.Points | null = null;

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0A0015);
    this.scene.fog = new THREE.Fog(0x0A0015, 50, 200);

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 4, 7);
    this.camera.lookAt(0, 1, -20);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    const container = document.getElementById('game-container');
    if (container) {
      container.appendChild(this.renderer.domElement);
    }

    this.setupLights();
    this.createStars();

    this.trackManager = new TrackManager(this.scene);
    this.player = new Player(this.scene);
    this.ui = new UIManager();
    this.clock = new THREE.Clock();

    this.setupEventListeners();
    this.init();
  }

  private setupLights() {
    const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    this.scene.add(directionalLight);

    const pointLight1 = new THREE.PointLight(0xFF00FF, 1, 50);
    pointLight1.position.set(-10, 5, -30);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x00FFFF, 1, 50);
    pointLight2.position.set(10, 5, -50);
    this.scene.add(pointLight2);
  }

  private createStars() {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 1000;
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 400;
      positions[i + 1] = Math.random() * 100 + 20;
      positions[i + 2] = (Math.random() - 0.5) * 600 - 200;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.5,
      transparent: true,
      opacity: 0.8
    });

    this.stars = new THREE.Points(starGeometry, starMaterial);
    this.scene.add(this.stars);
  }

  private setupEventListeners() {
    window.addEventListener('resize', () => this.onWindowResize());
    
    document.addEventListener('keydown', (e) => this.onKeyDown(e));
  }

  private onKeyDown(e: KeyboardEvent) {
    if (this.gameState === 'start' && e.code === 'Space') {
      this.startGame();
    }
    
    if (this.gameState === 'gameover' && e.code === 'KeyR') {
      this.restartGame();
    }
  }

  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private init() {
    setTimeout(() => {
      this.ui.hideLoading();
      this.ui.showStartScreen();
      this.gameState = 'start';
    }, 1500);

    this.animate();
  }

  private startGame() {
    this.ui.hideStartScreen();
    this.ui.showHUD();
    this.ui.updateLives(this.player.getLives());
    this.gameState = 'playing';
    this.score = 0;
    this.scoreAccumulator = 0;
  }

  private restartGame() {
    this.player.reset();
    this.trackManager.reset();
    this.ui.reset();
    this.score = 0;
    this.scoreAccumulator = 0;
    this.gameState = 'playing';
    this.ui.showHUD();
  }

  private gameOver() {
    this.gameState = 'gameover';
    this.ui.showGameOver(this.score);
  }

  private update(deltaTime: number) {
    if (this.gameState !== 'playing') {
      return;
    }

    const currentSpeed = this.player.update(deltaTime, this.score);
    const playerPos = this.player.getPosition();

    this.trackManager.update(deltaTime, currentSpeed, playerPos.z, this.score);

    const obstacle = this.trackManager.checkObstacleCollision(playerPos);
    if (obstacle) {
      const isGameOver = this.player.takeDamage();
      this.ui.showDamageEffect();
      this.ui.updateLives(this.player.getLives());
      this.trackManager.removeObstacle(obstacle);
      
      if (isGameOver) {
        this.gameOver();
        return;
      }
    }

    const energyOrb = this.trackManager.checkEnergyOrbCollision(playerPos);
    if (energyOrb) {
      this.player.collectEnergy();
      this.score += 5;
    }

    this.scoreAccumulator += deltaTime * 10;
    if (this.scoreAccumulator >= 1) {
      this.score += Math.floor(this.scoreAccumulator);
      this.scoreAccumulator = this.scoreAccumulator % 1;
    }

    this.ui.updateScore(this.score);
    this.ui.updateSpeed(currentSpeed);
    this.ui.updateEnergy(this.player.getEnergy(), this.player.getMaxEnergy());

    this.camera.position.x = playerPos.x * 0.3;
    this.camera.position.y = 5 + Math.sin(Date.now() * 0.001) * 0.1;
    this.camera.lookAt(playerPos.x * 0.5, 1, playerPos.z - 10);

    if (this.stars) {
      this.stars.rotation.y += deltaTime * 0.01;
    }
  }

  private animate() {
    requestAnimationFrame(() => this.animate());

    const deltaTime = Math.min(this.clock.getDelta(), 0.1);

    this.update(deltaTime);
    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
