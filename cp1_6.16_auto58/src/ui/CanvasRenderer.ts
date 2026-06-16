import type { GameState, Particle } from '../engine/GameState';

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private lightSpotTexture: HTMLCanvasElement;
  private lightSpotCtx: CanvasRenderingContext2D;
  private wallTexture: HTMLCanvasElement;
  private wallCtx: CanvasRenderingContext2D;
  private wheelRotation: number = 0;
  private time: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');
    this.ctx = ctx;

    this.lightSpotTexture = document.createElement('canvas');
    this.lightSpotTexture.width = 300;
    this.lightSpotTexture.height = 300;
    this.lightSpotCtx = this.lightSpotTexture.getContext('2d')!;
    this.preRenderLightSpot();

    this.wallTexture = document.createElement('canvas');
    this.wallTexture.width = 200;
    this.wallTexture.height = 200;
    this.wallCtx = this.wallTexture.getContext('2d')!;
    this.preRenderWallTexture();
  }

  private preRenderLightSpot(): void {
    const ctx = this.lightSpotCtx;
    const size = 300;
    const center = size / 2;
    const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
    gradient.addColorStop(0, 'rgba(255, 255, 200, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 230, 150, 0.8)');
    gradient.addColorStop(0.4, 'rgba(255, 200, 100, 0.5)');
    gradient.addColorStop(0.6, 'rgba(255, 180, 80, 0.2)');
    gradient.addColorStop(0.8, 'rgba(255, 150, 50, 0.08)');
    gradient.addColorStop(1, 'rgba(255, 120, 30, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }

  private preRenderWallTexture(): void {
    const ctx = this.wallCtx;
    ctx.fillStyle = '#2a1810';
    ctx.fillRect(0, 0, 200, 200);
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = `rgba(${30 + Math.random() * 20}, ${20 + Math.random() * 15}, ${10 + Math.random() * 10}, 0.5)`;
      ctx.fillRect(Math.random() * 200, Math.random() * 200, Math.random() * 8 + 2, Math.random() * 8 + 2);
    }
  }

  render(state: GameState): void {
    this.time += 1;
    this.wheelRotation += state.scrollSpeed * 0.02;

    this.clear();
    this.applyScreenShake(state);
    this.drawBackground(state);
    this.drawGasClouds(state);
    this.drawCrystals(state);
    this.drawBats(state);
    this.drawMineCart(state);
    this.drawLightSpot(state);
    this.drawParticles(state);
    this.drawSonicBullets(state);
    this.drawPathTransition(state);

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  clear(): void {
    const ctx = this.ctx;
    const { width, height } = this.canvas;
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#0a0a0f');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  private applyScreenShake(state: GameState): void {
    if (state.screenShake.active) {
      this.ctx.translate(state.screenShake.offset.x, state.screenShake.offset.y);
    }
  }

  private drawBackground(state: GameState): void {
    const ctx = this.ctx;
    const { width, height } = this.canvas;
    const offset = state.distanceTraveled;

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#1a0f0a');
    gradient.addColorStop(0.5, '#2d1810');
    gradient.addColorStop(1, '#0d0705');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    this.drawCaveWall(state, offset, true);
    this.drawCaveWall(state, offset, false);

    this.drawDarknessMask(state);
  }

  private drawCaveWall(state: GameState, offset: number, isTop: boolean): void {
    const ctx = this.ctx;
    const { width } = this.canvas;
    const boundaryFn = isTop
      ? state.currentPath.topBoundary
      : state.currentPath.bottomBoundary;

    ctx.beginPath();
    ctx.moveTo(0, isTop ? 0 : this.canvas.height);

    for (let x = 0; x <= width + 10; x += 4) {
      const worldX = x + offset;
      const y = boundaryFn(worldX);
      ctx.lineTo(x, y);
    }

    ctx.lineTo(width, isTop ? 0 : this.canvas.height);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(
      0,
      isTop ? 0 : this.canvas.height,
      0,
      isTop ? 100 : this.canvas.height - 100
    );
    gradient.addColorStop(0, '#1a0f0a');
    gradient.addColorStop(0.5, '#2d1810');
    gradient.addColorStop(1, '#3d2015');
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = '#4a2818';
    ctx.lineWidth = 3;
    ctx.stroke();

    const pattern = ctx.createPattern(this.wallTexture, 'repeat');
    if (pattern) {
      ctx.fillStyle = pattern;
      ctx.globalAlpha = 0.3;
      ctx.save();
      ctx.translate(-offset * 0.5, 0);
      ctx.fill();
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  }

  private drawDarknessMask(state: GameState): void {
    const ctx = this.ctx;
    const { width, height } = this.canvas;

    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = 'destination-out';
    const { x, y, radius } = state.lightSpot;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 1.5);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
    gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.8)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius * 1.5, 0, Math.PI * 2);
    ctx.fill();

    const cartX = state.mineCart.position.x - state.distanceTraveled + 1280 * 0.2;
    const cartY = state.mineCart.position.y;
    this.drawSpotlightCone(ctx, cartX, cartY, state.mineCart.lightAngle);
    ctx.restore();
  }

  private drawSpotlightCone(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    angle: number
  ): void {
    const coneLength = 350;
    const coneAngle = Math.PI / 4;

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, coneLength);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.5)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, coneLength, angle - coneAngle / 2, angle + coneAngle / 2);
    ctx.closePath();
    ctx.fill();
  }

  private drawMineCart(state: GameState): void {
    const ctx = this.ctx;
    const screenX = state.mineCart.position.x - state.distanceTraveled + 1280 * 0.2;
    const screenY = state.mineCart.position.y;

    ctx.save();
    ctx.translate(screenX, screenY);

    ctx.fillStyle = '#505058';
    ctx.fillRect(-24, -28, 52, 32);

    ctx.fillStyle = '#686870';
    ctx.fillRect(-24, -28, 52, 8);

    ctx.fillStyle = '#3a3a40';
    ctx.fillRect(-24, 0, 52, 4);

    ctx.fillStyle = '#808088';
    const rivetPositions = [
      [-18, -22], [-6, -22], [6, -22], [18, -22],
      [-18, -10], [18, -10]
    ];
    rivetPositions.forEach(([rx, ry]) => {
      ctx.beginPath();
      ctx.arc(rx, ry, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.save();
    ctx.translate(-14, 8);
    ctx.rotate(this.wheelRotation);
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(6, 0);
    ctx.moveTo(0, -6);
    ctx.lineTo(0, 6);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(14, 8);
    ctx.rotate(this.wheelRotation);
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(6, 0);
    ctx.moveTo(0, -6);
    ctx.lineTo(0, 6);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const lightAngle = state.mineCart.lightAngle;
    const lightX = 24 + Math.cos(lightAngle) * 12;
    const lightY = -14 + Math.sin(lightAngle) * 12;

    const gradient = ctx.createRadialGradient(lightX, lightY, 0, lightX, lightY, 20);
    gradient.addColorStop(0, 'rgba(255, 255, 200, 0.9)');
    gradient.addColorStop(0.5, 'rgba(255, 230, 150, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 200, 100, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(lightX, lightY, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = '#ffffa0';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#ffffd0';
    ctx.beginPath();
    ctx.arc(lightX, lightY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();

    ctx.fillStyle = '#2a2a30';
    ctx.fillRect(-20, -40, 20, 14);
    ctx.fillStyle = '#4080ff';
    ctx.beginPath();
    ctx.moveTo(-10, -38);
    ctx.lineTo(-6, -34);
    ctx.lineTo(-10, -30);
    ctx.lineTo(-14, -34);
    ctx.closePath();
    ctx.fill();

    for (let i = 0; i < state.mineCart.attachedBats; i++) {
      const batX = -15 + (i % 3) * 12;
      const batY = -18 + Math.floor(i / 3) * 10;
      this.drawAttachedBat(ctx, batX, batY, i);
    }

    ctx.restore();
  }

  private drawAttachedBat(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    _index: number
  ): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#3d2050';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-6, -3);
    ctx.lineTo(-4, 2);
    ctx.lineTo(0, 0);
    ctx.lineTo(4, 2);
    ctx.lineTo(6, -3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private drawLightSpot(state: GameState): void {
    const ctx = this.ctx;
    const { x, y, radius } = state.lightSpot;

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.85;
    ctx.drawImage(
      this.lightSpotTexture,
      x - radius,
      y - radius,
      radius * 2,
      radius * 2
    );
    ctx.restore();
  }

  private drawCrystals(state: GameState): void {
    const ctx = this.ctx;
    const offset = state.distanceTraveled;

    state.crystals.forEach((crystal) => {
      if (crystal.isCollected) return;

      const screenX = crystal.position.x - offset;
      const screenY = crystal.position.y;

      if (screenX < -50 || screenX > this.canvas.width + 50) return;

      ctx.save();
      ctx.translate(screenX, screenY);

      if (crystal.isLit) {
        const glowIntensity = 0.6 + Math.sin(this.time * 0.1 + crystal.glowIntensity) * 0.3;
        ctx.shadowColor = '#60a0ff';
        ctx.shadowBlur = 20 * glowIntensity;

        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 25);
        gradient.addColorStop(0, `rgba(100, 180, 255, ${0.5 * glowIntensity})`);
        gradient.addColorStop(1, 'rgba(100, 180, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.shadowBlur = 0;
      ctx.fillStyle = crystal.isLit ? '#80c0ff' : '#4060a0';
      ctx.strokeStyle = crystal.isLit ? '#c0e0ff' : '#6080c0';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(6, 0);
      ctx.lineTo(0, 8);
      ctx.lineTo(-6, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = crystal.isLit ? '#ffffff' : '#a0c0e0';
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(2, -2);
      ctx.lineTo(0, 0);
      ctx.lineTo(-2, -2);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    });
  }

  private drawBats(state: GameState): void {
    const ctx = this.ctx;
    const offset = state.distanceTraveled;

    state.bats.forEach((bat) => {
      if (bat.isAttached) return;

      const screenX = bat.position.x - offset;
      const screenY = bat.position.y;

      if (screenX < -50 || screenX > this.canvas.width + 50) return;

      ctx.save();
      ctx.translate(screenX, screenY);

      if (bat.isStunned) {
        ctx.globalAlpha = 0.6 + Math.sin(this.time * 0.3) * 0.2;
        ctx.rotate(bat.rotation);
        this.drawBatShape(ctx, '#8040a0');

        for (let i = 0; i < 3; i++) {
          const starAngle = (this.time * 0.05 + i * 2.1) % (Math.PI * 2);
          const starDist = 12 + Math.sin(this.time * 0.1 + i) * 2;
          ctx.fillStyle = '#ffff80';
          ctx.beginPath();
          ctx.arc(
            Math.cos(starAngle) * starDist,
            Math.sin(starAngle) * starDist,
            2,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      } else {
        this.drawBatShape(ctx, '#4a1a60');
      }

      ctx.restore();
    });
  }

  private drawBatShape(ctx: CanvasRenderingContext2D, color: string): void {
    const wingFlap = Math.sin(this.time * 0.3) * 0.5;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-8, -8 + wingFlap * 8, -14, -4 + wingFlap * 6);
    ctx.quadraticCurveTo(-10, 0, -4, 2);
    ctx.lineTo(0, 6);
    ctx.lineTo(4, 2);
    ctx.quadraticCurveTo(10, 0, 14, -4 + wingFlap * 6);
    ctx.quadraticCurveTo(8, -8 + wingFlap * 8, 0, 0);
    ctx.fill();

    ctx.fillStyle = '#ff4040';
    ctx.beginPath();
    ctx.arc(-2, -2, 1.5, 0, Math.PI * 2);
    ctx.arc(2, -2, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawGasClouds(state: GameState): void {
    const ctx = this.ctx;
    const offset = state.distanceTraveled;

    state.gasClouds.forEach((cloud) => {
      const screenX = cloud.position.x - offset;
      const screenY = cloud.position.y;

      if (screenX < -cloud.radius * 2 || screenX > this.canvas.width + cloud.radius * 2)
        return;

      ctx.save();
      ctx.translate(screenX, screenY);

      const pulse = 0.7 + Math.sin(this.time * 0.08) * 0.3;
      const warningAlpha = cloud.warningIntensity * pulse;

      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, cloud.radius);
      gradient.addColorStop(0, `rgba(255, 80, 60, ${0.4 * warningAlpha})`);
      gradient.addColorStop(0.4, `rgba(255, 60, 40, ${0.25 * warningAlpha})`);
      gradient.addColorStop(0.7, `rgba(200, 40, 30, ${0.1 * warningAlpha})`);
      gradient.addColorStop(1, 'rgba(150, 20, 20, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, cloud.radius, 0, Math.PI * 2);
      ctx.fill();

      if (cloud.warningIntensity > 0.3) {
        const nodePulse = 0.5 + Math.sin(this.time * 0.15) * 0.5;
        ctx.shadowColor = '#ff4040';
        ctx.shadowBlur = 15 * nodePulse;
        ctx.fillStyle = `rgba(255, 100, 80, ${0.8 * nodePulse})`;
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.restore();
    });
  }

  private drawParticles(state: GameState): void {
    const ctx = this.ctx;
    const offset = state.distanceTraveled;

    const crystalParticles: Particle[] = [];
    const explosionParticles: Particle[] = [];
    const bulletParticles: Particle[] = [];

    state.particles.forEach((particle) => {
      if (particle.type === 'crystal') crystalParticles.push(particle);
      else if (particle.type === 'explosion') explosionParticles.push(particle);
      else bulletParticles.push(particle);
    });

    this.drawCrystalParticles(ctx, crystalParticles, offset);
    this.drawExplosionParticles(ctx, explosionParticles, offset);
    this.drawBulletParticles(ctx, bulletParticles, offset);
  }

  private drawCrystalParticles(
    ctx: CanvasRenderingContext2D,
    particles: Particle[],
    offset: number
  ): void {
    particles.forEach((particle) => {
      const screenX = particle.position.x - offset;
      const screenY = particle.position.y;
      const alpha = particle.life / particle.maxLife;

      ctx.save();
      ctx.translate(screenX, screenY);
      ctx.rotate(particle.rotation);
      ctx.globalAlpha = alpha;

      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 8);
      gradient.addColorStop(0, '#ffd700');
      gradient.addColorStop(0.5, '#a060ff');
      gradient.addColorStop(1, '#6040ff');
      ctx.fillStyle = gradient;

      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const r = i % 2 === 0 ? 6 : 3;
        const px = Math.cos(angle) * r;
        const py = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    });
  }

  private drawExplosionParticles(
    ctx: CanvasRenderingContext2D,
    particles: Particle[],
    offset: number
  ): void {
    particles.forEach((particle) => {
      const screenX = particle.position.x - offset;
      const screenY = particle.position.y;
      const alpha = particle.life / particle.maxLife;

      ctx.save();
      ctx.translate(screenX, screenY);
      ctx.rotate(particle.rotation);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;

      ctx.beginPath();
      ctx.moveTo(-4, -3);
      ctx.lineTo(4, -2);
      ctx.lineTo(3, 3);
      ctx.lineTo(-3, 4);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    });
  }

  private drawBulletParticles(
    ctx: CanvasRenderingContext2D,
    particles: Particle[],
    offset: number
  ): void {
    particles.forEach((particle) => {
      const screenX = particle.position.x - offset;
      const screenY = particle.position.y;
      const alpha = particle.life / particle.maxLife;

      ctx.save();
      ctx.globalAlpha = alpha * 0.6;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(screenX, screenY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  private drawSonicBullets(state: GameState): void {
    const ctx = this.ctx;
    const offset = state.distanceTraveled;

    state.sonicBullets.forEach((bullet) => {
      const screenX = bullet.position.x - offset;
      const screenY = bullet.position.y;
      const progress = bullet.radius / bullet.maxRadius;
      const alpha = 1 - progress;

      ctx.save();
      ctx.globalAlpha = alpha * 0.7;
      ctx.strokeStyle = '#60c0ff';
      ctx.lineWidth = 3 * (1 - progress * 0.5);
      ctx.shadowColor = '#40a0ff';
      ctx.shadowBlur = 10;

      ctx.beginPath();
      ctx.arc(screenX, screenY, bullet.radius, 0, Math.PI * 2);
      ctx.stroke();

      if (bullet.radius > 5) {
        ctx.globalAlpha = alpha * 0.3;
        ctx.beginPath();
        ctx.arc(screenX, screenY, bullet.radius * 0.6, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    });
  }

  private drawPathTransition(state: GameState): void {
    if (!state.pathTransition.active) return;

    const ctx = this.ctx;
    const { width, height } = this.canvas;
    const progress = state.pathTransition.progress;

    const halfWidth = (width / 2) * progress;
    const centerX = width / 2;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, centerX - halfWidth, height);
    ctx.fillRect(centerX + halfWidth, 0, centerX - halfWidth + 1, height);
  }
}
