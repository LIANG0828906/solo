/**
 * ================================================================
 *  CombatEngine.ts  ——  回合制战斗引擎
 * ================================================================
 *
 * 【职责】
 *  接收:
 *    - PlayerStats (玩家基础属性)
 *    - Item[]      (已装备的 3 件道具，提供数值加成 + 特效)
 *    - Monster[]   (当前关卡怪物模板)
 *  模拟:
 *    最多 10 回合的"双方同时出手"战斗，逐事件写入日志。
 *  输出:
 *    CombatResult { victory, rounds, logs[], playerHp, monstersRemaining }
 *
 * 【文件间调用关系】
 *
 *  ┌───────────────────────────────────────────────────────────┐
 *  │                     MainSimulator                         │
 *  │  runCombat() {                                            │
 *  │     collect equipped[3] ← from this.state.equipped       │
 *  │     CombatEngine.simulate(player, items, monsters)        │
 *  │  }                                                        │
 *  └──────────────────────┬────────────────────────────────────┘
 *                         │ args[3]
 *                         ▼
 *  ┌───────────────────────────────────────────────────────────┐
 *  │                  CombatEngine.simulate()                  │
 *  │                                                           │
 *  │  for round = 1..10:                                       │
 *  │    ┌────────────────────────────────────────────────┐    │
 *  │    │  ① 回合开始结算                                  │    │
 *  │    │    玩家: 再生 / 中毒DOT / 眩晕-1 / 狂暴提示      │    │
 *  │    │    怪物: 中毒DOT / 所有技能CD--                 │    │
 *  │    ├────────────────────────────────────────────────┤    │
 *  │    │  ② ★ 双方同时攻击 ★                             │    │
 *  │    │    先计算出本回合所有伤害（双方HP快照）          │    │
 *  │    │    然后统一 apply HP 变更 → 保证"同时"语义      │    │
 *  │    │    玩家攻击: 伤害/暴击/连击/吸血/狂暴加成        │    │
 *  │    │    怪物攻击: 技能(CD=0 概率触发)/闪避/护盾/反伤 │    │
 *  │    ├────────────────────────────────────────────────┤    │
 *  │    │  ③ 胜负判定                                     │    │
 *  │    │    玩家HP≤0 → 败北 / 怪物全灭 → 胜利            │    │
 *  │    └────────────────────────────────────────────────┘    │
 *  └──────────────────────┬────────────────────────────────────┘
 *                         │
 *                         ▼
 *  CombatResult (App.tsx 按 round 字段分组后渲染右栏日志)
 *
 * 【日志格式约束】
 *   - 每条 CombatLogEntry 带有 round / timestamp(HH:MM:SS)
 *   - App.tsx 按 round 聚合成组，数字用 #f0f 洋红高亮
 *   - effectTriggered 用于右侧 🔗 特效标识
 * ================================================================
 */

import type {
  Monster, PlayerStats, CombatLogEntry, CombatResult, Item, MonsterSkill,
  HighlightSpan,
} from '../types';
import { MonsterTemplate } from './MonsterTemplate';

/* -------------------- 日志高亮自动提取 -------------------- */

/**
 * 从一条 action 文本中自动提取数字片段 → HighlightSpan[]
 * 同时根据上下文（关键字）推断颜色与语义 class：
 *   - 含"暴击" → gold + crit
 *   - 含"闪避" → cyan + dodge
 *   - 含"恢复"/"回复"/"治疗"/"吸血"/"再生" → green + heal
 *   - 含"特效"/"激活"/"触发" → magenta + effect
 *   - 其余默认 magenta + damage（伤害数值）
 */
function autoHighlights(action: string, extra?: Partial<CombatLogEntry>): HighlightSpan[] {
  const spans: HighlightSpan[] = [];
  const re = /-?\d+(?:\.\d+)?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(action)) !== null) {
    const text = m[0];
    let color: HighlightSpan['color'] = 'magenta';
    let semantic: HighlightSpan['semantic'] = 'damage';

    if (extra?.isCrit)              { color = 'gold';    semantic = 'crit';   }
    else if (extra?.isDodge)        { color = 'cyan';    semantic = 'dodge';  }
    else if (extra?.effectTriggered){ color = 'magenta'; semantic = 'effect'; }
    else if (/恢复|回复|治疗|吸血|再生|HP/.test(action)) {
      color = 'green'; semantic = 'heal';
    }
    else if (/闪避|躲开|miss/i.test(action)) {
      color = 'cyan'; semantic = 'dodge';
    }
    else if (/暴击|致命一击|critical/i.test(action)) {
      color = 'gold'; semantic = 'crit';
    }

    spans.push({ text, color, semantic });
  }
  return spans;
}

/* -------------------- 常量 -------------------- */

/** 最大回合数 —— 超过按剩余 HP 判定 */
const MAX_ROUNDS = 10;

/** 连击触发概率 */
const COMBO_CHANCE  = 0.25;
/** 闪避触发概率 */
const DODGE_CHANCE  = 0.15;
/** 吸血比例 */
const LIFESTEAL_RATIO = 0.15;
/** 护盾首伤减免 */
const SHIELD_RATIO = 0.5;
/** 反伤比例 */
const THORNS_RATIO = 0.2;
/** 狂暴血量阈值 + 攻击加成 */
const RAGE_HP_RATIO = 0.3;
const RAGE_ATK_MULT = 1.3;
/** 再生每回合回血比例 */
const REGEN_RATIO   = 0.05;
/** 怪物技能释放概率 (CD=0 时) */
const MONSTER_SKILL_CHANCE = 0.4;

/* -------------------- 内部 runtime 类型 -------------------- */

interface PlayerRuntime extends PlayerStats {
  items: Item[];
  shieldUsed: boolean;
  enraged: boolean;
  stunTurns: number;
  regenHp: number;
  _rageApp?: boolean;
  _poisonTurns?: number;
  _poisonDmg?: number;
}

interface MonsterRuntime extends Monster {
  enragedTurns: number;
  poisonTurns: number;
  poisonDamage: number;
  stunTurns: number;
}

/** 用于"同时攻击"的伤害暂存 */
interface PendingDamage {
  targetMonsterId?: string;
  toMonster: number;       // 对怪物的总伤害
  monsterHeal: number;     // 怪物自身治疗 (enrage/heal 等)
  toPlayer: number;        // 对玩家的总伤害
  playerHeal: number;      // 玩家回血 (吸血/再生)
  logs: CombatLogEntry[];  // 已写入日志
  monsterStunTurns: number;
  playerStunTurns: number;
  playerPoisonTurns: number;
  playerPoisonDmg: number;
}

/* -------------------- 时间戳生成 -------------------- */

/**
 * 根据当前回合与顺序号生成 HH:MM:SS 风格时间戳
 * 保证同一回合内顺序号越大 → 秒数递增
 */
function timestamp(round: number, seq: number): string {
  const base = new Date();
  base.setSeconds(0, 0);
  base.setMinutes(base.getMinutes() - MAX_ROUNDS + round);
  const hh = String(base.getHours()).padStart(2, '0');
  const mm = String(base.getMinutes()).padStart(2, '0');
  const ss = String(Math.min(59, seq + 3)).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

/* -------------------- 主类 -------------------- */

export class CombatEngine {
  private logs: CombatLogEntry[] = [];
  private seq = 0;

  /**
   * ★ 内部日志写入：
   *   ① 自动分配时间戳 / 回合号 / 自增 seq
   *   ② 从 action 自动提取数字 → 写入 highlights 数组
   *   ③ UI 层无需再做正则，直接遍历 highlights 即可高亮
   */
  private pushLog(round: number, actor: string, action: string,
                  extra?: Partial<CombatLogEntry>): void {
    const merged: Partial<CombatLogEntry> = extra || {};
    this.logs.push({
      round,
      timestamp: timestamp(round, this.seq++),
      actor,
      action,
      // ★ UI 直接消费该字段，颜色/语义已推断好
      highlights: autoHighlights(action, merged),
      ...merged,
    });
  }

  /* ---------- 属性计算 ---------- */

  /**
   * 合并 base + 装备 → 玩家战斗时的实际属性
   * 同时初始化特效 runtime 标记
   */
  private computePlayer(base: PlayerStats, items: Item[]): PlayerRuntime {
    const effIds = items.filter((i) => i.effect).map((i) => i.effect!.id);
    return {
      maxHp:   base.maxHp,
      hp:      base.maxHp,
      attack:  base.attack  + items.reduce((s, i) => s + i.stats.attack,  0),
      defense: base.defense + items.reduce((s, i) => s + i.stats.defense, 0),
      critRate: +(base.critRate + items.reduce((s, i) => s + i.stats.critRate, 0)).toFixed(1),
      items,
      shieldUsed: false,
      enraged:    effIds.includes('rage'),
      stunTurns:  0,
      regenHp:    effIds.includes('regen') ? Math.floor(base.maxHp * REGEN_RATIO) : 0,
    };
  }

  /** clone 怪物模板 + 初始化 battle-only 字段 */
  private computeMonsters(ms: Monster[]): MonsterRuntime[] {
    return MonsterTemplate.cloneForBattle(ms).map((m) => ({
      ...m,
      enragedTurns: 0,
      poisonTurns:  0,
      poisonDamage: 0,
      stunTurns:    0,
    }));
  }

  /** 核心伤害公式：攻击×倍率 − 防御×0.6，±10% 浮动，暴击 2x (或 2.5x) */
  private calcDamage(
    atk: number, def: number, mult: number,
    crit: boolean, critBoost: boolean,
  ): number {
    const base   = Math.max(1, atk * mult - def * 0.6);
    const cMult  = crit ? (critBoost ? 2.5 : 2.0) : 1;
    const variance = 0.9 + Math.random() * 0.2;
    return Math.max(1, Math.floor(base * cMult * variance));
  }

  /* ---------- 主入口 ---------- */

  simulate(playerBase: PlayerStats, equippedItems: Item[], monsters: Monster[]): CombatResult {
    const perf0 = performance.now();
    this.logs = [];
    this.seq  = 0;

    // 特效 id 集合
    const effIds = equippedItems.filter((i) => i.effect).map((i) => i.effect!.id);
    const hasCombo    = effIds.includes('combo');
    const hasLifesteal = effIds.includes('lifesteal');
    const hasShield   = effIds.includes('shield');
    const hasDodge    = effIds.includes('dodge');
    const critBoost   = effIds.includes('crit');
    const hasThorns   = effIds.includes('thorns');

    const p:  PlayerRuntime  = this.computePlayer(playerBase, equippedItems);
    const ms: MonsterRuntime[] = this.computeMonsters(monsters);

    // 初始日志 (round=0 特殊分组)
    this.pushLog(0, '系统',
      `战斗开始！玩家 HP:${p.hp} 对手:${ms.map((m) => m.name).join(', ')}`);

    let rounds  = 0;
    let victory = false;

    /* =================================================================
     *  主循环 —— 逐回合
     * ================================================================= */
    for (let r = 1; r <= MAX_ROUNDS; r++) {
      rounds = r;

      /* ------------ ① 回合开始结算 (DOT/再生/CD--) ------------ */
      this.runRoundStartEffects(r, p, ms);
      if (p.hp <= 0) {
        this.pushLog(r, '系统', '玩家阵亡，战斗失败！');
        victory = false; break;
      }
      if (ms.every((m) => m.stats.hp <= 0)) {
        this.pushLog(r, '系统', '所有怪物已被击败，胜利！');
        victory = true; break;
      }

      /* ------------ ② 双方同时攻击 (先收集再 apply) ------------ */
      const pending: PendingDamage = {
        toMonster: 0, monsterHeal: 0, toPlayer: 0, playerHeal: 0,
        logs: [], monsterStunTurns: 0, playerStunTurns: 0,
        playerPoisonTurns: 0, playerPoisonDmg: 0,
      };

      this.collectPlayerTurn(r, p, ms,
        hasCombo, hasLifesteal, hasShield, critBoost, pending);

      for (const mon of ms) {
        if (mon.stats.hp <= 0) continue;
        this.collectMonsterTurn(r, mon, p,
          hasDodge, hasShield, hasThorns, pending);
      }

      // 集中 apply
      p.hp = Math.max(0, p.hp - pending.toPlayer + pending.playerHeal);
      if (pending.playerStunTurns > 0) p.stunTurns += pending.playerStunTurns;
      if (pending.playerPoisonTurns > 0) {
        p._poisonTurns = pending.playerPoisonTurns;
        p._poisonDmg   = pending.playerPoisonDmg;
      }

      for (const mon of ms) {
        if (pending.targetMonsterId && mon.id === pending.targetMonsterId) {
          mon.stats.hp = Math.max(0,
            Math.min(mon.stats.maxHp, mon.stats.hp - pending.toMonster + pending.monsterHeal));
        }
      }

      /* ------------ ③ 胜负判定 ------------ */
      if (p.hp <= 0) {
        this.pushLog(r, '系统', '玩家阵亡，战斗失败！');
        victory = false; break;
      }
      if (ms.every((m) => m.stats.hp <= 0)) {
        this.pushLog(r, '系统', '所有怪物已被击败，胜利！');
        victory = true; break;
      }
    }

    /* ------------ 回合耗尽 → 按剩余HP比较 ------------ */
    const anyAlive = ms.filter((m) => m.stats.hp > 0);
    if (!ms.every((m) => m.stats.hp <= 0) && p.hp > 0 && rounds >= MAX_ROUNDS) {
      const monsterHpTotal = anyAlive.reduce((s, m) => s + m.stats.hp, 0);
      this.pushLog(MAX_ROUNDS, '系统',
        `回合耗尽，按剩余HP判定：玩家${p.hp} 怪物合计${monsterHpTotal}`);
      victory = p.hp > monsterHpTotal;
    }

    /* ------------ 性能监控 ------------ */
    const elapsed = performance.now() - perf0;
    if (elapsed > 20) {
      // eslint-disable-next-line no-console
      console.warn(`[CombatEngine] 战斗模拟耗时 ${elapsed.toFixed(2)}ms (目标 ≤20ms)`);
    }

    return {
      victory: victory && p.hp > 0,
      rounds,
      logs: this.logs,
      playerHp: p.hp,
      monstersRemaining: ms.filter((m) => m.stats.hp > 0).length,
    };
  }

  /* ---------- 子步骤 ---------- */

  /** 回合开始: 玩家再生/中毒 + 怪物中毒/CD 冷却 */
  private runRoundStartEffects(r: number, p: PlayerRuntime, ms: MonsterRuntime[]) {
    // 玩家: 再生
    if (p.regenHp > 0 && p.hp > 0) {
      const heal = Math.min(p.regenHp, p.maxHp - p.hp);
      if (heal > 0) {
        p.hp += heal;
        this.pushLog(r, '玩家', `再生恢复 ${heal} HP`, { effectTriggered: '再生' });
      }
    }
    // 玩家: 中毒
    if ((p._poisonTurns ?? 0) > 0) {
      const dmg = p._poisonDmg ?? 0;
      p.hp = Math.max(0, p.hp - dmg);
      this.pushLog(r, '玩家', `中毒受到 ${dmg} 持续伤害`, { damage: dmg });
      p._poisonTurns!--;
    }
    // 玩家: 眩晕递减
    if (p.stunTurns > 0) {
      // 递减放在行动前判定时执行，这里仅日志
    }

    // 狂暴低血量提示
    if (p.enraged && !p._rageApp && p.hp < p.maxHp * RAGE_HP_RATIO) {
      this.pushLog(r, '玩家', `血量低于 30%，狂暴攻击+30% 激活！`, { effectTriggered: '狂暴' });
      p._rageApp = true;
    }

    // 怪物
    for (const mon of ms) {
      if (mon.stats.hp <= 0) continue;

      // 中毒
      if (mon.poisonTurns > 0) {
        mon.stats.hp = Math.max(0, mon.stats.hp - mon.poisonDamage);
        this.pushLog(r, mon.name, `毒素伤害 ${mon.poisonDamage}`, { damage: mon.poisonDamage });
        mon.poisonTurns--;
        if (mon.stats.hp <= 0) {
          this.pushLog(r, mon.name, '中毒死亡！');
          continue;
        }
      }
      // 所有技能 CD -1
      mon.skills.forEach((sk: MonsterSkill) => {
        sk.currentCd = Math.max(0, sk.currentCd - 1);
      });
      // 狂怒递减
      if (mon.enragedTurns > 0) mon.enragedTurns--;
      // 眩晕递减 (放到行动前再做日志)
    }
  }

  /** 玩家回合：计算攻击 → 写入 pending，附带特效日志 */
  private collectPlayerTurn(
    r: number,
    p: PlayerRuntime,
    ms: MonsterRuntime[],
    combo: boolean,
    lifesteal: boolean,
    _shield: boolean,
    critBoost: boolean,
    pd: PendingDamage,
  ) {
    if (p.stunTurns > 0) {
      p.stunTurns--;
      this.pushLog(r, '玩家', '被眩晕，跳过本回合！', { effectTriggered: '眩晕' });
      return;
    }
    if (p.hp <= 0) return;

    const alive = ms.filter((m) => m.stats.hp > 0);
    if (alive.length === 0) return;
    const target = alive[Math.floor(Math.random() * alive.length)];
    pd.targetMonsterId = target.id;

    // 狂暴倍率
    const rageMult = (p.enraged && p.hp < p.maxHp * RAGE_HP_RATIO) ? RAGE_ATK_MULT : 1;

    // 主攻击
    const doPlayerAttack = (label: string, effectTag?: string) => {
      const crit = Math.random() * 100 < p.critRate;
      const dmg = this.calcDamage(p.attack * rageMult, target.stats.defense, 1, crit, critBoost);
      pd.toMonster += dmg;
      this.pushLog(r, '玩家',
        `${label}${target.name} 造成 ${dmg} 点伤害${crit ? '（暴击！）' : ''}`,
        { damage: dmg, isCrit: crit, effectTriggered: effectTag });
      // 吸血
      if (lifesteal) {
        const heal = Math.floor(dmg * LIFESTEAL_RATIO);
        const actual = Math.max(0, Math.min(heal, p.maxHp - p.hp));
        if (actual > 0) {
          pd.playerHeal += actual;
          this.pushLog(r, '玩家', `吸血回复 ${actual} HP`, { effectTriggered: '吸血' });
        }
      }
      if (target.stats.hp - pd.toMonster <= 0) {
        this.pushLog(r, target.name, '被击败！');
      }
      return dmg;
    };

    doPlayerAttack('攻击 ');

    // 连击
    if (combo && target.stats.hp - pd.toMonster > 0 && Math.random() < COMBO_CHANCE) {
      this.pushLog(r, '玩家', `触发连击！`, { effectTriggered: '连击' });
      doPlayerAttack('连击 → ', '连击');
    }
  }

  /** 怪物回合：逐个计算怪物技能/普攻 → 写入 pending */
  private collectMonsterTurn(
    r: number,
    mon: MonsterRuntime,
    p: PlayerRuntime,
    dodge: boolean,
    shield: boolean,
    thorns: boolean,
    pd: PendingDamage,
  ) {
    if (mon.stats.hp <= 0) return;

    // 眩晕
    if (mon.stunTurns > 0) {
      mon.stunTurns--;
      this.pushLog(r, mon.name, '被眩晕，跳过本回合！', { effectTriggered: '眩晕' });
      return;
    }

    // ---------- 技能选择 (CD=0 且随机命中) ----------
    let skillUsed: MonsterSkill | null = null;
    for (const sk of mon.skills) {
      if (sk.currentCd === 0 && Math.random() < MONSTER_SKILL_CHANCE) {
        skillUsed = { ...sk };
        sk.currentCd = sk.cd;  // 立即进入冷却
        break;
      }
    }

    // ---------- 非伤害技能立即结算 ----------
    if (skillUsed) {
      if (skillUsed.id === 'heal') {
        const heal = Math.floor(mon.stats.maxHp * 0.25);
        pd.monsterHeal += heal;
        this.pushLog(r, mon.name, `使用 ${skillUsed.name} 回复 ${heal} HP`);
        return;
      }
      if (skillUsed.id === 'enrage') {
        mon.enragedTurns = 2;
        this.pushLog(r, mon.name, `使用 ${skillUsed.name}，攻击 +40% (2回合)`);
        return;
      }
    }

    // ---------- 闪避判定 ----------
    if (dodge && Math.random() < DODGE_CHANCE) {
      this.pushLog(r, mon.name, `攻击玩家，但被完全闪避！`,
        { isDodge: true, effectTriggered: '闪避' });
      return;
    }

    // ---------- 伤害计算 ----------
    const rageMult = mon.enragedTurns > 0 ? 1.4 : 1;
    const mult = skillUsed ? skillUsed.mult : 1;
    const crit = Math.random() * 100 < mon.stats.critRate;
    let dmg = this.calcDamage(mon.stats.attack * rageMult, p.defense, mult, crit, false);

    if (skillUsed?.id === 'pierce') dmg = Math.floor(dmg * 1.15);

    // 护盾 (仅首次)
    if (shield && !p.shieldUsed) {
      dmg = Math.floor(dmg * SHIELD_RATIO);
      p.shieldUsed = true;
      this.pushLog(r, '玩家', `护盾抵消一半伤害！`, { effectTriggered: '护盾' });
    }

    pd.toPlayer += dmg;

    // 日志
    const pierceTag = skillUsed?.id === 'pierce' ? '（穿透）' : '';
    const skillVerb = skillUsed ? `使用 ${skillUsed.name}` : '攻击';
    this.pushLog(r, mon.name,
      `${skillVerb}玩家，造成 ${dmg} 点伤害${crit ? '（暴击！）' : ''}${pierceTag}`,
      { damage: dmg, isCrit: crit });

    // 眩晕/毒附加效果
    if (skillUsed?.id === 'stun' && Math.random() < 0.5) {
      pd.playerStunTurns += 1;
      this.pushLog(r, mon.name, `玩家被眩晕 1 回合！`, { effectTriggered: '眩晕' });
    }
    if (skillUsed?.id === 'poison') {
      pd.playerPoisonTurns = 2;
      pd.playerPoisonDmg   = Math.floor(dmg * 0.3);
      this.pushLog(r, mon.name,
        `玩家中毒，2 回合内每回合受 ${pd.playerPoisonDmg} 持续伤害`);
    }

    // 反伤
    if (thorns) {
      const back = Math.floor(dmg * THORNS_RATIO);
      pd.toMonster += back;
      this.pushLog(r, mon.name, `反伤受到 ${back} 点伤害`,
        { damage: back, effectTriggered: '反伤' });
      if (mon.stats.hp - pd.toMonster <= 0) {
        this.pushLog(r, mon.name, '被反伤击败！');
      }
    }
  }
}
