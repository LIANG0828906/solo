import { v4 as uuidv4 } from 'uuid';
import type {
  Position,
  Hero,
  PlayerId,
  GameState,
  LogEntry,
  Skill,
} from '../types';

export const GRID_SIZE = 6;

export function createSkills(): Skill[] {
  return [
    {
      id: 'fire_strike',
      name: '火焰冲击',
      description: '对直线2格内敌人造成20点伤害',
      cooldown: 3,
      currentCooldown: 0,
      damage: 20,
      range: 2,
      type: 'damage',
    },
    {
      id: 'shadow_bind',
      name: '暗影束缚',
      description: '眩晕目标1回合',
      cooldown: 5,
      currentCooldown: 0,
      damage: 0,
      range: 2,
      type: 'control',
      stunDuration: 1,
    },
  ];
}

export function createHero(id: PlayerId, position: Position): Hero {
  return {
    id,
    name: id === 'player' ? '蓝焰勇者' : '赤影刺客',
    position: { ...position },
    displayPosition: { ...position },
    maxHp: 100,
    currentHp: 100,
    attack: 10,
    moveRange: 2,
    skills: createSkills(),
    stunned: 0,
    hasMoved: false,
    hasActed: false,
  };
}

export function createInitialState(): GameState {
  return {
    gridSize: GRID_SIZE,
    heroes: {
      player: createHero('player', { x: 0, y: 0 }),
      ai: createHero('ai', { x: GRID_SIZE - 1, y: GRID_SIZE - 1 }),
    },
    turn: 1,
    currentPlayer: 'player',
    phase: 'player_turn',
    logs: [],
    winner: null,
    selectedSkill: null,
    isAnimating: false,
  };
}

export function getDistance(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function isInBounds(pos: Position): boolean {
  return pos.x >= 0 && pos.x < GRID_SIZE && pos.y >= 0 && pos.y < GRID_SIZE;
}

export function isAdjacent(a: Position, b: Position): boolean {
  return getDistance(a, b) === 1;
}

export function isStraightLine(a: Position, b: Position): boolean {
  return a.x === b.x || a.y === b.y;
}

export function findPathBFS(
  start: Position,
  end: Position,
  obstacles: Position[],
  maxSteps: number
): Position[] | null {
  if (!isInBounds(end)) return null;
  if (start.x === end.x && start.y === end.y) return [start];

  const obstacleSet = new Set(
    obstacles.filter((o) => !(o.x === start.x && o.y === start.y))
      .map((o) => `${o.x},${o.y}`)
  );
  if (obstacleSet.has(`${end.x},${end.y}`)) return null;

  const queue: { pos: Position; path: Position[]; steps: number }[] = [
    { pos: start, path: [start], steps: 0 },
  ];
  const visited = new Set<string>([`${start.x},${start.y}`]);

  const directions = [
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 },
  ];

  while (queue.length > 0) {
    const { pos, path, steps } = queue.shift()!;

    if (pos.x === end.x && pos.y === end.y) {
      return path;
    }

    if (steps >= maxSteps) continue;

    for (const dir of directions) {
      const next: Position = { x: pos.x + dir.x, y: pos.y + dir.y };
      const key = `${next.x},${next.y}`;

      if (visited.has(key)) continue;
      if (!isInBounds(next)) continue;

      const isTarget = next.x === end.x && next.y === end.y;
      if (!isTarget && obstacleSet.has(key)) continue;

      visited.add(key);
      queue.push({
        pos: next,
        path: [...path, next],
        steps: steps + 1,
      });
    }
  }

  return null;
}

export function getReachableCells(
  start: Position,
  obstacles: Position[],
  maxSteps: number
): Position[] {
  const reachable: Position[] = [];
  const obstacleSet = new Set(
    obstacles.filter((o) => !(o.x === start.x && o.y === start.y))
      .map((o) => `${o.x},${o.y}`)
  );

  const queue: { pos: Position; steps: number }[] = [
    { pos: start, steps: 0 },
  ];
  const visited = new Set<string>([`${start.x},${start.y}`]);

  const directions = [
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 },
  ];

  while (queue.length > 0) {
    const { pos, steps } = queue.shift()!;

    if (steps > 0) {
      reachable.push(pos);
    }

    if (steps >= maxSteps) continue;

    for (const dir of directions) {
      const next: Position = { x: pos.x + dir.x, y: pos.y + dir.y };
      const key = `${next.x},${next.y}`;

      if (visited.has(key)) continue;
      if (!isInBounds(next)) continue;
      if (obstacleSet.has(key)) continue;

      visited.add(key);
      queue.push({ pos: next, steps: steps + 1 });
    }
  }

  return reachable;
}

export function canMoveTo(
  hero: Hero,
  target: Position,
  otherHeroPosition: Position
): boolean {
  if (hero.hasMoved) return false;
  if (hero.stunned > 0) return false;
  const path = findPathBFS(hero.position, target, [otherHeroPosition], hero.moveRange);
  return path !== null;
}

export function canAttack(attacker: Hero, defender: Hero): boolean {
  if (attacker.hasActed) return false;
  if (attacker.stunned > 0) return false;
  return isAdjacent(attacker.position, defender.position);
}

export function canUseSkill(
  caster: Hero,
  target: Hero,
  skillId: string
): { valid: boolean; reason?: string } {
  if (caster.hasActed) return { valid: false, reason: '本回合已行动' };
  if (caster.stunned > 0) return { valid: false, reason: '英雄被眩晕' };

  const skill = caster.skills.find((s) => s.id === skillId);
  if (!skill) return { valid: false, reason: '技能不存在' };
  if (skill.currentCooldown > 0) return { valid: false, reason: '技能冷却中' };

  const dist = getDistance(caster.position, target.position);
  if (dist > skill.range) return { valid: false, reason: '目标超出范围' };
  if (skill.type === 'damage' && !isStraightLine(caster.position, target.position)) {
    return { valid: false, reason: '伤害技能需直线释放' };
  }

  return { valid: true };
}

export function createLog(
  turn: number,
  player: PlayerId,
  message: string
): LogEntry {
  return {
    id: uuidv4(),
    turn,
    player,
    message,
    timestamp: Date.now(),
  };
}

export function checkWinner(heroes: Record<PlayerId, Hero>): PlayerId | null {
  if (heroes.player.currentHp <= 0) return 'ai';
  if (heroes.ai.currentHp <= 0) return 'player';
  return null;
}

export function decrementCooldowns(hero: Hero): Hero {
  return {
    ...hero,
    skills: hero.skills.map((s) => ({
      ...s,
      currentCooldown: Math.max(0, s.currentCooldown - 1),
    })),
    stunned: Math.max(0, hero.stunned - 1),
  };
}

export function resetTurnFlags(hero: Hero): Hero {
  return {
    ...hero,
    hasMoved: false,
    hasActed: false,
  };
}
