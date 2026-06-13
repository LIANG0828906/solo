export class HeightMapEditor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private isDrawing: boolean = false;
  private brushSize: number = 20;
  private brushStrength: number = 0.5;
  private isRaise: boolean = true;
  private onModify: ((x: number, y: number, size: number, strength: number, isRaise: boolean) => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context');
    this.ctx = ctx;
    this.width = canvas.width;
    this.height = canvas.height;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private getCanvasCoordinates(event: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.width / rect.width;
    const scaleY = this.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  }

  private handleMouseDown(event: MouseEvent): void {
    this.isDrawing = true;
    this.isRaise = event.button === 0;
    const coords = this.getCanvasCoordinates(event);
    this.drawBrush(coords.x, coords.y);
    this.notifyModify(coords.x, coords.y);
  }

  private handleMouseMove(event: MouseEvent): void {
    if (!this.isDrawing) {
      this.drawBrushPreview(event);
      return;
    }
    const coords = this.getCanvasCoordinates(event);
    this.drawBrush(coords.x, coords.y);
    this.notifyModify(coords.x, coords.y);
  }

  private handleMouseUp(): void {
    this.isDrawing = false;
    this.clearBrushPreview();
  }

  private drawBrush(x: number, y: number): void {
    this.ctx.beginPath();
    this.ctx.arc(x, y, this.brushSize, 0, Math.PI * 2);
    this.ctx.fillStyle = this.isRaise ? 'rgba(0, 255, 128, 0.3)' : 'rgba(255, 80, 80, 0.3)';
    this.ctx.fill();
    this.ctx.strokeStyle = this.isRaise ? 'rgba(0, 255, 128, 0.8)' : 'rgba(255, 80, 80, 0.8)';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }

  private drawBrushPreview(event: MouseEvent): void {
    this.clearBrushPreview();
    const coords = this.getCanvasCoordinates(event);
    this.ctx.beginPath();
    this.ctx.arc(coords.x, coords.y, this.brushSize, 0, Math.PI * 2);
    this.ctx.strokeStyle = 'rgba(100, 200, 255, 0.5)';
    this.ctx.setLineDash([5, 5]);
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  private clearBrushPreview(): void {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  private notifyModify(x: number, y: number): void {
    if (this.onModify) {
      this.onModify(x, y, this.brushSize, this.brushStrength, this.isRaise);
    }
  }

  setBrushSize(size: number): void {
    this.brushSize = size;
  }

  setBrushStrength(strength: number): void {
    this.brushStrength = strength;
  }

  setOnModifyCallback(callback: (x: number, y: number, size: number, strength: number, isRaise: boolean) => void): void {
    this.onModify = callback;
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }
}
