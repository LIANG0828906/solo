import { Player } from './Player';
import { Maze, TILE_SIZE } from './Maze';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

export class Collectible {
  public x: number;
  public y: number;
  public size: number = 10;
  public rotation: number = 0;
  public collected: boolean = false;
  public phase: number;

  private particles: Particle[] = [];

  constructor(x: number, y: number, phase: number = 0) {
    this.x = x;
    this.y = y;
    this.phase = phase;
  }

  public update(time: number, player: Player, onCollect: () => void): void {
    if (this.collected) {
      this.updateParticles();
      return;
    }

    this.rotation += 0.02;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < player.radius + this.size) {
      this.collected = true;
      this.spawnParticles();
      onCollect();
    }
  }

  private spawnParticles(): void {
    const particleCount = 6;
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.3;
      const speed = 2 + Math.random() * 1.5;
      this.particles.push({
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.3,
        maxLife: 0.3,
        size: 3 + Math.random() * 2
      });
    }
  }

  private updateParticles(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 1 / 60;
      p.vx *= 0.96;
      p.vy *= 0.96;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D, time: number): void {
    this.renderParticles(ctx);

    if (this.collected) return;

    const pulse = 0.9 + 0.1 * Math.sin(time * 4 + this.phase);
    const s = this.size * pulse;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 3);
    glowGradient.addColorStop(0, 'rgba(0, 229, 255, 0.4)');
    glowGradient.addColorStop(1, 'rgba(0, 229, 255, 0)');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(0, 0, s * 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6;
      const px = Math.cos(angle) * s;
      const py = Math.sin(angle) * s;
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();

    const hexGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, s);
    hexGradient.addColorStop(0, '#80F4FF');
    hexGradient.addColorStop(0.5, '#00E5FF');
    hexGradient.addColorStop(1, '#00B8CC');
    ctx.fillStyle = hexGradient;
    ctx.fill();

    ctx.strokeStyle = '#B0F8FF';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }

  private renderParticles(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;

      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      gradient.addColorStop(0, `rgba(0, 229, 255, ${alpha})`);
      gradient.addColorStop(1, 'rgba(0, 229, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  public isDead(): boolean {
    return this.collected && this.particles.length === 0;
  }

  public static generate(count: number, maze: Maze, player: Player): Collectible[] {
    const collectibles: Collectible[] = [];
    const emptyCells = maze.getEmptyCells();

    const startGridX = Math.floor(player.x / TILE_SIZE);
    const startGridY = Math.floor(player.y / TILE_SIZE);

    const validCells = emptyCells.filter(cell => {
      const dist = Math.abs(cell.x - startGridX) + Math.abs(cell.y - startGridY);
      return dist > 3;
    });

    for (let i = 0; i < count && validCells.length > 0; i++) {
      const index = Math.floor(Math.random() * validCells.length);
      const cell = validCells.splice(index, 1)[0];
      const x = cell.x * TILE_SIZE + TILE_SIZE / 2;
      const y = cell.y * TILE_SIZE + TILE_SIZE / 2;
      collectibles.push(new Collectible(x, y, i * 0.5));
    }

    return collectibles;
  }
}
