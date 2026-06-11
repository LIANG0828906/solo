import { io, Socket } from 'socket.io-client';
import {
  DesignElement,
  TextElement,
  PatternElement,
  ElementOp,
  createTextElement,
  createPatternElement,
  moveElement,
  scaleElement,
  rotateElement,
  setElementColor,
  setElementOpacity,
  reorderElement,
  deleteElement,
  getSortedElements,
  hitTest,
  renderElement,
  renderGrid,
  makeOp,
  applyOp,
  getElementBounds,
} from './editor';
import {
  PatternType,
  PaperType,
  getPatternTypes,
  getPaperConfigs,
  generatePaperTexture,
  generatePatternThumbnail,
} from './template';

interface User {
  id: string;
  name: string;
  color: string;
}

const CANVAS_W = 800;
const CANVAS_H = 600;
const EXPORT_W = 1920;
const EXPORT_H = 1440;

class TuoyinApp {
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private elements: DesignElement[] = [];
  private selectedElement: DesignElement | null = null;
  private isDragging = false;
  private isAltDrag = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragStartElX = 0;
  private dragStartElY = 0;
  private showGrid = false;
  private socket!: Socket;
  private roomId = '';
  private userId = '';
  private users: User[] = [];
  private paperCanvas!: HTMLCanvasElement;
  private animationElements: Map<string, number> = new Map();
  private lastMoveEmit = 0;

  init(): void {
    this.roomId = this.getRoomIdFromUrl();
    this.userId = `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    this.setupCanvas();
    this.setupPaperTexture();
    this.setupSocket();
    this.setupUIEvents();
    this.setupCanvasEvents();
    this.startRenderLoop();

    window.addEventListener('resize', () => this.handleResize());
    this.handleResize();
  }

  private getRoomIdFromUrl(): string {
    const params = new URLSearchParams(window.location.search);
    return params.get('room') || 'room001';
  }

  private setupCanvas(): void {
    this.canvas = document.getElementById('tuoyin-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.canvas.width = CANVAS_W;
    this.canvas.height = CANVAS_H;
  }

  private setupPaperTexture(): void {
    const paperConfig = getPaperConfigs()[0];
    this.paperCanvas = generatePaperTexture(CANVAS_W, CANVAS_H, paperConfig);
  }

  private setupSocket(): void {
    this.socket = io();

    this.socket.on('connect', () => {
      this.socket.emit('join-room', {
        roomId: this.roomId,
        userName: `匠人${Math.floor(Math.random() * 1000)}`,
      });
    });

    this.socket.on('room-state', (state: { elements: DesignElement[]; users: User[] }) => {
      this.elements = state.elements;
      this.users = state.users;
      this.updateUsersDisplay();
      this.updateLayerList();
    });

    this.socket.on('element-update', (op: ElementOp) => {
      this.elements = applyOp(this.elements, op);
      this.updateLayerList();
    });

    this.socket.on('user-joined', (user: User) => {
      this.users.push(user);
      this.updateUsersDisplay();
    });

    this.socket.on('user-left', (data: { userId: string }) => {
      this.users = this.users.filter(u => u.id !== data.userId);
      this.updateUsersDisplay();
    });

    this.socket.on('users-list', (users: User[]) => {
      this.users = users;
      this.updateUsersDisplay();
    });
  }

  private setupUIEvents(): void {
    this.setupAddText();
    this.setupAddPattern();
    this.setupExport();
    this.setupDeleteKey();
    this.setupContextMenu();
    this.setupLayerList();
    this.setupColorPicker();
    this.setupOpacitySlider();
    this.setupPaperToggle();
    this.setupResponsive();
  }

  private setupAddText(): void {
    const btn = document.getElementById('btn-add-text');
    const modal = document.getElementById('text-modal');
    const confirmBtn = document.getElementById('text-confirm');
    const cancelBtn = document.getElementById('text-cancel');

    btn?.addEventListener('click', () => {
      modal?.classList.add('active');
    });

    cancelBtn?.addEventListener('click', () => {
      modal?.classList.remove('active');
    });

    confirmBtn?.addEventListener('click', () => {
      const textInput = document.getElementById('text-input') as HTMLInputElement;
      const fontSelect = document.getElementById('font-select') as HTMLSelectElement;
      const fontSizeSlider = document.getElementById('font-size-slider') as HTMLInputElement;
      const fontSizeDisplay = document.getElementById('font-size-display');

      const text = textInput.value.trim();
      if (!text) return;

      const font = fontSelect.value;
      const fontSize = parseInt(fontSizeSlider.value);
      const el = createTextElement(text, font, fontSize, CANVAS_W / 2, CANVAS_H / 2);
      el.zIndex = this.getNextZIndex();

      this.elements.push(el);
      this.selectedElement = el;
      this.addElementAnimation(el.id);

      this.emitOp('element-add', makeOp(this.roomId, el.id, 'text', 'add', { element: el }));

      modal?.classList.remove('active');
      textInput.value = '';
      this.updateLayerList();
    });

    const fontSizeSlider = document.getElementById('font-size-slider') as HTMLInputElement;
    const fontSizeDisplay = document.getElementById('font-size-display');
    fontSizeSlider?.addEventListener('input', () => {
      if (fontSizeDisplay) fontSizeDisplay.textContent = `${fontSizeSlider.value}px`;
    });
  }

  private setupAddPattern(): void {
    const btn = document.getElementById('btn-add-pattern');
    const panel = document.getElementById('pattern-panel');

    btn?.addEventListener('click', () => {
      panel?.classList.toggle('active');
      this.renderPatternThumbnails();
    });

    const closeBtn = document.getElementById('pattern-close');
    closeBtn?.addEventListener('click', () => {
      panel?.classList.remove('active');
    });
  }

  private renderPatternThumbnails(): void {
    const container = document.getElementById('pattern-list');
    if (!container) return;
    container.innerHTML = '';

    const types = getPatternTypes();
    for (const pt of types) {
      const thumb = generatePatternThumbnail(pt, 80);
      thumb.className = 'pattern-thumb';
      thumb.title = pt;
      thumb.style.cursor = 'pointer';
      thumb.style.border = '2px solid #8B5A2B';
      thumb.style.borderRadius = '4px';
      thumb.style.transition = 'transform 0.2s, box-shadow 0.2s';

      thumb.addEventListener('mouseenter', () => {
        thumb.style.transform = 'scale(1.05)';
        thumb.style.boxShadow = '0 0 8px rgba(218,165,32,0.5)';
      });
      thumb.addEventListener('mouseleave', () => {
        thumb.style.transform = 'scale(1)';
        thumb.style.boxShadow = 'none';
      });

      thumb.addEventListener('click', () => {
        const el = createPatternElement(pt, CANVAS_W / 2, CANVAS_H / 2);
        el.zIndex = this.getBottomZIndex();
        this.elements.push(el);
        this.selectedElement = el;
        this.addElementAnimation(el.id);

        this.emitOp('element-add', makeOp(this.roomId, el.id, 'pattern', 'add', { element: el }));

        document.getElementById('pattern-panel')?.classList.remove('active');
        this.updateLayerList();
      });

      const label = document.createElement('div');
      label.textContent = pt;
      label.style.textAlign = 'center';
      label.style.color = '#F5E6CA';
      label.style.fontSize = '12px';
      label.style.marginTop = '4px';
      label.style.fontFamily = 'KaiTi, STKaiti, serif';

      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.alignItems = 'center';
      wrapper.appendChild(thumb);
      wrapper.appendChild(label);
      container.appendChild(wrapper);
    }
  }

  private setupExport(): void {
    const btn = document.getElementById('btn-export');
    btn?.addEventListener('click', () => this.exportImage());
  }

  private setupDeleteKey(): void {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Delete' && this.selectedElement) {
        this.deleteSelected();
      }
    });
  }

  private setupContextMenu(): void {
    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      const hit = hitTest(this.elements, x, y);
      if (hit) {
        this.selectedElement = hit;
        this.showContextMenu(e.clientX, e.clientY);
      }
    });

    document.addEventListener('click', () => {
      this.hideContextMenu();
    });
  }

  private showContextMenu(x: number, y: number): void {
    let menu = document.getElementById('context-menu');
    if (!menu) {
      menu = document.createElement('div');
      menu.id = 'context-menu';
      menu.innerHTML = '<div class="ctx-item" id="ctx-delete">去除</div>';
      document.body.appendChild(menu);

      document.getElementById('ctx-delete')?.addEventListener('click', () => {
        this.deleteSelected();
        this.hideContextMenu();
      });
    }

    menu.style.position = 'fixed';
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.style.display = 'block';
  }

  private hideContextMenu(): void {
    const menu = document.getElementById('context-menu');
    if (menu) menu.style.display = 'none';
  }

  private deleteSelected(): void {
    if (!this.selectedElement) return;
    const id = this.selectedElement.id;
    this.emitOp('element-delete', makeOp(this.roomId, id, this.selectedElement.type, 'delete', {}));
    this.elements = deleteElement(this.elements, id);
    this.selectedElement = null;
    this.updateLayerList();
  }

  private setupLayerList(): void {
    const container = document.getElementById('layer-list');
    if (!container) return;

    container.addEventListener('dragover', (e) => {
      e.preventDefault();
      const dragging = container.querySelector('.dragging') as HTMLElement;
      const afterElement = this.getDragAfterElement(container, e.clientY);
      if (afterElement) {
        container.insertBefore(dragging, afterElement);
      } else {
        container.appendChild(dragging);
      }
    });

    container.addEventListener('dragend', () => {
      const items = container.querySelectorAll('.layer-item');
      const newOrder: string[] = [];
      items.forEach((item) => {
        const elId = (item as HTMLElement).dataset.elementId;
        if (elId) newOrder.push(elId);
      });

      newOrder.reverse();
      newOrder.forEach((elId, idx) => {
        const el = this.elements.find(e => e.id === elId);
        if (el) {
          const newZ = (idx + 1) * 10;
          el.zIndex = newZ;
          this.emitOp('element-reorder', makeOp(this.roomId, el.id, el.type, 'reorder', { zIndex: newZ }));
        }
      });
    });
  }

  private getDragAfterElement(container: HTMLElement, y: number): HTMLElement | null {
    const elements = [...container.querySelectorAll('.layer-item:not(.dragging)')] as HTMLElement[];
    return elements.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
          return { offset, element: child };
        }
        return closest;
      },
      { offset: Number.NEGATIVE_INFINITY, element: null as HTMLElement | null }
    ).element;
  }

  private setupColorPicker(): void {
    const picker = document.getElementById('color-picker') as HTMLInputElement;
    picker?.addEventListener('input', () => {
      if (!this.selectedElement) return;
      setElementColor(this.selectedElement, picker.value);
      this.emitOp('element-color', makeOp(this.roomId, this.selectedElement.id, this.selectedElement.type, 'color', { color: picker.value }));
    });
  }

  private setupOpacitySlider(): void {
    const slider = document.getElementById('opacity-slider') as HTMLInputElement;
    const display = document.getElementById('opacity-display');
    slider?.addEventListener('input', () => {
      if (!this.selectedElement) return;
      const val = parseFloat(slider.value);
      setElementOpacity(this.selectedElement, val);
      if (display) display.textContent = `${Math.round(val * 100)}%`;
      this.emitOp('element-opacity', makeOp(this.roomId, this.selectedElement.id, this.selectedElement.type, 'opacity', { opacity: val }));
    });
  }

  private setupPaperToggle(): void {
    const select = document.getElementById('paper-select') as HTMLSelectElement;
    select?.addEventListener('change', () => {
      const paperType = select.value as PaperType;
      const configs = getPaperConfigs();
      const config = configs.find(c => c.type === paperType) || configs[0];
      this.paperCanvas = generatePaperTexture(CANVAS_W, CANVAS_H, config);
    });
  }

  private setupResponsive(): void {
    const toggleBtn = document.getElementById('panel-toggle');
    const panel = document.getElementById('tool-panel');
    toggleBtn?.addEventListener('click', () => {
      panel?.classList.toggle('expanded');
    });
  }

  private setupCanvasEvents(): void {
    this.canvas.addEventListener('mousedown', (e) => this.onPointerDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onPointerMove(e));
    this.canvas.addEventListener('mouseup', () => this.onPointerUp());
    this.canvas.addEventListener('mouseleave', () => this.onPointerUp());
    this.canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.onPointerDown(touch);
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.onPointerMove(touch);
    }, { passive: false });

    this.canvas.addEventListener('touchend', () => this.onPointerUp());
  }

  private canvasCoords(e: MouseEvent | Touch): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  private onPointerDown(e: MouseEvent | Touch): void {
    const { x, y } = this.canvasCoords(e);
    const hit = hitTest(this.elements, x, y);

    if (hit) {
      this.selectedElement = hit;
      this.isDragging = true;
      this.isAltDrag = e.altKey;
      this.dragStartX = x;
      this.dragStartY = y;
      this.dragStartElX = hit.x;
      this.dragStartElY = hit.y;
      this.showGrid = true;

      const picker = document.getElementById('color-picker') as HTMLInputElement;
      const opacitySlider = document.getElementById('opacity-slider') as HTMLInputElement;
      if (picker) picker.value = hit.color;
      if (opacitySlider) {
        opacitySlider.value = hit.opacity.toString();
        const display = document.getElementById('opacity-display');
        if (display) display.textContent = `${Math.round(hit.opacity * 100)}%`;
      }
      this.updateLayerList();
    } else {
      this.selectedElement = null;
      this.updateLayerList();
    }
  }

  private onPointerMove(e: MouseEvent | Touch): void {
    if (!this.isDragging || !this.selectedElement) return;

    const { x, y } = this.canvasCoords(e);

    if (this.isAltDrag || e.altKey) {
      const dx = x - this.dragStartX;
      const dy = y - this.dragStartY;
      const angle = dx > 0 ? 1 : -1;
      rotateElement(this.selectedElement, angle * 0.2);

      this.emitOpThrottled('element-rotate', makeOp(
        this.roomId,
        this.selectedElement.id,
        this.selectedElement.type,
        'rotate',
        { rotation: this.selectedElement.rotation }
      ));
    } else {
      const dx = x - this.dragStartX;
      const dy = y - this.dragStartY;
      this.selectedElement.x = this.dragStartElX + dx;
      this.selectedElement.y = this.dragStartElY + dy;

      this.emitOpThrottled('element-move', makeOp(
        this.roomId,
        this.selectedElement.id,
        this.selectedElement.type,
        'move',
        { x: this.selectedElement.x, y: this.selectedElement.y }
      ));
    }
  }

  private onPointerUp(): void {
    this.isDragging = false;
    this.isAltDrag = false;
    this.showGrid = false;
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    if (!this.selectedElement) return;

    const delta = e.deltaY > 0 ? -1 : 1;
    scaleElement(this.selectedElement, delta);

    this.emitOp('element-scale', makeOp(
      this.roomId,
      this.selectedElement.id,
      this.selectedElement.type,
      'scale',
      { scale: this.selectedElement.scale }
    ));
  }

  private emitOp(event: string, op: ElementOp): void {
    if (this.socket?.connected) {
      this.socket.emit(event, op);
    }
  }

  private emitOpThrottled(event: string, op: ElementOp): void {
    const now = Date.now();
    if (now - this.lastMoveEmit < 33) return;
    this.lastMoveEmit = now;
    this.emitOp(event, op);
  }

  private getNextZIndex(): number {
    if (this.elements.length === 0) return 10;
    return Math.max(...this.elements.map(e => e.zIndex)) + 10;
  }

  private getBottomZIndex(): number {
    if (this.elements.length === 0) return 10;
    return Math.min(...this.elements.map(e => e.zIndex)) - 10;
  }

  private addElementAnimation(elementId: string): void {
    this.animationElements.set(elementId, Date.now());
    setTimeout(() => {
      this.animationElements.delete(elementId);
    }, 300);
  }

  private startRenderLoop(): void {
    const render = () => {
      this.render();
      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);
  }

  private render(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.drawImage(this.paperCanvas, 0, 0);

    if (this.showGrid) {
      renderGrid(ctx, CANVAS_W, CANVAS_H);
    }

    const sorted = getSortedElements(this.elements);
    for (const el of sorted) {
      const animStart = this.animationElements.get(el.id);
      if (animStart) {
        const elapsed = Date.now() - animStart;
        const progress = Math.min(elapsed / 300, 1);
        ctx.save();
        ctx.globalAlpha = progress;
        const offsetY = (1 - progress) * 10;
        ctx.translate(0, -offsetY);
        renderElement(ctx, el, el === this.selectedElement);
        ctx.restore();
      } else {
        if (this.isDragging && el === this.selectedElement) {
          ctx.save();
          ctx.shadowColor = 'rgba(0,0,0,0.2)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
          renderElement(ctx, el, true);
          ctx.restore();
        } else {
          renderElement(ctx, el, el === this.selectedElement);
        }
      }
    }
  }

  private exportImage(): void {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = EXPORT_W;
    exportCanvas.height = EXPORT_H;
    const ctx = exportCanvas.getContext('2d')!;

    const scaleX = EXPORT_W / CANVAS_W;
    const scaleY = EXPORT_H / CANVAS_H;

    ctx.scale(scaleX, scaleY);
    ctx.drawImage(this.paperCanvas, 0, 0);

    const sorted = getSortedElements(this.elements);
    for (const el of sorted) {
      renderElement(ctx, el, false, true);
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    link.download = `tuoyin_${this.roomId}_${timestamp}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();

    import('canvas-confetti').then((confetti) => {
      confetti.default({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#DAA520', '#8B4513', '#F5E6CA', '#8B3A3A'],
      });
    }).catch(() => {});
  }

  private updateUsersDisplay(): void {
    const container = document.getElementById('users-display');
    if (!container) return;

    container.innerHTML = '';
    for (const user of this.users) {
      const avatar = document.createElement('div');
      avatar.className = 'user-avatar';
      avatar.style.backgroundColor = user.color;
      avatar.title = user.name;
      avatar.textContent = user.name.charAt(0);
      container.appendChild(avatar);
    }

    const count = document.createElement('span');
    count.className = 'user-count';
    count.textContent = `${this.users.length}人在线`;
    container.appendChild(count);
  }

  private updateLayerList(): void {
    const container = document.getElementById('layer-list');
    if (!container) return;

    container.innerHTML = '';
    const sorted = [...this.elements].sort((a, b) => b.zIndex - a.zIndex);

    for (const el of sorted) {
      const item = document.createElement('div');
      item.className = 'layer-item';
      item.draggable = true;
      item.dataset.elementId = el.id;

      if (el === this.selectedElement) {
        item.classList.add('selected');
      }

      const icon = document.createElement('span');
      icon.className = 'layer-icon';
      icon.textContent = el.type === 'text' ? '文' : '纹';

      const name = document.createElement('span');
      name.className = 'layer-name';
      name.textContent = el.type === 'text'
        ? (el as TextElement).text.slice(0, 6)
        : (el as PatternElement).patternType;

      item.appendChild(icon);
      item.appendChild(name);

      item.addEventListener('click', () => {
        this.selectedElement = el;
        this.updateLayerList();

        const picker = document.getElementById('color-picker') as HTMLInputElement;
        const opacitySlider = document.getElementById('opacity-slider') as HTMLInputElement;
        if (picker) picker.value = el.color;
        if (opacitySlider) {
          opacitySlider.value = el.opacity.toString();
          const display = document.getElementById('opacity-display');
          if (display) display.textContent = `${Math.round(el.opacity * 100)}%`;
        }
      });

      item.addEventListener('dragstart', () => {
        item.classList.add('dragging');
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
      });

      container.appendChild(item);
    }
  }

  private handleResize(): void {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    const vw = window.innerWidth;
    if (vw < 800) {
      container.style.width = '100%';
      container.style.maxWidth = '100%';
      const panel = document.getElementById('tool-panel');
      panel?.classList.add('mobile');
    } else {
      const panel = document.getElementById('tool-panel');
      panel?.classList.remove('mobile');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new TuoyinApp();
  app.init();
});
