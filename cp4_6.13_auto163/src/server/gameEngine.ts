import { v4 as uuidv4 } from 'uuid';
import type {
  GameState, Tower, Monster, Effect, TowerType, MonsterType, Position, GamePhase
} from '../shared/types';
import {
  GRID_COLS, GRID_ROWS, CELL_SIZE, PATH, TOWER_CONFIGS,
  INITIAL_GOLD, INITIAL_LIVES, PREPARATION_TIME, KILL_GOLD_REWARD
} from '../shared/types';

function getDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function isOnPath(x: number, y: number): boolean {
  return PATH.some(p => p.x === x && p.y === y);
}

export function createInitialState(gameId: string): GameState {
  return {
    gameId,
    phase: 'preparation',
    lives: INITIAL_LIVES,
    gold: INITIAL_GOLD,
    wave: 0,
    kills: 0,
    towers: [],
    monsters: [],
    effects: [],
    preparationEndTime: Date.now() + PREPARATION_TIME,
    waveStartTime: null,
    score: 0,
    pendingMonsterCount: 0,
  };
}

export function canBuildTower(state: GameState, x: number, y: number, type: TowerType): { success: boolean; reason?: string } {
  if (x < 0 || x >= GRID_COLS || y < 0 || y >= GRID_ROWS) {
    return { success: false, reason: '超出边界' };
  }
  if (isOnPath(x, y)) {
    return { success: false, reason: '不能在路径上建造' };
  }
  if (state.towers.some(t => t.position.x === x && t.position.y === y) {
    return { success: false, reason: '该位置已有塔' };
  }
  const cost = TOWER_CONFIGS[type][1].buildCost;
  if (state.gold < cost) {
    return { success: false, reason: '金币不足' };
  }
  return { success: true };
}

export function buildTower(state: GameState, x: number, y: number, type: TowerType): GameState {
  const check = canBuildTower(state, x, y, type);
  if (!check.success) return state;

  const cfg = TOWER_CONFIGS[type][1];
  const newTower: Tower = {
    id: uuidv4(),
    type,
    level: 1,
    position: { x, y },
    lastAttackTime: 0,
  };

  const buildEffect: Effect = {
    id: uuidv4(),
    type: 'buildFlash',
    from: { x: x * CELL_SIZE + CELL_SIZE / 2, y: y * CELL_SIZE + CELL_SIZE / 2,
    startTime: Date.now(),
    duration: 500,
  };

  return {
    ...state,
    gold: state.gold - cfg.buildCost,
    towers: [...state.towers, newTower],
    effects: [...state.effects, buildEffect],
  };
}

export function canUpgradeTower(state: GameState, x: number, y: number): { success: boolean; reason?: string } {
  const tower = state.towers.find(t => t.position.x === x && t.position.y === y);
  if (!tower) {
    return { success: false, reason: '该位置没有塔' };
  }
  if (tower.level >= 3) {
    return { success: false, reason: '已达最高等级' };
  }
  const cfg = TOWER_CONFIGS[tower.type][tower.level];
  if (state.gold < (cfg.upgradeCost ?? Infinity) {
    return { success: false, reason: '金币不足' };
  }
  return { success: true };
}

export function upgradeTower(state: GameState, x: number, y: number): GameState {
  const check = canUpgradeTower(state, x, y);
  if (!check.success) return state;

  const towerIdx = state.towers.findIndex(t => t.position.x === x && t.position.y === y);
  if (towerIdx === -1) return state;

  const tower = state.towers[towerIdx];
  const cfg = TOWER_CONFIGS[tower.type][tower.level];
  const upgradeCost = cfg.upgradeCost ?? 0;

  const newTowers = [...state.towers.slice();
  newTowers[towerIdx] = {
    ...tower,
    level: (tower.level + 1) as 1 | 2 | 3,
  };

  const buildEffect: Effect = {
    id: uuidv4(),
    type: 'buildFlash',
    from: { x: x * CELL_SIZE + CELL_SIZE / 2, y: y * CELL_SIZE + CELL_SIZE / 2 },
    startTime: Date.now(),
    duration: 500,
  };

  return {
    ...state,
    gold: state.gold - upgradeCost,
    towers: newTowers,
    effects: [...state.effects, buildEffect],
  };
}

function generateWaveMonsters(wave: number): Monster[] {
  const count = 5 + (wave - 1) * 5;
  const monsters: Monster[] = [];
  const hasElite = wave % 5 === 0;

  for (let i = 0; i < count; i++) {
    let type: MonsterType = 'normal';
    const rand = Math.random();

    if (hasElite && i >= count - 2) {
      type = 'elite';
    } else if (rand < 0.25) {
      type = 'fast';
    } else if (rand < 0.35 && wave >= 3) {
      type = 'fast';
    }

    let hp = 50;
    let speed = 1;
    let hasShield = false;

    if (type === 'fast') {
      hp = 30;
      speed = 2;
    } else if (type === 'elite') {
      hp = 150;
      speed = 0.8;
      hasShield = true;
    }

    const waveMultiplier = 1 + (wave - 1) * 0.15;
    hp = Math.floor(hp * waveMultiplier);

    monsters.push({
      id: uuidv4(),
      type,
      hp,
      maxHp: hp,
      position: {
        x: PATH[0].x * CELL_SIZE + CELL_SIZE / 2,
        y: PATH[0].y * CELL_SIZE + CELL_SIZE / 2,
      },
      pathIndex: 0,
      baseSpeed: speed,
      slowEndTime: 0,
      slowFactor: 1,
      hasShield,
      isDying: false,
      deathStartTime: 0,
      spawnDelay: i * 800,
      spawned: false,
    });
  }

  return monsters;
}

export function startWave(state: GameState): GameState {
  if (state.phase !== 'preparation') return state;

  const newWave = state.wave + 1;
  const monsters = generateWaveMonsters(newWave);

  return {
    ...state,
    phase: 'wave',
    wave: newWave,
    monsters,
    waveStartTime: Date.now(),
    preparationEndTime: null,
    pendingMonsterCount: monsters.length,
  };
}

export function gameTick(state: GameState): GameState {
  const now = Date.now();
  let newState = { ...state };

  newState.effects = newState.effects.filter(e => now - e.startTime < e.duration);

  if (newState.phase === 'preparation') {
    if (newState.preparationEndTime && now >= newState.preparationEndTime) {
      newState = startWave(newState);
    }
    return newState;
  }

  if (newState.phase === 'gameover') {
    return newState;
  }

  newState.monsters = updateMonsters(newState, now);

  newState = updateTowers(newState, now);

  newState = cleanupDeadMonsters(newState, now);

  newState = checkWaveEnd(newState, now);

  newState = checkGameOver(newState);

  return newState;
}

function updateMonsters(state: GameState, now: number): Monster[] {
  const waveStart = state.waveStartTime ?? now;
  const elapsed = now - waveStart;

  return state.monsters.map(monster => {
    let m = { ...monster };

    if (!m.spawned) {
      if (elapsed >= m.spawnDelay) {
        m.spawned = true;
      } else {
        return m;
      }
    }

    if (m.isDying) return m;

    if (now > m.slowEndTime) {
      m.slowFactor = 1;
    }

    const currentSpeed = m.baseSpeed * m.slowFactor;
    let moveDistance = (currentSpeed * CELL_SIZE) / 30;

    while (moveDistance > 0 && m.pathIndex < PATH.length - 1) {
      const nextPoint = PATH[m.pathIndex + 1];
      const targetX = nextPoint.x * CELL_SIZE + CELL_SIZE / 2;
      const targetY = nextPoint.y * CELL_SIZE + CELL_SIZE / 2;

      const dx = targetX - m.position.x;
      const dy = targetY - m.position.y;
      const distToNext = Math.sqrt(dx * dx + dy * dy);

      if (distToNext <= moveDistance) {
        m.position = { x: targetX, y: targetY };
        m.pathIndex++;
        moveDistance -= distToNext;
      } else {
        const ratio = moveDistance / distToNext;
        m.position = {
          x: m.position.x + dx * ratio,
          y: m.position.y + dy * ratio,
        };
        moveDistance = 0;
      }
    }

    return m;
  });
}

function updateTowers(state: GameState, now: number): GameState {
  let newState = { ...state };
  const newEffects: Effect[] = [];
  const updatedTowers = [...state.towers.map(t => ({ ...t }));

  const aliveMonsters = newState.monsters.filter(m => m.spawned && !m.isDying);

  for (let i = 0; i < updatedTowers.length; i++) {
    const tower = updatedTowers[i];
    const cfg = TOWER_CONFIGS[tower.type][tower.level];

    if (now - tower.lastAttackTime < cfg.attackInterval) continue;

    const towerCenter = {
      x: tower.position.x * CELL_SIZE + CELL_SIZE / 2,
      y: tower.position.y * CELL_SIZE + CELL_SIZE / 2,
    };

    const inRangeMonsters = aliveMonsters.filter(m =>
      getDistance(towerCenter, m.position) <= cfg.range * CELL_SIZE
    );

    if (inRangeMonsters.length === 0) continue;

    inRangeMonsters.sort((a, b) => b.pathIndex - a.pathIndex);

    if (tower.type === 'fireball') {
      const target = inRangeMonsters[0];
      updatedTowers[i] = { ...tower, lastAttackTime: now };

      const damage = applyDamage(newState, target.id, cfg.damage ?? 0);
      newState = damage.state;

      newEffects.push({
        id: uuidv4(),
        type: 'fireball',
        from: towerCenter,
        to: { x: target.position.x, y: target.position.y },
        startTime: now,
        duration: 300,
        towerId: tower.id,
      });
      newEffects.push({
        id: uuidv4(),
        type: 'towerMuzzle',
        from: towerCenter,
        startTime: now,
        duration: 200,
        towerId: tower.id,
      });
    } else if (tower.type === 'frost') {
      updatedTowers[i] = { ...tower, lastAttackTime: now };

      for (const target of inRangeMonsters) {
        const midx = newState.monsters.findIndex(mm => mm.id === target.id);
        if (midx !== -1) {
          const newMonsters = [...newState.monsters];
          newMonsters[midx] = {
            ...newMonsters[midx],
            slowFactor: 1 - (cfg.slowFactor ?? 0),
            slowEndTime: now + (cfg.slowDuration ?? 0,
          };
          newState = { ...newState, monsters: newMonsters };
        }
      }

      newEffects.push({
        id: uuidv4(),
        type: 'frost',
        from: towerCenter,
        to: inRangeMonsters.map(m => ({ x: m.position.x, y: m.position.y }),
        startTime: now,
        duration: 400,
        towerId: tower.id,
      });
    } else if (tower.type === 'lightning') {
      updatedTowers[i] = { ...tower, lastAttackTime: now };

      const chainCount = cfg.chainCount ?? 3;
      const chainTargets: Position[] = [];
      const hitIds = new Set<string>();
      let current = inRangeMonsters[0];
      let remaining = [...inRangeMonsters];

      for (let c = 0; c < chainCount && current; c++) {
        chainTargets.push({ x: current.position.x, y: current.position.y });
        hitIds.add(current.id);

        const damage = applyDamage(newState, current.id, cfg.damage ?? 0);
        newState = damage.state;

        remaining = remaining.filter(m => !hitIds.has(m.id));
        if (remaining.length > 0) {
          remaining.sort((a, b) =>
            getDistance(current.position, a.position) - getDistance(current.position, b.position));
          current = remaining[0];
        } else {
          break;
        }
      }

      if (chainTargets.length > 0) {
        newEffects.push({
          id: uuidv4(),
          type: 'lightning',
          from: towerCenter,
          to: chainTargets[0],
          chainTargets,
          startTime: now,
          duration: 250,
          towerId: tower.id,
        });
        newEffects.push({
          id: uuidv4(),
          type: 'towerMuzzle',
          from: towerCenter,
          startTime: now,
          duration: 200,
          towerId: tower.id,
        });
      }
    }
  }

  return {
    ...newState,
    towers: updatedTowers,
    effects: [...newState.effects, ...newEffects],
  };
}

function applyDamage(state: GameState, monsterId: string, baseDamage: number): { state: GameState; killed: boolean } {
  const idx = state.monsters.findIndex(m => m.id === monsterId);
  if (idx === -1) return { state, killed: false };

  const monster = state.monsters[idx];
  let damage = baseDamage;
  if (monster.hasShield) {
    damage = Math.floor(damage * 0.7);
  }

  const newHp = monster.hp - damage;
  const newMonsters = [...state.monsters];

  if (newHp <= 0) {
    newMonsters[idx] = {
      ...monster, hp: 0, isDying: true, deathStartTime: Date.now() };
    return {
      state: {
        ...state,
        monsters: newMonsters,
        gold: state.gold + KILL_GOLD_REWARD,
        kills: state.kills + 1,
        effects: [
          ...state.effects,
          {
            id: uuidv4(),
            type: 'deathParticles',
            from: { x: monster.position.x, y: monster.position.y },
            startTime: Date.now(),
            duration: 300,
            monsterId: monster.id,
          },
        ],
      },
      killed: true,
    };
  } else {
    newMonsters[idx] = { ...monster, hp: newHp };
    return { state: { ...state, monsters: newMonsters }, killed: false };
  }
}

function cleanupDeadMonsters(state: GameState, now: number): GameState {
  const monsters = state.monsters.filter(m => {
    if (m.isDying) {
      return now - m.deathStartTime < 300;
    }
    return true;
  });
  return { ...state, monsters };
}

function checkWaveEnd(state: GameState, now: number): GameState {
  const allSpawned = state.monsters.every(m => m.spawned);
  const allDeadOrFinished = state.monsters.every(m => m.isDying || m.pathIndex >= PATH.length - 1);

  const livesLost = state.monsters.filter(m => m.pathIndex >= PATH.length - 1 && !m.isDying && m.spawned);
  let newLives = state.lives;
  let monsters = [...state.monsters];

  if (livesLost.length > 0) {
    newLives -= livesLost.length;
    monsters = monsters.filter(m => !livesLost.includes(m));
  }

  const allDone = allSpawned && (state.monsters.length === 0 || (allSpawned && allDeadOrFinished && state.monsters.filter(m => !m.isDying).length === 0);

  if (state.phase === 'wave' && allDone) {
    const finalScore = state.kills * 10 + newLives * 50;
    return {
      ...state,
      lives: newLives,
      monsters,
      phase: 'preparation',
      preparationEndTime: now + PREPARATION_TIME,
      waveStartTime: null,
      score: finalScore,
      pendingMonsterCount: 0,
    };
  }

  return { ...state, lives: newLives, monsters };
}

function checkGameOver(state: GameState): GameState {
  if (state.lives <= 0 && state.phase !== 'gameover') {
    const finalScore = state.kills * 10 + Math.max(0, state.lives) * 50;
    return {
      ...state,
      phase: 'gameover',
      lives: 0,
      score: finalScore,
    };
  }
  return state;
}

export { isOnPath };
