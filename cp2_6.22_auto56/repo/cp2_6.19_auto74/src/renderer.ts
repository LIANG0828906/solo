import {
  Tank,
  Bullet,
  Brick,
  PowerUp,
  Mine,
  Base,
  Particle,
  PickupText,
  Star,
  Direction,
  PowerUpType,
  GameState,
  MAP_WIDTH,
  MAP_HEIGHT,
  TANK_SIZE,
  BRICK_WIDTH,
  BRICK_HEIGHT
} from './entities';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('无法获取Canvas 2D上下文');
    }
    this.ctx = ctx;
  }

  clear(): void {
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawStars(stars: Star[]): void {
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    for (const star of stars) {
      this.ctx.fillRect(star.x, star.y, star.size, star.size);
    }
  }

  drawBorder(): void {
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(1, 1, MAP_WIDTH - 2, MAP_HEIGHT - 2);
  }

  drawTank(tank: Tank, currentTime: number): void {
    const ctx = this.ctx;
    const cx = tank.getCenterX();
    const cy = tank.getCenterY();
    let scale = 1;
    let rotation = this.getDirectionAngle(tank.direction);

    if (tank.pickupAnimation > 0) {
      scale = 1 + 0.3 * (tank.pickupAnimation / 200);
    }

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    ctx.scale(scale, scale);

    const halfSize = TANK_SIZE / 2;
    ctx.fillStyle = tank.color;
    ctx.fillRect(-halfSize + 4, -halfSize + 4, TANK_SIZE - 8, TANK_SIZE - 8);

    ctx.fillStyle = tank.playerId === 1 ? '#1a5c1a' : '#1a3a6c';
    ctx.fillRect(-halfSize, -halfSize, 8, TANK_SIZE);
    ctx.fillRect(halfSize - 8, -halfSize, 8, TANK_SIZE);

    ctx.fillStyle = tank.color;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = tank.playerId === 1 ? '#0f3f0f' : '#0f2850';
    ctx.fillRect(-3, -halfSize - 4, 6, halfSize);

    ctx.restore();

    if (tank.shieldActive) {
      ctx.save();
      const pulse = 0.5 + 0.5 * Math.sin(currentTime * 0.01);
      ctx.strokeStyle = `rgba(255, 215, 0, ${0.4 + 0.3 * pulse})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, halfSize + 8, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = `rgba(255, 215, 0, ${0.1 + 0.1 * pulse})`;
      ctx.beginPath();
      ctx.arc(cx, cy, halfSize + 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (tank.stunned) {
      ctx.save();
      ctx.fillStyle = '#ffff00';
      ctx.font = '16px monospace';
      ctx.textAlign = 'center';
      for (let i = 0; i < 3; i++) {
        const angle = currentTime * 0.005 + (i * Math.PI * 2) / 3;
        const sx = cx + Math.cos(angle) * 25;
        const sy = cy - 25 + Math.sin(angle) * 5;
        ctx.fillText('★', sx, sy);
      }
      ctx.restore();
    }
  }

  drawVictoryTank(tank: Tank, currentTime: number): void {
    const ctx = this.ctx;
    const cx = tank.getCenterX();
    const cy = tank.getCenterY();
    tank.victoryRotation += 0.03;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(tank.victoryRotation);

    const halfSize = TANK_SIZE / 2;
    ctx.fillStyle = tank.color;
    ctx.fillRect(-halfSize + 4, -halfSize + 4, TANK_SIZE - 8, TANK_SIZE - 8);

    ctx.fillStyle = tank.playerId === 1 ? '#1a5c1a' : '#1a3a6c';
    ctx.fillRect(-halfSize, -halfSize, 8, TANK_SIZE);
    ctx.fillRect(halfSize - 8, -halfSize, 8, TANK_SIZE);

    ctx.fillStyle = tank.color;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = tank.playerId === 1 ? '#0f3f0f' : '#0f2850';
    ctx.fillRect(-3, -halfSize - 4, 6, halfSize);

    ctx.restore();
  }

  private getDirectionAngle(direction: Direction): number {
    switch (direction) {
      case 'up':
        return 0;
      case 'right':
        return Math.PI / 2;
      case 'down':
        return Math.PI;
      case 'left':
        return -Math.PI / 2;
    }
  }

  drawBullet(bullet: Bullet): void {
    const ctx = this.ctx;

    for (let i = 0; i < bullet.trail.length; i++) {
      const t = bullet.trail[i];
      const alpha = (i + 1) / bullet.trail.length * 0.5;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(t.x, t.y, bullet.radius * (i + 1) / bullet.trail.length, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = bullet.ownerId === 1 ? '#00ff00' : '#00aaff';
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  drawBrick(brick: Brick): void {
    const ctx = this.ctx;

    ctx.fillStyle = '#cc3333';
    ctx.fillRect(brick.x, brick.y, brick.width, brick.height);

    ctx.strokeStyle = '#8b0000';
    ctx.lineWidth = 1;
    ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);

    ctx.strokeStyle = '#8b0000';
    ctx.beginPath();
    ctx.moveTo(brick.x + brick.width / 2, brick.y);
    ctx.lineTo(brick.x + brick.width / 2, brick.y + brick.height);
    ctx.moveTo(brick.x, brick.y + brick.height / 2);
    ctx.lineTo(brick.x + brick.width, brick.y + brick.height / 2);
    ctx.stroke();
  }

  drawPowerUp(powerUp: PowerUp, currentTime: number): void {
    const ctx = this.ctx;
    const opacity = powerUp.getPulseOpacity(currentTime);
    const cx = powerUp.getCenterX();
    const cy = powerUp.getCenterY();
    const size = powerUp.size;

    ctx.save();
    ctx.globalAlpha = opacity;

    const colors: Record<PowerUpType, string> = {
      shield: '#ffd700',
      speed: '#00ffff',
      rapidFire: '#ff00ff',
      mine: '#ff6600'
    };

    const color = colors[powerUp.type];

    ctx.fillStyle = color;
    ctx.fillRect(cx - size / 2, cy - size / 2, size, size);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - size / 2, cy - size / 2, size, size);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const symbols: Record<PowerUpType, string> = {
      shield: 'S',
      speed: '»',
      rapidFire: 'R',
      mine: 'M'
    };
    ctx.fillText(symbols[powerUp.type], cx, cy);

    ctx.restore();
  }

  drawMine(mine: Mine, currentTime: number): void {
    const ctx = this.ctx;
    const blink = mine.armed ? (Math.sin(currentTime * 0.01) > 0 ? 1 : 0.5) : 0.3;

    ctx.save();
    ctx.globalAlpha = blink;

    ctx.fillStyle = '#333333';
    ctx.beginPath();
    ctx.arc(mine.x, mine.y, mine.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = mine.armed ? '#ff0000' : '#666666';
    ctx.beginPath();
    ctx.arc(mine.x, mine.y, mine.radius * 0.4, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8;
      const sx = mine.x + Math.cos(angle) * mine.radius;
      const sy = mine.y + Math.sin(angle) * mine.radius;
      ctx.fillStyle = '#555555';
      ctx.beginPath();
      ctx.arc(sx, sy, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawBase(base: Base, currentTime: number): void {
    const ctx = this.ctx;
    const cx = base.getCenterX();
    const cy = base.getCenterY();
    const size = base.size;
    const blink = 0.6 + 0.4 * Math.sin(currentTime * 0.008);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI / 4);

    ctx.fillStyle = `rgba(255, 215, 0, ${blink})`;
    ctx.fillRect(-size / 2, -size / 2, size, size);

    ctx.strokeStyle = base.playerId === 1 ? '#00ff00' : '#00aaff';
    ctx.lineWidth = 3;
    ctx.strokeRect(-size / 2, -size / 2, size, size);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-size / 4, -size / 4, size / 2, size / 2);

    ctx.restore();
  }

  drawParticle(particle: Particle): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = particle.getOpacity();
    ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
    ctx.restore();
  }

  drawPickupText(text: PickupText): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = text.getOpacity();
    ctx.font = 'bold 18px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeText(text.text, text.x, text.y);
    ctx.fillStyle = text.color;
    ctx.fillText(text.text, text.x, text.y);
    ctx.restore();
  }

  drawScoreboard(
    player1Score: number,
    player2Score: number,
    currentRound: number,
    winnerFlash: 1 | 2 | null,
    currentTime: number
  ): void {
    const ctx = this.ctx;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, MAP_WIDTH, 50);

    const flashScale1 = winnerFlash === 1 ? 1 + 0.3 * Math.sin(currentTime * 0.02) : 1;
    const flashScale2 = winnerFlash === 2 ? 1 + 0.3 * Math.sin(currentTime * 0.02) : 1;

    ctx.save();
    ctx.font = 'bold 24px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    ctx.translate(30, 25);
    ctx.scale(flashScale1, flashScale1);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeText(`P1: ${player1Score}`, 0, 0);
    ctx.fillStyle = '#00ff00';
    ctx.fillText(`P1: ${player1Score}`, 0, 0);
    ctx.restore();

    ctx.save();
    ctx.font = 'bold 24px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeText(`第 ${currentRound} 局`, MAP_WIDTH / 2, 25);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`第 ${currentRound} 局`, MAP_WIDTH / 2, 25);
    ctx.restore();

    ctx.save();
    ctx.font = 'bold 24px "Courier New", monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    ctx.translate(MAP_WIDTH - 30, 25);
    ctx.scale(flashScale2, flashScale2);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeText(`P2: ${player2Score}`, 0, 0);
    ctx.fillStyle = '#00aaff';
    ctx.fillText(`P2: ${player2Score}`, 0, 0);
    ctx.restore();
  }

  drawMenu(currentTime: number): void {
    const ctx = this.ctx;

    ctx.font = 'bold 36px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 6;
    ctx.strokeText('像素坦克大战', MAP_WIDTH / 2, MAP_HEIGHT / 2 - 60);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('像素坦克大战', MAP_WIDTH / 2, MAP_HEIGHT / 2 - 60);

    const blinkOpacity = 0.5 + 0.5 * Math.sin(currentTime * 0.006);
    ctx.save();
    ctx.globalAlpha = blinkOpacity;
    ctx.font = 'bold 20px "Courier New", monospace';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeText('按空格键开始', MAP_WIDTH / 2, MAP_HEIGHT / 2 + 20);
    ctx.fillStyle = '#ffff00';
    ctx.fillText('按空格键开始', MAP_WIDTH / 2, MAP_HEIGHT / 2 + 20);
    ctx.restore();

    ctx.font = '14px "Courier New", monospace';
    ctx.fillStyle = '#aaaaaa';
    ctx.textAlign = 'left';
    ctx.fillText('玩家1: WASD移动, J键开火', 60, MAP_HEIGHT - 100);
    ctx.fillText('玩家2: 方向键移动, 小键盘0开火', 60, MAP_HEIGHT - 75);
    ctx.fillText('7局4胜制 | 击中对方基地获胜', 60, MAP_HEIGHT - 50);

    ctx.textAlign = 'right';
    ctx.fillText('道具说明:', MAP_WIDTH - 60, MAP_HEIGHT - 100);
    ctx.fillStyle = '#ffd700';
    ctx.fillText('S - 护盾(抵挡1次攻击)', MAP_WIDTH - 60, MAP_HEIGHT - 80);
    ctx.fillStyle = '#00ffff';
    ctx.fillText('» - 加速(速度翻倍8秒)', MAP_WIDTH - 60, MAP_HEIGHT - 60);
    ctx.fillStyle = '#ff00ff';
    ctx.fillText('R - 连发(冷却缩短8秒)', MAP_WIDTH - 60, MAP_HEIGHT - 40);
    ctx.fillStyle = '#ff6600';
    ctx.fillText('M - 地雷(碰到爆炸晕眩2秒)', MAP_WIDTH - 60, MAP_HEIGHT - 20);
  }

  drawCountdown(countdownNumber: number, countdownProgress: number): void {
    const ctx = this.ctx;

    const scale = 1 + 0.5 * Math.sin(countdownProgress * Math.PI);
    const rotation = countdownProgress * Math.PI * 2;

    ctx.save();
    ctx.translate(MAP_WIDTH / 2, MAP_HEIGHT / 2);
    ctx.rotate(rotation);
    ctx.scale(scale, scale);

    ctx.font = 'bold 120px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 8;
    ctx.strokeText(countdownNumber.toString(), 0, 0);
    ctx.fillStyle = '#ffff00';
    ctx.fillText(countdownNumber.toString(), 0, 0);

    ctx.restore();
  }

  drawRoundEnd(winner: 1 | 2): void {
    const ctx = this.ctx;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

    ctx.font = 'bold 48px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 6;
    ctx.strokeText(`玩家 ${winner} 赢得本局！`, MAP_WIDTH / 2, MAP_HEIGHT / 2);
    ctx.fillStyle = winner === 1 ? '#00ff00' : '#00aaff';
    ctx.fillText(`玩家 ${winner} 赢得本局！`, MAP_WIDTH / 2, MAP_HEIGHT / 2);
  }

  drawVictoryScreen(winner: 1 | 2, currentTime: number, textProgress: number): void {
    const ctx = this.ctx;

    ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

    const bounceOffset = textProgress < 1 ? -50 * (1 - textProgress) : 0;
    const textY = MAP_HEIGHT / 2 - 100 + bounceOffset;

    ctx.font = 'bold 64px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 8;
    ctx.strokeText(`玩家 ${winner} 胜利！`, MAP_WIDTH / 2, textY);
    ctx.fillStyle = winner === 1 ? '#00ff00' : '#00aaff';
    ctx.fillText(`玩家 ${winner} 胜利！`, MAP_WIDTH / 2, textY);

    const blinkOpacity = 0.5 + 0.5 * Math.sin(currentTime * 0.006);
    ctx.save();
    ctx.globalAlpha = blinkOpacity;
    ctx.font = 'bold 24px "Courier New", monospace';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeText('按空格键重新开始', MAP_WIDTH / 2, MAP_HEIGHT - 60);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('按空格键重新开始', MAP_WIDTH / 2, MAP_HEIGHT - 60);
    ctx.restore();
  }
}
