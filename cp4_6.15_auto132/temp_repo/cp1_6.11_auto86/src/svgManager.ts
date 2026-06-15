import type { ShapeType, RecognizedShape, SVGElementData } from './types';
import { eventBus } from './eventBus';

interface UndoEntry {
  id: string;
  changes: Partial<SVGElementData>;
  prevState: Partial<SVGElementData>;
}

export class SVGManager {
  private elements: Map<string, SVGElementData> = new Map();
  private idCounter: number = 0;
  private undoStack: UndoEntry[] = [];
  private redoStack: UndoEntry[] = [];
  private readonly maxUndo: number = 20;

  private generateId(): string {
    this.idCounter++;
    return `svg-${this.idCounter}`;
  }

  addShape(shape: RecognizedShape): SVGElementData {
    const id = this.generateId();
    const element: SVGElementData = {
      id,
      shape,
      scale: 1,
      rotation: 0,
      fillColor: 'transparent',
      strokeColor: '#4A90D9',
      strokeWidth: 2,
      isGroup: false,
      childIds: [],
      offsetX: 0,
      offsetY: 0,
    };
    this.elements.set(id, element);
    eventBus.emit('svg:created', element);
    return element;
  }

  updateElement(id: string, changes: Partial<SVGElementData>): void {
    const element = this.elements.get(id);
    if (!element) return;

    const prevState: Partial<SVGElementData> = {};
    for (const key of Object.keys(changes) as (keyof SVGElementData)[]) {
      prevState[key] = element[key];
    }

    Object.assign(element, changes);
    eventBus.emit('svg:updated', { id, changes, prevState });

    this.undoStack.push({ id, changes, prevState });
    if (this.undoStack.length > this.maxUndo) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  removeElement(id: string): void {
    this.elements.delete(id);
    eventBus.emit('svg:deleted', id);
  }

  getElement(id: string): SVGElementData | undefined {
    return this.elements.get(id);
  }

  getAllElements(): SVGElementData[] {
    return Array.from(this.elements.values());
  }

  groupElements(ids: string[]): SVGElementData {
    const children = ids
      .map((cid) => this.elements.get(cid))
      .filter((c): c is SVGElementData => c !== undefined);

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const child of children) {
      const s = child.shape;
      const left = s.cx - s.width / 2;
      const top = s.cy - s.height / 2;
      const right = s.cx + s.width / 2;
      const bottom = s.cy + s.height / 2;
      if (left < minX) minX = left;
      if (top < minY) minY = top;
      if (right > maxX) maxX = right;
      if (bottom > maxY) maxY = bottom;
    }

    const groupShape: RecognizedShape = {
      type: 'rectangle',
      cx: (minX + maxX) / 2,
      cy: (minY + maxY) / 2,
      width: maxX - minX,
      height: maxY - minY,
      rotation: 0,
    };

    const id = this.generateId();
    const group: SVGElementData = {
      id,
      shape: groupShape,
      scale: 1,
      rotation: 0,
      fillColor: 'transparent',
      strokeColor: '#4A90D9',
      strokeWidth: 2,
      isGroup: true,
      childIds: ids,
      offsetX: 0,
      offsetY: 0,
    };

    this.elements.set(id, group);
    eventBus.emit('svg:grouped', group);
    return group;
  }

  ungroupElement(id: string): string[] {
    const group = this.elements.get(id);
    if (!group || !group.isGroup) return [];

    const childIds = [...group.childIds];
    this.elements.delete(id);
    eventBus.emit('svg:ungrouped', { id, childIds });
    return childIds;
  }

  generateSVGCode(element: SVGElementData): string {
    if (element.isGroup) {
      return this.generateGroupSVG(element);
    }
    return this.generateShapeSVG(element);
  }

  private generateShapeSVG(element: SVGElementData): string {
    const s = element.shape;
    const padding = 10;
    const left = s.cx - s.width / 2 - padding;
    const top = s.cy - s.height / 2 - padding;
    const totalWidth = s.width + padding * 2;
    const totalHeight = s.height + padding * 2;

    const needsTransform = element.scale !== 1 || element.rotation !== 0 || element.offsetX !== 0 || element.offsetY !== 0;
    const transformAttr = needsTransform
      ? ` transform="translate(${s.cx + element.offsetX},${s.cy + element.offsetY}) rotate(${element.rotation}) scale(${element.scale}) translate(${-s.cx},${-s.cy})"`
      : '';

    const styleAttrs = ` fill="${element.fillColor}" stroke="${element.strokeColor}" stroke-width="${element.strokeWidth}"`;

    let shapeMarkup = '';

    switch (s.type as ShapeType) {
      case 'line': {
        const halfLen = s.width / 2;
        const rad = (s.rotation * Math.PI) / 180;
        const x1 = s.cx - halfLen * Math.cos(rad);
        const y1 = s.cy - halfLen * Math.sin(rad);
        const x2 = s.cx + halfLen * Math.cos(rad);
        const y2 = s.cy + halfLen * Math.sin(rad);
        shapeMarkup = `  <line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}"${styleAttrs} />`;
        break;
      }
      case 'rectangle': {
        const rx = s.cx - s.width / 2;
        const ry = s.cy - s.height / 2;
        shapeMarkup = `  <rect x="${rx.toFixed(2)}" y="${ry.toFixed(2)}" width="${s.width.toFixed(2)}" height="${s.height.toFixed(2)}" rx="2"${styleAttrs} />`;
        break;
      }
      case 'circle': {
        const r = s.width / 2;
        shapeMarkup = `  <circle cx="${s.cx.toFixed(2)}" cy="${s.cy.toFixed(2)}" r="${r.toFixed(2)}"${styleAttrs} />`;
        break;
      }
      case 'ellipse': {
        const rx = s.width / 2;
        const ry = s.height / 2;
        shapeMarkup = `  <ellipse cx="${s.cx.toFixed(2)}" cy="${s.cy.toFixed(2)}" rx="${rx.toFixed(2)}" ry="${ry.toFixed(2)}"${styleAttrs} />`;
        break;
      }
      case 'triangle':
      case 'pentagon': {
        const points = (s.vertices || [])
          .map((v) => `${(v.x + s.cx).toFixed(2)},${(v.y + s.cy).toFixed(2)}`)
          .join(' ');
        shapeMarkup = `  <polygon points="${points}"${styleAttrs} />`;
        break;
      }
    }

    return [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${left.toFixed(2)} ${top.toFixed(2)} ${totalWidth.toFixed(2)} ${totalHeight.toFixed(2)}"${transformAttr}>`,
      shapeMarkup,
      '</svg>',
    ].join('\n');
  }

  private generateGroupSVG(element: SVGElementData): string {
    const children = element.childIds
      .map((cid) => this.elements.get(cid))
      .filter((c): c is SVGElementData => c !== undefined);

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const child of children) {
      const s = child.shape;
      const left = s.cx - s.width / 2;
      const top = s.cy - s.height / 2;
      const right = s.cx + s.width / 2;
      const bottom = s.cy + s.height / 2;
      if (left < minX) minX = left;
      if (top < minY) minY = top;
      if (right > maxX) maxX = right;
      if (bottom > maxY) maxY = bottom;
    }

    const padding = 10;
    const viewLeft = minX - padding;
    const viewTop = minY - padding;
    const viewWidth = maxX - minX + padding * 2;
    const viewHeight = maxY - minY + padding * 2;

    const lines: string[] = [];
    lines.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewLeft.toFixed(2)} ${viewTop.toFixed(2)} ${viewWidth.toFixed(2)} ${viewHeight.toFixed(2)}">`);

    for (const child of children) {
      const childSVG = this.generateShapeSVG(child);
      const innerLines = childSVG.split('\n');
      const offsetAttr = (child.offsetX !== 0 || child.offsetY !== 0)
        ? ` transform="translate(${child.offsetX},${child.offsetY})"`
        : '';
      lines.push(`  <g${offsetAttr}>`);
      for (const inner of innerLines) {
        if (inner.startsWith('<svg') || inner.startsWith('</svg')) continue;
        lines.push(`  ${inner}`);
      }
      lines.push('  </g>');
    }

    lines.push('</svg>');
    return lines.join('\n');
  }

  parseSVGCode(code: string): Partial<SVGElementData> | null {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(code, 'image/svg+xml');
      const svgEl = doc.querySelector('svg');
      if (!svgEl) return null;

      const result: Partial<SVGElementData> = {};

      const shapeEl = svgEl.querySelector('line, rect, circle, ellipse, polygon');
      if (shapeEl) {
        const fill = shapeEl.getAttribute('fill');
        const stroke = shapeEl.getAttribute('stroke');
        const strokeWidth = shapeEl.getAttribute('stroke-width');

        if (fill !== null) result.fillColor = fill;
        if (stroke !== null) result.strokeColor = stroke;
        if (strokeWidth !== null) result.strokeWidth = parseFloat(strokeWidth);
      }

      const transform = svgEl.getAttribute('transform') || (shapeEl?.getAttribute('transform') || '');
      if (transform) {
        const scaleMatch = transform.match(/scale\(\s*([\d.-]+)\s*\)/);
        if (scaleMatch) {
          result.scale = parseFloat(scaleMatch[1]);
        }

        const rotateMatch = transform.match(/rotate\(\s*([\d.-]+)\s*\)/);
        if (rotateMatch) {
          result.rotation = parseFloat(rotateMatch[1]);
        }
      }

      const offsetXMatch = code.match(/translate\(\s*([\d.-]+)\s*,\s*([\d.-]+)\s*\)/);
      if (offsetXMatch) {
        result.offsetX = parseFloat(offsetXMatch[1]);
        result.offsetY = parseFloat(offsetXMatch[2]);
      }

      return result;
    } catch {
      return null;
    }
  }

  exportAll(): string {
    const elements = this.getAllElements();
    if (elements.length === 0) {
      return '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const el of elements) {
      const s = el.shape;
      const left = s.cx - s.width / 2;
      const top = s.cy - s.height / 2;
      const right = s.cx + s.width / 2;
      const bottom = s.cy + s.height / 2;
      if (left < minX) minX = left;
      if (top < minY) minY = top;
      if (right > maxX) maxX = right;
      if (bottom > maxY) maxY = bottom;
    }

    const padding = 10;
    const viewLeft = minX - padding;
    const viewTop = minY - padding;
    const viewWidth = maxX - minX + padding * 2;
    const viewHeight = maxY - minY + padding * 2;

    const lines: string[] = [];
    lines.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewLeft.toFixed(2)} ${viewTop.toFixed(2)} ${viewWidth.toFixed(2)} ${viewHeight.toFixed(2)}">`);

    for (const el of elements) {
      if (el.isGroup) {
        const children = el.childIds
          .map((cid) => this.elements.get(cid))
          .filter((c): c is SVGElementData => c !== undefined);
        for (const child of children) {
          lines.push(this.indentSVG(this.generateShapeSVG(child), 2));
        }
      } else {
        lines.push(this.indentSVG(this.generateShapeSVG(el), 2));
      }
    }

    lines.push('</svg>');
    return lines.join('\n');
  }

  private indentSVG(svg: string, depth: number): string {
    const indent = ' '.repeat(depth * 2);
    return svg
      .split('\n')
      .map((line) => `${indent}${line}`)
      .join('\n');
  }

  exportDownload(): void {
    const svgContent = this.exportAll();
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sketch-to-svg.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  undo(): void {
    const entry = this.undoStack.pop();
    if (!entry) return;

    const element = this.elements.get(entry.id);
    if (!element) return;

    const currentState: Partial<SVGElementData> = {};
    for (const key of Object.keys(entry.prevState) as (keyof SVGElementData)[]) {
      currentState[key] = element[key];
    }

    Object.assign(element, entry.prevState);
    this.redoStack.push({ id: entry.id, changes: entry.changes, prevState: currentState });

    eventBus.emit('svg:updated', { id: entry.id, changes: entry.prevState, prevState: entry.changes });
  }

  redo(): void {
    const entry = this.redoStack.pop();
    if (!entry) return;

    const element = this.elements.get(entry.id);
    if (!element) return;

    const prevState: Partial<SVGElementData> = {};
    for (const key of Object.keys(entry.changes) as (keyof SVGElementData)[]) {
      prevState[key] = element[key];
    }

    Object.assign(element, entry.changes);
    this.undoStack.push({ id: entry.id, changes: entry.changes, prevState });

    eventBus.emit('svg:updated', { id: entry.id, changes: entry.changes, prevState });
  }

  getUndoCount(): number {
    return this.undoStack.length;
  }

  getRedoCount(): number {
    return this.redoStack.length;
  }
}
