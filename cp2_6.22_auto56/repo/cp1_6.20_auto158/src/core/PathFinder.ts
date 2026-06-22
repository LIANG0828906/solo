export interface Position {
  x: number;
  y: number;
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Enemy {
  x: number;
  y: number;
  radius: number;
}

export interface Coin {
  x: number;
  y: number;
}

export interface LevelData {
  startPos: Position;
  endPos: Position;
  platforms: Platform[];
  enemies: Enemy[];
  coins: Coin[];
  width: number;
  height: number;
}

export interface PathResult {
  path: Position[];
  success: boolean;
  steps: number;
  coinsCollected: number;
}

interface State {
  x: number;
  y: number;
  vy: number;
  onGround: boolean;
}

const GRAVITY = 0.5;
const CELL_SIZE = 1;

export class PathFinder {
  private level: LevelData;
  private jumpPower: number;
  private moveSpeed: number;

  constructor(level: LevelData, jumpPower: number = 12, moveSpeed: number = 3) {
    this.level = level;
    this.jumpPower = jumpPower;
    this.moveSpeed = moveSpeed;
  }

  findPath(): PathResult {
    const start: State = {
      x: this.level.startPos.x,
      y: this.level.startPos.y,
      vy: 0,
      onGround: true,
    };

    const visited = new Set<string>();
    const queue: { state: State; path: Position[] }[] = [{ state: start, path: [{ x: start.x, y: start.y }] }];

    const maxIterations = 10000;
    let iterations = 0;

    while (queue.length > 0 && iterations < maxIterations) {
      iterations++;
      const current = queue.shift()!;
      const { state, path } = current;

      const stateKey = `${Math.floor(state.x / CELL_SIZE)},${Math.floor(state.y / CELL_SIZE)},${state.onGround ? 'g' : 'a'}`;
      if (visited.has(stateKey)) continue;
      visited.add(stateKey);

      if (this.isAtEnd(state)) {
        const coinsCollected = this.countCoins(path);
        return { path, success: true, steps: path.length, coinsCollected };
      }

      if (state.y > this.level.height + 100) {
        continue;
      }

      const actions: { dx: number; jump: boolean }[] = [
        { dx: this.moveSpeed, jump: false },
        { dx: -this.moveSpeed, jump: false },
        { dx: this.moveSpeed, jump: true },
        { dx: -this.moveSpeed, jump: true },
      ];

      for (const action of actions) {
        if (action.jump && !state.onGround) continue;

        const nextState = this.simulateStep(state, action.dx, action.jump);
        
        if (this.checkCollision(nextState.x, nextState.y)) continue;
        if (this.checkEnemyCollision(nextState.x, nextState.y)) continue;

        const newPath = [...path, { x: nextState.x, y: nextState.y }];
        queue.push({ state: nextState, path: newPath });
      }
    }

    return {
      path: [this.level.startPos],
      success: false,
      steps: iterations,
      coinsCollected: 0,
    };
  }

  private simulateStep(state: State, dx: number, jump: boolean): State {
    let newVy = state.vy;
    let newOnGround = state.onGround;

    if (jump && state.onGround) {
      newVy = -this.jumpPower;
      newOnGround = false;
    }

    if (!newOnGround) {
      newVy += GRAVITY;
    }

    let newX = state.x + dx;
    let newY = state.y + newVy;

    newOnGround = false;
    for (const platform of this.level.platforms) {
      if (
        newX >= platform.x - 10 &&
        newX <= platform.x + platform.width + 10 &&
        newY >= platform.y - 5 &&
        newY <= platform.y + platform.height &&
        state.y <= platform.y &&
        newVy >= 0
      ) {
        newY = platform.y;
        newVy = 0;
        newOnGround = true;
        break;
      }
    }

    if (newY >= this.level.height - 20) {
      newY = this.level.height - 20;
      newVy = 0;
      newOnGround = true;
    }

    if (newX < 0) newX = 0;
    if (newX > this.level.width) newX = this.level.width;

    return { x: newX, y: newY, vy: newVy, onGround: newOnGround };
  }

  private checkCollision(x: number, y: number): boolean {
    for (const platform of this.level.platforms) {
      if (
        x > platform.x &&
        x < platform.x + platform.width &&
        y > platform.y &&
        y < platform.y + platform.height
      ) {
        return true;
      }
    }
    return false;
  }

  private checkEnemyCollision(x: number, y: number): boolean {
    for (const enemy of this.level.enemies) {
      const dx = x - enemy.x;
      const dy = y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < enemy.radius + 15) {
        return true;
      }
    }
    return false;
  }

  private isAtEnd(state: State): boolean {
    const dx = state.x - this.level.endPos.x;
    const dy = state.y - this.level.endPos.y;
    return Math.abs(dx) < 40 && Math.abs(dy) < 60;
  }

  private countCoins(path: Position[]): number {
    let count = 0;
    const collected = new Set<number>();
    
    for (const pos of path) {
      for (let i = 0; i < this.level.coins.length; i++) {
        if (collected.has(i)) continue;
        const coin = this.level.coins[i];
        const dx = pos.x - coin.x;
        const dy = pos.y - coin.y;
        if (Math.sqrt(dx * dx + dy * dy) < 25) {
          collected.add(i);
          count++;
        }
      }
    }
    
    return count;
  }
}
