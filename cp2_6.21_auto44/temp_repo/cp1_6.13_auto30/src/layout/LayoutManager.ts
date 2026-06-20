import { v4 as uuidv4 } from 'uuid';
import {
  ElementType,
  PosterElement,
  TextElement,
  ImageElement,
  LayoutState,
  LayoutStateCallback,
} from '../types';

export class LayoutManager {
  private state: LayoutState;
  private subscribers: Set<LayoutStateCallback>;

  constructor() {
    this.state = {
      elements: [],
      selectedId: null,
      backgroundColor: '#FFFFFF',
    };
    this.subscribers = new Set();
  }

  private notify(): void {
    this.subscribers.forEach((cb) => cb({ ...this.state, elements: [...this.state.elements] }));
  }

  public subscribe(callback: LayoutStateCallback): () => void {
    this.subscribers.add(callback);
    callback({ ...this.state, elements: [...this.state.elements] });
    return () => {
      this.subscribers.delete(callback);
    };
  }

  public addTextElement(x: number, y: number): TextElement {
    const element: TextElement = {
      id: uuidv4(),
      type: ElementType.TEXT,
      x: x - 100,
      y: y - 20,
      width: 200,
      height: 40,
      rotation: 0,
      zIndex: this.state.elements.length,
      content: '双击编辑文字',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: 24,
      color: '#2B3A4D',
      lineHeight: 1.5,
      textAlign: 'left',
    };
    this.state.elements.push(element);
    this.state.selectedId = element.id;
    this.notify();
    return element;
  }

  public addImageElement(x: number, y: number): ImageElement {
    const element: ImageElement = {
      id: uuidv4(),
      type: ElementType.IMAGE,
      x: x - 100,
      y: y - 75,
      width: 200,
      height: 150,
      rotation: 0,
      zIndex: this.state.elements.length,
      src: '',
      objectFit: 'contain',
    };
    this.state.elements.push(element);
    this.state.selectedId = element.id;
    this.notify();
    return element;
  }

  public updateElement(id: string, patch: Partial<PosterElement>): void {
    const idx = this.state.elements.findIndex((el) => el.id === id);
    if (idx === -1) return;
    (this.state.elements[idx] as PosterElement) = {
      ...this.state.elements[idx],
      ...patch,
    } as PosterElement;
    this.notify();
  }

  public deleteElement(id: string): void {
    const idx = this.state.elements.findIndex((el) => el.id === id);
    if (idx === -1) return;
    this.state.elements.splice(idx, 1);
    this.state.elements.forEach((el, i) => {
      el.zIndex = i;
    });
    if (this.state.selectedId === id) {
      this.state.selectedId = null;
    }
    this.notify();
  }

  public selectElement(id: string | null): void {
    this.state.selectedId = id;
    this.notify();
  }

  public moveElement(id: string, x: number, y: number): void {
    const el = this.state.elements.find((e) => e.id === id);
    if (!el) return;
    el.x = x;
    el.y = y;
    this.notify();
  }

  public resizeElement(id: string, width: number, height: number): void {
    const el = this.state.elements.find((e) => e.id === id);
    if (!el) return;
    el.width = Math.max(20, width);
    el.height = Math.max(20, height);
    this.notify();
  }

  public rotateElement(id: string, angle: number): void {
    const el = this.state.elements.find((e) => e.id === id);
    if (!el) return;
    el.rotation = angle;
    this.notify();
  }

  public reorderElements(fromIndex: number, toIndex: number): void {
    if (fromIndex === toIndex) return;
    if (fromIndex < 0 || fromIndex >= this.state.elements.length) return;
    if (toIndex < 0 || toIndex >= this.state.elements.length) return;

    const sorted = [...this.state.elements].sort((a, b) => a.zIndex - b.zIndex);
    const [moved] = sorted.splice(fromIndex, 1);
    sorted.splice(toIndex, 0, moved);
    sorted.forEach((el, i) => {
      el.zIndex = i;
    });
    this.state.elements = [...sorted];
    this.notify();
  }

  public setBackgroundColor(color: string): void {
    this.state.backgroundColor = color;
    this.notify();
  }

  public getSnapshot(): LayoutState {
    return JSON.parse(JSON.stringify(this.state));
  }

  public getElements(): PosterElement[] {
    return [...this.state.elements];
  }

  public getSelectedElement(): PosterElement | null {
    if (!this.state.selectedId) return null;
    return this.state.elements.find((el) => el.id === this.state.selectedId) ?? null;
  }

  public getState(): LayoutState {
    return { ...this.state, elements: [...this.state.elements] };
  }
}
