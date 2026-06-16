import { Player, Enemy } from './entities';
import { updateGameState, resetGameState, type GameState } from './gameState';
import {
  drawBackground, drawHealthBar, drawParticles, drawDamageFlash,
  drawUI, drawVictory, drawControlsHint, drawPlayer, drawEnemy, drawGroundCracks,
  type Particle, type Hitbox, type GroundCrack
} from './rendering';

const WAVE_INTERVAL = 15;
const MAX_ENTITIES = 50;

interface HealthPotion {
  x: number;
  y: number;
  width: number;
  height: number;
  vy: number;
}

export class GameEngine {
  static checkAABB(a: Hitbox, b: Hitbox): boolean {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  player: Player;
  enemies: Enemy[];
  particles: Particle[];
  victoryParticles: Particle[];
  groundCracks: GroundCrack[];
  healthPotions: HealthPotion[];
  gameState: GameState;
  keys: Set<string>;
  lastTime: number;
  animationFrameId: number | null;
  waveTimer: number;
  spawnCount: number;
  enemiesPerWave: number;
  maxEnemies: number;
  damageFlashTimer: number;
  damageFlashAlpha: number;
  baseWidth: 1280;
  baseHeight: 720;
  scale: number;
  running: boolean;
  frameCount: number;
  fps: number;
  lastFpsUpdate: number;
  enemySpawnTimer: number;
  rPressed: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.baseWidth = 1280;
    this.baseHeight = 720;
    this.scale = 1;
    this.running = false;
    this.keys = new Set();
    this.lastTime = 0;
    this.animationFrameId = null;
    this.frameCount = 0;
    this.fps = 0;
    this.lastFpsUpdate = 0;
    this.waveTimer = 0;
    this.spawnCount = 0;
    this.enemiesPerWave = 2;
    this.maxEnemies = 6;
    this.damageFlashTimer = 0;
    this.damageFlashAlpha = 0;
    this.enemySpawnTimer = 0;

    const groundY = this.baseHeight - 80;
    this.player = new Player(200, groundY - 60);
    this.enemies = [];
    this.particles = [];
    this.victoryParticles = [];
    this.groundCracks = [];
    this.healthPotions = [];
    this.gameState = resetGameState();

    this.handleResize();
    this.bindEvents();
  }

  private bindEvents(): void {
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  init(): void {
    const groundY = this.baseHeight - 80;
    this.player.reset(200, groundY - 60);
    this.enemies = [];
    this.particles = [];
    this.victoryParticles = [];
    this.groundCracks = [];
    this.healthPotions = [];
    this.gameState = resetGameState();
    this.waveTimer = 0;
    this.spawnCount = 0;
    this.enemiesPerWave = 2;
    this.damageFlashTimer = 0;
    this.damageFlashAlpha = 0;
    this.enemySpawnTimer = 0;
    this.rPressed = false;
    this.keys.clear();
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.lastFpsUpdate = this.lastTime;
    this.gameLoop(this.lastTime);
  }

  stop(): void {
    this.running = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private gameLoop(currentTime: number): void {
    if (!this.running) return;

    const dt = 1 / 60;
    let deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    this.frameCount++;
    if (currentTime - this.lastFpsUpdate >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsUpdate = currentTime;
    }

    while (deltaTime > 0) {
      const step = Math.min(dt, deltaTime);
      this.update(step);
      deltaTime -= step;
    }

    this.render();

    this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
  }

  private update(dt: number): void {
    if (this.gameState.phase === 'victory') {
      this.updateVictoryParticles(dt);
      return;
    }

    const groundY = this.baseHeight - 80;
    const pillarWidth = 40;

    this.player.update(dt, this.keys, this.baseWidth, groundY, pillarWidth);
    this.updateEnemies(dt, groundY);
    this.updateParticles(dt);
    this.updateGroundCracks(dt);
    this.updateHealthPotions(dt, groundY);
    this.checkCollisions();
    this.updateWaveSpawning(dt);
    this.updateTimers(dt);
    this.checkVictory();

    const rPressed = this.keys.has('r') || this.keys.has('R');
    if (rPressed && !this.rPressed) {
      this.init();
    }
    this.rPressed = rPressed;
  }

  private updateEnemies(dt: number, groundY: number): void {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(dt, this.player.x, this.player.y, groundY);

      if (enemy.health <= 0) {
        this.createHitParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 1);
        if (Math.random() < 0.5) {
          this.healthPotions.push({
            x: enemy.x + enemy.width / 2 - 10,
            y: enemy.y,
            width: 20,
            height: 20,
            vy: -150,
          });
        }
        this.enemies.splice(i, 1);
        this.gameState = updateGameState(this.gameState, {
          kills: this.gameState.kills + 1,
        });
      }
    }
  }

  private updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      p.vy += 200 * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    this.enforceEntityLimit();
  }

  private updateVictoryParticles(dt: number): void {
    for (let i = this.victoryParticles.length - 1; i >= 0; i--) {
      const p = this.victoryParticles[i];
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      p.vy += 100 * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.victoryParticles.splice(i, 1);
      }
    }

    if (this.victoryParticles.length < 100) {
      for (let i = 0; i < 3; i++) {
        this.victoryParticles.push({
          x: this.baseWidth / 2 + (Math.random() - 0.5) * 100,
          y: this.baseHeight / 2,
          vx: (Math.random() - 0.5) * 8,
          vy: -Math.random() * 8 - 2,
          life: 2,
          maxLife: 2,
          color: '#ffffff',
        });
      }
    }
  }

  private updateHealthPotions(dt: number, groundY: number): void {
    for (let i = this.healthPotions.length - 1; i >= 0; i--) {
      const potion = this.healthPotions[i];
      potion.vy += 600 * dt;
      potion.y += potion.vy * dt;

      if (potion.y > groundY - potion.height) {
        potion.y = groundY - potion.height;
        potion.vy = 0;
      }
    }
  }

  private updateWaveSpawning(dt: number): void {
    this.waveTimer += dt;

    if (this.waveTimer >= WAVE_INTERVAL) {
      this.waveTimer = 0;
      this.spawnCount = 0;
      this.enemiesPerWave++;
      this.gameState = updateGameState(this.gameState, {
        wave: this.gameState.wave + 1,
      });
    }

    this.enemySpawnTimer += dt;
    if (this.enemySpawnTimer >= 2 && this.spawnCount < this.enemiesPerWave && this.enemies.length < this.maxEnemies) {
      this.spawnEnemy();
      this.spawnCount++;
      this.enemySpawnTimer = 0;
    }
  }

  private updateTimers(dt: number): void {
    if (this.damageFlashTimer > 0) {
      this.damageFlashTimer -= dt;
      this.damageFlashAlpha = this.damageFlashTimer / 0.3;
      if (this.damageFlashTimer <= 0) {
        this.damageFlashAlpha = 0;
      }
    }

    if (this.player.comboTimer <= 0 && this.gameState.currentCombo > 0) {
      this.gameState = updateGameState(this.gameState, { currentCombo: 0 });
    }
  }

  spawnEnemy(): void {
    const groundY = this.baseHeight - 80;
    const type = Math.random() < 0.6 ? 'skeleton' : 'bat';
    const x = this.baseWidth - 80;

    let y: number;
    if (type === 'skeleton') {
      y = groundY - 50;
    } else {
      y = 100 + Math.random() * 300;
    }

    this.enemies.push(new Enemy(type, x, y));
    this.enforceEntityLimit();
  }

  createHitParticles(x: number, y: number, attackStage: number = 1): void {
    let color: string;
    switch (attackStage) {
      case 2:
        color = '#FFD700';
        break;
      case 3:
        color = '#8B0000';
        break;
      default:
        color = '#ffffff';
        break;
    }

    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const speed = 3 + Math.random() * 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.3,
        maxLife: 0.3,
        color,
      });
    }
    this.enforceEntityLimit();
  }

  createGroundCrack(x: number, y: number): void {
    const lines: { angle: number; length: number }[] = [];
    const lineCount = 6;
    for (let i = 0; i < lineCount; i++) {
      const angle = -Math.PI + (Math.PI * i) / (lineCount - 1);
      const length = 30 + Math.random() * 20;
      lines.push({ angle, length });
    }

    this.groundCracks.push({
      x,
      y,
      lines,
      life: 0.2,
      maxLife: 0.2,
    });
    this.enforceEntityLimit();
  }

  private updateGroundCracks(dt: number): void {
    for (let i = this.groundCracks.length - 1; i >= 0; i--) {
      this.groundCracks[i].life -= dt;
      if (this.groundCracks[i].life <= 0) {
        this.groundCracks.splice(i, 1);
      }
    }
  }

  createVictoryParticles(): void {
    for (let i = 0; i < 50; i++) {
      this.victoryParticles.push({
        x: this.baseWidth / 2,
        y: this.baseHeight / 2,
        vx: (Math.random() - 0.5) * 10,
        vy: -Math.random() * 10 - 3,
        life: 3,
        maxLife: 3,
        color: '#ffffff',
      });
    }
  }

  private enforceEntityLimit(): void {
    const total = 1 + this.enemies.length + this.particles.length + this.victoryParticles.length + this.groundCracks.length + this.healthPotions.length;
    if (total > MAX_ENTITIES) {
      let excess = total - MAX_ENTITIES;
      const removeFromParticles = Math.min(excess, this.particles.length);
      this.particles.splice(0, removeFromParticles);
      excess -= removeFromParticles;
      if (excess > 0) {
        this.groundCracks.splice(0, Math.min(excess, this.groundCracks.length));
      }
    }
  }

  checkCollisions(): void {
    const attackHitbox = this.player.getAttackHitbox();
    if (attackHitbox) {
      for (const enemy of this.enemies) {
        if (GameEngine.checkAABB(attackHitbox, enemy.getHitbox())) {
          if (!enemy.hitFlash) {
            const damage = this.player.getAttackDamage();
            const knockbackDir = this.player.facingRight ? 1 : -1;
            enemy.takeDamage(damage, knockbackDir);
            this.createHitParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, this.player.attackStage);

            if (this.player.attackStage === 3) {
              const groundY = this.baseHeight - 80;
              this.createGroundCrack(enemy.x + enemy.width / 2, groundY);
            }

            const newCombo = this.gameState.currentCombo + 1;
            this.gameState = updateGameState(this.gameState, {
              currentCombo: newCombo,
              maxCombo: Math.max(this.gameState.maxCombo, newCombo),
            });

            const knockbackDuration = this.player.getKnockbackDuration();
            if (knockbackDuration > 0) {
              enemy.knockbackTimer = knockbackDuration;
              enemy.knockbackX = knockbackDir * 300;
            }
          }
        }
      }
    }

    if (!this.player.invincible) {
      for (const enemy of this.enemies) {
        const enemyAttackHitbox = enemy.getAttackHitbox();
        if (enemyAttackHitbox && GameEngine.checkAABB(this.player.getHitbox(), enemyAttackHitbox)) {
          const damage = enemy.getAttackDamage();
          this.player.takeDamage(damage);
          this.damageFlashTimer = 0.3;
          this.damageFlashAlpha = 1;

          const knockbackDir = enemy.x < this.player.x ? 1 : -1;
          this.player.knockbackX = knockbackDir * 200;
          this.player.knockbackTimer = enemy.getHitKnockback();

          this.gameState = updateGameState(this.gameState, {
            playerHealth: this.player.health,
            currentCombo: 0,
          });
        }
      }
    }

    for (let i = this.healthPotions.length - 1; i >= 0; i--) {
      const potion = this.healthPotions[i];
      const potionHitbox: Hitbox = {
        x: potion.x,
        y: potion.y,
        width: potion.width,
        height: potion.height,
      };
      if (GameEngine.checkAABB(this.player.getHitbox(), potionHitbox)) {
        this.player.heal(20);
        this.gameState = updateGameState(this.gameState, {
          playerHealth: this.player.health,
        });
        this.healthPotions.splice(i, 1);
      }
    }
  }

  private checkVictory(): void {
    if (this.gameState.wave >= 10 && this.enemies.length === 0) {
      this.gameState = updateGameState(this.gameState, { phase: 'victory' });
      this.createVictoryParticles();
    }
  }

  private render(): void {
    const { width, height } = this.canvas;

    this.ctx.clearRect(0, 0, width, height);

    this.ctx.save();
    this.ctx.scale(this.scale, this.scale);

    drawBackground(this.ctx, this.baseWidth, this.baseHeight, this.scale);

    for (const enemy of this.enemies) {
      drawEnemy(this.ctx, enemy, this.scale);
    }

    drawPlayer(this.ctx, this.player, this.scale);

    drawParticles(this.ctx, this.particles);
    drawGroundCracks(this.ctx, this.groundCracks, this.scale);

    this.ctx.fillStyle = '#ef4444';
    for (const potion of this.healthPotions) {
      this.ctx.beginPath();
      this.ctx.arc(potion.x + potion.width / 2, potion.y + potion.height / 2, potion.width / 2, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(potion.x + potion.width / 2 - 2, potion.y + 4, 4, 12);
      this.ctx.fillRect(potion.x + 6, potion.y + potion.height / 2 - 2, 8, 4);
      this.ctx.fillStyle = '#ef4444';
    }

    drawUI(this.ctx, this.gameState, this.scale);
    drawHealthBar(this.ctx, 20, 20, 200, 20, this.gameState.playerHealth, this.gameState.playerMaxHealth);
    drawControlsHint(this.ctx, 20, this.baseHeight - 30);

    if (this.damageFlashAlpha > 0) {
      drawDamageFlash(this.ctx, this.baseWidth, this.baseHeight, this.damageFlashAlpha);
    }

    if (this.gameState.phase === 'victory') {
      drawVictory(this.ctx, this.baseWidth, this.baseHeight, this.victoryParticles, performance.now());
    }

    this.ctx.restore();

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`FPS: ${this.fps}`, 10, height - 10);
  }

  handleKeyDown(e: KeyboardEvent): void {
    this.keys.add(e.key);

    if (['w', 'a', 's', 'd', ' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
    }
  }

  handleKeyUp(e: KeyboardEvent): void {
    this.keys.delete(e.key);
  }

  handleResize(): void {
    const { innerWidth, innerHeight } = window;
    const scaleX = innerWidth / this.baseWidth;
    const scaleY = innerHeight / this.baseHeight;
    this.scale = Math.min(scaleX, scaleY);

    this.canvas.width = innerWidth;
    this.canvas.height = innerHeight;
  }
}
