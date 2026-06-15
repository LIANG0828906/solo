import { Player } from './Player';
import { TILE_SIZE } from './Maze';

export type DoorState = 'closed' | 'opening' | 'open';

export class Door {
  public x: number;
  public y: number;
  public width: number = 40;
  public height: number = 60;
  public state: DoorState = 'closed';
  public openProgress: number = 0;
  public sensorRadius: number = 20;
  public sensorActive: boolean = false;
  public energyRequired: number = 5;

  constructor(gridX: number, gridY: number) {
    this.x = gridX * TILE_SIZE;
    this.y = gridY * TILE_SIZE;
  }

  public getSensorX(): number {
    return this.x;
  }

  public getSensorY(): number {
    return this.y + this.height;
  }

  public update(player: Player, collectedEnergy: number): void {
    const sx = this.getSensorX();
    const sy = this.getSensorY();
    const dx = player.x - sx;
    const dy = player.y - sy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    this.sensorActive = collectedEnergy >= this.energyRequired;

    if (this.state === 'closed' && this.sensorActive && dist < this.sensorRadius + player.radius) {
      this.state = 'opening';
    }

    if (this.state === 'opening') {
      this.openProgress += 1 / 30;
      if (this.openProgress >= 1) {
        this.openProgress = 1;
        this.state = 'open';
      }
    }
  }

  public checkCollision(player: Player): boolean {
    if (this.state === 'open') return false;

    const currentHeight = this.height * (1 - this.openProgress);
    const px = player.x;
    const py = player.y;
    const pr = player.radius - 2;

    const closestX = Math.max(this.x, Math.min(px, this.x + this.width));
    const closestY = Math.max(this.y, Math.min(py, this.y + currentHeight));
    const dx = px - closestX;
    const dy = py - closestY;

    return (dx * dx + dy * dy) < (pr * pr);
  }

  public render(ctx: CanvasRenderingContext2D, time: number): void {
    this.renderSensor(ctx, time);

    const currentHeight = this.height * (1 - this.openProgress);
    if (currentHeight <= 0) return;

    ctx.save();
    const alpha = this.state === 'open' ? 0.3 : (1 - this.openProgress * 0.7);
    ctx.globalAlpha = alpha;

    const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + currentHeight);
    gradient.addColorStop(0, '#3A2020');
    gradient.addColorStop(0.5, '#5C2828');
    gradient.addColorStop(1, '#2C1818');

    ctx.fillStyle = gradient;
    ctx.fillRect(this.x, this.y, this.width, currentHeight);

    ctx.strokeStyle = '#8B3030';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, this.width, currentHeight);

    if (this.state !== 'open') {
      const barCount = Math.floor(currentHeight / 12);
      for (let i = 0; i < barCount; i++) {
        const barY = this.y + 6 + i * 12;
        ctx.fillStyle = 'rgba(139, 48, 48, 0.6)';
        ctx.fillRect(this.x + 5, barY, this.width - 10, 2);
      }
    }

    ctx.restore();
  }

  private renderSensor(ctx: CanvasRenderingContext2D, time: number): void {
    const sx = this.getSensorX();
    const sy = this.getSensorY();

    ctx.save();

    if (this.sensorActive) {
      const pulse = 0.6 + 0.4 * Math.sin(time * 6);
      const green1 = `rgba(0, 255, 0, ${pulse * 0.5})`;
      const green2 = `rgba(0, 170, 0, ${pulse * 0.3})`;

      const gradient = ctx.createRadialGradient(sx, sy, 0, sx, sy, this.sensorRadius * 1.5);
      gradient.addColorStop(0, green1);
      gradient.addColorStop(1, 'rgba(0, 170, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(sx, sy, this.sensorRadius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      const coreGradient = ctx.createRadialGradient(sx, sy, 0, sx, sy, this.sensorRadius);
      coreGradient.addColorStop(0, `rgba(0, 255, 0, ${pulse})`);
      coreGradient.addColorStop(1, 'rgba(0, 170, 0, 0.6)');
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(sx, sy, this.sensorRadius, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(50, 50, 50, 0.8)';
      ctx.beginPath();
      ctx.arc(sx, sy, this.sensorRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(100, 100, 100, 0.9)';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${this.energyRequired}`, sx, sy);
    }

    ctx.restore();
  }

  public isOpen(): boolean {
    return this.state === 'open';
  }
}
