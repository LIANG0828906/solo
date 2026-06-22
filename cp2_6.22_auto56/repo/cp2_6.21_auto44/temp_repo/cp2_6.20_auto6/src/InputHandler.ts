export type Direction = 'up' | 'down' | 'left' | 'right';
export type GameAction = Direction | 'skill1' | 'skill2' | 'skill3' | 'pause' | 'confirm';

export interface InputCallback {
  (action: GameAction, pressed: boolean): void;
}

const KEY_MAP: Record<string, GameAction> = {
  'ArrowUp': 'up',
  'ArrowDown': 'down',
  'ArrowLeft': 'left',
  'ArrowRight': 'right',
  'w': 'up',
  'W': 'up',
  's': 'down',
  'S': 'down',
  'a': 'left',
  'A': 'left',
  'd': 'right',
  'D': 'right',
  '1': 'skill1',
  '2': 'skill2',
  '3': 'skill3',
  'Escape': 'pause',
  'p': 'pause',
  'P': 'pause',
  'Enter': 'confirm',
  ' ': 'confirm'
};

export class InputHandler {
  private canvas: HTMLCanvasElement;
  private callback: InputCallback;
  private pressedKeys = new Set<GameAction>();
  private touchZones: Map<GameAction, { x: number; y: number; w: number; h: number }> = new Map();
  private activeTouches = new Map<number, GameAction>();

  constructor(canvas: HTMLCanvasElement, callback: InputCallback) {
    this.canvas = canvas;
    this.callback = callback;
    this.bindKeyboard();
    this.bindTouch();
  }

  setTouchZones(zones: { action: GameAction; x: number; y: number; w: number; h: number }[]): void {
    this.touchZones.clear();
    for (const z of zones) {
      this.touchZones.set(z.action, { x: z.x, y: z.y, w: z.w, h: z.h });
    }
  }

  private bindKeyboard(): void {
    window.addEventListener('keydown', (e) => {
      const action = KEY_MAP[e.key];
      if (action && !this.pressedKeys.has(action)) {
        this.pressedKeys.add(action);
        this.callback(action, true);
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
          e.preventDefault();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      const action = KEY_MAP[e.key];
      if (action) {
        this.pressedKeys.delete(action);
        this.callback(action, false);
      }
    });
  }

  private bindTouch(): void {
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const x = (touch.clientX - rect.left) * scaleX;
        const y = (touch.clientY - rect.top) * scaleY;
        const action = this.hitTest(x, y);
        if (action) {
          this.activeTouches.set(touch.identifier, action);
          this.callback(action, true);
        }
      }
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const action = this.activeTouches.get(touch.identifier);
        if (action) {
          this.activeTouches.delete(touch.identifier);
          this.callback(action, false);
        }
      }
    }, { passive: false });

    this.canvas.addEventListener('touchcancel', (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const action = this.activeTouches.get(touch.identifier);
        if (action) {
          this.activeTouches.delete(touch.identifier);
          this.callback(action, false);
        }
      }
    }, { passive: false });
  }

  private hitTest(x: number, y: number): GameAction | null {
    for (const [action, zone] of this.touchZones) {
      if (x >= zone.x && x <= zone.x + zone.w && y >= zone.y && y <= zone.y + zone.h) {
        return action;
      }
    }
    return null;
  }

  isPressed(action: GameAction): boolean {
    return this.pressedKeys.has(action);
  }

  destroy(): void {
    // Event listeners are on window/canvas; in a real app we'd track and remove them.
  }
}
