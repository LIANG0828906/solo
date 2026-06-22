import type { EventEffect } from './team';

export type EventType = 'battle' | 'weather' | 'road';

export interface EventOption {
  id: string;
  text: string;
  effect: EventEffect;
}

export interface GameEvent {
  id: string;
  type: EventType;
  title: string;
  description: string;
  options: EventOption[];
}

const BATTLE_EVENTS: GameEvent[] = [
  {
    id: 'battle-1',
    type: 'battle',
    title: '山贼拦路',
    description: '一群手持刀棍的山贼从树林中窜出，挡住了去路！为首的山贼头目一脸凶悍。',
    options: [
      { id: 'fight', text: '拔刀迎战', effect: { triggerBattle: true } },
      { id: 'negotiate', text: '破财消灾', effect: { cargo: -15, morale: -5, time: 5 } },
      { id: 'retreat', text: '绕道而行', effect: { stamina: -10, time: 30, morale: -8 } }
    ]
  },
  {
    id: 'battle-2',
    type: 'battle',
    title: '黑店劫匪',
    description: '行至一处山脚客栈，忽听得一声梆子响，店中伙计纷纷抽出利刃！',
    options: [
      { id: 'fight', text: '强闯突围', effect: { triggerBattle: true } },
      { id: 'parley', text: '舌战群匪', effect: { morale: -10, cargo: -10 } },
      { id: 'sneak', text: '翻墙夜遁', effect: { stamina: -15, time: 20, cargo: -5 } }
    ]
  },
  {
    id: 'battle-3',
    type: 'battle',
    title: '剪径强人',
    description: '两山之间的羊肠小道上，一伙蒙面强人一字排开，杀气腾腾！',
    options: [
      { id: 'fight', text: '正面冲杀', effect: { triggerBattle: true } },
      { id: 'bribe', text: '献上买路钱', effect: { cargo: -20, morale: -10 } },
      { id: 'climb', text: '攀崖绕行', effect: { stamina: -20, time: 40, cargo: -8 } }
    ]
  }
];

const WEATHER_EVENTS: GameEvent[] = [
  {
    id: 'weather-1',
    type: 'weather',
    title: '暴雨倾盆',
    description: '忽然乌云密布，暴雨如注！山涧水位猛涨，前方栈道被冲垮多处。',
    options: [
      { id: 'repair', text: '冒险修路', effect: { stamina: -15, cargo: -5, time: 15, morale: -5 } },
      { id: 'camp', text: '原地扎营', effect: { stamina: +10, morale: +5, time: 30 } },
      { id: 'detour', text: '绕行远路', effect: { stamina: -10, time: 30 } }
    ]
  },
  {
    id: 'weather-2',
    type: 'weather',
    title: '浓雾弥漫',
    description: '山谷中忽然升起浓重的白雾，三步之外不见人影，前行极易迷失方向。',
    options: [
      { id: 'slow', text: '缓缓前行', effect: { stamina: -5, time: 25, cargo: -3 } },
      { id: 'wait', text: '待雾散去', effect: { stamina: +5, time: 20 } },
      { id: 'explore', text: '派人探路', effect: { stamina: -10, time: 15 } }
    ]
  },
  {
    id: 'weather-3',
    type: 'weather',
    title: '酷暑难当',
    description: '烈日当空，暑气逼人，镖师们汗流浃背，马匹也口吐白沫。',
    options: [
      { id: 'push', text: '兼程赶路', effect: { stamina: -20, morale: -10 } },
      { id: 'rest', text: '午间歇息', effect: { stamina: +15, morale: +5, time: 20 } },
      { id: 'night', text: '夜行晓宿', effect: { stamina: -5, time: 35, morale: +3 } }
    ]
  }
];

const ROAD_EVENTS: GameEvent[] = [
  {
    id: 'road-1',
    type: 'road',
    title: '栈道坍塌',
    description: '前方悬崖边的古栈道年久失修，大片木板已经腐朽坍塌，下面是万丈深渊。',
    options: [
      { id: 'mend', text: '架木铺路', effect: { stamina: -18, time: 25, cargo: -5 } },
      { id: 'camp', text: '扎营待援', effect: { stamina: +8, time: 40, morale: -8 } },
      { id: 'climb', text: '攀山越岭', effect: { stamina: -25, time: 50, cargo: -12, morale: -5 } }
    ]
  },
  {
    id: 'road-2',
    type: 'road',
    title: '山崩阻路',
    description: '忽闻隆隆巨响，前方发生山崩，大量岩石泥土堵塞了唯一的通道。',
    options: [
      { id: 'dig', text: '徒手挖通', effect: { stamina: -22, time: 30, cargo: -8 } },
      { id: 'wait', text: '等候清理', effect: { stamina: +5, time: 45, morale: -5 } },
      { id: 'backtrack', text: '回头绕行', effect: { stamina: -15, time: 60, progress: -10 } }
    ]
  },
  {
    id: 'road-3',
    type: 'road',
    title: '断桥难渡',
    description: '行至一条湍急的河流边，发现唯一的木桥已经被洪水冲断。',
    options: [
      { id: 'swim', text: '凫水渡河', effect: { stamina: -15, cargo: -15, time: 20 } },
      { id: 'build', text: '砍伐搭桥', effect: { stamina: -20, time: 35 } },
      { id: 'upstream', text: '上游寻渡', effect: { stamina: -10, time: 40 } }
    ]
  }
];

export const EVENT_POOL: GameEvent[] = [
  ...BATTLE_EVENTS,
  ...WEATHER_EVENTS,
  ...ROAD_EVENTS
];

export function generateEvent(progress: number): GameEvent {
  let eventPool: GameEvent[];
  
  if (progress < 33) {
    eventPool = [...BATTLE_EVENTS.slice(0, 1), ...WEATHER_EVENTS.slice(0, 1), ...ROAD_EVENTS.slice(0, 1)];
  } else if (progress < 66) {
    eventPool = [...BATTLE_EVENTS.slice(0, 2), ...WEATHER_EVENTS.slice(0, 2), ...ROAD_EVENTS.slice(0, 2)];
  } else {
    eventPool = EVENT_POOL;
  }
  
  const randomIndex = Math.floor(Math.random() * eventPool.length);
  return { ...eventPool[randomIndex], id: `event-${Date.now()}-${randomIndex}` };
}

export function shouldTriggerEvent(progress: number): boolean {
  const baseChance = 0.4;
  const progressFactor = progress / 200;
  return Math.random() < (baseChance + progressFactor);
}
