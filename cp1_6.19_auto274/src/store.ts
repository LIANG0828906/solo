import { create } from 'zustand';
import { generateDungeon, isWalkable, TileType, Monster } from './dungeonGenerator';

export type ItemType = 'potion' | 'shield' | 'weapon' | 'key';

export interface Item {
  type: ItemType;
  name: string;
  icon: string;
}

export interface Player {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  level: number;
  exp: number;
  expToNext: number;
  inventory: Item[];
}

export type CombatResult = 'win' | 'lose' | 'flee' | null;

interface GameState {
  player: Player;
  map: TileType[][];
  monsters: Monster[];
  currentLevel: number;
  monstersKilled: number;
  totalMonstersKilled: number;
  isInCombat: boolean;
  currentMonster: Monster | null;
  combatResult: CombatResult;
  gameOver: boolean;
  levelComplete: boolean;
  seed: number;
  combatLog: string[];
  lastDamagePlayer: number;
  lastDamageMonster: number;
  lastExpGain: number;

  initGame: () => void;
  movePlayer: (dx: number, dy: number) => void;
  movePlayerTo: (x: number, y: number) => void;
  attack: () => void;
  flee: () => void;
  closeCombat: () => void;
  nextLevel: () => void;
  restartGame: () => void;
  useItem: (index: number) => void;
  openChest: (x: number, y: number, isSpecial: boolean) => void;
}

function createInitialPlayer(): Player {
  return {
    x: 0,
    y: 0,
    hp: 100,
    maxHp: 100,
    attack: 5,
    defense: 2,
    level: 1,
    exp: 0,
    expToNext: 100,
    inventory: [],
  };
}

function getRandomItem(): Item {
  const items: Item[] = [
    { type: 'potion', name: '生命药水', icon: 'H' },
    { type: 'potion', name: '生命药水', icon: 'H' },
    { type: 'weapon', name: '短剑', icon: 'W' },
    { type: 'shield', name: '木盾', icon: 'S' },
    { type: 'key', name: '钥匙', icon: 'K' },
  ];
  return items[Math.floor(Math.random() * items.length)];
}

function getSpecialItem(): Item {
  const items: Item[] = [
    { type: 'weapon', name: '精钢剑', icon: 'W' },
    { type: 'shield', name: '铁盾', icon: 'S' },
  ];
  return items[Math.floor(Math.random() * items.length)];
}

function addExp(player: Player, exp: number): { player: Player; leveledUp: boolean } {
  let newPlayer = { ...player };
  let leveledUp = false;
  newPlayer.exp += exp;

  while (newPlayer.exp >= newPlayer.expToNext) {
    newPlayer.exp -= newPlayer.expToNext;
    newPlayer.level += 1;
    newPlayer.maxHp += 20;
    newPlayer.hp = newPlayer.maxHp;
    newPlayer.attack += 2;
    newPlayer.defense += 1;
    newPlayer.expToNext = 100 + (newPlayer.level - 1) * 50;
    leveledUp = true;
  }

  return { player: newPlayer, leveledUp };
}

export const useGameStore = create<GameState>((set, get) => ({
  player: createInitialPlayer(),
  map: [],
  monsters: [],
  currentLevel: 1,
  monstersKilled: 0,
  totalMonstersKilled: 0,
  isInCombat: false,
  currentMonster: null,
  combatResult: null,
  gameOver: false,
  levelComplete: false,
  seed: Date.now(),
  combatLog: [],
  lastDamagePlayer: 0,
  lastDamageMonster: 0,
  lastExpGain: 0,

  initGame: () => {
    const seed = Date.now();
    const { map, monsters, entrance } = generateDungeon(seed, 1);
    const player = createInitialPlayer();
    player.x = entrance.x;
    player.y = entrance.y;

    set({
      player,
      map,
      monsters,
      currentLevel: 1,
      monstersKilled: 0,
      totalMonstersKilled: 0,
      isInCombat: false,
      currentMonster: null,
      combatResult: null,
      gameOver: false,
      levelComplete: false,
      seed,
      combatLog: [],
      lastDamagePlayer: 0,
      lastDamageMonster: 0,
      lastExpGain: 0,
    });
  },

  movePlayer: (dx: number, dy: number) => {
    const state = get();
    if (state.isInCombat || state.gameOver || state.levelComplete) return;

    const newX = state.player.x + dx;
    const newY = state.player.y + dy;

    if (newX < 0 || newX >= 8 || newY < 0 || newY >= 8) return;

    const tile = state.map[newY]?.[newX];
    if (!tile || !isWalkable(tile)) return;

    const monster = state.monsters.find((m) => m.x === newX && m.y === newY);
    if (monster) {
      set({
        isInCombat: true,
        currentMonster: { ...monster },
        combatResult: null,
        combatLog: [`遭遇了 ${monster.name}！`],
        lastDamagePlayer: 0,
        lastDamageMonster: 0,
        lastExpGain: 0,
      });
      return;
    }

    if (tile === 'chest' || tile === 'specialChest') {
      get().openChest(newX, newY, tile === 'specialChest');
      return;
    }

    if (tile === 'exit' && state.monsters.length === 0) {
      set({
        player: { ...state.player, x: newX, y: newY },
        levelComplete: true,
      });
      return;
    }

    set({
      player: { ...state.player, x: newX, y: newY },
    });
  },

  movePlayerTo: (x: number, y: number) => {
    const state = get();
    if (state.isInCombat || state.gameOver || state.levelComplete) return;

    const dx = x - state.player.x;
    const dy = y - state.player.y;

    if (Math.abs(dx) + Math.abs(dy) !== 1) return;

    get().movePlayer(dx, dy);
  },

  attack: () => {
    const state = get();
    if (!state.isInCombat || !state.currentMonster || state.combatResult) return;

    const playerDamage = Math.max(
      10,
      state.player.attack - state.currentMonster.defense + Math.floor(Math.random() * 11)
    );
    const monsterDamage = Math.max(
      5,
      state.currentMonster.attack - state.player.defense + Math.floor(Math.random() * 6)
    );

    const newMonsterHp = state.currentMonster.hp - playerDamage;
    const newPlayerHp = state.player.hp - monsterDamage;

    const newLog = [
      ...state.combatLog,
      `你对 ${state.currentMonster.name} 造成了 ${playerDamage} 点伤害！`,
      `${state.currentMonster.name} 对你造成了 ${monsterDamage} 点伤害！`,
    ];

    if (newMonsterHp <= 0) {
      const expGain = 20 + Math.floor(Math.random() * 21);
      const { player: newPlayer, leveledUp } = addExp(
        { ...state.player, hp: Math.max(0, newPlayerHp) },
        expGain
      );

      let finalInventory = [...newPlayer.inventory];
      if (Math.random() < 0.3 && finalInventory.length < 5) {
        const dropItem = getRandomItem();
        finalInventory = [...finalInventory, dropItem];
        newLog.push(`战斗胜利！获得 ${expGain} 点经验，掉落了 ${dropItem.name}！`);
      } else {
        newLog.push(`战斗胜利！获得 ${expGain} 点经验！`);
      }

      if (leveledUp) {
        newLog.push(`恭喜升级！当前等级: Lv.${newPlayer.level}`);
      }

      if (newPlayer.hp <= 0) {
        set({
          player: { ...newPlayer, hp: 0 },
          currentMonster: { ...state.currentMonster, hp: 0 },
          combatResult: 'lose',
          gameOver: true,
          combatLog: [...newLog, '你被击败了...'],
          lastDamagePlayer: monsterDamage,
          lastDamageMonster: playerDamage,
          lastExpGain: expGain,
        });
        return;
      }

      const newMonsters = state.monsters.filter((m) => m.id !== state.currentMonster!.id);

      set({
        player: { ...newPlayer, inventory: finalInventory },
        monsters: newMonsters,
        currentMonster: { ...state.currentMonster, hp: 0 },
        combatResult: 'win',
        monstersKilled: state.monstersKilled + 1,
        totalMonstersKilled: state.totalMonstersKilled + 1,
        combatLog: newLog,
        lastDamagePlayer: monsterDamage,
        lastDamageMonster: playerDamage,
        lastExpGain: expGain,
      });
      return;
    }

    if (newPlayerHp <= 0) {
      set({
        player: { ...state.player, hp: 0 },
        currentMonster: { ...state.currentMonster, hp: newMonsterHp },
        combatResult: 'lose',
        gameOver: true,
        combatLog: [...newLog, '你被击败了...'],
        lastDamagePlayer: monsterDamage,
        lastDamageMonster: playerDamage,
        lastExpGain: 0,
      });
      return;
    }

    set({
      player: { ...state.player, hp: newPlayerHp },
      currentMonster: { ...state.currentMonster, hp: newMonsterHp },
      combatLog: newLog,
      lastDamagePlayer: monsterDamage,
      lastDamageMonster: playerDamage,
      lastExpGain: 0,
    });
  },

  flee: () => {
    const state = get();
    if (!state.isInCombat || !state.currentMonster || state.combatResult) return;

    const success = Math.random() < 0.6;

    if (success) {
      set({
        combatResult: 'flee',
        combatLog: [...state.combatLog, '逃跑成功！'],
        lastDamagePlayer: 0,
        lastDamageMonster: 0,
        lastExpGain: 0,
      });
    } else {
      const monsterDamage = Math.max(
        3,
        state.currentMonster.attack - state.player.defense + Math.floor(Math.random() * 4)
      );
      const newPlayerHp = state.player.hp - monsterDamage;

      if (newPlayerHp <= 0) {
        set({
          player: { ...state.player, hp: 0 },
          combatResult: 'lose',
          gameOver: true,
          combatLog: [
            ...state.combatLog,
            `逃跑失败！${state.currentMonster.name} 趁机攻击，造成 ${monsterDamage} 点伤害！`,
            '你被击败了...',
          ],
          lastDamagePlayer: monsterDamage,
          lastDamageMonster: 0,
          lastExpGain: 0,
        });
        return;
      }

      set({
        player: { ...state.player, hp: newPlayerHp },
        combatLog: [
          ...state.combatLog,
          `逃跑失败！${state.currentMonster.name} 趁机攻击，造成 ${monsterDamage} 点伤害！`,
        ],
        lastDamagePlayer: monsterDamage,
        lastDamageMonster: 0,
        lastExpGain: 0,
      });
    }
  },

  closeCombat: () => {
    const state = get();
    if (!state.combatResult) return;

    if (state.combatResult === 'win' || state.combatResult === 'flee') {
      set({
        isInCombat: false,
        currentMonster: null,
        combatResult: null,
        combatLog: [],
      });
    }
  },

  nextLevel: () => {
    const state = get();
    const newLevel = state.currentLevel + 1;
    const newSeed = state.seed + newLevel;
    const { map, monsters, entrance } = generateDungeon(newSeed, newLevel);

    set({
      player: { ...state.player, x: entrance.x, y: entrance.y },
      map,
      monsters,
      currentLevel: newLevel,
      monstersKilled: 0,
      levelComplete: false,
      seed: newSeed,
      isInCombat: false,
      currentMonster: null,
      combatResult: null,
      combatLog: [],
    });
  },

  restartGame: () => {
    get().initGame();
  },

  useItem: (index: number) => {
    const state = get();
    const item = state.player.inventory[index];
    if (!item) return;

    let newPlayer = { ...state.player };
    const newInventory = [...state.player.inventory];

    switch (item.type) {
      case 'potion':
        newPlayer.hp = Math.min(newPlayer.maxHp, newPlayer.hp + 30);
        break;
      case 'weapon':
        newPlayer.attack += 5;
        break;
      case 'shield':
        newPlayer.defense += 3;
        break;
      case 'key':
        return;
    }

    newInventory.splice(index, 1);
    newPlayer.inventory = newInventory;

    set({ player: newPlayer });
  },

  openChest: (x: number, y: number, isSpecial: boolean) => {
    const state = get();
    if (state.player.inventory.length >= 5) return;

    if (isSpecial) {
      const hasKey = state.player.inventory.some((item) => item.type === 'key');
      if (!hasKey) return;

      const keyIndex = state.player.inventory.findIndex((item) => item.type === 'key');
      const newInventory = [...state.player.inventory];
      newInventory.splice(keyIndex, 1);

      const specialItem = getSpecialItem();
      newInventory.push(specialItem);

      const newMap = state.map.map((row) => [...row]);
      newMap[y][x] = 'floor';

      set({
        player: { ...state.player, inventory: newInventory, x, y },
        map: newMap,
      });
    } else {
      const item = getRandomItem();
      const newInventory = [...state.player.inventory, item];

      const newMap = state.map.map((row) => [...row]);
      newMap[y][x] = 'floor';

      set({
        player: { ...state.player, inventory: newInventory, x, y },
        map: newMap,
      });
    }
  },
}));
