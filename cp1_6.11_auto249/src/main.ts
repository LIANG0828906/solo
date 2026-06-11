import './style.css';
import { Game } from './game';
import { UIRenderer } from './ui';

class App {
  private game: Game;
  private ui: UIRenderer;
  private unsubscribe: (() => void) | null = null;

  constructor() {
    this.game = new Game();
    this.ui = new UIRenderer(this.game);
  }

  start(): void {
    this.ui.init();
    this.ui.bindGrinderEvents();

    this.unsubscribe = this.game.subscribe(() => {
      this.ui.render();
    });

    this.ui.render();

    console.log('%c古法合香 · 香室雅集', 'font-size:24px;color:#5C3A21;font-weight:bold;padding:8px 16px;background:#F5E6C8;border-radius:4px;');
    console.log('%c沉香、檀香、龙脑、麝香、丁香、乳香，六味俱全，静候调香。', 'font-size:14px;color:#8B7355;');
  }

  destroy(): void {
    if (this.unsubscribe) this.unsubscribe();
    this.game.destroy();
    this.ui.destroy();
  }
}

const app = new App();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.start());
} else {
  app.start();
}

(window as any).__app = app;
