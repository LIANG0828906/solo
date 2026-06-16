import { ExplosionShape, ControlCallbacks, COLOR_PALETTE, ExplosionHistory } from './types';

export class ControlPanel {
  private container: HTMLElement;
  private callbacks: ControlCallbacks;
  private selectedColors: string[] = ['#FF6B35', '#FFE66D'];
  private selectedShape: ExplosionShape = 'circle';
  private particleCount: number = 150;
  private autoFire: boolean = false;
  private history: ExplosionHistory[] = [];
  private panelMinimized: boolean = false;
  private historyPanelOpen: boolean = false;
  private panelElement!: HTMLDivElement;
  private historyPanelElement!: HTMLDivElement;

  constructor(container: HTMLElement, callbacks: ControlCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.createStyles();
    this.createControlPanel();
    this.createReplayButton();
    this.createHistoryPanel();
  }

  public addHistoryRecord(record: ExplosionHistory): void {
    this.history.unshift(record);
    if (this.history.length > 10) {
      this.history.pop();
    }
    this.updateHistoryPanel();
  }

  public getSelectedColors(): string[] {
    return [...this.selectedColors];
  }

  public getSelectedShape(): ExplosionShape {
    return this.selectedShape;
  }

  public getParticleCount(): number {
    return this.particleCount;
  }

  public getAutoFire(): boolean {
    return this.autoFire;
  }

  private createStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .glass-panel {
        background: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 16px;
        padding: 20px;
        color: #e0e0e0;
        font-family: sans-serif;
        transition: all 0.3s ease;
      }

      .control-panel {
        position: fixed;
        right: 20px;
        bottom: 20px;
        width: 320px;
        z-index: 100;
        transform: translateX(0);
      }

      .control-panel.minimized {
        transform: translateX(calc(100% + 40px));
      }

      .control-panel.minimized .minimize-btn {
        transform: translateX(calc(-100% - 20px));
      }

      .panel-section {
        margin-bottom: 20px;
      }

      .panel-section:last-child {
        margin-bottom: 0;
      }

      .section-label {
        font-size: 14px;
        margin-bottom: 10px;
        color: #e0e0e0;
        opacity: 0.9;
      }

      .color-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
      }

      .color-dot {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        cursor: pointer;
        border: 2px solid transparent;
        transition: all 0.2s ease-out;
        position: relative;
      }

      .color-dot:hover {
        transform: scale(1.05);
        filter: brightness(1.25);
      }

      .color-dot:active {
        transform: scale(0.95);
      }

      .color-dot.selected {
        transform: scale(1.2);
        border-color: #ffffff;
        box-shadow: 0 0 15px rgba(255, 255, 255, 0.6);
        animation: glow 1.5s ease-in-out infinite;
      }

      @keyframes glow {
        0%, 100% { box-shadow: 0 0 10px rgba(255, 255, 255, 0.4); }
        50% { box-shadow: 0 0 20px rgba(255, 255, 255, 0.8); }
      }

      .shape-selector {
        display: flex;
        gap: 15px;
        justify-content: center;
      }

      .shape-btn {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.3);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease-out;
        position: relative;
      }

      .shape-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: scale(1.05);
      }

      .shape-btn:active {
        transform: scale(0.95);
      }

      .shape-btn.selected {
        background: rgba(255, 255, 255, 0.3);
        border-color: rgba(255, 255, 255, 0.6);
      }

      .shape-btn.animate {
        animation: rotateBounce 0.5s ease-out;
      }

      @keyframes rotateBounce {
        0% { transform: rotate(0deg) scale(1); }
        50% { transform: rotate(180deg) scale(1.2); }
        100% { transform: rotate(360deg) scale(1); }
      }

      .shape-icon {
        width: 18px;
        height: 18px;
        stroke: #e0e0e0;
        stroke-width: 2;
        fill: none;
      }

      .slider-container {
        position: relative;
      }

      .slider {
        width: 100%;
        height: 6px;
        border-radius: 3px;
        background: rgba(255, 255, 255, 0.2);
        outline: none;
        -webkit-appearance: none;
        appearance: none;
        cursor: pointer;
      }

      .slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #ffffff;
        cursor: pointer;
        transition: all 0.2s ease-out;
      }

      .slider::-webkit-slider-thumb:hover {
        transform: scale(1.1);
        box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
      }

      .slider::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #ffffff;
        cursor: pointer;
        border: none;
      }

      .slider-value {
        position: absolute;
        top: -30px;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.7);
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        opacity: 0;
        transition: opacity 0.2s;
        pointer-events: none;
      }

      .slider-value.visible {
        opacity: 1;
      }

      .toggle-switch {
        display: flex;
        align-items: center;
        gap: 12px;
        cursor: pointer;
      }

      .switch {
        width: 50px;
        height: 26px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 13px;
        position: relative;
        transition: all 0.3s ease;
        border: 1px solid rgba(255, 255, 255, 0.3);
      }

      .switch::after {
        content: '';
        position: absolute;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #ffffff;
        top: 2px;
        left: 2px;
        transition: all 0.3s ease;
      }

      .switch.active {
        background: rgba(76, 175, 80, 0.5);
        border-color: rgba(76, 175, 80, 0.8);
      }

      .switch.active::after {
        left: 26px;
      }

      .toggle-label {
        font-size: 14px;
        color: #e0e0e0;
      }

      .minimize-btn {
        position: absolute;
        top: 10px;
        right: 10px;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.3);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
      }

      .minimize-btn:hover {
        background: rgba(255, 255, 255, 0.2);
      }

      .minimize-arrow {
        width: 12px;
        height: 12px;
        border-right: 2px solid #e0e0e0;
        border-bottom: 2px solid #e0e0e0;
        transform: rotate(-45deg);
        transition: transform 0.3s ease;
      }

      .control-panel.minimized .minimize-arrow {
        transform: rotate(135deg);
      }

      .replay-btn {
        position: fixed;
        left: 20px;
        top: 20px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.3);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100;
        transition: all 0.2s ease-out;
      }

      .replay-btn:hover {
        background: rgba(255, 255, 255, 0.25);
        transform: scale(1.05);
      }

      .replay-btn:active {
        transform: scale(0.95);
      }

      .replay-icon {
        width: 20px;
        height: 20px;
        border: 2px solid #e0e0e0;
        border-right-color: transparent;
        border-radius: 50%;
        position: relative;
      }

      .replay-icon::after {
        content: '';
        position: absolute;
        right: -4px;
        top: 2px;
        width: 0;
        height: 0;
        border-left: 6px solid #e0e0e0;
        border-top: 4px solid transparent;
        border-bottom: 4px solid transparent;
      }

      .history-panel {
        position: fixed;
        right: -400px;
        top: 0;
        width: 380px;
        height: 100vh;
        background: rgba(20, 20, 40, 0.95);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-left: 1px solid rgba(255, 255, 255, 0.2);
        z-index: 200;
        transition: right 0.3s ease;
        overflow-y: auto;
        padding: 20px;
      }

      .history-panel.open {
        right: 0;
      }

      .history-title {
        font-size: 18px;
        margin-bottom: 20px;
        color: #e0e0e0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .history-close {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        border: none;
        color: #e0e0e0;
        cursor: pointer;
        font-size: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      .history-close:hover {
        background: rgba(255, 255, 255, 0.2);
      }

      .history-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .history-item {
        display: flex;
        align-items: center;
        gap: 15px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s ease-out;
        border: 1px solid transparent;
      }

      .history-item:hover {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.3);
        transform: translateX(-5px);
      }

      .history-item:active {
        transform: scale(0.98);
      }

      .history-thumbnail {
        width: 60px;
        height: 60px;
        border-radius: 8px;
        object-fit: cover;
        background: rgba(0, 0, 0, 0.5);
      }

      .history-info {
        flex: 1;
      }

      .history-time {
        font-size: 12px;
        color: #a0a0a0;
        margin-bottom: 4px;
      }

      .history-shape {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        color: #e0e0e0;
      }

      .history-shape-icon {
        width: 16px;
        height: 16px;
        stroke: #e0e0e0;
        stroke-width: 2;
        fill: none;
      }

      .empty-history {
        text-align: center;
        color: #808080;
        padding: 40px 20px;
        font-size: 14px;
      }

      @media (max-width: 768px) {
        .control-panel {
          right: 0;
          bottom: 0;
          width: 100%;
          border-radius: 16px 16px 0 0;
        }

        .control-panel.minimized {
          transform: translateY(calc(100% + 20px));
        }

        .control-panel.minimized .minimize-btn {
          transform: translateY(calc(-100% - 20px)) translateX(0);
        }

        .minimize-btn {
          top: -40px;
          right: 20px;
        }

        .control-panel.minimized .minimize-arrow {
          transform: rotate(45deg);
        }

        .minimize-arrow {
          transform: rotate(-135deg);
        }

        .color-grid {
          grid-template-columns: repeat(6, 1fr);
        }

        .history-panel {
          width: 100%;
          right: -100%;
        }

        .replay-btn {
          left: 15px;
          top: 15px;
          width: 44px;
          height: 44px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  private createControlPanel(): void {
    this.panelElement = document.createElement('div');
    this.panelElement.className = 'glass-panel control-panel';

    const minimizeBtn = document.createElement('button');
    minimizeBtn.className = 'minimize-btn';
    minimizeBtn.title = '最小化';
    const minimizeArrow = document.createElement('div');
    minimizeArrow.className = 'minimize-arrow';
    minimizeBtn.appendChild(minimizeArrow);
    minimizeBtn.addEventListener('click', () => this.togglePanelMinimized());
    this.panelElement.appendChild(minimizeBtn);

    const colorSection = this.createColorSection();
    this.panelElement.appendChild(colorSection);

    const shapeSection = this.createShapeSection();
    this.panelElement.appendChild(shapeSection);

    const particleSection = this.createParticleSection();
    this.panelElement.appendChild(particleSection);

    const autoFireSection = this.createAutoFireSection();
    this.panelElement.appendChild(autoFireSection);

    this.container.appendChild(this.panelElement);
  }

  private createColorSection(): HTMLDivElement {
    const section = document.createElement('div');
    section.className = 'panel-section';

    const label = document.createElement('div');
    label.className = 'section-label';
    label.textContent = '选择颜色（最多3种）';
    section.appendChild(label);

    const grid = document.createElement('div');
    grid.className = 'color-grid';

    COLOR_PALETTE.forEach((item) => {
      const dot = document.createElement('div');
      dot.className = 'color-dot';
      dot.style.background = item.color;
      dot.title = item.name;
      dot.dataset.color = item.color;

      if (this.selectedColors.includes(item.color)) {
        dot.classList.add('selected');
      }

      dot.addEventListener('click', () => this.toggleColorSelection(item.color, dot));
      grid.appendChild(dot);
    });

    section.appendChild(grid);
    return section;
  }

  private createShapeSection(): HTMLDivElement {
    const section = document.createElement('div');
    section.className = 'panel-section';

    const label = document.createElement('div');
    label.className = 'section-label';
    label.textContent = '爆炸形状';
    section.appendChild(label);

    const selector = document.createElement('div');
    selector.className = 'shape-selector';

    const shapes: { id: ExplosionShape; name: string; svg: string }[] = [
      {
        id: 'circle',
        name: '圆形',
        svg: '<circle cx="9" cy="9" r="7" class="shape-icon" />',
      },
      {
        id: 'star',
        name: '星形',
        svg: '<polygon points="9,1 11,7 17,7 12,11 14,17 9,13 4,17 6,11 1,7 7,7" class="shape-icon" />',
      },
      {
        id: 'heart',
        name: '心形',
        svg: '<path d="M9,16 C9,16 1,10 1,5 C1,2 3,1 5,1 C7,1 9,3 9,3 C9,3 11,1 13,1 C15,1 17,2 17,5 C17,10 9,16 9,16 Z" class="shape-icon" />',
      },
    ];

    shapes.forEach((shape) => {
      const btn = document.createElement('button');
      btn.className = 'shape-btn';
      btn.title = shape.name;
      btn.dataset.shape = shape.id;
      btn.innerHTML = `<svg viewBox="0 0 18 18" width="18" height="18">${shape.svg}</svg>`;

      if (shape.id === this.selectedShape) {
        btn.classList.add('selected');
      }

      btn.addEventListener('click', () => {
        btn.classList.add('animate');
        setTimeout(() => btn.classList.remove('animate'), 500);
        this.selectShape(shape.id);
      });

      selector.appendChild(btn);
    });

    section.appendChild(selector);
    return section;
  }

  private createParticleSection(): HTMLDivElement {
    const section = document.createElement('div');
    section.className = 'panel-section';

    const label = document.createElement('div');
    label.className = 'section-label';
    label.textContent = `粒子数量: ${this.particleCount}`;
    section.appendChild(label);

    const container = document.createElement('div');
    container.className = 'slider-container';

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '50';
    slider.max = '300';
    slider.value = this.particleCount.toString();
    slider.className = 'slider';

    const valueLabel = document.createElement('div');
    valueLabel.className = 'slider-value';
    valueLabel.textContent = this.particleCount.toString();
    container.appendChild(valueLabel);

    slider.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value);
      this.particleCount = value;
      label.textContent = `粒子数量: ${value}`;
      valueLabel.textContent = value.toString();

      const rect = slider.getBoundingClientRect();
      const percent = (value - 50) / 250;
      const left = rect.left + percent * rect.width;
      valueLabel.style.left = `${left}px`;
      valueLabel.classList.add('visible');

      this.callbacks.onParticleCountChange(value);
    });

    slider.addEventListener('mouseup', () => {
      setTimeout(() => valueLabel.classList.remove('visible'), 500);
    });

    container.appendChild(slider);
    section.appendChild(container);
    return section;
  }

  private createAutoFireSection(): HTMLDivElement {
    const section = document.createElement('div');
    section.className = 'panel-section';

    const toggle = document.createElement('div');
    toggle.className = 'toggle-switch';

    const switchEl = document.createElement('div');
    switchEl.className = 'switch';
    if (this.autoFire) {
      switchEl.classList.add('active');
    }

    const label = document.createElement('span');
    label.className = 'toggle-label';
    label.textContent = '自动发射';

    toggle.appendChild(switchEl);
    toggle.appendChild(label);

    toggle.addEventListener('click', () => {
      this.autoFire = !this.autoFire;
      switchEl.classList.toggle('active', this.autoFire);
      this.callbacks.onAutoFireChange(this.autoFire);
    });

    section.appendChild(toggle);
    return section;
  }

  private createReplayButton(): void {
    const btn = document.createElement('button');
    btn.className = 'replay-btn';
    btn.title = '历史回放';

    const icon = document.createElement('div');
    icon.className = 'replay-icon';
    btn.appendChild(icon);

    btn.addEventListener('click', () => this.toggleHistoryPanel());
    this.container.appendChild(btn);
  }

  private createHistoryPanel(): void {
    this.historyPanelElement = document.createElement('div');
    this.historyPanelElement.className = 'history-panel';

    const titleBar = document.createElement('div');
    titleBar.className = 'history-title';
    titleBar.textContent = '历史记录';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'history-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => this.toggleHistoryPanel());
    titleBar.appendChild(closeBtn);

    this.historyPanelElement.appendChild(titleBar);

    const list = document.createElement('div');
    list.className = 'history-list';
    list.id = 'history-list';
    this.historyPanelElement.appendChild(list);

    this.updateHistoryPanel();
    this.container.appendChild(this.historyPanelElement);
  }

  private updateHistoryPanel(): void {
    const list = this.historyPanelElement.querySelector('#history-list') as HTMLDivElement;
    if (!list) return;

    list.innerHTML = '';

    if (this.history.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-history';
      empty.textContent = '暂无发射记录，点击屏幕发射烟花吧！';
      list.appendChild(empty);
      return;
    }

    const shapeIcons: Record<ExplosionShape, string> = {
      circle: '<circle cx="8" cy="8" r="6" class="history-shape-icon" />',
      star: '<polygon points="8,1 10,6 15,6 11,9 13,15 8,11 3,15 5,9 1,6 6,6" class="history-shape-icon" />',
      heart: '<path d="M8,14 C8,14 1,9 1,4 C1,1 3,0 5,0 C7,0 8,2 8,2 C8,2 9,0 11,0 C13,0 15,1 15,4 C15,9 8,14 8,14 Z" class="history-shape-icon" />',
    };

    const shapeNames: Record<ExplosionShape, string> = {
      circle: '圆形',
      star: '星形',
      heart: '心形',
    };

    this.history.forEach((record) => {
      const item = document.createElement('div');
      item.className = 'history-item';

      const thumbnail = document.createElement('img');
      thumbnail.className = 'history-thumbnail';
      thumbnail.src = record.snapshot;
      thumbnail.alt = '烟花快照';
      item.appendChild(thumbnail);

      const info = document.createElement('div');
      info.className = 'history-info';

      const time = document.createElement('div');
      time.className = 'history-time';
      time.textContent = this.formatTime(record.timestamp);
      info.appendChild(time);

      const shapeInfo = document.createElement('div');
      shapeInfo.className = 'history-shape';
      shapeInfo.innerHTML = `<svg viewBox="0 0 16 16" width="16" height="16">${shapeIcons[record.config.shape]}</svg>${shapeNames[record.config.shape]} · ${record.config.particleCount}粒子`;
      info.appendChild(shapeInfo);

      item.appendChild(info);

      item.addEventListener('click', () => {
        this.callbacks.onReplay(record.config);
        this.toggleHistoryPanel();
      });

      list.appendChild(item);
    });
  }

  private toggleColorSelection(color: string, element: HTMLDivElement): void {
    const index = this.selectedColors.indexOf(color);

    if (index >= 0) {
      this.selectedColors.splice(index, 1);
      element.classList.remove('selected');
    } else {
      if (this.selectedColors.length >= 3) {
        const removed = this.selectedColors.shift()!;
        const removedEl = this.panelElement.querySelector(`[data-color="${removed}"]`);
        removedEl?.classList.remove('selected');
      }
      this.selectedColors.push(color);
      element.classList.add('selected');
    }

    this.callbacks.onColorChange([...this.selectedColors]);
  }

  private selectShape(shape: ExplosionShape): void {
    this.selectedShape = shape;

    this.panelElement.querySelectorAll<HTMLElement>('.shape-btn').forEach((btn) => {
      btn.classList.toggle('selected', btn.dataset.shape === shape);
    });

    this.callbacks.onShapeChange(shape);
  }

  private togglePanelMinimized(): void {
    this.panelMinimized = !this.panelMinimized;
    this.panelElement.classList.toggle('minimized', this.panelMinimized);
  }

  private toggleHistoryPanel(): void {
    this.historyPanelOpen = !this.historyPanelOpen;
    this.historyPanelElement.classList.toggle('open', this.historyPanelOpen);
  }

  private formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }
}
