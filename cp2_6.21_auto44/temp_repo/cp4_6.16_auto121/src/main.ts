import {
  GameState,
  createGameState,
  updateGame,
  renderGame,
  loadLevelBricks,
  CANVAS_WIDTH,
  CANVAS_HEIGHT
} from './gameEngine';

import {
  EditorState,
  createEditorState,
  updateEditor,
  renderEditor,
  getCellFromPosition,
  isColorPanelClick,
  isSaveButtonClick,
  isBackButtonClick,
  fillCell,
  fillSelection,
  clearSelection,
  saveCustomLevel,
  getCustomLevels,
  deleteCustomLevel
} from './levelEditor';

type AppState = 'menu' | 'playing' | 'paused' | 'gameover' | 'levelComplete' | 'editor' | 'customLevels';

interface MenuButton {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  action: () => void;
  hover: boolean;
}

interface CustomLevelItem {
  index: number;
  name: string;
  y: number;
  height: number;
}

class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private appState: AppState = 'menu';
  private gameState: GameState;
  private editorState: EditorState;
  private input = { left: false, right: false };
  private lastTime = 0;
  private animationId: number | null = null;

  private menuButtons: MenuButton[] = [];
  private customLevels: { name: string; grid: number[][]; createdAt: number }[] = [];
  private customLevelItems: CustomLevelItem[] = [];
  private hoveredLevelIndex: number = -1;
  private showDeleteConfirm: number = -1;

  private hoveredCell: { row: number; col: number } | null = null;
  private isRightClickDragging: boolean = false;

  private mouseX: number = 0;
  private mouseY: number = 0;

  private menuButtonY: number = 0;

  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2D context');
    this.ctx = ctx;

    this.gameState = createGameState();
    this.editorState = createEditorState();

    this.initMenu();
    this.bindEvents();
    this.startLoop();
  }

  private initMenu(): void {
    const centerX = CANVAS_WIDTH / 2;
    const btnWidth = 220;
    const btnHeight = 60;
    const btnGap = 20;
    const startY = 200;

    this.menuButtons = [
      { x: centerX - btnWidth / 2, y: startY, width: btnWidth, height: btnHeight, text: '开始游戏', action: () => this.startGame(1), hover: false },
      { x: centerX - btnWidth / 2, y: startY + btnHeight + btnGap, width: btnWidth, height: btnHeight, text: '自定义关卡', action: () => this.showCustomLevels(), hover: false },
      { x: centerX - btnWidth / 2, y: startY + (btnHeight + btnGap) * 2, width: btnWidth, height: btnHeight, text: '编辑器', action: () => this.openEditor(), hover: false }
    ];
  }

  private bindEvents(): void {
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));

    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (this.appState === 'playing' || this.appState === 'paused') {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        this.input.left = true;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        this.input.right = true;
      }
      if (e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        if (this.appState === 'playing') {
          this.appState = 'paused';
          this.gameState.isPaused = true;
        } else if (this.appState === 'paused') {
          this.appState = 'playing';
          this.gameState.isPaused = false;
        }
      }
    }

    if (this.appState === 'editor') {
      if (e.key === 'e' || e.key === 'E') {
        if (this.editorState.isSelecting) {
          this.editorState = clearSelection(this.editorState);
        }
      }
      if (e.key === 'Escape') {
        this.appState = 'menu';
      }
    }

    if (this.appState === 'gameover' && (e.key === 'Enter' || e.key === ' ')) {
      this.appState = 'menu';
    }

    if (this.appState === 'levelComplete' && (e.key === 'Enter' || e.key === ' ')) {
      this.appState = 'playing';
      this.gameState.isPaused = false;
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      this.input.left = false;
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      this.input.right = false;
    }
  }

  private onMouseMove(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    this.mouseX = (e.clientX - rect.left) * scaleX;
    this.mouseY = (e.clientY - rect.top) * scaleY;

    if (this.appState === 'menu') {
      this.menuButtons.forEach(btn => {
        btn.hover = this.isPointInRect(this.mouseX, this.mouseY, btn.x, btn.y, btn.width, btn.height);
      });
    }

    if (this.appState === 'customLevels') {
      this.hoveredLevelIndex = -1;
      this.showDeleteConfirm = -1;
      this.customLevelItems.forEach(item => {
        if (this.mouseY >= item.y && this.mouseY <= item.y + item.height) {
          this.hoveredLevelIndex = item.index;
        }
      });
    }

    if (this.appState === 'editor') {
      this.hoveredCell = getCellFromPosition(this.mouseX, this.mouseY);

      if (this.editorState.isSelecting && this.editorState.dragStart) {
        const cell = getCellFromPosition(this.mouseX, this.mouseY);
        if (cell) {
          this.editorState = {
            ...this.editorState,
            dragEnd: cell
          };
        }
      }

      if (this.isRightClickDragging && this.hoveredCell) {
        this.editorState = fillCell(this.editorState, this.hoveredCell.row, this.hoveredCell.col);
      }
    }
  }

  private onMouseDown(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (this.appState === 'menu') {
      this.menuButtons.forEach(btn => {
        if (this.isPointInRect(x, y, btn.x, btn.y, btn.width, btn.height)) {
          btn.action();
        }
      });
    }

    if (this.appState === 'customLevels') {
      if (isBackButtonClick(x, y)) {
        this.appState = 'menu';
        return;
      }

      for (let i = 0; i < this.customLevels.length; i++) {
        const item = this.customLevelItems.find(ci => ci.index === i);
        if (item && y >= item.y && y <= item.y + item.height) {
          const deleteBtnX = 540;
          const deleteBtnY = item.y + 8;
          const deleteBtnW = 30;
          const deleteBtnH = 30;
          
          if (x >= deleteBtnX && x <= deleteBtnX + deleteBtnW && y >= deleteBtnY && y <= deleteBtnY + deleteBtnH) {
            deleteCustomLevel(i);
            this.customLevels = getCustomLevels();
            this.updateCustomLevelItems();
            return;
          }

          this.startCustomLevel(i);
          return;
        }
      }
    }

    if (this.appState === 'editor') {
      if (isBackButtonClick(x, y)) {
        this.appState = 'menu';
        return;
      }

      if (isSaveButtonClick(x, y)) {
        const levelName = prompt('请输入关卡名称:', `自定义关卡 ${this.customLevels.length + 1}`);
        if (levelName && levelName.trim()) {
          const hasBricks = this.editorState.grid.some(row => row.some(cell => cell > 0));
          if (hasBricks) {
            saveCustomLevel(levelName.trim(), this.editorState.grid);
            this.customLevels = getCustomLevels();
            alert('关卡保存成功！');
          } else {
            alert('请至少放置一块砖块！');
          }
        }
        return;
      }

      const colorIndex = isColorPanelClick(x, y);
      if (colorIndex !== null) {
        this.editorState = { ...this.editorState, selectedColor: colorIndex };
        return;
      }

      const cell = getCellFromPosition(x, y);
      if (cell) {
        if (e.button === 0) {
          this.editorState = {
            ...this.editorState,
            isSelecting: true,
            dragStart: cell,
            dragEnd: cell
          };
        } else if (e.button === 2) {
          this.isRightClickDragging = true;
          this.editorState = fillCell(this.editorState, cell.row, cell.col);
        }
      }
    }

    if (this.appState === 'paused') {
      const resumeBtnX = CANVAS_WIDTH / 2 - 100;
      const resumeBtnY = 320;
      const btnWidth = 200;
      const btnHeight = 50;

      if (this.isPointInRect(x, y, resumeBtnX, resumeBtnY, btnWidth, btnHeight)) {
        this.appState = 'playing';
        this.gameState.isPaused = false;
      }

      const menuBtnX = CANVAS_WIDTH / 2 - 100;
      const menuBtnY = resumeBtnY + btnHeight + 20;

      if (this.isPointInRect(x, y, menuBtnX, menuBtnY, btnWidth, btnHeight)) {
        this.appState = 'menu';
      }
    }

    if (this.appState === 'gameover') {
      const btnX = CANVAS_WIDTH / 2 - 100;
      const btnY = 380;
      const btnWidth = 200;
      const btnHeight = 50;

      if (this.isPointInRect(x, y, btnX, btnY, btnWidth, btnHeight)) {
        this.appState = 'menu';
      }
    }

    if (this.appState === 'levelComplete') {
      const btnX = CANVAS_WIDTH / 2 - 100;
      const btnY = 320;
      const btnWidth = 200;
      const btnHeight = 50;

      if (this.isPointInRect(x, y, btnX, btnY, btnWidth, btnHeight)) {
        this.appState = 'playing';
        this.gameState.isPaused = false;
      }
    }
  }

  private onMouseUp(e: MouseEvent): void {
    if (this.appState === 'editor') {
      if (e.button === 0 && this.editorState.isSelecting) {
        if (this.editorState.dragStart && this.editorState.dragEnd) {
          const sameCell = this.editorState.dragStart.row === this.editorState.dragEnd.row &&
                           this.editorState.dragStart.col === this.editorState.dragEnd.col;
          if (sameCell) {
            this.editorState = fillCell(this.editorState, this.editorState.dragStart.row, this.editorState.dragStart.col);
            this.editorState = {
              ...this.editorState,
              isSelecting: false,
              dragStart: null,
              dragEnd: null
            };
          } else {
            this.editorState = fillSelection(this.editorState);
          }
        }
      }

      if (e.button === 2) {
        this.isRightClickDragging = false;
      }
    }
  }

  private isPointInRect(px: number, py: number, rx: number, ry: number, rw: number, rh: number): boolean {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
  }

  private startGame(level: number): void {
    this.gameState = createGameState(level);
    this.gameState.isPlaying = true;
    this.appState = 'playing';
  }

  private startCustomLevel(index: number): void {
    const levelData = this.customLevels[index];
    if (levelData) {
      this.gameState = createGameState(1);
      this.gameState.bricks = loadLevelBricks(levelData.grid);
      this.gameState.isPlaying = true;
      this.appState = 'playing';
    }
  }

  private showCustomLevels(): void {
    this.customLevels = getCustomLevels();
    this.updateCustomLevelItems();
    this.appState = 'customLevels';
  }

  private updateCustomLevelItems(): void {
    this.customLevelItems = [];
    const startY = 120;
    const itemHeight = 50;
    const gap = 10;

    for (let i = 0; i < this.customLevels.length; i++) {
      this.customLevelItems.push({
        index: i,
        name: this.customLevels[i].name,
        y: startY + i * (itemHeight + gap),
        height: itemHeight
      });
    }
  }

  private openEditor(): void {
    this.editorState = createEditorState();
    this.appState = 'editor';
  }

  private startLoop(): void {
    const loop = (timestamp: number) => {
      const deltaTime = timestamp - this.lastTime;
      this.lastTime = timestamp;

      this.update(deltaTime);
      this.render();

      this.animationId = requestAnimationFrame(loop);
    };

    this.animationId = requestAnimationFrame(loop);
  }

  private update(deltaTime: number): void {
    const dt = Math.min(deltaTime, 32);

    if (this.appState === 'playing') {
      this.gameState = updateGame(this.gameState, dt, this.input);

      if (this.gameState.isGameOver) {
        this.appState = 'gameover';
      } else if (this.gameState.isPaused) {
        this.appState = 'levelComplete';
      }
    }

    if (this.appState === 'editor') {
      this.editorState = updateEditor(this.editorState, dt);
    }
  }

  private render(): void {
    this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    switch (this.appState) {
      case 'menu':
        this.renderMenu();
        break;
      case 'playing':
      case 'paused':
      case 'gameover':
      case 'levelComplete':
        renderGame(this.ctx, this.gameState);
        if (this.appState === 'paused') {
          this.renderPauseScreen();
        }
        if (this.appState === 'gameover') {
          this.renderGameOverScreen();
        }
        if (this.appState === 'levelComplete') {
          this.renderLevelCompleteScreen();
        }
        break;
      case 'editor':
        renderEditor(this.ctx, this.editorState, this.hoveredCell);
        break;
      case 'customLevels':
        this.renderCustomLevelsScreen();
        break;
    }
  }

  private renderMenu(): void {
    const bgGradient = this.ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    bgGradient.addColorStop(0, '#1a1a2e');
    bgGradient.addColorStop(1, '#16213e');
    this.ctx.fillStyle = bgGradient;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 48px Orbitron, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('打砖块', CANVAS_WIDTH / 2, 120);

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.font = '16px Orbitron, sans-serif';
    this.ctx.fillText('BRICK BREAKER', CANVAS_WIDTH / 2, 150);

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.font = '14px Orbitron, sans-serif';
    this.ctx.fillText(`最高分: ${this.gameState.highScore}`, CANVAS_WIDTH / 2, 180);

    this.menuButtons.forEach(btn => {
      this.renderGlassButton(btn.x, btn.y, btn.width, btn.height, btn.text, btn.hover);
    });

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.font = '12px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('← → 或 A D 移动挡板 | 空格键 暂停', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
  }

  private renderGlassButton(x: number, y: number, w: number, h: number, text: string, hover: boolean): void {
    this.ctx.save();

    if (hover) {
      this.ctx.shadowColor = 'rgba(100, 200, 255, 0.5)';
      this.ctx.shadowBlur = 20;
      y -= 2;
    }

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    this.ctx.strokeStyle = hover ? 'rgba(100, 200, 255, 0.6)' : 'rgba(255, 255, 255, 0.15)';
    this.ctx.lineWidth = 1;

    this.roundRect(x, y, w, h, 12);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.fillStyle = hover ? '#a0d8ef' : '#ffffff';
    this.ctx.font = '18px Orbitron, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, x + w / 2, y + h / 2);

    this.ctx.restore();
  }

  private renderPauseScreen(): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 36px Orbitron, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('游戏暂停', CANVAS_WIDTH / 2, 280);

    const resumeBtnX = CANVAS_WIDTH / 2 - 100;
    const resumeBtnY = 320;
    const btnWidth = 200;
    const btnHeight = 50;

    const resumeHover = this.isPointInRect(this.mouseX, this.mouseY, resumeBtnX, resumeBtnY, btnWidth, btnHeight);
    this.renderGlassButton(resumeBtnX, resumeBtnY, btnWidth, btnHeight, '继续游戏', resumeHover);

    const menuBtnY = resumeBtnY + btnHeight + 20;
    const menuHover = this.isPointInRect(this.mouseX, this.mouseY, resumeBtnX, menuBtnY, btnWidth, btnHeight);
    this.renderGlassButton(resumeBtnX, menuBtnY, btnWidth, btnHeight, '返回主菜单', menuHover);
  }

  private renderGameOverScreen(): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.ctx.fillStyle = '#ff6b6b';
    this.ctx.font = 'bold 42px Orbitron, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('游戏结束', CANVAS_WIDTH / 2, 260);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '24px Orbitron, sans-serif';
    this.ctx.fillText(`最终得分: ${this.gameState.score}`, CANVAS_WIDTH / 2, 310);

    this.ctx.fillStyle = '#ffd32a';
    this.ctx.font = '18px Orbitron, sans-serif';
    this.ctx.fillText(`最高分: ${this.gameState.highScore}`, CANVAS_WIDTH / 2, 345);

    const btnX = CANVAS_WIDTH / 2 - 100;
    const btnY = 380;
    const btnWidth = 200;
    const btnHeight = 50;

    const hover = this.isPointInRect(this.mouseX, this.mouseY, btnX, btnY, btnWidth, btnHeight);
    this.renderGlassButton(btnX, btnY, btnWidth, btnHeight, '返回主菜单', hover);
  }

  private renderLevelCompleteScreen(): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.ctx.fillStyle = '#2ed573';
    this.ctx.font = 'bold 42px Orbitron, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('关卡完成!', CANVAS_WIDTH / 2, 260);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '22px Orbitron, sans-serif';
    this.ctx.fillText(`准备进入第 ${this.gameState.level} 关`, CANVAS_WIDTH / 2, 300);

    const btnX = CANVAS_WIDTH / 2 - 100;
    const btnY = 340;
    const btnWidth = 200;
    const btnHeight = 50;

    const hover = this.isPointInRect(this.mouseX, this.mouseY, btnX, btnY, btnWidth, btnHeight);
    this.renderGlassButton(btnX, btnY, btnWidth, btnHeight, '开始', hover);
  }

  private renderCustomLevelsScreen(): void {
    const bgGradient = this.ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    bgGradient.addColorStop(0, '#1a1a2e');
    bgGradient.addColorStop(1, '#16213e');
    this.ctx.fillStyle = bgGradient;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const backBtnX = 20;
    const backBtnY = 20;
    const backBtnWidth = 80;
    const backBtnHeight = 35;
    const backHover = this.isPointInRect(this.mouseX, this.mouseY, backBtnX, backBtnY, backBtnWidth, backBtnHeight);

    this.ctx.fillStyle = backHover ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.1)';
    this.roundRect(backBtnX, backBtnY, backBtnWidth, backBtnHeight, 8);
    this.ctx.fill();

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '12px Orbitron, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('返回', backBtnX + backBtnWidth / 2, backBtnY + 22);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 32px Orbitron, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('自定义关卡', CANVAS_WIDTH / 2, 70);

    if (this.customLevels.length === 0) {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      this.ctx.font = '18px sans-serif';
      this.ctx.fillText('暂无自定义关卡', CANVAS_WIDTH / 2, 200);
      this.ctx.fillText('去编辑器创建一个吧！', CANVAS_WIDTH / 2, 230);
    } else {
      const listX = 100;
      const listWidth = 600;

      this.customLevelItems.forEach(item => {
        const isHovered = this.hoveredLevelIndex === item.index;

        this.ctx.save();
        if (isHovered) {
          this.ctx.shadowColor = 'rgba(100, 200, 255, 0.4)';
          this.ctx.shadowBlur = 15;
        }

        this.ctx.fillStyle = isHovered ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.06)';
        this.roundRect(listX, item.y, listWidth, item.height, 10);
        this.ctx.fill();

        this.ctx.strokeStyle = isHovered ? 'rgba(100, 200, 255, 0.5)' : 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        this.roundRect(listX, item.y, listWidth, item.height, 10);
        this.ctx.stroke();

        this.ctx.restore();

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '16px Orbitron, sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(item.name, listX + 20, item.y + 32);

        const deleteBtnX = listX + listWidth - 50;
        const deleteBtnY = item.y + 10;
        const deleteBtnW = 30;
        const deleteBtnH = 30;

        this.ctx.fillStyle = 'rgba(255, 100, 100, 0.3)';
        this.roundRect(deleteBtnX, deleteBtnY, deleteBtnW, deleteBtnH, 6);
        this.ctx.fill();

        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.font = 'bold 16px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('×', deleteBtnX + deleteBtnW / 2, deleteBtnY + 21);
      });
    }
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y);
    this.ctx.lineTo(x + w - r, y);
    this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    this.ctx.lineTo(x + w, y + h - r);
    this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.ctx.lineTo(x + r, y + h);
    this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    this.ctx.lineTo(x, y + r);
    this.ctx.quadraticCurveTo(x, y, x + r, y);
    this.ctx.closePath();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
