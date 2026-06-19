import { Ship, Asteroid, Bullet, Ore, Particle, OreColor, ASTEROID_CONFIG } from './entities';
import { Renderer, CANVAS_W, CANVAS_H, HUDState, BlackHoleState } from './renderer';
import { SoundManager } from './audio';

export type GameState = 'menu' | 'playing' | 'gameover';

export interface UpgradeEvent {
  active: boolean;
  text: string;
  timer: number;
  maxTimer: number;
}

export class GameEngine {
  state: GameState = 'menu';
  ship: Ship;
  asteroids: Asteroid[] = [];
  bullets: Bullet[] = [];
  ores: Ore[] = [];
  particles: Particle[] = [];

  keys: Set<string> = new Set();
  mouseX: number = CANVAS_W / 2;
  mouseY: number = CANVAS_H / 2;

  score: number = 0;
  displayScore: number = 0;
  shieldLevel: number = 1;
  weaponLevel: number = 1;

  private _asteroidTimer: number = 0;
  private _asteroidInterval: number = 120;
  private _maxAsteroids: number = 8;

  private _blackHoleTimer: number = 0;
  private _blackHoleInterval: number = 1800;
  blackHole: BlackHoleState = { active: false, phase: 0, progress: 0, x: 0, y: 0 };
  private _blackScreenTimer: number = 0;
  private _blackScreenDuration: number = 48;

  upgradeEvent: UpgradeEvent = { active: false, text: '', timer: 0, maxTimer: 30 };

  private _damageFlash: { active: boolean; timer: number; maxTimer: number } = { active: false, timer: 0, maxTimer: 20 };

  private renderer: Renderer;
  private canvas: HTMLCanvasElement;

  private _onGameOver: (() => void) | null = null;
  private _scoreThreshold: number = 0;
  sound: SoundManager;
  private _prevBlackHolePhase: number = -1;

  constructor(canvas: HTMLCanvasElement, vortexCanvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas, vortexCanvas);
    this.ship = new Ship(CANVAS_W / 2, CANVAS_H / 2);
    this.sound = new SoundManager();
  }

  toggleMute(): boolean {
    return this.sound.toggleMute();
  }

  get muted(): boolean {
    return this.sound.muted;
  }

  onGameOver(callback: () => void): void {
    this._onGameOver = callback;
  }

  reset(): void {
    this.ship = new Ship(CANVAS_W / 2, CANVAS_H / 2);
    this.asteroids = [];
    this.bullets = [];
    this.ores = [];
    this.particles = [];
    this.score = 0;
    this.displayScore = 0;
    this.shieldLevel = 1;
    this.weaponLevel = 1;
    this.ship.shield = 1;
    this.ship.shieldMax = 1;
    this.ship.weaponLevel = 1;
    this._asteroidTimer = 60;
    this._blackHoleTimer = 0;
    this.blackHole = { active: false, phase: 0, progress: 0, x: 0, y: 0 };
    this._blackScreenTimer = 0;
    this.upgradeEvent = { active: false, text: '', timer: 0, maxTimer: 30 };
    this._damageFlash = { active: false, timer: 0, maxTimer: 20 };
    this._scoreThreshold = 0;
    this._prevBlackHolePhase = -1;
    this.state = 'playing';
  }

  setMouse(x: number, y: number): void {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = (x - rect.left) * (CANVAS_W / rect.width);
    this.mouseY = (y - rect.top) * (CANVAS_H / rect.height);
  }

  fireBullet(): void {
    if (this.state !== 'playing') return;
    if (this.blackHole.active && (this.blackHole.phase === 1 || this.blackHole.phase === 2)) return;

    const lvl = this.weaponLevel;
    const damage = lvl >= 4 ? 2 : 1;

    if (lvl === 1) {
      this.bullets.push(new Bullet(this.ship.x, this.ship.y, this.mouseX, this.mouseY, damage));
    } else if (lvl === 2) {
      const angle = Math.atan2(this.mouseY - this.ship.y, this.mouseX - this.ship.x);
      const spread = 0.12;
      for (const off of [-spread, spread]) {
        const a = angle + off;
        const tx = this.ship.x + Math.cos(a) * 100;
        const ty = this.ship.y + Math.sin(a) * 100;
        this.bullets.push(new Bullet(this.ship.x, this.ship.y, tx, ty, damage));
      }
    } else if (lvl === 3) {
      const angle = Math.atan2(this.mouseY - this.ship.y, this.mouseX - this.ship.x);
      const spread = 0.15;
      for (const off of [-spread, 0, spread]) {
        const a = angle + off;
        const tx = this.ship.x + Math.cos(a) * 100;
        const ty = this.ship.y + Math.sin(a) * 100;
        this.bullets.push(new Bullet(this.ship.x, this.ship.y, tx, ty, damage));
      }
    } else if (lvl >= 4) {
      const angle = Math.atan2(this.mouseY - this.ship.y, this.mouseX - this.ship.x);
      const spread = 0.2;
      const offsets = lvl >= 5 ? [-spread, -spread * 0.5, 0, spread * 0.5, spread] : [-spread, -spread * 0.6, 0.08, spread];
      for (const off of offsets) {
        const a = angle + off;
        const tx = this.ship.x + Math.cos(a) * 100;
        const ty = this.ship.y + Math.sin(a) * 100;
        this.bullets.push(new Bullet(this.ship.x, this.ship.y, tx, ty, damage));
      }
    }

    for (let i = 0; i < 4; i++) {
      const angle = Math.random() * Math.PI * 2;
      this.particles.push(new Particle(
        this.ship.x, this.ship.y,
        Math.cos(angle) * 2, Math.sin(angle) * 2,
        '#00ccff', 3, 12
      ));
    }

    this.sound.playLaser();
  }

  tryCollectOre(): void {
    if (this.state !== 'playing') return;
    for (const ore of this.ores) {
      if (!ore.collected && ore.onGround && ore.isNearShip(this.ship)) {
        ore.startCollect();
        const val = ore.getValue();
        this.score += val;
        this._checkUpgrades();

        for (let i = 0; i < 8; i++) {
          const angle = Math.random() * Math.PI * 2;
          this.particles.push(new Particle(
            ore.x, ore.y,
            Math.cos(angle) * 2,
            Math.sin(angle) * 2 - 1,
            this._getOreColorHex(ore.color),
            3, 25, 0.05
          ));
        }
        this.sound.playCollect();
        break;
      }
    }
  }

  private _getOreColorHex(c: OreColor): string {
    switch (c) {
      case 'cyan': return '#00ccff';
      case 'purple': return '#cc66ff';
      case 'gold': return '#ffdd33';
      case 'green': return '#66ff66';
      case 'pink': return '#ff66aa';
    }
  }

  private _checkUpgrades(): void {
    while (this.score >= (this.shieldLevel) * 100 && this.shieldLevel < 5) {
      this.shieldLevel++;
      this.ship.shieldMax = this.shieldLevel;
      this.ship.shield = Math.min(this.ship.shield + 2, this.shieldLevel);
      this._triggerUpgrade(`护盾升级 LV.${this.shieldLevel}`);
    }

    while (this.score >= (this.weaponLevel) * 200 && this.weaponLevel < 5) {
      this.weaponLevel++;
      this.ship.weaponLevel = this.weaponLevel;
      this._triggerUpgrade(`武器升级 LV.${this.weaponLevel}`);
    }
  }

  private _triggerUpgrade(text: string): void {
    this.upgradeEvent = { active: true, text, timer: 0, maxTimer: 30 };

    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      const colors = ['#ffdd33', '#ffee88', '#ffaa33', '#ffffff'];
      this.particles.push(new Particle(
        CANVAS_W / 2, CANVAS_H / 2,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        colors[Math.floor(Math.random() * colors.length)],
        3 + Math.random() * 3,
        25 + Math.random() * 15
      ));
    }
    this.sound.playUpgrade();
  }

  private _spawnAsteroid(): void {
    if (this.asteroids.length >= this._maxAsteroids) return;

    const roll = Math.random();
    let size: 'large' | 'medium' | 'small';
    if (roll < 0.28) size = 'large';
    else if (roll < 0.65) size = 'medium';
    else size = 'small';

    this.asteroids.push(new Asteroid(size));
  }

  private _triggerBlackHole(): void {
    this.blackHole = {
      active: true,
      phase: 0,
      progress: 0,
      x: 120 + Math.random() * (CANVAS_W - 240),
      y: 120 + Math.random() * (CANVAS_H - 240)
    };
  }

  private _updateBlackHole(): void {
    const prevPhase = this.blackHole.active ? this.blackHole.phase : -1;

    if (!this.blackHole.active) {
      this._prevBlackHolePhase = -1;
      return;
    }

    const p0Dur = 90;
    const p1Dur = 70;

    if (this.blackHole.phase === 0) {
      this.blackHole.progress += 1 / p0Dur;
      if (this.blackHole.progress >= 1) {
        this.blackHole.progress = 0;
        this.blackHole.phase = 1;
      }
    } else if (this.blackHole.phase === 1) {
      this.blackHole.progress += 1 / p1Dur;

      const pullStrength = 0.5 + this.blackHole.progress * 1.2;
      const dx = this.blackHole.x - this.ship.x;
      const dy = this.blackHole.y - this.ship.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 1) {
        this.ship.x += (dx / dist) * pullStrength;
        this.ship.y += (dy / dist) * pullStrength;
      }

      if (dist < 30 || this.blackHole.progress >= 1) {
        this.blackHole.phase = 2;
        this.blackHole.progress = 0;
        this._blackScreenTimer = this._blackScreenDuration;
      }
    } else if (this.blackHole.phase === 2) {
      if (this._blackScreenTimer > 0) {
        this._blackScreenTimer--;
        if (this._blackScreenTimer === Math.floor(this._blackScreenDuration / 2)) {
          this.ship.x = 80 + Math.random() * (CANVAS_W - 160);
          this.ship.y = 80 + Math.random() * (CANVAS_H - 160);
          this.ship.vx = 0;
          this.ship.vy = 0;
          this.ship.invincibleTime = 120;
          this.asteroids = [];
          this.bullets = [];
          this._asteroidTimer = 60;

          for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 4;
            const colors = ['#cc66ff', '#aa44dd', '#8822bb', '#ffffff'];
            this.particles.push(new Particle(
              this.ship.x, this.ship.y,
              Math.cos(angle) * speed,
              Math.sin(angle) * speed,
              colors[Math.floor(Math.random() * colors.length)],
              2 + Math.random() * 2,
              30 + Math.random() * 20
            ));
          }
        }
      } else {
        this.blackHole.active = false;
      }
    }

    if (prevPhase === 1 && this.blackHole.phase === 2) {
      this.sound.playBlackHole();
    }

    this._prevBlackHolePhase = this.blackHole.active ? this.blackHole.phase : -1;
  }

  private _collideBulletAsteroid(bullet: Bullet, asteroid: Asteroid): boolean {
    const dx = bullet.x - asteroid.x;
    const dy = bullet.y - asteroid.y;
    const r = asteroid.radius + bullet.radius;
    return (dx * dx + dy * dy) < r * r;
  }

  private _collideShipAsteroid(ship: Ship, asteroid: Asteroid): boolean {
    const dx = ship.x - asteroid.x;
    const dy = ship.y - asteroid.y;
    const r = asteroid.radius + 14;
    return (dx * dx + dy * dy) < r * r;
  }

  private _explodeAsteroid(asteroid: Asteroid): void {
    const cfg = ASTEROID_CONFIG[asteroid.size];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.3;
      const speed = 1.5 + Math.random() * 3;
      this.particles.push(new Particle(
        asteroid.x + Math.cos(angle) * asteroid.radius * 0.3,
        asteroid.y + Math.sin(angle) * asteroid.radius * 0.3,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        cfg.color,
        6 + Math.random() * 4,
        24
      ));
    }

    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      this.particles.push(new Particle(
        asteroid.x, asteroid.y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        cfg.accent,
        4, 30
      ));
    }

    for (const c of asteroid.oreDrops) {
      this.ores.push(new Ore(
        asteroid.x + (Math.random() - 0.5) * asteroid.radius,
        asteroid.y + (Math.random() - 0.5) * asteroid.radius,
        c
      ));
    }
  }

  private _triggerDamageFlash(): void {
    this._damageFlash = { active: true, timer: this._damageFlash.maxTimer, maxTimer: this._damageFlash.maxTimer };
  }

  getDamageFlashAlpha(): number {
    if (!this._damageFlash.active) return 0;
    const t = this._damageFlash.timer / this._damageFlash.maxTimer;
    return t * 0.5;
  }

  getBlackScreenAlpha(): number {
    if (this.blackHole.phase !== 2 || this._blackScreenTimer <= 0) {
      if (this._blackScreenTimer <= 0 && this.blackHole.phase === 2) return 0;
      return 0;
    }
    const mid = this._blackScreenDuration / 2;
    const t = this._blackScreenTimer;
    if (t > mid) {
      return (this._blackScreenDuration - t) / mid;
    } else {
      return t / mid;
    }
  }

  getUpgradePopup(): { text: string; alpha: number; scale: number } | null {
    if (!this.upgradeEvent.active) return null;
    const t = this.upgradeEvent.timer / this.upgradeEvent.maxTimer;
    const alpha = Math.sin(t * Math.PI);
    const scale = 1 + Math.sin(t * Math.PI) * 0.15;
    return { text: this.upgradeEvent.text, alpha, scale };
  }

  update(): void {
    if (this.state !== 'playing') return;

    this.renderer.updateStars();

    if (this.displayScore < this.score) {
      const diff = this.score - this.displayScore;
      this.displayScore += Math.max(1, Math.ceil(diff * 0.08));
      if (this.displayScore > this.score) this.displayScore = this.score;
    }

    if (this.upgradeEvent.active) {
      this.upgradeEvent.timer++;
      if (this.upgradeEvent.timer >= this.upgradeEvent.maxTimer) {
        this.upgradeEvent.active = false;
      }
    }

    if (this._damageFlash.active) {
      this._damageFlash.timer--;
      if (this._damageFlash.timer <= 0) {
        this._damageFlash.active = false;
      }
    }

    this._asteroidTimer++;
    if (this._asteroidTimer >= this._asteroidInterval) {
      this._asteroidTimer = 0;
      this._spawnAsteroid();
    }

    this._blackHoleTimer++;
    if (this._blackHoleTimer >= this._blackHoleInterval && !this.blackHole.active) {
      this._blackHoleTimer = 0;
      this._triggerBlackHole();
    }

    this._updateBlackHole();

    this.ship.update(this.keys);

    for (const b of this.bullets) b.update();
    this.bullets = this.bullets.filter(b => b.alive);

    for (const a of this.asteroids) a.update();
    this.asteroids = this.asteroids.filter(a => a.alive);

    for (const o of this.ores) o.update();
    this.ores = this.ores.filter(o => o.alive);

    for (const p of this.particles) p.update();
    this.particles = this.particles.filter(p => p.alive);

    if (this.particles.length > 600) {
      this.particles.splice(0, this.particles.length - 600);
    }

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      if (!bullet.alive) continue;

      for (let j = this.asteroids.length - 1; j >= 0; j--) {
        const asteroid = this.asteroids[j];
        if (!asteroid.alive) continue;

        if (this._collideBulletAsteroid(bullet, asteroid)) {
          bullet.alive = false;
          this._triggerDamageFlash();

          for (let k = 0; k < 3; k++) {
            const angle = Math.random() * Math.PI * 2;
            this.particles.push(new Particle(
              bullet.x, bullet.y,
              Math.cos(angle) * 1.5, Math.sin(angle) * 1.5,
              '#ffffaa', 2, 10
            ));
          }

          this.sound.playHit();
          if (asteroid.hit(bullet.damage)) {
            asteroid.alive = false;
            this._explodeAsteroid(asteroid);

            const splits = asteroid.split();
            for (const s of splits) {
              this.asteroids.push(s);
            }
          }
          break;
        }
      }
    }

    for (const asteroid of this.asteroids) {
      if (!asteroid.alive) continue;
      if (this._collideShipAsteroid(this.ship, asteroid)) {
        const isDead = this.ship.takeDamage();
        this._triggerDamageFlash();

        const pushAngle = Math.atan2(this.ship.y - asteroid.y, this.ship.x - asteroid.x);
        this.ship.x += Math.cos(pushAngle) * 20;
        this.ship.y += Math.sin(pushAngle) * 20;

        for (let i = 0; i < 15; i++) {
          const angle = Math.random() * Math.PI * 2;
          this.particles.push(new Particle(
            this.ship.x, this.ship.y,
            Math.cos(angle) * 3,
            Math.sin(angle) * 3,
            i % 2 === 0 ? '#ff5555' : '#ffaa33',
            3 + Math.random() * 2,
            30
          ));
        }

        if (isDead) {
          this.state = 'gameover';
          if (this._onGameOver) this._onGameOver();
          return;
        }
      }
    }

    this.bullets = this.bullets.filter(b => b.alive);
    this.asteroids = this.asteroids.filter(a => a.alive);
  }

  render(): void {
    this.renderer.clear();
    this.renderer.drawBackground();

    for (const a of this.asteroids) this.renderer.drawAsteroid(a);
    for (const o of this.ores) this.renderer.drawOre(o);
    for (const b of this.bullets) this.renderer.drawBullet(b);

    if (this.state === 'playing') {
      this.renderer.drawShip(this.ship);
    }

    for (const p of this.particles) this.renderer.drawParticle(p);

    if (this.state === 'playing') {
      this.renderer.drawCollectPrompt(this.ship, this.ores);
    }

    const hudState: HUDState = {
      score: this.score,
      displayScore: this.displayScore,
      shieldLevel: this.shieldLevel,
      shieldMax: 5,
      weaponLevel: this.weaponLevel,
      muted: this.sound.muted
    };
    this.renderer.drawHUD(hudState);

    this.renderer.drawBlackHole(this.blackHole);

    const popup = this.getUpgradePopup();
    if (popup) {
      this.renderer.drawUpgradePopup(popup.text, popup.alpha, popup.scale);
    }
  }
}
