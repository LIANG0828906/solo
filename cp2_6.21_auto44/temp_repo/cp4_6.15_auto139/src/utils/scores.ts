export type GameType = 'raiden' | 'pacman' | 'spaceinvaders';

export interface GameScore {
  game: GameType;
  score: number;
  timestamp: number;
}

export interface Player {
  id: string;
  name: string;
  avatarColor: string;
  scores: GameScore[];
  totalChallenges: number;
  wins: number;
  screenshotUrl?: string;
  recentScores: number[];
}

export const GAME_TYPES: { value: GameType; label: string }[] = [
  { value: 'raiden', label: '雷电战机' },
  { value: 'pacman', label: '吃豆人' },
  { value: 'spaceinvaders', label: '太空侵略者' },
];

export const GAME_LABELS: Record<GameType, string> = {
  raiden: '雷电战机',
  pacman: '吃豆人',
  spaceinvaders: '太空侵略者',
};

function boxMullerTransform(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

function normalRandom(mean: number, stdDev: number): number {
  return mean + boxMullerTransform() * stdDev;
}

const AVATAR_COLORS = [
  '#ff2d95', '#b967ff', '#01cdfe', '#05ffa1',
  '#fffb96', '#ff71ce', '#ffd700', '#ff6b6b',
  '#4ecdc4', '#a8e6cf', '#ff8b94', '#c7ceea',
];

const ARCADE_NAMES = [
  'ACE', 'ZAP', 'NEO', 'MAX', 'RYU', 'JET', 'FOX', 'DEX',
  'KAI', 'LUX', 'NOVA', 'BLAZE', 'VORTEX', 'CYBER', 'PHANTOM',
  'WRAITH', 'RONIN', 'TITAN', 'ORION', 'ZEUS', 'RAZOR', 'VIPER',
  'GHOST', 'SHADOW', 'NINJA', 'SAMURAI', 'DRAGON', 'PHOENIX',
  'THUNDER', 'STORM', 'BLADE', 'FURY', 'HAVOC', 'MAVERICK',
  'REBEL', 'JOKER', 'TROJAN', 'SPARTA', 'ATLAS', 'ODIN',
];

function generateRandomName(): string {
  return ARCADE_NAMES[Math.floor(Math.random() * ARCADE_NAMES.length)] +
         Math.floor(Math.random() * 99).toString().padStart(2, '0');
}

function generateRandomColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

export function generateMockPlayers(count: number = 50): Player[] {
  const players: Player[] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < count; i++) {
    let name = generateRandomName();
    while (usedNames.has(name)) {
      name = generateRandomName() + Math.floor(Math.random() * 10);
    }
    usedNames.add(name);

    const games: GameType[] = ['raiden', 'pacman', 'spaceinvaders'];
    const scores: GameScore[] = [];
    const recentScores: number[] = [];

    for (const game of games) {
      const gameScores = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < gameScores; j++) {
        let score = Math.floor(normalRandom(10000, 3000));
        if (Math.random() < 0.05) {
          score = Math.floor(score * 1.8);
        }
        score = Math.max(500, score);
        scores.push({
          game,
          score,
          timestamp: Date.now() - Math.floor(Math.random() * 1000000),
        });
      }
    }

    for (let j = 0; j < 5; j++) {
      recentScores.push(Math.floor(normalRandom(10000, 3000)));
    }

    const totalChallenges = Math.floor(Math.random() * 20);
    const wins = Math.floor(Math.random() * (totalChallenges + 1));

    players.push({
      id: `player_${i}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      avatarColor: generateRandomColor(),
      scores,
      totalChallenges,
      wins,
      recentScores,
    });
  }

  return players;
}

export function getPlayerMaxScore(player: Player, game?: GameType): number {
  const relevant = game
    ? player.scores.filter(s => s.game === game)
    : player.scores;
  if (relevant.length === 0) return 0;
  return Math.max(...relevant.map(s => s.score));
}

export function getPlayerWinRate(player: Player): number {
  if (player.totalChallenges === 0) return 0;
  return player.wins / player.totalChallenges;
}
