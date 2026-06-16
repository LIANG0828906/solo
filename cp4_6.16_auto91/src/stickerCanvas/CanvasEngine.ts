import { v4 as uuidv4 } from 'uuid';

export interface PathPoint {
  x: number;
  y: number;
}

export interface DrawingOperation {
  id: string;
  type: 'path' | 'rect' | 'ellipse' | 'text';
  points?: PathPoint[];
  strokeWidth?: number;
  strokeColor?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  borderRadius?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
}

export class CanvasEngine {
  private operations: DrawingOperation[] = [];
  private undoStack: DrawingOperation[][] = [];
  private redoStack: DrawingOperation[][] = [];
  private maxHistory = 50;
  public onChange?: () => void;

  getOperations(): DrawingOperation[] {
    return this.operations;
  }

  getOperationById(id: string): DrawingOperation | undefined {
    return this.operations.find(op => op.id === id);
  }

  private saveSnapshot(): void {
    this.undoStack.push(JSON.parse(JSON.stringify(this.operations)));
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  addOperation(op: Omit<DrawingOperation, 'id'>): DrawingOperation {
    this.saveSnapshot();
    const newOp = { ...op, id: uuidv4() } as DrawingOperation;
    this.operations.push(newOp);
    this.onChange?.();
    return newOp;
  }

  updateOperation(id: string, updates: Partial<DrawingOperation>): void {
    this.saveSnapshot();
    const idx = this.operations.findIndex(op => op.id === id);
    if (idx !== -1) {
      this.operations[idx] = { ...this.operations[idx], ...updates };
      this.onChange?.();
    }
  }

  removeOperation(id: string): void {
    this.saveSnapshot();
    this.operations = this.operations.filter(op => op.id !== id);
    this.onChange?.();
  }

  undo(): boolean {
    if (this.undoStack.length === 0) return false;
    this.redoStack.push(JSON.parse(JSON.stringify(this.operations)));
    this.operations = this.undoStack.pop()!;
    this.onChange?.();
    return true;
  }

  redo(): boolean {
    if (this.redoStack.length === 0) return false;
    this.undoStack.push(JSON.parse(JSON.stringify(this.operations)));
    this.operations = this.redoStack.pop()!;
    this.onChange?.();
    return true;
  }

  clear(): void {
    if (this.operations.length === 0) return;
    this.saveSnapshot();
    this.operations = [];
    this.onChange?.();
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  commitDrag(id: string, originalX: number, originalY: number): void {
    const snapshot = JSON.parse(JSON.stringify(this.operations));
    const op = snapshot.find((o: DrawingOperation) => o.id === id);
    if (op) {
      op.x = originalX;
      op.y = originalY;
    }
    this.undoStack.push(snapshot);
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    this.redoStack = [];
    this.onChange?.();
  }
}
