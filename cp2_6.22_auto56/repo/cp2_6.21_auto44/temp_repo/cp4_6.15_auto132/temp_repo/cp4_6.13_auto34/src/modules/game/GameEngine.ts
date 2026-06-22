import type { Position } from '../../store/types';
import { useGameStore } from '../../store/gameStore';

export class GameEngine {
  private lastTime: number = 0;
  private animationFrameId: number | null = null;
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor() {
    this.lastTime = performance.now();
  }

  public start(): void {
    this.setupKeyListener();
    this.gameLoop();
  }

  public stop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.removeKeyListener();
  }

  private setupKeyListener(): void {
    this.keyHandler = (e: KeyboardEvent) => {
      this.handleKeyPress(e);
    };
    window.addEventListener('keydown', this.keyHandler);
  }

  private removeKeyListener(): void {
    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = null;
    }
  }

  private handleKeyPress(e: KeyboardEvent): void {
    const state = useGameStore.getState();

    if (state.gamePhase === 'gameover' || state.gamePhase === 'victory') return;
    if (state.isSearching) return;

    if (state.gameView === 'map') {
      let dx = 0;
      let dy = 0;
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          dy = -1;
          break;
        case 's':
        case 'arrowdown':
          dy = 1;
          break;
        case 'a':
        case 'arrowleft':
          dx = -1;
          break;
        case 'd':
        case 'arrowright':
          dx = 1;
          break;
        default:
          return;
      }
      e.preventDefault();
      this.movePlayer(dx, dy);
    } else if (state.gameView === 'diving' && state.engineStarted) {
      let delta = 0;
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          delta = -5;
          break;
        case 's':
        case 'arrowdown':
          delta = 5;
          break;
        default:
          return;
      }
      e.preventDefault();
      this.changeDepth(delta);
    }
  }

  public movePlayer(dx: number, dy: number): void {
    const state = useGameStore.getState();
    if (state.stamina < 1) {
      state.addEvent('体力不足，无法移动！请等待恢复。', 'warning');
      return;
    }

    const current = state.playerPosition;
    const targetX = current.x + dx;
    const targetY = current.y + dy;

    if (targetX < 0 || targetX >= state.mapSize || targetY < 0 || targetY >= state.mapSize) {
      return;
    }

    const tile = state.mapData[targetY][targetX];
    if (tile === 'trench') {
      state.addEvent('前方是深海沟，无法通行！', 'warning');
      return;
    }

    const newPos: Position = { x: targetX, y: targetY };
    useGameStore.setState({ playerPosition: newPos });
    state.revealFog(targetX, targetY);
    state.consumeStamina(1);
    state.incrementTurn();

    if (state.turn % 3 === 0 && state.stamina < state.maxStamina) {
      state.addStamina(1);
    }

    if (tile === 'wreck' && !state.isWreckSearched(targetX, targetY)) {
      state.addEvent('发现沉船残骸！点击该格子开始搜索。', 'info');
    }
  }

  public changeDepth(delta: number): void {
    const state = useGameStore.getState();
    const newDepth = state.depth + delta;
    state.setDepth(newDepth);

    if (delta > 0) {
      let oxygenCost = 0.5;
      if (newDepth > 50) {
        oxygenCost = 1.0;
        const pressureIncrease = 2;
        state.setPressure(state.pressure + pressureIncrease);
      }
      state.consumeOxygen(oxygenCost);
    } else if (delta < 0) {
      state.consumeOxygen(0.3);
      if (state.pressure > 0) {
        state.setPressure(state.pressure - 1);
      }
    }
  }

  public clickWreckTile(pos: Position): void {
    const state = useGameStore.getState();
    const tile = state.mapData[pos.y]?.[pos.x];

    if (tile !== 'wreck') {
      return;
    }

    if (state.isWreckSearched(pos.x, pos.y)) {
      state.addEvent('这艘沉船已经搜索过了。', 'info');
      return;
    }

    const playerDist = Math.abs(pos.x - state.playerPosition.x) + Math.abs(pos.y - state.playerPosition.y);
    if (playerDist > 0) {
      state.addEvent('请先移动到沉船格子上再搜索。', 'warning');
      return;
    }

    if (!state.consumeStamina(10)) {
      return;
    }

    state.setGamePhase('searching');
    state.startSearch(pos);
  }

  private gameLoop = (): void => {
    const now = performance.now();
    const _deltaTime = (now - this.lastTime) / 1000;
    this.lastTime = now;

    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };
}

export const gameEngine = new GameEngine();
