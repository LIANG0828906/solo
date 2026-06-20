import { CONFIG, AURORA_COLORS, RUNE_SYMBOLS, NEON_CYAN, NEON_GOLD, MOSS_GREEN } from './config';
import { Rune } from './rune';
import { Guardian } from './guardian';
import { EffectManager } from './effect';

class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number = 0;
  private height: number = 0;
  private screenScale: number = 1;

  private runes: Rune[] = [];
  private runeOrder: number[] = [];
  private currentRuneIndex: number = 0;
  private gameState: 'idle' | 'playing' | 'returning' | 'complete' = 'idle';
  private energy: number = 0;

  private guardian: Guardian;
  private effectManager: EffectManager;

  private lastTime: number = 0;
  private audioContext: AudioContext | null = null;

  private stars: { x: number; y: number; size: number; alpha: number; twinkleSpeed: number }[] = [];

  private bgMusicOscillator: OscillatorNode | null = null;
  private bgMusicGain: GainNode | null = null;

  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;

    this.initAudio();
    this.guardian = new Guardian(this.audioContext);
    this.effectManager = new EffectManager(this.audioContext);

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.canvas.addEventListener('click', (e) => this.handleClick(e));

    this.initStars();
    this.initRunes();
    this.generateRuneOrder();
    this.startGame();
    this.startBackgroundMusic();
    this.gameLoop(performance.now());
  }

  private initAudio(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
      this.audioContext = null;
    }
  }

  private startBackgroundMusic(): void {
    if (!this.audioContext) return;

    this.bgMusicOscillator = this.audioContext.createOscillator();
    this.bgMusicGain = this.audioContext.createGain();

    this.bgMusicOscillator.connect(this.bgMusicGain);
    this.bgMusicGain.connect(this.audioContext.destination);

    this.bgMusicOscillator.frequency.value = 65.41;
    this.bgMusicOscillator.type = 'sawtooth';

    this.bgMusicGain.gain.setValueAtTime(0, this.audioContext.currentTime);
    this.bgMusicGain.gain.linearRampToValueAtTime(0.08, this.audioContext.currentTime + 2);

    this.bgMusicOscillator.start();

    const windGain = this.audioContext.createGain();

    const noiseBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 2, this.audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;

    noise.connect(filter);
    filter.connect(windGain);
    windGain.connect(this.audioContext.destination);

    windGain.gain.setValueAtTime(0, this.audioContext.currentTime);
    windGain.gain.linearRampToValueAtTime(0.03, this.audioContext.currentTime + 3);

    noise.start();
  }

  private resize(): void {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    const clampedWidth = Math.max(CONFIG.MIN_SCREEN_WIDTH, Math.min(CONFIG.MAX_SCREEN_WIDTH, this.width));
    this.screenScale = clampedWidth / CONFIG.BASE_SCREEN_WIDTH;

    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.initStars();
  }

  private initStars(): void {
    this.stars = [];
    const starCount = Math.floor((this.width * this.height) / 3000);
    for (let i = 0; i < starCount; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height * 0.7,
        size: 0.5 + Math.random() * 2,
        alpha: 0.3 + Math.random() * 0.7,
        twinkleSpeed: 0.5 + Math.random() * 1.5,
      });
    }
  }

  private initRunes(): void {
    this.runes = [];
    const circleRadius = this.height * CONFIG.CIRCLE_RADIUS_RATIO;
    const centerX = this.width / 2;
    const centerY = this.height * 0.7;

    for (let i = 0; i < CONFIG.RUNE_COUNT; i++) {
      const angle = (i / CONFIG.RUNE_COUNT) * Math.PI * 2 - Math.PI / 2;
      const startX = centerX + Math.cos(angle) * circleRadius;
      const startY = centerY + Math.sin(angle) * circleRadius;

      const targetX = this.width * 0.15 + Math.random() * this.width * 0.7;
      const targetY = this.height * 0.15 + Math.random() * this.height * 0.35;

      const rune = new Rune(i, startX, startY, targetX, targetY, this.screenScale, this.audioContext);
      this.runes.push(rune);
    }
  }

  private generateRuneOrder(): void {
    this.runeOrder = [];
    const indices = Array.from({ length: CONFIG.RUNE_COUNT }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    this.runeOrder = indices;
  }

  private startGame(): void {
    this.gameState = 'playing';
    this.currentRuneIndex = 0;
    this.energy = 0;
    this.guardian.reset();
    this.effectManager.reset();

    const circleRadius = this.height * CONFIG.CIRCLE_RADIUS_RATIO;
    const centerX = this.width / 2;
    const centerY = this.height * 0.7;

    for (let i = 0; i < CONFIG.RUNE_COUNT; i++) {
      const angle = (i / CONFIG.RUNE_COUNT) * Math.PI * 2 - Math.PI / 2;
      const startX = centerX + Math.cos(angle) * circleRadius;
      const startY = centerY + Math.sin(angle) * circleRadius;

      const targetX = this.width * 0.15 + Math.random() * this.width * 0.7;
      const targetY = this.height * 0.15 + Math.random() * this.height * 0.35;

      this.runes[i].reset(startX, startY, targetX, targetY);
    }

    this.generateRuneOrder();

    setTimeout(() => {
      for (const rune of this.runes) {
        rune.activate();
      }
    }, 500);
  }

  private handleClick(e: MouseEvent): void {
    if (this.gameState !== 'playing') return;
    if (!this.audioContext) return;
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const expectedRuneId = this.runeOrder[this.currentRuneIndex];
    let clickedRune: Rune | null = null;

    for (const rune of this.runes) {
      if (rune.containsPoint(x, y) && rune.state.isActive) {
        clickedRune = rune;
        break;
      }
    }

    if (clickedRune) {
      if (clickedRune.state.id === expectedRuneId) {
        clickedRune.onCorrectClick();
        this.effectManager.createShockwave(clickedRune.state.x, clickedRune.state.y, clickedRune.state.id, this.screenScale);
        this.currentRuneIndex++;
        this.energy = Math.min(1, this.energy + CONFIG.ENERGY_PER_CORRECT);

        if (this.currentRuneIndex >= CONFIG.RUNE_COUNT) {
          this.effectManager.createFlash();
          setTimeout(() => {
            this.effectManager.createTextAnimation('星桥修复完毕', this.width / 2, this.height * 0.85);
          }, 100);
          this.startReturnPhase();
        }
      } else {
        clickedRune.onWrongClick();
      }
    }
  }

  private startReturnPhase(): void {
    this.gameState = 'returning';
    const centerX = this.width / 2;
    const centerY = this.height * 0.7;

    this.runes.forEach((rune, index) => {
      const angle = (index / CONFIG.RUNE_COUNT) * Math.PI * 2 - Math.PI / 2;
      const circleRadius = this.height * CONFIG.CIRCLE_RADIUS_RATIO * 0.8;
      const targetX = centerX + Math.cos(angle) * circleRadius;
      const targetY = centerY + Math.sin(angle) * circleRadius;

      setTimeout(() => {
        rune.startReturn(targetX, targetY);
      }, index * 100);
    });

    setTimeout(() => {
      this.effectManager.createLightBeam(centerX, centerY, this.width, this.height);
    }, 1500);

    setTimeout(() => {
      this.guardian.init(centerX, centerY);
      this.gameState = 'complete';
    }, 3000);

    setTimeout(() => {
      this.startGame();
    }, 10000);
  }

  private gameLoop(currentTime: number): void {
    const deltaTime = Math.min(currentTime - this.lastTime, 1000 / 30);
    this.lastTime = currentTime;

    this.update(deltaTime);
    this.draw();

    requestAnimationFrame((t) => this.gameLoop(t));
  }

  private update(deltaTime: number): void {
    for (const rune of this.runes) {
      rune.update(deltaTime, this.screenScale);
    }

    this.effectManager.update(deltaTime);
    this.guardian.update(deltaTime, this.screenScale);
  }

  private draw(): void {
    this.ctx.clearRect(0, 0, this.width, this.height);

    this.drawBackground();
    this.drawTemple();
    this.drawCircle();
    this.drawEnergyBar();
    this.drawHints();

    for (const rune of this.runes) {
      rune.draw(this.ctx, this.screenScale);
    }

    this.guardian.draw(this.ctx, this.screenScale);
    this.effectManager.draw(this.ctx, this.screenScale);
  }

  private drawBackground(): void {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#050815');
    gradient.addColorStop(0.5, '#0a0e27');
    gradient.addColorStop(1, '#1a1a3a');

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    const time = performance.now() / 1000;
    for (const star of this.stars) {
      const twinkle = Math.sin(time * star.twinkleSpeed + star.x) * 0.3 + 0.7;
      this.ctx.globalAlpha = star.alpha * twinkle;
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.size * this.screenScale, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1;

    const auroraGradient = this.ctx.createLinearGradient(0, 0, this.width, this.height * 0.5);
    auroraGradient.addColorStop(0, 'rgba(157, 78, 221, 0.1)');
    auroraGradient.addColorStop(0.3, 'rgba(0, 255, 198, 0.08)');
    auroraGradient.addColorStop(0.6, 'rgba(255, 107, 157, 0.06)');
    auroraGradient.addColorStop(1, 'transparent');

    this.ctx.fillStyle = auroraGradient;
    this.ctx.fillRect(0, 0, this.width, this.height * 0.6);
  }

  private drawTemple(): void {
    const wallGradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    wallGradient.addColorStop(0, '#1a1a2e');
    wallGradient.addColorStop(0.3, '#16213e');
    wallGradient.addColorStop(1, '#0f0f23');

    this.ctx.fillStyle = wallGradient;
    this.ctx.fillRect(0, 0, this.width * 0.1, this.height);
    this.ctx.fillRect(this.width * 0.9, 0, this.width * 0.1, this.height);

    this.drawSpiralPatterns();

    const floorY = this.height * 0.9;
    const floorGradient = this.ctx.createLinearGradient(0, floorY, 0, this.height);
    floorGradient.addColorStop(0, '#3a3a4a');
    floorGradient.addColorStop(1, '#2a2a3a');

    this.ctx.fillStyle = floorGradient;
    this.ctx.fillRect(0, floorY, this.width, this.height - floorY);

    this.drawStoneFloor(floorY);
    this.drawMoss();
  }

  private drawSpiralPatterns(): void {
    this.ctx.strokeStyle = MOSS_GREEN;
    this.ctx.lineWidth = 2 * this.screenScale;
    this.ctx.globalAlpha = 0.4;

    const drawSpiral = (cx: number, cy: number, size: number) => {
      this.ctx.beginPath();
      for (let i = 0; i < 720; i++) {
        const angle = (i / 180) * Math.PI;
        const radius = (i / 720) * size;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        if (i === 0) {
          this.ctx.moveTo(x, y);
        } else {
          this.ctx.lineTo(x, y);
        }
      }
      this.ctx.stroke();
    };

    for (let y = this.height * 0.1; y < this.height * 0.8; y += this.height * 0.2) {
      drawSpiral(this.width * 0.05, y, 30 * this.screenScale);
      drawSpiral(this.width * 0.95, y, 30 * this.screenScale);
    }

    this.ctx.globalAlpha = 1;
  }

  private drawStoneFloor(floorY: number): void {
    this.ctx.strokeStyle = '#2a2a3a';
    this.ctx.lineWidth = 1;

    const brickWidth = 80 * this.screenScale;
    const brickHeight = 40 * this.screenScale;

    for (let y = floorY; y < this.height; y += brickHeight) {
      const offset = ((y - floorY) / brickHeight) % 2 === 0 ? 0 : brickWidth / 2;
      for (let x = offset; x < this.width; x += brickWidth) {
        this.ctx.strokeRect(x, y, brickWidth, brickHeight);
      }
    }
  }

  private drawMoss(): void {
    this.ctx.fillStyle = MOSS_GREEN;
    this.ctx.globalAlpha = 0.6;

    for (let i = 0; i < 50; i++) {
      const x = Math.random() * this.width;
      const y = this.height * 0.92 + Math.random() * this.height * 0.07;
      const size = 3 + Math.random() * 8;

      this.ctx.beginPath();
      this.ctx.arc(x, y, size * this.screenScale, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.globalAlpha = 1;
  }

  private drawCircle(): void {
    const centerX = this.width / 2;
    const centerY = this.height * 0.7;
    const radius = this.height * CONFIG.CIRCLE_RADIUS_RATIO;

    const outerGlow = this.ctx.createRadialGradient(centerX, centerY, radius * 0.8, centerX, centerY, radius * 1.5);
    outerGlow.addColorStop(0, 'rgba(0, 255, 255, 0.2)');
    outerGlow.addColorStop(1, 'transparent');
    this.ctx.fillStyle = outerGlow;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius * 1.5, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = NEON_CYAN;
    this.ctx.lineWidth = 3 * this.screenScale;
    this.ctx.shadowColor = NEON_CYAN;
    this.ctx.shadowBlur = 20 * this.screenScale;

    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius * 0.8, 0, Math.PI * 2);
    this.ctx.stroke();

    this.ctx.lineWidth = 2 * this.screenScale;
    for (let i = 0; i < 6; i++) {
      const angle1 = (i / 6) * Math.PI * 2;
      const angle2 = ((i + 3) % 6) / 6 * Math.PI * 2;

      this.ctx.beginPath();
      this.ctx.moveTo(
        centerX + Math.cos(angle1) * radius * 0.8,
        centerY + Math.sin(angle1) * radius * 0.8
      );
      this.ctx.lineTo(
        centerX + Math.cos(angle2) * radius * 0.8,
        centerY + Math.sin(angle2) * radius * 0.8
      );
      this.ctx.stroke();
    }

    for (let i = 0; i < CONFIG.RUNE_COUNT; i++) {
      const angle = (i / CONFIG.RUNE_COUNT) * Math.PI * 2 - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius * 0.9;
      const y = centerY + Math.sin(angle) * radius * 0.9;

      this.ctx.fillStyle = AURORA_COLORS[i % AURORA_COLORS.length].hex;
      this.ctx.font = `bold ${radius * 0.12}px serif`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(RUNE_SYMBOLS[i % RUNE_SYMBOLS.length], x, y);
    }

    this.ctx.shadowBlur = 0;

    const innerCircleGradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 0.5);
    innerCircleGradient.addColorStop(0, 'rgba(0, 255, 255, 0.1)');
    innerCircleGradient.addColorStop(1, 'rgba(0, 255, 255, 0.02)');
    this.ctx.fillStyle = innerCircleGradient;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius * 0.5, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawEnergyBar(): void {
    const barWidth = this.width * CONFIG.ENERGY_BAR_WIDTH_RATIO;
    const barHeight = CONFIG.ENERGY_BAR_HEIGHT * this.screenScale;
    const x = (this.width - barWidth) / 2;
    const y = 30 * this.screenScale;

    const bgGradient = this.ctx.createLinearGradient(x, y, x, y + barHeight);
    bgGradient.addColorStop(0, '#2a2a3a');
    bgGradient.addColorStop(1, '#1a1a2a');

    this.ctx.fillStyle = bgGradient;
    this.ctx.strokeStyle = '#3a3a4a';
    this.ctx.lineWidth = 2;

    this.ctx.beginPath();
    this.ctx.roundRect(x, y, barWidth, barHeight, 5 * this.screenScale);
    this.ctx.fill();
    this.ctx.stroke();

    const fillWidth = barWidth * this.energy;
    if (fillWidth > 0) {
      const fillGradient = this.ctx.createLinearGradient(x, y, x + fillWidth, y);
      fillGradient.addColorStop(0, '#ff4444');
      fillGradient.addColorStop(0.5, '#ff8844');
      fillGradient.addColorStop(1, '#00bfff');

      this.ctx.fillStyle = fillGradient;
      this.ctx.shadowColor = '#00bfff';
      this.ctx.shadowBlur = 10 * this.screenScale;

      this.ctx.beginPath();
      this.ctx.roundRect(x + 2, y + 2, fillWidth - 4, barHeight - 4, 3 * this.screenScale);
      this.ctx.fill();

      this.ctx.shadowBlur = 0;
    }

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = `${12 * this.screenScale}px serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(`能量: ${Math.floor(this.energy * 100)}%`, this.width / 2, y + barHeight / 2);
  }

  private drawHints(): void {
    const dotSize = 12 * this.screenScale;
    const spacing = 8 * this.screenScale;
    const startX = 30 * this.screenScale;
    const startY = this.height - 50 * this.screenScale;

    for (let i = 0; i < this.runeOrder.length; i++) {
      const x = startX + i * (dotSize + spacing);
      const y = startY;

      const isCompleted = i < this.currentRuneIndex;
      const isCurrent = i === this.currentRuneIndex;

      if (isCompleted) {
        const glowGradient = this.ctx.createRadialGradient(x, y, 0, x, y, dotSize * 1.5);
        glowGradient.addColorStop(0, 'rgba(255, 215, 0, 0.6)');
        glowGradient.addColorStop(1, 'transparent');
        this.ctx.fillStyle = glowGradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, dotSize * 1.5, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = NEON_GOLD;
        this.ctx.shadowColor = NEON_GOLD;
        this.ctx.shadowBlur = 10 * this.screenScale;
      } else {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.shadowBlur = 0;
      }

      this.ctx.beginPath();
      this.ctx.arc(x, y, dotSize / 2, 0, Math.PI * 2);
      this.ctx.fill();

      if (isCurrent && this.gameState === 'playing') {
        this.ctx.strokeStyle = NEON_CYAN;
        this.ctx.lineWidth = 2 * this.screenScale;
        this.ctx.shadowColor = NEON_CYAN;
        this.ctx.shadowBlur = 10 * this.screenScale;
        this.ctx.beginPath();
        this.ctx.arc(x, y, dotSize / 2 + 3 * this.screenScale, 0, Math.PI * 2);
        this.ctx.stroke();
      }

      this.ctx.shadowBlur = 0;

      const runeIndex = this.runeOrder[i];
      const color = AURORA_COLORS[runeIndex % AURORA_COLORS.length];
      this.ctx.fillStyle = isCompleted ? '#ffffff' : color.hex;
      this.ctx.font = `bold ${dotSize * 0.5}px serif`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(String(i + 1), x, y);
    }

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.font = `${14 * this.screenScale}px serif`;
    this.ctx.textAlign = 'left';
    this.ctx.fillText('点击顺序提示', startX, startY - 25 * this.screenScale);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
