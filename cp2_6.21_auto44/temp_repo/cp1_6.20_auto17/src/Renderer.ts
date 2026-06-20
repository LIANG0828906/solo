import type { PlayerState, Bullet, Particle, Debris, Crystal } from './Player';
import type { EnemyEntity } from './Enemy';

interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinklePhase: number;
  twinkleSpeed: number;
}

export interface RenderData {
  gameState: 'playing' | 'gameover';
  player: PlayerState;
  bullets: Bullet[];
  particles: Particle[];
  debris: Debris[];
  enemies: EnemyEntity[];
  asteroids: EnemyEntity[];
  crystals: Crystal[];
  shieldButtonActive: boolean;
  shieldCooldownPercent: number;
  mouseX: number;
  mouseY: number;
  time: number;
}

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private stars: Star[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.resize(canvas.width, canvas.height);
    this.initStars();
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.initStars();
  }

  private initStars(): void {
    this.stars = [];
    const count = Math.floor((this.canvas.width * this.canvas.height) / 8000);
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: 0.5 + Math.random() * 2,
        brightness: 0.3 + Math.random() * 0.7,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.5 + Math.random() * 2
      });
    }
  }

  render(data: RenderData): void {
    const ctx = this.ctx;
    const { width, height } = this.canvas;

    ctx.clearRect(0, 0, width, height);
    this.drawBackground(data.time);

    this.drawCrystals(data.crystals, data.time);
    this.drawAsteroids(data.asteroids);
    this.drawEnemies(data.enemies);
    this.drawBullets(data.bullets);

    if (data.player.active) {
      this.drawPlayer(data.player, data.time);
    }

    this.drawParticles(data.particles);
    this.drawDebris(data.debris);
    this.drawHUD(data);
    this.drawShieldButton(data);

    if (data.gameState === 'gameover') {
      this.drawGameOver(data);
    }
  }

  private drawBackground(time: number): void {
    const ctx = this.ctx;
    const { width, height } = this.canvas;

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#0a0e1a');
    gradient.addColorStop(1, '#1a1f3a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    for (const star of this.stars) {
      const twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase) * 0.3 + 0.7;
      const alpha = star.brightness * twinkle;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawPlayer(player: PlayerState, time: number): void {
    const ctx = this.ctx;
    const { x, y, width, height, engineFlamePhase } = player;

    ctx.save();
    ctx.translate(x, y);

    if (player.shieldActive) {
      const shieldPhase = time * 3;
      const pulse = Math.sin(shieldPhase * 2) * 0.15 + 1;
      const shieldRadius = Math.max(width, height) * 1.3 * pulse;

      ctx.save();
      ctx.rotate(shieldPhase * 0.5);

      const shieldGradient = ctx.createRadialGradient(0, 0, shieldRadius * 0.5, 0, 0, shieldRadius);
      shieldGradient.addColorStop(0, 'rgba(0, 255, 255, 0)');
      shieldGradient.addColorStop(0.7, 'rgba(0, 255, 255, 0.2)');
      shieldGradient.addColorStop(1, 'rgba(138, 43, 226, 0.4)');
      ctx.fillStyle = shieldGradient;
      ctx.beginPath();
      ctx.arc(0, 0, shieldRadius, -Math.PI / 2, Math.PI / 2);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, shieldRadius, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();

      ctx.restore();
    }

    const flameIntensity = (Math.sin(engineFlamePhase) + 1) * 0.5;
    const flameLength = 12 + flameIntensity * 8;
    const flameGradient = ctx.createLinearGradient(0, height / 2, 0, height / 2 + flameLength);
    flameGradient.addColorStop(0, '#00ffff');
    flameGradient.addColorStop(0.5, '#8a2be2');
    flameGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = flameGradient;
    ctx.beginPath();
    ctx.moveTo(-6, height / 2 - 2);
    ctx.lineTo(6, height / 2 - 2);
    ctx.lineTo(0, height / 2 + flameLength);
    ctx.closePath();
    ctx.fill();

    this.drawPixelShip(ctx, width, height);

    ctx.restore();
  }

  private drawPixelShip(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const px = 4;
    const halfW = w / 2;
    const halfH = h / 2;

    const shipPattern = [
      '    CC    ',
      '   CCCC   ',
      '   CCCC   ',
      '  CBCCBC  ',
      '  CBBBBC  ',
      ' CBCCCCBC ',
      ' CBCCCCBC ',
      'CCCCCCCCCC',
      'CWC C  CWC',
      'C        C',
    ];

    ctx.save();
    ctx.translate(-halfW, -halfH);

    for (let row = 0; row < shipPattern.length; row++) {
      const line = shipPattern[row];
      for (let col = 0; col < line.length; col++) {
        const char = line[col];
        let color: string | null = null;
        switch (char) {
          case 'C': color = '#00e5ff'; break;
          case 'B': color = '#0088aa'; break;
          case 'W': color = '#ffffff'; break;
        }
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(col * px, row * px, px, px);
        }
      }
    }

    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(halfW - 4, halfH - 14, 8, 8);
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  private drawEnemies(enemies: EnemyEntity[]): void {
    const ctx = this.ctx;
    for (const enemy of enemies) {
      if (!enemy.active) continue;
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      ctx.rotate(enemy.rotation * Math.PI / 180);
      this.drawPixelEnemy(ctx, enemy.width, enemy.height);
      ctx.restore();
    }
  }

  private drawPixelEnemy(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const px = 4;
    const halfW = w / 2;
    const halfH = h / 2;

    const enemyPattern = [
      '  RRRR  ',
      ' RRYYRR ',
      'RRYRRYRR',
      'RYRWWRYR',
      'RYRWWRYR',
      'RRYRRYRR',
      ' RRYYRR ',
      '  RRRR  ',
    ];

    ctx.save();
    ctx.translate(-halfW, -halfH + 2);

    for (let row = 0; row < enemyPattern.length; row++) {
      const line = enemyPattern[row];
      for (let col = 0; col < line.length; col++) {
        const char = line[col];
        let color: string | null = null;
        switch (char) {
          case 'R': color = '#ff4444'; break;
          case 'Y': color = '#ffaa00'; break;
          case 'W': color = '#ffffff'; break;
        }
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(col * px, row * px, px, px);
        }
      }
    }

    ctx.shadowColor = '#ff4444';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(halfW - 8, halfH - 6, 6, 6);
    ctx.fillRect(halfW + 2, halfH - 6, 6, 6);
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  private drawAsteroids(asteroids: EnemyEntity[]): void {
    const ctx = this.ctx;
    for (const asteroid of asteroids) {
      if (!asteroid.active || asteroid.vertices.length === 0) continue;

      ctx.save();
      ctx.translate(asteroid.x, asteroid.y);
      ctx.rotate(asteroid.rotation * Math.PI / 180);

      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, asteroid.width / 2);
      gradient.addColorStop(0, '#8b7355');
      gradient.addColorStop(0.7, '#6b5344');
      gradient.addColorStop(1, '#4a3728');
      ctx.fillStyle = gradient;
      ctx.strokeStyle = '#3a2718';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(asteroid.vertices[0].x, asteroid.vertices[0].y);
      for (let i = 1; i < asteroid.vertices.length; i++) {
        ctx.lineTo(asteroid.vertices[i].x, asteroid.vertices[i].y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-asteroid.width * 0.2, -asteroid.height * 0.1);
      ctx.lineTo(asteroid.width * 0.15, asteroid.height * 0.2);
      ctx.moveTo(-asteroid.width * 0.1, asteroid.height * 0.3);
      ctx.lineTo(asteroid.width * 0.25, -asteroid.height * 0.15);
      ctx.stroke();

      ctx.restore();
    }
  }

  private drawCrystals(crystals: Crystal[], _time: number): void {
    const ctx = this.ctx;
    for (const crystal of crystals) {
      if (!crystal.active) continue;

      const glow = (Math.sin(crystal.glowPhase) + 1) * 0.5;
      const size = crystal.width / 2;
      const pulseSize = size + glow * 3;

      ctx.save();
      ctx.translate(crystal.x, crystal.y);

      const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, pulseSize * 2.5);
      glowGradient.addColorStop(0, `rgba(0, 255, 255, ${0.3 + glow * 0.3})`);
      glowGradient.addColorStop(0.5, `rgba(138, 43, 226, ${0.2 + glow * 0.2})`);
      glowGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(0, 0, pulseSize * 2.5, 0, Math.PI * 2);
      ctx.fill();

      const crystalGradient = ctx.createLinearGradient(-size, -size, size, size);
      crystalGradient.addColorStop(0, '#00ffff');
      crystalGradient.addColorStop(0.5, '#8a2be2');
      crystalGradient.addColorStop(1, '#ff00ff');
      ctx.fillStyle = crystalGradient;
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 + glow * 0.5})`;
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(0, -pulseSize);
      ctx.lineTo(pulseSize * 0.7, 0);
      ctx.lineTo(0, pulseSize);
      ctx.lineTo(-pulseSize * 0.7, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = `rgba(255, 255, 255, ${0.6 + glow * 0.4})`;
      ctx.beginPath();
      ctx.moveTo(0, -pulseSize * 0.6);
      ctx.lineTo(pulseSize * 0.3, 0);
      ctx.lineTo(0, pulseSize * 0.2);
      ctx.lineTo(-pulseSize * 0.3, 0);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  }

  private drawBullets(bullets: Bullet[]): void {
    const ctx = this.ctx;
    for (const bullet of bullets) {
      if (!bullet.active) continue;

      if (bullet.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(bullet.trail[0].x, bullet.trail[0].y);
        for (let i = 1; i < bullet.trail.length; i++) {
          const alpha = i / bullet.trail.length;
          ctx.strokeStyle = `rgba(0, 255, 255, ${alpha * 0.6})`;
          ctx.lineWidth = 2 * alpha;
          ctx.lineTo(bullet.trail[i].x, bullet.trail[i].y);
        }
        ctx.stroke();
      }

      ctx.save();
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#00ffff';
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.width / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.width / 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawParticles(particles: Particle[]): void {
    const ctx = this.ctx;
    for (const p of particles) {
      if (p.life <= 0) continue;
      const alpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private drawDebris(debris: Debris[]): void {
    const ctx = this.ctx;
    for (const d of debris) {
      if (d.life <= 0) continue;
      const alpha = d.life / d.maxLife;
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.rotation * Math.PI / 180);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = d.color;
      ctx.shadowColor = d.color;
      ctx.shadowBlur = 5;
      ctx.fillRect(-d.size / 2, -d.size / 2, d.size, d.size);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  private drawHUD(data: RenderData): void {
    const ctx = this.ctx;
    const { width } = this.canvas;
    const { player, time } = data;

    const hudY = 10;
    const hudHeight = 50;
    const hudPadding = 15;

    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = 'rgba(10, 14, 26, 0.7)';
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    this.roundRect(ctx, hudPadding, hudY, width - hudPadding * 2, hudHeight, 10);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.textBaseline = 'middle';

    const textY = hudY + hudHeight / 2;

    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#e0ffff';
    ctx.textAlign = 'left';
    ctx.fillText(`得分: ${Math.floor(player.score)}`, hudPadding + 20, textY);

    const minutes = Math.floor(player.survivalTime / 60);
    const seconds = Math.floor(player.survivalTime % 60);
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    ctx.textAlign = 'center';
    ctx.fillText(`生存时间: ${timeStr}`, width / 2, textY);

    ctx.textAlign = 'right';
    ctx.fillText(`资源: ${player.resourcesCollected}`, width - hudPadding - 20, textY);

    ctx.shadowBlur = 0;

    const barX = width / 2 - 100;
    const barY = hudY + hudHeight - 12;
    const barWidth = 200;
    const barHeight = 6;
    const resourcePercent = player.resources / 100;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.roundRect(ctx, barX, barY, barWidth, barHeight, 3);
    ctx.fill();

    const resourceGradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
    resourceGradient.addColorStop(0, '#00ffff');
    resourceGradient.addColorStop(1, '#8a2be2');
    ctx.fillStyle = resourceGradient;
    this.roundRect(ctx, barX, barY, barWidth * resourcePercent, barHeight, 3);
    ctx.fill();

    if (player.resources >= 100) {
      ctx.strokeStyle = `rgba(0, 255, 255, ${0.5 + Math.sin(time * 8) * 0.5})`;
      ctx.lineWidth = 2;
      this.roundRect(ctx, barX - 2, barY - 2, barWidth + 4, barHeight + 4, 4);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawShieldButton(data: RenderData): void {
    const ctx = this.ctx;
    const { width, height } = this.canvas;
    const { shieldButtonActive, shieldCooldownPercent, time } = data;

    const btnWidth = 200;
    const btnHeight = 50;
    const btnX = width / 2 - btnWidth / 2;
    const btnY = height - 70;
    const breath = Math.sin(time * 3) * 0.05 + 1;

    ctx.save();

    if (shieldButtonActive) {
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 20 * breath;
      ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
      ctx.strokeStyle = `rgba(0, 255, 255, ${0.7 + Math.sin(time * 6) * 0.3})`;
    } else if (shieldCooldownPercent < 1) {
      ctx.fillStyle = 'rgba(50, 50, 70, 0.7)';
      ctx.strokeStyle = 'rgba(100, 100, 120, 0.5)';
    } else {
      ctx.fillStyle = 'rgba(30, 30, 50, 0.7)';
      ctx.strokeStyle = 'rgba(100, 100, 120, 0.5)';
    }

    ctx.lineWidth = 2;
    this.roundRect(ctx, btnX, btnY, btnWidth, btnHeight, 8);
    ctx.fill();
    ctx.stroke();

    if (!shieldButtonActive && shieldCooldownPercent < 1) {
      ctx.fillStyle = 'rgba(0, 255, 255, 0.4)';
      this.roundRect(ctx, btnX, btnY, btnWidth * shieldCooldownPercent, btnHeight, 8);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
    ctx.font = 'bold 18px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (shieldButtonActive) {
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 10;
      ctx.fillText('⚡ 激活护盾 [空格]', width / 2, btnY + btnHeight / 2);
    } else if (shieldCooldownPercent < 1) {
      ctx.fillStyle = '#888888';
      ctx.fillText(`冷却中 ${Math.ceil((1 - shieldCooldownPercent) * 15)}s`, width / 2, btnY + btnHeight / 2);
    } else {
      ctx.fillStyle = '#666666';
      ctx.fillText('护盾 (需要100资源)', width / 2, btnY + btnHeight / 2);
    }

    ctx.restore();
  }

  private drawGameOver(data: RenderData): void {
    const ctx = this.ctx;
    const { width, height } = this.canvas;
    const { player, time } = data;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, width, height);

    const panelWidth = 400;
    const panelHeight = 350;
    const panelX = width / 2 - panelWidth / 2;
    const panelY = height / 2 - panelHeight / 2;
    const breath = Math.sin(time * 2) * 0.02 + 1;

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(breath, breath);
    ctx.translate(-width / 2, -height / 2);

    ctx.shadowColor = '#ff4444';
    ctx.shadowBlur = 30;
    ctx.fillStyle = 'rgba(10, 14, 26, 0.95)';
    ctx.strokeStyle = 'rgba(255, 68, 68, 0.5)';
    ctx.lineWidth = 2;
    this.roundRect(ctx, panelX, panelY, panelWidth, panelHeight, 15);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.font = 'bold 36px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff4444';
    ctx.shadowColor = '#ff4444';
    ctx.shadowBlur = 15;
    ctx.fillText('游戏结束', width / 2, panelY + 60);

    ctx.font = 'bold 20px "Courier New", monospace';
    ctx.fillStyle = '#e0ffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 10;

    const minutes = Math.floor(player.survivalTime / 60);
    const seconds = Math.floor(player.survivalTime % 60);
    const timeStr = `${minutes}分${seconds}秒`;

    ctx.fillText(`最终得分: ${Math.floor(player.score)}`, width / 2, panelY + 120);
    ctx.fillText(`生存时间: ${timeStr}`, width / 2, panelY + 160);
    ctx.fillText(`拾取资源: ${player.resourcesCollected}`, width / 2, panelY + 200);

    const btnWidth = 180;
    const btnHeight = 50;
    const btnX = width / 2 - btnWidth / 2;
    const btnY = panelY + 250;
    const btnBreath = Math.sin(time * 4) * 0.05 + 1;

    ctx.save();
    ctx.translate(width / 2, btnY + btnHeight / 2);
    ctx.scale(btnBreath, btnBreath);
    ctx.translate(-width / 2, -(btnY + btnHeight / 2));

    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 20;
    ctx.fillStyle = 'rgba(0, 255, 255, 0.25)';
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    this.roundRect(ctx, btnX, btnY, btnWidth, btnHeight, 10);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 20px "Courier New", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('重新开始', width / 2, btnY + btnHeight / 2);

    ctx.restore();
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

  isPointInShieldButton(px: number, py: number): boolean {
    const { width, height } = this.canvas;
    const btnX = width / 2 - 100;
    const btnY = height - 70;
    return px >= btnX && px <= btnX + 200 && py >= btnY && py <= btnY + 50;
  }

  isPointInRestartButton(px: number, py: number): boolean {
    const { width, height } = this.canvas;
    const btnX = width / 2 - 90;
    const btnY = height / 2 + 75;
    return px >= btnX && px <= btnX + 180 && py >= btnY && py <= btnY + 50;
  }
}
