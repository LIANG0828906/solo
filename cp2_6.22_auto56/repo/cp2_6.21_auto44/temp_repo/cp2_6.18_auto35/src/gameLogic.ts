import { v4 as uuidv4 } from 'uuid';
import {
  RuneType,
  SpellLevel,
  AlignmentMode,
  SpellRecord,
  RuneBoard,
  AlignmentResult,
  RuneConfig,
} from './types';

export const RUNE_CONFIGS: Record<RuneType, RuneConfig> = {
  [RuneType.FIRE]: {
    color: '#FF6B35',
    glowColor: 'rgba(255, 107, 53, 0.6)',
    icon: '🔥',
    name: '火焰',
  },
  [RuneType.ICE]: {
    color: '#4ECDC4',
    glowColor: 'rgba(78, 205, 196, 0.6)',
    icon: '❄️',
    name: '寒冰',
  },
  [RuneType.THUNDER]: {
    color: '#FFE66D',
    glowColor: 'rgba(255, 230, 109, 0.6)',
    icon: '⚡',
    name: '雷电',
  },
  [RuneType.WIND]: {
    color: '#95E1D3',
    glowColor: 'rgba(149, 225, 211, 0.6)',
    icon: '🌪️',
    name: '风',
  },
  [RuneType.EARTH]: {
    color: '#C9B037',
    glowColor: 'rgba(201, 176, 55, 0.6)',
    icon: '🪨',
    name: '大地',
  },
  [RuneType.SHADOW]: {
    color: '#9B59B6',
    glowColor: 'rgba(155, 89, 182, 0.6)',
    icon: '🌑',
    name: '暗影',
  },
};

export const MANA_COSTS: Record<SpellLevel, number> = {
  primary: 20,
  intermediate: 35,
  advanced: 50,
};

export const SPELL_NAMES: Record<RuneType, Record<SpellLevel, string>> = {
  [RuneType.FIRE]: {
    primary: '火球术',
    intermediate: '烈焰风暴',
    advanced: '陨石坠落',
  },
  [RuneType.ICE]: {
    primary: '冰锥术',
    intermediate: '冰霜新星',
    advanced: '绝对零度',
  },
  [RuneType.THUNDER]: {
    primary: '闪电链',
    intermediate: '雷霆一击',
    advanced: '天罚之雷',
  },
  [RuneType.WIND]: {
    primary: '风刃',
    intermediate: '龙卷风',
    advanced: '虚空风暴',
  },
  [RuneType.EARTH]: {
    primary: '石刺',
    intermediate: '地裂术',
    advanced: '山崩地裂',
  },
  [RuneType.SHADOW]: {
    primary: '暗影箭',
    intermediate: '虚空之触',
    advanced: '黑暗湮灭',
  },
};

export function createEmptyBoard(size: number = 3): RuneBoard {
  return Array.from({ length: size }, () => Array(size).fill(null));
}

export function getSpellLevelByAlignment(mode: AlignmentMode): SpellLevel {
  switch (mode) {
    case 'horizontal':
      return 'primary';
    case 'vertical':
      return 'intermediate';
    case 'diagonal':
      return 'advanced';
  }
}

export function checkAlignment(board: RuneBoard): AlignmentResult[] {
  const results: AlignmentResult[] = [];
  const size = board.length;

  for (let row = 0; row < size; row++) {
    const first = board[row][0];
    if (first && board[row].every((cell) => cell === first)) {
      results.push({
        type: first,
        mode: 'horizontal',
        level: getSpellLevelByAlignment('horizontal'),
      });
    }
  }

  for (let col = 0; col < size; col++) {
    const first = board[0][col];
    if (first && board.every((row) => row[col] === first)) {
      results.push({
        type: first,
        mode: 'vertical',
        level: getSpellLevelByAlignment('vertical'),
      });
    }
  }

  const mainDiag = board[0][0];
  if (mainDiag && board.every((row, i) => row[i] === mainDiag)) {
    results.push({
      type: mainDiag,
      mode: 'diagonal',
      level: getSpellLevelByAlignment('diagonal'),
    });
  }

  const antiDiag = board[0][size - 1];
  if (antiDiag && board.every((row, i) => row[size - 1 - i] === antiDiag)) {
    results.push({
      type: antiDiag,
      mode: 'diagonal',
      level: getSpellLevelByAlignment('diagonal'),
    });
  }

  return results;
}

export function calculateCombo(currentCombo: number, lastCastTime: number): number {
  const now = Date.now();
  const timeSinceLastCast = now - lastCastTime;

  if (timeSinceLastCast > 5000) {
    return 0;
  }

  return Math.min(currentCombo, 10);
}

export function consumeMana(
  currentMana: number,
  level: SpellLevel,
): { success: boolean; remaining: number } {
  const cost = MANA_COSTS[level];
  if (currentMana >= cost) {
    return { success: true, remaining: currentMana - cost };
  }
  return { success: false, remaining: currentMana };
}

export function regenerateMana(currentMana: number, maxMana: number, deltaTime: number): number {
  const regenRate = 5;
  const regenAmount = (regenRate * deltaTime) / 1000;
  return Math.min(currentMana + regenAmount, maxMana);
}

export function getSpellDamage(baseDamage: number, combo: number): number {
  const multiplier = 1 + combo * 0.1;
  return Math.floor(baseDamage * multiplier);
}

export function getAllSpells(): SpellRecord[] {
  const spells: SpellRecord[] = [];
  const runeTypes = Object.values(RuneType);
  const alignments: AlignmentMode[] = ['horizontal', 'vertical', 'diagonal'];

  runeTypes.forEach((type) => {
    alignments.forEach((alignment) => {
      const level = getSpellLevelByAlignment(alignment);
      spells.push({
        id: `${type}-${alignment}`,
        name: SPELL_NAMES[type][level],
        type,
        level,
        alignment,
        damage: level === 'primary' ? 50 : level === 'intermediate' ? 100 : 200,
        manaCost: MANA_COSTS[level],
      });
    });
  });

  return spells;
}

export function getCombinationKey(board: RuneBoard): string {
  return board.flat().map((r) => r || 'empty').join(',');
}

export function generateRandomCombination(
  triedCombinations: Set<string>,
  boardSize: number = 3,
): RuneBoard | null {
  const runeTypes = Object.values(RuneType);
  const maxAttempts = 1000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const board: RuneBoard = [];
    for (let i = 0; i < boardSize; i++) {
      const row: (RuneType | null)[] = [];
      for (let j = 0; j < boardSize; j++) {
        row.push(runeTypes[Math.floor(Math.random() * runeTypes.length)]);
      }
      board.push(row);
    }

    const key = getCombinationKey(board);
    if (!triedCombinations.has(key)) {
      return board;
    }
  }

  return null;
}

export function formatTimestamp(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export function createExplorationLog(
  runeCombination: RuneType[],
  success: boolean,
  spellLevel?: SpellLevel,
) {
  return {
    id: uuidv4(),
    timestamp: formatTimestamp(new Date()),
    runeCombination,
    success,
    spellLevel,
  };
}
