import { useGameStore } from '../store';
import type { GameEngine } from '../game/GameEngine';

export class MenuUI {
  private container: HTMLElement;
  private engine: GameEngine;
  private root: HTMLDivElement | null = null;
  private currentPanel: HTMLDivElement | null = null;

  constructor(container: HTMLElement, engine: GameEngine) {
    this.container = container;
    this.engine = engine;
  }

  public init(): void {
    this.render();
    useGameStore.subscribe((state) => {
      this.update(state.gameState);
    });
  }

  private update(gameState: string): void {
    if (gameState === 'menu') {
      this.showMenu();
    } else if (gameState === 'playing') {
      this.hideMenu();
    } else if (gameState === 'gameover') {
      this.showGameOver();
    }
  }

  private render(): void {
    this.root = document.createElement('div');
    this.root.className = 'menu-root';

    const title = document.createElement('div');
    title.className = 'game-title';
    title.textContent = '危险品运输竞速';

    const buttons = document.createElement('div');
    buttons.className = 'menu-buttons';

    const startBtn = this.createButton('开始游戏', () => {
      useGameStore.getState().startGame();
    });
    const helpBtn = this.createButton('操作说明', () => {
      this.showHelp();
    });
    const leaderBtn = this.createButton('排行榜', () => {
      this.showLeaderboard();
    });

    buttons.appendChild(startBtn);
    buttons.appendChild(helpBtn);
    buttons.appendChild(leaderBtn);

    this.root.appendChild(title);
    this.root.appendChild(buttons);
    this.container.appendChild(this.root);

    const currentState = useGameStore.getState().gameState;
    this.update(currentState);
  }

  private createButton(text: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'menu-btn';
    btn.textContent = text;
    btn.addEventListener('click', onClick);
    return btn;
  }

  private showHelp(): void {
    this.closePanel();
    const overlay = document.createElement('div');
    overlay.className = 'panel-overlay';

    const panel = document.createElement('div');
    panel.className = 'panel';

    const title = document.createElement('div');
    title.className = 'panel-title';
    title.textContent = '操作说明';

    const grid = document.createElement('div');
    grid.className = 'controls-grid';

    const controls: Array<[string, string]> = [
      ['W / ↑', '加速'],
      ['S / ↓', '刹车 / 减速'],
      ['A / ←', '向左转'],
      ['D / →', '向右转'],
      ['空格', '使用道具'],
    ];

    controls.forEach(([key, desc]) => {
      const keyCap = document.createElement('span');
      keyCap.className = 'key-cap';
      keyCap.textContent = key;
      const descEl = document.createElement('span');
      descEl.textContent = desc;
      grid.appendChild(keyCap);
      grid.appendChild(descEl);
    });

    const powerupInfo = document.createElement('div');
    powerupInfo.style.marginTop = '20px';
    powerupInfo.style.fontSize = '14px';
    powerupInfo.style.lineHeight = '1.8';
    powerupInfo.innerHTML = `
      <div><strong style="color:#00BFFF;">● 蓝色</strong> - 加速（3秒内速度+50%）</div>
      <div><strong style="color:#00FF7F;">● 绿色</strong> - 护盾（5秒内免疫碰撞）</div>
      <div><strong style="color:#FFD700;">● 金色</strong> - 双倍得分（持续10秒）</div>
    `;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'panel-close';
    closeBtn.textContent = '关闭';
    closeBtn.addEventListener('click', () => this.closePanel());

    panel.appendChild(title);
    panel.appendChild(grid);
    panel.appendChild(powerupInfo);
    panel.appendChild(closeBtn);
    overlay.appendChild(panel);
    this.container.appendChild(overlay);
    this.currentPanel = overlay;
  }

  private showLeaderboard(): void {
    this.closePanel();
    const { leaderboard } = useGameStore.getState();

    const overlay = document.createElement('div');
    overlay.className = 'panel-overlay';

    const panel = document.createElement('div');
    panel.className = 'panel';

    const title = document.createElement('div');
    title.className = 'panel-title';
    title.textContent = '排行榜 TOP 10';

    const list = document.createElement('ul');
    list.className = 'leaderboard-list';

    if (leaderboard.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'leaderboard-item';
      empty.style.justifyContent = 'center';
      empty.style.color = 'rgba(255,255,255,0.5)';
      empty.textContent = '暂无记录，快去创造新纪录！';
      list.appendChild(empty);
    } else {
      leaderboard.forEach((score, idx) => {
        const li = document.createElement('li');
        li.className = 'leaderboard-item';
        const rank = document.createElement('span');
        rank.className = 'leaderboard-rank';
        rank.textContent = `#${idx + 1}`;
        const scoreEl = document.createElement('span');
        scoreEl.textContent = `${score} 分`;
        li.appendChild(rank);
        li.appendChild(scoreEl);
        list.appendChild(li);
      });
    }

    const closeBtn = document.createElement('button');
    closeBtn.className = 'panel-close';
    closeBtn.textContent = '关闭';
    closeBtn.addEventListener('click', () => this.closePanel());

    panel.appendChild(title);
    panel.appendChild(list);
    panel.appendChild(closeBtn);
    overlay.appendChild(panel);
    this.container.appendChild(overlay);
    this.currentPanel = overlay;
  }

  private showGameOver(): void {
    this.closePanel();
    const { score, highScore } = useGameStore.getState();

    const overlay = document.createElement('div');
    overlay.className = 'gameover-overlay';

    const panel = document.createElement('div');
    panel.className = 'gameover-panel';

    const title = document.createElement('div');
    title.className = 'gameover-title';
    title.textContent = '游戏结束';

    const scoreRow = document.createElement('div');
    scoreRow.className = 'gameover-score';
    scoreRow.innerHTML = `本局得分<span>${score}</span>`;

    const highRow = document.createElement('div');
    highRow.className = 'gameover-high';
    if (score >= highScore && score > 0) {
      highRow.textContent = '🎉 新纪录！';
      highRow.style.color = '#ffd700';
      highRow.style.fontWeight = '800';
    } else {
      highRow.textContent = `最高分：${highScore}`;
    }

    const btns = document.createElement('div');
    btns.className = 'gameover-buttons';

    const restartBtn = this.createButton('重新开始', () => {
      useGameStore.getState().resetGame();
    });
    const menuBtn = this.createButton('返回主菜单', () => {
      useGameStore.getState().goToMenu();
    });

    btns.appendChild(restartBtn);
    btns.appendChild(menuBtn);

    panel.appendChild(title);
    panel.appendChild(scoreRow);
    panel.appendChild(highRow);
    panel.appendChild(btns);
    overlay.appendChild(panel);
    this.container.appendChild(overlay);
    this.currentPanel = overlay;
  }

  private closePanel(): void {
    if (this.currentPanel && this.currentPanel.parentNode) {
      this.currentPanel.parentNode.removeChild(this.currentPanel);
    }
    this.currentPanel = null;
  }

  private showMenu(): void {
    if (this.root) this.root.style.display = 'flex';
    this.closePanel();
  }

  private hideMenu(): void {
    if (this.root) this.root.style.display = 'none';
    this.closePanel();
  }
}
