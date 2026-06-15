export interface RaceAttributes {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  defaultCooldown: number;
  particleType: 'leaf' | 'fire' | 'skull' | 'lightning' | 'gear';
}

export interface RaceColorScheme {
  primary: string;
  secondary: string;
  gradientFrom: string;
  gradientTo: string;
  glow: string;
  particle: string;
}

export interface RaceConfig {
  id: string;
  name: string;
  attributes: RaceAttributes;
  skills: string[];
  colorScheme: RaceColorScheme;
  iconPath: string;
  isCustom?: boolean;
}

export interface CardInstance {
  id: string;
  race: RaceConfig;
  currentHp: number;
  maxHp: number;
  skillCooldowns: Record<string, number>;
  team: 'blue' | 'red';
  gridPos: { row: number; col: number } | null;
}

export interface BattleAction {
  turn: number;
  timestamp: number;
  attackerId: string;
  attackerName: string;
  targetId: string;
  targetName: string;
  damage: number;
  attackerHpBefore: number;
  targetHpBefore: number;
  attackerHpAfter: number;
  targetHpAfter: number;
}

export interface BattleSnapshot {
  turn: number;
  cards: CardInstance[];
  currentTeam: 'blue' | 'red';
  actions: BattleAction[];
}

export const SKILLS: Skill[] = [
  { id: 'arrow_rain', name: '箭雨', description: '召唤箭矢如雨倾泻而下，对敌方全体造成伤害', defaultCooldown: 3, particleType: 'leaf' },
  { id: 'berserk', name: '狂暴', description: '进入狂暴状态，攻击力大幅提升但防御降低', defaultCooldown: 2, particleType: 'fire' },
  { id: 'dark_drain', name: '暗影汲取', description: '吸取敌方生命值回复自身', defaultCooldown: 3, particleType: 'skull' },
  { id: 'dragon_breath', name: '龙息', description: '喷吐烈焰灼烧目标', defaultCooldown: 4, particleType: 'fire' },
  { id: 'mechanical_shield', name: '机甲护盾', description: '展开机械护盾大幅提升防御', defaultCooldown: 2, particleType: 'gear' },
  { id: 'nature_heal', name: '自然治愈', description: '呼唤自然之力回复生命', defaultCooldown: 3, particleType: 'leaf' },
  { id: 'war_stomp', name: '战争践踏', description: '猛力践踏地面造成范围伤害', defaultCooldown: 2, particleType: 'fire' },
  { id: 'soul_bind', name: '灵魂绑定', description: '绑定目标灵魂使其无法行动一回合', defaultCooldown: 4, particleType: 'skull' },
  { id: 'thunder_strike', name: '雷霆一击', description: '召唤雷电轰击敌人', defaultCooldown: 3, particleType: 'lightning' },
  { id: 'overclock', name: '超频运转', description: '超频机械核心获得额外行动机会', defaultCooldown: 4, particleType: 'gear' },
];

const ELF_ICON = 'M12 2C10 2 8 4 8 7C8 9 9 11 10 12L8 22H10L12 16L14 22H16L14 12C15 11 16 9 16 7C16 4 14 2 12 2ZM12 4C13 4 14 5 14 7C14 9 13 10 12 10C11 10 10 9 10 7C10 5 11 4 12 4Z';
const ORC_ICON = 'M8 3L5 8V14L8 20H16L19 14V8L16 3H14V7H10V3H8ZM10 10H14V14H10V10Z';
const UNDEAD_ICON = 'M12 2L8 6V10L6 12V18L8 20H10V16H14V20H16L18 18V12L16 10V6L12 2ZM10 8H14V12H10V8Z';
const DRAGON_ICON = 'M4 8L2 12V16L4 20H8L10 18H14L16 20H20L22 16V12L20 8L16 6H14L12 4L10 6H8L4 8ZM10 10H14V14H10V10Z';
const MECH_ICON = 'M6 4V8H4V16H6V20H18V16H20V8H18V4H14V8H10V4H6ZM10 12H14V16H10V12Z';

const ELF_COLORS: RaceColorScheme = {
  primary: '#2dd4a0',
  secondary: '#06b690',
  gradientFrom: '#06b690',
  gradientTo: '#2dd4a0',
  glow: 'rgba(45,212,160,0.6)',
  particle: '#4ade80',
};
const ORC_COLORS: RaceColorScheme = {
  primary: '#ef4444',
  secondary: '#b91c1c',
  gradientFrom: '#b91c1c',
  gradientTo: '#ef4444',
  glow: 'rgba(239,68,68,0.6)',
  particle: '#f97316',
};
const UNDEAD_COLORS: RaceColorScheme = {
  primary: '#a78bfa',
  secondary: '#6d28d9',
  gradientFrom: '#6b7280',
  gradientTo: '#a78bfa',
  glow: 'rgba(167,139,250,0.6)',
  particle: '#c4b5fd',
};
const DRAGON_COLORS: RaceColorScheme = {
  primary: '#f59e0b',
  secondary: '#d97706',
  gradientFrom: '#d97706',
  gradientTo: '#f59e0b',
  glow: 'rgba(245,158,11,0.6)',
  particle: '#fbbf24',
};
const MECH_COLORS: RaceColorScheme = {
  primary: '#38bdf8',
  secondary: '#0284c7',
  gradientFrom: '#0284c7',
  gradientTo: '#38bdf8',
  glow: 'rgba(56,189,248,0.6)',
  particle: '#7dd3fc',
};

export const DEFAULT_RACES: RaceConfig[] = [
  {
    id: 'elf',
    name: '精灵',
    attributes: { hp: 90, attack: 55, defense: 20, speed: 8 },
    skills: ['arrow_rain', 'nature_heal'],
    colorScheme: ELF_COLORS,
    iconPath: ELF_ICON,
  },
  {
    id: 'orc',
    name: '兽人',
    attributes: { hp: 160, attack: 75, defense: 35, speed: 4 },
    skills: ['berserk', 'war_stomp'],
    colorScheme: ORC_COLORS,
    iconPath: ORC_ICON,
  },
  {
    id: 'undead',
    name: '亡灵',
    attributes: { hp: 110, attack: 60, defense: 15, speed: 6 },
    skills: ['dark_drain', 'soul_bind'],
    colorScheme: UNDEAD_COLORS,
    iconPath: UNDEAD_ICON,
  },
  {
    id: 'dragonborn',
    name: '龙裔',
    attributes: { hp: 180, attack: 85, defense: 40, speed: 5 },
    skills: ['dragon_breath', 'thunder_strike'],
    colorScheme: DRAGON_COLORS,
    iconPath: DRAGON_ICON,
  },
  {
    id: 'mech',
    name: '机械',
    attributes: { hp: 130, attack: 50, defense: 45, speed: 3 },
    skills: ['mechanical_shield', 'overclock'],
    colorScheme: MECH_COLORS,
    iconPath: MECH_ICON,
  },
];

export const ATTRIBUTE_RANGES: Record<keyof RaceAttributes, { min: number; max: number; label: string; color: string }> = {
  hp: { min: 50, max: 200, label: '生命', color: '#ef4444' },
  attack: { min: 10, max: 100, label: '攻击', color: '#f59e0b' },
  defense: { min: 5, max: 50, label: '防御', color: '#3b82f6' },
  speed: { min: 1, max: 10, label: '速度', color: '#22c55e' },
};

export function calculateBattlePower(attr: RaceAttributes): string {
  const score = attr.hp * 0.3 + attr.attack * 0.4 + attr.defense * 0.2 + attr.speed * 5;
  if (score >= 120) return 'S';
  if (score >= 90) return 'A';
  if (score >= 60) return 'B';
  return 'C';
}

export function getSkillById(id: string): Skill | undefined {
  return SKILLS.find(s => s.id === id);
}

export function createCardFromRace(race: RaceConfig, team: 'blue' | 'red'): CardInstance {
  return {
    id: `${race.id}_${team}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    race,
    currentHp: race.attributes.hp,
    maxHp: race.attributes.hp,
    skillCooldowns: {},
    team,
    gridPos: null,
  };
}

export function loadSavedRaces(): RaceConfig[] {
  try {
    const data = localStorage.getItem('custom_races');
    if (data) return JSON.parse(data);
  } catch { /* ignore */ }
  return [];
}

export function saveCustomRace(race: RaceConfig): void {
  const saved = loadSavedRaces();
  const existing = saved.findIndex(r => r.id === race.id);
  if (existing >= 0) saved[existing] = race;
  else saved.push(race);
  localStorage.setItem('custom_races', JSON.stringify(saved));
}

export function isMobile(): boolean {
  return window.innerWidth <= 768;
}
