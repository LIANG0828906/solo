export interface Point {
  x: number;
  y: number;
  pressure?: number;
  timestamp?: number;
}

export interface Transform {
  tx: number;
  ty: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
}

export interface PathBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface Path {
  id: string;
  points: Point[];
  pathString: string;
  color: string;
  strokeWidth: number;
  bounds: PathBounds;
}

export interface Layer {
  id: string;
  name: string;
  path: Path;
  transform: Transform;
  visible: boolean;
  locked: boolean;
  zIndex: number;
  createdAt: number;
}

export interface Project {
  id: string;
  name: string;
  layers: Layer[];
  width: number;
  height: number;
  backgroundColor: string;
}

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const DEFAULT_TRANSFORM: Transform = {
  tx: 0,
  ty: 0,
  scaleX: 1,
  scaleY: 1,
  rotation: 0
};

export type SelectionMode = 'single' | 'additive' | 'toggle';

export class DataModel {
  private project: Project;
  private selectedLayerIds: Set<string>;
  private history: Project[];
  private historyIndex: number;
  private listeners: Set<() => void>;

  constructor(width = 1200, height = 800) {
    this.project = {
      id: generateId(),
      name: 'Untitled Project',
      layers: [],
      width,
      height,
      backgroundColor: '#ffffff'
    };
    this.selectedLayerIds = new Set();
    this.history = [JSON.parse(JSON.stringify(this.project))];
    this.historyIndex = 0;
    this.listeners = new Set();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach(listener => listener());
  }

  private pushHistory(): void {
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(JSON.parse(JSON.stringify(this.project)));
    this.historyIndex++;
    if (this.history.length > 50) {
      this.history.shift();
      this.historyIndex--;
    }
  }

  canUndo(): boolean {
    return this.historyIndex > 0;
  }

  canRedo(): boolean {
    return this.historyIndex < this.history.length - 1;
  }

  undo(): boolean {
    if (!this.canUndo()) return false;
    this.historyIndex--;
    this.project = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
    this.selectedLayerIds.clear();
    this.notify();
    return true;
  }

  redo(): boolean {
    if (!this.canRedo()) return false;
    this.historyIndex++;
    this.project = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
    this.selectedLayerIds.clear();
    this.notify();
    return true;
  }

  getProject(): Project {
    return { ...this.project, layers: [...this.project.layers] };
  }

  getLayers(): Layer[] {
    return [...this.project.layers].sort((a, b) => a.zIndex - b.zIndex);
  }

  getLayer(id: string): Layer | undefined {
    return this.project.layers.find(l => l.id === id);
  }

  getSelectedLayerIds(): string[] {
    return Array.from(this.selectedLayerIds);
  }

  getSelectedLayers(): Layer[] {
    return this.project.layers.filter(l => this.selectedLayerIds.has(l.id));
  }

  isSelected(id: string): boolean {
    return this.selectedLayerIds.has(id);
  }

  getSelectionCount(): number {
    return this.selectedLayerIds.size;
  }

  addLayer(pathData: Omit<Path, 'id'>, name?: string): Layer {
    const path: Path = {
      ...pathData,
      id: generateId()
    };
    const layer: Layer = {
      id: generateId(),
      name: name || `路径 ${this.project.layers.length + 1}`,
      path,
      transform: { ...DEFAULT_TRANSFORM },
      visible: true,
      locked: false,
      zIndex: this.project.layers.length,
      createdAt: Date.now()
    };
    this.project.layers.push(layer);
    this.selectedLayerIds.clear();
    this.selectedLayerIds.add(layer.id);
    this.pushHistory();
    this.notify();
    return layer;
  }

  addLayerFromPathString(
    pathString: string,
    points: Point[],
    bounds: PathBounds,
    options?: { name?: string; color?: string; strokeWidth?: number }
  ): Layer {
    return this.addLayer({
      points,
      pathString,
      color: options?.color || '#4a9eff',
      strokeWidth: options?.strokeWidth || 2,
      bounds
    }, options?.name);
  }

  updateLayerTransform(id: string, transform: Partial<Transform>): boolean {
    const layer = this.project.layers.find(l => l.id === id);
    if (!layer || layer.locked) return false;
    layer.transform = { ...layer.transform, ...transform };
    this.notify();
    return true;
  }

  updateLayersTransform(ids: string[], transform: Partial<Transform>): boolean {
    let updated = false;
    ids.forEach(id => {
      if (this.updateLayerTransform(id, transform)) {
        updated = true;
      }
    });
    return updated;
  }

  commitLayerTransform(id: string): boolean {
    const layer = this.project.layers.find(l => l.id === id);
    if (!layer) return false;
    this.pushHistory();
    return true;
  }

  commitLayersTransform(ids: string[]): boolean {
    if (ids.length === 0) return false;
    this.pushHistory();
    return true;
  }

  renameLayer(id: string, name: string): boolean {
    const layer = this.project.layers.find(l => l.id === id);
    if (!layer) return false;
    layer.name = name;
    this.pushHistory();
    this.notify();
    return true;
  }

  toggleLayerVisibility(id: string): boolean {
    const layer = this.project.layers.find(l => l.id === id);
    if (!layer) return false;
    layer.visible = !layer.visible;
    this.notify();
    return true;
  }

  toggleLayerLock(id: string): boolean {
    const layer = this.project.layers.find(l => l.id === id);
    if (!layer) return false;
    layer.locked = !layer.locked;
    if (layer.locked) {
      this.selectedLayerIds.delete(id);
    }
    this.notify();
    return true;
  }

  deleteLayer(id: string): boolean {
    const index = this.project.layers.findIndex(l => l.id === id);
    if (index === -1) return false;
    this.project.layers.splice(index, 1);
    this.selectedLayerIds.delete(id);
    this.reorderZIndex();
    this.pushHistory();
    this.notify();
    return true;
  }

  deleteSelectedLayers(): boolean {
    if (this.selectedLayerIds.size === 0) return false;
    this.project.layers = this.project.layers.filter(l => !this.selectedLayerIds.has(l.id));
    this.selectedLayerIds.clear();
    this.reorderZIndex();
    this.pushHistory();
    this.notify();
    return true;
  }

  duplicateLayer(id: string): Layer | null {
    const layer = this.project.layers.find(l => l.id === id);
    if (!layer) return null;
    const newLayer: Layer = {
      ...JSON.parse(JSON.stringify(layer)),
      id: generateId(),
      name: `${layer.name} 副本`,
      transform: {
        ...layer.transform,
        tx: layer.transform.tx + 20,
        ty: layer.transform.ty + 20
      },
      zIndex: this.project.layers.length,
      createdAt: Date.now()
    };
    newLayer.path.id = generateId();
    this.project.layers.push(newLayer);
    this.selectedLayerIds.clear();
    this.selectedLayerIds.add(newLayer.id);
    this.pushHistory();
    this.notify();
    return newLayer;
  }

  reorderLayer(id: string, newZIndex: number): boolean {
    const layers = this.project.layers;
    const index = layers.findIndex(l => l.id === id);
    if (index === -1) return false;
    const [layer] = layers.splice(index, 1);
    newZIndex = Math.max(0, Math.min(newZIndex, layers.length));
    layers.splice(newZIndex, 0, layer);
    this.reorderZIndex();
    this.pushHistory();
    this.notify();
    return true;
  }

  moveLayerUp(id: string): boolean {
    const layer = this.project.layers.find(l => l.id === id);
    if (!layer) return false;
    return this.reorderLayer(id, layer.zIndex + 1);
  }

  moveLayerDown(id: string): boolean {
    const layer = this.project.layers.find(l => l.id === id);
    if (!layer) return false;
    return this.reorderLayer(id, layer.zIndex - 1);
  }

  moveLayerToTop(id: string): boolean {
    return this.reorderLayer(id, this.project.layers.length - 1);
  }

  moveLayerToBottom(id: string): boolean {
    return this.reorderLayer(id, 0);
  }

  selectLayer(id: string, mode: SelectionMode = 'single'): void {
    const layer = this.project.layers.find(l => l.id === id);
    if (!layer || layer.locked) return;

    switch (mode) {
      case 'single':
        this.selectedLayerIds.clear();
        this.selectedLayerIds.add(id);
        break;
      case 'additive':
        this.selectedLayerIds.add(id);
        break;
      case 'toggle':
        if (this.selectedLayerIds.has(id)) {
          this.selectedLayerIds.delete(id);
        } else {
          this.selectedLayerIds.add(id);
        }
        break;
    }
    this.notify();
  }

  selectLayers(ids: string[]): void {
    this.selectedLayerIds.clear();
    ids.forEach(id => {
      const layer = this.project.layers.find(l => l.id === id);
      if (layer && !layer.locked) {
        this.selectedLayerIds.add(id);
      }
    });
    this.notify();
  }

  toggleLayerSelection(id: string): void {
    this.selectLayer(id, 'toggle');
  }

  selectAll(): void {
    this.project.layers.forEach(layer => {
      if (!layer.locked && layer.visible) {
        this.selectedLayerIds.add(layer.id);
      }
    });
    this.notify();
  }

  clearSelection(): void {
    if (this.selectedLayerIds.size === 0) return;
    this.selectedLayerIds.clear();
    this.notify();
  }

  invertSelection(): void {
    const newSelection = new Set<string>();
    this.project.layers.forEach(layer => {
      if (!layer.locked && layer.visible && !this.selectedLayerIds.has(layer.id)) {
        newSelection.add(layer.id);
      }
    });
    this.selectedLayerIds = newSelection;
    this.notify();
  }

  mergeSelectedLayers(): Layer | null {
    const selected = this.getSelectedLayers().sort((a, b) => a.zIndex - b.zIndex);
    if (selected.length < 2) return null;

    const combinedPathString = selected.map(l => l.path.pathString).join(' ');
    const allBounds = selected.map(l => this.getTransformedBounds(l));
    const minX = Math.min(...allBounds.map(b => b.minX));
    const minY = Math.min(...allBounds.map(b => b.minY));
    const maxX = Math.max(...allBounds.map(b => b.maxX));
    const maxY = Math.max(...allBounds.map(b => b.maxY));

    const mergedBounds: PathBounds = {
      minX, minY, maxX, maxY,
      width: maxX - minX,
      height: maxY - minY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2
    };

    const newPath: Omit<Path, 'id'> = {
      points: selected.flatMap(l => l.path.points),
      pathString: combinedPathString,
      color: selected[0].path.color,
      strokeWidth: selected[0].path.strokeWidth,
      bounds: mergedBounds
    };

    const mergedLayer = this.addLayer(newPath, `组合路径 (${selected.length})`);
    selected.forEach(l => {
      const idx = this.project.layers.findIndex(pl => pl.id === l.id);
      if (idx !== -1) this.project.layers.splice(idx, 1);
    });
    this.reorderZIndex();
    this.selectedLayerIds.clear();
    this.selectedLayerIds.add(mergedLayer.id);
    this.pushHistory();
    this.notify();
    return mergedLayer;
  }

  clearAll(): void {
    this.project.layers = [];
    this.selectedLayerIds.clear();
    this.pushHistory();
    this.notify();
  }

  getLayerCount(): number {
    return this.project.layers.length;
  }

  private reorderZIndex(): void {
    this.project.layers.forEach((layer, index) => {
      layer.zIndex = index;
    });
  }

  getTransformedBounds(layer: Layer): PathBounds {
    const { bounds } = layer.path;
    const { tx, ty, scaleX, scaleY, rotation } = layer.transform;
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.abs(Math.cos(rad));
    const sin = Math.abs(Math.sin(rad));
    const scaledW = bounds.width * scaleX;
    const scaledH = bounds.height * scaleY;
    const rotatedW = scaledW * cos + scaledH * sin;
    const rotatedH = scaledW * sin + scaledH * cos;
    const centerX = bounds.centerX + tx;
    const centerY = bounds.centerY + ty;
    return {
      minX: centerX - rotatedW / 2,
      minY: centerY - rotatedH / 2,
      maxX: centerX + rotatedW / 2,
      maxY: centerY + rotatedH / 2,
      width: rotatedW,
      height: rotatedH,
      centerX,
      centerY
    };
  }

  getCombinedSelectionBounds(): PathBounds | null {
    const selected = this.getSelectedLayers();
    if (selected.length === 0) return null;

    const allBounds = selected.map(l => this.getTransformedBounds(l));
    const minX = Math.min(...allBounds.map(b => b.minX));
    const minY = Math.min(...allBounds.map(b => b.minY));
    const maxX = Math.max(...allBounds.map(b => b.maxX));
    const maxY = Math.max(...allBounds.map(b => b.maxY));

    return {
      minX, minY, maxX, maxY,
      width: maxX - minX,
      height: maxY - minY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2
    };
  }
}
