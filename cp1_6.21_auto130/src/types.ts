export interface Skill {
  name: string;
  hitRate: number;
  critRate: number;
  multiplier: number;
}

export interface PokemonData {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  color: string;
  skills: Skill[];
}

export interface BattleResult {
  hit: boolean;
  critical: boolean;
  damage: number;
  remainingHp: number;
}

export interface BattleLogEntry {
  attacker: string;
  skillName: string;
  hit: boolean;
  critical: boolean;
  damage: number;
  defenderHp: number;
  defenderMaxHp: number;
}

export interface Position {
  row: number;
  col: number;
}

export const POKEMON_CATALOG: Omit<PokemonData, 'hp'>[] = [
  {
    id: 'charmander',
    name: '小火龙',
    maxHp: 100,
    attack: 13,
    defense: 9,
    color: '#FF6B6B',
    skills: [
      { name: '火焰喷射', hitRate: 0.85, critRate: 0.12, multiplier: 1.3 },
      { name: '火花', hitRate: 0.95, critRate: 0.05, multiplier: 1.0 },
    ],
  },
  {
    id: 'bulbasaur',
    name: '妙蛙种子',
    maxHp: 110,
    attack: 11,
    defense: 11,
    color: '#4CAF50',
    skills: [
      { name: '藤鞭', hitRate: 0.90, critRate: 0.08, multiplier: 1.2 },
      { name: '飞叶快刀', hitRate: 0.80, critRate: 0.15, multiplier: 1.5 },
    ],
  },
  {
    id: 'squirtle',
    name: '杰尼龟',
    maxHp: 120,
    attack: 10,
    defense: 12,
    color: '#42A5F5',
    skills: [
      { name: '水枪', hitRate: 0.90, critRate: 0.10, multiplier: 1.1 },
      { name: '水炮', hitRate: 0.75, critRate: 0.15, multiplier: 1.5 },
    ],
  },
  {
    id: 'pikachu',
    name: '皮卡丘',
    maxHp: 80,
    attack: 15,
    defense: 8,
    color: '#FFD54F',
    skills: [
      { name: '十万伏特', hitRate: 0.85, critRate: 0.12, multiplier: 1.4 },
      { name: '电光一闪', hitRate: 0.95, critRate: 0.05, multiplier: 1.0 },
    ],
  },
];

export function createPokemon(catalog: Omit<PokemonData, 'hp'>): PokemonData {
  return { ...catalog, hp: catalog.maxHp };
}
