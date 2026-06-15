import { SVGElementData } from './types';
import { SVGManager } from './svgManager';
import { eventBus } from './eventBus';

const COLORS = [
  { name: '红', value: '#FF6B6B' },
  { name: '橙', value: '#FFA94D' },
  { name: '黄', value: '#FFD93D' },
  { name: '绿', value: '#6BCB77' },
  { name: '蓝', value: '#4A90D9' },
  { name: '紫', value: '#9B59B6' },
  { name: '白', value: '#FFFFFF' },
  { name: '透明', value: 'transparent' },
];

export class UIPanel {
  private svgManager: SVGManager;
  private selectedIds: Set<string> = new Set();
  private primarySelected: string | null = null;
  private isDragging = false;
  private dragGhost: HTMLElement | null = null;
  private dragStartX = 0;
  private dragStartY = 0;
  private codeUpdateTimer: number | null = null;
  private isUpdatingCode = false;

  private previewGrid: HTMLElement;
  private editSection: HTMLElement;
  private codeEditor: HTMLTextAreaElement;
  private codeHighlight: HTMLElement;
  private copyBtn: HTMLElement;
  private previewSection: HTMLElement;
  private emptyPlaceholder: HTMLElement;
  private codeContainer: HTMLElement;
  private lineNumbers: HTMLElement;

  constructor(svgManager: SVGManager) {
    this.svgManager = svgManager;

    this.previewGrid = document.getElementById('previewGrid')!;
    this.editSection = document.getElementById('editSection')!;
    this.codeEditor = document.getElementById('codeEditor') as HTMLTextAreaElement;
    this.copyBtn = document.getElementById('copyBtn')!;
    this.previewSection = document.getElementById('previewSection')!;
    this.emptyPlaceholder = document.getElementById('emptyPlaceholder')!;
    this.codeContainer = document.getElementById('codeContainer')!;

    this.codeHighlight = document.createElement('pre');
    this.codeHighlight.className = 'code-highlight';
    Object.assign(this.codeHighlight.style, {
      position: 'absolute',
      top: '0',
      left: '48px',
      right: '0',
      bottom: '0',
      margin: '0',
      padding: '12px 16px',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '14px',
      lineHeight: '1.6',
      whiteSpace: 'pre',
      overflow: 'auto',
      pointerEvents: 'none',
      color: '#d4d4d4',
      background: 'transparent',
    });

    this.lineNumbers = document.createElement('div');
    Object.assign(this.lineNumbers.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '44px',
      bottom: '0',
      padding: '12px 8px 12px 0',
      textAlign: 'right',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '14px',
      lineHeight: '1.6',
      color: '#858585',
      background: '#1E1E1E',
      borderRight: '1px solid #333',
      overflow: 'hidden',
      userSelect: 'none',
    });

    this.codeContainer.style.position = 'relative';
    this.codeContainer.insertBefore(this.lineNumbers, this.codeEditor);
    this.codeContainer.insertBefore(this.codeHighlight, this.codeEditor);

    Object.assign(this.codeEditor.style, {
      position: 'absolute',
      top: '0',
      left: '48px',
      right: '0',
      bottom: '0',
      color: 'transparent',
      caretColor: '#d4d4d4',
      background: 'transparent',
      zIndex: '1',
      padding: '12px 16px',
    });

    this.bindEvents();
    this.setupCodeResizer();
  }

  private bindEvents(): void {
    eventBus.on('svg:created', (el: SVGElementData) => this.onSVGCreated(el));
    eventBus.on('svg:updated', (data: { id: string }) => this.onSVGUpdated(data.id));
    eventBus.on('svg:deleted', (id: string) => this.onSVGDeleted(id));
    eventBus.on('svg:grouped', (el: SVGElementData) => this.onSVGCreated(el));
    eventBus.on('svg:ungrouped', (data: { id: string; childIds: string[] }) => this.onSVGUngrouped(data));

    this.codeEditor.addEventListener('input', () => this.onCodeInput());
    this.codeEditor.addEventListener('scroll', () => this.syncScroll());
    this.copyBtn.addEventListener('click', () => this.onCopy());
  }

  private onSVGCreated(el: SVGElementData): void {
    this.renderCardGrid();
    this.selectCard(el.id);
  }

  private onSVGUpdated(id: string): void {
    this.renderCardGrid();
    if (this.primarySelected === id) {
      this.renderEditPanel(id);
      this.renderCodeEditor(id);
    }
  }

  private onSVGDeleted(id: string): void {
    this.selectedIds.delete(id);
    if (this.primarySelected === id) {
      this.primarySelected = this.selectedIds.size > 0
        ? Array.from(this.selectedIds)[this.selectedIds.size - 1]
        : null;
    }
    this.renderCardGrid();
    if (this.primarySelected) {
      this.renderEditPanel(this.primarySelected);
      this.renderCodeEditor(this.primarySelected);
    } else {
      this.editSection.classList.remove('visible');
      this.clearCodeEditor();
    }
  }

  private onSVGUngrouped(data: { id: string; childIds: string[] }): void {
    this.selectedIds.delete(data.id);
    if (this.primarySelected === data.id) {
      this.primarySelected = null;
    }
    this.renderCardGrid();
    this.editSection.classList.remove('visible');
    this.clearCodeEditor();
  }

  renderCardGrid(): void {
    const elements = this.svgManager.getAllElements();
    if (elements.length === 0) {
      this.previewGrid.innerHTML = '';
      this.previewGrid.appendChild(this.emptyPlaceholder);
      this.emptyPlaceholder.style.display = 'block';
      return;
    }
    this.emptyPlaceholder.style.display = 'none';

    const existingCards = this.previewGrid.querySelectorAll('.svg-card');
    const existingIds = new Set<string>();
    existingCards.forEach(card => {
      const id = (card as HTMLElement).dataset.id;
      if (id) existingIds.add(id);
    });

    const currentIds = new Set(elements.map(e => e.id));

    existingCards.forEach(card => {
      const id = (card as HTMLElement).dataset.id;
      if (id && !currentIds.has(id)) {
        card.remove();
      }
    });

    for (const el of elements) {
      let card = this.previewGrid.querySelector(`.svg-card[data-id="${el.id}"]`) as HTMLElement;
      if (!card) {
        card = this.createCard(el);
        this.previewGrid.appendChild(card);
      } else {
        this.updateCardContent(card, el);
      }

      if (this.selectedIds.has(el.id)) {
        card.classList.add('selected');
      } else {
        card.classList.remove('selected');
      }
    }
  }

  private createCard(el: SVGElementData): HTMLElement {
    const card = document.createElement('div');
    card.className = 'svg-card';
    card.dataset.id = el.id;

    const svgContainer = document.createElement('div');
    svgContainer.className = 'card-svg-container';
    Object.assign(svgContainer.style, {
      width: '160px',
      height: '160px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    });
    card.appendChild(svgContainer);

    if (el.isGroup) {
      const badge = document.createElement('div');
      badge.className = 'group-badge';
      badge.textContent = '组';
      card.appendChild(badge);
    }

    const dragHandle = document.createElement('div');
    dragHandle.className = 'drag-handle';
    dragHandle.innerHTML = '<svg viewBox="0 0 20 20" width="20" height="20"><circle cx="5" cy="5" r="2" fill="#999"/><circle cx="15" cy="5" r="2" fill="#999"/><circle cx="5" cy="15" r="2" fill="#999"/><circle cx="15" cy="15" r="2" fill="#999"/></svg>';
    card.appendChild(dragHandle);

    this.updateCardContent(card, el);

    card.addEventListener('click', (e) => this.onCardClick(el.id, e));
    dragHandle.addEventListener('mousedown', (e) => this.onDragStart(e, el.id));

    return card;
  }

  private updateCardContent(card: HTMLElement, el: SVGElementData): void {
    const container = card.querySelector('.card-svg-container') as HTMLElement;
    if (!container) return;

    const svgCode = this.svgManager.generateSVGCode(el);
    const svgEl = this.parseSVGForPreview(svgCode, el);
    container.innerHTML = '';
    container.appendChild(svgEl);
  }

  private parseSVGForPreview(svgCode: string, el: SVGElementData): SVGSVGElement {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgCode, 'image/svg+xml');
    const svgEl = doc.querySelector('svg');

    if (svgEl) {
      svgEl.setAttribute('width', '150');
      svgEl.setAttribute('height', '150');
      svgEl.style.maxWidth = '150px';
      svgEl.style.maxHeight = '150px';
    }

    return (svgEl || document.createElementNS('http://www.w3.org/2000/svg', 'svg')) as SVGSVGElement;
  }

  private onCardClick(id: string, e: MouseEvent): void {
    if (this.isDragging) return;

    if (e.ctrlKey || e.metaKey) {
      if (this.selectedIds.has(id)) {
        this.selectedIds.delete(id);
        if (this.primarySelected === id) {
          this.primarySelected = this.selectedIds.size > 0
            ? Array.from(this.selectedIds)[this.selectedIds.size - 1]
            : null;
        }
      } else {
        this.selectedIds.add(id);
        this.primarySelected = id;
      }
    } else {
      this.selectedIds.clear();
      this.selectedIds.add(id);
      this.primarySelected = id;
    }

    this.renderCardGrid();

    if (this.primarySelected) {
      this.renderEditPanel(this.primarySelected);
      this.renderCodeEditor(this.primarySelected);
      this.editSection.classList.add('visible');
    } else {
      this.editSection.classList.remove('visible');
      this.clearCodeEditor();
    }
  }

  selectCard(id: string): void {
    this.selectedIds.clear();
    this.selectedIds.add(id);
    this.primarySelected = id;
    this.renderCardGrid();
    this.renderEditPanel(id);
    this.renderCodeEditor(id);
    this.editSection.classList.add('visible');

    const card = this.previewGrid.querySelector(`.svg-card[data-id="${id}"]`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }

  private renderEditPanel(id: string): void {
    const el = this.svgManager.getElement(id);
    if (!el) return;

    this.editSection.innerHTML = '';

    const grid = document.createElement('div');
    grid.className = 'edit-grid';

    const scaleField = this.createSliderField('大小', el.scale, 0.5, 3, 0.1, (v) => {
      this.svgManager.updateElement(id, { scale: v });
    }, `×${el.scale.toFixed(1)}`);
    grid.appendChild(scaleField);

    const rotationField = this.createSliderField('旋转', el.rotation, 0, 360, 1, (v) => {
      this.svgManager.updateElement(id, { rotation: v });
    }, `${el.rotation}°`);
    grid.appendChild(rotationField);

    const strokeWidthField = this.createSliderField('线宽', el.strokeWidth, 1, 10, 0.5, (v) => {
      this.svgManager.updateElement(id, { strokeWidth: v });
    }, `${el.strokeWidth}px`);
    grid.appendChild(strokeWidthField);

    const fillField = document.createElement('div');
    fillField.className = 'edit-field';
    fillField.innerHTML = `<label>填充颜色</label>`;
    const palette = document.createElement('div');
    palette.className = 'color-palette';
    for (const c of COLORS) {
      const swatch = document.createElement('div');
      swatch.className = 'color-swatch' + (c.value === 'transparent' ? ' transparent-swatch' : '');
      if (c.value !== 'transparent') {
        swatch.style.background = c.value;
      }
      if (c.value === el.fillColor) {
        swatch.classList.add('selected');
      }
      swatch.addEventListener('click', () => {
        this.svgManager.updateElement(id, { fillColor: c.value });
        this.renderEditPanel(id);
      });
      palette.appendChild(swatch);
    }
    const pickerWrapper = document.createElement('div');
    pickerWrapper.className = 'color-picker-wrapper';
    const picker = document.createElement('input');
    picker.type = 'color';
    picker.value = el.fillColor === 'transparent' ? '#000000' : el.fillColor;
    picker.addEventListener('input', (e) => {
      this.svgManager.updateElement(id, { fillColor: (e.target as HTMLInputElement).value });
    });
    pickerWrapper.appendChild(picker);
    palette.appendChild(pickerWrapper);
    fillField.appendChild(palette);
    grid.appendChild(fillField);

    const strokeField = document.createElement('div');
    strokeField.className = 'edit-field';
    strokeField.innerHTML = `<label>描边颜色</label>`;
    const strokePalette = document.createElement('div');
    strokePalette.className = 'color-palette';
    for (const c of COLORS) {
      const swatch = document.createElement('div');
      swatch.className = 'color-swatch' + (c.value === 'transparent' ? ' transparent-swatch' : '');
      if (c.value !== 'transparent') {
        swatch.style.background = c.value;
      }
      if (c.value === el.strokeColor) {
        swatch.classList.add('selected');
      }
      swatch.addEventListener('click', () => {
        this.svgManager.updateElement(id, { strokeColor: c.value });
        this.renderEditPanel(id);
      });
      strokePalette.appendChild(swatch);
    }
    const strokePickerWrapper = document.createElement('div');
    strokePickerWrapper.className = 'color-picker-wrapper';
    const strokePicker = document.createElement('input');
    strokePicker.type = 'color';
    strokePicker.value = el.strokeColor === 'transparent' ? '#000000' : el.strokeColor;
    strokePicker.addEventListener('input', (e) => {
      this.svgManager.updateElement(id, { strokeColor: (e.target as HTMLInputElement).value });
    });
    strokePickerWrapper.appendChild(strokePicker);
    strokePalette.appendChild(strokePickerWrapper);
    strokeField.appendChild(strokePalette);
    grid.appendChild(strokeField);

    if (this.selectedIds.size > 1) {
      const groupBtn = document.createElement('button');
      groupBtn.textContent = `组合选中的 ${this.selectedIds.size} 个图形`;
      Object.assign(groupBtn.style, {
        gridColumn: '1 / -1',
        padding: '8px 16px',
        borderRadius: '8px',
        border: 'none',
        background: '#8B7355',
        color: 'white',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: '500',
        transition: 'all 0.2s ease-in-out',
      });
      groupBtn.addEventListener('mouseenter', () => {
        groupBtn.style.background = '#746248';
        groupBtn.style.transform = 'translateY(-2px)';
      });
      groupBtn.addEventListener('mouseleave', () => {
        groupBtn.style.background = '#8B7355';
        groupBtn.style.transform = 'translateY(0)';
      });
      groupBtn.addEventListener('click', () => {
        this.svgManager.groupElements(Array.from(this.selectedIds));
      });
      grid.appendChild(groupBtn);
    }

    if (el.isGroup) {
      const ungroupBtn = document.createElement('button');
      ungroupBtn.textContent = '取消组合';
      Object.assign(ungroupBtn.style, {
        gridColumn: '1 / -1',
        padding: '8px 16px',
        borderRadius: '8px',
        border: '1px solid #8B7355',
        background: 'transparent',
        color: '#8B7355',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: '500',
        transition: 'all 0.2s ease-in-out',
      });
      ungroupBtn.addEventListener('mouseenter', () => {
        ungroupBtn.style.background = '#8B7355';
        ungroupBtn.style.color = 'white';
        ungroupBtn.style.transform = 'translateY(-2px)';
      });
      ungroupBtn.addEventListener('mouseleave', () => {
        ungroupBtn.style.background = 'transparent';
        ungroupBtn.style.color = '#8B7355';
        ungroupBtn.style.transform = 'translateY(0)';
      });
      ungroupBtn.addEventListener('click', () => {
        this.svgManager.ungroupElement(id);
      });
      grid.appendChild(ungroupBtn);
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '删除图形';
    Object.assign(deleteBtn.style, {
      gridColumn: '1 / -1',
      padding: '8px 16px',
      borderRadius: '8px',
      border: '1px solid #FF6B6B',
      background: 'transparent',
      color: '#FF6B6B',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '500',
      transition: 'all 0.2s ease-in-out',
    });
    deleteBtn.addEventListener('mouseenter', () => {
      deleteBtn.style.background = '#FF6B6B';
      deleteBtn.style.color = 'white';
      deleteBtn.style.transform = 'translateY(-2px)';
    });
    deleteBtn.addEventListener('mouseleave', () => {
      deleteBtn.style.background = 'transparent';
      deleteBtn.style.color = '#FF6B6B';
      deleteBtn.style.transform = 'translateY(0)';
    });
    deleteBtn.addEventListener('click', () => {
      this.svgManager.removeElement(id);
    });
    grid.appendChild(deleteBtn);

    this.editSection.appendChild(grid);
  }

  private createSliderField(
    label: string,
    value: number,
    min: number,
    max: number,
    step: number,
    onChange: (v: number) => void,
    displayText?: string
  ): HTMLElement {
    const field = document.createElement('div');
    field.className = 'edit-field';

    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    field.appendChild(labelEl);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = String(min);
    slider.max = String(max);
    slider.step = String(step);
    slider.value = String(value);
    field.appendChild(slider);

    const valueDisplay = document.createElement('div');
    valueDisplay.className = 'value-display';
    valueDisplay.textContent = displayText || String(value);
    field.appendChild(valueDisplay);

    slider.addEventListener('input', () => {
      const v = parseFloat(slider.value);
      valueDisplay.textContent = label === '旋转' ? `${v}°` : label === '大小' ? `×${v.toFixed(1)}` : label === '线宽' ? `${v}px` : String(v);
      onChange(v);
    });

    return field;
  }

  renderCodeEditor(id: string): void {
    const el = this.svgManager.getElement(id);
    if (!el) return;

    this.isUpdatingCode = true;
    const code = this.svgManager.generateSVGCode(el);
    this.codeEditor.readOnly = false;
    this.codeEditor.value = code;
    this.isUpdatingCode = false;

    this.updateHighlight(code);
    this.updateLineNumbers(code);
  }

  private clearCodeEditor(): void {
    this.isUpdatingCode = true;
    this.codeEditor.value = '';
    this.codeEditor.readOnly = true;
    this.isUpdatingCode = false;
    this.codeHighlight.innerHTML = '';
    this.lineNumbers.innerHTML = '';
  }

  private onCodeInput(): void {
    if (this.isUpdatingCode || !this.primarySelected) return;

    const code = this.codeEditor.value;
    this.updateHighlight(code);
    this.updateLineNumbers(code);

    if (this.codeUpdateTimer !== null) {
      clearTimeout(this.codeUpdateTimer);
    }
    this.codeUpdateTimer = window.setTimeout(() => {
      this.applyCodeChanges(code);
    }, 50);
  }

  private applyCodeChanges(code: string): void {
    if (!this.primarySelected) return;
    const parsed = this.svgManager.parseSVGCode(code);
    if (parsed) {
      this.svgManager.updateElement(this.primarySelected, parsed);
    }
  }

  private updateHighlight(code: string): void {
    const highlighted = this.highlightSVG(code);
    this.codeHighlight.innerHTML = highlighted;
  }

  private highlightSVG(code: string): string {
    return code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/(&lt;\/?)([\w-]+)/g, '$1<span style="color:#569CD6">$2</span>')
      .replace(/([\w-]+)(=)/g, '<span style="color:#9CDCFE">$1</span>$2')
      .replace(/(".*?")/g, '<span style="color:#CE9178">$1</span>')
      .replace(/(&lt;\/?|\/?&gt;|&lt;)/g, '<span style="color:#808080">$1</span>');
  }

  private updateLineNumbers(code: string): void {
    const lines = code.split('\n');
    this.lineNumbers.innerHTML = lines.map((_, i) => `<div>${i + 1}</div>`).join('');
  }

  private syncScroll(): void {
    this.codeHighlight.scrollTop = this.codeEditor.scrollTop;
    this.codeHighlight.scrollLeft = this.codeEditor.scrollLeft;
    this.lineNumbers.scrollTop = this.codeEditor.scrollTop;
  }

  private onCopy(): void {
    const code = this.codeEditor.value;
    if (!code) return;

    navigator.clipboard.writeText(code).then(() => {
      this.copyBtn.classList.add('copied');
      setTimeout(() => {
        this.copyBtn.classList.remove('copied');
      }, 500);
    });
  }

  private onDragStart(e: MouseEvent, id: string): void {
    e.preventDefault();
    e.stopPropagation();

    const dragIds = this.selectedIds.has(id)
      ? Array.from(this.selectedIds)
      : [id];

    this.isDragging = false;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - this.dragStartX;
      const dy = ev.clientY - this.dragStartY;

      if (!this.isDragging && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        this.isDragging = true;
        this.startDragGhost(dragIds);
        this.markCardsDragging(dragIds, true);
      }

      if (this.isDragging && this.dragGhost) {
        this.dragGhost.style.left = `${ev.clientX}px`;
        this.dragGhost.style.top = `${ev.clientY}px`;
      }
    };

    const onUp = (ev: MouseEvent) => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);

      if (this.isDragging) {
        this.markCardsDragging(dragIds, false);
        this.removeDragGhost();

        const target = document.elementFromPoint(ev.clientX, ev.clientY);
        const targetCard = target?.closest('.svg-card') as HTMLElement | null;
        const targetId = targetCard?.dataset.id;

        if (targetId && !dragIds.includes(targetId)) {
          this.svgManager.groupElements([...dragIds, targetId]);
        } else if (dragIds.length > 1) {
          this.svgManager.groupElements(dragIds);
        }
      }

      setTimeout(() => {
        this.isDragging = false;
      }, 50);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  private startDragGhost(ids: string[]): void {
    this.dragGhost = document.createElement('div');
    this.dragGhost.className = 'ghost-drag';
    Object.assign(this.dragGhost.style, {
      display: 'flex',
      gap: '8px',
      padding: '8px',
      background: '#FAF7F2',
      borderRadius: '12px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
    });

    for (const id of ids) {
      const el = this.svgManager.getElement(id);
      if (!el) continue;
      const miniCard = document.createElement('div');
      Object.assign(miniCard.style, {
        width: '80px',
        height: '80px',
        background: 'white',
        borderRadius: '8px',
        border: '1px solid #E0E0E0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      });

      const svgCode = this.svgManager.generateSVGCode(el);
      const svgEl = this.parseSVGForPreview(svgCode, el);
      svgEl.setAttribute('width', '70');
      svgEl.setAttribute('height', '70');
      miniCard.appendChild(svgEl);
      this.dragGhost.appendChild(miniCard);
    }

    document.body.appendChild(this.dragGhost);
  }

  private removeDragGhost(): void {
    if (this.dragGhost) {
      this.dragGhost.remove();
      this.dragGhost = null;
    }
  }

  private markCardsDragging(ids: string[], dragging: boolean): void {
    for (const id of ids) {
      const card = this.previewGrid.querySelector(`.svg-card[data-id="${id}"]`);
      if (card) {
        if (dragging) {
          card.classList.add('dragging');
        } else {
          card.classList.remove('dragging');
        }
      }
    }
  }

  private setupCodeResizer(): void {
    const resizer = document.getElementById('codeResizer')!;
    const codeSection = this.codeContainer.parentElement!;

    let startY = 0;
    let startHeight = 0;

    const onMouseDown = (e: MouseEvent) => {
      startY = e.clientY;
      startHeight = this.codeContainer.offsetHeight;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      e.preventDefault();
    };

    const onMouseMove = (e: MouseEvent) => {
      const dy = startY - e.clientY;
      const newHeight = Math.max(150, Math.min(400, startHeight + dy));
      this.codeContainer.style.height = `${newHeight}px`;
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    resizer.addEventListener('mousedown', onMouseDown);
  }

  getSelectedIds(): Set<string> {
    return this.selectedIds;
  }

  clearSelection(): void {
    this.selectedIds.clear();
    this.primarySelected = null;
    this.renderCardGrid();
    this.editSection.classList.remove('visible');
    this.clearCodeEditor();
  }
}
