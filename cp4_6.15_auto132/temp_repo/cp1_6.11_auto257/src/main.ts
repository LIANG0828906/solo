import { AppState, Annotation } from './types';
import { BookManager } from './bookManager';
import { AnnotationManager } from './annotationManager';
import { Renderer } from './renderer';

class AncientStudyApp {
  private bookManager: BookManager;
  private annotationManager: AnnotationManager;
  private renderer: Renderer;
  private state: AppState;
  private canvas: HTMLCanvasElement;
  private searchInput: HTMLInputElement;
  private annotationList: HTMLElement;
  private annotationModal: HTMLElement;
  private annotationText: HTMLTextAreaElement;
  private tooltip: HTMLElement;
  private backBtn: HTMLElement;
  private sidebarToggle: HTMLElement;
  private sidebar: HTMLElement;
  private charCurrent: HTMLElement;

  constructor() {
    this.canvas = document.getElementById('main-canvas') as HTMLCanvasElement;
    this.searchInput = document.getElementById('search-input') as HTMLInputElement;
    this.annotationList = document.getElementById('annotation-list') as HTMLElement;
    this.annotationModal = document.getElementById('annotation-modal') as HTMLElement;
    this.annotationText = document.getElementById('annotation-text') as HTMLTextAreaElement;
    this.tooltip = document.getElementById('tooltip') as HTMLElement;
    this.backBtn = document.getElementById('back-btn') as HTMLElement;
    this.sidebarToggle = document.getElementById('sidebar-toggle') as HTMLElement;
    this.sidebar = document.getElementById('sidebar') as HTMLElement;
    this.charCurrent = document.getElementById('char-current') as HTMLElement;

    this.state = {
      currentView: 'shelf',
      activeBookId: null,
      searchQuery: '',
      highlightedAnnotationId: null,
      hoveredBookId: null,
      hoveredAnnotationId: null,
      matchedBookIds: new Set(),
      matchedAnnotationIds: new Set(),
    };

    this.bookManager = new BookManager();
    this.annotationManager = new AnnotationManager();
    this.renderer = new Renderer(this.canvas, this.bookManager, this.annotationManager, this.state);

    this.initialize();
  }

  private initialize(): void {
    this.setupRendererCallbacks();
    this.setupEventListeners();
    this.updateAnnotationList();
    this.renderer.start();

    this.annotationManager.setOnChangeCallback(() => {
      this.updateAnnotationList();
    });

    window.addEventListener('resize', () => {
      this.renderer.resize();
    });

    console.log('古籍书斋系统已启动');
    console.log('预置书籍数量:', this.bookManager.getBooksCount());
    console.log('批注数量:', this.annotationManager.getAnnotationsCount());
  }

  private setupRendererCallbacks(): void {
    this.renderer.setOnBookClick((bookId: string) => {
      this.openBook(bookId);
    });

    this.renderer.setOnAnnotationRequest((bookId: string, charIndex: number, position) => {
      this.showAnnotationModal(bookId, charIndex, position);
    });

    this.renderer.setOnAnnotationHover((annotation: Annotation | null) => {
      if (annotation) {
        this.showTooltip(annotation.content);
      } else {
        this.hideTooltip();
      }
    });
  }

  private setupEventListeners(): void {
    this.searchInput.addEventListener('input', this.handleSearch.bind(this));

    document.getElementById('submit-annotation')?.addEventListener('click', () => {
      this.submitAnnotation();
    });

    document.getElementById('cancel-annotation')?.addEventListener('click', () => {
      this.hideAnnotationModal();
    });

    this.annotationText.addEventListener('input', () => {
      this.charCurrent.textContent = this.annotationText.value.length.toString();
    });

    this.backBtn.addEventListener('click', () => {
      this.closeCurrentBook();
    });

    this.sidebarToggle.addEventListener('click', () => {
      this.sidebar.classList.toggle('open');
    });

    this.annotationModal.addEventListener('click', (e) => {
      if (e.target === this.annotationModal) {
        this.hideAnnotationModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.annotationModal.style.display === 'block') {
          this.hideAnnotationModal();
        } else if (this.state.currentView === 'reading') {
          this.closeCurrentBook();
        }
      }
    });
  }

  private handleSearch(): void {
    const query = this.searchInput.value.trim();
    this.state.searchQuery = query;

    const bookResult = this.bookManager.search(query);
    const annResult = this.annotationManager.search(query);

    this.state.matchedBookIds = new Set([...bookResult.bookIds, ...annResult.bookIds]);
    this.state.matchedAnnotationIds = annResult.annotationIds;

    if (query && this.state.matchedBookIds.size > 0) {
      this.bookManager.startBlinkAnimation(this.state.matchedBookIds);
    }

    this.renderer.setState({
      searchQuery: query,
      matchedBookIds: this.state.matchedBookIds,
      matchedAnnotationIds: this.state.matchedAnnotationIds,
    });

    this.updateAnnotationList();
  }

  private openBook(bookId: string): void {
    if (this.state.currentView === 'reading' && this.state.activeBookId === bookId) {
      return;
    }

    if (this.state.activeBookId) {
      this.bookManager.closeBook(this.state.activeBookId);
    }

    this.bookManager.openBook(bookId);
    this.state.activeBookId = bookId;
    this.state.currentView = 'reading';
    this.state.highlightedAnnotationId = null;

    this.renderer.setState({
      currentView: 'reading',
      activeBookId: bookId,
      highlightedAnnotationId: null,
    });

    this.backBtn.style.display = 'block';
    this.searchInput.disabled = true;
    this.searchInput.style.opacity = '0.5';
  }

  private closeCurrentBook(): void {
    if (!this.state.activeBookId) return;

    this.bookManager.closeBook(this.state.activeBookId);
    this.state.highlightedAnnotationId = null;

    this.renderer.setState({
      highlightedAnnotationId: null,
    });

    this.backBtn.style.display = 'none';
    this.searchInput.disabled = false;
    this.searchInput.style.opacity = '1';

    setTimeout(() => {
      this.state.activeBookId = null;
      this.state.currentView = 'shelf';
      this.renderer.setState({
        currentView: 'shelf',
        activeBookId: null,
      });
    }, 300);
  }

  private showAnnotationModal(bookId: string, charIndex: number, position: { x: number; y: number }): void {
    const existingAnn = this.annotationManager.getAnnotationAt(bookId, charIndex);
    this.annotationText.value = existingAnn ? existingAnn.content : '';
    this.charCurrent.textContent = this.annotationText.value.length.toString();

    const canvasRect = this.canvas.getBoundingClientRect();
    let modalX = position.x + canvasRect.left + 20;
    let modalY = position.y + canvasRect.top + 20;

    const modalWidth = 300;
    const modalHeight = 200;
    
    if (modalX + modalWidth > window.innerWidth) {
      modalX = position.x + canvasRect.left - modalWidth - 20;
    }
    if (modalY + modalHeight > window.innerHeight) {
      modalY = window.innerHeight - modalHeight - 20;
    }

    this.annotationModal.style.left = modalX + 'px';
    this.annotationModal.style.top = modalY + 'px';
    this.annotationModal.style.display = 'block';

    setTimeout(() => {
      this.annotationText.focus();
    }, 100);
  }

  private hideAnnotationModal(): void {
    this.annotationModal.style.display = 'none';
    this.annotationText.value = '';
    this.renderer.clearPendingAnnotation();
  }

  private submitAnnotation(): void {
    const pending = this.renderer.getPendingAnnotation();
    if (!pending) {
      this.hideAnnotationModal();
      return;
    }

    const content = this.annotationText.value.trim();
    if (content.length === 0 || content.length > 200) {
      return;
    }

    const existing = this.annotationManager.getAnnotationAt(pending.bookId, pending.charIndex);
    if (existing) {
      this.annotationManager.deleteAnnotation(existing.id);
    }

    this.annotationManager.addAnnotation(pending.bookId, pending.charIndex, content);
    this.hideAnnotationModal();
  }

  private updateAnnotationList(): void {
    const annotations = this.annotationManager.getAllAnnotations();
    const query = this.state.searchQuery.toLowerCase();

    let filteredAnnotations = annotations;
    if (query) {
      filteredAnnotations = annotations.filter(ann => 
        ann.content.toLowerCase().includes(query)
      );
    }

    if (filteredAnnotations.length === 0) {
      this.annotationList.innerHTML = '<div class="no-annotations">暂无批注</div>';
      return;
    }

    const html = filteredAnnotations.map(ann => {
      const book = this.bookManager.getBookById(ann.bookId);
      const bookTitle = book?.title || '未知书籍';
      const preview = ann.content.substring(0, 10) + (ann.content.length > 10 ? '...' : '');
      const isHighlighted = this.state.highlightedAnnotationId === ann.id;
      
      return `
        <div class="annotation-item" data-id="${ann.id}" style="${isHighlighted ? 'border-left-color: #C04000; background: rgba(255,248,220,0.9);' : ''}">
          <div class="annotation-book">《${bookTitle}》</div>
          <div class="annotation-preview">${this.escapeHtml(preview)}</div>
        </div>
      `;
    }).join('');

    this.annotationList.innerHTML = html;

    this.annotationList.querySelectorAll('.annotation-item').forEach(item => {
      item.addEventListener('click', () => {
        const annId = item.getAttribute('data-id');
        if (annId) {
          this.jumpToAnnotation(annId);
        }
      });
    });
  }

  private jumpToAnnotation(annotationId: string): void {
    const annotation = this.annotationManager.getAnnotationById(annotationId);
    if (!annotation) return;

    if (this.state.currentView !== 'reading' || this.state.activeBookId !== annotation.bookId) {
      this.openBook(annotation.bookId);
    }

    this.state.highlightedAnnotationId = annotationId;
    this.renderer.setState({
      highlightedAnnotationId: annotationId,
    });

    this.updateAnnotationList();

    setTimeout(() => {
      this.state.highlightedAnnotationId = null;
      this.renderer.setState({
        highlightedAnnotationId: null,
      });
      this.updateAnnotationList();
    }, 3000);
  }

  private showTooltip(content: string): void {
    this.tooltip.textContent = content;
    this.tooltip.style.display = 'block';

    document.addEventListener('mousemove', this.handleTooltipMove.bind(this), { once: true });
  }

  private handleTooltipMove(e: MouseEvent): void {
    const tooltipWidth = this.tooltip.offsetWidth;
    const tooltipHeight = this.tooltip.offsetHeight;
    
    let x = e.clientX + 15;
    let y = e.clientY + 15;

    if (x + tooltipWidth > window.innerWidth) {
      x = e.clientX - tooltipWidth - 15;
    }
    if (y + tooltipHeight > window.innerHeight) {
      y = e.clientY - tooltipHeight - 15;
    }

    this.tooltip.style.left = x + 'px';
    this.tooltip.style.top = y + 'px';

    if (this.state.hoveredAnnotationId) {
      document.addEventListener('mousemove', this.handleTooltipMove.bind(this), { once: true });
    }
  }

  private hideTooltip(): void {
    this.tooltip.style.display = 'none';
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new AncientStudyApp();
});
