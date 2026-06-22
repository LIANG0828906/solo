export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  id: string;
  color: string;
  width: number;
  points: Point[];
  z_index: number;
}

export interface Sticky {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: string;
  z_index: number;
}

export interface MindNode {
  id: string;
  parent_id: string | null;
  x: number;
  y: number;
  radius: number;
  text: string;
  color: string;
  z_index: number;
}

export interface Connection {
  from: string;
  to: string;
}

export type ToolType = 'pen' | 'sticky' | 'node' | 'eraser' | 'select';

export class DrawEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private strokes: Stroke[] = [];
  private stickies: Sticky[] = [];
  private nodes: MindNode[] = [];
  private currentStroke: Stroke | null = null;
  private isDrawing = false;
  private tool: ToolType = 'pen';
  private penColor = '#FFFFFF';
  private penWidth = 3;
  private gridSize = 20;
  private backgroundColor = '#2D3748';

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2D context');
    this.ctx = ctx;
    this.setupCanvas();
  }

  private setupCanvas(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
  }

  resize(): void {
    this.setupCanvas();
    this.render();
  }

  setTool(tool: ToolType): void {
    this.tool = tool;
    this.canvas.style.cursor = this.getCursorForTool(tool);
  }

  private getCursorForTool(tool: ToolType): string {
    switch (tool) {
      case 'pen':
        return 'crosshair';
      case 'eraser':
        return 'cell';
      case 'sticky':
        return 'copy';
      case 'node':
        return 'pointer';
      case 'select':
        return 'grab';
      default:
        return 'default';
    }
  }

  setPenColor(color: string): void {
    this.penColor = color;
  }

  setPenWidth(width: number): void {
    this.penWidth = width;
  }

  setStrokes(strokes: Stroke[]): void {
    this.strokes = [...strokes];
    this.render();
  }

  setStickies(stickies: Sticky[]): void {
    this.stickies = [...stickies];
    this.render();
  }

  setNodes(nodes: MindNode[]): void {
    this.nodes = [...nodes];
    this.render();
  }

  addStroke(stroke: Stroke): void {
    this.strokes.push(stroke);
    this.render();
  }

  removeStroke(id: string): void {
    this.strokes = this.strokes.filter(s => s.id !== id);
    this.render();
  }

  addSticky(sticky: Sticky): void {
    this.stickies.push(sticky);
    this.render();
  }

  updateSticky(id: string, updates: Partial<Sticky>): void {
    const index = this.stickies.findIndex(s => s.id === id);
    if (index >= 0) {
      this.stickies[index] = { ...this.stickies[index], ...updates };
      this.render();
    }
  }

  removeSticky(id: string): void {
    this.stickies = this.stickies.filter(s => s.id !== id);
    this.render();
  }

  addNode(node: MindNode): void {
    this.nodes.push(node);
    this.render();
  }

  updateNode(id: string, updates: Partial<MindNode>): void {
    const index = this.nodes.findIndex(n => n.id === id);
    if (index >= 0) {
      this.nodes[index] = { ...this.nodes[index], ...updates };
      this.render();
    }
  }

  removeNode(id: string): void {
    this.nodes = this.nodes.filter(n => n.id !== id);
    this.render();
  }

  startDrawing(x: number, y: number, strokeId?: string): Stroke | null {
    if (this.tool !== 'pen') return null;
    
    this.isDrawing = true;
    this.currentStroke = {
      id: strokeId || `stroke_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      color: this.penColor,
      width: this.penWidth,
      points: [{ x, y }],
      z_index: this.strokes.length + this.stickies.length + this.nodes.length + 1,
    };
    return this.currentStroke;
  }

  continueDrawing(x: number, y: number): void {
    if (!this.isDrawing || !this.currentStroke) return;
    
    const lastPoint = this.currentStroke.points[this.currentStroke.points.length - 1];
    const dist = Math.sqrt(Math.pow(x - lastPoint.x, 2) + Math.pow(y - lastPoint.y, 2));
    
    if (dist > 2) {
      this.currentStroke.points.push({ x, y });
      this.render();
    }
  }

  endDrawing(): Stroke | null {
    if (!this.isDrawing || !this.currentStroke) return null;
    
    const finishedStroke = this.currentStroke;
    if (finishedStroke.points.length > 1) {
      this.strokes.push(finishedStroke);
    }
    this.currentStroke = null;
    this.isDrawing = false;
    this.render();
    return finishedStroke.points.length > 1 ? finishedStroke : null;
  }

  hitTestSticky(x: number, y: number): Sticky | null {
    const sortedStickies = [...this.stickies].sort((a, b) => b.z_index - a.z_index);
    for (const sticky of sortedStickies) {
      if (x >= sticky.x && x <= sticky.x + sticky.width &&
          y >= sticky.y && y <= sticky.y + sticky.height) {
        return sticky;
      }
    }
    return null;
  }

  hitTestNode(x: number, y: number): MindNode | null {
    const sortedNodes = [...this.nodes].sort((a, b) => b.z_index - a.z_index);
    for (const node of sortedNodes) {
      const dist = Math.sqrt(Math.pow(x - node.x, 2) + Math.pow(y - node.y, 2));
      if (dist <= node.radius) {
        return node;
      }
    }
    return null;
  }

  hitTestStroke(x: number, y: number, threshold: number = 10): Stroke | null {
    for (const stroke of this.strokes) {
      for (const point of stroke.points) {
        const dist = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2));
        if (dist <= threshold + stroke.width / 2) {
          return stroke;
        }
      }
    }
    return null;
  }

  eraseAt(x: number, y: number): string[] {
    const erasedIds: string[] = [];
    const threshold = 20;
    
    const strokesToErase: string[] = [];
    for (const stroke of this.strokes) {
      for (const point of stroke.points) {
        const dist = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2));
        if (dist <= threshold + stroke.width / 2) {
          strokesToErase.push(stroke.id);
          break;
        }
      }
    }
    
    for (const id of strokesToErase) {
      this.strokes = this.strokes.filter(s => s.id !== id);
      erasedIds.push(id);
    }
    
    const stickiesToErase: string[] = [];
    for (const sticky of this.stickies) {
      if (x >= sticky.x - threshold && x <= sticky.x + sticky.width + threshold &&
          y >= sticky.y - threshold && y <= sticky.y + sticky.height + threshold) {
        stickiesToErase.push(sticky.id);
      }
    }
    
    for (const id of stickiesToErase) {
      this.stickies = this.stickies.filter(s => s.id !== id);
      erasedIds.push(id);
    }
    
    const nodesToErase: string[] = [];
    for (const node of this.nodes) {
      const dist = Math.sqrt(Math.pow(x - node.x, 2) + Math.pow(y - node.y, 2));
      if (dist <= node.radius + threshold) {
        nodesToErase.push(node.id);
      }
    }
    
    for (const id of nodesToErase) {
      this.nodes = this.nodes.filter(n => n.id !== id);
      erasedIds.push(id);
    }
    
    if (erasedIds.length > 0) {
      this.render();
    }
    
    return erasedIds;
  }

  render(): void {
    const { width, height } = this.canvas.getBoundingClientRect();
    
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0, 0, width, height);
    
    this.drawGrid(width, height);
    
    const allItems = [
      ...this.strokes.map(s => ({ type: 'stroke' as const, item: s, z: s.z_index })),
      ...this.stickies.map(s => ({ type: 'sticky' as const, item: s, z: s.z_index })),
      ...this.nodes.map(n => ({ type: 'node' as const, item: n, z: n.z_index })),
    ].sort((a, b) => a.z - b.z);
    
    this.drawConnections();
    
    for (const { type, item } of allItems) {
      if (type === 'stroke') {
        this.drawStroke(item as Stroke);
      } else if (type === 'sticky') {
        this.drawSticky(item as Sticky);
      }
    }
    
    for (const node of this.nodes) {
      this.drawNode(node);
    }
    
    if (this.currentStroke && this.currentStroke.points.length > 1) {
      this.drawStroke(this.currentStroke);
    }
  }

  private drawGrid(width: number, height: number): void {
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    this.ctx.lineWidth = 1;
    
    for (let x = 0; x <= width; x += this.gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
      this.ctx.stroke();
    }
    
    for (let y = 0; y <= height; y += this.gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
      this.ctx.stroke();
    }
  }

  private drawStroke(stroke: Stroke): void {
    if (stroke.points.length < 2) return;
    
    this.ctx.strokeStyle = stroke.color;
    this.ctx.lineWidth = stroke.width;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    this.ctx.beginPath();
    this.ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    
    if (stroke.points.length === 2) {
      this.ctx.lineTo(stroke.points[1].x, stroke.points[1].y);
    } else {
      for (let i = 1; i < stroke.points.length - 1; i++) {
        const xc = (stroke.points[i].x + stroke.points[i + 1].x) / 2;
        const yc = (stroke.points[i].y + stroke.points[i + 1].y) / 2;
        this.ctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, xc, yc);
      }
      if (stroke.points.length >= 2) {
        const last = stroke.points[stroke.points.length - 1];
        const prev = stroke.points[stroke.points.length - 2];
        this.ctx.quadraticCurveTo(prev.x, prev.y, last.x, last.y);
      }
    }
    
    this.ctx.stroke();
  }

  private drawSticky(sticky: Sticky): void {
    this.ctx.save();
    
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    this.ctx.shadowBlur = 10;
    this.ctx.shadowOffsetX = 2;
    this.ctx.shadowOffsetY = 4;
    
    this.ctx.fillStyle = sticky.color;
    this.ctx.fillRect(sticky.x, sticky.y, sticky.width, sticky.height);
    
    this.ctx.shadowColor = 'transparent';
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(sticky.x, sticky.y, sticky.width, sticky.height);
    
    if (sticky.text) {
      this.ctx.fillStyle = '#333333';
      this.ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      this.ctx.textBaseline = 'top';
      
      const padding = 10;
      const maxWidth = sticky.width - padding * 2;
      const lines = this.wrapText(sticky.text, maxWidth, 14);
      
      let y = sticky.y + padding;
      for (const line of lines.slice(0, 6)) {
        this.ctx.fillText(line, sticky.x + padding, y);
        y += 18;
      }
    }
    
    this.ctx.restore();
  }

  private wrapText(text: string, maxWidth: number, fontSize: number): string[] {
    const words = text.split(/(\s+)/);
    const lines: string[] = [];
    let currentLine = '';
    
    this.ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    
    for (const word of words) {
      const testLine = currentLine + word;
      const metrics = this.ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine.trim());
        currentLine = word.trim();
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine.trim()) {
      lines.push(currentLine.trim());
    }
    
    return lines;
  }

  private drawConnections(): void {
    const nodeMap = new Map(this.nodes.map(n => [n.id, n]));
    
    this.ctx.strokeStyle = 'rgba(100, 150, 200, 0.6)';
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    
    for (const node of this.nodes) {
      if (node.parent_id && nodeMap.has(node.parent_id)) {
        const parent = nodeMap.get(node.parent_id)!;
        this.drawCurveConnection(parent, node);
      }
    }
  }

  private drawCurveConnection(parent: MindNode, child: MindNode): void {
    const dx = child.x - parent.x;
    const dy = child.y - parent.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    const startX = parent.x + (dx / dist) * parent.radius;
    const startY = parent.y + (dy / dist) * parent.radius;
    const endX = child.x - (dx / dist) * child.radius;
    const endY = child.y - (dy / dist) * child.radius;
    
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    
    const perpX = -dy / dist * dist * 0.2;
    const perpY = dx / dist * dist * 0.2;
    
    const cp1x = startX + (endX - startX) * 0.3 + perpX * 0.5;
    const cp1y = startY + (endY - startY) * 0.3 + perpY * 0.5;
    const cp2x = startX + (endX - startX) * 0.7 + perpX * 0.5;
    const cp2y = startY + (endY - startY) * 0.7 + perpY * 0.5;
    
    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
    this.ctx.stroke();
  }

  private drawNode(node: MindNode): void {
    this.ctx.save();
    
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    this.ctx.shadowBlur = 8;
    this.ctx.shadowOffsetX = 2;
    this.ctx.shadowOffsetY = 3;
    
    this.ctx.fillStyle = node.color;
    this.ctx.beginPath();
    this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.shadowColor = 'transparent';
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    
    if (node.text) {
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      
      const maxWidth = node.radius * 1.6;
      let displayText = node.text;
      if (this.ctx.measureText(displayText).width > maxWidth) {
        while (displayText.length > 1 && this.ctx.measureText(displayText + '...').width > maxWidth) {
          displayText = displayText.slice(0, -1);
        }
        displayText += '...';
      }
      
      this.ctx.fillText(displayText, node.x, node.y);
    }
    
    this.ctx.restore();
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  getStrokes(): Stroke[] {
    return [...this.strokes];
  }

  getStickies(): Sticky[] {
    return [...this.stickies];
  }

  getNodes(): MindNode[] {
    return [...this.nodes];
  }

  generateThumbnail(width: number = 320, height: number = 200): string {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return '';
    
    const canvasRect = this.canvas.getBoundingClientRect();
    const scale = Math.min(width / canvasRect.width, height / canvasRect.height);
    
    tempCtx.fillStyle = this.backgroundColor;
    tempCtx.fillRect(0, 0, width, height);
    
    tempCtx.save();
    tempCtx.scale(scale, scale);
    
    const allItems = [
      ...this.strokes.map(s => ({ type: 'stroke' as const, item: s, z: s.z_index })),
      ...this.stickies.map(s => ({ type: 'sticky' as const, item: s, z: s.z_index })),
      ...this.nodes.map(n => ({ type: 'node' as const, item: n, z: n.z_index })),
    ].sort((a, b) => a.z - b.z);
    
    const savedCtx = this.ctx;
    (this as any).ctx = tempCtx;
    
    for (const { type, item } of allItems) {
      if (type === 'stroke') {
        this.drawStroke(item as Stroke);
      } else if (type === 'sticky') {
        this.drawSticky(item as Sticky);
      }
    }
    
    this.drawConnections();
    
    for (const node of this.nodes) {
      this.drawNode(node);
    }
    
    (this as any).ctx = savedCtx;
    tempCtx.restore();
    
    return tempCanvas.toDataURL('image/png');
  }

  clear(): void {
    this.strokes = [];
    this.stickies = [];
    this.nodes = [];
    this.render();
  }
}
