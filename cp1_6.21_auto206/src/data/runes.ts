export interface Rune {
  id: string
  name: string
  color: string
  glowColor: string
  symbol: string
}

export interface Recipe {
  id: string
  name: string
  runes: [string, string, string]
  type: 'attack' | 'defense' | 'heal'
  value?: number
  description: string
}

export const RUNES: Rune[] = [
  {
    id: 'fire',
    name: '火焰符石',
    color: '#EF4444',
    glowColor: '#FCA5A5',
    symbol: '🔥'
  },
  {
    id: 'water',
    name: '流水符石',
    color: '#3B82F6',
    glowColor: '#93C5FD',
    symbol: '💧'
  },
  {
    id: 'wind',
    name: '疾风符石',
    color: '#22D3EE',
    glowColor: '#A5F3FC',
    symbol: '💨'
  },
  {
    id: 'earth',
    name: '大地符石',
    color: '#A16207',
    glowColor: '#FCD34D',
    symbol: '🪨'
  },
  {
    id: 'light',
    name: '光明符石',
    color: '#FBBF24',
    glowColor: '#FEF08A',
    symbol: '✨'
  },
  {
    id: 'dark',
    name: '暗影符石',
    color: '#6B21A8',
    glowColor: '#C084FC',
    symbol: '🌑'
  },
  {
    id: 'thunder',
    name: '雷电符石',
    color: '#EAB308',
    glowColor: '#FEF08A',
    symbol: '⚡'
  },
  {
    id: 'ice',
    name: '寒冰符石',
    color: '#06B6D4',
    glowColor: '#A5F3FC',
    symbol: '❄️'
  },
  {
    id: 'wood',
    name: '草木符石',
    color: '#22C55E',
    glowColor: '#86EFAC',
    symbol: '🌿'
  },
  {
    id: 'metal',
    name: '金属符石',
    color: '#71717A',
    glowColor: '#D4D4D8',
    symbol: '⚙️'
  },
  {
    id: 'poison',
    name: '剧毒符石',
    color: '#65A30D',
    glowColor: '#BEF264',
    symbol: '☠️'
  },
  {
    id: 'illusion',
    name: '幻象符石',
    color: '#D946EF',
    glowColor: '#F5D0FE',
    symbol: '🌀'
  },
  {
    id: 'time',
    name: '时间符石',
    color: '#F97316',
    glowColor: '#FDBA74',
    symbol: '⏳'
  },
  {
    id: 'space',
    name: '空间符石',
    color: '#8B5CF6',
    glowColor: '#DDD6FE',
    symbol: '🌌'
  },
  {
    id: 'spirit',
    name: '精神符石',
    color: '#EC4899',
    glowColor: '#F9A8D4',
    symbol: '💫'
  }
]

export const RECIPES: Recipe[] = [
  {
    id: 'blazing-strike',
    name: '烈焰冲击',
    runes: ['fire', 'fire', 'thunder'],
    type: 'attack',
    value: 3,
    description: '造成3点伤害'
  },
  {
    id: 'frost-shield',
    name: '冰霜护盾',
    runes: ['water', 'ice', 'water'],
    type: 'defense',
    description: '获得防御护盾'
  },
  {
    id: 'life-blessing',
    name: '生命祝福',
    runes: ['light', 'wood', 'spirit'],
    type: 'heal',
    value: 2,
    description: '恢复2点生命'
  },
  {
    id: 'thunder-storm',
    name: '雷霆万钧',
    runes: ['thunder', 'wind', 'thunder'],
    type: 'attack',
    value: 3,
    description: '造成3点伤害'
  },
  {
    id: 'iron-fortress',
    name: '钢铁堡垒',
    runes: ['earth', 'metal', 'earth'],
    type: 'defense',
    description: '获得防御护盾'
  },
  {
    id: 'shadow-corrosion',
    name: '暗影侵蚀',
    runes: ['dark', 'poison', 'illusion'],
    type: 'attack',
    value: 2,
    description: '造成2点伤害'
  },
  {
    id: 'purifying-spring',
    name: '净化之泉',
    runes: ['light', 'water', 'wind'],
    type: 'heal',
    value: 2,
    description: '恢复2点生命'
  },
  {
    id: 'fire-storm',
    name: '火焰风暴',
    runes: ['fire', 'wind', 'fire'],
    type: 'attack',
    value: 2,
    description: '造成2点伤害'
  }
]
