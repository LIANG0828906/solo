import { SonarConfig, TargetInfo } from '../types';
import { degToRad } from '../utils/SonarPhysics';

export class RadarRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private centerX: number;
  private centerY: number;
  private maxRange: number;
  private scanAngle: number = 0;

  constructor(canvasId: string, maxRange: number = 80) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;
    this.maxRange = maxRange;
  }

  render(config: SonarConfig, targets: TargetInfo[], currentTime: number): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    const bgGradient = ctx.createRadialGradient(
      this.centerX, this.centerY, 0,
      this.centerX, this.centerY, this.centerX
    );
    bgGradient.addColorStop(0, 'rgba(0, 40, 60, 0.9)');
    bgGradient.addColorStop(1, 'rgba(0, 10, 20, 0.95)');
    ctx.fillStyle = bgGradient;
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.centerX - 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(0, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    const rings = 4;
    for (let i = 1; i <= rings; i++) {
      const r = (this.centerX - 4) * (i / rings);
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(0, 255, 255, 0.15)';
    for (let a = 0; a < 360; a += 30) {
      const rad = degToRad(a);
      ctx.beginPath();
      ctx.moveTo(this.centerX, this.centerY);
      ctx.lineTo(
        this.centerX + Math.cos(rad) * (this.centerX - 4),
        this.centerY + Math.sin(rad) * (this.centerX - 4)
      );
      ctx.stroke();
    }

    const beamRad = degToRad(config.beamWidth);
    const hAngle = degToRad(-config.horizontalAngle);
    const coneStart = hAngle - beamRad / 2;
    const coneEnd = hAngle + beamRad / 2;

    const coneGradient = ctx.createRadialGradient(
      this.centerX, this.centerY, 0,
      this.centerX, this.centerY, this.centerX
    );
    coneGradient.addColorStop(0, 'rgba(0, 255, 255, 0.35)');
    coneGradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
    ctx.fillStyle = coneGradient;
    ctx.beginPath();
    ctx.moveTo(this.centerX, this.centerY);
    ctx.arc(this.centerX, this.centerY, this.centerX - 4, coneStart, coneEnd);
    ctx.closePath();
    ctx.fill();

    this.scanAngle += 0.03;
    const scanX = this.centerX + Math.cos(this.scanAngle) * (this.centerX - 4);
    const scanY = this.centerY + Math.sin(this.scanAngle) * (this.centerX - 4);
    const scanGradient = ctx.createLinearGradient(
      this.centerX, this.centerY, scanX, scanY
    );
    scanGradient.addColorStop(0, 'rgba(0, 255, 255, 0.8)');
    scanGradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
    ctx.strokeStyle = scanGradient;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.centerX, this.centerY);
    ctx.lineTo(scanX, scanY);
    ctx.stroke();

    targets.forEach((t) => {
      if (!t.detected) return;
      const distRatio = Math.min(1, t.distance / this.maxRange);
      const r = distRatio * (this.centerX - 8);
      const az = degToRad(-t.azimuth);
      const tx = this.centerX + Math.cos(az) * r;
      const ty = this.centerY + Math.sin(az) * r;

      const pulse = 0.7 + Math.sin(currentTime * 4) * 0.3;
      const color = t.materialType === 'fish' ? '#00ff88' : t.materialType === 'metal' ? '#ff6644' : '#ffaa44';
      ctx.shadowBlur = 10;
      ctx.shadowColor = color;
      ctx.fillStyle = color;
      ctx.globalAlpha = pulse;
      ctx.beginPath();
      ctx.arc(tx, ty, 3 + t.echoStrength * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      if (t.materialType === 'fish') {
        const velAngle = Math.atan2(t.velocity.y, t.velocity.x);
        const velLen = 10;
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx + Math.cos(velAngle) * velLen, ty + Math.sin(velAngle) * velLen);
        ctx.stroke();
      }
    });

    ctx.fillStyle = 'rgba(0, 255, 255, 1)';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#00ffff';
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(0, 255, 255, 0.6)';
    ctx.textAlign = 'center';
    for (let i = 1; i <= rings; i++) {
      const dist = Math.round((i / rings) * this.maxRange);
      ctx.fillText(`${dist}m`, this.centerX + 3, this.centerY - (this.centerX - 4) * (i / rings) - 3);
    }

    ctx.textAlign = 'left';
    ctx.fillText('N', this.centerX - 3, 14);
    ctx.fillText('S', this.centerX - 3, this.height - 4);
    ctx.textAlign = 'center';
    ctx.fillText('W', 10, this.centerY + 3);
    ctx.fillText('E', this.width - 10, this.centerY + 3);
  }

  resize(): void {
    // handled by CSS, canvas dimensions fixed
  }
}
