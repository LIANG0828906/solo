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
  guardrailParticles: { x: number; y: number; phase: number; baseX: number; baseY: number }[];
  collisionActive: boolean;
}

export type InterpolationType = 'linear' | 'spline';

export class UIRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private interpolationType: InterpolationType = 'linear';

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
  }

  setInterpolationType(type: InterpolationType): void {
    this.interpolationType = type;
  }

  getInterpolationType(): InterpolationType {
    return this.interpolationType;
  }

  render(uiData: UIData): void {
    if (uiData.guardrailParticles.length > 0) {
      this.drawGuardrailParticles(uiData.guardrailParticles);
    }
    this.drawSpeedometer(uiData.speed, uiData.maxSpeed, 1050, 80);
    this.drawLapInfo(uiData.currentLap, uiData.totalLaps, uiData.currentLapTime, uiData.totalTime, 1050, 200);
    this.drawMiniMap(uiData.cars, 980, 580, 200, 200);
    if (uiData.showLeaderboard) {
      this.drawLeaderboard(uiData.leaderboard);
    } else {
      this.drawLeaderboardToggle();
    }
    if (uiData.screenFlashAlpha > 0 || uiData.collisionActive) {
      this.drawScreenFlash(Math.max(uiData.screenFlashAlpha, uiData.collisionActive ? 0.3 : 0));
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
    gradient.addColorStop(0, 'rgba(0, 255, 170, 0.12)');
    gradient.addColorStop(1, 'rgba(0, 255, 170, 0.05)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = '#00ffaa';
    ctx.shadowBlur = 15;
    ctx.strokeStyle = '#00ffaa';
    ctx.lineWidth = 3;
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
      ctx.shadowColor = '#00ffaa';
      ctx.shadowBlur = i % 2 === 0 ? 4 : 2;
      ctx.beginPath();
      ctx.moveTo(centerX + Math.cos(angle) * innerR, centerY + Math.sin(angle) * innerR);
      ctx.lineTo(centerX + Math.cos(angle) * outerR, centerY + Math.sin(angle) * outerR);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    const speedRatio = Math.min(1, Math.max(0, speed / maxSpeed));
    const needleAngle = Math.PI + speedRatio * Math.PI;
    const needleLength = radius - 25;
    ctx.shadowColor = '#ff4757';
    ctx.shadowBlur = 12;
    ctx.strokeStyle = '#ff4757';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + Math.cos(needleAngle) * needleLength,
      centerY + Math.sin(needleAngle) * needleLength
    );
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#00ffaa';
    ctx.shadowColor = '#00ffaa';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#00ffaa';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#00ffaa';
    ctx.shadowBlur = 8;
    ctx.fillText(`${Math.round(speed * 3.6)}`, centerX, centerY + 30);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '10px Arial';
    ctx.fillText('KM/H', centerX, centerY + 45);
    ctx.fillStyle = '#00ffaa';
    ctx.font = 'bold 14px Arial';
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#00ffaa';
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
    ctx.shadowColor = '#00ffaa';
    ctx.shadowBlur = 12;
    ctx.fillStyle = 'rgba(26, 26, 46, 0.92)';
    ctx.strokeStyle = 'rgba(0, 255, 170, 0.6)';
    ctx.lineWidth = 2;
    this.roundRect(ctx, panelX, panelY, panelWidth, panelHeight, 10);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#00ffaa';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#00ffaa';
    ctx.shadowBlur = 8;
    ctx.fillText(`${currentLap} / ${totalLaps}`, x, y + 40);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '12px Arial';
    ctx.fillText('圈数', x, y + 60);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Arial';
    ctx.shadowColor = '#00ffaa';
    ctx.shadowBlur = 4;
    ctx.fillText(this.formatTime(lapTime), x, y + 85);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '12px Arial';
    ctx.fillText('单圈计时', x, y + 105);
    ctx.fillStyle = '#ffa502';
    ctx.font = 'bold 16px Arial';
    ctx.shadowColor = '#ffa502';
    ctx.shadowBlur = 6;
    ctx.fillText(this.formatTime(totalTime), x, y + 128);
    ctx.shadowBlur = 0;
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
    ctx.shadowBlur = 10;
    this.roundRect(ctx, x, y, width, height, 10);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#00ffaa';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#00ffaa';
    ctx.shadowBlur = 4;
    ctx.fillText('小地图', x + width / 2, y + 20);
    ctx.shadowBlur = 0;
    const mapPadding = 15;
    const mapInnerX = x + mapPadding;
    const mapInnerY = y + 30;
    const mapInnerW = width - mapPadding * 2;
    const mapInnerH = height - 30 - mapPadding;
    ctx.strokeStyle = 'rgba(30, 60, 114, 0.9)';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#00ffaa';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    const cx = mapInnerX + mapInnerW / 2;
    const cy = mapInnerY + mapInnerH / 2;
    const rx = mapInnerW / 2 - 4;
    const ry = mapInnerH / 2 - 4;
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(0, 255, 170, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * 0.65, ry * 0.65, 0, 0, Math.PI * 2);
    ctx.stroke();
    for (const car of cars) {
      const dotX = mapInnerX + (car.x / 1200) * mapInnerW;
      const dotY = mapInnerY + (car.y / 800) * mapInnerH;
      ctx.fillStyle = car.color;
      ctx.shadowColor = car.color;
      ctx.shadowBlur = car.isPlayer ? 10 : 5;
      ctx.beginPath();
      ctx.arc(dotX, dotY, car.isPlayer ? 5 : 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      if (car.isPlayer) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
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
    ctx.fillStyle = 'rgba(10, 10, 18, 0.96)';
    ctx.strokeStyle = 'rgba(0, 255, 170, 0.7)';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(0, 255, 170)';
    ctx.shadowBlur = 18;
    this.roundRect(ctx, panelX, panelY, panelWidth, panelHeight, 15);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#00ffaa';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#00ffaa';
    ctx.shadowBlur = 6;
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
    const goldColors = ['#ffd700', '#ffdf00', '#ffe700', '#fff000', '#fff800'];
    const silverColors = ['#c0c0c0', '#d0d0d0', '#e0e0e0'];
    const bronzeColors = ['#cd7f32', '#d4874a', '#db9562'];
    for (let i = 0; i < Math.min(sortedEntries.length, 6); i++) {
      const entry = sortedEntries[i];
      entry.rank = i + 1;
      const rowY = headerY + 35 + i * 48;
      const cardHeight = 40;
      const isGold = i === 0;
      const isSilver = i === 1;
      const isBronze = i === 2;
      const isMedal = isGold || isSilver || isBronze;
      let rowColor = '#1a1a2e';
      if (isGold) rowColor = '#ffd700';
      else if (isSilver) rowColor = '#c0c0c0';
      else if (isBronze) rowColor = '#cd7f32';
      const cardGrad = ctx.createLinearGradient(panelX + 10, rowY, panelX + panelWidth - 10, rowY);
      if (isGold) {
        cardGrad.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
        cardGrad.addColorStop(0.3, 'rgba(255, 223, 0, 0.25)');
        cardGrad.addColorStop(0.5, 'rgba(255, 215, 0, 0.15)');
        cardGrad.addColorStop(0.7, 'rgba(255, 223, 0, 0.25)');
        cardGrad.addColorStop(1, 'rgba(255, 215, 0, 0.4)');
      } else if (isSilver) {
        cardGrad.addColorStop(0, 'rgba(192, 192, 192, 0.35)');
        cardGrad.addColorStop(0.5, 'rgba(220, 220, 220, 0.15)');
        cardGrad.addColorStop(1, 'rgba(192, 192, 192, 0.35)');
      } else if (isBronze) {
        cardGrad.addColorStop(0, 'rgba(205, 127, 50, 0.35)');
        cardGrad.addColorStop(0.5, 'rgba(219, 149, 98, 0.15)');
        cardGrad.addColorStop(1, 'rgba(205, 127, 50, 0.35)');
      } else {
        cardGrad.addColorStop(0, 'rgba(26, 26, 46, 0.8)');
        cardGrad.addColorStop(0.5, 'rgba(30, 30, 60, 0.5)');
        cardGrad.addColorStop(1, 'rgba(26, 26, 46, 0.8)');
      }
      ctx.fillStyle = cardGrad;
      ctx.strokeStyle = entry.isPlayer ? 'rgba(0, 255, 170, 0.6)' : 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1.5;
      if (isGold) {
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 15;
      } else if (entry.isPlayer) {
        ctx.shadowColor = '#00ffaa';
        ctx.shadowBlur = 6;
      }
      this.roundRect(ctx, panelX + 10, rowY, panelWidth - 20, cardHeight, 6);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      const textColor = isGold ? '#ffd700' : isSilver ? '#c0c0c0' : isBronze ? '#cd7f32' : '#ffffff';
      ctx.fillStyle = textColor;
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'left';
      if (isGold) {
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 8;
      }
      const medals = ['🥇', '🥈', '🥉'];
      ctx.fillText(
        i < 3 ? medals[i] : `#${entry.rank}`,
        panelX + 22,
        rowY + 26
      );
      ctx.shadowBlur = 0;
      ctx.fillStyle = entry.isPlayer ? '#00ffaa' : '#ffffff';
      if (entry.isPlayer) {
        ctx.shadowColor = '#00ffaa';
        ctx.shadowBlur = 4;
      }
      ctx.fillText(
        entry.name + (entry.isPlayer ? ' (你)' : ''),
        panelX + 80,
        rowY + 26
      );
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = '13px Arial';
      ctx.fillText(this.formatTime(entry.lapTimes[0] || 0), panelX + 220, rowY + 26);
      ctx.fillText(this.formatTime(entry.lapTimes[1] || 0), panelX + 300, rowY + 26);
      ctx.fillText(this.formatTime(entry.lapTimes[2] || 0), panelX + 380, rowY + 26);
      ctx.fillStyle = '#ffa502';
      ctx.font = 'bold 14px Arial';
      ctx.shadowColor = '#ffa502';
      ctx.shadowBlur = 3;
      ctx.fillText(this.formatTime(entry.totalTime), panelX + 430, rowY + 26);
      ctx.shadowBlur = 0;
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
    ctx.shadowBlur = 10;
    this.roundRect(ctx, btnX, btnY, btnW, btnH, 8);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#00ffaa';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#00ffaa';
    ctx.shadowBlur = 4;
    ctx.fillText('按 L 键切换排行榜', this.width / 2, btnY + 26);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  private drawScreenFlash(alpha: number): void {
    const ctx = this.ctx;
    ctx.save();
    const gradient = ctx.createRadialGradient(
      this.width / 2,
      this.height / 2,
      Math.min(this.width, this.height) * 0.2,
      this.width / 2,
      this.height / 2,
      Math.max(this.width, this.height) * 0.85
    );
    gradient.addColorStop(0, `rgba(255, 0, 0, 0)`);
    gradient.addColorStop(0.6, `rgba(255, 50, 50, ${Math.min(0.4, alpha * 0.5)})`);
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
      ctx.shadowBlur = 10;
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
      ctx.shadowBlur = 12;
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
    ctx.shadowBlur = 18;
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
    ctx.shadowBlur = 35;
    const text = count > 0 ? count.toString() : 'GO!';
    ctx.fillText(text, cx, cy);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
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
    ctx.shadowBlur = 8;
    this.roundRect(ctx, panelX, panelY, panelW, panelH, 8);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#00ffaa';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.shadowColor = '#00ffaa';
    ctx.shadowBlur = 3;
    ctx.fillText('分段成绩', panelX + 12, panelY + 22);
    ctx.shadowBlur = 0;
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

  private drawGuardrailParticles(
    particles: { x: number; y: number; phase: number; baseX: number; baseY: number }[]
  ): void {
    const ctx = this.ctx;
    const time = performance.now() / 500;
    ctx.save();
    for (const p of particles) {
      const alpha = 0.25 + Math.sin(time + p.phase) * 0.35;
      const offset = Math.sin(time * 1.5 + p.phase) * 2;
      ctx.fillStyle = `rgba(0, 255, 170, ${alpha.toFixed(3)})`;
      ctx.shadowColor = '#00ffaa';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x + offset, p.y + offset * 0.5, 2 + Math.sin(time + p.phase) * 1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  drawFinishLineWithFlag(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    animate: boolean
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(startX, startY - 30);
    ctx.lineTo(endX, endY - 30);
    ctx.stroke();
    ctx.shadowBlur = 0;
    const segments = 8;
    const dx = (endX - startX) / segments;
    for (let i = 0; i < segments; i++) {
      const x1 = startX + dx * i;
      ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#111111';
      ctx.fillRect(x1, startY - 35, dx, 10);
    }
    if (animate) {
      const time = performance.now() / 150;
      const poleX = endX + 5;
      const poleTopY = endY - 100;
      const poleBottomY = endY - 40;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#00ffaa';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(poleX, poleBottomY);
      ctx.lineTo(poleX, poleTopY);
      ctx.stroke();
      const flagWidth = 45;
      const flagHeight = 30;
      const waveOffset = Math.sin(time) * 8;
      ctx.fillStyle = '#ff4757';
      ctx.shadowColor = '#ff4757';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(poleX, poleTopY);
      ctx.bezierCurveTo(
        poleX + flagWidth * 0.3,
        poleTopY + waveOffset,
        poleX + flagWidth * 0.7,
        poleTopY + flagHeight - waveOffset,
        poleX + flagWidth,
        poleTopY + flagHeight / 2
      );
      ctx.bezierCurveTo(
        poleX + flagWidth * 0.7,
        poleTopY + flagHeight + waveOffset * 0.5,
        poleX + flagWidth * 0.3,
        poleTopY + flagHeight - waveOffset * 0.3,
        poleX,
        poleTopY + flagHeight
      );
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }

  drawCarWithNeonGlow(
    x: number,
    y: number,
    angle: number,
    width: number,
    height: number,
    fillColor: string,
    glowColor: string,
    glowIntensity: number = 12,
    isGhost: boolean = false
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    if (isGhost) {
      ctx.globalAlpha = 0.55;
    }
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = glowIntensity;
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = isGhost ? 1.5 : 2.5;
    const w = width;
    const h = height;
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 4, -h / 2);
    ctx.lineTo(-w / 3, -h / 2);
    ctx.lineTo(-w / 2, -h / 4);
    ctx.lineTo(-w / 2, h / 4);
    ctx.lineTo(-w / 3, h / 2);
    ctx.lineTo(w / 4, h / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (!isGhost) {
      ctx.shadowBlur = glowIntensity * 0.5;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(w / 2 - 2, -h / 4, 1.5, 0, Math.PI * 2);
      ctx.arc(w / 2 - 2, h / 4, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  drawTrackWithNeonEdges(
    outerBoundary: { x: number; y: number }[],
    innerBoundary: { x: number; y: number }[],
    centerLine: { x: number; y: number }[]
  ): void {
    const ctx = this.ctx;
    ctx.save();
    const trackGrad = ctx.createRadialGradient(
      this.width / 2,
      this.height / 2,
      100,
      this.width / 2,
      this.height / 2,
      650
    );
    trackGrad.addColorStop(0, '#0d0d1a');
    trackGrad.addColorStop(1, '#050508');
    ctx.fillStyle = trackGrad;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.fillStyle = '#161a28';
    ctx.strokeStyle = '#2a3a5a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    outerBoundary.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#0a0a12';
    ctx.beginPath();
    innerBoundary.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 255, 170, 0.9)';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00ffaa';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    outerBoundary.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0, 255, 170, 0.75)';
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    innerBoundary.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 2;
    ctx.setLineDash([22, 22]);
    ctx.beginPath();
    centerLine.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  drawObstacleWithGlow(obstacle: {
    x: number;
    y: number;
    radius: number;
    type: 'barrier' | 'cone' | 'pillar';
  }): void {
    const ctx = this.ctx;
    ctx.save();
    let color = '#ff6b35';
    if (obstacle.type === 'barrier') color = '#ff6b35';
    else if (obstacle.type === 'cone') color = '#ff9500';
    else color = '#ff4757';
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(obstacle.x, obstacle.y, obstacle.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 6;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  drawGhostTrail(
    points: { x: number; y: number; alpha: number }[],
    color: string = 'rgba(100, 180, 255, 0.5)',
    glowColor: string = '#64b4ff'
  ): void {
    if (points.length < 2) return;
    const ctx = this.ctx;
    ctx.save();
    for (let i = 1; i < points.length; i++) {
      const p1 = points[i - 1];
      const p2 = points[i];
      const alphaValue = Math.min(1, p1.alpha * 0.55);
      ctx.strokeStyle = color.replace(/[\d.]+\)$/, `${alphaValue.toFixed(3)})`);
      ctx.lineWidth = 5;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
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
