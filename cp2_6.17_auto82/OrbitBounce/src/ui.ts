export class UI {
  private container: HTMLElement;
  private scoreEl!: HTMLElement;
  private livesEl!: HTMLElement;
  private timeEl!: HTMLElement;
  private gameOverPanel!: HTMLElement;
  private finalScoreEl!: HTMLElement;
  private restartBtn!: HTMLElement;
  private panelEl!: HTMLElement;
  private scoreFlashTimeout: number = 0;

  constructor(container: HTMLElement) {
    this.container = container;
    this.createInfoPanel();
    this.createGameOverPanel();
  }

  private createInfoPanel(): void {
    this.panelEl = document.createElement('div');
    this.panelEl.id = 'info-panel';
    Object.assign(this.panelEl.style, {
      position: 'absolute',
      top: '16px',
      left: '16px',
      background: 'rgba(20,20,40,0.8)',
      borderRadius: '8px',
      padding: '12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      zIndex: '10',
      boxShadow: '0 0 4px rgba(108,99,255,0.4)',
      border: '1px solid rgba(108,99,255,0.3)',
      fontFamily: "'Segoe UI', Arial, sans-serif"
    });

    const scoreLabel = document.createElement('div');
    scoreLabel.style.cssText = 'color: #00E5FF; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;';
    scoreLabel.textContent = 'SCORE';

    this.scoreEl = document.createElement('div');
    this.scoreEl.style.cssText = 'color: #FFFFFF; font-size: 18px; font-weight: bold;';
    this.scoreEl.textContent = '0';

    const livesLabel = document.createElement('div');
    livesLabel.style.cssText = 'color: #FF007F; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;';
    livesLabel.textContent = 'LIVES';

    this.livesEl = document.createElement('div');
    this.livesEl.style.cssText = 'display: flex; gap: 4px;';
    this.updateLives(3);

    const timeLabel = document.createElement('div');
    timeLabel.style.cssText = 'color: #6C63FF; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px;';
    timeLabel.textContent = 'TIME';

    this.timeEl = document.createElement('div');
    this.timeEl.style.cssText = 'color: #FFFFFF; font-size: 14px;';
    this.timeEl.textContent = '00:00';

    this.panelEl.appendChild(scoreLabel);
    this.panelEl.appendChild(this.scoreEl);
    this.panelEl.appendChild(livesLabel);
    this.panelEl.appendChild(this.livesEl);
    this.panelEl.appendChild(timeLabel);
    this.panelEl.appendChild(this.timeEl);
    this.container.appendChild(this.panelEl);
  }

  private createGameOverPanel(): void {
    this.gameOverPanel = document.createElement('div');
    Object.assign(this.gameOverPanel.style, {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '320px',
      background: 'rgba(20,20,40,0.95)',
      borderRadius: '16px',
      border: '1px solid #4A4A6E',
      padding: '32px 24px',
      display: 'none',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '20px',
      zIndex: '20',
      boxShadow: '0 0 20px rgba(108,99,255,0.3), 0 0 4px rgba(0,229,255,0.2)'
    });

    const title = document.createElement('div');
    title.style.cssText = 'color: #FF007F; font-size: 24px; font-weight: bold; text-transform: uppercase; letter-spacing: 3px;';
    title.textContent = 'GAME OVER';

    const scoreLabel = document.createElement('div');
    scoreLabel.style.cssText = 'color: #00E5FF; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;';
    scoreLabel.textContent = 'Final Score';

    this.finalScoreEl = document.createElement('div');
    this.finalScoreEl.style.cssText = 'color: #FFFFFF; font-size: 28px; font-weight: bold;';
    this.finalScoreEl.textContent = '0';

    this.restartBtn = document.createElement('button');
    this.restartBtn.textContent = 'PLAY AGAIN';
    Object.assign(this.restartBtn.style, {
      width: '200px',
      height: '44px',
      background: '#6C63FF',
      borderRadius: '8px',
      border: 'none',
      color: '#FFFFFF',
      fontSize: '18px',
      cursor: 'pointer',
      transition: 'all 0.1s ease',
      boxShadow: '0 0 4px rgba(108,99,255,0.6)',
      fontFamily: "'Segoe UI', Arial, sans-serif",
      letterSpacing: '1px'
    });

    this.restartBtn.addEventListener('mouseenter', () => {
      (this.restartBtn as HTMLElement).style.background = '#5A52E0';
      (this.restartBtn as HTMLElement).style.boxShadow = '0 0 8px rgba(90,82,224,0.8)';
    });
    this.restartBtn.addEventListener('mouseleave', () => {
      (this.restartBtn as HTMLElement).style.background = '#6C63FF';
      (this.restartBtn as HTMLElement).style.boxShadow = '0 0 4px rgba(108,99,255,0.6)';
    });
    this.restartBtn.addEventListener('mousedown', () => {
      (this.restartBtn as HTMLElement).style.transform = 'scale(0.95)';
    });
    this.restartBtn.addEventListener('mouseup', () => {
      (this.restartBtn as HTMLElement).style.transform = 'scale(1)';
    });

    this.gameOverPanel.appendChild(title);
    this.gameOverPanel.appendChild(scoreLabel);
    this.gameOverPanel.appendChild(this.finalScoreEl);
    this.gameOverPanel.appendChild(this.restartBtn);
    this.container.appendChild(this.gameOverPanel);
  }

  updateScore(score: number): void {
    this.scoreEl.textContent = String(score);
  }

  flashScore(): void {
    this.scoreEl.style.color = '#FFD700';
    clearTimeout(this.scoreFlashTimeout);
    this.scoreFlashTimeout = window.setTimeout(() => {
      this.scoreEl.style.color = '#FFFFFF';
    }, 200);
  }

  updateLives(lives: number): void {
    this.livesEl.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const heart = document.createElement('span');
      heart.style.cssText = `font-size: 16px; width: 16px; height: 16px; display: inline-flex; align-items: center; justify-content: center;`;
      heart.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16"><path d="M8 14s-5.5-3.5-5.5-7A3 3 0 0 1 8 4.5 3 3 0 0 1 13.5 7C13.5 10.5 8 14 8 14z" fill="${i < lives ? '#FF007F' : '#555'}"/></svg>`;
      this.livesEl.appendChild(heart);
    }
  }

  updateTime(seconds: number): void {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    this.timeEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  showGameOver(score: number, onRestart: () => void): void {
    this.finalScoreEl.textContent = String(score);
    this.gameOverPanel.style.display = 'flex';
    this.restartBtn.onclick = () => {
      this.gameOverPanel.style.display = 'none';
      onRestart();
    };
  }

  hideGameOver(): void {
    this.gameOverPanel.style.display = 'none';
  }
}
