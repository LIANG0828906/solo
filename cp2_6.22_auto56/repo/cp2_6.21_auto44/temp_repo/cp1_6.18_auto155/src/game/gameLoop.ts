import { GameState, AimState, Particle } from '../types';
import { TrackGenerator } from './trackGenerator';
import { BoomerangEngine } from './boomerangEngine';
import { ScoringEngine } from './scoringEngine';
import { Renderer } from '../ui/renderer';

export class GameLoop {
  private canvas: HTMLCanvasElement;
  private renderer: Renderer;
  private trackGenerator: TrackGenerator;
  private boomerangEngine: BoomerangEngine;
  private scoringEngine: ScoringEngine;
  private gameState: GameState;
  private aimState: AimState;
  private particles: Particle[] = [];
  
  private lastTime: number = 0;
  private animationId: number = 0;
  private isRunning: boolean = false;
  private fps: number = 0;
  private fpsTimer: number = 0;
  private frameCount: number = 0;

  constructor(canvas: HTMLCanvasElement, renderer: Renderer) {
    this.canvas = canvas;
    this.renderer = renderer;
    
    this.gameState = this.createInitialState();
    this.aimState = {
      isAiming: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0
    };

    this.trackGenerator = new TrackGenerator(canvas, this.gameState);
    this.boomerangEngine = new BoomerangEngine(canvas);
    this.scoringEngine = new ScoringEngine(this.gameState);

    this.setupEventListeners();
  }

  private createInitialState(): GameState {
    return {
      score: 0,
      level: 1,
      combo: 0,
      maxCombo: 0,
      comboBonusActive: false,
      comboBonusTimer: 0,
      throwCount: 3,
      maxThrows: 5,
      throwRecoveryTimer: 0,
      trackSpeed: 5,
      trackOffset: 0,
      trackCurvature: 0,
      curvaturePhase: 0,
      screenShake: 0,
      screenShakeDuration: 0,
      gameOver: false,
      gameTime: 0
    };
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));
    
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));

    window.addEventListener('resize', this.handleResize.bind(this));
  }

  private handleMouseDown(e: MouseEvent): void {
    if (this.gameState.gameOver) {
      this.checkRestartClick(e.clientX, e.clientY);
      return;
    }

    if (this.boomerangEngine.isFlying()) return;
    if (!this.scoringEngine.canThrow()) return;

    this.aimState.isAiming = true;
    this.aimState.startX = this.canvas.width * 0.2;
    this.aimState.startY = this.canvas.height * 0.5;
    this.aimState.currentX = e.clientX;
    this.aimState.currentY = e.clientY;
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.aimState.isAiming) return;

    this.aimState.currentX = e.clientX;
    this.aimState.currentY = e.clientY;
  }

  private handleMouseUp(e: MouseEvent): void {
    if (!this.aimState.isAiming) return;

    this.throwBoomerang();
  }

  private handleTouchStart(e: TouchEvent): void {
    e.preventDefault();
    
    if (this.gameState.gameOver) {
      const touch = e.touches[0] || e.changedTouches[0];
      this.checkRestartClick(touch.clientX, touch.clientY);
      return;
    }

    if (this.boomerangEngine.isFlying()) return;
    if (!this.scoringEngine.canThrow()) return;

    const touch = e.touches[0];
    this.aimState.isAiming = true;
    this.aimState.startX = this.canvas.width * 0.2;
    this.aimState.startY = this.canvas.height * 0.5;
    this.aimState.currentX = touch.clientX;
    this.aimState.currentY = touch.clientY;
  }

  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault();
    
    if (!this.aimState.isAiming) return;

    const touch = e.touches[0];
    this.aimState.currentX = touch.clientX;
    this.aimState.currentY = touch.clientY;
  }

  private handleTouchEnd(e: TouchEvent): void {
    e.preventDefault();
    
    if (!this.aimState.isAiming) return;

    this.throwBoomerang();
  }

  private throwBoomerang(): void {
    const thrown = this.boomerangEngine.throw(
      this.aimState.startX,
      this.aimState.startY,
      this.aimState.currentX,
      this.aimState.currentY
    );

    if (thrown) {
      this.scoringEngine.useThrow();
    }

    this.aimState.isAiming = false;
  }

  private checkRestartClick(x: number, y: number): void {
    const button = (this.canvas as any)._restartButton;
    if (button && 
        x >= button.x && x <= button.x + button.width &&
        y >= button.y && y <= button.y + button.height) {
      this.restart();
    }
  }

  private handleResize(): void {
    this.trackGenerator.resize();
    this.boomerangEngine.resize();
  }

  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  restart(): void {
    this.scoringEngine.reset();
    this.trackGenerator.reset();
    this.boomerangEngine.reset();
    this.particles = [];
    this.gameState.gameOver = false;
  }

  private gameLoop(currentTime: number): void {
    if (!this.isRunning) return;

    const deltaTime = Math.min(currentTime - this.lastTime, 50);
    this.lastTime = currentTime;

    this.frameCount++;
    this.fpsTimer += deltaTime;
    if (this.fpsTimer >= 1000) {
      this.fps = Math.round(this.frameCount * 1000 / this.fpsTimer);
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    this.update(deltaTime);
    this.render();

    this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
  }

  private update(deltaTime: number): void {
    if (this.gameState.gameOver) return;

    this.trackGenerator.update(deltaTime);

    const caught = this.boomerangEngine.update(deltaTime, this.gameState.trackOffset);
    
    if (caught) {
      this.scoringEngine.recoverThrow();
    }

    this.scoringEngine.update(deltaTime);
    this.scoringEngine.updateScreenShake(deltaTime);

    this.checkCollisions();
    this.updateParticles(deltaTime);

    this.scoringEngine.checkGameOver(this.boomerangEngine.isFlying());
  }

  private checkCollisions(): void {
    const starHit = this.boomerangEngine.checkStarCollision(this.trackGenerator.getStars());
    if (starHit) {
      this.trackGenerator.collectStar(starHit);
      const points = this.scoringEngine.addStarPoints(10);
      this.createStarParticles(starHit.x, starHit.y);
    }

    const meteorHit = this.boomerangEngine.checkMeteorCollision(this.trackGenerator.getMeteors());
    if (meteorHit) {
      this.scoringEngine.addMeteorPenalty(5);
      this.scoringEngine.triggerScreenShake(300);
      this.createMeteorParticles(meteorHit.x, meteorHit.y);
    }
  }

  private createStarParticles(x: number, y: number): void {
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const speed = 2 + Math.random() * 3;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 500,
        maxLife: 500,
        color: '#FFD700',
        size: 3 + Math.random() * 3
      });
    }
  }

  private createMeteorParticles(x: number, y: number): void {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 400,
        maxLife: 400,
        color: '#888888',
        size: 2 + Math.random() * 3
      });
    }
  }

  private updateParticles(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.life -= deltaTime;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private render(): void {
    this.renderer.clear();

    if (this.gameState.screenShake > 0) {
      this.renderer.applyScreenShake(this.gameState.screenShake);
    }

    this.renderer.drawBackgroundStars(this.trackGenerator.getBackgroundStars());
    this.renderer.drawTrack(this.trackGenerator.getTrackPoints());

    for (const star of this.trackGenerator.getStars()) {
      this.renderer.drawStar(star);
    }

    for (const meteor of this.trackGenerator.getMeteors()) {
      this.renderer.drawMeteor(meteor);
    }

    this.drawParticles();

    this.renderer.drawCatchRings(this.boomerangEngine.getCatchRings());
    this.renderer.drawBoomerang(this.boomerangEngine.getBoomerang());
    this.renderer.drawAimLine(this.aimState);

    this.renderer.resetTransform();

    this.renderer.drawHUD(this.gameState);

    if (this.gameState.gameOver) {
      this.renderer.drawGameOver(this.gameState, () => this.restart());
    }

    this.drawFPS();
  }

  private drawParticles(): void {
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      this.renderer['ctx'].beginPath();
      this.renderer['ctx'].arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.renderer['ctx'].fillStyle = p.color;
      this.renderer['ctx'].globalAlpha = alpha;
      this.renderer['ctx'].fill();
      this.renderer['ctx'].globalAlpha = 1;
    }
  }

  private drawFPS(): void {
    this.renderer['ctx'].fillStyle = 'rgba(255, 255, 255, 0.5)';
    this.renderer['ctx'].font = '12px monospace';
    this.renderer['ctx'].textAlign = 'left';
    this.renderer['ctx'].fillText(`FPS: ${this.fps}`, 10, 20);
  }

  getState(): GameState {
    return this.gameState;
  }

  getFPS(): number {
    return this.fps;
  }
}
