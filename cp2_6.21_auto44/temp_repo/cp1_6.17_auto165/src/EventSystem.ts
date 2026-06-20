import { v4 as uuidv4 } from 'uuid';
import type { GameEvent, EventBus, EventCallback } from './types';

const EVENT_POOL: Omit<GameEvent, 'id'>[] = [
  {
    name: '海盗袭击',
    description: '一伙星际海盗拦截了你的飞船！他们要求你交出20%的货物，否则将攻击你的飞船。',
    type: 'pirate',
    options: [
      { text: '交出货物', effectType: 'loseCargo', effectValue: 0.2, isPositive: false },
      { text: '拒绝并战斗', effectType: 'loseReputation', effectValue: 2, isPositive: false },
    ],
  },
  {
    name: '燃料泄漏',
    description: '飞船燃料舱出现裂缝，燃料正在泄漏！你需要立即处理。',
    type: 'fuel',
    options: [
      { text: '紧急修补', effectType: 'loseFuel', effectValue: 10, isPositive: false },
      { text: '继续航行（危险）', effectType: 'loseFuel', effectValue: 20, isPositive: false },
    ],
  },
  {
    name: '市场波动',
    description: '星系市场发生了剧烈波动，某些商品价格大涨！你可以趁机获利。',
    type: 'market',
    options: [
      { text: '把握机会', effectType: 'gainCredits', effectValue: 200, isPositive: true },
      { text: '观望不动', effectType: 'loseCredits', effectValue: 50, isPositive: false },
    ],
  },
  {
    name: '太空遗迹',
    description: '你发现了一处古老的太空遗迹，里面有珍贵的资源和星图数据。',
    type: 'discovery',
    options: [
      { text: '探索遗迹', effectType: 'gainCredits', effectValue: 300, isPositive: true },
      { text: '谨慎绕行', effectType: 'gainReputation', effectValue: 3, isPositive: true },
    ],
  },
  {
    name: '求救信号',
    description: '你收到了附近一艘商船的求救信号，他们急需燃料补给。',
    type: 'distress',
    options: [
      { text: '援助商船', effectType: 'gainReputation', effectValue: 3, isPositive: true },
      { text: '无视信号', effectType: 'loseReputation', effectValue: 2, isPositive: false },
    ],
  },
];

export function createEventBus(): EventBus {
  const subscribers: EventCallback[] = [];

  return {
    subscribe(callback: EventCallback) {
      subscribers.push(callback);
      return () => {
        const idx = subscribers.indexOf(callback);
        if (idx > -1) subscribers.splice(idx, 1);
      };
    },
    publish(event: GameEvent) {
      for (const cb of subscribers) {
        cb(event);
      }
    },
  };
}

export function createEventSystem(eventBus: EventBus) {
  function triggerRandomEvent(): GameEvent | null {
    if (Math.random() > 0.3) return null;
    const template = EVENT_POOL[Math.floor(Math.random() * EVENT_POOL.length)];
    const event: GameEvent = { ...template, id: uuidv4() };
    eventBus.publish(event);
    return event;
  }

  return {
    triggerRandomEvent,
  };
}
