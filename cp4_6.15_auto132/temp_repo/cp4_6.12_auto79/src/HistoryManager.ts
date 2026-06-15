export interface DrawAction {
  id: string;
  userId: string;
  type: 'pixel' | 'fill';
  x: number;
  y: number;
  color: string;
  timestamp: number;
  pixels?: { x: number; y: number; color: string }[];
}

interface HistoryNode {
  action: DrawAction;
  prev: HistoryNode | null;
  next: HistoryNode | null;
}

export type PlaybackSpeed = 0.5 | 1 | 1.5 | 2 | 3 | 4;

export class HistoryManager {
  private head: HistoryNode | null = null;
  private tail: HistoryNode | null = null;
  private current: HistoryNode | null = null;
  private currentStep: number = 0;
  private totalSteps: number = 0;
  private isPlaying: boolean = false;
  private speed: PlaybackSpeed = 1;
  private animationFrameId: number | null = null;
  private lastStepTime: number = 0;
  private stepInterval: number = 50;

  private onStepCallback: ((action: DrawAction, stepIndex: number) => void) | null = null;
  private onStateChangeCallback: ((state: { step: number; total: number; isPlaying: boolean }) => void) | null = null;

  constructor() {}

  addAction(action: DrawAction): void {
    const node: HistoryNode = {
      action,
      prev: this.tail,
      next: null,
    };

    if (!this.head) {
      this.head = node;
      this.tail = node;
      this.current = node;
    } else {
      if (this.tail) {
        this.tail.next = node;
      }
      this.tail = node;
    }

    this.totalSteps++;

    if (!this.isPlaying) {
      this.current = node;
      this.currentStep = this.totalSteps;
    }
  }

  getTotalSteps(): number {
    return this.totalSteps;
  }

  getCurrentStep(): number {
    return this.currentStep;
  }

  setOnStep(callback: (action: DrawAction, stepIndex: number) => void): void {
    this.onStepCallback = callback;
  }

  setOnStateChange(callback: (state: { step: number; total: number; isPlaying: boolean }) => void): void {
    this.onStateChangeCallback = callback;
  }

  setSpeed(speed: PlaybackSpeed): void {
    this.speed = speed;
  }

  getSpeed(): PlaybackSpeed {
    return this.speed;
  }

  play(): void {
    if (this.isPlaying) return;
    if (this.currentStep >= this.totalSteps) {
      this.seek(0);
    }
    this.isPlaying = true;
    this.lastStepTime = performance.now();
    this.animationLoop();
    this.notifyStateChange();
  }

  pause(): void {
    this.isPlaying = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.notifyStateChange();
  }

  togglePlay(): void {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  next(): void {
    if (this.current && this.current.next) {
      this.current = this.current.next;
      this.currentStep++;
      if (this.onStepCallback) {
        this.onStepCallback(this.current.action, this.currentStep);
      }
      this.notifyStateChange();
    }
  }

  prev(): void {
    if (this.current && this.current.prev) {
      this.current = this.current.prev;
      this.currentStep--;
      if (this.onStepCallback) {
        this.onStepCallback(this.current.action, this.currentStep);
      }
      this.notifyStateChange();
    }
  }

  seek(step: number): void {
    if (step < 0 || step > this.totalSteps) return;
    
    const wasPlaying = this.isPlaying;
    if (wasPlaying) {
      this.pause();
    }

    let node = this.head;
    let i = 1;
    while (node && i < step) {
      node = node.next;
      i++;
    }

    this.current = step === 0 ? null : node;
    this.currentStep = step;

    if (wasPlaying && step < this.totalSteps) {
      this.play();
    }
    
    this.notifyStateChange();
  }

  getActionAt(step: number): DrawAction | null {
    if (step <= 0 || step > this.totalSteps) return null;
    
    let node = this.head;
    let i = 1;
    while (node && i < step) {
      node = node.next;
      i++;
    }
    return node ? node.action : null;
  }

  getAllActions(): DrawAction[] {
    const actions: DrawAction[] = [];
    let node = this.head;
    while (node) {
      actions.push(node.action);
      node = node.next;
    }
    return actions;
  }

  getActionsUpTo(step: number): DrawAction[] {
    const actions: DrawAction[] = [];
    let node = this.head;
    let i = 1;
    while (node && i <= step) {
      actions.push(node.action);
      node = node.next;
      i++;
    }
    return actions;
  }

  private animationLoop = (): void => {
    if (!this.isPlaying) return;

    const now = performance.now();
    const interval = this.stepInterval / this.speed;

    if (now - this.lastStepTime >= interval) {
      if (this.current && this.current.next) {
        this.current = this.current.next;
        this.currentStep++;
        if (this.onStepCallback) {
          this.onStepCallback(this.current.action, this.currentStep);
        }
        this.notifyStateChange();
        this.lastStepTime = now;
      } else if (this.currentStep >= this.totalSteps) {
        this.pause();
        return;
      }
    }

    this.animationFrameId = requestAnimationFrame(this.animationLoop);
  };

  private notifyStateChange(): void {
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback({
        step: this.currentStep,
        total: this.totalSteps,
        isPlaying: this.isPlaying,
      });
    }
  }

  reset(): void {
    this.pause();
    this.head = null;
    this.tail = null;
    this.current = null;
    this.currentStep = 0;
    this.totalSteps = 0;
    this.notifyStateChange();
  }

  destroy(): void {
    this.pause();
    this.onStepCallback = null;
    this.onStateChangeCallback = null;
  }
}
