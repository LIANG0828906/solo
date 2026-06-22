export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  targetAlpha: number;
  color: string;
  life: number;
  maxLife: number;
  fadeSpeed: number;
}

export interface FogParticle {
  x: number;
  y: number;
  size: number;
  alpha: number;
  targetAlpha: number;
  vx: number;
  vy: number;
}

export interface Collectible {
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
  pulsePhase: number;
  pulsePeriod: number;
  collected: boolean;
  flashTimer: number;
  flashActive: boolean;
}

export interface LandingParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  life: number;
}

export class ParticleSystem {
  fogParticles: FogParticle[] = [];
  landingParticles: LandingParticle[] = [];
  collectibles: Collectible[] = [];
  screenFlashAlpha = 0;
  screenFlashColor = '#FFFFFF';
  fullScreenFlashTimer = 0;
  comboCount = 0;
  targetFogCount = 150;
  canvasWidth: number;
  canvasHeight: number;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.initFog();
  }

  initFog() {
    this.fogParticles = [];
    for (let i = 0; i < this.targetFogCount; i++) {
      this.fogParticles.push(this.createFogParticle(Math.random() * this.canvasWidth));
    }
  }

  createFogParticle(x?: number): FogParticle {
    const size = 3 + Math.random() * 5;
    return {
      x: x ?? this.canvasWidth + Math.random() * 50,
      y: Math.random() * this.canvasHeight,
      size,
      alpha: 0,
      targetAlpha: 0.1 + Math.random() * 0.3,
      vx: -(0.2 + Math.random() * 0.5),
      vy: (Math.random() - 0.5) * 0.3,
    };
  }

  createCollectible(x: number, y: number): Collectible {
    const colors = ['#FF6B6B', '#FFD93D', '#6BCB77'];
    return {
      x,
      y,
      size: 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: 0,
      pulsePhase: Math.random() * Math.PI * 2,
      pulsePeriod: 1.5,
      collected: false,
      flashTimer: 0,
      flashActive: false,
    };
  }

  addLandingParticles(x: number, y: number) {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      this.landingParticles.push({
        x,
        y,
        vx: Math.cos(angle) * (1 + Math.random()),
        vy: Math.sin(angle) * (1 + Math.random()) - 1,
        size: 2 + Math.random() * 2,
        alpha: 1,
        color: '#00E5FF',
        life: 20,
      });
    }
  }

  addCollectFlash(x: number, y: number) {
    this.screenFlashAlpha = 1;
    this.screenFlashColor = '#FFFFFF';
  }

  triggerFullScreenFlash() {
    this.fullScreenFlashTimer = 0.4;
  }

  resize(w: number, h: number) {
    this.canvasWidth = w;
    this.canvasHeight = h;
  }

  adjustPerformance(fps: number) {
    if (fps < 45) {
      this.targetFogCount = 80;
    } else {
      this.targetFogCount = 150;
    }
  }

  update(dt: number, scrollSpeed: number) {
    while (this.fogParticles.length < this.targetFogCount) {
      this.fogParticles.push(this.createFogParticle());
    }
    if (this.fogParticles.length > this.targetFogCount) {
      this.fogParticles.length = this.targetFogCount;
    }

    for (const fp of this.fogParticles) {
      fp.x += fp.vx - scrollSpeed * 0.3;
      fp.y += fp.vy;
      fp.alpha += (fp.targetAlpha - fp.alpha) * 0.02;
      if (Math.random() < 0.005) {
        fp.targetAlpha = 0.05 + Math.random() * 0.3;
      }
      if (fp.x < -fp.size) {
        fp.x = this.canvasWidth + fp.size;
        fp.y = Math.random() * this.canvasHeight;
        fp.alpha = 0;
      }
      if (fp.y < -fp.size) fp.y = this.canvasHeight;
      if (fp.y > this.canvasHeight + fp.size) fp.y = 0;
    }

    for (let i = this.landingParticles.length - 1; i >= 0; i--) {
      const lp = this.landingParticles[i];
      lp.x += lp.vx;
      lp.y += lp.vy;
      lp.vy += 0.15;
      lp.life--;
      lp.alpha = Math.max(0, lp.life / 20);
      if (lp.life <= 0) {
        this.landingParticles.splice(i, 1);
      }
    }

    for (const c of this.collectibles) {
      if (!c.collected) {
        c.rotation += 0.02;
        c.pulsePhase += dt;
      }
      if (c.flashActive) {
        c.flashTimer += dt;
        if (c.flashTimer >= 0.2) {
          c.flashActive = false;
        }
      }
    }

    if (this.screenFlashAlpha > 0) {
      this.screenFlashAlpha -= dt * 5;
      if (this.screenFlashAlpha < 0) this.screenFlashAlpha = 0;
    }

    if (this.fullScreenFlashTimer > 0) {
      this.fullScreenFlashTimer -= dt;
      if (this.fullScreenFlashTimer < 0) this.fullScreenFlashTimer = 0;
    }
  }

  drawFog(ctx: CanvasRenderingContext2D) {
    for (const fp of this.fogParticles) {
      ctx.globalAlpha = fp.alpha;
      ctx.fillStyle = '#4A90D9';
      ctx.beginPath();
      ctx.arc(fp.x, fp.y, fp.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawPurpleFog(ctx: CanvasRenderingContext2D) {
    for (const fp of this.fogParticles) {
      if (fp.alpha < 0.15) continue;
      ctx.globalAlpha = fp.alpha * 0.3;
      ctx.fillStyle = '#B39DDB';
      ctx.beginPath();
      ctx.arc(fp.x + 30, fp.y - 10, fp.size * 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawLandingParticles(ctx: CanvasRenderingContext2D) {
    for (const lp of this.landingParticles) {
      ctx.globalAlpha = lp.alpha;
      ctx.fillStyle = lp.color;
      ctx.beginPath();
      ctx.arc(lp.x, lp.y, lp.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawCollectibles(ctx: CanvasRenderingContext2D) {
    for (const c of this.collectibles) {
      if (c.collected && !c.flashActive) continue;

      const pulseFactor = 1 + 0.3 * Math.sin((c.pulsePhase / c.pulsePeriod) * Math.PI * 2);

      if (c.flashActive) {
        const progress = c.flashTimer / 0.2;
        const flashSize = c.size * (1 + progress * 3);
        ctx.globalAlpha = 1 - progress;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(c.x, c.y, flashSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        continue;
      }

      ctx.globalAlpha = 0.2 * pulseFactor;
      ctx.fillStyle = c.color;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.size * pulseFactor * 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1;
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rotation);
      ctx.fillStyle = c.color;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const angle = (Math.PI / 2) * i;
        const ox = Math.cos(angle) * c.size * 0.5;
        const oy = Math.sin(angle) * c.size * 0.5;
        if (i === 0) ctx.moveTo(ox, oy);
        else ctx.lineTo(ox, oy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  drawScreenFlash(ctx: CanvasRenderingContext2D) {
    if (this.screenFlashAlpha > 0) {
      ctx.globalAlpha = this.screenFlashAlpha;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
      ctx.globalAlpha = 1;
    }
  }

  drawFullScreenFlash(ctx: CanvasRenderingContext2D) {
    if (this.fullScreenFlashTimer > 0) {
      let alpha: number;
      if (this.fullScreenFlashTimer > 0.3) {
        alpha = 1;
      } else {
        alpha = this.fullScreenFlashTimer / 0.3;
      }
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
      ctx.globalAlpha = 1;
    }
  }

  drawHearts(ctx: CanvasRenderingContext2D, lives: number, x: number, y: number) {
    for (let i = 0; i < 3; i++) {
      const hx = x + i * 14;
      ctx.fillStyle = i < lives ? '#FF6B6B' : '#333';
      ctx.globalAlpha = i < lives ? 1 : 0.4;
      this.drawHeart(ctx, hx, y, 5);
    }
    ctx.globalAlpha = 1;
  }

  drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.3);
    ctx.bezierCurveTo(x, y, x - size, y, x - size, y + size * 0.3);
    ctx.bezierCurveTo(x - size, y + size * 0.7, x, y + size, x, y + size * 1.2);
    ctx.bezierCurveTo(x, y + size, x + size, y + size * 0.7, x + size, y + size * 0.3);
    ctx.bezierCurveTo(x + size, y, x, y, x, y + size * 0.3);
    ctx.fill();
  }
}
