import type { ShipState } from './ship';
import type { Asteroid, Ore, Particle, Laser } from './asteroid';

interface Star {
  x: number;
  y: number;
  size: number;
  baseBrightness: number;
  phase: number;
  speed: number;
}

interface Portal {
  x: number;
  y: number;
  active: boolean;
  appearTime: number;
  duration: number;
  pulsePhase: number;
}

interface ScoreAnimation {
  value: number;
  x: number;
  y: number;
  targetY: number;
  alpha: number;
  color: string;
  scale: number;
}

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private stars: Star[] = [];
  private portal: Portal = {
    x: 0,
    y: 0,
    active: false,
    appearTime: 0,
    duration: 15000,
    pulsePhase: 0,
  };
  private scoreAnimations: ScoreAnimation[] = [];
  private screenFlash: number = 0;
  private edgeGlow: number = 0;
  private currentScore: number = 0;
  private scoreScale: number = 1;
  private readonly starCount: number = 200;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('无法获取Canvas上下文');
    this.ctx = ctx;
    this.generateStars();
  }

  private generateStars(): void {
    this.stars = [];
    for (let i = 0; i < this.starCount; i++) {
      this.stars.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 2 + 0.5,
        baseBrightness: Math.random() * 0.5 + 0.3,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.03 + 0.01,
      });
    }
  }

  public updateStars(_time: number): void {
    for (const star of this.stars) {
      star.phase += star.speed;
    }
  }

  public drawBackground(_time: number): void {
    const ctx = this.ctx;
    const gradient = ctx.createRadialGradient(
      this.canvas.width / 2,
      this.canvas.height / 2,
      0,
      this.canvas.width / 2,
      this.canvas.height / 2,
      this.canvas.width * 0.7
    );
    gradient.addColorStop(0, '#0a0a2e');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (const star of this.stars) {
      const brightness = star.baseBrightness + Math.sin(star.phase) * 0.3;
      const alpha = Math.max(0.2, Math.min(1, brightness));
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fill();
    }
  }

  public drawShip(ship: ShipState): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.rotation);

    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(-12, -10);
    ctx.lineTo(-8, 0);
    ctx.lineTo(-12, 10);
    ctx.closePath();

    const shipGradient = ctx.createLinearGradient(-12, -10, 16, 10);
    shipGradient.addColorStop(0, '#1a3a5c');
    shipGradient.addColorStop(0.5, '#2a5a8c');
    shipGradient.addColorStop(1, '#1a3a5c');
    ctx.fillStyle = shipGradient;
    ctx.fill();

    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(4, 0, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#00d4ff';
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  public drawAsteroids(asteroids: Asteroid[]): void {
    const ctx = this.ctx;
    for (const asteroid of asteroids) {
      ctx.save();
      ctx.translate(asteroid.x, asteroid.y);
      ctx.rotate(asteroid.rotation);

      ctx.beginPath();
      const sides = asteroid.vertices.length;
      for (let i = 0; i < sides; i++) {
        const angle = (Math.PI * 2 * i) / sides;
        const r = asteroid.vertices[i];
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();

      ctx.fillStyle = asteroid.color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
    }
  }

  public drawOres(ores: Ore[], _time: number): void {
    const ctx = this.ctx;
    for (const ore of ores) {
      const pulse = Math.sin(ore.pulsePhase) * 0.4 + 0.6;
      const size = 5 + pulse * 3;
      const alpha = 0.7 + pulse * 0.3;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowColor = ore.color;
      ctx.shadowBlur = 15 * pulse;

      ctx.fillStyle = ore.color;
      ctx.fillRect(ore.x - size / 2, ore.y - size / 2, size, size);

      ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 + pulse * 0.3})`;
      ctx.lineWidth = 1;
      ctx.strokeRect(ore.x - size / 2, ore.y - size / 2, size, size);

      ctx.fillStyle = `rgba(255, 255, 255, ${pulse * 0.5})`;
      ctx.fillRect(ore.x - size / 4, ore.y - size / 4, size / 2, size / 2);

      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }

  public drawLasers(lasers: Laser[]): void {
    const ctx = this.ctx;
    for (const laser of lasers) {
      for (let i = laser.trail.length - 1; i >= 0; i--) {
        const t = laser.trail[i];
        ctx.beginPath();
        ctx.arc(t.x, t.y, 3 * t.alpha, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 212, 255, ${t.alpha * 0.5})`;
        ctx.fill();
      }

      ctx.save();
      ctx.shadowColor = '#00d4ff';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(laser.x, laser.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#00d4ff';
      ctx.fill();
      ctx.restore();
    }
  }

  public drawParticles(particles: Particle[]): void {
    const ctx = this.ctx;
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.alpha, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(150, 120, 100, ${p.alpha})`;
      ctx.fill();
    }
  }

  public updatePortal(time: number): void {
    const portalInterval = 60000;
    const elapsed = time;

    if (!this.portal.active && elapsed - this.portal.appearTime >= portalInterval) {
      this.spawnPortal(time);
    }

    if (this.portal.active) {
      if (time - this.portal.appearTime >= this.portal.duration) {
        this.portal.active = false;
        this.portal.appearTime = time;
        this.edgeGlow = 0;
      }
      this.portal.pulsePhase += 0.1;
    }
  }

  private spawnPortal(time: number): void {
    const margin = 100;
    this.portal = {
      x: margin + Math.random() * (this.canvas.width - margin * 2),
      y: margin + Math.random() * (this.canvas.height - margin * 2),
      active: true,
      appearTime: time,
      duration: 15000,
      pulsePhase: 0,
    };
    this.edgeGlow = 1;
  }

  public drawPortal(_time: number): void {
    if (!this.portal.active) return;

    const ctx = this.ctx;
    const pulse = Math.sin(this.portal.pulsePhase) * 0.3 + 0.7;
    const radius = 30 + pulse * 10;

    ctx.save();
    ctx.translate(this.portal.x, this.portal.y);

    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, radius - i * 8, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 68, 68, ${0.8 - i * 0.25})`;
      ctx.lineWidth = 3 - i;
      ctx.shadowColor = '#ff4444';
      ctx.shadowBlur = 20 * pulse;
      ctx.stroke();
    }

    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    gradient.addColorStop(0, 'rgba(255, 100, 100, 0.3)');
    gradient.addColorStop(0.7, 'rgba(255, 68, 68, 0.1)');
    gradient.addColorStop(1, 'rgba(255, 68, 68, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  public checkPortalCollision(shipX: number, shipY: number): boolean {
    if (!this.portal.active) return false;
    const dx = shipX - this.portal.x;
    const dy = shipY - this.portal.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < 30;
  }

  public deactivatePortal(): void {
    this.portal.active = false;
    this.portal.appearTime = performance.now();
    this.edgeGlow = 0;
  }

  public addScoreAnimation(value: number, x: number, y: number, color: string): void {
    this.scoreAnimations.push({
      value,
      x,
      y,
      targetY: y - 40,
      alpha: 1,
      color,
      scale: 1.5,
    });
  }

  public updateScoreAnimations(deltaTime: number): void {
    for (let i = this.scoreAnimations.length - 1; i >= 0; i--) {
      const anim = this.scoreAnimations[i];
      anim.y += (anim.targetY - anim.y) * 0.1;
      anim.alpha -= deltaTime / 800;
      anim.scale = Math.max(1, anim.scale - deltaTime / 300);
      if (anim.alpha <= 0) {
        this.scoreAnimations.splice(i, 1);
      }
    }
  }

  public drawScoreAnimations(): void {
    const ctx = this.ctx;
    for (const anim of this.scoreAnimations) {
      ctx.save();
      ctx.font = `bold ${16 * anim.scale}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillStyle = anim.color;
      ctx.globalAlpha = anim.alpha;
      ctx.shadowColor = anim.color;
      ctx.shadowBlur = 8;
      ctx.fillText(`+${anim.value}`, anim.x, anim.y);
      ctx.restore();
    }
  }

  public drawHUD(oreCount: number, fuel: number, maxFuel: number, score: number, time: number): void {
    const ctx = this.ctx;

    ctx.save();
    ctx.font = '16px monospace';
    ctx.fillStyle = '#00d4ff';
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = 5;
    ctx.textAlign = 'left';
    ctx.fillText(`⬡ 矿石: ${oreCount}`, 20, 35);
    ctx.restore();

    const fuelBarWidth = 200;
    const fuelBarHeight = 12;
    const fuelBarX = (this.canvas.width - fuelBarWidth) / 2;
    const fuelBarY = 25;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(fuelBarX, fuelBarY, fuelBarWidth, fuelBarHeight);

    const fuelPercent = fuel / maxFuel;
    const fuelGradient = ctx.createLinearGradient(fuelBarX, 0, fuelBarX + fuelBarWidth, 0);
    if (fuelPercent > 0.5) {
      fuelGradient.addColorStop(0, '#00ff88');
      fuelGradient.addColorStop(1, '#00cc66');
    } else if (fuelPercent > 0.25) {
      fuelGradient.addColorStop(0, '#ffaa00');
      fuelGradient.addColorStop(1, '#ff8800');
    } else {
      fuelGradient.addColorStop(0, '#ff4444');
      fuelGradient.addColorStop(1, '#ff0000');
    }
    ctx.fillStyle = fuelGradient;
    ctx.fillRect(fuelBarX, fuelBarY, fuelBarWidth * fuelPercent, fuelBarHeight);

    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 1;
    ctx.strokeRect(fuelBarX, fuelBarY, fuelBarWidth, fuelBarHeight);

    ctx.save();
    ctx.font = '10px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`燃料: ${fuel.toFixed(1)}%`, fuelBarX + fuelBarWidth / 2, fuelBarY + fuelBarHeight + 12);
    ctx.restore();

    if (score !== this.currentScore) {
      this.scoreScale = 1.2;
      this.currentScore = score;
    }
    const scaleDelta = this.scoreScale - 1;
    this.scoreScale = 1 + scaleDelta * Math.max(0, 1 - 16 / 200);

    ctx.save();
    const baseFontSize = 20;
    ctx.font = `bold ${baseFontSize * this.scoreScale}px monospace`;
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 8 * this.scoreScale;
    ctx.textAlign = 'right';
    ctx.fillText(`得分: ${score}`, this.canvas.width - 20, 38);
    ctx.restore();

    if (this.portal.active) {
      const timeLeft = Math.max(0, (this.portal.duration - (time - this.portal.appearTime)) / 1000);
      ctx.save();
      ctx.font = '14px monospace';
      ctx.fillStyle = '#ff4444';
      ctx.shadowColor = '#ff4444';
      ctx.shadowBlur = 5;
      ctx.textAlign = 'center';
      const blink = Math.sin(time * 0.01) > 0;
      if (blink) {
        ctx.fillText(`⏱ 传送门开启: ${timeLeft.toFixed(1)}s`, this.canvas.width / 2, 70);
      }
      ctx.restore();
    }
  }

  public drawEdgeGlow(deltaTime: number, time: number): void {
    let glowIntensity = 0;

    if (this.portal.active) {
      glowIntensity = 0.3 + Math.sin(time * 0.003) * 0.15;
    } else if (this.edgeGlow > 0) {
      glowIntensity = this.edgeGlow * 0.3;
      this.edgeGlow = Math.max(0, this.edgeGlow - deltaTime / 2000);
    }

    if (glowIntensity <= 0) return;

    const ctx = this.ctx;
    const gradient = ctx.createRadialGradient(
      this.canvas.width / 2,
      this.canvas.height / 2,
      this.canvas.width * 0.3,
      this.canvas.width / 2,
      this.canvas.height / 2,
      this.canvas.width * 0.5
    );
    gradient.addColorStop(0, 'rgba(255, 68, 68, 0)');
    gradient.addColorStop(1, `rgba(255, 68, 68, ${glowIntensity})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  public triggerScreenFlash(): void {
    this.screenFlash = 1;
  }

  public drawScreenFlash(deltaTime: number): void {
    if (this.screenFlash <= 0) return;

    const ctx = this.ctx;
    ctx.fillStyle = `rgba(255, 255, 255, ${this.screenFlash})`;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.screenFlash = Math.max(0, this.screenFlash - deltaTime / 500);
  }

  public clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  public getPortalState(): Portal {
    return { ...this.portal };
  }
}
