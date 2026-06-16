import { Level, type Anchor, type EnergyBall } from './level';
import { Player } from './player';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  active: boolean;
}

export class Game {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  level: Level;
  player: Player;
  cameraX: number;
  cameraY: number;
  scale: number;
  viewW: number;
  viewH: number;
  collected: number;
  requiredToOpen: number;
  progressAnim: number;
  targetProgress: number;
  gameOver: boolean;
  gameOverFade: number;
  victory: boolean;
  victoryFade: number;
  time: number;

  particlePool: Particle[];
  particlePoolSize: number;
  audioCtx: AudioContext | null;

  mouseX: number;
  mouseY: number;
  mouseDown: boolean;
  keys: Set<string>;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D not supported');
    this.ctx = ctx;

    this.level = new Level();
    this.player = new Player(100, 700);
    this.cameraX = 0;
    this.cameraY = 0;
    this.scale = 1;
    this.viewW = 0;
    this.viewH = 0;
    this.collected = 0;
    this.requiredToOpen = 20;
    this.progressAnim = 0;
    this.targetProgress = 0;
    this.gameOver = false;
    this.gameOverFade = 0;
    this.victory = false;
    this.victoryFade = 0;
    this.time = 0;

    this.particlePoolSize = 400;
    this.particlePool = [];
    for (let i = 0; i < this.particlePoolSize; i++) {
      this.particlePool.push({ x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1, size: 3, color: '#fff', active: false });
    }

    this.audioCtx = null;
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseDown = false;
    this.keys = new Set();

    this.setupInput();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.viewW = window.innerWidth;
    this.viewH = window.innerHeight;
    this.scale = Math.min(this.viewW / 1600, this.viewH / 900);
  }

  getWorldMouseX(): number {
    return this.mouseX / this.scale + this.cameraX;
  }

  getWorldMouseY(): number {
    return this.mouseY / this.scale + this.cameraY;
  }

  setupInput(): void {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
    });

    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.mouseDown = true;
        if (this.gameOver || this.victory) {
          this.restart();
          return;
        }
        this.player.fireGrapple(this.getWorldMouseX(), this.getWorldMouseY());
      }
    });

    this.canvas.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.mouseDown = false;
        if (this.player.grappleState === 'swinging') {
          this.player.releaseGrapple();
        }
      }
    });

    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      if (e.code === 'Space') {
        e.preventDefault();
        if (!this.gameOver && !this.victory) {
          this.player.flipGravity();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });
  }

  spawnParticles(x: number, y: number, count: number, color: string, speed: number, life: number): void {
    let spawned = 0;
    for (let i = 0; i < this.particlePoolSize && spawned < count; i++) {
      const p = this.particlePool[i];
      if (!p.active) {
        const a = Math.random() * Math.PI * 2;
        const s = Math.random() * speed;
        p.x = x;
        p.y = y;
        p.vx = Math.cos(a) * s;
        p.vy = Math.sin(a) * s;
        p.life = life;
        p.maxLife = life;
        p.size = 2 + Math.random() * 3;
        p.color = color;
        p.active = true;
        spawned++;
      }
    }
  }

  updateParticles(dt: number): void {
    const camLeft = this.cameraX - 50;
    const camRight = this.cameraX + this.viewW / this.scale + 50;
    const camTop = this.cameraY - 50;
    const camBottom = this.cameraY + this.viewH / this.scale + 50;
    for (let i = 0; i < this.particlePoolSize; i++) {
      const p = this.particlePool[i];
      if (!p.active) continue;
      if (p.x < camLeft || p.x > camRight || p.y < camTop || p.y > camBottom) {
        p.active = false;
        continue;
      }
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 200 * dt;
      p.vx *= 0.98;
    }
  }

  playCollectSound(): void {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = this.audioCtx;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      const attack = 0.01;
      const decay = 0.05;
      const sustain = 0.05;
      const release = 0.04;
      const sustainLevel = 0.4;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.8, now + attack);
      gain.gain.linearRampToValueAtTime(sustainLevel, now + attack + decay);
      gain.gain.setValueAtTime(sustainLevel, now + attack + decay + sustain);
      gain.gain.linearRampToValueAtTime(0, now + attack + decay + sustain + release);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + attack + decay + sustain + release + 0.02);
    } catch (e) { /* ignore */ }
  }

  onCollectBall(): void {
    this.collected++;
    this.targetProgress = this.collected / this.requiredToOpen;
    this.playCollectSound();
    this.spawnParticles(0, 0, 0, '#FFFF00', 0, 0);
  }

  restart(): void {
    this.level = new Level();
    this.player = new Player(100, 700);
    this.collected = 0;
    this.targetProgress = 0;
    this.progressAnim = 0;
    this.gameOver = false;
    this.gameOverFade = 0;
    this.victory = false;
    this.victoryFade = 0;
    for (const p of this.particlePool) p.active = false;
  }

  update(dt: number): void {
    this.time += dt;
    if (this.gameOver) {
      this.gameOverFade = Math.min(1, this.gameOverFade + dt / 0.5);
      return;
    }
    if (this.victory) {
      this.victoryFade = Math.min(1, this.victoryFade + dt / 0.5);
      return;
    }

    this.level.updateAnchors(dt);
    this.player.update(dt, this.level.platforms, this.level.anchors, this.level.width, this.level.height);

    this.level.updateCheckpoints(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2);

    this.player.checkEnergyBallCollision(this.level.energyBalls, () => {
      this.onCollectBall();
    });

    for (const b of this.level.energyBalls) {
      if (b.collected && b.collectAnim > 0) {
        b.collectAnim = Math.max(0, b.collectAnim - dt);
        if (b.collectAnim > 0 && b.collectAnim > dt) {
          this.spawnParticles(b.x, b.y, 2, '#FFFF00', 80, 0.3);
        }
      }
    }

    this.progressAnim += (this.targetProgress - this.progressAnim) * Math.min(1, dt / 0.3 * 3);

    if (this.collected >= this.requiredToOpen && !this.level.goal.opened) {
      this.level.goal.openProgress = Math.min(1, this.level.goal.openProgress + dt / 1.0);
      if (this.level.goal.openProgress >= 1) this.level.goal.opened = true;
    }

    if (this.level.goal.opened) {
      const g = this.level.goal;
      const px = this.player.x + this.player.w / 2;
      const py = this.player.y + this.player.h / 2;
      if (px > g.x && px < g.x + g.w && py > g.y && py < g.y + g.h) {
        this.victory = true;
      }
    }

    const hitSpike = this.player.checkSpikeCollision(this.level.spikes);
    const outOfBounds = this.player.checkOutOfBounds(this.level.width, this.level.height);
    if (hitSpike || outOfBounds) {
      const cp = this.level.getNearestCheckpoint(this.player.x, this.player.y);
      const dead = this.player.takeDamage(cp);
      if (dead) this.gameOver = true;
      this.spawnParticles(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2, 20, '#FF4444', 150, 0.5);
    }

    this.updateParticles(dt);
    this.updateCamera();
  }

  updateCamera(): void {
    const targetX = this.player.x + this.player.w / 2 - this.viewW / this.scale / 2;
    const targetY = this.player.y + this.player.h / 2 - this.viewH / this.scale / 2;
    this.cameraX += (targetX - this.cameraX) * 0.1;
    this.cameraY += (targetY - this.cameraY) * 0.1;
    this.cameraX = Math.max(0, Math.min(this.level.width - this.viewW / this.scale, this.cameraX));
    this.cameraY = Math.max(0, Math.min(this.level.height - this.viewH / this.scale, this.cameraY));
  }

  render(): void {
    const ctx = this.ctx;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.viewW, this.viewH);

    ctx.save();
    ctx.scale(this.scale, this.scale);
    ctx.translate(-this.cameraX, -this.cameraY);

    this.drawBackground();
    this.drawPlatforms();
    this.drawCheckpoints();
    this.drawSpikes();
    this.drawAnchors();
    this.drawEnergyBalls();
    this.drawGoal();
    this.drawGrapple();
    this.drawPlayer();
    this.drawParticles();

    ctx.restore();
    this.drawHUD();
    this.drawGameOver();
    this.drawVictory();
  }

  drawBackground(): void {
    const ctx = this.ctx;
    const grad = ctx.createLinearGradient(0, 0, 0, this.level.height);
    grad.addColorStop(0, '#0D0221');
    grad.addColorStop(1, '#1B0A2E');
    ctx.fillStyle = grad;
    ctx.fillRect(this.cameraX - 100, this.cameraY - 100, this.viewW / this.scale + 200, this.viewH / this.scale + 200);

    const parallax = this.cameraX * 0.3;
    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00F0FF';
    ctx.shadowBlur = 8;
    for (let i = 0; i < 20; i++) {
      const bx = i * 250 - (parallax % 250);
      const bh = 150 + (i * 37) % 200;
      ctx.strokeRect(bx, this.level.height - bh - 80, 120, bh);
    }
    ctx.strokeStyle = '#FF00FF';
    ctx.shadowColor = '#FF00FF';
    const parallax2 = this.cameraX * 0.5;
    for (let i = 0; i < 15; i++) {
      const bx = i * 320 - (parallax2 % 320) + 80;
      const bh = 100 + (i * 53) % 150;
      ctx.strokeRect(bx, this.level.height - bh - 80, 90, bh);
    }
    ctx.shadowBlur = 0;
  }

  drawPlatforms(): void {
    const ctx = this.ctx;
    for (const p of this.level.platforms) {
      if (p.x + p.w < this.cameraX - 50 || p.x > this.cameraX + this.viewW / this.scale + 50) continue;
      ctx.fillStyle = '#2a2a35';
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeStyle = '#3a3a48';
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      for (let i = 0; i < p.h; i += 4) {
        ctx.fillRect(p.x, p.y + i, p.w, 1);
      }
      for (let i = 0; i < 30; i++) {
        const nx = p.x + ((i * 73) % p.w);
        const ny = p.y + ((i * 37) % p.h);
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(nx, ny, 2, 2);
      }
    }
  }

  drawCheckpoints(): void {
    const ctx = this.ctx;
    for (const cp of this.level.checkpoints) {
      if (cp.x + cp.radius < this.cameraX - 50 || cp.x - cp.radius > this.cameraX + this.viewW / this.scale + 50) continue;
      ctx.save();
      ctx.translate(cp.x, cp.y - cp.height / 2);
      ctx.rotate(this.time * (cp.activated ? 1 : 0.5));
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = cp.activated ? '#00AAFF' : '#555577';
      ctx.shadowColor = cp.activated ? '#00AAFF' : 'transparent';
      ctx.shadowBlur = cp.activated ? 15 : 0;
      ctx.beginPath();
      ctx.ellipse(0, 0, cp.radius, cp.radius * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-cp.radius, -cp.height / 2, cp.radius * 2, cp.height);
      ctx.beginPath();
      ctx.ellipse(0, -cp.height / 2, cp.radius, cp.radius * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.shadowBlur = 0;
    }
  }

  drawSpikes(): void {
    const ctx = this.ctx;
    ctx.fillStyle = '#FF2244';
    ctx.shadowColor = '#FF2244';
    ctx.shadowBlur = 6;
    for (const s of this.level.spikes) {
      if (s.x + s.size < this.cameraX - 50 || s.x - s.size > this.cameraX + this.viewW / this.scale + 50) continue;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y - s.size);
      ctx.lineTo(s.x - s.size / 2, s.y);
      ctx.lineTo(s.x + s.size / 2, s.y);
      ctx.closePath();
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  drawAnchors(): void {
    const ctx = this.ctx;
    for (const a of this.level.anchors) {
      if (a.x + a.radius + 20 < this.cameraX - 50 || a.x - a.radius - 20 > this.cameraX + this.viewW / this.scale + 50) continue;
      ctx.shadowColor = '#FF4444';
      ctx.shadowBlur = 15;
      ctx.fillStyle = a.type === 'moving' ? '#FF8844' : '#FF4444';
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFAAAA';
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  drawEnergyBalls(): void {
    const ctx = this.ctx;
    for (const b of this.level.energyBalls) {
      if (b.x + b.radius + 30 < this.cameraX - 50 || b.x - b.radius - 30 > this.cameraX + this.viewW / this.scale + 50) continue;
      if (b.collected) {
        if (b.collectAnim > 0) {
          const t = 1 - b.collectAnim / 0.2;
          const scale = 1 + t * 1.5;
          const alpha = 1 - t;
          ctx.globalAlpha = alpha;
          ctx.shadowColor = '#FFFF00';
          ctx.shadowBlur = 20;
          ctx.fillStyle = '#FFFF00';
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius * scale, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.shadowBlur = 0;
        }
        continue;
      }
      const glow = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, 20);
      glow.addColorStop(0, 'rgba(255,255,0,0.6)');
      glow.addColorStop(1, 'rgba(255,255,0,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 20, 0, Math.PI * 2);
      ctx.fill();
      const grad = ctx.createRadialGradient(b.x - 2, b.y - 2, 0, b.x, b.y, b.radius);
      grad.addColorStop(0, '#FFFFFF');
      grad.addColorStop(0.5, '#FFFF00');
      grad.addColorStop(1, 'rgba(255,255,0,0.3)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawGoal(): void {
    const ctx = this.ctx;
    const g = this.level.goal;
    if (g.x + g.w < this.cameraX - 50 || g.x > this.cameraX + this.viewW / this.scale + 50) return;
    ctx.save();
    ctx.translate(g.x + g.w / 2, g.y + g.h / 2);
    const rot = g.openProgress * Math.PI / 2;
    ctx.shadowColor = '#FF6600';
    ctx.shadowBlur = 20;
    ctx.save();
    ctx.rotate(-rot);
    ctx.fillStyle = '#FF6600';
    ctx.fillRect(-g.w / 2, -g.h / 2, g.w / 2, g.h);
    ctx.strokeStyle = '#FFAA44';
    ctx.lineWidth = 3;
    ctx.strokeRect(-g.w / 2, -g.h / 2, g.w / 2, g.h);
    ctx.restore();
    ctx.save();
    ctx.rotate(rot);
    ctx.fillStyle = '#FF6600';
    ctx.fillRect(0, -g.h / 2, g.w / 2, g.h);
    ctx.strokeStyle = '#FFAA44';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, -g.h / 2, g.w / 2, g.h);
    ctx.restore();
    ctx.restore();
    ctx.shadowBlur = 0;
  }

  drawGrapple(): void {
    const ctx = this.ctx;
    const p = this.player;
    if (p.grappleState === 'idle') return;
    const hx = p.getHandX();
    const hy = p.getHandY();
    let ex: number, ey: number;
    let alpha = 1;

    if (p.grappleState === 'firing') {
      ex = p.grappleX;
      ey = p.grappleY;
      alpha = Math.min(1, p.grappleProgress);
    } else if (p.grappleState === 'swinging' && p.attachedAnchor) {
      ex = p.attachedAnchor.x;
      ey = p.attachedAnchor.y;
      alpha = 1;
    } else if (p.grappleState === 'retracting') {
      const t = p.grappleProgress;
      if (p.attachedAnchor) {
        ex = p.attachedAnchor.x * t + hx * (1 - t);
        ey = p.attachedAnchor.y * t + hy * (1 - t);
      } else {
        ex = p.grappleX * t + hx * (1 - t);
        ey = p.grappleY * t + hy * (1 - t);
      }
      alpha = t;
    } else {
      return;
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = '#FFFF00';
    ctx.shadowBlur = 15;
    ctx.strokeStyle = '#FFFF00';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    const segs = 5;
    for (let i = 1; i <= segs; i++) {
      const tt = i / segs;
      const wobble = Math.sin(this.time * 20 + i) * 2;
      const nx = hx + (ex - hx) * tt;
      const ny = hy + (ey - hy) * tt + wobble * (1 - Math.abs(tt - 0.5) * 2);
      ctx.lineTo(nx, ny);
    }
    ctx.stroke();
    ctx.shadowBlur = 8;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(ex, ey, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawPlayer(): void {
    const ctx = this.ctx;
    const p = this.player;
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;

    ctx.save();
    if (p.flashTimer > 0) {
      ctx.globalAlpha = 0.8;
      ctx.shadowColor = '#FFFFFF';
      ctx.shadowBlur = 20;
    }

    const bodyColor = p.flashTimer > 0 ? '#FFFFFF' : '#00FFCC';
    ctx.fillStyle = bodyColor;
    ctx.shadowColor = '#00FFCC';
    ctx.shadowBlur = p.flashTimer > 0 ? 30 : 10;

    const jumping = !p.onGround;
    const legOffset = jumping ? (p.animFrame % 2 === 0 ? 2 : -2) : Math.sin(this.time * 10) * 2;

    ctx.fillRect(p.x + 4, p.y + 8, p.w - 8, p.h - 16);
    ctx.beginPath();
    ctx.arc(cx, p.y + 8, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#003322';
    ctx.fillRect(cx - 4, p.y + 5, 8, 3);

    ctx.fillStyle = bodyColor;
    const armSwing = jumping ? -4 : Math.sin(this.time * 10) * 3;
    ctx.fillRect(p.x - 2, p.y + 14 + armSwing, 5, 12);
    ctx.fillRect(p.x + p.w - 3, p.y + 14 - armSwing, 5, 12);

    ctx.fillRect(p.x + 5, p.y + p.h - 10 + legOffset, 5, 10);
    ctx.fillRect(p.x + p.w - 10, p.y + p.h - 10 - legOffset, 5, 10);

    if (p.gravityDir < 0) {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, p.y - 5);
      ctx.lineTo(cx - 4, p.y - 1);
      ctx.moveTo(cx, p.y - 5);
      ctx.lineTo(cx + 4, p.y - 1);
      ctx.stroke();
    }

    ctx.restore();
    ctx.shadowBlur = 0;
  }

  drawParticles(): void {
    const ctx = this.ctx;
    for (let i = 0; i < this.particlePoolSize; i++) {
      const p = this.particlePool[i];
      if (!p.active) continue;
      if (p.x + p.size < this.cameraX || p.x - p.size > this.cameraX + this.viewW / this.scale) continue;
      if (p.y + p.size < this.cameraY || p.y - p.size > this.cameraY + this.viewH / this.scale) continue;
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  drawHUD(): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = 0.6;

    const barW = 400;
    const barH = 20;
    const bx = (this.viewW - barW) / 2;
    const by = 30;
    ctx.fillStyle = '#222222';
    ctx.fillRect(bx, by, barW, barH);
    ctx.strokeStyle = '#555555';
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, barW, barH);
    const fillW = barW * Math.min(1, this.progressAnim);
    const grad = ctx.createLinearGradient(bx, by, bx + barW, by);
    grad.addColorStop(0, '#FFD700');
    grad.addColorStop(1, '#FFAA00');
    ctx.fillStyle = grad;
    ctx.fillRect(bx, by, fillW, barH);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.collected} / ${this.requiredToOpen} 能量球`, this.viewW / 2, by + 15);

    const hx = this.viewW - 90;
    const hy = 20;
    for (let i = 0; i < this.player.maxLives; i++) {
      this.drawHeart(hx + i * 28, hy, i < this.player.lives);
    }

    ctx.restore();
  }

  drawHeart(x: number, y: number, filled: boolean): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = filled ? '#FF3355' : '#442233';
    ctx.shadowColor = filled ? '#FF3355' : 'transparent';
    ctx.shadowBlur = filled ? 8 : 0;
    ctx.beginPath();
    ctx.moveTo(x + 10, y + 18);
    ctx.bezierCurveTo(x - 5, y + 10, x - 5, y - 2, x + 10, y + 5);
    ctx.bezierCurveTo(x + 25, y - 2, x + 25, y + 10, x + 10, y + 18);
    ctx.fill();
    ctx.restore();
  }

  drawGameOver(): void {
    if (!this.gameOver && this.gameOverFade <= 0) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = this.gameOverFade;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, this.viewW, this.viewH);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', this.viewW / 2, this.viewH / 2 - 30);
    ctx.font = '20px monospace';
    ctx.fillText('点击鼠标重新开始', this.viewW / 2, this.viewH / 2 + 20);
    ctx.restore();
  }

  drawVictory(): void {
    if (!this.victory && this.victoryFade <= 0) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = this.victoryFade;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, this.viewW, this.viewH);
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', this.viewW / 2, this.viewH / 2 - 30);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px monospace';
    ctx.fillText(`收集了 ${this.collected} 个能量球`, this.viewW / 2, this.viewH / 2 + 10);
    ctx.fillText('点击鼠标重新开始', this.viewW / 2, this.viewH / 2 + 40);
    ctx.restore();
  }
}
