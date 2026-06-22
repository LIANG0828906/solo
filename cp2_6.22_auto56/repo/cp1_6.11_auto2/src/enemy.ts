import type { EnemyType, EnemyState, Position } from './types';

let enemyIdCounter = 0;

export interface EnemyCallbacks {
  onDeath: (enemy: Enemy) => void;
  onAoeWarning: (x: number, y: number, radius: number, lifetime: number, damage: number) => void;
  onSummon: (x: number, y: number) => void;
  onAttackPlayer: (damage: number) => void;
}

export class Enemy {
  state: EnemyState;
  private callbacks: EnemyCallbacks;

  constructor(type: EnemyType, x: number, y: number, callbacks: EnemyCallbacks) {
    this.callbacks = callbacks;
    this.state = this.createState(type, x, y);
  }

  private createState(type: EnemyType, x: number, y: number): EnemyState {
    const base: Record<EnemyType, Partial<EnemyState>> = {
      normal: {
        health: 50,
        maxHealth: 50,
        damage: 8,
        speed: 70,
        size: 18,
        color: '#8b0000',
        attackCooldown: 1.2
      },
      elite: {
        health: 120,
        maxHealth: 120,
        damage: 15,
        speed: 55,
        size: 26,
        color: '#9932cc',
        attackCooldown: 1.5
      },
      boss: {
        health: 500,
        maxHealth: 500,
        damage: 25,
        speed: 40,
        size: 40,
        color: '#ff4500',
        attackCooldown: 2.0
      }
    };

    const cfg = base[type];
    return {
      id: ++enemyIdCounter,
      type,
      position: { x, y },
      health: cfg.health!,
      maxHealth: cfg.maxHealth!,
      damage: cfg.damage!,
      speed: cfg.speed!,
      size: cfg.size!,
      color: cfg.color!,
      attackCooldown: cfg.attackCooldown!,
      lastAttackTime: 0,
      aoeCooldown: type === 'elite' ? 4 : 0,
      summonCooldown: type === 'boss' ? 10 : 0
    };
  }

  takeDamage(amount: number): boolean {
    this.state.health -= amount;
    if (this.state.health <= 0) {
      this.state.health = 0;
      this.callbacks.onDeath(this);
      return true;
    }
    return false;
  }

  getDistanceToPlayer(playerPos: Position): number {
    const dx = this.state.position.x - playerPos.x;
    const dy = this.state.position.y - playerPos.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  update(
    dt: number,
    playerPos: Position,
    playerSize: number,
    now: number,
    canvasW: number,
    canvasH: number
  ): void {
    const { position, size, speed } = this.state;
    const dx = playerPos.x - position.x;
    const dy = playerPos.y - position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const contactDist = size + playerSize;

    if (this.state.type === 'normal') {
      if (dist > contactDist) {
        position.x += (dx / dist) * speed * dt;
        position.y += (dy / dist) * speed * dt;
      } else if (now - this.state.lastAttackTime >= this.state.attackCooldown * 1000) {
        this.state.lastAttackTime = now;
        this.callbacks.onAttackPlayer(this.state.damage);
      }
    } else if (this.state.type === 'elite') {
      if (dist > contactDist + 10) {
        position.x += (dx / dist) * speed * dt;
        position.y += (dy / dist) * speed * dt;
      }

      if (now - this.state.lastAttackTime >= this.state.attackCooldown * 1000 && dist <= contactDist + 20) {
        this.state.lastAttackTime = now;
        this.callbacks.onAttackPlayer(this.state.damage);
      }

      this.state.aoeCooldown -= dt;
      if (this.state.aoeCooldown <= 0) {
        this.state.aoeCooldown = 6 + Math.random() * 4;
        this.callbacks.onAoeWarning(position.x, position.y, 80, 1.5, 20);
      }
    } else if (this.state.type === 'boss') {
      if (dist > contactDist + 30) {
        position.x += (dx / dist) * speed * dt;
        position.y += (dy / dist) * speed * dt;
      }

      if (now - this.state.lastAttackTime >= this.state.attackCooldown * 1000 && dist <= contactDist + 40) {
        this.state.lastAttackTime = now;
        this.callbacks.onAttackPlayer(this.state.damage);
      }

      this.state.summonCooldown -= dt;
      if (this.state.summonCooldown <= 0) {
        this.state.summonCooldown = 10;
        for (let i = 0; i < 3; i++) {
          const angle = (Math.PI * 2 * i) / 3 + Math.random() * 0.5;
          const dist = 80;
          this.callbacks.onSummon(
            position.x + Math.cos(angle) * dist,
            position.y + Math.sin(angle) * dist
          );
        }
      }
    }

    position.x = Math.max(size, Math.min(canvasW - size, position.x));
    position.y = Math.max(size, Math.min(canvasH - size, position.y));
  }

  checkMeleeHit(ax: number, ay: number, range: number, angle: number, arc: number = Math.PI / 2): boolean {
    const dx = this.state.position.x - ax;
    const dy = this.state.position.y - ay;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > range + this.state.size / 2) return false;
    const targetAngle = Math.atan2(dy, dx);
    let diff = Math.abs(targetAngle - angle);
    if (diff > Math.PI) diff = Math.PI * 2 - diff;
    return diff <= arc / 2;
  }

  checkProjectileHit(px: number, py: number, pr: number): boolean {
    const dx = this.state.position.x - px;
    const dy = this.state.position.y - py;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist <= this.state.size / 2 + pr;
  }

  checkAoeHit(ax: number, ay: number, radius: number): boolean {
    const dx = this.state.position.x - ax;
    const dy = this.state.position.y - ay;
    return Math.sqrt(dx * dx + dy * dy) <= radius;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const { position, size, color, type, health, maxHealth } = this.state;

    ctx.save();
    ctx.translate(position.x, position.y);

    ctx.fillStyle = color;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;

    if (type === 'normal') {
      ctx.beginPath();
      ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.fillRect(-size / 4, -size / 6, 4, 4);
      ctx.fillRect(size / 4 - 4, -size / 6, 4, 4);
    } else if (type === 'elite') {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 * i) / 6 - Math.PI / 2;
        const r = size / 2;
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ff0';
      ctx.fillRect(-6, -4, 4, 4);
      ctx.fillRect(2, -4, 4, 4);
    } else if (type === 'boss') {
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI * 2 * i) / 8 - Math.PI / 2;
        const r = i % 2 === 0 ? size / 2 : size / 3;
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ff0';
      ctx.beginPath();
      ctx.arc(-8, -4, 4, 0, Math.PI * 2);
      ctx.arc(8, -4, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    const barW = size * 1.5;
    const barH = 4;
    const barY = position.y - size / 2 - 10;
    ctx.fillStyle = '#333';
    ctx.fillRect(position.x - barW / 2, barY, barW, barH);
    ctx.fillStyle = '#ff3030';
    ctx.fillRect(position.x - barW / 2, barY, barW * (health / maxHealth), barH);
    ctx.strokeStyle = '#7fff7f';
    ctx.lineWidth = 1;
    ctx.strokeRect(position.x - barW / 2, barY, barW, barH);
  }

  getSize(): number {
    return this.state.size / 2;
  }
}
