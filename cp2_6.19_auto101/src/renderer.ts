import { FormationMode, clamp } from './types';
import { Player } from './player';
import { Meteor } from './enemy';
import { Ally } from './ally';
import { ParticleSystem, Particle } from './particle';
import { Bullet } from './types';

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

  constructor(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    this.ctx = ctx;
    this.canvas = canvas;
    this.initStars();
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

  drawUI(player: Player, mode: FormationMode, currentPulse: number, allies: Ally[]): void {
    const { ctx, canvas } = this;
    this.modePulseTime += 0.016;

    const barW = 200;
    const barH = 20;
    const barX = 20;
    const barY = canvas.height - 45;

    const pct = clamp(player.displayHealth / player.maxHealth, 0, 1);
    const displayPct = pct;
    const bounce = player.healthAnimTime < 0.5 ? Math.sin(player.healthAnimTime * 20) * (1 - player.healthAnimTime / 0.5) * 0.1 : 0;
    const w = barW * displayPct * (1 + bounce);

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
    ctx.fillText(`${Math.ceil(player.displayHealth)} / ${player.maxHealth}`, barX + barW / 2, barY + barH / 2);

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

    ctx.save();
    ctx.fillStyle = 'rgba(10, 15, 40, 0.75)';
    ctx.strokeStyle = 'rgba(100, 150, 255, 0.6)';
    ctx.lineWidth = 1.5;
    this.roundRect(ctx, thumbX, thumbY, thumbW, thumbH, 6);
    ctx.fill();
    ctx.stroke();

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
      ctx.fillStyle = ally.color;
      ctx.beginPath();
      ctx.arc(ax, ay, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = 'rgba(200, 220, 255, 0.8)';
    ctx.font = '10px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('编队状态', cx, thumbY + thumbH + 12);
    ctx.textAlign = 'left';

    ctx.restore();
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
    mode: FormationMode,
    modePulse: number
  ): void {
    this.drawBackground(dt);
    this.drawParticles(particles);
    for (const m of meteors) this.drawMeteor(m);
    for (const b of bullets) this.drawBullet(b);
    for (const a of allies) this.drawAlly(a);
    this.drawPlayer(player);
    this.drawUI(player, mode, modePulse, allies);
  }
}
