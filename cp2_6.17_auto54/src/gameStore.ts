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
} from './types';

const BOARD_SIZE = 800;
const HEX_RADIUS = 32;
const TURN_DURATION = 15;
const MOVE_DURATION = 300;

const hexToPixel = (hex: HexCoord, hexRadius: number): Position => {
  const x = hexRadius * (3 / 2) * hex.q;
  const y = hexRadius * (Math.sqrt(3) / 2 * hex.q + Math.sqrt(3) * hex.r);
  return { x: x + BOARD_SIZE / 2, y: y + BOARD_SIZE / 2 };
};

const pixelToHex = (px: number, py: number, hexRadius: number): HexCoord => {
  const x = px - BOARD_SIZE / 2;
  const y = py - BOARD_SIZE / 2;
  const q = (2 / 3 * x) / hexRadius;
  const r = (-1 / 3 * x + Math.sqrt(3) / 3 * y) / hexRadius;
  return hexRound({ q, r });
};

const hexRound = (hex: { q: number; r: number }): HexCoord => {
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

const hexDistance = (a: HexCoord, b: HexCoord): number => {
  return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
};

const hexNeighbors = (hex: HexCoord): HexCoord[] => {
  const directions = [
    { q: 1, r: 0 },
    { q: 1, r: -1 },
    { q: 0, r: -1 },
    { q: -1, r: 0 },
    { q: -1, r: 1 },
    { q: 0, r: 1 },
  ];
  return directions.map(d => ({ q: hex.q + d.q, r: hex.r + d.r }));
};

const isInBounds = (hex: HexCoord, hexRadius: number): boolean => {
  const pos = hexToPixel(hex, hexRadius);
  const margin = hexRadius * 2;
  return pos.x > margin && pos.x < BOARD_SIZE - margin && pos.y > margin && pos.y < BOARD_SIZE - margin;
};

const EMOJI_POOL = ['😀', '😎', '🤖', '👾', '🐱', '🦊', '🐼', '🐸', '🤡', '👻'];

const createPlayer = (id: string, name: string, startPos: HexCoord, hexRadius: number): Player => {
  const emoji = EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)];
  const skills: Skill[] = [
    { ...SKILL_PRESETS.slow, currentCooldown: 0 },
    { ...SKILL_PRESETS.shockwave, currentCooldown: 0 },
  ];
  const displayPos = hexToPixel(startPos, hexRadius);
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

const createObstacles = (count: number, hexRadius: number): Obstacle[] => {
  const obstacles: Obstacle[] = [];
  const usedPositions = new Set<string>();

  while (obstacles.length < count) {
    const q = Math.floor(Math.random() * 10) - 5;
    const r = Math.floor(Math.random() * 10) - 5;
    const key = `${q},${r}`;
    
    if (usedPositions.has(key)) continue;
    
    const hex = { q, r };
    if (!isInBounds(hex, hexRadius)) continue;
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

interface GameStore extends GameState {
  initGame: () => void;
  movePlayer: (playerId: string, targetHex: HexCoord) => void;
  useSkill: (playerId: string, skillId: SkillType, targetX?: number, targetY?: number) => void;
  nextTurn: () => void;
  update: (deltaTime: number) => void;
  addCombatLog: (message: string, type: CombatLog['type']) => void;
  handleClick: (x: number, y: number) => void;
  mousePos: { x: number; y: number };
  setMousePos: (x: number, y: number) => void;
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

  setMousePos: (x: number, y: number) => {
    set({ mousePos: { x, y } });
  },

  initGame: () => {
    const hexRadius = HEX_RADIUS;
    const players: Player[] = [];
    
    const startPositions = [
      { q: -4, r: 0 },
      { q: 4, r: 0 },
      { q: 0, r: -4 },
      { q: 0, r: 4 },
    ];

    const playerNames = ['玩家1', '玩家2', '玩家3', '玩家4'];
    
    for (let i = 0; i < 2; i++) {
      players.push(createPlayer(uuidv4(), playerNames[i], startPositions[i], hexRadius));
    }

    const obstacles = createObstacles(8, hexRadius);

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
    });
  },

  movePlayer: (playerId: string, targetHex: HexCoord) => {
    const state = get();
    const player = state.players.find(p => p.id === playerId);
    if (!player || player.isMoving) return;

    const isObstacle = state.obstacles.some(
      o => o.position.q === targetHex.q && o.position.r === targetHex.r
    );
    if (isObstacle) return;

    const distance = hexDistance(player.position, targetHex);
    if (distance === 0) return;

    const path: HexCoord[] = [player.position];
    let current = { ...player.position };
    
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
        o => o.position.q === best.q && o.position.r === best.r
      );
      if (blocked) break;
      
      current = best;
      path.push({ ...best });
    }

    if (path.length < 2) return;

    const now = Date.now();

    set(state => ({
      players: state.players.map(p =>
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
    }));

    get().addCombatLog(`${player.name} 移动了`, 'move');
  },

  useSkill: (playerId: string, skillId: SkillType, targetX?: number, targetY?: number) => {
    const state = get();
    const player = state.players.find(p => p.id === playerId);
    if (!player) return;

    const skill = player.skills.find(s => s.id === skillId);
    if (!skill || skill.currentCooldown > 0 || player.energy < skill.energyCost) return;

    const playerPos = hexToPixel(player.position, state.hexRadius);

    if (skillId === 'slow') {
      const newParticles: Particle[] = [];
      for (let i = 0; i < 20; i++) {
        const angle = (Math.PI * 2 * i) / 20 + Math.random() * 0.3;
        const speed = 1 + Math.random() * 2;
        newParticles.push({
          id: uuidv4(),
          x: playerPos.x,
          y: playerPos.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 500,
          maxLife: 500,
          color: skill.color,
          size: 3 + Math.random() * 3,
        });
      }

      const now = Date.now();
      const slowDuration = 3000;

      set(state => ({
        players: state.players.map(p => {
          if (p.id === playerId) {
            return {
              ...p,
              energy: p.energy - skill.energyCost,
              skills: p.skills.map(s =>
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
        particles: [...state.particles, ...newParticles],
      }));

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

      set(state => ({
        players: state.players.map(p =>
          p.id === playerId
            ? {
                ...p,
                energy: p.energy - skill.energyCost,
                skills: p.skills.map(s =>
                  s.id === skillId ? { ...s, currentCooldown: s.cooldown } : s
                ),
              }
            : p
        ),
        projectiles: [...state.projectiles, newProjectile],
      }));

      get().addCombatLog(`${player.name} 释放了 ${skill.name}`, 'skill');
    }
  },

  nextTurn: () => {
    const state = get();
    const currentIndex = state.players.findIndex(p => p.id === state.currentPlayerId);
    const nextIndex = (currentIndex + 1) % state.players.filter(p => p.hp > 0).length;
    const alivePlayers = state.players.filter(p => p.hp > 0);
    
    if (alivePlayers.length <= 1) {
      set({
        gameStatus: 'ended',
        winnerId: alivePlayers[0]?.id || null,
      });
      return;
    }

    const nextPlayer = alivePlayers[nextIndex % alivePlayers.length];
    
    set(state => ({
      currentPlayerId: nextPlayer.id,
      turn: state.turn + 1,
      turnStartTime: Date.now(),
      players: state.players.map(p => ({
        ...p,
        energy: Math.min(p.maxEnergy, p.energy + 5),
      })),
    }));

    get().addCombatLog(`回合 ${get().turn}：${nextPlayer.name} 的回合`, 'info');
  },

  update: (deltaTime: number) => {
    const state = get();
    if (state.gameStatus !== 'playing') return;

    const now = Date.now();

    const turnElapsed = (now - state.turnStartTime) / 1000;
    if (turnElapsed >= state.turnDuration) {
      get().nextTurn();
      return;
    }

    let updatedPlayers = state.players.map(player => {
      if (player.isMoving && player.movePath.length > 1) {
        const elapsed = now - player.moveStartTime;
        const totalDuration = (player.movePath.length - 1) * MOVE_DURATION;
        const progress = Math.min(elapsed / totalDuration, 1);

        const segmentIndex = Math.floor(progress * (player.movePath.length - 1));
        const segmentProgress = (progress * (player.movePath.length - 1)) % 1;

        const fromHex = player.movePath[segmentIndex];
        const toHex = player.movePath[Math.min(segmentIndex + 1, player.movePath.length - 1)];

        const fromPos = hexToPixel(fromHex, state.hexRadius);
        const toPos = hexToPixel(toHex, state.hexRadius);

        const eased = easeInOut(segmentProgress);

        const displayPosition = {
          x: fromPos.x + (toPos.x - fromPos.x) * eased,
          y: fromPos.y + (toPos.y - fromPos.y) * eased,
        };

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

    updatedPlayers = updatedPlayers.map(player => ({
      ...player,
      skills: player.skills.map(skill => ({
        ...skill,
        currentCooldown: Math.max(0, skill.currentCooldown - deltaTime / 1000),
      })),
    }));

    const updatedParticles = state.particles
      .map(p => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        life: p.life - deltaTime,
        vy: p.vy + 0.05,
      }))
      .filter(p => p.life > 0);

    const updatedProjectiles: Projectile[] = [];
    const hitPlayerIds = new Set<string>();

    for (const proj of state.projectiles) {
      const elapsed = now - proj.startTime;
      const progress = Math.min(elapsed / proj.duration, 1);
      
      if (progress < 1) {
        updatedProjectiles.push({ ...proj, progress });
      }

      if (progress > 0.3 && progress < 0.9) {
        const currentX = proj.startPos.x + (proj.endPos.x - proj.startPos.x) * progress;
        const currentY = proj.startPos.y + (proj.endPos.y - proj.startPos.y) * progress;
        
        for (const player of updatedPlayers) {
          if (hitPlayerIds.has(player.id)) continue;
          
          const playerPos = player.displayPosition;
          const dx = playerPos.x - currentX;
          const dy = playerPos.y - currentY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 30) {
            hitPlayerIds.add(player.id);
          }
        }
      }
    }

    if (hitPlayerIds.size > 0) {
      updatedPlayers = updatedPlayers.map(player => {
        if (!hitPlayerIds.has(player.id)) return player;
        
        const currentPlayer = state.players.find(p => p.id === state.currentPlayerId);
        if (!currentPlayer || currentPlayer.id === player.id) return player;

        const proj = state.projectiles[0];
        if (!proj) return player;

        const dx = proj.endPos.x - proj.startPos.x;
        const dy = proj.endPos.y - proj.startPos.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const dirX = dx / len;
        const dirY = dy / len;

        const knockbackHex = {
          q: player.position.q + Math.round(dirX * 2),
          r: player.position.r + Math.round(dirY * 1),
        };

        const isBlocked = state.obstacles.some(
          o => o.position.q === knockbackHex.q && o.position.r === knockbackHex.r
        );

        if (isBlocked || !isInBounds(knockbackHex, state.hexRadius)) {
          return {
            ...player,
            hp: Math.max(0, player.hp - 15),
          };
        }

        return {
          ...player,
          hp: Math.max(0, player.hp - 15),
          position: knockbackHex,
          displayPosition: hexToPixel(knockbackHex, state.hexRadius),
        };
      });
    }

    if (updatedPlayers.filter(p => p.hp > 0).length <= 1) {
      const winner = updatedPlayers.find(p => p.hp > 0);
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
      particles: updatedParticles.slice(0, 150),
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
    set(state => ({
      combatLogs: [...state.combatLogs.slice(-50), log],
    }));
  },

  handleClick: (x: number, y: number) => {
    const state = get();
    if (state.gameStatus !== 'playing') return;
    
    const currentPlayer = state.players.find(p => p.id === state.currentPlayerId);
    if (!currentPlayer || currentPlayer.isMoving) return;

    const targetHex = pixelToHex(x, y, state.hexRadius);
    
    const dist = hexDistance(currentPlayer.position, targetHex);
    if (dist > 0 && dist <= 3) {
      get().movePlayer(currentPlayer.id, targetHex);
    }
  },
}));

const easeInOut = (t: number): number => {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
};
