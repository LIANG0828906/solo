import { FormationMode, Bullet, Vec2, randRange } from './types';
import { Player } from './player';
import { Meteor, MAX_METEORS } from './enemy';
import { Ally, findSharedTarget } from './ally';
import { ParticleSystem } from './particle';
import { Renderer } from './renderer';

class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number = window.innerWidth;
  height: number = window.innerHeight;

  player: Player;
  allies: Ally[] = [];
  meteors: Meteor[] = [];
  bullets: Bullet[] = [];
  particles: ParticleSystem;
  renderer: Renderer;

  mode: FormationMode = 'follow';
  formationRotation: number = 0;
  modePulseTime: number = 0;

  meteorSpawnTimer: number = 0;
  meteorSpawnInterval: number = 5;

  lastTime: number = 0;
  running: boolean = true;

  constructor() {
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (!canvas) throw new Error('Canvas not found');
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.resize();

    this.player = new Player(this.width / 2, this.height / 2);
    for (let i = 0; i < 4; i++) {
      this.allies.push(new Ally(i, this.player));
    }

    this.particles = new ParticleSystem();
    this.renderer = new Renderer(this.ctx, this.canvas);

    this.bindEvents();
    this.scheduleNextMeteor();
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }

  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  bindEvents(): void {
    window.addEventListener('resize', () => {
      this.resize();
      this.renderer.initStars();
    });

    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      this.player.keys.add(k);
      if (k === '1') this.setMode('defense');
      else if (k === '2') this.setMode('attack');
      else if (k === '3') this.setMode('follow');
      else if (k === 'q') this.rotateFormation(-Math.PI / 4);
      else if (k === 'e') this.rotateFormation(Math.PI / 4);
    });

    window.addEventListener('keyup', (e) => {
      this.player.keys.delete(e.key.toLowerCase());
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.player.mouse.x = e.clientX - rect.left;
      this.player.mouse.y = e.clientY - rect.top;
    });

    this.canvas.addEventListener('mousedown', () => {
      this.player.mouseDown = true;
    });

    this.canvas.addEventListener('mouseup', () => {
      this.player.mouseDown = false;
    });

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  setMode(m: FormationMode): void {
    if (this.mode === m) return;
    this.mode = m;
    this.modePulseTime = 0;
    for (const a of this.allies) a.triggerModeAura(m);
  }

  rotateFormation(delta: number): void {
    this.formationRotation += delta;
    const positions = Ally.getFormationPositions(this.formationRotation);
    for (let i = 0; i < this.allies.length; i++) {
      this.allies[i].setTargetFormation(positions[i]);
    }
  }

  scheduleNextMeteor(): void {
    this.meteorSpawnInterval = randRange(5, 8);
    this.meteorSpawnTimer = 0;
  }

  update(dt: number): void {
    this.player.update(dt, this.width, this.height, this.bullets, this.particles);

    const sharedTarget = this.mode === 'attack' ? findSharedTarget(this.player, this.meteors) : null;

    for (const ally of this.allies) {
      ally.update(
        dt,
        this.mode,
        this.player,
        this.meteors,
        this.bullets,
        this.particles,
        this.width,
        this.height,
        sharedTarget
      );
    }

    for (const m of this.meteors) m.update(dt);
    this.meteors = this.meteors.filter(m => m.alive && !m.isOffScreen(this.width, this.height));

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx * dt * 60;
      b.y += b.vy * dt * 60;
      b.life -= dt;
      if (b.life <= 0 || b.x < -20 || b.x > this.width + 20 || b.y < -20 || b.y > this.height + 20) {
        this.bullets.splice(i, 1);
        continue;
      }

      for (const m of this.meteors) {
        if (m.checkBullet(b)) {
          this.bullets.splice(i, 1);
          if (m.takeDamage(1)) {
            m.alive = false;
            this.particles.spawnExplosion(m.x, m.y, 20);
            this.player.score += Math.round(m.maxHealth * 10);
          }
          break;
        }
      }
    }

    for (const m of this.meteors) {
      if (!m.alive) continue;
      if (this.player.checkCollision(m)) {
        if (this.player.takeDamage(10, this.particles)) {
          this.running = false;
        }
        if (!this.player.invulnerable) {
          m.alive = false;
          this.particles.spawnExplosion(m.x, m.y, 15);
        }
      }
      for (const ally of this.allies) {
        if (!m.alive) break;
        if (ally.checkCollision(m)) {
          this.particles.spawnExplosion(m.x, m.y, 10);
          if (this.player.takeDamage(10, this.particles)) {
            this.running = false;
          }
          m.alive = false;
        }
      }
    }

    this.meteors = this.meteors.filter(m => m.alive);

    this.particles.update(dt);

    this.meteorSpawnTimer += dt;
    if (this.meteorSpawnTimer >= this.meteorSpawnInterval) {
      if (this.meteors.length < MAX_METEORS) {
        this.meteors.push(Meteor.spawnRandom(this.width, this.height));
      }
      this.scheduleNextMeteor();
    }

    this.modePulseTime += dt;
  }

  loop(now: number): void {
    if (!this.running) {
      this.renderGameOver();
      return;
    }
    const dt = Math.min((now - this.lastTime) / 1000, 1 / 30);
    this.lastTime = now;

    this.update(dt);
    this.renderer.drawAll(
      dt,
      this.player,
      this.allies,
      this.meteors,
      this.bullets,
      this.particles,
      this.mode,
      this.modePulseTime
    );

    requestAnimationFrame(this.loop.bind(this));
  }

  renderGameOver(): void {
    this.ctx.fillStyle = 'rgba(0,0,0,0.75)';
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.fillStyle = '#ff6060';
    this.ctx.font = 'bold 64px Segoe UI, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('游戏结束', this.width / 2, this.height / 2 - 20);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 28px Segoe UI, sans-serif';
    this.ctx.fillText(`最终分数: ${this.player.score}`, this.width / 2, this.height / 2 + 30);
    this.ctx.font = '18px Segoe UI, sans-serif';
    this.ctx.fillStyle = '#aaaacc';
    this.ctx.fillText('刷新页面重新开始', this.width / 2, this.height / 2 + 70);
    this.ctx.textAlign = 'left';
  }
}

window.addEventListener('load', () => {
  new Game();
});
