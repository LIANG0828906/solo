import './style.css';
import { Level, LevelElement, rectsOverlap, ElementType } from './level';
import { Editor, TOOLS, CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE } from './editor';
import { Player } from './player';
import { Enemy } from './enemy';
import { Renderer, GameState, DebugInfo } from './renderer';

type AppMode = 'editor' | 'game';

interface ToolButtonDef {
  type: ElementType;
  label: string;
  color: string;
}

const TOOL_BUTTONS: ToolButtonDef[] = [
  { type: 'ground', label: '地面', color: '#8b5a2b' },
  { type: 'platform', label: '平台', color: '#4a8c3f' },
  { type: 'spike', label: '尖刺', color: '#d94a4a' },
  { type: 'flag', label: '旗帜', color: '#ffcc00' },
  { type: 'enemy-patrol', label: '巡逻敌人', color: '#d94a6a' },
  { type: 'enemy-jump', label: '跳跃敌人', color: '#9b59b6' },
];

class App {
  private mode: AppMode = 'editor';
  private editorLevel: Level;
  private gameLevel: Level | null = null;
  private canvas: HTMLCanvasElement;
  private editor: Editor;
  private renderer: Renderer;
  private player: Player | null = null;
  private enemies: Enemy[] = [];
  private gameState: GameState = 'playing';
  private elapsedTime: number = 0;
  private rafId: number = 0;
  private selectedTool: ElementType | null = null;

  private keys = {
    left: false,
    right: false,
    jump: false,
    jumpPressed: false,
  };

  private ui: {
    toolbar: HTMLDivElement;
    sidebar: HTMLDivElement;
    debugOverlay: HTMLDivElement | null;
    gameControls: HTMLDivElement | null;
    stateOverlay: HTMLDivElement | null;
    canvasContainer: HTMLDivElement;
  } = {
    toolbar: document.createElement('div'),
    sidebar: document.createElement('div'),
    debugOverlay: null,
    gameControls: null,
    stateOverlay: null,
    canvasContainer: document.createElement('div'),
  };

  constructor() {
    this.editorLevel = new Level();
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'gameCanvas';
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;

    this.editor = new Editor(this.canvas, this.editorLevel);
    this.renderer = new Renderer(this.canvas);

    this.editor.setSelectionCallback((id) => this.updateSidebar(id));
    this.editor.setLevelChangeCallback(() => {});

    this.buildUI();
    this.bindGlobalEvents();
    this.addSampleLevel();
    this.startLoop();
  }

  private buildUI(): void {
    const app = document.getElementById('app');
    if (!app) return;
    app.innerHTML = '';

    const topbar = document.createElement('div');
    topbar.className = 'topbar';

    this.ui.toolbar.className = 'toolbar';
    for (const btn of TOOL_BUTTONS) {
      const el = document.createElement('button');
      el.className = 'tool-btn';
      el.dataset.type = btn.type;
      el.innerHTML = `<span class="color-preview" style="background:${btn.color}"></span>${btn.label}`;
      el.addEventListener('click', () => this.selectTool(btn.type));
      this.ui.toolbar.appendChild(el);
    }

    const testBtn = document.createElement('button');
    testBtn.className = 'test-btn';
    testBtn.textContent = '▶ 测试运行';
    testBtn.addEventListener('click', () => this.startGameTest());

    topbar.appendChild(this.ui.toolbar);
    topbar.appendChild(testBtn);

    const mainContent = document.createElement('div');
    mainContent.className = 'main-content';

    this.ui.canvasContainer.className = 'canvas-container';
    this.ui.canvasContainer.appendChild(this.canvas);

    this.ui.sidebar.className = 'sidebar';
    this.updateSidebar(null);

    mainContent.appendChild(this.ui.canvasContainer);
    mainContent.appendChild(this.ui.sidebar);

    app.appendChild(topbar);
    app.appendChild(mainContent);
  }

  private bindGlobalEvents(): void {
    window.addEventListener('keydown', (e) => {
      if (this.mode !== 'game') return;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true;
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        if (!this.keys.jump) this.keys.jumpPressed = true;
        this.keys.jump = true;
        e.preventDefault();
      }
      if (e.code === 'KeyP') this.togglePause();
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') this.keys.jump = false;
    });
  }

  private addSampleLevel(): void {
    this.editorLevel.addElement({
      id: 'sg1', type: 'ground', x: 0, y: 700, width: 500, height: 68,
    });
    this.editorLevel.addElement({
      id: 'sg2', type: 'ground', x: 600, y: 700, width: 424, height: 68,
    });
    this.editorLevel.addElement({
      id: 'sp1', type: 'platform', x: 200, y: 560, width: 160, height: 16,
    });
    this.editorLevel.addElement({
      id: 'sp2', type: 'platform', x: 480, y: 460, width: 128, height: 16,
    });
    this.editorLevel.addElement({
      id: 'sp3', type: 'platform', x: 720, y: 560, width: 160, height: 16,
    });
    this.editorLevel.addElement({
      id: 'ss1', type: 'spike', x: 520, y: 668, width: 64, height: 32,
    });
    this.editorLevel.addElement({
      id: 'sf1', type: 'flag', x: 940, y: 652, width: 24, height: 48,
    });
    this.editorLevel.addElement({
      id: 'se1', type: 'enemy-patrol', x: 260, y: 532, width: 28, height: 28,
    });
    this.editorLevel.addElement({
      id: 'se2', type: 'enemy-jump', x: 750, y: 532, width: 28, height: 28,
    });
  }

  private selectTool(type: ElementType): void {
    if (this.mode !== 'editor') return;
    if (this.selectedTool === type) {
      this.selectedTool = null;
    } else {
      this.selectedTool = type;
    }
    this.editor.setSelectedTool(this.selectedTool);
    this.updateToolButtons();
  }

  private updateToolButtons(): void {
    const buttons = this.ui.toolbar.querySelectorAll('.tool-btn');
    buttons.forEach((b) => {
      const btn = b as HTMLButtonElement;
      if (btn.dataset.type === this.selectedTool) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  private updateSidebar(selectedId: string | null): void {
    const sidebar = this.ui.sidebar;
    sidebar.innerHTML = '';

    const title = document.createElement('div');
    title.className = 'sidebar-title';
    title.textContent = '属性面板';
    sidebar.appendChild(title);

    if (!selectedId) {
      const hint = document.createElement('div');
      hint.className = 'no-selection';
      hint.textContent = '选中元素以编辑属性\n按 Delete 键删除元素';
      hint.style.whiteSpace = 'pre-line';
      sidebar.appendChild(hint);

      if (this.selectedTool === 'platform') {
        this.addPlatformSizeControls(sidebar);
      }
      return;
    }

    const el = this.editorLevel.getElementById(selectedId);
    if (!el) return;

    this.addInput(sidebar, 'X 坐标', String(el.x), (v) => {
      const num = parseInt(v, 10);
      if (!isNaN(num)) this.editor.updateSelectedElement({ x: num });
    });
    this.addInput(sidebar, 'Y 坐标', String(el.y), (v) => {
      const num = parseInt(v, 10);
      if (!isNaN(num)) this.editor.updateSelectedElement({ y: num });
    });

    if (el.type === 'ground' || el.type === 'platform') {
      this.addInput(sidebar, '宽度', String(el.width), (v) => {
        const num = parseInt(v, 10);
        if (!isNaN(num) && num > 0) this.editor.updateSelectedElement({ width: num });
      });
      this.addInput(sidebar, '高度', String(el.height), (v) => {
        const num = parseInt(v, 10);
        if (!isNaN(num) && num > 0) this.editor.updateSelectedElement({ height: num });
      });
    }

    if (this.selectedTool === 'platform') {
      this.addPlatformSizeControls(sidebar);
    }

    const typeLabel = document.createElement('div');
    typeLabel.className = 'property-label';
    typeLabel.style.marginTop = '12px';
    const typeNames: Record<ElementType, string> = {
      ground: '地面', platform: '平台', spike: '尖刺陷阱',
      flag: '终点旗帜', 'enemy-patrol': '巡逻敌人', 'enemy-jump': '跳跃敌人',
    };
    typeLabel.textContent = `类型: ${typeNames[el.type]}`;
    sidebar.appendChild(typeLabel);

    const delBtn = document.createElement('button');
    delBtn.className = 'game-btn stop';
    delBtn.style.width = '100%';
    delBtn.style.marginTop = '12px';
    delBtn.textContent = '删除元素';
    delBtn.addEventListener('click', () => this.editor.deleteSelected());
    sidebar.appendChild(delBtn);
  }

  private addPlatformSizeControls(sidebar: HTMLDivElement): void {
    const subTitle = document.createElement('div');
    subTitle.className = 'sidebar-title';
    subTitle.style.marginTop = '12px';
    subTitle.textContent = '放置平台尺寸';
    sidebar.appendChild(subTitle);

    this.addInput(sidebar, '平台宽度', String(this.editor.platformWidth), (v) => {
      const num = parseInt(v, 10);
      if (!isNaN(num) && num > 0) {
        this.editor.platformWidth = Math.max(GRID_SIZE, num);
      }
    });
    this.addInput(sidebar, '平台高度', String(this.editor.platformHeight), (v) => {
      const num = parseInt(v, 10);
      if (!isNaN(num) && num > 0) {
        this.editor.platformHeight = Math.max(GRID_SIZE / 2, num);
      }
    });
  }

  private addInput(
    parent: HTMLElement,
    label: string,
    value: string,
    onChange: (v: string) => void
  ): void {
    const row = document.createElement('div');
    row.className = 'property-row';

    const lab = document.createElement('label');
    lab.className = 'property-label';
    lab.textContent = label;

    const input = document.createElement('input');
    input.className = 'property-input';
    input.type = 'number';
    input.value = value;
    input.addEventListener('input', (e) => {
      onChange((e.target as HTMLInputElement).value);
    });

    row.appendChild(lab);
    row.appendChild(input);
    parent.appendChild(row);
  }

  private startGameTest(): void {
    if (this.editorLevel.elements.length === 0) {
      alert('关卡为空，请先放置元素！');
      return;
    }

    const flag = this.editorLevel.getFlagRect();
    if (!flag) {
      alert('请放置至少一面终点旗帜！');
      return;
    }

    this.mode = 'game';
    this.gameLevel = this.editorLevel.clone();
    this.gameState = 'playing';
    this.elapsedTime = 0;
    this.renderer.resetCamera();

    let spawnX = 64;
    let spawnY = 100;
    const grounds = this.gameLevel.getSolidRects();
    if (grounds.length > 0) {
      const topMost = grounds.reduce((a, b) => (a.y < b.y ? a : b));
      spawnX = Math.max(32, topMost.x + 10);
      spawnY = topMost.y - 40;
    }

    this.player = new Player(spawnX, spawnY);
    this.enemies = this.gameLevel
      .getEnemyElements()
      .map((e) => new Enemy(e));

    this.keys = { left: false, right: false, jump: false, jumpPressed: false };
    this.showGameUI();
    this.hideStateOverlay();
  }

  private stopGameTest(): void {
    this.mode = 'editor';
    this.gameLevel = null;
    this.player = null;
    this.enemies = [];
    this.removeGameUI();
    this.hideStateOverlay();
    this.selectedTool = null;
    this.editor.setSelectedTool(null);
    this.updateToolButtons();
  }

  private togglePause(): void {
    if (this.mode !== 'game') return;
    if (this.gameState === 'playing') {
      this.gameState = 'paused';
      this.showStateOverlay('pause', '已暂停', '按 P 键或点击继续按钮恢复游戏');
    } else if (this.gameState === 'paused') {
      this.gameState = 'playing';
      this.hideStateOverlay();
    }
    this.updatePauseButton();
  }

  private showGameUI(): void {
    this.removeGameUI();

    const debug = document.createElement('div');
    debug.className = 'debug-overlay';
    debug.id = 'debugOverlay';
    this.ui.canvasContainer.appendChild(debug);
    this.ui.debugOverlay = debug;

    const controls = document.createElement('div');
    controls.className = 'game-controls';
    controls.id = 'gameControls';

    const pauseBtn = document.createElement('button');
    pauseBtn.className = 'game-btn';
    pauseBtn.id = 'pauseBtn';
    pauseBtn.textContent = '⏸ 暂停';
    pauseBtn.addEventListener('click', () => this.togglePause());

    const stopBtn = document.createElement('button');
    stopBtn.className = 'game-btn stop';
    stopBtn.textContent = '■ 停止测试';
    stopBtn.addEventListener('click', () => this.stopGameTest());

    controls.appendChild(pauseBtn);
    controls.appendChild(stopBtn);
    this.ui.canvasContainer.appendChild(controls);
    this.ui.gameControls = controls;
  }

  private removeGameUI(): void {
    if (this.ui.debugOverlay) {
      this.ui.debugOverlay.remove();
      this.ui.debugOverlay = null;
    }
    if (this.ui.gameControls) {
      this.ui.gameControls.remove();
      this.ui.gameControls = null;
    }
  }

  private showStateOverlay(kind: 'win' | 'lose' | 'pause', title: string, desc: string): void {
    this.hideStateOverlay();
    const overlay = document.createElement('div');
    overlay.className = 'game-state-overlay';

    const t = document.createElement('div');
    t.className = `game-state-title ${kind}`;
    t.textContent = title;

    const d = document.createElement('div');
    d.className = 'game-state-desc';
    d.textContent = desc;

    overlay.appendChild(t);
    overlay.appendChild(d);
    this.ui.canvasContainer.appendChild(overlay);
    this.ui.stateOverlay = overlay;
  }

  private hideStateOverlay(): void {
    if (this.ui.stateOverlay) {
      this.ui.stateOverlay.remove();
      this.ui.stateOverlay = null;
    }
  }

  private updatePauseButton(): void {
    const btn = document.getElementById('pauseBtn') as HTMLButtonElement | null;
    if (btn) {
      btn.textContent = this.gameState === 'paused' ? '▶ 继续' : '⏸ 暂停';
    }
  }

  private updateDebugOverlay(): void {
    if (!this.ui.debugOverlay || !this.player) return;
    const fps = this.renderer.getAverageFps();
    const mm = Math.floor(this.elapsedTime / 60);
    const ss = Math.floor(this.elapsedTime % 60);
    const timeStr = `${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;

    this.ui.debugOverlay.innerHTML = `
      <div class="debug-item"><span class="debug-label">位置 X</span><span class="debug-value">${this.player.x.toFixed(1)}</span></div>
      <div class="debug-item"><span class="debug-label">位置 Y</span><span class="debug-value">${this.player.y.toFixed(1)}</span></div>
      <div class="debug-item"><span class="debug-label">速度 Vx</span><span class="debug-value">${this.player.vx.toFixed(1)}</span></div>
      <div class="debug-item"><span class="debug-label">速度 Vy</span><span class="debug-value">${this.player.vy.toFixed(1)}</span></div>
      <div class="debug-item"><span class="debug-label">FPS</span><span class="debug-value">${fps}</span></div>
      <div class="debug-item"><span class="debug-label">着地</span><span class="debug-value">${this.player.onGround ? '是' : '否'}</span></div>
      <div class="debug-item"><span class="debug-label">时间</span><span class="debug-value">${timeStr}</span></div>
      <div class="debug-item"><span class="debug-label">二段跳</span><span class="debug-value">${this.player.jumpsLeft}/${this.player.maxJumps}</span></div>
    `;
  }

  private startLoop(): void {
    const tick = (now: number) => {
      if (this.mode === 'editor') {
        this.editor.draw();
      } else if (this.mode === 'game') {
        const dt = this.renderer.beginFrame(now);

        if (this.gameState === 'playing' && this.player && this.gameLevel) {
          this.elapsedTime += dt;
          this.player.handleInput(this.keys);
          this.keys.jumpPressed = false;

          const solids = this.gameLevel.getSolidRects();
          this.player.update(dt, solids);

          for (const enemy of this.enemies) {
            enemy.update(dt, solids);
          }

          const playerRect = this.player.getRect();

          for (const spike of this.gameLevel.getSpikeRects()) {
            if (rectsOverlap(playerRect, spike)) {
              this.gameOver(false, '碰到尖刺！');
              break;
            }
          }

          for (const enemy of this.enemies) {
            if (rectsOverlap(playerRect, enemy.getRect())) {
              this.gameOver(false, '碰到敌人！');
              break;
            }
          }

          const flag = this.gameLevel.getFlagRect();
          if (flag && rectsOverlap(playerRect, flag)) {
            this.gameOver(true, '成功到达终点！');
          }

          if (this.player.y > CANVAS_HEIGHT + 200) {
            this.gameOver(false, '坠落深渊！');
          }

          this.renderer.updateCamera(
            this.player.x + this.player.width / 2,
            this.player.y + this.player.height / 2,
            dt
          );
        }

        if (this.gameLevel && this.player) {
          this.renderer.drawGridOverlay();
          this.renderer.drawLevel(this.gameLevel);
          this.renderer.drawEnemies(this.enemies);
          this.renderer.drawPlayer(this.player);
        }

        this.renderer.endFrame();
        this.updateDebugOverlay();
      }

      this.rafId = requestAnimationFrame(tick);
    };

    this.rafId = requestAnimationFrame(tick);
  }

  private gameOver(win: boolean, message: string): void {
    this.gameState = win ? 'win' : 'lose';
    this.showStateOverlay(
      win ? 'win' : 'lose',
      win ? '🎉 过关成功' : '💀 游戏结束',
      message + ' 点击"停止测试"返回编辑器'
    );
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new App();
});
