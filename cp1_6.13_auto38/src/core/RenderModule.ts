import type { GameState, Creature, Tile, Position, AnimationState } from '../types';

export class RenderModule {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private tileSize: number;
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;
  private mapDirty: boolean = true;
  private animationFrameId: number | null = null;
  private floatingTexts: Array<{
    x: number;
    y: number;
    text: string;
    color: string;
    timer: number;
    offsetY: number;
  }> = [];

  private readonly COLORS = {
    room: '#16213e',
    corridor: '#0f3460',
    obstacle: '#2d2d2d',
    grid: 'rgba(255, 255, 255, 0.1)',
    chest: '#ffd700',
    portal: '#9b59b6',
    dragon: '#e74c3c',
    elf: '#2ecc71',
    gargoyle: '#8e44ad',
    selection: '#ffd700',
    damage: '#ff6b6b',
  };

  constructor(canvas: HTMLCanvasElement, tileSize: number = 50) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.tileSize = tileSize;

    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCtx = this.offscreenCanvas.getContext('2d')!;
  }

  setMapDirty(): void {
    this.mapDirty = true;
  }

  addFloatingText(x: number, y: number, text: string, color: string): void {
    this.floatingTexts.push({
      x,
      y,
      text,
      color,
      timer: 1.0,
      offsetY: 0,
    });
  }

  render(gameState: GameState): void {
    if (this.mapDirty) {
      this.prerenderMap(gameState);
      this.mapDirty = false;
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawBackground(gameState);
    this.drawItems(gameState);
    this.drawCreatures(gameState);
    this.drawEffects(gameState);
    this.drawPath(gameState);
    this.updateFloatingTexts();
  }

  private prerenderMap(gameState: GameState): void {
    const { mapWidth, mapHeight } = gameState;
    this.offscreenCanvas.width = mapWidth * this.tileSize;
    this.offscreenCanvas.height = mapHeight * this.tileSize;

    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        const tile = gameState.map[y][x];
        this.drawTile(this.offscreenCtx, tile);
      }
    }

    this.drawGrid(this.offscreenCtx, mapWidth, mapHeight);
  }

  private drawTile(ctx: CanvasRenderingContext2D, tile: Tile): void {
    const px = tile.x * this.tileSize;
    const py = tile.y * this.tileSize;

    let color = this.COLORS.room;
    if (tile.type === 'corridor') {
      color = this.COLORS.corridor;
    } else if (tile.type === 'obstacle') {
      color = this.COLORS.obstacle;
    }

    ctx.fillStyle = color;
    ctx.fillRect(px, py, this.tileSize, this.tileSize);
  }

  private drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.strokeStyle = this.COLORS.grid;
    ctx.lineWidth = 1;

    for (let x = 0; x <= width; x++) {
      ctx.beginPath();
      ctx.moveTo(x * this.tileSize, 0);
      ctx.lineTo(x * this.tileSize, height * this.tileSize);
      ctx.stroke();
    }

    for (let y = 0; y <= height; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * this.tileSize);
      ctx.lineTo(width * this.tileSize, y * this.tileSize);
      ctx.stroke();
    }
  }

  private drawBackground(gameState: GameState): void {
    this.ctx.drawImage(this.offscreenCanvas, 0, 0);
  }

  private drawItems(gameState: GameState): void {
    const { map, mapWidth, mapHeight } = gameState;

    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        const tile = map[y][x];
        const px = x * this.tileSize;
        const py = y * this.tileSize;

        if (tile.hasChest) {
          this.drawChest(px, py);
        }

        if (tile.hasPortal) {
          this.drawPortal(px, py, gameState.time);
        }
      }
    }
  }

  private drawChest(px: number, py: number): void {
    const ctx = this.ctx;
    const cx = px + this.tileSize / 2;
    const cy = py + this.tileSize / 2;
    const size = this.tileSize * 0.5;

    ctx.fillStyle = this.COLORS.chest;
    ctx.strokeStyle = '#b8860b';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.roundRect(cx - size / 2, cy - size / 3, size, size * 0.66, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#b8860b';
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawPortal(px: number, py: number, time: number): void {
    const ctx = this.ctx;
    const cx = px + this.tileSize / 2;
    const cy = py + this.tileSize / 2;
    const size = this.tileSize * 0.4;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(time * 2);

    for (let i = 0; i < 3; i++) {
      const radius = size * (1 - i * 0.3);
      const alpha = 0.3 + i * 0.2;
      ctx.strokeStyle = `rgba(155, 89, 182, ${alpha})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(155, 89, 182, 0.5)';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawCreatures(gameState: GameState): void {
    const { creatures, selectedCreatureId } = gameState;

    for (const creature of creatures) {
      const { renderPosition, animation, isEvolving, evolutionTimer } = creature;
      const px = renderPosition.x * this.tileSize + this.tileSize / 2;
      let py = renderPosition.y * this.tileSize + this.tileSize / 2;

      if (animation.type === 'attack') {
        const progress = animation.timer / animation.duration;
        const shake = Math.sin(progress * Math.PI * 4) * 3;
        py += shake;
      }

      if (animation.type === 'hit' && Math.floor(animation.timer * 20) % 2 === 0) {
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'source-over';
        this.drawCreatureSprite(creature, px, py, '#ffffff');
        this.ctx.restore();
        continue;
      }

      this.drawCreatureSprite(creature, px, py);

      if (isEvolving) {
        this.drawEvolutionEffect(this.ctx, px, py, this.tileSize * 0.6, evolutionTimer);
      }

      if (creature.id === selectedCreatureId) {
        const pulsePhase = (gameState.time % 2) / 2;
        this.drawSelectionGlow(this.ctx, px, py, this.tileSize * 0.7, pulsePhase);
      }

      if (creature.displayDamage) {
        this.drawDamageNumber(creature.displayDamage.value, px, py - creature.displayDamage.offsetY);
      }
    }
  }

  private drawCreatureSprite(creature: Creature, x: number, y: number, overrideColor?: string): void {
    const ctx = this.ctx;
    const scale = this.tileSize / 50;
    const animation = creature.animation;

    ctx.save();
    ctx.translate(x, y);

    if (animation.direction === 'left') {
      ctx.scale(-1, 1);
    }

    const color = overrideColor || this.COLORS[creature.species];

    switch (creature.species) {
      case 'dragon':
        this.drawDragon(ctx, 0, 0, scale, animation);
        break;
      case 'elf':
        this.drawElf(ctx, 0, 0, scale, animation);
        break;
      case 'gargoyle':
        this.drawGargoyle(ctx, 0, 0, scale, animation);
        break;
    }

    ctx.restore();

    if (!overrideColor) {
      this.drawHealthBar(creature, x, y);
    }
  }

  private drawHealthBar(creature: Creature, x: number, y: number): void {
    const ctx = this.ctx;
    const barWidth = this.tileSize * 0.6;
    const barHeight = 4;
    const barX = x - barWidth / 2;
    const barY = y - this.tileSize * 0.45;

    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    const hpPercent = creature.hp / creature.maxHp;
    let hpColor = '#2ecc71';
    if (hpPercent < 0.3) {
      hpColor = '#e74c3c';
    } else if (hpPercent < 0.6) {
      hpColor = '#f39c12';
    }

    ctx.fillStyle = hpColor;
    ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
  }

  drawDragon(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, animation: AnimationState): void {
    const s = scale;
    const bobY = animation.type === 'idle' ? Math.sin(Date.now() * 0.005) * 2 * s : 0;

    ctx.fillStyle = this.COLORS.dragon;
    ctx.strokeStyle = '#922b21';
    ctx.lineWidth = 2 * s;

    ctx.beginPath();
    ctx.ellipse(x, y + bobY, 12 * s, 10 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(x + 10 * s, y - 2 * s + bobY, 8 * s, 7 * s, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#922b21';
    ctx.beginPath();
    ctx.moveTo(x + 14 * s, y - 8 * s + bobY);
    ctx.lineTo(x + 18 * s, y - 14 * s + bobY);
    ctx.lineTo(x + 16 * s, y - 6 * s + bobY);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x + 18 * s, y - 6 * s + bobY);
    ctx.lineTo(x + 22 * s, y - 12 * s + bobY);
    ctx.lineTo(x + 20 * s, y - 4 * s + bobY);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x + 13 * s, y - 3 * s + bobY, 2.5 * s, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(x + 14 * s, y - 3 * s + bobY, 1.2 * s, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = this.COLORS.dragon;
    ctx.beginPath();
    ctx.moveTo(x - 10 * s, y + bobY);
    ctx.quadraticCurveTo(x - 20 * s, y - 5 * s + bobY, x - 24 * s, y + 2 * s + bobY);
    ctx.quadraticCurveTo(x - 20 * s, y + 5 * s + bobY, x - 10 * s, y + 4 * s + bobY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f39c12';
    ctx.beginPath();
    ctx.moveTo(x - 24 * s, y + 2 * s + bobY);
    ctx.lineTo(x - 28 * s, y + 2 * s + bobY);
    ctx.lineTo(x - 24 * s, y + 6 * s + bobY);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = this.COLORS.dragon;
    ctx.beginPath();
    ctx.ellipse(x - 2 * s, y + 8 * s + bobY, 4 * s, 5 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 6 * s, y + 8 * s + bobY, 4 * s, 5 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  drawElf(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, animation: AnimationState): void {
    const s = scale;
    const bobY = animation.type === 'idle' ? Math.sin(Date.now() * 0.006) * 1.5 * s : 0;

    ctx.fillStyle = this.COLORS.elf;
    ctx.strokeStyle = '#1e8449';
    ctx.lineWidth = 2 * s;

    ctx.beginPath();
    ctx.ellipse(x, y + 4 * s + bobY, 8 * s, 10 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y - 6 * s + bobY, 8 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#1e8449';
    ctx.beginPath();
    ctx.moveTo(x - 6 * s, y - 8 * s + bobY);
    ctx.lineTo(x - 12 * s, y - 16 * s + bobY);
    ctx.lineTo(x - 4 * s, y - 10 * s + bobY);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x + 6 * s, y - 8 * s + bobY);
    ctx.lineTo(x + 12 * s, y - 16 * s + bobY);
    ctx.lineTo(x + 4 * s, y - 10 * s + bobY);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x - 3 * s, y - 6 * s + bobY, 2.5 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 3 * s, y - 6 * s + bobY, 2.5 * s, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(x - 2.5 * s, y - 6 * s + bobY, 1.2 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 3.5 * s, y - 6 * s + bobY, 1.2 * s, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#27ae60';
    ctx.beginPath();
    ctx.ellipse(x - 10 * s, y + 2 * s + bobY, 4 * s, 8 * s, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x + 10 * s, y + 2 * s + bobY, 4 * s, 8 * s, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = this.COLORS.elf;
    ctx.beginPath();
    ctx.ellipse(x - 3 * s, y + 12 * s + bobY, 3 * s, 4 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 3 * s, y + 12 * s + bobY, 3 * s, 4 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 3 * s;
    ctx.beginPath();
    ctx.moveTo(x + 12 * s, y - 4 * s + bobY);
    ctx.lineTo(x + 16 * s, y + 14 * s + bobY);
    ctx.stroke();

    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(x + 12 * s, y - 6 * s + bobY, 3 * s, 0, Math.PI * 2);
    ctx.fill();
  }

  drawGargoyle(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, animation: AnimationState): void {
    const s = scale;
    const bobY = animation.type === 'idle' ? Math.sin(Date.now() * 0.004) * 2 * s : 0;
    const wingFlap = animation.type === 'idle' ? Math.sin(Date.now() * 0.008) * 3 * s : 0;

    ctx.fillStyle = this.COLORS.gargoyle;
    ctx.strokeStyle = '#5b2c6f';
    ctx.lineWidth = 2 * s;

    ctx.beginPath();
    ctx.moveTo(x - 14 * s, y - 2 * s + bobY - wingFlap);
    ctx.quadraticCurveTo(x - 24 * s, y - 16 * s + bobY, x - 10 * s, y + 4 * s + bobY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + 14 * s, y - 2 * s + bobY - wingFlap);
    ctx.quadraticCurveTo(x + 24 * s, y - 16 * s + bobY, x + 10 * s, y + 4 * s + bobY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(x, y + bobY, 10 * s, 12 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y - 8 * s + bobY, 9 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#5b2c6f';
    ctx.beginPath();
    ctx.moveTo(x - 7 * s, y - 12 * s + bobY);
    ctx.lineTo(x - 10 * s, y - 22 * s + bobY);
    ctx.lineTo(x - 4 * s, y - 14 * s + bobY);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x + 7 * s, y - 12 * s + bobY);
    ctx.lineTo(x + 10 * s, y - 22 * s + bobY);
    ctx.lineTo(x + 4 * s, y - 14 * s + bobY);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(x - 3.5 * s, y - 8 * s + bobY, 3 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 3.5 * s, y - 8 * s + bobY, 3 * s, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(x - 3.5 * s, y - 8 * s + bobY, 1.5 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 3.5 * s, y - 8 * s + bobY, 1.5 * s, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#5b2c6f';
    ctx.beginPath();
    ctx.moveTo(x - 4 * s, y - 3 * s + bobY);
    ctx.lineTo(x - 5 * s, y - 1 * s + bobY);
    ctx.lineTo(x - 3 * s, y - 1 * s + bobY);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + 4 * s, y - 3 * s + bobY);
    ctx.lineTo(x + 5 * s, y - 1 * s + bobY);
    ctx.lineTo(x + 3 * s, y - 1 * s + bobY);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = this.COLORS.gargoyle;
    ctx.beginPath();
    ctx.ellipse(x - 4 * s, y + 10 * s + bobY, 4 * s, 6 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x + 4 * s, y + 10 * s + bobY, 4 * s, 6 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#5b2c6f';
    ctx.beginPath();
    ctx.moveTo(x - 4 * s, y + 14 * s + bobY);
    ctx.lineTo(x - 6 * s, y + 20 * s + bobY);
    ctx.lineTo(x - 2 * s, y + 14 * s + bobY);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + 4 * s, y + 14 * s + bobY);
    ctx.lineTo(x + 6 * s, y + 20 * s + bobY);
    ctx.lineTo(x + 2 * s, y + 14 * s + bobY);
    ctx.closePath();
    ctx.fill();
  }

  drawSelectionGlow(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, pulsePhase: number): void {
    const alpha = 0.5 + Math.sin(pulsePhase * Math.PI * 2) * 0.3;
    const expandedSize = size + Math.sin(pulsePhase * Math.PI * 2) * 4;

    ctx.save();
    ctx.strokeStyle = `rgba(255, 215, 0, ${alpha})`;
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 15;

    ctx.beginPath();
    ctx.roundRect(x - expandedSize / 2, y - expandedSize / 2, expandedSize, expandedSize, 8);
    ctx.stroke();

    ctx.strokeStyle = `rgba(255, 215, 0, ${alpha * 0.5})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x - expandedSize / 2 - 4, y - expandedSize / 2 - 4, expandedSize + 8, expandedSize + 8, 10);
    ctx.stroke();

    ctx.restore();
  }

  drawEvolutionEffect(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, timer: number): void {
    const progress = timer % 2000 / 2000;
    const rotation = progress * Math.PI * 4;
    const alpha = 0.6 + Math.sin(progress * Math.PI * 2) * 0.3;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const petalX = Math.cos(angle) * size * 0.5;
      const petalY = Math.sin(angle) * size * 0.5;

      ctx.fillStyle = `rgba(241, 196, 15, ${alpha * 0.6})`;
      ctx.beginPath();
      ctx.ellipse(petalX, petalY, size * 0.2, size * 0.4, angle, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const radius = size * (0.3 + i * 0.2);
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawEffects(gameState: GameState): void {
    for (const creature of gameState.creatures) {
      if (creature.displayDamage) {
        const px = creature.renderPosition.x * this.tileSize + this.tileSize / 2;
        const py = creature.renderPosition.y * this.tileSize + this.tileSize / 2 - creature.displayDamage.offsetY;
        this.drawDamageNumber(creature.displayDamage.value, px, py);
      }
    }

    for (const text of this.floatingTexts) {
      const alpha = Math.min(1, text.timer);
      this.ctx.font = 'bold 16px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillStyle = text.color;
      this.ctx.globalAlpha = alpha;
      this.ctx.fillText(text.text, text.x, text.y - text.offsetY);
      this.ctx.globalAlpha = 1;
    }
  }

  private drawDamageNumber(damage: number, x: number, y: number): void {
    this.ctx.font = 'bold 18px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = '#ff6b6b';
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 3;
    this.ctx.strokeText(`-${damage}`, x, y);
    this.ctx.fillText(`-${damage}`, x, y);
  }

  private drawPath(gameState: GameState): void {
    const { path, userTarget } = gameState;

    if (path.length > 1) {
      this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
      this.ctx.lineWidth = 4;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      this.ctx.setLineDash([8, 8]);

      this.ctx.beginPath();
      for (let i = 0; i < path.length; i++) {
        const px = path[i].x * this.tileSize + this.tileSize / 2;
        const py = path[i].y * this.tileSize + this.tileSize / 2;
        if (i === 0) {
          this.ctx.moveTo(px, py);
        } else {
          this.ctx.lineTo(px, py);
        }
      }
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    }

    if (userTarget) {
      const px = userTarget.x * this.tileSize + this.tileSize / 2;
      const py = userTarget.y * this.tileSize + this.tileSize / 2;

      const pulse = Math.sin(gameState.time * 4) * 0.3 + 0.7;

      this.ctx.fillStyle = `rgba(255, 107, 107, ${pulse})`;
      this.ctx.beginPath();
      this.ctx.arc(px, py, 10, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(px - 6, py);
      this.ctx.lineTo(px + 6, py);
      this.ctx.moveTo(px, py - 6);
      this.ctx.lineTo(px, py + 6);
      this.ctx.stroke();
    }
  }

  private updateFloatingTexts(): void {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const text = this.floatingTexts[i];
      text.timer -= 0.016;
      text.offsetY += 1;

      if (text.timer <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.mapDirty = true;
  }

  getTileSize(): number {
    return this.tileSize;
  }

  screenToTile(screenX: number, screenY: number): Position {
    return {
      x: Math.floor(screenX / this.tileSize),
      y: Math.floor(screenY / this.tileSize),
    };
  }

  destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}
