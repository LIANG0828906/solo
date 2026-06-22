import type { DiceValue, Bet, BetOption, GameResult, Player } from '../types/game';
import { BET_OPTIONS } from '../types/game';

export function rollDice(): [DiceValue, DiceValue, DiceValue] {
  return [
    Math.floor(Math.random() * 6) + 1 as DiceValue,
    Math.floor(Math.random() * 6) + 1 as DiceValue,
    Math.floor(Math.random() * 6) + 1 as DiceValue,
  ];
}

export function calculateResult(dice: [DiceValue, DiceValue, DiceValue]): GameResult {
  const sum = dice[0] + dice[1] + dice[2];
  const sorted = [...dice].sort((a, b) => a - b);

  return {
    big: sum >= 10 && sum <= 18,
    small: sum >= 3 && sum <= 9,
    odd: sum % 2 === 1,
    even: sum % 2 === 0,
    pair: sorted[0] === sorted[1] || sorted[1] === sorted[2],
    triple: sorted[0] === sorted[1] && sorted[1] === sorted[2],
    sum,
  };
}

export function calculatePayout(bet: Bet, result: GameResult): number {
  const odds = BET_OPTIONS[bet.option].odds;
  const won = result[bet.option];
  return won ? bet.amount * (odds + 1) : 0;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function generateAIPlayers(): Player[] {
  const names = ['王员外', '李掌柜', '张公子', '陈捕快', '刘老板'];
  const avatars = ['🎭', '🧔', '👨‍🎓', '👮', '🧑‍💼'];
  
  return names.slice(0, 3).map((name, index) => ({
    id: `ai-${index}`,
    name,
    avatar: avatars[index],
    chips: Math.floor(Math.random() * 1000) + 500,
    isBanker: false,
    isAI: true,
  }));
}

export function generateAIBets(aiPlayers: Player[]): Bet[] {
  const options: BetOption[] = ['big', 'small', 'odd', 'even', 'pair', 'triple'];
  const bets: Bet[] = [];

  aiPlayers.forEach((player) => {
    if (player.chips <= 0) return;

    const numBets = Math.floor(Math.random() * 2) + 1;
    const usedOptions = new Set<BetOption>();

    for (let i = 0; i < numBets; i++) {
      let option: BetOption;
      do {
        option = options[Math.floor(Math.random() * options.length)];
      } while (usedOptions.has(option));
      usedOptions.add(option);

      const maxBet = Math.min(player.chips, 100);
      const amount = Math.floor(Math.random() * maxBet) + 1;

      bets.push({
        id: generateId(),
        option,
        amount,
        playerId: player.id,
      });
    }
  });

  return bets;
}

export function getDiceDots(value: DiceValue): number[][] {
  const patterns: Record<DiceValue, number[][]> = {
    1: [[1, 1]],
    2: [[0, 0], [2, 2]],
    3: [[0, 0], [1, 1], [2, 2]],
    4: [[0, 0], [0, 2], [2, 0], [2, 2]],
    5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
    6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
  };
  return patterns[value];
}
