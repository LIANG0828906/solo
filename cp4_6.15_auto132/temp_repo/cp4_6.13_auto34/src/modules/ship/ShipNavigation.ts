import { useGameStore } from '../../store/gameStore';

export interface BubbleParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  alpha: number;
}

export class ShipNavigation {
  private bubbles: BubbleParticle[] = [];
  private nextBubbleId: number = 0;
  private lastSpawnTime: number = 0;
  private canvasCtx: CanvasRenderingContext2D | null = null;
  private animFrameId: number | null = null;
  private isRunning: boolean = false;
  private onBubbleUpdate: (() => void) | null = null;

  public setCanvasContext(ctx: CanvasRenderingContext2D | null): void {
    this.canvasCtx = ctx;
  }

  public setUpdateCallback(callback: () => void): void {
    this.onBubbleUpdate = callback;
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastSpawnTime = performance.now();
    this.animationLoop();
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public getBubbles(): BubbleParticle[] {
    return this.bubbles;
  }

  private animationLoop = (): void => {
    if (!this.isRunning) return;

    const now = performance.now();
    const dt = (now - this.lastSpawnTime) / 1000;

    if (useGameStore.getState().gameView === 'diving' && useGameStore.getState().engineStarted) {
      if (dt > 0.03) {
        this.spawnBubble();
        this.lastSpawnTime = now;
      }
    }

    this.updateBubbles();

    if (this.onBubbleUpdate) {
      this.onBubbleUpdate();
    }

    this.animFrameId = requestAnimationFrame(this.animationLoop);
  };

  private spawnBubble(): void {
    const state = useGameStore.getState();
    if (state.gameView !== 'diving') return;

    const canvas = this.canvasCtx?.canvas;
    if (!canvas) return;

    const subX = canvas.width * 0.3;
    const subY = canvas.height * (1 - state.depth / state.maxDepth);

    const bubble: BubbleParticle = {
      id: this.nextBubbleId++,
      x: subX + 20 + Math.random() * 10,
      y: subY + Math.random() * 40,
      vx: (Math.random() - 0.5) * 8,
      vy: 15 + Math.random() * 15,
      life: 0,
      maxLife: 1.5 + Math.random() * 1.5,
      size: 2 + Math.random() * 5,
      alpha: 0.7,
    };

    this.bubbles.push(bubble);
  }

  private updateBubbles(): void {
    const dt = 1 / 60;
    this.bubbles = this.bubbles.filter((bubble) => {
      bubble.life += dt;
      if (bubble.life >= bubble.maxLife) return false;

      bubble.x += bubble.vx * dt;
      bubble.y += bubble.vy * dt;
      bubble.vx *= 0.98;

      const lifeRatio = bubble.life / bubble.maxLife;
      bubble.alpha = 0.7 * (1 - lifeRatio);
      bubble.size += dt * 0.5;

      return true;
    });
  }

  public render(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    this.canvasCtx = ctx;

    const w = canvas.width;
    const h = canvas.height;
    const state = useGameStore.getState();

    ctx.clearRect(0, 0, w, h);

    const depthRatio = state.depth / state.maxDepth;
    const bgGradient = ctx.createLinearGradient(0, 0, 0, h);
    bgGradient.addColorStop(0, '#0a192f');
    bgGradient.addColorStop(0.5, '#062547');
    bgGradient.addColorStop(1, '#020e1f');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    for (let i = 0; i < 30; i++) {
      const px = (i * 137 + state.depth * 2) % w;
      const py = (i * 89) % h;
      ctx.fillStyle = `rgba(100, 255, 218, ${0.03 + (i % 3) * 0.01})`;
      ctx.beginPath();
      ctx.arc(px, py, 1 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    const subY = h * (1 - depthRatio);
    const subX = w * 0.3;

    this.drawSubmarine(ctx, subX, subY, depthRatio);

    this.drawSeaFloor(ctx, w, h);
    this.drawSurface(ctx, w, h);
    this.drawDeepCreatures(ctx, w, h, state.depth);
    this.drawBubbles(ctx);
    this.drawDepthMarkers(ctx, w, h, state.maxDepth);
  }

  private drawSubmarine(ctx: CanvasRenderingContext2D, x: number, y: number, depthRatio: number): void {
    ctx.save();
    ctx.translate(x, y);

    ctx.shadowColor = '#64ffda';
    ctx.shadowBlur = 15 + Math.sin(Date.now() / 500) * 5;

    ctx.fillStyle = '#4a5568';
    ctx.strokeStyle = '#64ffda';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.ellipse(0, 0, 60, 25, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;

    ctx.fillStyle = '#2d3748';
    ctx.beginPath();
    ctx.moveTo(-20, -15);
    ctx.lineTo(10, -25);
    ctx.lineTo(20, -15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const windowPositions = [
      { cx: -25, cy: 0 },
      { cx: 0, cy: 0 },
      { cx: 25, cy: 0 },
    ];
    for (const wp of windowPositions) {
      const glowIntensity = 0.5 + Math.sin(Date.now() / 400 + wp.cx) * 0.3;
      ctx.fillStyle = `rgba(100, 255, 218, ${glowIntensity})`;
      ctx.beginPath();
      ctx.arc(wp.cx, wp.cy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#88ccff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.fillStyle = depthRatio > 0.5 ? '#ff6b6b' : '#f6ad55';
    ctx.beginPath();
    ctx.moveTo(-60, -8);
    ctx.lineTo(-75, 0);
    ctx.lineTo(-60, 8);
    ctx.closePath();
    ctx.fill();

    if (useGameStore.getState().engineStarted) {
      const pulseAlpha = 0.3 + Math.sin(Date.now() / 100) * 0.2;
      ctx.fillStyle = `rgba(255, 150, 50, ${pulseAlpha})`;
      ctx.beginPath();
      ctx.ellipse(-72, 0, 8, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#718096';
    ctx.fillRect(10, -28, 6, 10);
    ctx.strokeRect(10, -28, 6, 10);

    ctx.restore();
  }

  private drawSeaFloor(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.save();
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.moveTo(0, h - 5);
    for (let x = 0; x <= w; x += 20) {
      const y = h - 5 - Math.sin(x * 0.05) * 8 - ((x / w) * 30);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#2d1f3d';
    for (let i = 0; i < 8; i++) {
      const rx = (i * 83) % w;
      const ry = h - 3 - Math.random() * 5;
      ctx.beginPath();
      ctx.arc(rx, ry, 3 + Math.random() * 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawSurface(ctx: CanvasRenderingContext2D, w: number, _h: number): void {
    ctx.save();
    const time = Date.now() / 1000;
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 8);
    for (let x = 0; x <= w; x += 5) {
      const y = 8 + Math.sin(x * 0.03 + time) * 4;
      ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.strokeStyle = 'rgba(100, 255, 218, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 15);
    for (let x = 0; x <= w; x += 5) {
      const y = 15 + Math.sin(x * 0.02 + time * 0.7) * 3;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  private drawDeepCreatures(ctx: CanvasRenderingContext2D, w: number, h: number, depth: number): void {
    if (depth < 30) return;

    ctx.save();
    const time = Date.now() / 1000;
    const opacity = Math.min(1, (depth - 30) / 100);

    const fishY = h * 0.6 + Math.sin(time) * 30;
    const fishX = (w * 0.7 + Math.sin(time * 0.3) * 50) % w;

    ctx.globalAlpha = opacity * 0.6;
    ctx.fillStyle = '#4299e1';
    ctx.beginPath();
    ctx.ellipse(fishX, fishY, 12, 6, Math.sin(time * 2) * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(fishX - 12, fishY);
    ctx.lineTo(fishX - 20, fishY - 5);
    ctx.lineTo(fishX - 20, fishY + 5);
    ctx.closePath();
    ctx.fill();

    if (depth > 80) {
      ctx.globalAlpha = opacity * 0.4;
      const jy = h * 0.8;
      const jx = (w * 0.85 + Math.cos(time * 0.5) * 40) % w;

      ctx.fillStyle = '#9f7aea';
      ctx.beginPath();
      ctx.arc(jx, jy, 8, Math.PI, 0, false);
      for (let t = 0; t < 4; t++) {
        const tentacleX = jx - 6 + t * 4;
        ctx.moveTo(tentacleX, jy);
        ctx.quadraticCurveTo(
          tentacleX + Math.sin(time * 2 + t) * 5,
          jy + 10,
          tentacleX,
          jy + 20
        );
      }
      ctx.strokeStyle = '#9f7aea';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawBubbles(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    for (const bubble of this.bubbles) {
      ctx.globalAlpha = bubble.alpha;
      ctx.strokeStyle = `rgba(150, 220, 255, ${bubble.alpha})`;
      ctx.fillStyle = `rgba(180, 230, 255, ${bubble.alpha * 0.3})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawDepthMarkers(ctx: CanvasRenderingContext2D, w: number, h: number, maxDepth: number): void {
    ctx.save();
    ctx.fillStyle = 'rgba(100, 255, 218, 0.6)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'right';

    const markers = [0, 50, 100, 150, 200];
    for (const marker of markers) {
      if (marker > maxDepth) continue;
      const y = h * (1 - marker / maxDepth);
      ctx.fillText(`${marker}m`, w - 10, y + 4);
      ctx.strokeStyle = 'rgba(100, 255, 218, 0.15)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(w - 55, y);
      ctx.lineTo(0, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  public ascend(): void {
    const state = useGameStore.getState();
    if (state.gameView !== 'diving') return;
    const newDepth = state.depth - 5;
    state.setDepth(newDepth);
    state.consumeOxygen(0.3);
    if (state.pressure > 0) {
      state.setPressure(state.pressure - 1);
    }
  }

  public descend(): void {
    const state = useGameStore.getState();
    if (state.gameView !== 'diving') return;
    const newDepth = state.depth + 5;
    state.setDepth(newDepth);

    let oxygenCost = 0.5;
    if (newDepth > 50) {
      oxygenCost = 1.0;
      state.setPressure(state.pressure + 2);
    }
    state.consumeOxygen(oxygenCost);
  }

  public getDepthPercentage(): number {
    const state = useGameStore.getState();
    return (state.depth / state.maxDepth) * 100;
  }

  public getOxygenPercentage(): number {
    const state = useGameStore.getState();
    return (state.oxygen / state.maxOxygen) * 100;
  }

  public getPressurePercentage(): number {
    const state = useGameStore.getState();
    return (state.pressure / state.maxPressure) * 100;
  }
}

export const shipNavigation = new ShipNavigation();
