import type { GameState, DialogueCondition } from '../types';

class GameStateManager {
  private static instance: GameStateManager;
  private state: GameState;
  private listeners: Set<() => void> = new Set();

  private constructor() {
    this.state = {
      affection: 50,
      time: 12,
      storyFlags: [],
    };
  }

  static getInstance(): GameStateManager {
    if (!GameStateManager.instance) {
      GameStateManager.instance = new GameStateManager();
    }
    return GameStateManager.instance;
  }

  getState(): GameState {
    return { ...this.state };
  }

  setState(partial: Partial<GameState>): void {
    this.state = { ...this.state, ...partial };
    this.notifyListeners();
  }

  setAffection(value: number): void {
    this.state.affection = Math.max(0, Math.min(100, value));
    this.notifyListeners();
  }

  setTime(value: number): void {
    this.state.time = ((value % 24) + 24) % 24;
    this.notifyListeners();
  }

  addStoryFlag(flag: string): void {
    if (!this.state.storyFlags.includes(flag)) {
      this.state.storyFlags = [...this.state.storyFlags, flag];
      this.notifyListeners();
    }
  }

  removeStoryFlag(flag: string): void {
    this.state.storyFlags = this.state.storyFlags.filter((f) => f !== flag);
    this.notifyListeners();
  }

  hasStoryFlag(flag: string): boolean {
    return this.state.storyFlags.includes(flag);
  }

  checkCondition(condition: DialogueCondition): boolean {
    const { type, operator, value, minValue, maxValue } = condition;

    switch (type) {
      case 'affection': {
        const aff = this.state.affection;
        const numValue = typeof value === 'number' ? value : Number(value);
        switch (operator) {
          case 'gt': return aff > numValue;
          case 'lt': return aff < numValue;
          case 'eq': return aff === numValue;
          case 'gte': return aff >= numValue;
          case 'lte': return aff <= numValue;
          case 'range': return aff >= (minValue ?? 0) && aff <= (maxValue ?? 100);
          default: return false;
        }
      }
      case 'time': {
        const t = this.state.time;
        const numValue = typeof value === 'number' ? value : Number(value);
        switch (operator) {
          case 'gt': return t > numValue;
          case 'lt': return t < numValue;
          case 'eq': return t === numValue;
          case 'gte': return t >= numValue;
          case 'lte': return t <= numValue;
          case 'range': return t >= (minValue ?? 0) && t <= (maxValue ?? 24);
          default: return false;
        }
      }
      case 'story': {
        const flag = String(value);
        return this.hasStoryFlag(flag);
      }
      default:
        return false;
    }
  }

  getConditionPriority(condition?: DialogueCondition): number {
    if (!condition) return 0;
    switch (condition.type) {
      case 'story': return 3;
      case 'affection': return 2;
      case 'time': return 1;
      default: return 0;
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }
}

export const gameStateManager = GameStateManager.getInstance();
export default GameStateManager;
