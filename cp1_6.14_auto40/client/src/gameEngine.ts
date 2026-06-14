import { RoomState, TeamInfo, PublicPlayer } from './roomManager';

export interface RoundStartData extends RoomState {
  word: string | null;
  wordLength: number;
  isDrawer: boolean;
  drawerInfo: PublicPlayer[];
}

export interface RoundEndData extends RoomState {
  word: string;
  roundScore: number;
  teamId: number;
  isLastRound: boolean;
  guessed: boolean;
}

export interface GameEndData extends RoomState {
  finalRankings: {
    rank: number;
    teamId: number;
    teamName: string;
    totalScore: number;
    roundScores: number[];
    players: { nickname: string; avatar: string }[];
  }[];
}

class GameEngine {
  private roomState: RoomState | null = null;
  private roundStart: RoundStartData | null = null;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private hintCooldownInterval: ReturnType<typeof setInterval> | null = null;
  private timeRemaining: number = 0;
  private hintCooldown: number = 0;
  private listeners: Set<(type: string, data: any) => void> = new Set();
  private audioCtx: AudioContext | null = null;

  setRoomState(state: RoomState) {
    this.roomState = state;
  }

  getRoomState() {
    return this.roomState;
  }

  startRound(data: RoundStartData) {
    this.roundStart = data;
    this.roomState = data;
    this.timeRemaining = data.roundDuration;
    this.stopTimers();
    const startTime = data.roundStartTime;

    this.timerInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      this.timeRemaining = Math.max(0, Math.ceil(data.roundDuration - elapsed));
      this.emit('tick', { timeRemaining: this.timeRemaining });
      if (this.timeRemaining <= 0) {
        this.stopTimers();
      }
    }, 250);

    this.startHintCooldown();
    this.emit('round_start', data);
  }

  startHintCooldown() {
    this.hintCooldown = 10;
    if (this.hintCooldownInterval) clearInterval(this.hintCooldownInterval);
    this.hintCooldownInterval = setInterval(() => {
      this.hintCooldown = Math.max(0, this.hintCooldown - 0.1);
      this.emit('hint_cooldown', { cooldown: this.hintCooldown, max: 10 });
    }, 100);
  }

  resetHintCooldown() {
    this.startHintCooldown();
  }

  canUseHint() {
    return this.hintCooldown <= 0;
  }

  getHintCooldownPct() {
    return Math.max(0, Math.min(100, ((10 - this.hintCooldown) / 10) * 100));
  }

  getTimeRemaining() {
    return this.timeRemaining;
  }

  stopTimers() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.hintCooldownInterval) {
      clearInterval(this.hintCooldownInterval);
      this.hintCooldownInterval = null;
    }
  }

  calculateRoundScore(
    base: number,
    hintsUsed: number,
    wrongGuesses: number,
    timeRemaining: number
  ): number {
    let score = base;
    score -= hintsUsed * 20;
    score -= wrongGuesses * 10;
    score += Math.min(50, Math.floor(timeRemaining / 10) * 5);
    return Math.max(0, score);
  }

  playVictorySound() {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = this.audioCtx;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
        gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + i * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.3);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.35);
      });
    } catch (e) {
      console.warn('Audio not available', e);
    }
  }

  playWrongSound() {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = this.audioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 200;
      osc.type = 'square';
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {
      console.warn('Audio not available', e);
    }
  }

  playDrawSound() {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = this.audioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 440 + Math.random() * 100;
      osc.type = 'triangle';
      gain.gain.setValueAtTime(0.02, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {}
  }

  emit(type: string, data: any) {
    this.listeners.forEach((cb) => cb(type, data));
  }

  on(callback: (type: string, data: any) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  destroy() {
    this.stopTimers();
    this.listeners.clear();
  }
}

export const gameEngine = new GameEngine();
