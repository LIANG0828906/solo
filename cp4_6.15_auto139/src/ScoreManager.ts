import { generateMockPlayers, Player, GameType, getPlayerMaxScore, getPlayerWinRate, GameScore } from './utils/scores';

export type SortMode = 'score' | 'winrate' | 'challenges';

export type ScoreUpdateListener = (updatedPlayerIds: string[]) => void;

export interface ChallengeLog {
  id: string;
  challengerId: string;
  challengedId: string;
  game: GameType;
  duration: number;
  challengerFinalScore: number;
  challengedFinalScore: number;
  winnerId: string;
  timestamp: number;
}

export class ScoreManager {
  private players: Map<string, Player> = new Map();
  private listeners: Set<ScoreUpdateListener> = new Set();
  private challengeLogs: ChallengeLog[] = [];

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    const mockPlayers = generateMockPlayers(50);
    for (const player of mockPlayers) {
      this.players.set(player.id, player);
    }
  }

  subscribe(listener: ScoreUpdateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(playerIds: string[]): void {
    for (const listener of this.listeners) {
      listener(playerIds);
    }
  }

  getAllPlayers(): Player[] {
    return Array.from(this.players.values());
  }

  getPlayerById(id: string): Player | undefined {
    return this.players.get(id);
  }

  getTopScores(
    game?: GameType,
    sortMode: SortMode = 'score',
    limit?: number
  ): Player[] {
    const players = Array.from(this.players.values());

    let sorted: Player[];
    switch (sortMode) {
      case 'score':
        sorted = players.sort((a, b) => getPlayerMaxScore(b, game) - getPlayerMaxScore(a, game));
        break;
      case 'winrate':
        sorted = players.sort((a, b) => getPlayerWinRate(b) - getPlayerWinRate(a));
        break;
      case 'challenges':
        sorted = players.sort((a, b) => b.totalChallenges - a.totalChallenges);
        break;
      default:
        sorted = players;
    }

    return limit ? sorted.slice(0, limit) : sorted;
  }

  registerPlayer(name: string): Player {
    const colors = ['#ff2d95', '#b967ff', '#01cdfe', '#05ffa1', '#fffb96', '#ff71ce', '#ffd700'];
    const initialScore = Math.floor(Math.random() * 10000) + 5000;
    const games: GameType[] = ['raiden', 'pacman', 'spaceinvaders'];
    const randomGame = games[Math.floor(Math.random() * games.length)];

    const player: Player = {
      id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name.toUpperCase(),
      avatarColor: colors[Math.floor(Math.random() * colors.length)],
      scores: [
        {
          game: randomGame,
          score: initialScore,
          timestamp: Date.now(),
        },
      ],
      totalChallenges: 0,
      wins: 0,
      recentScores: Array(5).fill(0).map(() => Math.floor(Math.random() * 10000) + 5000),
    };

    this.players.set(player.id, player);
    this.emit([player.id]);
    return player;
  }

  addScore(playerId: string, game: GameType, score: number, screenshotUrl?: string): void {
    const player = this.players.get(playerId);
    if (!player) return;

    const gameScore: GameScore = {
      game,
      score,
      timestamp: Date.now(),
    };

    player.scores.push(gameScore);
    if (screenshotUrl) {
      player.screenshotUrl = screenshotUrl;
    }

    player.recentScores.push(score);
    if (player.recentScores.length > 5) {
      player.recentScores.shift();
    }

    this.emit([playerId]);
  }

  setScreenshotUrl(playerId: string, url: string): void {
    const player = this.players.get(playerId);
    if (!player) return;
    player.screenshotUrl = url;
    this.emit([playerId]);
  }

  recordChallenge(log: ChallengeLog): void {
    this.challengeLogs.push(log);

    const challenger = this.players.get(log.challengerId);
    const challenged = this.players.get(log.challengedId);

    if (challenger) {
      challenger.totalChallenges++;
      if (log.winnerId === log.challengerId) {
        challenger.wins++;
      }
    }

    if (challenged) {
      challenged.totalChallenges++;
      if (log.winnerId === log.challengedId) {
        challenged.wins++;
      }
    }

    this.emit([log.challengerId, log.challengedId]);
  }

  getChallengeLogs(): ChallengeLog[] {
    return this.challengeLogs;
  }
}

export const scoreManager = new ScoreManager();
