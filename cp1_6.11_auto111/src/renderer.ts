import { Skill, SkillType, getFrameInfo, calculateCombo, getTotalFrames } from './combat';
import gsap from 'gsap';

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

interface EffectState {
  type: SkillType;
  frame: number;
  totalFrames: number;
  particles: Particle[];
  ringRadius: number;
  arcAngle: number;
}

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private skills: Skill[] = [];
  private currentFrame: number = 0;
  private playing: boolean = false;
  private lastTimestamp: number = 0;
  private accumulator: number = 0;
  private readonly FRAME_TIME = 1000 / 60;
  private rafId: number = 0;

  private dpsPanelEl: HTMLElement;
  private comboLabelEl: HTMLElement;
  private frameCounterEl: HTMLElement;

  private characterX: number = 0;
  private characterY: number = 0;
  private characterScale: number = 1;
  private characterLean: number = 0;

  private activeEffect: EffectState | null = null;
  private prevSkillIndex: number = -1;
  private comboCount: number = 0;
  private shownComboCount: number = 0;

  private floatingTexts: { x: number; y: number; text: string; life: number; maxLife: number }[] = [];

  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.dpsPanelEl = document.getElementById('dps-panel')!;
    this.comboLabelEl = document.getElementById('combo-label')!;
    this.frameCounterEl = document.getElementById('frame-counter')!;

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.bindControls();
    this.startLoop();
  }

  setSkills(skills: Skill[]): void {
    this.skills = skills;
    this.reset();
  }

  play(): void {
    if (this.skills.length === 0) return;
    this.playing = true;
    this.dpsPanelEl.classList.add('visible');
  }

  pause(): void {
    this.playing = false;
  }

  reset(): void {
    this.playing = false;
    this.currentFrame = 0;
    this.accumulator = 0;
    this.activeEffect = null;
    this.prevSkillIndex = -1;
    this.comboCount = 0;
    this.shownComboCount = 0;
    this.characterScale = 1;
    this.characterLean = 0;
    this.floatingTexts = [];
    this.dpsPanelEl.classList.remove('visible');
    this.comboLabelEl.classList.remove('visible');
    this.comboLabelEl.classList.remove('combo-5');
    this.updateUI();
  }

  private resizeCanvas(): void {
    const container = this.canvas.parentElement!;
    const dpr = window.devicePixelRatio || 1;
    const w = container.clientWidth;
    const h = container.clientHeight;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.characterX = w / 2;
    this.characterY = h - 40;
  }

  private bindControls(): void {
    document.getElementById('play-btn')!.addEventListener('click', () => this.play());
    document.getElementById('pause-btn')!.addEventListener('click', () => this.pause());
    document.getElementById('reset-btn')!.addEventListener('click', () => this.reset());
  }

  private startLoop(): void {
    const loop = (timestamp: number) => {
      if (this.lastTimestamp === 0) this.lastTimestamp = timestamp;
      const delta = Math.min(timestamp - this.lastTimestamp, 100);
      this.lastTimestamp = timestamp;

      if (this.playing) {
        this.accumulator += delta;
        while (this.accumulator >= this.FRAME_TIME) {
          this.accumulator -= this.FRAME_TIME;
          this.advanceFrame();
        }
      }

      this.draw();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private advanceFrame(): void {
    const total = getTotalFrames(this.skills);
    if (this.currentFrame >= total) {
      this.playing = false;
      return;
    }

    const info = getFrameInfo(this.skills, this.currentFrame);
    if (!info) return;

    if (info.skillIndex !== this.prevSkillIndex) {
      this.prevSkillIndex = info.skillIndex;
    }

    switch (info.phase) {
      case 'startup': {
        const progress = info.phaseFrame / info.phaseTotalFrames;
        this.characterScale = 0.95;
        this.characterLean = -3 * progress;
        break;
      }
      case 'active': {
        this.characterScale = 1.0;
        this.characterLean = 0;

        if (info.phaseFrame === 0) {
          const skill = this.skills[info.skillIndex];
          this.spawnEffect(skill.type, skill.activeFrames);
          this.comboCount = info.skillIndex + 1;
          this.spawnDamageText(skill.damage);
        }

        if (this.activeEffect) {
          this.activeEffect.frame = info.phaseFrame;
        }

        const dmg = calculateCombo(this.skills, this.currentFrame);
        this.updateDPS(dmg);
        this.updateComboLabel();
        break;
      }
      case 'recovery': {
        const progress = info.phaseFrame / info.phaseTotalFrames;
        this.characterScale = 1.0 - 0.03 * (1 - progress);
        this.characterLean = -2 * (1 - progress);

        if (this.activeEffect) {
          this.activeEffect.frame = info.phaseFrame + (this.skills[info.skillIndex]?.activeFrames || 0);
        }
        break;
      }
    }

    this.currentFrame++;
    this.updateUI();
  }

  private spawnEffect(type: SkillType, activeFrames: number): void {
    this.activeEffect = {
      type,
      frame: 0,
      totalFrames: activeFrames,
      particles: [],
      ringRadius: 0,
      arcAngle: 0,
    };

    if (type === 'fire') {
      for (let i = 0; i < 25; i++) {
        const angle = (Math.PI * 2 * i) / 25 + (Math.random() - 0.5) * 0.5;
        const speed = 1.5 + Math.random() * 3;
        this.activeEffect.particles.push({
          x: this.characterX,
          y: this.characterY - 40,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1,
          life: activeFrames,
          maxLife: activeFrames,
          color: Math.random() > 0.5 ? '#FF6600' : '#FF9933',
          size: 2 + Math.random() * 4,
        });
      }
    }
  }

  private spawnDamageText(damage: number): void {
    this.floatingTexts.push({
      x: this.characterX + 50 + Math.random() * 20,
      y: this.characterY - 60,
      text: `-${damage}`,
      life: 40,
      maxLife: 40,
    });
  }

  private updateDPS(dmg: { dps: number; totalDamage: number }): void {
    this.dpsPanelEl.textContent = `DPS: ${dmg.dps}/秒`;
  }

  private updateComboLabel(): void {
    if (this.comboCount >= 3 && this.comboCount !== this.shownComboCount) {
      this.shownComboCount = this.comboCount;
      const label = this.comboLabelEl;
      label.textContent = `${this.comboCount}连击！`;
      label.classList.remove('combo-5');

      if (this.comboCount >= 5) {
        label.classList.add('combo-5');
      }

      gsap.fromTo(
        label,
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.35,
          ease: 'back.out(1.7)',
          onStart: () => label.classList.add('visible'),
        }
      );
    }
  }

  private updateUI(): void {
    const total = getTotalFrames(this.skills);
    const displayFrame = Math.min(this.currentFrame, total);
    this.frameCounterEl.textContent = `${displayFrame} / ${total}`;
  }

  private draw(): void {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.ctx.clearRect(0, 0, w, h);

    this.drawBackground(w, h);
    this.drawEffect();
    this.drawCharacter();
    this.drawFloatingTexts();
  }

  private drawBackground(w: number, h: number): void {
    this.ctx.fillStyle = '#1A1A2E';
    this.ctx.fillRect(0, 0, w, h);

    this.ctx.strokeStyle = 'rgba(106, 90, 205, 0.08)';
    this.ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < w; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, h);
      this.ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(w, y);
      this.ctx.stroke();
    }

    const groundY = this.characterY + 40;
    const grd = this.ctx.createLinearGradient(0, groundY, 0, groundY + 20);
    grd.addColorStop(0, 'rgba(255, 140, 66, 0.15)');
    grd.addColorStop(1, 'rgba(255, 140, 66, 0)');
    this.ctx.fillStyle = grd;
    this.ctx.fillRect(0, groundY, w, 20);
  }

  private drawCharacter(): void {
    const ctx = this.ctx;
    const cx = this.characterX;
    const baseY = this.characterY;

    ctx.save();
    ctx.translate(cx, baseY);
    ctx.scale(this.characterScale, 1);

    const lean = this.characterLean;

    ctx.fillStyle = '#FF8C42';
    ctx.strokeStyle = '#FF8C42';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.arc(lean, -68, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillRect(lean - 10, -56, 20, 30);

    ctx.beginPath();
    ctx.moveTo(lean - 10, -50);
    ctx.lineTo(lean - 22, -35);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(lean + 10, -50);
    ctx.lineTo(lean + 22, -35);
    ctx.stroke();

    if (this.characterScale < 0.98) {
      ctx.beginPath();
      ctx.moveTo(lean - 8, -26);
      ctx.lineTo(lean - 12, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(lean + 8, -26);
      ctx.lineTo(lean + 12, 0);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(lean - 8, -26);
      ctx.lineTo(lean - 10, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(lean + 8, -26);
      ctx.lineTo(lean + 10, 0);
      ctx.stroke();
    }

    ctx.restore();

    ctx.save();
    ctx.shadowColor = '#FF8C42';
    ctx.shadowBlur = 15;
    ctx.fillStyle = 'rgba(255, 140, 66, 0.05)';
    ctx.fillRect(cx - 30, baseY - 80, 60, 80);
    ctx.restore();
  }

  private drawEffect(): void {
    if (!this.activeEffect) return;

    const ctx = this.ctx;
    const progress = this.activeEffect.frame / this.activeEffect.totalFrames;
    const cx = this.characterX;
    const cy = this.characterY - 40;

    switch (this.activeEffect.type) {
      case 'normal':
        this.drawNormalEffect(ctx, cx, cy, progress);
        break;
      case 'fire':
        this.drawFireEffect(ctx, progress);
        break;
      case 'ice':
        this.drawIceEffect(ctx, cx, cy, progress);
        break;
    }
  }

  private drawNormalEffect(ctx: CanvasRenderingContext2D, cx: number, cy: number, progress: number): void {
    const opacity = 1 - progress;
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.strokeStyle = '#E0E0E0';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#E0E0E0';
    ctx.shadowBlur = 10;

    const startAngle = -Math.PI * 0.3;
    const sweepAngle = Math.PI * 0.8 * Math.min(progress * 2, 1);
    const radius = 50 + progress * 30;

    ctx.beginPath();
    ctx.arc(cx + 25, cy - 10, radius, startAngle, startAngle + sweepAngle);
    ctx.stroke();

    if (progress > 0.3) {
      ctx.strokeStyle = 'rgba(224, 224, 224, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx + 25, cy - 10, radius - 10, startAngle, startAngle + sweepAngle * 0.8);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawFireEffect(ctx: CanvasRenderingContext2D, progress: number): void {
    const particles = this.activeEffect!.particles;
    ctx.save();

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.life--;

      if (p.life > 0) {
        const alpha = Math.min(p.life / p.maxLife, 1) * (1 - progress * 0.5);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  private drawIceEffect(ctx: CanvasRenderingContext2D, cx: number, cy: number, progress: number): void {
    const maxRadius = 80;
    const radius = maxRadius * Math.min(progress * 1.5, 1);
    const opacity = 1 - progress * 0.6;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.strokeStyle = '#66CCFF';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#66CCFF';
    ctx.shadowBlur = 15;

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    if (progress > 0.2) {
      ctx.globalAlpha = opacity * 0.4;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.6, 0, Math.PI * 2);
      ctx.stroke();
    }

    const innerAlpha = (1 - progress) * 0.15;
    ctx.globalAlpha = innerAlpha;
    ctx.fillStyle = '#66CCFF';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawFloatingTexts(): void {
    const ctx = this.ctx;
    const toRemove: number[] = [];

    for (let i = 0; i < this.floatingTexts.length; i++) {
      const ft = this.floatingTexts[i];
      ft.life--;
      ft.y -= 1.2;

      if (ft.life <= 0) {
        toRemove.push(i);
        continue;
      }

      const alpha = ft.life / ft.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#FF4444';
      ctx.font = 'bold 18px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.shadowColor = '#FF0000';
      ctx.shadowBlur = 6;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    for (let i = toRemove.length - 1; i >= 0; i--) {
      this.floatingTexts.splice(toRemove[i], 1);
    }
  }
}
