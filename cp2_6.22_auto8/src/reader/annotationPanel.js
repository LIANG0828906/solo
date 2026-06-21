var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { storage } from '../utils/storage';
import { generateId } from '../utils/hash';
import { HIGHLIGHT_COLORS } from '../types';
let AnnotationPanel = class AnnotationPanel extends LitElement {
    constructor() {
        super(...arguments);
        this.isOpen = false;
        this.annotations = [];
        this.selectedColor = 'yellow';
        this.showNoteInput = false;
        this.noteText = '';
        this.selectionData = null;
        this.showToolbar = false;
        this.toolbarPosition = { x: 0, y: 0 };
        this.activeTab = 'all';
        this.isLoading = false;
        this.handleTextSelected = (e) => {
            const { text, rect, chapterId } = e.detail;
            this.selectionData = { text, rect, chapterId };
            this.showToolbar = true;
            this.toolbarPosition = {
                x: rect.left + rect.width / 2 - 120,
                y: rect.top - 50
            };
        };
        this.handleDocumentMouseUp = () => {
            setTimeout(() => {
                const selection = window.getSelection();
                if (!selection || selection.isCollapsed) {
                    this.showToolbar = false;
                    this.selectionData = null;
                }
            }, 100);
        };
    }
    connectedCallback() {
        super.connectedCallback();
        this.loadAnnotations();
        this.setupTextSelectionListener();
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        this.removeTextSelectionListener();
    }
    setupTextSelectionListener() {
        document.addEventListener('text-selected', this.handleTextSelected);
        document.addEventListener('mouseup', this.handleDocumentMouseUp);
    }
    removeTextSelectionListener() {
        document.removeEventListener('text-selected', this.handleTextSelected);
        document.removeEventListener('mouseup', this.handleDocumentMouseUp);
    }
    async loadAnnotations() {
        this.isLoading = true;
        try {
            this.annotations = await storage.getAnnotationsByBook(this.book.id);
        }
        catch (error) {
            console.error('加载笔记失败:', error);
        }
        finally {
            this.isLoading = false;
        }
    }
    handleColorSelect(color) {
        this.selectedColor = color;
        this.createHighlight();
    }
    async createHighlight() {
        if (!this.selectionData)
            return;
        const reader = this.getBookReader();
        let cfi = '';
        if (reader && reader.getSelectionCfi) {
            const selectionInfo = reader.getSelectionCfi();
            if (selectionInfo) {
                cfi = selectionInfo.cfi;
            }
        }
        const annotation = {
            id: generateId(),
            bookId: this.book.id,
            chapterId: this.selectionData.chapterId,
            type: 'highlight',
            color: this.selectedColor,
            text: this.selectionData.text,
            content: '',
            cfi,
            createdAt: new Date()
        };
        await storage.saveAnnotation(annotation);
        this.annotations.unshift(annotation);
        this.applyHighlightToSelection(annotation.id);
        this.clearSelection();
    }
    getBookReader() {
        const reader = document.querySelector('book-reader');
        return reader;
    }
    applyHighlightToSelection(annotationId) {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0)
            return;
        const range = selection.getRangeAt(0);
        const span = document.createElement('span');
        span.className = `highlight-${this.selectedColor}`;
        span.dataset.annotationId = annotationId;
        try {
            range.surroundContents(span);
        }
        catch (e) {
            console.warn('无法高亮部分选区');
        }
    }
    handleNoteClick() {
        this.showNoteInput = true;
        setTimeout(() => {
            this.noteInput?.focus();
        }, 100);
    }
    async saveNote() {
        if (!this.selectionData || !this.noteText.trim())
            return;
        const reader = this.getBookReader();
        let cfi = '';
        if (reader && reader.getSelectionCfi) {
            const selectionInfo = reader.getSelectionCfi();
            if (selectionInfo) {
                cfi = selectionInfo.cfi;
            }
        }
        const annotation = {
            id: generateId(),
            bookId: this.book.id,
            chapterId: this.selectionData.chapterId,
            type: 'note',
            color: this.selectedColor,
            text: this.selectionData.text,
            content: this.noteText.trim(),
            cfi,
            createdAt: new Date()
        };
        await storage.saveAnnotation(annotation);
        this.annotations.unshift(annotation);
        this.applyHighlightToSelection(annotation.id);
        this.closeNoteInput();
        this.clearSelection();
    }
    closeNoteInput() {
        this.showNoteInput = false;
        this.noteText = '';
    }
    clearSelection() {
        window.getSelection()?.removeAllRanges();
        this.showToolbar = false;
        this.selectionData = null;
    }
    async deleteAnnotation(annotation) {
        if (!confirm('确定要删除这条笔记吗？'))
            return;
        await storage.deleteAnnotation(annotation.id);
        this.annotations = this.annotations.filter(a => a.id !== annotation.id);
        const highlightEl = document.querySelector(`[data-annotation-id="${annotation.id}"]`);
        if (highlightEl) {
            const parent = highlightEl.parentNode;
            if (parent) {
                while (highlightEl.firstChild) {
                    parent.insertBefore(highlightEl.firstChild, highlightEl);
                }
                parent.removeChild(highlightEl);
            }
        }
    }
    getChapterTitle(chapterId) {
        const chapter = this.book.chapters.find(c => c.id === chapterId);
        return chapter?.title || '未知章节';
    }
    getFilteredAnnotations() {
        if (this.activeTab === 'all')
            return this.annotations;
        return this.annotations.filter(a => a.type === this.activeTab);
    }
    handleClose() {
        this.dispatchEvent(new CustomEvent('close', {
            bubbles: true,
            composed: true
        }));
    }
    render() {
        const filteredAnnotations = this.getFilteredAnnotations();
        return html `
      ${this.showToolbar && this.selectionData ? html `
        <div 
          class="selection-toolbar" 
          style="left: ${this.toolbarPosition.x}px; top: ${this.toolbarPosition.y}px;"
          @click=${(e) => e.stopPropagation()}
        >
          ${['yellow', 'green', 'blue', 'pink'].map(color => html `
            <button 
              class=${classMap({ 'color-btn': true, active: this.selectedColor === color })}
              style="background-color: ${HIGHLIGHT_COLORS[color]};"
              @click=${() => this.handleColorSelect(color)}
              title=${`${color}高亮`}
            ></button>
          `)}
          <button 
            class="note-btn" 
            @click=${this.handleNoteClick}
            title="添加笔记"
          >
            ✎
          </button>
        </div>
      ` : nothing}

      ${this.showNoteInput && this.selectionData ? html `
        <div class="note-input-modal" @click=${this.closeNoteInput}>
          <div class="note-input-container" @click=${(e) => e.stopPropagation()}>
            <div class="note-input-header">
              <div class="note-input-title">添加笔记</div>
              <button class="close-btn" @click=${this.closeNoteInput}>×</button>
            </div>
            
            <div class="selected-text-preview">
              "${this.selectionData.text}"
            </div>
            
            <div class="color-selector">
              <span class="color-selector-label">高亮颜色：</span>
              ${['yellow', 'green', 'blue', 'pink'].map(color => html `
                <button 
                  class=${classMap({ 'color-btn': true, active: this.selectedColor === color })}
                  style="background-color: ${HIGHLIGHT_COLORS[color]};"
                  @click=${() => this.selectedColor = color}
                ></button>
              `)}
            </div>
            
            <textarea 
              id="note-input" 
              placeholder="输入您的笔记..."
              .value=${this.noteText}
              @input=${(e) => this.noteText = e.target.value}
            ></textarea>
            
            <div class="note-input-actions">
              <button class="btn btn-secondary" @click=${this.closeNoteInput}>
                取消
              </button>
              <button 
                class="btn btn-primary" 
                @click=${this.saveNote}
                ?disabled=${!this.noteText.trim()}
              >
                保存笔记
              </button>
            </div>
          </div>
        </div>
      ` : nothing}

      <div 
        class=${classMap({ 'panel-overlay': true, open: this.isOpen })}
        @click=${this.handleClose}
      ></div>
      
      <aside class=${classMap({ panel: true, open: this.isOpen })}>
        <div class="panel-header">
          <div class="panel-title">
            📝 我的笔记
          </div>
          <button class="close-btn" @click=${this.handleClose}>
            ×
          </button>
        </div>

        <div class="tabs">
          <button 
            class=${classMap({ 'tab-btn': true, active: this.activeTab === 'all' })}
            @click=${() => this.activeTab = 'all'}
          >
            全部 (${this.annotations.length})
          </button>
          <button 
            class=${classMap({ 'tab-btn': true, active: this.activeTab === 'highlight' })}
            @click=${() => this.activeTab = 'highlight'}
          >
            高亮 (${this.annotations.filter(a => a.type === 'highlight').length})
          </button>
          <button 
            class=${classMap({ 'tab-btn': true, active: this.activeTab === 'note' })}
            @click=${() => this.activeTab = 'note'}
          >
            笔记 (${this.annotations.filter(a => a.type === 'note').length})
          </button>
        </div>

        <div class="panel-content">
          ${this.isLoading ? html `
            <div class="loading">
              <div class="spinner"></div>
            </div>
          ` : filteredAnnotations.length === 0 ? html `
            <div class="empty-state">
              <div class="empty-icon">📝</div>
              <div class="empty-text">
                ${this.activeTab === 'all'
            ? '还没有任何笔记或高亮'
            : this.activeTab === 'highlight'
                ? '还没有高亮内容'
                : '还没有笔记内容'}
              </div>
            </div>
          ` : html `
            <div class="annotation-list">
              ${filteredAnnotations.map(annotation => html `
                <div 
                  class="annotation-card" 
                  style="border-left-color: ${HIGHLIGHT_COLORS[annotation.color]};"
                >
                  <div 
                    class="highlight-text"
                    style="background-color: ${HIGHLIGHT_COLORS[annotation.color]}40;"
                  >
                    "${annotation.text}"
                  </div>
                  
                  ${annotation.content ? html `
                    <div class="note-content">
                      ${annotation.content}
                    </div>
                  ` : nothing}
                  
                  <div class="annotation-meta">
                    <span class="annotation-chapter">
                      📖 ${this.getChapterTitle(annotation.chapterId)}
                    </span>
                    <div class="annotation-actions">
                      <button 
                        class="action-btn delete" 
                        @click=${() => this.deleteAnnotation(annotation)}
                        title="删除"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              `)}
            </div>
          `}
        </div>
      </aside>
    `;
    }
};
AnnotationPanel.styles = css `
    :host {
      display: block;
    }

    .selection-toolbar {
      position: fixed;
      z-index: 1000;
      background: var(--walnut);
      border-radius: 12px;
      padding: 6px;
      display: flex;
      gap: 4px;
      box-shadow: var(--shadow-deep);
      animation: fadeInUp 0.2s ease;
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .color-btn {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: 2px solid transparent;
      transition: all 0.2s ease;
    }

    .color-btn:hover {
      transform: scale(1.1);
    }

    .color-btn.active {
      border-color: var(--cream);
      box-shadow: 0 0 0 2px rgba(245, 240, 232, 0.5);
    }

    .note-btn {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: rgba(245, 240, 232, 0.2);
      color: var(--cream);
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .note-btn:hover {
      background: rgba(245, 240, 232, 0.3);
    }

    .panel-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.3);
      z-index: 999;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
    }

    .panel-overlay.open {
      opacity: 1;
      visibility: visible;
    }

    .panel {
      position: fixed;
      top: 0;
      right: 0;
      width: 400px;
      max-width: 90vw;
      height: 100vh;
      background: var(--cream);
      z-index: 1000;
      transform: translateX(100%);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
      box-shadow: -8px 0 32px rgba(0, 0, 0, 0.2);
    }

    .panel.open {
      transform: translateX(0);
    }

    .panel-header {
      padding: 20px 24px;
      background: var(--walnut);
      color: var(--cream);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }

    .panel-title {
      font-family: 'Playfair Display', serif;
      font-size: 20px;
      font-weight: 600;
    }

    .close-btn {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: rgba(245, 240, 232, 0.15);
      color: var(--cream);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      transition: all 0.2s ease;
    }

    .close-btn:hover {
      background: rgba(245, 240, 232, 0.25);
    }

    .tabs {
      display: flex;
      padding: 12px 24px 0;
      gap: 8px;
      border-bottom: 1px solid rgba(139, 94, 60, 0.2);
      flex-shrink: 0;
    }

    .tab-btn {
      padding: 10px 16px;
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      color: var(--walnut);
      font-size: 13px;
      font-weight: 500;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .tab-btn:hover {
      color: var(--walnut-dark);
    }

    .tab-btn.active {
      border-bottom-color: var(--walnut);
      color: var(--walnut-dark);
      font-weight: 600;
    }

    .panel-content {
      flex: 1;
      overflow-y: auto;
      padding: 20px 24px;
    }

    .annotation-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .annotation-card {
      background: white;
      border-radius: 12px;
      padding: 16px;
      box-shadow: var(--shadow-soft);
      transition: all 0.2s ease;
      border-left: 4px solid;
    }

    .annotation-card:hover {
      transform: translateX(-4px);
      box-shadow: var(--shadow-medium);
    }

    .highlight-text {
      font-size: 14px;
      line-height: 1.6;
      padding: 8px 12px;
      border-radius: 6px;
      margin-bottom: 10px;
      font-style: italic;
    }

    .note-content {
      font-size: 14px;
      line-height: 1.6;
      color: var(--ink);
      padding: 10px 12px;
      background: var(--cream-dark);
      border-radius: 8px;
      margin-top: 10px;
    }

    .annotation-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--cream-dark);
    }

    .annotation-chapter {
      font-size: 12px;
      color: var(--walnut);
      font-weight: 500;
    }

    .annotation-actions {
      display: flex;
      gap: 8px;
    }

    .action-btn {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      background: transparent;
      color: var(--walnut);
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .action-btn:hover {
      background: var(--cream-dark);
      color: var(--walnut-dark);
    }

    .action-btn.delete:hover {
      background: #fee2e2;
      color: #dc2626;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: var(--walnut);
    }

    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .empty-text {
      font-size: 14px;
      opacity: 0.7;
    }

    .note-input-modal {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .note-input-container {
      background: var(--cream);
      border-radius: 16px;
      padding: 24px;
      width: 90%;
      max-width: 500px;
      box-shadow: var(--shadow-deep);
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .note-input-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .note-input-title {
      font-family: 'Playfair Display', serif;
      font-size: 18px;
      font-weight: 600;
      color: var(--walnut-dark);
    }

    .selected-text-preview {
      padding: 12px;
      background: var(--cream-dark);
      border-radius: 8px;
      font-size: 13px;
      font-style: italic;
      color: var(--ink);
      margin-bottom: 16px;
      max-height: 100px;
      overflow-y: auto;
    }

    #note-input {
      width: 100%;
      min-height: 120px;
      padding: 12px;
      border: 2px solid var(--walnut-light);
      border-radius: 8px;
      background: white;
      font-family: inherit;
      font-size: 14px;
      line-height: 1.6;
      resize: vertical;
      transition: border-color 0.2s ease;
    }

    #note-input:focus {
      border-color: var(--walnut);
      outline: none;
      box-shadow: 0 0 0 3px rgba(139, 94, 60, 0.1);
    }

    .color-selector {
      display: flex;
      gap: 10px;
      margin-bottom: 16px;
      align-items: center;
    }

    .color-selector-label {
      font-size: 13px;
      font-weight: 500;
      color: var(--walnut-dark);
    }

    .note-input-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 20px;
    }

    .btn {
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.2s ease;
    }

    .btn-secondary {
      background: var(--cream-dark);
      color: var(--walnut-dark);
    }

    .btn-secondary:hover {
      background: #d4ccc0;
    }

    .btn-primary {
      background: var(--walnut);
      color: var(--cream);
    }

    .btn-primary:hover {
      background: var(--walnut-dark);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(139, 94, 60, 0.3);
    }

    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 40px;
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid var(--cream-dark);
      border-top-color: var(--walnut);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .panel {
        width: 100%;
        max-width: 100%;
      }
    }
  `;
__decorate([
    property({ type: Object })
], AnnotationPanel.prototype, "book", void 0);
__decorate([
    property({ type: Boolean })
], AnnotationPanel.prototype, "isOpen", void 0);
__decorate([
    state()
], AnnotationPanel.prototype, "annotations", void 0);
__decorate([
    state()
], AnnotationPanel.prototype, "selectedColor", void 0);
__decorate([
    state()
], AnnotationPanel.prototype, "showNoteInput", void 0);
__decorate([
    state()
], AnnotationPanel.prototype, "noteText", void 0);
__decorate([
    state()
], AnnotationPanel.prototype, "selectionData", void 0);
__decorate([
    state()
], AnnotationPanel.prototype, "showToolbar", void 0);
__decorate([
    state()
], AnnotationPanel.prototype, "toolbarPosition", void 0);
__decorate([
    state()
], AnnotationPanel.prototype, "activeTab", void 0);
__decorate([
    state()
], AnnotationPanel.prototype, "isLoading", void 0);
__decorate([
    query('#note-input')
], AnnotationPanel.prototype, "noteInput", void 0);
AnnotationPanel = __decorate([
    customElement('annotation-panel')
], AnnotationPanel);
export { AnnotationPanel };
