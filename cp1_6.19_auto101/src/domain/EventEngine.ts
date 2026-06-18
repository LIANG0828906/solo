import { EventResult } from './types';

const TRAP_EVENTS: Omit<EventResult, 'type'>[] = [
  { description: '毒箭陷阱', hpChange: -10 },
  { description: '落石陷阱', hpChange: -15 },
  { description: '酸液喷涌', hpChange: -8 },
];

const CHEST_EVENTS: Omit<EventResult, 'type'>[] = [
  { description: '古老宝箱', hpChange: 0, itemFound: '生命药水' },
  { description: '神秘宝箱', hpChange: 5, itemFound: '魔法卷轴' },
];

const NPC_EVENTS: Omit<EventResult, 'type' | 'choices'>[] = [
  {
    description: '流浪商人',
    hpChange: 0,
    choices: [
      { text: '购买药水(-5HP,+药水)', hpChange: -5 },
      { text: '无视(+0)', hpChange: 0 },
    ],
  },
  {
    description: '神秘占卜师',
    hpChange: 0,
    choices: [
      { text: '占卜(-10HP,+攻击)', hpChange: -10 },
      { text: '拒绝(+0)', hpChange: 0 },
    ],
  },
];

export function generateEvent(): EventResult {
  const roll = Math.random();
  if (roll < 0.4) {
    const trap = TRAP_EVENTS[Math.floor(Math.random() * TRAP_EVENTS.length)];
    return { type: 'trap', ...trap };
  } else if (roll < 0.7) {
    const chest = CHEST_EVENTS[Math.floor(Math.random() * CHEST_EVENTS.length)];
    return { type: 'chest', ...chest };
  } else {
    const npc = NPC_EVENTS[Math.floor(Math.random() * NPC_EVENTS.length)];
    return { type: 'npc', ...npc };
  }
}
