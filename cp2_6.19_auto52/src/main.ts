import { GameMap } from './map';
import { Player } from './player';
import { Renderer } from './renderer';
import { HUD } from './hud';

class Game {
  private gameMap: GameMap;
  private player: Player;
  private renderer: Renderer;
  private hud: HUD;
  private canvas: HTMLCanvasElement;

  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error('找不到Canvas元素');
    }

    const hudContainer = document.getElementById('hud-container');
    if (!hudContainer) {
      throw new Error('找不到HUD容器');
    }

    this.gameMap = new GameMap();
    this.player = new Player(0, 0);
    this.hud = new HUD(hudContainer, this.gameMap.getTotalChests());
    this.renderer = new Renderer(this.canvas, this.gameMap, this.player, this.hud);

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        this.restart();
        return;
      }
      this.player.handleKeyDown(e);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      this.player.handleKeyUp(e);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
  }

  start(): void {
    this.renderer.start();
  }

  stop(): void {
    this.renderer.stop();
  }

  restart(): void {
    this.stop();
    this.gameMap.reset();
    this.player.reset();
    this.hud.reset();
    this.renderer.reset();
    this.renderer.setScore(0);
    this.start();
  }
}

const game = new Game();
game.start();
