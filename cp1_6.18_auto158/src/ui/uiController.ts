import {
  BuildingBlueprint,
  BuildingType,
  BUILDING_BLUEPRINTS,
  ResourceType,
} from '../data/worldData';

export interface PlayerResources {
  wood: number;
  stone: number;
  food: number;
}

export interface InventoryItem {
  type: 'resource' | 'item';
  resourceType?: ResourceType;
  itemId?: string;
  name: string;
  count: number;
}

export interface BuildMenuState {
  visible: boolean;
  selectedBuilding: BuildingType | null;
  hoveredBuilding: BuildingType | null;
}

export interface InventoryState {
  visible: boolean;
  items: InventoryItem[];
}

export interface UICallbacks {
  onBuildingSelected: (type: BuildingType) => void;
  onBuildMenuClosed: () => void;
  onInventoryClosed: () => void;
}

export class UIController {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private callbacks: UICallbacks;

  public playerHealth: number = 100;
  public playerMaxHealth: number = 100;
  public resources: PlayerResources = { wood: 0, stone: 0, food: 0 };
  public gameTime: number = 0;
  public isNight: boolean = false;
  public nightTransition: number = 0;
  public loadFadeAlpha: number = 0;

  public buildMenu: BuildMenuState = {
    visible: false,
    selectedBuilding: null,
    hoveredBuilding: null,
  };

  public inventory: InventoryState = {
    visible: false,
    items: [],
  };

  public buttonPressScale: Record<string, number> = {};

  private mouseX: number = 0;
  private mouseY: number = 0;

  constructor(canvas: HTMLCanvasElement, callbacks: UICallbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.callbacks = callbacks;
  }

  setResources(res: PlayerResources) {
    this.resources = res;
    this.updateInventoryItems();
  }

  private updateInventoryItems() {
    this.inventory.items = [
      {
        type: 'resource',
        resourceType: 'wood',
        name: '木材',
        count: this.resources.wood,
      },
      {
        type: 'resource',
        resourceType: 'stone',
        name: '石块',
        count: this.resources.stone,
      },
      {
        type: 'resource',
        resourceType: 'food',
        name: '食物',
        count: this.resources.food,
      },
    ];
  }

  toggleBuildMenu() {
    this.buildMenu.visible = !this.buildMenu.visible;
    if (!this.buildMenu.visible) {
      this.buildMenu.selectedBuilding = null;
      this.callbacks.onBuildMenuClosed();
    }
  }

  toggleInventory() {
    this.inventory.visible = !this.inventory.visible;
    if (!this.inventory.visible) {
      this.callbacks.onInventoryClosed();
    }
  }

  setMousePosition(x: number, y: number) {
    this.mouseX = x;
    this.mouseY = y;
    this.updateHoveredBuilding();
  }

  private updateHoveredBuilding() {
    if (!this.buildMenu.visible) {
      this.buildMenu.hoveredBuilding = null;
      return;
    }
    const menuRect = this.getBuildMenuRect();
    if (
      this.mouseX < menuRect.x ||
      this.mouseX > menuRect.x + menuRect.w ||
      this.mouseY < menuRect.y ||
      this.mouseY > menuRect.y + menuRect.h
    ) {
      this.buildMenu.hoveredBuilding = null;
      return;
    }
    const types: BuildingType[] = ['woodWall', 'stoneWall', 'tower', 'warehouse'];
    for (let i = 0; i < types.length; i++) {
      const entryY = menuRect.y + i * 40;
      if (this.mouseY >= entryY && this.mouseY < entryY + 40) {
        this.buildMenu.hoveredBuilding = types[i];
        return;
      }
    }
    this.buildMenu.hoveredBuilding = null;
  }

  handleClick(x: number, y: number): boolean {
    if (this.buildMenu.visible) {
      const menuRect = this.getBuildMenuRect();
      if (
        x >= menuRect.x && x <= menuRect.x + menuRect.w &&
        y >= menuRect.y && y <= menuRect.y + menuRect.h
      ) {
        const types: BuildingType[] = ['woodWall', 'stoneWall', 'tower', 'warehouse'];
        for (let i = 0; i < types.length; i++) {
          const entryY = menuRect.y + i * 40;
          if (y >= entryY && y < entryY + 40) {
            const type = types[i];
            this.buildMenu.selectedBuilding = type;
            this.buttonPressScale[`build_${type}`] = 1;
            this.callbacks.onBuildingSelected(type);
            return true;
          }
        }
      }
    }

    if (this.inventory.visible) {
      const invRect = this.getInventoryRect();
      if (
        x < invRect.x || x > invRect.x + invRect.w ||
        y < invRect.y || y > invRect.y + invRect.h
      ) {
        this.toggleInventory();
        return true;
      }
      return true;
    }

    return false;
  }

  private getBuildMenuRect() {
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const w = 180;
    const h = 40 * 4;
    return {
      x: cw - w - 30,
      y: Math.floor((ch - h) / 2),
      w,
      h,
    };
  }

  private getInventoryRect() {
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const w = 8 * 50 + 7 * 4 + 32;
    const h = 4 * 50 + 3 * 4 + 32 + 40;
    return {
      x: Math.floor((cw - w) / 2),
      y: Math.floor((ch - h) / 2),
      w,
      h,
    };
  }

  private canAfford(bp: BuildingBlueprint): boolean {
    return (
      this.resources.wood >= bp.woodCost &&
      this.resources.stone >= bp.stoneCost &&
      this.resources.food >= bp.foodCost
    );
  }

  renderHUD() {
    const ctx = this.ctx;
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const hudH = 40;
    const hudY = ch - hudH;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, hudY, cw, hudH);

    ctx.fillStyle = '#ffffff';
    ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textBaseline = 'middle';

    const hpX = 20;
    const hpY = hudY + hudH / 2;
    const hpW = 140;
    const hpH = 16;
    const hpRatio = Math.max(0, this.playerHealth / this.playerMaxHealth);

    ctx.fillStyle = '#333333';
    ctx.fillRect(hpX, hpY - hpH / 2, hpW, hpH);

    let hpColor = '#4ecdc4';
    if (this.playerHealth < 50) {
      hpColor = Math.floor(Date.now() / 200) % 2 === 0 ? '#ff4444' : '#ff8888';
    } else if (this.playerHealth <= this.playerMaxHealth - 20) {
      hpColor = '#ffdd44';
    } else {
      hpColor = '#44dd66';
    }
    ctx.fillStyle = hpColor;
    ctx.fillRect(hpX, hpY - hpH / 2, hpW * hpRatio, hpH);

    ctx.strokeStyle = '#555555';
    ctx.lineWidth = 1;
    ctx.strokeRect(hpX + 0.5, hpY - hpH / 2 + 0.5, hpW, hpH);

    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${Math.ceil(this.playerHealth)}/${this.playerMaxHealth}`, hpX + hpW + 10, hpY);

    const resourcesStartX = hpX + hpW + 90;
    const resList: { type: ResourceType; label: string; iconColor: string }[] = [
      { type: 'wood', label: '木', iconColor: '#8B5A2B' },
      { type: 'stone', label: '石', iconColor: '#909090' },
      { type: 'food', label: '食', iconColor: '#e74c3c' },
    ];

    resList.forEach((res, i) => {
      const rx = resourcesStartX + i * 60;
      const ry = hudY + hudH / 2;

      ctx.fillStyle = res.iconColor;
      if (res.type === 'wood') {
        ctx.fillRect(rx, ry - 6, 12, 12);
      } else if (res.type === 'stone') {
        ctx.beginPath();
        ctx.moveTo(rx, ry + 6);
        ctx.lineTo(rx + 4, ry - 6);
        ctx.lineTo(rx + 12, ry - 4);
        ctx.lineTo(rx + 10, ry + 6);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(rx + 6, ry, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${this.resources[res.type]}`, rx + 18, ry);
    });

    const timeX = cw - 120;
    const timeLabel = this.isNight ? '夜晚' : '白天';
    ctx.fillStyle = this.isNight ? '#4a6fa5' : '#f4d35e';
    ctx.fillText(timeLabel, timeX, hpY);
  }

  renderBuildMenu() {
    if (!this.buildMenu.visible) return;

    const ctx = this.ctx;
    const rect = this.getBuildMenuRect();
    const types: BuildingType[] = ['woodWall', 'stoneWall', 'tower', 'warehouse'];

    ctx.fillStyle = '#2d2d3e';
    this.roundRect(rect.x, rect.y, rect.w, rect.h, 8);
    ctx.fill();

    types.forEach((type, i) => {
      const bp = BUILDING_BLUEPRINTS[type];
      const entryY = rect.y + i * 40;
      const isHovered = this.buildMenu.hoveredBuilding === type;
      const isSelected = this.buildMenu.selectedBuilding === type;
      const affordable = this.canAfford(bp);
      const pressKey = `build_${type}`;
      let scale = 1;
      if (this.buttonPressScale[pressKey] !== undefined) {
        scale = 0.95 + 0.05 * this.buttonPressScale[pressKey];
      }

      if (isHovered || isSelected) {
        ctx.fillStyle = '#3d3d5e';
        ctx.fillRect(rect.x, entryY, rect.w, 40);
      }

      if (isSelected) {
        ctx.fillStyle = '#4ecdc4';
        ctx.fillRect(rect.x, entryY, 4, 40);
      }

      const entryCX = rect.x + rect.w / 2;
      const entryCY = entryY + 20;
      ctx.save();
      ctx.translate(entryCX, entryCY);
      ctx.scale(scale, scale);

      ctx.fillStyle = bp.color;
      ctx.fillRect(-50, -6, 14, 12);

      ctx.fillStyle = affordable ? '#ffffff' : '#888888';
      ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(bp.name, -30, 0);

      const costStr: string[] = [];
      if (bp.woodCost > 0) costStr.push(`木${bp.woodCost}`);
      if (bp.stoneCost > 0) costStr.push(`石${bp.stoneCost}`);
      ctx.fillStyle = affordable ? '#4ecdc4' : '#666666';
      ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(costStr.join(' '), -30, 12);

      ctx.restore();
    });

    ctx.textAlign = 'left';
  }

  renderInventory() {
    if (!this.inventory.visible) return;

    const ctx = this.ctx;
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, cw, ch);

    const rect = this.getInventoryRect();
    ctx.fillStyle = '#2d2d3e';
    this.roundRect(rect.x, rect.y, rect.w, rect.h, 12);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '16px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText('背包', rect.x + 16, rect.y + 12);

    const gridStartX = rect.x + 16;
    const gridStartY = rect.y + 50;
    const cellSize = 50;
    const gap = 4;

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 8; col++) {
        const cx = gridStartX + col * (cellSize + gap);
        const cy = gridStartY + row * (cellSize + gap);
        ctx.strokeStyle = '#555555';
        ctx.setLineDash([3, 2]);
        ctx.lineWidth = 1;
        ctx.strokeRect(cx + 0.5, cy + 0.5, cellSize, cellSize);
        ctx.setLineDash([]);

        const idx = row * 8 + col;
        if (idx < this.inventory.items.length) {
          const item = this.inventory.items[idx];
          this.drawInventoryItem(ctx, cx, cy, cellSize, item);
        }
      }
    }
  }

  private drawInventoryItem(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    cellSize: number,
    item: InventoryItem
  ) {
    const iconSize = 16;
    const ix = cx + (cellSize - iconSize) / 2;
    const iy = cy + (cellSize - iconSize) / 2;

    if (item.resourceType === 'wood') {
      ctx.fillStyle = '#8B5A2B';
      ctx.fillRect(ix, iy, iconSize, iconSize);
    } else if (item.resourceType === 'stone') {
      ctx.fillStyle = '#909090';
      ctx.beginPath();
      ctx.moveTo(ix, iy + iconSize);
      ctx.lineTo(ix + 4, iy);
      ctx.lineTo(ix + iconSize, iy + 3);
      ctx.lineTo(ix + iconSize - 2, iy + iconSize);
      ctx.closePath();
      ctx.fill();
    } else if (item.resourceType === 'food') {
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.arc(ix + iconSize / 2, iy + iconSize / 2, iconSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = '8px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${item.count}`, cx + cellSize - 3, cy + cellSize - 3);
    ctx.textAlign = 'left';
  }

  renderNightOverlay() {
    if (this.nightTransition <= 0) return;

    const ctx = this.ctx;
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const alpha = Math.min(0.6, this.nightTransition);

    const gradient = ctx.createRadialGradient(
      cw / 2, ch / 2, Math.min(cw, ch) * 0.3,
      cw / 2, ch / 2, Math.max(cw, ch) * 0.7
    );
    gradient.addColorStop(0, `rgba(13, 27, 42, ${alpha * 0.3})`);
    gradient.addColorStop(1, `rgba(13, 27, 42, ${alpha})`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, cw, ch);
  }

  renderLoadFade() {
    if (this.loadFadeAlpha <= 0) return;
    const ctx = this.ctx;
    ctx.fillStyle = `rgba(0, 0, 0, ${this.loadFadeAlpha})`;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  update(deltaTime: number) {
    for (const key of Object.keys(this.buttonPressScale)) {
      this.buttonPressScale[key] = Math.max(0, this.buttonPressScale[key] - deltaTime * 10);
      if (this.buttonPressScale[key] <= 0) {
        delete this.buttonPressScale[key];
      }
    }
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number) {
    const ctx = this.ctx;
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
