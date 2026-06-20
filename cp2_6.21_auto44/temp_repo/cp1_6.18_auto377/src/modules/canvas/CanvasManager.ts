import type { CanvasElement, CanvasSnapshot, LibraryItem } from '../../types';
import { useCanvasStore } from '../../store/useCanvasStore';

export class CanvasManager {
  static readonly CANVAS_WIDTH = 800;
  static readonly CANVAS_HEIGHT = 600;

  static addElement(item: LibraryItem, x?: number, y?: number): void {
    useCanvasStore.getState().addElement(item, x, y);
  }

  static removeElement(id: string): void {
    useCanvasStore.getState().removeElement(id);
  }

  static removeSelected(): void {
    useCanvasStore.getState().removeSelected();
  }

  static moveElement(id: string, x: number, y: number): void {
    const clampedX = Math.max(0, Math.min(CanvasManager.CANVAS_WIDTH, x));
    const clampedY = Math.max(0, Math.min(CanvasManager.CANVAS_HEIGHT, y));
    useCanvasStore.getState().moveElement(id, clampedX, clampedY);
  }

  static scaleElement(
    id: string,
    handle: string,
    deltaX: number,
    deltaY: number,
    preserveAspect: boolean = true
  ): void {
    const el = CanvasManager.getElementById(id);
    if (!el) return;

    let newWidth = el.width;
    let newHeight = el.height;
    let newX = el.x;
    let newY = el.y;
    const aspect = el.width / el.height;

    switch (handle) {
      case 'se':
        newWidth = el.width + deltaX;
        newHeight = preserveAspect ? newWidth / aspect : el.height + deltaY;
        if (preserveAspect) newHeight = newWidth / aspect;
        break;
      case 'sw':
        newWidth = el.width - deltaX;
        newHeight = preserveAspect ? newWidth / aspect : el.height + deltaY;
        newX = el.x + (el.width - newWidth);
        if (preserveAspect) newHeight = newWidth / aspect;
        break;
      case 'ne':
        newWidth = el.width + deltaX;
        newHeight = preserveAspect ? newWidth / aspect : el.height - deltaY;
        newY = el.y + (el.height - newHeight);
        if (preserveAspect) newHeight = newWidth / aspect;
        break;
      case 'nw':
        newWidth = el.width - deltaX;
        newHeight = preserveAspect ? newWidth / aspect : el.height - deltaY;
        newX = el.x + (el.width - newWidth);
        newY = el.y + (el.height - newHeight);
        if (preserveAspect) newHeight = newWidth / aspect;
        break;
      case 'n':
        newHeight = el.height - deltaY;
        newY = el.y + (el.height - newHeight);
        if (preserveAspect) {
          newWidth = newHeight * aspect;
          newX = el.x + (el.width - newWidth) / 2;
        }
        break;
      case 's':
        newHeight = el.height + deltaY;
        if (preserveAspect) {
          newWidth = newHeight * aspect;
          newX = el.x + (el.width - newWidth) / 2;
        }
        break;
      case 'e':
        newWidth = el.width + deltaX;
        if (preserveAspect) {
          newHeight = newWidth / aspect;
          newY = el.y + (el.height - newHeight) / 2;
        }
        break;
      case 'w':
        newWidth = el.width - deltaX;
        newX = el.x + (el.width - newWidth);
        if (preserveAspect) {
          newHeight = newWidth / aspect;
          newY = el.y + (el.height - newHeight) / 2;
        }
        break;
    }

    if (newWidth < 20) newWidth = 20;
    if (newHeight < 20) newHeight = 20;

    useCanvasStore.getState().scaleElement(id, newWidth, newHeight);
    if (newX !== el.x || newY !== el.y) {
      useCanvasStore.getState().moveElement(id, newX, newY);
    }
  }

  static rotateElement(id: string, angle: number, snap: boolean = true): void {
    let finalAngle = angle;
    if (snap) {
      finalAngle = Math.round(angle / 15) * 15;
    }
    finalAngle = ((finalAngle % 360) + 360) % 360;
    useCanvasStore.getState().rotateElement(id, finalAngle);
  }

  static selectElement(id: string, multi: boolean = false): void {
    useCanvasStore.getState().selectElement(id, multi);
  }

  static clearSelection(): void {
    useCanvasStore.getState().clearSelection();
  }

  static bringToFront(id: string): void {
    useCanvasStore.getState().bringToFront(id);
  }

  static getElementById(id: string): CanvasElement | undefined {
    return useCanvasStore.getState().elements.find((el) => el.id === id);
  }

  static getSelectedElements(): CanvasElement[] {
    const state = useCanvasStore.getState();
    return state.elements.filter((el) => state.selectedIds.includes(el.id));
  }

  static getSnapshot(): CanvasSnapshot {
    const state = useCanvasStore.getState();
    return {
      elements: [...state.elements].sort((a, b) => a.zIndex - b.zIndex),
      width: CanvasManager.CANVAS_WIDTH,
      height: CanvasManager.CANVAS_HEIGHT,
    };
  }

  static getAllElements(): CanvasElement[] {
    return useCanvasStore.getState().elements;
  }
}
