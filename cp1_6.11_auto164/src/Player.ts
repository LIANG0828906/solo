import {
  ResourceType,
  INVENTORY_MAX_SLOTS,
  MOVE_DURATION,
  COLLECT_DURATION,
  USE_DURATION,
  PLAYER_COLOR,
  PLAYER_GLOW_COLOR,
  PLAYER_GLOW_ALPHA,
  PLAYER_RADIUS,
  HUNGER_DECAY_PER_SEC,
  THIRST_DECAY_PER_SEC,
  HP_DECAY_PER_SEC,
  LOW_STAT_THRESHOLD,
  MOVE_HUNGER_COST,
  MOVE_THIRST_COST,
  RESOURCE_INFO
} from './data';
import { Island } from './Island';

export interface InventorySlot {
  type: ResourceType;
  count: number;
}

export interface CollectAnimation {
  resource: ResourceType;
  startX: number;
  startY: number;
  time: number;
  duration: number;
}

export interface UseAnimation {
  resource: ResourceType;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  time: number;
  duration: number;
}

export class Player {
  private hp: number = 100;
  private hunger: number = 100;
  private thirst: number = 100;
  private q: number;
  private r: number;
  private targetQ: number;
  private targetR: number;
  private moveTime: number = 0;
  private isMoving: boolean = false;
  private inventory: InventorySlot[] = [];
  private collectAnimations: CollectAnimation[] = [];
  private useAnimations: UseAnimation[] = [];
  private inventoryFullWarningTimer: number = 0;
  private dead: boolean = false;

  constructor(startQ: number, startR: number) {
    this.q = startQ;
    this.r = startR;
    this.targetQ = startQ;
    this.targetR = startR;
  }

  updatePosition(_island: Island, _offsetX: number, _offsetY: number): void {
  }

  update(dt: number, island: Island): void {
    if (this.dead) return;

    const multipliers = island.getWeatherMultipliers();

    this.hunger -= HUNGER_DECAY_PER_SEC * multipliers.hunger * dt * 100 / 100;
    this.thirst -= THIRST_DECAY_PER_SEC * multipliers.thirst * dt * 100 / 100;

    this.hunger = Math.max(0, this.hunger);
    this.thirst = Math.max(0, this.thirst);

    if (this.hunger < LOW_STAT_THRESHOLD || this.thirst < LOW_STAT_THRESHOLD) {
      this.hp -= HP_DECAY_PER_SEC * dt * 100 / 100;
    }

    this.hp = Math.max(0, this.hp);

    if (this.hp <= 0) {
      this.dead = true;
    }

    if (this.isMoving) {
      this.moveTime += dt;
      const duration = MOVE_DURATION / island.getWeatherMultipliers().moveSpeed;
      if (this.moveTime >= duration) {
        this.q = this.targetQ;
        this.r = this.targetR;
        this.isMoving = false;
        this.moveTime = 0;
      }
    }

    this.collectAnimations = this.collectAnimations.filter(anim => {
      anim.time += dt;
      return anim.time < anim.duration;
    });

    this.useAnimations = this.useAnimations.filter(anim => {
      anim.time += dt;
      return anim.time < anim.duration;
    });

    if (this.inventoryFullWarningTimer > 0) {
      this.inventoryFullWarningTimer -= dt;
    }
  }

  tryMove(island: Island, targetQ: number, targetR: number): boolean {
    if (this.isMoving || this.dead) return false;
    if (!island.isAdjacent(this.q, this.r, targetQ, targetR)) return false;
    if (!island.isWalkable(targetQ, targetR)) return false;

    this.targetQ = targetQ;
    this.targetR = targetR;
    this.isMoving = true;
    this.moveTime = 0;

    this.hunger = Math.max(0, this.hunger - MOVE_HUNGER_COST);
    this.thirst = Math.max(0, this.thirst - MOVE_THIRST_COST);

    return true;
  }

  getRenderPosition(island: Island, offsetX: number, offsetY: number): { x: number; y: number } {
    if (!this.isMoving) {
      const pos = island.hexToPixel(this.q, this.r);
      return { x: pos.x + offsetX, y: pos.y + offsetY };
    }

    const multipliers = island.getWeatherMultipliers();
    const duration = MOVE_DURATION / multipliers.moveSpeed;
    const t = Math.min(1, this.moveTime / duration);
    const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    const startPos = island.hexToPixel(this.q, this.r);
    const endPos = island.hexToPixel(this.targetQ, this.targetR);

    return {
      x: (startPos.x + (endPos.x - startPos.x) * ease) + offsetX,
      y: (startPos.y + (endPos.y - startPos.y) * ease) + offsetY
    };
  }

  draw(ctx: CanvasRenderingContext2D, island: Island, offsetX: number, offsetY: number): void {
    const pos = this.getRenderPosition(island, offsetX, offsetY);

    ctx.save();
    ctx.shadowColor = PLAYER_GLOW_COLOR;
    ctx.shadowBlur = 10;
    ctx.globalAlpha = PLAYER_GLOW_ALPHA;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, PLAYER_RADIUS + 3, 0, Math.PI * 2);
    ctx.fillStyle = PLAYER_GLOW_COLOR;
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = PLAYER_COLOR;
    ctx.fill();
    ctx.restore();

    this.drawCollectAnimations(ctx);
    this.drawUseAnimations(ctx);
  }

  private drawCollectAnimations(ctx: CanvasRenderingContext2D): void {
    for (const anim of this.collectAnimations) {
      const t = anim.time / anim.duration;
      const bounceT = t < 0.5 ? t * 2 : 2 - t * 2;
      const scale = 1 + bounceT * 0.5;
      const alpha = 1 - t;
      const offsetY = -bounceT * 30;

      ctx.save();
      ctx.globalAlpha = alpha;
      const cx = anim.startX;
      const cy = anim.startY + offsetY;

      const info = RESOURCE_INFO[anim.resource];
      ctx.fillStyle = info.color;

      switch (info.shape) {
        case 'ellipse':
          ctx.beginPath();
          ctx.ellipse(cx, cy, 10 * scale, 12 * scale, 0, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'rect':
          ctx.fillRect(cx - 10 * scale, cy - 8 * scale, 20 * scale, 16 * scale);
          break;
        case 'circle':
          ctx.beginPath();
          ctx.arc(cx, cy, 8 * scale, 0, Math.PI * 2);
          ctx.fill();
          break;
      }
      ctx.restore();
    }
  }

  private drawUseAnimations(ctx: CanvasRenderingContext2D): void {
    for (const anim of this.useAnimations) {
      const t = anim.time / anim.duration;
      const alpha = 1 - t;
      const x = anim.startX + (anim.endX - anim.startX) * t;
      const y = anim.startY + (anim.endY - anim.startY) * t;
      const scale = 1 - t * 0.5;

      ctx.save();
      ctx.globalAlpha = alpha;
      const info = RESOURCE_INFO[anim.resource];
      ctx.fillStyle = info.color;

      switch (info.shape) {
        case 'ellipse':
          ctx.beginPath();
          ctx.ellipse(x, y, 10 * scale, 12 * scale, 0, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'rect':
          ctx.fillRect(x - 10 * scale, y - 8 * scale, 20 * scale, 16 * scale);
          break;
        case 'circle':
          ctx.beginPath();
          ctx.arc(x, y, 8 * scale, 0, Math.PI * 2);
          ctx.fill();
          break;
      }
      ctx.restore();
    }
  }

  addToInventory(type: ResourceType, x: number, y: number): boolean {
    if (this.getInventoryCount() >= INVENTORY_MAX_SLOTS) {
      this.inventoryFullWarningTimer = 3;
      return false;
    }

    const existing = this.inventory.find(slot => slot.type === type);
    if (existing) {
      existing.count++;
    } else {
      this.inventory.push({ type, count: 1 });
    }

    this.collectAnimations.push({
      resource: type,
      startX: x,
      startY: y,
      time: 0,
      duration: COLLECT_DURATION
    });

    return true;
  }

  getInventoryCount(): number {
    return this.inventory.reduce((sum, slot) => sum + slot.count, 0);
  }

  getInventory(): InventorySlot[] {
    return this.inventory;
  }

  useItem(index: number, itemScreenX: number, itemScreenY: number, playerX: number, playerY: number): boolean {
    if (index < 0 || index >= this.inventory.length) return false;

    const slot = this.inventory[index];
    const info = RESOURCE_INFO[slot.type];

    if (info.hungerRestore === 0 && info.thirstRestore === 0) return false;

    this.hunger = Math.min(100, this.hunger + info.hungerRestore);
    this.thirst = Math.min(100, this.thirst + info.thirstRestore);

    slot.count--;
    if (slot.count <= 0) {
      this.inventory.splice(index, 1);
    }

    this.useAnimations.push({
      resource: slot.type,
      startX: itemScreenX,
      startY: itemScreenY,
      endX: playerX,
      endY: playerY,
      time: 0,
      duration: USE_DURATION
    });

    return true;
  }

  getHp(): number { return this.hp; }
  getHunger(): number { return this.hunger; }
  getThirst(): number { return this.thirst; }
  getQ(): number { return this.isMoving ? this.targetQ : this.q; }
  getR(): number { return this.isMoving ? this.targetR : this.r; }
  getActualQ(): number { return this.q; }
  getActualR(): number { return this.r; }
  isDead(): boolean { return this.dead; }

  getInventoryFullWarning(): boolean {
    return this.inventoryFullWarningTimer > 0;
  }

  getInventoryFullWarningAlpha(): number {
    if (this.inventoryFullWarningTimer <= 0) return 0;
    const phase = Math.floor(this.inventoryFullWarningTimer / 0.5);
    return phase % 2 === 0 ? 1 : 0.3;
  }
}
