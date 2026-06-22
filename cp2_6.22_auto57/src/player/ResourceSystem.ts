import { GameState } from '../types';

export type ResourceCallback = (state: GameState) => void;
export type GameOverCallback = (reason: 'health' | 'oxygen') => void;

export class ResourceSystem {
  private state: GameState;
  private updateCallbacks: ResourceCallback[] = [];
  private gameOverCallbacks: GameOverCallback[] = [];
  private oxygenTimer: number = 0;
  private readonly OXYGEN_DECAY_RATE = 0.5;

  constructor() {
    this.state = {
      health: 10,
      maxHealth: 10,
      oxygen: 100,
      maxOxygen: 100,
      crystals: 0,
      ores: 0,
      time: 0,
      deaths: 0,
      isGameOver: false,
      isVictory: false,
      isPaused: false
    };
  }

  reset(): void {
    this.state = {
      health: 10,
      maxHealth: 10,
      oxygen: 100,
      maxOxygen: 100,
      crystals: 0,
      ores: 0,
      time: 0,
      deaths: this.state.deaths,
      isGameOver: false,
      isVictory: false,
      isPaused: false
    };
    this.oxygenTimer = 0;
    this.notifyUpdate();
  }

  update(deltaTime: number): void {
    if (this.state.isGameOver || this.state.isVictory || this.state.isPaused) return;

    this.state.time += deltaTime;

    this.oxygenTimer += deltaTime;
    if (this.oxygenTimer >= 1) {
      this.oxygenTimer -= 1;
      this.consumeOxygen(this.OXYGEN_DECAY_RATE);
    }

    this.notifyUpdate();
  }

  consumeHealth(amount: number): void {
    if (this.state.isGameOver) return;

    this.state.health = Math.max(0, this.state.health - amount);

    if (this.state.health <= 0) {
      this.state.isGameOver = true;
      this.state.deaths++;
      this.notifyGameOver('health');
    }

    this.notifyUpdate();
  }

  consumeOxygen(amount: number): void {
    if (this.state.isGameOver) return;

    this.state.oxygen = Math.max(0, this.state.oxygen - amount);

    if (this.state.oxygen <= 0) {
      this.state.isGameOver = true;
      this.state.deaths++;
      this.notifyGameOver('oxygen');
    }

    this.notifyUpdate();
  }

  addCrystal(): void {
    this.state.crystals++;
    this.notifyUpdate();
  }

  addOre(): void {
    this.state.ores++;
    this.notifyUpdate();
  }

  getState(): GameState {
    return { ...this.state };
  }

  setVictory(): void {
    this.state.isVictory = true;
    this.notifyUpdate();
  }

  setPaused(paused: boolean): void {
    this.state.isPaused = paused;
    this.notifyUpdate();
  }

  onUpdate(callback: ResourceCallback): void {
    this.updateCallbacks.push(callback);
  }

  onGameOver(callback: GameOverCallback): void {
    this.gameOverCallbacks.push(callback);
  }

  private notifyUpdate(): void {
    for (const callback of this.updateCallbacks) {
      callback(this.getState());
    }
  }

  private notifyGameOver(reason: 'health' | 'oxygen'): void {
    for (const callback of this.gameOverCallbacks) {
      callback(reason);
    }
  }

  getFormattedTime(): string {
    const totalSeconds = Math.floor(this.state.time);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}
