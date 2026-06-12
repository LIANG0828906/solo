import Phaser from 'phaser';
import {
  GRID_COLS,
  GRID_ROWS,
  CELL_SIZE,
  GAME_WIDTH,
  GAME_HEIGHT,
  ElementType,
  LevelCell,
  LevelData,
  createEmptyGrid,
} from './config';
import { EditorUI } from './EditorUI';

export class EditorScene extends Phaser.Scene {
  private grid: (LevelCell | null)[][] = [];
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private elementGroup!: Phaser.GameObjects.Group;
  private previewContainer: Phaser.GameObjects.Container | null = null;
  private selectedElement: ElementType | null = null;
  private platformLength: number = 2;
  private editorUI!: EditorUI;
  private cellObjects: Map<string, Phaser.GameObjects.GameObject[]> = new Map();
  private coinTweens: Phaser.Tweens.Tween[] = [];

  constructor() {
    super({ key: 'EditorScene' });
  }

  create(): void {
    this.editorUI = this.game.registry.get('editorUI') as EditorUI;

    const savedGrid = this.game.registry.get('editorGridData') as (LevelCell | null)[][] | undefined;
    if (savedGrid) {
      this.grid = savedGrid;
    } else {
      this.grid = createEmptyGrid();
    }

    this.generateTextures();
    this.drawGrid();
    this.elementGroup = this.add.group();
    this.rebuildVisuals();
    this.setupInput();
    this.setupUICallbacks();
  }

  private generateTextures(): void {
    if (this.textures.exists('ground')) return;

    let g: Phaser.GameObjects.Graphics;

    g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillGradientStyle(0x9B7424, 0x9B7424, 0x6B4914, 0x6B4914);
    g.fillRect(0, 0, CELL_SIZE, CELL_SIZE);
    g.lineStyle(1, 0x000000, 1);
    g.strokeRect(0.5, 0.5, CELL_SIZE - 1, CELL_SIZE - 1);
    g.generateTexture('ground', CELL_SIZE, CELL_SIZE);
    g.destroy();

    for (let len = 2; len <= 5; len++) {
      g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x808080, 1);
      g.fillRect(0, 0, len * CELL_SIZE, CELL_SIZE);
      g.lineStyle(1, 0x555555, 1);
      g.strokeRect(0.5, 0.5, len * CELL_SIZE - 1, CELL_SIZE - 1);
      for (let i = 1; i < len; i++) {
        g.lineStyle(1, 0x666666, 0.5);
        g.lineBetween(i * CELL_SIZE, 0, i * CELL_SIZE, CELL_SIZE);
      }
      g.generateTexture(`platform_${len}`, len * CELL_SIZE, CELL_SIZE);
      g.destroy();
    }

    g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xFF0000, 1);
    g.fillTriangle(CELL_SIZE / 2, 2, 2, CELL_SIZE - 2, CELL_SIZE - 2, CELL_SIZE - 2);
    g.lineStyle(1, 0xCC0000, 1);
    g.strokeTriangle(CELL_SIZE / 2, 2, 2, CELL_SIZE - 2, CELL_SIZE - 2, CELL_SIZE - 2);
    g.generateTexture('spike', CELL_SIZE, CELL_SIZE);
    g.destroy();

    g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xFF69B4, 1);
    g.fillCircle(CELL_SIZE / 2, CELL_SIZE / 2, 16);
    g.fillStyle(0xFF85C8, 1);
    g.fillCircle(CELL_SIZE / 2 - 4, CELL_SIZE / 2 - 4, 5);
    g.generateTexture('enemy', CELL_SIZE, CELL_SIZE);
    g.destroy();

    g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xFFD700, 1);
    const cx = CELL_SIZE / 2, cy = CELL_SIZE / 2, r = 14;
    g.fillTriangle(cx, cy - r, cx + r, cy, cx, cy + r);
    g.fillTriangle(cx, cy - r, cx - r, cy, cx, cy + r);
    g.lineStyle(1, 0xCC9900, 1);
    g.strokeTriangle(cx, cy - r, cx + r, cy, cx, cy + r);
    g.strokeTriangle(cx, cy - r, cx - r, cy, cx, cy + r);
    g.generateTexture('coin', CELL_SIZE, CELL_SIZE);
    g.destroy();

    g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x4488FF, 1);
    g.fillCircle(CELL_SIZE / 2, 10, 8);
    g.fillRect(CELL_SIZE / 2 - 6, 18, 12, 12);
    g.fillRect(CELL_SIZE / 2 - 10, 18, 5, 8);
    g.fillRect(CELL_SIZE / 2 + 5, 18, 5, 8);
    g.fillRect(CELL_SIZE / 2 - 5, 30, 4, 8);
    g.fillRect(CELL_SIZE / 2 + 1, 30, 4, 8);
    g.generateTexture('player_start', CELL_SIZE, CELL_SIZE);
    g.destroy();

    g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x8B4513, 1);
    g.fillRect(8, 4, 3, 34);
    g.fillStyle(0x00CC00, 1);
    g.fillTriangle(11, 4, 34, 12, 11, 22);
    g.lineStyle(1, 0x008800, 1);
    g.strokeTriangle(11, 4, 34, 12, 11, 22);
    g.generateTexture('end_flag', CELL_SIZE, CELL_SIZE);
    g.destroy();

    g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x4488FF, 1);
    g.fillCircle(CELL_SIZE / 2, 10, 8);
    g.fillRect(CELL_SIZE / 2 - 6, 18, 12, 14);
    g.fillRect(CELL_SIZE / 2 - 10, 20, 5, 8);
    g.fillRect(CELL_SIZE / 2 + 5, 20, 5, 8);
    g.fillRect(CELL_SIZE / 2 - 5, 32, 4, 8);
    g.fillRect(CELL_SIZE / 2 + 1, 32, 4, 8);
    g.generateTexture('player_preview', CELL_SIZE, CELL_SIZE);
    g.destroy();
  }

  private drawGrid(): void {
    this.gridGraphics = this.add.graphics();
    this.gridGraphics.lineStyle(1, 0x2A2A4E, 0.6);

    for (let x = 0; x <= GRID_COLS; x++) {
      this.gridGraphics.lineBetween(x * CELL_SIZE, 0, x * CELL_SIZE, GAME_HEIGHT);
    }
    for (let y = 0; y <= GRID_ROWS; y++) {
      this.gridGraphics.lineBetween(0, y * CELL_SIZE, GAME_WIDTH, y * CELL_SIZE);
    }
  }

  private setupInput(): void {
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.updatePreview(pointer);
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) {
        this.removeElementAtPointer(pointer);
      } else {
        this.placeElementAtPointer(pointer);
      }
    });

    this.input.on('pointerout', () => {
      this.clearPreview();
    });

    (this.input.keyboard as Phaser.Input.Keyboard.KeyboardPlugin).on('keydown-ESC', () => {
      // No-op in editor, reserved for preview
    });
  }

  private setupUICallbacks(): void {
    this.editorUI.setEnabled(true);
  }

  setSelectedElement(type: ElementType | null): void {
    this.selectedElement = type;
    this.clearPreview();
  }

  setPlatformLength(length: number): void {
    this.platformLength = length;
    this.clearPreview();
  }

  private updatePreview(pointer: Phaser.Input.Pointer): void {
    this.clearPreview();

    if (!this.selectedElement || this.selectedElement === ElementType.ERASER) return;

    const gridX = Math.floor(pointer.x / CELL_SIZE);
    const gridY = Math.floor(pointer.y / CELL_SIZE);
    if (!this.isInGrid(gridX, gridY)) return;

    this.previewContainer = this.createElementVisual(gridX, gridY, this.selectedElement, this.platformLength, 0.5);
    if (this.previewContainer) {
      this.add.existing(this.previewContainer);
    }
  }

  private clearPreview(): void {
    if (this.previewContainer) {
      this.previewContainer.destroy(true);
      this.previewContainer = null;
    }
  }

  private placeElementAtPointer(pointer: Phaser.Input.Pointer): void {
    if (!this.selectedElement) return;

    const gridX = Math.floor(pointer.x / CELL_SIZE);
    const gridY = Math.floor(pointer.y / CELL_SIZE);

    if (!this.isInGrid(gridX, gridY)) return;

    if (this.selectedElement === ElementType.ERASER) {
      this.removeElement(gridX, gridY);
      return;
    }

    this.placeElement(gridX, gridY, this.selectedElement, this.platformLength);
  }

  private removeElementAtPointer(pointer: Phaser.Input.Pointer): void {
    const gridX = Math.floor(pointer.x / CELL_SIZE);
    const gridY = Math.floor(pointer.y / CELL_SIZE);
    if (!this.isInGrid(gridX, gridY)) return;
    this.removeElement(gridX, gridY);
  }

  private placeElement(gridX: number, gridY: number, type: ElementType, platformLen: number): void {
    if (type === ElementType.PLAYER_START) {
      for (let y = 0; y < GRID_ROWS; y++) {
        for (let x = 0; x < GRID_COLS; x++) {
          if (this.grid[y][x]?.type === ElementType.PLAYER_START) {
            this.removeElement(x, y);
          }
        }
      }
    }

    if (type === ElementType.END_FLAG) {
      for (let y = 0; y < GRID_ROWS; y++) {
        for (let x = 0; x < GRID_COLS; x++) {
          if (this.grid[y][x]?.type === ElementType.END_FLAG) {
            this.removeElement(x, y);
          }
        }
      }
    }

    if (type === ElementType.PLATFORM) {
      const endX = gridX + platformLen - 1;
      if (endX >= GRID_COLS) return;
      for (let x = gridX; x <= endX; x++) {
        if (this.grid[gridY][x] !== null) {
          this.removeElement(x, gridY);
        }
      }
      this.grid[gridY][gridX] = { type: ElementType.PLATFORM, platformLength: platformLen };
      for (let x = gridX + 1; x <= endX; x++) {
        this.grid[gridY][x] = { type: ElementType.PLATFORM, platformLength: 0 };
      }
      this.createCellVisual(gridX, gridY, type, platformLen);
    } else {
      if (this.grid[gridY][gridX] !== null) {
        this.removeElement(gridX, gridY);
      }
      const cell: LevelCell = { type };
      if (type === ElementType.ENEMY) {
        cell.enemyRange = 3;
      }
      this.grid[gridY][gridX] = cell;
      this.createCellVisual(gridX, gridY, type);
    }
  }

  private removeElement(gridX: number, gridY: number): void {
    const cell = this.grid[gridY][gridX];
    if (!cell) return;

    if (cell.type === ElementType.PLATFORM && cell.platformLength && cell.platformLength > 0) {
      const len = cell.platformLength;
      for (let x = gridX; x < gridX + len && x < GRID_COLS; x++) {
        this.grid[gridY][x] = null;
        this.destroyCellVisual(x, gridY);
      }
    } else if (cell.type === ElementType.PLATFORM) {
      let startX = gridX;
      while (startX > 0 && this.grid[gridY][startX - 1]?.type === ElementType.PLATFORM) {
        const prev = this.grid[gridY][startX - 1];
        if (prev && prev.platformLength && prev.platformLength > 0) break;
        startX--;
      }
      let headX = startX;
      let headCell = this.grid[gridY][headX];
      while (headX > 0) {
        const prev = this.grid[gridY][headX - 1];
        if (prev?.type === ElementType.PLATFORM && prev.platformLength && prev.platformLength > 0) {
          headCell = prev;
          headX = headX - 1;
          break;
        }
        headX--;
      }

      if (headCell && headCell.platformLength && headCell.platformLength > 0) {
        const len = headCell.platformLength;
        for (let x = headX; x < headX + len && x < GRID_COLS; x++) {
          this.grid[gridY][x] = null;
          this.destroyCellVisual(x, gridY);
        }
      }
    } else {
      this.grid[gridY][gridX] = null;
      this.destroyCellVisual(gridX, gridY);
    }
  }

  private createCellVisual(gridX: number, gridY: number, type: ElementType, platformLen?: number): void {
    this.destroyCellVisual(gridX, gridY);

    const visual = this.createElementVisual(gridX, gridY, type, platformLen ?? 2, 1);
    if (!visual) return;

    this.add.existing(visual);
    this.elementGroup.add(visual);

    const key = `${gridX},${gridY}`;
    this.cellObjects.set(key, [visual]);

    visual.setAlpha(0);
    this.tweens.add({
      targets: visual,
      alpha: 1,
      duration: 200,
      ease: 'Linear',
    });

    if (type === ElementType.COIN) {
      this.addCoinAnimation(visual, gridX, gridY);
    }
  }

  private addCoinAnimation(container: Phaser.GameObjects.Container, gridX: number, gridY: number): void {
    const innerImg = container.list[0] as Phaser.GameObjects.Image;
    if (innerImg) {
      const tw = this.tweens.add({
        targets: innerImg,
        angle: 360,
        duration: 1500,
        repeat: -1,
        ease: 'Linear',
      });
      this.coinTweens.push(tw);
    }
  }

  private createElementVisual(
    gridX: number,
    gridY: number,
    type: ElementType,
    param: number,
    alpha: number
  ): Phaser.GameObjects.Container | null {
    const px = gridX * CELL_SIZE;
    const py = gridY * CELL_SIZE;
    const container = this.add.container(px, py);
    container.setAlpha(alpha);

    switch (type) {
      case ElementType.GROUND: {
        const img = this.add.image(CELL_SIZE / 2, CELL_SIZE / 2, 'ground');
        container.add(img);
        break;
      }
      case ElementType.PLATFORM: {
        const len = param;
        const img = this.add.image((len * CELL_SIZE) / 2, CELL_SIZE / 2, `platform_${len}`);
        container.add(img);
        break;
      }
      case ElementType.SPIKE: {
        const img = this.add.image(CELL_SIZE / 2, CELL_SIZE / 2, 'spike');
        container.add(img);
        break;
      }
      case ElementType.ENEMY: {
        const img = this.add.image(CELL_SIZE / 2, CELL_SIZE / 2, 'enemy');
        container.add(img);
        break;
      }
      case ElementType.COIN: {
        const img = this.add.image(CELL_SIZE / 2, CELL_SIZE / 2, 'coin');
        container.add(img);
        break;
      }
      case ElementType.PLAYER_START: {
        const img = this.add.image(CELL_SIZE / 2, CELL_SIZE / 2, 'player_start');
        container.add(img);
        break;
      }
      case ElementType.END_FLAG: {
        const img = this.add.image(CELL_SIZE / 2, CELL_SIZE / 2, 'end_flag');
        container.add(img);
        break;
      }
      default:
        container.destroy(true);
        return null;
    }

    return container;
  }

  private destroyCellVisual(gridX: number, gridY: number): void {
    const key = `${gridX},${gridY}`;
    const objects = this.cellObjects.get(key);
    if (objects) {
      objects.forEach((obj) => {
        if (obj instanceof Phaser.GameObjects.Container) {
          obj.destroy(true);
        }
        this.elementGroup.remove(obj, true, true);
      });
      this.cellObjects.delete(key);
    }
  }

  private rebuildVisuals(): void {
    this.cellObjects.forEach((objects) => {
      objects.forEach((obj) => {
        if (obj instanceof Phaser.GameObjects.Container) {
          obj.destroy(true);
        }
      });
    });
    this.cellObjects.clear();
    this.elementGroup.clear(true, true);
    this.coinTweens = [];

    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        const cell = this.grid[y][x];
        if (!cell) continue;

        if (cell.type === ElementType.PLATFORM) {
          if (cell.platformLength && cell.platformLength > 0) {
            this.createCellVisual(x, y, ElementType.PLATFORM, cell.platformLength);
          }
        } else {
          this.createCellVisual(x, y, cell.type);
        }
      }
    }
  }

  private isInGrid(x: number, y: number): boolean {
    return x >= 0 && x < GRID_COLS && y >= 0 && y < GRID_ROWS;
  }

  getLevelData(): LevelData {
    let playerStart: { x: number; y: number } | null = null;
    let endFlag: { x: number; y: number } | null = null;

    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        const cell = this.grid[y][x];
        if (cell?.type === ElementType.PLAYER_START) playerStart = { x, y };
        if (cell?.type === ElementType.END_FLAG) endFlag = { x, y };
      }
    }

    return {
      grid: JSON.parse(JSON.stringify(this.grid)),
      playerStart,
      endFlag,
    };
  }

  startPreview(): void {
    const levelData = this.getLevelData();

    if (!levelData.playerStart) {
      this.editorUI.showToast('缺少玩家起始点！', 'error');
      return;
    }
    if (!levelData.endFlag) {
      this.editorUI.showToast('缺少终点旗帜！', 'error');
      return;
    }

    this.game.registry.set('levelData', levelData);
    this.game.registry.set('editorGridData', this.grid);
    this.editorUI.setEnabled(false);
    this.scene.start('GamePreviewScene', { levelData });
  }

  saveLevel(): void {
    const levelData = this.getLevelData();
    try {
      localStorage.setItem('level_1', JSON.stringify(levelData));
      this.editorUI.showToast('已保存', 'success');
    } catch {
      this.editorUI.showToast('保存失败', 'error');
    }
  }

  loadLevel(): void {
    try {
      const data = localStorage.getItem('level_1');
      if (!data) {
        this.editorUI.showToast('没有找到存档', 'error');
        return;
      }
      const levelData: LevelData = JSON.parse(data);
      this.grid = levelData.grid;
      this.rebuildVisuals();
      this.editorUI.showToast('加载成功', 'success');
    } catch {
      this.editorUI.showToast('加载失败', 'error');
    }
  }
}
