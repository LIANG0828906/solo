export enum Race {
  HUMAN = 'human',
  ELF = 'elf',
  ORC = 'orc',
  UNDEAD = 'undead'
}

export interface Hero {
  id: string;
  name: string;
  race: Race;
  radius: number;
  baseRadius: number;
  position: { x: number; z: number };
  velocity: { x: number; z: number };
  baseSpeed: number;
  isBuffed: boolean;
  isAlive: boolean;
}

export interface FormationTemplate {
  id: string;
  name: string;
  description: string;
  heroRaces: Race[];
  icon: string;
}

export interface BondResult {
  buffedHeroId?: string;
  allAgile: boolean;
}

const HERO_NAMES: Record<Race, string[]> = {
  [Race.HUMAN]: ['亚瑟', '加拉哈德', '兰斯洛特', '珀西瓦尔', '加文'],
  [Race.ELF]: ['莱戈拉斯', '塔瑞尔', '瑟兰迪尔', '阿尔温', '凯勒鹏'],
  [Race.ORC]: ['格鲁姆', '阿索格', '博尔克', '戈尔巴什', '沙库'],
  [Race.UNDEAD]: ['阿尔萨斯', '克尔苏加德', '希尔瓦娜斯', '阿努巴拉克', '普崔塞德']
};

const FORMATION_TEMPLATES: FormationTemplate[] = [
  {
    id: 'all-human',
    name: '全人类联军',
    description: '圣光庇护的黄金军团',
    heroRaces: [Race.HUMAN, Race.HUMAN, Race.HUMAN, Race.HUMAN, Race.HUMAN],
    icon: '⚔️'
  },
  {
    id: 'all-elf',
    name: '精灵游侠',
    description: '森林守护的神射手',
    heroRaces: [Race.ELF, Race.ELF, Race.ELF, Race.ELF, Race.ELF],
    icon: '🏹'
  },
  {
    id: 'mixed',
    name: '混合联军',
    description: '四大种族协同作战',
    heroRaces: [Race.HUMAN, Race.ELF, Race.ORC, Race.UNDEAD, Race.HUMAN],
    icon: '🛡️'
  },
  {
    id: 'random',
    name: '随机乱斗',
    description: '命运决定的混沌战场',
    heroRaces: [],
    icon: '🎲'
  }
];

function randomRadius(): number {
  return 0.4 + Math.random() * 0.4;
}

function randomPositionInArena(arenaRadius: number): { x: number; z: number } {
  const angle = Math.random() * Math.PI * 2;
  const r = Math.random() * (arenaRadius - 1.5);
  return {
    x: Math.cos(angle) * r,
    z: Math.sin(angle) * r
  };
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export function getFormationTemplates(): FormationTemplate[] {
  return [...FORMATION_TEMPLATES];
}

export function createFormation(templateId: string, arenaRadius: number = 8): Hero[] {
  const template = FORMATION_TEMPLATES.find(t => t.id === templateId);
  if (!template) return [];

  let races: Race[];
  if (templateId === 'random') {
    const allRaces = [Race.HUMAN, Race.ELF, Race.ORC, Race.UNDEAD];
    races = Array.from({ length: 5 }, () => allRaces[Math.floor(Math.random() * allRaces.length)]);
  } else {
    races = [...template.heroRaces];
  }

  const usedNames: Record<Race, number> = {
    [Race.HUMAN]: 0,
    [Race.ELF]: 0,
    [Race.ORC]: 0,
    [Race.UNDEAD]: 0
  };

  return races.map(race => {
    const nameIndex = usedNames[race] % HERO_NAMES[race].length;
    usedNames[race]++;
    const radius = randomRadius();
    return {
      id: generateId(),
      name: HERO_NAMES[race][nameIndex],
      race,
      radius,
      baseRadius: radius,
      position: randomPositionInArena(arenaRadius),
      velocity: { x: 0, z: 0 },
      baseSpeed: 0.5,
      isBuffed: false,
      isAlive: true
    };
  });
}

export function calculateBonds(heroes: Hero[]): BondResult {
  const aliveHeroes = heroes.filter(h => h.isAlive);
  const raceCounts: Record<Race, number> = {
    [Race.HUMAN]: 0,
    [Race.ELF]: 0,
    [Race.ORC]: 0,
    [Race.UNDEAD]: 0
  };

  aliveHeroes.forEach(h => {
    raceCounts[h.race]++;
  });

  let buffedHeroId: string | undefined;
  const dominantRace = (Object.entries(raceCounts) as [Race, number][])
    .filter(([, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])[0];

  if (dominantRace) {
    const candidates = aliveHeroes.filter(h => h.race === dominantRace[0]);
    if (candidates.length > 0) {
      buffedHeroId = candidates[Math.floor(Math.random() * candidates.length)].id;
    }
  }

  const uniqueRaces = (Object.entries(raceCounts) as [Race, number][])
    .filter(([, count]) => count > 0).length;
  const allAgile = uniqueRaces >= 4;

  return { buffedHeroId, allAgile };
}

export function applyBondEffects(heroes: Hero[]): BondResult {
  const bonds = calculateBonds(heroes);

  heroes.forEach(hero => {
    hero.isBuffed = false;
    hero.radius = hero.baseRadius;
  });

  if (bonds.buffedHeroId) {
    const buffedHero = heroes.find(h => h.id === bonds.buffedHeroId);
    if (buffedHero) {
      buffedHero.isBuffed = true;
      buffedHero.radius = buffedHero.baseRadius * 1.2;
    }
  }

  return bonds;
}

export function getRaceEmoji(race: Race): string {
  switch (race) {
    case Race.HUMAN: return '👤';
    case Race.ELF: return '🧝';
    case Race.ORC: return '👹';
    case Race.UNDEAD: return '💀';
  }
}

export function getRaceName(race: Race): string {
  switch (race) {
    case Race.HUMAN: return '人类';
    case Race.ELF: return '精灵';
    case Race.ORC: return '兽人';
    case Race.UNDEAD: return '亡灵';
  }
}

export function getRaceColor(race: Race): number {
  switch (race) {
    case Race.HUMAN: return 0xffd700;
    case Race.ELF: return 0x4ade80;
    case Race.ORC: return 0xef4444;
    case Race.UNDEAD: return 0xa855f7;
  }
}
