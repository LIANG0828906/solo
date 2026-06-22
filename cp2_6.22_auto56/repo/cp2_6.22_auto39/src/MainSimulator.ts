/**
 * ================================================================
 *  MainSimulator.ts  ——  全局主调度器 / 状态管理
 * ================================================================
 *
 * 【职责】
 *  整个 Roguelike 模拟器的"大脑"：
 *    - 持有唯一全局 GameState（单例 this.state）
 *    - 对外提供：setDifficulty / resetLevel / enterBattle / runCombat
 *               / equipItem / unequipItem / craft 等操作
 *    - 通过发布-订阅 (subscribe/emit) 通知 App.tsx 刷新 UI
 *    - 串联 procedural / combat 两个子模块
 *
 * 【文件间调用关系 & 数据流向】
 *
 *                    ┌─────────────────────────┐
 *                    │     App.tsx (UI层)      │
 *                    │  subscribe(setState)   │
 *                    └─────────┬───────────────┘
 *                              │ 调用操作 API
 *                              ▼
 *  ┌─────────────────────────────────────────────────────────────────────┐
 *  │                     MainSimulator (本文件)                          │
 *  │                                                                     │
 *  │   GameState {                                                      │
 *  │     difficulty    → 影响 ItemGenerator + MonsterTemplate          │
 *  │     level         → 随胜利递增，影响怪物缩放系数                    │
 *  │     playerBase    → 初始玩家属性（不含装备）                        │
 *  │     inventory[Item]                                              │
 *  │     equipped{ weapon? armor? accessory? }                        │
 *  │     battleRewards[Item] → 战斗胜利 → push inventory              │
 *  │     monsters[Monster]  → CombatEngine 的输入                      │
 *  │     lastCombat: CombatResult | undefined                          │
 *  │     combatPlaying: boolean                                         │
 *  │   }                                                                 │
 *  │                                                                     │
 *  │  主要方法 ─── 调用目标模块                                        │
 *  │   ├─ setDifficulty(d) → this.resetLevel()                        │
 *  │   ├─ resetLevel()     → 清空所有状态                               │
 *  │   ├─ enterBattle() ───┬─▶ ItemGenerator.generate(diff) → Item[]  │
 *  │   │                   └─▶ MonsterTemplate.generate(lv,diff)       │
 *  │   │                               → Monster[]                     │
 *  │   │                                                                 │
 *  │   ├─ runCombat()  ────▶ CombatEngine.simulate(                    │
 *  │   │                     playerBase, equippedItems[], monsters[])  │
 *  │   │                   → CombatResult                              │
 *  │   │                   → victory? battleRewards → inventory        │
 *  │   │                              level++                           │
 *  │   │                                                                 │
 *  │   ├─ equipItem(item) → 从 inventory 移到 equipped[slot]           │
 *  │   ├─ unequipItem(type) → 反向                                    │
 *  │   │                                                                 │
 *  │   └─ craft(slots[3]) ─▶ CraftRecipe.craft(Item[3])                │
 *  │                          → 移除 3 件材料 + push 合成结果到 inventory│
 *  │                                                                     │
 *  │  state 变更后 ──▶ this.emit() ──▶ 通知所有订阅者（App.tsx）        │
 *  └─────────────────────────────────────────────────────────────────────┘
 *
 * ================================================================
 */

import type { Item, Monster, PlayerStats, CombatResult, Difficulty } from './types';
import { ItemGenerator } from './procedural/ItemGenerator';
import { CraftRecipe } from './procedural/CraftRecipe';
import { MonsterTemplate } from './combat/MonsterTemplate';
import { CombatEngine } from './combat/CombatEngine';

/* -------------------- GameState -------------------- */

export interface GameState {
  /** 难度：简单/普通/困难 —— 切换立即重置关卡 */
  difficulty: Difficulty;
  /** 关卡号：初始 1，战斗胜利 +1 */
  level: number;
  /** 累计进入关卡次数（战斗尝试次数） */
  totalRuns: number;
  /** 玩家基础属性（不含装备加成） */
  playerBase: PlayerStats;
  /** 玩家总属性（基础 + 装备）—— UI 直接展示 */
  playerStats: PlayerStats & { dodgeRate: number };
  /** 背包：所有战斗/合成获得的道具 */
  inventory: Item[];
  /** 装备槽：武器/防具/饰品，空槽为 undefined */
  equipped: { weapon?: Item; armor?: Item; accessory?: Item };
  /** 战利品预览：战斗胜利才自动进背包 */
  battleRewards: Item[];
  /** 本关怪物模板 */
  monsters: Monster[];
  /** 最近一次战斗结果 */
  lastCombat?: CombatResult;
  /** 战斗日志 —— 来自 lastCombat.logs 的平铺视图 */
  combatLog: CombatResult['logs'];
  /** 战斗中标记：动画期间禁止再次点击 */
  combatPlaying: boolean;
  /** 同 inBattle，App.tsx 常用别名 */
  inBattle: boolean;
}

/** 订阅者回调 —— state 变更后立即执行 */
export type Listener = (state: GameState) => void;

/* -------------------- 常量 -------------------- */

/** 初始玩家基础属性（可调参） */
const BASE_PLAYER: PlayerStats = {
  maxHp:    200,
  hp:       200,
  attack:   20,
  defense:  10,
  critRate: 5,
};

/** 玩家闪避率 —— 基于饰品/防具特效，默认 5%，每级品质 +2% */
const BASE_DODGE_RATE = 5;

/* -------------------- 主类 -------------------- */

export class MainSimulator {
  private state: GameState;
  private listeners: Set<Listener> = new Set();
  private combatEngine: CombatEngine = new CombatEngine();

  constructor() {
    this.state = {
      difficulty:    'normal',
      level:         1,
      totalRuns:     0,
      playerBase:    { ...BASE_PLAYER },
      playerStats:   this.computePlayerStats({ ...BASE_PLAYER }, {}),
      inventory:     [],
      equipped:      {},
      battleRewards: [],
      monsters:      [],
      combatLog:     [],
      combatPlaying: false,
      inBattle:      false,
    };
  }

  /**
   * 计算玩家总属性：基础 + 装备
   */
  private computePlayerStats(
    base: PlayerStats,
    equipped: GameState['equipped'],
  ): GameState['playerStats'] {
    const items = [equipped.weapon, equipped.armor, equipped.accessory].filter(Boolean) as Item[];
    let atk = base.attack;
    let def = base.defense;
    let crt = base.critRate;
    let dodge = BASE_DODGE_RATE;
    for (const it of items) {
      atk += it.stats.attack;
      def += it.stats.defense;
      crt += it.stats.critRate;
      if (it.effect?.id === 'dodge') dodge += 8;
      // 品质额外加成
      const qBonus: Record<string, number> = { gold: 6, purple: 4, blue: 2, white: 0 };
      dodge += qBonus[it.quality] || 0;
    }
    return {
      maxHp:    base.maxHp,
      hp:       base.hp,
      attack:   Math.floor(atk),
      defense:  Math.floor(def),
      critRate: Math.floor(crt * 10) / 10,
      dodgeRate: Math.max(0, Math.min(60, Math.floor(dodge))),
    };
  }

  /* ============== 状态读取 ============== */

  /** 返回浅拷贝 —— 防止外部直接修改内部 state */
  getState(): GameState {
    // 每次读取时重算 playerStats（确保装备变动后即时生效）
    this.state.playerStats = this.computePlayerStats(this.state.playerBase, this.state.equipped);
    this.state.inBattle    = this.state.combatPlaying;
    return {
      ...this.state,
      inventory:     [...this.state.inventory],
      battleRewards: [...this.state.battleRewards],
      monsters:      this.state.monsters.map((m) => ({
        ...m,
        stats:  { ...m.stats },
        skills: m.skills.map((s) => ({ ...s })),
      })),
      equipped:      { ...this.state.equipped },
      playerBase:    { ...this.state.playerBase },
      playerStats:   { ...this.state.playerStats },
      combatLog:     [...this.state.combatLog],
    };
  }

  /**
   * 从战利品拾取某件道具到背包
   * @returns ok: 是否成功；error: 失败原因
   */
  pickupReward(itemId: string): { ok: boolean; error?: string } {
    const idx = this.state.battleRewards.findIndex((r) => r.id === itemId);
    if (idx < 0) return { ok: false, error: '战利品不存在' };
    const [it] = this.state.battleRewards.splice(idx, 1);
    this.state.inventory.push(it);
    this.emit();
    return { ok: true };
  }

  /* ============== 订阅 ============== */

  /**
   * 订阅状态变化
   * @returns 取消订阅的解绑函数
   */
  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    // 首次订阅立即推送一次，便于 App 初始化
    fn(this.getState());
    return () => this.listeners.delete(fn);
  }

  /** 向所有订阅者广播当前最新快照 */
  private emit(): void {
    const snap = this.getState();
    this.listeners.forEach((l) => l(snap));
  }

  /* ============== 难度 & 重置 ============== */

  /**
   * 切换难度 —— 按照需求"重置当前关卡"，把新难度写入 state 持久化
   */
  setDifficulty(d: Difficulty): void {
    // ⭐ 先把难度写入 state，再调用 resetLevel（resetLevel 内部会保留该值）
    this.state.difficulty = d;
    this.resetLevel();
  }

  /**
   * ⭐ 重置所有状态：等级/HP/背包/装备/战斗记录
   * @param newDifficulty 可选 - 若传入，同时将难度重置为该值（等价于 setDifficulty）
   */
  resetLevel(newDifficulty?: Difficulty): void {
    if (newDifficulty) this.state.difficulty = newDifficulty;
    this.state.level         = 1;
    this.state.totalRuns     = 0;
    this.state.playerBase    = { ...BASE_PLAYER };
    this.state.inventory     = [];
    this.state.equipped      = {};
    this.state.battleRewards = [];
    this.state.monsters      = [];
    this.state.lastCombat    = undefined;
    this.state.combatLog     = [];
    this.state.combatPlaying = false;
    this.state.inBattle      = false;
    // this.state.difficulty —— 不重置，保留用户选择的难度值
    this.emit();
  }

  /* ============== 战斗流程 ============== */

  /**
   * 步骤 1：进入关卡
   *   - totalRuns +1（累计战斗尝试次数）
   *   - 生成 3~5 件战利品（预览用）
   *   - 生成 1~2 只怪物
   * @returns 战利品预览列表
   */
  enterBattle(): Item[] {
    this.state.totalRuns    += 1;   // ⭐ 累计战斗次数 UI 展示用
    this.state.battleRewards = ItemGenerator.generate(
      3 + Math.floor(Math.random() * 3),
      this.state.difficulty,
    );
    this.state.monsters = MonsterTemplate.generate(
      this.state.level,
      this.state.difficulty,
    );
    this.state.lastCombat    = undefined;
    this.state.combatLog     = [];
    this.state.combatPlaying = true;
    this.state.inBattle      = true;
    this.emit();
    return this.state.battleRewards;
  }

  /**
   * 步骤 2：执行战斗结算
   *   - 收集装备栏三件 → 传入 CombatEngine
   *   - 战斗胜利: level++ + 战利品入库
   *   - 战斗失败: 仅更新玩家 HP (保留损耗)
   * @returns CombatResult 或 null（无怪物时）
   */
  runCombat(): CombatResult | null {
    const equipped: Item[] = [
      this.state.equipped.weapon,
      this.state.equipped.armor,
      this.state.equipped.accessory,
    ].filter(Boolean) as Item[];

    if (this.state.monsters.length === 0) return null;

    const result = this.combatEngine.simulate(
      this.state.playerBase,
      equipped,
      this.state.monsters,
    );

    this.state.lastCombat    = result;
    this.state.combatLog     = [...result.logs]; // ⭐ 日志保存到 state
    this.state.playerBase.hp = result.playerHp;
    this.state.combatPlaying = false;
    this.state.inBattle      = false;

    if (result.victory) {
      this.state.inventory.push(...this.state.battleRewards);
      this.state.battleRewards = [];
      this.state.level++;
    }

    this.emit();
    return result;
  }

  /* ============== 装备管理 ============== */

  /**
   * 装备某道具 → 若该槽位已有装备则退回背包
   * @returns { ok, error? } —— 统一格式，便于 App.tsx 做反馈
   */
  equipItem(item: Item): { ok: boolean; error?: string } {
    if (!item || !item.id || !item.type) {
      return { ok: false, error: '道具数据无效' };
    }
    if (this.state.combatPlaying) {
      return { ok: false, error: '战斗中无法更换装备' };
    }
    const slot = item.type;

    // 1) 从背包中移除（若道具不在背包但在槽位中则允许移动）
    const inBagIdx = this.state.inventory.findIndex((i) => i.id === item.id);
    if (inBagIdx >= 0) this.state.inventory.splice(inBagIdx, 1);

    // 2) 从其他槽位移入（用户可能想换手）
    (['weapon', 'armor', 'accessory'] as const).forEach((k) => {
      if (k !== slot && this.state.equipped[k]?.id === item.id) {
        delete this.state.equipped[k];
      }
    });

    // 3) 旧装备退包
    const old = this.state.equipped[slot];
    if (old && old.id !== item.id) this.state.inventory.push(old);

    // 4) 写入槽位
    this.state.equipped[slot] = item;
    this.emit();
    return { ok: true };
  }

  /**
   * 卸下某槽位 → 回退至背包
   * @returns { ok, error? } —— 统一格式
   */
  unequipItem(type: 'weapon' | 'armor' | 'accessory'): { ok: boolean; error?: string } {
    if (this.state.combatPlaying) {
      return { ok: false, error: '战斗中无法卸下装备' };
    }
    const it = this.state.equipped[type];
    if (!it) {
      return { ok: false, error: '该槽位无装备' };
    }
    this.state.inventory.push(it);
    delete this.state.equipped[type];
    this.emit();
    return { ok: true };
  }

  /** 工具：快速获取已装备列表 */
  getEquippedItems(): Item[] {
    return [this.state.equipped.weapon, this.state.equipped.armor, this.state.equipped.accessory]
      .filter(Boolean) as Item[];
  }

  /* ============== 合成 ============== */

  /**
   * 合成接口
   * @param materials 3 个槽位的道具（允许 undefined/null 占位）
   */
  craft(
    materials: (Item | undefined | null)[],
  ): {
    success: boolean;
    result?: Item;
    error?: string;
    consumedIds?: string[];
  } {
    const r = CraftRecipe.craft(materials);
    if (!r.success || !r.result) {
      return { success: false, error: r.error };
    }

    const consumedIds = (materials.filter(Boolean) as Item[]).map((m) => m.id);
    // 从背包 / 装备中移除 3 件材料
    for (const id of consumedIds) {
      this.state.inventory = this.state.inventory.filter((i) => i.id !== id);
      (['weapon', 'armor', 'accessory'] as const).forEach((k) => {
        if (this.state.equipped[k]?.id === id) delete this.state.equipped[k];
      });
    }

    this.state.inventory.push(r.result);
    this.emit();
    return { success: true, result: r.result, consumedIds };
  }
}

/* -------------------- 全局单例 -------------------- */

export const simulator = new MainSimulator();
