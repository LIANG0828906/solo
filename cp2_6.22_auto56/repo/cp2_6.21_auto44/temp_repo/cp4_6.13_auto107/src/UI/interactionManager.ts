import { sceneRenderer } from '../RenderModule/sceneRenderer';
import { measurementTool } from '../DataModule/measurementTool';

class InteractionManager {
  private domElement!: HTMLElement;
  private measureActive = false;
  private downPos: { x: number; y: number } | null = null;
  private moved = false;
  private bound = false;

  init(domElement: HTMLElement): void {
    this.domElement = domElement;
    if (this.bound) return;
    this.bound = true;

    domElement.addEventListener('pointermove', this.onPointerMove);
    domElement.addEventListener('pointerdown', this.onPointerDown);
    domElement.addEventListener('pointerup', this.onPointerUp);
    domElement.addEventListener('pointerleave', this.onPointerLeave);

    window.addEventListener('measure-mode-changed', ((e: CustomEvent<{ active: boolean }>) => {
      this.measureActive = e.detail.active;
    }) as EventListener);
  }

  private onPointerMove = (e: PointerEvent): void => {
    if (this.downPos) {
      const dx = e.clientX - this.downPos.x;
      const dy = e.clientY - this.downPos.y;
      if (Math.hypot(dx, dy) > 4) {
        this.moved = true;
      }
    }
    if (this.measureActive || !this.moved) {
      sceneRenderer.setHoverFromScreen(e.clientX, e.clientY);
    }
  };

  private onPointerDown = (e: PointerEvent): void => {
    if (e.button !== 0) return;
    this.downPos = { x: e.clientX, y: e.clientY };
    this.moved = false;
  };

  private onPointerUp = (e: PointerEvent): void => {
    if (e.button !== 0) return;
    const down = this.downPos;
    this.downPos = null;
    if (!down) return;
    const dx = e.clientX - down.x;
    const dy = e.clientY - down.y;
    const isClick = Math.hypot(dx, dy) <= 4 && !this.moved;
    if (isClick && this.measureActive) {
      const point = sceneRenderer.raycastFromScreen(e.clientX, e.clientY);
      if (point) {
        measurementTool.addPoint(point);
      }
    }
  };

  private onPointerLeave = (): void => {
    this.downPos = null;
  };

  dispose(): void {
    if (!this.bound) return;
    this.bound = false;
    this.domElement.removeEventListener('pointermove', this.onPointerMove);
    this.domElement.removeEventListener('pointerdown', this.onPointerDown);
    this.domElement.removeEventListener('pointerup', this.onPointerUp);
    this.domElement.removeEventListener('pointerleave', this.onPointerLeave);
  }
}

export const interactionManager = new InteractionManager();
