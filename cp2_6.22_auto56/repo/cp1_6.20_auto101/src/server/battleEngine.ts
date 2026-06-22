
import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ==================== 类型定义 ====================

export interface HexCoord {
  q: number;
  r: number;
}

export type TerrainType = 'plain' | 'forest' | 'rock' | 'river' | 'swamp';

export interface TerrainCell {
  type: TerrainType;
  moveCost: number;
  defenseBonus: number;
  attackBonus: number;
}

export type SkillType = 'damage' | 'heal' | 'buff' | 'shield';
export type AreaType = 'single' | 'circle' | 'fan';

export interface Skill {
  id: string;
  name: string;
  type: SkillType;
  range: number;
  areaType: AreaType;
  areaSize: number;
  power: number;
  cooldown: number;
  currentCooldown: number;
  description: string;
  icon: string;
}

export type BuffEffect = 'attack' | 'defense' | 'speed' | 'shield' | 'dot' | 'hot';

export interface Buff {
  id: string;
  name: string;
  type: 'buff' | 'debuff';
  effect: BuffEffect;
  value: number;
  duration: number;
  icon: string;
}

export interface Unit {
  id: string;
  name: string;
  faction: 'player' | 'enemy';
  position: HexCoord;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  moveRange: number;
  skills: Skill[];
  buffs: Buff[];
  hasActed: boolean;
  hasMoved: boolean;
}

export type LogType = 'player' | 'enemy' | 'system';

export interface BattleLog {
  id: string;
  timestamp: number;
  type: LogType;
  message: string;
}

export interface BattleState {
  grid: TerrainCell[][];
  units: Unit[];
  turnOrder: string[];
  currentTurnIndex: number;
  round: number;
  logs: BattleLog[];
  gameOver: boolean;
  winner?: 'player' | 'enemy';
}

export interface ActionRequest {
  unitId: string;
  actionType: 'move' | 'skill' | 'endTurn';
  targetPosition?: HexCoord;
  skillId?: string;
  targetUnitId?: string;
}

// ==================== 地形配置 ====================

const terrainConfig: Record<TerrainType, Omit<TerrainCell, 'type'>> = {
  plain: { moveCost: 1, defenseBonus: 0, attackBonus: 0 },
  forest: { moveCost: 2, defenseBonus: 2, attackBonus: 0 },
  rock: { moveCost: 3, defenseBonus: 3, attackBonus: -1 },
  river: { moveCost: 2, defenseBonus: -1, attackBonus: 0 },
  swamp: { moveCost: 3, defenseBonus: 0, attackBonus: -1 },
};

// ==================== 技能模板 ====================

const createFireball = (): Skill => ({
  id: uuidv4(),
  name: '火焰弹',
  type: 'damage',
  range: 3,
  areaType: 'circle',
  areaSize: 1,
  power: 25,
  cooldown: 0,
  currentCooldown: 0,
  description: '发射一枚火焰弹，对目标及其周围造成火焰伤害',
  icon: '🔥',
});

const createHealWave = (): Skill => ({
  id: uuidv4(),
  name: '治疗波',
  type: 'heal',
  range: 2,
  areaType: 'circle',
  areaSize: 1,
  power: 20,
  cooldown: 2,
  currentCooldown: 0,
  description: '释放治疗波，恢复目标及其周围友军的生命值',
  icon: '💚',
});

const createShield = (): Skill => ({
  id: uuidv4(),
  name: '护盾',
  type: 'shield',
  range: 1,
  areaType: 'single',
  areaSize: 0,
  power: 30,
  cooldown: 3,
  currentCooldown: 0,
  description: '为目标施加护盾，吸收一定伤害',
  icon: '🛡️',
});

const createHeavyStrike = (): Skill => ({
  id: uuidv4(),
  name: '重击',
  type: 'damage',
  range: 1,
  areaType: 'single',
  areaSize: 0,
  power: 35,
  cooldown: 1,
  currentCooldown: 0,
  description: '对单个目标造成沉重打击',
  icon: '⚔️',
});

const createArrowRain = (): Skill => ({
  id: uuidv4(),
  name: '箭雨',
  type: 'damage',
  range: 4,
  areaType: 'circle',
  areaSize: 2,
  power: 15,
  cooldown: 2,
  currentCooldown: 0,
  description: '召唤箭雨，对范围内所有敌人造成伤害',
  icon: '🏹',
});

// ==================== 六边形工具函数 ====================

const hexDirections: HexCoord[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

function hexDistance(a: HexCoord, b: HexCoord): number {
  return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}

function hexAdd(a: HexCoord, b: HexCoord): HexCoord {
  return { q: a.q + b.q, r: a.r + b.r };
}

function isValidHex(hex: HexCoord, gridSize: number): boolean {
  return hex.q >= 0 && hex.q < gridSize && hex.r >= 0 && hex.r < gridSize;
}

function getHexNeighbors(hex: HexCoord, gridSize: number): HexCoord[] {
  return hexDirections
    .map(dir => hexAdd(hex, dir))
    .filter(h => isValidHex(h, gridSize));
}

// ==================== 战斗状态 ====================

let battleState: BattleState | null = null;
const GRID_SIZE = 8;

// ==================== 生成初始地图 ====================

function generateGrid(): TerrainCell[][] {
  const grid: TerrainCell[][] = [];
  const terrainTypes: TerrainType[] = ['plain', 'forest', 'rock', 'river', 'swamp'];
  
  for (let r = 0; r < GRID_SIZE; r++) {
    grid[r] = [];
    for (let q = 0; q < GRID_SIZE; q++) {
      const rand = Math.random();
      let type: TerrainType = 'plain';
      if (rand < 0.6) type = 'plain';
      else if (rand < 0.75) type = 'forest';
      else if (rand < 0.85) type = 'rock';
      else if (rand < 0.93) type = 'river';
      else type = 'swamp';
      
      const config = terrainConfig[type];
      grid[r][q] = { type, ...config };
    }
  }
  
  grid[3][1] = { type: 'plain', ...terrainConfig.plain };
  grid[4][1] = { type: 'plain', ...terrainConfig.plain };
  grid[3][2] = { type: 'plain', ...terrainConfig.plain };
  grid[4][2] = { type: 'plain', ...terrainConfig.plain };
  
  grid[3][6] = { type: 'plain', ...terrainConfig.plain };
  grid[4][6] = { type: 'plain', ...terrainConfig.plain };
  grid[3][5] = { type: 'plain', ...terrainConfig.plain };
  grid[4][5] = { type: 'plain', ...terrainConfig.plain };
  
  return grid;
}

// ==================== 创建单位 ====================

function createUnit(
  name: string,
  faction: 'player' | 'enemy',
  position: HexCoord,
  stats: { hp: number; attack: number; defense: number; speed: number; moveRange: number },
  skills: Skill[]
): Unit {
  return {
    id: uuidv4(),
    name,
    faction,
    position,
    hp: stats.hp,
    maxHp: stats.hp,
    attack: stats.attack,
    defense: stats.defense,
    speed: stats.speed,
    moveRange: stats.moveRange,
    skills,
    buffs: [],
    hasActed: false,
    hasMoved: false,
  };
}

// ==================== 初始化战斗 ====================

function initBattle(): BattleState {
  const grid = generateGrid();
  
  const playerUnits: Unit[] = [
    createUnit('战士', 'player', { q: 1, r: 3 }, 
      { hp: 120, attack: 25, defense: 15, speed: 8, moveRange: 3 },
      [createHeavyStrike(), createShield(), createFireball()]
    ),
    createUnit('弓箭手', 'player', { q: 1, r: 4 },
      { hp: 80, attack: 30, defense: 8, speed: 10, moveRange: 4 },
      [createArrowRain(), createFireball(), createHeavyStrike()]
    ),
    createUnit('牧师', 'player', { q: 2, r: 4 },
      { hp: 70, attack: 15, defense: 10, speed: 7, moveRange: 3 },
      [createHealWave(), createShield(), createFireball()]
    ),
  ];
  
  const enemyUnits: Unit[] = [
    createUnit('兽人战士', 'enemy', { q: 6, r: 3 },
      { hp: 100, attack: 22, defense: 12, speed: 7, moveRange: 3 },
      [createHeavyStrike(), createShield()]
    ),
    createUnit('兽人法师', 'enemy', { q: 6, r: 4 },
      { hp: 65, attack: 28, defense: 6, speed: 9, moveRange: 2 },
      [createFireball(), createArrowRain()]
    ),
    createUnit('兽人弓手', 'enemy', { q: 5, r: 4 },
      { hp: 70, attack: 25, defense: 7, speed: 8, moveRange: 3 },
      [createArrowRain(), createHeavyStrike()]
    ),
  ];
  
  const allUnits = [...playerUnits, ...enemyUnits];
  const turnOrder = calculateTurnOrder(allUnits);
  
  const logs: BattleLog[] = [
    {
      id: uuidv4(),
      timestamp: Date.now(),
      type: 'system',
      message: '⚔️ 战斗开始！',
    },
  ];
  
  return {
    grid,
    units: allUnits,
    turnOrder,
    currentTurnIndex: 0,
    round: 1,
    logs,
    gameOver: false,
  };
}

function calculateTurnOrder(units: Unit[]): string[] {
  return [...units]
    .sort((a, b) => b.speed - a.speed)
    .map(u => u.id);
}

// ==================== 移动范围计算 ====================

function getReachableHexes(unit: Unit, grid: TerrainCell[][]): HexCoord[] {
  const reachable: HexCoord[] = [];
  const visited = new Map<string, number>();
  const queue: { hex: HexCoord; cost: number }[] = [{ hex: unit.position, cost: 0 }];
  
  const key = (h: HexCoord) => `${h.q},${h.r}`;
  visited.set(key(unit.position), 0);
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    
    if (current.cost > 0) {
      reachable.push(current.hex);
    }
    
    if (current.cost >= unit.moveRange) continue;
    
    const neighbors = getHexNeighbors(current.hex, GRID_SIZE);
    for (const neighbor of neighbors) {
      const terrain = grid[neighbor.r][neighbor.q];
      const newCost = current.cost + terrain.moveCost;
      
      if (newCost <= unit.moveRange) {
        const k = key(neighbor);
        if (!visited.has(k) || visited.get(k)! > newCost) {
          visited.set(k, newCost);
          queue.push({ hex: neighbor, cost: newCost });
        }
      }
    }
  }
  
  return reachable.filter(h => {
    const hasUnit = battleState?.units.some(u => 
      u.position.q === h.q && u.position.r === h.r && u.hp > 0
    );
    return !hasUnit;
  });
}

// ==================== 技能范围计算 ====================

function getSkillTargets(unit: Unit, skill: Skill, grid: TerrainCell[][]): HexCoord[] {
  const targets: HexCoord[] = [];
  
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let q = 0; q < GRID_SIZE; q++) {
      const hex = { q, r };
      const dist = hexDistance(unit.position, hex);
      if (dist <= skill.range && dist > 0) {
        targets.push(hex);
      }
    }
  }
  
  return targets;
}

function getSkillArea(center: HexCoord, skill: Skill): HexCoord[] {
  if (skill.areaType === 'single') {
    return [center];
  }
  
  const area: HexCoord[] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let q = 0; q < GRID_SIZE; q++) {
      const hex = { q, r };
      if (hexDistance(center, hex) <= skill.areaSize) {
        area.push(hex);
      }
    }
  }
  return area;
}

// ==================== 伤害计算 ====================

function calculateDamage(attacker: Unit, defender: Unit, skill: Skill, grid: TerrainCell[][]): { damage: number; isCrit: boolean } {
  const attackerTerrain = grid[attacker.position.r][attacker.position.q];
  const defenderTerrain = grid[defender.position.r][defender.position.q];
  
  let attackPower = attacker.attack + skill.power + attackerTerrain.attackBonus;
  let defensePower = defender.defense + defenderTerrain.defenseBonus;
  
  const attackBuff = attacker.buffs.find(b => b.effect === 'attack');
  if (attackBuff) attackPower += attackBuff.value;
  
  const defenseBuff = defender.buffs.find(b => b.effect === 'defense');
  if (defenseBuff) defensePower += defenseBuff.value;
  
  const isCrit = Math.random() < 0.15;
  
  let damage = Math.max(1, Math.floor(attackPower - defensePower * 0.5));
  if (isCrit) damage = Math.floor(damage * 1.5);
  
  return { damage, isCrit };
}

// ==================== 执行技能 ====================

function executeSkill(
  state: BattleState,
  unit: Unit,
  skill: Skill,
  targetHex: HexCoord
): BattleState {
  const newState = deepCloneState(state);
  const newUnit = newState.units.find(u => u.id === unit.id)!;
  const newSkill = newUnit.skills.find(s => s.id === skill.id)!;
  
  newSkill.currentCooldown = newSkill.cooldown;
  newUnit.hasActed = true;
  
  const area = getSkillArea(targetHex, skill);
  
  if (skill.type === 'damage') {
    const targets = newState.units.filter(u => 
      u.faction !== unit.faction && 
      u.hp > 0 &&
      area.some(h => h.q === u.position.q && h.r === u.position.r)
    );
    
    for (const target of targets) {
      const { damage, isCrit } = calculateDamage(newUnit, target, newSkill, newState.grid);
      
      const shieldBuff = target.buffs.find(b => b.effect === 'shield');
      if (shieldBuff) {
        if (shieldBuff.value >= damage) {
          shieldBuff.value -= damage;
          newState.logs.push({
            id: uuidv4(),
            timestamp: Date.now(),
            type: unit.faction === 'player' ? 'player' : 'enemy',
            message: `${unit.name} 使用 ${skill.name} 对 ${target.name} 造成 ${damage} 点伤害，被护盾吸收！`,
          });
          continue;
        } else {
          const remainingDamage = damage - shieldBuff.value;
          target.buffs = target.buffs.filter(b => b.id !== shieldBuff.id);
          target.hp = Math.max(0, target.hp - remainingDamage);
          newState.logs.push({
            id: uuidv4(),
            timestamp: Date.now(),
            type: unit.faction === 'player' ? 'player' : 'enemy',
            message: `${unit.name} 使用 ${skill.name} 对 ${target.name} 造成 ${damage} 点伤害${isCrit ? '（暴击！）' : ''}，护盾破碎！`,
          });
        }
      } else {
        target.hp = Math.max(0, target.hp - damage);
        newState.logs.push({
          id: uuidv4(),
          timestamp: Date.now(),
          type: unit.faction === 'player' ? 'player' : 'enemy',
          message: `${unit.name} 使用 ${skill.name} 对 ${target.name} 造成 ${damage} 点伤害${isCrit ? '（暴击！）' : ''}`,
        });
      }
      
      if (target.hp <= 0) {
        newState.logs.push({
          id: uuidv4(),
          timestamp: Date.now(),
          type: 'system',
          message: `💀 ${target.name} 被击败了！`,
        });
      }
    }
  } else if (skill.type === 'heal') {
    const targets = newState.units.filter(u => 
      u.faction === unit.faction && 
      u.hp > 0 && u.hp < u.maxHp &&
      area.some(h => h.q === u.position.q && h.r === u.position.r)
    );
    
    for (const target of targets) {
      const healAmount = Math.min(skill.power, target.maxHp - target.hp);
      target.hp += healAmount;
      newState.logs.push({
        id: uuidv4(),
        timestamp: Date.now(),
        type: unit.faction === 'player' ? 'player' : 'enemy',
        message: `${unit.name} 使用 ${skill.name} 为 ${target.name} 恢复 ${healAmount} 点生命`,
      });
    }
  } else if (skill.type === 'shield') {
    const target = newState.units.find(u => 
      u.faction === unit.faction && 
      u.hp > 0 &&
      u.position.q === targetHex.q && u.position.r === targetHex.r
    );
    
    if (target) {
      const existingShield = target.buffs.find(b => b.effect === 'shield');
      if (existingShield) {
        existingShield.value = Math.max(existingShield.value, skill.power);
      } else {
        target.buffs.push({
          id: uuidv4(),
          name: '护盾',
          type: 'buff',
          effect: 'shield',
          value: skill.power,
          duration: 3,
          icon: '🛡️',
        });
      }
      newState.logs.push({
        id: uuidv4(),
        timestamp: Date.now(),
        type: unit.faction === 'player' ? 'player' : 'enemy',
        message: `${unit.name} 使用 ${skill.name} 为 ${target.name} 施加了 ${skill.power} 点护盾`,
      });
    }
  }
  
  return checkGameOver(newState);
}

// ==================== 执行移动 ====================

function executeMove(state: BattleState, unit: Unit, targetPosition: HexCoord): BattleState {
  const newState = deepCloneState(state);
  const newUnit = newState.units.find(u => u.id === unit.id)!;
  
  newUnit.position = { ...targetPosition };
  newUnit.hasMoved = true;
  
  newState.logs.push({
    id: uuidv4(),
    timestamp: Date.now(),
    type: unit.faction === 'player' ? 'player' : 'enemy',
    message: `${unit.name} 移动到了新的位置`,
  });
  
  return newState;
}

// ==================== 回合结束 ====================

function endTurn(state: BattleState): BattleState {
  let newState = deepCloneState(state);
  
  const currentUnitId = newState.turnOrder[newState.currentTurnIndex];
  const currentUnit = newState.units.find(u => u.id === currentUnitId);
  
  if (currentUnit) {
    currentUnit.hasActed = true;
    
    currentUnit.skills.forEach(skill => {
      if (skill.currentCooldown > 0) {
        skill.currentCooldown--;
      }
    });
    
    currentUnit.buffs = currentUnit.buffs.filter(buff => {
      buff.duration--;
      return buff.duration > 0;
    });
  }
  
  let nextIndex = newState.currentTurnIndex + 1;
  
  if (nextIndex >= newState.turnOrder.length) {
    nextIndex = 0;
    newState.round++;
    
    newState.units.forEach(u => {
      u.hasActed = false;
      u.hasMoved = false;
    });
    
    newState.turnOrder = calculateTurnOrder(
      newState.units.filter(u => u.hp > 0)
    );
    
    newState.logs.push({
      id: uuidv4(),
      timestamp: Date.now(),
      type: 'system',
      message: `📜 第 ${newState.round} 回合开始`,
    });
  }
  
  newState.currentTurnIndex = nextIndex;
  
  while (true) {
    const nextUnitId = newState.turnOrder[newState.currentTurnIndex];
    const nextUnit = newState.units.find(u => u.id === nextUnitId);
    
    if (!nextUnit || nextUnit.hp <= 0) {
      if (newState.currentTurnIndex >= newState.turnOrder.length - 1) {
        nextIndex = 0;
        newState.round++;
        newState.units.forEach(u => {
          u.hasActed = false;
          u.hasMoved = false;
        });
        newState.turnOrder = calculateTurnOrder(
          newState.units.filter(u => u.hp > 0)
        );
        newState.logs.push({
          id: uuidv4(),
          timestamp: Date.now(),
          type: 'system',
          message: `📜 第 ${newState.round} 回合开始`,
        });
      } else {
        newState.currentTurnIndex++;
      }
      continue;
    }
    break;
  }
  
  newState = checkGameOver(newState);
  
  return newState;
}

// ==================== 检查游戏结束 ====================

function checkGameOver(state: BattleState): BattleState {
  const playerUnitsAlive = state.units.filter(u => u.faction === 'player' && u.hp > 0);
  const enemyUnitsAlive = state.units.filter(u => u.faction === 'enemy' && u.hp > 0);
  
  if (playerUnitsAlive.length === 0) {
    state.gameOver = true;
    state.winner = 'enemy';
    state.logs.push({
      id: uuidv4(),
      timestamp: Date.now(),
      type: 'system',
      message: '💔 战斗结束，敌方获胜！',
    });
  } else if (enemyUnitsAlive.length === 0) {
    state.gameOver = true;
    state.winner = 'player';
    state.logs.push({
      id: uuidv4(),
      timestamp: Date.now(),
      type: 'system',
      message: '🎉 战斗结束，玩家获胜！',
    });
  }
  
  return state;
}

// ==================== AI 决策 ====================

function aiDecision(state: BattleState, unit: Unit): ActionRequest | null {
  const playerUnits = state.units.filter(u => u.faction === 'player' && u.hp > 0);
  if (playerUnits.length === 0) return null;
  
  let nearestTarget: Unit | null = null;
  let minDistance = Infinity;
  
  for (const target of playerUnits) {
    const dist = hexDistance(unit.position, target.position);
    if (dist < minDistance) {
      minDistance = dist;
      nearestTarget = target;
    }
  }
  
  if (!nearestTarget) return null;
  
  const availableSkills = unit.skills.filter(s => s.currentCooldown === 0);
  
  for (const skill of availableSkills.sort((a, b) => b.power - a.power)) {
    if (minDistance <= skill.range) {
      return {
        unitId: unit.id,
        actionType: 'skill',
        skillId: skill.id,
        targetPosition: nearestTarget.position,
      };
    }
  }
  
  if (!unit.hasMoved) {
    const reachable = getReachableHexes(unit, state.grid);
    
    let bestHex: HexCoord | null = null;
    let bestDistance = Infinity;
    
    for (const hex of reachable) {
      const dist = hexDistance(hex, nearestTarget.position);
      if (dist < bestDistance) {
        bestDistance = dist;
        bestHex = hex;
      }
    }
    
    if (bestHex && bestDistance < minDistance) {
      return {
        unitId: unit.id,
        actionType: 'move',
        targetPosition: bestHex,
      };
    }
  }
  
  return {
    unitId: unit.id,
    actionType: 'endTurn',
  };
}

// ==================== 深拷贝 ====================

function deepCloneState(state: BattleState): BattleState {
  return JSON.parse(JSON.stringify(state));
}

// ==================== API 路由 ====================

app.get('/api/init', (_req: Request, res: Response) => {
  battleState = initBattle();
  res.json(battleState);
});

app.post('/api/act', (req: Request, res: Response) => {
  if (!battleState) {
    battleState = initBattle();
  }
  
  const action: ActionRequest = req.body;
  const unit = battleState.units.find(u => u.id === action.unitId);
  
  if (!unit || unit.hp <= 0) {
    res.status(400).json({ error: '无效的单位' });
    return;
  }
  
  if (action.actionType === 'move') {
    if (unit.hasMoved) {
      res.status(400).json({ error: '该单位本回合已移动' });
      return;
    }
    
    if (!action.targetPosition) {
      res.status(400).json({ error: '缺少目标位置' });
      return;
    }
    
    const reachable = getReachableHexes(unit, battleState.grid);
    const isValidTarget = reachable.some(
      h => h.q === action.targetPosition!.q && h.r === action.targetPosition!.r
    );
    
    if (!isValidTarget) {
      res.status(400).json({ error: '目标位置不可达' });
      return;
    }
    
    battleState = executeMove(battleState, unit, action.targetPosition);
  } else if (action.actionType === 'skill') {
    if (unit.hasActed) {
      res.status(400).json({ error: '该单位本回合已行动' });
      return;
    }
    
    if (!action.skillId || !action.targetPosition) {
      res.status(400).json({ error: '缺少技能ID或目标位置' });
      return;
    }
    
    const skill = unit.skills.find(s => s.id === action.skillId);
    if (!skill) {
      res.status(400).json({ error: '无效的技能' });
      return;
    }
    
    if (skill.currentCooldown > 0) {
      res.status(400).json({ error: '技能冷却中' });
      return;
    }
    
    const dist = hexDistance(unit.position, action.targetPosition);
    if (dist > skill.range) {
      res.status(400).json({ error: '目标超出技能范围' });
      return;
    }
    
    battleState = executeSkill(battleState, unit, skill, action.targetPosition);
    battleState = endTurn(battleState);
  } else if (action.actionType === 'endTurn') {
    battleState = endTurn(battleState);
  }
  
  res.json(battleState);
});

app.get('/api/reachable/:unitId', (req: Request, res: Response) => {
  if (!battleState) {
    res.status(400).json({ error: '战斗未初始化' });
    return;
  }
  
  const unit = battleState.units.find(u => u.id === req.params.unitId);
  if (!unit) {
    res.status(400).json({ error: '无效的单位' });
    return;
  }
  
  const reachable = getReachableHexes(unit, battleState.grid);
  res.json(reachable);
});

const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Battle engine server running on port ${PORT}`);
  });
}

export default app;

