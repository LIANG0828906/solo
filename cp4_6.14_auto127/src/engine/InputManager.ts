export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  action: boolean;
}

export class InputManager {
  private inputState: InputState;
  private keyDownHandler: (e: KeyboardEvent) => void;
  private keyUpHandler: (e: KeyboardEvent) => void;

  constructor() {
    this.inputState = {
      up: false,
      down: false,
      left: false,
      right: false,
      action: false,
    };

    this.keyDownHandler = this.handleKeyDown.bind(this);
    this.keyUpHandler = this.handleKeyUp.bind(this);
  }

  init(): void {
    window.addEventListener('keydown', this.keyDownHandler);
    window.addEventListener('keyup', this.keyUpHandler);
  }

  destroy(): void {
    window.removeEventListener('keydown', this.keyDownHandler);
    window.removeEventListener('keyup', this.keyUpHandler);
  }

  private handleKeyDown(e: KeyboardEvent): void {
    switch (e.key.toLowerCase()) {
      case 'w':
      case 'arrowup':
        this.inputState.up = true;
        e.preventDefault();
        break;
      case 's':
      case 'arrowdown':
        this.inputState.down = true;
        e.preventDefault();
        break;
      case 'a':
      case 'arrowleft':
        this.inputState.left = true;
        e.preventDefault();
        break;
      case 'd':
      case 'arrowright':
        this.inputState.right = true;
        e.preventDefault();
        break;
      case ' ':
      case 'enter':
        this.inputState.action = true;
        e.preventDefault();
        break;
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    switch (e.key.toLowerCase()) {
      case 'w':
      case 'arrowup':
        this.inputState.up = false;
        break;
      case 's':
      case 'arrowdown':
        this.inputState.down = false;
        break;
      case 'a':
      case 'arrowleft':
        this.inputState.left = false;
        break;
      case 'd':
      case 'arrowright':
        this.inputState.right = false;
        break;
      case ' ':
      case 'enter':
        this.inputState.action = false;
        break;
    }
  }

  getInput(): InputState {
    return { ...this.inputState };
  }

  consumeAction(): boolean {
    const action = this.inputState.action;
    this.inputState.action = false;
    return action;
  }
}

export const inputManager = new InputManager();
