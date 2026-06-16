import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  HexCoord,
  Unit,
  UnitClass,
  Team,
  Tile,
  TileType,
  Skill,
  VisualEffect,
  Phase,
  GameState,
} from './types/game';

const MAP_WIDTH = 12;
const MAP_HEIGHT = 10;
const HEX_SIZE = 30;

const HEX_DIRECTIONS: HexCoord[] = [
  { q: 1, r: 0 },
  { q: -1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

function hexKey(c: HexCoord): string {
  return `${c.q},${c.r}`;
}

function hexDistance(a: HexCoord, b: HexCoord): number {
  return (
    (Math.abs(a.q - b.q) +
      Math.abs(a.q + a.r - b.q - b.r) +
      Math.abs(a.r - b.r)) /
    2
  );
}

function hexNeighbors(c: HexCoord): HexCoord[] {
  return HEX_DIRECTIONS.map((d) => ({ q: c.q + d.q, r: c.r + d.r }));
}

function hexToPixel(c: HexCoord): { x: number; y: number } {
  const x = HEX_SIZE * Math.sqrt(3) * (c.q + c.r / 2);
  const y = HEX_SIZE * 1.5 * c.r;
  return { x, y };
}

function pixelToHex(x: number, y: number): HexCoord {
  const q = ((Math.sqrt(3) / 3) * x - (1 / 3) * y) / HEX_SIZE;
  const r = ((2 / 3) * y) / HEX_SIZE;
  return hexRound({ q, r });
}

function hexRound(c: { q: number; r: number }): HexCoord {
  const s = -c.q - c.r;
  let rq = Math.round(c.q);
  let rr = Math.round(c.r);
  const rs = Math.round(s);
  const qDiff = Math.abs(rq - c.q);
  const rDiff = Math.abs(rr - c.r);
  const sDiff = Math.abs(rs - s);
  if (qDiff > rDiff && qDiff > sDiff) {
    rq = -rr - rs;
  } else if (rDiff > sDiff) {
    rr = -rq - rs;
  }
  return { q: rq, r: rr };
}

function isInBounds(c: HexCoord): boolean {
  return c.q >= 0 && c.q < MAP_WIDTH && c.r >= 0 && c.r < MAP_HEIGHT;
}

function createSkills(unitClass: UnitClass): Skill[] {
  switch (unitClass) {
    case 'warrior':
      return [
        {
          id: uuidv4(),
          name: '重击',
          icon: '⚔️',
          range: 1,
          damage: 20,
          cooldown: 0,
          currentCooldown: 0,
          type: 'attack',
        },
      ];
    case 'ranger':
      return [
        {
          id: uuidv4(),
          name: '射击',
          icon: '🏹',
          range: 2,
          damage: 15,
          cooldown: 0,
          currentCooldown: 0,
          type: 'ranged_attack',
        },
      ];
    case 'mage':
      return [
        {
          id: uuidv4(),
          name: '火球术',
          icon: '🔮',
          range: 2,
          damage: 25,
          cooldown: 0,
          currentCooldown: 0,
          type: 'ranged_attack',
        },
      ];
    case 'priest':
      return [
        {
          id: uuidv4(),
          name: '治疗术',
          icon: '✨',
          range: 2,
          heal: 15,
          cooldown: 2,
          currentCooldown: 0,
          type: 'heal',
        },
        {
          id: uuidv4(),
          name: '法杖攻击',
          icon: '🔱',
          range: 1,
          damage: 10,
          cooldown: 0,
          currentCooldown: 0,
          type: 'attack',
        },
      ];
    case 'goblin':
      return [
        {
          id: uuidv4(),
          name: '匕首',
          icon: '🗡️',
          range: 1,
          damage: 12,
          cooldown: 0,
          currentCooldown: 0,
          type: 'attack',
        },
      ];
    default:
      return [];
  }
}

function createUnit(
  name: string,
  unitClass: UnitClass,
  team: Team,
  position: HexCoord
): Unit {
  const stats: Record<UnitClass, { hp: number; attack: number; moveRange: number }> = {
    warrior: { hp: 150, attack: 20, moveRange: 4 },
    ranger: { hp: 100, attack: 15, moveRange: 6 },
    mage: { hp: 80, attack: 25, moveRange: 3 },
    priest: { hp: 90, attack: 10, moveRange: 4 },
    goblin: { hp: 60, attack: 12, moveRange: 4 },
  };
  const s = stats[unitClass];
  return {
    id: uuidv4(),
    name,
    team,
    class: unitClass,
    hp: s.hp,
    maxHp: s.hp,
    attack: s.attack,
    moveRange: s.moveRange,
    position,
    hasActed: false,
    skills: createSkills(unitClass),
    spawnDelay: 0.2 + Math.random() * 0.4,
  };
}

function generateMap(): Map<string, Tile> {
  const tiles = new Map<string, Tile>();
  for (let q = 0; q < MAP_WIDTH; q++) {
    for (let r = 0; r < MAP_HEIGHT; r++) {
      const coord = { q, r };
      tiles.set(hexKey(coord), { coord, type: 'grass' });
    }
  }

  const occupied = new Set<string>();
  const playerPositions = [
    { q: 1, r: 2 },
    { q: 1, r: 4 },
    { q: 1, r: 6 },
    { q: 2, r: 3 },
  ];
  const enemyPositions = [
    { q: 10, r: 3 },
    { q: 10, r: 5 },
    { q: 9, r: 4 },
  ];
  [...playerPositions, ...enemyPositions].forEach((p) => occupied.add(hexKey(p)));

  let rockCount = 0;
  while (rockCount < 5) {
    const q = Math.floor(Math.random() * MAP_WIDTH);
    const r = Math.floor(Math.random() * MAP_HEIGHT);
    const key = hexKey({ q, r });
    if (!occupied.has(key)) {
      tiles.set(key, { coord: { q, r }, type: 'rock' });
      occupied.add(key);
      rockCount++;
    }
  }

  let bushCount = 0;
  while (bushCount < 3) {
    const q = Math.floor(Math.random() * MAP_WIDTH);
    const r = Math.floor(Math.random() * MAP_HEIGHT);
    const key = hexKey({ q, r });
    if (!occupied.has(key)) {
      tiles.set(key, { coord: { q, r }, type: 'bush', evasionBonus: 0.2 });
      occupied.add(key);
      bushCount++;
    }
  }

  return tiles;
}

function generateUnits(): Unit[] {
  const units: Unit[] = [];
  units.push(createUnit('战士·艾伦', 'warrior', 'player', { q: 1, r: 2 }));
  units.push(createUnit('游侠·莉娜', 'ranger', 'player', { q: 1, r: 4 }));
  units.push(createUnit('法师·梅林', 'mage', 'player', { q: 1, r: 6 }));
  units.push(createUnit('牧师·艾拉', 'priest', 'player', { q: 2, r: 3 }));

  const goblinNames = ['哥布林斥候', '哥布林战士', '哥布林猎手'];
  const goblinPositions = [
    { q: 10, r: 3 },
    { q: 10, r: 5 },
    { q: 9, r: 4 },
  ];
  goblinNames.forEach((name, i) => {
    units.push(createUnit(name, 'goblin', 'enemy', goblinPositions[i]));
  });

  return units;
}

function computeMoveRange(
  unit: Unit,
  tiles: Map<string, Tile>,
  units: Unit[]
): HexCoord[] {
  const result: HexCoord[] = [];
  const visited = new Map<string, number>();
  const queue: { coord: HexCoord; cost: number }[] = [
    { coord: unit.position, cost: 0 },
  ];
  visited.set(hexKey(unit.position), 0);

  const occupiedPositions = new Set(
    units.filter((u) => u.id !== unit.id).map((u) => hexKey(u.position))
  );

  while (queue.length > 0) {
    const { coord, cost } = queue.shift()!;
    if (cost > 0) {
      result.push(coord);
    }
    if (cost >= unit.moveRange) continue;

    for (const neighbor of hexNeighbors(coord)) {
      const key = hexKey(neighbor);
      if (!isInBounds(neighbor)) continue;
      const tile = tiles.get(key);
      if (!tile || tile.type === 'rock') continue;
      if (occupiedPositions.has(key)) continue;
      const newCost = cost + 1;
      if (visited.has(key) && visited.get(key)! <= newCost) continue;
      visited.set(key, newCost);
      queue.push({ coord: neighbor, cost: newCost });
    }
  }

  return result;
}

function findPath(
  from: HexCoord,
  to: HexCoord,
  tiles: Map<string, Tile>,
  units: Unit[],
  excludeUnitId?: string
): HexCoord[] | null {
  if (hexKey(from) === hexKey(to)) return [];

  const visited = new Map<string, HexCoord | null>();
  visited.set(hexKey(from), null);
  const queue: HexCoord[] = [from];

  const occupiedPositions = new Set(
    units
      .filter((u) => u.id !== excludeUnitId && hexKey(u.position) !== hexKey(to))
      .map((u) => hexKey(u.position))
  );

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (hexKey(current) === hexKey(to)) {
      const path: HexCoord[] = [];
      let c: HexCoord | null = current;
      while (c && hexKey(c) !== hexKey(from)) {
        path.unshift(c);
        c = visited.get(hexKey(c)) ?? null;
      }
      return path;
    }

    for (const neighbor of hexNeighbors(current)) {
      const key = hexKey(neighbor);
      if (visited.has(key)) continue;
      if (!isInBounds(neighbor)) continue;
      const tile = tiles.get(key);
      if (!tile || tile.type === 'rock') continue;
      if (occupiedPositions.has(key)) continue;
      visited.set(key, current);
      queue.push(neighbor);
    }
  }

  return null;
}

function computeAttackRange(
  unit: Unit,
  tiles: Map<string, Tile>,
  units: Unit[]
): HexCoord[] {
  const result: HexCoord[] = [];
  const hasRanged = unit.skills.some((s) => s.type === 'ranged_attack' && s.currentCooldown === 0);
  const maxRange = hasRanged ? Math.max(...unit.skills.filter(s => s.currentCooldown === 0).map((s) => s.range)) : 1;

  for (let q = 0; q < MAP_WIDTH; q++) {
    for (let r = 0; r < MAP_HEIGHT; r++) {
      const coord = { q, r };
      if (hexKey(coord) === hexKey(unit.position)) continue;
      const dist = hexDistance(unit.position, coord);
      if (dist > 0 && dist <= maxRange) {
        const tile = tiles.get(hexKey(coord));
        if (tile && tile.type !== 'rock') {
          result.push(coord);
        }
      }
    }
  }
  return result;
}

interface GameActions {
  initGame: () => void;
  selectUnit: (unitId: string | null) => void;
  clickTile: (coord: HexCoord) => void;
  endTurn: () => void;
  resetGame: () => void;
  tick: (now: number) => void;
}

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  phase: 'player_turn',
  turn: 1,
  units: [],
  tiles: new Map(),
  selectedUnitId: null,
  moveRange: [],
  attackRange: [],
  effects: [],
  winner: null,
  killCount: 0,
  turnBanner: null,
  flashScreen: null,

  initGame: () => {
    const tiles = generateMap();
    const units = generateUnits();
    set({
      phase: 'player_turn',
      turn: 1,
      units,
      tiles,
      selectedUnitId: null,
      moveRange: [],
      attackRange: [],
      effects: [],
      winner: null,
      killCount: 0,
      turnBanner: { text: '玩家回合', showTime: performance.now() },
      flashScreen: { showTime: performance.now(), duration: 200 },
    });
  },

  selectUnit: (unitId: string | null) => {
    const state = get();
    if (!unitId) {
      set({ selectedUnitId: null, moveRange: [], attackRange: [] });
      return;
    }
    const unit = state.units.find((u) => u.id === unitId);
    if (!unit || unit.team !== 'player' || unit.hasActed || state.phase !== 'player_turn') {
      return;
    }
    const moveRange = computeMoveRange(unit, state.tiles, state.units);
    const attackRange = computeAttackRange(unit, state.tiles, state.units);
    set({ selectedUnitId: unitId, moveRange, attackRange });
  },

  clickTile: (coord: HexCoord) => {
    const state = get();
    if (state.phase !== 'player_turn' || !state.selectedUnitId) return;

    const unit = state.units.find((u) => u.id === state.selectedUnitId);
    if (!unit || unit.hasActed) return;

    const targetUnit = state.units.find(
      (u) => hexKey(u.position) === hexKey(coord) && u.hp > 0
    );

    if (targetUnit) {
      if (targetUnit.team === 'enemy') {
        const inRange = state.attackRange.some(
          (c) => hexKey(c) === hexKey(coord)
        );
        if (!inRange) return;

        const attackSkill = unit.skills.find(
          (s) => (s.type === 'attack' || s.type === 'ranged_attack') && s.currentCooldown === 0
        );
        if (!attackSkill) return;

        const tile = state.tiles.get(hexKey(targetUnit.position));
        const evasion = tile?.evasionBonus ?? 0;
        const isHit = Math.random() >= evasion;
        const now = performance.now();
        const newEffects: VisualEffect[] = [
          ...state.effects,
          {
            id: uuidv4(),
            type: 'target_mark',
            position: targetUnit.position,
            startTime: now,
            duration: 500,
          },
        ];

        if (isHit) {
          const isCrit = Math.random() < 0.1;
          const damage = Math.round(
            (attackSkill.damage ?? unit.attack) * (isCrit ? 1.5 : 1)
          );
          newEffects.push(
            {
              id: uuidv4(),
              type: 'shake',
              position: targetUnit.position,
              startTime: now + 300,
              duration: 400,
            },
            {
              id: uuidv4(),
              type: 'damage',
              position: targetUnit.position,
              value: damage,
              isCrit,
              startTime: now + 300,
              duration: 80