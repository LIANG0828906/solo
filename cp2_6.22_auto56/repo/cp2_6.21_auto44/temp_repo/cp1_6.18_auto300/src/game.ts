import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  SCROLL_WIDTH,
  SCROLL_SPEED,
  PLAYER_SIZE,
  PLAYER_X,
  PLAYER_MIN_Y,
  PLAYER_MAX_Y,
  PLAYER_SPEED,
  PLAYER_LIVES,
  ENEMY_WIDTH,
  ENEMY_HEIGHT,
  ENEMY_SPEED,
  ENEMY_SPAWN_MIN,
  ENEMY_SPAWN_MAX,
  DART_SIZE,
  DART_SPEED,
  PARTICLE_COUNT,
  PARTICLE_LIFETIME,
  PARTICLE_MIN_SIZE,
  PARTICLE_MAX_SIZE,
  SCORE_PER_KILL,
  RIPPLE_THRESHOLD,
  RIPPLE_DURATION,
  SCROLL_SWITCH_DISTANCE,
  FADE_DURATION,
  FLASH_DURATION,
  FLASH_COUNT,
  AFTERIMAGE_COUNT,
  AFTERIMAGE_ALPHA,
  SCROLL_STYLES,
  type ScrollStyle
} from './config';

export interface Player {
  x: number;
  y: number;
  lives: number;
}

export interface Enemy {
  id: number;
  x: number;
  y: number;
  baseY: number;
  wobbleOffset: number;
  alive: boolean;
}

export interface Dart {
  id: number;
  x: number;
  y: number;
  alive: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  alive: boolean;
}

export interface AfterImage {
  x: number;
  y: number;
  alpha: number;
  frame: number;
}

export interface FlashEffect {
  active: boolean;
  duration: number;
  maxDuration: number;
  flashes: number;
  currentFlash: number;
}

export interface RippleEffect {
  active: boolean;
  duration: number;
  maxDuration: number;
}

export interface FadeEffect {
  active: boolean;
  duration: number;
  maxDuration: number;
  fadingOut: boolean;
  newStyle: ScrollStyle;
}

export interface GameState {
  scrollX: number;
  scrollStyle: ScrollStyle;
  scrollStyleIndex: number;
  totalScrolled: number;
  player: Player;
  enemies: Enemy[];
  darts: Dart[];
  particles: Particle[];
  afterimages: AfterImage[];
  score: number;
  lastRippleScore: number;
  gameOver: boolean;
  enemySpawnTimer: number;
  nextEnemySpawn: number;
  flash: FlashEffect;
  ripple: RippleEffect;
  fade: FadeEffect;
  invincible: boolean;
  invincibleTimer: number;
  idCounter: number;
}

export class Game {
  private state: GameState;
  private keys: Set<string> = new Set();

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): GameState {
    return {
      scrollX: 0,
      scrollStyle: 'default',
      scrollStyleIndex: 0,
      totalScrolled: 0,
      player: {
        x: PLAYER_X,
        y: CANVAS_HEIGHT / 2,
        lives: PLAYER_LIVES
      },
      enemies: [],
      darts: [],
      particles: [],
      afterimages: [],
      score: 0,
      lastRippleScore: 0,
      gameOver: false,
      enemySpawnTimer: 0,
      nextEnemySpawn: ENEMY_SPAWN_MIN + Math.random() * (ENEMY_SPAWN_MAX - ENEMY_SPAWN_MIN),
      flash: {
        active: false,
        duration: 0,
        maxDuration: FLASH_DURATION,
        flashes: FLASH_COUNT,
        currentFlash: 0
      },
      ripple: {
        active: false,
        duration: 0,
        maxDuration: RIPPLE_DURATION
      },
      fade: {
        active: false,
        duration: 0,
        maxDuration: FADE_DURATION,
        fadingOut: true,
        newStyle: 'default'
      },
      invincible: false,
      invincibleTimer: 0,
      idCounter: 0
    };
  }

  public reset(): void {
    this.state = this.createInitialState();
  }

  public getState(): GameState {
    return this.state;
  }

  public handleKeyDown(key: string): void {
    this.keys.add(key);
    if (key === ' ' && !this.state.gameOver) {
      this.fireDart();
    }
    if (key === 'r' || key === 'R') {
      if (this.state.gameOver) {
        this.reset();
      }
    }
  }

  public handleKeyUp(key: string): void {
    this.keys.delete(key);
  }

  private fireDart(): void {
    const player = this.state.player;
    this.state.darts.push({
      id: ++this.state.idCounter,
      x: player.x + PLAYER_SIZE,
      y: player.y + PLAYER_SIZE / 2 - DART_SIZE / 2,
      alive: true
    });
  }

  private spawnEnemy(): void {
    const y = PLAYER_MIN_Y + Math.random() * (PLAYER_MAX_Y - PLAYER_MIN_Y);
    this.state.enemies.push({
      id: ++this.state.idCounter,
      x: CANVAS_WIDTH,
      y: y,
      baseY: y,
      wobbleOffset: 0,
      alive: true
    });
  }

  private createParticles(x: number, y: number): void {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      this.state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: PARTICLE_MIN_SIZE + Math.random() * (PARTICLE_MAX_SIZE - PARTICLE_MIN_SIZE),
        life: PARTICLE_LIFETIME,
        maxLife: PARTICLE_LIFETIME,
        alive: true
      });
    }
  }

  private checkRectOverlap(
    ax: number, ay: number, aw: number, ah: number,
    bx: number, by: number, bw: number, bh: number
  ): boolean {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  private checkCollisions(): void {
    const s = this.state;
    const player = s.player;

    for (const dart of s.darts) {
      if (!dart.alive) continue;
      for (const enemy of s.enemies) {
        if (!enemy.alive) continue;
        if (this.checkRectOverlap(
          dart.x, dart.y, DART_SIZE, DART_SIZE,
          enemy.x, enemy.y, ENEMY_WIDTH, ENEMY_HEIGHT
        )) {
          dart.alive = false;
          enemy.alive = false;
          this.createParticles(
            enemy.x + ENEMY_WIDTH / 2,
            enemy.y + ENEMY_HEIGHT / 2
          );
          s.score += SCORE_PER_KILL;
          if (s.score - s.lastRippleScore >= RIPPLE_THRESHOLD) {
            s.ripple.active = true;
            s.ripple.duration = s.ripple.maxDuration;
            s.lastRippleScore = s.score;
          }
        }
      }
    }

    if (!s.invincible) {
      for (const enemy of s.enemies) {
        if (!enemy.alive) continue;
        if (this.checkRectOverlap(
          player.x, player.y, PLAYER_SIZE, PLAYER_SIZE,
          enemy.x, enemy.y, ENEMY_WIDTH, ENEMY_HEIGHT
        )) {
          enemy.alive = false;
          player.lives--;
          s.flash.active = true;
          s.flash.duration = s.flash.maxDuration;
          s.flash.currentFlash = 0;
          s.invincible = true;
          s.invincibleTimer = 1.0;
          if (player.lives <= 0) {
            s.gameOver = true;
          }
        }
      }
    }
  }

  public update(deltaTime: number): void {
    const s = this.state;
    if (s.gameOver) return;

    const dt = Math.min(deltaTime, 0.05);

    s.scrollX += SCROLL_SPEED;
    s.totalScrolled += SCROLL_SPEED;
    if (s.scrollX >= SCROLL_WIDTH) {
      s.scrollX -= SCROLL_WIDTH;
    }

    const switchDistance = s.totalScrolled;
    const targetIndex = Math.floor(switchDistance / SCROLL_SWITCH_DISTANCE) % SCROLL_STYLES.length;
    if (targetIndex !== s.scrollStyleIndex && !s.fade.active) {
      s.fade.active = true;
      s.fade.duration = s.fade.maxDuration;
      s.fade.fadingOut = true;
      s.fade.newStyle = SCROLL_STYLES[targetIndex];
    }

    if (s.fade.active) {
      s.fade.duration -= dt;
      if (s.fade.duration <= 0) {
        if (s.fade.fadingOut) {
          s.scrollStyleIndex = targetIndex;
          s.scrollStyle = s.fade.newStyle;
          s.fade.fadingOut = false;
          s.fade.duration = s.fade.maxDuration;
        } else {
          s.fade.active = false;
        }
      }
    }

    const player = s.player;
    let moved = false;
    if (this.keys.has('ArrowUp') || this.keys.has('w') || this.keys.has('W')) {
      player.y = Math.max(PLAYER_MIN_Y, player.y - PLAYER_SPEED);
      moved = true;
    }
    if (this.keys.has('ArrowDown') || this.keys.has('s') || this.keys.has('S')) {
      player.y = Math.min(PLAYER_MAX_Y - PLAYER_SIZE, player.y + PLAYER_SPEED);
      moved = true;
    }

    if (moved) {
      s.afterimages.push({
        x: player.x,
        y: player.y,
        alpha: AFTERIMAGE_ALPHA,
        frame: 0
      });
    }
    s.afterimages = s.afterimages.filter(img => {
      img.frame++;
      img.alpha = AFTERIMAGE_ALPHA * (1 - img.frame / AFTERIMAGE_COUNT);
      return img.frame < AFTERIMAGE_COUNT;
    });

    s.enemySpawnTimer += dt;
    if (s.enemySpawnTimer >= s.nextEnemySpawn) {
      this.spawnEnemy();
      s.enemySpawnTimer = 0;
      s.nextEnemySpawn = ENEMY_SPAWN_MIN + Math.random() * (ENEMY_SPAWN_MAX - ENEMY_SPAWN_MIN);
    }

    for (const enemy of s.enemies) {
      enemy.x -= ENEMY_SPEED;
      enemy.wobbleOffset = (Math.random() - 0.5) * 4;
      enemy.y = enemy.baseY + enemy.wobbleOffset;
      if (enemy.x + ENEMY_WIDTH < 0) {
        enemy.alive = false;
      }
    }
    s.enemies = s.enemies.filter(e => e.alive);

    for (const dart of s.darts) {
      dart.x += DART_SPEED;
      if (dart.x > CANVAS_WIDTH) {
        dart.alive = false;
      }
    }
    s.darts = s.darts.filter(d => d.alive);

    for (const p of s.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      if (p.life <= 0) {
        p.alive = false;
      }
    }
    s.particles = s.particles.filter(p => p.alive);

    this.checkCollisions();

    if (s.flash.active) {
      s.flash.duration -= dt;
      if (s.flash.duration <= 0) {
        s.flash.currentFlash++;
        if (s.flash.currentFlash >= s.flash.flashes) {
          s.flash.active = false;
        } else {
          s.flash.duration = s.flash.maxDuration;
        }
      }
    }

    if (s.ripple.active) {
      s.ripple.duration -= dt;
      if (s.ripple.duration <= 0) {
        s.ripple.active = false;
      }
    }

    if (s.invincible) {
      s.invincibleTimer -= dt;
      if (s.invincibleTimer <= 0) {
        s.invincible = false;
      }
    }
  }
}
