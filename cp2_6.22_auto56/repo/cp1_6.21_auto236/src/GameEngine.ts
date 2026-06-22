import type {
  GameState,
  Block,
  Bullet,
  Particle,
  ScorePopup,
  BeatPhase,
  ComboEffectLevel,
} from './types';
import { Renderer } from './Renderer';
import { AudioAnalyzer } from './AudioAnalyzer';
import { ComboSystem } from './ComboSystem';

export class GameEngine {
  private static readonly INITIAL_LIVES = 5;
  private static readonly BASE_SCORE = 10;
  private static readonly BULLET_SPEED = 15;
  private static readonly BLOCK_SPEED_BASE = 1.2;
  private static readonly CENTER_RADIUS = 30;

  private canvas: HTMLCanvasElement;
  private renderer: Renderer;
  private audioAnalyzer: AudioAnalyzer;
  private comboSystem: ComboSystem;
  private state: GameState;
  private animationFrameId: number | null;
  private lastBeatCheckTime: number;
  private blockIdCounter: number;
  private bulletIdCounter: number;
  private lastFrameTime: number;
  private slowMoTimer: number;
  private slowMoDuration: number;
  private mouseX: number;
  private mouseY: number;
  private isMouseDown: boolean;
  private onStateUpdate: ((state: GameState) => void) | null;
  private onGameOver: ((result: { score: number; maxCombo: number; songName: string }) => void) | null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.audioAnalyzer = new AudioAnalyzer();
    this.comboSystem = new ComboSystem();
    this.state = this.createInitialState();
    this.animationFrameId = null;
    this.lastBeatCheckTime = 0;
    this.blockIdCounter = 0;
    this.bulletIdCounter = 0;
    this.lastFrameTime = 0;
    this.slowMoTimer = 0;
    this.slowMoDuration = 0;
    this.mouseX = canvas.width / 2;
    this.mouseY = canvas.height / 2;
    this.isMouseDown = false;
    this.onStateUpdate = null;
    this.onGameOver = null;

    this.comboSystem.setOnEffect((level) => {
      this.applyComboEffect(level);
    });
  }

  init(songName: string, bpm: number): void {
    this.state = this.createInitialState();
    this.state.songName = songName;
    this.state.bpm = bpm;
    this.comboSystem.reset();
    this.blockIdCounter = 0;
    this.bulletIdCounter = 0;
    this.slowMoTimer = 0;
    this.slowMoDuration = 0;
    this.lastBeatCheckTime = 0;
    this.lastFrameTime = 0;
  }

  start(): void {
    if (this.state.status === 'playing') return;
    this.state.status = 'playing';
    this.lastFrameTime = performance.now();
    this.gameLoop(this.lastFrameTime);
  }

  pause(): void {
    if (this.state.status !== 'playing') return;
    this.state.status = 'paused';
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  resume(): void {
    if (this.state.status !== 'paused') return;
    this.state.status = 'playing';
    this.lastFrameTime = performance.now();
    this.gameLoop(this.lastFrameTime);
  }

  stop(): void {
    this.state.status = 'ended';
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  handleMouseMove(x: number, y: number): void {
    this.mouseX = x;
    this.mouseY = y;
  }

  handleMouseDown(x: number, y: number): void {
    this.mouseX = x;
    this.mouseY = y;
    this.isMouseDown = true;
    this.spawnBullet(x, y);
  }

  handleMouseUp(): void {
    this.isMouseDown = false;
  }

  setOnStateUpdate(callback: (state: GameState) => void): void {
    this.onStateUpdate = callback;
  }

  setOnGameOver(callback: (result: { score: number; maxCombo: number; songName: string }) => void): void {
    this.onGameOver = callback;
  }

  getAudioAnalyzer(): AudioAnalyzer {
    return this.audioAnalyzer;
  }

  getState(): GameState {
    return this.state;
  }

  destroy(): void {
    this.stop();
    this.audioAnalyzer.destroy();
    this.onStateUpdate = null;
    this.onGameOver = null;
  }

  private createInitialState(): GameState {
    return {
      status: 'idle',
      score: 0,
      lives: GameEngine.INITIAL_LIVES,
      combo: 0,
      maxCombo: 0,
      scoreMultiplier: 1,
      blocks: [],
      bullets: [],
      particles: [],
      scorePopups: [],
      songName: '',
      songProgress: 0,
      bpm: 120,
      screenShake: { x: 0, y: 0, duration: 0 },
      damageFlash: { active: false, duration: 0 },
      backgroundFlash: false,
    };
  }

  private gameLoop(currentTime: number): void {
    if (this.state.status !== 'playing') return;

    let deltaTime = (currentTime - this.lastFrameTime) / 16.67;
    this.lastFrameTime = currentTime;

    if (this.slowMoTimer > 0) {
      this.slowMoTimer -= deltaTime * 16.67;
      deltaTime *= 0.3;
    }

    this.state.songProgress = this.audioAnalyzer.getProgress();

    const beatEvents = this.audioAnalyzer.getBeatEvents();
    for (const event of beatEvents) {
      this.spawnWave(event.phase);
    }

    this.updateBlocks(deltaTime);
    this.updateBullets(deltaTime);
    this.checkCollisions();
    this.updateParticles(deltaTime);
    this.updateScorePopups(deltaTime);
    this.updateScreenShake(deltaTime);
    this.updateDamageFlash(deltaTime);
    this.state.backgroundFlash = false;

    this.cleanupDeadObjects();
    this.checkBlocksReachCenter();
    this.checkGameOver();

    this.renderer.render(this.state);

    if (this.onStateUpdate) {
      this.onStateUpdate(this.state);
    }

    this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time));
  }

  private spawnWave(phase: BeatPhase): void {
    const count = Math.floor(Math.random() * 5) + 4;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const maxDimension = Math.max(this.canvas.width, this.canvas.height);
    const spawnRadius = maxDimension / 2 + 100;

    const colorMap: Record<BeatPhase, string> = {
      0: '#FF3366',
      1: '#3366FF',
      2: '#33FF66',
      3: '#9933FF',
    };

    for (let i = 0; i < count; i++) {
      const baseAngle = (i / count) * Math.PI * 2;
      const randomOffset = (Math.random() - 0.5) * 0.3;
      const angle = baseAngle + randomOffset;

      const startX = centerX + Math.cos(angle) * spawnRadius;
      const startY = centerY + Math.sin(angle) * spawnRadius;
      const toCenterAngle = Math.atan2(centerY - startY, centerX - startX);

      const block: Block = {
        id: this.blockIdCounter++,
        x: startX,
        y: startY,
        startX,
        startY,
        angle: toCenterAngle,
        speed: GameEngine.BLOCK_SPEED_BASE,
        size: Math.floor(Math.random() * 21) + 50,
        beatPhase: phase,
        color: colorMap[phase],
        opacity: 0.3 + Math.random() * 0.6,
        distanceFromCenter: spawnRadius,
        spawnTime: performance.now(),
      };

      this.state.blocks.push(block);
    }
  }

  private spawnBullet(x: number, y: number): void {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const angle = Math.atan2(centerY - y, centerX - x);

    const bullet: Bullet = {
      id: this.bulletIdCounter++,
      x,
      y,
      vx: Math.cos(angle) * GameEngine.BULLET_SPEED,
      vy: Math.sin(angle) * GameEngine.BULLET_SPEED,
      speed: GameEngine.BULLET_SPEED,
    };

    this.state.bullets.push(bullet);
  }

  private updateBlocks(deltaTime: number): void {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    for (const block of this.state.blocks) {
      block.x += Math.cos(block.angle) * block.speed * deltaTime;
      block.y += Math.sin(block.angle) * block.speed * deltaTime;
      block.distanceFromCenter = Math.sqrt(
        Math.pow(block.x - centerX, 2) + Math.pow(block.y - centerY, 2)
      );
    }
  }

  private updateBullets(deltaTime: number): void {
    for (const bullet of this.state.bullets) {
      bullet.x += bullet.vx * deltaTime;
      bullet.y += bullet.vy * deltaTime;
    }
  }

  private updateParticles(deltaTime: number): void {
    for (const particle of this.state.particles) {
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;
      particle.life -= particle.decay * deltaTime;
      particle.vx *= 0.98;
      particle.vy *= 0.98;
    }
  }

  private updateScorePopups(deltaTime: number): void {
    for (const popup of this.state.scorePopups) {
      popup.y -= 1.5 * deltaTime;
      popup.life -= popup.decay * deltaTime;
    }
  }

  private updateDamageFlash(deltaTime: number): void {
    if (this.state.damageFlash.active) {
      this.state.damageFlash.duration -= deltaTime * 16.67;
      if (this.state.damageFlash.duration <= 0) {
        this.state.damageFlash.active = false;
        this.state.damageFlash.duration = 0;
      }
    }
  }

  private checkCollisions(): void {
    const bulletsToRemove = new Set<number>();
    const blocksToRemove = new Set<number>();

    for (const bullet of this.state.bullets) {
      for (const block of this.state.blocks) {
        const dx = bullet.x - block.x;
        const dy = bullet.y - block.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const collisionRadius = block.size / 2 + 5;

        if (distance < collisionRadius) {
          bulletsToRemove.add(bullet.id);
          blocksToRemove.add(block.id);
          this.hitBlock(block, bullet.x, bullet.y);
          break;
        }
      }
    }

    this.state.bullets = this.state.bullets.filter((b) => !bulletsToRemove.has(b.id));
    this.state.blocks = this.state.blocks.filter((b) => !blocksToRemove.has(b.id));
  }

  private hitBlock(block: Block, hitX: number, hitY: number): void {
    const result = this.comboSystem.onHit();
    this.state.combo = this.comboSystem.getCombo();
    this.state.maxCombo = this.comboSystem.getMaxCombo();
    this.state.scoreMultiplier = result.multiplier;

    const score = Math.floor(GameEngine.BASE_SCORE * result.multiplier);
    this.state.score += score;

    this.spawnExplosion(hitX, hitY, block.color, 15);

    this.state.screenShake = { x: 0.5, y: 0.5, duration: 100 };

    const popup: ScorePopup = {
      x: hitX,
      y: hitY,
      text: `+${score}`,
      life: 1,
      decay: 0.02,
      color: block.color,
    };
    this.state.scorePopups.push(popup);

    for (const effect of result.effects) {
      this.applyComboEffect(effect);
    }
  }

  private spawnExplosion(x: number, y: number, color: string, count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      const particle: Particle = {
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 4 + 2,
        life: 1,
        decay: 0.03,
      };
      this.state.particles.push(particle);
    }
  }

  private damagePlayer(): void {
    this.comboSystem.onMiss();
    this.state.combo = 0;
    this.state.scoreMultiplier = 1;
    this.state.lives--;

    this.state.damageFlash = { active: true, duration: 150 };

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    this.spawnExplosion(centerX, centerY, '#FF0000', 30);

    this.checkGameOver();
  }

  private applyComboEffect(level: ComboEffectLevel): void {
    switch (level) {
      case 'glow':
        break;
      case 'flash':
        this.state.backgroundFlash = true;
        break;
      case 'slowmo':
        this.slowMoTimer = 300;
        this.slowMoDuration = 300;
        break;
      case 'burst':
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const colors = ['#FF3366', '#3366FF', '#33FF66', '#9933FF', '#FFD700'];
        for (let i = 0; i < 100; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 10 + 5;
          const color = colors[Math.floor(Math.random() * colors.length)];
          const particle: Particle = {
            x: centerX,
            y: centerY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color,
            size: Math.random() * 6 + 3,
            life: 1,
            decay: 0.015,
          };
          this.state.particles.push(particle);
        }
        break;
    }
  }

  private updateScreenShake(delta: number): void {
    if (this.state.screenShake.duration > 0) {
      this.state.screenShake.duration -= delta * 16.67;
      if (this.state.screenShake.duration <= 0) {
        this.state.screenShake.x = 0;
        this.state.screenShake.y = 0;
        this.state.screenShake.duration = 0;
      }
    }
  }

  private checkBlocksReachCenter(): void {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    const reachedCenter: Block[] = [];
    for (const block of this.state.blocks) {
      const dx = block.x - centerX;
      const dy = block.y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < GameEngine.CENTER_RADIUS) {
        reachedCenter.push(block);
      }
    }

    if (reachedCenter.length > 0) {
      const idsToRemove = new Set(reachedCenter.map((b) => b.id));
      this.state.blocks = this.state.blocks.filter((b) => !idsToRemove.has(b.id));
      for (let i = 0; i < reachedCenter.length; i++) {
        this.damagePlayer();
      }
    }
  }

  private checkGameOver(): void {
    const songEnded = this.state.songProgress >= 1;
    if (this.state.lives <= 0 || songEnded) {
      this.stop();
      if (this.onGameOver) {
        this.onGameOver({
          score: this.state.score,
          maxCombo: this.state.maxCombo,
          songName: this.state.songName,
        });
      }
    }
  }

  private cleanupDeadObjects(): void {
    this.state.particles = this.state.particles.filter((p) => p.life > 0);
    this.state.scorePopups = this.state.scorePopups.filter((p) => p.life > 0);

    const margin = 200;
    this.state.bullets = this.state.bullets.filter(
      (b) =>
        b.x >= -margin &&
        b.x <= this.canvas.width + margin &&
        b.y >= -margin &&
        b.y <= this.canvas.height + margin
    );
  }
}
