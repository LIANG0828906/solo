import { Game } from './game';
import { Player, Bullet, Effect, Star } from './entities';

export class Renderer {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  fps: number;
  fpsTimer: number;
  fpsFrames: number;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.fps = 60;
    this.fpsTimer = 0;
    this.fpsFrames = 0;
  }

  updateFPS(): void {
    this.fpsFrames += 1;
    this.fpsTimer += 1;
    if (this.fpsTimer >= 60) {
      this.fps = this.fpsFrames;
      this.fpsFrames = 0;
      this.fpsTimer = 0;
    }
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  drawBackground(_game: Game): void {
    const ctx = this.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#0B1D3A');
    gradient.addColorStop(1, '#1A2A4A');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);
    this.drawCornerGlow();
  }

  private drawCornerGlow(): void {
    const ctx = this.ctx;
    const glowRadius = 180;
    const corners = [
      { x: 0, y: 0 },
      { x: this.width, y: 0 },
      { x: 0, y: this.height },
      { x: this.width, y: this.height }
    ];

    for (const corner of corners) {
      const gradient = ctx.createRadialGradient(
        corner.x, corner.y, 0,
        corner.x, corner.y, glowRadius
      );
      gradient.addColorStop(0, 'rgba(60, 120, 220, 0.12)');
      gradient.addColorStop(0.5, 'rgba(40, 90, 180, 0.06)');
      gradient.addColorStop(1, 'rgba(20, 50, 120, 0)');
      ctx.beginPath();
      ctx.arc(corner.x, corner.y, glowRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    }
  }

  drawStars(stars: Star[]): void {
    const ctx = this.ctx;
    for (const star of stars) {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
      ctx.fill();
    }
  }

  drawPlayer(player: Player): void {
    const ctx = this.ctx;

    this.drawPlayerTrail(player);

    const glowAlpha = 0.2 + 0.2 * Math.sin(player.glowPhase);
    const glowGradient = ctx.createRadialGradient(
      player.x, player.y, 0,
      player.x, player.y, player.glowRadius
    );
    glowGradient.addColorStop(0, `rgba(255, 255, 255, ${glowAlpha})`);
    glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.glowRadius, 0, Math.PI * 2);
    ctx.fillStyle = glowGradient;
    ctx.fill();

    let playerAlpha = 1;
    if (player.invincibilityTimer > 0) {
      playerAlpha = Math.floor(player.invincibilityTimer / 4) % 2 === 0 ? 1 : 0.3;
    }
    if (player.hitFlashTimer > 0) {
      playerAlpha = 1;
    }

    ctx.globalAlpha = playerAlpha;

    if (player.hitFlashTimer > 0) {
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius + 4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 100, 100, ${player.hitFlashTimer / 18})`;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = '#AADDFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.globalAlpha = 1;

    if (player.shieldActive) {
      this.drawShield(player);
    }

    if (player.shieldShockwaveTimer > 0) {
      this.drawShieldShockwave(player);
    }
  }

  private drawPlayerTrail(player: Player): void {
    const ctx = this.ctx;
    const trail = player.trail;

    for (let i = 0; i < trail.length; i++) {
      const t = i / trail.length;
      const point = trail[i];
      const alpha = t * 0.5;
      const radius = player.radius * (0.3 + t * 0.7);

      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fill();
    }
  }

  private drawShieldShockwave(player: Player): void {
    const ctx = this.ctx;
    const t = 1 - player.shieldShockwaveTimer / 18;
    const startRadius = player.shieldOuterRadius;
    const endRadius = 80;
    const radius = startRadius + t * (endRadius - startRadius);
    const alpha = 1 - t;

    ctx.beginPath();
    ctx.arc(player.x, player.y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(100, 180, 255, ${alpha * 0.8})`;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(player.x, player.y, radius - 3, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(150, 220, 255, ${alpha * 0.4})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  private drawShield(player: Player): void {
    const ctx = this.ctx;

    let shieldAlpha = 0.5;
    if (player.shieldFlashTimer > 0) {
      shieldAlpha = 0.8 + 0.2 * Math.sin(player.shieldFlashTimer * 1.5);
    }

    const ringGradient = ctx.createRadialGradient(
      player.x, player.y, player.shieldInnerRadius,
      player.x, player.y, player.shieldOuterRadius
    );
    ringGradient.addColorStop(0, `rgba(100, 180, 255, 0)`);
    ringGradient.addColorStop(0.3, `rgba(100, 180, 255, ${shieldAlpha * 0.3})`);
    ringGradient.addColorStop(0.5, `rgba(100, 180, 255, ${shieldAlpha * 0.7})`);
    ringGradient.addColorStop(0.7, `rgba(100, 180, 255, ${shieldAlpha * 0.3})`);
    ringGradient.addColorStop(1, `rgba(100, 180, 255, 0)`);

    ctx.beginPath();
    ctx.arc(player.x, player.y, player.shieldOuterRadius, 0, Math.PI * 2);
    ctx.fillStyle = ringGradient;
    ctx.fill();

    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.shieldRotation);

    ctx.beginPath();
    const segments = 6;
    for (let i = 0; i < segments; i++) {
      const angle1 = (i / segments) * Math.PI * 2;
      const angle2 = ((i + 0.5) / segments) * Math.PI * 2;
      const r1 = player.shieldOuterRadius;
      const r2 = player.shieldOuterRadius - 2;
      const x1 = Math.cos(angle1) * r1;
      const y1 = Math.sin(angle1) * r1;
      const x2 = Math.cos(angle2) * r2;
      const y2 = Math.sin(angle2) * r2;
      if (i === 0) {
        ctx.moveTo(x1, y1);
      } else {
        ctx.lineTo(x1, y1);
      }
      ctx.lineTo(x2, y2);
    }
    ctx.closePath();
    ctx.strokeStyle = `rgba(150, 220, 255, ${shieldAlpha})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();

    if (player.shieldFlashTimer > 0) {
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.shieldOuterRadius + 3, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(200, 240, 255, ${player.shieldFlashTimer / 12})`;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }

  drawBullet(bullet: Bullet): void {
    const ctx = this.ctx;

    if (bullet.trail.length > 1) {
      for (let i = 1; i < bullet.trail.length; i++) {
        const t = i / bullet.trail.length;
        const curr = bullet.trail[i];
        const alpha = t * 0.4;
        const radius = bullet.radius * (0.3 + t * 0.7);
        ctx.beginPath();
        ctx.arc(curr.x, curr.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = this.colorWithAlpha(bullet.color, alpha);
        ctx.fill();
      }
    }

    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fillStyle = bullet.color;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
  }

  drawBullets(bullets: Bullet[]): void {
    for (const bullet of bullets) {
      if (bullet.active) {
        this.drawBullet(bullet);
      }
    }
  }

  drawEffect(effect: Effect): void {
    const ctx = this.ctx;

    switch (effect.type) {
      case 'graze':
      case 'shieldBreak': {
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, effect.currentRadius, 0, Math.PI * 2);
        ctx.strokeStyle = this.colorWithAlpha(effect.color, effect.alpha);
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, effect.currentRadius * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = this.colorWithAlpha(effect.color, effect.alpha * 0.3);
        ctx.fill();
        break;
      }

      case 'shockwave': {
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, effect.currentRadius, 0, Math.PI * 2);
        ctx.strokeStyle = this.colorWithAlpha(effect.color, effect.alpha);
        ctx.lineWidth = 4;
        ctx.stroke();

        const innerGradient = ctx.createRadialGradient(
          effect.x, effect.y, effect.currentRadius * 0.8,
          effect.x, effect.y, effect.currentRadius
        );
        innerGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        innerGradient.addColorStop(1, this.colorWithAlpha(effect.color, effect.alpha * 0.3));
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, effect.currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = innerGradient;
        ctx.fill();
        break;
      }

      case 'comboBurst':
      case 'screenFlash':
      case 'hitFlash': {
        ctx.fillStyle = this.colorWithAlpha(effect.color, effect.alpha * 0.6);
        ctx.fillRect(0, 0, this.width, this.height);
        break;
      }
    }
  }

  drawEffects(effects: Effect[]): void {
    for (const effect of effects) {
      if (effect.active) {
        this.drawEffect(effect);
      }
    }
  }

  drawUI(game: Game): void {
    this.drawScore(game.score, game.scoreAnimTimer);
    this.drawLives(game.player);
    this.drawWaveMessage(game);
    this.drawCombo(game.combo);
    this.drawFPS();
  }

  private drawScore(score: number, animTimer: number): void {
    const ctx = this.ctx;
    const baseFontSize = 20;
    let scale = 1;

    if (animTimer > 0) {
      const t = 1 - animTimer / 9;
      if (t < 0.5) {
        scale = 1 + t * 0.4;
      } else {
        const rebound = (t - 0.5) * 2;
        scale = 1.2 - rebound * 0.2;
      }
    }

    ctx.save();
    ctx.translate(20, 20);
    ctx.scale(scale, scale);
    ctx.font = `${baseFontSize}px monospace`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`得分: ${score}`, 0, 0);
    ctx.restore();
  }

  private drawLives(player: Player): void {
    const ctx = this.ctx;
    const heartSize = 16;
    const spacing = 24;
    const startX = 20;
    const startY = 52;

    for (let i = 0; i < player.maxLives; i++) {
      const x = startX + i * spacing;
      const y = startY;
      const alive = i < player.lives;
      let rotation = 0;
      let scale = 1;
      let alpha = 1;

      if (!alive && player.livesAnimation[i] !== undefined && player.livesAnimation[i] > 0) {
        const animProgress = 1 - player.livesAnimation[i] / 18;
        rotation = animProgress * Math.PI;
        scale = 1 - animProgress * 0.5;
        alpha = 1 - animProgress;
      }

      ctx.save();
      ctx.translate(x + heartSize / 2, y + heartSize / 2);
      ctx.rotate(rotation);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;
      this.drawHeart(0, 0, heartSize, alive);
      ctx.restore();
    }
  }

  private drawHeart(cx: number, cy: number, size: number, filled: boolean): void {
    const ctx = this.ctx;
    const w = size;
    const h = size;
    const x = cx - w / 2;
    const y = cy - h / 2;

    ctx.beginPath();
    const topCurveHeight = h * 0.3;
    ctx.moveTo(cx, y + topCurveHeight);
    ctx.bezierCurveTo(cx, y, x, y, x, y + topCurveHeight);
    ctx.bezierCurveTo(x, y + (h + topCurveHeight) / 2, cx, y + (h + topCurveHeight) / 2, cx, y + h);
    ctx.bezierCurveTo(cx, y + (h + topCurveHeight) / 2, x + w, y + (h + topCurveHeight) / 2, x + w, y + topCurveHeight);
    ctx.bezierCurveTo(x + w, y, cx, y, cx, y + topCurveHeight);
    ctx.closePath();

    if (filled) {
      ctx.fillStyle = '#FF4466';
      ctx.fill();
      ctx.strokeStyle = '#CC2244';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else {
      ctx.strokeStyle = '#666666';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  private drawCombo(combo: number): void {
    if (combo < 2) return;
    const ctx = this.ctx;
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';

    const pulse = Math.sin(Date.now() / 100) * 0.1 + 1;
    const scale = combo >= 10 ? pulse : 1;

    ctx.save();
    ctx.translate(this.width - 20, 20);
    ctx.scale(scale, scale);

    let color = '#FFD700';
    if (combo >= 20) color = '#FF66FF';
    else if (combo >= 10) color = '#FF8800';

    ctx.fillStyle = color;
    ctx.fillText(`连击 x${combo}`, 0, 0);

    ctx.restore();
  }

  private drawWaveMessage(game: Game): void {
    if (game.waveMessageTimer <= 0) return;
    const ctx = this.ctx;

    ctx.save();
    ctx.globalAlpha = game.waveMessageAlpha;

    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const cx = this.width / 2;
    const cy = this.height / 3;

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeText(game.waveMessage, cx, cy);
    ctx.lineWidth = 2;
    ctx.strokeText(game.waveMessage, cx, cy);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(game.waveMessage, cx, cy);

    ctx.restore();
  }

  private drawFPS(): void {
    const ctx = this.ctx;
    ctx.font = '12px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`FPS: ${this.fps}`, this.width - 10, this.height - 10);
  }

  drawGameOver(game: Game, showOffset: number = 0, showAlpha: number = 1, hoverRestart: boolean = false): { restartX: number; restartY: number; restartW: number; restartH: number } | null {
    const ctx = this.ctx;

    const panelW = 380;
    const panelH = 420;
    const panelX = (this.width - panelW) / 2;
    const panelY = (this.height - panelH) / 2 + showOffset;

    ctx.save();
    ctx.globalAlpha = showAlpha;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.beginPath();
    const r = 12;
    ctx.moveTo(panelX + r, panelY);
    ctx.lineTo(panelX + panelW - r, panelY);
    ctx.quadraticCurveTo(panelX + panelW, panelY, panelX + panelW, panelY + r);
    ctx.lineTo(panelX + panelW, panelY + panelH - r);
    ctx.quadraticCurveTo(panelX + panelW, panelY + panelH, panelX + panelW - r, panelY + panelH);
    ctx.lineTo(panelX + r, panelY + panelH);
    ctx.quadraticCurveTo(panelX, panelY + panelH, panelX, panelY + panelH - r);
    ctx.lineTo(panelX, panelY + r);
    ctx.quadraticCurveTo(panelX, panelY, panelX + r, panelY);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(100, 180, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    const stats = game.stats;

    ctx.font = 'bold 28px monospace';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('游戏结束', panelX + panelW / 2, panelY + 24);

    const scoreText = `${stats.score}`;
    ctx.font = 'bold 44px monospace';
    ctx.textAlign = 'center';
    const scoreGradient = ctx.createLinearGradient(
      panelX + panelW / 2 - 80, panelY + 70,
      panelX + panelW / 2 + 80, panelY + 110
    );
    scoreGradient.addColorStop(0, '#FFD700');
    scoreGradient.addColorStop(1, '#FFFFFF');
    ctx.fillStyle = scoreGradient;
    ctx.fillText(scoreText, panelX + panelW / 2, panelY + 68);

    const labelStartY = panelY + 130;
    const valueStartY = panelY + 130;
    const rowHeight = 38;
    const labels = [
      '存活时间',
      '总擦弹数',
      '最高连击',
      '总命中次数'
    ];
    const values = [
      `${stats.surviveTime.toFixed(1)} 秒`,
      `${stats.grazeCount}`,
      `${stats.maxCombo}`,
      `${stats.hitCount}`
    ];
    const isRedValue = [false, false, false, true];

    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    for (let i = 0; i < labels.length; i++) {
      ctx.fillStyle = '#AAAAAA';
      ctx.fillText(labels[i], panelX + 32, labelStartY + i * rowHeight);

      if (isRedValue[i]) {
        ctx.fillStyle = '#FF4444';
      } else {
        ctx.fillStyle = '#FFFFFF';
      }
      ctx.textAlign = 'right';
      ctx.fillText(values[i], panelX + panelW - 32, valueStartY + i * rowHeight);
      ctx.textAlign = 'left';
    }

    const btnW = 160;
    const btnH = 44;
    const btnX = panelX + (panelW - btnW) / 2;
    const btnY = panelY + panelH - 72;

    ctx.beginPath();
    const br = 8;
    ctx.moveTo(btnX + br, btnY);
    ctx.lineTo(btnX + btnW - br, btnY);
    ctx.quadraticCurveTo(btnX + btnW, btnY, btnX + btnW, btnY + br);
    ctx.lineTo(btnX + btnW, btnY + btnH - br);
    ctx.quadraticCurveTo(btnX + btnW, btnY + btnH, btnX + btnW - br, btnY + btnH);
    ctx.lineTo(btnX + br, btnY + btnH);
    ctx.quadraticCurveTo(btnX, btnY + btnH, btnX, btnY + btnH - br);
    ctx.lineTo(btnX, btnY + br);
    ctx.quadraticCurveTo(btnX, btnY, btnX + br, btnY);
    ctx.closePath();
    ctx.fillStyle = hoverRestart ? '#C0392B' : '#E74C3C';
    ctx.fill();

    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('重新开始', btnX + btnW / 2, btnY + btnH / 2);

    ctx.restore();

    return {
      restartX: btnX,
      restartY: btnY,
      restartW: btnW,
      restartH: btnH
    };
  }

  private colorWithAlpha(hexOrRgb: string, alpha: number): string {
    if (hexOrRgb.startsWith('#')) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexOrRgb);
      if (result) {
        const r = parseInt(result[1], 16);
        const g = parseInt(result[2], 16);
        const b = parseInt(result[3], 16);
        return `rgba(${r},${g},${b},${alpha})`;
      }
    }
    if (hexOrRgb.startsWith('rgb(')) {
      return hexOrRgb.replace('rgb(', 'rgba(').replace(')', `,${alpha})`);
    }
    return hexOrRgb;
  }

  render(game: Game, gameOverShowOffset: number = 0, gameOverAlpha: number = 0, hoverRestart: boolean = false): { restartX: number; restartY: number; restartW: number; restartH: number } | null {
    this.clear();
    this.drawBackground(game);
    this.drawStars(game.stars);
    this.drawBullets(game.bullets);
    this.drawEffects(game.effects);
    this.drawPlayer(game.player);
    this.drawUI(game);

    let restartBounds: { restartX: number; restartY: number; restartW: number; restartH: number } | null = null;
    if (game.status === 'gameover') {
      restartBounds = this.drawGameOver(game, gameOverShowOffset, gameOverAlpha, hoverRestart);
    }

    this.updateFPS();

    return restartBounds;
  }
}
