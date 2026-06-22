import type { Narrative, LightJadeType } from '@/types';
import { NARRATIVE_DATA } from '@/types';

export const NARRATIVES: Narrative[] = NARRATIVE_DATA.map(narrative => ({
  ...narrative,
  unlocked: false
}));

export const getNarrativeById = (id: string): Narrative | undefined => {
  return NARRATIVES.find(n => n.id === id);
};

export const getNarrativeByChapter = (chapter: number): Narrative | undefined => {
  return NARRATIVES.find(n => n.chapter === chapter);
};

export const getNarrativeByMoonPhase = (phase: LightJadeType): Narrative | undefined => {
  return NARRATIVES.find(n => n.moonPhase === phase);
};

export const getUnlockedNarratives = (): Narrative[] => {
  return NARRATIVES.filter(n => n.unlocked);
};

export const getLockedNarratives = (): Narrative[] => {
  return NARRATIVES.filter(n => !n.unlocked);
};

export const getProgressPercentage = (): number => {
  const unlocked = getUnlockedNarratives().length;
  return Math.round((unlocked / NARRATIVES.length) * 100);
};

export const unlockNarrative = (id: string): Narrative | null => {
  const narrative = NARRATIVES.find(n => n.id === id);
  if (narrative) {
    narrative.unlocked = true;
    return narrative;
  }
  return null;
};

export const unlockNarrativeByPhase = (phase: LightJadeType): Narrative | null => {
  const narrative = getNarrativeByMoonPhase(phase);
  if (narrative) {
    narrative.unlocked = true;
    return narrative;
  }
  return null;
};

export const resetNarratives = (): void => {
  NARRATIVES.forEach(n => {
    n.unlocked = false;
  });
};

export const getNextUnlockable = (): Narrative | null => {
  const sorted = [...NARRATIVES].sort((a, b) => a.chapter - b.chapter);
  return sorted.find(n => !n.unlocked) || null;
};

export const formatNarrativeContent = (content: string, maxLength: number = 150): string => {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength) + '...';
};

export const MOON_PHASE_DESCRIPTIONS: Record<LightJadeType, string> = {
  newMoon: '新月，月亮完全被地球阴影遮蔽，象征着新的开始与无限可能。',
  crescent: '娥眉月，月牙初现，如同破晓前的第一缕曙光，温柔而充满希望。',
  firstQuarter: '上弦月，半圆之形，阴阳平衡，代表着秩序与理性的力量。',
  gibbous: '盈凸月，月亮渐满，能量积蓄，预示着变革与转折的来临。',
  fullMoon: '满月，月华圆满，光明普照，象征着完整、重生与永恒的和谐。'
};

export const getMoonPhaseDescription = (phase: LightJadeType): string => {
  return MOON_PHASE_DESCRIPTIONS[phase];
};

export const narrativesData: Omit<Narrative, 'unlocked'>[] = [
  {
    id: 'narrative-1',
    chapter: 1,
    title: '第一章：新月之誓',
    content: '公元前两万年，月球文明在寂静的真空中诞生。他们称自己为"曦月族"，拥有操控月相能量的古老智慧。第一代时间祭司在新月之夜立下誓言：要让时间的齿轮永远转动，让光明永不熄灭。他们建造了这座巨大的月相计时器，作为守护时间秩序的象征。',
    moonPhase: 'newMoon',
    unlockCondition: '收集新月光玉并嵌入西方齿轮'
  },
  {
    id: 'narrative-2',
    chapter: 2,
    title: '第二章：娥眉之光',
    content: '曦月族发现了光玉的秘密——这些蕴含月相能量的晶体，能够驱动时间之轮。娥眉光玉是他们最早掌握的能量来源，它温柔的光芒照亮了月球地下的城市。工匠们用它来点亮街道，医者用它来治愈疾病，学者用它来记录历史。光玉成为了曦月族文明的基石。',
    moonPhase: 'crescent',
    unlockCondition: '收集娥眉光玉并嵌入南方齿轮'
  },
  {
    id: 'narrative-3',
    chapter: 3,
    title: '第三章：上弦之律',
    content: '随着文明的繁荣，曦月族开始探索时间的本质。上弦光玉的发现让他们能够操控时间的流速。他们建造了更精密的齿轮系统，将五种月相的能量编织在一起。然而，对时间力量的过度追求也埋下了隐患。一些学者开始研究禁忌的时间逆转之术，试图改变过去。',
    moonPhase: 'firstQuarter',
    unlockCondition: '收集上弦光玉并嵌入北方齿轮'
  },
  {
    id: 'narrative-4',
    chapter: 4,
    title: '第四章：盈凸之兆',
    content: '灾难在一个盈凸月之夜降临。失控的时间实验撕裂了时空裂缝，计时器的齿轮开始倒转。曦月族的城市一座接一座地陷入时间停滞，居民们在一瞬间化为永恒的雕像。最后的时间祭司们倾尽全力，将五颗光玉散落在月球各处，希望有一天能有人重新启动计时器，修复破碎的时间。',
    moonPhase: 'gibbous',
    unlockCondition: '收集盈凸光玉并嵌入东方齿轮'
  },
  {
    id: 'narrative-5',
    chapter: 5,
    title: '第五章：满月重生',
    content: '当最后一颗满月光玉嵌入中央齿轮，时间的秩序终于恢复。停滞了两万年的月球重新转动，曦月族的子民从沉睡中苏醒。他们看到了来自地球的你——一位勇敢的时间管理员，跨越星海来修复这座古老的计时器。满月的光芒照亮了整个月球，两个文明的故事，从此刻开始交织。',
    moonPhase: 'fullMoon',
    unlockCondition: '收集满月光玉并嵌入中央齿轮，完成所有齿轮校准'
  }
];

export { NARRATIVE_DATA };
