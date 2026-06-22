import type { Ship, Bullet, Asteroid, Particle } from './types';

const KEY_MAP: Record<string, Record<string, string>> = {
  '1': {
    KeyW: 'up',
    KeyS: 'down',
    KeyA: 'left',
    KeyD: 'right',
    KeyQ: 'shoot',
    KeyE: 'shield',
  },
  '2': {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    Slash: 'shoot',
    Period: 'shield',
  },
};

const SHIP_SPEED = 300;
const ACCELERATION = 600;
const FRICTION = 0.98;
const BULLET_SPEED = 600;
const BULLET_DAMAGE = 20;
const SHIELD_DURATION = 3000;
const SHIELD_COOLDOWN = 8000;
const WEAPON_COOLDOWN = 250;
const ROTATION_SPEED = 4;
const TRAIL_LENGTH = 15;

interface TrailPoint {
  x: number;
  y: number;
  alpha: number;
}

export interface PlayerShipExtra {
  trail: TrailPoint[];
  engineGlow: number;
}

export class PlayerController {
  private keys: Record<string, Record<string, boolean>> = {
    '1': { up: false, down: false, left: false, right: false, shoot: false, shield: false },
    '2': { up: false, down: false, left: false, right: false, shoot: false, shield: false },
  };

  private shootTimer: Record<string, number> = { '1': 0, '2': 0 };
  private shieldPressed: Record<string, boolean> = { '1': false, '2': false };
  private extra: Map<string, PlayerShipExtra> = new Map();

  handleKeyDown(e: KeyboardEvent, playerNum: number): void {
    const playerKey = String(playerNum);
    const action = KEY_MAP[playerKey]?.[e.code];
    if (action) {
      e.preventDefault();
      this.keys[playerKey][action] = true;
      if (action === 'shield') {
        this.shieldPressed[playerKey] = true;
      }
    }
  }

  handleKeyUp(e: KeyboardEvent, playerNum: number): void {
    const playerKey = String(playerNum);
    const action = KEY_MAP[playerKey]?.[e.code];
    if (action) {
      e.preventDefault();
      this.keys[playerKey][action] = false;
      if (action === 'shield') {
        this.shieldPressed[playerKey] = false;
      }
    }
  }

  getPlayerNum(shipId: string, ships: Ship[]): number {
    const idx = ships.findIndex(s => s.id === shipId);
    return idx === -1 ? 0 : idx + 1;
  }

  getKeysForShip(shipId: string, ships: Ship[]): Record<string, boolean> {
    const num = this.getPlayerNum(shipId, ships);
    return this.keys[String(num)];
  }

  ensureExtra(shipId: string): PlayerShipExtra {
    if (!this.extra.has(shipId)) {
      this.extra.set(shipId, { trail: [], engineGlow: 0 });
    }
    return this.extra.get(shipId)!;
  }

  updateShip(
    ship: Ship,
    deltaTime: number,
    store: {
      addBullet: (b: Partial<Bullet>) => Bullet;
      activateShield: (shipId: string) => void;
      ships: Ship[];
    }
  ): void {
    const playerNum = this.getPlayerNum(ship.id, store.ships);
    const playerKey = String(playerNum);
    const keys = this.keys[playerKey] ?? {};
    const extra = this.ensureExtra(ship.id);

    let moveX = 0;
    let moveY = 0;
    if (keys.left) moveX -= 1;
    if (keys.right) moveX += 1;
    if (keys.up) moveY -= 1;
    if (keys.down) moveY += 1;

    const moveLength = Math.hypot(moveX, moveY);
    if (moveLength > 0) {
      moveX /= moveLength;
      moveY /= moveLength;
      const targetRotation = Math.atan2(moveY, moveX) + Math.PI / 2;
      const diff = targetRotation - ship.rotation;
      const normalized = Math.atan2(Math.sin(diff), Math.cos(diff));
      ship.rotation += normalized * ROTATION_SPEED * deltaTime;
      extra.engineGlow = Math.min(1, extra.engineGlow + deltaTime * 3);
    } else {
      extra.engineGlow = Math.max(0, extra.engineGlow - deltaTime * 2);
    }

    ship.velocity.x += moveX * ACCELERATION * deltaTime;
    ship.velocity.y += moveY * ACCELERATION * deltaTime;

    const speed = Math.hypot(ship.velocity.x, ship.velocity.y);
    if (speed > SHIP_SPEED) {
      ship.velocity.x = (ship.velocity.x / speed) * SHIP_SPEED;
      ship.velocity.y = (ship.velocity.y / speed) * SHIP_SPEED;
    }

    ship.velocity.x *= Math.pow(FRICTION, deltaTime * 60);
    ship.velocity.y *= Math.pow(FRICTION, deltaTime * 60);

    ship.position.x += ship.velocity.x * deltaTime;
    ship.position.y += ship.velocity.y * deltaTime;

    if (moveLength > 0) {
      extra.trail.unshift({ x: ship.position.x, y: ship.position.y, alpha: 1 });
      if (extra.trail.length > TRAIL_LENGTH) {
        extra.trail.pop();
      }
    }
    extra.trail.forEach((t, i) => {
      t.alpha = 1 - i / TRAIL_LENGTH;
    });

    this.shootTimer[playerKey] = Math.max(0, this.shootTimer[playerKey] - deltaTime * 1000);
    ship.weaponCooldown = Math.max(0, ship.weaponCooldown - deltaTime * 1000);

    if (keys.shoot && ship.weaponCooldown <= 0 && this.shootTimer[playerKey] <= 0) {
      const angle = ship.rotation - Math.PI / 2;
      const offset = 20;
      store.addBullet({
        ownerId: ship.id,
        position: {
          x: ship.position.x + Math.cos(angle) * offset,
          y: ship.position.y + Math.sin(angle) * offset,
        },
        velocity: {
          x: Math.cos(angle) * BULLET_SPEED + ship.velocity.x * 0.3,
          y: Math.sin(angle) * BULLET_SPEED + ship.velocity.y * 0.3,
        },
        damage: BULLET_DAMAGE,
        color: ship.color,
        life: 2000,
        trail: [],
      });
      ship.weaponCooldown = ship.fireRate;
      this.shootTimer[playerKey] = ship.fireRate;
    }

    ship.shieldCooldown = Math.max(0, ship.shieldCooldown - deltaTime * 1000);

    if (this.shieldPressed[playerKey] && !ship.isShieldActive && ship.shieldCooldown <= 0) {
      store.activateShield(ship.id);
      this.shieldPressed[playerKey] = false;
    }

    if (ship.isShieldActive) {
      ship.shieldHealth = Math.max(0, ship.shieldHealth - deltaTime * (ship.shieldMax / SHIELD_DURATION) * 1000);
      if (ship.shieldHealth <= 0) {
        ship.isShieldActive = false;
      }
    }
  }

  renderShip(ctx: CanvasRenderingContext2D, ship: Ship, time: number): void {
    const extra = this.ensureExtra(ship.id);

    if (extra.trail.length > 1) {
      for (let i = 1; i < extra.trail.length; i++) {
        const prev = extra.trail[i - 1];
        const curr = extra.trail[i];
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(curr.x, curr.y);
        ctx.strokeStyle = `${ship.color}${Math.floor(curr.alpha * 80).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = (1 - i / extra.trail.length) * 4;
        ctx.stroke();
      }
    }

    if (extra.engineGlow > 0) {
      const glowX = ship.position.x - Math.sin(ship.rotation) * 18;
      const glowY = ship.position.y + Math.cos(ship.rotation) * 18;
      const gradient = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, 25 * extra.engineGlow);
      gradient.addColorStop(0, `rgba(255, 180, 50, ${0.8 * extra.engineGlow})`);
      gradient.addColorStop(0.4, `rgba(255, 100, 30, ${0.5 * extra.engineGlow})`);
      gradient.addColorStop(1, 'rgba(255, 50, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(glowX, glowY, 25 * extra.engineGlow, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.save();
    ctx.translate(ship.position.x, ship.position.y);
    ctx.rotate(ship.rotation);

    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(16, 18);
    ctx.lineTo(6, 12);
    ctx.lineTo(-6, 12);
    ctx.lineTo(-16, 18);
    ctx.closePath();

    const bodyGradient = ctx.createLinearGradient(0, -22, 0, 18);
    bodyGradient.addColorStop(0, ship.color);
    bodyGradient.addColorStop(1, this.darkenColor(ship.color, 0.4));
    ctx.fillStyle = bodyGradient;
    ctx.fill();

    ctx.strokeStyle = this.lightenColor(ship.color, 0.3);
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(5, 2);
    ctx.lineTo(-5, 2);
    ctx.closePath();
    ctx.fillStyle = 'rgba(150, 220, 255, 0.8)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(200, 240, 255, 1)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();

    if (ship.isShieldActive) {
      const pulse = 1 + Math.sin(time * 0.005) * 0.08;
      const shieldRadius = 32 * pulse;
      const shieldGradient = ctx.createRadialGradient(ship.position.x, ship.position.y, shieldRadius * 0.6, ship.position.x, ship.position.y, shieldRadius);
      shieldGradient.addColorStop(0, 'rgba(0, 212, 255, 0)');
      shieldGradient.addColorStop(0.7, 'rgba(0, 212, 255, 0.15)');
      shieldGradient.addColorStop(1, 'rgba(0, 212, 255, 0.7)');
      ctx.beginPath();
      ctx.arc(ship.position.x, ship.position.y, shieldRadius, 0, Math.PI * 2);
      ctx.fillStyle = shieldGradient;
      ctx.fill();
      ctx.strokeStyle = `rgba(0, 212, 255, ${0.6 + Math.sin(time * 0.008) * 0.3})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    if (ship.upgradeFlash > 0) {
      const flashAlpha = (ship.upgradeFlash / 60) * 0.4;
      ctx.beginPath();
      ctx.arc(ship.position.x, ship.position.y, 30, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
      ctx.fill();
    }
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    let clean = hex.replace('#', '');
    if (clean.length === 3) {
      clean = clean.split('').map(c => c + c).join('');
    }
    const rgb = clean.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (rgb) {
      return {
        r: parseInt(rgb[1], 16),
        g: parseInt(rgb[2], 16),
        b: parseInt(rgb[3], 16),
      };
    }
    if (clean.startsWith('hsl')) {
      return { r: 180, g: 150, b: 100 };
    }
    return { r: 255, g: 255, b: 255 };
  }

  private lightenColor(hex: string, amount: number): string {
    const { r, g, b } = this.hexToRgb(hex);
    const nr = Math.round(r + (255 - r) * amount);
    const ng = Math.round(g + (255 - g) * amount);
    const nb = Math.round(b + (255 - b) * amount);
    return `rgb(${nr}, ${ng}, ${nb})`;
  }

  private darkenColor(hex: string, amount: number): string {
    const { r, g, b } = this.hexToRgb(hex);
    const nr = Math.round(r * (1 - amount));
    const ng = Math.round(g * (1 - amount));
    const nb = Math.round(b * (1 - amount));
    return `rgb(${nr}, ${ng}, ${nb})`;
  }

  isKeyPressed(playerNum: number, action: string): boolean {
    return this.keys[String(playerNum)]?.[action] ?? false;
  }
}

export { SHIP_SPEED, BULLET_SPEED, SHIELD_DURATION, SHIELD_COOLDOWN, WEAPON_COOLDOWN };
export type { TrailPoint };
