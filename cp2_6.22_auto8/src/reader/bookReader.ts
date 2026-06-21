import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { bookManager } from '../library/bookManager';
import { storage } from '../utils/storage';
import type { Book, Chapter, ThemeType, Annotation } from '../types';
import { THEMES } from '../types';
import { resolveEpubResourcePath, resourceToDataUrl, getRangeFromCfi, generateCfiFromRange } from '../utils/epubUtils';

@customElement('book-reader')
export class BookReader extends LitElement {
  @property({ type: Object }) book!: Book;
  
  @state() private currentChapterId: string = '';
  @state() private scrollPosition: number = 0;
  @state() private fontSize: number = 16;
  @state() private theme: ThemeType = 'light';
  @state() private content: string = '';
  @state() private isLoading: boolean = true;
  @state() private showSettings: boolean = false;
  @state() private showToc: boolean = true;
  @state() private pdfPageNum: number = 1;
  @state() private pdfTotalPages: number = 0;
  @state() private isTransitioning: boolean = false;
  
  @query('.content-area') private contentArea!: HTMLElement;
  @query('#pdf-canvas') private pdfCanvas!: HTMLCanvasElement;
  
  private epubBook: any = null;
  private pdfDoc: any = null;
  private epubRendition: any = null;
  private autoSaveTimer: number | null = null;
  private debounceTimer: number | null = null;
  private readonly AUTO_SAVE_INTERVAL = 10000;
  private readonly DEBOUNCE_DELAY = 500;
  
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100%;
      position: fixed;
      top: 0;
      left: 0;
      z-index: 200;
    }

    .reader-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 24px;
      background: rgba(139, 94, 60, 0.95);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(245, 240, 232, 0.2);
      flex-shrink: 0;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .back-btn {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: rgba(245, 240, 232, 0.15);
      color: var(--cream);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      transition: all 0.2s ease;
    }

    .back-btn:hover {
      background: rgba(245, 240, 232, 0.25);
      transform: scale(1.05);
    }

    .back-btn:active {
      transform: scale(0.95);
    }

    .book-info {
      color: var(--cream);
    }

    .book-title {
      font-family: 'Playfair Display', serif;
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 2px;
    }

    .book-author {
      font-size: 13px;
      opacity: 0.8;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .header-btn {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: rgba(245, 240, 232, 0.15);
      color: var(--cream);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      transition: all 0.2s ease;
      position: relative;
    }

    .header-btn:hover {
      background: rgba(245, 240, 232, 0.25);
    }

    .header-btn.active {
      background: var(--cream);
      color: var(--walnut);
    }

    .reader-main {
      display: flex;
      flex: 1;
      overflow: hidden;
      transition: background-color 0.3s ease;
    }

    .toc-panel {
      width: 280px;
      flex-shrink: 0;
      background: rgba(245, 240, 232, 0.95);
      border-right: 1px solid rgba(139, 94, 60, 0.2);
      overflow-y: auto;
      transition: transform 0.3s ease;
    }

    .toc-panel.collapsed {
      transform: translateX(-100%);
      width: 0;
    }

    .toc-header {
      padding: 20px 24px 16px;
      border-bottom: 1px solid rgba(139, 94, 60, 0.2);
      position: sticky;
      top: 0;
      background: inherit;
      backdrop-filter: blur(10px);
    }

    .toc-title {
      font-family: 'Playfair Display', serif;
      font-size: 18px;
      font-weight: 600;
      color: var(--walnut-dark);
    }

    .toc-list {
      padding: 8px 0;
    }

    .toc-item {
      padding: 12px 24px;
      cursor: pointer;
      transition: all 0.2s ease;
      border-left: 3px solid transparent;
      font-size: 14px;
      color: var(--ink);
      line-height: 1.5;
    }

    .toc-item:hover {
      background: rgba(139, 94, 60, 0.1);
      border-left-color: var(--walnut-light);
    }

    .toc-item.active {
      background: rgba(139, 94, 60, 0.15);
      border-left-color: var(--walnut);
      font-weight: 600;
      color: var(--walnut-dark);
    }

    .content-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: relative;
    }

    .content-area {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 40px 60px;
      line-height: 1.8;
      transition: all 0.3s ease;
    }

    .content-area.slide-in {
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    .chapter-title {
      font-family: 'Playfair Display', serif;
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid rgba(139, 94, 60, 0.3);
    }

    .epub-content {
      font-size: var(--font-size, 16px);
      line-height: 1.8;
    }

    .epub-content :deep(p) {
      margin-bottom: 1em;
      text-indent: 2em;
    }

    .epub-content :deep(h1),
    .epub-content :deep(h2),
    .epub-content :deep(h3) {
      font-family: 'Playfair Display', serif;
      margin: 1.5em 0 0.8em;
    }

    .epub-content :deep(img) {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 1em 0;
    }

    #pdf-canvas {
      display: block;
      margin: 0 auto;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      border-radius: 4px;
    }

    .pdf-controls {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: rgba(0, 0, 0, 0.05);
      border-radius: 12px;
      margin-top: 20px;
    }

    .pdf-controls button {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: var(--walnut);
      color: var(--cream);
      font-size: 18px;
      transition: all 0.2s ease;
    }

    .pdf-controls button:hover:not(:disabled) {
      background: var(--walnut-dark);
      transform: translateY(-2px);
    }

    .pdf-controls button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .pdf-page-info {
      font-size: 15px;
      font-weight: 600;
      color: var(--walnut-dark);
      min-width: 100px;
      text-align: center;
    }

    .settings-panel {
      position: absolute;
      top: 60px;
      right: 20px;
      background: var(--cream);
      border-radius: 16px;
      box-shadow: var(--shadow-deep);
      padding: 20px;
      min-width: 280px;
      z-index: 10;
      animation: fadeInDown 0.2s ease;
    }

    @keyframes fadeInDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .settings-section {
      margin-bottom: 20px;
    }

    .settings-section:last-child {
      margin-bottom: 0;
    }

    .settings-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--walnut-dark);
      margin-bottom: 10px;
      display: block;
    }

    .font-size-control {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .font-size-btn {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: var(--cream-dark);
      color: var(--walnut-dark);
      font-size: 16px;
      font-weight: 600;
      transition: all 0.2s ease;
    }

    .font-size-btn:hover {
      background: var(--walnut);
      color: var(--cream);
    }

    .font-size-value {
      min-width: 50px;
      text-align: center;
      font-size: 14px;
      font-weight: 600;
      color: var(--ink);
    }

    .theme-options {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }

    .theme-btn {
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.2s ease;
      border: 2px solid transparent;
    }

    .theme-btn:hover {
      transform: translateY(-2px);
    }

    .theme-btn.active {
      border-color: var(--walnut);
      box-shadow: 0 0 0 3px rgba(139, 94, 60, 0.2);
    }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 16px;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--cream-dark);
      border-top-color: var(--walnut);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .loading-text {
      font-size: 14px;
      color: var(--walnut);
    }

    .highlight-yellow { background-color: rgba(255, 217, 61, 0.4); }
    .highlight-green { background-color: rgba(107, 203, 119, 0.4); }
    .highlight-blue { background-color: rgba(77, 150, 255, 0.4); }
    .highlight-pink { background-color: rgba(255, 107, 157, 0.4); }

    @media (max-width: 1024px) {
      .toc-panel {
        width: 240px;
      }
      
      .content-area {
        padding: 30px 40px;
      }
    }

    @media (max-width: 768px) {
      .toc-panel {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        z-index: 50;
        box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1);
      }
      
      .content-area {
        padding: 20px;
      }
      
      .book-title {
        font-size: 16px;
      }
      
      .book-author {
        display: none;
      }
    }
  `;

  async connectedCallback() {
    super.connectedCallback();
    this.currentChapterId = this.book.currentChapter || this.book.chapters[0]?.id || '';
    this.scrollPosition = this.book.scrollPosition || 0;
    await this.initReader();
    this.startAutoSave();
    document.addEventListener('keydown', this.handleKeydown);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.stopAutoSave();
    this.stopDebounceSave();
    this.saveProgress();
    document.removeEventListener('keydown', this.handleKeydown);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.cleanup();
  }

  private async initReader() {
    this.isLoading = true;
    try {
      if (this.book.fileType === 'epub') {
        await this.initEpub();
      } else {
        await this.initPdf();
      }
      await this.loadChapter(this.currentChapterId);
    } catch (error) {
      console.error('阅读器初始化失败:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private async initEpub() {
    try {
      const ePub = await import('epubjs');
      this.epubBook = ePub.default(this.book.fileData);
      await this.epubBook.ready;
    } catch (error) {
      console.error('EPUB初始化失败:', error);
    }
  }

  private async initPdf() {
    try {
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
      this.pdfDoc = await pdfjs.getDocument({ data: this.book.fileData }).promise;
      this.pdfTotalPages = this.pdfDoc.numPages;
      
      const currentChapter = this.book.chapters.find(c => c.id === this.currentChapterId);
      if (currentChapter?.pageStart !== undefined) {
        this.pdfPageNum = currentChapter.pageStart + 1;
      }
    } catch (error) {
      console.error('PDF初始化失败:', error);
    }
  }

  private async loadChapter(chapterId: string) {
    if (this.isTransitioning) return;
    
    this.isTransitioning = true;
    this.currentChapterId = chapterId;
    this.isLoading = true;
    
    try {
      if (this.book.fileType === 'epub') {
        await this.loadEpubChapter(chapterId);
      } else {
        await this.loadPdfChapter(chapterId);
      }
      
      this.requestUpdate();
      
      await this.updateComplete;
      
      if (this.contentArea) {
        this.contentArea.classList.remove('slide-in');
        void this.contentArea.offsetWidth;
        this.contentArea.classList.add('slide-in');
        
        requestAnimationFrame(() => {
          if (this.contentArea && this.scrollPosition > 0) {
            this.contentArea.scrollTop = this.scrollPosition;
          }
          this.isTransitioning = false;
        });
      }
    } catch (error) {
      console.error('加载章节失败:', error);
      this.isTransitioning = false;
    } finally {
      this.isLoading = false;
    }
  }

  private async loadEpubChapter(chapterId: string) {
    if (!this.epubBook) return;
    
    const chapter = this.book.chapters.find(c => c.id === chapterId);
    if (!chapter || !chapter.href) return;
    
    try {
      const content = await this.epubBook.load(chapter.href);
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');
      
      const body = doc.body;
      const styleElements = doc.querySelectorAll('style');
      let styles = '';
      styleElements.forEach(s => styles += s.textContent);
      
      const images = body.querySelectorAll('img');
      for (const img of images) {
        const src = img.getAttribute('src');
        if (src) {
          const resolvedPath = resolveEpubResourcePath(chapter.href, src);
          const dataUrl = await resourceToDataUrl(this.epubBook, resolvedPath);
          if (dataUrl) {
            img.setAttribute('src', dataUrl);
          }
        }
      }
      
      const links = doc.querySelectorAll('link[rel="stylesheet"]');
      for (const link of links) {
        const href = link.getAttribute('href');
        if (href) {
          const resolvedPath = resolveEpubResourcePath(chapter.href, href);
          const cssContent = await this.epubBook.load(resolvedPath);
          if (cssContent) {
            const styleEl = doc.createElement('style');
            styleEl.textContent = cssContent;
            link.replaceWith(styleEl);
            styles += cssContent;
          }
        }
      }
      
      this.content = `<style>${styles}</style>${body.innerHTML}`;
      
      await this.updateComplete;
      await new Promise(resolve => requestAnimationFrame(resolve));
      this.applyHighlightsForChapter(chapterId);
    } catch (error) {
      console.error('加载EPUB章节失败:', error);
      this.content = '<p>章节加载失败</p>';
    }
  }

  private async applyHighlightsForChapter(chapterId: string) {
    try {
      const annotations = await storage.getAnnotationsByBook(this.book.id);
      const chapterAnnotations = annotations.filter(a => a.chapterId === chapterId && a.type === 'highlight');
      
      const contentEl = this.shadowRoot?.querySelector('.epub-content') as HTMLElement;
      if (!contentEl) return;
      
      for (const annotation of chapterAnnotations) {
        this.applyHighlight(annotation, contentEl);
      }
    } catch (error) {
      console.error('应用高亮失败:', error);
    }
  }

  private applyHighlight(annotation: Annotation, container: HTMLElement) {
    if (!annotation.cfi) return;
    
    try {
      const range = getRangeFromCfi(container, annotation.cfi);
      if (!range) return;
      
      const span = document.createElement('span');
      span.className = `highlight-${annotation.color}`;
      span.dataset.annotationId = annotation.id;
      
      range.surroundContents(span);
    } catch (e) {
      console.warn('应用高亮失败:', e);
    }
  }

  getSelectionCfi(): { cfi: string; text: string } | null {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;
    
    const range = selection.getRangeAt(0);
    const contentEl = this.shadowRoot?.querySelector('.epub-content') as HTMLElement;
    if (!contentEl || !contentEl.contains(range.commonAncestorContainer)) return null;
    
    const chapter = this.book.chapters.find(c => c.id === this.currentChapterId);
    if (!chapter?.href) return null;
    
    const cfi = generateCfiFromRange(range, contentEl, chapter.href);
    return { cfi, text: selection.toString() };
  }

  removeHighlight(annotationId: string): void {
    const contentEl = this.shadowRoot?.querySelector('.epub-content') as HTMLElement;
    if (!contentEl) return;
    
    const highlightEl = contentEl.querySelector(`[data-annotation-id="${annotationId}"]`);
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

  private async loadPdfChapter(chapterId: string) {
    const chapter = this.book.chapters.find(c => c.id === chapterId);
    if (chapter?.pageStart !== undefined) {
      this.pdfPageNum = chapter.pageStart + 1;
      await this.renderPdfPage();
    }
  }

  private async renderPdfPage() {
    if (!this.pdfDoc || !this.pdfCanvas) return;
    
    try {
      const page = await this.pdfDoc.getPage(this.pdfPageNum);
      const scale = 1.5;
      const viewport = page.getViewport({ scale });
      
      this.pdfCanvas.width = viewport.width;
      this.pdfCanvas.height = viewport.height;
      
      const context = this.pdfCanvas.getContext('2d')!;
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
    } catch (error) {
      console.error('渲染PDF页面失败:', error);
    }
  }

  private async prevPdfPage() {
    if (this.pdfPageNum > 1) {
      this.pdfPageNum--;
      await this.renderPdfPage();
      this.updateProgress();
      this.debounceSave();
    }
  }

  private async nextPdfPage() {
    if (this.pdfPageNum < this.pdfTotalPages) {
      this.pdfPageNum++;
      await this.renderPdfPage();
      this.updateProgress();
      this.debounceSave();
    }
  }

  private updateProgress() {
    if (this.pdfTotalPages > 0) {
      const progress = Math.round((this.pdfPageNum / this.pdfTotalPages) * 100);
      this.dispatchEvent(new CustomEvent('progress-update', {
        detail: { progress },
        bubbles: true,
        composed: true
      }));
    }
  }

  private handleChapterClick(chapter: Chapter) {
    this.scrollPosition = 0;
    this.loadChapter(chapter.id);
  }

  private handleScroll = () => {
    if (this.contentArea) {
      this.scrollPosition = this.contentArea.scrollTop;
      
      if (this.book.fileType === 'epub') {
        const scrollHeight = this.contentArea.scrollHeight - this.contentArea.clientHeight;
        if (scrollHeight > 0) {
          const progress = Math.round((this.scrollPosition / scrollHeight) * 100);
          const chapterIndex = this.book.chapters.findIndex(c => c.id === this.currentChapterId);
          const totalProgress = Math.round(
            ((chapterIndex + progress / 100) / this.book.chapters.length) * 100
          );
          
          this.dispatchEvent(new CustomEvent('progress-update', {
            detail: { progress: totalProgress },
            bubbles: true,
            composed: true
          }));
        }
      }
      
      this.debounceSave();
    }
  };

  private startAutoSave() {
    this.stopAutoSave();
    this.autoSaveTimer = window.setInterval(() => {
      this.saveProgress();
    }, this.AUTO_SAVE_INTERVAL);
  }

  private stopAutoSave() {
    if (this.autoSaveTimer !== null) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  private debounceSave() {
    this.stopDebounceSave();
    this.debounceTimer = window.setTimeout(() => {
      this.saveProgress();
    }, this.DEBOUNCE_DELAY);
  }

  private stopDebounceSave() {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  private handleVisibilityChange = () => {
    if (document.hidden) {
      this.saveProgress();
    }
  };

  private async saveProgress() {
    const progress = this.calculateProgress();
    await bookManager.updateBookProgress(
      this.book.id,
      progress,
      this.currentChapterId,
      this.scrollPosition
    );
  }

  private calculateProgress(): number {
    if (this.book.fileType === 'pdf' && this.pdfTotalPages > 0) {
      return Math.round((this.pdfPageNum / this.pdfTotalPages) * 100);
    }
    
    const chapterIndex = this.book.chapters.findIndex(c => c.id === this.currentChapterId);
    const scrollProgress = this.contentArea 
      ? Math.min(100, Math.round((this.scrollPosition / (this.contentArea.scrollHeight - this.contentArea.clientHeight)) * 100)) || 0
      : 0;
    
    return Math.round(
      ((chapterIndex + scrollProgress / 100) / Math.max(1, this.book.chapters.length)) * 100
    );
  }

  private handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      this.handleClose();
    } else if (e.key === 'ArrowLeft') {
      this.prevChapter();
    } else if (e.key === 'ArrowRight') {
      this.nextChapter();
    }
  };

  private prevChapter() {
    const currentIndex = this.book.chapters.findIndex(c => c.id === this.currentChapterId);
    if (currentIndex > 0) {
      this.handleChapterClick(this.book.chapters[currentIndex - 1]);
    }
  }

  private nextChapter() {
    const currentIndex = this.book.chapters.findIndex(c => c.id === this.currentChapterId);
    if (currentIndex < this.book.chapters.length - 1) {
      this.handleChapterClick(this.book.chapters[currentIndex + 1]);
    }
  }

  private handleClose() {
    this.saveProgress();
    this.dispatchEvent(new CustomEvent('close', {
      bubbles: true,
      composed: true
    }));
  }

  private handleFontSizeChange(delta: number) {
    this.fontSize = Math.max(12, Math.min(28, this.fontSize + delta));
    this.style.setProperty('--font-size', `${this.fontSize}px`);
  }

  private handleThemeChange(theme: ThemeType) {
    this.theme = theme;
    this.showSettings = false;
  }

  private toggleSettings() {
    this.showSettings = !this.showSettings;
    if (this.showSettings) {
      setTimeout(() => {
        document.addEventListener('click', this.handleOutsideClick, { once: true });
      }, 0);
    }
  }

  private handleOutsideClick = (e: MouseEvent) => {
    const panel = this.shadowRoot?.querySelector('.settings-panel');
    const btn = this.shadowRoot?.querySelector('[data-settings-btn]');
    if (panel && !panel.contains(e.target as Node) && btn && !btn.contains(e.target as Node)) {
      this.showSettings = false;
    }
  };

  private toggleToc() {
    this.showToc = !this.showToc;
  }

  private handleToggleAnnotations() {
    this.dispatchEvent(new CustomEvent('toggle-annotations', {
      bubbles: true,
      composed: true
    }));
  }

  private handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      this.dispatchEvent(new CustomEvent('text-selected', {
        detail: {
          text: selection.toString(),
          range,
          rect,
          chapterId: this.currentChapterId
        },
        bubbles: true,
        composed: true
      }));
    }
  };

  private cleanup() {
    if (this.epubRendition) {
      this.epubRendition.destroy();
    }
    this.epubBook = null;
    this.pdfDoc = null;
  }

  get currentChapter() {
    return this.currentChapterId;
  }

  get scrollPos() {
    return this.scrollPosition;
  }

  private get themeStyle() {
    const config = THEMES[this.theme];
    return `background-color: ${config.background}; color: ${config.text};`;
  }

  render() {
    const themeConfig = THEMES[this.theme];
    
    return html`
      <header class="reader-header">
        <div class="header-left">
          <button class="back-btn" @click=${this.handleClose} title="返回书架">
            ←
          </button>
          <div class="book-info">
            <div class="book-title">${this.book.title}</div>
            <div class="book-author">${this.book.author}</div>
          </div>
        </div>
        <div class="header-right">
          <button 
            class=${classMap({ 'header-btn': true, active: this.showToc })} 
            @click=${this.toggleToc}
            title="目录"
          >
            ☰
          </button>
          <button 
            class="header-btn" 
            @click=${this.handleToggleAnnotations}
            title="笔记"
            data-annotations-btn
          >
            ✎
          </button>
          <button 
            class=${classMap({ 'header-btn': true, active: this.showSettings })} 
            @click=${this.toggleSettings}
            title="设置"
            data-settings-btn
          >
            ⚙
          </button>
        </div>
      </header>

      <div class="reader-main" style=${this.themeStyle}>
        <aside class=${classMap({ 'toc-panel': true, collapsed: !this.showToc })}>
          <div class="toc-header">
            <div class="toc-title">章节目录</div>
          </div>
          <div class="toc-list">
            ${this.book.chapters.map((chapter, index) => html`
              <div 
                class=${classMap({ 'toc-item': true, active: chapter.id === this.currentChapterId })}
                @click=${() => this.handleChapterClick(chapter)}
              >
                ${index + 1}. ${chapter.title}
              </div>
            `)}
          </div>
        </aside>

        <div class="content-wrapper">
          ${this.isLoading ? html`
            <div class="loading">
              <div class="spinner"></div>
              <div class="loading-text">加载中...</div>
            </div>
          ` : html`
            <div 
              class="content-area" 
              style=${`font-size: ${this.fontSize}px;`}
              @scroll=${this.handleScroll}
              @mouseup=${this.handleTextSelection}
            >
              ${this.book.fileType === 'epub' ? html`
                <h2 class="chapter-title">
                  ${this.book.chapters.find(c => c.id === this.currentChapterId)?.title}
                </h2>
                <div class="epub-content" .innerHTML=${this.content}></div>
              ` : html`
                <div class="pdf-container">
                  <canvas id="pdf-canvas"></canvas>
                  <div class="pdf-controls">
                    <button 
                      @click=${this.prevPdfPage} 
                      ?disabled=${this.pdfPageNum <= 1}
                    >
                      ←
                    </button>
                    <span class="pdf-page-info">
                      ${this.pdfPageNum} / ${this.pdfTotalPages}
                    </span>
                    <button 
                      @click=${this.nextPdfPage} 
                      ?disabled=${this.pdfPageNum >= this.pdfTotalPages}
                    >
                      →
                    </button>
                  </div>
                </div>
              `}
            </div>
          `}

          ${this.showSettings ? html`
            <div class="settings-panel" @click=${(e: Event) => e.stopPropagation()}>
              <div class="settings-section">
                <span class="settings-label">字号调节</span>
                <div class="font-size-control">
                  <button class="font-size-btn" @click=${() => this.handleFontSizeChange(-2)}>
                    A-
                  </button>
                  <span class="font-size-value">${this.fontSize}px</span>
                  <button class="font-size-btn" @click=${() => this.handleFontSizeChange(2)}>
                    A+
                  </button>
                </div>
              </div>
              
              <div class="settings-section">
                <span class="settings-label">阅读主题</span>
                <div class="theme-options">
                  ${(Object.keys(THEMES) as ThemeType[]).map(key => html`
                    <button 
                      class=${classMap({ 
                        'theme-btn': true, 
                        active: this.theme === key 
                      })}
                      style=${`background-color: ${THEMES[key].background}; color: ${THEMES[key].text};`}
                      @click=${() => this.handleThemeChange(key)}
                    >
                      ${THEMES[key].name}
                    </button>
                  `)}
                </div>
              </div>
            </div>
          ` : nothing}
        </div>
      </div>
    `;
  }
}
