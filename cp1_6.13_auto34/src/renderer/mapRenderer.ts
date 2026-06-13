import { eventBus } from '../events/eventBus';
import { ecosystem, GRID_SIZE, Animal, PredationEvent } from '../core/ecosystem';
import confetti from 'canvas-confetti';

const COLORS = {
  grass: '#7ec850',
  berry: '#c25a8a',
  water: '#3a8bb5',
  empty: '#8b5e3c',
  gridLine: 'rgba(45, 90, 39, 0.35)',
  herbivore: '#4caf50',
  carnivore: '#e53935',
  bush: '#2d5a27',
  fruitTree: '#d84315',
  highlight: 'rgba(255, 255, 255, 0.25)',
  selected: 'rgba(255, 215, 0, 0.9)',
};

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface InfoCardState {
  visible: boolean;
  animal: Animal | null;
  screenX: number;
  screenY: number;
  animProgress: number;
  targetProgress: number;
}

export class MapRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private container: HTMLElement;
  private cellSize: number = 60;
  private offsetX: number = 0;
  private offsetY: number = 0;
  private rafId: number | null = null;
  private lastFrameTime: number = 0;
  private tickProgress: number = 0;
  private selectedAnimalId: string | null = null;
  private particles: Particle[] = [];
  private infoCard: InfoCardState = {
    visible: false,
    animal: null,
    screenX: 0,
    screenY: 0,
    animProgress: 0,
    targetProgress: 0,
  };
  private hoverCell: { x: number; y: number } | null = null;
  private staticCanvas: HTMLCanvasElement | null = null;
  private staticCtx: CanvasRenderingContext2D | null = null;

  constructor(canvas: HTMLCanvasElement, container: HTMLElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.container = container;
    this.setupStaticCanvas();
    this.bindEvents();
    this.setupEventBus();
    this.resize();
  }

  private setupStaticCanvas(): void {
    this.staticCanvas = document.createElement('canvas');
    this.staticCtx = this.staticCanvas.getContext('2d')!;
  }

  private bindEvents(): void {
    window.addEventListener('resize', () => this.resize());
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseleave', () => {
      this.hoverCell = null;
    });
  }

  private setupEventBus(): void {
    eventBus.on('ecosystem:predation', (payload) => {
      const ev = payload as PredationEvent;
      if (ev.success) {
        const { screenX, screenY } = this.cellToScreen(ev.preyX, ev.preyY);
        this.spawnParticles(screenX, screenY, COLORS.herbivore, 20);
        this.triggerConfetti(screenX, screenY);
      } else {
        const predator = ecosystem.getAnimal(ev.predatorId);
        if (predator) {
          const { screenX, screenY } = this.cellToScreen(predator.x, predator.y);
          this.spawnParticles(screenX, screenY, '#ffc107', 8);
        }
      }
    });

    eventBus.on('ecosystem:animalSelected', (payload) => {
      const animal = payload as Animal | null;
      if (animal) {
        this.selectedAnimalId = animal.id;
        this.showInfoCard(animal);
      } else {
        this.selectedAnimalId = null;
        this.hideInfoCard();
      }
    });
  }

  private showInfoCard(animal: Animal): void {
    const { screenX, screenY } = this.cellToScreen(animal.x, animal.y);
    this.infoCard = {
      visible: true,
      animal,
      screenX,
      screenY,
      animProgress: 0,
      targetProgress: 1,
    };
  }

  private hideInfoCard(): void {
    this.infoCard.targetProgress = 0;
  }

  private spawnParticles(x: number, y: number, color: string, count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 1 + Math.random() * 3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        color,
        size: 3 + Math.random() * 4,
      });
    }
  }

  private triggerConfetti(x: number, y: number): void {
    try {
      const canvasRect = this.canvas.getBoundingClientRect();
      confetti({
        particleCount: 30,
        spread: 60,
        origin: {
          x: (canvasRect.left + x) / window.innerWidth,
          y: (canvasRect.top + y) / window.innerHeight,
        },
        colors: [COLORS.herbivore, '#fff', COLORS.carnivore, '#ffc107'],
        disableForReducedMotion: true,
        scalar: 0.6,
      });
    } catch (_e) {
      // ignore
    }
  }

  resize(): void {
    const rect = this.container.getBoundingClientRect();
    const maxWidth = rect.width - 48;
    const maxHeight = rect.height - 48;
    const size = Math.min(maxWidth, maxHeight);
    this.canvas.width = size;
    this.canvas.height = size;
    this.cellSize = size / GRID_SIZE;
    this.offsetX = 0;
    this.offsetY = 0;
    if (this.staticCanvas) {
      this.staticCanvas.width = size;
      this.staticCanvas.height = size;
    }
    this.renderStaticLayer();
  }

  private cellToScreen(cx: number, cy: number): { screenX: number; screenY: number } {
    return {
      screenX: this.offsetX + cx * this.cellSize + this.cellSize / 2,
      screenY: this.offsetY + cy * this.cellSize + this.cellSize / 2,
    };
  }

  private screenToCell(sx: number, sy: number): { x: number; y: number } | null {
    const x = Math.floor((sx - this.offsetX) / this.cellSize);
    const y = Math.floor((sy - this.offsetY) / this.cellSize);
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return null;
    return { x, y };
  }

  private handleMouseMove(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    this.hoverCell = this.screenToCell(sx, sy);
  }

  private handleClick(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const cell = this.screenToCell(sx, sy);
    if (!cell) {
      eventBus.emit('ui:selectAnimal', null);
      ecosystem.selectAnimal(null);
      return;
    }

    if (this.infoCard.visible) {
      const infoCardRect = this.getInfoCardRect();
      if (infoCardRect) {
        const { screenX, screenY } = this.cellToScreen(
          this.infoCard.animal?.x ?? 0,
          this.infoCard.animal?.y ?? 0
        );
        const icx = screenX + infoCardRect.offsetX;
        const icy = screenY + infoCardRect.offsetY * this.infoCard.animProgress;
        if (
          sx >= icx &&
          sx <= icx + infoCardRect.width &&
          sy >= icy &&
          sy <= icy + infoCardRect.height
        ) {
          return;
        }
      }
    }

    let clickedAnimal: Animal | null = null;
    for (const animal of ecosystem.animals.values()) {
      const ix = animal.prevX + (animal.x - animal.prevX) * this.tickProgress;
      const iy = animal.prevY + (animal.y - animal.prevY) * this.tickProgress;
      const { screenX, screenY } = this.cellToScreen(ix, iy);
      const dist = Math.hypot(sx - screenX, sy - screenY);
      if (dist <= this.cellSize * 0.35) {
        clickedAnimal = animal;
        break;
      }
    }

    if (clickedAnimal) {
      eventBus.emit('ui:selectAnimal', clickedAnimal.id);
      ecosystem.selectAnimal(clickedAnimal.id);
    } else {
      eventBus.emit('ui:canvasClick', cell);
      eventBus.emit('ui:selectAnimal', null);
      ecosystem.selectAnimal(null);
    }
  }

  private getInfoCardRect(): { width: number; height: number; offsetX: number; offsetY: number } | null {
    if (!this.infoCard.animal) return null;
    const width = Math.min(this.cellSize * 3, 220);
    const height = 180;
    return { width, height, offsetX: -width / 2, offsetY: -height - this.cellSize * 0.6 };
  }

  private renderStaticLayer(): void {
    if (!this.staticCtx || !this.staticCanvas) return;
    const ctx = this.staticCtx;
    const w = this.staticCanvas.width;
    const h = this.staticCanvas.height;
    ctx.clearRect(0, 0, w, h);

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const cell = ecosystem.grid[y][x];
        const px = this.offsetX + x * this.cellSize;
        const py = this.offsetY + y * this.cellSize;
        let baseColor = COLORS.empty;
        if (cell.type === 'water') baseColor = COLORS.water;
        else if (cell.type === 'grass') baseColor = COLORS.grass;
        else if (cell.type === 'berry') baseColor = '#a88abf';

        const grad = ctx.createLinearGradient(px, py, px + this.cellSize, py + this.cellSize);
        grad.addColorStop(0, this.lighten(baseColor, 10));
        grad.addColorStop(1, this.darken(baseColor, 8));
        ctx.fillStyle = grad;
        ctx.fillRect(px, py, this.cellSize, this.cellSize);

        if (cell.type === 'water' && cell.amount > 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.15)';
          ctx.beginPath();
          ctx.ellipse(
            px + this.cellSize * 0.5,
            py + this.cellSize * 0.4,
            this.cellSize * 0.2,
            this.cellSize * 0.08,
            0,
            0,
            Math.PI * 2
          );
          ctx.fill();
        } else if (cell.type === 'grass' && cell.amount > 0) {
          ctx.fillStyle = '#2d5a27';
          const n = 3 + Math.floor(cell.amount / 25);
          for (let i = 0; i < n; i++) {
            const gx = px + 4 + (i * (this.cellSize - 8)) / Math.max(1, n - 1);
            const gy = py + this.cellSize * 0.65 + Math.sin(i) * 2;
            ctx.fillRect(gx, gy, 2, this.cellSize * 0.2);
          }
        } else if (cell.type === 'berry' && cell.amount > 0) {
          ctx.fillStyle = COLORS.berry;
          for (let i = 0; i < 5; i++) {
            const bx = px + this.cellSize * (0.25 + (i % 3) * 0.25);
            const by = py + this.cellSize * (0.35 + Math.floor(i / 3) * 0.3);
            ctx.beginPath();
            ctx.arc(bx, by, Math.min(cell.amount / 15, 4), 0, Math.PI * 2);
            ctx.fill();
          }
        }

        ctx.strokeStyle = COLORS.gridLine;
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, this.cellSize - 1, this.cellSize - 1);
      }
    }
  }

  private lighten(hex: string, amount: number): string {
    return this.shade(hex, amount);
  }

  private darken(hex: string, amount: number): string {
    return this.shade(hex, -amount);
  }

  private shade(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, Math.max(0, (num >> 16) + amt));
    const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
    const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
    return `#${((1 << 24) | (R << 16) | (G << 8) | B).toString(16).slice(1)}`;
  }

  start(): void {
    this.lastFrameTime = performance.now();
    const loop = (t: number) => {
      const dt = t - this.lastFrameTime;
      this.lastFrameTime = t;
      this.update(dt);
      this.render();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private update(dt: number): void {
    const TICK_DURATION = 500;
    this.tickProgress = Math.min(1, this.tickProgress + dt / TICK_DURATION);
    if (this.tickProgress >= 1) {
      this.tickProgress = 0;
      this.renderStaticLayer();
    }

    this.particles = this.particles.filter((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08;
      p.life -= dt / 800;
      return p.life > 0;
    });

    const cardSpeed = dt / 300;
    if (this.infoCard.animProgress < this.infoCard.targetProgress) {
      this.infoCard.animProgress = Math.min(this.infoCard.targetProgress, this.infoCard.animProgress + cardSpeed);
    } else if (this.infoCard.animProgress > this.infoCard.targetProgress) {
      this.infoCard.animProgress = Math.max(this.infoCard.targetProgress, this.infoCard.animProgress - cardSpeed);
      if (this.infoCard.animProgress <= 0 && this.infoCard.targetProgress === 0) {
        this.infoCard.visible = false;
        this.infoCard.animal = null;
      }
    }

    if (this.infoCard.animal) {
      const a = ecosystem.getAnimal(this.infoCard.animal.id);
      if (a) {
        this.infoCard.animal = JSON.parse(JSON.stringify(a));
      }
    }
  }

  private easeOut(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  private render(): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (this.staticCanvas) {
      ctx.drawImage(this.staticCanvas, 0, 0);
    }

    if (this.hoverCell) {
      const px = this.offsetX + this.hoverCell.x * this.cellSize;
      const py = this.offsetY + this.hoverCell.y * this.cellSize;
      ctx.fillStyle = COLORS.highlight;
      ctx.fillRect(px, py, this.cellSize, this.cellSize);
    }

    for (const plant of ecosystem.plants.values()) {
      const { screenX, screenY } = this.cellToScreen(plant.x, plant.y);
      const r = this.cellSize * 0.3;
      if (plant.type === 'bush') {
        ctx.fillStyle = COLORS.bush;
        ctx.beginPath();
        ctx.arc(screenX, screenY + 4, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#3d7a35';
        ctx.beginPath();
        ctx.arc(screenX - r * 0.4, screenY, r * 0.6, 0, Math.PI * 2);
        ctx.arc(screenX + r * 0.4, screenY - 2, r * 0.55, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#6d4c41';
        ctx.fillRect(screenX - 3, screenY, 6, r * 0.7);
        ctx.fillStyle = COLORS.bush;
        ctx.beginPath();
        ctx.arc(screenX, screenY - r * 0.1, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = COLORS.fruitTree;
        for (let i = 0; i < 4; i++) {
          const ang = (Math.PI * 2 * i) / 4;
          ctx.beginPath();
          ctx.arc(screenX + Math.cos(ang) * r * 0.5, screenY - r * 0.1 + Math.sin(ang) * r * 0.5, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    const sortedAnimals = Array.from(ecosystem.animals.values()).sort((a, b) => a.y - b.y);
    for (const animal of sortedAnimals) {
      const ix = animal.prevX + (animal.x - animal.prevX) * this.tickProgress;
      const iy = animal.prevY + (animal.y - animal.prevY) * this.tickProgress;
      const { screenX, screenY } = this.cellToScreen(ix, iy);
      const r = this.cellSize * 0.28;

      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.ellipse(screenX, screenY + r * 0.8, r * 0.8, r * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();

      const color = animal.type === 'herbivore' ? COLORS.herbivore : COLORS.carnivore;
      const grad = ctx.createRadialGradient(screenX - r * 0.3, screenY - r * 0.3, r * 0.1, screenX, screenY, r);
      grad.addColorStop(0, this.lighten(color, 20));
      grad.addColorStop(1, this.darken(color, 10));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(screenX, screenY, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff';
      const eyeOffset = r * 0.35;
      ctx.beginPath();
      ctx.arc(screenX - eyeOffset, screenY - eyeOffset * 0.5, r * 0.18, 0, Math.PI * 2);
      ctx.arc(screenX + eyeOffset, screenY - eyeOffset * 0.5, r * 0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(screenX - eyeOffset, screenY - eyeOffset * 0.5, r * 0.09, 0, Math.PI * 2);
      ctx.arc(screenX + eyeOffset, screenY - eyeOffset * 0.5, r * 0.09, 0, Math.PI * 2);
      ctx.fill();

      const barW = r * 1.8;
      const barH = 3;
      const barY = screenY + r + 4;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(screenX - barW / 2, barY, barW, barH);
      ctx.fillStyle = '#4caf50';
      ctx.fillRect(screenX - barW / 2, barY, barW * (animal.health / animal.maxHealth), barH);
      ctx.fillStyle = '#2196f3';
      ctx.fillRect(screenX - barW / 2, barY + barH + 1, barW * (animal.stamina / animal.maxStamina), barH);

      if (animal.id === this.selectedAnimalId) {
        ctx.strokeStyle = COLORS.selected;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(screenX, screenY, r + 6, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (this.infoCard.visible && this.infoCard.animal && this.infoCard.animProgress > 0) {
      this.renderInfoCard();
    }
  }

  private renderInfoCard(): void {
    const ctx = this.ctx;
    const animal = this.infoCard.animal!;
    const progress = this.easeOut(this.infoCard.animProgress);
    const { screenX, screenY } = this.cellToScreen(animal.x, animal.y);
    const rect = this.getInfoCardRect();
    if (!rect) return;

    const width = rect.width;
    const height = rect.height;
    const x = screenX + rect.offsetX;
    const y = screenY + rect.offsetY * progress;

    ctx.save();
    ctx.globalAlpha = progress;

    const cardGrad = ctx.createLinearGradient(x, y, x, y + height);
    cardGrad.addColorStop(0, '#2d5a27');
    cardGrad.addColorStop(1, '#1a3d18');
    ctx.fillStyle = cardGrad;
    this.roundRect(ctx, x, y, width, height, 10);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1.5;
    this.roundRect(ctx, x + 0.5, y + 0.5, width - 1, height - 1, 10);
    ctx.stroke();

    const triX = screenX;
    const triY = y + height;
    ctx.fillStyle = '#1a3d18';
    ctx.beginPath();
    ctx.moveTo(triX - 8, triY);
    ctx.lineTo(triX + 8, triY);
    ctx.lineTo(triX, triY + 8);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textBaseline = 'top';
    const title = animal.type === 'herbivore' ? '🌿 食草动物' : '🦊 食肉动物';
    ctx.fillText(title, x + 12, y + 10);

    ctx.font = '11px "PingFang SC", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    let ly = y + 34;

    this.drawStatBar(ctx, x + 12, ly, width - 24, '生命值', animal.health, animal.maxHealth, '#f44336');
    ly += 24;
    this.drawStatBar(ctx, x + 12, ly, width - 24, '体力值', animal.stamina, animal.maxStamina, '#2196f3');
    ly += 28;

    const stateMap: Record<string, string> = {
      idle: '休息',
      foraging: '觅食中',
      fleeing: '逃跑中',
      hunting: '捕猎中',
      eating: '进食中',
      moving: '移动中',
    };
    const stateText = stateMap[animal.state] || animal.state;
    let targetText = '无';
    if (animal.targetX !== null && animal.targetY !== null) {
      targetText = `(${animal.targetX + 1}, ${animal.targetY + 1})`;
    }
    ctx.fillStyle = '#fff';
    ctx.font = '11px "PingFang SC", sans-serif';
    ctx.fillText(`当前状态：${stateText}`, x + 12, ly);
    ctx.fillText(`目标位置：${targetText}`, x + 12, ly + 14);
    ly += 32;

    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '10px "PingFang SC", sans-serif';
    ctx.fillText('最近行为：', x + 12, ly);
    ly += 14;

