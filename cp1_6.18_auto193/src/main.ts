import { PhysicsEngine } from './core/PhysicsEngine';
import { ControlPanel } from './ui/ControlPanel';
import { RenderEngine } from './render/RenderEngine';
import { ParticleSystem } from './utils/ParticleSystem';
import { GameInitializer } from './GameInitializer';
import type { GameState, RenderData } from './types';

class Game {
  private canvas: HTMLCanvasElement;
  private physicsEngine: PhysicsEngine;
  private controlPanel: ControlPanel;
  private renderEngine: RenderEngine;
  private particleSystem: ParticleSystem;
  private gameState: GameState;
  
  private lastTime: number = 0;
  private frameCount: number = 0;
  private fpsTime: number = 0;
  private currentFps: number = 60;
  private animationId: number | null = null;
  private statusChanged: boolean = false;

  constructor() {
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (!canvas) throw new Error('Canvas not found');
    
    this.canvas = canvas;
    this.physicsEngine = new PhysicsEngine();
    this.controlPanel = new ControlPanel();
    this.renderEngine = new RenderEngine(canvas);
    this.particleSystem = new ParticleSystem();
    this.gameState = GameInitializer.createInitialState();
    
    this.setupRestartKey();
  }

  private setupRestartKey(): void {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyR' && this.gameState.status !== 'playing') {
        this.restart();
      }
    });
  }

  start(): void {
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  private gameLoop(currentTime: number): void {
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.05);
    this.lastTime = currentTime;

    this.updateFPS(currentTime);

    const physicsStart = performance.now();
    this.update(deltaTime, currentTime / 1000);
    const physicsEnd = performance.now();
    
    const renderStart = performance.now();
    this.render(currentTime / 1000);
    const renderEnd = performance.now();

    if (this.frameCount % 60 === 0) {
      console.debug(`Physics: ${(physicsEnd - physicsStart).toFixed(2)}ms, Render: ${(renderEnd - renderStart).toFixed(2)}ms`);
    }

    this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
  }

  private updateFPS(currentTime: number): void {
    this.frameCount++;
    if (currentTime - this.fpsTime >= 1000) {
      this.currentFps = this.frameCount * 1000 / (currentTime - this.fpsTime);
      this.frameCount = 0;
      this.fpsTime = currentTime;
    }
  }

  private update(deltaTime: number, currentTime: number): void {
    const controlState = this.controlPanel.getControlState();

    this.physicsEngine.update(this.gameState, controlState, deltaTime, currentTime);
    this.particleSystem.update(deltaTime);

    if (this.gameState.status === 'playing') {
      const spaceship = this.gameState.spaceship;
      if (spaceship.thrust > 0.1) {
        const thrusterPos = {
          x: spaceship.position.x - Math.cos(spaceship.angle) * 15,
          y: spaceship.position.y - Math.sin(spaceship.angle) * 15
        };
        this.particleSystem.emitThruster(thrusterPos, spaceship.angle);
      }
    }

    if (this.gameState.status !== 'playing' && !this.statusChanged) {
      this.statusChanged = true;
      if (this.gameState.status === 'failed') {
        this.particleSystem.emitExplosion(this.gameState.spaceship.position);
      } else if (this.gameState.status === 'victory') {
        this.particleSystem.emitVictory(this.canvas.width);
      }
    }

    this.gameState.particles = this.particleSystem.getParticles();
  }

  private render(currentTime: number): void {
    const renderData: RenderData = {
      gameState: this.gameState,
      time: currentTime,
      fps: this.currentFps
    };
    this.renderEngine.render(renderData);
  }

  private restart(): void {
    this.physicsEngine.reset();
    this.controlPanel.reset();
    this.particleSystem.clear();
    this.gameState = GameInitializer.createInitialState();
    this.statusChanged = false;
  }

  destroy(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    this.controlPanel.destroy();
  }
}

const game = new Game();
game.start();

window.addEventListener('beforeunload', () => {
  game.destroy();
});
