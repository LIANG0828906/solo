import type { Gear, LightJadeType, Narrative } from '@/types';

export const initialGears: Gear[] = [
  { id: 'gear-1', name: '新月轮', position: { x: 0, y: 2, z: 0 }, rotation: 0, targetRotation: 0, teeth: 24, hasJade: false, jadeType: null, isCorrect: false },
  { id: 'gear-2', name: '弦月轮', position: { x: -2.5, y: 0.5, z: 0 }, rotation: 0, targetRotation: 90, teeth: 36, hasJade: false, jadeType: null, isCorrect: false },
  { id: 'gear-3', name: '上弦轮', position: { x: 2.5, y: 0.5, z: 0 }, rotation: 0, targetRotation: 180, teeth: 36, hasJade: false, jadeType: null, isCorrect: false },
  { id: 'gear-4', name: '盈凸轮', position: { x: -1.5, y: -2, z: 0 }, rotation: 0, targetRotation: 270, teeth: 48, hasJade: false, jadeType: null, isCorrect: false },
  { id: 'gear-5', name: '满月轮', position: { x: 1.5, y: -2, z: 0 }, rotation: 0, targetRotation: 0, teeth: 48, hasJade: false, jadeType: null, isCorrect: false },
];

export const lightJadeConfig: Record<LightJadeType, { name: string; color: string }> = {
  newMoon: { name: '朔月光玉', color: '#4a4a6a' },
  crescent: { name: '蛾眉光玉', color: '#c9b037' },
  firstQuarter: { name: '上弦光玉', color: '#d4af37' },
  gibbous: { name: '盈凸光玉', color: '#e6c200' },
  fullMoon: { name: '满月光玉', color: '#ffd700' },
};

export const narrativesData: Omit<Narrative, 'unlocked'>[] = [
  {
    id: 'narrative-1',
    title: '第一章：月面来客',
    content: '公元2147年，人类在月球南极艾特肯盆地发现了非自然结构。那是一座被陨石半埋的古老装置，表面刻着与月相周期完全吻合的符文...',
    moonPhase: 'newMoon',
  },
  {
    id: 'narrative-2',
    title: '第二章：时间的守护者',
    content: '「月相计时器」——这是古代月球文明留下的遗产。他们并非来自地球，而是在月球诞生之初便在此定居，守护着太阳系的时间节律...',
    moonPhase: 'crescent',
  },
  {
    id: 'narrative-3',
    title: '第三章：光玉的秘密',
    content: '光玉并非普通矿石，而是月球文明将时间凝聚成的晶体。每一颗都承载着一段历史，当五颗光玉齐聚，时间之门便会开启...',
    moonPhase: 'firstQuarter',
  },
  {
    id: 'narrative-4',
    title: '第四章：蚀月之劫',
    content: '三万年前，一场陨石雨摧毁了月球文明。他们在最后一刻启动了计时器的保护机制，将文明的记忆封存在叙事之中，等待着继承者...',
    moonPhase: 'gibbous',
  },
  {
    id: 'narrative-5',
    title: '第五章：编年史',
    content: '当月相完整循环，蚀月编年史的最后一页被翻开。你，成为了新的时间管理员。月球文明并未消亡，它在时间的长河中等待着与你相遇...',
    moonPhase: 'fullMoon',
  },
];
