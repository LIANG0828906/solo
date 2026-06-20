export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface ScreenShake {
  intensity: number;
  duration: number;
  startTime: number;
}

export interface GlowEffect {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
  maxLife: number;
  color: string;
}

export interface JudgeLineGlow {
  trackX: number;
  trackWidth: number;
  laneIndex: number;
  totalLanes: number;
  y: number;
  life: number;
  maxLife: number;
  color: string;
  intensity: number;
}

export interface ComboPopup {
  combo: number;
  startTime: number;
  duration: number;
  color: string;
}

export class EffectManager {
  private particles: Particle[] = [];
  private shakes: ScreenShake[] = [];
  private glows: GlowEffect[] = [];
  private judgeLineGlows: JudgeLineGlow[] = [];
  private comboPopups: ComboPopup[] = [];
  private flashAlpha = 0;
  private flashColor = '#00e5ff';
  private screenTint: { color: string; alpha: number; duration: number; startTime: number } | null = null;
  private energyPulsePhase = 0;
  private energyFull = false;

  addParticles(x: number, y: number, count: number, color: string, speed = 200): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * speed + speed * 0.3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: 0.8 + Math.random() * 0.4,
        maxLife: 1.2,
        color,
        size: 2 + Math.random() * 4
      });
    }
  }

  addShake(intensity: number, duration: number, currentTime: number): void {
    this.shakes.push({ intensity, duration, startTime: currentTime });
  }

  addGlow(x: number, y: number, maxRadius: number, color: string, life = 0.5): void {
    this.glows.push({
      x,
      y,
      radius: 5,
      maxRadius,
      life,
      maxLife: life,
      color
    });
  }

  triggerFlash(color: string, alpha = 0.6): void {
    this.flashColor = color;
    this.flashAlpha = alpha;
  }

  triggerTint(color: string, alpha: number, duration: number, currentTime: number): void {
    this.screenTint = { color, alpha, duration, startTime: currentTime };
  }

  addJudgeLineGlow(
    trackX: number,
    trackWidth: number,
    laneIndex: number,
    totalLanes: number,
    y: number,
    color: string,
    currentTime: number
  ): void {
    this.judgeLineGlows.push({
      trackX,
      trackWidth,
      laneIndex,
      totalLanes,
      y,
      life: 0.3,
      maxLife: 0.3,
      color,
      intensity: 1.0
    });
  }

  addDebrisParticles(x: number, y: number, count: number, color: string): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 40;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.4,
        maxLife: 0.4,
        color,
        size: 2 + Math.random() * 2
      });
    }
  }

  addComboPopup(combo: number, currentTime: number): void {
    this.comboPopups.push({
      combo,
      startTime: currentTime,
      duration: 0.6,
      color: '#ffffff'
    });
  }

  setEnergyFull(full: boolean): void {
    this.energyFull = full;
    if (!full) {
      this.energyPulsePhase = 0;
    }
  }

  getEnergyPulseAlpha(): number {
    if (!this.energyFull) return 0;
    return (Math.sin(this.energyPulsePhase) + 1) / 2;
  }

  getShakeOffset(currentTime: number): { x: number; y: number } {
    let totalIntensity = 0;
    for (let i = this.shakes.length - 1; i >= 0; i--) {
      const shake = this.shakes[i];
      const elapsed = currentTime - shake.startTime;
      if (elapsed >= shake.duration) {
        this.shakes.splice(i, 1);
        continue;
      }
      const progress = elapsed / shake.duration;
      totalIntensity += shake.intensity * (1 - progress);
    }
    return {
      x: (Math.random() - 0.5) * totalIntensity * 2,
      y: (Math.random() - 0.5) * totalIntensity * 2
    };
  }

  update(dt: number, currentTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
    }

    for (let i = this.glows.length - 1; i >= 0; i--) {
      const g = this.glows[i];
      g.life -= dt;
      if (g.life <= 0) {
        this.glows.splice(i, 1);
        continue;
      }
      const t = 1 - g.life / g.maxLife;
      g.radius = 5 + (g.maxRadius - 5) * t;
    }

    for (let i = this.judgeLineGlows.length - 1; i >= 0; i--) {
      const jlg = this.judgeLineGlows[i];
      jlg.life -= dt;
      if (jlg.life <= 0) {
        this.judgeLineGlows.splice(i, 1);
        continue;
      }
      const t = jlg.life / jlg.maxLife;
      jlg.intensity = t * t;
    }

    for (let i = this.comboPopups.length - 1; i >= 0; i--) {
      const cp = this.comboPopups[i];
      const elapsed = currentTime - cp.startTime;
      if (elapsed >= cp.duration) {
        this.comboPopups.splice(i, 1);
      }
    }

    if (this.energyFull) {
      this.energyPulsePhase += dt * Math.PI * 4;
    }

    if (this.flashAlpha > 0) {
      this.flashAlpha = Math.max(0, this.flashAlpha - dt * 2);
    }

    if (this.screenTint) {
      const elapsed = currentTime - this.screenTint.startTime;
      if (elapsed >= this.screenTint.duration) {
        this.screenTint = null;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    for (const g of this.glows) {
      const alpha = g.life / g.maxLife;
      const gradient = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.radius);
      gradient.addColorStop(0, g.color + Math.floor(alpha * 200).toString(16).padStart(2, '0'));
      gradient.addColorStop(0.5, g.color + Math.floor(alpha * 80).toString(16).padStart(2, '0'));
      gradient.addColorStop(1, g.color + '00');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (this.screenTint) {
      const t = this.screenTint;
      ctx.fillStyle = t.color;
      ctx.globalAlpha = t.alpha;
      ctx.fillRect(0, 0, width, height);
      ctx.globalAlpha = 1;
    }

    if (this.flashAlpha > 0) {
      ctx.fillStyle = this.flashColor;
      ctx.globalAlpha = this.flashAlpha;
      ctx.fillRect(0, 0, width, height);
      ctx.globalAlpha = 1;
    }
  }

  renderJudgeLineGlows(ctx: CanvasRenderingContext2D): void {
    for (const jlg of this.judgeLineGlows) {
      const laneWidth = jlg.trackWidth / jlg.totalLanes;
      const glowX = jlg.trackX + jlg.laneIndex * laneWidth + laneWidth / 2;
      const glowWidth = laneWidth * 0.9;
      const halfWidth = glowWidth / 2;

      ctx.save();
      ctx.globalAlpha = jlg.intensity * 0.7;
      ctx.shadowColor = jlg.color;
      ctx.shadowBlur = 30 * jlg.intensity;

      const gradient = ctx.createRadialGradient(glowX, jlg.y, 0, glowX, jlg.y, halfWidth);
      gradient.addColorStop(0, jlg.color);
      gradient.addColorStop(0.4, jlg.color + 'aa');
      gradient.addColorStop(1, jlg.color + '00');

      ctx.fillStyle = gradient;
      ctx.fillRect(glowX - halfWidth, jlg.y - 6, glowWidth, 12);
      ctx.restore();
    }
  }

  renderComboPopups(ctx: CanvasRenderingContext2D, cx: number, cy: number, currentTime: number): void {
    for (const cp of this.comboPopups) {
      const elapsed = currentTime - cp.startTime;
      const t = elapsed / cp.duration;

      let scale: number;
      if (t < 0.3) {
        scale = 1 + (t / 0.3) * 0.5;
      } else {
        scale = 1.5 - ((t - 0.3) / 0.7) * 0.5;
      }

      const colorT = Math.min(1, t * 1.5);
      const r = Math.floor(255 + (255 - 255) * colorT);
      const g = Math.floor(255 + (215 - 255) * colorT);
      const b = Math.floor(255 + (0 - 255) * colorT);
      const color = `rgb(${r}, ${g}, ${b})`;

      const alpha = 1 - t * t;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 20;
      ctx.font = 'bold 48px Segoe UI';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cp.combo.toString(), 0, 0);
      ctx.restore();
    }
  }

  getJudgeLineGlows(): JudgeLineGlow[] {
    return this.judgeLineGlows;
  }

  getComboPopups(): ComboPopup[] {
    return this.comboPopups;
  }
}
