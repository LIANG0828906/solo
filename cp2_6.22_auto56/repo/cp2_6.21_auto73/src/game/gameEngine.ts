import type {
  Cell,
  Piece,
  Player,
  PlayerId,
  GameState,
  TerrainType,
  BattleResult,
  GameEngineEvents,
  GameEventName,
  InitialGameData,
} from './types';

const BOARD_SIZE = 5;
const TURN_TIME = 15;
const MAX_CONSECUTIVE_NOOP_ROUNDS = 3;

const TERRAIN_SCORES: Record<TerrainType, number> = {
  normal: 1,
  trap: -1,
  speed: 2,
};

export class GameEngine {
  private state: GameState;
  private listeners: Map<GameEventName, Set<(...args: unknown[]) => void>>;

  constructor() {
    this.state = this.createInitialState();
    this.listeners = new Map();
  }

  private createInitialState(): GameState {
    return {
      board: [],
      players: {},
      currentPlayerId: '',
      turnTimeLeft: TURN_TIME,
      gameStatus: 'waiting',
      winner: null,
      consecutiveNoOpTurns: 0,
    };
  }

  initGame(initialData: InitialGameData): void {
    this.state = {
      board: initialData.board,
      players: initialData.players,
      currentPlayerId: initialData.currentPlayerId,
      turnTimeLeft: TURN_TIME,
      gameStatus: 'playing',
      winner: null,
      consecutiveNoOpTurns: 0,
    };
    this.emit('stateChange', this.state);
    this.emit('turnChange', this.state);
  }



  getState(): GameState {
    return { ...this.state };
  }

  getBoard(): Cell[][] {
    return this.state.board.map((row) => row.map((cell) => ({ ...cell })));
  }

  getPlayers(): Record<PlayerId, Player> {
    const players: Record<PlayerId, Player> = {};
    for (const id in this.state.players) {
      players[id] = { ...this.state.players[id], pieces: [...this.state.players[id].pieces] };
    }
    return players;
  }

  getCurrentPlayer(): Player | null {
    return this.state.players[this.state.currentPlayerId] || null;
  }

  validateMove(pieceId: string, targetX: number, targetY: number): boolean {
    if (this.state.gameStatus !== 'playing') return false;
    if (targetX < 0 || targetX >= BOARD_SIZE || targetY < 0 || targetY >= BOARD_SIZE) return false;

    const piece = this.findPieceById(pieceId);
    if (!piece) return false;
    if (piece.playerId !== this.state.currentPlayerId) return false;

    const player = this.state.players[this.state.currentPlayerId];
    if (player.remainingMoves <= 0) return false;

    const dx = Math.abs(targetX - piece.x);
    const dy = Math.abs(targetY - piece.y);
    if (dx + dy !== 1) return false;

    return true;
  }

  private findPieceById(pieceId: string): Piece | null {
    for (const playerId in this.state.players) {
      const piece = this.state.players[playerId].pieces.find((p) => p.id === pieceId);
      if (piece) return piece;
    }
    return null;
  }

  executeMove(pieceId: string, targetX: number, targetY: number): boolean {
    if (!this.validateMove(pieceId, targetX, targetY)) return false;

    const piece = this.findPieceById(pieceId);
    if (!piece) return false;

    const currentPlayer = this.state.players[this.state.currentPlayerId];
    const targetCell = this.state.board[targetY][targetX];
    const previousCell = this.state.board[piece.y][piece.x];

    let battleResult: BattleResult | null = null;
    let scoreDelta = 0;

    const opponentPiece = this.findPieceAt(targetX, targetY);
    if (opponentPiece && opponentPiece.playerId !== piece.playerId) {
      battleResult = this.handleBattle(piece, opponentPiece, targetX, targetY);
      if (battleResult.winnerId === piece.playerId) {
        this.returnPieceToBase(opponentPiece);
        piece.x = targetX;
        piece.y = targetY;

        if (targetCell.owner !== piece.playerId) {
          const oldOwner = targetCell.owner;
          if (oldOwner) {
            const oldPlayer = this.state.players[oldOwner];
            oldPlayer.capturedCells--;
            oldPlayer.score -= TERRAIN_SCORES[targetCell.terrain];
          }
          targetCell.owner = piece.playerId;
          currentPlayer.capturedCells++;
          scoreDelta = TERRAIN_SCORES[targetCell.terrain];
          currentPlayer.score += scoreDelta;
        }

        this.applyTerrainEffect(targetCell, currentPlayer);
      } else {
        this.returnPieceToBase(piece);
      }
    } else {
      piece.x = targetX;
      piece.y = targetY;

      if (targetCell.owner !== piece.playerId) {
        const oldOwner = targetCell.owner;
        if (oldOwner) {
          const oldPlayer = this.state.players[oldOwner];
          oldPlayer.capturedCells--;
          oldPlayer.score -= TERRAIN_SCORES[targetCell.terrain];
        }
        targetCell.owner = piece.playerId;
        currentPlayer.capturedCells++;
        scoreDelta = TERRAIN_SCORES[targetCell.terrain];
        currentPlayer.score += scoreDelta;
      }

      this.applyTerrainEffect(targetCell, currentPlayer);
    }

    void previousCell;

    currentPlayer.remainingMoves--;

    if (scoreDelta !== 0) {
      this.emit('scoreAnimation', currentPlayer.id, scoreDelta);
    }

    if (battleResult) {
      this.emit('battle', battleResult);
    }

    this.state.consecutiveNoOpTurns = 0;

    if (currentPlayer.remainingMoves <= 0) {
      this.switchTurn();
    } else {
      this.emit('stateChange', this.state);
    }

    this.checkGameEnd();

    return true;
  }

  private findPieceAt(x: number, y: number): Piece | null {
    for (const playerId in this.state.players) {
      const piece = this.state.players[playerId].pieces.find((p) => p.x === x && p.y === y);
      if (piece) return piece;
    }
    return null;
  }

  private handleBattle(
    attacker: Piece,
    defender: Piece,
    cellX: number,
    cellY: number,
  ): BattleResult {
    const attackerRoll = Math.floor(Math.random() * 6) + 1;
    const defenderRoll = Math.floor(Math.random() * 6) + 1;

    let winnerId: PlayerId;
    if (attackerRoll > defenderRoll) {
      winnerId = attacker.playerId;
    } else if (defenderRoll > attackerRoll) {
      winnerId = defender.playerId;
    } else {
      winnerId = Math.random() > 0.5 ? attacker.playerId : defender.playerId;
    }

    return {
      attackerId: attacker.playerId,
      defenderId: defender.playerId,
      attackerRoll,
      defenderRoll,
      winnerId,
      cellX,
      cellY,
    };
  }

  private returnPieceToBase(piece: Piece): void {
    if (piece.playerId === 'player1') {
      if (piece.id === 'p1-piece-1') {
        piece.x = 0;
        piece.y = 0;
      } else {
        piece.x = 1;
        piece.y = 0;
      }
    } else {
      if (piece.id === 'p2-piece-1') {
        piece.x = 4;
        piece.y = 4;
      } else {
        piece.x = 4;
        piece.y = 3;
      }
    }
  }

  private applyTerrainEffect(cell: Cell, player: Player): void {
    if (cell.terrain === 'speed') {
      player.hasSpeedBonus = true;
    }
  }

  skipTurn(): void {
    if (this.state.gameStatus !== 'playing') return;

    this.state.consecutiveNoOpTurns++;
    this.switchTurn();
    this.checkGameEnd();
  }

  private switchTurn(): void {
    const playerIds = Object.keys(this.state.players);
    const currentIndex = playerIds.indexOf(this.state.currentPlayerId);
    const nextIndex = (currentIndex + 1) % playerIds.length;
    this.state.currentPlayerId = playerIds[nextIndex];

    const nextPlayer = this.state.players[this.state.currentPlayerId];
    nextPlayer.remainingMoves = nextPlayer.hasSpeedBonus ? 2 : 1;
    nextPlayer.hasSpeedBonus = false;

    this.state.turnTimeLeft = TURN_TIME;

    this.emit('stateChange', this.state);
    this.emit('turnChange', this.state);
  }

  decrementTime(): void {
    if (this.state.gameStatus !== 'playing') return;

    this.state.turnTimeLeft--;

    if (this.state.turnTimeLeft <= 0) {
      this.skipTurn();
    } else {
      this.emit('stateChange', this.state);
    }
  }

  private checkGameEnd(): boolean {
    if (this.state.gameStatus !== 'playing') return false;

    const noOpRounds = Math.floor(this.state.consecutiveNoOpTurns / 2);
    if (noOpRounds >= MAX_CONSECUTIVE_NOOP_ROUNDS) {
      this.endGame();
      return true;
    }

    let totalCaptured = 0;
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        if (this.state.board[y][x].owner !== null) {
          totalCaptured++;
        }
      }
    }

    if (totalCaptured === BOARD_SIZE * BOARD_SIZE) {
      this.endGame();
      return true;
    }

    return false;
  }

  private endGame(): void {
    this.state.gameStatus = 'ended';

    const playerIds = Object.keys(this.state.players);
    let maxScore = -Infinity;
    let winnerId: PlayerId | null = null;

    for (const id of playerIds) {
      if (this.state.players[id].score > maxScore) {
        maxScore = this.state.players[id].score;
        winnerId = id;
      } else if (this.state.players[id].score === maxScore) {
        winnerId = null;
      }
    }

    this.state.winner = winnerId;
    this.emit('stateChange', this.state);
    this.emit('gameEnd', this.state);
  }

  getTerrainStats(): Record<PlayerId, Record<TerrainType, number>> {
    const stats: Record<PlayerId, Record<TerrainType, number>> = {};
    for (const playerId in this.state.players) {
      stats[playerId] = { normal: 0, trap: 0, speed: 0 };
    }

    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        const cell = this.state.board[y][x];
        if (cell.owner) {
          stats[cell.owner][cell.terrain]++;
        }
      }
    }

    return stats;
  }

  on<K extends GameEventName>(event: K, listener: GameEngineEvents[K]): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener as (...args: unknown[]) => void);

    return () => {
      this.listeners.get(event)?.delete(listener as (...args: unknown[]) => void);
    };
  }

  private emit<K extends GameEventName>(event: K, ...args: Parameters<GameEngineEvents[K]>): void {
    const listeners = this.listeners.get(event);
    if (!listeners) return;
    for (const listener of listeners) {
      listener(...args);
    }
  }
}
