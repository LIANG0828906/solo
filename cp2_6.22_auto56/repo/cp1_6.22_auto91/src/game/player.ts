export type PlayerState = 'idle' | 'jumping' | 'sliding' | 'dead';

export interface PlayerData {
  state: PlayerState;
  y: number;
  rotation: number;
  isJumping: boolean;
  isSliding: boolean;
  scarfWave: number;
}

export class PlayerController {
  private state: PlayerState = 'idle';
  private y: number = 0;
  private velocityY: number = 0;
  private rotation: number = 0;
  private scarfWave: number = 0;
  private readonly GRAVITY = -40;
  private readonly JUMP_FORCE = 11;
  private readonly JUMP_DURATION = 0.3;
  private readonly SLIDE_DURATION = 0.2;
  private jumpTimer: number = 0;
  private slideTimer: number = 0;

  private actionJustCompleted: boolean = false;
  private onActionCallbacks: Array<() => void> = [];

  constructor() {
    this.setupInput();
  }

  private setupInput(): void {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        this.requestJump();
      }
      if (e.code === 'KeyS') {
        e.preventDefault();
        this.requestSlide();
      }
    });
  }

  requestJump(): boolean {
    if (this.state === 'idle') {
      this.state = 'jumping';
      this.velocityY = this.JUMP_FORCE;
      this.jumpTimer = this.JUMP_DURATION;
      this.rotation = 0;
      this.actionJustCompleted = false;
      return true;
    }
    return false;
  }

  requestSlide(): boolean {
    if (this.state === 'idle') {
      this.state = 'sliding';
      this.slideTimer = this.SLIDE_DURATION;
      this.actionJustCompleted = false;
      return true;
    }
    return false;
  }

  update(deltaTime: number): PlayerData {
    this.scarfWave += deltaTime * 8;

    switch (this.state) {
      case 'jumping':
        this.updateJump(deltaTime);
        break;
      case 'sliding':
        this.updateSlide(deltaTime);
        break;
    }

    return {
      state: this.state,
      y: this.y,
      rotation: this.rotation,
      isJumping: this.state === 'jumping',
      isSliding: this.state === 'sliding',
      scarfWave: this.scarfWave,
    };
  }

  private updateJump(deltaTime: number): void {
    this.jumpTimer -= deltaTime;
    this.velocityY += this.GRAVITY * deltaTime;
    this.y += this.velocityY * deltaTime;
    this.rotation += deltaTime / this.JUMP_DURATION;

    if (this.jumpTimer <= 0 && this.y <= 0) {
      this.y = 0;
      this.velocityY = 0;
      this.rotation = 0;
      this.state = 'idle';
      if (!this.actionJustCompleted) {
        this.actionJustCompleted = true;
        this.notifyActionComplete();
      }
    }
  }

  private updateSlide(deltaTime: number): void {
    this.slideTimer -= deltaTime;

    if (this.slideTimer <= 0) {
      this.state = 'idle';
      if (!this.actionJustCompleted) {
        this.actionJustCompleted = true;
        this.notifyActionComplete();
      }
    }
  }

  onActionComplete(callback: () => void): () => void {
    this.onActionCallbacks.push(callback);
    return () => {
      this.onActionCallbacks = this.onActionCallbacks.filter((cb) => cb !== callback);
    };
  }

  private notifyActionComplete(): void {
    this.onActionCallbacks.forEach((cb) => cb());
  }

  reset(): void {
    this.state = 'idle';
    this.y = 0;
    this.velocityY = 0;
    this.rotation = 0;
    this.jumpTimer = 0;
    this.slideTimer = 0;
  }

  kill(): void {
    this.state = 'dead';
  }

  isAlive(): boolean {
    return this.state !== 'dead';
  }

  isPerformingAction(): boolean {
    return this.state === 'jumping' || this.state === 'sliding';
  }
}
