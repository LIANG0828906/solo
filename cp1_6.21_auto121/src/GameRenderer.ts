import type { GameState, Enemy, Bullet, Particle, Player } from './GameEngine';

const COLOR_BG = '#0D1117';
const COLOR_PLAYER = '#00E5FF';
const COLOR_BULLET = '#FF5252';
const COLOR_ENEMY = '#FFD740';

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    this.ctx = ctx;
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  render(state: GameState): void {
    const ctx = this.ctx;
    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, state.canvasWidth, state.canvasHeight);

    for (const p of state.particles) {
      this.renderParticle(p);
    }

    for (const b of state.bullets) {
      this.renderBullet(b);
    }

    for (const e of state.enemies) {
      this.renderEnemy(e);
    }

    if (!state.gameOver) {
      this.renderPlayer(state.player);
    }
  }

  private renderPlayer(player: Player): void {
    const ctx = this.ctx;
    const { x, y } = player.position;
    const s = player.size;
    ctx.save();
    ctx.fillStyle = COLOR_PLAYER;
    ctx.shadowColor = COLOR_PLAYER;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(x, y - s / 2);
    ctx.lineTo(x - s / 2, y + s / 2);
    ctx.lineTo(x, y + s / 4);
    ctx.lineTo(x + s / 2, y + s / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private renderBullet(bullet: Bullet): void {
    const ctx = this.ctx;
    const { x, y } = bullet.position;
    ctx.save();
    ctx.fillStyle = COLOR_BULLET;
    ctx.shadowColor = COLOR_BULLET;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(x, y, bullet.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private renderEnemy(enemy: Enemy): void {
    const ctx = this.ctx;
    const { x, y } = enemy.position;
    const r = enemy.size / 2;
    ctx.save();
    ctx.fillStyle = COLOR_ENEMY;
    ctx.shadowColor = COLOR_ENEMY;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const px = x + Math.cos(angle) * r;
      const py = y + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private renderParticle(particle: Particle): void {
    const ctx = this.ctx;
    const { x, y } = particle.position;
    ctx.save();
    ctx.globalAlpha = particle.alpha;
    ctx.fillStyle = particle.color;
    ctx.shadowColor = particle.color;
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.arc(x, y, particle.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
