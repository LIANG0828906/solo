import { CONFIG } from '../types';

export class BackgroundRenderer {
  private ctx: CanvasRenderingContext2D;
  private farOffset: number = 0;
  private midOffset: number = 0;
  private nearOffset: number = 0;
  private breathingPhase: number = 0;
  private farBuildings: { x: number; width: number; height: number }[] = [];
  private midBuildings: { x: number; width: number; height: number; windows: boolean[] }[] = [];

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    this.generateBuildings();
  }

  private generateBuildings(): void {
    let x = 0;
    while (x < CONFIG.CANVAS_WIDTH * 2) {
      const width = 80 + Math.random() * 120;
      const height = 200 + Math.random() * 400;
      this.farBuildings.push({ x, width, height });
      x += width + Math.random() * 40;
    }

    x = 0;
    while (x < CONFIG.CANVAS_WIDTH * 2) {
      const width = 60 + Math.random() * 100;
      const height = 300 + Math.random() * 500;
      const windows: boolean[] = [];
      const rows = Math.floor(height / 40);
      const cols = Math.floor(width / 25);
      for (let i = 0; i < rows * cols; i++) {
        windows.push(Math.random() > 0.4);
      }
      this.midBuildings.push({ x, width, height, windows });
      x += width + Math.random() * 30;
    }
  }

  update(deltaTime: number, gameSpeed: number): void {
    const dt = deltaTime / 16.67;
    this.farOffset += gameSpeed * 0.2 * dt;
    this.midOffset += gameSpeed * 0.5 * dt;
    this.nearOffset += gameSpeed * dt;
    this.breathingPhase += deltaTime * 0.003;

    if (this.farOffset > CONFIG.CANVAS_WIDTH) this.farOffset -= CONFIG.CANVAS_WIDTH;
    if (this.midOffset > CONFIG.CANVAS_WIDTH) this.midOffset -= CONFIG.CANVAS_WIDTH;
    if (this.nearOffset > 60) this.nearOffset -= 60;
  }

  draw(alertLevel: number): void {
    const ctx = this.ctx;
    const { CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y } = CONFIG;

    const bgGradient = ctx.createRadialGradient(
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 0,
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_HEIGHT
    );
    
    const r = Math.floor(13 + alertLevel * 20);
    const g = Math.floor(13 - alertLevel * 5);
    const b = Math.floor(26 - alertLevel * 10);
    bgGradient.addColorStop(0, `rgb(${r}, ${g}, ${b})`);
    bgGradient.addColorStop(1, '#050508');
    
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const cityHueStart = 270 - alertLevel * 180;
    const cityHueEnd = 300 - alertLevel * 120;

    ctx.save();
    ctx.translate(-this.farOffset, 0);
    this.farBuildings.forEach((b, i) => {
      const x = b.x;
      const hue = cityHueStart + (i / this.farBuildings.length) * 30;
      const sat = 60 + alertLevel * 20;
      const light = 15 + alertLevel * 10;
      
      ctx.fillStyle = `hsl(${hue}, ${sat}%, ${light}%)`;
      ctx.fillRect(x, GROUND_Y - b.height, b.width, b.height);
      
      ctx.fillStyle = `hsl(${hue}, ${sat}%, ${light + 5}%)`;
      ctx.fillRect(x, GROUND_Y - b.height, b.width, 4);
    });
    ctx.restore();

    ctx.save();
    ctx.translate(-this.midOffset, 0);
    this.midBuildings.forEach((b, i) => {
      const x = b.x;
      const hue = cityHueEnd + (i / this.midBuildings.length) * 30;
      const sat = 70 + alertLevel * 20;
      const light = 20 + alertLevel * 10;
      
      ctx.fillStyle = `hsl(${hue}, ${sat}%, ${light}%)`;
      ctx.fillRect(x, GROUND_Y - b.height, b.width, b.height);
      
      ctx.strokeStyle = `hsl(${hue}, 80%, 50%)`;
      ctx.lineWidth = 2;
      ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
      ctx.shadowBlur = 10;
      ctx.strokeRect(x, GROUND_Y - b.height, b.width, b.height);
      ctx.shadowBlur = 0;

      const rows = Math.floor(b.height / 40);
      const cols = Math.floor(b.width / 25);
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (b.windows[row * cols + col]) {
            const wx = x + 5 + col * 25;
            const wy = GROUND_Y - b.height + 10 + row * 40;
            const windowAlpha = 0.3 + Math.random() * 0.7;
            ctx.fillStyle = `rgba(255, 255, 100, ${windowAlpha})`;
            ctx.fillRect(wx, wy, 15, 20);
          }
        }
      }
    });
    ctx.restore();

    const nearGradient = ctx.createLinearGradient(0, GROUND_Y - 100, 0, GROUND_Y);
    nearGradient.addColorStop(0, 'rgba(50, 50, 70, 0)');
    nearGradient.addColorStop(1, 'rgba(50, 50, 70, 1)');
    ctx.fillStyle = nearGradient;
    ctx.fillRect(0, GROUND_Y - 100, CANVAS_WIDTH, 100);

    ctx.fillStyle = '#2a2a3a';
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);

    ctx.strokeStyle = '#444455';
    ctx.lineWidth = 2;
    for (let x = -this.nearOffset; x < CANVAS_WIDTH; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y);
      ctx.lineTo(x, GROUND_Y + 30);
      ctx.stroke();
    }

    ctx.strokeStyle = `rgba(0, 255, 255, ${0.3 + alertLevel * 0.3})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
    ctx.stroke();

    if (alertLevel > 0.3) {
      const alpha = 0.3 + Math.sin(Date.now() * 0.005) * 0.2;
      ctx.fillStyle = `rgba(255, 0, 0, ${alpha * alertLevel})`;
      ctx.fillRect(0, CONFIG.CEILING_Y - 40, CANVAS_WIDTH, 40);
      ctx.fillRect(0, CANVAS_HEIGHT - 40, CANVAS_WIDTH, 40);
    }
  }

  drawSideColumns(): void {
    const ctx = this.ctx;
    const { CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y } = CONFIG;
    const breathing = 0.3 + Math.sin(this.breathingPhase) * 0.1;

    const colGradient = ctx.createLinearGradient(0, 0, 60, 0);
    colGradient.addColorStop(0, `rgba(30, 30, 40, ${breathing})`);
    colGradient.addColorStop(1, `rgba(50, 50, 60, ${breathing * 0.8})`);

    ctx.fillStyle = colGradient;
    ctx.fillRect(0, 0, 60, CANVAS_HEIGHT);
    ctx.fillRect(CANVAS_WIDTH - 60, 0, 60, CANVAS_HEIGHT);

    ctx.strokeStyle = `rgba(0, 255, 255, ${breathing * 0.5})`;
    ctx.lineWidth = 2;
    for (let y = 40; y < GROUND_Y; y += 30) {
      ctx.beginPath();
      ctx.moveTo(5, y);
      ctx.lineTo(55, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(CANVAS_WIDTH - 55, y);
      ctx.lineTo(CANVAS_WIDTH - 5, y);
      ctx.stroke();
    }

    ctx.strokeStyle = `rgba(255, 0, 255, ${breathing * 0.8})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(60, 0);
    ctx.lineTo(60, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH - 60, 0);
    ctx.lineTo(CANVAS_WIDTH - 60, CANVAS_HEIGHT);
    ctx.stroke();
  }
}
