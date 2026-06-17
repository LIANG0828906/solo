import {
  eventBus,
  EventType,
  CellType,
} from '../eventBus';

const CELL_TYPE_CONFIG: { type: CellType; label: string; color: string; icon: string }[] = [
  { type: 'neuron', label: '神经', color: '#E91E63', icon: '🧠' },
  { type: 'muscle', label: '肌肉', color: '#4CAF50', icon: '💪' },
  { type: 'epithelial', label: '上皮', color: '#2196F3', icon: '🧫' },
];

export class ControlPanel {
  private container: HTMLElement;
  private splitBtn!: HTMLButtonElement;
  private intervalSlider!: HTMLInputElement;
  private intervalLabel!: HTMLSpanElement;
  private typeButtons: HTMLButtonElement[] = [];
  private selectedType: CellType | null = null;
  private timelineContainer!: HTMLDivElement;
  private cellCountLabel!: HTMLSpanElement;
  private selectedCellLabel!: HTMLSpanElement;
  private thumbnails: Map<string, { wrapper: HTMLDivElement; img: HTMLDivElement }> = new Map();
  private pendingThumbnails: string[] = [];
  private recordList: string[] = [];
  private selectedCellId: string | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
    this.listenEvents();
    this.setupResponsive();
  }

  private render(): void {
    this.container.innerHTML = '';
    this.applyPanelStyle();

    this.renderActionSection();
    this.renderDivider();
    this.renderTypeSection();
    this.renderDivider();
    this.renderTimelineSection();
  }

  private applyPanelStyle(): void {
    this.container.style.cssText = `
      background: #1E1E2E;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      color: #e0e0e0;
      font-family: 'Segoe UI', system-ui, sans-serif;
      user-select: none;
      transition: all 0.3s ease;
    `;
  }

  private setupResponsive(): void {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        this.container.style.width = '100%';
        this.container.style.flex = '1 1 auto';
        this.container.style.overflowY = 'auto';
        this.container.style.overflowX = 'hidden';
      } else {
        this.container.style.width = '340px';
        this.container.style.flex = '0 0 340px';
        this.container.style.overflow = 'hidden';
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
  }

  private renderActionSection(): void {
    const section = document.createElement('div');
    section.style.cssText = `
      padding: 20px 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    `;

    const infoRow = document.createElement('div');
    infoRow.style.cssText = `
      width: 100%;
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #888;
    `;
    this.cellCountLabel = document.createElement('span');
    this.cellCountLabel.textContent = '细胞: 1/32';
    this.selectedCellLabel = document.createElement('span');
    this.selectedCellLabel.textContent = '未选中';
    infoRow.appendChild(this.cellCountLabel);
    infoRow.appendChild(this.selectedCellLabel);
    section.appendChild(infoRow);

    this.splitBtn = document.createElement('button');
    this.splitBtn.style.cssText = `
      width: 60px;
      height: 60px;
      border-radius: 50%;
      border: none;
      background: #673AB7;
      color: white;
      font-size: 20px;
      cursor: pointer;
      transition: transform 0.1s ease, box-shadow 0.2s ease, background 0.2s ease;
      box-shadow: 0 4px 12px rgba(103, 58, 183, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      outline: none;
    `;
    this.splitBtn.textContent = '✦';
    this.splitBtn.title = '细胞分裂';

    this.splitBtn.addEventListener('mousedown', () => {
      this.splitBtn.style.transform = 'scale(0.95)';
      this.splitBtn.style.boxShadow = '0 0 20px rgba(149, 117, 205, 0.8), inset 0 0 15px rgba(149, 117, 205, 0.5)';
    });
    this.splitBtn.addEventListener('mouseup', () => {
      this.splitBtn.style.transform = 'scale(1)';
      this.splitBtn.style.boxShadow = '0 4px 12px rgba(103, 58, 183, 0.4)';
    });
    this.splitBtn.addEventListener('mouseleave', () => {
      this.splitBtn.style.transform = 'scale(1)';
      this.splitBtn.style.boxShadow = '0 4px 12px rgba(103, 58, 183, 0.4)';
    });
    this.splitBtn.addEventListener('click', () => {
      eventBus.emit(EventType.SPLIT_REQUESTED);
    });
    section.appendChild(this.splitBtn);

    const intervalRow = document.createElement('div');
    intervalRow.style.cssText = `
      width: 100%;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #aaa;
    `;
    const intervalText = document.createElement('span');
    intervalText.textContent = '间隔:';
    intervalRow.appendChild(intervalText);

    this.intervalSlider = document.createElement('input');
    this.intervalSlider.type = 'range';
    this.intervalSlider.min = '1';
    this.intervalSlider.max = '5';
    this.intervalSlider.step = '0.5';
    this.intervalSlider.value = '2';
    this.intervalSlider.style.cssText = `
      flex: 1;
      accent-color: #673AB7;
      height: 4px;
    `;
    intervalRow.appendChild(this.intervalSlider);

    this.intervalLabel = document.createElement('span');
    this.intervalLabel.textContent = '2.0s';
    this.intervalLabel.style.minWidth = '32px';
    this.intervalLabel.style.textAlign = 'right';
    intervalRow.appendChild(this.intervalLabel);

    this.intervalSlider.addEventListener('input', () => {
      const val = parseFloat(this.intervalSlider.value);
      this.intervalLabel.textContent = val.toFixed(1) + 's';
    });

    section.appendChild(intervalRow);
    this.container.appendChild(section);
  }

  private renderDivider(): void {
    const div = document.createElement('div');
    div.style.cssText = `
      height: 1px;
      background: #3C3C4C;
      margin: 0 16px;
      flex-shrink: 0;
    `;
    this.container.appendChild(div);
  }

  private renderTypeSection(): void {
    const section = document.createElement('div');
    section.style.cssText = `
      padding: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    `;

    const label = document.createElement('div');
    label.textContent = '细胞分化类型';
    label.style.cssText = `font-size: 13px; color: #aaa; margin-bottom: 4px;`;
    section.appendChild(label);

    const btnRow = document.createElement('div');
    btnRow.style.cssText = `
      display: flex;
      gap: 16px;
      align-items: flex-end;
      position: relative;
    `;

    this.typeButtons = [];

    for (const cfg of CELL_TYPE_CONFIG) {
      const wrapper = document.createElement('div');
      wrapper.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        cursor: pointer;
      `;

      const btn = document.createElement('button');
      btn.style.cssText = `
        width: 42px;
        height: 42px;
        border-radius: 50%;
        border: 2px solid ${cfg.color};
        background: transparent;
        color: ${cfg.color};
        font-size: 18px;
        cursor: pointer;
        transition: background 0.2s ease, transform 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        outline: none;
      `;
      btn.textContent = cfg.icon;
      btn.dataset.type = cfg.type;

      btn.addEventListener('mouseenter', () => {
        btn.style.background = cfg.color + '22';
        btn.style.transform = 'scale(1.1)';
      });
      btn.addEventListener('mouseleave', () => {
        if (this.selectedType !== cfg.type) {
          btn.style.background = 'transparent';
          btn.style.transform = 'scale(1)';
        }
      });
      btn.addEventListener('click', () => {
        this.selectType(cfg.type);
      });

      this.typeButtons.push(btn);

      const nameSpan = document.createElement('span');
      nameSpan.textContent = cfg.label;
      nameSpan.style.cssText = `font-size: 11px; color: ${cfg.color};`;

      const indicator = document.createElement('div');
      indicator.className = 'type-indicator';
      indicator.dataset.type = cfg.type;
      indicator.style.cssText = `
        width: 0;
        height: 3px;
        background: ${cfg.color};
        border-radius: 2px;
        transition: width 0.2s ease;
      `;

      wrapper.appendChild(btn);
      wrapper.appendChild(nameSpan);
      wrapper.appendChild(indicator);
      btnRow.appendChild(wrapper);
    }

    section.appendChild(btnRow);
    this.container.appendChild(section);
  }

  private selectType(type: CellType): void {
    if (this.selectedType === type) {
      this.selectedType = null;
    } else {
      this.selectedType = type;
    }

    for (const btn of this.typeButtons) {
      const btnType = btn.dataset.type as CellType;
      const cfg = CELL_TYPE_CONFIG.find(c => c.type === btnType)!;
      const indicator = btn.parentElement!.querySelector('.type-indicator') as HTMLDivElement;

      if (this.selectedType === btnType) {
        btn.style.background = cfg.color + '33';
        btn.style.transform = 'scale(1.1)';
        indicator.style.width = '32px';
      } else {
        btn.style.background = 'transparent';
        btn.style.transform = 'scale(1)';
        indicator.style.width = '0';
      }
    }

    const selectedCellId = this.getSelectedCellId();
    if (selectedCellId && this.selectedType) {
      eventBus.emit(EventType.DIFFERENTIATE_REQUESTED, {
        cellId: selectedCellId,
        cellType: this.selectedType,
      });
    }
  }

  private getSelectedCellId(): string | null {
    return this.selectedCellId;
  }

  private renderTimelineSection(): void {
    const section = document.createElement('div');
    section.style.cssText = `
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 1;
      min-height: 0;
    `;

    const headerRow = document.createElement('div');
    headerRow.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
    `;

    const label = document.createElement('span');
    label.textContent = '时间线';
    label.style.cssText = `font-size: 13px; color: #aaa;`;
    headerRow.appendChild(label);

    const saveBtn = document.createElement('button');
    saveBtn.textContent = '保存';
    saveBtn.style.cssText = `
      padding: 4px 14px;
      border-radius: 6px;
      border: 1px solid #555;
      background: transparent;
      color: #ccc;
      font-size: 12px;
      cursor: pointer;
      transition: background 0.2s ease, border-color 0.2s ease;
    `;
    saveBtn.addEventListener('mouseenter', () => {
      saveBtn.style.background = '#3C3C4C';
      saveBtn.style.borderColor = '#888';
    });
    saveBtn.addEventListener('mouseleave', () => {
      saveBtn.style.background = 'transparent';
      saveBtn.style.borderColor = '#555';
    });
    saveBtn.addEventListener('click', () => {
      eventBus.emit(EventType.RECORD_SAVE_REQUESTED);
    });
    headerRow.appendChild(saveBtn);
    section.appendChild(headerRow);

    this.timelineContainer = document.createElement('div');
    this.timelineContainer.style.cssText = `
      display: flex;
      gap: 8px;
      overflow-x: auto;
      overflow-y: hidden;
      padding: 4px 0;
      min-height: 80px;
      align-items: flex-start;
      flex: 1;
    `;
    this.timelineContainer.style.scrollbarWidth = 'thin';
    this.timelineContainer.style.scrollbarColor = '#555 transparent';

    const placeholder = document.createElement('div');
    placeholder.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      color: #555;
      font-size: 12px;
      min-height: 60px;
    `;
    placeholder.textContent = '暂无记录，点击"保存"记录当前状态';
    placeholder.id = 'timeline-placeholder';
    this.timelineContainer.appendChild(placeholder);

    section.appendChild(this.timelineContainer);
    this.container.appendChild(section);
  }

  private addThumbnailPlaceholder(recordId: string): void {
    const placeholder = this.timelineContainer.querySelector('#timeline-placeholder');
    if (placeholder) {
      placeholder.remove();
    }

    if (this.thumbnails.has(recordId)) {
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      min-width: 80px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      flex-shrink: 0;
    `;
    wrapper.dataset.recordId = recordId;

    const img = document.createElement('div');
    img.style.cssText = `
      width: 60px;
      height: 60px;
      border-radius: 8px;
      background: #2C2C3A;
      border: 2px solid #444;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #555;
      font-size: 20px;
      transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
    `;
    img.textContent = '⏳';

    img.addEventListener('mouseenter', () => {
      img.style.borderColor = '#673AB7';
      img.style.transform = 'scale(1.05)';
      img.style.boxShadow = '0 2px 8px rgba(103, 58, 183, 0.3)';
    });
    img.addEventListener('mouseleave', () => {
      img.style.borderColor = '#444';
      img.style.transform = 'scale(1)';
      img.style.boxShadow = 'none';
    });
    img.addEventListener('click', () => {
      eventBus.emit(EventType.RECORD_RESTORE_REQUESTED, { recordId });
    });

    const indexLabel = document.createElement('span');
    indexLabel.style.cssText = `
      font-size: 10px;
      color: #666;
    `;
    indexLabel.textContent = `#${this.thumbnails.size + 1}`;

    wrapper.appendChild(img);
    wrapper.appendChild(indexLabel);
    this.timelineContainer.appendChild(wrapper);
    this.thumbnails.set(recordId, { wrapper, img });
    this.recordList.push(recordId);

    this.timelineContainer.scrollLeft = this.timelineContainer.scrollWidth;

    if (this.thumbnails.size >= 10) {
      const firstId = this.recordList[0];
      const first = this.thumbnails.get(firstId);
      if (first) {
        first.wrapper.remove();
        this.thumbnails.delete(firstId);
        this.recordList.shift();
        this.updateThumbnailIndexes();
      }
    }
  }

  private updateThumbnailWithImage(recordId: string, thumbnailDataUrl: string): void {
    const entry = this.thumbnails.get(recordId);
    if (!entry) return;

    entry.img.style.backgroundImage = `url(${thumbnailDataUrl})`;
    entry.img.style.backgroundSize = 'cover';
    entry.img.style.backgroundPosition = 'center';
    entry.img.textContent = '';
  }

  private updateThumbnailIndexes(): void {
    let idx = 1;
    for (const recordId of this.recordList) {
      const entry = this.thumbnails.get(recordId);
      if (entry) {
        const label = entry.wrapper.querySelector('span');
        if (label) {
          label.textContent = `#${idx}`;
        }
      }
      idx++;
    }
  }

  private listenEvents(): void {
    eventBus.on(EventType.SPLIT_COMPLETED, (payload) => {
      const data = payload as { cells: { length: number }; splitCount: number };
      this.cellCountLabel.textContent = `细胞: ${data.cells.length}/32`;
    });

    eventBus.on(EventType.CELL_SELECTED, (payload) => {
      const { cellId, cells } = payload as { cellId: string | null; cells: { length: number } };
      this.selectedCellId = cellId;
      this.selectedCellLabel.textContent = cellId ? `已选中: ${cellId.slice(0, 8)}` : '未选中';
      this.cellCountLabel.textContent = `细胞: ${cells.length}/32`;
    });

    eventBus.on(EventType.RECORD_SAVED, (payload) => {
      const p = payload as { recordId: string; record?: unknown };
      if (p.recordId) {
        this.addThumbnailPlaceholder(p.recordId);
      }
    });

    eventBus.on(EventType.THUMBNAIL_READY, (payload) => {
      const p = payload as { recordId: string; thumbnail: string };
      if (p.recordId && p.thumbnail) {
        this.updateThumbnailWithImage(p.recordId, p.thumbnail);
      }
    });

    eventBus.on(EventType.RECORD_RESTORED, (payload) => {
      const data = payload as { cells: { length: number }; splitCount: number };
      this.cellCountLabel.textContent = `细胞: ${data.cells.length}/32`;
      this.selectedCellLabel.textContent = '未选中';
    });

    eventBus.on(EventType.CELL_CREATED, () => {
      this.updateCellCount();
    });

    eventBus.on(EventType.CELL_REMOVED, () => {
      this.updateCellCount();
    });
  }

  private updateCellCount(): void {
    eventBus.emit(EventType.STATE_SNAPSHOT_REQUESTED);
  }

  getSelectedType(): CellType | null {
    return this.selectedType;
  }
}
