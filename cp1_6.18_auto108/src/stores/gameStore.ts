import { create } from 'zustand';
import type { Player, Room, CombatState, GameStats, VictoryState, FloatingText, Particle, Star, LootAnimation, EquipmentSlot, Equipment } from '../game/types';
import { generateDungeon, MAX_BACKPACK, GRID_SIZE } from '../game/dungeonGenerator';
import { playerAttack, monsterAttack, createInitialCombatState } from '../game/combatSystem';

interface GameState {
  player: Player;
  dungeon: Room[][];
  currentFloor: number;
  combat: CombatState;
  stats: GameStats;
  victory: VictoryState;
  floatingTexts: FloatingText[];
  particles: Particle[];
  stars: Star[];
  lootAnimations: LootAnimation[];
  currentSeed: number;
  gameOver: boolean;
  moving: boolean;
  lastMoveTime: number;
  trailPoints: { x: number; y: number; time: number }[];

  initGame: () => void;
  movePlayer: (dx: number, dy: number) => void;
  enterRoom: (x: number, y: number) => void;
  startCombat: () => void;
  performNormalAttack: () => void;
  performSkillAttack: () => void;
  equipItem: (equipment: Equipment, slot: EquipmentSlot) => void;
  unequipItem: (slot: EquipmentSlot) => void;
  swapBackpackItem: (fromIndex: number, toIndex: number) => void;
  goToNextFloor: () => void;
  addFloatingText: (text: string, x: number, y: number, color: string) => void;
  addParticles: (x: number, y: number, count: number, colors: string[]) => void;
  addLootAnimation: (equipment: Equipment, startX: number, startY: number, endX: number, endY: number) => void;
  updateParticles: (dt: number) => void;
  updateFloatingTexts: (now: number) => void;
  updateLootAnimations: (now: number) => void;
  updateCombatCooldowns: (dt: number) => void;
  startVictory: () => void;
  removeEquipmentFromBackpack: (id: string) => void;
  addEquipmentToBackpack: (eq: Equipment) => boolean;
}

function createInitialPlayer(): Player {
  return {
    hp: 100,
    maxHp: 100,
    mp: 100,
    maxMp: 100,
    attack: 10,
    defense: 5,
    x: 0,
    y: 0,
    equipment: {
      weapon: null,
      helmet: null,
      armor: null,
      boots: null,
    },
    backpack: [],
  };
}

function generateStars(width: number, height: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < 80; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 1 + Math.random() * 2,
      phase: Math.random() * Math.PI * 2,
      speed: 1.5 + Math.random() * 1.5,
    });
  }
  return stars;
}

export const useGameStore = create<GameState>((set, get) => ({
  player: createInitialPlayer(),
  dungeon: [],
  currentFloor: 0,
  combat: {
    inCombat: false,
    currentMonster: null,
    normalAttackCooldown: 0,
    skillAttackCooldown: 0,
    playerTurn: true,
    bossWarningActive: false,
    bossWarningStartTime: 0,
    combatLog: [],
  },
  stats: {
    kills: 0,
    equipmentCollected: 0,
    startTime: Date.now(),
    maxDamage: 0,
  },
  victory: { show: false, startTime: 0 },
  floatingTexts: [],
  particles: [],
  stars: [],
  lootAnimations: [],
  currentSeed: 0,
  gameOver: false,
  moving: false,
  lastMoveTime: 0,
  trailPoints: [],

  initGame: () => {
    const seed = Math.floor(Math.random() * 2147483647);
    const dungeon = generateDungeon(seed, 0);
    set({
      player: createInitialPlayer(),
      dungeon,
      currentFloor: 0,
      combat: {
        inCombat: false,
        currentMonster: null,
        normalAttackCooldown: 0,
        skillAttackCooldown: 0,
        playerTurn: true,
        bossWarningActive: false,
        bossWarningStartTime: 0,
        combatLog: [],
      },
      stats: {
        kills: 0,
        equipmentCollected: 0,
        startTime: Date.now(),
        maxDamage: 0,
      },
      victory: { show: false, startTime: 0 },
      floatingTexts: [],
      particles: [],
      stars: generateStars(800, 600),
      lootAnimations: [],
      currentSeed: seed,
      gameOver: false,
      moving: false,
      lastMoveTime: 0,
      trailPoints: [],
    });
  },

  movePlayer: (dx: number, dy: number) => {
    const state = get();
    if (state.moving || state.combat.inCombat || state.gameOver || state.victory.show) return;
    const now = performance.now();
    if (now - state.lastMoveTime < 300) return;

    const newX = state.player.x + dx;
    const newY = state.player.y + dy;

    if (newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE) return;

    const currentRoom = state.dungeon[state.player.y][state.player.x];
    const targetRoomId = `room_${newX}_${newY}`;
    if (!currentRoom.connections.includes(targetRoomId)) return;

    set({
      player: { ...state.player, x: newX, y: newY },
      moving: true,
      lastMoveTime: now,
      trailPoints: [
        ...state.trailPoints.slice(-20),
        { x: state.player.x, y: state.player.y, time: now },
      ],
    });

    setTimeout(() => {
      set({ moving: false });
      get().enterRoom(newX, newY);
    }, 300);
  },

  enterRoom: (x: number, y: number) => {
    const state = get();
    const room = state.dungeon[y][x];
    if (room.visited && room.cleared) return;

    set((s) => {
      const newDungeon = s.dungeon.map((row) =>
        row.map((r) => ({ ...r, monster: r.monster ? { ...r.monster, specialSkill: r.monster.specialSkill ? { ...r.monster.specialSkill } : null } : null, loot: [...r.loot] }))
      );
      newDungeon[y][x] = { ...room, visited: true };

      if (room.type === 'chest' && !room.cleared && room.loot.length > 0) {
        const newBackpack = [...s.player.backpack];
        for (const item of room.loot) {
          if (newBackpack.length < MAX_BACKPACK) {
            newBackpack.push(item);
          }
        }
        newDungeon[y][x].cleared = true;
        return {
          dungeon: newDungeon,
          player: { ...s.player, backpack: newBackpack },
          stats: { ...s.stats, equipmentCollected: s.stats.equipmentCollected + room.loot.length },
        };
      }

      if ((room.type === 'monster' || room.type === 'boss') && !room.cleared && room.monster) {
        return {
          dungeon: newDungeon,
          combat: createInitialCombatState(room.monster),
        };
      }

      return { dungeon: newDungeon };
    });
  },

  startCombat: () => {
    const state = get();
    if (!state.combat.currentMonster) return;
    set({ combat: createInitialCombatState(state.combat.currentMonster) });
  },

  performNormalAttack: () => {
    const state = get();
    if (!state.combat.inCombat || !state.combat.currentMonster || !state.combat.playerTurn) return;
    if (state.combat.normalAttackCooldown > 0) return;

    const result = playerAttack(state.player, state.combat.currentMonster, false);
    if (result.damageToMonster === 0) return;

    const monster = { ...state.combat.currentMonster };
    monster.hp = Math.max(0, monster.hp - result.damageToMonster);

    const newLog = [...state.combat.combatLog.slice(-5), `你造成 ${result.damageToMonster} 点伤害！`];

    if (monster.hp <= 0) {
      const px = state.player.x;
      const py = state.player.y;
      const newDungeon = state.dungeon.map((row) =>
        row.map((r) => {
          if (r.x === px && r.y === py) {
            return { ...r, cleared: true, monster: null };
          }
          return r;
        })
      );

      const newBackpack = [...state.player.backpack];
      for (const item of result.loot) {
        if (newBackpack.length < MAX_BACKPACK) {
          newBackpack.push(item);
        }
      }

      set({
        dungeon: newDungeon,
        combat: {
          ...state.combat,
          inCombat: false,
          currentMonster: null,
          combatLog: [],
        },
        player: { ...state.player, backpack: newBackpack },
        stats: {
          ...state.stats,
          kills: state.stats.kills + 1,
          equipmentCollected: state.stats.equipmentCollected + result.loot.length,
          maxDamage: Math.max(state.stats.maxDamage, result.damageToMonster),
        },
      });

      get().addFloatingText(`-${result.damageToMonster}`, px, py, '#FF4757');
      for (const item of result.loot) {
        get().addLootAnimation(item, px, py, 0, 0);
      }
      return;
    }

    const maxDmg = Math.max(state.stats.maxDamage, result.damageToMonster);
    set({
      combat: {
        ...state.combat,
        currentMonster: monster,
        normalAttackCooldown: 1,
        playerTurn: false,
        combatLog: newLog,
      },
      stats: { ...state.stats, maxDamage: maxDmg },
    });

    get().addFloatingText(`-${result.damageToMonster}`, state.player.x, state.player.y, '#FF4757');

    setTimeout(() => {
      const s = get();
      if (!s.combat.currentMonster) return;
      const mResult = monsterAttack(s.combat.currentMonster!, s.player);
      const newHp = Math.max(0, s.player.hp - mResult.damageToPlayer);
      const pLog = [...s.combat.combatLog.slice(-5), `${s.combat.currentMonster!.name} 造成 ${mResult.damageToPlayer} 点伤害！`];

      if (newHp <= 0) {
        set({
          player: { ...s.player, hp: 0 },
          combat: { ...s.combat, combatLog: pLog },
          gameOver: true,
        });
        return;
      }

      let bossWarning = false;
      let bossWarningTime = 0;
      if (
        s.combat.currentMonster!.isBoss &&
        s.combat.currentMonster!.specialSkill &&
        s.combat.currentMonster!.specialSkill.currentCooldown <= 1
      ) {
        bossWarning = true;
        bossWarningTime = performance.now();
      }

      set({
        player: { ...s.player, hp: newHp },
        combat: {
          ...s.combat,
          playerTurn: true,
          combatLog: pLog,
          bossWarningActive: bossWarning,
          bossWarningStartTime: bossWarningTime,
        },
      });

      get().addFloatingText(`-${mResult.damageToPlayer}`, s.player.x, s.player.y, '#FF0000');
    }, 800);
  },

  performSkillAttack: () => {
    const state = get();
    if (!state.combat.inCombat || !state.combat.currentMonster || !state.combat.playerTurn) return;
    if (state.combat.skillAttackCooldown > 0) return;
    if (state.player.mp < state.player.maxMp * 0.25) return;

    const result = playerAttack(state.player, state.combat.currentMonster, true);
    if (result.damageToMonster === 0) return;

    const monster = { ...state.combat.currentMonster };
    monster.hp = Math.max(0, monster.hp - result.damageToMonster);
    const newMp = Math.max(0, state.player.mp - Math.floor(state.player.maxMp * 0.25));
    const newLog = [...state.combat.combatLog.slice(-5), `技能攻击！造成 ${result.damageToMonster} 点伤害！`];

    if (monster.hp <= 0) {
      const px = state.player.x;
      const py = state.player.y;
      const newDungeon = state.dungeon.map((row) =>
        row.map((r) => {
          if (r.x === px && r.y === py) {
            return { ...r, cleared: true, monster: null };
          }
          return r;
        })
      );

      const newBackpack = [...state.player.backpack];
      for (const item of result.loot) {
        if (newBackpack.length < MAX_BACKPACK) {
          newBackpack.push(item);
        }
      }

      set({
        dungeon: newDungeon,
        combat: {
          ...state.combat,
          inCombat: false,
          currentMonster: null,
          combatLog: [],
        },
        player: { ...state.player, backpack: newBackpack, mp: newMp },
        stats: {
          ...state.stats,
          kills: state.stats.kills + 1,
          equipmentCollected: state.stats.equipmentCollected + result.loot.length,
          maxDamage: Math.max(state.stats.maxDamage, result.damageToMonster),
        },
      });

      get().addFloatingText(`-${result.damageToMonster}`, px, py, '#9B59B6');
      return;
    }

    set({
      player: { ...state.player, mp: newMp },
      combat: {
        ...state.combat,
        currentMonster: monster,
        skillAttackCooldown: 3,
        playerTurn: false,
        combatLog: newLog,
      },
      stats: { ...state.stats, maxDamage: Math.max(state.stats.maxDamage, result.damageToMonster) },
    });

    get().addFloatingText(`-${result.damageToMonster}`, state.player.x, state.player.y, '#9B59B6');

    setTimeout(() => {
      const s = get();
      if (!s.combat.currentMonster) return;
      const mResult = monsterAttack(s.combat.currentMonster!, s.player);
      const newHp2 = Math.max(0, s.player.hp - mResult.damageToPlayer);
      const pLog = [...s.combat.combatLog.slice(-5), `${s.combat.currentMonster!.name} 造成 ${mResult.damageToPlayer} 点伤害！`];

      if (newHp2 <= 0) {
        set({
          player: { ...s.player, hp: 0 },
          combat: { ...s.combat, combatLog: pLog },
          gameOver: true,
        });
        return;
      }

      set({
        player: { ...s.player, hp: newHp2 },
        combat: {
          ...s.combat,
          playerTurn: true,
          combatLog: pLog,
        },
      });
    }, 800);
  },

  equipItem: (equipment: Equipment, slot: EquipmentSlot) => {
    set((s) => {
      const currentEquipped = s.player.equipment[slot];
      const newBackpack = s.player.backpack.filter((e) => e.id !== equipment.id);
      if (currentEquipped) {
        newBackpack.push(currentEquipped);
      }

      const newEquipment = { ...s.player.equipment, [slot]: equipment };
      let attackBonus = 0;
      let defenseBonus = 0;
      for (const eq of Object.values(newEquipment)) {
        if (eq) {
          attackBonus += eq.attackBonus;
          defenseBonus += eq.defenseBonus;
        }
      }

      return {
        player: {
          ...s.player,
          equipment: newEquipment,
          backpack: newBackpack,
          attack: 10 + attackBonus,
          defense: 5 + defenseBonus,
        },
      };
    });
  },

  unequipItem: (slot: EquipmentSlot) => {
    set((s) => {
      const currentEquipped = s.player.equipment[slot];
      if (!currentEquipped) return s;
      if (s.player.backpack.length >= MAX_BACKPACK) return s;

      const newEquipment = { ...s.player.equipment, [slot]: null };
      let attackBonus = 0;
      let defenseBonus = 0;
      for (const eq of Object.values(newEquipment)) {
        if (eq) {
          attackBonus += eq.attackBonus;
          defenseBonus += eq.defenseBonus;
        }
      }

      return {
        player: {
          ...s.player,
          equipment: newEquipment,
          backpack: [...s.player.backpack, currentEquipped],
          attack: 10 + attackBonus,
          defense: 5 + defenseBonus,
        },
      };
    });
  },

  swapBackpackItem: (fromIndex: number, toIndex: number) => {
    set((s) => {
      const newBackpack = [...s.player.backpack];
      const temp = newBackpack[fromIndex];
      newBackpack[fromIndex] = newBackpack[toIndex];
      newBackpack[toIndex] = temp;
      return { player: { ...s.player, backpack: newBackpack } };
    });
  },

  goToNextFloor: () => {
    const state = get();
    if (state.combat.inCombat || state.gameOver || state.victory.show) return;

    const currentRoom = state.dungeon[state.player.y][state.player.x];
    if (currentRoom.type !== 'exit') return;

    const isBossFloor = state.currentFloor > 0 && (state.currentFloor + 1) % 5 === 4;
    if (isBossFloor) {
      const bossRoom = state.dungeon[GRID_SIZE - 2][GRID_SIZE - 2];
      if (bossRoom.type === 'boss' && !bossRoom.cleared) return;
    }

    if ((state.currentFloor + 1) % 5 === 4 && state.currentFloor > 0) {
      get().startVictory();
      return;
    }

    const newFloor = state.currentFloor + 1;
    const newSeed = Math.floor(Math.random() * 2147483647);
    const newDungeon = generateDungeon(newSeed, newFloor);

    const hpRecovery = Math.min(state.player.maxHp, state.player.hp + Math.floor(state.player.maxHp * 0.3));
    const mpRecovery = Math.min(state.player.maxMp, state.player.mp + Math.floor(state.player.maxMp * 0.5));

    set({
      dungeon: newDungeon,
      currentFloor: newFloor,
      currentSeed: newSeed,
      player: {
        ...state.player,
        x: 0,
        y: 0,
        hp: hpRecovery,
        mp: mpRecovery,
      },
      trailPoints: [],
    });
  },

  addFloatingText: (text: string, x: number, y: number, color: string) => {
    set((s) => ({
      floatingTexts: [
        ...s.floatingTexts.slice(-30),
        {
          id: `ft_${Date.now()}_${Math.random()}`,
          text,
          x,
          y,
          color,
          startTime: performance.now(),
          duration: 1000,
        },
      ],
    }));
  },

  addParticles: (x: number, y: number, count: number, colors: string[]) => {
    set((s) => {
      const newParticles: Particle[] = [];
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 50 + Math.random() * 150;
        newParticles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 3 + Math.random() * 8,
          color: colors[Math.floor(Math.random() * colors.length)],
          life: 1,
          maxLife: 0.8 + Math.random() * 1.2,
        });
      }
      const all = [...s.particles, ...newParticles];
      return { particles: all.length > 200 ? all.slice(-200) : all };
    });
  },

  addLootAnimation: (equipment: Equipment, startX: number, startY: number, endX: number, endY: number) => {
    set((s) => ({
      lootAnimations: [
        ...s.lootAnimations,
        {
          id: `loot_${Date.now()}_${Math.random()}`,
          equipment,
          startX,
          startY,
          endX,
          endY,
          startTime: performance.now(),
          duration: 600,
        },
      ],
    }));
  },

  updateParticles: (dt: number) => {
    set((s) => ({
      particles: s.particles
        .map((p) => ({
          ...p,
          x: p.x + p.vx * dt,
          y: p.y + p.vy * dt,
          vy: p.vy + 100 * dt,
          life: p.life - dt / p.maxLife,
        }))
        .filter((p) => p.life > 0)
        .slice(-200),
    }));
  },

  updateFloatingTexts: (now: number) => {
    set((s) => ({
      floatingTexts: s.floatingTexts.filter((ft) => now - ft.startTime < ft.duration),
    }));
  },

  updateLootAnimations: (now: number) => {
    set((s) => ({
      lootAnimations: s.lootAnimations.filter((la) => now - la.startTime < la.duration),
    }));
  },

  updateCombatCooldowns: (dt: number) => {
    set((s) => {
      if (!s.combat.inCombat) return s;
      return {
        combat: {
          ...s.combat,
          normalAttackCooldown: Math.max(0, s.combat.normalAttackCooldown - dt),
          skillAttackCooldown: Math.max(0, s.combat.skillAttackCooldown - dt),
        },
      };
    });
  },

  startVictory: () => {
    set({
      victory: { show: true, startTime: performance.now() },
      combat: {
        inCombat: false,
        currentMonster: null,
        normalAttackCooldown: 0,
        skillAttackCooldown: 0,
        playerTurn: true,
        bossWarningActive: false,
        bossWarningStartTime: 0,
        combatLog: [],
      },
    });

    const state = get();
    const colors = ['#FFD700', '#FF6B35', '#FF4757', '#4ECDC4', '#66FCF1', '#9B59B6'];
    for (let i = 0; i < 100; i++) {
      state.addParticles(
        400 + (Math.random() - 0.5) * 200,
        300 + (Math.random() - 0.5) * 200,
        1,
        colors
      );
    }
  },

  removeEquipmentFromBackpack: (id: string) => {
    set((s) => ({
      player: {
        ...s.player,
        backpack: s.player.backpack.filter((e) => e.id !== id),
      },
    }));
  },

  addEquipmentToBackpack: (eq: Equipment) => {
    const state = get();
    if (state.player.backpack.length >= MAX_BACKPACK) return false;
    set((s) => ({
      player: { ...s.player, backpack: [...s.player.backpack, eq] },
    }));
    return true;
  },
}));
