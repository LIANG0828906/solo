export enum PowerUpType {
  SpeedBoost = 'speed',
  Shield = 'shield',
  DamageUp = 'damage',
  SkillCard = 'card'
}

export enum SkillType {
  FireBlast = 'fire',
  FrostTrap = 'frost',
  HealWave = 'heal'
}

export interface CardData {
  type: SkillType;
  name: string;
}

export const CARD_POOL: CardData[] = [
  { type: SkillType.FireBlast, name: '火焰冲击' },
  { type: SkillType.FrostTrap, name: '冰霜陷阱' },
  { type: SkillType.HealWave, name: '治疗波' }
];

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Obstacle extends Rect {
  shakeTime: number;
}

export interface PowerUpItem {
  x: number;
  y: number;
  type: PowerUpType;
  collected: boolean;
  bob: number;
}

export interface FrostZone {
  x: number;
  y: number;
  radius: number;
  duration: number;
  ownerId: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface FireEffect {
  x: number;
  y: number;
  angle: number;
  life: number;
  ownerId: number;
}

export interface HealEffect {
  x: number;
  y: number;
  life: number;
}

export interface FlashEffect {
  x: number;
  y: number;
  life: number;
  color: string;
}

export class Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number = 100;
  width: number = 48;
  height: number = 56;
  baseSpeed: number = 3.0;
  speedBoost: number = 0;
  shield: boolean = false;
  damageUp: number = 0;
  isKnockback: boolean = false;
  knockbackTime: number = 0;
  knockbackVx: number = 0;
  knockbackVy: number = 0;
  facing: 1 | -1;
  cards: CardData[] = [];
  maxCards: number = 2;
  lastAttack: number = 0;
  attackCooldown: number = 350;
  id: number;
  tint: string;
  frostSlow: number = 0;
  pickupFlash: FlashEffect | null = null;
  attackAnim: number = 0;

  constructor(id: number, x: number, y: number, facing: 1 | -1, tint: string) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.hp = 100;
    this.facing = facing;
    this.tint = tint;
  }

  get rect(): Rect {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      w: this.width,
      h: this.height
    };
  }

  get currentSpeed(): number {
    let s = this.baseSpeed;
    if (this.speedBoost > 0) s *= 2;
    if (this.frostSlow > 0) s *= 0.5;
    if (this.isKnockback) s = 0;
    return s;
  }

  get attackDamage(): number {
    return this.damageUp > 0 ? 7.5 : 5;
  }

  addCard(card: CardData): boolean {
    if (this.cards.length >= this.maxCards) return false;
    this.cards.push(card);
    return true;
  }

  useCard(): CardData | null {
    if (this.cards.length === 0) return null;
    return this.cards.shift()!;
  }

  update(dt: number) {
    if (this.speedBoost > 0) this.speedBoost -= dt;
    if (this.damageUp > 0) this.damageUp -= dt;
    if (this.frostSlow > 0) this.frostSlow -= dt;
    if (this.knockbackTime > 0) {
      this.knockbackTime -= dt;
      if (this.knockbackTime <= 0) {
        this.isKnockback = false;
        this.knockbackVx = 0;
        this.knockbackVy = 0;
      }
    }
    if (this.attackAnim > 0) this.attackAnim -= dt;
    if (this.pickupFlash) {
      this.pickupFlash.life -= dt;
      if (this.pickupFlash.life <= 0) this.pickupFlash = null;
    }
  }

  applyKnockback(dx: number, dy: number, force: number, duration: number) {
    const len = Math.hypot(dx, dy) || 1;
    this.isKnockback = true;
    this.knockbackTime = duration;
    this.knockbackVx = (dx / len) * force;
    this.knockbackVy = (dy / len) * force;
  }

  takeDamage(amount: number): boolean {
    if (this.shield) {
      this.shield = false;
      return false;
    }
    this.hp = Math.max(0, this.hp - amount);
    return true;
  }

  heal(amount: number) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
    this.frostSlow = 0;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.pickupFlash) {
      const a = this.pickupFlash.life / 300;
      ctx.globalAlpha = a;
      ctx.fillStyle = this.pickupFlash.color;
      ctx.beginPath();
      ctx.arc(0, -this.height / 2 - 10, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    if (this.speedBoost > 0) {
      ctx.strokeStyle = '#4FC3F7';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -this.height / 2 - 6, 14, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (this.shield) {
      ctx.strokeStyle = 'rgba(255, 235, 59, 0.85)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 38, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.save();
    ctx.scale(this.facing, 1);
    this.drawBeast(ctx);
    ctx.restore();

    if (this.attackAnim > 0) {
      const t = this.attackAnim / 200;
      const color = this.damageUp > 0 ? '#FF3030' : '#FFFFFF';
      ctx.globalAlpha = t;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(this.facing * 34, -4, 14 * t + 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.restore();
    this.drawHpBar(ctx);
  }

  private drawBeast(ctx: CanvasRenderingContext2D) {
    const px = 4;
    ctx.fillStyle = this.tint;

    ctx.fillRect(-3 * px, -5 * px, 6 * px, 5 * px);
    ctx.fillRect(-4 * px, -7 * px, 4 * px, 3 * px);
    ctx.fillRect(-2 * px, -8 * px, 2 * px, px);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-3 * px, -6 * px, px, px);
    ctx.fillStyle = '#000000';
    ctx.fillRect(-3 * px, -6 * px, px / 2, px / 2);

    ctx.fillStyle = this.tint;
    ctx.fillRect(2 * px, -6 * px, 3 * px, 3 * px);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(3 * px, -5 * px, px, px);
    ctx.fillStyle = '#000000';
    ctx.fillRect(3.5 * px, -5 * px, px / 2, px / 2);

    ctx.fillStyle = this.tint;
    ctx.fillRect(-3 * px, 0, 6 * px, 4 * px);
    ctx.fillRect(-5 * px, -2 * px, 2 * px, 3 * px);
    ctx.fillRect(3 * px, -2 * px, 2 * px, 3 * px);

    ctx.fillRect(-3 * px, 4 * px, 2 * px, 3 * px);
    ctx.fillRect(px, 4 * px, 2 * px, 3 * px);

    ctx.fillStyle = '#222';
    ctx.fillRect(-3 * px, 7 * px, 2 * px, px);
    ctx.fillRect(px, 7 * px, 2 * px, px);
  }

  private drawHpBar(ctx: CanvasRenderingContext2D) {
    const barW = 60;
    const barH = 6;
    const x = this.x - barW / 2;
    const y = this.y - this.height / 2 - 16;
    const pct = this.hp / this.maxHp;
    let color = '#00C853';
    if (pct < 0.3) color = '#FF1744';
    else if (pct < 0.6) color = '#FFD600';

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x - 1, y - 1, barW + 2, barH + 2);
    ctx.fillStyle = '#222';
    ctx.fillRect(x, y, barW, barH);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, barW * pct, barH);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, barW - 1, barH - 1);
  }
}
