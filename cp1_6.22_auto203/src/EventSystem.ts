import { clamp } from './utils';

export type SwapCallback = (r1: number, c1: number, r2: number, c2: number) => void;
export type SelectCallback = (r: number, c: number) => void;
export type DragStartCallback = (r: number, c: number, e: PointerEvent) => void;
export type DragMoveCallback = (r: number, c: number, e: PointerEvent) => void;
export type DragEndCallback = () => void;
export type TapCallback = (r: number, c: number) => void;

export interface CellCoord {
  row: number;
  col: number;
}

export interface EventSystemConfig {
  cellSize: number;
  spacing: number;
  rows: number;
  cols: number;
}

export class EventSystem {
  private _canvas: HTMLCanvasElement;
  private _config: EventSystemConfig;
  private _offsetX: number = 0;
  private _offsetY: number = 0;
  private _swapCb: SwapCallback | null = null;
  private _selectStartCb: SelectCallback | null = null;
  private _selectEndCb: (() => void) | null = null;
  private _dragStartCb: DragStartCallback | null = null;
  private _dragMoveCb: DragMoveCallback | null = null;
  private _dragEndCb: DragEndCb | null = null;
  private _tapCb: TapCallback | null = null;
  private _isPointerDown: boolean = false;
  private _startCell: CellCoord | null = null;
  private _currentCell: CellCoord | null = null;
  private _startPoint: { x: number; y: number } | null = null;
  private _swapFired: boolean = false;
  private _tapTimer: number | null = null;
  private _pointerId: number | null = null;
  private _boundHandlers: Array<{ type: string; handler: EventListener }> = [];
  private _isLocked: boolean = false;

  constructor(canvas: HTMLCanvasElement, config: EventSystemConfig) {
    this._canvas = canvas;
    this._config = { ...config };
    this._attach();
  }

  public setLocked(locked: boolean): void {
    this._isLocked = locked;
    if (locked) {
      this._cancelDrag();
    }
  }

  public setOffset(x: number, y: number): void {
    this._offsetX = x;
    this._offsetY = y;
  }

  public updateConfig(config: Partial<EventSystemConfig>): void {
    Object.assign(this._config, config);
  }

  public onSwap(cb: SwapCallback): void {
    this._swapCb = cb;
  }

  public onSelectStart(cb: SelectCallback): void {
    this._selectStartCb = cb;
  }

  public onSelectEnd(cb: () => void): void {
    this._selectEndCb = cb;
  }

  public onDragStart(cb: DragStartCallback): void {
    this._dragStartCb = cb;
  }

  public onDragMove(cb: DragMoveCallback): void {
    this._dragMoveCb = cb;
  }

  public onDragEnd(cb: DragEndCallback): void {
    this._dragEndCb = cb;
  }

  public onTap(cb: TapCallback): void {
    this._tapCb = cb;
  }

  private _attach(): void {
    const canvas = this._canvas;
    canvas.style.touchAction = 'none';
    const pd = this._onPointerDown.bind(this);
    const pm = this._onPointerMove.bind(this);
    const pu = this._onPointerUp.bind(this);
    const pc = this._onPointerCancel.bind(this);
    canvas.addEventListener('pointerdown', pd);
    canvas.addEventListener('pointermove', pm);
    canvas.addEventListener('pointerup', pu);
    canvas.addEventListener('pointercancel', pc);
    canvas.addEventListener('pointerleave', pu);
    this._boundHandlers.push(
      { type: 'pointerdown', handler: pd },
      { type: 'pointermove', handler: pm },
      { type: 'pointerup', handler: pu },
      { type: 'pointercancel', handler: pc },
      { type: 'pointerleave', handler: pu }
    );
  }

  private _getCellFromEvent(e: PointerEvent): CellCoord | null {
    const rect = this._canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    return this._pixelToCell(px, py);
  }

  private _pixelToCell(px: number, py: number): CellCoord | null {
    const { cellSize, spacing, rows, cols } = this._config;
    const total = cellSize + spacing;
    const localX = px - this._offsetX - spacing;
    const localY = py - this._offsetY - spacing;
    if (localX < 0 || localY < 0) return null;
    const col = Math.floor(localX / total);
    const row = Math.floor(localY / total);
    if (row < 0 || row >= rows || col < 0 || col >= cols) return null;
    const cellLocalX = localX - col * total;
    const cellLocalY = localY - row * total;
    if (cellLocalX > cellSize || cellLocalY > cellSize) return null;
    return { row, col };
  }

  private _onPointerDown(e: PointerEvent): void {
    if (this._isLocked) return;
    if (this._pointerId !== null) return;
    const cell = this._getCellFromEvent(e);
    if (!cell) return;
    this._isPointerDown = true;
    this._pointerId = e.pointerId;
    this._startCell = { ...cell };
    this._currentCell = { ...cell };
    this._startPoint = { x: e.clientX, y: e.clientY };
    this._swapFired = false;
    try {
      this._canvas.setPointerCapture(e.pointerId);
    } catch (err) {}
    if (this._tapTimer !== null) {
      window.clearTimeout(this._tapTimer);
      this._tapTimer = null;
    }
    this._tapTimer = window.setTimeout(() => {
      this._tapTimer = null;
    }, 200);
    if (this._selectStartCb) this._selectStartCb(cell.row, cell.col);
    if (this._dragStartCb) this._dragStartCb(cell.row, cell.col, e);
    e.preventDefault();
  }

  private _onPointerMove(e: PointerEvent): void {
    if (!this._isPointerDown || this._pointerId !== e.pointerId) return;
    if (!this._startCell || !this._startPoint) return;
    if (this._swapFired) return;
    const cell = this._getCellFromEvent(e);
    if (cell) {
      this._currentCell = { ...cell };
      if (this._dragMoveCb) this._dragMoveCb(cell.row, cell.col, e);
    }
    const dx = e.clientX - this._startPoint.x;
    const dy = e.clientY - this._startPoint.y;
    const threshold = this._config.cellSize * 0.35;
    if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) {
      return;
    }
    let targetRow = this._startCell.row;
    let targetCol = this._startCell.col;
    if (Math.abs(dx) > Math.abs(dy)) {
      targetCol += dx > 0 ? 1 : -1;
    } else {
      targetRow += dy > 0 ? 1 : -1;
    }
    if (
      targetRow === this._startCell.row &&
      targetCol === this._startCell.col
    )
      return;
    if (!this._inBounds(targetRow, targetCol)) return;
    this._fireSwap(this._startCell.row, this._startCell.col, targetRow, targetCol);
    e.preventDefault();
  }

  private _fireSwap(r1: number, c1: number, r2: number, c2: number): void {
    this._swapFired = true;
    if (this._swapCb) {
      this._swapCb(r1, c1, r2, c2);
    }
  }

  private _onPointerUp(e: PointerEvent): void {
    if (!this._isPointerDown || this._pointerId !== e.pointerId) return;
    if (!this._startCell) return;
    const endCell = this._getCellFromEvent(e);
    if (
      !this._swapFired &&
      endCell &&
      this._startCell.row === endCell.row &&
      this._startCell.col === endCell.col
    ) {
      if (this._tapCb) this._tapCb(endCell.row, endCell.col);
    } else if (!this._swapFired && endCell) {
      const isAdjacent =
        Math.abs(this._startCell.row - endCell.row) +
          Math.abs(this._startCell.col - endCell.col) ===
        1;
      if (isAdjacent) {
        this._fireSwap(
          this._startCell.row,
          this._startCell.col,
          endCell.row,
          endCell.col
        );
      }
    }
    this._cancelDrag();
    e.preventDefault();
  }

  private _onPointerCancel(e: PointerEvent): void {
    this._cancelDrag();
  }

  private _cancelDrag(): void {
    if (this._pointerId !== null) {
      try {
        this._canvas.releasePointerCapture(this._pointerId);
      } catch (err) {}
    }
    this._isPointerDown = false;
    this._pointerId = null;
    this._startCell = null;
    this._currentCell = null;
    this._startPoint = null;
    this._swapFired = false;
    if (this._tapTimer !== null) {
      window.clearTimeout(this._tapTimer);
      this._tapTimer = null;
    }
    if (this._selectEndCb) this._selectEndCb();
    if (this._dragEndCb) this._dragEndCb();
  }

  private _inBounds(r: number, c: number): boolean {
    return r >= 0 && r < this._config.rows && c >= 0 && c < this._config.cols;
  }

  public destroy(): void {
    this._cancelDrag();
    for (const { type, handler } of this._boundHandlers) {
      this._canvas.removeEventListener(type, handler);
    }
    this._boundHandlers = [];
    this._swapCb = null;
    this._selectStartCb = null;
    this._selectEndCb = null;
    this._dragStartCb = null;
    this._dragMoveCb = null;
    this._dragEndCb = null;
    this._tapCb = null;
  }
}

export default EventSystem;
