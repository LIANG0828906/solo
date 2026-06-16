export interface CrystalData {
  x: number;
  y: number;
  side: number;
  rotation: number;
  rotationSpeed: number;
  pulsePhase: number;
  pulseSpeed: number;
  collected: boolean;
  flyingToPlayer: boolean;
  flySpeed: number;
  active: boolean;
}

export interface ScorePopup {
  x: number;
  y: number;
  life: number;
  maxLife: number;
}

export class CrystalPool {
  private pool: CrystalData[] = [];

  acquire(): CrystalData {
    if (this.pool.length > 0) {
      const c = this.pool.pop()!;
      return this.reset(c);
    }
    return this.createNew();
  }

  release(crystal: CrystalData): void {
    this.pool.push(crystal);
  }

  private createNew(): CrystalData {
    return {
      x: 0,
      y: 0,
      side: 12,
      rotation: 0,
      rotationSpeed: Math.PI * 4,
      pulsePhase: 0,
      pulseSpeed: Math.PI * 2 / 0.8,
      collected: false,
      flyingToPlayer: false,
      flySpeed: 8,
      active: true
    };
  }

  private reset(c: CrystalData): CrystalData {
    c.x = 0;
    c.y = 0;
    c.side = 12;
    c.rotation = 0;
    c.rotationSpeed = Math.PI * 4;
    c.pulsePhase = Math.random() * Math.PI * 2;
    c.pulseSpeed = Math.PI * 2 / 0.8;
    c.collected = false;
    c.flyingToPlayer = false;
    c.flySpeed = 8;
    c.active = true;
    return c;
  }
}

export class CrystalManager {
  crystals: CrystalData[] = [];
  pool: CrystalPool;
  scorePopups: ScorePopup[] = [];
  canvasWidth: number;
  spawnInterval: number;
  lastSpawnHeight: number;

  constructor(canvasWidth: number) {
    this.canvasWidth = canvasWidth;
    this.pool = new CrystalPool();
    this.spawnInterval = 300;
    this.lastSpawnHeight = 0;
  }

  spawnCrystals(centerY: number): void {
    const count = Math.floor(Math.random() * 3) + 3;
    for (let i = 0; i < count; i++) {
      const crystal = this.pool.acquire();
      crystal.x = Math.random() * (this.canvasWidth - 80) + 40;
      crystal.y = centerY + (Math.random() - 0.5) * 250;
      this.crystals.push(crystal);
    }
  }

  update(
    playerX: number,
    playerY: number,
    playerRadius: number,
    cameraY: number,
    viewportHeight: number,
    maxHeight: number,
    onCollect: (screenX: number, screenY: number) => void
  ): void {
    if (maxHeight - this.lastSpawnHeight >= this.spawnInterval) {
      this.lastSpawnHeight = maxHeight;
      this.spawnCrystals(-this.lastSpawnHeight);
    }

    for (let i = this.crystals.length - 1; i >= 0; i--) {
      const c = this.crystals[i];
      if (!c.active) continue;

      c.rotation += c.rotationSpeed / 60;
      c.pulsePhase += c.pulseSpeed / 60;

      const dx = playerX - c.x;
      const dy = playerY - c.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 30 + playerRadius) {
        c.flyingToPlayer = true;
      }

      if (c.flyingToPlayer) {
        const nx = dx / (dist || 1);
        const ny = dy / (dist || 1);
        c.x += nx * c.flySpeed;
        c.y += ny * c.flySpeed;

        if (dist < playerRadius + 5) {
          c.collected = true;
          c.active = false;
          const screenY = c.y - cameraY;
          onCollect(c.x, screenY);
        }
      }

      if (c.y > -cameraY + viewportHeight + 200 || !c.active) {
        this.pool.release(c);
        this.crystals.splice(i, 1);
      }
    }

    for (let i = this.scorePopups.length - 1; i >= 0; i--) {
      const popup = this.scorePopups[i];
      popup.life -= 1 / 60;
      if (popup.life <= 0) {
        this.scorePopups.splice(i, 1);
      }
    }
  }

  addScorePopup(x: number, y: number): void {
    this.scorePopups.push({
      x,
      y,
      life: 0.8,
      maxLife: 0.8
    });
  }

  draw(ctx: CanvasRenderingContext2D, cameraY: number): void {
    for (const c of this.crystals) {
      if (!c.active) continue;

      const drawY = c.y - cameraY;
      const pulse = 0.8 + 0.2 * Math.sin(c.pulsePhase);

      ctx.save();
      ctx.translate(c.x, drawY);
      ctx.rotate(c.rotation);

      const glowR = c.side * 2 * pulse;
      const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowR);
      glowGradient.addColorStop(0, 'rgba(255, 220, 80, 0.5)');
      glowGradient.addColorStop(0.5, 'rgba(255, 180, 40, 0.2)');
      glowGradient.addColorStop(1, 'rgba(255, 180, 40, 0)');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(0, 0, glowR, 0, Math.PI * 2);
      ctx.fill();

      this.drawHexagon(ctx, 0, 0, c.side * pulse);

      const bodyGradient = ctx.createLinearGradient(-c.side, -c.side, c.side, c.side);
      bodyGradient.addColorStop(0, '#fff4aa');
      bodyGradient.addColorStop(0.3, '#ffd633');
      bodyGradient.addColorStop(0.7, '#ffaa00');
      bodyGradient.addColorStop(1, '#ff7700');
      ctx.fillStyle = bodyGradient;
      ctx.fill();

      ctx.strokeStyle = '#ffee88';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
    }
  }

  private drawHexagon(ctx: CanvasRenderingContext2D, cx: number, cy: number, side: number): void {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      const x = cx + Math.cos(angle) * side;
      const y = cy + Math.sin(angle) * side;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
  }

  reset(): void {
    for (const c of this.crystals) {
      this.pool.release(c);
    }
    this.crystals = [];
    this.scorePopups = [];
    this.lastSpawnHeight = 0;
  }
}
