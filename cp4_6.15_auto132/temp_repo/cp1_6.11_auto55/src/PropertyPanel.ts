import { GraphEngine, EventType, COLOR_PALETTE } from './GraphEngine';

export class PropertyPanel {
  private engine: GraphEngine;
  private container: HTMLElement;
  private panelContent: HTMLElement | null = null;
  private emptyPanel: HTMLElement | null = null;
  private nodeProperties: HTMLElement | null = null;
  private colorPalette: HTMLElement | null = null;
  private customColor: HTMLInputElement | null = null;
  private imageUrlInput: HTMLInputElement | null = null;
  private noteInput: HTMLTextAreaElement | null = null;
  private noteCount: HTMLElement | null = null;

  private floatingActionBar: HTMLElement | null = null;
  private notePopup: HTMLElement | null = null;
  private notePopupTextarea: HTMLTextAreaElement | null = null;
  private notePopupCount: HTMLElement | null = null;
  private noteSaveBtn: HTMLElement | null = null;

  private selectedNodeId: string | null = null;
  private hoveredNodeId: string | null = null;
  private hideActionBarTimer: number | null = null;
  private isPanelCollapsed: boolean = false;
  private isMobileOpen: boolean = false;

  constructor(engine: GraphEngine, container: HTMLElement) {
    this.engine = engine;
    this.container = container;
    this.init();
  }

  private init(): void {
    this.setupElements();
    this.buildColorPalette();
    this.setupEventListeners();
    this.subscribeToEvents();
    this.setupResponsive();
  }

  private setupElements(): void {
    this.panelContent = document.getElementById('panel-content');
    this.emptyPanel = document.getElementById('empty-panel');
    this.nodeProperties = document.getElementById('node-properties');
    this.colorPalette = document.getElementById('color-palette');
    this.customColor = document.getElementById('custom-color') as HTMLInputElement;
    this.imageUrlInput = document.getElementById('image-url') as HTMLInputElement;
    this.noteInput = document.getElementById('note-input') as HTMLTextAreaElement;
    this.noteCount = document.getElementById('note-count');

    this.floatingActionBar = document.getElementById('floating-action-bar');
    this.notePopup = document.getElementById('note-popup');
    this.notePopupTextarea = document.getElementById('note-popup-textarea') as HTMLTextAreaElement;
    this.notePopupCount = document.getElementById('note-popup-count');
    this.noteSaveBtn = document.getElementById('note-save-btn');

    const panelToggle = document.getElementById('panel-toggle');
    if (panelToggle) {
      panelToggle.addEventListener('click', () => this.togglePanel());
    }

    const drawerToggle = document.getElementById('drawer-toggle');
    if (drawerToggle) {
      drawerToggle.addEventListener('click', () => this.toggleMobilePanel());
    }
  }

  private buildColorPalette(): void {
    if (!this.colorPalette) return;

    this.colorPalette.innerHTML = '';

    COLOR_PALETTE.forEach((color, index) => {
      const swatch = document.createElement('div');
      swatch.className = 'color-swatch';
      if (color === 'transparent') {
        swatch.classList.add('transparent');
      } else {
        swatch.style.backgroundColor = color;
      }
      swatch.dataset.color = color;
      swatch.dataset.index = String(index);
      swatch.title = color === 'transparent' ? '透明' : color;
      swatch.addEventListener('click', () => this.handleColorSelect(color));
      this.colorPalette!.appendChild(swatch);
    });
  }

  private setupEventListeners(): void {
    if (this.customColor) {
      this.customColor.addEventListener('input', (e) => {
        const color = (e.target as HTMLInputElement).value;
        this.handleColorSelect(color);
      });
    }

    if (this.imageUrlInput) {
      let debounceTimer: number | null = null;
      this.imageUrlInput.addEventListener('input', (e) => {
        const value = (e.target as HTMLInputElement).value;
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = window.setTimeout(() => {
          this.handleImageUrlChange(value);
        }, 500);
      });
    }

    if (this.noteInput) {
      this.noteInput.addEventListener('input', (e) => {
        const value = (e.target as HTMLTextAreaElement).value;
        this.handleNoteChange(value);
      });
    }

    if (this.floatingActionBar) {
      const actionButtons = this.floatingActionBar.querySelectorAll('.action-btn');
      actionButtons.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = btn.getAttribute('data-action');
          this.handleFloatingAction(action);
        });
      });

      this.floatingActionBar.addEventListener('mouseenter', () => {
        if (this.hideActionBarTimer) {
          clearTimeout(this.hideActionBarTimer);
          this.hideActionBarTimer = null;
        }
      });

      this.floatingActionBar.addEventListener('mouseleave', () => {
        this.scheduleHideActionBar();
      });
    }

    if (this.notePopupTextarea) {
      this.notePopupTextarea.addEventListener('input', () => {
        if (this.notePopupCount) {
          this.notePopupCount.textContent = String(this.notePopupTextarea!.value.length);
        }
      });
    }

    if (this.noteSaveBtn) {
      this.noteSaveBtn.addEventListener('click', () => this.saveNotePopup());
    }

    document.addEventListener('click', (e) => {
      if (
        this.notePopup &&
        this.notePopup.classList.contains('visible') &&
        !this.notePopup.contains(e.target as Node)
      ) {
        this.saveNotePopup();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.notePopup && this.notePopup.classList.contains('visible')) {
        this.saveNotePopup();
      }
    });
  }

  private subscribeToEvents(): void {
    this.engine.eventBus.on('node:select' as EventType, (data: unknown) => {
      const nodeId = data as string | null;
      this.handleNodeSelect(nodeId);
    });

    this.engine.eventBus.on('node:update' as EventType, () => {
      if (this.selectedNodeId) {
        this.updateNodeProperties(this.selectedNodeId);
      }
    });

    this.engine.eventBus.on('node:delete' as EventType, (data: unknown) => {
      const deletedId = data as string;
      if (deletedId === this.selectedNodeId) {
        this.handleNodeSelect(null);
      }
      if (deletedId === this.hoveredNodeId) {
        this.hideFloatingActionBar();
      }
    });

    this.engine.eventBus.on('history:undo' as EventType, () => {
      if (this.engine.selectedNodeId) {
        this.handleNodeSelect(this.engine.selectedNodeId);
      } else {
        this.handleNodeSelect(null);
      }
    });

    this.engine.eventBus.on('history:redo' as EventType, () => {
      if (this.engine.selectedNodeId) {
        this.handleNodeSelect(this.engine.selectedNodeId);
      } else {
        this.handleNodeSelect(null);
      }
    });

    this.canvasHoverListener();
  }

  private canvasHoverListener(): void {
    const canvas = document.getElementById('main-canvas');
    if (!canvas) return;

    let showActionBarTimer: number | null = null;

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const nodeId = this.engine.hoveredNodeId;

      if (nodeId && nodeId !== this.hoveredNodeId) {
        this.hoveredNodeId = nodeId;

        if (showActionBarTimer) {
          clearTimeout(showActionBarTimer);
        }

        showActionBarTimer = window.setTimeout(() => {
          this.showFloatingActionBar(nodeId, e.clientX, e.clientY);
        }, 200);
      } else if (!nodeId && this.hoveredNodeId) {
        this.hoveredNodeId = null;
        if (showActionBarTimer) {
          clearTimeout(showActionBarTimer);
          showActionBarTimer = null;
        }
        this.scheduleHideActionBar();
      } else if (nodeId && this.floatingActionBar && this.floatingActionBar.classList.contains('visible')) {
        const node = this.engine.getNode(nodeId);
        if (node) {
          this.updateFloatingActionBarPosition(node, e.clientX, e.clientY);
        }
      }
    });

    canvas.addEventListener('mouseleave', () => {
      this.hoveredNodeId = null;
      if (showActionBarTimer) {
        clearTimeout(showActionBarTimer);
        showActionBarTimer = null;
      }
      this.scheduleHideActionBar();
    });
  }

  private handleNodeSelect(nodeId: string | null): void {
    this.selectedNodeId = nodeId;

    if (!nodeId) {
      this.showEmptyState();
      return;
    }

    this.showNodeProperties();
    this.updateNodeProperties(nodeId);
  }

  private showEmptyState(): void {
    if (this.emptyPanel) {
      this.emptyPanel.style.display = 'flex';
    }
    if (this.nodeProperties) {
      this.nodeProperties.style.display = 'none';
    }
  }

  private showNodeProperties(): void {
    if (this.emptyPanel) {
      this.emptyPanel.style.display = 'none';
    }
    if (this.nodeProperties) {
      this.nodeProperties.style.display = 'block';
    }
  }

  private updateNodeProperties(nodeId: string): void {
    const node = this.engine.getNode(nodeId);
    if (!node) return;

    if (this.colorPalette) {
      const swatches = this.colorPalette.querySelectorAll('.color-swatch');
      swatches.forEach((swatch) => {
        const color = swatch.getAttribute('data-color');
        if (color === node.color) {
          swatch.classList.add('selected');
        } else {
          swatch.classList.remove('selected');
        }
      });
    }

    if (this.customColor && node.color !== 'transparent') {
      this.customColor.value = node.color.startsWith('#') ? node.color : '#FFFFFF';
    }

    if (this.imageUrlInput) {
      this.imageUrlInput.value = node.imageUrl || '';
    }

    if (this.noteInput) {
      this.noteInput.value = node.note || '';
    }

    if (this.noteCount) {
      this.noteCount.textContent = String(node.note?.length || 0);
    }
  }

  private handleColorSelect(color: string): void {
    if (!this.selectedNodeId) return;
    this.engine.updateNodeColor(this.selectedNodeId, color);

    if (this.colorPalette) {
      const swatches = this.colorPalette.querySelectorAll('.color-swatch');
      swatches.forEach((swatch) => {
        const swatchColor = swatch.getAttribute('data-color');
        if (swatchColor === color) {
          swatch.classList.add('selected');
        } else {
          swatch.classList.remove('selected');
        }
      });
    }
  }

  private handleImageUrlChange(url: string): void {
    if (!this.selectedNodeId) return;
    this.engine.updateNodeImage(this.selectedNodeId, url);
  }

  private handleNoteChange(note: string): void {
    if (!this.selectedNodeId) return;
    this.engine.updateNodeNote(this.selectedNodeId, note);

    if (this.noteCount) {
      this.noteCount.textContent = String(note.length);
    }
  }

  private showFloatingActionBar(nodeId: string, clientX: number, clientY: number): void {
    if (!this.floatingActionBar) return;

    const node = this.engine.getNode(nodeId);
    if (!node) return;

    if (this.hideActionBarTimer) {
      clearTimeout(this.hideActionBarTimer);
      this.hideActionBarTimer = null;
    }

    this.floatingActionBar.classList.add('visible');
    this.hoveredNodeId = nodeId;

    this.updateFloatingActionBarPosition(node, clientX, clientY);

    const collapseIcon = document.getElementById('collapse-icon');
    if (collapseIcon && node.children.length > 0) {
      collapseIcon.setAttribute('viewBox', '0 0 24 24');
      if (node.collapsed) {
        collapseIcon.innerHTML = '<polyline points="9 18 15 12 9 6"></polyline>';
      } else {
        collapseIcon.innerHTML = '<polyline points="6 9 12 15 18 9"></polyline>';
      }
    }
  }

  private updateFloatingActionBarPosition(node: { x: number; y: number; width: number; height: number }, clientX: number, clientY: number): void {
    if (!this.floatingActionBar) return;

    const rect = this.floatingActionBar.getBoundingClientRect();
    const canvasRect = document.getElementById('main-canvas')!.getBoundingClientRect();

    const nodeCenterX = canvasRect.left + node.x + node.width / 2;
    const nodeTop = canvasRect.top + node.y;

    let top = nodeTop - 48;
    let left = nodeCenterX - rect.width / 2;

    top = Math.max(80, top);
    left = Math.max(16, Math.min(window.innerWidth - rect.width - 16, left));

    this.floatingActionBar.style.left = `${left}px`;
    this.floatingActionBar.style.top = `${top}px`;
  }

  private scheduleHideActionBar(): void {
    if (this.hideActionBarTimer) {
      clearTimeout(this.hideActionBarTimer);
    }
    this.hideActionBarTimer = window.setTimeout(() => {
      this.hideFloatingActionBar();
    }, 300);
  }

  private hideFloatingActionBar(): void {
    if (this.floatingActionBar) {
      this.floatingActionBar.classList.remove('visible');
    }
    this.hoveredNodeId = null;
    if (this.hideActionBarTimer) {
      clearTimeout(this.hideActionBarTimer);
      this.hideActionBarTimer = null;
    }
  }

  private handleFloatingAction(action: string | null): void {
    const targetNodeId = this.hoveredNodeId || this.selectedNodeId;
    if (!targetNodeId) return;

    switch (action) {
      case 'toggleCollapse':
        this.engine.toggleNodeCollapse(targetNodeId);
        break;
      case 'delete':
        if (confirm('确定要删除此节点及其所有子节点吗？')) {
          this.engine.deleteNode(targetNodeId);
          this.hideFloatingActionBar();
        }
        break;
      case 'addNote':
        this.showNotePopup(targetNodeId);
        break;
    }
  }

  private showNotePopup(nodeId: string): void {
    if (!this.notePopup || !this.notePopupTextarea) return;

    const node = this.engine.getNode(nodeId);
    if (!node) return;

    this.notePopupTextarea.value = node.note || '';
    if (this.notePopupCount) {
      this.notePopupCount.textContent = String(node.note?.length || 0);
    }

    const canvasRect = document.getElementById('main-canvas')!.getBoundingClientRect();
    const popupWidth = 300;
    const popupHeight = 200;

    let left = canvasRect.left + node.x + node.width + 16;
    let top = canvasRect.top + node.y;

    if (left + popupWidth > window.innerWidth) {
      left = canvasRect.left + node.x - popupWidth - 16;
    }
    if (top + popupHeight > window.innerHeight) {
      top = window.innerHeight - popupHeight - 16;
    }
    top = Math.max(80, top);

    this.notePopup.style.left = `${left}px`;
    this.notePopup.style.top = `${top}px`;
    this.notePopup.classList.add('visible');
    this.notePopup.dataset.nodeId = nodeId;

    setTimeout(() => {
      this.notePopupTextarea!.focus();
    }, 50);
  }

  private saveNotePopup(): void {
    if (!this.notePopup || !this.notePopupTextarea) return;

    const nodeId = this.notePopup.dataset.nodeId;
    if (nodeId) {
      this.engine.updateNodeNote(nodeId, this.notePopupTextarea.value);
    }

    this.notePopup.classList.remove('visible');
    delete this.notePopup.dataset.nodeId;
  }

  private togglePanel(): void {
    this.isPanelCollapsed = !this.isPanelCollapsed;
    this.container.classList.toggle('collapsed', this.isPanelCollapsed);
  }

  private toggleMobilePanel(): void {
    this.isMobileOpen = !this.isMobileOpen;
    this.container.classList.toggle('mobile-open', this.isMobileOpen);
  }

  private setupResponsive(): void {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        this.container.classList.remove('mobile-open');
        this.isMobileOpen = false;
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
  }
}
