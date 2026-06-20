export interface TextItem {
  char: string;
  x: number;
  y: number;
  fontSize: number;
}

export const CHAR_LIBRARY: string[] = [
  '福', '寿', '禄', '喜', '龙', '凤',
  '梅', '兰', '竹', '菊', '雅', '静',
  '和', '乐', '安', '康', '道', '德',
  '仁', '义'
];

const PX_PER_MM: number = 7;
const CANVAS_SIZE: number = 400;

export class SealDesigner {
  private sealSize: number = 30;
  private textItems: TextItem[] = [];
  private ctx: CanvasRenderingContext2D;
  private stoneTextureCache: HTMLCanvasElement | null = null;
  private draggingIndex: number = -1;
  private dragOffsetX: number = 0;
  private dragOffsetY: number = 0;
  private isDragging: boolean = false;
  private cachedSealSize: number = -1;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
  }

  get pixelsPerMm(): number {
    return PX_PER_MM;
  }

  get sealPixelSize(): number {
    return this.sealSize * PX_PER_MM;
  }

  get sealOriginX(): number {
    return (CANVAS_SIZE - this.sealPixelSize) / 2;
  }

  get sealOriginY(): number {
    return (CANVAS_SIZE - this.sealPixelSize) / 2;
  }

  getCanvasSize(): number {
    return CANVAS_SIZE;
  }

  setSealSize(size: number): void {
    const oldSize = this.sealSize;
    this.sealSize = size;
    if (oldSize !== size) {
      this.repositionTextItems(oldSize, size);
    }
    if (this.cachedSealSize !== size) {
      this.cachedSealSize = size;
      this.stoneTextureCache = null;
      this.generateStoneTexture();
    }
  }

  getSealSize(): number {
    return this.sealSize;
  }

  addCharacter(char: string): void {
    const fontSize = this.sealPixelSize * 0.55;
    const cx = CANVAS_SIZE / 2;
    const cy = CANVAS_SIZE / 2;
    this.textItems.push({ char, x: cx, y: cy, fontSize });
  }

  removeLastCharacter(): void {
    this.textItems.pop();
  }

  clearText(): void {
    this.textItems = [];
  }

  getTextItems(): TextItem[] {
    return this.textItems.map(t => ({ ...t }));
  }

  private repositionTextItems(oldSize: number, newSize: number): void {
    if (oldSize <= 0) return;
    const ratio = newSize / oldSize;
    const cx = CANVAS_SIZE / 2;
    const cy = CANVAS_SIZE / 2;
    for (const item of this.textItems) {
      item.x = cx + (item.x - cx) * ratio;
      item.y = cy + (item.y - cy) * ratio;
      item.fontSize = this.sealPixelSize * 0.55;
    }
  }

  private generateStoneTexture(): void {
    const offscreen = document.createElement('canvas');
    offscreen.width = CANVAS_SIZE;
    offscreen.height = CANVAS_SIZE;
    const octx = offscreen.getContext('2d')!;

    octx.fillStyle = '#F5F0E1';
    octx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    const ox = this.sealOriginX;
    const oy = this.sealOriginY;
    const sz = this.sealPixelSize;

    const gradient = octx.createLinearGradient(ox, oy, ox + sz, oy + sz);
    gradient.addColorStop(0, '#D2B48C');
    gradient.addColorStop(0.5, '#CBAA7D');
    gradient.addColorStop(1, '#C4A882');
    octx.fillStyle = gradient;
    octx.fillRect(ox, oy, sz, sz);

    const imageData = octx.getImageData(
      Math.floor(ox), Math.floor(oy),
      Math.ceil(sz), Math.ceil(sz)
    );
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 18;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
    }
    octx.putImageData(imageData, Math.floor(ox), Math.floor(oy));

    octx.strokeStyle = '#A08060';
    octx.lineWidth = 1.5;
    octx.strokeRect(ox, oy, sz, sz);

    this.stoneTextureCache = offscreen;
  }

  render(): void {
    const ctx = this.ctx;
    if (!this.stoneTextureCache) {
      this.generateStoneTexture();
    }
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    if (this.stoneTextureCache) {
      ctx.drawImage(this.stoneTextureCache, 0, 0);
    }

    this.drawDiamondOrnaments();

    for (const item of this.textItems) {
      this.drawTextItem(item);
    }

    if (this.isDragging && this.draggingIndex >= 0 && this.draggingIndex < this.textItems.length) {
      this.drawDragGuide(this.textItems[this.draggingIndex]);
    }
  }

  private drawDiamondOrnaments(): void {
    const ox = this.sealOriginX;
    const oy = this.sealOriginY;
    const sz = this.sealPixelSize;
    const corners = [
      [ox, oy],
      [ox + sz, oy],
      [ox, oy + sz],
      [ox + sz, oy + sz]
    ];
    for (const [cx, cy] of corners) {
      this.drawDiamond(cx, cy, 7);
    }
  }

  private drawDiamond(cx: number, cy: number, size: number): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = '#B8860B';
    ctx.beginPath();
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx + size, cy);
    ctx.lineTo(cx, cy + size);
    ctx.lineTo(cx - size, cy);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#DAA520';
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.restore();
  }

  private drawTextItem(item: TextItem): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = `bold ${item.fontSize}px 'KaiTi', 'STKaiti', 'SimSun', serif`;
    ctx.fillStyle = '#2C1810';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.char, item.x, item.y);
    ctx.strokeStyle = 'rgba(44, 24, 16, 0.3)';
    ctx.lineWidth = 0.5;
    ctx.strokeText(item.char, item.x, item.y);
    ctx.restore();
  }

  private drawDragGuide(item: TextItem): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = 'rgba(204, 0, 0, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    const half = item.fontSize * 0.55;
    ctx.strokeRect(item.x - half, item.y - half, half * 2, half * 2);
    ctx.setLineDash([]);
    ctx.restore();
  }

  handleMouseDown(mx: number, my: number): boolean {
    for (let i = this.textItems.length - 1; i >= 0; i--) {
      const item = this.textItems[i];
      const half = item.fontSize * 0.55;
      if (mx >= item.x - half && mx <= item.x + half &&
          my >= item.y - half && my <= item.y + half) {
        this.draggingIndex = i;
        this.dragOffsetX = mx - item.x;
        this.dragOffsetY = my - item.y;
        this.isDragging = true;
        return true;
      }
    }
    return false;
  }

  handleMouseMove(mx: number, my: number): void {
    if (!this.isDragging || this.draggingIndex < 0) return;
    let newX = mx - this.dragOffsetX;
    let newY = my - this.dragOffsetY;
    newX = Math.round(newX / 3) * 3;
    newY = Math.round(newY / 3) * 3;
    const half = this.textItems[this.draggingIndex].fontSize * 0.55;
    newX = Math.max(this.sealOriginX + half, Math.min(this.sealOriginX + this.sealPixelSize - half, newX));
    newY = Math.max(this.sealOriginY + half, Math.min(this.sealOriginY + this.sealPixelSize - half, newY));
    this.textItems[this.draggingIndex].x = newX;
    this.textItems[this.draggingIndex].y = newY;
  }

  handleMouseUp(): void {
    this.isDragging = false;
    this.draggingIndex = -1;
  }

  isCurrentlyDragging(): boolean {
    return this.isDragging;
  }

  getTextImageData(): ImageData {
    const offscreen = document.createElement('canvas');
    offscreen.width = CANVAS_SIZE;
    offscreen.height = CANVAS_SIZE;
    const octx = offscreen.getContext('2d')!;

    for (const item of this.textItems) {
      octx.save();
      octx.font = `bold ${item.fontSize}px 'KaiTi', 'STKaiti', 'SimSun', serif`;
      octx.fillStyle = '#000000';
      octx.textAlign = 'center';
      octx.textBaseline = 'middle';
      octx.fillText(item.char, item.x, item.y);
      octx.restore();
    }

    return octx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  }
}
