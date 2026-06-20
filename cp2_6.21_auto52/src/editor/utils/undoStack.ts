import { produce } from 'immer';

const MAX_STACK_SIZE = 200;

export class UndoStack<T> {
  private past: T[] = [];
  private future: T[] = [];
  private present: T;

  constructor(initialState: T) {
    this.present = initialState;
  }

  push(newState: T): void {
    this.past.push(produce(this.present, () => this.present));
    
    if (this.past.length > MAX_STACK_SIZE) {
      this.past.shift();
    }
    
    this.future = [];
    this.present = newState;
  }

  undo(): T | null {
    if (this.past.length === 0) {
      return null;
    }

    const previous = this.past.pop()!;
    this.future.push(produce(this.present, () => this.present));
    this.present = previous;
    return this.present;
  }

  redo(): T | null {
    if (this.future.length === 0) {
      return null;
    }

    const next = this.future.pop()!;
    this.past.push(produce(this.present, () => this.present));
    this.present = next;
    return this.present;
  }

  peek(): T {
    return this.present;
  }

  get canUndo(): boolean {
    return this.past.length > 0;
  }

  get canRedo(): boolean {
    return this.future.length > 0;
  }

  reset(initialState: T): void {
    this.past = [];
    this.future = [];
    this.present = initialState;
  }
}
