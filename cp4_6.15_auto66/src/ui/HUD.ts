import type { IGameState } from '../types';

export class HUD {
  private container: HTMLElement;
  private scoreEl: HTMLElement | null = null;
  private comboEl: HTMLElement | null = null;
  private hpBarEl: HTMLElement | null = null;
  private feverEl: HTMLElement | null = null;
  private beatIndicator: HTMLElement | null = null;
  private lastBeatTime: number = 0;
  private gameOverOverlay: HTMLElement | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
  }

  private render(): void {
    this.container.innerHTML = '';
    this.container.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 10; font-family: 'Orbitron', monospace;
    `;

    const topBar = document.createElement('div');
    topBar.style.cssText = `
      display: flex; justify-content: space-between; align-items: flex-start;
      padding: 20px 30px; width: 100%; box-sizing: border-box;
    `;

    const leftSection = document.createElement('div');
    leftSection.style.cssText = `display: flex; flex-direction: column; gap: 8px;`;

    const scoreLabel = document.createElement('div');
    scoreLabel.style.cssText = `font-size: 10px; color: #bf40ff88; letter-spacing: 2px;`;
    scoreLabel.textContent = 'SCORE';
    leftSection.appendChild(scoreLabel);

    this.scoreEl = document.createElement('div');
    this.scoreEl.style.cssText = `
      font-size: clamp(20px, 3vw, 32px); font-weight: 900;
      color: #00e5ff; text-shadow: 0 0 10px #00e5ff88, 0 0 20px #00e5ff44;
    `;
    this.scoreEl.textContent = '0';
    leftSection.appendChild(this.scoreEl);

    this.comboEl = document.createElement('div');
    this.comboEl.style.cssText = `
      font-size: clamp(14px, 2vw, 22px); font-weight: 700;
      color: #ff4081; text-shadow: 0 0 8px #ff408188;
      opacity: 0; transition: opacity 0.2s, transform 0.2s;
    `;
    leftSection.appendChild(this.comboEl);

    topBar.appendChild(leftSection);

    const rightSection = document.createElement('div');
    rightSection.style.cssText = `display: flex; flex-direction: column; align-items: flex-end; gap: 6px;`;

    const hpLabel = document.createElement('div');
    hpLabel.style.cssText = `font-size: 10px; color: #bf40ff88; letter-spacing: 2px;`;
    hpLabel.textContent = 'HP';
    rightSection.appendChild(hpLabel);

    const hpBarBg = document.createElement('div');
    hpBarBg.style.cssText = `
      width: clamp(120px, 15vw, 200px); height: 10px; background: #1a1a2e;
      border: 1px solid #bf40ff44; border-radius: 5px; overflow: hidden;
    `;

    this.hpBarEl = document.createElement('div');
    this.hpBarEl.style.cssText = `
      width: 100%; height: 100%;
      background: linear-gradient(90deg, #bf40ff, #00e5ff);
      border-radius: 5px; transition: width 0.3s;
    `;
    hpBarBg.appendChild(this.hpBarEl);
    rightSection.appendChild(hpBarBg);

    topBar.appendChild(rightSection);
    this.container.appendChild(topBar);

    this.feverEl = document.createElement('div');
    this.feverEl.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      font-size: clamp(24px, 4vw, 40px); font-weight: 900;
      color: #ff00ff; text-shadow: 0 0 20px #ff00ff88, 0 0 40px #ff00ff44;
      opacity: 0; transition: opacity 0.3s; pointer-events: none;
      letter-spacing: 4px;
    `;
    this.feverEl.textContent = 'COMBO FEVER!';
    this.container.appendChild(this.feverEl);

    this.beatIndicator = document.createElement('div');
    this.beatIndicator.style.cssText = `
      position: fixed; bottom: 60px; left: 50%; transform: translateX(-50%);
      width: 8px; height: 8px; border-radius: 50%;
      background: #bf40ff; box-shadow: 0 0 10px #bf40ff88;
      opacity: 0; transition: opacity 0.1s;
    `;
    this.container.appendChild(this.beatIndicator);
  }

  update(state: IGameState): void {
    if (this.scoreEl) {
      this.scoreEl.textContent = state.score.toLocaleString();
    }

    if (this.comboEl) {
      if (state.combo > 0) {
        this.comboEl.style.opacity = '1';
        this.comboEl.style.transform = 'scale(1)';
        this.comboEl.textContent = `${state.combo}x COMBO`;
        if (state.combo >= 5) {
          this.comboEl.style.transform = `scale(${1 + Math.sin(Date.now() * 0.01) * 0.1})`;
        }
      } else {
        this.comboEl.style.opacity = '0';
      }
    }

    if (this.hpBarEl) {
      const hpPercent = (state.hp / state.maxHp) * 100;
      this.hpBarEl.style.width = hpPercent + '%';
      if (hpPercent < 30) {
        this.hpBarEl.style.background = 'linear-gradient(90deg, #ff0055, #ff4081)';
      } else {
        this.hpBarEl.style.background = 'linear-gradient(90deg, #bf40ff, #00e5ff)';
      }
    }

    if (this.feverEl) {
      this.feverEl.style.opacity = state.isComboFever ? '1' : '0';
      if (state.isComboFever) {
        this.feverEl.style.transform = `translate(-50%, -50%) scale(${1 + Math.sin(Date.now() * 0.005) * 0.08})`;
      }
    }

    const now = Date.now();
    if (now - this.lastBeatTime < 150) {
      if (this.beatIndicator) {
        this.beatIndicator.style.opacity = '1';
        this.beatIndicator.style.transform = 'translateX(-50%) scale(2)';
      }
    } else {
      if (this.beatIndicator) {
        this.beatIndicator.style.opacity = '0.3';
        this.beatIndicator.style.transform = 'translateX(-50%) scale(1)';
      }
    }
  }

  onBeat(): void {
    this.lastBeatTime = Date.now();
  }

  showGameOver(score: number, maxCombo: number, onRestart: () => void, onMenu: () => void): void {
    if (this.gameOverOverlay) {
      this.gameOverOverlay.remove();
    }

    this.gameOverOverlay = document.createElement('div');
    this.gameOverOverlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(10, 10, 15, 0.85); display: flex; flex-direction: column;
      align-items: center; justify-content: center; pointer-events: auto; z-index: 30;
      animation: fadeIn 0.5s ease-out;
    `;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes glitch {
        0% { transform: translate(0); }
        20% { transform: translate(-2px, 2px); }
        40% { transform: translate(2px, -2px); }
        60% { transform: translate(-1px, -1px); }
        80% { transform: translate(1px, 1px); }
        100% { transform: translate(0); }
      }
    `;
    document.head.appendChild(style);

    const title = document.createElement('div');
    title.style.cssText = `
      font-family: 'Orbitron', monospace; font-size: clamp(32px, 6vw, 56px); font-weight: 900;
      color: #ff0055; text-shadow: 0 0 20px #ff005588, 0 0 40px #ff005544;
      margin-bottom: 30px; animation: glitch 0.3s ease-in-out infinite alternate;
      letter-spacing: 6px;
    `;
    title.textContent = 'GAME OVER';
    this.gameOverOverlay.appendChild(title);

    const stats = document.createElement('div');
    stats.style.cssText = `
      font-family: 'Orbitron', monospace; text-align: center; margin-bottom: 40px;
      line-height: 2.2;
    `;
    stats.innerHTML = `
      <div style="font-size: 14px; color: #bf40ff88; letter-spacing: 2px;">FINAL SCORE</div>
      <div style="font-size: clamp(28px, 4vw, 42px); font-weight: 900; color: #00e5ff; text-shadow: 0 0 15px #00e5ff88;">${score.toLocaleString()}</div>
      <div style="font-size: 14px; color: #ff408188; margin-top: 10px;">MAX COMBO: <span style="color: #ff4081; text-shadow: 0 0 5px #ff408188;">${maxCombo}x</span></div>
    `;
    this.gameOverOverlay.appendChild(stats);

    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = `display: flex; gap: 16px;`;

    const restartBtn = document.createElement('button');
    restartBtn.textContent = 'RETRY';
    restartBtn.style.cssText = `
      font-family: 'Orbitron', monospace; font-size: 14px; font-weight: 700;
      padding: 12px 32px; background: #bf40ff11; border: 2px solid #bf40ff;
      color: #bf40ff; cursor: pointer; letter-spacing: 2px;
      text-shadow: 0 0 5px #bf40ff88; box-shadow: 0 0 15px #bf40ff33;
      pointer-events: auto; transition: all 0.3s;
    `;
    restartBtn.addEventListener('mouseenter', () => {
      restartBtn.style.boxShadow = '0 0 25px #bf40ff66';
      restartBtn.style.background = '#bf40ff22';
    });
    restartBtn.addEventListener('mouseleave', () => {
      restartBtn.style.boxShadow = '0 0 15px #bf40ff33';
      restartBtn.style.background = '#bf40ff11';
    });
    restartBtn.addEventListener('click', onRestart);
    btnContainer.appendChild(restartBtn);

    const menuBtn = document.createElement('button');
    menuBtn.textContent = 'MENU';
    menuBtn.style.cssText = `
      font-family: 'Orbitron', monospace; font-size: 14px; font-weight: 700;
      padding: 12px 32px; background: #00e5ff11; border: 2px solid #00e5ff;
      color: #00e5ff; cursor: pointer; letter-spacing: 2px;
      text-shadow: 0 0 5px #00e5ff88; box-shadow: 0 0 15px #00e5ff33;
      pointer-events: auto; transition: all 0.3s;
    `;
    menuBtn.addEventListener('mouseenter', () => {
      menuBtn.style.boxShadow = '0 0 25px #00e5ff66';
      menuBtn.style.background = '#00e5ff22';
    });
    menuBtn.addEventListener('mouseleave', () => {
      menuBtn.style.boxShadow = '0 0 15px #00e5ff33';
      menuBtn.style.background = '#00e5ff11';
    });
    menuBtn.addEventListener('click', onMenu);
    btnContainer.appendChild(menuBtn);

    this.gameOverOverlay.appendChild(btnContainer);
    this.container.appendChild(this.gameOverOverlay);
  }

  hideGameOver(): void {
    if (this.gameOverOverlay) {
      this.gameOverOverlay.remove();
      this.gameOverOverlay = null;
    }
  }
}
