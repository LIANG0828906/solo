import * as THREE from 'three';
import { Player, PlayerBounds } from './player';
import { Tunnel } from './tunnel';
import { ObstacleManager, CollisionResult } from './obstacle';

interface GameState {
  isRunning: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  isStarted: boolean;
  elapsedTime: number;
  score: number;
  waveCollected: number;
  speedMultiplier: number;
}

class Game {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private canvas: HTMLCanvasElement;
  
  private player: Player;
  private tunnel: Tunnel;
  private obstacleManager: ObstacleManager;
  
  private gameState: GameState;
  private clock: THREE.Clock;
  private animationFrameId: number | null = null;
  
  private keys: { [key: string]: boolean } = {};
  private mouseX: number = 0;
  private targetY: number = 0;
  
  private timerElement: HTMLElement | null;
  private scoreElement: HTMLElement | null;
  private flashOverlay: HTMLElement | null;
  private startScreen: HTMLElement | null;
  private gameOverScreen: HTMLElement | null;
  private finalTimeElement: HTMLElement | null;
  private finalWavesElement: HTMLElement | null;
  private finalScoreElement: HTMLElement | null;
  private startBtn: HTMLElement | null;
  private restartBtn: HTMLElement | null;
  


  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 5);
    
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    
    this.player = new Player(this.scene);
    this.tunnel = new Tunnel(this.scene);
    this.obstacleManager = new ObstacleManager(
      this.scene,
      () => this.tunnel.getCurrentRadius(),
      () => this.tunnel.getCurrentSpeed(),
      () => this.tunnel.getRotationAngle()
    );
    
    this.gameState = {
      isRunning: false,
      isPaused: false,
      isGameOver: false,
      isStarted: false,
      elapsedTime: 0,
      score: 0,
      waveCollected: 0,
      speedMultiplier: 1
    };
    
    this.clock = new THREE.Clock();
    
    this.timerElement = document.getElementById('timer');
    this.scoreElement = document.getElementById('score-display');
    this.flashOverlay = document.getElementById('flash-overlay');
    this.startScreen = document.getElementById('start-screen');
    this.gameOverScreen = document.getElementById('game-over-screen');
    this.finalTimeElement = document.getElementById('final-time');
    this.finalWavesElement = document.getElementById('final-waves');
    this.finalScoreElement = document.getElementById('final-score');
    this.startBtn = document.getElementById('start-btn');
    this.restartBtn = document.getElementById('restart-btn');
    
    this.setupEventListeners();
    this.updateUI();
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.onWindowResize.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('keyup', this.onKeyUp.bind(this));
    
    if (this.startBtn) {
      this.startBtn.addEventListener('click', () => this.startGame());
    }
    
    if (this.restartBtn) {
      this.restartBtn.addEventListener('click', () => this.restartGame());
    }
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private onMouseMove(event: MouseEvent): void {
    this.mouseX = event.clientX;
    this.player.setTargetX(this.mouseX);
  }

  private onKeyDown(event: KeyboardEvent): void {
    this.keys[event.key.toLowerCase()] = true;
    
    if (event.key.toLowerCase() === 'w') {
      this.targetY = 3;
      this.player.setTargetY(this.targetY);
    } else if (event.key.toLowerCase() === 's') {
      this.targetY = -3;
      this.player.setTargetY(this.targetY);
    }
  }

  private onKeyUp(event: KeyboardEvent): void {
    this.keys[event.key.toLowerCase()] = false;
    
    if (event.key.toLowerCase() === 'w' || event.key.toLowerCase() === 's') {
      if (!this.keys['w'] && !this.keys['s']) {
        this.targetY = 0;
        this.player.setTargetY(this.targetY);
      }
    }
  }

  private startGame(): void {
    if (this.startScreen) {
      this.startScreen.classList.add('hidden');
    }
    
    this.gameState.isStarted = true;
    this.gameState.isRunning = true;
    this.gameState.isPaused = false;
    this.gameState.isGameOver = false;
    
    this.clock.start();
    this.animate();
  }

  private restartGame(): void {
    this.player.reset();
    this.tunnel.reset();
    this.obstacleManager.reset();
    
    this.gameState = {
      isRunning: true,
      isPaused: false,
      isGameOver: false,
      isStarted: true,
      elapsedTime: 0,
      score: 0,
      waveCollected: 0,
      speedMultiplier: 1
    };
    
    if (this.gameOverScreen) {
      this.gameOverScreen.classList.remove('active');
    }
    
    this.mouseX = window.innerWidth / 2;
    this.targetY = 0;
    this.player.setTargetX(this.mouseX);
    this.player.setTargetY(this.targetY);
    
    this.clock.start();
    this.updateUI();
  }

  private triggerFlash(): void {
    if (this.flashOverlay) {
      this.flashOverlay.classList.add('active');
      setTimeout(() => {
        if (this.flashOverlay) {
          this.flashOverlay.classList.remove('active');
        }
      }, 100);
    }
  }

  private handleCollision(result: CollisionResult): void {
    if (result.type === 'obstacle') {
      this.gameState.isRunning = false;
      this.gameState.isGameOver = true;
      
      this.player.setVisible(false);
      this.player.triggerExplosion();
      this.player.triggerShake(2, 0.5);
      
      setTimeout(() => {
        this.showGameOver();
      }, 2000);
      
      this.obstacleManager.removeObject(result.object);
    } else if (result.type === 'wave') {
      this.gameState.waveCollected++;
      this.gameState.score += 2;
      this.triggerFlash();
      this.obstacleManager.removeObject(result.object);
      this.updateUI();
    }
  }

  private showGameOver(): void {
    if (this.gameOverScreen) {
      this.gameOverScreen.classList.add('active');
    }
    
    if (this.finalTimeElement) {
      this.finalTimeElement.textContent = `${this.gameState.elapsedTime.toFixed(1)}s`;
    }
    if (this.finalWavesElement) {
      this.finalWavesElement.textContent = `${this.gameState.waveCollected}`;
    }
    if (this.finalScoreElement) {
      this.finalScoreElement.textContent = `${this.gameState.score}`;
    }
  }

  private updateUI(): void {
    if (this.timerElement) {
      this.timerElement.textContent = `时间: ${this.gameState.elapsedTime.toFixed(1)}s`;
    }
    if (this.scoreElement) {
      this.scoreElement.textContent = `分数: ${this.gameState.score} | 光波: ${this.gameState.waveCollected}`;
    }
  }

  private animate(): void {
    this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
    
    const deltaTime = Math.min(this.clock.getDelta(), 0.1);
    
    if (this.gameState.isRunning && !this.gameState.isPaused) {
      this.gameState.elapsedTime += deltaTime;
      this.updateUI();
      
      this.gameState.speedMultiplier = 1 + (this.gameState.elapsedTime / 120);
      
      if (!this.gameState.isGameOver) {
        this.tunnel.update(deltaTime, this.gameState.speedMultiplier);
        this.obstacleManager.update(
          deltaTime,
          this.player.getPosition(),
          this.gameState.isPaused
        );
        this.player.update(deltaTime);
      } else {
        this.player.update(deltaTime);
      }
      
      if (!this.gameState.isGameOver) {
        const playerBounds: PlayerBounds = this.player.getBounds();
        const collision = this.obstacleManager.checkCollision(playerBounds);
        
        if (collision) {
          this.handleCollision(collision);
        }
      }
      
      const cameraPos = this.tunnel.getCameraPosition();
      const playerPos = this.player.getPosition();
      this.camera.position.set(
        playerPos.x * 0.3,
        playerPos.y * 0.3 + 1,
        cameraPos.z + 2
      );
      this.camera.lookAt(playerPos.x * 0.5, playerPos.y * 0.5, playerPos.z - 10);
    }
    
    this.renderer.render(this.scene, this.camera);
  }

  public start(): void {
    this.updateUI();
  }

  public dispose(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    window.removeEventListener('resize', this.onWindowResize.bind(this));
    window.removeEventListener('mousemove', this.onMouseMove.bind(this));
    window.removeEventListener('keydown', this.onKeyDown.bind(this));
    window.removeEventListener('keyup', this.onKeyUp.bind(this));
    
    this.tunnel.dispose();
    this.obstacleManager.dispose();
    this.renderer.dispose();
  }
}

const game = new Game();
game.start();
