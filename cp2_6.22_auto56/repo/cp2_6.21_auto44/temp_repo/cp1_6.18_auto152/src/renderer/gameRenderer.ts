import type { ShipState, Particle, TrackNode, Obstacle, MusicNote } from '../types/gameTypes';

export class GameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number = 0;
  private height: number = 0;
  private scale: number = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    this.ctx = ctx;
    this.resize();
  }

  public resize(): void {
    const container = this.canvas.parentElement;
    if (!container) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const targetRatio = 16 / 9;
    let canvasWidth = containerWidth;
    let canvasHeight = containerWidth / targetRatio;

    if (canvasHeight > containerHeight) {
      canvasHeight = containerHeight;
      canvasWidth = containerHeight * targetRatio;
    }

    this.width = 1280;
    this.height = 720;
    this.scale = canvasWidth / this.width;

    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.width = `${canvasWidth}px`;
    this.canvas.style.height = `${canvasHeight}px`;
  }

  public getWidth(): number {
    return this.width;
  }

  public getHeight(): number {
    return this.height;
  }

  public getScale(): number {
    return this.scale;
  }

  public clear(): void {
    this.ctx.fillStyle = '#0B0C10';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#0B0C10');
    gradient.addColorStop(1, '#1F2833');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  public drawTrack(nodes: TrackNode[]): void {
    if (nodes.length < 2) return;

    this.ctx.save();

    this.ctx.strokeStyle = '#45A29E';
    this.ctx.lineWidth = 3;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.ctx.shadowColor = '#66FCF1';
    this.ctx.shadowBlur = 10;

    this.ctx.beginPath();
    this.ctx.moveTo(nodes[0].x, nodes[0].y);

    for (let i = 1; i < nodes.length; i++) {
      const prev = nodes[i - 1];
      const curr = nodes[i];
      const midX = (prev.x + curr.x) / 2;
      const midY = (prev.y + curr.y) / 2;
      this.ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
    }

    this.ctx.stroke();

    this.ctx.shadowBlur = 0;

    for (const node of nodes) {
      if (node.isPeak) {
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
        this.ctx.fillStyle = '#66FCF1';
        this.ctx.shadowColor = '#66FCF1';
        this.ctx.shadowBlur = 15;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
      }
    }

    this.ctx.restore();
  }

  public drawShip(ship: ShipState): void {
    this.ctx.save();

    for (let i = ship.trail.length - 1; i >= 0; i--) {
      const t = ship.trail[i];
      this.ctx.beginPath();
      this.ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(102, 252, 241, ${t.alpha})`;
      this.ctx.fill();
    }

    this.ctx.translate(ship.x, ship.y);

    let rotation = 0;
    if (ship.velocityY < 0) {
      rotation = -0.2;
    } else if (ship.velocityY > 0) {
      rotation = 0.2;
    }
    this.ctx.rotate(rotation);

    this.ctx.beginPath();
    this.ctx.moveTo(0, -12.5);
    this.ctx.lineTo(-10, 12.5);
    this.ctx.lineTo(10, 12.5);
    this.ctx.closePath();

    const gradient = this.ctx.createLinearGradient(0, -12.5, 0, 12.5);
    gradient.addColorStop(0, '#66FCF1');
    gradient.addColorStop(1, '#45A29E');
    this.ctx.fillStyle = gradient;
    this.ctx.fill();

    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();

    this.ctx.shadowColor = '#66FCF1';
    this.ctx.shadowBlur = 10;
    this.ctx.fill();

    this.ctx.restore();
  }

  public drawObstacles(obstacles: Obstacle[]): void {
    for (const obstacle of obstacles) {
      if (!obstacle.active) continue;

      this.ctx.save();
      this.ctx.translate(obstacle.x, obstacle.y);

      this.ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const x = Math.cos(angle) * obstacle.size;
        const y = Math.sin(angle) * obstacle.size;
        if (i === 0) {
          this.ctx.moveTo(x, y);
        } else {
          this.ctx.lineTo(x, y);
        }
      }
      this.ctx.closePath();

      this.ctx.fillStyle = '#FF3333';
      this.ctx.fill();

      this.ctx.strokeStyle = '#FFFFFF';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      this.ctx.shadowColor = '#FF3333';
      this.ctx.shadowBlur = 8;
      this.ctx.fill();

      this.ctx.restore();
    }
  }

  public drawNotes(notes: MusicNote[]): void {
    for (const note of notes) {
      if (!note.active || note.collected) continue;

      this.ctx.save();
      this.ctx.translate(note.x, note.y);
      this.ctx.rotate(Math.PI / 4);

      this.ctx.beginPath();
      this.ctx.rect(-note.size / 2, -note.size / 2, note.size, note.size);

      this.ctx.fillStyle = '#00FF88';
      this.ctx.fill();

      this.ctx.strokeStyle = '#FFFFFF';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();

      this.ctx.shadowColor = '#00FF88';
      this.ctx.shadowBlur = 10;
      this.ctx.fill();

      this.ctx.restore();
    }
  }

  public drawParticles(particles: Particle[]): void {
    for (const particle of particles) {
      const alpha = particle.life / particle.maxLife;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(0, 255, 136, ${alpha})`;
      this.ctx.fill();
    }
  }

  public render(
    nodes: TrackNode[],
    ship: ShipState,
    obstacles: Obstacle[],
    notes: MusicNote[],
    particles: Particle[]
  ): void {
    this.clear();
    this.drawTrack(nodes);
    this.drawNotes(notes);
    this.drawObstacles(obstacles);
    this.drawParticles(particles);
    this.drawShip(ship);
  }
}
