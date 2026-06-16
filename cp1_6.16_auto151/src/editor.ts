import {
  ElementType,
  GridElement,
  LevelData,
  LevelStats,
  EditorState,
  GRID_SIZE,
  MIN_ZOOM,
  MAX_ZOOM,
  COLORS,
} from './types';

export class Editor {
  private elements: GridElement[] = [];
  private gridWidth: number = 30;
  private gridHeight: number = 20;
  private spawnX: number = 2;
  private spawnY: number = 18;
  private state: EditorState = {
    zoom: 1,
    offsetX: 50,
    offsetY: 50,
    selectedElement: ElementType.BRICK,
    isPlaying: false,
    hoverGridX: -1,
    hoverGridY: -1,
    isFading: false,
  };
  private onChangeCallback?: () => void;

  getElements(): GridElement[] {
    return this.elements;
  }

  getGridSize(): { width: number; height: number } {
    return { width: this.gridWidth, height: this.gridHeight };
  }

  getSpawnPosition(): { x: number; y: number } {
    return { x: this.spawnX * GRID_SIZE, y: this.spawnY * GRID_SIZE };
  }

  getState(): EditorState {
    return { ...this.state };
  }

  setSelectedElement(type: ElementType): void {
    this.state.selectedElement = type;
  }

  setPlaying(playing: boolean): void {
    this.state.isPlaying = playing;
  }

  setHoverPosition(gridX: number, gridY: number): void {
    this.state.hoverGridX = gridX;
    this.state.hoverGridY = gridY;
  }

  setFading(fading: boolean): void {
    this.state.isFading = fading;
  }

  setZoom(zoom: number, centerX: number = 0, centerY: number = 0): void {
    const oldZoom = this.state.zoom;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
    
    const worldX = (centerX - this.state.offsetX) / oldZoom;
    const worldY = (centerY - this.state.offsetY) / oldZoom;
    
    this.state.zoom = newZoom;
    this.state.offsetX = centerX - worldX * newZoom;
    this.state.offsetY = centerY - worldY * newZoom;
  }

  pan(dx: number, dy: number): void {
    this.state.offsetX += dx;
    this.state.offsetY += dy;
  }

  screenToGrid(screenX: number, screenY: number): { x: number; y: number } {
    const worldX = (screenX - this.state.offsetX) / this.state.zoom;
    const worldY = (screenY - this.state.offsetY) / this.state.zoom;
    return {
      x: Math.floor(worldX / GRID_SIZE),
      y: Math.floor(worldY / GRID_SIZE),
    };
  }

  placeElement(gridX: number, gridY: number, type?: ElementType): boolean {
    const elementType = type || this.state.selectedElement;
    
    if (gridX < 0 || gridY < 0 || gridX >= this.gridWidth || gridY >= this.gridHeight) {
      return false;
    }

    const existingIndex = this.elements.findIndex(
      (e) => e.x === gridX && e.y === gridY && e.type === elementType
    );

    if (existingIndex >= 0) {
      this.elements.splice(existingIndex, 1);
      this.notifyChange();
      return false;
    }

    const newElement: GridElement = {
      type: elementType,
      x: gridX,
      y: gridY,
    };

    if (elementType === ElementType.PLATFORM) {
      newElement.platformStartX = gridX;
      newElement.platformEndX = gridX + 3;
      newElement.platformSpeed = 80;
      newElement.platformDirection = 1;
    }

    this.elements.push(newElement);
    this.expandGridIfNeeded(gridX, gridY);
    this.notifyChange();
    return true;
  }

  removeElement(gridX: number, gridY: number): boolean {
    const index = this.elements.findIndex((e) => e.x === gridX && e.y === gridY);
    if (index >= 0) {
      this.elements.splice(index, 1);
      this.notifyChange();
      return true;
    }
    return false;
  }

  toggleElement(gridX: number, gridY: number): boolean {
    const elementType = this.state.selectedElement;
    const existingIndex = this.elements.findIndex(
      (e) => e.x === gridX && e.y === gridY && e.type === elementType
    );

    if (existingIndex >= 0) {
      this.elements.splice(existingIndex, 1);
      this.notifyChange();
      return false;
    } else {
      return this.placeElement(gridX, gridY, elementType);
    }
  }

  private expandGridIfNeeded(x: number, y: number): void {
    if (x >= this.gridWidth - 2) {
      this.gridWidth = Math.max(this.gridWidth, x + 5);
    }
    if (y >= this.gridHeight - 2) {
      this.gridHeight = Math.max(this.gridHeight, y + 5);
    }
  }

  clear(): void {
    this.elements = [];
    this.gridWidth = 30;
    this.gridHeight = 20;
    this.spawnX = 2;
    this.spawnY = 18;
    this.state.offsetX = 50;
    this.state.offsetY = 50;
    this.state.zoom = 1;
    this.notifyChange();
  }

  getStats(): LevelStats {
    let brickCount = 0;
    let spikeCount = 0;
    let platformCount = 0;
    let goalCount = 0;

    for (const element of this.elements) {
      switch (element.type) {
        case ElementType.BRICK:
          brickCount++;
          break;
        case ElementType.SPIKE:
          spikeCount++;
          break;
        case ElementType.PLATFORM:
          platformCount++;
          break;
        case ElementType.GOAL:
          goalCount++;
          break;
      }
    }

    const estimatedTime = this.estimateClearTime();

    return {
      width: this.gridWidth,
      height: this.gridHeight,
      brickCount,
      spikeCount,
      platformCount,
      goalCount,
      estimatedTime,
    };
  }

  estimateClearTime(): number {
    const bricks = this.elements.filter((e) => e.type === ElementType.BRICK);
    const goals = this.elements.filter((e) => e.type === ElementType.GOAL);

    if (goals.length === 0 || bricks.length === 0) {
      return 0;
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const b of bricks) {
      minX = Math.min(minX, b.x);
      maxX = Math.max(maxX, b.x);
      minY = Math.min(minY, b.y);
      maxY = Math.max(maxY, b.y);
    }

    const horizontalDistance = (maxX - minX) * GRID_SIZE;
    const verticalDistance = (maxY - minY) * GRID_SIZE;
    
    const horizontalTime = horizontalDistance / 200;
    const jumpCount = Math.ceil(verticalDistance / 100);
    const jumpTime = jumpCount * 0.8;
    
    const difficultyMultiplier = 1 + this.elements.filter((e) => e.type === ElementType.SPIKE).length * 0.05;

    const estimated = (horizontalTime + jumpTime) * difficultyMultiplier;
    return Math.max(0, Math.round(estimated * 10) / 10);
  }

  exportData(name: string = '未命名关卡'): LevelData {
    return {
      id: '',
      name,
      width: this.gridWidth,
      height: this.gridHeight,
      elements: JSON.parse(JSON.stringify(this.elements)),
      spawnX: this.spawnX,
      spawnY: this.spawnY,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  importData(data: LevelData): void {
    this.elements = JSON.parse(JSON.stringify(data.elements));
    this.gridWidth = data.width;
    this.gridHeight = data.height;
    this.spawnX = data.spawnX ?? 2;
    this.spawnY = data.spawnY ?? 18;
    this.state.offsetX = 50;
    this.state.offsetY = 50;
    this.state.zoom = 1;
    this.notifyChange();
  }

  onChange(callback: () => void): void {
    this.onChangeCallback = callback;
  }

  private notifyChange(): void {
    if (this.onChangeCallback) {
      this.onChangeCallback();
    }
  }
}
