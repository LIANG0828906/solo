export type ElementType =
  | 'ground'
  | 'platform'
  | 'spike'
  | 'flag'
  | 'enemy-patrol'
  | 'enemy-jump';

export interface LevelElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  enemyType?: 'patrol' | 'jump';
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class Level {
  elements: LevelElement[] = [];

  addElement(element: LevelElement): void {
    this.elements.push(element);
  }

  removeElement(id: string): void {
    this.elements = this.elements.filter((e) => e.id !== id);
  }

  getElementById(id: string): LevelElement | undefined {
    return this.elements.find((e) => e.id === id);
  }

  getElementsOfType(type: ElementType): LevelElement[] {
    return this.elements.filter((e) => e.type === type);
  }

  getSolidRects(): Rect[] {
    return this.elements
      .filter((e) => e.type === 'ground' || e.type === 'platform')
      .map((e) => ({ x: e.x, y: e.y, width: e.width, height: e.height }));
  }

  getSpikeRects(): Rect[] {
    return this.elements
      .filter((e) => e.type === 'spike')
      .map((e) => ({ x: e.x, y: e.y, width: e.width, height: e.height }));
  }

  getFlagRect(): Rect | null {
    const flag = this.elements.find((e) => e.type === 'flag');
    return flag
      ? { x: flag.x, y: flag.y, width: flag.width, height: flag.height }
      : null;
  }

  getEnemyElements(): LevelElement[] {
    return this.elements.filter(
      (e) => e.type === 'enemy-patrol' || e.type === 'enemy-jump'
    );
  }

  clear(): void {
    this.elements = [];
  }

  clone(): Level {
    const l = new Level();
    l.elements = JSON.parse(JSON.stringify(this.elements));
    return l;
  }
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function pointInRect(
  px: number,
  py: number,
  rect: Rect
): boolean {
  return (
    px >= rect.x &&
    px <= rect.x + rect.width &&
    py >= rect.y &&
    py <= rect.y + rect.height
  );
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}
