import { v4 as uuidv4 } from 'uuid';
import {
  CellType,
  Direction,
  Player,
  Ghost,
  Shockwave,
  GameStatus,
  PowerUpEffectType,
  PowerUpEffectsMap,
  ActiveBuff,
} from '../types';
import { MazeGenerator } from './MazeGenerator';
import { GhostAI } from './GhostAI';

const GHOST_COLORS = ['#FF0000', '#FFB8FF', '#00FFFF', '#FFB852'];
const PLAYER1_COLOR = '#FFE66D';
const PLAYER2_COLOR = '#4ECDC4';
const PLAYER_SPEED = 4;
const GHOST_SPEED = 3;
const GHOST_SCARED_SPEED = 2;
const POWER_DURATION = 5000;
const POWER_UP_RESPAWN_INTERVAL = 30000;
const SHOCKWAVE_DURATION = 500;
const SHOCKWAVE_MAX_RADIUS = 80;

const SPEED_BOOST_DURATION = 5000;
const GHOST_FREEZE_DURATION = 3000;
const SCORE_MULTIPLIER_DURATION = 8000;

const EFFECT_DURATION_MAP: Record<PowerUpEffectType, number> = {
  [PowerUpEffectType.SPEED_BOOST]: SPEED_BOOST_DURATION,
  [PowerUpEffectType.GHOST_FREEZE]: GHOST_FREEZE_DURATION,
  [PowerUpEffectType.SCORE_MULTIPLIER]: SCORE_MULTIPLIER_DURATION,
};

export class GameEngine {
  private mazeGenerator: MazeGenerator;
  private ghostAI: GhostAI;
  private mazeSize: number;
  private globalGhostFreezeTimer: number;

  constructor(mazeSize: number = 15) {
    this.mazeSize = mazeSize;
    this.mazeGenerator = new MazeGenerator(mazeSize);
    this.ghostAI = new GhostAI([]);
    this.globalGhostFreezeTimer = 0;
  }

  public initializeGame(twoPlayer: boolean): {
    maze: CellType[][];
    players: Player[];
    ghosts: Ghost[];
    shockwaves: Shockwave[];
    powerUpEffects: PowerUpEffectsMap;
    totalDots: number;
    remainingDots: number;
    powerUpRespawnTimer: number;
  } {
    const { maze, effects } = this.mazeGenerator.generate();
    this.ghostAI.updateMaze(maze);
    this.globalGhostFreezeTimer = 0;

    const startPos = this.mazeGenerator.getStartPosition();
    const ghostPositions = this.mazeGenerator.getGhostStartPositions(4);

    const players: Player[] = [
      {
        id: 'player1',
        x: startPos.x,
        y: startPos.y,
        direction: Direction.NONE,
        nextDirection: Direction.NONE,
        score: 0,
        lives: 3,
        color: PLAYER1_COLOR,
        isPowered: false,
        powerTimer: 0,
        activeBuffs: [],
      },
    ];

    if (twoPlayer) {
      const p2Pos = this.mazeGenerator.getPlayer2StartPosition();
      players.push({
        id: 'player2',
        x: p2Pos.x,
        y: p2Pos.y,
        direction: Direction.NONE,
        nextDirection: Direction.NONE,
        score: 0,
        lives: 3,
        color: PLAYER2_COLOR,
        isPowered: false,
        powerTimer: 0,
        activeBuffs: [],
      });
    }

    const ghosts: Ghost[] = ghostPositions.map((pos, index) => ({
      id: `ghost-${index}`,
      x: pos.x,
      y: pos.y,
      color: GHOST_COLORS[index],
      direction: Direction.NONE,
      isScared: false,
      isEaten: false,
      scaredTimer: 0,
      respawnTimer: 0,
    }));

    const totalDots = this.mazeGenerator.countDots(maze);

    return {
      maze,
      players,
      ghosts,
      shockwaves: [],
      powerUpEffects: effects,
      totalDots,
      remainingDots: totalDots,
      powerUpRespawnTimer: POWER_UP_RESPAWN_INTERVAL,
    };
  }

  public setPlayerDirection(
    players: Player[],
    playerId: string,
    direction: Direction
  ): Player[] {
    return players.map((p) =>
      p.id === playerId ? { ...p, nextDirection: direction } : p
    );
  }

  public update(
    maze: CellType[][],
    players: Player[],
    ghosts: Ghost[],
    shockwaves: Shockwave[],
    powerUpEffects: PowerUpEffectsMap,
    deltaTime: number,
    status: GameStatus,
    powerUpRespawnTimer: number
  ): {
    maze: CellType[][];
    players: Player[];
    ghosts: Ghost[];
    shockwaves: Shockwave[];
    powerUpEffects: PowerUpEffectsMap;
    status: GameStatus;
    remainingDots: number;
    powerUpRespawnTimer: number;
  } {
    if (status !== 'playing') {
      return {
        maze,
        players,
        ghosts,
        shockwaves,
        powerUpEffects,
        status,
        remainingDots: this.countRemainingDots(maze),
        powerUpRespawnTimer,
      };
    }

    let newMaze = maze.map((row) => [...row]);
    let newPlayers = players.map((p) => ({ ...p, activeBuffs: p.activeBuffs.map(b => ({...b})) }));
    let newGhosts = ghosts.map((g) => ({ ...g }));
    let newShockwaves = [...shockwaves];
    let newPowerUpEffects = { ...powerUpEffects };
    let newStatus: GameStatus = status;
    let newPowerUpRespawnTimer = powerUpRespawnTimer;

    if (this.globalGhostFreezeTimer > 0) {
      this.globalGhostFreezeTimer -= deltaTime;
      if (this.globalGhostFreezeTimer < 0) this.globalGhostFreezeTimer = 0;
    }

    newPowerUpRespawnTimer -= deltaTime;
    if (newPowerUpRespawnTimer <= 0) {
      const result = this.mazeGenerator.respawnPowerUps(newMaze);
      newMaze = result.maze;
      newPowerUpEffects = result.effects;
      this.ghostAI.updateMaze(newMaze);
      newPowerUpRespawnTimer = POWER_UP_RESPAWN_INTERVAL;
    }

    for (let i = 0; i < newPlayers.length; i++) {
      newPlayers[i] = this.updatePlayerBuffs(newPlayers[i], deltaTime);

      const result = this.updatePlayer(
        newMaze,
        newPlayers[i],
        deltaTime,
        newShockwaves,
        newPowerUpEffects
      );
      newMaze = result.maze;
      newPlayers[i] = result.player;
      newShockwaves = result.shockwaves;
      newPowerUpEffects = result.effects;

      if (result.triggeredGhostFreeze) {
        this.globalGhostFreezeTimer = GHOST_FREEZE_DURATION;
      }
    }

    const activePlayers = newPlayers.filter((p) => p.lives > 0);
    const nearestPlayer = (gx: number, gy: number): Player | null => {
      if (activePlayers.length === 0) return null;
      let nearest = activePlayers[0];
      let minDist = Math.abs(gx - nearest.x) + Math.abs(gy - nearest.y);
      for (const p of activePlayers) {
        const dist = Math.abs(gx - p.x) + Math.abs(gy - p.y);
        if (dist < minDist) {
          minDist = dist;
          nearest = p;
        }
      }
      return nearest;
    };

    const ghostsFrozen = this.globalGhostFreezeTimer > 0;

    for (let i = 0; i < newGhosts.length; i++) {
      const ghost = newGhosts[i];

      if (ghost.isEaten) {
        ghost.respawnTimer -= deltaTime;
        if (ghost.respawnTimer <= 0) {
          const centerPos = this.mazeGenerator.getGhostStartPositions(1)[0];
          ghost.x = centerPos.x;
          ghost.y = centerPos.y;
          ghost.isEaten = false;
          ghost.isScared = false;
          ghost.scaredTimer = 0;
        }
        continue;
      }

      if (ghost.isScared) {
        ghost.scaredTimer -= deltaTime;
        if (ghost.scaredTimer <= 0) {
          ghost.isScared = false;
        }
      }

      if (ghostsFrozen) {
        ghost.direction = Direction.NONE;
        continue;
      }

      const player = nearestPlayer(ghost.x, ghost.y);
      if (player) {
        let dir: Direction;
        if (ghost.isScared) {
          dir = this.ghostAI.getFleeDirection(
            ghost.x,
            ghost.y,
            player.x,
            player.y
          );
        } else {
          dir = this.ghostAI.getNextDirection(
            ghost.x,
            ghost.y,
            player.x,
            player.y
          );
        }
        ghost.direction = dir;

        const speed = ghost.isScared ? GHOST_SCARED_SPEED : GHOST_SPEED;
        const moveAmount = (speed * deltaTime) / 1000;
        this.moveEntity(ghost, dir, moveAmount, newMaze);
      }
    }

    for (const player of newPlayers) {
      if (player.lives <= 0) continue;

      for (const ghost of newGhosts) {
        if (ghost.isEaten) continue;

        const dist = Math.sqrt(
          Math.pow(player.x - ghost.x, 2) + Math.pow(player.y - ghost.y, 2)
        );

        if (dist < 0.6) {
          if (ghost.isScared) {
            ghost.isEaten = true;
            ghost.respawnTimer = 3000;
            player.score += 200;
          } else if (!player.isPowered) {
            player.lives--;
            if (player.lives > 0) {
              const startPos = this.mazeGenerator.getStartPosition();
              player.x = startPos.x;
              player.y = startPos.y;
              player.direction = Direction.NONE;
              player.nextDirection = Direction.NONE;
            }
          }
        }
      }
    }

    for (let i = 0; i < newPlayers.length; i++) {
      if (newPlayers[i].isPowered) {
        newPlayers[i].powerTimer -= deltaTime;
        if (newPlayers[i].powerTimer <= 0) {
          newPlayers[i].isPowered = false;
        }
      }
    }

    newShockwaves = newShockwaves
      .map((sw) => {
        const progress = 1 - sw.alpha;
        return {
          ...sw,
          radius: sw.maxRadius * progress,
          alpha: sw.alpha - deltaTime / SHOCKWAVE_DURATION,
        };
      })
      .filter((sw) => sw.alpha > 0);

    const remainingDots = this.countRemainingDots(newMaze);

    const allPlayersDead = newPlayers.every((p) => p.lives <= 0);
    if (allPlayersDead) {
      newStatus = 'gameover';
    }

    if (remainingDots === 0) {
      newStatus = 'win';
    }

    return {
      maze: newMaze,
      players: newPlayers,
      ghosts: newGhosts,
      shockwaves: newShockwaves,
      powerUpEffects: newPowerUpEffects,
      status: newStatus,
      remainingDots,
      powerUpRespawnTimer: newPowerUpRespawnTimer,
    };
  }

  private updatePlayerBuffs(player: Player, deltaTime: number): Player {
    if (player.activeBuffs.length === 0) return player;

    const newBuffs: ActiveBuff[] = [];
    for (const buff of player.activeBuffs) {
      const remaining = buff.remainingTime - deltaTime;
      if (remaining > 0) {
        newBuffs.push({
          ...buff,
          remainingTime: remaining,
        });
      }
    }

    return { ...player, activeBuffs: newBuffs };
  }

  private hasBuff(player: Player, type: PowerUpEffectType): boolean {
    return player.activeBuffs.some((b) => b.type === type);
  }

  private addBuff(player: Player, type: PowerUpEffectType): Player {
    const duration = EFFECT_DURATION_MAP[type];
    const existingIndex = player.activeBuffs.findIndex((b) => b.type === type);

    const newBuffs = [...player.activeBuffs];
    if (existingIndex >= 0) {
      newBuffs[existingIndex] = {
        type,
        remainingTime: duration,
        totalTime: duration,
      };
    } else {
      newBuffs.push({
        type,
        remainingTime: duration,
        totalTime: duration,
      });
    }

    return { ...player, activeBuffs: newBuffs };
  }

  private updatePlayer(
    maze: CellType[][],
    player: Player,
    deltaTime: number,
    shockwaves: Shockwave[],
    effects: PowerUpEffectsMap
  ): {
    maze: CellType[][];
    player: Player;
    shockwaves: Shockwave[];
    effects: PowerUpEffectsMap;
    triggeredGhostFreeze: boolean;
  } {
    if (player.lives <= 0) {
      return { maze, player, shockwaves, effects, triggeredGhostFreeze: false };
    }

    const newMaze = maze.map((row) => [...row]);
    let newPlayer = { ...player, activeBuffs: [...player.activeBuffs.map(b => ({...b}))] };
    let newShockwaves = [...shockwaves];
    let newEffects = { ...effects };
    let triggeredGhostFreeze = false;

    const hasSpeedBoost = this.hasBuff(newPlayer, PowerUpEffectType.SPEED_BOOST);
    const hasScoreMultiplier = this.hasBuff(newPlayer, PowerUpEffectType.SCORE_MULTIPLIER);
    const baseSpeed = PLAYER_SPEED * (hasSpeedBoost ? 2 : 1);
    const moveAmount = (baseSpeed * deltaTime) / 1000;
    const scoreMultiplier = hasScoreMultiplier ? 2 : 1;

    if (newPlayer.nextDirection !== Direction.NONE) {
      const gridX = Math.round(newPlayer.x);
      const gridY = Math.round(newPlayer.y);
      const isAtCenter =
        Math.abs(newPlayer.x - gridX) < 0.1 &&
        Math.abs(newPlayer.y - gridY) < 0.1;

      if (isAtCenter) {
        const canTurn = this.canMove(gridX, gridY, newPlayer.nextDirection, newMaze);
        if (canTurn) {
          newPlayer.direction = newPlayer.nextDirection;
          newPlayer.x = gridX;
          newPlayer.y = gridY;
        }
      }
    }

    if (newPlayer.direction !== Direction.NONE) {
      this.moveEntity(newPlayer, newPlayer.direction, moveAmount, newMaze);
    }

    const gridX = Math.round(newPlayer.x);
    const gridY = Math.round(newPlayer.y);

    if (
      gridX >= 0 &&
      gridX < newMaze[0].length &&
      gridY >= 0 &&
      gridY < newMaze.length
    ) {
      const cell = newMaze[gridY][gridX];

      if (cell === CellType.PATH) {
        const dist = Math.sqrt(
          Math.pow(newPlayer.x - gridX, 2) + Math.pow(newPlayer.y - gridY, 2)
        );
        if (dist < 0.3) {
          newMaze[gridY][gridX] = CellType.EMPTY;
          newPlayer.score += 10 * scoreMultiplier;
        }
      } else if (cell === CellType.POWER_UP) {
        const dist = Math.sqrt(
          Math.pow(newPlayer.x - gridX, 2) + Math.pow(newPlayer.y - gridY, 2)
        );
        if (dist < 0.4) {
          const key = `${gridX},${gridY}`;
          const effectType = newEffects[key];

          newMaze[gridY][gridX] = CellType.EMPTY;
          delete newEffects[key];

          newPlayer.score += 50 * scoreMultiplier;
          newPlayer.isPowered = true;
          newPlayer.powerTimer = POWER_DURATION;

          let shockwaveType: PowerUpEffectType | undefined;

          if (effectType) {
            switch (effectType) {
              case PowerUpEffectType.SPEED_BOOST:
                newPlayer = this.addBuff(newPlayer, PowerUpEffectType.SPEED_BOOST);
                shockwaveType = PowerUpEffectType.SPEED_BOOST;
                break;
              case PowerUpEffectType.GHOST_FREEZE:
                triggeredGhostFreeze = true;
                shockwaveType = PowerUpEffectType.GHOST_FREEZE;
                break;
              case PowerUpEffectType.SCORE_MULTIPLIER:
                newPlayer = this.addBuff(newPlayer, PowerUpEffectType.SCORE_MULTIPLIER);
                shockwaveType = PowerUpEffectType.SCORE_MULTIPLIER;
                break;
            }
          }

          newShockwaves.push({
            id: uuidv4(),
            x: newPlayer.x,
            y: newPlayer.y,
            radius: 0,
            maxRadius: SHOCKWAVE_MAX_RADIUS,
            alpha: 1,
            effectType: shockwaveType,
          });
        }
      }
    }

    return {
      maze: newMaze,
      player: newPlayer,
      shockwaves: newShockwaves,
      effects: newEffects,
      triggeredGhostFreeze,
    };
  }

  private moveEntity(
    entity: { x: number; y: number },
    direction: Direction,
    amount: number,
    maze: CellType[][]
  ): void {
    let newX = entity.x;
    let newY = entity.y;

    switch (direction) {
      case Direction.UP:
        newY -= amount;
        break;
      case Direction.DOWN:
        newY += amount;
        break;
      case Direction.LEFT:
        newX -= amount;
        break;
      case Direction.RIGHT:
        newX += amount;
        break;
      default:
        return;
    }

    const gridX = Math.floor(newX);
    const gridY = Math.floor(newY);
    const gridX2 = Math.ceil(newX);
    const gridY2 = Math.ceil(newY);

    const checkPoints = [
      { x: gridX, y: gridY },
      { x: gridX2, y: gridY },
      { x: gridX, y: gridY2 },
      { x: gridX2, y: gridY2 },
    ];

    let canMove = true;
    for (const point of checkPoints) {
      if (
        point.x < 0 ||
        point.x >= maze[0].length ||
        point.y < 0 ||
        point.y >= maze.length
      ) {
        canMove = false;
        break;
      }
      if (maze[point.y][point.x] === CellType.WALL) {
        canMove = false;
        break;
      }
    }

    if (canMove) {
      entity.x = newX;
      entity.y = newY;
    }
  }

  private canMove(
    x: number,
    y: number,
    direction: Direction,
    maze: CellType[][]
  ): boolean {
    let nx = x;
    let ny = y;

    switch (direction) {
      case Direction.UP:
        ny -= 1;
        break;
      case Direction.DOWN:
        ny += 1;
        break;
      case Direction.LEFT:
        nx -= 1;
        break;
      case Direction.RIGHT:
        nx += 1;
        break;
      default:
        return true;
    }

    if (nx < 0 || nx >= maze[0].length || ny < 0 || ny >= maze.length) {
      return false;
    }

    return maze[ny][nx] !== CellType.WALL;
  }

  private countRemainingDots(maze: CellType[][]): number {
    let count = 0;
    for (let y = 0; y < maze.length; y++) {
      for (let x = 0; x < maze[y].length; x++) {
        if (maze[y][x] === CellType.PATH) {
          count++;
        }
      }
    }
    return count;
  }
}
