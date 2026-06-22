import {
  PlayerData,
  MonsterConfig,
  CombatStats,
  MAP_WIDTH,
  MAP_HEIGHT,
  GRID_SIZE,
  PLAYER_SIZE,
  MONSTER_RADIUS,
  OBSTACLE_SIZE
} from './types';

interface Obstacle {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface PathPoint {
  x: number;
  y: number;
}

interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  isAttacking: boolean;
  attackTimer: number;
  attackCooldown: number;
  hitFlashTimer: number;
  knockbackTimer: number;
  knockbackDir: { x: number; y: number };
  facing: { x: number; y: number };
}

interface Monster {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  state: 'patrol' | 'chase' | 'attack';
  currentPathIndex: number;
  attackCooldown: number;
  backswingTimer: number;
  hitFlashTimer: number;
}

export type CombatStatsCallback = (stats: CombatStats) => void;

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private playerConfig: PlayerData;
  private monsterConfig: MonsterConfig;

  private player: Player;
  private monster: Monster;
  private obstacles: Obstacle[];
  private pathPoints: PathPoint[];

  private keys: Set<string> = new Set();
  private running: boolean = false;
  private rafId: number | null = null;
  private lastTime: number = 0;

  private totalDamageDealt: number = 0;
  private hitCount: number = 0;
  private dodgeCount: number = 0;
  private damageWindowStart: number = 0;
  private damageInWindow: number = 0;

  private dpsSamples: { time: number; dps: number }[] = [];
  private lastSampleTime: number = 0;
  private lastStatsUpdate: number = 0;

  private statsCallback: CombatStatsCallback | null = null;

  private onKeyDownBound: (e: KeyboardEvent) => void;
  private onKeyUpBound: (e: KeyboardEvent) => void;

  constructor(canvas: HTMLCanvasElement, playerConfig: PlayerData, monsterConfig: MonsterConfig) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.playerConfig = { ...playerConfig };
    this.monsterConfig = { ...monsterConfig };

    this.player = this.createPlayer();
    this.monster = this.createMonster();
    this.obstacles = this.createObstacles();
    this.pathPoints = this.createPathPoints();

    this.onKeyDownBound = this.onKeyDown.bind(this);
    this.onKeyUpBound = this.onKeyUp.bind(this);
  }

  private createPlayer(): Player {
    return {
      x: 80,
      y: MAP_HEIGHT / 2,
      vx: 0,
      vy: 0,
      hp: 100,
      maxHp: 100,
      isAttacking: false,
      attackTimer: 0,
      attackCooldown: 0,
      hitFlashTimer: 0,
      knockbackTimer: 0,
      knockbackDir: { x: 0, y: 0 },
      facing: { x: 1, y: 0 }
    };
  }

  private createMonster(): Monster {
    const startPoint = this.pathPoints ? this.pathPoints[0] : { x: MAP_WIDTH / 2, y: 300 };
    return {
      x: startPoint.x,
      y: startPoint.y,
      hp: 100,
      maxHp: 100,
      state: 'patrol',
      currentPathIndex: 0,
      attackCooldown: 0,
      backswingTimer: 0,
      hitFlashTimer: 0
    };
  }

  private createObstacles(): Obstacle[] {
    return [
      { x: 150, y: 200, w: OBSTACLE_SIZE, h: OBSTACLE_SIZE },
      { x: 280, y: 500, w: OBSTACLE_SIZE, h: OBSTACLE_SIZE },
      { x: 100, y: 750, w: OBSTACLE_SIZE, h: OBSTACLE_SIZE },
      { x: 300, y: 950, w: OBSTACLE_SIZE, h: OBSTACLE_SIZE }
    ];
  }

  private createPathPoints(): PathPoint[] {
    return [
      { x: MAP_WIDTH / 2, y: 250 },
      { x: 150, y: 600 },
      { x: MAP_WIDTH / 2, y: 1000 }
    ];
  }

  setPlayerConfig(config: PlayerData): void {
    this.playerConfig = { ...config };
  }

  setMonsterConfig(config: MonsterConfig): void {
    this.monsterConfig = { ...config };
  }

  setStatsCallback(callback: CombatStatsCallback): void {
    this.statsCallback = callback;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.damageWindowStart = this.lastTime;
    this.lastSampleTime = this.lastTime;
    this.lastStatsUpdate = this.lastTime;

    window.addEventListener('keydown', this.onKeyDownBound);
    window.addEventListener('keyup', this.onKeyUpBound);

    this.loop(this.lastTime);
  }

  stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    window.removeEventListener('keydown', this.onKeyDownBound);
    window.removeEventListener('keyup', this.onKeyUpBound);
  }

  reset(): void {
    this.player = this.createPlayer();
    this.monster = this.createMonster();
    this.totalDamageDealt = 0;
    this.hitCount = 0;
    this.dodgeCount = 0;
    this.damageInWindow = 0;
    this.dpsSamples = [];
  }

  private onKeyDown(e: KeyboardEvent): void {
    this.keys.add(e.key.toLowerCase());
    if (e.code === 'Space') {
      e.preventDefault();
      this.tryPlayerAttack();
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    this.keys.delete(e.key.toLowerCase());
  }

  private tryPlayerAttack(): void {
    if (this.player.attackCooldown > 0 || this.player.isAttacking) return;
    this.player.isAttacking = true;
    this.player.attackTimer = 0.2;
    this.player.attackCooldown = this.playerConfig.attackSpeed;

    const dx = this.monster.x - this.player.x;
    const dy = this.monster.y - this.player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= 40 + MONSTER_RADIUS) {
      const damage = this.playerConfig.attackDamage;
      this.monster.hp = Math.max(0, this.monster.hp - damage);
      this.monster.hitFlashTimer = 0.2;
      this.totalDamageDealt += damage;
      this.damageInWindow += damage;
      this.hitCount++;
    }
  }

  private loop(currentTime: number): void {
    if (!this.running) return;

    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.05);
    this.lastTime = currentTime;

    this.update(dt, currentTime);
    this.render();

    if (currentTime - this.lastStatsUpdate >= 33) {
      this.emitStats(currentTime);
      this.lastStatsUpdate = currentTime;
    }

    this.rafId = requestAnimationFrame((t) => this.loop(t));
  }

  private update(dt: number, currentTime: number): void {
    this.updatePlayer(dt);
    this.updateMonster(dt);
    this.handleMonsterAttack(dt);

    if (currentTime - this.lastSampleTime >= 100) {
      const windowSec = (currentTime - this.damageWindowStart) / 1000;
      const dps = windowSec > 0 ? this.damageInWindow / windowSec : 0;
      this.dpsSamples.push({ time: currentTime, dps });
      const cutoff = currentTime - 5000;
      while (this.dpsSamples.length > 0 && this.dpsSamples[0].time < cutoff) {
        this.dpsSamples.shift();
      }
      if (currentTime - this.damageWindowStart >= 1000) {
        this.damageWindowStart = currentTime;
        this.damageInWindow = 0;
      }
      this.lastSampleTime = currentTime;
    }
  }

  private updatePlayer(dt: number): void {
    let dx = 0;
    let dy = 0;
    if (this.keys.has('w') || this.keys.has('arrowup')) dy -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) dy += 1;
    if (this.keys.has('a') || this.keys.has('arrowleft')) dx -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) dx += 1;

    if (dx !== 0 || dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      dx /= len;
      dy /= len;
      this.player.facing = { x: dx, y: dy };
    }

    let moveX = dx * this.playerConfig.moveSpeed * dt;
    let moveY = dy * this.playerConfig.moveSpeed * dt;

    if (this.player.knockbackTimer > 0) {
      moveX += this.player.knockbackDir.x * (15 / 0.3) * dt;
      moveY += this.player.knockbackDir.y * (15 / 0.3) * dt;
      this.player.knockbackTimer -= dt;
    }

    let newX = this.player.x + moveX;
    let newY = this.player.y + moveY;

    newX = Math.max(PLAYER_SIZE / 2, Math.min(MAP_WIDTH - PLAYER_SIZE / 2, newX));
    newY = Math.max(PLAYER_SIZE / 2, Math.min(MAP_HEIGHT - PLAYER_SIZE / 2, newY));

    newX = this.resolveObstacleCollision(this.player.x, this.player.y, newX, newY, PLAYER_SIZE).x;
    newY = this.resolveObstacleCollision(this.player.x, this.player.y, newX, newY, PLAYER_SIZE).y;

    this.player.x = newX;
    this.player.y = newY;

    if (this.player.attackTimer > 0) {
      this.player.attackTimer -= dt;
      if (this.player.attackTimer <= 0) this.player.isAttacking = false;
    }
    if (this.player.attackCooldown > 0) this.player.attackCooldown -= dt;
    if (this.player.hitFlashTimer > 0) this.player.hitFlashTimer -= dt;
  }

  private resolveObstacleCollision(
    oldX: number,
    oldY: number,
    newX: number,
    newY: number,
    size: number
  ): { x: number; y: number } {
    let resultX = newX;
    let resultY = newY;
    const half = size / 2;

    for (const obs of this.obstacles) {
      if (
        resultX + half > obs.x &&
        resultX - half < obs.x + obs.w &&
        resultY + half > obs.y &&
        resultY - half < obs.y + obs.h
      ) {
        if (oldX + half <= obs.x || oldX - half >= obs.x + obs.w) {
          resultX = oldX;
        }
        if (oldY + half <= obs.y || oldY - half >= obs.y + obs.h) {
          resultY = oldY;
        }
      }
    }
    return { x: resultX, y: resultY };
  }

  private updateMonster(dt: number): void {
    if (this.monster.hp <= 0) return;

    const dx = this.player.x - this.monster.x;
    const dy = this.player.y - this.monster.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (this.monster.hitFlashTimer > 0) this.monster.hitFlashTimer -= dt;
    if (this.monster.backswingTimer > 0) {
      this.monster.backswingTimer -= dt;
      if (this.monster.attackCooldown > 0) this.monster.attackCooldown -= dt;
      return;
    }
    if (this.monster.attackCooldown > 0) this.monster.attackCooldown -= dt;

    if (dist <= 30 + MONSTER_RADIUS + PLAYER_SIZE / 2) {
      this.monster.state = 'attack';
    } else if (dist <= this.monsterConfig.visionRadius) {
      this.monster.state = 'chase';
    } else {
      this.monster.state = 'patrol';
    }

    let moveX = 0;
    let moveY = 0;

    if (this.monster.state === 'chase') {
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      moveX = (dx / len) * this.monsterConfig.chaseSpeed * dt;
      moveY = (dy / len) * this.monsterConfig.chaseSpeed * dt;
    } else if (this.monster.state === 'patrol') {
      const target = this.pathPoints[this.monster.currentPathIndex];
      const tdx = target.x - this.monster.x;
      const tdy = target.y - this.monster.y;
      const tdist = Math.sqrt(tdx * tdx + tdy * tdy);
      if (tdist < 5) {
        this.monster.currentPathIndex = (this.monster.currentPathIndex + 1) % this.pathPoints.length;
      } else {
        moveX = (tdx / tdist) * this.monsterConfig.patrolSpeed * dt;
        moveY = (tdy / tdist) * this.monsterConfig.patrolSpeed * dt;
      }
    }

    let newX = this.monster.x + moveX;
    let newY = this.monster.y + moveY;

    newX = Math.max(MONSTER_RADIUS, Math.min(MAP_WIDTH - MONSTER_RADIUS, newX));
    newY = Math.max(MONSTER_RADIUS, Math.min(MAP_HEIGHT - MONSTER_RADIUS, newY));

    this.monster.x = newX;
    this.monster.y = newY;
  }

  private handleMonsterAttack(dt: number): void {
    if (this.monster.hp <= 0) return;
    if (this.monster.state !== 'attack') return;
    if (this.monster.attackCooldown > 0 || this.monster.backswingTimer > 0) return;

    const dx = this.player.x - this.monster.x;
    const dy = this.player.y - this.monster.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= 30 + MONSTER_RADIUS + PLAYER_SIZE / 2) {
      this.player.hp = Math.max(0, this.player.hp - 5);
      this.player.hitFlashTimer = 0.3;
      this.player.knockbackTimer = 0.3;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      this.player.knockbackDir = { x: dx / len, y: dy / len };
      this.monster.attackCooldown = this.monsterConfig.attackInterval;
      this.monster.backswingTimer = this.monsterConfig.attackBackswing;
      this.dodgeCount++;
    }
  }

  private emitStats(currentTime: number): void {
    if (!this.statsCallback) return;
    const windowSec = Math.max((currentTime - this.damageWindowStart) / 1000, 0.1);
    const currentDps = this.damageInWindow / Math.min(windowSec, 1);

    this.statsCallback({
      totalDamage: this.totalDamageDealt,
      dodgeCount: this.dodgeCount,
      hitCount: this.hitCount,
      monsterHpPercent: (this.monster.hp / this.monster.maxHp) * 100,
      currentDps,
      dpsHistory: [...this.dpsSamples]
    });
  }

  private render(): void {
    const ctx = this.ctx;
    const canvas = this.canvas;

    const scaleX = canvas.width / MAP_WIDTH;
    const scaleY = canvas.height / MAP_HEIGHT;

    ctx.fillStyle = '#1A1A2E';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(scaleX, scaleY);

    this.drawGrid();
    this.drawGround();
    this.drawPathPoints();
    this.drawObstacles();
    this.drawMonster();
    this.drawPlayer();
    this.drawAttackRange();

    ctx.restore();
  }

  private drawGrid(): void {
    const ctx = this.ctx;
    ctx.strokeStyle = '#3A3A5C';
    ctx.lineWidth = 1 / (this.canvas.width / MAP_WIDTH);
    ctx.setLineDash([4, 4]);

    for (let x = 0; x <= MAP_WIDTH; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, MAP_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= MAP_HEIGHT; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(MAP_WIDTH, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  private drawGround(): void {
    this.ctx.fillStyle = '#2D2D44';
    this.ctx.fillRect(0, MAP_HEIGHT - 40, MAP_WIDTH, 40);
  }

  private drawPathPoints(): void {
    const ctx = this.ctx;
    ctx.strokeStyle = '#FFFFFF';
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 2 / (this.canvas.width / MAP_WIDTH);
    ctx.beginPath();
    ctx.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
    for (let i = 1; i < this.pathPoints.length; i++) {
      ctx.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    for (const p of this.pathPoints) {
      ctx.fillStyle = '#0F3460';
      ctx.strokeStyle = '#E94560';
      ctx.lineWidth = 2 / (this.canvas.width / MAP_WIDTH);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  private drawObstacles(): void {
    const ctx = this.ctx;
    for (const obs of this.obstacles) {
      ctx.fillStyle = '#E94560';
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
    }
  }

  private drawPlayer(): void {
    const ctx = this.ctx;
    const p = this.player;

    if (p.hitFlashTimer > 0) {
      ctx.fillStyle = '#FF0000';
    } else if (p.isAttacking) {
      ctx.fillStyle = '#FFFFFF';
    } else {
      ctx.fillStyle = '#E94560';
    }

    const half = PLAYER_SIZE / 2;
    ctx.fillRect(p.x - half, p.y - half, PLAYER_SIZE, PLAYER_SIZE);
  }

  private drawMonster(): void {
    const ctx = this.ctx;
    const m = this.monster;

    if (m.hp <= 0) {
      ctx.fillStyle = '#555555';
    } else if (m.hitFlashTimer > 0) {
      ctx.fillStyle = '#FFFFFF';
    } else if (m.state === 'attack') {
      ctx.fillStyle = '#FF4444';
    } else if (m.state === 'chase') {
      ctx.fillStyle = '#FF6666';
    } else {
      ctx.fillStyle = '#4A90D9';
    }

    ctx.beginPath();
    ctx.arc(m.x, m.y, MONSTER_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    if (m.state === 'chase' || m.state === 'attack') {
      ctx.strokeStyle = 'rgba(233, 69, 96, 0.3)';
      ctx.lineWidth = 2 / (this.canvas.width / MAP_WIDTH);
      ctx.beginPath();
      ctx.arc(m.x, m.y, this.monsterConfig.visionRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  private drawAttackRange(): void {
    if (!this.player.isAttacking) return;
    const ctx = this.ctx;
    const p = this.player;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 3 / (this.canvas.width / MAP_WIDTH);
    ctx.beginPath();
    ctx.arc(
      p.x + p.facing.x * 20,
      p.y + p.facing.y * 20,
      20,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  }

  resizeCanvas(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }
}
