import type { PlayerState, Platform, PressurePlate, Door, PushableBox, RippleEffect, Rect } from './types';

const COLORS = {
  bgTop: '#1A202C',
  bgBottom: '#2D2A4A',
  platform: '#E2E8F0',
  platformBorder: '#718096',
  player: '#48BB78',
  playerFlash: '#F56565',
  clone: '#63B3ED',
  spike: '#E53E3E',
  spikeLight: '#FC8181',
  goal: '#F6E05E',
  goalBorder: '#D69E2E',
  plateInactive: '#A0AEC0',
  plateActive: '#68D391',
  doorClosed: '#805AD5',
  doorOpen: '#9F7AEA',
  box: '#D69E2E',
  boxBorder: '#B7791F',
  text: '#E2E8F0',
  heart: '#E53E3E',
  heartEmpty: '#4A5568',
  ripple: 'rgba(255, 255, 255, 0.7)',
  recordingBadge: '#F56565',
  rewoundBadge: '#63B3ED'
};

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;

  constructor(ctx: CanvasRenderingContext2D, width: number = 800, height: number = 600) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
  }

  clear(): void {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, COLORS.bgTop);
    gradient.addColorStop(1, COLORS.bgBottom);
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawPlatforms(platforms: Platform[]): void {
    for (const p of platforms) {
      if (p.type === 'solid') {
        this.ctx.fillStyle = COLORS.platform;
        this.ctx.fillRect(p.x, p.y, p.w, p.h);
        this.ctx.strokeStyle = COLORS.platformBorder;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(p.x + 1, p.y + 1, p.w - 2, p.h - 2);
      } else if (p.type === 'spike') {
        this.drawSpikes(p);
      }
    }
  }

  private drawSpikes(p: Rect): void {
    const spikeCount = Math.floor(p.w / 10);
    const spikeWidth = p.w / spikeCount;
    this.ctx.fillStyle = COLORS.spike;
    for (let i = 0; i < spikeCount; i++) {
      const sx = p.x + i * spikeWidth;
      this.ctx.beginPath();
      this.ctx.moveTo(sx, p.y + p.h);
      this.ctx.lineTo(sx + spikeWidth / 2, p.y);
      this.ctx.lineTo(sx + spikeWidth, p.y + p.h);
      this.ctx.closePath();
      this.ctx.fill();
    }
    this.ctx.strokeStyle = COLORS.spikeLight;
    this.ctx.lineWidth = 1;
    for (let i = 0; i < spikeCount; i++) {
      const sx = p.x + i * spikeWidth;
      this.ctx.beginPath();
      this.ctx.moveTo(sx, p.y + p.h);
      this.ctx.lineTo(sx + spikeWidth / 2, p.y);
      this.ctx.lineTo(sx + spikeWidth, p.y + p.h);
      this.ctx.stroke();
    }
  }

  drawGoal(goal: Rect, pulse: number): void {
    this.ctx.save();
    this.ctx.shadowColor = COLORS.goal;
    this.ctx.shadowBlur = 10 + pulse * 5;
    this.ctx.fillStyle = COLORS.goal;
    this.ctx.fillRect(goal.x, goal.y, goal.w, goal.h);
    this.ctx.restore();
    this.ctx.strokeStyle = COLORS.goalBorder;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(goal.x + 1, goal.y + 1, goal.w - 2, goal.h - 2);
    this.ctx.fillStyle = '#1A202C';
    this.ctx.font = 'bold 16px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('★', goal.x + goal.w / 2, goal.y + goal.h / 2);
  }

  drawPlates(plates: PressurePlate[]): void {
    for (const plate of plates) {
      this.ctx.fillStyle = plate.activated ? COLORS.plateActive : COLORS.plateInactive;
      const yOffset = plate.activated ? 4 : 0;
      this.ctx.fillRect(plate.x + 4, plate.y + yOffset, plate.w - 8, plate.h - yOffset);
      this.ctx.strokeStyle = '#4A5568';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(plate.x + 4, plate.y + yOffset, plate.w - 8, plate.h - yOffset);
    }
  }

  drawDoors(doors: Door[]): void {
    for (const door of doors) {
      if (door.open) {
        this.ctx.fillStyle = COLORS.doorOpen;
        this.ctx.globalAlpha = 0.3;
        this.ctx.fillRect(door.x, door.y, door.w, door.h);
        this.ctx.globalAlpha = 1;
      } else {
        this.ctx.fillStyle = COLORS.doorClosed;
        this.ctx.fillRect(door.x, door.y, door.w, door.h);
        this.ctx.strokeStyle = '#553C9A';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(door.x + 1, door.y + 1, door.w - 2, door.h - 2);
        if (door.isTimed && door.timer > 0) {
          const barHeight = 6;
          const barWidth = door.w - 4;
          this.ctx.fillStyle = '#2D3748';
          this.ctx.fillRect(door.x + 2, door.y - barHeight - 4, barWidth, barHeight);
          this.ctx.fillStyle = '#F6E05E';
          const timerRatio = door.timer / door.maxTimer;
          this.ctx.fillRect(door.x + 2, door.y - barHeight - 4, barWidth * timerRatio, barHeight);
        }
      }
    }
  }

  drawBoxes(boxes: PushableBox[]): void {
    for (const box of boxes) {
      this.ctx.fillStyle = COLORS.box;
      this.ctx.fillRect(box.x, box.y, box.w, box.h);
      this.ctx.strokeStyle = COLORS.boxBorder;
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(box.x + 1, box.y + 1, box.w - 2, box.h - 2);
      this.ctx.strokeStyle = COLORS.boxBorder;
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(box.x, box.y);
      this.ctx.lineTo(box.x + box.w, box.y + box.h);
      this.ctx.moveTo(box.x + box.w, box.y);
      this.ctx.lineTo(box.x, box.y + box.h);
      this.ctx.stroke();
    }
  }

  drawPlayer(player: PlayerState, isFlashing: boolean, flashTimer: number): void {
    this.ctx.save();
    if (isFlashing && Math.floor(flashTimer * 10) % 2 === 0) {
      this.ctx.fillStyle = COLORS.playerFlash;
    } else {
      this.ctx.fillStyle = COLORS.player;
    }
    this.ctx.shadowColor = COLORS.player;
    this.ctx.shadowBlur = 6;
    this.ctx.fillRect(player.x, player.y, player.w, player.h);
    this.ctx.restore();

    const eyeY = player.y + player.h * 0.35;
    const eyeSize = 4;
    const eyeOffset = player.facingRight ? player.w * 0.55 : player.w * 0.25;
    this.ctx.fillStyle = '#1A202C';
    this.ctx.fillRect(player.x + eyeOffset, eyeY, eyeSize, eyeSize);
    this.ctx.fillRect(player.x + eyeOffset + 8, eyeY, eyeSize, eyeSize);
  }

  drawClone(player: PlayerState): void {
    this.ctx.save();
    this.ctx.globalAlpha = 0.6;
    this.ctx.fillStyle = COLORS.clone;
    this.ctx.shadowColor = COLORS.clone;
    this.ctx.shadowBlur = 8;
    this.ctx.fillRect(player.x, player.y, player.w, player.h);
    this.ctx.restore();

    this.ctx.save();
    this.ctx.globalAlpha = 0.4;
    const eyeY = player.y + player.h * 0.35;
    const eyeSize = 4;
    const eyeOffset = player.facingRight ? player.w * 0.55 : player.w * 0.25;
    this.ctx.fillStyle = '#1A202C';
    this.ctx.fillRect(player.x + eyeOffset, eyeY, eyeSize, eyeSize);
    this.ctx.fillRect(player.x + eyeOffset + 8, eyeY, eyeSize, eyeSize);
    this.ctx.restore();
  }

  drawRipples(ripples: RippleEffect[]): void {
    for (const ripple of ripples) {
      const progress = ripple.elapsed / ripple.duration;
      const currentRadius = ripple.maxRadius * progress;
      const alpha = 1 - progress;
      this.ctx.save();
      this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.7})`;
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(ripple.x, ripple.y, currentRadius, 0, Math.PI * 2);
      this.ctx.stroke();
      if (progress > 0.3) {
        this.ctx.strokeStyle = `rgba(99, 179, 237, ${alpha * 0.5})`;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(ripple.x, ripple.y, currentRadius * 0.6, 0, Math.PI * 2);
        this.ctx.stroke();
      }
      this.ctx.restore();
    }
  }

  drawHUD(levelName: string, isRecording: boolean, hasRewound: boolean, lives: number): void {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(26, 32, 44, 0.7)';
    this.ctx.fillRect(10, 10, 280, 70);
    this.ctx.strokeStyle = 'rgba(226, 232, 240, 0.3)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(10, 10, 280, 70);
    this.ctx.fillStyle = COLORS.text;
    this.ctx.font = 'bold 14px sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(levelName, 22, 32);
    this.ctx.font = '12px sans-serif';
    if (isRecording) {
      this.ctx.fillStyle = COLORS.recordingBadge;
      const dotX = 22;
      const dotY = 48;
      this.ctx.beginPath();
      this.ctx.arc(dotX, dotY, 5, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = COLORS.text;
      this.ctx.fillText('记录中...', dotX + 12, dotY + 4);
    } else if (hasRewound) {
      this.ctx.fillStyle = COLORS.rewoundBadge;
      const dotX = 22;
      const dotY = 48;
      this.ctx.fillRect(dotX - 5, dotY - 5, 10, 10);
      this.ctx.fillStyle = COLORS.text;
      this.ctx.fillText('已回溯', dotX + 12, dotY + 4);
    } else {
      this.ctx.fillStyle = '#718096';
      this.ctx.fillText('按 T 开始记录时间线', 22, 52);
    }
    const heartY = 70;
    for (let i = 0; i < 3; i++) {
      this.drawHeart(22 + i * 28, heartY - 8, i < lives);
    }
    this.ctx.restore();
  }

  private drawHeart(x: number, y: number, filled: boolean): void {
    this.ctx.save();
    this.ctx.fillStyle = filled ? COLORS.heart : COLORS.heartEmpty;
    this.ctx.beginPath();
    const size = 10;
    this.ctx.moveTo(x, y + size / 4);
    this.ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + size / 4);
    this.ctx.bezierCurveTo(x - size / 2, y + size / 2, x, y + size * 0.75, x, y + size);
    this.ctx.bezierCurveTo(x, y + size * 0.75, x + size / 2, y + size / 2, x + size / 2, y + size / 4);
    this.ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + size / 4);
    this.ctx.fill();
    this.ctx.restore();
  }

  drawControlsHint(): void {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(26, 32, 44, 0.6)';
    this.ctx.fillRect(this.width - 210, 10, 200, 70);
    this.ctx.strokeStyle = 'rgba(226, 232, 240, 0.3)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(this.width - 210, 10, 200, 70);
    this.ctx.fillStyle = '#A0AEC0';
    this.ctx.font = '11px sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('← → / A D : 移动', this.width - 200, 30);
    this.ctx.fillText('Space / ↑ / W : 跳跃', this.width - 200, 48);
    this.ctx.fillText('T : 开始/停止回溯', this.width - 200, 66);
    this.ctx.restore();
  }
}
