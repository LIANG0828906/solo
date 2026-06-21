var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import './library/shelfGrid';
import './reader/bookReader';
import './reader/annotationPanel';
import { bookManager } from './library/bookManager';
let AppMain = class AppMain extends LitElement {
    constructor() {
        super(...arguments);
        this.selectedBook = null;
        this.showAnnotations = false;
        this.isLoadingBook = false;
        this.handleBookSelect = async (e) => {
            const customEvent = e;
            const bookId = customEvent.detail.bookId;
            if (!bookId)
                return;
            this.isLoadingBook = true;
            try {
                const book = await bookManager.getBook(bookId);
                if (book) {
                    this.selectedBook = book;
                    this.showAnnotations = false;
                }
            }
            catch (error) {
                console.error('加载书籍失败:', error);
            }
            finally {
                this.isLoadingBook = false;
            }
        };
        this.handleReaderClose = () => {
            this.selectedBook = null;
            this.showAnnotations = false;
            const shelfGrid = this.shadowRoot?.querySelector('shelf-grid');
            if (shelfGrid) {
                shelfGrid.dispatchEvent(new CustomEvent('refresh', { bubbles: true }));
            }
        };
        this.handleProgressUpdate = (e) => {
            if (!this.selectedBook)
                return;
            const customEvent = e;
            this.selectedBook = {
                ...this.selectedBook,
                progress: customEvent.detail.progress
            };
        };
        this.handleToggleAnnotations = () => {
            this.showAnnotations = !this.showAnnotations;
        };
        this.handleAnnotationsClose = () => {
            this.showAnnotations = false;
        };
    }
    render() {
        return html `
      ${this.isLoadingBook ? html `
        <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: var(--cream);">
          <div style="text-align: center;">
            <div style="width: 48px; height: 48px; border: 4px solid var(--cream-dark); border-top-color: var(--walnut); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px;"></div>
            <div style="color: var(--walnut); font-size: 14px;">正在打开书籍...</div>
          </div>
        </div>
      ` : this.selectedBook ? html `
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
      ` : html `
        <shelf-grid @book-select=${this.handleBookSelect}></shelf-grid>
      `}
    `;
    }
};
AppMain.styles = css `
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
__decorate([
    state()
], AppMain.prototype, "selectedBook", void 0);
__decorate([
    state()
], AppMain.prototype, "showAnnotations", void 0);
__decorate([
    state()
], AppMain.prototype, "isLoadingBook", void 0);
AppMain = __decorate([
    customElement('app-main')
], AppMain);
const appContainer = document.getElementById('app');
if (appContainer) {
    appContainer.innerHTML = '<app-main></app-main>';
}
