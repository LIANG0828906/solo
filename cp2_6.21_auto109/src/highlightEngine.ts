import { HighlightRange, SelectionPosition } from './types';

export class HighlightEngine {
  private container: HTMLElement | null = null;

  setContainer(container: HTMLElement) {
    this.container = container;
  }

  extractRangeFromSelection(selection: Selection): HighlightRange | null {
    if (!this.container || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    if (range.collapsed) return null;

    if (!this.container.contains(range.commonAncestorContainer)) {
      return null;
    }

    const selectedText = range.toString().trim();
    if (!selectedText) return null;

    const preRange = document.createRange();
    preRange.selectNodeContents(this.container);
    preRange.setEnd(range.startContainer, range.startOffset);
    const startOffset = preRange.toString().length;

    const fullRange = document.createRange();
    fullRange.selectNodeContents(this.container);
    fullRange.setEnd(range.endContainer, range.endOffset);
    const endOffset = fullRange.toString().length;

    if (endOffset <= startOffset) return null;

    return {
      startOffset,
      endOffset,
      text: selectedText,
    };
  }

  getSelectionPosition(selection: Selection): SelectionPosition | null {
    if (selection.rangeCount === 0) return null;
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + window.scrollY - 8,
    };
  }

  clearSelection(): void {
    window.getSelection()?.removeAllRanges();
  }
}

export const highlightEngine = new HighlightEngine();
