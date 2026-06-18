import { create } from 'zustand';
import type {
  Room,
  Player,
  Monster,
  Item,
  BattleState,
  Direction,
  SkillType,
  ItemType,
} from './types';
import { MAP_SIZE, ITEM_TEMPLATES, MONSTER_NAMES } from './types';

interface GameStore {
  floor: number;
  map: Room[][];
  player: Player;
  battle: BattleState;
  isMoving: boolean;
  screenShake: boolean;
  damageVignette: boolean;
  pickingUpItem: Item | null;
  gameOver: boolean;
  initGame: () => void;
  movePlayer: (dir: Direction) => void;
  useSkill: (skill: SkillType) => void;
  pickupTreasure: () => void;
  nextFloor: () => void;
  restartGame: () => void;
}

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const uid = () => Math.random().toString(36).slice(2, 10);

const createMonster = (): Monster => {
  const hp = randInt(30, 60);
  return {
    id: uid(),
    name: MONSTER_NAMES[randInt(0, MONSTER_NAMES.length - 1)],
    hp,
    maxHp: hp,
    attack: randInt(5, 10),
    isHit: false,
  };
};

const createRandomItem = (): Item => {
  const types: ItemType[] = ['heal_potion', 'energy_potion', 'attack_boost'];
  const type = types[randInt(0, types.length - 1)];
  return { id: uid(), ...ITEM_TEMPLATES[type] };
};

const generateMap = (): { map: Room[][]; startX: number; startY: number } => {
  const map: Room[][] = [];
  for (let y = 0; y < MAP_SIZE; y++) {
    const row: Room[] = [];
    for (let x = 0; x < MAP_SIZE; x++) {
      row.push({
        x,
        y,
        type: 'wall',
        visited: false,
        hasMonster: false,
        hasTreasure: false,
      });
    }
    map.push(row);
  }

  const startX = randInt(0, 2);
  const startY = randInt(0, 2);
  const endX = randInt(MAP_SIZE - 3, MAP_SIZE - 1);
  const endY = randInt(MAP_SIZE - 3, MAP_SIZE - 1);

  const carve = (x: number, y: number) => {
    if (x < 0 || x >= MAP_SIZE || y < 0 || y >= MAP_SIZE) return;
    if (map[y][x].type !== 'wall') return;
    map[y][x].type = 'corridor';
  };

  let cx = startX;
  let cy = startY;
  const path: Array<[number, number]> = [[cx, cy]];

  while (cx !== endX || cy !== endY) {
    const options: Direction[] = [];
    if (cx < endX) options.push('right');
    if (cx > endX) options.push('left');
    if (cy < endY) options.push('down');
    if (cy > endY) options.push('up');
    if (options.length === 0) break;
    const dir = options[randInt(0, options.length - 1)];
    if (dir === 'up') cy--;
    if (dir === 'down') cy++;
    if (dir === 'left') cx--;
    if (dir === 'right') cx++;
    carve(cx, cy);
    path.push([cx, cy]);
  }

  for (const [px, py] of path) {
    const neighbors: Array<[number, number, Direction]> = [
      [px, py - 1, 'up'],
      [px, py + 1, 'down'],
      [px - 1, py, 'left'],
      [px + 1, py, 'right'],
    ];
    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < MAP_SIZE && ny >= 0 && ny < MAP_SIZE) {
        if (map[ny][nx].type === 'wall' && Math.random() < 0.35) {
          carve(nx, ny);
        }
      }
    }
  }

  const corridorCells: Array<[number, number]> = [];
  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      if (map[y][x].type === 'corridor') corridorCells.push([x, y]);
    }
  }

  const placedTypes = new Set<string>();
  for (const [x, y] of corridorCells) {
    if (x === startX && y === startY) continue;
    if (x === endX && y === endY) continue;
    const key = `${x},${y}`;
    if (placedTypes.has(key)) continue;
    const r = Math.random();
    if (r < 0.2) {
      map[y][x].type = 'monster';
      map[y][x].hasMonster = true;
      map[y][x].monster = createMonster();
    } else if (r < 0.3) {
      map[y][x].type = 'treasure';
      map[y][x].hasTreasure = true;
      map[y][x].treasure = createRandomItem();
    } else {
      map[y][x].type = 'normal';
    }
  }

  map[startY][startX].type = 'start';
  map[startY][startX].visited = true;
  map[endY][endX].type = 'end';

  return { map, startX, startY };
};

const createInitialPlayer = (x: number, y: number): Player => ({
  x,
  y,
  hp: 100,
  maxHp: 100,
  energy: 100,
  maxEnergy: 100,
  attack: 0,
  attackBuffTurns: 0,
  inventory: [],
  isDefending: false,
  isHit: false,
});

const createInitialBattle = (): BattleState => ({
  active: false,
  monster: null,
  playerTurn: true,
  log: [],
});

export const useGameStore = create<GameStore>((set, get) => ({
  floor: 1,
  map: [],
  player: createInitialPlayer(0, 0),
  battle: createInitialBattle(),
  isMoving: false,
  screenShake: false,
  damageVignette: false,
  pickingUpItem: null,
  gameOver: false,

  initGame: () => {
    const { map, startX, startY } = generateMap();
    set({
      floor: 1,
      map,
      player: createInitialPlayer(startX, startY),
      battle: createInitialBattle(),
      isMoving: false,
      screenShake: false,
      damageVignette: false,
      pickingUpItem: null,
      gameOver: false,
    });
  },

  movePlayer: (dir: Direction) => {
    const state = get();
    if (state.isMoving || state.battle.active || state.gameOver) return;

    const dx = dir === 'left' ? -1 : dir === 'right' ? 1 : 0;
    const dy = dir === 'up' ? -1 : dir === 'down' ? 1 : 0;
    const newX = state.player.x + dx;
    const newY = state.player.y + dy;

    if (newX < 0 || newX >= MAP_SIZE || newY < 0 || newY >= MAP_SIZE) return;
    const targetRoom = state.map[newY][newX];
    if (targetRoom.type === 'wall') return;

    set({ isMoving: true });

    setTimeout(() => {
      const s = get();
      const newMap = s.map.map((row) => row.map((r) => ({ ...r })));
      newMap[newY][newX].visited = true;

      const newPlayer = { ...s.player, x: newX, y: newY };

      set({ map: newMap, player: newPlayer, isMoving: false });

      const room = newMap[newY][newX];
      if (room.type === 'monster' && room.hasMonster && room.monster) {
        set({
          battle: {
            active: true,
            monster: { ...room.monster },
            playerTurn: true,
            log: [`遭遇了 ${room.monster.name}！`],
          },
        });
      } else if (room.type === 'treasure' && room.hasTreasure && room.treasure) {
        set({ pickingUpItem: room.treasure });
        setTimeout(() => {
          const st = get();
          const m = st.map.map((row) => row.map((r) => ({ ...r })));
          m[newY][newX].hasTreasure = false;
          m[newY][newX].treasure = undefined;
          const item = st.pickingUpItem!;
          const newPlayer = { ...st.player };
          if (item.type === 'heal_potion') {
            newPlayer.hp = Math.min(newPlayer.maxHp, newPlayer.hp + 20);
          } else if (item.type === 'energy_potion') {
            newPlayer.energy = Math.min(newPlayer.maxEnergy, newPlayer.energy + 30);
          } else if (item.type === 'attack_boost') {
            newPlayer.attackBuffTurns = newPlayer.attackBuffTurns + 3;
          }
          set({
            map: m,
            player: newPlayer,
            pickingUpItem: null,
          });
        }, 500);
      } else if (room.type === 'end') {
        get().nextFloor();
      }
    }, 200);
  },

  useSkill: (skill: SkillType) => {
    const state = get();
    if (!state.battle.active || !state.battle.playerTurn || !state.battle.monster) return;

    const player = { ...state.player };
    const monster = { ...state.battle.monster };
    const log = [...state.battle.log];
    let newAttackBuff = player.attackBuffTurns;
    let bonusAtk = 0;

    if (newAttackBuff > 0) bonusAtk = 5;

    if (skill === 'attack') {
      const dmg = randInt(10, 15) + bonusAtk;
      monster.hp = Math.max(0, monster.hp - dmg);
      monster.isHit = true;
      log.push(`你对 ${monster.name} 造成 ${dmg} 点伤害！`);
      set({ screenShake: true });
      setTimeout(() => set({ screenShake: false }), 100);
      setTimeout(() => {
        const s = get();
        if (s.battle.monster) {
          set({ battle: { ...s.battle, monster: { ...s.battle.monster, isHit: false } } });
        }
      }, 300);
    } else if (skill === 'defend') {
      player.isDefending = true;
      log.push('你举起护盾进行防御！');
    } else if (skill === 'special') {
      if (player.energy < 30) {
        log.push('能量不足！');
        set({ battle: { ...state.battle, log } });
        return;
      }
      player.energy -= 30;
      const dmg = randInt(25, 30) + bonusAtk;
      monster.hp = Math.max(0, monster.hp - dmg);
      monster.isHit = true;
      log.push(`特殊技对 ${monster.name} 造成 ${dmg} 点伤害！`);
      set({ screenShake: true });
      setTimeout(() => set({ screenShake: false }), 100);
      setTimeout(() => {
        const s = get();
        if (s.battle.monster) {
          set({ battle: { ...s.battle, monster: { ...s.battle.monster, isHit: false } } });
        }
      }, 300);
    }

    if (monster.hp <= 0) {
      log.push(`${monster.name} 被击败了！`);
      const newMap = state.map.map((row) => row.map((r) => ({ ...r })));
      newMap[player.y][player.x].hasMonster = false;
      newMap[player.y][player.x].monster = undefined;
      newMap[player.y][player.x].type = 'normal';

      if (player.attackBuffTurns > 0) newAttackBuff = Math.max(0, player.attackBuffTurns - 1);

      set({
        map: newMap,
        player: { ...player, attackBuffTurns: newAttackBuff, isDefending: false },
        battle: { active: false, monster: null, playerTurn: true, log },
      });
      return;
    }

    set({
      player,
      battle: { ...state.battle, monster, playerTurn: false, log },
    });

    setTimeout(() => {
      const s = get();
      if (!s.battle.active || !s.battle.monster) return;
      const p = { ...s.player };
      const m = { ...s.battle.monster };
      const l = [...s.battle.log];
      let dmg = m.attack;
      if (p.isDefending) dmg = Math.floor(dmg / 2);
      p.hp = Math.max(0, p.hp - dmg);
      p.isHit = true;
      p.isDefending = false;
      l.push(`${m.name} 对你造成 ${dmg} 点伤害！`);

      set({ damageVignette: true });
      setTimeout(() => set({ damageVignette: false }), 200);
      setTimeout(() => {
        const ss = get();
        set({ player: { ...ss.player, isHit: false } });
      }, 300);

      if (p.hp <= 0) {
        l.push('你被击败了...');
        set({ player: p, battle: { ...s.battle, monster: m, playerTurn: true, log: l }, gameOver: true });
        return;
      }

      set({
        player: p,
        battle: { ...s.battle, monster: m, playerTurn: true, log: l },
      });
    }, 600);
  },

  pickupTreasure: () => {},

  nextFloor: () => {
    const state = get();
    const { map, startX, startY } = generateMap();
    set({
      floor: state.floor + 1,
      map,
      player: { ...state.player, x: startX, y: startY },
      battle: createInitialBattle(),
    });
  },

  restartGame: () => {
    get().initGame();
  },
}));
