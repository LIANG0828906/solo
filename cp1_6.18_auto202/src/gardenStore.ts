import { create } from 'zustand';
import type { Seed, GrowthState, GrowthStage } from './types/seed';

const MOCK_SEEDS: Seed[] = [
  {
    id: 'seed-001',
    name: '晨露微光',
    author: '林溪',
    description: '清晨第一缕阳光穿透薄雾，落在沾满露珠的花瓣上，折射出七彩光芒。这是我对宁静早晨的致敬，每一笔都试图捕捉那份稍纵即逝的温柔。',
    createdAt: '2026-03-15',
    seedColor: '#D4A373',
    seedColorEnd: '#E6C8A6',
    petalColor: '#FFB6C1',
    petalColorEnd: '#FFC0CB',
  },
  {
    id: 'seed-002',
    name: '深海幽蓝',
    author: '陈墨白',
    description: '潜入深海三千米，那里没有阳光，却有生命自己发光。这幅作品用深蓝色调演绎了海底世界的神秘与浪漫，每一朵花都是一个微型宇宙。',
    createdAt: '2026-02-28',
    seedColor: '#4A6FA5',
    seedColorEnd: '#6B8CAE',
    petalColor: '#1E3A5F',
    petalColorEnd: '#3D5A80',
  },
  {
    id: 'seed-003',
    name: '秋日私语',
    author: '苏晚晴',
    description: '金黄的银杏叶铺满小径，风一吹，便下起金色的雨。我想留住这个秋天，让温暖的橘黄和深红永远绽放在记忆的花园里。',
    createdAt: '2026-01-20',
    seedColor: '#C17F59',
    seedColorEnd: '#D4A574',
    petalColor: '#E07A5F',
    petalColorEnd: '#F2CC8F',
  },
  {
    id: 'seed-004',
    name: '星河织梦',
    author: '顾星河',
    description: '把银河种进土壤，等它开出满天繁星。每一朵花里都藏着一个星座，闭上眼睛，就能听见星星们的低语和古老的故事。',
    createdAt: '2026-04-05',
    seedColor: '#5C4D7C',
    seedColorEnd: '#7D6BA0',
    petalColor: '#9B7EDB',
    petalColorEnd: '#B8A9E8',
  },
  {
    id: 'seed-005',
    name: '空山新雨',
    author: '王清砚',
    description: '雨后的山林青翠欲滴，空气里弥漫着泥土和青草的气息。用最淡雅的墨色，绘出那份空灵和澄澈，让心灵得以栖息。',
    createdAt: '2026-03-02',
    seedColor: '#6B8E6B',
    seedColorEnd: '#8FBC8F',
    petalColor: '#7FB069',
    petalColorEnd: '#A8D5BA',
  },
  {
    id: 'seed-006',
    name: '樱雪纷飞',
    author: '夏目未央',
    description: '樱花飘落的速度是秒速五厘米，那要怎样的速度，才能走完我与你之间的距离？粉色的花瓣如雪般纷纷扬扬，落在时光的河面上。',
    createdAt: '2026-04-10',
    seedColor: '#E8A0B4',
    seedColorEnd: '#F4C2C2',
    petalColor: '#FFB7C5',
    petalColorEnd: '#FFD1DC',
  },
  {
    id: 'seed-007',
    name: '骄阳似火',
    author: '烈焰',
    description: '盛夏的正午，太阳毫不吝啬地挥洒光芒。火红的花朵燃烧着生命的热情，它们在阳光下绽放，向世界宣告青春的力量。',
    createdAt: '2026-02-14',
    seedColor: '#C0392B',
    seedColorEnd: '#E74C3C',
    petalColor: '#FF6347',
    petalColorEnd: '#FF7F50',
  },
  {
    id: 'seed-008',
    name: '月下独酌',
    author: '李墨白',
    description: '举杯邀明月，对影成三人。银白色的花瓣在月光下闪烁，每一片都承载着诗人的愁思和豪情。孤独但不寂寞，有花有月有清风。',
    createdAt: '2026-01-08',
    seedColor: '#8C9BAB',
    seedColorEnd: '#B0BEC5',
    petalColor: '#CFD8DC',
    petalColorEnd: '#ECEFF1',
  },
  {
    id: 'seed-009',
    name: '烟雨江南',
    author: '周画屏',
    description: '青砖黛瓦，小桥流水，烟雨朦胧中的江南水乡。淡青色的花瓣晕染出水墨画的意境，每一朵花都是一首婉约的宋词。',
    createdAt: '2026-03-22',
    seedColor: '#7D9B9B',
    seedColorEnd: '#A3C1C1',
    petalColor: '#8DB6B6',
    petalColorEnd: '#B8D4D4',
  },
  {
    id: 'seed-010',
    name: '薰衣草田',
    author: '普罗旺斯',
    description: '一望无际的紫色花田在微风中起伏，空气里弥漫着淡淡的芬芳。蜜蜂和蝴蝶穿梭其间，这是属于夏天的浪漫和宁静。',
    createdAt: '2026-04-18',
    seedColor: '#7B68EE',
    seedColorEnd: '#9370DB',
    petalColor: '#B19CD9',
    petalColorEnd: '#D8BFD8',
  },
];

interface GardenStoreState {
  seeds: Seed[];
  growth: GrowthState;
  selectSeed: (id: string) => void;
  clearSelection: () => void;
  updateGrowth: (patch: Partial<GrowthState>) => void;
  resetGrowth: () => void;
  setStage: (stage: GrowthStage) => void;
  setCanvasPosition: (x: number, y: number) => void;
}

const initialGrowthState: GrowthState = {
  selectedSeedId: null,
  stage: 'idle',
  stageProgress: 0,
  globalProgress: 0,
  startTime: null,
  canvasPosition: null,
};

export const useGardenStore = create<GardenStoreState>((set) => ({
  seeds: MOCK_SEEDS,
  growth: initialGrowthState,

  selectSeed: (id: string) =>
    set((state) => ({
      growth: {
        ...state.growth,
        selectedSeedId: id,
        stage: 'sprouting',
        stageProgress: 0,
        globalProgress: 0,
        startTime: performance.now(),
      },
    })),

  clearSelection: () =>
    set(() => ({
      growth: initialGrowthState,
    })),

  updateGrowth: (patch) =>
    set((state) => ({
      growth: { ...state.growth, ...patch },
    })),

  resetGrowth: () =>
    set(() => ({
      growth: initialGrowthState,
    })),

  setStage: (stage) =>
    set((state) => ({
      growth: { ...state.growth, stage, stageProgress: 0 },
    })),

  setCanvasPosition: (x, y) =>
    set((state) => ({
      growth: { ...state.growth, canvasPosition: { x, y } },
    })),
}));
