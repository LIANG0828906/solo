import { Game } from './game';

class GameApp {
  private canvas: HTMLCanvasElement;
  private uiContainer: HTMLElement;
  private game: Game;

  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.uiContainer = document.getElementById('ui-container') as HTMLElement;
    this.game = new Game(this.canvas);

    this.showStartScreen();
  }

  private showStartScreen(): void {
    this.clearUI();
    this.game.renderStartScreen();

    const buttonContainer = document.createElement('div');
    buttonContainer.style.position = 'absolute';
    buttonContainer.style.top = '50%';
    buttonContainer.style.left = '50%';
    buttonContainer.style.transform = 'translate(-50%, -50%)';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.flexDirection = 'column';
    buttonContainer.style.gap = '20px';
    buttonContainer.style.alignItems = 'center';
    buttonContainer.style.marginTop = '40px';

    const difficulties = [
      { key: 'easy', label: '简单', desc: '障碍车速度慢' },
      { key: 'normal', label: '普通', desc: '标准难度' },
      { key: 'hard', label: '困难', desc: '速度快，生成密' }
    ];

    difficulties.forEach(diff => {
      const btn = document.createElement('button');
      btn.textContent = diff.label;
      btn.style.width = '200px';
      btn.style.height = '56px';
      btn.style.fontSize = '20px';
      btn.style.fontWeight = 'bold';
      btn.style.color = '#ffffff';
      btn.style.backgroundColor = '#3b82f6';
      btn.style.border = 'none';
      btn.style.borderRadius = '12px';
      btn.style.cursor = 'pointer';
      btn.style.transition = 'background-color 0.2s, transform 0.1s';
      btn.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';

      btn.addEventListener('mouseenter', () => {
        btn.style.backgroundColor = '#2563eb';
        btn.style.transform = 'scale(1.05)';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.backgroundColor = '#3b82f6';
        btn.style.transform = 'scale(1)';
      });
      btn.addEventListener('mousedown', () => {
        btn.style.transform = 'scale(0.98)';
      });
      btn.addEventListener('mouseup', () => {
        btn.style.transform = 'scale(1.05)';
      });

      btn.addEventListener('click', () => {
        this.startGame(diff.key as 'easy' | 'normal' | 'hard');
      });

      buttonContainer.appendChild(btn);
    });

    this.uiContainer.appendChild(buttonContainer);
  }

  private startGame(difficulty: 'easy' | 'normal' | 'hard'): void {
    this.clearUI();
    this.game.setDifficulty(difficulty);
    this.game.onGameOver(() => this.showGameOverScreen());
    this.game.start();
  }

  private showGameOverScreen(): void {
    const state = this.game.getState();
    const isNewRecord = state.score >= state.highScore && state.score > 0;

    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.pointerEvents = 'none';

    const buttonContainer = document.createElement('div');
    buttonContainer.style.marginTop = '320px';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.flexDirection = 'column';
    buttonContainer.style.gap = '16px';
    buttonContainer.style.alignItems = 'center';
    buttonContainer.style.pointerEvents = 'auto';

    const restartBtn = document.createElement('button');
    restartBtn.textContent = '重新开始';
    restartBtn.style.width = '180px';
    restartBtn.style.height = '52px';
    restartBtn.style.fontSize = '18px';
    restartBtn.style.fontWeight = 'bold';
    restartBtn.style.color = '#ffffff';
    restartBtn.style.backgroundColor = '#3b82f6';
    restartBtn.style.border = 'none';
    restartBtn.style.borderRadius = '12px';
    restartBtn.style.cursor = 'pointer';
    restartBtn.style.transition = 'background-color 0.2s, transform 0.1s';
    restartBtn.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';

    restartBtn.addEventListener('mouseenter', () => {
      restartBtn.style.backgroundColor = '#2563eb';
      restartBtn.style.transform = 'scale(1.05)';
    });
    restartBtn.addEventListener('mouseleave', () => {
      restartBtn.style.backgroundColor = '#3b82f6';
      restartBtn.style.transform = 'scale(1)';
    });
    restartBtn.addEventListener('mousedown', () => {
      restartBtn.style.transform = 'scale(0.98)';
    });
    restartBtn.addEventListener('mouseup', () => {
      restartBtn.style.transform = 'scale(1.05)';
    });

    restartBtn.addEventListener('click', () => {
      this.restartGame();
    });

    const menuBtn = document.createElement('button');
    menuBtn.textContent = '返回菜单';
    menuBtn.style.width = '180px';
    menuBtn.style.height = '44px';
    menuBtn.style.fontSize = '16px';
    menuBtn.style.fontWeight = 'bold';
    menuBtn.style.color = '#cbd5e1';
    menuBtn.style.backgroundColor = 'transparent';
    menuBtn.style.border = '2px solid #475569';
    menuBtn.style.borderRadius = '12px';
    menuBtn.style.cursor = 'pointer';
    menuBtn.style.transition = 'all 0.2s';

    menuBtn.addEventListener('mouseenter', () => {
      menuBtn.style.color = '#ffffff';
      menuBtn.style.borderColor = '#64748b';
    });
    menuBtn.addEventListener('mouseleave', () => {
      menuBtn.style.color = '#cbd5e1';
      menuBtn.style.borderColor = '#475569';
    });

    menuBtn.addEventListener('click', () => {
      this.backToMenu();
    });

    buttonContainer.appendChild(restartBtn);
    buttonContainer.appendChild(menuBtn);
    overlay.appendChild(buttonContainer);
    this.uiContainer.appendChild(overlay);
  }

  private restartGame(): void {
    this.game.stop();
    this.clearUI();
    this.game.start();
    this.game.onGameOver(() => this.showGameOverScreen());
  }

  private backToMenu(): void {
    this.game.stop();
    this.clearUI();
    this.showStartScreen();
  }

  private clearUI(): void {
    while (this.uiContainer.firstChild) {
      this.uiContainer.removeChild(this.uiContainer.firstChild);
    }
  }

  public destroy(): void {
    this.game.destroy();
  }
}

let app: GameApp;

window.addEventListener('DOMContentLoaded', () => {
  app = new GameApp();
});

window.addEventListener('beforeunload', () => {
  if (app) {
    app.destroy();
  }
});
