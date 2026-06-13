import { v4 as uuidv4 } from 'uuid';
import type { Trap, TrapType, Position, PlayerId, PlayerState, Direction } from './types';

export class TrapManager {
  private traps: Trap[] = [];

  constructor(initialTraps: Trap[] = []) {
    this.traps = [...initialTraps];
  }

  public placeTrap(
    position: Position,
    owner: PlayerId,
    type: TrapType
  ): Trap | null {
    const existing = this.traps.find(
      (t) => t.position.x === position.x && t.position.y === position.y && !t.triggered
    );
    if (existing) return null;

    const trap: Trap = {
      id: uuidv4(),
      type,
      position: { ...position },
      owner,
      triggered: false,
    };
    this.traps.push(trap);
    return trap;
  }

  public checkTrapTrigger(
    player: PlayerState,
    direction: Direction
  ): { trap: Trap; effect: string } | null {
    const pos = player.position;
    const trap = this.traps.find(
      (t) =>
        !t.triggered &&
        t.owner !== player.id &&
        t.position.x === pos.x &&
        t.position.y === pos.y
    );

    if (!trap) return null;

    trap.triggered = true;

    if (trap.type === 'fence') {
      return { trap, effect: 'locked' };
    }

    return { trap, effect: 'none' };
  }

  public checkSleepEffect(player: PlayerState): boolean {
    const pos = player.position;
    let affected = false;

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const trap = this.traps.find(
          (t) =>
            t.type === 'sleep' &&
            !t.triggered &&
            t.owner !== player.id &&
            t.position.x === pos.x + dx &&
            t.position.y === pos.y + dy
        );
        if (trap) {
          trap.triggered = true;
          affected = true;
        }
      }
    }

    return affected;
  }

  public getTraps(): Trap[] {
    return this.traps.filter((t) => !t.triggered);
  }

  public getAllTraps(): Trap[] {
    return [...this.traps];
  }

  public reset(): void {
    this.traps = [];
  }

  public getRandomTrapType(): TrapType {
    return Math.random() > 0.5 ? 'sleep' : 'fence';
  }

  public assignTraps(count: number): TrapType[] {
    const types: TrapType[] = [];
    for (let i = 0; i < count; i++) {
      types.push(this.getRandomTrapType());
    }
    return types;
  }
}

export const TRAP_COLORS: Record<TrapType, string> = {
  sleep: '#9b59b6',
  fence: '#f39c12',
};

export const TRAP_NAMES: Record<TrapType, string> = {
  sleep: '催眠迷雾',
  fence: '静电栅栏',
};
