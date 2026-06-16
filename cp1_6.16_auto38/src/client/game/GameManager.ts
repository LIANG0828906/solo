import {
  BoardState,
  CellState,
  GameState,
  MoveRecord,
  Piece,
  PieceColor,
  Position,
  GameStatus,
  WSMessage,
  PIECE_NAMES,
} from '../../shared/types';

export type GameEventCallback = (event: string, data?: any) => void;

export class GameManager {
  private ws: WebSocket | null = null;
  private gameState: GameState | null = null;
  private myColor: PieceColor | null = null;
  private playerId: string = '';
  private selectedPos: Position | null = null;
  private validMoves: Position[] = [];
  private eventCallbacks: GameEventCallback[] = [];
  private timerInterval: NodeJS.Timeout | null = null;
  private dragging: boolean = false;
  private dragPos: Position | null = null;
  private dragPixelPos: { x: number; y: number } | null = null;
  private chatMessages: { sender: string; color: PieceColor; message: string }[] = [];
  private roomId: string = '';
  private gameOverShown: boolean = false;

  constructor() {
    this.connect();
  }

  private connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:3001/ws`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.emit('connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (e) {
        console.error('Failed to parse WS message:', e);
      }
    };

    this.ws.onclose = () => {
      this.emit('disconnected');
      setTimeout(() => this.connect(), 3000);
    };

    this.ws.onerror = () => {
      this.emit('error', { message: '连接失败' });
    };
  }

  private handleMessage(message: WSMessage) {
    switch (message.type) {
      case 'GAME_STATE':
        this.playerId = message.payload.playerId;
        this.emit('playerId', { playerId: this.playerId });
        break;

      case 'ROOM_CREATED':
        this.roomId = message.payload.roomId;
        this.myColor = message.payload.yourColor;
        this.emit('roomCreated', message.payload);
        break;

      case 'JOIN_SUCCESS':
        this.roomId = message.payload.roomId;
        this.myColor = message.payload.yourColor;
        this.emit('joinSuccess', message.payload);
        break;

      case 'JOIN_FAILED':
        this.emit('joinFailed', message.payload);
        break;

      case 'MATCH_FOUND':
        this.roomId = message.payload.roomId;
        this.myColor = message.payload.yourColor;
        this.emit('matchFound', message.payload);
        break;

      case 'GAME_START':
        this.gameState = message.payload.gameState;
        this.myColor = message.payload.yourColor;
        this.gameOverShown = false;
        this.startLocalTimer();
        this.emit('gameStart', message.payload);
        break;

      case 'MOVE_MADE': {
        if (!this.gameState) break;
        const { from, to, piece, captured, notation, currentTurn, status, redTime, blackTime } = message.payload;

        const boardBefore = this.gameState.board;
        this.gameState.board[from.row][from.col] = null;
        this.gameState.board[to.row][to.col] = piece;
        this.gameState.currentTurn = currentTurn;
        this.gameState.status = status;
        this.gameState.redTime = redTime;
        this.gameState.blackTime = blackTime;

        this.gameState.moveHistory.push({
          from,
          to,
          piece,
          captured,
          notation,
          timestamp: Date.now(),
          redTime,
          blackTime,
        });

        this.selectedPos = null;
        this.validMoves = [];

        this.emit('moveMade', message.payload);
        this.emit('stateUpdate', this.gameState);

        if (status === 'check') {
          this.emit('check', { color: currentTurn });
        }
        break;
      }

      case 'INVALID_MOVE':
        this.emit('invalidMove', message.payload);
        break;

      case 'TIMER_UPDATE':
        if (this.gameState) {
          this.gameState.redTime = message.payload.redTime;
          this.gameState.blackTime = message.payload.blackTime;
          this.emit('timerUpdate', message.payload);
        }
        break;

      case 'GAME_OVER':
        if (this.gameState) {
          this.gameState.status = message.payload.status;
          this.gameState.winner = message.payload.winner;
          if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
          }
          if (!this.gameOverShown) {
            this.gameOverShown = true;
            this.emit('gameOver', message.payload);
          }
        }
        break;

      case 'CHAT_MESSAGE':
        this.chatMessages.push(message.payload);
        this.emit('chatMessage', message.payload);
        break;

      case 'PLAYER_DISCONNECTED':
        this.emit('playerDisconnected', message.payload);
        break;

      case 'ERROR':
        this.emit('error', message.payload);
        break;
    }
  }

  private startLocalTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (!this.gameState || (this.gameState.status !== 'playing' && this.gameState.status !== 'check')) return;

      if (this.gameState.currentTurn === 'red') {
        this.gameState.redTime = Math.max(0, this.gameState.redTime - 1);
      } else {
        this.gameState.blackTime = Math.max(0, this.gameState.blackTime - 1);
      }
      this.emit('timerUpdate', {
        redTime: this.gameState.redTime,
        blackTime: this.gameState.blackTime,
      });
    }, 1000);
  }

  private emit(event: string, data?: any) {
    this.eventCallbacks.forEach(cb => cb(event, data));
  }

  onEvent(callback: GameEventCallback) {
    this.eventCallbacks.push(callback);
  }

  removeEvent(callback: GameEventCallback) {
    this.eventCallbacks = this.eventCallbacks.filter(cb => cb !== callback);
  }

  createRoom() {
    this.send({ type: 'CREATE_ROOM', payload: {} });
  }

  joinRoom(roomCode: string) {
    this.send({ type: 'JOIN_ROOM', payload: { roomCode } });
  }

  randomMatch() {
    this.send({ type: 'RANDOM_MATCH', payload: {} });
  }

  selectPiece(pos: Position) {
    if (!this.gameState) return;
    if (!this.isMyTurn()) return;

    const piece = this.gameState.board[pos.row][pos.col];
    if (piece && piece.color === this.myColor) {
      this.selectedPos = pos;
      this.validMoves = this.calculateValidMoves(pos);
      this.emit('selectionChanged', { selectedPos: this.selectedPos, validMoves: this.validMoves });
    }
  }

  movePiece(to: Position) {
    if (!this.gameState || !this.selectedPos) return;
    if (!this.isMyTurn()) return;

    const isValid = this.validMoves.some(m => m.row === to.row && m.col === to.col);
    if (isValid) {
      this.send({
        type: 'MAKE_MOVE',
        payload: { from: this.selectedPos, to },
      });
    } else {
      const targetPiece = this.gameState.board[to.row][to.col];
      if (targetPiece && targetPiece.color === this.myColor) {
        this.selectPiece(to);
      } else {
        this.selectedPos = null;
        this.validMoves = [];
        this.emit('selectionChanged', { selectedPos: null, validMoves: [] });
      }
    }
  }

  private calculateValidMoves(pos: Position): Position[] {
    if (!this.gameState) return [];

    const moves: Position[] = [];
    for (let r = 0; r <= 9; r++) {
      for (let c = 0; c <= 8; c++) {
        const to: Position = { row: r, col: c };
        if (this.isMoveValid(this.gameState.board, pos, to)) {
          moves.push(to);
        }
      }
    }
    return moves;
  }

  private isMoveValid(board: BoardState, from: Position, to: Position): boolean {
    const piece = board[from.row][from.col];
    if (!piece) return false;

    const target = board[to.row][to.col];
    if (target && target.color === piece.color) return false;

    if (!this.validatePieceMove(board, from, to, piece)) return false;

    const newBoard = board.map(row => row.map(cell => cell ? { ...cell } : null));
    newBoard[to.row][to.col] = newBoard[from.row][from.col];
    newBoard[from.row][from.col] = null;

    if (this.isKingsFacing(newBoard)) return false;
    if (this.isInCheck(newBoard, piece.color)) return false;

    return true;
  }

  private validatePieceMove(board: BoardState, from: Position, to: Position, piece: Piece): boolean {
    switch (piece.type) {
      case 'king': return this.validateKing(from, to, piece.color);
      case 'advisor': return this.validateAdvisor(from, to, piece.color);
      case 'bishop': return this.validateBishop(board, from, to, piece.color);
      case 'knight': return this.validateKnight(board, from, to);
      case 'rook': return this.validateRook(board, from, to);
      case 'cannon': return this.validateCannon(board, from, to);
      case 'pawn': return this.validatePawn(from, to, piece.color);
      default: return false;
    }
  }

  private validateKing(from: Position, to: Position, color: PieceColor): boolean {
    if (to.col < 3 || to.col > 5) return false;
    if (color === 'red' && (to.row < 7 || to.row > 9)) return false;
    if (color === 'black' && (to.row < 0 || to.row > 2)) return false;
    const dr = Math.abs(to.row - from.row);
    const dc = Math.abs(to.col - from.col);
    return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
  }

  private validateAdvisor(from: Position, to: Position, color: PieceColor): boolean {
    if (to.col < 3 || to.col > 5) return false;
    if (color === 'red' && (to.row < 7 || to.row > 9)) return false;
    if (color === 'black' && (to.row < 0 || to.row > 2)) return false;
    return Math.abs(to.row - from.row) === 1 && Math.abs(to.col - from.col) === 1;
  }

  private validateBishop(board: BoardState, from: Position, to: Position, color: PieceColor): boolean {
    if (color === 'red' && to.row < 5) return false;
    if (color === 'black' && to.row > 4) return false;
    if (Math.abs(to.row - from.row) !== 2 || Math.abs(to.col - from.col) !== 2) return false;
    const eyeRow = from.row + (to.row - from.row) / 2;
    const eyeCol = from.col + (to.col - from.col) / 2;
    return !board[eyeRow][eyeCol];
  }

  private validateKnight(board: BoardState, from: Position, to: Position): boolean {
    const dr = to.row - from.row;
    const dc = to.col - from.col;
    const adr = Math.abs(dr);
    const adc = Math.abs(dc);
    if (!((adr === 2 && adc === 1) || (adr === 1 && adc === 2))) return false;
    if (adr === 2) {
      const legRow = from.row + (dr > 0 ? 1 : -1);
      return !board[legRow][from.col];
    } else {
      const legCol = from.col + (dc > 0 ? 1 : -1);
      return !board[from.row][legCol];
    }
  }

  private validateRook(board: BoardState, from: Position, to: Position): boolean {
    if (from.row !== to.row && from.col !== to.col) return false;
    return this.countBetween(board, from, to) === 0;
  }

  private validateCannon(board: BoardState, from: Position, to: Position): boolean {
    if (from.row !== to.row && from.col !== to.col) return false;
    const count = this.countBetween(board, from, to);
    const target = board[to.row][to.col];
    return target ? count === 1 : count === 0;
  }

  private validatePawn(from: Position, to: Position, color: PieceColor): boolean {
    const dr = to.row - from.row;
    const dc = Math.abs(to.col - from.col);
    if (Math.abs(dr) > 1 || dc > 1) return false;
    if (Math.abs(dr) + dc !== 1) return false;
    if (color === 'red') {
      if (dr > 0) return false;
      if (dc > 0 && from.row > 4) return false;
    } else {
      if (dr < 0) return false;
      if (dc > 0 && from.row < 5) return false;
    }
    return true;
  }

  private countBetween(board: BoardState, from: Position, to: Position): number {
    let count = 0;
    if (from.row === to.row) {
      const minC = Math.min(from.col, to.col);
      const maxC = Math.max(from.col, to.col);
      for (let c = minC + 1; c < maxC; c++) {
        if (board[from.row][c]) count++;
      }
    } else {
      const minR = Math.min(from.row, to.row);
      const maxR = Math.max(from.row, to.row);
      for (let r = minR + 1; r < maxR; r++) {
        if (board[r][from.col]) count++;
      }
    }
    return count;
  }

  private isKingsFacing(board: BoardState): boolean {
    let redKing: Position | null = null;
    let blackKing: Position | null = null;
    for (let r = 0; r <= 9; r++) {
      for (let c = 0; c <= 8; c++) {
        const p = board[r][c];
        if (p?.type === 'king') {
          if (p.color === 'red') redKing = { row: r, col: c };
          else blackKing = { row: r, col: c };
        }
      }
    }
    if (!redKing || !blackKing || redKing.col !== blackKing.col) return false;
    const minR = Math.min(redKing.row, blackKing.row);
    const maxR = Math.max(redKing.row, blackKing.row);
    for (let r = minR + 1; r < maxR; r++) {
      if (board[r][redKing.col]) return false;
    }
    return true;
  }

  private isInCheck(board: BoardState, color: PieceColor): boolean {
    let kingPos: Position | null = null;
    for (let r = 0; r <= 9; r++) {
      for (let c = 0; c <= 8; c++) {
        const p = board[r][c];
        if (p?.type === 'king' && p.color === color) {
          kingPos = { row: r, col: c };
          break;
        }
      }
      if (kingPos) break;
    }
    if (!kingPos) return false;

    const opponent = color === 'red' ? 'black' : 'red';
    for (let r = 0; r <= 9; r++) {
      for (let c = 0; c <= 8; c++) {
        const p = board[r][c];
        if (p && p.color === opponent) {
          if (this.validatePieceMove(board, { row: r, col: c }, kingPos, p)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  sendChat(message: string) {
    this.send({ type: 'CHAT_MESSAGE', payload: { message } });
  }

  resign() {
    this.send({ type: 'RESIGN', payload: {} });
  }

  private send(message: WSMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  isMyTurn(): boolean {
    if (!this.gameState || !this.myColor) return false;
    return this.gameState.currentTurn === this.myColor;
  }

  getGameState(): GameState | null {
    return this.gameState;
  }

  getMyColor(): PieceColor | null {
    return this.myColor;
  }

  getSelectedPos(): Position | null {
    return this.selectedPos;
  }

  getValidMoves(): Position[] {
    return this.validMoves;
  }

  getChatMessages() {
    return this.chatMessages;
  }

  getRoomId(): string {
    return this.roomId;
  }

  setDragging(dragging: boolean, pos?: Position, pixelPos?: { x: number; y: number }) {
    this.dragging = dragging;
    this.dragPos = pos || null;
    this.dragPixelPos = pixelPos || null;
    this.emit('dragUpdate', { dragging: this.dragging, pos: this.dragPos, pixelPos: this.dragPixelPos });
  }

  isDragging(): boolean {
    return this.dragging;
  }

  getDragInfo() {
    return { pos: this.dragPos, pixelPos: this.dragPixelPos };
  }

  clearSelection() {
    this.selectedPos = null;
    this.validMoves = [];
    this.emit('selectionChanged', { selectedPos: null, validMoves: [] });
  }

  requestReplay() {
    this.send({ type: 'REQUEST_REPLAY', payload: {} });
  }

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  getPieceName(piece: Piece): string {
    return PIECE_NAMES[piece.type][piece.color];
  }

  destroy() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.ws) this.ws.close();
    this.eventCallbacks = [];
  }
}
