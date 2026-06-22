/**
 * ================================================================
 *  CraftRecipe.ts  ——  道具合成配方系统
 * ================================================================
 *
 * 【职责】
 *  接收玩家拖拽到合成槽的 3 件 Item，执行：
 *    ① 校验（3件齐全 + 同类 + 非空）
 *    ② 依据"输入品质最高者"从 UPGRADE_WEIGHTS 表加权抽取新品质
 *    ③ 计算新属性（平均值 × 新品质系数）、继承/随机特效
 *    ④ 返回新 Item 或 错误字符串
 *
 * 【文件间调用关系】
 *
 *  App.tsx (合成弹窗)
 *        │ 用户点击"开始合成"，传入 slots[3]
 *        ▼
 *  MainSimulator.craft(materials) ──────────────┐
 *        │ 过滤 undefined → Item[3]             │
 *        │                                      │ 输出:
 *        ▼                                      │ 成功 → 新 Item
 *  CraftRecipe.canCraft(materials)              │ 失败 → error 字符串
 *     ├─ 长度 === 3                             │
 *     ├─ 无 null/undefined                      │
 *     └─ 三者 type 完全一致                      │
 *        │ 通过                                  │
 *        ▼                                      │
 *  CraftRecipe.craft(materials)                 │
 *     ├─ 3 件中最高品质作为 baseQ                │
 *     ├─ UPGRADE_WEIGHTS[baseQ] 加权抽新品质     │
 *     ├─ 属性平均 × Q_MULT[新品质]              │
 *     ├─ 继承或随机特效 (EFF_CHANCE)            │
 *     └─ 命名前缀 [合成]                        │
 *        │                                      │
 *        ▼                                      │
 *  { success: true, result: Item }              │
 *        │                                      │
 *  MainSimulator:                               │
 *     ├─ 从 inventory/equipped 移除 3 件材料    │
 *     └─ push 新 Item 到 inventory ─────────────┘
 *
 * ================================================================
 */

import type { Item, ItemQuality, ItemType } from '../types';
import { assertCritRate } from '../types';
import { Q_MULT, EFF_CHANCE, Q_SUFFIX, pickWeighted, EFFECTS } from './ItemGenerator';

/* -------------------- 常量 -------------------- */

const Q_INDEX: ItemQuality[] = ['white', 'blue', 'purple', 'gold'];

/**
 * 命名池 - 合成后名称随机选取（与 ItemGenerator 保持一致）
 */
const NAME_POOLS: Record<ItemType, string[]> = {
  weapon: [
    '暗影之刃', '等离子炮', '量子长矛', '能量战锤', '纳米双刃剑',
    '光子步枪', '虚空巨剑', '电磁手炮', '星尘之弓', '赛博战斧',
  ],
  armor: [
    '纳米护甲', '量子护盾', '虚空战甲', '光子屏障', '等离子胸甲',
    '能量护肩', '星尘披风', '赛博外骨骼', '暗影皮甲', '晶化头盔',
  ],
  accessory: [
    '吸血项链', '连击戒指', '护盾护符', '闪避手镯', '暴击徽章',
    '能量核心', '时空罗盘', '光子吊坠', '虚空耳环', '量子腰带',
  ],
};

/* ================================================================
 *   ★ 核心：可配置合成品质权重表 ★
 * ================================================================
 *  key = "3 件材料的最高品质"；value = 输出品质权重数组
 *  每项结构: [ white_weight, blue_weight, purple_weight, gold_weight ]
 *  例：3 件蓝色 → 权重 [0, 60, 40, 0] → 60% 蓝 / 40% 紫
 * ================================================================
 */
export type UpgradeWeight = [number, number, number, number];

export const UPGRADE_WEIGHTS: Record<ItemQuality, UpgradeWeight> = {
  // 3 件白 (含混搭) → 15% 蓝, 85% 白
  white:  [85, 15, 0,  0  ],
  // 3 件蓝 (含混搭) → 60% 蓝, 40% 紫
  blue:   [0,  60, 40, 0  ],
  // 3 件紫 (含混搭) → 65% 紫, 35% 金
  purple: [0,  0,  65, 35 ],
  // 3 件金 (含混搭) → 100% 金 (无法再升)
  gold:   [0,  0,  0,  100],
};

/**
 * 根据 baseQuality 和权重表 → 返回加权抽取的新品质
 */
function rollQuality(baseQ: ItemQuality): ItemQuality {
  const weight = UPGRADE_WEIGHTS[baseQ];
  const map: Record<ItemQuality, number> = {
    white:  weight[0],
    blue:   weight[1],
    purple: weight[2],
    gold:   weight[3],
  };
  return pickWeighted<ItemQuality>(map);
}

/* -------------------- 主类 -------------------- */

/** 校验错误码分类 —— 便于 UI 根据 code 做差异化提示 */
export type ValidateErrorCode =
  | 'NOT_ARRAY'
  | 'WRONG_LENGTH'
  | 'EMPTY_SLOT'
  | 'TYPE_MISMATCH'
  | 'ITEM_CORRUPTED';

export interface ValidateResult {
  ok: boolean;
  /** 错误码，便于 UI 分支处理 */
  code?: ValidateErrorCode;
  /** 空槽索引集合 (EMPTY_SLOT 时填充) */
  emptySlots?: number[];
  /** 不一致的道具类型集合 (TYPE_MISMATCH 时填充) */
  mismatchedTypes?: ItemType[];
  /** 人类可读中文错误 */
  reason?: string;
}

const ZH_TYPE: Record<ItemType, string> = {
  weapon: '武器', armor: '防具', accessory: '饰品',
};

export class CraftRecipe {
  /**
   * ★ 合成槽位校验 (validateSlots) —— 按需求检查：
   *   ① 参数本身是否为数组
   *   ② 长度严格 === 3
   *   ③ 逐个空槽检查，并收集所有空槽索引（便于 UI 统一标红）
   *   ④ 3 个道具 type 字段完全一致（不检查品质，品质只影响合成概率）
   *   ⑤ 每个 Item.id / type 字段完整性校验
   *
   * @returns ValidateResult —— 包含错误码 + 空槽列表，便于 App.tsx 差异化渲染
   */
  static validateSlots(materials: (Item | undefined | null)[]): ValidateResult {
    if (!Array.isArray(materials)) {
      return {
        ok: false,
        code: 'NOT_ARRAY',
        reason: '参数无效：合成材料需要是数组',
      };
    }
    if (materials.length !== 3) {
      return {
        ok: false,
        code: 'WRONG_LENGTH',
        reason: `合成配方需要 3 个槽位，当前传入 ${materials.length} 个`,
      };
    }

    // ---- ③ 空槽检查：一次性收集所有空槽，便于 UI 逐个高亮 ----
    const emptySlots: number[] = [];
    for (let i = 0; i < 3; i++) {
      const m = materials[i];
      if (m === null || m === undefined) {
        emptySlots.push(i);
      } else if (typeof m !== 'object' || !m.id || !m.type) {
        return {
          ok: false,
          code: 'ITEM_CORRUPTED',
          reason: `第 ${i + 1} 件道具数据损坏（缺少 id/type）`,
        };
      }
    }
    if (emptySlots.length > 0) {
      const zh = emptySlots.map((i) => `槽位${i + 1}`).join('、');
      return {
        ok: false,
        code: 'EMPTY_SLOT',
        emptySlots,
        reason: `${zh} 未放入道具`,
      };
    }

    // ---- ④ 检查 3 件道具 type 是否一致（不检查 quality）----
    const arr = materials as Item[];
    const types: ItemType[] = [arr[0].type, arr[1].type, arr[2].type];
    const first: ItemType = types[0];
    const mismatched: ItemType[] = [];
    for (let i = 1; i < 3; i++) {
      if (types[i] !== first) mismatched.push(types[i]);
    }
    if (mismatched.length > 0) {
      const uniqTypes = Array.from(new Set(types));
      const zhAll = uniqTypes.map((t) => ZH_TYPE[t]).join(' vs ');
      return {
        ok: false,
        code: 'TYPE_MISMATCH',
        mismatchedTypes: uniqTypes,
        reason: `道具类型必须一致（当前：${zhAll}）`,
      };
    }

    return { ok: true };
  }

  /**
   * 旧方法 canCraft 别名，保持向后兼容。
   * 新代码请调用 validateSlots() 获取完整错误码与空槽索引。
   */
  static canCraft(materials: (Item | undefined | null)[]): { ok: boolean; reason?: string } {
    const r = this.validateSlots(materials);
    return { ok: r.ok, reason: r.reason };
  }

  /**
   * 执行合成
   * @returns { success, result?, error? }
   */
  static craft(
    materials: (Item | undefined | null)[],
  ): { success: boolean; result?: Item; error?: string; code?: ValidateErrorCode } {
    const check = this.validateSlots(materials);
    if (!check.ok) {
      return { success: false, error: check.reason, code: check.code };
    }
    const arr = materials as Item[];

    const type: ItemType = arr[0].type;

    // ---- 步骤 1: 根据最高材料品质 + UPGRADE_WEIGHTS 加权抽取 ----
    const maxIdx = Math.max(...arr.map((m) => Q_INDEX.indexOf(m.quality)));
    const baseQ: ItemQuality = Q_INDEX[maxIdx];
    const newQuality: ItemQuality = rollQuality(baseQ);
    const upgraded = Q_INDEX.indexOf(newQuality) > maxIdx;

    const qMult   = Q_MULT[newQuality];
    const effProb = EFF_CHANCE[newQuality];

    // ---- 步骤 2: 属性计算 (平均值 × 新品质系数 + 上下界) ----
    const total = arr.reduce(
      (a, m) => ({
        attack:   a.attack   + m.stats.attack,
        defense:  a.defense  + m.stats.defense,
        critRate: a.critRate + m.stats.critRate,
      }),
      { attack: 0, defense: 0, critRate: 0 },
    );

    const rawCrit = Math.max(0, Math.min(45, Math.floor(Math.max(total.critRate / 3, 0.5) * qMult * 10) / 10));
    const stats: Item['stats'] = {
      attack:   Math.max(0, Math.min(90, Math.floor(Math.max(total.attack   / 3, 2) * qMult))),
      defense:  Math.max(0, Math.min(72, Math.floor(Math.max(total.defense  / 3, 1) * qMult))),
      critRate: assertCritRate(rawCrit), // ★ 品牌类型，强制范围+1位小数
    };

    // ---- 步骤 3: 特效 (优先继承材料的，否则按 EFF_CHANCE 随机) ----
    const inherited = arr
      .filter((m) => m.effect)
      .map((m) => m.effect!);
    const hasEffect = inherited.length > 0 || Math.random() < effProb;
    const effect = hasEffect
      ? (inherited.length > 0
          ? inherited[Math.floor(Math.random() * inherited.length)]
          : EFFECTS[Math.floor(Math.random() * EFFECTS.length)])
      : null;

    // ---- 步骤 4: 命名 ----
    const pool = NAME_POOLS[type];
    const name = `[合成] ${pool[Math.floor(Math.random() * pool.length)]}${Q_SUFFIX[newQuality]}`;

    const result: Item = {
      id: `it_craft_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name,
      type,
      quality: newQuality,
      stats,
      effect,
      upgraded,
    };

    return { success: true, result };
  }

  /** 异步包装，便于对接后端 / 播放合成动画时的等待 */
  static async craftAsync(
    materials: (Item | undefined | null)[],
  ): Promise<{ success: boolean; result?: Item; error?: string }> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(this.craft(materials)), 0);
    });
  }
}
