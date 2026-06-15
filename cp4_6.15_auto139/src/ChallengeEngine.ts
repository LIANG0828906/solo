import { GameType, getPlayerMaxScore } from './utils/scores';
import { scoreManager, ChallengeLog } from './ScoreManager';
import { v4 as uuidv4 } from 'uuid';

export type ChallengeStatus = 'idle' | 'pending' | 'active' | 'ended';

export interface ChallengeState {
  status: ChallengeStatus;
  challengerId: string | null;
  challengedId: string | null;
  game: GameType | null;
  duration: number;
  remainingTime: number;
  challengerScore: number;
  challengedScore: number;
  winnerId: string | null;
  scoreDiff: number;
}

export interface ChallengeRequest {
  challengerId: string;
  challengedId: string;
  game: GameType;
  duration: number;
}

export type RealTimeCallback = (state: ChallengeState) => void;
export type EndCallback = (result: { winnerId: string; scoreDiff: number; log: ChallengeLog }) => void;

export class ChallengeEngine {
  private state: ChallengeState = {
    status: 'idle',
    challengerId: null,
    challengedId: null,
    game: null,
    duration: 0,
    remainingTime: 0,
    challengerScore: 0,
    challengedScore: 0,
    winnerId: null,
    scoreDiff: 0,
  };

  private realTimeCallback: RealTimeCallback | null = null;
  private endCallback: EndCallback | null = null;
  private pollInterval: number | null = null;
  private startTime: number = 0;
  private challengerBaseScore: number = 0;
  private challengedBaseScore: number = 0;

  setRealTimeCallback(callback: RealTimeCallback | null): void {
    this.realTimeCallback = callback;
  }

  setEndCallback(callback: EndCallback | null): void {
    this.endCallback = callback;
  }

  getState(): ChallengeState {
    return { ...this.state };
  }

  startChallenge(request: ChallengeRequest): boolean {
    if (this.state.status === 'active') {
      return false;
    }

    const challenger = scoreManager.getPlayerById(request.challengerId);
    const challenged = scoreManager.getPlayerById(request.challengedId);

    if (!challenger || !challenged) {
      return false;
    }

    this.challengerBaseScore = getPlayerMaxScore(challenger, request.game);
    this.challengedBaseScore = getPlayerMaxScore(challenged, request.game);

    this.state = {
      status: 'active',
      challengerId: request.challengerId,
      challengedId: request.challengedId,
      game: request.game,
      duration: request.duration,
      remainingTime: request.duration,
      challengerScore: this.challengerBaseScore,
      challengedScore: this.challengedBaseScore,
      winnerId: null,
      scoreDiff: 0,
    };

    this.startTime = Date.now();
    this.emitState();

    this.pollInterval = window.setInterval(() => {
      this.tick();
    }, 100);

    return true;
  }

  private tick(): void {
    if (this.state.status !== 'active') return;

    const elapsed = (Date.now() - this.startTime) / 1000;
    const remaining = Math.max(0, this.state.duration - elapsed);

    const progress = elapsed / this.state.duration;
    this.state.challengerScore = Math.floor(
      this.challengerBaseScore + Math.sin(progress * Math.PI * 2) * 2000 + Math.random() * 1500
    );
    this.state.challengedScore = Math.floor(
      this.challengedBaseScore + Math.sin(progress * Math.PI * 2 + 1) * 2000 + Math.random() * 1500
    );

    this.state.remainingTime = remaining;
    this.emitState();

    if (remaining <= 0) {
      this.endChallenge();
    }
  }

  private endChallenge(): void {
    if (this.pollInterval !== null) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    const winnerId = this.state.challengerScore > this.state.challengedScore
      ? this.state.challengerId
      : this.state.challengedScore > this.state.challengerScore
        ? this.state.challengedId
        : Math.random() > 0.5 ? this.state.challengerId : this.state.challengedId;

    const scoreDiff = Math.abs(this.state.challengerScore - this.state.challengedScore);

    this.state.status = 'ended';
    this.state.winnerId = winnerId;
    this.state.scoreDiff = scoreDiff;

    const log: ChallengeLog = {
      id: uuidv4(),
      challengerId: this.state.challengerId!,
      challengedId: this.state.challengedId!,
      game: this.state.game!,
      duration: this.state.duration,
      challengerFinalScore: this.state.challengerScore,
      challengedFinalScore: this.state.challengedScore,
      winnerId: winnerId!,
      timestamp: Date.now(),
    };

    scoreManager.recordChallenge(log);
    this.emitState();

    if (this.endCallback) {
      this.endCallback({ winnerId: winnerId!, scoreDiff, log });
    }

    setTimeout(() => {
      this.reset();
    }, 3000);
  }

  reset(): void {
    if (this.pollInterval !== null) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    this.state = {
      status: 'idle',
      challengerId: null,
      challengedId: null,
      game: null,
      duration: 0,
      remainingTime: 0,
      challengerScore: 0,
      challengedScore: 0,
      winnerId: null,
      scoreDiff: 0,
    };

    this.emitState();
  }

  private emitState(): void {
    if (this.realTimeCallback) {
      this.realTimeCallback({ ...this.state });
    }
  }
}

export const challengeEngine = new ChallengeEngine();
