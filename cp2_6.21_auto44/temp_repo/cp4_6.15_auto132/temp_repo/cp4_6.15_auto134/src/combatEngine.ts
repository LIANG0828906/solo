import type { CombatParticipant, CombatAction, CombatState, PlacedMonster, PlayerCharacter } from './types';

type EventHandler = (...args: unknown[]) => void;

export class CombatEngine {
  private participants: CombatParticipant[];
  private round: number;
  private turnIndex: number;
  private isAutoRunning: boolean;
  private isPaused: boolean;
  private isFinished: boolean;
  private logs: CombatAction[];
  private autoInterval: ReturnType<typeof setInterval> | null;
  private eventListeners: Map<string, Set<EventHandler>>;

  constructor(monsters: PlacedMonster[], players: PlayerCharacter[]) {
    this.participants = [];
    this.round = 1;
    this.turnIndex = 0;
    this.isAutoRunning = false;
    this.isPaused = false;
    this.isFinished = false;
    this.logs = [];
    this.autoInterval = null;
    this.eventListeners = new Map();

    for (const m of monsters) {
      const initiative = this.rollD20() + Math.floor(Math.random() * 3);
      this.participants.push({
        id: m.id,
        name: m.name,
        type: 'monster',
        hp: m.hp,
        maxHp: m.maxHp,
        ac: m.ac,
        attackDice: m.attackDice,
        initiative,
        gridX: m.gridX,
        gridY: m.gridY,
        icon: m.icon,
        color: '#ef4444',
      });
    }

    for (const p of players) {
      const initiative = this.rollD20() + Math.floor(Math.random() * 3);
      this.participants.push({
        id: p.id,
        name: p.name,
        type: 'player',
        hp: p.hp,
        maxHp: p.maxHp,
        ac: p.ac,
        attackDice: p.attackDice,
        initiative,
        gridX: p.gridX,
        gridY: p.gridY,
        icon: p.class.charAt(0),
        color: p.color,
      });
    }

    this.participants.sort((a, b) => b.initiative - a.initiative);
  }

  on(event: string, handler: EventHandler): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(handler);
  }

  off(event: string, handler: EventHandler): void {
    this.eventListeners.get(event)?.delete(handler);
  }

  private emit(event: string, ...args: unknown[]): void {
    this.eventListeners.get(event)?.forEach(handler => handler(...args));
  }

  start(): void {
    this.round = 1;
    this.turnIndex = 0;
    this.isFinished = false;
    this.isPaused = false;
    this.logs = [];
    this.emit('combatStart', this.getState());
  }

  nextTurn(): void {
    if (this.isFinished || this.participants.length === 0) return;

    const actor = this.participants[this.turnIndex];
    const enemies = this.participants.filter(p => p.type !== actor.type);

    if (enemies.length === 0) {
      this.finishCombat();
      return;
    }

    const target = enemies[Math.floor(Math.random() * enemies.length)];
    const d20Roll = this.rollD20();

    let hit = false;
    let critical = false;

    if (d20Roll === 1) {
      hit = false;
    } else if (d20Roll === 20) {
      hit = true;
      critical = true;
    } else {
      hit = d20Roll >= target.ac;
    }

    let damage = 0;

    if (hit) {
      const dice = this.parseAttackDice(actor.attackDice);
      if (critical) {
        damage = this.rollDice(dice.count * 2, dice.sides) + dice.modifier;
      } else {
        damage = this.rollDice(dice.count, dice.sides) + dice.modifier;
      }
      damage = Math.max(0, damage);
    }

    if (hit && damage > 0) {
      target.hp -= damage;
    }

    const targetRemainingHp = target.hp;

    if (target.hp <= 0) {
      const idx = this.participants.indexOf(target);
      if (idx !== -1) {
        this.participants.splice(idx, 1);
        if (idx < this.turnIndex) {
          this.turnIndex--;
        }
      }
    }

    const action: CombatAction = {
      round: this.round,
      actorId: actor.id,
      actorName: actor.name,
      actorType: actor.type,
      targetId: target.id,
      targetName: target.name,
      hit,
      damage,
      targetRemainingHp,
      critical,
    };

    this.logs.push(action);
    this.emit('action', action);

    this.turnIndex++;

    if (this.turnIndex >= this.participants.length) {
      this.turnIndex = 0;
      this.round++;
    }

    const monstersAlive = this.participants.some(p => p.type === 'monster');
    const playersAlive = this.participants.some(p => p.type === 'player');

    if (!monstersAlive || !playersAlive) {
      this.finishCombat();
    }
  }

  private finishCombat(): void {
    this.isFinished = true;
    this.isAutoRunning = false;
    this.isPaused = false;
    if (this.autoInterval !== null) {
      clearInterval(this.autoInterval);
      this.autoInterval = null;
    }
    this.emit('combatEnd', this.getState());
  }

  startAuto(intervalMs = 1500): void {
    if (this.isAutoRunning || this.isFinished) return;
    this.isAutoRunning = true;
    this.isPaused = false;
    this.autoInterval = setInterval(() => {
      this.nextTurn();
      if (this.isFinished && this.autoInterval !== null) {
        clearInterval(this.autoInterval);
        this.autoInterval = null;
      }
    }, intervalMs);
  }

  pause(): void {
    if (!this.isAutoRunning || this.isPaused) return;
    this.isPaused = true;
    if (this.autoInterval !== null) {
      clearInterval(this.autoInterval);
      this.autoInterval = null;
    }
  }

  resume(): void {
    if (!this.isAutoRunning || !this.isPaused || this.isFinished) return;
    this.isPaused = false;
    this.startAuto();
  }

  getState(): CombatState {
    return {
      round: this.round,
      turnIndex: this.turnIndex,
      turnOrder: [...this.participants],
      isAutoRunning: this.isAutoRunning,
      isPaused: this.isPaused,
      isFinished: this.isFinished,
      logs: [...this.logs],
    };
  }

  getParticipants(): CombatParticipant[] {
    return [...this.participants];
  }

  private parseAttackDice(diceStr: string): { count: number; sides: number; modifier: number } {
    const match = diceStr.match(/^(\d+)d(\d+)([+-]\d+)?$/i);
    if (!match) {
      return { count: 1, sides: 6, modifier: 0 };
    }
    const count = parseInt(match[1], 10);
    const sides = parseInt(match[2], 10);
    const modifier = match[3] ? parseInt(match[3], 10) : 0;
    return { count, sides, modifier };
  }

  private rollD20(): number {
    return Math.floor(Math.random() * 20) + 1;
  }

  private rollDice(count: number, sides: number): number {
    let total = 0;
    for (let i = 0; i < count; i++) {
      total += Math.floor(Math.random() * sides) + 1;
    }
    return total;
  }
}
