import { EnergyManager } from './energySystem';
import { GameObjectManager, Particle, Asteroid, EnemyShip, TrailParticle } from './gameObjects';

interface Star {
  x: number;
  y: number;
  size: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinkleOffset: number;
}

export class UIRenderer {
  private stars: Star[] = [];
  private canvasW: number = 0;
  private canvasH: number = 0;
  private time: number = 0;
  private interceptPulse: number = 0;
  private dirtyRects: { x: number; y: number; w: number; h: number }[] = [];

  initStars(w: number, h: number): void {
    this.canvasW = w;
    this.canvasH = h;
    this.stars = [];
    for (let i = 0; i < 200; i++) {
      this.stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: 1 + Math.random() * 2,
        baseAlpha: 0.3 + Math.random() * 0.7,
        twinkleSpeed: 0.5 + Math.random() * 2,
        twinkleOffset: Math.random() * Math.PI * 2,
      });
    }
  }

  addDirtyRect(x: number, y: number, w: number, h: number): void {
    this.dirtyRects.push({ x, y, w, h });
  }

  clearDirtyRects(): void {
    this.dirtyRects = [];
  }

  drawBackground(ctx: CanvasRenderingContext2D): void {
    const cx = this.canvasW / 2;
    const cy = this.canvasH / 2;
    const maxR = Math.max(this.canvasW, this.canvasH) * 0.8;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
    grad.addColorStop(0, '#0B1A3A');
    grad.addColorStop(0.5, '#0A1020');
    grad.addColorStop(1, '#0B0E14');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.canvasW, this.canvasH);
  }

  drawStars(ctx: CanvasRenderingContext2D): void {
    for (const s of this.stars) {
      const alpha = s.baseAlpha * (0.6 + 0.4 * Math.sin(this.time * s.twinkleSpeed + s.twinkleOffset));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawEnergyPanel(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    label: string, color: string,
    current: number, max: number,
    pulsePhase: number, isActive: boolean
  ): void {
    const panelW = 240;
    const panelH = 70;
    const barW = 200;
    const barH = 20;

    ctx.save();
    ctx.fillStyle = 'rgba(26, 34, 53, 0.7)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;

    ctx.shadowColor = color;
    ctx.shadowBlur = isActive ? 12 : 4;

    ctx.beginPath();
    ctx.roundRect(x, y, panelW, panelH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;

    ctx.font = '600 13px "Courier New", monospace';
    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.fillText(label, x + 12, y + 20);

    const barX = x + 12;
    const barY = y + 32;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 3);
    ctx.fill();

    const fillRatio = Math.max(0, Math.min(1, current / max));
    const fillW = fillRatio * barW;
    const barGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    barGrad.addColorStop(0, color);
    barGrad.addColorStop(1, this._lightenColor(color, 30));
    ctx.fillStyle = barGrad;
    ctx.beginPath();
    ctx.roundRect(barX, barY, fillW, barH, 3);
    ctx.fill();

    ctx.font = '700 14px "Courier New", monospace';
    ctx.fillStyle = '#E0E0E0';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(current)}/${Math.round(max)}`, x + panelW - 12, y + barH + 30);

    if (isActive) {
      const pulseAlpha = 0.1 + 0.5 * (0.5 + 0.5 * Math.sin(pulsePhase));
      const iconX = x + panelW - 30;
      const iconY = y + 18;
      ctx.beginPath();
      ctx.arc(iconX, iconY, 8, 0, Math.PI * 2);
      ctx.fillStyle = color.replace(')', `,${pulseAlpha})`).replace('rgb', 'rgba');
      const rgbaColor = this._hexToRgba(color, pulseAlpha);
      ctx.fillStyle = rgbaColor;
      ctx.fill();
    }

    ctx.restore();
  }

  drawEnergyPanels(ctx: CanvasRenderingContext2D, energy: EnergyManager): void {
    const isNarrow = this.canvasW < 900;
    let shieldX: number, shieldY: number;
    let engineX: number, engineY: number;
    let weaponX: number, weaponY: number;

    if (isNarrow) {
      shieldX = this.canvasW / 2 - 125;
      shieldY = 10;
      engineX = this.canvasW / 2 - 125;
      engineY = 90;
      weaponX = this.canvasW / 2 - 125;
      weaponY = 170;
    } else {
      shieldX = 30;
      shieldY = 30;
      engineX = this.canvasW / 2 - 125;
      engineY = this.canvasH - 150;
      weaponX = this.canvasW - 270;
      weaponY = 30;
    }

    this.drawEnergyPanel(ctx, shieldX, shieldY, 'SHIELD', '#00BFFF',
      energy.shieldEnergy, energy.maxEnergy * energy.shieldRatio || 1,
      energy.pulsePhase, energy.shieldActive);
    this.drawEnergyPanel(ctx, engineX, engineY, 'ENGINE', '#FF8C00',
      energy.engineEnergy, energy.maxEnergy * energy.engineRatio || 1,
      energy.pulsePhase + Math.PI * 0.66, energy.engineActive);
    this.drawEnergyPanel(ctx, weaponX, weaponY, 'WEAPON', '#FF4500',
      energy.weaponEnergy, energy.maxEnergy * energy.weaponRatio || 1,
      energy.pulsePhase + Math.PI * 1.33, energy.weaponActive);
  }

  drawJoystick(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, handleX: number, handleY: number): void {
    const radius = 80;

    ctx.save();

    ctx.strokeStyle = 'rgba(100, 140, 200, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(26, 34, 53, 0.4)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(100, 140, 200, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX - radius, centerY);
    ctx.lineTo(centerX + radius, centerY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius);
    ctx.lineTo(centerX, centerY + radius);
    ctx.stroke();

    ctx.font = '10px "Courier New", monospace';
    ctx.fillStyle = 'rgba(0, 191, 255, 0.5)';
    ctx.textAlign = 'center';
    ctx.fillText('SHD', centerX - radius + 18, centerY - 4);
    ctx.fillStyle = 'rgba(255, 140, 0, 0.5)';
    ctx.fillText('ENG', centerX + radius - 18, centerY - 4);
    ctx.fillStyle = 'rgba(255, 69, 0, 0.5)';
    ctx.fillText('WPN', centerX, centerY - radius + 14);

    const dist = Math.sqrt(handleX * handleX + handleY * handleY);
    const clampedDist = Math.min(dist, radius);
    const angle = Math.atan2(handleY, handleX);
    const hx = centerX + Math.cos(angle) * clampedDist;
    const hy = centerY + Math.sin(angle) * clampedDist;

    ctx.shadowColor = '#00BFFF';
    ctx.shadowBlur = 8;
    ctx.fillStyle = 'rgba(200, 220, 255, 0.6)';
    ctx.strokeStyle = 'rgba(0, 150, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(hx, hy, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  drawPlayerShip(ctx: CanvasRenderingContext2D, x: number, y: number, shieldActive: boolean, engineActive: boolean, shieldHit: boolean): void {
    ctx.save();

    if (shieldActive && !shieldHit) {
      ctx.strokeStyle = 'rgba(0, 191, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00BFFF';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(x, y, 30, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    if (engineActive) {
      const flameLen = 12 + Math.random() * 8;
      ctx.fillStyle = 'rgba(255, 140, 0, 0.7)';
      ctx.beginPath();
      ctx.moveTo(x - 6, y + 12);
      ctx.lineTo(x, y + 12 + flameLen);
      ctx.lineTo(x + 6, y + 12);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 220, 100, 0.5)';
      ctx.beginPath();
      ctx.moveTo(x - 3, y + 12);
      ctx.lineTo(x, y + 12 + flameLen * 0.6);
      ctx.lineTo(x + 3, y + 12);
      ctx.fill();
    }

    ctx.fillStyle = '#B0C4DE';
    ctx.strokeStyle = '#E0E8F0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y - 16);
    ctx.lineTo(x - 12, y + 12);
    ctx.lineTo(x, y + 6);
    ctx.lineTo(x + 12, y + 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#4FC3F7';
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawAsteroid(ctx: CanvasRenderingContext2D, a: Asteroid): void {
    if (!a.active) return;
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.rotation);

    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, a.size / 2);
    grad.addColorStop(0, '#8B7D6B');
    grad.addColorStop(0.6, '#6B5B4B');
    grad.addColorStop(1, '#4A3C2C');
    ctx.fillStyle = grad;
    ctx.strokeStyle = 'rgba(139, 115, 85, 0.5)';
    ctx.lineWidth = 1;

    ctx.beginPath();
    const vx = a.vertices;
    if (vx.length >= 4) {
      ctx.moveTo(vx[0] * a.size / 2, vx[1] * a.size / 2);
      for (let i = 2; i < vx.length; i += 2) {
        ctx.lineTo(vx[i] * a.size / 2, vx[i + 1] * a.size / 2);
      }
    } else {
      ctx.arc(0, 0, a.size / 2, 0, Math.PI * 2);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  drawEnemyShip(ctx: CanvasRenderingContext2D, e: EnemyShip): void {
    if (!e.active) return;
    ctx.save();
    ctx.translate(e.x, e.y);

    const facingRight = e.vx > 0;
    if (!facingRight) {
      ctx.scale(-1, 1);
    }

    ctx.fillStyle = '#8B0000';
    ctx.strokeStyle = '#B22222';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(-15, -12);
    ctx.lineTo(-10, 0);
    ctx.lineTo(-15, 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#4A0000';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawTrailParticle(ctx: CanvasRenderingContext2D, t: TrailParticle): void {
    if (!t.active) return;
    const alpha = t.life / t.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha * 0.8;
    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = '#FF8C00';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.size * alpha, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawParticle(ctx: CanvasRenderingContext2D, p: Particle): void {
    if (!p.active) return;
    const alpha = p.life / p.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawInterceptButtons(ctx: CanvasRenderingContext2D, targets: { x: number; y: number; size: number; type: string }[]): void {
    this.interceptPulse += 0.05;
    for (const t of targets) {
      const alpha = 0.4 + 0.3 * Math.sin(this.interceptPulse * 3);
      ctx.save();
      ctx.strokeStyle = `rgba(255, 69, 0, ${alpha})`;
      ctx.lineWidth = 2;
      ctx.shadowColor = '#FF4500';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(t.x, t.y - t.size / 2 - 25, 25, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = `rgba(255, 50, 50, ${alpha * 0.3})`;
      ctx.beginPath();
      ctx.arc(t.x, t.y - t.size / 2 - 25, 25, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = 'bold 10px "Courier New", monospace';
      ctx.fillStyle = `rgba(255, 100, 100, ${alpha + 0.3})`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('FIRE', t.x, t.y - t.size / 2 - 25);

      ctx.restore();
    }
  }

  drawWeaponLine(ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number): void {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 69, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 8]);
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  drawHUD(ctx: CanvasRenderingContext2D, score: number, energy: number, maxEnergy: number): void {
    ctx.save();
    ctx.font = '600 16px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#8AA0C0';
    ctx.fillText(`SCORE: ${score}`, this.canvasW / 2, 24);

    const energyPct = energy / maxEnergy;
    const energyColor = energyPct > 0.3 ? '#00BFFF' : energyPct > 0.1 ? '#FF8C00' : '#FF4500';
    ctx.fillStyle = energyColor;
    ctx.font = '600 12px "Courier New", monospace';
    ctx.fillText(`ENERGY: ${Math.round(energy)}`, this.canvasW / 2, 44);
    ctx.restore();
  }

  drawGameOver(ctx: CanvasRenderingContext2D, score: number): void {
    ctx.save();
    ctx.fillStyle = 'rgba(11, 14, 20, 0.85)';
    ctx.fillRect(0, 0, this.canvasW, this.canvasH);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = '700 48px "Courier New", monospace';
    ctx.fillStyle = '#FF4500';
    ctx.shadowColor = '#FF4500';
    ctx.shadowBlur = 20;
    ctx.fillText('VOID CLAIMED', this.canvasW / 2, this.canvasH / 2 - 40);
    ctx.shadowBlur = 0;

    ctx.font = '400 20px "Courier New", monospace';
    ctx.fillStyle = '#8AA0C0';
    ctx.fillText(`Final Score: ${score}`, this.canvasW / 2, this.canvasH / 2 + 20);

    ctx.font = '400 14px "Courier New", monospace';
    ctx.fillStyle = '#5A7090';
    ctx.fillText('Click to restart', this.canvasW / 2, this.canvasH / 2 + 60);

    ctx.restore();
  }

  drawTitle(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = '700 42px "Courier New", monospace';
    ctx.fillStyle = '#00BFFF';
    ctx.shadowColor = '#00BFFF';
    ctx.shadowBlur = 25;
    ctx.fillText('VOID VESSEL', this.canvasW / 2, this.canvasH / 2 - 60);
    ctx.shadowBlur = 0;

    ctx.font = '400 16px "Courier New", monospace';
    ctx.fillStyle = '#8AA0C0';
    ctx.fillText('Energy Allocation & Survival', this.canvasW / 2, this.canvasH / 2 - 15);

    ctx.font = '400 12px "Courier New", monospace';
    ctx.fillStyle = '#5A7090';
    ctx.fillText('Drag joystick to allocate energy', this.canvasW / 2, this.canvasH / 2 + 30);
    ctx.fillText('SHIELD (left) | ENGINE (right) | WEAPON (up)', this.canvasW / 2, this.canvasH / 2 + 50);

    const blink = Math.sin(this.time * 2) > 0;
    if (blink) {
      ctx.font = '600 16px "Courier New", monospace';
      ctx.fillStyle = '#00BFFF';
      ctx.fillText('[ CLICK TO START ]', this.canvasW / 2, this.canvasH / 2 + 90);
    }

    ctx.restore();
  }

  render(ctx: CanvasRenderingContext2D, energy: EnergyManager, objects: GameObjectManager, gameState: string, joystickX: number, joystickY: number): void {
    this.time += 1 / 60;

    this.drawBackground(ctx);
    this.drawStars(ctx);

    if (gameState === 'title') {
      this.drawTitle(ctx);
      const jcx = this.canvasW / 2;
      const jcy = this.canvasH - 100;
      this.drawJoystick(ctx, jcx, jcy, 0, 0);
      return;
    }

    if (gameState === 'gameover') {
      this.drawGameOver(ctx, objects.score);
      return;
    }

    const trails = objects.trailPool.getActive();
    for (const t of trails) {
      this.drawTrailParticle(ctx, t);
    }

    const asteroids = objects.asteroidPool.getActive();
    for (const a of asteroids) {
      this.drawAsteroid(ctx, a);
    }

    const enemies = objects.enemyPool.getActive();
    for (const e of enemies) {
      this.drawEnemyShip(ctx, e);
    }

    if (energy.weaponActive) {
      let nearest: any = null;
      let nearDist = Infinity;
      for (const e of enemies) {
        const dx = e.x - objects.playerX;
        const dy = e.y - objects.playerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < nearDist) {
          nearDist = dist;
          nearest = e;
        }
      }
      if (nearest && nearDist < 300) {
        this.drawWeaponLine(ctx, objects.playerX, objects.playerY, nearest.x, nearest.y);
      }
    }

    this.drawPlayerShip(ctx, objects.playerX, objects.playerY, energy.shieldActive, energy.engineActive, objects.shieldHit);

    const particles = objects.particlePool.getActive();
    for (const p of particles) {
      this.drawParticle(ctx, p);
    }

    this.drawInterceptButtons(ctx, objects.interceptTargets);
    this.drawEnergyPanels(ctx, energy);

    const jcx = this.canvasW < 900 ? this.canvasW / 2 : this.canvasW / 2;
    const jcy = this.canvasH - 100;
    this.drawJoystick(ctx, jcx, jcy, joystickX, joystickY);

    this.drawHUD(ctx, objects.score, energy.totalEnergy, energy.maxEnergy);
  }

  private _hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  private _lightenColor(hex: string, amount: number): string {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    r = Math.min(255, r + amount);
    g = Math.min(255, g + amount);
    b = Math.min(255, b + amount);
    return `rgb(${r},${g},${b})`;
  }
}
