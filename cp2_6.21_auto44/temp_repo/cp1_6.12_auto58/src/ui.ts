import * as THREE from 'three';
import { BlockType, GameState, TrackCell } from './types';

const GRID_COLS = 6;
const GRID_ROWS = 12;
const BLOCK_TYPES: { type: BlockType; label: string; icon: string }[] = [
  { type: 'straight', label: '直线', icon: '━' },
  { type: 'turn', label: '弯道', icon: '↱' },
  { type: 'slope', label: '斜坡', icon: '◢' },
  { type: 'spike', label: '尖刺', icon: '▲' },
  { type: 'boost', label: '加速', icon: '»' },
  { type: 'start', label: '起点', icon: '◉' },
  { type: 'end', label: '终点', icon: '🏁' },
];

export class UIManager {
  private container: HTMLElement;
  private editorPanel: HTMLElement | null = null;
  private gameHUD: HTMLElement | null = null;
  private buildMenu: HTMLElement | null = null;
  private minimapCanvas: HTMLCanvasElement | null = null;
  private minimapCtx: CanvasRenderingContext2D | null = null;

  public onBuildBlock: ((type: BlockType) => void) | null = null;
  public onRotateBlock: (() => void) | null = null;
  public onDeleteBlock: (() => void) | null = null;
  public onSwitchMode: ((mode: 'editor' | 'game') => void) | null = null;
  public onRestart: (() => void) | null = null;

  private selectedCell: { x: number; z: number } | null = null;
  private currentState: GameState = {
    mode: 'editor',
    playerTime: 0,
    aiTime: 0,
    isRunning: false,
    isFinished: false,
  };

  constructor(container: HTMLElement) {
    this.container = container;
    this.initStyles();
    this.createUI();
  }

  private initStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .glass-panel {
        background: rgba(20, 5, 40, 0.75);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(0, 200, 255, 0.3);
        border-radius: 12px;
        box-shadow: 0 0 20px rgba(0, 200, 255, 0.15), inset 0 0 20px rgba(255, 0, 200, 0.05);
        transition: all 0.3s ease-out;
      }
      .neon-btn {
        background: linear-gradient(135deg, rgba(0, 150, 255, 0.2), rgba(255, 0, 150, 0.2));
        border: 1px solid rgba(0, 200, 255, 0.5);
        border-radius: 8px;
        color: #fff;
        padding: 10px 18px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease-out;
        text-shadow: 0 0 8px rgba(0, 200, 255, 0.8);
        box-shadow: 0 0 10px rgba(0, 200, 255, 0.3);
        letter-spacing: 1px;
      }
      .neon-btn:hover {
        background: linear-gradient(135deg, rgba(0, 150, 255, 0.4), rgba(255, 0, 150, 0.4));
        border-color: rgba(255, 0, 200, 0.7);
        box-shadow: 0 0 20px rgba(255, 0, 200, 0.5);
        transform: translateY(-2px);
      }
      .neon-btn:active {
        transform: translateY(0);
      }
      .neon-btn.primary {
        background: linear-gradient(135deg, rgba(0, 200, 255, 0.5), rgba(255, 0, 200, 0.5));
      }
      .build-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        width: 60px;
        height: 70px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease-out;
        border: 1px solid rgba(0, 200, 255, 0.2);
        background: rgba(0, 0, 0, 0.3);
      }
      .build-item:hover {
        border-color: rgba(255, 0, 200, 0.8);
        background: rgba(255, 0, 200, 0.15);
        transform: scale(1.08);
        box-shadow: 0 0 15px rgba(255, 0, 200, 0.5);
      }
      .build-item .icon {
        font-size: 22px;
        color: #00d4ff;
        text-shadow: 0 0 8px rgba(0, 200, 255, 0.8);
      }
      .build-item .label {
        font-size: 11px;
        color: #aaa;
      }
      .hud-text {
        font-size: 14px;
        color: #00d4ff;
        text-shadow: 0 0 8px rgba(0, 200, 255, 0.8);
      }
      .hud-value {
        font-size: 24px;
        font-weight: 700;
        color: #fff;
        text-shadow: 0 0 12px rgba(255, 0, 200, 0.8);
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .fade-in {
        animation: fadeIn 0.3s ease-out;
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      .pulse {
        animation: pulse 1s infinite;
      }
    `;
    document.head.appendChild(style);
  }

  private createUI(): void {
    this.createEditorPanel();
    this.createGameHUD();
    this.createBuildMenu();
  }

  private createEditorPanel(): void {
    this.editorPanel = document.createElement('div');
    this.editorPanel.className = 'glass-panel fade-in';
    Object.assign(this.editorPanel.style, {
      position: 'absolute',
      top: '20px',
      left: '20px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      zIndex: '100',
      minWidth: '220px',
    });

    const title = document.createElement('div');
    title.innerHTML = `<span style="font-size:20px;font-weight:700;background:linear-gradient(90deg,#00d4ff,#ff00c8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:2px;">赛博跑酷编辑器</span>`;
    this.editorPanel.appendChild(title);

    const hint = document.createElement('div');
    hint.style.cssText = 'font-size:12px;color:#888;line-height:1.6;';
    hint.innerHTML = `
      <div>🎮 点击网格放置方块</div>
      <div>🔄 点击已有方块旋转/删除</div>
      <div>🖱️ 拖拽平移 · 滚轮缩放</div>
    `;
    this.editorPanel.appendChild(hint);

    const modeBtn = document.createElement('button');
    modeBtn.className = 'neon-btn primary';
    modeBtn.textContent = '▶ 开始跑酷';
    modeBtn.addEventListener('click', () => this.onSwitchMode?.('game'));
    this.editorPanel.appendChild(modeBtn);

    this.container.appendChild(this.editorPanel);
  }

  private createGameHUD(): void {
    this.gameHUD = document.createElement('div');
    this.gameHUD.style.cssText = `
      position: absolute;
      top: 20px;
      left: 20px;
      right: 20px;
      display: none;
      justify-content: space-between;
      align-items: flex-start;
      z-index: 100;
      pointer-events: none;
    `;

    const leftPanel = document.createElement('div');
    leftPanel.className = 'glass-panel fade-in';
    Object.assign(leftPanel.style, {
      padding: '16px 22px',
      pointerEvents: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    });

    leftPanel.innerHTML = `
      <div class="hud-text">⏱ 用时</div>
      <div class="hud-value" id="timer">0.00s</div>
      <div class="hud-text" style="margin-top:8px;">🏃 速度</div>
      <div class="hud-value" id="speed">0 km/h</div>
    `;

    const rightPanel = document.createElement('div');
    rightPanel.className = 'glass-panel fade-in';
    Object.assign(rightPanel.style, {
      padding: '12px',
      pointerEvents: 'auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: '12px',
    });

    this.minimapCanvas = document.createElement('canvas');
    this.minimapCanvas.width = 150;
    this.minimapCanvas.height = 300;
    Object.assign(this.minimapCanvas.style, {
      borderRadius: '8px',
      border: '1px solid rgba(0, 200, 255, 0.5)',
      boxShadow: '0 0 15px rgba(0, 200, 255, 0.3)',
    });
    this.minimapCtx = this.minimapCanvas.getContext('2d');
    rightPanel.appendChild(this.minimapCanvas);

    const aiInfo = document.createElement('div');
    aiInfo.innerHTML = `<div class="hud-text">🤖 AI 用时: <span id="aiTime" style="color:#ff00c8;">--</span></div>`;
    rightPanel.appendChild(aiInfo);

    const backBtn = document.createElement('button');
    backBtn.className = 'neon-btn';
    backBtn.textContent = '◀ 返回编辑';
    backBtn.style.pointerEvents = 'auto';
    backBtn.addEventListener('click', () => this.onSwitchMode?.('editor'));
    rightPanel.appendChild(backBtn);

    this.gameHUD.appendChild(leftPanel);
    this.gameHUD.appendChild(rightPanel);
    this.container.appendChild(this.gameHUD);
  }

  private createBuildMenu(): void {
    this.buildMenu = document.createElement('div');
    this.buildMenu.className = 'glass-panel';
    Object.assign(this.buildMenu.style, {
      position: 'absolute',
      display: 'none',
      padding: '12px',
      zIndex: '200',
      gap: '8px',
    });
    this.container.appendChild(this.buildMenu);
  }

  public showBuildMenu(x: number, y: number, hasBlock: boolean): void {
    if (!this.buildMenu) return;
    this.buildMenu.innerHTML = '';
    this.buildMenu.style.display = 'flex';
    this.buildMenu.style.left = `${x}px`;
    this.buildMenu.style.top = `${y}px`;
    this.buildMenu.classList.add('fade-in');

    if (hasBlock) {
      const rotateBtn = document.createElement('div');
      rotateBtn.className = 'build-item';
      rotateBtn.innerHTML = `<div class="icon">🔄</div><div class="label">旋转</div>`;
      rotateBtn.addEventListener('click', () => {
        this.onRotateBlock?.();
        this.hideBuildMenu();
      });
      this.buildMenu.appendChild(rotateBtn);

      const deleteBtn = document.createElement('div');
      deleteBtn.className = 'build-item';
      deleteBtn.innerHTML = `<div class="icon" style="color:#ff4444;text-shadow:0 0 8px rgba(255,68,68,0.8);">✕</div><div class="label" style="color:#ff8888;">删除</div>`;
      deleteBtn.addEventListener('click', () => {
        this.onDeleteBlock?.();
        this.hideBuildMenu();
      });
      this.buildMenu.appendChild(deleteBtn);
    } else {
      BLOCK_TYPES.forEach(item => {
        const el = document.createElement('div');
        el.className = 'build-item';
        el.innerHTML = `<div class="icon">${item.icon}</div><div class="label">${item.label}</div>`;
        el.addEventListener('click', () => {
          this.onBuildBlock?.(item.type);
          this.hideBuildMenu();
        });
        this.buildMenu.appendChild(el);
      });
    }

    setTimeout(() => {
      const rect = this.buildMenu!.getBoundingClientRect();
      if (rect.right > window.innerWidth) {
        this.buildMenu!.style.left = `${window.innerWidth - rect.width - 10}px`;
      }
      if (rect.bottom > window.innerHeight) {
        this.buildMenu!.style.top = `${window.innerHeight - rect.height - 10}px`;
      }
    }, 10);
  }

  public hideBuildMenu(): void {
    if (this.buildMenu) {
      this.buildMenu.style.display = 'none';
    }
  }

  public setSelectedCell(x: number | null, z: number | null): void {
    if (x === null || z === null) {
      this.selectedCell = null;
    } else {
      this.selectedCell = { x, z };
    }
  }

  public getSelectedCell(): { x: number; z: number } | null {
    return this.selectedCell;
  }

  public updateState(state: Partial<GameState>): void {
    this.currentState = { ...this.currentState, ...state };
    this.updateModeVisibility();
    this.updateTimer();
  }

  private updateModeVisibility(): void {
    if (this.currentState.mode === 'editor') {
      if (this.editorPanel) this.editorPanel.style.display = 'flex';
      if (this.gameHUD) this.gameHUD.style.display = 'none';
    } else {
      if (this.editorPanel) this.editorPanel.style.display = 'none';
      if (this.gameHUD) this.gameHUD.style.display = 'flex';
    }
  }

  public updateTimer(): void {
    const timerEl = document.getElementById('timer');
    const aiTimeEl = document.getElementById('aiTime');
    if (timerEl) {
      timerEl.textContent = `${this.currentState.playerTime.toFixed(2)}s`;
    }
    if (aiTimeEl && this.currentState.aiTime > 0) {
      aiTimeEl.textContent = `${this.currentState.aiTime.toFixed(2)}s`;
    }
  }

  public updateSpeed(speedKmh: number): void {
    const speedEl = document.getElementById('speed');
    if (speedEl) {
      speedEl.textContent = `${Math.round(speedKmh)} km/h`;
    }
  }

  public renderMinimap(trackData: TrackCell[], playerPos: THREE.Vector3, aiPos: THREE.Vector3 | null): void {
    if (!this.minimapCtx || !this.minimapCanvas) return;
    const ctx = this.minimapCtx;
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;

    ctx.fillStyle = 'rgba(10, 0, 30, 0.9)';
    ctx.fillRect(0, 0, w, h);

    const cellW = w / GRID_COLS;
    const cellH = h / GRID_ROWS;

    ctx.strokeStyle = 'rgba(0, 200, 255, 0.2)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_COLS; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellW, 0);
      ctx.lineTo(i * cellW, h);
      ctx.stroke();
    }
    for (let i = 0; i <= GRID_ROWS; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * cellH);
      ctx.lineTo(w, i * cellH);
      ctx.stroke();
    }

    trackData.forEach(cell => {
      const px = cell.gridX * cellW;
      const py = cell.gridZ * cellH;
      let color = 'rgba(0, 200, 255, 0.4)';
      if (cell.type === 'spike') color = 'rgba(255, 50, 50, 0.7)';
      else if (cell.type === 'boost') color = 'rgba(50, 255, 100, 0.7)';
      else if (cell.type === 'start') color = 'rgba(0, 255, 200, 0.8)';
      else if (cell.type === 'end') color = 'rgba(255, 200, 0, 0.8)';
      ctx.fillStyle = color;
      ctx.fillRect(px + 2, py + 2, cellW - 4, cellH - 4);
    });

    if (aiPos) {
      const ax = (aiPos.x + GRID_COLS / 2) * cellW;
      const ay = (aiPos.z + GRID_ROWS / 2) * cellH;
      ctx.fillStyle = '#ff00c8';
      ctx.shadowColor = '#ff00c8';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(ax, ay, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    const px = (playerPos.x + GRID_COLS / 2) * cellW;
    const py = (playerPos.z + GRID_ROWS / 2) * cellH;
    ctx.fillStyle = '#00ff88';
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  public showFinishDialog(playerTime: number, aiTime: number): void {
    const dialog = document.createElement('div');
    dialog.className = 'glass-panel fade-in';
    Object.assign(dialog.style, {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      padding: '36px 48px',
      zIndex: '300',
      textAlign: 'center',
      minWidth: '380px',
    });

    const won = playerTime < aiTime;
    dialog.innerHTML = `
      <div style="font-size:32px;font-weight:700;margin-bottom:20px;background:linear-gradient(90deg,${won ? '#00ff88' : '#ff4466'},#ff00c8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">
        ${won ? '🏆 胜利！' : '💀 失败！'}
      </div>
      <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:28px;">
        <div style="display:flex;justify-content:space-between;font-size:16px;">
          <span style="color:#00ff88;">🏃 你的用时</span>
          <span style="color:#00d4ff;font-weight:700;font-size:20px;">${playerTime.toFixed(2)}s</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:16px;">
          <span style="color:#ff00c8;">🤖 AI 用时</span>
          <span style="color:#ff00c8;font-weight:700;font-size:20px;">${aiTime.toFixed(2)}s</span>
        </div>
      </div>
      <div style="display:flex;gap:12px;justify-content:center;">
        <button class="neon-btn" id="backEdit">◀ 返回编辑</button>
        <button class="neon-btn primary" id="retry">🔄 再试一次</button>
      </div>
    `;

    this.container.appendChild(dialog);

    dialog.querySelector('#backEdit')?.addEventListener('click', () => {
      dialog.remove();
      this.onSwitchMode?.('editor');
    });
    dialog.querySelector('#retry')?.addEventListener('click', () => {
      dialog.remove();
      this.onRestart?.();
    });
  }
}
