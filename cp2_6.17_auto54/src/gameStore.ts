import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  GameState,
  Player,
  HexCoord,
  Obstacle,
  Particle,
  Projectile,
  CombatLog,
  Skill,
  SKILL_PRESETS,
  SkillType,
  Position,
  AStarNode,
  HEX_DIRECTIONS,
  MAX_COMBAT_LOGS,
  MAX_PARTICLES,
  PARTICLE_LIFETIME,
  MOVE_DURATION_PER_HEX,
} from './types';

const BOARD_SIZE = 800;
const HEX_RADIUS = 32;
const TURN_DURATION = 15;
const HEX_SIZE = HEX_RADIUS;

export const getHexCorner = (
  centerX: number,
  centerY: number,
  size: number,
  i: number
): Position => {
  const angleDeg = 60 * i;
  const angleRad = (Math.PI / 180) * angleDeg;
  return {
    x: centerX + size * Math.cos(angleRad),
    y: centerY + size * Math.sin(angleRad),
  };
};

export const getHexCorners = (centerX: number, centerY: number, size: number): Position[] => {
  const corners: Position[] = [];
  for (let i = 0; i < 6; i++) {
    corners.push(getHexCorner(centerX, centerY, size, i));
  }
  return corners;
};

export const hexToPixel = (hex: HexCoord, hexSize: number): Position => {
  const x = hexSize * (Math.sqrt(3) * hex.q + (Math.sqrt(3) / 2) * hex.r);
  const y = hexSize * ((3 / 2) * hex.r);
  return { x: x + BOARD_SIZE / 2, y: y + BOARD_SIZE / 2 };
};

export const pixelToHex = (px: number, py: number, hexSize: number): HexCoord => {
  const x = px - BOARD_SIZE / 2;
  const y = py - BOARD_SIZE / 2;
  const q = ((Math.sqrt(3) / 3) * x - (1 / 3) * y) / hexSize;
  const r = ((2 / 3) * y) / hexSize;
  return hexRound({ q, r });
};

export const hexRound = (hex: { q: number; r: number }): HexCoord => {
  const s = -hex.q - hex.r;
  let rq = Math.round(hex.q);
  let rr = Math.round(hex.r);
  let rs = Math.round(s);
  const qDiff = Math.abs(rq - hex.q);
  const rDiff = Math.abs(rr - hex.r);
  const sDiff = Math.abs(rs - s);
  if (qDiff > rDiff && qDiff > sDiff) {
    rq = -rr - rs;
  } else if (rDiff > sDiff) {
    rr = -rq - rs;
  }
  return { q: rq, r: rr };
};

export const hexDistance = (a: HexCoord, b: HexCoord): number => {
  return (
    (Math.abs(a.q - b.q) +
      Math.abs(a.q + a.r - b.q - b.r) +
      Math.abs(a.r - b.r)) /
    2
  );
};

export const hexNeighbors = (hex: HexCoord): HexCoord[] => {
  return HEX_DIRECTIONS.map((d) => ({
    q: hex.q + d.q,
    r: hex.r + d.r,
  }));
};

export const hexKey = (hex: HexCoord): string => `${hex.q},${hex.r}`;

export const isInBounds = (hex: HexCoord, hexSize: number): boolean => {
  const pos = hexToPixel(hex, hexSize);
  const margin = hexSize * 2;
  return (
    pos.x > margin &&
    pos.x < BOARD_SIZE - margin &&
    pos.y > margin &&
    pos.y < BOARD_SIZE - margin
  );
};

export const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const lerpPosition = (a: Position, b: Position, t: number): Position => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
});

interface AStarResult {
  path: HexCoord[];
  found: boolean;
}

export const aStarHex = (
  start: HexCoord,
  goal: HexCoord,
  obstacles: Obstacle[],
  hexSize: number,
  maxIterations: number = 500
): AStarResult => {
  if (start.q === goal.q && start.r === goal.r) {
    return { path: [start], found: true };
  }

  const obstacleSet = new Set(obstacles.map((o) => hexKey(o.position)));
  const playersSet = new Set<string>();

  const openList: AStarNode[] = [];
  const openMap = new Map<string, AStarNode>();
  const closedSet = new Set<string>();

  const startNode: AStarNode = {
    hex: start,
    parent: null,
    g: 0,
    h: hexDistance(start, goal),
    f: hexDistance(start, goal),
  };

  openList.push(startNode);
  openMap.set(hexKey(start), startNode);

  let iterations = 0;

  while (openList.length > 0 && iterations < maxIterations) {
    iterations++;

    openList.sort((a, b) => a.f - b.f);
    const current = openList.shift()!;
    openMap.delete(hexKey(current.hex));

    const currentKey = hexKey(current.hex);
    closedSet.add(currentKey);

    if (current.hex.q === goal.q && current.hex.r === goal.r) {
      const path: HexCoord[] = [];
      let node: AStarNode | null = current;
      while (node) {
        path.unshift(node.hex);
        node = node.parent;
      }
      return { path, found: true };
    }

    const neighbors = hexNeighbors(current.hex);
    for (const neighborHex of neighbors) {
      const neighborKey = hexKey(neighborHex);

      if (closedSet.has(neighborKey)) continue;
      if (obstacleSet.has(neighborKey)) continue;
      if (playersSet.has(neighborKey)) continue;
      if (!isInBounds(neighborHex, hexSize)) continue;

      const tentativeG = current.g + 1;
      const tentativeH = hexDistance(neighborHex, goal);
      const tentativeF = tentativeG + tentativeH;

      const existingOpen = openMap.get(neighborKey);
      if (existingOpen && tentativeG >= existingOpen.g) {
        continue;
      }

      const neighborNode: AStarNode = {
        hex: neighborHex,
        parent: current,
        g: tentativeG,
        h: tentativeH,
        f: tentativeF,
      };

      if (existingOpen) {
        const idx = openList.indexOf(existingOpen);
        if (idx >= 0) openList.splice(idx, 1);
      }
      openList.push(neighborNode);
      openMap.set(neighborKey, neighborNode);
    }
  }

  return { path: [], found: false };
};

const EMOJI_POOL = ['😀', '😎', '🤖', '👾', '🐱', '🦊', '🐼', '🐸', '🤡', '👻'];

const createPlayer = (
  id: string,
  name: string,
  startPos: HexCoord,
  hexSize: number
): Player => {
  const emoji = EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)];
  const skills: Skill[] = [
    { ...SKILL_PRESETS.slow, currentCooldown: 0 },
    { ...SKILL_PRESETS.shockwave, currentCooldown: 0 },
  ];
  const displayPos = hexToPixel(startPos, hexSize);
  return {
    id,
    emoji,
    name,
    hp: 100,
    maxHp: 100,
    energy: 50,
    maxEnergy: 100,
    position: { ...startPos },
    displayPosition: { ...displayPos },
    skills,
    isMoving: false,
    movePath: [],
    moveProgress: 0,
    moveStartTime: 0,
    slowedUntil: 0,
    speed: 2,
  };
};

const createObstacles = (count: number, hexSize: number): Obstacle[] => {
  const obstacles: Obstacle[] = [];
  const usedPositions = new Set<string>();

  while (obstacles.length < count) {
    const q = Math.floor(Math.random() * 10) - 5;
    const r = Math.floor(Math.random() * 10) - 5;
    const key = `${q},${r}`;

    if (usedPositions.has(key)) continue;

    const hex = { q, r };
    if (!isInBounds(hex, hexSize)) continue;
    if (hexDistance(hex, { q: 0, r: 0 }) < 2) continue;

    usedPositions.add(key);
    obstacles.push({
      id: uuidv4(),
      position: hex,
      radius: 30,
      color: '#7F8C8D',
    });
  }
  return obstacles;
};

export const createParticles = (
  centerX: number,
  centerY: number,
  color: string,
  count: number,
  lifetime: number = PARTICLE_LIFETIME
): Particle[] => {
  const particles: Particle[] = [];
  const headX = centerX;
  const headY = centerY - 50;

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
    const speed = 1 + Math.random() * 2.5;
    const initialSize = 3 + Math.random() * 4;

    particles.push({
      id: uuidv4(),
      x: headX + (Math.random() - 0.5) * 20,
      y: headY + (Math.random() - 0.5) * 10,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      life: lifetime,
      maxLife: lifetime,
      color,
      size: initialSize,
      initialSize,
    });
  }
  return particles;
};

export const updateParticles = (
  particles: Particle[],
  deltaTime: number
): Particle[] => {
  const timeRatio = deltaTime / 16.67;

  return particles
    .map((p) => {
      const newLife = p.life - deltaTime;
      const lifeRatio = Math.max(0, newLife / p.maxLife);
      const newSize = p.initialSize * lifeRatio;

      return {
        ...p,
        x: p.x + p.vx * timeRatio,
        y: p.y + p.vy * timeRatio + 0.05 * timeRatio,
        vy: p.vy + 0.02 * timeRatio,
        life: newLife,
        size: newSize,
      };
    })
    .filter((p) => p.life > 0);
};

interface GameStore extends GameState {
  initGame: () => void;
  movePlayer: (playerId: string, targetHex: HexCoord) => void;
  useSkill: (
    playerId: string,
    skillId: SkillType,
    targetX?: number,
    targetY?: number
  ) => void;
  nextTurn: () => void;
  update: (deltaTime: number) => void;
  addCombatLog: (message: string, type: CombatLog['type']) => void;
  handleClick: (x: number, y: number) => void;
  mousePos: { x: number; y: number };
  setMousePos: (x: number, y: number) => void;
  updateCountdown: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  players: [],
  currentPlayerId: null,
  turn: 1,
  turnDuration: TURN_DURATION,
  turnStartTime: 0,
  obstacles: [],
  particles: [],
  projectiles: [],
  combatLogs: [],
  boardSize: BOARD_SIZE,
  hexRadius: HEX_RADIUS,
  gameStatus: 'waiting',
  winnerId: null,
  mousePos: { x: 0, y: 0 },
  countdown: TURN_DURATION,

  setMousePos: (x: number, y: number) => {
    set({ mousePos: { x, y } });
  },

  updateCountdown: () => {
    const state = get();
    if (state.gameStatus !== 'playing') return;

    const now = Date.now();
    const elapsed = (now - state.turnStartTime) / 1000;
    const remaining = Math.max(0, state.turnDuration - elapsed);
    const newCountdown = Math.ceil(remaining);

    if (state.countdown !== newCountdown) {
      set({ countdown: newCountdown });
    }

    if (remaining <= 0) {
      get().nextTurn();
    }
  },

  initGame: () => {
    const hexSize = HEX_RADIUS;
    const players: Player[] = [];

    const startPositions = [
      { q: -4, r: 0 },
      { q: 4, r: 0 },
      { q: 0, r: -4 },
      { q: 0, r: 4 },
    ];

    const playerNames = ['玩家1', '玩家2', '玩家3', '玩家4'];

    for (let i = 0; i < 2; i++) {
      players.push(
        createPlayer(uuidv4(), playerNames[i], startPositions[i], hexSize)
      );
    }

    const obstacles = createObstacles(8, hexSize);

    set({
      players,
      currentPlayerId: players[0].id,
      turn: 1,
      turnStartTime: Date.now(),
      obstacles,
      particles: [],
      projectiles: [],
      combatLogs: [
        {
          id: uuidv4(),
          timestamp: Date.now(),
          message: '游戏开始！第一位玩家回合',
          type: 'info',
        },
      ],
      gameStatus: 'playing',
      winnerId: null,
      countdown: TURN_DURATION,
    });
  },

  movePlayer: (playerId: string, targetHex: HexCoord) => {
    const state = get();
    const player = state.players.find((p) => p.id === playerId);
    if (!player || player.isMoving) return;

    const targetIsObstacle = state.obstacles.some(
      (o) => o.position.q === targetHex.q && o.position.r === targetHex.r
    );
    if (targetIsObstacle) return;

    if (!isInBounds(targetHex, state.hexRadius)) return;

    const { path, found } = aStarHex(
      player.position,
      targetHex,
      state.obstacles,
      state.hexRadius
    );

    if (!found || path.length < 2) {
      const greedy: HexCoord[] = [player.position];
      let current = { ...player.position };
      const distance = hexDistance(player.position, targetHex);

      for (let i = 0; i < distance; i++) {
        const neighbors = hexNeighbors(current);
        let best = neighbors[0];
        let bestDist = hexDistance(best, targetHex);

        for (const n of neighbors) {
          const d = hexDistance(n, targetHex);
          if (d < bestDist) {
            best = n;
            bestDist = d;
          }
        }

        const blocked = state.obstacles.some(
          (o) => o.position.q === best.q && o.position.r === best.r
        );
        if (blocked) break;
        if (!isInBounds(best, state.hexRadius)) break;

        current = best;
        greedy.push({ ...best });
      }

      if (greedy.length < 2) return;

      const now = Date.now();

      set({
        players: state.players.map((p) =>
          p.id === playerId
            ? {
                ...p,
                isMoving: true,
                movePath: greedy,
                moveProgress: 0,
                moveStartTime: now,
              }
            : p
        ),
      });

      get().addCombatLog(`${player.name} 移动了`, 'move');
      return;
    }

    const now = Date.now();

    set({
      players: state.players.map((p) =>
        p.id === playerId
          ? {
              ...p,
              isMoving: true,
              movePath: path,
              moveProgress: 0,
              moveStartTime: now,
            }
          : p
      ),
    });

    get().addCombatLog(`${player.name} 移动了`, 'move');
  },

  useSkill: (
    playerId: string,
    skillId: SkillType,
    targetX?: number,
    targetY?: number
  ) => {
    const state = get();
    const player = state.players.find((p) => p.id === playerId);
    if (!player) return;

    const skill = player.skills.find((s) => s.id === skillId);
    if (!skill || skill.currentCooldown > 0 || player.energy < skill.energyCost)
      return;

    const playerPos = hexToPixel(player.position, state.hexRadius);

    if (skillId === 'slow') {
      const particleCount = 20;
      const availableSlots = MAX_PARTICLES - state.particles.length;
      const actualCount = Math.min(particleCount, Math.max(0, availableSlots));
      const newParticles = createParticles(
        playerPos.x,
        playerPos.y,
        skill.color,
        actualCount
      );

      const now = Date.now();
      const slowDuration = 3000;

      set({
        players: state.players.map((p) => {
          if (p.id === playerId) {
            return {
              ...p,
              energy: p.energy - skill.energyCost,
              skills: p.skills.map((s) =>
                s.id === skillId ? { ...s, currentCooldown: s.cooldown } : s
              ),
            };
          }
          const dist = hexDistance(p.position, player.position);
          if (dist <= 2 && dist > 0) {
            return { ...p, slowedUntil: now + slowDuration };
          }
          return p;
        }),
        particles: [...state.particles, ...newParticles].slice(0, MAX_PARTICLES),
      });

      get().addCombatLog(`${player.name} 释放了 ${skill.name}`, 'skill');
    }

    if (skillId === 'shockwave') {
      let dirX = 1;
      let dirY = 0;

      if (targetX !== undefined && targetY !== undefined) {
        const dx = targetX - playerPos.x;
        const dy = targetY - playerPos.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 0) {
          dirX = dx / len;
          dirY = dy / len;
        }
      }

      const range = 5 * state.hexRadius * 1.5;
      const endX = playerPos.x + dirX * range;
      const endY = playerPos.y + dirY * range;

      const particleCount = 20;
      const availableSlots = MAX_PARTICLES - state.particles.length;
      const actualCount = Math.min(particleCount, Math.max(0, availableSlots));
      const newParticles = createParticles(
        playerPos.x,
        playerPos.y,
        skill.color,
        actualCount
      );

      const newProjectile: Projectile = {
        id: uuidv4(),
        type: 'shockwave',
        startPos: { x: playerPos.x, y: playerPos.y },
        endPos: { x: endX, y: endY },
        progress: 0,
        duration: 400,
        startTime: Date.now(),
        color: skill.color,
        width: 12,
      };

      set({
        players: state.players.map((p) =>
          p.id === playerId
            ? {
                ...p,
                energy: p.energy - skill.energyCost,
                skills: p.skills.map((s) =>
                  s.id === skillId ? { ...s, currentCooldown: s.cooldown } : s
                ),
              }
            : p
        ),
        projectiles: [...state.projectiles, newProjectile],
        particles: [...state.particles, ...newParticles].slice(0, MAX_PARTICLES),
      });

      get().addCombatLog(`${player.name} 释放了 ${skill.name}`, 'skill');
    }
  },

  nextTurn: () => {
    const state = get();
    const alivePlayers = state.players.filter((p) => p.hp > 0);

    if (alivePlayers.length <= 1) {
      set({
        gameStatus: 'ended',
        winnerId: alivePlayers[0]?.id || null,
      });
      return;
    }

    const currentIndex = alivePlayers.findIndex(
      (p) => p.id === state.currentPlayerId
    );
    const nextIndex = (currentIndex + 1) % alivePlayers.length;
    const nextPlayer = alivePlayers[nextIndex];

    set({
      currentPlayerId: nextPlayer.id,
      turn: state.turn + 1,
      turnStartTime: Date.now(),
      countdown: TURN_DURATION,
      players: state.players.map((p) => ({
        ...p,
        energy: Math.min(p.maxEnergy, p.energy + 5),
      })),
    });

    get().addCombatLog(`回合 ${get().turn}：${nextPlayer.name} 的回合`, 'info');
  },

  update: (deltaTime: number) => {
    const state = get();
    if (state.gameStatus !== 'playing') return;

    const now = Date.now();

    get().updateCountdown();

    let updatedPlayers = state.players.map((player) => {
      if (player.isMoving && player.movePath.length > 1) {
        const elapsed = now - player.moveStartTime;
        const totalDuration =
          (player.movePath.length - 1) * MOVE_DURATION_PER_HEX;
        const progress = Math.min(elapsed / totalDuration, 1);

        const segCount = player.movePath.length - 1;
        const rawSegment = progress * segCount;
        const segmentIndex = Math.min(
          Math.floor(rawSegment),
          segCount - 1
        );
        const segmentProgress = Math.min(
          Math.max(rawSegment - segmentIndex, 0),
          1
        );

        const fromHex = player.movePath[segmentIndex];
        const toHex = player.movePath[segmentIndex + 1];

        const fromPos = hexToPixel(fromHex, state.hexRadius);
        const toPos = hexToPixel(toHex, state.hexRadius);

        const eased = easeInOutCubic(segmentProgress);
        const displayPosition = lerpPosition(fromPos, toPos, eased);

        if (progress >= 1) {
          const finalPos = player.movePath[player.movePath.length - 1];
          return {
            ...player,
            position: finalPos,
            displayPosition: hexToPixel(finalPos, state.hexRadius),
            isMoving: false,
            movePath: [],
            moveProgress: 0,
          };
        }

        return { ...player, displayPosition, moveProgress: progress };
      }
      return player;
    });

    updatedPlayers = updatedPlayers.map((player) => ({
      ...player,
      skills: player.skills.map((skill) => ({
        ...skill,
        currentCooldown: Math.max(
          0,
          skill.currentCooldown - deltaTime / 1000
        ),
      })),
    }));

    const updatedParticles = updateParticles(
      state.particles,
      deltaTime
    ).slice(0, MAX_PARTICLES);

    const updatedProjectiles: Projectile[] = [];
    const hitPlayerIds = new Set<string>();

    for (const proj of state.projectiles) {
      const elapsed = now - proj.startTime;
      const progress = Math.min(elapsed / proj.duration, 1);

      if (progress < 1) {
        updatedProjectiles.push({ ...proj, progress });
      }

      if (progress > 0.1 && progress < 0.95) {
        const currentX =
          proj.startPos.x + (proj.endPos.x - proj.startPos.x) * progress;
        const currentY =
          proj.startPos.y + (proj.endPos.y - proj.startPos.y) * progress;

        for (const player of updatedPlayers) {
          if (hitPlayerIds.has(player.id)) continue;

          const playerPos = player.displayPosition;
          const dx = playerPos.x - currentX;
          const dy = playerPos.y - currentY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 35) {
            hitPlayerIds.add(player.id);
          }
        }
      }
    }

    if (hitPlayerIds.size > 0) {
      updatedPlayers = updatedPlayers.map((player) => {
        if (!hitPlayerIds.has(player.id)) return player;

        const currentPlayer = state.players.find(
          (p) => p.id === state.currentPlayerId
        );
        if (!currentPlayer || currentPlayer.id === player.id) return player;

        const proj = state.projectiles[0];
        if (!proj) return player;

        const dx = proj.endPos.x - proj.startPos.x;
        const dy = proj.endPos.y - proj.startPos.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const dirX = dx / len;
        const dirY = dy / len;

        let knockbackHex: HexCoord = player.position;
        for (let step = 2; step >= 1; step--) {
          const candidate: HexCoord = {
            q: player.position.q + Math.round(dirX * step),
            r: player.position.r + Math.round(dirY * step),
          };
          const isBlocked = state.obstacles.some(
            (o) =>
              o.position.q === candidate.q && o.position.r === candidate.r
          );
          if (!isBlocked && isInBounds(candidate, state.hexRadius)) {
            knockbackHex = candidate;
            break;
          }
        }

        const knockedBack =
          knockbackHex.q !== player.position.q ||
          knockbackHex.r !== player.position.r;

        get().addCombatLog(
          `${player.name} 被冲击波击中，受到 15 点伤害${
            knockedBack ? '并被击退' : ''
          }`,
          'damage'
        );

        return {
          ...player,
          hp: Math.max(0, player.hp - 15),
          position: knockbackHex,
          displayPosition: hexToPixel(knockbackHex, state.hexRadius),
        };
      });
    }

    if (updatedPlayers.filter((p) => p.hp > 0).length <= 1) {
      const winner = updatedPlayers.find((p) => p.hp > 0);
      set({
        players: updatedPlayers,
        particles: updatedParticles,
        projectiles: updatedProjectiles,
        gameStatus: 'ended',
        winnerId: winner?.id || null,
      });
      get().addCombatLog(`游戏结束！${winner?.name} 获胜！`, 'info');
      return;
    }

    set({
      players: updatedPlayers,
      particles: updatedParticles,
      projectiles: updatedProjectiles,
    });
  },

  addCombatLog: (message: string, type: CombatLog['type']) => {
    const log: CombatLog = {
      id: uuidv4(),
      timestamp: Date.now(),
      message,
      type,
    };
    set({
      combatLogs: [
        ...get().combatLogs.slice(-(MAX_COMBAT_LOGS - 1)),
        log,
      ],
    });
  },

  handleClick: (x: number, y: number) => {
    const state = get();
    if (state.gameStatus !== 'playing') return;

    const currentPlayer = state.players.find(
      (p) => p.id === state.currentPlayerId
    );
    if (!currentPlayer || currentPlayer.isMoving) return;

    const targetHex = pixelToHex(x, y, state.hexRadius);

    const dist = hexDistance(currentPlayer.position, targetHex);
    if (dist > 0 && dist <= 5) {
      get().movePlayer(currentPlayer.id, targetHex);
    }
  },
}));
