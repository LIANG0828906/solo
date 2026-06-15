import { Player, Particle } from './Player';
import { Enemy, EnemyType } from './Enemy';
import { Bullet } from './Bullet';
import { PowerUp } from './Spawner';

interface Star {
  x: number;
  y: number;
  size: number;
  twinkleSpeed: number;
  twinkleOffset: number;
}

export class Renderer {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  stars: Star[] = [];

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.initStars();
  }

  private initStars(): void {
    for (let i = 0; i < 200; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 1.8 + 0.4,
        twinkleSpeed: Math.random() * 2 + 1,
        twinkleOffset: Math.random() * Math.PI * 2,
      });
    }
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  clear(): void {
    this.ctx.fillStyle = '#0a0a1a';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawStars(time: number, dt: number): void {
    const ctx = this.ctx;
    for (const s of this.stars) {
      s.y += s.size * 12 * dt;
      if (s.y > this.height) {
        s.y = -2;
        s.x = Math.random() * this.width;
      }
      const alpha = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(time * s.twinkleSpeed + s.twinkleOffset));
      ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawPlayer(player: Player, time: number): void {
    const ctx = this.ctx;
    const { x, y, width, height } = player;

    for (const p of player.trailParticles) {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (player.invincible && Math.sin(time * 20) > 0) return;

    if (player.powerUpActive) {
      ctx.save();
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 15 + Math.sin(time * 8) * 5;
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, width / 2 + 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.fillStyle = '#4488ff';
    ctx.beginPath();
    ctx.moveTo(x, y - height / 2);
    ctx.lineTo(x - width / 2, y + height / 2);
    ctx.lineTo(x - width / 6, y + height / 3);
    ctx.lineTo(x + width / 6, y + height / 3);
    ctx.lineTo(x + width / 2, y + height / 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#66bbff';
    ctx.beginPath();
    ctx.moveTo(x, y - height / 2 + 6);
    ctx.lineTo(x - width / 5, y + height / 4);
    ctx.lineTo(x + width / 5, y + height / 4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#88ddff';
    ctx.beginPath();
    ctx.arc(x, y - 2, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  drawEnemies(enemies: Enemy[]): void {
    const ctx = this.ctx;
    for (const e of enemies) {
      ctx.fillStyle = e.color;

      if (e.type === EnemyType.HEAVY) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 3) * i - Math.PI / 2;
          const px = e.x + Math.cos(a) * e.size;
          const py = e.y + Math.sin(a) * e.size;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        if (e.hp < e.maxHp) {
          const ratio = e.hp / e.maxHp;
          ctx.fillStyle = '#ff2222';
          ctx.fillRect(e.x - 15, e.y - e.size - 10, 30 * ratio, 4);
          ctx.strokeStyle = 'rgba(255,255,255,0.3)';
          ctx.lineWidth = 1;
          ctx.strokeRect(e.x - 15, e.y - e.size - 10, 30, 4);
        }
      } else if (e.type === EnemyType.FAST) {
        ctx.beginPath();
        ctx.moveTo(e.x, e.y - e.size);
        ctx.lineTo(e.x + e.size * 0.7, e.y);
        ctx.lineTo(e.x, e.y + e.size);
        ctx.lineTo(e.x - e.size * 0.7, e.y);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(e.x - e.size, e.y - e.size * 0.7);
        ctx.lineTo(e.x + e.size, e.y - e.size * 0.7);
        ctx.lineTo(e.x, e.y + e.size * 0.7);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  drawBullets(bullets: Bullet[]): void {
    const ctx = this.ctx;
    for (const b of bullets) {
      if (b.piercing) {
        ctx.save();
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#00ff88';
        ctx.fillRect(b.x - 2, b.y - 7, 4, 14);
        ctx.restore();
      } else {
        ctx.save();
        ctx.shadowColor = '#44ff44';
        ctx.shadowBlur = 4;
        ctx.fillStyle = '#44ff44';
        ctx.fillRect(b.x - 1.5, b.y - 6, 3, 12);
        ctx.restore();
      }
    }
  }

  drawPowerUps(powerUps: PowerUp[], time: number): void {
    const ctx = this.ctx;
    for (const pu of powerUps) {
      const flash = 0.5 + 0.5 * Math.sin(time * 8);
      ctx.save();
      ctx.shadowColor = '#00ff66';
      ctx.shadowBlur = 15 + flash * 10;
      ctx.fillStyle = `rgba(0,255,100,${(0.5 + flash * 0.5).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(pu.x, pu.y, pu.size, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('P', pu.x, pu.y + 1);
      ctx.restore();
    }
  }

  drawParticles(particles: Particle[]): void {
    const ctx = this.ctx;
    for (const p of particles) {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.3 + 0.7 * alpha), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawHUD(score: number, lives: number, time: number, powerUpActive: boolean): void {
    const ctx = this.ctx;

    ctx.save();
    ctx.shadowColor = '#00ff66';
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#00ff66';
    ctx.font = '20px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(`SCORE: ${score}`, this.width - 20, 15);

    ctx.fillText(`LIVES: ${'♥'.repeat(Math.max(0, lives))}`, this.width - 20, 42);

    if (powerUpActive) {
      ctx.fillStyle = '#00ff88';
      ctx.textAlign = 'center';
      ctx.fillText('⚡ POWER UP ⚡', this.width / 2, 15);
    }
    ctx.restore();
  }

  drawGameOver(score: number, animTime: number): void {
    const ctx = this.ctx;

    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, this.width, this.height);

    const scale = 1 + 0.25 * Math.sin(animTime * Math.PI);

    ctx.save();
    ctx.translate(this.width / 2, this.height / 2 - 50);
    ctx.scale(scale, scale);
    ctx.shadowColor = '#00ff66';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#00ff66';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GAME OVER', 0, 0);
    ctx.restore();

    ctx.save();
    ctx.shadowColor = '#00ff66';
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#00ff66';
    ctx.font = '28px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`FINAL SCORE: ${score}`, this.width / 2, this.height / 2 + 25);
    ctx.restore();

    const btnX = this.width / 2 - 100;
    const btnY = this.height / 2 + 70;
    const btnW = 200;
    const btnH = 48;

    ctx.fillStyle = '#0d2b0d';
    ctx.fillRect(btnX, btnY, btnW, btnH);
    ctx.save();
    ctx.shadowColor = '#00ff66';
    ctx.shadowBlur = 6;
    ctx.strokeStyle = '#00ff66';
    ctx.lineWidth = 2;
    ctx.strokeRect(btnX, btnY, btnW, btnH);

    ctx.fillStyle = '#00ff66';
    ctx.font = '22px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('RESTART', this.width / 2, btnY + btnH / 2);
    ctx.restore();
  }

  getRestartButtonBounds(): { x: number; y: number; w: number; h: number } {
    return {
      x: this.width / 2 - 100,
      y: this.height / 2 + 70,
      w: 200,
      h: 48,
    };
  }
}
