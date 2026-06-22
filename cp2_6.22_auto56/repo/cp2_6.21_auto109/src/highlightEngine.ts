import { HighlightRange, SelectionPosition } from './types';

function isTextNode(node: Node): node is Text {
  return node.nodeType === Node.TEXT_NODE;
}

function isBlockElement(el: HTMLElement): boolean {
  const blockTags = new Set([
    'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
    'LI', 'DIV', 'BLOCKQUOTE', 'PRE', 'UL', 'OL',
    'TABLE', 'TR', 'TD', 'TH', 'SECTION', 'ARTICLE',
    'HEADER', 'FOOTER', 'NAV', 'ASIDE',
  ]);
  return blockTags.has(el.tagName);
}

function getAllTextNodesUnder(root: Node): Text[] {
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  let node = walker.nextNode();
  while (node) {
    nodes.push(node as Text);
    node = walker.nextNode();
  }
  return nodes;
}

function getTextNodesIntersectingRange(range: Range): Text[] {
  const result: Text[] = [];

  if (range.startContainer === range.endContainer && isTextNode(range.startContainer)) {
    return [range.startContainer as Text];
  }

  const commonAncestor = range.commonAncestorContainer;
  const rootForWalk = commonAncestor.nodeType === Node.ELEMENT_NODE
    ? commonAncestor
    : commonAncestor.parentNode;

  if (!rootForWalk) return result;

  const allTexts = getAllTextNodesUnder(rootForWalk);
  for (const text of allTexts) {
    const tRange = document.createRange();
    tRange.selectNodeContents(text);

    if (range.compareBoundaryPoints(Range.END_TO_START, tRange) >= 0) continue;
    if (range.compareBoundaryPoints(Range.START_TO_END, tRange) <= 0) continue;

    result.push(text);
  }

  return result;
}

export class HighlightEngine {
  private container: HTMLElement | null = null;

  setContainer(container: HTMLElement) {
    this.container = container;
  }

  private getGlobalOffsetOfTextNode(textNode: Text): number {
    if (!this.container) return 0;
    let offset = 0;
    const allTexts = getAllTextNodesUnder(this.container);
    for (const t of allTexts) {
      if (t === textNode) break;
      offset += t.length;
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

    const startNode = range.startContainer;
    const endNode = range.endContainer;

    let startOffset = 0;
    let endOffset = 0;

    if (isTextNode(startNode)) {
      startOffset = this.getGlobalOffsetOfTextNode(startNode) + range.startOffset;
    } else {
      const firstChild = startNode.childNodes[range.startOffset];
      if (firstChild && isTextNode(firstChild)) {
        startOffset = this.getGlobalOffsetOfTextNode(firstChild);
      } else {
        return this.handleTextSelection(selection);
      }
    }

    if (isTextNode(endNode)) {
      endOffset = this.getGlobalOffsetOfTextNode(endNode) + range.endOffset;
    } else {
      const lastChild = endNode.childNodes[range.endOffset - 1];
      if (lastChild) {
        const lastText = isTextNode(lastChild)
          ? lastChild
          : getAllTextNodesUnder(lastChild).pop() ?? null;
        if (lastText) {
          endOffset = this.getGlobalOffsetOfTextNode(lastText) + lastText.length;
        } else {
          return this.handleTextSelection(selection);
        }
      } else {
        return this.handleTextSelection(selection);
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
    if (rect.width === 0 && rect.height === 0) {
      const texts = getTextNodesIntersectingRange(range);
      if (texts.length > 0) {
        const first = texts[0];
        const fallbackRange = document.createRange();
        fallbackRange.selectNodeContents(first);
        const fallbackRect = fallbackRange.getBoundingClientRect();
        return {
          x: fallbackRect.left + fallbackRect.width / 2,
          y: fallbackRect.top + window.scrollY - 8,
        };
      }
      return null;
    }
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

    const intersectedTexts = getTextNodesIntersectingRange(range);
    if (intersectedTexts.length === 0) return null;

    let startOffset = -1;
    let endOffset = -1;

    const allContainerTexts = getAllTextNodesUnder(this.container);
    let globalCursor = 0;

    const startText = range.startContainer;
    const endText = range.endContainer;

    for (let i = 0; i < allContainerTexts.length; i++) {
      const text = allContainerTexts[i];
      const len = text.length;

      if (text === startText && isTextNode(startText)) {
        startOffset = globalCursor + range.startOffset;
      } else if (startText.nodeType === Node.ELEMENT_NODE && startText.contains(text)) {
        if (startOffset === -1) {
          const rangeBefore = document.createRange();
          rangeBefore.selectNodeContents(startText);
          rangeBefore.setEnd(range.startContainer, range.startOffset);
          const offsetInParent = rangeBefore.toString().length;
          const parentRange = document.createRange();
          parentRange.selectNodeContents(this.container);
          parentRange.setEnd(startText, 0);
          startOffset = parentRange.toString().length + offsetInParent;
        }
      }

      if (text === endText && isTextNode(endText)) {
        endOffset = globalCursor + range.endOffset;
        if (startOffset === -1) {
          startOffset = globalCursor;
        }
        break;
      } else if (endText.nodeType === Node.ELEMENT_NODE && endText.contains(text)) {
        const textIsLastInRange =
          i === allContainerTexts.length - 1 ||
          !allContainerTexts.slice(i + 1).some((t) => endText.contains(t));
        if (textIsLastInRange) {
          const rangeWithin = document.createRange();
          rangeWithin.selectNodeContents(endText);
          rangeWithin.setEnd(range.endContainer, range.endOffset);
          const offsetInParent = rangeWithin.toString().length;
          const parentRange = document.createRange();
          parentRange.selectNodeContents(this.container);
          parentRange.setEnd(endText, 0);
          endOffset = parentRange.toString().length + offsetInParent;
          if (startOffset === -1) {
            startOffset = globalCursor;
          }
          break;
        }
      }

      globalCursor += len;
    }

    if (startOffset === -1 || endOffset === -1) {
      const preRange = document.createRange();
      preRange.selectNodeContents(this.container);
      preRange.setEnd(range.startContainer, range.startOffset);
      startOffset = preRange.toString().length;

      const fullRange = document.createRange();
      fullRange.selectNodeContents(this.container);
      fullRange.setEnd(range.endContainer, range.endOffset);
      endOffset = fullRange.toString().length;
    }

    const selectedText = range.toString().trim();
    if (!selectedText || endOffset <= startOffset) return null;

    return {
      startOffset,
      endOffset,
      text: selectedText,
    };
  }
}

export const highlightEngine = new HighlightEngine();
