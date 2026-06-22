/**
 * ================================================================
 *  ItemGenerator.ts  ——  程序化道具生成器
 * ================================================================
 *
 * 【职责】
 *  根据关卡难度 (Difficulty) 和生成数量 (3~5)，随机产出 Item[]。
 *  每个 Item 严格遵循 types.ts 中定义的取值范围，供 MainSimulator
 *  放入 battleRewards / inventory，或直接被 CraftRecipe 消费。
 *
 * 【文件间调用关系】
 *
 *  ┌───────────────────────────────────────────────────────────┐
 *  │                     MainSimulator                         │
 *  │   enterBattle() / 初始填充 直接调用本模块                 │
 *  └─────────────────────┬─────────────────────────────────────┘
 *                        │  (difficulty, count=3~5)
 *                        ▼
 *  ┌───────────────────────────────────────────────────────────┐
 *  │                 ItemGenerator.generate()                  │
 *  │   ├─ QUALITY_WEIGHTS → 加权选取品质 (白/蓝/紫/金)         │
 *  │   ├─ 类型均匀随机 (武器/防具/饰品)                        │
 *  │   ├─ Q_MULT 品质倍率 × 基础属性                           │
 *  │   ├─ EFF_CHANCE 特效概率判定                               │
 *  │   └─ 命名池 + 品质符号后缀                                │
 *  └─────────────────────┬─────────────────────────────────────┘
 *                        │
 *                        ▼
 *                Item[] (3~5 件, 严格类型)
 *                   │     │     │
 *          ┌────────┘     │     └───────────┐
 *          ▼              ▼                 ▼
 *   存入 battleRewards   存入 inventory   传给 CombatEngine
 *   (战斗胜利→背包)     (装备/合成源)    (computePlayer → 属性加成)
 *          ▲
 *          │(战斗胜利自动转移)
 *   MainSimulator.runCombat()
 * ================================================================
 */

import type {
  Item, Difficulty, ItemQuality, ItemType, ItemEffect, ItemStats, CritRate,
} from '../types';
import { assertCritRate } from '../types';

/* -------------------- 可调常量 (品质权重 / 数值范围) -------------------- */

/**
 * 不同难度下 4 种品质的权重表（总和任意，内部加权）
 * - 简单: 白 60 / 蓝 28 / 紫 10 / 金 2
 * - 普通: 白 45 / 蓝 32 / 紫 18 / 金 5
 * - 困难: 白 25 / 蓝 35 / 紫 30 / 金 10
 */
export const QUALITY_WEIGHTS: Record<Difficulty, Record<ItemQuality, number>> = {
  easy:   { white: 60, blue: 28, purple: 10, gold: 2 },
  normal: { white: 45, blue: 32, purple: 18, gold: 5 },
  hard:   { white: 25, blue: 35, purple: 30, gold: 10 },
};

/** 命名池 - 武器 */
export const WEAPON_NAMES = [
  '暗影之刃', '等离子炮', '量子长矛', '能量战锤', '纳米双刃剑',
  '光子步枪', '虚空巨剑', '电磁手炮', '星尘之弓', '赛博战斧',
];
/** 命名池 - 防具 */
export const ARMOR_NAMES = [
  '纳米护甲', '量子护盾', '虚空战甲', '光子屏障', '等离子胸甲',
  '能量护肩', '星尘披风', '赛博外骨骼', '暗影皮甲', '晶化头盔',
];
/** 命名池 - 饰品 */
export const ACCESSORY_NAMES = [
  '吸血项链', '连击戒指', '护盾护符', '闪避手镯', '暴击徽章',
  '能量核心', '时空罗盘', '光子吊坠', '虚空耳环', '量子腰带',
];

/**
 * 8 种随机特效定义（id 严格匹配 CombatEngine 内逻辑分支）
 */
export const EFFECTS: ItemEffect[] = [
  { id: 'lifesteal', name: '吸血',   desc: '攻击回复伤害的15%生命' },
  { id: 'combo',     name: '连击',   desc: '25%概率额外攻击一次' },
  { id: 'shield',    name: '护盾',   desc: '首次受伤减免50%伤害' },
  { id: 'dodge',     name: '闪避',   desc: '15%概率完全闪避攻击' },
  { id: 'crit',      name: '暴击强化', desc: '暴击伤害提升50%' },
  { id: 'thorns',    name: '反伤',   desc: '受到攻击反弹20%伤害' },
  { id: 'rage',      name: '狂暴',   desc: '生命低于30%时攻击+30%' },
  { id: 'regen',     name: '再生',   desc: '每回合回复5%最大生命' },
];

/** 品质倍率 —— 用于基础属性 × 倍率 */
export const Q_MULT: Record<ItemQuality, number> = {
  white: 1.0, blue: 1.4, purple: 2.0, gold: 3.0,
};

/**
 * 特效概率 —— 品质越高越容易带随机特效
 * 白色 10% / 蓝 30% / 紫 60% / 金 100%
 */
export const EFF_CHANCE: Record<ItemQuality, number> = {
  white: 0.1, blue: 0.3, purple: 0.6, gold: 1.0,
};

/** 品质符号后缀，UI 上直观区分稀有度 */
export const Q_SUFFIX: Record<ItemQuality, string> = {
  white: '', blue: ' ●', purple: ' ◆', gold: ' ★',
};

/* -------------------- 基础属性取值范围（约束，便于调参） -------------------- */

/**
 * 按类型的基础数值范围 [min, max]（× Q_MULT 前的原始值）
 * - 武器:  主要 +攻击，附带少量暴击
 * - 防具:  主要 +防御
 * - 饰品:  主要 +暴击率
 */
const BASE_STAT_RANGE: Record<ItemType, { attack: [number, number]; defense: [number, number]; critRate: [number, number] }> = {
  weapon:    { attack: [10, 20], defense: [0, 0],  critRate: [1, 4]  },
  armor:     { attack: [0, 0],   defense: [8, 16], critRate: [0, 0]  },
  accessory: { attack: [0, 0],   defense: [0, 0],  critRate: [3, 8]  },
};

/** 允许生成的数量范围 */
export const COUNT_RANGE: [number, number] = [3, 5];

/* -------------------- 工具函数 -------------------- */

/**
 * 加权随机选取 (通用)
 * weights 的 key 为候选值，value 为整数权重
 */
export function pickWeighted<T extends string>(weights: Record<T, number>): T {
  const entries = Object.entries(weights) as [T, number][];
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [key, w] of entries) {
    r -= w;
    if (r <= 0) return key;
  }
  return entries[0][0];
}

/** [min, max] 区间整数 */
function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/** 对一个数值做上下界截断（保证不会超出 types.ts 的约束） */
function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/* -------------------- 主类 -------------------- */

export class ItemGenerator {
  /**
   * 同步生成 n 件道具
   * @param count      生成数量，自动裁剪到 [3, 5]
   * @param difficulty 难度（影响品质分布权重）
   */
  static generate(count: number = 4, difficulty: Difficulty = 'normal'): Item[] {
    const items: Item[] = [];
    const n = clamp(count, COUNT_RANGE[0], COUNT_RANGE[1]);
    const qWeights = QUALITY_WEIGHTS[difficulty];

    for (let i = 0; i < n; i++) {
      const quality: ItemQuality = pickWeighted<ItemQuality>(qWeights);
      const types: ItemType[] = ['weapon', 'armor', 'accessory'];
      const type: ItemType  = types[Math.floor(Math.random() * 3)];
      const qMult = Q_MULT[quality];
      const range = BASE_STAT_RANGE[type];

      const baseAtk  = randInt(range.attack[0],   range.attack[1]);
      const baseDef  = randInt(range.defense[0],  range.defense[1]);
      const baseCrit = randInt(range.critRate[0] * 10, range.critRate[1] * 10) / 10;

      const pool =
        type === 'weapon'    ? WEAPON_NAMES    :
        type === 'armor'     ? ARMOR_NAMES     :
                               ACCESSORY_NAMES ;
      const rollEff = Math.random() < EFF_CHANCE[quality];
      const eff = rollEff ? EFFECTS[Math.floor(Math.random() * EFFECTS.length)] : null;

      // ★ critRate 使用 assertCritRate 品牌类型：夹紧[0,45] + 保证1位小数
      const stats: ItemStats = {
        attack:   clamp(Math.floor(baseAtk  * qMult),        0, 90),
        defense:  clamp(Math.floor(baseDef  * qMult),        0, 72),
        critRate: assertCritRate(clamp(Math.floor(baseCrit * qMult * 10) / 10, 0, 45)),
      };

      items.push({
        id: `it_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
        name: pool[Math.floor(Math.random() * pool.length)] + Q_SUFFIX[quality],
        type,
        quality,
        stats,
        effect: eff,
      });
    }

    return items;
  }

  /** 异步版（模拟网络请求，避免 UI 卡顿），供后续对接后端 API */
  static async generateAsync(
    count: number      = 4,
    difficulty: Difficulty = 'normal',
  ): Promise<Item[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(this.generate(count, difficulty)), 0);
    });
  }
}
