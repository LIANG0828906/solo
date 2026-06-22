import { TypingEngine, RoundResult } from './typingEngine';
import { UIRenderer } from './uiRenderer';
import { ResultCard } from './resultCard';

class App {
  private engine: TypingEngine;
  private renderer: UIRenderer;
  private resultCard: ResultCard;
  private container: HTMLElement;

  constructor() {
    this.container = document.getElementById('app')!;
    this.engine = new TypingEngine();
    this.renderer = new UIRenderer(this.container, this.engine);
    this.resultCard = new ResultCard(this.container, this.engine);

    this.setupKeyboardEvents();
    this.setupEngineEvents();

    this.engine.startNewRound();
    this.renderer.start();
  }

  private setupKeyboardEvents(): void {
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (this.resultCard.isVisible()) return;

      if (e.key === 'Backspace') {
        e.preventDefault();
        this.engine.handleBackspace();
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        this.engine.handleEnter();
        return;
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        this.engine.handleInput(e.key);
      }
    });
  }

  private setupEngineEvents(): void {
    this.engine.on('roundEnd', (result: RoundResult) => {
      setTimeout(() => {
        this.resultCard.show(result);
      }, 200);
    });

    this.resultCard.on('restart', () => {
      this.engine.startNewRound();
      this.renderer.resizeCanvases();
      this.renderer.forceRender();
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new App();
});
