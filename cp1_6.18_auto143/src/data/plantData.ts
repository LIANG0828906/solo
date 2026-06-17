import { v4 as uuidv4 } from 'uuid';

export type SymbiosisType = 'mutualism' | 'commensalism' | 'antagonism';

export interface PlantNode {
  id: string;
  name: string;
  scientificName: string;
  description: string;
  icon: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface SymbiosisLink {
  id: string;
  source: string;
  target: string;
  type: SymbiosisType;
  description: string;
}

export const symbiosisTypeLabel: Record<SymbiosisType, string> = {
  mutualism: '互惠互利',
  commensalism: '单方受益',
  antagonism: '拮抗抑制',
};

export const symbiosisTypeColor: Record<SymbiosisType, string> = {
  mutualism: '#4CAF50',
  commensalism: '#2196F3',
  antagonism: '#F44336',
};

export const symbiosisShortLabel: Record<SymbiosisType, string> = {
  mutualism: '互惠',
  commensalism: '单惠',
  antagonism: '拮抗',
};

export const initialPlants: PlantNode[] = [
  {
    id: 'plant-sunflower',
    name: '向日葵',
    scientificName: 'Helianthus annuus',
    description: '向日葵是一年生草本植物，具有强大的根系能够疏松土壤，花盘吸引大量授粉昆虫，为周边植物提供授粉便利。其高度可达2-3米，为低矮植物提供天然遮阴。',
    icon: '🌻',
  },
  {
    id: 'plant-basil',
    name: '罗勒',
    scientificName: 'Ocimum basilicum',
    description: '罗勒是常见的芳香草本植物，含有挥发性精油，能够有效驱除蚜虫、粉虱等害虫，常与番茄、辣椒套种以减少病虫害发生。',
    icon: '🌿',
  },
  {
    id: 'plant-cactus',
    name: '仙人掌',
    scientificName: 'Cactaceae',
    description: '仙人掌科植物，具有极强的耐旱能力。其根系浅而广，能够有效固定沙质土壤，防止水土流失。体表的刺能够反射阳光，降低周围温度。',
    icon: '🌵',
  },
  {
    id: 'plant-tomato',
    name: '番茄',
    scientificName: 'Solanum lycopersicum',
    description: '番茄是广泛种植的蔬果作物，其植株分泌的化学物质能够抑制某些线虫的活动。与罗勒、万寿菊等伴生可显著提升果实品质和产量。',
    icon: '🍅',
  },
  {
    id: 'plant-rose',
    name: '玫瑰',
    scientificName: 'Rosa rugosa',
    description: '玫瑰是蔷薇科落叶灌木，花香浓郁，花瓣可提取精油。与大蒜、洋葱间种可防止黑斑病和白粉病的发生。',
    icon: '🌹',
  },
  {
    id: 'plant-carrot',
    name: '胡萝卜',
    scientificName: 'Daucus carota',
    description: '胡萝卜是二年生草本植物，深根作物能够穿透紧实的土壤层，为浅根蔬菜疏通土壤。其叶片能吸引寄生蜂等益虫。',
    icon: '🥕',
  },
  {
    id: 'plant-bean',
    name: '菜豆',
    scientificName: 'Phaseolus vulgaris',
    description: '菜豆是豆科作物，根部共生根瘤菌能够固定空气中的氮素，增加土壤肥力，是经典的绿肥作物。适合与玉米、番茄轮作或间作。',
    icon: '🫘',
  },
  {
    id: 'plant-corn',
    name: '玉米',
    scientificName: 'Zea mays',
    description: '玉米是高大的禾本科作物，为蔓生植物如豆类提供天然支架。其根系发达，能够有效防止水土流失，与豆类、南瓜构成经典的"三姐妹"种植体系。',
    icon: '🌽',
  },
  {
    id: 'plant-mint',
    name: '薄荷',
    scientificName: 'Mentha',
    description: '薄荷是多年生芳香草本，含有薄荷醇等挥发性物质，对蚂蚁、蚜虫、菜蛾等有强烈驱避作用。其蔓延的根系有助于土壤固持。',
    icon: '🍃',
  },
  {
    id: 'plant-marigold',
    name: '万寿菊',
    scientificName: 'Tagetes erecta',
    description: '万寿菊根部会分泌噻吩类化合物，能够毒杀根结线虫等土壤害虫，是著名的伴生驱虫植物。花色鲜艳，还能吸引授粉蜜蜂。',
    icon: '🌼',
  },
];

export const initialLinks: SymbiosisLink[] = [
  {
    id: 'link-1',
    source: 'plant-sunflower',
    target: 'plant-basil',
    type: 'mutualism',
    description: '向日葵为罗勒遮阴，罗勒驱除蚜虫保护向日葵',
  },
  {
    id: 'link-2',
    source: 'plant-sunflower',
    target: 'plant-tomato',
    type: 'mutualism',
    description: '向日葵吸引蜜蜂为番茄授粉，番茄驱避向日葵螟',
  },
  {
    id: 'link-3',
    source: 'plant-basil',
    target: 'plant-tomato',
    type: 'mutualism',
    description: '罗勒驱除番茄蚜虫和粉虱，番茄为罗勒提供微气候',
  },
  {
    id: 'link-4',
    source: 'plant-basil',
    target: 'plant-rose',
    type: 'commensalism',
    description: '罗勒散发的精油驱避玫瑰黑斑病菌',
  },
  {
    id: 'link-5',
    source: 'plant-cactus',
    target: 'plant-corn',
    type: 'commensalism',
    description: '仙人掌固定沙土改善立地条件，玉米受益',
  },
  {
    id: 'link-6',
    source: 'plant-tomato',
    target: 'plant-carrot',
    type: 'mutualism',
    description: '番茄气味驱避胡萝卜蝇，胡萝卜松土利于番茄根系',
  },
  {
    id: 'link-7',
    source: 'plant-tomato',
    target: 'plant-marigold',
    type: 'mutualism',
    description: '万寿菊驱杀根结线虫保护番茄，番茄遮阴万寿菊',
  },
  {
    id: 'link-8',
    source: 'plant-rose',
    target: 'plant-marigold',
    type: 'commensalism',
    description: '万寿菊驱避玫瑰蚜虫和红蜘蛛',
  },
  {
    id: 'link-9',
    source: 'plant-carrot',
    target: 'plant-bean',
    type: 'mutualism',
    description: '菜豆固氮供胡萝卜营养，胡萝卜吸引寄生蜂消灭豆荚螟',
  },
  {
    id: 'link-10',
    source: 'plant-bean',
    target: 'plant-corn',
    type: 'mutualism',
    description: '菜豆固氮供玉米，玉米茎秆为菜豆提供攀援支架',
  },
  {
    id: 'link-11',
    source: 'plant-bean',
    target: 'plant-mint',
    type: 'antagonism',
    description: '薄荷的化感物质抑制菜豆种子发芽和幼苗生长',
  },
  {
    id: 'link-12',
    source: 'plant-corn',
    target: 'plant-sunflower',
    type: 'antagonism',
    description: '两者竞争阳光和养分，根系分泌物互有抑制',
  },
  {
    id: 'link-13',
    source: 'plant-mint',
    target: 'plant-tomato',
    type: 'mutualism',
    description: '薄荷驱避蚜虫和菜蛾，番茄为薄荷提供部分遮阴',
  },
  {
    id: 'link-14',
    source: 'plant-mint',
    target: 'plant-rose',
    type: 'mutualism',
    description: '薄荷驱避玫瑰害虫，玫瑰攀援薄荷丛获得支撑',
  },
  {
    id: 'link-15',
    source: 'plant-marigold',
    target: 'plant-bean',
    type: 'commensalism',
    description: '万寿菊驱杀豆田线虫，菜豆健康生长',
  },
  {
    id: 'link-16',
    source: 'plant-cactus',
    target: 'plant-cactus',
    type: 'mutualism',
    description: '集群种植增强防风固沙效果，共享微生境',
  },
];

let plantsStore: PlantNode[] = JSON.parse(JSON.stringify(initialPlants));
let linksStore: SymbiosisLink[] = JSON.parse(JSON.stringify(initialLinks));

export function getAllPlants(): PlantNode[] {
  return JSON.parse(JSON.stringify(plantsStore));
}

export function getAllLinks(): SymbiosisLink[] {
  return JSON.parse(JSON.stringify(linksStore));
}

export function findPlantById(id: string): PlantNode | undefined {
  return plantsStore.find((p) => p.id === id);
}

export function addPlant(plant: Omit<PlantNode, 'id'>): PlantNode {
  const newPlant: PlantNode = {
    ...plant,
    id: `plant-${uuidv4()}`,
  };
  plantsStore.push(newPlant);
  return { ...newPlant };
}

export function addLink(link: Omit<SymbiosisLink, 'id'>): SymbiosisLink {
  const newLink: SymbiosisLink = {
    ...link,
    id: `link-${uuidv4()}`,
  };
  linksStore.push(newLink);
  return { ...newLink };
}

export function resetToInitial() {
  plantsStore = JSON.parse(JSON.stringify(initialPlants));
  linksStore = JSON.parse(JSON.stringify(initialLinks));
}

export function getAdjacentNodes(plantId: string): { plant: PlantNode; link: SymbiosisLink }[] {
  const results: { plant: PlantNode; link: SymbiosisLink }[] = [];
  linksStore.forEach((link) => {
    let adjacentId: string | null = null;
    if (link.source === plantId) adjacentId = link.target;
    else if (link.target === plantId) adjacentId = link.source;
    if (adjacentId) {
      const p = findPlantById(adjacentId);
      if (p) results.push({ plant: p, link });
    }
  });
  return results;
}
