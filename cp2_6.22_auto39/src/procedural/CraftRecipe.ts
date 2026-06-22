import type { Item, ItemQuality } from '../types';
import { EFFECTS } from './ItemGenerator';

const Q_INDEX: ItemQuality[] = ['white', 'blue', 'purple', 'gold'];
const Q_MULT: Record<ItemQuality, number> = { white: 1, blue: 1.4, purple: 2, gold: 3 };
const EFF_CHANCE: Record<ItemQuality, number> = { white: 0.1, blue: 0.3, purple: 0.6, gold: 1 };
const Q_SUFFIX: Record<ItemQuality, string> = { white: '', blue: ' ●', purple: ' ◆', gold: ' ★' };

const UPGRADE_CHANCE: Record<string, number> = {
  white: 0.15,
  blue: 0.4,
  purple: 0.35,
};

const NAME_POOLS: Record<string, string[]> = {
  weapon: ['暗影之刃', '等离子炮', '量子长矛', '能量战锤', '纳米双刃剑', '光子步枪', '虚空巨剑', '电磁手炮', '星尘之弓', '赛博战斧'],
  armor: ['纳米护甲', '量子护盾', '虚空战甲', '光子屏障', '等离子胸甲', '能量护肩', '星尘披风', '赛博外骨骼', '暗影皮甲', '晶化头盔'],
  accessory: ['吸血项链', '连击戒指', '护盾护符', '闪避手镯', '暴击徽章', '能量核心', '时空罗盘', '光子吊坠', '虚空耳环', '量子腰带'],
};

export class CraftRecipe {
  static canCraft(materials: Item[]): { ok: boolean; reason?: string } {
    if (!Array.isArray(materials)) return { ok: false, reason: '参数无效' };
    if (materials.length !== 3) return { ok: false, reason: '需要3件材料' };
    if (!materials.every(Boolean)) return { ok: false, reason: '槽位未填满' };
    const type = materials[0].type;
    if (!materials.every((m) => m.type === type)) {
      return { ok: false, reason: '必须为相同类型道具' };
    }
    return { ok: true };
  }

  static craft(materials: Item[]): { success: boolean; result?: Item; error?: string } {
    const check = this.canCraft(materials);
    if (!check.ok) return { success: false, error: check.reason };

    const type = materials[0].type;
    const maxIdx = Math.max(...materials.map((m) => Q_INDEX.indexOf(m.quality)));
    const baseQ = Q_INDEX[maxIdx];
    const chance = UPGRADE_CHANCE[baseQ] || 0;
    const upgraded = maxIdx < 3 && Math.random() < chance;
    const newQuality: ItemQuality = upgraded ? Q_INDEX[Math.min(maxIdx + 1, 3)] : baseQ;

    const qMult = Q_MULT[newQuality];
    const effChance = EFF_CHANCE[newQuality];

    const total = materials.reduce(
      (a, m) => ({
        attack: a.attack + m.stats.attack,
        defense: a.defense + m.stats.defense,
        critRate: a.critRate + m.stats.critRate,
      }),
      { attack: 0, defense: 0, critRate: 0 }
    );

    const pool = NAME_POOLS[type];
    const effs = materials.filter((m) => m.effect).map((m) => m.effect!);
    const hasEff = effs.length > 0 || Math.random() < effChance;
    const pickEff =
      effs.length > 0
        ? effs[Math.floor(Math.random() * effs.length)]
        : EFFECTS[Math.floor(Math.random() * EFFECTS.length)];

    const result: Item = {
      id: `it_craft_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: `[合成] ${pool[Math.floor(Math.random() * pool.length)]}${Q_SUFFIX[newQuality]}`,
      type,
      quality: newQuality,
      stats: {
        attack: Math.floor(Math.max(total.attack / 3, 2) * qMult),
        defense: Math.floor(Math.max(total.defense / 3, 1) * qMult),
        critRate: Math.floor(Math.max(total.critRate / 3, 0.5) * qMult * 10) / 10,
      },
      effect: hasEff ? pickEff : null,
      upgraded,
    };

    return { success: true, result };
  }

  static async craftAsync(materials: Item[]): Promise<{ success: boolean; result?: Item; error?: string }> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(this.craft(materials)), 0);
    });
  }
}
