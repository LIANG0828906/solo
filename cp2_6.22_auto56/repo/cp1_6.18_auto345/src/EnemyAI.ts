import type { MazeData, EnemySpawn } from './MazeGenerator.js';

export interface Enemy {
  id: number;
  x: number;
  y: number;
  size: number;
  patrolPoints: { x: number; y: number }[];
  currentPatrolIndex: number;
  state: 'patrol' | 'chase' | 'attack';
  visionRadius: number;
  patrolSpeed: number;
  chaseSpeed: number;
  damageCooldown: number;
  alive: boolean;
  slowFactor: number;
  slowTimer: number;
  lastDecision: number;
}

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  distanceTraveled: number;
  maxDistance: number;
  alive: boolean;
  fromPlayer: boolean;
}

export interface SlowAura {
  x: number;
  y: number;
  radius: number;
  duration: number;
  slowAmount: number;
}

export interface PlayerState {
  x: number;
  y: number;
  invincible: boolean;
}

export class EnemyAI {
  enemies: Enemy[] = [];
  projectiles: Projectile[] = [];
  slowAuras: SlowAura[] = [];
  private maze: MazeData;
  private enemyIdCounter: number = 0;

  constructor(maze: MazeData) {
    this.maze = maze;
    this.initEnemies(maze.enemySpawns);
  }

  private initEnemies(spawns: EnemySpawn[]): void {
    for (const spawn of spawns) {
      this.enemies.push({
        id: this.enemyIdCounter++,
        x: spawn.x,
        y: spawn.y,
        size: 20,
        patrolPoints: spawn.patrolPoints,
        currentPatrolIndex: 0,
        state: 'patrol',
        visionRadius: 80,
        patrolSpeed: 1.5,
        chaseSpeed: 2.5,
        damageCooldown: 0,
        alive: true,
        slowFactor: 1,
        slowTimer: 0,
        lastDecision: 0
      });
    }
  }

  update(deltaTime: number, player: PlayerState): { damageToPlayer: boolean; enemyPositions: { x: number; y: number; id: number; alive: boolean }[] } {
    let damageToPlayer = false;

    for (let i = this.slowAuras.length - 1; i >= 0; i--) {
      this.slowAuras[i].duration -= deltaTime;
      if (this.slowAuras[i].duration <= 0) {
        this.slowAuras.splice(i, 1);
      }
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.distanceTraveled += Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (p.distanceTraveled >= p.maxDistance || this.isWall(p.x, p.y)) {
        p.alive = false;
      }

      if (p.fromPlayer && p.alive) {
        for (const enemy of this.enemies) {
          if (enemy.alive) {
            const dx = p.x - (enemy.x + enemy.size / 2);
            const dy = p.y - (enemy.y + enemy.size / 2);
            if (Math.sqrt(dx * dx + dy * dy) < enemy.size / 2 + 4) {
              enemy.alive = false;
              p.alive = false;
              break;
            }
          }
        }
      }

      if (!p.alive) {
        this.projectiles.splice(i, 1);
      }
    }

    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;

      if (enemy.slowTimer > 0) {
        enemy.slowTimer -= deltaTime;
        if (enemy.slowTimer <= 0) {
          enemy.slowFactor = 1;
        }
      }

      for (const aura of this.slowAuras) {
        const dx = (enemy.x + enemy.size / 2) - aura.x;
        const dy = (enemy.y + enemy.size / 2) - aura.y;
        if (Math.sqrt(dx * dx + dy * dy) < aura.radius) {
          enemy.slowFactor = 1 - aura.slowAmount;
          enemy.slowTimer = 0.5;
          break;
        }
      }

      const px = player.x;
      const py = player.y;
      const ecx = enemy.x + enemy.size / 2;
      const ecy = enemy.y + enemy.size / 2;
      const distToPlayer = Math.sqrt((ecx - px) ** 2 + (ecy - py) ** 2);

      if (distToPlayer < enemy.visionRadius && this.hasLineOfSight(ecx, ecy, px, py)) {
        enemy.state = 'chase';
      } else if (enemy.state === 'chase' && distToPlayer > enemy.visionRadius * 1.5) {
        enemy.state = 'patrol';
      }

      let speed = enemy.patrolSpeed * enemy.slowFactor;
      let targetX: number, targetY: number;

      if (enemy.state === 'chase') {
        speed = enemy.chaseSpeed * enemy.slowFactor;
        targetX = px;
        targetY = py;
      } else {
        const pt = enemy.patrolPoints[enemy.currentPatrolIndex];
        targetX = pt.x + 10;
        targetY = pt.y + 10;
        const d = Math.sqrt((ecx - targetX) ** 2 + (ecy - targetY) ** 2);
        if (d < 5) {
          enemy.currentPatrolIndex = (enemy.currentPatrolIndex + 1) % enemy.patrolPoints.length;
        }
      }

      const ang = Math.atan2(targetY - ecy, targetX - ecx);
      const moveX = Math.cos(ang) * speed;
      const moveY = Math.sin(ang) * speed;

      const newX = enemy.x + moveX;
      const newY = enemy.y + moveY;

      if (!this.checkEnemyCollision(newX, enemy.y, enemy)) {
        enemy.x = newX;
      }
      if (!this.checkEnemyCollision(enemy.x, newY, enemy)) {
        enemy.y = newY;
      }

      if (distToPlayer < enemy.size / 2 + 12) {
        if (enemy.damageCooldown <= 0 && !player.invincible) {
          damageToPlayer = true;
          enemy.damageCooldown = 1000;
        }
      }

      if (enemy.damageCooldown > 0) {
        enemy.damageCooldown -= deltaTime;
      }
    }

    const enemyPositions = this.enemies.map(e => ({
      x: e.x, y: e.y, id: e.id, alive: e.alive
    }));

    return { damageToPlayer, enemyPositions };
  }

  private hasLineOfSight(x1: number, y1: number, x2: number, y2: number): boolean {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.ceil(dist / 5);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const x = x1 + dx * t;
      const y = y1 + dy * t;
      if (this.isWall(x, y)) return false;
    }
    return true;
  }

  private isWall(x: number, y: number): boolean {
    for (const w of this.maze.walls) {
      if (x >= w.x && x < w.x + w.w && y >= w.y && y < w.y + w.h) {
        return true;
      }
    }
    return false;
  }

  private checkEnemyCollision(nx: number, ny: number, self: Enemy): boolean {
    const pad = 2;
    for (const w of this.maze.walls) {
      if (nx + pad < w.x + w.w && nx + self.size - pad > w.x &&
          ny + pad < w.y + w.h && ny + self.size - pad > w.y) {
        return true;
      }
    }
    return false;
  }

  fireProjectile(fromX: number, fromY: number, dirX: number, dirY: number): void {
    const len = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
    this.projectiles.push({
      x: fromX,
      y: fromY,
      vx: (dirX / len) * 8,
      vy: (dirY / len) * 8,
      speed: 8,
      distanceTraveled: 0,
      maxDistance: 200,
      alive: true,
      fromPlayer: true
    });
  }

  createSlowAura(x: number, y: number): void {
    this.slowAuras.push({
      x, y,
      radius: 60,
      duration: 5000,
      slowAmount: 0.5
    });
  }

  getSlowAuras(): SlowAura[] {
    return this.slowAuras;
  }
}
