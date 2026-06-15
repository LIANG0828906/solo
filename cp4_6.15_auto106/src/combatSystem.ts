import { v4 as uuidv4 } from 'uuid';
import {
  Player,
  Monster,
  DungeonMap,
  LogEntry,
  Position,
  TileType,
  Skill,
} from './types';

export function createLogEntry(
  message: string,
  type: 'player' | 'enemy' | 'system'
): LogEntry {
  return {
    id: uuidv4(),
    timestamp: new Date(),
    message,
    type,
  };
}

export function createPlayer(position: Position): Player {
  return {
    x: position.x,
    y: position.y,
    hp: 100,
    maxHp: 100,
    mp: 50,
    maxMp: 50,
    attack: 15,
    skills: [
      {
        id: 'fireball',
        name: '火球术',
        description: '发射一枚灼热的火球，造成大量伤害',
        damage: 30,
        mpCost: 15,
        cooldown: 3,
        currentCooldown: 0,
        icon: '🔥',
      },
      {
        id: 'heal',
        name: '治疗术',
        description: '恢复自身生命值',
        damage: -35,
        mpCost: 20,
        cooldown: 4,
        currentCooldown: 0,
        icon: '✨',
      },
    ],
  };
}

const MONSTER_NAMES = ['史莱姆', '哥布林', '骷髅兵', '蝙蝠', '巨鼠'];

export function createMonster(position: Position, index: number): Monster {
  const baseHp = 25 + Math.floor(Math.random() * 20);
  return {
    id: uuidv4(),
    x: position.x,
    y: position.y,
    hp: baseHp,
    maxHp: baseHp,
    attack: 5 + Math.floor(Math.random() * 8),
    name: MONSTER_NAMES[index % MONSTER_NAMES.length],
  };
}

export function isWalkable(map: DungeonMap, x: number, y: number): boolean {
  if (x < 0 || x >= map.width || y < 0 || y >= map.height) return false;
  return map.tiles[y][x] !== TileType.WALL;
}

export function isPositionOccupied(
  x: number,
  y: number,
  player: Player,
  monsters: Monster[]
): boolean {
  if (player.x === x && player.y === y) return true;
  return monsters.some((m) => m.hp > 0 && m.x === x && m.y === y);
}

export function isAdjacent(a: Position, b: Position): boolean {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  return dx + dy === 1;
}

export function findAdjacentMonster(
  player: Player,
  monsters: Monster[]
): Monster | null {
  for (const monster of monsters) {
    if (monster.hp > 0 && isAdjacent(player, monster)) {
      return monster;
    }
  }
  return null;
}

export function playerAttack(
  player: Player,
  monster: Monster,
  addLog: (entry: LogEntry) => void
): void {
  const damage = player.attack + Math.floor(Math.random() * 6);
  monster.hp = Math.max(0, monster.hp - damage);
  addLog(createLogEntry(`你对${monster.name}造成了 ${damage} 点伤害！`, 'player'));
  if (monster.hp <= 0) {
    addLog(createLogEntry(`${monster.name} 被击杀了！`, 'system'));
  }
}

export function useSkill(
  player: Player,
  skill: Skill,
  monsters: Monster[],
  addLog: (entry: LogEntry) => void
): boolean {
  if (skill.currentCooldown > 0) {
    addLog(createLogEntry(`${skill.name} 正在冷却中（剩余${skill.currentCooldown}回合）`, 'system'));
    return false;
  }
  if (player.mp < skill.mpCost) {
    addLog(createLogEntry(`MP不足，无法使用 ${skill.name}`, 'system'));
    return false;
  }

  player.mp -= skill.mpCost;
  skill.currentCooldown = skill.cooldown;

  if (skill.damage < 0) {
    const healAmount = Math.abs(skill.damage);
    player.hp = Math.min(player.maxHp, player.hp + healAmount);
    addLog(createLogEntry(`你使用了${skill.name}，恢复了 ${healAmount} 点生命值！`, 'player'));
  } else {
    const target = findAdjacentMonster(player, monsters);
    if (target) {
      const damage = skill.damage + Math.floor(Math.random() * 10);
      target.hp = Math.max(0, target.hp - damage);
      addLog(createLogEntry(`你使用${skill.name}对${target.name}造成了 ${damage} 点伤害！`, 'player'));
      if (target.hp <= 0) {
        addLog(createLogEntry(`${target.name} 被击杀了！`, 'system'));
      }
    } else {
      addLog(createLogEntry(`附近没有目标，${skill.name}施放失败`, 'system'));
      player.mp += skill.mpCost;
      skill.currentCooldown = 0;
      return false;
    }
  }

  return true;
}

export function monsterAttack(
  monster: Monster,
  player: Player,
  addLog: (entry: LogEntry) => void
): void {
  const damage = monster.attack + Math.floor(Math.random() * 4);
  player.hp = Math.max(0, player.hp - damage);
  addLog(createLogEntry(`${monster.name}对你造成了 ${damage} 点伤害！`, 'enemy'));
  if (player.hp <= 0) {
    addLog(createLogEntry('你被击败了...', 'system'));
  }
}

export function moveMonsterTowardsPlayer(
  monster: Monster,
  player: Player,
  map: DungeonMap,
  monsters: Monster[]
): void {
  if (monster.hp <= 0) return;
  if (isAdjacent(monster, player)) return;

  const dx = Math.sign(player.x - monster.x);
  const dy = Math.sign(player.y - monster.y);

  const tryMoves: Position[] = [];

  if (Math.abs(player.x - monster.x) > Math.abs(player.y - monster.y)) {
    if (dx !== 0) tryMoves.push({ x: monster.x + dx, y: monster.y });
    if (dy !== 0) tryMoves.push({ x: monster.x, y: monster.y + dy });
  } else {
    if (dy !== 0) tryMoves.push({ x: monster.x, y: monster.y + dy });
    if (dx !== 0) tryMoves.push({ x: monster.x + dx, y: monster.y });
  }

  for (const move of tryMoves) {
    if (
      isWalkable(map, move.x, move.y) &&
      !isPositionOccupied(move.x, move.y, player, monsters.filter((m) => m.id !== monster.id))
    ) {
      monster.x = move.x;
      monster.y = move.y;
      return;
    }
  }
}

export function processMonsterTurn(
  monsters: Monster[],
  player: Player,
  map: DungeonMap,
  addLog: (entry: LogEntry) => void
): void {
  for (const monster of monsters) {
    if (monster.hp <= 0) continue;

    moveMonsterTowardsPlayer(monster, player, map, monsters);

    if (isAdjacent(monster, player)) {
      monsterAttack(monster, player, addLog);
    }
  }
}

export function decrementSkillCooldowns(player: Player): void {
  for (const skill of player.skills) {
    if (skill.currentCooldown > 0) {
      skill.currentCooldown--;
    }
  }
}
