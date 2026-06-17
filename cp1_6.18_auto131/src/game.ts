import { Ball, Baffle, TrailPoint, GAME_CONFIG, COLORS, GameState, EditorState } from './types';
import { physicsEngine } from './engine/physicsEngine';
import { levelEditor } from './editor/levelEditor';
import { levelStore } from './stores/levelStore';

class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private ball: Ball;
  private trail: TrailPoint[] = [];
  private animationId: number = 0;
  private lastTime: number = 0;
  private gameState: GameState;
  private editorState: EditorState;
  private contextMenuElement: HTMLElement | null = null;
  private isEditMode: boolean = true;
  private pulseTime: number = 0;
  private arrowTime: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    
    this.canvas.width = GAME_CONFIG.CANVAS_WIDTH;
    this.canvas.height = GAME_CONFIG.CANVAS_HEIGHT;

    const level = levelStore.getCurrentLevel();
    this.ball = physicsEngine.createBall(level.ballStart);
    levelEditor.setBaffles(level.baffles);

    this.gameState = {
      isPlaying: false,
      isPaused: false,
      isComplete: false,
      isEditMode: true,
      elapsedTime: 0,
      bounceCount: 0,
      currentLevelIndex: levelStore.getCurrentLevelIndex(),
    };

    this.editorState = {
      selectedBaffleId: null,
      isDragging: false,
      dragOffset: { x: 0, y: 0 },
      contextMenu: {
        visible: false,
        x: 0,
        y: 0,
        baffleId: null,
      },
    };

    this.setupEventListeners();
    this.createContextMenu();
    this.updateLevelUI();
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('dblclick', this.handleDoubleClick.bind(this));
    this.canvas.addEventListener('contextmenu', this.handleContextMenu.bind(this));
    
    document.addEventListener('click', this.handleDocumentClick.bind(this));
    document.addEventListener('keydown', this.handleKeyDown.bind(this));

    window.addEventListener('resize', this.handleResize.bind(this));
  }

  private createContextMenu(): void {
    const menu = document.createElement('div');
    menu.id = 'context-menu';
    menu.style.cssText = `
      position: fixed;
      display: none;
      background: #2D2D44;
      border: 1px solid #3D3D5C;
      border-radius: 6px;
      padding: 4px 0;
      z-index: 100;
      min-width: 100px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    `;
    
    const deleteItem = document.createElement('div');
    deleteItem.textContent = '删除挡板';
    deleteItem.style.cssText = `
      padding: 8px 16px;
      cursor: pointer;
      color: white;
      font-size: 14px;
      font-family: sans-serif;
    `;
    deleteItem.addEventListener('mouseenter', () => {
      deleteItem.style.background = '#6C63FF';
    });
    deleteItem.addEventListener('mouseleave', () => {
      deleteItem.style.background = 'transparent';
    });
    deleteItem.addEventListener('click', () => {
      this.deleteSelectedBaffle();
    });
    
    menu.appendChild(deleteItem);
    document.body.appendChild(menu);
    this.contextMenuElement = menu;
  }

  private hideContextMenu(): void {
    if (this.contextMenuElement) {
      this.contextMenuElement.style.display = 'none';
    }
    this.editorState.contextMenu.visible = false;
  }

  private showContextMenu(x: number, y: number, baffleId: string): void {
    if (this.contextMenuElement) {
      this.contextMenuElement.style.left = x + 'px';
      this.contextMenuElement.style.top = y + 'px';
      this.contextMenuElement.style.display = 'block';
    }
    this.editorState.contextMenu = {
      visible: true,
      x,
      y,
      baffleId,
    };
  }

  private deleteSelectedBaffle(): void {
    if (this.editorState.contextMenu.baffleId) {
      levelEditor.deleteBaffle(this.editorState.contextMenu.baffleId);
      levelStore.updateBaffles(levelEditor.getBaffles());
    }
    this.hideContextMenu();
  }

  private getMousePos(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  private handleMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return;
    
    const pos = this.getMousePos(e);
    const baffle = levelEditor.getBaffleAt(pos.x, pos.y);

    if (baffle && !baffle.isWall) {
      levelEditor.startDrag(pos.x, pos.y, baffle.id);
      this.editorState.isDragging = true;
      this.editorState.selectedBaffleId = baffle.id;
    } else if (this.isEditMode && !baffle) {
      if (levelEditor.canAddBaffle()) {
        levelEditor.addBaffle(pos.x, pos.y);
        levelStore.updateBaffles(levelEditor.getBaffles());
      }
    }
    
    this.hideContextMenu();
  }

  private handleMouseMove(e: MouseEvent): void {
    const pos = this.getMousePos(e);
    
    if (this.editorState.isDragging) {
      levelEditor.drag(pos.x, pos.y);
    }
  }

  private handleMouseUp(): void {
    if (this.editorState.isDragging) {
      levelEditor.endDrag();
      this.editorState.isDragging = false;
      levelStore.updateBaffles(levelEditor.getBaffles());
    }
  }

  private handleDoubleClick(e: MouseEvent): void {
    const pos = this.getMousePos(e);
    const baffle = levelEditor.getBaffleAt(pos.x, pos.y);
    
    if (baffle && !baffle.isWall) {
      levelEditor.toggleBaffleOrientation(baffle.id);
      levelStore.updateBaffles(levelEditor.getBaffles());
    }
  }

  private handleContextMenu(e: MouseEvent): void {
    e.preventDefault();
    
    const pos = this.getMousePos(e);
    const baffle = levelEditor.getBaffleAt(pos.x, pos.y);
    
    if (baffle && !baffle.isWall) {
      this.showContextMenu(e.clientX, e.clientY, baffle.id);
      this.editorState.selectedBaffleId = baffle.id;
    } else {
      this.hideContextMenu();
    }
  }

  private handleDocumentClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (this.contextMenuElement && !this.contextMenuElement.contains(target)) {
      this.hideContextMenu();
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (this.editorState.selectedBaffleId) {
        levelEditor.deleteBaffle(this.editorState.selectedBaffleId);
        levelStore.updateBaffles(levelEditor.getBaffles());
        this.editorState.selectedBaffleId = null;
      }
    }
    if (e.key === ' ') {
      e.preventDefault();
      this.togglePlay();
    }
    if (e.key === 'r' || e.key === 'R') {
      this.resetBall();
    }
  }

  private handleResize(): void {
    this.updateCanvasScale();
  }

  private updateCanvasScale(): void {
    const container = this.canvas.parentElement;
    if (!container) return;

    const maxWidth = Math.min(window.innerWidth - 40, GAME_CONFIG.CANVAS_WIDTH);
    const scale = maxWidth / GAME_CONFIG.CANVAS_WIDTH;
    
    if (window.innerWidth < 1024) {
      this.canvas.style.width = (GAME_CONFIG.CANVAS_WIDTH * scale) + 'px';
      this.canvas.style.height = (GAME_CONFIG.CANVAS_HEIGHT * scale) + 'px';
    } else {
      this.canvas.style.width = GAME_CONFIG.CANVAS_WIDTH + 'px';
      this.canvas.style.height = GAME_CONFIG.CANVAS_HEIGHT + 'px';
    }
  }

  start(): void {
    this.lastTime = performance.now();
    this.gameLoop();
    this.updateCanvasScale();
  }

  stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  private gameLoop = (): void => {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.pulseTime += deltaTime;
    this.arrowTime += deltaTime;

    if (!this.gameState.isPaused && !this.gameState.isComplete) {
      if (this.gameState.isPlaying) {
        this.gameState.elapsedTime += deltaTime;
      }

      for (let i = 0; i < GAME_CONFIG.PHYSICS_STEPS_PER_FRAME; i++) {
        if (this.gameState.isPlaying) {
          this.updatePhysics();
        }
      }
    }

    this.updateTrail();
    this.render();

    this.animationId = requestAnimationFrame(this.gameLoop);
  };

  private updatePhysics(): void {
    const level = levelStore.getCurrentLevel();
    const allBaffles = [...level.walls, ...levelEditor.getBaffles()];
    
    const result = physicsEngine.update(this.ball, allBaffles, level.hole);
    
    if (result.bounced) {
      this.gameState.bounceCount++;
    }
    
    if (result.inHole) {
      this.completeLevel();
    }
  }

  private updateTrail(): void {
    this.trail.unshift({
      x: this.ball.x,
      y: this.ball.y,
      alpha: GAME_CONFIG.TRAIL_MAX_ALPHA,
    });

    if (this.trail.length > GAME_CONFIG.TRAIL_LENGTH) {
      this.trail.pop();
    }

    for (let i = 0; i < this.trail.length; i++) {
      const t = i / (GAME_CONFIG.TRAIL_LENGTH - 1);
      this.trail[i].alpha = GAME_CONFIG.TRAIL_MAX_ALPHA - 
        (GAME_CONFIG.TRAIL_MAX_ALPHA - GAME_CONFIG.TRAIL_MIN_ALPHA) * t;
    }
  }

  private render(): void {
    const ctx = this.ctx;
    const level = levelStore.getCurrentLevel();

    ctx.fillStyle = COLORS.BACKGROUND;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.isEditMode) {
      this.drawGrid();
    }

    this.drawWalls(level.walls);
    this.drawBaffles(levelEditor.getBaffles());
    this.drawHole(level.hole);
    this.drawStartArrow(level.ballStart);
    this.drawTrail();
    this.drawBall();
    this.drawHUD();
  }

  private drawGrid(): void {
    const ctx = this.ctx;
    ctx.strokeStyle = 'rgba(224, 224, 224, 0.1)';
    ctx.lineWidth = 1;

    for (let x = 0; x <= this.canvas.width; x += GAME_CONFIG.GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvas.height);
      ctx.stroke();
    }

    for (let y = 0; y <= this.canvas.height; y += GAME_CONFIG.GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.canvas.width, y);
      ctx.stroke();
    }
  }

  private drawWalls(walls: Baffle[]): void {
    for (const wall of walls) {
      this.drawRoundedRect(
        wall.x,
        wall.y,
        wall.orientation === 'horizontal' ? wall.length : wall.width,
        wall.orientation === 'horizontal' ? wall.width : wall.length,
        2,
        COLORS.WALL_FILL,
        COLORS.WALL_STROKE
      );
    }
  }

  private drawBaffles(baffles: Baffle[]): void {
    const ctx = this.ctx;
    const selectedId = levelEditor.getSelectedBaffleId();
    const isDragging = levelEditor.getIsDragging();

    for (const baffle of baffles) {
      const isSelected = baffle.id === selectedId;
      const scale = isSelected && isDragging ? 1.1 : 1;
      
      const w = baffle.orientation === 'horizontal' ? baffle.length : baffle.width;
      const h = baffle.orientation === 'horizontal' ? baffle.width : baffle.length;
      
      const cx = baffle.x + w / 2;
      const cy = baffle.y + h / 2;
      const scaledW = w * scale;
      const scaledH = h * scale;
      const x = cx - scaledW / 2;
      const y = cy - scaledH / 2;

      const color = isSelected ? COLORS.BAFFLE_HIGHLIGHT : baffle.color;

      ctx.save();
      ctx.shadowColor = isSelected ? 'rgba(255, 215, 0, 0.5)' : 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = isSelected ? 10 : 4;
      
      this.drawRoundedRect(
        x, y, scaledW, scaledH,
        GAME_CONFIG.BAFFLE_CORNER_RADIUS,
        color,
        isSelected ? '#B8860B' : color
      );
      
      ctx.restore();
    }
  }

  private drawRoundedRect(
    x: number, y: number, w: number, h: number, r: number,
    fillColor: string, strokeColor: string
  ): void {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  private drawHole(hole: { x: number; y: number; radius: number }): void {
    const ctx = this.ctx;
    const pulsePhase = (this.pulseTime % 1200) / 1200;
    const pulseRadius = hole.radius + 8 * Math.sin(pulsePhase * Math.PI * 2) + 8;
    const pulseAlpha = 0.2 + 0.6 * (1 - Math.abs(pulsePhase - 0.5) * 2);

    const gradient = ctx.createRadialGradient(
      hole.x, hole.y, 0,
      hole.x, hole.y, pulseRadius
    );
    gradient.addColorStop(0, `rgba(255, 215, 0, ${pulseAlpha})`);
    gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
    
    ctx.beginPath();
    ctx.arc(hole.x, hole.y, pulseRadius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    const innerGradient = ctx.createRadialGradient(
      hole.x, hole.y, 0,
      hole.x, hole.y, hole.radius
    );
    innerGradient.addColorStop(0, 'rgba(255, 215, 0, 0.6)');
    innerGradient.addColorStop(1, 'rgba(255, 215, 0, 0.1)');
    
    ctx.beginPath();
    ctx.arc(hole.x, hole.y, hole.radius, 0, Math.PI * 2);
    ctx.fillStyle = innerGradient;
    ctx.fill();
    
    ctx.strokeStyle = COLORS.HOLE_BORDER;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  private drawStartArrow(startPos: { x: number; y: number }): void {
    const ctx = this.ctx;
    const arrowPhase = (this.arrowTime % 1000) / 1000;
    const arrowOffset = 10 * Math.sin(arrowPhase * Math.PI * 2);

    ctx.save();
    ctx.fillStyle = COLORS.ARROW_TIP;
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = COLORS.ARROW_TIP;
    ctx.shadowBlur = 10;
    
    ctx.fillText('▼', startPos.x, startPos.y - 25 + arrowOffset);
    
    ctx.restore();
  }

  private drawTrail(): void {
    const ctx = this.ctx;
    
    for (let i = this.trail.length - 1; i >= 0; i--) {
      const point = this.trail[i];
      const size = this.ball.radius * (1 - i / this.trail.length * 0.5);
      
      ctx.beginPath();
      ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 107, 107, ${point.alpha})`;
      ctx.fill();
    }
  }

  private drawBall(): void {
    const ctx = this.ctx;
    
    ctx.save();
    ctx.shadowColor = this.ball.shadowColor;
    ctx.shadowBlur = 2;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    ctx.beginPath();
    ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.ball.color;
    ctx.fill();
    
    ctx.restore();

    const highlightGradient = ctx.createRadialGradient(
      this.ball.x - this.ball.radius * 0.3,
      this.ball.y - this.ball.radius * 0.3,
      0,
      this.ball.x,
      this.ball.y,
      this.ball.radius
    );
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.beginPath();
    ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = highlightGradient;
    ctx.fill();
  }

  private drawHUD(): void {
    const ctx = this.ctx;
    
    const minutes = Math.floor(this.gameState.elapsedTime / 60000);
    const seconds = Math.floor((this.gameState.elapsedTime % 60000) / 1000);
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    ctx.font = '16px monospace';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(timeStr, 35, 35);

    const ballIconX = 35;
    const ballIconY = 65;
    ctx.beginPath();
    ctx.arc(ballIconX, ballIconY, 6, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.BALL_FILL;
    ctx.fill();
    
    ctx.font = '16px monospace';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`× ${this.gameState.bounceCount}`, 50, ballIconY);
  }

  togglePlay(): void {
    if (this.gameState.isComplete) return;
    
    this.gameState.isPlaying = !this.gameState.isPlaying;
    this.isEditMode = !this.gameState.isPlaying;
    
    if (this.gameState.isPlaying) {
      this.editorState.selectedBaffleId = null;
      levelEditor.clearSelection();
    }
  }

  resetBall(): void {
    const level = levelStore.getCurrentLevel();
    physicsEngine.resetBall(this.ball, level.ballStart);
    this.trail = [];
    this.gameState.elapsedTime = 0;
    this.gameState.bounceCount = 0;
    this.gameState.isComplete = false;
    this.gameState.isPlaying = false;
    this.isEditMode = true;
    this.hideCompleteOverlay();
  }

  private completeLevel(): void {
    this.gameState.isComplete = true;
    this.gameState.isPlaying = false;
    
    const timeSeconds = this.gameState.elapsedTime / 1000;
    levelStore.updateBestScore(timeSeconds, this.gameState.bounceCount);
    levelStore.saveCurrentLevel();
    
    this.showCompleteOverlay();
    this.updateLevelUI();
  }

  private showCompleteOverlay(): void {
    let overlay = document.getElementById('complete-overlay');
    if (overlay) {
      overlay.style.display = 'flex';
      return;
    }

    overlay = document.createElement('div');
    overlay.id = 'complete-overlay';
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 10;
      border-radius: 8px;
    `;

    const title = document.createElement('div');
    title.textContent = '恭喜通关！';
    title.style.cssText = `
      font-size: 36px;
      font-family: sans-serif;
      color: white;
      text-shadow: 0 0 20px #FFD700;
      margin-bottom: 30px;
    `;

    const stats = document.createElement('div');
    const minutes = Math.floor(this.gameState.elapsedTime / 60000);
    const seconds = Math.floor((this.gameState.elapsedTime % 60000) / 1000);
    stats.innerHTML = `用时: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}<br>弹射次数: ${this.gameState.bounceCount}`;
    stats.style.cssText = `
      font-size: 18px;
      font-family: sans-serif;
      color: #FFD700;
      text-align: center;
      margin-bottom: 30px;
      line-height: 1.6;
    `;

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: 20px;
    `;

    const nextBtn = document.createElement('button');
    nextBtn.textContent = '下一关';
    nextBtn.style.cssText = `
      padding: 12px 30px;
      background: #6C63FF;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-family: sans-serif;
      cursor: pointer;
      transition: filter 0.2s;
    `;
    nextBtn.addEventListener('mouseenter', () => {
      nextBtn.style.filter = 'brightness(1.1)';
    });
    nextBtn.addEventListener('mouseleave', () => {
      nextBtn.style.filter = 'brightness(1)';
    });
    nextBtn.addEventListener('click', () => {
      this.nextLevel();
    });

    const restartBtn = document.createElement('button');
    restartBtn.textContent = '重新开始';
    restartBtn.style.cssText = `
      padding: 12px 30px;
      background: #FF6B6B;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-family: sans-serif;
      cursor: pointer;
      transition: filter 0.2s;
    `;
    restartBtn.addEventListener('mouseenter', () => {
      restartBtn.style.filter = 'brightness(1.1)';
    });
    restartBtn.addEventListener('mouseleave', () => {
      restartBtn.style.filter = 'brightness(1)';
    });
    restartBtn.addEventListener('click', () => {
      this.resetBall();
    });

    buttonContainer.appendChild(nextBtn);
    buttonContainer.appendChild(restartBtn);
    overlay.appendChild(title);
    overlay.appendChild(stats);
    overlay.appendChild(buttonContainer);

    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
      gameContainer.appendChild(overlay);
    }
  }

  private hideCompleteOverlay(): void {
    const overlay = document.getElementById('complete-overlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
  }

  nextLevel(): void {
    if (levelStore.goToNextLevel()) {
      this.loadLevel(levelStore.getCurrentLevelIndex());
    }
  }

  loadLevel(index: number): void {
    levelStore.setCurrentLevelIndex(index);
    const level = levelStore.getCurrentLevel();
    
    physicsEngine.resetBall(this.ball, level.ballStart);
    levelEditor.setBaffles(level.baffles);
    
    this.trail = [];
    this.gameState.elapsedTime = 0;
    this.gameState.bounceCount = 0;
    this.gameState.isComplete = false;
    this.gameState.isPlaying = false;
    this.gameState.currentLevelIndex = index;
    this.isEditMode = true;
    this.editorState.selectedBaffleId = null;
    
    this.hideCompleteOverlay();
    this.updateLevelUI();
  }

  private updateLevelUI(): void {
    const levelBar = document.getElementById('level-bar');
    if (!levelBar) return;

    const levels = levelStore.getLevels();
    const currentIndex = levelStore.getCurrentLevelIndex();
    
    levelBar.innerHTML = '';
    
    levels.forEach((level, index) => {
      const levelBtn = document.createElement('div');
      levelBtn.className = 'level-item';
      levelBtn.dataset.index = index.toString();
      
      const isSelected = index === currentIndex;
      levelBtn.style.cssText = `
        width: 100px;
        height: 36px;
        background: ${isSelected ? COLORS.LEVEL_BAR_SELECTED : COLORS.LEVEL_BAR_BG};
        color: white;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-family: sans-serif;
        font-size: 14px;
        transition: background 0.2s;
        position: relative;
      `;
      
      levelBtn.textContent = level.name;
      
      if (level.bestTime !== undefined) {
        const bestBadge = document.createElement('span');
        const mins = Math.floor(level.bestTime / 60);
        const secs = Math.floor(level.bestTime % 60);
        bestBadge.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        bestBadge.style.cssText = `
          font-size: 10px;
          color: #FFD700;
          margin-top: 2px;
        `;
        levelBtn.appendChild(bestBadge);
        levelBtn.style.height = '48px';
      }
      
      levelBtn.addEventListener('mouseenter', () => {
        if (!isSelected) {
          levelBtn.style.background = '#3D3D5C';
        }
      });
      levelBtn.addEventListener('mouseleave', () => {
        if (!isSelected) {
          levelBtn.style.background = COLORS.LEVEL_BAR_BG;
        }
      });
      
      levelBtn.addEventListener('click', () => {
        this.loadLevel(index);
      });
      
      levelBar.appendChild(levelBtn);
    });
  }

  saveLevel(): void {
    levelStore.updateBaffles(levelEditor.getBaffles());
    levelStore.saveCurrentLevel();
    this.showSaveToast();
  }

  private showSaveToast(): void {
    let toast = document.getElementById('save-toast');
    if (toast) {
      toast.style.opacity = '1';
      setTimeout(() => {
        if (toast) toast.style.opacity = '0';
      }, 1500);
      return;
    }

    toast = document.createElement('div');
    toast.id = 'save-toast';
    toast.textContent = '关卡已保存';
    toast.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 10px 20px;
      border-radius: 6px;
      font-family: sans-serif;
      font-size: 14px;
      opacity: 0;
      transition: opacity 0.3s;
      z-index: 50;
      pointer-events: none;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      if (toast) toast.style.opacity = '1';
    }, 10);
    
    setTimeout(() => {
      if (toast) toast.style.opacity = '0';
    }, 1500);
  }

  getIsEditMode(): boolean {
    return this.isEditMode;
  }
}

let game: Game | null = null;

function initGame(): void {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (canvas && !game) {
    game = new Game(canvas);
    game.start();

    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        game?.saveLevel();
      });
    }

    const playBtn = document.getElementById('play-btn');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        game?.togglePlay();
        updatePlayButton();
      });
    }

    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        game?.resetBall();
        updatePlayButton();
      });
    }
  }
}

function updatePlayButton(): void {
  const playBtn = document.getElementById('play-btn');
  if (playBtn && game) {
    playBtn.textContent = game.getIsEditMode() ? '▶ 开始' : '⏸ 暂停';
  }
}

document.addEventListener('DOMContentLoaded', initGame);

export { Game, game };
