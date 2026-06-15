/**
 * ============================================================
 * 文件: combatSystem.ts
 * 职责: 管理回合制战斗逻辑（玩家移动、怪物AI、血量计算、技能系统）
 * ============================================================
 *
 * 调用关系 & 数据流向:
 *
 *   ┌──────────────┐     事件触发      ┌──────────────────┐
 *   │   App.tsx    │ ───────────────► │  combatSystem.ts  │
 *   │  (主组件)    │                   │   (战斗系统)      │
 *   └──────┬───────┘                   └─────────┬────────┘
 *          │                                     │
 *          │  1. 用户按WASD                      │
 *          │  ─────────────────► moveMonsterTowardsPlayer()
 *          │                                     │
 *          │  2. 玩家/怪物相邻检测               │
 *          │  ─────────────────► isAdjacent() / findAdjacentMonster()
 *          │                                     │
 *          │  3. 触发战斗                        │
 *          │  ─────────────────► playerAttack() / monsterAttack()
 *          │                                     │
 *          │  4. 使用技能                        │
 *          │  ─────────────────► useSkill()
 *          │                                     │
 *          │  5. 怪物回合                        │
 *          │  ─────────────────► processMonsterTurn()
 *          │                                     │
 *          │  6. 回合结束冷却                    │
 *          │  ─────────────────► decrementSkillCooldowns()
 *          │                                     │
 *          │◄──────── 返回状态变化 (Player/Monster[])
 *          │                                     │
 *          │◄──────── 返回战斗日志 LogEntry
 *          │                                     │
 *          └──── 渲染至:
 *                - Canvas → 角色位置/HP条
 *                - 状态面板 → HP/MP进度条
 *                - 战斗日志 → 交替底色条目
 *
 * 初始化函数:
 *   createPlayer(pos) → Player    供App初始化新游戏调用
 *   createMonster(pos, idx) → Monster  供App生成怪物列表调用
 *   createLogEntry(msg, type) → LogEntry  供App写入系统日志调用
 * ============================================================
 */

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

/**
 * 创建战斗日志条目
 * 数据流向: 所有战斗相关函数调用 → 返回LogEntry → App.tsx的addLog函数写入状态
 */
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

/**
 * 创建玩家初始数据
 * 数据流向: App.tsx初始化地图后调用 → 返回Player → setPlayer存入状态
 */
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
        description: '发射一枚灼热的火球，对相邻目标造成大量伤害',
        damage: 30,
        mpCost: 15,
        cooldown: 3,
        currentCooldown: 0,
        icon: '🔥',
      },
      {
        id: 'heal',
        name: '治疗术',
        description: '用神圣之力恢复自身生命值',
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

/**
 * 创建怪物初始数据
 * 数据流向: App.tsx初始化地图后遍历调用 → 返回Monster → 存入monsters数组
 */
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

/**
 * 检测坐标是否可通行（非墙壁、在边界内）
 * 数据流向: movePlayer / moveMonsterTowardsPlayer 内部调用
 */
export function isWalkable(map: DungeonMap, x: number, y: number): boolean {
  if (x < 0 || x >= map.width || y < 0 || y >= map.height) return false;
  return map.tiles[y][x] !== TileType.WALL;
}

/**
 * 检测坐标是否被其他角色占据（玩家或存活怪物）
 * 数据流向: movePlayer / moveMonsterTowardsPlayer 内部调用
 */
export function isPositionOccupied(
  x: number,
  y: number,
  player: Player,
  monsters: Monster[]
): boolean {
  if (player.x === x && player.y === y) return true;
  return monsters.some((m) => m.hp > 0 && m.x === x && m.y === y);
}

/**
 * 检测两个位置是否相邻（曼哈顿距离=1，即上下左右）
 * 数据流向: movePlayer / processMonsterTurn 调用 → 判断是否触发攻击
 */
export function isAdjacent(a: Position, b: Position): boolean {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  return dx + dy === 1;
}

/**
 * 在相邻格子中查找存活的怪物
 * 数据流向: movePlayer / useSkill 调用 → 获取攻击目标
 */
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

/**
 * 玩家普通攻击
 * 数据流向: App.tsx中移动后检测到相邻怪物 → 调用 → 修改Monster.hp → 返回日志
 */
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

/**
 * 玩家使用技能
 * 数据流向: App.tsx技能按钮onClick → 调用 → 修改Player.hp/mp/cooldown + Monster.hp → 返回日志
 */
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
    /** 治疗技能: damage为负数表示恢复量 */
    const healAmount = Math.abs(skill.damage);
    player.hp = Math.min(player.maxHp, player.hp + healAmount);
    addLog(createLogEntry(`你使用了${skill.name}，恢复了 ${healAmount} 点生命值！`, 'player'));
  } else {
    /** 攻击技能: 需要相邻目标 */
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

/**
 * 怪物普通攻击
 * 数据流向: processMonsterTurn 检测相邻后调用 → 修改Player.hp → 返回日志
 */
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

/**
 * 怪物AI: 简单贪心追踪玩家
 * 算法: 计算到玩家的dx/dy，优先移动距离更大的轴
 * 数据流向: processMonsterTurn 遍历每个怪物调用 → 修改Monster.x/y
 */
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

  /** 优先沿距离更远的轴移动，形成贪心追踪 */
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

/**
 * 处理所有怪物的完整回合（移动+攻击）
 * 数据流向: App.tsx玩家动作结束后调用 → 遍历修改所有Monster状态 + Player.hp → 返回日志
 */
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

/**
 * 回合结束时减少技能冷却
 * 数据流向: App.tsx玩家/怪物回合完成后调用 → 修改所有Skill.currentCooldown
 */
export function decrementSkillCooldowns(player: Player): void {
  for (const skill of player.skills) {
    if (skill.currentCooldown > 0) {
      skill.currentCooldown--;
    }
  }
}
