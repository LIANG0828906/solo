export class InputManager {
  private keys: Set<string> = new Set();
  private justPressed: Set<string> = new Set();
  private lastPressTime: Map<string, number> = new Map();
  private debounceDelay: number = 50;

  constructor() {
    this.setupListeners();
  }

  private setupListeners(): void {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      e.preventDefault();
      const key = this.normalizeKey(e);
      const now = performance.now();
      const lastTime = this.lastPressTime.get(key) || 0;

      if (now - lastTime > this.debounceDelay) {
        if (!this.keys.has(key)) {
          this.justPressed.add(key);
        }
        this.keys.add(key);
        this.lastPressTime.set(key, now);
      }
    });

    window.addEventListener('keyup', (e: KeyboardEvent) => {
      e.preventDefault();
      const key = this.normalizeKey(e);
      this.keys.delete(key);
    });
  }

  private normalizeKey(e: KeyboardEvent): string {
    const key = e.key.toLowerCase();
    if (e.key === ' ') return 'space';
    if (e.key === 'ArrowUp') return 'arrowup';
    if (e.key === 'ArrowDown') return 'arrowdown';
    if (e.key === 'ArrowLeft') return 'arrowleft';
    if (e.key === 'ArrowRight') return 'arrowright';
    if (key === '0' && e.location === 3) return 'numpad0';
    return key;
  }

  isKeyDown(key: string): boolean {
    return this.keys.has(key.toLowerCase());
  }

  isKeyJustPressed(key: string): boolean {
    const k = key.toLowerCase();
    if (this.justPressed.has(k)) {
      return true;
    }
    return false;
  }

  endFrame(): void {
    this.justPressed.clear();
  }

  getPlayer1Input(): { up: boolean; down: boolean; left: boolean; right: boolean; fire: boolean } {
    return {
      up: this.isKeyDown('w'),
      down: this.isKeyDown('s'),
      left: this.isKeyDown('a'),
      right: this.isKeyDown('d'),
      fire: this.isKeyDown('j')
    };
  }

  getPlayer2Input(): { up: boolean; down: boolean; left: boolean; right: boolean; fire: boolean } {
    return {
      up: this.isKeyDown('arrowup'),
      down: this.isKeyDown('arrowdown'),
      left: this.isKeyDown('arrowleft'),
      right: this.isKeyDown('arrowright'),
      fire: this.isKeyDown('numpad0')
    };
  }

  isSpacePressed(): boolean {
    return this.isKeyJustPressed('space');
  }
}
