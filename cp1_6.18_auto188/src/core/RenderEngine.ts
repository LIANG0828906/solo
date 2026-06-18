import { MazeEngine, CELL_SIZE, GRID_SIZE, MAZE_PIXEL_SIZE, ChestType, WallMaterial } from './MazeEngine';
import { SonarEngine, Pulse } from './SonarEngine';

const PLAYER_RADIUS = 30;
const LIGHT_RADIUS = 128;
const LIGHT_FEATHER = 30;
const TRAP_RADIUS = 12;
const CHEST_SIZE = 24;

const COLOR_BG = '#0D0D1A';
const COLOR_PANEL = '#1A1A2E';
const COLOR_PANEL_BORDER = '#2A2A3E';
const COLOR_TEXT = '#E0E0E0';
const COLOR_LIGHT = '#64B5F6';
const COLOR_STONE = '#9E9E9E';
const COLOR_WOOD = '#8D6E63';
const COLOR_CRYSTAL = '#CE93D8';
const COLOR_CHEST_NORMAL = '#8D6E63';
const COLOR_CHEST_NORMAL_BORDER = '#6D4C41';
const COLOR_CHEST_RARE = '#B0BEC5';
const COLOR_CHEST_LEGENDARY = '#FFD700';
const COLOR_TRAP = '#E53935';
const COLOR_HP_BG = '#333333';
const COLOR_MINIMAP_BG = 'rgba(0,0,0,0.6)';
const COLOR_MINIMAP_WALL = '#BDBDBD';
const COLOR_MINIMAP_PLAYER = '#FFFFFF';
const COLOR_MINIMAP_CHEST = '#FFD700';
const COLOR_MINIMAP_TRAP = '#E53935';

const MATERIAL_COLORS: Record<WallMaterial, string> = {
  stone: COLOR_STONE,
  wood: COLOR_WOOD,
  crystal: COLOR_CRYSTAL
};

const CHEST_COLORS: Record<ChestType, { fill: string; border: string; glow: string }> = {
  normal: { fill: COLOR_CHEST_NORMAL, border: COLOR_CHEST_NORMAL_BORDER, glow: 'transparent' },
  rare: { fill: COLOR_CHEST_RARE, border: '#FFFFFF', glow: '#FFFFFF' },
  legendary: { fill: COLOR_CHEST_LEGENDARY, border: '#FFD700', glow: '#FFD700' }
};

export class RenderEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private maze: MazeEngine;
  private sonar: SonarEngine;
  private time: number = 0;
  private playerRipplePhase: number = 0;
  private particles: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string }[] = [];

  constructor(canvas: HTMLCanvasElement, maze: MazeEngine, sonar: SonarEngine) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.maze = maze;
    this.sonar = sonar;
  }

  resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.maze.offsetX = Math.floor((this.canvas.width - MAZE_PIXEL_SIZE) / 2);
    this.maze.offsetY = Math.floor((this.canvas.height - MAZE_PIXEL_SIZE) / 2);
  }

  render(dt: number): void {
    this.time += dt;
    this.playerRipplePhase += dt;
    if (this.playerRipplePhase > 1) this.playerRipplePhase -= 1;
    this.updateParticles(dt);

    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, w, h);

    this.drawMaze(ctx);
    this.drawVisibility(ctx);
    this.drawPulses(ctx);
    this.drawReflections(ctx);
    this.drawChestReveals(ctx);
    this.drawPlayer(ctx);
    this.drawUI(ctx, w, h);
    this.drawMinimap(ctx, w, h);
    this.drawDamageFlash(ctx, w, h);

    if (this.maze.player.dead) {
      this.drawGameOver(ctx, w, h);
    } else if (this.maze.player.won) {
      this.drawWin(ctx, w, h);
    }
  }

  private drawMaze(ctx: CanvasRenderingContext2D): void {
    const ox = this.maze.offsetX;
    const oy = this.maze.offsetY;
    const px = this.maze.player.pixelX;
    const py = this.maze.player.pixelY;

    for (let gy = 0; gy < GRID_SIZE; gy++) {
      for (let gx = 0; gx < GRID_SIZE; gx++) {
        const cell = this.maze.grid[gy][gx];
        const cellPx = ox + gx * CELL_SIZE;
        const cellPy = oy + gy * CELL_SIZE;
        const cellCenterX = cellPx + CELL_SIZE / 2;
        const cellCenterY = cellPy + CELL_SIZE / 2;
        const distToPlayer = Math.sqrt((cellCenterX - px) ** 2 + (cellCenterY - py) ** 2);
        const visible = distToPlayer <= LIGHT_RADIUS + CELL_SIZE;

        if (!visible) continue;

        ctx.fillStyle = '#111122';
        ctx.fillRect(cellPx, cellPy, CELL_SIZE, CELL_SIZE);

        const wallColor = MATERIAL_COLORS[cell.wallMaterial];
        ctx.strokeStyle = wallColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        if (cell.walls.top) {
          ctx.moveTo(cellPx, cellPy);
          ctx.lineTo(cellPx + CELL_SIZE, cellPy);
        }
        if (cell.walls.right) {
          ctx.moveTo(cellPx + CELL_SIZE, cellPy);
          ctx.lineTo(cellPx + CELL_SIZE, cellPy + CELL_SIZE);
        }
        if (cell.walls.bottom) {
          ctx.moveTo(cellPx, cellPy + CELL_SIZE);
          ctx.lineTo(cellPx + CELL_SIZE, cellPy + CELL_SIZE);
        }
        if (cell.walls.left) {
          ctx.moveTo(cellPx, cellPy);
          ctx.lineTo(cellPx, cellPy + CELL_SIZE);
        }
        ctx.stroke();

        if (cell.content) {
          if (cell.content.type === 'chest' && !cell.content.collected) {
            this.drawChest(ctx, cellCenterX, cellCenterY, cell.content.chestType);
          } else if (cell.content.type === 'trap' && !cell.content.triggered) {
            this.drawTrap(ctx, cellCenterX, cellCenterY);
          }
        }
      }
    }

    if (this.maze.exitOpen) {
      const ex = ox + this.maze.exitX * CELL_SIZE + CELL_SIZE / 2;
      const ey = oy + this.maze.exitY * CELL_SIZE + CELL_SIZE / 2;
      const distToPlayer = Math.sqrt((ex - px) ** 2 + (ey - py) ** 2);
      if (distToPlayer <= LIGHT_RADIUS + CELL_SIZE) {
        const pulse = 0.5 + 0.5 * Math.sin(this.time * 4);
        ctx.fillStyle = `rgba(0,229,255,${0.2 + pulse * 0.3})`;
        ctx.beginPath();
        ctx.arc(ex, ey, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#00E5FF';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = COLOR_TEXT;
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('出口', ex, ey + 4);
      }
    }
  }

  private drawChest(ctx: CanvasRenderingContext2D, cx: number, cy: number, chestType: ChestType): void {
    const colors = CHEST_COLORS[chestType];
    const halfSize = CHEST_SIZE / 2;
    if (chestType === 'rare') {
      ctx.shadowColor = colors.glow;
      ctx.shadowBlur = 6;
    }
    if (chestType === 'legendary') {
      ctx.shadowColor = colors.glow;
      ctx.shadowBlur = 10;
      if (Math.random() < 0.15) {
        for (let i = 0; i < 3; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 15 + Math.random() * 30;
          this.particles.push({
            x: cx, y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0.8, maxLife: 0.8,
            color: COLOR_CHEST_LEGENDARY
          });
        }
      }
    }
    ctx.fillStyle = colors.fill;
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = chestType === 'rare' ? 2 : 1;
    this.roundRect(ctx, cx - halfSize, cy - halfSize, CHEST_SIZE, CHEST_SIZE, 4);
    ctx.fill();
    ctx.stroke();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }

  private drawTrap(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    const blink = 0.4 + 0.6 * Math.abs(Math.sin(this.time * Math.PI / 1.5));
    ctx.fillStyle = `rgba(229,57,53,${blink * 0.7})`;
    ctx.beginPath();
    ctx.arc(cx, cy, TRAP_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawVisibility(ctx: CanvasRenderingContext2D): void {
    const px = this.maze.player.pixelX;
    const py = this.maze.player.pixelY;
    const ox = this.maze.offsetX;
    const oy = this.maze.offsetY;

    ctx.save();
    ctx.fillStyle = COLOR_BG;
    ctx.beginPath();
    ctx.rect(ox, oy, MAZE_PIXEL_SIZE, MAZE_PIXEL_SIZE);
    ctx.arc(px, py, LIGHT_RADIUS + LIGHT_FEATHER, 0, Math.PI * 2, true);
    ctx.fill();

    const gradient = ctx.createRadialGradient(px, py, LIGHT_RADIUS - LIGHT_FEATHER, px, py, LIGHT_RADIUS + LIGHT_FEATHER);
    gradient.addColorStop(0, 'rgba(100,181,246,0.08)');
    gradient.addColorStop(0.5, 'rgba(100,181,246,0.03)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(px, py, LIGHT_RADIUS + LIGHT_FEATHER, 0, Math.PI * 2);
    ctx.fill();

    const innerGrad = ctx.createRadialGradient(px, py, 0, px, py, LIGHT_RADIUS);
    innerGrad.addColorStop(0, 'rgba(100,181,246,0.06)');
    innerGrad.addColorStop(0.7, 'rgba(100,181,246,0.02)');
    innerGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = innerGrad;
    ctx.beginPath();
    ctx.arc(px, py, LIGHT_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawPlayer(ctx: CanvasRenderingContext2D): void {
    const px = this.maze.player.pixelX;
    const py = this.maze.player.pixelY;
    const phase = this.playerRipplePhase;

    for (let ring = 0; ring < 3; ring++) {
      const ringPhase = (phase + ring * 0.33) % 1;
      const ringRadius = PLAYER_RADIUS * (0.3 + ringPhase * 0.7);
      const alpha = 0.5 * (1 - ringPhase);
      ctx.strokeStyle = `rgba(100,181,246,${alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(100,181,246,0.6)';
    ctx.beginPath();
    ctx.arc(px, py, 8, 0, Math.PI * 2);
    ctx.fill();

    const glowGrad = ctx.createRadialGradient(px, py, 0, px, py, PLAYER_RADIUS);
    glowGrad.addColorStop(0, 'rgba(100,181,246,0.15)');
    glowGrad.addColorStop(1, 'rgba(100,181,246,0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(px, py, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawPulses(ctx: CanvasRenderingContext2D): void {
    const pulses = this.sonar.getActivePulses();
    for (const pulse of pulses) {
      const alpha = Math.max(0, 0.4 * (1 - pulse.radius / pulse.maxRadius));
      ctx.save();
      ctx.translate(pulse.originX, pulse.originY);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, pulse.radius, pulse.angle - Math.PI / 4, pulse.angle + Math.PI / 4);
      ctx.closePath();
      ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
      ctx.lineWidth = 3;
      ctx.stroke();

      const innerAlpha = alpha * 0.3;
      ctx.fillStyle = `rgba(255,255,255,${innerAlpha})`;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, pulse.radius, pulse.angle - Math.PI / 4, pulse.angle + Math.PI / 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  private drawReflections(ctx: CanvasRenderingContext2D): void {
    for (const ref of this.maze.reflections) {
      const alpha = 0.3 * (1 - ref.age / ref.maxAge);
      const color = MATERIAL_COLORS[ref.wallMaterial];
      ctx.save();
      ctx.translate(ref.wallPixelX, ref.wallPixelY);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 40, ref.direction - Math.PI / 8, ref.direction + Math.PI / 8);
      ctx.closePath();
      ctx.fillStyle = color.replace(')', `,${alpha})`).replace('rgb', 'rgba');
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.fill();
      ctx.restore();
    }
  }

  private drawChestReveals(ctx: CanvasRenderingContext2D): void {
    for (const reveal of this.maze.chestReveals) {
      const px = this.maze.offsetX + reveal.gridX * CELL_SIZE + CELL_SIZE / 2;
      const py = this.maze.offsetY + reveal.gridY * CELL_SIZE + CELL_SIZE / 2;
      const blink = 0.5 + 0.5 * Math.sin(this.time * Math.PI * 4);
      const alpha = blink * (1 - reveal.age / reveal.maxAge);
      ctx.fillStyle = `rgba(255,215,0,${alpha})`;
      ctx.beginPath();
      ctx.arc(px, py, 10, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawParticles(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      ctx.fillStyle = p.color.replace(')', `,${alpha})`).replace('rgb', 'rgba');
      const r = parseInt(p.color.slice(1, 3), 16);
      const g = parseInt(p.color.slice(3, 5), 16);
      const b = parseInt(p.color.slice(5, 7), 16);
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private drawUI(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    this.drawTitle(ctx, w);
    this.drawHealthBar(ctx);
    this.drawFrequencyButtons(ctx, w, h);
    this.drawChestCounter(ctx);
    this.drawParticles(ctx);
  }

  private drawTitle(ctx: CanvasRenderingContext2D, w: number): void {
    const breath = 0.7 + 0.3 * Math.sin(this.time * Math.PI * 2 / 0.5);
    ctx.save();
    ctx.font = '28px monospace';
    ctx.textAlign = 'center';
    const gradient = ctx.createLinearGradient(w / 2 - 80, 0, w / 2 + 80, 0);
    gradient.addColorStop(0, `rgba(0,229,255,${breath})`);
    gradient.addColorStop(1, `rgba(118,255,3,${breath})`);
    ctx.fillStyle = gradient;
    ctx.shadowColor = '#00E5FF';
    ctx.shadowBlur = 10 * breath;
    ctx.fillText('回声迷藏', w / 2, 40);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  private drawHealthBar(ctx: CanvasRenderingContext2D): void {
    const x = 20;
    const y = 20;
    const barWidth = 200;
    const barHeight = 20;
    const hpRatio = this.maze.player.hp / this.maze.player.maxHp;

    ctx.fillStyle = COLOR_HP_BG;
    this.roundRect(ctx, x, y, barWidth, barHeight, 6);
    ctx.fill();

    const hpGrad = ctx.createLinearGradient(x, y, x + barWidth * hpRatio, y);
    hpGrad.addColorStop(0, '#E53935');
    hpGrad.addColorStop(1, '#FF8A80');
    ctx.fillStyle = hpGrad;
    this.roundRect(ctx, x, y, barWidth * hpRatio, barHeight, 6);
    ctx.fill();

    ctx.strokeStyle = COLOR_PANEL_BORDER;
    ctx.lineWidth = 1;
    this.roundRect(ctx, x, y, barWidth, barHeight, 6);
    ctx.stroke();

    ctx.fillStyle = COLOR_TEXT;
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.maze.player.hp}/${this.maze.player.maxHp}`, x + barWidth / 2, y + 15);
  }

  private drawFrequencyButtons(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const btnWidth = 80;
    const btnHeight = 36;
    const gap = 12;
    const totalWidth = btnWidth * 3 + gap * 2;
    const startX = (w - totalWidth) / 2;
    const startY = h - 60;

    const labels = ['低音 40Hz', '中音 200Hz', '高音 1000Hz'];
    const colors = ['#2196F3', '#4CAF50', '#FF9800'];

    for (let i = 0; i < 3; i++) {
      const bx = startX + i * (btnWidth + gap);
      const grad = ctx.createLinearGradient(bx, startY, bx, startY + btnHeight);
      grad.addColorStop(0, '#1A1A2E');
      grad.addColorStop(1, '#2A2A3E');
      ctx.fillStyle = grad;
      this.roundRect(ctx, bx, startY, btnWidth, btnHeight, 8);
      ctx.fill();
      ctx.strokeStyle = COLOR_PANEL_BORDER;
      ctx.lineWidth = 1;
      this.roundRect(ctx, bx, startY, btnWidth, btnHeight, 8);
      ctx.stroke();

      ctx.fillStyle = colors[i];
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(labels[i], bx + btnWidth / 2, startY + btnHeight / 2 + 4);
    }
  }

  private drawChestCounter(ctx: CanvasRenderingContext2D): void {
    const x = 20;
    const y = 52;
    ctx.fillStyle = COLOR_TEXT;
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`宝箱: ${this.maze.player.chestsCollected}/3`, x, y);
    if (this.maze.exitOpen) {
      ctx.fillStyle = '#00E5FF';
      ctx.fillText('出口已开启!', x, y + 20);
    }
  }

  private drawMinimap(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const mapSize = 200;
    const mapX = w - mapSize - 15;
    const mapY = 15;
    const cellMapSize = mapSize / GRID_SIZE;

    ctx.fillStyle = COLOR_MINIMAP_BG;
    this.roundRect(ctx, mapX, mapY, mapSize, mapSize, 12);
    ctx.fill();
    ctx.strokeStyle = COLOR_PANEL_BORDER;
    ctx.lineWidth = 1;
    this.roundRect(ctx, mapX, mapY, mapSize, mapSize, 12);
    ctx.stroke();

    for (let gy = 0; gy < GRID_SIZE; gy++) {
      for (let gx = 0; gx < GRID_SIZE; gx++) {
        const key = `${gx},${gy}`;
        if (!this.maze.exploredCells.has(key)) continue;
        const cell = this.maze.grid[gy][gx];
        const cx = mapX + gx * cellMapSize;
        const cy = mapY + gy * cellMapSize;

        ctx.fillStyle = '#1A1A2E';
        ctx.fillRect(cx, cy, cellMapSize, cellMapSize);

        ctx.strokeStyle = COLOR_MINIMAP_WALL;
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (cell.walls.top) { ctx.moveTo(cx, cy); ctx.lineTo(cx + cellMapSize, cy); }
        if (cell.walls.right) { ctx.moveTo(cx + cellMapSize, cy); ctx.lineTo(cx + cellMapSize, cy + cellMapSize); }
        if (cell.walls.bottom) { ctx.moveTo(cx, cy + cellMapSize); ctx.lineTo(cx + cellMapSize, cy + cellMapSize); }
        if (cell.walls.left) { ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + cellMapSize); }
        ctx.stroke();

        if (cell.content) {
          if (cell.content.type === 'chest' && !cell.content.collected) {
            ctx.fillStyle = COLOR_MINIMAP_CHEST;
            ctx.beginPath();
            ctx.arc(cx + cellMapSize / 2, cy + cellMapSize / 2, 3, 0, Math.PI * 2);
            ctx.fill();
          } else if (cell.content.type === 'trap' && !cell.content.triggered) {
            ctx.fillStyle = COLOR_MINIMAP_TRAP;
            ctx.beginPath();
            ctx.arc(cx + cellMapSize / 2, cy + cellMapSize / 2, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    for (const ref of this.maze.reflections) {
      const alpha = 0.4 * (1 - ref.age / ref.maxAge);
      const rmx = mapX + ((ref.wallPixelX - this.maze.offsetX) / MAZE_PIXEL_SIZE) * mapSize;
      const rmy = mapY + ((ref.wallPixelY - this.maze.offsetY) / MAZE_PIXEL_SIZE) * mapSize;
      const matColor = MATERIAL_COLORS[ref.wallMaterial];
      const r = parseInt(matColor.slice(1, 3), 16);
      const g = parseInt(matColor.slice(3, 5), 16);
      const b = parseInt(matColor.slice(5, 7), 16);
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.beginPath();
      ctx.moveTo(rmx, rmy);
      ctx.arc(rmx, rmy, 12, ref.direction - Math.PI / 8, ref.direction + Math.PI / 8);
      ctx.closePath();
      ctx.fill();
    }

    const playerMX = mapX + (this.maze.player.gridX + 0.5) * cellMapSize;
    const playerMY = mapY + (this.maze.player.gridY + 0.5) * cellMapSize;
    ctx.fillStyle = COLOR_MINIMAP_PLAYER;
    ctx.beginPath();
    ctx.arc(playerMX, playerMY, 4, 0, Math.PI * 2);
    ctx.fill();

    if (this.maze.exitOpen) {
      const exMX = mapX + (this.maze.exitX + 0.5) * cellMapSize;
      const exMY = mapY + (this.maze.exitY + 0.5) * cellMapSize;
      ctx.fillStyle = '#00E5FF';
      ctx.beginPath();
      ctx.arc(exMX, exMY, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawDamageFlash(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    if (this.maze.damageFlash > 0) {
      const alpha = this.maze.damageFlash / 0.3;
      ctx.strokeStyle = `rgba(229,57,53,${alpha * 0.8})`;
      ctx.lineWidth = 8;
      ctx.strokeRect(4, 4, w - 8, h - 8);
    }
  }

  private drawGameOver(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.fillStyle = 'rgba(13,13,26,0.8)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#E53935';
    ctx.font = '36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('游戏结束', w / 2, h / 2 - 20);
    ctx.fillStyle = COLOR_TEXT;
    ctx.font = '16px monospace';
    ctx.fillText('点击重新开始', w / 2, h / 2 + 30);
  }

  private drawWin(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.fillStyle = 'rgba(13,13,26,0.8)';
    ctx.fillRect(0, 0, w, h);
    const breath = 0.7 + 0.3 * Math.sin(this.time * 3);
    ctx.fillStyle = `rgba(0,229,255,${breath})`;
    ctx.font = '36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('恭喜通关!', w / 2, h / 2 - 20);
    ctx.fillStyle = COLOR_TEXT;
    ctx.font = '16px monospace';
    ctx.fillText('点击重新开始', w / 2, h / 2 + 30);
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

  getFrequencyButtonAt(mx: number, my: number): number | null {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const btnWidth = 80;
    const btnHeight = 36;
    const gap = 12;
    const totalWidth = btnWidth * 3 + gap * 2;
    const startX = (w - totalWidth) / 2;
    const startY = h - 60;
    for (let i = 0; i < 3; i++) {
      const bx = startX + i * (btnWidth + gap);
      if (mx >= bx && mx <= bx + btnWidth && my >= startY && my <= startY + btnHeight) {
        return i;
      }
    }
    return null;
  }
}
