export interface ViewportState {
  offsetX: number;
  offsetY: number;
  scale: number;
}

export class MapInteraction {
  offsetX = 0;
  offsetY = 0;
  scale = 1.0;
  minScale = 0.5;
  maxScale = 2.5;

  private isDragging = false;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private mapWidth = 0;
  private mapHeight = 0;
  private contentWidth = 0;
  private contentHeight = 0;

  constructor(mapWidth: number, mapHeight: number, contentWidth: number, contentHeight: number) {
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;
    this.contentWidth = contentWidth;
    this.contentHeight = contentHeight;
    this.offsetX = 50;
    this.offsetY = 50;
  }

  onMouseDown(e: React.MouseEvent) {
    this.isDragging = true;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
  }

  onMouseMove(e: React.MouseEvent): ViewportState | null {
    if (!this.isDragging) return null;
    const dx = e.clientX - this.lastMouseX;
    const dy = e.clientY - this.lastMouseY;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
    this.offsetX += dx;
    this.offsetY += dy;
    this._clampOffset();
    return this.getState();
  }

  onMouseUp() {
    this.isDragging = false;
  }

  onWheel(e: React.WheelEvent, mouseX: number, mouseY: number): ViewportState {
    const oldScale = this.scale;
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    this.scale = Math.max(this.minScale, Math.min(this.maxScale, this.scale + delta));

    const worldX = (mouseX - this.offsetX) / oldScale;
    const worldY = (mouseY - this.offsetY) / oldScale;
    this.offsetX = mouseX - worldX * this.scale;
    this.offsetY = mouseY - worldY * this.scale;
    this._clampOffset();
    return this.getState();
  }

  private _clampOffset() {
    const maxX = 0;
    const maxY = 0;
    const minX = this.mapWidth - this.contentWidth * this.scale;
    const minY = this.mapHeight - this.contentHeight * this.scale;
    this.offsetX = Math.max(minX, Math.min(maxX, this.offsetX));
    this.offsetY = Math.max(minY, Math.min(maxY, this.offsetY));
  }

  getState(): ViewportState {
    return {
      offsetX: this.offsetX,
      offsetY: this.offsetY,
      scale: this.scale,
    };
  }

  updateMapSize(w: number, h: number) {
    this.mapWidth = w;
    this.mapHeight = h;
  }
}
