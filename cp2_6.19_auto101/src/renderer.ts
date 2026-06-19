import { FormationMode, clamp } from './types';
import { Player } from './player';
import { Meteor } from './enemy';
import { Ally } from './ally';
import { ParticleSystem } from './particle';
import { Bullet } from './types';
import { easeInOut, easeOutElastic, lerp, MODE_SWITCH_THUMBNAIL_TRANSITION } from './animation';

export interface Star {
  x: number;
  y: number;
  size: number;
  twinklePeriod: number;
  twinklePhase: number;
  vx: number;
  vy: number;
}

export class Renderer {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  stars: Star[] = [];
  modePulseTime: number = 0;

  healthDisplay: number = 100;
  healthBounceTime: number = 0;
  healthBounceActive: boolean = false;

  currentMode: FormationMode = 'follow';
  prevMode: FormationMode = 'follow';
  modeTransition: number = 1;
  modeTransitionDuration: number = MODE_SWITCH_THUMBNAIL_TRANSITION;

  constructor(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    this.ctx = ctx;
    this.canvas = canvas;
    this.initStars();
  }

  setMode(mode: FormationMode): void {
    if (this.currentMode === mode) return;
    this.prevMode = this.currentMode;
    this.currentMode = mode;
    this.modeTransition = 0;
  }

  initStars(count: number = 150): void {
    this.stars = [];
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 2 + 1,
        twinklePeriod: Math.random() * 2 + 2,
        twinklePhase: Math.random() * Math.PI * 2,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15
      });
    }
  }

  updateStars(dt: number): void {
    for (const s of this.stars) {
      s.x += s.vx * dt * 60;
      s.y += s.vy * dt * 60;
      s.twinklePhase += dt;
      if (s.x < 0) s.x += this.canvas.width;
      if (s.x > this.canvas.width) s.x -= this.canvas.width;
      if (s.y < 0) s.y += this.canvas.height;
      if (s.y > this.canvas.height) s.y -= this.canvas.height;
    }
  }

  drawBackground(dt: number): void {
    const { ctx, canvas } = this;
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#0a0520');
    grad.addColorStop(0.5, '#1a0f3d');
    grad.addColorStop(1, '#0d0828');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    this.updateStars(dt);
    for (const s of this.stars) {
      const t = Math.sin(s.twinklePhase * (Math.PI * 2 / s.twinklePeriod));
      const alpha = 0.4 + (t + 1) * 0.3;
      ctx.fillStyle = `rgba(220, 230, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawPlayer(player: Player): void {
    const { ctx } = this;
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

    if (player.invulnerable > 0 && Math.floor(player.invulnerable * 20) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    ctx.fillStyle = player.color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(player.radius, 0);
    ctx.lineTo(-player.radius * 0.8, -player.radius * 0.7);
    ctx.lineTo(-player.radius * 0.4, 0);
    ctx.lineTo(-player.radius * 0.8, player.radius * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#aee9ff';
    ctx.beginPath();
    ctx.arc(player.radius * 0.2, 0, player.radius * 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawAlly(ally: Ally): void {
    const { ctx } = this;

    if (ally.modeAuraTimer > 0) {
      const t = ally.modeAuraTimer / 0.5;
      const color = ally.lastMode === 'defense' ? '50,120,255' :
                    ally.lastMode === 'attack' ? '255,70,70' : '80,255,120';
      ctx.save();
      ctx.globalAlpha = t * 0.6;
      ctx.strokeStyle = `rgba(${color},${t})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(ally.x, ally.y, ally.radius + 15 + (1 - t) * 20, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(ally.x, ally.y);
    ctx.rotate(ally.angle);

    ctx.fillStyle = ally.color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(ally.radius, 0);
    ctx.lineTo(-ally.radius * 0.75, -ally.radius * 0.65);
    ctx.lineTo(-ally.radius * 0.3, 0);
    ctx.lineTo(-ally.radius * 0.75, ally.radius * 0.65);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ccffd9';
    ctx.beginPath();
    ctx.arc(ally.radius * 0.15, 0, ally.radius * 0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawMeteor(m: Meteor): void {
    const { ctx } = this;
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.rotate(m.rotation);

    const grad = ctx.createRadialGradient(0, 0, m.radius * 0.2, 0, 0, m.radius);
    grad.addColorStop(0, m.colorBase);
    grad.addColorStop(1, m.colorDark);
    ctx.fillStyle = grad;
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 2;

    ctx.beginPath();
    for (let i = 0; i < m.vertices.length; i += 2) {
      const x = m.vertices[i];
      const y = m.vertices[i + 1];
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.arc(-m.radius * 0.3, -m.radius * 0.3, m.radius * 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawBullet(b: Bullet): void {
    const { ctx } = this;
    ctx.save();
    ctx.shadowColor = b.color;
    ctx.shadowBlur = 8;
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawParticles(ps: ParticleSystem): void {
    const { ctx } = this;
    for (const p of ps.particles) {
      ctx.fillStyle = ps.getParticleColor(p);
      const s = ps.getParticleSize(p);
      ctx.beginPath();
      ctx.arc(p.x, p.y, s, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  updateUIAnimations(dt: number, player: Player): void {
    this.modePulseTime += dt;
    this.modeTransition = Math.min(1, this.modeTransition + dt / this.modeTransitionDuration);

    if (player.healthChanged) {
      this.healthBounceTime = 0;
      this.healthBounceActive = true;
    }

    if (this.healthBounceActive) {
      this.healthBounceTime += dt;
      if (this.healthBounceTime > 0.5) {
        this.healthBounceActive = false;
      }
    }

    if (player.health <= 0) {
      this.healthDisplay = 0;
    } else {
      const elasticSpeed = 8;
      this.healthDisplay += (player.health - this.healthDisplay) * Math.min(1, dt * elasticSpeed);
      if (Math.abs(this.healthDisplay - player.health) < 0.5) {
        this.healthDisplay = player.health;
      }
    }
  }

  drawUI(player: Player, mode: FormationMode, allies: Ally[], dt: number): void {
    this.updateUIAnimations(dt, player);

    const { ctx, canvas } = this;

    const barW = 200;
    const barH = 20;
    const barX = 20;
    const barY = canvas.height - 45;

    const pct = clamp(this.healthDisplay / player.maxHealth, 0, 1);

    let bounce = 0;
    if (this.healthBounceActive && player.health > 0) {
      const t = this.healthBounceTime / 0.5;
      bounce = easeOutElastic(1 - t) * 0.12 * (1 - t);
    }

    const w = barW * pct * (1 + bounce);

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);

    ctx.fillStyle = '#3a0a0a';
    ctx.fillRect(barX, barY, barW, barH);

    const hpGrad = ctx.createLinearGradient(barX, barY, barX, barY + barH);
    hpGrad.addColorStop(0, '#ff5566');
    hpGrad.addColorStop(0.5, '#ee3344');
    hpGrad.addColorStop(1, '#bb1122');
    ctx.fillStyle = hpGrad;
    ctx.fillRect(barX, barY, Math.max(0, w), barH);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barW, barH);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px Segoe UI, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.ceil(this.healthDisplay)} / ${player.maxHealth}`, barX + barW / 2, barY + barH / 2);

    const scoreX = canvas.width / 2;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`分数: ${player.score}`, scoreX, canvas.height - 35);
    ctx.textAlign = 'left';

    const dotX = canvas.width - 130;
    const dotY = canvas.height - 35;
    const modes: Array<{ key: FormationMode; color: string; label: string }> = [
      { key: 'defense', color: '#3c78ff', label: '1' },
      { key: 'attack', color: '#ff4848', label: '2' },
      { key: 'follow', color: '#50ff78', label: '3' }
    ];

    for (let i = 0; i < modes.length; i++) {
      const m = modes[i];
      const x = dotX + i * 40;
      const isActive = m.key === mode;
      const pulse = isActive ? 0.5 + 0.5 * Math.sin(this.modePulseTime * 5) : 0;
      const baseR = isActive ? 9 + pulse * 3 : 7;

      if (isActive) {
        ctx.save();
        ctx.globalAlpha = 0.3 + pulse * 0.3;
        ctx.fillStyle = m.color;
        ctx.beginPath();
        ctx.arc(x, dotY, baseR + 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.fillStyle = m.color;
      ctx.beginPath();
      ctx.arc(x, dotY, baseR, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(m.label, x, dotY);
    }
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    this.drawFormationThumbnail(player, allies);
  }

  drawFormationThumbnail(player: Player, allies: Ally[]): void {
    const { ctx } = this;
    const thumbW = 100;
    const thumbH = 100;
    const thumbX = 15;
    const thumbY = 15;
    const scale = 0.35;
    const cx = thumbX + thumbW / 2;
    const cy = thumbY + thumbH / 2;

    const t = easeInOut(this.modeTransition);
    const ringColor = this.getModeColor(this.currentMode);
    const ringColorPrev = this.getModeColor(this.prevMode);

    ctx.save();
    ctx.fillStyle = 'rgba(10, 15, 40, 0.75)';
    ctx.strokeStyle = this.lerpColor(ringColorPrev, ringColor, t);
    ctx.lineWidth = 1.5 + (1 - t) * 1.5;
    this.roundRect(ctx, thumbX, thumbY, thumbW, thumbH, 6);
    ctx.fill();
    ctx.stroke();

    if (this.modeTransition < 1) {
      ctx.globalAlpha = 1 - t;
      ctx.strokeStyle = ringColorPrev;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 42 + (1 - t) * 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(thumbX, cy);
    ctx.lineTo(thumbX + thumbW, cy);
    ctx.moveTo(cx, thumbY);
    ctx.lineTo(cx, thumbY + thumbH);
    ctx.stroke();

    for (const ally of allies) {
      const rx = ally.x - player.x;
      const ry = ally.y - player.y;
      const ax = cx + rx * scale;
      const ay = cy + ry * scale;
      if (ax < thumbX + 3 || ax > thumbX + thumbW - 3 || ay < thumbY + 3 || ay > thumbY + thumbH - 3) continue;

      ctx.save();
      ctx.translate(ax, ay);
      ctx.rotate(ally.angle);
      ctx.fillStyle = ally.color;
      ctx.beginPath();
      ctx.moveTo(5, 0);
      ctx.lineTo(-3.5, -3);
      ctx.lineTo(-1.5, 0);
      ctx.lineTo(-3.5, 3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(player.angle);
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(7, 0);
    ctx.lineTo(-5, -4.5);
    ctx.lineTo(-2.5, 0);
    ctx.lineTo(-5, 4.5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = 'rgba(200, 220, 255, 0.8)';
    ctx.font = '10px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('编队状态', cx, thumbY + thumbH + 12);
    ctx.textAlign = 'left';

    ctx.restore();
  }

  private getModeColor(mode: FormationMode): string {
    switch (mode) {
      case 'defense': return 'rgba(60,120,255,0.7)';
      case 'attack': return 'rgba(255,72,72,0.7)';
      case 'follow': return 'rgba(80,255,120,0.7)';
    }
  }

  private lerpColor(a: string, b: string, t: number): string {
    const pa = this.parseRgba(a);
    const pb = this.parseRgba(b);
    const r = Math.round(lerp(pa.r, pb.r, t));
    const g = Math.round(lerp(pa.g, pb.g, t));
    const bl = Math.round(lerp(pa.b, pb.b, t));
    const al = lerp(pa.a, pb.a, t);
    return `rgba(${r},${g},${bl},${al})`;
  }

  private parseRgba(c: string): { r: number; g: number; b: number; a: number } {
    const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!m) return { r: 255, g: 255, b: 255, a: 1 };
    return {
      r: parseInt(m[1]),
      g: parseInt(m[2]),
      b: parseInt(m[3]),
      a: m[4] !== undefined ? parseFloat(m[4]) : 1
    };
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  drawAll(
    dt: number,
    player: Player,
    allies: Ally[],
    meteors: Meteor[],
    bullets: Bullet[],
    particles: ParticleSystem,
    mode: FormationMode
  ): void {
    this.drawBackground(dt);
    this.drawParticles(particles);
    for (const m of meteors) this.drawMeteor(m);
    for (const b of bullets) this.drawBullet(b);
    for (const a of allies) this.drawAlly(a);
    this.drawPlayer(player);
    this.drawUI(player, mode, allies, dt);
  }
}
