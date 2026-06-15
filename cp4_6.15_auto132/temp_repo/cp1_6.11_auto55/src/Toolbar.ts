import { GraphEngine, EventType } from './GraphEngine';

export class Toolbar {
  private engine: GraphEngine;
  private container: HTMLElement;
  private buttons: Map<string, HTMLButtonElement> = new Map();

  private urlModal: HTMLElement | null = null;
  private urlInput: HTMLInputElement | null = null;

  constructor(engine: GraphEngine, container: HTMLElement) {
    this.engine = engine;
    this.container = container;
    this.init();
  }

  private init(): void {
    this.setupButtons();
    this.setupUrlModal();
    this.setupEventListeners();
    this.subscribeToEvents();
  }

  private setupButtons(): void {
    const buttonElements = this.container.querySelectorAll('.toolbar-btn');
    buttonElements.forEach((btn) => {
      const action = btn.getAttribute('data-action');
      if (action) {
        this.buttons.set(action, btn as HTMLButtonElement);
      }
    });

    const undoBtn = this.buttons.get('undo');
    const redoBtn = this.buttons.get('redo');
    if (undoBtn) undoBtn.disabled = true;
    if (redoBtn) redoBtn.disabled = true;
  }

  private setupUrlModal(): void {
    this.urlModal = document.getElementById('url-modal');
    this.urlInput = document.getElementById('url-input') as HTMLInputElement;

    const cancelBtn = document.getElementById('url-cancel');
    const confirmBtn = document.getElementById('url-confirm');

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.hideUrlModal());
    }

    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => this.handleUrlConfirm());
    }

    if (this.urlInput) {
      this.urlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.handleUrlConfirm();
        } else if (e.key === 'Escape') {
          this.hideUrlModal();
        }
      });
    }

    if (this.urlModal) {
      this.urlModal.addEventListener('click', (e) => {
        if (e.target === this.urlModal) {
          this.hideUrlModal();
        }
      });
    }
  }

  private setupEventListeners(): void {
    this.buttons.forEach((btn, action) => {
      btn.addEventListener('click', () => this.handleAction(action));
    });

    this.setupTooltips();
  }

  private setupTooltips(): void {
    const tooltip = document.getElementById('tooltip');
    if (!tooltip) return;

    this.buttons.forEach((btn) => {
      btn.addEventListener('mouseenter', (e) => {
        const title = btn.getAttribute('title');
        if (title && tooltip) {
          const rect = btn.getBoundingClientRect();
          tooltip.textContent = title;
          tooltip.style.left = `${rect.left + rect.width / 2}px`;
          tooltip.style.top = `${rect.bottom + 8}px`;
          tooltip.style.transform = 'translateX(-50%)';
          tooltip.classList.add('visible');
        }
      });

      btn.addEventListener('mouseleave', () => {
        tooltip.classList.remove('visible');
      });
    });
  }

  private subscribeToEvents(): void {
    this.engine.eventBus.on('url:load' as EventType, (data: unknown) => {
      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        alert('加载URL失败: ' + (result.error || '未知错误'));
      }
      this.hideUrlModal();
    });
  }

  private handleAction(action: string): void {
    switch (action) {
      case 'addCenter':
        this.handleAddCenter();
        break;
      case 'loadUrl':
        this.showUrlModal();
        break;
      case 'exportJson':
        this.handleExportJson();
        break;
      case 'exportPng':
        this.handleExportPng();
        break;
      case 'undo':
        this.engine.undo();
        break;
      case 'redo':
        this.engine.redo();
        break;
    }
  }

  private handleAddCenter(): void {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    this.engine.addCenterNode(centerX, centerY);
  }

  private showUrlModal(): void {
    if (!this.urlModal) return;
    this.urlModal.classList.add('visible');
    if (this.urlInput) {
      this.urlInput.value = '';
      this.urlInput.focus();
    }
  }

  private hideUrlModal(): void {
    if (!this.urlModal) return;
    this.urlModal.classList.remove('visible');
  }

  private async handleUrlConfirm(): Promise<void> {
    if (!this.urlInput) return;
    const url = this.urlInput.value.trim();
    if (!url) {
      alert('请输入URL');
      return;
    }

    try {
      new URL(url);
    } catch {
      alert('请输入有效的URL');
      return;
    }

    const confirmBtn = document.getElementById('url-confirm') as HTMLButtonElement;
    if (confirmBtn) {
      confirmBtn.textContent = '加载中...';
      confirmBtn.disabled = true;
    }

    try {
      await this.engine.loadFromUrl(url);
    } finally {
      if (confirmBtn) {
        confirmBtn.textContent = '生成导图';
        confirmBtn.disabled = false;
      }
    }
  }

  private handleExportJson(): void {
    const json = this.engine.exportJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindmap-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private handleExportPng(): void {
    const dataUrl = this.engine.exportPng();
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `mindmap-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
