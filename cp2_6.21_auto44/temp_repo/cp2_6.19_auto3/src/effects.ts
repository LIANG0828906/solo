import { MapData, TileType } from './mapGen';
import { Player, Monster, Direction } from './entities';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  gravity: number;
}

const COLORS = {
  bg: '#0a0514',
  wall: '#2d1b4e',
  wallHi: '#3d2560',
  wallLo: '#1a0f2e',
  floor: '#1a0f2e',
  floorHi: '#24163d',
  start: '#3d5afe',
  exit: '#4caf50',
  exitGlow: '#81c784',
  gem: '#ffd700',
  gemHi: '#ffec80',
  player: '#64b5f6',
  playerHi: '#bbdefb',
  monster: '#e53935',
  monsterHi: '#ff8a80',
  monsterChase: '#ff6d00',
  text: '#ffffff',
};

export interface TouchDirResult {
  dx: number;
  dy: number;
}

export class Renderer {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  tileSize: number = 32;
  offsetX: number = 0;
  offsetY: number = 0;
  particles: Particle[] = [];
  gemBobTime: number = 0;
  exitGlowTime: number = 0;
  swipeIndicatorFade: number = 0;
  swipeLastDir: Direction | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('无法获取 Canvas 2D 上下文');
    this.ctx = ctx;
    this.ctx.imageSmoothingEnabled = false;
  }

  resize(map: MapData): void {
    const container = this.canvas.parentElement;
    if (!container) return;

    const maxW = container.clientWidth;
    const maxH = container.clientHeight;
    const tileW = Math.floor(maxW / map.width);
    const tileH = Math.floor(maxH / map.height);
    this.tileSize = Math.max(16, Math.min(tileW, tileH, 48));

    const canvasW = this.tileSize * map.width;
    const canvasH = this.tileSize * map.height;

    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = canvasW * dpr;
    this.canvas.height = canvasH * dpr;
    this.canvas.style.width = `${canvasW}px`;
    this.canvas.style.height = `${canvasH}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = false;

    this.offsetX = 0;
    this.offsetY = 0;
  }

  clear(): void {
    this.ctx.fillStyle = COLORS.bg;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawMap(map: MapData, allGemsCollected: boolean): void {
    const ts = this.tileSize;
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const tile = map.grid[y][x];
        const px = this.offsetX + x * ts;
        const py = this.offsetY + y * ts;

        if (tile === TileType.WALL) {
          this.ctx.fillStyle = COLORS.wall;
          this.ctx.fillRect(px, py, ts, ts);
          this.ctx.fillStyle = COLORS.wallHi;
          this.ctx.fillRect(px, py, ts, 2);
          this.ctx.fillRect(px, py, 2, ts);
          this.ctx.fillStyle = COLORS.wallLo;
          this.ctx.fillRect(px, py + ts - 2, ts, 2);
          this.ctx.fillRect(px + ts - 2, py, 2, ts);
        } else {
          this.ctx.fillStyle = COLORS.floor;
          this.ctx.fillRect(px, py, ts, ts);
          if ((x + y) % 2 === 0) {
            this.ctx.fillStyle = COLORS.floorHi;
            this.ctx.fillRect(px + 2, py + 2, ts - 4, ts - 4);
          }
          this.ctx.strokeStyle = 'rgba(45, 27, 78, 0.3)';
          this.ctx.lineWidth = 1;
          this.ctx.strokeRect(px + 0.5, py + 0.5, ts - 1, ts - 1);

          if (tile === TileType.START) {
            this.ctx.fillStyle = 'rgba(61, 90, 254, 0.3)';
            this.ctx.fillRect(px + 2, py + 2, ts - 4, ts - 4);
          } else if (tile === TileType.EXIT) {
            this.drawExit(px, py, ts, allGemsCollected);
          } else if (tile === TileType.GEM) {
            // gem is drawn separately with bobbing
          }
        }
      }
    }
  }

  private drawExit(px: number, py: number, ts: number, active: boolean): void {
    if (active) {
      const pulse = 0.5 + 0.5 * Math.sin(this.exitGlowTime * 4);
      const glowSize = 4 + pulse * 6;
      this.ctx.fillStyle = `rgba(255, 215, 0, ${0.2 + pulse * 0.3})`;
      this.ctx.fillRect(px - glowSize, py - glowSize, ts + glowSize * 2, ts + glowSize * 2);
    }

    this.ctx.fillStyle = active ? COLORS.exitGlow : COLORS.exit;
    this.ctx.fillRect(px + 3, py + 3, ts - 6, ts - 6);

    this.ctx.fillStyle = active ? COLORS.gem : '#2e7d32';
    this.ctx.fillRect(px + 3, py + 3, ts - 6, 2);
    this.ctx.fillRect(px + 3, py + 3, 2, ts - 6);

    this.ctx.fillStyle = '#1b5e20';
    this.ctx.fillRect(px + 3, py + ts - 5, ts - 6, 2);
    this.ctx.fillRect(px + ts - 5, py + 3, 2, ts - 6);

    if (active) {
      const flash = Math.sin(this.exitGlowTime * 8) > 0;
      if (flash) {
        this.ctx.strokeStyle = COLORS.gem;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(px + 2, py + 2, ts - 4, ts - 4);
      }
    }
  }

  drawGems(map: MapData, collected: Set<string>): void {
    const ts = this.tileSize;
    for (const pos of map.gemPositions) {
      const key = `${pos.x},${pos.y}`;
      if (collected.has(key)) continue;

      const bob = Math.sin(this.gemBobTime * 3 + pos.x + pos.y) * 2;
      const px = this.offsetX + pos.x * ts + ts / 2;
      const py = this.offsetY + pos.y * ts + ts / 2 + bob;
      const size = ts * 0.35;

      this.ctx.fillStyle = 'rgba(255, 215, 0, 0.25)';
      this.ctx.beginPath();
      this.ctx.arc(px, py, size + 3, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = COLORS.gem;
      this.ctx.beginPath();
      this.ctx.moveTo(px, py - size);
      this.ctx.lineTo(px + size * 0.7, py);
      this.ctx.lineTo(px, py + size);
      this.ctx.lineTo(px - size * 0.7, py);
      this.ctx.closePath();
      this.ctx.fill();

      this.ctx.fillStyle = COLORS.gemHi;
      this.ctx.beginPath();
      this.ctx.moveTo(px, py - size);
      this.ctx.lineTo(px + size * 0.3, py - size * 0.2);
      this.ctx.lineTo(px, py);
      this.ctx.lineTo(px - size * 0.3, py - size * 0.2);
      this.ctx.closePath();
      this.ctx.fill();
    }
  }

  drawPlayer(player: Player): void {
    const ts = this.tileSize;
    const px = this.offsetX + player.renderX * ts + ts / 2;
    const py = this.offsetY + player.renderY * ts + ts / 2;
    this.drawCharacter(px, py, ts, COLORS.player, COLORS.playerHi, player.facing, false);
  }

  drawMonster(monster: Monster): void {
    const ts = this.tileSize;
    const px = this.offsetX + monster.renderX * ts + ts / 2;
    const py = this.offsetY + monster.renderY * ts + ts / 2;
    const baseColor = monster.isChasing ? COLORS.monsterChase : COLORS.monster;
    const hiColor = monster.isChasing ? '#ffab40' : COLORS.monsterHi;
    this.drawCharacter(px, py, ts, baseColor, hiColor, monster.facing, true);
  }

  private drawCharacter(
    cx: number,
    cy: number,
    ts: number,
    base: string,
    hi: string,
    facing: Direction,
    isMonster: boolean
  ): void {
    const s = ts / 8;
    const bob = isMonster ? Math.sin(this.gemBobTime * 5) * 1 : 0;

    this.ctx.fillStyle = base;
    this.ctx.fillRect(cx - s * 3, cy - s * 3 + bob, s * 6, s * 6);

    this.ctx.fillStyle = hi;
    this.ctx.fillRect(cx - s * 3, cy - s * 3 + bob, s * 6, s);
    this.ctx.fillRect(cx - s * 3, cy - s * 3 + bob, s, s * 6);

    this.ctx.fillStyle = isMonster ? '#000' : '#1a237e';
    if (facing === 'left') {
      this.ctx.fillRect(cx - s * 2, cy - s + bob, s, s);
    } else if (facing === 'right') {
      this.ctx.fillRect(cx + s, cy - s + bob, s, s);
    } else if (facing === 'up') {
      this.ctx.fillRect(cx - s * 1.5, cy - s * 1.5 + bob, s, s);
      this.ctx.fillRect(cx + s * 0.5, cy - s * 1.5 + bob, s, s);
    } else {
      this.ctx.fillRect(cx - s * 1.5, cy - s * 0.5 + bob, s, s);
      this.ctx.fillRect(cx + s * 0.5, cy - s * 0.5 + bob, s, s);
    }

    if (isMonster) {
      this.ctx.fillStyle = '#fff';
      if (facing === 'left') {
        this.ctx.fillRect(cx - s * 2 + s * 0.3, cy - s + s * 0.3 + bob, s * 0.4, s * 0.4);
      } else if (facing === 'right') {
        this.ctx.fillRect(cx + s + s * 0.3, cy - s + s * 0.3 + bob, s * 0.4, s * 0.4);
      } else {
        this.ctx.fillRect(cx - s * 1.5 + s * 0.3, cy - s * 0.5 + s * 0.3 + bob, s * 0.4, s * 0.4);
        this.ctx.fillRect(cx + s * 0.5 + s * 0.3, cy - s * 0.5 + s * 0.3 + bob, s * 0.4, s * 0.4);
      }
    }
  }

  drawHUD(
    collectedCount: number,
    totalGems: number,
    gameState: 'playing' | 'gameover' | 'win'
  ): void {
    const ts = this.tileSize;
    const barH = ts * 1.2;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvas.clientWidth, barH);

    this.ctx.font = `bold ${Math.floor(ts * 0.6)}px 'Courier New', monospace`;
    this.ctx.textBaseline = 'middle';
    this.ctx.textAlign = 'left';

    this.ctx.fillStyle = COLORS.gem;
    this.ctx.beginPath();
    const gx = ts * 0.8;
    const gy = barH / 2;
    const gs = ts * 0.25;
    this.ctx.moveTo(gx, gy - gs);
    this.ctx.lineTo(gx + gs * 0.7, gy);
    this.ctx.lineTo(gx, gy + gs);
    this.ctx.lineTo(gx - gs * 0.7, gy);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = COLORS.text;
    this.ctx.fillText(` ${collectedCount} / ${totalGems}`, ts * 1.3, barH / 2);

    let statusText = '';
    let statusColor = COLORS.text;
    if (gameState === 'playing') {
      if (collectedCount >= totalGems) {
        statusText = '出口已激活！快去出口！';
        statusColor = COLORS.exitGlow;
      } else {
        statusText = '收集所有宝石激活出口';
      }
    }

    this.ctx.textAlign = 'right';
    this.ctx.fillStyle = statusColor;
    this.ctx.fillText(statusText, this.canvas.clientWidth - ts * 0.5, barH / 2);
  }

  drawGameOver(win: boolean): void {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    this.ctx.fillRect(0, 0, w, h);

    const titleSize = Math.floor(Math.min(w, h) * 0.08);
    const subSize = Math.floor(titleSize * 0.4);

    this.ctx.font = `bold ${titleSize}px 'Courier New', monospace`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillStyle = win ? COLORS.gem : COLORS.monster;
    this.ctx.fillText(win ? '恭喜通关！' : '游戏结束', w / 2, h / 2 - titleSize);

    this.ctx.font = `${subSize}px 'Courier New', monospace`;
    this.ctx.fillStyle = COLORS.text;
    this.ctx.fillText('按 空格键 或 点击 重新开始', w / 2, h / 2 + subSize);
  }

  spawnFireworks(centerX: number, centerY: number): void {
    const colors = ['#ffd700', '#ff6d00', '#e53935', '#4caf50', '#2196f3', '#e040fb'];
    const bursts = 5;
    for (let b = 0; b < bursts; b++) {
      const bx = centerX + (Math.random() - 0.5) * 200;
      const by = centerY + (Math.random() - 0.5) * 150;
      const count = 30 + Math.floor(Math.random() * 20);
      const color = colors[Math.floor(Math.random() * colors.length)];
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.2;
        const speed = 2 + Math.random() * 4;
        this.particles.push({
          x: bx,
          y: by,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          maxLife: 1,
          color,
          size: 2 + Math.random() * 2,
          gravity: 0.05,
        });
      }
    }
  }

  spawnCollectEffect(gridX: number, gridY: number): void {
    const ts = this.tileSize;
    const cx = this.offsetX + gridX * ts + ts / 2;
    const cy = this.offsetY + gridY * ts + ts / 2;
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      const speed = 1 + Math.random() * 2;
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        color: COLORS.gem,
        size: 2 + Math.random() * 1.5,
        gravity: 0,
      });
    }
  }

  updateParticles(dt: number): void {
    this.gemBobTime += dt;
    this.exitGlowTime += dt;
    if (this.swipeIndicatorFade > 0) {
      this.swipeIndicatorFade = Math.max(0, this.swipeIndicatorFade - dt);
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.life -= dt * 1.2;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    if (this.particles.length > 300) {
      this.particles.splice(0, this.particles.length - 300);
    }
  }

  notifySwipe(dir: Direction): void {
    this.swipeLastDir = dir;
    this.swipeIndicatorFade = 1;
  }

  drawGemPanel(collectedCount: number, totalGems: number): void {
    const ts = this.tileSize;
    const padding = ts * 0.4;
    const fontSize = Math.floor(ts * 0.7);
    const text = `宝石: ${collectedCount}/${totalGems}`;

    this.ctx.font = `bold ${fontSize}px 'Courier New', monospace`;
    this.ctx.textBaseline = 'top';
    this.ctx.textAlign = 'left';
    const textMetrics = this.ctx.measureText(text);
    const panelW = textMetrics.width + ts * 1.2 + padding * 2;
    const panelH = fontSize + padding * 2;
    const px = padding;
    const py = padding;

    this.ctx.fillStyle = 'rgba(45, 27, 78, 0.85)';
    this.ctx.fillRect(px, py, panelW, panelH);

    this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(px + 1, py + 1, panelW - 2, panelH - 2);

    const gx = px + padding + ts * 0.3;
    const gy = py + panelH / 2;
    const gs = ts * 0.28;
    this.ctx.fillStyle = COLORS.gem;
    this.ctx.beginPath();
    this.ctx.moveTo(gx, gy - gs);
    this.ctx.lineTo(gx + gs * 0.7, gy);
    this.ctx.lineTo(gx, gy + gs);
    this.ctx.lineTo(gx - gs * 0.7, gy);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.fillStyle = COLORS.gemHi;
    this.ctx.beginPath();
    this.ctx.moveTo(gx, gy - gs);
    this.ctx.lineTo(gx + gs * 0.25, gy - gs * 0.2);
    this.ctx.lineTo(gx, gy);
    this.ctx.lineTo(gx - gs * 0.25, gy - gs * 0.2);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = COLORS.text;
    this.ctx.fillText(text, px + padding + ts * 0.7, py + padding);
  }

  drawStatusTip(collectedCount: number, totalGems: number): void {
    const ts = this.tileSize;
    const fontSize = Math.floor(ts * 0.5);
    this.ctx.font = `bold ${fontSize}px 'Courier New', monospace`;
    this.ctx.textBaseline = 'top';
    this.ctx.textAlign = 'right';

    let text = '';
    let color = COLORS.text;
    if (collectedCount >= totalGems) {
      text = '★ 出口已激活！';
      color = COLORS.exitGlow;
    } else {
      text = '收集宝石激活出口';
    }

    const padding = ts * 0.4;
    const px = this.canvas.clientWidth - padding;
    const py = padding;
    const textMetrics = this.ctx.measureText(text);
    const panelW = textMetrics.width + padding * 1.5;
    const panelH = fontSize + padding;

    this.ctx.fillStyle = 'rgba(45, 27, 78, 0.7)';
    this.ctx.fillRect(px - panelW, py, panelW, panelH);

    this.ctx.fillStyle = color;
    this.ctx.fillText(text, px - padding * 0.75, py + padding * 0.5);
  }

  drawCenterMessage(
    text: string,
    type: 'win' | 'gameover',
    flashPhase: number
  ): void {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    const titleSize = Math.floor(Math.min(w, h) * 0.14);
    const glow = 0.4 + 0.6 * Math.abs(Math.sin(flashPhase * 6));

    this.ctx.font = `bold ${titleSize}px 'Courier New', monospace`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    const baseColor = type === 'win' ? COLORS.gem : COLORS.monster;
    const glowColor = type === 'win' ? 'rgba(255, 215, 0,' : 'rgba(229, 57, 53,';

    this.ctx.shadowColor = type === 'win' ? COLORS.gem : COLORS.monster;
    this.ctx.shadowBlur = 30 * glow;

    for (let i = 4; i >= 0; i--) {
      this.ctx.fillStyle = `${glowColor}${(0.08 * glow * (5 - i)).toFixed(3)})`;
      this.ctx.fillText(text, w / 2 + i, h / 2 + i);
    }

    this.ctx.fillStyle = baseColor;
    this.ctx.fillText(text, w / 2, h / 2);
    this.ctx.shadowBlur = 0;

    const subSize = Math.floor(titleSize * 0.28);
    this.ctx.font = `${subSize}px 'Courier New', monospace`;
    this.ctx.fillStyle = COLORS.text;
    this.ctx.fillText('即将重新开始...', w / 2, h / 2 + titleSize * 0.8);
  }

  drawStartScreen(phase: number): void {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;

    this.ctx.fillStyle = 'rgba(10, 5, 20, 0.88)';
    this.ctx.fillRect(0, 0, w, h);

    const titleSize = Math.floor(Math.min(w, h) * 0.1);
    this.ctx.font = `bold ${titleSize}px 'Courier New', monospace`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    this.ctx.shadowColor = COLORS.gem;
    this.ctx.shadowBlur = 20;
    this.ctx.fillStyle = COLORS.gem;
    this.ctx.fillText('像素勇者地牢', w / 2, h / 2 - titleSize * 1.2);
    this.ctx.shadowBlur = 0;

    const bob = Math.sin(phase * 3) * 0.15 + 1;
    const subSize = Math.floor(titleSize * 0.42);
    this.ctx.font = `bold ${Math.floor(subSize * bob)}px 'Courier New', monospace`;
    this.ctx.fillStyle = `rgba(255, 255, 255, ${0.7 + 0.3 * Math.abs(Math.sin(phase * 2.5))})`;
    this.ctx.fillText('按任意键开始', w / 2, h / 2 + titleSize * 0.3);

    const tipSize = Math.floor(subSize * 0.65);
    this.ctx.font = `${tipSize}px 'Courier New', monospace`;
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.fillText('方向键 / WASD / 滑动屏幕 控制移动', w / 2, h / 2 + titleSize * 1.1);
    this.ctx.fillText('收集所有宝石，到达绿色出口', w / 2, h / 2 + titleSize * 1.1 + tipSize * 1.4);
  }

  drawSwipeHint(): void {
    if (this.swipeIndicatorFade <= 0 && !this.swipeLastDir) return;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    const alpha = Math.max(0.05, this.swipeIndicatorFade);
    const size = Math.min(w, h) * 0.16;
    const margin = size * 0.6;
    const cx = margin + size;
    const cy = h - margin - size;

    this.ctx.globalAlpha = alpha * 0.75;

    this.ctx.fillStyle = 'rgba(45, 27, 78, 0.5)';
    this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, size, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();

    const dirs: { dir: Direction; dx: number; dy: number; label: string }[] = [
      { dir: 'up', dx: 0, dy: -1, label: '↑' },
      { dir: 'left', dx: -1, dy: 0, label: '←' },
      { dir: 'right', dx: 1, dy: 0, label: '→' },
      { dir: 'down', dx: 0, dy: 1, label: '↓' },
    ];

    const btnSize = size * 0.5;
    const fontS = Math.floor(btnSize * 0.7);
    this.ctx.font = `bold ${fontS}px 'Courier New', monospace`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    for (const d of dirs) {
      const bx = cx + d.dx * size * 0.55;
      const by = cy + d.dy * size * 0.55;
      const isActive = this.swipeLastDir === d.dir && this.swipeIndicatorFade > 0.3;
      this.ctx.fillStyle = isActive ? 'rgba(255, 215, 0, 0.7)' : 'rgba(255, 215, 0, 0.18)';
      this.ctx.fillRect(bx - btnSize / 2, by - btnSize / 2, btnSize, btnSize);
      this.ctx.fillStyle = isActive ? '#fff' : COLORS.gem;
      this.ctx.fillText(d.label, bx, by);
    }

    const tipSize = Math.floor(size * 0.22);
    this.ctx.font = `${tipSize}px 'Courier New', monospace`;
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.fillText('滑动屏幕', cx, cy + size + tipSize);

    this.ctx.globalAlpha = 1;
  }

  drawParticles(): void {
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    this.ctx.globalAlpha = 1;
  }

  drawTouchControls(): void {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    const btnSize = Math.min(w, h) * 0.12;
    const margin = btnSize * 0.5;

    this.ctx.fillStyle = 'rgba(45, 27, 78, 0.5)';
    this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
    this.ctx.lineWidth = 2;

    const dpadX = margin + btnSize;
    const dpadY = h - margin - btnSize * 1.5;

    const positions = [
      { x: 0, y: -1, label: '↑' },
      { x: -1, y: 0, label: '←' },
      { x: 1, y: 0, label: '→' },
      { x: 0, y: 1, label: '↓' },
    ];

    for (const pos of positions) {
      const bx = dpadX + pos.x * btnSize;
      const by = dpadY + pos.y * btnSize;
      this.ctx.fillRect(bx - btnSize / 2, by - btnSize / 2, btnSize, btnSize);
      this.ctx.strokeRect(bx - btnSize / 2, by - btnSize / 2, btnSize, btnSize);
      this.ctx.fillStyle = '#ffd700';
      this.ctx.font = `bold ${btnSize * 0.5}px 'Courier New', monospace`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(pos.label, bx, by);
      this.ctx.fillStyle = 'rgba(45, 27, 78, 0.5)';
    }
  }
}

export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}
