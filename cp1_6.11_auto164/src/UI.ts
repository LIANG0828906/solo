import {
  ItemCategory,
  STAT_BG_COLOR,
  UI_PANEL_BG,
  UI_HINT_BG,
  HP_COLOR,
  HUNGER_COLOR,
  THIRST_COLOR,
  FOOD_BG_COLOR,
  MATERIAL_BG_COLOR,
  RESOURCE_INFO,
  TERRAIN_INFO,
  INVENTORY_MAX_SLOTS
} from './data';
import { Player } from './Player';
import { Island } from './Island';

interface InventoryItemRect {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export class UI {
  private panelSlideProgress: number = 0;
  private hoveredInventoryIndex: number = -1;
  private clickedInventoryIndex: number = -1;
  private clickScaleTimer: number = 0;
  private inventoryItemRects: InventoryItemRect[] = [];

  update(dt: number): void {
    if (this.panelSlideProgress < 1) {
      this.panelSlideProgress = Math.min(1, this.panelSlideProgress + dt / 0.3);
    }
    if (this.clickScaleTimer > 0) {
      this.clickScaleTimer -= dt;
    }
  }

  drawStatusBars(ctx: CanvasRenderingContext2D, player: Player): void {
    const x = 20;
    const startY = 20;
    const width = 200;
    const height = 16;
    const gap = 8;

    this.drawStatBar(ctx, x, startY, width, height, player.getHp(), HP_COLOR, '生命');
    this.drawStatBar(ctx, x, startY + height + gap, width, height, player.getHunger(), HUNGER_COLOR, '饥饿');
    this.drawStatBar(ctx, x, startY + (height + gap) * 2, width, height, player.getThirst(), THIRST_COLOR, '口渴');
  }

  private drawStatBar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    value: number,
    color: string,
    label: string
  ): void {
    ctx.save();
    ctx.beginPath();
    this.roundRect(ctx, x, y, width, height, 8);
    ctx.fillStyle = STAT_BG_COLOR;
    ctx.fill();

    const fillWidth = Math.max(0, Math.min(1, value / 100)) * (width - 4);
    if (fillWidth > 0) {
      ctx.beginPath();
      this.roundRect(ctx, x + 2, y + 2, fillWidth, height - 4, 6);
      ctx.fillStyle = color;
      ctx.fill();
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${label}: ${Math.round(value)}%`, x + 8, y + height / 2);
    ctx.restore();
  }

  drawInventoryPanel(ctx: CanvasRenderingContext2D, player: Player, canvasWidth: number, canvasHeight: number): void {
    const panelWidth = 200;
    const panelX = canvasWidth - panelWidth * this.panelSlideProgress;
    const panelY = 20;
    const panelHeight = canvasHeight - 40;

    this.inventoryItemRects = [];

    ctx.save();
    ctx.beginPath();
    this.roundRect(ctx, panelX, panelY, panelWidth, panelHeight, 8);
    ctx.fillStyle = UI_PANEL_BG;
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`背包 ${player.getInventoryCount()}/${INVENTORY_MAX_SLOTS}`, panelX + panelWidth / 2, panelY + 12);

    const inventory = player.getInventory();
    const itemSize = 48;
    const padding = 10;
    const gap = 8;
    const cols = Math.floor((panelWidth - padding * 2 + gap) / (itemSize + gap));
    const startX = panelX + padding;
    const startY = panelY + 45;

    for (let i = 0; i < inventory.length; i++) {
      const slot = inventory[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const ix = startX + col * (itemSize + gap);
      const iy = startY + row * (itemSize + gap);

      this.inventoryItemRects.push({
        index: i,
        x: ix,
        y: iy,
        width: itemSize,
        height: itemSize
      });

      const isHovered = this.hoveredInventoryIndex === i;
      const isClicked = this.clickedInventoryIndex === i && this.clickScaleTimer > 0;
      let scale = 1;
      if (isHovered) scale = 1.05;
      if (isClicked) scale = 0.95;

      const cx = ix + itemSize / 2;
      const cy = iy + itemSize / 2;
      const drawSize = itemSize * scale;
      const drawX = cx - drawSize / 2;
      const drawY = cy - drawSize / 2;

      const info = RESOURCE_INFO[slot.type];
      const bgColor = info.category === ItemCategory.FOOD ? FOOD_BG_COLOR : MATERIAL_BG_COLOR;

      ctx.beginPath();
      this.roundRect(ctx, drawX, drawY, drawSize, drawSize, 6);
      ctx.fillStyle = bgColor;
      ctx.fill();

      const iconScale = drawSize / 48;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(iconScale, iconScale);
      ctx.fillStyle = info.color;

      switch (info.shape) {
        case 'ellipse':
          ctx.beginPath();
          ctx.ellipse(0, 0, 12, 14, 0, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'rect':
          ctx.fillRect(-12, -10, 24, 20);
          break;
        case 'circle':
          ctx.beginPath();
          ctx.arc(0, 0, 10, 0, Math.PI * 2);
          ctx.fill();
          break;
      }
      ctx.restore();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`×${slot.count}`, ix + itemSize - 4, iy + itemSize - 2);
    }

    if (this.hoveredInventoryIndex >= 0 && this.hoveredInventoryIndex < inventory.length) {
      const slot = inventory[this.hoveredInventoryIndex];
      const info = RESOURCE_INFO[slot.type];
      const rect = this.inventoryItemRects[this.hoveredInventoryIndex];

      const tooltipX = rect.x - 10;
      const tooltipY = rect.y + rect.height + 5;
      const tooltipText1 = info.name;
      const tooltipText2 = info.description;

      ctx.font = '12px sans-serif';
      const textWidth = Math.max(ctx.measureText(tooltipText1).width, ctx.measureText(tooltipText2).width) + 16;
      const tooltipHeight = 38;

      ctx.fillStyle = 'rgba(0,0,0,0.9)';
      this.roundRect(ctx, tooltipX - textWidth, tooltipY, textWidth, tooltipHeight, 4);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(tooltipText1, tooltipX - textWidth + 8, tooltipY + 6);
      ctx.font = '11px sans-serif';
      ctx.fillText(tooltipText2, tooltipX - textWidth + 8, tooltipY + 22);
    }

    ctx.restore();
  }

  drawHintBar(ctx: CanvasRenderingContext2D, player: Player, island: Island, canvasWidth: number, canvasHeight: number): void {
    const cell = island.getCell(player.getActualQ(), player.getActualR());
    const hints: string[] = [];

    if (cell) {
      const terrainInfo = TERRAIN_INFO[cell.terrain];
      hints.push(`当前位置: ${terrainInfo.label}`);

      if (cell.resources.length > 0) {
        const resourceNames = cell.resources.map(r => RESOURCE_INFO[r].name);
        hints.push(`点击资源图标采集: ${resourceNames.join('、')}`);
      }

      const neighbors = island.getWalkableNeighbors(player.getActualQ(), player.getActualR());
      if (neighbors.length > 0) {
        hints.push(`点击相邻格子移动`);
      }
    }

    if (player.getInventoryCount() > 0) {
      hints.push(`点击背包物品使用食物`);
    }

    if (hints.length === 0) {
      hints.push('探索岛屿，采集资源维持生存');
    }

    const hintText = hints.join('  |  ');
    ctx.font = '16px sans-serif';
    const textWidth = ctx.measureText(hintText).width;
    const paddingX = 24;
    const barWidth = Math.min(textWidth + paddingX * 2, canvasWidth - 40);
    const barHeight = 60;
    const barX = (canvasWidth - barWidth) / 2;
    const barY = canvasHeight - barHeight - 20;

    ctx.save();
    ctx.beginPath();
    this.roundRect(ctx, barX, barY, barWidth, barHeight, 12);
    ctx.fillStyle = UI_HINT_BG;
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.save();
    ctx.beginPath();
    this.roundRect(ctx, barX, barY, barWidth, barHeight, 12);
    ctx.clip();
    ctx.fillText(hintText, canvasWidth / 2, barY + barHeight / 2);
    ctx.restore();

    ctx.restore();
  }

  drawInventoryFullWarning(ctx: CanvasRenderingContext2D, player: Player, canvasWidth: number): void {
    if (!player.getInventoryFullWarning()) return;
    const alpha = player.getInventoryFullWarningAlpha();

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#FF0000';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('背包已满！', canvasWidth / 2, 100);
    ctx.restore();
  }

  drawGameOver(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('游戏结束', canvasWidth / 2, canvasHeight / 2 - 30);

    ctx.font = '20px sans-serif';
    ctx.fillText('你没能在孤岛上生存下来...', canvasWidth / 2, canvasHeight / 2 + 30);
    ctx.restore();
  }

  getInventoryIndexAt(x: number, y: number): number {
    for (const rect of this.inventoryItemRects) {
      if (x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height) {
        return rect.index;
      }
    }
    return -1;
  }

  setHoveredInventoryIndex(index: number): void {
    this.hoveredInventoryIndex = index;
  }

  setClickedInventoryIndex(index: number): void {
    this.clickedInventoryIndex = index;
    this.clickScaleTimer = 0.15;
  }

  getInventoryItemCenter(index: number): { x: number; y: number } | null {
    const rect = this.inventoryItemRects.find(r => r.index === index);
    if (!rect) return null;
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
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
}
