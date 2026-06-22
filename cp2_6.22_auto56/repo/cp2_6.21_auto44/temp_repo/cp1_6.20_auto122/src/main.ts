import './style.css';
import { GameState } from './gameState';
import { LevelGenerator } from './levelGenerator';
import { PlayerController } from './player';
import { Renderer } from './renderer';

const MAP_WIDTH = 20;
const MAP_HEIGHT = 20;

class Game {
  private gameState: GameState;
  private levelGenerator: LevelGenerator;
  private playerController: PlayerController;
  private renderer: Renderer;
  private lastTime: number = 0;
  private stateChanged: boolean = true;
  private animationFrameId: number | null = null;

  constructor() {
    this.gameState = new GameState(MAP_WIDTH, MAP_HEIGHT);
    this.levelGenerator = new LevelGenerator(MAP_WIDTH, MAP_HEIGHT);
    this.playerController = new PlayerController(this.gameState);
    this.renderer = new Renderer(this.gameState, this.levelGenerator);

    this.init();
  }

  private init(): void {
    this.generateNewLevel();
    this.setupEventListeners();
    this.startGameLoop();
    this.gameState.addCombatLog('欢迎来到地牢！使用WASD或方向键移动', 'system');
    this.gameState.addCombatLog('按I键打开背包，按R键重新开始', 'system');
  }

  private generateNewLevel(): void {
    const { map, playerStart, enemies, chests } = this.levelGenerator.generateLevel();

    this.gameState.data.map = map;
    this.gameState.data.player.position = { ...playerStart };
    this.gameState.data.enemies = enemies;
    this.gameState.data.chests = chests;

    this.stateChanged = true;
  }

  private setupEventListeners(): void {
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));

    document.addEventListener('equip-item', ((e: CustomEvent) => {
      const { index } = e.detail;
      if (this.playerController.equipItem(index)) {
        this.stateChanged = true;
      }
    }) as EventListener);
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (this.playerController.isCombatInProgress()) {
      return;
    }

    const key = e.key.toLowerCase();

    if (key === 'r') {
      this.restartGame();
      return;
    }

    if (key === 'i') {
      this.playerController.toggleInventory();
      this.stateChanged = true;
      return;
    }

    if (this.gameState.data.showInventory) {
      if (key === 'escape') {
        this.playerController.toggleInventory();
        this.stateChanged = true;
      }
      return;
    }

    let dx = 0;
    let dy = 0;

    switch (key) {
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

    const oldPos = { ...this.gameState.data.player.position };
    const moved = this.playerController.move(dx, dy);

    if (moved) {
      this.stateChanged = true;

      const newPos = this.gameState.data.player.position;
      if (oldPos.x !== newPos.x || oldPos.y !== newPos.y) {
        setTimeout(() => {
          this.renderer.highlightPlayerPosition();
        }, 50);
      } else {
        const enemyX = oldPos.x + dx;
        const enemyY = oldPos.y + dy;
        if (enemyX >= 0 && enemyX < MAP_WIDTH && enemyY >= 0 && enemyY < MAP_HEIGHT) {
          setTimeout(() => {
            this.renderer.flashCombatTile(enemyX, enemyY);
          }, 50);
        }
      }
    }
  }

  private restartGame(): void {
    this.gameState.reset();
    this.generateNewLevel();
    this.gameState.addCombatLog('新的冒险开始了！', 'system');
  }

  private startGameLoop(): void {
    const gameLoop = (timestamp: number) => {
      if (timestamp - this.lastTime >= 1000 / 60) {
        this.update();
        this.render();
        this.lastTime = timestamp;
      }

      this.animationFrameId = requestAnimationFrame(gameLoop);
    };

    this.animationFrameId = requestAnimationFrame(gameLoop);
  }

  private update(): void {
    if (this.gameState.data.isGameOver) {
      return;
    }
  }

  private render(): void {
    if (this.stateChanged || this.gameState.data.isGameOver || this.gameState.data.showInventory) {
      this.renderer.render();
      this.stateChanged = false;
    }
  }

  public destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new Game();
});
