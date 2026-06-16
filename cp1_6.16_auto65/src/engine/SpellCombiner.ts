import { ElementType, SpellRule, SpellResult } from './types';

const SPELL_RULES: SpellRule[] = [
  {
    elements: [ElementType.FIRE, ElementType.WIND, ElementType.LIGHT],
    spellId: 'inferno_storm',
    spellName: '烈焰风暴',
    particleCount: 150,
    particleColors: ['#FF4444', '#44FF88', '#FFFFCC'],
    minRadius: 250,
    maxRadius: 400,
  },
  {
    elements: [ElementType.WATER, ElementType.EARTH, ElementType.LIGHT],
    spellId: 'life_spring',
    spellName: '生命之泉',
    particleCount: 150,
    particleColors: ['#4488FF', '#FFAA44', '#FFFFCC'],
    minRadius: 250,
    maxRadius: 400,
  },
  {
    elements: [ElementType.FIRE, ElementType.WATER],
    spellId: 'steam_burst',
    spellName: '蒸汽爆发',
    particleCount: 100,
    particleColors: ['#FF4444', '#4488FF', '#CC88FF'],
    minRadius: 200,
    maxRadius: 300,
  },
  {
    elements: [ElementType.WIND, ElementType.EARTH],
    spellId: 'sand_vortex',
    spellName: '沙暴漩涡',
    particleCount: 100,
    particleColors: ['#44FF88', '#FFAA44', '#AADD44'],
    minRadius: 200,
    maxRadius: 300,
  },
  {
    elements: [ElementType.FIRE, ElementType.WIND],
    spellId: 'scorching_gale',
    spellName: '烈风灼烧',
    particleCount: 100,
    particleColors: ['#FF4444', '#44FF88', '#FF8844'],
    minRadius: 200,
    maxRadius: 300,
  },
  {
    elements: [ElementType.WATER, ElementType.LIGHT],
    spellId: 'holy_baptism',
    spellName: '圣光洗礼',
    particleCount: 100,
    particleColors: ['#4488FF', '#FFFFCC', '#AACCFF'],
    minRadius: 200,
    maxRadius: 300,
  },
  {
    elements: [ElementType.EARTH, ElementType.LIGHT],
    spellId: 'holy_shield',
    spellName: '圣盾庇护',
    particleCount: 100,
    particleColors: ['#FFAA44', '#FFFFCC', '#FFCC44'],
    minRadius: 200,
    maxRadius: 300,
  },
  {
    elements: [ElementType.FIRE, ElementType.WATER, ElementType.WIND, ElementType.EARTH],
    spellId: 'element_annihilation',
    spellName: '元素湮灭',
    particleCount: 200,
    particleColors: ['#FF4444', '#4488FF', '#44FF88', '#FFAA44'],
    minRadius: 300,
    maxRadius: 400,
  },
];

function arraysMatch<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, idx) => val === sortedB[idx]);
}

export function combine(elements: ElementType[]): SpellResult {
  for (const rule of SPELL_RULES) {
    if (arraysMatch(elements, rule.elements)) {
      return { matched: true, spell: rule };
    }
  }
  return { matched: false, spell: null };
}

export function getSpellRules(): SpellRule[] {
  return [...SPELL_RULES];
}
