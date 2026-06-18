import {
  Player,
  Monster,
  Room,
  ElementBadge,
  UIState,
  PLAYER_SIZE,
  WALL_THICKNESS,
  ELEMENT_COLORS,
  ELEMENT_NAMES,
  ROOM_SIZE,
  GRID_SIZE,
  TILE_SIZE
} from './types';

export class RenderManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;
  private mapCached = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');
    this.ctx = ctx;

    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = ROOM_SIZE;
    this.offscreenCanvas.height = ROOM_SIZE;
    const offCtx = this.offscreenCanvas.getContext('2d');
    if (!offCtx) throw new Error('Offscreen canvas context not available');
    this.offscreenCtx = offCtx;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.mapCached = false;
  }

  clear(): void {
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private getOffset(): { x: number; y: number; scale: number } {
    const scale = Math.min(
      this.canvas.width / ROOM_SIZE,
      this.canvas.height / ROOM_SIZE
    );
    const x = (this.canvas.width - ROOM_SIZE * scale) / 2;
    const y = (this.canvas.height - ROOM_SIZE * scale) / 2;
    return { x, y, scale };
  }

  invalidateMapCache(): void {
    this.mapCached = false;
  }

  private renderMapToCache(room: Room): void {
    const ctx = this.offscreenCtx;
    ctx.clearRect(0, 0, ROOM_SIZE, ROOM_SIZE);

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const tile = room.tiles[y][x];
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;

        if (tile.type === 'wall') {
          ctx.fillStyle = tile.color;
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          ctx.strokeStyle = '#1a1a2e';
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 0.5, py + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
        } else {
          ctx.fillStyle = tile.color;
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          if ((x + y) % 2 === 0) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          }
        }
      }
    }

    ctx.save();
    ctx.shadowColor = '#00BFFF';
    ctx.shadowBlur = 20;
    ctx.strokeStyle = 'rgba(0, 191, 255, 0.3)';
    ctx.lineWidth = WALL_THICKNESS;
    ctx.strokeRect(
      WALL_THICKNESS / 2,
      WALL_THICKNESS / 2,
      ROOM_SIZE - WALL_THICKNESS,
      ROOM_SIZE - WALL_THICKNESS
    );
    ctx.restore();

    this.mapCached = true;
  }

  renderRoom(room: Room): void {
    if (!this.mapCached) {
      this.renderMapToCache(room);
    }

    const { x, y, scale } = this.getOffset();
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.scale(scale, scale);
    this.ctx.drawImage(this.offscreenCanvas, 0, 0);
    this.ctx.restore();
  }

  renderPlayer(player: Player, deltaTime: number): void {
    const { x, y, scale } = this.getOffset();
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.scale(scale, scale);

    if (player.colorTransitionProgress < 1) {
      player.colorTransitionProgress += deltaTime / player.colorTransitionTime;
      if (player.colorTransitionProgress >= 1) {
        player.colorTransitionProgress = 1;
        player.color = player.targetColor;
      } else {
        player.color = this.lerpColor(
          player.color,
          player.targetColor,
          player.colorTransitionProgress
        );
      }
    }

    for (const rune of player.runes) {
      rune.angle += rune.speed * (deltaTime / 1000);
      const rx = player.position.x + Math.cos(rune.angle) * rune.orbitRadius;
      const ry = player.position.y + Math.sin(rune.angle) * rune.orbitRadius;

      this.ctx.save();
      this.ctx.translate(rx, ry);
      this.ctx.rotate(rune.angle);
      this.ctx.fillStyle = ELEMENT_COLORS[rune.element];
      this.ctx.globalAlpha = 0.8;
      this.ctx.fillRect(-4, -4, 8, 8);
      this.ctx.restore();
    }

    const flickerAlpha = player.invincible
      ? 0.3 + Math.sin(Date.now() / 50) * 0.3
      : 1;

    this.ctx.save();
    this.ctx.globalAlpha = flickerAlpha;
    this.ctx.shadowColor = player.color;
    this.ctx.shadowBlur = 15;
    this.ctx.fillStyle = player.color;
    this.ctx.beginPath();
    this.ctx.arc(
      player.position.x,
      player.position.y,
      PLAYER_SIZE / 2,
      0,
      Math.PI * 2
    );
    this.ctx.fill();
    this.ctx.restore();

    this.ctx.restore();
  }

  renderMonsters(monsters: Monster[]): void {
    const { x, y, scale } = this.getOffset();
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.scale(scale, scale);

    for (const monster of monsters) {
      this.ctx.save();
      this.ctx.translate(monster.position.x, monster.position.y);
      this.ctx.fillStyle = monster.color;
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 1;
      this.drawShape(monster.shape, monster.size);
      this.ctx.fill();
      this.ctx.stroke();

      const barWidth = monster.size * 1.5;
      const barHeight = 3;
      const healthPercent = monster.health / monster.maxHealth;
      this.ctx.fillStyle = '#333';
      this.ctx.fillRect(-barWidth / 2, -monster.size - 8, barWidth, barHeight);
      this.ctx.fillStyle =
        healthPercent > 0.5 ? '#4CAF50' : healthPercent > 0.25 ? '#FFC107' : '#F44336';
      this.ctx.fillRect(
        -barWidth / 2,
        -monster.size - 8,
        barWidth * healthPercent,
        barHeight
      );
      this.ctx.restore();
    }

    this.ctx.restore();
  }

  private drawShape(
    shape: 'triangle' | 'square' | 'pentagon' | 'hexagon',
    size: number
  ): void {
    const ctx = this.ctx;
    ctx.beginPath();
    let sides = 3;
    if (shape === 'square') sides = 4;
    if (shape === 'pentagon') sides = 5;
    if (shape === 'hexagon') sides = 6;

    for (let i = 0; i < sides; i++) {
      const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
      const px = Math.cos(angle) * size;
      const py = Math.sin(angle) * size;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  renderElementBadge(badge: ElementBadge | null, deltaTime: number): void {
    if (!badge) return;

    badge.duration += deltaTime;
    const progress = badge.duration / badge.maxDuration;

    if (progress < 0.2) {
      badge.phase = 'scaleUp';
      badge.scale = 1 + (progress / 0.2) * 0.2;
      badge.opacity = 0.8;
    } else if (progress < 0.4) {
      badge.phase = 'scaleDown';
      const p = (progress - 0.2) / 0.2;
      badge.scale = 1.2 - p * 0.2;
      badge.opacity = 0.8;
    } else {
      badge.phase = 'fade';
      const p = (progress - 0.4) / 0.6;
      badge.scale = 1;
      badge.opacity = 0.8 * (1 - p);
    }

    const size = 64 * badge.scale;
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;

    this.ctx.save();
    this.ctx.globalAlpha = badge.opacity;
    this.ctx.shadowColor = ELEMENT_COLORS[badge.element];
    this.ctx.shadowBlur = 30;
    this.ctx.fillStyle = ELEMENT_COLORS[badge.element];
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 32px serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(ELEMENT_NAMES[badge.element], cx, cy);
    this.ctx.restore();
  }

  renderUI(
    player: Player,
    floor: number,
    monsterCount: number,
    fps: number
  ): void {
    const padding = 20;
    const barWidth = 200;
    const barHeight = 16;

    this.ctx.save();
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';

    const panelX = padding;
    const panelY = padding;
    const panelW = barWidth + 40;
    const panelH = 140;

    this.ctx.fillStyle = '#4B3A2A';
    this.ctx.strokeStyle = '#B8860B';
    this.ctx.lineWidth = 2;
    this.roundRect(panelX, panelY, panelW, panelH, 8);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.fillStyle = '#B8860B';
    this.ctx.font = 'bold 14px Microsoft YaHei';
    this.ctx.fillText('生命值', panelX + 15, panelY + 12);

    const healthX = panelX + 15;
    const healthY = panelY + 35;
    const healthGrad = this.ctx.createLinearGradient(
      healthX,
      healthY,
      healthX + barWidth,
      healthY
    );
    healthGrad.addColorStop(0, '#FF0000');
    healthGrad.addColorStop(1, '#FF8C00');
    this.ctx.fillStyle = '#2a2a2a';
    this.roundRect(healthX, healthY, barWidth, barHeight, 4);
    this.ctx.fill();
    this.ctx.fillStyle = healthGrad;
    this.roundRect(
      healthX,
      healthY,
      barWidth * (player.health / player.maxHealth),
      barHeight,
      4
    );
    this.ctx.fill();

    for (let i = 0; i < player.crystals.length; i++) {
      const crystal = player.crystals[i];
      const cx = panelX + 15;
      const cy = panelY + 60 + i * 25;

      const isActive = player.activeElement === crystal.element;

      this.ctx.fillStyle = '#B8860B';
      this.ctx.font = isActive ? 'bold 12px Microsoft YaHei' : '12px Microsoft YaHei';
      this.ctx.fillText(
        `${ELEMENT_NAMES[crystal.element]} Lv.${crystal.level}`,
        cx,
        cy
      );

      const energyX = cx + 70;
      const energyY = cy;
      const energyW = barWidth - 70;
      const energyH = 12;

      const crystalGrad = this.ctx.createLinearGradient(
        energyX,
        energyY,
        energyX + energyW,
        energyY
      );
      const color = ELEMENT_COLORS[crystal.element];
      crystalGrad.addColorStop(0, this.adjustBrightness(color, -30));
      crystalGrad.addColorStop(1, color);

      this.ctx.fillStyle = '#2a2a2a';
      this.roundRect(energyX, energyY, energyW, energyH, 3);
      this.ctx.fill();
      this.ctx.fillStyle = crystalGrad;
      this.roundRect(
        energyX,
        energyY,
        energyW * (crystal.energy / crystal.maxEnergy),
        energyH,
        3
      );
      this.ctx.fill();

      if (isActive) {
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.roundRect(energyX - 1, energyY - 1, energyW + 2, energyH + 2, 3);
        this.ctx.stroke();
      }
    }

    const infoX = this.canvas.width - padding - 150;
    const infoY = padding;
    this.ctx.fillStyle = '#4B3A2A';
    this.ctx.strokeStyle = '#B8860B';
    this.ctx.lineWidth = 2;
    this.roundRect(infoX, infoY, 150, 80, 8);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.fillStyle = '#B8860B';
    this.ctx.font = '14px Microsoft YaHei';
    this.ctx.fillText(`第 ${floor} 层`, infoX + 15, infoY + 12);
    this.ctx.fillText(`怪物: ${monsterCount}`, infoX + 15, infoY + 38);
    this.ctx.fillText(`FPS: ${fps.toFixed(0)}`, infoX + 15, infoY + 62);

    const helpY = this.canvas.height - padding - 60;
    this.ctx.fillStyle = 'rgba(75, 58, 42, 0.8)';
    this.ctx.strokeStyle = '#B8860B';
    this.ctx.lineWidth = 1;
    this.roundRect(padding, helpY, 280, 55, 6);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.fillStyle = '#DAA520';
    this.ctx.font = '12px Microsoft YaHei';
    this.ctx.fillText('WASD: 移动 | Q/E/空格: 切换元素', padding + 12, helpY + 10);
    this.ctx.fillText('碰撞怪物触发元素爆炸 | 收集碎片强化水晶', padding + 12, helpY + 32);

    this.ctx.restore();
  }

  renderModal(uiState: UIState, deltaTime: number): void {
    if (!uiState.showModal) return;

    uiState.modalTimer += deltaTime;
    const enterDuration = 300;
    const exitDuration = 200;

    if (uiState.modalPhase === 'enter') {
      const p = Math.min(1, uiState.modalTimer / enterDuration);
      uiState.modalScale = this.easeOutBack(p);
      uiState.modalOpacity = p;
      if (p >= 1) uiState.modalPhase = 'visible';
    } else if (uiState.modalPhase === 'exit') {
      const p = Math.min(1, uiState.modalTimer / exitDuration);
      uiState.modalScale = 1 - p * 0.3;
      uiState.modalOpacity = 1 - p;
      if (p >= 1) {
        uiState.showModal = false;
      }
    }

    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    const w = 400;
    const h = 250;

    this.ctx.globalAlpha = uiState.modalOpacity;
    this.ctx.translate(cx, cy);
    this.ctx.scale(uiState.modalScale, uiState.modalScale);
    this.ctx.translate(-cx, -cy);

    this.ctx.fillStyle = '#4B3A2A';
    this.ctx.strokeStyle = '#B8860B';
    this.ctx.lineWidth = 3;
    this.roundRect(cx - w / 2, cy - h / 2, w, h, 12);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = 'bold 28px Microsoft YaHei';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('异界共鸣塔', cx, cy - h / 2 + 50);

    this.ctx.fillStyle = '#DAA520';
    this.ctx.font = '16px Microsoft YaHei';
    this.ctx.fillText(uiState.modalContent, cx, cy - 10);

    this.ctx.fillStyle = '#B8860B';
    this.ctx.font = '14px Microsoft YaHei';
    this.ctx.fillText('点击任意位置开始游戏', cx, cy + 60);

    this.ctx.restore();
  }

  private roundRect(
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y);
    this.ctx.lineTo(x + w - r, y);
    this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    this.ctx.lineTo(x + w, y + h - r);
    this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.ctx.lineTo(x + r, y + h);
    this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    this.ctx.lineTo(x, y + r);
    this.ctx.quadraticCurveTo(x, y, x + r, y);
    this.ctx.closePath();
  }

  private lerpColor(color1: string, color2: string, t: number): string {
    const c1 = this.hexToRgb(color1);
    const c2 = this.hexToRgb(color2);
    if (!c1 || !c2) return color2;

    const r = Math.round(c1.r + (c2.r - c1.r) * t);
    const g = Math.round(c1.g + (c2.g - c1.g) * t);
    const b = Math.round(c1.b + (c2.b - c1.b) * t);

    return `rgb(${r}, ${g}, ${b})`;
  }

  private hexToRgb(
    hex: string
  ): { r: number; g: number; b: number } | null {
    if (hex.startsWith('rgb')) {
      const match = hex.match(/\d+/g);
      if (match && match.length >= 3) {
        return { r: parseInt(match[0]), g: parseInt(match[1]), b: parseInt(match[2]) };
      }
      return null;
    }
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : null;
  }

  private adjustBrightness(color: string, amount: number): string {
    const rgb = this.hexToRgb(color);
    if (!rgb) return color;
    const r = Math.max(0, Math.min(255, rgb.r + amount));
    const g = Math.max(0, Math.min(255, rgb.g + amount));
    const b = Math.max(0, Math.min(255, rgb.b + amount));
    return `rgb(${r}, ${g}, ${b})`;
  }

  private easeOutBack(t: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  screenToWorld(sx: number, sy: number): { x: number; y: number } {
    const { x, y, scale } = this.getOffset();
    return {
      x: (sx - x) / scale,
      y: (sy - y) / scale
    };
  }
}
