import { v4 as uuidv4 } from 'uuid';
import {
  ThemeType,
  validateWordMatch,
  getRandomStartWord,
  getWordsByTheme
} from './words';

export interface Player {
  id: string;
  name: string;
  wordsCount: number;
}

export type LoseReason = 'timeout' | 'duplicate';

export interface GameEngineCallbacks {
  onTimeUpdate: (timeLeft: number) => void;
  onTurnChange: (playerIndex: 0 | 1) => void;
  onWordAdded: (word: string, playerIndex: 0 | 1) => void;
  onGameOver: (winner: Player, loser: Player, reason: LoseReason) => void;
  onError: (message: string) => void;
}

const TURN_DURATION = 30;
const TICK_INTERVAL = 50;

export class GameEngine {
  private theme: ThemeType = 'idiom';
  private players: [Player, Player] = [
    { id: uuidv4(), name: '玩家1', wordsCount: 0 },
    { id: uuidv4(), name: '玩家2', wordsCount: 0 }
  ];
  private currentPlayerIndex: 0 | 1 = 0;
  private timeLeft: number = TURN_DURATION;
  private wordHistory: string[] = [];
  private currentWord: string = '';
  private timerId: number | null = null;
  private callbacks: GameEngineCallbacks;
  private isRunning: boolean = false;

  constructor(callbacks: GameEngineCallbacks) {
    this.callbacks = callbacks;
  }

  startGame(theme: ThemeType, playerNames: [string, string]): void {
    this.stopTimer();
    this.theme = theme;
    this.players = [
      { id: uuidv4(), name: playerNames[0] || '玩家1', wordsCount: 0 },
      { id: uuidv4(), name: playerNames[1] || '玩家2', wordsCount: 0 }
    ];
    this.currentPlayerIndex = 0;
    this.timeLeft = TURN_DURATION;
    this.wordHistory = [];
    this.currentWord = getRandomStartWord(theme);
    this.wordHistory.push(this.currentWord);
    this.isRunning = true;

    this.callbacks.onWordAdded(this.currentWord, -1 as unknown as 0 | 1);
    this.callbacks.onTurnChange(this.currentPlayerIndex);
    this.callbacks.onTimeUpdate(this.timeLeft);

    this.startTimer();
  }

  submitWord(word: string): boolean {
    if (!this.isRunning) return false;

    const trimmedWord = word.trim();

    if (!trimmedWord) {
      this.callbacks.onError('请输入一个词语');
      return false;
    }

    if (!validateWordMatch(this.currentWord, trimmedWord)) {
      this.callbacks.onError(`首字必须与"${this.currentWord}"的尾字相同`);
      return false;
    }

    const normalizedHistory = this.wordHistory.map((w) =>
      w.trim().toLowerCase()
    );
    if (normalizedHistory.includes(trimmedWord.toLowerCase())) {
      this.gameOver('duplicate');
      return false;
    }

    const words = getWordsByTheme(this.theme);
    if (this.theme !== 'english') {
      const normalizedWords = words.map((w) => w.trim().toLowerCase());
      if (!normalizedWords.includes(trimmedWord.toLowerCase())) {
        this.callbacks.onError('该词语不在词库中，请换一个');
        return false;
      }
    }

    this.wordHistory.push(trimmedWord);
    this.currentWord = trimmedWord;
    this.players[this.currentPlayerIndex].wordsCount++;

    this.callbacks.onWordAdded(trimmedWord, this.currentPlayerIndex);

    this.switchTurn();
    return true;
  }

  private switchTurn(): void {
    this.currentPlayerIndex = this.currentPlayerIndex === 0 ? 1 : 0;
    this.timeLeft = TURN_DURATION;
    this.callbacks.onTurnChange(this.currentPlayerIndex);
    this.callbacks.onTimeUpdate(this.timeLeft);
    this.resetTimer();
  }

  private startTimer(): void {
    this.stopTimer();
    const startTime = Date.now();
    const initialTime = this.timeLeft;

    this.timerId = window.setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      this.timeLeft = Math.max(0, initialTime - elapsed);
      this.callbacks.onTimeUpdate(this.timeLeft);

      if (this.timeLeft <= 0) {
        this.gameOver('timeout');
      }
    }, TICK_INTERVAL);
  }

  private resetTimer(): void {
    this.startTimer();
  }

  private stopTimer(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private gameOver(reason: LoseReason): void {
    if (!this.isRunning) return;
    this.isRunning = false;
    this.stopTimer();

    const loserIndex = this.currentPlayerIndex;
    const winnerIndex = loserIndex === 0 ? 1 : 0;
    const winner = { ...this.players[winnerIndex] };
    const loser = { ...this.players[loserIndex] };

    this.callbacks.onGameOver(winner, loser, reason);
  }

  destroy(): void {
    this.stopTimer();
    this.isRunning = false;
  }

  getState() {
    return {
      theme: this.theme,
      players: this.players,
      currentPlayerIndex: this.currentPlayerIndex,
      timeLeft: this.timeLeft,
      wordHistory: [...this.wordHistory],
      currentWord: this.currentWord,
      isRunning: this.isRunning
    };
  }
}
