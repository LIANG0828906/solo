export enum GameState {
  IDLE = 'idle',
  PLAYING = 'playing',
  ENDED = 'ended'
}

export interface ScoreUpdate {
  player: number;
  points: number;
  position: { x: number; y: number };
}

export class GameModule {
  private state: GameState = GameState.IDLE;
  private scores: number[] = [0, 0];
  private countdown: number = 90;
  private maxTime: number = 90;
  private countdownInterval: number | null = null;
  private onStateChange?: (state: GameState) => void;
  private onScoreUpdate?: (update: ScoreUpdate) => void;
  private onCountdownUpdate?: (time: number, progress: number) => void;

  getState(): GameState {
    return this.state;
  }

  getScores(): number[] {
    return [...this.scores];
  }

  getCountdown(): number {
    return this.countdown;
  }

  getCountdownProgress(): number {
    return this.countdown / this.maxTime;
  }

  setCallbacks(
    onStateChange: (state: GameState) => void,
    onScoreUpdate: (update: ScoreUpdate) => void,
    onCountdownUpdate: (time: number, progress: number) => void
  ): void {
    this.onStateChange = onStateChange;
    this.onScoreUpdate = onScoreUpdate;
    this.onCountdownUpdate = onCountdownUpdate;
  }

  startGame(): void {
    if (this.state !== GameState.IDLE) return;

    this.state = GameState.PLAYING;
    this.scores = [0, 0];
    this.countdown = this.maxTime;

    this.onStateChange?.(this.state);
    this.onCountdownUpdate?.(this.countdown, 1);

    this.countdownInterval = window.setInterval(() => {
      this.countdown--;
      const progress = this.countdown / this.maxTime;
      
      this.onCountdownUpdate?.(this.countdown, progress);

      if (this.countdown <= 0) {
        this.endGame();
      }
    }, 1000);
  }

  endGame(): void {
    if (this.state !== GameState.PLAYING) return;

    this.state = GameState.ENDED;
    
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }

    this.onStateChange?.(this.state);
  }

  addScore(player: number, points: number, position: { x: number; y: number }): void {
    if (this.state !== GameState.PLAYING) return;
    if (player < 0 || player > 1) return;

    this.scores[player] += points;
    this.onScoreUpdate?.({ player, points, position });
  }

  resetGame(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }

    this.state = GameState.IDLE;
    this.scores = [0, 0];
    this.countdown = this.maxTime;

    this.onStateChange?.(this.state);
    this.onCountdownUpdate?.(this.countdown, 1);
  }

  getWinner(): number | null {
    if (this.state !== GameState.ENDED) return null;
    if (this.scores[0] > this.scores[1]) return 0;
    if (this.scores[1] > this.scores[0]) return 1;
    return null;
  }
}
