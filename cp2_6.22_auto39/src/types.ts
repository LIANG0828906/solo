/**
 * ================================================================
 *  types.ts  ——  Roguelike 模拟器 全局类型定义
 * ================================================================
 *
 * 【职责】
 *  统一声明 Item / Monster / Player / Combat 四大模块的 TypeScript 类型。
 *  作为整个应用的"契约层"，所有模块都从此文件 import 类型，保证跨
 *  模块调用时属性名与取值范围的严格一致。
 *
 * 【文件间调用关系】
 *
 *              ┌──────────────────┐
 *              │   ItemGenerator  │───产出──▶ Item[] ─┐
 *              └──────────────────┘                    │
 *                                                      ▼
 *  types.ts ◀── Item / ItemEffect / ItemType         MainSimulator ◀── GameState / Listener
 *  (本文件)    ItemQuality / Difficulty                ▲  │
 *              Monster / MonsterSkill                  │  │
 *              PlayerStats                             │  │调用
 *              CombatLogEntry / CombatResult           │  ▼
 *              MonsterTemplate ──产出──▶ Monster[] ──▶│  CombatEngine
 *                                                      │  ▲
 *              CraftRecipe ──产出──▶ Item(合成结果) ──┘  │
 *                                                         │
 *              App.tsx ──渲染──▶ 读取 GameState,           │
 *                         调用 MainSimulator 操作接口 ────┘
 *
 * 【数据流说明】
 *  1) 战斗入口: 用户点击"进入关卡"
 *     ├─ MainSimulator.enterBattle()
 *     ├─ ─▶ ItemGenerator.generate() → Item[] (战利品)
 *     └─ ─▶ MonsterTemplate.generate() → Monster[]
 *
 *  2) 战斗结算: MainSimulator.runCombat()
 *     └─ ▶ CombatEngine.simulate(PlayerStats, Item[], Monster[])
 *           ├─ 逐回合: 玩家/怪物同时攻击 (伤害/暴击/闪避/特效)
 *           └─ 返回 CombatResult (含按回合分组的 CombatLogEntry[])
 *
 *  3) 合成入口: 用户打开合成工坊 → 拖拽 3 件 Item → MainSimulator.craft()
 *     └─ ▶ CraftRecipe.craft(Item[3]) → Item (新道具) 或 错误信息
 *
 * ================================================================
 */

export type ItemQuality = 'white' | 'blue' | 'purple' | 'gold';
export type ItemType    = 'weapon' | 'armor'  | 'accessory';
export type Difficulty  = 'easy'   | 'normal' | 'hard';

/* ================================================================
 *  ★ 数值约束品牌类型 (Branded Types) + 运行时校验
 * ================================================================
 *  TypeScript 无法直接限定 number 的取值范围，这里使用
 *  "品牌类型 + 类型守卫/断言" 组合，强制所有 critRate 必须
 *  通过 assertCritRate() 才能赋值，从类型层 + 运行时双层约束。
 * ================================================================ */

/**
 * CritRate —— 暴击率品牌类型
 * 取值范围: 0.0 ≤ x ≤ 45.0，步长 0.1 (保留 1 位小数)
 * ⚠️ 不可直接字面量赋值，必须通过 assertCritRate() 构造
 */
export type CritRate = number & {
  readonly __brand: unique symbol;
  readonly __min:   0;
  readonly __max:   45;
  readonly __step:  0.1;
};

/** critRate 允许的上下界与步长常量（运行时也用） */
export const CRIT_RATE = {
  MIN:  0,
  MAX:  45,
  STEP: 0.1,
} as const;

/**
 * 类型守卫：运行时检查值是否落在 [0, 45] 且为 0.1 整数倍
 */
export function isCritRate(v: unknown): v is CritRate {
  if (typeof v !== 'number' || Number.isNaN(v) || !Number.isFinite(v)) return false;
  if (v < CRIT_RATE.MIN || v > CRIT_RATE.MAX) return false;
  // 保留 1 位小数后与原值相等（避免 0.1 + 0.2 = 0.30000000000000004 的情况）
  const rounded = Math.round(v * 10) / 10;
  return Math.abs(rounded - v) < 1e-8;
}

/**
 * 断言函数：将任意 number 夹紧并归一化为 CritRate
 *   - 越界 → 夹到 [0,45]
 *   - 多余小数 → 四舍五入保留 1 位
 * 这是构造 CritRate 实例的**唯一合法入口**
 */
export function assertCritRate(v: number): CritRate {
  let n = v;
  if (n < CRIT_RATE.MIN) n = CRIT_RATE.MIN;
  if (n > CRIT_RATE.MAX) n = CRIT_RATE.MAX;
  n = Math.round(n * 10) / 10;
  return n as CritRate;
}

/**
 * ItemEffect —— 道具随机特效
 * id:    全局唯一英文标识，供 CombatEngine 按 id 匹配逻辑
 * name:  UI 展示中文名
 * desc:  UI 展示详细描述
 * 取值约束：id ∈ {lifesteal, combo, shield, dodge, crit, thorns, rage, regen}
 */
export interface ItemEffect {
  id:   'lifesteal' | 'combo' | 'shield' | 'dodge' | 'crit' | 'thorns' | 'rage' | 'regen' | string;
  name: string;
  desc: string;
}

/**
 * ItemStats —— 道具基础属性，数值范围严格约束如下
 *   attack:   integer, 0~90    (武器为 10~30 × 品质倍率，其余类型通常为 0)
 *   defense:  integer, 0~72    (防具为 8~24 × 品质倍率，其余类型通常为 0)
 *   critRate: CritRate, 0~45   (品牌类型 + 运行时 assertCritRate 强制约束)
 */
export interface ItemStats {
  attack:   number;    // 0 ≤ attack ≤ 90,   整数
  defense:  number;    // 0 ≤ defense ≤ 72,  整数
  critRate: CritRate;  // ★ 通过 assertCritRate() 构造，保证 [0,45] + 1位小数
}

/**
 * Item —— 全局道具对象
 *  由 ItemGenerator.generate() 直接产出；
 *  经 CraftRecipe.craft() 可产出更高品质的合成 Item；
 *  最终由 MainSimulator 保存到 inventory / equipped / battleRewards。
 */
export interface Item {
  /** v4 风格唯一 id，格式: it_[ms]_[idx]_[rand6] */
  id: string;

  /** UI 显示名称，品质用特殊符号后缀区分 (★/◆/●) */
  name: string;

  /** 道具大类，严格决定装备槽位与合成配方匹配 */
  type: ItemType;

  /** 品质，决定基础倍率、特效概率、UI 配色 */
  quality: ItemQuality;

  /** 数值属性，见 ItemStats 约束 */
  stats: ItemStats;

  /** 随机特效，可能为 null（低品质概率） */
  effect: ItemEffect | null;

  /** 合成产物特有：是否比最高材料品质提升了一阶 */
  upgraded?: boolean;
}

/**
 * MonsterSkill —— 怪物技能
 * cd:        冷却回合数  (≥ 1)
 * currentCd: 当前剩余冷却 (0 表示可释放)
 * mult:      伤害倍率 (0 表示非攻击类技能，如治疗/狂怒)
 */
export interface MonsterSkill {
  id:        string;
  name:      string;
  desc:      string;
  cd:        number;   // 整数, ≥ 1
  mult:      number;   // 0, 1.0, 1.2, 1.3, 1.5
  currentCd: number;   // 整数, 0 表示就绪
}

/**
 * Monster —— 怪物模板
 *  由 MonsterTemplate.generate() 产出；
 *  CombatEngine.simulate() 会 clone 一份 battle instance 进行战斗，
 *  不影响原始模板（支持战斗失败后再次挑战）。
 */
export interface Monster {
  id:    string;
  name:  string;
  type:  string;
  stats: {
    maxHp:    number;   // ≥ 60，整数
    hp:       number;   // 0 ≤ hp ≤ maxHp
    attack:   number;   // ≥ 5，整数
    defense:  number;   // ≥ 1，整数
    critRate: number;   // 0~12，保留 1 位小数
  };
  skills: MonsterSkill[];  // 0~2 个技能
}

/**
 * PlayerStats —— 玩家基础属性（不含装备加成）
 * 装备加成在 MainSimulator.playerTotal / CombatEngine.computePlayer 中叠加。
 */
export interface PlayerStats {
  maxHp:    number;   // 默认 200, 整数
  hp:       number;   // 0 ≤ hp ≤ maxHp
  attack:   number;   // 默认 20, 整数
  defense:  number;   // 默认 10, 整数
  critRate: number;   // 默认 5%, 保留 1 位小数
}

/**
 * 高亮片段 —— UI 层按此结构直接应用样式
 * 不需要再从文本中正则提取，语义明确、性能更好
 */
export interface HighlightSpan {
  /** 要高亮显示的原始内容（通常是数字字符串） */
  text: string;
  /** 高亮颜色: 默认 #f0f (洋红)，暴击/治疗可区分 */
  color?: 'magenta' | 'gold' | 'cyan' | 'green' | 'red';
  /** 要应用的语义 class: damage/crit/heal/effect */
  semantic?: 'damage' | 'crit' | 'heal' | 'effect' | 'dodge';
}

/**
 * CombatLogEntry —— 战斗日志单条
 * 由 CombatEngine.pushLog() 写入，按 round 字段分组后传入 App.tsx 渲染。
 * ⭐ highlights 字段 —— UI 层直接遍历该数组应用洋红高亮，
 * 不需要再从 action 文本中正则提取，避免数字误判（如年份/CD回合等）。
 */
export interface CombatLogEntry {
  round:              number;         // 回合号，0 = 战斗开始
  timestamp:          string;         // HH:MM:SS，由 CombatEngine 内部生成
  actor:              string;         // '玩家' | 怪物名 | '系统'
  action:             string;         // 人类可读动作描述（纯文本）
  /** ⭐ 需要高亮的片段列表 —— App.tsx 无需再解析 */
  highlights?:        HighlightSpan[];
  /** 本次造成的伤害（可选，向后兼容） */
  damage?:            number;
  isCrit?:            boolean;        // 是否暴击
  isDodge?:           boolean;        // 是否闪避
  effectTriggered?:   string;         // 触发的特效中文名（如 "吸血"/"连击"）
}

/**
 * CombatResult —— CombatEngine.simulate() 的完整返回值
 */
export interface CombatResult {
  victory:           boolean;           // 玩家胜 = true
  rounds:            number;            // 实际战斗回合数（≤ 10）
  logs:              CombatLogEntry[];  // 完整日志，按时间升序
  playerHp:          number;            // 玩家战后剩余 HP
  monstersRemaining: number;            // 战后仍存活的怪物数量
}
