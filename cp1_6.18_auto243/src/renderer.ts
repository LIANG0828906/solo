import { Ship, ShipType, Team, PLAYER_COLORS, AI_COLORS, Bullet, Particle, Debris } from './ship';

interface Star {
  x: number;
  y: number;
  radius: number;
  brightness: number;
}

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private stars: Star[] = [];

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.generateStars();
  }

  private generateStars() {
    this.stars = [];
    for (let i = 0; i < 80; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: 0.5 + Math.random() * 1.0,
        brightness: 0.3 + Math.random() * 0.7,
      });
    }
  }

  clear() {
    this.ctx.fillStyle = '#0B0E14';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawStars() {
    for (const star of this.stars) {
      const alpha = star.brightness;
      this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  drawShip(ship: Ship) {
    if (!ship.alive) return;
    const ctx = this.ctx;
    const poly = ship.getPolygon();

    ctx.save();
    ctx.translate(ship.x, ship.y);

    ctx.beginPath();
    ctx.moveTo(poly[0][0], poly[0][1]);
    for (let i = 1; i < poly.length; i++) {
      ctx.lineTo(poly[i][0], poly[i][1]);
    }
    ctx.closePath();

    ctx.fillStyle = ship.color;
    ctx.fill();

    if (ship.selected) {
      ctx.strokeStyle = '#4A90D9';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.restore();

    this.drawHealthBar(ship);
  }

  private drawHealthBar(ship: Ship) {
    const ctx = this.ctx;
    const barWidth = 40;
    const barHeight = 4;
    const x = ship.x - barWidth / 2;
    const y = ship.y - ship.size - 10;

    ctx.fillStyle = '#333';
    ctx.fillRect(x, y, barWidth, barHeight);

    const hpRatio = ship.displayHp / ship.maxHp;
    const displayWidth = barWidth * hpRatio;

    let barColor: string;
    if (hpRatio > 0.6) {
      barColor = '#2ECC71';
    } else if (hpRatio > 0.3) {
      barColor = '#F39C12';
    } else {
      barColor = '#E74C3C';
    }

    const gradient = ctx.createLinearGradient(x, y, x + barWidth, y);
    gradient.addColorStop(0, '#2ECC71');
    gradient.addColorStop(1, '#E74C3C');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, displayWidth, barHeight);

    ctx.fillStyle = barColor;
    ctx.fillRect(x, y, displayWidth, barHeight);
  }

  drawBullets(bullets: Bullet[]) {
    const ctx = this.ctx;
    for (const b of bullets) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(b.x, b.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = b.color + '66';
      ctx.fill();
      ctx.restore();
    }
  }

  drawParticles(particles: Particle[]) {
    const ctx = this.ctx;
    for (const p of particles) {
      const alpha = p.life / p.maxLife;
      ctx.save();
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * p.length / 8, p.y - p.vy * p.length / 8);
      ctx.stroke();
      ctx.restore();
    }
  }

  drawDebris(debrisList: Debris[]) {
    const ctx = this.ctx;
    for (const d of debrisList) {
      const alpha = d.life / d.maxLife;
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.rotation);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = d.color;
      ctx.beginPath();
      if (d.points.length > 0) {
        ctx.moveTo(d.points[0][0], d.points[0][1]);
        for (let i = 1; i < d.points.length; i++) {
          ctx.lineTo(d.points[i][0], d.points[i][1]);
        }
        ctx.closePath();
      }
      ctx.fill();
      ctx.restore();
    }
  }

  drawSelectionRect(x1: number, y1: number, x2: number, y2: number) {
    const ctx = this.ctx;
    const left = Math.min(x1, x2);
    const top = Math.min(y1, y2);
    const w = Math.abs(x2 - x1);
    const h = Math.abs(y2 - y1);

    ctx.fillStyle = 'rgba(74, 144, 217, 0.15)';
    ctx.fillRect(left, top, w, h);
    ctx.strokeStyle = '#4A90D9';
    ctx.lineWidth = 1;
    ctx.strokeRect(left, top, w, h);
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.generateStars();
  }
}
