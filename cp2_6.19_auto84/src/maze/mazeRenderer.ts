import type { MazeGrid, Cell } from './mazeGenerator';
import type { PlayerData } from '../player/playerController';
import type { ParticleEffect } from '../player/events';
import type { BeatDetector } from '../audio/beatDetector';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: string;
}

interface FloatingText {
  text: string;
  x: number;
  y: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface RedCellState {
  x: number;
  y: number;
  startTime: number;
  duration: number;
}

export class MazeRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private maze: MazeGrid;
  private mazeSize: number;
  private cellSize: number;
  private mazeOffsetX: number;
  private mazeOffsetY: number;
  private particles: Particle[];
  private maxParticles: number;
  private floatingTexts: FloatingText[];
  private redCells: RedCellState[];
  private beatConfidence: number;
  private beatPulse: number;
  private comboDisplay: number;
  private comboScale: number;
  private comboTimer: number;
  private newCombo: boolean;
  private beatDetector: BeatDetector | null = null;

  constructor(canvas: HTMLCanvasElement, maze: MazeGrid, mazeSize = 10) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    this.ctx = ctx;
    this.maze = maze;
    this.mazeSize = mazeSize;
    this.cellSize = 0;
    this.mazeOffsetX = 0;
    this.mazeOffsetY = 0;
    this.particles = [];
    this.maxParticles = 50;
    this.floatingTexts = [];
    this.redCells = [];
    this.beatConfidence = 0;
    this.beatPulse = 0;
    this.comboDisplay = 0;
    this.comboScale = 1;
    this.comboTimer = 0;
    this.newCombo = false;
    this.calculateLayout();
  }

  setBeatDetector(detector: BeatDetector): void {
    this.beatDetector = detector;
  }

  calculateLayout(): void {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const hudRight = 320;
    const bottomViz = 120;
    const mazeAreaW = w - hudRight - 80;
    const mazeAreaH = h - bottomViz - 80;
    this.cellSize = Math.floor(Math.min(mazeAreaW / this.mazeSize, mazeAreaH / this.mazeSize));
    this.mazeOffsetX = Math.floor((w - hudRight - this.cellSize * this.mazeSize) / 2);
    this.mazeOffsetY = Math.floor((h - bottomViz - this.cellSize * this.mazeSize) / 2);
  }

  onBeat(confidence: number, isStrong: boolean): void {
    this.beatConfidence = confidence;
    if (isStrong) {
      this.beatPulse = 1;
    }
  }

  onComboChange(combo: number): void {
    if (combo > this.comboDisplay) {
      this.newCombo = true;
      this.comboScale = 1.5;
      this.comboTimer = 300;
    }
    this.comboDisplay = combo;
  }

  addParticleEffect(effect: ParticleEffect): void {
    const cellX = this.mazeOffsetX + effect.x * this.cellSize + this.cellSize / 2;
    const cellY = this.mazeOffsetY + effect.y * this.cellSize + this.cellSize / 2;

    switch (effect.type) {
      case 'green_expand':
        this.spawnGreenExpand(cellX, cellY);
        break;
      case 'red_shatter':
        this.spawnRedShatter(effect.x, effect.y, cellX, cellY);
        break;
      case 'blue_ring':
        this.spawnBlueRing(cellX, cellY);
        break;
      case 'yellow_spark':
        this.spawnYellowSpark(cellX, cellY);
        break;
      case 'purple_twirl':
        this.spawnPurpleTwirl(cellX, cellY);
        break;
    }
  }

  addFloatingText(text: string, gridX: number, gridY: number, color = '#ffffff'): void {
    this.floatingTexts.push({
      text,
      x: this.mazeOffsetX + gridX * this.cellSize + this.cellSize / 2,
      y: this.mazeOffsetY + gridY * this.cellSize,
      life: 1000,
      maxLife: 1000,
      color,
      size: 18
    });
  }

  private spawnGreenExpand(x: number, y: number): void {
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20;
      this.addParticle({
        x,
        y,
        vx: Math.cos(angle) * 3,
        vy: Math.sin(angle) * 3,
        life: 300,
        maxLife: 300,
        color: '#4ade80',
        size: 6,
        type: 'green_expand'
      });
    }
  }

  private spawnRedShatter(gx: number, gy: number, x: number, y: number): void {
    this.redCells.push({
      x: gx,
      y: gy,
      startTime: performance.now(),
      duration: 500
    });
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      this.addParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 500,
        maxLife: 500,
        color: '#ef4444',
        size: 4 + Math.random() * 4,
        type: 'red_shatter'
      });
    }
  }

  private spawnBlueRing(x: number, y: number): void {
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 * i) / 16;
      this.addParticle({
        x,
        y,
        vx: Math.cos(angle) * 2.5,
        vy: Math.sin(angle) * 2.5,
        life: 400,
        maxLife: 400,
        color: '#60a5fa',
        size: 5,
        type: 'blue_ring'
      });
    }
  }

  private spawnYellowSpark(x: number, y: number): void {
    for (let i = 0; i < 25; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      this.addParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 350,
        maxLife: 350,
        color: '#facc15',
        size: 3 + Math.random() * 3,
        type: 'yellow_spark'
      });
    }
  }

  private spawnPurpleTwirl(x: number, y: number): void {
    for (let i = 0; i < 30; i++) {
      const angle = (Math.PI * 2 * i) / 30;
      const speed = 1.5 + (i % 3) * 1;
      this.addParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 500,
        maxLife: 500,
        color: '#a855f7',
        size: 5,
        type: 'purple_twirl'
      });
    }
  }

  private addParticle(p: Particle): void {
    if (this.particles.length >= this.maxParticles) {
      this.particles.shift();
    }
    this.particles.push(p);
  }

  private updateParticles(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * (deltaTime / 16);
      p.y += p.vy * (deltaTime / 16);
      p.life -= deltaTime;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private updateFloatingTexts(deltaTime: number): void {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.y -= 0.5 * (deltaTime / 16);
      t.life -= deltaTime;
      if (t.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  private updateRedCells(): void {
    const now = performance.now();
    for (let i = this.redCells.length - 1; i >= 0; i--) {
      if (now - this.redCells[i].startTime > this.redCells[i].duration) {
        this.redCells.splice(i, 1);
      }
    }
  }

  render(player: PlayerData, deltaTime: number): void {
    this.updateParticles(deltaTime);
    this.updateFloatingTexts(deltaTime);
    this.updateRedCells();

    if (this.beatPulse > 0) {
      this.beatPulse = Math.max(0, this.beatPulse - deltaTime / 300);
    }
    if (this.comboTimer > 0) {
      this.comboTimer -= deltaTime;
      this.comboScale = 1 + 0.5 * (this.comboTimer / 300);
    } else {
      this.comboScale = 1;
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawBackground();
    this.drawMaze();
    this.drawPlayer(player);
    this.drawParticles();
    this.drawFloatingTexts();
    this.drawHUD(player);
    this.drawVisualizer();
  }

  private drawBackground(): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#1e1e2e');
    grad.addColorStop(1, '#11111b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const brickW = 64;
    const brickH = 32;
    ctx.strokeStyle = 'rgba(60, 60, 80, 0.3)';
    ctx.lineWidth = 1;
    for (let y = 0; y < h; y += brickH) {
      const offset = (Math.floor(y / brickH) % 2) * (brickW / 2);
      for (let x = -brickW; x < w + brickW; x += brickW) {
        ctx.strokeRect(x + offset, y, brickW, brickH);
      }
    }
  }

  private getCellColor(cell: Cell): string {
    const alpha = 0.5;
    switch (cell.color) {
      case 'red': return `rgba(239, 68, 68, ${alpha})`;
      case 'green': return `rgba(74, 222, 128, ${alpha})`;
      case 'blue': return `rgba(96, 165, 250, ${alpha})`;
      case 'yellow': return `rgba(250, 204, 21, ${alpha})`;
      case 'purple': return `rgba(168, 85, 247, ${alpha})`;
      case 'gold': return `rgba(251, 191, 36, ${alpha})`;
      case 'entrance': return `rgba(100, 116, 139, ${alpha})`;
      default: return `rgba(100, 100, 100, ${alpha})`;
    }
  }

  private drawMaze(): void {
    const ctx = this.ctx;
    const size = this.cellSize;

    for (let y = 0; y < this.mazeSize; y++) {
      for (let x = 0; x < this.mazeSize; x++) {
        const cell = this.maze[y][x];
        const px = this.mazeOffsetX + x * size;
        const py = this.mazeOffsetY + y * size;

        let fillColor = this.getCellColor(cell);

        const redCell = this.redCells.find(c => c.x === x && c.y === y);
        if (redCell) {
          const progress = (performance.now() - redCell.startTime) / redCell.duration;
          const darkAlpha = 0.3 + 0.5 * (1 - progress);
          fillColor = `rgba(127, 29, 29, ${darkAlpha})`;
        }

        if (cell.isExit) {
          const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 150 + this.beatPulse * 2);
          fillColor = `rgba(251, 191, 36, ${0.4 + 0.4 * pulse})`;
        }

        ctx.fillStyle = fillColor;
        ctx.fillRect(px + 2, py + 2, size - 4, size - 4);

        ctx.strokeStyle = 'rgba(100, 100, 120, 0.6)';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 2, py + 2, size - 4, size - 4);

        if (cell.visited && !cell.isExit && !cell.isEntrance) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
          ctx.fillRect(px + 2, py + 2, size - 4, size - 4);
        }

        if (cell.isEntrance) {
          ctx.fillStyle = '#94a3b8';
          ctx.font = `${Math.floor(size * 0.3)}px 'Courier New', monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('起', px + size / 2, py + size / 2);
        }
        if (cell.isExit) {
          const glowSize = size * 0.4 + this.beatPulse * 4;
          ctx.save();
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 15 + this.beatPulse * 20;
          ctx.fillStyle = '#fde68a';
          ctx.font = `bold ${Math.floor(glowSize)}px 'Courier New', monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('★', px + size / 2, py + size / 2);
          ctx.restore();
        }
      }
    }
  }

  private drawPlayer(player: PlayerData): void {
    const ctx = this.ctx;
    const size = this.cellSize;
    let offsetX = 0;
    let offsetY = 0;

    if (player.isMoving) {
      const bounce = Math.sin(player.bounceProgress * Math.PI) * 8;
      offsetY = -bounce;
    }

    const cx = this.mazeOffsetX + player.x * size + size / 2 + offsetX;
    const cy = this.mazeOffsetY + player.y * size + size / 2 + offsetY;
    const ps = Math.min(size * 0.6, 32);

    if (player.beatFlash) {
      ctx.save();
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 25;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(cx, cy, ps * 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (this.comboDisplay > 5) {
      const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 200);
      ctx.save();
      ctx.strokeStyle = `rgba(96, 165, 250, ${0.5 + 0.3 * pulse})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, ps * (1.1 + 0.1 * pulse), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    const bx = cx - ps / 2;
    const by = cy - ps / 2;

    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(bx + ps * 0.15, by + ps * 0.1, ps * 0.7, ps * 0.45);

    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(bx + ps * 0.2, by + ps * 0.15, ps * 0.6, ps * 0.3);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(bx + ps * 0.3, by + ps * 0.25, ps * 0.1, ps * 0.1);
    ctx.fillRect(bx + ps * 0.6, by + ps * 0.25, ps * 0.1, ps * 0.1);

    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(bx + ps * 0.2, by + ps * 0.55, ps * 0.25, ps * 0.35);
    ctx.fillRect(bx + ps * 0.55, by + ps * 0.55, ps * 0.25, ps * 0.35);

    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(bx + ps * 0.2, by + ps * 0.88, ps * 0.25, ps * 0.12);
    ctx.fillRect(bx + ps * 0.55, by + ps * 0.88, ps * 0.25, ps * 0.12);
  }

  private drawParticles(): void {
    const ctx = this.ctx;
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      ctx.restore();
    }
  }

  private drawFloatingTexts(): void {
    const ctx = this.ctx;
    for (const t of this.floatingTexts) {
      const alpha = t.life / t.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = t.color;
      ctx.font = `bold ${t.size}px 'Courier New', monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = t.color;
      ctx.shadowBlur = 10;
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    }
  }

  private drawHUD(player: PlayerData): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const padding = 20;
    const hudW = 280;
    const hudX = w - hudW - padding;
    const hudY = padding;
    let currentY = hudY;

    ctx.save();
    ctx.fillStyle = 'rgba(15, 15, 25, 0.8)';
    ctx.strokeStyle = 'rgba(100, 100, 140, 0.5)';
    ctx.lineWidth = 2;
    this.roundRect(ctx, hudX, hudY, hudW, 320, 12);
    ctx.fill();
    ctx.stroke();

    currentY += 25;
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('⚡ 连击', hudX + 20, currentY);

    const comboValue = this.comboDisplay;
    const comboIsGold = comboValue >= 10;
    let comboColor = '#4ade80';
    if (comboValue >= 5) comboColor = '#60a5fa';
    if (comboIsGold) comboColor = '#fbbf24';

    const baseFontSize = 42;
    const fontSize = comboIsGold ? baseFontSize * this.comboScale : baseFontSize;
    ctx.save();
    if (comboIsGold) {
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 20;
    }
    ctx.fillStyle = comboColor;
    ctx.font = `bold ${Math.floor(fontSize)}px 'Courier New', monospace`;
    ctx.textAlign = 'right';
    ctx.fillText(`${comboValue}`, hudX + hudW - 20, currentY - 5);
    ctx.restore();

    if (this.newCombo && this.comboTimer > 0 && comboValue > 0) {
      const plusX = hudX + hudW - 60 - this.comboScale * 30;
      ctx.save();
      ctx.globalAlpha = this.comboTimer / 300;
      ctx.fillStyle = '#fde047';
      ctx.font = `bold 24px 'Courier New', monospace`;
      ctx.fillText(`+${this.comboDisplay > 1 ? '1' : ''}`, plusX, currentY + 5);
      ctx.restore();
    }
    this.newCombo = false;

    currentY += 65;
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('❤ 能量', hudX + 20, currentY);

    currentY += 28;
    const barW = hudW - 40;
    const barH = 22;
    const barX = hudX + 20;
    const barY = currentY;

    ctx.fillStyle = 'rgba(30, 30, 50, 0.9)';
    this.roundRect(ctx, barX, barY, barW, barH, 5);
    ctx.fill();

    const energyPercent = player.energy / player.maxEnergy;
    const fillW = Math.max(0, barW * energyPercent);

    let energyGrad;
    if (energyPercent > 0.5) {
      energyGrad = ctx.createLinearGradient(barX, barY, barX + fillW, barY);
      energyGrad.addColorStop(0, '#4ade80');
      energyGrad.addColorStop(1, '#86efac');
    } else if (energyPercent > 0.2) {
      energyGrad = ctx.createLinearGradient(barX, barY, barX + fillW, barY);
      energyGrad.addColorStop(0, '#fb923c');
      energyGrad.addColorStop(1, '#fdba74');
    } else {
      const blink = Math.sin(performance.now() / 100) > 0 ? 1 : 0.4;
      energyGrad = ctx.createLinearGradient(barX, barY, barX + fillW, barY);
      energyGrad.addColorStop(0, `rgba(239, 68, 68, ${blink})`);
      energyGrad.addColorStop(1, `rgba(248, 113, 113, ${blink})`);
    }
    ctx.fillStyle = energyGrad;
    this.roundRect(ctx, barX + 2, barY + 2, Math.max(0, fillW - 4), barH - 4, 4);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${player.energy}/${player.maxEnergy}`, barX + barW / 2, barY + barH / 2);

    currentY += 50;
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('🎵 节拍', hudX + 20, currentY);

    currentY += 28;
    const spectrumX = hudX + 20;
    const spectrumY = currentY;
    const spectrumW = hudW - 40;
    const spectrumH = 80;
    const centerX = spectrumX + spectrumW / 2;
    const centerY = spectrumY + spectrumH / 2;
    const bars = 32;
    const radius = 28;

    const freqData = this.beatDetector ? this.beatDetector.getFrequencyData() : new Uint8Array(bars);
    const step = Math.floor(freqData.length / bars);

    for (let i = 0; i < bars; i++) {
      const angle = (Math.PI * 2 * i) / bars - Math.PI / 2;
      const dataIdx = Math.min(i * step, freqData.length - 1);
      const value = freqData[dataIdx] || (this.beatConfidence * 200);
      const barLen = 8 + (value / 255) * 25;

      const x1 = centerX + Math.cos(angle) * radius;
      const y1 = centerY + Math.sin(angle) * radius;
      const x2 = centerX + Math.cos(angle) * (radius + barLen);
      const y2 = centerY + Math.sin(angle) * (radius + barLen);

      const alpha = 0.5 + (value / 255) * 0.5;
      const hue = 220 + (i / bars) * 80;
      ctx.save();
      ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${alpha})`;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.fillStyle = `rgba(96, 165, 250, ${0.3 + this.beatPulse * 0.5})`;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 10 + this.beatPulse * 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = this.beatConfidence > 0.7 ? '#4ade80' : '#64748b';
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.floor(this.beatConfidence * 100)}%`, centerX, centerY + 4);

    ctx.restore();
  }

  private drawVisualizer(): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const vizH = 80;
    const vizY = h - vizH - 15;
    const padding = 40;
    const vizW = w - padding * 2 - 320;
    const barCount = 32;
    const gap = 4;
    const barW = (vizW - gap * (barCount - 1)) / barCount;

    ctx.save();
    ctx.fillStyle = 'rgba(15, 15, 25, 0.6)';
    this.roundRect(ctx, padding, vizY, vizW, vizH, 8);
    ctx.fill();

    const freqData = this.beatDetector ? this.beatDetector.getFrequencyData() : new Uint8Array(barCount);
    const step = Math.floor(freqData.length / barCount);

    for (let i = 0; i < barCount; i++) {
      const dataIdx = Math.min(i * step, freqData.length - 1);
      const value = freqData[dataIdx] || (this.beatConfidence * 180);
      const bh = (value / 255) * (vizH - 20);
      const x = padding + i * (barW + gap);
      const y = vizY + vizH - 10 - bh;

      const hue = 220 + (i / barCount) * 80;
      const grad = ctx.createLinearGradient(x, y, x, y + bh);
      grad.addColorStop(0, `hsla(${hue}, 80%, 70%, 0.95)`);
      grad.addColorStop(1, `hsla(${hue + 40}, 70%, 50%, 0.7)`);

      ctx.fillStyle = grad;
      ctx.shadowColor = `hsla(${hue}, 80%, 60%, 0.6)`;
      ctx.shadowBlur = 8;
      this.roundRect(ctx, x, y, barW, bh, 2);
      ctx.fill();
    }

    const nextBeat = this.beatDetector ? this.beatDetector.getTimeToNextBeat() : 0;
    const beatInterval = this.beatDetector ? this.beatDetector.getBeatInterval() : 500;
    const beatProgress = 1 - nextBeat / beatInterval;
    const beatX = padding + vizW * beatProgress;

    ctx.strokeStyle = `rgba(251, 191, 36, ${0.5 + this.beatPulse * 0.5})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(beatX, vizY + 5);
    ctx.lineTo(beatX, vizY + vizH - 5);
    ctx.stroke();

    ctx.restore();
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ): void {
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

  handleResize(): void {
    this.calculateLayout();
  }
}
