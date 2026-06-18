import type { MazeData, WeaponType, ChestData } from './MazeGenerator.js';
import { EnemyAI, type Projectile, type SlowAura } from './EnemyAI.js';

export interface Player {
  x: number;
  y: number;
  size: number;
  speed: number;
  hp: number;
  maxHp: number;
  invincible: boolean;
  invincibleTimer: number;
  shieldTimer: number;
  shieldCooldown: number;
  facingX: number;
  facingY: number;
}

export interface InventoryWeapon {
  type: WeaponType;
  count: number;
  cooldown: number;
}

export interface Pickup {
  x: number;
  y: number;
  type: 'health' | 'key';
  alive: boolean;
  pulsePhase: number;
}

export interface FeedbackAnim {
  x: number;
  y: number;
  type: 'pickup' | 'attack' | 'open' | 'hit';
  elapsed: number;
  duration: number;
}

export type GameState = 'playing' | 'win' | 'dead';

export class GameLogic {
  maze: MazeData;
  player: Player;
  enemyAI: EnemyAI;
  inventory: Map<WeaponType, InventoryWeapon>;
  currentWeapon: WeaponType | null;
  weaponOrder: WeaponType[] = ['sword', 'bow', 'staff', 'shield'];
  keys: number = 0;
  keysRequired: number = 3;
  pickups: Pickup[] = [];
  feedbackAnims: FeedbackAnim[] = [];
  gameState: GameState = 'playing';
  exitUnlocked: boolean = false;
  inventoryOpen: boolean = false;
  swordAttackActive: boolean = false;
  swordAttackTimer: number = 0;
  lastKeyPresses: Set<string> = new Set();

  constructor(maze: MazeData) {
    this.maze = maze;
    this.player = {
      x: maze.playerSpawn.x,
      y: maze.playerSpawn.y,
      size: 16,
      speed: 3,
      hp: 10,
      maxHp: 10,
      invincible: false,
      invincibleTimer: 0,
      shieldTimer: 0,
      shieldCooldown: 0,
      facingX: 1,
      facingY: 0
    };
    this.enemyAI = new EnemyAI(maze);
    this.inventory = new Map();
    this.currentWeapon = null;
  }

  handleKeyDown(key: string): void {
    this.lastKeyPresses.add(key.toLowerCase());

    if (key.toLowerCase() === 'b') {
      this.inventoryOpen = !this.inventoryOpen;
    }
    if (key.toLowerCase() === 'tab') {
      this.cycleWeapon();
    }
    if (key.toLowerCase() === 'q') {
      this.useWeaponSkill();
    }
    if (key.toLowerCase() === 'e') {
      this.tryInteract();
    }
  }

  handleKeyUp(key: string): void {
    this.lastKeyPresses.delete(key.toLowerCase());
  }

  private cycleWeapon(): void {
    const owned = this.weaponOrder.filter(w => (this.inventory.get(w)?.count ?? 0) > 0);
    if (owned.length === 0) {
      this.currentWeapon = null;
      return;
    }
    if (!this.currentWeapon) {
      this.currentWeapon = owned[0];
      return;
    }
    const idx = owned.indexOf(this.currentWeapon);
    this.currentWeapon = owned[(idx + 1) % owned.length];
  }

  private useWeaponSkill(): void {
    if (!this.currentWeapon) return;
    const inv = this.inventory.get(this.currentWeapon);
    if (!inv || inv.count <= 0) return;
    if (inv.cooldown > 0) return;

    if (this.currentWeapon === 'bow') {
      const cx = this.player.x + this.player.size / 2;
      const cy = this.player.y + this.player.size / 2;
      this.enemyAI.fireProjectile(cx, cy, this.player.facingX, this.player.facingY);
      inv.cooldown = 2000;
      this.addFeedback(cx, cy, 'attack');
    } else if (this.currentWeapon === 'staff') {
      const cx = this.player.x + this.player.size / 2;
      const cy = this.player.y + this.player.size / 2;
      this.enemyAI.createSlowAura(cx, cy);
      inv.cooldown = 2000;
      this.addFeedback(cx, cy, 'attack');
    } else if (this.currentWeapon === 'shield') {
      if (this.player.shieldCooldown <= 0) {
        this.player.shieldTimer = 3000;
        this.player.invincible = true;
        this.player.invincibleTimer = 3000;
        this.player.shieldCooldown = 10000;
        this.addFeedback(this.player.x, this.player.y, 'attack');
      }
    } else if (this.currentWeapon === 'sword') {
      this.swordAttackActive = true;
      this.swordAttackTimer = 200;
      inv.cooldown = 2000;
      const cx = this.player.x + this.player.size / 2;
      const cy = this.player.y + this.player.size / 2;
      const attackX = cx + this.player.facingX * 30;
      const attackY = cy + this.player.facingY * 30;
      this.addFeedback(attackX, attackY, 'attack');
      this.doSwordDamage(attackX, attackY);
    }
  }

  private doSwordDamage(ax: number, ay: number): void {
    const attackRange = 40;
    for (const enemy of this.enemyAI.enemies) {
      if (!enemy.alive) continue;
      const ecx = enemy.x + enemy.size / 2;
      const ecy = enemy.y + enemy.size / 2;
      const d = Math.sqrt((ax - ecx) ** 2 + (ay - ecy) ** 2);
      if (d < attackRange) {
        enemy.alive = false;
        this.onEnemyKilled(enemy.x + enemy.size / 2, enemy.y + enemy.size / 2);
      }
    }
  }

  private onEnemyKilled(x: number, y: number): void {
    const r = Math.random();
    if (r < 0.5) {
      this.pickups.push({
        x, y, type: 'health', alive: true, pulsePhase: 0
      });
    } else if (r < 0.55) {
      this.pickups.push({
        x, y, type: 'key', alive: true, pulsePhase: 0
      });
    }
  }

  private tryInteract(): void {
    const cx = this.player.x + this.player.size / 2;
    const cy = this.player.y + this.player.size / 2;
    const interactRange = 30;

    for (const chest of this.maze.chests) {
      if (chest.opened) continue;
      const chestCx = chest.x + 10;
      const chestCy = chest.y + 10;
      const d = Math.sqrt((cx - chestCx) ** 2 + (cy - chestCy) ** 2);
      if (d < interactRange) {
        this.openChest(chest);
        return;
      }
    }

    const exitD = Math.sqrt((cx - this.maze.exitPos.x) ** 2 + (cy - this.maze.exitPos.y) ** 2);
    if (exitD < 35 && this.exitUnlocked) {
      this.gameState = 'win';
      this.addFeedback(this.maze.exitPos.x, this.maze.exitPos.y, 'open');
    }
  }

  private openChest(chest: ChestData): void {
    chest.opened = true;
    this.addFeedback(chest.x + 10, chest.y + 10, 'open');

    const wt = chest.weaponType;
    const existing = this.inventory.get(wt);
    if (existing) {
      existing.count++;
    } else {
      this.inventory.set(wt, { type: wt, count: 1, cooldown: 0 });
    }
    if (!this.currentWeapon) {
      this.currentWeapon = wt;
    }
    this.addFeedback(chest.x + 10, chest.y + 10, 'pickup');
  }

  private addFeedback(x: number, y: number, type: FeedbackAnim['type']): void {
    this.feedbackAnims.push({
      x, y, type, elapsed: 0, duration: 200
    });
  }

  update(deltaTime: number): void {
    if (this.gameState !== 'playing') return;

    let dx = 0, dy = 0;
    if (this.lastKeyPresses.has('w') || this.lastKeyPresses.has('arrowup')) dy -= 1;
    if (this.lastKeyPresses.has('s') || this.lastKeyPresses.has('arrowdown')) dy += 1;
    if (this.lastKeyPresses.has('a') || this.lastKeyPresses.has('arrowleft')) dx -= 1;
    if (this.lastKeyPresses.has('d') || this.lastKeyPresses.has('arrowright')) dx += 1;

    if (dx !== 0 || dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      dx /= len; dy /= len;
      this.player.facingX = dx;
      this.player.facingY = dy;

      const mvX = dx * this.player.speed;
      const mvY = dy * this.player.speed;

      if (!this.checkWall(this.player.x + mvX, this.player.y)) {
        this.player.x += mvX;
      }
      if (!this.checkWall(this.player.x, this.player.y + mvY)) {
        this.player.y += mvY;
      }
    }

    if (this.player.invincibleTimer > 0) {
      this.player.invincibleTimer -= deltaTime;
      if (this.player.invincibleTimer <= 0) {
        this.player.invincible = false;
      }
    }
    if (this.player.shieldTimer > 0) {
      this.player.shieldTimer -= deltaTime;
    }
    if (this.player.shieldCooldown > 0) {
      this.player.shieldCooldown -= deltaTime;
    }
    if (this.swordAttackTimer > 0) {
      this.swordAttackTimer -= deltaTime;
      if (this.swordAttackTimer <= 0) this.swordAttackActive = false;
    }

    for (const [, inv] of this.inventory) {
      if (inv.cooldown > 0) inv.cooldown -= deltaTime;
    }

    const aiResult = this.enemyAI.update(deltaTime, {
      x: this.player.x + this.player.size / 2,
      y: this.player.y + this.player.size / 2,
      invincible: this.player.invincible
    });

    if (aiResult.damageToPlayer) {
      this.damagePlayer(1);
    }

    const pcx = this.player.x + this.player.size / 2;
    const pcy = this.player.y + this.player.size / 2;
    for (const pickup of this.pickups) {
      if (!pickup.alive) continue;
      pickup.pulsePhase += deltaTime * 0.005;
      const d = Math.sqrt((pcx - pickup.x) ** 2 + (pcy - pickup.y) ** 2);
      if (d < 25) {
        pickup.alive = false;
        if (pickup.type === 'health') {
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + 2);
          this.addFeedback(pickup.x, pickup.y, 'pickup');
        } else if (pickup.type === 'key') {
          this.keys++;
          this.addFeedback(pickup.x, pickup.y, 'pickup');
          if (this.keys >= this.keysRequired) {
            this.exitUnlocked = true;
          }
        }
      }
    }
    this.pickups = this.pickups.filter(p => p.alive);

    for (const anim of this.feedbackAnims) {
      anim.elapsed += deltaTime;
    }
    this.feedbackAnims = this.feedbackAnims.filter(a => a.elapsed < a.duration);

    if (this.player.hp <= 0) {
      this.gameState = 'dead';
    }
  }

  private damagePlayer(amount: number): void {
    if (this.player.invincible) return;
    this.player.hp -= amount;
    this.player.invincible = true;
    this.player.invincibleTimer = 1000;
    this.addFeedback(this.player.x, this.player.y, 'hit');
  }

  private checkWall(nx: number, ny: number): boolean {
    const pad = 3;
    for (const w of this.maze.walls) {
      if (nx + pad < w.x + w.w && nx + this.player.size - pad > w.x &&
          ny + pad < w.y + w.h && ny + this.player.size - pad > w.y) {
        return true;
      }
    }
    return false;
  }

  getProjectiles(): Projectile[] {
    return this.enemyAI.projectiles;
  }

  getSlowAuras(): SlowAura[] {
    return this.enemyAI.getSlowAuras();
  }
}
