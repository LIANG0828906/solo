import {
  GradientConfig,
  ColorStop,
  GradientType,
  createDefaultConfig,
  generateId,
  renderGradient,
  generateCSSCode,
  getLinearGradientPoints,
  calculateAngleFromPoints
} from './gradientEngine';

interface AppState {
  currentConfig: GradientConfig;
  favorites: GradientConfig[];
  isDragging: boolean;
  activeHandle: string | null;
  dragStartX: number;
  dragStartY: number;
  drawerOpen: boolean;
  favoritesOpen: boolean;
}

const STORAGE_KEY = 'css-gradient-favorites';
const MAX_COLOR_STOPS = 8;

export class UIController {
  private state: AppState;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private container: HTMLElement;
  private onChangeCallback: (() => void) | null = null;

  private elements: {
    typeButtons: NodeListOf<HTMLButtonElement>;
    colorStopsContainer: HTMLElement;
    addColorStopBtn: HTMLButtonElement;
    saveFavoriteBtn: HTMLButtonElement;
    showFavoritesBtn: HTMLButtonElement;
    exportCSSBtn: HTMLButtonElement;
    favoritesOverlay: HTMLElement;
    favoritesPanel: HTMLElement;
    favoritesGrid: HTMLElement;
    closeFavoritesBtn: HTMLButtonElement;
    drawerToggle: HTMLButtonElement;
    drawerOverlay: HTMLElement;
    controlPanel: HTMLElement;
    canvasWrapper: HTMLElement;
  };

  constructor(canvas: HTMLCanvasElement, container: HTMLElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.container = container;

    this.state = {
      currentConfig: createDefaultConfig(),
      favorites: this.loadFavorites(),
      isDragging: false,
      activeHandle: null,
      dragStartX: 0,
      dragStartY: 0,
      drawerOpen: false,
      favoritesOpen: false
    };

    this.elements = this.bindElements();
    this.initEventListeners();
    this.setupCanvasSize();
  }

  private bindElements() {
    return {
      typeButtons: this.container.querySelectorAll('.type-btn') as NodeListOf<HTMLButtonElement>,
      colorStopsContainer: this.container.querySelector('.color-stops') as HTMLElement,
      addColorStopBtn: this.container.querySelector('.add-btn') as HTMLButtonElement,
      saveFavoriteBtn: this.container.querySelector('#saveFavoriteBtn') as HTMLButtonElement,
      showFavoritesBtn: this.container.querySelector('#showFavoritesBtn') as HTMLButtonElement,
      exportCSSBtn: this.container.querySelector('#exportCSSBtn') as HTMLButtonElement,
      favoritesOverlay: this.container.querySelector('.favorites-overlay') as HTMLElement,
      favoritesPanel: this.container.querySelector('.favorites-panel') as HTMLElement,
      favoritesGrid: this.container.querySelector('.favorites-grid') as HTMLElement,
      closeFavoritesBtn: this.container.querySelector('.close-btn') as HTMLButtonElement,
      drawerToggle: this.container.querySelector('.drawer-toggle') as HTMLButtonElement,
      drawerOverlay: this.container.querySelector('.drawer-overlay') as HTMLElement,
      controlPanel: this.container.querySelector('.control-panel') as HTMLElement,
      canvasWrapper: this.container.querySelector('.preview-canvas-wrapper') as HTMLElement
    };
  }

  private initEventListeners(): void {
    this.elements.typeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type as GradientType;
        this.setGradientType(type);
      });
    });

    this.elements.addColorStopBtn.addEventListener('click', () => this.addColorStop());
    this.elements.saveFavoriteBtn.addEventListener('click', () => this.saveFavorite());
    this.elements.showFavoritesBtn.addEventListener('click', () => this.toggleFavoritesPanel(true));
    this.elements.closeFavoritesBtn.addEventListener('click', () => this.toggleFavoritesPanel(false));
    this.elements.favoritesOverlay.addEventListener('click', (e) => {
      if (e.target === this.elements.favoritesOverlay) {
        this.toggleFavoritesPanel(false);
      }
    });
    this.elements.exportCSSBtn.addEventListener('click', () => this.exportCSS());

    this.elements.drawerToggle.addEventListener('click', () => this.toggleDrawer(true));
    this.elements.drawerOverlay.addEventListener('click', () => this.toggleDrawer(false));

    this.bindCanvasEvents();
    window.addEventListener('resize', () => this.setupCanvasSize());
  }

  private bindCanvasEvents(): void {
    const wrapper = this.elements.canvasWrapper;

    wrapper.addEventListener('mousedown', (e) => this.handleDragStart(e));
    wrapper.addEventListener('mousemove', (e) => this.handleDragMove(e));
    wrapper.addEventListener('mouseup', () => this.handleDragEnd());
    wrapper.addEventListener('mouseleave', () => this.handleDragEnd());

    wrapper.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      this.handleDragStart({ clientX: touch.clientX, clientY: touch.clientY, target: e.target } as MouseEvent);
    }, { passive: true });

    wrapper.addEventListener('touchmove', (e) => {
      const touch = e.touches[0];
      this.handleDragMove({ clientX: touch.clientX, clientY: touch.clientY } as MouseEvent);
    }, { passive: true });

    wrapper.addEventListener('touchend', () => this.handleDragEnd());
  }

  private setupCanvasSize(): void {
    const container = this.elements.canvasWrapper.parentElement!;
    const padding = 64;
    const maxWidth = container.clientWidth - padding;
    const maxHeight = container.clientHeight - padding;
    
    let width = Math.min(maxWidth, 900);
    let height = Math.min(maxHeight, 600);
    
    if (width < 400) width = 400;
    if (height < 300) height = 300;

    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.scale(dpr, dpr);

    this.render();
  }

  private handleDragStart(e: MouseEvent | { clientX: number; clientY: number; target: EventTarget | null }): void {
    const rect = this.canvas.getBoundingClientRect();
    this.state.dragStartX = e.clientX - rect.left;
    this.state.dragStartY = e.clientY - rect.top;
    this.state.isDragging = true;

    const target = e.target as HTMLElement;
    if (target.classList.contains('drag-handle')) {
      this.state.activeHandle = target.dataset.handle || null;
    } else {
      this.state.activeHandle = 'canvas';
    }
  }

  private handleDragMove(e: MouseEvent | { clientX: number; clientY: number }): void {
    if (!this.state.isDragging) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    const config = this.state.currentConfig;

    if (this.state.activeHandle === 'canvas') {
      if (config.type === 'linear') {
        const centerX = width / 2;
        const centerY = height / 2;
        const angle = calculateAngleFromPoints(centerX, centerY, x, y);
        this.updateConfig({ angle });
      } else if (config.type === 'radial' || config.type === 'conic') {
        const centerX = Math.max(0, Math.min(100, (x / width) * 100));
        const centerY = Math.max(0, Math.min(100, (y / height) * 100));
        this.updateConfig({ centerX, centerY });
      }
    } else if (this.state.activeHandle === 'center') {
      const centerX = Math.max(0, Math.min(100, (x / width) * 100));
      const centerY = Math.max(0, Math.min(100, (y / height) * 100));
      this.updateConfig({ centerX, centerY });
    } else if (this.state.activeHandle === 'radius') {
      const centerXPixel = (config.centerX / 100) * width;
      const centerYPixel = (config.centerY / 100) * height;
      const dx = x - centerXPixel;
      const dy = y - centerYPixel;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const radiusX = Math.max(5, Math.min(100, (distance / width) * 100));
      const radiusY = Math.max(5, Math.min(100, (distance / height) * 100));
      this.updateConfig({ radiusX, radiusY });
    } else if (this.state.activeHandle === 'angle') {
      const centerXPixel = (config.centerX / 100) * width;
      const centerYPixel = (config.centerY / 100) * height;
      const angle = calculateAngleFromPoints(centerXPixel, centerYPixel, x, y);
      this.updateConfig({ angle });
    }

    this.state.dragStartX = x;
    this.state.dragStartY = y;
  }

  private handleDragEnd(): void {
    this.state.isDragging = false;
    this.state.activeHandle = null;
  }

  setGradientType(type: GradientType): void {
    this.elements.typeButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.type === type);
    });
    this.updateConfig({ type });
  }

  addColorStop(): void {
    if (this.state.currentConfig.colorStops.length >= MAX_COLOR_STOPS) {
      return;
    }

    const stops = this.state.currentConfig.colorStops;
    let newColor = '#ffffff';
    let newPosition = 50;

    if (stops.length > 0) {
      const lastStop = stops[stops.length - 1];
      const hue = Math.floor(Math.random() * 360);
      newColor = `hsl(${hue}, 70%, 60%)`;
      newPosition = Math.min(100, lastStop.position + 20);
    }

    const newStop: ColorStop = {
      id: generateId(),
      color: newColor,
      position: newPosition
    };

    this.updateConfig({
      colorStops: [...stops, newStop]
    });
  }

  removeColorStop(stopId: string): void {
    if (this.state.currentConfig.colorStops.length <= 2) {
      return;
    }

    this.updateConfig({
      colorStops: this.state.currentConfig.colorStops.filter(s => s.id !== stopId)
    });
  }

  updateColorStop(stopId: string, updates: Partial<ColorStop>): void {
    this.updateConfig({
      colorStops: this.state.currentConfig.colorStops.map(s =>
        s.id === stopId ? { ...s, ...updates } : s
      )
    });
  }

  private updateConfig(updates: Partial<GradientConfig>): void {
    this.state.currentConfig = {
      ...this.state.currentConfig,
      ...updates
    };
    this.render();
    this.renderColorStops();
    if (this.onChangeCallback) {
      this.onChangeCallback();
    }
  }

  render(): void {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    
    this.canvas.style.opacity = '0.7';
    
    requestAnimationFrame(() => {
      renderGradient(this.ctx, this.state.currentConfig, width, height);
      this.canvas.style.opacity = '1';
      this.renderDragHandles();
    });
  }

  private renderDragHandles(): void {
    const existingHandles = this.elements.canvasWrapper.querySelectorAll('.drag-handle, .gradient-line');
    existingHandles.forEach(h => h.remove());

    const config = this.state.currentConfig;
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    if (config.type === 'linear') {
      const points = getLinearGradientPoints(config, width, height);
      
      const svgNS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('width', width.toString());
      svg.setAttribute('height', height.toString());
      svg.style.cssText = 'position: absolute; top: 0; left: 0; pointer-events: none;';
      svg.classList.add('gradient-line');

      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', points.x1.toString());
      line.setAttribute('y1', points.y1.toString());
      line.setAttribute('x2', points.x2.toString());
      line.setAttribute('y2', points.y2.toString());
      line.setAttribute('class', 'gradient-line');

      const arrowSize = 12;
      const angle = Math.atan2(points.y2 - points.y1, points.x2 - points.x1);
      const arrow = document.createElementNS(svgNS, 'polygon');
      const arrowPoints = [
        [points.x2, points.y2],
        [points.x2 - arrowSize * Math.cos(angle - Math.PI / 6), points.y2 - arrowSize * Math.sin(angle - Math.PI / 6)],
        [points.x2 - arrowSize * Math.cos(angle + Math.PI / 6), points.y2 - arrowSize * Math.sin(angle + Math.PI / 6)]
      ].map(p => p.join(',')).join(' ');
      arrow.setAttribute('points', arrowPoints);
      arrow.setAttribute('class', 'gradient-arrow');

      svg.appendChild(line);
      svg.appendChild(arrow);
      this.elements.canvasWrapper.appendChild(svg);

      this.createHandle(points.x1, points.y1, 'start');
      this.createHandle(points.x2, points.y2, 'end');
    } else if (config.type === 'radial') {
      const cx = (config.centerX / 100) * width;
      const cy = (config.centerY / 100) * height;
      const rx = (config.radiusX / 100) * width;
      
      this.createHandle(cx, cy, 'center');
      this.createHandle(cx + rx, cy, 'radius');
    } else if (config.type === 'conic') {
      const cx = (config.centerX / 100) * width;
      const cy = (config.centerY / 100) * height;
      const radius = Math.min(width, height) * 0.35;
      const angleRad = (config.angle - 90) * (Math.PI / 180);
      const ax = cx + Math.cos(angleRad) * radius;
      const ay = cy + Math.sin(angleRad) * radius;

      const svgNS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('width', width.toString());
      svg.setAttribute('height', height.toString());
      svg.style.cssText = 'position: absolute; top: 0; left: 0; pointer-events: none;';
      svg.classList.add('gradient-line');

      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', cx.toString());
      line.setAttribute('y1', cy.toString());
      line.setAttribute('x2', ax.toString());
      line.setAttribute('y2', ay.toString());
      line.setAttribute('class', 'gradient-line');

      svg.appendChild(line);
      this.elements.canvasWrapper.appendChild(svg);

      this.createHandle(cx, cy, 'center');
      this.createHandle(ax, ay, 'angle');
    }
  }

  private createHandle(x: number, y: number, type: string): void {
    const handle = document.createElement('div');
    handle.className = 'drag-handle';
    handle.dataset.handle = type;
    handle.style.left = `${x}px`;
    handle.style.top = `${y}px`;
    this.elements.canvasWrapper.appendChild(handle);
  }

  renderColorStops(): void {
    this.elements.colorStopsContainer.innerHTML = '';
    
    this.state.currentConfig.colorStops.forEach((stop, index) => {
      const stopEl = document.createElement('div');
      stopEl.className = 'color-stop';
      stopEl.dataset.stopId = stop.id;

      stopEl.innerHTML = `
        <div class="color-picker-wrapper">
          <input type="color" class="color-picker" value="${stop.color}" title="选择颜色">
        </div>
        <div class="slider-container">
          <div class="slider-label">
            <span>色标 ${index + 1}</span>
            <span>${stop.position.toFixed(0)}%</span>
          </div>
          <input type="range" class="slider" min="0" max="100" step="1" value="${stop.position}">
        </div>
        <button class="delete-btn" title="删除色标">×</button>
      `;

      const colorPicker = stopEl.querySelector('.color-picker') as HTMLInputElement;
      const positionSlider = stopEl.querySelector('.slider') as HTMLInputElement;
      const deleteBtn = stopEl.querySelector('.delete-btn') as HTMLButtonElement;

      colorPicker.addEventListener('input', (e) => {
        this.updateColorStop(stop.id, { color: (e.target as HTMLInputElement).value });
      });

      positionSlider.addEventListener('input', (e) => {
        this.updateColorStop(stop.id, { position: Number((e.target as HTMLInputElement).value) });
      });

      deleteBtn.addEventListener('click', () => {
        this.removeColorStop(stop.id);
      });

      this.elements.colorStopsContainer.appendChild(stopEl);
    });

    const canAdd = this.state.currentConfig.colorStops.length < MAX_COLOR_STOPS;
    this.elements.addColorStopBtn.style.display = canAdd ? 'block' : 'none';
  }

  private loadFavorites(): GradientConfig[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveFavorites(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state.favorites));
    } catch (e) {
      console.error('Failed to save favorites:', e);
    }
  }

  async saveFavorite(): Promise<void> {
    const name = prompt('请输入渐变方案名称:', this.state.currentConfig.name);
    if (!name) return;

    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = 200;
    offscreenCanvas.height = 120;
    const offCtx = offscreenCanvas.getContext('2d')!;
    renderGradient(offCtx, this.state.currentConfig, 200, 120);
    const thumbnail = offscreenCanvas.toDataURL('image/png');

    const favorite: GradientConfig = {
      ...JSON.parse(JSON.stringify(this.state.currentConfig)),
      id: generateId(),
      name,
      createdAt: Date.now(),
      thumbnail
    } as GradientConfig & { thumbnail: string };

    this.state.favorites.unshift(favorite);
    this.saveFavorites();
    this.renderFavorites();
  }

  loadFavorite(id: string): void {
    const favorite = this.state.favorites.find(f => f.id === id);
    if (!favorite) return;

    const cleanConfig = { ...favorite };
    delete (cleanConfig as any).thumbnail;
    
    this.state.currentConfig = cleanConfig;
    this.syncTypeButtons();
    this.render();
    this.renderColorStops();
    this.toggleFavoritesPanel(false);
  }

  deleteFavorite(id: string, event: Event): void {
    event.stopPropagation();
    if (!confirm('确定要删除这个收藏方案吗？')) return;
    
    this.state.favorites = this.state.favorites.filter(f => f.id !== id);
    this.saveFavorites();
    this.renderFavorites();
  }

  renameFavorite(id: string, newName: string): void {
    const favorite = this.state.favorites.find(f => f.id === id);
    if (favorite) {
      favorite.name = newName;
      this.saveFavorites();
    }
  }

  renderFavorites(): void {
    this.elements.favoritesGrid.innerHTML = '';

    if (this.state.favorites.length === 0) {
      this.elements.favoritesGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">⭐</div>
          <p>还没有收藏的渐变方案</p>
          <p style="font-size: 13px; margin-top: 8px; opacity: 0.7;">点击顶部星形按钮收藏当前方案</p>
        </div>
      `;
      return;
    }

    this.state.favorites.forEach(favorite => {
      const card = document.createElement('div');
      card.className = 'favorite-card';
      card.dataset.favoriteId = favorite.id;

      card.innerHTML = `
        <canvas class="favorite-thumbnail" width="200" height="120"></canvas>
        <div class="favorite-info">
          <input type="text" class="favorite-name" value="${favorite.name}" readonly>
          <button class="favorite-delete" title="删除">×</button>
        </div>
      `;

      const thumbnail = card.querySelector('.favorite-thumbnail') as HTMLCanvasElement;
      const thumbCtx = thumbnail.getContext('2d')!;
      renderGradient(thumbCtx, favorite, 200, 120);

      const nameInput = card.querySelector('.favorite-name') as HTMLInputElement;
      const deleteBtn = card.querySelector('.favorite-delete') as HTMLButtonElement;

      card.addEventListener('click', (e) => {
        if (!nameInput.classList.contains('editing') && e.target !== deleteBtn) {
          this.loadFavorite(favorite.id);
        }
      });

      nameInput.addEventListener('dblclick', () => {
        nameInput.classList.add('editing');
        nameInput.removeAttribute('readonly');
        nameInput.focus();
        nameInput.select();
      });

      nameInput.addEventListener('blur', () => {
        nameInput.classList.remove('editing');
        nameInput.setAttribute('readonly', 'true');
        this.renameFavorite(favorite.id, nameInput.value);
      });

      nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          nameInput.blur();
        }
      });

      deleteBtn.addEventListener('click', (e) => this.deleteFavorite(favorite.id, e));

      this.elements.favoritesGrid.appendChild(card);
    });
  }

  private toggleFavoritesPanel(open: boolean): void {
    this.state.favoritesOpen = open;
    this.elements.favoritesOverlay.classList.toggle('active', open);
    this.elements.favoritesPanel.classList.toggle('active', open);
    
    if (open) {
      this.renderFavorites();
    }
  }

  private toggleDrawer(open: boolean): void {
    this.state.drawerOpen = open;
    this.elements.controlPanel.classList.toggle('active', open);
    this.elements.drawerOverlay.classList.toggle('active', open);
  }

  private syncTypeButtons(): void {
    this.elements.typeButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.type === this.state.currentConfig.type);
    });
  }

  async exportCSS(): Promise<void> {
    const cssCode = generateCSSCode(this.state.currentConfig);
    const fullCode = `background: ${cssCode};`;
    
    try {
      await navigator.clipboard.writeText(fullCode);
      const originalText = this.elements.exportCSSBtn.textContent;
      this.elements.exportCSSBtn.textContent = '✓ 已复制';
      setTimeout(() => {
        this.elements.exportCSSBtn.textContent = originalText;
      }, 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = fullCode;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      
      const originalText = this.elements.exportCSSBtn.textContent;
      this.elements.exportCSSBtn.textContent = '✓ 已复制';
      setTimeout(() => {
        this.elements.exportCSSBtn.textContent = originalText;
      }, 2000);
    }
  }

  getCurrentConfig(): GradientConfig {
    return { ...this.state.currentConfig };
  }

  setOnChangeCallback(callback: () => void): void {
    this.onChangeCallback = callback;
  }
}
