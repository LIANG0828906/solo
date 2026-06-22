import { ELEMENTS, ElementType } from '../domain/elementData';
import {
  VisualEffect,
  ExplosionEffect,
  WrapEffect,
  RandomEffect,
  DamageNumberEffect,
  SpiritState,
} from '../domain/combatEngine';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  phase: number;
  speed: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  startTime: number;
  duration: number;
  color: string;
}

const CANVAS_BG = '#1A0A2E';
const BORDER_COLORS = ['rgba(138,43,226,0.4)', 'rgba(75,0,130,0.3)', 'rgba(138,43,226,0.4)'];

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private particles: Particle[] = [];
  private stars: Star[] = [];
  private ripples: Ripple[] = [];
  private mouseX: number = 0;
  private mouseY: number = 0;

  constructor(canvas: HTMLCanvasElement, width: number, height: number) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.initStars();
  }

  private initStars(): void {
    this.stars = [];
    const count = 80;
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 1.5 + 0.5,
        phase: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 1,
      });
    }
  }

  setMousePosition(x: number, y: number): void {
    this.mouseX = x;
    this.mouseY = y;
  }

  addRipple(x: number, y: number, color: string): void {
    this.ripples.push({
      x,
      y,
      radius: 0,
      maxRadius: 30,
      startTime: performance.now(),
      duration: 500,
      color,
    });
  }

  private spawnExplosionParticles(effect: ExplosionEffect): void {
    for (let i = 0; i < effect.particleCount; i++) {
      const angle = (Math.PI * 2 * i) / effect.particleCount + Math.random() * 0.3;
      const speed = 1 + Math.random() * 3;
      this.particles.push({
        x: effect.x,
        y: effect.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: effect.duration,
        maxLife: effect.duration,
        color: effect.color,
        size: 3 + Math.random() * 4,
      });
    }
  }

  render(spirit: SpiritState | null, effects: VisualEffect[], time: number): void {
    this.ctx.fillStyle = CANVAS_BG;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.renderStars(time);
    this.renderMagicBorder(time);

    for (const effect of effects) {
      if (effect.type === 'explosion') {
        const elapsed = time - effect.startTime;
        if (elapsed < 10 && elapsed >= 0) {
          this.spawnExplosionParticles(effect);
        }
      }
    }

    this.updateParticles();
    this.renderParticles();
    this.updateRipples(time);
    this.renderRipples(time);

    if (spirit) {
      this.renderSpirit(spirit, time);
    }

    for (const effect of effects) {
      const elapsed = time - effect.startTime;
      if (elapsed < 0 || elapsed > effect.duration) continue;

      switch (effect.type) {
        case 'wrap':
          this.renderWrapEffect(effect, time);
          break;
        case 'random':
          this.renderRandomEffect(effect, time);
          break;
        case 'damage':
          this.renderDamageNumber(effect, time);
          break;
      }
    }
  }

  private renderStars(time: number): void {
    for (const star of this.stars) {
      const twinkle = 0.4 + 0.6 * Math.abs(Math.sin(time * 0.002 * star.speed + star.phase));
      this.ctx.fillStyle = `rgba(255,255,255,${twinkle * 0.7})`;
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private renderMagicBorder(time: number): void {
    const gradient = this.ctx.createLinearGradient(0, 0, this.width, this.height);
    const offset = (Math.sin(time * 0.001) + 1) / 2;
    gradient.addColorStop(0, BORDER_COLORS[0]);
    gradient.addColorStop(0.5 * offset + 0.25, BORDER_COLORS[1]);
    gradient.addColorStop(1, BORDER_COLORS[2]);

    this.ctx.strokeStyle = gradient;
    this.ctx.lineWidth = 8;
    this.ctx.strokeRect(4, 4, this.width - 8, this.height - 8);

    this.ctx.strokeStyle = `rgba(180,120,255,${0.1 + 0.05 * Math.sin(time * 0.003)})`;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(14, 14, this.width - 28, this.height - 28);
  }

  private updateParticles(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.life -= 16;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private renderParticles(): void {
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      this.ctx.fillStyle = p.color.replace(')', `,${alpha})`).replace('rgb', 'rgba').replace('#', '');
      const tempDiv = document.createElement('div');
      tempDiv.style.color = p.color;
      document.body.appendChild(tempDiv);
      const rgb = getComputedStyle(tempDiv).color;
      document.body.removeChild(tempDiv);
      const rgba = rgb.replace('rgb', 'rgba').replace(')', `,${alpha})`);
      this.ctx.fillStyle = rgba;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private updateRipples(time: number): void {
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      const elapsed = time - r.startTime;
      if (elapsed >= r.duration) {
        this.ripples.splice(i, 1);
      }
    }
  }

  private renderRipples(time: number): void {
    for (const r of this.ripples) {
      const elapsed = time - r.startTime;
      const progress = elapsed / r.duration;
      if (progress > 1) continue;
      const radius = r.maxRadius * progress;
      const alpha = 1 - progress;
      this.ctx.strokeStyle = r.color.includes('rgba')
        ? r.color.replace(/[\d.]+\)$/, `${alpha})`)
        : r.color;
      if (!r.color.includes('rgba')) {
        const tempDiv = document.createElement('div');
        tempDiv.style.color = r.color;
        document.body.appendChild(tempDiv);
        const rgb = getComputedStyle(tempDiv).color;
        document.body.removeChild(tempDiv);
        this.ctx.strokeStyle = rgb.replace('rgb', 'rgba').replace(')', `,${alpha})`);
      }
      this.ctx.lineWidth = 3 * (1 - progress);
      this.ctx.beginPath();
      this.ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
      this.ctx.stroke();
    }
  }

  private renderSpirit(spirit: SpiritState, time: number): void {
    const info = ELEMENTS[spirit.element];
    const breathe = 1 + 0.05 * Math.sin(time * 0.003);
    const floatY = 8 * Math.sin(time * 0.003 + spirit.floatPhase);

    const drawX = spirit.x;
    const drawY = spirit.y + floatY;
    const scale = spirit.scale * breathe;
    const w = spirit.width * scale;
    const h = spirit.height * scale;

    this.drawGlow(drawX, drawY, w, h, info.glowColor, time);
    this.drawBody(drawX, drawY, w, h, info.color);
    this.drawEyes(drawX, drawY, w, h);
    this.drawElementSymbol(drawX, drawY - h * 0.1, w * 0.5, info.icon, info.color, time);
  }

  private drawGlow(x: number, y: number, w: number, h: number, glowColor: string, time: number): void {
    const glowIntensity = 0.5 + 0.3 * Math.sin(time * 0.003);
    const gradient = this.ctx.createRadialGradient(x, y, w * 0.3, x, y, w * 1.2);
    const colorParts = glowColor.match(/[\d.]+/g);
    if (colorParts && colorParts.length >= 4) {
      const [r, g, b, a] = colorParts;
      gradient.addColorStop(0, `rgba(${r},${g},${b},${parseFloat(a) * glowIntensity})`);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
    }
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(x - w * 1.5, y - h * 1.2, w * 3, h * 2.4);
  }

  private drawBody(x: number, y: number, w: number, h: number, color: string): void {
    const radius = 20;
    const left = x - w / 2;
    const top = y - h / 2;
    const right = x + w / 2;
    const bottom = y + h / 2;

    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.moveTo(left + radius, top);
    this.ctx.lineTo(right - radius, top);
    this.ctx.quadraticCurveTo(right, top, right, top + radius);
    this.ctx.lineTo(right, bottom - radius);
    this.ctx.quadraticCurveTo(right, bottom, right - radius, bottom);
    this.ctx.lineTo(left + radius, bottom);
    this.ctx.quadraticCurveTo(left, bottom, left, bottom - radius);
    this.ctx.lineTo(left, top + radius);
    this.ctx.quadraticCurveTo(left, top, left + radius, top);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = 'rgba(255,255,255,0.2)';
    this.ctx.beginPath();
    this.ctx.ellipse(x - w * 0.15, y - h * 0.25, w * 0.18, h * 0.12, -0.3, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawEyes(x: number, y: number, w: number, h: number): void {
    const eyeY = y - h * 0.1;
    const eyeSpacing = w * 0.25;
    const eyeRadius = Math.max(4, w * 0.08);

    for (const side of [-1, 1]) {
      const eyeX = x + side * eyeSpacing;

      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(eyeX, eyeY, eyeRadius, 0, Math.PI * 2);
      this.ctx.fill();

      const dx = this.mouseX - eyeX;
      const dy = this.mouseY - eyeY;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const pupilOffset = eyeRadius * 0.4;
      const pupilX = eyeX + (dx / dist) * pupilOffset;
      const pupilY = eyeY + (dy / dist) * pupilOffset;

      this.ctx.fillStyle = '#1a0a2e';
      this.ctx.beginPath();
      this.ctx.arc(pupilX, pupilY, eyeRadius * 0.55, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(pupilX - eyeRadius * 0.15, pupilY - eyeRadius * 0.15, eyeRadius * 0.2, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private drawElementSymbol(
    x: number,
    y: number,
    size: number,
    icon: string,
    color: string,
    time: number
  ): void {
    const bob = Math.sin(time * 0.004) * 2;
    this.ctx.font = `${size}px serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = 10 + 5 * Math.sin(time * 0.005);
    this.ctx.fillText(icon, x, y + bob);
    this.ctx.shadowBlur = 0;
  }

  private renderWrapEffect(effect: WrapEffect, time: number): void {
    const elapsed = time - effect.startTime;
    const progress = elapsed / effect.duration;
    const alpha = progress < 0.8 ? 0.6 : 0.6 * (1 - (progress - 0.8) / 0.2);

    for (let i = 0; i < 3; i++) {
      const ringRadius = 40 + 30 * progress + i * 12;
      const angleOffset = (time * 0.005 + i * 2) % (Math.PI * 2);

      this.ctx.strokeStyle = `rgba(34,197,94,${alpha * 0.7})`;
      this.ctx.lineWidth = 3;
      this.ctx.setLineDash([5, 5]);
      this.ctx.lineDashOffset = -time * 0.05;
      this.ctx.beginPath();
      this.ctx.ellipse(
        effect.x,
        effect.y,
        ringRadius,
        ringRadius * 0.5,
        angleOffset,
        0,
        Math.PI * 2
      );
      this.ctx.stroke();
      this.ctx.setLineDash([]);

      for (let j = 0; j < 6; j++) {
        const angle = angleOffset + (j / 6) * Math.PI * 2;
        const px = effect.x + Math.cos(angle) * ringRadius;
        const py = effect.y + Math.sin(angle) * ringRadius * 0.5;
        this.ctx.fillStyle = `rgba(134,239,172,${alpha})`;
        this.ctx.beginPath();
        this.ctx.arc(px, py, 3, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }

  private renderRandomEffect(effect: RandomEffect, time: number): void {
    const elapsed = time - effect.startTime;
    const progress = elapsed / effect.duration;
    const alpha = 1 - progress;

    switch (effect.element) {
      case 'fire':
        this.drawFireEffect(effect.x, effect.y, progress, alpha);
        break;
      case 'water':
        this.drawWaterEffect(effect.x, effect.y, progress, alpha);
        break;
      case 'wood':
        this.drawLeafEffect(effect.x, effect.y, progress, alpha, time);
        break;
      case 'earth':
        this.drawRockEffect(effect.x, effect.y, progress, alpha, time);
        break;
      case 'thunder':
        this.drawThunderEffect(effect.x, effect.y, progress, alpha, time);
        break;
    }
  }

  private drawFireEffect(x: number, y: number, progress: number, alpha: number): void {
    for (let i = 0; i < 5; i++) {
      const offset = (i - 2) * 6;
      const flameHeight = 20 + 10 * (1 - progress);
      const gradient = this.ctx.createLinearGradient(x + offset, y, x + offset, y - flameHeight);
      gradient.addColorStop(0, `rgba(255,200,0,${alpha})`);
      gradient.addColorStop(0.5, `rgba(255,100,0,${alpha * 0.8})`);
      gradient.addColorStop(1, `rgba(255,50,0,0)`);
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.ellipse(x + offset, y - flameHeight / 2, 5 - i * 0.5, flameHeight / 2, 0, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private drawWaterEffect(x: number, y: number, progress: number, alpha: number): void {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + progress * Math.PI;
      const radius = 5 + progress * 25;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius * 0.6 + progress * 15;
      this.ctx.fillStyle = `rgba(74,144,217,${alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(px, py, 3 * (1 - progress * 0.5), 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private drawLeafEffect(x: number, y: number, progress: number, alpha: number, time: number): void {
    for (let i = 0; i < 5; i++) {
      const offsetX = (i - 2) * 10;
      const offsetY = -progress * 40;
      const rotation = time * 0.01 + i;
      this.ctx.save();
      this.ctx.translate(x + offsetX, y + offsetY);
      this.ctx.rotate(rotation);
      this.ctx.fillStyle = `rgba(34,197,94,${alpha})`;
      this.ctx.beginPath();
      this.ctx.ellipse(0, 0, 6, 3, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.strokeStyle = `rgba(22,163,74,${alpha})`;
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(-5, 0);
      this.ctx.lineTo(5, 0);
      this.ctx.stroke();
      this.ctx.restore();
    }
  }

  private drawRockEffect(x: number, y: number, progress: number, alpha: number, time: number): void {
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + time * 0.005;
      const radius = 15 + progress * 10;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      const size = 5 - progress * 2;
      this.ctx.save();
      this.ctx.translate(px, py);
      this.ctx.rotate(time * 0.008 + i);
      this.ctx.fillStyle = `rgba(139,69,19,${alpha})`;
      this.ctx.fillRect(-size, -size, size * 2, size * 2);
      this.ctx.restore();
    }
  }

  private drawThunderEffect(x: number, y: number, progress: number, alpha: number, time: number): void {
    for (let i = 0; i < 3; i++) {
      const startX = x + (i - 1) * 20;
      const startY = y - 20;
      this.ctx.strokeStyle = `rgba(255,215,0,${alpha * (0.5 + 0.5 * Math.random())})`;
      this.ctx.lineWidth = 2 + Math.random();
      this.ctx.beginPath();
      this.ctx.moveTo(startX, startY);
      let cx = startX;
      let cy = startY;
      for (let j = 0; j < 5; j++) {
        cx += (Math.random() - 0.5) * 15;
        cy += 10;
        this.ctx.lineTo(cx, cy);
      }
      this.ctx.stroke();

      this.ctx.shadowColor = '#FFD700';
      this.ctx.shadowBlur = 8;
      this.ctx.strokeStyle = `rgba(255,255,200,${alpha * 0.5})`;
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
      this.ctx.shadowBlur = 0;
    }
  }

  private renderDamageNumber(effect: DamageNumberEffect, time: number): void {
    const elapsed = time - effect.startTime;
    const progress = elapsed / effect.duration;
    const fadeIn = Math.min(1, progress / (0.5 / 1.5));
    const rise = -40 * Math.min(1, progress);
    const alpha = progress < 0.7 ? fadeIn : fadeIn * (1 - (progress - 0.7) / 0.3);

    this.ctx.save();
    this.ctx.font = 'bold 28px "Microsoft YaHei", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillStyle = effect.color;
    this.ctx.globalAlpha = alpha;
    this.ctx.shadowColor = effect.color;
    this.ctx.shadowBlur = 15;
    this.ctx.fillText(`-${effect.value}`, effect.x, effect.y + rise);
    this.ctx.shadowBlur = 0;
    this.ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.8})`;
    this.ctx.lineWidth = 1.5;
    this.ctx.strokeText(`-${effect.value}`, effect.x, effect.y + rise);
    this.ctx.restore();
  }
}
