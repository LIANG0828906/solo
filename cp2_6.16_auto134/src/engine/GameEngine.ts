import { v4 as uuidv4 } from 'uuid';
import {
  Player,
  Enemy,
  Boss,
  Bullet,
  Particle,
  ShipBuild,
} from '../types';
import {
  GAME_CONFIG,
  WEAPON_CONFIG,
  SHIELD_CONFIG,
  ENGINE_CONFIG,
  COLORS,
} from '../utils/constants';
import {
  createExplosionParticles,
  createBossExplosionParticles,
  createEngineParticles,
  updateParticles,
  renderParticles,
  createStars,
  updateStars,
  renderStars,
} from './particleSystem';

interface GameState {
  score: number;
  wave: number;
  lives: number;
  isGameOver: boolean;
  killsThisGame: number;
  bossKilled: boolean;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationId: number | null = null;
  private lastTime: number = 0;
  private isRunning: boolean = false;

  private player!: Player;
  private enemies: Enemy[] = [];
  private boss: Boss | null = null;
  private playerBullets: Bullet[] = [];
  private enemyBullets: Bullet[] = [];
  private particles: Particle[] = [];
  private stars: Array<{x: number; y: number; size: number; speed: number; brightness: number; twinkleSpeed: number}> = [];

  private keys: { [key: string]: boolean } = {};
  private touchInput: { left: boolean; right: boolean; fire: boolean } = { left: false, right: false, fire: false };

  private waveEnemiesSpawned: number = 0;
  private lastSpawnTime: number = 0;
  private waveComplete: boolean = false;
  private bossActive: boolean = false;

  private screenShake: { x: number; y: number; intensity: number; duration: number } = { x: 0, y: 0, intensity: 0, duration: 0 };

  private build: ShipBuild;
  
  public gameState: GameState;

  private onStateChange?: (state: GameState) => void;
  private onGameOver?: (score: number, wave: number, kills: number) => void;

  constructor(canvas: HTMLCanvasElement, build: ShipBuild) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2d context');
    this.ctx = ctx;
    this.build = build;
    this.gameState = {
      score: 0,
      wave: 1,
      lives: GAME_CONFIG.PLAYER_LIVES,
      isGameOver: false,
      killsThisGame: 0,
      bossKilled: false,
    };
    this.init();
  }

  private init() {
    const weaponStats = WEAPON_CONFIG[this.build.weapon.type][this.build.weapon.level];
    const engineStats = ENGINE_CONFIG[this.build.engine.type][this.build.engine.level];

    this.player = {
      x: this.canvas.width / 2 - GAME_CONFIG.PLAYER_WIDTH / 2,
      y: this.canvas.height - 100,
      width: GAME_CONFIG.PLAYER_WIDTH,
      height: GAME_CONFIG.PLAYER_HEIGHT,
      speed: engineStats.speed,
      lives: GAME_CONFIG.PLAYER_LIVES,
      isInvincible: false,
      invincibleTimer: 0,
      fireRate: weaponStats.fireRate,
      lastFireTime: 0,
    };

    this.enemies = [];
    this.boss = null;
    this.playerBullets = [];
    this.enemyBullets = [];
    this.particles = [];
    this.stars = createStars(this.canvas.width, this.canvas.height);

    this.waveEnemiesSpawned = 0;
    this.lastSpawnTime = 0;
    this.waveComplete = false;
    this.bossActive = false;

    this.gameState = {
      score: 0,
      wave: 1,
      lives: GAME_CONFIG.PLAYER_LIVES,
      isGameOver: false,
      killsThisGame: 0,
      bossKilled: false,
    };

    this.setupControls();
  }

  private setupControls() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keys[e.key.toLowerCase()] = true;
    if (['arrowleft', 'arrowright', 'a', 'd', ' '].includes(e.key.toLowerCase())) {
      e.preventDefault();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys[e.key.toLowerCase()] = false;
  };

  public setTouchInput(input: { left: boolean; right: boolean; fire: boolean }) {
    this.touchInput = input;
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  public stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  public destroy() {
    this.stop();
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  public setBuild(build: ShipBuild) {
    this.build = build;
  }

  public restart() {
    this.init();
    this.start();
  }

  private gameLoop = (currentTime: number) => {
    if (!this.isRunning) return;

    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    if (!this.gameState.isGameOver) {
      this.update(deltaTime, currentTime);
    }
    this.render();

    this.animationId = requestAnimationFrame(this.gameLoop);
  };

  private update(deltaTime: number, currentTime: number) {
    this.updatePlayer(deltaTime, currentTime);
    this.updateEnemies(deltaTime, currentTime);
    this.updateBoss(deltaTime, currentTime);
    this.updateBullets(deltaTime);
    this.updateParticles(deltaTime);
    this.updateStars(deltaTime);
    this.updateScreenShake(deltaTime);
    this.checkCollisions();
    this.spawnEnemies(currentTime);
    this.checkWaveComplete();
  }

  private updatePlayer(deltaTime: number, currentTime: number) {
    const engineStats = ENGINE_CONFIG[this.build.engine.type][this.build.engine.level];
    let speed = this.player.speed;

    if (this.keys[' '] || this.touchInput.fire) {
      speed *= engineStats.boostMultiplier;
    }

    if (this.keys['arrowleft'] || this.keys['a'] || this.touchInput.left) {
      this.player.x -= speed * (deltaTime / 16.67);
    }
    if (this.keys['arrowright'] || this.keys['d'] || this.touchInput.right) {
      this.player.x += speed * (deltaTime / 16.67);
    }

    this.player.x = Math.max(0, Math.min(this.canvas.width - this.player.width, this.player.x));

    if (this.player.isInvincible) {
      this.player.invincibleTimer -= deltaTime;
      if (this.player.invincibleTimer <= 0) {
        this.player.isInvincible = false;
      }
    }

    const weaponStats = WEAPON_CONFIG[this.build.weapon.type][this.build.weapon.level];
    if (currentTime - this.player.lastFireTime > weaponStats.fireRate) {
      this.playerFire();
      this.player.lastFireTime = currentTime;
    }

    if (Math.random() < 0.3) {
      this.particles = createEngineParticles(
        this.particles,
        this.player.x + this.player.width / 2,
        this.player.y + this.player.height,
        this.build.engine.level
      );
    }
  }

  private playerFire() {
    const weaponStats = WEAPON_CONFIG[this.build.weapon.type][this.build.weapon.level];
    const centerX = this.player.x + this.player.width / 2;
    const topY = this.player.y;

    for (let i = 0; i < weaponStats.bulletCount; i++) {
      let angle = -Math.PI / 2;
      if (weaponStats.bulletCount > 1) {
        const spread = weaponStats.spread * (Math.PI / 180);
        angle = -Math.PI / 2 - spread / 2 + (spread * i) / (weaponStats.bulletCount - 1);
      }

      const bullet: Bullet = {
        id: uuidv4(),
        x: centerX - weaponStats.bulletWidth / 2,
        y: topY,
        width: weaponStats.bulletWidth,
        height: weaponStats.bulletHeight,
        vx: Math.cos(angle) * GAME_CONFIG.BULLET_SPEED,
        vy: Math.sin(angle) * GAME_CONFIG.BULLET_SPEED,
        damage: weaponStats.damage,
        color: COLORS.playerBullet,
        isPlayerBullet: true,
      };
      this.playerBullets.push(bullet);
    }
  }

  private spawnEnemies(currentTime: number) {
    if (this.bossActive || this.waveComplete) return;

    const isBossWave = this.gameState.wave % GAME_CONFIG.BOSS_WAVE_INTERVAL === 0;
    
    if (isBossWave && this.waveEnemiesSpawned === 0) {
      this.spawnBoss();
      this.bossActive = true;
      return;
    }

    const spawnRate = Math.max(800, GAME_CONFIG.ENEMY_SPAWN_RATE - this.gameState.wave * 100);

    if (
      currentTime - this.lastSpawnTime > spawnRate &&
      this.waveEnemiesSpawned < GAME_CONFIG.ENEMIES_PER_WAVE
    ) {
      this.spawnEnemy();
      this.lastSpawnTime = currentTime;
      this.waveEnemiesSpawned++;
    }
  }

  private spawnEnemy() {
    const types: Array<'normal' | 'fast' | 'tank'> = ['normal', 'fast', 'tank'];
    const typeIndex = Math.floor(Math.random() * types.length);
    const type = types[typeIndex];

    let width = 30;
    let height = 30;
    let speed = 1.5;
    let health = 10;
    let color = COLORS.enemyRed;
    let points = 10;
    let fireRate = 2500;

    switch (type) {
      case 'fast':
        width = 25;
        height = 25;
        speed = 2.5;
        health = 5;
        color = COLORS.enemyOrange;
        points = 15;
        fireRate = 3000;
        break;
      case 'tank':
        width = 40;
        height = 35;
        speed = 1;
        health = 25;
        color = '#CC3333';
        points = 25;
        fireRate = 2000;
        break;
    }

    const enemy: Enemy = {
      id: uuidv4(),
      x: Math.random() * (this.canvas.width - width),
      y: -height,
      width,
      height,
      speed: speed + this.gameState.wave * 0.1,
      health: health + this.gameState.wave * 2,
      maxHealth: health + this.gameState.wave * 2,
      color,
      type,
      zigzagOffset: 0,
      zigzagSpeed: 0.02 + Math.random() * 0.02,
      lastFireTime: 0,
      fireRate,
      points,
    };

    this.enemies.push(enemy);
  }

  private spawnBoss() {
    const bossHealth = 500 + this.gameState.wave * 100;
    this.boss = {
      x: this.canvas.width / 2 - 60,
      y: -120,
      width: 120,
      height: 100,
      health: bossHealth,
      maxHealth: bossHealth,
      speed: 1.5,
      pattern: 'scatter',
      patternTimer: 0,
      patternDuration: 5000,
      lastFireTime: 0,
      fireRate: 200,
      rotation: 0,
      active: false,
      points: 500 + this.gameState.wave * 50,
    };
  }

  private updateEnemies(deltaTime: number, currentTime: number) {
    this.enemies = this.enemies.filter(enemy => {
      enemy.y += enemy.speed * (deltaTime / 16.67);
      enemy.zigzagOffset += enemy.zigzagSpeed * (deltaTime / 16.67);
      enemy.x += Math.sin(enemy.zigzagOffset) * 1.5 * (deltaTime / 16.67);

      enemy.x = Math.max(0, Math.min(this.canvas.width - enemy.width, enemy.x));

      if (currentTime - enemy.lastFireTime > enemy.fireRate && enemy.y > 50) {
        this.enemyFire(enemy);
        enemy.lastFireTime = currentTime;
      }

      return enemy.y < this.canvas.height + 50 && enemy.health > 0;
    });
  }

  private enemyFire(enemy: Enemy) {
    const bullet: Bullet = {
      id: uuidv4(),
      x: enemy.x + enemy.width / 2 - 3,
      y: enemy.y + enemy.height,
      width: 6,
      height: 10,
      vx: 0,
      vy: GAME_CONFIG.ENEMY_BULLET_SPEED,
      damage: 10,
      color: COLORS.enemyBullet,
      isPlayerBullet: false,
    };
    this.enemyBullets.push(bullet);
  }

  private updateBoss(deltaTime: number, currentTime: number) {
    if (!this.boss) return;

    if (!this.boss.active) {
      if (this.boss.y < 80) {
        this.boss.y += this.boss.speed * (deltaTime / 16.67);
      } else {
        this.boss.active = true;
      }
      return;
    }

    this.boss.rotation += 0.01 * (deltaTime / 16.67);

    this.boss.x += Math.sin(currentTime * 0.001) * 2 * (deltaTime / 16.67);
    this.boss.x = Math.max(30, Math.min(this.canvas.width - this.boss.width - 30, this.boss.x));

    this.boss.patternTimer += deltaTime;
    if (this.boss.patternTimer >= this.boss.patternDuration) {
      this.boss.patternTimer = 0;
      const patterns: Array<'scatter' | 'homing' | 'fan'> = ['scatter', 'homing', 'fan'];
      this.boss.pattern = patterns[Math.floor(Math.random() * patterns.length)];
    }

    if (currentTime - this.boss.lastFireTime > this.boss.fireRate) {
      this.bossFire();
      this.boss.lastFireTime = currentTime;
    }
  }

  private bossFire() {
    if (!this.boss) return;

    const centerX = this.boss.x + this.boss.width / 2;
    const centerY = this.boss.y + this.boss.height / 2;

    switch (this.boss.pattern) {
      case 'scatter':
        const bulletCount = 12;
        for (let i = 0; i < bulletCount; i++) {
          const angle = (Math.PI * 2 * i) / bulletCount + this.boss.rotation;
          this.enemyBullets.push({
            id: uuidv4(),
            x: centerX - 4,
            y: centerY,
            width: 8,
            height: 8,
            vx: Math.cos(angle) * 3,
            vy: Math.sin(angle) * 3,
            damage: 15,
            color: COLORS.boss,
            isPlayerBullet: false,
          });
        }
        break;

      case 'homing':
        const dx = this.player.x + this.player.width / 2 - centerX;
        const dy = this.player.y + this.player.height / 2 - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        this.enemyBullets.push({
          id: uuidv4(),
          x: centerX - 6,
          y: centerY,
          width: 12,
          height: 12,
          vx: (dx / dist) * 2,
          vy: (dy / dist) * 2,
          damage: 20,
          color: '#FF00FF',
          isPlayerBullet: false,
          isHoming: true,
          targetX: this.player.x + this.player.width / 2,
          targetY: this.player.y + this.player.height / 2,
        });
        break;

      case 'fan':
        const fanCount = 7;
        const fanSpread = Math.PI / 3;
        const baseAngle = Math.PI / 2 - fanSpread / 2;
        for (let i = 0; i < fanCount; i++) {
          const angle = baseAngle + (fanSpread * i) / (fanCount - 1) + this.boss.rotation * 0.5;
          this.enemyBullets.push({
            id: uuidv4(),
            x: centerX - 5,
            y: centerY,
            width: 10,
            height: 10,
            vx: Math.cos(angle) * 4,
            vy: Math.sin(angle) * 4,
            damage: 12,
            color: '#00FFFF',
            isPlayerBullet: false,
          });
        }
        break;
    }
  }

  private updateBullets(deltaTime: number) {
    this.playerBullets = this.playerBullets.filter(bullet => {
      bullet.x += bullet.vx * (deltaTime / 16.67);
      bullet.y += bullet.vy * (deltaTime / 16.67);
      return bullet.y > -50 && bullet.y < this.canvas.height + 50 &&
             bullet.x > -50 && bullet.x < this.canvas.width + 50;
    });

    this.enemyBullets = this.enemyBullets.filter(bullet => {
      if (bullet.isHoming && bullet.targetX !== undefined && bullet.targetY !== undefined) {
        const dx = this.player.x + this.player.width / 2 - bullet.x;
        const dy = this.player.y + this.player.height / 2 - bullet.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speed = 2.5;
        bullet.vx += (dx / dist) * 0.1;
        bullet.vy += (dy / dist) * 0.1;
        const currentSpeed = Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy);
        if (currentSpeed > speed) {
          bullet.vx = (bullet.vx / currentSpeed) * speed;
          bullet.vy = (bullet.vy / currentSpeed) * speed;
        }
      }

      bullet.x += bullet.vx * (deltaTime / 16.67);
      bullet.y += bullet.vy * (deltaTime / 16.67);
      return bullet.y > -50 && bullet.y < this.canvas.height + 50 &&
             bullet.x > -50 && bullet.x < this.canvas.width + 50;
    });
  }

  private updateParticles(deltaTime: number) {
    this.particles = updateParticles(this.particles, deltaTime);
  }

  private updateStars(deltaTime: number) {
    this.stars = updateStars(this.stars, this.canvas.height, deltaTime);
  }

  private updateScreenShake(deltaTime: number) {
    if (this.screenShake.duration > 0) {
      this.screenShake.duration -= deltaTime;
      this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity;
      this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity;
    } else {
      this.screenShake.x = 0;
      this.screenShake.y = 0;
      this.screenShake.intensity = 0;
    }
  }

  private triggerScreenShake(intensity: number, duration: number) {
    this.screenShake.intensity = intensity;
    this.screenShake.duration = duration;
  }

  private checkCollisions() {
    const shieldStats = SHIELD_CONFIG[this.build.shield.type][this.build.shield.level];
    const engineStats = ENGINE_CONFIG[this.build.engine.type][this.build.engine.level];

    this.playerBullets = this.playerBullets.filter(bullet => {
      let hit = false;

      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const enemy = this.enemies[i];
        if (this.checkAABB(bullet, enemy)) {
          enemy.health -= bullet.damage;
          hit = true;

          if (enemy.health <= 0) {
            this.particles = createExplosionParticles(
              this.particles,
              enemy.x + enemy.width / 2,
              enemy.y + enemy.height / 2,
              15,
              enemy.color
            );
            this.gameState.score += enemy.points;
            this.gameState.killsThisGame++;
            this.triggerScreenShake(3, 100);
            this.enemies.splice(i, 1);
          }
          break;
        }
      }

      if (!hit && this.boss && this.boss.active) {
        if (this.checkAABB(bullet, this.boss)) {
          this.boss.health -= bullet.damage;
          hit = true;

          if (this.boss.health <= 0) {
            this.particles = createBossExplosionParticles(
              this.particles,
              this.boss.x + this.boss.width / 2,
              this.boss.y + this.boss.height / 2,
              this.canvas.width,
              this.canvas.height
            );
            this.gameState.score += this.boss.points;
            this.gameState.bossKilled = true;
            this.bossKilled = true;
            this.triggerScreenShake(15, 500);
            this.boss = null;
            this.bossActive = false;
          }
        }
      }

      return !hit;
    });

    if (!this.player.isInvincible) {
      this.enemyBullets = this.enemyBullets.filter(bullet => {
        if (this.checkAABB(bullet, this.player)) {
          if (Math.random() < engineStats.dodgeChance) {
            return false;
          }

          if (Math.random() < shieldStats.reflectChance) {
            bullet.vy = -bullet.vy;
            bullet.isPlayerBullet = true;
            this.playerBullets.push(bullet);
            return false;
          }

          const actualDamage = bullet.damage * (1 - shieldStats.damageReduction);
          this.playerHit(actualDamage);
          return false;
        }
        return true;
      });

      for (const enemy of this.enemies) {
        if (this.checkAABB(enemy, this.player)) {
          if (Math.random() >= engineStats.dodgeChance) {
            continue;
          }
          this.playerHit(20);
          break;
        }
      }
    }
  }

  private checkAABB(a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }): boolean {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  private playerHit(damage: number) {
    const shieldStats = SHIELD_CONFIG[this.build.shield.type][this.build.shield.level];
    
    this.gameState.lives--;
    this.player.lives--;
    this.player.isInvincible = true;
    this.player.invincibleTimer = GAME_CONFIG.INVINCIBLE_DURATION;
    this.triggerScreenShake(8, 200);

    this.particles = createExplosionParticles(
      this.particles,
      this.player.x + this.player.width / 2,
      this.player.y + this.player.height / 2,
      10,
      '#FFFFFF'
    );

    if (this.gameState.lives <= 0) {
      this.gameState.isGameOver = true;
      if (this.onGameOver) {
        this.onGameOver(this.gameState.score, this.gameState.wave, this.gameState.killsThisGame);
      }
    }

    if (this.onStateChange) {
      this.onStateChange(this.gameState);
    }
  }

  private checkWaveComplete() {
    if (this.waveComplete) return;

    const isBossWave = this.gameState.wave % GAME_CONFIG.BOSS_WAVE_INTERVAL === 0;

    if (isBossWave) {
      if (this.bossActive && !this.boss) {
        this.waveComplete = true;
        this.nextWave();
      }
    } else {
      if (
        this.waveEnemiesSpawned >= GAME_CONFIG.ENEMIES_PER_WAVE &&
        this.enemies.length === 0
      ) {
        this.waveComplete = true;
        this.nextWave();
      }
    }
  }

  private nextWave() {
    this.gameState.wave++;
    this.waveEnemiesSpawned = 0;
    this.waveComplete = false;
    this.bossActive = false;
    this.gameState.bossKilled = false;
    
    if (this.onStateChange) {
      this.onStateChange(this.gameState);
    }
  }

  private render() {
    const ctx = this.ctx;

    ctx.save();
    ctx.translate(this.screenShake.x, this.screenShake.y);

    this.renderBackground();
    renderStars(ctx, this.stars);
    this.renderBullets();
    this.renderEnemies();
    this.renderBoss();
    this.renderPlayer();
    renderParticles(ctx, this.particles);

    this.renderBossHealthBar();

    ctx.restore();
  }

  private renderBackground() {
    const ctx = this.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, COLORS.background.start);
    gradient.addColorStop(1, COLORS.background.end);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private renderPlayer() {
    const ctx = this.ctx;
    const p = this.player;

    if (p.isInvincible && Math.floor(Date.now() / 100) % 2 === 0) {
      return;
    }

    const shieldStats = SHIELD_CONFIG[this.build.shield.type][this.build.shield.level];
    if (this.build.shield.level > 0) {
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = shieldStats.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(
        p.x + p.width / 2,
        p.y + p.height / 2,
        p.width * 0.8 + this.build.shield.level * 3,
        0,
        Math.PI * 2
      );
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.fillStyle = '#4A90D9';
    ctx.beginPath();
    ctx.moveTo(p.x + p.width / 2, p.y);
    ctx.lineTo(p.x + p.width, p.y + p.height * 0.7);
    ctx.lineTo(p.x + p.width * 0.7, p.y + p.height);
    ctx.lineTo(p.x + p.width * 0.3, p.y + p.height);
    ctx.lineTo(p.x, p.y + p.height * 0.7);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#6BB5FF';
    ctx.beginPath();
    ctx.moveTo(p.x + p.width / 2, p.y + 5);
    ctx.lineTo(p.x + p.width * 0.65, p.y + p.height * 0.5);
    ctx.lineTo(p.x + p.width * 0.35, p.y + p.height * 0.5);
    ctx.closePath();
    ctx.fill();

    if (this.build.weapon.level >= 2) {
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(p.x + 2, p.y + p.height * 0.3, 4, p.height * 0.3);
      ctx.fillRect(p.x + p.width - 6, p.y + p.height * 0.3, 4, p.height * 0.3);
    }
    if (this.build.weapon.level >= 3) {
      ctx.fillStyle = '#FF6B6B';
      ctx.fillRect(p.x + p.width / 2 - 2, p.y - 5, 4, 10);
    }

    ctx.restore();
  }

  private renderEnemies() {
    const ctx = this.ctx;
    this.enemies.forEach(enemy => {
      ctx.save();
      ctx.fillStyle = enemy.color;
      ctx.beginPath();
      ctx.moveTo(enemy.x + enemy.width / 2, enemy.y + enemy.height);
      ctx.lineTo(enemy.x, enemy.y);
      ctx.lineTo(enemy.x + enemy.width, enemy.y);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.moveTo(enemy.x + enemy.width / 2, enemy.y + enemy.height * 0.7);
      ctx.lineTo(enemy.x + enemy.width * 0.3, enemy.y + enemy.height * 0.2);
      ctx.lineTo(enemy.x + enemy.width * 0.7, enemy.y + enemy.height * 0.2);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    });
  }

  private renderBoss() {
    if (!this.boss) return;
    const ctx = this.ctx;
    const b = this.boss;

    ctx.save();
    ctx.translate(b.x + b.width / 2, b.y + b.height / 2);
    ctx.rotate(b.rotation);

    const sides = 6;
    const radius = b.width / 2;
    ctx.fillStyle = COLORS.boss;
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#FF8C00';
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
      const x = Math.cos(angle) * radius * 0.6;
      const y = Math.sin(angle) * radius * 0.6;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#FF4500';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderBossHealthBar() {
    if (!this.boss || !this.boss.active) return;
    const ctx = this.ctx;
    const barWidth = this.canvas.width * 0.6;
    const barHeight = 12;
    const barX = (this.canvas.width - barWidth) / 2;
    const barY = 20;

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    const healthPercent = this.boss.health / this.boss.maxHealth;
    const gradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
    gradient.addColorStop(0, '#FF4757');
    gradient.addColorStop(0.5, '#FFD700');
    gradient.addColorStop(1, '#2ED573');
    ctx.fillStyle = gradient;
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
  }

  private renderBullets() {
    const ctx = this.ctx;

    this.playerBullets.forEach(bullet => {
      ctx.save();
      ctx.fillStyle = bullet.color;
      ctx.shadowColor = bullet.color;
      ctx.shadowBlur = 10;
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
      ctx.restore();
    });

    this.enemyBullets.forEach(bullet => {
      ctx.save();
      ctx.fillStyle = bullet.color;
      ctx.shadowColor = bullet.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(
        bullet.x + bullet.width / 2,
        bullet.y + bullet.height / 2,
        bullet.width / 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.restore();
    });
  }

  public setOnStateChange(callback: (state: GameState) => void) {
    this.onStateChange = callback;
  }

  public setOnGameOver(callback: (score: number, wave: number, kills: number) => void) {
    this.onGameOver = callback;
  }

  public resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.stars = createStars(width, height);
    if (this.player) {
      this.player.y = height - 100;
      this.player.x = Math.min(this.player.x, width - this.player.width);
    }
  }
}

export type { GameState };
