import { create } from 'zustand';
import type { GameState, RuneType, Spell, StatusEffect } from './types';
import {
  createInitialRunes,
  createInitialBattleState,
  tryCraftRunes,
  generateMonster,
  generateRuneDrops,
  calculateSpellDamage,
  calculateMonsterDamage,
  tickStatusEffects,
  decrementSpellCooldowns,
  createBattleLog,
  hasStunEffect,
  getShieldValue,
  MAX_RUNE_STACK,
} from './gameLogic';
import { v4 as uuidv4 } from 'uuid';

interface GameActions {
  placeRuneInSlot: (slotIndex: number, runeType: RuneType) => void;
  removeRuneFromSlot: (slotIndex: number) => void;
  clearCraftSlots: () => void;
  attemptCraft: () => void;
  triggerCraftFail: () => void;
  clearLastCraftResult: () => void;
  castSpell: (spellId: string) => void;
  startPlayerAnimation: (spellId: string) => void;
  resolveSpellHit: (spellId: string) => void;
  startEnemyTurn: () => void;
  resolveEnemyAttack: () => void;
  processVictory: () => void;
  startNextStage: () => void;
  addRuneDrops: (drops: RuneType[]) => void;
  consumeRuneForSlot: (runeType: RuneType) => boolean;
  returnRunesFromSlots: () => void;
  clearMonsterHit: () => void;
  clearPlayerHit: () => void;
  restartGame: () => void;
  removeFloatingDrop: (id: string) => void;
}

export type GameStore = GameState & GameActions;

export const useGameStore = create<GameStore>((set, get) => ({
  runes: createInitialRunes(),
  learnedSpells: [],
  battle: createInitialBattleState(),
  battleLogs: [
    createBattleLog(1, 'system', '⚔️ 战斗开始！拖拽符文进行合成，释放法术击败敌人！'),
  ],
  craftSlots: [null, null, null, null],
  isCrafting: false,
  lastCraftResult: null,
  craftFailShake: false,
  animatingSpellId: null,
  pendingDamage: null,
  monsterHit: false,
  playerHit: false,
  floatingDrops: [],
  spellCastAnimation: null,

  consumeRuneForSlot: (runeType: RuneType) => {
    const state = get();
    const rune = state.runes[runeType];
    if (rune.count <= 0) return false;
    set({
      runes: {
        ...state.runes,
        [runeType]: { ...rune, count: rune.count - 1 },
      },
    });
    return true;
  },

  returnRunesFromSlots: () => {
    const state = get();
    const newRunes = { ...state.runes };
    for (const slot of state.craftSlots) {
      if (slot && newRunes[slot]) {
        newRunes[slot] = {
          ...newRunes[slot],
          count: Math.min(MAX_RUNE_STACK, newRunes[slot].count + 1),
        };
      }
    }
    set({ runes: newRunes, craftSlots: [null, null, null, null] });
  },

  placeRuneInSlot: (slotIndex: number, runeType: RuneType) => {
    const state = get();
    if (state.isCrafting) return;
    if (state.craftSlots[slotIndex]) return;
    const rune = state.runes[runeType];
    if (rune.count <= 0) return;

    const newSlots = [...state.craftSlots];
    newSlots[slotIndex] = runeType;

    set({
      craftSlots: newSlots,
      runes: {
        ...state.runes,
        [runeType]: { ...rune, count: rune.count - 1 },
      },
    });

    setTimeout(() => {
      const latest = get();
      if (latest.craftSlots.every((s) => s !== null) && !latest.isCrafting) {
        get().attemptCraft();
      }
    }, 50);
  },

  removeRuneFromSlot: (slotIndex: number) => {
    const state = get();
    if (state.isCrafting) return;
    const runeType = state.craftSlots[slotIndex];
    if (!runeType) return;

    const newSlots = [...state.craftSlots];
    newSlots[slotIndex] = null;
    const rune = state.runes[runeType];

    set({
      craftSlots: newSlots,
      runes: {
        ...state.runes,
        [runeType]: { ...rune, count: Math.min(MAX_RUNE_STACK, rune.count + 1) },
      },
    });
  },

  clearCraftSlots: () => {
    get().returnRunesFromSlots();
  },

  attemptCraft: () => {
    const state = get();
    if (state.isCrafting) return;

    set({ isCrafting: true });
    const result = tryCraftRunes(state.craftSlots);

    if (!result.success || !result.spell) {
      set({
        craftFailShake: true,
        isCrafting: false,
        battleLogs: [
          ...state.battleLogs,
          createBattleLog(state.battle.turn, 'system', `❌ 合成失败：${result.reason ?? '未知错误'}`),
        ],
      });
      setTimeout(() => {
        get().returnRunesFromSlots();
        set({ craftFailShake: false });
      }, 400);
      return;
    }

    const spell = result.spell;
    setTimeout(() => {
      set((s) => ({
        learnedSpells: [...s.learnedSpells, spell],
        craftSlots: [null, null, null, null],
        lastCraftResult: spell,
        isCrafting: false,
        battleLogs: [
          ...s.battleLogs,
          createBattleLog(s.battle.turn, 'system', `✨ 合成成功！学会了新法术：【${spell.name}】 ${spell.icon}`),
        ],
      }));
    }, 500);
  },

  triggerCraftFail: () => {
    set({ craftFailShake: true });
    setTimeout(() => set({ craftFailShake: false }), 300);
  },

  clearLastCraftResult: () => {
    set({ lastCraftResult: null });
  },

  startPlayerAnimation: (spellId: string) => {
    set({
      animatingSpellId: spellId,
      spellCastAnimation: { spellId, progress: 0 },
      battle: { ...get().battle, phase: 'player_animating' },
    });
  },

  castSpell: (spellId: string) => {
    const state = get();
    if (state.battle.phase !== 'player_turn') return;
    if (state.battle.isPlayerStunned) return;
    if (!state.battle.monster) return;

    const spell = state.learnedSpells.find((s) => s.id === spellId);
    if (!spell || spell.currentCooldown > 0) return;

    get().startPlayerAnimation(spellId);

    setTimeout(() => {
      get().resolveSpellHit(spellId);
    }, 800);
  },

  resolveSpellHit: (spellId: string) => {
    const state = get();
    const spell = state.learnedSpells.find((s) => s.id === spellId);
    const monster = state.battle.monster;
    if (!spell || !monster) return;

    const { damage, effects } = calculateSpellDamage(spell, monster, state.battle.player.level);
    const shield = getShieldValue(monster.statusEffects);
    const actualDamage = Math.max(1, damage - shield);

    const newMonsterHp = Math.max(0, monster.hp - actualDamage);
    const newMonsterEffects = [...monster.statusEffects, ...effects].filter(
      (e) => !(e.type === 'shield')
    );

    const newSpells = state.learnedSpells.map((s) =>
      s.id === spellId ? { ...s, currentCooldown: s.cooldown } : s
    );

    let newPlayerHp = state.battle.player.hp;
    let newPlayerEffects = [...state.battle.player.statusEffects];
    const healLogs: string[] = [];

    for (const eff of effects) {
      if (eff.type === 'heal') {
        const before = newPlayerHp;
        newPlayerHp = Math.min(state.battle.player.maxHp, newPlayerHp + eff.value);
        if (newPlayerHp > before) healLogs.push(`💚 恢复了 ${newPlayerHp - before} 点生命`);
      }
      if (eff.type === 'shield') {
        newPlayerEffects.push({ ...eff });
      }
    }

    const logs = [
      ...state.battleLogs,
      createBattleLog(
        state.battle.turn,
        'player',
        `🎯 施放【${spell.name}】${spell.icon}，对 ${monster.name} 造成 ${actualDamage} 点伤害！`,
        actualDamage
      ),
      ...healLogs.map((m) => createBattleLog(state.battle.turn, 'player', m)),
    ];

    const monsterDied = newMonsterHp <= 0;

    set({
      learnedSpells: newSpells,
      monsterHit: true,
      animatingSpellId: null,
      spellCastAnimation: null,
      battle: {
        ...state.battle,
        monster: {
          ...monster,
          hp: newMonsterHp,
          statusEffects: newMonsterEffects,
        },
        player: {
          ...state.battle.player,
          hp: newPlayerHp,
          statusEffects: newPlayerEffects,
        },
        phase: monsterDied ? 'victory' : 'player_animating',
      },
      battleLogs: logs,
    });

    setTimeout(() => get().clearMonsterHit(), 300);

    if (monsterDied) {
      setTimeout(() => get().processVictory(), 1000);
    } else {
      setTimeout(() => get().startEnemyTurn(), 900);
    }
  },

  clearMonsterHit: () => set({ monsterHit: false }),
  clearPlayerHit: () => set({ playerHit: false }),

  startEnemyTurn: () => {
    const state = get();
    const monster = state.battle.monster;
    if (!monster) return;

    const monsterTick = tickStatusEffects(monster);
    const playerTick = tickStatusEffects(state.battle.player);

    const logs = [...state.battleLogs];
    if (monsterTick.tickDamage > 0) {
      logs.push(
        createBattleLog(
          state.battle.turn,
          'system',
          `🔥 ${monster.name} 受到持续伤害 ${monsterTick.tickDamage} 点`,
          monsterTick.tickDamage
        )
      );
    }
    if (playerTick.tickDamage > 0) {
      logs.push(
        createBattleLog(
          state.battle.turn,
          'system',
          `☠️ 你受到持续伤害 ${playerTick.tickDamage} 点`,
          playerTick.tickDamage
        )
      );
    }
    if (playerTick.healAmount > 0) {
      logs.push(
        createBattleLog(state.battle.turn, 'system', `💚 持续恢复 ${playerTick.healAmount} 点生命`)
      );
    }

    const updatedSpells = decrementSpellCooldowns(state.learnedSpells);
    const monsterFrozen = hasStunEffect(monsterTick.statusEffects);

    const monsterDied = monsterTick.hp <= 0;
    const playerDied = playerTick.hp <= 0;

    const playerShield = playerTick.statusEffects
      .filter((e) => e.type === 'shield')
      .reduce((sum, e) => sum + e.value, 0);

    let updatedPlayerEffects = playerTick.statusEffects.filter((e) => e.type !== 'shield');
    const updatedPlayerHp = playerTick.hp;

    set({
      learnedSpells: updatedSpells,
      battle: {
        ...state.battle,
        monster: monsterDied
          ? { ...monster, hp: 0, statusEffects: monsterTick.statusEffects }
          : { ...monster, hp: monsterTick.hp, statusEffects: monsterTick.statusEffects },
        player: {
          ...state.battle.player,
          hp: updatedPlayerHp,
          statusEffects: updatedPlayerEffects,
        },
        phase: monsterDied
          ? 'victory'
          : playerDied
          ? 'defeat'
          : monsterFrozen
          ? 'player_turn'
          : 'enemy_turn',
        turn: state.battle.turn + 1,
        isPlayerStunned: false,
        bossSkillCooldown: Math.max(0, state.battle.bossSkillCooldown - 1),
      },
      battleLogs: logs,
      monsterHit: monsterTick.tickDamage > 0,
    });

    if (monsterTick.tickDamage > 0) {
      setTimeout(() => get().clearMonsterHit(), 250);
    }

    if (monsterDied) {
      setTimeout(() => get().processVictory(), 800);
      return;
    }
    if (playerDied) return;
    if (monsterFrozen) {
      set((s) => ({
        battleLogs: [
          ...s.battleLogs,
          createBattleLog(s.battle.turn, 'system', `❄️ ${monster.name} 被冻结，跳过回合！`),
        ],
      }));
      return;
    }

    setTimeout(() => get().resolveEnemyAttack(), 800);
  },

  resolveEnemyAttack: () => {
    const state = get();
    const monster = state.battle.monster;
    if (!monster || state.battle.phase !== 'enemy_turn') return;

    let isStun = false;
    let damageMultiplier = 1;
    const extraLogs: string[] = [];

    if (monster.isBoss && state.battle.bossSkillCooldown <= 0 && monster.specialSkills.length > 0) {
      const skill = monster.specialSkills[Math.floor(Math.random() * monster.specialSkills.length)];
      if (skill === 'stun_all') {
        isStun = true;
        extraLogs.push(`💫 BOSS施放【震慑怒吼】，你被眩晕了！`);
        set({ battle: { ...state.battle, bossSkillCooldown: 3 } });
      } else if (skill === 'heavy_smash') {
        damageMultiplier = 1.8;
        extraLogs.push(`💥 BOSS施放【重击】！`);
        set({ battle: { ...state.battle, bossSkillCooldown: 3 } });
      }
    }

    const latest = get();
    const rawDmg = calculateMonsterDamage(monster, latest.battle.player.defense);
    let damage = Math.floor(rawDmg * damageMultiplier);

    const shieldVal = latest.battle.player.statusEffects
      .filter((e) => e.type === 'shield')
      .reduce((s, e) => s + e.value, 0);
    let actualDamage = Math.max(0, damage - shieldVal);
    const remainingShield = Math.max(0, shieldVal - damage);
    let newPlayerEffects = latest.battle.player.statusEffects.filter((e) => e.type !== 'shield');
    if (remainingShield > 0) {
      newPlayerEffects.push({ type: 'shield', duration: 0, value: remainingShield });
    }

    const newPlayerHp = Math.max(0, latest.battle.player.hp - actualDamage);
    const playerDied = newPlayerHp <= 0;

    set({
      playerHit: true,
      battle: {
        ...latest.battle,
        player: {
          ...latest.battle.player,
          hp: newPlayerHp,
          statusEffects: newPlayerEffects,
        },
        isPlayerStunned: isStun,
        phase: playerDied ? 'defeat' : 'player_turn',
      },
      battleLogs: [
        ...latest.battleLogs,
        ...extraLogs.map((m) => createBattleLog(latest.battle.turn, 'monster', m)),
        createBattleLog(
          latest.battle.turn,
          'monster',
          `⚔️ ${monster.name} 攻击你，造成 ${actualDamage} 点伤害！${
            shieldVal > 0 && actualDamage < damage
              ? `(护盾吸收 ${damage - actualDamage})`
              : ''
          }`,
          actualDamage
        ),
      ],
    });

    setTimeout(() => get().clearPlayerHit(), 300);
  },

  processVictory: () => {
    const state = get();
    const monster = state.battle.monster;
    if (!monster) return;

    const drops = generateRuneDrops(monster.level, monster.isBoss);
    const floatDrops = drops.map((t) => ({
      id: uuidv4(),
      type: t,
      fromX: 70,
      fromY: 40,
    }));

    set({
      floatingDrops: floatDrops,
      battle: {
        ...state.battle,
        phase: 'victory',
        player: {
          ...state.battle.player,
          maxHp: state.battle.player.maxHp + (monster.isBoss ? 20 : 5),
          hp: Math.min(
            state.battle.player.maxHp + (monster.isBoss ? 20 : 5),
            state.battle.player.hp + (monster.isBoss ? 30 : 10)
          ),
          defense: state.battle.player.defense + (monster.isBoss ? 3 : 1),
          level: monster.isBoss ? state.battle.player.level + 1 : state.battle.player.level,
        },
      },
      battleLogs: [
        ...state.battleLogs,
        createBattleLog(
          state.battle.turn,
          'system',
          `🎉 击败了 ${monster.name}！获得 ${drops.length} 个符文掉落，生命上限+${
            monster.isBoss ? 20 : 5
          }，防御+${monster.isBoss ? 3 : 1}`
        ),
      ],
    });

    get().addRuneDrops(drops);

    setTimeout(() => {
      set({ floatingDrops: [] });
      get().startNextStage();
    }, 1800);
  },

  addRuneDrops: (drops: RuneType[]) => {
    set((s) => {
      const newRunes = { ...s.runes };
      for (const t of drops) {
        newRunes[t] = {
          ...newRunes[t],
          count: Math.min(MAX_RUNE_STACK, newRunes[t].count + 1),
        };
      }
      return { runes: newRunes };
    });
  },

  removeFloatingDrop: (id: string) => {
    set((s) => ({ floatingDrops: s.floatingDrops.filter((d) => d.id !== id) }));
  },

  startNextStage: () => {
    const state = get();
    const nextStage = state.battle.player.currentStage + 1;
    const isBoss = nextStage % 5 === 0;
    const monster = generateMonster(nextStage, isBoss);

    set({
      battle: {
        ...state.battle,
        monster,
        player: {
          ...state.battle.player,
          currentStage: nextStage,
          statusEffects: [],
        },
        turn: 1,
        phase: 'player_turn',
        isPlayerStunned: false,
        bossSkillCooldown: 0,
      },
      battleLogs: [
        ...state.battleLogs,
        createBattleLog(
          1,
          'system',
          `📍 第 ${nextStage} 关 ${isBoss ? '【BOSS战】' : ''}：${monster.name} 出现！HP:${monster.hp} ATK:${monster.attack}`
        ),
      ],
    });
  },

  restartGame: () => {
    set({
      runes: createInitialRunes(),
      learnedSpells: [],
      battle: createInitialBattleState(),
      battleLogs: [
        createBattleLog(1, 'system', '🔄 游戏重新开始！拖拽符文进行合成吧。'),
      ],
      craftSlots: [null, null, null, null],
      isCrafting: false,
      lastCraftResult: null,
      craftFailShake: false,
      animatingSpellId: null,
      pendingDamage: null,
      monsterHit: false,
      playerHit: false,
      floatingDrops: [],
      spellCastAnimation: null,
    });
  },
}));
