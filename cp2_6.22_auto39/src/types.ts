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
 *   critRate: number,  0~45%   (保留 1 位小数，饰品/武器附加)
 */
export interface ItemStats {
  attack:   number;   // 0 ≤ attack ≤ 90,   整数
  defense:  number;   // 0 ≤ defense ≤ 72,  整数
  critRate: number;   // 0 ≤ critRate ≤ 45, 保留 1 位小数
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
 * CombatLogEntry —— 战斗日志单条
 * 由 CombatEngine.log() 写入，按 round 字段分组后传入 App.tsx 渲染。
 * 所有数值字段（damage 等）在 UI 上以洋红 #f0f 高亮显示。
 */
export interface CombatLogEntry {
  round:           number;    // 回合号，0 = 战斗开始
  timestamp:       string;    // HH:MM:SS，由 CombatEngine 内部生成
  actor:           string;    // '玩家' | 怪物名 | '系统'
  action:          string;    // 人类可读动作描述，含数字占位
  damage?:         number;    // 本次造成的伤害（可选）
  isCrit?:         boolean;   // 是否暴击
  isDodge?:        boolean;   // 是否闪避
  effectTriggered?: string;   // 触发的特效中文名（如 "吸血"/"连击"）
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
