import { useCanvasStore } from './store';
import type { CanvasRenderer } from './renderer';

type InteractionMode = 'none' | 'pan' | 'drag' | 'pinch';

interface PinchState {
  isActive: boolean;
  startDistance: number;
  startScale: number;
  startMidX: number;
  startMidY: number;
}

export class InteractionManager {
  private canvas: HTMLCanvasElement;
  private renderer: CanvasRenderer;
  private mode: InteractionMode = 'none';

  private lastX: number = 0;
  private lastY: number = 0;

  private dragEmojiId: string | null = null;
  private dragOffsetX: number = 0;
  private dragOffsetY: number = 0;

  private longPressTimer: number | null = null;
  private longPressTriggered: boolean = false;

  private pinchState: PinchState = {
    isActive: false,
    startDistance: 0,
    startScale: 1,
    startMidX: 0,
    startMidY: 0
  };

  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchStartTime: number = 0;
  private touchMoved: boolean = false;

  private scaleAnimation: number = 0;
  private animationFrameId: number | null = null;

  constructor(canvas: HTMLCanvasElement, renderer: CanvasRenderer) {
    this.canvas = canvas;
    this.renderer = renderer;

    this.bindEvents();
  }

  private bindEvents(): void {
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mouseup', this.handleMouseUp);

    this.canvas.addEventListener('wheel', this.handleWheel, { passive: false });

    this.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd);
    this.canvas.addEventListener('touchcancel', this.handleTouchEnd);
  }

  private handleMouseDown = (e: MouseEvent): void => {
    if (e.button !== 0) return;

    const rect = this.canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const state = useCanvasStore.getState();
    const { x, y } = state.screenToCanvas(screenX, screenY);

    const emoji = state.getEmojiAtPoint(x, y);

    if (emoji) {
      this.mode = 'drag';
      this.dragEmojiId = emoji.id;
      this.dragOffsetX = x - emoji.x;
      this.dragOffsetY = y - emoji.y;

      state.bringToFront(emoji.id);

      this.startLongPress(screenX, screenY, emoji.id);
      this.startScaleAnimation();
    } else {
      this.mode = 'pan';
    }

    this.lastX = e.clientX;
    this.lastY = e.clientY;

    e.preventDefault();
  };

  private handleMouseMove = (e: MouseEvent): void => {
    if (this.mode === 'none') return;

    const dx = e.clientX - this.lastX;
    const dy = e.clientY - this.lastY;

    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      this.cancelLongPress();
    }

    if (this.mode === 'pan') {
      const state = useCanvasStore.getState();
      state.setViewport({
        offsetX: state.viewport.offsetX + dx,
        offsetY: state.viewport.offsetY + dy
      });
    } else if (this.mode === 'drag' && this.dragEmojiId) {
      const state = useCanvasStore.getState();
      const rect = this.canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const { x, y } = state.screenToCanvas(screenX, screenY);

      state.updateEmojiPosition(
        this.dragEmojiId,
        x - this.dragOffsetX,
        y - this.dragOffsetY
      );

      this.renderer.setDraggingEmoji(this.dragEmojiId, this.scaleAnimation);
    }

    this.lastX = e.clientX;
    this.lastY = e.clientY;
  };

  private handleMouseUp = (e: MouseEvent): void => {
    if (this.mode === 'none') return;

    this.cancelLongPress();
    this.stopScaleAnimation();

    if (this.mode === 'drag' && this.dragEmojiId && !this.longPressTriggered) {
      const state = useCanvasStore.getState();
      const rect = this.canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const { x, y } = state.screenToCanvas(screenX, screenY);
      const emoji = state.getEmojiAtPoint(x, y);

      if (emoji && emoji.id === this.dragEmojiId) {
        const dist = Math.sqrt(
          Math.pow(x - (emoji.x + this.dragOffsetX), 2) +
          Math.pow(y - (emoji.y + this.dragOffsetY), 2)
        );
        if (dist < 5) {
          state.setSelectedEmojiId(this.dragEmojiId);
        }
      }

      this.renderer.setDraggingEmoji(null);
    }

    if (this.mode === 'pan' && !this.longPressTriggered) {
      const state = useCanvasStore.getState();
      const rect = this.canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const { x, y } = state.screenToCanvas(screenX, screenY);

      const emoji = state.getEmojiAtPoint(x, y);
      if (!emoji) {
        state.addEmoji(x, y);
        state.setSelectedEmojiId(null);
      }
    }

    this.mode = 'none';
    this.dragEmojiId = null;
    this.longPressTriggered = false;
  };

  private handleWheel = (e: WheelEvent): void => {
    e.preventDefault();

    const state = useCanvasStore.getState();
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const { x: canvasX, y: canvasY } = state.screenToCanvas(mouseX, mouseY);

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(5, state.viewport.scale * delta));

    const newOffsetX = mouseX - canvasX * newScale;
    const newOffsetY = mouseY - canvasY * newScale;

    state.setViewport({
      scale: newScale,
      offsetX: newOffsetX,
      offsetY: newOffsetY
    });
  };

  private handleTouchStart = (e: TouchEvent): void => {
    e.preventDefault();

    if (e.touches.length === 1) {
      const touch = e.touches[0]!;
      const rect = this.canvas.getBoundingClientRect();
      const screenX = touch.clientX - rect.left;
      const screenY = touch.clientY - rect.top;

      const state = useCanvasStore.getState();
      const { x, y } = state.screenToCanvas(screenX, screenY);

      const emoji = state.getEmojiAtPoint(x, y);

      this.touchStartX = touch.clientX;
      this.touchStartY = touch.clientY;
      this.touchStartTime = Date.now();
      this.touchMoved = false;

      if (emoji) {
        this.mode = 'drag';
        this.dragEmojiId = emoji.id;
        this.dragOffsetX = x - emoji.x;
        this.dragOffsetY = y - emoji.y;
        state.bringToFront(emoji.id);

        this.startLongPress(screenX, screenY, emoji.id);
        this.startScaleAnimation();
      } else {
        this.mode = 'pan';
      }

      this.lastX = touch.clientX;
      this.lastY = touch.clientY;
    } else if (e.touches.length === 2) {
      this.cancelLongPress();
      this.mode = 'pinch';
      this.touchMoved = true;

      const touch1 = e.touches[0]!;
      const touch2 = e.touches[1]!;

      const dx = touch2.clientX - touch1.clientX;
      const dy = touch2.clientY - touch1.clientY;
      this.pinchState.startDistance = Math.sqrt(dx * dx + dy * dy);
      this.pinchState.startScale = useCanvasStore.getState().viewport.scale;

      this.pinchState.startMidX = (touch1.clientX + touch2.clientX) / 2;
      this.pinchState.startMidY = (touch1.clientY + touch2.clientY) / 2;
      this.pinchState.isActive = true;
    }
  };

  private handleTouchMove = (e: TouchEvent): void => {
    e.preventDefault();

    if (this.mode === 'pinch' && e.touches.length === 2) {
      const touch1 = e.touches[0]!;
      const touch2 = e.touches[1]!;

      const dx = touch2.clientX - touch1.clientX;
      const dy = touch2.clientY - touch1.clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const scale = distance / this.pinchState.startDistance;
      const newScale = Math.max(0.1, Math.min(5, this.pinchState.startScale * scale));

      const state = useCanvasStore.getState();
      const rect = this.canvas.getBoundingClientRect();

      const midX = (touch1.clientX + touch2.clientX) / 2 - rect.left;
      const midY = (touch1.clientY + touch2.clientY) / 2 - rect.top;

      const { x: canvasX, y: canvasY } = state.screenToCanvas(
        this.pinchState.startMidX - rect.left,
        this.pinchState.startMidY - rect.top
      );

      const newOffsetX = midX - canvasX * newScale;
      const newOffsetY = midY - canvasY * newScale;

      state.setViewport({
        scale: newScale,
        offsetX: newOffsetX,
        offsetY: newOffsetY
      });
    } else if (this.mode === 'pan') {
      const touch = e.touches[0]!;
      const dx = touch.clientX - this.lastX;
      const dy = touch.clientY - this.lastY;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        this.touchMoved = true;
      }

      const state = useCanvasStore.getState();
      state.setViewport({
        offsetX: state.viewport.offsetX + dx,
        offsetY: state.viewport.offsetY + dy
      });

      this.lastX = touch.clientX;
      this.lastY = touch.clientY;
    } else if (this.mode === 'drag' && this.dragEmojiId) {
      const touch = e.touches[0]!;
      const dx = touch.clientX - this.lastX;
      const dy = touch.clientY - this.lastY;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        this.touchMoved = true;
        this.cancelLongPress();
      }

      const state = useCanvasStore.getState();
      const rect = this.canvas.getBoundingClientRect();
      const screenX = touch.clientX - rect.left;
      const screenY = touch.clientY - rect.top;
      const { x, y } = state.screenToCanvas(screenX, screenY);

      state.updateEmojiPosition(
        this.dragEmojiId,
        x - this.dragOffsetX,
        y - this.dragOffsetY
      );

      this.renderer.setDraggingEmoji(this.dragEmojiId, this.scaleAnimation);

      this.lastX = touch.clientX;
      this.lastY = touch.clientY;
    }
  };

  private handleTouchEnd = (e: TouchEvent): void => {
    if (e.touches.length === 0) {
      this.cancelLongPress();
      this.stopScaleAnimation();
      this.pinchState.isActive = false;

      if (this.mode === 'drag' && this.dragEmojiId && !this.longPressTriggered) {
        this.renderer.setDraggingEmoji(null);

        if (!this.touchMoved && Date.now() - this.touchStartTime < 300) {
          const state = useCanvasStore.getState();
          state.setSelectedEmojiId(this.dragEmojiId);
        }
      }

      if (this.mode === 'pan' && !this.touchMoved && !this.longPressTriggered) {
        if (Date.now() - this.touchStartTime < 300) {
          const state = useCanvasStore.getState();
          const rect = this.canvas.getBoundingClientRect();
          const screenX = this.touchStartX - rect.left;
          const screenY = this.touchStartY - rect.top;
          const { x, y } = state.screenToCanvas(screenX, screenY);

          const emoji = state.getEmojiAtPoint(x, y);
          if (!emoji) {
            state.addEmoji(x, y);
            state.setSelectedEmojiId(null);
          }
        }
      }

      this.mode = 'none';
      this.dragEmojiId = null;
      this.longPressTriggered = false;
    } else if (e.touches.length === 1) {
      this.mode = 'pan';
      this.pinchState.isActive = false;
      const touch = e.touches[0]!;
      this.lastX = touch.clientX;
      this.lastY = touch.clientY;
    }
  };

  private startLongPress(x: number, y: number, emojiId: string): void {
    this.cancelLongPress();

    this.longPressTimer = window.setTimeout(() => {
      this.longPressTriggered = true;
      this.renderer.setRingMenu(emojiId, x, y, 0.1);
    }, 500);
  }

  private cancelLongPress(): void {
    if (this.longPressTimer !== null) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    if (this.longPressTriggered) {
      this.renderer.setRingMenu(null, 0, 0, 0);
    }
  }

  private startScaleAnimation(): void {
    this.scaleAnimation = 0;
    this.animateScale();
  }

  private stopScaleAnimation(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.scaleAnimation = 0;
  }

  private animateScale = (): void => {
    this.scaleAnimation += 0.1;

    if (this.scaleAnimation >= 1) {
      this.scaleAnimation = 1;
    }

    if (this.dragEmojiId && this.mode === 'drag') {
      this.renderer.setDraggingEmoji(this.dragEmojiId, this.scaleAnimation);
    }

    if (this.scaleAnimation < 1) {
      this.animationFrameId = requestAnimationFrame(this.animateScale);
    }
  };

  destroy(): void {
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('wheel', this.handleWheel);
    this.canvas.removeEventListener('touchstart', this.handleTouchStart);
    this.canvas.removeEventListener('touchmove', this.handleTouchMove);
    this.canvas.removeEventListener('touchend', this.handleTouchEnd);
    this.canvas.removeEventListener('touchcancel', this.handleTouchEnd);

    this.cancelLongPress();
    this.stopScaleAnimation();
  }
}
