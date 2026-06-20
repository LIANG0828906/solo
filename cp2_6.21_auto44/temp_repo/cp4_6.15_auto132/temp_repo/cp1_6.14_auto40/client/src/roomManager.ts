import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

export interface PublicPlayer {
  id: string;
  nickname: string;
  team?: number;
  avatar: string;
  isDrawer?: boolean;
}

export interface TeamInfo {
  id: number;
  name: string;
  score: number;
  roundScores: number[];
  players: PublicPlayer[];
}

export interface RoomState {
  code: string;
  status: 'waiting' | 'playing' | 'finished';
  hostId: string;
  players: PublicPlayer[];
  teams: TeamInfo[];
  currentRound: number;
  totalRounds: number;
  currentTeamIndex: number;
  roundDuration: number;
  roundStartTime: number;
  hintsUsed: number;
  wrongGuesses: number;
  revealedLetters: boolean[];
  currentWordCategory: string;
}

type MessageCallback = (type: string, data: any) => void;

class RoomManager {
  private ws: WebSocket | null = null;
  private playerId: string;
  private roomCode: string | null = null;
  private nickname: string = '';
  private listeners: Set<MessageCallback> = new Set();
  private reconnectAttempts = 0;

  constructor() {
    const savedId = localStorage.getItem('gdb_player_id');
    this.playerId = savedId || uuidv4();
    if (!savedId) {
      localStorage.setItem('gdb_player_id', this.playerId);
    }
  }

  getPlayerId() {
    return this.playerId;
  }

  getRoomCode() {
    return this.roomCode;
  }

  getNickname() {
    return this.nickname;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          this.send('init_connection', { playerId: this.playerId });
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            this.listeners.forEach((cb) => cb(msg.type, msg.data));
          } catch (e) {
            console.error('WS parse error', e);
          }
        };

        this.ws.onerror = (err) => {
          console.error('WS error', err);
          reject(err);
        };

        this.ws.onclose = () => {
          if (this.roomCode && this.reconnectAttempts < 5) {
            this.reconnectAttempts++;
            setTimeout(() => this.connect(), 1000 * this.reconnectAttempts);
          }
        };
      } catch (e) {
        reject(e);
      }
    });
  }

  send(type: string, data: any = {}) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(
      JSON.stringify({
        type,
        data,
        roomCode: this.roomCode,
        playerId: this.playerId
      })
    );
  }

  async createRoom(nickname: string): Promise<string> {
    this.nickname = nickname;
    await this.connect();
    const res = await axios.post('/api/rooms', {
      nickname,
      playerId: this.playerId
    });
    const code = res.data.roomCode;
    this.roomCode = code;
    this.send('create_and_join', {
      playerId: this.playerId,
      nickname
    });
    return code;
  }

  async joinRoom(code: string, nickname: string): Promise<boolean> {
    this.nickname = nickname;
    await this.connect();
    const check = await axios.get(`/api/rooms/${code.toUpperCase()}/exists`);
    if (!check.data.exists) {
      return false;
    }
    this.roomCode = code.toUpperCase();
    this.send('join_room', {
      playerId: this.playerId,
      nickname
    });
    return true;
  }

  leaveRoom() {
    this.send('leave_room');
    this.roomCode = null;
  }

  startGame() {
    this.send('start_game');
  }

  submitGuess(guess: string) {
    this.send('submit_guess', { guess });
  }

  requestHint() {
    this.send('request_hint');
  }

  sendDrawAction(action: any) {
    this.send('draw_action', action);
  }

  clearCanvas() {
    this.send('canvas_clear');
  }

  undoCanvas() {
    this.send('canvas_undo');
  }

  notifyTimeout() {
    this.send('round_timeout');
  }

  onMessage(callback: MessageCallback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  disconnect() {
    this.roomCode = null;
    this.listeners.clear();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const roomManager = new RoomManager();
