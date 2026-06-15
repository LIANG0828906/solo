import { GameState } from './gameManager';
import { Ship, Bullet, Laser, Explosion } from './entities';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2D context');
    this.ctx = ctx;
  }

  render(state: GameState, time: number) {
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    this.drawBackground(w, h);
    this.drawStars(state, time);
    this.drawBulletSources(state);
    this.drawBullets(state);
    this.drawLasers(state);
    this.drawExplosions(state);
    this.drawShip(state.ship);
    this.drawEdgeFlash(state, w, h);
    this.drawHUD(state, w, h);
    this.drawNotification(state, w);

    if (state.isGameOver) {
      this.drawGameOverFlash(state, w, h);
      if (state.gameOverFlash <= 0) {
        this.drawGameOverPanel(state, w, h);
      }
    }
  }

  private drawBackground(w: number, h: number) {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#0B0B2A');
    gradient.addColorStop(1, '#1A1A3A');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, w, h);
  }

  private drawStars(state: GameState, time: number) {
    const { ctx } = this;
    for (const star of state.stars) {
      const brightness = star.getCurrentBrightness(time);
      ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
      ctx.fillRect(star.x, star.y, 1, 1);
    }
  }

  private drawBulletSources(state: GameState) {
    const { ctx } = this;
    for (const src of state.sources) {
      if (!src.active) continue;
      ctx.save();
      ctx.translate(src.x, src.y);
      const pulse = Math.sin(state.survivalTime * 4) * 0.3 + 0.7;
      ctx.fillStyle = `rgba(255, 80, 80, ${pulse * 0.6})`;
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FF4444';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawBullets(state: GameState) {
    const { ctx } = this;
    for (const bullet of state.bullets) {
      ctx.save();
      ctx.shadowColor = bullet.color;
      ctx.shadowBlur = 12;
      ctx.fillStyle = bullet.color;
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();
      ctx.arc(bullet.x - bullet.radius * 0.3, bullet.y - bullet.radius * 0.3, bullet.radius * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawLasers(state: GameState) {
    const { ctx } = this;
    for (const laser of state.lasers) {
      const alpha = laser.getAlpha();
      ctx.save();
      ctx.strokeStyle = `rgba(100, 200, 255, ${alpha})`;
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.shadowColor = '#3399FF';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.moveTo(laser.startX, laser.startY);
      ctx.lineTo(laser.targetX, laser.targetY);
      ctx.stroke();

      ctx.strokeStyle = `rgba(200, 230, 255, ${alpha})`;
      ctx.lineWidth = 3;
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.moveTo(laser.startX, laser.startY);
      ctx.lineTo(laser.targetX, laser.targetY);
      ctx.stroke();
      ctx.restore();
    }
  }

  private drawExplosions(state: GameState) {
    const { ctx } = this;
    for (const explosion of state.explosions) {
      const alpha = explosion.getAlpha();
      for (const p of explosion.particles) {
        ctx.save();
        ctx.fillStyle = `rgba(255, 180, 50, ${alpha})`;
        ctx.shadowColor = '#FF8800';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  private drawShip(ship: Ship) {
    const { ctx } = this;
    ctx.save();
    ctx.translate(ship.x, ship.y);

    if (ship.isHit && Math.floor(ship.hitFlashCount) % 2 === 1) {
      ctx.globalAlpha = 0.3;
    }

    const glow = ctx.createRadialGradient(0, -ship.size * 0.4, 0, 0, -ship.size * 0.4, ship.size * 0.6);
    glow.addColorStop(0, 'rgba(100, 200, 255, 0.9)');
    glow.addColorStop(0.5, 'rgba(100, 200, 255, 0.3)');
    glow.addColorStop(1, 'rgba(100, 200, 255, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, -ship.size * 0.4, ship.size * 0.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#4488FF';
    ctx.strokeStyle = '#88CCFF';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#4488FF';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0, -ship.size * 0.6);
    ctx.lineTo(-ship.size * 0.5, ship.size * 0.4);
    ctx.lineTo(ship.size * 0.5, ship.size * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#AADDFF';
    ctx.beginPath();
    ctx.arc(0, 0, ship.size * 0.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawEdgeFlash(state: GameState, w: number, h: number) {
    if (!state.edgeFlash) return;
    const { ctx } = this;
    const t = state.edgeFlash.timer / 0.2;
    const alpha = t * 0.5;
    const gradient = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.7);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, state.edgeFlash.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba').replace('#', ''));
    ctx.save();
    ctx.fillStyle = `rgba(51, 153, 255, ${alpha})`;
    ctx.globalCompositeOperation = 'screen';
    const flashW = 30;
    ctx.fillRect(0, 0, w, flashW);
    ctx.fillRect(0, h - 60 - flashW, w, flashW);
    ctx.fillRect(0, 0, flashW, h);
    ctx.fillRect(w - flashW, 0, flashW, h);
    ctx.restore();
  }

  private drawHUD(state: GameState, w: number, h: number) {
    const { ctx } = this;
    const barH = 60;
    const barY = h - barH;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.67)';
    ctx.fillRect(0, barY, w, barH);

    ctx.font = '24px "Segoe UI", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(`得分: ${state.score}`, 24, barY + barH / 2);

    const shieldW = 200;
    const shieldH = 16;
    const shieldX = (w - shieldW) / 2;
    const shieldY = barY + (barH - shieldH) / 2;

    ctx.fillStyle = '#333344';
    this.roundRect(shieldX, shieldY, shieldW, shieldH, 4, true, false);

    const shieldRatio = state.ship.shield / 100;
    const grad = ctx.createLinearGradient(shieldX, 0, shieldX + shieldW, 0);
    grad.addColorStop(0, '#00FF88');
    grad.addColorStop(1, '#FF3355');
    ctx.fillStyle = grad;
    this.roundRect(shieldX, shieldY, shieldW * shieldRatio, shieldH, 4, true, false);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    this.roundRect(shieldX, shieldY, shieldW, shieldH, 4, false, true);

    ctx.font = '20px "Segoe UI", sans-serif';
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'right';
    ctx.fillText(`难度 Lv.${state.difficultyLevel}`, w - 24, barY + barH / 2);
  }

  private drawNotification(state: GameState, w: number) {
    if (!state.notification) return;
    const { ctx } = this;
    const t = state.notification.timer;
    const alpha = Math.min(1, t);
    ctx.save();
    ctx.font = 'bold 28px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 10;
    ctx.fillText(state.notification.text, w / 2, 30);
    ctx.restore();
  }

  private drawGameOverFlash(state: GameState, w: number, h: number) {
    if (state.gameOverFlash <= 0) return;
    const { ctx } = this;
    const alpha = Math.min(1, state.gameOverFlash / 0.5);
    ctx.fillStyle = `rgba(139, 0, 0, ${alpha * 0.8})`;
    ctx.fillRect(0, 0, w, h);
  }

  private drawGameOverPanel(state: GameState, w: number, h: number) {
    const { ctx } = this;
    const panelW = 420;
    const panelH = 280;
    const panelX = (w - panelW) / 2;
    const panelY = (h - 60 - panelH) / 2;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = '#0F1B3D';
    this.roundRect(panelX, panelY, panelW, panelH, 16, true, false);
    ctx.shadowBlur = 0;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 2;
    this.roundRect(panelX + 4, panelY + 4, panelW - 8, panelH - 8, 12, false, true);

    ctx.textAlign = 'center';
    ctx.font = '36px "Segoe UI", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('任务结束', panelX + panelW / 2, panelY + 70);

    ctx.font = 'bold 48px "Segoe UI", sans-serif';
    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 15;
    ctx.fillText(`${state.score}`, panelX + panelW / 2, panelY + 155);
    ctx.shadowBlur = 0;

    ctx.font = '16px "Segoe UI", sans-serif';
    ctx.fillStyle = '#AAAAAA';
    ctx.fillText('按空格键重新开始', panelX + panelW / 2, panelY + 220);
    ctx.restore();
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number, fill: boolean, stroke: boolean) {
    const { ctx } = this;
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
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }
}
