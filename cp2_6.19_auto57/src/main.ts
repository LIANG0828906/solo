import { GameEngine, eventBus } from './gameEngine';
import { Renderer } from './renderer';
import { UIController } from './uiController';

class App {
  private engine: GameEngine;
  private renderer: Renderer;
  private uiController: UIController;

  constructor() {
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;

    this.engine = new GameEngine();
    this.renderer = new Renderer(canvas);
    this.uiController = new UIController();

    this.init();
  }

  private init(): void {
    this.uiController.setInitialState(
      this.engine.getScore(),
      this.engine.getHighScore(),
      this.engine.getLevel()
    );

    this.renderer.buildGrid(this.engine.getCells());

    eventBus.on('gem-clicked', (data: { row: number; col: number }) => {
      this.engine.handleGemClick(data.row, data.col);
    });

    eventBus.on('game-reset', () => {
      this.engine.resetGame();
    });

    eventBus.on('grid-updated', (data: { cells: any[][]; gridSize: number; cellSize: number }) => {
      this.renderer.buildGrid(data.cells);
    });
  }

  public dispose(): void {
    this.renderer.dispose();
    this.uiController.dispose();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  (window as any).app = app;
});
