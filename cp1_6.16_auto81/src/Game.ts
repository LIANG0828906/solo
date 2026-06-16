import { Player } from './Player.js';
import { PlatformManager } from './Platform.js';
import { CrystalManager } from './Crystal.js';

interface Crack {
  x: number;
  y: number;
  segments: { x: number; y: number }[];
  phase: number;
  frequency: number;
}

type GameState = 'playing' | 'gameover';

class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;

  player: Player;
  platformManager: PlatformManager;
  crystalManager: CrystalManager;

  keys: Set<string>;
  cameraY: number;

  lavaY: number;
  lavaRiseSpeed: number;
  lavaWavePhase: number;

  cracks: Crack[];

  state: GameState;
  score: number;
  maxHeight: number;

  highestPlatformY: number;

  bgColorTop: { r: number; g: number; b: number };
  bgColorBottom: { r: number; g: number; b: number };
  targetBgTop: { r: number; g: number; b: number };
  targetBgBottom: { r: number; g: number; b: number };
  bgTransitionProgress: number;
  bgTransitionActive: boolean;
  currentLevel: number;
  vignetteAlpha: number;
  targetVignetteAlpha: number;

  hudHeight: HTMLElement | null;
  hudCrystal: HTMLElement | null;
  warningBar: HTMLElement | null;
  gameOverPanel: HTMLElement | null;
  finalHeight: HTMLElement | null;
  finalCrystals: HTMLElement | null;
  restartBtn: HTMLElement | null;
  gameContainer: HTMLElement | null;

  lastTime: number;
  animationId: number | null;

  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.width = 600;
    this.height = Math.min(window.innerHeight, 900);

    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.player = new Player(this.width / 2, this.height - 200);
    this.platformManager = new PlatformManager(this.width);
    this.crystalManager = new CrystalManager(this.width);

    this.keys = new Set();
    this.cameraY = 0;

    this.lavaY = this.height + 50;
    this.lavaRiseSpeed = 1;
    this.lavaWavePhase = 0;

    this.cracks = [];

    this.state = 'playing';
    this.score = 0;
    this.maxHeight = 0;

    this.highestPlatformY = this.height - 100;

    this.bgColorTop = { r: 80, g: 20, b: 10 };
    this.bgColorBottom = { r: 180, g: 60, b: 20 };
    this.targetBgTop = { r: 80, g: 20, b: 10 };
    this.targetBgBottom = { r: 180, g: 60, b: 20 };
    this.bgTransitionProgress = 0;
    this.bgTransitionActive = false;
    this.currentLevel = 0;
    this.vignetteAlpha = 0;
    this.targetVignetteAlpha = 0;

    this.hudHeight = document.getElementById('height-value');
    this.hudCrystal = document.getElementById('crystal-value');
    this.warningBar = document.getElementById('warning-bar');
    this.gameOverPanel = document.getElementById('game-over');
    this.finalHeight = document.getElementById('final-height');
    this.finalCrystals = document.getElementById('final-crystals');
    this.restartBtn = document.getElementById('restart-btn');
    this.gameContainer = document.getElementById('game-container');

    if (this.gameContainer) {
      this.gameContainer.style.width = this.width + 'px';
      this.gameContainer.style.height = this.height + 'px';
    }

    this.lastTime = 0;
    this.animationId = null;

    this.init();
  }

  init(): void {
    this.platformManager.generateInitialPlatforms(this.height - 80, this.height);
    this.generateInitialCracks();
    this.crystalManager.spawnCrystals(-200);

    this.setupEventListeners();
    this.updateHUD();

    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  setupEventListeners(): void {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key);
      if (e.key === 'ArrowUp' && this.state === 'playing') {
        this.player.jump();
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key);
    });

    if (this.restartBtn) {
      this.restartBtn.addEventListener('click', () => {
        this.restart();
      });
    }

    window.addEventListener('resize', () => {
      this.height = Math.min(window.innerHeight, 900);
      this.canvas.height = this.height;
      if (this.gameContainer) {
        this.gameContainer.style.height = this.height + 'px';
      }
    });
  }

  generateInitialCracks(): void {
    for (let i = 0; i < 20; i++) {
      this.cracks.push(this.createCrack(Math.random() * this.height * 2 - this.height));
    }
  }

  createCrack(y: number): Crack {
    const startX = Math.random() * this.width;
    const segments: { x: number; y: number }[] = [];
    let cx = startX;
    let cy = 0;
    const len = 5 + Math.floor(Math.random() * 10);
    for (let i = 0; i < len; i++) {
      cx += (Math.random() - 0.5) * 30;
      cy += Math.random() * 20 + 5;
      segments.push({ x: cx, y: cy });
    }
    return {
      x: startX,
      y: y,
      segments: segments,
      phase: Math.random() * Math.PI * 2,
      frequency: 0.5 + Math.random() * 1.0
    };
  }

  updateCracks(): void {
    for (let i = this.cracks.length - 1; i >= 0; i--) {
      const c = this.cracks[i];
      c.phase += (Math.PI * 2 * c.frequency) / 60;

      if (c.y - this.cameraY > this.height + 100) {
        this.cracks.splice(i, 1);
      }
    }

    const topY = this.cameraY - 200;
    const minCrackY = this.cracks.length > 0
      ? Math.min(...this.cracks.map(c => c.y))
      : this.cameraY;

    while (minCrackY > topY) {
      const newY = minCrackY - Math.random() * 100 - 50;
      this.cracks.push(this.createCrack(newY));
      break;
    }
  }

  drawBackground(): void {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    const top = this.bgColorTop;
    const bottom = this.bgColorBottom;
    gradient.addColorStop(0, `rgb(${top.r}, ${top.g}, ${top.b})`);
    gradient.addColorStop(1, `rgb(${bottom.r}, ${bottom.g}, ${bottom.b})`);
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawCracks(): void {
    for (const c of this.cracks) {
      const screenY = c.y - this.cameraY;
      if (screenY > this.height + 50 || screenY < -200) continue;
      if (screenY > this.lavaY - this.cameraY) continue;

      const glow = 0.5 + 0.5 * Math.sin(c.phase);
      this.ctx.save();
      this.ctx.strokeStyle = `rgba(255, ${160 + Math.floor(glow * 80)}, 50, ${0.4 + glow * 0.6})`;
      this.ctx.lineWidth = 1.5 + glow;
      this.ctx.shadowColor = `rgba(255, 180, 80, ${glow})`;
      this.ctx.shadowBlur = 5 + glow * 8;
      this.ctx.beginPath();
      this.ctx.moveTo(c.x, screenY);
      for (const seg of c.segments) {
        this.ctx.lineTo(c.x + seg.x - c.x, screenY + seg.y);
      }
      this.ctx.stroke();
      this.ctx.restore();
    }
  }

  drawLava(): void {
    const lavaScreenY = this.lavaY - this.cameraY;
    if (lavaScreenY < -50) return;

    const waveAmplitude = 8;
    const waveFrequency = 0.03;

    this.ctx.save();

    const lavaGradient = this.ctx.createLinearGradient(0, lavaScreenY - 20, 0, this.height);
    lavaGradient.addColorStop(0, 'rgba(255, 180, 80, 0.9)');
    lavaGradient.addColorStop(0.3, 'rgba(255, 100, 30, 0.95)');
    lavaGradient.addColorStop(1, 'rgba(150, 20, 0, 1)');
    this.ctx.fillStyle = lavaGradient;

    this.ctx.beginPath();
    this.ctx.moveTo(0, this.height);

    for (let x = 0; x <= this.width; x += 5) {
      const wave = Math.sin(x * waveFrequency + this.lavaWavePhase) * waveAmplitude
        + Math.sin(x * waveFrequency * 2.3 + this.lavaWavePhase * 1.5) * (waveAmplitude * 0.4);
      this.ctx.lineTo(x, lavaScreenY + wave);
    }

    this.ctx.lineTo(this.width, this.height);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.shadowColor = 'rgba(255, 120, 40, 0.8)';
    this.ctx.shadowBlur = 30;
    this.ctx.strokeStyle = 'rgba(255, 200, 100, 0.8)';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    for (let x = 0; x <= this.width; x += 5) {
      const wave = Math.sin(x * waveFrequency + this.lavaWavePhase) * waveAmplitude
        + Math.sin(x * waveFrequency * 2.3 + this.lavaWavePhase * 1.5) * (waveAmplitude * 0.4);
      if (x === 0) {
        this.ctx.moveTo(x, lavaScreenY + wave);
      } else {
        this.ctx.lineTo(x, lavaScreenY + wave);
      }
    }
    this.ctx.stroke();

    this.ctx.restore();
  }

  drawVignette(): void {
    if (this.vignetteAlpha <= 0.01) return;
    this.ctx.save();
    const gradient = this.ctx.createRadialGradient(
      this.width / 2, this.height / 2, Math.min(this.width, this.height) * 0.3,
      this.width / 2, this.height / 2, Math.max(this.width, this.height) * 0.7
    );
    gradient.addColorStop(0, `rgba(0, 0, 0, 0)`);
    gradient.addColorStop(1, `rgba(0, 0, 0, ${this.vignetteAlpha})`);
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.restore();
  }

  updateBackgroundTransition(): void {
    if (this.bgTransitionActive) {
      this.bgTransitionProgress += 1 / (60 * 3);
      const t = Math.min(1, this.bgTransitionProgress);
      const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      this.bgColorTop.r = this.lerp(this.bgColorTop.r, this.targetBgTop.r, easeT);
      this.bgColorTop.g = this.lerp(this.bgColorTop.g, this.targetBgTop.g, easeT);
      this.bgColorTop.b = this.lerp(this.bgColorTop.b, this.targetBgTop.b, easeT);
      this.bgColorBottom.r = this.lerp(this.bgColorBottom.r, this.targetBgBottom.r, easeT);
      this.bgColorBottom.g = this.lerp(this.bgColorBottom.g, this.targetBgBottom.g, easeT);
      this.bgColorBottom.b = this.lerp(this.bgColorBottom.b, this.targetBgBottom.b, easeT);

      if (t >= 1) {
        this.bgTransitionActive = false;
      }
    }

    this.vignetteAlpha = this.lerp(this.vignetteAlpha, this.targetVignetteAlpha, 0.02);
  }

  checkLevelProgress(): void {
    const heightMeters = this.maxHeight * 0.1;
    const newLevel = Math.floor(heightMeters / 500);

    if (newLevel > this.currentLevel) {
      this.currentLevel = newLevel;
      this.bgTransitionActive = true;
      this.bgTransitionProgress = 0;

      const purpleShift = Math.min(newLevel, 3);
      this.targetBgTop = {
        r: Math.max(30, 80 - purpleShift * 15),
        g: Math.max(5, 20 - purpleShift * 5),
        b: 10 + purpleShift * 20
      };
      this.targetBgBottom = {
        r: Math.max(80, 180 - purpleShift * 25),
        g: Math.max(15, 60 - purpleShift * 12),
        b: 20 + purpleShift * 30
      };

      this.lavaRiseSpeed = 1.5;
      this.platformManager.setDifficulty(1);
      this.targetVignetteAlpha = 0.5;
    }
  }

  updateCamera(): void {
    const targetCameraY = this.player.y - this.height * 0.6;
    if (targetCameraY < this.cameraY) {
      this.cameraY += (targetCameraY - this.cameraY) * 0.1;
    }
  }

  updateHUD(): void {
    if (this.hudHeight) {
      this.hudHeight.textContent = (this.maxHeight * 0.1).toFixed(1);
    }
    if (this.hudCrystal) {
      this.hudCrystal.textContent = this.score.toString();
    }

    if (this.warningBar) {
      const lavaDist = this.player.y - this.lavaY;
      const maxDist = this.height;
      const warningPct = Math.max(0, Math.min(100, 100 - (lavaDist / maxDist) * 100));
      this.warningBar.style.height = warningPct + '%';
    }
  }

  showScorePopup(x: number, screenY: number): void {
    this.score++;

    if (this.hudCrystal) {
      this.hudCrystal.classList.remove('pop');
      void this.hudCrystal.offsetWidth;
      this.hudCrystal.classList.add('pop');
      setTimeout(() => {
        if (this.hudCrystal) this.hudCrystal.classList.remove('pop');
      }, 200);
    }

    const popup = document.createElement('div');
    popup.className = 'score-popup';
    popup.textContent = '+1';
    popup.style.left = x + 'px';
    popup.style.top = screenY + 'px';
    if (this.gameContainer) {
      this.gameContainer.appendChild(popup);
    }
    setTimeout(() => {
      popup.remove();
    }, 800);

    this.updateHUD();
  }

  gameOver(): void {
    this.state = 'gameover';
    if (this.gameOverPanel) {
      this.gameOverPanel.classList.add('visible');
    }
    if (this.finalHeight) {
      this.finalHeight.textContent = (this.maxHeight * 0.1).toFixed(1) + ' 米';
    }
    if (this.finalCrystals) {
      this.finalCrystals.textContent = this.score + ' 颗';
    }
  }

  restart(): void {
    this.player = new Player(this.width / 2, this.height - 200);
    this.platformManager = new PlatformManager(this.width);
    this.crystalManager.reset();

    this.cameraY = 0;
    this.lavaY = this.height + 50;
    this.lavaRiseSpeed = 1;
    this.lavaWavePhase = 0;
    this.cracks = [];

    this.state = 'playing';
    this.score = 0;
    this.maxHeight = 0;
    this.highestPlatformY = this.height - 100;

    this.bgColorTop = { r: 80, g: 20, b: 10 };
    this.bgColorBottom = { r: 180, g: 60, b: 20 };
    this.targetBgTop = { r: 80, g: 20, b: 10 };
    this.targetBgBottom = { r: 180, g: 60, b: 20 };
    this.bgTransitionProgress = 0;
    this.bgTransitionActive = false;
    this.currentLevel = 0;
    this.vignetteAlpha = 0;
    this.targetVignetteAlpha = 0;

    this.platformManager.generateInitialPlatforms(this.height - 80, this.height);
    this.generateInitialCracks();
    this.crystalManager.spawnCrystals(-200);

    if (this.gameOverPanel) {
      this.gameOverPanel.classList.remove('visible');
    }

    this.updateHUD();
  }

  update(): void {
    if (this.state !== 'playing') return;

    this.player.update(this.keys, this.width);

    this.player.onGround = false;
    this.platformManager.checkCollisions(this.player);
    if (this.player.onGround) {
      this.player.jumpsLeft = 2;
    }

    this.highestPlatformY = this.platformManager.update(
      this.player.y,
      this.highestPlatformY,
      this.height
    );

    this.crystalManager.update(
      this.player.x,
      this.player.y,
      this.player.radius,
      this.cameraY,
      this.height,
      this.maxHeight,
      (x, y) => this.showScorePopup(x, y)
    );

    this.lavaWavePhase += Math.PI * 2 * 0.03;
    this.lavaY -= this.lavaRiseSpeed;

    if (this.player.checkLavaCollision(this.lavaY)) {
      this.gameOver();
      return;
    }

    const currentHeight = Math.max(0, Math.floor((this.height - 200) - this.player.y));
    if (currentHeight > this.maxHeight) {
      this.maxHeight = currentHeight;
    }

    this.updateCamera();
    this.updateCracks();
    this.checkLevelProgress();
    this.updateBackgroundTransition();
    this.updateHUD();
  }

  render(): void {
    this.drawBackground();
    this.drawCracks();

    this.platformManager.draw(this.ctx, this.cameraY);
    this.crystalManager.draw(this.ctx, this.cameraY);
    this.player.draw(this.ctx, this.cameraY);

    this.drawLava();
    this.drawVignette();
  }

  loop(currentTime: number): void {
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    if (deltaTime < 100) {
      this.update();
    }
    this.render();

    this.animationId = requestAnimationFrame((t) => this.loop(t));
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
