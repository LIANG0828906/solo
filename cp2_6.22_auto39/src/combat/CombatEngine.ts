import type { Monster, PlayerStats, CombatLogEntry, CombatResult, Item } from '../types';
import { MonsterTemplate } from './MonsterTemplate';

const MAX_ROUNDS = 10;

function ts(round: number, seq: number): string {
  const t0 = new Date();
  t0.setSeconds(0, 0);
  t0.setMinutes(t0.getMinutes() - MAX_ROUNDS + round);
  const hh = String(t0.getHours()).padStart(2, '0');
  const mm = String(t0.getMinutes()).padStart(2, '0');
  const ss = String((3 + seq) % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

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

export class CombatEngine {
  private logs: CombatLogEntry[] = [];
  private seq = 0;

  private log(round: number, actor: string, action: string, extra?: Partial<CombatLogEntry>) {
    this.logs.push({
      round,
      timestamp: ts(round, this.seq++),
      actor,
      action,
      ...(extra || {}),
    });
  }

  private computePlayer(base: PlayerStats, items: Item[]): PlayerRuntime {
    const effIds = items.filter((i) => i.effect).map((i) => i.effect!.id);
    return {
      maxHp: base.maxHp,
      hp: base.maxHp,
      attack:
        base.attack +
        items.reduce((s, i) => s + i.stats.attack, 0) +
        (effIds.includes('rage') && base.maxHp * 0.3 > base.hp ? Math.floor(base.attack * 0.3) : 0),
      defense: base.defense + items.reduce((s, i) => s + i.stats.defense, 0),
      critRate: base.critRate + items.reduce((s, i) => s + i.stats.critRate, 0),
      items,
      shieldUsed: false,
      enraged: effIds.includes('rage'),
      stunTurns: 0,
      regenHp: effIds.includes('regen') ? Math.floor(base.maxHp * 0.05) : 0,
    };
  }

  private computeMonsters(ms: Monster[]): MonsterRuntime[] {
    return MonsterTemplate.cloneForBattle(ms).map((m) => ({
      ...m,
      enragedTurns: 0,
      poisonTurns: 0,
      poisonDamage: 0,
      stunTurns: 0,
    }));
  }

  private calcDamage(atk: number, def: number, mult: number, crit: boolean, critBoost: boolean): number {
    const base = Math.max(1, atk * mult - def * 0.6);
    const cMult = crit ? (critBoost ? 2.5 : 2.0) : 1;
    const variance = 0.9 + Math.random() * 0.2;
    return Math.max(1, Math.floor(base * cMult * variance));
  }

  simulate(playerBase: PlayerStats, equippedItems: Item[], monsters: Monster[]): CombatResult {
    const t0 = performance.now();
    this.logs = [];
    this.seq = 0;

    const player = this.computePlayer(playerBase, equippedItems);
    const effIds = player.items.filter((i) => i.effect).map((i) => i.effect!.id);
    const hasCombo = effIds.includes('combo');
    const hasLifesteal = effIds.includes('lifesteal');
    const hasShield = effIds.includes('shield');
    const hasDodge = effIds.includes('dodge');
    const critBoost = effIds.includes('crit');
    const hasThorns = effIds.includes('thorns');

    const ms: MonsterRuntime[] = this.computeMonsters(monsters);

    this.log(0, '系统', `战斗开始！玩家 HP:${player.hp} 对手:${ms.map((m) => m.name).join(', ')}`);

    let rounds = 0;
    let victory = false;

    for (let r = 1; r <= MAX_ROUNDS; r++) {
      rounds = r;
      if (player.regenHp > 0 && player.hp > 0) {
        const heal = Math.min(player.regenHp, player.maxHp - player.hp);
        player.hp += heal;
        this.log(r, '玩家', `再生恢复 ${heal} HP`, { effectTriggered: '再生' });
      }

      for (const mon of ms) {
        if (mon.stats.hp <= 0) continue;
        if (mon.poisonTurns > 0) {
          mon.stats.hp -= mon.poisonDamage;
          mon.poisonTurns--;
          this.log(r, mon.name, `受到毒素伤害 ${mon.poisonDamage}`, { damage: mon.poisonDamage });
          mon.skills.forEach((s) => (s.currentCd = Math.max(0, s.currentCd - 1)));
          if (mon.stats.hp <= 0) this.log(r, mon.name, '中毒死亡！');
        } else {
          mon.skills.forEach((s) => (s.currentCd = Math.max(0, s.currentCd - 1)));
        }
      }

      if (player.stunTurns > 0) {
        player.stunTurns--;
        this.log(r, '玩家', '被眩晕，跳过行动！', { effectTriggered: '眩晕' });
      } else if (player.hp > 0) {
        const alive = ms.filter((m) => m.stats.hp > 0);
        if (alive.length === 0) break;
        const target = alive[Math.floor(Math.random() * alive.length)];
        this.playerAttack(r, player, target, hasCombo, hasLifesteal, hasShield, critBoost);
        if (player.enraged && !player._rageApp) {
          this.log(r, '玩家', '血量过低，狂暴攻击提升！', { effectTriggered: '狂暴' });
          player._rageApp = true;
        }
      }

      for (const mon of ms) {
        if (mon.stats.hp <= 0 || player.hp <= 0) continue;
        if (mon.stunTurns > 0) {
          mon.stunTurns--;
          this.log(r, mon.name, '被眩晕，跳过行动！', { effectTriggered: '眩晕' });
          continue;
        }
        this.monsterAttack(r, mon, player, hasDodge, hasShield, hasThorns);
      }

      if (player.hp <= 0) {
        this.log(r, '系统', '玩家阵亡，战斗失败！');
        victory = false;
        break;
      }
      if (ms.every((m) => m.stats.hp <= 0)) {
        this.log(r, '系统', '所有怪物已被击败，胜利！');
        victory = true;
        break;
      }
    }

    if (!ms.every((m) => m.stats.hp <= 0) && player.hp > 0 && rounds >= MAX_ROUNDS) {
      this.log(MAX_ROUNDS, '系统', `回合耗尽，按剩余HP判定：玩家${player.hp} 怪物${ms.filter((m) => m.stats.hp > 0).reduce((s, m) => s + m.stats.hp, 0)}`);
      victory = player.hp > ms.filter((m) => m.stats.hp > 0).reduce((s, m) => s + m.stats.hp, 0);
    }

    const elapsed = performance.now() - t0;
    if (elapsed > 20) console.warn(`[CombatEngine] 战斗模拟耗时 ${elapsed.toFixed(2)}ms 超出20ms目标`);

    return {
      victory: victory && player.hp > 0,
      rounds,
      logs: this.logs,
      playerHp: Math.max(0, player.hp),
      monstersRemaining: ms.filter((m) => m.stats.hp > 0).length,
    };
  }

  private playerAttack(
    r: number,
    p: PlayerRuntime,
    target: MonsterRuntime,
    combo: boolean,
    lifesteal: boolean,
    _shield: boolean,
    critBoost: boolean
  ) {
    const rageMult = p.enraged && p.hp < p.maxHp * 0.3 ? 1.3 : 1;
    const crit = Math.random() * 100 < p.critRate;
    const dmg = this.calcDamage(p.attack * rageMult, target.stats.defense, 1, crit, critBoost);
    target.stats.hp -= dmg;
    this.log(r, '玩家', `攻击 ${target.name} 造成 ${dmg} 点伤害${crit ? '（暴击！）' : ''}`, {
      damage: dmg,
      isCrit: crit,
    });
    if (lifesteal) {
      const heal = Math.floor(dmg * 0.15);
      const actual = Math.min(heal, p.maxHp - p.hp);
      p.hp += actual;
      if (actual > 0) this.log(r, '玩家', `吸血回复 ${actual} HP`, { effectTriggered: '吸血' });
    }
    if (target.stats.hp <= 0) this.log(r, target.name, '被击败！');

    if (combo && target.stats.hp > 0 && Math.random() < 0.25) {
      this.log(r, '玩家', `触发连击！`, { effectTriggered: '连击' });
      const crit2 = Math.random() * 100 < p.critRate;
      const dmg2 = this.calcDamage(p.attack * rageMult, target.stats.defense, 1, crit2, critBoost);
      target.stats.hp -= dmg2;
      this.log(r, '玩家', `连击攻击 ${target.name} 造成 ${dmg2} 点伤害${crit2 ? '（暴击！）' : ''}`, {
        damage: dmg2,
        isCrit: crit2,
        effectTriggered: '连击',
      });
      if (lifesteal) {
        const actual = Math.min(Math.floor(dmg2 * 0.15), p.maxHp - p.hp);
        p.hp += actual;
        if (actual > 0) this.log(r, '玩家', `吸血回复 ${actual} HP`, { effectTriggered: '吸血' });
      }
      if (target.stats.hp <= 0) this.log(r, target.name, '被击败！');
    }
  }

  private monsterAttack(
    r: number,
    mon: MonsterRuntime,
    p: PlayerRuntime,
    dodge: boolean,
    shield: boolean,
    thorns: boolean
  ) {
    let skillUsed: MonsterRuntime['skills'][0] | null = null;
    for (const sk of mon.skills) {
      if (sk.currentCd === 0 && Math.random() < 0.4) {
        skillUsed = sk;
        sk.currentCd = sk.cd;
        break;
      }
    }

    if (skillUsed) {
      if (skillUsed.id === 'heal') {
        const h = Math.floor(mon.stats.maxHp * 0.25);
        mon.stats.hp = Math.min(mon.stats.maxHp, mon.stats.hp + h);
        this.log(r, mon.name, `使用 ${skillUsed.name} 回复 ${h} HP`);
        return;
      }
      if (skillUsed.id === 'enrage') {
        mon.enragedTurns = 2;
        this.log(r, mon.name, `使用 ${skillUsed.name}，攻击提升2回合`);
        return;
      }
    }

    if (dodge && Math.random() < 0.15) {
      this.log(r, mon.name, `攻击玩家，但被完全闪避！`, { isDodge: true, effectTriggered: '闪避' });
      return;
    }

    const rageMult = mon.enragedTurns > 0 ? 1.4 : 1;
    const mult = skillUsed ? skillUsed.mult : 1;
    const crit = Math.random() * 100 < mon.stats.critRate;
    let dmg = this.calcDamage(mon.stats.attack * rageMult, p.defense, mult, crit, false);

    if (skillUsed?.id === 'pierce') {
      dmg = Math.floor(dmg * 1.15);
    }

    if (shield && !p.shieldUsed) {
      dmg = Math.floor(dmg * 0.5);
      p.shieldUsed = true;
      this.log(r, '玩家', `护盾抵消一半伤害！`, { effectTriggered: '护盾' });
    }

    p.hp -= dmg;
    this.log(r, mon.name, `${skillUsed ? `使用 ${skillUsed.name}` : '攻击'}玩家，造成 ${dmg} 点伤害${crit ? '（暴击！）' : ''}${skillUsed?.id === 'pierce' ? '（穿透）' : ''}`, {
      damage: dmg,
      isCrit: crit,
    });

    if (skillUsed?.id === 'stun' && Math.random() < 0.5) {
      p.stunTurns = 1;
      this.log(r, mon.name, `玩家被眩晕！`, { effectTriggered: '眩晕' });
    }
    if (skillUsed?.id === 'poison') {
      p._poisonTurns = 2;
      p._poisonDmg = Math.floor(dmg * 0.3);
      this.log(r, mon.name, `玩家中毒，下回合持续伤害`);
    }

    if (thorns) {
      const back = Math.floor(dmg * 0.2);
      mon.stats.hp -= back;
      this.log(r, mon.name, `反伤受到 ${back} 点伤害`, { damage: back, effectTriggered: '反伤' });
      if (mon.stats.hp <= 0) this.log(r, mon.name, '被反伤击败！');
    }
  }
}


