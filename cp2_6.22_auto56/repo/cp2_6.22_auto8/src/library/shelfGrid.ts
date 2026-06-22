import { LitElement, html, css } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { bookManager } from './bookManager';
import type { Book, FilterOptions } from '../types';

@customElement('shelf-grid')
export class ShelfGrid extends LitElement {
  @state() private books: Book[] = [];
  @state() private isLoading = true;
  @state() private isDragging = false;
  @state() private filters: FilterOptions = {
    author: 'all',
    status: 'all',
    progress: 'all',
    search: ''
  };
  @state() private authors: string[] = [];
  @query('#fileInput') private fileInput!: HTMLInputElement;

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }

    .header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 100;
      background: rgba(139, 94, 60, 0.85);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(245, 240, 232, 0.2);
      padding: 16px 32px;
    }

    .header-content {
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      gap: 24px;
    }

    .logo {
      font-family: 'Playfair Display', serif;
      font-size: 28px;
      font-weight: 700;
      color: var(--cream);
      display: flex;
      align-items: center;
      gap: 10px;
      white-space: nowrap;
    }

    .logo-icon {
      width: 36px;
      height: 36px;
      background: var(--cream);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--walnut);
      font-size: 20px;
    }

    .search-box {
      flex: 1;
      position: relative;
      overflow: hidden;
      max-width: 400px;
      border-radius: 12px;
    }

    .search-box input {
      width: 100%;
      padding: 12px 16px 12px 44px;
      border-radius: 12px;
      background: rgba(245, 240, 232, 0.15);
      color: var(--cream);
      font-size: 14px;
      transition: all 0.3s ease;
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      border: 1px solid rgba(245, 240, 232, 0.25);
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    .search-box input::placeholder {
      color: rgba(245, 240, 232, 0.7);
    }

    .search-box input:focus {
      background: rgba(245, 240, 232, 0.25);
      backdrop-filter: blur(25px) saturate(200%);
      -webkit-backdrop-filter: blur(25px) saturate(200%);
      box-shadow: 0 0 0 3px rgba(245, 240, 232, 0.3), 0 4px 20px rgba(0, 0, 0, 0.15);
      border-color: rgba(245, 240, 232, 0.4);
      transform: translateY(-1px);
    }

    .search-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: rgba(245, 240, 232, 0.7);
      pointer-events: none;
    }

    .import-btn {
      padding: 12px 24px;
      background: var(--cream);
      color: var(--walnut-dark);
      border: none;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }

    .import-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
    }

    .import-btn:active {
      transform: scale(0.97);
    }

    .ripple {
      position: absolute;
      border-radius: 50%;
      background: rgba(139, 94, 60, 0.3);
      transform: scale(0);
      animation: ripple 0.6s ease-out;
      pointer-events: none;
    }

    @keyframes ripple {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }

    .toolbar {
      padding: 120px 32px 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .filter-bar {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      align-items: center;
    }

    .filter-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .filter-group label {
      font-size: 13px;
      color: var(--walnut-dark);
      font-weight: 500;
    }

    .filter-group select {
      padding: 8px 14px;
      border: 2px solid var(--walnut-light);
      border-radius: 8px;
      background: var(--cream);
      color: var(--ink);
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .filter-group select:focus {
      border-color: var(--walnut);
      box-shadow: 0 0 0 3px rgba(139, 94, 60, 0.1);
    }

    .books-count {
      margin-left: auto;
      font-size: 13px;
      color: var(--walnut);
      font-weight: 500;
    }

    .grid-container {
      padding: 0 32px 48px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .drop-zone {
      position: fixed;
      inset: 0;
      z-index: 1000;
      background: rgba(139, 94, 60, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(8px);
      transition: all 0.3s ease;
    }

    .drop-zone-content {
      text-align: center;
      color: var(--cream);
      padding: 60px 80px;
      border: 3px dashed var(--cream);
      border-radius: 24px;
      background: rgba(245, 240, 232, 0.1);
    }

    .drop-zone-icon {
      font-size: 64px;
      margin-bottom: 16px;
    }

    .drop-zone-text {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .drop-zone-hint {
      font-size: 14px;
      opacity: 0.8;
    }

    .book-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 24px;
    }

    .book-card {
      background: var(--cream);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: var(--shadow-soft);
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      opacity: 0;
      animation: fadeIn 0.5s ease forwards;
      position: relative;
    }

    @keyframes fadeIn {
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .book-card:hover {
      transform: translateY(-6px);
      box-shadow: var(--shadow-deep);
    }

    .book-cover {
      width: 100%;
      aspect-ratio: 3 / 4;
      object-fit: cover;
      display: block;
    }

    .book-info {
      padding: 16px;
    }

    .book-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--ink);
      margin-bottom: 6px;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
    }

    .book-author {
      font-size: 13px;
      color: var(--walnut);
      margin-bottom: 12px;
    }

    .progress-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .progress-bar {
      flex: 1;
      height: 6px;
      background: var(--cream-dark);
      border-radius: 3px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--walnut-light), var(--walnut));
      border-radius: 3px;
      transition: width 0.5s ease;
    }

    .progress-text {
      font-size: 11px;
      color: var(--walnut);
      font-weight: 600;
      min-width: 32px;
      text-align: right;
    }

    .status-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      backdrop-filter: blur(10px);
    }

    .status-unread {
      background: rgba(108, 117, 125, 0.9);
      color: white;
    }

    .status-reading {
      background: rgba(139, 94, 60, 0.9);
      color: var(--cream);
    }

    .status-finished {
      background: rgba(45, 74, 62, 0.9);
      color: white;
    }

    .empty-state {
      text-align: center;
      padding: 80px 20px;
      color: var(--walnut);
    }

    .empty-state-icon {
      font-size: 80px;
      margin-bottom: 20px;
      opacity: 0.5;
    }

    .empty-state-title {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 10px;
      color: var(--walnut-dark);
    }

    .empty-state-hint {
      font-size: 15px;
      opacity: 0.8;
    }

    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 100px;
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid var(--cream-dark);
      border-top-color: var(--walnut);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    @media (max-width: 1024px) {
      .book-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .header {
        padding: 12px 20px;
      }
      
      .header-content {
        gap: 16px;
      }
      
      .logo {
        font-size: 22px;
      }
      
      .toolbar {
        padding: 100px 20px 20px;
      }
      
      .grid-container {
        padding: 0 20px 32px;
      }
    }

    @media (max-width: 768px) {
      .book-grid {
        grid-template-columns: 1fr;
      }
      
      .header-content {
        flex-wrap: wrap;
      }
      
      .search-box {
        order: 3;
        max-width: 100%;
        flex-basis: 100%;
      }
      
      .filter-bar {
        flex-direction: column;
        align-items: stretch;
      }
      
      .books-count {
        margin-left: 0;
        text-align: center;
      }
    }
  `;

  async connectedCallback() {
    super.connectedCallback();
    await this.loadBooks();
    this.setupDragAndDrop();
    this.addEventListener('refresh', this.handleRefresh);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeDragAndDrop();
    this.removeEventListener('refresh', this.handleRefresh);
  }

  private async loadBooks() {
    this.isLoading = true;
    try {
      this.books = await bookManager.filterBooks(this.filters);
      this.authors = await bookManager.getAuthors();
    } finally {
      this.isLoading = false;
    }
  }

  private setupDragAndDrop() {
    window.addEventListener('dragover', this.handleDragOver);
    window.addEventListener('drop', this.handleDrop);
    window.addEventListener('dragleave', this.handleDragLeave);
  }

  private removeDragAndDrop() {
    window.removeEventListener('dragover', this.handleDragOver);
    window.removeEventListener('drop', this.handleDrop);
    window.removeEventListener('dragleave', this.handleDragLeave);
  }

  private handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer?.types.includes('Files')) {
      this.isDragging = true;
    }
  };

  private handleDragLeave = (e: DragEvent) => {
    if (e.target === window || e.target === document.body) {
      this.isDragging = false;
    }
  };

  private handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    this.isDragging = false;
    
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      await this.importFiles(Array.from(files));
    }
  };

  private async importFiles(files: File[]) {
    this.isLoading = true;
    try {
      const imported = await bookManager.importFiles(files);
      if (imported.length > 0) {
        await this.loadBooks();
      }
    } finally {
      this.isLoading = false;
    }
  }

  private handleFileSelect = async (e: Event) => {
    const target = e.target as HTMLInputElement;
    const files = target.files;
    if (files && files.length > 0) {
      await this.importFiles(Array.from(files));
      target.value = '';
    }
  };

  private handleImportClick = (e: MouseEvent) => {
    this.createRipple(e);
    this.fileInput?.click();
  };

  private createRipple(e: MouseEvent) {
    const button = e.currentTarget as HTMLElement;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.className = 'ripple';
    
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }

  private handleSearch = (e: Event) => {
    const target = e.target as HTMLInputElement;
    this.filters = { ...this.filters, search: target.value };
    this.loadBooks();
  };

  private handleFilterChange = (filterType: keyof FilterOptions, e: Event) => {
    const target = e.target as HTMLSelectElement;
    this.filters = { ...this.filters, [filterType]: target.value };
    this.loadBooks();
  };

  private handleRefresh = () => {
    this.loadBooks();
  };

  private handleBookClick(book: Book) {
    const event = new CustomEvent('book-select', {
      detail: { bookId: book.id },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  private getStatusClass(status: string) {
    return `status-${status}`;
  }

  private getStatusText(status: string) {
    const texts: Record<string, string> = {
      unread: '未读',
      reading: '在读',
      finished: '已读'
    };
    return texts[status] || status;
  }

  render() {
    return html`
      ${this.isDragging ? html`
        <div class="drop-zone">
          <div class="drop-zone-content">
            <div class="drop-zone-icon">📚</div>
            <div class="drop-zone-text">释放鼠标导入书籍</div>
            <div class="drop-zone-hint">支持 EPUB 和 PDF 格式</div>
          </div>
        </div>
      ` : ''}

      <header class="header">
        <div class="header-content">
          <div class="logo">
            <span class="logo-icon">📖</span>
            <span>书香阁</span>
          </div>
          
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="搜索书名或作者..." 
              .value=${this.filters.search}
              @input=${this.handleSearch}
            />
          </div>
          
          <button class="import-btn" @click=${this.handleImportClick}>
            <span>＋</span>
            <span>导入书籍</span>
          </button>
          
          <input 
            type="file" 
            id="fileInput" 
            accept=".epub,.pdf" 
            multiple 
            hidden 
            @change=${this.handleFileSelect}
          />
        </div>
      </header>

      <div class="toolbar">
        <div class="filter-bar">
          <div class="filter-group">
            <label>作者：</label>
            <select @change=${(e: Event) => this.handleFilterChange('author', e)}>
              <option value="all">全部作者</option>
              ${this.authors.map(author => 
                html`<option value=${author} ?selected=${this.filters.author === author}>${author}</option>`
              )}
            </select>
          </div>
          
          <div class="filter-group">
            <label>状态：</label>
            <select @change=${(e: Event) => this.handleFilterChange('status', e)}>
              <option value="all">全部状态</option>
              <option value="unread" ?selected=${this.filters.status === 'unread'}>未读</option>
              <option value="reading" ?selected=${this.filters.status === 'reading'}>在读</option>
              <option value="finished" ?selected=${this.filters.status === 'finished'}>已读</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label>进度：</label>
            <select @change=${(e: Event) => this.handleFilterChange('progress', e)}>
              <option value="all">全部进度</option>
              <option value="0" ?selected=${this.filters.progress === '0'}>0%</option>
              <option value="1-50" ?selected=${this.filters.progress === '1-50'}>1%-50%</option>
              <option value="51-99" ?selected=${this.filters.progress === '51-99'}>51%-99%</option>
              <option value="100" ?selected=${this.filters.progress === '100'}>100%</option>
            </select>
          </div>
          
          <span class="books-count">共 ${this.books.length} 本书</span>
        </div>
      </div>

      <div class="grid-container">
        ${this.isLoading ? html`
          <div class="loading">
            <div class="spinner"></div>
          </div>
        ` : this.books.length === 0 ? html`
          <div class="empty-state">
            <div class="empty-state-icon">📚</div>
            <div class="empty-state-title">书架空空如也</div>
            <div class="empty-state-hint">点击上方"导入书籍"按钮或拖拽文件到这里</div>
          </div>
        ` : html`
          <div class="book-grid">
            ${this.books.map((book, index) => html`
              <div 
                class="book-card" 
                style="animation-delay: ${index * 0.05}s; transform: translateY(20px)"
                data-book-id=${book.id}
                @click=${() => this.handleBookClick(book)}
              >
                <span class=${classMap({
                  'status-badge': true,
                  [this.getStatusClass(book.status)]: true
                })}>
                  ${this.getStatusText(book.status)}
                </span>
                <img class="book-cover" src=${book.cover} alt=${book.title} loading="lazy" />
                <div class="book-info">
                  <div class="book-title">${book.title}</div>
                  <div class="book-author">${book.author}</div>
                  <div class="progress-container">
                    <div class="progress-bar">
                      <div class="progress-fill" style="width: ${book.progress}%"></div>
                    </div>
                    <span class="progress-text">${book.progress}%</span>
                  </div>
                </div>
              </div>
            `)}
          </div>
        `}
      </div>
    `;
  }
}
