export type EventType =
  | 'node:select'
  | 'node:add'
  | 'node:delete'
  | 'node:update'
  | 'node:move'
  | 'layout:update'
  | 'url:load'
  | 'export:json'
  | 'export:png'
  | 'history:undo'
  | 'history:redo';

export interface Node {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  imageUrl?: string;
  note?: string;
  parentId?: string;
  children: string[];
  collapsed: boolean;
  hasNote: boolean;
  isDragging: boolean;
  isEditing: boolean;
  level: number;
  subtreeSize: number;
  targetX?: number;
  targetY?: number;
  animProgress?: number;
}

export interface Connection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  isHovered: boolean;
}

export interface HistoryState {
  nodes: Node[];
  connections: Connection[];
  selectedNodeId?: string;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface EventCallback {
  (data: unknown): void;
}

interface ImageCache {
  [key: string]: HTMLImageElement;
}

export const COLOR_PALETTE = [
  '#FFFFFF',
  '#FEE2E2',
  '#FED7AA',
  '#FEF08A',
  '#BBF7D0',
  '#BFDBFE',
  '#DDD6FE',
  '#FBCFE8',
  '#E5E7EB',
  '#FECACA',
  '#A7F3D0',
  '#93C5FD',
  'transparent'
];

const HANDLE_RADIUS = 8;
const NODE_PADDING = 16;
const HORIZONTAL_SPACING = 120;
const VERTICAL_SPACING = 60;
const ANIMATION_DURATION = 300;
const MAX_HISTORY = 20;
const MAX_TEXT_LENGTH = 30;
const MAX_NOTE_LENGTH = 500;

export class EventBus {
  private listeners: Map<EventType, EventCallback[]> = new Map();

  on(event: EventType, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  emit(event: EventType, data: unknown = null): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(data));
    }
  }

  off(event: EventType, callback: EventCallback): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }
}

export class GraphEngine {
  public nodes: Node[] = [];
  public connections: Connection[] = [];
  public eventBus: EventBus;
  public selectedNodeId: string | null = null;
  public hoveredNodeId: string | null = null;
  public hoveredConnectionId: string | null = null;
  public hoveredHandleNodeId: string | null = null;

  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gridCanvas: HTMLCanvasElement;
  private gridCtx: CanvasRenderingContext2D;
  private imageCache: ImageCache = {};

  private undoStack: HistoryState[] = [];
  private redoStack: HistoryState[] = [];
  private isAnimating: boolean = false;
  private animationStartTime: number = 0;
  private animationNodes: Map<string, { fromX: number; fromY: number; toX: number; toY: number }> = new Map();

  private dirtyRects: Rect[] = [];
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private fps: number = 0;

  private isDragging: boolean = false;
  private isDraggingHandle: boolean = false;
  private dragNodeId: string | null = null;
  private isCtrlPressed: boolean = false;
  private isDrawingConnection: boolean = false;
  private connectionStartX: number = 0;
  private connectionStartY: number = 0;
  private connectionEndX: number = 0;
  private connectionEndY: number = 0;
  private connectionFromNodeId: string | null = null;

  private canvasOffsetX: number = 0;
  private canvasOffsetY: number = 0;

  private debounceTimer: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.gridCanvas = document.createElement('canvas');
    this.gridCtx = this.gridCanvas.getContext('2d')!;
    this.eventBus = new EventBus();
    this.resize();
    this.drawGrid();
    this.bindEvents();
    this.startRenderLoop();
  }

  public resize(): void {
    const container = this.canvas.parentElement;
    if (!container) return;

    const width = Math.max(800, container.clientWidth);
    const height = Math.max(600, container.clientHeight);
    const dpr = window.devicePixelRatio || 1;

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.scale(dpr, dpr);

    this.gridCanvas.width = width * dpr;
    this.gridCanvas.height = height * dpr;
    this.gridCtx.scale(dpr, dpr);

    this.drawGrid();
    this.markAllDirty();
  }

  private drawGrid(): void {
    const ctx = this.gridCtx;
    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);

    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 0.5;

    for (let x = 0; x <= width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y <= height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  private bindEvents(): void {
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.onMouseLeave.bind(this));
    this.canvas.addEventListener('click', this.onClick.bind(this));
    this.canvas.addEventListener('dblclick', this.onDblClick.bind(this));
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    document.addEventListener('keydown', this.onKeyDown.bind(this));
    document.addEventListener('keyup', this.onKeyUp.bind(this));
    window.addEventListener('resize', () => {
      this.resize();
    });
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (e.ctrlKey || e.metaKey) {
      this.isCtrlPressed = true;
    }

    if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      this.undo();
      return;
    }

    if (e.ctrlKey && e.shiftKey && e.key === 'z') {
      e.preventDefault();
      this.redo();
      return;
    }

    if ((e.key === 'Delete' || e.key === 'Backspace') && this.selectedNodeId && !this.isEditing()) {
      e.preventDefault();
      this.deleteNode(this.selectedNodeId);
      return;
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    if (!e.ctrlKey && !e.metaKey) {
      this.isCtrlPressed = false;
    }
  }

  private isEditing(): boolean {
    return this.nodes.some((n) => n.isEditing);
  }

  private getCanvasCoords(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  private onMouseDown(e: MouseEvent): void {
    const { x, y } = this.getCanvasCoords(e);

    const handleNodeId = this.getHandleAtPosition(x, y);
    if (handleNodeId) {
      this.isDraggingHandle = true;
      this.isDrawingConnection = true;
      this.connectionFromNodeId = handleNodeId;
      const node = this.getNode(handleNodeId);
      if (node) {
        this.connectionStartX = node.x + node.width;
        this.connectionStartY = node.y + node.height / 2;
        this.connectionEndX = x;
        this.connectionEndY = y;
      }
      return;
    }

    const nodeId = this.getNodeAtPosition(x, y);
    if (nodeId) {
      this.selectNode(nodeId);
      this.isDragging = true;
      this.dragNodeId = nodeId;
      this.dragStartX = x;
      this.dragStartY = y;
      const node = this.getNode(nodeId);
      if (node) {
        node.isDragging = true;
        this.canvasOffsetX = x - node.x;
        this.canvasOffsetY = y - node.y;
      }
      return;
    }

    this.selectNode(null);
  }

  private onMouseMove(e: MouseEvent): void {
    const { x, y } = this.getCanvasCoords(e);

    if (this.isDrawingConnection) {
      this.connectionEndX = x;
      this.connectionEndY = y;
      this.markAllDirty();
      return;
    }

    if (this.isDragging && this.dragNodeId && this.isCtrlPressed) {
      const node = this.getNode(this.dragNodeId);
      if (node) {
        this.saveHistoryState();
        node.x = x - this.canvasOffsetX;
        node.y = y - this.canvasOffsetY;
        node.targetX = node.x;
        node.targetY = node.y;
        this.markAllDirty();
        this.eventBus.emit('node:move', node);
      }
      return;
    }

    this.updateHoverState(x, y);
  }

  private onMouseUp(e: MouseEvent): void {
    const { x, y } = this.getCanvasCoords(e);

    if (this.isDrawingConnection && this.connectionFromNodeId) {
      this.createChildNode(this.connectionFromNodeId, x, y);
      this.isDrawingConnection = false;
      this.isDraggingHandle = false;
      this.connectionFromNodeId = null;
      this.markAllDirty();
      return;
    }

    if (this.isDragging && this.dragNodeId) {
      const node = this.getNode(this.dragNodeId);
      if (node) {
        node.isDragging = false;
        if (this.isCtrlPressed) {
          this.relayoutFromNode(this.dragNodeId);
        }
      }
      this.isDragging = false;
      this.dragNodeId = null;
    }

    this.updateHoverState(x, y);
  }

  private onMouseLeave(): void {
    this.hoveredNodeId = null;
    this.hoveredConnectionId = null;
    this.hoveredHandleNodeId = null;
    this.eventBus.emit('node:select', null);
    this.markAllDirty();
  }

  private onClick(e: MouseEvent): void {
    if (this.isDragging || this.isDraggingHandle) return;

    const { x, y } = this.getCanvasCoords(e);
    const nodeId = this.getNodeAtPosition(x, y);

    if (!nodeId) {
      if (this.nodes.length === 0) {
        this.addCenterNode(x, y);
      }
    }
  }

  private onDblClick(e: MouseEvent): void {
    const { x, y } = this.getCanvasCoords(e);
    const nodeId = this.getNodeAtPosition(x, y);

    if (nodeId) {
      this.startEditingNode(nodeId);
    }
  }

  private updateHoverState(x: number, y: number): void {
    let nodeId: string | null = this.getNodeAtPosition(x, y);
    let handleId: string | null = this.getHandleAtPosition(x, y);
    let connId: string | null = this.getConnectionAtPosition(x, y);

    let changed = false;

    if (nodeId !== this.hoveredNodeId) {
      this.hoveredNodeId = nodeId;
      changed = true;
      this.eventBus.emit('node:select', nodeId);
    }

    if (handleId !== this.hoveredHandleNodeId) {
      this.hoveredHandleNodeId = handleId;
      changed = true;
      this.canvas.style.cursor = handleId ? 'crosshair' : nodeId ? 'move' : 'default';
    }

    if (connId !== this.hoveredConnectionId) {
      this.connections.forEach((c) => {
        c.isHovered = c.id === connId;
      });
      this.hoveredConnectionId = connId;
      changed = true;
    }

    if (changed) {
      this.markAllDirty();
    }
  }

  private getNodeAtPosition(x: number, y: number): string | null {
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const node = this.nodes[i];
      if (
        x >= node.x &&
        x <= node.x + node.width &&
        y >= node.y &&
        y <= node.y + node.height
      ) {
        return node.id;
      }
    }
    return null;
  }

  private getHandleAtPosition(x: number, y: number): string | null {
    for (const node of this.nodes) {
      const handleX = node.x + node.width;
      const handleY = node.y + node.height / 2;
      const dx = x - handleX;
      const dy = y - handleY;
      if (dx * dx + dy * dy <= HANDLE_RADIUS * HANDLE_RADIUS) {
        return node.id;
      }
    }
    return null;
  }

  private getConnectionAtPosition(x: number, y: number): string | null {
    const hitThreshold = 6;

    for (const conn of this.connections) {
      const fromNode = this.getNode(conn.fromNodeId);
      const toNode = this.getNode(conn.toNodeId);
      if (!fromNode || !toNode) continue;

      const startX = fromNode.x + fromNode.width;
      const startY = fromNode.y + fromNode.height / 2;
      const endX = toNode.x;
      const endY = toNode.y + toNode.height / 2;

      const cp1x = startX + (endX - startX) * 0.5;
      const cp1y = startY;
      const cp2x = endX - (endX - startX) * 0.5;
      const cp2y = endY;

      if (this.isPointNearBezier(x, y, startX, startY, cp1x, cp1y, cp2x, cp2y, endX, endY, hitThreshold)) {
        return conn.id;
      }
    }
    return null;
  }

  private isPointNearBezier(
    px: number,
    py: number,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    threshold: number
  ): boolean {
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const mt = 1 - t;
      const x = mt * mt * mt * x0 + 3 * mt * mt * t * x1 + 3 * mt * t * t * x2 + t * t * t * x3;
      const y = mt * mt * mt * y0 + 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t * t * t * y3;
      const dx = px - x;
      const dy = py - y;
      if (dx * dx + dy * dy <= threshold * threshold) {
        return true;
      }
    }
    return false;
  }

  public getNode(id: string): Node | undefined {
    return this.nodes.find((n) => n.id === id);
  }

  private generateId(): string {
    return `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private saveHistoryState(): void {
    const state: HistoryState = {
      nodes: JSON.parse(JSON.stringify(this.nodes)),
      connections: JSON.parse(JSON.stringify(this.connections)),
      selectedNodeId: this.selectedNodeId || undefined
    };

    this.undoStack.push(state);
    if (this.undoStack.length > MAX_HISTORY) {
      this.undoStack.shift();
    }
    this.redoStack = [];
    this.updateHistoryButtons();
  }

  private updateHistoryButtons(): void {
    const undoBtn = document.querySelector('.toolbar-btn[data-action="undo"]') as HTMLButtonElement;
    const redoBtn = document.querySelector('.toolbar-btn[data-action="redo"]') as HTMLButtonElement;
    if (undoBtn) undoBtn.disabled = this.undoStack.length === 0;
    if (redoBtn) redoBtn.disabled = this.redoStack.length === 0;
  }

  public undo(): void {
    if (this.undoStack.length === 0 || this.isAnimating) return;

    const currentState: HistoryState = {
      nodes: JSON.parse(JSON.stringify(this.nodes)),
      connections: JSON.parse(JSON.stringify(this.connections)),
      selectedNodeId: this.selectedNodeId || undefined
    };
    this.redoStack.push(currentState);

    const prevState = this.undoStack.pop()!;
    this.animateToState(prevState);
    this.eventBus.emit('history:undo');
    this.updateHistoryButtons();
  }

  public redo(): void {
    if (this.redoStack.length === 0 || this.isAnimating) return;

    const currentState: HistoryState = {
      nodes: JSON.parse(JSON.stringify(this.nodes)),
      connections: JSON.parse(JSON.stringify(this.connections)),
      selectedNodeId: this.selectedNodeId || undefined
    };
    this.undoStack.push(currentState);

    const nextState = this.redoStack.pop()!;
    this.animateToState(nextState);
    this.eventBus.emit('history:redo');
    this.updateHistoryButtons();
  }

  private animateToState(targetState: HistoryState): void {
    this.animationNodes.clear();

    const targetMap = new Map<string, Node>();
    targetState.nodes.forEach((n) => targetMap.set(n.id, n));

    this.nodes.forEach((node) => {
      const targetNode = targetMap.get(node.id);
      if (targetNode) {
        this.animationNodes.set(node.id, {
          fromX: node.x,
          fromY: node.y,
          toX: targetNode.x,
          toY: targetNode.y
        });
      }
    });

    this.isAnimating = true;
    this.animationStartTime = performance.now();

    const animateStep = () => {
      const elapsed = performance.now() - this.animationStartTime;
      const progress = Math.min(1, elapsed / ANIMATION_DURATION);
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      this.animationNodes.forEach((anim, nodeId) => {
        const node = this.getNode(nodeId);
        if (node) {
          node.x = anim.fromX + (anim.toX - anim.fromX) * easeProgress;
          node.y = anim.fromY + (anim.toY - anim.fromY) * easeProgress;
        }
      });

      this.markAllDirty();

      if (progress < 1) {
        requestAnimationFrame(animateStep);
      } else {
        this.isAnimating = false;
        this.nodes = JSON.parse(JSON.stringify(targetState.nodes));
        this.connections = JSON.parse(JSON.stringify(targetState.connections));
        this.selectedNodeId = targetState.selectedNodeId || null;
        this.markAllDirty();
      }
    };

    animateStep();
  }

  public addCenterNode(x: number, y: number, text: string = '中心主题'): Node {
    this.saveHistoryState();

    const node: Node = {
      id: this.generateId(),
      text: text.substring(0, MAX_TEXT_LENGTH),
      x: x - 60,
      y: y - 30,
      width: 120,
      height: 60,
      color: '#FFFFFF',
      children: [],
      collapsed: false,
      hasNote: false,
      isDragging: false,
      isEditing: false,
      level: 0,
      subtreeSize: 0
    };

    this.nodes.push(node);
    this.selectNode(node.id);
    this.updateNodeSize(node);
    this.scheduleLayout();
    this.eventBus.emit('node:add', node);
    this.markAllDirty();

    return node;
  }

  private createChildNode(parentId: string, x: number, y: number): Node {
    this.saveHistoryState();

    const parent = this.getNode(parentId);
    if (!parent) throw new Error('Parent node not found');

    const node: Node = {
      id: this.generateId(),
      text: '新节点',
      x: x,
      y: y,
      width: 80,
      height: 40,
      color: '#FFFFFF',
      parentId: parentId,
      children: [],
      collapsed: false,
      hasNote: false,
      isDragging: false,
      isEditing: false,
      level: parent.level + 1,
      subtreeSize: 0
    };

    this.nodes.push(node);
    parent.children.push(node.id);

    const connection: Connection = {
      id: `conn-${parentId}-${node.id}`,
      fromNodeId: parentId,
      toNodeId: node.id,
      isHovered: false
    };
    this.connections.push(connection);

    this.selectNode(node.id);
    this.updateNodeSize(node);
    this.scheduleLayout();
    this.eventBus.emit('node:add', node);
    this.markAllDirty();

    setTimeout(() => this.startEditingNode(node.id), 100);

    return node;
  }

  public deleteNode(nodeId: string): void {
    const node = this.getNode(nodeId);
    if (!node) return;

    this.saveHistoryState();

    const deleteRecursive = (id: string): void => {
      const n = this.getNode(id);
      if (!n) return;

      n.children.forEach((childId) => deleteRecursive(childId));

      this.connections = this.connections.filter(
        (c) => c.fromNodeId !== id && c.toNodeId !== id
      );

      this.nodes = this.nodes.filter((n) => n.id !== id);

      if (n.imageUrl) {
        delete this.imageCache[n.imageUrl];
      }
    };

    if (node.parentId) {
      const parent = this.getNode(node.parentId);
      if (parent) {
        parent.children = parent.children.filter((id) => id !== nodeId);
      }
    }

    deleteRecursive(nodeId);

    if (this.selectedNodeId === nodeId) {
      this.selectedNodeId = null;
    }

    this.scheduleLayout();
    this.eventBus.emit('node:delete', nodeId);
    this.markAllDirty();
  }

  public updateNodeText(nodeId: string, text: string): void {
    const node = this.getNode(nodeId);
    if (!node) return;

    this.saveHistoryState();
    node.text = text.substring(0, MAX_TEXT_LENGTH);
    this.updateNodeSize(node);
    this.scheduleLayout();
    this.eventBus.emit('node:update', node);
    this.markAllDirty();
  }

  public updateNodeColor(nodeId: string, color: string): void {
    const node = this.getNode(nodeId);
    if (!node) return;

    this.saveHistoryState();
    node.color = color;
    this.eventBus.emit('node:update', node);
    this.markAllDirty();
  }

  public updateNodeImage(nodeId: string, imageUrl: string): void {
    const node = this.getNode(nodeId);
    if (!node) return;

    this.saveHistoryState();
    node.imageUrl = imageUrl || undefined;

    if (imageUrl) {
      this.loadImage(imageUrl);
    }

    this.updateNodeSize(node);
    this.scheduleLayout();
    this.eventBus.emit('node:update', node);
    this.markAllDirty();
  }

  public updateNodeNote(nodeId: string, note: string): void {
    const node = this.getNode(nodeId);
    if (!node) return;

    this.saveHistoryState();
    node.note = note.substring(0, MAX_NOTE_LENGTH) || undefined;
    node.hasNote = !!note && note.length > 0;
    this.eventBus.emit('node:update', node);
    this.markAllDirty();
  }

  public toggleNodeCollapse(nodeId: string): void {
    const node = this.getNode(nodeId);
    if (!node || node.children.length === 0) return;

    this.saveHistoryState();
    node.collapsed = !node.collapsed;
    this.scheduleLayout();
    this.eventBus.emit('node:update', node);
    this.markAllDirty();
  }

  public selectNode(nodeId: string | null): void {
    this.selectedNodeId = nodeId;
    this.eventBus.emit('node:select', nodeId);
    this.markAllDirty();
  }

  private startEditingNode(nodeId: string): void {
    const node = this.getNode(nodeId);
    if (!node) return;

    node.isEditing = true;
    const editor = document.getElementById('node-editor') as HTMLInputElement;
    if (!editor) return;

    editor.value = node.text;
    editor.style.display = 'block';
    editor.style.left = `${node.x}px`;
    editor.style.top = `${node.y}px`;
    editor.style.width = `${node.width}px`;
    editor.style.height = `${node.height}px`;
    editor.focus();
    editor.select();

    const finishEditing = (save: boolean) => {
      if (save && editor.value !== node.text) {
        this.updateNodeText(nodeId, editor.value);
      }
      node.isEditing = false;
      editor.style.display = 'none';
      editor.removeEventListener('blur', onBlur);
      editor.removeEventListener('keydown', onKeyDown);
    };

    const onBlur = () => finishEditing(true);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        finishEditing(true);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        finishEditing(false);
      }
    };

    editor.addEventListener('blur', onBlur);
    editor.addEventListener('keydown', onKeyDown);
  }

  private updateNodeSize(node: Node): void {
    const ctx = this.ctx;
    ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const textMetrics = ctx.measureText(node.text);
    const textWidth = textMetrics.width + NODE_PADDING * 2;
    const baseHeight = 40;

    let imageHeight = 0;
    if (node.imageUrl) {
      imageHeight = Math.min(node.height * 0.5, 60);
    }

    node.width = Math.max(80, textWidth);
    node.height = Math.max(40, baseHeight + imageHeight);
  }

  private loadImage(url: string): void {
    if (this.imageCache[url]) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      this.imageCache[url] = img;
      this.nodes.forEach((node) => {
        if (node.imageUrl === url) {
          this.updateNodeSize(node);
        }
      });
      this.scheduleLayout();
      this.markAllDirty();
    };
    img.onerror = () => {
      delete this.imageCache[url];
    };
    img.src = url;
  }

  private scheduleLayout(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = window.setTimeout(() => {
      this.performLayout();
    }, 50);
  }

  public performLayout(): void {
    if (this.nodes.length === 0) return;

    const roots = this.nodes.filter((n) => !n.parentId);
    if (roots.length === 0) return;

    const centerX = this.canvas.width / (2 * (window.devicePixelRatio || 1));
    const centerY = this.canvas.height / (2 * (window.devicePixelRatio || 1));

    this.nodes.forEach((node) => {
      node.subtreeSize = this.calculateSubtreeSize(node);
    });

    const root = roots[0];
    root.x = centerX - root.width / 2;
    root.y = centerY - root.height / 2;

    this.layoutSubtree(root, root.x, root.y, 1);
    this.eventBus.emit('layout:update');
  }

  private relayoutFromNode(nodeId: string): void {
    const node = this.getNode(nodeId);
    if (!node) return;

    this.nodes.forEach((n) => {
      n.subtreeSize = this.calculateSubtreeSize(n);
    });

    this.layoutSubtree(node, node.x, node.y, 1);
    this.eventBus.emit('layout:update');
  }

  private calculateSubtreeSize(node: Node): number {
    if (node.collapsed || node.children.length === 0) {
      return node.height;
    }

    let totalHeight = 0;
    node.children.forEach((childId) => {
      const child = this.getNode(childId);
      if (child) {
        totalHeight += this.calculateSubtreeSize(child);
      }
    });

    totalHeight += (node.children.length - 1) * VERTICAL_SPACING;
    return Math.max(node.height, totalHeight);
  }

  private layoutSubtree(node: Node, startX: number, startY: number, direction: number): { width: number; height: number } {
    if (node.collapsed || node.children.length === 0) {
      return { width: node.width, height: node.height };
    }

    const childStartX = startX + node.width + HORIZONTAL_SPACING;
    let currentY = startY;
    const childSizes: { width: number; height: number }[] = [];

    let totalChildHeight = 0;
    node.children.forEach((childId) => {
      const child = this.getNode(childId);
      if (child) {
        totalChildHeight += child.subtreeSize;
      }
    });
    totalChildHeight += (node.children.length - 1) * VERTICAL_SPACING;

    currentY = startY + node.height / 2 - totalChildHeight / 2;

    node.children.forEach((childId) => {
      const child = this.getNode(childId);
      if (!child) return;

      const childSize = this.layoutSubtree(child, childStartX, currentY, direction);
      childSizes.push(childSize);

      child.x = childStartX;
      child.y = currentY + childSize.height / 2 - child.height / 2;

      currentY += childSize.height + VERTICAL_SPACING;
    });

    const totalWidth = node.width + HORIZONTAL_SPACING + Math.max(...childSizes.map((s) => s.width));
    const totalHeight = Math.max(node.height, totalChildHeight);

    return { width: totalWidth, height: totalHeight };
  }

  public async loadFromUrl(url: string): Promise<void> {
    try {
      const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
      const data = await response.json();

      if (!data.contents) {
        throw new Error('无法获取页面内容');
      }

      const parser = new DOMParser();
      const doc = parser.parseFromString(data.contents, 'text/html');

      const title = doc.querySelector('title')?.textContent || '未命名页面';
      const rootNode = this.addCenterNode(
        this.canvas.width / (2 * (window.devicePixelRatio || 1)),
        this.canvas.height / (2 * (window.devicePixelRatio || 1)),
        title.substring(0, 20)
      );

      const headings: { level: number; text: string }[] = [];
      const headingTags = ['h1', 'h2', 'h3', 'h4', 'h5'];

      doc.querySelectorAll(headingTags.join(', ')).forEach((el) => {
        const level = parseInt(el.tagName.substring(1), 10);
        const text = el.textContent?.trim() || '';
        if (text && level <= 5) {
          headings.push({ level, text: text.substring(0, 20) });
        }
      });

      this.buildTreeFromHeadings(rootNode, headings);
      this.eventBus.emit('url:load', { success: true, nodeCount: this.nodes.length });
    } catch (error) {
      console.error('Failed to load URL:', error);
      this.eventBus.emit('url:load', { success: false, error: String(error) });
    }
  }

  private buildTreeFromHeadings(root: Node, headings: { level: number; text: string }[]): void {
    this.saveHistoryState();

    const nodeStack: { node: Node; level: number }[] = [{ node: root, level: 0 }];

    headings.forEach((heading) => {
      while (nodeStack.length > 1 && nodeStack[nodeStack.length - 1].level >= heading.level) {
        nodeStack.pop();
      }

      const parent = nodeStack[nodeStack.length - 1].node;
      const node: Node = {
        id: this.generateId(),
        text: heading.text,
        x: 0,
        y: 0,
        width: 80,
        height: 40,
        color: '#FFFFFF',
        parentId: parent.id,
        children: [],
        collapsed: false,
        hasNote: false,
        isDragging: false,
        isEditing: false,
        level: heading.level,
        subtreeSize: 0
      };

      this.nodes.push(node);
      parent.children.push(node.id);

      const connection: Connection = {
        id: `conn-${parent.id}-${node.id}`,
        fromNodeId: parent.id,
        toNodeId: node.id,
        isHovered: false
      };
      this.connections.push(connection);

      this.updateNodeSize(node);
      nodeStack.push({ node, level: heading.level });
    });

    this.scheduleLayout();
    this.markAllDirty();
  }

  public exportJson(): string {
    const exportData = {
      version: '1.0',
      exportTime: new Date().toISOString(),
      nodes: this.nodes.map((n) => ({
        id: n.id,
        text: n.text,
        x: n.x,
        y: n.y,
        width: n.width,
        height: n.height,
        color: n.color,
        imageUrl: n.imageUrl || null,
        note: n.note || null,
        parentId: n.parentId || null,
        children: n.children,
        collapsed: n.collapsed
      })),
      connections: this.connections.map((c) => ({
        id: c.id,
        fromNodeId: c.fromNodeId,
        toNodeId: c.toNodeId
      }))
    };

    const json = JSON.stringify(exportData, null, 2);
    this.eventBus.emit('export:json', json);
    return json;
  }

  public exportPng(): string {
    const exportCanvas = document.createElement('canvas');
    const exportCtx = exportCanvas.getContext('2d')!;
    const targetWidth = 1920;
    const targetHeight = 1080;

    exportCanvas.width = targetWidth;
    exportCanvas.height = targetHeight;

    exportCtx.fillStyle = '#FFFFFF';
    exportCtx.fillRect(0, 0, targetWidth, targetHeight);

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    this.nodes.forEach((node) => {
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x + node.width);
      maxY = Math.max(maxY, node.y + node.height);
    });

    const padding = 50;
    const contentWidth = maxX - minX + padding * 2;
    const contentHeight = maxY - minY + padding * 2;
    const scale = Math.min(targetWidth / contentWidth, targetHeight / contentHeight, 1);
    const offsetX = (targetWidth - contentWidth * scale) / 2 - minX * scale + padding * scale;
    const offsetY = (targetHeight - contentHeight * scale) / 2 - minY * scale + padding * scale;

    exportCtx.save();
    exportCtx.translate(offsetX, offsetY);
    exportCtx.scale(scale, scale);

    this.connections.forEach((conn) => {
      const fromNode = this.getNode(conn.fromNodeId);
      const toNode = this.getNode(conn.toNodeId);
      if (!fromNode || !toNode) return;
      this.drawConnection(exportCtx, fromNode, toNode, false);
    });

    this.nodes.forEach((node) => {
      this.drawNode(exportCtx, node, false, false, false);
    });

    exportCtx.restore();

    const dataUrl = exportCanvas.toDataURL('image/png');
    this.eventBus.emit('export:png', dataUrl);
    return dataUrl;
  }

  private markAllDirty(): void {
    this.dirtyRects = [
      {
        x: 0,
        y: 0,
        width: this.canvas.width / (window.devicePixelRatio || 1),
        height: this.canvas.height / (window.devicePixelRatio || 1)
      }
    ];
  }

  private startRenderLoop(): void {
    const render = (timestamp: number) => {
      this.frameCount++;
      if (timestamp - this.lastFrameTime >= 1000) {
        this.fps = this.frameCount;
        this.frameCount = 0;
        this.lastFrameTime = timestamp;
      }

      if (this.dirtyRects.length > 0) {
        this.render();
        this.dirtyRects = [];
      }

      requestAnimationFrame(render);
    };

    requestAnimationFrame(render);
  }

  private render(): void {
    const ctx = this.ctx;
    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(this.gridCanvas, 0, 0, width, height);

    this.connections.forEach((conn) => {
      const fromNode = this.getNode(conn.fromNodeId);
      const toNode = this.getNode(conn.toNodeId);
      if (!fromNode || !toNode) return;
      this.drawConnection(ctx, fromNode, toNode, conn.isHovered);
    });

    if (this.isDrawingConnection) {
      this.drawTempConnection(ctx);
    }

    this.nodes.forEach((node) => {
      const isSelected = node.id === this.selectedNodeId;
      const isHovered = node.id === this.hoveredNodeId;
      const isHandleHovered = node.id === this.hoveredHandleNodeId;
      this.drawNode(ctx, node, isSelected, isHovered, isHandleHovered);
    });
  }

  private drawConnection(ctx: CanvasRenderingContext2D, from: Node, to: Node, isHovered: boolean): void {
    const startX = from.x + from.width;
    const startY = from.y + from.height / 2;
    const endX = to.x;
    const endY = to.y + to.height / 2;

    const cp1x = startX + (endX - startX) * 0.5;
    const cp1y = startY;
    const cp2x = endX - (endX - startX) * 0.5;
    const cp2y = endY;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
    ctx.strokeStyle = isHovered ? '#3B82F6' : '#9CA3AF';
    ctx.lineWidth = isHovered ? 3 : 2;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  private drawTempConnection(ctx: CanvasRenderingContext2D): void {
    const cp1x = this.connectionStartX + (this.connectionEndX - this.connectionStartX) * 0.5;
    const cp1y = this.connectionStartY;
    const cp2x = this.connectionEndX - (this.connectionEndX - this.connectionStartX) * 0.5;
    const cp2y = this.connectionEndY;

    ctx.beginPath();
    ctx.moveTo(this.connectionStartX, this.connectionStartY);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, this.connectionEndX, this.connectionEndY);
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.arc(this.connectionEndX, this.connectionEndY, 6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
    ctx.fill();
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  private drawNode(
    ctx: CanvasRenderingContext2D,
    node: Node,
    isSelected: boolean,
    isHovered: boolean,
    isHandleHovered: boolean
  ): void {
    const x = node.x;
    const y = node.y;
    const w = node.width;
    const h = node.height;
    const radius = 12;

    ctx.save();

    if (isSelected) {
      ctx.shadowColor = '#3B82F6';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      ctx.beginPath();
      ctx.roundRect(x - 2, y - 2, w + 4, h + 4, radius + 2);
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;

    if (node.color === 'transparent') {
      ctx.globalAlpha = 0.8;
    } else {
      ctx.fillStyle = node.color;
    }

    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);

    if (node.color !== 'transparent') {
      ctx.fill();
    }

    ctx.shadowColor = 'transparent';

    if (isHovered && !isSelected) {
      ctx.strokeStyle = '#D1D5DB';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.globalAlpha = 1;

    let contentY = y + 10;

    if (node.imageUrl) {
      const img = this.imageCache[node.imageUrl];
      if (img) {
        const imgSize = Math.min(w * 0.5, h * 0.5, 60);
        const imgX = x + w / 2 - imgSize / 2;
        const imgY = contentY;

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(imgX, imgY, imgSize, imgSize, 6);
        ctx.clip();
        ctx.drawImage(img, imgX, imgY, imgSize, imgSize);
        ctx.restore();

        contentY += imgSize + 8;
      }
    }

    ctx.fillStyle = '#111827';
    ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.text, x + w / 2, contentY + (h - (contentY - y)) / 2);

    if (node.hasNote) {
      const noteDotX = x + w - 6;
      const noteDotY = y + h - 6;
      ctx.beginPath();
      ctx.arc(noteDotX, noteDotY, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#EF4444';
      ctx.fill();
    }

    if (node.children.length > 0 || isHovered || isSelected) {
      const handleX = x + w;
      const handleY = y + h / 2;

      ctx.beginPath();
      ctx.arc(handleX, handleY, HANDLE_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = isHandleHovered ? '#3B82F6' : '#FFFFFF';
      ctx.fill();
      ctx.strokeStyle = isHandleHovered ? '#2563EB' : '#D1D5DB';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(handleX, handleY, 3, 0, Math.PI * 2);
      ctx.fillStyle = isHandleHovered ? '#FFFFFF' : '#9CA3AF';
      ctx.fill();
    }

    if (node.children.length > 0) {
      const collapseIconX = x + w / 2;
      const collapseIconY = y + h - 6;
      const iconSize = 10;

      ctx.beginPath();
      if (node.collapsed) {
        ctx.moveTo(collapseIconX - iconSize / 2, collapseIconY);
        ctx.lineTo(collapseIconX + iconSize / 2, collapseIconY);
        ctx.moveTo(collapseIconX, collapseIconY - iconSize / 2);
        ctx.lineTo(collapseIconX, collapseIconY + iconSize / 2);
      } else {
        ctx.moveTo(collapseIconX - iconSize / 2, collapseIconY);
        ctx.lineTo(collapseIconX, collapseIconY + iconSize / 2);
        ctx.lineTo(collapseIconX + iconSize / 2, collapseIconY);
      }
      ctx.strokeStyle = '#6B7280';
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }

    ctx.restore();
  }

  public getFps(): number {
    return this.fps;
  }
}
