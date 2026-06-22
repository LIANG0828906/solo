import { v4 as uuidv4 } from 'uuid';
import type { Card } from '../types';

export const createCardPool = (): Card[] => [
  { id: uuidv4(), name: '火花弹', cost: 1, attack: 3, description: '发射一颗小型火球', tag: '火焰' },
  { id: uuidv4(), name: '冰刺', cost: 1, attack: 3, description: '召唤尖锐冰刺', tag: '冰霜' },
  { id: uuidv4(), name: '暗影爪', cost: 1, attack: 3, description: '挥出暗影之爪', tag: '暗影' },
  { id: uuidv4(), name: '重击', cost: 1, attack: 3, description: '进行一次重击', tag: '物理' },
  { id: uuidv4(), name: '燃烧弹', cost: 1, attack: 4, description: '造成灼烧伤害', tag: '火焰' },
  { id: uuidv4(), name: '霜冻箭', cost: 1, attack: 4, description: '冰冻敌方', tag: '冰霜' },
  { id: uuidv4(), name: '暗影匕首', cost: 1, attack: 4, description: '投掷暗影匕首', tag: '暗影' },
  { id: uuidv4(), name: '盾击', cost: 1, attack: 4, description: '用盾牌攻击', tag: '物理' },
  { id: uuidv4(), name: '烈焰风暴', cost: 2, attack: 6, description: '召唤烈焰风暴', tag: '火焰' },
  { id: uuidv4(), name: '暴风雪', cost: 2, attack: 6, description: '召唤暴风雪', tag: '冰霜' },
  { id: uuidv4(), name: '暗影冲击', cost: 2, attack: 6, description: '释放暗影能量', tag: '暗影' },
  { id: uuidv4(), name: '破甲斩', cost: 2, attack: 6, description: '穿透护甲的斩击', tag: '物理' },
  { id: uuidv4(), name: '火球术', cost: 2, attack: 7, description: '发射大火球', tag: '火焰' },
  { id: uuidv4(), name: '冰霜新星', cost: 2, attack: 7, description: '冰霜爆发', tag: '冰霜' },
  { id: uuidv4(), name: '虚空射线', cost: 2, attack: 7, description: '虚空能量射线', tag: '暗影' },
  { id: uuidv4(), name: '连环拳', cost: 2, attack: 7, description: '连续出拳', tag: '物理' },
  { id: uuidv4(), name: '陨石坠落', cost: 3, attack: 10, description: '召唤陨石砸向敌人', tag: '火焰' },
  { id: uuidv4(), name: '绝对零度', cost: 3, attack: 10, description: '将敌人冰冻至绝对零度', tag: '冰霜' },
  { id: uuidv4(), name: '深渊降临', cost: 3, attack: 10, description: '深渊力量吞噬一切', tag: '暗影' },
  { id: uuidv4(), name: '毁灭打击', cost: 3, attack: 10, description: '造成毁灭性伤害', tag: '物理' },
];

export const drawRandomCard = (pool: Card[]): Card => {
  const randomIndex = Math.floor(Math.random() * pool.length);
  return { ...pool[randomIndex], id: uuidv4() };
};
