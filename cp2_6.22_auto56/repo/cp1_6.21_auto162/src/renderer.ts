import { GameState, Card } from './gameLogic';
import { ParticleSystem } from './particleSystem';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private icons: Map<number, (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => void> = new Map();
  private prevMatchState: Map<number, boolean> = new Map();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('无法获取Canvas 2D上下文');
    this.ctx = ctx;
    this.initIcons();
    this.resize();
  }

  resize(): void {
    const gridSize = GameState.GRID_SIZE;
    const cardSize = GameState.CARD_SIZE;
    const gap = GameState.CARD_GAP;
    const padding = 0;

    const width = gridSize * cardSize + (gridSize - 1) * gap + padding * 2;
    const height = gridSize * cardSize + (gridSize - 1) * gap + padding * 2;

    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
  }

  private initIcons(): void {
    const colors = [
      '#EF4444', '#F97316', '#F59E0B', '#EAB308',
      '#84CC16', '#22C55E', '#10B981', '#14B8A6',
      '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
      '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
      '#F43F5E', '#FB923C', '#FDE047', '#4ADE80',
      '#2DD4BF', '#38BDF8', '#818CF8', '#C084FC',
      '#F472B6', '#F87171', '#FBBF24', '#A3E635',
      '#22D3EE', '#818CF8', '#A78BFA', '#F0ABFC'
    ];

    const iconCreators: Array<(color: string) => (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => void> = [
      (color) => this.createStarIcon(color),
      (color) => this.createHeartIcon(color),
      (color) => this.createDiamondIcon(color),
      (color) => this.createCircleIcon(color),
      (color) => this.createTriangleIcon(color),
      (color) => this.createHexagonIcon(color),
      (color) => this.createMoonIcon(color),
      (color) => this.createSunIcon(color),
      (color) => this.createLightningIcon(color),
      (color) => this.createLeafIcon(color),
      (color) => this.createFlowerIcon(color),
      (color) => this.createCloudIcon(color),
      (color) => this.createMusicIcon(color),
      (color) => this.createCrownIcon(color),
      (color) => this.createGemIcon(color),
      (color) => this.createRocketIcon(color),
      (color) => this.createFishIcon(color),
      (color) => this.createBirdIcon(color),
      (color) => this.createTreeIcon(color),
      (color) => this.createMountainIcon(color),
      (color) => this.createWaveIcon(color),
      (color) => this.createFireIcon(color),
      (color) => this.createSnowflakeIcon(color),
      (color) => this.createRainbowIcon(color),
      (color) => this.createKeyIcon(color),
      (color) => this.createLockIcon(color),
      (color) => this.createGiftIcon(color),
      (color) => this.createBalloonIcon(color),
      (color) => this.createPuzzleIcon(color),
      (color) => this.createTargetIcon(color),
      (color) => this.createZapIcon(color),
      (color) => this.createSparklesIcon(color)
    ];

    for (let i = 0; i < 32; i++) {
      this.icons.set(i, iconCreators[i % iconCreators.length](colors[i % colors.length]));
    }
  }

  private easeOut(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  render(gameState: GameState, particleSystem: ParticleSystem): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const sortedCards = [...gameState.cards].sort((a, b) => {
      const aDepth = this.getCardDepth(a);
      const bDepth = this.getCardDepth(b);
      return aDepth - bDepth;
    });

    for (const card of sortedCards) {
      if (card.state !== 'matched') {
        this.drawCard(card);
      }
    }

    for (const card of gameState.cards) {
      if (card.state === 'matched') {
        this.drawCard(card);
      }
    }

    particleSystem.draw(ctx);
  }

  private getCardDepth(card: Card): number {
    if (card.state === 'matched') return 2;
    if (card.state === 'matching') return 1;
    return 0;
  }

  private getCardPosition(gridIndex: number): { x: number; y: number } {
    const row = Math.floor(gridIndex / GameState.GRID_SIZE);
    const col = gridIndex % GameState.GRID_SIZE;
    const cardSize = GameState.CARD_SIZE;
    const gap = GameState.CARD_GAP;

    return {
      x: col * (cardSize + gap),
      y: row * (cardSize + gap)
    };
  }

  private drawCard(card: Card): void {
    const ctx = this.ctx;
    const pos = this.getCardPosition(card.gridIndex);
    const cardSize = GameState.CARD_SIZE;
    const centerX = pos.x + cardSize / 2;
    const centerY = pos.y + cardSize / 2;

    const offsetX = card.shakeOffset || 0;
    const scale = card.matchScale !== undefined ? card.matchScale : 1;

    if (scale <= 0) return;

    const flipProgress = card.flipProgress || 0;
    const easedProgress = this.easeOut(Math.min(1, Math.max(0, flipProgress)));
    const scaleX = Math.cos(easedProgress * Math.PI);

    ctx.save();
    ctx.translate(centerX + offsetX, centerY);
    ctx.scale(scale, scale);
    ctx.translate(-(centerX + offsetX), -centerY);

    if (scaleX >= 0) {
      this.drawCardBack(pos.x, pos.y, cardSize);
    } else {
      this.drawCardFront(pos.x, pos.y, cardSize, card.iconIndex);
    }

    ctx.restore();
  }

  private drawCardBack(x: number, y: number, size: number): void {
    const ctx = this.ctx;
    const radius = 16;

    this.roundRect(ctx, x, y, size, size, radius);
    const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
    gradient.addColorStop(0, '#4C1D95');
    gradient.addColorStop(1, '#5B21B6');
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = '#8B5CF6';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    this.roundRect(ctx, x, y, size, size, radius);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#A78BFA';
    ctx.font = `bold ${size * 0.5}px 'Segoe UI', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', x + size / 2, y + size / 2);
  }

  private drawCardFront(x: number, y: number, size: number, iconIndex: number): void {
    const ctx = this.ctx;
    const radius = 16;

    this.roundRect(ctx, x, y, size, size, radius);
    const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
    gradient.addColorStop(0, '#F8FAFC');
    gradient.addColorStop(1, '#E2E8F0');
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 2;
    this.roundRect(ctx, x, y, size, size, radius);
    ctx.stroke();

    const drawIcon = this.icons.get(iconIndex);
    if (drawIcon) {
      const iconSize = 80;
      const iconX = x + (size - iconSize) / 2;
      const iconY = y + (size - iconSize) / 2;
      drawIcon(ctx, iconX, iconY, iconSize);
    }
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
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

  checkForMatchParticles(gameState: GameState, particleSystem: ParticleSystem): void {
    for (const card of gameState.cards) {
      const wasMatching = this.prevMatchState.get(card.id) || false;
      const isMatching = card.state === 'matching';

      if (isMatching && !wasMatching) {
        const pos = this.getCardPosition(card.gridIndex);
        const centerX = pos.x + GameState.CARD_SIZE / 2;
        const centerY = pos.y + GameState.CARD_SIZE / 2;
        particleSystem.emitGoldBurst(centerX, centerY);
      }

      this.prevMatchState.set(card.id, isMatching);
    }
  }

  clearMatchState(): void {
    this.prevMatchState.clear();
  }

  getGridIndexAt(x: number, y: number): number {
    const rect = this.canvas.getBoundingClientRect();
    const canvasX = x - rect.left;
    const canvasY = y - rect.top;

    const cardSize = GameState.CARD_SIZE;
    const gap = GameState.CARD_GAP;
    const totalSize = cardSize + gap;

    const col = Math.floor(canvasX / totalSize);
    const row = Math.floor(canvasY / totalSize);

    if (col < 0 || col >= GameState.GRID_SIZE || row < 0 || row >= GameState.GRID_SIZE) {
      return -1;
    }

    const cellX = col * totalSize;
    const cellY = row * totalSize;
    const localX = canvasX - cellX;
    const localY = canvasY - cellY;

    if (localX > cardSize || localY > cardSize) {
      return -1;
    }

    return row * GameState.GRID_SIZE + col;
  }

  private createStarIcon(color: string) {
    return (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      ctx.save();
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      const cx = x + size / 2;
      const cy = y + size / 2;
      const spikes = 5;
      const outerRadius = size * 0.45;
      const innerRadius = size * 0.2;
      for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (Math.PI * i) / spikes - Math.PI / 2;
        const px = cx + Math.cos(angle) * radius;
        const py = cy + Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };
  }

  private createHeartIcon(color: string) {
    return (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      ctx.save();
      ctx.fillStyle = color;
      ctx.beginPath();
      const cx = x + size / 2;
      const cy = y + size * 0.55;
      const w = size * 0.8;
      const h = size * 0.7;
      ctx.moveTo(cx, cy + h * 0.4);
      ctx.bezierCurveTo(cx - w * 0.5, cy, cx - w * 0.5, cy - h * 0.4, cx, cy - h * 0.1);
      ctx.bezierCurveTo(cx + w * 0.5, cy - h * 0.4, cx + w * 0.5, cy, cx, cy + h * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };
  }

  private createDiamondIcon(color: string) {
    return (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      ctx.save();
      ctx.fillStyle = color;
      ctx.beginPath();
      const cx = x + size / 2;
      const cy = y + size / 2;
      ctx.moveTo(cx, y + size * 0.08);
      ctx.lineTo(x + size * 0.92, cy);
      ctx.lineTo(cx, y + size * 0.92);
      ctx.lineTo(x + size * 0.08, cy);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };
  }

  private createCircleIcon(color: string) {
    return (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      ctx.save();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size * 0.38, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };
  }

  private createTriangleIcon(color: string) {
    return (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      ctx.save();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x + size / 2, y + size * 0.1);
      ctx.lineTo(x + size * 0.92, y + size * 0.88);
      ctx.lineTo(x + size * 0.08, y + size * 0.88);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };
  }

  private createHexagonIcon(color: string) {
    return (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      ctx.save();
      ctx.fillStyle = color;
      ctx.beginPath();
      const cx = x + size / 2;
      const cy = y + size / 2;
      const radius = size * 0.4;
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const px = cx + Math.cos(angle) * radius;
        const py = cy + Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };
  }

  private createMoonIcon(color: string) {
    return (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      ctx.save();
      ctx.fillStyle = color;
      ctx.beginPath();
      const cx = x + size * 0.55;
      const cy = y + size / 2;
      ctx.arc(cx, cy, size * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(cx - size * 0.15, cy - size * 0.08, size * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };
  }

  private createSunIcon(color: string) {
    return (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      ctx.save();
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      const cx = x + size / 2;
      const cy = y + size / 2;
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI / 4) * i;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * size * 0.25, cy + Math.sin(angle) * size * 0.25);
        ctx.lineTo(cx + Math.cos(angle) * size * 0.45, cy + Math.sin(angle) * size * 0.45);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };
  }

  private createLightningIcon(color: string) {
    return (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      ctx.save();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x + size * 0.6, y + size * 0.05);
      ctx.lineTo(x + size * 0.25, y + size * 0.5);
      ctx.lineTo(x + size * 0.48, y + size * 0.5);
      ctx.lineTo(x + size * 0.35, y + size * 0.95);
      ctx.lineTo(x + size * 0.75, y + size * 0.42);
      ctx.lineTo(x + size * 0.52, y + size * 0.42);
      ctx.lineTo(x + size * 0.65, y + size * 0.05);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };
  }

  private createLeafIcon(color: string) {
    return (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      ctx.save();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x + size * 0.1, y + size * 0.9);
      ctx.quadraticCurveTo(x + size * 0.1, y + size * 0.1, x + size * 0.9, y + size * 0.1);
      ctx.quadraticCurveTo(x + size * 0.9, y + size * 0.9, x + size * 0.1, y + size * 0.9);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + size * 0.1, y + size * 0.9);
      ctx.lineTo(x + size * 0.75, y + size * 0.25);
      ctx.stroke();
      ctx.restore();
    };
  }

  private createFlowerIcon(color: string) {
    return (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      ctx.save();
      ctx.fillStyle = color;
      const cx = x + size / 2;
      const cy = y + size / 2;
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const px = cx + Math.cos(angle) * size * 0.2;
        const py = cy + Math.sin(angle) * size * 0.2;
        ctx.beginPath();
        ctx.arc(px, py, size * 0.16, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#FDE047';
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.14, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };
  }

  private createCloudIcon(color: string) {
    return (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      ctx.save();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x + size * 0.28, y + size * 0.6, size * 0.22, 0, Math.PI * 2);
      ctx.arc(x + size * 0.5, y + size * 0.45, size * 0.28, 0, Math.PI * 2);
      ctx.arc(x + size * 0.72, y + size * 0.6, size * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.rect(x + size * 0.12, y + size * 0.55, size * 0.76, size * 0.25);
      ctx.fill();
      ctx.restore();
    };
  }

  private createMusicIcon(color: string) {
    return (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      ctx.save();
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x + size * 0.55, y + size * 0.18);
      ctx.lineTo(x + size * 0.55, y + size * 0.72);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(x + size * 0.4, y + size * 0.72, size * 0.15, size * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + size * 0.55, y + size * 0.25);
      ctx.lineTo(x + size * 0.85, y + size * 0.15);
      ctx.lineTo(x + size * 0.85, y + size * 0.65);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(x + size * 0.7, y + size * 0.65, size * 0.15, size * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };
  }

  private createCrownIcon(color: string) {
    return (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      ctx.save();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x + size * 0.1, y + size * 0.8);
      ctx.lineTo(x + size * 0.2, y + size * 0.3);
      ctx.lineTo(x + size * 0.4, y + size * 0.55);
      ctx.lineTo(x + size * 0.5, y + size * 0.2);
      ctx.lineTo(x + size * 0.6, y + size * 0.55);
      ctx.lineTo(x + size * 0.8, y + size * 0.3);
      ctx.lineTo(x + size * 0.9, y + size * 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(x + size * 0.5, y + size * 0.32, size * 0.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3B82F6';
      ctx.beginPath();
      ctx.arc(x + size * 0.25, y + size * 0.45, size * 0.045, 0, Math.PI * 2);
      ctx.arc(x + size * 0.75, y + size * 0.45, size * 0.045, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };
  }

  private createGemIcon(color: string) {
    return (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      ctx.save();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x + size * 0.2, y + size * 0.35);
      ctx.lineTo(x + size * 0.5, y + size * 0.08);
      ctx.lineTo(x + size * 0.8, y + size * 0.35);
      ctx.lineTo(x + size * 0.65, y + size * 0.9);
      ctx.lineTo(x + size * 0.35, y + size * 0.9);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + size * 0.2, y + size * 0.35);
      ctx.lineTo(x + size * 0.5, y + size * 0.08);
      ctx.lineTo(x + size * 0.8, y + size * 0.35);
      ctx.stroke();
      ctx.restore();
    };
  }

  private createRocketIcon(color: string) {
    return (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      ctx.save();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x + size * 0.5, y + size * 0.05);
      ctx.quadraticCurveTo(x + size * 0.75, y + size * 0.25, x + size * 0.7, y + size * 0.6);
      ctx.lineTo(x + size * 0.3, y + size * 0.6);
      ctx.quadraticCurveTo(x + size * 0.25, y + size * 0.25, x + size * 0.5, y + size * 0.05);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#F97316';
      ctx.beginPath();
      ctx.moveTo(x + size * 0.35, y + size * 0.6);
      ctx.lineTo(x + size * 0.5, y + size * 0.9);
      ctx.lineTo(x + size * 0.65, y + size * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#F1F5F9';
      ctx.beginPath();
      ctx.arc(x + size * 0.5, y + size * 0.32, size * 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };
  }

  private createFishIcon(color: string) {
    return (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      ctx.save();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(x + size * 0.42, y + size * 0.5, size * 0.32, size * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + size * 0.12, y + size * 0.5);
      ctx.lineTo(x + size * 0, y + size * 0.25);
      ctx.lineTo(x + size * 0, y + size * 0.75);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(x + size * 0.58, y + size * 0.42, size * 0.07, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.arc(x + size * 0.6, y + size * 0.42, size * 0.035, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };
  }

  private createBirdIcon(color: string) {
    return (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      ctx.save();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(x + size * 0.55, y + size * 0.55, size * 0.28, size * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + size * 0.72, y + size * 0.4, size * 0.14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#F97316';
      ctx.beginPath();
      ctx.moveTo(x + size * 0.86, y + size * 0.4);
      ctx.lineTo(x + size * 1.0, y + size * 0.38);
      ctx.lineTo(x + size * 0.86, y + size * 0.46);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.arc(x + size * 0.76, y + size * 0.38, size * 0.028, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(x + size * 0.35, y + size * 0.5, size * 0.2, size * 0.1, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };
  }

  private createTreeIcon(color: string) {
    return (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      ctx.save();
      ctx.fillStyle = '#92400E';
      ctx.fillRect(x + size * 0.44, y + size * 0.6, size * 0.12, size * 0.32);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x + size * 0.5, y + size * 0.05);
      ctx.lineTo(x + size * 0.2, y + size * 0.45);
      ctx.lineTo(x + size * 0.35, y + size * 0.45);
      ctx.lineTo(x + size * 0.15, y + size * 0.65);
      ctx.lineTo(x + size * 0.85, y + size * 0.65);
      ctx.lineTo(x + size * 0.65, y + size * 0.45);
      ctx.lineTo(x + size * 0.8, y + size * 0.45);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };
  }

  private createMountainIcon(color: string) {
    return (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      ctx.save();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x + size * 0.1, y + size * 0.9);
      ctx.lineTo(x + size * 0.4, y + size * 0.2);
      ctx.lineTo(x + size * 0.55, y + size * 0.5);
      ctx.lineTo(x + size * 0.7, y + size * 0.25);
      ctx.lineTo(x + size * 0.9, y + size * 0.9);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.moveTo(x + size * 0.32, y + size * 0.4);
      ctx.lineTo(x + size * 0.4, y + size * 0.2);
      ctx.lineTo(x + size * 0.48, y + size * 0.42);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };
  }

  private createWaveIcon(color: string) {
    return (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      ctx.save();
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        const yOffset = y + size * (0.25 + i * 0.25);
        ctx.moveTo(x + size * 0.1, yOffset);
        ctx.quadraticCurveTo(x + size * 0.3, yOffset - size * 0.12, x + size * 0.5, yOffset);
        ctx.quadraticCurveTo(x + size * 0.7, yOffset + size * 0.12, x + size * 0.9, yOffset);
        ctx.stroke();
      }
      ctx.restore();
    };
  }

  private createFireIcon(color: string) {
    return (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      ctx.save();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x + size * 0.5, y + size * 0.05);
      ctx.quadraticCurveTo(x + size * 0.7, y + size * 0.3, x + size * 0.65, y + size * 0.5);
      ctx.quadraticCurveTo(x + size * 0.85, y + size * 0.4, x + size * 0.75, y + size * 0.75);
      ctx.quadraticCurveTo(x + size * 0.5, y + size * 0.95, x + size * 0.25, y + size * 0.75);
      ctx.quadraticCurveTo(x + size * 0.15, y + size * 0.4, x + size * 0.35, y + size * 0.5);
      ctx.quadraticCurveTo(x + size * 0.3, y + size * 0.3, x + size * 0.5, y + size * 0.05);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#FDE047';
      ctx.beginPath();
      ctx.ellipse(x + size * 0.5, y + size * 0.65, size * 0.15, size * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };
  }

  private createSnowflakeIcon(color: string) {
    return (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      const cx = x + size / 2;
      const cy = y + size / 2;
      const r = size * 0.38;
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
        ctx.stroke();
        const branchAngle1 = angle + Math.PI / 6;
        const branchAngle2 = angle - Math.PI / 6;
        const branchLen = r * 0.35;
        const midX = cx + Math.cos(angle) * r * 0.55;
        const midY = cy + Math.sin(angle) * r * 0.55;
        ctx.beginPath();
        ctx.moveTo(midX, midY);
        ctx.lineTo(midX + Math.cos(branchAngle1) * branchLen, midY + Math.sin(branchAngle1) * branchLen);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(midX, midY);
        ctx.lineTo(midX + Math.cos(branchAngle2) * branchLen, midY + Math.sin(branchAngle2) * branchLen);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.06, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };
  }

  private createRainbowIcon(color: string) {
    return (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      ctx.save();
      const colors = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6'];
      const cx = x + size / 2;
      const cy = y + size * 0.85;
      for (let i = 0; i < colors.length; i++) {
        ctx.strokeStyle = colors[i];
        ctx.lineWidth = size * 0.06;
        ctx.beginPath();
        ctx.arc(cx, cy, size * (0.38 - i * 0.065), Math.PI, 0);
        ctx.stroke();
      }
      ctx.restore();
    };
  }

  private createKeyIcon(color: string) {
    return (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      ctx.save();
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x + size * 0.3, y + size * 0.3, size * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#F8FAFC';
      ctx.beginPath();
      ctx.arc(x + size * 0.3, y + size * 0.3, size * 0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.fillRect(x + size * 0.45, y + size * 0.27, size * 0.4, size * 0.06);
      ctx.fillRect(x + size * 0.72, y + size * 0.33, size * 0.06, size * 0.12);
      ctx.fillRect(x + size * 0.6, y + size * 0.33, size * 0.06, size * 0.1);
      ctx.restore();
    };
  }

  private createLockIcon(color: string) {
    return (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      ctx.save();
      ctx.fillStyle = color;
      ctx.fillRect(x + size * 0.2, y + size * 0.4, size * 0.6, size * 0.45);
      ctx.strokeStyle = color;
      ctx.lineWidth = size * 0.07;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(x + size * 0.5, y + size * 0.4, size * 0.18, Math.PI, 0);
      ctx.stroke();
      ctx.fillStyle = '#F8FAFC';
      ctx.beginPath();
      ctx.arc(x + size * 0.5, y + size * 0.62, size * 0.06, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x + size * 0.47, y + size * 0.62, size * 0.06, size * 0.12);
      ctx.restore();
    };
  }

  private createGiftIcon(color: string) {
    return (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      ctx.save();
      ctx.fillStyle = color;
      ctx.fillRect(x + size * 0.1, y + size * 0.38, size * 0.8, size * 0.5);
      ctx.fillStyle = '#EC4899';
      ctx.fillRect(x + size * 0.46, y + size * 0.38, size * 0.08, size * 0.5);
      ctx.fillStyle = color;
      ctx.fillRect(x + size * 0.05, y + size * 0.28, size * 0.9, size * 0.15);
      ctx.fillStyle = '#EC4899';
      ctx.fillRect(x + size * 0.46, y + size * 0.28, size * 0.08, size * 0.15);
      ctx.beginPath();
      ctx.ellipse(x + size * 0.35, y + size * 0.2, size * 0.14, size * 0.12, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + size * 0.65, y + size * 0.2, size * 0.14, size * 0.12, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };
  }

  private createBalloonIcon(color: string) {
    return (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      ctx.save();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(x + size * 0.5, y + size * 0.38, size * 0.28, size * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + size * 0.5, y + size * 0.68);
      ctx.lineTo(x + size * 0.46, y + size * 0.75);
      ctx.lineTo(x + size * 0.54, y + size * 0.75);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + size * 0.5, y + size * 0.75);
      ctx.quadraticCurveTo(x + size * 0.6, y + size * 0.82, x + size * 0.42, y + size * 0.95);
      ctx.stroke();
      ctx.restore();
    };
  }

  private createPuzzleIcon(color: string) {
    return (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      ctx.save();
      ctx.fillStyle = color;
      const p = size * 0.12;
      ctx.beginPath();
      ctx.moveTo(x + p, y + p * 2);
      ctx.lineTo(x + size * 0.4, y + p * 2);
      ctx.arc(x + size * 0.4, y + p, p, Math.PI, 0, false);
      ctx.arc(x + size * 0.5, y + p, p * 0.6, 0, Math.PI * 2, true);
      ctx.arc(x + size * 0.6, y + p, p, Math.PI, 0, false);
      ctx.lineTo(x + size - p, y + p * 2);
      ctx.lineTo(x + size - p, y + size * 0.4);
      ctx.arc(x + size - p * 2, y + size * 0.4, p, -Math.PI / 2, Math.PI / 2, false);
      ctx.arc(x + size - p * 2, y + size * 0.5, p * 0.6, 0, Math.PI * 2, true);
      ctx.arc(x + size - p * 2, y + size * 0.6, p, -Math.PI / 2, Math.PI / 2, false);
      ctx.lineTo(x + size - p, y + size - p);
      ctx.lineTo(x + p * 2, y + size - p);
      ctx.arc(x + p * 2, y + size - p * 2, p, Math.PI / 2, -Math.PI / 2, false);
      ctx.arc(x + p, y + size - p * 2, p * 0.6, 0, Math.PI * 2, true);
      ctx.lineTo(x + p, y + size - p * 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };
  }

  private createTargetIcon(color: string) {
    return (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      ctx.save();
      const cx = x + size / 2;
      const cy = y + size / 2;
      const colors = ['#EF4444', '#F8FAFC', '#EF4444', '#F8FAFC', '#EF4444'];
      for (let i = 0; i < colors.length; i++) {
        ctx.fillStyle = colors[i];
        ctx.beginPath();
        ctx.arc(cx, cy, size * (0.42 - i * 0.08), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };
  }

  private createZapIcon(color: string) {
    return (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      ctx.save();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x + size * 0.55, y + size * 0.05);
      ctx.lineTo(x + size * 0.25, y + size * 0.5);
      ctx.lineTo(x + size * 0.45, y + size * 0.5);
      ctx.lineTo(x + size * 0.35, y + size * 0.95);
      ctx.lineTo(x + size * 0.75, y + size * 0.45);
      ctx.lineTo(x + size * 0.55, y + size * 0.45);
      ctx.lineTo(x + size * 0.65, y + size * 0.05);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };
  }

  private createSparklesIcon(color: string) {
    return (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      ctx.save();
      ctx.fillStyle = color;
      const points = [
        { cx: 0.5, cy: 0.5, r: 0.28 },
        { cx: 0.2, cy: 0.25, r: 0.12 },
        { cx: 0.8, cy: 0.3, r: 0.1 },
        { cx: 0.25, cy: 0.75, r: 0.09 },
        { cx: 0.78, cy: 0.72, r: 0.11 }
      ];
      for (const pt of points) {
        const cx = x + size * pt.cx;
        const cy = y + size * pt.cy;
        const r = size * pt.r;
        ctx.beginPath();
        ctx.moveTo(cx, cy - r);
        ctx.lineTo(cx - r * 0.15, cy - r * 0.15);
        ctx.lineTo(cx - r, cy);
        ctx.lineTo(cx - r * 0.15, cy + r * 0.15);
        ctx.lineTo(cx, cy + r);
        ctx.lineTo(cx + r * 0.15, cy + r * 0.15);
        ctx.lineTo(cx + r, cy);
        ctx.lineTo(cx + r * 0.15, cy - r * 0.15);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    };
  }
}
