export enum ShipType {
  Assault = 'assault',
  Frigate = 'frigate',
  Artillery = 'artillery',
}

export enum Team {
  Player = 'player',
  AI = 'ai',
}

export interface ShipConfig {
  type: ShipType;
  team: Team;
  x: number;
  y: number;
}

const SHIP_STATS: Record<ShipType, { speed: number; hp: number; attack: number; attackRange: number; attackCooldown: number; size: number }> = {
  [ShipType.Assault]: { speed: 180, hp: 80, attack: 8, attackRange: 250, attackCooldown: 0.8, size: 14 },
  [ShipType.Frigate]: { speed: 120, hp: 140, attack: 14, attackRange: 300, attackCooldown: 1.2, size: 16 },
  [ShipType.Artillery]: { speed: 70, hp: 100, attack: 24, attackRange: 400, attackCooldown: 1.8, size: 18 },
};

export const PLAYER_COLORS: Record<ShipType, string> = {
  [ShipType.Assault]: '#4A90D9',
  [ShipType.Frigate]: '#27AE60',
  [ShipType.Artillery]: '#E74C3C',
};

export const AI_COLORS: Record<ShipType, string> = {
  [ShipType.Assault]: '#7F8C8D',
  [ShipType.Frigate]: '#95A5A6',
  [ShipType.Artillery]: '#BDC3C7',
};

export interface Bullet {
  x: number;
  y: number;
  targetShipId: number;
  vx: number;
  vy: number;
  color: string;
  damage: number;
  sourceTeam: Team;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  length: number;
  color: string;
}

export interface Debris {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  alpha: number;
  points: number[][];
  color: string;
  rotation: number;
  rotationSpeed: number;
}

let nextId = 0;

export class Ship {
  id: number;
  type: ShipType;
  team: Team;
  x: number;
  y: number;
  speed: number;
  maxHp: number;
  hp: number;
  attack: number;
  attackRange: number;
  attackCooldown: number;
  cooldownTimer: number = 0;
  size: number;
  color: string;
  selected: boolean = false;
  alive: boolean = true;
  targetX: number | null = null;
  targetY: number | null = null;
  targetShipId: number | null = null;
  displayHp: number;
  aiTargetId: number | null = null;
  aiRetreat: boolean = false;
  aiReactionDelay: number = 0;
  aiReactionTimer: number = 0;
  aiReevaluateTimer: number = 0;

  constructor(config: ShipConfig) {
    this.id = nextId++;
    this.type = config.type;
    this.team = config.team;
    this.x = config.x;
    this.y = config.y;
    const stats = SHIP_STATS[config.type];
    this.speed = stats.speed;
    this.maxHp = stats.hp;
    this.hp = stats.hp;
    this.displayHp = stats.hp;
    this.attack = stats.attack;
    this.attackRange = stats.attackRange;
    this.attackCooldown = stats.attackCooldown;
    this.size = stats.size;
    this.color = config.team === Team.Player ? PLAYER_COLORS[config.type] : AI_COLORS[config.type];
    this.aiReactionDelay = 300 + Math.random() * 500;
    this.aiReevaluateTimer = 0;
  }

  moveTo(x: number, y: number) {
    this.targetX = x;
    this.targetY = y;
    this.targetShipId = null;
  }

  attackTarget(shipId: number) {
    this.targetShipId = shipId;
    this.targetX = null;
    this.targetY = null;
  }

  takeDamage(dmg: number) {
    if (!this.alive) return;
    this.hp -= dmg;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
    }
  }

  update(dt: number, enemies: Ship[], bullets: Bullet[], particles: Particle[], debris: Debris[]) {
    if (!this.alive) return;

    this.displayHp += (this.hp - this.displayHp) * Math.min(1, dt / 0.2);
    if (Math.abs(this.displayHp - this.hp) < 0.5) this.displayHp = this.hp;

    this.cooldownTimer = Math.max(0, this.cooldownTimer - dt);

    if (this.team === Team.AI) {
      this.updateAI(dt, enemies);
    }

    let moveX = 0;
    let moveY = 0;

    if (this.targetShipId !== null) {
      const target = enemies.find(e => e.id === this.targetShipId && e.alive);
      if (target) {
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > this.attackRange * 0.85) {
          moveX = dx / dist;
          moveY = dy / dist;
        }
        if (dist <= this.attackRange && this.cooldownTimer <= 0) {
          this.fire(target, bullets);
          this.cooldownTimer = this.attackCooldown;
        }
      } else {
        this.targetShipId = null;
      }
    } else if (this.targetX !== null && this.targetY !== null) {
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 3) {
        moveX = dx / dist;
        moveY = dy / dist;
      } else {
        this.targetX = null;
        this.targetY = null;
      }
    }

    if (this.aiRetreat) {
      const nearestEnemy = this.findNearestEnemy(enemies);
      if (nearestEnemy) {
        const dx = this.x - nearestEnemy.x;
        const dy = this.y - nearestEnemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
          moveX = dx / dist;
          moveY = dy / dist;
        }
      }
    }

    if (moveX !== 0 || moveY !== 0) {
      const len = Math.sqrt(moveX * moveX + moveY * moveY);
      if (len > 0) {
        moveX /= len;
        moveY /= len;
      }
      this.x += moveX * this.speed * dt;
      this.y += moveY * this.speed * dt;
      this.x = Math.max(this.size, Math.min(1200 - this.size, this.x));
      this.y = Math.max(this.size, Math.min(800 - this.size, this.y));
    }
  }

  private updateAI(dt: number, enemies: Ship[]) {
    this.aiReactionTimer += dt * 1000;
    if (this.aiReactionTimer < this.aiReactionDelay) return;

    this.aiReevaluateTimer += dt;
    if (this.aiReevaluateTimer >= 2) {
      this.aiReevaluateTimer = 0;
      this.aiRetreat = this.hp / this.maxHp < 0.3;

      if (!this.aiRetreat) {
        let bestTarget: Ship | null = null;
        let bestScore = Infinity;
        for (const e of enemies) {
          if (!e.alive) continue;
          const dx = e.x - this.x;
          const dy = e.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const score = dist * 0.5 + (e.hp / e.maxHp) * 200;
          if (score < bestScore) {
            bestScore = score;
            bestTarget = e;
          }
        }
        if (bestTarget) {
          this.targetShipId = bestTarget.id;
          this.targetX = null;
          this.targetY = null;
        }
      } else {
        this.targetShipId = null;
      }

      this.aiReactionDelay = 300 + Math.random() * 500;
      this.aiReactionTimer = 0;
    }
  }

  private findNearestEnemy(enemies: Ship[]): Ship | null {
    let nearest: Ship | null = null;
    let minDist = Infinity;
    for (const e of enemies) {
      if (!e.alive) continue;
      const dx = e.x - this.x;
      const dy = e.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        nearest = e;
      }
    }
    return nearest;
  }

  private fire(target: Ship, bullets: Bullet[]) {
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return;
    const bulletSpeed = 500;
    const vx = (dx / dist) * bulletSpeed;
    const vy = (dy / dist) * bulletSpeed;
    bullets.push({
      x: this.x,
      y: this.y,
      targetShipId: target.id,
      vx,
      vy,
      color: this.color,
      damage: this.attack,
      sourceTeam: this.team,
    });
  }

  getPolygon(): number[][] {
    const s = this.size;
    switch (this.type) {
      case ShipType.Assault: {
        return [
          [0, -s],
          [-s * 0.7, s * 0.6],
          [s * 0.7, s * 0.6],
        ];
      }
      case ShipType.Frigate: {
        return [
          [0, -s],
          [-s * 0.6, 0],
          [0, s],
          [s * 0.6, 0],
        ];
      }
      case ShipType.Artillery: {
        const pts: number[][] = [];
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 2;
          pts.push([Math.cos(angle) * s, Math.sin(angle) * s]);
        }
        return pts;
      }
    }
  }

  static resetIdCounter() {
    nextId = 0;
  }
}
