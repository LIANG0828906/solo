import type { PlantSpecies, SymbiosisRelation, SymbiosisPartnerInfo } from '@types/index';

export const PLANT_SPECIES: PlantSpecies[] = [
  {
    id: 'tomato',
    name: '番茄',
    color: '#E53935',
    growthDays: 90,
    lightNeed: '全日照',
    icon: '🍅',
  },
  {
    id: 'basil',
    name: '罗勒',
    color: '#43A047',
    growthDays: 45,
    lightNeed: '全日照',
    icon: '🌿',
  },
  {
    id: 'carrot',
    name: '胡萝卜',
    color: '#FF9800',
    growthDays: 75,
    lightNeed: '半日照',
    icon: '🥕',
  },
  {
    id: 'onion',
    name: '洋葱',
    color: '#9C27B0',
    growthDays: 110,
    lightNeed: '全日照',
    icon: '🧅',
  },
  {
    id: 'marigold',
    name: '万寿菊',
    color: '#FF6F00',
    growthDays: 60,
    lightNeed: '全日照',
    icon: '🌼',
  },
  {
    id: 'mint',
    name: '薄荷',
    color: '#00BFA5',
    growthDays: 50,
    lightNeed: '半日照',
    icon: '🍃',
  },
  {
    id: 'lettuce',
    name: '生菜',
    color: '#7CB342',
    growthDays: 40,
    lightNeed: '半日照',
    icon: '🥬',
  },
  {
    id: 'cucumber',
    name: '黄瓜',
    color: '#2E7D32',
    growthDays: 65,
    lightNeed: '全日照',
    icon: '🥒',
  },
];

export const SYMBIOSIS_RELATIONS: SymbiosisRelation[] = [
  { speciesA: 'tomato', speciesB: 'basil', type: 'beneficial', reason: '罗勒驱虫并提升番茄风味' },
  { speciesA: 'tomato', speciesB: 'marigold', type: 'beneficial', reason: '万寿菊驱避线虫和蚜虫' },
  { speciesA: 'tomato', speciesB: 'carrot', type: 'beneficial', reason: '胡萝卜根系疏松土壤利于番茄扎根' },
  { speciesA: 'tomato', speciesB: 'cucumber', type: 'harmful', reason: '争夺养分且易共同感染病害' },
  { speciesA: 'tomato', speciesB: 'mint', type: 'neutral', reason: '互不影响生长' },

  { speciesA: 'basil', speciesB: 'tomato', type: 'beneficial', reason: '番茄遮阴保护罗勒避免暴晒' },
  { speciesA: 'basil', speciesB: 'lettuce', type: 'beneficial', reason: '罗勒气味驱避生菜害虫' },
  { speciesA: 'basil', speciesB: 'cucumber', type: 'beneficial', reason: '罗勒改善黄瓜风味' },
  { speciesA: 'basil', speciesB: 'onion', type: 'harmful', reason: '气味相克且生长习性冲突' },

  { speciesA: 'carrot', speciesB: 'onion', type: 'beneficial', reason: '洋葱驱胡萝卜蝇，胡萝卜驱洋葱蝇' },
  { speciesA: 'carrot', speciesB: 'tomato', type: 'beneficial', reason: '根系互补，不争夺同层养分' },
  { speciesA: 'carrot', speciesB: 'lettuce', type: 'beneficial', reason: '生菜为胡萝卜遮阴保湿' },
  { speciesA: 'carrot', speciesB: 'mint', type: 'neutral', reason: '生态位不同，无显著影响' },

  { speciesA: 'onion', speciesB: 'carrot', type: 'beneficial', reason: '互相驱避各自的主要害虫' },
  { speciesA: 'onion', speciesB: 'marigold', type: 'beneficial', reason: '万寿菊增强洋葱抗病性' },
  { speciesA: 'onion', speciesB: 'basil', type: 'harmful', reason: '抑制彼此生长' },
  { speciesA: 'onion', speciesB: 'lettuce', type: 'beneficial', reason: '洋葱气味驱避蚜虫' },

  { speciesA: 'marigold', speciesB: 'tomato', type: 'beneficial', reason: '分泌物质驱杀土壤线虫' },
  { speciesA: 'marigold', speciesB: 'cucumber', type: 'beneficial', reason: '驱避黄瓜甲虫' },
  { speciesA: 'marigold', speciesB: 'mint', type: 'neutral', reason: '无明显相互作用' },
  { speciesA: 'marigold', speciesB: 'lettuce', type: 'beneficial', reason: '吸引授粉昆虫同时驱害虫' },

  { speciesA: 'mint', speciesB: 'cucumber', type: 'beneficial', reason: '薄荷气味驱避瓜类害虫' },
  { speciesA: 'mint', speciesB: 'tomato', type: 'neutral', reason: '无明显促进或抑制作用' },
  { speciesA: 'mint', speciesB: 'carrot', type: 'neutral', reason: '生长习性差异大，互不干扰' },

  { speciesA: 'lettuce', speciesB: 'carrot', type: 'beneficial', reason: '地表覆盖保湿降温' },
  { speciesA: 'lettuce', speciesB: 'onion', type: 'beneficial', reason: '洋葱保护生菜免受害虫' },
  { speciesA: 'lettuce', speciesB: 'cucumber', type: 'beneficial', reason: '黄瓜藤为生菜提供部分遮阴' },
  { speciesA: 'lettuce', speciesB: 'basil', type: 'beneficial', reason: '罗勒增强生菜抗虫性' },

  { speciesA: 'cucumber', speciesB: 'basil', type: 'beneficial', reason: '罗勒提升黄瓜品质和产量' },
  { speciesA: 'cucumber', speciesB: 'marigold', type: 'beneficial', reason: '减少甲虫侵害' },
  { speciesA: 'cucumber', speciesB: 'mint', type: 'beneficial', reason: '薄荷驱虫效果显著' },
  { speciesA: 'cucumber', speciesB: 'tomato', type: 'harmful', reason: '共同感染枯萎病风险高' },
  { speciesA: 'cucumber', speciesB: 'lettuce', type: 'beneficial', reason: '生态互补' },
];

export function getSpeciesById(id: string): PlantSpecies | undefined {
  return PLANT_SPECIES.find((s) => s.id === id);
}

export function getSymbiosisPartners(speciesId: string): SymbiosisPartnerInfo[] {
  const partners: SymbiosisPartnerInfo[] = [];
  SYMBIOSIS_RELATIONS.forEach((rel) => {
    if (rel.speciesA === speciesId) {
      partners.push({ speciesId: rel.speciesB, type: rel.type, reason: rel.reason });
    } else if (rel.speciesB === speciesId && !partners.find((p) => p.speciesId === rel.speciesA)) {
      partners.push({ speciesId: rel.speciesA, type: rel.type, reason: rel.reason });
    }
  });
  return partners;
}

export function getSymbiosisRelation(
  speciesA: string,
  speciesB: string,
): SymbiosisRelation | undefined {
  return SYMBIOSIS_RELATIONS.find(
    (rel) =>
      (rel.speciesA === speciesA && rel.speciesB === speciesB) ||
      (rel.speciesA === speciesB && rel.speciesB === speciesA),
  );
}
