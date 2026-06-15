import { Particle } from './collisionManager';

export interface LeaderboardEntry {
  rank: number;
  name: string;
  totalTime: number;
  lapTimes: number[];
  isPlayer: boolean;
}

export interface CarMiniMapData {
  x: number;
  y: number;
  angle: number;
  color: string;
  isPlayer: boolean;
  lap: number;
  name: string;
}

export interface UIData {
  speed: number;
  maxSpeed: number;
  currentLap: number;
  totalLaps: number;
  currentLapTime: number;
  totalTime: number;
  lapTimes: number[];
  leaderboard: LeaderboardEntry[];
  showLeaderboard: boolean;
  cars: CarMiniMapData[];
  screenFlashAlpha: number;
  particles: Particle[];
  finishAnimation: boolean;
  countdown: number;
  countdownActive: boolean;
}

export class UIRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
  }

  render(uiData: UIData): void {
    this.drawSpeedometer(uiData.speed, uiData.maxSpeed, 1050, 80);
    this.drawLapInfo(uiData.currentLap, uiData.totalLaps, uiData.currentLapTime, uiData.totalTime, 1050, 200);
    this.drawMiniMap(uiData.cars, 980, 580, 200, 200);
    if (uiData.showLeaderboard) {
      this.drawLeaderboard(uiData.leaderboard);
    } else {
      this.drawLeaderboardToggle();
    }
    if (uiData.screenFlashAlpha > 0) {
      this.drawScreenFlash(uiData.screenFlashAlpha);
    }
    this.drawSparkParticles(uiData.particles);
    if (uiData.finishAnimation) {
      this.drawFinishAnimation();
    }
    if (uiData.countdownActive) {
      this.drawCountdown(uiData.countdown);
    }
    this.drawLapTimesPanel(uiData.lapTimes);
  }

  private drawSpeedometer(speed: number, maxSpeed: number, centerX: number, centerY: number): void {
    const radius = 70;
    const ctx = this.ctx;
    ctx.save();
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, 'rgba(0, 255, 170, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 255, 170, 0.05)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#00ffaa';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00ffaa';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 10, Math.PI, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    const majorTicks = 8;
    for (let i = 0; i <= majorTicks; i++) {
      const angle = Math.PI + (i / majorTicks) * Math.PI;
      const innerR = radius - 20;
      const outerR = radius - 8;
      ctx.strokeStyle = i % 2 === 0 ? '#00ffaa' : 'rgba(0, 255, 170, 0.5)';
      ctx.lineWidth = i % 2 === 0 ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(centerX + Math.cos(angle) * innerR, centerY + Math.sin(angle) * innerR);
      ctx.lineTo(centerX + Math.cos(angle) * outerR, centerY + Math.sin(angle) * outerR);
      ctx.stroke();
    }
    const speedRatio = Math.min(1, Math.max(0, speed / maxSpeed));
    const needleAngle = Math.PI + speedRatio * Math.PI;
    const needleLength = radius - 25;
    ctx.strokeStyle = '#ff4757';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ff4757';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + Math.cos(needleAngle) * needleLength,
      centerY + Math.sin(needleAngle) * needleLength
    );
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#00ffaa';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#00ffaa';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#00ffaa';
    ctx.shadowBlur = 5;
    ctx.fillText(`${Math.round(speed * 3.6)}`, centerX, centerY + 30);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '10px Arial';
    ctx.fillText('KM/H', centerX, centerY + 45);
    ctx.fillStyle = '#00ffaa';
    ctx.font = 'bold 14px Arial';
    ctx.shadowBlur = 4;
    ctx.fillText('速度表', centerX, centerY - radius - 10);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  private drawLapInfo(
    currentLap: number,
    totalLaps: number,
    lapTime: number,
    totalTime: number,
    x: number,
    y: number
  ): void {
    const ctx = this.ctx;
    ctx.save();
    const panelWidth = 180;
    const panelHeight = 140;
    const panelX = x - panelWidth / 2;
    const panelY = y;
    ctx.fillStyle = 'rgba(26, 26, 46, 0.9)';
    ctx.strokeStyle = 'rgba(0, 255, 170, 0.5)';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(0, 255, 170)';
    ctx.shadowBlur = 10;
    this.roundRect(ctx, panelX, panelY, panelWidth, panelHeight, 10);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#00ffaa';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#00ffaa';
    ctx.shadowBlur = 5;
    ctx.fillText(`${currentLap} / ${totalLaps}`, x, y + 40);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '12px Arial';
    ctx.fillText('圈数', x, y + 60);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Arial';
    ctx.fillText(this.formatTime(lapTime), x, y + 85);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '12px Arial';
    ctx.fillText('单圈计时', x, y + 105);
    ctx.fillStyle = '#ffa502';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(this.formatTime(totalTime), x, y + 128);
    ctx.restore();
  }

  private drawMiniMap(
    cars: CarMiniMapData[],
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(13, 13, 26, 0.95)';
    ctx.strokeStyle = 'rgba(0, 255, 170, 0.6)';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(0, 255, 170)';
    ctx.shadowBlur = 8;
    this.roundRect(ctx, x, y, width, height, 10);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#00ffaa';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('小地图', x + width / 2, y + 20);
    const mapPadding = 15;
    const mapInnerX = x + mapPadding;
    const mapInnerY = y + 30;
    const mapInnerW = width - mapPadding * 2;
    const mapInnerH = height - 30 - mapPadding;
    ctx.strokeStyle = 'rgba(30, 60, 114, 0.8)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    const cx = mapInnerX + mapInnerW / 2;
    const cy = mapInnerY + mapInnerH / 2;
    const rx = mapInnerW / 2 - 4;
    const ry = mapInnerH / 2 - 4;
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0, 255, 170, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * 0.65, ry * 0.65, 0, 0, Math.PI * 2);
    ctx.stroke();
    for (const car of cars) {
      const dotX = mapInnerX + (car.x / 1200) * mapInnerW;
      const dotY = mapInnerY + (car.y / 800) * mapInnerH;
      ctx.fillStyle = car.color;
      ctx.shadowColor = car.color;
      ctx.shadowBlur = car.isPlayer ? 8 : 4;
      ctx.beginPath();
      ctx.arc(dotX, dotY, car.isPlayer ? 5 : 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      if (car.isPlayer) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(dotX, dotY, 7, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  private drawLeaderboard(entries: LeaderboardEntry[]): void {
    const ctx = this.ctx;
    ctx.save();
    const panelWidth = 500;
    const panelHeight = 380;
    const panelX = (this.width - panelWidth) / 2;
    const panelY = this.height - panelHeight - 20;
    ctx.fillStyle = 'rgba(10, 10, 18, 0.95)';
    ctx.strokeStyle = 'rgba(0, 255, 170, 0.7)';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(0, 255, 170)';
    ctx.shadowBlur = 15;
    this.roundRect(ctx, panelX, panelY, panelWidth, panelHeight, 15);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#00ffaa';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#00ffaa';
    ctx.shadowBlur = 5;
    ctx.fillText('🏁 排行榜 🏁', this.width / 2, panelY + 35);
    ctx.shadowBlur = 0;
    const headerY = panelY + 60;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('排名', panelX + 20, headerY);
    ctx.fillText('选手', panelX + 80, headerY);
    ctx.fillText('Lap 1', panelX + 220, headerY);
    ctx.fillText('Lap 2', panelX + 300, headerY);
    ctx.fillText('Lap 3', panelX + 380, headerY);
    ctx.fillText('总时间', panelX + 430, headerY);
    ctx.strokeStyle = 'rgba(0, 255, 170, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(panelX + 15, headerY + 8);
    ctx.lineTo(panelX + panelWidth - 15, headerY + 8);
    ctx.stroke();
    const sortedEntries = [...entries].sort((a, b) => a.totalTime - b.totalTime);
    const colors = ['#ffd700', '#c0c0c0', '#cd7f32', '#1e3a5f', '#1e3a5f', '#1e3a5f'];
    for (let i = 0; i < Math.min(sortedEntries.length, 6); i++) {
      const entry = sortedEntries[i];
      entry.rank = i + 1;
      const rowY = headerY + 35 + i * 48;
      const cardHeight = 40;
      const rowColor = i < 3 ? colors[i] : '#1a1a2e';
      const isMedal = i < 3;
      if (isMedal) {
        const cardGrad = ctx.createLinearGradient(panelX + 10, rowY, panelX + panelWidth - 10, rowY);
        cardGrad.addColorStop(0, rowColor + '40');
        cardGrad.addColorStop(0.5, rowColor + '20');
        cardGrad.addColorStop(1, rowColor + '40');
        ctx.fillStyle = cardGrad;
      } else {
        ctx.fillStyle = 'rgba(26, 26, 46, 0.6)';
      }
      ctx.strokeStyle = entry.isPlayer ? 'rgba(0, 255, 170, 0.5)' : 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      this.roundRect(ctx, panelX + 10, rowY, panelWidth - 20, cardHeight, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = rowColor;
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'left';
      const medals = ['🥇', '🥈', '🥉'];
      ctx.fillText(
        i < 3 ? medals[i] : `#${entry.rank}`,
        panelX + 22,
        rowY + 26
      );
      ctx.fillStyle = entry.isPlayer ? '#00ffaa' : '#ffffff';
      ctx.fillText(
        entry.name + (entry.isPlayer ? ' (你)' : ''),
        panelX + 80,
        rowY + 26
      );
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = '13px Arial';
      ctx.fillText(this.formatTime(entry.lapTimes[0] || 0), panelX + 220, rowY + 26);
      ctx.fillText(this.formatTime(entry.lapTimes[1] || 0), panelX + 300, rowY + 26);
      ctx.fillText(this.formatTime(entry.lapTimes[2] || 0), panelX + 380, rowY + 26);
      ctx.fillStyle = '#ffa502';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(this.formatTime(entry.totalTime), panelX + 430, rowY + 26);
    }
    ctx.restore();
  }

  private drawLeaderboardToggle(): void {
    const ctx = this.ctx;
    ctx.save();
    const btnX = this.width / 2 - 90;
    const btnY = this.height - 55;
    const btnW = 180;
    const btnH = 40;
    ctx.fillStyle = 'rgba(0, 255, 170, 0.2)';
    ctx.strokeStyle = 'rgba(0, 255, 170, 0.8)';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(0, 255, 170)';
    ctx.shadowBlur = 8;
    this.roundRect(ctx, btnX, btnY, btnW, btnH, 8);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#00ffaa';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('按 L 键切换排行榜', this.width / 2, btnY + 26);
    ctx.restore();
  }

  private drawScreenFlash(alpha: number): void {
    const ctx = this.ctx;
    ctx.save();
    const gradient = ctx.createRadialGradient(
      this.width / 2,
      this.height / 2,
      Math.min(this.width, this.height) * 0.3,
      this.width / 2,
      this.height / 2,
      Math.max(this.width, this.height) * 0.8
    );
    gradient.addColorStop(0, `rgba(255, 0, 0, 0)`);
    gradient.addColorStop(1, `rgba(255, 0, 0, ${Math.min(1, alpha)})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.restore();
  }

  private drawSparkParticles(particles: Particle[]): void {
    const ctx = this.ctx;
    ctx.save();
    for (const p of particles) {
      const alpha = 1 - p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  private drawFinishAnimation(): void {
    const ctx = this.ctx;
    ctx.save();
    const centerX = this.width / 2;
    const centerY = 100;
    const time = performance.now() / 200;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + time;
      const dist = 30 + Math.sin(time * 2) * 10;
      const x = centerX + Math.cos(angle) * dist;
      const y = centerY + Math.sin(angle) * dist;
      ctx.fillStyle = i % 2 === 0 ? '#00ffaa' : '#ffffff';
      ctx.shadowColor = i % 2 === 0 ? '#00ffaa' : '#ffffff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(x, y - 12);
      ctx.lineTo(x + 18, y - 3);
      ctx.lineTo(x + 10, y);
      ctx.lineTo(x + 18, y + 3);
      ctx.lineTo(x, y + 12);
      ctx.lineTo(x - 18, y + 3);
      ctx.lineTo(x - 10, y);
      ctx.lineTo(x - 18, y - 3);
      ctx.closePath();
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#00ffaa';
    ctx.shadowBlur = 15;
    ctx.fillText('🏁 完成! 🏁', centerX, centerY + 60);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  private drawCountdown(count: number): void {
    const ctx = this.ctx;
    ctx.save();
    const cx = this.width / 2;
    const cy = this.height / 2 - 50;
    const scale = 1 + Math.sin(performance.now() / 100) * 0.1;
    ctx.fillStyle = '#00ffaa';
    ctx.font = `bold ${Math.round(120 * scale)}px Arial`;
    ctx.textAlign = 'center';
    ctx.shadowColor = '#00ffaa';
    ctx.shadowBlur = 30;
    const text = count > 0 ? count.toString() : 'GO!';
    ctx.fillText(text, cx, cy);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '24px Arial';
    ctx.fillText('准备开始...', cx, cy + 60);
    ctx.restore();
  }

  private drawLapTimesPanel(lapTimes: number[]): void {
    if (lapTimes.length === 0) return;
    const ctx = this.ctx;
    ctx.save();
    const panelX = 20;
    const panelY = 20;
    const panelW = 200;
    const panelH = 30 + lapTimes.length * 28;
    ctx.fillStyle = 'rgba(26, 26, 46, 0.85)';
    ctx.strokeStyle = 'rgba(0, 255, 170, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = 'rgba(0, 255, 170)';
    ctx.shadowBlur = 6;
    this.roundRect(ctx, panelX, panelY, panelW, panelH, 8);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#00ffaa';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('分段成绩', panelX + 12, panelY + 22);
    for (let i = 0; i < lapTimes.length; i++) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = '12px Arial';
      ctx.fillText(
        `Lap ${i + 1}: ${this.formatTime(lapTimes[i])}`,
        panelX + 12,
        panelY + 48 + i * 28
      );
    }
    ctx.restore();
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ): void {
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
}
