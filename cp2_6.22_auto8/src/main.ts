import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import './library/shelfGrid';
import './reader/bookReader';
import './reader/annotationPanel';
import type { Book } from './types';

@customElement('app-main')
class AppMain extends LitElement {
  @state() private selectedBook: Book | null = null;
  @state() private showAnnotations: boolean = false;

  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
    }
  `;

  private handleBookSelect = (e: Event) => {
    const customEvent = e as CustomEvent;
    this.selectedBook = customEvent.detail.book;
    this.showAnnotations = false;
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
      ${this.selectedBook ? html`
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
