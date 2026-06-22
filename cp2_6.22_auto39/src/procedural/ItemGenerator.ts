import type { Item, Difficulty, ItemQuality, ItemType, ItemEffect } from '../types';

const QUALITY_WEIGHTS: Record<Difficulty, Record<ItemQuality, number>> = {
  easy: { white: 60, blue: 28, purple: 10, gold: 2 },
  normal: { white: 45, blue: 32, purple: 18, gold: 5 },
  hard: { white: 25, blue: 35, purple: 30, gold: 10 },
};

const WEAPON_NAMES = [
  '暗影之刃', '等离子炮', '量子长矛', '能量战锤', '纳米双刃剑',
  '光子步枪', '虚空巨剑', '电磁手炮', '星尘之弓', '赛博战斧',
];
const ARMOR_NAMES = [
  '纳米护甲', '量子护盾', '虚空战甲', '光子屏障', '等离子胸甲',
  '能量护肩', '星尘披风', '赛博外骨骼', '暗影皮甲', '晶化头盔',
];
const ACCESSORY_NAMES = [
  '吸血项链', '连击戒指', '护盾护符', '闪避手镯', '暴击徽章',
  '能量核心', '时空罗盘', '光子吊坠', '虚空耳环', '量子腰带',
];

const EFFECTS: ItemEffect[] = [
  { id: 'lifesteal', name: '吸血', desc: '攻击回复伤害的15%生命' },
  { id: 'combo', name: '连击', desc: '25%概率额外攻击一次' },
  { id: 'shield', name: '护盾', desc: '首次受伤减免50%伤害' },
  { id: 'dodge', name: '闪避', desc: '15%概率完全闪避攻击' },
  { id: 'crit', name: '暴击强化', desc: '暴击伤害提升50%' },
  { id: 'thorns', name: '反伤', desc: '受到攻击反弹20%伤害' },
  { id: 'rage', name: '狂暴', desc: '生命低于30%时攻击+30%' },
  { id: 'regen', name: '再生', desc: '每回合回复5%最大生命' },
];

const Q_MULT: Record<ItemQuality, number> = { white: 1, blue: 1.4, purple: 2, gold: 3 };
const EFF_CHANCE: Record<ItemQuality, number> = { white: 0.1, blue: 0.3, purple: 0.6, gold: 1 };
const Q_SUFFIX: Record<ItemQuality, string> = { white: '', blue: ' ●', purple: ' ◆', gold: ' ★' };

function pickWeighted<T extends string>(weights: Record<T, number>): T {
  const entries = Object.entries(weights) as [T, number][];
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [key, w] of entries) {
    r -= w;
    if (r <= 0) return key;
  }
  return entries[0][0];
}

export class ItemGenerator {
  static generate(count: number = 4, difficulty: Difficulty = 'normal'): Item[] {
    const items: Item[] = [];
    const n = Math.max(3, Math.min(5, count));
    const qWeights = QUALITY_WEIGHTS[difficulty];

    for (let i = 0; i < n; i++) {
      const quality: ItemQuality = pickWeighted<ItemQuality>(qWeights);
      const types: ItemType[] = ['weapon', 'armor', 'accessory'];
      const type: ItemType = types[Math.floor(Math.random() * 3)];
      const qMult = Q_MULT[quality];

      const baseAtk = type === 'weapon' ? 10 + Math.floor(Math.random() * 10) : 0;
      const baseDef = type === 'armor' ? 8 + Math.floor(Math.random() * 8) : 0;
      const baseCrit = type === 'accessory' ? 3 + Math.floor(Math.random() * 5) : (type === 'weapon' ? 1 + Math.floor(Math.random() * 3) : 0);

      const pool = type === 'weapon' ? WEAPON_NAMES : type === 'armor' ? ARMOR_NAMES : ACCESSORY_NAMES;
      const eff = Math.random() < EFF_CHANCE[quality] ? EFFECTS[Math.floor(Math.random() * EFFECTS.length)] : null;

      items.push({
        id: `it_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
        name: pool[Math.floor(Math.random() * pool.length)] + Q_SUFFIX[quality],
        type,
        quality,
        stats: {
          attack: Math.floor(baseAtk * qMult),
          defense: Math.floor(baseDef * qMult),
          critRate: Math.floor(baseCrit * qMult * 10) / 10,
        },
        effect: eff,
      });
    }
    return items;
  }

  static async generateAsync(count?: number, difficulty?: Difficulty): Promise<Item[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(this.generate(count, difficulty)), 0);
    });
  }
}

export { QUALITY_WEIGHTS, WEAPON_NAMES, ARMOR_NAMES, ACCESSORY_NAMES, EFFECTS };
