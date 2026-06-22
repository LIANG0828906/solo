export type LightJadeType = 'newMoon' | 'crescent' | 'firstQuarter' | 'gibbous' | 'fullMoon';

export interface LightJade {
  id: string;
  type: LightJadeType;
  name: string;
  color: string;
  collected: boolean;
  embedded: boolean;
  position?: { x: number; y: number; z: number };
}

export interface Gear {
  id: string | number;
  name: string;
  position: { x: number; y: number; z: number } | [number, number, number];
  teeth: number;
  radius?: number;
  rotation: number;
  targetRotation: number;
  currentAngle?: number;
  targetAngle?: number;
  rotationSpeed?: number;
  isActive?: boolean;
  jadeSlot?: LightJadeType | null;
  embeddedJade?: LightJade | null;
  hasJade: boolean;
  jadeType: LightJadeType | null;
  isCorrect: boolean;
}

export interface Narrative {
  id: string | number;
  chapter?: number;
  title: string;
  content: string;
  moonPhase: LightJadeType | number;
  unlocked: boolean;
  unlockCondition?: string;
}

export interface GameState {
  lightJades: LightJade[];
  collectedCount: Record<LightJadeType, number>;
  gears: Gear[];
  currentGearIndex: number;
  isSpinning: boolean;
  speedMultiplier: number;
  narratives: Narrative[];
  currentPhase: number;
  selectedJade: LightJadeType | null;
  showParticles: boolean;
  particlePosition: [number, number, number] | null;
  collectJade: (type: LightJadeType) => void;
  embedJade: (gearId: number, jadeType: LightJadeType) => void;
  rotateGear: (gearId: number, direction: 1 | -1) => void;
  checkAlignment: () => boolean;
  unlockNarrative: () => void;
  resetGears: () => void;
  setSpeed: (multiplier: number) => void;
  triggerParticles: (position: [number, number, number]) => void;
  setSelectedJade: (type: LightJadeType | null) => void;
}

export const LIGHT_JADE_CONFIG: Record<LightJadeType, { name: string; color: string }> = {
  newMoon: {
    name: '新月光玉',
    color: '#ffd700'
  },
  crescent: {
    name: '娥眉光玉',
    color: '#ffd700'
  },
  firstQuarter: {
    name: '上弦光玉',
    color: '#ffd700'
  },
  gibbous: {
    name: '盈凸光玉',
    color: '#ffd700'
  },
  fullMoon: {
    name: '满月光玉',
    color: '#ffd700'
  }
};

export const COLOR_THEME = {
  moonGray: '#dcdcdc',
  deepSpaceBlue: '#1a1f3a',
  jadeGold: '#ffd700',
  particleSilver: '#c0c0c0'
} as const;

export const INITIAL_GEARS: Omit<Gear, 'embeddedJade'>[] = [
  {
    id: 'gear-1',
    name: '中央齿轮',
    position: { x: 0, y: 0, z: 0 },
    teeth: 48,
    radius: 2.4,
    currentAngle: 0,
    targetAngle: 0,
    rotationSpeed: 0.5,
    isActive: false,
    jadeSlot: 'fullMoon'
  },
  {
    id: 'gear-2',
    name: '北方齿轮',
    position: { x: 0, y: 3.5, z: 0 },
    teeth: 24,
    radius: 1.2,
    currentAngle: 45,
    targetAngle: 90,
    rotationSpeed: 1,
    isActive: false,
    jadeSlot: 'firstQuarter'
  },
  {
    id: 'gear-3',
    name: '东方齿轮',
    position: { x: 3.5, y: 0, z: 0 },
    teeth: 32,
    radius: 1.6,
    currentAngle: 120,
    targetAngle: 180,
    rotationSpeed: 0.75,
    isActive: false,
    jadeSlot: 'gibbous'
  },
  {
    id: 'gear-4',
    name: '南方齿轮',
    position: { x: 0, y: -3.5, z: 0 },
    teeth: 16,
    radius: 0.8,
    currentAngle: 200,
    targetAngle: 270,
    rotationSpeed: 1.5,
    isActive: false,
    jadeSlot: 'crescent'
  },
  {
    id: 'gear-5',
    name: '西方齿轮',
    position: { x: -3.5, y: 0, z: 0 },
    teeth: 20,
    radius: 1.0,
    currentAngle: 300,
    targetAngle: 0,
    rotationSpeed: 1.2,
    isActive: false,
    jadeSlot: 'newMoon'
  }
];

export const NARRATIVE_DATA: Omit<Narrative, 'unlocked'>[] = [
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
