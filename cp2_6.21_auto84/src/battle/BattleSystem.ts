import type {
  GameState,
  Unit,
  HexCoord,
  Faction,
  UnitClass,
  BattleLogEntry,
  Skill,
  DamagePopup,
  GridConfig,
} from '../types';
import {
  generateGrid,
  hexDistance,
  getCellsInRange,
  DEFAULT_GRID_CONFIG,
  hexKey,
} from '../map/GridEngine';
import { calculateDamage, calculateSplashDamage } from './DamageCalculator';

const UNIT_STATS: Record<UnitClass, Omit<Unit, 'id' | 'name' | 'faction' | 'position' | 'hasMoved' | 'hasAttacked'>> = {
  warrior: {
    unitClass: 'warrior',
    hp: 120,
    maxHp: 120,
    attack: 25,
    defense: 40,
    moveRange: 3,
    attackRange: 1,
    energy: 2,
    maxEnergy: 2,
    skillCooldown: 0,
  },
  archer: {
    unitClass: 'archer',
    hp: 80,
    maxHp: 80,
    attack: 30,
    defense: 15,
    moveRange: 2,
    attackRange: 3,
    energy: 2,
    maxEnergy: 2,
    skillCooldown: 0,
  },
  mage: {
    unitClass: 'mage',
    hp: 70,
    maxHp: 70,
    attack: 35,
    defense: 10,
    moveRange: 2,
    attackRange: 2,
    energy: 2,
    maxEnergy: 2,
    skillCooldown: 0,
  },
};

export const SKILLS: Record<UnitClass, Skill> = {
  warrior: {
    id: 'heavy_strike',
    name: '重击',
    description: '消耗1点能量，伤害乘1.5，冷却2回合',
    energyCost: 1,
    cooldown: 2,
    effect: { damageMultiplier: 1.5 },
  },
  archer: {
    id: 'precise_shot',
    name: '精准射击',
    description: '无视防御30%，消耗1能量，冷却3回合',
    energyCost: 1,
    cooldown: 3,
    effect: { ignoreDefensePercent: 0.3 },
  },
  mage: {
    id: 'fireball',
    name: '火球术',
    description: '对目标及相邻格子造成50%溅射伤害，消耗2能量，冷却4回合',
    energyCost: 2,
    cooldown: 4,
    effect: { splashRadius: 1, splashDamagePercent: 0.5 },
  },
};

const CLASS_NAMES: Record<UnitClass, string> = {
  warrior: '战士',
  archer: '弓箭手',
  mage: '法师',
};

const CLASS_ABBR: Record<UnitClass, string> = {
  warrior: '战',
  archer: '弓',
  mage: '法',
};

const FACTION_NAMES: Record<Faction, string> = {
  blue: '蓝方',
  red: '红方',
};

let logIdCounter = 0;
let unitIdCounter = 0;
let popupIdCounter = 0;

function createUnit(
  faction: Faction,
  unitClass: UnitClass,
  position: HexCoord,
  name: string
): Unit {
  const stats = UNIT_STATS[unitClass];
  return {
    id: `unit_${++unitIdCounter}`,
    name,
    faction,
    position,
    ...stats,
    hasMoved: false,
    hasAttacked: false,
  };
}

function getRandomClass(): UnitClass {
  const classes: UnitClass[] = ['warrior', 'archer', 'mage'];
  return classes[Math.floor(Math.random() * classes.length)];
}

export function createInitialState(): GameState {
  return {
    phase: 'idle',
    currentTurn: 0,
    currentFaction: 'blue',
    currentUnitId: null,
    selectedUnitId: null,
    selectedSkillId: null,
    units: [],
    logs: [],
    winner: null,
    moveableCells: [],
    attackableCells: [],
    damagePopups: [],
  };
}

export function getClassName(unitClass: UnitClass): string {
  return CLASS_NAMES[unitClass];
}

export function getClassAbbr(unitClass: UnitClass): string {
  return CLASS_ABBR[unitClass];
}

export function getFactionName(faction: Faction): string {
  return FACTION_NAMES[faction];
}

export function getSkill(unitClass: UnitClass): Skill {
  return SKILLS[unitClass];
}

export function deployUnits(state: GameState, gridConfig: GridConfig = DEFAULT_GRID_CONFIG): GameState {
  const units: Unit[] = [];

  const blueColumns = [0, 1];
  const redColumns = [gridConfig.cols - 2, gridConfig.cols - 1];
  const rows = [0, 2, 4];

  let blueIndex = 0;
  for (let i = 0; i < 3; i++) {
    const col = blueColumns[blueIndex % 2];
    const row = rows[i];
    const unitClass = getRandomClass();
    const name = `${FACTION_NAMES.blue}${CLASS_NAMES[unitClass]}${i + 1}`;
    units.push(createUnit('blue', unitClass, { q: col, r: row }, name));
    blueIndex++;
  }

  let redIndex = 0;
  for (let i = 0; i < 3; i++) {
    const col = redColumns[redIndex % 2];
    const row = rows[i];
    const unitClass = getRandomClass();
    const name = `${FACTION_NAMES.red}${CLASS_NAMES[unitClass]}${i + 1}`;
    units.push(createUnit('red', unitClass, { q: col, r: row }, name));
    redIndex++;
  }

  const firstBlueUnit = units.find(u => u.faction === 'blue')!;

  return {
    ...state,
    phase: 'selecting_move',
    currentTurn: 1,
    currentFaction: 'blue',
    currentUnitId: firstBlueUnit.id,
    selectedUnitId: firstBlueUnit.id,
    units,
    logs: [
      {
        id: ++logIdCounter,
        turn: 1,
        message: `第1回合 蓝方行动开始`,
        timestamp: Date.now(),
      },
    ],
    winner: null,
    moveableCells: [],
    attackableCells: [],
  };
}

export function getUnitAtPosition(units: Unit[], coord: HexCoord): Unit | undefined {
  return units.find(u => u.position.q === coord.q && u.position.r === coord.r && u.hp > 0);
}

export function getObstacleCoords(units: Unit[], excludeUnitId?: string): HexCoord[] {
  return units
    .filter(u => u.hp > 0 && u.id !== excludeUnitId)
    .map(u => u.position);
}

export function getAttackableTargets(
  attacker: Unit,
  units: Unit[],
  gridConfig: GridConfig = DEFAULT_GRID_CONFIG
): Unit[] {
  return units.filter(u => {
    if (u.id === attacker.id) return false;
    if (u.faction === attacker.faction) return false;
    if (u.hp <= 0) return false;
    const dist = hexDistance(attacker.position, u.position);
    return dist <= attacker.attackRange;
  });
}

export function getAttackableCells(
  attacker: Unit,
  units: Unit[],
  gridConfig: GridConfig = DEFAULT_GRID_CONFIG
): HexCoord[] {
  const targets = getAttackableTargets(attacker, units, gridConfig);
  return targets.map(t => t.position);
}

export function addLog(
  state: GameState,
  message: string
): GameState {
  const newLog: BattleLogEntry = {
    id: ++logIdCounter,
    turn: state.currentTurn,
    message,
    timestamp: Date.now(),
  };

  const logs = [...state.logs, newLog].slice(-30);

  return { ...state, logs };
}

export function addDamagePopup(
  state: GameState,
  unitId: string,
  damage: number,
  isCrit: boolean,
  coord: HexCoord
): GameState {
  const popup: DamagePopup = {
    id: ++popupIdCounter,
    unitId,
    damage,
    isCrit,
    coord,
  };
  return {
    ...state,
    damagePopups: [...state.damagePopups, popup],
  };
}

export function removeDamagePopup(state: GameState, popupId: number): GameState {
  return {
    ...state,
    damagePopups: state.damagePopups.filter(p => p.id !== popupId),
  };
}

export function moveUnit(
  state: GameState,
  unitId: string,
  targetCoord: HexCoord
): GameState {
  const unit = state.units.find(u => u.id === unitId);
  if (!unit || unit.hasMoved) return state;

  const fromPos = { ...unit.position };

  const newUnits = state.units.map(u =>
    u.id === unitId
      ? { ...u, position: targetCoord, hasMoved: true }
      : u
  );

  const movedUnit = newUnits.find(u => u.id === unitId)!;
  const attackableCells = getAttackableCells(movedUnit, newUnits);

  const newState = {
    ...state,
    units: newUnits,
    phase: 'selecting_attack' as const,
    attackableCells,
    moveableCells: [],
  };

  return addLog(
    newState,
    `第${state.currentTurn}回合 ${getFactionName(unit.faction)} ${unit.name} 从(${fromPos.q},${fromPos.r})移动至(${targetCoord.q},${targetCoord.r})`
  );
}

export function attackUnit(
  state: GameState,
  attackerId: string,
  defenderId: string
): GameState {
  const attacker = state.units.find(u => u.id === attackerId);
  const defender = state.units.find(u => u.id === defenderId);

  if (!attacker || !defender || attacker.hasAttacked) return state;
  if (attacker.faction === defender.faction) return state;

  const result = calculateDamage(attacker, defender);

  let newState = { ...state };

  newState.units = state.units.map(u =>
    u.id === defenderId
      ? { ...u, hp: Math.max(0, u.hp - result.damage) }
      : u.id === attackerId
      ? { ...u, hasAttacked: true, energy: Math.max(0, u.energy) }
      : u
  );

  newState = addDamagePopup(newState, defenderId, result.damage, result.isCrit, defender.position);

  const critText = result.isCrit ? '暴击！' : '';
  newState = addLog(
    newState,
    `第${state.currentTurn}回合 ${getFactionName(attacker.faction)} ${attacker.name} 攻击 ${defender.name}，${critText}造成${result.damage}点伤害`
  );

  newState = checkVictory(newState);

  if (newState.winner) {
    newState.phase = 'game_over';
  } else {
    newState = advanceTurn(newState);
  }

  return newState;
}

export function useSkill(
  state: GameState,
  attackerId: string,
  targetId: string,
  gridConfig: GridConfig = DEFAULT_GRID_CONFIG
): GameState {
  const attacker = state.units.find(u => u.id === attackerId);
  const target = state.units.find(u => u.id === targetId);

  if (!attacker || !target || attacker.hasAttacked) return state;
  if (attacker.faction === target.faction) return state;
  if (attacker.skillCooldown > 0) return state;
  if (attacker.energy < SKILLS[attacker.unitClass].energyCost) return state;

  const skill = SKILLS[attacker.unitClass];
  let newState = { ...state };

  const mainResult = calculateDamage(attacker, target, skill.effect);

  newState.units = state.units.map(u => {
    if (u.id === targetId) {
      return { ...u, hp: Math.max(0, u.hp - mainResult.damage) };
    }
    if (u.id === attackerId) {
      return {
        ...u,
        hasAttacked: true,
        energy: u.energy - skill.energyCost,
        skillCooldown: skill.cooldown,
      };
    }
    return u;
  });

  newState = addDamagePopup(newState, targetId, mainResult.damage, mainResult.isCrit, target.position);

  const critText = mainResult.isCrit ? '暴击！' : '';
  newState = addLog(
    newState,
    `第${state.currentTurn}回合 ${getFactionName(attacker.faction)} ${attacker.name} 使用【${skill.name}】攻击 ${target.name}，${critText}造成${mainResult.damage}点伤害`
  );

  if (skill.effect.splashRadius && skill.effect.splashDamagePercent) {
    const splashCells = getCellsInRange(target.position, skill.effect.splashRadius, gridConfig);
    const splashTargets = newState.units.filter(u =>
      u.hp > 0 &&
      u.id !== targetId &&
      u.faction !== attacker.faction &&
      splashCells.some(c => c.q === u.position.q && c.r === u.position.r)
    );

    for (const splashTarget of splashTargets) {
      const splashResult = calculateSplashDamage(
        attacker,
        splashTarget,
        skill.effect.splashDamagePercent,
        skill.effect
      );

      newState.units = newState.units.map(u =>
        u.id === splashTarget.id
          ? { ...u, hp: Math.max(0, u.hp - splashResult.damage) }
          : u
      );

      newState = addDamagePopup(
        newState,
        splashTarget.id,
        splashResult.damage,
        splashResult.isCrit,
        splashTarget.position
      );

      newState = addLog(
        newState,
        `溅射伤害: ${splashTarget.name} 受到${splashResult.damage}点伤害`
      );
    }
  }

  newState = checkVictory(newState);

  if (newState.winner) {
    newState.phase = 'game_over';
  } else {
    newState = advanceTurn(newState);
  }

  return newState;
}

function checkVictory(state: GameState): GameState {
  const blueAlive = state.units.filter(u => u.faction === 'blue' && u.hp > 0);
  const redAlive = state.units.filter(u => u.faction === 'red' && u.hp > 0);

  if (blueAlive.length === 0) {
    return { ...state, winner: 'red', phase: 'game_over' };
  }
  if (redAlive.length === 0) {
    return { ...state, winner: 'blue', phase: 'game_over' };
  }

  return state;
}

function advanceTurn(state: GameState): GameState {
  let newState = { ...state };
  const currentFactionUnits = state.units.filter(
    u => u.faction === state.currentFaction && u.hp > 0
  );

  const allActed = currentFactionUnits.every(u => u.hasMoved && u.hasAttacked);
  const currentUnitIndex = currentFactionUnits.findIndex(u => u.id === state.currentUnitId);

  if (allActed || currentUnitIndex === currentFactionUnits.length - 1) {
    const nextFaction: Faction = state.currentFaction === 'blue' ? 'red' : 'blue';
    const nextTurn = state.currentFaction === 'red' ? state.currentTurn + 1 : state.currentTurn;

    newState.units = state.units.map(u => {
      if (u.faction === nextFaction && u.hp > 0) {
        return {
          ...u,
          hasMoved: false,
          hasAttacked: false,
          energy: Math.min(u.maxEnergy, u.energy + 1),
          skillCooldown: Math.max(0, u.skillCooldown - 1),
        };
      }
      return u;
    });

    const nextFactionUnits = newState.units.filter(u => u.faction === nextFaction && u.hp > 0);
    const firstUnit = nextFactionUnits[0];

    newState = {
      ...newState,
      currentTurn: nextTurn,
      currentFaction: nextFaction,
      currentUnitId: firstUnit?.id || null,
      selectedUnitId: firstUnit?.id || null,
      selectedSkillId: null,
      phase: 'selecting_move' as const,
      attackableCells: [],
    };

    newState = addLog(
      newState,
      `第${nextTurn}回合 ${getFactionName(nextFaction)} 行动开始`
    );
  } else {
    const nextUnit = currentFactionUnits[currentUnitIndex + 1];
    newState = {
      ...newState,
      currentUnitId: nextUnit?.id || null,
      selectedUnitId: nextUnit?.id || null,
      selectedSkillId: null,
      phase: 'selecting_move' as const,
      attackableCells: [],
      moveableCells: [],
    };
  }

  return newState;
}

export function skipUnitTurn(state: GameState): GameState {
  const unit = state.units.find(u => u.id === state.currentUnitId);
  if (!unit) return state;

  let newState = {
    ...state,
    units: state.units.map(u =>
      u.id === state.currentUnitId
        ? { ...u, hasMoved: true, hasAttacked: true }
        : u
    ),
  };

  newState = addLog(
    newState,
    `第${state.currentTurn}回合 ${getFactionName(unit.faction)} ${unit.name} 待命`
  );

  newState = advanceTurn(newState);
  return newState;
}

export function selectSkill(state: GameState, skillId: string | null): GameState {
  return {
    ...state,
    selectedSkillId: skillId,
    phase: skillId ? 'selecting_skill_target' : 'selecting_attack',
  };
}

export function resetGame(): GameState {
  unitIdCounter = 0;
  logIdCounter = 0;
  popupIdCounter = 0;
  return createInitialState();
}

export function selectUnit(state: GameState, unitId: string | null): GameState {
  return {
    ...state,
    selectedUnitId: unitId,
  };
}
