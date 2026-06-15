import { GameEngine } from './game-engine';
import { CanvasRenderer } from './canvas-renderer';
import { UIModule } from './ui-module';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  const uiContainer = document.getElementById('ui-container') as HTMLElement;

  const renderer = new CanvasRenderer(canvas);
  const ui = new UIModule(uiContainer);
  const engine = new GameEngine();

  renderer.start();
  engine.start();
});
