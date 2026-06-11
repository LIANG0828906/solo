import type { WeaponType, WeaponStats, PlayerState, Position } from './types';

export const WEAPONS: Record<WeaponType, WeaponStats> = {
  melee: {
    type: 'melee',
    name: 'Sword',
    damage: 25,
    attackSpeed: 400,
    range: 60,
    staminaCost: 8,
    manaCost: 0,
    color: '#c0c0c0'
  },
  bow: {
    type: 'bow',
    name: 'Bow',
    damage: 15,
    attackSpeed: 600,
    range: 400,
    staminaCost: 10,
    manaCost: 0,
    color: '#8b4513'
  },
  staff: {
    type: 'staff',
    name: 'Staff',
    damage: 35,
    attackSpeed: 900,
    range: 350,
    staminaCost: 5,
    manaCost: 20,
    color: '#9370db'
  }
};

const PLAYER_SPEED = 180;
const PLAYER_SIZE = 24;
const STAMINA_REGEN = 40;
const STAMINA_MOVE_COST = 15;
const MAX_HEALTH = 100;
const MAX_MANA = 100;
const MAX_STAMINA = 100;

export interface PlayerCallbacks {
  onShootProjectile: (x: number, y: number, angle: number, damage: number, type: 'arrow' | 'magic') => void;
  onMeleeAttack: (x: number, y: number, range: number, damage: number, angle: number) => void;
  onHeal: (amount: number) => void;
  onDamageDealt: (x: number, y: number, damage: number) => void;
}

export class Player {
  state: PlayerState;
  private keys: Set<string> = new Set();
  private lastAttackTime = 0;
  private mouseX = 0;
  private mouseY = 0;
  private joystickVector: Position = { x: 0, y: 0 };
  private callbacks: PlayerCallbacks;
  private weaponSwitchTime = 0;
  private prevWeapon: WeaponType = 'melee';
  public isMobile = false;

  constructor(startX: number, startY: number, callbacks: PlayerCallbacks) {
    this.state = {
      position: { x: startX, y: startY },
      health: MAX_HEALTH,
      maxHealth: MAX_HEALTH,
      mana: MAX_MANA,
      maxMana: MAX_MANA,
      stamina: MAX_STAMINA,
      maxStamina: MAX_STAMINA,
      currentWeapon: 'melee',
      weaponTransition: 1,
      isAttacking: false,
      attackProgress: 0,
      facingAngle: 0,
      potions: 3
    };
    this.callbacks = callbacks;
  }

  handleKeyDown(code: string): void {
    this.keys.add(code);
    if (code === 'Digit1') this.switchWeapon('melee');
    if (code === 'Digit2') this.switchWeapon('bow');
    if (code === 'Digit3') this.switchWeapon('staff');
    if (code === 'KeyQ') this.usePotion();
  }

  handleKeyUp(code: string): void {
    this.keys.delete(code);
  }

  handleMouseMove(x: number, y: number): void {
    this.mouseX = x;
    this.mouseY = y;
  }

  handleMouseDown(x: number, y: number): void {
    this.mouseX = x;
    this.mouseY = y;
    this.attack();
  }

  setJoystickVector(x: number, y: number): void {
    this.joystickVector = { x, y };
  }

  private switchWeapon(weapon: WeaponType): void {
    if (this.state.currentWeapon === weapon) return;
    this.prevWeapon = this.state.currentWeapon;
    this.state.currentWeapon = weapon;
    this.weaponSwitchTime = performance.now();
    this.state.weaponTransition = 0;
  }

  private usePotion(): void {
    if (this.state.potions <= 0) return;
    if (this.state.health >= this.state.maxHealth) return;
    this.state.potions--;
    const healAmount = 40;
    this.state.health = Math.min(this.state.maxHealth, this.state.health + healAmount);
    this.callbacks.onHeal(healAmount);
  }

  private attack(): void {
    const now = performance.now();
    const weapon = WEAPONS[this.state.currentWeapon];
    if (now - this.lastAttackTime < weapon.attackSpeed) return;
    if (this.state.stamina < weapon.staminaCost) return;
    if (this.state.mana < weapon.manaCost) return;

    this.lastAttackTime = now;
    this.state.stamina -= weapon.staminaCost;
    this.state.mana -= weapon.manaCost;
    this.state.isAttacking = true;
    this.state.attackProgress = 0;

    const dx = this.mouseX - this.state.position.x;
    const dy = this.mouseY - this.state.position.y;
    const angle = Math.atan2(dy, dx);
    this.state.facingAngle = angle;

    if (weapon.type === 'melee') {
      this.callbacks.onMeleeAttack(
        this.state.position.x,
        this.state.position.y,
        weapon.range,
        weapon.damage,
        angle
      );
    } else if (weapon.type === 'bow') {
      this.callbacks.onShootProjectile(
        this.state.position.x,
        this.state.position.y,
        angle,
        weapon.damage,
        'arrow'
      );
    } else if (weapon.type === 'staff') {
      this.callbacks.onShootProjectile(
        this.state.position.x,
        this.state.position.y,
        angle,
        weapon.damage,
        'magic'
      );
    }
  }

  takeDamage(amount: number): void {
    this.state.health = Math.max(0, this.state.health - amount);
  }

  restoreMana(amount: number): void {
    this.state.mana = Math.min(this.state.maxMana, this.state.mana + amount);
  }

  private getMovementVector(): Position {
    let dx = 0;
    let dy = 0;

    if (this.isMobile) {
      dx = this.joystickVector.x;
      dy = this.joystickVector.y;
    } else {
      if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) dy -= 1;
      if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) dy += 1;
      if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) dx -= 1;
      if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) dx += 1;
    }

    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 0) {
      dx /= len;
      dy /= len;
    }
    return { x: dx, y: dy };
  }

  update(dt: number, canvasW: number, canvasH: number): void {
    const move = this.getMovementVector();
    const isMoving = move.x !== 0 || move.y !== 0;

    if (isMoving && this.state.stamina > 0) {
      this.state.position.x += move.x * PLAYER_SPEED * dt;
      this.state.position.y += move.y * PLAYER_SPEED * dt;
      this.state.stamina = Math.max(0, this.state.stamina - STAMINA_MOVE_COST * dt);
    } else {
      this.state.stamina = Math.min(this.state.maxStamina, this.state.stamina + STAMINA_REGEN * dt);
    }

    this.state.position.x = Math.max(PLAYER_SIZE, Math.min(canvasW - PLAYER_SIZE, this.state.position.x));
    this.state.position.y = Math.max(PLAYER_SIZE, Math.min(canvasH - PLAYER_SIZE, this.state.position.y));

    if (!this.isMobile) {
      const dx = this.mouseX - this.state.position.x;
      const dy = this.mouseY - this.state.position.y;
      this.state.facingAngle = Math.atan2(dy, dx);
    }

    const weapon = WEAPONS[this.state.currentWeapon];
    const attackDur = weapon.attackSpeed / 1000;
    if (this.state.isAttacking) {
      this.state.attackProgress += dt / attackDur;
      if (this.state.attackProgress >= 1) {
        this.state.isAttacking = false;
        this.state.attackProgress = 0;
      }
    }

    const switchDur = 0.2;
    if (this.state.weaponTransition < 1) {
      this.state.weaponTransition = Math.min(1, (performance.now() - this.weaponSwitchTime) / (switchDur * 1000));
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const { position, facingAngle, currentWeapon, attackProgress, weaponTransition } = this.state;
    const weapon = WEAPONS[currentWeapon];

    ctx.save();
    ctx.translate(position.x, position.y);

    ctx.fillStyle = '#2d5a87';
    ctx.strokeStyle = '#7fff7f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, PLAYER_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.rotate(facingAngle);
    ctx.fillStyle = '#3fff7f';
    ctx.beginPath();
    ctx.moveTo(PLAYER_SIZE / 2 + 4, 0);
    ctx.lineTo(PLAYER_SIZE / 2 - 4, -5);
    ctx.lineTo(PLAYER_SIZE / 2 - 4, 5);
    ctx.closePath();
    ctx.fill();

    ctx.save();
    const alpha = weaponTransition;
    if (currentWeapon === 'melee') {
      const swingOffset = Math.sin(attackProgress * Math.PI) * 30;
      ctx.rotate(-Math.PI / 4 + swingOffset * 0.02);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = weapon.color;
      ctx.fillRect(12, -3, 28, 6);
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(8, -4, 6, 8);
    } else if (currentWeapon === 'bow') {
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = weapon.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(18, 0, 16, -Math.PI / 3, Math.PI / 3);
      ctx.stroke();
      ctx.strokeStyle = '#ddd';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(18 + Math.cos(-Math.PI / 3) * 16, Math.sin(-Math.PI / 3) * 16);
      ctx.lineTo(18 + Math.cos(Math.PI / 3) * 16, Math.sin(Math.PI / 3) * 16);
      ctx.stroke();
    } else if (currentWeapon === 'staff') {
      const castOffset = Math.sin(attackProgress * Math.PI * 2) * 3;
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = weapon.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(32 + castOffset, 0);
      ctx.stroke();
      ctx.fillStyle = '#ff66ff';
      ctx.beginPath();
      ctx.arc(36 + castOffset, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 102, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(36 + castOffset, 0, 10, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    if (weaponTransition < 1 && this.prevWeapon !== currentWeapon) {
      const prev = WEAPONS[this.prevWeapon];
      ctx.save();
      ctx.globalAlpha = 1 - weaponTransition;
      if (prev.type === 'melee') {
        ctx.rotate(-Math.PI / 4);
        ctx.fillStyle = prev.color;
        ctx.fillRect(12, -3, 28, 6);
      } else if (prev.type === 'bow') {
        ctx.strokeStyle = prev.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(18, 0, 16, -Math.PI / 3, Math.PI / 3);
        ctx.stroke();
      } else if (prev.type === 'staff') {
        ctx.strokeStyle = prev.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(32, 0);
        ctx.stroke();
        ctx.fillStyle = '#ff66ff';
        ctx.beginPath();
        ctx.arc(36, 0, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.restore();
  }

  getSize(): number {
    return PLAYER_SIZE / 2;
  }
}
