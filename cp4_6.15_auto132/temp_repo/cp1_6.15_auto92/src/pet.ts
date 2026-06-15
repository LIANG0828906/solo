import { getPetSprite, getHeartSprite, getExclamationSprite, COLORS } from './assets';

type PetAction = 'walk' | 'jump' | 'sit' | 'sleep' | 'happy';

export interface PetStats {
  hunger: number;
  cleanliness: number;
  happiness: number;
}

interface HeartEffect {
  x: number;
  y: number;
  life: number;
  maxLife: number;
}

interface FlyingFood {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  startX: number;
  startY: number;
  progress: number;
  color: string;
  pixels: number[][];
}

interface WaterDrop {
  x: number;
  y: number;
  vy: number;
  life: number;
}

export class Pet {
  x: number;
  y: number;
  baseY: number;
  hunger: number;
  cleanliness: number;
  happiness: number;
  action: PetAction;
  frameIndex: number;
  actionTimer: number;
  frameTimer: number;
  petColor: string;
  facing: number;
  happyAnimationTimer: number;
  happyJumpOffset: number;
  hearts: HeartEffect[];
  flyingFood: FlyingFood | null;
  waterDrops: WaterDrop[];
  waterEffectTimer: number;
  warningBlinkTimer: number;
  warningVisible: boolean;
  private walkTargetX: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.baseY = y;
    this.hunger = 80;
    this.cleanliness = 70;
    this.happiness = 90;
    this.action = 'sit';
    this.frameIndex = 0;
    this.actionTimer = 0;
    this.frameTimer = 0;
    this.petColor = '#ffcc66';
    this.facing = 1;
    this.happyAnimationTimer = 0;
    this.happyJumpOffset = 0;
    this.hearts = [];
    this.flyingFood = null;
    this.waterDrops = [];
    this.waterEffectTimer = 0;
    this.warningBlinkTimer = 0;
    this.warningVisible = true;
    this.walkTargetX = x;
    this.scheduleNextAction();
  }

  private scheduleNextAction(): void {
    const actions: PetAction[] = ['walk', 'jump', 'sit', 'sleep'];
    const weights = [3, 2, 3, 1];
    const total = weights.reduce((a, b) => a + b, 0);
    let rand = Math.random() * total;
    let idx = 0;
    for (let i = 0; i < weights.length; i++) {
      rand -= weights[i];
      if (rand <= 0) {
        idx = i;
        break;
      }
    }
    this.action = actions[idx];
    this.actionTimer = 2000 + Math.random() * 1000;
    this.frameIndex = 0;
    this.frameTimer = 0;
    if (this.action === 'walk') {
      const minX = 60;
      const maxX = 260;
      this.walkTargetX = minX + Math.random() * (maxX - minX);
      this.facing = this.walkTargetX > this.x ? 1 : -1;
    }
  }

  update(deltaTime: number): void {
    this.frameTimer += deltaTime;
    const frameInterval = 1000 / 6;

    if (this.happyAnimationTimer > 0) {
      this.happyAnimationTimer -= deltaTime;
      const t = 1 - this.happyAnimationTimer / 300;
      if (t < 0.25) {
        this.happyJumpOffset = -(t / 0.25) * 8;
      } else if (t < 0.5) {
        this.happyJumpOffset = -8 + ((t - 0.25) / 0.25) * 8;
      } else if (t < 0.75) {
        this.happyJumpOffset = -((t - 0.5) / 0.25) * 8;
      } else {
        this.happyJumpOffset = -8 + ((t - 0.75) / 0.25) * 8;
      }
      if (this.happyAnimationTimer <= 0) {
        this.happyJumpOffset = 0;
        this.action = this.action === 'happy' ? 'sit' : this.action;
      }
    } else {
      this.actionTimer -= deltaTime;
      if (this.actionTimer <= 0) {
        this.scheduleNextAction();
      }

      if (this.frameTimer >= frameInterval) {
        this.frameTimer -= frameInterval;
        this.frameIndex++;
        if (this.action === 'walk' && this.frameIndex >= 2) this.frameIndex = 0;
        if (this.action === 'jump' && this.frameIndex >= 4) this.frameIndex = 0;
        if (this.action === 'sit' && this.frameIndex >= 1) this.frameIndex = 0;
        if (this.action === 'sleep' && this.frameIndex >= 2) this.frameIndex = 0;
      }

      if (this.action === 'walk') {
        const speed = 0.03;
        const dx = this.walkTargetX - this.x;
        if (Math.abs(dx) > 1) {
          this.x += Math.sign(dx) * speed * deltaTime;
          this.facing = Math.sign(dx);
        } else {
          this.scheduleNextAction();
        }
      }
    }

    this.hearts = this.hearts.filter(h => {
      h.life -= deltaTime;
      h.y -= 0.01 * deltaTime;
      return h.life > 0;
    });

    if (this.flyingFood) {
      this.flyingFood.progress += deltaTime / 500;
      const t = Math.min(this.flyingFood.progress, 1);
      this.flyingFood.x = this.flyingFood.startX + (this.flyingFood.targetX - this.flyingFood.startX) * t;
      const arcHeight = 60;
      this.flyingFood.y = this.flyingFood.startY + (this.flyingFood.targetY - this.flyingFood.startY) * t - arcHeight * Math.sin(Math.PI * t);
      if (t >= 1) {
        this.flyingFood = null;
        this.triggerHappy();
        this.hunger = Math.min(100, this.hunger + 15);
      }
    }

    if (this.waterEffectTimer > 0) {
      this.waterEffectTimer -= deltaTime;
      if (Math.random() < 0.3) {
        this.waterDrops.push({
          x: this.x - 15 + Math.random() * 30,
          y: this.y - 50,
          vy: 0.1 + Math.random() * 0.1,
          life: 1500
        });
      }
    }
    this.waterDrops = this.waterDrops.filter(d => {
      d.y += d.vy * deltaTime;
      d.life -= deltaTime;
      return d.life > 0 && d.y < this.y;
    });

    this.warningBlinkTimer += deltaTime;
    if (this.warningBlinkTimer >= 500) {
      this.warningBlinkTimer -= 500;
      this.warningVisible = !this.warningVisible;
    }
  }

  triggerHappy(): void {
    if (this.happyAnimationTimer > 0) return;
    this.happyAnimationTimer = 300;
    this.action = 'happy';
    this.hearts.push({
      x: this.x,
      y: this.y - 40,
      life: 1000,
      maxLife: 1000
    });
  }

  click(): void {
    this.triggerHappy();
  }

  feed(foodColor: string, foodPixels: number[][], startX: number, startY: number): void {
    this.flyingFood = {
      x: startX,
      y: startY,
      startX: startX,
      startY: startY,
      targetX: this.x,
      targetY: this.y - 20,
      progress: 0,
      color: foodColor,
      pixels: foodPixels
    };
  }

  startCleanEffect(): void {
    this.waterEffectTimer = 3000;
    this.cleanliness = Math.min(100, this.cleanliness + 20);
  }

  playSuccess(): void {
    this.happiness = Math.min(100, this.happiness + 10);
    this.triggerHappy();
  }

  sleep(): void {
    this.action = 'sleep';
    this.actionTimer = 5000;
    this.happiness = Math.min(100, this.happiness + 5);
  }

  decrementStats(): void {
    this.hunger = Math.max(0, this.hunger - (2 + Math.floor(Math.random() * 2)));
    this.cleanliness = Math.max(0, this.cleanliness - (2 + Math.floor(Math.random() * 2)));
    this.happiness = Math.max(0, this.happiness - (2 + Math.floor(Math.random() * 2)));
  }

  getStats(): PetStats {
    return {
      hunger: this.hunger,
      cleanliness: this.cleanliness,
      happiness: this.happiness
    };
  }

  setPetColor(color: string): void {
    this.petColor = color;
  }

  containsPoint(px: number, py: number): boolean {
    const dx = px - this.x;
    const dy = py - (this.y + this.happyJumpOffset);
    return Math.abs(dx) < 20 && Math.abs(dy) < 25;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const sprite = getPetSprite(this.action, this.frameIndex, this.petColor);
    ctx.save();
    const drawY = this.y + this.happyJumpOffset;
    if (this.facing < 0) {
      ctx.translate(this.x, drawY);
      ctx.scale(-1, 1);
      ctx.drawImage(sprite, -16, -28);
    } else {
      ctx.drawImage(sprite, this.x - 16, drawY - 28);
    }
    ctx.restore();

    this.hearts.forEach(h => {
      const alpha = h.life / h.maxLife;
      ctx.globalAlpha = alpha;
      ctx.drawImage(getHeartSprite(), h.x - 8, h.y - 8);
      ctx.globalAlpha = 1;
    });

    if (this.flyingFood) {
      const f = this.flyingFood;
      for (let y = 0; y < f.pixels.length; y++) {
        for (let x = 0; x < f.pixels[y].length; x++) {
          if (f.pixels[y][x] === 1) {
            ctx.fillStyle = f.color;
            ctx.fillRect(Math.floor(f.x - 8 + x * 2), Math.floor(f.y - 8 + y * 2), 2, 2);
          }
        }
      }
    }

    this.waterDrops.forEach(d => {
      ctx.fillStyle = '#66aaff';
      ctx.fillRect(Math.floor(d.x), Math.floor(d.y), 2, 4);
    });

    this.renderWarnings(ctx);
  }

  private renderWarnings(ctx: CanvasRenderingContext2D): void {
    if (!this.warningVisible) return;
    const drawY = this.y + this.happyJumpOffset - 40;
    let offset = 0;
    if (this.hunger < 30) {
      ctx.drawImage(getExclamationSprite('#ff8800'), this.x - 16 + offset, drawY);
      offset += 12;
    }
    if (this.cleanliness < 30) {
      ctx.drawImage(getExclamationSprite('#4488ff'), this.x - 16 + offset, drawY);
      offset += 12;
    }
    if (this.happiness < 30) {
      ctx.drawImage(getExclamationSprite('#aa66ff'), this.x - 16 + offset, drawY);
    }
  }
}

export { COLORS };
