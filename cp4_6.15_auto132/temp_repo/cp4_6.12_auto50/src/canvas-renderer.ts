import {
  eventBus,
  WasteType,
  TruckArrivedEvent,
  WasteItemEvent,
  SortResultEvent,
  ProcessorActiveEvent,
  UpgradeEvent,
  StorageUpdateEvent,
} from './event-bus';

const COLORS: Record<WasteType, string> = {
  plastic: '#4caf50',
  paper: '#e6c619',
  metal: '#9e9e9e',
  electronic: '#9c27b0',
};

const COLORS_DARK: Record<WasteType, string> = {
  plastic: '#2e7031',
  paper: '#a89010',
  metal: '#6b6b6b',
  electronic: '#6a1b9a',
};

interface Truck {
  id: string;
  type: WasteType;
  startTime: number;
  duration: number;
  startX: number;
  endX: number;
  y: number;
}

interface BeltItem {
  id: string;
  type: WasteType;
  beltIndex: number;
  spawnTime: number;
  state: 'moving' | 'waiting' | 'done';
}

interface ScoreBubble {
  x: number;
  y: number;
  text: string;
  startTime: number;
  color: string;
}

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

interface ButtonFeedback {
  type: WasteType;
  startTime: number;
}

interface StorageBin {
  type: WasteType;
  x: number;
  y: number;
  width: number;
  height: number;
  isFull: boolean;
  level: number;
  maxCapacity: number;
}

const BUTTON_W = 70;
const BUTTON_H = 50;
const BELT_LENGTH = 500;
const BELT_START_X = 260;
const BELT_START_Y = 200;
const BELT_GAP = 95;
const BELT_HEIGHT = 40;

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private dpr = 1;

  private trucks: Truck[] = [];
  private items: BeltItem[] = [];
  private scoreBubbles: ScoreBubble[] = [];
  private particles: Particle[] = [];
  private buttonFeedbacks: ButtonFeedback[] = [];
  private storageBins: StorageBin[] = [];
  private beltSpeed = 1;
  private processorLevel = 0;
  private beltLevel = 0;
  private storageLevel = 0;

  private activeProcessors = { shredder: false, furnace: false, pulper: false };
  private storageStates: Record<WasteType, { count: number; full: boolean }> = {
    plastic: { count: 0, full: false },
    paper: { count: 0, full: false },
    metal: { count: 0, full: false },
    electronic: { count: 0, full: false },
  };
  private storageMax = 50;

  private lastTime = 0;
  private rafId: number | null = null;
  private running = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.dpr = window.devicePixelRatio || 1;
    this.canvas.width = 1200 * this.dpr;
    this.canvas.height = 900 * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);

    this.initStorageBins();
    this.setupEventListeners();
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
  }

  private initStorageBins() {
    const baseX = 830;
    const baseY = 60;
    const w = 75;
    const h = 130;
    const gap = 10;
    const types: WasteType[] = ['plastic', 'paper', 'metal', 'electronic'];
    this.storageBins = types.map((type, i) => ({
      type,
      x: baseX + i * (w + gap),
      y: baseY,
      width: w,
      height: h,
      isFull: false,
      level: 0,
      maxCapacity: 50,
    }));
  }

  private setupEventListeners() {
    eventBus.on('truck:arrived', (d: TruckArrivedEvent) => this.addTruck(d));
    eventBus.on('item:spawn', (d: WasteItemEvent) => this.addItem(d));
    eventBus.on('item:sort-result', (d: SortResultEvent) => this.onSortResult(d));
    eventBus.on('processor:active', (d: ProcessorActiveEvent) => this.onProcessorActive(d));
    eventBus.on('upgrade:done', (d: UpgradeEvent) => this.onUpgrade(d));
    eventBus.on('storage:update', (d: StorageUpdateEvent) => this.onStorageUpdate(d));
    eventBus.on('game:reset', () => this.reset());
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.animate();
  }

  stop() {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  reset() {
    this.trucks = [];
    this.items = [];
    this.scoreBubbles = [];
    this.particles = [];
    this.buttonFeedbacks = [];
    this.beltLevel = 0;
    this.processorLevel = 0;
    this.storageLevel = 0;
    this.beltSpeed = 1;
    this.storageMax = 50;
    this.storageStates = {
      plastic: { count: 0, full: false },
      paper: { count: 0, full: false },
      metal: { count: 0, full: false },
      electronic: { count: 0, full: false },
    };
    this.initStorageBins();
  }

  private animate() {
    if (!this.running) return;
    const now = performance.now();
    this.update(now);
    this.render(now);
    this.rafId = requestAnimationFrame(() => this.animate());
  }

  private update(now: number) {
    this.trucks = this.trucks.filter((t) => now - t.startTime < t.duration + 2000);

    this.items.forEach((item) => {
      if (item.state !== 'moving') return;
      const travelMs = (BELT_LENGTH / (80 * this.beltSpeed)) * 1000;
      if (now - item.spawnTime >= travelMs) {
        item.state = 'waiting';
        setTimeout(() => {
          if (item.state === 'waiting') {
            eventBus.emit('item:timeout', { itemId: item.id });
            item.state = 'done';
          }
        }, 2000);
      }
    });
    this.items = this.items.filter((i) => i.state !== 'done' || now - i.spawnTime < 10000);

    this.scoreBubbles = this.scoreBubbles.filter((b) => now - b.startTime < 1000);
    this.buttonFeedbacks = this.buttonFeedbacks.filter((f) => now - f.startTime < 200);

    this.particles = this.particles.filter((p) => {
      p.life -= 16;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;
      return p.life > 0;
    });
  }

  private render(now: number) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, 1200, 900);

    this.drawGround();
    this.drawEntranceArea(now);
    this.drawTrucks(now);
    this.drawBelts(now);
    this.drawItems(now);
    this.drawSortButtons(now);
    this.drawStorageBins(now);
    this.drawProcessors(now);
    this.drawWasteBin(now);
    this.drawScoreBubbles(now);
    this.drawParticles();
  }

  private drawGround() {
    const ctx = this.ctx;
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 1200; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 900);
      ctx.stroke();
    }
    for (let y = 0; y < 900; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1200, y);
      ctx.stroke();
    }
  }

  private drawEntranceArea(now: number) {
    const ctx = this.ctx;
    ctx.fillStyle = '#3d2f26';
    ctx.fillRect(0, 150, 250, 380);
    ctx.strokeStyle = '#2a2019';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 150, 250, 380);

    ctx.fillStyle = '#5a4a40';
    ctx.fillRect(30, 480, 180, 30);
    ctx.fillStyle = '#d4a017';
    ctx.font = 'bold 14px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('地 磅', 120, 502);

    ctx.fillStyle = '#3d2f26';
    ctx.fillRect(0, 70, 250, 70);
    ctx.strokeRect(0, 70, 250, 70);
    ctx.fillStyle = '#c67c4e';
    ctx.font = 'bold 18px Courier New';
    ctx.fillText('入 口 区', 125, 112);

    ctx.fillStyle = '#7a7a7a';
    ctx.fillRect(0, 540, 260, 40);
    ctx.fillStyle = '#4a3b32';
    for (let i = 0; i < 8; i++) {
      ctx.fillRect(i * 32, 545, 24, 30);
    }
  }

  private drawTrucks(now: number) {
    const ctx = this.ctx;
    this.trucks.forEach((truck) => {
      const elapsed = now - truck.startTime;
      let t = Math.min(elapsed / truck.duration, 1);
      t = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const x = truck.startX + (truck.endX - truck.startX) * t;
      const y = truck.y;

      ctx.fillStyle = '#5a4a40';
      ctx.fillRect(x, y, 110, 55);

      ctx.fillStyle = COLORS_DARK[truck.type];
      ctx.fillRect(x + 38, y + 8, 68, 42);
      ctx.fillStyle = COLORS[truck.type];
      ctx.fillRect(x + 40, y + 10, 64, 38);

      ctx.fillStyle = '#4a3b32';
      ctx.fillRect(x + 2, y + 15, 34, 32);
      ctx.fillStyle = '#87ceeb';
      ctx.fillRect(x + 6, y + 19, 26, 16);

      ctx.fillStyle = '#2a2019';
      ctx.beginPath();
      ctx.arc(x + 20, y + 55, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + 90, y + 55, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7a7a7a';
      ctx.beginPath();
      ctx.arc(x + 20, y + 55, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + 90, y + 55, 5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  private drawBelts(now: number) {
    const ctx = this.ctx;
    for (let i = 0; i < 4; i++) {
      const y = BELT_START_Y + i * BELT_GAP;
      ctx.fillStyle = '#2a2019';
      ctx.fillRect(BELT_START_X - 8, y - 6, BELT_LENGTH + 16, BELT_HEIGHT + 12);

      const grad = ctx.createLinearGradient(BELT_START_X, y, BELT_START_X, y + BELT_HEIGHT);
      grad.addColorStop(0, '#3d2f26');
      grad.addColorStop(0.5, '#5a4a40');
      grad.addColorStop(1, '#3d2f26');
      ctx.fillStyle = grad;
      ctx.fillRect(BELT_START_X, y, BELT_LENGTH, BELT_HEIGHT);

      ctx.save();
      ctx.beginPath();
      ctx.rect(BELT_START_X, y + 4, BELT_LENGTH, BELT_HEIGHT - 8);
      ctx.clip();
      const offset = ((now * (0.1 + this.beltLevel * 0.03)) % 40);
      ctx.strokeStyle = 'rgba(198, 124, 78, 0.35)';
      ctx.lineWidth = 3;
      for (let x = -offset; x < BELT_LENGTH + 40; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, y + 4);
        ctx.lineTo(x + 20, y + BELT_HEIGHT - 4);
        ctx.stroke();
      }
      ctx.restore();

      for (let rx = BELT_START_X + 20; rx < BELT_START_X + BELT_LENGTH; rx += 40) {
        ctx.fillStyle = '#2a2019';
        ctx.beginPath();
        ctx.arc(rx, y - 2, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(rx, y + BELT_HEIGHT + 2, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const labelY = BELT_START_Y - 20;
    ctx.fillStyle = '#c67c4e';
    ctx.font = 'bold 14px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('分 拣 区', BELT_START_X + BELT_LENGTH / 2, labelY);
  }

  private drawItems(now: number) {
    const ctx = this.ctx;
    this.items.forEach((item) => {
      if (item.state === 'done') return;
      const y = BELT_START_Y + item.beltIndex * BELT_GAP + BELT_HEIGHT / 2;
      const travelMs = (BELT_LENGTH / (80 * this.beltSpeed)) * 1000;
      let progress = Math.min((now - item.spawnTime) / travelMs, 1);
      if (item.state === 'waiting') progress = 1;
      const x = BELT_START_X + 30 + (BELT_LENGTH - 80) * progress;

      if (item.state === 'waiting') {
        const pulse = 1 + Math.sin(now * 0.01) * 0.08;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(pulse, pulse);
        this.drawWasteItem(0, 0, item.type, 22);
        ctx.restore();
      } else {
        this.drawWasteItem(x, y, item.type, 22);
      }
    });
  }

  private drawWasteItem(x: number, y: number, type: WasteType, size: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;

    if (type === 'plastic') {
      ctx.fillStyle = COLORS.plastic;
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 0.55, size * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COLORS_DARK.plastic;
      ctx.fillRect(-4, -size * 0.9, 8, size * 0.25);
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-size * 0.2, -size * 0.3);
      ctx.lineTo(-size * 0.2, size * 0.3);
      ctx.stroke();
    } else if (type === 'paper') {
      ctx.fillStyle = COLORS.paper;
      ctx.fillRect(-size * 0.7, -size * 0.55, size * 1.4, size * 1.1);
      ctx.strokeStyle = COLORS_DARK.paper;
      ctx.lineWidth = 1.5;
      for (let i = -size * 0.3; i <= size * 0.3; i += size * 0.3) {
        ctx.beginPath();
        ctx.moveTo(-size * 0.6, i);
        ctx.lineTo(size * 0.6, i);
        ctx.stroke();
      }
    } else if (type === 'metal') {
      ctx.fillStyle = COLORS.metal;
      ctx.beginPath();
      ctx.moveTo(-size * 0.7, -size * 0.3);
      ctx.lineTo(-size * 0.4, -size * 0.7);
      ctx.lineTo(size * 0.3, -size * 0.5);
      ctx.lineTo(size * 0.7, size * 0.2);
      ctx.lineTo(size * 0.1, size * 0.7);
      ctx.lineTo(-size * 0.6, size * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = COLORS_DARK.metal;
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      ctx.fillStyle = COLORS.electronic;
      ctx.fillRect(-size * 0.65, -size * 0.5, size * 1.3, size);
      ctx.fillStyle = '#5a3d6e';
      for (let px = -size * 0.4; px <= size * 0.3; px += size * 0.25) {
        for (let py = -size * 0.25; py <= size * 0.2; py += size * 0.25) {
          ctx.fillRect(px, py, size * 0.12, size * 0.12);
        }
      }
      ctx.strokeStyle = '#2a2019';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-size * 0.65, -size * 0.5, size * 1.3, size);
    }

    ctx.restore();
  }

  private drawSortButtons(now: number) {
    const ctx = this.ctx;
    const types: WasteType[] = ['plastic', 'paper', 'metal', 'electronic'];
    const labels = ['塑料', '废纸', '金属', '电子'];

    types.forEach((type, i) => {
      const y = BELT_START_Y + i * BELT_GAP + BELT_HEIGHT / 2 - BUTTON_H / 2;
      const x = BELT_START_X + BELT_LENGTH + 20;
      const feedback = this.buttonFeedbacks.find((f) => f.type === type);
      const pressed = !!feedback;
      const elapsed = pressed ? now - feedback.startTime : 0;
      const scale = pressed ? 1 - (elapsed / 200) * 0.15 : 1;

      ctx.save();
      ctx.translate(x + BUTTON_W / 2, y + BUTTON_H / 2);
      ctx.scale(scale, scale);

      ctx.shadowColor = pressed ? COLORS[type] : 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = pressed ? 15 : 5;

      const grad = ctx.createLinearGradient(0, -BUTTON_H / 2, 0, BUTTON_H / 2);
      if (pressed) {
        grad.addColorStop(0, '#fff');
        grad.addColorStop(1, COLORS[type]);
      } else {
        grad.addColorStop(0, COLORS[type]);
        grad.addColorStop(1, COLORS_DARK[type]);
      }
      ctx.fillStyle = grad;
      this.roundRect(ctx, -BUTTON_W / 2, -BUTTON_H / 2, BUTTON_W, BUTTON_H, 8);
      ctx.fill();

      ctx.strokeStyle = '#2a2019';
      ctx.lineWidth = 2;
      this.roundRect(ctx, -BUTTON_W / 2, -BUTTON_H / 2, BUTTON_W, BUTTON_H, 8);
      ctx.stroke();

      ctx.fillStyle = pressed ? '#2a2019' : '#fff';
      ctx.font = 'bold 14px Courier New';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labels[i], 0, 0);

      ctx.restore();
    });
  }

  private drawStorageBins(now: number) {
    const ctx = this.ctx;
    this.storageBins.forEach((bin, i) => {
      const state = this.storageStates[bin.type];
      const maxH = bin.height;
      const fillH = maxH * Math.min(state.count / this.storageMax, 1);
      const expandedH = maxH + this.storageLevel * 15;

      ctx.fillStyle = '#2a2019';
      ctx.fillRect(bin.x - 4, bin.y - 14 - this.storageLevel * 15, bin.width + 8, expandedH + 38);

      const grad = ctx.createLinearGradient(bin.x, bin.y - this.storageLevel * 15, bin.x, bin.y + expandedH);
      grad.addColorStop(0, '#5a4a40');
      grad.addColorStop(1, '#3d2f26');
      ctx.fillStyle = grad;
      ctx.fillRect(bin.x, bin.y - this.storageLevel * 15, bin.width, expandedH);

      ctx.fillStyle = COLORS_DARK[bin.type];
      ctx.globalAlpha = 0.6;
      ctx.fillRect(bin.x + 6, bin.y + expandedH - fillH, bin.width - 12, fillH);
      ctx.globalAlpha = 1;

      ctx.fillStyle = COLORS[bin.type];
      ctx.fillRect(bin.x + 6, bin.y + expandedH - fillH, bin.width - 12, 3);

      const isFull = state.full;
      const blinkOn = isFull && Math.floor(now / 500) % 2 === 0;
      ctx.fillStyle = isFull ? (blinkOn ? '#ff3b30' : '#801510') : '#4cd964';
      ctx.shadowColor = isFull ? (blinkOn ? '#ff3b30' : 'transparent') : '#4cd964';
      ctx.shadowBlur = blinkOn ? 12 : 6;
      ctx.beginPath();
      ctx.arc(bin.x + bin.width / 2, bin.y - 8 - this.storageLevel * 15, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#d4a017';
      ctx.font = 'bold 11px Courier New';
      ctx.textAlign = 'center';
      const names = ['塑料', '废纸', '金属', '电子'];
      ctx.fillText(names[i], bin.x + bin.width / 2, bin.y + expandedH + 18);
      ctx.fillStyle = '#fff';
      ctx.font = '10px Courier New';
      ctx.fillText(`${state.count}/${this.storageMax}`, bin.x + bin.width / 2, bin.y + expandedH + 32);
    });
  }

  private drawProcessors(now: number) {
    const ctx = this.ctx;
    const baseY = 250;
    const spacing = 110;
    const names = ['粉碎机', '熔炉', '制浆机'];
    const types: Array<'shredder' | 'furnace' | 'pulper'> = ['shredder', 'furnace', 'pulper'];
    const colors = ['#4caf50', '#9e9e9e', '#e6c619'];

    for (let i = 0; i < 3; i++) {
      const x = 830 + i * spacing;
      const y = baseY;
      const active = this.activeProcessors[types[i]];
      const glow = this.processorLevel > 0;

      ctx.fillStyle = '#2a2019';
      ctx.fillRect(x - 4, y - 4, 90, 140);

      const bodyGrad = ctx.createLinearGradient(x, y, x, y + 130);
      bodyGrad.addColorStop(0, '#5a4a40');
      bodyGrad.addColorStop(1, '#3d2f26');
      ctx.fillStyle = bodyGrad;
      ctx.fillRect(x, y, 82, 130);

      if (glow) {
        ctx.strokeStyle = `rgba(212, 160, 23, ${active ? 0.9 : 0.5})`;
        ctx.lineWidth = 2;
        ctx.shadowColor = '#d4a017';
        ctx.shadowBlur = active ? 12 : 6;
        ctx.strokeRect(x + 3, y + 3, 76, 124);
        ctx.shadowBlur = 0;
      }

      ctx.strokeStyle = '#2a2019';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, 82, 130);

      if (types[i] === 'shredder') {
        this.drawShredder(x + 41, y + 70, now, active, colors[i]);
      } else if (types[i] === 'furnace') {
        this.drawFurnace(x + 41, y + 70, now, active);
      } else {
        this.drawPulper(x + 41, y + 70, now, active);
      }

      ctx.fillStyle = '#c67c4e';
      ctx.font = 'bold 12px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText(names[i], x + 41, y + 145);
    }
  }

  private drawShredder(cx: number, cy: number, now: number, active: boolean, color: string) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(cx, cy);

    ctx.fillStyle = '#2a2019';
    ctx.beginPath();
    ctx.moveTo(-28, -35);
    ctx.lineTo(28, -35);
    ctx.lineTo(18, 35);
    ctx.lineTo(-18, 35);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#3d2f26';
    ctx.beginPath();
    ctx.moveTo(-24, -31);
    ctx.lineTo(24, -31);
    ctx.lineTo(15, 31);
    ctx.lineTo(-15, 31);
    ctx.closePath();
    ctx.fill();

    const rotation = active ? (now * 0.008) % (Math.PI * 2) : 0;
    for (let j = 0; j < 6; j++) {
      ctx.save();
      ctx.rotate(rotation + (j * Math.PI) / 3);
      const dist = 4 + ((now * 0.03 + j * 10) % 22);
      const alpha = active ? 1 - dist / 30 : 0.3;
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(0, -10 + dist, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  private drawFurnace(cx: number, cy: number, now: number, active: boolean) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(cx, cy);

    ctx.fillStyle = '#2a2019';
    ctx.beginPath();
    ctx.ellipse(0, -15, 28, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-25, -15, 50, 45);
    ctx.fillStyle = '#3d2f26';
    ctx.fillRect(-22, -12, 44, 40);

    if (active) {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(0, 8, 20, 18, 0, 0, Math.PI * 2);
      ctx.clip();
      const t = (now * 0.003) % 1;
      for (let j = 0; j < 8; j++) {
        const angle = t * Math.PI * 2 + (j * Math.PI) / 4;
        const r = 12 + Math.sin(now * 0.005 + j) * 4;
        const grad = ctx.createRadialGradient(
          Math.cos(angle) * r * 0.5,
          8 + Math.sin(angle) * r * 0.5,
          0,
          Math.cos(angle) * r * 0.5,
          8 + Math.sin(angle) * r * 0.5,
          15
        );
        grad.addColorStop(0, '#ffeb3b');
        grad.addColorStop(0.4, '#ff9800');
        grad.addColorStop(1, '#b71c1c');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(Math.cos(angle) * r * 0.5, 8 + Math.sin(angle) * r * 0.5, 10, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    } else {
      ctx.fillStyle = '#5a4a40';
      ctx.beginPath();
      ctx.ellipse(0, 8, 18, 15, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawPulper(cx: number, cy: number, now: number, active: boolean) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(cx, cy);

    ctx.fillStyle = '#2a2019';
    ctx.beginPath();
    ctx.ellipse(0, -20, 28, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-28, -20, 56, 55);
    ctx.fillStyle = '#3d2f26';
    ctx.fillRect(-25, -17, 50, 50);

    if (active) {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(0, 8, 23, 22, 0, 0, Math.PI * 2);
      ctx.clip();
      const rotation = now * 0.004;
      for (let j = 0; j < 5; j++) {
        ctx.strokeStyle = `rgba(230, 198, 25, ${0.3 + j * 0.12})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 2.5; a += 0.1) {
          const r = 3 + a * 3 + j * 3;
          const px = Math.cos(a + rotation + j) * r;
          const py = 8 + Math.sin(a + rotation + j) * r * 0.7;
          if (a === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      ctx.restore();
    } else {
      ctx.fillStyle = '#a89010';
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.ellipse(0, 8, 21, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  private drawWasteBin(now: number) {
    const ctx = this.ctx;
    const x = BELT_START_X + BELT_LENGTH + 20;
    const y = 700;
    ctx.fillStyle = '#2a2019';
    ctx.fillRect(x - 4, y - 4, 160, 90);
    const grad = ctx.createLinearGradient(x, y, x, y + 80);
    grad.addColorStop(0, '#5a4a40');
    grad.addColorStop(1, '#3d2f26');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, 152, 80);
    ctx.strokeStyle = '#2a2019';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, 152, 80);
    ctx.fillStyle = '#7a7a7a';
    ctx.font = 'bold 13px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('废 弃 料 斗', x + 76, y + 46);
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = '#4a3b32';
      ctx.fillRect(x + 15 + i * 25, y + 55, 15, 18);
    }
  }

  private drawScoreBubbles(now: number) {
    const ctx = this.ctx;
    this.scoreBubbles.forEach((b) => {
      const elapsed = now - b.startTime;
      const progress = elapsed / 1000;
      const y = b.y - progress * 50;
      ctx.globalAlpha = 1 - progress;
      ctx.fillStyle = b.color;
      ctx.font = 'bold 20px Courier New';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 4;
      ctx.fillText(b.text, b.x, y);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    });
  }

  private drawParticles() {
    const ctx = this.ctx;
    this.particles.forEach((p) => {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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

  private addTruck(d: TruckArrivedEvent) {
    this.trucks.push({
      id: d.id,
      type: d.type,
      startTime: d.timestamp,
      duration: 3000,
      startX: -150,
      endX: 70,
      y: 250 + (this.trucks.length % 2) * 120,
    });
  }

  private addItem(d: WasteItemEvent) {
    this.items.push({
      id: d.id,
      type: d.type,
      beltIndex: d.beltIndex,
      spawnTime: d.timestamp,
      state: 'moving',
    });
  }

  private onSortResult(d: SortResultEvent) {
    const item = this.items.find((i) => i.id === d.id);
    if (item) item.state = 'done';
    if (d.buttonX !== undefined && d.buttonY !== undefined) {
      this.scoreBubbles.push({
        x: d.buttonX,
        y: d.buttonY - 20,
        text: d.score > 0 ? `+${d.score}` : `${d.score}`,
        startTime: performance.now(),
        color: d.score > 0 ? '#4cd964' : '#ff3b30',
      });
      this.buttonFeedbacks.push({
        type: d.type,
        startTime: performance.now(),
      });
    }
  }

  private onProcessorActive(d: ProcessorActiveEvent) {
    this.activeProcessors[d.type] = d.active;
  }

  private onUpgrade(d: UpgradeEvent) {
    if (d.equipment === 'belt') this.beltLevel = d.level + 1;
    else if (d.equipment === 'processor') this.processorLevel = d.level + 1;
    else this.storageLevel = d.level + 1;
    if (d.equipment === 'belt') this.beltSpeed = 1 + 0.2 * this.beltLevel;
    if (d.equipment === 'storage') this.storageMax = Math.round(50 * (1 + 0.3 * this.storageLevel));
    this.spawnUpgradeParticles();
  }

  private onStorageUpdate(d: StorageUpdateEvent) {
    this.storageMax = d.maxCapacity;
    this.storageStates[d.type] = { count: d[d.type] as number, full: d.isFull };
  }

  private spawnUpgradeParticles() {
    const cx = 1100;
    const cy = 760;
    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * Math.PI * 2;
      const speed = 3 + Math.random() * 6;
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1500,
        maxLife: 1500,
        color: Math.random() > 0.5 ? '#ffd700' : '#ffeb3b',
        size: 2 + Math.random() * 4,
      });
    }
  }

  private handleClick(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 1200;
    const y = ((e.clientY - rect.top) / rect.height) * 900;

    const types: WasteType[] = ['plastic', 'paper', 'metal', 'electronic'];
    for (let i = 0; i < 4; i++) {
      const by = BELT_START_Y + i * BELT_GAP + BELT_HEIGHT / 2 - BUTTON_H / 2;
      const bx = BELT_START_X + BELT_LENGTH + 20;
      if (x >= bx && x <= bx + BUTTON_W && y >= by && y <= by + BUTTON_H) {
        const waitingItem = this.items.find(
          (item) => item.beltIndex === i && item.state === 'waiting'
        );
        if (waitingItem) {
          eventBus.emit('player:sort', {
            itemId: waitingItem.id,
            type: types[i],
            buttonX: bx + BUTTON_W / 2,
            buttonY: by,
          });
        }
        return;
      }
    }
  }
}
