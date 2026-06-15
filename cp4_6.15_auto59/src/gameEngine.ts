import {
  Player,
  Platform,
  Coin,
  Spike,
  Goal,
  LevelData,
  GameState,
} from './types';
import {
  GRAVITY,
  JUMP_FORCE,
  MOVE_SPEED,
  PLAYER_SIZE,
  COIN_SCORE,
  INITIAL_LIVES,
  CANVAS_HEIGHT,
  levels,
  COIN_RADIUS,
  PLATFORM_HEIGHT,
} from './levels';

export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
  jumpPressed: boolean;
}

export function createInitialState(): GameState {
  const firstLevel = levels[0];
  return {
    player: createPlayer(firstLevel.playerStart.x, firstLevel.playerStart.y),
    platforms: [...firstLevel.platforms],
    coins: firstLevel.coins.map(c => ({ ...c })),
    spikes: [...firstLevel.spikes],
    goal: { ...firstLevel.goal },
    score: 0,
    lives: INITIAL_LIVES,
    level: 0,
    gameStatus: 'menu',
    animationFrame: 0,
    selectedTool: null,
    customLevel: null,
  };
}

function createPlayer(x: number, y: number): Player {
  return {
    x,
    y,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    vx: 0,
    vy: 0,
    isGrounded: false,
    isJumping: false,
  };
}

export function loadLevel(state: GameState, levelIndex: number): GameState {
  const levelData = state.customLevel || levels[levelIndex];
  if (!levelData) return state;

  return {
    ...state,
    player: createPlayer(levelData.playerStart.x, levelData.playerStart.y),
    platforms: levelData.platforms.map(p => ({ ...p })),
    coins: levelData.coins.map(c => ({ ...c, collected: false, collectAnimation: 0 })),
    spikes: levelData.spikes.map(s => ({ ...s })),
    goal: { ...levelData.goal },
    level: levelIndex,
    gameStatus: 'playing',
  };
}

export function resetPlayer(state: GameState): GameState {
  const levelData = state.customLevel || levels[state.level];
  if (!levelData) return state;

  return {
    ...state,
    player: createPlayer(levelData.playerStart.x, levelData.playerStart.y),
  };
}

export function updateGame(
  state: GameState,
  input: InputState,
  deltaTime: number
): GameState {
  if (state.gameStatus !== 'playing') {
    return {
      ...state,
      animationFrame: state.animationFrame + 1,
    };
  }

  let player = { ...state.player };
  let coins = state.coins.map(c => ({ ...c }));
  let score = state.score;
  let lives = state.lives;
  let gameStatus: GameState['gameStatus'] = state.gameStatus;
  const wasGrounded = player.isGrounded;

  player.vx = 0;
  if (input.left) {
    player.vx = -MOVE_SPEED;
  }
  if (input.right) {
    player.vx = MOVE_SPEED;
  }

  player.vy += GRAVITY;

  player.x += player.vx;
  player.y += player.vy;

  player.isGrounded = false;

  for (const platform of state.platforms) {
    const collision = checkPlatformCollision(player, platform);
    if (collision.collided) {
      if (collision.fromTop) {
        player.y = platform.y - player.height;
        player.vy = 0;
        player.isGrounded = true;
        player.isJumping = false;
      } else if (collision.fromBottom) {
        player.y = platform.y + platform.height;
        player.vy = 0;
      } else if (collision.fromLeft) {
        player.x = platform.x - player.width;
      } else if (collision.fromRight) {
        player.x = platform.x + platform.width;
      }
    }
  }

  if (player.x < 0) {
    player.x = 0;
  }
  if (player.x + player.width > 800) {
    player.x = 800 - player.width;
  }

  if (input.jumpPressed && player.isGrounded) {
    player.vy = JUMP_FORCE;
    player.isGrounded = false;
    player.isJumping = true;
  }

  for (const coin of coins) {
    if (!coin.collected && checkCoinCollision(player, coin)) {
      coin.collected = true;
      coin.collectAnimation = 1;
      score += COIN_SCORE;
    }
    if (coin.collectAnimation > 0) {
      coin.collectAnimation -= 0.05;
      if (coin.collectAnimation < 0) coin.collectAnimation = 0;
    }
  }

  for (const spike of state.spikes) {
    if (checkSpikeCollision(player, spike)) {
      lives--;
      if (lives <= 0) {
        gameStatus = 'lost';
      } else {
        const levelData = state.customLevel || levels[state.level];
        if (levelData) {
          player = createPlayer(levelData.playerStart.x, levelData.playerStart.y);
        }
      }
      break;
    }
  }

  if (player.y > CANVAS_HEIGHT + 50) {
    lives--;
    if (lives <= 0) {
      gameStatus = 'lost';
    } else {
      const levelData = state.customLevel || levels[state.level];
      if (levelData) {
        player = createPlayer(levelData.playerStart.x, levelData.playerStart.y);
      }
    }
  }

  if (checkGoalCollision(player, state.goal)) {
    gameStatus = 'won';
  }

  return {
    ...state,
    player,
    coins,
    score,
    lives,
    gameStatus,
    animationFrame: state.animationFrame + 1,
  };
}

interface PlatformCollisionResult {
  collided: boolean;
  fromTop: boolean;
  fromBottom: boolean;
  fromLeft: boolean;
  fromRight: boolean;
}

function checkPlatformCollision(
  player: Player,
  platform: Platform
): PlatformCollisionResult {
  const result: PlatformCollisionResult = {
    collided: false,
    fromTop: false,
    fromBottom: false,
    fromLeft: false,
    fromRight: false,
  };

  if (
    player.x < platform.x + platform.width &&
    player.x + player.width > platform.x &&
    player.y < platform.y + platform.height &&
    player.y + player.height > platform.y
  ) {
    result.collided = true;

    const overlapLeft = player.x + player.width - platform.x;
    const overlapRight = platform.x + platform.width - player.x;
    const overlapTop = player.y + player.height - platform.y;
    const overlapBottom = platform.y + platform.height - player.y;

    const minOverlapX = Math.min(overlapLeft, overlapRight);
    const minOverlapY = Math.min(overlapTop, overlapBottom);

    if (minOverlapY < minOverlapX) {
      if (overlapTop < overlapBottom && player.vy >= 0) {
        result.fromTop = true;
      } else if (player.vy < 0) {
        result.fromBottom = true;
      }
    } else {
      if (overlapLeft < overlapRight) {
        result.fromLeft = true;
      } else {
        result.fromRight = true;
      }
    }
  }

  return result;
}

function checkCoinCollision(player: Player, coin: Coin): boolean {
  const playerCenterX = player.x + player.width / 2;
  const playerCenterY = player.y + player.height / 2;
  const dx = playerCenterX - coin.x;
  const dy = playerCenterY - coin.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < coin.radius + Math.min(player.width, player.height) / 2;
}

function checkSpikeCollision(player: Player, spike: Spike): boolean {
  return (
    player.x < spike.x + spike.width &&
    player.x + player.width > spike.x &&
    player.y < spike.y + spike.height &&
    player.y + player.height > spike.y
  );
}

function checkGoalCollision(player: Player, goal: Goal): boolean {
  return (
    player.x < goal.x + goal.width &&
    player.x + player.width > goal.x &&
    player.y < goal.y + goal.height &&
    player.y + player.height > goal.y
  );
}

export function getCoinY(coin: Coin, animationFrame: number): number {
  const floatAmount = 5;
  const floatSpeed = 0.05;
  return coin.y + Math.sin(animationFrame * floatSpeed + coin.floatOffset) * floatAmount;
}

export function saveCustomLevel(levelData: LevelData): void {
  localStorage.setItem('customPlatformLevel', JSON.stringify(levelData));
}

export function loadCustomLevel(): LevelData | null {
  const saved = localStorage.getItem('customPlatformLevel');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }
  return null;
}

export function createEmptyLevel(): LevelData {
  return {
    playerStart: { x: 50, y: 300 },
    platforms: [
      { x: 0, y: 370, width: 200, height: PLATFORM_HEIGHT },
    ],
    coins: [],
    spikes: [],
    goal: { x: 700, y: 310, width: 40, height: 60 },
  };
}
