export type TowerType = 'arrow' | 'cannon' | 'magic';
export type DamageType = 'physical' | 'explosive' | 'magical';

export interface TowerConfig {
  type: TowerType;
  name: string;
  damage: number;
  range: number;
  color: string;
  glowColor: string;
  damageType: DamageType;
  cost: number;
  fireRate: number;
  projectileSpeed: number;
  projectileColor: string;
}

export const TOWER_CONFIGS: Record<TowerType, TowerConfig> = {
  arrow: {
    type: 'arrow',
    name: '箭塔',
    damage: 15,
    range: 150,
    color: '#4fc3f7',
    glowColor: 'rgba(79, 195, 247, 0.5)',
    damageType: 'physical',
    cost: 50,
    fireRate: 1,
    projectileSpeed: 600,
    projectileColor: '#4fc3f7'
  },
  cannon: {
    type: 'cannon',
    name: '炮塔',
    damage: 45,
    range: 120,
    color: '#ff7043',
    glowColor: 'rgba(255, 112, 67, 0.5)',
    damageType: 'explosive',
    cost: 100,
    fireRate: 0.5,
    projectileSpeed: 400,
    projectileColor: '#ff7043'
  },
  magic: {
    type: 'magic',
    name: '魔法塔',
    damage: 25,
    range: 180,
    color: '#ab47bc',
    glowColor: 'rgba(171, 71, 188, 0.5)',
    damageType: 'magical',
    cost: 75,
    fireRate: 0.8,
    projectileSpeed: 500,
    projectileColor: '#ce93d8'
  }
};

export class Projectile {
  x: number;
  y: number;
  targetId: number;
  damage: number;
  speed: number;
  color: string;
  damageType: DamageType;
  alive: boolean = true;

  constructor(x: number, y: number, targetId: number, damage: number, speed: number, color: string, damageType: DamageType) {
    this.x = x;
    this.y = y;
    this.targetId = targetId;
    this.damage = damage;
    this.speed = speed;
    this.color = color;
    this.damageType = damageType;
  }
}

export class Tower {
  id: number;
  x: number;
  y: number;
  type: TowerType;
  config: TowerConfig;
  lastBeatFire: number = -1;
  pulsePhase: number = 0;
  selected: boolean = false;

  private static nextId: number = 0;

  constructor(x: number, y: number, type: TowerType) {
    this.id = Tower.nextId++;
    this.x = x;
    this.y = y;
    this.type = type;
    this.config = TOWER_CONFIGS[type];
  }

  canFire(currentBeat: number): boolean {
    const beatInterval = Math.ceil(1 / this.config.fireRate);
    return currentBeat - this.lastBeatFire >= beatInterval;
  }

  fire(currentBeat: number, targetId: number): Projectile | null {
    if (!this.canFire(currentBeat)) return null;
    this.lastBeatFire = currentBeat;
    return new Projectile(
      this.x,
      this.y,
      targetId,
      this.config.damage,
      this.config.projectileSpeed,
      this.config.projectileColor,
      this.config.damageType
    );
  }

  draw(ctx: CanvasRenderingContext2D, time: number): void {
    const baseRadius = 24;
    const pulse = this.selected ? 1 + 0.15 * Math.sin(time * 0.0125) : 1;
    const radius = baseRadius * pulse;

    ctx.save();
    ctx.shadowColor = this.config.glowColor;
    ctx.shadowBlur = 15;

    ctx.fillStyle = '#1a1a2e';
    ctx.strokeStyle = this.config.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = this.config.color;

    if (this.type === 'arrow') {
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - 12);
      ctx.lineTo(this.x + 8, this.y + 8);
      ctx.lineTo(this.x - 8, this.y + 8);
      ctx.closePath();
      ctx.fill();
    } else if (this.type === 'cannon') {
      ctx.fillRect(this.x - 12, this.y - 6, 24, 12);
      ctx.beginPath();
      ctx.arc(this.x + 10, this.y, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'magic') {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const px = this.x + 10 * Math.cos(angle);
        const py = this.y + 10 * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  drawRange(ctx: CanvasRenderingContext2D, time: number): void {
    const alpha = 0.2 + 0.1 * Math.sin(time * 0.005);
    ctx.save();
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.config.range, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}
