import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import './library/shelfGrid';
import './reader/bookReader';
import './reader/annotationPanel';
import { bookManager } from './library/bookManager';
import type { Book } from './types';

@customElement('app-main')
class AppMain extends LitElement {
  @state() private selectedBook: Book | null = null;
  @state() private showAnnotations: boolean = false;
  @state() private isLoadingBook: boolean = false;

  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `;

  private handleBookSelect = async (e: Event) => {
    const customEvent = e as CustomEvent;
    const bookId = customEvent.detail.bookId;
    const bookFromEvent = customEvent.detail.book;
    
    if (!bookId && !bookFromEvent) return;
    
    this.isLoadingBook = true;
    try {
      let book: Book | null = null;
      
      if (bookId) {
        book = await bookManager.getBook(bookId);
      }
      
      if (!book && bookFromEvent) {
        if (bookFromEvent.fileData && bookFromEvent.fileData.byteLength > 0) {
          book = bookFromEvent;
        } else {
          book = await bookManager.getBook(bookFromEvent.id);
        }
      }
      
      if (book) {
        this.selectedBook = book;
        this.showAnnotations = false;
      }
    } catch (error) {
      console.error('加载书籍失败:', error);
    } finally {
      this.isLoadingBook = false;
    }
  };

  private handleReaderClose = () => {
    this.selectedBook = null;
    this.showAnnotations = false;
    
    const shelfGrid = this.shadowRoot?.querySelector('shelf-grid');
    if (shelfGrid) {
      shelfGrid.dispatchEvent(new CustomEvent('refresh', { bubbles: true }));
    }
  };

  private handleProgressUpdate = (e: Event) => {
    if (!this.selectedBook) return;
    const customEvent = e as CustomEvent;
    this.selectedBook = {
      ...this.selectedBook,
      progress: customEvent.detail.progress
    };
  };

  private handleToggleAnnotations = () => {
    this.showAnnotations = !this.showAnnotations;
  };

  private handleAnnotationsClose = () => {
    this.showAnnotations = false;
  };

  render() {
    return html`
      ${this.isLoadingBook ? html`
        <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: var(--cream);">
          <div style="text-align: center;">
            <div style="width: 48px; height: 48px; border: 4px solid var(--cream-dark); border-top-color: var(--walnut); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px;"></div>
            <div style="color: var(--walnut); font-size: 14px;">正在打开书籍...</div>
          </div>
        </div>
      ` : this.selectedBook ? html`
        <book-reader 
          .book=${this.selectedBook}
          @close=${this.handleReaderClose}
          @progress-update=${this.handleProgressUpdate}
          @toggle-annotations=${this.handleToggleAnnotations}
        ></book-reader>
        <annotation-panel
          .book=${this.selectedBook}
          ?isOpen=${this.showAnnotations}
          @close=${this.handleAnnotationsClose}
        ></annotation-panel>
      ` : html`
        <shelf-grid @book-select=${this.handleBookSelect}></shelf-grid>
      `}
    `;
  }
}

const appContainer = document.getElementById('app');
if (appContainer) {
  appContainer.innerHTML = '<app-main></app-main>';
}
