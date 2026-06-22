/**
 * ================================================================
 *  MonsterTemplate.ts  ——  怪物模板生成器
 * ================================================================
 *
 * 【职责】
 *  输入: 关卡 level + 难度 difficulty + 可选怪物数量 count
 *  输出: 随机 Monster[]（每只怪物含属性、技能列表、冷却）
 *  怪物属性按 SCALE[difficulty] × (1 + 0.15 × level) 线性缩放。
 *
 * 【文件间调用关系】
 *
 *  ┌────────────────────────────────────────────────────────────┐
 *  │  MainSimulator.enterBattle()                               │
 *  │    1) difficulty, level = 从 this.state 读取              │
 *  │    2) ItemGenerator.generate()  → Item[] (战利品)          │
 *  │    3) MonsterTemplate.generate(level, difficulty)          │
 *  │               → Monster[] (待战斗对手)                     │
 *  └───────────────────────┬────────────────────────────────────┘
 *                          │
 *                          ▼
 *  ┌────────────────────────────────────────────────────────────┐
 *  │  MonsterTemplate.generate()                                │
 *  │    ├─ SCALE[diff] × (1 + 0.15 × level) = 总缩放系数        │
 *  │    ├─ 每只怪物:                                            │
 *  │    │   ├─ 从 MONSTER_NAMES 随机挑名字+类型                 │
 *  │    │   ├─ 属性: maxHp/atk/def/critRate × 缩放系数          │
 *  │    │   └─ 从 SKILL_POOL 随机取 2 个技能                    │
 *  │    └─ return Monster[]                                     │
 *  └───────────────────────┬────────────────────────────────────┘
 *                          │
 *                          ▼
 *          MainSimulator.state.monsters (原始模板)
 *                          │
 *                          ▼
 *  ┌────────────────────────────────────────────────────────────┐
 *  │  CombatEngine.simulate(...)                                │
 *  │    └─ computeMonsters()                                   │
 *  │         └─ MonsterTemplate.cloneForBattle(ms)             │
 *  │              → 深拷贝 + id 变 battle 后缀                 │
 *  │              → HP 重置 maxHp、技能CD重置为0               │
 *  │              → 保证战斗失败时原始模板不变                 │
 *  └────────────────────────────────────────────────────────────┘
 *
 * ================================================================
 */

import type { Monster, MonsterSkill, Difficulty } from '../types';

/** 怪物命名池 - 中文名 + 英文类型标签（UI 展示） */
const MONSTER_NAMES: { name: string; type: string }[] = [
  { name: '赛博幽灵',     type: 'specter' },
  { name: '突变生化体',   type: 'mutant'  },
  { name: '量子机械兽',   type: 'mech'     },
  { name: '虚空掠夺者',   type: 'void'     },
  { name: '纳米虫群',     type: 'swarm'    },
  { name: '数据食腐者',   type: 'hacker'   },
  { name: '星界猎手',     type: 'hunter'   },
];

/**
 * 技能池
 *   mult = 0   → 非伤害型技能（heal / enrage）
 *   mult ≥ 1   → 伤害倍率
 *   cd   ≥ 1   → 冷却回合数
 */
const SKILL_POOL: Omit<MonsterSkill, 'currentCd'>[] = [
  { id: 'heavy_strike', name: '重击',       desc: '造成150%攻击伤害',         cd: 3, mult: 1.5 },
  { id: 'poison',       name: '毒雾',       desc: '附加2回合持续伤害',         cd: 4, mult: 1.2 },
  { id: 'stun',         name: '电磁脉冲',   desc: '50%概率眩晕目标1回合',     cd: 5, mult: 1.0 },
  { id: 'heal',         name: '自我修复',   desc: '回复25%最大生命',           cd: 4, mult: 0   },
  { id: 'pierce',       name: '穿透',       desc: '无视50%防御 + 15%增伤',    cd: 3, mult: 1.3 },
  { id: 'enrage',       name: '狂怒',       desc: '2回合内攻击+40%',          cd: 5, mult: 1   },
];

/**
 * 难度缩放系数
 *   简单 0.8  / 普通 1.0  / 困难 1.4
 *  关卡附加: (1 + level × 0.15) （线性成长）
 */
export const SCALE: Record<Difficulty, number> = {
  easy: 0.8, normal: 1.0, hard: 1.4,
};

/** 每只怪物的基础属性区间（缩放前） */
const BASE_RANGE = {
  maxHp:   [80,  120],
  attack:  [8,   14],
  defense: [3,   7],
  critRate:[0,   8],   // 百分比，保留 1 位小数
} as const;

/** 每关怪物数量区间 (可被 count 参数覆盖) */
export const COUNT_RANGE: [number, number] = [1, 2];

/* -------------------- 工具函数 -------------------- */

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/* -------------------- 主类 -------------------- */

export class MonsterTemplate {
  /**
   * 生成怪物模板列表
   * @param level      关卡号（≥ 1）
   * @param difficulty 难度
   * @param count      数量，不传则从 COUNT_RANGE 内随机
   */
  static generate(
    level: number = 1,
    difficulty: Difficulty = 'normal',
    count?: number,
  ): Monster[] {
    const s = SCALE[difficulty] * (1 + Math.max(0, level - 1) * 0.15);
    const n = typeof count === 'number'
      ? Math.max(1, count)
      : randInt(COUNT_RANGE[0], COUNT_RANGE[1]);

    const monsters: Monster[] = [];
    for (let i = 0; i < n; i++) {
      const base = MONSTER_NAMES[Math.floor(Math.random() * MONSTER_NAMES.length)];
      const chosen = [...SKILL_POOL]
        .sort(() => Math.random() - 0.5)
        .slice(0, 2);

      const maxHp   = Math.floor(randInt(BASE_RANGE.maxHp[0],   BASE_RANGE.maxHp[1])   * s);
      const attack  = Math.floor(randInt(BASE_RANGE.attack[0],  BASE_RANGE.attack[1])  * s);
      const defense = Math.floor(randInt(BASE_RANGE.defense[0], BASE_RANGE.defense[1]) * s);
      const critRate = Math.floor(randInt(
        Math.floor(BASE_RANGE.critRate[0] * 10),
        Math.floor(BASE_RANGE.critRate[1] * 10),
      ) * s) / 10;

      const m: Monster = {
        id: `mon_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
        name: base.name + (n > 1 ? ` ${i + 1}` : ''),
        type: base.type,
        stats: { maxHp, hp: maxHp, attack, defense, critRate },
        skills: chosen.map((sk) => ({ ...sk, currentCd: 0 })),
      };
      monsters.push(m);
    }
    return monsters;
  }

  /**
   * 克隆模板供 CombatEngine 使用
   *   - id 后缀保证每次战斗互不干扰
   *   - HP 重置为 maxHp（避免上一场的损伤影响）
   *   - 技能 CD 重置为 0
   */
  static cloneForBattle(ms: Monster[]): Monster[] {
    return ms.map((m) => ({
      ...m,
      id: m.id + '_battle_' + Math.random().toString(36).slice(2, 6),
      stats: { ...m.stats, hp: m.stats.maxHp },
      skills: m.skills.map((s) => ({ ...s, currentCd: 0 })),
    }));
  }
}
