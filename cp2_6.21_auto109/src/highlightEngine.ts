import { HighlightRange, SelectionPosition } from './types';

function getTextNodesInRange(range: Range): Text[] {
  const textNodes: Text[] = [];
  const startContainer = range.startContainer;
  const endContainer = range.endContainer;

  if (startContainer.nodeType === Node.TEXT_NODE && startContainer === endContainer) {
    return [startContainer as Text];
  }

  const walker = document.createTreeWalker(
    range.commonAncestorContainer,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node: Node) {
        const nodeRange = document.createRange();
        nodeRange.selectNodeContents(node);
        if (range.compareBoundaryPoints(Range.END_TO_START, nodeRange) >= 0) {
          return NodeFilter.FILTER_REJECT;
        }
        if (range.compareBoundaryPoints(Range.START_TO_END, nodeRange) <= 0) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );

  let currentNode = walker.nextNode();
  while (currentNode) {
    textNodes.push(currentNode as Text);
    currentNode = walker.nextNode();
  }

  return textNodes;
}

export class HighlightEngine {
  private container: HTMLElement | null = null;

  setContainer(container: HTMLElement) {
    this.container = container;
  }

  getTextNodesInContainer(): Text[] {
    if (!this.container) return [];
    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(
      this.container,
      NodeFilter.SHOW_TEXT,
      null
    );
    let node = walker.nextNode();
    while (node) {
      textNodes.push(node as Text);
      node = walker.nextNode();
    }
    return textNodes;
  }

  getNodeOffsetInContainer(textNode: Text): number {
    if (!this.container) return 0;
    let offset = 0;
    const walker = document.createTreeWalker(
      this.container,
      NodeFilter.SHOW_TEXT,
      null
    );
    let node = walker.nextNode();
    while (node) {
      if (node === textNode) break;
      offset += (node as Text).length;
      node = walker.nextNode();
    }
    return offset;
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

    const textNodes = this.getTextNodesInContainer();
    const startNode = range.startContainer as Text;
    const endNode = range.endContainer as Text;

    let startOffset = range.startOffset;
    let endOffset = range.endOffset;

    for (const node of textNodes) {
      if (node === startNode) break;
      if (node.nodeType === Node.TEXT_NODE) {
        startOffset += (node as Text).length;
      }
    }

    for (const node of textNodes) {
      if (node === endNode) break;
      if (node.nodeType === Node.TEXT_NODE) {
        endOffset += (node as Text).length;
      }
    }

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
    if (rect.width === 0 && rect.height === 0) return null;
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + window.scrollY - 8,
    };
  }

  clearSelection(): void {
    window.getSelection()?.removeAllRanges();
  }

  handleTextSelection(selection: Selection): HighlightRange | null {
    if (!this.container || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    if (range.collapsed) return null;

    if (!this.container.contains(range.commonAncestorContainer)) {
      return null;
    }

    const textNodes = getTextNodesInRange(range);
    if (textNodes.length === 0) return null;

    let totalStartOffset = 0;
    let totalEndOffset = 0;
    let foundStart = false;

    const allTextNodes = this.getTextNodesInContainer();
    for (const node of allTextNodes) {
      if (node === range.startContainer) {
        foundStart = true;
        totalStartOffset += range.startOffset;
      } else if (node === range.endContainer) {
        totalEndOffset = totalStartOffset + range.endOffset;
        if (!foundStart) {
          totalStartOffset += (node as Text).length;
        }
        break;
      } else if (!foundStart) {
        totalStartOffset += (node as Text).length;
      }
    }

    if (!foundStart) {
      const preRange = document.createRange();
      preRange.selectNodeContents(this.container);
      preRange.setEnd(range.startContainer, range.startOffset);
      totalStartOffset = preRange.toString().length;

      const fullRange = document.createRange();
      fullRange.selectNodeContents(this.container);
      fullRange.setEnd(range.endContainer, range.endOffset);
      totalEndOffset = fullRange.toString().length;
    }

    const selectedText = range.toString().trim();
    if (!selectedText || totalEndOffset <= totalStartOffset) return null;

    return {
      startOffset: totalStartOffset,
      endOffset: totalEndOffset,
      text: selectedText,
    };
  }
}

export const highlightEngine = new HighlightEngine();
