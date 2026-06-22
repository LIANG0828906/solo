import type { Laser } from './collision';
import type { AITeammate, Asteroid, BroadcastSignal, EnergyCapsule, Star } from './types';
import { Player } from './player';
import { GAME_CONFIG } from './config';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private width: number;
  private height: number;
  private minimapWidth: number;
  private minimapHeight: number;
  private minimapX: number;
  private minimapY: number;
  private mouseX: number = 0;
  private mouseY: number = 0;
  private restartButtonHover: boolean = false;
  private restartButtonBrightness: number = 1.0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.width = canvas.width;
    this.height = canvas.height;
    this.minimapWidth = GAME_CONFIG.MINIMAP.WIDTH;
    this.minimapHeight = GAME_CONFIG.MINIMAP.HEIGHT;
    this.minimapX = GAME_CONFIG.MINIMAP.X;
    this.minimapY = GAME_CONFIG.MINIMAP.Y;
  }

  clear(): void {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#0A0A1A');
    gradient.addColorStop(1, '#1A1A3E');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawStars(starsFar: Star[], starsNear: Star[]): void {
    this.ctx.save();
    for (const star of starsFar) {
      this.ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    for (const star of starsNear) {
      this.ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();
  }

  drawPlayer(player: Player): void {
    this.ctx.save();
    this.ctx.translate(player.x, player.y);
    this.ctx.rotate(player.angle);

    this.ctx.shadowColor = '#00FF88';
    this.ctx.shadowBlur = 8;

    this.ctx.fillStyle = '#00FF88';
    this.ctx.beginPath();
    this.ctx.moveTo(18, 0);
    this.ctx.lineTo(-12, -10);
    this.ctx.lineTo(-8, 0);
    this.ctx.lineTo(-12, 10);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = '#1A1A3E';
    this.ctx.beginPath();
    this.ctx.arc(2, 0, 4, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.shadowBlur = 0;
    this.ctx.restore();
  }

  drawAITeammates(teammates: AITeammate[]): void {
    for (const teammate of teammates) {
      this.ctx.save();
      this.ctx.translate(teammate.x, teammate.y);
      this.ctx.rotate(teammate.angle);

      this.ctx.shadowColor = teammate.color;
      this.ctx.shadowBlur = 8;

      this.ctx.fillStyle = teammate.color;
      this.ctx.beginPath();
      this.ctx.moveTo(14, 0);
      this.ctx.lineTo(-10, -8);
      this.ctx.lineTo(-6, 0);
      this.ctx.lineTo(-10, 8);
      this.ctx.closePath();
      this.ctx.fill();

      this.ctx.fillStyle = '#0A0A1A';
      this.ctx.beginPath();
      this.ctx.arc(1, 0, 3, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.shadowBlur = 0;
      this.ctx.restore();
    }
  }

  drawLasers(lasers: Laser[]): void {
    for (const laser of lasers) {
      if (!laser.active) continue;

      this.ctx.save();
      this.ctx.strokeStyle = GAME_CONFIG.LASER.COLOR;
      this.ctx.lineWidth = laser.width;
      this.ctx.lineCap = 'round';
      this.ctx.shadowColor = GAME_CONFIG.LASER.COLOR;
      this.ctx.shadowBlur = 8;

      this.ctx.beginPath();
      this.ctx.moveTo(laser.x, laser.y);
      const endX = laser.x + laser.dx * laser.length;
      const endY = laser.y + laser.dy * laser.length;
      this.ctx.lineTo(endX, endY);
      this.ctx.stroke();

      this.ctx.shadowBlur = 0;
      this.ctx.restore();
    }
  }

  drawAsteroids(asteroids: Asteroid[]): void {
    for (const asteroid of asteroids) {
      if (!asteroid.active) continue;

      this.ctx.save();
      this.ctx.translate(asteroid.x, asteroid.y);
      this.ctx.rotate(asteroid.rotation);

      const baseColor = asteroid.isFragment ? '#8B7355' : '#A0522D';
      this.ctx.fillStyle = baseColor;
      this.ctx.strokeStyle = '#654321';
      this.ctx.lineWidth = 2;

      this.ctx.beginPath();
      const sides = 7;
      for (let i = 0; i < sides; i++) {
        const angle = (i / sides) * Math.PI * 2;
        const variance = 0.75 + Math.sin(i * 2.3) * 0.25;
        const r = asteroid.radius * variance;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) {
          this.ctx.moveTo(x, y);
        } else {
          this.ctx.lineTo(x, y);
        }
      }
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.fillStyle = '#654321';
      this.ctx.beginPath();
      this.ctx.arc(asteroid.radius * 0.3, -asteroid.radius * 0.2, asteroid.radius * 0.15, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.arc(-asteroid.radius * 0.4, asteroid.radius * 0.3, asteroid.radius * 0.1, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.restore();
    }
  }

  drawCapsules(capsules: EnergyCapsule[]): void {
    for (const capsule of capsules) {
      if (!capsule.active) continue;

      this.ctx.save();
      this.ctx.shadowColor = '#00FF00';
      this.ctx.shadowBlur = 8;

      this.ctx.fillStyle = '#00FF00';
      this.ctx.beginPath();
      this.ctx.arc(capsule.x, capsule.y, capsule.radius, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = '#88FF88';
      this.ctx.beginPath();
      this.ctx.arc(capsule.x - 1.5, capsule.y - 1.5, capsule.radius * 0.4, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.shadowBlur = 0;
      this.ctx.restore();
    }
  }

  drawBroadcastSignal(signal: BroadcastSignal | null): void {
    if (!signal || !signal.active) return;

    this.ctx.save();
    this.ctx.strokeStyle = GAME_CONFIG.BROADCAST.COLOR;
    this.ctx.lineWidth = 3;
    this.ctx.shadowColor = GAME_CONFIG.BROADCAST.COLOR;
    this.ctx.shadowBlur = 12;
    this.ctx.globalAlpha = 1 - signal.elapsed / signal.duration;

    this.ctx.beginPath();
    this.ctx.arc(signal.x, signal.y, signal.radius, 0, Math.PI * 2);
    this.ctx.stroke();

    this.ctx.shadowBlur = 0;
    this.ctx.globalAlpha = 1;
    this.ctx.restore();
  }

  drawUI(score: number, energy: number, maxEnergy: number): void {
    this.ctx.save();

    const uiY = this.minimapY + this.minimapHeight + 15;

    this.ctx.font = 'bold 16px "Segoe UI", Tahoma, sans-serif';
    this.ctx.fillStyle = '#E0E0E0';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`得分: ${score}`, 10, uiY);

    const energyBarWidth = 150;
    const energyBarHeight = 12;
    const energyBarX = 10;
    const energyBarY = uiY + 15;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(energyBarX, energyBarY, energyBarWidth, energyBarHeight);

    const energyPercent = energy / maxEnergy;
    const energyColor = energyPercent > 0.3 ? '#4CAF50' : '#F44336';
    this.ctx.fillStyle = energyColor;
    this.ctx.fillRect(energyBarX, energyBarY, energyBarWidth * energyPercent, energyBarHeight);

    this.ctx.strokeStyle = '#666';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(energyBarX, energyBarY, energyBarWidth, energyBarHeight);

    this.ctx.font = '12px "Segoe UI", Tahoma, sans-serif';
    this.ctx.fillStyle = '#E0E0E0';
    this.ctx.fillText(`能量: ${Math.floor(energy)}/${maxEnergy}`, energyBarX + 5, energyBarY + 28);

    this.ctx.restore();
  }

  drawMinimap(
    player: Player,
    teammates: AITeammate[],
    asteroids: Asteroid[]
  ): void {
    this.ctx.save();

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    this.ctx.beginPath();
    this.roundRect(this.minimapX, this.minimapY, this.minimapWidth, this.minimapHeight, 8);
    this.ctx.fill();

    this.ctx.strokeStyle = 'rgba(78, 205, 196, 0.5)';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    const scaleX = this.minimapWidth / this.width;
    const scaleY = this.minimapHeight / this.height;

    for (const asteroid of asteroids) {
      if (!asteroid.active) continue;
      const mx = this.minimapX + asteroid.x * scaleX;
      const my = this.minimapY + asteroid.y * scaleY;
      this.ctx.fillStyle = '#A0522D';
      this.ctx.beginPath();
      this.ctx.arc(mx, my, Math.max(2, asteroid.radius * scaleX), 0, Math.PI * 2);
      this.ctx.fill();
    }

    for (const teammate of teammates) {
      const mx = this.minimapX + teammate.x * scaleX;
      const my = this.minimapY + teammate.y * scaleY;
      this.ctx.fillStyle = teammate.color;
      this.ctx.beginPath();
      this.ctx.arc(mx, my, 4, 0, Math.PI * 2);
      this.ctx.fill();
    }

    const px = this.minimapX + player.x * scaleX;
    const py = this.minimapY + player.y * scaleY;
    this.ctx.fillStyle = '#00FF88';
    this.ctx.beginPath();
    this.ctx.arc(px, py, 5, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(this.minimapX, this.minimapY, this.minimapWidth, this.minimapHeight);

    this.ctx.restore();
  }

  drawGameOver(score: number): void {
    this.ctx.save();

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.font = 'bold 32px "Segoe UI", Tahoma, sans-serif';
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('游戏结束', this.width / 2, this.height / 2 - 60);

    this.ctx.font = '20px "Segoe UI", Tahoma, sans-serif';
    this.ctx.fillStyle = '#E0E0E0';
    this.ctx.fillText(`最终得分: ${score}`, this.width / 2, this.height / 2 - 20);

    const buttonWidth = 140;
    const buttonHeight = 40;
    const buttonX = this.width / 2 - buttonWidth / 2;
    const buttonY = this.height / 2 + 20;

    const baseColor = { r: 76, g: 175, b: 80 };
    const brightness = this.restartButtonBrightness;
    const r = Math.min(255, Math.floor(baseColor.r * brightness));
    const g = Math.min(255, Math.floor(baseColor.g * brightness));
    const b = Math.min(255, Math.floor(baseColor.b * brightness));
    const buttonColor = `rgb(${r}, ${g}, ${b})`;

    this.ctx.fillStyle = buttonColor;
    this.ctx.beginPath();
    this.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, 8);
    this.ctx.fill();

    this.ctx.font = 'bold 16px "Segoe UI", Tahoma, sans-serif';
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('重新开始', this.width / 2, buttonY + buttonHeight / 2);
    this.ctx.textBaseline = 'alphabetic';

    this.ctx.restore();
  }

  isRestartButtonClicked(mouseX: number, mouseY: number): boolean {
    const buttonWidth = 140;
    const buttonHeight = 40;
    const buttonX = this.width / 2 - buttonWidth / 2;
    const buttonY = this.height / 2 + 20;

    return (
      mouseX >= buttonX &&
      mouseX <= buttonX + buttonWidth &&
      mouseY >= buttonY &&
      mouseY <= buttonY + buttonHeight
    );
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y);
    this.ctx.lineTo(x + w - r, y);
    this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    this.ctx.lineTo(x + w, y + h - r);
    this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.ctx.lineTo(x + r, y + h);
    this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    this.ctx.lineTo(x, y + r);
    this.ctx.quadraticCurveTo(x, y, x + r, y);
    this.ctx.closePath();
  }

  updateLasers(lasers: Laser[], deltaTime: number): void {
    const speedFactor = deltaTime / 16.67;
    for (const laser of lasers) {
      if (!laser.active) continue;
      
      laser.x += laser.dx * 8 * speedFactor;
      laser.y += laser.dy * 8 * speedFactor;

      if (
        laser.x < -50 ||
        laser.x > this.width + 50 ||
        laser.y < -50 ||
        laser.y > this.height + 50
      ) {
        laser.active = false;
      }
    }
  }

  updateStars(starsFar: Star[], starsNear: Star[], deltaTime: number): void {
    const speedFactor = deltaTime / 16.67;
    
    for (const star of starsFar) {
      star.x -= star.speed * speedFactor;
      if (star.x < 0) {
        star.x = this.width;
        star.y = Math.random() * this.height;
      }
    }

    for (const star of starsNear) {
      star.x -= star.speed * speedFactor;
      if (star.x < 0) {
        star.x = this.width;
        star.y = Math.random() * this.height;
      }
    }
  }

  generateStars(starsFar: Star[], starsNear: Star[]): void {
    starsFar.length = 0;
    starsNear.length = 0;

    const opacityRange = GAME_CONFIG.STARS.MAX_OPACITY - GAME_CONFIG.STARS.MIN_OPACITY;

    for (let i = 0; i < GAME_CONFIG.STARS.FAR_COUNT; i++) {
      starsFar.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: GAME_CONFIG.STARS.FAR_SIZE,
        speed: GAME_CONFIG.STARS.FAR_SPEED,
        opacity: GAME_CONFIG.STARS.MIN_OPACITY + Math.random() * opacityRange
      });
    }

    for (let i = 0; i < GAME_CONFIG.STARS.NEAR_COUNT; i++) {
      starsNear.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: GAME_CONFIG.STARS.NEAR_SIZE,
        speed: GAME_CONFIG.STARS.NEAR_SPEED,
        opacity: GAME_CONFIG.STARS.MIN_OPACITY + Math.random() * opacityRange
      });
    }
  }

  updateMousePosition(mouseX: number, mouseY: number): void {
    this.mouseX = mouseX;
    this.mouseY = mouseY;
    this.restartButtonHover = this.isRestartButtonClicked(mouseX, mouseY);
  }

  updateHoverEffects(deltaTime: number): void {
    const targetBrightness = this.restartButtonHover ? 1.1 : 1.0;
    const transitionSpeed = 0.005;
    const diff = targetBrightness - this.restartButtonBrightness;
    if (Math.abs(diff) > 0.001) {
      this.restartButtonBrightness += diff * transitionSpeed * deltaTime;
    } else {
      this.restartButtonBrightness = targetBrightness;
    }
  }

  isMouseOverRestartButton(): boolean {
    return this.restartButtonHover;
  }
}
