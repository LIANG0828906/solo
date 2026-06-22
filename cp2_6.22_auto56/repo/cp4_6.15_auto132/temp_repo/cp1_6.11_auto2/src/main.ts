import { Player } from './player';
import { Enemy } from './enemy';
import { HUD } from './hud';
import type {
  DamageNumber, Particle, Projectile, ManaCrystal,
  AoeIndicator, EnemyType
} from './types';

const ASPECT_RATIO = 16 / 9;
const BASE_W = 1280;
const BASE_H = 720;

interface GameState {
  canvasW: number;
  canvasH: number;
  scale: number;
  isMobile: boolean;
}

class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private state: GameState;
  private player!: Player;
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private particles: Particle[] = [];
  private damageNumbers: DamageNumber[] = [];
  private manaCrystals: ManaCrystal[] = [];
  private aoeIndicators: AoeIndicator[] = [];
  private hud!: HUD;
  private lastTime = 0;
  private damageIdCounter = 0;
  private particleIdCounter = 0;
  private projectileIdCounter = 0;
  private crystalIdCounter = 0;
  private spawnTimer = 0;
  private bossSpawned = false;
  private hudDirty = true;

  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    this.ctx = ctx;
    this.state = { canvasW: BASE_W, canvasH: BASE_H, scale: 1, isMobile: false };

    this.init();
  }

  private init(): void {
    this.resize();
    this.state.isMobile = window.innerWidth < 768;

    this.player = new Player(this.state.canvasW / 2, this.state.canvasH / 2, {
      onShootProjectile: (x, y, angle, damage, type) => this.spawnProjectile(x, y, angle, damage, type),
      onMeleeAttack: (x, y, range, damage, angle) => this.handleMeleeAttack(x, y, range, damage, angle),
      onHeal: (amount) => this.spawnHealParticles(this.player.state.position.x, this.player.state.position.y, amount),
      onDamageDealt: (x, y, damage) => this.spawnDamageNumber(x, y, damage)
    });
    this.player.isMobile = this.state.isMobile;

    this.hud = new HUD(this.ctx, this.state.canvasW, this.state.canvasH, this.state.isMobile);

    this.spawnInitialEnemies();
    this.setupInputs();
    window.addEventListener('resize', () => this.resize());

    this.lastTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }

  private resize(): void {
    const container = document.getElementById('game-container')!;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    let w = cw;
    let h = cw / ASPECT_RATIO;
    if (h > ch) {
      h = ch;
      w = ch * ASPECT_RATIO;
    }

    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.state.canvasW = w;
    this.state.canvasH = h;
    this.state.scale = Math.min(w / BASE_W, h / BASE_H);
    this.state.isMobile = w < 768;

    if (this.player) this.player.isMobile = this.state.isMobile;
    if (this.hud) this.hud.resize(w, h);
    this.hudDirty = true;
  }

  private setupInputs(): void {
    window.addEventListener('keydown', (e) => {
      this.player.handleKeyDown(e.code);
      this.hudDirty = true;
    });
    window.addEventListener('keyup', (e) => this.player.handleKeyUp(e.code));

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.player.handleMouseMove(x, y);
    });
    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.player.handleMouseDown(x, y);
    });
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    this.setupJoystick();
    this.setupMobileAttack();
  }

  private setupJoystick(): void {
    const joystick = document.getElementById('joystick');
    const handle = document.getElementById('joystick-handle');
    if (!joystick || !handle) return;

    let active = false;
    let startX = 0;
    let startY = 0;
    const maxDist = 40;

    const setHandle = (dx: number, dy: number) => {
      const dist = Math.sqrt(dx * dx + dy * dy);
      const clamped = Math.min(dist, maxDist);
      const angle = Math.atan2(dy, dx);
      const hx = Math.cos(angle) * clamped;
      const hy = Math.sin(angle) * clamped;
      handle.style.transform = `translate(${hx}px, ${hy}px)`;
      const nx = dist > 0 ? (hx / maxDist) : 0;
      const ny = dist > 0 ? (hy / maxDist) : 0;
      this.player.setJoystickVector(nx, ny);
    };

    const onStart = (e: TouchEvent | MouseEvent) => {
      active = true;
      const rect = joystick.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const pt = 'touches' in e ? e.touches[0] : e;
      startX = pt.clientX - cx;
      startY = pt.clientY - cy;
      setHandle(startX, startY);
      e.preventDefault();
    };

    const onMove = (e: TouchEvent | MouseEvent) => {
      if (!active) return;
      const rect = joystick.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const pt = 'touches' in e ? e.touches[0] : e;
      setHandle(pt.clientX - cx, pt.clientY - cy);
      e.preventDefault();
    };

    const onEnd = () => {
      active = false;
      handle.style.transform = 'translate(0, 0)';
      this.player.setJoystickVector(0, 0);
    };

    joystick.addEventListener('touchstart', onStart, { passive: false });
    joystick.addEventListener('touchmove', onMove, { passive: false });
    joystick.addEventListener('touchend', onEnd);
    joystick.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
  }

  private setupMobileAttack(): void {
    const btn = document.getElementById('mobile-attack');
    if (!btn) return;

    const attack = (e: Event) => {
      e.preventDefault();
      const centerX = this.state.canvasW / 2;
      const centerY = this.state.canvasH / 2;
      let nearest: Enemy | null = null;
      let nearestDist = Infinity;
      for (const enemy of this.enemies) {
        const dx = enemy.state.position.x - this.player.state.position.x;
        const dy = enemy.state.position.y - this.player.state.position.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < nearestDist) {
          nearestDist = d;
          nearest = enemy;
        }
      }
      let tx = centerX;
      let ty = centerY;
      if (nearest) {
        const dx = nearest.state.position.x - this.player.state.position.x;
        const dy = nearest.state.position.y - this.player.state.position.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        tx = this.player.state.position.x + (dx / len) * 100;
        ty = this.player.state.position.y + (dy / len) * 100;
      } else {
        tx = this.player.state.position.x + 100;
        ty = this.player.state.position.y;
      }
      this.player.handleMouseDown(tx, ty);
    };

    btn.addEventListener('touchstart', attack, { passive: false });
    btn.addEventListener('click', attack);
  }

  private spawnInitialEnemies(): void {
    const positions: Array<{ type: EnemyType; x: number; y: number }> = [
      { type: 'normal', x: 200, y: 150 },
      { type: 'normal', x: this.state.canvasW - 200, y: 150 },
      { type: 'normal', x: 200, y: this.state.canvasH - 150 },
      { type: 'elite', x: this.state.canvasW - 200, y: this.state.canvasH - 150 }
    ];
    for (const p of positions) {
      this.spawnEnemy(p.type, p.x, p.y);
    }
  }

  private spawnEnemy(type: EnemyType, x: number, y: number): void {
    const enemy = new Enemy(type, x, y, {
      onDeath: (e) => this.handleEnemyDeath(e),
      onAoeWarning: (x, y, radius, lifetime, damage) => this.spawnAoeIndicator(x, y, radius, lifetime, damage),
      onSummon: (x, y) => this.spawnEnemy('normal', x, y),
      onAttackPlayer: (damage) => this.handlePlayerDamage(damage)
    });
    this.enemies.push(enemy);
  }

  private spawnProjectile(x: number, y: number, angle: number, damage: number, type: 'arrow' | 'magic'): void {
    const speed = type === 'arrow' ? 600 : 450;
    this.projectiles.push({
      id: ++this.projectileIdCounter,
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      damage,
      type,
      lifetime: 2,
      fromPlayer: true
    });
  }

  private spawnDamageNumber(x: number, y: number, value: number): void {
    const angle = Math.random() * Math.PI * 2;
    const speed = 20 + Math.random() * 30;
    this.damageNumbers.push({
      id: ++this.damageIdCounter,
      x, y, value,
      age: 0,
      lifetime: 0.9,
      vx: Math.cos(angle) * speed,
      vy: -40 - Math.random() * 20,
      scale: 1
    });
  }

  private spawnHealParticles(x: number, y: number, _amount: number): void {
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI * 2 * i) / 10;
      const speed = 80 + Math.random() * 40;
      this.particles.push({
        id: ++this.particleIdCounter,
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        age: 0,
        lifetime: 0.8,
        size: 3 + Math.random() * 3,
        color: '#40ff80'
      });
    }
  }

  private spawnDeathParticles(x: number, y: number, color: string): void {
    const count = 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 120;
      this.particles.push({
        id: ++this.particleIdCounter,
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 20,
        age: 0,
        lifetime: 0.6 + Math.random() * 0.4,
        size: 2 + Math.random() * 4,
        color
      });
    }
  }

  private spawnAoeIndicator(x: number, y: number, radius: number, lifetime: number, damage: number): void {
    this.aoeIndicators.push({ x, y, radius, age: 0, lifetime, damage });
  }

  private spawnManaCrystal(x: number, y: number): void {
    this.manaCrystals.push({
      id: ++this.crystalIdCounter,
      x, y,
      manaAmount: 20 + Math.floor(Math.random() * 15),
      age: 0
    });
  }

  private handleMeleeAttack(ax: number, ay: number, range: number, damage: number, angle: number): void {
    for (const enemy of this.enemies) {
      if (enemy.checkMeleeHit(ax, ay, range, angle)) {
        const dead = enemy.takeDamage(damage);
        this.spawnDamageNumber(enemy.state.position.x, enemy.state.position.y - enemy.state.size / 2, damage);
        if (dead) this.spawnDeathParticles(enemy.state.position.x, enemy.state.position.y, enemy.state.color);
      }
    }
  }

  private handleEnemyDeath(enemy: Enemy): void {
    const idx = this.enemies.indexOf(enemy);
    if (idx >= 0) this.enemies.splice(idx, 1);
    if (Math.random() < 0.4 || enemy.state.type === 'elite' || enemy.state.type === 'boss') {
      this.spawnManaCrystal(enemy.state.position.x, enemy.state.position.y);
    }
    if (enemy.state.type === 'boss') this.bossSpawned = false;
  }

  private handlePlayerDamage(damage: number): void {
    this.player.takeDamage(damage);
    this.hudDirty = true;
    this.spawnDamageNumber(
      this.player.state.position.x,
      this.player.state.position.y - 20,
      damage
    );
    this.spawnDeathParticles(this.player.state.position.x, this.player.state.position.y, '#ff4040');
  }

  private update(dt: number): void {
    const now = performance.now();
    const { canvasW, canvasH } = this.state;

    this.player.update(dt, canvasW, canvasH);

    for (const enemy of this.enemies) {
      enemy.update(dt, this.player.state.position, this.player.getSize(), now, canvasW, canvasH);
    }

    this.spawnTimer += dt;
    if (this.spawnTimer > 5) {
      this.spawnTimer = 0;
      if (this.enemies.length < 12) {
        const edge = Math.floor(Math.random() * 4);
        let x = 0, y = 0;
        if (edge === 0) { x = Math.random() * canvasW; y = 30; }
        else if (edge === 1) { x = Math.random() * canvasW; y = canvasH - 30; }
        else if (edge === 2) { x = 30; y = Math.random() * canvasH; }
        else { x = canvasW - 30; y = Math.random() * canvasH; }
        const type: EnemyType = Math.random() < 0.8 ? 'normal' : 'elite';
        this.spawnEnemy(type, x, y);
      }
    }

    const elapsed = now / 1000;
    if (!this.bossSpawned && elapsed > 30 && this.enemies.filter(e => e.state.type === 'boss').length === 0) {
      this.bossSpawned = true;
      this.spawnEnemy('boss', canvasW / 2, 80);
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.lifetime -= dt;
      let hit = false;
      if (p.fromPlayer) {
        for (const enemy of this.enemies) {
          const pr = p.type === 'magic' ? 8 : 4;
          if (enemy.checkProjectileHit(p.x, p.y, pr)) {
            const dead = enemy.takeDamage(p.damage);
            this.spawnDamageNumber(enemy.state.position.x, enemy.state.position.y - enemy.state.size / 2, p.damage);
            if (dead) this.spawnDeathParticles(enemy.state.position.x, enemy.state.position.y, enemy.state.color);
            hit = true;
            break;
          }
        }
      }
      if (hit || p.lifetime <= 0 || p.x < -50 || p.x > canvasW + 50 || p.y < -50 || p.y > canvasH + 50) {
        this.projectiles.splice(i, 1);
      }
    }

    for (let i = this.aoeIndicators.length - 1; i >= 0; i--) {
      const aoe = this.aoeIndicators[i];
      aoe.age += dt;
      if (aoe.age >= aoe.lifetime) {
        const dx = this.player.state.position.x - aoe.x;
        const dy = this.player.state.position.y - aoe.y;
        if (Math.sqrt(dx * dx + dy * dy) <= aoe.radius) {
          this.handlePlayerDamage(aoe.damage);
        }
        this.aoeIndicators.splice(i, 1);
      }
    }

    for (let i = this.manaCrystals.length - 1; i >= 0; i--) {
      const c = this.manaCrystals[i];
      c.age += dt;
      const dx = this.player.state.position.x - c.x;
      const dy = this.player.state.position.y - c.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < this.player.getSize() + 10) {
        this.player.restoreMana(c.manaAmount);
        this.hudDirty = true;
        this.manaCrystals.splice(i, 1);
        this.spawnHealParticles(c.x, c.y, c.manaAmount);
      } else if (c.age > 15) {
        this.manaCrystals.splice(i, 1);
      }
    }

    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      this.damageNumbers[i].age += dt;
      if (this.damageNumbers[i].age >= this.damageNumbers[i].lifetime) {
        this.damageNumbers.splice(i, 1);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 200 * dt;
      if (p.age >= p.lifetime) {
        this.particles.splice(i, 1);
      }
    }

    if (this.hud.needsRender(this.player.state)) this.hudDirty = true;

    if (this.player.state.health <= 0) {
      this.player.state.health = this.player.state.maxHealth;
      this.player.state.mana = this.player.state.maxMana;
      this.player.state.stamina = this.player.state.maxStamina;
      this.player.state.position = { x: canvasW / 2, y: canvasH / 2 };
      this.enemies = [];
      this.bossSpawned = false;
      this.spawnInitialEnemies();
      this.hudDirty = true;
    }
  }

  private renderBackground(): void {
    const { canvasW, canvasH } = this.state;
    const ctx = this.ctx;

    const grad = ctx.createRadialGradient(canvasW / 2, canvasH / 2, 0, canvasW / 2, canvasH / 2, canvasW / 1.5);
    grad.addColorStop(0, '#1a0a2e');
    grad.addColorStop(1, '#0a0514');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvasW, canvasH);

    ctx.strokeStyle = 'rgba(63, 255, 127, 0.05)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < canvasW; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasH);
      ctx.stroke();
    }
    for (let y = 0; y < canvasH; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasW, y);
      ctx.stroke();
    }
  }

  private render(): void {
    const { canvasW, canvasH } = this.state;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, canvasW, canvasH);
    this.renderBackground();

    for (const crystal of this.manaCrystals) {
      ctx.save();
      ctx.translate(crystal.x, crystal.y);
      ctx.rotate(crystal.age * 2);
      const pulse = 1 + Math.sin(crystal.age * 4) * 0.15;
      ctx.fillStyle = 'rgba(100, 150, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(0, 0, 14 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#6080ff';
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(7, 0);
      ctx.lineTo(0, 9);
      ctx.lineTo(-7, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#a0c0ff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    for (const aoe of this.aoeIndicators) {
      const t = aoe.age / aoe.lifetime;
      const blink = Math.sin(t * Math.PI * 8) * 0.5 + 0.5;
      ctx.strokeStyle = `rgba(255, ${Math.floor(60 + blink * 40)}, 60, ${0.5 + blink * 0.5})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(aoe.x, aoe.y, aoe.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = `rgba(255, 60, 60, ${0.08 + blink * 0.12})`;
      ctx.fill();
    }

    for (const p of this.projectiles) {
      ctx.save();
      if (p.type === 'arrow') {
        const angle = Math.atan2(p.vy, p.vx);
        ctx.translate(p.x, p.y);
        ctx.rotate(angle);
        ctx.fillStyle = '#ddd';
        ctx.fillRect(-10, -1.5, 18, 3);
        ctx.fillStyle = '#aaa';
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(2, -4);
        ctx.lineTo(2, 4);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = 'rgba(255, 102, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff66ff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    for (const enemy of this.enemies) {
      enemy.render(ctx);
    }

    this.player.render(ctx);

    for (const p of this.particles) {
      const alpha = 1 - p.age / p.lifetime;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    if (this.hudDirty) {
      this.hud.render(this.player.state, true);
      this.hudDirty = false;
    } else {
      this.hud.render(this.player.state, false);
    }

    this.hud.renderDamageNumbers(this.damageNumbers);
  }

  private loop(timestamp: number): void {
    const dt = Math.min(0.05, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;

    this.update(dt);
    this.render();

    requestAnimationFrame(this.loop.bind(this));
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
