export interface Bandit {
  x: number;
  y: number;
  speed: number;
  alive: boolean;
  deathTimer: number;
  side: 'left' | 'right';
  frame: number;
}

export interface SwordFlash {
  x: number;
  y: number;
  timer: number;
  maxTimer: number;
  angle: number;
}

export interface Smoke {
  x: number;
  y: number;
  timer: number;
  maxTimer: number;
  particles: { dx: number; dy: number; size: number }[];
}

export class CombatManager {
  bandits: Bandit[] = [];
  escapedBandits: number = 0;
  maxEscaped: number = 5;
  swordFlashes: SwordFlash[] = [];
  smokes: Smoke[] = [];
  mouseX: number = 0;
  mouseY: number = 0;
  spawnTimer: number = 0;
  spawnInterval: number = 80;
  isActive: boolean = false;
  cartX: number = 0;
  cartY: number = 0;
  attackRange: number = 35;
  totalBanditsToSpawn: number = 10;
  banditsSpawned: number = 0;
  combatTimer: number = 0;
  combatDuration: number = 0;

  start(cartX: number, cartY: number, attackRange: number): void {
    this.isActive = true;
    this.escapedBandits = 0;
    this.bandits = [];
    this.swordFlashes = [];
    this.smokes = [];
    this.spawnTimer = 0;
    this.banditsSpawned = 0;
    this.combatTimer = 0;
    this.cartX = cartX;
    this.cartY = cartY;
    this.attackRange = attackRange;
    this.totalBanditsToSpawn = 8 + Math.floor(Math.random() * 5);
    this.combatDuration = this.totalBanditsToSpawn * this.spawnInterval + 180;
  }

  stop(): void {
    this.isActive = false;
    this.bandits = [];
    this.swordFlashes = [];
    this.smokes = [];
  }

  update(canvasWidth: number, canvasHeight: number): void {
    if (!this.isActive) return;

    this.combatTimer++;

    if (this.banditsSpawned < this.totalBanditsToSpawn) {
      this.spawnTimer++;
      if (this.spawnTimer >= this.spawnInterval) {
        this.spawnTimer = 0;
        this.spawnBandit(canvasWidth, canvasHeight);
        this.banditsSpawned++;
      }
    }

    for (const bandit of this.bandits) {
      if (bandit.alive) {
        const dir = bandit.side === 'left' ? 1 : -1;
        bandit.x += bandit.speed * dir;
        bandit.frame++;

        if (Math.abs(bandit.x - this.cartX) < 45) {
          bandit.alive = false;
          bandit.deathTimer = 18;
          this.escapedBandits++;
        }
      } else {
        bandit.deathTimer--;
      }
    }

    for (const flash of this.swordFlashes) {
      flash.timer--;
    }
    this.swordFlashes = this.swordFlashes.filter(f => f.timer > 0);

    for (const smoke of this.smokes) {
      smoke.timer--;
    }
    this.smokes = this.smokes.filter(s => s.timer > 0);

    this.bandits = this.bandits.filter(b => b.alive || b.deathTimer > 0);
  }

  private spawnBandit(canvasWidth: number, canvasHeight: number): void {
    const side = Math.random() < 0.5 ? 'left' : 'right' as const;
    const x = side === 'left' ? -30 : canvasWidth + 30;
    const roadY = canvasHeight * 0.72;
    const y = roadY - 30 + Math.random() * 50;

    this.bandits.push({
      x,
      y,
      speed: 0.7 + Math.random() * 0.5,
      alive: true,
      deathTimer: 0,
      side,
      frame: 0
    });
  }

  handleClick(clickX: number, clickY: number): boolean {
    if (!this.isActive) return false;

    for (const bandit of this.bandits) {
      if (!bandit.alive) continue;

      const dx = clickX - bandit.x;
      const dy = clickY - bandit.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < this.attackRange) {
        bandit.alive = false;
        bandit.deathTimer = 18;

        const angle = Math.atan2(clickY - bandit.y, clickX - bandit.x);
        this.swordFlashes.push({
          x: clickX,
          y: clickY,
          timer: 9,
          maxTimer: 9,
          angle
        });

        this.smokes.push({
          x: bandit.x,
          y: bandit.y,
          timer: 18,
          maxTimer: 18,
          particles: Array.from({ length: 8 }, () => ({
            dx: (Math.random() - 0.5) * 50,
            dy: (Math.random() - 0.5) * 50,
            size: 6 + Math.random() * 12
          }))
        });

        return true;
      }
    }
    return false;
  }

  isDefeated(): boolean {
    return this.escapedBandits >= this.maxEscaped;
  }

  isCleared(): boolean {
    return this.isActive &&
      this.banditsSpawned >= this.totalBanditsToSpawn &&
      this.bandits.filter(b => b.alive).length === 0 &&
      this.smokes.length === 0;
  }

  drawBandit(ctx: CanvasRenderingContext2D, bandit: Bandit): void {
    if (!bandit.alive && bandit.deathTimer <= 0) return;

    ctx.save();
    const alpha = bandit.alive ? 1 : bandit.deathTimer / 18;
    ctx.globalAlpha = alpha;

    const bx = bandit.x;
    const by = bandit.y;

    ctx.fillStyle = '#5C4033';
    ctx.fillRect(bx - 8, by - 30, 16, 22);

    ctx.fillStyle = '#8B7355';
    ctx.fillRect(bx - 10, by - 8, 20, 20);

    ctx.fillStyle = '#D2B48C';
    ctx.beginPath();
    ctx.arc(bx, by - 36, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#4A3728';
    ctx.fillRect(bx - 10, by - 44, 20, 8);

    ctx.strokeStyle = '#A0A0A0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bx + 12, by - 20);
    ctx.lineTo(bx + 22, by - 10);
    ctx.stroke();

    ctx.fillStyle = '#808080';
    ctx.fillRect(bx + 20, by - 14, 3, 12);

    ctx.restore();
  }

  drawSwordFlashes(ctx: CanvasRenderingContext2D): void {
    for (const flash of this.swordFlashes) {
      const progress = 1 - flash.timer / flash.maxTimer;
      ctx.save();
      ctx.globalAlpha = 1 - progress;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.beginPath();
      const radius = 20 + progress * 15;
      ctx.arc(flash.x, flash.y, radius, flash.angle - 0.8, flash.angle + 0.8);
      ctx.stroke();

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(flash.x, flash.y, radius + 5, flash.angle - 0.5, flash.angle + 0.5);
      ctx.stroke();
      ctx.restore();
    }
  }

  drawSmokes(ctx: CanvasRenderingContext2D): void {
    for (const smoke of this.smokes) {
      const progress = 1 - smoke.timer / smoke.maxTimer;
      ctx.save();
      ctx.globalAlpha = (1 - progress) * 0.7;
      for (const p of smoke.particles) {
        const px = smoke.x + p.dx * progress;
        const py = smoke.y + p.dy * progress;
        const size = p.size * (1 + progress * 0.5);
        ctx.fillStyle = '#808080';
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  drawCursor(ctx: CanvasRenderingContext2D): void {
    if (!this.isActive) return;

    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;

    const cx = this.mouseX;
    const cy = this.mouseY;

    ctx.beginPath();
    ctx.moveTo(cx - 18, cy + 2);
    ctx.quadraticCurveTo(cx, cy - 15, cx + 18, cy + 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - 2, cy + 18);
    ctx.lineTo(cx - 2, cy - 2);
    ctx.lineTo(cx + 2, cy - 2);
    ctx.lineTo(cx + 2, cy + 18);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - 12, cy + 18);
    ctx.lineTo(cx + 12, cy + 18);
    ctx.stroke();

    ctx.restore();
  }
}
