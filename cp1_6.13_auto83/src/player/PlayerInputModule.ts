import { SoundType } from '../audio/AudioModule';

export interface KeyPress {
  player: number;
  type: SoundType;
  position: { x: number; y: number; z: number };
}

export class PlayerInputModule {
  private keys: Map<string, { player: number; type: SoundType; position: { x: number; y: number; z: number } }>;
  private activeKeys: Set<string> = new Set();
  private onKeyPress?: (press: KeyPress) => void;
  private onKeyRelease?: (key: string) => void;

  constructor() {
    this.keys = new Map([
      ['a', { player: 0, type: 'kick', position: { x: -6, y: 0, z: -4 } }],
      ['s', { player: 0, type: 'hihat', position: { x: -4, y: 0, z: -4 } }],
      ['k', { player: 1, type: 'kick', position: { x: 6, y: 0, z: -4 } }],
      ['l', { player: 1, type: 'hihat', position: { x: 4, y: 0, z: -4 } }],
    ]);
  }

  setCallbacks(onKeyPress: (press: KeyPress) => void, onKeyRelease: (key: string) => void): void {
    this.onKeyPress = onKeyPress;
    this.onKeyRelease = onKeyRelease;
  }

  startListening(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  stopListening(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    const key = event.key.toLowerCase();
    
    if (this.activeKeys.has(key)) return;
    
    const keyInfo = this.keys.get(key);
    if (keyInfo) {
      event.preventDefault();
      this.activeKeys.add(key);
      
      this.onKeyPress?.({
        player: keyInfo.player,
        type: keyInfo.type,
        position: { ...keyInfo.position }
      });
      
      this.triggerKeyAnimation(key);
    }
    
    if (key === ' ' || key === 'spacebar') {
      event.preventDefault();
    }
  };

  private handleKeyUp = (event: KeyboardEvent): void => {
    const key = event.key.toLowerCase();
    
    if (this.keys.has(key)) {
      this.activeKeys.delete(key);
      this.onKeyRelease?.(key);
      this.clearKeyAnimation(key);
    }
  };

  private triggerKeyAnimation(key: string): void {
    const keyElement = document.getElementById(`key-${key}`);
    if (keyElement) {
      keyElement.classList.add('active');
    }

    const playerGlow = document.getElementById(key === 'a' || key === 's' ? 'player1-glow' : 'player2-glow');
    if (playerGlow) {
      playerGlow.classList.add('pulse');
      setTimeout(() => playerGlow.classList.remove('pulse'), 300);
    }
  }

  private clearKeyAnimation(key: string): void {
    const keyElement = document.getElementById(`key-${key}`);
    if (keyElement) {
      keyElement.classList.remove('active');
    }
  }

  isKeyActive(key: string): boolean {
    return this.activeKeys.has(key.toLowerCase());
  }
}
