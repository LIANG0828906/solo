import { ElementType, ELEMENT_LABELS } from './config';

interface EditorUICallbacks {
  onElementSelect: (type: ElementType | null) => void;
  onPlatformLengthChange: (length: number) => void;
  onPreview: () => void;
  onSave: () => void;
  onLoad: () => void;
}

export class EditorUI {
  private container: HTMLElement;
  private callbacks: EditorUICallbacks;
  private selectedElement: ElementType | null = null;
  private platformLength: number = 2;
  private toolItems: Map<ElementType, HTMLElement> = new Map();
  private platformLengthContainer: HTMLElement;
  private lengthButtons: HTMLButtonElement[] = [];
  private toastEl: HTMLElement;

  constructor(toolbarId: string, callbacks: EditorUICallbacks) {
    this.container = document.getElementById(toolbarId)!;
    this.callbacks = callbacks;
    this.toastEl = document.getElementById('toast')!;
    this.platformLengthContainer = document.createElement('div');
    this.buildUI();
  }

  private buildUI(): void {
    const title = document.createElement('h2');
    title.textContent = '关卡编辑器';
    this.container.appendChild(title);

    const elementSection = document.createElement('div');
    elementSection.className = 'tool-section';
    const elementTitle = document.createElement('h3');
    elementTitle.textContent = '元素';
    elementSection.appendChild(elementTitle);

    const elements: ElementType[] = [
      ElementType.GROUND,
      ElementType.PLATFORM,
      ElementType.SPIKE,
      ElementType.ENEMY,
      ElementType.COIN,
      ElementType.PLAYER_START,
      ElementType.END_FLAG,
      ElementType.ERASER,
    ];

    elements.forEach((type) => {
      const item = document.createElement('div');
      item.className = 'tool-item';
      item.dataset.type = type;

      const icon = document.createElement('div');
      icon.className = `tool-icon icon-${this.getIconClass(type)}`;

      const label = document.createElement('span');
      label.textContent = ELEMENT_LABELS[type];

      item.appendChild(icon);
      item.appendChild(label);

      item.addEventListener('click', () => {
        this.selectElement(type);
      });

      this.toolItems.set(type, item);
      elementSection.appendChild(item);
    });

    this.platformLengthContainer.className = 'platform-length';
    const lenLabel = document.createElement('label');
    lenLabel.textContent = '长度：';
    this.platformLengthContainer.appendChild(lenLabel);

    for (let len = 2; len <= 5; len++) {
      const btn = document.createElement('button');
      btn.textContent = String(len);
      btn.dataset.len = String(len);
      if (len === 2) btn.classList.add('active');
      btn.addEventListener('click', () => {
        this.setPlatformLength(len);
      });
      this.lengthButtons.push(btn);
      this.platformLengthContainer.appendChild(btn);
    }

    elementSection.appendChild(this.platformLengthContainer);
    this.container.appendChild(elementSection);

    const actionSection = document.createElement('div');
    actionSection.className = 'action-section';

    const saveBtn = document.createElement('button');
    saveBtn.className = 'action-btn btn-save';
    saveBtn.textContent = '保存';
    saveBtn.addEventListener('click', () => this.callbacks.onSave());

    const loadBtn = document.createElement('button');
    loadBtn.className = 'action-btn btn-load';
    loadBtn.textContent = '加载';
    loadBtn.addEventListener('click', () => this.callbacks.onLoad());

    const previewBtn = document.createElement('button');
    previewBtn.className = 'action-btn btn-preview';
    previewBtn.textContent = '预览';
    previewBtn.addEventListener('click', () => this.callbacks.onPreview());

    actionSection.appendChild(saveBtn);
    actionSection.appendChild(loadBtn);
    actionSection.appendChild(previewBtn);
    this.container.appendChild(actionSection);
  }

  private getIconClass(type: ElementType): string {
    switch (type) {
      case ElementType.GROUND: return 'ground';
      case ElementType.PLATFORM: return 'platform';
      case ElementType.SPIKE: return 'spike';
      case ElementType.ENEMY: return 'enemy';
      case ElementType.COIN: return 'coin';
      case ElementType.PLAYER_START: return 'player';
      case ElementType.END_FLAG: return 'flag';
      case ElementType.ERASER: return 'eraser';
      default: return '';
    }
  }

  private selectElement(type: ElementType): void {
    this.selectedElement = type;
    this.toolItems.forEach((item, t) => {
      item.classList.toggle('selected', t === type);
    });

    this.platformLengthContainer.classList.toggle('visible', type === ElementType.PLATFORM);

    this.callbacks.onElementSelect(type);
  }

  private setPlatformLength(length: number): void {
    this.platformLength = length;
    this.lengthButtons.forEach((btn) => {
      btn.classList.toggle('active', Number(btn.dataset.len) === length);
    });
    this.callbacks.onPlatformLengthChange(length);
  }

  getSelectedElement(): ElementType | null {
    return this.selectedElement;
  }

  getPlatformLength(): number {
    return this.platformLength;
  }

  showToast(message: string, type: 'success' | 'error'): void {
    this.toastEl.textContent = message;
    this.toastEl.className = `toast ${type} show`;
    setTimeout(() => {
      this.toastEl.classList.remove('show');
    }, type === 'success' ? 2000 : 3000);
  }

  setEnabled(enabled: boolean): void {
    this.container.style.pointerEvents = enabled ? 'auto' : 'none';
    this.container.style.opacity = enabled ? '1' : '0.5';
  }
}
