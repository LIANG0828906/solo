export class UndoManager {
  private history: (string | null)[][][];
  private redoStack: (string | null)[][][];
  private maxHistory: number;
  private onStateChange?: (pixels: (string | null)[][]) => void;

  constructor(maxHistory = 100) {
    this.history = [];
    this.redoStack = [];
    this.maxHistory = maxHistory;
  }

  setOnStateChange(callback: (pixels: (string | null)[][]) => void) {
    this.onStateChange = callback;
  }

  private clone(pixels: (string | null)[][]): (string | null)[][] {
    return pixels.map((row) => [...row]);
  }

  push(pixels: (string | null)[][]) {
    const snapshot = this.clone(pixels);
    this.history.push(snapshot);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    this.redoStack = [];
  }

  undo(currentPixels: (string | null)[][]): (string | null)[][] | null {
    if (this.history.length === 0) return null;
    this.redoStack.push(this.clone(currentPixels));
    const previous = this.history.pop()!;
    if (this.onStateChange) {
      this.onStateChange(previous);
    }
    return previous;
  }

  redo(currentPixels: (string | null)[][]): (string | null)[][] | null {
    if (this.redoStack.length === 0) return null;
    this.history.push(this.clone(currentPixels));
    const next = this.redoStack.pop()!;
    if (this.onStateChange) {
      this.onStateChange(next);
    }
    return next;
  }

  canUndo(): boolean {
    return this.history.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear() {
    this.history = [];
    this.redoStack = [];
  }

  getHistoryLength(): number {
    return this.history.length;
  }
}

export const undoManager = new UndoManager(100);
