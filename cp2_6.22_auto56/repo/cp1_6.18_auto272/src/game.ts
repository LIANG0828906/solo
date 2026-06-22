import { Player } from './player';
import { PlatformManager } from './platform';
import { ParticleSystem, Collectible } from './particle';

export class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  player: Player;
  platformManager: PlatformManager;
  particleSystem: ParticleSystem;

  score = 0;
  distance = 0;
  isRunning = true;
  isGameOver = false;
  gameTime = 0;
  scrollSpeed = 2;
  comboCount = 0;

  gameOverPanelY = -300;
  gameOverPanelTargetY = 0;
  gameOverAnimating = false;
  replayHover = false;

  lastTime = 0;
  fpsAccum = 0;
  fpsCount = 0;
  currentFps = 60;

  audioCtx: AudioContext | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.particleSystem = new ParticleSystem(canvas.width, canvas.height);
    this.platformManager = new PlatformManager(canvas.width, canvas.height);
    this.player = new Player(100, canvas.height - 140, this.particleSystem);

    this.initAudio();
  }

  initAudio() {
    try {
      this.audioCtx = new AudioContext();
    } catch {
      // no audio
    }
  }

  playJumpSound() {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 200;
    gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.1);
  }

  playCollectSound() {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 400;
    gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.2);
  }

  playHitSound() {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = 150;
    gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.1);
  }

  handleKeyDown(e: KeyboardEvent) {
    if (e.code === 'Space') {
      e.preventDefault();
      if (this.isRunning && !this.isGameOver) {
        this.player.jump();
        this.playJumpSound();
      }
    }
  }

  handleClick(e: MouseEvent) {
    if (!this.isGameOver) return;
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const panelW = 320;
    const panelH = 220;
    const panelX = (this.canvas.width - panelW) / 2;
    const panelY = this.gameOverPanelY;
    const btnX = panelX + (panelW - 160) / 2;
    const btnY = panelY + panelH - 60;
    const btnW = 160;
    const btnH = 44;
    if (mx >= btnX && mx <= btnX + btnW && my >= btnY && my <= btnY + btnH) {
      this.reset();
    }
  }

  handleMouseMove(e: MouseEvent) {
    if (!this.isGameOver) return;
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const panelW = 320;
    const panelH = 220;
    const panelX = (this.canvas.width - panelW) / 2;
    const panelY = this.gameOverPanelY;
    const btnX = panelX + (panelW - 160) / 2;
    const btnY = panelY + panelH - 60;
    const btnW = 160;
    const btnH = 44;
    this.replayHover = mx >= btnX && mx <= btnX + btnW && my >= btnY && my <= btnY + btnH;
  }

  update(dt: number) {
    if (this.isGameOver) {
      if (this.gameOverAnimating) {
        this.gameOverPanelY += (this.gameOverPanelTargetY - this.gameOverPanelY) * 0.08;
        if (Math.abs(this.gameOverPanelY - this.gameOverPanelTargetY) < 1) {
          this.gameOverAnimating = false;
        }
      }
      return;
    }

    this.gameTime += dt;
    this.scrollSpeed = 2 + (3 * Math.min(this.gameTime / 120, 1));
    this.distance += this.scrollSpeed * 0.5;

    this.platformManager.update(this.scrollSpeed, dt, this.gameTime);
    this.particleSystem.update(dt, this.scrollSpeed);

    const groundY = this.platformManager.getGroundYAt(this.player.x + this.player.width / 2);
    this.player.update(dt, groundY);

    if (!this.player.isOnGround && groundY === null) {
      this.player.y += 4;
      if (this.player.y > this.canvas.height + 50) {
        this.gameOver();
        return;
      }
    }

    this.updateCollectibles();
    this.checkCollisions();
    this.particleSystem.adjustPerformance(this.currentFps);
  }

  updateCollectibles() {
    while (this.particleSystem.nextCollectibleX < this.distance * 2 + this.canvas.width) {
      const cx = this.particleSystem.nextCollectibleX - this.distance * 2 + this.canvas.width * 0.8;
      const plat = this.platformManager.platforms.find(
        (p) => cx >= p.x && cx <= p.x + p.width
      );
      const cy = plat ? plat.y - 40 - Math.random() * 30 : this.canvas.height - 120;
      this.particleSystem.collectibles.push(this.particleSystem.createCollectible(cx, cy));
      this.particleSystem.nextCollectibleX += 200 + Math.random() * 200;
    }

    for (const c of this.particleSystem.collectibles) {
      c.x -= this.scrollSpeed;
    }
    this.particleSystem.collectibles = this.particleSystem.collectibles.filter(
      (c) => c.x > -20 && (!c.collected || c.flashActive)
    );

    for (const c of this.particleSystem.collectibles) {
      if (c.collected) continue;
      const dx = this.player.x + this.player.width / 2 - c.x;
      const dy = this.player.y + this.player.height / 2 - c.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < c.size + 12) {
        c.collected = true;
        c.flashActive = true;
        c.flashTimer = 0;
        this.particleSystem.addCollectFlash(c.x, c.y);
        this.playCollectSound();
        this.score += 10;
        this.comboCount++;
        if (this.comboCount >= 5) {
          this.score += 50;
          this.comboCount = 0;
          this.particleSystem.triggerFullScreenFlash();
        }
      }
    }
  }

  checkCollisions() {
    const pb = this.player.getBounds();

    for (const o of this.platformManager.obstacles) {
      if (!o.active) continue;

      if (this.rectsOverlap(pb, { x: o.x, y: o.y, width: o.width, height: o.height })) {
        if (this.player.hit()) {
          this.playHitSound();
          this.comboCount = 0;
          if (this.player.lives <= 0) {
            this.gameOver();
            return;
          }
        }
      }

      if (o.hasRollingRock) {
        const rockBounds = { x: o.rockX - 12, y: o.rockY - 12, width: 24, height: 24 };
        if (this.rectsOverlap(pb, rockBounds)) {
          if (this.player.hit()) {
            this.playHitSound();
            this.comboCount = 0;
            if (this.player.lives <= 0) {
              this.gameOver();
              return;
            }
          }
        }
      }
    }
  }

  rectsOverlap(
    a: { x: number; y: number; width: number; height: number },
    b: { x: number; y: number; width: number; height: number }
  ): boolean {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }

  gameOver() {
    this.isGameOver = true;
    this.isRunning = false;
    this.gameOverAnimating = true;
    this.gameOverPanelY = -300;
    this.gameOverPanelTargetY = (this.canvas.height - 220) / 2;
  }

  reset() {
    this.score = 0;
    this.distance = 0;
    this.gameTime = 0;
    this.scrollSpeed = 2;
    this.comboCount = 0;
    this.isRunning = true;
    this.isGameOver = false;
    this.gameOverAnimating = false;
    this.replayHover = false;

    this.platformManager = new PlatformManager(this.canvas.width, this.canvas.height);
    this.particleSystem = new ParticleSystem(this.canvas.width, this.canvas.height);
    this.player.reset(100, this.canvas.height - 140);
    this.player.particleSystem = this.particleSystem;
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const skyGradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    skyGradient.addColorStop(0, '#0D47A1');
    skyGradient.addColorStop(0.5, '#1A1A2E');
    skyGradient.addColorStop(1, '#1A1A2E');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.particleSystem.drawPurpleFog(ctx);
    this.platformManager.drawPlatforms(ctx);
    this.platformManager.drawObstacles(ctx);
    this.particleSystem.drawCollectibles(ctx);
    this.player.draw(ctx);
    this.particleSystem.drawLandingParticles(ctx);
    this.particleSystem.drawFog(ctx);

    this.drawFogOverlay(ctx);

    this.particleSystem.drawScreenFlash(ctx);
    this.particleSystem.drawFullScreenFlash(ctx);

    this.drawHUD(ctx);

    if (this.isGameOver) {
      this.drawGameOverPanel(ctx);
    }
  }

  drawFogOverlay(ctx: CanvasRenderingContext2D) {
    const gradient = ctx.createRadialGradient(
      this.player.x + this.player.width / 2,
      this.player.y + this.player.height / 2,
      80,
      this.player.x + this.player.width / 2,
      this.player.y + this.player.height / 2,
      300
    );
    gradient.addColorStop(0, 'rgba(26, 26, 46, 0)');
    gradient.addColorStop(1, 'rgba(26, 26, 46, 0.85)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawHUD(ctx: CanvasRenderingContext2D) {
    const hudWidth = this.canvas.width - 20;
    const hudHeight = 36;
    const hudX = 10;
    const hudY = 10;

    ctx.fillStyle = 'rgba(26, 26, 46, 0.7)';
    this.roundRect(ctx, hudX, hudY, hudWidth, hudHeight, 8);
    ctx.fill();
    ctx.strokeStyle = '#4A90D9';
    ctx.lineWidth = 2;
    this.roundRect(ctx, hudX, hudY, hudWidth, hudHeight, 8);
    ctx.stroke();

    ctx.font = 'bold 20px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#FFE082';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${this.score}`, hudX + 12, hudY + hudHeight / 2);

    ctx.font = '18px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#B0BEC5';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.floor(this.distance * 0.5)}m`, hudX + hudWidth / 2, hudY + hudHeight / 2);

    const heartStartX = hudX + hudWidth - 50;
    this.particleSystem.drawHearts(ctx, this.player.lives, heartStartX, hudY + 8);
  }

  drawGameOverPanel(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const panelW = 320;
    const panelH = 220;
    const panelX = (this.canvas.width - panelW) / 2;
    const panelY = this.gameOverPanelY;

    ctx.fillStyle = 'rgba(26, 26, 46, 0.9)';
    this.roundRect(ctx, panelX, panelY, panelW, panelH, 16);
    ctx.fill();
    ctx.strokeStyle = '#E74C3C';
    ctx.lineWidth = 3;
    this.roundRect(ctx, panelX, panelY, panelW, panelH, 16);
    ctx.stroke();

    ctx.font = 'bold 36px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#1A1A2E';
    ctx.shadowBlur = 4;
    ctx.fillText(`${this.score}`, panelX + panelW / 2, panelY + 60);
    ctx.shadowBlur = 0;

    ctx.font = '16px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#B0BEC5';
    ctx.fillText(`跑了 ${Math.floor(this.distance * 0.5)} 米`, panelX + panelW / 2, panelY + 100);

    const btnW = 160;
    const btnH = 44;
    const btnX = panelX + (panelW - btnW) / 2;
    const btnY = panelY + panelH - 65;

    ctx.save();
    if (this.replayHover) {
      ctx.translate(btnX + btnW / 2, btnY + btnH / 2);
      ctx.scale(1.05, 1.05);
      ctx.translate(-(btnX + btnW / 2), -(btnY + btnH / 2));
    }
    ctx.fillStyle = this.replayHover ? '#FFE082' : '#FFD54F';
    this.roundRect(ctx, btnX, btnY, btnW, btnH, 8);
    ctx.fill();

    ctx.font = 'bold 24px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#1A1A2E';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('重玩', btnX + btnW / 2, btnY + btnH / 2);
    ctx.restore();
  }

  roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.particleSystem.resize(this.canvas.width, this.canvas.height);
    this.platformManager.resize(this.canvas.height);
  }
}
