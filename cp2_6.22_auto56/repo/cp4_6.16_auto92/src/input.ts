export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  mining: boolean;
  mouseWorldX: number;
  mouseWorldY: number;
  mouseScreenX: number;
  mouseScreenY: number;
}

export class KeyboardInput {
  private state: InputState;
  private canvas: HTMLCanvasElement;
  private keys: Set<string> = new Set();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.state = {
      up: false,
      down: false,
      left: false,
      right: false,
      mining: false,
      mouseWorldX: 0,
      mouseWorldY: 0,
      mouseScreenX: 0,
      mouseScreenY: 0
    };
    
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private handleKeyDown(e: KeyboardEvent): void {
    this.keys.add(e.key.toLowerCase());
    this.updateKeyState();
  }

  private handleKeyUp(e: KeyboardEvent): void {
    this.keys.delete(e.key.toLowerCase());
    this.updateKeyState();
  }

  private updateKeyState(): void {
    this.state.up = this.keys.has('w');
    this.state.down = this.keys.has('s');
    this.state.left = this.keys.has('a');
    this.state.right = this.keys.has('d');
  }

  private handleMouseDown(e: MouseEvent): void {
    if (e.button === 0) {
      this.state.mining = true;
    }
  }

  private handleMouseUp(e: MouseEvent): void {
    if (e.button === 0) {
      this.state.mining = false;
    }
  }

  private handleMouseMove(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    this.state.mouseScreenX = e.clientX - rect.left;
    this.state.mouseScreenY = e.clientY - rect.top;
  }

  getState(): InputState {
    return { ...this.state };
  }

  setMouseWorldPosition(x: number, y: number): void {
    this.state.mouseWorldX = x;
    this.state.mouseWorldY = y;
  }

  destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    window.removeEventListener('keyup', this.handleKeyUp.bind(this));
    this.canvas.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this));
  }
}
