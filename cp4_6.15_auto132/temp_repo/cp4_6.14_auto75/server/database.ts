import { v4 as uuidv4 } from 'uuid';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface ItemAttribute {
  name: string;
  value: number;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  attributes: ItemAttribute[];
}

export interface RankingEntry {
  id: string;
  playerName: string;
  score: number;
  accuracy: number;
  duration: number;
  timestamp: number;
}

const rarityWeights: Record<Rarity, number> = {
  common: 0.5,
  rare: 0.3,
  epic: 0.15,
  legendary: 0.05,
};

const rarityLabelMap: Record<Rarity, string> = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
};

export const rarityLabel = (r: Rarity): string => rarityLabelMap[r];
export const rarityLevel = (r: Rarity): number =>
  r === 'common' ? 0 : r === 'rare' ? 1 : r === 'epic' ? 2 : 3;

const attributePool = [
  '锋利度',
  '魔力值',
  '防御力',
  '敏捷度',
  '生命值',
  '暴击率',
  '闪避率',
  '吸血率',
  '穿透值',
  '耐久度',
  '幸运值',
  '精神力',
  '火焰抗性',
  '冰霜抗性',
  '雷电抗性',
  '暗影抗性',
  '治疗效果',
  '金币加成',
  '经验加成',
  '采集速度',
];

const rarityRanges: Record<Rarity, { min: number; max: number }> = {
  common: { min: 1, max: 25 },
  rare: { min: 20, max: 55 },
  epic: { min: 45, max: 80 },
  legendary: { min: 70, max: 100 },
};

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateAttributes(rarity: Rarity): ItemAttribute[] {
  const { min, max } = rarityRanges[rarity];
  const shuffled = [...attributePool].sort(() => Math.random() - 0.5);
  const count = 3;
  const attrs: ItemAttribute[] = [];
  for (let i = 0; i < count; i++) {
    attrs.push({
      name: shuffled[i],
      value: rand(min, max),
    });
  }
  return attrs;
}

const commonNames = [
  '生锈短剑', '木质盾牌', '布衣', '面包', '皮靴', '麻绳', '铁镐', '陶碗', '蜡烛', '旧地图',
  '普通矿石', '草药', '棉布', '水袋', '铁钉', '木杖', '皮手套', '火柴', '线轴', '磨刀石',
  '盐袋', '面粉', '小锤子', '木桶', '羽毛笔', '羊皮纸', '油灯', '皮革护腕', '钥匙', '口袋',
];

const rareNames = [
  '精钢长剑', '橡木长盾', '链甲', '高级药水', '旅行靴', '银护符', '魔法卷轴', '宝石戒指',
  '强化弓弩', '附魔手套', '治愈之草', '秘银矿石', '丝绸长袍', '水晶瓶', '工匠锤', '指南针',
  '暗夜斗篷', '驯兽鞭', '符文石块', '骑士头盔',
];

const epicNames = [
  '烈焰之刃', '巨龙鳞甲', '幻影披风', '时空法杖', '圣光护符', '暴风之靴', '噬魂之弓',
  '贤者之石', '海神三叉戟', '命运之轮', '不朽戒指', '雷霆战锤', '暗夜之牙', '凤凰羽毛',
  '深渊护心镜', '星辰罗盘', '生命之树种子', '寒冰皇冠', '精灵圣甲', '沙漠之眼',
];

const legendaryNames = [
  '开天辟地剑', '永恒之枪·冈格尼尔', '诸神黄昏之盾', '创世法杖', '太阳神护符',
  '虚空行者之靴', '灭世龙弓', '贤者传承之书', '海神王冠', '命运三女神之眼',
  '奥林匹斯之戒', '盘古开天斧', '女娲补天石', '如来掌中莲', '太上老君丹炉',
  '齐天大圣金箍棒', '轩辕黄帝之剑', '埃及法老权杖', '亚瑟王圣剑', '圣光圣杯',
];

function buildItemList(): Item[] {
  const list: Item[] = [];
  commonNames.forEach((n) => {
    list.push({
      id: uuidv4(),
      name: n,
      description: '常见的日常物品，做工一般，随处可见。',
      rarity: 'common',
      attributes: generateAttributes('common'),
    });
  });
  rareNames.forEach((n) => {
    list.push({
      id: uuidv4(),
      name: n,
      description: '工匠精心打造，蕴含一定力量的稀有物品。',
      rarity: 'rare',
      attributes: generateAttributes('rare'),
    });
  });
  epicNames.forEach((n) => {
    list.push({
      id: uuidv4(),
      name: n,
      description: '充满传奇故事的史诗物品，力量令人敬畏。',
      rarity: 'epic',
      attributes: generateAttributes('epic'),
    });
  });
  legendaryNames.forEach((n) => {
    list.push({
      id: uuidv4(),
      name: n,
      description: '来自神话时代的传说物品，拥有改变世界的力量。',
      rarity: 'legendary',
      attributes: generateAttributes('legendary'),
    });
  });
  return list;
}

const itemDatabase: Item[] = buildItemList();
const rankings: RankingEntry[] = [];

function pickWeightedRarity(): Rarity {
  const r = Math.random();
  let acc = 0;
  for (const [key, w] of Object.entries(rarityWeights)) {
    acc += w;
    if (r <= acc) return key as Rarity;
  }
  return 'common';
}

export function getItemCount(): number {
  return itemDatabase.length;
}

export function getRandomItem(): Item {
  const rarity = pickWeightedRarity();
  const pool = itemDatabase.filter((it) => it.rarity === rarity);
  const chosen = pickRandom(pool);
  return {
    ...chosen,
    id: uuidv4(),
    attributes: generateAttributes(chosen.rarity),
  };
}

export function submitScore(
  playerName: string,
  score: number,
  accuracy: number,
  duration: number,
): { success: boolean; rank: number } {
  const entry: RankingEntry = {
    id: uuidv4(),
    playerName,
    score,
    accuracy,
    duration,
    timestamp: Date.now(),
  };
  rankings.push(entry);
  rankings.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
    return a.duration - b.duration;
  });
  const rank = rankings.findIndex((e) => e.id === entry.id) + 1;
  return { success: true, rank };
}

export interface RankingView {
  rank: number;
  playerName: string;
  score: number;
  accuracy: number;
  duration: number;
}

export function getRankings(limit = 100): RankingView[] {
  return rankings.slice(0, limit).map((e, idx) => ({
    rank: idx + 1,
    playerName: e.playerName,
    score: e.score,
    accuracy: e.accuracy,
    duration: e.duration,
  }));
}

function seedInitialRankings(): void {
  const sampleNames = [
    '鉴定大师888', '寻宝猎人007', '传说收藏家', '稀有物品王', '史诗鉴定师',
    '新手小菜鸟', '古董鉴赏家', '宝石猎人999', '神话追寻者', '武器大师',
  ];
  for (let i = 0; i < 15; i++) {
    submitScore(
      `${sampleNames[i % sampleNames.length]}${rand(10, 999)}`,
      rand(400, 1480),
      Math.round((rand(40, 100) * 10)) / 10,
      rand(35, 95),
    );
  }
}

seedInitialRankings();
