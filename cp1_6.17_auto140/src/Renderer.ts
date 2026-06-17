import { GalaxyState, Star, SupernovaParticle, CollisionEvent } from './GalaxyState';

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;

  constructor(canvas: HTMLCanvasElement, width: number, height: number) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.width = width;
    this.height = height;
    this.resize(width, height);
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
  }

  render(state: GalaxyState): void {
    this.clear();
    this.drawBackground();
    this.drawTrails(state);
    this.drawGalaxies(state);
    this.drawSupernovas(state);
    this.drawCollisionHalos(state);
  }

  private clear(): void {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  private drawBackground(): void {
    const gradient = this.ctx.createRadialGradient(
      this.width / 2,
      this.height / 2,
      0,
      this.width / 2,
      this.height / 2,
      Math.max(this.width, this.height) * 0.7
    );
    gradient.addColorStop(0, '#1F2833');
    gradient.addColorStop(1, '#0B0C10');

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.drawBackgroundStars();
  }

  private drawBackgroundStars(): void {
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    const seed = 42;
    for (let i = 0; i < 100; i++) {
      const x = ((Math.sin(i * 12.9898 + seed) * 43758.5453) % 1 + 1) % 1 * this.width;
      const y = ((Math.sin(i * 78.233 + seed) * 43758.5453) % 1 + 1) % 1 * this.height;
      const size = ((Math.sin(i * 43.758 + seed) * 43758.5453) % 1 + 1) % 1 * 1.5 + 0.5;
      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private drawTrails(state: GalaxyState): void {
    state.galaxies.forEach(galaxy => {
      if (galaxy.trail.length < 2) return;

      for (let i = 1; i < galaxy.trail.length; i++) {
        const alpha = 1 - i / galaxy.trail.length;
        this.ctx.strokeStyle = `rgba(79, 195, 247, ${alpha * 0.3})`;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(galaxy.trail[i - 1].x, galaxy.trail[i - 1].y);
        this.ctx.lineTo(galaxy.trail[i].x, galaxy.trail[i].y);
        this.ctx.stroke();
      }
    });
  }

  private drawGalaxies(state: GalaxyState): void {
    state.galaxies.forEach(galaxy => {
      this.drawStars(galaxy.stars, galaxy.color);

      this.ctx.strokeStyle = `${galaxy.color}40`;
      this.ctx.lineWidth = 1;
      this.ctx.setLineDash([4, 4]);
      this.ctx.beginPath();
      this.ctx.arc(galaxy.centerX, galaxy.centerY, 100, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.setLineDash([]);

      this.drawGalaxyCenter(galaxy.centerX, galaxy.centerY, galaxy.color);
    });
  }

  private drawStars(stars: Star[], color: string): void {
    stars.forEach(star => {
      const size = star.type === 'core' ? 2.5 : 1.5;
      const alpha = star.type === 'core' ? 1 : 0.8;

      this.ctx.fillStyle = this.hexToRgba(color, alpha);
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, size, 0, Math.PI * 2);
      this.ctx.fill();

      const glowSize = size * 2;
      const gradient = this.ctx.createRadialGradient(
        star.x, star.y, 0,
        star.x, star.y, glowSize
      );
      gradient.addColorStop(0, this.hexToRgba(color, alpha * 0.3));
      gradient.addColorStop(1, this.hexToRgba(color, 0));
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, glowSize, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  private drawGalaxyCenter(x: number, y: number, color: string): void {
    const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, 20);
    gradient.addColorStop(0, this.hexToRgba(color, 0.8));
    gradient.addColorStop(0.5, this.hexToRgba(color, 0.3));
    gradient.addColorStop(1, this.hexToRgba(color, 0));

    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(x, y, 20, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.beginPath();
    this.ctx.arc(x, y, 4, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawSupernovas(state: GalaxyState): void {
    state.supernovas.forEach(supernova => {
      const alpha = supernova.life / supernova.maxLife;
      const size = supernova.size * (1 + (1 - alpha) * 2);

      const gradient = this.ctx.createRadialGradient(
        supernova.x, supernova.y, 0,
        supernova.x, supernova.y, size * 3
      );
      gradient.addColorStop(0, this.hexToRgba(supernova.color, alpha));
      gradient.addColorStop(0.3, this.hexToRgba(supernova.color, alpha * 0.5));
      gradient.addColorStop(1, this.hexToRgba(supernova.color, 0));

      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(supernova.x, supernova.y, size * 3, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(supernova.x, supernova.y, size * 0.5, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  private drawCollisionHalos(state: GalaxyState): void {
    state.collisionEvents.forEach(event => {
      const size = 80;
      const gradient = this.ctx.createRadialGradient(
        event.x, event.y, 0,
        event.x, event.y, size
      );
      gradient.addColorStop(0, `rgba(255, 255, 255, ${event.haloOpacity})`);
      gradient.addColorStop(0.5, `rgba(255, 200, 150, ${event.haloOpacity * 0.5})`);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(
        event.x - size,
        event.y - size,
        size * 2,
        size * 2
      );
    });
  }

  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
}

export default Renderer;
