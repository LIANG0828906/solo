import { createEngine, type Engine } from './renderer/engine';
import { animationQueue, easeInOutCubic, easeOutCubic } from './renderer/animation';
import {
  setMazeData,
  startGenerationAnimation,
  pauseGeneration,
  resumeGeneration,
  stopGenerationAnimation,
  getGenerationState,
  findPath,
  type MazeData,
  type Cell
} from './game/maze';
import {
  movePlayer,
  getPlayerPosition,
  resetPlayer,
  type PlayerState
} from './game/player';
import {
  saveMaze,
  loadMazeList,
  deleteMaze,
  type SavedMaze
} from './game/storage';
import styles from './styles/game.module.css';

const COLORS = {
  background: '#1a1a2e',
  wall: '#16213e',
  path: '#e0e0e0',
  goal: '#ffd700',
  goalDim: '#998000',
  player: '#ff6b9d',
  playerGlow: '#ff99c4',
  victoryStart: '#00ff88',
  victoryEnd: '#00cc66'
};

let engine: Engine;
let mazeData: MazeData | null = null;
let currentSize = 10;
let cellSize = 0;
let mazeOffsetX = 0;
let mazeOffsetY = 0;
let canvasWidth = 0;
let canvasHeight = 0;

let elapsedTime = 0;
let timerRunning = false;
let gameWon = false;

let victoryPath: Array<{ x: number; y: number }> = [];
let victoryHighlightCount = 0;
let victoryAnimating = false;

let fadeAlpha = 1;
let isFading = false;

const goalPos = { x: 0, y: 0 };

let timerEl: HTMLElement;
let stepsEl: HTMLElement;
let generateBtn: HTMLButtonElement;
let pauseBtn: HTMLButtonElement;
let resetBtn: HTMLButtonElement;
let saveBtn: HTMLButtonElement;
let loadBtn: HTMLButtonElement;
let sizeSlider: HTMLInputElement;
let sizeValue: HTMLElement;
let hamburger: HTMLElement;
let controlPanel: HTMLElement;
let loadModal: HTMLElement;
let closeModal: HTMLElement;
let mazeListEl: HTMLElement;
let victoryModal: HTMLElement;
let victoryTime: HTMLElement;
let victorySteps: HTMLElement;
let playAgainBtn: HTMLButtonElement;
let canvasWrapper: HTMLElement;
let difficultyButtons: HTMLButtonElement[] = [];

function init(): void {
  applyStylesToElements();

  timerEl = getEl('timer');
  stepsEl = getEl('steps');
  generateBtn = getEl<HTMLButtonElement>('generate-btn');
  pauseBtn = getEl<HTMLButtonElement>('pause-btn');
  resetBtn = getEl<HTMLButtonElement>('reset-btn');
  saveBtn = getEl<HTMLButtonElement>('save-btn');
  loadBtn = getEl<HTMLButtonElement>('load-btn');
  sizeSlider = getEl<HTMLInputElement>('size-slider');
  sizeValue = getEl('size-value');
  hamburger = getEl('hamburger');
  controlPanel = getEl('control-panel');
  loadModal = getEl('load-modal');
  closeModal = getEl('close-modal');
  mazeListEl = getEl('maze-list');
  victoryModal = getEl('victory-modal');
  victoryTime = getEl('victory-time');
  victorySteps = getEl('victory-steps');
  playAgainBtn = getEl<HTMLButtonElement>('play-again-btn');
  canvasWrapper = getEl('canvas-wrapper');

  difficultyButtons = [
    getEl<HTMLButtonElement>('diff-easy'),
    getEl<HTMLButtonElement>('diff-medium'),
    getEl<HTMLButtonElement>('diff-hard')
  ];

  addClass(difficultyButtons[0], styles.active);

  engine = createEngine('maze-canvas');
  resizeCanvas();

  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('keydown', handleKeyDown);

  generateBtn.addEventListener('click', handleGenerate);
  pauseBtn.addEventListener('click', handlePauseResume);
  resetBtn.addEventListener('click', handleResetPlayer);
  saveBtn.addEventListener('click', handleSave);
  loadBtn.addEventListener('click', handleLoad);
  sizeSlider.addEventListener('input', handleSizeChange);
  hamburger.addEventListener('click', toggleHamburger);
  closeModal.addEventListener('click', () => { loadModal.style.display = 'none'; });
  playAgainBtn.addEventListener('click', () => {
    victoryModal.style.display = 'none';
    handleGenerate();
  });

  for (const btn of difficultyButtons) {
    btn.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const size = parseInt(target.dataset.size || '10', 10);
      for (const b of difficultyButtons) removeClass(b, styles.active);
      addClass(target as HTMLElement, styles.active);
      currentSize = size;
      sizeSlider.value = String(size);
      sizeValue.textContent = `${size}×${size}`;
      handleGenerate();
    });
  }

  loadModal.addEventListener('click', (e) => {
    if (e.target === loadModal) {
      loadModal.style.display = 'none';
    }
  });

  engine.startLoop(render);
  generateNewMaze(currentSize, false);
}

function getEl<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id) as T | null;
  if (!el) throw new Error(`Element #${id} not found`);
  return el;
}

function addClass(el: HTMLElement, className: string): void {
  if (className && !el.classList.contains(className)) {
    el.classList.add(className);
  }
}

function removeClass(el: HTMLElement, className: string): void {
  if (className && el.classList.contains(className)) {
    el.classList.remove(className);
  }
}

function applyStylesToElements(): void {
  const map: Array<[string, string]> = [
    ['game-container', styles.gameContainer],
    ['top-bar', styles.topBar],
    ['stats', styles.stats],
    ['timer-wrapper', styles.timer],
    ['steps-wrapper', styles.steps],
    ['canvas-wrapper', styles.canvasWrapper],
    ['hamburger', styles.hamburger],
    ['control-panel', styles.controlPanel],
    ['control-group-1', styles.controlGroup],
    ['control-group-2', styles.controlGroup],
    ['control-group-3', styles.controlGroup],
    ['control-group-4', styles.controlGroup],
    ['difficulty-label', ''],
    ['size-label', ''],
    ['diff-easy', styles.difficultyBtn],
    ['diff-medium', styles.difficultyBtn],
    ['diff-hard', styles.difficultyBtn],
    ['generate-btn', styles.primaryBtn],
    ['pause-btn', styles.secondaryBtn],
    ['reset-btn', styles.secondaryBtn],
    ['save-btn', styles.secondaryBtn],
    ['load-btn', styles.secondaryBtn],
    ['size-value', ''],
    ['load-modal', styles.modal],
    ['modal-content', styles.modalContent],
    ['modal-header', styles.modalHeader],
    ['modal-title', ''],
    ['close-modal', styles.closeBtn],
    ['maze-list', styles.mazeList],
    ['victory-modal', styles.victoryModal],
    ['victory-content', styles.victoryContent],
    ['victory-title', ''],
    ['victory-stats', styles.victoryStats],
    ['victory-time-row', ''],
    ['victory-steps-row', ''],
    ['play-again-btn', styles.primaryBtn]
  ];

  for (const [id, className] of map) {
    const el = document.getElementById(id);
    if (el && className) {
      addClass(el, className);
    }
  }
}

function resizeCanvas(): void {
  if (!canvasWrapper) return;
  const rect = canvasWrapper.getBoundingClientRect();
  const maxWidth = rect.width;
  const maxHeight = rect.height;

  let w = maxWidth;
  let h = w * 9 / 16;
  if (h > maxHeight) {
    h = maxHeight;
    w = h * 16 / 9;
  }

  canvasWidth = Math.max(1, Math.floor(w));
  canvasHeight = Math.max(1, Math.floor(h));
  engine.resize(canvasWidth, canvasHeight);

  if (mazeData) {
    calculateCellSize();
  }
}

function calculateCellSize(): void {
  if (!mazeData) return;
  const size = mazeData.length;
  const maxMazeW = canvasWidth * 0.9;
  const maxMazeH = canvasHeight * 0.85;
  cellSize = Math.max(4, Math.floor(Math.min(maxMazeW / size, maxMazeH / size)));
  const mazePixelSize = cellSize * size;
  mazeOffsetX = (canvasWidth - mazePixelSize) / 2;
  mazeOffsetY = (canvasHeight - mazePixelSize) / 2;
}

function handleSizeChange(e: Event): void {
  const slider = e.target as HTMLInputElement;
  currentSize = parseInt(slider.value, 10);
  sizeValue.textContent = `${currentSize}×${currentSize}`;
  for (const b of difficultyButtons) removeClass(b, styles.active);
}

function handleGenerate(): void {
  if (isFading) return;
  generateNewMaze(currentSize, true);
}

function generateNewMaze(size: number, animate: boolean): void {
  stopGenerationAnimation();
  gameWon = false;
  victoryAnimating = false;
  victoryPath = [];
  victoryHighlightCount = 0;
  elapsedTime = 0;
  timerRunning = false;
  updateTimer();

  if (animate && mazeData) {
    doFadeTransition(() => {
      startMazeGeneration(size);
    });
  } else {
    startMazeGeneration(size);
  }
}

function doFadeTransition(callback: () => void): void {
  isFading = true;
  animationQueue.add({
    duration: 250,
    easing: easeInOutCubic,
    onUpdate: (v: number) => {
      fadeAlpha = 1 - v;
    },
    onComplete: () => {
      callback();
      animationQueue.add({
        duration: 250,
        easing: easeInOutCubic,
        onUpdate: (v: number) => {
          fadeAlpha = v;
        },
        onComplete: () => {
          fadeAlpha = 1;
          isFading = false;
        }
      });
    }
  });
}

function startMazeGeneration(size: number): void {
  pauseBtn.disabled = false;
  pauseBtn.textContent = '⏸ 暂停';

  goalPos.x = size - 1;
  goalPos.y = size - 1;

  startGenerationAnimation(size, (maze, state) => {
    mazeData = maze;
    calculateCellSize();

    if (!state.isGenerating) {
      pauseBtn.disabled = true;
      pauseBtn.textContent = '⏸ 暂停';
      resetPlayerPosition();
    }
  }, 50);
}

function resetPlayerPosition(): void {
  if (!mazeData) return;
  resetPlayer(0, 0, cellSize);
  elapsedTime = 0;
  timerRunning = true;
  gameWon = false;
  victoryPath = [];
  victoryHighlightCount = 0;
  victoryAnimating = false;
  updateSteps();
}

function handlePauseResume(): void {
  const state = getGenerationState();
  if (!state.isGenerating) return;

  if (state.isPaused) {
    resumeGeneration();
    pauseBtn.textContent = '⏸ 暂停';
  } else {
    pauseGeneration();
    pauseBtn.textContent = '▶ 继续';
  }
}

function handleResetPlayer(): void {
  if (!mazeData || getGenerationState().isGenerating) return;
  resetPlayerPosition();
}

function handleKeyDown(e: KeyboardEvent): void {
  if (!mazeData || gameWon || getGenerationState().isGenerating) return;

  let direction: 'up' | 'down' | 'left' | 'right' | null = null;

  switch (e.key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      direction = 'up';
      break;
    case 'ArrowDown':
    case 's':
    case 'S':
      direction = 'down';
      break;
    case 'ArrowLeft':
    case 'a':
    case 'A':
      direction = 'left';
      break;
    case 'ArrowRight':
    case 'd':
    case 'D':
      direction = 'right';
      break;
  }

  if (direction) {
    e.preventDefault();
    const moved = movePlayer(direction, mazeData, cellSize);
    if (moved) {
      updateSteps();
      checkWin();
    }
  }
}

function checkWin(): void {
  const pos: PlayerState = getPlayerPosition();
  if (pos.gridX === goalPos.x && pos.gridY === goalPos.y && !pos.isMoving) {
    triggerVictory();
  }
}

function triggerVictory(): void {
  if (gameWon || !mazeData) return;
  gameWon = true;
  timerRunning = false;

  victoryPath = findPath(mazeData, { x: 0, y: 0 }, goalPos);
  victoryHighlightCount = 0;
  victoryAnimating = true;

  const anims = victoryPath.map((_, idx) => ({
    duration: 100,
    easing: easeOutCubic as (t: number) => number,
    onUpdate: () => {
      victoryHighlightCount = idx + 1;
    },
    onComplete: idx === victoryPath.length - 1 ? () => {
      victoryAnimating = false;
      showVictoryModal();
    } : undefined
  }));

  animationQueue.chain(anims);
}

function showVictoryModal(): void {
  victoryTime.textContent = formatTime(elapsedTime);
  victorySteps.textContent = String(getPlayerPosition().steps);
  victoryModal.style.display = 'flex';
}

function handleSave(): void {
  if (!mazeData || getGenerationState().isGenerating) return;
  const name = prompt(`输入迷宫名称 (当前尺寸: ${mazeData.length}×${mazeData.length})`, `迷宫 ${new Date().toLocaleString('zh-CN')}`);
  if (!name) return;

  const result = saveMaze(name, mazeData);
  if (result) {
    alert('迷宫保存成功！');
  } else {
    alert('保存失败：最多只能保存5个迷宫，请先删除一些。');
  }
}

function handleLoad(): void {
  renderMazeList();
  loadModal.style.display = 'flex';
}

function renderMazeList(): void {
  const list: SavedMaze[] = loadMazeList();
  mazeListEl.innerHTML = '';

  if (list.length === 0) {
    const empty = document.createElement('div');
    addClass(empty, styles.emptyList);
    empty.textContent = '暂无保存的迷宫';
    mazeListEl.appendChild(empty);
    return;
  }

  for (const saved of list) {
    const item = document.createElement('div');
    addClass(item, styles.mazeItem);

    const delBtn = document.createElement('button');
    addClass(delBtn, styles.deleteMazeBtn);
    delBtn.innerHTML = '🗑';
    delBtn.title = '删除';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`确定要删除"${saved.name}"吗？`)) {
        deleteMaze(saved.id);
        renderMazeList();
      }
    });

    const img = document.createElement('img');
    addClass(img, styles.mazeThumbnail);
    img.src = saved.thumbnail;
    img.alt = saved.name;

    const info = document.createElement('div');
    addClass(info, styles.mazeInfo);
    const nameEl = document.createElement('div');
    addClass(nameEl, styles.mazeName);
    nameEl.textContent = saved.name;
    const metaEl = document.createElement('div');
    addClass(metaEl, styles.mazeMeta);
    metaEl.textContent = `${saved.size}×${saved.size}`;
    info.appendChild(nameEl);
    info.appendChild(metaEl);

    item.appendChild(delBtn);
    item.appendChild(img);
    item.appendChild(info);

    item.addEventListener('click', () => {
      loadSavedMaze(saved);
    });

    mazeListEl.appendChild(item);
  }
}

function loadSavedMaze(saved: SavedMaze): void {
  loadModal.style.display = 'none';

  if (isFading) return;

  const doLoad = () => {
    mazeData = saved.data;
    setMazeData(saved.data);
    currentSize = saved.size;
    sizeSlider.value = String(saved.size);
    sizeValue.textContent = `${saved.size}×${saved.size}`;
    goalPos.x = saved.size - 1;
    goalPos.y = saved.size - 1;
    calculateCellSize();
    resetPlayerPosition();

    for (const b of difficultyButtons) removeClass(b, styles.active);
  };

  if (mazeData) {
    doFadeTransition(doLoad);
  } else {
    doLoad();
  }
}

function toggleHamburger(): void {
  if (hamburger.classList.contains(styles.active)) {
    removeClass(hamburger, styles.active);
    removeClass(controlPanel, styles.open);
  } else {
    addClass(hamburger, styles.active);
    addClass(controlPanel, styles.open);
  }
}

function updateTimer(): void {
  timerEl.textContent = formatTime(elapsedTime);
}

function updateSteps(): void {
  stepsEl.textContent = String(getPlayerPosition().steps);
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function render(dt: number): void {
  const ctx = engine.getContext();

  if (timerRunning && !gameWon) {
    elapsedTime += dt;
    updateTimer();
  }

  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  ctx.save();
  ctx.globalAlpha = fadeAlpha;

  if (mazeData) {
    drawMaze(ctx);
    drawVictoryPath(ctx);
    drawGoal(ctx);
    drawPlayer(ctx);
  }

  ctx.restore();
}

function drawMaze(ctx: CanvasRenderingContext2D): void {
  if (!mazeData) return;
  const size = mazeData.length;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cell: Cell = mazeData[y][x];
      const px = mazeOffsetX + x * cellSize;
      const py = mazeOffsetY + y * cellSize;

      if (cell.generated) {
        ctx.fillStyle = COLORS.path;
        ctx.fillRect(px, py, cellSize, cellSize);
      } else {
        ctx.fillStyle = COLORS.wall;
        ctx.fillRect(px, py, cellSize, cellSize);
      }
    }
  }

  ctx.strokeStyle = COLORS.wall;
  ctx.lineWidth = Math.max(2, cellSize * 0.08);
  ctx.lineCap = 'square';

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cell: Cell = mazeData[y][x];
      if (!cell.generated) continue;

      const px = mazeOffsetX + x * cellSize;
      const py = mazeOffsetY + y * cellSize;

      if (cell.walls.top) {
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + cellSize, py);
        ctx.stroke();
      }
      if (cell.walls.left) {
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px, py + cellSize);
        ctx.stroke();
      }
      if (cell.walls.right) {
        ctx.beginPath();
        ctx.moveTo(px + cellSize, py);
        ctx.lineTo(px + cellSize, py + cellSize);
        ctx.stroke();
      }
      if (cell.walls.bottom) {
        ctx.beginPath();
        ctx.moveTo(px, py + cellSize);
        ctx.lineTo(px + cellSize, py + cellSize);
        ctx.stroke();
      }
    }
  }
}

function drawVictoryPath(ctx: CanvasRenderingContext2D): void {
  if (!mazeData || victoryPath.length === 0 || victoryHighlightCount === 0) return;

  for (let i = 0; i < victoryHighlightCount && i < victoryPath.length; i++) {
    const node = victoryPath[i];
    const px = mazeOffsetX + node.x * cellSize;
    const py = mazeOffsetY + node.y * cellSize;

    const gradient = ctx.createLinearGradient(px, py, px + cellSize, py + cellSize);
    gradient.addColorStop(0, COLORS.victoryStart);
    gradient.addColorStop(1, COLORS.victoryEnd);

    const padding = cellSize * 0.15;
    ctx.fillStyle = gradient;
    ctx.fillRect(px + padding, py + padding, cellSize - padding * 2, cellSize - padding * 2);
  }
}

function drawGoal(ctx: CanvasRenderingContext2D): void {
  if (!mazeData) return;
  const px = mazeOffsetX + goalPos.x * cellSize;
  const py = mazeOffsetY + goalPos.y * cellSize;
  const t = (Date.now() / 1000) % 1.5 / 1.5;
  const pulse = 0.5 + 0.5 * Math.sin(t * Math.PI * 2);

  const padding = cellSize * 0.2;
  const goalSize = cellSize - padding * 2;

  ctx.save();
  ctx.shadowColor = COLORS.goal;
  ctx.shadowBlur = 10 + pulse * 15;

  ctx.fillStyle = COLORS.goal;
  const cx = px + cellSize / 2;
  const cy = py + cellSize / 2;
  const r = goalSize / 2 * (0.85 + pulse * 0.15);

  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const outerX = cx + Math.cos(angle) * r;
    const outerY = cy + Math.sin(angle) * r;
    const innerAngle = angle + Math.PI / 5;
    const innerX = cx + Math.cos(innerAngle) * (r * 0.4);
    const innerY = cy + Math.sin(innerAngle) * (r * 0.4);
    if (i === 0) ctx.moveTo(outerX, outerY);
    else ctx.lineTo(outerX, outerY);
    ctx.lineTo(innerX, innerY);
  }
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawPlayer(ctx: CanvasRenderingContext2D): void {
  const pos: PlayerState = getPlayerPosition();
  const px = mazeOffsetX + pos.x;
  const py = mazeOffsetY + pos.y;
  const r = cellSize * 0.32;

  ctx.save();
  ctx.shadowColor = COLORS.playerGlow;
  ctx.shadowBlur = 12;

  const gradient = ctx.createRadialGradient(px - r * 0.3, py - r * 0.3, 0, px, py, r);
  gradient.addColorStop(0, '#ffffff');
  gradient.addColorStop(0.3, COLORS.playerGlow);
  gradient.addColorStop(1, COLORS.player);

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(px, py, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

document.addEventListener('DOMContentLoaded', init);
