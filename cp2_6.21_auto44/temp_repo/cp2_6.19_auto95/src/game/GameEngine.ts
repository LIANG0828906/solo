import { Board, Cell, EventType } from './Board';

export type PlayerId = 'red' | 'blue';
export type GamePhase = 'idle' | 'diceRolling' | 'diceHolding' | 'moving' | 'attacking' | 'eventTriggering' | 'gameOver';
export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Player {
  id: PlayerId;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  missStreak: number;
  diceBonus: boolean;
  previousHp: number;
  displayHp: number;
  hitShakeTime: number;
  hitFlashTime: number;
}

export interface LogEntry {
  id: number;
  text: string;
  timestamp: number;
  color: string;
}

export interface Position {
  x: number;
  y: number;
}

export interface AttackInfo {
  attacker: PlayerId;
  defender: PlayerId;
  damage: number;
  startTime: number;
  duration: number;
  hit: boolean;
}

export interface DiceState {
  value: number;
  phase: 'rolling' | 'holding' | 'numberPop';
  rollStartTime: number;
  holdStartTime: number;
  popStartTime: number;
}

export class GameEngine {
  public board: Board;
  public players: Record<PlayerId, Player>;
  public currentPlayer: PlayerId;
  public phase: GamePhase;
  public dice: DiceState | null;
  public movesLeft: number;
  public logs: LogEntry[];
  public winner: PlayerId | null;
  public currentAttack: AttackInfo | null;
  public currentEvent: { cell: Cell; type: EventType; startTime: number } | null;
  public movePath: Position[];
  public highlightedCell: Position | null;
  public transitioning: boolean;

  private logCounter = 0;
  private phaseTimer = 0;
  private listeners: (() => void)[] = [];

  constructor() {
    this.board = new Board();
    this.players = {
      red: {
        id: 'red',
        x: 0,
        y: 0,
        hp: 10,
        maxHp: 10,
        missStreak: 0,
        diceBonus: false,
        previousHp: 10,
        displayHp: 10,
        hitShakeTime: 0,
        hitFlashTime: 0,
      },
      blue: {
        id: 'blue',
        x: 7,
        y: 7,
        hp: 10,
        maxHp: 10,
        missStreak: 0,
        diceBonus: false,
        previousHp: 10,
        displayHp: 10,
        hitShakeTime: 0,
        hitFlashTime: 0,
      },
    };
    this.currentPlayer = 'red';
    this.phase = 'idle';
    this.dice = null;
    this.movesLeft = 0;
    this.logs = [];
    this.winner = null;
    this.currentAttack = null;
    this.currentEvent = null;
    this.movePath = [];
    this.highlightedCell = null;
    this.transitioning = false;
    this.addLog('游戏开始！红方先手。', '#FFD700');
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach(l => l());
  }

  private addLog(text: string, color = '#FFFFFF'): void {
    this.logs.push({
      id: ++this.logCounter,
      text,
      timestamp: performance.now(),
      color,
    });
    if (this.logs.length > 20) this.logs.shift();
  }

  public startGame(): void {
    if (this.phase !== 'idle') return;
    this.startTurn();
  }

  private startTurn(): void {
    const player = this.players[this.currentPlayer];
    player.missStreak = 0;
    this.board.clearAllEvents();
    this.movePath = [{ x: player.x, y: player.y }];
    this.highlightedCell = null;
    this.rollDice();
  }

  private rollDice(): void {
    const player = this.players[this.currentPlayer];
    let value = Math.floor(Math.random() * 6) + 1;
    if (player.diceBonus) {
      value = Math.max(value, 3);
      player.diceBonus = false;
      this.addLog(`${this.playerName(this.currentPlayer)}获得加速保底！`, '#2980B9');
    }

    this.dice = {
      value,
      phase: 'rolling',
      rollStartTime: performance.now(),
      holdStartTime: 0,
      popStartTime: 0,
    };
    this.movesLeft = value;
    this.phase = 'diceRolling';
    this.addLog(`${this.playerName(this.currentPlayer)}掷出骰子...`, '#AAAAAA');
    this.notify();
  }

  public update(elapsedMs: number): void {
    this.updateHpAnimations(elapsedMs);
    this.updatePlayerEffects(elapsedMs);

    if (this.phase === 'diceRolling' && this.dice) {
      const elapsed = performance.now() - this.dice.rollStartTime;
      if (elapsed >= 1500) {
        this.dice.phase = 'holding';
        this.dice.holdStartTime = performance.now();
        this.phase = 'diceHolding';
        this.addLog(`${this.playerName(this.currentPlayer)}掷出 ${this.dice.value} 点！`, this.currentPlayer === 'red' ? '#C0392B' : '#2980B9');
        this.notify();
      }
    } else if (this.phase === 'diceHolding' && this.dice) {
      const elapsed = performance.now() - this.dice.holdStartTime;
      if (this.dice.phase === 'holding' && elapsed >= 100 && this.dice.popStartTime === 0) {
        this.dice.phase = 'numberPop';
        this.dice.popStartTime = performance.now();
      }
      if (elapsed >= 2000) {
        this.phase = 'moving';
        this.notify();
      }
    } else if (this.phase === 'attacking' && this.currentAttack) {
      const elapsed = performance.now() - this.currentAttack.startTime;
      if (elapsed >= this.currentAttack.duration) {
        this.finishAttack();
      }
    } else if (this.phase === 'eventTriggering' && this.currentEvent) {
      const elapsed = performance.now() - this.currentEvent.startTime;
      if (elapsed >= 1200) {
        this.finishEventTrigger();
      }
    }
  }

  private updateHpAnimations(elapsedMs: number): void {
    const animDuration = 500;
    const t = Math.min(1, elapsedMs / animDuration);
    (['red', 'blue'] as PlayerId[]).forEach(id => {
      const p = this.players[id];
      p.displayHp = p.previousHp + (p.hp - p.previousHp) * t;
    });
  }

  private updatePlayerEffects(elapsedMs: number): void {
    (['red', 'blue'] as PlayerId[]).forEach(id => {
      const p = this.players[id];
      if (p.hitShakeTime > 0) p.hitShakeTime = Math.max(0, p.hitShakeTime - elapsedMs);
      if (p.hitFlashTime > 0) p.hitFlashTime = Math.max(0, p.hitFlashTime - elapsedMs);
    });
  }

  public canMove(direction: Direction): boolean {
    if (this.phase !== 'moving' || this.movesLeft <= 0) return false;
    const p = this.players[this.currentPlayer];
    const { x, y } = p;
    switch (direction) {
      case 'up': return this.board.isInside(x, y - 1);
      case 'down': return this.board.isInside(x, y + 1);
      case 'left': return this.board.isInside(x - 1, y);
      case 'right': return this.board.isInside(x + 1, y);
    }
  }

  public move(direction: Direction): void {
    if (!this.canMove(direction)) return;
    const p = this.players[this.currentPlayer];
    switch (direction) {
      case 'up': p.y--; break;
      case 'down': p.y++; break;
      case 'left': p.x--; break;
      case 'right': p.x++; break;
    }
    this.movesLeft--;
    this.movePath.push({ x: p.x, y: p.y });
    this.highlightedCell = { x: p.x, y: p.y };

    this.notify();
    setTimeout(() => this.afterStep(), 120);
  }

  private afterStep(): void {
    const p = this.players[this.currentPlayer];
    if (Math.random() < 0.4) {
      this.triggerRandomEvent(p.x, p.y);
      return;
    }
    this.checkAfterMove();
  }

  private triggerRandomEvent(x: number, y: number): void {
    const types: EventType[] = ['trap', 'boost', 'heal'];
    const eventType = types[Math.floor(Math.random() * types.length)];
    this.board.setCellEvent(x, y, eventType);
    const cell = this.board.getCell(x, y)!;
    this.currentEvent = { cell, type: eventType, startTime: performance.now() };
    this.phase = 'eventTriggering';

    const p = this.players[this.currentPlayer];
    const name = this.playerName(this.currentPlayer);
    switch (eventType) {
      case 'trap':
        this.applyDamage(p.id, 1, false);
        this.addLog(`${name}踩到陷阱，失去1点生命！`, '#E74C3C');
        break;
      case 'boost':
        p.diceBonus = true;
        this.addLog(`${name}触发加速，下回合骰子保底3点！`, '#3498DB');
        break;
      case 'heal':
        this.healPlayer(p.id, 2);
        this.addLog(`${name}触发回血，恢复2点生命！`, '#2ECC71');
        break;
    }
    this.notify();
  }

  private finishEventTrigger(): void {
    this.currentEvent = null;
    this.phase = 'moving';
    this.checkAfterMove();
  }

  private checkAfterMove(): void {
    if (this.checkGameOver()) return;

    if (this.movesLeft <= 0) {
      const opponent = this.opponent();
      const me = this.players[this.currentPlayer];
      const dist = Math.abs(me.x - opponent.x) + Math.abs(me.y - opponent.y);
      if (dist === 1) {
        this.startAttack();
      } else {
        this.endTurn();
      }
    }
  }

  private startAttack(): void {
    const defender = this.opponent();
    const damage = this.dice?.value ?? 1;
    this.currentAttack = {
      attacker: this.currentPlayer,
      defender: defender.id,
      damage,
      startTime: performance.now(),
      duration: 900,
      hit: true,
    };
    this.phase = 'attacking';
    this.addLog(`${this.playerName(this.currentPlayer)}攻击${this.playerName(defender.id)}，造成${damage}点伤害！`, this.currentPlayer === 'red' ? '#C0392B' : '#2980B9');
    this.applyDamage(defender.id, damage, true);
    this.players[this.currentPlayer].missStreak = 0;
    this.notify();
  }

  private finishAttack(): void {
    this.currentAttack = null;
    if (this.checkGameOver()) return;
    this.endTurn();
  }

  private applyDamage(targetId: PlayerId, damage: number, isAttack: boolean): void {
    const p = this.players[targetId];
    p.previousHp = p.displayHp;
    p.hp = Math.max(0, p.hp - damage);
    if (isAttack) {
      p.hitShakeTime = 300;
      p.hitFlashTime = 300;
    }
  }

  private healPlayer(targetId: PlayerId, amount: number): void {
    const p = this.players[targetId];
    p.previousHp = p.displayHp;
    p.hp = Math.min(p.maxHp, p.hp + amount);
  }

  private endTurn(): void {
    const me = this.players[this.currentPlayer];
    me.missStreak++;

    if (me.missStreak >= 3) {
      this.winner = this.opponent().id;
      this.phase = 'gameOver';
      this.addLog(`${this.playerName(this.currentPlayer)}连续3回合未命中，判负！`, '#FFD700');
      this.notify();
      return;
    }

    this.currentPlayer = this.currentPlayer === 'red' ? 'blue' : 'red';
    this.highlightedCell = null;
    this.startTurn();
  }

  private checkGameOver(): boolean {
    const dead = (['red', 'blue'] as PlayerId[]).find(id => this.players[id].hp <= 0);
    if (dead) {
      this.winner = this.opponentOf(dead).id;
      this.phase = 'gameOver';
      this.addLog(`${this.playerName(dead)}被击败！${this.playerName(this.winner)}获胜！`, '#FFD700');
      this.notify();
      return true;
    }
    return false;
  }

  public opponent(): Player {
    return this.opponentOf(this.currentPlayer);
  }

  public opponentOf(id: PlayerId): Player {
    return this.players[id === 'red' ? 'blue' : 'red'];
  }

  public playerName(id: PlayerId): string {
    return id === 'red' ? '红方' : '蓝方';
  }
}
