export type EditMode = 'raise' | 'lower' | 'smooth';

export interface EditOperation {
  id: number;
  type: EditMode;
  centerX: number;
  centerZ: number;
  radius: number;
  strength: number;
  affectedVertices: number[];
  previousHeights: Map<number, number>;
  timestamp: number;
}

export interface EditResult {
  heights: Float32Array;
  operation: EditOperation;
}

export interface TerrainEditorOptions {
  size: number;
  editRadius: number;
  editStrength: number;
  maxHistorySize: number;
}

export type HistoryChangeCallback = (currentIndex: number, totalOperations: number) => void;

class TerrainEditor {
  private size: number;
  private heights: Float32Array;
  private editRadius: number;
  private editStrength: number;
  private history: EditOperation[] = [];
  private currentHistoryIndex: number = -1;
  private maxHistorySize: number;
  private operationIdCounter: number = 0;
  private worker: Worker;
  private pendingEdit: Promise<EditResult> | null = null;
  private historyChangeCallbacks: HistoryChangeCallback[] = [];

  constructor(options: TerrainEditorOptions) {
    this.size = options.size;
    this.heights = new Float32Array(this.size * this.size);
    this.editRadius = options.editRadius;
    this.editStrength = options.editStrength;
    this.maxHistorySize = options.maxHistorySize;
    this.worker = new Worker(new URL('./terrain.worker.ts', import.meta.url), {
      type: 'module',
    });
  }

  getHeights(): Float32Array {
    return this.heights;
  }

  getSize(): number {
    return this.size;
  }

  getHistoryLength(): number {
    return this.history.length;
  }

  getCurrentHistoryIndex(): number {
    return this.currentHistoryIndex;
  }

  getOperations(): EditOperation[] {
    return this.history;
  }

  onHistoryChange(callback: HistoryChangeCallback): () => void {
    this.historyChangeCallbacks.push(callback);
    return () => {
      const index = this.historyChangeCallbacks.indexOf(callback);
      if (index !== -1) {
        this.historyChangeCallbacks.splice(index, 1);
      }
    };
  }

  private notifyHistoryChange(): void {
    for (const callback of this.historyChangeCallbacks) {
      callback(this.currentHistoryIndex, this.history.length);
    }
  }

  async edit(
    type: EditMode,
    gridX: number,
    gridZ: number
  ): Promise<EditResult> {
    if (this.pendingEdit) {
      return this.pendingEdit;
    }

    this.pendingEdit = new Promise<EditResult>((resolve, reject) => {
      const startTime = performance.now();

      const handleMessage = (e: MessageEvent) => {
        const { heights, affectedVertices, previousHeights } = e.data;

        if (affectedVertices.length > 60) {
          console.warn(`编辑顶点数超过限制: ${affectedVertices.length}`);
        }

        const responseTime = performance.now() - startTime;
        if (responseTime > 50) {
          console.warn(`编辑响应时间超过50ms: ${responseTime.toFixed(2)}ms`);
        }

        const operation: EditOperation = {
          id: this.operationIdCounter++,
          type,
          centerX: gridX,
          centerZ: gridZ,
          radius: this.editRadius,
          strength: this.editStrength,
          affectedVertices,
          previousHeights: new Map(previousHeights),
          timestamp: Date.now(),
        };

        if (this.currentHistoryIndex < this.history.length - 1) {
          this.history = this.history.slice(0, this.currentHistoryIndex + 1);
        }

        this.history.push(operation);

        if (this.history.length > this.maxHistorySize) {
          this.history.shift();
        } else {
          this.currentHistoryIndex++;
        }

        this.heights = heights;
        this.pendingEdit = null;
        this.worker.removeEventListener('message', handleMessage);
        this.worker.removeEventListener('error', handleError);

        this.notifyHistoryChange();
        resolve({ heights, operation });
      };

      const handleError = (error: ErrorEvent) => {
        this.pendingEdit = null;
        this.worker.removeEventListener('message', handleMessage);
        this.worker.removeEventListener('error', handleError);
        reject(error);
      };

      this.worker.addEventListener('message', handleMessage);
      this.worker.addEventListener('error', handleError);

      this.worker.postMessage({
        type,
        heights: this.heights,
        centerX: gridX,
        centerZ: gridZ,
        radius: this.editRadius,
        strength: this.editStrength,
        size: this.size,
      });
    });

    return this.pendingEdit;
  }

  jumpToHistory(index: number): Float32Array {
    if (index < -1 || index >= this.history.length) {
      throw new Error(`历史索引越界: ${index}`);
    }

    this.heights = new Float32Array(this.size * this.size);

    for (let i = 0; i <= index; i++) {
      const op = this.history[i];
      for (const [vertexIndex, _prevHeight] of op.previousHeights) {
        let height = this.heights[vertexIndex];
        for (let j = 0; j <= i; j++) {
          const jOp = this.history[j];
          const prevHeight = jOp.previousHeights.get(vertexIndex);
          if (prevHeight !== undefined) {
            if (jOp.type === 'smooth') {
              const neighbors = this.getNeighborHeights(vertexIndex, jOp, j);
              height = neighbors.reduce((a, b) => a + b, 0) / neighbors.length;
            } else {
              const dx = (vertexIndex % this.size) - jOp.centerX;
              const dz = Math.floor(vertexIndex / this.size) - jOp.centerZ;
              const dist = Math.sqrt(dx * dx + dz * dz);
              if (dist <= jOp.radius) {
                const falloff = 1 - dist / jOp.radius;
                const strength = jOp.type === 'lower' ? -jOp.strength : jOp.strength;
                height = prevHeight + strength * falloff;
              }
            }
          }
        }
        this.heights[vertexIndex] = height;
      }
    }

    this.currentHistoryIndex = index;
    this.notifyHistoryChange();
    return this.heights;
  }

  private getNeighborHeights(vertexIndex: number, _op: EditOperation, upTo: number): number[] {
    const x = vertexIndex % this.size;
    const z = Math.floor(vertexIndex / this.size);
    const neighbors: number[] = [];

    for (let nz = Math.max(0, z - 1); nz <= Math.min(this.size - 1, z + 1); nz++) {
      for (let nx = Math.max(0, x - 1); nx <= Math.min(this.size - 1, x + 1); nx++) {
        if (nx === x && nz === z) continue;
        const idx = nz * this.size + nx;

        let height = 0;
        for (let j = 0; j <= upTo; j++) {
          const jOp = this.history[j];
          const prevHeight = jOp.previousHeights.get(idx);
          if (prevHeight !== undefined) {
            if (jOp.type === 'smooth') {
              continue;
            } else {
              const dx = nx - jOp.centerX;
              const dz = nz - jOp.centerZ;
              const dist = Math.sqrt(dx * dx + dz * dz);
              if (dist <= jOp.radius) {
                const falloff = 1 - dist / jOp.radius;
                const strength = jOp.type === 'lower' ? -jOp.strength : jOp.strength;
                height = prevHeight + strength * falloff;
              }
            }
          }
        }
        neighbors.push(height);
      }
    }

    return neighbors;
  }

  getOperation(index: number): EditOperation | null {
    if (index < 0 || index >= this.history.length) {
      return null;
    }
    return this.history[index];
  }

  dispose(): void {
    this.worker.terminate();
    this.historyChangeCallbacks = [];
  }
}

export default TerrainEditor;
