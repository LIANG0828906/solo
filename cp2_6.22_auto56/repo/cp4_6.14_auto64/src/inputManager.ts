export class InputManager {
  private keys: Set<string> = new Set();
  private spacePressed: boolean = false;
  private onSpacePressCallbacks: Array<() => void> = [];

  constructor() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  private handleKeyDown(e: KeyboardEvent): void {
    const key = e.key.toLowerCase();
    if (['w', 'a', 's', 'd', ' '].includes(key) ||
        ['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
      e.preventDefault();
    }
    if (key === ' ' && !this.spacePressed) {
      this.spacePressed = true;
      this.onSpacePressCallbacks.forEach(cb => cb());
    }
    this.keys.add(key);
  }

  private handleKeyUp(e: KeyboardEvent): void {
    const key = e.key.toLowerCase();
    this.keys.delete(key);
    if (key === ' ') {
      this.spacePressed = false;
    }
  }

  public isUp(): boolean {
    return this.keys.has('w') || this.keys.has('arrowup');
  }

  public isDown(): boolean {
    return this.keys.has('s') || this.keys.has('arrowdown');
  }

  public isLeft(): boolean {
    return this.keys.has('a') || this.keys.has('arrowleft');
  }

  public isRight(): boolean {
    return this.keys.has('d') || this.keys.has('arrowright');
  }

  public onSpacePress(callback: () => void): void {
    this.onSpacePressCallbacks.push(callback);
  }

  public destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.keys.clear();
    this.onSpacePressCallbacks = [];
  }
}
