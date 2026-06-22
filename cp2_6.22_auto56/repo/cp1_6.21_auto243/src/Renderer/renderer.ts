import { PlayerState, OrbEntity, EnemyEntity, ParticleEffect, EntityManager } from '../GameCore/entityManager';

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cameraX: number = 0;
  private cameraY: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  private resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  render(
    player: PlayerState,
    orbs: OrbEntity[],
    enemies: EnemyEntity[],
    particles: ParticleEffect[],
    time: number,
    redFlash: boolean,
  ): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    this.cameraX = player.pos.x - w / 2;
    this.cameraY = player.pos.y - h / 2;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0A0A0A';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(-this.cameraX, -this.cameraY);

    this.drawGrid(ctx, w, h);
    this.drawWorldBorder(ctx);

    for (const orb of orbs) {
      this.drawOrb(ctx, orb, time);
    }
    for (const enemy of enemies) {
      this.drawEnemy(ctx, enemy, time);
    }

    this.drawPlayer(ctx, player, time);

    for (const particle of particles) {
      this.drawParticle(ctx, particle);
    }

    ctx.restore();

    if (redFlash) {
      ctx.fillStyle = 'rgba(229, 62, 62, 0.3)';
      ctx.fillRect(0, 0, w, h);
    }
  }

  private drawGrid(ctx: CanvasRenderingContext2D, viewW: number, viewH: number): void {
    const gridSize = 60;
    const startX = Math.floor(this.cameraX / gridSize) * gridSize;
    const startY = Math.floor(this.cameraY / gridSize) * gridSize;
    const endX = this.cameraX + viewW + gridSize;
    const endY = this.cameraY + viewH + gridSize;

    ctx.strokeStyle = '#1A1A1A';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = startX; x <= endX; x += gridSize) {
      if (x < 0 || x > EntityManager.WORLD_WIDTH) continue;
      ctx.moveTo(x, Math.max(0, this.cameraY));
      ctx.lineTo(x, Math.min(EntityManager.WORLD_HEIGHT, this.cameraY + viewH));
    }
    for (let y = startY; y <= endY; y += gridSize) {
      if (y < 0 || y > EntityManager.WORLD_HEIGHT) continue;
      ctx.moveTo(Math.max(0, this.cameraX), y);
      ctx.lineTo(Math.min(EntityManager.WORLD_WIDTH, this.cameraX + viewW), y);
    }
    ctx.stroke();
  }

  private drawWorldBorder(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = '#2D3748';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, EntityManager.WORLD_WIDTH, EntityManager.WORLD_HEIGHT);
  }

  private drawPlayer(ctx: CanvasRenderingContext2D, player: PlayerState, time: number): void {
    const { pos, radius, invincibleTimer } = player;

    ctx.save();
    ctx.translate(pos.x, pos.y);

    if (invincibleTimer > 0 && Math.floor(invincibleTimer * 10) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    const glow = ctx.createRadialGradient(0, 0, radius * 0.5, 0, 0, radius * 1.8);
    glow.addColorStop(0, 'rgba(79, 209, 197, 0.3)');
    glow.addColorStop(1, 'rgba(79, 209, 197, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.8, 0, Math.PI * 2);
    ctx.fill();

    const bodyGrad = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, 0, 0, 0, radius);
    bodyGrad.addColorStop(0, '#6FE4D8');
    bodyGrad.addColorStop(0.7, '#4FD1C5');
    bodyGrad.addColorStop(1, '#38B2AC');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#81E6D9';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const nucleusPulse = 0.8 + Math.sin(time * 3) * 0.2;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.3 * nucleusPulse, 0, Math.PI * 2);
    ctx.fill();

    if (player.spinAttackUnlocked && player.spinAttackCooldown <= 0) {
      ctx.strokeStyle = `rgba(79, 209, 197, ${0.3 + Math.sin(time * 5) * 0.2})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, 80, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  private drawOrb(ctx: CanvasRenderingContext2D, orb: OrbEntity, time: number): void {
    const { pos, radius, absorbing, absorbTimer, colorPhase } = orb;

    ctx.save();
    ctx.translate(pos.x, pos.y);

    const colors = EntityManager.ORB_COLORS;
    const phaseIdx = Math.floor(colorPhase) % 3;
    const nextIdx = (phaseIdx + 1) % 3;
    const t = colorPhase - Math.floor(colorPhase);

    let currentRadius = radius;
    let alpha = 1;

    if (absorbing) {
      const progress = absorbTimer / 0.3;
      currentRadius = radius * (1 + progress * 0.8);
      alpha = 1 - progress;
    }

    const color1 = colors[phaseIdx];
    const color2 = colors[nextIdx];

    ctx.globalAlpha = alpha;

    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, currentRadius * 2.5);
    glow.addColorStop(0, this.colorWithAlpha(color1, 0.4));
    glow.addColorStop(1, this.colorWithAlpha(color1, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, currentRadius * 2.5, 0, Math.PI * 2);
    ctx.fill();

    const bodyGrad = ctx.createRadialGradient(-currentRadius * 0.2, -currentRadius * 0.2, 0, 0, 0, currentRadius);
    bodyGrad.addColorStop(0, color2);
    bodyGrad.addColorStop(1, color1);
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawEnemy(ctx: CanvasRenderingContext2D, enemy: EnemyEntity, time: number): void {
    const { pos, radius, dying, deathTimer, pulsatePhase } = enemy;

    ctx.save();
    ctx.translate(pos.x, pos.y);

    if (dying) {
      const progress = deathTimer / 0.4;
      const scale = 1 + progress * 0.5;
      const alpha = 1 - progress;
      ctx.globalAlpha = alpha;
      ctx.scale(scale, scale);
    }

    const pulsate = 1 + Math.sin(pulsatePhase) * 0.15;
    const glowRadius = radius * 2 * pulsate;
    const glow = ctx.createRadialGradient(0, 0, radius * 0.5, 0, 0, glowRadius);
    glow.addColorStop(0, 'rgba(229, 62, 62, 0.4)');
    glow.addColorStop(0.6, 'rgba(229, 62, 62, 0.1)');
    glow.addColorStop(1, 'rgba(229, 62, 62, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    const bodyGrad = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, 0, 0, 0, radius);
    bodyGrad.addColorStop(0, '#FC8181');
    bodyGrad.addColorStop(0.6, '#E53E3E');
    bodyGrad.addColorStop(1, '#C53030');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#FEB2B2';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (dying) {
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 * i) / 6 + deathTimer * 5;
        const dist = radius * (0.5 + deathTimer * 4);
        const crackX = Math.cos(angle) * dist;
        const crackY = Math.sin(angle) * dist;
        ctx.strokeStyle = `rgba(254, 178, 178, ${1 - deathTimer / 0.4})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(crackX, crackY);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  private drawParticle(ctx: CanvasRenderingContext2D, particle: ParticleEffect): void {
    const progress = particle.timer / particle.duration;

    ctx.save();

    if (particle.type === 'orb_absorb') {
      ctx.translate(particle.pos.x, particle.pos.y);
      const scale = 1 + progress * 2;
      const alpha = 1 - progress;
      ctx.globalAlpha = alpha;

      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, particle.radius * scale);
      grad.addColorStop(0, particle.color);
      grad.addColorStop(0.5, this.colorWithAlpha(particle.color, 0.5));
      grad.addColorStop(1, this.colorWithAlpha(particle.color, 0));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, particle.radius * scale, 0, Math.PI * 2);
      ctx.fill();
    }

    if (particle.type === 'enemy_death' && particle.fragments) {
      const alpha = 1 - progress;
      ctx.globalAlpha = alpha;
      for (const frag of particle.fragments) {
        const fragGrad = ctx.createRadialGradient(frag.x, frag.y, 0, frag.x, frag.y, frag.radius);
        fragGrad.addColorStop(0, '#FC8181');
        fragGrad.addColorStop(1, 'rgba(229, 62, 62, 0)');
        ctx.fillStyle = fragGrad;
        ctx.beginPath();
        ctx.arc(frag.x, frag.y, frag.radius * (1 - progress * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.translate(particle.pos.x, particle.pos.y);
      const ringProgress = progress;
      const ringRadius = particle.radius * (1 + ringProgress * 3);
      ctx.strokeStyle = `rgba(229, 62, 62, ${alpha * 0.5})`;
      ctx.lineWidth = 3 * (1 - progress);
      ctx.beginPath();
      ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (particle.type === 'spin_attack') {
      ctx.translate(particle.pos.x, particle.pos.y);
      const ringRadius = particle.radius * progress * 2;
      const alpha = 1 - progress;
      ctx.globalAlpha = alpha * 0.6;

      const grad = ctx.createRadialGradient(0, 0, ringRadius * 0.7, 0, 0, ringRadius);
      grad.addColorStop(0, 'rgba(79, 209, 197, 0)');
      grad.addColorStop(0.5, 'rgba(79, 209, 197, 0.3)');
      grad.addColorStop(1, 'rgba(79, 209, 197, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(79, 209, 197, ${alpha})`;
      ctx.lineWidth = 4 * (1 - progress);
      ctx.beginPath();
      ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  private colorWithAlpha(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}
