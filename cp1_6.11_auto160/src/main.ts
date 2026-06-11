import { ZodiacWheel, type ZodiacSign } from './zodiac';
import { Dice } from './dice';
import { UI } from './ui';

class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private zodiacWheel: ZodiacWheel;
  private dice: Dice;
  private ui: UI;
  private lastFrameTime: number = 0;
  private animationFrameId: number = 0;
  private readonly FRAME_INTERVAL: number = 1000 / 60;
  private mouseX: number = 0;
  private mouseY: number = 0;
  private isRunning: boolean = false;
  private frameCount: number = 0;
  private lastFPSTime: number = 0;
  private fps: number = 60;

  constructor() {
    const canvasEl = document.getElementById('gameCanvas');
    if (!canvasEl) {
      throw new Error('Canvas element not found');
    }
    this.canvas = canvasEl as HTMLCanvasElement;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }
    this.ctx = ctx;

    this.zodiacWheel = new ZodiacWheel(this.canvas, this.ctx);
    this.dice = new Dice(this.canvas, this.ctx);
    this.ui = new UI(this.canvas, this.ctx);

    this.setupCanvas();
    this.setupLayout();
    this.setupEventListeners();
    this.setupCallbacks();
  }

  private setupCanvas(): void {
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

  private setupLayout(): void {
    const cw = window.innerWidth;
    const ch = window.innerHeight;
    const centerX = cw / 2;
    const centerY = ch / 2;

    this.zodiacWheel.setCenter(centerX, centerY);

    const wheelRadius = this.zodiacWheel.getOuterRadius();
    const diceX = centerX - wheelRadius - 90;
    const diceY = centerY - 180;
    this.dice.setPosition(diceX, diceY);

    this.ui.setLayout(cw, ch);
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.handleResize.bind(this));
    this.canvas.addEventListener('click', this.handleClick.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
  }

  private setupCallbacks(): void {
    this.zodiacWheel.setOnSignSelected((sign: ZodiacSign, _index: number) => {
      this.ui.addEnergy(10);
      const summary = `当前星座：${sign.symbol} ${sign.name}\n星象连接已建立...`;
      this.ui.setSummary(summary);
      setTimeout(() => {
        this.ui.setSummary(`当前星座：${sign.symbol} ${sign.name}\n点击骰子揭示命运`);
      }, 1200);
    });

    this.dice.setOnRollComplete((result: number, prediction: string, matchScore: number, isGrand: boolean) => {
      this.ui.addScore(matchScore);

      if (isGrand) {
        this.ui.resetEnergy();
        this.dice.setEnergyFull(false);
      }

      const selectedSign = this.zodiacWheel.getSelectedSign();
      this.zodiacWheel.setCoreText(prediction, 4000);

      const signName = selectedSign ? `${selectedSign.symbol} ${selectedSign.name}` : '未选星座';
      const grandMark = isGrand ? ' ⭐大预言⭐' : '';
      this.ui.setSummary(`${signName} · 骰点${result}${grandMark}\n+${matchScore}分`);

      setTimeout(() => {
        this.ui.setSummary(`当前星座：${signName}\n点击骰子再次推演`);
      }, 3500);
    });
  }

  private handleResize(): void {
    this.setupCanvas();
    this.setupLayout();
  }

  private handleMouseMove(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = e.clientX - rect.left;
    this.mouseY = e.clientY - rect.top;

    this.ui.setSummaryHovered(this.ui.isPointInSummary(this.mouseX, this.mouseY));

    this.updateCursor();
  }

  private updateCursor(): void {
    const overWheel = this.zodiacWheel.isPointInWheel(this.mouseX, this.mouseY);
    const overDice = this.dice.isPointInDice(this.mouseX, this.mouseY);
    const overSummary = this.ui.isPointInSummary(this.mouseX, this.mouseY);

    if (overWheel || overDice) {
      this.canvas.style.cursor = 'pointer';
    } else if (overSummary) {
      this.canvas.style.cursor = 'help';
    } else {
      this.canvas.style.cursor = 'crosshair';
    }
  }

  private handleClick(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (this.dice.isPointInDice(mx, my)) {
      const selectedSign = this.zodiacWheel.getSelectedSign();
      if (!selectedSign) {
        this.ui.setSummary('请先点击星座区域\n唤醒星辰之力');
        this.zodiacWheel.setCoreText('请先选择星座', 1800);
        return;
      }
      const rolled = this.dice.roll(selectedSign);
      if (rolled) {
        this.ui.setSummary(`${selectedSign.symbol} ${selectedSign.name}\n命运之骰正在转动...`);
      }
      return;
    }

    this.zodiacWheel.handleClick(mx, my);
  }

  private checkEnergyFull(): void {
    const isFull = this.ui.isEnergyFull();
    this.dice.setEnergyFull(isFull);
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.lastFPSTime = this.lastFrameTime;
    this.loop(this.lastFrameTime);
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = 0;
    }
  }

  private loop(currentTime: number): void {
    if (!this.isRunning) return;

    const deltaTime = currentTime - this.lastFrameTime;

    if (deltaTime >= this.FRAME_INTERVAL * 0.8) {
      const dt = Math.min(deltaTime, this.FRAME_INTERVAL * 2);

      this.frameCount++;
      if (currentTime - this.lastFPSTime >= 1000) {
        this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFPSTime));
        this.frameCount = 0;
        this.lastFPSTime = currentTime;
      }

      this.update(dt, currentTime);
      this.render();

      this.lastFrameTime = currentTime - (deltaTime % this.FRAME_INTERVAL);
    }

    this.animationFrameId = requestAnimationFrame((t) => this.loop(t));
  }

  private update(deltaTime: number, currentTime: number): void {
    this.zodiacWheel.update(deltaTime, currentTime);
    this.dice.update(deltaTime, currentTime, this.zodiacWheel.getSelectedSign());
    this.ui.update(deltaTime, currentTime);
    this.checkEnergyFull();
  }

  private render(): void {
    const ctx = this.ctx;
    const cw = this.canvas.width / (window.devicePixelRatio || 1);
    const ch = this.canvas.height / (window.devicePixelRatio || 1);

    ctx.clearRect(0, 0, cw, ch);
    this.drawBackground(cw, ch);
    this.zodiacWheel.draw();
    this.dice.draw();
    this.ui.draw();
  }

  private drawBackground(cw: number, ch: number): void {
    const ctx = this.ctx;
    const t = performance.now() * 0.0001;

    const bg = ctx.createLinearGradient(0, 0, cw, ch);
    bg.addColorStop(0, '#16061A');
    bg.addColorStop(1, '#0D0B2B');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, cw, ch);

    ctx.save();
    for (let i = 0; i < 80; i++) {
      const seed = i * 9301 + 49297;
      const x = (seed % 1000) / 1000 * cw;
      const y = ((seed * 7) % 1000) / 1000 * ch;
      const phase = t * (2 + (i % 5) * 0.3) + i;
      const twinkle = (Math.sin(phase) + 1) / 2;
      const alpha = 0.15 + twinkle * 0.35;
      const r = 0.5 + (i % 3) * 0.4;

      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    const nebulaGrad = ctx.createRadialGradient(
      cw * 0.3, ch * 0.4, 0,
      cw * 0.3, ch * 0.4, Math.max(cw, ch) * 0.5
    );
    nebulaGrad.addColorStop(0, 'rgba(80, 30, 120, 0.12)');
    nebulaGrad.addColorStop(0.5, 'rgba(30, 20, 80, 0.06)');
    nebulaGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = nebulaGrad;
    ctx.fillRect(0, 0, cw, ch);

    const nebulaGrad2 = ctx.createRadialGradient(
      cw * 0.75, ch * 0.7, 0,
      cw * 0.75, ch * 0.7, Math.max(cw, ch) * 0.4
    );
    nebulaGrad2.addColorStop(0, 'rgba(100, 60, 160, 0.1)');
    nebulaGrad2.addColorStop(0.6, 'rgba(40, 30, 100, 0.05)');
    nebulaGrad2.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = nebulaGrad2;
    ctx.fillRect(0, 0, cw, ch);
  }

  getFPS(): number {
    return this.fps;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    const game = new Game();
    game.start();
    (window as unknown as { game?: Game }).game = game;
  } catch (err) {
    console.error('Game initialization failed:', err);
  }
});
