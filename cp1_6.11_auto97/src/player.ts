import { GameMap, CELL_PX, CANVAS_PX } from './map';

export type SkillType = 'attack_up' | 'defense_up' | 'speed_up' | 'fire_rate_up';

export interface Bullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  alive: boolean;
  radius: number;
}

export interface SlowField {
  x: number;
  y: number;
  radius: number;
  duration: number;
}

interface Position {
  x: number;
  y: number;
}

export class Player {
  map: GameMap;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  shield: number;
  dead: boolean;
  coins: number;
  killCount: number;
  baseDamage: number;
  damage: number;
  baseFireInterval: number;
  fireInterval: number;
  moveSpeed: number;
  skills: (SkillType | null)[];
  targetX: number;
  targetY: number;
  shootTimer: number;
  slowCd: number;
  bulletIdCounter: number;
  slowFieldRadius: number;
  slowFieldDuration: number;
  slowFieldCooldown: number;
  slowFactor: number;

  constructor(map: GameMap) {
    this.map = map;
    this.x = CELL_PX * 15 + CELL_PX / 2;
    this.y = CELL_PX * 15 + CELL_PX / 2;
    this.hp = 100;
    this.maxHp = 100;
    this.shield = 20;
    this.dead = false;
    this.coins = 0;
    this.killCount = 0;
    this.baseDamage = 8;
    this.damage = 8;
    this.baseFireInterval = 0.8;
    this.fireInterval = 0.8;
    this.moveSpeed = 2.5;
    this.skills = [null, null, null, null];
    this.targetX = this.x;
    this.targetY = this.y;
    this.shootTimer = 0;
    this.slowCd = 0;
    this.bulletIdCounter = 0;
    this.slowFieldRadius = 40;
    this.slowFieldDuration = 3;
    this.slowFieldCooldown = 8;
    this.slowFactor = 0.5;
  }

  setMoveTarget(wx: number, wy: number): void {
    this.targetX = Math.max(0, Math.min(CANVAS_PX, wx));
    this.targetY = Math.max(0, Math.min(CANVAS_PX, wy));
  }

  castSlowField(wx: number, wy: number): SlowField | null {
    if (this.slowCd > 0) return null;
    this.slowCd = this.slowFieldCooldown;
    return {
      x: wx,
      y: wy,
      radius: this.slowFieldRadius,
      duration: this.slowFieldDuration,
    };
  }

  takeDamage(rawAmount: number): void {
    if (this.dead) return;
    let remaining = rawAmount;
    if (this.shield > 0) {
      const absorbed = Math.min(this.shield, remaining);
      this.shield -= absorbed;
      remaining -= absorbed;
    }
    if (remaining > 0) {
      this.hp -= remaining;
      if (this.hp <= 0) {
        this.hp = 0;
        this.dead = true;
      }
    }
  }

  addCoins(n: number): void {
    this.coins += n;
  }

  addKill(): void {
    this.killCount += 1;
    if (this.killCount % 5 === 0) {
      this.grantRandomSkill();
    }
  }

  grantRandomSkill(): { slot: number; skill: SkillType } | null {
    let slot = -1;
    for (let i = 0; i < this.skills.length; i++) {
      if (this.skills[i] === null) {
        slot = i;
        break;
      }
    }
    if (slot === -1) return null;
    const all: SkillType[] = ['attack_up', 'defense_up', 'speed_up', 'fire_rate_up'];
    const skill = all[Math.floor(Math.random() * all.length)];
    this.skills[slot] = skill;
    switch (skill) {
      case 'attack_up':
        this.damage += 3;
        break;
      case 'defense_up':
        this.maxHp += 25;
        this.hp += 25;
        this.shield += 10;
        break;
      case 'speed_up':
        this.moveSpeed += 0.6;
        break;
      case 'fire_rate_up':
        this.fireInterval *= 0.75;
        break;
    }
    return { slot, skill };
  }

  update(dt: number, enemies: Position[], outBullets: Bullet[]): SlowField[] {
    if (!this.dead) {
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      if (dx !== 0) {
        const stepX = Math.sign(dx) * Math.min(Math.abs(dx), this.moveSpeed);
        const nextX = this.x + stepX;
        if (this.map.isWalkableWorld(nextX, this.y)) {
          this.x = nextX;
        }
      }
      if (dy !== 0) {
        const stepY = Math.sign(dy) * Math.min(Math.abs(dy), this.moveSpeed);
        const nextY = this.y + stepY;
        if (this.map.isWalkableWorld(this.x, nextY)) {
          this.y = nextY;
        }
      }
    }

    this.shootTimer -= dt;
    if (this.shootTimer <= 0 && !this.dead) {
      let nearest: Position | null = null;
      let nearestDist = Infinity;
      for (const e of enemies) {
        const ddx = e.x - this.x;
        const ddy = e.y - this.y;
        const dist = Math.sqrt(ddx * ddx + ddy * ddy);
        if (dist < 500 && dist < nearestDist) {
          nearestDist = dist;
          nearest = e;
        }
      }
      if (nearest) {
        const vdx = nearest.x - this.x;
        const vdy = nearest.y - this.y;
        const len = Math.sqrt(vdx * vdx + vdy * vdy) || 1;
        const speed = 6;
        const bullet: Bullet = {
          id: this.bulletIdCounter++,
          x: this.x,
          y: this.y,
          vx: (vdx / len) * speed,
          vy: (vdy / len) * speed,
          damage: this.damage,
          alive: true,
          radius: 3,
        };
        outBullets.push(bullet);
        this.shootTimer = this.fireInterval;
      }
    }

    this.slowCd = Math.max(0, this.slowCd - dt);

    if (!this.dead) {
      const currentCell = this.map.cellAtWorld(this.x, this.y);
      if (currentCell && currentCell.type === 'chest' && !currentCell.opened) {
        const coinGain = this.map.openChest(currentCell.x, currentCell.y);
        if (coinGain > 0) {
          this.addCoins(coinGain);
        }
      }
    }

    return [];
  }

  get getSlowCooldownRatio(): number {
    return this.slowCd / this.slowFieldCooldown;
  }

  get getHpRatio(): number {
    return this.hp / this.maxHp;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const shieldAlpha = 0.35 * Math.min(1, this.shield / 20);
    ctx.beginPath();
    ctx.arc(this.x, this.y, 14, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,255,255,${shieldAlpha})`;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#3D7BF4';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(this.x - 1.5, this.y - 1.5, 3, -Math.PI, -Math.PI / 2);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fill();
  }
}
